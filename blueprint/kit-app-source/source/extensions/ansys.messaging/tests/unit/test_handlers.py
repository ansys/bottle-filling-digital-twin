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
from unittest import TestCase
from unittest.mock import patch
from ansys.messaging.handlers import FluentMessagesHandler, Connection
from ..mocks.omni import get_app
from ..mocks.carb import IEvent
from io import StringIO


class TestFluentMessagesHandler(TestCase):
    def setUp(self):
        self.handler = FluentMessagesHandler()
        os.environ["FLUENT_HOST"] = "some_host"
        os.environ["FLUENT_PORT"] = "12345"
        os.environ["FLUENT_PASSWORD"] = "some_pass"

    def test_check_fluent_connection_success(self):
        result = self.handler._check_connection()
        self.assertTrue(result)
        self.assertTrue(self.handler._is_connected)

    def test_check_fluent_connection_failure(self):
        os.environ["FLUENT_HOST"] = "fail"
        result = self.handler._check_connection()
        self.assertFalse(result)
        self.assertFalse(self.handler._is_connected)

    def test_on_get_current_state(self):
        self.handler._on_get_current_state(IEvent(type="getCurrentState"))
        type, message = (
            get_app().get_message_bus_event_stream().pop_message("currentStateResponse")
        )
        assert type == "currentStateResponse"
        assert message == {
            "canInitialize": False,
            "canRun": False,
            "viscosity": float(os.environ.get("VISCOSITY")),
            "bottlesPerHour": int(os.environ.get("BOTTLES_PER_HOUR")),
            "fillingHeight": float(os.environ.get("FILLING_HEIGHT")),
            "lastOpendedDesign": None,
        }

    def test_on_design_file_changed_negative(self):
        self.handler._on_design_file_changed(
            IEvent(type="loadDesignFile", payload={"url": "some_url"})
        )
        type, message = (
            get_app()
            .get_message_bus_event_stream()
            .pop_message("loadDesignFileResponse")
        )
        assert message == {
            "result": "error",
            "error": "Can't connect to the Fluent session",
        }

    @patch("ansys.messaging.handlers.os.path.exists", return_value=True)
    def test_on_design_file_changed_positive(self, mock_exists):
        self.handler._on_design_file_changed(
            IEvent(type="loadDesignFile", payload={"url": "some_url"})
        )
        type, message = (
            get_app()
            .get_message_bus_event_stream()
            .pop_message("loadDesignFileResponse")
        )
        assert message == {"result": "success", "error": ""}

    def test_run_journal_parallel(self):
        self.handler._check_connection()
        self.handler.run_journal_parallel("some/path")
        type, message = (
            get_app()
            .get_message_bus_event_stream()
            .pop_message("runCalculationsResponse")
        )
        assert message == {"result": "success", "error": ""}

    @patch("ansys.messaging.handlers.open", return_value=StringIO(""))
    def test_on_run_calculations(self, open_mock):
        self.handler._on_run_calculations(
            IEvent(
                type="runCalculations",
                payload={
                    "numTimesteps": 1,
                    "viscosity": 1,
                    "bottlesPerHour": 1,
                    "tolerance": 1,
                },
            )
        )
        type, message = (
            get_app()
            .get_message_bus_event_stream()
            .pop_message("runCalculationsResponse")
        )
        assert message == {"result": "success", "error": ""}

    @patch("ansys.messaging.handlers.open", return_value=StringIO(""))
    def test_on_post_process_sv(self, open_mock):
        self.handler._on_post_process_sv(
            IEvent(
                type="postProcessSolutionVariable",
                payload={"sv": "some_sv", "fillingHeight": 1, "freeSurfaceOnly": True},
            )
        )
        type, message = (
            get_app()
            .get_message_bus_event_stream()
            .pop_message("postProcessSolutionVariableResponse")
        )
        assert message == {"result": "success", "error": ""}

    def test_on_open_solved_case(self):
        self.handler._on_open_solved_case(
            IEvent(type="openSolvedCase", payload={"usdFile": "test_case.usd"})
        )
        type, message = (
            get_app()
            .get_message_bus_event_stream()
            .pop_message("openSolvedCaseResponse")
        )
        assert message == {"result": "success", "error": ""}

    def test_on_store_solved_case(self):
        self.handler._on_store_solved_case(
            IEvent(type="storeSolvedCase", payload={"case_name": "test_case"})
        )
        type, message = (
            get_app()
            .get_message_bus_event_stream()
            .pop_message("storedSolvedCaseResponse")
        )
        assert message == {"result": "success", "error": ""}

    def test_on_progress_updated(self):
        class EventInfo:
            def __init__(self, message, percentage):
                self.message = message
                self.percentage = percentage

        ei = EventInfo("Progressing", 50)
        self.handler.on_progress_updated("some session", ei)
        type, message = (
            get_app().get_message_bus_event_stream().pop_message("updateStatusText")
        )
        assert message == {"text": "Progressing - 50%"}

    def test_send_update_message(self):
        self.handler.send_update_message("Some update")
        type, message = (
            get_app().get_message_bus_event_stream().pop_message("updateMessageText")
        )
        assert message == {"text": "Some update"}

    def test_send_update_status(self):
        self.handler.send_update_status("Some status")
        type, message = (
            get_app().get_message_bus_event_stream().pop_message("updateStatusText")
        )
        assert message == {"text": "Some status"}

    def test_send_message(self):
        self.handler.send_message("TestType", {"key": "value"})
        type, message = get_app().get_message_bus_event_stream().pop_message("TestType")
        assert message == {"key": "value"}

    def test_on_timestep_changed(self):
        self.handler._on_timestep_changed(
            IEvent(type="timestepChanged", payload={"timestep": 5})
        )

    def test_on_toggle_fullscreen(self):
        self.handler._on_toggle_fullscreen(IEvent(type="toggleFullscreen"))

    def test_on_is_instance_healthy_positive(self):
        self.handler._on_is_instance_healthy(IEvent(type="isInstanceHealthy"))
        type, message = (
            get_app()
            .get_message_bus_event_stream()
            .pop_message("isInstanceHealthyResponse")
        )
        assert message == {"isHealthy": True}

    @patch(
        "ansys.messaging.handlers.FluentMessagesHandler._connect",
        return_value=Connection(False),
    )
    def test_on_is_instance_healthy_negative(self, fake_connect):
        self.handler._on_is_instance_healthy(IEvent(type="isInstanceHealthy"))
        type, message = (
            get_app()
            .get_message_bus_event_stream()
            .pop_message("isInstanceHealthyResponse")
        )
        assert message == {"isHealthy": False}
