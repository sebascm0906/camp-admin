import {
  FormControl,
  NativeSelect,
  Stack,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useSupportContext } from "../../app/support/supportContext";
import { listPlatformCamps } from "../../api/platform";

export function SupportCampSelector() {
  const support = useSupportContext();
  const campsQuery = useQuery({
    queryKey: ["platform", "camps"],
    queryFn: listPlatformCamps,
    enabled: support.isSupportActive,
  });

  if (!support.isSupportActive || !support.selectedCamp) {
    return null;
  }

  const camps = campsQuery.data ?? [support.selectedCamp];

  return (
    <Stack spacing={0.5} sx={{ minWidth: { xs: "100%", sm: 220 } }}>
      <Typography
        component="label"
        htmlFor="support-camp-select"
        variant="caption"
        color="text.secondary"
      >
        Camp
      </Typography>
      <FormControl size="small" fullWidth>
        <NativeSelect
          inputProps={{
            id: "support-camp-select",
            "aria-label": "Camp",
          }}
          value={support.selectedCamp.id}
          disabled={campsQuery.isLoading}
          onChange={(event) => {
            const nextCamp = camps.find((camp) => camp.id === event.target.value);
            if (nextCamp) {
              support.startSupport(nextCamp);
            }
          }}
          sx={{
            color: "text.primary",
            minHeight: 32,
            "& select": {
              py: 0.5,
            },
          }}
        >
          {camps.map((camp) => (
            <option key={camp.id} value={camp.id}>
              {camp.name}
            </option>
          ))}
        </NativeSelect>
      </FormControl>
    </Stack>
  );
}
