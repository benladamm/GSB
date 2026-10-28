'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/AppContext';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

export default function FournisseursPage() {
  const { user } = useApp();
  const [fournisseurs, setFournisseurs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Formulaire d'ajout de laboratoire
  const [raisonSociale, setRaisonSociale] = useState('');
  const [siret, setSiret] = useState('');
  const [emailContact, setEmailContact] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');
  const [codePostal, setCodePostal] = useState('');
  const [ville, setVille] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadFournisseurs();
  }, []);

  const loadFournisseurs = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/fournisseurs');
      const data = await res.json();
      if (res.ok && data.fournisseurs) {
        setFournisseurs(data.fournisseurs);
      } else {
        setErrorMsg(data.error || 'Erreur lors du chargement des laboratoires');
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg('Impossible de joindre le serveur API Express ou la base de données MySQL.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterLab = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/fournisseurs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raison_sociale: raisonSociale,
          siret,
          email_contact: emailContact,
          telephone,
          adresse,
          code_postal: codePostal,
          ville,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback('Laboratoire enregistré avec succès dans le réseau partenaire.');
        setShowModal(false);
        setRaisonSociale('');
        setSiret('');
        setEmailContact('');
        setTelephone('');
        setAdresse('');
        setCodePostal('');
        setVille('');
        await loadFournisseurs();
        setTimeout(() => setFeedback(null), 4000);
      } else {
        alert(data.error || 'Erreur lors de l\'enregistrement');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1040px] mx-auto px-5 py-10 space-y-8">
      {feedback && (
        <div className="bg-[#e4eddc] border border-[#6f9068] p-4 rounded-xl flex items-center gap-2 text-[#557552] text-xs font-semibold">
          <CheckCircle2 className="w-5 h-5" />
          <span>{feedback}</span>
        </div>
      )}

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#e6dab8] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fffdf7] border border-[#e6dab8] text-xs font-semibold text-[#557552] mb-1">
            <span>Réseau Industriel B2B</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#557552]">
            Laboratoires Pharmaceutiques Partenaires
          </h1>
          <p className="text-xs text-[#7a7458] mt-1">
            Producteurs, façonniers et distributeurs agréés alimentant la place de marché GSB
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-art-primary text-xs px-5 py-2.5 flex items-center gap-1.5"
          id="btn-add-lab"
        >
          <Plus className="w-4 h-4" />
          <span>Référencer un laboratoire</span>
        </button>
      </div>

      {/* Message d'erreur */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-300 text-red-800 p-4 rounded-xl text-xs flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <span className="font-bold">Erreur : </span>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {/* Grille des laboratoires */}
      {loading ? (
        <div className="text-center py-20 text-[#7a7458] text-sm">
          Chargement des laboratoires partenaires...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fournisseurs.map((four, idx) => {
            const isAlt = idx % 2 === 1;
            return (
              <div
                key={four.id_fournisseur}
                className={`${isAlt ? 'card-art-2' : 'card-art-1'} p-6 flex flex-col justify-between`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-full bg-[#fbf7ec] border border-[#b8934a] flex items-center justify-center text-[#557552]">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className="badge-stock text-[10px] px-2.5 py-0.5">
                      Agrément ANSM actif
                    </span>
                  </div>

                  <div>
                    <h3 className="font-serif text-xl font-bold text-[#3a3826]">
                      {four.raison_sociale}
                    </h3>
                    <p className="text-[11px] font-mono text-[#b8934a] mt-0.5">
                      SIRET : {four.siret}
                    </p>
                  </div>

                  <div className="text-xs text-[#7a7458] space-y-1.5 pt-2 border-t border-[#e6dab8]">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#557552]" />
                      <span>{four.email_contact}</span>
                    </div>
                    {four.telephone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#557552]" />
                        <span>{four.telephone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#557552]" />
                      <span>{four.adresse}, {four.code_postal} {four.ville}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-[#e6dab8]">
                  <Link
                    href={`/catalogue?fournisseur=${four.id_fournisseur}`}
                    className="text-xs font-semibold text-[#557552] hover:text-[#b8934a] flex items-center gap-1 group"
                  >
                    <span>Voir les spécialités au catalogue</span>
                    <span className="group-hover:translate-x-1 transition-transform">➔</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modale d'enregistrement d'un laboratoire */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fffdf7] border-[1.5px] border-[#b8934a] rounded-[30px_8px_30px_8px] max-w-lg w-full p-6 space-y-5 shadow-2xl relative animate-fadeIn">
            <div className="space-y-1">
              <h2 className="font-serif text-2xl font-bold text-[#557552]">
                Référencer un Laboratoire Partenaire
              </h2>
              <p className="text-xs text-[#7a7458]">
                Enregistrement officiel dans le référentiel des fournisseurs GSB
              </p>
            </div>

            <form onSubmit={handleRegisterLab} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[#7a7458] block mb-1">Raison Sociale</label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Laboratoires Pfizer France"
                  value={raisonSociale}
                  onChange={(e) => setRaisonSociale(e.target.value)}
                  className="input-art w-full px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#7a7458] block mb-1">Numéro SIRET (14 chiffres)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex : 41434567800034"
                    value={siret}
                    onChange={(e) => setSiret(e.target.value)}
                    className="input-art w-full px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#7a7458] block mb-1">Téléphone de contact</label>
                  <input
                    type="tel"
                    placeholder="Ex : 01 40 50 60 70"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    className="input-art w-full px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#7a7458] block mb-1">Email professionnel</label>
                <input
                  type="email"
                  required
                  placeholder="contact@laboratoire.fr"
                  value={emailContact}
                  onChange={(e) => setEmailContact(e.target.value)}
                  className="input-art w-full px-3 py-2"
                />
              </div>

              <div>
                <label className="font-semibold text-[#7a7458] block mb-1">Adresse administrative</label>
                <input
                  type="text"
                  placeholder="Ex : 12 Avenue des Sciences"
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                  className="input-art w-full px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#7a7458] block mb-1">Code Postal</label>
                  <input
                    type="text"
                    placeholder="75008"
                    value={codePostal}
                    onChange={(e) => setCodePostal(e.target.value)}
                    className="input-art w-full px-3 py-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#7a7458] block mb-1">Ville</label>
                  <input
                    type="text"
                    placeholder="Paris"
                    value={ville}
                    onChange={(e) => setVille(e.target.value)}
                    className="input-art w-full px-3 py-2"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-art-secondary px-4 py-2"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-art-primary px-5 py-2"
                >
                  {submitting ? 'Enregistrement...' : 'Enregistrer le laboratoire'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
