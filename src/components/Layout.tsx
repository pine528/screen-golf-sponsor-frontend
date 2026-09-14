import { ReactNode, useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Calendar,
  Gavel,
  FileText,
  User,
  LogOut,
  Settings,
  LayoutDashboard,
  Wallet,
  ChevronRight,
  Menu,
  X,
  Megaphone,
  CreditCard,
  BarChart3,
  Bell,
  CheckCheck,
  Users,
  Trophy,
  Star,
  Heart,
  Building2,
  Gift,
  ShoppingBag,
  HelpCircle,
  AlertTriangle,
  Flag,
  Eye,
  Wrench,
  TrendingUp,
  PenLine,
  Banknote,
  Award,
  Shield,
  UserCog,
  Receipt,
  FileCheck,
  Coins,
  Briefcase,
  FileImage,
  Layers,
  PlusCircle,
  ListChecks,
  Video,
  ScanLine,
  Image,
  Target,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../utils';
import { api } from '../services/api';
import LiveBadge from './LiveBadge';
import Breadcrumb, { BreadcrumbProvider } from './Breadcrumb';
import PublicHeader from './PublicHeader';

interface LayoutProps {
  children: ReactNode;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  payload?: {
    link?: string;
  };
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await api.getNotifications({ limit: 10 });
      if (response.success && response.data) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  // Fetch unread count only (lighter polling)
  const fetchUnreadCount = async () => {
    try {
      const response = await api.getUnreadNotificationCount();
      if (response.success && response.data) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll for unread count every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    const isFan = user?.role === 'FAN';
    logout();
    navigate(isFan ? '/fan/login' : '/login');
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await api.markNotificationAsRead(notification.id);
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
    if (notification.payload?.link) {
      navigate(notification.payload.link);
      setIsNotificationOpen(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  /* ── 역할별 사이드바 (v2.0 §1.1 마이페이지) ──────────────
   * 자주 쓰는 순서로 묶고, 내부 단계명·이모지는 라벨에서 뺀다.
   * 드물게 쓰는 항목은 '더보기' 그룹에 접어 둔다. */
  type NavItem = { path: string; label: string; icon: any; live?: boolean };
  type NavGroup = { title: string; items: NavItem[]; collapsed?: boolean };

  const brandNav: NavGroup[] = [
    { title: '시작', items: [
      { path: '/dashboard', label: '대시보드', icon: Home },
      { path: '/sponsor/available', label: '후원하기', icon: Target },
    ] },
    { title: '내 후원', items: [
      { path: '/inventory', label: '보유 슬롯', icon: Calendar },
      { path: '/contracts', label: '계약 관리', icon: FileText },
      { path: '/brand/creative-approvals', label: '크리에이티브 승인', icon: FileImage },
      { path: '/brand/sponsored-votes', label: '후원 투표', icon: Heart },
    ] },
    { title: '성과', items: [
      { path: '/brand/funnel/dashboard', label: '풀 퍼널 대시보드', icon: TrendingUp },
      { path: '/brand/reports/roi', label: 'ROI 리포트', icon: BarChart3 },
      { path: '/brand/slot-analytics', label: '슬롯 분석', icon: BarChart3 },
      { path: '/brand/funnel/compare', label: '성과 비교', icon: BarChart3 },
      { path: '/brand/funnel/orders', label: '주문·매출 내역', icon: Receipt },
      { path: '/about/my-guarantees', label: '성과보장 현황', icon: Shield },
    ] },
    { title: '결제', items: [
      { path: '/brand/wallet', label: '지갑', icon: Wallet },
      { path: '/brand/billing', label: '청구 · 명세서', icon: Receipt },
      { path: '/points', label: '포인트', icon: Coins },
    ] },
    { title: '계정', items: [
      { path: '/profile', label: '프로필', icon: User },
      { path: '/brand/logo-templates', label: '로고 템플릿', icon: Image },
      { path: '/brand/roi-settings', label: 'ROI 설정', icon: Settings },
    ] },
    { title: '더보기', collapsed: true, items: [
      { path: '/campaigns', label: '캠페인', icon: Megaphone },
      { path: '/auctions', label: '라이브 경매', icon: Gavel, live: true },
      { path: '/brand/funnel/pixel', label: '픽셀 설치', icon: Wrench },
      { path: '/brand/funnel/attribution', label: '멀티터치 기여', icon: Target },
      { path: '/votes', label: '무료 투표', icon: Gift },
      { path: '/votes/create', label: '투표 만들기', icon: PlusCircle },
      { path: '/votes/my-created', label: '내가 만든 투표', icon: ListChecks },
      { path: '/points/topup', label: '포인트 충전', icon: CreditCard },
    ] },
  ];

  const athleteNav: NavGroup[] = [
    { title: '시작', items: [
      { path: '/dashboard', label: '대시보드', icon: Home },
      { path: '/my-slots', label: '슬롯 관리', icon: Calendar },
    ] },
    { title: '계약', items: [
      { path: '/contracts', label: '계약 · 오퍼', icon: FileText },
      { path: '/athlete/pending-signatures', label: '서명 대기', icon: PenLine },
      { path: '/athlete/agency-requests', label: '에이전시 요청', icon: Building2 },
    ] },
    { title: '정산', items: [
      { path: '/settlements', label: '정산', icon: Wallet },
      { path: '/athlete/withdrawals', label: '정산금 출금', icon: Banknote },
      { path: '/athlete/donations', label: '받은 후원', icon: Heart },
    ] },
    { title: '성과 · 팬', items: [
      { path: '/athlete/funnel/dashboard', label: '내 성과 대시보드', icon: TrendingUp },
      { path: '/fan', label: '팬 참여 보기', icon: Heart },
    ] },
    { title: '계정', items: [
      { path: '/profile', label: '프로필', icon: User },
      { path: '/points', label: '포인트', icon: Coins },
    ] },
    { title: '더보기', collapsed: true, items: [
      { path: '/athlete/point-withdrawals', label: '포인트 출금', icon: Coins },
      { path: '/votes', label: '무료 투표', icon: Gift },
      { path: '/votes/create', label: '투표 만들기', icon: PlusCircle },
      { path: '/votes/my-created', label: '내가 만든 투표', icon: ListChecks },
      { path: '/points/topup', label: '포인트 충전', icon: CreditCard },
    ] },
  ];

  const fanNav: NavGroup[] = [
    { title: '팬 참여', items: [
      { path: '/fan', label: '팬 참여 홈', icon: Home },
      { path: '/fan/activity', label: '내 팬활동', icon: Heart },
      { path: '/fan/vote', label: 'Fan VOTE', icon: Gift },
      { path: '/fan/points', label: '팬포인트', icon: Coins },
      { path: '/fan/store', label: '팬스토어', icon: ShoppingBag },
    ] },
    { title: '계정', items: [
      { path: '/profile', label: '프로필', icon: User },
      { path: '/favorites', label: '즐겨찾기', icon: Star },
      { path: '/brand-register', label: '브랜드 등록', icon: Building2 },
    ] },
    { title: '더보기', collapsed: true, items: [
      { path: '/votes', label: '무료 투표', icon: Gift },
      { path: '/votes/create', label: '투표 만들기', icon: PlusCircle },
      { path: '/votes/my-created', label: '내가 만든 투표', icon: ListChecks },
      { path: '/my-donations', label: '선수 후원', icon: Heart },
      { path: '/fan/badges', label: '내 뱃지', icon: Award },
      { path: '/ranking', label: '랭킹', icon: Star },
      { path: '/points', label: '포인트 지갑', icon: Trophy },
      { path: '/points/topup', label: '포인트 충전', icon: CreditCard },
      { path: '/shop', label: '포인트샵', icon: Gift },
      { path: '/orders', label: '교환내역', icon: ShoppingBag },
    ] },
  ];

  /* 관리자 — 하나의 거대한 화면이 아니라 도메인별 업무 console (UI 가이드 §16 · v2.1 §16) */
  const adminNav: NavGroup[] = [
    { title: '콘솔', items: [
      { path: '/admin', label: '운영 홈', icon: LayoutDashboard },
    ] },
    { title: '선수운영', items: [
      { path: '/admin/entities', label: '선수 · 브랜드 조회', icon: Users },
      { path: '/admin/kyc', label: 'KYC 심사', icon: UserCog },
      { path: '/admin/events', label: '대회 · 이벤트', icon: Calendar },
      { path: '/admin/slot-templates', label: '슬롯 템플릿', icon: Layers },
      { path: '/admin/athletes/event-results', label: '경기 결과', icon: Trophy },
      { path: '/admin/seasons', label: '시즌', icon: Star },
      { path: '/admin/tournament-activation', label: '대회 활성화', icon: Settings },
    ] },
    { title: '상품운영', items: [
      { path: '/admin/offers', label: '후원상품', icon: ShoppingBag },
      { path: '/admin/offers/placements', label: '진열 · 배지', icon: Layers },
      { path: '/admin/offers/dashboard', label: '상품 성과', icon: BarChart3 },
      { path: '/admin/auctions', label: '경매 모니터링', icon: Gavel },
      { path: '/admin/featured-auctions', label: '추천 경매', icon: Star },
    ] },
    { title: '거래운영', items: [
      { path: '/admin/payments', label: '결제', icon: CreditCard },
      { path: '/admin/reviews', label: '검수', icon: FileCheck },
      { path: '/admin/creative-approvals', label: '크리에이티브 심사', icon: FileImage },
      { path: '/admin/exposure', label: '노출 관리', icon: Eye },
      { path: '/admin/disputes', label: '분쟁', icon: Flag },
      { path: '/admin/penalties', label: '페널티', icon: AlertTriangle },
      { path: '/admin/finance', label: '재무 콘솔', icon: Wallet },
      { path: '/admin/finance/withdrawals', label: '출금', icon: Banknote },
      { path: '/admin/finance/tax-invoices', label: '세금계산서', icon: Receipt },
      { path: '/admin/reconciliation', label: '대사', icon: Shield },
      { path: '/admin/fee-policies', label: '수수료 정책', icon: Receipt },
      { path: '/admin/points', label: '포인트 · 충전 · 출금', icon: Coins },
    ] },
    { title: '팬운영', items: [
      { path: '/admin/fan', label: '팬 운영 홈', icon: Heart },
      { path: '/admin/fan/votes', label: 'VOTE', icon: Gift },
      { path: '/admin/fan/moderation', label: '검수함 · 신고', icon: Flag },
      { path: '/admin/fan/formula', label: '팬온도 산식', icon: TrendingUp },
      { path: '/admin/fan/point-policy', label: '포인트 정책 · 원장', icon: Coins },
      { path: '/admin/fan/stores', label: '팬스토어 · 주문', icon: ShoppingBag },
      { path: '/admin/fan/report', label: '팬 리포트', icon: BarChart3 },
    ] },
    { title: 'Trust · CMS', items: [
      { path: '/admin/about', label: '소개 운영 홈', icon: FileText },
      { path: '/admin/about/pages', label: '페이지 · 메뉴', icon: FileText },
      { path: '/admin/about/cases', label: '매칭사례', icon: Award },
      { path: '/admin/about/brands', label: '함께하는 브랜드', icon: Building2 },
      { path: '/admin/about/rights', label: '권리 큐', icon: Shield },
      { path: '/admin/faq', label: 'FAQ', icon: HelpCircle },
    ] },
    { title: '성과보장', items: [
      { path: '/admin/about/policies', label: '정책 버전', icon: FileCheck },
      { path: '/admin/about/judgements', label: '판정', icon: ListChecks },
      { path: '/admin/about/appeals', label: '이의제기 · 보완지원', icon: Flag },
    ] },
    { title: '데이터품질 · 성과', collapsed: true, items: [
      { path: '/admin/athletes/media-exposure', label: '미디어 노출', icon: Video },
      { path: '/admin/roi/campaign-builder', label: 'ROI 캠페인', icon: Target },
      { path: '/admin/roi/vod', label: 'VOD', icon: Video },
      { path: '/admin/roi/qa', label: '검출 검수', icon: ScanLine },
      { path: '/admin/roi/evidence', label: '증빙', icon: FileImage },
      { path: '/admin/roi/reports', label: 'ROI 리포트', icon: FileText },
      { path: '/admin/funnel/campaigns', label: '풀 퍼널 캠페인', icon: Megaphone },
      { path: '/admin/funnel/codes-links', label: '코드 · 링크', icon: Layers },
      { path: '/admin/funnel/integrated-report', label: '통합 ROI', icon: TrendingUp },
      { path: '/admin/funnel/settlements', label: '성과 정산', icon: Coins },
      { path: '/admin/reports', label: '통합 리포트', icon: BarChart3 },
    ] },
    { title: '분석 · 감사', collapsed: true, items: [
      { path: '/admin/about/analytics', label: '소개 분석 · SEO', icon: BarChart3 },
      { path: '/admin/about/audit', label: '감사로그', icon: Shield },
      { path: '/admin/brand-registrations', label: '브랜드 신청', icon: Building2 },
      { path: '/admin/users', label: '관리자 · 권한', icon: UserCog },
      { path: '/admin/votes', label: '투표(구)', icon: Gift },
      { path: '/admin/ops', label: '운영 도구', icon: Wrench },
      { path: '/admin/settings', label: '설정', icon: Settings },
    ] },
  ];

  const agencyNav: NavGroup[] = [
    { title: '에이전시', items: [
      { path: '/agency', label: '대시보드', icon: Home },
      { path: '/agency/athletes', label: '소속 선수', icon: Users },
      { path: '/agency/athletes/search', label: '선수 검색 · 연결', icon: User },
      { path: '/agency/requests', label: '보낸 요청', icon: FileText },
      { path: '/profile', label: '프로필', icon: Briefcase },
    ] },
  ];

  const role = user?.role as string;
  const navGroups: NavGroup[] =
    role === 'ADMIN' ? adminNav
      : role === 'ATHLETE' ? athleteNav
      : role === 'FAN' ? fanNav
      : role === 'AGENCY' ? agencyNav
      : brandNav;

  const getRoleLabel = () => {
    switch (role) {
      case 'ADMIN': return '관리자';
      case 'ATHLETE': return '선수';
      case 'FAN': return '팬';
      case 'AGENCY': return '에이전시';
      default: return '브랜드';
    }
  };

  const getRoleColor = () => {
    switch (role) {
      case 'ADMIN': return 'text-violet-600';
      case 'ATHLETE': return 'text-emerald-600';
      case 'FAN': return 'text-amber-600';
      case 'AGENCY': return 'text-indigo-600';
      default: return 'text-sky-600';
    }
  };

  const roleLabel = getRoleLabel();
  const roleColor = getRoleColor();

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-slate-50 transition-colors duration-300">
      {/* Mobile Header - only show when logged in */}
      {user && (
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo-48.png" alt="SPONPIK" className="w-8 h-8 rounded-lg" />
          <span className="font-bold text-slate-900 tracking-tight">SPONPIK</span>
        </Link>
        <div className="flex items-center gap-2">
          {/* Mobile Notification Bell */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => {
                setIsNotificationOpen(!isNotificationOpen);
                if (!isNotificationOpen) fetchNotifications();
              }}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>
      )}

      {/* Mobile Menu Overlay - only show when logged in */}
      {user && isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar - Desktop fixed, Mobile slide-in - only show when logged in */}
      {user && (
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 w-64 h-screen bg-white border-r border-slate-200 transition-transform duration-300',
          'lg:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-14 lg:h-16 px-4 lg:px-6 border-b border-slate-200">
            <Link to="/" className="flex items-center gap-3" onClick={closeMobileMenu}>
              <img src="/logo-48.png" alt="SPONPIK" className="w-9 h-9 rounded-xl shadow-lg" />
              <span className="font-bold text-slate-900 tracking-tight">SPONPIK</span>
            </Link>
            <button
              onClick={closeMobileMenu}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <NavSections
              groups={navGroups}
              isActive={(p) =>
                location.pathname === p ||
                (!['/admin', '/fan', '/dashboard', '/agency'].includes(p) && location.pathname.startsWith(`${p}/`))}
              onClick={closeMobileMenu}
            />
          </nav>

          {/* User Menu */}
          <div className="p-4 border-t border-slate-200">
            {/* Desktop Notification Bell */}
            <div className="mb-4 relative" ref={notificationRef}>
              <button
                onClick={() => {
                  setIsNotificationOpen(!isNotificationOpen);
                  if (!isNotificationOpen) fetchNotifications();
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
              >
                <div className="relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[12.5px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                알림
                {unreadCount > 0 && (
                  <span className="ml-auto text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                    {unreadCount}개 새 알림
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {isNotificationOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-xl border border-slate-200 max-h-96 overflow-hidden z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-900">알림</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        <CheckCheck className="w-3 h-3" />
                        모두 읽음 처리
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-slate-500 text-sm">
                        알림이 없습니다
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={cn(
                            'w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0',
                            !notification.isRead && 'bg-emerald-50/50'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            {!notification.isRead && (
                              <span className="w-2 h-2 mt-2 bg-emerald-500 rounded-full flex-shrink-0" />
                            )}
                            <div className={cn('flex-1 min-w-0', notification.isRead && 'ml-5')}>
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {notification.title}
                              </p>
                              <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                                {notification.message}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                {formatTimeAgo(notification.createdAt)}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-slate-100">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl flex items-center justify-center border border-slate-200">
                <User className="w-5 h-5 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{user?.email}</p>
                <p className={cn('text-xs font-medium', roleColor)}>{roleLabel}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
              로그아웃
            </button>
          </div>
        </div>
      </aside>
      )}

      {/* 비로그인 상단 메뉴 — 메인과 동일한 메뉴바를 써서 어디서든 다른 메뉴로 이동할 수 있게 한다 */}
      {!user && <PublicHeader />}

      {/* Main Content */}
      <main className={cn(
        "min-h-screen",
        user ? "lg:ml-64 pt-14 lg:pt-0" : "pt-0"
      )}>
        <div className={user ? "p-4 lg:p-8" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
          <BreadcrumbProvider>
            <Breadcrumb />
            {children}
          </BreadcrumbProvider>
        </div>
      </main>
    </div>
  );
}

/**
 * NavSections — 역할별 사이드바를 그룹으로 나눠 그린다.
 * 접힌 그룹(더보기 등)은 현재 경로가 그 안에 있으면 자동으로 펼친다.
 */
function NavSections({ groups, isActive, onClick }: {
  groups: { title: string; items: { path: string; label: string; icon: any; live?: boolean }[]; collapsed?: boolean }[];
  isActive: (p: string) => boolean;
  onClick: () => void;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((g) => [g.title, !g.collapsed || g.items.some((i) => isActive(i.path))])));

  return (
    <div className="space-y-4">
      {groups.map((g) => {
        const expanded = open[g.title] ?? !g.collapsed;
        const hasActive = g.items.some((i) => isActive(i.path));
        return (
          <div key={g.title}>
            <button
              type="button"
              onClick={() => g.collapsed && setOpen((o) => ({ ...o, [g.title]: !expanded }))}
              className={cn(
                'w-full flex items-center justify-between px-3 mb-1 text-[12.5px] font-bold uppercase tracking-[0.12em]',
                g.collapsed ? 'text-slate-500 hover:text-slate-600 cursor-pointer' : 'text-slate-500 cursor-default',
                hasActive && !expanded && 'text-emerald-600',
              )}
            >
              <span>{g.title}{g.collapsed ? ` (${g.items.length})` : ''}</span>
              {g.collapsed && (
                <ChevronRight className={cn('w-3.5 h-3.5 transition-transform', expanded && 'rotate-90')} />
              )}
            </button>
            {expanded && (
              <div className="space-y-0.5">
                {g.items.map((item) => {
                  const active = isActive(item.path);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onClick}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] font-semibold transition-all group',
                        active
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
                      )}
                    >
                      <Icon className={cn('w-[18px] h-[18px]', active ? 'text-emerald-600' : 'text-slate-500 group-hover:text-slate-600')} />
                      <span className="truncate">{item.label}</span>
                      {item.live && <LiveBadge />}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
