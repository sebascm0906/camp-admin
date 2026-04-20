import { Stack, Typography } from "@mui/material";
import { useCampContext } from "../../app/context/useCampContext";
import { sortWeeksInTimelineOrder, type Week } from "../../api/weeks";

function labelForWeek(week: Week) {
  return week.calendar_week_display_name ?? `${week.week_type} ${week.start_date}`;
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
        <label>
          <Typography variant="caption" display="block" mb={0.5}>
            Day Camp Week
          </Typography>
          <select
            aria-label="Day Camp Week"
            value={selectedDaycampWeekId ?? ""}
            onChange={(event) => {
              void setSelectedDaycampWeekId(event.target.value);
            }}
          >
            {daycampWeeks.map((week) => (
              <option key={week.id} value={week.id}>
                {labelForWeek(week)}
              </option>
            ))}
          </select>
        </label>
      )}

      {overnightWeeks.length > 0 && (
        <label>
          <Typography variant="caption" display="block" mb={0.5}>
            Overnight Week
          </Typography>
          <select
            aria-label="Overnight Week"
            value={selectedOvernightWeekId ?? ""}
            onChange={(event) => {
              void setSelectedOvernightWeekId(event.target.value);
            }}
          >
            {overnightWeeks.map((week) => (
              <option key={week.id} value={week.id}>
                {labelForWeek(week)}
              </option>
            ))}
          </select>
        </label>
      )}
    </Stack>
  );
}
