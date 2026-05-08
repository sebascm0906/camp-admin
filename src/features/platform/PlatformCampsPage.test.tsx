import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { useSupportContext } from "../../app/support/supportContext";
import { listPlatformCamps, type PlatformCampRead } from "../../api/platform";
import { PlatformCampsPage } from "./PlatformCampsPage";

vi.mock("../../api/platform", () => ({
  listPlatformCamps: vi.fn(),
}));

vi.mock("../../app/support/supportContext", () => ({
  useSupportContext: vi.fn(),
}));

const mockedListPlatformCamps = vi.mocked(listPlatformCamps);
const mockedUseSupportContext = vi.mocked(useSupportContext);

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PlatformCampsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("PlatformCampsPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  beforeEach(() => {
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
  });

  it("renders camps from the platform API", async () => {
    const camps: PlatformCampRead[] = [
      {
        id: "camp-1",
        name: "Camp Laurel",
        timezone: "America/Mexico_City",
      },
      {
        id: "camp-2",
        name: "Camp Pine",
        timezone: "America/Chicago",
      },
    ];
    mockedListPlatformCamps.mockResolvedValue(camps);

    renderPage();

    expect(await screen.findByText("Camp Laurel")).toBeInTheDocument();
    expect(screen.getByText("America/Mexico_City")).toBeInTheDocument();
    expect(screen.getByText("Camp Pine")).toBeInTheDocument();
    expect(screen.getByText("America/Chicago")).toBeInTheDocument();
  });
});
