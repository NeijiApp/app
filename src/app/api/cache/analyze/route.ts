/**
 * 🧠 API Analyse Clusters Sémantiques
 */

import { NextResponse } from "next/server";
import { CacheAdministration } from "~/lib/meditation/cache-management";

export async function GET() {
  try {
    const analysis = await CacheAdministration.analyzeSemanticClusters();
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("❌ Erreur API analyse:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'analyse des clusters" },
      { status: 500 }
    );
  }
}