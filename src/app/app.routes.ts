import { Routes } from '@angular/router';
import { HomeComponent } from './features/home.page';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Catedral Perfumes' },
  { path: '**', redirectTo: '' },
];