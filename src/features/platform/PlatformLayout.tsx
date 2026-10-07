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
import { CampBrand } from "../../components/CampBrand";

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
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 1.5, sm: 3 }}
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            <CampBrand width={180} />
            <Stack
              spacing={0.25}
              sx={{
                borderLeft: { xs: 0, sm: 1 },
                borderColor: "divider",
                pl: { xs: 0, sm: 3 },
                minWidth: 0,
              }}
            >
              <Typography fontWeight={600}>Platform</Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ overflowWrap: "anywhere" }}
              >
                Internal access · {email}
              </Typography>
            </Stack>
          </Stack>
          <Stack
            direction="row"
            spacing={1}
            sx={{
              flexWrap: "wrap",
              justifyContent: { xs: "flex-start", md: "flex-end" },
            }}
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
