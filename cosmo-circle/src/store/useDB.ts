// src/store/useDB.ts
import { create } from 'zustand';
import { getDB, run, query, tx } from '../db/sqlite';
import type { Group, Planet } from '../types/models';

const parseArray = <T,>(val: unknown, fallback: T[] = []): T[] => {
  if (Array.isArray(val)) return val as T[];
  if (typeof val === 'string') {
    try { return JSON.parse(val) as T[]; } catch { return fallback; }
  }
  return fallback;
};

const mapPlanetRow = (r: any): Planet & { groupIds?: string[] } => ({
  ...r,
  groupIds: (r.groupIdsCsv ? String(r.groupIdsCsv).split(',').filter(Boolean) : []),
  notes:    parseArray<string>(r.notes),
  keywords: parseArray<string>(r.keywords),
  socials:  parseArray<{ type: string; url: string }>(r.socials),
  emoji:    r.emoji ?? null,
});

type State = {
  ready: boolean;
  groups: Group[];
  planets: Planet[];

  loadAll: () => Promise<void>;

  // Groups
  createGroup: (g: Group) => Promise<void>;
  renameGroup: (groupId: string, newName: string) => Promise<void>;
  updateGroupStyle: (groupId: string, color?: string | null, icon?: string | null) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  getGalaxyDeleteSummary: (galaxyId: string) => Promise<{ systems: number; links: number }>;

  // Planets
  createPlanet: (p: Planet, groupIds: string[]) => Promise<void>;
  updatePlanet: (p: Planet, groupIds: string[]) => Promise<void>;
  deletePlanet: (planetId: string) => Promise<void>;
  unlinkPlanetFromGroup: (planetId: string, groupId: string) => Promise<void>;

  // Queries
  getPlanetsByGroup: (groupId: string) => Promise<(Planet & { groupIds?: string[] })[]>;
  getGroupsByPlanet: (planetId: string) => Promise<Group[]>;
  getPlanetsInGalaxyDeep: (galaxyId: string) => Promise<(Planet & { groupIds?: string[] })[]>;
  search: (q: string) => Promise<{ planets: Planet[]; groups: Group[] }>;
};

