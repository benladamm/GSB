import { Router, Request, Response } from 'express';
import { query } from '../db';
import { requireAdmin, hashPassword } from '../middleware/auth';

const router = Router();

/**
 * GET /api/admin/stats
 * Tableau de bord KPIs administrateur
 */
router.get('/admin/stats', requireAdmin, async (req: Request, res: Response) => {
  try {
    const cmdRows: any = await query(`
      SELECT 
        COUNT(*) as total_commandes,
        COALESCE(SUM(montant_total_ht), 0) as ca_total_ht,
        COALESCE(SUM(montant_total_ttc), 0) as ca_total_ttc
      FROM commandes
    `);

    const medRows: any = await query(`
      SELECT 
        COUNT(*) as total_medicaments,
        SUM(CASE WHEN statut_validation = 'EN_ATTENTE' THEN 1 ELSE 0 END) as medicaments_en_attente,
        SUM(CASE WHEN statut_validation = 'VALIDE' THEN 1 ELSE 0 END) as medicaments_valides
      FROM medicaments
    `);

    const userRows: any = await query(`
      SELECT COUNT(*) as total_utilisateurs FROM utilisateurs WHERE actif = 1
    `);

    const fourRows: any = await query(`
      SELECT COUNT(*) as total_fournisseurs FROM fournisseurs WHERE actif = 1
    `);

    const cmdStats = cmdRows[0] || {};
    const medStats = medRows[0] || {};
    const userStats = userRows[0] || {};
    const fourStats = fourRows[0] || {};

    return res.json({
      success: true,
      stats: {
        total_commandes: Number(cmdStats.total_commandes || 0),
        ca_total_ht: parseFloat(Number(cmdStats.ca_total_ht || 0).toFixed(2)),
        ca_total_ttc: parseFloat(Number(cmdStats.ca_total_ttc || 0).toFixed(2)),
        total_medicaments: Number(medStats.total_medicaments || 0),
        medicaments_en_attente: Number(medStats.medicaments_en_attente || 0),
        medicaments_valides: Number(medStats.medicaments_valides || 0),
        total_utilisateurs: Number(userStats.total_utilisateurs || 0),
        total_fournisseurs: Number(fourStats.total_fournisseurs || 0),
      },
    });
  } catch (error: any) {
    console.error('[Admin Stats Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques administratives',
      details: error.message,
    });
  }
});

/**
 * GET /api/admin/users
 * Liste des utilisateurs
 */
router.get('/admin/users', requireAdmin, async (req: Request, res: Response) => {
  try {
    const sql = `
      SELECT 
        u.id_utilisateur, u.nom, u.prenom, u.email, u.telephone, 
        u.adresse, u.code_postal, u.ville, u.type_profession, 
        u.numero_rpps, u.doit_changer_mdp, u.actif, u.created_at,
        r.code AS role_code, r.libelle AS role_libelle
      FROM utilisateurs u
      INNER JOIN roles r ON u.id_role = r.id_role
      ORDER BY u.created_at DESC
    `;
    const users = await query<any[]>(sql);

    return res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error: any) {
    console.error('[Admin Users GET Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des utilisateurs',
      details: error.message,
    });
  }
});

/**
 * POST /api/admin/users
 * Création d'un utilisateur par l'administrateur
 */
router.post('/admin/users', requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      nom,
      prenom,
      email,
      mot_de_passe = 'admin123',
      telephone,
      adresse,
      code_postal,
      ville,
      type_profession,
      numero_rpps,
      id_role = 2,
    } = req.body;

    if (!nom || !prenom || !email) {
      return res.status(400).json({
        success: false,
        error: 'Nom, prénom et email obligatoires',
      });
    }

    // Vérifier unicité email
    const existing = await query<any[]>('SELECT id_utilisateur FROM utilisateurs WHERE email = ?', [
      email.trim().toLowerCase(),
    ]);
    if (existing && existing.length > 0) {
      return res.status(409).json({ success: false, error: 'Cet email est déjà utilisé' });
    }

    const hashed = await hashPassword(mot_de_passe);

    const sql = `
      INSERT INTO utilisateurs (
        nom, prenom, email, mot_de_passe, telephone, adresse, code_postal, ville, 
        type_profession, numero_rpps, doit_changer_mdp, actif, id_role
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?)
    `;

    const resDb: any = await query(sql, [
      nom.trim(),
      prenom.trim(),
      email.trim().toLowerCase(),
      hashed,
      telephone || null,
      adresse || null,
      code_postal || null,
      ville || null,
      type_profession || 'Pharmacien',
      numero_rpps || null,
      parseInt(id_role, 10),
    ]);

    const newId = resDb.insertId;

    // Créer un panier actif
    await query('INSERT INTO paniers (id_utilisateur) VALUES (?)', [newId]);

    return res.status(201).json({
      success: true,
      message: 'Utilisateur créé par l\'administrateur avec succès',
      id_utilisateur: newId,
    });
  } catch (error: any) {
    console.error('[Admin User POST Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de l’utilisateur',
      details: error.message,
    });
  }
});

/**
 * PATCH /api/admin/users/:id
 * Modification d'un utilisateur par l'administrateur
 */
router.patch('/admin/users/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Identifiant invalide' });
    }

    const { actif, id_role, reset_mot_de_passe } = req.body;

    const updates: string[] = [];
    const queryParams: any[] = [];

    if (actif !== undefined) {
      updates.push('actif = ?');
      queryParams.push(actif ? 1 : 0);
    }
    if (id_role !== undefined) {
      updates.push('id_role = ?');
      queryParams.push(parseInt(id_role, 10));
    }
    if (reset_mot_de_passe) {
      const hashed = await hashPassword(reset_mot_de_passe);
      updates.push('mot_de_passe = ?', 'doit_changer_mdp = 1');
      queryParams.push(hashed);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'Aucun champ à modifier' });
    }

    queryParams.push(id);
    const result: any = await query(
      `UPDATE utilisateurs SET ${updates.join(', ')} WHERE id_utilisateur = ?`,
      queryParams
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });
    }

    return res.json({ success: true, message: 'Utilisateur mis à jour avec succès' });
  } catch (error: any) {
    console.error('[Admin User PATCH Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la modification de l’utilisateur',
      details: error.message,
    });
  }
});

export default router;
