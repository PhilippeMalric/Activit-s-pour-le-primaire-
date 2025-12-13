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
