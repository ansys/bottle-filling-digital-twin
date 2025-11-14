from omni.kit.commands import execute
from pxr import Gf,UsdLux,Sdf, UsdGeom, Usd
import omni.usd
import os

def add_template():
    # Plane + Material
    fluent_result_bb = omni.usd.get_context().compute_path_world_bounding_box("/Fluent/Surface")
    execute(
        "CreateMeshPrim",
        prim_type="Disk",
        object_origin=Gf.Vec3f(0.0, 0.0, fluent_result_bb[0][2])
    )
    mdl_material_path = os.path.join(os.path.dirname(__file__), "../materials/Iron_Brushed.mdl")
    execute('CreateMdlMaterialPrimCommand',
        mtl_url=mdl_material_path,
        mtl_name="Iron_Brushed",
        mtl_path="/Looks/Iron_Brushed"
    )
    execute('BindMaterialCommand',
        prim_path="/Disk",
        material_path="/Looks/Iron_Brushed",
        strength='strongerThanDescendants')

    # Lights
    execute('CreatePrim',
        prim_type='RectLight',
        prim_path="/Environment/Lights/RectLight",
        attributes={'inputs:width': 100.0, 'inputs:height': 10.0, 'inputs:intensity': 15000})

    execute('ChangeProperty',
        prop_path=Sdf.Path('/Environment/Lights/RectLight.xformOp:rotateXYZ'),
        value=Gf.Vec3d(0.0, 0.0, 90.0),
        prev=Gf.Vec3d(90.0, 0.0, 90.0),
        usd_context_name=omni.usd.get_context().get_stage())

    execute('ChangeProperty',
        prop_path=Sdf.Path('/Environment/Lights/RectLight.xformOp:translate'),
        value=Gf.Vec3d(0.0, 0.0, 25.0),
        prev=Gf.Vec3d(0.0, 0.0, 0.0),
        usd_context_name=omni.usd.get_context().get_stage())

    execute(
        "CreatePrim",
        prim_path="/Environment/Lights/DomeLight",
        prim_type="DomeLight",
        select_new_prim=False,
        attributes={
                    UsdLux.Tokens.inputsIntensity: 1,
                    UsdLux.Tokens.inputsColorTemperature: 6150,
                    UsdLux.Tokens.inputsEnableColorTemperature: True,
                    UsdLux.Tokens.inputsExposure: 9,
                    UsdLux.Tokens.inputsTextureFile: os.path.dirname(__file__) + '/studio_small_08_8k.exr',
                    UsdLux.Tokens.inputsTextureFormat: UsdLux.Tokens.latlong,
                    },
        create_default_xform=True,
    )

    # Camera Top
    execute(
       "CreatePrimWithDefaultXform",
       prim_type="Camera",
       prim_path="/World/Top",
       attributes={
           "projection": UsdGeom.Tokens.perspective,
           "focalLength": 50.0
       })
    execute('ChangeProperty',
        prop_path=Sdf.Path('/World/Top.xformOp:rotateYXZ'),
        value=Gf.Vec3d(0.0, 0, 118.94103),
        prev=Gf.Vec3d(0.0, 0.0, 0.0),
        usd_context_name=omni.usd.get_context().get_stage())
    execute('ChangeProperty',
        prop_path=Sdf.Path('/World/Top.xformOp:translate'),
        value=Gf.Vec3d(-0.016304521747264496, -0.009200849618091454, 35.16345394837329),
        prev=Gf.Vec3d(0.0, 0.0, 0.0),
        usd_context_name=omni.usd.get_context().get_stage())
    execute('ChangePropertyCommand',
        prop_path=Sdf.Path('/World/Top.omni:kit:cameraLock'),
        value=True,
        prev=None,
	    timecode=Usd.TimeCode.Default(),
        usd_context_name=omni.usd.get_context().get_stage(),
        type_to_create_if_not_exist=Sdf.ValueTypeNames.Bool)

    # Camera Perspective
    execute(
       "CreatePrimWithDefaultXform",
       prim_type="Camera",
       prim_path="/World/Perspective",
       attributes={
           "projection": UsdGeom.Tokens.perspective,
           "focalLength": 18.14756
       })
    execute('ChangeProperty',
        prop_path=Sdf.Path('/World/Perspective.xformOp:rotateYXZ'),
        value=Gf.Vec3d(56.510082, 0, 115.58968),
        prev=Gf.Vec3d(0.0, 0.0, 0.0),
        usd_context_name=omni.usd.get_context().get_stage())
    execute('ChangeProperty',
        prop_path=Sdf.Path('/World/Perspective.xformOp:translate'),
        value=Gf.Vec3d(31.255859223806052, 15.649929536289509, 17.185864410605586),
        prev=Gf.Vec3d(0.0, 0.0, 0.0),
        usd_context_name=omni.usd.get_context().get_stage())
    execute('ChangePropertyCommand',
        prop_path=Sdf.Path('/World/Perspective.omni:kit:cameraLock'),
        value=True,
        prev=None,
	    timecode=Usd.TimeCode.Default(),
        usd_context_name=omni.usd.get_context().get_stage(),
        type_to_create_if_not_exist=Sdf.ValueTypeNames.Bool)

    # Camera Bottle
    execute(
       "CreatePrimWithDefaultXform",
       prim_type="Camera",
       prim_path="/FillerTop/Rotating/Bottle",
       attributes={
           "projection": UsdGeom.Tokens.perspective,
           "focalLength": 50.0
       })
    execute('ChangeProperty',
        prop_path=Sdf.Path('/FillerTop/Rotating/Bottle.xformOp:rotateYXZ'),
        value=Gf.Vec3d(60.591316, 0, -6.84242),
        prev=Gf.Vec3d(0.0, 0.0, 0.0),
        usd_context_name=omni.usd.get_context().get_stage())
    execute('ChangeProperty',
        prop_path=Sdf.Path('/FillerTop/Rotating/Bottle.xformOp:translate'),
        value=Gf.Vec3d(-3.9507848268404704, -31.557591545831524, 13.85791788007599),
        prev=Gf.Vec3d(0.0, 0.0, 0.0),
        usd_context_name=omni.usd.get_context().get_stage())
    execute('ChangePropertyCommand',
        prop_path=Sdf.Path('/FillerTop/Rotating/Bottle.omni:kit:cameraLock'),
        value=True,
        prev=None,
	    timecode=Usd.TimeCode.Default(),
        usd_context_name=omni.usd.get_context().get_stage(),
        type_to_create_if_not_exist=Sdf.ValueTypeNames.Bool)

    # Camera Machinery
    execute(
       "CreatePrimWithDefaultXform",
       prim_type="Camera",
       prim_path="/FillerTop/Rotating/Rotating",
       attributes={
           "projection": UsdGeom.Tokens.perspective,
           "focalLength": 50.0,
           "focusDistance": 131.32175,
           "fStop": 8
       })
    execute('ChangeProperty',
        prop_path=Sdf.Path('/FillerTop/Rotating/Rotating.xformOp:rotateYXZ'),
        value=Gf.Vec3d(86.45061, -2.568735e-13, -96.63314),
        prev=Gf.Vec3d(0.0, 0.0, 0.0),
        usd_context_name=omni.usd.get_context().get_stage())
    execute('ChangeProperty',
        prop_path=Sdf.Path('/FillerTop/Rotating/Rotating.xformOp:translate'),
        value=Gf.Vec3d(-132.82678755350875, 17.13838129871243, 0.7236731397651138),
        prev=Gf.Vec3d(0.0, 0.0, 0.0),
        usd_context_name=omni.usd.get_context().get_stage())
    execute('ChangeProperty',
        prop_path=Sdf.Path('/FillerTop/Rotating/Rotating.omni:kit:cameraLock'),
        value=True,
        prev=None,
	    timecode=Usd.TimeCode.Default(),
        usd_context_name=omni.usd.get_context().get_stage(),
        type_to_create_if_not_exist=Sdf.ValueTypeNames.Bool)

    # Unselect all
    execute('SelectPrimsCommand',
        old_selected_paths=['/Environment/Lights/RectLight'],
        new_selected_paths=[],
        expand_in_stage=True)
