import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';
import { ActivitiesComponent } from './pages/activities/activities.component';
import { FavoritesComponent } from './pages/favorites/favorites.component';
import { ActivityGameComponent } from './pages/activity-game/activity-game.component';
import { TeacherNotesComponent } from './pages/teacher-notes/teacher-notes.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', component: ActivitiesComponent },
      { path: 'favoris', component: FavoritesComponent },
      { path: 'a/:id', component: ActivityGameComponent },     // au tableau
      { path: 't/:id', component: TeacherNotesComponent },     // enseignant
      { path: '**', redirectTo: '' }
    ]
  }
];
