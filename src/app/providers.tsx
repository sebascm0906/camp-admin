import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CssBaseline, ThemeProvider } from "@mui/material";
import React from "react";
import { AuthProvider } from "../features/auth/useAuth";
import { CampProvider } from "./context/campContext";
import { SessionProvider } from "./session/sessionContext";
import { SupportProvider } from "./support/supportContext";
import { theme } from "./theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <SessionProvider>
            <SupportProvider>
              <CampProvider>{children}</CampProvider>
            </SupportProvider>
          </SessionProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
