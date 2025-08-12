// src/db/schema.ts
import { run } from './sqlite';

export async function createSchema() {
  // tablas base
  await run(`CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('galaxy','system')),
    parentId TEXT,
    color TEXT,
    icon TEXT,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  )`);

  await run(`CREATE TABLE IF NOT EXISTS planets (
    id TEXT PRIMARY KEY,
    fullName TEXT NOT NULL,
    jobTitle TEXT,
    company TEXT,
    phone TEXT,
    email TEXT,
    howWeMet TEXT,
    commonGround TEXT,
    notes TEXT,       -- JSON
    keywords TEXT,    -- JSON
    socials TEXT,     -- JSON
    emoji TEXT,       -- 👈 si ya existe no pasa nada
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  )`);

  await run(`CREATE TABLE IF NOT EXISTS planet_groups (
    planetId TEXT NOT NULL,
    groupId  TEXT NOT NULL,
    PRIMARY KEY (planetId, groupId)
  )`);

  // migración defensiva: añadir columna emoji si falta
  try {
    await run(`ALTER TABLE planets ADD COLUMN emoji TEXT`);
  } catch { /* existe: ignorar */ }
}