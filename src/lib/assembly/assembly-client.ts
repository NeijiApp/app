import type {
    AssemblyRequest,
    AssemblyResult,
    AssemblyProgress,
    AssemblyConfig,
    HealthResponse,
    AssemblyStats,
    AssemblyClientConfig
} from './assembly-types';
import { AssemblyError } from './assembly-types';

/**
 * Client pour le service d'assemblage audio externe
 */
export class AssemblyClient {
    private config: AssemblyClientConfig;
    private cache: Map<string, AssemblyResult> = new Map();
    
    constructor(config: AssemblyClientConfig) {
        this.config = config;
        this.validateConfig();
    }
    
    /**
     * Valide la configuration du client
     */
    private validateConfig(): void {
        if (!this.config.serviceUrl) {
            throw new Error('Assembly service URL is required');
        }
        if (!this.config.apiKey) {
            throw new Error('Assembly API key is required');
        }
        if (this.config.timeout <= 0) {
            throw new Error('Timeout must be positive');
        }
    }
    
    /**
     * Génère une clé de cache pour une requête
     */
    private generateCacheKey(request: AssemblyRequest): string {
        const segmentsHash = request.segments
            .map(s => `${s.audioUrl}:${s.duration}:${s.silenceAfter || 0}`)
            .join('|');
        const optionsHash = JSON.stringify(request.options);
        return `${segmentsHash}:${optionsHash}`;
    }
    
    /**
     * Vérifie si le service est en ligne
     */
    async healthCheck(): Promise<HealthResponse> {
        try {
            const response = await this.makeRequest('/health', 'GET');
            return response as HealthResponse;
        } catch (error) {
            throw new AssemblyError(
                'Health check failed',
                'health-check',
                'failed',
                error as Error
            );
        }
    }
    
    /**
     * Obtient les statistiques du service
     */
    async getStats(): Promise<AssemblyStats> {
        try {
            const response = await this.makeRequest('/stats', 'GET');
            return response as AssemblyStats;
        } catch (error) {
            throw new AssemblyError(
                'Failed to get stats',
                'stats',
                'failed',
                error as Error
            );
        }
    }
    
