# Tuto : mettre ta clé API

## 1. Créer la clé
1. Va sur https://console.anthropic.com → **Settings → API Keys** → **Create Key**.
2. Ajoute un peu de crédit (**Billing**). Copie la clé (`sk-ant-...`) : elle ne s'affiche qu'une fois.

## 2a. Utiliser le prof (le plus simple)
1. Télécharge `index.html` (GitHub → branche `claude/zen-davinci-tj5rsh` → `index.html` → *Download raw file*).
2. Ouvre-le dans ton navigateur, colle la clé dans **« Clé API Claude »** → « ✅ Clé enregistrée ».
C'est tout : la clé reste dans ce navigateur.

## 2b. Faire tester par Claude Code (version discussion, claude.ai/code)
Ne colle **jamais** la clé dans le chat. À la place :
1. Dans la session, clique sur le nom de l'**environnement** (en haut) → **Edit**.
2. Dans **Network secrets** / **Environment variables**, ajoute :
   `ANTHROPIC_API_KEY` = ta clé `sk-ant-...` → **Save**.
3. Démarre une **nouvelle session** sur ce dépôt (la clé n'est visible que dans les nouvelles sessions).
4. Écris : *« lance `node tests/live.js` et montre-moi le résultat »*.
   Le script restructure un mini-cours, réexplique, génère des exercices et corrige une photo de copie avec le vrai Claude. Il affiche `LIVE OK` si tout marche.

## Sécurité
- Si la clé fuit : supprime-la dans la console Anthropic et crée-en une autre.
- Chaque action du prof coûte quelques centimes (modèle Opus 5.5).
