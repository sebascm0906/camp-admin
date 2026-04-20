# Camp Admin V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fake demo shell in `camp-admin` with a real Firebase-authenticated admin panel that works against the existing `camp-app` backend for a single camp and ships all required V1 modules: users, invitations, campers, weeks, activities, slots, forms, and form submissions.

**Architecture:** The frontend will authenticate with Firebase email/password, attach the Firebase ID token to the FastAPI backend, bootstrap session state from `/api/v1/auth/status` and `/api/v1/auth/me`, and derive one effective camp context from the backend response. The generic `/admin/*` resource explorer will be removed in favor of feature-specific API modules and route-driven screens that respect existing backend contracts.

**Tech Stack:** React 19, TypeScript, Vite, MUI, TanStack React Query, Axios, Firebase Web SDK, React Router, Vitest, Testing Library

---

## File Structure

### Existing files to modify

- `package.json`
- `.env.example`
- `vite.config.ts`
- `tsconfig.app.json`
- `src/app/providers.tsx`
- `src/app/router.tsx`
- `src/api/client.ts`
- `src/features/auth/useAuth.tsx`
- `src/features/auth/LoginPage.tsx`
- `src/features/admin/AdminLayout.tsx`
- `src/features/admin/resourceConfig.ts`

### New frontend infrastructure files

- `src/lib/env.ts`
- `src/lib/firebase.ts`
- `src/lib/http.ts`
- `src/app/session/sessionTypes.ts`
- `src/app/session/sessionContext.tsx`
- `src/app/session/useSession.ts`
- `src/app/session/SessionGate.tsx`
- `src/app/context/campContext.tsx`
- `src/app/context/useCampContext.ts`

### New API modules

- `src/api/auth.ts`
- `src/api/camps.ts`
- `src/api/weeks.ts`
- `src/api/users.ts`
- `src/api/invitations.ts`
- `src/api/campers.ts`
- `src/api/activities.ts`
- `src/api/slots.ts`
- `src/api/forms.ts`

### New feature modules

- `src/features/dashboard/DashboardPage.tsx`
- `src/features/weeks/WeekSelector.tsx`
- `src/features/users/UsersPage.tsx`
- `src/features/users/UserDialog.tsx`
- `src/features/invitations/InvitationsPage.tsx`
- `src/features/invitations/InvitationDialog.tsx`
- `src/features/campers/CampersPage.tsx`
- `src/features/campers/CamperDialog.tsx`
- `src/features/activities/ActivitiesPage.tsx`
- `src/features/activities/ActivityDialog.tsx`
- `src/features/slots/SlotsPanel.tsx`
- `src/features/forms/FormsPage.tsx`
- `src/features/forms/FormSubmissionsPage.tsx`

### New shared UI files

- `src/components/AppShellHeader.tsx`
- `src/components/EmptyState.tsx`
- `src/components/ErrorState.tsx`
- `src/components/LoadingState.tsx`
- `src/components/WeekScopedLayout.tsx`

### Test files

- `src/test/setup.ts`
- `src/features/auth/LoginPage.test.tsx`
- `src/app/session/SessionGate.test.tsx`
- `src/features/users/UsersPage.test.tsx`
- `src/features/invitations/InvitationsPage.test.tsx`
- `src/features/forms/FormSubmissionsPage.test.tsx`

## Task 1: Add Environment, Firebase, and Test Foundations

**Files:**
- Modify: `package.json`
- Modify: `.env.example`
- Modify: `vite.config.ts`
- Modify: `tsconfig.app.json`
- Create: `src/lib/env.ts`
- Create: `src/lib/firebase.ts`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Add runtime and test dependencies**

Update `package.json` to add:

