# 🚀 Guide d'Intégration - Agent IA dans Neiji

## 🎯 Vue d'ensemble

Ce guide explique comment intégrer l'**Agent IA de Méditation** dans l'application Neiji existante pour remplacer progressivement l'ancien système par l'intelligence artificielle optimisée.

---

## 📋 Étapes d'Intégration

### 1. 🔧 **Préparation de l'Environment**

#### Variables d'Environnement
```env
# .env.local (déjà configuré)
OPENAI_API_KEY=your_openai_key

# Nouvelles variables optionnelles
AI_AGENT_ENABLED=true
AI_AGENT_FALLBACK_ENABLED=true
AI_AGENT_DEBUG=false
```

#### Vérification des Dépendances
```bash
# Vérifier que tout est installé
pnpm install

# Tester la connectivité OpenAI
node -e "console.log(process.env.OPENAI_API_KEY ? 'OpenAI OK' : 'OpenAI manquant')"
```

### 2. 🛠️ **Création de la Route API**

#### Nouvelle Route : `/api/meditation/ai-generate`

```typescript
// src/app/api/meditation/ai-generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { meditationAI } from '@/lib/meditation/ai-agent';
import { MeditationParser } from '@/lib/meditation/ai-parser';
import { aiMetrics } from '@/lib/meditation/ai-metrics';

export async function POST(request: NextRequest) {
  try {
    const { prompt, userId } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt requis' }, 
        { status: 400 }
      );
    }

    // 1. Parser la demande utilisateur
    console.log('🔍 Parsing de la demande:', prompt);
    const meditationRequest = MeditationParser.parseUserRequest(prompt, userId);
    
    // 2. Générer avec l'Agent IA
    console.log('🧠 Génération IA démarrée...');
    const startTime = Date.now();
    const result = await meditationAI.generateOptimizedMeditation(meditationRequest);
    
    // 3. Enregistrer les métriques
    await aiMetrics.recordOptimizationEvent({
      timestamp: new Date(),
      requestId: `req_${Date.now()}`,
      userId,
      goal: meditationRequest.goal,
      duration: meditationRequest.duration,
      generationTime: result.actualTime,
      totalCost: result.actualCost,
      qualityScore: result.actualQuality,
      segmentsTotal: result.segmentsReused + result.segmentsCreated,
      segmentsReused: result.segmentsReused,
      segmentsCreated: result.segmentsCreated,
      cacheHitRate: result.segmentsReused / (result.segmentsReused + result.segmentsCreated),
      decisions: {
        reuse_exact: Math.floor(result.segmentsReused * 0.6),
        reuse_similar: Math.floor(result.segmentsReused * 0.4),
        create_new: result.segmentsCreated
      },
      success: result.success,
      errors: result.errors
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        audioUrl: result.audioUrl,
        metadata: {
          duration: meditationRequest.duration,
          goal: meditationRequest.goal,
          voiceGender: meditationRequest.voiceGender,
          voiceStyle: meditationRequest.voiceStyle,
          language: meditationRequest.language,
          generationTime: result.actualTime,
          quality: result.actualQuality,
          optimization: result.optimizationAchieved,
          cost: result.actualCost,
          segmentsReused: result.segmentsReused,
          segmentsCreated: result.segmentsCreated
        }
      });
    } else {
      throw new Error(result.errors?.join(', ') || 'Erreur de génération');
    }

  } catch (error) {
    console.error('❌ Erreur API Agent IA:', error);
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la génération IA',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      }, 
      { status: 500 }
    );
  }
}
```

### 3. 📊 **Route des Métriques**

#### Route : `/api/meditation/ai-metrics`

```typescript
// src/app/api/meditation/ai-metrics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { aiMetrics } from '@/lib/meditation/ai-metrics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') as 'hour' | 'day' | 'week' | 'month' || 'day';
    const detailed = searchParams.get('detailed') === 'true';

    if (detailed) {
      // Rapport détaillé
      const report = await aiMetrics.getDetailedReport();
      return NextResponse.json(report);
    } else {
      // Métriques simples
      const metrics = aiMetrics.getPerformanceMetrics();
      const trends = await aiMetrics.analyzeTrends(period);
      
      return NextResponse.json({
        metrics,
        trends
      });
    }

  } catch (error) {
    console.error('❌ Erreur métriques:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des métriques' },
      { status: 500 }
    );
  }
}
```

### 4. 🎨 **Composant React d'Interface**

#### Composant : `AIGenerationPanel`

