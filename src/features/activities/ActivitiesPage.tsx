/* eslint-disable react-hooks/set-state-in-effect */
import {
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  createActivity,
  listActivities,
  updateActivity,
  type ActivityCreate,
  type ActivityRead,
  type ActivityUpdate,
} from "../../api/activities";
import { useCampContext } from "../../app/context/useCampContext";
import { WeekScopedLayout } from "../../components/WeekScopedLayout";
import { getErrorMessage } from "../../lib/http";
import { ActivityDialog } from "./ActivityDialog";
import { SlotsPanel } from "../slots/SlotsPanel";

export function ActivitiesPage() {
  const { currentCamp } = useCampContext();
  const queryClient = useQueryClient();
  const [dialogActivity, setDialogActivity] = useState<ActivityRead | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

  const campId = currentCamp?.id ?? null;

  const activitiesQuery = useQuery({
    queryKey: ["activities", campId],
    queryFn: () => listActivities(campId!),
    enabled: Boolean(campId),
  });

  useEffect(() => {
    if (!selectedActivityId && activitiesQuery.data?.[0]) {
      setSelectedActivityId(activitiesQuery.data[0].id);
    }
  }, [activitiesQuery.data, selectedActivityId]);

  const createMutation = useMutation({
    mutationFn: (payload: ActivityCreate) => createActivity(campId!, payload),
    onSuccess: async (createdActivity) => {
      setFormError(null);
      setIsDialogOpen(false);
      setSelectedActivityId(createdActivity.id);
      await queryClient.invalidateQueries({ queryKey: ["activities", campId] });
    },
    onError: (error) => {
      setFormError(getErrorMessage(error, "Unable to create activity."));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      activityId,
      payload,
    }: {
      activityId: string;
      payload: ActivityUpdate;
    }) => updateActivity(activityId, payload),
    onSuccess: async (updatedActivity) => {
      setFormError(null);
      setIsDialogOpen(false);
      setDialogActivity(updatedActivity);
      await queryClient.invalidateQueries({ queryKey: ["activities", campId] });
    },
    onError: (error) => {
      setFormError(getErrorMessage(error, "Unable to update activity."));
    },
  });

  const activities = activitiesQuery.data ?? [];
  const isSaving = createMutation.isPending || updateMutation.isPending;

  async function handleSubmit(payload: ActivityCreate | ActivityUpdate) {
    if (dialogActivity) {
      await updateMutation.mutateAsync({
        activityId: dialogActivity.id,
        payload,
      });
      return;
    }

    await createMutation.mutateAsync(payload as ActivityCreate);
  }

  return (
    <WeekScopedLayout
      title="Activities & Slots"
      description="Manage the activity catalog and generate slots for the active week."
      actions={
        <Button
          variant="contained"
          onClick={() => {
            setDialogActivity(null);
            setFormError(null);
            setIsDialogOpen(true);
          }}
        >
          Add activity
        </Button>
      }
    >
      {(scope) => (
        <Stack spacing={3}>
          <Paper sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={700}>
                Activity catalog
              </Typography>

              {activitiesQuery.isLoading ? (
                <Typography color="text.secondary">Loading activities…</Typography>
              ) : activitiesQuery.isError ? (
                <Typography color="error.main">
                  {getErrorMessage(activitiesQuery.error, "Unable to load activities.")}
                </Typography>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Rules</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activities.map((activity) => (
                      <TableRow key={activity.id} hover>
                        <TableCell>{activity.name}</TableCell>
                        <TableCell>{activity.description ?? "No description"}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Chip
                              size="small"
                              label={`Duration ${activity.duration_slots ?? 1}`}
                            />
                            <Chip
                              size="small"
                              label={`Min age ${activity.min_age ?? "none"}`}
                            />
                            {activity.requires_green_band ? (
                              <Chip size="small" color="success" label="Green band" />
                            ) : null}
                          </Stack>
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            onClick={() => {
                              setDialogActivity(activity);
                              setSelectedActivityId(activity.id);
                              setFormError(null);
                              setIsDialogOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Stack>
          </Paper>

          {campId && scope.activeWeek ? (
            <SlotsPanel
              campId={campId}
              week={scope.activeWeek}
              activities={activities}
              selectedActivityId={selectedActivityId}
              onSelectActivityId={setSelectedActivityId}
            />
          ) : null}

          <ActivityDialog
            open={isDialogOpen}
            activity={dialogActivity}
            isSaving={isSaving}
            error={formError}
            onClose={() => {
              if (isSaving) {
                return;
              }

              setDialogActivity(null);
              setIsDialogOpen(false);
              setFormError(null);
            }}
            onSubmit={handleSubmit}
          />
        </Stack>
      )}
    </WeekScopedLayout>
  );
}
