# Conduite sonore — motion01

7 novembre 2026. Dessins/textes de révision05 validés ; temps définitifs fournis par
l'intégrateur après mesure des voix. Aucun ancien média n'est écrasé. Les backings
contiennent musique, ambiances et effets, sans voix ; lecteur `gain:1, preMixed:true`.

| Pages | Musique et espace | Accents narratifs |
| --- | --- | --- |
| 9–11 | Neon discret, ville ouverte puis accès industriel | Borne : clics puis confirmation intégrée à l'écran ; présence des installations, aucune alarme inventée. |
| 12–13 | Neon plus contenu, ventilation/cabine, retour à l'atrium | Réservation dans l'implant : réponse brève intérieure ; cabine mécanique douce, arrivée et verrou distincts. |
| 14–15 | Neon espacé, ventilation de boutique | Contacts/outils fins d'Abigail et Franklyn ; connecteur qui prend ; fermeture lourde unique de capsule, puis alimentation. |
| 16 | Pressure retenu pendant le déverrouillage, ouverture courte ensuite | Traitement neural interne bref, séparé du bruit de la capsule ; aucune carte papier ni voix machine ajoutée. |
| 17 | Pressure reprend, creux au tir ; espace large et métallique | Un tir distant et impact pilier unique, puis pas de fuite. Aucun verre, explosion ou tir de Wendy inventé. |
| 18 | Pressure fortement réduit, pièce étroite, tension par silences | Un contact sourd entre la confrontation et le dessin de résultat ; verrou ; pas de poursuivants au dehors puis éloignement. |
| 19 | Pressure finit, ventilation/cabine puis extérieur | Entrouverte : poignée légère ; ascenseur de retour distinct ; ville revient progressivement. |
| 20 | Musique très retenue au geste de John ; eau/exutoire au premier plan | Froissement de vêtements très bref ; un splash au résultat20.3, décroissance naturelle sans cri ajouté ; Grover reste intelligible. |
| 21 | Afterglow discret, répit incomplet, égout et ventilation | Ancienne porte à l'entrée21.2 ; résonance vide de l'espace technique ; fin musicale sans triomphe. |

Les sons organiques difficiles à rendre par synthèse sont proposés en quatre appels
bornés dans [SFX-PLAN.json](SFX-PLAN.json). Musiques/ambiances HOLT déjà livrées,
six SFX ElevenLabs de pages5–8 et trois petits Foley existants sont réemployés.
UI, contact électrique et motif neural sont des créations locales déterministes ;
ils sont identifiés comme tels, jamais attribués à ElevenLabs.

## Pages5–8 : amélioration demandée

Le bon passage du coup est déjà sélectionné dans v5 (source1,132–1,472s), avec un
pic fort à environ+27ms. Le renforcer encore uniformément masquerait l'intention.
Le manque mesuré concerne surtout porte/pas/loquets/départ et démarreur : leurs
niveaux préparés faibles sont encore abaissés sous les voix. La nouvelle version
garde le timing, le coup et les voix, relève les détails matériels selon leur rôle,
ouvre les queues de verre et le crantage moteur et ménage des creux musicaux brefs.
Chaque segment joué est comparé avant/après, pas seulement le pic source complet.

## Contrôle et limites

Mesures float avant écriture, décodage intégral, stems séparés, fenêtres d'onset et
contrastes voix/musique/effets. Deux préécoutes AAC sont prévues : chaîne historique
mono implicite et stéréo explicite, en attendant choix technique de l'intégrateur.
Le mix final doit suivre la chaîne de l'export retenu. Aucune écoute humaine n'est
revendiquée ; les préécoutes et extraits seront livrés pour la revue du propriétaire.