```typescript
// src/components/meditation/ai-generation-panel.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AIGenerationResult {
  success: boolean;
  audioUrl?: string;
  metadata?: {
    duration: number;
    goal: string;
    generationTime: number;
    quality: number;
    optimization: number;
    cost: number;
    segmentsReused: number;
    segmentsCreated: number;
  };
  error?: string;
}

export function AIGenerationPanel({ userId }: { userId?: number }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIGenerationResult | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/meditation/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, userId })
      });

      const data = await response.json();
      setResult(data);

    } catch (error) {
      setResult({
        success: false,
        error: 'Erreur de connexion'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow-lg">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-800">
          🤖 Génération IA de Méditation
        </h2>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Décrivez votre besoin de méditation
          </label>
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: Je suis stressé, j'ai besoin d'une méditation de 10 minutes pour me détendre..."
            className="w-full"
          />
        </div>

        <Button 
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="w-full"
        >
          {loading ? '🧠 Génération en cours...' : '🚀 Générer avec l\'IA'}
        </Button>
      </div>

      {/* Résultat */}
      {result && (
        <div className="space-y-4 p-4 border rounded-lg">
          {result.success ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-green-600 text-lg">✅</span>
                <span className="font-semibold text-green-800">
                  Méditation générée avec succès !
                </span>
              </div>

              {result.audioUrl && (
                <audio controls className="w-full">
                  <source src={result.audioUrl} type="audio/mpeg" />
                </audio>
              )}

              {result.metadata && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Objectif:</span> {result.metadata.goal}
                  </div>
                  <div>
                    <span className="font-medium">Durée:</span> {result.metadata.duration} min
                  </div>
                  <div>
                    <span className="font-medium">Temps génération:</span> {result.metadata.generationTime}ms
                  </div>
                  <div>
                    <span className="font-medium">Qualité:</span> {result.metadata.quality.toFixed(1)}/5
                  </div>
                  <div>
                    <span className="font-medium">Optimisation:</span> {(result.metadata.optimization * 100).toFixed(1)}%
                  </div>
                  <div>
                    <span className="font-medium">Coût:</span> ${result.metadata.cost.toFixed(4)}
                  </div>
                  <div>
                    <span className="font-medium">Segments réutilisés:</span> {result.metadata.segmentsReused}
                  </div>
                  <div>
                    <span className="font-medium">Segments créés:</span> {result.metadata.segmentsCreated}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-red-600 text-lg">❌</span>
              <span className="text-red-800">
                Erreur: {result.error}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### 5. 📊 **Dashboard de Métriques**

#### Composant : `AIMetricsDashboard`

```typescript
// src/components/meditation/ai-metrics-dashboard.tsx
'use client';

import { useState, useEffect } from 'react';

interface MetricsData {
  metrics: {
    totalRequests: number;
    successRate: number;
    averageGenerationTime: number;
    averageQualityScore: number;
    segmentReuseRate: number;
    averageCostSaving: number;
  };
  trends: {
    insights: string[];
    recommendations: string[];
  };
}

