'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/AppContext';
import { Stethoscope, User, Mail, Lock, Phone, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

export default function InscriptionPage() {
  const router = useRouter();
  const { refreshUser } = useApp();

  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [typeProfession, setTypeProfession] = useState('Pharmacien titulaire');
  const [numeroRpps, setNumeroRpps] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');
  const [codePostal, setCodePostal] = useState('');
  const [ville, setVille] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom,
          prenom,
          email,
          mot_de_passe: motDePasse,
          type_profession: typeProfession,
          numero_rpps: numeroRpps,
          telephone,
          adresse,
          code_postal: codePostal,
          ville,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        await refreshUser();
        router.push('/catalogue');
      } else {
        setErrorMsg(data.error || 'Erreur lors de la création de compte');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1040px] mx-auto px-5 py-12 flex justify-center">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fffdf7] border border-[#e6dab8] text-xs font-semibold text-[#557552]">
            <span>Adhésion Réseau Médical GSB</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#557552]">
            Création de Compte Professionnel
          </h1>
          <p className="text-xs text-[#7a7458]">
            Vérification de l'habilitation RPPS pour commande en officine
          </p>
        </div>

        <div className="bg-[#fffdf7] border-[1.5px] border-[#b8934a] rounded-[30px_8px_30px_8px] p-8 shadow-art-nouveau space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-[#7a7458] block mb-1">Nom</label>
                <input
                  type="text"
                  required
                  placeholder="Dupont"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="input-art w-full px-3 py-2"
                />
              </div>
              <div>
                <label className="font-semibold text-[#7a7458] block mb-1">Prénom</label>
                <input
                  type="text"
                  required
                  placeholder="Jean"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  className="input-art w-full px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-[#7a7458] block mb-1">Profession</label>
                <select
                  value={typeProfession}
                  onChange={(e) => setTypeProfession(e.target.value)}
                  className="input-art w-full px-3 py-2"
                >
                  <option value="Pharmacien titulaire">Pharmacien titulaire</option>
                  <option value="Pharmacien adjoint">Pharmacien adjoint</option>
                  <option value="Médecin généraliste">Médecin généraliste</option>
                  <option value="Praticien hospitalier">Praticien hospitalier</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-[#7a7458] block mb-1">Numéro RPPS (11 chiffres)</label>
                <input
                  type="text"
                  placeholder="10002345678"
                  value={numeroRpps}
                  onChange={(e) => setNumeroRpps(e.target.value)}
                  className="input-art w-full px-3 py-2 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-[#7a7458] block mb-1">Email professionnel</label>
                <input
                  type="email"
                  required
                  placeholder="jean.dupont@pharmacie.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-art w-full px-3 py-2"
                />
              </div>
              <div>
                <label className="font-semibold text-[#7a7458] block mb-1">Téléphone</label>
                <input
                  type="tel"
                  placeholder="02 40 50 60 70"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  className="input-art w-full px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-[#7a7458] block mb-1">Mot de passe souhaité</label>
              <input
                type="password"
                required
                placeholder="Au moins 6 caractères"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                className="input-art w-full px-3 py-2"
              />
            </div>

            <div className="pt-2 border-t border-[#e6dab8] space-y-3">
              <span className="font-serif text-sm font-bold text-[#557552] block">
                Adresse de l'officine / cabinet
              </span>
              <div>
                <label className="font-semibold text-[#7a7458] block mb-1">Adresse postale</label>
                <input
                  type="text"
                  placeholder="42 Boulevard Victor Hugo"
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
                    placeholder="44000"
                    value={codePostal}
                    onChange={(e) => setCodePostal(e.target.value)}
                    className="input-art w-full px-3 py-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#7a7458] block mb-1">Ville</label>
                  <input
                    type="text"
                    placeholder="Nantes"
                    value={ville}
                    onChange={(e) => setVille(e.target.value)}
                    className="input-art w-full px-3 py-2"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={submitting}
                className="btn-art-primary w-full py-2.5 text-xs font-bold"
              >
                {submitting ? 'Création du compte...' : 'Créer mon compte professionnel'}
              </button>
            </div>
          </form>

          <div className="text-center pt-3 border-t border-[#e6dab8] text-xs text-[#7a7458]">
            <span>Déjà enregistré ? </span>
            <Link href="/connexion" className="text-[#557552] font-semibold hover:underline">
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
