import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { useCampContext } from "../../app/context/useCampContext";
import { WeekSelector } from "./WeekSelector";

vi.mock("../../app/context/useCampContext", () => ({
  useCampContext: vi.fn(),
}));

const mockedUseCampContext = vi.mocked(useCampContext);

function buildCampContextValue() {
  return {
    currentCamp: { id: "camp-1", name: "Northwoods" },
    camps: [{ id: "camp-1", name: "Northwoods" }],
    weeks: [
      {
        id: "daycamp-2",
        camp_id: "camp-1",
        start_date: "2026-06-10",
        end_date: "2026-06-14",
        week_type: "daycamp" as const,
        calendar_week_display_name: "Day Camp B",
      },
      {
        id: "overnight-1",
        camp_id: "camp-1",
        start_date: "2026-07-07",
        end_date: "2026-07-13",
        week_type: "overnight" as const,
        calendar_week_display_name: "Overnight A",
      },
      {
        id: "daycamp-1",
        camp_id: "camp-1",
        start_date: "2026-06-03",
        end_date: "2026-06-07",
        week_type: "daycamp" as const,
        calendar_week_display_name: "Day Camp A",
      },
    ],
    isLoading: false,
    error: null,
    selectedDaycampWeekId: "daycamp-1",
    selectedOvernightWeekId: "overnight-1",
    setSelectedDaycampWeekId: vi.fn().mockResolvedValue(undefined),
    setSelectedOvernightWeekId: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn().mockResolvedValue(undefined),
  };
}

describe("WeekSelector", () => {
  beforeEach(() => {
    mockedUseCampContext.mockReturnValue(buildCampContextValue());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders timeline-sorted week options for each available week type", () => {
    render(<WeekSelector />);

    const daycampSelect = screen.getByLabelText(/day camp week/i);
    const overnightSelect = screen.getByLabelText(/overnight week/i);

    expect(
      within(daycampSelect).getAllByRole("option").map((option) => option.textContent)
    ).toEqual([
      "Day Camp A · Jun 3-7, 2026",
      "Day Camp B · Jun 10-14, 2026",
    ]);
    expect(
      within(overnightSelect).getAllByRole("option").map((option) => option.textContent)
    ).toEqual(["Overnight A · Jul 7-13, 2026"]);
  });

  it("persists a changed day camp selection through camp context", async () => {
    const user = userEvent.setup();
    const setSelectedDaycampWeekId = vi.fn().mockResolvedValue(undefined);

    mockedUseCampContext.mockReturnValue({
      ...buildCampContextValue(),
      setSelectedDaycampWeekId,
    });

    render(<WeekSelector />);

    await user.selectOptions(screen.getByLabelText(/day camp week/i), "daycamp-2");

    expect(setSelectedDaycampWeekId).toHaveBeenCalledWith("daycamp-2");
  });
});
