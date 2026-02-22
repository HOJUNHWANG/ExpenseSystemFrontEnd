import { REPORT_STATUS } from "../lib/constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_VARIANT = {
  [REPORT_STATUS.DRAFT]: "secondary",
  [REPORT_STATUS.MANAGER_REVIEW]: "warning",
  [REPORT_STATUS.CFO_REVIEW]: "warning",
  [REPORT_STATUS.CEO_REVIEW]: "warning",
  [REPORT_STATUS.CFO_SPECIAL_REVIEW]: "warning",
  [REPORT_STATUS.CHANGES_REQUESTED]: "destructive",
  [REPORT_STATUS.APPROVED]: "success",
  [REPORT_STATUS.REJECTED]: "destructive",
};

export default function StatusBadge({ status, className = "" }) {
  const s = String(status || "").toUpperCase();
  const variant = STATUS_VARIANT[s] || "secondary";

  return (
    <Badge variant={variant} className={cn("text-[11px]", className)}>
      {s || "-"}
    </Badge>
  );
}
