// src/db/seed.ts
import { run, query, tx } from './sqlite';

const uid = () => Math.random().toString(36).slice(2) + '-' + Date.now();

/** Inserta algunos datos de ejemplo si no hay grupos aún */
export async function seedIfEmpty(): Promise<void> {
  // ¿Ya hay grupos?
  const rows = await query<{ count: number }>('SELECT COUNT(*) AS count FROM groups');
  const count = rows[0]?.count ?? 0;
  if (count > 0) return;

  const now = Date.now();

  const gTrabajo = { id: uid(), name: 'Trabajo', type: 'galaxy' as const, parentId: null, color: '#60A5FA', icon: '🛰️', createdAt: now, updatedAt: now };
  const gUni     = { id: uid(), name: 'Universidad Panamá', type: 'galaxy' as const, parentId: null, color: '#A78BFA', icon: '📚', createdAt: now, updatedAt: now };
  const sDis     = { id: uid(), name: 'Diseño', type: 'system'  as const, parentId: gUni.id, color: '#22D3EE', icon: '✨', createdAt: now, updatedAt: now };

  await tx(async (db) => {
    // grupos
    await db.runAsync(
      `INSERT INTO groups (id,name,type,parentId,color,icon,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?)`,
      [gTrabajo.id, gTrabajo.name, gTrabajo.type, gTrabajo.parentId, gTrabajo.color, gTrabajo.icon, now, now]
    );
    await db.runAsync(
      `INSERT INTO groups (id,name,type,parentId,color,icon,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?)`,
      [gUni.id, gUni.name, gUni.type, gUni.parentId, gUni.color, gUni.icon, now, now]
    );
    await db.runAsync(
      `INSERT INTO groups (id,name,type,parentId,color,icon,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?)`,
      [sDis.id, sDis.name, sDis.type, sDis.parentId, sDis.color, sDis.icon, now, now]
    );

    // planeta demo
    const p = {
      id: uid(),
      fullName: 'Mariana López',
      company: 'Acme',
      jobTitle: 'UI Designer',
      phone: null,
      email: null,
      howWeMet: 'Evento de diseño 2024',
      commonGround: 'Interés por tipografía',
      notes: JSON.stringify(['Le gusta la foto analógica']),
      keywords: JSON.stringify(['diseño', 'figma']),
      socials: JSON.stringify([{ type: 'linkedin', url: 'https://linkedin.com/in/demo' }]),
      createdAt: now,
      updatedAt: now,
    };

    await db.runAsync(
      `INSERT INTO planets (id,fullName,jobTitle,company,phone,email,howWeMet,commonGround,notes,keywords,socials,createdAt,updatedAt)
       VALUES (?,?,?,?,?,?,?,?,?,?,?, ?, ?)`,
      [
        p.id, p.fullName, p.jobTitle, p.company, p.phone, p.email,
        p.howWeMet, p.commonGround, p.notes, p.keywords, p.socials, p.createdAt, p.updatedAt
      ]
    );

    // vínculos: al sistema y a la galaxia
    await db.runAsync(`INSERT OR IGNORE INTO planet_groups (planetId, groupId) VALUES (?,?)`, [p.id, gUni.id]);
    await db.runAsync(`INSERT OR IGNORE INTO planet_groups (planetId, groupId) VALUES (?,?)`, [p.id, sDis.id]);
  });
}