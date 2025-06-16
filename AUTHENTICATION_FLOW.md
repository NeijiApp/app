# Guide d'utilisation du système d'authentification conversationnel Neiji

## Vue d'ensemble
Le système d'authentification de Neiji utilise une approche conversationnelle naturelle qui guide l'utilisateur à travers le processus de connexion/inscription via un chat interactif.

## Flux utilisateur

### 1. Page d'accueil du chat (`/chat`)
- L'utilisateur arrive sur la page de chat principal
- Un bouton discret "Se connecter" est visible en haut à droite avec une icône utilisateur
- L'utilisateur peut utiliser le chat en mode invité sans authentification

### 2. Déclenchement de l'authentification
- Clic sur le bouton "Se connecter" → redirection vers `/auth`
- Tentative d'accès à une page protégée → redirection automatique vers `/auth`

### 3. Page d'authentification (`/auth`)
- **Design identique** à la page chat pour une expérience cohérente
- Bouton "Retour au chat" en haut à droite
- Logo Neiji centré quand seul le message de bienvenue est affiché
- Interface conversationnelle avec Neiji

### 4. Processus conversationnel

#### Étape 1 : Accueil (`welcome`)
- **Message de Neiji** : "Bonjour ! Je suis Neiji, votre assistant de méditation. Pour accéder à toutes les fonctionnalités, souhaitez-vous vous connecter ?"
- **Réponses acceptées** : "oui", "connect", "connexion"
- **Action** : Passage à l'étape `email`

#### Étape 2 : Saisie email (`email`)
- **Message de Neiji** : "Parfait ! Quelle est votre adresse email ?"
- **Validation** : Format email valide (regex)
- **Vérification automatique** : Recherche dans la base `users_table`
- **Si utilisateur existant** → étape `password`
- **Si nouvel utilisateur** → étape `signup`

#### Étape 3a : Connexion utilisateur existant (`password`)
- **Message de Neiji** : "Bonjour ! Je vous reconnais. Quel est votre mot de passe ?"
- **Input** : Type password (masqué)
- **Authentification** : `supabase.auth.signInWithPassword()`
- **Succès** → Redirection vers `/protected/chat`
- **Échec** → Nouveau tentative

#### Étape 3b : Inscription nouvel utilisateur (`signup`)
- **Message de Neiji** : "Je ne vous connais pas encore ! Créons votre compte. Choisissez un mot de passe sécurisé (au moins 8 caractères avec lettres et chiffres)."
- **Validation mot de passe** :
  - Minimum 8 caractères
  - Contient lettres ET chiffres
- **Création compte** : `supabase.auth.signUp()`
- **Succès** → Redirection vers `/protected/chat`

## Pages protégées

### Redirection automatique
- Toute tentative d'accès à `/protected/*` sans authentification
- Redirection vers `/auth` avec flux conversationnel
- Après authentification réussie → redirection vers la page demandée

### Mode développeur
- Toggle "Dev Mode" dans le coin supérieur pour bypass l'authentification
- Utile pendant le développement
- Activé via le composant `DevModeToggle`

## Composants techniques

### `AuthChat`
- Composant principal gérant la logique conversationnelle
- Utilise les mêmes composants `BotMessage` et `UserMessage` que le chat principal
- Input personnalisé `AuthInput` avec support password
- États : `welcome`, `email`, `password`, `signup`

### `AuthInput`
- Input spécialisé pour l'authentification
- Support type `password` pour sécurité
- Style cohérent avec le reste de l'application
- Gestion des états disabled/loading

## Avantages du système

1. **Expérience naturelle** : L'authentification se fait via conversation, cohérent avec l'ADN du produit
2. **Design unifié** : Même interface que le chat principal
3. **Guidage intelligent** : Neiji guide l'utilisateur à chaque étape
4. **Validation temps réel** : Feedback immédiat sur les erreurs
5. **Flexibilité** : Possibilité d'utiliser le chat en mode invité
6. **Sécurité** : Validation côté client ET serveur, mots de passe masqués

## Configuration technique

### Base de données
- Table `users_table` dans Supabase
- Authentification gérée par Supabase Auth
- Migration consolidée dans `0000_regular_stellaris.sql`

### Routing
- `/chat` : Chat public (mode invité)
- `/auth` : Authentification conversationnelle
- `/protected/*` : Pages nécessitant authentification

### États et navigation
- État global géré dans chaque composant
- Redirections automatiques après authentification
- Préservation de l'URL de destination souhaitée
