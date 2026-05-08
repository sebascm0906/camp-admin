import {
  Button,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useSupportContext } from "../../app/support/supportContext";
import { listPlatformCamps } from "../../api/platform";
import { getErrorMessage } from "../../lib/http";

export function PlatformCampsPage() {
  const nav = useNavigate();
  const support = useSupportContext();
  const campsQuery = useQuery({
    queryKey: ["platform", "camps"],
    queryFn: listPlatformCamps,
  });

  const camps = campsQuery.data ?? [];

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        spacing={2}
      >
        <Stack spacing={0.75}>
          <Typography variant="h4" fontWeight={800}>
            Camps
          </Typography>
          <Typography color="text.secondary">
            Customer camps created from the internal platform area.
          </Typography>
        </Stack>

        <Button variant="contained" href="/platform/new-camp">
          New camp
        </Button>
      </Stack>

      <Paper sx={{ p: 3, overflowX: "auto" }}>
        {campsQuery.isLoading ? (
          <Stack alignItems="center" py={6}>
            <CircularProgress />
          </Stack>
        ) : campsQuery.isError ? (
          <Stack spacing={1.5}>
            <Typography color="error.main">
              {getErrorMessage(campsQuery.error, "Unable to load camps.")}
            </Typography>
            <Button onClick={() => void campsQuery.refetch()}>Retry</Button>
          </Stack>
        ) : camps.length === 0 ? (
          <Stack spacing={1}>
            <Typography fontWeight={700}>No camps yet</Typography>
            <Typography color="text.secondary">
              Create the first customer camp to generate its root admin invitation.
            </Typography>
          </Stack>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Timezone</TableCell>
                <TableCell>ID</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {camps.map((camp) => (
                <TableRow key={camp.id} hover>
                  <TableCell>{camp.name}</TableCell>
                  <TableCell>{camp.timezone || "None"}</TableCell>
                  <TableCell>{camp.id}</TableCell>
                  <TableCell align="right">
                    <Button
                      onClick={() => {
                        support.startSupport(camp);
                        nav("/dashboard");
                      }}
                    >
                      View support
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Stack>
  );
}
