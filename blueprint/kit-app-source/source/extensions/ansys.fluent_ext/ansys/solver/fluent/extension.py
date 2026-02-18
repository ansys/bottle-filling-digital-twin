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


import asyncio
import logging
from pathlib import Path

import carb.events
import carb.settings
import omni.ext
import omni.kit.app
import omni.kit.commands
import omni.kit.menu.utils
import omni.kit.ui

import numpy as np
from pxr import Usd
from omni.cae.data.delegates import DataDelegateBase
from omni.kit.quicklayout import QuickLayout


async def _load_layout(layout_file: str, keep_windows_open: bool = False) -> None:
    """Loads a provided layout file and ensures the viewport is set to FILL."""
    try:
        # few frames delay to avoid the conflict with the
        # layout of omni.kit.mainwindow
        for _ in range(3):
            await omni.kit.app.get_app().next_update_async()
        QuickLayout.load_file(layout_file, keep_windows_open)
        omni.kit.actions.core.execute_action("omni.kit.ui.actions", "toggle_ui")
    except Exception:
        QuickLayout.load_file(layout_file)


class NumpyDataDelegate(DataDelegateBase):
    def __init__(self, extId: str):
        super().__init__(extId)

    def get_field_array(self, prim: Usd.Prim, time: Usd.TimeCode) -> np.ndarray:
        print("solution_variable at timecode", time)
        return np.array(prim.GetAttribute("primvars:solution_variable").Get(time))

    def can_provide(self, prim: Usd.Prim) -> bool:
        return prim and prim.IsValid()


