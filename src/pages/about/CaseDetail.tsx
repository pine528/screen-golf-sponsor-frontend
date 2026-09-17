/**
 * IU03 매칭사례 상세 + IU04 성과 근거 레이어 `/about/cases/:slug` — 시안 2026-09-17 (리디자인/10 · 28 · 30)
 *
 *  히어로(선수 프로 × 브랜드 · 검증 완료/투어/후원방식 칩 · 선수 사진 우측) → 브랜드 목표
 *  → 실행 요약 카드(아이콘 · 제목 · 설명 · 배지) → 진행 과정 원형 타임라인 → 성과 지표 4 + 브랜드 승인 코멘트 / 선수 코멘트
 *  → 비슷한 후원 추천받기
 *  근거 레이어: 지표 · 성과 정의 · 측정 기간 · 데이터 출처 · 마지막 검증일 · 집계 기준 · 공개 허용 범위 · 근거 자료 목록 · 원본 리포트(당사자만)
 */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Sparkles, Target, X, ShieldCheck, Lock, ExternalLink, Calendar, Database, Info, ArrowRight, Eye, Tv, Heart, MousePointerClick,
  Flag, FileSignature, Scissors, Camera, BarChart3, Quote, Shirt, Package, Hash, ChevronRight, ListChecks, Globe,
} from 'lucide-react';
import { api } from '../../services/api';
import AboutShell, { Tag, VerifiedBadge, StateNotice, Skeleton, visitorKey, ymd, ym } from '../../components/about/AboutShell';

const METRIC_ICON = (code: string, label: string) => {
  const s = `${code} ${label}`.toLowerCase();
  if (/broadcast|방송|중계|tv/.test(s)) return Tv;
  if (/sns|조회|view/.test(s)) return Eye;
  if (/fan|팬|반응|like/.test(s)) return Heart;
  if (/visit|방문|click|클릭/.test(s)) return MousePointerClick;
  return BarChart3;
};
const EXEC_ICON = (title: string) => {
  const s = title.toLowerCase();
  if (/모자|소매|패치|착장|셔츠/.test(s)) return Shirt;
  if (/대회|출전/.test(s)) return Flag;
  if (/sns|콘텐츠|영상/.test(s)) return Camera;
  if (/제품|상품/.test(s)) return Package;
  return Hash;
};
const TL_ICON = (label: string) => {
  const s = label;
  if (/계약/.test(s)) return FileSignature;
  if (/패치|제작/.test(s)) return Scissors;
  if (/대회|출전/.test(s)) return Flag;
  if (/콘텐츠/.test(s)) return Camera;
  if (/검증|성과/.test(s)) return BarChart3;
  return Flag;
};

