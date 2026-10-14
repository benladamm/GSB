'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/AppContext';
import { 
  ShieldCheck, 
  BarChart3, 
  Pill, 
  ShoppingBag, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Plus, 
  Eye, 
  AlertCircle,
  Building2,
  DollarSign
} from 'lucide-react';

export default function AdminPage() {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'moderation' | 'commandes' | 'users'>('moderation');

  // Stats
  const [stats, setStats] = useState<any>(null);

  // Modération
  const [allMedicaments, setAllMedicaments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [fournisseurs, setFournisseurs] = useState<any[]>([]);
  const [loadingMeds, setLoadingMeds] = useState(false);

  // Commandes
  const [commandes, setCommandes] = useState<any[]>([]);
  const [loadingCmds, setLoadingCmds] = useState(false);

  // Utilisateurs
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Notification Toast
  const [toast, setToast] = useState<string | null>(null);

  // Modale Nouveau Médicament
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [newMedNom, setNewMedNom] = useState('');
  const [newMedDesc, setNewMedDesc] = useState('');
  const [newMedPrixHt, setNewMedPrixHt] = useState('');
  const [newMedStock, setNewMedStock] = useState('500');
  const [newMedFour, setNewMedFour] = useState('1');
  const [newMedCat, setNewMedCat] = useState('1');

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadStats();
      loadMedicaments();
      loadCommandes();
      loadUsers();
      loadMeta();
    }
  }, [user]);

  const loadMeta = async () => {
    try {
      const [resC, resF] = await Promise.all([fetch('/api/categories'), fetch('/api/fournisseurs')]);
      const dataC = await resC.json();
      const dataF = await resF.json();
      if (dataC.categories) setCategories(dataC.categories);
      if (dataF.fournisseurs) setFournisseurs(dataF.fournisseurs);
    } catch (e) {
      console.error(e);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.stats) setStats(data.stats);
    } catch (e) {
      console.error(e);
    }
  };

  const loadMedicaments = async () => {
    setLoadingMeds(true);
    try {
      const res = await fetch('/api/medicaments?statut=ALL');
      const data = await res.json();
      if (data.medicaments) setAllMedicaments(data.medicaments);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMeds(false);
    }
  };

  const loadCommandes = async () => {
    setLoadingCmds(true);
    try {
      const res = await fetch('/api/commandes');
      const data = await res.json();
      if (data.commandes) setCommandes(data.commandes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCmds(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.users) setUsersList(data.users);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleModerateMed = async (id_medicament: number, statut: 'VALIDE' | 'REFUSE', comment?: string) => {
    try {
      const res = await fetch(`/api/medicaments/${id_medicament}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statut_validation: statut,
          commentaire_validation: comment || (statut === 'VALIDE' ? 'Validé par l\'administrateur GSB' : 'Non conforme aux normes ANSM'),
        }),
      });
      if (res.ok) {
        setToast(`Médicament ${statut === 'VALIDE' ? 'validé et mis au catalogue' : 'refusé'}.`);
        await loadMedicaments();
        await loadStats();
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateOrderStatus = async (id_commande: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/commandes/${id_commande}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut_commande: newStatus }),
      });
      if (res.ok) {
        setToast(`Statut de la commande mis à jour : ${newStatus}`);
        await loadCommandes();
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleUserActive = async (id_utilisateur: number, currentActive: number) => {
    try {
      const res = await fetch(`/api/admin/users/${id_utilisateur}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actif: currentActive === 1 ? 0 : 1 }),
      });
      if (res.ok) {
        setToast('Statut du compte utilisateur mis à jour');
        await loadUsers();
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateMed = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/medicaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: newMedNom,
          description: newMedDesc,
          prix_ht: newMedPrixHt,
          quantite_stock: newMedStock,
          id_fournisseur: newMedFour,
          id_categorie: newMedCat,
        }),
      });
      if (res.ok) {
        setShowAddMedModal(false);
        setNewMedNom('');
        setNewMedDesc('');
        setNewMedPrixHt('');
        setToast('Médicament créé et intégré au catalogue !');
        await loadMedicaments();
        await loadStats();
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="max-w-[1040px] mx-auto px-5 py-20 text-center space-y-4">
        <ShieldCheck className="w-16 h-16 text-[#d49a8c] mx-auto" />
        <h1 className="font-serif text-3xl font-bold text-[#557552]">Accès Administrateur Restreint</h1>
        <p className="text-sm text-[#7a7458]">
          Cette console est strictement réservée à l'équipe de pilotage DSI et aux pharmaciens inspecteurs GSB.
        </p>
        <Link href="/connexion" className="btn-art-primary px-6 py-2.5 text-xs inline-block">
          Se connecter en tant qu'administrateur
        </Link>
      </div>
    );
  }

  const pendingMedicaments = allMedicaments.filter((m) => m.statut_validation === 'EN_ATTENTE');

  return (
    <div className="max-w-[1040px] mx-auto px-5 py-10 space-y-8">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#557552] text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 border border-[#b8934a] animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-[#e4eddc]" />
          <span className="text-sm font-semibold">{toast}</span>
        </div>
      )}

      {/* En-tête de la Console Admin */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#e6dab8] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#557552] text-white text-xs font-semibold mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Console DSI & Contrôle Pharmaceutique</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#557552]">
            Espace d'Administration GSB
          </h1>
          <p className="text-xs text-[#7a7458] mt-1">
            Administratrice : <strong>{user.prenom} {user.nom}</strong> ({user.email})
          </p>
        </div>

        <Link
          href="/api-docs"
          className="btn-art-secondary text-xs px-4 py-2 flex items-center gap-1.5"
        >
          <span>Consulter les routes API REST</span>
          <span className="text-[#b8934a]">➔</span>
        </Link>
      </div>

      {/* Navigation par Onglets */}
      <div className="flex items-center gap-2 border-b border-[#e6dab8] overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('moderation')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'moderation'
              ? 'bg-[#fffdf7] text-[#557552] border-t-2 border-x border-[#b8934a] shadow-sm'
              : 'text-[#7a7458] hover:text-[#3a3826]'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Modération Produits</span>
          {pendingMedicaments.length > 0 && (
            <span className="bg-[#d49a8c] text-white text-[10px] px-2 py-0.2 rounded-full font-bold">
              {pendingMedicaments.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'dashboard'
              ? 'bg-[#fffdf7] text-[#557552] border-t-2 border-x border-[#b8934a] shadow-sm'
              : 'text-[#7a7458] hover:text-[#3a3826]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Tableau de Bord</span>
        </button>

        <button
          onClick={() => setActiveTab('commandes')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'commandes'
              ? 'bg-[#fffdf7] text-[#557552] border-t-2 border-x border-[#b8934a] shadow-sm'
              : 'text-[#7a7458] hover:text-[#3a3826]'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Commandes Globales ({commandes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-[#fffdf7] text-[#557552] border-t-2 border-x border-[#b8934a] shadow-sm'
              : 'text-[#7a7458] hover:text-[#3a3826]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Comptes Utilisateurs ({usersList.length})</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* ONGLET 1 : MODÉRATION DES PRODUITS (FONCTION CRUCIALE CDC GSB)         */}
      {/* ===================================================================== */}
      {activeTab === 'moderation' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#557552]">
                Contrôle et Validation des Spécialités Pharmaceutiques
              </h2>
              <p className="text-xs text-[#7a7458]">
                Conformément au cahier des charges, les produits proposés par les laboratoires partenaires nécessitent l'accord préalable de l'administrateur GSB.
              </p>
            </div>

            <button
              onClick={() => setShowAddMedModal(true)}
              className="btn-art-primary text-xs px-4 py-2 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un médicament</span>
            </button>
          </div>

          {/* En attente */}
          <div className="bg-[#fffdf7] border-[1.5px] border-[#b8934a] rounded-[30px_8px_30px_8px] p-6 shadow-art-nouveau space-y-4">
            <div className="flex items-center gap-2 border-b border-[#e6dab8] pb-3">
              <Clock className="w-5 h-5 text-[#b8934a]" />
              <h3 className="font-serif text-lg font-bold text-[#3a3826]">
                Demandes de référencement en attente ({pendingMedicaments.length})
              </h3>
            </div>

            {pendingMedicaments.length === 0 ? (
              <p className="text-xs text-[#7a7458] py-4 text-center">
                Aucun médicament n'est actuellement en attente de validation. Le catalogue est à jour !
              </p>
            ) : (
              <div className="divide-y divide-[#e6dab8]">
                {pendingMedicaments.map((med) => (
                  <div key={med.id_medicament} className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-base font-bold text-[#3a3826]">{med.nom}</span>
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          EN ATTENTE DE MODÉRATION
                        </span>
                      </div>
                      <p className="text-xs text-[#7a7458]">{med.description}</p>
                      <div className="text-xs text-[#557552] flex items-center gap-3 pt-1">
                        <span>Laboratoire : <strong>{med.fournisseur_nom}</strong></span>
                        <span>•</span>
                        <span>Catégorie : <strong>{med.categorie_libelle}</strong></span>
                        <span>•</span>
                        <span>Prix proposé HT : <strong>{Number(med.prix_ht).toFixed(2)} €</strong> ({Number(med.prix_ttc).toFixed(2)} € TTC)</span>
                        <span>•</span>
                        <span>Stock initial : <strong>{med.quantite_stock}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                      <button
                        onClick={() => handleModerateMed(med.id_medicament, 'REFUSE')}
                        className="px-3 py-1.5 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="Refuser le médicament"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Refuser</span>
                      </button>
                      <button
                        onClick={() => handleModerateMed(med.id_medicament, 'VALIDE')}
                        className="btn-art-primary text-xs px-4 py-1.5 flex items-center gap-1"
                        title="Valider et publier au catalogue"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Valider au catalogue</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tous les médicaments du catalogue */}
          <div className="bg-[#fffdf7] border border-[#e6dab8] rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-serif text-lg font-bold text-[#557552]">
              Toutes les références ({allMedicaments.length})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e6dab8] bg-[#fbf7ec]">
                    <th className="py-2.5 px-3 font-semibold text-[#7a7458]">Dénomination</th>
                    <th className="py-2.5 px-3 font-semibold text-[#7a7458]">Laboratoire</th>
                    <th className="py-2.5 px-3 font-semibold text-[#7a7458]">Catégorie</th>
                    <th className="py-2.5 px-3 font-semibold text-[#7a7458] text-right">Prix HT</th>
                    <th className="py-2.5 px-3 font-semibold text-[#7a7458] text-center">Statut</th>
                    <th className="py-2.5 px-3 font-semibold text-[#7a7458] text-right">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6dab8]">
                  {allMedicaments.map((m) => (
                    <tr key={m.id_medicament} className="hover:bg-[#fbf7ec]/30">
                      <td className="py-2 px-3 font-medium text-[#3a3826]">{m.nom}</td>
                      <td className="py-2 px-3 text-[#7a7458]">{m.fournisseur_nom}</td>
                      <td className="py-2 px-3 text-[#7a7458]">{m.categorie_libelle}</td>
                      <td className="py-2 px-3 text-right font-mono">{Number(m.prix_ht).toFixed(2)} €</td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            m.statut_validation === 'VALIDE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.statut_validation === 'EN_ATTENTE'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {m.statut_validation}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono">{m.quantite_stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ONGLET 2 : TABLEAU DE BORD & STATISTIQUES                             */}
      {/* ===================================================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <h2 className="font-serif text-2xl font-bold text-[#557552]">
            Indicateurs Stratégiques GSB
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#fffdf7] border-[1.5px] border-[#b8934a] rounded-[30px_6px_30px_6px] p-5 shadow-art-nouveau">
              <span className="text-xs font-semibold text-[#7a7458] block">Chiffre d'Affaires HT</span>
              <span className="font-serif text-2xl sm:text-3xl font-bold text-[#557552] block mt-1">
                {stats?.ca_total_ht?.toFixed(2) || '0.00'} €
              </span>
              <span className="text-[11px] text-[#7a7458] block mt-0.5">
                TTC : {stats?.ca_total_ttc?.toFixed(2) || '0.00'} €
              </span>
            </div>

            <div className="bg-[#fffdf7] border-[1.5px] border-[#b8934a] rounded-[30px_6px_30px_6px] p-5 shadow-art-nouveau">
              <span className="text-xs font-semibold text-[#7a7458] block">Commandes Passées</span>
              <span className="font-serif text-2xl sm:text-3xl font-bold text-[#b8934a] block mt-1">
                {stats?.total_commandes || 0}
              </span>
              <span className="text-[11px] text-[#7a7458] block mt-0.5">
                Réseau officines partenaires
              </span>
            </div>

            <div className="bg-[#fffdf7] border-[1.5px] border-[#b8934a] rounded-[30px_6px_30px_6px] p-5 shadow-art-nouveau">
              <span className="text-xs font-semibold text-[#7a7458] block">Spécialités Validées</span>
              <span className="font-serif text-2xl sm:text-3xl font-bold text-[#557552] block mt-1">
                {stats?.medicaments_valides || 0}
              </span>
              <span className="text-[11px] text-[#d49a8c] block mt-0.5">
                {stats?.medicaments_en_attente || 0} en attente de contrôle
              </span>
            </div>

            <div className="bg-[#fffdf7] border-[1.5px] border-[#b8934a] rounded-[30px_6px_30px_6px] p-5 shadow-art-nouveau">
              <span className="text-xs font-semibold text-[#7a7458] block">Laboratoires Agréés</span>
              <span className="font-serif text-2xl sm:text-3xl font-bold text-[#b8934a] block mt-1">
                {stats?.total_fournisseurs || 0}
              </span>
              <span className="text-[11px] text-[#7a7458] block mt-0.5">
                Fournisseurs industriels
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ONGLET 3 : GESTION DES COMMANDES                                      */}
      {/* ===================================================================== */}
      {activeTab === 'commandes' && (
        <div className="space-y-6">
          <h2 className="font-serif text-2xl font-bold text-[#557552]">
            Supervision des Commandes
          </h2>

          <div className="bg-[#fffdf7] border-[1.5px] border-[#b8934a] rounded-[30px_8px_30px_8px] overflow-hidden shadow-art-nouveau">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e6dab8] bg-[#fbf7ec]">
                    <th className="py-3 px-4 font-bold text-[#557552]">Numéro</th>
                    <th className="py-3 px-4 font-bold text-[#557552]">Date</th>
                    <th className="py-3 px-4 font-bold text-[#557552]">Client Officine</th>
                    <th className="py-3 px-4 font-bold text-[#557552] text-right">Total TTC</th>
                    <th className="py-3 px-4 font-bold text-[#557552] text-center">Statut Logistique</th>
                    <th className="py-3 px-4 font-bold text-[#557552] text-center">Action Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6dab8]">
                  {commandes.map((cmd) => (
                    <tr key={cmd.id_commande} className="hover:bg-[#fbf7ec]/30">
                      <td className="py-3 px-4 font-mono font-bold text-[#3a3826]">
                        <Link href={`/commandes/${cmd.id_commande}`} className="hover:text-[#557552] underline">
                          {cmd.numero_commande}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-[#7a7458]">
                        {new Date(cmd.date_commande).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#3a3826]">
                        {cmd.client_nom} ({cmd.type_profession || 'Pharmacien'})
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#557552]">
                        {Number(cmd.montant_total_ttc).toFixed(2)} €
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#fbf7ec] border border-[#e6dab8]">
                          {cmd.statut_commande}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <select
                          value={cmd.statut_commande}
                          onChange={(e) => handleUpdateOrderStatus(cmd.id_commande, e.target.value)}
                          className="input-art px-2 py-1 text-xs"
                        >
                          <option value="EN_ATTENTE">EN_ATTENTE</option>
                          <option value="VALIDEE">VALIDEE</option>
                          <option value="PREPARATION">PREPARATION</option>
                          <option value="EXPEDIEE">EXPEDIEE</option>
                          <option value="LIVREE">LIVREE</option>
                          <option value="ANNULEE">ANNULEE</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ONGLET 4 : GESTION DES UTILISATEURS                                   */}
      {/* ===================================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <h2 className="font-serif text-2xl font-bold text-[#557552]">
            Gestion des Utilisateurs Habilités
          </h2>

          <div className="bg-[#fffdf7] border-[1.5px] border-[#b8934a] rounded-[30px_8px_30px_8px] overflow-hidden shadow-art-nouveau">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e6dab8] bg-[#fbf7ec]">
                    <th className="py-3 px-4 font-bold text-[#557552]">Nom & Prénom</th>
                    <th className="py-3 px-4 font-bold text-[#557552]">Email</th>
                    <th className="py-3 px-4 font-bold text-[#557552]">Rôle</th>
                    <th className="py-3 px-4 font-bold text-[#557552]">RPPS</th>
                    <th className="py-3 px-4 font-bold text-[#557552] text-center">Statut</th>
                    <th className="py-3 px-4 font-bold text-[#557552] text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6dab8]">
                  {usersList.map((u) => (
                    <tr key={u.id_utilisateur} className="hover:bg-[#fbf7ec]/30">
                      <td className="py-3 px-4 font-semibold text-[#3a3826]">
                        {u.prenom} {u.nom}
                      </td>
                      <td className="py-3 px-4 text-[#7a7458] font-mono">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.role_code === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-[#e4eddc] text-[#557552]'
                        }`}>
                          {u.role_libelle || u.role_code}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[#7a7458]">
                        {u.numero_rpps || '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.actif ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {u.actif ? 'Actif' : 'Désactivé'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleUserActive(u.id_utilisateur, u.actif)}
                          className="btn-art-secondary text-[11px] px-2.5 py-1"
                        >
                          {u.actif ? 'Suspendre' : 'Activer'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modale d'ajout d'un médicament */}
      {showAddMedModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fffdf7] border-[1.5px] border-[#b8934a] rounded-[30px_8px_30px_8px] max-w-lg w-full p-6 space-y-4 shadow-2xl relative animate-fadeIn">
            <h2 className="font-serif text-2xl font-bold text-[#557552]">
              Ajouter un Médicament au Catalogue
            </h2>

            <form onSubmit={handleCreateMed} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[#7a7458] block mb-1">Dénomination commerciale</label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Doliprane 1000mg gélules"
                  value={newMedNom}
                  onChange={(e) => setNewMedNom(e.target.value)}
                  className="input-art w-full px-3 py-2"
                />
              </div>

              <div>
                <label className="font-semibold text-[#7a7458] block mb-1">Description & Posologie</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Boîte de 16 gélules..."
                  value={newMedDesc}
                  onChange={(e) => setNewMedDesc(e.target.value)}
                  className="input-art w-full px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#7a7458] block mb-1">Prix unitaire HT (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="2.50"
                    value={newMedPrixHt}
                    onChange={(e) => setNewMedPrixHt(e.target.value)}
                    className="input-art w-full px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#7a7458] block mb-1">Stock physique</label>
                  <input
                    type="number"
                    required
                    value={newMedStock}
                    onChange={(e) => setNewMedStock(e.target.value)}
                    className="input-art w-full px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#7a7458] block mb-1">Laboratoire</label>
                  <select
                    value={newMedFour}
                    onChange={(e) => setNewMedFour(e.target.value)}
                    className="input-art w-full px-3 py-2"
                  >
                    {fournisseurs.map((f) => (
                      <option key={f.id_fournisseur} value={f.id_fournisseur}>
                        {f.raison_sociale}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-[#7a7458] block mb-1">Catégorie</label>
                  <select
                    value={newMedCat}
                    onChange={(e) => setNewMedCat(e.target.value)}
                    className="input-art w-full px-3 py-2"
                  >
                    {categories.map((c) => (
                      <option key={c.id_categorie} value={c.id_categorie}>
                        {c.libelle}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMedModal(false)}
                  className="btn-art-secondary px-4 py-2"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-art-primary px-5 py-2"
                >
                  Créer et publier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
