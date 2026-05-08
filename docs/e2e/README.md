# Camp Admin E2E Fixtures

Use these CSV files from the hosted admin panel:

1. Open `/weeks` and create `E2E Week 1` with overnight dates `2026-06-01` to `2026-06-07`.
2. Open `/imports`.
3. Confirm the active daycamp and overnight targets.
4. Import `csv/daycamp-campers.csv` with type `Daycamp Campers`.
5. Import `csv/overnight-campers.csv` with type `Overnight Campers`.
6. Import `csv/staff-both.csv` with type `Staff - Both Weeks` after camper imports create the groups/cabins.
7. Optional: import `csv/slots.csv` after creating matching activities in `/activities`.

The importer treats CSV as authoritative for the selected camp week. Re-importing the same file should update matching campers instead of duplicating them.

See `RPEVA-imports.md` for the route/precondition/execution/verification/artifact checklist.
