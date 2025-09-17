import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
}

interface StoredUser extends PublicUser {
  passwordHash: string; // DEMO SOLO
}

const USERS_KEY = 'cp_users_v1';
const SESSION_KEY = 'cp_session_v1';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user$ = new BehaviorSubject<PublicUser | null>(this.loadSession());
  user$ = this._user$.asObservable();

  private hash(pwd: string) {
    return btoa(unescape(encodeURIComponent(pwd)));
  }
  private uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
  private loadUsers(): StoredUser[] {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; }
  }
  private saveUsers(u: StoredUser[]) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
  private saveSession(u: PublicUser | null) {
    if (u) localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    else localStorage.removeItem(SESSION_KEY);
    this._user$.next(u);
  }
  private loadSession(): PublicUser | null {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
  }
  // -------------------------------------------

  register(data: { name: string; email: string; password: string }) {
    const users = this.loadUsers();
    const exists = users.some(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (exists) return { ok: false, error: 'El correo ya está registrado' };

    const user: StoredUser = {
      id: this.uid(),
      name: data.name.trim(),
      email: data.email.trim(),
      passwordHash: this.hash(data.password),
    };
    users.push(user);
    this.saveUsers(users);
    this.saveSession({ id: user.id, name: user.name, email: user.email });
    return { ok: true };
  }

  login(email: string, password: string) {
    const users = this.loadUsers();
    const u = users.find(x => x.email.toLowerCase() === email.toLowerCase());
    if (!u) return { ok: false, error: 'Usuario no encontrado' };
    if (u.passwordHash !== this.hash(password)) return { ok: false, error: 'Contraseña incorrecta' };
    this.saveSession({ id: u.id, name: u.name, email: u.email });
    return { ok: true };
  }

  logout() { this.saveSession(null); }
}
