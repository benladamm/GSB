# ✿ GSB PharmaLink — Plateforme B2B E-Commerce Pharmaceutique
> **Épreuve E4 / E6 — BTS SIO option SLAM (2e année)**  
> **Laboratoire Galaxy Swiss Bourdin (GSB)**  
> Architecture **3-Tiers normalisée** : **Frontend Next.js 14**, **Serveur API REST Express**, **Base de données MySQL distante SSL (DimDams Cloud)**.

---

## 1. Contexte & Présentation du Projet

Le laboratoire pharmaceutique **Galaxy Swiss Bourdin (GSB)** est issu de la fusion de deux grands groupes médicaux européens. Dans le cadre de la modernisation de son Système d'Information (DSI Paris), GSB met en place **PharmaLink**, une place de marché numérique B2B permettant :
- Aux **professionnels de santé (pharmaciens, médecins)** de consulter le catalogue officiel, gérer leur bon de commande (panier) et passer des commandes directement auprès de multiples laboratoires partenaires sans exclusivité.
- Aux **laboratoires industriels (Sanofi, Biogaran, Sandoz, Pfizer, Servier...)** de proposer de nouvelles spécialités médicales.
- À la **Direction DSI / Administrateurs GSB** de modérer et valider chaque médicament avant sa publication au catalogue, de gérer les utilisateurs et de suivre l'état logistique des commandes.

---

## 2. Architecture 3-Tiers (Conforme aux exigences BTS SIO SLAM)

Le projet est strictement segmenté en trois couches indépendantes :

```
┌───────────────────────────────────────┐
│     Couche Présentation (Client)      │
│         Next.js 14 + React 18         │
│          http://localhost:3000        │
└──────────────────┬────────────────────┘
                   │ Requêtes HTTP REST (JSON + Cookies JWT)
                   ▼
┌───────────────────────────────────────┐
│      Couche Métier (Serveur API)      │
│        Serveur Express Node.js        │
│          http://localhost:3001        │
│    (Dossier server/ : routes, auth)   │
└──────────────────┬────────────────────┘
                   │ TCP / TLS MySQL (SSL Required)
                   ▼
┌───────────────────────────────────────┐
│    Couche Données (Persistance)       │
│      Serveur MySQL DimDams Cloud      │
│           db.dimdams.com:3306         │
│         (db_1793203056233_2rocd4)     │
└───────────────────────────────────────┘
```

> **Absence de fallback en dur** : Toutes les données proviennent en direct de la base de données relationnelle MySQL. En cas de coupure réseau ou d'indisponibilité de la base, le serveur Express renvoie un code HTTP d'erreur normalisé (500/503) et le frontend affiche une bannière d'alerte explicite à l'utilisateur.

---

## 3. Charte Graphique & Design Art Nouveau (`docs/DESIGN.md`)

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

## 4. Points d'Accès de l'API REST Express (`http://localhost:3001/api`)

