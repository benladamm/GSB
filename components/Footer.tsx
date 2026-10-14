import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#fffdf7] border-t border-[#b8934a]/40 mt-24">
      {/* Ornement supérieur centré */}
      <div className="flex justify-center -mt-3.5">
        <span className="bg-[#fffdf7] px-4 text-[#7a7458] text-base border border-[#e6dab8] rounded-full">
          ❦
        </span>
      </div>

      <div className="max-w-[1040px] mx-auto px-5 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1 : A propos */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="text-xl text-[#557552]">✿</span>
              <span className="font-serif text-xl font-bold text-[#557552]">
                Pharma<span className="text-[#b8934a]">Link</span>
              </span>
            </div>
            <p className="text-xs text-[#7a7458] leading-relaxed">
              Place de marché B2B officielle du laboratoire Galaxy Swiss Bourdin. Sécurisation des approvisionnements entre officines et laboratoires agréés.
            </p>
            <div className="pt-2">
              <span className="text-[11px] text-[#557552] bg-[#e4eddc] px-2.5 py-1 rounded-full font-medium inline-block">
                Conforme ANSM & RPPS
              </span>
            </div>
          </div>

          {/* Col 2 : Navigation */}
          <div className="space-y-3">
            <h4 className="font-serif text-base font-bold text-[#557552]">Navigation</h4>
            <ul className="space-y-2 text-xs text-[#7a7458]">
              <li>
                <Link href="/" className="hover:text-[#557552] transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/catalogue" className="hover:text-[#557552] transition-colors">
                  Catalogue officiel
                </Link>
              </li>
              <li>
                <Link href="/fournisseurs" className="hover:text-[#557552] transition-colors">
                  Laboratoires partenaires
                </Link>
              </li>
              <li>
                <Link href="/panier" className="hover:text-[#557552] transition-colors">
                  Bon de commande (Panier)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3 : Cadre BTS SIO */}
          <div className="space-y-3">
            <h4 className="font-serif text-base font-bold text-[#557552]">Cadre d'évaluation</h4>
            <ul className="space-y-2 text-xs text-[#7a7458]">
              <li>Épreuve E4 / E6 — BTS SIO SLAM</li>
              <li>Architecture RESTful Next.js & MySQL</li>
              <li>Authentification sécurisée JWT</li>
              <li>
                <Link href="/api-docs" className="text-[#b8934a] hover:underline font-semibold flex items-center gap-1">
                  Documentation API REST ➔
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4 : Sécurité & Mentions */}
          <div className="space-y-3">
            <h4 className="font-serif text-base font-bold text-[#557552]">Siège Administratif</h4>
            <p className="text-xs text-[#7a7458] leading-relaxed">
              Laboratoire Galaxy Swiss Bourdin<br />
              Direction des Systèmes d’Information<br />
              15 Rue de Paris, 75008 Paris<br />
              contact@gsb.fr
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-[#e6dab8] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#7a7458] gap-3">
          <p>© 2026 Laboratoire Galaxy Swiss Bourdin (GSB). Tous droits réservés.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-[#3a3826] cursor-pointer">Confidentialité médicale</span>
            <span className="hover:text-[#3a3826] cursor-pointer">Conditions générales B2B</span>
            <span className="text-[#b8934a]">Thème Art nouveau</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
