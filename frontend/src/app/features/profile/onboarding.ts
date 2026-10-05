import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../core/auth/auth.service';
import { BrandLogo } from '../../shared/brand-logo';
import { ProfileService } from './profile.service';

@Component({
  selector: 'app-onboarding',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    BrandLogo,
  ],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.scss',
})
export class Onboarding implements OnInit {
  private readonly service = inject(ProfileService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly serie = signal('3_em');
  readonly examDate = signal('');
  readonly hours = signal<number | null>(null);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    // Já fez onboarding? Vai direto para a home.
    if (this.auth.profile()?.onboarded) {
      void this.router.navigateByUrl('/');
    }
  }

  async submit(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    try {
      await this.service.completeOnboarding({
        serie: this.serie(),
        exam_date: this.examDate() || null,
        study_hours_week: this.hours() ? Number(this.hours()) : null,
      });
      await this.router.navigateByUrl('/');
    } catch {
      this.error.set('Não foi possível salvar. Tente novamente.');
    } finally {
      this.saving.set(false);
    }
  }
}
