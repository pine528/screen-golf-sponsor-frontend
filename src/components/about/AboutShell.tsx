/**
 * 스폰픽 소개 공용 셸 · 메가메뉴 (핸드오프 v1.0 §2 · §3 · IU12)
 *
 *  - 롤오버만으로 동작하지 않는다. focus / Enter / ESC 를 함께 지원한다 (§3.4).
 *  - 모바일은 아코디언으로 전환하고 breadcrumb 를 1줄로 축약한다 (§2.3).
 *  - 상태는 색상만으로 구분하지 않고 아이콘·텍스트를 함께 쓴다.
 */
import { ReactNode, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronRight, ChevronDown, Compass, Users, ShieldCheck, ClipboardList,
  Handshake, Gift, Check, Menu, X,
} from 'lucide-react';
import PublicHeader from '../PublicHeader';

export const ABOUT_MENU = [
  { key: 'service', label: '서비스소개', to: '/about/service', icon: Compass, desc: '스폰픽이 제공하는 가치와 차별점을 소개합니다.' },
  { key: 'cases', label: '매칭사례', to: '/about/cases', icon: Users, desc: '실제 스폰서 매칭 사례를 확인해 보세요.' },
  { key: 'guarantee', label: '성과보장프로그램', to: '/about/performance-guarantee', icon: ShieldCheck, desc: '스폰픽만의 성과보장 시스템을 안내합니다.' },
  { key: 'how', label: '이용방법', to: '/about/how-it-works', icon: ClipboardList, desc: '스폰픽 이용 절차와 방법을 쉽게 안내합니다.' },
  { key: 'brands', label: '함께하는 브랜드', to: '/about/brands', icon: Handshake, desc: '스폰픽과 함께하는 브랜드를 소개합니다.' },
];

/** 데스크톱 메가메뉴 — hover intent 150ms / leave 250ms (§2.2) */
export function AboutMegaMenu({ onNavigate }: { onNavigate?: (key: string) => void }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const openTimer = useRef<number>();
  const closeTimer = useRef<number>();

  const scheduleOpen = () => {
    window.clearTimeout(closeTimer.current);
    openTimer.current = window.setTimeout(() => setOpen(true), 150);
  };
  const scheduleClose = () => {
    window.clearTimeout(openTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 250);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const active = ABOUT_MENU.some((m) => pathname.startsWith(m.to));

  return (
    <div className="relative hidden lg:block"
      onMouseEnter={scheduleOpen} onMouseLeave={scheduleClose}
      onFocus={() => setOpen(true)} onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}>
      <button aria-expanded={open} aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className={`h-16 px-1 inline-flex items-center gap-1 text-[15px] font-bold transition ${
          active || open ? 'text-emerald-600' : 'text-slate-700 hover:text-slate-900'
        }`}>
        스폰픽 소개
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        {active && <span className="absolute left-0 right-0 bottom-0 h-[2.5px] rounded-full bg-emerald-500" />}
      </button>

      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full z-50 w-[760px] rounded-3xl border border-slate-200 bg-white shadow-[0_24px_60px_-24px_rgba(15,23,42,0.35)] overflow-hidden">
          <div className="grid grid-cols-[280px_1fr]">
            {/* 좌측 소개 */}
            <div className="bg-gradient-to-b from-emerald-50/70 to-white p-6 border-r border-slate-100">
              <p className="text-[19px] font-extrabold text-slate-900 leading-snug tracking-[-0.02em]">
                함께 성장하는<br />스폰서 매칭 플랫폼,<br />스폰픽
              </p>
              <p className="mt-3 text-[13px] text-slate-500 leading-relaxed">
                선수의 가능성을 후원으로 연결하고<br />브랜드의 가치를 함께 키워갑니다.
              </p>
            </div>

            {/* 메뉴 */}
            <div className="p-2">
              {ABOUT_MENU.map((m) => {
                const I = m.icon;
                const on = pathname.startsWith(m.to);
                return (
                  <Link key={m.key} to={m.to}
                    onClick={() => { setOpen(false); onNavigate?.(m.key); }}
                    className={`flex items-center gap-3.5 rounded-2xl px-4 py-3 transition ${
                      on ? 'bg-emerald-50/70 ring-1 ring-emerald-200' : 'hover:bg-slate-50'
                    }`}>
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      on ? 'bg-white text-emerald-600' : 'bg-slate-50 text-slate-500'
                    }`}>
                      <I className="w-4 h-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[14px] font-bold ${on ? 'text-emerald-700' : 'text-slate-900'}`}>{m.label}</span>
                      <span className="block text-[12px] text-slate-500 mt-0.5">{m.desc}</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  </Link>
                );
              })}
              <Link to="/about/service" onClick={() => setOpen(false)}
                className="mt-1 flex items-center justify-center gap-1.5 rounded-2xl bg-slate-50 px-4 py-3 text-[13px] font-semibold text-slate-600 hover:bg-slate-100 transition">
                <Gift className="w-4 h-4 text-emerald-500" />
                처음이신가요? <span className="text-emerald-600 font-bold">서비스소개부터 보기</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** 모바일 아코디언 (§2.3) */
