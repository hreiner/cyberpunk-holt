# Prompts effectifs des couvertures

La couverture v1 a été revue : visages et portage cohérents, mais le col de Letitia ressemblait au blouson de Franklyn. Une retouche ciblée a rétabli ses revers, sa cravate et ses galons ; la version corrigée a été revue et retenue.

## COVER — prompt initial

Références :

- `D:/AgenticCoding/cyberpunk-holt/art-masters/comics/holt-12-pages/references/CAST-ANCHOR.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Frankly.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/letitia.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/john.png`
- `D:/AgenticCoding/cyberpunk-holt/docs/art/Reference_pictures/Chapter2/BadlandsHoltenFeuPatrouilles.png`

```text
Use case: illustration-story. Asset: FRONT COVER ART of HOLT — Le S de solidarité, original French comic, portrait 2:3.
Input image 1 is the approved HOLT CAST MODEL SHEET; absolutely preserve its facial identities, clothes and hand-drawn style: TOP left Franklyn, TOP center Letitia, TOP right John. Other images are original identity references and burning academy ARCHITECTURE only, do not copy photographic treatment.
Scene: night in the Badlands after a school massacre, looking toward the outskirts of Night City. In lower distance the fortified geometric academy burns, small amber-red flames against blue-black desert. The distant Night City skyline rises as immense austere towers.
Subject: Franklyn, 17, slim young freckled light-skinned boy, SHORT dark-brown tousled hair, gray-hazel eyes, black-navy zipped high-collar cadet jacket with segmented shoulder plates. He stands in center foreground holding Letitia carefully in both arms. Letitia, 17, warm medium-brown skin, LIGHT-BROWN CURLY HAIR TIED IN LOOSE BUN with loose face-framing curls, black-navy lapel cadet coat with black tie and distinctive silver shoulder rank bars. She is seriously wounded, visibly pale and exhausted, eyes partly open, her limp hand clutching Franklyn's coat; NO exposed wound or blood. John behind their left side is a stern athletic teenage boy with very short SILVER-WHITE CROP and blue eyes, navy zip coat, NO implants, shielding them.
Composition: powerful graphic diagonal running from academy blaze to Franklyn's anguished determined face to Letitia's vulnerable face, all characters centrally placed between y25%-85%. Three people only. Portrait 2:3. Upper 22% OPEN EMPTY dark night sky without people for title; lower10% empty road shadow for tagline. Faces are individual and expressive; physically believable carrying pose and hands. Original HOLT identities, never David/Lucy/anime cast. NO drawn title or type; designer adds title later.
Style: match reference1 precisely, cinematic angular cyberpunk animation-inspired graphic novel, crisp confident black ink outlines, dramatic flat cel shadows, restrained fine printed texture and halftone, midnight-navy dominant, cyan side lighting, warm amber skin highlights, red academy-fire rim, no photorealism, no CGI, no smooth airbrush, no grayscale. Intimate adolescent emotion over spectacle. No text, letters, captions, bubbles, watermark, frames or logos.
```

## Retouche COVER — costume de Letitia

Références : couverture v1, ancre, photo `letitia.png`.

```text
Use case: precise-object-edit. Image1 is EDIT TARGET, the cover artwork. Image2 is HOLT cast continuity sheet. Image3 is Letitia's original wardrobe identity.
Change ONLY Letitia's jacket details, keep everything else identical: same faces, hair, carrying pose, bodies, hands, John, Franklyn, background fire and skyline, lighting, ink style, cropping and colors.
Letitia is the curly light-brown-haired wounded teenage GIRL lying in Franklyn's arms at image right. Her cadet coat must be a dark NAVY CEREMONIAL LAPEL JACKET with a BLACK TIE and a small extra SILVER RANK BAR on her shoulder, like the female in TOP CENTER of image2 and original image3. Her visible collar currently looks like Franklyn's zip-up armor; replace that girl's collar with clearly visible navy folded LAPELS and black tie, and simplify her shoulder epaulette to silver rank bars instead of chunky segmented armor. Only the girl's visible jacket/collar and epaulette. This is crucial identity continuity. Do NOT change Franklyn's segmented shoulder armor, high collar or zipper. Do NOT change any face or expression. No text, no lettering, no blood. Maintain portrait2:3 exactly.
```

## BACK — prompt effectif

Références : ancre (style uniquement), `Chapter2/BadlandsHoltenFeuPatrouilles.png`, `Chapter2/Badlands.png` (architecture).

```text
Use case: illustration-story. Asset: BACK COVER ART for original HOLT comic, portrait2:3.
Image1 is the approved HOLT CAST sheet as STYLE reference only, do not draw those people. Image2 the academy on fire in the Badlands and image3 desert wind farms supply ARCHITECTURE only, not photographic style.
Draw a lonely barren rocky desert just before dawn, HOLT academy extremely far away as low geometric silhouette smoking red embers near the upper third, enormous thin wind turbines scattered at distance, one empty worn track running from foreground toward the academy. NO people, bodies or vehicles at all. Deep midnight blue night sky passes into a narrow cold cyan dawn horizon, angular rocks and sparse dry vegetation in foreground silhouettes. Keep broad middle and lower region dark and uncomplicated for back-cover summary/credits later, no lettering. Match reference1 crisp angular black ink graphic novel / hand-drawn cel-shaded cyberpunk comic rendering, flat shadows, fine halftone and printed grain, limited midnight-navy cyan amber signalred palette; no CGI, no photorealism, no gradient airbrush. Calm desolation after catastrophe. No text, letters, logos, watermark, panel borders or bubbles. Portrait2:3.
```

