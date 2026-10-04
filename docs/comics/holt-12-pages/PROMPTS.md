# HOLT — prompts de production

## Usage

32 illustrations indépendantes : couverture, 30 cases de récit, quatrième de couverture. Chaque image est produite séparément, sans texte ni bulles intégrés. Composer ensuite les 12 pages du récit selon `storyboard.json`, avec une couverture avant et une arrière pour un PDF de 14 pages. Les chemins des références sont absolus ; ce sont des sources d'identité et d'architecture, à réinterpréter dans le style commun. Ne pas copier une œuvre ou un personnage existant.

**Style commun à joindre à chaque prompt :** Original angular French cyberpunk animation comic, expressive inked faces, clean hard-edged shadows, restrained cyan/magenta neon, warm amber for the ball, red fire and cold sewer blue as scene-specific accents. 2D illustration, consistent character identities from references, intimate cinematic framing, no existing anime character likeness, no readable text, no lettering, no speech bubbles, no logos, no gore. Reserve a quiet top band (~20%) and bottom strip (~15%) for later lettering; keep faces and hands in the central 65%.

**Règle d'identité :** les images `cadets.png` et les portraits individuels fixent les visages, coiffures et uniformes. Les images du chapitre 2 fixent les lieux et la continuité des costumes. Conserver les mêmes silhouettes d'une case à l'autre. Ajouter textes, bulles, cartouches et SFX après génération selon les coordonnées normalisées du JSON.

## COVER — couverture avant

**Sortie :** `references/COVER.png` ; **format :** portrait 2:3 ; **références (4) :**

- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Frankly.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/letitia.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/john.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/BadlandsHoltenFeuPatrouilles.png`

**Prompt (EN) :** Portrait 2:3 front cover for an original French cyberpunk animation comic. Franklyn, a serious 17-year-old cadet, carries a gravely wounded but conscious Letitia in his arms; John stands close beside him, shielding the pair and looking toward the road. The burning HOLT academy sits low in the composition behind them, and Night City's distant skyline rises high above. Night turning to dawn, angular shapes, intimate faces, restrained cyan and magenta neon against red fire. The upper 20% is dark open skyline for the title HOLT; the bottom 10% is quiet ground shadow for subtitle and tagline. No printed text, no lettering, no logo, no speech bubbles, no photo insert, no gore, no existing anime likeness. Use the common style prompt.

**Titres à poser en composition :** `HOLT` ; `LE S DE SOLIDARITÉ` ; `LA DERNIÈRE NUIT`.

## Pages du récit

### Page 1 — Les choix (three-bottom)

#### P01-C01

**Prompt (EN) :** Portrait 3:4 establishing shot at dawn inside the HOLT teen dormitory. Franklyn, serious teenage boy in folded dark cadet uniform, sits on his bunk; geometric academy walls through a window. Quiet lonely silhouette, center-right, cool blue morning. Leave upper-left ceiling plain. Use the common style prompt.

**Références :**

- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Frankly.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/holtacademy.png`

**Focale :** [0.59, 0.52]. **Textes à poser ensuite :** narration « Honnêteté. Obéissance. Loyauté. Travail. Nous avions ajouté Solidarité. ».

#### P01-C02

**Prompt (EN) :** Portrait 3:4 oblique close shot of Franklyn's hand above a written exam sheet in a harsh fluorescent academy hall; other cadets blurred into sharp graphic silhouettes behind him. His eyes question the choice, no legible writing on sheet. Empty dark wall above. Use the common style prompt.

**Références :**

- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Frankly.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/holtacademy.png`

**Focale :** [0.55, 0.51]. **Textes à poser ensuite :** thought « Une bonne réponse ne dit pas toujours quoi faire. ».

#### P01-C03

**Prompt (EN) :** Landscape 6:5 frontal wide courtyard team selection. Franklyn at left points first to John and then Letitia, forming blue team; Abigail at right stands with Zachary and Grover as red team. Six identifiable cadets, solemn academy wall, empty sky for lettering. Use the common style prompt.

**Références :**

- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/cadets.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Frankly.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/holtacademy.png`

**Focale :** [0.5, 0.55]. **Textes à poser ensuite :** speech « John. Et Letitia. » ; speech « Zachary et Grover viennent avec moi. ».

### Page 2 — L'exercice (two)

