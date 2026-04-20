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
  type CampUser,
  type CampUserCreate,
  type CampUserRole,
  type CampUserStatus,
} from "../../api/users";

type UserDialogProps = {
  open: boolean;
  user: CampUser | null;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: CampUserCreate) => Promise<void>;
};

type FormState = {
  email: string;
  firstName: string;
  lastName: string;
  role: CampUserRole;
  status: CampUserStatus;
};

const DEFAULT_FORM: FormState = {
  email: "",
  firstName: "",
  lastName: "",
  role: "counselor",
  status: "inactive",
};

function buildFormState(user: CampUser | null): FormState {
  if (!user) {
    return DEFAULT_FORM;
  }

  return {
    email: user.email,
    firstName: user.first_name ?? "",
    lastName: user.last_name ?? "",
    role: user.role === "admin" ? "admin" : "counselor",
    status:
      user.status === "active" || user.status === "removed" ? user.status : "inactive",
  };
}

function normalizeName(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function UserDialog({
  open,
  user,
  isSaving,
  error,
  onClose,
  onSubmit,
}: UserDialogProps) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(buildFormState(user));
  }, [open, user]);

  const isEdit = Boolean(user);
  const submitLabel = isEdit ? "Update user" : "Save user";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit({
      email: form.email.trim(),
      first_name: normalizeName(form.firstName),
      last_name: normalizeName(form.lastName),
      role: form.role,
      status: form.status,
    });
  }

  return (
    <Dialog
      open={open}
      onClose={isSaving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="user-dialog-title"
    >
      <DialogTitle id="user-dialog-title">
        {isEdit ? "Edit user" : "Create user"}
      </DialogTitle>
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
            disabled={Boolean(user?.firebase_uid) || isSaving}
            required
            fullWidth
          />
          <TextField
            label="First name"
            value={form.firstName}
            onChange={(event) =>
              setForm((current) => ({ ...current, firstName: event.target.value }))
            }
            disabled={isSaving}
            fullWidth
          />
          <TextField
            label="Last name"
            value={form.lastName}
            onChange={(event) =>
              setForm((current) => ({ ...current, lastName: event.target.value }))
            }
            disabled={isSaving}
            fullWidth
          />
          <TextField
            select
            label="Role"
            value={form.role}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                role: event.target.value as CampUserRole,
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
            select
            label="Status"
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                status: event.target.value as CampUserStatus,
              }))
            }
            disabled={isSaving}
            fullWidth
            SelectProps={{ native: true }}
          >
            <option value="inactive">inactive</option>
            <option value="active">active</option>
            <option value="removed">removed</option>
          </TextField>

          <DialogActions sx={{ px: 0 }}>
            <Button onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isSaving}>
              {submitLabel}
            </Button>
          </DialogActions>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
