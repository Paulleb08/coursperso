# Prof Perso

Professeur particulier, gratuit, en deux versions :

- **Site autonome** : https://paulleb08.github.io/coursperso/ — IA gratuite qui tourne dans ton navigateur (WebLLM, modèle Qwen 2.5) et lecture des photos par OCR (Tesseract.js). Rien à installer, aucun compte, tes cours restent sur ton appareil. Demande Chrome/Edge récent ou Safari 26.
- **Version claude.ai** : https://claude.ai/artifact/RngQoyyCCCM1Tn1UGktScT — utilise ton abonnement Claude (meilleure qualité, import Google Drive).

- **Matières** : chaque matière a ses cours et ses fiches de révision.
- **Ajouter un cours** : photos ou PDF (20 images max), texte collé, ou documents Google Drive (tes sources NotebookLM).
- **Leçons en blocs** avec 3 exercices inédits ; réponses cachées derrière un double toucher.
- **Correction sur photo** de ta réponse, note sur 10 ; « explique plus simplement » ; « d'autres exercices ».
- **Flashcards et quiz** (QCM, questions / réponses, relie les points) (onglet « S'entraîner ») sur quelques cours ou toute la matière, avec score.
- **Questions sur le cours** (comme NotebookLM) et **fiches de révision** sur quelques cours ou toute la matière.
- **Téléphone** : barre d'onglets en bas (Cours, Ajouter, Fiches).

À la première action, Claude te demande d'autoriser la page. L'usage compte sur ton abonnement Claude.
NotebookLM n'a pas d'API publique : importe les mêmes documents depuis Google Drive (connecteur claude.ai) ou colle ton guide d'étude.
Le cours est gardé dans ton navigateur (localStorage).

Site : `sh scripts/build-site.sh` fabrique `_site/` ; GitHub Actions le publie sur GitHub Pages à chaque push.
Test (IA simulée) : `node tests/e2e.js` (nécessite Playwright).
