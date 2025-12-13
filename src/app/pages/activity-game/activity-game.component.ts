import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

type Fraction = { n: number; d: number };
type Choice = 'A' | 'B' | 'E';
type Difficulty = 'Facile' | 'Moyen' | 'Difficile';
type Strategy = 'Même dénominateur' | 'Équivalentes' | 'Proche de 1' | 'Repère 1/2' | 'Produit croisé';

type Round = {
  a: Fraction;
  b: Fraction;
  correct: Choice;
  hint: string;
  explain: string;
  strategy: Strategy;
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
  return a.n * b.d - b.n * a.d;
}
function fracText(f: Fraction): string {
  return `${f.n}/${f.d}`;
}

@Component({
  selector: 'app-activity-game',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatToolbarModule, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule,
    MatSelectModule, MatFormFieldModule
  ],
  templateUrl: './activity-game.component.html',
  styleUrl: './activity-game.component.css'
})
export class ActivityGameComponent {
  id = signal('');

  difficulty = signal<Difficulty>('Moyen');
  timerSec = signal<number>(10);
  maxRounds = signal<number>(10);

  teamsEnabled = signal<boolean>(true);
  teams = ['A', 'B', 'C', 'D'] as const;
  activeTeam = signal<(typeof this.teams)[number]>('A');

  score = signal(0);
  total = signal(0);
  streak = signal(0);

  teamScores = signal<Record<string, number>>({ A: 0, B: 0, C: 0, D: 0 });
  correctCount = signal(0);
  wrongCount = signal(0);
  timeoutCount = signal(0);
  strategyCounts = signal<Record<Strategy, number>>({
    'Même dénominateur': 0,
    'Équivalentes': 0,
    'Proche de 1': 0,
    'Repère 1/2': 0,
    'Produit croisé': 0
  });

  roundIndex = signal(0);
  finished = computed(() => this.roundIndex() >= this.maxRounds());

  showExplain = signal(false);
  feedback = signal<'ok' | 'bad' | 'timeout' | ''>('');
  locked = signal(false);
  round = signal<Round | null>(null);

  timeLeft = signal<number>(0);
  private intervalId: any = null;

  title = computed(() => this.id() === 'math-fractions-compare-2' ? 'Jeu : comparer des fractions' : 'Jeu');

  constructor(private route: ActivatedRoute) {
    this.id.set(this.route.snapshot.paramMap.get('id') ?? '');
    this.startNewGame();
  }

  toggleFullscreen() {
    const d: any = document;
    if (!d.fullscreenElement) d.documentElement.requestFullscreen?.();
    else d.exitFullscreen?.();
  }

  startNewGame() {
    this.stopTimer();
    this.score.set(0);
    this.total.set(0);
    this.streak.set(0);
    this.correctCount.set(0);
    this.wrongCount.set(0);
    this.timeoutCount.set(0);
    this.strategyCounts.set({
      'Même dénominateur': 0,
      'Équivalentes': 0,
      'Proche de 1': 0,
      'Repère 1/2': 0,
      'Produit croisé': 0
    });
    this.teamScores.set({ A: 0, B: 0, C: 0, D: 0 });
    this.roundIndex.set(0);
    this.feedback.set('');
    this.showExplain.set(false);
    this.locked.set(false);
    this.newRound();
  }

  applySettings() { this.startNewGame(); }

  setTeam(t: (typeof this.teams)[number]) { this.activeTeam.set(t); }

  pick(choice: Choice) {
    const r = this.round();
    if (!r || this.locked() || this.finished()) return;

    this.stopTimer();
    this.total.update(v => v + 1);
    this.locked.set(true);

    this.strategyCounts.update(m => ({ ...m, [r.strategy]: (m[r.strategy] ?? 0) + 1 }));

    const ok = choice === r.correct;
    if (ok) {
      this.score.update(v => v + 1);
      this.streak.update(v => v + 1);
      this.correctCount.update(v => v + 1);
      this.feedback.set('ok');
      if (this.teamsEnabled()) {
        const team = this.activeTeam();
        this.teamScores.update(s => ({ ...s, [team]: (s[team] ?? 0) + 1 }));
      }
    } else {
      this.streak.set(0);
      this.wrongCount.update(v => v + 1);
      this.feedback.set('bad');
    }
  }

  next() {
    if (this.finished()) return;
    this.roundIndex.update(v => v + 1);
    if (this.finished()) {
      this.stopTimer();
      this.round.set(null);
      return;
    }
    this.newRound();
  }

  toggleExplain() { this.showExplain.set(!this.showExplain()); }

  private onTimeout() {
    if (this.locked() || this.finished()) return;
    this.total.update(v => v + 1);
    this.locked.set(true);
    this.streak.set(0);
    this.timeoutCount.update(v => v + 1);
    this.feedback.set('timeout');
  }

  private startTimer() {
    this.stopTimer();
    const sec = this.timerSec();
    if (!sec || sec <= 0) { this.timeLeft.set(0); return; }
    this.timeLeft.set(sec);
    this.intervalId = setInterval(() => {
      this.timeLeft.update(v => {
        const nv = v - 1;
        if (nv <= 0) {
          this.stopTimer();
          this.timeLeft.set(0);
          this.onTimeout();
          return 0;
        }
        return nv;
      });
    }, 1000);
  }

