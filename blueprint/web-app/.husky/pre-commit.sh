#!/usr/bin/env sh
. "$(dirname "$0")/_/h"

cd blueprint/web-app && pnpm run lint:fix && pnpm run format