# Storyboard — reprise ciblée 02

6 novembre 2026. [Contrat compact version1](CONTRACTS.json), prêt pour contre-revue avant production. Base : sélection `blue-purple-pages01-08-v3.json` et ses médias conservés. Seuls trois changements visuels et leur raccord sonore sont demandés ; aucune nouvelle histoire, voix ou réplique.

La page5 case4 montre désormais une vitre intacte, puis son bris. La transition vers la case commence15,60s et finit15,90s. La vitre reste intacte **0,50s en cadre stable**, de15,90 à16,40s ; le tir et le passage au dessin brisé arrivent ensemble à16,40s. Franklyn réagit à16,60s, sa prise27 dure1,68s jusqu’à18,28s. Après0,10s, Abigail crie à18,38s et finit19,34s. Gap final finit19,44s, case reste jusqu’à20,40s ; la page finit20,90s.

Le lead-in de0,70s est ajouté au calendrier avant la première réplique, dans la tenue existante4,50s. Il ne remplace ni n’étire la voix. **82s pour pages5–8 et226,60s au complet restent inchangées.** FFmpeg a décodé intégralement les deux sources le6novembre :27=1,68s et17=0,96s, exit0 et aucune erreur. Tous les autres onsets/tenues restent ceux de la sélection.

Wendy a déjà averti de quitter les fenêtres en case2 et John a assommé le barman en case3. Pas de tir en vuepage ou pendant transition vers case4. Le dessin intact couvre la fenêtre avant impact, même en miniature/vuepage avant révélation ; la miniature peut simplement garder le master intact. Au tir, changement net vers dessin brisé existant, éclats brefs et son. Aucune régénération de l’état brisé, aucune nouvelle pose ni déplacement de mains/personnages. Bulles françaises éditables inchangées, yeux/mains/écussons protégés.

Page6, le mouvement reste seulement dans les extrémités libres des mèches. Crâne, sommet, racines, visage et accessoires restent immobiles. Juger la silhouette complète et les phases ; un masque qui emporte la tête ne convient pas même si les yeux ne changent pas.

Page8 dernière case, la voiture reprend sa position initiale et reste fixe : aucune translation, réduction d’échelle, rotation ou déplacement d’ombre. Le vent et des particules directionnelles autour du véhicule suggèrent sa vitesse. Carrosserie, roues, ombre, vitres et bulle sont protégées. L’enfant garde sa bulle intérieure sans queue ; texte/voix et timing inchangés. Ni bande lumineuse ni glissement du raster complet.

Coup de John, tir/verre et démarreur doivent être francs et synchrones. Réemployer sixSFXElevenLabs et trois compléments locaux, musique et37voix existants ; ajuster mix/enveloppes sans saturation ni masque des voix. Aucune écoute humaine n’est présumée par ces mesures.

La reprise autorise au maximum trois appelsImageGen : une vitre intacte et deux corrections uniquement sur diagnostic, opérateurart seul après contre-revue. Historique27, plafondcumulé30. TTSnouveau0, cumul3394inchangé ; SFX/musique générations0. Deux exports simultanés maximum, dans de nouveaux dossiers après revue réelle.

Réalisation possède seulement les deux présents fichiers. Aucun appel payant ni média nouveau produit ici. Animation implémente le lead-in partagé lecteur/export et les régions sûres ; audio resynchronise les accents, montage recalcule et assemble, qualité contre-revoit versions exactes puis exports. Préserver toute la livraison et les historiquesrévision01.
