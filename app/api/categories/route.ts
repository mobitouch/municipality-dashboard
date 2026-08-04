import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { authenticate, unauthorized } from "@/lib/auth/request-auth";
import { listCategories } from "@/lib/data/categories";
import type { RequestKind } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Lets the municipal website build its "what is this about?" dropdown from
 * the same list the dashboard uses, so the two never drift apart.
 */
export async function GET(request: NextRequest) {
  const caller = authenticate(request);
  if (!caller) return unauthorized();

  const kind = request.nextUrl.searchParams.get("kind") as RequestKind | null;
  const categories = listCategories({ kind: kind ?? undefined });

  return NextResponse.json({
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      kind: category.kind,
    })),
  });
}
