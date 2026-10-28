import { Router, Request, Response } from 'express';
import { query } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * GET /api/panier
 * Récupère le panier actif de l'utilisateur
 */
router.get('/panier', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    // S'assurer que le panier existe
    let panierRows = await query<any[]>(
      'SELECT id_panier FROM paniers WHERE id_utilisateur = ?',
      [user.id_utilisateur]
    );

    let idPanier: number;
    if (!panierRows || panierRows.length === 0) {
      const createRes: any = await query('INSERT INTO paniers (id_utilisateur) VALUES (?)', [
        user.id_utilisateur,
      ]);
      idPanier = createRes.insertId;
    } else {
      idPanier = panierRows[0].id_panier;
    }

    const sqlLignes = `
      SELECT 
        lp.id_panier,
        lp.id_medicament,
        lp.quantite,
        lp.date_ajout,
        m.nom AS medicament_nom,
        m.image_url,
        m.prix_ht,
        m.prix_ttc,
        m.taux_tva,
        m.quantite_stock,
        f.raison_sociale AS fournisseur_nom,
        c.libelle AS categorie_libelle,
        ROUND(lp.quantite * m.prix_ht, 2) AS total_ligne_ht,
        ROUND(lp.quantite * m.prix_ttc, 2) AS total_ligne_ttc
      FROM lignes_panier lp
      INNER JOIN medicaments m ON lp.id_medicament = m.id_medicament
      INNER JOIN fournisseurs f ON m.id_fournisseur = f.id_fournisseur
      INNER JOIN categories c ON m.id_categorie = c.id_categorie
      WHERE lp.id_panier = ?
      ORDER BY lp.date_ajout DESC
    `;

    const lignes = await query<any[]>(sqlLignes, [idPanier]);

    const totalHt = lignes.reduce((acc, l) => acc + Number(l.total_ligne_ht), 0);
    const totalTtc = lignes.reduce((acc, l) => acc + Number(l.total_ligne_ttc), 0);
    const totalArticles = lignes.reduce((acc, l) => acc + Number(l.quantite), 0);

    return res.json({
      success: true,
      id_panier: idPanier,
      total_articles: totalArticles,
      montant_total_ht: parseFloat(totalHt.toFixed(2)),
      montant_total_ttc: parseFloat(totalTtc.toFixed(2)),
      montant_tva: parseFloat((totalTtc - totalHt).toFixed(2)),
      lignes,
    });
  } catch (error: any) {
    console.error('[Panier GET Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du chargement du panier depuis la base de données',
      details: error.message,
    });
  }
});

/**
 * POST /api/panier
 * Ajoute un médicament au panier
 */
router.post('/panier', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { id_medicament, quantite = 1 } = req.body;
    const qty = parseInt(quantite, 10);
    const medId = parseInt(id_medicament, 10);

    if (isNaN(medId) || isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Médicament et quantité valide (>0) requis',
      });
    }

    // Vérifier que le médicament existe
    const medRows = await query<any[]>('SELECT id_medicament FROM medicaments WHERE id_medicament = ?', [medId]);
    if (!medRows || medRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Médicament inexistant' });
    }

    // Trouver ou créer le panier
    let panierRows = await query<any[]>('SELECT id_panier FROM paniers WHERE id_utilisateur = ?', [
      user.id_utilisateur,
    ]);
    let idPanier: number;
    if (!panierRows || panierRows.length === 0) {
      const createRes: any = await query('INSERT INTO paniers (id_utilisateur) VALUES (?)', [
        user.id_utilisateur,
      ]);
      idPanier = createRes.insertId;
    } else {
      idPanier = panierRows[0].id_panier;
    }

    const upsertSql = `
      INSERT INTO lignes_panier (id_panier, id_medicament, quantite)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE quantite = quantite + VALUES(quantite)
    `;
    await query(upsertSql, [idPanier, medId, qty]);

    return res.json({ success: true, message: 'Article ajouté au panier' });
  } catch (error: any) {
    console.error('[Panier POST Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de l’ajout de l’article au panier',
      details: error.message,
    });
  }
});

/**
 * PUT /api/panier
 * Met à jour la quantité d'un article
 */
router.put('/panier', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { id_medicament, quantite } = req.body;
    const qty = parseInt(quantite, 10);
    const medId = parseInt(id_medicament, 10);

    if (isNaN(medId)) {
      return res.status(400).json({ success: false, error: 'Identifiant médicament invalide' });
    }

    const panierRows = await query<any[]>('SELECT id_panier FROM paniers WHERE id_utilisateur = ?', [
      user.id_utilisateur,
    ]);
    if (!panierRows || panierRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Panier introuvable' });
    }

    const idPanier = panierRows[0].id_panier;
    if (qty <= 0) {
      await query('DELETE FROM lignes_panier WHERE id_panier = ? AND id_medicament = ?', [
        idPanier,
        medId,
      ]);
    } else {
      await query(
        'UPDATE lignes_panier SET quantite = ? WHERE id_panier = ? AND id_medicament = ?',
        [qty, idPanier, medId]
      );
    }

    return res.json({ success: true, message: 'Quantité mise à jour' });
  } catch (error: any) {
    console.error('[Panier PUT Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la modification de la quantité',
      details: error.message,
    });
  }
});

/**
 * DELETE /api/panier
 * Supprime un article ou vide le panier
 */
router.delete('/panier', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const medIdParam = req.query.id_medicament as string;
    const clearAll = req.query.clear === 'true';

    const panierRows = await query<any[]>('SELECT id_panier FROM paniers WHERE id_utilisateur = ?', [
      user.id_utilisateur,
    ]);
    if (!panierRows || panierRows.length === 0) {
      return res.json({ success: true, message: 'Panier déjà vide' });
    }

    const idPanier = panierRows[0].id_panier;
    if (clearAll) {
      await query('DELETE FROM lignes_panier WHERE id_panier = ?', [idPanier]);
    } else if (medIdParam) {
      await query('DELETE FROM lignes_panier WHERE id_panier = ? AND id_medicament = ?', [
        idPanier,
        parseInt(medIdParam, 10),
      ]);
    }

    return res.json({ success: true, message: 'Panier mis à jour' });
  } catch (error: any) {
    console.error('[Panier DELETE Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression dans le panier',
      details: error.message,
    });
  }
});

export default router;

