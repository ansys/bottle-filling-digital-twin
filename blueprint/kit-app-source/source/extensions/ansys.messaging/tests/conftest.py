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
import sys
import types
from typing import Dict, Any, Callable
from unittest.mock import MagicMock
from .mocks.fluent_session import FluentSession
from .mocks.omni import (
    NotificationStatus,
    get_app,
    get_context,
    get_timeline_interface,
    execute_action,
)
from .mocks.carb import IEvent


def mock_factory(
    module_path: str,
    attributes: Dict[str, Any] = None,
    callables: Dict[str, Callable] = None,
):
    """
    Creates and registers a mock module with optional attributes and callables.

    Args:
        module_path (str): Full dotted path of the module (e.g., 'carb.tokens').
        attributes (Dict[str, Any]): Static attributes to attach to the module.
        callables (Dict[str, Callable]): Functions or methods to attach to the module.
    """
    parts = module_path.split(".")
    for i in range(1, len(parts) + 1):
        name = ".".join(parts[:i])
        if name not in sys.modules:
            sys.modules[name] = types.ModuleType(name)
        # Attach submodules to their parent
        if i > 1:
            parent = sys.modules[".".join(parts[: i - 1])]
            setattr(parent, parts[i - 1], sys.modules[name])

    module = sys.modules[module_path]

    # Add attributes
    if attributes:
        for key, value in attributes.items():
            setattr(module, key, value)

    # Add callables
    if callables:
        for key, func in callables.items():
            setattr(module, key, func)

    return module


def pytest_sessionstart(session):
    def create_mock_module(module_path, attributes=None, callables=None):
        """Helper function to create mock modules."""
        mock_factory(module_path, attributes=attributes, callables=callables)

    # Mocking modules with attributes and callables
    mock_modules = [
        ("omni.ext", {"IExt": type("IExt", (), {})}, None),
        ("omni.kit.app", None, {"get_app": get_app}),
        (
            "omni.usd",
            {
                "UsdContextInitialLoadSet": type(
                    "UsdContextInitialLoadSet", (), {"LOAD_ALL": "load_all"}
                )
            },
            {"get_context": get_context},
        ),
        ("omni.timeline", None, {"get_timeline_interface": get_timeline_interface}),
        (
            "carb",
            None,
            {
                "log_error": lambda msg: print(f"Error: {msg}"),
                "log_info": lambda msg: print(str(msg)),
                "log_warn": lambda msg: print(str(msg)),
            },
        ),
        (
            "carb.tokens",
            None,
            {
                "get_tokens_interface": lambda: types.SimpleNamespace(
                    resolve=lambda path: f"/mocked/path/for/{path}"
                )
            },
        ),
        ("carb.events", {"IEvent": IEvent}, {"type_from_string": lambda x: x}),
        (
            "carb.settings",
            None,
            {
                "get_settings": lambda: types.SimpleNamespace(
                    get=lambda key, default=None: None
                )
            },
        ),
        (
            "omni.kit.notification_manager",
            {"NotificationStatus": NotificationStatus},
            {
                "post_notification": lambda msg,
                duration=5,
                status=NotificationStatus.INFO: print(
                    f"Notification: {msg}, Duration: {duration}, Status: {status}"
                )
            },
        ),
        ("omni.kit.actions.core", None, {"execute_action": execute_action}),
        (
            "omni.kit.livestream.messaging",
            None,
            {"register_event_type_to_send": lambda arg: "mock"},
        ),
        (
            "omni.kit.commands",
            None,
            {"execute": lambda alg, dataset_path, prim_path: None},
        ),
        ("omni.client.utils", None, None),
        ("pxr.Usd", None, None),
        (
            "omni.kit.viewport.utility",
            None,
            {
                "get_active_viewport_camera_string": lambda: "/OmniverseKit_Persp",
                "get_active_viewport": lambda: MagicMock(),
            },
        ),
    ]

    for module_path, attributes, callables in mock_modules:
        create_mock_module(module_path, attributes, callables)

    # Mocking specific ansys modules
    ansys_mocks = {
        "ansys.solver.fluent.window": MagicMock(get_ip_port_password="mocked"),
        "ansys.solver.fluent.session": MagicMock(FluentSession=FluentSession),
        "ansys.solver.fluent.visualization": MagicMock(
            TRANSIENT_FIELD_NAMES=MagicMock()
        ),
        "ansys.fluent.core": MagicMock(SolverEvent=MagicMock()),
    }

    for module_path, mock in ansys_mocks.items():
        sys.modules[module_path] = mock

    # Setting environment variables
    env_vars = {
        "VISCOSITY": "0.002",
        "BOTTLES_PER_HOUR": "50000",
        "FILLING_HEIGHT": "28",
        "TIMESTEP_SIZE": "0.001",
        "BOTTLE_UNITS_1": "48.0",
        "BOTTLE_UNITS_2": "36.0",
        "BOTTLE_UNITS_3": "24.0",
        "FIRST_ITERATION_TIMESTEPS": "500",
        "FLUENT_HOST": "some_host",
        "FLUENT_PORT": "12345",
        "FLUENT_PASSWORD": "some_pass",
    }

    os.environ.update(env_vars)

    # Create the test content directory if it doesn't exist
    # Use the content folder under blueprint directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    blueprint_dir = os.path.join(current_dir, "..", "..", "..", "..", "..")
    test_content_path = os.path.join(blueprint_dir, "content")
    os.makedirs(test_content_path, exist_ok=True)
    os.environ["CONTENT_PATH"] = os.path.abspath(test_content_path)
