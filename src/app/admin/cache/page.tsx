"use client";

/**
 * 🎛️ INTERFACE D'ADMINISTRATION DU CACHE SÉMANTIQUE
 * Dashboard pour gérer et optimiser le système de cache
 */

import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";

interface CacheStats {
  totalSegments: number;
  withEmbeddings: number;
  withoutEmbeddings: number;
  coverage: number;
  languages: string[];
}

interface ClusterAnalysis {
  totalSegments: number;
  clustersFound: number;
  duplicatesDetected: Array<{
    cluster: any[];
    avgSimilarity: number;
  }>;
  recommendations: string[];
}

interface OptimizationResult {
  duplicatesFound: number;
  spaceSaved: number;
  itemsRemoved: number;
}

export default function CacheAdminPage() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [analysis, setAnalysis] = useState<ClusterAnalysis | null>(null);
  const [optimization, setOptimization] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const handleAction = async (action: string, apiCall: () => Promise<any>) => {
    setLoading(prev => ({ ...prev, [action]: true }));
    try {
      const result = await apiCall();
      console.log(`${action} result:`, result);
      
      // Refresh stats after any action
      await refreshStats();
      
      return result;
    } catch (error) {
      console.error(`Error in ${action}:`, error);
      alert(`Erreur: ${error}`);
    } finally {
      setLoading(prev => ({ ...prev, [action]: false }));
    }
  };

  const refreshStats = async () => {
    await handleAction('stats', async () => {
      const response = await fetch('/api/cache/stats');
      const data = await response.json();
      setStats(data);
      return data;
    });
  };

  const analyzeCache = async () => {
    const result = await handleAction('analyze', async () => {
      const response = await fetch('/api/cache/analyze');
      const data = await response.json();
      setAnalysis(data);
      return data;
    });
  };

  const optimizeCache = async (dryRun = true) => {
    const result = await handleAction('optimize', async () => {
      const response = await fetch('/api/cache/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun }),
      });
      const data = await response.json();
      setOptimization(data);
      return data;
    });
  };

  const repairEmbeddings = async () => {
    await handleAction('repair', async () => {
      const response = await fetch('/api/cache/repair', { method: 'POST' });
      return await response.json();
    });
  };

  const downloadAllData = async () => {
    await handleAction('download', async () => {
      const response = await fetch('/api/cache/download');
      const data = await response.json();
      
      // Créer et télécharger le fichier
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cache-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return data;
    });
  };

  useEffect(() => {
    refreshStats();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">🎛️ Administration Cache Sémantique</h1>
        <Button onClick={refreshStats} disabled={loading.stats}>
          🔄 Actualiser
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Segments Total</h3>
          <p className="text-3xl font-bold text-blue-600">{stats?.totalSegments || 0}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Avec Embeddings</h3>
          <p className="text-3xl font-bold text-green-600">{stats?.withEmbeddings || 0}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Couverture</h3>
          <p className="text-3xl font-bold text-purple-600">{stats?.coverage.toFixed(1) || 0}%</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Langues</h3>
          <p className="text-sm text-gray-600">{stats?.languages.join(', ') || 'N/A'}</p>
        </div>
      </div>

      {/* Actions principales */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">🔧 Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            onClick={analyzeCache}
            disabled={loading.analyze}
            className="h-20 flex flex-col items-center justify-center"
          >
            🔍 Analyser Clusters
            <span className="text-xs">Détecter doublons</span>
          </Button>
          
          <Button
            onClick={() => optimizeCache(true)}
            disabled={loading.optimize}
            variant="outline"
            className="h-20 flex flex-col items-center justify-center"
          >
            🧪 Simulation Optimisation
            <span className="text-xs">Test sans suppression</span>
          </Button>
          
          <Button
            onClick={repairEmbeddings}
            disabled={loading.repair}
            variant="outline"
            className="h-20 flex flex-col items-center justify-center"
          >
            🔧 Réparer Embeddings
            <span className="text-xs">Générer manquants</span>
          </Button>
          
          <Button
            onClick={downloadAllData}
            disabled={loading.download}
            variant="outline"
            className="h-20 flex flex-col items-center justify-center"
          >
            📊 Télécharger Données
            <span className="text-xs">Export complet JSON</span>
          </Button>
        </div>
      </div>

      {/* Analyse des clusters */}
      {analysis && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">🧠 Analyse Sémantique</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Segments analysés</p>
              <p className="text-2xl font-bold">{analysis.totalSegments}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Clusters trouvés</p>
              <p className="text-2xl font-bold text-orange-600">{analysis.clustersFound}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Doublons détectés</p>
              <p className="text-2xl font-bold text-red-600">{analysis.duplicatesDetected.length}</p>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Recommandations:</h3>
            <ul className="list-disc list-inside space-y-1">
              {analysis.recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-gray-700">{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Résultats optimisation */}
      {optimization && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">⚡ Optimisation</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Doublons trouvés</p>
              <p className="text-2xl font-bold">{optimization.duplicatesFound}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Espace économisé</p>
              <p className="text-2xl font-bold text-green-600">{(optimization.spaceSaved / 1024 / 1024).toFixed(1)} MB</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Éléments supprimés</p>
              <p className="text-2xl font-bold text-red-600">{optimization.itemsRemoved}</p>
            </div>
          </div>
          
          {optimization.itemsRemoved === 0 && optimization.duplicatesFound > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <p className="text-yellow-800">
                💡 {optimization.duplicatesFound} doublons détectés. 
                <Button 
                  onClick={() => optimizeCache(false)}
                  disabled={loading.optimize}
                  className="ml-2"
                  size="sm"
                  variant="destructive"
                >
                  🗑️ Supprimer maintenant
                </Button>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Informations système */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">ℹ️ Informations Système</h2>
        <div className="text-sm space-y-2">
          <p><strong>Modèle embeddings:</strong> text-embedding-3-small (1536 dimensions)</p>
          <p><strong>Seuil similarité:</strong> 0.85</p>
          <p><strong>Cache local:</strong> Actif</p>
          <p><strong>Fallbacks:</strong> Connexion directe disponible</p>
        </div>
      </div>
    </div>
  );
}