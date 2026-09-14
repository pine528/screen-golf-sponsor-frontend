/**
 * 후원하기 허브 `/sponsor` — 시안 2026-09-14 (Desktop · Mobile) + UI/UX 통합 가이드 v1.0 §5
 *
 *  히어로(질문 + 3단계 미니 플로우) → 2×2 후원 방식 카드(직접 PICK Green · 추천 PICK Coral · 지금 가능한 후원 · 디지털 파트너)
 *  → "선택이 어렵다면" 상황별 추천 경로 4개 → "간단한 4단계" 공통 흐름.
 *  후원하기 세부 화면의 "후원하기" 브레드크럼·이전 단계는 모두 이 화면으로 돌아온다.
 */
import { Link } from 'react-router-dom';
import {
  ArrowRight, BarChart3, ChevronRight, CreditCard, FileText, Handshake, Search,
  ShoppingBag, Sparkles, Tag, UserRound, Users,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';

const MINI_FLOW = [
  { icon: Users, title: '선택하기', desc: '후원 방식 선택' },
  { icon: FileText, title: '후원 진행', desc: '계약 및 결제' },
  { icon: BarChart3, title: '선수와 성장', desc: '더 큰 가능성으로' },
];

const PATHS = [
  {
    key: 'direct', tone: 'green' as const, icon: Tag, title: '직접 PICK',
    question: '누구에게 무엇을 후원할까?', desc: '선수 · 위치 · 기간 · 활동을 직접 구성',
    cta: '직접 PICK 시작', to: '/sponsor/direct/athletes',
  },
  {
    key: 'recommended', tone: 'coral' as const, icon: Sparkles, title: '스폰픽 추천 PICK', badge: 'AI 추천',
    question: '내 목표에 맞는 조합은?', desc: '목표 · 예산 · 타깃을 입력해 실행 가능한 후원안 추천',
    cta: '추천 받기', to: '/sponsor/recommended',
  },
  {
    key: 'available', tone: 'white' as const, icon: ShoppingBag, title: '지금 가능한 후원', badge: '바로 구매 가능',
    question: '지금 바로 살 수 있는 것은?', desc: '사전 구성된 후원상품을 비교 · 검토 · 구매',
    cta: '후원상품 보기', to: '/sponsor/available',
  },
  {
    key: 'digital', tone: 'white' as const, icon: Users, title: '디지털 파트너',
    question: '작은 예산으로 장기 연결하려면?', desc: '경기복 부착 없이 12개월 온라인 파트너십',
    cta: '월 구독 보기', to: '/digital-partner',
  },
];

const SITUATIONS = [
  { icon: Search, tone: 'bg-emerald-50 text-emerald-600', q: '맞춤 구성이 필요해요', label: '직접 PICK', to: '/sponsor/direct/athletes' },
  { icon: Sparkles, tone: 'bg-rose-50 text-rose-500', q: '무엇이 맞는지 모르겠어요', label: '추천 PICK', to: '/sponsor/recommended' },
  { icon: FileText, tone: 'bg-emerald-50 text-emerald-600', q: '바로 시작하고 싶어요', label: '지금 가능한 후원', to: '/sponsor/available' },
  { icon: Users, tone: 'bg-sky-50 text-sky-600', q: '온라인 중심으로 운영하고 싶어요', label: '디지털 파트너', to: '/digital-partner' },
];

const STEPS = [
  { icon: Search, title: '선택', desc: '원하는 후원 방식을 선택하세요.' },
  { icon: UserRound, title: '승인', desc: '제안 내용을 검토하고 승인합니다.' },
  { icon: Handshake, title: '계약 · 결제', desc: '계약을 진행하고 간편하게 결제합니다.', icon2: CreditCard },
  { icon: BarChart3, title: '실행 · 성과', desc: '후원이 시작되고 성과를 함께 확인합니다.' },
];

export default function SponsorLanding() {
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
            <span className="font-bold text-emerald-700">후원하기</span>
          </nav>

          <div className="mt-6 sm:mt-8 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] gap-8 lg:gap-6 items-center">
            <div>
              <h1 className="text-[30px] sm:text-[40px] font-extrabold tracking-[-0.03em] leading-[1.25] break-keep">
                어떤 방식으로<br />후원하시겠어요?
              </h1>
              <p className="mt-4 text-[14.5px] sm:text-[15.5px] text-slate-600 leading-[1.8] break-keep max-w-md">
                당신의 목표, 예산, 실행 방식에 맞는 최적의 후원 방법을 선택하세요.
                스폰픽이 더 특별한 스포츠 후원의 시작을 함께합니다.
              </p>
              <Link to="/about/how-it-works" className="mt-4 inline-flex items-center gap-1 text-[13.5px] font-bold text-slate-700 hover:text-emerald-700">
                이용방법 자세히 보기 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* 3단계 미니 플로우 */}
            <div className="relative">
              <p aria-hidden className="absolute -top-2 left-2 sm:left-6 font-script text-[22px] sm:text-[26px] leading-[1.1] text-emerald-500/80 -rotate-6 select-none">
                Sports<br />Connects<br />More Possibilities
              </p>
              <p className="absolute right-0 top-2 sm:top-4 rounded-2xl bg-white/90 shadow-sm border border-slate-100 px-3.5 py-2 text-[12.5px] font-bold text-slate-700 leading-snug">
                좋은 후원이<br />더 큰 내일을 만듭니다.
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

      {/* ── 후원 방식 4개 ── */}
      <section className="max-w-[1180px] mx-auto px-5 -mt-4 sm:-mt-6 relative">
        <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
          {PATHS.map((p) => {
            const I = p.icon;
            const dark = p.tone !== 'white';
            const bg = p.tone === 'green'
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-[0_18px_40px_-16px_rgba(16,185,129,0.55)]'
              : p.tone === 'coral'
                ? 'bg-gradient-to-br from-rose-500 to-red-500 text-white shadow-[0_18px_40px_-16px_rgba(244,63,94,0.5)]'
                : 'bg-white border border-slate-200 text-slate-900 shadow-[0_12px_32px_-18px_rgba(15,23,42,0.15)]';
            return (
              <Link key={p.key} to={p.to} className={`group relative overflow-hidden rounded-3xl p-5 sm:p-7 flex items-start gap-4 transition-transform hover:-translate-y-0.5 ${bg}`}>
                {p.key === 'direct' && (
                  <p aria-hidden className="absolute left-6 bottom-4 hidden sm:block text-[10.5px] font-extrabold tracking-[0.26em] uppercase leading-[1.8] text-white/20 select-none">
                    Athlete<br />Brand<br />Fan<br />For a brighter<br />tomorrow
                  </p>
                )}
                {!dark && (
                  <span aria-hidden className="absolute right-4 bottom-2 opacity-[0.07] text-slate-900">
                    <I className="w-24 h-24" />
                  </span>
                )}
                <span className={`w-14 h-14 sm:w-[72px] sm:h-[72px] rounded-full inline-flex items-center justify-center shrink-0 ${
                  dark ? 'bg-white' : p.key === 'available' ? 'bg-emerald-50' : 'bg-sky-50'
                }`}>
                  <I className={`w-7 h-7 sm:w-8 sm:h-8 ${p.tone === 'green' ? 'text-emerald-500' : p.tone === 'coral' ? 'text-rose-500' : p.key === 'available' ? 'text-emerald-600' : 'text-sky-600'}`} strokeWidth={2.2} />
                </span>
                <span className="min-w-0 flex-1 relative">
                  {p.badge && (
                    <span className={`inline-block mb-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-black ${dark ? 'bg-white/25 text-white' : 'bg-emerald-50 text-emerald-700'}`}>
                      {p.badge}
                    </span>
                  )}
                  <span className="block text-[22px] sm:text-[28px] font-extrabold leading-tight tracking-[-0.02em]">{p.title}</span>
                  <span className={`block mt-1.5 text-[14.5px] sm:text-[15.5px] font-bold ${dark ? 'text-white/95' : 'text-slate-800'}`}>{p.question}</span>
                  <span className={`block mt-1 text-[13px] sm:text-[13.5px] break-keep ${dark ? 'text-white/85' : 'text-slate-500'}`}>{p.desc}</span>
                  <span className={`mt-4 inline-flex items-center gap-1.5 h-11 px-5 rounded-full text-[13.5px] font-bold ${
                    dark ? 'bg-white text-slate-900' : 'border border-slate-300 text-slate-800 group-hover:border-slate-500'
                  }`}>
                    {p.cta} <ArrowRight className="w-4 h-4" />
                  </span>
                </span>
                <ChevronRight className={`w-5 h-5 shrink-0 mt-1 ${dark ? 'text-white/80' : 'text-slate-300'}`} />
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── 선택이 어렵다면 ── */}
      <section className="max-w-[1180px] mx-auto px-5 pt-10 sm:pt-12">
        <h2 className="text-[18px] sm:text-[20px] font-extrabold tracking-[-0.02em]">선택이 어렵다면</h2>
        <p className="mt-1 text-[13.5px] text-slate-500">당신의 상황에 맞는 추천 경로를 확인해보세요.</p>
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

      {/* ── 공통 4단계 ── */}
      <section className="max-w-[1180px] mx-auto px-5 py-10 sm:py-12">
        <div className="rounded-3xl bg-[#f2faf5] border border-emerald-100 px-5 sm:px-8 py-7 sm:py-8">
          <div className="text-center">
            <h2 className="text-[17px] sm:text-[19px] font-extrabold tracking-[-0.02em]">선수와 후원사를 더 가깝게, 스폰픽이 연결합니다.</h2>
            <p className="mt-1 text-[13.5px] text-slate-600">선택부터 실행까지, 간단한 4단계로 시작할 수 있습니다.</p>
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
    </div>
  );
}
