import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import Close from "@mui/icons-material/Close";
import LogoutOutlined from "@mui/icons-material/LogoutOutlined";
import Menu from "@mui/icons-material/Menu";
import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useCampContext } from "../../app/context/useCampContext";
import { useSession } from "../../app/session/useSession";
import { CampBrand } from "../../components/CampBrand";
import { ModuleIcon } from "../../components/ModuleIcon";
import { useAuth } from "../auth/useAuth";
import { WeekSelector } from "../weeks/WeekSelector";
import { SupportCampSelector } from "../platform/SupportCampSelector";
import { SupportModeBanner } from "../platform/SupportModeBanner";
import { NAV_ITEMS } from "./resourceConfig";

const drawerW = 248;

export function AdminLayout() {
  const nav = useNavigate();
  const loc = useLocation();
  const { signOut } = useAuth();
  const { currentCamp } = useCampContext();
  const { session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentUserEmail =
    session.phase === "ready" ? session.user.email : "Unknown user";

  const sidebar = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2.5, py: 3 }}
      >
        <CampBrand width={200} />
        <IconButton
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          sx={{ display: { md: "none" } }}
        >
          <Close />
        </IconButton>
      </Stack>
      <Divider />
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ px: 3, pt: 3, pb: 1 }}
      >
        CAMP MANAGEMENT
      </Typography>
      <List component="nav" aria-label="Camp navigation" sx={{ pt: 0 }}>
        {NAV_ITEMS.map((item) => (
          <ListItemButton
            key={item.key}
            selected={loc.pathname === item.path}
            aria-current={loc.pathname === item.path ? "page" : undefined}
            onClick={() => {
              nav(item.path);
              setMobileOpen(false);
            }}
          >
            <ListItemIcon>
              <ModuleIcon module={item.key} />
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              slotProps={{
                primary: {
                  fontSize: "0.875rem",
                  fontWeight: loc.pathname === item.path ? 600 : 400,
                },
              }}
            />
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ mt: "auto", p: 3 }}>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="caption" color="text.secondary">
          Less paper, more summer!
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", color: "text.primary" }}>
      <Box
        component="aside"
        sx={{ width: { md: drawerW }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          slotProps={{ paper: { id: "camp-mobile-navigation" } }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { width: 288 },
          }}
        >
          {sidebar}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": { width: drawerW, boxSizing: "border-box" },
          }}
        >
          {sidebar}
        </Drawer>
      </Box>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <AppBar position="sticky">
          <Toolbar sx={{ gap: 2, py: 1, px: { xs: 2, md: 4 } }}>
            <IconButton
              edge="start"
              aria-label="Open navigation"
              aria-controls="camp-mobile-navigation"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
              sx={{ display: { md: "none" } }}
            >
              <Menu />
            </IconButton>
            <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="overline" color="text.secondary">
                CAMP ADMIN
              </Typography>
              <Typography fontWeight={600} noWrap>
                {currentCamp?.name ?? "Loading camp"}
              </Typography>
            </Stack>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: "secondary.main",
                fontSize: 13,
                display: { xs: "none", sm: "flex" },
              }}
            >
              {currentUserEmail.slice(0, 1).toUpperCase()}
            </Avatar>
            <Typography
              variant="body2"
              color="text.secondary"
              noWrap
              sx={{ maxWidth: 220, display: { xs: "none", lg: "block" } }}
            >
              {currentUserEmail}
            </Typography>
            <Button
              color="inherit"
              size="small"
              startIcon={<LogoutOutlined fontSize="small" />}
              onClick={() => {
                void signOut().finally(() => nav("/login", { replace: true }));
              }}
            >
              Logout
            </Button>
          </Toolbar>
        </AppBar>
        <Box
          sx={{
            px: { xs: 2, md: 4 },
            py: 2,
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: "rgba(0,139,163,0.08)",
          }}
        >
          <Stack
            direction={{ xs: "column", xl: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", xl: "center" }}
          >
            <SupportCampSelector />
            <WeekSelector />
          </Stack>
        </Box>
        <Box
          component="main"
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            maxWidth: 1600,
            mx: "auto",
            animation: "camp-enter 350ms ease-out both",
          }}
        >
          <SupportModeBanner />
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
