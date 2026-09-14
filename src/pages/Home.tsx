/**
 * 메인 — SPONPIK 2.0 메인 시안 (리디자인/7, 2026-09-07) + 통합 핸드오프 v2.1 §1·§2
 *
 *  - 첫 화면의 주 CTA는 직접 PICK / 스폰픽 추천 PICK 두 개뿐이다 (v2.1 §1.3-1, UI 가이드 §4).
 *  - 지금 가능한 후원 · 디지털 파트너는 텍스트 보조 링크로만 둔다.
 *  - 선수 실사 위 핫스폿은 "위치 슬롯" 개념만 암시한다: 모자 / 소매 / 카라 / 상의 / 하의 슬롯.
 *  - 시안 구성: 히어로 → 4단계 → 함께하는 브랜드 → 새로운 가치 → 최종 CTA → 푸터.
 *    선수 카드 대량 노출·경매 현황·VOTE·상품 목록은 메인에 두지 않는다 (UI 가이드 §4.3).
 */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BarChart3, ChevronLeft, ChevronRight, FileText, Handshake,
  Instagram, Search, Sparkles, Tag, UserRound, Users, Youtube,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ServiceAnnouncementModal } from '../components/ServiceAnnouncementModal';
import PublicHeader from '../components/PublicHeader';

/* 히어로 핫스폿 — 실사 위 후원 위치 안내. 클릭은 직접 PICK 예고 (핸드오프 §2.1) */
const HOTSPOTS: { key: string; label: string; x: number; y: number; side: 'left' | 'right'; mobile?: boolean }[] = [
  { key: 'cap', label: '모자 슬롯', x: 51, y: 9, side: 'left', mobile: true },
  { key: 'sleeve', label: '소매 슬롯', x: 88, y: 20, side: 'right' },
  { key: 'collar', label: '카라 슬롯', x: 53, y: 24, side: 'left' },
  { key: 'top', label: '상의 슬롯', x: 57, y: 43, side: 'left', mobile: true },
  { key: 'bottom', label: '하의 슬롯', x: 66, y: 68, side: 'right', mobile: true },
];

const STEPS = [
  { no: 1, icon: UserRound, title: '선수 선택', desc: '응원하고 싶은 선수를\n선택하세요.' },
  { no: 2, icon: FileText, title: '후원 구성', desc: '원하는 후원 방식과\n옵션을 구성하세요.' },
  { no: 3, icon: Handshake, title: '승인 · 계약', desc: '간편한 절차로\n빠르게 진행됩니다.' },
  { no: 4, icon: BarChart3, title: '성과 확인', desc: '선수의 성장과 성과를\n함께 확인하세요.' },
];

const BRANDS = [
  { src: '/brands/orex.png', name: 'OREX' },
  { src: '/brands/fau.png', name: 'FAU' },
  { src: '/brands/elensilia.png', name: 'ELENSILIA' },
  { src: '/brands/nature-republic.png', name: 'NATURE REPUBLIC' },
  { src: '/brands/kilogram-studio.png', name: 'Kilogram studio' },
  { src: '/brands/brrr-studio.png', name: 'Brrr. studio' },
  { src: '/brands/nlt1.png', name: 'NLT1 COMPANY' },
  { src: '/brands/ahnguk-health.png', name: '안국건강' },
  { src: '/brands/the-guys.png', name: 'THE GUYS' },
  { src: '/brands/andante.png', name: 'ANDANTE' },
  { src: '/brands/elgrim.png', name: 'ELGRIM' },
  { src: '/brands/hoi-bakery.png', name: 'HOI BAKERY' },
];

const VALUES = [
  { icon: Search, tone: 'bg-emerald-50 text-emerald-600', title: '선수를 발견하다', desc: '다양한 선수의 경기력과 데이터를 비교할 수 있습니다.' },
  { icon: Handshake, tone: 'bg-rose-50 text-rose-500', title: '후원을 시작하다', desc: '목표에 맞는 후원 방식을 선택해, 안전하게 연결됩니다.' },
  { icon: Users, tone: 'bg-sky-50 text-sky-600', title: '팬이 함께하다', desc: '팬의 응원이 선수의 새로운 가능성을 만듭니다.' },
  { icon: BarChart3, tone: 'bg-emerald-50 text-emerald-600', title: '더 큰 가치를 만들다', desc: '후원이 실질적인 기회와 사회적 가치를 만듭니다.' },
];

