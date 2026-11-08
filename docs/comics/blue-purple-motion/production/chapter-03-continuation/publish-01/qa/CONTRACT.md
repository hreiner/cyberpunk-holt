# Contre-revue indépendante de publication v10

Préparation du 8 novembre 2026. Cette revue porte sur le lecteur statique réellement
servi à `/cyberpunk-holt/comics/blue-purple/v10/`, puis sur la même route Internet.
  Le paquet et son moteur appartiennent aux autres agents ; aucun fichier sélectionné
n'est modifié par ces outils. L'exécution attend leur feu vert.

## Sources et paquet

- Source native v10 : SHA256
  `d180993fd326d8d2640e1b11d4b4a09718a5fa96a8055efd62e4c717078301ce`.
- Les 317 dépendances du gel `motion-03/SELECTION.json` doivent rester identiques.
  Le moteur 1.3.0 est conservé dans sa copie de référence, même si le lecteur web évolue.
- Couverture +21 pages, 99 voix, durée 584,3 s et préfixe de 238,6 s.
- La vérification du paquet utilise uniquement les fichiers livrés et les fonctions
  pures du moteur ; elle ne lance ni FFmpeg, ni export, ni fournisseur, et ne lit
  aucun média dans `art-masters/`. Les dérivés web sont reliés aux sources par le
  rapport de packaging, sans assimiler conversion audio et identité des octets.
- Les chemins consommés, JS/CSS, polices et licences restent dans le paquet. Les
  champs documentaires de provenance ne sont pas des dépendances HTTP du lecteur.

## Parcours réel

L'ouverture directe sans paramètre doit montrer la couverture et permettre Lire
avant le chargement des derniers médias. La capture réseau relève les erreurs HTTP,
requêtes hors paquet et fournisseurs externes. Le contexte de chaque parcours est
neuf ; le navigateur ne bénéficie pas du cache d'une revue précédente.

Un parcours froid rejoint la carte16, le tir/bandes17, l'eau20 et la porte21, puis
enchaîne plusieurs seeks rapides. Le dernier choix doit gagner sans image, lettres,
voix ou reprise de lecture appartenant à une ancienne préparation. Une requête média
est volontairement interrompue dans un autre contexte : erreur récupérable et
réessai au même endroit, sans rechargement complet ni avance du récit en attente.

API1.4.0 figée : `seek(t)` renvoie un nombre. Après un seek froid, attendre
`whenPageReady(index)` ; `loadingState` expose la destination en attente tandis que
la position reste au dernier dessin prêt. `retry()` conserve l'intention pause/lecture.
Pour des captures manuelles arbitraires, `ensureAllPagesReady()` prépare toutes les
pages ; un seek dans une page déjà prête reste synchrone.

Vérifier pause/reprise/mute, arrêt sonore à la fin, indépendance de la phase ambiante
en pause et immobilité des actions. OFF restitue le master complet ; le mode manuel
garde1280×720 et le seek déterministe. Les miniatures initiales18/21 montrent le début
des actions, avec les lettres correspondantes. Les trois POI16 doivent être deux
jaunes et un vert, sans repère HOLT.

## Preuves et limites

Une seule manche de captures décisives desktop/mobile, pages18/21 initiales et phases
16/17/20/21, est ouverte personnellement avant verdict graphique. Des assertions ou
mesures de média ne prouvent aucune écoute humaine. Une réussite locale ne vaut pas
publication Internet ; les deux URL et rapports sont consignés séparément.

`audit-native.cjs` produit l'inventaire de conservation. `check-package.cjs` est un
contrôle Node autonome du paquet. `check-published.cjs` exécute les parcours HTTP et
Playwright après le feu vert. Les sorties restent dans les dossiers QA attribués,
dans un sous-dossier neuf par exécution. Les commandes exactes et résultats seront
ajoutés à `QA.md` au moment de l'exécution.
