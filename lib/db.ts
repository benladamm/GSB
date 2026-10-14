import mysql, { Pool } from 'mysql2/promise';

// Configuration du pool de connexions MySQL
let pool: Pool | null = null;
let isMysqlAvailable: boolean | null = null;

export function getMysqlPool(): Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'gsb_pharmacie',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
  }
  return pool;
}

// Jeu de données en mémoire miroir du script SQL (Secours / Fallback si MySQL local n'est pas encore démarré)
export const fallbackStore = {
  roles: [
    { id_role: 1, code: 'ADMIN', libelle: 'Administrateur GSB', description: 'Gestion complète de la plateforme' },
    { id_role: 2, code: 'PRO_SANTE', libelle: 'Professionnel de santé', description: 'Médecins, pharmaciens' },
  ],
  utilisateurs: [
    {
      id_utilisateur: 1,
      nom: 'Bourdin',
      prenom: 'Claire',
      email: 'admin@gsb.fr',
      mot_de_passe: '$2a$10$7Zrqx8E8G29ZJj1yU.O5dOPR4.fHqK.QWb9c5Qh1kQe3Vj6m3L0vS', // 'admin123'
      telephone: '0140203040',
      adresse: '15 Rue de Paris',
      code_postal: '75008',
      ville: 'Paris',
      type_profession: 'Direction DSI',
      numero_rpps: null,
      doit_changer_mdp: 0,
      actif: 1,
      id_role: 1,
      role_code: 'ADMIN',
      role_libelle: 'Administrateur GSB',
    },
    {
      id_utilisateur: 2,
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'j.dupont@pharmacie-centrale.fr',
      mot_de_passe: '$2a$10$7Zrqx8E8G29ZJj1yU.O5dOPR4.fHqK.QWb9c5Qh1kQe3Vj6m3L0vS', // 'admin123'
      telephone: '0240506070',
      adresse: '42 Boulevard Victor Hugo',
      code_postal: '44000',
      ville: 'Nantes',
      type_profession: 'Pharmacien',
      numero_rpps: '10002345678',
      doit_changer_mdp: 0,
      actif: 1,
      id_role: 2,
      role_code: 'PRO_SANTE',
      role_libelle: 'Professionnel de santé',
    },
    {
      id_utilisateur: 3,
      nom: 'Martin',
      prenom: 'Sophie',
      email: 'dr.martin@cabinet-medical.fr',
      mot_de_passe: '$2a$10$7Zrqx8E8G29ZJj1yU.O5dOPR4.fHqK.QWb9c5Qh1kQe3Vj6m3L0vS', // 'admin123'
      telephone: '0478901234',
      adresse: '18 Rue de la République',
      code_postal: '69002',
      ville: 'Lyon',
      type_profession: 'Médecin généraliste',
      numero_rpps: '10008765432',
      doit_changer_mdp: 0,
      actif: 1,
      id_role: 2,
      role_code: 'PRO_SANTE',
      role_libelle: 'Professionnel de santé',
    },
  ],
  fournisseurs: [
    {
      id_fournisseur: 1,
      raison_sociale: 'Laboratoires Sanofi Pasteur',
      siret: '39882471400018',
      email_contact: 'contact@sanofi.fr',
      telephone: '0157632000',
      adresse: '54 Rue La Boétie',
      code_postal: '75008',
      ville: 'Paris',
      actif: 1,
    },
    {
      id_fournisseur: 2,
      raison_sociale: 'Biogaran Génériques',
      siret: '40513075200029',
      email_contact: 'service-clients@biogaran.fr',
      telephone: '0146978000',
      adresse: '15 Boulevard Charles de Gaulle',
      code_postal: '92700',
      ville: 'Colombes',
      actif: 1,
    },
    {
      id_fournisseur: 3,
      raison_sociale: 'Sandoz Laboratoires',
      siret: '41434567800034',
      email_contact: 'contact@sandoz.fr',
      telephone: '0149644800',
      adresse: '49 Avenue Georges Pompidou',
      code_postal: '92300',
      ville: 'Levallois-Perret',
      actif: 1,
    },
  ],
  categories: [
    { id_categorie: 1, libelle: 'Antalgiques & Antipyrétiques', description: 'Médicaments traitant la douleur et la fièvre' },
    { id_categorie: 2, libelle: 'Antibiotiques', description: 'Substances antimicrobiennes d\'origine naturelle ou synthétique' },
    { id_categorie: 3, libelle: 'Anti-inflammatoires', description: 'Traitements des affections inflammatoires articulaires ou musculaires' },
    { id_categorie: 4, libelle: 'Cardiologie & Vasculaire', description: 'Traitements de l\'hypertension artérielle et des troubles cardiaques' },
  ],
  medicaments: [
    {
      id_medicament: 1,
      nom: 'Paracétamol GSB 1000mg',
      description: 'Boîte de 16 gélules sous blister pour le traitement symptomatique des douleurs légères à modérées.',
      image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60',
      prix_ht: 1.80,
      prix_ttc: 1.84,
      taux_tva: 2.10,
      quantite_stock: 1200,
      statut_validation: 'VALIDE',
      id_fournisseur: 2,
      fournisseur_nom: 'Biogaran Génériques',
      id_categorie: 1,
      categorie_libelle: 'Antalgiques & Antipyrétiques',
      commentaire_validation: 'Produit conforme aux spécifications ANSM',
    },
    {
      id_medicament: 2,
      nom: 'Amoxicilline 500mg',
      description: 'Antibiotique à large spectre du groupe des aminopénicillines. 12 gélules.',
      image_url: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=500&auto=format&fit=crop&q=60',
      prix_ht: 3.40,
      prix_ttc: 3.47,
      taux_tva: 2.10,
      quantite_stock: 650,
      statut_validation: 'VALIDE',
      id_fournisseur: 1,
      fournisseur_nom: 'Laboratoires Sanofi Pasteur',
      id_categorie: 2,
      categorie_libelle: 'Antibiotiques',
      commentaire_validation: 'Validation réglementaire ANSM',
    },
    {
      id_medicament: 3,
      nom: 'Ibuprofène 400mg',
      description: 'Anti-inflammatoire non stéroïdien (AINS). Boîte de 20 comprimés enrobés.',
      image_url: 'https://images.unsplash.com/photo-1550572017-ed21f649ca30?w=500&auto=format&fit=crop&q=60',
      prix_ht: 2.50,
      prix_ttc: 2.55,
      taux_tva: 2.10,
      quantite_stock: 890,
      statut_validation: 'VALIDE',
      id_fournisseur: 2,
      fournisseur_nom: 'Biogaran Génériques',
      id_categorie: 3,
      categorie_libelle: 'Anti-inflammatoires',
      commentaire_validation: 'Validé pour commande officine',
    },
    {
      id_medicament: 4,
      nom: 'Ramipril 5mg',
      description: 'Inhibiteur de l\'enzyme de conversion pour l\'hypertension artérielle. Boîte de 30 comprimés.',
      image_url: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&auto=format&fit=crop&q=60',
      prix_ht: 5.60,
      prix_ttc: 5.72,
      taux_tva: 2.10,
      quantite_stock: 420,
      statut_validation: 'VALIDE',
      id_fournisseur: 3,
      fournisseur_nom: 'Sandoz Laboratoires',
      id_categorie: 4,
      categorie_libelle: 'Cardiologie & Vasculaire',
      commentaire_validation: 'Validé catalogue cardiologie',
    },
    {
      id_medicament: 5,
      nom: 'Azithromycine 250mg',
      description: 'Macrolide antibactérien. Boîte de 6 comprimés pelliculés.',
      image_url: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=60',
      prix_ht: 6.20,
      prix_ttc: 6.33,
      taux_tva: 2.10,
      quantite_stock: 300,
      statut_validation: 'EN_ATTENTE',
      id_fournisseur: 1,
      fournisseur_nom: 'Laboratoires Sanofi Pasteur',
      id_categorie: 2,
      categorie_libelle: 'Antibiotiques',
      commentaire_validation: 'En attente de relecture par l\'administrateur GSB',
    },
  ],
  paniers: [
    {
      id_panier: 1,
      id_utilisateur: 2,
      lignes: [
        { id_medicament: 1, quantite: 50 },
        { id_medicament: 3, quantite: 25 },
      ],
    },
    {
      id_panier: 2,
      id_utilisateur: 3,
      lignes: [],
    },
  ],
  commandes: [
    {
      id_commande: 1,
      numero_commande: 'CMD-2026-0001',
      date_commande: '2026-09-28T09:30:00Z',
      statut_commande: 'VALIDEE',
      montant_total_ht: 170.00,
      montant_total_ttc: 173.57,
      adresse_livraison: '42 Boulevard Victor Hugo',
      code_postal_livraison: '44000',
      ville_livraison: 'Nantes',
      id_utilisateur: 2,
      client_nom: 'Jean Dupont',
      client_email: 'j.dupont@pharmacie-centrale.fr',
      type_profession: 'Pharmacien',
      lignes: [
        {
          id_medicament: 1,
          medicament_nom: 'Paracétamol GSB 1000mg',
          laboratoire_fournisseur: 'Biogaran Génériques',
          quantite_commandee: 50,
          prix_unitaire_ht: 1.80,
          taux_tva: 2.10,
          total_ligne_ht: 90.00,
          total_ligne_ttc: 91.89,
        },
        {
          id_medicament: 2,
          medicament_nom: 'Amoxicilline 500mg',
          laboratoire_fournisseur: 'Laboratoires Sanofi Pasteur',
          quantite_commandee: 20,
          prix_unitaire_ht: 3.40,
          taux_tva: 2.10,
          total_ligne_ht: 68.00,
          total_ligne_ttc: 69.43,
        },
        {
          id_medicament: 3,
          medicament_nom: 'Ibuprofène 400mg',
          laboratoire_fournisseur: 'Biogaran Génériques',
          quantite_commandee: 5,
          prix_unitaire_ht: 2.40,
          taux_tva: 2.10,
          total_ligne_ht: 12.00,
          total_ligne_ttc: 12.25,
        },
      ],
    },
  ],
};

// Fonction d'exécution de requêtes avec auto-détection et bascule transparente
export async function query<T = any>(sql: string, params: any[] = []): Promise<T> {
  const p = getMysqlPool();
  try {
    const [rows] = await p.execute(sql, params);
    isMysqlAvailable = true;
    return rows as T;
  } catch (error: any) {
    if (isMysqlAvailable === null || !isMysqlAvailable) {
      console.warn(`[GSB MySQL Notification] Impossible de contacter MySQL (${error.code || error.message}). Utilisation des données sécurisées intégrées.`);
      isMysqlAvailable = false;
    }
    throw error;
  }
}

export async function isDatabaseConnected(): Promise<{ connected: boolean; host?: string; database?: string; error?: string }> {
  try {
    const p = getMysqlPool();
    await p.query('SELECT 1');
    return {
      connected: true,
      host: process.env.DB_HOST || '127.0.0.1',
      database: process.env.DB_NAME || 'gsb_pharmacie',
    };
  } catch (err: any) {
    return {
      connected: false,
      host: process.env.DB_HOST || '127.0.0.1',
      database: process.env.DB_NAME || 'gsb_pharmacie',
      error: err.message,
    };
  }
}