```json
{
  "dependencies": {
    "firebase": "^11.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.0.0",
    "jsdom": "^26.0.0",
    "vitest": "^3.0.0"
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 2: Add required Firebase env vars**

Update `.env.example` to include:

```dotenv
VITE_API_URL=http://localhost:8000/api/v1
VITE_FIREBASE_API_KEY=CHANGE_ME
VITE_FIREBASE_AUTH_DOMAIN=CHANGE_ME
VITE_FIREBASE_PROJECT_ID=CHANGE_ME
VITE_FIREBASE_APP_ID=CHANGE_ME
VITE_FIREBASE_MESSAGING_SENDER_ID=CHANGE_ME
```

- [ ] **Step 3: Add typed env access**

Create `src/lib/env.ts`:

```ts
function required(name: string): string {
  const value = import.meta.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export const ENV = {
  apiUrl: required("VITE_API_URL"),
  firebase: {
    apiKey: required("VITE_FIREBASE_API_KEY"),
    authDomain: required("VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: required("VITE_FIREBASE_PROJECT_ID"),
    appId: required("VITE_FIREBASE_APP_ID"),
    messagingSenderId: required("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  },
} as const;
```

- [ ] **Step 4: Initialize Firebase app and auth**

Create `src/lib/firebase.ts`:

```ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { ENV } from "./env";

const app = initializeApp(ENV.firebase);

export const firebaseAuth = getAuth(app);
```

- [ ] **Step 5: Add Vitest config and setup**

Update `vite.config.ts`:

```ts
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
})
```

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom";
```

- [ ] **Step 6: Install dependencies**

Run: `npm install`
Expected: install completes with `firebase`, `vitest`, and Testing Library packages present in `package-lock.json`

- [ ] **Step 7: Verify the toolchain still builds**

Run: `npm run build`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json .env.example vite.config.ts tsconfig.app.json src/lib/env.ts src/lib/firebase.ts src/test/setup.ts
git commit -m "chore: add firebase and test foundations"
```

## Task 2: Replace Fake Auth with Real Firebase Session Bootstrap

**Files:**
- Modify: `src/api/client.ts`
- Create: `src/api/auth.ts`
- Create: `src/app/session/sessionTypes.ts`
- Create: `src/app/session/sessionContext.tsx`
- Create: `src/app/session/useSession.ts`
- Create: `src/app/session/SessionGate.tsx`
- Modify: `src/features/auth/useAuth.tsx`
- Modify: `src/features/auth/LoginPage.tsx`
- Test: `src/features/auth/LoginPage.test.tsx`
- Test: `src/app/session/SessionGate.test.tsx`

- [ ] **Step 1: Define session types from backend contracts**

Create `src/app/session/sessionTypes.ts`:

```ts
export type Membership = {
  id: string;
  camp_id: string;
  role: string;
  status: string;
};

export type AuthenticatedUser = {
  id: string;
  firebase_uid: string;
  email: string;
  role: string | null;
  camp_id: string | null;
  is_active: boolean;
  effective_membership_id?: string | null;
  effective_camp_id?: string | null;
  memberships: Membership[];
};

export type AuthStatusResponse = {
  state: "UNINVITED" | "INVITED" | "MEMBER" | "BOOTSTRAP_ELIGIBLE";
};
```

- [ ] **Step 2: Point Axios at `/api/v1` and normalize auth header behavior**

Update `src/api/client.ts`:

```ts
import axios from "axios";
import { ENV } from "../lib/env";

export const api = axios.create({
  baseURL: ENV.apiUrl,
});

export function setApiToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }
  delete api.defaults.headers.common.Authorization;
}
```

- [ ] **Step 3: Add auth API client**

Create `src/api/auth.ts`:

```ts
import { api } from "./client";
import type { AuthStatusResponse, AuthenticatedUser } from "../app/session/sessionTypes";

export async function getAuthStatus() {
  const { data } = await api.get<AuthStatusResponse>("/auth/status");
  return data;
}

export async function getMe() {
  const { data } = await api.get<AuthenticatedUser>("/auth/me");
  return data;
}

