/**
 * AI 간편 매칭 — 입력 화면 (/ai-match) · 핸드오프 v1.0 §2, §6.1
 *
 * PC: 좌측 6단계 조건 입력 + 우측 'AI 매칭 요약' 패널(예상 후보 수 preview).
 * 모바일: 세로 카드 + 하단 고정 CTA (§7.1).
 * 필수 5개(브랜드 유형·목적·방식·예산 + 선호선수는 선택) 미완료 시 CTA 비활성 (AC-01).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Briefcase,
  ClipboardList,
  Clock3,
  FileText,
  Info,
  Search,
  Sparkles,
  Star,
  Tag,
  Target,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import Breadcrumb from '../../components/Breadcrumb';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

export const BRAND_TYPES = [
  { key: 'BEAUTY', label: '화장품' },
  { key: 'FOOD', label: '식음료' },
  { key: 'FASHION', label: '패션' },
  { key: 'HEALTH', label: '건강' },
  { key: 'LOCAL', label: '지역브랜드' },
  { key: 'ETC', label: '기타' },
];
export const GOALS = [
  { key: 'BRAND_AWARENESS', label: '브랜드 노출' },
  { key: 'SNS_CONTENT', label: 'SNS 콘텐츠' },
  { key: 'FAN_STORE', label: '팬스토어 판매' },
  { key: 'LONG_TERM', label: '장기 후원' },
  { key: 'EVENT_TEST', label: '대회 테스트' },
];
export const METHODS = [
  { key: 'AUCTION', label: '라이브 경매' },
  { key: 'DIRECT', label: '직접 구매' },
  { key: 'MONTHLY', label: '월간 계약' },
  { key: 'YEARLY', label: '연간 계약' },
  { key: 'AI_RECOMMEND', label: 'AI 추천에 맡기기' },
];
const BUDGET_PRESETS = [
  { label: '50만원 이하', min: 100000, max: 500000 },
  { label: '50~100만원', min: 500000, max: 1000000 },
  { label: '100~300만원', min: 1000000, max: 3000000 },
  { label: '300만원 이상', min: 3000000, max: 10000000 },
];

const MIN_BUDGET = 100000;
const MAX_BUDGET = 10000000;
const fmtMan = (v: number) => (v >= 10000000 ? '1,000만원+' : `${Math.round(v / 10000)}만원`);

export const labelOf = (list: { key: string; label: string }[], key?: string) =>
  list.find((x) => x.key === key)?.label || key || '-';

/** 브랜드 전용 게이트 (2026-08-12 사용자 결정) — 결과/비교/제안 페이지에서도 재사용 */
export function AiMatchBrandGate() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <div className="max-w-lg mx-auto px-5 py-20 text-center">
        <span className="inline-flex w-16 h-16 rounded-3xl bg-emerald-50 items-center justify-center mb-5">
          <Sparkles className="w-7 h-7 text-emerald-600" />
        </span>
        <h1 className="text-2xl font-black text-slate-900 mb-2">
          AI 간편 매칭은 <span className="text-emerald-600">브랜드 회원 전용</span>입니다
        </h1>
        <p className="text-sm text-slate-500 break-keep leading-relaxed mb-8">
          브랜드로 로그인하시면 귀사의 업종과 협업 이력을 반영한
          <br className="hidden sm:block" />
          맞춤 선수·후원방식 추천을 받을 수 있어요.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <a href="/login" className="h-12 px-6 inline-flex items-center justify-center rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700">
            브랜드 로그인
          </a>
          <a href="/brand-register" className="h-12 px-6 inline-flex items-center justify-center rounded-xl border border-emerald-600 text-emerald-700 text-sm font-bold hover:bg-emerald-50">
            브랜드 등록하기
          </a>
        </div>
        <p className="text-[11px] text-slate-400 mt-6">선수·팬 회원은 라이브 경매와 성장마켓을 이용해보세요.</p>
      </div>
    </div>
  );
}

export default function AiMatch() {
  const { isAuthenticated, user } = useAuth();
  const isBrand = isAuthenticated && (user as any)?.role === 'BRAND';
  if (!isBrand) return <AiMatchBrandGate />;
  return <AiMatchForm />;
}

