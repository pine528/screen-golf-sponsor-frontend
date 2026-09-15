/**
 * 나에게 맞는 선수 `/athletes/match` — ATH-02 (선수 메뉴 핸드오프 v1.0 §5, 시안 2026-09-15)
 *
 *  조건 입력(목표·타깃·예산·종목·활동유형·지역) + 추천 가이드 → 추천 선수 최대 4명(추천 이유·근거·버전)
 *  후보가 적으면 있는 만큼만 보여주고 조건 완화를 제안한다 (가짜 4명 금지). 추천 PICK(후원안)과는 다른 선수 단위 추천.
 *  조건은 URL query에 두어 새로고침·공유가 된다.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight, BarChart3, Check, ChevronRight, ClipboardList, Coins, Compass, Lightbulb, MapPin, RotateCcw, Smartphone, Target, UserRound, Users, X,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import AthleteCard from '../../components/athlete/AthleteCard';
import QuickProfile from '../../components/athlete/QuickProfile';
import CompareBar from '../../components/athlete/CompareBar';
import { useCompare, useFavorites } from '../../components/athlete/useAthleteTools';
import { api } from '../../services/api';
import { EmptyState, LoadingState, useSlowLoading } from '../../components/ui/StateView';

const OBJECTIVES = [
  { key: 'AWARENESS', label: '인지도 확대' }, { key: 'FAN_RESPONSE', label: '팬 반응' }, { key: 'LOCAL', label: '지역 연계' },
  { key: 'SNS', label: 'SNS 확산' }, { key: 'GROWTH', label: '성장 가능성' }, { key: 'PERFORMANCE', label: '경기력 중심' },
];
const TARGETS = [
  { key: 'F2030', label: '여성 2030' }, { key: 'M2030', label: '남성 2030' }, { key: 'FAMILY', label: '가족층' },
  { key: 'GOLF_FAN', label: '골프 팬' }, { key: 'LOCAL_CONSUMER', label: '지역 소비자' }, { key: 'NEW_CUSTOMER', label: '브랜드 신규고객' },
];
const BUDGETS = [
  { key: 'UNDER_30', label: '30만원 이하' }, { key: 'M30_50', label: '30~50만원' }, { key: 'M50_100', label: '50~100만원' }, { key: 'OVER_100', label: '100만원 이상' },
];
const SPORTS = [{ key: 'GOLF', label: '골프', live: true }, { key: 'BASEBALL', label: '야구' }, { key: 'SOCCER', label: '축구' }, { key: 'BASKETBALL', label: '농구' }, { key: 'ESPORTS', label: 'e스포츠' }, { key: 'ETC', label: '기타' }];
const ACTIVITIES = [
  { key: 'OFFLINE', label: '오프라인 후원' }, { key: 'ONLINE', label: '온라인 콘텐츠' }, { key: 'FAN_STORE', label: '팬 스토어' },
  { key: 'EVENT', label: '행사' }, { key: 'LESSON', label: '레슨' }, { key: 'PRO_AM', label: '프로암' },
];
const REGIONS = ['서울', '경기', '부산', '제주', '전국'];

const STEPS = [
  { icon: ClipboardList, title: '1. 입력하기', desc: '조건을 선택하세요' },
  { icon: UserRound, title: '2. 추천받기', desc: '맞춤 선수를 추천해요' },
  { icon: Check, title: '3. 선택하기', desc: '비교하고 바로 연락하세요' },
];

/** 추천 방식이 어렵다면 — 조건 프리셋 */
const PRESETS = [
  { icon: Users, tone: 'bg-rose-50 text-rose-500', title: '여성 타깃 중심', desc: '여성 2030에 맞는 선수', q: { goal: 'FAN_RESPONSE', target: 'F2030' } },
  { icon: MapPin, tone: 'bg-emerald-50 text-emerald-600', title: '지역 연계 중심', desc: '지역과 함께 성장하는 선수', q: { goal: 'LOCAL', region: '서울' } },
  { icon: Smartphone, tone: 'bg-sky-50 text-sky-600', title: 'SNS 확산 중심', desc: 'SNS 영향력이 큰 선수', q: { goal: 'SNS', activity: 'ONLINE' } },
  { icon: BarChart3, tone: 'bg-violet-50 text-violet-600', title: '성장 가능성 중심', desc: '떠오르는 유망 선수', q: { goal: 'GROWTH' } },
];

const BADGE_OF: Record<string, string> = { RECOMMENDED: 'RECOMMENDED', GROWTH: 'GROWTH', POPULAR: 'POPULAR', NEW: 'NEW' };

