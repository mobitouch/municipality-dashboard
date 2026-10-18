import { FileQuestionIcon } from "lucide-react";

import { PageShell } from "@/components/app-shell/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/components/link";
import { useDocumentTitle } from "@/lib/client/use-document-title";

export function NotFoundPage() {
  useDocumentTitle("Not found");

  return (
    <PageShell title="Not found">
      <div className="bg-card mx-auto max-w-md rounded-xl border p-10 text-center">
        <FileQuestionIcon className="text-muted-foreground mx-auto mb-3 size-8" />
        <p className="font-medium">We couldn&apos;t find that page</p>
        <p className="text-muted-foreground mt-1 text-sm">
          It may have been deleted, or the link may be wrong.
        </p>
        <Link href="/overview" className={buttonVariants({ className: "mt-4" })}>
          Back to Overview
        </Link>
      </div>
    </PageShell>
  );
}
