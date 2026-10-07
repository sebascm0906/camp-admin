import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { type FormEvent, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { CampBrand } from "../../components/CampBrand";

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
    <Box className="login-page">
      <Box className="login-hero">
        <Box className="login-brand">
          <CampBrand width={340} />
        </Box>
        <Box className="login-photo" />
        <Box className="login-hero-caption">
          <Typography variant="overline">
            THE CAMP CONNECT ADMIN PORTAL
          </Typography>
          <Typography component="p" className="login-headline">
            More time for
            <br />
            what matters.
          </Typography>
          <Typography sx={{ maxWidth: 340 }} color="text.secondary">
            Your people, programs and summer.
            <br />
            All connected in one place.
          </Typography>
        </Box>
      </Box>
      <Box className="login-content">
        <Stack
          component="form"
          spacing={2.5}
          onSubmit={onSubmit}
          sx={{
            width: "100%",
            maxWidth: 400,
            animation: "camp-enter 450ms ease-out both",
          }}
        >
          <Stack spacing={1} sx={{ mb: 1 }}>
            <Typography variant="overline" color="primary.main">
              ADMIN PORTAL
            </Typography>
            <Typography component="h1" variant="h4">
              Sign in to Camp Connect
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Welcome back. Let's get camp ready.
            </Typography>
          </Stack>

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

          {errorMessage && (
            <Typography color="error">{errorMessage}</Typography>
          )}

          <Button variant="contained" type="submit" disabled={isBusy}>
            {isBusy ? "Signing in..." : "Sign in"}
          </Button>
          <Typography
            variant="caption"
            color="text.secondary"
            textAlign="center"
          >
            For camp administrators and staff.
          </Typography>
        </Stack>
        <Typography
          variant="caption"
          className="login-footer"
          color="text.secondary"
        >
          Camp Connect · Less paper, more summer!
        </Typography>
      </Box>
    </Box>
  );
}