export async function claimInvitation() {
  const { data } = await api.post<AuthenticatedUser>("/auth/claim");
  return data;
}
```

- [ ] **Step 4: Replace the fake auth context with Firebase-backed auth**

Refactor `src/features/auth/useAuth.tsx` so it tracks:
- Firebase user
- Firebase token
- auth loading state
- sign-in with email/password
- sign-out

Core behavior:

```ts
onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
  const token = firebaseUser ? await firebaseUser.getIdToken() : null;
  setApiToken(token);
  setState({ firebaseUser, token, loading: false });
});
```

- [ ] **Step 5: Add session bootstrap context**

Create `SessionGate` and session context that:
- fetches `/auth/status`
- if state is `INVITED`, calls `/auth/claim` once
- fetches `/auth/me`
- stores the resolved user payload
- blocks app routes until session bootstrap finishes

Use a state machine:

```ts
type SessionState =
  | { phase: "signed_out" }
  | { phase: "loading" }
  | { phase: "blocked"; reason: "UNINVITED" | "INVITED" | "BOOTSTRAP_ELIGIBLE" }
  | { phase: "ready"; user: AuthenticatedUser };
```

- [ ] **Step 6: Rewrite the login screen**

Update `src/features/auth/LoginPage.tsx` to use email/password only:

```tsx
await signInWithEmailAndPassword(firebaseAuth, email, password);
```

Show:
- loading state
- invalid credentials error
- blocked state when backend says uninvited

- [ ] **Step 7: Add auth tests**

Write `LoginPage.test.tsx`:
- render form
- submit email/password
- assert loading state and delegated sign-in call

Write `SessionGate.test.tsx`:
- signed-out users route to login
- invited users trigger claim and continue
- uninvited users remain blocked

- [ ] **Step 8: Run focused tests**

Run: `npm run test -- LoginPage SessionGate`
Expected: PASS

- [ ] **Step 9: Run the build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add src/api/client.ts src/api/auth.ts src/app/session src/features/auth
git commit -m "feat: replace fake auth with firebase session bootstrap"
```

## Task 3: Add Camp and Week Context, Dashboard, and Real Routing

**Files:**
- Create: `src/api/camps.ts`
- Create: `src/api/weeks.ts`
- Create: `src/app/context/campContext.tsx`
- Create: `src/app/context/useCampContext.ts`
- Create: `src/features/dashboard/DashboardPage.tsx`
- Create: `src/features/weeks/WeekSelector.tsx`
- Modify: `src/app/providers.tsx`
- Modify: `src/app/router.tsx`
- Modify: `src/features/admin/AdminLayout.tsx`
- Modify: `src/features/admin/resourceConfig.ts`

- [ ] **Step 1: Add camp and week API clients**

Create `src/api/camps.ts`:

```ts
import { api } from "./client";

export type Camp = { id: string; name: string };
export type CampSettings = {
  camp_id: string;
  timezone?: string | null;
  address?: string | null;
  map_image_url?: string | null;
  staff_resources_url?: string | null;
};

export async function listCamps() {
  const { data } = await api.get<Camp[]>("/camps");
  return data;
}

export async function getCampSettings() {
  const { data } = await api.get<CampSettings>("/camps/settings");
  return data;
}
```

Create `src/api/weeks.ts`:

```ts
import { api } from "./client";

export type Week = {
  id: string;
  camp_id: string;
  start_date: string;
  end_date: string;
  week_type: "daycamp" | "overnight";
  calendar_week_display_name?: string | null;
};

export type CampContext = {
  active_daycamp_week_id?: string | null;
  active_overnight_week_id?: string | null;
};

export async function listWeeks(campId: string) {
  const { data } = await api.get<Week[]>(`/camps/${campId}/weeks`);
  return data;
}

export async function getContext() {
  const { data } = await api.get<CampContext>("/context");
  return data;
}

export async function selectWeek(weekId: string) {
  const { data } = await api.post<CampContext>(`/weeks/${weekId}/select`);
  return data;
}
```

