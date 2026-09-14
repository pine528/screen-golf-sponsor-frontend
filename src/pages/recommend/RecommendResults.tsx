/**
 * 추천 PICK — 3안 결과 (핸드오프 v1.0 §7, 시안 img_19)
 *
 * 선수 순위가 아니라 실행 가능한 후원안 3개를 비교한다 (RP-02).
 * 기대지표는 추정치를 만들지 않고 실측 합계만 노출한다 (§17.1 · LEG-06).
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle, BadgeCheck, Check, ChevronRight, Download, Eye, Info, RefreshCw,
  Sparkles, Users, Wallet,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import { api } from '../../services/api';
import { RESULT_STORAGE_KEY } from './RecommendAnalyzing';

const STEPS = ['브랜드 정보', '후원 조건', '추천 결과', '세부 비교', '선수 승인', '제안 완료'];

const PLAN_TONE: Record<string, { chip: string; ring: string; bar: string }> = {
  STABLE: { chip: 'bg-sky-100 text-sky-700', ring: 'border-slate-200', bar: 'bg-sky-500' },
  BALANCED: { chip: 'bg-emerald-100 text-emerald-700', ring: 'border-emerald-400 ring-2 ring-emerald-100', bar: 'bg-emerald-500' },
  CHALLENGE: { chip: 'bg-violet-100 text-violet-700', ring: 'border-slate-200', bar: 'bg-violet-500' },
};

export default function RecommendResults() {
  const { requestId } = useParams();
  const { state } = useLocation() as { state?: { data?: any } };
  const navigate = useNavigate();
  const [data, setData] = useState<any>(state?.data || null);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  /* 추천안으로 신청 — 브랜드 로그인 필요(§16.1), 비로그인은 로그인 후 복귀 */
  const submitPlan = async (plan: any) => {
    setSubmitting(true);
    setSubmitErr(null);
    try {
      const r: any = await api.submitApplication({
        sourceId: data.requestId,
        planKey: plan.key,
        planName: plan.name,
        durationMonths: 1,
        items: plan.members.map((m: any) => ({
          athleteId: m.athleteId,
          slotCode: m.slot?.code,
          slotName: m.slot?.name,
          role: m.role,
        })),
        snapshot: { brief: data.brief, plan, engineVersion: data.engineVersion, dataAsOf: data.dataAsOf },
      });
      navigate(`/sponsor/applications/${r.data.id}`);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401) {
        navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      setSubmitErr(
        status === 403
          ? '브랜드 계정으로 로그인하면 신청할 수 있어요.'
          : e?.response?.data?.error?.message || '신청에 실패했습니다. 잠시 후 다시 시도해주세요.',
      );
    } finally { setSubmitting(false); }
  };

  useEffect(() => {
    if (data) return;
    try {
      const cached = JSON.parse(sessionStorage.getItem(RESULT_STORAGE_KEY) || 'null');
      if (cached?.plans?.length) { setData(cached); return; }
    } catch { /* 무시 */ }
    if (!requestId) { navigate('/sponsor/recommended', { replace: true }); return; }
    (async () => {
      try {
        const r: any = await api.getRecommendPick(requestId);
        if (r?.data) setData(r.data);
        else navigate('/sponsor/recommended', { replace: true });
      } catch { navigate('/sponsor/recommended', { replace: true }); }
    })();
  }, [data, requestId, navigate]);

  const plans: any[] = data?.plans || [];
  const brief = data?.brief;

  const maxTotal = useMemo(() => Math.max(1, ...plans.map((p) => p.total)), [plans]);

  if (!data) {
    return (
      <div className="min-h-screen bg-white">
        <PublicHeader />
        <div className="max-w-4xl mx-auto px-5 py-24 text-center">
          <div className="w-10 h-10 rounded-full border-4 border-emerald-100 border-t-emerald-500 animate-spin mx-auto" />
          <p className="mt-4 text-[13.5px] text-slate-400">추천 결과를 불러오는 중…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 pb-24">
      <PublicHeader />

      {/* 단계 바 */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-5 py-3.5 flex items-center gap-2 overflow-x-auto">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5 shrink-0">
              <span className={`w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center ${
                i < 2 ? 'bg-emerald-100 text-emerald-700' : i === 2 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
              }`}>{i + 1}</span>
              <span className={`text-[12px] font-bold ${i === 2 ? 'text-emerald-700' : 'text-slate-400'}`}>{s}</span>
              {i < STEPS.length - 1 && <span className="w-6 h-px bg-slate-200 mx-1" />}
            </div>
          ))}
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-5 pt-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="text-[24px] sm:text-[30px] font-extrabold tracking-[-0.02em] break-keep">
              실행 가능한 후원안 {plans.length}개를 조합했습니다
            </h1>
            <p className="mt-2 text-[14px] text-slate-600 break-keep">
              선수 순위가 아니라 예산 안에서 실제로 진행할 수 있는 조합입니다. 근거 · 기준일 · 데이터 충분도를 함께 확인하세요.
            </p>
          </div>
          <div className="flex gap-2.5 shrink-0">
            <Link to="/sponsor/recommended/brief" className="h-11 px-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-[13px] font-bold hover:bg-slate-50">
              <RefreshCw className="w-4 h-4" /> 조건 다시 입력
            </Link>
            <button
              onClick={() => window.print()}
              className="h-11 px-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-[13px] font-bold hover:bg-slate-50"
            >
              <Download className="w-4 h-4" /> 제안서 저장
            </button>
          </div>
        </div>

        {/* 조건 요약 */}
        {brief && (
          <div className="mt-5 rounded-xl bg-white border border-slate-200 px-4 py-3 flex flex-wrap items-center gap-2.5">
            <span className="text-[12px] font-black text-slate-500">입력 조건</span>
            {[brief.objectiveLabel, brief.budgetLabel, brief.durationLabel].filter(Boolean).map((c: string) => (
              <span key={c} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[12px] font-bold">{c}</span>
            ))}
            <span className="ml-auto text-[11.5px] text-slate-400">
              후보 {data.candidateCount}명 검토 · 기준일 {data.dataAsOf ? new Date(data.dataAsOf).toLocaleDateString('ko-KR') : '-'}
            </span>
          </div>
        )}

        {/* 예산 부족 — 빈 결과 대신 최소 금액과 완화안 (§2.4) */}
        {data.budgetGap && (
          <div className="mt-6 rounded-2xl bg-white border border-amber-200 p-6 sm:p-8 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
            <h2 className="mt-4 text-[18px] font-black break-keep">{data.budgetGap.message}</h2>
            <p className="mt-2 text-[13.5px] text-slate-500 break-keep">
              아래 방법으로 지금 바로 시작할 수 있어요.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-2.5 justify-center">
              <Link
                to="/sponsor/recommended/brief"
                className="h-12 px-6 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white text-[13.5px] font-bold hover:bg-emerald-700"
              >
                예산 조건 다시 입력 <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                to="/digital-partner"
                className="h-12 px-6 inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-600 text-emerald-700 text-[13.5px] font-bold hover:bg-emerald-50"
              >
                디지털 파트너 월 구독 보기
              </Link>
            </div>
            <p className="mt-4 text-[11.5px] text-slate-400">
              최소 필요 금액은 현재 판매 중인 슬롯 실거래가 기준입니다.
            </p>
          </div>
        )}

        {data.partial && (
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-[12.5px] text-amber-800">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            현재 조건에서 만들 수 있는 조합만 제시했습니다. 예산이나 조건을 넓히면 더 많은 안을 볼 수 있어요.
          </p>
        )}

        {/* 3안 카드 */}
        <div className="mt-6 grid lg:grid-cols-3 gap-4 items-start">
          {plans.map((p) => {
            const tone = PLAN_TONE[p.key] || PLAN_TONE.STABLE;
            const on = selected === p.key;
            return (
              <article
                key={p.key}
                className={`rounded-2xl bg-white border p-5 sm:p-6 transition-all ${on ? 'border-emerald-500 ring-2 ring-emerald-100' : tone.ring}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-[12px] font-black ${tone.chip}`}>{p.name}</span>
                    {p.badge && (
                      <span className="px-2 py-1 rounded-lg bg-emerald-500 text-white text-[11px] font-black">{p.badge}</span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-slate-400 font-bold">월 총액</p>
                    <p className="text-[22px] font-black leading-none tabular-nums">
                      {Math.round(p.total / 10000)}<span className="text-[13px] font-bold text-slate-400">만원</span>
                    </p>
                  </div>
                </div>
                <p className="mt-1.5 text-[12px] text-slate-400 font-semibold">{p.tagline}</p>

                {/* 예산 사용 바 */}
                <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${Math.min(100, (p.total / maxTotal) * 100)}%` }} />
                </div>

                {/* 멤버 */}
                <ul className="mt-4 space-y-2.5">
                  {p.members.map((m: any) => (
                    <li key={m.athleteId} className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 shrink-0">
                        {m.profileImageUrl && <img src={m.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="text-[13.5px] font-extrabold truncate">{m.name}</span>
                          {/* 데이터 충분도 표시 — 노출 이력이 아니라 확보된 지표 기준 (§6.4) */}
                          {m.confidence === 'LOW' && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 text-[9.5px] font-black shrink-0" title="지표를 수집 중인 선수입니다">
                              수집 중
                            </span>
                          )}
                        </span>
                        <span className="block text-[11px] text-slate-400">{m.tour}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold whitespace-nowrap">
                          {m.slot?.name || m.role}
                        </span>
                        <span className="block mt-1 text-[11.5px] font-bold text-slate-600">적합도 {m.fitScore}%</span>
                      </span>
                    </li>
                  ))}
                </ul>

                {/* 근거 — 모든 안에 최대 3개 (§7.4 근거를 숨기지 않는다) */}
                {(p.reasons?.length ?? 0) > 0 && (
                  <div className={`mt-4 rounded-xl p-3.5 ${p.key === 'BALANCED' ? 'bg-emerald-50/70' : 'bg-slate-50'}`}>
                    <p className={`flex items-center gap-1.5 text-[12.5px] font-extrabold mb-2 ${p.key === 'BALANCED' ? 'text-emerald-800' : 'text-slate-700'}`}>
                      <Sparkles className="w-3.5 h-3.5" /> 이 조합의 근거
                    </p>
                    <ul className="space-y-1.5">
                      {p.reasons.slice(0, 3).map((r: any) => (
                        <li key={r.code} className="flex items-start gap-1.5 text-[12.5px] text-slate-600 break-keep">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span><b className="text-slate-800">{r.label}</b> {r.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {p.key === 'CHALLENGE' && (
                  <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-violet-50 px-3 py-2.5 text-[12.5px] text-violet-800 break-keep">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    성장 가능성을 우선한 조합입니다. 데이터가 적은 선수가 포함될 수 있어 예상 범위의 불확실성이 큽니다.
                  </p>
                )}

                {/* 실측 지표 */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-[12px] font-extrabold text-slate-500 mb-2.5">구성 지표 <span className="font-bold">(실측 · 추정 없음)</span></p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { icon: Users, k: '선수', v: `${p.metrics.athletes}명` },
                      { icon: Eye, k: 'SNS 팔로워', v: p.metrics.totalFollowers ? `${(p.metrics.totalFollowers / 10000).toFixed(1)}만` : '수집 중' },
                      { icon: BadgeCheck, k: '데이터 충분도', v: p.members.every((m: any) => m.confidence !== 'LOW') ? '충분' : '일부 수집 중' },
                    ].map((s) => (
                      <div key={s.k} className="text-center">
                        <s.icon className="w-4 h-4 text-slate-400 mx-auto" />
                        <p className="mt-1 text-[13px] font-black tabular-nums">{s.v}</p>
                        <p className="text-[10px] text-slate-400">{s.k}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Link
                    to={`/sponsor/recommended/results/${data.requestId}/plan/${p.key}`}
                    className="h-11 inline-flex items-center justify-center rounded-xl border border-slate-200 text-slate-700 text-[13px] font-bold hover:bg-slate-50"
                  >
                    근거 보기
                  </Link>
                  <button
                    onClick={() => setSelected(p.key)}
                    className={`h-11 inline-flex items-center justify-center rounded-xl text-[13px] font-bold transition-colors ${
                      on ? 'bg-emerald-700 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {on ? '검토 중' : '이 추천안 검토'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <p className="mt-5 flex items-start gap-1.5 text-[12.5px] text-slate-500 break-keep">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            기준일 {data.dataAsOf ? new Date(data.dataAsOf).toLocaleDateString('ko-KR') : '-'}
            {data.engineVersion ? ` · 엔진 ${data.engineVersion}` : ''} · 금액은 VAT 별도이며 신청 시 재고·가격·승인 가능 여부를 다시 검증합니다.
            같은 선수는 여러 안에 반복 노출하지 않습니다.
          </span>
        </p>
      </section>

      {/* 선택 시 하단 고정 바 */}
      {selected && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 px-5 py-3">
          {submitErr && (
            <p className="max-w-7xl mx-auto mb-2 text-[12.5px] font-bold text-rose-600">{submitErr}</p>
          )}
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[11.5px] text-slate-400 font-bold">선택한 추천안</p>
              <p className="text-[14.5px] font-extrabold truncate">
                {plans.find((p) => p.key === selected)?.name} ·{' '}
                {plans.find((p) => p.key === selected)?.members.map((m: any) => m.name).join(' · ')}
              </p>
            </div>
            <div className="text-right shrink-0 hidden sm:block">
              <p className="text-[11.5px] text-slate-400 font-bold">월 총액 (VAT 별도)</p>
              <p className="text-[17px] font-black tabular-nums">
                ₩{plans.find((p) => p.key === selected)?.total.toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => submitPlan(plans.find((p) => p.key === selected))}
              disabled={submitting}
              className="shrink-0 h-12 px-7 inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white text-[14px] font-bold hover:bg-emerald-700 disabled:opacity-50"
            >
              <Wallet className="w-4 h-4" /> {submitting ? '신청 중…' : '이 안으로 신청'} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
