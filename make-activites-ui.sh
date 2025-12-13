#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

if [ ! -f package.json ]; then
  echo "❌ package.json introuvable. Va dans le dossier du projet Angular."
  exit 1
fi

npm install

# Material (si déjà installé, ça ne casse pas)
npx -y ng add @angular/material --skip-confirmation --theme=indigo-pink --typography=true --animations=true || true

# Thème prebuilt (au cas où)
if [ -f src/styles.css ]; then
  grep -q "prebuilt-themes" src/styles.css || printf '\n@import "@angular/material/prebuilt-themes/indigo-pink.css";\n' >> src/styles.css
fi
if [ -f src/styles.scss ]; then
  grep -q "prebuilt-themes" src/styles.scss || printf '\n@import "@angular/material/prebuilt-themes/indigo-pink.css";\n' >> src/styles.scss
fi

# Générations
npx -y ng g c layout/shell --standalone --skip-tests || true
npx -y ng g c pages/activities --standalone --skip-tests || true
npx -y ng g c pages/favorites --standalone --skip-tests || true
npx -y ng g s data/activity --skip-tests || true

# --- Data ---
cat > src/app/data/activity.service.ts <<'EOF'
import { Injectable, signal } from '@angular/core';

export type Cycle = 1 | 2 | 3;
export type Subject = 'Français' | 'Math' | 'Science' | 'Univers social' | 'Arts' | 'Anglais';

export type Activity = {
  id: string;
  title: string;
  subject: Subject;
  cycle: Cycle;
  durationMin: number;
  group: 'Solo' | 'Dyade' | 'Équipe' | 'Groupe';
  objective: string;
};

const ACTIVITIES: Activity[] = [
  { id: 'fra-phrase-1', title: 'Phrases qui ont du punch', subject: 'Français', cycle: 1, durationMin: 20, group: 'Dyade', objective: 'Construire des phrases complètes (majuscule, sens, point).' },
  { id: 'math-fractions-2', title: 'La pizzeria des fractions', subject: 'Math', cycle: 2, durationMin: 30, group: 'Équipe', objective: 'Représenter des fractions simples et comparer des parts.' },
  { id: 'sci-melanges-3', title: 'Mélange ou pas mélange ?', subject: 'Science', cycle: 3, durationMin: 35, group: 'Groupe', objective: 'Distinguer soluble / insoluble.' },
  { id: 'us-ligne-temps-2', title: 'Ligne du temps éclair', subject: 'Univers social', cycle: 2, durationMin: 25, group: 'Groupe', objective: 'Placer des événements dans l’ordre et justifier.' },
  { id: 'arts-tableaux-1', title: 'Tableaux vivants', subject: 'Arts', cycle: 1, durationMin: 15, group: 'Groupe', objective: 'Exprimer une émotion par une posture et une mise en scène.' },
  { id: 'ang-commands-2', title: 'Classroom commands game', subject: 'Anglais', cycle: 2, durationMin: 20, group: 'Équipe', objective: 'Comprendre et exécuter des consignes courtes.' }
];

@Injectable({ providedIn: 'root' })
export class ActivityService {
  readonly activities = signal<Activity[]>(ACTIVITIES);
  readonly favorites = signal<Record<string, boolean>>({});

  toggleFavorite(id: string) {
    this.favorites.update(f => ({ ...f, [id]: !f[id] }));
  }

  isFavorite(id: string) {
    return !!this.favorites()[id];
  }
}
EOF

# --- Routes (Shell + pages) ---
cat > src/app/app.routes.ts <<'EOF'
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
EOF

# --- Shell (menu + search) ---
cat > src/app/layout/shell/shell.component.ts <<'EOF'
import { Component, computed, signal } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatSidenavModule, MatToolbarModule, MatIconModule, MatListModule, MatButtonModule,
    MatFormFieldModule, MatInputModule
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css'
})
export class ShellComponent {
  query = signal('');
  pageTitle = signal('Activités');

