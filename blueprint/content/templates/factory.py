from omni.kit.commands import execute
from pxr import Usd, Sdf, Gf
import omni.usd
import os

def add_int_reference(prim: Usd.Prim, ref_target_path: Sdf.Path) -> None:
    references: Usd.References = prim.GetReferences()
    references.AddInternalReference(ref_target_path)

def add_ext_reference(prim: Usd.Prim, ref_asset_path: str, ref_target_path: Sdf.Path) -> None:
    references: Usd.References = prim.GetReferences()
    references.AddReference(
        assetPath=ref_asset_path,
        primPath=ref_target_path
    )

def add_template():
    fluent_result_bb = omni.usd.get_context().compute_path_world_bounding_box("/Fluent/Surface")

    # Add an external reference to specific prim
    # add_ext_reference(ref_prim, "C:/path/to/file.usd", Sdf.Path("/World/BottleFillingFactory"))
    omni.kit.commands.execute('AddReference',
        stage=omni.usd.get_context().get_stage(),
        prim_path=Sdf.Path('/World/BottleFillingFactory'),
        reference=Sdf.Reference(os.path.dirname(__file__) + '/bottle-filler.usd'))