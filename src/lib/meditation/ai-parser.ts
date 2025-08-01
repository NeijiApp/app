import { type MeditationRequest, type SegmentPlan } from './ai-agent';

/**
 * Patterns de reconnaissance pour l'analyse des demandes
 */
const INTENT_PATTERNS = {
    stress: [
        'stress', 'stressé', 'anxieux', 'anxiété', 'tension', 'nerveux', 
        'inquiet', 'préoccupé', 'agité', 'overwhelmed', 'débordé'
    ],
    sleep: [
        'sommeil', 'dormir', 'endormir', 'insomnie', 'nuit', 'coucher',
        'fatigue', 'repos', 'relaxation nocturne', 'sleep', 'tired'
    ],
    focus: [
        'concentration', 'focus', 'attention', 'travail', 'productivité',
        'clarté mentale', 'performance', 'étude', 'exam', 'projet'
    ],
    pain: [
        'douleur', 'mal', 'souffrance', 'tension musculaire', 'migraine',
        'maux de tête', 'dos', 'cou', 'épaules', 'pain', 'hurt'
    ],
    emotion: [
        'colère', 'tristesse', 'peur', 'joie', 'émotion', 'sentiment',
        'humeur', 'moral', 'dépression', 'anger', 'sad', 'fear', 'happy'
    ],
    general: [
        'bien-être', 'détente', 'paix', 'sérénité', 'équilibre',
        'mindfulness', 'awareness', 'meditation', 'zen'
    ]
} as const;

const DURATION_PATTERNS = {
    short: { min: 3, max: 7, keywords: ['court', 'rapide', 'bref', 'quick', 'short'] },
    medium: { min: 8, max: 15, keywords: ['moyen', 'normal', 'standard', 'medium'] },
    long: { min: 16, max: 30, keywords: ['long', 'profond', 'extended', 'deep'] },
    extended: { min: 31, max: 60, keywords: ['très long', 'extended', 'marathon'] }
} as const;

const VOICE_PATTERNS = {
    gender: {
        female: ['femme', 'féminine', 'elle', 'female', 'woman', 'douce'],
        male: ['homme', 'masculin', 'il', 'male', 'man', 'grave']
    },
    style: {
        calm: ['calme', 'paisible', 'doux', 'serein', 'tranquille', 'calm', 'peaceful'],
        energetic: ['énergique', 'dynamique', 'motivant', 'energetic', 'upbeat'],
        warm: ['chaleureux', 'bienveillant', 'maternel', 'warm', 'caring'],
        professional: ['professionnel', 'neutre', 'formel', 'professional', 'clinical']
    }
} as const;

/**
 * Meditation templates based on goals
 */
