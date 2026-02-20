# Copyright (C) 2025 - 2026 ANSYS, Inc. and/or its affiliates.
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

import os
import time
import threading
import math

import carb
import carb.events
import carb.tokens
import omni.client.utils
import omni.kit.app

from omni.kit.notification_manager import post_notification, NotificationStatus
from omni.kit.viewport.utility import get_active_viewport

from ansys.solver.fluent.visualization import TRANSIENT_FIELD_NAMES

from .solver_session import SolverSessionHelperFactory

cameras = {
    "Free": "/OmniverseKit_Persp",
    "Top": "/World/Top",
    "Perspective": "/World/Perspective",
    "Bottle": "/FillerTop/Rotating/Bottle",
    "Machinery": "/FillerTop/Rotating/Rotating",
}


class Connection:
    def __init__(
        self, success: bool, error_type: str = None, error_details: str = None
    ):
        self.success = success
        self.error_type = error_type
        self.error_details = error_details


class IMessagesHandler:
    inbound = {}
    outbound = []

    def _on_get_current_state(self, event: carb.events.IEvent):
        raise NotImplementedError()

    def _connect(self) -> Connection:
        raise NotImplementedError()

    def _check_connection(self):
        raise NotImplementedError()

    def _on_is_instance_healthy(self, event: carb.events.IEvent):
        raise NotImplementedError()

    def _on_design_file_changed(self, event: carb.events.IEvent):
        raise NotImplementedError()

    def _run_journal_parallel(self, journal_path):
        raise NotImplementedError()

    def _on_run_calculations(self, event: carb.events.IEvent):
        raise NotImplementedError()

    def _on_post_process_sv(self, event: carb.events.IEvent):
        raise NotImplementedError()

    def open_stage(self, path_to_usd_file):
        raise NotImplementedError()

    def _on_open_solved_case(self, event: carb.events.IEvent):
        raise NotImplementedError()

    def _on_store_solved_case(self, event: carb.events.IEvent):
        raise NotImplementedError()

    def on_progress_updated(self, session, event_info):
        raise NotImplementedError()

    def send_update_message(self, message):
        raise NotImplementedError()

    def send_update_status(self, message):
        raise NotImplementedError()

    def send_message(self, typeName, payload):
        raise NotImplementedError()

    def _on_timestep_changed(self, event: carb.events.IEvent):
        raise NotImplementedError()

    def _on_toggle_fullscreen(self, event: carb.events.IEvent):
        raise NotImplementedError()

    def _on_change_camera(self, event: carb.events.IEvent):
        raise NotImplementedError()


