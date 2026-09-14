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
import { Home, Heart, Search, Target, UserRound } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function MobileTabBar() {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    document.body.classList.add('has-mobile-tabbar');
    return () => document.body.classList.remove('has-mobile-tabbar');
  }, []);

  /* v2.0 §1.1 1차 메뉴와 같은 축: 홈 · 후원하기 · 선수 · 팬 참여 · 마이 */
  const tabs = [
    { to: '/', label: '홈', icon: Home, exact: true },
    { to: '/sponsor', label: '후원하기', icon: Target, match: ['/sponsor', '/digital-partner'] },
    { to: '/athletes', label: '선수', icon: Search, match: ['/athletes'] },
    { to: '/fan', label: '팬 참여', icon: Heart, match: ['/fan'] },
    { to: isAuthenticated ? '/dashboard' : '/login', label: '마이', icon: UserRound, match: ['/dashboard', '/profile'] },
  ];

  const isActive = (t: { to: string; exact?: boolean; match?: string[] }) =>
    t.exact ? pathname === t.to
      : (t.match ?? [t.to]).some((m) => pathname === m || pathname.startsWith(`${m}/`));

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
                on ? 'text-emerald-600' : 'text-slate-500'
              }`}
            >
              <t.icon className="w-5 h-5" strokeWidth={on ? 2.4 : 2} />
              <span className={`text-[12.5px] leading-none ${on ? 'font-bold' : 'font-medium'}`}>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
