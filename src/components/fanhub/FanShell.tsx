/**
 * 팬 참여 세부 화면 공용 셸 — 시안 2026-09-15 (리디자인/9)
 * 모든 세부 페이지가 같은 배경(#f3faf6) · 1180px 컨테이너 · 브레드크럼 · 뒤로가기 버튼을 쓴다.
 */
import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Home } from 'lucide-react';
import PublicHeader from '../PublicHeader';

export type CrumbItem = { label: string; to?: string };

export function FanCrumb({ items, tone = 'light' }: { items: CrumbItem[]; tone?: 'light' | 'dark' }) {
  const base = tone === 'dark' ? 'text-white/60 hover:text-white' : 'text-slate-500 hover:text-slate-700';
  const sep = tone === 'dark' ? 'text-white/30' : 'text-slate-300';
  const last = tone === 'dark' ? 'text-emerald-300' : 'text-emerald-700';
  return (
    <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[13px] flex-wrap">
      <Link to="/" className={`inline-flex items-center gap-1 ${base}`}><Home className="w-3.5 h-3.5" /> 홈</Link>
      {items.map((it, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={`${it.label}-${i}`} className="inline-flex items-center gap-1.5">
            <ChevronRight className={`w-3.5 h-3.5 ${sep}`} />
            {isLast || !it.to
              ? <span className={`${isLast ? `font-bold ${last}` : base}`}>{it.label}</span>
              : <Link to={it.to} className={base}>{it.label}</Link>}
          </span>
        );
      })}
    </nav>
  );
}

export function BackButton({ to, label = '뒤로가기' }: { to?: string; label?: string }) {
  const nav = useNavigate();
  const cls = 'inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-[13px] font-bold text-slate-700 hover:border-slate-400';
  return to
    ? <Link to={to} className={cls}><ArrowLeft className="w-4 h-4" /> {label}</Link>
    : <button type="button" onClick={() => nav(-1)} className={cls}><ArrowLeft className="w-4 h-4" /> {label}</button>;
}

/** 페이지 셸 — 헤더 + 배경. 안쪽은 페이지가 그린다 */
export function FanPage({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`min-h-screen bg-[#f3faf6] text-slate-900 pb-16 ${className}`}>
      <PublicHeader />
      {children}
    </div>
  );
}

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`max-w-[1180px] mx-auto px-5 ${className}`}>{children}</div>;
}

/** 소제목 + 우측 링크 */
export function PanelTitle({ title, icon, right, sub }: { title: ReactNode; icon?: ReactNode; right?: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[15px] font-extrabold inline-flex items-center gap-1.5">{icon}{title}</p>
        {sub && <p className="mt-0.5 text-[12.5px] text-slate-500 break-keep">{sub}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

export const Panel = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <section className={`rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 ${className}`}>{children}</section>
);

export const fmtDate = (d: string | Date | null | undefined, opt: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' }) =>
  d ? new Date(d).toLocaleDateString('ko-KR', opt).replace(/\.\s?/g, '.').replace(/\.$/, '') : '—';

export const fmtDateTime = (d: string | Date | null | undefined) =>
  d ? new Date(d).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) : '—';
