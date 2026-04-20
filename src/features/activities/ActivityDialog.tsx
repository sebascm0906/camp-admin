/* eslint-disable react-hooks/set-state-in-effect */
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import {
  type ActivityCreate,
  type ActivityRead,
  type ActivityUpdate,
} from "../../api/activities";

type ActivityDialogProps = {
  open: boolean;
  activity: ActivityRead | null;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: ActivityCreate | ActivityUpdate) => Promise<void>;
};

type FormState = {
  name: string;
  description: string;
  durationSlots: string;
  requiresGreenBand: boolean;
  minAge: string;
  imageUrl: string;
};

const DEFAULT_FORM: FormState = {
  name: "",
  description: "",
  durationSlots: "1",
  requiresGreenBand: false,
  minAge: "",
  imageUrl: "",
};

function buildFormState(activity: ActivityRead | null): FormState {
  if (!activity) {
    return DEFAULT_FORM;
  }

  return {
    name: activity.name,
    description: activity.description ?? "",
    durationSlots: String(activity.duration_slots ?? 1),
    requiresGreenBand: Boolean(activity.requires_green_band),
    minAge: activity.min_age?.toString() ?? "",
    imageUrl: activity.image_url ?? "",
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

export function ActivityDialog({
  open,
  activity,
  isSaving,
  error,
  onClose,
  onSubmit,
}: ActivityDialogProps) {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  useEffect(() => {
    if (open) {
      setForm(buildFormState(activity));
    }
  }, [activity, open]);

  const isEdit = Boolean(activity);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit({
      name: form.name.trim(),
      description: normalizeText(form.description),
      duration_slots: normalizeNumber(form.durationSlots) ?? 1,
      requires_green_band: form.requiresGreenBand,
      min_age: normalizeNumber(form.minAge),
      image_url: normalizeText(form.imageUrl),
    });
  }

  return (
    <Dialog
      open={open}
      onClose={isSaving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="activity-dialog-title"
    >
      <DialogTitle id="activity-dialog-title">
        {isEdit ? "Edit activity" : "Create activity"}
      </DialogTitle>
      <DialogContent>
        <Stack component="form" spacing={2} sx={{ pt: 1 }} onSubmit={handleSubmit}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField
            label="Name"
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            disabled={isSaving}
            required
            fullWidth
          />
          <TextField
            label="Description"
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            disabled={isSaving}
            fullWidth
            multiline
            minRows={3}
          />
          <TextField
            select
            label="Duration slots"
            value={form.durationSlots}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                durationSlots: event.target.value,
              }))
            }
            disabled={isSaving}
            fullWidth
            SelectProps={{ native: true }}
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </TextField>
          <TextField
            label="Min age"
            type="number"
            value={form.minAge}
            onChange={(event) =>
              setForm((current) => ({ ...current, minAge: event.target.value }))
            }
            disabled={isSaving}
            fullWidth
          />
          <TextField
            label="Image URL"
            value={form.imageUrl}
            onChange={(event) =>
              setForm((current) => ({ ...current, imageUrl: event.target.value }))
            }
            disabled={isSaving}
            fullWidth
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={form.requiresGreenBand}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    requiresGreenBand: event.target.checked,
                  }))
                }
              />
            }
            label="Requires green band"
          />

          <DialogActions sx={{ px: 0 }}>
            <Button onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isSaving}>
              {isEdit ? "Update activity" : "Save activity"}
            </Button>
          </DialogActions>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
