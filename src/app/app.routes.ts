import { Routes } from '@angular/router';
import { LoginPage } from './features/auth/login/login.page';
import { RegisterPage } from './features/auth/register/register.page';
import { HomeComponent } from './features/home.page';
import { CartPage } from './features/cart/cart.page';
import { CatalogPage } from './features/catalog/catalog.page/catalog.page';
import { ForgotPasswordPage } from './features/auth/forgot-password/forgot-password.page';
import { ResetPasswordPage } from './features/auth/forgot-password/reset-password.page';
import { ProfilePage } from './features/profile.users/profile.page';
import { authGuard } from './shared/services/authservice/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Catedral Perfumes' },

  { path: 'cart', component: CartPage, title: 'Carro' },
  { path: 'catalogo', component: CatalogPage, title: 'Catalogo' },

  { path: 'auth/login', component: LoginPage, title: 'Ingresar' },
  { path: 'auth/register', component: RegisterPage, title: 'Registro' },

  { path: 'auth/forgot-password', component: ForgotPasswordPage, title: 'Recuperar contraseña' },
  { path: 'reset-password', component: ResetPasswordPage, title: 'Restablecer contraseña' },

  {
    path: 'perfil',
    loadComponent: () =>
      import('./features/profile.users/profile.page').then(m => m.ProfilePage),
    canActivate: [authGuard],
    title: 'Mi perfil'
  },

  { path: '**', redirectTo: '' },
];
