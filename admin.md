# CampApp Admin Portal – Build Guide

This document outlines how to spin up a standalone admin portal (recommended stack: **Vite + React + TypeScript**) that talks to the existing FastAPI backend through `/api/v1/...`. It lists the scaffold, shared utilities, and feature-specific code you will need so the work can happen in a separate repo (e.g., `camp-admin-portal`).

---

## 1. Goals & Requirements
- **Target users:** internal staff/admins uploading weekly CSVs, fixing rows, and editing campers, staff, activities, and slots.
- **Key actions:** authenticate via Firebase JWT, browse tabular data, edit inline, delete rows, run CSV imports, and surface validation errors returned by the backend.
- **Non-goals:** Replacing the counselor mobile UI; anything real-time/offline (browsers fetch fresh data on demand).

---

## 2. Tech Stack
- **Build tooling:** Vite (`npm create vite@latest camp-admin-portal -- --template react-ts`)
- **UI:** React 18, React Router, TanStack Table (for editable grids), shadcn/ui or Material UI
- **State/data:** React Query for caching + mutation hooks
- **CSV handling:** `papaparse` (client-side parsing + preview)
- **HTTP:** Axios with interceptors for auth + error normalization
- **Auth:** Firebase Web SDK (reuse existing Firebase project) + backend `/api/v1/auth/*`
- **Forms:** `react-hook-form` w/ Zod schemas mirroring Pydantic models

---

## 3. Project Layout
```text
camp-admin-portal/
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx
│  ├─ routes/
│  │  ├─ campers/
│  │  │  ├─ CampersPage.tsx
│  │  │  └─ CamperDetailDrawer.tsx
│  │  ├─ staff/
│  │  │  ├─ StaffAssignmentsPage.tsx
│  │  │  └─ StaffDetailDrawer.tsx
│  │  ├─ activities/
│  │  │  ├─ ActivitiesPage.tsx
│  │  │  └─ SlotsManager.tsx
│  │  ├─ imports/
│  │  │  └─ CsvImportPage.tsx
│  │  └─ dashboard/DashboardPage.tsx
│  ├─ components/
│  │  ├─ DataTable.tsx
│  │  ├─ CsvUploadCard.tsx
│  │  ├─ ConfirmDialog.tsx
│  │  └─ ToastProvider.tsx
│  ├─ api/
│  │  ├─ client.ts
│  │  ├─ campers.ts
│  │  ├─ staff.ts
│  │  ├─ activities.ts
│  │  └─ slots.ts
│  ├─ hooks/
│  │  ├─ useAuth.ts
│  │  ├─ useCampContext.ts
│  │  └─ useCsvImport.ts
│  ├─ lib/
│  │  ├─ env.ts
│  │  └─ schemas.ts
│  └─ styles/
│     └─ globals.css
├─ public/
├─ .env.example
├─ package.json
└─ vite.config.ts
```

---

## 4. Environment & Configuration
| Variable            | Purpose                                 | Example                     |
|---------------------|-----------------------------------------|-----------------------------|
| `VITE_API_BASE_URL` | Points to FastAPI host                  | `https://api.campapp.dev`   |
| `VITE_FIREBASE_*`   | Firebase web config                     | pulled from Firebase console|

`src/lib/env.ts` should assert variables at build time:
```ts
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
if (!apiBaseUrl) throw new Error("Missing VITE_API_BASE_URL");
export const ENV = { apiBaseUrl };
```

---

## 5. API Client & Auth
`src/api/client.ts`
```ts
import axios from "axios";
import { ENV } from "../lib/env";
import { getIdToken } from "../hooks/useAuth";

export const api = axios.create({
  baseURL: `${ENV.apiBaseUrl}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const token = await getIdToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const detail = err.response?.data?.message ?? err.message;
    return Promise.reject(new Error(detail));
  },
);
```

- `useAuth.ts`: wraps Firebase `onAuthStateChanged`, stores `currentUser`, exposes `loginWithGoogle()` and `logout()`.
- On sign-in success, call backend `/auth/status` to confirm membership state.

---

## 6. Routing & Navigation
Use React Router v6.6 data APIs:
```tsx
<Route path="/" element={<Layout />}>
  <Route index element={<DashboardPage />} />
  <Route path="campers" element={<CampersPage />} />
  <Route path="staff" element={<StaffAssignmentsPage />} />
  <Route path="activities" element={<ActivitiesPage />} />
  <Route path="imports" element={<CsvImportPage />} />
