'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/AppContext';
import { 
  Search, 
  ShoppingBag, 
  CheckCircle2, 
  ArrowRight, 
  Building2, 
  ShieldCheck, 
  Clock, 
  Plus, 
  Check, 
  Stethoscope, 
  Sparkles,
  Truck,
  FileText
} from 'lucide-react';

export default function HomePage() {
  const { user, refreshCartCount } = useApp();
  const [medicaments, setMedicaments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingMeds, setLoadingMeds] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [addFeedback, setAddFeedback] = useState<string | null>(null);

  // Onglet pour le bloc d'inscription / accès
  const [activeTab, setActiveTab] = useState<'pharmacie' | 'laboratoire'>('pharmacie');

  useEffect(() => {
    fetchCategories();
    fetchMedicaments();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.categories) setCategories(data.categories);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMedicaments = async () => {
    setLoadingMeds(true);
    try {
      const res = await fetch('/api/medicaments?statut=VALIDE');
      const data = await res.json();
      if (data.medicaments) setMedicaments(data.medicaments);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMeds(false);
    }
  };

  const handleAddToCart = async (id_medicament: number) => {
    if (!user) {
      window.location.href = '/connexion';
      return;
    }

    setAddingId(id_medicament);
    try {
      const res = await fetch('/api/panier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_medicament, quantite: 10 }),
      });
      if (res.ok) {
        await refreshCartCount();
        setAddFeedback(`Ajouté au panier (lot de 10)`);
        setTimeout(() => setAddFeedback(null), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAddingId(null);
    }
  };

  const filteredMeds = medicaments.filter((m) => {
    const matchesSearch =
      m.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.categorie_libelle?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCat ? m.id_categorie === selectedCat : true;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="max-w-[1040px] mx-auto px-5 py-8 space-y-24">
      {/* Toast notification */}
      {addFeedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#557552] text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 border border-[#b8934a] animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-[#e4eddc]" />
          <span className="text-sm font-semibold">{addFeedback}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2 : BANDEAU D'ACCUEIL (ARCHE ART NOUVEAU AVEC FRISE VÉGÉTALE)     */}
      {/* ========================================================================= */}
      <section className="relative mt-4">
        {/* Double filet contour */}
        <div className="p-2 sm:p-3 rounded-[230px_230px_32px_32px] border border-[#e6dab8] outline outline-1 outline-[#e6dab8] outline-offset-4">
          <div className="bg-[#fffdf7] border-[1.5px] border-[#b8934a] rounded-[220px_220px_24px_24px] px-6 sm:px-12 pt-14 pb-16 text-center relative overflow-hidden shadow-art-nouveau">
            
            {/* Frise végétale SVG inline selon DESIGN.md */}
            <div className="flex justify-center mb-6">
              <svg 
                className="w-72 h-10 text-[#b8934a]" 
                viewBox="0 0 280 40" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Tige sinueuse dorée */}
                <path 
                  d="M10 20 C50 5, 80 35, 140 20 C200 5, 230 35, 270 20" 
                  stroke="#b8934a" 
                  strokeWidth="1.6" 
                  strokeLinecap="round" 
                />
                {/* Feuilles vertes */}
                <path 
                  d="M60 14 C70 8, 75 14, 72 19 C68 20, 62 17, 60 14 Z" 
                  fill="#6f9068" 
                />
                <path 
                  d="M210 26 C220 32, 225 26, 222 21 C218 20, 212 23, 210 26 Z" 
                  fill="#6f9068" 
                />
                {/* Fleurs roses douces (cercles) */}
                <circle cx="140" cy="20" r="5" fill="#d49a8c" stroke="#b8934a" strokeWidth="1" />
                <circle cx="140" cy="20" r="2" fill="#fffdf7" />
                <circle cx="40" cy="17" r="3.5" fill="#d49a8c" />
                <circle cx="240" cy="23" r="3.5" fill="#d49a8c" />
              </svg>
            </div>

            {/* Badge B2B */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fbf7ec] border border-[#e6dab8] text-xs font-semibold text-[#7a7458] mb-4">
              <span className="text-[#b8934a]">✦</span>
              <span>Plateforme B2B certifiée Galaxy Swiss Bourdin</span>
              <span className="text-[#b8934a]">✦</span>
            </div>

            {/* Titre Principal clamp(1.9rem, 5vw, 3.1rem) */}
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#557552] leading-[1.12] max-w-2xl mx-auto mb-5 tracking-tight">
              L'approvisionnement pharmaceutique d'excellence
            </h1>

            {/* Sous-titre */}
            <p className="text-base sm:text-lg text-[#7a7458] max-w-xl mx-auto mb-8 font-light leading-relaxed">
              Les officines et professionnels de santé s'approvisionnent en toute transparence directement auprès des plus grands laboratoires partenaires.
            </p>

            {/* Deux boutons d'action Art Nouveau */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/catalogue"
                className="btn-art-primary px-8 py-3.5 text-base w-full sm:w-auto"
                id="hero-cta-catalogue"
              >
                <span>Consulter le catalogue</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link
                href="/connexion"
                className="btn-art-secondary px-8 py-3.5 text-base w-full sm:w-auto"
                id="hero-cta-connexion"
              >
                <span>Espace Professionnel</span>
              </Link>
            </div>

            {/* Micro-mention de conformité */}
            <div className="mt-8 text-xs text-[#7a7458] flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#6f9068]" />
              <span>Contrôle et validation préalable par la Direction DSI & Pharmaceutique GSB</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3 : CHIFFRES CLÉS (4 BLOCS ASYMÉTRIQUES 40px 6px 40px 6px)       */}
      {/* ========================================================================= */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#557552]">
            La force d'un réseau unifié
          </h2>
          <div className="separator-art my-1">❦</div>
          <p className="text-xs sm:text-sm text-[#7a7458]">
            Indicateurs d'activité de la place de marché GSB PharmaLink
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-[#fffdf7] border-[1.5px] border-[#b8934a] rounded-[40px_6px_40px_6px] p-5 text-center shadow-art-nouveau hover:translate-y-[-2px] transition-transform">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-[#b8934a] block">
              100%
            </span>
            <span className="text-xs font-semibold text-[#3a3826] mt-1 block">
              Médicaments contrôlés
            </span>
            <span className="text-[11px] text-[#7a7458] mt-0.5 block">
              Validation administrative ANSM
            </span>
          </div>

          <div className="bg-[#fffdf7] border-[1.5px] border-[#b8934a] rounded-[40px_6px_40px_6px] p-5 text-center shadow-art-nouveau hover:translate-y-[-2px] transition-transform">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-[#b8934a] block">
              3 500+
            </span>
            <span className="text-xs font-semibold text-[#3a3826] mt-1 block">
              Officines partenaires
            </span>
            <span className="text-[11px] text-[#7a7458] mt-0.5 block">
              Pharmaciens & médecins
            </span>
          </div>

          <div className="bg-[#fffdf7] border-[1.5px] border-[#b8934a] rounded-[40px_6px_40px_6px] p-5 text-center shadow-art-nouveau hover:translate-y-[-2px] transition-transform">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-[#b8934a] block">
              2.10%
            </span>
            <span className="text-xs font-semibold text-[#3a3826] mt-1 block">
              TVA Médicaments
            </span>
            <span className="text-[11px] text-[#7a7458] mt-0.5 block">
              Calcul transparent HT / TTC
            </span>
          </div>

          <div className="bg-[#fffdf7] border-[1.5px] border-[#b8934a] rounded-[40px_6px_40px_6px] p-5 text-center shadow-art-nouveau hover:translate-y-[-2px] transition-transform">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-[#b8934a] block">
              24 / 48h
            </span>
            <span className="text-xs font-semibold text-[#3a3826] mt-1 block">
              Livraison sécurisée
            </span>
            <span className="text-[11px] text-[#7a7458] mt-0.5 block">
              Traçabilité thermique certifiée
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4 : SOLUTIONS PHARMACIES & LABORATOIRES (2 CARTES ASYMÉTRIQUES)   */}
      {/* ========================================================================= */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#557552]">
            Une solution dédiée à chaque acteur
          </h2>
          <div className="separator-art my-1">❦</div>
          <p className="text-xs sm:text-sm text-[#7a7458]">
            Plateforme multi-fournisseurs conçue pour fluidifier le commerce pharmaceutique
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Carte 1 : Pharmacies (Arrondi 70px 8px 70px 8px) */}
          <div className="card-art-1 p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fbf7ec] border border-[#e6dab8] text-xs font-semibold text-[#557552]">
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Pour les Professionnels de Santé</span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#d49a8c]">
                Officines & Prescripteurs
              </h3>
              <p className="text-xs sm:text-sm text-[#7a7458] leading-relaxed">
                Centralisez vos commandes auprès de multiples laboratoires sans contrainte de rattachement exclusif. Vous bénéficiez de prix clairs avec distinction stricte HT / TTC, d’un panier permanent et de l’historisation de vos factures d'achat.
              </p>
              <ul className="space-y-2 text-xs text-[#3a3826] pt-2">
                <li className="flex items-center gap-2">
                  <span className="text-[#b8934a]">✦</span>
                  <span>Catalogue exhaustif catégorisé (Antalgiques, Antibiotiques...)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#b8934a]">✦</span>
                  <span>Validation de commande immédiate et calcul automatique de la TVA (2,10%)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#b8934a]">✦</span>
                  <span>Suivi en temps réel de l'état d'expédition de vos lots</span>
                </li>
              </ul>
            </div>
            <div className="pt-6">
              <Link
                href="/catalogue"
                className="btn-art-secondary text-xs px-5 py-2.5 inline-flex items-center gap-1.5"
              >
                <span>Accéder aux références</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Carte 2 : Laboratoires (Arrondi inversé 8px 70px 8px 70px) */}
          <div className="card-art-2 p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fbf7ec] border border-[#e6dab8] text-xs font-semibold text-[#557552]">
                <Building2 className="w-3.5 h-3.5" />
                <span>Pour les Laboratoires Fournisseurs</span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#d49a8c]">
                Laboratoires Partenaires
              </h3>
              <p className="text-xs sm:text-sm text-[#7a7458] leading-relaxed">
                Présentez vos spécialités pharmaceutiques à l'ensemble du réseau GSB. Chaque nouveau médicament proposé passe par un workflow de validation rigoureux supervisé par nos pharmaciens validateurs avant sa mise au catalogue.
              </p>
              <ul className="space-y-2 text-xs text-[#3a3826] pt-2">
                <li className="flex items-center gap-2">
                  <span className="text-[#b8934a]">✦</span>
                  <span>Visibilité directe auprès de milliers de prescripteurs accrédités</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#b8934a]">✦</span>
                  <span>Modération et contrôle qualité assurés par la DSI GSB</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#b8934a]">✦</span>
                  <span>API REST normalisée pour l'interopérabilité des stocks</span>
                </li>
              </ul>
            </div>
            <div className="pt-6">
              <Link
                href="/fournisseurs"
                className="btn-art-secondary text-xs px-5 py-2.5 inline-flex items-center gap-1.5"
              >
                <span>Découvrir le réseau partenaire</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5 : COMMENT ÇA MARCHE (4 ÉTAPES AVEC NUMÉROS EN FEUILLE)          */}
      {/* ========================================================================= */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#557552]">
            Comment ça marche ?
          </h2>
          <div className="separator-art my-1">❦</div>
          <p className="text-xs sm:text-sm text-[#7a7458]">
            Un processus en 4 étapes simples et rigoureusement sécurisé
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {/* Étape 1 */}
          <div className="bg-[#fffdf7] border border-[#e6dab8] rounded-xl p-6 text-center space-y-3 relative hover:border-[#b8934a] transition-colors">
            <div className="w-12 h-12 mx-auto bg-[#6f9068] text-white font-serif text-xl font-bold flex items-center justify-center step-leaf shadow-sm">
              1
            </div>
            <h4 className="font-serif text-lg font-bold text-[#557552]">
              Habilitation RPPS
            </h4>
            <p className="text-xs text-[#7a7458] leading-relaxed">
              Création du compte professionnel par l'administrateur avec vérification du numéro RPPS et mot de passe provisoire.
            </p>
          </div>

          {/* Étape 2 */}
          <div className="bg-[#fffdf7] border border-[#e6dab8] rounded-xl p-6 text-center space-y-3 relative hover:border-[#b8934a] transition-colors">
            <div className="w-12 h-12 mx-auto bg-[#6f9068] text-white font-serif text-xl font-bold flex items-center justify-center step-leaf shadow-sm">
              2
            </div>
            <h4 className="font-serif text-lg font-bold text-[#557552]">
              Sélection Catalogue
            </h4>
            <p className="text-xs text-[#7a7458] leading-relaxed">
              Recherche par catégorie ou dénomination et ajout direct au panier avec transparence totale des stocks disponibles.
            </p>
          </div>

          {/* Étape 3 */}
          <div className="bg-[#fffdf7] border border-[#e6dab8] rounded-xl p-6 text-center space-y-3 relative hover:border-[#b8934a] transition-colors">
            <div className="w-12 h-12 mx-auto bg-[#6f9068] text-white font-serif text-xl font-bold flex items-center justify-center step-leaf shadow-sm">
              3
            </div>
            <h4 className="font-serif text-lg font-bold text-[#557552]">
              Passage de Commande
            </h4>
            <p className="text-xs text-[#7a7458] leading-relaxed">
              Validation du bon de commande avec gel comptable des prix HT/TTC et génération du numéro unique (ex: CMD-2026-0001).
            </p>
          </div>

          {/* Étape 4 */}
          <div className="bg-[#fffdf7] border border-[#e6dab8] rounded-xl p-6 text-center space-y-3 relative hover:border-[#b8934a] transition-colors">
            <div className="w-12 h-12 mx-auto bg-[#6f9068] text-white font-serif text-xl font-bold flex items-center justify-center step-leaf shadow-sm">
              4
            </div>
            <h4 className="font-serif text-lg font-bold text-[#557552]">
              Expédition & Facture
            </h4>
            <p className="text-xs text-[#7a7458] leading-relaxed">
              Suivi de l'acheminement sous chaîne du froid et archivage des pièces justificatives dans votre espace commandes.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6 : APERÇU DU CATALOGUE AVEC RECHERCHE ET ACTIONS PANIER DIRECTES */}
      {/* ========================================================================= */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#557552]">
              Aperçu du catalogue officiel
            </h2>
            <p className="text-xs text-[#7a7458] mt-1">
              Spécialités pharmaceutiques disponibles et validées par la DSI GSB
            </p>
          </div>
          <Link
            href="/catalogue"
            className="text-xs font-semibold text-[#b8934a] hover:text-[#557552] flex items-center gap-1 group"
          >
            <span>Voir tout le catalogue ({medicaments.length} références)</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Barre de recherche et filtres rapides */}
        <div className="bg-[#fffdf7] border border-[#e6dab8] rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#7a7458] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher une molécule, un nom commercial (ex: Paracétamol, Amoxicilline)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-art w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm"
                id="search-input-home"
              />
            </div>

            {/* Sélecteur de catégorie rapide */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedCat(null)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${
                  selectedCat === null
                    ? 'bg-[#557552] text-white'
                    : 'bg-[#fbf7ec] text-[#3a3826] hover:bg-[#e4eddc]'
                }`}
              >
                Toutes
              </button>
              {categories.map((c) => (
                <button
                  key={c.id_categorie}
                  onClick={() => setSelectedCat(c.id_categorie)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap ${
                    selectedCat === c.id_categorie
                      ? 'bg-[#557552] text-white'
                      : 'bg-[#fbf7ec] text-[#3a3826] hover:bg-[#e4eddc]'
                  }`}
                >
                  {c.libelle}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tableau Catalogue selon DESIGN.md (en-têtes en or Cormorant, bordure 40px 8px 40px 8px) */}
        <div className="bg-[#fffdf7] border-[1.5px] border-[#b8934a] rounded-[40px_8px_40px_8px] overflow-hidden shadow-art-nouveau">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#e6dab8] bg-[#fbf7ec]/70">
                  <th className="py-4 px-5 font-serif text-sm font-bold text-[#b8934a]">Médicament</th>
                  <th className="py-4 px-4 font-serif text-sm font-bold text-[#b8934a]">Catégorie</th>
                  <th className="py-4 px-4 font-serif text-sm font-bold text-[#b8934a]">Laboratoire</th>
                  <th className="py-4 px-4 font-serif text-sm font-bold text-[#b8934a] text-right">Prix HT</th>
                  <th className="py-4 px-4 font-serif text-sm font-bold text-[#b8934a] text-right">Prix TTC</th>
                  <th className="py-4 px-4 font-serif text-sm font-bold text-[#b8934a] text-center">Disponibilité</th>
                  <th className="py-4 px-5 font-serif text-sm font-bold text-[#b8934a] text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6dab8] text-xs">
                {loadingMeds ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#7a7458]">
                      Chargement des médicaments validés...
                    </td>
                  </tr>
                ) : filteredMeds.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#7a7458]">
                      Aucun médicament ne correspond à votre recherche.
                    </td>
                  </tr>
                ) : (
                  filteredMeds.slice(0, 5).map((med) => (
                    <tr key={med.id_medicament} className="hover:bg-[#fbf7ec]/40 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-[#3a3826] text-sm">{med.nom}</div>
                        <div className="text-[11px] text-[#7a7458] line-clamp-1 max-w-xs">{med.description}</div>
                      </td>
                      <td className="py-3.5 px-4 text-[#7a7458]">
                        {med.categorie_libelle}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#557552]">
                        {med.fournisseur_nom}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-[#3a3826]">
                        {Number(med.prix_ht).toFixed(2)} €
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#557552]">
                        {Number(med.prix_ttc).toFixed(2)} €
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="badge-stock px-2.5 py-1 text-[11px]">
                          {med.quantite_stock > 0 ? `${med.quantite_stock} en stock` : 'Rupture'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <button
                          onClick={() => handleAddToCart(med.id_medicament)}
                          disabled={med.quantite_stock <= 0 || addingId === med.id_medicament}
                          className="btn-art-primary text-xs py-1.5 px-3.5 disabled:opacity-50"
                          title="Ajouter un lot de 10 boîtes au panier"
                        >
                          {addingId === med.id_medicament ? (
                            <Clock className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5 mr-1" />
                              <span>+ 10</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 7 : INSCRIPTION / ACCÈS AVEC ONGLETS ET BASE BOMBÉE               */}
      {/* ========================================================================= */}
      <section className="relative">
        <div className="text-center mb-8">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#557552]">
            Rejoindre la plateforme GSB
          </h2>
          <div className="separator-art my-1">❦</div>
          <p className="text-xs sm:text-sm text-[#7a7458]">
            Accès sécurisé réservé aux professionnels habilités et laboratoires agréés
          </p>
        </div>

        {/* Double filet contour pour le bloc d'inscription */}
        <div className="p-2 sm:p-3 rounded-[24px_24px_124px_124px] border border-[#e6dab8] outline outline-1 outline-[#e6dab8] outline-offset-4 max-w-2xl mx-auto">
          <div className="bg-[#fffdf7] border-[1.5px] border-[#b8934a] rounded-[24px_24px_120px_120px] p-8 sm:p-10 shadow-art-nouveau">
            
            {/* Onglets Pharmacie / Laboratoire selon DESIGN.md */}
            <div className="flex justify-center gap-3 mb-8">
              <button
                onClick={() => setActiveTab('pharmacie')}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  activeTab === 'pharmacie'
                    ? 'bg-[#557552] text-white shadow-sm'
                    : 'bg-transparent border border-[#b8934a] text-[#557552] hover:bg-[#fbf7ec]'
                }`}
              >
                Pharmacies & Médecins
              </button>
              <button
                onClick={() => setActiveTab('laboratoire')}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  activeTab === 'laboratoire'
                    ? 'bg-[#557552] text-white shadow-sm'
                    : 'bg-transparent border border-[#b8934a] text-[#557552] hover:bg-[#fbf7ec]'
                }`}
              >
                Laboratoires Partenaires
              </button>
            </div>

            {/* Contenu de l'onglet actif */}
            {activeTab === 'pharmacie' ? (
              <div className="space-y-4 text-center">
                <p className="text-xs sm:text-sm text-[#7a7458] leading-relaxed">
                  Vous disposez d'un numéro RPPS valide ? Vos identifiants vous sont transmis par la Direction Commerciale GSB. Vous pouvez vous connecter immédiatement avec votre compte de test :
                </p>

                <div className="bg-[#fbf7ec] border border-[#e6dab8] p-4 rounded-xl text-left text-xs space-y-1.5">
                  <div className="font-bold text-[#557552]">Compte Démonstration Pharmacien :</div>
                  <div><strong>Email :</strong> <code className="text-[#b8934a]">j.dupont@pharmacie-centrale.fr</code></div>
                  <div><strong>Mot de passe :</strong> <code className="text-[#b8934a]">admin123</code></div>
                  <div className="text-[11px] text-[#7a7458] italic pt-1">
                    (Profession : Pharmacien d'officine - RPPS 10002345678)
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/connexion"
                    className="btn-art-primary px-6 py-2.5 text-xs w-full sm:w-auto"
                  >
                    Connexion Officine
                  </Link>
                  <Link
                    href="/inscription"
                    className="btn-art-secondary px-6 py-2.5 text-xs w-full sm:w-auto"
                  >
                    Demande d'adhésion RPPS
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <p className="text-xs sm:text-sm text-[#7a7458] leading-relaxed">
                  Vous êtes un laboratoire pharmaceutique et souhaitez distribuer vos produits sur la place de marché GSB ?
                </p>

                <div className="bg-[#fbf7ec] border border-[#e6dab8] p-4 rounded-xl text-left text-xs space-y-1.5">
                  <div className="font-bold text-[#557552]">Conditions de référencement :</div>
                  <div>• Numéro SIRET et agrément ANSM obligatoires</div>
                  <div>• Modération de chaque médicament soumis par la DSI GSB</div>
                  <div>• Interfaçage avec notre API REST normalisée</div>
                </div>

                <div className="pt-4 flex justify-center">
                  <Link
                    href="/fournisseurs"
                    className="btn-art-primary px-6 py-2.5 text-xs"
                  >
                    Déposer une demande de partenariat
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
