import * as React from "react";

import { APP_NAME } from "@/lib/constants";

/** Sets the tab title using the app's "Page · Name" template. */
export function useDocumentTitle(title: string): void {
  React.useEffect(() => {
    document.title = `${title} · ${APP_NAME}`;
  }, [title]);
}
