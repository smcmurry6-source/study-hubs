#!/bin/sh
# Chromium won't start as root without --no-sandbox, and cloud sessions run as root. Point CHROME_PATH at this file
# for scripts that launch Chrome themselves (the taste skill's inspect.mjs and scenes.mjs, anima's checks).
# CHROME_BIN overrides the browser (default: the container's preinstalled Chromium).
exec "${CHROME_BIN:-/opt/pw-browsers/chromium}" --no-sandbox "$@"
