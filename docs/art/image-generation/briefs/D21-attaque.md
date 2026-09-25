# D21 — La rafale (Scène 3, le basculement)

| | |
|---|---|
| **Fichier livré** | `public/assets/backdrops/attaque.webp` — 1920 × 825 WebP, q80 |
| **Master** | 2560 × 1100 PNG, `art-masters/D21-attaque.png` |
| **Lot** | E — chapitre 2, décors de scène |
| **Utilisé dans le jeu** | bandeau du dialogue `ch2.slow`, nœud `rafale` (`sound.sfx: ["burst", "glass"]`, ADR 0023) |

## Références

| Image | Ce qu'on en prend | Ce qu'on n'en prend pas |
|---|---|---|
| `../../Reference_pictures/Chapter2/AttaqueBoom.png` | le canon d'arme en amorce à droite, le trait de tir net qui traverse la salle sous la boule à facettes, la gerbe d'étincelles à l'impact | le rendu photo, les corps au sol trop détaillés (à garder en silhouette floue, aucune blessure visible) |
| `../../Reference_pictures/Chapter2/boom.png` | la foule qui se disperse en tous sens autour de la piste, sous la même boule à facettes | le rendu photo |

## Le sujet

Le point de bascule du chapitre. D'après
[`ch2.slow.json`](../../../../src/data/dialogues/ch2.slow.json), nœud `rafale` : « Une rafale. Les
tables se renversent. Ce n'est plus un bal. » et le texte d'exemple de l'ADR 0023
(TECH-DESIGN §4.3) : « La musique s'arrête net. » **Letitia et Zachary sont touchés quoi qu'il
arrive** (GAME-DESIGN §4, scène 3) — l'image doit rester dure sans montrer de blessure explicite
(chapitre sans sang à l'écran, ADR 0003 et sa continuité).

## Composition

- Format 21:9. Boule à facettes toujours au plafond, mais les faisceaux sont traversés par un
  **trait de tir** net (arme hors champ ou en silhouette d'amorce, jamais braquée sur le joueur).
- Une gerbe d'étincelles/impact au point de contact, dessinée en trame plutôt qu'en particules
  photoréalistes.
- Silhouettes qui se dispersent et chutent, en aplat sombre, sans détail de blessure — la
  composition suggère le chaos sans montrer de sang.
- Tiers inférieur sombre : silhouettes au sol, très estompées.

## Lumière et couleur

- La boule à facettes continue de tourner, indifférente : même lumière froide en rayons nets.
- Un seul accent rouge, mais **plus dur et plus grand** que dans D19/D20 : l'éclat du tir
  lui-même, au lieu du point de lumière chaude isolé — c'est le même accent qui change de sens.
- Palette qui reste bleu-nuit dominante, pour que la coupe avec D19/D20 soit un choc net, pas un
  changement de décor.

## À éviter

Sang, blessure explicite, arme létale braquée vers le joueur (ADR 0003) ; visages nets ; bloom
diffus sur l'impact (le rendre en trait vif + trame) ; texte.

## Prompt (anglais)

```
[BLOC DE STYLE de STYLE-BIBLE.md]

Wide interior shot of the same derelict dance hall as the slow-dance images, disco ball still
turning overhead with the same cold-blue light rays, now cut through by a sharp gunfire tracer
line from an out-of-frame weapon, a halftone-rendered spark burst at the impact point (not
photographic particles). Dancers scattering and falling in flat dark silhouette in the
foreground and mid-ground, no visible wounds or blood, chaos suggested through posture and
motion only. A single red accent, harder and larger than usual: the muzzle flash itself. Same
dominant desaturated night-blue palette as the slow-dance companion images, for a sharp visual
cut. 21:9 aspect ratio, visual interest in the upper two-thirds, dark lower third.
```

## Critères d'acceptation

- Le trait de tir et la gerbe d'impact sont lisibles sans rendu photoréaliste ni bloom.
- Aucun sang, aucune blessure explicite, aucune arme braquée vers le joueur.
- La palette reste assez proche de D19/D20 pour que la coupe se lise comme un choc dans le même
  lieu, pas un changement de décor.
