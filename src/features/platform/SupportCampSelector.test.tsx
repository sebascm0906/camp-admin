import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { useSupportContext } from "../../app/support/supportContext";
import { listPlatformCamps, type PlatformCampRead } from "../../api/platform";
import { SupportCampSelector } from "./SupportCampSelector";

vi.mock("../../api/platform", () => ({
  listPlatformCamps: vi.fn(),
}));

vi.mock("../../app/support/supportContext", () => ({
  useSupportContext: vi.fn(),
}));

const mockedListPlatformCamps = vi.mocked(listPlatformCamps);
const mockedUseSupportContext = vi.mocked(useSupportContext);

function renderSelector() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <SupportCampSelector />
    </QueryClientProvider>,
  );
}

describe("SupportCampSelector", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("does not render outside support mode", () => {
    mockedUseSupportContext.mockReturnValue({
      selectedCamp: null,
      editMode: false,
      reason: null,
      isSupportActive: false,
      startSupport: vi.fn(),
      stopSupport: vi.fn(),
      enableEditMode: vi.fn(),
      disableEditMode: vi.fn(),
    });

    renderSelector();

    expect(screen.queryByLabelText(/camp/i)).not.toBeInTheDocument();
  });

  it("lists platform camps and switches support camp", async () => {
    const startSupport = vi.fn();
    const camps: PlatformCampRead[] = [
      { id: "camp-1", name: "Alexei's Camp", timezone: "America/Mexico_City" },
      { id: "camp-2", name: "Camp La Sierra", timezone: "America/Los_Angeles" },
    ];
    mockedListPlatformCamps.mockResolvedValue(camps);
    mockedUseSupportContext.mockReturnValue({
      selectedCamp: camps[0],
      editMode: false,
      reason: null,
      isSupportActive: true,
      startSupport,
      stopSupport: vi.fn(),
      enableEditMode: vi.fn(),
      disableEditMode: vi.fn(),
    });
    const user = userEvent.setup();

    renderSelector();

    const campSelect = await screen.findByLabelText(/camp/i);
    await waitFor(() => {
      expect(within(campSelect).getAllByRole("option")).toHaveLength(2);
    });
    await user.selectOptions(campSelect, "camp-2");

    expect(startSupport).toHaveBeenCalledWith(camps[1]);
  });
});
