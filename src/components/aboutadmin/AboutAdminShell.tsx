/**
 * 소개 운영 관리자 공용 셸 (핸드오프 v1.0 §20)
 * 좌측 내비 4그룹 + 상단 환경 배지. 14개 화면이 같은 골격을 쓴다.
 */
import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileStack, Newspaper, ShieldCheck, Scale, Handshake,
  BarChart3, KeyRound, ScrollText, Menu, Bell, HelpCircle, ChevronLeft, Gavel,
} from 'lucide-react';

export const NAV = [
  { key: 'IA01', to: '/admin/about', label: '대시보드', icon: LayoutDashboard, group: '소개 운영' },
  { key: 'IA02', to: '/admin/about/pages', label: '페이지 · 메뉴', icon: FileStack, group: '소개 운영' },
  { key: 'IA03', to: '/admin/about/cases', label: '매칭사례', icon: Newspaper, group: '매칭사례' },
  { key: 'IA07', to: '/admin/about/policies', label: '보장 정책', icon: ShieldCheck, group: '성과보장' },
  { key: 'IA08', to: '/admin/about/judgements', label: '판정 관리', icon: Scale, group: '성과보장' },
  { key: 'IA09', to: '/admin/about/appeals', label: '이의제기 · 보완지원', icon: Gavel, group: '성과보장' },
  { key: 'IA10', to: '/admin/about/brands', label: '브랜드 CMS', icon: Handshake, group: '브랜드·콘텐츠' },
  { key: 'IA13', to: '/admin/about/rights', label: '권리 · 만료 큐', icon: KeyRound, group: '권리·감사' },
  { key: 'IA14', to: '/admin/about/audit', label: '감사로그', icon: ScrollText, group: '권리·감사' },
  { key: 'IA12', to: '/admin/about/analytics', label: '분석 · SEO', icon: BarChart3, group: '분석' },
];

const GROUPS = ['소개 운영', '매칭사례', '성과보장', '브랜드·콘텐츠', '권리·감사', '분석'];

