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

"Messages manager."

import carb
import carb.events
import omni.client.utils
import omni.kit.app

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
        # Reseting the state.
        self._subscriptions.clear()
