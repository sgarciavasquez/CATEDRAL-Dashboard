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
import { ProductsAdminPage } from './features/home/admin/products/products.admin.pages';
import { ChatInboxComponent } from './chat/chat-inbox.component';
import { ChatThreadComponent } from './chat/chat-thread.component';


export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Catedral Perfumes' },

  { path: 'cart', component: CartPage, title: 'Carro' },
  { path: 'chat', component: ChatInboxComponent, title: 'Mensajes' },
  { path: 'chat/:id', component: ChatThreadComponent, title: 'Conversación' },
  
  { path: 'admin/chat', component: ChatInboxComponent, data: { admin: true }, title: 'Mensajes (Admin)' },
  { path: 'admin/chat/:id', component: ChatThreadComponent, data: { admin: true }, title: 'Conversación (Admin)' },

  {
    path: 'catalogo',
    loadComponent: () => import('./features/catalog/catalog.page/catalog.page')
      .then(m => m.CatalogPage),
  },
  {
    path: 'producto/:id',
    loadComponent: () => import('./features/catalog/product.info/product.info')
      .then(m => m.ProductInfo),
    data: { renderMode: 'client' } 
  },

  // auth
  { path: 'auth/login', component: LoginPage, title: 'Ingresar' },
  { path: 'auth/register', component: RegisterPage, title: 'Registro' },
  { path: 'auth/forgot-password', component: ForgotPasswordPage, title: 'Recuperar contraseña' },
  { path: 'reset-password', component: ResetPasswordPage, title: 'Restablecer contraseña' },

  // SOLO LOGUEADO (cualquier rol)
  {
    path: 'perfil',
    loadComponent: () => import('./features/profile.users/profile.page').then(m => m.ProfilePage),
    canActivate: [authGuard],
    title: 'Mi perfil',
  },

  {
    path: 'admin/pedidos',
    canActivate: [authGuard],
    data: { roles: ['admin'] },
    loadComponent: () =>
      import('./features/home/admin/orders/admin-orders.page')
        .then(m => m.AdminOrdersPage),
    title: 'Administrar pedidos',
  },

  {
    path: 'admin/products',
    canActivate: [authGuard],
    data: { roles: ['admin'] },
    loadComponent: () =>
      import('./features/home/admin/products/products.admin.pages')
        .then(m => m.ProductsAdminPage),
    title: 'Administrar productos',
  },

  { path: '**', redirectTo: '' },
];

