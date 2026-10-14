# ✿ GSB PharmaLink — Plateforme B2B E-Commerce Pharmaceutique
> **Épreuve E4 / E6 — BTS SIO option SLAM (2e année)**  
> **Laboratoire Galaxy Swiss Bourdin (GSB)**  
> Développé avec **Next.js 14 (App Router)**, **Tailwind CSS v3**, **MySQL 8** et une **API RESTful intégrale**.

---

## 1. Contexte & Présentation du Projet

Le laboratoire pharmaceutique **Galaxy Swiss Bourdin (GSB)** est issu de la fusion de deux grands groupes médicaux européens. Dans le cadre de la modernisation de son Système d'Information (DSI Paris), GSB met en place **PharmaLink**, une place de marché numérique B2B permettant :
- Aux **professionnels de santé (pharmaciens, médecins)** de consulter le catalogue officiel, gérer leur bon de commande (panier) et passer des commandes directement auprès de multiples laboratoires partenaires sans exclusivité.
- Aux **laboratoires industriels (Sanofi, Biogaran, Sandoz...)** de proposer de nouvelles spécialités médicales.
- À la **Direction DSI / Administrateurs GSB** de modérer et valider chaque médicament avant sa publication au catalogue, de gérer les utilisateurs et de suivre l'état logistique des commandes.

---

## 2. Charte Graphique & Design Art Nouveau (`docs/DESIGN.md`)

L'interface utilisateur applique scrupuleusement les spécifications du fichier [`docs/DESIGN.md`](./docs/DESIGN.md) :
- **Thème clair exclusif** (aucun mode sombre) préservant le sérieux médical et le contraste.
- **Palette chromatique** :
  - Fond Crème (`#fbf7ec`) avec halos radiaux discrets
  - Surface Ivoire (`#fffdf7`)
  - Texte Brun olive (`#3a3826`) et Olive doux (`#7a7458`)
  - Primaire Sauge (`#6f9068`) et Sauge profond (`#557552`)
  - Accent Or patiné (`#b8934a`) et Rose poudré (`#d49a8c`)
  - Bordure Sable (`#e6dab8`) et Badges Vert pâle (`#e4eddc`)
- **Typographie** :
  - Titres et logo : *Cormorant Garamond* (Google Fonts)
  - Texte courant et chiffres : *Lato*
- **Asymétrie et Ornements** :
  - Bandeau d'accueil en arche (`220px 220px 24px 24px`) avec frise végétale SVG (tige dorée, fleur rose, feuille verte).
  - Double filet Art nouveau (`outline: 1px solid #e6dab8; outline-offset: 6px`).
  - Cartes asymétriques (`70px 8px 70px 8px` et `8px 70px 8px 70px`).
  - Séparateurs floraux `❦`.

---

## 3. Architecture & API REST Normalisée

Le projet expose une **API REST complète** accessible via `http://localhost:3000/api` :

