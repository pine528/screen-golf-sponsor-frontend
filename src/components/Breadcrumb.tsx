/**
 * 전역 브레드크럼
 *
 * Layout 안에서 현재 경로를 읽어 자동으로 경로 표시를 만든다. 페이지마다 따로 넣을 필요가 없고,
 * 상세 페이지처럼 마지막 항목 이름이 데이터에 따라 달라지는 경우에만 `useBreadcrumbTitle(name)`으로
 * 마지막 항목 이름을 덮어쓴다.
 */
import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Home } from 'lucide-react';

/** 경로별 표시 이름. 키는 누적 경로 전체(가장 구체적인 것이 우선). */
const PATH_LABELS: Record<string, string> = {
  // 공개
  '/athletes': '선수 찾기',
  '/auctions': '라이브 경매',
  '/slots': '스폰서십 슬롯',
  '/growth-market': '성장마켓',
  '/ai-match': 'AI 간편 매칭',
  '/ai-match/compare': '추천 비교',
  '/ai-match/proposal': '상세 제안',
  '/fan-store': '성장마켓',
  '/fan-store/orex': 'OREX 팬스토어',
  '/fan-store/orex/ar': '선수 AR 보기',
  '/fan-store/orex/ar/download': 'AR 이미지 다운로드',
  '/fan-store/the-guys': 'the GUYS 팬 스토어',
  '/fan-store/the-guys/ar': '선수 AR 보기',
  '/fan-store/the-guys/ar/download': 'AR 이미지팩 다운로드',
  '/fan-store/hoi-bakery': '호이베이커리 팬스토어',
  '/fan-store/hoi-bakery/products': '추천 스토어 상품',
  '/fan-store/hoi-bakery/ar': '선수 AR 보기',
  '/fan-store/hoi-bakery/ar/download': 'AR 이미지 다운로드',
  '/votes': '무료 투표',
  '/votes/create': '투표 만들기',
  '/votes/my-created': '내가 만든 투표',
  '/shop': '포인트샵',
  '/orders': '교환내역',
  '/ranking': '랭킹',
  '/favorites': '즐겨찾기',
  '/guide': '이용 안내',
  '/faq': '자주 묻는 질문',
  '/features': '주요 기능',
  '/for-who': '이런 분께 추천',
  '/how-it-works': '이용 방법',
  '/contact': '문의하기',
  '/terms': '이용약관',
  '/privacy': '개인정보처리방침',
  '/login': '로그인',
  '/register': '회원가입',
  '/brand-register': '브랜드 등록',
  '/seasons': '시즌',
  '/seasons/leaderboard': '리더보드',

  // 공통(로그인)
  '/dashboard': '대시보드',
  '/profile': '프로필',
  '/inventory': '인벤토리',
  '/contracts': '계약 관리',
  '/campaigns': '캠페인',
  '/settlements': '정산',
  '/my-slots': '슬롯 관리',
  '/my-donations': '선수 후원',
  '/points': '내 포인트',
  '/points/topup': '포인트 충전',
  '/proposals': '파트너십 제안',
  '/proposals/new': '새 제안',
  '/deliverables': '이행·증빙',
  '/checkout': '구매',
  '/checkout/slots': '슬롯 구매',

  // 브랜드
  '/brand': '브랜드',
  '/brand/wallet': '지갑',
  '/brand/wallet/checkout': '충전',
  '/brand/billing': '청구/명세서',
  '/brand/sponsored-votes': '후원 투표',
  '/brand/creative-approvals': '크리에이티브 승인',
  '/brand/slot-analytics': '슬롯 분석',
  '/brand/logo-templates': '로고 템플릿',
  '/brand/roi-settings': 'ROI 설정',
  '/brand/reports': '리포트',
  '/brand/reports/roi': 'ROI 리포트',
  '/brand/campaigns': '캠페인',
  '/brand/campaigns/evidence': '증빙',
  '/brand/campaigns/reports': '리포트',
  '/brand/votes': '투표',
  '/brand/votes/create': '투표 만들기',
  '/brand/funnel': '풀 퍼널',
  '/brand/funnel/dashboard': '대시보드',
  '/brand/funnel/compare': '성과 비교',
  '/brand/funnel/orders': '주문·매출 내역',
  '/brand/funnel/pixel': '픽셀 설치',
  '/brand/funnel/attribution': '멀티터치',

  // 선수
  '/athlete': '선수',
  '/athlete/pending-signatures': '서명 대기',
  '/athlete/agency-requests': '에이전시 요청',
  '/athlete/withdrawals': '정산금 출금',
  '/athlete/point-withdrawals': '포인트 출금',
  '/athlete/donations': '받은 후원',
  '/athlete/funnel': '풀 퍼널',
  '/athlete/funnel/dashboard': '내 성과',

  // 팬
  '/fan': '팬 홈',
  '/fan/badges': '내 뱃지',
  '/fan/login': '로그인',
  '/fan/register': '회원가입',

  // 에이전시
  '/agency': '에이전시',
  '/agency/athletes': '소속 선수',
  '/agency/athletes/search': '선수 검색/연결',
  '/agency/athletes/register': '선수 등록',
  '/agency/requests': '보낸 요청',

  // 관리자
  '/admin': '관리자',
  '/admin/events': '이벤트 관리',
  '/admin/auctions': '경매 모니터링',
  '/admin/featured-auctions': '추천 경매',
  '/admin/slot-templates': '슬롯 템플릿',
  '/admin/entities': '등록 회원',
  '/admin/entities/brand': '브랜드',
  '/admin/entities/athlete': '선수',
  '/admin/entities/agency': '에이전시',
  '/admin/entities/fan': '팬',
  '/admin/entities/user': '회원',
  '/admin/kyc': 'KYC 심사',
  '/admin/brand-registrations': '브랜드 신청',
  '/admin/reviews': '검수 관리',
  '/admin/votes': '투표 관리',
  '/admin/points': '포인트 관리',
  '/admin/fee-policies': '수수료 정책',
  '/admin/point-withdrawals': '포인트 출금',
  '/admin/creative-approvals': '크리에이티브 심사',
  '/admin/payments': '결제 관리',
  '/admin/reconciliation': '대사 관리',
  '/admin/users': '관리자 관리',
  '/admin/faq': 'FAQ 관리',
  '/admin/penalties': '페널티',
  '/admin/disputes': '분쟁 관리',
  '/admin/seasons': '시즌 관리',
  '/admin/exposure': '노출 관리',
  '/admin/ops': '운영 도구',
  '/admin/reports': '통합 리포트',
  '/admin/settings': '설정',
  '/admin/tournament-activation': '대회 활성화',
  '/admin/finance': '재무 콘솔',
  '/admin/finance/escrows': '에스크로',
  '/admin/finance/payouts': '지급',
  '/admin/finance/point-topups': '포인트 충전',
  '/admin/finance/topups': '충전 관리',
  '/admin/finance/wallets': '지갑',
  '/admin/finance/reports': '재무 리포트',
  '/admin/finance/tax-invoices': '세금계산서',
  '/admin/finance/withdrawals': '출금 관리',
  '/admin/finance/withdrawals/batches': '출금 배치',
  '/admin/athletes': '선수 데이터',
  '/admin/athletes/event-results': '경기 결과',
  '/admin/athletes/media-exposure': '미디어 노출',
  '/admin/roi': 'ROI',
  '/admin/roi/campaign-builder': '캠페인 빌더',
  '/admin/roi/vod': 'VOD 관리',
  '/admin/roi/qa': '검출 검수',
  '/admin/roi/evidence': '증빙 관리',
  '/admin/roi/reports': '리포트 관리',
  '/admin/funnel': '풀 퍼널',
  '/admin/funnel/campaigns': '캠페인',
  '/admin/funnel/codes-links': '코드·링크',
  '/admin/funnel/integrated-report': '통합 ROI',
  '/admin/funnel/settlements': '성과 정산',
  '/admin/funnel/mini-store': '미니스토어',
};

