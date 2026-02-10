import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'employees',
    loadComponent: () =>
      import('./features/employees/employees')
        .then(m => m.Employees)
  },
  { path: '', redirectTo: 'employees', pathMatch: 'full' }
];
