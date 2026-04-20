/* eslint-disable react-hooks/set-state-in-effect */
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import {
  type InvitationCreate,
  type InvitationRole,
} from "../../api/invitations";

type InvitationDialogProps = {
  open: boolean;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: InvitationCreate) => Promise<void>;
};

type FormState = {
  email: string;
  role: InvitationRole;
  expiresAt: string;
};

const DEFAULT_FORM: FormState = {
  email: "",
  role: "counselor",
  expiresAt: "",
};

function normalizeExpiry(value: string) {
  if (!value.trim()) {
    return null;
  }

  return new Date(value).toISOString();
}

export function InvitationDialog({
  open,
  isSaving,
  error,
  onClose,
  onSubmit,
}: InvitationDialogProps) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  useEffect(() => {
    if (open) {
      setForm(DEFAULT_FORM);
    }
  }, [open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit({
      email: form.email.trim(),
      role: form.role,
      expires_at: normalizeExpiry(form.expiresAt),
    });
  }

  return (
    <Dialog
      open={open}
      onClose={isSaving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="invitation-dialog-title"
    >
      <DialogTitle id="invitation-dialog-title">Create invitation</DialogTitle>
      <DialogContent>
        <Stack component="form" spacing={2} sx={{ pt: 1 }} onSubmit={handleSubmit}>
          {error ? <Alert severity="error">{error}</Alert> : null}

          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({ ...current, email: event.target.value }))
            }
            disabled={isSaving}
            required
            fullWidth
          />
          <TextField
            select
            label="Role"
            value={form.role}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                role: event.target.value as InvitationRole,
              }))
            }
            disabled={isSaving}
            fullWidth
            SelectProps={{ native: true }}
          >
            <option value="counselor">counselor</option>
            <option value="admin">admin</option>
          </TextField>
          <TextField
            label="Expiration"
            type="datetime-local"
            value={form.expiresAt}
            onChange={(event) =>
              setForm((current) => ({ ...current, expiresAt: event.target.value }))
            }
            disabled={isSaving}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />

          <DialogActions sx={{ px: 0 }}>
            <Button onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isSaving}>
              Send invitation
            </Button>
          </DialogActions>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
