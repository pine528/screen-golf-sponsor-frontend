/**
 * 팬 운영 관리자 공용 셸 (핸드오프 v1.0 §18.2)
 * 좌측 고정 내비 + 상단 바. 12개 화면이 같은 골격을 쓴다.
 */
import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Vote, ShieldCheck, Flag, Thermometer, Coins, Receipt,
  Store, Wallet, Lightbulb, BarChart3, Menu, Bell, ExternalLink, ChevronLeft,
} from 'lucide-react';

export const NAV = [
  { key: 'A01', to: '/admin/fan', label: '대시보드', icon: LayoutDashboard, group: '팬 운영' },
  { key: 'A02', to: '/admin/fan/votes', label: 'VOTE 관리', icon: Vote, group: '팬 운영' },
  { key: 'A04', to: '/admin/fan/moderation', label: '콘텐츠 검수', icon: ShieldCheck, group: '팬 운영' },
  { key: 'A05', to: '/admin/fan/reports', label: '신고·제재', icon: Flag, group: '팬 운영' },
  { key: 'A06', to: '/admin/fan/formula', label: '팬온도', icon: Thermometer, group: '정책' },
  { key: 'A07', to: '/admin/fan/point-policy', label: '포인트 정책', icon: Coins, group: '정책' },
  { key: 'A08', to: '/admin/fan/point-ledger', label: '포인트 원장', icon: Receipt, group: '정책' },
  { key: 'A09', to: '/admin/fan/stores', label: '팬스토어', icon: Store, group: '커머스' },
  { key: 'A10', to: '/admin/fan/orders', label: '주문·정산', icon: Wallet, group: '커머스' },
  { key: 'A11', to: '/admin/fan/brand-suggestions', label: '브랜드 추천', icon: Lightbulb, group: '커머스' },
  { key: 'A12', to: '/admin/fan/report', label: '통합 리포트', icon: BarChart3, group: '분석' },
];

const GROUPS = ['팬 운영', '정책', '커머스', '분석'];

export default function FanAdminShell({
  title, desc, breadcrumb, actions, children,
}: {
  title: string; desc?: string; breadcrumb?: string[]; actions?: ReactNode; children: ReactNode;
}) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* 사이드바 */}
      <aside className={`fixed lg:sticky top-0 z-40 h-screen w-[228px] shrink-0 bg-[#0F172A] text-slate-300 flex flex-col transition-transform ${
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="h-16 flex items-center px-5 border-b border-white/5">
          <Link to="/admin/fan" className="text-[16px] font-extrabold text-white tracking-tight">
            SPONPIK <span className="text-emerald-400">ADMIN</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {GROUPS.map((g) => (
            <div key={g}>
              <p className="px-3 mb-1.5 text-[12.5px] font-bold tracking-[0.12em] text-slate-500 uppercase">{g}</p>
              <div className="space-y-0.5">
                {NAV.filter((n) => n.group === g).map((n) => {
                  const active = pathname === n.to || (n.to !== '/admin/fan' && pathname.startsWith(n.to));
                  const I = n.icon;
                  return (
                    <Link key={n.key} to={n.to} onClick={() => setOpen(false)}
                      className={`flex items-center gap-2.5 h-9 px-3 rounded-xl text-[13px] font-semibold transition ${
                        active ? 'bg-emerald-500/15 text-emerald-300' : 'text-slate-500 hover:text-white hover:bg-white/5'
                      }`}>
                      <I className="w-4 h-4 shrink-0" />
                      {n.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-white/5">
          <Link to="/fan" className="flex items-center gap-2 h-9 px-3 rounded-xl text-[12px] font-semibold text-slate-500 hover:text-white hover:bg-white/5">
            <ExternalLink className="w-3.5 h-3.5" /> 팬 화면 보기
          </Link>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setOpen(false)} />}

      {/* 본문 */}
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 h-16 bg-white border-b border-slate-200 flex items-center gap-3 px-4 sm:px-6">
          <button onClick={() => setOpen(true)} className="lg:hidden w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center">
            <Menu className="w-4.5 h-4.5 text-slate-500" />
          </button>
          <nav className="flex items-center gap-1.5 text-[13px] text-slate-500 min-w-0">
            {(breadcrumb ?? ['팬 운영', title]).map((b, i, arr) => (
              <span key={i} className="flex items-center gap-1.5 truncate">
                {i > 0 && <span className="text-slate-300">/</span>}
                <span className={i === arr.length - 1 ? 'font-semibold text-slate-700' : ''}>{b}</span>
              </span>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center relative">
              <Bell className="w-4 h-4 text-slate-500" />
            </button>
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-200" />
              <span className="text-[13px] font-semibold text-slate-700">운영관리자</span>
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

/** 측정값이 없으면 숫자를 만들지 않는다 (LEG-06) */
export function Metric({ value, unit, empty = '집계 중' }: { value: number | null; unit?: string; empty?: string }) {
  if (value === null || value === undefined) {
    return <span className="text-[15px] font-semibold text-slate-300">{empty}</span>;
  }
  return (
    <span className="tabular-nums">
      {nf(value)}<span className="text-[0.6em] text-slate-500 ml-0.5">{unit}</span>
    </span>
  );
}

export function KpiCard({ label, value, unit, delta, sub, empty }: {
  label: string; value: number | null; unit?: string; delta?: number | null; sub?: string; empty?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
      <p className="text-[12px] font-semibold text-slate-500 mb-2">{label}</p>
      <p className="text-[24px] font-extrabold text-slate-900 leading-none">
        <Metric value={value} unit={unit} empty={empty} />
      </p>
      <p className="mt-2 text-[12px] text-slate-500">
        {delta !== null && delta !== undefined && (
          <span className={`font-bold ${delta >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
            {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}%{' '}
          </span>
        )}
        {sub}
      </p>
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

