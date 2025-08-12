// src/types/models.ts
export type Group = {
  id: string;
  name: string;
  type: 'galaxy' | 'system';
  parentId: string | null;
  color?: string | null;
  icon?: string | null;
  createdAt: number;
  updatedAt: number;
};

export type Planet = {
  id: string;
  fullName: string;
  jobTitle?: string | null;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  howWeMet?: string | null;
  commonGround?: string | null;
  notes?: string[];   // JSON
  keywords?: string[];// JSON
  socials?: { type: string; url: string }[]; // JSON
  emoji?: string | null; // 👈 NUEVO
  createdAt: number;
  updatedAt: number;
};