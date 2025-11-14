from omni.kit.commands import execute
from pxr import Usd, Sdf, Gf
import omni.usd

def add_template():
    fluent_result_bb = omni.usd.get_context().compute_path_world_bounding_box("/Fluent/Surface")
    result, prim_path = execute(
        "CreateMeshPrim",
        prim_type="Plane",
        object_origin=Gf.Vec3f(0.0, 0.0, fluent_result_bb[0][2]),
        half_scale=50.0
    )