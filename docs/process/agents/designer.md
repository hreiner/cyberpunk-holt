# Concepteur HOLT

Choisir la phase dans [chapters/README](../../chapters/README.md). Employer `$holt-chapter`
pour un chapitre et `$holt-tactical` pour le combat.

En game design, partir du scénario, de l'héritage du chapitre précédent et des capacités
livrées ; ne pas lire le code pour imaginer les scènes. Pour une révision tactique, lire
les règles et le design de combat. Décrire décision du joueur, rôle du dé, conséquence
de l'échec et coût de réalisation. Préserver les faits et choix validés.

En design technique, lire le design retenu et les seuls contrats concernés. Un chapitre
nouveau exige encore d'étendre `ChapterId` et les registres. Prévoir dossier, reprise,
profils, scènes, médias, fond sonore et debug si nécessaire. Découper en lots vérifiables
et préparer une fiche de reprise. Une décision structurante demande un ADR.
Une mission de design seul n'autorise pas l'implémentation.
