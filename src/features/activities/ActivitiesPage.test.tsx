import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import {
  createActivity,
  listActivities,
  updateActivity,
  type ActivityRead,
} from "../../api/activities";
import {
  generateActivitySlots,
  listSlots,
  type SlotRead,
} from "../../api/slots";
import { useCampContext } from "../../app/context/useCampContext";
import { ActivitiesPage } from "./ActivitiesPage";

vi.mock("../../api/activities", () => ({
  listActivities: vi.fn(),
  createActivity: vi.fn(),
  updateActivity: vi.fn(),
}));

vi.mock("../../api/slots", () => ({
  listSlots: vi.fn(),
  generateActivitySlots: vi.fn(),
}));

vi.mock("../../app/context/useCampContext", () => ({
  useCampContext: vi.fn(),
}));

const mockedListActivities = vi.mocked(listActivities);
const mockedCreateActivity = vi.mocked(createActivity);
const mockedUpdateActivity = vi.mocked(updateActivity);
const mockedListSlots = vi.mocked(listSlots);
const mockedGenerateActivitySlots = vi.mocked(generateActivitySlots);
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
      <ActivitiesPage />
    </QueryClientProvider>,
  );
}

function buildCampContext() {
  return {
    currentCamp: { id: "camp-1", name: "Northwoods" },
    camps: [{ id: "camp-1", name: "Northwoods" }],
    weeks: [
      {
        id: "week-overnight-1",
        camp_id: "camp-1",
        start_date: "2026-07-07",
        end_date: "2026-07-13",
        week_type: "overnight" as const,
        calendar_week_display_name: "Overnight A",
      },
    ],
    isLoading: false,
    error: null,
    selectedDaycampWeekId: null,
    selectedOvernightWeekId: "week-overnight-1",
    setSelectedDaycampWeekId: vi.fn().mockResolvedValue(undefined),
    setSelectedOvernightWeekId: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn().mockResolvedValue(undefined),
  };
}

function seedActivities(): ActivityRead[] {
  return [
    {
      id: "activity-1",
      camp_id: "camp-1",
      name: "Archery",
      description: "Outdoor range",
      duration_slots: 1,
      requires_green_band: false,
      min_age: 10,
      image_url: null,
    },
  ];
}

function seedSlots(): SlotRead[] {
  return [
    {
      id: "slot-1",
      week_id: "week-overnight-1",
      activity_id: "activity-1",
      period: 1,
      start_time: "09:00:00",
      end_time: "09:50:00",
      capacity: 12,
    },
  ];
}

