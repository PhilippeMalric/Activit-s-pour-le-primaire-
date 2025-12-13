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
