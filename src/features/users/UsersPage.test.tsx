import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import {
  createUser,
  listUsers,
  updateUser,
  type CampUser,
} from "../../api/users";
import { UsersPage } from "./UsersPage";

vi.mock("../../api/users", () => ({
  listUsers: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
}));

const mockedListUsers = vi.mocked(listUsers);
const mockedCreateUser = vi.mocked(createUser);
const mockedUpdateUser = vi.mocked(updateUser);

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <UsersPage />
    </QueryClientProvider>,
  );
}

function seedUsers(): CampUser[] {
  return [
    {
      id: "user-1",
      email: "coach@example.com",
      first_name: "Casey",
      last_name: "Nguyen",
      firebase_uid: "firebase-1",
      is_active: true,
      role: "counselor",
      status: "active",
    },
  ];
}

describe("UsersPage", () => {
  let store: CampUser[];

  beforeEach(() => {
    store = seedUsers();
    mockedListUsers.mockImplementation(async () => store.map((user) => ({ ...user })));
    mockedCreateUser.mockImplementation(async (payload) => {
      const created: CampUser = {
        id: `user-${store.length + 1}`,
        firebase_uid: null,
        is_active: payload.status === "active",
        ...payload,
      };
      store = [...store, created];
      return created;
    });
    mockedUpdateUser.mockImplementation(async (userId, payload) => {
      const existing = store.find((user) => user.id === userId);

      if (!existing) {
        throw new Error("User not found");
      }

      const updated: CampUser = {
        ...existing,
        ...payload,
        is_active:
          payload.status === undefined ? existing.is_active : payload.status === "active",
      };
      store = store.map((user) => (user.id === userId ? updated : user));
      return updated;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders rows from the users API", async () => {
    renderPage();

    expect(await screen.findByText("coach@example.com")).toBeInTheDocument();
    expect(screen.getByText("Casey Nguyen")).toBeInTheDocument();
    expect(screen.getByText("counselor")).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
  });

  it("submits the create user flow and refreshes the directory", async () => {
    renderPage();
    const user = userEvent.setup();

    await screen.findByText("coach@example.com");
    await user.click(screen.getByRole("button", { name: /add user/i }));

    const dialog = await screen.findByRole("dialog", { name: /create user/i });
    await user.type(within(dialog).getByLabelText(/email/i), "admin@example.com");
    await user.type(within(dialog).getByLabelText(/first name/i), "Morgan");
    await user.type(within(dialog).getByLabelText(/last name/i), "Diaz");
    await user.selectOptions(within(dialog).getByLabelText(/role/i), "admin");
    await user.click(within(dialog).getByRole("button", { name: /save user/i }));

    await waitFor(() => {
      expect(mockedCreateUser).toHaveBeenCalledWith({
        email: "admin@example.com",
        first_name: "Morgan",
        last_name: "Diaz",
        role: "admin",
        status: "inactive",
      });
    });

    expect(await screen.findByText("admin@example.com")).toBeInTheDocument();
    expect(screen.getByText("Morgan Diaz")).toBeInTheDocument();
  });

  it("submits the update user flow", async () => {
    renderPage();
    const user = userEvent.setup();

    const row = (await screen.findByText("coach@example.com")).closest("tr");
    expect(row).not.toBeNull();

    await user.click(within(row!).getByRole("button", { name: /edit/i }));

    const dialog = await screen.findByRole("dialog", { name: /edit user/i });
    await user.selectOptions(within(dialog).getByLabelText(/role/i), "admin");
    await user.selectOptions(within(dialog).getByLabelText(/status/i), "inactive");
    await user.click(within(dialog).getByRole("button", { name: /update user/i }));

    await waitFor(() => {
      expect(mockedUpdateUser).toHaveBeenCalledWith("user-1", {
        email: "coach@example.com",
        first_name: "Casey",
        last_name: "Nguyen",
        role: "admin",
        status: "inactive",
      });
    });

    expect(await screen.findByText("admin")).toBeInTheDocument();
    expect(screen.getByText("inactive")).toBeInTheDocument();
  });
});
