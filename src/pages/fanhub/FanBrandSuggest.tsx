/**
 * F14 브랜드 추천 `/fan/brand-suggest/:athleteId` — 시안 2026-09-15 (리디자인/9 · 25)
 *
 *  좌: "내 관심선수에게 어울리는 브랜드를 추천해주세요" → 선택된 선수 스트립(팬온도 · 활동 영역)
 *     → 브랜드 이름(필수) · 카테고리(필수) · 브랜드 홈페이지(선택) · 추천 사유(필수 50~500) · 추천 협업 형태(복수) · 이해관계 disclosure(필수)
 *     → 기본 비공개 처리 안내 → [추천 접수하기]
 *  우: 좋은 추천의 예시 · 팬 보호를 위한 약속 · 참여 보상 안내(적립표 값)
 *  하단: 내 추천 현황 — 파이프라인 단계별 건수 + 표(추천 브랜드 · 카테고리 · 선수 · 협업 형태 · 현재 단계 · 접수일)
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle, Box, Check, CheckCircle2, ChevronDown, ChevronRight, Flame, Gift, Globe, Lightbulb, Lock, Megaphone, Search, ShieldCheck,
  Smartphone, Sparkles, Store, ShoppingBag, Trophy,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { AthleteAvatar, Skeleton, FAN_TEMP_NOTE } from '../../components/fanhub/FanKit';
import { FanPage, Container, FanCrumb, BackButton, Panel, fmtDate } from '../../components/fanhub/FanShell';

const COLLAB_ICON: Record<string, any> = { PROFILE_PATCH: Trophy, SNS: Smartphone, FAN_STORE: ShoppingBag, PRODUCT: Box };
const STAGE_TONE: Record<string, string> = { RECEIVED: 'bg-slate-100 text-slate-600', REVIEWING: 'bg-sky-50 text-sky-700', DELIVERED: 'bg-emerald-50 text-emerald-700', INTERESTED: 'bg-amber-50 text-amber-700', ADOPTED: 'bg-emerald-600 text-white', HOLD: 'bg-slate-100 text-slate-500', CLOSED: 'bg-slate-100 text-slate-500' };

export default function FanBrandSuggest() {
  const { athleteId = '' } = useParams();
  const nav = useNavigate();
  const { isAuthenticated } = useAuth();
  const [opts, setOpts] = useState<any>(null);
  const [tv, setTv] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [mine, setMine] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [brandName, setBrandName] = useState('');
  const [category, setCategory] = useState('');
  const [brandUrl, setBrandUrl] = useState('');
  const [reason, setReason] = useState('');
  const [collab, setCollab] = useState<string[]>([]);
  const [interest, setInterest] = useState('NONE');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const loginTo = `/login?returnUrl=${encodeURIComponent(`/fan/brand-suggest/${athleteId}`)}`;
  const loadMine = () => (isAuthenticated ? api.getMyBrandSuggestions().then((r) => setMine(r.data)).catch(() => null) : Promise.resolve());

  useEffect(() => {
    Promise.all([
      api.getBrandSuggestOptions().then((r) => setOpts(r.data)).catch(() => null),
      athleteId ? api.getFanTemperature(athleteId).then((r) => setTv(r.data)).catch(() => null) : null,
      athleteId ? api.getAthleteBrandSuggestSummary(athleteId).then((r) => setSummary(r.data)).catch(() => null) : null,
      loadMine(),
    ]).finally(() => setLoading(false));
  }, [athleteId, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    if (!isAuthenticated) { nav(loginTo); return; }
    setSending(true); setError(null);
    try {
      const r = await api.createBrandSuggestion(athleteId, { category, brandName: brandName.trim(), reason: reason.trim(), interest, brandUrl: brandUrl.trim() || undefined, collabTypes: collab });
      setDone(r.data);
      setBrandName(''); setCategory(''); setBrandUrl(''); setReason(''); setCollab([]); setInterest('NONE');
      await Promise.all([loadMine(), api.getBrandSuggestOptions().then((x) => setOpts(x.data)).catch(() => null)]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      if (e?.response?.status === 401) { nav(loginTo); return; }
      setError(e?.response?.data?.error?.message || '추천을 보내지 못했습니다');
    } finally { setSending(false); }
  };

  const a = tv?.athlete;
  const len = reason.trim().length;
  const min = opts?.reason?.min ?? 50, max = opts?.reason?.max ?? 500;
  const exhausted = !!opts?.quota && opts.quota.remaining <= 0 && isAuthenticated;
  const valid = brandName.trim().length > 0 && !!category && len >= min && len <= max && collab.length > 0 && !!interest && !exhausted;
  const activityAreas = useMemo(() => [
    { icon: Flame, label: a?.sportType && a.sportType !== 'GOLF' ? a.sportType : '골프' },
    { icon: Smartphone, label: 'SNS' },
    ...(a?.tour ? [{ icon: Trophy, label: a.tour }] : []),
  ], [a]);
  const crumbs = [{ label: '팬 참여', to: '/fan' }, { label: '브랜드 추천' }];

  if (loading) {
    return <FanPage><Container className="pt-5 space-y-4"><Skeleton className="h-8 w-60" /><Skeleton className="h-[520px] rounded-3xl" /></Container></FanPage>;
  }

  return (
    <FanPage>
      <Container className="pt-5">
        <FanCrumb items={crumbs} />
        <div className="mt-3"><BackButton to={athleteId ? `/fan/community/${athleteId}` : '/fan/community'} label="목록으로 돌아가기" /></div>

        {done && (
          <div className="mt-4 rounded-2xl bg-[#0a1411] text-white px-5 py-4 flex items-center gap-3.5">
            <span className="w-10 h-10 rounded-xl bg-emerald-400/20 inline-flex items-center justify-center shrink-0"><CheckCircle2 className="w-5 h-5 text-emerald-300" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[14.5px] font-extrabold">추천이 접수됐습니다</p>
              <p className="text-[12.5px] text-white/70 break-keep">{done.reviewRequired ? '이해관계가 표시된 추천은 운영팀 검토 후 브랜드에 전달되며, 검토 전에는 포인트가 적립되지 않습니다.' : `운영팀 검토를 거쳐 브랜드에 익명으로 전달됩니다.${done.point?.earned > 0 ? ` 팬포인트 +${done.point.earned}P 적립 예정.` : ''}`} 이번 달 남은 추천 {done.remaining}건</p>
            </div>
            <a href="#mine" className="hidden sm:inline-flex h-9 px-3.5 rounded-lg bg-white text-slate-900 text-[12.5px] font-bold items-center shrink-0">내 추천 현황</a>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-4 items-start">
          {/* ── 폼 ── */}
          <div className="min-w-0">
            <h1 className="text-[22px] sm:text-[28px] font-extrabold tracking-[-0.03em] leading-tight inline-flex flex-wrap items-center gap-2 break-keep">
              <span className="px-2 h-7 rounded-md border border-emerald-300 bg-emerald-50 text-emerald-700 text-[12px] font-extrabold inline-flex items-center">F14</span> 내 관심선수에게 어울리는 브랜드를 추천해주세요
            </h1>

            {/* 선택된 선수 */}
            {a ? (
              <div className="mt-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 p-4 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto_auto] gap-4 items-center">
                <div className="flex items-center gap-3 min-w-0"><AthleteAvatar athlete={a} size={52} /><div className="min-w-0"><p className="text-[12.5px] text-slate-600">선택된 선수</p><p className="text-[18px] font-extrabold text-emerald-800 truncate">{a.name} 프로</p></div></div>
                <div className="sm:px-5 sm:border-x border-emerald-100" title={FAN_TEMP_NOTE}><p className="text-[12px] text-slate-600 inline-flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-rose-500" /> 팬 온도</p><p className="text-[20px] font-black text-rose-500 tabular-nums leading-none mt-0.5">{tv && !tv.lowSample && tv.score > 0 ? `${Number(tv.score).toFixed(1)}°C` : <span className="text-[13px] text-slate-500 font-bold">집계 중</span>}</p></div>
                <div><p className="text-[12px] text-slate-600">활동 영역</p><div className="mt-1 flex gap-3">{activityAreas.map((x) => { const I = x.icon; return <span key={x.label} className="inline-flex flex-col items-center gap-0.5 text-[11px] font-bold text-slate-700"><span className="w-8 h-8 rounded-lg bg-white border border-emerald-100 inline-flex items-center justify-center text-emerald-700"><I className="w-4 h-4" /></span>{x.label}</span>; })}</div></div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3.5 text-[13px] text-amber-700 break-keep">추천할 선수를 먼저 선택해주세요. <Link to="/fan/community" className="font-bold underline">선수 커뮤니티에서 선택하기</Link></div>
            )}

            {exhausted && <div className="mt-3 rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3.5 flex gap-2.5 text-[13px] text-amber-700 break-keep"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> 이번 달 추천 {opts.quota.limit}건을 모두 사용했습니다. 다음 달 1일에 다시 추천할 수 있어요.</div>}

            <Panel className="mt-4 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[13px] font-bold">브랜드 검색 또는 이름<span className="text-rose-500">*</span></label>
                  <div className="mt-1.5 relative"><input value={brandName} onChange={(e) => setBrandName(e.target.value.slice(0, 60))} disabled={exhausted} placeholder="브랜드명을 입력하세요" className="w-full h-11 pl-4 pr-10 rounded-xl border border-slate-200 text-[14px] placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 disabled:bg-slate-50" /><Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" /></div>
                </div>
                <div>
                  <label className="text-[13px] font-bold">카테고리<span className="text-rose-500">*</span></label>
                  <div className="mt-1.5 relative"><select value={category} onChange={(e) => setCategory(e.target.value)} disabled={exhausted} className={`w-full h-11 pl-4 pr-10 rounded-xl border border-slate-200 bg-white text-[14px] appearance-none focus:outline-none focus:border-emerald-400 disabled:bg-slate-50 ${category ? '' : 'text-slate-400'}`}><option value="">카테고리를 선택하세요</option>{opts?.categories?.map((c: string) => <option key={c} value={c}>{c}</option>)}</select><ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" /></div>
                </div>
                <div>
                  <label className="text-[13px] font-bold">브랜드 홈페이지 <span className="text-slate-400 font-medium">(선택)</span></label>
                  <input value={brandUrl} onChange={(e) => setBrandUrl(e.target.value.slice(0, 300))} disabled={exhausted} placeholder="https:// (선택 사항)" className="mt-1.5 w-full h-11 px-4 rounded-xl border border-slate-200 text-[14px] placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 disabled:bg-slate-50" />
                </div>
                <div className="sm:row-span-2">
                  <label className="text-[13px] font-bold">추천 사유<span className="text-rose-500">*</span></label>
                  <textarea value={reason} onChange={(e) => setReason(e.target.value.slice(0, max))} disabled={exhausted} rows={6} placeholder="이 브랜드가 선수와 잘 어울리는 이유를 구체적으로 작성해주세요." className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-[14px] leading-relaxed placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 resize-y disabled:bg-slate-50" />
                  <p className={`mt-1 text-right text-[12px] tabular-nums ${len >= min ? 'text-emerald-600' : 'text-slate-500'}`}>{len} / {max}{len < min ? ` (최소 ${min}자)` : ''}</p>
                </div>
              </div>

              <div>
                <p className="text-[13px] font-bold">추천 협업 형태 <span className="text-slate-500 font-medium">(복수 선택 가능)</span><span className="text-rose-500">*</span></p>
                <div className="mt-2 grid grid-cols-2 lg:grid-cols-4 gap-2">
                  {(opts?.collabTypes || []).map((t: any) => { const I = COLLAB_ICON[t.code] || Box; const on = collab.includes(t.code); return (
                    <button key={t.code} type="button" disabled={exhausted} onClick={() => setCollab((c) => (on ? c.filter((x) => x !== t.code) : [...c, t.code]))} aria-pressed={on}
                      className={`h-12 px-3 rounded-xl border-2 text-[12.5px] font-bold inline-flex items-center gap-2 text-left transition ${on ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'}`} title={t.desc}>
                      <span className={`w-[18px] h-[18px] rounded border-2 inline-flex items-center justify-center shrink-0 ${on ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'}`}>{on && <Check className="w-3 h-3" strokeWidth={3} />}</span>
                      <I className="w-4 h-4 text-slate-500 shrink-0" /><span className="truncate">{t.label}</span>
                    </button>
                  ); })}
                </div>
              </div>

              <div>
                <p className="text-[13px] font-bold">이해관계 disclosure<span className="text-rose-500">*</span></p>
                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                  {(opts?.interests || []).map((i: any) => (
                    <label key={i.code} className="inline-flex items-center gap-2 text-[13px] cursor-pointer" title={i.desc}>
                      <input type="radio" name="interest" value={i.code} checked={interest === i.code} onChange={() => setInterest(i.code)} disabled={exhausted} className="w-4 h-4 accent-emerald-600" />
                      {i.code === 'NONE' ? '본인(팬)' : i.label}
                    </label>
                  ))}
                </div>
                {interest !== 'NONE' && <p className="mt-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-[12px] text-amber-700 break-keep inline-flex items-start gap-2"><AlertCircle className="w-4 h-4 shrink-0" /> 이해관계가 있는 추천은 운영팀 검토를 거친 뒤에야 브랜드에 전달되며, 검토 전에는 포인트가 적립되지 않습니다.</p>}
              </div>

              <div className="rounded-xl bg-slate-50 px-4 py-3 flex gap-3"><Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" /><div><p className="text-[13px] font-extrabold">기본 비공개 처리됩니다</p><p className="text-[12px] text-slate-600 break-keep">브랜드에는 추천 내용만 전달되며, 추천자 개인 정보는 제공되지 않습니다.</p></div></div>

              {error && <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-[13px] font-bold text-rose-600 break-keep">{error}</p>}
              <button type="button" onClick={submit} disabled={!valid || sending || !athleteId} className="w-full h-12 rounded-xl bg-emerald-700 text-white text-[15px] font-extrabold hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400">
                {sending ? '접수 중…' : isAuthenticated ? '추천 접수하기' : '로그인하고 추천 접수하기'}
              </button>
            </Panel>
          </div>

          {/* ── 사이드 ── */}
          <aside className="space-y-3">
            <Panel>
              <p className="text-[14.5px] font-extrabold inline-flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-amber-500" /> 좋은 추천의 예시</p>
              <ul className="mt-3 divide-y divide-slate-100">
                {(opts?.examples || []).map((x: any) => <li key={x.title} className="py-3 flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /><div><p className="text-[13px] font-bold break-keep">{x.title}</p><p className="mt-0.5 text-[12px] text-slate-500 break-keep">{x.desc}</p></div></li>)}
              </ul>
              <div className="mt-2 rounded-xl bg-emerald-50 border border-emerald-100 p-4 flex gap-2.5"><ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" /><div><p className="text-[13px] font-extrabold text-emerald-800">팬 보호를 위한 약속</p><p className="mt-0.5 text-[12px] text-slate-700 break-keep">추천 내용은 SPONPIK이 검토 후 브랜드에 전달되며, 개인 정보는 절대 제공되지 않습니다.</p></div></div>
            </Panel>
            <Panel>
              <p className="text-[14.5px] font-extrabold inline-flex items-center gap-1.5"><Gift className="w-4 h-4 text-rose-500" /> 참여 보상 안내</p>
              <ul className="mt-2 space-y-1 text-[13px] text-slate-700">
                <li>· 유효한 추천으로 검토 완료 시 <b className="text-emerald-700">{opts?.rewards?.suggest ?? '—'}P</b> 지급</li>
                <li>· 브랜드에 의해 채택될 경우 <b className="text-emerald-700">{opts?.rewards?.adopted ?? '—'}P</b> 추가 지급</li>
              </ul>
              <p className="mt-2 text-[11.5px] text-slate-500 break-keep">※ 보상은 SPONPIK 포인트로 지급되며, <Link to="/fan/points/ledger" className="underline">포인트 내역</Link>에서 확인할 수 있습니다. 월 {opts?.quota?.limit ?? 3}건까지 추천할 수 있습니다.</p>
              {opts?.notices && <ul className="mt-3 pt-3 border-t border-slate-100 space-y-1">{opts.notices.map((t: string) => <li key={t} className="flex gap-2 text-[11.5px] text-slate-500 break-keep"><span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />{t}</li>)}</ul>}
            </Panel>
            {summary && summary.total > 0 && (
              <Panel>
                <p className="text-[14.5px] font-extrabold inline-flex items-center gap-1.5"><Megaphone className="w-4 h-4 text-emerald-600" /> {a?.name} 프로에게 들어온 추천</p>
                <p className="mt-1 text-[12px] text-slate-500 break-keep">{summary.notice}</p>
                {summary.categories?.length ? <ul className="mt-2 flex flex-wrap gap-1.5">{summary.categories.map((c: any) => <li key={c.category} className="px-2.5 h-7 rounded-full bg-slate-100 text-[12px] font-bold text-slate-700 inline-flex items-center">{c.category} {c.count}</li>)}</ul> : <p className="mt-2 text-[12.5px] text-slate-500">브랜드에 전달된 추천이 아직 없습니다 (접수 {summary.total}건).</p>}
              </Panel>
            )}
          </aside>
        </div>

        {/* ── 내 추천 현황 ── */}
        <Panel className="mt-4" >
          <div id="mine" className="flex items-center justify-between gap-3"><p className="text-[16px] font-extrabold">내 추천 현황</p>{isAuthenticated && <Link to="/fan/activity" className="text-[12px] font-bold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">내 팬활동 <ChevronRight className="w-3.5 h-3.5" /></Link>}</div>
          {!isAuthenticated ? (
            <p className="mt-3 text-[13px] text-slate-500">로그인하면 내가 보낸 추천의 진행 단계를 볼 수 있습니다. <Link to={loginTo} className="font-bold text-emerald-700 underline">로그인</Link></p>
          ) : (
            <>
              <ol className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2">
                {(mine?.stageCounts || []).map((s: any, i: number, arr: any[]) => (
                  <li key={s.code} className={`relative rounded-xl border px-3.5 py-3 ${s.count > 0 ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 bg-white'}`}>
                    <div className="flex items-center justify-between gap-2"><p className="text-[13px] font-extrabold">{s.code === 'ADOPTED' ? '채택/보류' : s.label}</p><span className={`min-w-[22px] h-[22px] px-1.5 rounded-full text-[11.5px] font-black inline-flex items-center justify-center ${s.count > 0 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{s.count}</span></div>
                    <p className="mt-0.5 text-[11px] text-slate-500 break-keep">{s.code === 'ADOPTED' ? '최종 결과가 확정되었습니다' : s.desc}</p>
                    {i < arr.length - 1 && <ChevronRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />}
                  </li>
                ))}
              </ol>
              {mine?.suggestions?.length ? (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[720px] text-[12.5px]">
                    <thead><tr className="bg-slate-50 text-[11.5px] text-slate-500">{['추천 브랜드', '카테고리', '추천 선수', '추천 협업 형태', '현재 단계', '접수일', ''].map((h, i) => <th key={i} className="px-3 py-2.5 text-left font-bold">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {mine.suggestions.map((s: any) => (
                        <tr key={s.id}>
                          <td className="px-3 py-3 font-extrabold inline-flex items-center gap-2"><span className="w-7 h-7 rounded-full bg-slate-100 text-[11px] font-black text-slate-600 inline-flex items-center justify-center">{(s.brandName || s.category).slice(0, 1)}</span>{s.brandName || '브랜드 미지정'}{s.brandUrl && <a href={s.brandUrl} target="_blank" rel="noreferrer" aria-label="브랜드 홈페이지" className="text-slate-400 hover:text-slate-700"><Globe className="w-3.5 h-3.5" /></a>}</td>
                          <td className="px-3 py-3 text-slate-700">{s.category}</td>
                          <td className="px-3 py-3 text-slate-700 whitespace-nowrap">{s.athlete?.name} 프로</td>
                          <td className="px-3 py-3"><span className="inline-flex gap-1">{(s.collabTypes?.length ? s.collabTypes : []).map((c: string) => { const I = COLLAB_ICON[c] || Box; const t = (opts?.collabTypes || []).find((x: any) => x.code === c); return <span key={c} title={t?.label} className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 inline-flex items-center justify-center"><I className="w-3.5 h-3.5" /></span>; })}{!s.collabTypes?.length && <span className="text-slate-400">—</span>}</span></td>
                          <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-md text-[11.5px] font-bold ${STAGE_TONE[s.status] || STAGE_TONE.RECEIVED}`}>{s.statusLabel}</span>{s.statusNote && <span className="block mt-0.5 text-[11px] text-slate-500 truncate max-w-[200px]" title={s.statusNote}>{s.statusNote}</span>}</td>
                          <td className="px-3 py-3 text-slate-600 tabular-nums whitespace-nowrap">{fmtDate(s.createdAt)}</td>
                          <td className="px-3 py-3"><Link to="/fan/activity" className="h-8 px-3 rounded-lg border border-slate-200 text-[12px] font-bold text-slate-700 inline-flex items-center hover:border-slate-400">상세보기</Link></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-2 text-center text-[11.5px] text-slate-500">표시된 정보는 익명 처리된 요약 정보입니다.</p>
                </div>
              ) : (
                <div className="mt-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 py-8 text-center"><Lightbulb className="w-5 h-5 text-slate-400 mx-auto" /><p className="mt-2 text-[13.5px] font-bold text-slate-600">아직 추천한 브랜드가 없습니다</p><p className="text-[12px] text-slate-500 break-keep">선수에게 어울리는 브랜드를 알려주시면 운영팀이 검토해 브랜드에 전달합니다.</p></div>
              )}
            </>
          )}
        </Panel>
        <p className="mt-3 text-[11.5px] text-slate-500 inline-flex items-center gap-1"><Store className="w-3.5 h-3.5" /> 추천이 곧 계약을 보장하지는 않으며, 브랜드의 검토 결과에 따라 종료될 수 있습니다.</p>
      </Container>
    </FanPage>
  );
}
