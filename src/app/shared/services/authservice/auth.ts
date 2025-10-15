import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap, switchMap, map } from 'rxjs'; // <-- ojo switchMap
import { User, normalizeUser } from './models/user';
import { AuthResponse, RegisterDto, LoginDto } from './models/auth';
import { environment } from '../../../../environments/environment';

const isBrowser = typeof window !== 'undefined';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  readonly user$ = this.currentUserSubject.asObservable();

  constructor() {
    if (isBrowser) {
      const raw = localStorage.getItem('current_user');
      if (raw) { try { this.currentUserSubject.next(JSON.parse(raw)); } catch { } }
    }
  }

  /** LOGIN -> /auth/login */
  login(dto: LoginDto) {
    const payload = { email: dto.email.trim().toLowerCase(), password: dto.password };
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, payload)
      .pipe(tap(res => this.setSession(res)));
  }

  register(dto: RegisterDto) {
    const payload = {
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      password: dto.password,
      phone: normalizePhone(dto.phone),
      role: 'customer',
    };
    return this.http.post(`${environment.apiUrl}/users`, payload).pipe(
      switchMap(() => this.login({ email: payload.email, password: payload.password }))
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

  forgotPassword(email: string) {
    return this.http.post<{ message: string }>('/api/auth/forgot-password', { email });
  }

  resetPassword(newPassword: string, resetToken: string) {
    return this.http.put<{ message: string }>('/api/auth/reset-password', { newPassword, resetToken });
  }

  changePassword(oldPassword: string, newPassword: string) {
    // requiere estar logueado (el interceptor ya adjunta el Bearer)
    return this.http.put<{ message: string }>('/api/auth/change-password', { oldPassword, newPassword });
  }

  readonly role$ = this.user$.pipe(map(u => u?.role ?? null));
  readonly isAdmin$ = this.role$.pipe(map(r => r === 'admin'));
  readonly isCustomer$ = this.role$.pipe(map(r => r === 'customer'));
  readonly isLoggedIn$ = this.user$.pipe(map(Boolean));

  get current(): User | null { return this.currentUserSubject.value; }
  hasRole(role: 'admin' | 'customer'): boolean { return this.current?.role === role; }

}

function normalizePhone(raw: string): string {
  let phone = (raw ?? '').toString().trim();

  // quita espacios repetidos
  phone = phone.replace(/\s+/g, ' ').trim();

  if (phone.startsWith('+569')) {
    const tail = phone.replace(/^\+569\s*/, ''); // todo lo que viene después de +569 (quitando espacios)
    const digits = tail.replace(/\D/g, '').slice(-8); // últimos 8 dígitos
    return `+569 ${digits}`; // <-- con espacio => 13 chars
  }

  const digits = phone.replace(/\D/g, '').slice(-8);
  return `+569 ${digits}`;
}

