import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'gsb_pharmacie';

  console.log(`\n==================================================`);
  console.log(`  GSB PharmaLink - Initialisation de la BDD MySQL`);
  console.log(`==================================================`);
  console.log(`Connexion au serveur MySQL: ${host}:${port} (Utilisateur: ${user})`);

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true,
    });

    console.log('✔ Connecté avec succès au serveur MySQL.');

    const sqlPath = path.resolve(__dirname, '../schema_mysql.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Fichier SQL introuvable: ${sqlPath}`);
    }

    console.log(`Lecture du script SQL: ${sqlPath}`);
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('Exécution des instructions DDL et des données initiales...');
    await connection.query(sqlContent);

    console.log(`✔ Base de données '${database}' créée et initialisée avec succès !`);
    console.log(`✔ Tables créées : roles, utilisateurs, fournisseurs, categories, medicaments, paniers, lignes_panier, commandes, lignes_commande`);
    console.log(`✔ Vues créées   : v_catalogue_disponible, v_commandes_details`);
    console.log(`✔ Données initiales insérées (comptes tests, médicaments, fournisseurs).`);
    console.log(`==================================================\n`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base MySQL:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();
