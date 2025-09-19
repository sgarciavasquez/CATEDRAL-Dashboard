// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LoginPage } from './features/auth/login/login.page';
import { RegisterPage } from './features/auth/register/register.page';
import { HomeComponent } from './features/home.page';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Catedral Perfumes' },
  { path: 'cart', component: HomeComponent, title: 'Carro' }, 
  { path: 'auth/login', component: LoginPage, title: 'Ingresar' },
  { path: 'auth/register', component: RegisterPage, title: 'Registro' },
  { path: '**', redirectTo: '' },
];
