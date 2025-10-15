import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth';

export const authGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigate(['/auth/login']);
    return false;
  }
  const required = (route.data?.['roles'] as Array<'admin' | 'customer'>) ?? [];
  if (required.length === 0) return true; // solo requería login
  const user = auth.current;
  if (user && required.includes(user.role)) return true;

  router.navigate(['/'], { queryParams: { denied: required.join(',') } });
  return false;
};