#### P02-C01

**Prompt (EN) :** Landscape 3:2 panoramic view through a moving police van in the ochre Badlands toward a deserted police training center. Reflections of Franklyn, John and Letitia in the side window; three wary teenagers, no dog or hostage at the gate. Leave open dusty sky at top. Use the common style prompt.

**Références :**

- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/badlands.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/zoneexercicetactique.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/cadets.png`

**Focale :** [0.52, 0.54]. **Textes à poser ensuite :** speech « On entre ensemble. ».

#### P02-C02

**Prompt (EN) :** Landscape 3:2 dynamic wide courtyard of stacked shipping containers during a nonlethal taser training match. Franklyn shields Letitia while John advances; Abigail, Zachary and Grover are visible across the arena. Electric taser flashes only, no lethal wounds. Keep upper band dark and uncluttered. Use the common style prompt.

**Références :**

- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/vueexercicetactique.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/cadets.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Frankly.png`

**Focale :** [0.52, 0.52]. **Textes à poser ensuite :** narration « À la fin, personne n'était mort. ».

### Page 3 — Six sur la photo (three-strips)

#### P03-C01

**Prompt (EN) :** Wide landscape 2:1 direct group portrait of all six teenage cadets just after the practical exam, shoulder to shoulder, joyful and exhausted. Zachary makes a playful gesture; Abigail almost laughs; Franklyn, Letitia, John and Grover clearly recognizable. White photo-edge shape will be added in layout, not in image. Simple academy wall behind. Use the common style prompt.

**Références :**

- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/photosouvenir.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/cadets.png`

**Focale :** [0.5, 0.5]. **Textes à poser ensuite :** speech « Celle-là, on la garde. ».

#### P03-C02

**Prompt (EN) :** Wide landscape 2:1 intimate medium two-shot in the exam hall transformed into a prom room, amber paper lanterns and blurred cakes behind. Franklyn offers his hand, Letitia lets hers rest in it, shy smiles, hands focal. Clear upper negative space for two bubbles. Use the common style prompt.

**Références :**

- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Frankly.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/letitia.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/SlowFranklinLeticia.png`

**Focale :** [0.5, 0.54]. **Textes à poser ensuite :** speech « Tu m'accordes cette danse ? » ; speech « Une seule ? ».

#### P03-C03

**Prompt (EN) :** Wide landscape 2:1 very wide slow-dance tableau, two couples rotating beneath amber and muted magenta lights: Franklyn with Letitia foreground, Abigail with Zachary background, John and Grover at edge. Intimate faces and hand placement; closed double doors far back. Leave dark upper ceiling for one bubble. Use the common style prompt.

**Références :**

- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/SlowFranklinLeticia.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/SlowAbigailZach.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/cadets.png`

**Focale :** [0.5, 0.55]. **Textes à poser ensuite :** speech « Reste encore. ».

### Page 4 — La rupture (full)

#### P04-C01

**Prompt (EN) :** Portrait 2:3 full-page violent instant: the prom hall back door bursts inward under gunfire. Armed attackers with hand-sewn scorpion marks enter in staggered line. Franklyn shouts warning to the whole room; Letitia remains standing in the line of fire and is hit; Zachary turns his back to gunfire to wrap Abigail in his arms and takes a hit. Amber dancing light split by white muzzle flashes and jagged red lines. Readable anatomy and spatial staging, no explicit blood. Leave upper fifth as dark smoke for lettering and lower strip as floor shadow. Use the common style prompt.

**Références :**

- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/AttaqueBoom.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/boom.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/SlowAbigailZach.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/cadets.png`

**Focale :** [0.53, 0.51]. **Textes à poser ensuite :** speech « À TERRE ! » ; sfx « KRAAAM TAK TAK TAK ».

### Page 5 — La seule sortie (three-top)

#### P05-C01

**Prompt (EN) :** Landscape 3:2 low-angle kinetic shot inside wrecked prom hall. John and Grover overturn a heavy table toward armed attackers; Abigail supports wounded Zachary behind them. Torn decorations and amber lights above. Clear shadow band at top. Use the common style prompt.

**Références :**

- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/john.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/grover.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/AttaqueBoom.png`

**Focale :** [0.48, 0.52]. **Textes à poser ensuite :** speech « Courez ! ».

#### P05-C02

**Prompt (EN) :** Portrait 2:3 long academy corridor in urgent escape perspective, red emergency strip lighting. Franklyn and John jointly support badly wounded Letitia; Abigail, Zachary and Grover follow. Letitia conscious, struggling to walk. Keep faces central, uncluttered ceiling. Use the common style prompt.

**Références :**

- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Frankly.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/john.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/letitia.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/AttaqueBoom.png`

**Focale :** [0.48, 0.52]. **Textes à poser ensuite :** speech « Appuie-toi sur nous. » ; speech « J’essaie… ».

#### P05-C03

**Prompt (EN) :** Portrait 2:3 close foreground of Franklyn's hand opening a dormitory ventilation grille; deep background shows gunfire puncturing corridor wall and cadet silhouettes entering the vent. Angular metal planes, cold blue light, no text. Use the common style prompt.

**Références :**

- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Frankly.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/Conduit.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/holtacademy.png`

**Focale :** [0.48, 0.55]. **Textes à poser ensuite :** speech « Par là. Je connais les conduits. ».

### Page 6 — Ceux qu'on laisse derrière (three-top)

#### P06-C01

**Prompt (EN) :** Landscape 3:2 wide claustrophobic secret lab beyond a vent hatch. Smith, female instructor, wounded but conscious beside a blue humming simulation machine; Franklyn kneels before her while companions remain near the hatch. Clear top dark machine housing for bubble. Use the common style prompt.

**Références :**

- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/LaboSmith.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Frankly.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/instructeurs.png`

**Focale :** [0.52, 0.52]. **Textes à poser ensuite :** speech « Le Blue Purple. John sait. Sors-les. ».

#### P06-C02

**Prompt (EN) :** Portrait 2:3 view inside narrow ventilation duct. Franklyn disables stationary turbine blades with a small tool. Beyond the fan Grover reaches toward an unnamed frightened young child curled INSIDE THE DUCT, not under a bed. Blue industrial light, clear top metal darkness. Use the common style prompt.

**Références :**

- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/ConduitVentliation.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/ConduitsEnfant.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Frankly.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/grover.png`

**Focale :** [0.53, 0.51]. **Textes à poser ensuite :** speech « Viens. On connaît la sortie. ».

#### P06-C03

**Prompt (EN) :** Portrait 2:3 brutal reverse angle INSIDE the child-sector duct: bullets perforate sheet metal overhead; Zachary interposes his shoulder between bullets and the child, wounded again; Abigail turns toward him; the child clutches Grover. Constrained perspective, no beds, no gore. Use the common style prompt.

**Références :**

- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/ConduitsEnfant.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/zacharie.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/abigail.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/grover.png`

**Focale :** [0.5, 0.52]. **Textes à poser ensuite :** speech « Ça va. On bouge. ».

### Page 7 — Le prix (three-bottom)

#### P07-C01

**Prompt (EN) :** Portrait 3:4 small upper panel of the younger children's canteen ablaze, group hurrying toward a garbage chute while John supports Letitia. Jagged orange flames and smoke, no graphic bodies, negative space in top smoke. Use the common style prompt.

**Références :**

- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/CantineFeuVideOrdure.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/john.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/letitia.png`

**Focale :** [0.52, 0.55]. **Textes à poser ensuite :** narration « La chaleur leur barre le retour. ».

#### P07-C02

**Prompt (EN) :** Portrait 3:4 small upper panel showing cadets dropping through a garbage chute, orange firelit opening receding above and black sewer water below. A sharp angled metal tunnel carries the eye downward. Use the common style prompt.

**Références :**

- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/CantineFeuVideOrdure.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/Egouts.png`

**Focale :** [0.49, 0.57]. **Textes à poser ensuite :** sfx « CLANG ».

#### P07-C03

**Prompt (EN) :** Landscape 6:5 large 2x2-grid-area panel in a cold blue sewer, nearly silent. Abigail kneels cradling dying Zachary; Franklyn presses a rolled jacket with her against his side. Farther back, Grover tends badly wounded Letitia while the unnamed child holds his sleeve. Show both emergencies at once, no gore. Leave dark upper tunnel band for two short bubbles. Use the common style prompt.

**Références :**

- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/Egouts.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/SlowAbigailZach.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Frankly.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/letitia.png`

**Focale :** [0.5, 0.52]. **Textes à poser ensuite :** speech « Abi. Reste là. Franklyn… ramène-les. ».

### Page 8 — Un absent (two)

#### P08-C01

**Prompt (EN) :** Landscape 3:2 silent horizontal close shot in cold sewer blue: Zachary's fingers slacken out of Abigail's hand; Franklyn freezes in the near background. Emotion in hands, no injury close-up, dark empty upper tunnel. Use the common style prompt.

**Références :**

- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/Egouts.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/abigail.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/zacharie.png`

**Focale :** [0.48, 0.55]. **Textes à poser ensuite :** speech « Zach ? ».

#### P08-C02

**Prompt (EN) :** Landscape 3:2 extremely wide Badlands dawn outside the sewers: HOLT academy burning far away, patrol searchlights sweeping the desert. A jacket covers Zachary's body left behind beside the path; Grover gently leads grieving Abigail away; Franklyn carries wounded Letitia; John and child follow. Landscape dwarfs group. Use the common style prompt.

**Références :**

- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/BadlandsHoltenFeuPatrouilles.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/cadets.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/Egouts.png`

**Focale :** [0.54, 0.54]. **Textes à poser ensuite :** speech « À nous de continuer. ».

### Page 9 — Murano (two)

#### P09-C01

**Prompt (EN) :** Landscape 3:2 medium firelit Badlands camp shot. Murano, old man with worn shotgun held low and hand-sewn scorpion patch on sleeve, slides a medical kit to Grover; Grover tends Letitia near the truck. Franklyn spots the patch. Keep truck ignition key visible inside cab only. Use the common style prompt.

**Références :**

- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/MuranoBadlandsCamps.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/CampsBadlands.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Frankly.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/grover.png`

**Focale :** [0.52, 0.51]. **Textes à poser ensuite :** speech « Pour elle. Le camion, jamais. ».

#### P09-C02

**Prompt (EN) :** Landscape 3:2 wide silhouette scene behind camp canvas: Franklyn has just fatally struck Murano in shadow; old shotgun falls into dust without firing. Truck ignition keys remain IN THE IGNITION, not on ground. Unnamed child sees it from inside truck. Strong moral stillness, no gore, reserve top black sky for caption. Use the common style prompt.

**Références :**

- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/MuranoBadlandsCamps.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Frankly.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/CampsBadlands.png`

**Focale :** [0.5, 0.53]. **Textes à poser ensuite :** narration « Franklyn tua Murano pour prendre le camion. Ses mains tremblaient. ».

### Page 10 — La nuit des décharges (two)

#### P10-C01

**Prompt (EN) :** Landscape 3:2 sweeping night panorama of Murano's old truck reaching Night City's junkyard edge from the Badlands. Towering city neon beyond mountains of scrap; inside back of truck Letitia breathes with difficulty and child sits beside Grover. Exhaustion and distance, open dark sky. Use the common style prompt.

**Références :**

- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/NightCityDecharge.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/Badlands.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/letitia.png`

**Focale :** [0.55, 0.54]. **Textes à poser ensuite :** speech « On est arrivés. Pas encore sauvés. ».

#### P10-C02

**Prompt (EN) :** Landscape 3:2 static watch among stacked car wrecks. Ragged junkyard youths watch the truck and Murano's shotgun; Franklyn and John stand alert, Abigail sits apart in grief, unnamed child quietly wakes drowsy Grover. Shotgun unfired and still has its one final round, no muzzle flash. Use the common style prompt.

**Références :**

- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/NightCityDecharge.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Frankly.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/john.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/grover.png`

**Focale :** [0.49, 0.55]. **Textes à poser ensuite :** speech « Ils reviennent. ».

### Page 11 — La dette (three-top)

#### P11-C01

**Prompt (EN) :** Landscape 3:2 narrow dawn street at edge of Night City. A scrappy young junkyard guide points toward a hidden clinic between metal walls as Franklyn hands him Murano's old shotgun as payment, unfired. The other survivors wait with Letitia nearby. Clear pale upper sky. Use the common style prompt.

**Références :**

- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/NightCityRueCharcudoc.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Frankly.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/NightCityDecharge.png`

**Focale :** [0.52, 0.55]. **Textes à poser ensuite :** speech « La clinique est derrière ces tôles. ».

