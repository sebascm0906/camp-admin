import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";
import { createCalendarWeek, sortWeeksInTimelineOrder } from "../../api/weeks";
import { useCampContext } from "../../app/context/useCampContext";
import { getErrorMessage } from "../../lib/http";

type FormState = {
  displayName: string;
  overnightStartDate: string;
  overnightEndDate: string;
};

const DEFAULT_FORM: FormState = {
  displayName: "E2E Week 1",
  overnightStartDate: "2026-06-01",
  overnightEndDate: "2026-06-07",
};

export function WeeksPage() {
  const { currentCamp, weeks, isLoading, error, refresh } = useCampContext();
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const sortedWeeks = useMemo(() => sortWeeksInTimelineOrder(weeks), [weeks]);

  const createMutation = useMutation({
    mutationFn: () =>
      createCalendarWeek(currentCamp!.id, {
        display_name: form.displayName.trim() || undefined,
        overnight_start_date: form.overnightStartDate,
        overnight_end_date: form.overnightEndDate,
      }),
    onSuccess: async (result) => {
      const weekName =
        (result.overnight_week.calendar_week_display_name ??
          form.displayName) ||
        "calendar week";
      setSuccessMessage(
        `Created ${weekName}.`,
      );
      await refresh();
    },
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage(null);
    await createMutation.mutateAsync();
  }

  if (!currentCamp) {
    return (
      <Stack spacing={3}>
        <Typography variant="h4" fontWeight={700}>
          Weeks
        </Typography>
        <Alert severity="info">No camp loaded.</Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h4" fontWeight={700}>
          Weeks
        </Typography>
        <Typography color="text.secondary">
          Create paired overnight and day camp weeks for imports and E2E testing.
        </Typography>
      </Stack>

      <Paper sx={{ p: 3 }}>
        <Box
          component="form"
          aria-label="Create calendar week"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <Stack spacing={2}>
            <Typography variant="h6" fontWeight={700}>
              Create calendar week
            </Typography>
            {createMutation.isError ? (
              <Alert severity="error">
                {getErrorMessage(createMutation.error, "Unable to create week.")}
              </Alert>
            ) : null}
            {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                label="Display name"
                value={form.displayName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    displayName: event.target.value,
                  }))
                }
                fullWidth
              />
              <TextField
                label="Overnight start date"
                type="date"
                value={form.overnightStartDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    overnightStartDate: event.target.value,
                  }))
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Overnight end date"
                type="date"
                value={form.overnightEndDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    overnightEndDate: event.target.value,
                  }))
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
            <Stack direction="row" justifyContent="flex-end">
              <Button
                type="submit"
                variant="contained"
                disabled={
                  createMutation.isPending ||
                  !form.overnightStartDate ||
                  !form.overnightEndDate
                }
              >
                {createMutation.isPending ? "Creating..." : "Create week"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={700}>
            Existing weeks
          </Typography>
          {isLoading ? (
            <Stack alignItems="center" py={4}>
              <CircularProgress />
            </Stack>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : sortedWeeks.length === 0 ? (
            <Typography color="text.secondary">No weeks created yet.</Typography>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Dates</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedWeeks.map((week) => (
                  <TableRow key={week.id} hover>
                    <TableCell>
                      {week.calendar_week_display_name ?? "Unnamed week"}
                    </TableCell>
                    <TableCell>{week.week_type}</TableCell>
                    <TableCell>
                      {week.start_date} to {week.end_date}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
