# Camp Admin E2E Fixtures

Use these CSV files from the hosted admin panel:

1. Open `/weeks` and create `E2E Week 1` with overnight dates `2026-06-01` to `2026-06-07`.
2. Open `/campers`.
3. Select the day camp week and import `csv/daycamp-campers.csv`.
4. Select the overnight week and import `csv/overnight-campers.csv`.

The importer treats CSV as authoritative for the selected camp week. Re-importing the same file should update matching campers instead of duplicating them.
