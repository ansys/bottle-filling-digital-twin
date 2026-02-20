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

"Messages manager."

import carb
import carb.events
import omni.client.utils
import omni.kit.app
import asyncio

import omni.kit.livestream.messaging as messaging
from .handlers import MessagesHandlerFactory


class MessagesManager:
    """This class manages the stage and its related events.

    Parameters
    ----------
    solver_name : str
        The name of the solver to initialize. The default is ``fluent``.
    """

    def __init__(self, solver_name="fluent"):
        self._subscriptions = []
        self._solvername = solver_name
        self._messages_handler = MessagesHandlerFactory.get_handler(self._solvername)

        # -- register outgoing events/messages
        for o in self._messages_handler.outbound:
            messaging.register_event_type_to_send(o)

        # -- register incoming events/messages
        inbound = {"changeSolver": self._on_change_solver}
        inbound.update(self._messages_handler.inbound)
        for event_type, handler in inbound.items():
            self._subscriptions.append(
                omni.kit.app.get_app()
                .get_message_bus_event_stream()
                .create_subscription_to_pop_by_type(
                    carb.events.type_from_string(event_type), handler
                )
            )

        # Auto-send status messages after startup to notify frontend
        # This is triggered periodically to ensure frontend receives status even if
        # it connects after kit-app is already running
        self._auto_send_task = asyncio.ensure_future(self._auto_send_status_loop())
        carb.log_info("[MessagesManager] Initialized with auto-send status loop")

    async def _auto_send_status_loop(self):
        """Periodically send status messages to ensure frontend receives them."""
        # Initial delay to allow WebRTC connection to establish
        await asyncio.sleep(5)

        # Send status messages periodically for the first 2 minutes
        # This ensures frontend receives status regardless of when it connects
        for i in range(24):  # 24 iterations * 5 seconds = 2 minutes
            try:
                self._send_auto_status()
                carb.log_info(
                    f"[MessagesManager] Auto-sent status messages (iteration {i + 1}/24)"
                )
            except Exception as e:
                carb.log_warn(f"[MessagesManager] Failed to auto-send status: {e}")
            await asyncio.sleep(5)

        carb.log_info("[MessagesManager] Auto-send status loop completed")

    def _send_auto_status(self):
        """Send kitAppReady, rtxStatus, and Fluent health status messages."""
        # Send kit-app ready status
        self._messages_handler.send_message(
            "kitAppReadyResponse", {"ready": True, "solver": self._solvername}
        )

        # Send RTX status
        settings = carb.settings.get_settings()
        rtx_payload = {
            "rtxEnabled": settings.get("/persistent/rtx/modes/pt/enabled") or False,
            "rt2Enabled": settings.get("/persistent/rtx/modes/rt2/enabled") or False,
        }
        self._messages_handler.send_message("rtxStatusResponse", rtx_payload)

        # Send Fluent/solver health status (check actual connection)
        try:
            is_healthy = self._messages_handler._check_connection()
            self._messages_handler.send_message(
                "isInstanceHealthyResponse", {"isHealthy": is_healthy}
            )
        except Exception as e:
            carb.log_warn(f"[MessagesManager] Failed to check solver health: {e}")

    def _on_change_solver(self, event: carb.events.IEvent):
        if event.type == carb.events.type_from_string("changeSolver"):
            self._solvername = event.payload["solver"]
            self._messages_handler = MessagesHandlerFactory.get_handler(
                self._solvername
            )
            self._messages_handler.send_update_message(
                "Changing solver to " + self._solvername
            )

    def on_shutdown(self):
        """Clean up the extension state.

        This is called every time the extension is deactivated.
        """
        # Cancel auto-send task
        if hasattr(self, "_auto_send_task") and self._auto_send_task:
            self._auto_send_task.cancel()
        # Reseting the state.
        self._subscriptions.clear()