export function AIMetricsDashboard() {
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/meditation/ai-metrics');
        const metricsData = await response.json();
        setData(metricsData);
      } catch (error) {
        console.error('Erreur chargement métriques:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh toutes les 30s

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center">
        <span className="text-lg">📊 Chargement des métriques...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center text-red-600">
        ❌ Erreur de chargement des métriques
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 rounded-lg">
      <h2 className="text-2xl font-bold text-gray-800">
        📊 Métriques Agent IA
      </h2>

      {/* Métriques principales */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">
            {data.metrics.totalRequests}
          </div>
          <div className="text-sm text-gray-600">Requêtes totales</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">
            {(data.metrics.successRate * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Taux de succès</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">
            {data.metrics.averageGenerationTime.toFixed(0)}ms
          </div>
          <div className="text-sm text-gray-600">Temps moyen</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600">
            {data.metrics.averageQualityScore.toFixed(1)}/5
          </div>
          <div className="text-sm text-gray-600">Qualité moyenne</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-indigo-600">
            {(data.metrics.segmentReuseRate * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Taux réutilisation</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">
            ${data.metrics.averageCostSaving.toFixed(4)}
          </div>
          <div className="text-sm text-gray-600">Économies moyennes</div>
        </div>
      </div>

      {/* Insights */}
      {data.trends.insights.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">🎯 Insights</h3>
          <ul className="space-y-1">
            {data.trends.insights.map((insight, index) => (
              <li key={index} className="text-blue-700 text-sm">
                • {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommandations */}
      {data.trends.recommendations.length > 0 && (
        <div className="bg-amber-50 p-4 rounded-lg">
          <h3 className="font-semibold text-amber-800 mb-2">💡 Recommandations</h3>
          <ul className="space-y-1">
            {data.trends.recommendations.map((rec, index) => (
              <li key={index} className="text-amber-700 text-sm">
                • {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

---

## 🔄 Migration Progressive

### Stratégie de Déploiement

#### Phase 1 : Tests A/B (Recommandé)
```typescript
// Logique de bascule progressive
const useAIAgent = Math.random() < 0.1; // 10% des utilisateurs

if (useAIAgent && process.env.AI_AGENT_ENABLED === 'true') {
  // Utiliser l'Agent IA
  return await generateWithAI(prompt, userId);
} else {
  // Utiliser l'ancien système
  return await generateWithOldSystem(prompt, userId);
}
```

#### Phase 2 : Rollout Graduel
- **Semaine 1** : 10% des utilisateurs
- **Semaine 2** : 25% des utilisateurs  
- **Semaine 3** : 50% des utilisateurs
- **Semaine 4** : 75% des utilisateurs
- **Semaine 5** : 100% des utilisateurs

#### Phase 3 : Fallback Intelligent
```typescript
async function generateMeditation(prompt: string, userId?: number) {
  if (process.env.AI_AGENT_ENABLED === 'true') {
    try {
      // Essayer l'Agent IA d'abord
      const result = await meditationAI.generateOptimizedMeditation(
        MeditationParser.parseUserRequest(prompt, userId)
      );
      
      if (result.success) {
        return result;
      } else {
        console.warn('⚠️ Agent IA échoué, fallback vers ancien système');
      }
    } catch (error) {
      console.error('❌ Erreur Agent IA:', error);
    }
  }
  
  // Fallback vers l'ancien système
  return await oldGenerationSystem(prompt, userId);
}
```

---

## 🧪 Tests d'Intégration

### Tests Unitaires
```bash
# Tester les nouvelles routes
npm test -- --testPathPattern=api/meditation

# Tester les composants React
npm test -- --testPathPattern=components/meditation
```

### Tests End-to-End
```typescript
// cypress/e2e/ai-meditation.cy.ts
describe('Agent IA Méditation', () => {
  it('génère une méditation via IA', () => {
    cy.visit('/meditation/ai');
    cy.get('[data-testid="prompt-input"]').type('Je suis stressé');
    cy.get('[data-testid="generate-button"]').click();
    cy.get('[data-testid="result"]').should('contain', 'succès');
  });
});
```

### Monitoring Production
```typescript
// Alertes automatiques
if (metrics.successRate < 0.95) {
  console.error('🚨 ALERTE: Taux de succès Agent IA < 95%');
  // Envoyer notification équipe
}

if (metrics.averageGenerationTime > 15000) {
  console.warn('⚠️ ALERTE: Temps génération > 15s');
  // Déclencher optimisation automatique
}
```

---

## 📋 Checklist de Déploiement

### Pré-déploiement
- [ ] ✅ Variables d'environnement configurées
- [ ] ✅ Base de données migrée (pgvector + embeddings)
- [ ] ✅ Tests unitaires passés
- [ ] ✅ Tests d'intégration validés
- [ ] ✅ Documentation à jour

### Déploiement
- [ ] 🚀 Routes API créées et testées
- [ ] 🎨 Composants React intégrés
- [ ] 📊 Dashboard métriques fonctionnel
- [ ] 🔄 Système de fallback activé
- [ ] 📈 Monitoring en place

### Post-déploiement
- [ ] 📊 Métriques surveillées (première heure)
- [ ] 🧪 Tests A/B configurés
- [ ] 📝 Logs analysés
- [ ] 👥 Feedback utilisateur collecté
- [ ] 🔧 Optimisations appliquées si nécessaire

---

## 🆘 Troubleshooting

### Problèmes Courants

#### 1. Agent IA ne répond pas
```bash
# Vérifier la clé OpenAI
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models

# Vérifier la base de données
psql $DATABASE_URL -c "SELECT COUNT(*) FROM meditation_history;"
```

#### 2. Métriques non affichées
```typescript
// Vérifier les événements en mémoire
console.log('Événements en mémoire:', aiMetrics.getPerformanceMetrics());

// Réinitialiser si nécessaire
aiMetrics.resetMetrics();
```

#### 3. Performance dégradée
```typescript
// Ajuster les seuils
const AI_CONFIG = {
    mediumSimilarityThreshold: 0.80, // Réduire pour plus de réutilisation
    maxCacheSearchResults: 3,        // Réduire pour plus de vitesse
};
```

---

## 🎯 Conclusion

L'intégration de l'Agent IA est **straightforward** grâce à :

- **Architecture modulaire** : Composants indépendants
- **APIs bien définies** : Interfaces claires
- **Fallback robuste** : Sécurité garantie
- **Monitoring complet** : Visibilité totale

**🚀 L'Agent IA est prêt pour la production !**