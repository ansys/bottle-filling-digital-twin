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

# Explicitly add pip_prebundle to sys.path before importing
import os
import sys

_ext_dir = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)
_pip_prebundle = os.path.join(_ext_dir, "pip_prebundle")
if os.path.isdir(_pip_prebundle) and _pip_prebundle not in sys.path:
    sys.path.insert(0, _pip_prebundle)

# Try to import prebundled ansys-fluent-core, fall back to pip install if not available
pyfluent = None
try:
    import ansys.fluent.core as pyfluent  # noqa: E402
    from ansys.fluent.core.launcher.launch_options import Precision  # noqa: E402

    pyfluent.FLUENT_PRECISION_MODE = Precision.SINGLE
except (ImportError, AttributeError):
    # Prebundled package not found, try runtime pip install (for runtime only)
    try:
        import omni.kit.pipapi

        omni.kit.pipapi.install(
            package="ansys-fluent-core",
            version="0.38.dev3",
            module="ansys.fluent.core",
            ignore_import_check=False,
            ignore_cache=False,
            use_online_index=True,
            surpress_output=False,
            extra_args=[],
        )
        import ansys.fluent.core as pyfluent  # noqa: E402
        from ansys.fluent.core.launcher.launch_options import Precision  # noqa: E402

        pyfluent.FLUENT_PRECISION_MODE = Precision.SINGLE
    except Exception as e:
        # During build/stubgen, this may fail - that's OK
        import carb

        carb.log_warn(
            f"ansys-fluent-core not available: {e}. This is expected during build."
        )

from .extension import CreateSetupExtension  # noqa: E402, F401
