import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import {
  listFormSubmissions,
  type FormSubmission,
} from "../../api/forms";
import { useCampContext } from "../../app/context/useCampContext";
import { FormSubmissionsPage } from "./FormSubmissionsPage";

vi.mock("../../api/forms", () => ({
  listForms: vi.fn(),
  getForm: vi.fn(),
  updateForm: vi.fn(),
  listFormSubmissions: vi.fn(),
}));

vi.mock("../../app/context/useCampContext", () => ({
  useCampContext: vi.fn(),
}));

const mockedListFormSubmissions = vi.mocked(listFormSubmissions);
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
      <FormSubmissionsPage />
    </QueryClientProvider>,
  );
}

function buildCampContext() {
  return {
    currentCamp: { id: "camp-1", name: "Northwoods" },
    camps: [{ id: "camp-1", name: "Northwoods" }],
    weeks: [
      {
        id: "week-1",
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
    selectedOvernightWeekId: "week-1",
    setSelectedDaycampWeekId: vi.fn().mockResolvedValue(undefined),
    setSelectedOvernightWeekId: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn().mockResolvedValue(undefined),
  };
}

function seedSubmissions(): FormSubmission[] {
  return [
    {
      id: "submission-1",
      form_type: "maintenance",
      created_at: "2026-07-10T10:00:00.000Z",
      submitted_by: { id: "user-1", name: "Casey Nguyen" },
      summary: "Hazard: Wet floor (Lodge)",
      details: {
        building: "Lodge",
        issue: "Wet floor",
        potential_hazard: true,
      },
    },
    {
      id: "submission-2",
      form_type: "shoutout",
      created_at: "2026-07-10T11:00:00.000Z",
      submitted_by: { id: "user-2", name: "Morgan Diaz" },
      summary: "Shoutout: Cabin cleanup",
      details: {
        message: "Great teamwork after lunch.",
      },
    },
  ];
}

describe("FormSubmissionsPage", () => {
  let store: FormSubmission[];

  beforeEach(() => {
    store = seedSubmissions();
    mockedUseCampContext.mockReturnValue(buildCampContext());
    mockedListFormSubmissions.mockImplementation(async (weekId, formType) =>
      store.filter((submission) => {
        if (weekId !== "week-1") {
          return false;
        }

        return formType ? submission.form_type === formType : true;
      }),
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders submissions from the API", async () => {
    renderPage();

    expect(
      await screen.findByRole("button", { name: /Hazard: Wet floor/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Shoutout: Cabin cleanup/i }),
    ).toBeInTheDocument();
  });

  it("filters the inbox by submission type", async () => {
    renderPage();
    const user = userEvent.setup();

    await screen.findByRole("button", { name: /Hazard: Wet floor/i });
    await user.selectOptions(screen.getByLabelText(/submission type/i), "maintenance");

    await waitFor(() => {
      expect(mockedListFormSubmissions).toHaveBeenLastCalledWith(
        "week-1",
        "maintenance",
      );
    });

    expect(
      screen.getByRole("button", { name: /Hazard: Wet floor/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Shoutout: Cabin cleanup/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the submission details payload when a row is selected", async () => {
    renderPage();
    const user = userEvent.setup();

    const row = await screen.findByRole("button", { name: /Hazard: Wet floor/i });
    await user.click(row);

    const detailPanel = await screen.findByTestId("submission-detail");
    expect(within(detailPanel).getByText(/Casey Nguyen/i)).toBeInTheDocument();
    expect(within(detailPanel).getByText(/potential_hazard/i)).toBeInTheDocument();
  });
});
