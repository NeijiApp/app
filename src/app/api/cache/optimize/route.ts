/**
 * ⚡ API Optimisation Cache
 */

import { NextResponse } from "next/server";
import { CacheAdministration } from "~/lib/meditation/cache-management";

export async function POST(request: Request) {
  try {
    const { dryRun = true } = await request.json();
    const result = await CacheAdministration.optimizeCache(dryRun);
    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Erreur API optimisation:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'optimisation" },
      { status: 500 }
    );
  }
}