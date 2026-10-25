# Politique de confidentialité : brouillon technique pour le conseiller

**Statut : BROUILLON à faire relire par un juriste. Ce n’est pas un avis juridique et ce texte n’est pas à publier tel quel.** Rédigé par l’équipe technique à partir du fonctionnement réel de l’application, le 25 octobre 2026. Il traduit `PRIVACY_NOTICE_DRAFT.md` ; en cas d’écart, la version anglaise fait foi jusqu’à la relecture. Les mentions **[à confirmer]** relèvent du responsable du produit, les mentions **[à faire]** de ce que l’application ne fait pas encore.

## Qui sommes-nous
LifeBook **[à confirmer : entité juridique, adresse, pays d’établissement, contact pour les demandes relatives aux données, DPO le cas échéant]**. Contact : hello@lifebook.app **[à confirmer : boîte suivie]**.

## Ce que nous collectons, et pourquoi

| Donnée | Origine | Finalité | Conservation |
| --- | --- | --- | --- |
| Nom, e-mail, identité de connexion | Connexion Google via Clerk | Créer et sécuriser votre compte | Gérés par Clerk ; LifeBook ne garde qu’un identifiant interne |
| Parcours de foi, objectifs, formats préférés, langue | Accueil et Paramètres | Préparer votre espace ; avec votre accord, suggérer des plans de lecture | Champs en clair |
| Vos choix de consentement et leur historique | Accueil et Paramètres | Montrer ce que vous avez accepté, et quand | Champs en clair, avec la date de chaque changement |
| Prières de votre journal, notes d’exaucement | Vous les écrivez | Votre journal privé | **Chiffrées** (AES-256-GCM, liées à l’enregistrement) |
| Le verset choisi pour chaque prière | Choisi quand vous enregistrez ou modifiez une prière (voir plus bas) | Afficher un passage de l’Écriture sous votre prière | **Chiffré** avec la prière |
| Méditations guidées | Rédigées à votre demande pour une prière | Votre réflexion privée | **Chiffrées** avec la prière |
| Réflexions de la Parole du jour et des méditations | Vous les écrivez | Vos réflexions privées | **Chiffrées** ; 2 réflexions écrites avant le chiffrement sont encore en clair **[à faire : les chiffrer avant le lancement]** |
| Notes bibliques, signets, surlignages | Vous les ajoutez | Votre étude | Notes **chiffrées** ; signets et couleurs en clair |
| Historique de lecture, progression, étapes de la Parole du jour | Votre usage du lecteur et du temps de prière | Reprendre où vous en étiez et montrer votre semaine | Champs en clair |
| Demandes d’accompagnement pastoral et messages | Vous et le pasteur | Permettre à un pasteur vérifié de vous écouter et de prier avec vous | **Chiffrés** ; supprimés **90 jours** après la clôture |
| Signalements de sécurité sur une conversation | Vous ou un pasteur | Protection des personnes | **Chiffrés** ; conservés **365 jours** après leur résolution |
| Compteurs d’usage de l’IA | Chaque utilisation d’une fonction d’IA | Appliquer les limites quotidiennes | Nom de la fonction, « produit » ou « non produit », et l’heure ; jamais le texte |

**Données sensibles.** Les prières, réflexions et choix de foi révèlent des convictions religieuses et peuvent révéler des informations de santé ou d’autres sujets sensibles. Le conseiller doit fixer la base légale (probablement le consentement explicite) et la formulation.

## Le verset sous votre prière
Quand vous enregistrez une prière, ou modifiez son texte, LifeBook choisit un passage de l’Écriture à afficher dessous.

1. **D’abord la sécurité, sur notre serveur.** Le texte est vérifié pour repérer des signes qu’une personne pourrait être en danger. Dans ce cas, vous voyez des numéros d’aide et la possibilité de parler à un pasteur, au lieu d’un verset.
2. **Par défaut, rien ne quitte LifeBook.** Les mots de votre prière sont rapprochés de l’un des thèmes de prière de LifeBook sur notre propre serveur, et l’un des passages de ce thème est affiché.
3. **Uniquement si vous le demandez, l’IA choisit à la place.** Si vous avez activé le *traitement IA facultatif* dans les Paramètres **et** cochez *« Laisser l’IA choisir le verset de cette prière »* sur cette prière, son texte est envoyé à **OpenAI**. Il passe d’abord par le contrôle de sécurité d’OpenAI, puis par un modèle qui ne peut que choisir un passage dans la liste de LifeBook. Activer le paramètre ne suffit jamais à envoyer une prière. Les requêtes utilisent `store: false` **[à confirmer : conditions de conservation du compte et statut « zero data retention »]**.

Le verset choisi est conservé chiffré avec votre prière et supprimé avec elle.

## Ce que nous ne faisons pas
- Nous n’utilisons pas vos prières, réflexions ou lectures pour établir votre profil ou évaluer votre maturité spirituelle.
- **Les suggestions personnalisées** sont désactivées sauf si vous les activez. Elles n’utilisent que le parcours et les objectifs que vous avez choisis, et des comptages comme le fait d’avoir commencé un plan de lecture. Jamais le contenu de vos prières.
- Nous ne vendons pas de données et n’affichons pas de publicité **[à confirmer]**.
- La Parole du jour est la même pour tous.

