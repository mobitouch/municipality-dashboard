"use client";

import * as React from "react";
import { RotateCcwIcon } from "lucide-react";

import { ConfirmAction } from "@/components/form/confirm-action";
import { Button } from "@/components/ui/button";
import { resetDemoDataAction } from "@/lib/actions/demo";

export function ResetDemoDataButton() {
  return (
    <ConfirmAction
      trigger={
        <Button variant="outline" size="sm">
          <RotateCcwIcon />
          Reset demo data
        </Button>
      }
      title="Reset demo data?"
      description="Regenerates the sample requests, notes, activity, and notifications from scratch. Departments, categories, staff, user accounts, and API keys are left untouched."
      confirmLabel="Reset"
      action={resetDemoDataAction}
      hiddenFields={{}}
    />
  );
}
