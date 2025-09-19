import { HttpInterceptorFn } from '@angular/common/http';

const isBrowser = typeof window !== 'undefined';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api')) return next(req);
  const token = isBrowser ? localStorage.getItem('access_token') : null;
  return next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req);
};
