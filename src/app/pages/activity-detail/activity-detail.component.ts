import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ActivityService } from '../../data/activity.service';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

type Detail = {
  id: string;
  title: string;
  subject: string;
  cycle: number;
  durationMin: number;
  group: string;
  objective: string;

  bigIntro: string;
  materials: string[];
  steps: string[];
  teacherNotes: string[];
  quickChecks: string[];
};

@Component({
  selector: 'app-activity-detail',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatToolbarModule, MatCardModule, MatChipsModule, MatIconModule, MatButtonModule
  ],
  templateUrl: './activity-detail.component.html',
  styleUrl: './activity-detail.component.css'
})
export class ActivityDetailComponent {
  id = signal<string>('');

  a = computed<Detail | null>(() => this.makeDetail(this.id()));

  // Projection helpers
  stepIndex = signal(0);
  revealAll = signal(false);

  constructor(private route: ActivatedRoute, public data: ActivityService) {
    this.id.set(this.route.snapshot.paramMap.get('id') ?? '');
  }

  toggleFullscreen() {
    const d: any = document;
    if (!d.fullscreenElement) d.documentElement.requestFullscreen?.();
    else d.exitFullscreen?.();
  }

  next() {
    const act = this.a();
    if (!act) return;
    this.stepIndex.set(Math.min(this.stepIndex() + 1, act.steps.length - 1));
  }

  prev() {
    this.stepIndex.set(Math.max(this.stepIndex() - 1, 0));
  }

  reset() {
    this.stepIndex.set(0);
    this.revealAll.set(false);
  }

  fav() {
    return this.data.isFavorite(this.id());
  }

  private makeDetail(id: string): Detail | null {
    if (id === 'math-fractions-compare-2') {
      return {
        id,
        title: 'Comparer des fractions (sans calculatrice)',
        subject: 'Math',
        cycle: 2,
        durationMin: 30,
        group: 'Équipe',
        objective: 'Comparer des fractions en utilisant des représentations et des stratégies (même dénominateur, repère de 1/2 et 1, fractions équivalentes).',
        bigIntro: 'Mission : décider quelle fraction est la plus grande et expliquer pourquoi (avec un dessin ou une stratégie).',
        materials: [
          'Tableau + marqueurs',
          'Feuilles / ardoises',
          'Crayons de couleur (optionnel)'
        ],
        steps: [
          'Échauffement (2 min) : “Plus grand : 1/2 ou 1/3 ? Pourquoi ?”',
          'Stratégie 1 : même dénominateur (ex : 3/8 vs 5/8 → on compare les numérateurs).',
          'Stratégie 2 : repères 1/2 et 1 (ex : 5/6 est proche de 1 ; 2/5 est sous 1/2).',
          'Stratégie 3 : fractions équivalentes (ex : 2/3 = 4/6 → comparer 4/6 à 5/6).',
          'Défi équipes : 6 comparaisons, 1 justification par comparaison (dessin OU stratégie).',
          'Retour groupe : 2 équipes expliquent une comparaison difficile.',
          'Exit ticket (2 min) : “Compare 3/4 et 5/8. Écris une justification.”'
        ],
        teacherNotes: [
          'Exiger une justification : “Parce que…” + dessin/repère/équivalence.',
          'Si un groupe bloque : proposer de dessiner des bandes (barres) ou un cercle partagé.',
          'Piège classique : comparer seulement les dénominateurs ou seulement les numérateurs.'
        ],
        quickChecks: [
          'Les parts sont-elles égales (même tout)?',
          'Compare-t-on des parts du même type (même dénominateur) ou via équivalence?',
          'La justification est-elle visible (dessin, repère, équivalence)?'
        ]
      };
    }

    const base = this.data.activities().find(x => x.id === id) ?? null;
    if (!base) return null;

    return {
      id: base.id,
      title: base.title,
      subject: base.subject,
      cycle: base.cycle,
      durationMin: base.durationMin,
      group: base.group,
      objective: base.objective,
      bigIntro: 'Fiche détaillée à venir.',
      materials: [],
      steps: [],
      teacherNotes: [],
      quickChecks: []
    };
  }
}
