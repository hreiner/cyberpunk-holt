# Animé HOLT — pistes pour un saut de qualité

Étude et essai locaux du 4 novembre 2026. Les personnages et le rendu du jeu restent
inchangés. Le [blocage précédent](BLENDER-SCENE.md) n'est pas une base artistique finie :
poses debout, absence de modèle Wendy, GLB dépourvus de formes faciales et look réaliste.
La cible visuelle de la session est `target-v2.png`
dans le dossier de visualisation Blender ; elle est une image générée, pas un rendu 3D.

## Options et décision proposée

1. **Personnages anime avec rig facial** : tester un personnage dédié format VRM, avec
   yeux, sourcils et au minimum cinq voyelles, avant de recréer Wendy et les cadets.
   [VRoid Studio](https://vroid.com/en/studio) est gratuit et permet de créer des
   personnages personnalisés ; le [VRM Add-on for Blender](https://github.com/saturday06/VRM-Addon-for-Blender)
   annonce import, expressions et MToon pour Blender 4.2. L'outil n'a pas encore été
   installé ni VRoid testé : qualité et fidélité HOLT restent à démontrer. Le format VRM
   apporte une structure d'expressions, pas une garantie que chaque modèle possède tous
   les contrôles ou l'apparence voulue. Les personnages VRM ne remplacent pas les GLB du jeu.
2. **Solution alternative** : remonter aux masters MPFB et générer/exporter les formes
   d'expression dans une variante cinéma ; les GLB de jeu ont été exportés avec
   `export_morph=False`. Cela peut préserver l'identité HOLT, mais n'établit ni des
   visèmes corrects ni un style anime. Comparer les deux sur le même gros plan avant de
   choisir ; ajouter des formes faciales demande un réel travail de rig et d'évaluation.
3. **Voix → visèmes** : [Rhubarb Lip Sync](https://github.com/DanielSWolf/rhubarb-lip-sync)
   calcule localement une suite de formes à partir d'une prise et du texte anglais. Ses
   sorties sont conçues pour la 2D ; les relier à des morphs VRM impose un mapping et un
   lissage propres, plus une correction à l'écoute. Le niveau sonore seul n'est pas une
   reconnaissance phonétique. Ne pas qualifier automatiquement le résultat de lip-sync validé.
4. **Corps et décor** : partir de poses assises réelles (rig, contraintes, appuis et mains
   réglés plan par plan), retargeter les clips Mixamo disponibles, puis ajouter regards et
   poses d'écoute. Le [retarget Rokoko dans Blender](https://support.rokoko.com/hc/en-us/articles/4410463481489-Retarget-an-animation-in-Blender)
   est annoncé gratuit ; il n'a pas été testé sur les rigs HOLT. Remplacer le bar construit
   en primitives par un vrai décor composé d'assets, puis retravailler sa géométrie, sa
   lumière et son stylisme ; [Poly Haven](https://polyhaven.com/about-contact) propose des
   assets téléchargeables. Leur présence n'assure pas un décor Blue Purple prêt à l'emploi.
5. **Rendu** : concevoir un vrai look toon dans EEVEE, avec ombres par paliers, contours,
   couleurs et lumières réglées sur la cible. Blender documente [Shader to RGB](https://docs.blender.org/manual/en/4.5/render/shader_nodes/converter/shader_to_rgb.html),
   disponible sous EEVEE, et [Grease Pencil](https://docs.blender.org/manual/en/latest/grease_pencil/)
   pour des interventions dessinées. Le style ne viendra pas d'un shader seul : modèles,
   expressions, animation, décors, cadrage et montage comptent autant.

Option hybride à comparer : décors 3D toon, plans anime dessinés en couches, bouches et
expressions 2D pour les dialogues, quelques plans 3D animés. Elle peut rapprocher plus vite
l'image cible ; elle exige toutefois des dessins séparés et ne donne pas une liberté de
caméra complète. Les deux voies méritent un même test court avant toute fabrication longue.

## Preuves de faisabilité exécutées

- Téléchargement local depuis la [release officielle Rhubarb 1.14.0](https://github.com/DanielSWolf/rhubarb-lip-sync/releases/tag/v1.14.0)
  (archive Windows SHA-256 `62fa416a8d5e382a3828ee4bef358ce520d0b4cabdeaea75a7ac266d098d1fe3`),
  sous `art-masters/tools/rhubarb-1.14.0/`, hors Git. Pas de modification système.
  Une prise ElevenLabs existante de Wendy a été convertie en WAV puis analysée avec son texte :
  5,6 s, 39 intervalles, formes A/B/C/E/F/X ; résultats et texte sous
  `art-masters/anime/experiments/rhubarb/`. Aucun appel ElevenLabs supplémentaire.
- Téléchargement de [Seed-san, exemple du consortium VRM](https://github.com/vrm-c/vrm-specification/tree/master/samples/Seed-san),
  `art-masters/anime/experiments/vrm/Seed-san.vrm`, SHA-256
  `624d0d554bc205bbdc33e22a68a2c3c20dedebb3e573011ead8878a65e5329b23`.
  Métadonnées intégrées : auteur VirtualCast, Inc. et attribution requise. C'est un
  personnage témoin tiers, pas Wendy ni un modèle HOLT. Son maillage `head` contient
  notamment `lip_a`, `lip_i`, `lip_u`, `lip_e`, `lip_o`, `lip_w`, clignements et sourcils.
- Le même fichier copié en `.glb` a été importé avec l'importeur glTF de Blender 4.2,
  sans installer d'extension. Deux images `closed.png` et `open.png` montrent un changement
  de bouche. L'import glTF simple n'atteste pas de l'import complet VRM/MToon ni du rig.
  Un essai `lipsync-test-v2.mp4` de 5,63 s utilise 45 images Blender à 8 i/s et la prise
  de Wendy : mapping de visèmes **approximatif**, sans validation de correspondance
  phonétique, ni écoute humaine, ni qualité artistique. Le premier export, en résolution
  impaire, a échoué ; le second réussit en 306 × 306. Le script de cette expérience et le
  `.blend` sont conservés dans `art-masters/anime/experiments/vrm/`.
- Blender EEVEE a aussi rendu deux images du témoin à 512 × 512 et huit échantillons.
  Cela prouve une exécution locale, pas le coût d'une scène complète ni le fonctionnement
  d'un toon shader. L'image témoin est en pose neutre et n'a pas été adaptée à la cible.

## Prochain essai recommandé

Fabriquer un **seul plan de 5 à 10 secondes de Wendy** : prototype VRM original, pose
assise et visage conforme à la cible ; importer dans Blender avec textures et MToon,
établir un mapping Rhubarb→visèmes et le corriger à l'écoute, ajouter regards/clignements,
décor et cadrage. Mesurer temps par image sur GTX 1070 et en CPU, produire un plan avec
sous-titres et comparer côte à côte au même dialogue traité en 2D découpée. Valider qualité
et identité avant de multiplier les personnages. Les outils et l'essai ci-dessus ne prouvent
pas qu'on atteindra la cible de qualité ni qu'une conversion automatique d'une image vers un
personnage animé existe.
