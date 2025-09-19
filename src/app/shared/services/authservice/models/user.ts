
export type Role = 'admin' | 'customer';

// Lo que usamos en el front
export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

// Lo que puede venir del backend (id o _id)
export interface ApiUser {
  id?: string;
  _id?: string;
  email: string;
  name: string;
  role: Role;
}

// Helper para mapear respuesta del back → modelo del front
export const normalizeUser = (u: ApiUser): User => ({
  id: u.id ?? u._id ?? '',
  email: u.email,
  name: u.name,
  role: u.role,
});
