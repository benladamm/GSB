'use client';

import React, { useState } from 'react';
import { Database, Play, CheckCircle2, AlertCircle, Copy, Code, Layers, Server } from 'lucide-react';

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  category: string;
  description: string;
  authRequired: boolean;
  sampleBody?: any;
}

const ENDPOINTS: Endpoint[] = [
  {
    method: 'GET',
    path: '/api/health',
    category: 'Système & BDD',
    description: 'Vérification de l\'état de santé de l\'API et de la connexion au serveur MySQL local',
    authRequired: false,
  },
  {
    method: 'GET',
    path: '/api/categories',
    category: 'Catalogue',
    description: 'Liste des catégories thérapeutiques de médicaments',
    authRequired: false,
  },
  {
    method: 'GET',
    path: '/api/fournisseurs',
    category: 'Laboratoires',
    description: 'Liste des laboratoires pharmaceutiques partenaires agréés',
    authRequired: false,
  },
  {
    method: 'GET',
    path: '/api/medicaments?statut=VALIDE',
    category: 'Catalogue',
    description: 'Catalogue des médicaments validés (avec recherche ?search=... et filtre ?categorie=...)',
    authRequired: false,
  },
  {
    method: 'GET',
    path: '/api/medicaments/1',
    category: 'Catalogue',
    description: 'Détail d\'un médicament avec indications et laboratoire fournisseur',
    authRequired: false,
  },
  {
    method: 'POST',
    path: '/api/auth/login',
    category: 'Authentification',
    description: 'Authentification d\'un utilisateur (création session JWT et cookie HttpOnly)',
    authRequired: false,
    sampleBody: {
      email: 'j.dupont@pharmacie-centrale.fr',
      mot_de_passe: 'admin123',
    },
  },
  {
    method: 'GET',
    path: '/api/auth/me',
    category: 'Authentification',
    description: 'Informations de l\'utilisateur actuellement connecté depuis le token JWT',
    authRequired: true,
  },
  {
    method: 'GET',
    path: '/api/panier',
    category: 'Panier',
    description: 'Récupère le panier actif du professionnel avec calcul des totaux HT/TTC et TVA 2.10%',
    authRequired: true,
  },
  {
    method: 'POST',
    path: '/api/panier',
    category: 'Panier',
    description: 'Ajoute un médicament au panier ou incrémente la quantité existante',
    authRequired: true,
    sampleBody: {
      id_medicament: 1,
      quantite: 10,
    },
  },
  {
    method: 'GET',
    path: '/api/commandes',
    category: 'Commandes',
    description: 'Historique des commandes passées (propre à l\'utilisateur ou toutes si Admin)',
    authRequired: true,
  },
  {
    method: 'POST',
    path: '/api/commandes',
    category: 'Commandes',
    description: 'Valide le panier actif et génère une commande avec prix unitaires et TVA figés',
    authRequired: true,
    sampleBody: {
      adresse_livraison: '42 Boulevard Victor Hugo',
      code_postal_livraison: '44000',
      ville_livraison: 'Nantes',
    },
  },
  {
    method: 'GET',
    path: '/api/admin/stats',
    category: 'Administration',
    description: 'Statistiques globales (CA HT/TTC, commandes, modération en attente)',
    authRequired: true,
  },
  {
    method: 'GET',
    path: '/api/admin/users',
    category: 'Administration',
    description: 'Gestion des comptes utilisateurs et statuts d\'activation',
    authRequired: true,
  },
];

