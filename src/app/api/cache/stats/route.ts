/**
 * 📊 API Statistiques Cache
 */

import { NextResponse } from "next/server";
import { getEmbeddingsStats } from "~/lib/meditation/embeddings-service";

export async function GET() {
  try {
    const stats = await getEmbeddingsStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("❌ Erreur API stats:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    );
  }
}