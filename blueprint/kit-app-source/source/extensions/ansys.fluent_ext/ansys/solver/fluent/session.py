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

import ansys.fluent.core as pyfluent
from .visualization import FluentSolutionUSDVisualization


class FluentSession:
    def __init__(self):
        """Handle the Fluent session."""
        self.__solver = None
        self._visualization = None

    def connect(self, host, port, password):
        """Connect to the Fluent session."""
        print("Connecting to", host + ":" + str(port) + "@" + password)
        self.__solver = pyfluent.connect_to_fluent(
            ip=host,
            port=port,
            cleanup_on_exit=True,
            password=password,
            allow_remote_host=True,
            insecure_mode=True,
        )

    def run_journal(self, journal_filepath):
        """Run a Journal file."""
        self.__solver.settings.file.read_journal(file_name_list=[journal_filepath])

    def initialize_solver(self):
        """Initialize the Solver."""
        self.__solver.solution.initialization.hybrid_initialize()

    def solve(self, iter_count):
        """Solve @iter_count iterations"""
        self.__solver.solution.run_calculation.iterate(iter_count=iter_count)

    def solve_transient(self, iter_count, num_timesteps, timesteps_size):
        """Solve @iter_count iterations for transient data"""
        self.__solver.solution.run_calculation.dual_time_iterate(
            time_step_count=num_timesteps,
            incremental_time=timesteps_size,
            max_iter_per_step=iter_count,
        )

    def load_case_file(self, filepath):
        """Loads a new case file and create USD visualization."""
        self.__solver.file.read(file_name=filepath, file_type="case")
        self._visualization = FluentSolutionUSDVisualization(self.__solver)

    def get_visualization(self):
        return self._visualization

    def get_solver(self):
        return self.__solver

    def is_connected(self):
        return self.__solver is not None
