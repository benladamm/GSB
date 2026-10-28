import { Router, Request, Response } from 'express';
import { query } from '../db';
import {
  hashPassword,
  comparePassword,
  signToken,
  AUTH_COOKIE_OPTIONS,
  COOKIE_NAME,
  requireAuth,
} from '../middleware/auth';

const router = Router();

/**
 * POST /api/auth/login
 * Connexion d'un utilisateur
 */
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, mot_de_passe } = req.body;

    if (!email || !mot_de_passe) {
      return res.status(400).json({
        success: false,
        error: 'Email et mot de passe obligatoires',
      });
    }

    const sql = `
      SELECT u.*, r.code AS role_code, r.libelle AS role_libelle
      FROM utilisateurs u
      INNER JOIN roles r ON u.id_role = r.id_role
      WHERE u.email = ? AND u.actif = 1
      LIMIT 1
    `;

    const rows = await query<any[]>(sql, [email.trim().toLowerCase()]);

    if (!rows || rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Identifiants invalides ou compte inactif',
      });
    }

    const user = rows[0];
    const isMatch = await comparePassword(mot_de_passe, user.mot_de_passe);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Identifiants invalides',
      });
    }

    const sessionPayload = {
      id_utilisateur: user.id_utilisateur,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role_code as 'ADMIN' | 'PRO_SANTE',
      type_profession: user.type_profession,
      numero_rpps: user.numero_rpps,
      doit_changer_mdp: Boolean(user.doit_changer_mdp),
    };

    const token = signToken(sessionPayload);

    res.cookie(COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);

    return res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: sessionPayload,
    });
  } catch (error: any) {
    console.error('[Auth Login Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la connexion à la base de données',
      details: error.message,
    });
  }
});

/**
 * POST /api/auth/register
 * Inscription d'un nouveau professionnel de santé
 */
router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const {
      nom,
      prenom,
      email,
      mot_de_passe,
      telephone,
      adresse,
      code_postal,
      ville,
      type_profession,
      numero_rpps,
    } = req.body;

    if (!nom || !prenom || !email || !mot_de_passe) {
      return res.status(400).json({
        success: false,
        error: 'Nom, prénom, email et mot de passe sont obligatoires',
      });
    }

    // Vérifier si l'email existe déjà
    const existing = await query<any[]>(
      'SELECT id_utilisateur FROM utilisateurs WHERE email = ?',
      [email.trim().toLowerCase()]
    );
    if (existing && existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Cette adresse email est déjà enregistrée',
      });
    }

    const hashedPassword = await hashPassword(mot_de_passe);

    // Rôle par défaut : 2 (PRO_SANTE)
    const insertSql = `
      INSERT INTO utilisateurs (
        nom, prenom, email, mot_de_passe, telephone, adresse, code_postal, 
        ville, type_profession, numero_rpps, doit_changer_mdp, actif, id_role
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, 2)
    `;

    const result: any = await query(insertSql, [
      nom.trim(),
      prenom.trim(),
      email.trim().toLowerCase(),
      hashedPassword,
      telephone || null,
      adresse || null,
      code_postal || null,
      ville || null,
      type_profession || 'Pharmacien',
      numero_rpps || null,
    ]);

    const newUserId = result.insertId;

    // Créer un panier actif pour ce nouvel utilisateur
    await query('INSERT INTO paniers (id_utilisateur) VALUES (?)', [newUserId]);

    const sessionPayload = {
      id_utilisateur: newUserId,
      email: email.trim().toLowerCase(),
      nom: nom.trim(),
      prenom: prenom.trim(),
      role: 'PRO_SANTE' as const,
      type_profession: type_profession || 'Pharmacien',
      numero_rpps: numero_rpps || null,
      doit_changer_mdp: false,
    };

    const token = signToken(sessionPayload);
    res.cookie(COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);

    return res.status(201).json({
      success: true,
      message: 'Compte professionnel créé avec succès',
      token,
      user: sessionPayload,
    });
  } catch (error: any) {
    console.error('[Auth Register Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la création du compte dans la base de données',
      details: error.message,
    });
  }
});

/**
 * GET /api/auth/me
 * Renvoie les informations de l'utilisateur connecté
 */
router.get('/auth/me', (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      authenticated: false,
      user: null,
      error: 'Non authentifié',
    });
  }

  return res.json({
    authenticated: true,
    user: req.user,
  });
});

/**
 * POST /api/auth/logout
 * Déconnexion de l'utilisateur
 */
router.post('/auth/logout', (req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  return res.json({
    success: true,
    message: 'Déconnexion réussie',
  });
});

/**
 * POST /api/auth/change-password
 * Modification du mot de passe
 */
router.post('/auth/change-password', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { nouveau_mdp } = req.body;

    if (!nouveau_mdp || nouveau_mdp.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Le nouveau mot de passe doit comporter au moins 6 caractères',
      });
    }

    const hashed = await hashPassword(nouveau_mdp);

    await query(
      'UPDATE utilisateurs SET mot_de_passe = ?, doit_changer_mdp = 0 WHERE id_utilisateur = ?',
      [hashed, user.id_utilisateur]
    );

    const updatedSession = {
      ...user,
      doit_changer_mdp: false,
    };

    const newToken = signToken(updatedSession);
    res.cookie(COOKIE_NAME, newToken, AUTH_COOKIE_OPTIONS);

    return res.json({
      success: true,
      message: 'Mot de passe mis à jour avec succès',
      user: updatedSession,
    });
  } catch (error: any) {
    console.error('[Auth Change Password Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du mot de passe',
      details: error.message,
    });
  }
});

export default router;

