'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from './AppContext';
import { ShoppingBag, User, ShieldCheck, LogOut, Menu, X, Pill, Database, Sparkles } from 'lucide-react';

export default function Navbar() {
  const { user, cartCount, logout } = useApp();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-[#fffdf7]/95 backdrop-blur-md border-b border-[#e6dab8] shadow-sm">
      <div className="max-w-[1040px] mx-auto px-5 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="group flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-[#fbf7ec] border border-[#b8934a] flex items-center justify-center text-[#557552] group-hover:scale-105 transition-transform shadow-sm">
            <span className="text-xl">✿</span>
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-2xl font-bold tracking-tight text-[#557552]">
              Pharma<span className="text-[#b8934a]">Link</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider text-[#7a7458] font-medium -mt-1">
              Galaxy Swiss Bourdin
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors hover:text-[#557552] ${
              isActive('/') ? 'text-[#557552] font-semibold border-b-2 border-[#b8934a] pb-1' : 'text-[#3a3826]'
            }`}
          >
            Accueil
          </Link>
          <Link
            href="/catalogue"
            className={`text-sm font-medium transition-colors hover:text-[#557552] ${
              isActive('/catalogue') ? 'text-[#557552] font-semibold border-b-2 border-[#b8934a] pb-1' : 'text-[#3a3826]'
            }`}
          >
            Catalogue
          </Link>
          <Link
            href="/fournisseurs"
            className={`text-sm font-medium transition-colors hover:text-[#557552] ${
              isActive('/fournisseurs') ? 'text-[#557552] font-semibold border-b-2 border-[#b8934a] pb-1' : 'text-[#3a3826]'
            }`}
          >
            Laboratoires
          </Link>

          {user && (
            <Link
              href="/commandes"
              className={`text-sm font-medium transition-colors hover:text-[#557552] ${
                isActive('/commandes') ? 'text-[#557552] font-semibold border-b-2 border-[#b8934a] pb-1' : 'text-[#3a3826]'
              }`}
            >
              Commandes
            </Link>
          )}

          {user?.role === 'ADMIN' && (
            <Link
              href="/admin"
              className={`text-sm font-semibold flex items-center gap-1.5 px-3 py-1 rounded-full border transition-colors ${
                isActive('/admin')
                  ? 'bg-[#557552] text-white border-[#557552]'
                  : 'bg-[#e4eddc] text-[#557552] border-[#b8934a]/40 hover:bg-[#557552] hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Administration</span>
            </Link>
          )}

          <Link
            href="/api-docs"
            className={`text-xs font-medium flex items-center gap-1 text-[#7a7458] hover:text-[#b8934a] px-2.5 py-1 rounded border border-[#e6dab8] ${
              isActive('/api-docs') ? 'bg-[#fbf7ec] border-[#b8934a] text-[#b8934a]' : ''
            }`}
            title="Spécification API REST BTS SIO SLAM"
          >
            <Database className="w-3.5 h-3.5" />
            <span>API REST</span>
          </Link>
        </nav>

        {/* Right Actions: Cart & User */}
        <div className="flex items-center gap-3">
          {/* Panier */}
          <Link
            href="/panier"
            id="nav-cart-button"
            className="relative p-2.5 rounded-full bg-[#fbf7ec] border border-[#b8934a]/60 text-[#3a3826] hover:bg-[#e4eddc] transition-all hover:scale-105"
            title="Voir mon panier"
          >
            <ShoppingBag className="w-5 h-5 text-[#557552]" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#b8934a] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

          {/* User Status / Login */}
          {user ? (
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[#e6dab8]">
              <div className="flex flex-col text-right">
                <span className="text-xs font-semibold text-[#3a3826] leading-tight">
                  {user.prenom} {user.nom}
                </span>
                <span className="text-[10px] text-[#7a7458]">
                  {user.role === 'ADMIN' ? 'Admin DSI' : user.type_profession || 'Pro de santé'}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-full text-[#7a7458] hover:text-[#d49a8c] hover:bg-[#fffdf7] transition-colors"
                title="Se déconnecter"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/connexion"
              className="btn-art-primary text-xs py-2 px-4 shadow-sm"
              id="nav-login-button"
            >
              <User className="w-3.5 h-3.5 mr-1.5" />
              <span>Connexion</span>
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[#3a3826] hover:bg-[#fbf7ec]"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#fffdf7] border-b border-[#e6dab8] px-5 py-4 space-y-3 animate-fadeIn">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-[#3a3826] hover:text-[#557552]"
          >
            Accueil
          </Link>
          <Link
            href="/catalogue"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-[#3a3826] hover:text-[#557552]"
          >
            Catalogue des médicaments
          </Link>
          <Link
            href="/fournisseurs"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-[#3a3826] hover:text-[#557552]"
          >
            Laboratoires partenaires
          </Link>
          {user && (
            <Link
              href="/commandes"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-[#3a3826] hover:text-[#557552]"
            >
              Historique des commandes
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-[#557552] font-semibold"
            >
              Espace Administrateur GSB
            </Link>
          )}
          <Link
            href="/api-docs"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-[#b8934a]"
          >
            Documentation API REST (BTS SIO)
          </Link>
          {user ? (
            <div className="pt-2 border-t border-[#e6dab8] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#3a3826]">{user.prenom} {user.nom}</p>
                <p className="text-[11px] text-[#7a7458]">{user.email}</p>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="text-xs text-[#d49a8c] font-semibold flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                Déconnexion
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-[#e6dab8]">
              <Link
                href="/connexion"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full btn-art-primary py-2 text-center text-xs"
              >
                Se connecter
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
