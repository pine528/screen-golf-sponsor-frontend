/**
 * 공개 페이지 공용 상단 메뉴바 — 리디자인 v2.0 (핸드오프 §1.1)
 *
 * 4개 1차 메뉴(후원하기/선수/팬 참여/스폰픽 소개) + 메가메뉴.
 *  - hover/focus 120ms 후 표시, 마우스 이탈 250ms 후 닫기, Esc·바깥 클릭 닫기
 *  - 각 항목 아이콘+명칭+한 줄 설명, NEW 배지는 텍스트로도 제공
 *  - 모바일: 전체화면 드로어 + 아코디언, 상단에 직접/추천 PICK 바로가기
 * 아직 전용 페이지가 없는 항목(성과보장·매칭 사례 등)은 가장 근접한 기존
 * 페이지로 연결하고, 세부 핸드오프 수령 시 라우트를 교체한다.
 */
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CalendarCheck,
  ChevronDown,
  ChevronRight,
  Crosshair,
  Handshake,
  Heart,
  Info,
  LineChart,
  Menu,
  MessageCircle,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  UserPlus,
  Users,
  Vote,
  Wallet,
  X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import MobileTabBar from './MobileTabBar';

type MegaItem = {
  icon: any;
  title: string;
  desc: string;
  to: string;
  badge?: string;
  highlight?: boolean;
};

const MENUS: { key: string; label: string; to: string; items: MegaItem[]; note?: string }[] = [
  {
    key: 'sponsor',
    label: '후원하기',
    to: '/sponsor',
    items: [
      { icon: Crosshair, title: '선수·후원슬롯 직접 PICK', desc: '경기 착장 위치를 직접 선택', to: '/sponsor/direct/athletes' },
      { icon: Sparkles, title: '스폰픽 추천 PICK', desc: '목표와 예산에 맞는 조합 추천', to: '/sponsor/recommended' },
      { icon: ShoppingBag, title: '지금 가능한 후원', desc: '미리 구성된 상품을 바로 비교·구매', to: '/sponsor/available', badge: 'NEW' },
      { icon: CalendarCheck, title: '디지털 파트너 월 구독', desc: '월 부담으로 1년간 온라인·등록매장 파트너', to: '/digital-partner', badge: 'NEW', highlight: true },
    ],
    note: '경기복 부착 없이 디지털 채널과 등록매장 홍보물에 활용하는 상품입니다.',
  },
  {
    key: 'athletes',
    label: '선수',
    to: '/athletes',
    items: [
      { icon: Users, title: '전체 선수', desc: '투어·지역·활동으로 탐색', to: '/athletes' },
      { icon: Star, title: '추천 선수', desc: '스폰픽 추천 기준 선별', to: '/athletes?recommended=1' },
      { icon: Heart, title: '관심 선수', desc: '내가 응원하는 선수와 기여도', to: '/fan/contributions' },
      { icon: UserPlus, title: '선수 등록', desc: '선수·매니저 온보딩', to: '/register' },
    ],
  },
  {
    key: 'fan',
    label: '팬 참여',
    to: '/fan',
    items: [
      { icon: Heart, title: '팬 참여 홈', desc: '투표·온도·포인트·스토어 한눈에', to: '/fan' },
      { icon: Vote, title: '팬 VOTE', desc: '의견과 예측으로 응원하기', to: '/fan/vote' },
      { icon: MessageCircle, title: '선수 커뮤니티', desc: '응원 글 · 응원편지 · 브랜드 추천', to: '/fan/community' },
      { icon: Wallet, title: '팬포인트', desc: '참여한 만큼 쌓이는 혜택', to: '/fan/points' },
      { icon: Store, title: '팬스토어', desc: '선수 × 브랜드 협업 상품', to: '/fan/store' },
    ],
  },
  {
    key: 'about',
    label: '스폰픽 소개',
    to: '/about/service',
    items: [
      { icon: Info, title: '서비스 소개', desc: '스폰픽이 해결하는 후원 문제', to: '/about/service' },
      { icon: BookOpen, title: '이용방법', desc: '선택부터 성과 확인까지', to: '/about/how-it-works' },
      { icon: ShieldCheck, title: '성과보장 프로그램', desc: '기준 미달 시 보완 지원', to: '/about/performance-guarantee' },
      { icon: Handshake, title: '함께하는 브랜드', desc: '스폰픽과 성장하는 파트너', to: '/about/brands' },
      { icon: LineChart, title: '매칭 사례', desc: '실제 후원과 검증된 성과', to: '/about/cases' },
    ],
  },
];