const MEDITATION_TEMPLATES = {
    stress: {
        segments: [
            { type: 'intro', percentage: 0.10, priority: 5, focus: 'accueil_stress' },
            { type: 'breathing', percentage: 0.35, priority: 5, focus: 'respiration_apaisante' },
            { type: 'body_scan', percentage: 0.30, priority: 4, focus: 'relachement_tension' },
            { type: 'visualization', percentage: 0.20, priority: 3, focus: 'lieu_paisible' },
            { type: 'conclusion', percentage: 0.05, priority: 4, focus: 'retour_calme' }
        ],
        defaultDuration: 10,
        voiceStyle: 'calm'
    },
    sleep: {
        segments: [
            { type: 'intro', percentage: 0.08, priority: 4, focus: 'preparation_sommeil' },
            { type: 'breathing', percentage: 0.25, priority: 5, focus: 'respiration_lente' },
            { type: 'body_scan', percentage: 0.40, priority: 5, focus: 'relaxation_progressive' },
            { type: 'visualization', percentage: 0.25, priority: 4, focus: 'endormissement' },
            { type: 'conclusion', percentage: 0.02, priority: 2, focus: 'transition_sommeil' }
        ],
        defaultDuration: 15,
        voiceStyle: 'warm'
    },
    focus: {
        segments: [
            { type: 'intro', percentage: 0.12, priority: 5, focus: 'preparation_concentration' },
            { type: 'breathing', percentage: 0.30, priority: 5, focus: 'respiration_focalisee' },
            { type: 'body_scan', percentage: 0.20, priority: 3, focus: 'ancrage_corporel' },
            { type: 'visualization', percentage: 0.30, priority: 5, focus: 'clarte_mentale' },
            { type: 'conclusion', percentage: 0.08, priority: 4, focus: 'integration_focus' }
        ],
        defaultDuration: 8,
        voiceStyle: 'professional'
    },
    pain: {
        segments: [
            { type: 'intro', percentage: 0.15, priority: 5, focus: 'accueil_douleur' },
            { type: 'breathing', percentage: 0.25, priority: 4, focus: 'respiration_therapeutique' },
            { type: 'body_scan', percentage: 0.40, priority: 5, focus: 'exploration_sensation' },
            { type: 'visualization', percentage: 0.15, priority: 4, focus: 'guerison_visualisation' },
            { type: 'conclusion', percentage: 0.05, priority: 3, focus: 'integration_apaisement' }
        ],
        defaultDuration: 12,
        voiceStyle: 'warm'
    },
    emotion: {
        segments: [
            { type: 'intro', percentage: 0.12, priority: 5, focus: 'accueil_emotion' },
            { type: 'breathing', percentage: 0.28, priority: 5, focus: 'respiration_equilibrante' },
            { type: 'body_scan', percentage: 0.25, priority: 4, focus: 'ressenti_corporel' },
            { type: 'visualization', percentage: 0.25, priority: 4, focus: 'transformation_emotion' },
            { type: 'conclusion', percentage: 0.10, priority: 4, focus: 'integration_equilibre' }
        ],
        defaultDuration: 10,
        voiceStyle: 'warm'
    },
    general: {
        segments: [
            { type: 'intro', percentage: 0.15, priority: 4, focus: 'accueil_general' },
            { type: 'breathing', percentage: 0.25, priority: 4, focus: 'respiration_consciente' },
            { type: 'body_scan', percentage: 0.30, priority: 4, focus: 'presence_corporelle' },
            { type: 'visualization', percentage: 0.25, priority: 3, focus: 'bien_etre_general' },
            { type: 'conclusion', percentage: 0.05, priority: 3, focus: 'retour_present' }
        ],
        defaultDuration: 10,
        voiceStyle: 'calm'
    }
} as const;

/**
 * Contenu dynamique selon le contexte
 */
