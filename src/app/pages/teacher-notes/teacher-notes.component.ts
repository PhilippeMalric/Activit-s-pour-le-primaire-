import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

type TeacherSheet = {
  id: string;
  title: string;
  intent: string[];
  setup: string[];
  rules: string[];
  facilitation: string[];
  commonMistakes: string[];
  answerKey: string[];
  extensions: string[];
};

@Component({
  selector: 'app-teacher-notes',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './teacher-notes.component.html',
  styleUrl: './teacher-notes.component.css'
})
export class TeacherNotesComponent {
  id = signal('');

  sheet = computed<TeacherSheet | null>(() => {
    const id = this.id();
    if (id === 'math-fractions-compare-2') {
      return {
        id,
        title: 'Comparer des fractions — fiche enseignant',
        intent: [
          'Faire verbaliser une stratégie (pas “c’est ça parce que je le sens”).',
          'Stabiliser les repères 1/2 et 1.',
          'Débusquer le piège “plus gros dénominateur = plus grand”.'
        ],
        setup: [
          'Au tableau : lancer le jeu “Comparer des fractions”.',
          'En équipe : une ardoise/feuille par équipe pour écrire la justification.',
          'Règle : pas de réponse sans une phrase + une stratégie.'
        ],
        rules: [
          'Après chaque manche : 1 équipe explique sa stratégie en 10 secondes.',
          'Si désaccord : deux stratégies différentes acceptées si cohérentes.',
          'Objectif : 10 manches, puis mini bilan.'
        ],
        facilitation: [
          'Relance : “Comment tu le sais ? Qu’est-ce qui te le prouve ?”',
          'Si blocage : proposer “mettre au même dénominateur” ou “repère 1/2, 1”.',
          'Faire dessiner des bandes (barres) plutôt que des cercles si ça dérape.'
        ],
        commonMistakes: [
          'Comparer uniquement les dénominateurs (ex : croire 1/8 > 1/6).',
          'Comparer uniquement les numérateurs (ex : croire 5/12 > 3/4).',
          'Oublier que les “parts” doivent être égales (même tout).'
        ],
        answerKey: [
          'Stratégie “même dénominateur” : numérateur plus grand → fraction plus grande.',
          'Stratégie “équivalentes” : multiplier numérateur/dénominateur par le même nombre.',
          'Produit croisé (si tu l’acceptes) : comparer a×d2 et b×d1.',
          'Proche de 1 : comparer ce qui manque pour atteindre 1.'
        ],
        extensions: [
          'Niveau + : imposer une justification différente de la manche précédente.',
          'Niveau + : demander “la différence” (combien de parts d’écart) quand même dénominateur.',
          'Exit ticket : comparer 3/4 et 5/8 + justification écrite.'
        ]
      };
    }
    return null;
  });
}