- [ ] **Step 2: Build camp/week context provider**

Create a provider that:
- reads the authenticated user
- loads `camps`, `context`, `weeks`
- auto-selects the first chronological week when no active week exists
- exposes:
  - current camp
  - week list
  - selected daycamp week id
  - selected overnight week id
  - selection setters

- [ ] **Step 3: Wire providers**

Update `src/app/providers.tsx` to wrap:

```tsx
<AuthProvider>
  <SessionProvider>
    <CampProvider>{children}</CampProvider>
  </SessionProvider>
</AuthProvider>
```

- [ ] **Step 4: Replace generic router with real routes**

Update `src/app/router.tsx` to add:

```tsx
<Route path="/login" element={<LoginPage />} />
<Route element={<SessionGate />}>
  <Route path="/" element={<Navigate to="/dashboard" replace />} />
  <Route path="/" element={<AdminLayout />}>
    <Route path="dashboard" element={<DashboardPage />} />
    <Route path="users" element={<UsersPage />} />
    <Route path="invitations" element={<InvitationsPage />} />
    <Route path="campers" element={<CampersPage />} />
    <Route path="activities" element={<ActivitiesPage />} />
    <Route path="forms" element={<FormsPage />} />
    <Route path="form-submissions" element={<FormSubmissionsPage />} />
  </Route>
</Route>
```

- [ ] **Step 5: Rewrite admin layout navigation**

Replace `resourceConfig.ts` with ordered app sections:

```ts
export const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "users", label: "Users" },
  { key: "invitations", label: "Invitations" },
  { key: "campers", label: "Campers" },
  { key: "activities", label: "Activities & Slots" },
  { key: "forms", label: "Forms" },
  { key: "form-submissions", label: "Form Submissions" },
] as const;
```

The header should show:
- camp name
- current user email
- logout action
- week selector

- [ ] **Step 6: Add dashboard and week selector**

Dashboard must show:
- active camp
- selected daycamp and overnight weeks
- cards linking to all mandatory V1 modules

Week selector must:
- show all weeks sorted by `start_date`
- default to the earliest available week in the timeline
- persist selection with `/weeks/{week_id}/select`

- [ ] **Step 7: Run build and smoke tests**

Run: `npm run build`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/api/camps.ts src/api/weeks.ts src/app/providers.tsx src/app/router.tsx src/app/context src/features/dashboard src/features/weeks src/features/admin
git commit -m "feat: add camp context and admin routing"
```

## Task 4: Implement Users and Invitations Module

**Files:**
- Create: `src/api/users.ts`
- Create: `src/api/invitations.ts`
- Create: `src/features/users/UsersPage.tsx`
- Create: `src/features/users/UserDialog.tsx`
- Create: `src/features/invitations/InvitationsPage.tsx`
- Create: `src/features/invitations/InvitationDialog.tsx`
- Test: `src/features/users/UsersPage.test.tsx`
- Test: `src/features/invitations/InvitationsPage.test.tsx`

- [ ] **Step 1: Add typed users API client**

Create `src/api/users.ts`:

```ts
import { api } from "./client";

export type CampUser = {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  firebase_uid?: string | null;
  is_active: boolean;
  role: string;
  status: string;
};

export type CampUserCreate = {
  email: string;
  first_name?: string;
  last_name?: string;
  role: "admin" | "counselor";
  status: string;
};

export type CampUserUpdate = Partial<CampUserCreate>;

export async function listUsers() {
  const { data } = await api.get<CampUser[]>("/users");
  return data;
}

export async function createUser(payload: CampUserCreate) {
  const { data } = await api.post<CampUser>("/users", payload);
  return data;
}

export async function updateUser(userId: string, payload: CampUserUpdate) {
  const { data } = await api.patch<CampUser>(`/users/${userId}`, payload);
  return data;
}
```

- [ ] **Step 2: Add typed invitations API client**

Create `src/api/invitations.ts`:

```ts
import { api } from "./client";

