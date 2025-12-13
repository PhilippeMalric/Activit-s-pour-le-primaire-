import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';

type Fraction = { n: number; d: number };

type Round = {
  a: Fraction;
  b: Fraction;
  correct: 'A' | 'B' | 'E'; // A plus grand, B plus grand, E égal
  hint: string;
  explain: string; // version courte tableau
};

function gcd(x: number, y: number): number {
  x = Math.abs(x); y = Math.abs(y);
  while (y) { const t = x % y; x = y; y = t; }
  return x || 1;
}
function simplify(f: Fraction): Fraction {
  const g = gcd(f.n, f.d);
  return { n: f.n / g, d: f.d / g };
}
function cmp(a: Fraction, b: Fraction): number {
  return a.n * b.d - b.n * a.d; // >0 => a>b
}
function fracText(f: Fraction): string {
  return `${f.n}/${f.d}`;
}

@Component({
  selector: 'app-activity-game',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatToolbarModule, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule
  ],
  templateUrl: './activity-game.component.html',
  styleUrl: './activity-game.component.css'
})
export class ActivityGameComponent {
  id = signal('');
  // session
  score = signal(0);
  total = signal(0);
  streak = signal(0);

  showExplain = signal(false);
  feedback = signal<'ok' | 'bad' | ''>('');
  locked = signal(false);

  round = signal<Round | null>(null);

  title = computed(() => this.id() === 'math-fractions-compare-2' ? 'Jeu : comparer des fractions' : 'Jeu');

  constructor(private route: ActivatedRoute) {
    this.id.set(this.route.snapshot.paramMap.get('id') ?? '');
    this.newRound();
  }

  toggleFullscreen() {
    const d: any = document;
    if (!d.fullscreenElement) d.documentElement.requestFullscreen?.();
    else d.exitFullscreen?.();
  }

  resetGame() {
    this.score.set(0);
    this.total.set(0);
    this.streak.set(0);
    this.feedback.set('');
    this.showExplain.set(false);
    this.locked.set(false);
    this.newRound();
  }

  pick(choice: 'A' | 'B' | 'E') {
    const r = this.round();
    if (!r || this.locked()) return;

    this.total.update(v => v + 1);
    this.locked.set(true);

    if (choice === r.correct) {
      this.score.update(v => v + 1);
      this.streak.update(v => v + 1);
      this.feedback.set('ok');
    } else {
      this.streak.set(0);
      this.feedback.set('bad');
    }
  }

  next() {
    this.newRound();
  }

  toggleExplain() {
    this.showExplain.set(!this.showExplain());
  }

  private newRound() {
    this.feedback.set('');
    this.showExplain.set(false);
    this.locked.set(false);

    // Générateur centré sur les stratégies : même dénominateur, équivalentes, repères proches de 1, etc.
    const r = this.makeFractionsRound();
    this.round.set(r);
  }

  private makeFractionsRound(): Round {
    const modes = ['sameDen', 'equiv', 'nearOne', 'halfRef', 'random'] as const;
    const mode = modes[Math.floor(Math.random() * modes.length)];

    let a: Fraction, b: Fraction, hint = '', explain = '';

    if (mode === 'sameDen') {
      const d = [6, 8, 10, 12][Math.floor(Math.random() * 4)];
      let n1 = 1 + Math.floor(Math.random() * (d - 1));
      let n2 = 1 + Math.floor(Math.random() * (d - 1));
      while (n2 === n1) n2 = 1 + Math.floor(Math.random() * (d - 1));
      a = { n: n1, d };
      b = { n: n2, d };
      hint = 'Même dénominateur → compare les numérateurs.';
      explain = `Même dénominateur (${d}) : ${Math.max(n1,n2)} parts > ${Math.min(n1,n2)} parts.`;
    } else if (mode === 'equiv') {
      const base = { n: [1,2,3][Math.floor(Math.random()*3)], d: [3,4,5,6][Math.floor(Math.random()*4)] };
      const k = [2,3][Math.floor(Math.random()*2)];
      const baseS = simplify(base);
      const eq = { n: baseS.n * k, d: baseS.d * k };
      // comparer eq à une fraction même dénominateur avec +1 au numérateur parfois
      const targetD = eq.d;
      const bump = Math.random() < 0.5 ? 1 : -1;
      let otherN = Math.max(1, Math.min(targetD-1, eq.n + bump));
      if (otherN === eq.n) otherN = Math.min(targetD-1, eq.n + 1);
      a = eq;
      b = { n: otherN, d: targetD };
      hint = 'Transforme en fractions équivalentes (même dénominateur).';
      explain = `${fracText(eq)} est équivalente à ${baseS.n}/${baseS.d}. Compare ensuite ${eq.n}/${targetD} à ${otherN}/${targetD}.`;
    } else if (mode === 'nearOne') {
      // deux fractions proches de 1 : comparer le "manque" à 1
      const d = [6,8,10,12][Math.floor(Math.random()*4)];
      const n1 = d - (1 + Math.floor(Math.random()*3)); // d-2..d-4
      const n2 = d - (1 + Math.floor(Math.random()*3));
      a = { n: Math.max(1,n1), d };
      b = { n: Math.max(1,n2), d };
      hint = 'Proche de 1 : compare ce qui manque pour faire 1.';
      explain = `À 1 il manque ${d-a.n}/${d} vs ${d-b.n}/${d} : celui qui manque le moins est plus grand.`;
    } else if (mode === 'halfRef') {
      // repère 1/2 : fraction au-dessus vs au-dessous
      const d = [6,8,10,12][Math.floor(Math.random()*4)];
      const half = d/2;
      const nLow = Math.max(1, half - (1 + Math.floor(Math.random()*2)));
      const nHigh = Math.min(d-1, half + (1 + Math.floor(Math.random()*2)));
      a = { n: nLow, d };
      b = { n: nHigh, d };
      hint = 'Repère 1/2 : au-dessus de 1/2 est plus grand.';
      explain = `${fracText(a)} est sous 1/2, ${fracText(b)} est au-dessus de 1/2.`;
    } else {
      // random raisonnable
      const d1 = [4,5,6,8,10,12][Math.floor(Math.random()*6)];
      const d2 = [4,5,6,8,10,12][Math.floor(Math.random()*6)];
      a = { n: 1 + Math.floor(Math.random()*(d1-1)), d: d1 };
      b = { n: 1 + Math.floor(Math.random()*(d2-1)), d: d2 };
      hint = 'Astuce : mets au même dénominateur ou compare par produit croisé.';
      explain = `Produit croisé : compare ${a.n}×${b.d} et ${b.n}×${a.d}.`;
    }

    // simplifie juste pour l’affichage propre (sans changer le sens)
    a = simplify(a);
    b = simplify(b);

    const c = cmp(a, b);
    const correct: 'A'|'B'|'E' = c === 0 ? 'E' : (c > 0 ? 'A' : 'B');

    return { a, b, correct, hint, explain };
  }

  fracA = computed(() => this.round()?.a ? fracText(this.round()!.a) : '');
  fracB = computed(() => this.round()?.b ? fracText(this.round()!.b) : '');
}
