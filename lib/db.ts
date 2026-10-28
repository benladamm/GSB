import mysql, { Pool } from 'mysql2/promise';

// Configuration du pool de connexions MySQL (DimDams Cloud distant SSL)
let pool: Pool | null = null;

export function getMysqlPool(): Pool {
  if (!pool) {
    const isSsl = process.env.DB_SSL === 'true' || (process.env.DB_HOST && process.env.DB_HOST !== '127.0.0.1' && process.env.DB_HOST !== 'localhost');

    pool = mysql.createPool({
      host: process.env.DB_HOST || 'db.dimdams.com',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'u_1793203056233_2rocd4',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'db_1793203056233_2rocd4',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      ssl: isSsl ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

/**
 * Fonction d'exécution de requêtes sans aucun fallback en dur.
 * En cas d'erreur de base de données, l'exception est levée immédiatement.
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<T> {
  const p = getMysqlPool();
  try {
    const [rows] = await p.execute(sql, params);
    return rows as T;
  } catch (error: any) {
    console.error(`[GSB MySQL Error] ${error.code || error.message} - SQL: ${sql}`);
    throw error;
  }
}

export async function isDatabaseConnected(): Promise<{ connected: boolean; host?: string; database?: string; error?: string }> {
  try {
    const p = getMysqlPool();
    await p.query('SELECT 1');
    return {
      connected: true,
      host: process.env.DB_HOST || 'db.dimdams.com',
      database: process.env.DB_NAME || 'db_1793203056233_2rocd4',
    };
  } catch (err: any) {
    return {
      connected: false,
      host: process.env.DB_HOST || 'db.dimdams.com',
      database: process.env.DB_NAME || 'db_1793203056233_2rocd4',
      error: err.message,
    };
  }
}
