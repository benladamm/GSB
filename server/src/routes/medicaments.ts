import { Router, Request, Response } from 'express';
import { query } from '../db';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * GET /api/medicaments
 * Recherche et filtrage du catalogue
 */
router.get('/medicaments', async (req: Request, res: Response) => {
  try {
    const search = ((req.query.search as string) || '').trim().toLowerCase();
    const categorieId = req.query.categorie as string;
    const fournisseurId = req.query.fournisseur as string;
    const statut = req.query.statut as string;

    const user = req.user;
    const isAdmin = user?.role === 'ADMIN';

    let targetStatut = 'VALIDE';
    if (isAdmin && statut) {
      targetStatut = statut;
    }

    let sql = `
      SELECT 
        m.*,
        c.libelle AS categorie_libelle,
        f.raison_sociale AS fournisseur_nom,
        f.ville AS fournisseur_ville
      FROM medicaments m
      INNER JOIN categories c ON m.id_categorie = c.id_categorie
      INNER JOIN fournisseurs f ON m.id_fournisseur = f.id_fournisseur
      WHERE f.actif = 1
    `;
    const params: any[] = [];

    if (!isAdmin || targetStatut !== 'ALL') {
      sql += ` AND m.statut_validation = ?`;
      params.push(targetStatut);
    }

    if (search) {
      sql += ` AND (LOWER(m.nom) LIKE ? OR LOWER(m.description) LIKE ? OR LOWER(c.libelle) LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    if (categorieId) {
      sql += ` AND m.id_categorie = ?`;
      params.push(parseInt(categorieId, 10));
    }

    if (fournisseurId) {
      sql += ` AND m.id_fournisseur = ?`;
      params.push(parseInt(fournisseurId, 10));
    }

    sql += ` ORDER BY m.nom ASC`;

    const medicaments = await query<any[]>(sql, params);

    return res.json({
      success: true,
      count: medicaments.length,
      medicaments,
    });
  } catch (error: any) {
    console.error('[Medicaments GET Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des médicaments depuis la base de données',
      details: error.message,
    });
  }
});

/**
 * GET /api/medicaments/:id
 * Détail d'un médicament
 */
router.get('/medicaments/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Identifiant invalide' });
    }

    const sql = `
      SELECT 
        m.*,
        c.libelle AS categorie_libelle,
        f.raison_sociale AS fournisseur_nom,
        f.email_contact AS fournisseur_email,
        f.telephone AS fournisseur_telephone,
        f.ville AS fournisseur_ville
      FROM medicaments m
      INNER JOIN categories c ON m.id_categorie = c.id_categorie
      INNER JOIN fournisseurs f ON m.id_fournisseur = f.id_fournisseur
      WHERE m.id_medicament = ?
    `;

    const rows = await query<any[]>(sql, [id]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Médicament non trouvé' });
    }

    return res.json({
      success: true,
      medicament: rows[0],
    });
  } catch (error: any) {
    console.error('[Medicament Detail Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du médicament',
      details: error.message,
    });
  }
});

/**
 * POST /api/medicaments
 * Ajout d'un nouveau médicament
 */
router.post('/medicaments', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const {
      nom,
      description,
      image_url,
      prix_ht,
      taux_tva = 2.10,
      quantite_stock,
      id_fournisseur,
      id_categorie,
    } = req.body;

    if (!nom || !prix_ht || !id_fournisseur || !id_categorie) {
      return res.status(400).json({
        success: false,
        error: 'Nom, prix HT, fournisseur et catégorie sont obligatoires',
      });
    }

    const parsedPrixHt = parseFloat(prix_ht);
    const parsedTva = parseFloat(taux_tva);
    const calculatedPrixTtc = parseFloat((parsedPrixHt * (1 + parsedTva / 100)).toFixed(2));
    const stock = parseInt(quantite_stock || '0', 10);

    const statut = user.role === 'ADMIN' ? 'VALIDE' : 'EN_ATTENTE';
    const adminId = user.role === 'ADMIN' ? user.id_utilisateur : null;

    const sql = `
      INSERT INTO medicaments (
        nom, description, image_url, prix_ht, prix_ttc, taux_tva, 
        quantite_stock, statut_validation, id_fournisseur, id_categorie, 
        id_admin_validateur, date_validation
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const resDb: any = await query(sql, [
      nom.trim(),
      description || '',
      image_url || '/images/produits/default.png',
      parsedPrixHt,
      calculatedPrixTtc,
      parsedTva,
      stock,
      statut,
      parseInt(id_fournisseur, 10),
      parseInt(id_categorie, 10),
      adminId,
      user.role === 'ADMIN' ? new Date() : null,
    ]);

    return res.status(201).json({
      success: true,
      message: user.role === 'ADMIN' ? 'Médicament ajouté et validé au catalogue' : 'Médicament soumis à validation',
      id_medicament: resDb.insertId,
      statut_validation: statut,
    });
  } catch (error: any) {
    console.error('[Medicaments POST Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de l’enregistrement du médicament',
      details: error.message,
    });
  }
});

/**
 * PATCH /api/medicaments/:id
 * Modification d'un médicament (stock, validation, etc.)
 */
router.patch('/medicaments/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Identifiant invalide' });
    }

    const {
      statut_validation,
      commentaire_validation,
      prix_ht,
      quantite_stock,
      nom,
      description,
    } = req.body;

    if (statut_validation && user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Droits insuffisants pour modérer un médicament',
      });
    }

    const updateFields: string[] = [];
    const updateParams: any[] = [];

    if (statut_validation) {
      updateFields.push('statut_validation = ?', 'id_admin_validateur = ?', 'date_validation = NOW()');
      updateParams.push(statut_validation, user.id_utilisateur);
    }
    if (commentaire_validation !== undefined) {
      updateFields.push('commentaire_validation = ?');
      updateParams.push(commentaire_validation);
    }
    if (prix_ht !== undefined) {
      const ht = parseFloat(prix_ht);
      const ttc = parseFloat((ht * 1.021).toFixed(2));
      updateFields.push('prix_ht = ?', 'prix_ttc = ?');
      updateParams.push(ht, ttc);
    }
    if (quantite_stock !== undefined) {
      updateFields.push('quantite_stock = ?');
      updateParams.push(parseInt(quantite_stock, 10));
    }
    if (nom) {
      updateFields.push('nom = ?');
      updateParams.push(nom.trim());
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateParams.push(description);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, error: 'Aucun champ à modifier' });
    }

    updateParams.push(id);
    const result: any = await query(
      `UPDATE medicaments SET ${updateFields.join(', ')} WHERE id_medicament = ?`,
      updateParams
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Médicament non trouvé' });
    }

    return res.json({
      success: true,
      message: 'Médicament mis à jour avec succès',
    });
  } catch (error: any) {
    console.error('[Medicaments PATCH Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du médicament',
      details: error.message,
    });
  }
});

/**
 * DELETE /api/medicaments/:id
 * Suppression d'un médicament (réservé aux admins)
 */
router.delete('/medicaments/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Identifiant invalide' });
    }

    const result: any = await query('DELETE FROM medicaments WHERE id_medicament = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Médicament introuvable' });
    }

    return res.json({
      success: true,
      message: 'Médicament supprimé du catalogue',
    });
  } catch (error: any) {
    console.error('[Medicaments DELETE Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression du médicament',
      details: error.message,
    });
  }
});

export default router;
