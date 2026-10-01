#!/bin/sh
set -eu

test_data_dir="$(mktemp -d)"
trap 'rm -rf "$test_data_dir"' EXIT HUP INT TERM

DATA_DIR="$test_data_dir" LIFEBOOK_STORAGE_BACKEND=json PYTHONPATH=. python3 tests/test_api.py