export type Invitation = {
  id: string;
  email: string;
  role: string;
  expires_at?: string | null;
  used_at?: string | null;
  created_at: string;
};

export type InvitationCreate = {
  email: string;
  role: "admin" | "counselor";
  expires_at?: string | null;
};

export async function listInvitations() {
  const { data } = await api.get<Invitation[]>("/invitations");
  return data;
}

export async function createInvitation(payload: InvitationCreate) {
  const { data } = await api.post<Invitation>("/invitations", payload);
  return data;
}

export async function revokeInvitation(id: string) {
  await api.delete(`/invitations/${id}`);
}

export async function reissueInvitation(id: string) {
  const { data } = await api.post<Invitation>(`/invitations/${id}/reissue`);
  return data;
}
```

- [ ] **Step 3: Build users screen**

`UsersPage.tsx` must:
- list users with role/status columns
- open create/edit dialog
- allow role and status updates
- show backend validation errors inline

- [ ] **Step 4: Build invitations screen**

`InvitationsPage.tsx` must:
- list invitations
- create invitation
- revoke invitation
- reissue invitation
- show claimed vs pending state

- [ ] **Step 5: Add tests for both screens**

Users test:
- renders rows from API
- submits create flow
- submits update flow

Invitations test:
- renders list
- submits invite creation
- triggers revoke action

- [ ] **Step 6: Run focused tests**

Run: `npm run test -- UsersPage InvitationsPage`
Expected: PASS

- [ ] **Step 7: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/api/users.ts src/api/invitations.ts src/features/users src/features/invitations
git commit -m "feat: add camp user and invitation management"
```

## Task 5: Implement Campers Module

**Files:**
- Create: `src/api/campers.ts`
- Create: `src/features/campers/CampersPage.tsx`
- Create: `src/features/campers/CamperDialog.tsx`
- Create: `src/components/WeekScopedLayout.tsx`

- [ ] **Step 1: Add campers API client**

Expose:
- `listCampers(campId, weekId)`
- `createCamper(campId, weekId, payload)`
- `updateCamper(camperId, payload)`
- `importCampers(campId, weekId, payload)`

Use backend payload shapes from `campers.py` schemas:

```ts
type CamperCreate = {
  first_name?: string;
  last_name?: string;
  age?: number;
  age_group?: string;
  swimband?: "red" | "green";
  cabin_id?: string | null;
  group_id?: string | null;
  group_name?: string | null;
};
```

- [ ] **Step 2: Build campers page**

The screen must:
- require an active selected week
- list campers for that week
- show daycamp vs overnight-specific fields
- open create/edit dialog
- keep import action visible

- [ ] **Step 3: Implement create/edit dialog**

Dialog fields:
- first name
- last name
- age
- age group
- swimband
- cabin or group mapping depending on week type
- notes for edit

- [ ] **Step 4: Add import entry point**

The first iteration may use a textarea or file upload wrapper, but it must call the real import route and refresh the list on success.

- [ ] **Step 5: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/api/campers.ts src/features/campers src/components/WeekScopedLayout.tsx
git commit -m "feat: add campers administration"
```

## Task 6: Implement Activities and Slots Module

**Files:**
- Create: `src/api/activities.ts`
- Create: `src/api/slots.ts`
- Create: `src/features/activities/ActivitiesPage.tsx`
- Create: `src/features/activities/ActivityDialog.tsx`
- Create: `src/features/slots/SlotsPanel.tsx`

- [ ] **Step 1: Add activities API client**

Expose:
- `listActivities(campId)`
- `createActivity(campId, payload)`
- `updateActivity(activityId, payload)`
- `getActivityWeekDetail(campId, weekId, activityId)` if needed for slot details

- [ ] **Step 2: Add slots API client**

Expose:
- `listSlots(campId, weekId)`
- `createSlot(campId, weekId, payload)`
- `updateSlot(slotId, payload)` only if route exists
- any generate/import helper routes the backend already supports

- [ ] **Step 3: Build activities page**

Page responsibilities:
- activity list for current camp
- create/edit activity dialog
- link selected activity into week-scoped slot management

- [ ] **Step 4: Build slots panel**

Panel responsibilities:
- require active week
- list slots for selected week
- show period, capacity, start/end times
- create slot against that week

- [ ] **Step 5: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/api/activities.ts src/api/slots.ts src/features/activities src/features/slots
git commit -m "feat: add activities and slots management"
```