export function Home() {
  const { isAuthenticated } = useAuth();
  const [tipKey, setTipKey] = useState<string | null>(null);

  const showTip = (key: string) => {
    setTipKey(key);
    window.setTimeout(() => setTipKey((k) => (k === key ? null : k)), 2200);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      <ServiceAnnouncementModal />
      <PublicHeader fixed />

      {/* ════════════════ HERO — 두 개의 PICK ════════════════ */}
      <section className="relative pt-16 lg:pt-[72px] bg-[#f2faf5] overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -right-40 bottom-[-30%] w-[720px] h-[720px] rounded-full bg-emerald-100/50" />
          <div className="absolute left-[-10%] top-[-20%] w-[420px] h-[420px] rounded-full bg-emerald-100/30 blur-2xl" />
          {/* 워터마크 카피 (시안 좌하단) */}
          <p className="hidden lg:block absolute left-[max(20px,calc((100%-1280px)/2+20px))] bottom-9 text-[13px] font-extrabold tracking-[0.28em] uppercase leading-[1.9] text-emerald-900/[0.07] select-none">
            Athlete<br />Brand<br />Fan<br />For a brighter<br />tomorrow
          </p>
          {/* 필기체 슬로건 (시안 우하단) */}
          <p className="hidden lg:block absolute right-[max(24px,calc((100%-1280px)/2+24px))] bottom-10 text-right font-script text-[26px] leading-[1.15] text-emerald-500/70 -rotate-6 select-none">
            Sports<br />Connects<br />More Possibilities
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-5 relative">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,470px)_minmax(0,400px)] items-center gap-4 lg:gap-6 py-8 lg:py-0 lg:min-h-[640px]">
            {/* 좌: 카피 */}
            <div className="relative z-10 lg:pr-2">
              <h1 className="text-[30px] sm:text-[36px] lg:text-[40px] xl:text-[44px] font-extrabold tracking-[-0.02em] leading-[1.5]">
                <span className="block whitespace-nowrap">선수를 선택하고,</span>
                <span className="block whitespace-nowrap">후원방식을 <span className="text-emerald-500">PICK</span>하고,</span>
                <span className="block whitespace-nowrap">바로 시작하세요.</span>
              </h1>
              <p className="mt-6 text-[14.5px] lg:text-[15.5px] text-slate-500 leading-[1.8] break-keep">
                <span className="block">스폰픽은 선수와 브랜드, 팬을 연결하는</span>
                <span className="block">스포츠 후원 플랫폼입니다.</span>
                <span className="block">더 많은 가능성이, 여기서 시작됩니다.</span>
              </p>
            </div>

            {/* 중: 선수 실사 + 슬롯 핫스폿 */}
            <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[420px] lg:max-w-[520px] lg:self-end">
              <img
                src="/golfers/bae-jinri-hero.png"
                alt="배진리 프로"
                className="w-full h-auto select-none pointer-events-none"
                style={{ filter: 'drop-shadow(0 18px 30px rgba(15,23,42,0.10))' }}
              />
              {HOTSPOTS.map((h) => (
                <div
                  key={h.key}
                  className={`absolute ${h.mobile ? 'flex' : 'hidden sm:flex'} items-center`}
                  style={{
                    top: `${h.y}%`,
                    ...(h.side === 'left'
                      ? { right: `${100 - h.x}%`, flexDirection: 'row' as const }
                      : { left: `${h.x}%`, flexDirection: 'row-reverse' as const }),
                  }}
                >
                  <span className="text-[12px] lg:text-[13px] font-bold text-slate-700 whitespace-nowrap px-2 py-0.5 rounded-md bg-white/85 backdrop-blur-[2px] shadow-sm">
                    {h.label}
                  </span>
                  <span aria-hidden className="w-6 lg:w-12 border-t border-dashed border-emerald-400/80" />
                  <button
                    onClick={() => showTip(h.key)}
                    aria-label={`${h.label} — 직접 PICK에서 선택할 수 있는 후원 위치`}
                    className="relative w-[18px] h-[18px] rounded-full bg-emerald-500 border-[3px] border-white shadow-md shrink-0 hover:scale-110 transition-transform"
                  >
                    {tipKey === h.key && (
                      <span className="absolute left-1/2 -translate-x-1/2 -top-9 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-[11.5px] font-semibold whitespace-nowrap shadow-lg">
                        직접 PICK에서 선택할 수 있어요
                      </span>
                    )}
                  </button>
                </div>
              ))}

              {/* 선수 캡션 (시안: KLPGA 프로 · 배진리 · 사인) */}
              <div className="absolute left-0 bottom-[14%] hidden sm:block select-none">
                <p className="text-[11.5px] font-bold text-emerald-600 tracking-wide">KLPGA 프로</p>
                <p className="text-[24px] font-extrabold text-slate-800 leading-tight">배진리</p>
                <p className="font-script text-[24px] text-slate-500/80 -mt-0.5 -rotate-6 origin-left">Bae Jinri</p>
              </div>
            </div>

            {/* 우: 두 개의 PICK CTA */}
            <div className="relative z-10 space-y-4 pb-8 lg:pb-0">
              <Link
                to="/sponsor/direct"
                className="group flex items-center gap-5 rounded-[36px] bg-gradient-to-r from-emerald-500 to-emerald-600 pl-4 pr-6 py-4 lg:py-5 shadow-[0_16px_40px_-12px_rgba(16,185,129,0.55)] hover:shadow-[0_20px_48px_-12px_rgba(16,185,129,0.7)] hover:-translate-y-0.5 transition-all"
              >
                <span className="w-[64px] h-[64px] lg:w-[72px] lg:h-[72px] rounded-full bg-white flex items-center justify-center shrink-0">
                  <Tag className="w-7 h-7 lg:w-8 lg:h-8 text-emerald-500" strokeWidth={2.2} />
                </span>
                <span className="min-w-0 flex-1 text-white">
                  <span className="block text-[22px] lg:text-[25px] font-black leading-tight">직접 PICK</span>
                  <span className="block text-[13px] lg:text-[13.5px] text-emerald-50/95 mt-1">원하는 선수를 직접 선택하세요.</span>
                </span>
                <ChevronRight className="w-6 h-6 text-white/85 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/sponsor/recommended"
                className="group flex items-center gap-5 rounded-[36px] bg-gradient-to-r from-rose-500 to-red-500 pl-4 pr-6 py-4 lg:py-5 shadow-[0_16px_40px_-12px_rgba(244,63,94,0.5)] hover:shadow-[0_20px_48px_-12px_rgba(244,63,94,0.65)] hover:-translate-y-0.5 transition-all"
              >
                <span className="w-[64px] h-[64px] lg:w-[72px] lg:h-[72px] rounded-full bg-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-7 h-7 lg:w-8 lg:h-8 text-rose-500" strokeWidth={2.2} />
                </span>
                <span className="min-w-0 flex-1 text-white">
                  <span className="block text-[22px] lg:text-[25px] font-black leading-tight">스폰픽 추천 PICK</span>
                  <span className="block text-[13px] lg:text-[13.5px] text-rose-50/95 mt-1">AI가 선별한 맞춤 선수를 제안합니다.</span>
                </span>
                <ChevronRight className="w-6 h-6 text-white/85 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              {/* 보조 링크 — 핵심 CTA와 시각 경쟁 금지 */}
              <div className="flex items-center justify-center gap-4 pt-2 text-[13.5px] font-semibold text-slate-500">
                <Link to="/sponsor/available" className="inline-flex items-center gap-0.5 hover:text-emerald-600 transition-colors">
                  지금 가능한 후원 <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                <span className="w-px h-3.5 bg-slate-300" />
                <Link to="/digital-partner" className="inline-flex items-center gap-0.5 hover:text-emerald-600 transition-colors">
                  디지털 파트너 <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ 4단계 ════════════════ */}
      <section className="py-16 sm:py-20 px-5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-[24px] sm:text-[30px] font-extrabold tracking-[-0.02em]">선수선택부터 성과 확인까지 한번에</h2>
            <p className="mt-3 text-[14.5px] text-slate-500">간단한 4단계로 시작하는 새로운 스포츠 후원 경험, 스폰픽이 함께합니다.</p>
          </div>
          <div className="mt-2 flex justify-end">
            <Link to="/about/how-it-works" className="inline-flex items-center gap-1 text-[13.5px] font-bold text-slate-500 hover:text-emerald-600">
              이용방법 자세히 보기 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <ol className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-stretch gap-3 lg:gap-2">
            {STEPS.map((s, i) => {
              const I = s.icon;
              return (
                <li key={s.no} className="contents">
                  <div className="rounded-3xl border border-slate-200 bg-white px-6 py-8 text-center hover:border-emerald-200 hover:shadow-[0_12px_32px_-14px_rgba(15,23,42,0.14)] transition-all">
                    <span className="inline-flex w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 items-center justify-center">
                      <I className="w-6 h-6" strokeWidth={2} />
                    </span>
                    <p className="mt-5 text-[17px] font-extrabold text-slate-900">{s.no}. {s.title}</p>
                    <p className="mt-2 text-[14px] text-slate-500 leading-relaxed whitespace-pre-line">{s.desc}</p>
                  </div>
                  {i < STEPS.length - 1 && (
                    <span aria-hidden className="hidden lg:flex items-center justify-center text-slate-300">
                      <ChevronRight className="w-5 h-5" />
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ════════════════ 함께하는 브랜드 ════════════════ */}
      <BrandCarousel />

      {/* ════════════════ 새로운 가치 ════════════════ */}
      <section className="py-16 sm:py-20 px-5">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[220px_1fr] gap-8 lg:gap-12 items-start">
          <div>
            <h2 className="text-[22px] sm:text-[24px] font-extrabold tracking-[-0.02em] leading-snug break-keep">
              스폰픽이 만들어가는<br />스포츠의 새로운 가치
            </h2>
            <span aria-hidden className="block mt-4 w-8 h-[3px] rounded-full bg-emerald-500" />
          </div>
          <ul className="grid sm:grid-cols-2 xl:grid-cols-4 gap-x-6 gap-y-8 lg:divide-x lg:divide-slate-100">
            {VALUES.map((v) => {
              const I = v.icon;
              return (
                <li key={v.title} className="flex xl:flex-col gap-4 xl:pl-6 first:xl:pl-0">
                  <span className={`w-12 h-12 rounded-full ${v.tone} inline-flex items-center justify-center shrink-0`}>
                    <I className="w-5 h-5" strokeWidth={2.2} />
                  </span>
                  <div>
                    <p className="text-[16px] font-extrabold text-slate-900">{v.title}</p>
                    <p className="mt-1.5 text-[13.5px] text-slate-500 leading-relaxed break-keep">{v.desc}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ════════════════ 최종 CTA ════════════════ */}
      <section className="pb-16 sm:pb-20 px-5">
        <div className="relative max-w-7xl mx-auto overflow-hidden rounded-[28px] bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-400 px-6 sm:px-16 py-12 sm:py-14 text-center">
          <img
            aria-hidden
            src="/golfers/bae-jinri-hero.png"
            alt=""
            className="pointer-events-none select-none absolute right-[-40px] bottom-[-30%] w-[300px] sm:w-[380px] opacity-[0.16]"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <p aria-hidden className="hidden sm:block absolute right-8 bottom-6 font-script text-[22px] leading-[1.15] text-white/70 text-right -rotate-6">
            For a<br />Brighter<br />Tomorrow
          </p>
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 text-white/90 text-[13px] font-extrabold">
              <img src="/logo-48.png" alt="" className="w-5 h-5 rounded-md" /> SPONPIK
            </span>
            <h2 className="mt-4 text-[22px] sm:text-[30px] font-extrabold text-white tracking-[-0.02em]">
              지금, 새로운 후원의 여정을 시작하세요.
            </h2>
            <p className="mt-2.5 text-[14px] sm:text-[15px] text-emerald-50/90">
              선수, 브랜드, 팬이 함께 만드는 스포츠의 더 큰 가치
            </p>
            <Link
              to={isAuthenticated ? '/dashboard' : '/register'}
              className="mt-8 h-14 px-9 inline-flex items-center gap-2 rounded-full bg-white text-slate-900 text-[15px] font-extrabold hover:bg-emerald-50 transition-colors shadow-lg"
            >
              {isAuthenticated ? '내 대시보드로' : '무료로 시작하기'} <ArrowRight className="w-[18px] h-[18px]" />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════ FOOTER ════════════════ */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-5 py-10 flex flex-col md:flex-row md:items-center gap-8 md:gap-6">
          <div className="md:w-[260px]">
            <div className="flex items-center gap-2">
              <img src="/logo-48.png" alt="" className="w-7 h-7 rounded-lg" />
              <span className="text-[15px] font-extrabold text-slate-900">SPONPIK</span>
            </div>
            <p className="mt-2 text-[12.5px] text-slate-500">스포츠가 만드는 더 나은 내일, 스폰픽</p>
          </div>
          <nav aria-label="footer" className="flex flex-wrap items-center gap-x-7 gap-y-2 md:mx-auto text-[13.5px] font-semibold text-slate-600">
            <Link to="/terms" className="hover:text-slate-900">이용약관</Link>
            <Link to="/privacy" className="hover:text-slate-900">개인정보처리방침</Link>
            <Link to="/contact" className="hover:text-slate-900">고객센터</Link>
            <Link to="/contact" className="hover:text-slate-900">제휴/파트너 문의</Link>
          </nav>
          <div className="md:w-[260px] md:text-right">
            <div className="flex md:justify-end items-center gap-2">
              {[
                { label: 'YouTube', el: <Youtube className="w-4 h-4" /> },
                { label: 'Instagram', el: <Instagram className="w-4 h-4" /> },
                { label: '네이버 블로그', el: <span className="text-[12px] font-black leading-none">N</span> },
              ].map((s) => (
                <span key={s.label} aria-label={s.label} title={s.label}
                  className="w-9 h-9 rounded-full border border-slate-200 text-slate-500 inline-flex items-center justify-center">
                  {s.el}
                </span>
              ))}
            </div>
            <p className="mt-3 text-[12px] text-slate-400">&copy; 2026 SPONPIK. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/** 함께하는 브랜드 — 4개씩 넘기는 로고 캐러셀 (시안: 좌우 화살표 + 점 인디케이터) */
function BrandCarousel() {
  const ref = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const calc = () => {
      setPages(Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth)));
      setPage(Math.round(el.scrollLeft / el.clientWidth));
    };
    calc();
    el.addEventListener('scroll', calc, { passive: true });
    window.addEventListener('resize', calc);
    return () => { el.removeEventListener('scroll', calc); window.removeEventListener('resize', calc); };
  }, []);

  const go = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const next = Math.min(pages - 1, Math.max(0, page + dir));
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <section className="py-16 sm:py-20 px-5 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-[24px] sm:text-[30px] font-extrabold tracking-[-0.02em]">스폰픽과 함께 하는 브랜드</h2>
          <p className="mt-3 text-[14.5px] text-slate-500">스포츠의 더 큰 가치를 만들어가는 파트너들입니다.</p>
        </div>

        <div className="mt-9 flex items-center gap-3 sm:gap-5">
          <button onClick={() => go(-1)} disabled={page === 0} aria-label="이전 브랜드"
            className="hidden sm:inline-flex w-11 h-11 rounded-full bg-white border border-slate-200 text-slate-600 items-center justify-center shadow-sm hover:border-emerald-300 disabled:opacity-40 disabled:hover:border-slate-200 shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div ref={ref} className="flex-1 flex overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {BRANDS.map((b) => (
              <div key={b.name} className="snap-start shrink-0 w-1/2 lg:w-1/4 px-2">
                <div className="h-[104px] sm:h-[120px] bg-white rounded-2xl border border-slate-200 flex items-center justify-center px-6 hover:border-emerald-200 hover:shadow-md transition-all">
                  <img src={b.src} alt={b.name} title={b.name} loading="lazy" className="max-h-12 sm:max-h-14 max-w-full object-contain" />
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => go(1)} disabled={page >= pages - 1} aria-label="다음 브랜드"
            className="hidden sm:inline-flex w-11 h-11 rounded-full bg-white border border-slate-200 text-slate-600 items-center justify-center shadow-sm hover:border-emerald-300 disabled:opacity-40 disabled:hover:border-slate-200 shrink-0">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 flex justify-center gap-2" aria-hidden>
          {Array.from({ length: pages }).map((_, i) => (
            <span key={i} className={`h-2 rounded-full transition-all ${i === page ? 'w-2 bg-emerald-500' : 'w-2 bg-slate-300'}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
