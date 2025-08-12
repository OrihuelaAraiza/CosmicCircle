export type GroupType = 'galaxy' | 'system';

export type Group = {
  id: string;
  name: string;
  type: GroupType;
  parentId?: string | null;
  // 🎨 Personalización
  color?: string | null; // hex (ej. #7C3AED)
  icon?: string | null;  // emoji o nombre Ionicons (prefijo ion:)
  createdAt: number;
  updatedAt: number;
};

export type SocialLink = { type: string; url: string };

export type Planet = {
  id: string;
  fullName: string;
  jobTitle?: string | null;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  howWeMet?: string | null;
  commonGround?: string | null;
  notes?: string[];     // serializado en DB
  keywords?: string[];  // serializado en DB
  socials?: SocialLink[]; // serializado en DB
  createdAt: number;
  updatedAt: number;
};