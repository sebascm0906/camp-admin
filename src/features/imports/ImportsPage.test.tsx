import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { runBulkImport } from "../../api/imports";
import { useCampContext } from "../../app/context/useCampContext";
import { ImportsPage } from "./ImportsPage";

vi.mock("../../api/imports", () => ({
  runBulkImport: vi.fn(),
}));

vi.mock("../../app/context/useCampContext", () => ({
  useCampContext: vi.fn(),
}));

const mockedRunBulkImport = vi.mocked(runBulkImport);
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
      <ImportsPage />
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

describe("ImportsPage", () => {
  beforeEach(() => {
    mockedUseCampContext.mockReturnValue(buildCampContext());
    mockedRunBulkImport.mockResolvedValue({
      created_count: 2,
      skipped_count: 0,
      errors: [],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows available import targets and active week context", () => {
    renderPage();

    expect(screen.getByRole("heading", { name: /bulk imports/i })).toBeInTheDocument();
    expect(screen.getByText(/daycamp: e2e week 1/i)).toBeInTheDocument();
    expect(screen.getByText(/overnight: e2e week 1/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/import type/i)).toBeInTheDocument();
  });

  it("imports a daycamp camper CSV file into the active daycamp week", async () => {
    renderPage();
    const user = userEvent.setup();
    const file = new File(
      ["Name,Age,Group,Swim Band\nJane Doe,7,Lazer 1,Red\n"],
      "daycamp-campers.csv",
      { type: "text/csv" },
    );

    await user.selectOptions(screen.getByLabelText(/import type/i), "daycamp-campers");
    await user.upload(screen.getByLabelText(/csv file/i), file);
    expect(await screen.findByText(/loaded daycamp-campers.csv/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^import$/i }));

    await waitFor(() => {
      expect(mockedRunBulkImport).toHaveBeenCalledWith({
        campId: "camp-1",
        csvText: "Name,Age,Group,Swim Band\nJane Doe,7,Lazer 1,Red\n",
        idempotencyKey: expect.stringContaining("camp-admin:daycamp-campers:"),
        replaceExisting: false,
        source: "camp-admin",
        target: {
          type: "daycamp-campers",
          weekId: "week-daycamp-1",
        },
      });
    });
    expect(await screen.findByText(/created 2/i)).toBeInTheDocument();
  });

  it("requires REPLACE confirmation for destructive imports", async () => {
    renderPage();
    const user = userEvent.setup();

    await user.selectOptions(screen.getByLabelText(/import type/i), "slots");
    await user.type(
      screen.getByRole("textbox", { name: /^csv$/i }),
      "activity_code,period,capacity\nSUP,1,10\n",
    );
    await user.click(screen.getByLabelText(/replace existing/i));
    await user.click(screen.getByRole("button", { name: /^import$/i }));

    expect(await screen.findByText(/type replace to confirm/i)).toBeInTheDocument();
    expect(mockedRunBulkImport).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText(/confirm replace/i), "REPLACE");
    await user.click(screen.getByRole("button", { name: /^import$/i }));

    await waitFor(() => {
      expect(mockedRunBulkImport).toHaveBeenCalledWith(
        expect.objectContaining({
          replaceExisting: true,
          target: {
            type: "slots",
            weekId: "week-overnight-1",
          },
        }),
      );
    });
  });

  it("imports staff into both active weeks with one CSV", async () => {
    renderPage();
    const user = userEvent.setup();

    await user.selectOptions(screen.getByLabelText(/import type/i), "staff-both");
    await user.type(
      screen.getByRole("textbox", { name: /^csv$/i }),
      "Name,Email,Group,Cabin\nAlex Lee,alex@example.com,Lazer 1,P1A\n",
    );
    await user.click(screen.getByRole("button", { name: /^import$/i }));

    await waitFor(() => {
      expect(mockedRunBulkImport).toHaveBeenCalledWith(
        expect.objectContaining({
          target: {
            type: "staff-both",
            daycampWeekId: "week-daycamp-1",
            overnightWeekId: "week-overnight-1",
          },
        }),
      );
    });
  });
});