/* 성과 근거 레이어 (IU04 · 시안 30) */
function EvidenceLayer({ metricId, onClose }: { metricId: string; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.getMetricEvidence(metricId).then((r) => setData(r.data)).catch(() => setData(null)).finally(() => setLoading(false)); }, [metricId]);
  const I = data?.metric ? METRIC_ICON(data.metric.metricCode, data.metric.label) : BarChart3;
  const vs = data?.verification?.status;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6" onClick={onClose}>
      <div className="w-full max-w-3xl max-h-full overflow-y-auto rounded-[28px] bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-[18px] font-extrabold text-slate-900">성과 근거 상세</h2>
          <button onClick={onClose} aria-label="닫기" className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-500" /></button>
        </div>
        {loading ? (
          <div className="p-6 space-y-3"><Skeleton className="h-24" /><Skeleton className="h-40" /></div>
        ) : !data ? (
          <div className="p-6"><StateNotice kind="error" title="근거를 불러오지 못했습니다" /></div>
        ) : data.restricted ? (
          <div className="p-6"><StateNotice kind="restricted" title="이 지표는 공개 범위 밖입니다" desc={data.reason} /></div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><I className="w-7 h-7" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-slate-500">성과 지표</p>
                <p className="text-[20px] font-extrabold text-slate-900">{data.metric.label}</p>
              </div>
              <p className="text-[30px] sm:text-[36px] font-black text-emerald-700 tabular-nums leading-none break-keep">{data.metric.display}</p>
              <span className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-lg border text-[12.5px] font-bold ${vs === 'FINAL' || vs === 'VERIFIED' ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : 'border-slate-200 text-slate-600'}`}><ShieldCheck className="w-3.5 h-3.5" /> {vs === 'FINAL' ? '최종 검증' : vs === 'VERIFIED' ? '검증 완료' : '수집 값'}</span>
            </div>
            <div className="grid sm:grid-cols-2 rounded-2xl border border-slate-200 divide-y sm:divide-y-0 divide-slate-100 overflow-hidden">
              {[
                { icon: Info, label: '성과 정의', value: data.definition ?? '정의가 등록되지 않았습니다' },
                { icon: ShieldCheck, label: '마지막 검증일', value: data.verification.verifiedAt ? ymd(data.verification.verifiedAt) : '검증 기록 없음' },
                { icon: Calendar, label: '측정 기간', value: data.period.start && data.period.end ? `${ymd(data.period.start)} – ${ymd(data.period.end)} (${Math.round((new Date(data.period.end).getTime() - new Date(data.period.start).getTime()) / 86400_000) + 1}일)` : '기간 정보 없음' },
                { icon: ListChecks, label: '집계 기준', value: data.aggregationNote ?? '집계 기준이 등록되지 않았습니다' },
                { icon: Database, label: '데이터 출처', value: data.source.name ? `${data.source.name}${data.source.type ? ` (${data.source.type})` : ''}` : '출처 미등록' },
                { icon: Globe, label: '공개 허용 범위', value: data.visibility?.label ?? '—' },
              ].map((r, i) => { const RI = r.icon; return (
                <div key={r.label} className={`p-4 flex gap-3 ${i % 2 === 0 ? 'sm:border-r border-slate-100' : ''} ${i >= 2 ? 'sm:border-t' : ''}`}>
                  <span className="w-9 h-9 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center shrink-0"><RI className="w-4 h-4" /></span>
                  <div className="min-w-0"><p className="text-[12px] font-bold text-slate-500">{r.label}</p><p className="mt-0.5 text-[13px] text-slate-700 leading-relaxed break-keep">{r.value}</p></div>
                </div>
              ); })}
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between"><p className="text-[14px] font-extrabold">근거 자료 목록</p><span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11.5px] font-bold">상태: {vs ?? '—'}</span></div>
              {data.attachments?.length ? (
                <ul className="mt-3 divide-y divide-slate-100">{data.attachments.map((a: any, i: number) => <li key={i} className="py-2.5 flex items-center gap-3 text-[13px]"><span className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0"><Database className="w-4 h-4" /></span><span className="flex-1 min-w-0 truncate font-bold text-slate-800">{a.name}</span><a href={a.url} target="_blank" rel="noopener noreferrer" className="text-emerald-700 inline-flex items-center gap-1 font-bold shrink-0">열기 <ExternalLink className="w-3.5 h-3.5" /></a></li>)}</ul>
              ) : (
                <p className="mt-3 text-[12.5px] text-slate-500 break-keep">{data.rawReportNotice ?? '등록된 근거 파일이 없습니다.'} 출처 정보는 위 표에서 확인할 수 있습니다.</p>
              )}
            </div>
            <div className="rounded-2xl bg-emerald-50 px-4 py-3.5 flex items-start gap-2.5"><ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" /><p className="text-[12.5px] text-emerald-800 leading-relaxed break-keep">{data.notice}</p></div>
            <div className="grid grid-cols-2 gap-2">
              {data.rawReportUri ? (
                <a href={data.rawReportUri} target="_blank" rel="noopener noreferrer" className="h-12 rounded-xl border border-slate-200 text-[14px] font-bold text-slate-700 flex items-center justify-center gap-1.5 hover:border-slate-400">원본 리포트 보기 <ExternalLink className="w-4 h-4" /></a>
              ) : (
                <div className="h-12 rounded-xl bg-slate-50 text-[13px] font-semibold text-slate-400 flex items-center justify-center gap-1.5"><Lock className="w-4 h-4" /> {data.rawReportNotice}</div>
              )}
              <button onClick={onClose} className="h-12 rounded-xl border border-slate-200 text-[14px] font-bold text-slate-800 hover:bg-slate-50 transition">닫기</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CaseDetail() {
  const { slug = '' } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [evidenceId, setEvidenceId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.getMatchingCase(slug)
      .then((r) => { setData(r.data); api.trackAboutEvent({ event: 'case_view', pageSlug: 'case-detail', visitorKey: visitorKey(), params: { caseId: r.data?.id } }).catch(() => null); })
      .catch(() => setData(null)).finally(() => setLoading(false));
  }, [slug]);

  const openEvidence = (m: any) => {
    if (m.restricted) return;
    setEvidenceId(m.id);
    api.trackAboutEvent({ event: 'evidence_open', pageSlug: 'case-detail', visitorKey: visitorKey(), params: { metricCode: m.metricCode, visibility: m.visibility } }).catch(() => null);
  };

  if (loading) {
    return <AboutShell current="cases"><div className="max-w-[1280px] mx-auto px-5 py-10 space-y-4"><Skeleton className="h-[260px] rounded-3xl" /><Skeleton className="h-[300px] rounded-3xl" /></div></AboutShell>;
  }
  if (!data) {
    return <AboutShell current="cases"><div className="max-w-2xl mx-auto px-5 py-20"><StateNotice kind="error" title="사례를 찾을 수 없습니다" action={<Link to="/about/cases" className="inline-flex h-11 px-5 rounded-2xl bg-slate-900 text-white text-[14px] font-bold items-center">목록으로</Link>} /></div></AboutShell>;
  }

  const execution = (data.execution as any[]) ?? [];
  const timeline = (data.timeline as any[]) ?? [];
  const brandQuote = data.quotes?.find((q: any) => q.speaker === 'BRAND');
  const athleteQuote = data.quotes?.find((q: any) => q.speaker === 'ATHLETE');
  const title = `${data.athleteName} 프로 × ${data.brand.name}`;

  return (
    <AboutShell current="cases" crumb={[{ label: '매칭사례', to: '/about/cases' }, { label: `${data.athleteName} × ${data.brand.name}` }]}>
      <div className="max-w-[1280px] mx-auto px-5 pb-20">
        {data.archived && <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 text-[13px] text-amber-800">보관된 사례입니다. 최신 정보와 다를 수 있습니다.</div>}

        {/* 히어로 */}
        <section className="relative mt-5 rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-50 via-white to-emerald-50/60 border border-emerald-100">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_460px]">
            <div className="p-6 sm:p-8">
              <Link to="/about/cases" className="inline-flex items-center gap-1 text-[12.5px] font-bold text-slate-500 hover:text-slate-700"><ArrowLeft className="w-3.5 h-3.5" /> 매칭사례</Link>
              <h1 className="mt-3 text-[30px] sm:text-[44px] font-extrabold tracking-[-0.03em] leading-tight break-keep">{data.athleteName} 프로 <span className="text-slate-300 mx-1">×</span> {data.brand.name}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                {data.verified && <VerifiedBadge />}
                {data.tour && <Tag tone="sky">{data.tour}</Tag>}
                {data.sponsorTypes?.map((t: string) => <Tag key={t} tone="violet">{t}</Tag>)}
                {data.objectiveLabels?.map((t: string) => <Tag key={t}>{t}</Tag>)}
              </div>
              {(data.background || data.summary) && (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white/90 p-4 flex gap-3.5 max-w-xl">
                  <span className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><Target className="w-[18px] h-[18px]" /></span>
                  <div><p className="text-[12.5px] font-extrabold text-slate-800 mb-1">브랜드 목표</p><p className="text-[13.5px] text-slate-700 leading-relaxed whitespace-pre-line break-keep">{data.background || data.summary}</p></div>
                </div>
              )}
              {(data.periodFrom || data.periodTo) && <p className="mt-4 text-[12.5px] text-slate-500 inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> 후원 기간 {ym(data.periodFrom)}{data.periodTo ? ` ~ ${ym(data.periodTo)}` : ''}</p>}
            </div>
            <div className="relative min-h-[260px] lg:min-h-[380px] bg-slate-100">
              {data.heroImageUrl ? <img src={data.heroImageUrl} alt={title} className="absolute inset-0 w-full h-full object-cover object-top" /> : <div className="absolute inset-0 flex items-center justify-center text-slate-300"><Shirt className="w-16 h-16" /></div>}
              <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent hidden lg:block" />
            </div>
          </div>
        </section>

        {/* 실행 요약 */}
        {execution.length > 0 && (
          <section className="mt-10">
            <h2 className="text-[18px] font-extrabold text-slate-900 mb-4">실행 요약</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {execution.map((b: any, i: number) => { const I = EXEC_ICON(b.title || ''); return (
                <div key={i} className="rounded-3xl border border-slate-200 bg-white p-5 flex gap-3.5">
                  <span className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><I className="w-5 h-5" /></span>
                  <div className="min-w-0"><p className="text-[15px] font-extrabold text-slate-900">{b.title}</p><p className="mt-1 text-[12.5px] text-slate-500 leading-relaxed whitespace-pre-line break-keep">{b.desc}</p>{b.badge && <span className="mt-2.5 inline-block"><Tag>{b.badge}</Tag></span>}</div>
                </div>
              ); })}
            </div>
          </section>
        )}

        {/* 진행 과정 */}
        {timeline.length > 0 && (
          <section className="mt-10">
            <h2 className="text-[18px] font-extrabold text-slate-900 mb-4">진행 과정</h2>
            <ol className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {timeline.map((t: any, i: number) => { const I = TL_ICON(t.label || ''); return (
                <li key={i} className="relative flex items-center gap-3">
                  <span className="w-12 h-12 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0"><I className="w-5 h-5" /></span>
                  <span className="min-w-0"><span className="block text-[14px] font-extrabold">{t.label}</span><span className="block text-[12px] text-slate-500 tabular-nums">{t.date}</span></span>
                  {i < timeline.length - 1 && <ChevronRight className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />}
                </li>
              ); })}
            </ol>
          </section>
        )}

        {/* 성과 지표 + 코멘트 */}
        <section className="mt-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-6">
          <div>
            <div className="flex items-end justify-between mb-4"><h2 className="text-[18px] font-extrabold text-slate-900">성과 지표</h2><p className="text-[12px] text-slate-500">지표를 누르면 측정 근거를 볼 수 있습니다</p></div>
            {data.metrics?.length ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {data.metrics.map((m: any) => { const I = METRIC_ICON(m.metricCode, m.label); return (
                  <button key={m.id} onClick={() => openEvidence(m)} disabled={m.restricted}
                    className={`text-left rounded-3xl border p-5 transition ${m.restricted ? 'border-slate-100 bg-slate-50/60 cursor-default' : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-[0_12px_30px_-18px_rgba(16,185,129,0.5)]'}`}>
                    <div className="flex items-center gap-3">
                      <span className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${m.restricted ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-600'}`}><I className="w-5 h-5" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-slate-600">{m.label}</p>
                        {m.restricted
                          ? <p className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500"><Lock className="w-3.5 h-3.5" /> {m.restrictedReason}</p>
                          : <p className={`mt-0.5 font-black text-slate-900 tabular-nums leading-tight break-keep ${m.qualitative ? 'text-[15px]' : 'text-[26px]'}`}>{m.display}{m.approximate && <span className="ml-1.5 text-[12px] font-bold text-slate-500">근사</span>}</p>}
                      </div>
                    </div>
                    {!m.restricted && (
                      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11.5px] text-slate-500">
                        <span className="truncate">측정 기간 {m.periodStart && m.periodEnd ? `${ymd(m.periodStart)} ~ ${ymd(m.periodEnd)}` : '—'}</span>
                        <span className="truncate">출처 {m.evidence?.sourceName ?? '미등록'}</span>
                      </div>
                    )}
                  </button>
                ); })}
              </div>
            ) : (
              <StateNotice kind="partial" title="공개된 성과 지표가 없습니다" desc={'검증이 끝난 지표만 공개합니다. 집계가 완료되면 이곳에 표시됩니다.'} />
            )}
            <p className="mt-3 text-[12.5px] text-slate-500 break-keep">{data.evidenceNotice}</p>
          </div>
          <div className="space-y-4">
            {brandQuote && (
              <div><p className="text-[14px] font-extrabold mb-2">브랜드 승인 코멘트</p>
                <div className="grid grid-cols-[110px_1fr] gap-3 items-start">
                  <div className="h-full rounded-2xl border border-slate-200 bg-white flex items-center justify-center p-3 min-h-[80px]">{data.brand.logoUrl ? <img src={data.brand.logoUrl} alt={data.brand.name} className="max-h-10 max-w-full object-contain" /> : <span className="text-[13px] font-bold text-slate-700 text-center">{data.brand.name}</span>}</div>
                  <blockquote className="rounded-2xl border border-slate-200 bg-white p-4 relative"><Quote className="absolute left-3 top-3 w-4 h-4 text-emerald-200" /><p className="pl-4 text-[13.5px] text-slate-700 leading-relaxed break-keep">{brandQuote.content}</p><footer className="mt-2 pl-4 text-[12px] text-slate-500">{brandQuote.authorName}{brandQuote.authorRole ? ` · ${brandQuote.authorRole}` : ''}</footer></blockquote>
                </div>
              </div>
            )}
            {athleteQuote && (
              <div><p className="text-[14px] font-extrabold mb-2">선수 코멘트</p>
                <div className="grid grid-cols-[110px_1fr] gap-3 items-start">
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 flex flex-col items-center gap-1.5 min-h-[80px] justify-center">{(athleteQuote.avatarUrl || data.heroImageUrl) ? <img src={athleteQuote.avatarUrl || data.heroImageUrl} alt="" className="w-12 h-12 rounded-full object-cover object-top" /> : <span className="w-12 h-12 rounded-full bg-slate-100" />}<span className="text-[12px] font-bold text-slate-700">{athleteQuote.authorName}</span></div>
                  <blockquote className="rounded-2xl border border-slate-200 bg-white p-4 relative"><Quote className="absolute left-3 top-3 w-4 h-4 text-emerald-200" /><p className="pl-4 text-[13.5px] text-slate-700 leading-relaxed break-keep">{athleteQuote.content}</p></blockquote>
                </div>
              </div>
            )}
            {!brandQuote && !athleteQuote && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-5 text-[12.5px] text-slate-500 break-keep">당사자가 승인한 코멘트가 등록되면 이곳에 표시됩니다.</div>
            )}
            {data.brand.slug && <Link to={`/about/brands/${data.brand.slug}`} className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] font-bold text-slate-700 hover:border-emerald-300 inline-flex items-center justify-between w-full">{data.brand.name} 브랜드 보기 <ChevronRight className="w-4 h-4 text-slate-400" /></Link>}
          </div>
        </section>

        {data.related?.length > 0 && (
          <section className="mt-10">
            <h2 className="text-[18px] font-extrabold text-slate-900 mb-4">같은 브랜드의 다른 사례</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {data.related.map((r: any) => (
                <Link key={r.slug} to={`/about/cases/${r.slug}`} className="rounded-3xl border border-slate-200 overflow-hidden bg-white hover:border-slate-300 transition">
                  <div className="aspect-[16/9] bg-slate-100">{r.heroImageUrl && <img src={r.heroImageUrl} alt="" className="w-full h-full object-cover object-top" />}</div>
                  <div className="p-4"><p className="text-[13.5px] font-bold text-slate-900 truncate">{r.athleteName}</p><p className="text-[12px] text-slate-500 mt-0.5 line-clamp-1">{r.title}</p></div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-10 text-center">
          <Link to={data.cta?.to ?? '/sponsor/recommended'} onClick={() => api.trackAboutEvent({ event: 'intro_cta_click', pageSlug: 'case-detail', visitorKey: visitorKey(), params: { cta: 'similar' } }).catch(() => null)}
            className="h-14 px-10 rounded-2xl bg-emerald-700 text-white text-[16px] font-extrabold inline-flex items-center gap-2 hover:bg-emerald-800 transition"><Sparkles className="w-5 h-5" /> {data.cta?.label ?? '비슷한 후원 추천받기'} <ArrowRight className="w-4 h-4" /></Link>
        </section>
      </div>
      {evidenceId && <EvidenceLayer metricId={evidenceId} onClose={() => setEvidenceId(null)} />}
    </AboutShell>
  );
}
