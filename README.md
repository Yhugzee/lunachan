# Lunachan – Imageboard avec Panel Admin

## 🚀 Description

Lunachan est un imageboard anonyme inspiré des boards classiques, avec un **panel admin sécurisé (JWT)** pour gérer les threads (liste, édition de boards, suppression de threads, etc.). Le backend est assuré par les API Routes de Next.js et la persistance par MongoDB.

## 🔧 Stack & principales dépendances
- Next.js 15 (API routes + frontend React 19)
- MongoDB + Mongoose
- Authentification Admin par JWT (jsonwebtoken, bcrypt)
- Upload d’images via Cloudflare R2 (SDK S3 AWS + URLs pré-signées)
- Sass (SCSS) pour les styles
- Zod pour la validation
- Petit rate limit maison sur certaines routes sensibles

## ⚙️ Installation

### 1) Cloner & installer
```bash
git clone https://github.com/Yhugzee/lunachan
cd lunachan
npm install
```

### 2) Variables d’environnement
Le projet centralise et valide les variables côté serveur dans `src/lib/env.ts`. Créez un fichier `.env.local` pour le dev (le serveur tourne sur le port 4001) et `.env.production` pour la prod. Exemples:

`.env.local` (développement)
```
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority

# JWT pour l’admin
JWT_SECRET=change-me-dev

# URL publique du site (utile si nécessaire côté client)
NEXT_PUBLIC_SITE_URL=http://localhost:4001

# Cloudflare R2 (uploads)
R2_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxx
R2_ACCESS_KEY_ID=***************
R2_SECRET_ACCESS_KEY=***************
R2_BUCKET=lunachan
# Domaine public pour servir les images (avec protocole, sans slash final)
# Ex: https://pub-xxxx.r2.dev ou https://cdn.mondomaine.tld
R2_PUBLIC_DOMAIN=https://pub-xxxx.r2.dev

# Pour Next Image (next.config.ts attend l’hostname SEUL)
# Exemple: pub-xxxx.r2.dev
NEXT_PUBLIC_R2_PUBLIC_HOSTNAME=pub-xxxx.r2.dev

# Certaines routes admin de suppression utilisent un endpoint explicite
# (peut être dérivé de R2_ACCOUNT_ID: https://<ACCOUNT_ID>.r2.cloudflarestorage.com)
R2_ENDPOINT=https://xxxxxxxxxxxxxxxxxxxx.r2.cloudflarestorage.com
```

`.env.production` (production)
```
NODE_ENV=production
MONGODB_URI=...
JWT_SECRET=une-chaine-secrete-forte-en-prod
NEXT_PUBLIC_SITE_URL=https://lunachan.example.com

R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=...
R2_PUBLIC_DOMAIN=https://cdn.example.com
NEXT_PUBLIC_R2_PUBLIC_HOSTNAME=cdn.example.com
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

Notes importantes:
- `NEXT_PUBLIC_R2_PUBLIC_HOSTNAME` est utilisé par `next.config.ts` pour autoriser le domaine d’images distant.
- L’API `POST /api/upload/create-url` consomme `R2_BUCKET` et `NEXT_PUBLIC_R2_PUBLIC_HOSTNAME` pour renvoyer une URL de mise en ligne et une URL publique d’image.
- La suppression d’images côté admin utilise `R2_BUCKET`, `R2_ENDPOINT` et/ou `R2_PUBLIC_DOMAIN` pour retrouver la clé objet.

### 3) Lancer le projet
- Dev: `npm run dev` (http://localhost:4001)
- Build: `npm run build`
- Start (prod locale): `npm start` (port 4001)

## 🧪 Données de base & compte admin

- Seeder de boards par défaut:
```bash
npm run seed:boards
```
Cela crée/assure les boards: `b`, `tech`, `a`.

- Créer un compte admin:
```bash
# En prod (lit .env.production)
npm run create-admin
# En dev (lit .env.local)
npm run create-admin:test
```
Le script `scripts/createAdmin.ts` crée un utilisateur `admin` avec un mot de passe généré dans le script. Pensez à: 
- Modifier le mot de passe dans le script avant exécution OU
- Vous connecter une première fois et mettre en place votre propre gestion de mots de passe.

## 🔐 Panel Admin & Auth
- Connexion: `POST /api/admin/login` avec `{ username, password }` → renvoie `{ token }` (JWT, 7 jours).
- Les routes admin exigent le header `Authorization: Bearer <token>`.
- La page `/admin` stocke ce token dans un cookie `admin-auth` via js-cookie côté client.

Endpoints admin inclus:
- `GET /api/admin/boards` — lister les boards
- `PATCH /api/admin/board/[key]` — renommer / (dé)marquer NSFW / maj description
- `GET /api/admin/threads` — lister les threads
- `DELETE /api/admin/thread/[id]` — supprimer un thread et tenter la suppression des images R2 associées

## 🧩 Endpoints publics
- `GET /api/boards` — liste des boards
- `GET /api/boards/[key]/threads` — liste les threads d’un board
- `POST /api/boards/[key]/threads` — créer un thread (texte et/ou image)
- `POST /api/upload/create-url` — génère une URL pré-signée R2 pour uploader une image

## 🖼️ Images & Next Image
Le fichier `next.config.ts` déclare des `remotePatterns` pour autoriser les domaines R2:
- Tous les sous-domaines `*.r2.dev` et `*.r2.cloudflarestorage.com`
- Optionnellement l’`hostname` exact défini par `NEXT_PUBLIC_R2_PUBLIC_HOSTNAME`

Assurez-vous que `NEXT_PUBLIC_R2_PUBLIC_HOSTNAME` corresponde à votre domaine public d’images (sans protocole).

## 📦 Scripts NPM
- `dev` — lance Next en dev sur le port 4001
- `build` — build de l’app
- `start` — démarre l’app buildée (port 4001)
- `seed:boards` — seed des boards par défaut
- `create-admin` — crée un admin avec `.env.production`
- `create-admin:test` — crée un admin avec `.env.local`

## 🚀 Déploiement
- Front/Backend: Vercel (recommandé) ou toute plateforme Node compatible.
- Base de données: MongoDB Atlas (recommandé en prod).
- Stockage d’images: Cloudflare R2 (config via les variables ci-dessus). 

Sur Vercel, définissez les variables d’environnement de prod (cf. `.env.production`). Vérifiez que le domaine d’images public est bien autorisé par `next.config.ts` (via `NEXT_PUBLIC_R2_PUBLIC_HOSTNAME`).

## 🛠️ Dépannage
- "Token invalide": vérifiez `JWT_SECRET`.
- "DB connect error": vérifiez `MONGODB_URI` et la connectivité réseau.
- Images non affichées: vérifiez `NEXT_PUBLIC_R2_PUBLIC_HOSTNAME` et que l’URL publique correspond à `R2_PUBLIC_DOMAIN`.
- Échec suppression images: vérifiez `R2_BUCKET`, `R2_ENDPOINT` et les droits de vos clés R2.

---
Licence: MIT
