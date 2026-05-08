import {
  AppBar,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSession } from "../../app/session/useSession";
import { useAuth } from "../auth/useAuth";

const navItems = [
  { label: "Camps", path: "/platform/camps" },
  { label: "New camp", path: "/platform/new-camp" },
];

export function PlatformLayout() {
  const nav = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { session } = useSession();
  const email = session.phase === "ready" ? session.user.email : "Unknown user";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="static">
        <Toolbar
          sx={{
            alignItems: { xs: "stretch", md: "center" },
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            gap: 2,
            py: { xs: 1.5, md: 0 },
          }}
        >
          <Stack spacing={0.25}>
            <Typography fontWeight={800}>Platform</Typography>
            <Typography variant="body2" color="text.secondary">
              Internal access · {email}
            </Typography>
          </Stack>
          <Stack
            direction="row"
            spacing={1}
            sx={{ flexWrap: "wrap", justifyContent: { xs: "flex-start", md: "flex-end" } }}
          >
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;

              return (
                <Button
                  key={item.path}
                  color="inherit"
                  variant={isActive ? "outlined" : "text"}
                  onClick={() => {
                    nav(item.path);
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
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

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