describe("ActivitiesPage", () => {
  let activitiesStore: ActivityRead[];
  let slotsStore: SlotRead[];

  beforeEach(() => {
    activitiesStore = seedActivities();
    slotsStore = seedSlots();
    mockedUseCampContext.mockReturnValue(buildCampContext());
    mockedListActivities.mockImplementation(async () =>
      activitiesStore.map((activity) => ({ ...activity })),
    );
    mockedCreateActivity.mockImplementation(async (_campId, payload) => {
      const created: ActivityRead = {
        id: `activity-${activitiesStore.length + 1}`,
        camp_id: "camp-1",
        description: payload.description ?? null,
        duration_slots: payload.duration_slots ?? 1,
        requires_green_band: payload.requires_green_band ?? false,
        min_age: payload.min_age ?? null,
        image_url: payload.image_url ?? null,
        name: payload.name,
      };
      activitiesStore = [...activitiesStore, created];
      return created;
    });
    mockedUpdateActivity.mockImplementation(async (activityId, payload) => {
      const existing = activitiesStore.find((activity) => activity.id === activityId);

      if (!existing) {
        throw new Error("Activity not found");
      }

      const updated: ActivityRead = {
        ...existing,
        ...payload,
      };
      activitiesStore = activitiesStore.map((activity) =>
        activity.id === activityId ? updated : activity,
      );
      return updated;
    });
    mockedListSlots.mockImplementation(async () =>
      slotsStore.map((slot) => ({ ...slot })),
    );
    mockedGenerateActivitySlots.mockImplementation(
      async (_campId, weekId, activityId, payload) => {
        const createdPeriod = payload.periods[payload.periods.length - 1] ?? 1;
        slotsStore = [
          ...slotsStore,
          {
            id: `slot-${slotsStore.length + 1}`,
            week_id: weekId,
            activity_id: activityId,
            period: createdPeriod,
            start_time: "10:00:00",
            end_time: "10:50:00",
            capacity: payload.capacity,
          },
        ];
        return { created_count: 1, skipped_count: 0 };
      },
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders activities and slots for the active overnight week", async () => {
    renderPage();

    expect(await screen.findByRole("cell", { name: "Archery" })).toBeInTheDocument();
    expect(screen.getByText("Outdoor range")).toBeInTheDocument();
    expect(screen.getByText(/period 1/i)).toBeInTheDocument();
    expect(screen.getByText(/capacity 12/i)).toBeInTheDocument();
  });

  it("submits the create activity flow", async () => {
    renderPage();
    const user = userEvent.setup();

    await screen.findByRole("cell", { name: "Archery" });
    await user.click(screen.getByRole("button", { name: /add activity/i }));

    const dialog = await screen.findByRole("dialog", { name: /create activity/i });
    await user.type(within(dialog).getByLabelText(/name/i), "Climbing");
    await user.type(
      within(dialog).getByLabelText(/description/i),
      "Wall and ropes",
    );
    await user.type(
      within(dialog).getByRole("spinbutton", { name: /min age/i }),
      "12",
    );
    await user.selectOptions(
      within(dialog).getByLabelText(/duration slots/i),
      "2",
    );
    await user.click(within(dialog).getByRole("button", { name: /save activity/i }));

    await waitFor(() => {
      expect(mockedCreateActivity).toHaveBeenCalledWith("camp-1", {
        name: "Climbing",
        description: "Wall and ropes",
        duration_slots: 2,
        requires_green_band: false,
        min_age: 12,
      });
    });

    expect(await screen.findByRole("cell", { name: "Climbing" })).toBeInTheDocument();
  });

  it("submits the update activity flow", async () => {
    renderPage();
    const user = userEvent.setup();

    const row = (await screen.findByRole("cell", { name: "Archery" })).closest("tr");
    expect(row).not.toBeNull();

    await user.click(within(row!).getByRole("button", { name: /edit/i }));

    const dialog = await screen.findByRole("dialog", { name: /edit activity/i });
    await user.click(within(dialog).getByLabelText(/requires green band/i));
    await user.click(
      within(dialog).getByRole("button", { name: /update activity/i }),
    );

    await waitFor(() => {
      expect(mockedUpdateActivity).toHaveBeenCalledWith("activity-1", {
        name: "Archery",
        description: "Outdoor range",
        duration_slots: 1,
        requires_green_band: true,
        min_age: 10,
      });
    });
  });

  it("generates slots for the selected activity", async () => {
    renderPage();
    const user = userEvent.setup();

    await screen.findByRole("cell", { name: "Archery" });
    await user.click(screen.getByRole("button", { name: /generate slots/i }));

    const dialog = await screen.findByRole("dialog", { name: /generate slots/i });
    await user.click(within(dialog).getByLabelText(/period 2/i));
    await user.clear(within(dialog).getByRole("spinbutton", { name: /capacity/i }));
    await user.type(within(dialog).getByRole("spinbutton", { name: /capacity/i }), "16");
    await user.click(
      within(dialog).getByRole("button", { name: /run generation/i }),
    );

    await waitFor(() => {
      expect(mockedGenerateActivitySlots).toHaveBeenCalledWith(
        "camp-1",
        "week-overnight-1",
        "activity-1",
        {
          periods: [1, 2],
          capacity: 16,
          replace_existing: false,
        },
      );
    });

    expect(await screen.findByText(/period 2/i)).toBeInTheDocument();
    expect(screen.getByText(/capacity 16/i)).toBeInTheDocument();
  });
});