## Quand un texte quitte LifeBook
- **IA, seulement à votre demande sur une prière précise :** méditation guidée, ou verset choisi par l’IA. Le texte de cette prière est envoyé à **OpenAI**, comme décrit plus haut. Votre nom et votre compte ne sont pas transmis.
- **Comptage de lecture des Écritures :** quand vous lisez un texte fourni par **API.Bible** (Société biblique américaine), LifeBook signale un usage anonyme pour que les éditeurs voient leurs traductions lues. Cela concerne KJV, BSB, WEB, NKJV et GNT en anglais, et J.N. Darby en français. Seuls un jeton pour le passage, un identifiant d’appareil aléatoire et un identifiant de session aléatoire sont envoyés, depuis notre serveur, jamais votre nom, votre e-mail ou votre compte. **La Bible Louis Segond 1910** est servie depuis la copie de LifeBook : la lire n’envoie rien à personne.

## Si vous postulez pour servir comme pasteur
La candidature est facultative et ne concerne que le pilote d’accompagnement pastoral.

| Ce que vous indiquez | Qui le voit | Conservation |
| --- | --- | --- |
| Nom affiché, adresse du profil, courte présentation, langues, Église, rôle, pays | Le référent protection ; **les membres seulement après validation** | Champs en clair |
| Le nom d’une référence | Le référent protection | Champ en clair |
| Le téléphone ou l’e-mail de la référence | Le référent protection, pour vérifier votre candidature | **Chiffré** ; chaque ouverture de la liste des candidatures est enregistrée |
| Formation suivie et sa date, et la date d’acceptation du code de conduite | Le référent protection | Champs en clair |
| La décision du référent et la note éventuelle qui vous est renvoyée | Vous et le référent protection | Champs en clair |

**La référence** est un tiers dont vous nous donnez les coordonnées. Le conseiller doit préciser comment cette personne en est informée **[conseiller]**.

**Durée de conservation :** jusqu’au retrait de la candidature ou à la suppression de votre compte **[à confirmer : faut-il supprimer une candidature refusée après un certain délai ?]**.

## Qui traite des données pour nous
| Service | Rôle | Localisation |
| --- | --- | --- |
| Clerk | Connexion et sécurité du compte | **[à confirmer]** (entreprise américaine) |
| Supabase | Base de données | Francfort, UE |
| Render | Hébergement de l’API | **[à confirmer : région]** |
| Vercel | Hébergement web | **[à confirmer : région]** |
| OpenAI | Méditation guidée et verset choisi par l’IA, seulement à votre demande sur une prière ; contrôles de sécurité de ces demandes | États-Unis **[à confirmer : mécanisme de transfert]** |
| API.Bible | Texte biblique pour la plupart des versions ; comptages anonymes | États-Unis |
| Google | Connexion, si vous la choisissez | **[à confirmer]** |

Les transferts internationaux (vers les États-Unis) nécessitent un mécanisme juridique **[conseiller]**.

## Ce qui reste sur votre appareil
Uniquement des préférences :
- thème, langue et réglages de lecture ;
- votre version de la Bible pour chaque langue ;
- durée et carillon du temps de prière ;
- les fenêtres d’accueil ou de nouveautés déjà vues, et les suggestions masquées ;
- un identifiant d’appareil et un identifiant de session aléatoires pour le comptage des lectures.

Sur l’application mobile, elles sont gardées dans le stockage sécurisé de l’appareil. Il n’y a pas de cookies publicitaires ni de traceurs tiers **[à confirmer, y compris ce qu’ajoute Clerk]**.

## Registres de protection
Quand le référent protection ouvre un signalement, valide ou renvoie une candidature, ouvre la liste des candidatures, ou suspend ou rétablit un pasteur, LifeBook enregistre qui l’a fait et quand. Ces registres ne contiennent aucun texte de conversation **[à confirmer : durée de conservation]**.

## Durées de conservation
- **Accompagnement pastoral :** 90 jours après la clôture d’une demande.
- **Signalements de sécurité :** 365 jours après leur résolution.
- **Tout le reste :** jusqu’à ce que vous le supprimiez, ou que vous supprimiez votre compte (Paramètres → Supprimer mon compte), ce qui l’efface immédiatement. Les signalements déjà faits sur une conversation sont conservés jusqu’à leur propre date de suppression, pour la protection des personnes.
- **Sauvegardes :** **[à confirmer : durée de conservation des sauvegardes Supabase]**.

## Vos droits
Vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité, et vous pouvez retirer votre consentement à tout moment. Vous pouvez saisir l’autorité de contrôle : la CNIL en France, ou la Data Protection Commission au Ghana.

Dans les Paramètres, vous pouvez :
- télécharger toutes vos données : un fichier avec tout ce que LifeBook détient sur vous, déchiffré pour vous ;
- supprimer vos prières une à une ou toutes à la fois ;
- supprimer votre compte et ses données ;
- modifier vos choix, notamment désactiver les suggestions et le traitement IA facultatif.

## Enfants
**[à confirmer : âge minimum.]** LifeBook n’est pas conçu pour les enfants de moins de **[13/15/16]** ans, et l’inscription doit l’indiquer.

## Modifications
Nous mettrons cette politique à jour quand les fonctions changent, en indiquant en tête ce qui a changé.