export const useDB = create<State>((set, get) => ({
  ready: false,
  groups: [],
  planets: [],

  loadAll: async () => {
    const groups = await query<Group>(`SELECT * FROM groups ORDER BY name ASC`);
    const rows = await query<any>(`SELECT * FROM planets ORDER BY fullName ASC`);
    const planets: Planet[] = rows.map(r => ({
      ...r,
      notes:    parseArray<string>(r.notes),
      keywords: parseArray<string>(r.keywords),
      socials:  parseArray<{ type: string; url: string }>(r.socials),
      emoji:    r.emoji ?? null,
    }));
    set({ groups, planets, ready: true });
  },

  // ===== Groups =====
  createGroup: async (g) => {
    await run(
      `INSERT INTO groups (id,name,type,parentId,color,icon,createdAt,updatedAt)
       VALUES (?,?,?,?,?,?,?,?)`,
      [g.id, g.name, g.type, g.parentId ?? null, g.color ?? null, g.icon ?? null, g.createdAt, g.updatedAt]
    );
    await get().loadAll();
  },

  renameGroup: async (groupId, newName) => {
    await run(`UPDATE groups SET name=?, updatedAt=? WHERE id=?`, [newName.trim(), Date.now(), groupId]);
    await get().loadAll();
  },

  updateGroupStyle: async (groupId, color, icon) => {
    await run(`UPDATE groups SET color=?, icon=?, updatedAt=? WHERE id=?`, [color ?? null, icon ?? null, Date.now(), groupId]);
    await get().loadAll();
  },

  deleteGroup: async (groupId) => {
    const g = (await query<Group>(`SELECT * FROM groups WHERE id=?`, [groupId]))[0];
    if (!g) return;

    if (g.type === 'system') {
      await tx(async (db) => {
        await db.runAsync(`DELETE FROM planet_groups WHERE groupId=?`, [groupId]);
        await db.runAsync(`DELETE FROM groups WHERE id=?`, [groupId]);
      });
    } else {
      const systems = await query<{ id: string }>(`SELECT id FROM groups WHERE parentId=?`, [groupId]);
      await tx(async (db) => {
        await db.runAsync(`DELETE FROM planet_groups WHERE groupId=?`, [groupId]);
        for (const s of systems) {
          await db.runAsync(`DELETE FROM planet_groups WHERE groupId=?`, [s.id]);
        }
        if (systems.length) {
          const placeholders = systems.map(() => '?').join(',');
          await db.runAsync(`DELETE FROM groups WHERE id IN (${placeholders})`, systems.map(s => s.id));
        }
        await db.runAsync(`DELETE FROM groups WHERE id=?`, [groupId]);
      });
    }
    await get().loadAll();
  },

  getGalaxyDeleteSummary: async (galaxyId) => {
    const [{ count: sysCount } = { count: 0 }] =
      await query<{ count: number }>(`SELECT COUNT(*) as count FROM groups WHERE parentId=?`, [galaxyId]);

    const sysIds = await query<{ id: string }>(`SELECT id FROM groups WHERE parentId=?`, [galaxyId]);
    const ids = [galaxyId, ...sysIds.map(s => s.id)];
    const placeholders = ids.map(() => '?').join(',');
    const [{ count: linkCount } = { count: 0 }] =
      await query<{ count: number }>(`SELECT COUNT(*) as count FROM planet_groups WHERE groupId IN (${placeholders})`, ids);

    return { systems: sysCount ?? 0, links: linkCount ?? 0 };
  },

  // ===== Planets =====
  createPlanet: async (p, groupIds) => {
    await tx(async (db) => {
      await db.runAsync(
        `INSERT INTO planets (id,fullName,jobTitle,company,phone,email,howWeMet,commonGround,notes,keywords,socials,emoji,createdAt,updatedAt)
         VALUES (?,?,?,?,?,?,?,?,?,?,?, ?, ?, ?)`,
        [
          p.id, p.fullName, p.jobTitle ?? null, p.company ?? null, p.phone ?? null, p.email ?? null,
          p.howWeMet ?? null, p.commonGround ?? null,
          JSON.stringify(p.notes ?? []), JSON.stringify(p.keywords ?? []), JSON.stringify(p.socials ?? []),
          p.emoji ?? null,
          p.createdAt, p.updatedAt
        ]
      );
      for (const gid of groupIds) {
        await db.runAsync(`INSERT OR IGNORE INTO planet_groups (planetId, groupId) VALUES (?,?)`, [p.id, gid]);
      }
    });
    await get().loadAll();
  },

  updatePlanet: async (p, groupIds) => {
    await tx(async (db) => {
      await db.runAsync(
        `UPDATE planets SET fullName=?, jobTitle=?, company=?, phone=?, email=?, howWeMet=?, commonGround=?, notes=?, keywords=?, socials=?, emoji=?, updatedAt=? WHERE id=?`,
        [
          p.fullName, p.jobTitle ?? null, p.company ?? null, p.phone ?? null, p.email ?? null,
          p.howWeMet ?? null, p.commonGround ?? null,
          JSON.stringify(p.notes ?? []), JSON.stringify(p.keywords ?? []), JSON.stringify(p.socials ?? []),
          p.emoji ?? null,
          Date.now(), p.id
        ]
      );
      await db.runAsync(`DELETE FROM planet_groups WHERE planetId=?`, [p.id]);
      for (const gid of groupIds) {
        await db.runAsync(`INSERT OR IGNORE INTO planet_groups (planetId, groupId) VALUES (?,?)`, [p.id, gid]);
      }
    });
    await get().loadAll();
  },

  deletePlanet: async (planetId) => {
    await tx(async (db) => {
      await db.runAsync(`DELETE FROM planet_groups WHERE planetId=?`, [planetId]);
      await db.runAsync(`DELETE FROM planets WHERE id=?`, [planetId]);
    });
    await get().loadAll();
  },

  unlinkPlanetFromGroup: async (planetId, groupId) => {
    await run(`DELETE FROM planet_groups WHERE planetId=? AND groupId=?`, [planetId, groupId]);
    await get().loadAll();
  },

  // ===== Queries =====
  getPlanetsByGroup: async (groupId) => {
    const rows = await query<any>(
      `SELECT 
         p.*,
         (SELECT GROUP_CONCAT(pg2.groupId, ',') 
            FROM planet_groups pg2 
            WHERE pg2.planetId = p.id) AS groupIdsCsv
       FROM planets p
       INNER JOIN planet_groups pg ON pg.planetId = p.id
       WHERE pg.groupId = ?
       GROUP BY p.id
       ORDER BY p.fullName ASC`,
      [groupId]
    );
    return rows.map(mapPlanetRow);
  },

  getGroupsByPlanet: async (planetId) => {
    return await query<Group>(
      `SELECT g.* FROM groups g
       JOIN planet_groups pg ON pg.groupId = g.id
       WHERE pg.planetId=?
       ORDER BY g.type ASC, g.name ASC`, [planetId]
    );
  },

  getPlanetsInGalaxyDeep: async (galaxyId) => {
    const sysRows = await query<{ id: string }>(`SELECT id FROM groups WHERE parentId=?`, [galaxyId]);
    const ids = [galaxyId, ...sysRows.map(s => s.id)];
    if (!ids.length) return [];

    const placeholders = ids.map(() => '?').join(',');
    const rows = await query<any>(
      `SELECT 
         p.*,
         (SELECT GROUP_CONCAT(pg2.groupId, ',') 
            FROM planet_groups pg2 
           WHERE pg2.planetId = p.id) AS groupIdsCsv
       FROM planets p
       JOIN planet_groups pg ON pg.planetId = p.id
       WHERE pg.groupId IN (${placeholders})
       GROUP BY p.id
       ORDER BY p.fullName ASC`,
      ids
    );

    return rows.map(mapPlanetRow);
  },

  search: async (q) => {
    const like = `%${q.toLowerCase()}%`;
    const rowsP = await query<any>(
      `SELECT 
         p.*,
         (SELECT GROUP_CONCAT(pg2.groupId, ',') FROM planet_groups pg2 WHERE pg2.planetId = p.id) AS groupIdsCsv
       FROM planets p
       WHERE LOWER(p.fullName) LIKE ? OR LOWER(p.company) LIKE ?
       ORDER BY p.fullName ASC`,
      [like, like]
    );
    const rowsG = await query<Group>(
      `SELECT * FROM groups WHERE LOWER(name) LIKE ? ORDER BY name ASC`,
      [like]
    );

    return {
      planets: rowsP.map(mapPlanetRow),
      groups: rowsG,
    };
  },
}));