| Méthode | Route HTTP | Description | Accès / Rôle |
|---|---|---|---|
| `GET` | `/api/health` | Diagnostic de l'API Express et statut de la connexion MySQL SSL | Public |
| `POST` | `/api/auth/login` | Connexion, vérification hash bcrypt, cookie session JWT HttpOnly | Public |
| `POST` | `/api/auth/register` | Inscription d'un professionnel avec numéro RPPS | Public |
| `GET` | `/api/auth/me` | Informations de session de l'utilisateur courant | Authentifié |
| `POST` | `/api/auth/logout` | Révocation du cookie de session | Authentifié |
| `POST` | `/api/auth/change-password` | Changement de mot de passe (obligatoire au 1er login) | Authentifié |
| `GET` | `/api/categories` | Liste des familles thérapeutiques | Public |
| `GET` | `/api/fournisseurs` | Liste des laboratoires partenaires agréés | Public |
| `POST` | `/api/fournisseurs` | Référencement d'un nouveau laboratoire (SIRET, adresse) | Public / Admin |
| `GET` | `/api/medicaments` | Catalogue filtrable (`?search=`, `?categorie=`, `?fournisseur=`) | Public |
| `POST` | `/api/medicaments` | Dépôt d'un nouveau médicament (`statut=EN_ATTENTE`) | Pro / Labo |
| `GET` | `/api/medicaments/:id` | Détail d'un médicament et laboratoire fournisseur | Public |
| `PATCH` | `/api/medicaments/:id` | Modération (`VALIDE` / `REFUSE`), ajustement prix / stock | Administrateur |
| `DELETE` | `/api/medicaments/:id` | Retrait d'un produit du catalogue | Administrateur |
| `GET` | `/api/panier` | Récupération du panier actif avec totaux HT, TTC et TVA | Professionnel |
| `POST` | `/api/panier` | Ajout d'articles au panier (quantité) | Professionnel |
| `PUT` | `/api/panier` | Mise à jour de la quantité d'une ligne | Professionnel |
| `DELETE` | `/api/panier` | Suppression d'un article ou vidage complet | Professionnel |
| `GET` | `/api/commandes` | Historique des commandes (utilisateur ou toutes) | Authentifié |
| `POST` | `/api/commandes` | Transformation du panier en commande avec prix figés | Professionnel |
| `GET` | `/api/commandes/:id` | Détail et facture de la commande (`lignes_commande`) | Client / Admin |
| `PATCH` | `/api/commandes/:id` | Mise à jour du statut logistique de la commande | Administrateur |
| `GET` | `/api/admin/stats` | Indicateurs clés (CA HT/TTC, commandes, modération) | Administrateur |
| `GET` | `/api/admin/users` | Liste des comptes utilisateurs et statuts d'activation | Administrateur |
| `PATCH` | `/api/admin/users/:id` | Activation / suspension de compte et rôle | Administrateur |

Une console de test interactive est disponible directement dans l'application sur la page **[`/api-docs`](http://localhost:3000/api-docs)**.

---

## 5. Modèle de Données (Merise & MySQL)

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

## 6. Installation & Lancement

### Prérequis
- **Node.js** (v18+ ou v22+)
- Connexion Internet (accès au serveur MySQL distant `db.dimdams.com`)

### 1. Variables d'environnement (`.env`)
Le fichier `.env` est préconfiguré pour la base de données distante sécurisée :
```env
DB_HOST=db.dimdams.com
DB_PORT=3306
DB_USER=u_1793203056233_2rocd4
DB_PASSWORD=46d3f4714292639a49bbe294fb388194
DB_NAME=db_1793203056233_2rocd4
DB_SSL=true

PORT=3001
API_PORT=3001
JWT_SECRET=gsb_pharmalink_bts_sio_slam_secret_key_2026
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
```

### 2. Initialisation ou réinitialisation de la base (optionnel)
```bash
npm run db:init
```

### 3. Lancement des serveurs
Pour démarrer simultanément l'API Express et le frontend Next.js :
```bash
npm run dev
```

Ou de manière séparée (si demandé par le jury) :
```bash
# Terminal 1 : Serveur Express (Port 3001)
npm run dev:server

# Terminal 2 : Client Next.js (Port 3000)
npm run dev:client
```

Rendez-vous sur **[http://localhost:3000](http://localhost:3000)**.

---

## 7. Comptes de Test pour l'Évaluation

Pour faciliter les tests lors de l'épreuve orale :

| Profil | Email | Mot de passe | Permissions |
|---|---|---|---|
| **Pharmacien (Jean Dupont)** | `j.dupont@pharmacie-centrale.fr` | `admin123` | Consultation catalogue, panier, passage de commande, historique |
| **Médecin (Sophie Martin)** | `dr.martin@cabinet-medical.fr` | `admin123` | Prescription, approvisionnement cabinet |
| **Pharmacien (Marc Lefebvre)** | `m.lefebvre@pharmacie-port.fr` | `admin123` | Gestion officine portuaire |
| **Administratrice (Claire Bourdin)** | `admin@gsb.fr` | `admin123` | Dashboard DSI, modération des produits, gestion des commandes & utilisateurs |

*(Des boutons de connexion rapide en 1 clic sont également disponibles sur la page de connexion)*.
