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

# python lib imports
import typing
from typing import Union, List, Type

from pxr import Tf, Usd, UsdGeom

# omniverse imports
import carb
import omni.ext
import omni
import omni.usd
import omni.kit.app

import re

import numpy as np
import omni.ext
from omni.cae.schema import cae
from omni.cae.schema import sids


# pixar imports
from pxr import Sdf, Gf


def add_int_reference(prim: Usd.Prim, ref_target_path: Sdf.Path) -> None:
    references: Usd.References = prim.GetReferences()
    references.AddInternalReference(ref_target_path)


def add_ext_reference(
    prim: Usd.Prim, ref_asset_path: str, ref_target_path: Sdf.Path
) -> None:
    references: Usd.References = prim.GetReferences()
    references.AddReference(assetPath=ref_asset_path, primPath=ref_target_path)


def find_prims_by_type(stage: Usd.Stage, prim_type: Type[Usd.Typed]) -> List[Usd.Prim]:
    found_prims = [x for x in stage.Traverse() if x.IsA(prim_type)]
    return found_prims


def get_prim_by_path(stage: Usd.Stage, prim_path: Union[str, Sdf.Path]) -> Usd.Prim:
    return stage.GetPrimAtPath(prim_path)


def get_world_transform_xform(
    prim: Usd.Prim,
) -> typing.Tuple[Gf.Vec3d, Gf.Rotation, Gf.Vec3d]:
    world_transform: Gf.Matrix4d = omni.usd.get_world_transform_matrix(prim)
    translation: Gf.Vec3d = world_transform.ExtractTranslation()
    rotation: Gf.Rotation = world_transform.ExtractRotation()
    scale: Gf.Vec3d = Gf.Vec3d(
        *(v.GetLength() for v in world_transform.ExtractRotationMatrix())
    )
    return translation, rotation, scale


# Sanitize USD paths
def make_unique(stage, path):
    global currentPathConflicts
    if not stage.GetPrimAtPath(path):
        return path
    currentPathConflicts = currentPathConflicts + 1
    return Sdf.Path(path.pathString + str(currentPathConflicts))


# Sanitize USD paths
def sanitize_path(path):
    carb.log_info("Sanitizing path : " + path)
    if path[0].isdigit():
        path = "_" + path
    return (
        path.replace(".", "_")
        .replace("#", "_")
        .replace("-", "_")
        .replace(" ", "_")
        .replace("#", "_")
        .replace("<", "_")
        .replace(">", "_")
        .replace(":", "_")
    )


def _make_valid(name: str):
    return Tf.MakeValidIdentifier(name)


def _detect_default_relationship(name):
    clean_name = re.sub(r"[^a-z0-9\s]", "", name.lower())
    items = {
        "cae:sids:elementConnectivity": [
            "elementconnectivity",
            "connectivity",
            "conn",
            "con",
            "elementconnectivity",
        ],
        "cae:sids:elementStartOffset": [
            "elementstartoffset",
            "startoffsets",
            "startoffset",
        ],
        "cae:sids:gridCoordinates": [
            "gridcoordinates",
            "xyz",
            "coords",
            "points",
            "coordinates",
        ],
        "cae:sids:gridCoordinatesX": [
            "gridcoordinatesx",
            "x",
            "coordsx",
            "coords0",
            "pointsx",
            "points0",
        ],
        "cae:sids:gridCoordinatesY": [
            "gridcoordinatesy",
            "y",
            "coordsy",
            "coords1",
            "pointsy",
            "points1",
        ],
        "cae:sids:gridCoordinatesZ": [
            "gridcoordinatesz",
            "z",
            "coordsz",
            "coords2",
            "pointsz",
            "points2",
        ],
    }
    for key, choices in items.items():
        if clean_name.lower() in choices:
            return key
    return None


def _get_field_type(fieldData):
    print(type(fieldData[0]))
    if isinstance(fieldData[0], np.int32):
        return Sdf.ValueTypeNames.IntArray
    if isinstance(fieldData[0], np.int64):
        return Sdf.ValueTypeNames.Int64Array
    if isinstance(fieldData[0], np.float32):
        return Sdf.ValueTypeNames.FloatArray
    if isinstance(fieldData[0], np.float64):
        return Sdf.ValueTypeNames.DoubleArray
    return Sdf.ValueTypeNames.Float3Array


