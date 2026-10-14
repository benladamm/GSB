# Documentation du Modèle Conceptuel de Données (MCD) — GSB

> **Projet :** Galaxy Swiss Bourdin (GSB) — Portail E-Commerce pour Professionnels de Santé  
> **Cadre :** BTS SIO SLAM — 2ᵉ année  
> **Livrable :** Schéma MCD sous format Draw.io (`mcd_gsb.drawio`) et SVG (`mcd_gsb.svg`)  
> **Méthode :** MERISE  
> **Date :** Septembre 2026 — Version 1.0  

---

## 1. Contexte et Objectifs du Projet

Le laboratoire pharmaceutique international **Galaxy Swiss Bourdin (GSB)** souhaite moderniser ses outils numériques en déployant une plateforme web e-commerce dédiée aux professionnels de santé (médecins, pharmaciens, etc.).

### Périmètre fonctionnel couvert par le MCD :
1. **Gestion des accès et de la sécurité :**
   - Création exclusive des comptes professionnels et fournisseurs par un **Administrateur GSB**.
   - Changement obligatoire du mot de passe lors de la première connexion (`doit_changer_mdp`).
   - Gestion fine des rôles (Professionnel de santé, Fournisseur partenaire, Administrateur).
2. **Catalogue de médicaments :**
   - Médicaments caractérisés par : nom, description, image, prix HT, prix TTC, taux de TVA, quantité en stock.
   - Organisation par **Catégories** (ex. Antalgiques, Antibiotiques, Anti-inflammatoires).
3. **Gestion des Fournisseurs (Laboratoires Partenaires) :**
   - Les fournisseurs partenaires proposent des médicaments.
   - **Contrôle Administrateur :** Tout médicament proposé a un statut initial (`EN_ATTENTE`) et doit être validé ou rejeté par un administrateur GSB avant mise en vente.
4. **Gestion du Panier :**
   - Panier actif associé à chaque professionnel de santé, permettant d'ajouter, modifier les quantités ou retirer des articles.
5. **Gestion et Historique des Commandes :**
   - Transformation du panier en commande avec adresse de livraison et statut de suivi (`EN_ATTENTE`, `VALIDEE`, `EXPEDIEE`, `LIVREE`, `ANNULEE`).
   - **Historisation comptable :** Figeage du prix unitaire HT et du taux de TVA au moment exact de la commande au sein des lignes de commande.

---

## 2. Dictionnaire des Données

