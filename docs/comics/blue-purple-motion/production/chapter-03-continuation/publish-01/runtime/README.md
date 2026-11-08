# Moteur de publication 1.4.0 — gelé

Contrat de chargement progressif opt-in. Le moteur 1.3.0, ses 14 fichiers et les dix
fichiers de tests présents au début de cette mission sont copiés et vérifiés avant
édition dans `art-masters/.../publish-01/runtime/source-1.3.0/` ; journal complet
`BASELINE-1.3.0.json`. La copie 1.4.0 et ses 14 SHA vivent séparément dans
`source-1.4.0/` et `SELECTION-1.4.0.json`.

## Données

```json
{
  "kind":"motion-comic-sequence",
  "schemaVersion":1,
  "version":1,
  "title":"Blue Purple",
  "loadingMode":"progressive",
  "pages":[{"id":"cover","manifest":"pages/cover.json","thumbnail":"thumbnails/cover.webp"}]
}
```

`loadingMode` absent ou `eager` conserve le chargement complet et l’API historique.
Seule la valeur `progressive` active le nouveau chemin. `pages[].thumbnail` est
facultatif, relatif au descripteur de séquence, et doit représenter **l’état initial**
du récit, jamais un master montrant un événement futur. Il est validé comme chemin
local et inclus dans `readDocument().files`, l’allowlist et les snapshots du renderer.
Sans miniature externe, une page froide affiche une vignette neutre jusqu’à sa visite.

Le lecteur accepte `document.documentElement.dataset.manifest` comme manifeste par
défaut si le paramètre de requête `manifest` est absent. Le HTML local du moteur est
conservé ; le paquet public peut fournir `<html data-manifest="chapter.json">`.

## Lecture et attente

Les manifestes légers sont lus pour calculer la chronologie entière. La couverture,
ses dessins/calques et ses voix éventuelles sont préparés en premier ; le backing AAC
commence avec `preload="metadata"`. Les 99 éléments de voix sont créés avec
`preload="none"`, puis seuls ceux des pages préparées passent en `auto`.

Une file déduplique les demandes, charge deux pages au maximum et donne priorité à la
destination demandée. Les images internes d’une page sont bornées à quatre demandes,
ses voix à deux. Le préchargement se limite aux pages précédente/suivante de la page
visitée ; il ne parcourt pas récursivement tout le livre. Les miniatures utilisent une
file légère séparée de quatre demandes. Les attentes de média sont bornées à 20 s et
une panne libère la file ; une nouvelle demande peut réessayer.

Pendant une navigation froide, **position, récit, ambiance et audio restent figés sur
le dernier dessin prêt**. Le texte français « Chargement de page… » est visible dans
le lecteur. La destination devient courante quand ses dessins/calques/voix de page
et l’audio utile à cette position sont prêts. La lecture reprend selon la dernière
intention ; Pause pendant l’attente empêche toute reprise automatique. Un seek plus
récent invalide la reprise et les anciennes promesses `play()` du précédent.

Une erreur maintient le dernier dessin valide et propose Lire ou une autre page.
Lire réessaie et démarre ; `retry()` conserve l’intention pause/lecture déjà demandée.
Les callbacks de métadonnées des voisins ne réinitialisent pas le backing courant.
Un son déjà positionné pendant l’attente n’est pas forcé vers le même instant une
seconde fois, ce qui relançait inutilement un seek AAC.

## API publique

- `seek(t): number` renvoie immédiatement le temps demandé, borné dans la durée.
  En mode eager ou sur une page chaude en rendu manuel, il reste synchrone. Sur une
  page froide, `position` reste au dernier dessin prêt jusqu’à la fin de l’attente.
- `whenPageReady(index?): Promise<{index}>` prépare une entrée et attend aussi la
  navigation en cours vers cette entrée. Sans argument, il vise la destination en
  attente, sinon la page courante. Les indices sont ceux de `pages` : couverture=0,
  page 1=1 lorsqu’une couverture existe. Une erreur rejette la promesse.
- `ensureAllPagesReady(): Promise<{pages}>` est l’option explicite pour préparer toutes
  les pages et voix de page avant une inspection ou des captures libres.
- `retry(): Promise` réessaie une destination en erreur ; sans erreur, attend la page.
- `buffering: boolean` expose l’attente. `playing` décrit la lecture effective,
  `loadingState.playRequested` conserve l’intention pendant l’attente.
- `loadingState` renvoie `{mode,buffering,playRequested,pageIndex,targetTime,error,pages}`.
  Son `pageIndex` est la destination en attente, tandis que l’ancien getter `pageIndex`
  suit toujours la position effectivement dessinée. Chaque entrée de `pages` contient
  `{index,status,error}` avec `idle`, `queued`, `loading`, `ready` ou `error`.

Pour capturer une page froide :

```js
await motionComic.whenPageReady(0);
motionComic.setRenderMode(true);
motionComic.seek(targetSeconds);
await motionComic.whenPageReady();
const png = document.querySelector('#screen').toDataURL('image/png');
```

Un `draw(t)` manuel vers une page froide sans attente lève une erreur française au lieu
de capturer un autre dessin. `render.cjs` attend désormais `whenPageReady` après chaque
seek et pour son aperçu à zéro. Le calcul `i/fps`, le cadre 1280×720 et les anciennes
séquences eager sont conservés. Ses snapshots rebasent également les miniatures.

## Vérifications effectives

Les 43 tests historiques et trois tests nouveaux de schéma/file/retry passent. La
suite partagée finale, enrichie simultanément par le lot d’installation, compte
58 tests : 57 passent, un contrôle de jonction est sauté parce que cet environnement
Windows ne peut pas créer les liens nécessaires.

Preuve navigateur finale :
`art-masters/motion-comics/blue-purple/chapter-03-continuation/publish-01/runtime/qa-v7/`.
Les 17 contrôles passent : démarrage sans autoload des 99 voix, miniature légère,
seek froid numérique et gel, pause pendant l’attente, seeks rapides avec dernière
destination gagnante, panne d’image injectée puis retry, raccord froid avec reprise,
fin exacte, commandes mobiles et capture native froide de la page 21 en 1280×720.
Les pixels pageCanvas de cette même scène sont identiques entre eager/progressive
avec les mêmes horloges et le même échauffement Canvas. La vérification séparée
`qa-v7-default-manifest.json` prouve le démarrage par data-manifest sans query.

Vues réellement ouvertes : buffering et message visible, panne/retry, mobile, capture
native 1280×720. Les premières traces restent conservées : v1–v3 ont détecté la reprise
audio interrompue et le seek forcé redondant ; v4 conserve les 1 904 pixels de différence
GPU/CPU avant échauffement comparable. V5–v7 passent sans abaisser de seuil. Le PNG
d’export v7 provient du canvas natif ; les anciennes captures DOM restent des preuves UI.

Les empreintes confirment que le JSON v10, ses 317 dépendances et les 195 dépendances
v9 avec son manifeste sont intacts. Aucun film long, service externe ni nouvelle voix
n’a été produit dans cette mission. La contre-revue du paquet AAC/WebP appartient au
lot de publication ; ce gel autorise sa copie sans déclarer sa mise en ligne réalisée.
