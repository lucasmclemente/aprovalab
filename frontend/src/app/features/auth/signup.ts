import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../../core/auth/auth.service';
import { BrandLogo } from '../../shared/brand-logo';

@Component({
  selector: 'app-signup',
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    BrandLogo,
  ],
  templateUrl: './signup.html',
  styleUrl: './auth.scss',
})
export class Signup {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly name = signal('');
  readonly email = signal('');
  readonly password = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);

  async submit(): Promise<void> {
    if (this.loading()) return;
    this.error.set(null);
    this.info.set(null);
    if (this.password().length < 6) {
      this.error.set('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    this.loading.set(true);
    try {
      const { needsConfirmation } = await this.auth.signUp(
        this.name().trim(),
        this.email().trim(),
        this.password(),
      );
      if (needsConfirmation) {
        this.info.set(
          'Conta criada! Enviamos um e-mail de confirmação — confirme para entrar.',
        );
      } else {
        await this.router.navigateByUrl('/onboarding');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      this.error.set(
        msg.toLowerCase().includes('already')
          ? 'Já existe uma conta com esse e-mail.'
          : 'Não foi possível criar a conta. Tente novamente.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