## Task 7: Implement Forms and Form Submissions Module

**Files:**
- Create: `src/api/forms.ts`
- Create: `src/features/forms/FormsPage.tsx`
- Create: `src/features/forms/FormSubmissionsPage.tsx`
- Test: `src/features/forms/FormSubmissionsPage.test.tsx`

- [ ] **Step 1: Add forms API client**

Expose:
- `listForms(params)`
- `getForm(formId)`
- `updateForm(formId, payload)`
- `listFormSubmissions(weekId, type?)`

Types:

```ts
type FormRecord = {
  id: string;
  type: string;
  camp_id: string;
  week_id?: string | null;
  user_id: string;
  camper_id?: string | null;
  cabin_id?: string | null;
  is_favorited: boolean;
  json_data?: Record<string, unknown> | null;
  content?: string | null;
  rating?: number | null;
};

type FormSubmission = {
  id: string;
  form_type: "maintenance" | "behavior" | "food" | "shoutout";
  created_at: string;
  submitted_by: { id: string; name: string };
  summary: string;
  details: Record<string, unknown>;
};
```

- [ ] **Step 2: Build raw forms page**

Must support:
- list filtered by type
- current week filter
- favorite indicator
- detail panel showing `json_data`, `content`, and rating

- [ ] **Step 3: Build form submissions inbox**

Must support:
- current week selection
- optional type filter
- list sorted by backend order
- detail drawer or side panel showing the full `details` payload

- [ ] **Step 4: Add a screen test**

Write `FormSubmissionsPage.test.tsx`:
- renders submissions list
- filters by type
- shows details payload on selection

- [ ] **Step 5: Run focused tests**

Run: `npm run test -- FormSubmissionsPage`
Expected: PASS

- [ ] **Step 6: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/api/forms.ts src/features/forms
git commit -m "feat: add forms and submissions inbox"
```

## Task 8: Remove Demo CRUD Flow and Perform Final Verification

**Files:**
- Modify: `src/app/router.tsx`
- Modify: `src/features/admin/AdminLayout.tsx`
- Delete or retire: `src/api/resources.ts`
- Delete or retire: `src/features/admin/ResourcePage.tsx`
- Delete or retire: `src/features/admin/resourceConfig.ts`

- [ ] **Step 1: Remove the generic `/admin/:resource` route**

Delete the generic route and ensure no navigation points remain to:

```tsx
<Route path="/admin/:resource" ... />
```

- [ ] **Step 2: Remove unused generic resource client**

Delete or stop importing:
- `src/api/resources.ts`
- `src/features/admin/ResourcePage.tsx`

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: PASS with no unused imports or dead modules left behind

- [ ] **Step 4: Run tests**

Run: `npm run test`
Expected: PASS

- [ ] **Step 5: Run production build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 6: Manual verification**

Run app locally:

```bash
npm run dev
```

Manual checklist:
- sign in with Firebase email/password
- session bootstraps through `/auth/status` and `/auth/me`
- camp name appears in the header
- earliest week auto-selects when no preference exists
- users and invitations load and mutate correctly
- campers load for selected week and can be edited
- activities and slots load for selected week
- forms and form submissions display current camp data only

- [ ] **Step 7: Commit**

```bash
git add src
git commit -m "refactor: remove demo crud flow and finalize admin panel v1"
```
