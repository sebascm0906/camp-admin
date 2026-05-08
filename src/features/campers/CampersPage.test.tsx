import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import {
  createCamper,
  importCampers,
  listCampers,
  updateCamper,
  type CamperDirectory,
  type CamperListEntry,
} from "../../api/campers";
import { useCampContext } from "../../app/context/useCampContext";
import { CampersPage } from "./CampersPage";

vi.mock("../../api/campers", () => ({
  listCampers: vi.fn(),
  createCamper: vi.fn(),
  updateCamper: vi.fn(),
  importCampers: vi.fn(),
}));

vi.mock("../../app/context/useCampContext", () => ({
  useCampContext: vi.fn(),
}));

const mockedListCampers = vi.mocked(listCampers);
const mockedCreateCamper = vi.mocked(createCamper);
const mockedUpdateCamper = vi.mocked(updateCamper);
const mockedImportCampers = vi.mocked(importCampers);
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
      <CampersPage />
    </QueryClientProvider>,
  );
}

function buildCampContext(overrides: Partial<ReturnType<typeof useCampContext>> = {}) {
  return {
    currentCamp: { id: "camp-1", name: "Northwoods" },
    camps: [{ id: "camp-1", name: "Northwoods" }],
    weeks: [
      {
        id: "week-daycamp-1",
        camp_id: "camp-1",
        start_date: "2026-06-03",
        end_date: "2026-06-07",
        week_type: "daycamp" as const,
        calendar_week_display_name: "Day Camp A",
      },
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
    selectedDaycampWeekId: "week-daycamp-1",
    selectedOvernightWeekId: "week-overnight-1",
    setSelectedDaycampWeekId: vi.fn().mockResolvedValue(undefined),
    setSelectedOvernightWeekId: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function seedDirectory(): CamperDirectory {
  return {
    campers: [
      {
        id: "camper-1",
        first_name: "Avery",
        last_name: "Stone",
        age: 11,
        swimband: "red",
        week_type: "daycamp",
        group: { id: null, name: "Falcons" },
      } satisfies CamperListEntry,
    ],
    camper_details: {
      "camper-1": {
        id: "camper-1",
        first_name: "Avery",
        last_name: "Stone",
        age: 11,
        age_group: "Juniors",
        swimband: "red",
        week_id: "week-daycamp-1",
        camp_id: "camp-1",
        mode: "daycamp",
        week_type: "daycamp",
        group: { id: null, name: "Falcons" },
        cabin: null,
        registrations_by_period: { "1": null, "2": null, "3": null },
        attendance: {
          type: "daycamp",
          range: { start_date: "2026-06-03", end_date: "2026-06-07" },
          days: {},
          days_updated_at: {},
        },
        on_site: null,
        on_site_updated_at: null,
        notes: "Nut allergy",
      },
    },
  };
}

describe("CampersPage", () => {
  let store: CamperDirectory;

  beforeEach(() => {
    store = seedDirectory();
    mockedUseCampContext.mockReturnValue(buildCampContext());
    mockedListCampers.mockImplementation(async () => ({
      campers: store.campers.map((camper) => ({ ...camper })),
      camper_details: Object.fromEntries(
        Object.entries(store.camper_details).map(([id, detail]) => [id, { ...detail }]),
      ),
    }));
    mockedCreateCamper.mockImplementation(async (_campId, weekId, payload) => {
      const createdId = `camper-${store.campers.length + 1}`;
      const createdDetail = {
        id: createdId,
        first_name: payload.first_name ?? null,
        last_name: payload.last_name ?? null,
        age: payload.age ?? null,
        age_group: payload.age_group ?? null,
        swimband: payload.swimband ?? "red",
        week_id: weekId,
        camp_id: "camp-1",
        mode: "daycamp" as const,
        week_type: "daycamp" as const,
        group: { id: payload.group_id ?? null, name: payload.group_name ?? null },
        cabin: null,
        registrations_by_period: { "1": null, "2": null, "3": null },
        attendance: {
          type: "daycamp" as const,
          range: { start_date: "2026-06-03", end_date: "2026-06-07" },
          days: {},
          days_updated_at: {},
        },
        on_site: null,
        on_site_updated_at: null,
        notes: null,
      };
      store = {
        campers: [
          ...store.campers,
          {
            id: createdId,
            first_name: createdDetail.first_name,
            last_name: createdDetail.last_name,
            age: createdDetail.age,
            swimband: createdDetail.swimband,
            week_type: "daycamp",
            group: createdDetail.group,
          },
        ],
        camper_details: {
          ...store.camper_details,
          [createdId]: createdDetail,
        },
      };

      return {
        id: createdId,
        camp_id: "camp-1",
        week_id: weekId,
        first_name: createdDetail.first_name,
        last_name: createdDetail.last_name,
        age: createdDetail.age,
        age_group: createdDetail.age_group,
        swimband: createdDetail.swimband,
        group_id: payload.group_id ?? null,
        group_name: payload.group_name ?? null,
        cabin_id: payload.cabin_id ?? null,
        notes: null,
      };
    });
    mockedUpdateCamper.mockImplementation(async (camperId, payload) => {
      const existing = store.camper_details[camperId];

      if (!existing) {
        throw new Error("Camper not found");
      }

      const updatedDetail = {
        ...existing,
        ...payload,
        swimband: payload.swimband ?? existing.swimband,
        group:
          existing.week_type === "daycamp"
            ? {
                id: payload.group_id ?? existing.group?.id ?? null,
                name: payload.group_name ?? existing.group?.name ?? null,
              }
            : existing.group,
        notes: payload.notes ?? existing.notes,
      };

      store = {
        campers: store.campers.map((camper) =>
          camper.id === camperId
            ? camper.week_type === "daycamp"
              ? {
                  ...camper,
                  ...payload,
                  swimband: payload.swimband ?? camper.swimband,
                  group: {
                    id: payload.group_id ?? camper.group?.id ?? null,
                    name: payload.group_name ?? camper.group?.name ?? null,
                  },
                }
              : {
                  ...camper,
                  ...payload,
                  swimband: payload.swimband ?? camper.swimband,
                }
            : camper,
        ),
        camper_details: {
          ...store.camper_details,
          [camperId]: updatedDetail,
        },
      };

      return {
        id: camperId,
        camp_id: existing.camp_id,
        week_id: existing.week_id,
        first_name: updatedDetail.first_name,
        last_name: updatedDetail.last_name,
        age: updatedDetail.age,
        age_group: updatedDetail.age_group,
        swimband: updatedDetail.swimband,
        group_id: updatedDetail.group?.id ?? null,
        group_name: updatedDetail.group?.name ?? null,
        cabin_id: updatedDetail.cabin?.id ?? null,
        notes: updatedDetail.notes,
      };
    });
    mockedImportCampers.mockResolvedValue({
      created_count: 2,
      skipped_count: 0,
      errors: [],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows an empty state when no active week is selected", async () => {
    mockedUseCampContext.mockReturnValue(
      buildCampContext({
        selectedDaycampWeekId: null,
        selectedOvernightWeekId: null,
      }),
    );

    renderPage();

    expect(await screen.findByText(/no active week selected/i)).toBeInTheDocument();
    expect(mockedListCampers).not.toHaveBeenCalled();
  });

  it("renders campers for the selected week", async () => {
    renderPage();

    expect(await screen.findByText("Avery Stone")).toBeInTheDocument();
    expect(screen.getByText("Falcons")).toBeInTheDocument();
    expect(screen.getByText("red")).toBeInTheDocument();
  });

  it("submits the create camper flow", async () => {
    renderPage();
    const user = userEvent.setup();

    await screen.findByText("Avery Stone");
    await user.click(screen.getByRole("button", { name: /add camper/i }));

    const dialog = await screen.findByRole("dialog", { name: /create camper/i });
    await user.type(within(dialog).getByLabelText(/first name/i), "Mia");
    await user.type(within(dialog).getByLabelText(/last name/i), "Lopez");
    await user.type(within(dialog).getByRole("spinbutton", { name: /^age$/i }), "9");
    await user.type(within(dialog).getByLabelText(/age group/i), "Explorers");
    await user.type(within(dialog).getByLabelText(/group name/i), "Owls");
    await user.click(within(dialog).getByRole("button", { name: /save camper/i }));

    await waitFor(() => {
      expect(mockedCreateCamper).toHaveBeenCalledWith("camp-1", "week-daycamp-1", {
        first_name: "Mia",
        last_name: "Lopez",
        age: 9,
        age_group: "Explorers",
        swimband: "red",
        group_name: "Owls",
      });
    });

    expect(await screen.findByText("Mia Lopez")).toBeInTheDocument();
  });

  it("submits the update camper flow", async () => {
    renderPage();
    const user = userEvent.setup();

    const row = (await screen.findByText("Avery Stone")).closest("tr");
    expect(row).not.toBeNull();

    await user.click(within(row!).getByRole("button", { name: /edit/i }));

    const dialog = await screen.findByRole("dialog", { name: /edit camper/i });
    await user.selectOptions(within(dialog).getByLabelText(/swimband/i), "green");
    await user.clear(within(dialog).getByLabelText(/notes/i));
    await user.type(within(dialog).getByLabelText(/notes/i), "Needs sunscreen");
    await user.click(within(dialog).getByRole("button", { name: /update camper/i }));

    await waitFor(() => {
      expect(mockedUpdateCamper).toHaveBeenCalledWith("camper-1", {
        first_name: "Avery",
        last_name: "Stone",
        age: 11,
        age_group: "Juniors",
        swimband: "green",
        group_name: "Falcons",
        notes: "Needs sunscreen",
      });
    });

    expect(await screen.findByText("green")).toBeInTheDocument();
  });

  it("loads camper import CSV from a selected file", async () => {
    renderPage();
    const user = userEvent.setup();

    await screen.findByText("Avery Stone");
    await user.click(screen.getByRole("button", { name: /import csv/i }));

    const dialog = await screen.findByRole("dialog", { name: /import campers/i });
    const file = new File(
      ["Name,Age,Group,Swim Band\nJane Doe,7,Lazer 1,Red\n"],
      "daycamp-roster.csv",
      { type: "text/csv" },
    );

    await user.upload(within(dialog).getByLabelText(/csv file/i), file);

    expect(await within(dialog).findByText(/daycamp-roster.csv/i)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: /run import/i }));

    await waitFor(() => {
      expect(mockedImportCampers).toHaveBeenCalledWith("camp-1", "week-daycamp-1", {
        csv_text: "Name,Age,Group,Swim Band\nJane Doe,7,Lazer 1,Red\n",
        replace_existing: false,
        source: "camp-admin",
      });
    });
  });
});