</Route>
```
`Layout` enforces auth (redirects to `/login` page). Provide camp + week selectors globally (context).

---

## 7. Shared DataTable Component
`components/DataTable.tsx`: wrap TanStack Table to support
- Column definitions with cell editors (`<input>`, `<Select>`)
- Row selection checkbox for bulk delete
- Debounced `onCellCommit(rowId, columnId, value)` callback

Expose props:
```ts
type DataTableProps<T> = {
  columns: ColumnDef<T, any>[];
  data: T[];
  isLoading?: boolean;
  onRowDelete?: (rowIds: string[]) => Promise<void>;
  emptyState?: ReactNode;
};
```

---

## 8. Feature Modules

### 8.1 Campers
| Action | Endpoint | Code sketch |
|--------|----------|-------------|
| List   | `GET /camps/{camp_id}/weeks/{week_id}/campers` | `useQuery(["campers", campId, weekId], () => campersApi.list(campId, weekId))` |
| Detail | `GET /campers/{camper_id}` | open drawer, pre-fill form |
| Update | `PATCH /campers/{camper_id}` | `react-hook-form` -> `campersApi.update(id, payload)` |
| Attendance toggles | `PATCH /campers/{camper_id}/attendance/{type}` | radio buttons for On Site / Off Site |
| Import CSV | `POST /camps/{camp_id}/weeks/{week_id}/campers/import` | see Section 9 |

`campers.ts` module exports `list`, `get`, `update`, `importCsv`.

### 8.2 Staff
| Action | Endpoint |
|--------|----------|
| List assignments | `GET /camps/{camp_id}/weeks/{week_id}/staff-assignments` |
| Detail | `GET /staff/{staff_id}` |
| Import roster | `POST /camps/{camp_id}/weeks/{week_id}/staff-assignments/import` |
| Export CSV | `GET /staff/export.csv` (use `<a download>` or `api.get(..., { responseType: "blob" })`) |

No delete endpoint exists yet; UI should either (1) expose “replace via CSV import” guidance or (2) stage a future backend task.

### 8.3 Activities & Slots
| Action | Endpoint |
|--------|----------|
| List camp activities | `GET /camps/{camp_id}/activities` |
| Create | `POST /camps/{camp_id}/activities` |
| Update base activity | `PATCH /activities/{activity_id}` |
| Week-specific detail | `GET /camps/{camp_id}/weeks/{week_id}/activities/{activity_id}/detail` |
| Notes update | `PATCH /.../notes` |
| Slots mgmt | `GET /camps/{camp_id}/weeks/{week_id}/slots/`, plus `POST import/generate/copy` and `DELETE .../slots/activity/{activity_id}`. |

UI idea: split page into two tabs – Activity catalog + Slot generation panel.

---

## 9. CSV Import Flow
`components/CsvUploadCard.tsx`
```tsx
export function CsvUploadCard({ onUpload }: { onUpload: (file: File) => Promise<void> }) {
  const [file, setFile] = useState<File | null>(null);
  return (
    <Card>
      <CardHeader>Import CSV</CardHeader>
      <CardContent>
        <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <Button disabled={!file} onClick={() => file && onUpload(file)}>Upload</Button>
      </CardContent>
    </Card>
  );
}
```

`hooks/useCsvImport.ts`
```ts
export function useCsvImport(endpoint: (file: File) => Promise<ImportResult>) {
  const mutation = useMutation(endpoint, {
    onSuccess: (result) => toast.success(`Imported ${result.rows_processed} rows`),
    onError: (err) => toast.error(err.message),
  });
  return { upload: mutation.mutateAsync, ...mutation };
}
```
`ImportResult` matches backend schema (`rows_processed`, `errors`, etc.).

---

## 10. Deletion/Mutation Strategy
- **Campers:** no DELETE route; present a “Archive Camper” action that PATCH-es with `{ deleted_at: new Date().toISOString() }` once backend exposes flag. Until then, rely on update + CSV corrections.
- **Staff assignments:** highlight that CSV re-import overwrites assignments; show inline help linking to backend docs.
- **Activities:** implement confirm dialog before `PATCH` changes; backlog item to add `DELETE /activities/{id}` if truly needed.

---

## 11. Testing & Tooling
- Unit test shared hooks/components using Vitest + Testing Library.
- `msw` to mock API endpoints for storybook/e2e.
- Add GitHub Actions workflow: lint (`pnpm lint`), test (`pnpm test -- --runInBand`), build.

---

## 12. Deployment Notes
- Static hosting (Vercel/Netlify/S3) + `.env` per environment.
- Enable CORS: allow origin of portal in FastAPI when deploying.
- Version API interactions; if backend evolves, maintain `/api/v1` compatibility wrappers.

---

## 13. Future Enhancements
1. Role-based UI (limit CSV tooling to admins).
2. Audit log viewer by hitting `/api/v1/export...` or dedicated endpoints once available.
3. Bulk delete API once backend exposes safe endpoints.
4. Schema-driven form generation (derive TS types from OpenAPI).

This guide is sufficient to bootstrap the external React project and wire every portal feature against the existing backend.
