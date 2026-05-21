import { Skeleton } from "../ui/skeleton";
import { Card } from "../ui/card";

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card padding={false} className="overflow-hidden p-4">
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </Card>
  );
}
