# Schéma de Base de Données Relationnelle MySQL — GSB

> **Projet :** Galaxy Swiss Bourdin (GSB) — Portail E-Commerce pour Professionnels de Santé  
> **Base de données :** `gsb_pharmacie`  
> **Moteur :** MySQL 8.0+ / MariaDB (moteur InnoDB, charset `utf8mb4_unicode_ci`)  
> **Modèle :** Dérivé du Modèle Conceptuel de Données (MCD) MERISE révisé  
> **Date :** Septembre 2026 — Version 1.1  

---

## 1. Architecture et Décisions de Modélisation

### Suppression du lien direct Utilisateur ↔ Fournisseur
Conformément à la réalité métier d'une place de marché médicale B2B :
- **Un professionnel de santé (médecin, pharmacien, officine) n'est pas lié de manière exclusive à un seul fournisseur.**
- Il commande librement auprès de **multiples laboratoires partenaires** (ex. Sanofi, Biogaran, Sandoz) au sein d'un même panier ou d'une même commande.
- La liaison entre les professionnels et les fournisseurs s'effectue donc **indirectement par les commandes** :
  `utilisateurs` ➔ `commandes` ➔ `lignes_commande` ➔ `medicaments` ➔ `fournisseurs`.

---

## 2. Diagramme Relationnel (Entity-Relationship)

```mermaid
erDiagram
    roles ||--o{ utilisateurs : "possede (1:N)"
    utilisateurs ||--o{ commandes : "passe (1:N)"
    utilisateurs ||--|| paniers : "detient (1:1)"
    utilisateurs ||--o{ medicaments : "valide (0:N)"
    
    fournisseurs ||--o{ medicaments : "propose (1:N)"
    categories ||--o{ medicaments : "classifie (1:N)"
    
    paniers ||--o{ lignes_panier : "contient (1:N)"
    medicaments ||--o{ lignes_panier : "figure_dans (1:N)"
    
    commandes ||--o{ lignes_commande : "compose (1:N)"
    medicaments ||--o{ lignes_commande : "inclus_dans (1:N)"

    roles {
        int id_role PK
        string code UK
        string libelle
        string description
    }

    utilisateurs {
        int id_utilisateur PK
        string nom
        string prenom
        string email UK
        string mot_de_passe
        string telephone
        string adresse
        string code_postal
        string ville
        string type_profession
        string numero_rpps UK
        boolean doit_changer_mdp
        boolean actif
        int id_role FK
    }

    fournisseurs {
        int id_fournisseur PK
        string raison_sociale
        string siret UK
        string email_contact
        string telephone
        string adresse
        string code_postal
        string ville
        boolean actif
    }

    categories {
        int id_categorie PK
        string libelle UK
        string description
    }

    medicaments {
        int id_medicament PK
        string nom
        string description
        string image_url
        decimal prix_ht
        decimal prix_ttc
        decimal taux_tva
        int quantite_stock
        enum statut_validation
        int id_fournisseur FK
        int id_categorie FK
        int id_admin_validateur FK
    }

    paniers {
        int id_panier PK
        int id_utilisateur FK,UK
    }

    lignes_panier {
        int id_panier PK,FK
        int id_medicament PK,FK
        int quantite
        timestamp date_ajout
    }

    commandes {
        int id_commande PK
        string numero_commande UK
        datetime date_commande
        enum statut_commande
        decimal montant_total_ht
        decimal montant_total_ttc
        string adresse_livraison
        string code_postal_livraison
        string ville_livraison
        int id_utilisateur FK
    }

    lignes_commande {
        int id_commande PK,FK
        int id_medicament PK,FK
        int quantite_commandee
        decimal prix_unitaire_ht
        decimal taux_tva
    }
```

---

## 3. Dictionnaire des Tables MySQL

