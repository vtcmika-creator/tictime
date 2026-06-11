# Déploiement TicTime — GitHub Pages + Firebase

## 1. Mettre en ligne sur GitHub Pages

1. Crée un nouveau dépôt sur GitHub (ex. `tictime`), public.
2. Pousse le contenu du dossier TicTime :
   ```bash
   cd TicTime
   git init
   git add index.html DEPLOIEMENT.md
   git commit -m "TicTime v3.0"
   git branch -M main
   git remote add origin https://github.com/TON_USER/tictime.git
   git push -u origin main
   ```
3. Sur GitHub : **Settings → Pages → Source : Deploy from a branch → main / (root)** → Save.
4. L'app sera accessible sous `https://TON_USER.github.io/tictime/` après ~1 minute.

> GitHub Pages fournit le HTTPS, indispensable pour la connexion Google de Firebase (qui ne fonctionne pas en `file://`).

## 2. Configurer Firebase

### Créer le projet (ou réutiliser un existant)

1. [Console Firebase](https://console.firebase.google.com) → **Ajouter un projet**.
2. **Paramètres du projet → Vos applications → Ajouter une application Web** (`</>`).
3. Copie l'objet `firebaseConfig` affiché et remplace les valeurs `VOTRE_...` dans `index.html` (bloc `// ---------- FIREBASE` en haut du script).

### Activer l'authentification Google

1. **Build → Authentication → Get started → Sign-in method**.
2. Active **Google**, choisis un email de support, enregistre.
3. Dans **Authentication → Settings → Authorized domains**, ajoute :
   - `TON_USER.github.io`

### Créer Firestore et sécuriser

1. **Build → Firestore Database → Créer une base de données** (mode production, région `europe-west`).
2. Onglet **Règles**, remplace par :
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```
   → Chaque utilisateur ne peut lire/écrire que son propre document. Publie.

## 3. Utilisation

- Menu **☁️ Cloud** dans l'app : connexion Google, puis **Sauvegarder** / **Restaurer**.
- La sauvegarde stocke l'historique des sessions + le profil dans `users/{uid}`.
- La restauration fusionne les sessions (pas de doublons) et remplace le profil.
- Tant que `firebaseConfig` contient les valeurs `VOTRE_...`, le cloud est désactivé et l'app fonctionne normalement en local.

## 4. Mises à jour

Chaque `git push` sur `main` redéploie automatiquement GitHub Pages (~1 min). Pense à vider le cache du navigateur mobile si l'ancienne version persiste (ou Ctrl+F5).
