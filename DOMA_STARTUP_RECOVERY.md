# DOMA / Bot-Hosting — remise en ligne sécurisée

## Symptôme

La console Bot-Hosting affiche `Please type your WhatsApp number` après avoir lancé `node main.js`. Cela indique que la session Baileys n'est **pas enregistrée** dans `session/creds.json` ou n'est pas lisible. Le conteneur démarré ne prouve pas que WhatsApp est connecté.

Bug source corrigé dans `main.js` : une variable `let phoneNumber` locale masquait le numéro de configuration et provoquait la saisie obligatoire, même lorsqu'un numéro avait été fourni ailleurs.

## Étapes dans Bot-Hosting

1. **Ne supprime jamais le répertoire `/home/container/session`.** Ses fichiers sont les clés et informations de connexion WhatsApp.
2. Dans le terminal, pour contrôler la présence du fichier sans révéler de secret :

   ```sh
   test -s /home/container/session/creds.json && echo 'Session présente' || echo 'Session absente ou vide'
   ```

3. Déployer la version corrigée de `main.js` sur **le serveur DOMA uniquement**, depuis ce dépôt GitHub (via synchronisation du dépôt ou upload manuel du fichier). Une modification GitHub ne remplace **pas** automatiquement les fichiers sur Bot-Hosting.
4. Pour un démarrage automatique **sans prompt** quand aucune session n'est valide, configurer la variable `DOMMA_PHONE_NUMBER` dans le serveur Bot-Hosting avec le **vrai numéro WhatsApp** du bot, indicatif inclus (sans espaces ni `+`). Ne pas enregistrer ce numéro dans GitHub si l'on souhaite le garder privé. Le code accepte aussi `WHATSAPP_PHONE_NUMBER`.
5. Redémarrer le processus ; si la session existe et est valide, le bot doit afficher `Connected to =>` sans demander de numéro. Si elle est absente ou révoquée, DOMA émettra un **code d'appairage**. Dans WhatsApp : **Appareils connectés → Connecter un appareil → Associer avec un numéro de téléphone**, puis saisir ce code.
6. Une fois WhatsApp réellement connecté, vérifier que le **worker Bot Connect DOMMA** tourne toujours dans son service Pterodactyl dédié. Le site ne lit pas le statut du processus Node : son catalogue Supabase dépend d'un appel régulier et authentifié à `bot_connect_worker_poll` (délai de fraîcheur **35 secondes**). Ne jamais falsifier `worker_seen_at` dans la base.
7. Depuis le site, vérifier que **DOMMA redevient en ligne**, puis tester une demande d'appairage. Si WhatsApp est connecté mais DOMMA reste absent du site, rétablir le worker `domma` avec sa configuration existante et examiner ses logs : ce problème est distinct de la session Baileys.

## Ce qui a été fait et ce qui ne l'a pas été

- Fait : correction du code démarrage dans GitHub, variable env et chemin persistant pour les fichiers de session.
- Non fait : aucun accès direct à la console ou aux fichiers réels de Bot-Hosting, aucun redémarrage du worker distant, aucune opération sur les sessions personnelles WhatsApp.
- Ne pas coller le contenu du fichier `session/creds.json`, la clé de worker, un jeton ou un QR code dans une discussion publique.
