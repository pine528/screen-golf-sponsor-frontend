/**
 * 관리자 · 디지털 파트너 플랜 가격 (Admin Pricing Config) — 통합 핸드오프 v2.1 §9.2
 * START/GROW/PLUS 금액·수량·포함/미포함은 코드 상수가 아니라 이 화면(DB)이 단일 출처다.
 * UI · 계약 · 결제 · 리포트가 같은 값을 읽는다. 변경은 감사로그에 남는다.
 */
import { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { api } from '../../services/api';
import { ErrorState, LoadingState } from '../../components/ui/StateView';
import { CheckCircle2, Save } from 'lucide-react';

type Plan = {
  code: string; name: string; monthlyPrice: number; termMonths: number; capacity: number;
  active: boolean; sortOrder: number; benefits: string[] | null; exclusions: string[] | null; updatedAt: string;
};

export default function AdminDigitalPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [draft, setDraft] = useState<Record<string, Partial<Plan> & { reason?: string }>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<any>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const r: any = await api.getAdminDigitalPlans();
      setPlans(r?.data || []);
      setDraft({});
    } catch (e) { setErr(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const edit = (code: string, patch: Partial<Plan> & { reason?: string }) =>
    setDraft((d) => ({ ...d, [code]: { ...(d[code] || {}), ...patch } }));

  const save = async (p: Plan) => {
    const d = draft[p.code];
    if (!d) return;
    if (!d.reason?.trim()) { alert('변경 사유를 적어주세요. 감사로그에 남습니다.'); return; }
    setSaving(p.code);
    try {
      const { reason, ...patch } = d;
      await api.updateAdminDigitalPlan(p.code, { ...patch, reason });
      setSaved(p.code);
      setTimeout(() => setSaved(null), 2000);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.error?.message || '저장하지 못했습니다');
    } finally { setSaving(null); }
  };

  const lines = (v: string[] | null | undefined) => (v || []).join('\n');
  const toList = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);

  return (
    <Layout>
      <div className="max-w-[1180px] space-y-5">
        <div>
          <h1 className="text-[24px] font-extrabold text-slate-900 tracking-[-0.02em]">디지털 파트너 플랜 가격</h1>
          <p className="mt-1 text-[14px] text-slate-600 break-keep">
            여기 값이 랜딩 · 선수 플랜 · 신청 · 결제 · 리포트의 단일 출처입니다. 월 구독료를 바꾸면 12개월 총액도 함께 바뀝니다.
            이미 진행 중인 구독의 금액은 계약 스냅샷을 따르므로 소급되지 않습니다.
          </p>
        </div>

        {loading ? <LoadingState label="플랜을 불러오는 중…" /> : err ? <ErrorState error={err} onRetry={load} /> : (
          <div className="grid lg:grid-cols-3 gap-4">
            {plans.map((p) => {
              const d = draft[p.code] || {};
              const price = d.monthlyPrice ?? p.monthlyPrice;
              const dirty = Object.keys(d).some((k) => k !== 'reason');
              return (
                <section key={p.code} className={`rounded-2xl border bg-white p-5 ${p.active ? 'border-slate-200' : 'border-dashed border-slate-300 opacity-80'}`}>
                  <div className="flex items-center justify-between">
                    <h2 className="text-[16px] font-black tracking-widest">{p.code}</h2>
                    <label className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-700">
                      <input type="checkbox" checked={d.active ?? p.active} onChange={(e) => edit(p.code, { active: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
                      판매 중
                    </label>
                  </div>

                  <label className="block mt-4">
                    <span className="text-[12.5px] font-bold text-slate-600">표시 이름</span>
                    <input value={d.name ?? p.name} onChange={(e) => edit(p.code, { name: e.target.value })} className="input mt-1 w-full" />
                  </label>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <label className="block">
                      <span className="text-[12.5px] font-bold text-slate-600">월 구독료 (원, VAT 별도)</span>
                      <input type="number" min={0} step={1000} value={price} onChange={(e) => edit(p.code, { monthlyPrice: Number(e.target.value) })} className="input mt-1 w-full tabular-nums" />
                    </label>
                    <label className="block">
                      <span className="text-[12.5px] font-bold text-slate-600">선수당 기본 수량</span>
                      <input type="number" min={0} value={d.capacity ?? p.capacity} onChange={(e) => edit(p.code, { capacity: Number(e.target.value) })} className="input mt-1 w-full tabular-nums" />
                    </label>
                  </div>
                  <p className="mt-2 text-[13px] text-slate-600 tabular-nums">
                    {p.termMonths}개월 약정 총액 <b className="text-slate-900">{(price * p.termMonths).toLocaleString()}원</b> · VAT 별도
                  </p>

                  <label className="block mt-3">
                    <span className="text-[12.5px] font-bold text-slate-600">포함 (줄바꿈으로 구분)</span>
                    <textarea rows={4} value={d.benefits ? lines(d.benefits) : lines(p.benefits)} onChange={(e) => edit(p.code, { benefits: toList(e.target.value) })} className="input mt-1 w-full resize-none text-[13px]" />
                  </label>
                  <label className="block mt-3">
                    <span className="text-[12.5px] font-bold text-slate-600">미포함 (줄바꿈으로 구분)</span>
                    <textarea rows={3} value={d.exclusions ? lines(d.exclusions) : lines(p.exclusions)} onChange={(e) => edit(p.code, { exclusions: toList(e.target.value) })} className="input mt-1 w-full resize-none text-[13px]" />
                  </label>

                  <label className="block mt-3">
                    <span className="text-[12.5px] font-bold text-slate-600">변경 사유 <span className="text-rose-500">필수</span></span>
                    <input value={d.reason ?? ''} onChange={(e) => edit(p.code, { reason: e.target.value })} placeholder="예) 2026-10 가격 정책 개정" className="input mt-1 w-full" />
                  </label>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[12px] text-slate-500">마지막 변경 {new Date(p.updatedAt).toLocaleDateString('ko-KR')}</span>
                    <button
                      onClick={() => save(p)}
                      disabled={!dirty || saving === p.code}
                      className="h-10 px-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 text-white text-[13px] font-bold disabled:opacity-40"
                    >
                      {saved === p.code ? <><CheckCircle2 className="w-4 h-4" /> 저장됨</> : <><Save className="w-4 h-4" /> {saving === p.code ? '저장 중…' : '저장'}</>}
                    </button>
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <p className="text-[12.5px] text-slate-500 break-keep">
          자동갱신 기본값·중도해지 규정은 법무 확정 전까지 feature flag로 관리합니다 (v2.1 부록 B). 모든 변경은 관리자 감사로그에 사유와 함께 기록됩니다.
        </p>
      </div>
    </Layout>
  );
}
