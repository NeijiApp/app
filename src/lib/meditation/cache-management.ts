/**
 * 🎯 SYSTÈME DE GESTION DE CACHE SÉMANTIQUE ROBUSTE
 * Solution permanente avec fallbacks et outils d'administration
 */

import { db } from "~/server/db";
import { audioSegmentsCache } from "~/server/db/schema";
import { sql, eq, and, desc } from "drizzle-orm";
import type { SelectAudioSegmentsCache } from "~/server/db/schema";
import {
  findSimilarSegmentsByEmbedding,
  generateEmbedding,
  updateMissingEmbeddings,
  getEmbeddingsStats,
  type SimilaritySearchResult,
} from "./embeddings-service";

/**
 * 🔧 SYSTÈME DE CACHE HYBRIDE AVEC FALLBACKS
 */
export class HybridCacheSystem {
  private static instance: HybridCacheSystem;
  private localCache = new Map<string, SelectAudioSegmentsCache>();
  private isOnline = true;

  static getInstance(): HybridCacheSystem {
    if (!HybridCacheSystem.instance) {
      HybridCacheSystem.instance = new HybridCacheSystem();
    }
    return HybridCacheSystem.instance;
  }

  /**
   * Recherche cache avec fallbacks multiples
   */
  async findCachedSegment(
    text: string,
    voiceId: string,
    voiceStyle: string,
    options: {
      useSemanticSearch?: boolean;
      threshold?: number;
      language?: string;
    } = {}
  ): Promise<{
    exact: SelectAudioSegmentsCache | null;
    similar: SimilaritySearchResult[];
    recommendation: "use_exact" | "use_similar" | "create_new";
    source: "database" | "local_cache" | "fallback";
  }> {
    const cacheKey = `${text}-${voiceId}-${voiceStyle}`;

    try {
      // 1. Vérifier cache local d'abord
      const localResult = this.localCache.get(cacheKey);
      if (localResult) {
        console.log("🎯 Cache local hit");
        return {
          exact: localResult,
          similar: [],
          recommendation: "use_exact",
          source: "local_cache",
        };
      }

      // 2. Essayer base de données
      if (this.isOnline) {
        const dbResult = await this.searchDatabase(text, voiceId, voiceStyle, options);
        
        // Mettre en cache local si trouvé
        if (dbResult.exact) {
          this.localCache.set(cacheKey, dbResult.exact);
        }
        
        return { ...dbResult, source: "database" };
      }

      // 3. Fallback: toujours créer nouveau
      console.log("🔄 Fallback: créer nouveau segment");
      return {
        exact: null,
        similar: [],
        recommendation: "create_new",
        source: "fallback",
      };
    } catch (error) {
      console.error("❌ Erreur cache hybride:", error);
      this.isOnline = false; // Marquer offline temporairement
      
      return {
        exact: null,
        similar: [],
        recommendation: "create_new",
        source: "fallback",
      };
    }
  }

  private async searchDatabase(
    text: string,
    voiceId: string,
    voiceStyle: string,
    options: {
      useSemanticSearch?: boolean;
      threshold?: number;
      language?: string;
    }
  ): Promise<{
    exact: SelectAudioSegmentsCache | null;
    similar: SimilaritySearchResult[];
    recommendation: "use_exact" | "use_similar" | "create_new";
  }> {
    const { useSemanticSearch = true, threshold = 0.85, language = "en-US" } = options;

    // 1. Recherche exacte par hash
    const textHash = this.generateTextHash(text);
    const exactMatch = await db
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

    if (exactMatch[0]) {
      console.log("🎯 Correspondance exacte trouvée");
      await this.incrementUsageCount(exactMatch[0].id);
      return {
        exact: exactMatch[0],
        similar: [],
        recommendation: "use_exact",
      };
    }

    // 2. Recherche sémantique si activée
    let similarResults: SimilaritySearchResult[] = [];
    if (useSemanticSearch) {
      similarResults = await findSimilarSegmentsByEmbedding(
        text,
        voiceId,
        voiceStyle,
        { threshold, language, limit: 3 }
      );
    }

    // 3. Décision intelligente
    const bestMatch = similarResults[0];
    if (bestMatch && bestMatch.similarity >= threshold) {
      console.log(`🎯 Segment similaire trouvé (${(bestMatch.similarity * 100).toFixed(1)}%)`);
      await this.incrementUsageCount(bestMatch.segment.id);
      return {
        exact: null,
        similar: similarResults,
        recommendation: "use_similar",
      };
    }

    return {
      exact: null,
      similar: similarResults,
      recommendation: "create_new",
    };
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
   * Sauvegarde avec fallback
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

        // Générer embedding en arrière-plan
        this.generateEmbeddingAsync(text, savedSegment.id);
        
        console.log(`✅ Segment sauvegardé: ${text.substring(0, 50)}...`);
      }

