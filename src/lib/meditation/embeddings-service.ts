import { openai } from '~/utils/openai';
import { db } from '~/server/db';
import { audioSegmentsCache } from '~/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import type { SelectAudioSegmentsCache } from '~/server/db/schema';

/**
 * Configuration du service d'embeddings
 */
const EMBEDDINGS_CONFIG = {
    model: 'text-embedding-3-small', // Modèle OpenAI recommandé (1536 dimensions)
    maxTokens: 8191, // Limite de tokens pour text-embedding-3-small
    batchSize: 100, // Nombre max d'embeddings à traiter en parallèle
    similarityThreshold: 0.85, // Seuil de similarité par défaut
} as const;

/**
 * Type pour un embedding OpenAI
 */
export type EmbeddingVector = number[];

/**
 * Résultat d'une recherche de similarité
 */
export interface SimilaritySearchResult {
    segment: SelectAudioSegmentsCache;
    similarity: number;
    distance: number;
}

/**
 * Génère un embedding OpenAI pour un texte donné
 */
export async function generateEmbedding(text: string): Promise<EmbeddingVector> {
    try {
        console.log(`🔍 Génération embedding pour: "${text.substring(0, 50)}..."`);
        
        // Nettoyer et préparer le texte
        const cleanText = text.trim().replace(/\s+/g, ' ');
        
        if (!cleanText) {
            throw new Error('Le texte ne peut pas être vide');
        }
        
        // Générer l'embedding avec OpenAI
        const response = await openai.embeddings.create({
            model: EMBEDDINGS_CONFIG.model,
            input: cleanText,
            encoding_format: 'float',
        });
        
        const embedding = response.data[0]?.embedding;
        if (!embedding) {
            throw new Error('Aucun embedding retourné par OpenAI');
        }
        
        console.log(`✅ Embedding généré: ${embedding.length} dimensions`);
        return embedding;
        
    } catch (error) {
        console.error('❌ Erreur lors de la génération d\'embedding:', error);
        throw new Error(`Échec génération embedding: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
}

/**
 * Génère plusieurs embeddings en batch (plus efficace)
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<EmbeddingVector[]> {
    try {
        if (texts.length === 0) return [];
        
        console.log(`🔍 Génération batch de ${texts.length} embeddings...`);
        
        // Nettoyer tous les textes
        const cleanTexts = texts.map(text => text.trim().replace(/\s+/g, ' ')).filter(Boolean);
        
        if (cleanTexts.length === 0) {
            throw new Error('Aucun texte valide à traiter');
        }
        
        // Générer les embeddings en batch
        const response = await openai.embeddings.create({
            model: EMBEDDINGS_CONFIG.model,
            input: cleanTexts,
            encoding_format: 'float',
        });
        
        const embeddings = response.data.map(item => item.embedding);
        console.log(`✅ Batch terminé: ${embeddings.length} embeddings générés`);
        
        return embeddings;
        
    } catch (error) {
        console.error('❌ Erreur lors de la génération batch:', error);
        throw new Error(`Échec génération batch: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
}

/**
 * Calcule la similarité cosine entre deux vecteurs
 */
export function calculateCosineSimilarity(vectorA: EmbeddingVector, vectorB: EmbeddingVector): number {
    if (vectorA.length !== vectorB.length) {
        throw new Error('Les vecteurs doivent avoir la même dimension');
    }
    
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
    
    if (normA === 0 || normB === 0) {
        return 0; // Éviter la division par zéro
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Sauvegarde un embedding dans la base de données
 */
export async function saveEmbeddingToDatabase(
    segmentId: number,
    embedding: EmbeddingVector,
    language: string = 'fr-FR'
): Promise<void> {
    try {
        // Convertir l'embedding en JSON string pour stockage
        const embeddingJson = JSON.stringify(embedding);
        
        await db
            .update(audioSegmentsCache)
            .set({
                embedding: embeddingJson,
                language: language,
            })
            .where(eq(audioSegmentsCache.id, segmentId));
            
        console.log(`💾 Embedding sauvegardé pour le segment ${segmentId}`);
        
    } catch (error) {
        console.error('❌ Erreur sauvegarde embedding:', error);
        throw new Error(`Échec sauvegarde: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
}

/**
 * Récupère un embedding depuis la base de données
 */
export async function getEmbeddingFromDatabase(segmentId: number): Promise<EmbeddingVector | null> {
    try {
        const segment = await db
            .select({ embedding: audioSegmentsCache.embedding })
            .from(audioSegmentsCache)
            .where(eq(audioSegmentsCache.id, segmentId))
            .limit(1);
            
        const embeddingJson = segment[0]?.embedding;
        if (!embeddingJson) {
            return null;
        }
        
        return JSON.parse(embeddingJson) as EmbeddingVector;
        
    } catch (error) {
        console.error('❌ Erreur récupération embedding:', error);
        return null;
    }
}

/**
 * Recherche les segments les plus similaires par embedding
 */
export async function findSimilarSegmentsByEmbedding(
    queryText: string,
    voiceId: string,
    voiceStyle: string,
    options: {
        limit?: number;
        threshold?: number;
        language?: string;
    } = {}
): Promise<SimilaritySearchResult[]> {
    const {
        limit = 5,
        threshold = EMBEDDINGS_CONFIG.similarityThreshold,
        language = 'fr-FR'
    } = options;
    
    try {
        console.log(`🔍 Recherche sémantique pour: "${queryText.substring(0, 50)}..."`);
        
        // 1. Générer l'embedding de la requête
        const queryEmbedding = await generateEmbedding(queryText);
        
        // 2. Récupérer tous les segments avec embeddings pour cette voix/style
        const segments = await db
            .select()
            .from(audioSegmentsCache)
            .where(
                and(
                    eq(audioSegmentsCache.voiceId, voiceId),
                    eq(audioSegmentsCache.voiceStyle, voiceStyle),
                    eq(audioSegmentsCache.language, language),
                    sql`${audioSegmentsCache.embedding} IS NOT NULL`
                )
            );
            
        if (segments.length === 0) {
            console.log('📭 Aucun segment avec embedding trouvé');
            return [];
        }
        
        // 3. Calculer les similarités
        const results: SimilaritySearchResult[] = [];
        
        for (const segment of segments) {
            if (!segment.embedding) continue;
            
            try {
                const segmentEmbedding = JSON.parse(segment.embedding) as EmbeddingVector;
                const similarity = calculateCosineSimilarity(queryEmbedding, segmentEmbedding);
                const distance = 1 - similarity; // Distance = 1 - similarité
                
                if (similarity >= threshold) {
                    results.push({
                        segment,
                        similarity,
                        distance
                    });
                }
            } catch (error) {
                console.warn(`⚠️ Embedding invalide pour segment ${segment.id}:`, error);
                continue;
            }
        }
        
        // 4. Trier par similarité décroissante et limiter
        const sortedResults = results
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);
            
        console.log(`✅ Trouvé ${sortedResults.length} segments similaires (seuil: ${threshold})`);
        
        return sortedResults;
        
    } catch (error) {
        console.error('❌ Erreur recherche sémantique:', error);
        return [];
    }
}

/**
 * Met à jour tous les embeddings manquants dans la base
 */
export async function updateMissingEmbeddings(
    options: {
        batchSize?: number;
        language?: string;
        forceUpdate?: boolean;
    } = {}
): Promise<{ processed: number; errors: number }> {
    const {
        batchSize = EMBEDDINGS_CONFIG.batchSize,
        language = 'fr-FR',
        forceUpdate = false
    } = options;
    
    try {
        console.log('🔄 Mise à jour des embeddings manquants...');
        
        // Récupérer les segments sans embedding (ou tous si forceUpdate)
        const whereCondition = forceUpdate 
            ? eq(audioSegmentsCache.language, language)
            : and(
                eq(audioSegmentsCache.language, language),
                sql`${audioSegmentsCache.embedding} IS NULL`
            );
            
        const segmentsToProcess = await db
            .select({
                id: audioSegmentsCache.id,
                textContent: audioSegmentsCache.textContent,
            })
            .from(audioSegmentsCache)
            .where(whereCondition);
            
        if (segmentsToProcess.length === 0) {
            console.log('✅ Tous les embeddings sont à jour');
            return { processed: 0, errors: 0 };
        }
        
        console.log(`📊 ${segmentsToProcess.length} segments à traiter`);
        
        let processed = 0;
        let errors = 0;
        
        // Traiter par batch
        for (let i = 0; i < segmentsToProcess.length; i += batchSize) {
            const batch = segmentsToProcess.slice(i, i + batchSize);
            const texts = batch.map(s => s.textContent);
            const ids = batch.map(s => s.id);
            
            try {
                console.log(`🔄 Traitement batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(segmentsToProcess.length / batchSize)}`);
                
                const embeddings = await generateEmbeddingsBatch(texts);
                
                // Sauvegarder chaque embedding
                for (let j = 0; j < embeddings.length; j++) {
                    const embedding = embeddings[j];
                    const segmentId = ids[j];
                    
                    if (embedding && segmentId) {
                        await saveEmbeddingToDatabase(segmentId, embedding, language);
                        processed++;
                    }
                }
                
                // Pause entre les batches pour éviter les rate limits
                if (i + batchSize < segmentsToProcess.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
            } catch (error) {
                console.error(`❌ Erreur batch ${Math.floor(i / batchSize) + 1}:`, error);
                errors += batch.length;
            }
        }
        
        console.log(`✅ Mise à jour terminée: ${processed} traités, ${errors} erreurs`);
        return { processed, errors };
        
    } catch (error) {
        console.error('❌ Erreur mise à jour globale:', error);
        throw error;
    }
}

/**
 * Statistiques des embeddings
 */
export async function getEmbeddingsStats() {
    try {
        const stats = await db
            .select({
                totalSegments: sql<number>`count(*)`,
                withEmbeddings: sql<number>`count(*) filter (where embedding is not null)`,
                withoutEmbeddings: sql<number>`count(*) filter (where embedding is null)`,
                languages: sql<string[]>`array_agg(distinct language)`,
            })
            .from(audioSegmentsCache);
            
        const result = stats[0];
        if (!result) return null;
        
        return {
            totalSegments: result.totalSegments,
            withEmbeddings: result.withEmbeddings,
            withoutEmbeddings: result.withoutEmbeddings,
            coverage: result.totalSegments > 0 ? (result.withEmbeddings / result.totalSegments) * 100 : 0,
            languages: result.languages?.filter(Boolean) || [],
        };
        
    } catch (error) {
        console.error('❌ Erreur statistiques embeddings:', error);
        return null;
    }
} 