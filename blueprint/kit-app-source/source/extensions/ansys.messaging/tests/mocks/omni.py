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

from enum import Enum
import json


class Timeline:
    def set_current_time(self, current_time_in_s):
        pass


class Stage:
    def Export(self, usdFilePath):
        pass


class Context:
    def open_stage(self, path, load_set):
        pass

    def get_stage(self):
        return Stage()

    def new_stage(self):
        return Stage()


class NotificationStatus(Enum):
    INFO = 1
    WARNING = 2
    ERROR = 3


class MessageBus:
    def __init__(self):
        self.queue = []

    def dispatch(self, event_type: str, payload: json):
        self.queue.append((event_type, payload))

    def pump(self):
        pass

    def create_subscription_to_pop_by_type(self, arg1, arg2):
        pass


class OmniApp:
    def __init__(self):
        self.message_bus = MessageBus()

    def get_message_bus_event_stream(self):
        return self.message_bus


def get_context():
    return Context()


def get_timeline_interface():
    return Timeline()


def execute_action(p1, p2):
    pass


app = OmniApp()


def get_app():
    return app
