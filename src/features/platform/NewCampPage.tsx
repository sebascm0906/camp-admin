import {
  Alert,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import {
  createPlatformCamp,
  type PlatformCampCreate,
  type PlatformCampCreateResponse,
} from "../../api/platform";
import { getErrorMessage } from "../../lib/http";

const defaultTimezone = "America/Mexico_City";

function clean(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function NewCampPage() {
  const [campName, setCampName] = useState("");
  const [timezone, setTimezone] = useState(defaultTimezone);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerFirstName, setOwnerFirstName] = useState("");
  const [ownerLastName, setOwnerLastName] = useState("");
  const [notes, setNotes] = useState("");
  const [created, setCreated] = useState<PlatformCampCreateResponse | null>(null);

  const mutation = useMutation({
    mutationFn: (payload: PlatformCampCreate) => createPlatformCamp(payload),
    onSuccess: (result) => {
      setCreated(result);
    },
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreated(null);
    mutation.mutate({
      camp_name: campName.trim(),
      timezone: clean(timezone),
      owner_email: ownerEmail.trim(),
      owner_first_name: clean(ownerFirstName),
      owner_last_name: clean(ownerLastName),
      notes: clean(notes),
    });
  }

  return (
    <Stack spacing={3}>
      <Stack spacing={0.75}>
        <Typography variant="h4" fontWeight={800}>
          New Camp
        </Typography>
        <Typography color="text.secondary">
          Create a customer camp and send the root admin invitation.
        </Typography>
      </Stack>

      <Paper sx={{ p: 3 }}>
        <Stack component="form" spacing={2.5} onSubmit={onSubmit}>
          <TextField
            label="Camp name"
            value={campName}
            required
            onChange={(event) => setCampName(event.target.value)}
          />
          <TextField
            label="Timezone"
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
          />
          <TextField
            label="Owner email"
            type="email"
            value={ownerEmail}
            required
            onChange={(event) => setOwnerEmail(event.target.value)}
          />
          <TextField
            label="Owner first name"
            value={ownerFirstName}
            onChange={(event) => setOwnerFirstName(event.target.value)}
          />
          <TextField
            label="Owner last name"
            value={ownerLastName}
            onChange={(event) => setOwnerLastName(event.target.value)}
          />
          <TextField
            label="Notes"
            value={notes}
            multiline
            minRows={3}
            onChange={(event) => setNotes(event.target.value)}
          />

          {mutation.isError && (
            <Alert severity="error">
              {getErrorMessage(mutation.error, "Unable to create camp.")}
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            disabled={mutation.isPending}
            sx={{ alignSelf: "flex-start" }}
          >
            {mutation.isPending ? "Creating..." : "Create camp"}
          </Button>
        </Stack>
      </Paper>

      {created && (
        <Alert severity={created.email_status === "failed" ? "warning" : "success"}>
          <Stack spacing={0.75}>
            <Typography fontWeight={700}>
              {created.camp.name} was created
            </Typography>
            <Typography>
              Root admin: {created.root_admin_invitation.email}
            </Typography>
            <Typography>Email status: {created.email_status}</Typography>
            {created.email_status === "failed" && (
              <>
                <Typography>
                  The root admin invitation exists, but email delivery failed.
                </Typography>
                {created.email_error && <Typography>{created.email_error}</Typography>}
              </>
            )}
          </Stack>
        </Alert>
      )}
    </Stack>
  );
}
