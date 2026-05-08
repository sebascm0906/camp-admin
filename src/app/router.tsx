import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "../features/auth/LoginPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { AdminLayout } from "../features/admin/AdminLayout";
import { ActivitiesPage } from "../features/activities/ActivitiesPage";
import { CampersPage } from "../features/campers/CampersPage";
import { FormsPage } from "../features/forms/FormsPage";
import { FormSubmissionsPage } from "../features/forms/FormSubmissionsPage";
import { ImportsPage } from "../features/imports/ImportsPage";
import { InvitationsPage } from "../features/invitations/InvitationsPage";
import { NewCampPage } from "../features/platform/NewCampPage";
import { PlatformCampsPage } from "../features/platform/PlatformCampsPage";
import { PlatformLayout } from "../features/platform/PlatformLayout";
import { UsersPage } from "../features/users/UsersPage";
import { WeeksPage } from "../features/weeks/WeeksPage";
import { RoleRedirect } from "./session/RoleRedirect";
import { SessionGate } from "./session/SessionGate";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <SessionGate>
            <AdminLayout />
          </SessionGate>
        }
      >
        <Route path="/" element={<RoleRedirect />} />
        <Route path="/admin" element={<RoleRedirect />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/invitations" element={<InvitationsPage />} />
        <Route path="/weeks" element={<WeeksPage />} />
        <Route path="/imports" element={<ImportsPage />} />
        <Route path="/campers" element={<CampersPage />} />
        <Route path="/activities" element={<ActivitiesPage />} />
        <Route path="/forms" element={<FormsPage />} />
        <Route path="/form-submissions" element={<FormSubmissionsPage />} />
      </Route>

      <Route
        element={
          <SessionGate>
            <PlatformLayout />
          </SessionGate>
        }
      >
        <Route path="/platform" element={<Navigate to="/platform/camps" replace />} />
        <Route path="/platform/camps" element={<PlatformCampsPage />} />
        <Route path="/platform/new-camp" element={<NewCampPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