const CONTENT_GENERATORS = {
    // Introductions selon l'objectif
    intro: {
        accueil_stress: (duration: number) => 
            `Welcome to this ${duration}-minute meditation specially designed to ease your stress. Get comfortable, close your eyes if that feels right, and allow yourself this well-deserved moment of rest.`,
        
        preparation_sommeil: (duration: number) => 
            `It's time to prepare for a restorative night. This ${duration}-minute meditation will guide you toward deep and peaceful sleep. Lie down comfortably and let yourself be guided.`,
        
        preparation_concentration: (duration: number) => 
            `Prepare to cultivate your concentration with this ${duration}-minute meditation. Sit in a stable and comfortable position, back straight but relaxed, ready to sharpen your attention.`,
        
        accueil_douleur: (duration: number) => 
            `This ${duration}-minute meditation accompanies you in the kind exploration of your sensations. Find a position that works for you, respecting your body's limits.`,
        
        accueil_emotion: (duration: number) => 
            `Allow yourself ${duration} minutes to welcome and transform your emotions with kindness. Get comfortable, with an open heart to what presents itself.`,
        
        accueil_general: (duration: number) => 
            `Welcome to this ${duration}-minute meditation to cultivate your well-being. Take a comfortable position and fully allow yourself this present moment.`
    },

    // Exercices de respiration
    breathing: {
        respiration_apaisante: () => 
            `Now focus your attention on your natural breathing. With each inhale, imagine that you welcome peace and serenity. With each exhale, release the tensions and stress of your day. Let your breath become your anchor in the present moment.`,
        
        respiration_lente: () => 
            `Gradually slow down your breathing rhythm. Breathe in slowly through your nose counting to four, gently hold your breath for two counts, then exhale through your mouth counting to six. This soothing rhythm prepares your body and mind for rest.`,
        
        respiration_focalisee: () => 
            `Use your breathing as a concentration tool. Inhale while visualizing pure air that nourishes your mental clarity, exhale while releasing distractions and intrusive thoughts. Each breathing cycle refines your attention and presence.`,
        
        respiration_therapeutique: () => 
            `Breathe with therapeutic intention. With each inhale, imagine that you circulate soothing energy throughout your body. With each exhale, you release tensions and allow your body to relax naturally.`,
        
        respiration_equilibrante: () => 
            `Let your breathing balance your emotions. Inhale stability and inner peace, exhale the emotions that destabilize you. Your breath becomes a bridge between your inner world and the harmony you seek.`,
        
        respiration_consciente: () => 
            `Simply become aware of your breathing, without trying to change it. Observe the natural back-and-forth of your breath, this constant dance that keeps you alive and connects you to the present moment.`
    },

    // Scan corporel
    body_scan: {
        relachement_tension: () => 
            `Now scan through your body with kindness, starting from the top of your head. Relax your forehead, your cheeks, your jaw. Release your shoulders that carry so much tension. Move down along your arms, relax your chest, your back, your abdomen. Free your hips, your thighs, your calves, down to the tips of your toes.`,
        
        relaxation_progressive: () => 
            `Invite each part of your body to relax deeply. Start by lightly contracting your facial muscles, then release completely. Continue with your shoulders, your arms, your torso. Contract then release your glutes, your thighs, your calves. Feel this wave of relaxation flowing through your entire being.`,
        
        ancrage_corporel: () => 
            `Become aware of your body as a stable foundation for your concentration. Feel your support points: your buttocks on the chair, your feet on the floor. Feel the solidity of your spine, the openness of your chest. Your body becomes your ally in concentration.`,
        
        exploration_sensation: () => 
            `Explore your bodily sensations with curiosity and kindness. Where you feel discomfort, breathe into that area without resistance. Imagine your breath as a gentle light that soothes and relaxes. Welcome what you feel without judgment.`,
        
        ressenti_corporel: () => 
            `Observe the sensations that accompany your emotions in your body. Perhaps tension in your chest, heaviness in your belly, or conversely lightness in your heart. Welcome these feelings as precious messengers from your inner world.`,
        
        presence_corporelle: () => 
            `Fully inhabit your body in this moment. Feel the life pulsing within you, the warmth of your skin, the stability of your posture. Your body is your temple, your vehicle for experiencing the beauty of the present moment.`
    },

    // Visualisations
    visualization: {
        lieu_paisible: () => 
            `Now visualize a place that evokes peace and serenity for you. Perhaps a beach at sunset, a silent forest, a secret garden. Explore this place with all your senses: the colors, sounds, scents, textures. You are safe here, perfectly relaxed.`,
        
        endormissement: () => 
            `Imagine yourself floating on a soft and fluffy cloud, carried by a gentle breeze toward the land of dreams. Each exhale makes you sink a little deeper into this enveloping softness. Your eyelids become heavy, your body completely surrenders to relaxation.`,
        
        clarte_mentale: () => 
            `Visualize your mind as a perfectly calm and clear lake. Intrusive thoughts are like leaves that fall on the surface and drift away naturally. Your attention becomes clear and focused, like a ray of sunlight piercing through clouds.`,
        
        guerison_visualisation: () => 
            `Imagine a golden and soothing light emanating from your heart and spreading throughout your body. This light has the power to relieve, heal, and transform. Direct it toward areas that need it, with love and compassion.`,
        
        transformation_emotion: () => 
            `Visualize your emotions as clouds in the sky of your consciousness. Watch them pass without attachment. Difficult emotions transform into gray clouds that drift away, replaced by white and luminous clouds bearing peace and balance.`,
        
        bien_etre_general: () => 
            `Imagine yourself bathed in a golden light of well-being. This light nourishes every cell of your body, soothes your mind, warms your heart. You are exactly where you need to be, in perfect harmony with yourself and the world around you.`
    },

    // Conclusions
    conclusion: {
        retour_calme: () => 
            `Take a few moments to savor this peace you have cultivated. Carry this serenity with you throughout your day, knowing you can always return to this state of inner calm.`,
        
        transition_sommeil: () => 
            `Now let yourself naturally drift toward sleep, keeping this sensation of deep relaxation. Your body knows how to rest, your mind can release with complete confidence.`,
        
        integration_focus: () => 
            `Gradually return to your environment while maintaining this mental clarity. Gently move your fingers, your toes, open your eyes when you feel ready. Your sharpened concentration now accompanies you.`,
        
        integration_apaisement: () => 
            `Carefully preserve this sensation of peace you have created. Gently return to the present moment, with gentle and kind movements toward yourself.`,
        
        integration_equilibre: () => 
            `Now integrate this emotional balance into your being. Gradually return to your day with this new inner harmony, stronger and more centered.`,
        
        retour_present: () => 
            `Gently return to the present moment, enriched by this well-being experience. Move delicately, stretch if you feel the need, and open your eyes when you're ready.`
    }
} as const;

