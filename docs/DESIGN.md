# PharmaLink — Guide de design (Art nouveau, thème clair)

Place de marché B2B : les pharmacies achètent, les laboratoires vendent.

## 1. Principes

- **Thème clair uniquement** (pas de mode sombre).
- **Style Art nouveau** : courbes organiques, motifs végétaux, filets dorés, formes asymétriques.
- **Lisibilité d'abord** : l'ornement accompagne le contenu, il ne le gêne jamais (plateforme professionnelle de santé).

## 2. Palette

| Rôle | Nom | Hex | Usage |
|---|---|---|---|
| Fond | Crème | `#fbf7ec` | Arrière-plan de la page |
| Surface | Ivoire | `#fffdf7` | Cartes, tableau, formulaire |
| Texte | Brun olive | `#3a3826` | Texte principal |
| Texte secondaire | Olive doux | `#7a7458` | Descriptions, légendes |
| Primaire | Sauge | `#6f9068` | Boutons, numéros d'étapes |
| Primaire foncé | Sauge profond | `#557552` | Titres, logo, dégradé de bouton |
| Accent | Or patiné | `#b8934a` | Bordures, séparateurs, chiffres clés |
| Accent doux | Rose poudré | `#d49a8c` | Titres de cartes, fleur de la frise |
| Bordure | Sable | `#e6dab8` | Filets fins, lignes de tableau |
| Étiquette | Vert pâle | `#e4eddc` | Fond des badges de stock |

Le fond de page ajoute deux halos radiaux discrets (beige en haut à gauche, vert pâle à droite).

## 3. Typographie

- **Titres et logo** : `Cormorant Garamond` (500–700), repli `Georgia, serif`.
- **Texte courant** : `Lato` (400, 700), repli `system-ui, sans-serif`.
- Titre principal : `clamp(1.9rem, 5vw, 3.1rem)`, interligne 1.12.
- Titres de section : 2rem, couleur sauge profond, centrés.
- Texte : 1rem, interligne 1.6.

Polices chargées via Google Fonts (`fonts.googleapis.com`).

## 4. Formes et bordures

L'asymétrie est la signature du style :

| Élément | Rayon de bordure |
|---|---|
| Bandeau d'accueil | `220px 220px 24px 24px` (arche) |
| Carte 1 | `70px 8px 70px 8px` |
| Carte 2 | `8px 70px 8px 70px` (inversée) |
| Statistiques | `40px 6px 40px 6px` |
| Boutons | `30px 6px 30px 6px` |
| Champs de saisie | `24px 6px 24px 6px` |
| Tableau | `40px 8px 40px 8px` |
| Numéros d'étapes | `50% 4px 50% 4px` (feuille) |
| Bloc d'inscription | `24px 24px 120px 120px / 24px 24px 60px 60px` (base bombée) |

Bordures : 1,5 à 2 px en or `#b8934a`. Les blocs majeurs (bandeau, inscription) ont en plus un double filet : `outline: 1px solid #e6dab8; outline-offset: 6px`.

## 5. Ornements

- **Frise végétale** (SVG inline, en haut du bandeau) : tige sinueuse dorée, fleur rose (cercle) et feuille verte. Trait de 1,6 px, extrémités arrondies.
- **Séparateur** `❦` centré sous chaque titre de section, en couleur secondaire.
- **Logo** : `✿ Pharma` + `Link` en or.
- **Puces de liste** : marqueurs dorés.

## 6. Composants

**Boutons**
- Principal : dégradé sauge → sauge profond, texte blanc, ombre portée dorée `0 3px 0 #b8934a`.
- Secondaire : fond transparent, bordure or 2 px, texte sauge profond.

**Champs** : fond ivoire, bordure sable 1,5 px ; au focus, contour et bordure dorés.

**Cartes** : fond ivoire, bordure or, titre en rose poudré (Cormorant, 1.5rem).

**Tableau catalogue** : en-têtes en or (Cormorant), lignes séparées par un filet sable, badge de stock vert pâle arrondi.

**Onglets Pharmacie / Laboratoire** : actif = fond sauge et texte blanc ; inactif = bordure or.

## 7. Mise en page

- Largeur maximale : 1040 px, marges latérales de 20 px.
- Grilles adaptatives (`auto-fit`, `minmax`) pour statistiques, cartes et étapes.
- Tableau dans un conteneur à défilement horizontal (`overflow-x: auto`) : la page ne défile jamais latéralement.
- Compatible mobile : `viewport-fit=cover` et marges de zone sûre (`env(safe-area-inset-*)`).

## 8. Sections de la page

1. En-tête (logo, navigation)
2. Bandeau d'accueil avec frise et deux appels à l'action
3. Chiffres clés (4 blocs)
4. Solutions pharmacies / laboratoires (2 cartes)
5. Comment ça marche (4 étapes)
6. Aperçu du catalogue avec recherche
7. Inscription (onglets et formulaire)
8. Pied de page

## 9. Pistes d'évolution

- Motifs floraux plus riches dans les coins des blocs.
- Variante de palette rose ou bleu-vert.
- Fond texturé façon papier ancien, avec un contraste maintenu.
- Pages connexion, panier et tableau de bord laboratoire dans le même style.
