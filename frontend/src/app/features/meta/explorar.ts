import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CatalogService, Offering, Target } from './catalog.service';

@Component({
  selector: 'app-explorar',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
  ],
  templateUrl: './explorar.html',
  styleUrl: './explorar.scss',
})
export class Explorar implements OnInit {
  private readonly catalog = inject(CatalogService);
  private readonly snackbar = inject(MatSnackBar);

  readonly loading = signal(true);
  readonly searching = signal(false);
  readonly working = signal(false);
  readonly query = signal('');
  readonly results = signal<Offering[]>([]);
  readonly targets = signal<Target[]>([]);
  readonly searched = signal(false);

  async ngOnInit(): Promise<void> {
    await this.reloadTargets();
  }

  private async reloadTargets(): Promise<void> {
    this.loading.set(true);
    try {
      this.targets.set(await this.catalog.listTargets());
    } catch {
      this.snackbar.open('Não foi possível carregar suas metas.', 'Fechar', { duration: 4000 });
    } finally {
      this.loading.set(false);
    }
  }

  async doSearch(): Promise<void> {
    if (this.query().trim().length < 2) return;
    this.searching.set(true);
    this.searched.set(true);
    try {
      this.results.set(await this.catalog.search(this.query()));
    } catch {
      this.snackbar.open('Erro na busca.', 'Fechar', { duration: 4000 });
    } finally {
      this.searching.set(false);
    }
  }

  isTargeted(offeringId: string): boolean {
    return this.targets().some((t) => t.id === offeringId);
  }

  cutoffLabel(c: number | null): string {
    return c == null ? '—' : c.toFixed(1).replace('.', ',');
  }

  subtitle(o: Offering): string {
    return [o.sigla, o.campus, o.uf].filter(Boolean).join(' · ');
  }

  async add(o: Offering): Promise<void> {
    if (this.working()) return;
    this.working.set(true);
    try {
      await this.catalog.addTarget(o.id);
      await this.reloadTargets();
      this.snackbar.open('Meta adicionada!', 'Fechar', { duration: 2500 });
    } catch {
      this.snackbar.open('Erro ao adicionar meta.', 'Fechar', { duration: 4000 });
    } finally {
      this.working.set(false);
    }
  }

  async remove(t: Target): Promise<void> {
    if (this.working()) return;
    this.working.set(true);
    try {
      await this.catalog.removeTarget(t.targetId);
      await this.reloadTargets();
    } catch {
      this.snackbar.open('Erro ao remover meta.', 'Fechar', { duration: 4000 });
    } finally {
      this.working.set(false);
    }
  }
}