      this.isOnline = true; // Marquer online si succès
      return savedSegment || null;
    } catch (error) {
      console.error("❌ Erreur sauvegarde segment:", error);
      this.isOnline = false;
      return null;
    }
  }

  private async generateEmbeddingAsync(text: string, segmentId: number): Promise<void> {
    try {
      const embedding = await generateEmbedding(text);
      const embeddingJson = JSON.stringify(embedding);
      
      await db
        .update(audioSegmentsCache)
        .set({ embedding: embeddingJson })
        .where(eq(audioSegmentsCache.id, segmentId));
        
      console.log(`🧠 Embedding généré pour segment ${segmentId}`);
    } catch (error) {
      console.warn(`⚠️ Échec embedding pour segment ${segmentId}:`, error);
    }
  }

  /**
   * Nettoie le cache local
   */
  clearLocalCache(): void {
    this.localCache.clear();
    console.log("🧹 Cache local nettoyé");
  }

  /**
   * Statistiques du cache
   */
  getCacheInfo(): {
    localCacheSize: number;
    isOnline: boolean;
    localKeys: string[];
  } {
    return {
      localCacheSize: this.localCache.size,
      isOnline: this.isOnline,
      localKeys: Array.from(this.localCache.keys()),
    };
  }
}

/**
 * 📊 OUTILS D'ADMINISTRATION DU CACHE
 */
export class CacheAdministration {
  /**
   * Télécharge tous les segments pour analyse
   */
  static async downloadAllSegments(): Promise<{
    segments: SelectAudioSegmentsCache[];
    embeddings: Array<{
      id: number;
      embedding: number[] | null;
      similarity_threshold: number | null;
    }>;
    statistics: any;
  }> {
    try {
      const segments = await db.select().from(audioSegmentsCache);
      
      const embeddings = segments.map(s => ({
        id: s.id,
        embedding: s.embedding ? JSON.parse(s.embedding) : null,
        similarity_threshold: s.similarityThreshold,
      }));

      const statistics = await getEmbeddingsStats();

      console.log(`📊 Téléchargé ${segments.length} segments`);
      
      return { segments, embeddings, statistics };
    } catch (error) {
      console.error("❌ Erreur téléchargement:", error);
      throw error;
    }
  }

  /**
   * Analyse sémantique des clusters
   */
  static async analyzeSemanticClusters(): Promise<{
    totalSegments: number;
    clustersFound: number;
    duplicatesDetected: Array<{
      cluster: SelectAudioSegmentsCache[];
      avgSimilarity: number;
    }>;
    recommendations: string[];
  }> {
    try {
      const segments = await db
        .select()
        .from(audioSegmentsCache)
        .where(sql`${audioSegmentsCache.embedding} IS NOT NULL`);

      const clusters: Array<{
        cluster: SelectAudioSegmentsCache[];
        avgSimilarity: number;
      }> = [];

      // Analyser par paires pour détecter clusters
      for (let i = 0; i < segments.length - 1; i++) {
        for (let j = i + 1; j < segments.length; j++) {
          const seg1 = segments[i];
          const seg2 = segments[j];
          
          if (seg1?.embedding && seg2?.embedding) {
            try {
              const emb1 = JSON.parse(seg1.embedding);
              const emb2 = JSON.parse(seg2.embedding);
              
              const similarity = this.calculateCosineSimilarity(emb1, emb2);
              
              if (similarity > 0.95) { // Très similaire
                clusters.push({
                  cluster: [seg1, seg2],
                  avgSimilarity: similarity,
                });
              }
            } catch (error) {
              continue;
            }
          }
        }
      }

      const recommendations = [
        `${segments.length} segments avec embeddings analysés`,
        `${clusters.length} clusters de similarité élevée détectés`,
        clusters.length > 10 ? "Optimisation possible en consolidant les doublons" : "Cache optimisé",
      ];

      return {
        totalSegments: segments.length,
        clustersFound: clusters.length,
        duplicatesDetected: clusters,
        recommendations,
      };
    } catch (error) {
      console.error("❌ Erreur analyse clusters:", error);
      throw error;
    }
  }

  private static calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      const a = vectorA[i] ?? 0;
      const b = vectorB[i] ?? 0;
      dotProduct += a * b;
      normA += a * a;
      normB += b * b;
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Optimise le cache en supprimant les doublons
   */
  static async optimizeCache(dryRun = true): Promise<{
    duplicatesFound: number;
    spaceSaved: number;
    itemsRemoved: number;
  }> {
    try {
      const analysis = await this.analyzeSemanticClusters();
      let itemsRemoved = 0;
      let spaceSaved = 0;

      if (!dryRun) {
        for (const duplicate of analysis.duplicatesDetected) {
          if (duplicate.cluster.length >= 2) {
            // Garder le plus utilisé, supprimer les autres
            const sorted = duplicate.cluster.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
            const toRemove = sorted.slice(1);

            for (const segment of toRemove) {
              await db
                .delete(audioSegmentsCache)
                .where(eq(audioSegmentsCache.id, segment.id));
              
              itemsRemoved++;
              spaceSaved += segment.fileSize || 0;
            }
          }
        }
      }

      return {
        duplicatesFound: analysis.duplicatesDetected.length,
        spaceSaved,
        itemsRemoved,
      };
    } catch (error) {
      console.error("❌ Erreur optimisation:", error);
      throw error;
    }
  }

  /**
   * Répare les embeddings manquants
   */
  static async repairMissingEmbeddings(): Promise<{
    processed: number;
    errors: number;
  }> {
    try {
      console.log("🔧 Réparation des embeddings manquants...");
      return await updateMissingEmbeddings({
        batchSize: 50,
        language: "en-US",
        forceUpdate: false,
      });
    } catch (error) {
      console.error("❌ Erreur réparation embeddings:", error);
      throw error;
    }
  }
}

// Export du système hybride comme instance singleton
export const hybridCache = HybridCacheSystem.getInstance();