export const RISK_STYLE: Record<string, string> = {
  P0: 'bg-rose-50 text-rose-600 border-rose-200',
  P1: 'bg-orange-50 text-orange-600 border-orange-200',
  P2: 'bg-amber-50 text-amber-700 border-amber-200',
  P3: 'bg-emerald-50 text-emerald-600 border-emerald-200',
};

export function RiskTag({ risk, label }: { risk: string; label?: string }) {
  return (
    <span className={`inline-flex items-center h-5 px-1.5 rounded-md border text-[12px] font-extrabold ${RISK_STYLE[risk] ?? RISK_STYLE.P2}`}>
      {risk}{label ? ` ${label}` : ''}
    </span>
  );
}

export function StatusTag({ label, tone = 'slate' }: {
  label: string; tone?: 'slate' | 'emerald' | 'sky' | 'amber' | 'rose' | 'violet';
}) {
  const tones: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-600',
    emerald: 'bg-emerald-50 text-emerald-700',
    sky: 'bg-sky-50 text-sky-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-600',
    violet: 'bg-violet-50 text-violet-700',
  };
  return <span className={`inline-flex items-center h-6 px-2 rounded-lg text-[12px] font-bold ${tones[tone]}`}>{label}</span>;
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
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />)}
    </div>
  );
}

export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1 text-[13px] font-semibold text-slate-500 hover:text-slate-700 mb-4">
      <ChevronLeft className="w-4 h-4" /> {label}
    </Link>
  );
}

/** 401·403이면 로그인으로 보낸다 */
export function useAdminGuard() {
  const nav = useNavigate();
  return (e: any, path: string) => {
    if ([401, 403].includes(e?.response?.status)) nav(`/login?returnUrl=${encodeURIComponent(path)}`);
  };
}

export const fmtDate = (d: string | Date | null, withTime = false) =>
  !d ? '—' : new Date(d).toLocaleString('ko-KR', {
    year: '2-digit', month: '2-digit', day: '2-digit',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });

export const fmtRemain = (ms: number | null) => {
  if (ms === null || ms === undefined) return '—';
  const over = ms < 0;
  const abs = Math.abs(ms);
  const h = Math.floor(abs / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  const text = h > 0 ? `${h}시간 ${m}분` : `${m}분`;
  return over ? `${text} 초과` : `${text} 남음`;
};
