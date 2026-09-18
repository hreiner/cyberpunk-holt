# Les six cadets

Les valeurs chiffrées sont dans [`src/data/characters.json`](../../src/data/characters.json).
**C'est la source de vérité** : ce document explique, il ne double pas les données.

Ordre des attributs : INT / RÉF / DEX / TECH / SF / EMP / CORPS / MOUV.

---

## Franklyn — le joueur

**Apprenti netrunner.** `8/5/5/7/5/5/3/4` — 19 PV.
Piratage 6, Éducation 5, Perception 4, Électronique 4, Discrétion 4.

Le plus intelligent, le plus fragile. Nommé d'après Franklin Pierce. Favori de l'instructeur
Smith. Il veut un poste de soutien technique dans une unité d'élite.

| | |
|---|---|
| **Symbiose** | une relance gratuite sur un jet raté, une fois par affrontement |
| **Rat des conduits** | +2 en Discrétion dans les espaces confinés |
| **Défaut — En manque** | −1 SF tant qu'il n'a pas eu sa séance d'interface |

### Ses secrets

Ils sont le moteur souterrain du chapitre 1 et doivent affleurer sans jamais être expliqués.

- Il utilise **le compte d'interface de John** depuis l'enfance, cloné dans l'annexe du
  laboratoire. **John ne le sait pas.**
- Il accède aux conduits grâce à **l'outil d'Abigail**. Elle le lui prête à une condition :
  ne jamais aller plus loin que l'annexe.
- **Il a rompu cette promesse.** Poussière bleue, une turbine, une égratignure à l'avant-bras
  qu'il a fait passer pour une chute.
- Il est **accro aux « shoots »** des niveaux cachés. Des dossiers vides mais de plus en plus
  nombreux s'accumulent dans son neuroport.
- Depuis ses dix ans, une **simulation étrange** revient. Il ne sait pas ce que c'est.
- Il a **caché Letitia dans les conduits** le jour où elle fouillait la salle d'interface.
  Ni l'un ni l'autre n'en a jamais reparlé.

---

## Abigail — la bricoleuse

**Médic et réparatrice.** `7/5/7/8/5/6/4/5` — 22 PV. Électronique 6, Premiers soins 5.
Affinité de départ **+2**.

Tresses serrées, expression fermée. Dure et discrète. Elle fait partie de la bande de
Zacharie, avec Franklyn — ce qui rend son passage dans l'équipe rouge amer.

| | |
|---|---|
| **Mains d'or** | le kit rend +2 PV ; peut ranimer un allié tasé sans kit (Premiers soins DV 15) |
| **Bricoleuse** | manipule une mine sans risque de déclenchement |
| **Défaut** | prudente : elle temporise quand il faudrait foncer |

---

## Letitia — l'observatrice

**Les meilleurs yeux de la promotion.** `7/5/6/5/6/7/4/5` — 22 PV.
Perception 6, Discrétion 5, Persuasion 5, Éducation 5. Affinité **+1**.

Cheveux bouclés, le plus grand sourire du groupe. Son uniforme porte des galons
supplémentaires : elle est, ou a été, en position de responsabilité — à trancher en epic 2.

Elle fait partie du trio critique avec Grover. **Franklyn l'a cachée dans les conduits** un
jour où elle cherchait quelque chose dans la salle d'interface. On ne sait toujours pas quoi.

| | |
|---|---|
| **Œil de lynx** | ses repérages donnent +3 au lieu de +2 |
| **Silencieuse** | +1 en Discrétion pour l'équipe quand elle mène |
| **Défaut** | distante avec la bande de Zacharie |

---

## John — l'organique

**Le combattant.** `5/8/7/2/8/3/7/6` — 31 PV.
Armes de poing 6, Corps à corps 6, Esquive 5, **Piratage 0**. Affinité **+3** — le plus
proche de Franklyn.

Cheveux blanc argenté ras, yeux pâles, regard dur. **Le seul cadet sans neuroport.**
Solitaire, proche de personne sauf Franklyn. Il est terrifié par la salle d'interface, ce
qui est étrange pour quelqu'un qui n'a pas d'implant — et son compte a des niveaux cachés.
Les deux faits sont peut-être liés. Le chapitre 1 ne le dit pas.

| | |
|---|---|
| **Sang-froid absolu** | +2 sur son premier tir de la rencontre, insensible aux malus de peur |
| **Organique** | pas de neuroport : ne peut pas utiliser l'outil de piratage, immunisé aux effets d'implants |
| **Défaut** | technophobe |

---

## Grover — le rassembleur

**Capitaine de l'équipe rouge.** `6/6/6/5/6/7/6/6` — 28 PV. Tactique 5, aucune compétence à 0.
Affinité **−1** — le seul en froid avec Franklyn.

Cheveux noirs raides, frange, regard attentif. Il forme un trio critique avec Théodore et
Letitia, et il est en rivalité ouverte avec Zacharie.

| | |
|---|---|
| **Cohésion** | une fois par round, donne +2 au prochain jet d'un allié en vue |
| **Polyvalent** | aucune compétence à 0 |
| **Défaut** | moralisateur : il commente les écarts des autres |

---

## Zacharie — le fonceur

**Capitaine de l'équipe bleue.** `5/7/7/4/6/5/7/7` — 31 PV. Athlétisme 6, Armes de poing 5, Corps à corps 5. Affinité **+2**.

Coupe au bol, peau brune, grand sourire sincère. Meneur naturel de la bande qui comprend
Franklyn et Abigail.

> Les références visuelles orthographient **« ZACHARIE »**, les notes de scénario
> **« Zachary »**. Même personnage. L'identifiant technique est `zachary`, le nom affiché
> est `Zachary`. À arbitrer une bonne fois avant d'écrire les dialogues.

| | |
|---|---|
| **Fonceur** | +1 initiative, +3 cases en course, mais toujours très visible |
| **Meneur de bande** | capitaine naturel au tirage |
| **Défaut** | tête brûlée |

---

## Les bandes

```
        Zacharie ──── Abigail ──── Franklyn ──── John
           │                          │
      (rivalité)                 (secret)
           │                          │
        Grover ───── Letitia ──── Théodore
```

- **Bande de Zacharie** : Zacharie, Dwight, Julia, Abigail, Franklyn.
- **Trio critique** : Grover, Théodore, Letitia.
- **John** : solitaire, proche du seul Franklyn.
- **Rivalité** Zacharie / Grover, structurante pour le tirage des équipes.

## Affinités

Échelle **−3 à +3**. Valeurs de départ ci-dessus. Elles bougent au hub de dialogue (scène 5)
et au bal (scène 9), et sont conservées dans le dossier du candidat.

| Cadet | Départ |
|---|---|
| John | +3 |
| Abigail | +2 |
| Zacharie | +2 |
| Letitia | +1 |
| Grover | −1 |