### Table `roles`
| Champ | Type MySQL | Null | Clé / Contrainte | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id_role` | `INT UNSIGNED` | NON | `PRIMARY KEY AUTO_INCREMENT` | Identifiant unique du rôle |
| `code` | `VARCHAR(20)` | NON | `UNIQUE` | `ADMIN`, `PRO_SANTE` |
| `libelle` | `VARCHAR(50)` | NON | | Libellé affiché |
| `description` | `VARCHAR(255)` | OUI | | Description des permissions |
| `created_at` | `TIMESTAMP` | NON | `DEFAULT CURRENT_TIMESTAMP` | Date de création |

### Table `utilisateurs`
| Champ | Type MySQL | Null | Clé / Contrainte | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id_utilisateur` | `INT UNSIGNED` | NON | `PRIMARY KEY AUTO_INCREMENT` | Identifiant utilisateur |
| `nom` | `VARCHAR(50)` | NON | | Nom de famille |
| `prenom` | `VARCHAR(50)` | NON | | Prénom |
| `email` | `VARCHAR(100)` | NON | `UNIQUE` | Email / login de connexion |
| `mot_de_passe` | `VARCHAR(255)` | NON | | Hash sécurisé (bcrypt/argon2) |
| `telephone` | `VARCHAR(20)` | OUI | | Coordonnées téléphoniques |
| `adresse` | `VARCHAR(150)` | OUI | | Adresse du cabinet/officine |
| `code_postal` | `VARCHAR(10)` | OUI | | Code postal |
| `ville` | `VARCHAR(50)` | OUI | | Ville |
| `type_profession` | `VARCHAR(50)` | OUI | | `Médecin`, `Pharmacien`, etc. |
| `numero_rpps` | `VARCHAR(20)` | OUI | `UNIQUE` | N° RPPS d'identification médicale |
| `doit_changer_mdp` | `BOOLEAN` | NON | `DEFAULT TRUE` | Exigence CDC (1er login) |
| `actif` | `BOOLEAN` | NON | `DEFAULT TRUE` | Compte actif / suspendu |
| `id_role` | `INT UNSIGNED` | NON | `FOREIGN KEY (roles)` | Rôle attribué |
| `created_at` | `TIMESTAMP` | NON | `DEFAULT CURRENT_TIMESTAMP` | Date de création |
| `updated_at` | `TIMESTAMP` | NON | `ON UPDATE CURRENT_TIMESTAMP` | Date de mise à jour |

### Table `fournisseurs`
| Champ | Type MySQL | Null | Clé / Contrainte | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id_fournisseur` | `INT UNSIGNED` | NON | `PRIMARY KEY AUTO_INCREMENT` | Identifiant du laboratoire |
| `raison_sociale` | `VARCHAR(100)` | NON | | Dénomination légale |
| `siret` | `VARCHAR(14)` | NON | `UNIQUE` | Numéro SIRET (14 chiffres) |
| `email_contact` | `VARCHAR(100)` | NON | | Email professionnel |
| `telephone` | `VARCHAR(20)` | OUI | | Standard téléphonique |
| `adresse` | `VARCHAR(150)` | OUI | | Siège social |
| `code_postal` | `VARCHAR(10)` | OUI | | Code postal |
| `ville` | `VARCHAR(50)` | OUI | | Ville |
| `actif` | `BOOLEAN` | NON | `DEFAULT TRUE` | Partenaire actif / révoqué |
| `created_at` | `TIMESTAMP` | NON | `DEFAULT CURRENT_TIMESTAMP` | Date d'enregistrement |
| `updated_at` | `TIMESTAMP` | NON | `ON UPDATE CURRENT_TIMESTAMP` | Date de mise à jour |

### Table `categories`
| Champ | Type MySQL | Null | Clé / Contrainte | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id_categorie` | `INT UNSIGNED` | NON | `PRIMARY KEY AUTO_INCREMENT` | Identifiant de la catégorie |
| `libelle` | `VARCHAR(50)` | NON | `UNIQUE` | Nom de la famille médicale |
| `description` | `TEXT` | OUI | | Indications thérapeutiques |
| `created_at` | `TIMESTAMP` | NON | `DEFAULT CURRENT_TIMESTAMP` | Date de création |

### Table `medicaments`
| Champ | Type MySQL | Null | Clé / Contrainte | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id_medicament` | `INT UNSIGNED` | NON | `PRIMARY KEY AUTO_INCREMENT` | Identifiant du médicament |
| `nom` | `VARCHAR(100)` | NON | | Nom commercial (CDC Tableau 4) |
| `description` | `TEXT` | OUI | | Présentation et posologie (CDC) |
| `image_url` | `VARCHAR(255)` | OUI | | Illustration du médicament (CDC) |
| `prix_ht` | `DECIMAL(10,2)`| NON | | Prix unitaire HT catalogue (CDC) |
| `prix_ttc` | `DECIMAL(10,2)`| NON | | Prix unitaire TTC catalogue (CDC) |
| `taux_tva` | `DECIMAL(5,2)` | NON | `DEFAULT 2.10` | Taux TVA pharmaceutique |
| `quantite_stock` | `INT UNSIGNED` | NON | `DEFAULT 0` | Stock physique disponible |
| `statut_validation` | `ENUM(...)` | NON | `DEFAULT 'EN_ATTENTE'` | `'EN_ATTENTE'`, `'VALIDE'`, `'REFUSE'` |
| `id_fournisseur` | `INT UNSIGNED` | NON | `FOREIGN KEY (fournisseurs)` | Laboratoire proposant le produit |
| `id_categorie` | `INT UNSIGNED` | NON | `FOREIGN KEY (categories)` | Famille thérapeutique |
| `id_admin_validateur` | `INT UNSIGNED`| OUI | `FOREIGN KEY (utilisateurs)`| Admin ayant validé le produit |
| `date_validation` | `DATETIME` | OUI | | Horodatage de la validation |
| `commentaire_validation` | `TEXT` | OUI | | Commentaire de modération |
| `created_at` | `TIMESTAMP` | NON | `DEFAULT CURRENT_TIMESTAMP` | Date d'ajout au catalogue |
| `updated_at` | `TIMESTAMP` | NON | `ON UPDATE CURRENT_TIMESTAMP` | Date de mise à jour |

### Table `paniers`
| Champ | Type MySQL | Null | Clé / Contrainte | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id_panier` | `INT UNSIGNED` | NON | `PRIMARY KEY AUTO_INCREMENT` | Identifiant du panier |
| `id_utilisateur` | `INT UNSIGNED` | NON | `UNIQUE, FK (utilisateurs)` | Un panier actif par professionnel |
| `created_at` | `TIMESTAMP` | NON | `DEFAULT CURRENT_TIMESTAMP` | Date de création |
| `updated_at` | `TIMESTAMP` | NON | `ON UPDATE CURRENT_TIMESTAMP` | Dernière modification |