type Criteria = { goal: string[]; target: string[]; budget: string; sport: string[]; activity: string[]; region: string[] };
const EMPTY: Criteria = { goal: [], target: [], budget: '', sport: ['GOLF'], activity: [], region: [] };

function readCriteria(sp: URLSearchParams): Criteria {
  const list = (k: string) => (sp.get(k) || '').split(',').filter(Boolean);
  return { goal: list('goal'), target: list('target'), budget: sp.get('budget') || '', sport: list('sport').length ? list('sport') : ['GOLF'], activity: list('activity'), region: list('region') };
}

export default function AthleteMatch() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const fromUrl = useMemo(() => readCriteria(sp), [sp]);
  const [c, setC] = useState<Criteria>(fromUrl);
  useEffect(() => setC(fromUrl), [fromUrl]);

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<any>(null);
  const slow = useSlowLoading(loading);
  const [sort, setSort] = useState<'FIT' | 'FAN'>('FIT');
  const [mobileOpen, setMobileOpen] = useState(true);

  const toggle = (k: keyof Criteria, v: string, max: number) => setC((prev) => {
    const cur = prev[k] as string[];
    const next = cur.includes(v) ? cur.filter((x) => x !== v) : cur.length >= max ? [...cur.slice(1), v] : [...cur, v];
    return { ...prev, [k]: next };
  });

  const run = useCallback(async (crit: Criteria) => {
    if (!crit.goal.length) { setErr({ message: '목표를 1개 이상 선택해주세요' }); return; }
    setLoading(true); setErr(null);
    try {
      const r: any = await api.matchAthletes({
        objectives: crit.goal, targets: crit.target, budgetBand: crit.budget || undefined,
        sports: crit.sport, activities: crit.activity, regions: crit.region,
      });
      setResult(r?.data || null);
      setMobileOpen(false);
    } catch (e) { setErr(e); setResult(null); } finally { setLoading(false); }
  }, []);

  const submit = () => {
    const out = new URLSearchParams();
    if (c.goal.length) out.set('goal', c.goal.join(','));
    if (c.target.length) out.set('target', c.target.join(','));
    if (c.budget) out.set('budget', c.budget);
    if (c.sport.length && !(c.sport.length === 1 && c.sport[0] === 'GOLF')) out.set('sport', c.sport.join(','));
    if (c.activity.length) out.set('activity', c.activity.join(','));
    if (c.region.length) out.set('region', c.region.join(','));
    setSp(out);
    run(c);
  };
  /* URL로 들어오면 바로 실행 (공유·새로고침) */
  useEffect(() => { if (fromUrl.goal.length) run(fromUrl); }, [fromUrl, run]);

  const applyPreset = (q: Record<string, string>) => {
    const out = new URLSearchParams();
    Object.entries(q).forEach(([k, v]) => out.set(k, v));
    setSp(out);
  };
  const reset = () => { setC(EMPTY); setResult(null); setErr(null); setSp(new URLSearchParams()); };

  const athletes: any[] = useMemo(() => {
    const list = [...(result?.athletes || [])];
    if (sort === 'FAN') list.sort((a, b) => (b.fanTemp || 0) - (a.fanTemp || 0));
    else list.sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0));
    return list;
  }, [result, sort]);

  const { favs, toggle: toggleFav, toast, undo, dismissToast } = useFavorites();
  const { compare, has: comparing, toggle: toggleCompare, remove: removeCompare, full: compareFull } = useCompare();
  const [openId, setOpenId] = useState<string | null>(null);
  const [barH, setBarH] = useState(96);

  const chips = [
    ...c.goal.map((k) => OBJECTIVES.find((o) => o.key === k)?.label || k),
    ...c.target.map((k) => TARGETS.find((o) => o.key === k)?.label || k),
    c.budget ? BUDGETS.find((b) => b.key === c.budget)?.label : null,
    ...c.sport.map((k) => SPORTS.find((o) => o.key === k)?.label || k),
    ...c.activity.map((k) => ACTIVITIES.find((o) => o.key === k)?.label || k),
    ...c.region,
  ].filter(Boolean) as string[];

  /* 이번 추천의 근거 유형 — 결과에서 집계한 실제 값 */
  const reasonStats = useMemo(() => {
    const m = new Map<string, number>();
    athletes.forEach((a) => (a.reasons || []).forEach((r: any) => m.set(r.code, (m.get(r.code) || 0) + 1)));
    const LABEL: Record<string, string> = { SNS_STRENGTH: 'SNS 확산력 우수', LONG_TERM_FIT: '장기 적합', REGION_MATCH: '지역 연계 적합', BUDGET_FIT: '예산 적합', PATCH_FIT: '노출 적합', FAN_COMMERCE_FIT: '팬스토어·구매 연결', FAN_RESPONSE: '팬 반응 우수', RECENT_ACTIVITY: '최근 활동 활발' };
    return [...m.entries()].map(([k, n]) => ({ label: LABEL[k] || k, n })).sort((a, b) => b.n - a.n).slice(0, 3);
  }, [athletes]);

  const Chip = ({ on, onClick, children, disabled }: { on: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled} aria-pressed={on} className={`h-10 px-3.5 rounded-xl text-[13px] font-bold border transition-colors ${on ? 'bg-emerald-600 border-emerald-600 text-white' : disabled ? 'border-slate-100 text-slate-300 cursor-not-allowed' : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'}`}>{children}</button>
  );

  const form = (
    <div className="space-y-4">
      <FormRow icon={Target} label="목표" hint="1~2개">
        {OBJECTIVES.map((o) => <Chip key={o.key} on={c.goal.includes(o.key)} onClick={() => toggle('goal', o.key, 2)}>{o.label}</Chip>)}
      </FormRow>
      <FormRow icon={Users} label="타깃" hint="0~2개">
        {TARGETS.map((o) => <Chip key={o.key} on={c.target.includes(o.key)} onClick={() => toggle('target', o.key, 2)}>{o.label}</Chip>)}
      </FormRow>
      <FormRow icon={Coins} label="예산" hint="월">
        {BUDGETS.map((o) => <Chip key={o.key} on={c.budget === o.key} onClick={() => setC((p) => ({ ...p, budget: p.budget === o.key ? '' : o.key }))}>{o.label}</Chip>)}
      </FormRow>
      <FormRow icon={Compass} label="종목">
        {SPORTS.map((o) => <Chip key={o.key} on={c.sport.includes(o.key)} disabled={!o.live} onClick={() => toggle('sport', o.key, 3)}>{o.label}{!o.live && <span className="ml-1 text-[10.5px]">준비 중</span>}</Chip>)}
      </FormRow>
      <FormRow icon={BarChart3} label="활동 유형" hint="0~2개">
        {ACTIVITIES.map((o) => <Chip key={o.key} on={c.activity.includes(o.key)} onClick={() => toggle('activity', o.key, 2)}>{o.label}</Chip>)}
      </FormRow>
      <FormRow icon={MapPin} label="지역" hint="0~2개">
        {REGIONS.map((r) => <Chip key={r} on={c.region.includes(r)} onClick={() => toggle('region', r, 2)}>{r}</Chip>)}
      </FormRow>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4fbf7] text-slate-900" style={{ paddingBottom: barH + 24 }}>
      <PublicHeader />

      {/* ── 히어로 ── */}
      <section className="max-w-[1180px] mx-auto px-5 pt-5">
        <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[13px]">
          <Link to="/" className="text-slate-500 hover:text-slate-700">홈</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <Link to="/athletes" className="text-slate-500 hover:text-slate-700">선수</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-bold text-emerald-700">나에게 맞는 선수</span>
        </nav>
        <div className="mt-4 grid lg:grid-cols-[minmax(0,1fr)_420px] gap-6 items-end">
          <div>
            <h1 className="text-[30px] sm:text-[40px] font-extrabold tracking-[-0.03em] leading-tight">나에게 맞는 선수</h1>
            <p className="mt-2 text-[14.5px] text-slate-600 break-keep leading-relaxed">목표, 타깃, 예산, 활동 목적에 맞는 선수를 추천받아보세요.<br className="hidden sm:block" />브랜드와 잘 맞는 선수를 더 빠르게 찾을 수 있습니다.</p>
            <Link to="/about/how-it-works" className="mt-3 inline-flex items-center gap-1 text-[13.5px] font-bold text-emerald-700 hover:underline">추천 기준 자세히 보기 <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <div className="relative">
            <p aria-hidden className="hidden lg:block absolute -top-9 right-4 font-script text-[22px] leading-[1.1] text-emerald-500/80 -rotate-6 select-none whitespace-nowrap">Find your Best Match<br />with SPONPIK</p>
            <ol className="flex items-start justify-between sm:justify-center gap-2 sm:gap-6">
              {STEPS.map((s, i) => {
                const I = s.icon;
                return (
                  <li key={s.title} className="flex items-start gap-2 sm:gap-5">
                    <div className="text-center w-[92px] sm:w-[120px]">
                      <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white shadow-[0_10px_24px_-12px_rgba(16,185,129,0.5)] inline-flex items-center justify-center text-emerald-600"><I className="w-5 h-5 sm:w-6 sm:h-6" /></span>
                      <p className="mt-2 text-[13px] font-extrabold">{s.title}</p>
                      <p className="text-[11.5px] text-slate-500 break-keep">{s.desc}</p>
                    </div>
                    {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-emerald-400 mt-4 sm:mt-5 shrink-0" />}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>

      {/* ── 조건 입력 + 가이드 ── */}
      <section className="max-w-[1180px] mx-auto px-5 mt-6 grid lg:grid-cols-[minmax(0,1fr)_300px] gap-4 items-start">
        <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[19px] font-extrabold tracking-[-0.02em]">어떤 선수를 찾고 계신가요?</h2>
            <p className="hidden sm:block text-[12.5px] text-slate-500">여러 조건을 선택할수록 더 정확한 추천이 가능합니다.</p>
            <button onClick={() => setMobileOpen((v) => !v)} className="sm:hidden text-[12.5px] font-bold text-slate-500">{mobileOpen ? '간단히 보기' : '조건 수정'}</button>
          </div>
          {!mobileOpen && chips.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5 sm:hidden">
              {chips.map((t) => <span key={t} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[12px] font-bold">{t}</span>)}
            </div>
          )}
          <div className={`mt-4 ${mobileOpen ? '' : 'hidden sm:block'}`}>{form}</div>
          {err && !loading && <p className="mt-3 text-[12.5px] font-bold text-rose-600">{err?.response?.data?.error?.message || err?.message || '추천을 불러오지 못했습니다'}</p>}
          <div className="mt-5 flex items-center justify-between gap-3">
            <button onClick={reset} className="h-11 px-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-700 hover:border-slate-400"><RotateCcw className="w-4 h-4" /> 조건 초기화</button>
            <button onClick={submit} disabled={loading || !c.goal.length} className="h-12 px-6 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 text-white text-[14px] font-bold hover:bg-emerald-700 disabled:opacity-40">추천 받기 <ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>

        <aside className="rounded-3xl bg-white border border-slate-200 p-5 space-y-4">
          <div>
            <p className="text-[15px] font-extrabold inline-flex items-center gap-1.5"><Lightbulb className="w-4 h-4 text-emerald-600" /> 추천 가이드</p>
            <p className="mt-1 text-[12.5px] text-slate-500 break-keep">브랜드의 목표와 조건에 맞춰 가장 적합한 선수를 추천해드려요.</p>
            <ul className="mt-2.5 space-y-1.5">
              {['목표에 맞는 선수 추천', '팬 반응 / 활동성 반영', '브랜드와의 적합도 고려', '비교 후 바로 선택 가능'].map((t) => (
                <li key={t} className="flex items-center gap-2 text-[12.5px] text-slate-700"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> {t}</li>
              ))}
            </ul>
          </div>
          <div className="border-t border-slate-100 pt-4">
            <p className="text-[13.5px] font-extrabold">현재 추천 조건</p>
            {chips.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">{chips.map((t) => <span key={t} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[12px] font-bold">{t}</span>)}</div>
            ) : <p className="mt-1 text-[12.5px] text-slate-500">아직 선택한 조건이 없습니다.</p>}
          </div>
          {result && (
            <div className="border-t border-slate-100 pt-4">
              <p className="text-[13.5px] font-extrabold inline-flex items-center gap-1.5"><BarChart3 className="w-4 h-4 text-emerald-600" /> 이번 추천의 근거</p>
              {reasonStats.length ? (
                <ul className="mt-2 space-y-1.5">
                  {reasonStats.map((r) => (
                    <li key={r.label} className="flex items-center gap-2 text-[12.5px]">
                      <span className="flex-1 text-slate-700">{r.label}</span>
                      <span className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden"><span className="block h-full bg-emerald-500" style={{ width: `${Math.round((r.n / Math.max(1, athletes.length)) * 100)}%` }} /></span>
                      <span className="w-8 text-right font-bold tabular-nums">{r.n}명</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-1 text-[12.5px] text-slate-500">근거 데이터가 충분하지 않습니다.</p>}
              <p className="mt-2 text-[11.5px] text-slate-500">엔진 {result.engineVersion} · 기준 {new Date(result.dataAsOf).toLocaleDateString('ko-KR')}</p>
            </div>
          )}
        </aside>
      </section>

      {/* ── 결과 ── */}
      <section className="max-w-[1180px] mx-auto px-5 mt-8">
        {loading ? (
          <LoadingState label="조건에 맞는 선수를 찾는 중…" slow={slow} />
        ) : result ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[17px] font-extrabold">추천 선수 <span className="text-emerald-600 tabular-nums">{athletes.length}</span>
                <span className="ml-2 text-[12.5px] font-normal text-slate-500">후보 {result.candidateCount}명 중 추천 기준에 맞는 선수를 선별했어요.</span></p>
              <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-[12.5px] font-bold text-slate-700">
                <option value="FIT">적합도 높은 순</option><option value="FAN">팬온도 높은 순</option>
              </select>
            </div>
            {athletes.length === 0 ? (
              <div className="mt-4">
                <EmptyState title="조건에 맞는 추천 후보가 부족합니다" desc="조건을 조금 완화하거나 선수 찾기에서 직접 탐색해보세요.">
                  {(result.relax || []).map((h: any) => <span key={h.key} className="h-10 px-3.5 inline-flex items-center rounded-xl bg-amber-50 text-amber-700 text-[12.5px] font-bold">{h.label}</span>)}
                  <Link to="/athletes/search" className="h-10 px-4 inline-flex items-center rounded-xl bg-emerald-600 text-white text-[13px] font-bold">선수 찾기</Link>
                </EmptyState>
              </div>
            ) : (
              <>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {athletes.map((a) => (
                    <AthleteCard key={a.id} a={a} badgeKey={a.badge ? BADGE_OF[a.badge] : undefined} fav={favs.has(a.id)} comparing={comparing(a.id)} compareFull={compareFull}
                      onInfo={() => setOpenId(a.id)} onFav={() => toggleFav(a.id, a.name)} onCompare={() => toggleCompare(a)}
                      primary={{ label: '관심선수', onClick: () => toggleFav(a.id, a.name) }}
                      extra={(a.reasons?.length ?? 0) > 0 && (
                        <p className="rounded-xl bg-emerald-50/70 px-3 py-2 text-[12px] text-slate-700 break-keep">
                          <span className="font-extrabold text-emerald-700 mr-1">추천 이유</span>{a.reasons[0].text}
                        </p>
                      )} />
                  ))}
                </div>
                {result.partial && (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-800 break-keep flex flex-wrap items-center gap-2">
                    조건에 맞는 후보가 {athletes.length}명뿐이라 그대로 보여드려요. 조건을 완화하면 더 찾을 수 있어요:
                    {(result.relax || []).map((h: any) => <span key={h.key} className="px-2.5 py-1 rounded-lg bg-white border border-amber-200 font-bold">{h.label}</span>)}
                  </div>
                )}
              </>
            )}
          </>
        ) : null}

        {/* 추천 방식이 어렵다면 */}
        <div className="mt-8 rounded-3xl bg-white border border-slate-200 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[16px] font-extrabold">추천 방식이 어렵다면?</p>
              <p className="text-[12.5px] text-slate-500 break-keep">아래 추천 테마를 선택하면, 조건이 자동으로 설정되어 빠르게 추천받을 수 있어요.</p>
            </div>
          </div>
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {PRESETS.map((p) => {
              const I = p.icon;
              return (
                <button key={p.title} onClick={() => applyPreset(p.q as unknown as Record<string, string>)} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-left hover:border-emerald-300">
                  <span className={`w-10 h-10 rounded-full inline-flex items-center justify-center shrink-0 ${p.tone}`}><I className="w-[18px] h-[18px]" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-extrabold">{p.title}</span>
                    <span className="block text-[12px] text-slate-500 truncate">{p.desc}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <CompareBar compare={compare} onRemove={removeCompare} onHeight={setBarH} mobileCompact />

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 z-40 rounded-xl bg-slate-900 text-white text-[13px] px-4 py-2.5 shadow-lg flex items-center gap-3" style={{ bottom: barH + 12 }}>
          관심 선수에서 해제했습니다.
          <button onClick={undo} className="font-bold text-emerald-300">되돌리기</button>
          <button onClick={dismissToast} aria-label="닫기" className="text-slate-400"><X className="w-4 h-4" /></button>
        </div>
      )}
      {openId && (
        <QuickProfile athleteId={openId} fav={favs.has(openId)} onFav={() => toggleFav(openId, athletes.find((x) => x.id === openId)?.name)} onClose={() => setOpenId(null)} onPick={(id) => navigate(`/sponsor/direct/build/${id}`)} />
      )}
    </div>
  );
}

function FormRow({ icon: I, label, hint, children }: { icon: any; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid sm:grid-cols-[96px_minmax(0,1fr)] gap-2 sm:gap-3 items-start">
      <p className="text-[13.5px] font-extrabold text-slate-800 inline-flex items-center gap-1.5 pt-2"><I className="w-4 h-4 text-emerald-600" /> {label}{hint && <span className="text-[11px] font-bold text-slate-400">{hint}</span>}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