| Méthode | Route HTTP | Description | Accès / Rôle |
|---|---|---|---|
| `GET` | `/api/health` | Diagnostic de l'API et de la connexion MySQL locale | Public |
| `POST` | `/api/auth/login` | Connexion, vérification hash bcrypt, cookie session JWT | Public |
| `POST` | `/api/auth/register` | Inscription d'un professionnel avec numéro RPPS | Public |
| `GET` | `/api/auth/me` | Informations de session de l'utilisateur courant | Authentifié |
| `POST` | `/api/auth/logout` | Révocation du cookie de session | Authentifié |
| `POST` | `/api/auth/change-password` | Changement de mot de passe (obligatoire au 1er login) | Authentifié |
| `GET` | `/api/categories` | Liste des familles thérapeutiques | Public |
| `GET` | `/api/fournisseurs` | Liste des laboratoires partenaires agréés | Public |
| `POST` | `/api/fournisseurs` | Référencement d'un nouveau laboratoire (SIRET, adresse) | Public / Admin |
| `GET` | `/api/medicaments` | Catalogue filtrable (`?search=`, `?categorie=`, `?fournisseur=`) | Public |
| `POST` | `/api/medicaments` | Dépôt d'un nouveau médicament (`statut=EN_ATTENTE`) | Pro / Labo |
| `GET` | `/api/medicaments/[id]` | Détail d'un médicament et laboratoire fournisseur | Public |
| `PATCH` | `/api/medicaments/[id]` | Modération (`VALIDE` / `REFUSE`), ajustement prix / stock | Administrateur |
| `DELETE` | `/api/medicaments/[id]` | Retrait d'un produit du catalogue | Administrateur |
| `GET` | `/api/panier` | Récupération du panier actif avec totaux HT, TTC et TVA | Professionnel |
| `POST` | `/api/panier` | Ajout d'articles au panier (quantité) | Professionnel |
| `PUT` | `/api/panier` | Mise à jour de la quantité d'une ligne | Professionnel |
| `DELETE` | `/api/panier` | Suppression d'un article ou vidage complet | Professionnel |
| `GET` | `/api/commandes` | Historique des commandes (utilisateur ou toutes) | Authentifié |
| `POST` | `/api/commandes` | Transformation du panier en commande avec prix figés | Professionnel |
| `GET` | `/api/commandes/[id]` | Détail et facture de la commande (`lignes_commande`) | Client / Admin |
| `PATCH` | `/api/commandes/[id]` | Mise à jour du statut logistique de la commande | Administrateur |
| `GET` | `/api/admin/stats` | Indicateurs clés (CA HT/TTC, commandes, modération) | Administrateur |
| `GET` | `/api/admin/users` | Liste des comptes utilisateurs et statuts d'activation | Administrateur |
| `PATCH` | `/api/admin/users/[id]` | Activation / suspension de compte et rôle | Administrateur |

Une console de test interactive est disponible directement dans l'application sur la page **[`/api-docs`](http://localhost:3000/api-docs)**.

---

## 4. Modèle de Données (Merise & MySQL)

Le schéma relationnel MySQL est défini dans [`schema_mysql.sql`](./schema_mysql.sql) et documenté dans [`docs/MCD_DOCUMENTATION.md`](./docs/MCD_DOCUMENTATION.md) :
1. `roles` (ADMIN, PRO_SANTE)
2. `utilisateurs` (Professionnels de santé, Administrateurs)
3. `fournisseurs` (Laboratoires partenaires avec SIRET unique)
4. `categories` (Familles thérapeutiques)
5. `medicaments` (Catalogue avec modération `EN_ATTENTE`, `VALIDE`, `REFUSE`)
6. `paniers` (Paniers d'achats permanents par utilisateur)
7. `lignes_panier` (Articles et quantités sélectionnées)
8. `commandes` (En-tête de commande avec numéro unique `CMD-2026-XXXX`)
9. `lignes_commande` (Articles commandés avec prix unitaire HT et taux TVA **figés**)
- Vues SQL : `v_catalogue_disponible`, `v_commandes_details`

---

## 5. Installation & Lancement

### Prérequis
- **Node.js** (v18+ ou v22+)
- **MySQL Server** (local ou Wamp/XAMPP sur le port 3306)

### 1. Configuration de la base de données
Renseignez vos identifiants MySQL dans le fichier `.env` :
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=gsb_pharmacie
JWT_SECRET=gsb_pharmalink_bts_sio_slam_secret_key_2026
```

### 2. Initialisation automatique de la base
Exécutez le script d'initialisation pour créer la base `gsb_pharmacie`, les 9 tables, les vues et injecter les données de test :
```bash
npm run db:init
```

### 3. Lancement du serveur de développement
```bash
npm run dev
```
Rendez-vous sur **[http://localhost:3000](http://localhost:3000)**.

---

## 6. Comptes de Test pour l'Évaluation

Pour faciliter les tests lors de l'épreuve orale :

| Profil | Email | Mot de passe | Permissions |
|---|---|---|---|
| **Pharmacien (Jean Dupont)** | `j.dupont@pharmacie-centrale.fr` | `admin123` | Consultation catalogue, panier, passage de commande, historique |
| **Médecin (Sophie Martin)** | `dr.martin@cabinet-medical.fr` | `admin123` | Prescription, approvisionnement cabinet |
| **Administratrice (Claire Bourdin)** | `admin@gsb.fr` | `admin123` | Dashboard DSI, modération des produits, gestion des commandes & utilisateurs |

*(Des boutons de connexion rapide en 1 clic sont également disponibles sur la page de connexion)*.
