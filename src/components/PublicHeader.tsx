/**
 * 공개 페이지 공용 상단 메뉴바
 *
 * 메인에만 있던 메뉴를 공용으로 뺀 것. 라이브 경매·투표·선수 페이지처럼 메뉴에서 바로 들어가는
 * 화면에도 같은 메뉴를 띄워 다른 곳으로 빠져나갈 수 있게 한다.
 */
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import LiveBadge from './LiveBadge';

const NAV_LINKS = [
  { to: '/auctions', label: '라이브 경매', live: true },
  { to: '/slots', label: '스폰서십 슬롯' },
  { to: '/ai-match', label: 'AI 간편 매칭', badge: 'AI' },
  { to: '/growth-market', label: '성장마켓', badge: 'NEW' },
  { to: '/votes', label: '투표' },
  { to: '/athletes', label: '선수' },
  { to: '/how-it-works', label: '이용방법' },
];

export default function PublicHeader({ fixed = false }: { fixed?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { pathname } = useLocation();

  const isActive = (to: string) => pathname === to || pathname.startsWith(`${to}/`);

  return (
    <nav
      className={`${
        fixed ? 'fixed inset-x-0 top-0' : 'sticky top-0'
      } z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100`}
    >
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo-48.png" alt="" className="w-8 h-8 rounded-xl" />
          <span className="text-lg font-extrabold tracking-tight text-slate-900">SPONPIK</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              aria-current={isActive(l.to) ? 'page' : undefined}
              className={`px-3.5 py-2 text-[13px] font-medium rounded-lg transition-colors inline-flex items-center gap-1.5 ${
                isActive(l.to)
                  ? 'text-slate-900 bg-slate-100'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {l.label}
              {l.live && <LiveBadge />}
              {l.badge && (
                <span className="px-1 py-0.5 rounded bg-emerald-500 text-white text-[9px] font-black leading-none">{l.badge}</span>
              )}
            </Link>
          ))}
          {isAuthenticated && (
            <Link
              to="/dashboard"
              className="px-3.5 py-2 text-[13px] font-medium rounded-lg transition-colors text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            >
              마이페이지
            </Link>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-2">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="h-9 px-5 inline-flex items-center gap-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors"
            >
              시작하기
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="h-9 px-4 inline-flex items-center rounded-lg text-slate-600 text-sm font-medium hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                로그인
              </Link>
              <Link
                to="/register"
                className="h-9 px-5 inline-flex items-center rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors"
              >
                시작하기
              </Link>
            </>
          )}
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg text-slate-500">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-5 pb-4 pt-2 space-y-1">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-sm rounded-lg ${
                isActive(l.to) ? 'text-slate-900 bg-slate-100 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {l.label}
              {l.live && <LiveBadge />}
              {l.badge && (
                <span className="px-1 py-0.5 rounded bg-emerald-500 text-white text-[9px] font-black leading-none">{l.badge}</span>
              )}
            </Link>
          ))}
          {isAuthenticated && (
            <Link
              to="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg"
            >
              마이페이지
            </Link>
          )}
          <div className="pt-3 mt-2 border-t border-slate-100 flex gap-2">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="flex-1 h-10 inline-flex items-center justify-center rounded-lg bg-emerald-500 text-white text-sm font-semibold"
                onClick={() => setMobileOpen(false)}
              >
                시작하기
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex-1 h-10 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold"
                  onClick={() => setMobileOpen(false)}
                >
                  로그인
                </Link>
                <Link
                  to="/register"
                  className="flex-1 h-10 inline-flex items-center justify-center rounded-lg bg-emerald-500 text-white text-sm font-semibold"
                  onClick={() => setMobileOpen(false)}
                >
                  시작하기
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
