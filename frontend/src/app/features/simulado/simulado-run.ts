import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Answer, SimuladoQuestion, SimuladoResult, SimuladoService } from './simulado.service';

const AREA_LABELS: Record<string, string> = {
  linguagens: 'Linguagens',
  humanas: 'Humanas',
  natureza: 'Natureza',
  matematica: 'Matemática',
  redacao: 'Redação',
};

@Component({
  selector: 'app-simulado-run',
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatRadioModule,
  ],
  templateUrl: './simulado-run.html',
  styleUrl: './simulado.scss',
})
export class SimuladoRun implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(SimuladoService);
  private readonly snackbar = inject(MatSnackBar);
  readonly router = inject(Router);

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly questions = signal<SimuladoQuestion[]>([]);
  readonly answers = signal<Record<string, string>>({});
  readonly result = signal<SimuladoResult | null>(null);

  private id = '';

  readonly answeredCount = computed(() => Object.keys(this.answers()).length);
  readonly allAnswered = computed(
    () => this.questions().length > 0 && this.answeredCount() === this.questions().length,
  );
  readonly areaResults = computed(() => {
    const by = this.result()?.by_area ?? {};
    return Object.entries(by)
      .map(([key, acc]) => ({ label: AREA_LABELS[key] ?? key, acc: Number(acc) }))
      .sort((a, b) => a.acc - b.acc);
  });

  async ngOnInit(): Promise<void> {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    try {
      this.questions.set(await this.service.getQuestions(this.id));
    } catch {
      this.snackbar.open('Não foi possível carregar o simulado.', 'Fechar', { duration: 4000 });
    } finally {
      this.loading.set(false);
    }
  }

  areaLabel(key: string): string {
    return AREA_LABELS[key] ?? key;
  }

  setAnswer(questionId: string, label: string): void {
    this.answers.set({ ...this.answers(), [questionId]: label });
  }

  status(acc: number): 'forte' | 'medio' | 'fraco' {
    if (acc >= 70) return 'forte';
    if (acc >= 40) return 'medio';
    return 'fraco';
  }

  async finalize(): Promise<void> {
    if (this.submitting() || !this.allAnswered()) return;
    this.submitting.set(true);
    try {
      const answers: Answer[] = Object.entries(this.answers()).map(([question_id, label]) => ({
        question_id,
        label,
      }));
      this.result.set(await this.service.submit(this.id, answers));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      this.snackbar.open('Erro ao enviar o simulado.', 'Fechar', { duration: 4000 });
    } finally {
      this.submitting.set(false);
    }
  }
}
