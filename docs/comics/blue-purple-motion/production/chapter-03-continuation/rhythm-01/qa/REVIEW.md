# Contre-revue du rythme v11 — 17 novembre 2026

**GO statique, lecteur natif et paquet web local.** Contrôle indépendant du retimer ;
aucun master, manifeste ou moteur modifié par le relecteur. L'URL Internet reste un
jalon séparé.
[Empreintes, contrôles et captures de cette revue](SUMMARY.json).

[Contrat](../TIMING.json) :584,3→491,9s, soit92,4s retirées. Couverture12s,
21pages narratives,99prises natives. Pages1–4 et9–21 : transitions0,4s ;5–8 :0,3s
conservées. Aucun segment de vue page automatique.

[Audit indépendant](audit.cjs) :69contrôles réussis. Le calcul attendu est redérivé
depuis les manifestesv10, sans appeler le retimer. Tous les verrous sourcesv10 sont
conformes ; dessins, lettres, régions protégées, pistes/locuteurs, tenues, attentes
et intervalles restent identiques. Les calques d'action gardent leur durée et leurs
clés relatives. Révélations/impacts suivent les nouvelles horloges.

Trois fenêtres lumineuses `neon` page15 traversent la caméra1→2 : leur durée est
réduite de0,45s avec cette transition. Leur fréquence reste inchangée ; il ne s'agit
pas d'un geste accéléré. Les durées des calques de capsule, tir, carte, chute et
porte restent natives.

[Parcours Edge](browser.cjs) :6contrôles réussis dans `qa/native-v2/report.json` des
masters. Les21frontières ont été sondées avant, à, puis0,02/0,39s après le raccord,
avec vérification du cadrage initial. Les transitions sont contrôlées à mi-course
et à leur fin. Lecture réellement lancée aux raccords1→2,8→9,16→17 et20→21 :
aucun retour en pleinepage. Vue page manuelle : pause et position conservées ; Lire
rend la case, la navigation quitte cet affichage. Pause, mute et fin passent.

Quatre captures ouvertes personnellement : première case9 en desktop et mobile,
vue page9 manuelle et dernière case21 mobile. Cadrages et bulles restent lisibles
selon le format du lecteur ; aucune bordure blanche ni élément coupé. Sur mobile
portrait, les cases panoramiques gardent les bandes noires usuelles, sans crop.

L'essai `native-v1` est conservé en échec de connexion avant tout contrôle navigateur
(serveur lancé dans le sandbox). `native-v2` utilise le serveur QA dédié50591 lancé
hors sandbox ; ce défaut technique n'a pas été effacé ni annoncé comme passage.

Paquet construit sous le préfixe réel :8contrôles réussis dans `qa/preview-v1`.
L'entrée canonique `http://127.0.0.1:50613/cyberpunk-holt/comics/blue-purple/`
redirige effectivement versv11, sans paramètre de manifeste. Identité et SHA du
contenu, `chapter.json` et des moteurs `core.js`/`reader.js` réellement servis
conformes ; PUBLICATION `81de45ac8f66c56a8394078324312547e6fd87cb87f55c2feaf38786a3696af3`.
Les mêmes raccords, caméras et commandes passent en mode progressif. Une nouvelle
session bloque le dessin21 : un saut froid suspend position et son jusqu'au
chargement, puis Lire reprend sur la première case21. Aucune erreur JS ou HTTP.
Les quatre captures correspondantes ont aussi été ouvertes personnellement,
avec avis favorable sur le cadrage du paquet web.

Limites : parcours ciblés, pas de lecture continue de8min12, aucune écoute humaine
du mix. Le son est vérifié par le lot audio. Les preuves binaires sont dans
`art-masters/motion-comics/blue-purple/chapter-03-continuation/rhythm-01/qa/`,
hors Git. Le serveur QA50591 a été arrêté ;50590 et le preview50613 restent gérés
par l'orchestrateur. Le verdict HTTPS sera consigné après le déploiement Pages.
