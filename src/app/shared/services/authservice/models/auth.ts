import { ApiUser } from './user';
import type { Role } from './user';

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  phone: string;     // debe terminar en 13 chars (p.ej. +56912345678)
  role: Role;        // <-- requerido por tu CreateUserDto
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: ApiUser;
}

// útil si quisieras tipar la respuesta de /users
export type RegisterResponse = ApiUser;
