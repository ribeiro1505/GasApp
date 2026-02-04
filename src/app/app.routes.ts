import {Routes} from '@angular/router';
import {HomePage} from './pages/home/home.page';

/**
 * Note:
 * We use eager `component` registration for `HomePage` instead of
 * `loadComponent` to avoid the runtime "Dynamic require of './home.page-*.js'
 * is not supported" error that occurs with the current tooling setup.
 * For this simple route tree the eager import is perfectly fine and keeps
 * the routing configuration straightforward.
 */
export const routes: Routes = [
  {
    path: '',
    component: HomePage,
    children: [
      {
        path: 'home',
        component: HomePage,
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
];
