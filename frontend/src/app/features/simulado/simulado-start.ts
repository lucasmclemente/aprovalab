import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SimuladoService } from './simulado.service';

@Component({
  selector: 'app-simulado-start',
  imports: [MatButtonModule, MatCardModule, MatIconModule, MatProgressBarModule],
  templateUrl: './simulado-start.html',
  styleUrl: './simulado.scss',
})
export class SimuladoStart {
  private readonly service = inject(SimuladoService);
  private readonly router = inject(Router);
  private readonly snackbar = inject(MatSnackBar);

  readonly starting = signal(false);

  async start(): Promise<void> {
    if (this.starting()) return;
    this.starting.set(true);
    try {
      const id = await this.service.startDiagnostic();
      await this.router.navigate(['/simulado', id]);
    } catch {
      this.snackbar.open('Não foi possível iniciar o simulado.', 'Fechar', { duration: 4000 });
      this.starting.set(false);
    }
  }
}
