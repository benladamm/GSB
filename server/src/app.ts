import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { authenticate } from './middleware/auth';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import categoriesRouter from './routes/categories';
import fournisseursRouter from './routes/fournisseurs';
import medicamentsRouter from './routes/medicaments';
import panierRouter from './routes/panier';
import commandesRouter from './routes/commandes';
import adminRouter from './routes/admin';

export function createApp(): Express {
  const app = express();

  // Configuration CORS pour autoriser le frontend Next.js (port 3000) et requêtes locales
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.NEXT_PUBLIC_APP_URL,
  ].filter(Boolean) as string[];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Autoriser les requêtes sans origine (comme Postman, curl ou scripts serveurs)
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, true); // En dev BTS SIO, autoriser
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    })
  );

  // Parsing des cookies HttpOnly (gsb_auth_token)
  app.use(cookieParser());

  // Parsing des requêtes JSON et URL-encoded
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Middleware d'extraction automatique du token JWT
  app.use(authenticate);

  // Journalisation concise des requêtes API (idéal pour la démonstration BTS SIO)
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const userTag = req.user ? `[User #${req.user.id_utilisateur} ${req.user.role}]` : '[Visiteur]';
      console.log(`[GSB Express API] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms) ${userTag}`);
    });
    next();
  });

  // Montage des routes sous le préfixe /api
  app.use('/api', healthRouter);
  app.use('/api', authRouter);
  app.use('/api', categoriesRouter);
  app.use('/api', fournisseursRouter);
  app.use('/api', medicamentsRouter);
  app.use('/api', panierRouter);
  app.use('/api', commandesRouter);
  app.use('/api', adminRouter);

  // Route d'accueil API
  app.get('/', (req: Request, res: Response) => {
    res.json({
      message: 'Bienvenue sur l’API REST Express GSB PharmaLink',
      curriculum: 'BTS SIO SLAM',
      documentation: '/api/health ou interface frontend /api-docs',
      status: 'En ligne',
    });
  });

  // Gestion des routes inconnues
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({
        success: false,
        error: `Point d’accès introuvable : ${req.method} ${req.originalUrl}`,
      });
    }
    next();
  });

  // Middleware de capture globale des erreurs
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('[GSB Express Server Error]', err);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur Express',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  });

  return app;
}

export default createApp;
