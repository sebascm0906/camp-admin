/* eslint-disable react-hooks/set-state-in-effect, react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { claimInvitation, getAuthStatus, getMe } from "../../api/auth";
import { useAuth } from "../../features/auth/useAuth";
import type { AuthenticatedUser } from "./sessionTypes";

export type SessionState =
  | { phase: "signed_out" }
  | { phase: "loading" }
  | { phase: "blocked"; reason: "UNINVITED" | "INVITED" | "BOOTSTRAP_ELIGIBLE" }
  | { phase: "error"; step: "status" | "claim" | "me" }
  | { phase: "ready"; user: AuthenticatedUser };

type SessionContextValue = {
  session: SessionState;
  retryBootstrap: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { loading: authLoading, token } = useAuth();
  const [session, setSession] = useState<SessionState>({ phase: "loading" });
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0);
  const claimedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (authLoading) {
      setSession({ phase: "loading" });
      return () => {
        cancelled = true;
      };
    }

    if (!token) {
      claimedTokenRef.current = null;
      setSession({ phase: "signed_out" });
      return () => {
        cancelled = true;
      };
    }

    async function bootstrapSession() {
      setSession({ phase: "loading" });

      try {
        const status = await getAuthStatus();

        if (cancelled) {
          return;
        }

        if (status.state === "UNINVITED" || status.state === "BOOTSTRAP_ELIGIBLE") {
          setSession({
            phase: "blocked",
            reason: status.state,
          });
          return;
        }

        if (status.state === "INVITED" && claimedTokenRef.current !== token) {
          try {
            await claimInvitation();
            claimedTokenRef.current = token;
          } catch {
            if (!cancelled) {
              setSession({
                phase: "error",
                step: "claim",
              });
            }
            return;
          }

          if (cancelled) {
            return;
          }
        }

        let user: AuthenticatedUser;

        try {
          user = await getMe();
        } catch {
          if (!cancelled) {
            setSession({
              phase: "error",
              step: "me",
            });
          }
          return;
        }

        if (cancelled) {
          return;
        }

        setSession({
          phase: "ready",
          user,
        });
      } catch {
        if (!cancelled) {
          setSession({
            phase: "error",
            step: "status",
          });
        }
      }
    }

    void bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, [authLoading, bootstrapAttempt, token]);

  return (
    <SessionContext.Provider
      value={{
        session,
        retryBootstrap: () => {
          setSession({ phase: "loading" });
          setBootstrapAttempt((current) => current + 1);
        },
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext() {
  const value = useContext(SessionContext);

  if (!value) {
    throw new Error("useSession must be used within SessionProvider");
  }

  return value;
}

export function useOptionalSessionContext() {
  return useContext(SessionContext);
}
