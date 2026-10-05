import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth/auth.service';

const SERIE_LABELS: Record<string, string> = {
  '1_em': '1º ano do Ensino Médio',
  '2_em': '2º ano do Ensino Médio',
  '3_em': '3º ano do Ensino Médio',
  concluido: 'Ensino Médio concluído',
  cursinho: 'Cursinho pré-vestibular',
};

@Component({
  selector: 'app-home',
  imports: [MatCardModule, MatIconModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly profile = this.auth.profile;

  ngOnInit(): void {
    if (this.auth.needsOnboarding()) {
      void this.router.navigateByUrl('/onboarding');
    }
  }

  serieLabel(): string {
    const s = this.profile()?.serie;
    return s ? (SERIE_LABELS[s] ?? s) : '—';
  }
}
