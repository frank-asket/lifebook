#!/bin/sh
set -eu

test_data_dir="$(mktemp -d)"
trap 'rm -rf "$test_data_dir"' EXIT HUP INT TERM

api_data_dir="$test_data_dir/api"
mkdir -p "$api_data_dir"
for fixture in groups library livingWord verses journeys; do
	cp "data/$fixture.json" "$api_data_dir/$fixture.json"
done

DATA_DIR="$test_data_dir/unit" LIFEBOOK_STORAGE_BACKEND=json PYTHONPATH=. python3 -m unittest tests.test_prayer_sanctuary
DATA_DIR="$api_data_dir" LIFEBOOK_STORAGE_BACKEND=json TESTING=true PYTHONPATH=. python3 tests/test_api.py