  constructor(router: Router) {
    router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      const url = router.url;
      this.pageTitle.set(url.includes('favoris') ? 'Favoris' : 'Activités');
    });
  }
}
EOF

cat > src/app/layout/shell/shell.component.html <<'EOF'
<mat-sidenav-container class="container">
  <mat-sidenav #drawer mode="over" class="sidenav">
    <div class="brand">
      <div class="logo">🎒</div>
      <div>
        <div class="name">Activités</div>
        <div class="sub">Primaire</div>
      </div>
    </div>

    <mat-nav-list>
      <a mat-list-item routerLink="/" (click)="drawer.close()">
        <mat-icon matListItemIcon>list</mat-icon>
        <span matListItemTitle>Toutes les activités</span>
      </a>

      <a mat-list-item routerLink="/favoris" (click)="drawer.close()">
        <mat-icon matListItemIcon>favorite</mat-icon>
        <span matListItemTitle>Favoris</span>
      </a>
    </mat-nav-list>
  </mat-sidenav>

  <mat-sidenav-content>
    <mat-toolbar class="toolbar">
      <button mat-icon-button (click)="drawer.toggle()" aria-label="Menu">
        <mat-icon>menu</mat-icon>
      </button>

      <span class="title">{{ pageTitle() }}</span>
      <span class="spacer"></span>

      <mat-form-field appearance="outline" class="search">
        <mat-label>Rechercher</mat-label>
        <input matInput (input)="query.set($any($event.target).value)" placeholder="fractions, phrases, science…" />
        <button mat-icon-button matSuffix (click)="query.set('')" aria-label="Effacer">
          <mat-icon>close</mat-icon>
        </button>
      </mat-form-field>
    </mat-toolbar>

    <div class="content">
      <router-outlet></router-outlet>
    </div>
  </mat-sidenav-content>
</mat-sidenav-container>
EOF

cat > src/app/layout/shell/shell.component.css <<'EOF'
.container { height: 100vh; }
.sidenav { width: 280px; }

.brand { display:flex; gap:12px; align-items:center; padding:16px; }
.logo { font-size: 28px; }
.name { font-weight: 800; font-size: 18px; }
.sub { opacity: .7; font-size: 13px; margin-top: 2px; }

.toolbar { position: sticky; top: 0; z-index: 5; }
.title { font-weight: 700; }
.spacer { flex: 1 1 auto; }

.search { width: 100%; max-width: 380px; }
.content { padding: 12px; max-width: 960px; margin: 0 auto; }

@media (max-width: 560px) {
  .search { max-width: 220px; }
}
EOF

# --- Activities page (reads query from shell via window event trickless: simple shared localStorage signal) ---
# On fait simple: on lit la query via DOM (pas propre) ? Non.
# Version propre: on stocke la query dans localStorage + event.
cat > src/app/layout/search-bus.ts <<'EOF'
import { signal } from '@angular/core';

export const globalSearchQuery = signal('');

export function setGlobalSearchQuery(v: string) {
  globalSearchQuery.set(v);
}
EOF

# Patch Shell to use global search bus
perl -0777 -i -pe 's/query = signal\(\x27\x27\);/query = signal(\x27\x27);\n\n  constructor(router: Router) {\n    router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {\n      const url = router.url;\n      this.pageTitle.set(url.includes(\x27favoris\x27) ? \x27Favoris\x27 : \x27Activit\u00e9s\x27);\n    });\n  }\n/sg' src/app/layout/shell/shell.component.ts
# Replace constructor block properly (avoid duplicates)
# Safer: overwrite file with a correct version:
cat > src/app/layout/shell/shell.component.ts <<'EOF'
import { Component, signal } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { setGlobalSearchQuery } from '../search-bus';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatSidenavModule, MatToolbarModule, MatIconModule, MatListModule, MatButtonModule,
    MatFormFieldModule, MatInputModule
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css'
})
export class ShellComponent {
  query = signal('');
  pageTitle = signal('Activités');

