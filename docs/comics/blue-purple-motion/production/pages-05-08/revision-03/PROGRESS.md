# Correction du bras de John — 7 novembre 2026

Demande : le propriétaire signale le membre incohérent dans la pose de recul du coup
de John. Corriger le prototype apprécié et le comic complet ; conserver les méthodes
de mouvement comme référence pour la suite.

Diagnostic confirmé sur le raster source `revision-01/art/p05-c03-pose-03-recoil.png` :
un bras replié devant le torse et une manche/poing pendant au même côté produisent
une insertion anatomique incohérente. Le défaut est déjà dans le dessin, sans mélange
de poses par le moteur. Revoir aussi les trois poses voisines et le master papier.

Root : édition ImageGen unique, sélection/manifestes et intégration.
Art : contre-revue des quatre poses et de la correction, QA-IMAGES.md seulement.
Montage : nouveaux outils/exports et EDIT.md ; longs rendus après gel de la correction.
Les agents préservent les autres fichiers. Aucune nouvelle voix, musique ou SFX.

Nouvelle allocation : deux appels ImageGen maximum, un initial et une correction
seulement sur défaut constaté. Historique connu pages5–8 :28 appels ; nouveau maximum30.
TTS3394 caractères cumulés, SFX6 requêtes/20s : inchangés. Deux exports simultanés maximum.
Les plafonds des lots précédents ne sont pas utilisés comme autorisation implicite.

État final : une correction ImageGen, 29 appels connus cumulés. Composite c263491e…
sélectionné après revue agrandie indépendante ; poing original et pixels hors masque
préservés. READY/CONTACT/DOWN et master papier sans défaut similaire observé.

Nouvelle sélection v5 validée, 37 voix/226,60 s inchangées. Prototype v2 corrigé produit
et décodé (16,5 s), méthode appréciée conservée dans le guide et le skill animation.
Trois MP4 page5/lot/complet produits et entièrement décodés ; les flux AAC sont
bit-identiques aux précédents. Les douze images H264 contact/recul/départ ont une
contre-revue favorable. 7 880 PNG source réemployés avec hashes exacts, 29 rendus dont
six gardes identiques. Trois snapshots/treize pages comparés sémantiquement par SHA.

Lecteur v5 sur50588, prototypev2 sur50920 ; anciens liens redirigés. Séquence, cinq
formats, clavier, son, plein écran et mouvements réduits passent. 32 tests motion comics
et `npm run verify` passent. Sources et six films v4 préservés. [Livraison](DELIVERY.md)
relie fichiers, SHA, preuves et sauvegarde finale. Prochaine étape : écriture de la suite
à la borne, selon le suivi central. Aucun commit/push, aucune nouvelle voix/SFX/musique.
