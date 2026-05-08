import { Paper, Stack, Typography } from "@mui/material";

export function PlatformHomePage() {
  return (
    <Stack spacing={3}>
      <Stack spacing={0.75}>
        <Typography variant="h4" fontWeight={800}>
          Platform
        </Typography>
        <Typography color="text.secondary">
          Internal camp onboarding and support tools.
        </Typography>
      </Stack>

      <Paper sx={{ p: 3 }}>
        <Typography fontWeight={700}>Camp onboarding</Typography>
        <Typography color="text.secondary">
          Create camps and root admin invitations from this area.
        </Typography>
      </Paper>
    </Stack>
  );
}
