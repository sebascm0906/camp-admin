/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { listCamps, type Camp } from "../../api/camps";
import {
  getContext,
  listWeeks,
  selectWeek,
  type CampContextState,
  type Week,
  sortWeeksInTimelineOrder,
} from "../../api/weeks";
import { useSession } from "../session/useSession";

type CampContextValue = {
  currentCamp: Camp | null;
  camps: Camp[];
  weeks: Week[];
  isLoading: boolean;
  error: string | null;
  selectedDaycampWeekId: string | null;
  selectedOvernightWeekId: string | null;
  setSelectedDaycampWeekId: (weekId: string) => Promise<void>;
  setSelectedOvernightWeekId: (weekId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const CampContext = createContext<CampContextValue | null>(null);

function resolveCurrentCamp(camps: Camp[], campId: string | null) {
  if (!campId) return camps[0] ?? null;
  return camps.find((camp) => camp.id === campId) ?? camps[0] ?? null;
}

function resolveSelectedWeekId(
  candidateId: string | null | undefined,
  weeks: Week[],
  weekType: Week["week_type"],
) {
  if (
    candidateId &&
    weeks.some((week) => week.id === candidateId && week.week_type === weekType)
  ) {
    return candidateId;
  }

  return weeks.find((week) => week.week_type === weekType)?.id ?? null;
}

function normalizeContext(context: CampContextState, weeks: Week[]) {
  return {
    selectedDaycampWeekId: resolveSelectedWeekId(
      context.active_daycamp_week_id,
      weeks,
      "daycamp",
    ),
    selectedOvernightWeekId: resolveSelectedWeekId(
      context.active_overnight_week_id,
      weeks,
      "overnight",
    ),
  };
}

export function CampProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const effectiveCampId =
    session.phase === "ready"
      ? session.user.effective_camp_id ?? session.user.camp_id
      : null;
  const [state, setState] = useState<Omit<
    CampContextValue,
    "setSelectedDaycampWeekId" | "setSelectedOvernightWeekId" | "refresh"
  >>({
    currentCamp: null,
    camps: [],
    weeks: [],
    isLoading: false,
    error: null,
    selectedDaycampWeekId: null,
    selectedOvernightWeekId: null,
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const selectionRequestId = useRef(0);

  useEffect(() => {
    let cancelled = false;

    if (session.phase !== "ready" || !effectiveCampId) {
      selectionRequestId.current += 1;
      setState({
        currentCamp: null,
        camps: [],
        weeks: [],
        isLoading: false,
        error: null,
        selectedDaycampWeekId: null,
        selectedOvernightWeekId: null,
      });
      return () => {
        cancelled = true;
      };
    }

    async function loadCampContext() {
      const campId = effectiveCampId;

      if (!campId) {
        return;
      }

      selectionRequestId.current += 1;

      setState({
        currentCamp: null,
        camps: [],
        weeks: [],
        isLoading: true,
        error: null,
        selectedDaycampWeekId: null,
        selectedOvernightWeekId: null,
      });

      try {
        const [camps, backendContext, loadedWeeks] = await Promise.all([
          listCamps(),
          getContext(),
          listWeeks(campId),
        ]);

        if (cancelled) return;

        const weeks = sortWeeksInTimelineOrder(loadedWeeks);
        const firstDaycamp = weeks.find((week) => week.week_type === "daycamp");
        const firstOvernight = weeks.find((week) => week.week_type === "overnight");
        let nextContext = backendContext;

        if (!nextContext.active_daycamp_week_id && firstDaycamp) {
          nextContext = await selectWeek(firstDaycamp.id);
          if (cancelled) return;
        }

        if (!nextContext.active_overnight_week_id && firstOvernight) {
          nextContext = await selectWeek(firstOvernight.id);
          if (cancelled) return;
        }

        setState({
          currentCamp: resolveCurrentCamp(camps, campId),
          camps,
          weeks,
          isLoading: false,
          error: null,
          ...normalizeContext(nextContext, weeks),
        });
      } catch (error) {
        if (cancelled) return;

        setState((current) => ({
          ...current,
          currentCamp: null,
          camps: [],
          weeks: [],
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : "Unable to load camp context.",
          selectedDaycampWeekId: null,
          selectedOvernightWeekId: null,
        }));
      }
    }

    void loadCampContext();

    return () => {
      cancelled = true;
    };
  }, [effectiveCampId, refreshKey, session.phase]);

  const updateSelectedWeek = useCallback(
    async (weekId: string) => {
      selectionRequestId.current += 1;
      const requestId = selectionRequestId.current;
      const nextContext = await selectWeek(weekId);

      if (requestId !== selectionRequestId.current) {
        return;
      }

      setState((current) => ({
        ...current,
        ...normalizeContext(nextContext, current.weeks),
        error: null,
      }));
    },
    [],
  );

  const refresh = useCallback(async () => {
    setRefreshKey((current) => current + 1);
  }, []);

  const value = useMemo<CampContextValue>(
    () => ({
      ...state,
      setSelectedDaycampWeekId: async (weekId: string) => {
        await updateSelectedWeek(weekId);
      },
      setSelectedOvernightWeekId: async (weekId: string) => {
        await updateSelectedWeek(weekId);
      },
      refresh,
    }),
    [refresh, state, updateSelectedWeek],
  );

  return <CampContext.Provider value={value}>{children}</CampContext.Provider>;
}

export function useCampContextValue() {
  const value = useContext(CampContext);

  if (!value) {
    throw new Error("useCampContext must be used within CampProvider");
  }

  return value;
}
