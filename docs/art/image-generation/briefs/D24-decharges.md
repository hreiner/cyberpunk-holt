# D24 — Les décharges (Scène 10, l'épuisement)

| | |
|---|---|
| **Fichier livré** | `public/assets/backdrops/decharges.webp` — 1920 × 825 WebP, q80 |
| **Master** | 2560 × 1100 PNG, `art-masters/D24-decharges.png` |
| **Lot** | E — chapitre 2, décors de scène |
| **Utilisé dans le jeu** | bandeau du dialogue `ch2.decharges` |

## Références

| Image | Ce qu'on en prend | Ce qu'on n'en prend pas |
|---|---|---|
| `../../Reference_pictures/Chapter2/NightCityDecharge.png` | les **collines de déchets** à perte de vue, la silhouette de Night City à l'horizon dans la brume, quelques silhouettes lointaines de pilleurs armés de perches | le rendu photo, l'éclairage de lever de soleil (la scène du jeu se passe de nuit, GAME-DESIGN §4 : « l'arrivée de nuit ») |

## Le sujet

« L'épuisement, et la monnaie des pauvres. » (GAME-DESIGN §4, scène 10) : la bande arrive de nuit
aux décharges en bordure de Night City, épuisée, pour y monter la garde. D'après
[`ch2.decharges.json`](../../../../src/data/dialogues/ch2.decharges.json) (contenu à venir, lot
5.6) : un bivouac de fortune entre les collines de déchets.

## Composition

- Format 21:9. Collines de déchets qui structurent le premier plan et le milieu de l'image,
  silhouettes anguleuses et irrégulières.
- La skyline de Night City à l'horizon, dans la brume nocturne, tours en aplat sombre ponctuées de
  quelques fenêtres éclairées.
- Une ou deux silhouettes lointaines de pilleurs, perche ou sac à l'épaule, en aplat, jamais de
  visage net.
- Tiers inférieur calme et sombre : le sol de détritus, dans l'ombre.

## Lumière et couleur

- Nuit : ciel très sombre, désaturé, quelques étoiles suggérées en points blanc-os.
- Halo urbain de Night City à l'horizon, cyan radio très retenu, jamais un bloom.
- Un seul accent rouge : une lueur de feu de fortune entre les collines de déchets, au loin.
- Palette de déchets désaturée : gris-brun sale, pas de couleur vive.

## À éviter

Lever de soleil ou lumière chaude dominante (la scène est nocturne) ; personnages identifiables au
premier plan ; bloom sur les lumières de la ville ; texte sur les enseignes lointaines.

## Prompt (anglais)

```
[BLOC DE STYLE de STYLE-BIBLE.md]

Wide night landscape over a sprawling garbage dump: uneven hills of refuse in the foreground and
midground, a hazy megacity skyline on the horizon with scattered lit windows in flat dark
silhouette, one or two distant scavenger figures with poles or sacks rendered as flat unreadable
silhouettes. Dark desaturated night sky with a few suggested stars, a faint restrained cyan urban
glow on the horizon (no bloom). A single red accent: a small campfire glow between the refuse
hills, far in the frame. Desaturated dirty grey-brown palette for the garbage itself. 21:9 aspect
ratio, visual interest in the upper two-thirds, a calm dark lower third of refuse and shadow.
```

## Critères d'acceptation

- Les collines de déchets et la skyline lointaine sont reconnaissables face à
  `NightCityDecharge.png`, transposées de nuit.
- Aucun visage net, un seul accent rouge, aucun bloom sur les lumières urbaines.