### Table `lignes_panier`
| Champ | Type MySQL | Null | Clé / Contrainte | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id_panier` | `INT UNSIGNED` | NON | `PRIMARY KEY, FK (paniers)` | Réf. du panier |
| `id_medicament` | `INT UNSIGNED` | NON | `PRIMARY KEY, FK (medicaments)` | Réf. du médicament |
| `quantite` | `INT UNSIGNED` | NON | `DEFAULT 1` | Nombre d'unités |
| `date_ajout` | `TIMESTAMP` | NON | `DEFAULT CURRENT_TIMESTAMP` | Date d'ajout |

### Table `commandes`
| Champ | Type MySQL | Null | Clé / Contrainte | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id_commande` | `INT UNSIGNED` | NON | `PRIMARY KEY AUTO_INCREMENT` | Identifiant de commande |
| `numero_commande` | `VARCHAR(50)` | NON | `UNIQUE` | N° de commande lisible |
| `date_commande` | `DATETIME` | NON | `DEFAULT CURRENT_TIMESTAMP` | Date de commande |
| `statut_commande` | `ENUM(...)` | NON | `DEFAULT 'EN_ATTENTE'` | Suivi d'expédition |
| `montant_total_ht` | `DECIMAL(10,2)`| NON | `DEFAULT 0.00` | Total HT |
| `montant_total_ttc` | `DECIMAL(10,2)`| NON | `DEFAULT 0.00` | Total TTC |
| `adresse_livraison` | `VARCHAR(150)`| NON | | Lieu de livraison |
| `code_postal_livraison` | `VARCHAR(10)` | NON | | Code postal |
| `ville_livraison` | `VARCHAR(50)` | NON | | Ville |
| `id_utilisateur` | `INT UNSIGNED` | NON | `FOREIGN KEY (utilisateurs)` | Professionnel acheteur |
| `created_at` | `TIMESTAMP` | NON | `DEFAULT CURRENT_TIMESTAMP` | Date de création |
| `updated_at` | `TIMESTAMP` | NON | `ON UPDATE CURRENT_TIMESTAMP` | Date de mise à jour |

### Table `lignes_commande`
| Champ | Type MySQL | Null | Clé / Contrainte | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id_commande` | `INT UNSIGNED` | NON | `PRIMARY KEY, FK (commandes)` | Réf. de commande |
| `id_medicament` | `INT UNSIGNED` | NON | `PRIMARY KEY, FK (medicaments)` | Réf. du médicament |
| `quantite_commandee` | `INT UNSIGNED` | NON | `DEFAULT 1` | Quantité commandée |
| `prix_unitaire_ht` | `DECIMAL(10,2)`| NON | | **Prix HT gelé à l'achat** |
| `taux_tva` | `DECIMAL(5,2)` | NON | | **Taux TVA gelé à l'achat** |

---

## 4. Fichiers et Exécution

1. **Script SQL prêt à exécuter :** [schema_mysql.sql](file:///home/benladamm/Documents/GitHub/GSB/docs/schema_mysql.sql)
   - Exécution sous MySQL CLI :
     ```bash
     mysql -u root -p < docs/schema_mysql.sql
     ```
   - Ou importation directe dans **phpMyAdmin**, **DBeaver**, ou **VS Code Database Client**.

2. **Schéma Relationnel Draw.io :** [mld_mysql.drawio](file:///home/benladamm/Documents/GitHub/GSB/docs/mld_mysql.drawio)
   - Édition graphique des tables, champs, types et liaisons de clés étrangères.

3. **Aperçu visuel SVG :** [mld_mysql.svg](file:///home/benladamm/Documents/GitHub/GSB/docs/mld_mysql.svg) et [mld_mysql.png](file:///home/benladamm/Documents/GitHub/GSB/docs/mld_mysql.png)
