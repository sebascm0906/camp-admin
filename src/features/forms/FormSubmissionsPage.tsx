/* eslint-disable react-hooks/set-state-in-effect */
import {
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useCampContext } from "../../app/context/useCampContext";
import { WeekScopedLayout, type WeekScope } from "../../components/WeekScopedLayout";
import {
  listFormSubmissions,
  type FormSubmissionType,
} from "../../api/forms";
import { getErrorMessage } from "../../lib/http";

function renderDetails(details: Record<string, unknown>) {
  return JSON.stringify(details, null, 2);
}

function WeekSubmissionsView({
  campId,
  scope,
}: {
  campId: string;
  scope: WeekScope;
}) {
  const [typeFilter, setTypeFilter] = useState<"all" | FormSubmissionType>("all");
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  const activeWeek = scope.activeWeek;
  const submissionsQuery = useQuery({
    queryKey: ["form-submissions", campId, activeWeek?.id, typeFilter],
    queryFn: () =>
      listFormSubmissions(
        activeWeek!.id,
        typeFilter === "all" ? undefined : typeFilter,
      ),
    enabled: Boolean(activeWeek),
  });

  const submissions = submissionsQuery.data ?? [];
  const selectedSubmission =
    submissions.find((submission) => submission.id === selectedSubmissionId) ??
    submissions[0] ??
    null;

  useEffect(() => {
    if (!selectedSubmissionId && submissions[0]) {
      setSelectedSubmissionId(submissions[0].id);
    }
  }, [selectedSubmissionId, submissions]);

  return (
    <Stack spacing={3}>
      <TextField
        select
        label="Submission type"
        value={typeFilter}
        onChange={(event) =>
          setTypeFilter(event.target.value as "all" | FormSubmissionType)
        }
        SelectProps={{ native: true }}
        sx={{ maxWidth: 260 }}
      >
        <option value="all">All</option>
        <option value="maintenance">maintenance</option>
        <option value="behavior">behavior</option>
        <option value="food">food</option>
        <option value="shoutout">shoutout</option>
      </TextField>

      <Stack direction={{ xs: "column", xl: "row" }} spacing={3}>
        <Paper sx={{ p: 3, flex: 1 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Inbox
          </Typography>

          {submissionsQuery.isLoading ? (
            <Typography color="text.secondary">Loading submissions…</Typography>
          ) : submissionsQuery.isError ? (
            <Typography color="error.main">
              {getErrorMessage(
                submissionsQuery.error,
                "Unable to load form submissions.",
              )}
            </Typography>
          ) : submissions.length === 0 ? (
            <Typography color="text.secondary">No submissions for this filter.</Typography>
          ) : (
            <List disablePadding>
              {submissions.map((submission) => (
                <ListItemButton
                  key={submission.id}
                  selected={selectedSubmission?.id === submission.id}
                  onClick={() => setSelectedSubmissionId(submission.id)}
                  sx={{ borderRadius: 2, mb: 1 }}
                >
                  <ListItemText
                    primary={submission.summary}
                    secondary={`${submission.form_type} · ${submission.submitted_by.name}`}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </Paper>

        <Paper sx={{ p: 3, flex: 1.1 }} data-testid="submission-detail">
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Detail
          </Typography>

          {selectedSubmission ? (
            <Stack spacing={1.5}>
              <Typography fontWeight={700}>{selectedSubmission.summary}</Typography>
              <Typography color="text.secondary">
                Submitted by {selectedSubmission.submitted_by.name}
              </Typography>
              <Typography color="text.secondary">
                Type: {selectedSubmission.form_type}
              </Typography>
              <Typography
                component="pre"
                sx={{ m: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
              >
                {renderDetails(selectedSubmission.details)}
              </Typography>
            </Stack>
          ) : (
            <Typography color="text.secondary">
              Select a submission to inspect its answers.
            </Typography>
          )}
        </Paper>
      </Stack>
    </Stack>
  );
}

export function FormSubmissionsPage() {
  const { currentCamp } = useCampContext();

  return (
    <WeekScopedLayout
      title="Form Submissions"
      description="Review who submitted each operational form and inspect the captured answers."
    >
      {(scope) =>
        currentCamp ? <WeekSubmissionsView campId={currentCamp.id} scope={scope} /> : null
      }
    </WeekScopedLayout>
  );
}
