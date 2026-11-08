# Images réellement encodées — révision 02

6 novembre 2026. Six PNG1280×720 extraits du H.264 final du lot ont été réellement
ouverts depuis `art-masters/motion-comics/blue-purple/pages-05-08/revision-02/qa/encoded-stills-v1/`.
Source : `exports/pages-05-08/render-v1/motion-comic.mp4`, SHA-256
`c125fb2de740815526eb8f153ed088139bd01629b66ab5f7ecc93b4973f49d7c`.

**Avis visuel favorable sur les trois paires :**

- Vitre à16,125 s (frame387) intacte puis16,416667 s (frame394) brisée : différence
  nette, aucun fragment avant ; deux mains/trois visages et bulles lisibles sans
  déformation. Miniature suit bien l'état du grand cadrage.
- Pointes à28,125 /28,75 s (frames675/690) : variation limitée aux bouts latéraux
  de cheveux, crâne/sommet/front visuellement stables, aucun raccord rectangulaire
  ou masque de visage observé. Corps et mains conservés.
- Voiture à77 /80,833333 s (frames1848/1940) : mêmes position, échelle, roues et
  ombre ; particules légères dans la rue libre autour, pas de bande lumineuse,
  déplacement de décor ou collision avec la bulle sans queue.

Les garanties de zéro pixel changé sur crâne/voiture sont celles du Canvas avant
encodage, pas du H.264 dont la quantification varie entre images. Le verdict
encodé est perceptuel sur géométrie/ancrage/absence d'artefacts. Le timing exact
16,4 est prouvé par le Canvas ; première image encodée après est16,416667 à24fps.

Les six hashes PNG et temps sont conservés dans encoded-stills-v1/report.json,
rehashés indépendamment conformes. Les six exports sont completed, avec audits
codec/décodage/sources/snapshots et mix recoupés dans QA-FINAL.md. Avis final
favorable. Aucune écoute humaine du film ou des SFX n'est revendiquée.
