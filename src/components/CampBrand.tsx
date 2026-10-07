import { Box } from "@mui/material";

export function CampBrand({ width = 200 }: { width?: number }) {
  return (
    <Box
      component="img"
      src="/brand/login_logo_with_slogan.png"
      alt="Camp Connect - Less paper, more summer!"
      width={977}
      height={385}
      sx={{
        display: "block",
        width,
        maxWidth: "100%",
        height: "auto",
        objectFit: "contain",
      }}
    />
  );
}
