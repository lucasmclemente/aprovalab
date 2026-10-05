import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '../../core/supabase/supabase.service';

export interface SimuladoQuestion {
  position: number;
  question_id: string;
  area_key: string;
  topic: string | null;
  statement: string;
  options: { label: string; text: string }[];
}

export interface SimuladoResult {
  total: number;
  correct: number;
  score: number;
  by_area: Record<string, number>;
}

export interface Answer {
  question_id: string;
  label: string;
}

@Injectable({ providedIn: 'root' })
export class SimuladoService {
  private readonly sb = inject(SupabaseService);

  async startDiagnostic(): Promise<string> {
    const { data, error } = await this.sb.client.rpc('start_diagnostic');
    if (error) throw error;
    return data as string;
  }

  async getQuestions(simuladoId: string): Promise<SimuladoQuestion[]> {
    const { data, error } = await this.sb.client.rpc('get_simulado', { p_simulado: simuladoId });
    if (error) throw error;
    return (data ?? []) as SimuladoQuestion[];
  }

  async submit(simuladoId: string, answers: Answer[]): Promise<SimuladoResult> {
    const { data, error } = await this.sb.client.rpc('submit_simulado', {
      p_simulado: simuladoId,
      p_answers: answers,
    });
    if (error) throw error;
    return data as SimuladoResult;
  }
}
