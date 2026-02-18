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


class Events:
    def register_callback(self, event_type, callback):
        pass


class Visualization:
    def create_hierarchy_and_surfaces(self, mdl_material_path, mdl_material_name):
        pass

    def save_scalar_field_npz_pointcloud(self, arg1, arg2):
        pass

    def fill_plot(self):
        pass

    def add_point_algorithm(
        self,
        sv_name_colors="SV_VOF",
        dataset_path="/World/live/NumPyDataSet",
        prim_path="/Fluent/Pointcloud",
    ):
        pass

    def execute_template_script(self, path):
        pass


class ViscosityValue:
    def set_state(self, viscosity):
        pass


class Viscosity:
    value = ViscosityValue()


class Liquid:
    viscosity = Viscosity()


class Materials:
    fluid = {"myliquid": Liquid()}


class Setup:
    materials = Materials()


class Settings:
    setup = Setup()


class Solver:
    events: Events = Events()
    settings = Settings()


class FluentSolution:
    def get_solver(self):
        return Solver()

    def run_journal(self, journal_path):
        pass


class FluentSession:
    _solution: FluentSolution = FluentSolution()
    _visualization = Visualization()

    def connect(self, ihost, iport, ipassword, icleanup_on_exit=True):
        if ihost == "fail":
            raise Exception("Connection failed")

    def load_case_file(self, design_file):
        pass

    def get_solver(self):
        return self._solution.get_solver()

    def get_visualization(self):
        return self._visualization

    def run_journal(self, journal_path):
        pass
