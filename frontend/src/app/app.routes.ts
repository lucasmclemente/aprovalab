import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login').then((m) => m.Login),
  },
  {
    path: 'cadastro',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/signup').then((m) => m.Signup),
  },
  {
    path: 'onboarding',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/onboarding').then((m) => m.Onboarding),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    children: [
      { path: '', loadComponent: () => import('./features/home/home').then((m) => m.Home) },
      {
        path: 'explorar',
        loadComponent: () => import('./features/meta/explorar').then((m) => m.Explorar),
      },
      {
        path: 'simulado',
        loadComponent: () =>
          import('./features/simulado/simulado-start').then((m) => m.SimuladoStart),
      },
      {
        path: 'simulado/:id',
        loadComponent: () => import('./features/simulado/simulado-run').then((m) => m.SimuladoRun),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
