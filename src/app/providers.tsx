import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import React from "react";
import { AuthProvider } from "../features/auth/useAuth";
import { CampProvider } from "./context/campContext";
import { SessionProvider } from "./session/sessionContext";
import { SupportProvider } from "./support/supportContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
});

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#38bdf8" },
    secondary: { main: "#f472b6" },
    background: {
      default: "#020617",
      paper: "#0f172a",
    },
    text: {
      primary: "#e2e8f0",
      secondary: "#94a3b8",
    },
    divider: "rgba(148, 163, 184, 0.24)",
  },
  typography: {
    fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
    button: { fontWeight: 600, textTransform: "none" },
    h5: { fontWeight: 700 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(56, 189, 248, 0.15), transparent 45%), radial-gradient(circle at 80% 0%, rgba(14, 165, 233, 0.22), transparent 55%)",
          backgroundColor: "#020617",
          color: "#e2e8f0",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#0f172a",
          backgroundImage: "none",
          border: "1px solid rgba(148, 163, 184, 0.18)",
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: "rgba(2, 6, 23, 0.9)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(148, 163, 184, 0.24)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#050a18",
          color: "#e2e8f0",
          borderRight: "1px solid rgba(148, 163, 184, 0.24)",
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 999 },
        containedPrimary: {
          backgroundImage: "linear-gradient(120deg, #38bdf8, #0ea5e9)",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: "0 16px 16px 0",
          marginRight: 8,
          "&.Mui-selected": {
            backgroundColor: "rgba(56, 189, 248, 0.2)",
          },
          "&.Mui-selected:hover": {
            backgroundColor: "rgba(56, 189, 248, 0.3)",
          },
        },
      },
    },
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
