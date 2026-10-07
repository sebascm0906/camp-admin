import ArrowForward from "@mui/icons-material/ArrowForward";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import { Box, ButtonBase, Paper, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useCampContext } from "../../app/context/useCampContext";
import { useSession } from "../../app/session/useSession";
import { ModuleIcon } from "../../components/ModuleIcon";
import { NAV_ITEMS } from "../admin/resourceConfig";

function lookupWeekLabel(
  weekId: string | null,
  weeks: ReturnType<typeof useCampContext>["weeks"],
) {
  if (!weekId) return "Not selected";
  return (
    weeks.find((week) => week.id === weekId)?.calendar_week_display_name ??
    weekId
  );
}

const descriptions: Record<string, string> = {
  users: "Your team, roles and access.",
  invitations: "Welcome your team to camp.",
  weeks: "Organize the summer timeline.",
  imports: "Bring your camp data together.",
  campers: "Everyone who makes camp special.",
  activities: "Plan activities and weekly slots.",
  forms: "Manage your camp forms.",
  "form-submissions": "Read responses from your team.",
};

export function DashboardPage() {
  const { session } = useSession();
  const { currentCamp, weeks, selectedDaycampWeekId, selectedOvernightWeekId } =
    useCampContext();
  const userEmail =
    session.phase === "ready" ? session.user.email : "Unknown user";

  return (
    <Stack spacing={4}>
      <Paper
        sx={{
          position: "relative",
          overflow: "hidden",
          p: { xs: 3, md: 4 },
          minHeight: 210,
          display: "flex",
          alignItems: "center",
          background:
            "linear-gradient(90deg, #0A4A51 15%, rgba(0,59,66,0.82) 60%, rgba(0,59,66,0.45)), url('/images/login_canoe.jpg') center 48% / cover",
        }}
      >
        <Stack spacing={1}>
          <Typography variant="overline" color="text.secondary">
            YOUR CAMP, CONNECTED
          </Typography>
          <Typography component="h1" variant="h4">
            Dashboard
          </Typography>
          <Typography>
            {currentCamp ? `Camp: ${currentCamp.name}` : "No camp loaded"}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ overflowWrap: "anywhere" }}
          >
            Signed in as {userEmail}
          </Typography>
        </Stack>
      </Paper>

      <Stack spacing={2}>
        <Typography variant="h6">Active weeks</Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
          }}
        >
          {[
            { label: "Day camp", id: selectedDaycampWeekId },
            { label: "Overnight", id: selectedOvernightWeekId },
          ].map((week) => (
            <Paper key={week.label} sx={{ p: 2.5 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    color: "primary.main",
                    bgcolor: "rgba(53,168,195,0.12)",
                    p: 1.5,
                    borderRadius: 1,
                    display: "flex",
                  }}
                >
                  <CalendarMonthOutlined />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="overline" color="text.secondary">
                    {week.label}
                  </Typography>
                  <Typography
                    fontWeight={600}
                    sx={{ overflowWrap: "anywhere" }}
                  >
                    {lookupWeekLabel(week.id, weeks)}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          ))}
        </Box>
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h6">Modules</Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              xl: "repeat(3, 1fr)",
            },
            gap: 2,
          }}
        >
          {NAV_ITEMS.filter((item) => item.key !== "dashboard").map((item) => (
            <ButtonBase
              component={RouterLink}
              to={item.path}
              key={item.key}
              sx={{
                p: 2.5,
                border: 1,
                borderColor: "divider",
                bgcolor: "background.paper",
                borderRadius: 1,
                textAlign: "left",
                justifyContent: "flex-start",
                gap: 2,
                transition: "background-color 150ms ease",
                "&:hover, &.Mui-focusVisible": {
                  bgcolor: "rgba(0,139,163,0.3)",
                  outline: "2px solid #35A8C3",
                  outlineOffset: 2,
                },
              }}
            >
              <Box sx={{ color: "primary.main", display: "flex" }}>
                <ModuleIcon module={item.key} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={600} variant="body2">
                  {item.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {descriptions[item.key]}
                </Typography>
              </Box>
              <ArrowForward sx={{ color: "primary.main", fontSize: 18 }} />
            </ButtonBase>
          ))}
        </Box>
      </Stack>
    </Stack>
  );
}