def populate_stage(stage: Usd.Stage, np_arrays, root_prim_name: str, is_sids: bool):
    world = UsdGeom.Xform.Define(stage, "/World")
    stage.SetDefaultPrim(world.GetPrim())

    root = UsdGeom.Scope.Define(
        stage, world.GetPath().AppendChild(_make_valid(root_prim_name))
    )
    rootPath = root.GetPath()
    caeFieldArrayClass = cae.NumPyFieldArray(
        stage.CreateClassPrim(rootPath.AppendChild("NumPyFieldArrayClass"))
    )
    caeFieldArrayClass.CreateAllowPickleAttr().Set(False)
    caeFieldArrayClass.CreateFieldAssociationAttr()

    if is_sids:
        dataset = cae.DataSet.Define(stage, rootPath.AppendChild("NumPyDataSet"))
        sids.UnstructuredAPI.Apply(dataset.GetPrim())
        sidsAPI = sids.UnstructuredAPI(dataset.GetPrim())
        sidsAPI.CreateElementTypeAttr()
        sidsAPI.CreateElementConnectivityRel()
        sidsAPI.CreateElementStartOffsetRel()
        sidsAPI.CreateGridCoordinatesRel()
    else:
        dataset = cae.DataSet.Define(stage, rootPath.AppendChild("NumPyDataSet"))
        cae.PointCloudAPI.Apply(dataset.GetPrim())
        pcAPI = cae.PointCloudAPI(dataset)
        pcAPI.CreateCoordinatesRel()

    scope = UsdGeom.Scope.Define(stage, rootPath.AppendChild("NumPyArrays"))
    names = np_arrays.keys()

    if is_sids:
        # handle special arrays first.
        if "element_range" in names:
            erange = np_arrays["element_range"]
            if erange.ndim == 1 and erange.shape[0] == 2:
                sidsAPI.CreateElementRangeStartAttr().Set(int(erange[0]))
                sidsAPI.CreateElementRangeEndAttr().Set(int(erange[1]))
            names.remove("element_range")
        if "element_type" in names:
            etype = np_arrays["element_type"]
            if etype.ndim == 1 and etype.shape[0] == 1:
                token_map = {
                    2: sids.Tokens.NODE,
                    3: sids.Tokens.BAR_2,
                    5: sids.Tokens.TRI_3,
                    7: sids.Tokens.QUAD_4,
                    10: sids.Tokens.TETRA_4,
                    12: sids.Tokens.PYRA_5,
                    14: sids.Tokens.PENTA_6,
                    17: sids.Tokens.HEXA_8,
                    20: sids.Tokens.MIXED,
                }
                sidsAPI.CreateElementTypeAttr().Set(token_map.get(etype[0]))
            else:
                sidsAPI.CreateElementTypeAttr().Set(sids.Tokens.MIXED)
            names.remove("element_type")

    coords = [None] * 3
    for name in names:
        fieldArray = cae.NumPyFieldArray.Define(
            stage, scope.GetPath().AppendChild(_make_valid(name))
        )
        fieldArray.GetPrim().GetSpecializes().SetSpecializes(
            [caeFieldArrayClass.GetPath()]
        )
        fieldArray.CreateArrayNameAttr().Set(name)

        fieldData = np_arrays[name]
        fieldArray.GetPrim().CreateAttribute(
            "primvars:solution_variable", _get_field_type(fieldData)
        ).Set(fieldData)

        if relName := _detect_default_relationship(name):
            if relName == "cae:sids:gridCoordinatesX":
                coords[0] = fieldArray.GetPath()
            elif relName == "cae:sids:gridCoordinatesY":
                coords[1] = fieldArray.GetPath()
            elif relName == "cae:sids:gridCoordinatesZ":
                coords[2] = fieldArray.GetPath()
            elif relName == "cae:sids:gridCoordinates":
                coords[0] = fieldArray.GetPath()
            else:
                if dataset.GetPrim().HasRelationship(relName):
                    dataset.GetPrim().GetRelationship(relName).SetTargets(
                        {fieldArray.GetPath()}
                    )
                else:
                    dataset.GetPrim().CreateRelationship(
                        f"field:{_make_valid(name)}"
                    ).SetTargets({fieldArray.GetPath()})
        else:
            dataset.GetPrim().CreateRelationship(
                f"field:{_make_valid(name)}"
            ).SetTargets({fieldArray.GetPath()})
            fieldArray.GetFieldAssociationAttr().Set(cae.Tokens.vertex)
    coords = [x for x in filter(lambda i: i is not None, coords)]
    if coords:
        if is_sids:
            sidsAPI.GetGridCoordinatesRel().SetTargets(coords)
        else:
            pcAPI.GetCoordinatesRel().SetTargets(coords)
