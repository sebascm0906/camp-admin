/* eslint-disable react-hooks/set-state-in-effect */
import {
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useCampContext } from "../app/context/useCampContext";
import type { Week } from "../api/weeks";

export type WeekScope = {
  activeWeek: Week | null;
  activeWeekType: Week["week_type"];
  availableWeekTypes: Week["week_type"][];
  setActiveWeekType: (weekType: Week["week_type"]) => void;
};

type WeekScopedLayoutProps = {
  title: string;
  description: string;
  actions?: ReactNode | ((scope: WeekScope) => ReactNode);
  children: (scope: WeekScope) => ReactNode;
};

export function WeekScopedLayout({
  title,
  description,
  actions,
  children,
}: WeekScopedLayoutProps) {
  const { weeks, selectedDaycampWeekId, selectedOvernightWeekId } = useCampContext();

  const availableWeekTypes = useMemo(() => {
    const result: Week["week_type"][] = [];

    if (weeks.some((week) => week.id === selectedDaycampWeekId)) {
      result.push("daycamp");
    }

    if (weeks.some((week) => week.id === selectedOvernightWeekId)) {
      result.push("overnight");
    }

    return result;
  }, [selectedDaycampWeekId, selectedOvernightWeekId, weeks]);

  const [activeWeekType, setActiveWeekType] = useState<Week["week_type"]>(
    availableWeekTypes[0] ?? "daycamp",
  );

  useEffect(() => {
    if (availableWeekTypes.includes(activeWeekType)) {
      return;
    }

    setActiveWeekType(availableWeekTypes[0] ?? "daycamp");
  }, [activeWeekType, availableWeekTypes]);

  const activeWeek = useMemo(() => {
    const selectedWeekId =
      activeWeekType === "daycamp" ? selectedDaycampWeekId : selectedOvernightWeekId;

    return weeks.find((week) => week.id === selectedWeekId) ?? null;
  }, [activeWeekType, selectedDaycampWeekId, selectedOvernightWeekId, weeks]);

  const scope: WeekScope = {
    activeWeek,
    activeWeekType,
    availableWeekTypes,
    setActiveWeekType,
  };

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        spacing={2}
      >
        <Stack spacing={0.75}>
          <Typography variant="h4" fontWeight={800}>
            {title}
          </Typography>
          <Typography color="text.secondary">{description}</Typography>
        </Stack>

        <Stack spacing={1.5} alignItems={{ xs: "stretch", md: "flex-end" }}>
          {availableWeekTypes.length > 1 ? (
            <ToggleButtonGroup
              exclusive
              size="small"
              value={activeWeekType}
              onChange={(_event, value: Week["week_type"] | null) => {
                if (value) {
                  setActiveWeekType(value);
                }
              }}
            >
              <ToggleButton value="daycamp">Day Camp</ToggleButton>
              <ToggleButton value="overnight">Overnight</ToggleButton>
            </ToggleButtonGroup>
          ) : null}
          {typeof actions === "function" ? actions(scope) : actions}
        </Stack>
      </Stack>

      <Paper sx={{ p: 2.5 }}>
        <Typography fontWeight={700}>
          {activeWeek
            ? `Active ${activeWeek.week_type === "daycamp" ? "day camp" : "overnight"} week: ${activeWeek.calendar_week_display_name ?? activeWeek.id}`
            : "No active week selected."}
        </Typography>
        {activeWeek ? (
          <Typography color="text.secondary">
            {activeWeek.start_date} to {activeWeek.end_date}
          </Typography>
        ) : (
          <Typography color="text.secondary">
            Select an active week in the header before using this module.
          </Typography>
        )}
      </Paper>

      {activeWeek ? children(scope) : null}
    </Stack>
  );
}
