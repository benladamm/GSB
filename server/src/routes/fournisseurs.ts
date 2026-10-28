import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

/**
 * GET /api/fournisseurs
 * Liste des laboratoires partenaires agréés
 */
router.get('/fournisseurs', async (req: Request, res: Response) => {
  try {
    const fournisseurs = await query<any[]>(
      'SELECT * FROM fournisseurs WHERE actif = 1 ORDER BY raison_sociale ASC'
    );
    return res.json({
      success: true,
      count: fournisseurs.length,
      fournisseurs,
    });
  } catch (error: any) {
    console.error('[Fournisseurs GET Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des laboratoires fournisseurs',
      details: error.message,
    });
  }
});

/**
 * POST /api/fournisseurs
 * Enregistrement d'un nouveau laboratoire partenaire
 */
router.post('/fournisseurs', async (req: Request, res: Response) => {
  try {
    const { raison_sociale, siret, email_contact, telephone, adresse, code_postal, ville } = req.body;

    if (!raison_sociale || !siret || !email_contact) {
      return res.status(400).json({
        success: false,
        error: 'Raison sociale, SIRET et email de contact requis',
      });
    }

    const sql = `
      INSERT INTO fournisseurs (raison_sociale, siret, email_contact, telephone, adresse, code_postal, ville, actif)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `;

    const result: any = await query(sql, [
      raison_sociale.trim(),
      siret.trim(),
      email_contact.trim().toLowerCase(),
      telephone || null,
      adresse || null,
      code_postal || null,
      ville || null,
    ]);

    return res.status(201).json({
      success: true,
      message: 'Laboratoire partenaire enregistré avec succès',
      id_fournisseur: result.insertId,
    });
  } catch (error: any) {
    console.error('[Fournisseurs POST Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de l’enregistrement du fournisseur',
      details: error.message,
    });
  }
});

export default router;

