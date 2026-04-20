import {
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { type FormEvent, useEffect, useState } from "react";
import { useAuth } from "./useAuth";

function normalizeAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("auth/")) {
    return "Unable to sign in with those credentials.";
  }

  return "Unable to sign in right now. Please try again.";
}

export function LoginPage() {
  const { signIn, isAuthed, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && isAuthed) {
      window.location.href = "/admin";
    }
  }, [isAuthed, loading]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    try {
      await signIn(email, password);
    } catch (error) {
      setErrorMessage(normalizeAuthError(error));
    } finally {
      setSubmitting(false);
    }
  }

  const isBusy = loading || submitting;

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Stack component="form" spacing={2} onSubmit={onSubmit}>
          <Typography variant="h5" fontWeight={800}>
            Admin Portal
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Sign in with your Firebase email and password.
          </Typography>

          <TextField
            label="Email"
            type="email"
            value={email}
            autoComplete="email"
            disabled={isBusy}
            onChange={(event) => setEmail(event.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            autoComplete="current-password"
            disabled={isBusy}
            onChange={(event) => setPassword(event.target.value)}
          />

          {errorMessage && <Typography color="error">{errorMessage}</Typography>}

          <Button variant="contained" type="submit" disabled={isBusy}>
            {isBusy ? "Signing in..." : "Sign in"}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
