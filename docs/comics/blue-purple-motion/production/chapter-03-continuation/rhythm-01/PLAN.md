# Rythme v11 — 17 novembre 2026

Demande du propriétaire : transitions0,85→0,4s et suppression de la vue page entière
entre les pages, pour une lecture continue. La sélectionv10 acceptée et sa release
restent conservées ; cette correction livrev11 au même point d'entrée public.

Les21pages narratives ont `overviewSeconds:0` et `outroSeconds:0`. Les transitions
déjà plus courtes des pages5–8 restent0,3s ; les autres passent0,4s. La couverture
musicale reste12s. Les tenues, attentes avant réplique, intervalles et prises restent
à leur durée native. Le bouton manuel «Vue page» reste disponible.

Le moteur1.4.1 retire les segments de vue page de durée nulle : ils ne servent plus
de point de départ à un zoom depuis la page entière. Chaque page commence cadrée
sur sa première case et passe directement à la suivante en fin de lecture.

[TIMING](TIMING.json) gèle la correspondance de toutes les horloges et sources :
584,3→491,9s, soit92,4s retirées sans raccourcir les temps de lecture des cases.
Les animations et révélations sont décalées sur leur case, sans accélérer les
gestes. Le backing est reconstruit depuis les matières et les nouvelles ancres.

Contrôles attendus :99prises identiques et à vitesse native, mêmes tenues/lettres/
dessins, calques dans leur tenue, accents de vitre/tir/capsule/eau/porte recalés,
zéro vue page automatique aux21raccords, séquence serveur/Canvas identique,
pause/reprise et navigation froide progressives, paquet puis vraie URL déployée.