export default function ApiDocsPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint>(ENDPOINTS[0]);
  const [requestBody, setRequestBody] = useState<string>(
    ENDPOINTS[0].sampleBody ? JSON.stringify(ENDPOINTS[0].sampleBody, null, 2) : ''
  );
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<any | null>(null);
  const [executing, setExecuting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSelectEndpoint = (ep: Endpoint) => {
    setSelectedEndpoint(ep);
    setRequestBody(ep.sampleBody ? JSON.stringify(ep.sampleBody, null, 2) : '');
    setResponseStatus(null);
    setResponseData(null);
  };

  const handleExecute = async () => {
    setExecuting(true);
    setResponseStatus(null);
    setResponseData(null);

    try {
      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method) && requestBody) {
        options.body = requestBody;
      }

      const res = await fetch(selectedEndpoint.path, options);
      setResponseStatus(res.status);
      const data = await res.json();
      setResponseData(data);
    } catch (err: any) {
      setResponseStatus(500);
      setResponseData({ error: err.message });
    } finally {
      setExecuting(false);
    }
  };

  const getMethodBadge = (m: string) => {
    switch (m) {
      case 'GET':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded font-mono">GET</span>;
      case 'POST':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded font-mono">POST</span>;
      case 'PUT':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded font-mono">PUT</span>;
      case 'PATCH':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded font-mono">PATCH</span>;
      case 'DELETE':
        return <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded font-mono">DELETE</span>;
      default:
        return <span>{m}</span>;
    }
  };

  return (
    <div className="max-w-[1040px] mx-auto px-5 py-10 space-y-8">
      {/* En-tête */}
      <div className="border-b border-[#e6dab8] pb-6 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fffdf7] border border-[#e6dab8] text-xs font-semibold text-[#557552]">
          <Database className="w-3.5 h-3.5 text-[#b8934a]" />
          <span>Épreuve E4 / E6 — BTS SIO SLAM</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#557552]">
          Documentation & Console Interactive API REST
        </h1>
        <p className="text-xs text-[#7a7458] max-w-2xl">
          Toutes les fonctionnalités de la place de marché GSB PharmaLink sont exposées sous forme d'une API RESTful normalisée (JSON, verbes HTTP, codes d'état standardisés).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Liste des routes (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-serif text-sm font-bold text-[#557552]">
              Points d'Entrée API ({ENDPOINTS.length})
            </span>
            <span className="text-[11px] text-[#7a7458]">Cliquez pour tester</span>
          </div>

          <div className="bg-[#fffdf7] border-[1.5px] border-[#b8934a] rounded-[24px_6px_24px_6px] p-2 space-y-1 max-h-[600px] overflow-y-auto shadow-art-nouveau">
            {ENDPOINTS.map((ep, idx) => {
              const isSelected = selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`w-full p-2.5 rounded-xl text-left transition-colors flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-[#fbf7ec] border border-[#b8934a]'
                      : 'hover:bg-[#fbf7ec]/50 border border-transparent'
                  }`}
                >
                  <div className="space-y-0.5 overflow-hidden">
                    <div className="flex items-center gap-2">
                      {getMethodBadge(ep.method)}
                      <span className="font-mono text-xs font-semibold text-[#3a3826] truncate">
                        {ep.path}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#7a7458] line-clamp-1">{ep.description}</p>
                  </div>
                  {ep.authRequired && (
                    <span className="text-[9px] text-[#b8934a] font-bold border border-[#b8934a]/40 px-1.5 py-0.5 rounded flex-shrink-0">
                      AUTH
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Console de test interactif (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#fffdf7] border-[1.5px] border-[#b8934a] rounded-[30px_8px_30px_8px] p-6 shadow-art-nouveau space-y-5">
            {/* Titre endpoint sélectionné */}
            <div className="space-y-2 border-b border-[#e6dab8] pb-4">
              <div className="flex items-center gap-2">
                {getMethodBadge(selectedEndpoint.method)}
                <span className="font-mono text-sm font-bold text-[#557552]">
                  {selectedEndpoint.path}
                </span>
              </div>
              <p className="text-xs text-[#7a7458]">{selectedEndpoint.description}</p>
              <div className="flex items-center gap-3 text-[11px] text-[#7a7458] pt-1">
                <span>Catégorie : <strong>{selectedEndpoint.category}</strong></span>
                <span>•</span>
                <span>
                  Authentification : {selectedEndpoint.authRequired ? (
                    <strong className="text-[#b8934a]">Requise (Session / JWT)</strong>
                  ) : (
                    <span className="text-emerald-700">Publique</span>
                  )}
                </span>
              </div>
            </div>

            {/* Corps de requête si POST / PUT / PATCH */}
            {['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method) && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#7a7458] flex items-center justify-between">
                  <span>Corps de la Requête (JSON Payload) :</span>
                  <span className="font-mono text-[10px] text-[#b8934a]">Content-Type: application/json</span>
                </label>
                <textarea
                  rows={4}
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  className="input-art w-full p-3 font-mono text-xs bg-[#fbf7ec]"
                />
              </div>
            )}

            {/* Bouton d'exécution */}
            <div>
              <button
                onClick={handleExecute}
                disabled={executing}
                className="btn-art-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                id="btn-execute-api-test"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{executing ? 'Appel de l\'API en cours...' : 'Exécuter la requête HTTP'}</span>
              </button>
            </div>

            {/* Affichage de la réponse */}
            {responseStatus !== null && (
              <div className="space-y-2 pt-2 border-t border-[#e6dab8] animate-fadeIn">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#7a7458]">Code d'état HTTP :</span>
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                        responseStatus >= 200 && responseStatus < 300
                          ? 'bg-emerald-100 text-emerald-800'
                          : responseStatus === 401
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {responseStatus} {responseStatus === 200 ? 'OK' : responseStatus === 201 ? 'Created' : responseStatus === 401 ? 'Unauthorized' : ''}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(responseData, null, 2));
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="text-[11px] text-[#557552] hover:text-[#b8934a] flex items-center gap-1 font-semibold"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copied ? 'Copié !' : 'Copier JSON'}</span>
                  </button>
                </div>

                <div className="bg-[#3a3826] text-[#fffdf7] rounded-xl p-4 overflow-x-auto max-h-72">
                  <pre className="font-mono text-xs leading-relaxed">
                    {JSON.stringify(responseData, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
