/**
 * AI 심층 매칭 — 입력 (/ai-match) · 심층매칭 고도화 핸드오프 v3.0 §2·§3
 *
 * 15개 필드를 한 화면에 나열하지 않고 4개 섹션으로 묶는다 (§1 UI 원칙):
 *  ① 기본 조건(유형·목적·방식·예산)  ② 브랜드·회사·제품 정보 + URL 자동분석
 *  ③ AI 분석 확인(수정/승인 — 승인값만 Feature, AC-02)  ④ 마케팅 현황·KPI·추천 스타일
 * 우측 'AI 매칭 브리프'에 분석 준비도와 요약 표시. 브랜드 회원 전용.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Briefcase, Check, ClipboardList, Clock3, Globe, Info, Instagram,
  Link2, Search, Sparkles, Star, Store, Tag, Target, Users, Wallet, X, Youtube,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import Breadcrumb from '../../components/Breadcrumb';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

export const BRAND_TYPES = [
  { key: 'BEAUTY', label: '화장품·뷰티' },
  { key: 'FOOD', label: '식음료' },
  { key: 'FASHION', label: '패션' },
  { key: 'HEALTH', label: '헬스·건강' },
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
const CHANNELS = [
  { key: 'INSTAGRAM', label: 'Instagram' },
  { key: 'YOUTUBE', label: 'YouTube' },
  { key: 'HOMESHOPPING', label: '홈쇼핑' },
  { key: 'D2C', label: '자사몰' },
  { key: 'OFFLINE', label: '오프라인 매장' },
  { key: 'PR', label: 'PR/언론' },
];
const ACTIONS = [
  { key: 'SEARCH', label: '브랜드 검색' },
  { key: 'SITE_VISIT', label: '사이트 방문' },
  { key: 'NEW_CUSTOMER', label: '신규 고객 유입' },
  { key: 'PURCHASE', label: '제품 구매' },
  { key: 'SNS_ENGAGE', label: 'SNS 참여' },
  { key: 'STORE_VISIT', label: '매장 방문' },
];
const AGES = [
  { key: '20s', label: '20대' },
  { key: '30-40s', label: '30~40대' },
  { key: '50s+', label: '50대+' },
];
const STYLES = [
  { key: 'BEST', label: '최적 매칭', desc: '점수 우선' },
  { key: 'BALANCED', label: '균형 있게', desc: '품질+다양성' },
  { key: 'DISCOVERY', label: '새로운 선수도 발견', desc: '디스커버리 확대' },
];
const PORTFOLIO_MODES = [
  { key: 'AUTO', label: 'AI가 판단' },
  { key: 'SINGLE', label: '1명 집중' },
  { key: 'MULTI', label: '2~3명 조합' },
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
          AI 심층 매칭은 <span className="text-emerald-600">브랜드 회원 전용</span>입니다
        </h1>
        <p className="text-sm text-slate-500 break-keep leading-relaxed mb-8">
          브랜드로 로그인하시면 귀사의 제품·채널·마케팅 목표를 분석해
          <br className="hidden sm:block" />
          역할별 맞춤 선수·후원 조합을 설계해드려요.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <a href="/login" className="h-12 px-6 inline-flex items-center justify-center rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700">
            브랜드 로그인
          </a>
          <a href="/brand-register" className="h-12 px-6 inline-flex items-center justify-center rounded-xl border border-emerald-600 text-emerald-700 text-sm font-bold hover:bg-emerald-50">
            브랜드 등록하기
          </a>
        </div>
        <p className="text-[12px] text-slate-500 mt-6">선수·팬 회원은 라이브 경매와 성장마켓을 이용해보세요.</p>
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

  /* ① 기본 조건 */
  const [brandType, setBrandType] = useState<string | null>(null);
  const [goals, setGoals] = useState<Set<string>>(new Set());
  const [method, setMethod] = useState<string | null>('AI_RECOMMEND');
  const [budget, setBudget] = useState<{ min: number; max: number }>({ min: 1000000, max: 3000000 });
  const [presetIdx, setPresetIdx] = useState<number | null>(2);

  /* ② 브랜드·회사·제품 정보 */
  const [brandName, setBrandName] = useState('');
  const [homepage, setHomepage] = useState('');
  const [description, setDescription] = useState('');
  const [productUrls, setProductUrls] = useState<string[]>(['']);
  const [instagramUrl, setInstagramUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [storeUrl, setStoreUrl] = useState('');

  /* ③ AI 분석 (초안 → 사용자 수정 → 승인) */
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null); // { urls, draft, completeness }
  const [profileKeywords, setProfileKeywords] = useState('');
  const [profilePriceTier, setProfilePriceTier] = useState('');
  const [profileApproved, setProfileApproved] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  /* ④ 마케팅 현황·KPI */
  const [channels, setChannels] = useState<Set<string>>(new Set());
  const [actions, setActions] = useState<Set<string>>(new Set());
  const [ages, setAges] = useState<Set<string>>(new Set());
  const [gender, setGender] = useState<string | null>(null);
  const [style, setStyle] = useState<string>('BALANCED');
  const [portfolioMode, setPortfolioMode] = useState<string>('AUTO');

  /* 선호 선수 + 옵션 (기존 유지) */
  const [preferred, setPreferred] = useState<{ id: string; name: string; profileImageUrl?: string }[]>([]);
  const [athleteQuery, setAthleteQuery] = useState('');
  const [includeSns, setIncludeSns] = useState(true);
  const [includeGrowthMarket, setIncludeGrowthMarket] = useState(true);
  const [guarantee, setGuarantee] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [stageIdx, setStageIdx] = useState(0);
  const STAGES = [
    'SPONPIK 선수 데이터로 1차 후보를 찾고 있습니다…',
    '브랜드 정보와 채널 적합도를 계산하고 있습니다…',
    '역할별 최적 조합과 다양성을 설계하고 있습니다…',
  ];
  useEffect(() => {
    if (!submitting) { setStageIdx(0); return; }
    const t = setInterval(() => setStageIdx((i) => Math.min(i + 1, STAGES.length - 1)), 1300);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitting]);

  /* 브랜드 컨텍스트 — 저장 프로필·최근 조건 프리필 (§13 재방문) */
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
    setBrandName(brandCtx.brandName || '');
    if (brandCtx.website) setHomepage(brandCtx.website);
    if (brandCtx.registeredDescription) setDescription(brandCtx.registeredDescription);
    const sp = brandCtx.savedProfile;
    if (sp) {
      if (sp.description) setDescription(sp.description);
      if (sp.brandKeywords?.length) setProfileKeywords(sp.brandKeywords.join(', '));
      if (sp.priceTier) setProfilePriceTier(sp.priceTier);
      setProfileApproved(true);
    }
    const li = brandCtx.lastInput;
    if (li) {
      setBrandType(li.brandType);
      setGoals(new Set(li.goals || []));
      setMethod(li.preferredMethod || 'AI_RECOMMEND');
      if (li.budget?.min && li.budget?.max) { setBudget(li.budget); setPresetIdx(null); }
      if (li.currentChannels) setChannels(new Set(li.currentChannels));
      if (li.desiredActions) setActions(new Set(li.desiredActions));
      if (li.audience?.ages) setAges(new Set(li.audience.ages));
      if (li.audience?.gender) setGender(li.audience.gender);
      if (li.recommendationStyle) setStyle(li.recommendationStyle);
      if (li.portfolioMode) setPortfolioMode(li.portfolioMode);
      setIncludeSns(!!li.options?.includeSns);
      setIncludeGrowthMarket(!!li.options?.includeGrowthMarket);
      setGuarantee(!!li.options?.performanceGuarantee50);
    } else if (brandCtx.suggestedBrandType && brandCtx.suggestedBrandType !== 'ETC') {
      setBrandType(brandCtx.suggestedBrandType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandCtx, prefilled]);

  /* 선수 검색 칩 */
  const { data: athleteResp } = useQuery({
    queryKey: ['ai-match-athletes', athleteQuery],
    queryFn: () => api.listPublicAthletes({ q: athleteQuery || undefined, limit: athleteQuery ? 8 : 6 }),
    staleTime: 60_000,
  });
  const athleteItems: any[] = (athleteResp as any)?.data?.items || [];

  /* URL 자동분석 (§4) */
  const runAnalyze = async () => {
    const urls = [
      homepage && { url: homepage, type: 'homepage' },
      ...productUrls.filter(Boolean).map((u) => ({ url: u, type: 'product' })),
      instagramUrl && { url: instagramUrl.startsWith('http') ? instagramUrl : `https://www.instagram.com/${instagramUrl.replace('@', '')}`, type: 'instagram' },
      youtubeUrl && { url: youtubeUrl, type: 'youtube' },
      storeUrl && { url: storeUrl, type: 'store' },
    ].filter(Boolean) as { url: string; type: string }[];
    if (urls.length === 0) { setAnalysisError('분석할 URL을 1개 이상 입력해주세요.'); return; }
    setAnalyzing(true);
    setAnalysisError(null);
    setProfileApproved(false);
    try {
      const r = await api.aiMatchBrandAnalyze(urls);
      const d = (r as any)?.data;
      setAnalysis(d);
      if (d?.draft) {
        if (!description && d.draft.description) setDescription(d.draft.description);
        if (d.draft.brandKeywords?.length) setProfileKeywords(d.draft.brandKeywords.join(', '));
        if (d.draft.priceTier) setProfilePriceTier(d.draft.priceTier);
        if (!brandName && d.draft.brandNameGuess) setBrandName(d.draft.brandNameGuess);
      }
    } catch {
      setAnalysisError('URL 분석에 실패했습니다. 소개를 직접 입력하셔도 매칭은 진행됩니다.');
    } finally {
      setAnalyzing(false);
    }
  };

  /** 승인된 Brand Profile snapshot (§9.1) — 승인 시에만 매칭 Feature로 전달 */
  const approvedProfile = useMemo(() => {
    if (!profileApproved) return undefined;
    return {
      brandName,
      description,
      brandKeywords: profileKeywords.split(',').map((k) => k.trim()).filter(Boolean).slice(0, 8),
      priceTier: profilePriceTier || null,
      currentChannels: [...channels],
      audience: { ages: [...ages], gender },
      desiredActions: [...actions],
      recommendationStyle: style,
      extractionMethod: analysis?.draft?.extractionMethod || 'MANUAL',
    };
  }, [profileApproved, brandName, description, profileKeywords, profilePriceTier, channels, ages, gender, actions, style, analysis]);

  const approveProfile = async () => {
    setProfileApproved(true);
    try {
      await api.aiMatchBrandProfile({
        brandName, description,
        brandKeywords: profileKeywords.split(',').map((k) => k.trim()).filter(Boolean).slice(0, 8),
        priceTier: profilePriceTier || null,
        urls: { homepage, productUrls: productUrls.filter(Boolean), instagramUrl, youtubeUrl, storeUrl },
        extractionMethod: analysis?.draft?.extractionMethod || 'MANUAL',
      });
    } catch { /* 저장 실패해도 이번 요청에는 스냅샷으로 전달됨 */ }
  };

  /* 준비도 (§3 브리프) — 채운 그룹 비율 */
  const readiness = useMemo(() => {
    const checks = [
      !!brandType, goals.size > 0, !!method, budget.min <= budget.max,
      !!brandName, !!(homepage || description), profileApproved,
      channels.size > 0, actions.size > 0, ages.size > 0 || !!gender,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [brandType, goals, method, budget, brandName, homepage, description, profileApproved, channels, actions, ages, gender]);

  const valid = !!brandType && goals.size > 0 && !!method && budget.min <= budget.max;

  const input = useMemo(() => ({
    brandType,
    goals: [...goals],
    preferredMethod: method,
    preferredAthleteIds: preferred.map((p) => p.id),
    budget,
    options: { includeSns, includeGrowthMarket, performanceGuarantee50: guarantee },
    brandName: brandName || undefined,
    brandDescription: description || undefined,
    currentChannels: channels.size ? [...channels] : undefined,
    audience: ages.size || gender ? { ages: [...ages], gender: gender || undefined } : undefined,
    desiredActions: actions.size ? [...actions] : undefined,
    recommendationStyle: style,
    portfolioMode,
    brandProfile: approvedProfile,
  }), [brandType, goals, method, preferred, budget, includeSns, includeGrowthMarket, guarantee, brandName, description, channels, ages, gender, actions, style, portfolioMode, approvedProfile]);

  /* 예상 후보 수 preview */
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

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, v: string, max?: number) => {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else if (!max || next.size < max) next.add(v);
    setter(next);
  };
  const togglePreferred = (a: any) => {
    if (preferred.some((p) => p.id === a.id)) setPreferred(preferred.filter((p) => p.id !== a.id));
    else if (preferred.length < 3) setPreferred([...preferred, { id: a.id, name: a.name, profileImageUrl: a.profileImageUrl }]);
  };
  const applyPreset = (i: number) => { setPresetIdx(i); setBudget({ min: BUDGET_PRESETS[i].min, max: BUDGET_PRESETS[i].max }); };

  const submit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const r = await api.aiMatchCreate(input);
      const data = (r as any)?.data;
      if (data?.requestId) navigate(`/ai-match/${data.requestId}`, { state: { result: { ...data, input } } });
      else setSubmitError('추천을 완료하지 못했습니다. 다시 시도해주세요.');
    } catch {
      setSubmitError('추천을 완료하지 못했습니다. 입력값은 유지되니 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };
  const submitLabel = submitting ? STAGES[stageIdx] : null;

  return (
    <div className="min-h-screen bg-white pb-24 lg:pb-0">
      <PublicHeader />
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-5">
        <Breadcrumb className="mb-0" />
      </div>

      {/* 헤더 */}
      <section className="px-5 sm:px-8 pt-2 pb-6 bg-gradient-to-b from-emerald-50/50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-[12px] font-black tracking-widest text-emerald-600 mb-1">SPONPIK AI DEEP MATCH</div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 break-keep">
            브랜드를 먼저 이해하고, <span className="text-emerald-600">선수의 역할까지 설계</span>합니다
          </h1>
          <p className="text-sm text-slate-500 break-keep">
            홈페이지·SNS·제품 정보와 후원 목적을 함께 분석해 같은 선수만 반복 추천하지 않고
            패치·SNS·혼합·디스커버리 역할에 맞는 선수와 예산 조합을 제안합니다.
          </p>

          {/* 단계 표시 */}
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-3 flex items-center gap-2 overflow-x-auto">
            {[
              { icon: ClipboardList, label: '브랜드 이해', active: true },
              { icon: Target, label: '목표·조건' },
              { icon: Clock3, label: '심층 분석' },
              { icon: Star, label: '전략 추천' },
            ].map((s, i, arr) => (
              <div key={s.label} className="flex items-center gap-2 shrink-0">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold ${s.active ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}>
                  <s.icon className="w-3.5 h-3.5" /> {i + 1} {s.label}
                </span>
                {i < arr.length - 1 && <span className="w-6 sm:w-12 h-px bg-slate-200" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 sm:px-8 pb-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] gap-5 items-start">
          {/* ── 좌: 4개 섹션 ── */}
          <div className="space-y-5">
            {/* ① 기본 조건 */}
            <Card title="1. 기본 조건" sub="기존 간편매칭의 핵심 입력은 유지합니다.">
              <Field label="브랜드 유형" required>
                <ChipGroup items={BRAND_TYPES} selected={brandType ? [brandType] : []} onToggle={(k) => setBrandType(k)} />
              </Field>
              <Field label="스폰픽 이용 목적" required hint="복수 선택">
                <ChipGroup items={GOALS} selected={[...goals]} onToggle={(k) => toggle(goals, setGoals, k)} />
              </Field>
              <Field label="선호하는 방식" required>
                <ChipGroup items={METHODS} selected={method ? [method] : []} onToggle={(k) => setMethod(k)} />
              </Field>
              <Field label="예산 범위" required>
                <div className="flex flex-wrap gap-2 mb-3">
                  {BUDGET_PRESETS.map((p, i) => (
                    <Chip key={p.label} label={p.label} on={presetIdx === i} onClick={() => applyPreset(i)} />
                  ))}
                </div>
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
                    <input type="range" min={MIN_BUDGET} max={MAX_BUDGET} step={100000} value={budget.min}
                      onChange={(e) => { setPresetIdx(null); setBudget({ ...budget, min: Math.min(Number(e.target.value), budget.max) }); }}
                      className="ai-range absolute inset-x-0 top-0 w-full h-6 appearance-none bg-transparent pointer-events-none" />
                    <input type="range" min={MIN_BUDGET} max={MAX_BUDGET} step={100000} value={budget.max}
                      onChange={(e) => { setPresetIdx(null); setBudget({ ...budget, max: Math.max(Number(e.target.value), budget.min) }); }}
                      className="ai-range absolute inset-x-0 top-0 w-full h-6 appearance-none bg-transparent pointer-events-none" />
                  </div>
                  <div className="flex justify-between text-[12px] font-bold text-slate-500 tabular-nums">
                    <span>{fmtMan(budget.min)}</span><span>{fmtMan(budget.max)}</span>
                  </div>
                </div>
                <style>{`.ai-range::-webkit-slider-thumb{appearance:none;width:18px;height:18px;border-radius:9999px;background:#059669;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.25);pointer-events:auto;cursor:pointer}`}</style>
              </Field>
            </Card>

            {/* ② 브랜드·회사·제품 정보 */}
            <Card title="2. 브랜드·회사·제품 정보" sub="URL만 넣어도 AI가 공개 정보를 분석합니다. 필요한 정보만 확인·수정하세요.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <LabeledInput icon={Briefcase} label="브랜드/회사명" required value={brandName} onChange={setBrandName} placeholder="예) 엘렌실라 / 태영코스메틱" />
                <LabeledInput icon={Globe} label="대표 홈페이지" value={homepage} onChange={setHomepage} placeholder="https://brand-example.co.kr" />
              </div>
              <Field label="브랜드/제품 소개" hint="200~500자 권장 · URL 분석 시 초안 자동 생성">
                <textarea
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setProfileApproved(false); }}
                  rows={3}
                  placeholder="브랜드와 이번 후원 대상 제품을 소개해주세요."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-400"
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="대표 제품 URL" hint="최대 3개">
                  {productUrls.map((u, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input value={u} onChange={(e) => setProductUrls(productUrls.map((x, j) => (j === i ? e.target.value : x)))}
                        placeholder="https://…/product/…"
                        className="flex-1 h-10 rounded-xl border border-slate-200 px-3.5 text-sm focus:outline-none focus:border-emerald-400" />
                      {i === productUrls.length - 1 && productUrls.length < 3 ? (
                        <button onClick={() => setProductUrls([...productUrls, ''])} className="shrink-0 h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">+ 추가</button>
                      ) : (
                        <button onClick={() => setProductUrls(productUrls.filter((_, j) => j !== i))} className="shrink-0 h-10 px-3 rounded-xl border border-slate-200 text-slate-500"><X className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  ))}
                </Field>
                <div className="space-y-2">
                  <LabeledInput icon={Instagram} label="Instagram" value={instagramUrl} onChange={setInstagramUrl} placeholder="@brand_official" />
                  <LabeledInput icon={Youtube} label="YouTube" value={youtubeUrl} onChange={setYoutubeUrl} placeholder="채널 URL" />
                  <LabeledInput icon={Store} label="네이버/블로그/스마트스토어" value={storeUrl} onChange={setStoreUrl} placeholder="선택 URL" />
                </div>
              </div>

              <button
                onClick={runAnalyze}
                disabled={analyzing}
                className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-600 text-emerald-700 text-sm font-bold hover:bg-emerald-50 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" /> {analyzing ? 'URL 공개 정보를 분석 중입니다…' : 'AI 브랜드 자동분석'}
              </button>
              {analysisError && <p className="text-[12px] font-bold text-amber-600 mt-2">{analysisError}</p>}

              {/* ③ AI 분석 확인 카드 — 승인해야만 Feature로 사용 (AC-02) */}
              {(analysis || profileApproved) && (
                <div className={`mt-4 rounded-2xl border p-4 ${profileApproved ? 'border-emerald-300 bg-emerald-50/40' : 'border-emerald-100 bg-emerald-50/20'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[13px] font-extrabold text-slate-900 inline-flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" /> AI 브랜드 자동분석
                    </span>
                    <span className="text-[12px] font-bold text-slate-500">
                      {analysis ? `URL ${analysis.urls?.filter((u: any) => u.status === 'OK').length}/${analysis.urls?.length}개 분석` : '저장된 프로필'}
                      {analysis?.urls?.some((u: any) => u.status === 'FAILED') && ' · 일부 실패(수동입력 가능)'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
                    <ReviewField label="브랜드 키워드" value={profileKeywords} onChange={(v) => { setProfileKeywords(v); setProfileApproved(false); }} placeholder="쉼표로 구분" />
                    <ReviewField label="제품 가격대" value={profilePriceTier} onChange={(v) => { setProfilePriceTier(v); setProfileApproved(false); }} placeholder="예) 중가~프리미엄" />
                  </div>
                  <p className="text-[12px] text-slate-500 break-keep mb-3">
                    공개 메타데이터 기반 규칙 추출 결과입니다. 확인·수정 후 승인한 값만 매칭에 반영됩니다.
                  </p>
                  {profileApproved ? (
                    <div className="inline-flex items-center gap-1.5 text-[12px] font-bold text-emerald-700">
                      <Check className="w-4 h-4" /> 승인됨 — 이번 매칭 Feature로 사용됩니다
                    </div>
                  ) : (
                    <button onClick={approveProfile} className="w-full h-10 rounded-xl bg-emerald-600 text-white text-[13px] font-bold hover:bg-emerald-700">
                      분석 내용이 맞아요 (승인)
                    </button>
                  )}
                </div>
              )}
            </Card>

            {/* ④ 마케팅 현황과 원하는 결과 */}
            <Card title="3. 마케팅 현황과 원하는 결과" sub="같은 업종이라도 현재 채널과 KPI가 다르면 추천 선수와 역할이 달라집니다.">
              <Field label="현재 주력 마케팅 채널" required>
                <ChipGroup items={CHANNELS} selected={[...channels]} onToggle={(k) => toggle(channels, setChannels, k)} />
              </Field>
              <Field label="이번 후원에서 가장 원하는 행동" required hint="최대 3개">
                <ChipGroup items={ACTIONS} selected={[...actions]} onToggle={(k) => toggle(actions, setActions, k, 3)} />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="주 고객">
                  <div className="flex flex-wrap gap-2">
                    {AGES.map((a) => <Chip key={a.key} label={a.label} on={ages.has(a.key)} onClick={() => toggle(ages, setAges, a.key)} />)}
                    <Chip label="남성" on={gender === 'MALE'} onClick={() => setGender(gender === 'MALE' ? null : 'MALE')} />
                    <Chip label="여성" on={gender === 'FEMALE'} onClick={() => setGender(gender === 'FEMALE' ? null : 'FEMALE')} />
                  </div>
                </Field>
                <Field label="추천 스타일" required>
                  <div className="flex flex-wrap gap-2">
                    {STYLES.map((s) => <Chip key={s.key} label={s.label} on={style === s.key} onClick={() => setStyle(s.key)} />)}
                  </div>
                </Field>
              </div>
              <Field label="선수 구성" hint="예산 안에서 한 선수에 집중할지, 역할이 다른 2~3명에 나눌지 선택합니다">
                <div className="flex flex-wrap gap-2">
                  {PORTFOLIO_MODES.map((m) => <Chip key={m.key} label={m.label} on={portfolioMode === m.key} onClick={() => setPortfolioMode(m.key)} />)}
                </div>
              </Field>
            </Card>

            {/* 선호 선수 + 옵션 */}
            <Card title="4. 선호 선수·추가 옵션" sub="선택 사항입니다.">
              <Field label="선호 선수" hint="최대 3명">
                <div className="relative mb-3">
                  <input value={athleteQuery} onChange={(e) => setAthleteQuery(e.target.value)} placeholder="선수 이름을 검색해보세요"
                    className="w-full h-11 pl-4 pr-10 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400" />
                  <Search className="absolute right-3.5 top-3 w-5 h-5 text-slate-300" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {athleteItems.map((a) => {
                    const on = preferred.some((p) => p.id === a.id);
                    const excluded = (brandCtx?.excludedAthleteIds || []).includes(a.id);
                    return (
                      <button key={a.id} onClick={() => !excluded && togglePreferred(a)}
                        className={`inline-flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full border text-[12px] font-bold transition-colors ${
                          excluded ? 'border-slate-100 text-slate-300 line-through' : on ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}>
                        <span className="w-7 h-7 rounded-full overflow-hidden bg-slate-100 shrink-0">
                          {a.profileImageUrl && <img src={a.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}
                        </span>
                        {a.name}
                        {on && <X className="w-3 h-3" />}
                      </button>
                    );
                  })}
                </div>
                {(brandCtx?.excludedAthleteIds || []).length > 0 && (
                  <p className="mt-2 text-[12px] text-slate-500">제외 처리된 선수 {brandCtx.excludedAthleteIds.length}명은 추천에서 빠집니다.</p>
                )}
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Toggle label="SNS 포함" on={includeSns} onClick={() => setIncludeSns(!includeSns)} />
                <Toggle label="팬스토어 연계" on={includeGrowthMarket} onClick={() => setIncludeGrowthMarket(!includeGrowthMarket)} />
                <Toggle label="성과보장 50 우선" on={guarantee} onClick={() => setGuarantee(!guarantee)} />
              </div>
              <p className="flex items-center gap-1.5 text-[12px] text-slate-500 pt-3 mt-1 border-t border-slate-100">
                <Info className="w-3.5 h-3.5 shrink-0" /> 입력하신 정보는 AI 매칭 분석에만 사용되며, 외부에 공개되지 않습니다.
              </p>
            </Card>
          </div>

          {/* ── 우: AI 매칭 브리프 ── */}
          <div className="lg:sticky lg:top-20 rounded-2xl border border-slate-200 p-5">
            <h2 className="text-[15px] font-extrabold text-slate-900 mb-3">AI 매칭 브리프</h2>

            <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 px-4 py-3 mb-4">
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-[12px] font-bold text-slate-500">분석 준비도</span>
                {readiness >= 70 && <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[12.5px] font-black">심층매칭 가능</span>}
              </div>
              <div className="text-2xl font-black text-emerald-700 tabular-nums mb-1.5">{readiness}%</div>
              <div className="h-1.5 rounded-full bg-white overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${readiness}%` }} />
              </div>
            </div>

            <dl className="space-y-2.5 mb-4">
              <SummaryRow icon={Briefcase} label="브랜드" value={brandName || '미입력'} />
              <SummaryRow icon={Tag} label="유형" value={brandType ? labelOf(BRAND_TYPES, brandType) : '미선택'} />
              <SummaryRow icon={Target} label="핵심 목표" value={goals.size ? [...goals].map((g) => labelOf(GOALS, g)).join(' · ') : '미선택'} />
              <SummaryRow icon={Wallet} label="예산" value={`${fmtMan(budget.min)}~${fmtMan(budget.max)}`} />
              <SummaryRow icon={Users} label="주 고객" value={[...ages].map((a) => labelOf(AGES, a)).concat(gender ? [gender === 'FEMALE' ? '여성' : '남성'] : []).join(' ') || '미선택'} />
              <SummaryRow icon={Link2} label="현재 채널" value={channels.size ? [...channels].map((c) => labelOf(CHANNELS, c)).join(' · ') : '미선택'} />
              <SummaryRow icon={Box} label="추천 스타일" value={labelOf(STYLES, style)} />
              <SummaryRow icon={Users} label="선수 구성" value={labelOf(PORTFOLIO_MODES, portfolioMode)} />
            </dl>

            <div className="rounded-xl bg-slate-900 text-white px-4 py-3.5 mb-4">
              <div className="text-[12px] font-extrabold mb-1.5">SPONPIK SIE가 추가로 분석합니다</div>
              <p className="text-[12px] text-slate-300 break-keep leading-relaxed mb-2">
                등록 선수의 최신 프로필과 실제 가용 슬롯을 먼저 확인한 뒤, 조건에 맞는 후보만 대회·팬·성장마켓 데이터로 심층 비교합니다.
              </p>
              <div className="flex flex-wrap gap-1">
                {['선수 DB', '대회/성적', '팬지수', '성장마켓', '슬롯 재고'].map((t) => (
                  <span key={t} className="px-1.5 py-0.5 rounded bg-white/10 text-[12.5px] font-bold">{t}</span>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-2.5 mb-4 text-[12px] font-bold text-slate-600 flex items-center justify-between">
              예상 후보 수 <span className="text-slate-900 tabular-nums">{preview !== null ? `${preview}명` : valid ? '계산 중…' : '—'}</span>
            </div>

            {submitError && <p className="text-[12px] font-bold text-rose-600 mb-2">{submitError}</p>}
            <button
              onClick={submit}
              disabled={!valid || submitting}
              className={`hidden lg:inline-flex w-full h-12 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors ${
                valid ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-100 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0" /> <span className="truncate">{submitLabel || 'AI 심층 매칭 시작 →'}</span>
            </button>
            <p className="hidden lg:block text-center text-[12px] text-slate-500 mt-2 break-keep">
              패치 특화 · SNS 특화 · 혼합 · 디스커버리 역할로 결과를 분리합니다.
            </p>
          </div>
        </div>
      </section>

      {/* 모바일 하단 고정 CTA */}
      <div className="lg:hidden fixed bottom-14 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-slate-100 px-5 py-3">
        <button
          onClick={submit}
          disabled={!valid || submitting}
          className={`w-full h-[52px] inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold ${
            valid ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span className="truncate">{submitLabel || `AI 심층 매칭 시작 · 준비도 ${readiness}%`}</span>
        </button>
      </div>
    </div>
  );
}

/* ── 공용 소품 ── */

function Card({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-5 sm:p-6">
      <h2 className="text-[16px] font-extrabold text-slate-900">{title}</h2>
      {sub && <p className="text-[12px] text-slate-500 mt-0.5 mb-4 break-keep">{sub}</p>}
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-[13px] font-bold text-slate-800">{label}</span>
        {required && <span className="text-rose-500 text-[12px]">*</span>}
        {hint && <span className="text-[12px] text-slate-500">({hint})</span>}
      </div>
      {children}
    </div>
  );
}

function LabeledInput({ icon: Icon, label, required, value, onChange, placeholder }: { icon: any; label: string; required?: boolean; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <div className="flex items-baseline gap-1.5 mb-1.5">
        <span className="text-[13px] font-bold text-slate-800">{label}</span>
        {required && <span className="text-rose-500 text-[12px]">*</span>}
      </div>
      <div className="relative">
        <Icon className="absolute left-3 top-2.5 w-4 h-4 text-slate-300" />
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400" />
      </div>
    </div>
  );
}

function ReviewField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="rounded-xl bg-white border border-slate-200 px-3 py-2">
      <div className="text-[12.5px] font-bold text-slate-500 mb-0.5">{label}</div>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full text-[13px] font-bold text-slate-800 focus:outline-none" />
    </div>
  );
}

function ChipGroup({ items, selected, onToggle }: { items: { key: string; label: string }[]; selected: string[]; onToggle: (k: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => <Chip key={it.key} label={it.label} on={selected.includes(it.key)} onClick={() => onToggle(it.key)} />)}
    </div>
  );
}

function Chip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2 rounded-xl border text-[13px] font-bold transition-colors ${
        on ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-600 hover:border-slate-300'
      }`}>
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
      <dt className="w-16 shrink-0 text-[12px] text-slate-500">{label}</dt>
      <dd className="text-[12px] font-bold text-slate-800 break-keep text-right flex-1">{value}</dd>
    </div>
  );
}
