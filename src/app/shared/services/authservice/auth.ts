import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { User, normalizeUser } from './models/user';
import { AuthResponse, RegisterDto, LoginDto } from './models/auth';

const isBrowser = typeof window !== 'undefined';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  // estado de sesión
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  readonly user$ = this.currentUserSubject.asObservable();

  constructor() {
    // rehidrata el usuario guardado (para que el header no se pierda al refrescar)
    if (isBrowser) {
      const raw = localStorage.getItem('current_user');
      if (raw) {
        try { this.currentUserSubject.next(JSON.parse(raw)); } catch {}
      }
    }
  }

  register(dto: RegisterDto) {
    return this.http.post<AuthResponse>('/api/auth/register', dto).pipe(
      tap(res => this.setSession(res))
    );
  }

  login(dto: LoginDto) {
    return this.http.post<AuthResponse>('/api/auth/login', dto).pipe(
      tap(res => this.setSession(res))
    );
  }

  logout(): void {
    if (isBrowser) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('current_user');
    }
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return isBrowser ? !!localStorage.getItem('access_token') : false;
  }

  get token(): string | null {
    return isBrowser ? localStorage.getItem('access_token') : null;
  }

  private setSession(res: AuthResponse) {
    if (!res) return;
    const user = normalizeUser(res.user);
    if (isBrowser) {
      localStorage.setItem('access_token', res.access_token ?? '');
      localStorage.setItem('current_user', JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
  }
}
