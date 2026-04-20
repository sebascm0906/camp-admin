# Camp Admin V1 Design

## Goal

Convert `camp-admin` from a demo CRUD shell into a real admin panel for a single camp, backed by the existing `camp-app` FastAPI backend and its PostgreSQL database access. The panel must use Firebase-backed authentication, respect the backend's current one-user-one-camp membership model, and expose the main camp-scoped admin workflows.

## Product Scope

### In Scope

- Real authentication with Firebase ID tokens
- Session bootstrap against `camp-app` auth endpoints
- Camp-scoped admin UI for the authenticated user's effective camp
- Admin modules for:
  - dashboard
  - campers
  - weeks
  - activities
  - slots
  - users
  - invitations
  - forms
  - form submissions
- Read and write operations through the existing backend API

### Out of Scope

- Multi-camp superadmin support
- Direct database access from the frontend
- Generic table explorer for arbitrary database tables
- Replacing or redesigning backend authorization rules
- Backend schema changes unless required by a concrete integration gap found during implementation

## Constraints

- `camp-admin` must treat `camp-app` as the source of truth for business rules and authorization.
- The current backend model enforces one user per camp via `camp_memberships` and `user_identity.py`; V1 must preserve that behavior.
- The panel must not infer access rules client-side beyond what is needed for navigation and display.
- Writes must go through existing API endpoints so validations remain centralized in the backend.

## Existing System Facts

### Frontend (`camp-admin`)

- Current login is fake and stores a hardcoded token locally.
- Current resource UI is generic and talks to `/admin/*`.
- The existing frontend is useful as a shell, but not as a stable integration layer.

### Backend (`camp-app`)

- Firebase identity is already implemented in backend auth.
- Effective camp access is resolved from active `camp_memberships`.
- Camp-scoped user and invitation management already exist.
- Forms data exists in both:
  - a unified `forms` table
  - a higher-level `form-submissions` endpoint aggregating submissions from specialized tables

## Architecture

`camp-admin` will become a dedicated React frontend for the `camp-app` backend. Authentication starts in Firebase, the Firebase ID token is attached as a Bearer token to API requests, and the app initializes itself from `/api/v1/auth/status` and `/api/v1/auth/me`.

Once authenticated, the app will derive a single effective camp context from the backend response. All feature screens will operate strictly within that camp. The frontend will use feature-specific API modules instead of a generic resource client so each screen can match the backend contracts that already exist.

## User Flow

### 1. Login

- User signs in with Firebase.
- Frontend retrieves Firebase ID token.
- Frontend calls:
  - `GET /api/v1/auth/status`
  - `GET /api/v1/auth/me`
- If the user is not invited or not active, the UI blocks admin access.
- If the user has a valid active membership, the app enters the admin panel.

### 2. App Bootstrap

- Frontend loads authenticated user data and effective camp membership.
- Frontend stores only session state needed for UI behavior.
- Frontend does not store authorization rules beyond the current user payload.

### 3. Camp-Scoped Admin Work

- All navigation and API calls are scoped to the authenticated camp.
- The panel exposes only modules that correspond to real backend routes and real business entities.

## Screen Design

### Login

Purpose:
- Authenticate the user with Firebase and establish an API session.

Responsibilities:
- Trigger Firebase sign-in
- Handle loading, auth failure, invited/uninvited states
- Redirect into the admin shell after successful session bootstrap

### Dashboard

Purpose:
- Provide a useful landing page for camp admins.

Responsibilities:
- Show current camp identity
- Link to high-frequency modules
- Surface lightweight operational context, not deep reporting

### Campers

Purpose:
- Manage camper records for the selected week within the current camp.

Responsibilities:
- List campers by week
- Search and filter
- Create and update camper records
- Support import flows already exposed by the backend
- Expose attendance-related actions where supported

### Weeks

Purpose:
- Let the admin choose and inspect active camp weeks that drive the rest of the panel.

Responsibilities:
- List camp weeks
- Select working week for downstream modules
- Display week metadata needed by other screens

### Activities and Slots

Purpose:
- Manage activity catalog and weekly slot data.

Responsibilities:
- View and edit activities for the current camp
- View and manage slots for a selected week
- Preserve backend validations around age, capacity and swim-band rules

### Users

Purpose:
- Manage camp-scoped users and their role/status.

Responsibilities:
- List users for the current camp
- Create users
- Update role and status
- Reflect backend status restrictions without duplicating the logic

### Invitations

Purpose:
- Invite and manage pending access for camp users.

Responsibilities:
- Create invitation
- List invitations
- Reissue invitation
- Revoke invitation

### Forms

