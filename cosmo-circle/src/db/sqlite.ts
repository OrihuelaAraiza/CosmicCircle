// src/db/sqlite.ts
import {
    openDatabaseSync,
    type SQLiteDatabase,
    type SQLiteBindParams,
  } from 'expo-sqlite';
  
  /** Singleton DB */
  let _db: SQLiteDatabase | null = null;
  export const getDB = (): SQLiteDatabase => {
    if (!_db) _db = openDatabaseSync('cosmo.db');
    return _db!;
  };
  
  /** SQL sin retorno de filas */
  export const run = async (
    sql: string,
    params: SQLiteBindParams = []            // ✅ nunca undefined
  ): Promise<void> => {
    await getDB().runAsync(sql, params);
  };
  
  /** Alias por compatibilidad */
  export const exec = run;
  
  /** Consulta con retorno de filas tipadas */
  export const query = async <T = any>(
    sql: string,
    params: SQLiteBindParams = []            // ✅ nunca undefined
  ): Promise<T[]> => {
    return await getDB().getAllAsync<T>(sql, params);
  };
  
  /** Transacción (todo-o-nada) */
  export const tx = async (fn: (db: SQLiteDatabase) => Promise<void>): Promise<void> => {
    const db = getDB();
    await db.withTransactionAsync(async () => {
      await fn(db);
    });
  };