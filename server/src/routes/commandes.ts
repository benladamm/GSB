import { Router, Request, Response } from 'express';
import { query } from '../db';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * GET /api/commandes
 * Historique des commandes de l'utilisateur (ou toutes si administrateur)
 */
router.get('/commandes', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    let sql = `
      SELECT 
        c.id_commande,
        c.numero_commande,
        c.date_commande,
        c.statut_commande,
        c.montant_total_ht,
        c.montant_total_ttc,
        c.adresse_livraison,
        c.code_postal_livraison,
        c.ville_livraison,
        c.id_utilisateur,
        CONCAT(u.prenom, ' ', u.nom) AS client_nom,
        u.email AS client_email,
        u.type_profession,
        COUNT(lc.id_medicament) AS nb_articles
      FROM commandes c
      INNER JOIN utilisateurs u ON c.id_utilisateur = u.id_utilisateur
      LEFT JOIN lignes_commande lc ON c.id_commande = lc.id_commande
    `;
    const params: any[] = [];

    if (user.role !== 'ADMIN') {
      sql += ` WHERE c.id_utilisateur = ?`;
      params.push(user.id_utilisateur);
    }

    sql += ` GROUP BY c.id_commande ORDER BY c.date_commande DESC`;

    const commandes = await query<any[]>(sql, params);

    return res.json({
      success: true,
      count: commandes.length,
      commandes,
    });
  } catch (error: any) {
    console.error('[Commandes GET Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des commandes depuis la base de données',
      details: error.message,
    });
  }
});

/**
 * GET /api/commandes/:id
 * Détails complets d'une commande avec articles
 */
router.get('/commandes/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Identifiant commande invalide' });
    }

    const cmdRows = await query<any[]>(
      `SELECT c.*, CONCAT(u.prenom, ' ', u.nom) AS client_nom, u.email AS client_email, u.telephone AS client_telephone, u.type_profession, u.numero_rpps
       FROM commandes c
       INNER JOIN utilisateurs u ON c.id_utilisateur = u.id_utilisateur
       WHERE c.id_commande = ?`,
      [id]
    );

    if (!cmdRows || cmdRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Commande non trouvée' });
    }

    const commande = cmdRows[0];
    if (user.role !== 'ADMIN' && commande.id_utilisateur !== user.id_utilisateur) {
      return res.status(403).json({ success: false, error: 'Accès non autorisé à cette commande' });
    }

    const lignes = await query<any[]>(
      `SELECT 
         lc.id_medicament,
         lc.quantite_commandee,
         lc.prix_unitaire_ht,
         lc.taux_tva,
         m.nom AS medicament_nom,
         m.image_url,
         f.raison_sociale AS laboratoire_fournisseur,
         ROUND(lc.quantite_commandee * lc.prix_unitaire_ht, 2) AS total_ligne_ht,
         ROUND(lc.quantite_commandee * lc.prix_unitaire_ht * (1 + lc.taux_tva / 100), 2) AS total_ligne_ttc
       FROM lignes_commande lc
       INNER JOIN medicaments m ON lc.id_medicament = m.id_medicament
       INNER JOIN fournisseurs f ON m.id_fournisseur = f.id_fournisseur
       WHERE lc.id_commande = ?`,
      [id]
    );

    return res.json({
      success: true,
      commande: {
        ...commande,
        lignes,
      },
    });
  } catch (error: any) {
    console.error('[Commande Detail Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du chargement des détails de la commande',
      details: error.message,
    });
  }
});

/**
 * POST /api/commandes
 * Validation du panier et création de commande
 */
