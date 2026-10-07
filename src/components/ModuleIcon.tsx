import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import DashboardOutlined from "@mui/icons-material/DashboardOutlined";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import FileUploadOutlined from "@mui/icons-material/FileUploadOutlined";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import MailOutline from "@mui/icons-material/MailOutline";
import PeopleOutline from "@mui/icons-material/PeopleOutline";
import RateReviewOutlined from "@mui/icons-material/RateReviewOutlined";
import SportsOutlined from "@mui/icons-material/SportsOutlined";
import type { NAV_ITEMS } from "../features/admin/resourceConfig";

const icons = {
  dashboard: DashboardOutlined,
  users: PeopleOutline,
  invitations: MailOutline,
  weeks: CalendarMonthOutlined,
  imports: FileUploadOutlined,
  campers: GroupsOutlined,
  activities: SportsOutlined,
  forms: DescriptionOutlined,
  "form-submissions": RateReviewOutlined,
};

export function ModuleIcon({
  module,
}: {
  module: (typeof NAV_ITEMS)[number]["key"];
}) {
  const Icon = icons[module];
  return <Icon fontSize="small" />;
}
