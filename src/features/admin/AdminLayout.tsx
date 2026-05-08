import {
  AppBar,
  Box,
  Button,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useCampContext } from "../../app/context/useCampContext";
import { useSession } from "../../app/session/useSession";
import { useAuth } from "../auth/useAuth";
import { WeekSelector } from "../weeks/WeekSelector";
import { SupportModeBanner } from "../platform/SupportModeBanner";
import { NAV_ITEMS } from "./resourceConfig";

const drawerW = 240;

export function AdminLayout() {
  const nav = useNavigate();
  const loc = useLocation();
  const { signOut } = useAuth();
  const { currentCamp } = useCampContext();
  const { session } = useSession();

  const currentPath = loc.pathname;
  const currentUserEmail =
    session.phase === "ready" ? session.user.email : "Unknown user";

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "background.default",
        color: "text.primary",
      }}
    >
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
            alignItems: { xs: "flex-start", lg: "center" },
            flexDirection: { xs: "column", lg: "row" },
          }}
        >
          <Stack spacing={0.25}>
            <Typography fontWeight={800}>Camp Admin</Typography>
            <Typography variant="body2" color="text.secondary">
              {currentCamp?.name ?? "Loading camp"} · {currentUserEmail}
            </Typography>
          </Stack>

          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", lg: "center" }}
          >
            <WeekSelector />
            <Button
              color="inherit"
              onClick={() => {
                void signOut().finally(() => {
                  nav("/login", { replace: true });
                });
              }}
            >
              Logout
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerW,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerW,
            boxSizing: "border-box",
            backgroundImage: "none",
          },
        }}
      >
        <Toolbar />
        <List>
          {NAV_ITEMS.map((item) => (
            <ListItemButton
              key={item.key}
              selected={currentPath === item.path}
              onClick={() => nav(item.path)}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 3, md: 4 },
          bgcolor: "transparent",
        }}
      >
        <Toolbar />
        <SupportModeBanner />
        <Outlet />
      </Box>
    </Box>
  );
}
