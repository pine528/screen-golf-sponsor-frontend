/**
 * 선수 허브 `/athletes` — 시안 2026-09-15 (Desktop · Mobile)
 *
 *  히어로(질문 + 찾기→비교하기→선택하기 미니 플로우)
 *  → 2×2 메뉴 카드(선수 찾기 Green · 나에게 맞는 선수 Coral · 선수 비교 Blue · 관심 선수 Yellow)
 *  → "선택이 어렵다면" 상황별 경로 4개 → "간단한 4단계" → 선수 등록 CTA.
 *  헤더 "선수" 메뉴와 모바일 탭의 선수는 이 화면으로 온다. 선수 목록은 /athletes/find.
 */
import { Link } from 'react-router-dom';
import {
  ArrowRight, BarChart3, CheckCircle2, ChevronRight, ClipboardList, Heart, Search, Target, UserRound,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';

const MINI_FLOW = [
  { icon: Search, title: '찾기', desc: '다양한 선수 탐색' },
  { icon: BarChart3, title: '비교하기', desc: '여러 선수를 한눈에' },
  { icon: CheckCircle2, title: '선택하기', desc: '최적의 선수를 결정' },
];

const MENUS = [
  {
    key: 'find', tone: 'green' as const, icon: Search, title: '선수 찾기',
    desc: '등록된 다양한 선수를 검색하고 필터로 빠르게 찾아보세요.',
    cta: '선수 찾기 시작', to: '/athletes/search',
  },
  {
    key: 'match', tone: 'coral' as const, icon: Target, title: '나에게 맞는 선수',
    desc: '목표와 타겟에 맞는 선수를 AI가 추천해드립니다.',
    cta: '추천받기', to: '/athletes/match',
  },
  {
    key: 'compare', tone: 'blue' as const, icon: BarChart3, title: '선수 비교',
    desc: '최대 3명의 선수를 한 번에 비교하고 가장 적합한 선수를 선택해보세요.',
    cta: '선수 비교하기', to: '/athletes/compare',
  },
  {
    key: 'favorites', tone: 'yellow' as const, icon: Heart, title: '관심 선수',
    desc: '관심 있는 선수를 저장하고 새로운 소식을 받아보세요.',
    cta: '관심 선수 보기', to: '/athletes/favorites',
  },
];

const SITUATIONS = [
  { icon: Search, tone: 'bg-emerald-50 text-emerald-600', q: '바로 탐색하고 싶어요', label: '선수 찾기', to: '/athletes/search' },
  { icon: Target, tone: 'bg-rose-50 text-rose-500', q: '추천이 필요해요', label: '나에게 맞는 선수', to: '/athletes/match' },
  { icon: BarChart3, tone: 'bg-sky-50 text-sky-600', q: '몇 명을 비교하고 싶어요', label: '선수 비교', to: '/athletes/compare' },
  { icon: Heart, tone: 'bg-amber-50 text-amber-600', q: '찜한 선수만 보고 싶어요', label: '관심 선수', to: '/athletes/favorites' },
];

const STEPS = [
  { icon: Search, title: '찾기', desc: '다양한 선수를 검색하고 필터링합니다.' },
  { icon: ClipboardList, title: '확인', desc: '선수 프로필과 주요 정보를 확인하세요.' },
  { icon: BarChart3, title: '비교', desc: '여러 선수를 한눈에 비교해보세요.' },
  { icon: CheckCircle2, title: '선택', desc: '가장 적합한 선수를 선택하고, 관심에 추가하세요.' },
];

const TONE = {
  green: {
    card: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-[0_18px_40px_-16px_rgba(16,185,129,0.55)]',
    icon: 'bg-white text-emerald-500', body: 'text-white/90', btn: 'bg-white text-slate-900', chev: 'text-white/80',
  },
  coral: {
    card: 'bg-gradient-to-br from-rose-500 to-red-500 text-white shadow-[0_18px_40px_-16px_rgba(244,63,94,0.5)]',
    icon: 'bg-white text-rose-500', body: 'text-white/90', btn: 'bg-white text-slate-900', chev: 'text-white/80',
  },
  blue: {
    card: 'bg-gradient-to-br from-sky-200 to-sky-300 text-slate-900 shadow-[0_18px_40px_-18px_rgba(14,165,233,0.45)]',
    icon: 'bg-white text-sky-600', body: 'text-slate-700', btn: 'bg-white text-slate-900', chev: 'text-slate-500',
  },
  yellow: {
    card: 'bg-gradient-to-br from-amber-200 to-amber-300 text-slate-900 shadow-[0_18px_40px_-18px_rgba(245,158,11,0.45)]',
    icon: 'bg-white text-amber-500', body: 'text-slate-700', btn: 'bg-white text-slate-900', chev: 'text-slate-500',
  },
};

export default function AthletesHub() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicHeader />

      {/* ── 히어로 ── */}
      <section className="relative bg-[#f2faf5] overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute right-[-120px] top-[-80px] w-[520px] h-[520px] rounded-full bg-emerald-100/50 blur-2xl" />
          <div className="absolute left-[30%] bottom-[-160px] w-[420px] h-[420px] rounded-full bg-emerald-200/30 blur-3xl" />
        </div>
        <div className="max-w-[1180px] mx-auto px-5 pt-5 pb-10 sm:pb-14 relative">
          <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[13px]">
            <Link to="/" className="text-slate-500 hover:text-slate-700">홈</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-bold text-emerald-700">선수</span>
          </nav>

          <div className="mt-6 sm:mt-8 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] gap-8 lg:gap-6 items-center">
            <div>
              <h1 className="text-[30px] sm:text-[40px] font-extrabold tracking-[-0.03em] leading-[1.25] break-keep">
                어떤 선수를<br />찾고 계신가요?
              </h1>
              <p className="mt-4 text-[14.5px] sm:text-[15.5px] text-slate-600 leading-[1.8] break-keep max-w-md">
                목표와 취지에 맞는 선수를 찾고, 비교하고, 관심 선수로 저장해보세요.
                스폰픽이 더 나은 선택을 도와드립니다.
              </p>
              <Link to="/guide" className="mt-4 inline-flex items-center gap-1 text-[13.5px] font-bold text-slate-700 hover:text-emerald-700">
                선수 탐색 가이드 보기 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* 3단계 미니 플로우 */}
            <div className="relative">
              <p aria-hidden className="absolute -top-2 left-2 sm:left-6 font-script text-[22px] sm:text-[26px] leading-[1.1] text-emerald-500/80 -rotate-6 select-none">
                Athletes<br />Connect<br />More Possibilities
              </p>
              <p className="absolute right-0 top-2 sm:top-4 rounded-2xl bg-white/90 shadow-sm border border-slate-100 px-3.5 py-2 text-[12.5px] font-bold text-slate-700 leading-snug">
                좋은 선수가<br />더 큰 가능성을 만듭니다.
              </p>
              <ol className="pt-24 sm:pt-28 flex items-start justify-center gap-2 sm:gap-4">
                {MINI_FLOW.map((f, i) => {
                  const I = f.icon;
                  return (
                    <li key={f.title} className="flex items-start gap-2 sm:gap-4">
                      <div className="text-center w-[88px] sm:w-[110px]">
                        <span className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white shadow-[0_10px_24px_-12px_rgba(16,185,129,0.5)] inline-flex items-center justify-center text-emerald-600">
                          <I className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2} />
                        </span>
                        <p className="mt-2.5 text-[13.5px] font-extrabold text-slate-900">{f.title}</p>
                        <p className="text-[12px] text-slate-500">{f.desc}</p>
                      </div>
                      {i < MINI_FLOW.length - 1 && <ChevronRight className="w-5 h-5 text-emerald-400 mt-5 sm:mt-6 shrink-0" />}
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ── 메뉴 4개 ── */}
      <section className="max-w-[1180px] mx-auto px-5 -mt-4 sm:-mt-6 relative">
        <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
          {MENUS.map((m) => {
            const I = m.icon;
            const t = TONE[m.tone];
            return (
              <Link key={m.key} to={m.to} className={`group relative overflow-hidden rounded-3xl p-5 sm:p-7 flex items-start gap-4 transition-transform hover:-translate-y-0.5 ${t.card}`}>
                {m.key === 'find' && (
                  <p aria-hidden className="absolute left-6 bottom-4 hidden sm:block text-[10.5px] font-extrabold tracking-[0.26em] uppercase leading-[1.8] text-white/25 select-none">
                    Athletes<br />Today<br />A brighter<br />tomorrow
                  </p>
                )}
                {(m.tone === 'blue' || m.tone === 'yellow') && (
                  <span aria-hidden className="absolute right-5 bottom-3 opacity-20 text-white">
                    <I className="w-24 h-24" />
                  </span>
                )}
                <span className={`w-14 h-14 sm:w-[72px] sm:h-[72px] rounded-full inline-flex items-center justify-center shrink-0 shadow-sm ${t.icon}`}>
                  <I className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2.2} />
                </span>
                <span className="min-w-0 flex-1 relative">
                  <span className="block text-[22px] sm:text-[28px] font-extrabold leading-tight tracking-[-0.02em]">{m.title}</span>
                  <span className={`block mt-1.5 text-[13.5px] sm:text-[15px] font-semibold leading-relaxed break-keep ${t.body}`}>{m.desc}</span>
                  <span className={`mt-4 inline-flex items-center gap-1.5 h-11 px-5 rounded-full text-[13.5px] font-bold ${t.btn}`}>
                    {m.cta} <ArrowRight className="w-4 h-4" />
                  </span>
                </span>
                <ChevronRight className={`w-5 h-5 shrink-0 mt-1 ${t.chev}`} />
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── 선택이 어렵다면 ── */}
      <section className="max-w-[1180px] mx-auto px-5 pt-10 sm:pt-12">
        <h2 className="text-[18px] sm:text-[20px] font-extrabold tracking-[-0.02em]">선택이 어렵다면</h2>
        <p className="mt-1 text-[13.5px] text-slate-500">지금 상황에 맞는 방법을 선택해보세요.</p>
        <ul className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {SITUATIONS.map((s) => {
            const I = s.icon;
            return (
              <li key={s.q}>
                <Link to={s.to} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 hover:border-emerald-300 hover:shadow-[0_10px_24px_-16px_rgba(15,23,42,0.2)] transition-all">
                  <span className={`w-10 h-10 rounded-full inline-flex items-center justify-center shrink-0 ${s.tone}`}><I className="w-[18px] h-[18px]" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] text-slate-500">{s.q}</span>
                    <span className="block text-[14.5px] font-extrabold text-slate-900">{s.label}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── 4단계 ── */}
      <section className="max-w-[1180px] mx-auto px-5 pt-8 sm:pt-10">
        <div className="rounded-3xl bg-[#f2faf5] border border-emerald-100 px-5 sm:px-8 py-7 sm:py-8">
          <div className="text-center">
            <h2 className="text-[17px] sm:text-[19px] font-extrabold tracking-[-0.02em]">선수를 더 쉽게 찾고 비교하세요.</h2>
            <p className="mt-1 text-[13.5px] text-slate-600">간단한 4단계로 원하는 선수를 만나보세요.</p>
          </div>
          <ol className="mt-6 grid grid-cols-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] gap-4 lg:gap-2 items-start">
            {STEPS.map((s, i) => {
              const I = s.icon;
              return (
                <li key={s.title} className="contents">
                  <div className="flex items-start gap-3">
                    <span className="w-12 h-12 rounded-full bg-white shadow-sm inline-flex items-center justify-center text-emerald-600 shrink-0"><I className="w-5 h-5" /></span>
                    <div className="min-w-0">
                      <p className="text-[14px] font-extrabold text-slate-900">{i + 1}. {s.title}</p>
                      <p className="mt-0.5 text-[12.5px] text-slate-600 leading-relaxed break-keep">{s.desc}</p>
                    </div>
                  </div>
                  {i < STEPS.length - 1 && <ChevronRight aria-hidden className="hidden lg:block w-5 h-5 text-slate-300 mt-3.5" />}
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ── 선수 등록 CTA ── */}
      <section className="max-w-[1180px] mx-auto px-5 py-8 sm:py-10">
        <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-white px-5 sm:px-8 py-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <p aria-hidden className="absolute right-[26%] top-3 hidden lg:block font-script text-[22px] leading-[1.1] text-emerald-500/70 -rotate-6 select-none">
            Your Story<br />More Opportunities
          </p>
          <span className="w-14 h-14 rounded-full bg-emerald-50 inline-flex items-center justify-center text-emerald-600 shrink-0">
            <UserRound className="w-7 h-7" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[18px] sm:text-[20px] font-extrabold tracking-[-0.02em]">선수이신가요?</p>
            <p className="mt-1 text-[13.5px] text-slate-600 leading-relaxed break-keep">
              당신의 가능성을 더 많은 사람들에게 알려보세요. 지금 바로 선수로 등록하고 새로운 기회를 만나보세요.
            </p>
          </div>
          <Link to="/register" className="shrink-0 h-12 px-6 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-white text-[14px] font-bold hover:bg-emerald-700">
            선수 등록하기 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
