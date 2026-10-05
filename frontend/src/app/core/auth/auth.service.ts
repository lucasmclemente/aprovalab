import { Injectable, computed, inject, signal } from '@angular/core';
import type { Session } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';

export interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  serie: string | null;
  exam_date: string | null;
  study_hours_week: number | null;
  onboarded: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sb = inject(SupabaseService);

  private readonly _session = signal<Session | null>(null);
  private readonly _profile = signal<Profile | null>(null);

  readonly session = this._session.asReadonly();
  readonly profile = this._profile.asReadonly();
  readonly isAuthenticated = computed(() => this._session() !== null);
  readonly needsOnboarding = computed(() => {
    const p = this._profile();
    return !!p && !p.onboarded;
  });

  readonly ready: Promise<void>;
  private markReady!: () => void;

  constructor() {
    this.ready = new Promise<void>((resolve) => (this.markReady = resolve));

    void this.sb.client.auth.getSession().then(async ({ data }) => {
      this._session.set(data.session);
      if (data.session) await this.loadProfile();
      this.markReady();
    });

    this.sb.client.auth.onAuthStateChange(async (_event, session) => {
      this._session.set(session);
      if (session) await this.loadProfile();
      else this._profile.set(null);
    });
  }

  /** Cadastro do aluno. Retorna se é preciso confirmar e-mail (depende da config do Supabase). */
  async signUp(name: string, email: string, password: string): Promise<{ needsConfirmation: boolean }> {
    const { data, error } = await this.sb.client.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
    return { needsConfirmation: !data.session };
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.sb.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async signOut(): Promise<void> {
    await this.sb.client.auth.signOut();
  }

  async refreshProfile(): Promise<void> {
    await this.loadProfile();
  }

  private async loadProfile(): Promise<void> {
    const uid = this._session()?.user?.id;
    if (!uid) return;
    const { data } = await this.sb.client
      .from('profiles')
      .select('id, name, email, serie, exam_date, study_hours_week, onboarded')
      .eq('id', uid)
      .maybeSingle();
    this._profile.set((data as Profile | null) ?? null);
  }
}
