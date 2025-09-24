import { Routes } from '@angular/router';
import { LoginPage } from './features/auth/login/login.page';
import { RegisterPage } from './features/auth/register/register.page';
import { HomeComponent } from './features/home.page';
import { CartPage } from './features/cart/cart.page';
import { CatalogPage } from './features/catalog/catalog.page/catalog.page';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Catedral Perfumes' },

  { path: 'cart', component: CartPage, title: 'Carro' },
  { path: 'catalogo', component: CatalogPage, title: 'Catalogo' },

  { path: 'auth/login', component: LoginPage, title: 'Ingresar' },
  { path: 'auth/register', component: RegisterPage, title: 'Registro' },
  { path: '**', redirectTo: '' },
];
