import {
  FormControl,
  NativeSelect,
  Stack,
  Typography,
} from "@mui/material";
import { useCampContext } from "../../app/context/useCampContext";
import { sortWeeksInTimelineOrder, type Week } from "../../api/weeks";

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function parseDateParts(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
}

function formatDateRange(startDate: string, endDate: string) {
  const start = parseDateParts(startDate);
  const end = parseDateParts(endDate);
  const startMonth = monthNames[start.month - 1] ?? startDate;
  const endMonth = monthNames[end.month - 1] ?? endDate;

  if (start.year === end.year && start.month === end.month) {
    return `${startMonth} ${start.day}-${end.day}, ${start.year}`;
  }

  if (start.year === end.year) {
    return `${startMonth} ${start.day}-${endMonth} ${end.day}, ${start.year}`;
  }

  return `${startMonth} ${start.day}, ${start.year}-${endMonth} ${end.day}, ${end.year}`;
}

function fallbackWeekName(week: Week) {
  return week.week_type === "daycamp" ? "Day Camp" : "Overnight";
}

function labelForWeek(week: Week) {
  const name = week.calendar_week_display_name ?? fallbackWeekName(week);
  return `${name} · ${formatDateRange(week.start_date, week.end_date)}`;
}

export function WeekSelector() {
  const {
    weeks,
    isLoading,
    selectedDaycampWeekId,
    selectedOvernightWeekId,
    setSelectedDaycampWeekId,
    setSelectedOvernightWeekId,
  } = useCampContext();

  const daycampWeeks = sortWeeksInTimelineOrder(
    weeks.filter((week) => week.week_type === "daycamp"),
  );
  const overnightWeeks = sortWeeksInTimelineOrder(
    weeks.filter((week) => week.week_type === "overnight"),
  );

  if (isLoading) {
    return <Typography variant="body2">Loading weeks…</Typography>;
  }

  if (!daycampWeeks.length && !overnightWeeks.length) {
    return <Typography variant="body2">No camp weeks available</Typography>;
  }

  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={1.5}
      alignItems={{ xs: "stretch", md: "center" }}
    >
      {daycampWeeks.length > 0 && (
        <Stack spacing={0.5} sx={{ minWidth: { xs: "100%", sm: 220 } }}>
          <Typography
            component="label"
            htmlFor="daycamp-week-select"
            variant="caption"
            color="text.secondary"
          >
            Day Camp Week
          </Typography>
          <FormControl size="small" fullWidth>
            <NativeSelect
              inputProps={{
                id: "daycamp-week-select",
                "aria-label": "Day Camp Week",
              }}
              value={selectedDaycampWeekId ?? ""}
              onChange={(event) => {
                void setSelectedDaycampWeekId(event.target.value);
              }}
              sx={{ color: "text.primary", minHeight: 32, "& select": { py: 0.5 } }}
            >
              {daycampWeeks.map((week) => (
                <option key={week.id} value={week.id}>
                  {labelForWeek(week)}
                </option>
              ))}
            </NativeSelect>
          </FormControl>
        </Stack>
      )}

      {overnightWeeks.length > 0 && (
        <Stack spacing={0.5} sx={{ minWidth: { xs: "100%", sm: 220 } }}>
          <Typography
            component="label"
            htmlFor="overnight-week-select"
            variant="caption"
            color="text.secondary"
          >
            Overnight Week
          </Typography>
          <FormControl size="small" fullWidth>
            <NativeSelect
              inputProps={{
                id: "overnight-week-select",
                "aria-label": "Overnight Week",
              }}
              value={selectedOvernightWeekId ?? ""}
              onChange={(event) => {
                void setSelectedOvernightWeekId(event.target.value);
              }}
              sx={{ color: "text.primary", minHeight: 32, "& select": { py: 0.5 } }}
            >
              {overnightWeeks.map((week) => (
                <option key={week.id} value={week.id}>
                  {labelForWeek(week)}
                </option>
              ))}
            </NativeSelect>
          </FormControl>
        </Stack>
      )}
    </Stack>
  );
}
