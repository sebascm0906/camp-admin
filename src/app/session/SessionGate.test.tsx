import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";
import { claimInvitation, getAuthStatus, getMe } from "../../api/auth";
import { useAuth } from "../../features/auth/useAuth";
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
const mockedClaimInvitation = vi.mocked(claimInvitation);

function buildAuthValue(overrides: Partial<ReturnType<typeof useAuth>> = {}) {
  return {
    firebaseUser: null,
    token: null,
    loading: false,
    isAuthed: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
    setToken: vi.fn(),
    ...overrides,
  };
}

function buildUser(): AuthenticatedUser {
  return {
    id: "user-1",
    firebase_uid: "firebase-1",
    email: "coach@example.com",
    role: "admin",
    camp_id: "camp-1",
    is_active: true,
    effective_membership_id: "membership-1",
    effective_camp_id: "camp-1",
    memberships: [
      {
        id: "membership-1",
        camp_id: "camp-1",
        role: "admin",
        status: "active",
      },
    ],
  };
}

function renderGate() {
  return render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route path="/login" element={<div>Login Screen</div>} />
        <Route
          path="/admin"
          element={
            <SessionGate>
              <div>Private content</div>
            </SessionGate>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("SessionGate", () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue(buildAuthValue());
    mockedGetAuthStatus.mockReset();
    mockedGetMe.mockReset();
    mockedClaimInvitation.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects signed out users to login", async () => {
    renderGate();

    expect(await screen.findByText("Login Screen")).toBeInTheDocument();
    expect(mockedGetAuthStatus).not.toHaveBeenCalled();
  });

  it("claims invited users and then renders the protected content", async () => {
    const user = buildUser();

    mockedUseAuth.mockReturnValue(
      buildAuthValue({ token: "firebase-token", isAuthed: true })
    );
    mockedGetAuthStatus.mockResolvedValue({ state: "INVITED" });
    mockedClaimInvitation.mockResolvedValue(user);
    mockedGetMe.mockResolvedValue(user);

    renderGate();

    expect(await screen.findByText("Private content")).toBeInTheDocument();

    await waitFor(() => {
      expect(mockedGetAuthStatus).toHaveBeenCalledTimes(1);
      expect(mockedClaimInvitation).toHaveBeenCalledTimes(1);
      expect(mockedGetMe).toHaveBeenCalledTimes(1);
    });
  });

  it("shows a blocked state for uninvited users", async () => {
    mockedUseAuth.mockReturnValue(
      buildAuthValue({ token: "firebase-token", isAuthed: true })
    );
    mockedGetAuthStatus.mockResolvedValue({ state: "UNINVITED" });

    renderGate();

    expect(
      await screen.findByText(/does not have access to camp admin yet/i)
    ).toBeInTheDocument();
    expect(screen.queryByText("Private content")).not.toBeInTheDocument();
    expect(mockedClaimInvitation).not.toHaveBeenCalled();
    expect(mockedGetMe).not.toHaveBeenCalled();
  });

  it("shows a blocked state for bootstrap-eligible users", async () => {
    mockedUseAuth.mockReturnValue(
      buildAuthValue({ token: "firebase-token", isAuthed: true })
    );
    mockedGetAuthStatus.mockResolvedValue({ state: "BOOTSTRAP_ELIGIBLE" });

    renderGate();

    expect(
      await screen.findByText(/camp access has not been activated yet/i)
    ).toBeInTheDocument();
    expect(screen.queryByText("Private content")).not.toBeInTheDocument();
    expect(mockedClaimInvitation).not.toHaveBeenCalled();
    expect(mockedGetMe).not.toHaveBeenCalled();
  });

  it("shows retry UI when bootstrap status lookup fails transiently", async () => {
    const user = buildUser();

    mockedUseAuth.mockReturnValue(
      buildAuthValue({ token: "firebase-token", isAuthed: true })
    );
    mockedGetAuthStatus
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce({ state: "MEMBER" });
    mockedGetMe.mockResolvedValue(user);

    renderGate();

    expect(
      await screen.findByText(/could not finish checking your camp access/i)
    ).toBeInTheDocument();

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: /retry/i }));

    expect(await screen.findByText("Private content")).toBeInTheDocument();
    expect(mockedGetAuthStatus).toHaveBeenCalledTimes(2);
    expect(mockedGetMe).toHaveBeenCalledTimes(1);
  });

  it("allows retrying invitation claim with the same token after a transient failure", async () => {
    const user = buildUser();

    mockedUseAuth.mockReturnValue(
      buildAuthValue({ token: "firebase-token", isAuthed: true })
    );
    mockedGetAuthStatus.mockResolvedValue({ state: "INVITED" });
    mockedClaimInvitation
      .mockRejectedValueOnce(new Error("claim failed"))
      .mockResolvedValueOnce(user);
    mockedGetMe.mockResolvedValue(user);

    renderGate();

    expect(
      await screen.findByText(/could not finish setting up your camp access/i)
    ).toBeInTheDocument();
    expect(screen.queryByText("Private content")).not.toBeInTheDocument();

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: /retry/i }));

    expect(await screen.findByText("Private content")).toBeInTheDocument();
    expect(mockedClaimInvitation).toHaveBeenCalledTimes(2);
    expect(mockedGetMe).toHaveBeenCalledTimes(1);
  });
});
