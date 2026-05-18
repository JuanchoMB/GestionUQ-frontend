import { RolUsuario } from './enums';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  username: string;
  roles: string[];
}

export interface AuthMeResponse {
  id: string;
  username: string;
  nombreCompleto: string;
  identificacion: string;
  email?: string;
  authenticated: boolean;
  roles: RolUsuario[];
  activo: boolean;
}

export interface RefreshTokenRequest {
  token: string;
}

export interface RefreshTokenResponse {
  token: string;
  type: string;
  expiresIn: number;
}
export interface RegisterRequest {
  username: string;
  nombres: string;
  apellidos: string;
  email: string;
  identificacion: string;
  password: string;
}

