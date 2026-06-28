import { Badge } from "@repo/ui/badge";
import type { WarrantyStatus } from "@repo/validators";
import { statusBadgeVariant, statusLabels } from "../lib/format";

export function StatusBadge({ status }: { status: WarrantyStatus }) {
  return (
    <Badge variant={statusBadgeVariant[status]}>
      <span className="size-1.5 rounded-full bg-current" />
      {statusLabels[status]}
    </Badge>
  );
}
