import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import { getAuthStatus, getMe } from "../../api/auth";
import { useAuth } from "../../features/auth/useAuth";
import { RoleRedirect } from "./RoleRedirect";
import { SessionGate } from "./SessionGate";
import type { AuthenticatedUser } from "./sessionTypes";

vi.mock("../../features/auth/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../api/auth", () => ({
  getAuthStatus: vi.fn(),
  getMe: vi.fn(),
  claimInvitation: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedGetAuthStatus = vi.mocked(getAuthStatus);
const mockedGetMe = vi.mocked(getMe);

function buildAuthValue() {
  return {
    firebaseUser: null,
    token: "firebase-token",
    loading: false,
    isAuthed: true,
    signIn: vi.fn(),
    signOut: vi.fn(),
    setToken: vi.fn(),
  };
}

function buildUser(role: string): AuthenticatedUser {
  return {
    id: "user-1",
    firebase_uid: "firebase-1",
    email: "user@example.com",
    role,
    camp_id: role === "platform_admin" ? null : "camp-1",
    is_active: true,
    effective_membership_id: role === "platform_admin" ? null : "membership-1",
    effective_camp_id: role === "platform_admin" ? null : "camp-1",
    memberships:
      role === "platform_admin"
        ? []
        : [
            {
              id: "membership-1",
              camp_id: "camp-1",
              role,
              status: "active",
            },
          ],
    capabilities: role === "platform_admin" ? ["platform:*"] : ["*"],
  };
}

function renderRedirect() {
  return render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route
          path="/admin"
          element={
            <SessionGate>
              <RoleRedirect />
            </SessionGate>
          }
        />
        <Route path="/platform" element={<div>Platform target</div>} />
        <Route path="/dashboard" element={<div>Dashboard target</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("RoleRedirect", () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue(buildAuthValue());
    mockedGetAuthStatus.mockResolvedValue({ state: "MEMBER" });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("routes platform admins to the platform area", async () => {
    mockedGetMe.mockResolvedValue(buildUser("platform_admin"));

    renderRedirect();

    expect(await screen.findByText("Platform target")).toBeInTheDocument();
  });

  it("routes camp admins to the dashboard", async () => {
    mockedGetMe.mockResolvedValue(buildUser("admin"));

    renderRedirect();

    expect(await screen.findByText("Dashboard target")).toBeInTheDocument();
  });
});
