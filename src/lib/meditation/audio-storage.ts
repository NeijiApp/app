import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration for audio storage');
}

// Client Supabase avec clé de service pour les opérations backend
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const AUDIO_BUCKET = 'audio-segments';

/**
 * Initialise le bucket audio s'il n'existe pas
 */
export async function initializeAudioBucket(): Promise<void> {
    try {
        // Vérifier si le bucket existe
        const { data: buckets } = await supabase.storage.listBuckets();
        const audioBucket = buckets?.find(bucket => bucket.name === AUDIO_BUCKET);
        
        if (!audioBucket) {
            console.log('🪣 Creating audio bucket...');
            const { error } = await supabase.storage.createBucket(AUDIO_BUCKET, {
                public: true,
                allowedMimeTypes: ['audio/mpeg', 'audio/mp3'],
                fileSizeLimit: 50 * 1024 * 1024, // 50MB
            });
            
            if (error) {
                console.error('❌ Error creating audio bucket:', error);
                throw error;
            }
            
            console.log('✅ Audio bucket created successfully');
        } else {
            console.log('✅ Audio bucket already exists');
        }
    } catch (error) {
        console.error('❌ Error initializing audio bucket:', error);
        throw error;
    }
}

/**
 * Sauvegarde un stream audio dans Supabase Storage
 */
export async function saveAudioToStorage(
    audioStream: ReadableStream<Uint8Array>,
    voiceId: string,
    textHash: string
): Promise<string> {
    try {
        // Générer un nom de fichier unique
        const fileName = `${voiceId}/${textHash}-${uuidv4()}.mp3`;
        
        console.log(`📤 Uploading audio to Storage: ${fileName}`);
        
        // Convertir le stream en buffer
        const audioBuffer = await streamToBuffer(audioStream);
        
        // Uploader le fichier
        const { data, error } = await supabase.storage
            .from(AUDIO_BUCKET)
            .upload(fileName, audioBuffer, {
                contentType: 'audio/mpeg',
                cacheControl: '3600', // 1 heure de cache
            });
        
        if (error) {
            console.error('❌ Error uploading audio:', error);
            throw error;
        }
        
        // Obtenir l'URL publique
        const { data: publicUrl } = supabase.storage
            .from(AUDIO_BUCKET)
            .getPublicUrl(fileName);
        
        console.log(`✅ Audio uploaded successfully: ${publicUrl.publicUrl}`);
        return publicUrl.publicUrl;
        
    } catch (error) {
        console.error('❌ Error saving audio to storage:', error);
        throw error;
    }
}

/**
 * Supprime un fichier audio du Storage
 */
export async function deleteAudioFromStorage(audioUrl: string): Promise<void> {
    try {
        // Extraire le nom du fichier depuis l'URL
        const fileName = extractFileNameFromUrl(audioUrl);
        
        if (!fileName) {
            console.warn('⚠️ Cannot extract filename from URL:', audioUrl);
            return;
        }
        
        const { error } = await supabase.storage
            .from(AUDIO_BUCKET)
            .remove([fileName]);
        
        if (error) {
            console.error('❌ Error deleting audio:', error);
            throw error;
        }
        
        console.log(`🗑️ Audio deleted successfully: ${fileName}`);
        
    } catch (error) {
        console.error('❌ Error deleting audio from storage:', error);
        throw error;
    }
}

/**
 * Nettoie les fichiers audio anciens (plus de 30 jours et peu utilisés)
 */
export async function cleanupOldAudioFiles(): Promise<void> {
    try {
        console.log('🧹 Starting audio cleanup...');
        
        // Lister tous les fichiers
        const { data: files, error } = await supabase.storage
            .from(AUDIO_BUCKET)
            .list('', {
                limit: 1000,
                sortBy: { column: 'created_at', order: 'asc' }
            });
        
        if (error) {
            console.error('❌ Error listing files for cleanup:', error);
            return;
        }
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const filesToDelete: string[] = [];
        
        files?.forEach(file => {
            const fileDate = new Date(file.created_at);
            if (fileDate < thirtyDaysAgo) {
                filesToDelete.push(file.name);
            }
        });
        
        if (filesToDelete.length > 0) {
            console.log(`🗑️ Deleting ${filesToDelete.length} old files...`);
            
            const { error: deleteError } = await supabase.storage
                .from(AUDIO_BUCKET)
                .remove(filesToDelete);
            
            if (deleteError) {
                console.error('❌ Error during cleanup:', deleteError);
            } else {
                console.log(`✅ Cleanup completed: ${filesToDelete.length} files deleted`);
            }
        } else {
            console.log('✅ No old files to clean up');
        }
        
    } catch (error) {
        console.error('❌ Error during audio cleanup:', error);
    }
}

/**
 * Obtient les statistiques du Storage
 */
export async function getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    bucketInfo: any;
}> {
    try {
        // Lister tous les fichiers pour compter
        const { data: files, error } = await supabase.storage
            .from(AUDIO_BUCKET)
            .list('', { limit: 1000 });
        
        if (error) {
            console.error('❌ Error getting storage stats:', error);
            throw error;
        }
        
        const totalFiles = files?.length || 0;
        const totalSize = files?.reduce((sum, file) => sum + (file.metadata?.size || 0), 0) || 0;
        
        // Info du bucket
        const { data: buckets } = await supabase.storage.listBuckets();
        const bucketInfo = buckets?.find(bucket => bucket.name === AUDIO_BUCKET);
        
        return {
            totalFiles,
            totalSize,
            bucketInfo
        };
        
    } catch (error) {
        console.error('❌ Error getting storage stats:', error);
        throw error;
    }
}

// === FONCTIONS UTILITAIRES ===

/**
 * Convertit un ReadableStream en Buffer
 */
async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }
        
        return Buffer.concat(chunks);
    } finally {
        reader.releaseLock();
    }
}

/**
 * Extrait le nom de fichier depuis une URL Supabase Storage
 */
function extractFileNameFromUrl(url: string): string | null {
    try {
        const urlParts = url.split('/storage/v1/object/public/' + AUDIO_BUCKET + '/');
        return urlParts[1] || null;
    } catch {
        return null;
    }
}

/**
 * Vérifie si une URL pointe vers notre Storage
 */
export function isStorageUrl(url: string): boolean {
    return url.includes(`/storage/v1/object/public/${AUDIO_BUCKET}/`);
} 