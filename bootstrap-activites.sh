#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

# --- Sanity checks ---
if [ ! -f "package.json" ]; then
  echo "❌ package.json introuvable. Place-toi dans le dossier du projet Angular."
  exit 1
fi

# --- Install deps ---
echo "📦 Install deps..."
npm install

# --- Add Angular Material (non-interactive) ---
echo "🎨 Add Angular Material..."
# Le schematic peut demander des inputs selon versions; on force des valeurs.
npx -y ng add @angular/material --skip-confirmation \
  --theme=indigo-pink --typography=true --animations=true

# --- Generate pages + service ---
echo "🧱 Generate components/services..."
npx -y ng g c pages/activities --standalone --skip-tests
npx -y ng g c pages/activity-detail --standalone --skip-tests
npx -y ng g s data/activity --skip-tests

# --- Write files ---
echo "✍️ Write code..."

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
  material: string[];
  objective: string;
  steps: string[];
  differentiation: string[];
  evaluation: string[];
};

const ACTIVITIES: Activity[] = [
  {
    id: 'fra-phrase-1',
    title: 'Phrases qui ont du punch',
    subject: 'Français',
    cycle: 1,
    durationMin: 20,
    group: 'Dyade',
    material: ['Ardoise', 'Crayon', 'Cartons de mots (optionnel)'],
    objective: 'Construire des phrases complètes (majuscule, sens, point).',
    steps: [
      'Donner 6 mots au hasard (ou 3 images).',
      'En dyade, inventer 2 phrases qui ont du sens.',
      'Souligner le sujet et entourer le verbe (guidé).',
      'Partage éclair : 2 équipes lisent une phrase.'
    ],
    differentiation: [
      'Aide : banque de débuts de phrases.',
      'Défi : ajouter un complément de phrase.'
    ],
    evaluation: ['Phrase complète', 'Ponctuation', 'Sens clair']
  },
  {
    id: 'math-fractions-2',
    title: 'La pizzeria des fractions',
    subject: 'Math',
    cycle: 2,
    durationMin: 30,
    group: 'Équipe',
    material: ['Feuilles', 'Ciseaux', 'Crayons de couleur'],
    objective: 'Représenter des fractions simples et comparer des parts.',
    steps: [
      'Dessiner 2 “pizzas” (cercles) et les découper en parts égales (4, 8).',
      'Tirer une carte (ex: 3/4, 5/8) et construire la pizza correspondante.',
      'Comparer deux fractions en justifiant avec les parts.',
      'Mini-défi : trouver 2 fractions équivalentes avec tes parts.'
    ],
    differentiation: [
      'Aide : fractions avec mêmes dénominateurs.',
      'Défi : introduire équivalences (2/4 = 4/8).'
    ],
    evaluation: ['Représentation correcte', 'Justification', 'Comparaison']
  },
  {
    id: 'sci-melanges-3',
    title: 'Mélange ou pas mélange ?',
    subject: 'Science',
    cycle: 3,
    durationMin: 35,
    group: 'Groupe',
    material: ['Eau', 'Sel', 'Sable', 'Cuillère', 'Gobelets'],
    objective: 'Distinguer soluble / insoluble et miscible / non miscible.',
    steps: [
      'Hypothèses : que va-t-il se passer ?',
      'Tester (eau + sel), (eau + sable).',
      'Observer, décrire, conclure avec les mots “soluble/insoluble”.',
      'Faire une mini-affiche de synthèse.'
    ],
    differentiation: [
      'Aide : tableau à remplir (hypothèse/observation/conclusion).',
      'Défi : proposer une nouvelle substance à tester.'
    ],
    evaluation: ['Vocabulaire', 'Observation', 'Conclusion cohérente']
  }
];

@Injectable({ providedIn: 'root' })
export class ActivityService {
  readonly activities = signal<Activity[]>(ACTIVITIES);
  readonly favorites = signal<Record<string, boolean>>({});

  toggleFavorite(id: string) {
    this.favorites.update(f => ({ ...f, [id]: !f[id] }));
  }

  getById(id: string) {
    return this.activities().find(a => a.id === id) ?? null;
  }
}
EOF

cat > src/app/app.routes.ts <<'EOF'
import { Routes } from '@angular/router';
import { ActivitiesComponent } from './pages/activities/activities.component';
import { ActivityDetailComponent } from './pages/activity-detail/activity-detail.component';

export const routes: Routes = [
  { path: '', component: ActivitiesComponent },
  { path: 'a/:id', component: ActivityDetailComponent },
  { path: '**', redirectTo: '' }
];
EOF

cat > src/app/pages/activities/activities.component.ts <<'EOF'
import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivityService, Cycle, Subject } from '../../data/activity.service';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-activities',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatToolbarModule, MatCardModule, MatChipsModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule
  ],
  templateUrl: './activities.component.html',
  styleUrl: './activities.component.css'
})
export class ActivitiesComponent {
  constructor(public data: ActivityService) {}

  q = signal('');
  subject = signal<Subject | 'Tous'>('Tous');
  cycle = signal<Cycle | 'Tous'>('Tous');

  subjects: Array<Subject | 'Tous'> = ['Tous', 'Français', 'Math', 'Science', 'Univers social', 'Arts', 'Anglais'];
  cycles: Array<Cycle | 'Tous'> = ['Tous', 1, 2, 3];

  filtered = computed(() => {
    const q = this.q().trim().toLowerCase();
    const s = this.subject();
    const c = this.cycle();
    return this.data.activities().filter(a => {
      if (s !== 'Tous' && a.subject !== s) return false;
      if (c !== 'Tous' && a.cycle !== c) return false;
      if (!q) return true;
      return a.title.toLowerCase().includes(q) || a.objective.toLowerCase().includes(q);
    });
  });

