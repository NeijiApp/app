import type { 
    AudioSegment, 
    AssemblyOptions, 
    AssemblyRequest,
    AudioQualityParams 
} from './assembly-types';
import type { SegmentPlan } from '../meditation/ai-agent';

/**
 * Convertit les segments de l'Agent IA en segments d'assemblage
 */
export function convertSegmentsForAssembly(
    segments: SegmentPlan[],
    audioUrls: string[],
    options?: Partial<AssemblyOptions>
): AudioSegment[] {
    if (segments.length !== audioUrls.length) {
        throw new Error('Mismatch between segments count and audio URLs count');
    }
    
    return segments.map((segment, index) => ({
        id: segment.id,
        audioUrl: audioUrls[index]!,
        duration: segment.duration,
        silenceAfter: calculateSilenceAfter(segment, index, segments.length),
        volume: 1.0,
        fadeIn: index === 0 ? 500 : 200,  // Premier segment : fade in plus long
        fadeOut: index === segments.length - 1 ? 1000 : 200  // Dernier segment : fade out plus long
    }));
}

/**
 * Calcule le silence nécessaire après un segment
 */
function calculateSilenceAfter(
    segment: SegmentPlan, 
    index: number, 
    totalSegments: number
): number {
    // Pas de silence après le dernier segment
    if (index === totalSegments - 1) {
        return 0;
    }
    
    // Silence basé sur le type de segment
    const silenceMap: Record<string, number> = {
        'intro': 2,           // 2 secondes après l'intro
        'breathing': 5,       // 5 secondes après exercices de respiration
        'body_scan': 3,       // 3 secondes après scan corporel
        'visualization': 4,   // 4 secondes après visualisation
        'conclusion': 0       // Pas de silence après conclusion
    };
    
    return silenceMap[segment.type] || 3; // 3 secondes par défaut
}

/**
 * Crée les options d'assemblage par défaut
 */
export function createDefaultAssemblyOptions(
    quality: 'standard' | 'high' | 'premium' = 'high'
): AssemblyOptions {
    const qualitySettings = {
        standard: { format: 'mp3' as const, quality: '192k' as const },
        high: { format: 'mp3' as const, quality: '256k' as const },
        premium: { format: 'mp3' as const, quality: '320k' as const }
    };
    
    const settings = qualitySettings[quality];
    
    return {
        format: settings.format,
        quality: settings.quality,
        normalize: true,
        fadeTransitions: true,
        removeArtifacts: true,
        addMetadata: {
            artist: 'Neiji',
            album: 'Méditations Personnalisées'
        }
    };
}

/**
 * Génère un ID unique pour une requête d'assemblage
 */
export function generateAssemblyRequestId(
    userId?: number,
    goal?: string,
    duration?: number
): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const userPart = userId ? `u${userId}` : 'anon';
    const goalPart = goal ? `g${goal.substring(0, 3)}` : '';
    const durationPart = duration ? `d${duration}m` : '';
    
    return `${userPart}${goalPart}${durationPart}_${timestamp}_${random}`;
}

/**
 * Crée une requête d'assemblage complète
 */
export function createAssemblyRequest(
    segments: SegmentPlan[],
    audioUrls: string[],
    options?: {
        userId?: number;
        goal?: string;
        duration?: number;
        quality?: 'standard' | 'high' | 'premium';
        title?: string;
        priority?: 'low' | 'normal' | 'high';
    }
): AssemblyRequest {
    const requestId = generateAssemblyRequestId(
        options?.userId,
        options?.goal,
        options?.duration
    );
    
    const audioSegments = convertSegmentsForAssembly(segments, audioUrls);
    const assemblyOptions = createDefaultAssemblyOptions(options?.quality);
    
    // Ajouter le titre si fourni
    if (options?.title) {
        assemblyOptions.addMetadata = {
            ...assemblyOptions.addMetadata,
            title: options.title
        };
    }
    
    return {
        requestId,
        segments: audioSegments,
        options: assemblyOptions,
        userId: options?.userId,
        priority: options?.priority || 'normal'
    };
}

/**
 * Calcule la durée totale d'une méditation assemblée
 */
export function calculateTotalDuration(segments: AudioSegment[]): number {
    return segments.reduce((total, segment) => {
        return total + segment.duration + (segment.silenceAfter || 0);
    }, 0);
}

/**
 * Estime la taille du fichier final
 */
export function estimateFileSize(
    durationSeconds: number,
    quality: string
): number {
    // Estimation basée sur les bitrates MP3
    const bitrateMap: Record<string, number> = {
        '128k': 128,
        '192k': 192,
        '256k': 256,
        '320k': 320
    };
    
    const bitrate = bitrateMap[quality] || 256;
    const bytesPerSecond = (bitrate * 1000) / 8; // Conversion kbps vers bytes/sec
    
    return Math.round(durationSeconds * bytesPerSecond);
}

/**
 * Valide la compatibilité des segments audio
 */