  constructor(router: Router) {
    router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      const url = router.url;
      this.pageTitle.set(url.includes('favoris') ? 'Favoris' : 'Activités');
    });
  }

  onQuery(v: string) {
    this.query.set(v);
    setGlobalSearchQuery(v);
  }

  clear() {
    this.onQuery('');
  }
}
EOF

# Update shell HTML to use bus methods
cat > src/app/layout/shell/shell.component.html <<'EOF'
<mat-sidenav-container class="container">
  <mat-sidenav #drawer mode="over" class="sidenav">
    <div class="brand">
      <div class="logo">🎒</div>
      <div>
        <div class="name">Activités</div>
        <div class="sub">Primaire</div>
      </div>
    </div>

    <mat-nav-list>
      <a mat-list-item routerLink="/" (click)="drawer.close()">
        <mat-icon matListItemIcon>list</mat-icon>
        <span matListItemTitle>Toutes les activités</span>
      </a>

      <a mat-list-item routerLink="/favoris" (click)="drawer.close()">
        <mat-icon matListItemIcon>favorite</mat-icon>
        <span matListItemTitle>Favoris</span>
      </a>
    </mat-nav-list>
  </mat-sidenav>

  <mat-sidenav-content>
    <mat-toolbar class="toolbar">
      <button mat-icon-button (click)="drawer.toggle()" aria-label="Menu">
        <mat-icon>menu</mat-icon>
      </button>

      <span class="title">{{ pageTitle() }}</span>
      <span class="spacer"></span>

      <mat-form-field appearance="outline" class="search">
        <mat-label>Rechercher</mat-label>
        <input matInput [value]="query()" (input)="onQuery($any($event.target).value)" placeholder="fractions, phrases, science…" />
        <button mat-icon-button matSuffix (click)="clear()" aria-label="Effacer">
          <mat-icon>close</mat-icon>
        </button>
      </mat-form-field>
    </mat-toolbar>

    <div class="content">
      <router-outlet></router-outlet>
    </div>
  </mat-sidenav-content>
</mat-sidenav-container>
EOF

# Activities page
cat > src/app/pages/activities/activities.component.ts <<'EOF'
import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityService, Subject, Cycle } from '../../data/activity.service';
import { globalSearchQuery } from '../../layout/search-bus';

import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-activities',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatChipsModule, MatIconModule, MatButtonModule, MatSelectModule, MatFormFieldModule],
  templateUrl: './activities.component.html',
  styleUrl: './activities.component.css'
})
export class ActivitiesComponent {
  constructor(public data: ActivityService) {}

  subject = signal<Subject | 'Tous'>('Tous');
  cycle = signal<Cycle | 'Tous'>('Tous');

  subjects: Array<Subject | 'Tous'> = ['Tous', 'Français', 'Math', 'Science', 'Univers social', 'Arts', 'Anglais'];
  cycles: Array<Cycle | 'Tous'> = ['Tous', 1, 2, 3];

  filtered = computed(() => {
    const q = globalSearchQuery().trim().toLowerCase();
    const s = this.subject();
    const c = this.cycle();
    return this.data.activities().filter(a => {
      if (s !== 'Tous' && a.subject !== s) return false;
      if (c !== 'Tous' && a.cycle !== c) return false;
      if (!q) return true;
      return a.title.toLowerCase().includes(q) || a.objective.toLowerCase().includes(q);
    });
  });
}
EOF

cat > src/app/pages/activities/activities.component.html <<'EOF'
<div class="filters">
  <mat-form-field appearance="outline">
    <mat-label>Matière</mat-label>
    <mat-select [value]="subject()" (selectionChange)="subject.set($event.value)">
      <mat-option *ngFor="let s of subjects" [value]="s">{{ s }}</mat-option>
    </mat-select>
  </mat-form-field>

  <mat-form-field appearance="outline">
    <mat-label>Cycle</mat-label>
    <mat-select [value]="cycle()" (selectionChange)="cycle.set($event.value)">
      <mat-option *ngFor="let c of cycles" [value]="c">{{ c === 'Tous' ? 'Tous' : ('Cycle ' + c) }}</mat-option>
    </mat-select>
  </mat-form-field>
