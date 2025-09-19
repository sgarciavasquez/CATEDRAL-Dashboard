import { ApiUser } from './user';

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  phone: string; // tu back valida 13 chars (+569XXXXXXXX)
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  user: ApiUser;
}

// opcional, por si quieres manejar estado local
export interface AuthState {
  user: ApiUser | null;
  token: string | null;
}
