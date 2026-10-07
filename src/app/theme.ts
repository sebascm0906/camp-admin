import { createTheme } from "@mui/material";

// Shared color roles from the mobile app's AppColors.
export const campColors = {
  background: "#003B42",
  navigation: "#008BA3",
  surface: "#0A4A51",
  field: "#626A6D",
  accent: "#35A8C3",
  divider: "#007985",
};

export const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: campColors.accent, contrastText: "#001F24" },
    secondary: { main: campColors.navigation, contrastText: "#FFFFFF" },
    background: { default: campColors.background, paper: campColors.surface },
    text: { primary: "#FFFFFF", secondary: "rgba(255,255,255,0.75)" },
    divider: campColors.divider,
    error: { main: "#FFB4AB" },
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    button: { fontWeight: 600, textTransform: "none" },
    h4: { fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.035em" },
    h5: { fontSize: "1.375rem", fontWeight: 600, letterSpacing: "-0.025em" },
    h6: { fontSize: "1.125rem", fontWeight: 600 },
    body2: { lineHeight: 1.6 },
    overline: { fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em" },
  },
  shape: { borderRadius: 6 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: campColors.background,
          backgroundImage: "none",
        },
        "::selection": { backgroundColor: campColors.accent, color: "#001F24" },
        ".MuiPaper-root:has(> .MuiTable-root)": { overflowX: "auto" },
        "@keyframes camp-enter": {
          from: { opacity: 0, transform: "translateY(10px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        "@media (prefers-reduced-motion: reduce)": {
          "*, *::before, *::after": {
            animation: "none !important",
            scrollBehavior: "auto !important",
          },
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(53,168,195,0.3)",
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: campColors.background,
          backgroundImage: "none",
          borderBottom: `1px solid ${campColors.divider}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: campColors.background,
          backgroundImage: "none",
          border: 0,
          borderRight: `1px solid ${campColors.divider}`,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 6, padding: "10px 18px" },
        containedPrimary: {
          backgroundImage: "none",
          "&:hover": { backgroundColor: "#53BDD3" },
        },
        outlined: { borderColor: campColors.divider, color: "#FFFFFF" },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(98,106,109,0.25)",
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#FFFFFF",
          },
        },
        notchedOutline: { borderColor: "rgba(255,255,255,0.4)" },
      },
    },
    MuiNativeSelect: {
      styleOverrides: {
        select: {
          fontSize: "0.8125rem",
          "& option": { color: "#FFFFFF", backgroundColor: campColors.surface },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          margin: "3px 12px",
          minHeight: 46,
          "&.Mui-selected": {
            backgroundColor: campColors.navigation,
            color: "#FFFFFF",
            "&:hover": { backgroundColor: "#009DB5" },
          },
          "&:hover": { backgroundColor: "rgba(53,168,195,0.12)" },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: { root: { minWidth: 36, color: "inherit" } },
    },
    MuiTable: { styleOverrides: { root: { minWidth: 540 } } },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid rgba(53,168,195,0.22)",
          padding: "16px",
        },
        head: {
          backgroundColor: "rgba(0,139,163,0.18)",
          color: "rgba(255,255,255,0.85)",
          fontSize: "0.75rem",
          fontWeight: 600,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:not(.MuiTableRow-head):hover": {
            backgroundColor: "rgba(53,168,195,0.06)",
          },
        },
      },
    },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 8 } } },
    MuiChip: { styleOverrides: { root: { borderRadius: 6 } } },
    MuiTabs: { styleOverrides: { indicator: { height: 3 } } },
    MuiTab: {
      styleOverrides: { root: { textTransform: "none", fontWeight: 600 } },
    },
  },
});
