import { Injectable, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { SupabaseService } from '../../core/supabase/supabase.service';

export interface OnboardingInput {
  serie: string;
  exam_date: string | null;
  study_hours_week: number | null;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly sb = inject(SupabaseService);
  private readonly auth = inject(AuthService);

  async completeOnboarding(input: OnboardingInput): Promise<void> {
    const uid = this.auth.session()?.user?.id;
    if (!uid) throw new Error('sem sessão');
    const { error } = await this.sb.client
      .from('profiles')
      .update({ ...input, onboarded: true })
      .eq('id', uid);
    if (error) throw error;
    await this.auth.refreshProfile();
  }
}