Purpose:
- Expose raw form records when direct table-level inspection is useful.

Responsibilities:
- Filter by form type, week, camper and favorite status
- Display structured payloads like `json_data`

### Form Submissions

Purpose:
- Provide an operations-friendly inbox of submitted forms and responses.

Responsibilities:
- Show who submitted what
- Display submission details by type
- Filter by week and form type
- Prefer this screen for operational review over raw `forms`

## API Integration Plan

### Session and Context

- `GET /api/v1/auth/status`
- `GET /api/v1/auth/me`
- `GET /api/v1/camps`
- `GET /api/v1/context`

### Camp Administration

- `GET /api/v1/camps`
- `GET /api/v1/camps/settings`
- `PATCH /api/v1/camps/settings`

### Users and Invitations

- `GET /api/v1/users`
- `POST /api/v1/users`
- `PATCH /api/v1/users/{user_id}`
- `GET /api/v1/invitations`
- `POST /api/v1/invitations`
- `DELETE /api/v1/invitations/{invitation_id}`
- `POST /api/v1/invitations/{invitation_id}/reissue`

### Campers

- `GET /api/v1/camps/{camp_id}/weeks/{week_id}/campers`
- `POST /api/v1/camps/{camp_id}/weeks/{week_id}/campers`
- `PATCH /api/v1/campers/{camper_id}`
- supporting camper import and attendance routes as needed

### Activities and Slots

- `GET /api/v1/camps/{camp_id}/activities`
- `POST /api/v1/camps/{camp_id}/activities`
- `PATCH /api/v1/activities/{activity_id}`
- slot routes under `/api/v1/.../slots`

### Forms

- `GET /api/v1/forms`
- `GET /api/v1/forms/{form_id}`
- `PATCH /api/v1/forms/{form_id}`
- `GET /api/v1/form-submissions`

## Frontend Structure

The generic `resources.ts` layer should be replaced by feature-specific API modules. The frontend should be reorganized around app shell plus feature modules:

- `src/app`
  - auth/session bootstrap
  - route guards
  - camp context
- `src/api`
  - `auth.ts`
  - `camps.ts`
  - `weeks.ts`
  - `campers.ts`
  - `activities.ts`
  - `slots.ts`
  - `users.ts`
  - `invitations.ts`
  - `forms.ts`
- `src/features`
  - `auth`
  - `dashboard`
  - `campers`
  - `activities`
  - `users`
  - `forms`

## State and Data Flow

- Firebase handles primary sign-in.
- React state holds the Firebase token and current session payload.
- React Query should own server state for lists, detail views and mutations.
- The selected week should be explicit UI state because many admin flows are week-scoped.
- The effective camp comes from backend auth context, not user selection in V1.

## Error Handling

- Unauthorized or expired session:
  - clear local session state
  - redirect to login
- Invited but not claimed / inactive:
  - render a clear blocked-state screen
- Backend validation errors:
  - show user-facing messages directly from normalized API responses
- Missing week or inaccessible resource:
  - render an empty or not-found state instead of silently falling back

## Testing Strategy

### Frontend

- Unit tests for auth/session helpers
- Route guard tests
- Screen-level tests for:
  - login bootstrap
  - users list and edit flows
  - invitations flow
  - campers list/edit flow
  - forms inbox rendering

### Integration

- Mock API responses using realistic payloads from `camp-app`
- Verify token attachment and auth redirects
- Verify week-scoped and camp-scoped navigation

### Manual Verification

- Sign in with a real Firebase-backed invited user
- Confirm `/auth/me` resolves one active membership
- Confirm the panel only shows data for that camp
- Create/update user and invitation records
- List and inspect forms/submissions
- Edit campers/activities through the backend

## Delivery Strategy

Implement V1 in this order:

1. Replace fake auth with real Firebase-backed auth and session bootstrap
2. Introduce app-level camp/session context
3. Replace generic CRUD client with feature-specific API modules
4. Build users and invitations first because they validate auth and camp scoping quickly
5. Build campers and week selection next
6. Add activities and slots
7. Add forms and form submissions views
8. Remove or retire the generic `/admin/*` resource flow

## Risks

- The current frontend may contain assumptions tied to the fake auth flow.
- Some backend endpoints may require exact payload shapes that are not yet represented in `camp-admin`.
- Forms may require two separate UX paths:
  - raw records
  - aggregated operational submissions
- If a user unexpectedly has multiple active memberships in data, the backend may not resolve an effective camp automatically.

## Resolved Decisions

- Authentication provider for V1: Firebase email/password only
- Initial week auto-selection rule: choose the first week in chronological order
- First live rollout scope: all planned modules are required
