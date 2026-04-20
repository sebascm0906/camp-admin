/* eslint-disable react-refresh/only-export-components */
import type { User, UserCredential } from "firebase/auth";
import {
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { setApiToken } from "../../api/client";
import { firebaseAuth } from "../../lib/firebase";

type AuthCtx = {
  firebaseUser: User | null;
  token: string | null;
  loading: boolean;
  setToken: (token: string | null) => void;
  isAuthed: boolean;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Pick<AuthCtx, "firebaseUser" | "token" | "loading">>({
    firebaseUser: null,
    token: null,
    loading: true,
  });

  useEffect(() => {
    return onIdTokenChanged(firebaseAuth, async (firebaseUser) => {
      try {
        const token = firebaseUser ? await firebaseUser.getIdToken() : null;

        setApiToken(token);
        setState({
          firebaseUser,
          token,
          loading: false,
        });
      } catch {
        setApiToken(null);
        setState({
          firebaseUser: null,
          token: null,
          loading: false,
        });
      }
    });
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      ...state,
      setToken: (token: string | null) => {
        if (token === null) {
          setApiToken(null);
          setState({
            firebaseUser: null,
            token: null,
            loading: false,
          });
          void firebaseSignOut(firebaseAuth);
          return;
        }

        setApiToken(token);
        setState((current) => ({
          ...current,
          token,
        }));
      },
      isAuthed: !!state.token,
      signIn: async (email: string, password: string) => {
        setState((current) => ({
          ...current,
          loading: true,
        }));

        try {
          return await signInWithEmailAndPassword(firebaseAuth, email, password);
        } catch (error) {
          setState((current) => ({
            ...current,
            loading: false,
          }));
          throw error;
        }
      },
      signOut: async () => {
        setState((current) => ({
          ...current,
          loading: true,
        }));

        try {
          await firebaseSignOut(firebaseAuth);
        } catch (error) {
          setState((current) => ({
            ...current,
            loading: false,
          }));
          throw error;
        }
      },
    }),
    [state]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const value = useContext(Ctx);

  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return value;
}
