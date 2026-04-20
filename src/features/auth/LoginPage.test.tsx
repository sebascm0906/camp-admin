import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { User, UserCredential } from "firebase/auth";
import { vi } from "vitest";
import { LoginPage } from "./LoginPage";
import { AuthProvider, useAuth } from "./useAuth";

const firebaseMocks = vi.hoisted(() => {
  let authStateListener: ((user: User | null) => unknown) | undefined;
  let idTokenListener: ((user: User | null) => unknown) | undefined;

  return {
    get authStateListener() {
      return authStateListener;
    },
    set authStateListener(listener: ((user: User | null) => unknown) | undefined) {
      authStateListener = listener;
    },
    get idTokenListener() {
      return idTokenListener;
    },
    set idTokenListener(listener: ((user: User | null) => unknown) | undefined) {
      idTokenListener = listener;
    },
    onAuthStateChanged: vi.fn((_auth, listener: (user: User | null) => unknown) => {
      authStateListener = listener;
      return vi.fn();
    }),
    onIdTokenChanged: vi.fn((_auth, listener: (user: User | null) => unknown) => {
      idTokenListener = listener;
      return vi.fn();
    }),
    signInWithEmailAndPassword: vi.fn(),
    signOut: vi.fn().mockResolvedValue(undefined),
  };
});

const apiClientMocks = vi.hoisted(() => ({
  setApiToken: vi.fn(),
}));

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: firebaseMocks.onAuthStateChanged,
  onIdTokenChanged: firebaseMocks.onIdTokenChanged,
  signInWithEmailAndPassword: firebaseMocks.signInWithEmailAndPassword,
  signOut: firebaseMocks.signOut,
}));

vi.mock("../../lib/firebase", () => ({
  firebaseAuth: { name: "firebase-auth" },
}));

vi.mock("../../api/client", () => ({
  setApiToken: apiClientMocks.setApiToken,
}));

function AuthSnapshot() {
  const { token, loading } = useAuth();

  return (
    <>
      <div data-testid="token">{token ?? "none"}</div>
      <div data-testid="loading">{String(loading)}</div>
    </>
  );
}

function renderWithAuthProvider(ui: React.ReactNode) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}

function createFirebaseUser(token: string): User {
  return {
    getIdToken: vi.fn().mockResolvedValue(token),
  } as unknown as User;
}

async function emitAuthState(user: User | null) {
  await act(async () => {
    await firebaseMocks.authStateListener?.(user);
  });
}

async function emitIdTokenChange(user: User | null) {
  await act(async () => {
    await firebaseMocks.idTokenListener?.(user);
  });
}

describe("LoginPage", () => {
  beforeEach(() => {
    firebaseMocks.authStateListener = undefined;
    firebaseMocks.idTokenListener = undefined;
    firebaseMocks.onAuthStateChanged.mockClear();
    firebaseMocks.onIdTokenChanged.mockClear();
    firebaseMocks.signInWithEmailAndPassword.mockReset();
    firebaseMocks.signOut.mockClear();
    apiClientMocks.setApiToken.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("submits email and password through Firebase auth", async () => {
    let resolveSignIn: (() => void) | undefined;

    firebaseMocks.signInWithEmailAndPassword.mockImplementation(
      () =>
        new Promise<UserCredential>((resolve) => {
          resolveSignIn = () => resolve({} as UserCredential);
        })
    );

    renderWithAuthProvider(<LoginPage />);
    await emitAuthState(null);
    await emitIdTokenChange(null);

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), "coach@example.com");
    await user.type(screen.getByLabelText(/password/i), "secret123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(firebaseMocks.signInWithEmailAndPassword).toHaveBeenCalledWith(
      { name: "firebase-auth" },
      "coach@example.com",
      "secret123"
    );
    expect(
      screen.getByRole("button", { name: /signing in/i })
    ).toBeDisabled();

    await act(async () => {
      resolveSignIn?.();
    });
  });

  it("shows an error when sign in fails", async () => {
    firebaseMocks.signInWithEmailAndPassword.mockRejectedValue(
      new Error("Firebase: Error (auth/invalid-credential).")
    );

    renderWithAuthProvider(<LoginPage />);
    await emitAuthState(null);
    await emitIdTokenChange(null);

    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), "coach@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrong-password");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByText(/unable to sign in with those credentials/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeEnabled();
  });

  it("refreshes the stored token when Firebase rotates the ID token", async () => {
    const initialUser = createFirebaseUser("token-1");
    const rotatedUser = createFirebaseUser("token-2");

    renderWithAuthProvider(<AuthSnapshot />);

    await emitAuthState(null);
    await emitAuthState(initialUser);
    await emitIdTokenChange(initialUser);

    expect(await screen.findByTestId("token")).toHaveTextContent("token-1");
    expect(apiClientMocks.setApiToken).toHaveBeenLastCalledWith("token-1");

    await emitIdTokenChange(rotatedUser);

    await waitFor(() => {
      expect(screen.getByTestId("token")).toHaveTextContent("token-2");
    });
    expect(apiClientMocks.setApiToken).toHaveBeenLastCalledWith("token-2");
  });
});
