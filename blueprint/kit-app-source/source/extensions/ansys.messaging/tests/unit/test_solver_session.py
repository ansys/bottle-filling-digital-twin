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

import pytest
from ansys.messaging.solver_session import (
    SolverSessionHelper,
    FluentSolverSessionHelper,
    SolverSessionHelperFactory,
)
from ..mocks.fluent_session import FluentSession


@pytest.fixture
def set_env_vars(monkeypatch):
    monkeypatch.setenv("FLUENT_HOST", "127.0.0.1")
    monkeypatch.setenv("FLUENT_PORT", "12345")
    monkeypatch.setenv("FLUENT_PASSWORD", "secret")


# verify that the superclass methods raise NotImplementedError
def test_solver_session_helper_base_methods_raise():
    helper = SolverSessionHelper()
    with pytest.raises(NotImplementedError):
        helper.get_ip_port_password()
    with pytest.raises(NotImplementedError):
        helper.get_session_object()


def test_fluent_solver_session_helper_success(set_env_vars):
    helper = FluentSolverSessionHelper()
    ip, port, password = helper.get_ip_port_password()
    assert ip == "127.0.0.1"
    assert port == 12345
    assert password == "secret"


def test_fluent_solver_session_helper_missing_env(set_env_vars, monkeypatch):
    monkeypatch.delenv("FLUENT_HOST", raising=False)

    helper = FluentSolverSessionHelper()
    with pytest.raises(ValueError, match="FLUENT_HOST environment variable is not set"):
        helper.get_ip_port_password()


def test_get_session_object_returns_fluent_session():
    helper = FluentSolverSessionHelper()
    session = helper.get_session_object()
    assert isinstance(session, FluentSession)


def test_solver_session_helper_factory_success():
    helper = SolverSessionHelperFactory.create_solver_session("fluent")
    assert isinstance(helper, FluentSolverSessionHelper)


def test_solver_session_helper_factory_invalid_solver():
    with pytest.raises(ValueError, match="Unsupported solver type: invalid"):
        SolverSessionHelperFactory.create_solver_session("invalid")
