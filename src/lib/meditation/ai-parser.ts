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
        'mindfulness', 'pleine conscience', 'méditation', 'zen'
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
 * Templates de méditation selon les objectifs
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
            `Bienvenue dans cette méditation de ${duration} minutes spécialement conçue pour apaiser votre stress. Installez-vous confortablement, fermez les yeux si cela vous convient, et accordez-vous ce moment de répit bien mérité.`,
        
        preparation_sommeil: (duration: number) => 
            `Il est temps de vous préparer pour une nuit réparatrice. Cette méditation de ${duration} minutes va vous accompagner vers un sommeil profond et paisible. Allongez-vous confortablement et laissez-vous guider.`,
        
        preparation_concentration: (duration: number) => 
            `Préparez-vous à cultiver votre concentration avec cette méditation de ${duration} minutes. Asseyez-vous dans une position stable et confortable, le dos droit mais détendu, prêt à affûter votre attention.`,
        
        accueil_douleur: (duration: number) => 
            `Cette méditation de ${duration} minutes vous accompagne dans l'exploration bienveillante de vos sensations. Trouvez une position qui vous convient, en respectant les limites de votre corps.`,
        
        accueil_emotion: (duration: number) => 
            `Accordez-vous ${duration} minutes pour accueillir et transformer vos émotions avec bienveillance. Installez-vous confortablement, le cœur ouvert à ce qui se présente.`,
        
        accueil_general: (duration: number) => 
            `Bienvenue dans cette méditation de ${duration} minutes pour cultiver votre bien-être. Prenez une position confortable et accordez-vous pleinement à cet instant présent.`
    },

    // Exercices de respiration
    breathing: {
        respiration_apaisante: () => 
            `Portez maintenant votre attention sur votre respiration naturelle. À chaque inspiration, imaginez que vous accueillez la paix et la sérénité. À chaque expiration, relâchez les tensions et le stress de votre journée. Laissez votre souffle devenir votre ancre dans l'instant présent.`,
        
        respiration_lente: () => 
            `Ralentissez progressivement le rythme de votre respiration. Inspirez lentement par le nez en comptant jusqu'à quatre, retenez doucement votre souffle pendant deux temps, puis expirez par la bouche en comptant jusqu'à six. Ce rythme apaisant prépare votre corps et votre esprit au repos.`,
        
        respiration_focalisee: () => 
            `Utilisez votre respiration comme un outil de concentration. Inspirez en visualisant l'air pur qui nourrit votre clarté mentale, expirez en évacuant les distractions et les pensées parasites. Chaque cycle respiratoire affine votre attention et votre présence.`,
        
        respiration_therapeutique: () => 
            `Respirez avec intention thérapeutique. À chaque inspiration, imaginez que vous faites circuler une énergie apaisante dans tout votre corps. À chaque expiration, vous relâchez les tensions et permettez à votre corps de se détendre naturellement.`,
        
        respiration_equilibrante: () => 
            `Laissez votre respiration équilibrer vos émotions. Inspirez la stabilité et la paix intérieure, expirez les émotions qui vous déstabilisent. Votre souffle devient un pont entre votre monde intérieur et l'harmonie que vous recherchez.`,
        
        respiration_consciente: () => 
            `Prenez simplement conscience de votre respiration, sans chercher à la modifier. Observez le va-et-vient naturel de votre souffle, cette danse constante qui vous maintient en vie et vous connecte à l'instant présent.`
    },

    // Scan corporel
    body_scan: {
        relachement_tension: () => 
            `Parcourez maintenant votre corps avec bienveillance, en commençant par le sommet de votre tête. Détendez votre front, vos joues, votre mâchoire. Relâchez vos épaules qui portent tant de tensions. Descendez le long de vos bras, détendez votre poitrine, votre dos, votre abdomen. Libérez vos hanches, vos cuisses, vos mollets, jusqu'au bout de vos orteils.`,
        
        relaxation_progressive: () => 
            `Invitez chaque partie de votre corps à se détendre profondément. Commencez par contracter légèrement vos muscles faciaux, puis relâchez complètement. Continuez avec vos épaules, vos bras, votre torse. Contractez puis relâchez vos fessiers, vos cuisses, vos mollets. Sentez cette vague de relaxation qui parcourt tout votre être.`,
        
        ancrage_corporel: () => 
            `Prenez conscience de votre corps comme une base stable pour votre concentration. Sentez vos points d'appui : vos fesses sur la chaise, vos pieds sur le sol. Ressentez la solidité de votre colonne vertébrale, l'ouverture de votre poitrine. Votre corps devient votre allié dans la concentration.`,
        
        exploration_sensation: () => 
            `Explorez vos sensations corporelles avec curiosité et bienveillance. Là où vous ressentez de l'inconfort, respirez dans cette zone sans résistance. Imaginez votre souffle comme une lumière douce qui apaise et détend. Accueillez ce que vous ressentez sans jugement.`,
        
        ressenti_corporel: () => 
            `Observez les sensations qui accompagnent vos émotions dans votre corps. Peut-être une tension dans la poitrine, une lourdeur dans le ventre, ou au contraire une légèreté dans le cœur. Accueillez ces ressentis comme des messagers précieux de votre monde intérieur.`,
        
        presence_corporelle: () => 
            `Habitez pleinement votre corps en cet instant. Ressentez la vie qui pulse en vous, la chaleur de votre peau, la stabilité de votre posture. Votre corps est votre temple, votre véhicule pour expérimenter la beauté de l'instant présent.`
    },

    // Visualisations
    visualization: {
        lieu_paisible: () => 
            `Visualisez maintenant un lieu qui évoque pour vous la paix et la sérénité. Peut-être une plage au coucher du soleil, une forêt silencieuse, un jardin secret. Explorez ce lieu avec tous vos sens : les couleurs, les sons, les odeurs, les textures. Vous êtes en sécurité ici, parfaitement détendu.`,
        
        endormissement: () => 
            `Imaginez-vous flottant sur un nuage doux et moelleux, porté par une brise légère vers le pays des rêves. Chaque expiration vous fait sombrer un peu plus dans cette douceur enveloppante. Vos paupières deviennent lourdes, votre corps s'abandonne complètement à la détente.`,
        
        clarte_mentale: () => 
            `Visualisez votre esprit comme un lac parfaitement calme et limpide. Les pensées parasites sont comme des feuilles qui tombent à la surface et s'éloignent naturellement. Votre attention devient claire et focalisée, comme un rayon de soleil qui perce les nuages.`,
        
        guerison_visualisation: () => 
            `Imaginez une lumière dorée et apaisante qui émane de votre cœur et se diffuse dans tout votre corps. Cette lumière a le pouvoir de soulager, de guérir, de transformer. Dirigez-la vers les zones qui en ont besoin, avec amour et compassion.`,
        
        transformation_emotion: () => 
            `Visualisez vos émotions comme des nuages dans le ciel de votre conscience. Observez-les passer sans vous y attacher. Les émotions difficiles se transforment en nuages gris qui s'éloignent, remplacés par des nuages blancs et lumineux porteurs de paix et d'équilibre.`,
        
        bien_etre_general: () => 
            `Imaginez-vous baigné dans une lumière dorée de bien-être. Cette lumière nourrit chaque cellule de votre corps, apaise votre mental, réchauffe votre cœur. Vous êtes exactement où vous devez être, en parfaite harmonie avec vous-même et le monde qui vous entoure.`
    },

    // Conclusions
    conclusion: {
        retour_calme: () => 
            `Prenez quelques instants pour savourer cette paix que vous avez cultivée. Portez cette sérénité avec vous dans votre journée, sachant que vous pouvez toujours revenir à cet état de calme intérieur.`,
        
        transition_sommeil: () => 
            `Laissez-vous maintenant glisser naturellement vers le sommeil, en gardant cette sensation de détente profonde. Votre corps sait comment se reposer, votre esprit peut se relâcher en toute confiance.`,
        
        integration_focus: () => 
            `Revenez progressivement à votre environnement en conservant cette clarté mentale. Bougez doucement vos doigts, vos orteils, ouvrez les yeux quand vous vous sentez prêt. Votre concentration affûtée vous accompagne maintenant.`,
        
        integration_apaisement: () => 
            `Gardez précieusement cette sensation d'apaisement que vous avez créée. Revenez doucement à l'instant présent, en mouvement doux et bienveillants envers vous-même.`,
        
        integration_equilibre: () => 
            `Intégrez maintenant cet équilibre émotionnel dans votre être. Revenez progressivement à votre journée avec cette nouvelle harmonie intérieure, plus fort et plus centré.`,
        
        retour_present: () => 
            `Revenez en douceur à l'instant présent, enrichi de cette expérience de bien-être. Bougez délicatement, étirez-vous si vous en ressentez le besoin, et ouvrez les yeux quand vous êtes prêt.`
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