router.post('/commandes', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { adresse_livraison, code_postal_livraison, ville_livraison } = req.body;

    if (!adresse_livraison || !code_postal_livraison || !ville_livraison) {
      return res.status(400).json({
        success: false,
        error: 'Adresse de livraison complète requise (adresse, code postal, ville)',
      });
    }

    // Récupérer le panier actif
    const panierRows = await query<any[]>(
      'SELECT id_panier FROM paniers WHERE id_utilisateur = ?',
      [user.id_utilisateur]
    );
    if (!panierRows || panierRows.length === 0) {
      return res.status(400).json({ success: false, error: 'Panier introuvable' });
    }
    const idPanier = panierRows[0].id_panier;

    // Récupérer les articles du panier
    const lignesPanier = await query<any[]>(
      `SELECT lp.id_medicament, lp.quantite, m.nom, m.prix_ht, m.taux_tva, m.quantite_stock
       FROM lignes_panier lp
       INNER JOIN medicaments m ON lp.id_medicament = m.id_medicament
       WHERE lp.id_panier = ?`,
      [idPanier]
    );

    if (!lignesPanier || lignesPanier.length === 0) {
      return res.status(400).json({ success: false, error: 'Votre panier est vide' });
    }

    // Vérifier les stocks
    for (const item of lignesPanier) {
      if (item.quantite > item.quantite_stock) {
        return res.status(400).json({
          success: false,
          error: `Stock insuffisant pour le médicament "${item.nom}" (disponible : ${item.quantite_stock}, demandé : ${item.quantite})`,
        });
      }
    }

    let totalHt = 0;
    let totalTtc = 0;
    for (const line of lignesPanier) {
      const lineHt = Number(line.quantite) * Number(line.prix_ht);
      const lineTtc = lineHt * (1 + Number(line.taux_tva) / 100);
      totalHt += lineHt;
      totalTtc += lineTtc;
    }

    const orderNumber = `CMD-2026-${String(Date.now()).slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;

    const insertCmdSql = `
      INSERT INTO commandes (
        numero_commande, date_commande, statut_commande,
        montant_total_ht, montant_total_ttc, 
        adresse_livraison, code_postal_livraison, ville_livraison, 
        id_utilisateur
      )
      VALUES (?, NOW(), 'EN_ATTENTE', ?, ?, ?, ?, ?, ?)
    `;

    const cmdResult: any = await query(insertCmdSql, [
      orderNumber,
      parseFloat(totalHt.toFixed(2)),
      parseFloat(totalTtc.toFixed(2)),
      adresse_livraison.trim(),
      code_postal_livraison.trim(),
      ville_livraison.trim(),
      user.id_utilisateur,
    ]);
    const newOrderId = cmdResult.insertId;

    // Insérer les lignes et décrémenter le stock
    for (const line of lignesPanier) {
      await query(
        `INSERT INTO lignes_commande (id_commande, id_medicament, quantite_commandee, prix_unitaire_ht, taux_tva)
         VALUES (?, ?, ?, ?, ?)`,
        [newOrderId, line.id_medicament, line.quantite, line.prix_ht, line.taux_tva]
      );

      await query(
        `UPDATE medicaments SET quantite_stock = GREATEST(0, quantite_stock - ?) WHERE id_medicament = ?`,
        [line.quantite, line.id_medicament]
      );
    }

    // Vider le panier
    await query('DELETE FROM lignes_panier WHERE id_panier = ?', [idPanier]);

    return res.status(201).json({
      success: true,
      message: 'Commande validée et enregistrée avec succès',
      id_commande: newOrderId,
      numero_commande: orderNumber,
      montant_total_ht: parseFloat(totalHt.toFixed(2)),
      montant_total_ttc: parseFloat(totalTtc.toFixed(2)),
    });
  } catch (error: any) {
    console.error('[Commande Create Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de la commande dans la base de données',
      details: error.message,
    });
  }
});

/**
 * PATCH /api/commandes/:id
 * Modification du statut d'une commande (admin)
 */
router.patch('/commandes/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { statut_commande } = req.body;

    const allowedStatuses = ['EN_ATTENTE', 'VALIDEE', 'PREPARATION', 'EXPEDIEE', 'LIVREE', 'ANNULEE'];
    if (!allowedStatuses.includes(statut_commande)) {
      return res.status(400).json({ success: false, error: 'Statut de commande invalide' });
    }

    const result: any = await query(
      'UPDATE commandes SET statut_commande = ? WHERE id_commande = ?',
      [statut_commande, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Commande introuvable' });
    }

    return res.json({
      success: true,
      message: `Statut de la commande mis à jour : ${statut_commande}`,
    });
  } catch (error: any) {
    console.error('[Commande PATCH Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du statut de la commande',
      details: error.message,
    });
  }
});

export default router;
