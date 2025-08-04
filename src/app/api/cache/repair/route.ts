/**
 * 🔧 API Réparation Embeddings
 */

import { NextResponse } from "next/server";
import { CacheAdministration } from "~/lib/meditation/cache-management";

export async function POST() {
  try {
    const result = await CacheAdministration.repairMissingEmbeddings();
    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Erreur API réparation:", error);
    return NextResponse.json(
      { error: "Erreur lors de la réparation des embeddings" },
      { status: 500 }
    );
  }
}