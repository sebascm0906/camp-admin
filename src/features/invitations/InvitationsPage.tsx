import {
  Alert,
  Button,
  Chip,
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useState } from "react";
import {
  createInvitation,
  listInvitations,
  reissueInvitation,
  revokeInvitation,
  type Invitation,
  type InvitationCreate,
} from "../../api/invitations";
import { getErrorMessage } from "../../lib/http";
import { InvitationDialog } from "./InvitationDialog";

function getInvitationState(invitation: Invitation) {
  return invitation.used_at ? "Claimed" : "Pending";
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "None";
  }

  return new Date(value).toLocaleString();
}

export function InvitationsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const invitationsQuery = useQuery({
    queryKey: ["invitations"],
    queryFn: listInvitations,
  });

  const createMutation = useMutation({
    mutationFn: (payload: InvitationCreate) => createInvitation(payload),
    onSuccess: (createdInvitation) => {
      queryClient.setQueryData<Invitation[]>(
        ["invitations"],
        (current = []) => [
          createdInvitation,
          ...current.filter(
            (invitation) => invitation.id !== createdInvitation.id,
          ),
        ],
      );
      setFormError(null);
      setIsDialogOpen(false);
    },
    onError: (error) => {
      setFormError(getErrorMessage(error, "Unable to create invitation."));
    },
  });

  function clearActionFeedback() {
    setActionError(null);
    setActionMessage(null);
  }

  async function handleActionError(error: unknown) {
    const status = isAxiosError(error) ? error.response?.status : undefined;
    setActionError(
      status === 404
        ? "This invitation is no longer available. Review the refreshed list before trying again."
        : getErrorMessage(error, "Unable to update invitation."),
    );
    if (status === 404 || status === 409) {
      await queryClient.invalidateQueries({ queryKey: ["invitations"] });
    }
  }

  const revokeMutation = useMutation({
    mutationFn: (invitationId: string) => revokeInvitation(invitationId),
    onMutate: clearActionFeedback,
    onSuccess: (_result, invitationId) => {
      queryClient.setQueryData<Invitation[]>(["invitations"], (current = []) =>
        current.filter((invitation) => invitation.id !== invitationId),
      );
      setActionMessage("Invitation revoked.");
    },
    onError: handleActionError,
  });

  const reissueMutation = useMutation({
    mutationFn: (invitationId: string) => reissueInvitation(invitationId),
    onMutate: clearActionFeedback,
    onSuccess: (updatedInvitation, previousInvitationId) => {
      queryClient.setQueryData<Invitation[]>(["invitations"], (current = []) =>
        current.map((invitation) =>
          invitation.id === previousInvitationId
            ? updatedInvitation
            : invitation,
        ),
      );
      setActionMessage("Invitation renewed.");
    },
    onError: handleActionError,
  });

  const invitations = invitationsQuery.data ?? [];
  const isSaving = createMutation.isPending;
  const isActionPending = reissueMutation.isPending || revokeMutation.isPending;

  async function handleSubmit(payload: InvitationCreate) {
    createMutation.mutate(payload);
  }

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        spacing={2}
      >
        <Stack spacing={0.75}>
          <Typography variant="h4" fontWeight={800}>
            Invitations
          </Typography>
          <Typography color="text.secondary">
            Invite new admins and counselors into this camp.
          </Typography>
        </Stack>

        <Button
          variant="contained"
          onClick={() => {
            clearActionFeedback();
            setFormError(null);
            setIsDialogOpen(true);
          }}
        >
          New invitation
        </Button>
      </Stack>

      {actionError && <Alert severity="error">{actionError}</Alert>}
      {actionMessage && <Alert severity="success">{actionMessage}</Alert>}

      <Paper sx={{ p: 3 }}>
        {invitationsQuery.isLoading ? (
          <Stack alignItems="center" py={6}>
            <CircularProgress />
          </Stack>
        ) : invitationsQuery.isError ? (
          <Stack spacing={1.5}>
            <Typography color="error.main">
              {getErrorMessage(
                invitationsQuery.error,
                "Unable to load invitations.",
              )}
            </Typography>
            <Button onClick={() => void invitationsQuery.refetch()}>
              Retry
            </Button>
          </Stack>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invitations.map((invitation) => {
                const isClaimed = Boolean(invitation.used_at);

                return (
                  <TableRow key={invitation.id} hover>
                    <TableCell>{invitation.email}</TableCell>
                    <TableCell>{invitation.role}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={getInvitationState(invitation)}
                      />
                    </TableCell>
                    <TableCell>{formatDate(invitation.expires_at)}</TableCell>
                    <TableCell>{formatDate(invitation.created_at)}</TableCell>
                    <TableCell align="right">
                      <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={1}
                        justifyContent="flex-end"
                      >
                        <Button
                          onClick={() => reissueMutation.mutate(invitation.id)}
                          disabled={isClaimed || isActionPending}
                        >
                          Reissue
                        </Button>
                        <Button
                          color="error"
                          onClick={() => revokeMutation.mutate(invitation.id)}
                          disabled={isClaimed || isActionPending}
                        >
                          Revoke
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Paper>

      <InvitationDialog
        open={isDialogOpen}
        isSaving={isSaving}
        error={formError}
        onClose={() => {
          if (isSaving) {
            return;
          }

          setIsDialogOpen(false);
          setFormError(null);
        }}
        onSubmit={handleSubmit}
      />
    </Stack>
  );
}
