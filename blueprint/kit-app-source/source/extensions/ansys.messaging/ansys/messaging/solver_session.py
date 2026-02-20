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
from ansys.solver.fluent.session import FluentSession


class SolverSessionHelper:
    def get_ip_port_password(self) -> tuple:
        raise NotImplementedError("This method should be implemented in a subclass.")

    def get_session_object(self) -> object:
        raise NotImplementedError("This method should be implemented in a subclass.")


class FluentSolverSessionHelper(SolverSessionHelper):
    session: FluentSession = None

    def get_ip_port_password(self):
        fluent_host = os.environ.get("FLUENT_HOST", None)
        if fluent_host is None:
            raise ValueError("FLUENT_HOST environment variable is not set")

        _fluent_port = os.environ.get("FLUENT_PORT", None)
        if _fluent_port is None:
            raise ValueError("FLUENT_PORT environment variable is not set")
        fluent_port = int(_fluent_port)

        fluent_password = os.environ.get("FLUENT_PASSWORD", None)
        if fluent_password is not None:
            return fluent_host, fluent_port, fluent_password
        temp_dir = os.environ.get("TEMP", None)
        if temp_dir is None:
            raise ValueError(
                "FLUENT_PASSWORD and TEMP environment variables are not set. Set either of them."
            )
        password_file_path = os.path.join(temp_dir, "serverinfo.txt")
        if not os.path.exists(password_file_path):
            raise ValueError(
                f"Password file {password_file_path} does not exist. "
                "Set FLUENT_PASSWORD or ensure the file is created by fluent session "
                "and mounted if this is running in a docker container."
            )
        with open(password_file_path, "r") as f:
            lines = f.readlines()
            if len(lines) < 2:
                raise ValueError(f"Password not present in {password_file_path}")
            fluent_password = lines[1].strip()
        return fluent_host, fluent_port, fluent_password

    def get_session_object(self):
        if self.session is None:
            self.session = FluentSession()
        return self.session


class SolverSessionHelperFactory:
    solvers: dict = {
        "fluent": FluentSolverSessionHelper,
        # Add other solvers here
    }

    @staticmethod
    def create_solver_session(solver_type: str) -> SolverSessionHelper:
        solver_class = SolverSessionHelperFactory.solvers.get(solver_type.lower())
        if not solver_class:
            raise ValueError(f"Unsupported solver type: {solver_type}")
        return solver_class()
