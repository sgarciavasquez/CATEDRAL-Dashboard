import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

const isBrowser = typeof window !== 'undefined';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const hasToken = isBrowser && !!localStorage.getItem('access_token');
  if (!hasToken) {
    router.navigate(['/auth/login']);
    return false;
  }
  return true;
};
