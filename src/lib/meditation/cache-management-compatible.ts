/**
 * 🎯 VERSION COMPATIBLE BUILD DU SYSTÈME DE CACHE
 * Évite les problèmes d'import async dans le système de cache
 */

import { db } from "~/server/db/connection";
import { audioSegmentsCache } from "~/server/db/schema";
import { sql, eq, and, desc } from "drizzle-orm";
import type { SelectAudioSegmentsCache } from "~/server/db/schema";

/**
 * 🔧 SYSTÈME DE CACHE SIMPLIFIÉ POUR BUILD
 */
export class SimpleCacheSystem {
  private static instance: SimpleCacheSystem;
  private localCache = new Map<string, SelectAudioSegmentsCache>();

  static getInstance(): SimpleCacheSystem {
    if (!SimpleCacheSystem.instance) {
      SimpleCacheSystem.instance = new SimpleCacheSystem();
    }
    return SimpleCacheSystem.instance;
  }

  /**
   * Recherche cache simple (compatible build)
   */
  async findCachedSegment(
    text: string,
    voiceId: string,
    voiceStyle: string
  ): Promise<SelectAudioSegmentsCache | null> {
    const cacheKey = `${text}-${voiceId}-${voiceStyle}`;

    try {
      // 1. Vérifier cache local d'abord
      const localResult = this.localCache.get(cacheKey);
      if (localResult) {
        console.log("🎯 Cache local hit");
        return localResult;
      }

      // 2. Recherche en database
      const textHash = this.generateTextHash(text);
      const dbResult = await db
        .select()
        .from(audioSegmentsCache)
        .where(
          and(
            eq(audioSegmentsCache.textHash, textHash),
            eq(audioSegmentsCache.voiceId, voiceId),
            eq(audioSegmentsCache.voiceStyle, voiceStyle)
          )
        )
        .limit(1);

      const segment = dbResult[0];
      if (segment) {
        // Cache local pour prochaine fois
        this.localCache.set(cacheKey, segment);
        await this.incrementUsageCount(segment.id);
        console.log("🎯 Database hit");
        return segment;
      }

      console.log("🔄 Pas de cache trouvé");
      return null;
    } catch (error) {
      console.error("❌ Erreur cache:", error);
      return null;
    }
  }

  /**
   * Sauvegarde segment (compatible build)
   */
  async saveSegment(
    text: string,
    voiceId: string,
    voiceGender: "male" | "female",
    voiceStyle: string,
    audioUrl: string,
    audioDuration?: number,
    fileSize?: number,
    language = "en-US"
  ): Promise<SelectAudioSegmentsCache | null> {
    try {
      const textHash = this.generateTextHash(text);
      
      const newSegment = {
        textContent: text,
        textHash,
        voiceId,
        voiceGender,
        voiceStyle,
        audioUrl,
        audioDuration,
        fileSize,
        usageCount: 1,
        language,
      };

      const inserted = await db
        .insert(audioSegmentsCache)
        .values(newSegment)
        .returning();

      const savedSegment = inserted[0];
      if (savedSegment) {
        // Cache local
        const cacheKey = `${text}-${voiceId}-${voiceStyle}`;
        this.localCache.set(cacheKey, savedSegment);
        console.log(`✅ Segment sauvegardé: ${text.substring(0, 50)}...`);
      }

      return savedSegment || null;
    } catch (error) {
      console.error("❌ Erreur sauvegarde segment:", error);
      return null;
    }
  }

  private generateTextHash(text: string): string {
    return require("crypto")
      .createHash("sha256")
      .update(text.trim().toLowerCase())
      .digest("hex");
  }

  private async incrementUsageCount(segmentId: number): Promise<void> {
    try {
      await db
        .update(audioSegmentsCache)
        .set({
          usageCount: sql`${audioSegmentsCache.usageCount} + 1`,
          lastUsedAt: sql`now()`,
        })
        .where(eq(audioSegmentsCache.id, segmentId));
    } catch (error) {
      console.warn("⚠️ Erreur incrémentation usage:", error);
    }
  }

  /**
   * Nettoie le cache local
   */
  clearLocalCache(): void {
    this.localCache.clear();
    console.log("🧹 Cache local nettoyé");
  }
}

// Export de l'instance singleton
export const simpleCache = SimpleCacheSystem.getInstance();