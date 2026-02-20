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

from unittest import TestCase
from ..mocks.carb import IEvent
from ansys.messaging.messages_management import MessagesManager
from ansys.messaging.handlers import FluentMessagesHandler
from ..mocks.omni import get_app


class TestMessagesManager(TestCase):
    def setUp(self):
        self.manager = MessagesManager()

    def test_new_instance(self):
        self.assertTrue(
            isinstance(self.manager._messages_handler, FluentMessagesHandler)
        )
        self.assertEqual(
            len(self.manager._subscriptions),
            len(self.manager._messages_handler.inbound) + 1,
        )

    def test_shutdown(self):
        self.manager.on_shutdown()
        self.assertEqual(len(self.manager._subscriptions), 0)

    def test_on_change_solver(self):
        self.manager._on_change_solver(
            IEvent(type="changeSolver", payload={"solver": "fluent"})
        )
        type, message = (
            get_app().get_message_bus_event_stream().pop_message("updateMessageText")
        )
        assert type == "updateMessageText"
        assert message == {"text": "Changing solver to fluent"}
