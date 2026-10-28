import { Router, Request, Response } from 'express';
import { query } from '../db';

const router = Router();

/**
 * GET /api/categories
 * Liste des catégories thérapeutiques
 */
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await query<any[]>('SELECT * FROM categories ORDER BY libelle ASC');
    return res.json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error: any) {
    console.error('[Categories GET Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des catégories',
      details: error.message,
    });
  }
});

export default router;

