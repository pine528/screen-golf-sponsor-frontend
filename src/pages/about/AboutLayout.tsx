/**
 * 스폰픽 소개 공통 레이아웃 — 리디자인 v2.0 §9 (시안 2026-08-21)
 * 브레드크럼 + 5탭(서비스 소개/이용방법/성과보장/함께하는 브랜드/매칭사례)
 */
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';

export const ABOUT_TABS = [
  { to: '/about', label: '서비스 소개' },
  { to: '/about/how', label: '이용방법' },
  { to: '/about/guarantee', label: '성과보장 프로그램' },
  { to: '/about/brands', label: '함께하는 브랜드' },
  { to: '/about/cases', label: '매칭사례' },
];

export default function AboutLayout({ current, children }: { current: string; children: React.ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicHeader />
      <div className="max-w-7xl mx-auto px-5">
        {/* 브레드크럼 */}
        <nav aria-label="breadcrumb" className="flex items-center gap-1.5 pt-5 text-[12.5px]">
          <Link to="/" className="text-emerald-600 font-semibold hover:underline">홈</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-500">스폰픽 소개</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-bold text-emerald-700">{current}</span>
        </nav>

        {/* 탭 */}
        <div className="mt-4 rounded-2xl border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-5">
            {ABOUT_TABS.map((t) => {
              const active = pathname === t.to;
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  aria-current={active ? 'page' : undefined}
                  className={`relative px-3 py-3.5 text-center text-[13.5px] sm:text-[14.5px] font-bold transition-colors ${
                    active ? 'text-emerald-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {t.label}
                  {active && <span className="absolute left-4 right-4 bottom-0 h-[2.5px] rounded-full bg-emerald-500" />}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
