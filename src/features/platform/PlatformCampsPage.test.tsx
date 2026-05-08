import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { listPlatformCamps, type PlatformCampRead } from "../../api/platform";
import { PlatformCampsPage } from "./PlatformCampsPage";

vi.mock("../../api/platform", () => ({
  listPlatformCamps: vi.fn(),
}));

const mockedListPlatformCamps = vi.mocked(listPlatformCamps);

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <PlatformCampsPage />
    </QueryClientProvider>,
  );
}

describe("PlatformCampsPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
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
