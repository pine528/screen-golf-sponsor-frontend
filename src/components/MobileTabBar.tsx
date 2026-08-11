/**
 * 모바일 하단 탭 바 — 공개 페이지 공용 (lg 미만)
 *
 * 모바일 전면 개편(2026-08-11): 햄버거 메뉴를 열지 않아도 핵심 동선(홈·경매·
 * AI 매칭·마켓·마이)으로 바로 이동할 수 있게 앱형 탭 바를 둔다.
 * 페이지별 하단 고정 CTA(구매 바 등)는 이 위(bottom-14)에 얹는다.
 * 콘텐츠 가림 방지 여백은 body.has-mobile-tabbar (index.css)로 처리.
 */
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Gavel, Home, Sparkles, Store, UserRound } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function MobileTabBar() {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    document.body.classList.add('has-mobile-tabbar');
    return () => document.body.classList.remove('has-mobile-tabbar');
  }, []);

  const tabs = [
    { to: '/', label: '홈', icon: Home, exact: true },
    { to: '/auctions', label: '경매', icon: Gavel },
    { to: '/ai-match', label: 'AI 매칭', icon: Sparkles },
    { to: '/growth-market', label: '마켓', icon: Store },
    { to: isAuthenticated ? '/dashboard' : '/login', label: '마이', icon: UserRound },
  ];

  const isActive = (t: { to: string; exact?: boolean }) =>
    t.exact ? pathname === t.to : pathname === t.to || pathname.startsWith(`${t.to}/`) ||
    (t.to === '/growth-market' && pathname.startsWith('/fan-store'));

  return (
    <nav
      aria-label="모바일 하단 메뉴"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="h-14 grid grid-cols-5">
        {tabs.map((t) => {
          const on = isActive(t);
          return (
            <Link
              key={t.label}
              to={t.to}
              aria-current={on ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 ${
                on ? 'text-emerald-600' : 'text-slate-400'
              }`}
            >
              <t.icon className="w-5 h-5" strokeWidth={on ? 2.4 : 2} />
              <span className={`text-[10px] leading-none ${on ? 'font-bold' : 'font-medium'}`}>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