function AiMatchForm() {
  const navigate = useNavigate();
  const [brandType, setBrandType] = useState<string | null>(null);
  const [goals, setGoals] = useState<Set<string>>(new Set());
  const [method, setMethod] = useState<string | null>(null);
  const [preferred, setPreferred] = useState<{ id: string; name: string; profileImageUrl?: string }[]>([]);
  const [budget, setBudget] = useState<{ min: number; max: number }>({ min: 1000000, max: 3000000 });
  const [presetIdx, setPresetIdx] = useState<number | null>(2);
  const [includeSns, setIncludeSns] = useState(true);
  const [includeGrowthMarket, setIncludeGrowthMarket] = useState(true);
  const [guarantee, setGuarantee] = useState(false);
  const [athleteQuery, setAthleteQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [stageIdx, setStageIdx] = useState(0);

  /* 분석 단계 문구 (SIE §14.1) */
  const STAGES = [
    'SPONPIK 선수 데이터로 1차 후보를 찾고 있습니다…',
    '선수별 패치·SNS·팬·커머스 적합도를 계산하고 있습니다…',
    '예산 안에서 가장 효과적인 후원 조합을 설계하고 있습니다…',
  ];
  useEffect(() => {
    if (!submitting) { setStageIdx(0); return; }
    const t = setInterval(() => setStageIdx((i) => Math.min(i + 1, STAGES.length - 1)), 1300);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitting]);
  const submitLabel = submitting ? STAGES[stageIdx] : null;

  /* 브랜드 컨텍스트 — 업종·최근 조건 프리필 (§2.1 브랜드 프로필 기본값) */
  const { data: ctxResp } = useQuery({
    queryKey: ['ai-match-brand-context'],
    queryFn: () => api.aiMatchBrandContext(),
    staleTime: 300_000,
  });
  const brandCtx = (ctxResp as any)?.data;
  const [prefilled, setPrefilled] = useState(false);
  useEffect(() => {
    if (!brandCtx || prefilled) return;
    setPrefilled(true);
    const li = brandCtx.lastInput;
    if (li) {
      setBrandType(li.brandType);
      setGoals(new Set(li.goals || []));
      setMethod(li.preferredMethod);
      if (li.budget?.min && li.budget?.max) { setBudget(li.budget); setPresetIdx(null); }
      setIncludeSns(!!li.options?.includeSns);
      setIncludeGrowthMarket(!!li.options?.includeGrowthMarket);
      setGuarantee(!!li.options?.performanceGuarantee50);
    } else if (brandCtx.suggestedBrandType && brandCtx.suggestedBrandType !== 'ETC') {
      setBrandType(brandCtx.suggestedBrandType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandCtx, prefilled]);

  /* 선수 검색/추천 칩 */
  const { data: athleteResp } = useQuery({
    queryKey: ['ai-match-athletes', athleteQuery],
    queryFn: () => api.listPublicAthletes({ q: athleteQuery || undefined, limit: athleteQuery ? 8 : 6 }),
    staleTime: 60_000,
  });
  const athleteItems: any[] = (athleteResp as any)?.data?.items || [];

  const input = useMemo(
    () => ({
      brandType,
      goals: [...goals],
      preferredMethod: method,
      preferredAthleteIds: preferred.map((p) => p.id),
      budget,
      options: { includeSns, includeGrowthMarket, performanceGuarantee50: guarantee },
    }),
    [brandType, goals, method, preferred, budget, includeSns, includeGrowthMarket, guarantee],
  );

  const valid = !!brandType && goals.size > 0 && !!method && budget.min <= budget.max;

  /* 예상 후보 수 preview — debounce (§6.1) */
  const [preview, setPreview] = useState<number | null>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (!valid) { setPreview(null); return; }
    clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(async () => {
      try {
        const r = await api.aiMatchPreview(input);
        setPreview((r as any)?.data?.candidateCount ?? null);
      } catch { setPreview(null); }
    }, 450);
    return () => clearTimeout(previewTimer.current);
  }, [valid, input]);

  const toggleGoal = (g: string) => {
    const next = new Set(goals);
    next.has(g) ? next.delete(g) : next.add(g);
    setGoals(next);
  };
  const togglePreferred = (a: any) => {
    if (preferred.some((p) => p.id === a.id)) setPreferred(preferred.filter((p) => p.id !== a.id));
    else if (preferred.length < 3) setPreferred([...preferred, { id: a.id, name: a.name, profileImageUrl: a.profileImageUrl }]);
  };
  const applyPreset = (i: number) => {
    setPresetIdx(i);
    setBudget({ min: BUDGET_PRESETS[i].min, max: BUDGET_PRESETS[i].max });
  };

  const submit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const r = await api.aiMatchCreate(input);
      const data = (r as any)?.data;
      // POST 응답에는 input이 없으므로(조회 GET에만 포함) 조건 요약 바용으로 함께 실어 보낸다
      if (data?.requestId) navigate(`/ai-match/${data.requestId}`, { state: { result: { ...data, input } } });
      else setSubmitError('추천을 완료하지 못했습니다. 다시 시도해주세요.');
    } catch {
      setSubmitError('추천을 완료하지 못했습니다. 입력값은 유지되니 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24 lg:pb-0">
      <PublicHeader />
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-5">
        <Breadcrumb className="mb-0" />
      </div>

      {/* 헤더 */}
      <section className="px-5 sm:px-8 pt-2 pb-6 bg-gradient-to-b from-emerald-50/50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              AI 간편 <span className="text-emerald-600">매칭</span>
            </h1>
          </div>
          <p className="text-sm text-slate-500 break-keep">
            브랜드 유형, 목표, 선호 방식, 선수, 예산만 입력하면 SPONPIK AI가 최적의 선수와 스폰서십 방식을 추천해드려요.
          </p>
          {brandCtx && (
            <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-[12px] font-bold text-emerald-800 break-keep">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              「{brandCtx.brandName}」 맞춤 — {brandCtx.lastInput ? '최근 매칭 조건을 불러왔어요' : `업종(${brandCtx.category}) 기준 자동 설정`}
              {brandCtx.collaboratedAthleteCount > 0 && ` · 협업 이력 ${brandCtx.collaboratedAthleteCount}명 가점`}
            </span>
          )}

          {/* 단계 표시 (§6.1) */}
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-3 flex items-center gap-2 overflow-x-auto">
            {[
              { icon: ClipboardList, label: '정보 입력', active: true },
              { icon: Clock3, label: 'AI 분석 중' },
              { icon: Star, label: '추천 결과 확인' },
              { icon: FileText, label: '상세 제안 보기' },
            ].map((s, i, arr) => (
              <div key={s.label} className="flex items-center gap-2 shrink-0">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold ${
                    s.active ? 'bg-emerald-600 text-white' : 'text-slate-400'
                  }`}
                >
                  <s.icon className="w-3.5 h-3.5" /> {i + 1} {s.label}
                </span>
                {i < arr.length - 1 && <span className="w-8 sm:w-16 h-px bg-slate-200" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 본문 */}
      <section className="px-5 sm:px-8 pb-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)] gap-5 items-start">
          {/* 좌: 조건 입력 */}
          <div className="rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-6">
            <Field n={1} label="브랜드 유형">
              <ChipGroup items={BRAND_TYPES} selected={brandType ? [brandType] : []} onToggle={(k) => setBrandType(k)} />
            </Field>

            <Field n={2} label="스폰픽 이용 목적" hint="복수 선택 가능">
              <ChipGroup items={GOALS} selected={[...goals]} onToggle={toggleGoal} />
            </Field>

            <Field n={3} label="선호하는 방식">
              <ChipGroup items={METHODS} selected={method ? [method] : []} onToggle={(k) => setMethod(k)} />
            </Field>

            <Field n={4} label="선호 선수" hint="선택 · 최대 3명">
              <div className="relative mb-3">
                <input
                  value={athleteQuery}
                  onChange={(e) => setAthleteQuery(e.target.value)}
                  placeholder="선수 이름을 검색해보세요"
                  className="w-full h-11 pl-4 pr-10 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400"
                />
                <Search className="absolute right-3.5 top-3 w-5 h-5 text-slate-300" />
              </div>
              <div className="flex flex-wrap gap-2">
                {athleteItems.map((a) => {
                  const on = preferred.some((p) => p.id === a.id);
                  return (
                    <button
                      key={a.id}
                      onClick={() => togglePreferred(a)}
                      className={`inline-flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full border text-[12px] font-bold transition-colors ${
                        on ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className="w-7 h-7 rounded-full overflow-hidden bg-slate-100 shrink-0">
                        {a.profileImageUrl && <img src={a.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}
                      </span>
                      {a.name}
                      {on && <X className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field n={5} label="예산 범위">
              <div className="flex flex-wrap gap-2 mb-4">
                {BUDGET_PRESETS.map((p, i) => (
                  <Chip key={p.label} label={p.label} on={presetIdx === i} onClick={() => applyPreset(i)} />
                ))}
              </div>
              {/* 듀얼 레인지 슬라이더 (프리셋과 동기화) */}
              <div className="px-1">
                <div className="relative h-6">
                  <div className="absolute top-2.5 inset-x-0 h-1 rounded bg-slate-100" />
                  <div
                    className="absolute top-2.5 h-1 rounded bg-emerald-500"
                    style={{
                      left: `${((budget.min - MIN_BUDGET) / (MAX_BUDGET - MIN_BUDGET)) * 100}%`,
                      right: `${100 - ((budget.max - MIN_BUDGET) / (MAX_BUDGET - MIN_BUDGET)) * 100}%`,
                    }}
                  />
                  <input
                    type="range" min={MIN_BUDGET} max={MAX_BUDGET} step={100000} value={budget.min}
                    onChange={(e) => { setPresetIdx(null); setBudget({ ...budget, min: Math.min(Number(e.target.value), budget.max) }); }}
                    className="ai-range absolute inset-x-0 top-0 w-full h-6 appearance-none bg-transparent pointer-events-none"
                  />
                  <input
                    type="range" min={MIN_BUDGET} max={MAX_BUDGET} step={100000} value={budget.max}
                    onChange={(e) => { setPresetIdx(null); setBudget({ ...budget, max: Math.max(Number(e.target.value), budget.min) }); }}
                    className="ai-range absolute inset-x-0 top-0 w-full h-6 appearance-none bg-transparent pointer-events-none"
                  />
                </div>
                <div className="flex justify-between text-[12px] font-bold text-slate-500 tabular-nums">
                  <span>{fmtMan(budget.min)}</span>
                  <span>{fmtMan(budget.max)}</span>
                </div>
              </div>
              <style>{`.ai-range::-webkit-slider-thumb{appearance:none;width:18px;height:18px;border-radius:9999px;background:#059669;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.25);pointer-events:auto;cursor:pointer}`}</style>
            </Field>

            <Field n={6} label="추가 옵션" hint="선택">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Toggle label="SNS 포함" on={includeSns} onClick={() => setIncludeSns(!includeSns)} />
                <Toggle label="팬스토어 연계" on={includeGrowthMarket} onClick={() => setIncludeGrowthMarket(!includeGrowthMarket)} />
                <Toggle label="성과보장 50 우선" on={guarantee} onClick={() => setGuarantee(!guarantee)} />
              </div>
            </Field>

            <p className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1 border-t border-slate-100">
              <Info className="w-3.5 h-3.5 shrink-0" /> 입력하신 정보는 AI 매칭 분석에만 사용되며, 외부에 공개되지 않습니다.
            </p>
          </div>

          {/* 우: AI 매칭 요약 */}
          <div className="lg:sticky lg:top-20 rounded-2xl border border-slate-200 p-5">
            <h2 className="text-[15px] font-extrabold text-slate-900 mb-4">AI 매칭 요약</h2>
            <dl className="space-y-2.5 mb-5">
              <SummaryRow icon={Briefcase} label="브랜드 유형" value={brandType ? labelOf(BRAND_TYPES, brandType) : '미선택'} />
              <SummaryRow icon={Target} label="이용 목적" value={goals.size ? [...goals].map((g) => labelOf(GOALS, g)).join(' · ') : '미선택'} />
              <SummaryRow icon={Box} label="선호 방식" value={method ? labelOf(METHODS, method) : '미선택'} />
              <SummaryRow icon={Users} label="선호 선수" value={preferred.length ? preferred.map((p) => p.name).join(', ') : '지정 선수 없음'} />
              <SummaryRow icon={Wallet} label="예산 범위" value={`${fmtMan(budget.min)}~${fmtMan(budget.max)}`} />
              <SummaryRow icon={Tag} label="추가 옵션" value={[includeSns && 'SNS', includeGrowthMarket && '팬스토어', guarantee && '성과보장 50'].filter(Boolean).join(' · ') || '없음'} />
            </dl>

            <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 mb-4">
              <div className="text-[12px] text-slate-500 mb-0.5">예상 추천 선수 수</div>
              <div className="text-xl font-black text-slate-900 tabular-nums">
                {preview !== null ? `${preview}명` : valid ? '계산 중…' : '조건을 입력해주세요'}
              </div>
              <div className="text-[10px] text-slate-400">현재 판매 가능한 슬롯 보유 선수 기준</div>
            </div>

            <div className="rounded-xl bg-emerald-50/70 border border-emerald-100 px-3.5 py-2.5 mb-4 flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-600 break-keep">AI가 브랜드 목표와 예산에 최적화된 선수와 스폰서십 방식을 추천해드려요.</p>
            </div>

            {submitError && <p className="text-[12px] font-bold text-rose-600 mb-2">{submitError}</p>}
            <button
              onClick={submit}
              disabled={!valid || submitting}
              className={`hidden lg:inline-flex w-full h-12 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors ${
                valid ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0" /> <span className="truncate">{submitLabel || 'AI 추천 받기'}</span>
            </button>
            <p className="hidden lg:block text-center text-[11px] text-slate-400 mt-2">평균 30초 내 결과 확인</p>
          </div>
        </div>
      </section>

      {/* 모바일 하단 고정 CTA (§7.1) */}
      <div className="lg:hidden fixed bottom-14 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-slate-100 px-5 py-3">
        <button
          onClick={submit}
          disabled={!valid || submitting}
          className={`w-full h-[52px] inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold ${
            valid ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0" />{' '}
          <span className="truncate">{submitLabel || `AI 추천 받기${preview !== null ? ` · 후보 ${preview}명` : ''}`}</span>
        </button>
      </div>
    </div>
  );
}

function Field({ n, label, hint, children }: { n: number; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2.5">
        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center tabular-nums">{n}</span>
        <span className="text-[14px] font-extrabold text-slate-900">{label}</span>
        {hint && <span className="text-[11px] text-slate-400">({hint})</span>}
      </div>
      {children}
    </div>
  );
}

function ChipGroup({ items, selected, onToggle }: { items: { key: string; label: string }[]; selected: string[]; onToggle: (k: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => (
        <Chip key={it.key} label={it.label} on={selected.includes(it.key)} onClick={() => onToggle(it.key)} />
      ))}
    </div>
  );
}

function Chip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl border text-[13px] font-bold transition-colors ${
        on ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-600 hover:border-slate-300'
      }`}
    >
      {label}
    </button>
  );
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center justify-between rounded-xl border border-slate-200 px-3.5 py-2.5 hover:border-slate-300">
      <span className="text-[12px] font-bold text-slate-700">{label}</span>
      <span className={`w-10 h-6 rounded-full p-0.5 transition-colors ${on ? 'bg-emerald-500' : 'bg-slate-200'}`}>
        <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-4' : ''}`} />
      </span>
    </button>
  );
}

function SummaryRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
      <dt className="w-20 shrink-0 text-[12px] text-slate-400">{label}</dt>
      <dd className="text-[12px] font-bold text-slate-800 break-keep text-right flex-1">{value}</dd>
    </div>
  );
}