/** 실제 라우트가 없는 묶음용 경로 — 링크가 아니라 글자로만 표시한다. */
const GROUP_ONLY = new Set([
  '/fan-store', // 라우트 없음 — 성장마켓 묶음 표기용
  '/brand',
  '/brand/reports',
  '/brand/funnel',
  '/brand/campaigns',
  '/athlete',
  '/athlete/funnel',
  '/admin/roi',
  '/admin/funnel',
  '/admin/funnel/mini-store',
  '/admin/athletes',
  '/checkout',
  '/checkout/slots',
  '/seasons',
  '/admin/entities/brand',
  '/admin/entities/athlete',
  '/admin/entities/agency',
  '/admin/entities/fan',
  '/admin/entities/user',
]);

/** 브레드크럼을 띄우지 않는 최상위 화면 */
const HIDDEN_PATHS = new Set(['/', '/dashboard', '/admin', '/fan', '/agency', '/login', '/register', '/fan/login', '/fan/register']);

/** UUID·숫자 ID처럼 사람이 읽을 수 없는 조각인지 */
const isIdSegment = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s) ||
  /^c[a-z0-9]{20,}$/i.test(s) ||
  /^\d+$/.test(s) ||
  s.length >= 16;

const humanize = (s: string) => s.replace(/[-_]/g, ' ').replace(/^./, (c) => c.toUpperCase());

/* ── 마지막 항목 이름 덮어쓰기 ─────────────────────────────── */

