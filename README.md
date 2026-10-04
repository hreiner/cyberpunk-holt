# HOLT Academy

Jeu de rôle cyberpunk dans le navigateur, adapté d'une campagne Cyberpunk RED. Le joueur
incarne Franklyn, cadet de 17 ans à l'académie HOLT, dans les Badlands de Night City.
Projet personnel, non commercial.

Les **chapitres 1 et 2 sont jouables** : journée d'examen, exploration et exercice tactique,
puis nuit du bal, attaque, fuite et arrivée à Night City. Personnages MPFB animés avec
Mixamo, décors 3D, portraits et cinématiques à plans fixes, VO anglaises et textes français,
musique et ambiances continues. Le chapitre 3 reste à concevoir.

Pour travailler : [AGENTS.md](AGENTS.md), puis [guide par tâche](docs/WORKFLOWS.md).
Le [catalogue](docs/INDEX.md) référence les sources ; la [roadmap](docs/process/ROADMAP.md)
conserve les livraisons et travaux restants. Les skills et profils Codex/Claude sont
[décrits ici](docs/process/AGENT-WORKFLOW.md).

## Démarrer

```sh
npm install
npm run doctor
npm run dev
```

Ouvrir **http://localhost:5173/cyberpunk-holt/**. Node >=20.19 est requis.
Les outils de production de médias sont facultatifs pour jouer et développer le moteur.

| Commande                                      | Effet                                                             |
| --------------------------------------------- | ----------------------------------------------------------------- |
| `npm run verify`                              | typage, lint, tests unitaires et build ; obligatoire avant commit |
| `npm run test:e2e`                            | parcours Playwright, build et preview automatiques                |
| `npm run workflow:check`                      | liens locaux, skills et adaptateurs d'agents à jour               |
| `npm run agents:sync`                         | générer profils Codex/Claude et entrées Claude des skills HOLT    |
| `npm run doctor -- --scope=audio`             | visibilité des prérequis audio, sans compte ni génération         |
| `npm run doctor -- --scope=characters`        | visibilité des prérequis MPFB/Mixamo                              |
| `npx tsx scripts/simulate.ts 200 equilibrage` | mesurer l'équilibre tactique                                      |

`?seed=revue` rejoue une partie ; `&ai=0` accélère l'IA. `?chapter=2&seed=revue`
ouvre la suite, `?scene=ch1.centre-hall&seed=revue` cible une scène. Le menu d'accueil
contient aussi un sélecteur de QA. Le pilote des personnages est à
`dormitory-aaa.html?lead=franklyn` sous le même préfixe.

## Jouer

En exploration : cliquer/toucher le sol pour marcher, une entité pour interagir ;
glisser pour déplacer la caméra, pincer/molette pour zoomer, A/E ou bouton pour tourner.
En tactique : déplacement, tir/taser, course et actions du HUD ; espace termine le tour.
Le muet est partagé entre les modes. Les contrôles détaillés sont dans le
[design d'exploration](docs/design/08-EXPLORATION.md) et le
[design tactique](docs/design/05-TACTICAL-COMBAT.md).

TypeScript strict, Three.js, HTML/CSS, Vite, Vitest et Playwright. La logique pure se
rejoue dans Node avec un RNG seedé ; les couches sont décrites dans
[ARCHITECTURE](docs/process/ARCHITECTURE.md). La cible visuelle admise est **30 IPS sur
GTX 1070** ; les revues datées explicitent leurs mesures et limites.

Les assets légers livrés sont versionnés. Masters, chansons locales du propriétaire et
livres comics restent dans `art-masters/` ou aux emplacements ignorés indiqués par leurs
pipelines. L'univers Cyberpunk et Night City appartient à ses ayants droit.
