import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { createCalendarWeek } from "../../api/weeks";
import { useCampContext } from "../../app/context/useCampContext";
import { WeeksPage } from "./WeeksPage";

vi.mock("../../api/weeks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../api/weeks")>();
  return {
    ...actual,
    createCalendarWeek: vi.fn(),
  };
});

vi.mock("../../app/context/useCampContext", () => ({
  useCampContext: vi.fn(),
}));

const mockedCreateCalendarWeek = vi.mocked(createCalendarWeek);
const mockedUseCampContext = vi.mocked(useCampContext);

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <WeeksPage />
    </QueryClientProvider>,
  );
}

function buildCampContext() {
  return {
    currentCamp: { id: "camp-1", name: "Northwoods" },
    camps: [{ id: "camp-1", name: "Northwoods" }],
    weeks: [
      {
        id: "week-daycamp-1",
        camp_id: "camp-1",
        start_date: "2026-06-01",
        end_date: "2026-06-05",
        week_type: "daycamp" as const,
        calendar_week_display_name: "E2E Week 1",
      },
      {
        id: "week-overnight-1",
        camp_id: "camp-1",
        start_date: "2026-06-01",
        end_date: "2026-06-07",
        week_type: "overnight" as const,
        calendar_week_display_name: "E2E Week 1",
      },
    ],
    isLoading: false,
    error: null,
    selectedDaycampWeekId: "week-daycamp-1",
    selectedOvernightWeekId: "week-overnight-1",
    setSelectedDaycampWeekId: vi.fn().mockResolvedValue(undefined),
    setSelectedOvernightWeekId: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn().mockResolvedValue(undefined),
  };
}

describe("WeeksPage", () => {
  beforeEach(() => {
    mockedUseCampContext.mockReturnValue(buildCampContext());
    mockedCreateCalendarWeek.mockResolvedValue({
      calendar_week_key: "calendar-week-1",
      daycamp_week: {
        id: "week-daycamp-2",
        camp_id: "camp-1",
        start_date: "2026-06-08",
        end_date: "2026-06-12",
        week_type: "daycamp",
        calendar_week_display_name: "E2E Week 2",
      },
      overnight_week: {
        id: "week-overnight-2",
        camp_id: "camp-1",
        start_date: "2026-06-08",
        end_date: "2026-06-14",
        week_type: "overnight",
        calendar_week_display_name: "E2E Week 2",
      },
      template_result: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders existing daycamp and overnight weeks", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 4, name: "Weeks" })).toBeInTheDocument();
    expect(screen.getAllByText("E2E Week 1")).toHaveLength(2);
    expect(screen.getByText("daycamp")).toBeInTheDocument();
    expect(screen.getByText("overnight")).toBeInTheDocument();
    expect(screen.getByText("2026-06-01 to 2026-06-05")).toBeInTheDocument();
    expect(screen.getByText("2026-06-01 to 2026-06-07")).toBeInTheDocument();
  });

  it("creates a paired calendar week and refreshes camp context", async () => {
    const context = buildCampContext();
    mockedUseCampContext.mockReturnValue(context);
    renderPage();
    const user = userEvent.setup();

    const form = screen.getByRole("form", { name: /create calendar week/i });
    await user.clear(within(form).getByLabelText(/display name/i));
    await user.type(within(form).getByLabelText(/display name/i), "E2E Week 2");
    await user.clear(within(form).getByLabelText(/overnight start date/i));
    await user.type(within(form).getByLabelText(/overnight start date/i), "2026-06-08");
    await user.clear(within(form).getByLabelText(/overnight end date/i));
    await user.type(within(form).getByLabelText(/overnight end date/i), "2026-06-14");
    await user.click(within(form).getByRole("button", { name: /create week/i }));

    await waitFor(() => {
      expect(mockedCreateCalendarWeek).toHaveBeenCalledWith("camp-1", {
        display_name: "E2E Week 2",
        overnight_start_date: "2026-06-08",
        overnight_end_date: "2026-06-14",
      });
    });
    expect(context.refresh).toHaveBeenCalledTimes(1);
  });
});