/**
 * Parser Intelligent - Analyse et structure les demandes utilisateur
 */
export class MeditationParser {
    
    /**
     * Analyser une demande utilisateur et créer une requête structurée
     */
    static parseUserRequest(prompt: string, userId?: number): MeditationRequest {
        const cleanPrompt = prompt.toLowerCase();
        
        // Détecter l'objectif principal
        const goal = this.detectGoal(cleanPrompt);
        
        // Détecter la durée souhaitée
        const duration = this.detectDuration(cleanPrompt, goal);
        
        // Détecter les préférences vocales
        const voicePreferences = this.detectVoicePreferences(cleanPrompt, goal);
        
        // Détecter la langue
        const language = this.detectLanguage(prompt);
        
        console.log(`🔍 Analyse: Objectif="${goal}", Durée=${duration}min, Voix=${voicePreferences.gender}/${voicePreferences.style}`);
        
        return {
            prompt,
            duration,
            voiceGender: voicePreferences.gender,
            voiceStyle: voicePreferences.style,
            goal,
            language,
            userId
        };
    }
    
    /**
     * Créer des segments détaillés à partir d'une requête
     */
    static createDetailedSegments(request: MeditationRequest): SegmentPlan[] {
        const template = MEDITATION_TEMPLATES[request.goal as keyof typeof MEDITATION_TEMPLATES] || MEDITATION_TEMPLATES.general;
        const totalDuration = request.duration * 60; // Convertir en secondes
        const segments: SegmentPlan[] = [];
        
        let currentTime = 0;
        
        for (const templateSegment of template.segments) {
            const duration = Math.round(totalDuration * templateSegment.percentage);
            const content = this.generateSegmentContent(
                templateSegment.type, 
                templateSegment.focus, 
                request.duration
            );
            
            segments.push({
                id: `${templateSegment.type}_${currentTime}_${templateSegment.focus}`,
                type: templateSegment.type,
                content,
                duration,
                priority: templateSegment.priority,
                context: `${request.goal}_${request.duration}min_${templateSegment.focus}_${request.language}`
            });
            
            currentTime += duration;
        }
        
        return segments;
    }
    
    // === MÉTHODES DE DÉTECTION ===
    
    private static detectGoal(prompt: string): string {
        let maxScore = 0;
        let detectedGoal = 'general';
        
        for (const [goal, keywords] of Object.entries(INTENT_PATTERNS)) {
            const score = keywords.reduce((count, keyword) => {
                return count + (prompt.includes(keyword) ? 1 : 0);
            }, 0);
            
            if (score > maxScore) {
                maxScore = score;
                detectedGoal = goal;
            }
        }
        
        return detectedGoal;
    }
    
    private static detectDuration(prompt: string, goal: string): number {
        // Rechercher des mentions explicites de durée
        const durationMatch = prompt.match(/(\d+)\s*(min|minute|minutes)/);
        if (durationMatch && durationMatch[1]) {
            const duration = parseInt(durationMatch[1]);
            return Math.max(3, Math.min(60, duration)); // Entre 3 et 60 minutes
        }
        
        // Rechercher des indices de durée
        for (const [category, config] of Object.entries(DURATION_PATTERNS)) {
            for (const keyword of config.keywords) {
                if (prompt.includes(keyword)) {
                    return Math.floor((config.min + config.max) / 2);
                }
            }
        }
        
        // Durée par défaut selon l'objectif
        const template = MEDITATION_TEMPLATES[goal as keyof typeof MEDITATION_TEMPLATES];
        return template?.defaultDuration || 10;
    }
    
