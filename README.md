# 🎵 K-POP UNITED

**The Ultimate K-Pop Community Platform**

[![GitHub license](https://img.shields.io/github/license/signalmada-beep/kpopunited)](https://github.com/signalmada-beep/kpopunited/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/signalmada-beep/kpopunited)](https://github.com/signalmada-beep/kpopunited/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/signalmada-beep/kpopunited)](https://github.com/signalmada-beep/kpopunited/network)
[![GitHub issues](https://img.shields.io/github/issues/signalmada-beep/kpopunited)](https://github.com/signalmada-beep/kpopunited/issues)

---

## 📝 Description

K-POP UNITED est une plateforme sociale dédiée aux fans de K-Pop du monde entier. Connectez-vous avec d'autres fans, partagez votre passion, et restez informé des dernières nouvelles et événements de l'univers K-Pop.

---

## ✨ Fonctionnalités

### 🔐 Authentification
- Inscription / Connexion avec Email et Mot de passe
- Connexion avec Google OAuth
- Réinitialisation du mot de passe
- Vérification d'email
- Session persistante

### 📝 Publications (Posts)
- Création de posts avec texte, images et vidéos
- Réactions (Like, Love, Haha, Wow, Sad, Angry, Stan, Bias, etc.)
- Commentaires et réponses
- Partage et sauvegarde de posts
- Filtrage par catégorie (Artists, Groups, Events, Trending, Latest)
- Algorithm "For You" personnalisé

### 💬 Messagerie
- Messages en temps réel
- Conversations individuelles et de groupe
- Envoi d'images et de fichiers
- Réactions aux messages
- Statut en ligne / hors ligne
- Notifications de messages

### 📸 Stories
- Création de stories photo et texte
- Visualisation de stories
- Réactions et réponses
- Stories éphémères (disparaissent après 24h)

### 🎫 Événements
- Création et gestion d'événements
- Participation (Going / Interested)
- Calendrier des événements K-Pop
- Favoris et notifications

### 👥 Groupes
- Création et gestion de groupes
- Publications dans les groupes
- Fandoms et communautés

### 👤 Profil
- Photo de profil et photo de couverture
- Bio et informations personnelles
- Statistiques (posts, followers, following)
- Badges de niveau (Fan, Légende, etc.)
- Paramètres de confidentialité

### 🔔 Notifications
- Notifications en temps réel
- Likes, commentaires, mentions, follows
- Événements et partages
- Paramètres de notification personnalisables

### 🌙 Thème
- Mode sombre / clair
- Système automatique

### 📱 Responsive
- Optimisé pour mobile, tablette et desktop
- PWA (Progressive Web App) - installation possible

---

## 🛠️ Technologies

### Frontend
- **React 18** - Framework UI
- **TypeScript** - Typage statique
- **Vite** - Build tool
- **CSS Vanilla** - Styles personnalisés
- **Font Awesome** - Icônes

### Backend & Services
- **Firebase Authentication** - Gestion des utilisateurs
- **Firestore** - Base de données NoSQL en temps réel
- **Firebase Storage** - Stockage des images et fichiers
- **Firebase Hosting** - Hébergement

### Outils de développement
- **ESLint** - Linting du code
- **Git** - Versionnement

---

## 🚀 Installation

### Prérequis
- Node.js (v18 ou supérieur)
- npm ou yarn
- Git

### Étapes d'installation

```bash
# 1. Cloner le projet
git clone https://github.com/signalmada-beep/kpopunited.git
cd kpopunited

# 2. Installer les dépendances
npm install

# 3. Créer le fichier .env (copier depuis .env.example)
cp .env.example .env

# 4. Configurer les variables d'environnement (voir ci-dessous)

# 5. Démarrer en mode développement
npm run dev