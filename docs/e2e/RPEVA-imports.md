# RPEVA - Camp Admin Imports

## Ruta

- Panel: `https://camp-admin-theta.vercel.app`
- Admin route: `/imports`
- Backend: Cloud Run API via `VITE_API_BASE_URL`

## Precondiciones

- Authenticated admin/root admin user.
- Camp loaded in context.
- Active Daycamp and Overnight weeks selected.
- Recommended setup:
  - `/weeks`
  - display name: `E2E Week 1`
  - overnight: `2026-06-01` to `2026-06-07`
  - daycamp is created as the paired weekday week.

## Ejecución

1. Open `/imports`.
2. Confirm active target labels:
   - Daycamp: `E2E Week 1`
   - Overnight: `E2E Week 1`
3. Select import type.
4. Choose one CSV fixture or paste CSV text.
5. For destructive imports, check replace and type `REPLACE`.
6. Click `Import`.

## Verificación

- Success card shows:
  - `Created <n>`
  - `skipped <n>`
  - `errors <n>`
- Last idempotency key is displayed for backend log tracing.
- For row errors, table shows row/error/message.
- Re-importing the same non-replace CSV should not create duplicate campers/staff.

## Artefactos

- `csv/daycamp-campers.csv`
- `csv/overnight-campers.csv`
- `csv/staff-both.csv`
- `csv/slots.csv`
- `csv/cabin-activities-daycamp.csv`
- `csv/cabin-activities-overnight.csv`

## Import Matrix

| Import type | Target | Endpoint family |
| --- | --- | --- |
| Daycamp Campers | active daycamp week | `/camps/:campId/weeks/:weekId/campers/import` |
| Overnight Campers | active overnight week | `/camps/:campId/weeks/:weekId/campers/import` |
| Mixed Campers | both active weeks | `/camps/:campId/campers/import-mixed` |
| Activity Slots | active overnight week | `/camps/:campId/weeks/:weekId/slots/import` |
| Staff - Daycamp | active daycamp week | `/camps/:campId/weeks/:weekId/staff-assignments/import` |
| Staff - Overnight | active overnight week | `/camps/:campId/weeks/:weekId/staff-assignments/import` |
| Staff - Both Weeks | both active weeks | two staff import calls with `allow_mixed=true` |
| Cabin Activities - Daycamp | active daycamp week | `/camps/:campId/weeks/:weekId/cabin-activities/import` |
| Cabin Activities - Overnight | active overnight week | `/camps/:campId/weeks/:weekId/cabin-activities/import` |

## Known Limits

- The panel does not yet run mobile-level CSV preflight validation.
- Cabin/group auto-create precheck is not implemented in the panel; backend validation is the source of truth.
- Staff import does not auto-invite users.
