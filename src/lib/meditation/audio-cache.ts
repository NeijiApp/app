import { createHash } from 'crypto';
import { db } from '~/server/db';
import { audioSegmentsCache } from '~/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import type { SelectAudioSegmentsCache, InsertAudioSegmentsCache } from '~/server/db/schema';
import { 
    generateEmbedding, 
    findSimilarSegmentsByEmbedding,
    type SimilaritySearchResult 
} from './embeddings-service';

// Re-export du type pour l'utilisation externe
export type { SimilaritySearchResult } from './embeddings-service';

/**
 * Génère un hash SHA-256 d'un texte pour l'identification unique
 */
export function generateTextHash(text: string): string {
    return createHash('sha256').update(text.trim().toLowerCase()).digest('hex');
}

/**
 * Vérifie si un segment audio existe déjà dans le cache
 */
export async function findCachedAudioSegment(
    text: string,
    voiceId: string,
    voiceStyle: string
): Promise<SelectAudioSegmentsCache | null> {
    const textHash = generateTextHash(text);
    
    try {
        const cached = await db
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
            
        return cached?.[0] || null;
    } catch (error) {
        console.error('❌ Error finding cached audio segment:', error);
        return null;
    }
}

/**
 * Sauvegarde un nouveau segment audio dans le cache avec embedding
 */
export async function saveAudioSegmentToCache(
    text: string,
    voiceId: string,
    voiceGender: 'male' | 'female',
    voiceStyle: string,
    audioUrl: string,
    audioDuration?: number,
    fileSize?: number,
    language: string = 'fr-FR'
): Promise<SelectAudioSegmentsCache | null> {
    const textHash = generateTextHash(text);
    
    const newSegment: InsertAudioSegmentsCache = {
        textContent: text,
        textHash: textHash,
        voiceId: voiceId,
        voiceGender: voiceGender,
        voiceStyle: voiceStyle,
        audioUrl: audioUrl,
        audioDuration: audioDuration,
        fileSize: fileSize,
        usageCount: 1,
        language: language,
    };
    
    try {
        const inserted = await db
            .insert(audioSegmentsCache)
            .values(newSegment)
            .returning();
            
        const savedSegment = inserted?.[0];
        if (savedSegment) {
            console.log(`✅ Cached new audio segment: "${text.substring(0, 50)}..."`);
            
            // Générer l'embedding en arrière-plan (non-bloquant)
            generateEmbedding(text)
                .then(embedding => {
                    const embeddingJson = JSON.stringify(embedding);
                    return db
                        .update(audioSegmentsCache)
                        .set({ embedding: embeddingJson })
                        .where(eq(audioSegmentsCache.id, savedSegment.id));
                })
                .then(() => {
                    console.log(`🧠 Embedding généré pour segment ${savedSegment.id}`);
                })
                .catch(error => {
                    console.warn(`⚠️ Échec génération embedding pour segment ${savedSegment.id}:`, error);
                });
        }
        
        return savedSegment || null;
    } catch (error) {
        console.error('❌ Error saving audio segment to cache:', error);
        return null;
    }
}

/**
 * Met à jour le compteur d'utilisation d'un segment audio
 */
export async function incrementUsageCount(segmentId: number): Promise<void> {
    try {
        await db
            .update(audioSegmentsCache)
            .set({
                usageCount: sql`${audioSegmentsCache.usageCount} + 1`,
                lastUsedAt: sql`now()`,
            })
            .where(eq(audioSegmentsCache.id, segmentId));
            
        console.log(`📈 Incremented usage count for segment ${segmentId}`);
    } catch (error) {
        console.error('❌ Error incrementing usage count:', error);
    }
}

/**
 * Calcule la similarité entre deux textes (algorithme simple de distance de Levenshtein)
 * Retourne un score de 0 à 1 (1 = identique, 0 = complètement différent)
 */
export function calculateTextSimilarity(text1: string, text2: string): number {
    const str1 = text1.trim().toLowerCase();
    const str2 = text2.trim().toLowerCase();
    
    if (str1 === str2) return 1;
    
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1;
    
    const distance = levenshteinDistance(str1, str2);
    return (maxLength - distance) / maxLength;
}

/**
 * Calcule la distance de Levenshtein entre deux chaînes
 */
function levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(0));
    
    for (let i = 0; i <= str1.length; i++) matrix[0]![i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j]![0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
        for (let i = 1; i <= str1.length; i++) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[j]![i] = Math.min(
                matrix[j]![i - 1]! + 1,     // deletion
                matrix[j - 1]![i]! + 1,     // insertion
                matrix[j - 1]![i - 1]! + indicator // substitution
            );
        }
    }
    
    return matrix[str2.length]![str1.length]!;
}

/**
 * Trouve des segments similaires dans le cache (optionnel, pour éviter les quasi-doublons)
 */
export async function findSimilarAudioSegments(
    text: string,
    voiceId: string,
    voiceStyle: string,
    similarityThreshold: number = 0.9
): Promise<SelectAudioSegmentsCache[]> {
    try {
        // Récupérer tous les segments avec les mêmes paramètres de voix
        const segments = await db
            .select()
            .from(audioSegmentsCache)
            .where(
                and(
                    eq(audioSegmentsCache.voiceId, voiceId),
                    eq(audioSegmentsCache.voiceStyle, voiceStyle)
                )
            );
            
        // Filtrer par similarité de texte
        return segments.filter(segment => 
            calculateTextSimilarity(text, segment.textContent) >= similarityThreshold
        );
    } catch (error) {
        console.error('❌ Error finding similar audio segments:', error);
        return [];
    }
}

/**
 * Recherche intelligente combinant hash exact et similarité sémantique
 */
export async function findBestCachedSegment(
    text: string,
    voiceId: string,
    voiceStyle: string,
    options: {
        useSemanticSearch?: boolean;
        semanticThreshold?: number;
        language?: string;
    } = {}
): Promise<{ 
    exact: SelectAudioSegmentsCache | null; 
    similar: SimilaritySearchResult[];
    recommendation: 'use_exact' | 'use_similar' | 'create_new';
}> {
    const {
        useSemanticSearch = true,
        semanticThreshold = 0.9,
        language = 'fr-FR'
    } = options;
    
    try {
        // 1. Recherche exacte par hash (plus rapide)
        const exactMatch = await findCachedAudioSegment(text, voiceId, voiceStyle);
        
        if (exactMatch) {
            console.log('🎯 Correspondance exacte trouvée');
            await incrementUsageCount(exactMatch.id);
            return {
                exact: exactMatch,
                similar: [],
                recommendation: 'use_exact'
            };
        }
        
        // 2. Recherche sémantique si activée
        let similarResults: SimilaritySearchResult[] = [];
        if (useSemanticSearch) {
            console.log('🧠 Recherche sémantique...');
            similarResults = await findSimilarSegmentsByEmbedding(
                text, 
                voiceId, 
                voiceStyle, 
                { 
                    threshold: semanticThreshold,
                    language: language,
                    limit: 3
                }
            );
        }
        
        // 3. Décision sur la recommandation
        let recommendation: 'use_exact' | 'use_similar' | 'create_new' = 'create_new';
        
        if (similarResults.length > 0) {
            const bestMatch = similarResults[0];
            if (bestMatch && bestMatch.similarity >= semanticThreshold) {
                console.log(`🎯 Segment similaire trouvé (${(bestMatch.similarity * 100).toFixed(1)}% de similarité)`);
                await incrementUsageCount(bestMatch.segment.id);
                recommendation = 'use_similar';
            }
        }
        
        return {
            exact: null,
            similar: similarResults,
            recommendation
        };
        
    } catch (error) {
        console.error('❌ Erreur recherche intelligente:', error);
        return {
            exact: null,
            similar: [],
            recommendation: 'create_new'
        };
    }
}

/**
 * Statistiques du cache
 */
export async function getCacheStats() {
    try {
        const stats = await db
            .select({
                totalSegments: sql<number>`count(*)`,
                totalUsage: sql<number>`sum(usage_count)`,
                avgUsage: sql<number>`avg(usage_count)`,
                totalDuration: sql<number>`sum(audio_duration)`,
                totalSize: sql<number>`sum(file_size)`,
            })
            .from(audioSegmentsCache);
            
        return stats?.[0] || null;
    } catch (error) {
        console.error('❌ Error getting cache stats:', error);
        return null;
    }
} 