import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function initDatabase() {
  const host = process.env.DB_HOST || 'db.dimdams.com';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'u_1793203056233_2rocd4';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'db_1793203056233_2rocd4';
  const isSsl = process.env.DB_SSL === 'true' || (host !== '127.0.0.1' && host !== 'localhost');

  console.log(`\n==================================================`);
  console.log(`  GSB PharmaLink - Initialisation de la BDD MySQL`);
  console.log(`==================================================`);
  console.log(`Connexion au serveur MySQL: ${host}:${port} (BDD: ${database}, Utilisateur: ${user})`);

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database,
      ssl: isSsl ? { rejectUnauthorized: false } : undefined,
      multipleStatements: true,
    });

    console.log('✔ Connecté avec succès au serveur MySQL.');

    const sqlPath = path.resolve(__dirname, '../schema_mysql.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Fichier SQL introuvable: ${sqlPath}`);
    }

    console.log(`Lecture du script SQL: ${sqlPath}`);
    let sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Adapter le script pour l'exécution directe dans la base de données distante
    sqlContent = sqlContent.replace(/DROP DATABASE[^;]+;/gi, '');
    sqlContent = sqlContent.replace(/CREATE DATABASE[^;]+;/gi, '');
    sqlContent = sqlContent.replace(/USE [^;]+;/gi, '');

    // Harmonisation des mots de passe bcrypt
    sqlContent = sqlContent.replace(
      /\$2y\$10\$e0MYzXyjpJS7Pd0RVvHwHe1m42\/xS9T8M6gD1zL1\.n4r2m9vL\/9b2/g,
      '$2a$10$7Zrqx8E8G29ZJj1yU.O5dOPR4.fHqK.QWb9c5Qh1kQe3Vj6m3L0vS'
    );

    console.log('Exécution des instructions DDL et des données initiales...');
    await connection.query(sqlContent);

    console.log(`✔ Base de données '${database}' configurée avec succès !`);
    console.log(`✔ Tables : roles, utilisateurs, fournisseurs, categories, medicaments, paniers, lignes_panier, commandes, lignes_commande`);
    console.log(`✔ Vues   : v_catalogue_disponible, v_commandes_details`);
    console.log(`✔ Données initiales insérées.`);
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
