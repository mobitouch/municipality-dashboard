import { useEffect } from "react";
import { AlertTriangleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="bg-destructive/10 text-destructive mb-3 flex size-11 items-center justify-center rounded-full">
          <AlertTriangleIcon className="size-5" />
        </div>
        <p className="font-medium">Something went wrong</p>
        <p className="text-muted-foreground mt-1 text-sm">
          This screen hit an unexpected error. You can try again, or head back once you&apos;ve
          reloaded.
        </p>
        <Button className="mt-4" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