| Entité / Association | Attribut | Type conceptuel | Description & Règle métier |
| :--- | :--- | :--- | :--- |
| **ROLE** | `id_role` | INT | Identifiant unique du rôle (**Clé primaire**) |
| | `code` | VARCHAR(20) | Code technique unique (`ADMIN`, `PRO_SANTE`, `FOURNISSEUR`) |
| | `libelle` | VARCHAR(50) | Désignation lisible du rôle |
| | `description` | VARCHAR(255) | Description des permissions associées |
| **UTILISATEUR** | `id_utilisateur` | INT | Identifiant unique de l'utilisateur (**Clé primaire**) |
| | `nom` | VARCHAR(50) | Nom de famille |
| | `prenom` | VARCHAR(50) | Prénom |
| | `email` | VARCHAR(100) | Adresse email (identifiant de connexion, unique) |
| | `mot_de_passe` | VARCHAR(255) | Mot de passe sécurisé (haché par algorithme bcrypt/argon2) |
| | `telephone` | VARCHAR(20) | Numéro de téléphone de contact |
| | `adresse` | VARCHAR(150) | Adresse postale professionnelle / établissement |
| | `code_postal` | VARCHAR(10) | Code postal |
| | `ville` | VARCHAR(50) | Ville de résidence ou d'exercice |
| | `type_profession` | VARCHAR(50) | Profession médicale (Médecin, Pharmacien, etc.) |
| | `numero_rpps` | VARCHAR(20) | Numéro RPPS ou identifiant professionnel de santé |
| | `doit_changer_mdp` | BOOLEAN | `TRUE` à la création, force le changement au 1er login (CDC) |
| | `actif` | BOOLEAN | Compte actif ou suspendu par l'administration |
| | `date_creation` | DATETIME | Horodatage de création du compte |
| **FOURNISSEUR** | `id_fournisseur` | INT | Identifiant unique du laboratoire partenaire (**Clé primaire**) |
| | `raison_sociale` | VARCHAR(100) | Nom légal ou dénomination commerciale du fournisseur |
| | `siret` | VARCHAR(14) | Numéro d'immatriculation SIRET (14 chiffres) |
| | `email_contact` | VARCHAR(100) | Email professionnel du contact fournisseur |
| | `telephone` | VARCHAR(20) | Numéro de téléphone standard |
| | `adresse` | VARCHAR(150) | Siège social du laboratoire |
| | `code_postal` | VARCHAR(10) | Code postal |
| | `ville` | VARCHAR(50) | Ville du siège social |
| | `actif` | BOOLEAN | Partenaire actif ou révoqué |
| **CATEGORIE** | `id_categorie` | INT | Identifiant unique de la catégorie (**Clé primaire**) |
| | `libelle` | VARCHAR(50) | Libellé (ex. *Antalgiques*, *Cardiologie*, *Dermatologie*) |
| | `description` | TEXT | Description de la famille de produits |
| **MEDICAMENT** | `id_medicament` | INT | Identifiant unique du médicament (**Clé primaire**) |
| | `nom` | VARCHAR(100) | Dénomination commerciale du médicament (CDC Tableau 4) |
| | `description` | TEXT | Présentation et informations du produit (CDC) |
| | `image_url` | VARCHAR(255) | Chemin d'accès ou URL de l'illustration (CDC) |
| | `prix_ht` | DECIMAL(10,2) | Prix catalogue unitaire hors taxes (CDC) |
| | `prix_ttc` | DECIMAL(10,2) | Prix unitaire toutes taxes comprises (CDC) |
| | `taux_tva` | DECIMAL(5,2) | Taux de TVA applicable en % (ex. 2.10, 5.50, 10.00, 20.00) |
| | `quantite_stock` | INT | Stock physique disponible en entrepôt |
| | `statut_validation` | VARCHAR(20) | Statut de modération (`EN_ATTENTE`, `VALIDE`, `REFUSE`) |
| | `date_creation` | DATETIME | Date d'ajout du produit par le fournisseur |
| **PANIER** | `id_panier` | INT | Identifiant unique du panier (**Clé primaire**) |
| | `date_creation` | DATETIME | Date d'initialisation du panier |
| | `date_mise_a_jour` | DATETIME | Date de la dernière modification d'un article |
| **COMMANDE** | `id_commande` | INT | Identifiant unique de la commande (**Clé primaire**) |
| | `numero_commande` | VARCHAR(50) | Référence unique de commande (ex. `CMD-2026-000123`) |
| | `date_commande` | DATETIME | Date et heure de validation définitive du panier |
| | `statut_commande` | VARCHAR(30) | `EN_ATTENTE`, `VALIDEE`, `PREPARATION`, `EXPEDIEE`, `LIVREE`, `ANNULEE` |
| | `montant_total_ht` | DECIMAL(10,2) | Somme totale HT des lignes de commande |
| | `montant_total_ttc` | DECIMAL(10,2) | Somme totale TTC calculée |
| | `adresse_livraison` | VARCHAR(150) | Adresse de destination retenue pour la livraison |
| | `code_postal_livraison` | VARCHAR(10) | Code postal de livraison |
| | `ville_livraison` | VARCHAR(50) | Ville de livraison |
| *(Assoc.)* **VALIDER** | `date_validation` | DATETIME | Date de la décision d'un administrateur GSB |
| | `commentaire` | TEXT | Remarque ou motif éventuel en cas de refus |
| *(Assoc.)* **CONTENIR** | `quantite` | INT | Nombre d'unités du médicament dans le panier |
| | `date_ajout` | DATETIME | Horodatage d'ajout dans le panier |
| *(Assoc.)* **COMPOSER** | `quantite_commandee` | INT | Quantité facturée pour cette ligne de commande |
| | `prix_unitaire_ht` | DECIMAL(10,2) | Prix HT gelé au moment de l'achat (intégrité facture) |
| | `taux_tva` | DECIMAL(5,2) | Taux TVA gelé au moment de l'achat |

---

## 3. Règles de Gestion (RG) et Associations Merise

### RG1 — Gestion des Rôles et Utilisateurs (`AVOIR_ROLE`)
- Un utilisateur possède **un et un seul** rôle : `UTILISATEUR (1,1)`.
- Un rôle peut être attribué à **zéro, un ou plusieurs** utilisateurs : `ROLE (0,n)`.

### RG2 — Approvisionnement Libre & Multi-Fournisseurs
- Les professionnels de santé s'approvisionnent librement auprès de l'ensemble des laboratoires partenaires disponibles au catalogue.
- Il n'y a pas de lien d'exclusivité ou de rattachement direct entre un utilisateur et un fournisseur. Les relations commerciales s'opèrent par les commandes passées contenant des médicaments de divers laboratoires.

### RG3 — Provenance des Médicaments (`PROPOSER`)
- Un médicament est proposé par **un et un seul** fournisseur partenaire : `MEDICAMENT (1,1)`.
- Un fournisseur partenaire peut proposer **zéro, un ou plusieurs** médicaments au catalogue GSB : `FOURNISSEUR (0,n)`.

### RG4 — Classification des Médicaments (`CLASSIFIER`)
- Un médicament relève obligatoirement d'**une et une seule** catégorie : `MEDICAMENT (1,1)`.
- Une catégorie peut contenir **zéro, un ou plusieurs** médicaments : `CATEGORIE (0,n)`.

### RG5 — Contrôle et Validation Administrateur (`VALIDER`)
- Un médicament proposé par un fournisseur peut être validé par **au plus un** administrateur GSB : `MEDICAMENT (0,1)`.
- Un administrateur peut valider ou contrôler **zéro, un ou plusieurs** médicaments : `UTILISATEUR (0,n)`.
- *Attributs portés :* `date_validation`, `commentaire`.

