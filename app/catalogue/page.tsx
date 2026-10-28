'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/components/AppContext';
import { Search, ShoppingBag, Filter, CheckCircle2, Info, Building2, Tag, Plus, Minus, X, AlertCircle } from 'lucide-react';

export default function CataloguePage() {
  const { user, refreshCartCount } = useApp();
  const [medicaments, setMedicaments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [fournisseurs, setFournisseurs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [selectedFour, setSelectedFour] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'nom' | 'prix_asc' | 'prix_desc'>('nom');

  // Quantités par médicament
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [resMeds, resCats, resFours] = await Promise.all([
        fetch('/api/medicaments?statut=VALIDE'),
        fetch('/api/categories'),
        fetch('/api/fournisseurs'),
      ]);
      const dataMeds = await resMeds.json();
      const dataCats = await resCats.json();
      const dataFours = await resFours.json();

      if (!resMeds.ok) {
        setErrorMsg(dataMeds.error || 'Erreur lors du chargement des médicaments');
      } else if (dataMeds.medicaments) {
        setMedicaments(dataMeds.medicaments);
      }

      if (dataCats.categories) setCategories(dataCats.categories);
      if (dataFours.fournisseurs) setFournisseurs(dataFours.fournisseurs);

      // Initialiser les quantités par défaut à 10
      const initialQtys: Record<number, number> = {};
      dataMeds.medicaments?.forEach((m: any) => {
        initialQtys[m.id_medicament] = 10;
      });
      setQuantities(initialQtys);
    } catch (e: any) {
      console.error(e);
      setErrorMsg('Impossible de contacter le serveur Express ou la base de données MySQL.');
    } finally {
      setLoading(false);
    }
  };

  const handleQtyChange = (id: number, delta: number) => {
    setQuantities((prev) => {
      const current = prev[id] || 10;
      const updated = Math.max(1, current + delta);
      return { ...prev, [id]: updated };
    });
  };

  const handleAddToCart = async (med: any) => {
    if (!user) {
      window.location.href = '/connexion';
      return;
    }

    const qty = quantities[med.id_medicament] || 10;
    try {
      const res = await fetch('/api/panier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_medicament: med.id_medicament, quantite: qty }),
      });
      if (res.ok) {
        await refreshCartCount();
        setToastMessage(`${qty} boîte(s) de ${med.nom} ajoutée(s) au panier`);
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filtrage et tri
  const filtered = medicaments
    .filter((m) => {
      const matchSearch =
        m.nom.toLowerCase().includes(search.toLowerCase()) ||
        m.description?.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCat === 'ALL' || m.id_categorie === parseInt(selectedCat, 10);
      const matchFour = selectedFour === 'ALL' || m.id_fournisseur === parseInt(selectedFour, 10);
      return matchSearch && matchCat && matchFour;
    })
    .sort((a, b) => {
      if (sortBy === 'prix_asc') return a.prix_ht - b.prix_ht;
      if (sortBy === 'prix_desc') return b.prix_ht - a.prix_ht;
      return a.nom.localeCompare(b.nom);
    });

  return (
    <div className="max-w-[1040px] mx-auto px-5 py-10 space-y-8">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#557552] text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 border border-[#b8934a] animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-[#e4eddc]" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* En-tête de section */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fffdf7] border border-[#e6dab8] text-xs font-semibold text-[#557552]">
          <span>Catalogue Officiel GSB</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#557552]">
          Médicaments & Spécialités Pharmaceutiques
        </h1>
        <div className="separator-art">❦</div>
        <p className="text-xs sm:text-sm text-[#7a7458] max-w-xl mx-auto">
          Approvisionnement direct pour officines et praticiens. Tous les prix sont affichés hors taxes et toutes taxes comprises (TVA légale 2,10%).
        </p>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-[#fffdf7] border border-[#b8934a]/60 rounded-2xl p-5 shadow-art-nouveau space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#7a7458] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Recherche par molécule ou nom commercial (Paracétamol, Amoxicilline...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-art w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm"
              id="catalogue-search-input"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
            {/* Filtre Catégorie */}
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="input-art px-3 py-2.5 text-xs font-medium w-full sm:w-auto"
              id="filter-category"
            >
              <option value="ALL">Toutes les catégories</option>
              {categories.map((c) => (
                <option key={c.id_categorie} value={c.id_categorie}>
                  {c.libelle}
                </option>
              ))}
            </select>

            {/* Filtre Fournisseur */}
            <select
              value={selectedFour}
              onChange={(e) => setSelectedFour(e.target.value)}
              className="input-art px-3 py-2.5 text-xs font-medium w-full sm:w-auto"
              id="filter-supplier"
            >
              <option value="ALL">Tous les laboratoires</option>
              {fournisseurs.map((f) => (
                <option key={f.id_fournisseur} value={f.id_fournisseur}>
                  {f.raison_sociale}
                </option>
              ))}
            </select>

            {/* Tri */}
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="input-art px-3 py-2.5 text-xs font-medium w-full sm:w-auto"
              id="sort-select"
            >
              <option value="nom">Tri : Nom (A-Z)</option>
              <option value="prix_asc">Prix HT croissant</option>
              <option value="prix_desc">Prix HT décroissant</option>
            </select>
          </div>
        </div>
      </div>

      {/* Alerte Erreur */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-300 text-red-800 p-4 rounded-xl text-xs flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <span className="font-bold">Erreur de chargement : </span>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {/* Grille des médicaments */}
      {loading ? (
        <div className="text-center py-20 text-[#7a7458]">
          <p className="text-sm">Chargement du catalogue pharmaceutique...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#fffdf7] border border-[#e6dab8] rounded-2xl p-12 text-center space-y-3">
          <p className="font-serif text-lg text-[#557552]">Aucun produit trouvé</p>
          <p className="text-xs text-[#7a7458]">Essayez d'ajuster vos critères de recherche ou filtres.</p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCat('ALL');
              setSelectedFour('ALL');
            }}
            className="btn-art-secondary text-xs px-4 py-2 mt-2"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((med, index) => {
            const isAlt = index % 2 === 1;
            const currentQty = quantities[med.id_medicament] || 10;
            return (
              <div
                key={med.id_medicament}
                className={`${isAlt ? 'card-art-2' : 'card-art-1'} p-6 flex flex-col justify-between`}
              >
                <div className="space-y-3">
                  {/* Badges catégorie & stock */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-[#b8934a] bg-[#fbf7ec] border border-[#e6dab8] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {med.categorie_libelle}
                    </span>
                    <span className="badge-stock text-[10px] px-2 py-0.5">
                      Stock: {med.quantite_stock}
                    </span>
                  </div>

                  {/* Nom & Laboratoire */}
                  <div>
                    <h3 className="font-serif text-xl font-bold text-[#3a3826] leading-tight">
                      {med.nom}
                    </h3>
                    <p className="text-[11px] text-[#557552] font-semibold flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3 h-3 text-[#b8934a]" />
                      <span>{med.fournisseur_nom}</span>
                    </p>
                  </div>

                  {/* Description courte */}
                  <p className="text-xs text-[#7a7458] line-clamp-2 leading-relaxed">
                    {med.description}
                  </p>

                  {/* Prix HT et TTC */}
                  <div className="bg-[#fbf7ec] border border-[#e6dab8] rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#7a7458] block">Prix unitaire HT</span>
                      <span className="font-mono font-bold text-[#3a3826] text-base">
                        {Number(med.prix_ht).toFixed(2)} €
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[#557552] font-medium block">TTC (TVA 2,1%)</span>
                      <span className="font-mono font-bold text-[#557552] text-lg">
                        {Number(med.prix_ttc).toFixed(2)} €
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions : Quantité et Bouton d'ajout */}
                <div className="pt-5 border-t border-[#e6dab8]/80 mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#7a7458]">Quantité désirée :</span>
                    <div className="flex items-center border border-[#b8934a] rounded-lg bg-[#fffdf7] overflow-hidden">
                      <button
                        onClick={() => handleQtyChange(med.id_medicament, -5)}
                        className="px-2.5 py-1 text-xs text-[#557552] hover:bg-[#e4eddc] transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-3 py-1 text-xs font-mono font-bold text-[#3a3826] min-w-[36px] text-center">
                        {currentQty}
                      </span>
                      <button
                        onClick={() => handleQtyChange(med.id_medicament, 5)}
                        className="px-2.5 py-1 text-xs text-[#557552] hover:bg-[#e4eddc] transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedProduct(med)}
                      className="p-2.5 rounded-full border border-[#e6dab8] text-[#7a7458] hover:text-[#557552] hover:border-[#557552] transition-colors"
                      title="Détails du médicament"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleAddToCart(med)}
                      disabled={med.quantite_stock <= 0}
                      className="btn-art-primary flex-1 py-2 text-xs"
                      id={`add-btn-${med.id_medicament}`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
                      <span>Ajouter au panier</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modale Détails Produit */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fffdf7] border-[1.5px] border-[#b8934a] rounded-[30px_8px_30px_8px] max-w-lg w-full p-6 space-y-4 shadow-2xl relative animate-fadeIn">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 text-[#7a7458] hover:text-[#3a3826] p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#b8934a] bg-[#fbf7ec] border border-[#e6dab8] px-2.5 py-0.5 rounded-full uppercase">
                {selectedProduct.categorie_libelle}
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#557552]">
                {selectedProduct.nom}
              </h2>
              <p className="text-xs text-[#7a7458]">
                Laboratoire fournisseur : <strong>{selectedProduct.fournisseur_nom}</strong>
              </p>
            </div>

            <div className="text-xs text-[#3a3826] bg-[#fbf7ec] p-4 rounded-xl space-y-2 border border-[#e6dab8]">
              <p className="font-semibold text-[#557552]">Notice & Indications :</p>
              <p className="leading-relaxed">{selectedProduct.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#fffdf7] border border-[#e6dab8] rounded-lg">
                <span className="text-[#7a7458] block">Prix unitaire HT :</span>
                <span className="font-mono font-bold text-sm">{Number(selectedProduct.prix_ht).toFixed(2)} €</span>
              </div>
              <div className="p-3 bg-[#fffdf7] border border-[#e6dab8] rounded-lg">
                <span className="text-[#7a7458] block">Prix unitaire TTC :</span>
                <span className="font-mono font-bold text-sm text-[#557552]">{Number(selectedProduct.prix_ttc).toFixed(2)} €</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setSelectedProduct(null)}
                className="btn-art-secondary text-xs px-4 py-2"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  handleAddToCart(selectedProduct);
                  setSelectedProduct(null);
                }}
                className="btn-art-primary text-xs px-5 py-2"
              >
                Ajouter au panier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
