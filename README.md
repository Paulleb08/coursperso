# Prof Perso

Professeur particulier qui tourne avec ton compte Claude (claude.ai), **sans clé API ni jeton payant en plus**.

**Ouvre l'app :** https://claude.ai/artifact/RngQoyyCCCM1Tn1UGktScT

- **Matières** : chaque matière a ses cours et ses fiches de révision.
- **Ajouter un cours** : photos ou PDF (20 images max), texte collé, ou documents Google Drive (tes sources NotebookLM).
- **Leçons en blocs** avec 3 exercices inédits ; réponses cachées derrière un double toucher.
- **Correction sur photo** de ta réponse, note sur 10 ; « explique plus simplement » ; « d'autres exercices ».
- **Questions sur le cours** (comme NotebookLM) et **fiches de révision** sur quelques cours ou toute la matière.
- **Téléphone** : barre d'onglets en bas (Cours, Ajouter, Fiches).

À la première action, Claude te demande d'autoriser la page. L'usage compte sur ton abonnement Claude.
NotebookLM n'a pas d'API publique : importe les mêmes documents depuis Google Drive (connecteur claude.ai) ou colle ton guide d'étude.
Le cours est gardé dans ton navigateur (localStorage).

Test (Claude simulé) : `node tests/e2e.js` (nécessite Playwright).