### RG6 — Détention du Panier (`POSSEDER`)
- Chaque utilisateur professionnel de santé dispose d'**un et un seul** panier actif : `UTILISATEUR (1,1)`.
- Un panier appartient à **un et un seul** utilisateur : `PANIER (1,1)`.

### RG7 — Contenu du Panier (`CONTENIR`)
- Un panier peut contenir **zéro, un ou plusieurs** médicaments : `PANIER (0,n)`.
- Un médicament peut être présent dans **zéro, un ou plusieurs** paniers d'utilisateurs distincts : `MEDICAMENT (0,n)`.
- *Attributs portés :* `quantite`, `date_ajout`.

### RG8 — Passation de Commande (`PASSER`)
- Une commande est passée par **un et un seul** professionnel de santé : `COMMANDE (1,1)`.
- Un utilisateur peut passer **zéro, un ou plusieurs** commandes au cours de son activité : `UTILISATEUR (0,n)`.

### RG9 — Composition des Commandes (`COMPOSER`)
- Une commande est composée d'**au moins un** médicament : `COMMANDE (1,n)`.
- Un médicament peut être commandé dans **zéro, un ou plusieurs** commandes : `MEDICAMENT (0,n)`.
- *Attributs portés :* `quantite_commandee`, `prix_unitaire_ht`, `taux_tva`.
  > *Remarque essentielle pour le BTS SIO :* Porter le `prix_unitaire_ht` et le `taux_tva` sur l'association garantit la traçabilité comptable et juridique de la commande, même si le prix catalogue du médicament est modifié ultérieurement.

---

## 4. Dérivation vers le Modèle Logique de Données (MLD Relationnel)

En appliquant les règles formelles de passage du MCD au MLD :

1. **Tables simples issues des entités fortes :**
   - `ROLE` (`id_role` [PK], `code`, `libelle`, `description`)
   - `FOURNISSEUR` (`id_fournisseur` [PK], `raison_sociale`, `siret`, `email_contact`, `telephone`, `adresse`, `code_postal`, `ville`, `actif`)
   - `CATEGORIE` (`id_categorie` [PK], `libelle`, `description`)

2. **Tables avec migration de clés étrangères (cardinalités 1,1 vers 0,n ou 0,1) :**
   - `UTILISATEUR` (`id_utilisateur` [PK], `nom`, `prenom`, `email`, `mot_de_passe`, `telephone`, `adresse`, `code_postal`, `ville`, `type_profession`, `numero_rpps`, `doit_changer_mdp`, `actif`, `date_creation`, `#id_role` [FK]) *(Note : aucun rattachement direct aux fournisseurs)*
   - `MEDICAMENT` (`id_medicament` [PK], `nom`, `description`, `image_url`, `prix_ht`, `prix_ttc`, `taux_tva`, `quantite_stock`, `statut_validation`, `date_creation`, `#id_fournisseur` [FK], `#id_categorie` [FK], `#id_admin_validateur` [FK NULLABLE], `date_validation`, `commentaire_validation`)
   - `PANIER` (`id_panier` [PK], `date_creation`, `date_mise_a_jour`, `#id_utilisateur` [FK UNIQUE])
   - `COMMANDE` (`id_commande` [PK], `numero_commande`, `date_commande`, `statut_commande`, `montant_total_ht`, `montant_total_ttc`, `adresse_livraison`, `code_postal_livraison`, `ville_livraison`, `#id_utilisateur` [FK])

3. **Tables d'association issues des relations n:m :**
   - `LIGNE_PANIER` (`#id_panier` [PK, FK], `#id_medicament` [PK, FK], `quantite`, `date_ajout`)
   - `LIGNE_COMMANDE` (`#id_commande` [PK, FK], `#id_medicament` [PK, FK], `quantite_commandee`, `prix_unitaire_ht`, `taux_tva`)

---

## 5. Comment ouvrir et éditer les schémas

Les fichiers ont été créés directement dans votre dossier `docs/` :

1. **Fichier Draw.io natif :** [mcd_gsb.drawio](file:///home/benladamm/Documents/GitHub/GSB/docs/mcd_gsb.drawio)
   - **Dans l'IDE :** Si vous possédez l'extension Draw.io / Diagrams.net, cliquez simplement sur le fichier pour l'éditer graphiquement.
   - **En ligne :** Rendez-vous sur [app.diagrams.net](https://app.diagrams.net/), puis cliquez sur *Ouvrir un diagramme existant* et sélectionnez `docs/mcd_gsb.drawio`.
   - Vous pouvez déplacer les blocs, modifier les couleurs ou ajouter de nouveaux champs.

2. **Fichier SVG vectoriel :** [mcd_gsb.svg](file:///home/benladamm/Documents/GitHub/GSB/docs/mcd_gsb.svg)
   - Visualisable instantanément dans n'importe quel navigateur ou visionneuse d'images de l'IDE en pleine résolution.