    /**
     * Lance l'assemblage audio
     */
    async assembleAudio(request: AssemblyRequest): Promise<AssemblyResult> {
        const startTime = Date.now();
        
        try {
            this.log('info', `Starting assembly for request ${request.requestId}`);
            
            // Vérifier le cache si activé
            if (this.config.enableCache) {
                const cacheKey = this.generateCacheKey(request);
                const cached = this.cache.get(cacheKey);
                if (cached) {
                    this.log('info', `Cache hit for request ${request.requestId}`);
                    return cached;
                }
            }
            
            // Valider la requête
            this.validateRequest(request);
            
            // Envoyer la requête d'assemblage
            const result = await this.makeRequestWithRetries(
                '/assembly',
                'POST',
                request
            ) as AssemblyResult;
            
            // Mettre en cache si succès
            if (this.config.enableCache && result.status === 'completed') {
                const cacheKey = this.generateCacheKey(request);
                this.cache.set(cacheKey, result);
            }
            
            const processingTime = Date.now() - startTime;
            this.log('info', `Assembly completed in ${processingTime}ms for request ${request.requestId}`);
            
            return result;
            
        } catch (error) {
            const processingTime = Date.now() - startTime;
            this.log('error', `Assembly failed after ${processingTime}ms for request ${request.requestId}: ${error}`);
            
            if (error instanceof AssemblyError) {
                throw error;
            }
            
            throw new AssemblyError(
                `Assembly failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                request.requestId,
                'failed',
                error as Error
            );
        }
    }
    
    /**
     * Obtient le statut d'assemblage
     */
    async getAssemblyStatus(requestId: string): Promise<AssemblyProgress> {
        try {
            const response = await this.makeRequest(`/assembly/${requestId}/status`, 'GET');
            return response as AssemblyProgress;
        } catch (error) {
            throw new AssemblyError(
                'Failed to get assembly status',
                requestId,
                'failed',
                error as Error
            );
        }
    }
    
    /**
     * Annule un assemblage en cours
     */
    async cancelAssembly(requestId: string): Promise<void> {
        try {
            await this.makeRequest(`/assembly/${requestId}/cancel`, 'POST');
            this.log('info', `Assembly cancelled for request ${requestId}`);
        } catch (error) {
            throw new AssemblyError(
                'Failed to cancel assembly',
                requestId,
                'failed',
                error as Error
            );
        }
    }
    
    /**
     * Valide une requête d'assemblage
     */
    private validateRequest(request: AssemblyRequest): void {
        if (!request.requestId) {
            throw new Error('Request ID is required');
        }
        
        if (!request.segments || request.segments.length === 0) {
            throw new Error('At least one segment is required');
        }
        
        for (const segment of request.segments) {
            if (!segment.audioUrl) {
                throw new Error(`Segment ${segment.id} is missing audio URL`);
            }
            if (segment.duration <= 0) {
                throw new Error(`Segment ${segment.id} has invalid duration`);
            }
        }
        
        if (!request.options) {
            throw new Error('Assembly options are required');
        }
    }
    
    /**
     * Effectue une requête HTTP avec retry
     */
    private async makeRequestWithRetries(
        endpoint: string,
        method: 'GET' | 'POST' | 'PUT' | 'DELETE',
        body?: any
    ): Promise<any> {
        let lastError: Error;
        
        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                return await this.makeRequest(endpoint, method, body);
            } catch (error) {
                lastError = error as Error;
                
                if (attempt === this.config.maxRetries) {
                    break;
                }
                
                this.log('warn', `Request attempt ${attempt} failed, retrying in ${this.config.retryDelay}ms: ${error}`);
                await this.delay(this.config.retryDelay);
            }
        }
        
        throw lastError!;
    }
    
    /**
     * Effectue une requête HTTP
     */
    private async makeRequest(
        endpoint: string,
        method: 'GET' | 'POST' | 'PUT' | 'DELETE',
        body?: any
    ): Promise<any> {
        const url = `${this.config.serviceUrl}${endpoint}`;
        
        const headers: Record<string, string> = {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Neiji-Assembly-Client/1.0'
        };
        
        const requestOptions: RequestInit = {
            method,
            headers,
            signal: AbortSignal.timeout(this.config.timeout)
        };
        
        if (body && (method === 'POST' || method === 'PUT')) {
            requestOptions.body = JSON.stringify(body);
        }
        
        this.log('debug', `${method} ${url}`);
        
        const response = await fetch(url, requestOptions);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
            return await response.json();
        }
        
        return await response.text();
    }
    
    /**
     * Utilitaire de délai
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Log avec niveau
     */
    private log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void {
        const levels = { debug: 0, info: 1, warn: 2, error: 3 };
        const configLevel = levels[this.config.logLevel || 'info'];
        const messageLevel = levels[level];
        
        if (messageLevel >= configLevel) {
            const timestamp = new Date().toISOString();
            console[level](`[${timestamp}] [AssemblyClient] ${message}`);
        }
    }
    
    /**
     * Nettoie le cache
     */
    clearCache(): void {
        this.cache.clear();
        this.log('info', 'Assembly cache cleared');
    }
    
    /**
     * Obtient la taille du cache
     */
    getCacheSize(): number {
        return this.cache.size;
    }
    
    /**
     * Met à jour la configuration
     */
    updateConfig(newConfig: Partial<AssemblyClientConfig>): void {
        this.config = { ...this.config, ...newConfig };
        this.validateConfig();
        this.log('info', 'Assembly client configuration updated');
    }
}

/**
 * Instance singleton du client assembly
 */
let assemblyClientInstance: AssemblyClient | null = null;

/**
 * Crée ou retourne l'instance du client assembly
 */
export function getAssemblyClient(config?: AssemblyClientConfig): AssemblyClient {
    if (!assemblyClientInstance && config) {
        assemblyClientInstance = new AssemblyClient(config);
    }
    
    if (!assemblyClientInstance) {
        throw new Error('Assembly client not initialized. Please provide configuration.');
    }
    
    return assemblyClientInstance;
}

/**
 * Configuration par défaut pour le client assembly
 */
export const defaultAssemblyConfig: Partial<AssemblyClientConfig> = {
    timeout: 60000,        // 60 secondes
    maxRetries: 3,
    retryDelay: 1000,      // 1 seconde
    maxFileSize: 50 * 1024 * 1024, // 50 MB
    enableRetries: true,
    enableCache: true,
    enableMetrics: true,
    logLevel: 'info'
};

/**
 * Crée une configuration complète avec les valeurs par défaut
 */
export function createAssemblyConfig(
    serviceUrl: string,
    apiKey: string,
    overrides?: Partial<AssemblyClientConfig>
): AssemblyClientConfig {
    return {
        serviceUrl,
        apiKey,
        ...defaultAssemblyConfig,
        ...overrides
    } as AssemblyClientConfig;
}

export default AssemblyClient; 