export default function AboutAdminShell({
  title, desc, breadcrumb, actions, children,
}: {
  title: string; desc?: string; breadcrumb?: string[]; actions?: ReactNode; children: ReactNode;
}) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className={`fixed lg:sticky top-0 z-40 h-screen w-[232px] shrink-0 bg-[#0B1B3B] text-slate-300 flex flex-col transition-transform ${
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="h-16 flex items-center px-5 border-b border-white/5">
          <Link to="/admin/about" className="leading-tight">
            <span className="block text-[15px] font-extrabold text-white tracking-tight">SPONPIK</span>
            <span className="block text-[12.5px] font-bold tracking-[0.2em] text-emerald-400">ADMIN</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {GROUPS.map((g) => (
            <div key={g}>
              <p className="px-3 mb-1.5 text-[12.5px] font-bold tracking-[0.12em] text-slate-500 uppercase">{g}</p>
              <div className="space-y-0.5">
                {NAV.filter((n) => n.group === g).map((n) => {
                  const active = pathname === n.to || (n.to !== '/admin/about' && pathname.startsWith(n.to));
                  const I = n.icon;
                  return (
                    <Link key={n.key} to={n.to} onClick={() => setOpen(false)}
                      className={`flex items-center gap-2.5 h-9 px-3 rounded-xl text-[13px] font-semibold transition ${
                        active ? 'bg-emerald-500/15 text-emerald-300' : 'text-slate-500 hover:text-white hover:bg-white/5'
                      }`}>
                      <I className="w-4 h-4 shrink-0" /> {n.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-white/5">
          <Link to="/about/service" className="flex items-center gap-2 h-9 px-3 rounded-xl text-[12px] font-semibold text-slate-500 hover:text-white hover:bg-white/5">
            사이트 바로가기
          </Link>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 h-16 bg-white border-b border-slate-200 flex items-center gap-3 px-4 sm:px-6">
          <button onClick={() => setOpen(true)} className="lg:hidden w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center">
            <Menu className="w-4 h-4 text-slate-500" />
          </button>
          <nav className="flex items-center gap-1.5 text-[13px] text-slate-500 min-w-0">
            {(breadcrumb ?? ['소개 운영', title]).map((b, i, arr) => (
              <span key={i} className="flex items-center gap-1.5 truncate">
                {i > 0 && <span className="text-slate-300">/</span>}
                <span className={i === arr.length - 1 ? 'font-semibold text-slate-700' : ''}>{b}</span>
              </span>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-emerald-200 bg-emerald-50 text-[12px] font-bold text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> PROD
            </span>
            <button className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center">
              <Bell className="w-4 h-4 text-slate-500" />
            </button>
            <button className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-slate-500" />
            </button>
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-200" />
              <span className="text-[13px] font-semibold text-slate-700">관리자</span>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 max-w-[1600px] mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
            <div>
              <h1 className="text-[24px] font-extrabold text-slate-900 tracking-[-0.02em]">{title}</h1>
              {desc && <p className="mt-1.5 text-[13px] text-slate-500">{desc}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

/* ── 공용 조각 ──────────────────────────────────────── */

export const nf = (n: number | null | undefined) =>
  n === null || n === undefined ? '—' : n.toLocaleString('ko-KR');

export const fmtDate = (d: string | Date | null | undefined, withTime = false) =>
  !d ? '—' : new Date(d).toLocaleString('ko-KR', {
    year: '2-digit', month: '2-digit', day: '2-digit',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });

export function Metric({ value, unit, empty = '집계 중' }: { value: number | null; unit?: string; empty?: string }) {
  if (value === null || value === undefined) {
    return <span className="text-[15px] font-semibold text-slate-300">{empty}</span>;
  }
  return <span className="tabular-nums">{nf(value)}<span className="text-[0.6em] text-slate-500 ml-0.5">{unit}</span></span>;
}

export function KpiCard({ label, value, unit, sub, tone }: {
  label: string; value: number | null; unit?: string; sub?: string; tone?: 'default' | 'warn' | 'danger';
}) {
  const border = tone === 'danger' ? 'border-rose-200' : tone === 'warn' ? 'border-amber-200' : 'border-slate-200';
  const color = tone === 'danger' ? 'text-rose-600' : tone === 'warn' ? 'text-amber-600' : 'text-slate-900';
  return (
    <div className={`rounded-2xl border ${border} bg-white px-4 py-4`}>
      <p className="text-[12px] font-semibold text-slate-500 mb-2">{label}</p>
      <p className={`text-[24px] font-extrabold leading-none ${color}`}>
        <Metric value={value} unit={unit} />
      </p>
      {sub && <p className="mt-2 text-[12px] text-slate-500">{sub}</p>}
    </div>
  );
}

export function Panel({ title, right, children, className = '' }: {
  title?: string; right?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white ${className}`}>
      {(title || right) && (
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
          {title && <h2 className="text-[15px] font-bold text-slate-900">{title}</h2>}
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export const STATUS_TONE: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  IN_REVIEW: 'bg-sky-50 text-sky-700',
  AWAITING_PARTY: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  SCHEDULED: 'bg-violet-50 text-violet-700',
  PUBLISHED: 'bg-emerald-600 text-white',
  ARCHIVED: 'bg-slate-100 text-slate-500',
  ON_HOLD: 'bg-rose-50 text-rose-600',
};

export function Status({ code, label }: { code: string; label?: string }) {
  return (
    <span className={`inline-flex items-center h-6 px-2 rounded-lg text-[12px] font-bold ${STATUS_TONE[code] ?? 'bg-slate-100 text-slate-600'}`}>
      {label ?? code}
    </span>
  );
}

export function Tag({ children, tone = 'slate' }: {
  children: ReactNode; tone?: 'slate' | 'emerald' | 'sky' | 'amber' | 'rose' | 'violet';
}) {
  const tones: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-600',
    emerald: 'bg-emerald-50 text-emerald-700',
    sky: 'bg-sky-50 text-sky-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-600',
    violet: 'bg-violet-50 text-violet-700',
  };
  return <span className={`inline-flex items-center gap-1 h-6 px-2 rounded-lg text-[12px] font-bold ${tones[tone]}`}>{children}</span>;
}

export function Empty({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="text-[14px] font-bold text-slate-600">{title}</p>
      {desc && <p className="mt-1.5 text-[12px] text-slate-500 whitespace-pre-line">{desc}</p>}
    </div>
  );
}

export function Loading() {
  return <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />)}</div>;
}

export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1 text-[13px] font-semibold text-slate-500 hover:text-slate-700 mb-4">
      <ChevronLeft className="w-4 h-4" /> {label}
    </Link>
  );
}

export function useAdminGuard() {
  const nav = useNavigate();
  return (e: any, path: string) => {
    if ([401, 403].includes(e?.response?.status)) nav(`/login?returnUrl=${encodeURIComponent(path)}`);
  };
}
