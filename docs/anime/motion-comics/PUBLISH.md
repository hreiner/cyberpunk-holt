# Publier le lecteur sur Internet

La livraison locale, le push et le déploiement sont trois résultats distincts. Une
demande explicite de publication autorise leur enchaînement ; une simple revue ou
production locale ne publie pas automatiquement le projet.

## Source et paquet web

Partir du suivi courant et de la sélection exacte, puis enregistrer l'acceptation
du propriétaire dans un nouveau jalon, sans réécrire une archive gelée. Conserver
les masters et les chronologies ; le paquet web est une dérivation identifiée.

Le lecteur est servi par le GitHub Pages existant de ce dépôt, sous
`/cyberpunk-holt/comics/blue-purple/`. Vite copie `public/` dans `dist/`.
Le paquet versionné contient HTML/CSS/JS, polices locales et licences, manifeste
d'ensemble et pages, miniatures initiales, images et son nécessaires au lecteur.
Aucun chemin consommé ne dépend de `art-masters/`, du disque du producteur ou de
`localhost`. Les chemins restent relatifs au paquet pour respecter le préfixe Pages.

Le packager `anime/motion-comics/publish.cjs` part de la sélection approuvée et
établit la correspondance source/SHA → fichier web/SHA. Les images WebP sans perte
gardent résolution et alpha ; SVG, polices et prises déjà compactes sont copiés.
Les WAV sont encodés pour le web, avec durées et niveaux contrôlés, sans accélérer
les voix ni appliquer deux fois les enveloppes du backing prémixé.

La couverture doit devenir lisible sans décoder toutes les pages. Le mode de
chargement progressif est explicite ; les anciens manifestes gardent leur mode
eager. Les sauts vers une page froide suspendent récit et audio jusqu'à disponibilité
de son dessin et de ses calques. Prévoir des miniatures initiales légères qui ne
révèlent ni bulle future, ni vitre brisée, ni porte déjà ouverte. Le chemin d'export
technique garde son attente explicite des médias.

## Stockage et construction

Le packager de cette livraison et le helper GitHub de `publish-01/` sont des outils
du jalonv10 : sélection, version et compteurs attendus y sont explicites. Pour un
nouveau lot, préparer sa propre configuration ou un nouveau script de production
depuis la nouvelle sélection, puis vérifier ses contrats. Changer seulement `--source`
en gardant le verrouv10 ne produit pas une nouvelle publication. Les commandes de
restauration ci-dessous reprennent volontairement la version courante ; elles ne
lancent pas la fabrication d'un prochain chapitre.

Les binaires web volumineux restent dans une GitHub Release versionnée. Le dépôt
contient les sources, la configuration et l'empreinte du paquet, et non les masters.
L'archive `tar.gz` est vérifiée par SHA avant restauration. Le build depuis un
checkout neuf doit pouvoir la récupérer sans clé privée et sans FFmpeg ; la
génération des dérivés depuis les masters est une opération de production distincte.

Commandes courantes depuis la racine :

```powershell
npm run comics:prepare
npm run comics:check
npm run build
```

`comics:prepare` réutilise un paquet local conforme ou restaure la release verrouillée.
Il n'écrase pas silencieusement un paquet divergent. `comics:check` vérifie le graphe,
les empreintes et la chronologie sans masters ni génération. Le build et le workflow
Pages utilisent le même mécanisme. Une nouvelle sélection utilise une nouvelle
version d'archive et une nouvelle empreinte, pas un remplacement silencieux.

Les arbres motion comics contenant des verrous SHA sont marqués `-text` dans
`.gitattributes` : leurs octets restent identiques entre checkout Windows et Linux.
Ne pas renormaliser les fins de ligne d'une source gelée après son empreinte.

## Publication et preuve

Avant commit, exécuter `npm run verify`, les tests du socle concernés et
`npm run workflow:check`. Avant push, inspecter les fichiers réellement ajoutés :
pas de jeton, archive de masters, livre de revue lourd ou document source original.
Les accès Git/GitHub existants restent en mémoire des outils ; aucun secret dans
les commandes enregistrées, fichiers suivis ou journaux de publication.

Tester le paquet construit sous le vrai préfixe du site, avec navigation froide,
pause/reprise, seek distant, voix/backing, mute, fin, numérotation et affichage mobile.
Comparer les moments décisifs au lecteur approuvé, pas seulement les réponses200.
Contrôler les erreurs de médias, le retry et les requêtes Range du son compressé.

Pousser les sources et la configuration validées, publier le paquet à l'empreinte
prévue puis déclencher le workflow Pages par le mécanisme du dépôt. Attendre son
résultat pour le commit exact. Vérifier ensuite l'URL publique, le manifeste et les
médias depuis une nouvelle session de navigateur. Un push réussi ou une page HTML200
seule ne prouve pas que le comics est lisible.

Actualiser les points d'entrée avec le commit, la release et son SHA, le run Pages,
l'URL effectivement vérifiée, les contrôles et les limites. Distinguer contenu
approuvé, moteur de publication et ancien moteur conservé dans l'archive locale.
La prochaine session part de ce suivi ; elle ne redemande pas une validation déjà
accordée sur la même sélection. Pour la livraison courante, voir [PROGRESS](PROGRESS.md).

Limites du service à recontrôler si le paquet change d'échelle :
[GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).
