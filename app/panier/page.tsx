'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/AppContext';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  CheckCircle2, 
  Truck, 
  AlertCircle, 
  ShieldCheck,
  FileCheck
} from 'lucide-react';

export default function PanierPage() {
  const router = useRouter();
  const { user, refreshCartCount } = useApp();
  const [panier, setPanier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Formulaire de livraison
  const [adresse, setAdresse] = useState('');
  const [codePostal, setCodePostal] = useState('');
  const [ville, setVille] = useState('');

  useEffect(() => {
    loadPanier();
  }, [user]);

  const loadPanier = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/panier');
      const data = await res.json();
      if (res.ok) {
        setPanier(data);
        if (user) {
          // Préremplir avec l'adresse du professionnel
          setAdresse('42 Boulevard Victor Hugo');
          setCodePostal('44000');
          setVille('Nantes');
        }
      } else {
        setErrorMsg(data.error || 'Erreur lors du chargement du panier');
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg('Impossible de joindre le serveur API Express ou la base de données MySQL.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQty = async (id_medicament: number, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    try {
      const res = await fetch('/api/panier', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_medicament, quantite: newQty }),
      });
      if (res.ok) {
        await loadPanier();
        await refreshCartCount();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteItem = async (id_medicament: number) => {
    try {
      const res = await fetch(`/api/panier?id_medicament=${id_medicament}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await loadPanier();
        await refreshCartCount();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearCart = async () => {
    if (!confirm('Êtes-vous sûr de vouloir vider l\'ensemble de votre bon de commande ?')) return;
    try {
      const res = await fetch('/api/panier?clear=true', {
        method: 'DELETE',
      });
      if (res.ok) {
        await loadPanier();
        await refreshCartCount();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adresse || !codePostal || !ville) {
      setErrorMsg('Veuillez renseigner une adresse complète pour l\'expédition des produits pharmaceutiques.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/commandes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adresse_livraison: adresse,
          code_postal_livraison: codePostal,
          ville_livraison: ville,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        await refreshCartCount();
        router.push(`/commandes/${data.id_commande}?success=true`);
      } else {
        setErrorMsg(data.error || 'Erreur lors de la validation de la commande');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-[1040px] mx-auto px-5 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-[#fffdf7] border border-[#b8934a] mx-auto flex items-center justify-center text-[#557552]">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-[#557552]">
          Accès au bon de commande réservé
        </h1>
        <p className="text-sm text-[#7a7458] max-w-md mx-auto">
          Pour consulter ou créer un panier d'achats pharmaceutiques, veuillez vous authentifier avec vos identifiants professionnels.
        </p>
        <Link href="/connexion" className="btn-art-primary px-8 py-3 text-sm inline-block">
          Se connecter à mon compte
        </Link>
      </div>
    );
  }

  const lignes = panier?.lignes || [];

  return (
    <div className="max-w-[1040px] mx-auto px-5 py-10 space-y-8">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#e6dab8] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fffdf7] border border-[#e6dab8] text-xs font-semibold text-[#557552] mb-1">
            <span>Bon de commande en cours</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#557552]">
            Mon Panier d'Achats
          </h1>
          <p className="text-xs text-[#7a7458] mt-1">
            Professionnel : <strong>{user.prenom} {user.nom}</strong> ({user.type_profession || 'Pharmacien'})
          </p>
        </div>

        {lignes.length > 0 && (
          <button
            onClick={handleClearCart}
            className="text-xs text-[#d49a8c] hover:text-red-700 font-medium flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Vider le panier</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-[#7a7458] text-sm">
          Chargement de votre panier...
        </div>
      ) : lignes.length === 0 ? (
        <div className="bg-[#fffdf7] border-[1.5px] border-[#b8934a] rounded-[40px_8px_40px_8px] p-12 text-center space-y-5 shadow-art-nouveau">
          <div className="w-16 h-16 rounded-full bg-[#fbf7ec] border border-[#e6dab8] mx-auto flex items-center justify-center text-[#7a7458]">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#557552]">
            Votre panier est actuellement vide
          </h2>
          <p className="text-xs sm:text-sm text-[#7a7458] max-w-md mx-auto">
            Consultez le catalogue pour sélectionner les médicaments nécessaires à votre officine ou cabinet.
          </p>
          <Link href="/catalogue" className="btn-art-primary px-6 py-2.5 text-xs inline-block">
            Accéder au catalogue
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Liste des articles (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#fffdf7] border-[1.5px] border-[#b8934a] rounded-[30px_8px_30px_8px] overflow-hidden shadow-art-nouveau">
              <div className="divide-y divide-[#e6dab8]">
                {lignes.map((item: any) => (
                  <div key={item.id_medicament} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#fbf7ec]/30 transition-colors">
                    <div className="space-y-1 flex-1">
                      <span className="text-[10px] font-bold text-[#b8934a] bg-[#fbf7ec] border border-[#e6dab8] px-2 py-0.5 rounded-full uppercase">
                        {item.categorie_libelle}
                      </span>
                      <h3 className="font-serif text-lg font-bold text-[#3a3826]">
                        {item.medicament_nom}
                      </h3>
                      <p className="text-xs text-[#557552] font-semibold">
                        Laboratoire : {item.fournisseur_nom}
                      </p>
                      <div className="text-[11px] text-[#7a7458] flex items-center gap-3 pt-1">
                        <span>P.U. HT : <strong>{Number(item.prix_ht).toFixed(2)} €</strong></span>
                        <span>•</span>
                        <span>TVA : 2.10%</span>
                        <span>•</span>
                        <span className="text-[#557552]">P.U. TTC : <strong>{Number(item.prix_ttc).toFixed(2)} €</strong></span>
                      </div>
                    </div>

                    {/* Quantité & Totaux */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3">
                      <div className="text-right">
                        <span className="text-xs text-[#7a7458] block">Total ligne HT</span>
                        <span className="font-mono font-bold text-[#3a3826] text-base">
                          {Number(item.total_ligne_ht).toFixed(2)} € HT
                        </span>
                        <span className="font-mono font-bold text-[#557552] text-xs block">
                          ({Number(item.total_ligne_ttc).toFixed(2)} € TTC)
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-[#b8934a] rounded-lg bg-[#fffdf7] overflow-hidden">
                          <button
                            onClick={() => handleUpdateQty(item.id_medicament, item.quantite, -1)}
                            className="px-2 py-1 text-xs text-[#557552] hover:bg-[#e4eddc]"
                            title="Diminuer la quantité"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 py-1 text-xs font-mono font-bold text-[#3a3826] min-w-[32px] text-center">
                            {item.quantite}
                          </span>
                          <button
                            onClick={() => handleUpdateQty(item.id_medicament, item.quantite, 1)}
                            className="px-2 py-1 text-xs text-[#557552] hover:bg-[#e4eddc]"
                            title="Augmenter la quantité"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => handleDeleteItem(item.id_medicament)}
                          className="p-1.5 text-[#7a7458] hover:text-[#d49a8c] rounded"
                          title="Supprimer la ligne"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[#7a7458] px-2">
              <Link href="/catalogue" className="hover:text-[#557552] font-semibold flex items-center gap-1">
                ← Poursuivre mes achats sur le catalogue
              </Link>
              <span>{panier.total_articles} article(s) au total</span>
            </div>
          </div>

          {/* Récapitulatif et Validation (1 col) */}
          <div className="space-y-6">
            <div className="bg-[#fffdf7] border-[1.5px] border-[#b8934a] rounded-[30px_8px_30px_8px] p-6 shadow-art-nouveau space-y-5">
              <h2 className="font-serif text-xl font-bold text-[#557552] border-b border-[#e6dab8] pb-3">
                Récapitulatif Financier
              </h2>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[#3a3826]">
                  <span>Total Hors Taxes (HT) :</span>
                  <span className="font-mono font-bold">{Number(panier.montant_total_ht).toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-[#7a7458]">
                  <span>TVA Médicaments (2.10%) :</span>
                  <span className="font-mono">{Number(panier.montant_tva).toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-[#7a7458]">
                  <span>Frais de livraison sécurisée :</span>
                  <span className="text-[#557552] font-semibold">Offerts (B2B GSB)</span>
                </div>
                <div className="pt-3 border-t border-[#e6dab8] flex justify-between items-baseline">
                  <span className="font-serif text-base font-bold text-[#3a3826]">Total Net à Payer (TTC) :</span>
                  <span className="font-mono text-xl font-bold text-[#557552]">
                    {Number(panier.montant_total_ttc).toFixed(2)} €
                  </span>
                </div>
              </div>

              {/* Formulaire de livraison */}
              <form onSubmit={handleCreateOrder} className="space-y-4 pt-3 border-t border-[#e6dab8]">
                <h3 className="font-serif text-sm font-bold text-[#557552] flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#b8934a]" />
                  <span>Adresse de livraison officine</span>
                </h3>

                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="space-y-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-[#7a7458] block mb-1">
                      Rue / Avenue / Voie
                    </label>
                    <input
                      type="text"
                      required
                      value={adresse}
                      onChange={(e) => setAdresse(e.target.value)}
                      placeholder="Ex : 42 Boulevard Victor Hugo"
                      className="input-art w-full px-3 py-2 text-xs"
                      id="order-adresse"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-[#7a7458] block mb-1">
                        Code Postal
                      </label>
                      <input
                        type="text"
                        required
                        value={codePostal}
                        onChange={(e) => setCodePostal(e.target.value)}
                        placeholder="Ex : 44000"
                        className="input-art w-full px-3 py-2 text-xs"
                        id="order-cp"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#7a7458] block mb-1">
                        Ville
                      </label>
                      <input
                        type="text"
                        required
                        value={ville}
                        onChange={(e) => setVille(e.target.value)}
                        placeholder="Ex : Nantes"
                        className="input-art w-full px-3 py-2 text-xs"
                        id="order-ville"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-art-primary w-full py-3 text-sm font-bold shadow-md"
                    id="order-submit-button"
                  >
                    {submitting ? (
                      <span>Validation en cours...</span>
                    ) : (
                      <span className="flex items-center justify-center gap-1.5">
                        <FileCheck className="w-4 h-4" />
                        <span>Valider la commande ({Number(panier.montant_total_ttc).toFixed(2)} €)</span>
                      </span>
                    )}
                  </button>
                </div>

                <p className="text-[10px] text-[#7a7458] text-center italic">
                  Les prix unitaires HT et taux de TVA seront définitivement figés à l'enregistrement.
                </p>
              </form>
            </div>

            <div className="bg-[#fbf7ec] border border-[#e6dab8] rounded-xl p-4 text-xs space-y-2 text-[#7a7458]">
              <div className="flex items-center gap-2 text-[#557552] font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Garantie Chaîne du Froid</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Tous les médicaments sont conditionnés selon les normes de transport pharmaceutique certifié BPDG.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