class FluentMessagesHandler(IMessagesHandler):
    def __init__(self):
        self._is_connected = False
        self._currentTimestep = 1
        self._lastOpendedDesign = None  # Breaking change: previously was "Unknown"
        self._canInitialize = False  # Breaking change: previously was ''
        self._canRun = False  # Breaking change: previously was ''

        viscosity = os.environ.get("VISCOSITY")
        if viscosity is None:
            raise ValueError("VISCOSITY environment variable is not set")
        self._viscosity = float(viscosity)

        bottlesPerHour = os.environ.get("BOTTLES_PER_HOUR")
        if bottlesPerHour is None:
            raise ValueError("BOTTLES_PER_HOUR environment variable is not set")
        self._bottlesPerHour = int(bottlesPerHour)

        fillingHeight = os.environ.get("FILLING_HEIGHT")
        if fillingHeight is None:
            raise ValueError("FILLING_HEIGHT environment variable is not set")
        self._fillingHeight = float(fillingHeight)

        content_path = os.environ.get("CONTENT_PATH")
        if content_path is None:
            raise ValueError("CONTENT_PATH environment variable is not set")
        if not os.path.isdir(content_path):
            raise ValueError(
                "CONTENT_PATH environment variable doesn't target an existing directory"
            )
        self._content_path = content_path

        self.inbound = {
            "runCalculations": self._on_run_calculations,
            "loadDesignFile": self._on_design_file_changed,
            "postProcessSolutionVariable": self._on_post_process_sv,
            "toggleFullscreen": self._on_toggle_fullscreen,
            "toggleRenderer": self._on_toggle_renderer,
            "timestepChanged": self._on_timestep_changed,
            "openSolvedCase": self._on_open_solved_case,
            "storeSolvedCase": self._on_store_solved_case,
            "getCurrentState": self._on_get_current_state,
            "isInstanceHealthy": self._on_is_instance_healthy,
            "getColorPalettes": self._on_get_color_palettes,
            "setColorPalette": self._on_set_color_palettes,
            "getStoredResults": self._on_get_stored_results,
            "changeCamera": self._on_change_camera,
        }

        self.outbound = [
            "runCalculationsResponse",
            "loadDesignFileResponse",
            "postProcessSolutionVariableResponse",
            "updateMessageText",
            "updateStatusText",
            "openSolvedCaseResponse",
            "storedSolvedCaseResponse",
            "currentStateResponse",
            "isInstanceHealthyResponse",
            "currentStateResponse",
            "colorPalettesResponse",
            "storedResultsResponse",
            # Kit-app status tracking (for e2e tests)
            "kitAppReadyResponse",
            "rtxStatusResponse",
            "modelLoadProgressResponse",
        ]

    def _on_get_stored_results(self, event: carb.events.IEvent):
        if event.type == carb.events.type_from_string("getStoredResults"):
            from os import listdir
            from os.path import isfile, join

            stored_results_path = self._content_path + "stored/"
            stored_results_files = [
                f
                for f in listdir(stored_results_path)
                if isfile(join(stored_results_path, f))
            ]
            print("Stored results :", stored_results_files)
            payload = {"storedResults": stored_results_files}
            self.send_message("storedResultsResponse", payload)

    def _on_get_color_palettes(self, event: carb.events.IEvent):
        if event.type == carb.events.type_from_string("getColorPalettes"):
            from os import listdir
            from os.path import isfile, join

            color_palettes_path = self._content_path + "palettes/"
            color_palette_files = [
                f
                for f in listdir(color_palettes_path)
                if isfile(join(color_palettes_path, f))
            ]
            payload = {"colorPalettes": color_palette_files}
            self.send_message("colorPalettesResponse", payload)

    def _on_set_color_palettes(self, event: carb.events.IEvent):
        if event.type == carb.events.type_from_string("setColorPalette"):
            colorPalette = event.payload["colorPalette"]
            colorPalettepath = self._content_path + "palettes/" + colorPalette + ".png"
            # Change color palette
            from pxr import UsdShade, Sdf

            stage = omni.usd.get_context().get_stage()
            prim = stage.GetPrimAtPath(
                "/Fluent/Pointcloud/Materials/ScalarColor/Shader"
            )
            shader_prim = UsdShade.Shader(prim)
            if shader_prim:
                color_palette_attr = shader_prim.GetInput("lut")
                if color_palette_attr:
                    print("Changing color palette to ", colorPalettepath)
                    color_palette_attr.Set(colorPalettepath)
                else:
                    shader_prim.CreateInput("lut", Sdf.ValueTypeNames.Asset).Set(
                        Sdf.AssetPath(colorPalettepath)
                    )

    def _on_get_current_state(self, event: carb.events.IEvent):
        if event.type == carb.events.type_from_string("getCurrentState"):
            payload = {
                "canInitialize": self._canInitialize,
                "canRun": self._canRun,
                "viscosity": self._viscosity,
                "bottlesPerHour": self._bottlesPerHour,
                "fillingHeight": self._fillingHeight,
                "lastOpendedDesign": self._lastOpendedDesign,
            }
            self.send_message("currentStateResponse", payload)

    def _connect(self) -> Connection:
        error_type = None
        error_details = None
        if not self._is_connected:
            helper = SolverSessionHelperFactory.create_solver_session("fluent")
            ip, port, password = helper.get_ip_port_password()
            self._session = helper.get_session_object()
            try:
                self._session.connect(ip, port, password)
                self._is_connected = True
            except Exception as inst:
                self._session = None
                self._is_connected = False
                error_type = str(type(inst))
                error_details = str(inst.args)
        return Connection(
            **{
                "success": self._is_connected,
                "error_type": error_type,
                "error_details": error_details,
            }
        )

    def _check_connection(self):
        connection = self._connect()
        if connection.success:
            post_notification(
                "Connected to the Fluent Session",
                duration=5,
                status=NotificationStatus.INFO,
            )
        else:
            carb.log_error("Error connecting to Fluent session")
            carb.log_error(connection.error_type)
            carb.log_error(connection.error_details)
            post_notification(
                "Failed to connect to the Fluent Session",
                duration=5,
                status=NotificationStatus.WARNING,
            )
        return self._is_connected

    def _on_is_instance_healthy(self, event: carb.events.IEvent):
        if event.type == carb.events.type_from_string("isInstanceHealthy"):
            connection = self._connect()
            payload = {"isHealthy": connection.success}
            self.send_message("isInstanceHealthyResponse", payload)

            # Send kit-app ready status after health check (for e2e tests)
            # This ensures the message is sent after WebRTC connection is established
            self.send_message(
                "kitAppReadyResponse", {"ready": True, "solver": "fluent"}
            )

            # Send RTX status (for e2e tests)
            settings = carb.settings.get_settings()
            rtx_payload = {
                "rtxEnabled": settings.get("/persistent/rtx/modes/pt/enabled") or False,
                "rt2Enabled": settings.get("/persistent/rtx/modes/rt2/enabled")
                or False,
            }
            self.send_message("rtxStatusResponse", rtx_payload)

    def _on_design_file_changed(self, event: carb.events.IEvent):
        if event.type == carb.events.type_from_string("loadDesignFile"):
            payload = {"result": "success", "error": ""}
            design_file = self._content_path + event.payload["url"] + ".cas.h5"
            self._lastOpendedDesign = event.payload["url"]
            print("Design file load message received: ", design_file)

            # Send model load progress: started
            self.send_message(
                "modelLoadProgressResponse", {"stage": "started", "progress": 0}
            )

            if os.path.exists(design_file) and self._check_connection():
                omni.usd.get_context().new_stage()

                # Send model load progress: loading_case
                self.send_message(
                    "modelLoadProgressResponse",
                    {"stage": "loading_case", "progress": 20},
                )
                self.send_update_message("Loading Design File")
                self._session.load_case_file(design_file)

                # Send model load progress: generating_surfaces
                self.send_message(
                    "modelLoadProgressResponse",
                    {"stage": "generating_surfaces", "progress": 50},
                )
                self.send_update_message("Generating USD Surfaces")
                self._session.get_visualization().create_hierarchy_and_surfaces(
                    self._content_path + "materials/Tinted_Glass_R85.mdl",
                    "Tinted_Glass_R85",
                )

                # Send model load progress: applying_template
                self.send_message(
                    "modelLoadProgressResponse",
                    {"stage": "applying_template", "progress": 80},
                )
                self.send_update_message("Adding default template")
                self._session.get_visualization().execute_template_script(
                    self._content_path + "templates/studio.py"
                )
                self._canInitialize = True

                # Send model load progress: completed
                self.send_message(
                    "modelLoadProgressResponse", {"stage": "completed", "progress": 100}
                )
            else:
                payload = {
                    "result": "error",
                    "error": "Can't connect to the Fluent session",
                }
                # Send model load progress: error
                self.send_message(
                    "modelLoadProgressResponse", {"stage": "error", "progress": 0}
                )

            self.send_message("loadDesignFileResponse", payload)

    def set_template(self):
        pass

    def run_journal_parallel(self, journal_path):
        self._session.run_journal(journal_path)
        self._canRun = True
        self._canInitialize = True
        self.send_message("runCalculationsResponse", {"result": "success", "error": ""})

    def _on_run_calculations(self, event: carb.events.IEvent):
        if event.type == carb.events.type_from_string("runCalculations"):
            if self._check_connection():
                self._currentTimestep = 0
                numTimesteps = event.payload["numTimesteps"]
                self._viscosity = event.payload["viscosity"]
                self._bottlesPerHour = event.payload["bottlesPerHour"]
                self._tolerance = event.payload["tolerance"]
                self.send_update_message("Calculating")
                # change the viscosity in the Fluent's material
                materials = self._session.get_solver().settings.setup.materials
                materials.fluid["myliquid"].viscosity.value.set_state(self._viscosity)

                _TIMESTEP_SIZE = os.environ.get("TIMESTEP_SIZE")
                if _TIMESTEP_SIZE is None:
                    raise ValueError("TIMESTEP_SIZE environment variable is not set")
                TIMESTEP_SIZE = float(_TIMESTEP_SIZE)

                _BOTTLE_UNITS_1 = os.environ.get("BOTTLE_UNITS_1")
                if _BOTTLE_UNITS_1 is None:
                    raise ValueError("BOTTLE_UNITS_1 environment variable is not set")
                BOTTLE_UNITS_1 = float(_BOTTLE_UNITS_1)

                _BOTTLE_UNITS_2 = os.environ.get("BOTTLE_UNITS_2")
                if _BOTTLE_UNITS_2 is None:
                    raise ValueError("BOTTLE_UNITS_2 environment variable is not set")
                BOTTLE_UNITS_2 = float(_BOTTLE_UNITS_2)

                _BOTTLE_UNITS_3 = os.environ.get("BOTTLE_UNITS_3")
                if _BOTTLE_UNITS_3 is None:
                    raise ValueError("BOTTLE_UNITS_3 environment variable is not set")
                BOTTLE_UNITS_3 = float(_BOTTLE_UNITS_3)

                iteration_resolution = numTimesteps

                _firstIterationTimesteps = os.environ.get("FIRST_ITERATION_TIMESTEPS")
                firstIterationTimesteps = int(_firstIterationTimesteps)

                secondIterationTimesteps = int(
                    (
                        221.45
                        / 360.0
                        * (BOTTLE_UNITS_2 / (self._bottlesPerHour / 3600.0))
                    )
                    / TIMESTEP_SIZE
                )
                thirdIterationTimesteps = int(
                    (
                        108.75
                        / 360.0
                        * (BOTTLE_UNITS_3 / (self._bottlesPerHour / 3600.0))
                    )
                    / TIMESTEP_SIZE
                )
                journal_template_content = open(
                    self._content_path + "FullRun.template.jou", "r"
                ).read()
                journal_template_content = journal_template_content.replace(
                    "[TIMESTEP_SIZE]", str(TIMESTEP_SIZE / iteration_resolution)
                )
                journal_template_content = journal_template_content.replace(
                    "[FIRST_ITERATION_TIMESTEPS]",
                    str(int(firstIterationTimesteps * iteration_resolution)),
                )
                journal_template_content = journal_template_content.replace(
                    "[SECOND_ITERATION_TIMESTEPS]",
                    str(int(secondIterationTimesteps * iteration_resolution)),
                )
                journal_template_content = journal_template_content.replace(
                    "[THIRD_ITERATION_TIMESTEPS]",
                    str(int(thirdIterationTimesteps * iteration_resolution)),
                )
                # Bottles per hour - orbital period
                mrf_omega_1 = (
                    1.0
                    / (BOTTLE_UNITS_1 / (self._bottlesPerHour / 3600.0))
                    * 2.0
                    * math.pi
                )
                mrf_omega_2 = (
                    1.0
                    / (BOTTLE_UNITS_2 / (self._bottlesPerHour / 3600.0))
                    * 2.0
                    * math.pi
                )
                mrf_omega_3 = (
                    1.0
                    / (BOTTLE_UNITS_3 / (self._bottlesPerHour / 3600.0))
                    * 2.0
                    * math.pi
                )
                journal_template_content = journal_template_content.replace(
                    "[ORBITAL_PERIOD_1]", str(mrf_omega_1)
                )
                journal_template_content = journal_template_content.replace(
                    "[ORBITAL_PERIOD_2]", str(mrf_omega_2)
                )
                journal_template_content = journal_template_content.replace(
                    "[ORBITAL_PERIOD_3]", str(mrf_omega_3)
                )
                # saving and executing journal
                journal_path = self._content_path + "FullRun.jou"
                journal_file = open(journal_path, "w")
                journal_file.write(journal_template_content)
                journal_file.close()
                threading.Thread(
                    target=self.run_journal_parallel, args=(journal_path,), daemon=True
                ).start()
                self._canRun = False
                self._canInitialize = False

    def _on_post_process_sv(self, event: carb.events.IEvent):
        if event.type == carb.events.type_from_string("postProcessSolutionVariable"):
            if self._check_connection():
                sv_name = event.payload["sv"]
                self._fillingHeight = event.payload["fillingHeight"]
                self._session.get_visualization()._clamp_filtered_vof = event.payload[
                    "freeSurfaceOnly"
                ]
                # Filling height changes the Z value on the register and execute the journal
                self.send_update_message("Initilizing solver and Patching")
                journal_template_content = open(
                    self._content_path + "Init.template.jou", "r"
                ).read()
                journal_template_content = journal_template_content.replace(
                    "[Z_MAX_VALUE_FILLING_HEIGHT]", str(-self._fillingHeight / 1000.0)
                )
                journal_path = self._content_path + "Init.jou"
                journal_file = open(journal_path, "w")
                journal_file.write(journal_template_content)
                journal_file.close()
                self._session.run_journal(journal_path)
                self.send_update_message("Post-processing " + sv_name)
                self._session.get_visualization().save_scalar_field_npz_pointcloud(
                    None, TRANSIENT_FIELD_NAMES
                )
                self.send_update_message("Adding Algorithms " + sv_name)
                self._session.get_visualization().add_point_algorithm(
                    sv_name_colors=sv_name
                )
                self._canRun = True
            self.send_message(
                "postProcessSolutionVariableResponse",
                {"result": "success", "error": ""},
            )

    async def open_stage(self, path_to_usd_file):
        result, error = await omni.usd.get_context().open_stage_async(
            path_to_usd_file, load_set=omni.usd.UsdContextInitialLoadSet.LOAD_ALL
        )
        stage = omni.usd.get_context().get_stage()
        carb.log_info(f"Opened stage {stage} with result {result}")

    def _on_open_solved_case(self, event: carb.events.IEvent):
        if event.type == carb.events.type_from_string("openSolvedCase"):
            usdFilepath = self._content_path + "stored/" + event.payload["usdFile"]
            self.send_update_message("Loading Solved Case " + event.payload["usdFile"])
            # asyncio.ensure_future(self.open_stage(usdFilepath))
            omni.usd.get_context().open_stage(
                usdFilepath, load_set=omni.usd.UsdContextInitialLoadSet.LOAD_ALL
            )
            self.send_message(
                "openSolvedCaseResponse", {"result": "success", "error": ""}
            )

    def _on_store_solved_case(self, event: carb.events.IEvent):
        if event.type == carb.events.type_from_string("storeSolvedCase"):
            self.send_update_message("Storing Solved Case")
            usd_base_filename = event.payload["case_name"]
            if self._lastOpendedDesign:
                usd_base_filename = os.path.basename(self._lastOpendedDesign)
            usdFilepath = (
                self._content_path
                + "stored/"
                + usd_base_filename
                + time.strftime("_%Y.%m.%d-%Hh%M")
                + ".usd"
            )
            print("Saving ", usdFilepath)
            stage = omni.usd.get_context().get_stage()
            stage.Export(usdFilepath)
            self.send_message(
                "storedSolvedCaseResponse", {"result": "success", "error": ""}
            )

    def on_progress_updated(self, session, event_info):
        msg = event_info.message
        if event_info.percentage > 0:
            msg = msg + " - " + str(event_info.percentage) + "%"
        self.send_update_status(msg)

    def send_update_message(self, message):
        print(message)
        self.send_message("updateMessageText", {"text": message})

    def send_update_status(self, message):
        print(message)
        self.send_message("updateStatusText", {"text": message})

    def send_message(self, typeName, payload):
        carb.log_info(
            f"[MessagesHandler] Sending message: {typeName} with payload: {payload}"
        )
        print(f"[MessagesHandler] Sending message: {typeName} with payload: {payload}")
        message_bus = omni.kit.app.get_app().get_message_bus_event_stream()
        event_type = carb.events.type_from_string(typeName)
        message_bus.dispatch(event_type, payload=payload)
        message_bus.pump()
        carb.log_info(f"[MessagesHandler] Message dispatched: {typeName}")

    def _on_timestep_changed(self, event: carb.events.IEvent):
        TIMECODE_MULTIPLIER = 1 / 60.0
        timestep = event.payload["timestep"]
        timeline = omni.timeline.get_timeline_interface()
        current_time_in_s = timestep * TIMECODE_MULTIPLIER
        timeline.set_current_time(current_time_in_s)

    def _on_toggle_fullscreen(self, event: carb.events.IEvent):
        omni.kit.actions.core.execute_action("omni.kit.ui.actions", "toggle_ui")

    def _on_toggle_renderer(self, event: carb.events.IEvent):
        from omni.kit.viewport.utility import get_active_viewport

        if event.payload["pathTracing"]:
            get_active_viewport().set_hd_engine("rtx", "PathTracing")
        else:
            get_active_viewport().set_hd_engine("rtx", "RealTimePathTracing")

    def _on_change_camera(self, event: carb.events.IEvent):
        if event.type == carb.events.type_from_string("changeCamera"):
            camera_path = cameras[event.payload["camerapath"]]
            viewport = get_active_viewport()
            if not viewport:
                raise RuntimeError("No active Viewport")
            print("Switching camera from", viewport.camera_path, "to", camera_path)
            viewport.camera_path = camera_path


class MessagesHandlerFactory:
    handlers = {"fluent": FluentMessagesHandler}

    @staticmethod
    def get_handler(solver_name) -> IMessagesHandler:
        handler_class = MessagesHandlerFactory.handlers.get(solver_name)
        if handler_class is not None:
            return handler_class()
        else:
            raise ValueError(f"Unsupported solver: {solver_name}")