export function AboutMobileNav() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="lg:hidden w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center"
        aria-label="메뉴 열기">
        <Menu className="w-5 h-5 text-slate-600" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] bg-white lg:hidden overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-slate-100 px-4 h-14 flex items-center justify-between">
            <Link to="/" onClick={() => setOpen(false)} className="text-[14px] font-bold text-slate-700">홈</Link>
            <button onClick={() => setOpen(false)} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <nav className="px-4 py-2">
            {[
              { label: '후원하기', to: '/sponsor/available' },
              { label: '선수', to: '/athletes' },
              { label: '팬 참여', to: '/fan' },
            ].map((m) => (
              <Link key={m.to} to={m.to} onClick={() => setOpen(false)}
                className="flex items-center justify-between py-4 border-b border-slate-100 text-[15px] font-semibold text-slate-800">
                {m.label} <ChevronRight className="w-4 h-4 text-slate-300" />
              </Link>
            ))}

            <button onClick={() => setExpanded((v) => !v)}
              className="w-full flex items-center justify-between py-4 border-b border-slate-100 text-[15px] font-bold text-emerald-600">
              스폰픽 소개
              <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>

            {expanded && (
              <div className="py-1">
                {ABOUT_MENU.map((m) => {
                  const on = pathname.startsWith(m.to);
                  return (
                    <Link key={m.key} to={m.to} onClick={() => setOpen(false)}
                      className="flex items-start gap-3 py-3.5 border-b border-slate-50">
                      <span className="min-w-0 flex-1">
                        <span className={`block text-[14px] font-bold ${on ? 'text-emerald-600' : 'text-slate-800'}`}>{m.label}</span>
                        <span className="block text-[12px] text-slate-500 mt-0.5">{m.desc}</span>
                      </span>
                      {on && (
                        <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>

          <div className="p-4 sticky bottom-0 bg-white border-t border-slate-100">
            <Link to="/register" onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 h-12 rounded-2xl bg-emerald-600 text-white text-[15px] font-bold">
              시작하기 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

/** 페이지 공통 골격 (§2.4) */
export default function AboutShell({
  current, title, desc, hero, children,
}: {
  current: string; title?: string; desc?: string; hero?: ReactNode; children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicHeader />

      <div className="max-w-[1280px] mx-auto px-5">
        {/* breadcrumb — 모바일에서도 1줄 (§2.3) */}
        <nav aria-label="breadcrumb" className="flex items-center gap-1.5 pt-5 text-[12.5px] whitespace-nowrap overflow-hidden">
          <Link to="/" className="text-slate-500 hover:text-slate-600 shrink-0">홈</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className="text-slate-500 shrink-0">스폰픽 소개</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className="font-bold text-emerald-700 truncate">{current}</span>
        </nav>

        {/* 데스크톱 탭 */}
        <div className="mt-4 hidden sm:flex gap-1 border-b border-slate-200">
          {ABOUT_MENU.map((m) => {
            const on = m.label === current;
            return (
              <Link key={m.key} to={m.to}
                aria-current={on ? 'page' : undefined}
                className={`relative px-4 py-3 text-[14px] font-bold transition ${
                  on ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-900'
                }`}>
                {m.label}
                {on && <span className="absolute left-3 right-3 -bottom-px h-[2.5px] rounded-full bg-emerald-500" />}
              </Link>
            );
          })}
        </div>

        {(title || hero) && (
          <header className="pt-8 sm:pt-10">
            {hero ?? (
              <>
                <h1 className="text-[28px] sm:text-[38px] font-extrabold tracking-[-0.03em] leading-tight">{title}</h1>
                {desc && <p className="mt-3 text-[14px] sm:text-[15px] text-slate-500 leading-relaxed break-keep">{desc}</p>}
              </>
            )}
          </header>
        )}
      </div>

      {children}
    </div>
  );
}

/* ── 공용 조각 ──────────────────────────────────────── */

export const nf = (n: number | null | undefined) =>
  n === null || n === undefined ? '—' : n.toLocaleString('ko-KR');

export function VerifiedBadge({ label = '검증 완료' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 h-6 px-2 rounded-lg bg-emerald-50 text-emerald-700 text-[12px] font-bold">
      <ShieldCheck className="w-3 h-3" /> {label}
    </span>
  );
}

export function Tag({ children, tone = 'slate' }: {
  children: ReactNode; tone?: 'slate' | 'emerald' | 'sky' | 'violet' | 'amber' | 'rose';
}) {
  const tones: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-600',
    emerald: 'bg-emerald-50 text-emerald-700',
    sky: 'bg-sky-50 text-sky-700',
    violet: 'bg-violet-50 text-violet-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-600',
  };
  return <span className={`inline-flex items-center h-6 px-2 rounded-lg text-[12px] font-bold ${tones[tone]}`}>{children}</span>;
}

/** 상태 안내 — 색상만으로 구분하지 않는다 (§3.2 · §3.4) */
export function StateNotice({ kind, title, desc, action }: {
  kind: 'empty' | 'error' | 'partial' | 'restricted' | 'stale';
  title: string; desc?: string; action?: ReactNode;
}) {
  const icon = {
    empty: '○', error: '!', partial: '◐', restricted: '⌁', stale: '◔',
  }[kind];
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-12 text-center">
      <div className="mx-auto mb-3 w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 text-[15px] font-bold">
        {icon}
      </div>
      <p className="text-[15px] font-bold text-slate-700">{title}</p>
      {desc && <p className="mt-1.5 text-[13px] text-slate-500 leading-relaxed whitespace-pre-line">{desc}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-100 ${className}`} />;
}

/** 분석 이벤트 — 가명 ID 만 보낸다 (§13.3) */
export function visitorKey() {
  try {
    let k = localStorage.getItem('sponpik.vk');
    if (!k) {
      k = `vk_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      localStorage.setItem('sponpik.vk', k);
    }
    return k;
  } catch { return undefined; }
}
