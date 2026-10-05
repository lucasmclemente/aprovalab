import { Injectable, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { SupabaseService } from '../../core/supabase/supabase.service';

export interface Offering {
  id: string;
  course_name: string;
  degree: string | null;
  shift: string | null;
  campus: string | null;
  city: string | null;
  uf: string | null;
  vagas: number | null;
  institution: string;
  sigla: string;
  cutoff: number | null;
}

export interface Target extends Offering {
  targetId: string;
}

const YEAR = 2025;

function extractCutoff(cutoffs: Array<{ score: number; modalidade: string }> | null): number | null {
  const list = cutoffs ?? [];
  const ampla = list.find((c) => c.modalidade === 'Ampla concorrência') ?? list[0];
  return ampla?.score ?? null;
}

function mapOffering(o: {
  id: string;
  course_name: string;
  degree: string | null;
  shift: string | null;
  campus: string | null;
  city: string | null;
  uf: string | null;
  vagas: number | null;
  institutions: { name: string; sigla: string } | { name: string; sigla: string }[] | null;
  cutoffs: Array<{ score: number; modalidade: string }> | null;
}): Offering {
  const inst = Array.isArray(o.institutions) ? o.institutions[0] : o.institutions;
  return {
    id: o.id,
    course_name: o.course_name.trim(),
    degree: o.degree,
    shift: o.shift,
    campus: o.campus,
    city: o.city,
    uf: o.uf,
    vagas: o.vagas,
    institution: inst?.name ?? '',
    sigla: inst?.sigla ?? '',
    cutoff: extractCutoff(o.cutoffs),
  };
}

const SELECT =
  'id, course_name, degree, shift, campus, city, uf, vagas, institutions(name, sigla), cutoffs(score, modalidade)';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly sb = inject(SupabaseService);
  private readonly auth = inject(AuthService);

  /** Busca ofertas por nome do curso (ordenadas pela nota de corte, maiores primeiro). */
  async search(query: string): Promise<Offering[]> {
    const q = query.trim();
    if (q.length < 2) return [];
    const { data, error } = await this.sb.client
      .from('course_offerings')
      .select(SELECT)
      .eq('year', YEAR)
      .ilike('course_name', `%${q}%`)
      .limit(80);
    if (error) throw error;
    return (data ?? [])
      .map(mapOffering)
      .sort((a, b) => (b.cutoff ?? 0) - (a.cutoff ?? 0))
      .slice(0, 50);
  }

  async listTargets(): Promise<Target[]> {
    const { data, error } = await this.sb.client
      .from('student_targets')
      .select(`id, priority, course_offerings(${SELECT})`)
      .order('priority', { ascending: true });
    if (error) throw error;
    return (data ?? [])
      .map((t: { id: string; course_offerings: unknown }) => {
        const off = Array.isArray(t.course_offerings) ? t.course_offerings[0] : t.course_offerings;
        if (!off) return null;
        return { ...mapOffering(off as never), targetId: t.id };
      })
      .filter((t): t is Target => t !== null);
  }

  async addTarget(offeringId: string): Promise<void> {
    const { error } = await this.sb.client
      .from('student_targets')
      .insert({ user_id: this.auth.session()?.user?.id, offering_id: offeringId });
    if (error && !error.message.includes('duplicate')) throw error;
  }

  async removeTarget(targetId: string): Promise<void> {
    const { error } = await this.sb.client.from('student_targets').delete().eq('id', targetId);
    if (error) throw error;
  }
}