export function validateSegmentsCompatibility(segments: AudioSegment[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
} {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Vérifications de base
    if (segments.length === 0) {
        errors.push('Aucun segment fourni');
        return { isValid: false, errors, warnings };
    }
    
    // Vérifier chaque segment
    segments.forEach((segment, index) => {
        if (!segment.audioUrl) {
            errors.push(`Segment ${index + 1}: URL audio manquante`);
        }
        
        if (segment.duration <= 0) {
            errors.push(`Segment ${index + 1}: Durée invalide (${segment.duration}s)`);
        }
        
        if (segment.duration > 1800) { // 30 minutes max par segment
            warnings.push(`Segment ${index + 1}: Durée très longue (${segment.duration}s)`);
        }
        
        if (segment.volume && (segment.volume < 0 || segment.volume > 1)) {
            errors.push(`Segment ${index + 1}: Volume invalide (${segment.volume})`);
        }
        
        if (segment.silenceAfter && segment.silenceAfter > 60) {
            warnings.push(`Segment ${index + 1}: Silence très long (${segment.silenceAfter}s)`);
        }
    });
    
    // Vérifier la durée totale
    const totalDuration = calculateTotalDuration(segments);
    if (totalDuration > 3600) { // 1 heure max
        warnings.push(`Durée totale très longue: ${Math.round(totalDuration / 60)} minutes`);
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Optimise les segments pour l'assemblage
 */
export function optimizeSegmentsForAssembly(segments: AudioSegment[]): AudioSegment[] {
    return segments.map((segment, index) => {
        const optimized = { ...segment };
        
        // Optimiser les transitions
        if (index > 0) {
            optimized.fadeIn = Math.min(optimized.fadeIn || 200, segment.duration * 0.1 * 1000);
        }
        
        if (index < segments.length - 1) {
            optimized.fadeOut = Math.min(optimized.fadeOut || 200, segment.duration * 0.1 * 1000);
        }
        
        // Optimiser les silences
        if (optimized.silenceAfter && optimized.silenceAfter > 0) {
            // Limiter les silences à 20 secondes max
            optimized.silenceAfter = Math.min(optimized.silenceAfter, 20);
            
            // Réduire les silences pour les segments courts
            if (segment.duration < 30) {
                optimized.silenceAfter = Math.min(optimized.silenceAfter, 3);
            }
        }
        
        return optimized;
    });
}

/**
 * Crée les paramètres de qualité audio
 */
export function createAudioQualityParams(
    format: 'mp3' | 'wav' | 'ogg',
    quality: string
): AudioQualityParams {
    const baseParams: AudioQualityParams = {
        bitrate: quality,
        sampleRate: 44100,
        channels: 2,
        codec: format === 'mp3' ? 'libmp3lame' : format === 'wav' ? 'pcm_s16le' : 'libvorbis',
        normalize: true
    };
    
    // Ajouter compression pour MP3 haute qualité
    if (format === 'mp3' && (quality === '256k' || quality === '320k')) {
        baseParams.compressor = {
            threshold: -12,
            ratio: 3,
            attack: 5,
            release: 50
        };
    }
    
    return baseParams;
}

/**
 * Génère un nom de fichier pour l'assemblage
 */
export function generateAssemblyFilename(
    request: AssemblyRequest,
    includeTimestamp: boolean = true
): string {
    const goal = request.segments[0]?.id.includes('stress') ? 'stress' :
                 request.segments[0]?.id.includes('sleep') ? 'sleep' :
                 request.segments[0]?.id.includes('focus') ? 'focus' : 'meditation';
    
    const duration = Math.round(calculateTotalDuration(request.segments) / 60);
    const timestamp = includeTimestamp ? `_${Date.now()}` : '';
    const extension = request.options.format;
    
    return `neiji_${goal}_${duration}min${timestamp}.${extension}`;
}

/**
 * Crée un résumé de la requête d'assemblage
 */
export function createAssemblySummary(request: AssemblyRequest): {
    segmentsCount: number;
    totalDuration: number;
    estimatedSize: number;
    quality: string;
    format: string;
    hasMetadata: boolean;
} {
    const totalDuration = calculateTotalDuration(request.segments);
    const estimatedSize = estimateFileSize(totalDuration, request.options.quality);
    
    return {
        segmentsCount: request.segments.length,
        totalDuration,
        estimatedSize,
        quality: request.options.quality,
        format: request.options.format,
        hasMetadata: !!request.options.addMetadata
    };
}

/**
 * Utilitaires de conversion
 */
export const assemblyUtils = {
    convertSegmentsForAssembly,
    createDefaultAssemblyOptions,
    generateAssemblyRequestId,
    createAssemblyRequest,
    calculateTotalDuration,
    estimateFileSize,
    validateSegmentsCompatibility,
    optimizeSegmentsForAssembly,
    createAudioQualityParams,
    generateAssemblyFilename,
    createAssemblySummary
};

export default assemblyUtils; 