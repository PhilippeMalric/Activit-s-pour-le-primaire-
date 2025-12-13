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