const LeafTitleContext = createContext<{
  title: string | null;
  setTitle: (t: string | null) => void;
}>({ title: null, setTitle: () => {} });

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState<string | null>(null);
  const location = useLocation();

  // 경로가 바뀌면 이전 페이지의 이름이 남지 않도록 초기화
  useEffect(() => setTitle(null), [location.pathname]);

  return <LeafTitleContext.Provider value={{ title, setTitle }}>{children}</LeafTitleContext.Provider>;
}

/**
 * 상세 페이지에서 마지막 항목 이름을 실제 데이터로 바꾼다.
 * 예: useBreadcrumbTitle(athlete?.name) → "홈 > 선수 찾기 > 김수아2"
 */
export function useBreadcrumbTitle(title?: string | null) {
  const { setTitle } = useContext(LeafTitleContext);
  useEffect(() => {
    if (title) setTitle(title);
  }, [title, setTitle]);
}

/* ── 표시 ──────────────────────────────────────────────── */

export interface Crumb {
  label: string;
  to?: string;
}

export function buildTrail(pathname: string, leafTitle: string | null): Crumb[] {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: Crumb[] = [];
  let acc = ''; // 실제 이동 경로 (링크용)
  let key = ''; // ID 조각을 뺀 경로 (라벨 조회용) — /seasons/123/leaderboard → /seasons/leaderboard

  segments.forEach((seg, i) => {
    acc += `/${seg}`;
    const last = i === segments.length - 1;

    if (isIdSegment(seg)) {
      // ID 자체는 보여주지 않고, 마지막이면 페이지가 지정한 이름(없으면 '상세')으로 대체
      if (last) crumbs.push({ label: leafTitle || '상세' });
      return;
    }

    key += `/${seg}`;
    const label = PATH_LABELS[key] || humanize(seg);
    crumbs.push({ label, to: last || GROUP_ONLY.has(key) ? undefined : acc });
  });

  // 마지막이 ID가 아닌 일반 경로여도 페이지가 이름을 지정했으면 그것을 쓴다
  if (leafTitle && crumbs.length > 0 && !isIdSegment(segments[segments.length - 1] || '')) {
    const tail = crumbs[crumbs.length - 1];
    if (tail.label !== leafTitle) crumbs.push({ label: leafTitle });
  }

  return crumbs;
}

/** Layout이 자동으로 렌더링하는 브레드크럼 */
export default function Breadcrumb({
  className = '',
  title: titleProp,
  tone = 'light',
}: {
  className?: string;
  /** Layout 밖에서 직접 쓸 때 마지막 항목 이름을 넘긴다 (Layout 안에서는 useBreadcrumbTitle 사용) */
  title?: string | null;
  /** 컬러 헤더 위에 얹을 때는 'onDark' */
  tone?: 'light' | 'onDark';
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { title: ctxTitle } = useContext(LeafTitleContext);
  const title = titleProp ?? ctxTitle;

  const trail = useMemo(() => buildTrail(location.pathname, title), [location.pathname, title]);

  if (HIDDEN_PATHS.has(location.pathname) || trail.length === 0) return null;

  // 상위 경로 — 직접 링크로 들어와 히스토리가 없을 때 '뒤로'가 갈 곳
  const parent = [...trail].reverse().find((c) => c.to)?.to || '/';
  const goBack = () => {
    const idx = (window.history.state as any)?.idx;
    if (typeof idx === 'number' && idx > 0) navigate(-1);
    else navigate(parent);
  };

  const dark = tone === 'onDark';
  const base = dark ? 'text-white/75' : 'text-slate-500';
  const hover = dark ? 'hover:bg-white/15 hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900';
  const sep = dark ? 'text-white/40' : 'text-slate-300';
  const current = dark ? 'font-semibold text-white' : 'font-semibold text-slate-900';

  return (
    <nav aria-label="현재 위치" className={`mb-4 flex items-center gap-2 ${className}`}>
      <ol className={`flex flex-wrap items-center gap-1 text-xs min-w-0 ${base}`}>
        <li className="flex items-center">
          <Link to="/" className={`inline-flex items-center gap-1 px-1.5 py-1 rounded-md transition-colors ${hover}`}>
            <Home className="w-3.5 h-3.5" />
            <span className="sr-only sm:not-sr-only">홈</span>
          </Link>
        </li>
        {trail.map((c, i) => {
          const last = i === trail.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center min-w-0">
              <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${sep}`} />
              {c.to && !last ? (
                <Link
                  to={c.to}
                  className={`px-1.5 py-1 rounded-md transition-colors truncate max-w-[10rem] sm:max-w-[16rem] ${hover}`}
                >
                  {c.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? 'page' : undefined}
                  className={`px-1.5 py-1 truncate max-w-[10rem] sm:max-w-[16rem] ${last ? current : ''}`}
                >
                  {c.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <button
        type="button"
        onClick={goBack}
        className={`ml-auto shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${base} ${hover}`}
      >
        <ArrowLeft className="w-3.5 h-3.5" /> 뒤로
      </button>
    </nav>
  );
}
