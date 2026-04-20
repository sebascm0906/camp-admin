import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import {
  createInvitation,
  listInvitations,
  revokeInvitation,
  type Invitation,
} from "../../api/invitations";
import { InvitationsPage } from "./InvitationsPage";

vi.mock("../../api/invitations", () => ({
  listInvitations: vi.fn(),
  createInvitation: vi.fn(),
  revokeInvitation: vi.fn(),
  reissueInvitation: vi.fn(),
}));

const mockedListInvitations = vi.mocked(listInvitations);
const mockedCreateInvitation = vi.mocked(createInvitation);
const mockedRevokeInvitation = vi.mocked(revokeInvitation);

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <InvitationsPage />
    </QueryClientProvider>,
  );
}

function seedInvitations(): Invitation[] {
  return [
    {
      id: "invite-1",
      email: "pending@example.com",
      role: "counselor",
      expires_at: null,
      used_at: null,
      created_at: "2026-03-27T00:00:00.000Z",
    },
  ];
}

describe("InvitationsPage", () => {
  let store: Invitation[];

  beforeEach(() => {
    store = seedInvitations();
    mockedListInvitations.mockImplementation(async () =>
      store.map((invitation) => ({ ...invitation })),
    );
    mockedCreateInvitation.mockImplementation(async (payload) => {
      const created: Invitation = {
        id: `invite-${store.length + 1}`,
        created_at: "2026-03-28T00:00:00.000Z",
        used_at: null,
        expires_at: payload.expires_at ?? null,
        ...payload,
      };
      store = [created, ...store];
      return created;
    });
    mockedRevokeInvitation.mockImplementation(async (id) => {
      store = store.filter((invitation) => invitation.id !== id);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders invitation rows from the API", async () => {
    renderPage();

    expect(await screen.findByText("pending@example.com")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("counselor")).toBeInTheDocument();
  });

  it("submits the create invitation flow", async () => {
    renderPage();
    const user = userEvent.setup();

    await screen.findByText("pending@example.com");
    await user.click(screen.getByRole("button", { name: /new invitation/i }));

    const dialog = await screen.findByRole("dialog", { name: /create invitation/i });
    await user.type(within(dialog).getByLabelText(/email/i), "admin@example.com");
    await user.selectOptions(within(dialog).getByLabelText(/role/i), "admin");
    await user.click(
      within(dialog).getByRole("button", { name: /send invitation/i }),
    );

    await waitFor(() => {
      expect(mockedCreateInvitation).toHaveBeenCalledWith({
        email: "admin@example.com",
        role: "admin",
        expires_at: null,
      });
    });

    expect(await screen.findByText("admin@example.com")).toBeInTheDocument();
  });

  it("revokes a pending invitation", async () => {
    renderPage();
    const user = userEvent.setup();

    const row = (await screen.findByText("pending@example.com")).closest("tr");
    expect(row).not.toBeNull();

    await user.click(within(row!).getByRole("button", { name: /revoke/i }));

    await waitFor(() => {
      expect(mockedRevokeInvitation).toHaveBeenCalledWith("invite-1");
    });

    await waitFor(() => {
      expect(screen.queryByText("pending@example.com")).not.toBeInTheDocument();
    });
  });
});