  fav(id: string) {
    return !!this.data.favorites()[id];
  }
}
EOF

cat > src/app/pages/activities/activities.component.html <<'EOF'
<mat-toolbar>
  <span>Activités – Primaire</span>
  <span class="spacer"></span>
  <mat-chip-set>
    <mat-chip>📚</mat-chip>
    <mat-chip>🧠</mat-chip>
    <mat-chip>🧪</mat-chip>
  </mat-chip-set>
</mat-toolbar>

<div class="wrap">
  <mat-card class="filters">
    <div class="grid">
      <mat-form-field appearance="outline">
        <mat-label>Recherche</mat-label>
        <input matInput (input)="q.set(($any($event.target).value))" placeholder="fractions, phrases, mélanges…" />
      </mat-form-field>

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
  </mat-card>

  <div class="list">
    <mat-card *ngFor="let a of filtered()" class="item">
      <div class="row">
        <div>
          <div class="title">{{ a.title }}</div>
          <div class="meta">
            <mat-chip-set>
              <mat-chip>{{ a.subject }}</mat-chip>
              <mat-chip>Cycle {{ a.cycle }}</mat-chip>
              <mat-chip>{{ a.durationMin }} min</mat-chip>
              <mat-chip>{{ a.group }}</mat-chip>
            </mat-chip-set>
          </div>
          <p class="objective">{{ a.objective }}</p>
        </div>

        <div class="actions">
          <button mat-icon-button (click)="data.toggleFavorite(a.id)" [attr.aria-label]="'Favori ' + a.title">
            <mat-icon>{{ fav(a.id) ? 'favorite' : 'favorite_border' }}</mat-icon>
          </button>
          <a mat-raised-button color="primary" [routerLink]="['/a', a.id]">Ouvrir</a>
        </div>
      </div>
    </mat-card>
  </div>
</div>
EOF

cat > src/app/pages/activities/activities.component.css <<'EOF'
.wrap { padding: 12px; max-width: 900px; margin: 0 auto; }
.spacer { flex: 1 1 auto; }

.filters { margin-bottom: 12px; }
.grid { display: grid; grid-template-columns: 1fr; gap: 10px; }
@media (min-width: 700px) { .grid { grid-template-columns: 2fr 1fr 1fr; } }

.list { display: grid; gap: 12px; }
.item { border-radius: 16px; }
.row { display: grid; gap: 12px; }
@media (min-width: 700px) { .row { grid-template-columns: 1fr auto; align-items: start; } }

.title { font-size: 18px; font-weight: 700; }
.objective { margin: 10px 0 0; opacity: .9; }

.actions { display: flex; gap: 10px; justify-content: flex-end; align-items: center; }
EOF

cat > src/app/pages/activity-detail/activity-detail.component.ts <<'EOF'
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ActivityService } from '../../data/activity.service';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-activity-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatCardModule, MatChipsModule, MatButtonModule, MatIconModule],
  templateUrl: './activity-detail.component.html',
  styleUrl: './activity-detail.component.css'
})
export class ActivityDetailComponent {
  id = this.route.snapshot.paramMap.get('id')!;
  a = this.data.getById(this.id);

  constructor(private route: ActivatedRoute, public data: ActivityService) {}

  fav() {
    return !!this.data.favorites()[this.id];
  }
}
EOF

cat > src/app/pages/activity-detail/activity-detail.component.html <<'EOF'
<mat-toolbar>
  <a mat-button routerLink="/">
    <mat-icon>arrow_back</mat-icon>
    Retour
  </a>
  <span class="spacer"></span>
  <button mat-icon-button (click)="data.toggleFavorite(id)">
    <mat-icon>{{ fav() ? 'favorite' : 'favorite_border' }}</mat-icon>
  </button>
</mat-toolbar>

<div class="wrap" *ngIf="a; else notfound">
  <mat-card>
    <h2>{{ a.title }}</h2>
    <mat-chip-set>
      <mat-chip>{{ a.subject }}</mat-chip>
      <mat-chip>Cycle {{ a.cycle }}</mat-chip>
      <mat-chip>{{ a.durationMin }} min</mat-chip>
      <mat-chip>{{ a.group }}</mat-chip>
    </mat-chip-set>

    <h3>Objectif</h3>
    <p>{{ a.objective }}</p>

    <h3>Matériel</h3>
    <ul><li *ngFor="let m of a.material">{{ m }}</li></ul>

    <h3>Déroulement</h3>
    <ol><li *ngFor="let s of a.steps">{{ s }}</li></ol>

    <h3>Différenciation</h3>
    <ul><li *ngFor="let d of a.differentiation">{{ d }}</li></ul>

    <h3>Évaluation rapide</h3>
    <ul><li *ngFor="let e of a.evaluation">{{ e }}</li></ul>
  </mat-card>
</div>

<ng-template #notfound>
  <div class="wrap">
    <mat-card>Activité introuvable.</mat-card>
  </div>
</ng-template>
EOF

cat > src/app/pages/activity-detail/activity-detail.component.css <<'EOF'
.wrap { padding: 12px; max-width: 900px; margin: 0 auto; }
.spacer { flex: 1 1 auto; }
mat-card { border-radius: 16px; }
h2 { margin: 0 0 8px; }
h3 { margin-top: 18px; }
EOF

echo "✅ Done. You can run: npx ng serve --host 0.0.0.0 --port 4200"
