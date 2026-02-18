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

#-- SOLVER ENVIRONMENT VARIABLES --#
$env:VISCOSITY = "0.002"
$env:BOTTLES_PER_HOUR = "50000"
$env:FILLING_HEIGHT = "28"
$env:TIMESTEP_SIZE = "0.001"
$env:BOTTLE_UNITS_1 = "48.0"
$env:BOTTLE_UNITS_2 = "36.0"
$env:BOTTLE_UNITS_3 = "24.0"
$env:FIRST_ITERATION_TIMESTEPS = "500"
$env:CONTENT_PATH = "the_path_to_the_content_folder"

#-- FLUENT ENVIRONMENT VARIABLES --#
$env:FLUENT_HOST = "the_host"
$env:FLUENT_PORT = "the_post"
$env:FLUENT_PASSWORD = "the_password"