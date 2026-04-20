import {
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { SessionProvider, useOptionalSessionContext } from "./sessionContext";
import { useSession } from "./useSession";

function SessionGateInner({ children }: { children?: ReactNode }) {
  const { session, retryBootstrap } = useSession();

  if (session.phase === "signed_out") {
    return <Navigate replace to="/login" />;
  }

  if (session.phase === "loading") {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography>Checking your camp access...</Typography>
        </Stack>
      </Box>
    );
  }

  if (session.phase === "blocked") {
    const message =
      session.reason === "UNINVITED"
        ? "This account does not have access to Camp Admin yet."
        : session.reason === "BOOTSTRAP_ELIGIBLE"
          ? "Your account exists, but camp access has not been activated yet."
          : "Your invitation could not be claimed automatically. Please try again.";

    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper sx={{ p: 4 }}>
          <Stack spacing={2}>
            <Typography variant="h5" fontWeight={800}>
              Access pending
            </Typography>
            <Typography color="text.secondary">{message}</Typography>
          </Stack>
        </Paper>
      </Container>
    );
  }

  if (session.phase === "error") {
    const message =
      session.step === "status"
        ? "We could not finish checking your camp access."
        : session.step === "claim"
          ? "We could not finish setting up your camp access."
          : "We could not finish loading your camp session.";

    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper sx={{ p: 4 }}>
          <Stack spacing={2}>
            <Typography variant="h5" fontWeight={800}>
              Temporary sign-in issue
            </Typography>
            <Typography color="text.secondary">
              {message} Please try again.
            </Typography>
            <Button variant="contained" onClick={retryBootstrap}>
              Retry
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return <>{children ?? <Outlet />}</>;
}

export function SessionGate({ children }: { children?: ReactNode }) {
  const existingContext = useOptionalSessionContext();

  if (existingContext) {
    return <SessionGateInner>{children}</SessionGateInner>;
  }

  return (
    <SessionProvider>
      <SessionGateInner>{children}</SessionGateInner>
    </SessionProvider>
  );
}
