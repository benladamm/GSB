'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/AppContext';
import { 
  FileText, 
  Calendar, 
  MapPin, 
  ArrowRight, 
  Clock, 
  CheckCircle, 
  Package, 
  Truck, 
  AlertCircle 
} from 'lucide-react';

export default function CommandesPage() {
  const { user } = useApp();
  const [commandes, setCommandes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCommandes();
    }
  }, [user]);

  const loadCommandes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/commandes');
      if (res.ok) {
        const data = await res.json();
        setCommandes(data.commandes || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EN_ATTENTE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            <span>En attente</span>
          </span>
        );
      case 'VALIDEE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#e4eddc] text-[#557552] border border-[#6f9068]/30">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Validée</span>
          </span>
        );
      case 'PREPARATION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Package className="w-3.5 h-3.5" />
            <span>En préparation</span>
          </span>
        );
      case 'EXPEDIEE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Truck className="w-3.5 h-3.5" />
            <span>Expédiée</span>
          </span>
        );
      case 'LIVREE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Livrée</span>
          </span>
        );
      case 'ANNULEE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Annulée</span>
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  if (!user) {
    return (
      <div className="max-w-[1040px] mx-auto px-5 py-20 text-center space-y-4">
        <h1 className="font-serif text-3xl font-bold text-[#557552]">Accès réservé</h1>
        <p className="text-sm text-[#7a7458]">Veuillez vous connecter pour consulter l'historique de vos commandes.</p>
        <Link href="/connexion" className="btn-art-primary px-6 py-2.5 text-xs inline-block">
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1040px] mx-auto px-5 py-10 space-y-8">
      {/* En-tête */}
      <div className="border-b border-[#e6dab8] pb-6 space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fffdf7] border border-[#e6dab8] text-xs font-semibold text-[#557552]">
          <span>Espace Professionnel Santé</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#557552]">
          Historique des Commandes
        </h1>
        <p className="text-xs text-[#7a7458]">
          Suivi des bons de commande, factures et statuts d'acheminement
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-[#7a7458] text-sm">
          Chargement de vos commandes...
        </div>
      ) : commandes.length === 0 ? (
        <div className="bg-[#fffdf7] border-[1.5px] border-[#b8934a] rounded-[30px_8px_30px_8px] p-12 text-center space-y-4 shadow-art-nouveau">
          <FileText className="w-12 h-12 text-[#7a7458] mx-auto" />
          <h2 className="font-serif text-2xl font-bold text-[#557552]">
            Aucune commande enregistrée
          </h2>
          <p className="text-xs text-[#7a7458] max-w-md mx-auto">
            Vous n'avez pas encore passé de commande sur la plateforme. Rendez-vous sur le catalogue pour effectuer votre premier approvisionnement.
          </p>
          <Link href="/catalogue" className="btn-art-primary px-6 py-2.5 text-xs inline-block">
            Consulter le catalogue
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {commandes.map((cmd) => (
            <div
              key={cmd.id_commande}
              className="bg-[#fffdf7] border-[1.5px] border-[#b8934a] rounded-[24px_6px_24px_6px] p-6 shadow-art-nouveau hover:translate-y-[-1px] transition-transform"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-base font-bold text-[#557552]">
                      {cmd.numero_commande}
                    </span>
                    {getStatusBadge(cmd.statut_commande)}
                    <span className="text-xs text-[#7a7458] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#b8934a]" />
                      <span>{new Date(cmd.date_commande).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  </div>

                  <div className="text-xs text-[#7a7458] flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#b8934a]" />
                      <span>{cmd.adresse_livraison}, {cmd.code_postal_livraison} {cmd.ville_livraison}</span>
                    </span>
                    {cmd.client_nom && user.role === 'ADMIN' && (
                      <span className="font-semibold text-[#3a3826]">
                        Client : {cmd.client_nom} ({cmd.type_profession || 'Pharmacien'})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between w-full md:w-auto gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-[#e6dab8]">
                  <div className="text-left md:text-right">
                    <span className="text-[11px] text-[#7a7458] block">Montant Total TTC</span>
                    <span className="font-mono text-lg font-bold text-[#557552]">
                      {Number(cmd.montant_total_ttc).toFixed(2)} €
                    </span>
                    <span className="text-[10px] text-[#7a7458] block">
                      ({Number(cmd.montant_total_ht).toFixed(2)} € HT)
                    </span>
                  </div>

                  <Link
                    href={`/commandes/${cmd.id_commande}`}
                    className="btn-art-secondary text-xs px-4 py-2 flex items-center gap-1.5"
                  >
                    <span>Détails & Facture</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
