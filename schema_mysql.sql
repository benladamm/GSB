-- =============================================================================
-- PROJET GALAXY SWISS BOURDIN (GSB) — BTS SIO SLAM 2e ANNEE
-- SCHEMA DE BASE DE DONNEES RELATIONNELLE MYSQL
-- BASE SUR LE MODELE CONCEPTUEL DE DONNEES (MCD)
-- =============================================================================

-- Création et initialisation de la base de données
DROP DATABASE IF EXISTS gsb_pharmacie;
CREATE DATABASE gsb_pharmacie 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE gsb_pharmacie;

-- =============================================================================
-- 1. TABLE : roles
-- Gestion des rôles et habilitations d'accès à la plateforme
-- =============================================================================
CREATE TABLE roles (
    id_role INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE COMMENT 'Code technique du rôle (ADMIN, PRO_SANTE)',
    libelle VARCHAR(50) NOT NULL COMMENT 'Désignation publique du rôle',
    description VARCHAR(255) NULL COMMENT 'Détail des permissions associées',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Rôles des utilisateurs de la plateforme GSB';

-- =============================================================================
-- 2. TABLE : utilisateurs
-- Professionnels de santé et Administrateurs GSB
-- NOTE : Les utilisateurs ne sont pas liés à un fournisseur unique car ils
-- peuvent s''approvisionner librement auprès de plusieurs laboratoires partenaires.
-- =============================================================================
CREATE TABLE utilisateurs (
    id_utilisateur INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(50) NOT NULL,
    prenom VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE COMMENT 'Identifiant de connexion unique',
    mot_de_passe VARCHAR(255) NOT NULL COMMENT 'Empreinte hachée (ex. bcrypt / argon2)',
    telephone VARCHAR(20) NULL,
    adresse VARCHAR(150) NULL COMMENT 'Adresse professionnelle / cabinet / officine',
    code_postal VARCHAR(10) NULL,
    ville VARCHAR(50) NULL,
    type_profession VARCHAR(50) NULL COMMENT 'Médecin, Pharmacien, etc.',
    numero_rpps VARCHAR(20) NULL UNIQUE COMMENT 'Numéro RPPS ou identifiant médical professionnel',
    doit_changer_mdp BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Obligation CDC : TRUE au 1er login',
    actif BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Statut d''activation du compte',
    id_role INT UNSIGNED NOT NULL COMMENT 'Rôle attribué à l''utilisateur',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_utilisateur_role 
        FOREIGN KEY (id_role) 
        REFERENCES roles(id_role) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT
) ENGINE=InnoDB COMMENT='Comptes utilisateurs (Pro de santé & Admins)';

-- =============================================================================
-- 3. TABLE : fournisseurs
-- Laboratoires partenaires proposant des médicaments à la vente
-- =============================================================================
CREATE TABLE fournisseurs (
    id_fournisseur INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    raison_sociale VARCHAR(100) NOT NULL COMMENT 'Dénomination officielle du laboratoire',
    siret VARCHAR(14) NOT NULL UNIQUE COMMENT 'Numéro SIRET (14 chiffres)',
    email_contact VARCHAR(100) NOT NULL,
    telephone VARCHAR(20) NULL,
    adresse VARCHAR(150) NULL,
    code_postal VARCHAR(10) NULL,
    ville VARCHAR(50) NULL,
    actif BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Laboratoire agréé ou suspendu',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Laboratoires partenaires et fournisseurs de médicaments';

-- =============================================================================
-- 4. TABLE : categories
-- Catégories thérapeutiques du catalogue
-- =============================================================================
CREATE TABLE categories (
    id_categorie INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    libelle VARCHAR(50) NOT NULL UNIQUE COMMENT 'Ex. Antalgiques, Antibiotiques...',
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Familles et catégories de médicaments';

-- =============================================================================
-- 5. TABLE : medicaments
-- Produits proposés par les laboratoires partenaires
-- Soumis à modération/validation par un administrateur GSB avant affichage catalogue
-- =============================================================================
CREATE TABLE medicaments (
    id_medicament INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL COMMENT 'Nom commercial du médicament',
    description TEXT NULL COMMENT 'Présentation, posologie et indications',
    image_url VARCHAR(255) NULL COMMENT 'Chemin d''accès ou URL de l''illustration',
    prix_ht DECIMAL(10,2) NOT NULL COMMENT 'Prix unitaire hors taxes catalogue',
    prix_ttc DECIMAL(10,2) NOT NULL COMMENT 'Prix unitaire toutes taxes comprises',
    taux_tva DECIMAL(5,2) NOT NULL DEFAULT 2.10 COMMENT 'Taux de TVA applicable en % (ex. 2.10)',
    quantite_stock INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Stock physique disponible',
    statut_validation ENUM('EN_ATTENTE', 'VALIDE', 'REFUSE') NOT NULL DEFAULT 'EN_ATTENTE' 
        COMMENT 'Contrôle Admin CDC : EN_ATTENTE par défaut',
    id_fournisseur INT UNSIGNED NOT NULL COMMENT 'Laboratoire qui propose le produit',
    id_categorie INT UNSIGNED NOT NULL COMMENT 'Catégorie du médicament',
    id_admin_validateur INT UNSIGNED NULL COMMENT 'Admin ayant validé/refusé le produit',
    date_validation DATETIME NULL COMMENT 'Date de la décision de modération',
    commentaire_validation TEXT NULL COMMENT 'Commentaire ou motif éventuel',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_medicament_fournisseur 
        FOREIGN KEY (id_fournisseur) 
        REFERENCES fournisseurs(id_fournisseur) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT,

    CONSTRAINT fk_medicament_categorie 
        FOREIGN KEY (id_categorie) 
        REFERENCES categories(id_categorie) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT,

    CONSTRAINT fk_medicament_admin 
        FOREIGN KEY (id_admin_validateur) 
        REFERENCES utilisateurs(id_utilisateur) 
        ON UPDATE CASCADE 
        ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Catalogue de médicaments proposés par les laboratoires';

-- =============================================================================
-- 6. TABLE : paniers
-- Panier actif d''un professionnel de santé (un seul panier actif par utilisateur)
-- =============================================================================
CREATE TABLE paniers (
    id_panier INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_utilisateur INT UNSIGNED NOT NULL UNIQUE COMMENT 'Chaque professionnel a un unique panier actif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_panier_utilisateur 
        FOREIGN KEY (id_utilisateur) 
        REFERENCES utilisateurs(id_utilisateur) 
        ON UPDATE CASCADE 
        ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Paniers d''achats des professionnels de santé';

-- =============================================================================
-- 7. TABLE : lignes_panier
-- Contenu du panier (médicaments et quantités)
-- =============================================================================
CREATE TABLE lignes_panier (
    id_panier INT UNSIGNED NOT NULL,
    id_medicament INT UNSIGNED NOT NULL,
    quantite INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Quantité sélectionnée',
    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id_panier, id_medicament),

    CONSTRAINT fk_ligne_panier_panier 
        FOREIGN KEY (id_panier) 
        REFERENCES paniers(id_panier) 
        ON UPDATE CASCADE 
        ON DELETE CASCADE,

    CONSTRAINT fk_ligne_panier_medicament 
        FOREIGN KEY (id_medicament) 
        REFERENCES medicaments(id_medicament) 
        ON UPDATE CASCADE 
        ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Détail des articles présents dans chaque panier';

-- =============================================================================
-- 8. TABLE : commandes
-- Commandes passées par les professionnels de santé
-- =============================================================================
CREATE TABLE commandes (
    id_commande INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    numero_commande VARCHAR(50) NOT NULL UNIQUE COMMENT 'Ex. CMD-2026-0001',
    date_commande DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    statut_commande ENUM('EN_ATTENTE', 'VALIDEE', 'PREPARATION', 'EXPEDIEE', 'LIVREE', 'ANNULEE') 
        NOT NULL DEFAULT 'EN_ATTENTE',
    montant_total_ht DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    montant_total_ttc DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    adresse_livraison VARCHAR(150) NOT NULL,
    code_postal_livraison VARCHAR(10) NOT NULL,
    ville_livraison VARCHAR(50) NOT NULL,
    id_utilisateur INT UNSIGNED NOT NULL COMMENT 'Professionnel de santé ayant commandé',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_commande_utilisateur 
        FOREIGN KEY (id_utilisateur) 
        REFERENCES utilisateurs(id_utilisateur) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT
) ENGINE=InnoDB COMMENT='En-têtes des commandes passées';

-- =============================================================================
-- 9. TABLE : lignes_commande
-- Détail des commandes (médicaments commandés, quantités et prix figés à l'achat)
-- =============================================================================
CREATE TABLE lignes_commande (
    id_commande INT UNSIGNED NOT NULL,
    id_medicament INT UNSIGNED NOT NULL,
    quantite_commandee INT UNSIGNED NOT NULL DEFAULT 1,
    prix_unitaire_ht DECIMAL(10,2) NOT NULL COMMENT 'Prix HT figé au moment de l''achat',
    taux_tva DECIMAL(5,2) NOT NULL COMMENT 'Taux TVA figé au moment de l''achat',

    PRIMARY KEY (id_commande, id_medicament),

    CONSTRAINT fk_ligne_commande_commande 
        FOREIGN KEY (id_commande) 
        REFERENCES commandes(id_commande) 
        ON UPDATE CASCADE 
        ON DELETE CASCADE,

    CONSTRAINT fk_ligne_commande_medicament 
        FOREIGN KEY (id_medicament) 
        REFERENCES medicaments(id_medicament) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT
) ENGINE=InnoDB COMMENT='Lignes d''articles associées aux commandes (historisation comptable)';

-- =============================================================================
-- INDEX DE PERFORMANCE
-- Optimisation des recherches, filtres et jointures courantes
-- =============================================================================
CREATE INDEX idx_medicaments_nom ON medicaments(nom);
CREATE INDEX idx_medicaments_statut ON medicaments(statut_validation);
CREATE INDEX idx_medicaments_fournisseur ON medicaments(id_fournisseur);
CREATE INDEX idx_medicaments_categorie ON medicaments(id_categorie);
CREATE INDEX idx_commandes_utilisateur ON commandes(id_utilisateur);
CREATE INDEX idx_commandes_statut ON commandes(statut_commande);
CREATE INDEX idx_commandes_date ON commandes(date_commande);

-- =============================================================================
-- VUES UTILES POUR L'APPLICATION (FRONT & BACK-END)
-- =============================================================================

-- Vue 1 : Catalogue des médicaments visibles à la vente (Validés et actifs)
CREATE OR REPLACE VIEW v_catalogue_disponible AS
SELECT 
    m.id_medicament,
    m.nom AS medicament_nom,
    m.description,
    m.image_url,
    m.prix_ht,
    m.prix_ttc,
    m.taux_tva,
    m.quantite_stock,
    c.id_categorie,
    c.libelle AS categorie_libelle,
    f.id_fournisseur,
    f.raison_sociale AS fournisseur_nom,
    f.ville AS fournisseur_ville
FROM medicaments m
INNER JOIN categories c ON m.id_categorie = c.id_categorie
INNER JOIN fournisseurs f ON m.id_fournisseur = f.id_fournisseur
WHERE m.statut_validation = 'VALIDE' 
  AND f.actif = TRUE;

-- Vue 2 : Synthèse détaillée des commandes passées
CREATE OR REPLACE VIEW v_commandes_details AS
SELECT 
    c.id_commande,
    c.numero_commande,
    c.date_commande,
    c.statut_commande,
    c.montant_total_ht,
    c.montant_total_ttc,
    u.id_utilisateur,
    CONCAT(u.prenom, ' ', u.nom) AS client_nom,
    u.email AS client_email,
    u.type_profession,
    u.numero_rpps,
    lc.id_medicament,
    m.nom AS medicament_nom,
    f.raison_sociale AS laboratoire_fournisseur,
    lc.quantite_commandee,
    lc.prix_unitaire_ht,
    lc.taux_tva,
    ROUND(lc.quantite_commandee * lc.prix_unitaire_ht, 2) AS total_ligne_ht,
    ROUND(lc.quantite_commandee * lc.prix_unitaire_ht * (1 + lc.taux_tva / 100), 2) AS total_ligne_ttc
FROM commandes c
INNER JOIN utilisateurs u ON c.id_utilisateur = u.id_utilisateur
INNER JOIN lignes_commande lc ON c.id_commande = lc.id_commande
INNER JOIN medicaments m ON lc.id_medicament = m.id_medicament
INNER JOIN fournisseurs f ON m.id_fournisseur = f.id_fournisseur;

-- =============================================================================
-- JEU D'ESSAI / DONNEES DE TEST (SEED DATA)
-- Données initiales pour tests fonctionnels et démonstration BTS SIO
-- =============================================================================

-- 1. Rôles
INSERT INTO roles (id_role, code, libelle, description) VALUES
(1, 'ADMIN', 'Administrateur GSB', 'Gestion complète de la plateforme, utilisateurs, modération et commandes'),
(2, 'PRO_SANTE', 'Professionnel de santé', 'Médecins, pharmaciens et prescripteurs autorisés à commander');

-- 2. Utilisateurs (mots de passe hachés pour démonstration)
INSERT INTO utilisateurs (id_utilisateur, nom, prenom, email, mot_de_passe, telephone, adresse, code_postal, ville, type_profession, numero_rpps, doit_changer_mdp, actif, id_role) VALUES
(1, 'Bourdin', 'Claire', 'admin@gsb.fr', '$2y$10$e0MYzXyjpJS7Pd0RVvHwHe1m42/xS9T8M6gD1zL1.n4r2m9vL/9b2', '0140203040', '15 Rue de Paris', '75008', 'Paris', 'Direction DSI', NULL, FALSE, TRUE, 1),
(2, 'Dupont', 'Jean', 'j.dupont@pharmacie-centrale.fr', '$2y$10$e0MYzXyjpJS7Pd0RVvHwHe1m42/xS9T8M6gD1zL1.n4r2m9vL/9b2', '0240506070', '42 Boulevard Victor Hugo', '44000', 'Nantes', 'Pharmacien', '10002345678', TRUE, TRUE, 2),
(3, 'Martin', 'Sophie', 'dr.martin@cabinet-medical.fr', '$2y$10$e0MYzXyjpJS7Pd0RVvHwHe1m42/xS9T8M6gD1zL1.n4r2m9vL/9b2', '0478901234', '18 Rue de la République', '69002', 'Lyon', 'Médecin généraliste', '10008765432', TRUE, TRUE, 2);

-- 3. Fournisseurs (Laboratoires partenaires)
INSERT INTO fournisseurs (id_fournisseur, raison_sociale, siret, email_contact, telephone, adresse, code_postal, ville, actif) VALUES
(1, 'Laboratoires Sanofi Pasteur', '39882471400018', 'contact@sanofi.fr', '0157632000', '54 Rue La Boétie', '75008', 'Paris', TRUE),
(2, 'Biogaran Génériques', '40513075200029', 'service-clients@biogaran.fr', '0146978000', '15 Boulevard Charles de Gaulle', '92700', 'Colombes', TRUE),
(3, 'Sandoz Laboratoires', '41434567800034', 'contact@sandoz.fr', '0149644800', '49 Avenue Georges Pompidou', '92300', 'Levallois-Perret', TRUE);

-- 4. Catégories
INSERT INTO categories (id_categorie, libelle, description) VALUES
(1, 'Antalgiques & Antipyrétiques', 'Médicaments traitant la douleur et la fièvre'),
(2, 'Antibiotiques', 'Substances antimicrobiennes d''origine naturelle ou synthétique'),
(3, 'Anti-inflammatoires', 'Traitements des affections inflammatoires articulaires ou musculaires'),
(4, 'Cardiologie & Vasculaire', 'Traitements de l''hypertension artérielle et des troubles cardiaques');

-- 5. Médicaments
INSERT INTO medicaments (id_medicament, nom, description, image_url, prix_ht, prix_ttc, taux_tva, quantite_stock, statut_validation, id_fournisseur, id_categorie, id_admin_validateur, date_validation, commentaire_validation) VALUES
(1, 'Paracétamol GSB 1000mg', 'Boîte de 16 gélules sous blister pour le traitement symptomatique des douleurs légères à modérées.', '/images/produits/paracetamol-1000.png', 1.80, 1.84, 2.10, 1200, 'VALIDE', 2, 1, 1, '2026-09-15 10:00:00', 'Produit conforme aux spécifications'),
(2, 'Amoxicilline 500mg', 'Antibiotique à large spectre du groupe des aminopénicillines. 12 gélules.', '/images/produits/amoxicilline-500.png', 3.40, 3.47, 2.10, 650, 'VALIDE', 1, 2, 1, '2026-09-15 10:30:00', 'Validation réglementaire ANSM'),
(3, 'Ibuprofène 400mg', 'Anti-inflammatoire non stéroïdien (AINS). Boîte de 20 comprimés enrobés.', '/images/produits/ibuprofene-400.png', 2.50, 2.55, 2.10, 890, 'VALIDE', 2, 3, 1, '2026-09-16 11:15:00', 'Validé pour commande officine'),
(4, 'Ramipril 5mg', 'Inhibiteur de l''enzyme de conversion pour l''hypertension artérielle. Boîte de 30 comprimés.', '/images/produits/ramipril-5.png', 5.60, 5.72, 2.10, 420, 'VALIDE', 3, 4, 1, '2026-09-18 14:00:00', 'Validé catalogue cardiologie'),
(5, 'Azithromycine 250mg', 'Macrolide antibactérien. Boîte de 6 comprimés pelliculés.', '/images/produits/azithromycine-250.png', 6.20, 6.33, 2.10, 300, 'EN_ATTENTE', 1, 2, NULL, NULL, 'En attente de relecture par l''administrateur');

-- 6. Initialisation des Paniers
INSERT INTO paniers (id_panier, id_utilisateur) VALUES
(1, 2), -- Panier du pharmacien Jean Dupont
(2, 3); -- Panier du médecin Sophie Martin

-- Articles dans le panier du pharmacien
INSERT INTO lignes_panier (id_panier, id_medicament, quantite) VALUES
(1, 1, 50),  -- 50 boîtes de Paracétamol
(1, 3, 25);  -- 25 boîtes d'Ibuprofène

-- 7. Exemple de commande passée
INSERT INTO commandes (id_commande, numero_commande, date_commande, statut_commande, montant_total_ht, montant_total_ttc, adresse_livraison, code_postal_livraison, ville_livraison, id_utilisateur) VALUES
(1, 'CMD-2026-0001', '2026-09-28 09:30:00', 'VALIDEE', 170.00, 173.57, '42 Boulevard Victor Hugo', '44000', 'Nantes', 2);

-- Lignes de la commande CMD-2026-0001
-- Remarque : Jean Dupont a commandé à la fois du Biogaran (Paracétamol) et du Sanofi (Amoxicilline) dans la même commande !
INSERT INTO lignes_commande (id_commande, id_medicament, quantite_commandee, prix_unitaire_ht, taux_tva) VALUES
(1, 1, 50, 1.80, 2.10), -- 50 * 1.80 = 90.00 € HT
(1, 2, 20, 3.40, 2.10), -- 20 * 3.40 = 68.00 € HT
(1, 3, 5, 2.40, 2.10);  -- 5 * 2.40 = 12.00 € HT (prix négocié à ce moment-là)
