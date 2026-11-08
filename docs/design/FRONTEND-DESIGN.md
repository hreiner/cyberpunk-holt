# Design frontend HOLT

Guide adapté du texte `frontend-design` fourni par le propriétaire le 7 novembre 2026.
Il s'applique aux créations/refontes d'interfaces du projet. Les choix explicites du
propriétaire et les contraintes du produit déterminent la direction ; une tendance
graphique n'est pas une règle à imposer à toutes les pages.

## Avant de coder

Identifier le sujet, les utilisateurs et l'action principale depuis le brief et le
produit existant. Si ce contexte est disponible, avancer sans nouveau questionnaire.
Pour l'interface du jeu, lire aussi [son système visuel](../art/UI-DESIGN-SYSTEM.md).

Écrire un plan compact dans le document de design concerné : palette nommée de quatre
à six valeurs, une ou deux familles typographiques et leurs rôles, hiérarchie et
alignements, petite comparaison de mises en page, comportement mobile et clavier.
Relire le plan contre le brief avant construction. Corriger les choix génériques qui
ne servent pas ce produit ; cette critique interne n'est pas une demande d'approbation
systématique du propriétaire.

## Construire une identité précise

Faire du contenu caractéristique du sujet le point fort : dessin pour un lecteur,
carte pour une exploration, décisions pour une interface tactique. Garder les autres
éléments calmes et supprimer les ornements qui n'aident pas à comprendre ou agir.

Choisir délibérément la typographie, sa largeur, ses poids et son échelle. Les titres
peuvent porter l'identité ; la lecture courante reste confortable, généralement sous
80 caractères par ligne. Éviter les styles automatiques : mot isolé accentué dans un
titre, étiquettes en capitales partout, sous-titres décoratifs et métadonnées gratuites.

Employer bordures, numéros, divisions et contrastes pour exprimer une structure réelle.
Ne pas découper tout contenu en cartes arrondies identiques, ni utiliser un dégradé,
un accent fluorescent ou une grille éditoriale simplement parce que c'est familier.
Ces moyens restent valables si le brief et la matière les justifient.

Réserver le mouvement non sollicité à une intention claire. Une transition répondant
à une action aide à comprendre son résultat ; des entrées et effets de survol répétés
sur chaque bloc peuvent distraire. Respecter les mouvements réduits, sans modifier
silencieusement le sens du contenu.

## Écrire et vérifier

Nommer les actions depuis le point de vue du lecteur/joueur, en français, avec des
verbes précis et une casse de phrase. Garder le même nom pour une action et son état.
Ne pas afficher les détails d'implémentation qui ne l'aident pas à décider. Les états
vides et erreurs donnent une prochaine action compréhensible.

Structurer les styles pour éviter les spécificités qui se neutralisent. Vérifier
petit écran, très grand écran, portrait/paysage, focus visible, clavier, contrastes,
commandes tactiles et contenu réel. Ouvrir quelques captures aux vues décisives,
critiquer cadrage/hiérarchie/lisibilité puis corriger. Une capture ne remplace pas
les contrôles fonctionnels ; un bon calcul ne prouve pas la qualité visuelle.

Le skill canonique est [holt-frontend-design](../../.agents/skills/holt-frontend-design/SKILL.md).
Pour le lecteur motion comics : [design de la passe plein écran](MOTION-COMICS-READER.md).
