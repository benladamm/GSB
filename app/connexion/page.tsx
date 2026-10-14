'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/AppContext';
import { User, Lock, Mail, ArrowRight, ShieldCheck, Stethoscope, AlertCircle, CheckCircle } from 'lucide-react';

export default function ConnexionPage() {
  const router = useRouter();
  const { refreshUser } = useApp();

  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Écran de changement de mot de passe obligatoire au 1er login
  const [requirePasswordChange, setRequirePasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [changeLoading, setChangeLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const loginEmail = customEmail || email;
    const loginPass = customPass || motDePasse;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, mot_de_passe: loginPass }),
      });
      const data = await res.json();

      if (res.ok) {
        await refreshUser();
        if (data.user?.doit_changer_mdp) {
          setRequirePasswordChange(true);
        } else {
          if (data.user?.role === 'ADMIN') {
            router.push('/admin');
          } else {
            router.push('/catalogue');
          }
        }
      } else {
        setErrorMsg(data.error || 'Identifiants invalides');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Le nouveau mot de passe doit comporter au moins 6 caractères');
      return;
    }

    setChangeLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nouveau_mdp: newPassword }),
      });
      if (res.ok) {
        await refreshUser();
        router.push('/catalogue');
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setChangeLoading(false);
    }
  };

  // Raccourcis démo
  const loginDemoPharmacien = () => {
    setEmail('j.dupont@pharmacie-centrale.fr');
    setMotDePasse('admin123');
    handleLogin(undefined, 'j.dupont@pharmacie-centrale.fr', 'admin123');
  };

  const loginDemoAdmin = () => {
    setEmail('admin@gsb.fr');
    setMotDePasse('admin123');
    handleLogin(undefined, 'admin@gsb.fr', 'admin123');
  };

  return (
    <div className="max-w-[1040px] mx-auto px-5 py-12 flex justify-center">
      <div className="w-full max-w-md space-y-6">
        {/* En-tête */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#fbf7ec] border border-[#b8934a] mx-auto flex items-center justify-center text-[#557552]">
            <span className="text-2xl">✿</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#557552]">
            Espace Authentification
          </h1>
          <p className="text-xs text-[#7a7458]">
            Plateforme réservée aux pharmaciens et administrateurs GSB
          </p>
        </div>

        {/* Modalité : Changement obligatoire au 1er login */}
        {requirePasswordChange ? (
          <div className="bg-[#fffdf7] border-[1.5px] border-[#b8934a] rounded-[30px_8px_30px_8px] p-8 shadow-art-nouveau space-y-5 animate-fadeIn">
            <div className="space-y-1 text-center">
              <span className="text-xs font-bold text-[#b8934a] uppercase">Sécurité Obligatoire</span>
              <h2 className="font-serif text-xl font-bold text-[#557552]">
                Première connexion détectée
              </h2>
              <p className="text-xs text-[#7a7458]">
                Conformément au cahier des charges GSB, vous devez définir votre mot de passe personnel avant d'accéder au catalogue.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#7a7458] block mb-1">
                  Nouveau mot de passe sécurisé
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  className="input-art w-full px-3 py-2 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={changeLoading}
                className="btn-art-primary w-full py-2.5 text-xs font-bold"
              >
                {changeLoading ? 'Enregistrement...' : 'Valider mon mot de passe et continuer'}
              </button>
            </form>
          </div>
        ) : (
          /* Formulaire standard */
          <div className="bg-[#fffdf7] border-[1.5px] border-[#b8934a] rounded-[30px_8px_30px_8px] p-8 shadow-art-nouveau space-y-6">
            {/* Raccourcis Démo BTS SIO */}
            <div className="bg-[#fbf7ec] border border-[#e6dab8] rounded-xl p-3.5 space-y-2">
              <div className="text-[11px] font-bold text-[#557552] uppercase tracking-wider flex items-center gap-1">
                <span>⚡ Connexion Rapide (Comptes de Test) :</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={loginDemoPharmacien}
                  className="bg-[#fffdf7] hover:bg-[#e4eddc] border border-[#b8934a]/60 text-[#3a3826] p-2 rounded-lg text-left transition-colors flex flex-col"
                >
                  <span className="font-semibold text-xs flex items-center gap-1 text-[#557552]">
                    <Stethoscope className="w-3 h-3 text-[#b8934a]" />
                    Pharmacien
                  </span>
                  <span className="text-[10px] text-[#7a7458]">Jean Dupont</span>
                </button>

                <button
                  type="button"
                  onClick={loginDemoAdmin}
                  className="bg-[#fffdf7] hover:bg-[#e4eddc] border border-[#b8934a]/60 text-[#3a3826] p-2 rounded-lg text-left transition-colors flex flex-col"
                >
                  <span className="font-semibold text-xs flex items-center gap-1 text-[#557552]">
                    <ShieldCheck className="w-3 h-3 text-[#b8934a]" />
                    Admin DSI
                  </span>
                  <span className="text-[10px] text-[#7a7458]">Claire Bourdin</span>
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#7a7458] block mb-1">
                  Adresse email professionnelle
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#7a7458] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nom@pharmacie.fr"
                    className="input-art w-full pl-9 pr-3 py-2 text-xs"
                    id="login-email"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#7a7458] block mb-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#7a7458] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={motDePasse}
                    onChange={(e) => setMotDePasse(e.target.value)}
                    placeholder="••••••••"
                    className="input-art w-full pl-9 pr-3 py-2 text-xs"
                    id="login-password"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-art-primary w-full py-2.5 text-xs font-bold"
                  id="login-submit-button"
                >
                  {loading ? 'Vérification...' : 'Se connecter'}
                </button>
              </div>
            </form>

            <div className="text-center pt-2 border-t border-[#e6dab8] text-xs text-[#7a7458]">
              <span>Vous n'avez pas encore d'accès ? </span>
              <Link href="/inscription" className="text-[#557552] font-semibold hover:underline">
                Demander un compte professionnel
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
