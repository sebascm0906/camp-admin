import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { listCamps } from "../../api/camps";
import { getContext, listWeeks, selectWeek } from "../../api/weeks";
import { useSession } from "../session/useSession";
import { CampProvider } from "./campContext";
import { useCampContext } from "./useCampContext";

vi.mock("../../api/camps", () => ({
  listCamps: vi.fn(),
}));

vi.mock("../../api/weeks", () => ({
  getContext: vi.fn(),
  listWeeks: vi.fn(),
  selectWeek: vi.fn(),
  sortWeeksInTimelineOrder: (weeks: Array<{ start_date: string; end_date: string; id: string }>) =>
    [...weeks].sort((left, right) => {
      const startCompare = left.start_date.localeCompare(right.start_date);
      if (startCompare !== 0) return startCompare;

      const endCompare = left.end_date.localeCompare(right.end_date);
      if (endCompare !== 0) return endCompare;

      return left.id.localeCompare(right.id);
    }),
}));

vi.mock("../session/useSession", () => ({
  useSession: vi.fn(),
}));

const mockedListCamps = vi.mocked(listCamps);
const mockedGetContext = vi.mocked(getContext);
const mockedListWeeks = vi.mocked(listWeeks);
const mockedSelectWeek = vi.mocked(selectWeek);
const mockedUseSession = vi.mocked(useSession);

function buildSessionValue() {
  return {
    retryBootstrap: vi.fn(),
    session: {
      phase: "ready" as const,
      user: {
        id: "user-1",
        firebase_uid: "firebase-1",
        email: "director@example.com",
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
      },
    },
  };
}

function ContextProbe() {
  const {
    currentCamp,
    isLoading,
    selectedDaycampWeekId,
    selectedOvernightWeekId,
  } = useCampContext();

  return (
    <div>
      <div>loading:{String(isLoading)}</div>
      <div>camp:{currentCamp?.name ?? "none"}</div>
      <div>daycamp:{selectedDaycampWeekId ?? "none"}</div>
      <div>overnight:{selectedOvernightWeekId ?? "none"}</div>
    </div>
  );
}

describe("CampProvider", () => {
  beforeEach(() => {
    mockedUseSession.mockReturnValue(buildSessionValue());
    mockedListCamps.mockReset();
    mockedGetContext.mockReset();
    mockedListWeeks.mockReset();
    mockedSelectWeek.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("auto-selects the earliest week in timeline order for each missing week type", async () => {
    mockedListCamps.mockResolvedValue([{ id: "camp-1", name: "Northwoods" }]);
    mockedGetContext.mockResolvedValue({
      active_daycamp_week_id: null,
      active_overnight_week_id: null,
    });
    mockedListWeeks.mockResolvedValue([
      {
        id: "overnight-2",
        camp_id: "camp-1",
        start_date: "2026-07-14",
        end_date: "2026-07-20",
        week_type: "overnight",
        calendar_week_display_name: "Overnight B",
      },
      {
        id: "daycamp-2",
        camp_id: "camp-1",
        start_date: "2026-06-10",
        end_date: "2026-06-14",
        week_type: "daycamp",
        calendar_week_display_name: "Day Camp B",
      },
      {
        id: "daycamp-1",
        camp_id: "camp-1",
        start_date: "2026-06-03",
        end_date: "2026-06-07",
        week_type: "daycamp",
        calendar_week_display_name: "Day Camp A",
      },
      {
        id: "overnight-1",
        camp_id: "camp-1",
        start_date: "2026-07-07",
        end_date: "2026-07-13",
        week_type: "overnight",
        calendar_week_display_name: "Overnight A",
      },
    ]);
    mockedSelectWeek
      .mockResolvedValueOnce({
        active_daycamp_week_id: "daycamp-1",
        active_overnight_week_id: null,
      })
      .mockResolvedValueOnce({
        active_daycamp_week_id: "daycamp-1",
        active_overnight_week_id: "overnight-1",
      });

    render(
      <CampProvider>
        <ContextProbe />
      </CampProvider>
    );

    await waitFor(() => {
      expect(mockedSelectWeek).toHaveBeenNthCalledWith(1, "daycamp-1");
      expect(mockedSelectWeek).toHaveBeenNthCalledWith(2, "overnight-1");
    });

    expect(await screen.findByText("camp:Northwoods")).toBeInTheDocument();
    expect(screen.getByText("daycamp:daycamp-1")).toBeInTheDocument();
    expect(screen.getByText("overnight:overnight-1")).toBeInTheDocument();
  });

  it("uses the active backend context when week selections already exist", async () => {
    mockedListCamps.mockResolvedValue([{ id: "camp-1", name: "Northwoods" }]);
    mockedGetContext.mockResolvedValue({
      active_daycamp_week_id: "daycamp-2",
      active_overnight_week_id: "overnight-1",
    });
    mockedListWeeks.mockResolvedValue([
      {
        id: "daycamp-2",
        camp_id: "camp-1",
        start_date: "2026-06-10",
        end_date: "2026-06-14",
        week_type: "daycamp",
        calendar_week_display_name: "Day Camp B",
      },
      {
        id: "overnight-1",
        camp_id: "camp-1",
        start_date: "2026-07-07",
        end_date: "2026-07-13",
        week_type: "overnight",
        calendar_week_display_name: "Overnight A",
      },
    ]);

    render(
      <CampProvider>
        <ContextProbe />
      </CampProvider>
    );

    expect(await screen.findByText("daycamp:daycamp-2")).toBeInTheDocument();
    expect(screen.getByText("overnight:overnight-1")).toBeInTheDocument();
    expect(mockedSelectWeek).not.toHaveBeenCalled();
  });

  it("falls back to the earliest available week when backend context points to missing ids", async () => {
    mockedListCamps.mockResolvedValue([{ id: "camp-1", name: "Northwoods" }]);
    mockedGetContext.mockResolvedValue({
      active_daycamp_week_id: "missing-daycamp",
      active_overnight_week_id: "missing-overnight",
    });
    mockedListWeeks.mockResolvedValue([
      {
        id: "daycamp-2",
        camp_id: "camp-1",
        start_date: "2026-06-10",
        end_date: "2026-06-14",
        week_type: "daycamp",
        calendar_week_display_name: "Day Camp B",
      },
      {
        id: "daycamp-1",
        camp_id: "camp-1",
        start_date: "2026-06-03",
        end_date: "2026-06-07",
        week_type: "daycamp",
        calendar_week_display_name: "Day Camp A",
      },
      {
        id: "overnight-1",
        camp_id: "camp-1",
        start_date: "2026-07-07",
        end_date: "2026-07-13",
        week_type: "overnight",
        calendar_week_display_name: "Overnight A",
      },
    ]);

    render(
      <CampProvider>
        <ContextProbe />
      </CampProvider>
    );

    expect(await screen.findByText("daycamp:daycamp-1")).toBeInTheDocument();
    expect(screen.getByText("overnight:overnight-1")).toBeInTheDocument();
    expect(mockedSelectWeek).not.toHaveBeenCalled();
  });
});
