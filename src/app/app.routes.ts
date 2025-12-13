import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';
import { ActivitiesComponent } from './pages/activities/activities.component';
import { FavoritesComponent } from './pages/favorites/favorites.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', component: ActivitiesComponent },
      { path: 'favoris', component: FavoritesComponent },
      { path: '**', redirectTo: '' }
    ]
  }
];
