import {
  AppBar,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { Outlet, useNavigate } from "react-router-dom";
import { useSession } from "../../app/session/useSession";
import { useAuth } from "../auth/useAuth";

export function PlatformLayout() {
  const nav = useNavigate();
  const { signOut } = useAuth();
  const { session } = useSession();
  const email = session.phase === "ready" ? session.user.email : "Unknown user";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="static">
        <Toolbar sx={{ justifyContent: "space-between", gap: 2 }}>
          <Stack spacing={0.25}>
            <Typography fontWeight={800}>Platform</Typography>
            <Typography variant="body2" color="text.secondary">
              Internal access · {email}
            </Typography>
          </Stack>
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
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
