# L'héritage du chapitre 1

Ce que le chapitre 2 reçoit : où en est l'histoire, ce que le joueur a vécu, et ce que le
dossier du candidat a retenu. Résumé volontairement court ; les sources font foi
([`../design/03-CHAPTER-1.md`](../design/03-CHAPTER-1.md),
[`../design/04-CHARACTERS.md`](../design/04-CHARACTERS.md),
[`../design/06-SCORING-DOSSIER.md`](../design/06-SCORING-DOSSIER.md)).

## Où en est l'histoire

Le chapitre 1 est **le dernier jour à l'académie HOLT**, dans les Badlands. Franklyn (17 ans,
apprenti netrunner, le joueur) et sa promotion — la **première** de l'académie — passent un
examen écrit, un exercice tactique au taser dans un centre d'examen désaffecté en périphérie
de Night City, puis le bal de promo.

La dernière ligne du chapitre : **demain commencent les stages**, et cette promotion sera la
première à sortir des murs. Le discours du directeur l'a annoncé : une évaluation réelle, sur
le terrain, devant des instructeurs qui ne les connaissent pas. Les cadets n'ont jamais vu
Night City autrement qu'en photo.

Ce que le joueur a vu du monde extérieur : le trajet en fourgon (épaves, graffitis, un
campement de pillards au loin) et le centre d'examen. Rien de plus — c'est voulu
([`../design/01-SETTING.md`](../design/01-SETTING.md)).

## Ce qui varie d'une partie à l'autre

| Élément | Valeurs possibles | Où c'est gardé |
|---|---|---|
| **Coéquipiers** de Franklyn à l'exercice | deux parmi John, Zachary, Letitia, Grover (cinq compositions atteignables) ; Abigail toujours en face | entrée `ch1.tirage.choix`, étiquette `equipe-bande` ou `equipe-tactique` |
| **Affinités** avec les cinq cadets | −3 à +3 ; départ John +3, Abigail +2, Zachary +2, Letitia +1, Grover −1 | `dossier.affinities` |
| **Doctrine** exprimée à l'examen | légaliste, pragmatique, idéaliste, corporatiste (plusieurs possibles) | étiquettes |
| **Tempérament** | cynique, distrait, réservé, direct, rebelle, bluffeur | étiquettes |
| **Triche** à l'examen | aucune, `tricheur` (pas pris), `pris-a-tricher` | étiquettes |
| **Notes** | écrite /6 (`copie-brillante` ≥ 5, `copie-faible` ≤ 2), pratique /20 avec mention | `writtenScore`, `practicalScore` |
| **Parcours** du centre d'examen | `sauveteur`, `curieux`, `renseignement`, `imprudent-salle-3`, `prudent` | étiquettes |
| **Issue du combat** | `vainqueur-exercice` / `defaite-exercice`, `protecteur`, `equipe-decimee`, `offensif`, `rapide` / `lent` | étiquettes |
| **Réponses** aux six questions | la doctrine de chaque réponse | entrées `ch1.exam.question1` à `6` |
| **Chance** dépensée | cumul | entrée `ch1.chance` |

Le vocabulaire complet et fermé des étiquettes est dans
[`06-SCORING-DOSSIER.md`](../design/06-SCORING-DOSSIER.md#vocabulaire-des-étiquettes-du-chapitre-1).

### Les dettes explicites envers le chapitre 2

- **`loyal-bande` et `solitaire`** sont posées au chapitre 1 et **lues nulle part** : elles
  ont été réservées pour « après le stage ». Le chapitre 2 doit les lire.
- Toutes les autres étiquettes sont déjà lues au bal. Les relire au chapitre 2 est un plus,
  pas une obligation — mais c'est ce qui fait vivre le pilier « la trace ».
- Ce qui est **volatil** (drapeaux, compteurs, tempo, matériel d'équipe, Chance restante,
  pièces découvertes) **ne traverse pas** : il meurt avec le chapitre.

## Les mystères posés, non résolus

Le chapitre 1 les fait affleurer sans rien expliquer. Le chapitre 2 peut en développer,
en laisser dormir, jamais les contredire sans le décider.

1. **Ce que Letitia cherchait dans la salle d'interface** — et Franklyn l'a cachée dans les
   conduits ce jour-là ; ils n'en ont jamais reparlé.
2. **Les niveaux cachés du compte de John**, et pourquoi John, sans neuroport, est terrifié
   par la salle d'interface.
3. **La simulation étrange** qui revient à Franklyn depuis ses dix ans.
4. **Ce qu'il y a derrière la turbine**, au-delà de l'annexe du laboratoire.

## Les secrets de Franklyn (connus du joueur, pas des autres)

- Il utilise **le compte d'interface de John**, cloné, depuis l'enfance. John l'ignore.
- Il passe par les conduits grâce à **l'outil d'Abigail**, à condition de ne pas dépasser
  l'annexe — **promesse rompue** (poussière bleue, turbine, égratignure maquillée en chute).
- Il est **accro aux « shoots »** des niveaux cachés ; des dossiers vides s'accumulent dans
  son neuroport. Mécaniquement : défaut *En manque* (−1 SF sans sa séance d'interface).
- La scène facultative de la salle d'interface (`ch1.interface`) donne au joueur un aperçu
  de cette attirance, sans rien poser au dossier.

## Les relations de départ

- **Bande de Zachary** : Zachary (meneur), Abigail, Franklyn (et Dwight, Julia, figurants).
- **Trio critique** : Grover, Letitia, Théodore (figurant).
- **John** : solitaire, proche du seul Franklyn.
- **Rivalité** Zachary / Grover.

Orthographe arrêtée : identifiant `zachary`, nom affiché *Zachary* (les références
visuelles écrivent « Zacharie »).

## Les questions que le chapitre 2 devra trancher

Posées par la feuille de route (« Après le chapitre 1 »), à régler en phase 1 pour le fond,
en phase 2 pour la forme :

- **Qui est dans le chapitre 2 ?** Le stage sépare-t-il la bande ? Le joueur retrouve-t-il
  ses coéquipiers de l'exercice, ou d'autres ?
- **Le système de règles tient-il avec de vrais enjeux vitaux ?** Hors examen, le taser et
  l'absence de points de vie (ADR 0003) ne vont plus de soi.
- **Comment le chapitre 2 récupère-t-il le dossier ?** Export JSON du chapitre 1 relu au
  démarrage, sauvegarde commune, ou dossier « type » pour qui commence au chapitre 2 ?