  private stopTimer() {
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
  }

  private newRound() {
    this.feedback.set('');
    this.showExplain.set(false);
    this.locked.set(false);
    this.round.set(this.makeFractionsRound(this.difficulty()));
    this.startTimer();
  }

  private makeFractionsRound(diff: Difficulty): Round {
    const poolEasy: Strategy[] = ['Même dénominateur', 'Repère 1/2'];
    const poolMid: Strategy[] = ['Même dénominateur', 'Repère 1/2', 'Équivalentes', 'Proche de 1'];
    const poolHard: Strategy[] = ['Même dénominateur', 'Équivalentes', 'Proche de 1', 'Repère 1/2', 'Produit croisé'];
    const pool = diff === 'Facile' ? poolEasy : diff === 'Moyen' ? poolMid : poolHard;
    const strategy = pool[Math.floor(Math.random() * pool.length)];

    let a: Fraction, b: Fraction, hint = '', explain = '';

    if (strategy === 'Même dénominateur') {
      const d = [6, 8, 10, 12][Math.floor(Math.random() * 4)];
      let n1 = 1 + Math.floor(Math.random() * (d - 1));
      let n2 = 1 + Math.floor(Math.random() * (d - 1));
      while (n2 === n1) n2 = 1 + Math.floor(Math.random() * (d - 1));
      a = { n: n1, d }; b = { n: n2, d };
      hint = 'Même dénominateur → compare les numérateurs.';
      explain = `Même dénominateur (${d}) : ${Math.max(n1,n2)} parts > ${Math.min(n1,n2)} parts.`;
    } else if (strategy === 'Équivalentes') {
      const base = { n: [1,2,3][Math.floor(Math.random()*3)], d: [3,4,5,6][Math.floor(Math.random()*4)] };
      const k = [2,3][Math.floor(Math.random()*2)];
      const baseS = simplify(base);
      const eq = { n: baseS.n * k, d: baseS.d * k };
      const targetD = eq.d;
      const bump = Math.random() < 0.5 ? 1 : -1;
      let otherN = Math.max(1, Math.min(targetD-1, eq.n + bump));
      if (otherN === eq.n) otherN = Math.min(targetD-1, eq.n + 1);
      a = eq; b = { n: otherN, d: targetD };
      hint = 'Transforme une fraction pour avoir le même dénominateur.';
      explain = `${fracText(eq)} est équivalente à ${baseS.n}/${baseS.d}. Compare ${eq.n}/${targetD} et ${otherN}/${targetD}.`;
    } else if (strategy === 'Proche de 1') {
      const d = [6,8,10,12][Math.floor(Math.random()*4)];
      const n1 = d - (1 + Math.floor(Math.random()*3));
      const n2 = d - (1 + Math.floor(Math.random()*3));
      a = { n: Math.max(1,n1), d }; b = { n: Math.max(1,n2), d };
      hint = 'Proche de 1 : compare ce qui manque pour faire 1.';
      explain = `À 1 il manque ${d-a.n}/${d} vs ${d-b.n}/${d} : celui qui manque le moins est plus grand.`;
    } else if (strategy === 'Repère 1/2') {
      const d = [6,8,10,12][Math.floor(Math.random()*4)];
      const half = d/2;
      const nLow = Math.max(1, half - (1 + Math.floor(Math.random()*2)));
      const nHigh = Math.min(d-1, half + (1 + Math.floor(Math.random()*2)));
      a = { n: nLow, d }; b = { n: nHigh, d };
      hint = 'Repère 1/2 : au-dessus de 1/2 est plus grand.';
      explain = `${fracText(a)} est sous 1/2, ${fracText(b)} est au-dessus de 1/2.`;
    } else {
      const d1 = [4,5,6,8,10,12][Math.floor(Math.random()*6)];
      const d2 = [4,5,6,8,10,12][Math.floor(Math.random()*6)];
      a = { n: 1 + Math.floor(Math.random()*(d1-1)), d: d1 };
      b = { n: 1 + Math.floor(Math.random()*(d2-1)), d: d2 };
      hint = 'Produit croisé : compare a×d2 et b×d1.';
      explain = `Compare ${a.n}×${b.d} et ${b.n}×${a.d}.`;
    }

    a = simplify(a); b = simplify(b);
    const c = cmp(a, b);
    const correct: Choice = c === 0 ? 'E' : (c > 0 ? 'A' : 'B');
    return { a, b, correct, hint, explain, strategy };
  }

  fracA = computed(() => this.round()?.a ? fracText(this.round()!.a) : '');
  fracB = computed(() => this.round()?.b ? fracText(this.round()!.b) : '');

  accuracy = computed(() => {
    const t = this.total();
    return t ? Math.round((this.score() / t) * 100) : 0;
  });

  bestTeam = computed(() => {
    const s = this.teamScores();
    const entries = Object.entries(s);
    entries.sort((a,b) => (b[1] ?? 0) - (a[1] ?? 0));
    return entries[0] ? `${entries[0][0]} (${entries[0][1]})` : '—';
  });
}
