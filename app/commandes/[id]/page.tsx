'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/components/AppContext';
import { 
  FileCheck, 
  Printer, 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  Clock, 
  Package, 
  Truck, 
  AlertCircle 
} from 'lucide-react';

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const { user } = useApp();
  const searchParams = useSearchParams();
  const isNewOrder = searchParams.get('success') === 'true';

  const [commande, setCommande] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrderDetail();
  }, [params.id]);

  const loadOrderDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/commandes/${params.id}`);
      const data = await res.json();
      if (res.ok) {
        setCommande(data.commande);
      } else {
        setError(data.error || 'Impossible de charger les détails de cette commande.');
      }
    } catch (e: any) {
      setError('Impossible de contacter le serveur Express ou la base de données MySQL.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EN_ATTENTE':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            <span>En attente de traitement</span>
          </span>
        );
      case 'VALIDEE':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#e4eddc] text-[#557552] border border-[#6f9068]/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Commande validée</span>
          </span>
        );
      case 'PREPARATION':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Package className="w-3.5 h-3.5" />
            <span>En préparation logistique</span>
          </span>
        );
      case 'EXPEDIEE':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Truck className="w-3.5 h-3.5" />
            <span>Colis expédié</span>
          </span>
        );
      case 'LIVREE':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Livrée à l'officine</span>
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1040px] mx-auto px-5 py-20 text-center text-sm text-[#7a7458]">
        Chargement de la commande...
      </div>
    );
  }

  if (error || !commande) {
    return (
      <div className="max-w-[1040px] mx-auto px-5 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-[#d49a8c] mx-auto" />
        <h1 className="font-serif text-2xl font-bold text-[#557552]">Erreur</h1>
        <p className="text-xs text-[#7a7458]">{error || 'Commande introuvable'}</p>
        <Link href="/commandes" className="btn-art-primary px-6 py-2 text-xs inline-block">
          Retour aux commandes
        </Link>
      </div>
    );
  }

  const lignes = commande.lignes || [];
  const totalHt = Number(commande.montant_total_ht);
  const totalTtc = Number(commande.montant_total_ttc);
  const totalTva = parseFloat((totalTtc - totalHt).toFixed(2));

  return (
    <div className="max-w-[1040px] mx-auto px-5 py-10 space-y-8">
      {/* Bannière de confirmation si commande tout juste passée */}
      {isNewOrder && (
        <div className="bg-[#e4eddc] border border-[#6f9068] p-5 rounded-2xl flex items-center gap-3 text-[#557552] shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-7 h-7 flex-shrink-0 text-[#557552]" />
          <div>
            <h2 className="font-bold text-base">Votre commande a été enregistrée avec succès !</h2>
            <p className="text-xs text-[#7a7458]">
              Un récépissé de commande B2B officiel a été généré sous le numéro <strong>{commande.numero_commande}</strong>. Les laboratoires ont été notifiés pour expédition.
            </p>
          </div>
        </div>
      )}

      {/* Barre d'action supérieure */}
      <div className="flex items-center justify-between">
        <Link
          href="/commandes"
          className="text-xs font-semibold text-[#7a7458] hover:text-[#557552] flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à mes commandes</span>
        </Link>

        <button
          onClick={() => window.print()}
          className="btn-art-secondary text-xs px-4 py-2 flex items-center gap-1.5 print:hidden"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Imprimer la facture (PDF)</span>
        </button>
      </div>

      {/* Fiche Facture / Bon de commande Art Nouveau */}
      <div className="bg-[#fffdf7] border-[1.5px] border-[#b8934a] rounded-[40px_8px_40px_8px] p-8 sm:p-10 shadow-art-nouveau space-y-8">
        {/* En-tête Facture */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-[#e6dab8] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl text-[#557552]">✿</span>
              <span className="font-serif text-2xl font-bold text-[#557552]">
                Pharma<span className="text-[#b8934a]">Link</span> GSB
              </span>
            </div>
            <p className="text-xs text-[#7a7458]">
              Bon de commande d'approvisionnement B2B — Norme ANSM
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <div className="font-mono text-xl font-bold text-[#557552]">
              {commande.numero_commande}
            </div>
            <div className="text-xs text-[#7a7458] flex items-center sm:justify-end gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#b8934a]" />
              <span>
                {new Date(commande.date_commande).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="pt-1">{getStatusBadge(commande.statut_commande)}</div>
          </div>
        </div>

        {/* Coordonnées Client et Livraison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-[#fbf7ec] border border-[#e6dab8] p-5 rounded-2xl text-xs">
          <div className="space-y-1">
            <span className="font-serif text-sm font-bold text-[#557552] block">
              Destinataire (Professionnel de santé)
            </span>
            <p className="font-semibold text-[#3a3826]">{commande.client_nom}</p>
            <p className="text-[#7a7458]">{commande.type_profession || 'Pharmacien titulaire'}</p>
            {commande.numero_rpps && <p className="text-[#7a7458]">RPPS : {commande.numero_rpps}</p>}
            <p className="text-[#7a7458]">{commande.client_email}</p>
          </div>

          <div className="space-y-1">
            <span className="font-serif text-sm font-bold text-[#557552] flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#b8934a]" />
              <span>Adresse de livraison officine</span>
            </span>
            <p className="text-[#3a3826] font-medium">{commande.adresse_livraison}</p>
            <p className="text-[#3a3826] font-medium">{commande.code_postal_livraison} {commande.ville_livraison}</p>
            <p className="text-[11px] text-[#557552] pt-1">Transport sécurisé sous chaîne du froid</p>
          </div>
        </div>

        {/* Tableau des lignes de commande (Prix figés à l'achat) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#e6dab8] bg-[#fbf7ec]">
                <th className="py-3 px-4 font-serif text-sm font-bold text-[#b8934a]">Médicament</th>
                <th className="py-3 px-4 font-serif text-sm font-bold text-[#b8934a]">Laboratoire Fournisseur</th>
                <th className="py-3 px-4 font-serif text-sm font-bold text-[#b8934a] text-center">Quantité</th>
                <th className="py-3 px-4 font-serif text-sm font-bold text-[#b8934a] text-right">P.U. HT</th>
                <th className="py-3 px-4 font-serif text-sm font-bold text-[#b8934a] text-right">TVA</th>
                <th className="py-3 px-4 font-serif text-sm font-bold text-[#b8934a] text-right">Total Ligne HT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6dab8]">
              {lignes.map((line: any, idx: number) => (
                <tr key={idx} className="hover:bg-[#fbf7ec]/40">
                  <td className="py-3.5 px-4 font-semibold text-[#3a3826]">
                    {line.medicament_nom}
                  </td>
                  <td className="py-3.5 px-4 text-[#557552]">
                    {line.laboratoire_fournisseur}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold">
                    {line.quantite_commandee}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono">
                    {Number(line.prix_unitaire_ht).toFixed(2)} €
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-[#7a7458]">
                    {Number(line.taux_tva).toFixed(2)} %
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-[#3a3826]">
                    {Number(line.total_ligne_ht).toFixed(2)} €
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bilan financier */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-6 border-t border-[#e6dab8] gap-4">
          <div className="text-xs text-[#7a7458] space-y-1">
            <p>Conditions de règlement : Virement bancaire interprofessionnel sous 30 jours.</p>
            <p>Épreuve BTS SIO SLAM 2e année — Projet Galaxy Swiss Bourdin.</p>
          </div>

          <div className="w-full sm:w-72 bg-[#fbf7ec] border border-[#e6dab8] rounded-xl p-4 space-y-2 text-xs">
            <div className="flex justify-between text-[#3a3826]">
              <span>Sous-total HT :</span>
              <span className="font-mono font-bold">{totalHt.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-[#7a7458]">
              <span>TVA (2,10%) :</span>
              <span className="font-mono">{totalTva.toFixed(2)} €</span>
            </div>
            <div className="pt-2 border-t border-[#e6dab8] flex justify-between items-baseline">
              <span className="font-serif text-sm font-bold text-[#557552]">Total Net TTC :</span>
              <span className="font-mono text-lg font-bold text-[#557552]">{totalTtc.toFixed(2)} €</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
