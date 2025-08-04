/**
 * 📊 API Téléchargement Données Cache
 */

import { NextResponse } from "next/server";
import { CacheAdministration } from "~/lib/meditation/cache-management";

export async function GET() {
  try {
    const data = await CacheAdministration.downloadAllSegments();
    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Erreur API téléchargement:", error);
    return NextResponse.json(
      { error: "Erreur lors du téléchargement des données" },
      { status: 500 }
    );
  }
}