/** 1차 메뉴가 현재 경로를 포함하는지 (활성 표시용) */
function menuActive(menu: (typeof MENUS)[number], pathname: string) {
  return menu.items.some((it) => {
    const base = it.to.split('?')[0];
    return base !== '/' && (pathname === base || pathname.startsWith(`${base}/`));
  });
}

export default function PublicHeader({ fixed = false }: { fixed?: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileAccordion, setMobileAccordion] = useState<string | null>('sponsor');
  const { isAuthenticated } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const openTimer = useRef<ReturnType<typeof setTimeout>>();
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();
  const navRef = useRef<HTMLElement>(null);

  const scheduleOpen = (key: string) => {
    clearTimeout(closeTimer.current);
    clearTimeout(openTimer.current);
    openTimer.current = setTimeout(() => setOpen(key), 120);
  };
  const scheduleClose = () => {
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(null), 250);
  };
  const cancelClose = () => clearTimeout(closeTimer.current);

  /* Esc·바깥 클릭 닫기 */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null); };
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(null);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('mousedown', onClick); };
  }, []);

  /* 경로 이동 시 메뉴 닫기 */
  useEffect(() => { setOpen(null); setMobileOpen(false); }, [pathname]);

  return (
    <>
      <nav
        ref={navRef}
        className={`${fixed ? 'fixed inset-x-0 top-0' : 'sticky top-0'} z-50 bg-white/95 backdrop-blur-xl border-b border-slate-100`}
      >
        <div className="max-w-7xl mx-auto px-5 h-16 lg:h-[72px] flex items-center">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <img src="/logo-48.png" alt="" className="w-8 h-8 rounded-xl" />
            <span className="text-lg font-extrabold tracking-tight text-slate-900">SPONPIK</span>
          </Link>

          {/* 데스크톱 메가메뉴 */}
          <div className="hidden md:flex items-center gap-2 lg:gap-7 mx-auto">
            {MENUS.map((m) => {
              const active = open === m.key || menuActive(m, pathname);
              return (
                <div
                  key={m.key}
                  className="relative"
                  onMouseEnter={() => scheduleOpen(m.key)}
                  onMouseLeave={scheduleClose}
                >
                  <button
                    onFocus={() => scheduleOpen(m.key)}
                    onClick={() => { setOpen(null); navigate(m.to); }}
                    aria-expanded={open === m.key}
                    aria-haspopup="true"
                    className={`relative px-2 py-2 text-[15px] font-bold transition-colors ${
                      active ? 'text-emerald-600' : 'text-slate-800 hover:text-emerald-600'
                    }`}
                  >
                    {m.label}
                    <span
                      className={`absolute left-1 right-1 -bottom-[3px] h-[2.5px] rounded-full bg-emerald-500 transition-opacity ${
                        active ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  </button>

                  {open === m.key && (
                    <div
                      onMouseEnter={cancelClose}
                      onMouseLeave={scheduleClose}
                      className="absolute left-1/2 -translate-x-1/2 top-full pt-4 w-[340px]"
                    >
                      <div className="rounded-2xl bg-white border border-slate-100 shadow-[0_18px_50px_-12px_rgba(15,23,42,0.18)] p-2.5">
                        {m.items.map((it) => (
                          <Link
                            key={it.title}
                            to={it.to}
                            onClick={() => setOpen(null)}
                            className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-colors group ${
                              it.highlight ? 'bg-emerald-50/70 hover:bg-emerald-50' : 'hover:bg-slate-50'
                            }`}
                          >
                            <span className="w-11 h-11 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                              <it.icon className="w-5 h-5 text-emerald-600" strokeWidth={2.2} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-1.5 text-[15px] font-bold text-slate-900">
                                {it.title}
                                {it.badge && (
                                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-black leading-none">
                                    {it.badge}
                                  </span>
                                )}
                              </span>
                              <span className="block text-[12px] text-slate-500 mt-0.5 truncate">{it.desc}</span>
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 shrink-0" />
                          </Link>
                        ))}
                        {m.note && (
                          <p className="flex items-start gap-1.5 px-3.5 pt-2.5 pb-1.5 mt-1 border-t border-slate-100 text-[12px] text-slate-500 leading-relaxed">
                            <Info className="w-3.5 h-3.5 shrink-0 mt-[1px]" />
                            {m.note}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 우측 액션 */}
          <div className="hidden sm:flex items-center gap-2 shrink-0 ml-auto md:ml-0">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="h-10 px-6 inline-flex items-center rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors"
              >
                시작하기
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="h-10 px-4 inline-flex items-center rounded-xl text-slate-700 text-sm font-semibold hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  로그인
                </Link>
                <Link
                  to="/register"
                  className="h-10 px-6 inline-flex items-center rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors"
                >
                  시작하기
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="메뉴 열기"
            className="md:hidden p-2 rounded-lg text-slate-500 ml-auto"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* 모바일 전체화면 드로어 — 상단 두 PICK 바로가기 + 아코디언 */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-x-0 top-16 bottom-0 bg-white overflow-y-auto px-5 pb-28 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              <Link
                to="/sponsor/direct/athletes"
                onClick={() => setMobileOpen(false)}
                className="rounded-2xl bg-emerald-500 text-white px-4 py-4 flex flex-col gap-1"
              >
                <Crosshair className="w-5 h-5" />
                <span className="text-[15px] font-extrabold">직접 PICK</span>
                <span className="text-[12px] text-emerald-100">선수·방식 직접 선택</span>
              </Link>
              <Link
                to="/sponsor/recommended"
                onClick={() => setMobileOpen(false)}
                className="rounded-2xl bg-rose-500 text-white px-4 py-4 flex flex-col gap-1"
              >
                <Sparkles className="w-5 h-5" />
                <span className="text-[15px] font-extrabold">추천 PICK</span>
                <span className="text-[12px] text-rose-100">목표·예산 기반 추천</span>
              </Link>
            </div>

            {MENUS.map((m) => (
              <div key={m.key} className="border-b border-slate-100">
                <button
                  onClick={() => setMobileAccordion(mobileAccordion === m.key ? null : m.key)}
                  aria-expanded={mobileAccordion === m.key}
                  className="w-full flex items-center justify-between py-3.5 text-[15px] font-bold text-slate-900"
                >
                  {m.label}
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform ${mobileAccordion === m.key ? 'rotate-180' : ''}`}
                  />
                </button>
                {mobileAccordion === m.key && (
                  <div className="pb-3 space-y-0.5">
                    <Link
                      to={m.to}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between px-2 py-2.5 rounded-xl bg-slate-50 text-[14px] font-bold text-emerald-700"
                    >
                      {m.label} 홈으로 <ChevronRight className="w-4 h-4" />
                    </Link>
                    {m.items.map((it) => (
                      <Link
                        key={it.title}
                        to={it.to}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-2 py-2.5 rounded-xl ${it.highlight ? 'bg-emerald-50/70' : ''}`}
                      >
                        <span className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                          <it.icon className="w-4 h-4 text-emerald-600" />
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 text-[14px] font-semibold text-slate-800">
                            {it.title}
                            {it.badge && (
                              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-black leading-none">
                                {it.badge}
                              </span>
                            )}
                          </span>
                          <span className="block text-[12px] text-slate-500">{it.desc}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="pt-4 mt-2 flex gap-2">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 h-11 inline-flex items-center justify-center rounded-xl bg-emerald-500 text-white text-sm font-bold"
                >
                  시작하기
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 h-11 inline-flex items-center justify-center rounded-xl border border-slate-200 text-slate-700 text-sm font-bold"
                  >
                    로그인
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 h-11 inline-flex items-center justify-center rounded-xl bg-emerald-500 text-white text-sm font-bold"
                  >
                    시작하기
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
      {/* 모바일 하단 탭 바 (공개 페이지 공용) */}
      <MobileTabBar />
    </>
  );
}
