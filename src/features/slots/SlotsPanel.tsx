import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import type { ActivityRead } from "../../api/activities";
import {
  generateActivitySlots,
  listSlots,
  type GenerateActivitySlotsPayload,
} from "../../api/slots";
import type { Week } from "../../api/weeks";
import { getErrorMessage } from "../../lib/http";

type SlotsPanelProps = {
  campId: string;
  week: Week;
  activities: ActivityRead[];
  selectedActivityId: string | null;
  onSelectActivityId: (activityId: string) => void;
};

type GenerateFormState = {
  activityId: string;
  capacity: string;
  replaceExisting: boolean;
  periods: number[];
};

function buildDefaultForm(selectedActivityId: string | null): GenerateFormState {
  return {
    activityId: selectedActivityId ?? "",
    capacity: "12",
    replaceExisting: false,
    periods: [1],
  };
}

export function SlotsPanel({
  campId,
  week,
  activities,
  selectedActivityId,
  onSelectActivityId,
}: SlotsPanelProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<GenerateFormState>(() =>
    buildDefaultForm(selectedActivityId),
  );

  useEffect(() => {
    if (!selectedActivityId && activities[0]) {
      onSelectActivityId(activities[0].id);
    }
  }, [activities, onSelectActivityId, selectedActivityId]);

  const slotsQuery = useQuery({
    queryKey: ["slots", campId, week.id],
    queryFn: () => listSlots(campId, week.id),
    enabled: week.week_type === "overnight",
  });

  const generateMutation = useMutation({
    mutationFn: (payload: GenerateActivitySlotsPayload & { activityId: string }) =>
      generateActivitySlots(campId, week.id, payload.activityId, {
        periods: payload.periods,
        capacity: payload.capacity,
        replace_existing: payload.replace_existing,
      }),
    onSuccess: async () => {
      setFormError(null);
      setIsDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["slots", campId, week.id] });
    },
    onError: (error) => {
      setFormError(getErrorMessage(error, "Unable to generate slots."));
    },
  });

  const selectedActivitySlots = useMemo(
    () =>
      (slotsQuery.data ?? [])
        .filter((slot) =>
          selectedActivityId ? slot.activity_id === selectedActivityId : true,
        )
        .sort((left, right) => (left.period ?? 0) - (right.period ?? 0)),
    [selectedActivityId, slotsQuery.data],
  );

  if (week.week_type !== "overnight") {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography fontWeight={700}>Slots</Typography>
        <Typography color="text.secondary">
          Slot management is only available for overnight weeks.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          spacing={2}
        >
          <Stack spacing={0.5}>
            <Typography variant="h6" fontWeight={700}>
              Slots
            </Typography>
            <Typography color="text.secondary">
              Generate and review activity slots for the selected overnight week.
            </Typography>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField
              select
              label="Activity"
              value={selectedActivityId ?? ""}
              onChange={(event) => onSelectActivityId(event.target.value)}
              SelectProps={{ native: true }}
              sx={{ minWidth: 220 }}
            >
              {activities.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {activity.name}
                </option>
              ))}
            </TextField>
            <Button
              variant="contained"
              onClick={() => {
                setForm(buildDefaultForm(selectedActivityId));
                setFormError(null);
                setIsDialogOpen(true);
              }}
              disabled={!selectedActivityId}
            >
              Generate slots
            </Button>
          </Stack>
        </Stack>

        {slotsQuery.isLoading ? (
          <Typography color="text.secondary">Loading slots…</Typography>
        ) : slotsQuery.isError ? (
          <Alert severity="error">
            {getErrorMessage(slotsQuery.error, "Unable to load slots.")}
          </Alert>
        ) : selectedActivitySlots.length === 0 ? (
          <Typography color="text.secondary">No slots generated yet.</Typography>
        ) : (
          <Stack spacing={1.25}>
            {selectedActivitySlots.map((slot) => (
              <Paper key={slot.id} variant="outlined" sx={{ p: 2 }}>
                <Typography fontWeight={700}>Period {slot.period ?? "?"}</Typography>
                <Typography color="text.secondary">
                  Capacity {slot.capacity}
                </Typography>
                <Typography color="text.secondary">
                  {slot.start_time ?? "No start"} - {slot.end_time ?? "No end"}
                </Typography>
              </Paper>
            ))}
          </Stack>
        )}
      </Stack>

      <Dialog
        open={isDialogOpen}
        onClose={generateMutation.isPending ? undefined : () => setIsDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        aria-labelledby="generate-slots-dialog-title"
      >
        <DialogTitle id="generate-slots-dialog-title">Generate slots</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {formError ? <Alert severity="error">{formError}</Alert> : null}
            <TextField
              select
              label="Activity"
              value={form.activityId}
              onChange={(event) =>
                setForm((current) => ({ ...current, activityId: event.target.value }))
              }
              SelectProps={{ native: true }}
              fullWidth
            >
              {activities.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {activity.name}
                </option>
              ))}
            </TextField>
            <TextField
              label="Capacity"
              type="number"
              value={form.capacity}
              onChange={(event) =>
                setForm((current) => ({ ...current, capacity: event.target.value }))
              }
              fullWidth
            />
            <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
              {[1, 2, 3].map((period) => (
                <FormControlLabel
                  key={period}
                  control={
                    <Checkbox
                      checked={form.periods.includes(period)}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          periods: event.target.checked
                            ? Array.from(new Set([...current.periods, period])).sort()
                            : current.periods.filter((value) => value !== period),
                        }))
                      }
                    />
                  }
                  label={`Period ${period}`}
                />
              ))}
            </Stack>
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.replaceExisting}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      replaceExisting: event.target.checked,
                    }))
                  }
                />
              }
              label="Replace existing slots"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsDialogOpen(false)}
            disabled={generateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={
              generateMutation.isPending ||
              !form.activityId ||
              !form.periods.length ||
              !form.capacity.trim()
            }
            onClick={() =>
              void generateMutation.mutateAsync({
                activityId: form.activityId,
                periods: form.periods,
                capacity: Number(form.capacity),
                replace_existing: form.replaceExisting,
              })
            }
          >
            Run generation
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
