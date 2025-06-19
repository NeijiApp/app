/**
 * Types pour le service d'assemblage audio FFmpeg
 */

/**
 * Segment audio à assembler
 */
export interface AudioSegment {
    id: string;
    audioUrl: string;
    duration: number;        // en secondes
    silenceAfter?: number;   // silence après ce segment (en secondes)
    volume?: number;         // volume relatif (0.0 - 1.0)
    fadeIn?: number;         // fade in duration (en ms)
    fadeOut?: number;        // fade out duration (en ms)
}

/**
 * Options d'assemblage
 */
export interface AssemblyOptions {
    format: 'mp3' | 'wav' | 'ogg';
    quality: '128k' | '192k' | '256k' | '320k';
    normalize: boolean;
    fadeTransitions: boolean;
    removeArtifacts: boolean;
    addMetadata?: {
        title?: string;
        artist?: string;
        album?: string;
        duration?: number;
    };
}

/**
 * Requête d'assemblage
 */
export interface AssemblyRequest {
    requestId: string;
    segments: AudioSegment[];
    options: AssemblyOptions;
    userId?: number;
    priority?: 'low' | 'normal' | 'high';
}

/**
 * Statut d'assemblage
 */
export type AssemblyStatus = 
    | 'pending'
    | 'downloading'
    | 'processing'
    | 'assembling'
    | 'optimizing'
    | 'uploading'
    | 'completed'
    | 'failed';

/**
 * Progression d'assemblage
 */
export interface AssemblyProgress {
    requestId: string;
    status: AssemblyStatus;
    progress: number;        // 0-100
    currentStep: string;
    estimatedTimeRemaining?: number; // en secondes
    error?: string;
}

/**
 * Résultat d'assemblage
 */
export interface AssemblyResult {
    requestId: string;
    status: 'completed' | 'failed';
    audioUrl?: string;
    duration?: number;
    fileSize?: number;
    format: string;
    quality: string;
    metadata?: {
        title: string;
        duration: number;
        bitrate: string;
        sampleRate: number;
        channels: number;
    };
    processingTime: number;  // en ms
    error?: string;
}

/**
 * Configuration du service assembly
 */
export interface AssemblyConfig {
    serviceUrl: string;
    apiKey: string;
    timeout: number;         // en ms
    maxRetries: number;
    retryDelay: number;      // en ms
    maxFileSize: number;     // en bytes
}

/**
 * Métriques d'assemblage
 */
export interface AssemblyMetrics {
    requestId: string;
    startTime: Date;
    endTime?: Date;
    duration: number;        // en ms
    segmentsCount: number;
    totalInputSize: number;  // en bytes
    outputSize: number;      // en bytes
    compressionRatio: number;
    success: boolean;
    error?: string;
    ffmpegLogs?: string[];
}

/**
 * Erreurs d'assemblage
 */
export class AssemblyError extends Error {
    constructor(
        message: string,
        public requestId: string,
        public status: AssemblyStatus,
        public originalError?: Error
    ) {
        super(message);
        this.name = 'AssemblyError';
    }
}

/**
 * Réponse du service de santé
 */
export interface HealthResponse {
    status: 'healthy' | 'unhealthy';
    version: string;
    uptime: number;          // en secondes
    ffmpegVersion?: string;
    activeJobs: number;
    queueSize: number;
    systemResources: {
        cpuUsage: number;    // pourcentage
        memoryUsage: number; // pourcentage
        diskSpace: number;   // pourcentage libre
    };
}

/**
 * Statistiques du service
 */
export interface AssemblyStats {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageProcessingTime: number; // en ms
    totalProcessingTime: number;   // en ms
    peakConcurrentJobs: number;
    totalDataProcessed: number;    // en bytes
    uptime: number;                // en secondes
    lastRestartTime: Date;
}

/**
 * Configuration FFmpeg
 */
export interface FFmpegConfig {
    path: string;
    timeout: number;
    tempDir: string;
    maxConcurrentJobs: number;
    audioCodec: string;
    audioFilters: string[];
    outputOptions: string[];
}

/**
 * Paramètres de qualité audio
 */
export interface AudioQualityParams {
    bitrate: string;
    sampleRate: number;
    channels: number;
    codec: string;
    normalize: boolean;
    compressor?: {
        threshold: number;
        ratio: number;
        attack: number;
        release: number;
    };
}

/**
 * Cache d'assemblage
 */
export interface AssemblyCache {
    key: string;
    segments: AudioSegment[];
    options: AssemblyOptions;
    result: AssemblyResult;
    createdAt: Date;
    accessCount: number;
    lastAccessed: Date;
}

/**
 * Utilitaires de type
 */
export type AssemblyEventType = 
    | 'assembly.started'
    | 'assembly.progress'
    | 'assembly.completed'
    | 'assembly.failed'
    | 'assembly.timeout';

export interface AssemblyEvent {
    type: AssemblyEventType;
    requestId: string;
    timestamp: Date;
    data: AssemblyProgress | AssemblyResult | AssemblyError;
}

/**
 * Configuration du client assembly
 */
export interface AssemblyClientConfig extends AssemblyConfig {
    enableRetries: boolean;
    enableCache: boolean;
    enableMetrics: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// Les types sont déjà exportés individuellement ci-dessus 