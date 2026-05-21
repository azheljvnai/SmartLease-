import { Loader2 } from "lucide-react";
import { cn } from "../ui/utils";

export function LoadingSpinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-6 w-6 animate-spin text-primary", className)} />;
}

export function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <LoadingSpinner className="h-8 w-8" />
    </div>
  );
}