#### P11-C02

**Prompt (EN) :** Portrait 2:3 cruel clinical interior under harsh white lamp. Dirty backstreet surgeon studies conscious but exhausted Letitia on cot like a commodity; Franklyn and John stand at counter. Frame surgeon's cold gaze and Letitia's vulnerability, no gore. Dark upper wall for short ultimatum. Use the common style prompt.

**Références :**

- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/Charcudoc.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/AcceuilCharcueDoc.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/letitia.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Frankly.png`

**Focale :** [0.51, 0.54]. **Textes à poser ensuite :** speech « Deux mille crédits. Demain soir. Après, je me paie. ».

#### P11-C03

**Prompt (EN) :** Portrait 2:3 clinic threshold at pale morning. Franklyn releases Letitia's hand as he leaves her inside; John stands just outside with Grover, Abigail and child behind. Letitia conscious on cot, separation through half-open metal door. Reserve top left/right for bubbles. Use the common style prompt.

**Références :**

- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/NightCityRueCharcudoc.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/letitia.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/john.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Frankly.png`

**Focale :** [0.5, 0.53]. **Textes à poser ensuite :** speech « Reviens me chercher. » ; speech « Ce soir, le Blue Purple. ».

### Page 12 — La place vide (three-strips)

#### P12-C01

**Prompt (EN) :** Wide landscape 2:1 wide underground Blue Purple bar at night, cyan and violet practical neon. Round back table seats Franklyn, John, Grover, Abigail and unnamed child; two conspicuous empty spaces in composition echo their six-person class photo: Zachary dead, Letitia absent at clinic. Smith is nowhere visible. Faces central, dark upper ceiling. Use the common style prompt.

**Références :**

- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/BluePurpleInterieur.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/photosouvenir.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/cadets.png`

**Focale :** [0.52, 0.55]. **Textes à poser ensuite :** speech « Demain soir… » ; speech « Smith n'est pas là. ».

#### P12-C02

**Prompt (EN) :** Wide landscape 2:1 close profile of unknown woman arriving at bar table uninvited, purple leather jacket, midnight-blue hair covering one eye, red ear ring. NOT Smith; her face half in shadow, four cadets tense in foreground silhouettes. Keep empty dark ceiling for lettering. Use the common style prompt.

**Références :**

- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/BluePurpleRencontre.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/BluePurpleInterieur.png`

**Focale :** [0.54, 0.48]. **Textes à poser ensuite :** speech « Franklyn. John. Grover. Abigail. ».

#### P12-C03

**Prompt (EN) :** Wide landscape 2:1 final chiaroscuro horizontal composition at round bar table: Franklyn reaches a hand forward without touching the unknown woman's untouched glass; unknown woman remains half-shadowed, child watches from the edge. Violet/cyan light, suspense without identity reveal, quiet top band for two speech balloons. Use the common style prompt.

**Références :**

- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/BluePurpleRencontre.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Frankly.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/BluePurpleInterieur.png`

**Focale :** [0.5, 0.52]. **Textes à poser ensuite :** speech « Et Letitia ? » ; speech « Je vous dirai ce que vaut votre nuit. Et à qui vous la devez. ».

## BACK — quatrième de couverture

**Sortie :** `references/BACK.png` ; **format :** portrait 2:3 ; **références (2) :**

- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/BadlandsHoltenFeuPatrouilles.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/Badlands.png`

**Prompt (EN) :** Portrait 2:3 back cover for the same original French cyberpunk animation comic. Empty Badlands desert at the edge of Night City, HOLT academy very far away as a small smoking silhouette. Night blue at the top passes gradually into a cold dawn along the horizon; a single deserted track leads from the lower foreground toward the smoke. No people, no figures, no vehicles, no bodies. Maintain a broad dark, low-detail central field for the French back-cover blurb and a quiet lower strip for credits. Angular inked landscape, subtle cyan and violet reflections, restrained red ember accents. No printed text, no lettering, no logo, no existing anime likeness. Use the common style prompt.

**Résumé à poser en composition :** « Ils avaient dix-sept ans, un diplôme presque gagné et une photo à six. Une nuit a brûlé leur école. Au Blue Purple, il reste une amie retenue en gage, un disparu et une dette : à qui doivent-ils d'être encore là ? »

