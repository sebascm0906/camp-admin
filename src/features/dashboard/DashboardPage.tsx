import { Paper, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useCampContext } from "../../app/context/useCampContext";
import { useSession } from "../../app/session/useSession";
import { NAV_ITEMS } from "../admin/resourceConfig";

function lookupWeekLabel(
  weekId: string | null,
  weeks: ReturnType<typeof useCampContext>["weeks"],
) {
  if (!weekId) return "Not selected";
  return weeks.find((week) => week.id === weekId)?.calendar_week_display_name ?? weekId;
}

export function DashboardPage() {
  const { session } = useSession();
  const { currentCamp, weeks, selectedDaycampWeekId, selectedOvernightWeekId } =
    useCampContext();

  const userEmail =
    session.phase === "ready" ? session.user.email : "Unknown user";

  return (
    <Stack spacing={3}>
      <Stack spacing={0.75}>
        <Typography variant="h4" fontWeight={800}>
          Dashboard
        </Typography>
        <Typography color="text.secondary">
          {currentCamp ? `Camp: ${currentCamp.name}` : "No camp loaded"}
        </Typography>
        <Typography color="text.secondary">Signed in as {userEmail}</Typography>
      </Stack>

      <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
        <Paper sx={{ p: 3, flex: 1 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Active weeks
          </Typography>
          <Typography color="text.secondary">
            Day camp: {lookupWeekLabel(selectedDaycampWeekId, weeks)}
          </Typography>
          <Typography color="text.secondary">
            Overnight: {lookupWeekLabel(selectedOvernightWeekId, weeks)}
          </Typography>
        </Paper>

        <Paper sx={{ p: 3, flex: 1 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Modules
          </Typography>
          <Stack spacing={1.25}>
            {NAV_ITEMS.filter((item) => item.key !== "dashboard").map((item) => (
              <Typography
                key={item.key}
                component={RouterLink}
                to={item.path}
                sx={{
                  color: "primary.main",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                {item.label}
              </Typography>
            ))}
          </Stack>
        </Paper>
      </Stack>
    </Stack>
  );
}