    private static detectVoicePreferences(prompt: string, goal: string): { gender: 'male' | 'female', style: string } {
        let detectedGender: 'male' | 'female' = 'female'; // Défaut
        let detectedStyle = 'calm'; // Défaut
        
        // Détecter le genre de voix
        for (const [gender, keywords] of Object.entries(VOICE_PATTERNS.gender)) {
            for (const keyword of keywords) {
                if (prompt.includes(keyword)) {
                    detectedGender = gender as 'male' | 'female';
                    break;
                }
            }
        }
        
        // Détecter le style de voix
        for (const [style, keywords] of Object.entries(VOICE_PATTERNS.style)) {
            for (const keyword of keywords) {
                if (prompt.includes(keyword)) {
                    detectedStyle = style;
                    break;
                }
            }
        }
        
        // Style par défaut selon l'objectif
        const template = MEDITATION_TEMPLATES[goal as keyof typeof MEDITATION_TEMPLATES];
        if (template && !VOICE_PATTERNS.style[detectedStyle as keyof typeof VOICE_PATTERNS.style]) {
            detectedStyle = template.voiceStyle;
        }
        
        return { gender: detectedGender, style: detectedStyle };
    }
    
    private static detectLanguage(prompt: string): string {
        // Détection basique de la langue
        const frenchWords = ['je', 'me', 'tu', 'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'ou', 'pour', 'avec'];
        const englishWords = ['i', 'me', 'you', 'the', 'a', 'an', 'and', 'or', 'for', 'with', 'to', 'of', 'in', 'on'];
        
        const words = prompt.toLowerCase().split(/\s+/);
        let frenchScore = 0;
        let englishScore = 0;
        
        for (const word of words) {
            if (frenchWords.includes(word)) frenchScore++;
            if (englishWords.includes(word)) englishScore++;
        }
        
        return frenchScore >= englishScore ? 'fr-FR' : 'en-US';
    }
    
    private static generateSegmentContent(
        type: 'intro' | 'breathing' | 'body_scan' | 'visualization' | 'conclusion',
        focus: string,
        duration: number
    ): string {
        try {
            const contentType = CONTENT_GENERATORS[type];
            if (contentType && typeof contentType === 'object') {
                const generator = (contentType as any)[focus];
                if (typeof generator === 'function') {
                    return generator(duration);
                }
            }
        } catch (error) {
            console.warn(`Erreur génération contenu ${type}/${focus}:`, error);
        }
        
        // Contenu de fallback
        const fallbackContent = {
            intro: `Bienvenue dans cette méditation de ${duration} minutes.`,
            breathing: "Portez votre attention sur votre respiration naturelle.",
            body_scan: "Parcourez maintenant votre corps avec bienveillance.",
            visualization: "Visualisez un lieu qui évoque pour vous la paix.",
            conclusion: "Revenez doucement à l'instant présent."
        };
        
        return fallbackContent[type] || "Contenu de méditation";
    }
    
    /**
     * Analyser la complexité d'une demande
     */
    static analyzeComplexity(request: MeditationRequest): {
        score: number;
        factors: string[];
        recommendation: 'simple' | 'moderate' | 'complex';
    } {
        const factors: string[] = [];
        let score = 0;
        
        // Facteurs de complexité
        if (request.duration > 20) {
            score += 2;
            factors.push('Durée longue');
        }
        
        if (request.goal === 'pain' || request.goal === 'emotion') {
            score += 2;
            factors.push('Objectif spécialisé');
        }
        
        if (request.prompt.length > 100) {
            score += 1;
            factors.push('Demande détaillée');
        }
        
        if (request.voiceStyle !== 'calm') {
            score += 1;
            factors.push('Style vocal spécifique');
        }
        
        // Recommandation
        let recommendation: 'simple' | 'moderate' | 'complex';
        if (score <= 2) recommendation = 'simple';
        else if (score <= 4) recommendation = 'moderate';
        else recommendation = 'complex';
        
        return { score, factors, recommendation };
    }
}

export default MeditationParser;