class CreateSetupExtension(omni.ext.IExt):
    """Create Final Configuration"""

    def on_startup(self, _ext_id):
        # Activate RTX Real-time 2.0
        import carb.settings

        settings = carb.settings.get_settings()
        settings.set("/persistent/rtx/modes/pt/enabled", True)
        settings.set("/persistent/rtx/modes/rt2/enabled", True)
        settings.set("/rtx/rtpt/maxBounces", 4)
        settings.set("/rtx/rtpt/maxSpecularAndTransmissionBounces", 4)

        # Note: RTX status notification is now sent by FluentMessagesHandler._on_is_instance_healthy
        # after the WebRTC connection is established

        """
        setup the window layout, menu, final configuration
        of the extensions etc
        """
        self._settings = carb.settings.get_settings()

        telemetry_logger = logging.getLogger("idl.telemetry.opentelemetry")
        telemetry_logger.setLevel(logging.ERROR)

        from omni.cae.data import get_data_delegate_registry

        self._registry = get_data_delegate_registry()
        self._delegate = NumpyDataDelegate(_ext_id)
        self._registry.register_data_delegate(self._delegate, priority=10)

        # this is a work around as some Extensions don't properly setup their
        # default settings in time
        self._set_defaults()

        # adjust couple of viewport settings
        self._settings.set("/app/viewport/boundingBoxes/enabled", True)

        # Force enable Axis, Grid, Outline and Lights
        if self._settings.get("/app/create/forceViewportSettings"):
            display_options = self._settings.get(
                "/persistent/app/viewport/displayOptions"
            )
            # Note: flags are from omni/kit/ViewportTypes.h
            show_flag_axis = 1 << 1
            show_flag_grid = 1 << 6
            show_flag_selection_outline = 1 << 7
            show_flag_light = 1 << 8
            display_options = (
                display_options
                | (show_flag_axis)
                | (show_flag_grid)
                | (show_flag_selection_outline)
                | (show_flag_light)
            )
            self._settings.set(
                "/persistent/app/viewport/displayOptions", display_options
            )
            # Make sure these are in sync from changes above
            self._settings.set("/app/viewport/show/lights", True)
            self._settings.set("/app/viewport/grid/enabled", True)
            self._settings.set("/app/viewport/outline/enabled", True)

            # Make sure any action-graph setup locking out user from HUD does
            # not persist across re-launch
            self._settings.set(
                "/persistent/app/viewport/Viewport/Viewport0/hud/visible", True
            )
            self._settings.set(
                "/persistent/app/viewport/Viewport 2/Viewport0/hud/visible", True
            )

        # Set the layout
        ext_path = Path(
            carb.tokens.get_tokens_interface().resolve("${ansys.fluent_ext}")
        )
        layout_file = f"{ext_path}/layouts/default.json"
        asyncio.ensure_future(_load_layout(layout_file, True))

        # These two settings do not co-operate well on ADA cards, so for
        # now simulate a toggle of the present thread on startup to work around
        if self._settings.get(
            "/exts/omni.kit.renderer.core/present/enabled"
        ) and self._settings.get("/exts/omni.kit.widget.viewport/autoAttach/mode"):

            async def _toggle_present(settings, n_waits: int = 1):
                async def _toggle_setting(app, enabled: bool, n_waits: int):
                    for _ in range(n_waits):
                        await app.next_update_async()
                    settings.set(
                        "/exts/omni.kit.renderer.core/present/enabled", enabled
                    )

                app = omni.kit.app.get_app()
                await _toggle_setting(app, False, n_waits)
                await _toggle_setting(app, True, n_waits)

            asyncio.ensure_future(_toggle_present(self._settings))

        # Setting and Saving FSD as a global change in preferences
        # Requires to listen for changes at the local path to update
        # Composer's persistent path.
        fabric_app_setting = self._settings.get("/app/useFabricSceneDelegate")
        fabric_persistent_setting = self._settings.get(
            "/persistent/app/useFabricSceneDelegate"
        )
        fabric_enabled: bool = (
            fabric_app_setting
            if fabric_persistent_setting is None
            else fabric_persistent_setting
        )

        self._settings.set("/app/useFabricSceneDelegate", fabric_enabled)

        self._sub_fabric_delegate_changed = omni.kit.app.SettingChangeSubscription(
            "/app/useFabricSceneDelegate", self._on_fabric_delegate_changed
        )

        startup_time = omni.kit.app.get_app_interface().get_time_since_start_s()
        self._settings.set("/crashreporter/data/startup_time", f"{startup_time}")

    def _set_defaults(self):
        """
        This is trying to setup some defaults for extensions to avoid warnings.
        """
        self._settings.set_default("/persistent/app/omniverse/bookmarks", {})
        self._settings.set_default("/persistent/app/stage/timeCodeRange", [0, 100])

        self._settings.set_default(
            "/persistent/audio/context/closeAudioPlayerOnStop", False
        )

        self._settings.set_default(
            "/persistent/app/primCreation/PrimCreationWithDefaultXformOps", True
        )
        self._settings.set_default(
            "/persistent/app/primCreation/DefaultXformOpType",
            "Scale, Rotate, Translate",
        )
        self._settings.set_default(
            "/persistent/app/primCreation/DefaultRotationOrder", "ZYX"
        )
        self._settings.set_default(
            "/persistent/app/primCreation/DefaultXformOpPrecision", "Double"
        )

        # omni.kit.property.tagging
        self._settings.set_default(
            "/persistent/exts/omni.kit.property.tagging/showAdvancedTagView", False
        )
        self._settings.set_default(
            "/persistent/exts/omni.kit.property.tagging/showHiddenTags", False
        )
        self._settings.set_default(
            "/persistent/exts/omni.kit.property.tagging/modifyHiddenTags", False
        )

        self._settings.set_default(
            "/rtx/sceneDb/ambientLightIntensity", 0.0
        )  # set default ambientLight intensity to Zero

    def _on_fabric_delegate_changed(
        self, _v: str, event_type: carb.settings.ChangeEventType
    ):
        if event_type == carb.settings.ChangeEventType.CHANGED:
            enabled: bool = self._settings.get_as_bool("/app/useFabricSceneDelegate")
            self._settings.set("/persistent/app/useFabricSceneDelegate", enabled)

    def on_shutdown(self):
        """Clean up the extension"""
        self._sub_fabric_delegate_changed = None
