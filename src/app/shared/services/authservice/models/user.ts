export interface ApiUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'customer';
}
export type Role = ApiUser['role'];

export type User = ApiUser;

export function normalizeUser(u: any): User {
  return {
    _id: u?._id ?? u?.id,
    id: u?.id ?? u?._id,
    name: u?.name ?? '',
    email: u?.email ?? '',
    phone: u?.phone ?? '',
    role: u?.role === 'admin' ? 'admin' : 'customer',
  };
}
