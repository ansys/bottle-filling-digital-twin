# Copyright (C) 2025 ANSYS, Inc. and/or its affiliates.
# SPDX-License-Identifier: MIT
#
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

import carb
import omni.usd
import omni.kit.commands
import omni.timeline
import numpy
from .utils import sanitize_path, populate_stage
from omni.kit.async_engine import run_coroutine

from pxr import Sdf, Tf
from pxr import UsdGeom

from ansys.fluent.core.services.field_data import SurfaceDataType
from ansys.fluent.core import SolverEvent

FLUENT_TO_OMNIVERSE_SCALE = 100
FLUENT_TO_OMNIVERSE_ROTATION_X = 90
FLUENT_FIELD_TOKEN = "ansys:fluent:surface_name"
BYPASS_VOLUME_MESH = True
TIMECODE_MULTIPLIER = 1 / 60.0
GENERATE_VELOCITY_FIELD = False
USE_TRANSIENT_FIELD_NAMES = False
TRANSIENT_FIELD_NAMES = ["SV_VOF", "SV_V"]
DATA_EXPORT_INTERVAL = 5
FREE_SURFACE_DELTA_MIN = -3
FREE_SURFACE_DELTA_MAX = 3


class FluentSolutionUSDVisualization:
    """Helper class to visualize solver results"""

    def __init__(self, solver):
        self.__solver = solver
        self.__rootxform_path = Sdf.Path("/Fluent")
        self.__material_scope_path = self.__rootxform_path.AppendPath("Materials")
        self._transient_arrays_data = {}
        self._current_field_name = "velocity-magnitude"
        self._surface_names = None
        self._current_export_step = DATA_EXPORT_INTERVAL
        self._callback_on_timestep_ended = solver.events.register_callback(
            SolverEvent.TIMESTEP_ENDED, self.on_timestep_ended
        )
        self._on_stage_event_delegate = (
            omni.usd.get_context()
            .get_stage_event_stream()
            .create_subscription_to_pop(self.on_stage_event, name="Ansys stage event")
        )
        self._filter_vof_min = 0.1
        self._filter_vof_max = 0.9
        self._filter_free_surface_min = 0.45
        self._filter_free_surface_max = 0.55
        self._clamp_filtered_vof = True
        self.show_plot()
        self.timeline_sub = (
            omni.timeline.get_timeline_interface()
            .get_timeline_event_stream()
            .create_subscription_to_pop(self.on_timeline_events)
        )

    def on_stage_event(self, event: carb.events.IEvent):
        if event.type == int(omni.usd.StageEventType.OPENED):
            self.fill_plot()

    def on_timeline_events(self, event):
        """Define a callback function to handle timeline events."""
        timeline = omni.timeline.get_timeline_interface()
        if event.type == omni.timeline.TimelineEventType.CURRENT_TIME_TICKED.value:
            if timeline.get_end_time() > 0:
                idx = int(
                    (timeline.get_current_time() / timeline.get_end_time())
                    * (len(self._dataHistogram) - 1)
                )
                self._dataHistogram = numpy.zeros(250)
                self._dataHistogram[idx] = 1
                self.dataPlotViewport.set_data(*self._dataHistogram)

    def prepare_transient_calculation(self, field_name):
        self._current_field_name = field_name
        self._current_export_step = DATA_EXPORT_INTERVAL

    def show_plot(self):
        from omni.kit.viewport.utility import get_active_viewport_window
        from omni.ui import FillPolicy
        import omni.ui as ui
        from omni.ui import color as cl

        manager = omni.kit.app.get_app().get_extension_manager()
        extension_id = manager.get_extension_id_by_module(__name__)
        viewport_window = get_active_viewport_window()
        with viewport_window.get_frame(extension_id):
            with ui.Frame(
                fill_policy=FillPolicy.STRETCH, alignment=ui.Alignment.CENTER_BOTTOM
            ):
                self.plotStack = ui.VStack(alignment=ui.Alignment.CENTER_BOTTOM)
                with self.plotStack:
                    ui.Spacer(height=32)
                    with ui.ZStack():
                        self.dataPlotViewport = ui.Plot(
                            ui.Type.HISTOGRAM,
                            0,
                            1,
                            None,
                            width=300,
                            height=300,
                            style={
                                "color": cl(1.0, 1.0, 0.0, 1.0),
                                "background_color": cl(0, 0, 0, 0),
                            },
                        )
                        self.dataPlotMinViewport = ui.Plot(
                            ui.Type.LINE,
                            FREE_SURFACE_DELTA_MIN,
                            FREE_SURFACE_DELTA_MAX,
                            None,
                            width=300,
                            height=300,
                            title="Min/Max Free Surface (mm)",
                            style={
                                "color": cl.blue,
                                "border_radius": 2,
                                "border_color": cl(1.0, 1.0, 1.0, 1.0),
                                "background_color": cl(0.5, 0.5, 0.5, 0.2),
                            },
                        )
                        self.dataPlotMaxViewport = ui.Plot(
                            ui.Type.LINE,
                            FREE_SURFACE_DELTA_MIN,
                            FREE_SURFACE_DELTA_MAX,
                            None,
                            width=300,
                            height=300,
                            style={
                                "color": cl.red,
                                "border_radius": 2,
                                "border_color": cl(1.0, 1.0, 1.0, 1.0),
                                "background_color": cl(0, 0, 0, 0),
                            },
                        )
                        self._dataMin = []
                        self._dataMax = []
                        self._dataHistogram = numpy.zeros(100)
                        self.dataPlotViewport.set_data(*self._dataHistogram)

    def fill_plot(self):
        stage = omni.usd.get_context().get_stage()
        self._dataMin = (
            stage.GetPrimAtPath("/World/live").GetAttribute("freesurf:min").Get()
        )
        self._dataMax = (
            stage.GetPrimAtPath("/World/live").GetAttribute("freesurf:max").Get()
        )
        self.dataPlotMinViewport.set_data(*self._dataMin)
        self.dataPlotMaxViewport.set_data(*self._dataMax)

    def set_plot_scale(self, scale):
        self.dataPlotMinViewport.scale_max = scale
        self.dataPlotMinViewport.scale_min = -scale
        self.dataPlotMaxViewport.scale_max = scale
        self.dataPlotMaxViewport.scale_min = -scale

    # --------------------------------------------------
    # Timestep ended, we keep the data for later injection into USD
    # --------------------------------------------------
    def on_timestep_ended(self, session, event_info):
        # Do nothing until we have reached the interval
        if self._current_export_step < DATA_EXPORT_INTERVAL:
            self._current_export_step = self._current_export_step + 1
            return

        # We now need to get the data from Fluent.
        self._current_export_step = 1
        transient_arrays_data_for_current_index = {}
        solution_variable_info = self.__solver.fields.solution_variable_info
        zones_info = solution_variable_info.get_zones_info()
        domain = zones_info.domains[0]

        # Get the data back from the GPU to the CPU and iterate through the zones to get the field values
        self.__solver.scheme.exec(
            ("(gpuapp-update-fluent-and-post-and-write-ready-as-needed)",)
        )
        for zone in zones_info.zones:
            zone_info = zones_info[zone]
            if zone_info.zone_type == "fluid":
                transient_arrays_data_for_current_index[zone_info.name] = {}
                # get the field data if it's on the list of fields to retrieve
                for field_name in TRANSIENT_FIELD_NAMES:
                    field_data = self.__solver.fields.solution_variable_data.get_data(
                        solution_variable_name=field_name,
                        zone_names=[zone_info.name],
                        domain_name=domain,
                    )[zone_info.name]
                    transient_arrays_data_for_current_index[zone_info.name][
                        field_name
                    ] = field_data
                # generate velocity mag if requested
                if GENERATE_VELOCITY_FIELD:
                    nv_u = transient_arrays_data_for_current_index[zone_info.name][
                        "SV_U"
                    ]
                    nv_v = transient_arrays_data_for_current_index[zone_info.name][
                        "SV_V"
                    ]
                    nv_w = transient_arrays_data_for_current_index[zone_info.name][
                        "SV_W"
                    ]
                    velocity_mag_per_vertex = []
                    for i in range(len(nv_u)):
                        velocity_mag_per_vertex.append(
                            numpy.sqrt(nv_u[i] ** 2 + nv_v[i] ** 2 + nv_w[i] ** 2)
                        )
                    transient_arrays_data_for_current_index[zone_info.name][
                        "velocity_mag"
                    ] = velocity_mag_per_vertex

        # Store the transient data and run the coroutine (in the OV thread) to update the USD stage
        self._transient_arrays_data[event_info.index] = (
            transient_arrays_data_for_current_index
        )
        run_coroutine(self.update_transient_usd())

    async def update_transient_usd(self):
        """Update transient data to the scene"""
        stage = omni.usd.get_context().get_stage()
        timeline = omni.timeline.get_timeline_interface()

        # Go through all the timesteps to retrieve the field data
        for index in self._transient_arrays_data:
            current_time_in_s = index * TIMECODE_MULTIPLIER
            timeCode = timeline.time_to_time_code(current_time_in_s)
            transient_arrays_data = self._transient_arrays_data[index]
            for zone_name in transient_arrays_data:
                print(
                    "Updating transient data for zone",
                    zone_name,
                    "at timecode",
                    timeCode,
                )
                field_datas = transient_arrays_data[zone_name]
                for field_name in field_datas:
                    # Get the right primppath and update the numpy arrays
                    prim = stage.GetPrimAtPath(
                        "/World/"
                        + Tf.MakeValidIdentifier(zone_name)
                        + "/NumPyArrays/"
                        + field_name
                    )
                    prim_coord = stage.GetPrimAtPath(
                        "/World/"
                        + Tf.MakeValidIdentifier(zone_name)
                        + "/NumPyArrays/coords"
                    )
                    if prim:
                        attr = prim.GetAttribute("primvars:solution_variable")
                        attr_coord = prim_coord.GetAttribute(
                            "primvars:solution_variable"
                        ).Get()
                        if attr:
                            # We will compute the min/max freesurface height based on the value of the VoF
                            if field_name == "SV_VOF":
                                vof_field = field_datas[field_name]
                                min_fs_val = 5.0
                                max_fs_val = -5.0
                                # Filter the VoF to clamp the free surface
                                if self._clamp_filtered_vof:
                                    for i in range(len(vof_field)):
                                        vof_val = vof_field[i]
                                        if (
                                            vof_val > self._filter_vof_min
                                            and vof_val < self._filter_vof_max
                                        ):
                                            if (
                                                vof_val > self._filter_free_surface_min
                                                and vof_val
                                                < self._filter_free_surface_max
                                            ):
                                                min_fs_val = min(
                                                    min_fs_val, attr_coord[i][2]
                                                )
                                                max_fs_val = max(
                                                    max_fs_val, attr_coord[i][2]
                                                )
                                        else:
                                            vof_field[i] = 0
                                # Take raw VoF
                                else:
                                    for i in range(len(vof_field)):
                                        vof_val = vof_field[i]
                                        if (
                                            vof_val > self._filter_free_surface_min
                                            and vof_val < self._filter_free_surface_max
                                        ):
                                            min_fs_val = min(
                                                min_fs_val, attr_coord[i][2]
                                            )
                                            max_fs_val = max(
                                                max_fs_val, attr_coord[i][2]
                                            )
                                min_fs_val = min_fs_val * FLUENT_TO_OMNIVERSE_SCALE
                                max_fs_val = max_fs_val * FLUENT_TO_OMNIVERSE_SCALE
                                self._dataMin.append(min_fs_val)
                                self._dataMax.append(max_fs_val)
                                self.dataPlotMinViewport.set_data(*self._dataMin)
                                self.dataPlotMaxViewport.set_data(*self._dataMax)
                                print(
                                    "freesurface bounds: ", min_fs_val, "-", max_fs_val
                                )
                                stage.GetPrimAtPath(
                                    "/World/" + Tf.MakeValidIdentifier(zone_name)
                                ).CreateAttribute(
                                    "freesurf:min", Sdf.ValueTypeNames.FloatArray
                                ).Set(self._dataMin)
                                stage.GetPrimAtPath(
                                    "/World/" + Tf.MakeValidIdentifier(zone_name)
                                ).CreateAttribute(
                                    "freesurf:max", Sdf.ValueTypeNames.FloatArray
                                ).Set(self._dataMax)
                                attr.Set(vof_field, timeCode)
                            # Just set the field value at the correct timecode
                            else:
                                attr.Set(field_datas[field_name], timeCode)
            # Set the timeline to the last timestep
            timeline.set_end_time(current_time_in_s)
        # Empty the transient arrays
        self._transient_arrays_data = {}

    def save_scalar_field_npz_pointcloud(self, npz_path, variable_names=["All"]):
        """Save the scalar field to NPZ"""
        if USE_TRANSIENT_FIELD_NAMES:
            variable_names = TRANSIENT_FIELD_NAMES

        solution_variable_info = self.__solver.fields.solution_variable_info
        zones_info = solution_variable_info.get_zones_info()
        domain = zones_info.domains[0]

        for zone in zones_info.zones:
            zone_info = zones_info[zone]
            if zone_info.zone_type == "fluid":
                print("Getting Solution Variables for zone", zone_info.name)
                arrays = {}
                variable_info = solution_variable_info.get_variables_info(
                    zone_names=[zone_info.name], domain_name=domain
                )
                for field_name in variable_info.solution_variables:
                    print("\t", field_name)
                # centroid
                centroid_data = self.__solver.fields.solution_variable_data.get_data(
                    solution_variable_name="SV_CENTROID",
                    zone_names=[zone_info.name],
                    domain_name=domain,
                )[zone_info.name]
                centroid_data = centroid_data.reshape(len(centroid_data) // 3, 3)
                arrays.update({"coords": centroid_data})
                # field data
                for field_name in variable_info.solution_variables:
                    if (
                        variable_names == ["All"]
                        or field_name in variable_names
                        or (
                            GENERATE_VELOCITY_FIELD
                            and (
                                field_name == "SV_U"
                                or field_name == "SV_V"
                                or field_name == "SV_W"
                            )
                        )
                    ):
                        print("\tCollecting ", field_name)
                        field_data_cell = (
                            self.__solver.fields.solution_variable_data.get_data(
                                solution_variable_name=field_name,
                                zone_names=[zone_info.name],
                                domain_name=domain,
                            )[zone_info.name]
                        )
                        if len(field_data_cell) == len(centroid_data):
                            arrays.update({field_name: field_data_cell})
                # check existence of the require fields
                for variable_name in variable_names:
                    if variable_name not in arrays:
                        arrays.update(
                            {
                                variable_name: numpy.ones(
                                    len(centroid_data), dtype=numpy.float32
                                )
                            }
                        )
                # compute the velocity field
                if "SV_U" in arrays and "SV_V" in arrays and "SV_W" in arrays:
                    print("\tCollecting velocity (SV_U, SV_V, SV_W)")
                    nv_u = arrays["SV_U"]
                    nv_v = arrays["SV_V"]
                    nv_w = arrays["SV_W"]
                    velocity_mag_per_vertex = []
                    if GENERATE_VELOCITY_FIELD:
                        for i in range(len(nv_u)):
                            velocity_mag_per_vertex.append(
                                numpy.sqrt(nv_u[i] ** 2 + nv_v[i] ** 2 + nv_w[i] ** 2)
                            )
                        arrays.update({"velocity_mag": velocity_mag_per_vertex})
                # save or populate stage in memory
                if npz_path is None:
                    populate_stage(
                        omni.usd.get_context().get_stage(), arrays, "live", False
                    )
                    print("CAE primitive live added to Stage")
                else:
                    npz_final_path = (
                        npz_path.replace("file:/", "")
                        + "-pointcloud-"
                        + sanitize_path(zone_info.name)
                    )
                    print(
                        "Saving NPZ file for zone", zone_info.name, "to", npz_final_path
                    )
                    numpy.savez(npz_final_path, **arrays)

    def add_point_algorithm(
        self,
        sv_name_colors="SV_V",
        dataset_path="/World/live/NumPyDataSet",
        prim_path="/Fluent/Pointcloud",
    ):
        """Adds point algorithm as a post-process."""
        from omni.usd import get_context
        from pxr import Sdf, Usd, UsdGeom, UsdShade
        from omni.cae.algorithms.core import create_material, bind_material

        stage: Usd.Stage = get_context().get_stage()
        dataset_prim = stage.GetPrimAtPath(dataset_path)
        if not dataset_prim:
            raise RuntimeError("DataSet prim is invalid!")

        primT = UsdGeom.Points.Define(stage, prim_path)

        default_width = 0.001
        # apply "Points" schema
        prim = primT.GetPrim()
        prim.AddAppliedSchema("CaeAlgorithmsPointsAPI")
        ns = "omni:cae:algorithms:points"
        prim.CreateRelationship(f"{ns}:dataset", custom=False).SetTargets(
            {dataset_prim.GetPath()}
        )
        prim.CreateRelationship(f"{ns}:colors", custom=False).SetTargets(
            {"/World/live/NumPyArrays/" + sv_name_colors}
        )
        prim.CreateRelationship(f"{ns}:widths", custom=False).SetTargets(
            {"/World/live/NumPyArrays/SV_VOF"}
        )
        prim.CreateAttribute(f"{ns}:width", Sdf.ValueTypeNames.Float, custom=False).Set(
            default_width
        )
        prim.CreateAttribute(
            f"{ns}:maxCount", Sdf.ValueTypeNames.Int, custom=False
        ).Set(10000000)
        prim.CreateAttribute(
            f"{ns}:widthsRamp", Sdf.ValueTypeNames.Float2, custom=False
        ).Set((0, 1.0))
        prim.CreateAttribute(
            f"{ns}:widthsDomain", Sdf.ValueTypeNames.Float2, custom=False
        ).Set((0.0, 1.0))

        primT.CreatePointsAttr()

        pvAPI = UsdGeom.PrimvarsAPI(primT.GetPrim())
        pvAPI.CreatePrimvar(
            "scalar", Sdf.ValueTypeNames.FloatArray, UsdGeom.Tokens.vertex
        ).Set([0.0])
        pvAPI.CreatePrimvar(
            "widths", Sdf.ValueTypeNames.FloatArray, UsdGeom.Tokens.vertex
        ).Set([default_width])

        # setup material and domain
        material = create_material(
            "ScalarColor",
            stage,
            primT.GetPath().AppendChild("Materials").AppendChild("ScalarColor"),
        )
        for child in material.GetChildren():
            if child.IsA(UsdShade.Shader):
                if "SV_VOF" in sv_name_colors:
                    UsdShade.Shader(child).CreateInput(
                        "domain", Sdf.ValueTypeNames.Float2
                    ).Set((0, 1))
                else:
                    UsdShade.Shader(child).CreateInput(
                        "domain", Sdf.ValueTypeNames.Float2
                    ).Set((0, 0.1))
        bind_material(primT, material)

    def execute_template_script(self, filepath):
        """Open a script template file, load it as a module, and execute its add_template() function."""
        from importlib.machinery import SourceFileLoader

        template_script = SourceFileLoader("ansys.usd.template", filepath).load_module()
        template_script.add_template()

    def create_hierarchy_and_surfaces(self, mdl_material_path, mdl_material_name):
        """ "Create the surface mesh."""
        stage = omni.usd.get_context().get_stage()
        UsdGeom.SetStageUpAxis(stage, "Z")
        field_data = self.__solver.fields.field_data

        # Reconstruct the Design hierarchy in USD
        designRootXform = UsdGeom.Xform.Define(stage, self.__rootxform_path)
        properties = designRootXform.GetPrim().GetPropertyNames()
        if "xformOp:rotateX" not in properties:
            designRootXform.AddRotateXOp().Set(FLUENT_TO_OMNIVERSE_ROTATION_X)
        if "xformOp:scale" not in properties:
            designRootXform.AddScaleOp().Set(
                (
                    FLUENT_TO_OMNIVERSE_SCALE,
                    FLUENT_TO_OMNIVERSE_SCALE,
                    FLUENT_TO_OMNIVERSE_SCALE,
                )
            )
        UsdGeom.Scope.Define(stage, self.__material_scope_path)

        # Create default glass materials
        material_path = (
            designRootXform.GetPath().AppendPath("Materials").AppendPath("BottleGlass")
        )
        omni.kit.commands.execute(
            "CreateMdlMaterialPrimCommand",
            mtl_url=mdl_material_path,
            mtl_name=mdl_material_name,
            mtl_path=material_path,
        )

        # Create meshes for all the surfaces
        rootSurfaceXform = UsdGeom.Xform.Define(
            stage, designRootXform.GetPath().AppendPath("Surface")
        )
        for surface_name in field_data.get_surface_data.surface_name.allowed_values():
            if BYPASS_VOLUME_MESH and (
                "-fluid" in surface_name or "point-" in surface_name
            ):
                continue

            try:
                surfaceXform = UsdGeom.Xform.Define(
                    stage,
                    rootSurfaceXform.GetPath().AppendPath(sanitize_path(surface_name)),
                )
                usd_mesh = UsdGeom.Mesh.Define(
                    stage, surfaceXform.GetPath().AppendPath("Mesh")
                )
                usd_mesh.GetPrim().CreateAttribute(
                    FLUENT_FIELD_TOKEN, Sdf.ValueTypeNames.String
                ).Set(surface_name)

                surface_data = field_data.get_surface_data(
                    data_types=[
                        SurfaceDataType.Vertices,
                        SurfaceDataType.FacesConnectivity,
                    ],
                    surfaces=[surface_name],
                )
                connectivity_data = surface_data[surface_name][
                    SurfaceDataType.FacesConnectivity
                ]
                vertices_data = surface_data[surface_name][SurfaceDataType.Vertices]

                faceCounts = []
                indices = []
                for node in connectivity_data:
                    faceCounts.append(len(node))
                    for index in node:
                        indices.append(int(index))

                # Create Indices
                usd_mesh.GetFaceVertexIndicesAttr().Set(indices)
                # Face counts (3 for tris, 4 for quads...)
                usd_mesh.GetFaceVertexCountsAttr().Set(faceCounts)
                # Create vertices
                usd_mesh.GetPointsAttr().Set(vertices_data)
                # Fast refraction shadows helps with transparent surfaces
                usd_mesh.GetPrim().CreateAttribute(
                    "primvars:enableFastRefractionShadow", Sdf.ValueTypeNames.Bool
                ).Set(True)

                omni.kit.commands.execute(
                    "BindMaterialCommand",
                    prim_path=usd_mesh.GetPrim().GetPath(),
                    material_path=material_path,
                    strength="strongerThanDescendants",
                )
            except Exception as e:
                print(e)

        # Focus camera on the content from Fluent
        self.frame_prim(rootSurfaceXform.GetPath().pathString)

    def frame_prim(self, prim_to_frame):
        import omni.kit.commands
        from omni.kit.viewport.utility import get_active_viewport
        from pxr import Usd, UsdGeom

        # Useful variables that will be passed to the FramePrimsCommand
        camera_path = None
        time = Usd.TimeCode.Default()
        resolution = (1, 1)
        zoom = 0.6

        # Get the stage
        stage = omni.usd.get_context().get_stage()
        active_viewport = get_active_viewport()
        if active_viewport:
            # Pull meaningful information from the Viewport to frame a specific prim
            time = active_viewport.time
            resolution = active_viewport.resolution
            camera_path = active_viewport.camera_path
        else:
            # Otherwise, create a camera that will be used to frame the prim_to_frame
            camera_path = "/World/New_Camera"
            UsdGeom.Camera.Define(stage, camera_path)

        # Finally run the undo-able FramePrimsCommand
        omni.kit.commands.execute(
            "FramePrimsCommand",
            # The path to the camera that is begin moved
            prim_to_move=camera_path,
            # The prim that is begin framed / looked at
            prims_to_frame=[prim_to_frame],
            # The Usd.TimCode that camera_path will use to set new location and orientation
            time_code=time,
            # The aspect_ratio of the image-place that is being viewed
            aspect_ratio=resolution[0] / resolution[1],
            # Additional slop to use for the framing
            zoom=zoom,
        )
