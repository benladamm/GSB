import dotenv from 'dotenv';
import path from 'path';

// Charger le fichier .env depuis la racine du projet
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { createApp } from './app';
import { isDatabaseConnected } from './db';

const PORT = parseInt(process.env.API_PORT || process.env.PORT || '3001', 10);
const app = createApp();

async function startServer() {
  const dbStatus = await isDatabaseConnected();

  const server = app.listen(PORT, () => {
    console.log(`\n================================================================`);
    console.log(`  🚀 GSB PharmaLink - Serveur Express REST API (BTS SIO SLAM)`);
    console.log(`================================================================`);
    console.log(`  📡 Écoute sur        : http://localhost:${PORT}`);
    console.log(`  🏥 Endpoint Santé   : http://localhost:${PORT}/api/health`);
    console.log(`  💊 Catalogue         : http://localhost:${PORT}/api/medicaments`);
    console.log(`  🗄️  Base de données   : ${dbStatus.host}:${dbStatus.port}/${dbStatus.database}`);
    console.log(`  🔐 État MySQL        : ${dbStatus.connected ? '✔ CONNECTÉ (SSL)' : '❌ HORS-LIGNE (' + dbStatus.error + ')'}`);
    console.log(`================================================================\n`);
  });

  // Gestion de l'arrêt propre
  const shutdown = () => {
    console.log('\n[GSB Express API] Arrêt du serveur...');
    server.close(() => {
      console.log('[GSB Express API] Serveur arrêté avec succès.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('[GSB Express Server Startup Failed]', err);
  process.exit(1);
});

