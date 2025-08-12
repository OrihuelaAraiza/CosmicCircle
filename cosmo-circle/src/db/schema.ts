// src/db/schema.ts
import { run } from './sqlite';

export async function createSchema(): Promise<void> {
  // groups
  await run(`
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,           -- 'galaxy' | 'system'
      parentId TEXT,
      color TEXT,                   -- opcional
      icon TEXT,                    -- opcional (emoji o nombre)
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
  `);

  // planets
  await run(`
    CREATE TABLE IF NOT EXISTS planets (
      id TEXT PRIMARY KEY NOT NULL,
      fullName TEXT NOT NULL,
      jobTitle TEXT,
      company TEXT,
      phone TEXT,
      email TEXT,
      howWeMet TEXT,
      commonGround TEXT,
      notes TEXT,                   -- JSON string
      keywords TEXT,                -- JSON string
      socials TEXT,                 -- JSON string
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
  `);

  // join table
  await run(`
    CREATE TABLE IF NOT EXISTS planet_groups (
      planetId TEXT NOT NULL,
      groupId  TEXT NOT NULL,
      PRIMARY KEY (planetId, groupId)
    );
  `);

  // migraciones idempotentes
  try { await run(`ALTER TABLE groups ADD COLUMN color TEXT`); } catch {}
  try { await run(`ALTER TABLE groups ADD COLUMN icon  TEXT`); } catch {}
}