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
  type CamperCreate,
  type CamperDetail,
  type CamperUpdate,
  type CamperWeekType,
  type Swimband,
} from "../../api/campers";

type CamperDialogProps = {
  open: boolean;
  camper: CamperDetail | null;
  weekType: CamperWeekType;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: CamperCreate | CamperUpdate) => Promise<void>;
};

type FormState = {
  firstName: string;
  lastName: string;
  age: string;
  ageGroup: string;
  swimband: Swimband;
  groupName: string;
  cabinId: string;
  notes: string;
};

const DEFAULT_FORM: FormState = {
  firstName: "",
  lastName: "",
  age: "",
  ageGroup: "",
  swimband: "red",
  groupName: "",
  cabinId: "",
  notes: "",
};

function buildFormState(camper: CamperDetail | null) {
  if (!camper) {
    return DEFAULT_FORM;
  }

  return {
    firstName: camper.first_name ?? "",
    lastName: camper.last_name ?? "",
    age: camper.age?.toString() ?? "",
    ageGroup: camper.age_group ?? "",
    swimband: camper.swimband ?? "red",
    groupName: camper.group?.name ?? "",
    cabinId: camper.cabin?.id ?? "",
    notes: camper.notes ?? "",
  };
}

function normalizeText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeNumber(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function CamperDialog({
  open,
  camper,
  weekType,
  isSaving,
  error,
  onClose,
  onSubmit,
}: CamperDialogProps) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(buildFormState(camper));
  }, [camper, open]);

  const isEdit = Boolean(camper);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: CamperUpdate = {
      first_name: normalizeText(form.firstName),
      last_name: normalizeText(form.lastName),
      age: normalizeNumber(form.age),
      age_group: normalizeText(form.ageGroup),
      swimband: form.swimband,
    };

    if (weekType === "daycamp") {
      payload.group_name = normalizeText(form.groupName);
    } else {
      payload.cabin_id = normalizeText(form.cabinId) ?? null;
    }

    if (isEdit) {
      payload.notes = normalizeText(form.notes);
    }

    await onSubmit(payload as CamperCreate | CamperUpdate);
  }

  return (
    <Dialog
      open={open}
      onClose={isSaving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="camper-dialog-title"
    >
      <DialogTitle id="camper-dialog-title">
        {isEdit ? "Edit camper" : "Create camper"}
      </DialogTitle>
      <DialogContent>
        <Stack component="form" spacing={2} sx={{ pt: 1 }} onSubmit={handleSubmit}>
          {error ? <Alert severity="error">{error}</Alert> : null}

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
            label="Age"
            type="number"
            value={form.age}
            onChange={(event) =>
              setForm((current) => ({ ...current, age: event.target.value }))
            }
            disabled={isSaving}
            fullWidth
          />
          <TextField
            label="Age group"
            value={form.ageGroup}
            onChange={(event) =>
              setForm((current) => ({ ...current, ageGroup: event.target.value }))
            }
            disabled={isSaving}
            fullWidth
          />
          <TextField
            select
            label="Swimband"
            value={form.swimband}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                swimband: event.target.value as Swimband,
              }))
            }
            disabled={isSaving}
            fullWidth
            SelectProps={{ native: true }}
          >
            <option value="red">red</option>
            <option value="green">green</option>
          </TextField>
          {weekType === "daycamp" ? (
            <TextField
              label="Group name"
              value={form.groupName}
              onChange={(event) =>
                setForm((current) => ({ ...current, groupName: event.target.value }))
              }
              disabled={isSaving}
              fullWidth
            />
          ) : (
            <TextField
              label="Cabin ID"
              value={form.cabinId}
              onChange={(event) =>
                setForm((current) => ({ ...current, cabinId: event.target.value }))
              }
              disabled={isSaving}
              fullWidth
            />
          )}
          {isEdit ? (
            <TextField
              label="Notes"
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
              disabled={isSaving}
              fullWidth
              multiline
              minRows={3}
            />
          ) : null}

          <DialogActions sx={{ px: 0 }}>
            <Button onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isSaving}>
              {isEdit ? "Update camper" : "Save camper"}
            </Button>
          </DialogActions>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
