/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { setApiSupportContext } from "../../api/client";
import type { PlatformCampRead } from "../../api/platform";
import { useSession } from "../session/useSession";

type SupportCamp = Pick<PlatformCampRead, "id" | "name" | "timezone">;

type SupportContextValue = {
  selectedCamp: SupportCamp | null;
  editMode: boolean;
  reason: string | null;
  isSupportActive: boolean;
  startSupport: (camp: SupportCamp) => void;
  stopSupport: () => void;
  enableEditMode: (reason: string) => void;
  disableEditMode: () => void;
};

const SupportContext = createContext<SupportContextValue | null>(null);

export function SupportProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const isPlatformAdmin =
    session.phase === "ready" && session.user.role === "platform_admin";
  const platformUserId =
    session.phase === "ready" && session.user.role === "platform_admin"
      ? session.user.id
      : null;
  const [selectedCamp, setSelectedCamp] = useState<{
    camp: SupportCamp;
    platformUserId: string;
  } | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const activeSelectedCamp =
    isPlatformAdmin && selectedCamp?.platformUserId === platformUserId
      ? selectedCamp.camp
      : null;

  useEffect(() => {
    setApiSupportContext({
      campId: activeSelectedCamp?.id ?? null,
      editMode: Boolean(activeSelectedCamp && editMode),
      reason: activeSelectedCamp && editMode ? reason : null,
    });

    return () => {
      setApiSupportContext({ campId: null, editMode: false, reason: null });
    };
  }, [activeSelectedCamp, editMode, reason]);

  const startSupport = useCallback((camp: SupportCamp) => {
    if (!platformUserId) {
      return;
    }

    setSelectedCamp({ camp, platformUserId });
    setEditMode(false);
    setReason(null);
  }, [platformUserId]);

  const stopSupport = useCallback(() => {
    setSelectedCamp(null);
    setEditMode(false);
    setReason(null);
  }, []);

  const enableEditMode = useCallback((nextReason: string) => {
    const trimmedReason = nextReason.trim();

    if (!trimmedReason) {
      throw new Error("Support edit mode requires a reason.");
    }

    setEditMode(true);
    setReason(trimmedReason);
  }, []);

  const disableEditMode = useCallback(() => {
    setEditMode(false);
    setReason(null);
  }, []);

  const value = useMemo<SupportContextValue>(
    () => ({
      selectedCamp: activeSelectedCamp,
      editMode,
      reason,
      isSupportActive: Boolean(activeSelectedCamp),
      startSupport,
      stopSupport,
      enableEditMode,
      disableEditMode,
    }),
    [
      disableEditMode,
      editMode,
      enableEditMode,
      reason,
      activeSelectedCamp,
      startSupport,
      stopSupport,
    ],
  );

  return (
    <SupportContext.Provider value={value}>{children}</SupportContext.Provider>
  );
}

export function useSupportContext() {
  const value = useContext(SupportContext);

  if (!value) {
    throw new Error("useSupportContext must be used within SupportProvider");
  }

  return value;
}
