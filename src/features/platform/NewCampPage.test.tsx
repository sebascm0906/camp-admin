import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import {
  createPlatformCamp,
  type PlatformCampCreateResponse,
} from "../../api/platform";
import { NewCampPage } from "./NewCampPage";

vi.mock("../../api/platform", () => ({
  createPlatformCamp: vi.fn(),
}));

const mockedCreatePlatformCamp = vi.mocked(createPlatformCamp);

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <NewCampPage />
    </QueryClientProvider>,
  );
}

function responseWithEmailStatus(
  emailStatus: PlatformCampCreateResponse["email_status"],
): PlatformCampCreateResponse {
  return {
    camp: {
      id: "camp-1",
      name: "Camp Laurel",
      timezone: "America/Mexico_City",
    },
    root_admin_invitation: {
      id: "invite-1",
      email: "owner@example.com",
    },
    email_status: emailStatus,
    email_error: emailStatus === "failed" ? "SMTP provider unavailable" : undefined,
  };
}

describe("NewCampPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("submits the expected payload and shows success", async () => {
    mockedCreatePlatformCamp.mockResolvedValue(responseWithEmailStatus("sent"));
    renderPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/camp name/i), "  Camp Laurel  ");
    await user.clear(screen.getByLabelText(/timezone/i));
    await user.type(screen.getByLabelText(/timezone/i), "  America/Chicago  ");
    await user.type(screen.getByLabelText(/owner email/i), "  owner@example.com  ");
    await user.type(screen.getByLabelText(/owner first name/i), "  Morgan  ");
    await user.type(screen.getByLabelText(/owner last name/i), "  Diaz  ");
    await user.type(screen.getByLabelText(/notes/i), "  Start with week one.  ");
    await user.click(screen.getByRole("button", { name: /create camp/i }));

    await waitFor(() => {
      expect(mockedCreatePlatformCamp).toHaveBeenCalledWith({
        camp_name: "Camp Laurel",
        timezone: "America/Chicago",
        owner_email: "owner@example.com",
        owner_first_name: "Morgan",
        owner_last_name: "Diaz",
        notes: "Start with week one.",
      });
    });

    expect(await screen.findByText(/Camp Laurel was created/i)).toBeInTheDocument();
    expect(screen.getByText(/owner@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/Email status: sent/i)).toBeInTheDocument();
  });

  it("shows created-but-email-failed state", async () => {
    mockedCreatePlatformCamp.mockResolvedValue(responseWithEmailStatus("failed"));
    renderPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/camp name/i), "Camp Laurel");
    await user.type(screen.getByLabelText(/owner email/i), "owner@example.com");
    await user.click(screen.getByRole("button", { name: /create camp/i }));

    expect(await screen.findByText(/Camp Laurel was created/i)).toBeInTheDocument();
    expect(screen.getByText(/Email status: failed/i)).toBeInTheDocument();
    expect(
      screen.getByText(/The root admin invitation exists, but email delivery failed/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/SMTP provider unavailable/i)).toBeInTheDocument();
  });
});
