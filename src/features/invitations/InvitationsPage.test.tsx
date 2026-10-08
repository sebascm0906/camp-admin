import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import {
  createInvitation,
  listInvitations,
  reissueInvitation,
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
const mockedReissueInvitation = vi.mocked(reissueInvitation);

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
    mockedReissueInvitation.mockImplementation(async (id) => {
      const existing = store.find((invitation) => invitation.id === id);
      if (!existing) throw new Error("Not found");
      const updated = { ...existing, id: `${id}-renewed` };
      store = store.map((invitation) =>
        invitation.id === id ? updated : invitation,
      );
      return updated;
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

    const dialog = await screen.findByRole("dialog", {
      name: /create invitation/i,
    });
    await user.type(
      within(dialog).getByLabelText(/email/i),
      "admin@example.com",
    );
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

  it("uses the replacement ID for subsequent renewals and revocation", async () => {
    renderPage();
    const user = userEvent.setup();
    await screen.findByText("pending@example.com");

    await user.click(screen.getByRole("button", { name: /^reissue$/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^reissue$/i })).toBeEnabled(),
    );
    await user.click(screen.getByRole("button", { name: /^reissue$/i }));
    await waitFor(() =>
      expect(mockedReissueInvitation).toHaveBeenNthCalledWith(
        2,
        "invite-1-renewed",
      ),
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^revoke$/i })).toBeEnabled(),
    );
    await user.click(screen.getByRole("button", { name: /^revoke$/i }));
    await waitFor(() =>
      expect(mockedRevokeInvitation).toHaveBeenCalledWith(
        "invite-1-renewed-renewed",
      ),
    );
  });

  it("refreshes a stale invitation after a 404 without automatically retrying the mutation", async () => {
    renderPage();
    const user = userEvent.setup();
    await screen.findByText("pending@example.com");
    store = [{ ...store[0], id: "invite-current" }];
    mockedReissueInvitation.mockRejectedValueOnce(
      Object.assign(new Error("Not found"), {
        isAxiosError: true,
        response: { status: 404, data: { detail: "Not found" } },
      }),
    );

    await user.click(screen.getByRole("button", { name: /^reissue$/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /invitation.*no longer available/i,
    );
    await waitFor(() => expect(mockedListInvitations).toHaveBeenCalledTimes(2));
    expect(mockedReissueInvitation).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: /^reissue$/i }));
    await waitFor(() =>
      expect(mockedReissueInvitation).toHaveBeenLastCalledWith(
        "invite-current",
      ),
    );
  });

  it("shows a revocation error without removing the invitation", async () => {
    mockedRevokeInvitation.mockRejectedValueOnce(
      new Error("Invitation already claimed"),
    );
    renderPage();
    const user = userEvent.setup();
    await screen.findByText("pending@example.com");

    await user.click(screen.getByRole("button", { name: /^revoke$/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invitation already claimed",
    );
    expect(screen.getByText("pending@example.com")).toBeInTheDocument();
  });

  it("updates an existing invitation returned by create without duplicating the row", async () => {
    mockedCreateInvitation.mockImplementationOnce(async (payload) => ({
      ...store[0],
      ...payload,
    }));
    renderPage();
    const user = userEvent.setup();
    await screen.findByText("pending@example.com");
    await user.click(screen.getByRole("button", { name: /new invitation/i }));
    const dialog = await screen.findByRole("dialog");
    await user.type(
      within(dialog).getByLabelText(/email/i),
      "pending@example.com",
    );
    await user.click(
      within(dialog).getByRole("button", { name: /send invitation/i }),
    );

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(screen.getAllByText("pending@example.com")).toHaveLength(1);
  });

  it("keeps create errors in the dialog without an unhandled rejection", async () => {
    mockedCreateInvitation.mockRejectedValueOnce(
      new Error("User already active"),
    );
    renderPage();
    const user = userEvent.setup();
    await screen.findByText("pending@example.com");
    await user.click(screen.getByRole("button", { name: /new invitation/i }));
    const dialog = await screen.findByRole("dialog");
    await user.type(
      within(dialog).getByLabelText(/email/i),
      "active@example.com",
    );
    await user.click(
      within(dialog).getByRole("button", { name: /send invitation/i }),
    );

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "User already active",
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