</div>

<div class="grid">
  <mat-card *ngFor="let a of filtered()" class="card">
    <div class="head">
      <div class="title">{{ a.title }}</div>
      <button mat-icon-button (click)="data.toggleFavorite(a.id)" aria-label="Favori">
        <mat-icon>{{ data.isFavorite(a.id) ? 'favorite' : 'favorite_border' }}</mat-icon>
      </button>
    </div>

    <mat-chip-set>
      <mat-chip>{{ a.subject }}</mat-chip>
      <mat-chip>Cycle {{ a.cycle }}</mat-chip>
      <mat-chip>{{ a.durationMin }} min</mat-chip>
      <mat-chip>{{ a.group }}</mat-chip>
    </mat-chip-set>

    <p class="objective">{{ a.objective }}</p>
  </mat-card>

  <mat-card *ngIf="filtered().length === 0" class="empty">
    Aucun résultat.
  </mat-card>
</div>
EOF

cat > src/app/pages/activities/activities.component.css <<'EOF'
.filters { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:12px; }
mat-form-field { width: 220px; max-width: 100%; }

.grid { display:grid; gap:12px; grid-template-columns: 1fr; }
@media (min-width: 800px) { .grid { grid-template-columns: 1fr 1fr; } }

.card { border-radius: 16px; }
.head { display:flex; justify-content: space-between; align-items:start; gap: 8px; }
.title { font-weight: 800; font-size: 16px; }
.objective { margin: 10px 0 0; opacity: .9; }

.empty { border-radius: 16px; padding: 12px; }
EOF

# Favorites page
cat > src/app/pages/favorites/favorites.component.ts <<'EOF'
import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityService } from '../../data/activity.service';
import { globalSearchQuery } from '../../layout/search-bus';

import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatChipsModule, MatIconModule, MatButtonModule],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.css'
})
export class FavoritesComponent {
  constructor(public data: ActivityService) {}

  filtered = computed(() => {
    const q = globalSearchQuery().trim().toLowerCase();
    return this.data.activities()
      .filter(a => this.data.isFavorite(a.id))
      .filter(a => !q || a.title.toLowerCase().includes(q) || a.objective.toLowerCase().includes(q));
  });
}
EOF

cat > src/app/pages/favorites/favorites.component.html <<'EOF'
<div class="grid">
  <mat-card *ngFor="let a of filtered()" class="card">
    <div class="head">
      <div class="title">{{ a.title }}</div>
      <button mat-icon-button (click)="data.toggleFavorite(a.id)" aria-label="Favori">
        <mat-icon>{{ data.isFavorite(a.id) ? 'favorite' : 'favorite_border' }}</mat-icon>
      </button>
    </div>

    <mat-chip-set>
      <mat-chip>{{ a.subject }}</mat-chip>
      <mat-chip>Cycle {{ a.cycle }}</mat-chip>
      <mat-chip>{{ a.durationMin }} min</mat-chip>
      <mat-chip>{{ a.group }}</mat-chip>
    </mat-chip-set>

    <p class="objective">{{ a.objective }}</p>
  </mat-card>

  <mat-card *ngIf="filtered().length === 0" class="empty">
    Aucun favori (ou aucun résultat).
  </mat-card>
</div>
EOF

cat > src/app/pages/favorites/favorites.component.css <<'EOF'
.grid { display:grid; gap:12px; grid-template-columns: 1fr; }
@media (min-width: 800px) { .grid { grid-template-columns: 1fr 1fr; } }

.card { border-radius: 16px; }
.head { display:flex; justify-content: space-between; align-items:start; gap: 8px; }
.title { font-weight: 800; font-size: 16px; }
.objective { margin: 10px 0 0; opacity: .9; }

.empty { border-radius: 16px; padding: 12px; }
EOF

echo "✅ UI prêt. Lance: npx ng serve --host 0.0.0.0 --port 4200"
