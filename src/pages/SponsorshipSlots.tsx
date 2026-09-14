/**
 * 스폰서십 슬롯 전체 목록 (/slots)
 *
 * 라이브 경매 · 바로 구매 · 계약(협의) 슬롯을 한 화면에서 비교한다.
 * 목록 API가 검색·정렬·가격대 필터를 지원하지 않으므로 전량을 받아 화면에서 걸러낸다.
 * 표시 수치는 모두 실제 데이터에서 계산하며, 값이 없으면 0으로 그대로 둔다 (개편 LEG-06).
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Gavel,
  Info,
  Layers,
  RotateCcw,
  Search,
  ShoppingCart,
  Timer,
} from 'lucide-react';
import { api } from '../services/api';
import PublicHeader from '../components/PublicHeader';
import Breadcrumb from '../components/Breadcrumb';
import { formatTimeRemaining } from '../utils';

type Kind = 'AUCTION' | 'DIRECT' | 'INQUIRY';
type Tab = 'ALL' | Kind | 'SOON';

interface SlotRow {
  id: string;
  kind: Kind;
  athleteId: string;
  athleteName: string;
  tour: string;
  photo: string;
  slotCode: string;
  slotName: string;
  bodyPart: string;
  price: number;
  endAt?: string;
  eventName?: string;
  createdAt?: string;
}

const PAGE_SIZE = 12;

const KIND_META: Record<Kind, { label: string; chip: string; price: string; cta: string }> = {
  AUCTION: { label: '라이브 경매', chip: 'bg-violet-600 text-white', price: 'text-slate-900', cta: '상세 보기' },
  DIRECT: { label: '직접 구매', chip: 'bg-slate-900 text-white', price: 'text-sky-600', cta: '슬롯 보기' },
  INQUIRY: { label: '계약 가능', chip: 'bg-emerald-600 text-white', price: 'text-emerald-600', cta: '상세 보기' },
};

const TABS: { key: Tab; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'AUCTION', label: '라이브 경매' },
  { key: 'DIRECT', label: '직접 구매' },
  { key: 'INQUIRY', label: '계약 가능' },
  { key: 'SOON', label: '마감 임박' },
];

const PRICE_BANDS: { key: string; label: string; min: number; max: number }[] = [
  { key: 'ALL', label: '가격대 전체', min: 0, max: Infinity },
  { key: 'A', label: '50만원 미만', min: 0, max: 500_000 },
  { key: 'B', label: '50만 ~ 100만원', min: 500_000, max: 1_000_000 },
  { key: 'C', label: '100만 ~ 300만원', min: 1_000_000, max: 3_000_000 },
  { key: 'D', label: '300만원 이상', min: 3_000_000, max: Infinity },
];

const SORTS: { key: string; label: string }[] = [
  { key: 'RECOMMEND', label: '추천순' },
  { key: 'DEADLINE', label: '마감 임박순' },
  { key: 'PRICE_ASC', label: '가격 낮은순' },
  { key: 'PRICE_DESC', label: '가격 높은순' },
  { key: 'NAME', label: '선수명순' },
];

/** 슬롯 위치(부위) 한글명 */
const BODY_PART_LABEL: Record<string, string> = {
  CAP_FRONT: '모자 정면', CAP_SIDE_R: '모자 우측', CAP_SIDE_L: '모자 좌측', CAP_BACK: '모자 뒷면',
  CHEST_CENTER: '상의 중앙', CHEST_L: '상의 좌측', CHEST_R: '상의 우측',
  COLLAR_L: '카라 좌측', COLLAR_R: '카라 우측',
  SLEEVE_L: '소매 좌측', SLEEVE_R: '소매 우측',
  SHOULDER_L: '어깨 좌측', SHOULDER_R: '어깨 우측',
  WAIST_BACK: '허리 뒷면', PANTS_SIDE: '바지 측면',
};

/** 착장 부위 묶음 — '상품 유형' 필터 */
const GARMENT_OF = (bodyPart: string) => {
  if (bodyPart.startsWith('CAP')) return '모자';
  if (bodyPart.startsWith('PANTS') || bodyPart.startsWith('WAIST')) return '하의';
  return '상의';
};

/** 투어에서 성별을 유추한다 (선수 데이터에 성별 필드가 없어 투어 기준) */
const GENDER_OF = (tour: string) => {
  const t = (tour || '').toUpperCase();
  if (t.includes('KLPGA') || t.includes('LPGA') || t.includes('WGTOUR')) return '여자';
  if (t.includes('KPGA') || t.includes('PGA')) return '남자';
  return '';
};

const isSoon = (r: SlotRow) =>
  r.kind === 'AUCTION' && !!r.endAt && new Date(r.endAt).getTime() - Date.now() < 24 * 3600_000;

export default function SponsorshipSlots() {
  const [tab, setTab] = useState<Tab>('ALL');
  const [q, setQ] = useState('');
  const [bodyPart, setBodyPart] = useState('ALL');
  const [tour, setTour] = useState('ALL');
  const [garment, setGarment] = useState('ALL');
  const [gender, setGender] = useState('ALL');
  const [band, setBand] = useState('ALL');
  const [sort, setSort] = useState('RECOMMEND');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['sponsorship-slots'],
    queryFn: async (): Promise<SlotRow[]> => {
      // 슬롯 목록은 한 번에 다 오지 않으므로(총 300건 초과) 페이지를 끝까지 순회한다
      const fetchAllSlots = async () => {
        const first = await api.getSlotInstances({ page: 1, limit: 200 });
        const all = [...(((first as any)?.data as any[]) || [])];
        const totalPages = (first as any)?.pagination?.totalPages || 1;
        if (totalPages > 1) {
          const rest = await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, i) => api.getSlotInstances({ page: i + 2, limit: 200 }))
          );
          for (const r of rest) all.push(...((((r as any)?.data as any[]) || [])));
        }
        return all;
      };

      // 경매 목록도 페이지 단위로 끊겨 오므로 끝까지 순회한다 (파라미터 이름은 pageSize가 아니라 limit)
      const fetchAllAuctions = async () => {
        const first = await api.getAuctions({ status: 'LIVE', page: 1, limit: 200 });
        const all = [...(((first as any)?.data as any[]) || [])];
        const totalPages = (first as any)?.pagination?.totalPages || 1;
        if (totalPages > 1) {
          const rest = await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, i) =>
              api.getAuctions({ status: 'LIVE', page: i + 2, limit: 200 })
            )
          );
          for (const r of rest) all.push(...((((r as any)?.data as any[]) || [])));
        }
        return all;
      };

      const [allAuctions, allSlots] = await Promise.all([fetchAllAuctions(), fetchAllSlots()]);
      const auctionRes = { data: allAuctions };
      const slotRes = { data: allSlots };

      const auctions: SlotRow[] = ((auctionRes as any)?.data || []).map((a: any) => ({
        id: a.slotInstance?.id || a.id,
        kind: 'AUCTION' as const,
        athleteId: a.slotInstance?.athlete?.id || '',
        athleteName: a.slotInstance?.athlete?.name || '선수',
        tour: a.slotInstance?.athlete?.tour || '',
        photo: a.slotInstance?.athlete?.profileImageUrl || '',
        slotCode: a.slotInstance?.slotTemplate?.code || '',
        slotName: a.slotInstance?.slotTemplate?.nameKr || a.slotInstance?.slotTemplate?.name || '',
        bodyPart: a.slotInstance?.slotTemplate?.bodyPart || '',
        price: Number(a.currentPrice || a.slotInstance?.reservePrice || 0),
        endAt: a.endAt,
        eventName: a.slotInstance?.event?.name || '',
        createdAt: a.createdAt,
      }));

      const auctionSlotIds = new Set(auctions.map((a) => a.id));

      const others: SlotRow[] = ((slotRes as any)?.data || [])
        .filter((s: any) => s.isActive && s.status !== 'SOLD' && s.status !== 'RESERVED')
        .filter((s: any) => !auctionSlotIds.has(s.id))
        // 경매용 슬롯인데 진행 중인 경매가 없으면 아직 살 수 없는 예정 물량이므로 제외한다 (메인과 동일 규칙)
        .filter((s: any) => !s.enableAuction)
        .map((s: any) => ({
          id: s.id,
          kind: (s.enableDirectBuy ? 'DIRECT' : 'INQUIRY') as Kind,
          athleteId: s.athleteId || s.athlete?.id || '',
          athleteName: s.athlete?.name || '선수',
          tour: s.athlete?.tour || '',
          photo: s.athlete?.profileImageUrl || '',
          slotCode: s.slotTemplate?.code || '',
          slotName: s.slotTemplate?.nameKr || s.slotTemplate?.name || '',
          bodyPart: s.slotTemplate?.bodyPart || '',
          price: Number(s.directBuyPrice || s.reservePrice || 0),
          eventName: s.event?.name || '',
          createdAt: s.createdAt,
        }));

      return [...auctions, ...others];
    },
    staleTime: 60_000,
  });

  const rows = useMemo(() => data || [], [data]);

  /* 상단 요약 — 필터와 무관한 전체 기준 */
  const summary = useMemo(
    () => ({
      total: rows.length,
      auction: rows.filter((r) => r.kind === 'AUCTION').length,
      direct: rows.filter((r) => r.kind === 'DIRECT').length,
      inquiry: rows.filter((r) => r.kind === 'INQUIRY').length,
      soon: rows.filter(isSoon).length,
    }),
    [rows]
  );

  /* 선택지는 실제 데이터에 있는 값만 노출 */
  const options = useMemo(() => {
    const uniq = (arr: string[]) => [...new Set(arr.filter(Boolean))].sort();
    return {
      bodyParts: uniq(rows.map((r) => r.bodyPart)),
      tours: uniq(rows.map((r) => r.tour)),
      garments: uniq(rows.map((r) => GARMENT_OF(r.bodyPart))),
      genders: uniq(rows.map((r) => GENDER_OF(r.tour))),
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    const pb = PRICE_BANDS.find((p) => p.key === band)!;

    const list = rows.filter((r) => {
      if (tab === 'SOON' ? !isSoon(r) : tab !== 'ALL' && r.kind !== tab) return false;
      if (kw && ![r.athleteName, r.tour, r.slotName, r.eventName].some((v) => (v || '').toLowerCase().includes(kw)))
        return false;
      if (bodyPart !== 'ALL' && r.bodyPart !== bodyPart) return false;
      if (tour !== 'ALL' && r.tour !== tour) return false;
      if (garment !== 'ALL' && GARMENT_OF(r.bodyPart) !== garment) return false;
      if (gender !== 'ALL' && GENDER_OF(r.tour) !== gender) return false;
      if (r.price < pb.min || r.price >= pb.max) return false;
      return true;
    });

    const rank: Record<Kind, number> = { AUCTION: 0, DIRECT: 1, INQUIRY: 2 };
    const sorted = [...list];
    if (sort === 'PRICE_ASC') sorted.sort((a, b) => a.price - b.price);
    else if (sort === 'PRICE_DESC') sorted.sort((a, b) => b.price - a.price);
    else if (sort === 'NAME') sorted.sort((a, b) => a.athleteName.localeCompare(b.athleteName, 'ko'));
    else if (sort === 'DEADLINE')
      sorted.sort((a, b) => {
        const ta = a.endAt ? new Date(a.endAt).getTime() : Infinity;
        const tb = b.endAt ? new Date(b.endAt).getTime() : Infinity;
        return ta - tb;
      });
    // 추천순: 마감 임박 → 경매 → 바로구매 → 협의 → 선수명
    else
      sorted.sort((a, b) => {
        const sa = isSoon(a) ? 0 : 1;
        const sb = isSoon(b) ? 0 : 1;
        if (sa !== sb) return sa - sb;
        if (rank[a.kind] !== rank[b.kind]) return rank[a.kind] - rank[b.kind];
        return a.athleteName.localeCompare(b.athleteName, 'ko');
      });

    return sorted;
  }, [rows, tab, q, bodyPart, tour, garment, gender, band, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageRows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const reset = () => {
    setTab('ALL');
    setQ('');
    setBodyPart('ALL');
    setTour('ALL');
    setGarment('ALL');
    setGender('ALL');
    setBand('ALL');
    setSort('RECOMMEND');
    setPage(1);
  };

  const onFilter = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  /* 선수별 슬롯 개수 — 카드의 '슬롯 N개' 배지 */
  const slotCountByAthlete = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) m.set(r.athleteId, (m.get(r.athleteId) || 0) + 1);
    return m;
  }, [rows]);

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-5">
        <Breadcrumb className="mb-0" />
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-6">
        {/* 헤더 + 유형 안내 */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
              진행중인 스폰서십 슬롯
            </h1>
            <p className="text-sm text-slate-500 break-keep">
              라이브 경매, 직접 구매, 계약 가능한 스폰서십 슬롯을 한곳에서 비교하고 우리 브랜드에 맞는 기회를 찾아보세요.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-extrabold text-slate-900 inline-flex items-center gap-1.5 mb-3">
              스폰서십 슬롯 유형 안내
              <Info className="w-3.5 h-3.5 text-slate-300" />
            </h2>
            <ul className="space-y-2">
              <TypeRow chip={KIND_META.AUCTION.chip} label="라이브 경매" desc="실시간 입찰 경쟁으로 최종 낙찰가에 계약합니다." />
              <TypeRow chip={KIND_META.DIRECT.chip} label="직접 구매" desc="정해진 금액으로 즉시 예약하고 바로 계약합니다." />
              <TypeRow chip={KIND_META.INQUIRY.chip} label="계약 가능" desc="기간·금액·옵션을 협의해 계약을 진행합니다." />
            </ul>
          </div>
        </div>

        {/* 요약 지표 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
          <StatCard icon={Layers} tone="violet" label="전체 슬롯 수" value={summary.total} />
          <StatCard icon={Gavel} tone="sky" label="라이브 경매 수" value={summary.auction} />
          <StatCard icon={ShoppingCart} tone="emerald" label="바로 구매 가능" value={summary.direct} />
          <StatCard icon={FileText} tone="slate" label="계약 가능 수" value={summary.inquiry} />
          <StatCard icon={Timer} tone="amber" label="마감 임박" value={summary.soon} />
        </div>

        {/* 유형 탭 */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => onFilter(setTab)(t.key)}
              aria-pressed={tab === t.key}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                tab === t.key
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 상세 필터 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={q}
                onChange={(e) => onFilter(setQ)(e.target.value)}
                placeholder="선수명 검색"
                className="w-full h-9 pl-9 pr-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <Select value={bodyPart} onChange={onFilter(setBodyPart)} allLabel="슬롯 위치 전체"
              options={options.bodyParts.map((b) => ({ value: b, label: BODY_PART_LABEL[b] || b }))} />
            <Select value={tour} onChange={onFilter(setTour)} allLabel="종목/투어 전체"
              options={options.tours.map((t) => ({ value: t, label: t }))} />
            <Select value={garment} onChange={onFilter(setGarment)} allLabel="상품 유형 전체"
              options={options.garments.map((g) => ({ value: g, label: g }))} />
            <Select value={gender} onChange={onFilter(setGender)} allLabel="성별 전체"
              options={options.genders.map((g) => ({ value: g, label: g }))} />
            <Select value={band} onChange={onFilter(setBand)} allLabel="가격대 전체"
              options={PRICE_BANDS.filter((p) => p.key !== 'ALL').map((p) => ({ value: p.key, label: p.label }))} />
            <Select value={sort} onChange={onFilter(setSort)}
              options={SORTS.map((s) => ({ value: s.key, label: s.label }))} />

            <button
              type="button"
              onClick={reset}
              className="h-9 px-3 inline-flex items-center gap-1 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:border-slate-400 hover:text-slate-900 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> 필터 초기화
            </button>
          </div>
        </div>

        <p className="text-sm text-slate-500 mb-3">
          총 <b className="text-slate-900 tabular-nums">{filtered.length.toLocaleString()}</b>개의 슬롯
        </p>

        {/* 목록 */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="h-44 bg-slate-100" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                  <div className="h-5 bg-slate-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : pageRows.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-slate-200 bg-white">
            <Layers className="w-12 h-12 mx-auto text-slate-200 mb-3" />
            <p className="text-sm text-slate-500 mb-3">조건에 맞는 슬롯이 없습니다.</p>
            <button onClick={reset} className="text-sm font-semibold text-emerald-600 hover:underline">
              필터 초기화
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pageRows.map((r) => (
              <SlotCard key={`${r.kind}-${r.id}`} row={r} slotCount={slotCountByAthlete.get(r.athleteId) || 1} />
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-1 mt-8">
            <PageBtn disabled={current <= 1} onClick={() => setPage(current - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </PageBtn>
            {pageNumbers(current, totalPages).map((n, i) =>
              n === '...' ? (
                <span key={`gap-${i}`} className="px-2 text-sm text-slate-500">
                  …
                </span>
              ) : (
                <button
                  key={n}
                  onClick={() => setPage(n as number)}
                  aria-current={n === current ? 'page' : undefined}
                  className={`min-w-[34px] h-9 px-2 rounded-lg text-sm font-semibold tabular-nums transition-colors ${
                    n === current
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'
                  }`}
                >
                  {n}
                </button>
              )
            )}
            <PageBtn disabled={current >= totalPages} onClick={() => setPage(current + 1)}>
              <ChevronRight className="w-4 h-4" />
            </PageBtn>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 부품 ────────────────────────────────────────────── */

function TypeRow({ chip, label, desc }: { chip: string; label: string; desc: string }) {
  return (
    <li className="flex items-start gap-2">
      <span className={`shrink-0 px-2 py-0.5 rounded-md text-[12.5px] font-extrabold ${chip}`}>{label}</span>
      <span className="text-[12px] text-slate-500 break-keep leading-relaxed">{desc}</span>
    </li>
  );
}

const TONES: Record<string, string> = {
  violet: 'bg-violet-50 text-violet-600',
  sky: 'bg-sky-50 text-sky-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  slate: 'bg-slate-100 text-slate-600',
  amber: 'bg-amber-50 text-amber-600',
};

function StatCard({ icon: Icon, tone, label, value }: { icon: any; tone: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <span className={`w-9 h-9 shrink-0 rounded-xl inline-flex items-center justify-center ${TONES[tone]}`}>
        <Icon className="w-4 h-4" />
      </span>
      <div className="min-w-0">
        <div className="text-[12px] text-slate-500 truncate">{label}</div>
        <div className="text-lg font-black text-slate-900 tabular-nums leading-tight">
          {value.toLocaleString()} <span className="text-xs font-bold text-slate-500">개</span>
        </div>
      </div>
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  allLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  allLabel?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 px-3 pr-7 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 cursor-pointer"
    >
      {allLabel && <option value="ALL">{allLabel}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function SlotCard({ row, slotCount }: { row: SlotRow; slotCount: number }) {
  const meta = KIND_META[row.kind];
  const soon = isSoon(row);
  // 해당 선수의 '○○'s 스폰서십 슬롯' 섹션으로 보내고, 카드에서 고른 슬롯을 선택 상태로 넘긴다
  const to = row.athleteId
    ? `/athletes/${row.athleteId}${row.slotCode ? `?slot=${encodeURIComponent(row.slotCode)}` : ''}#slots`
    : '/auctions';

  return (
    <Link
      to={to}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-emerald-300 hover:shadow-sm transition-all"
    >
      {/* 세로로 긴 인물 사진이라 가운데를 기준으로 자르면 얼굴이 잘린다.
          카드 폭 대비 7:5 비율에 위에서 8% 지점을 기준으로 잡아야 얼굴이 온전히 들어온다. */}
      <div className="relative aspect-[7/5] bg-slate-100 overflow-hidden">
        {row.photo ? (
          <img
            src={row.photo}
            alt={row.athleteName}
            className="w-full h-full object-cover object-[50%_8%] group-hover:scale-[1.03] transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-sm">이미지 없음</div>
        )}
        <span className={`absolute top-3 left-3 px-2 py-1 rounded-lg text-[12.5px] font-extrabold ${meta.chip}`}>
          {meta.label}
        </span>
        <span className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-white/90 text-slate-700 text-[12.5px] font-bold">
          슬롯 {slotCount}개
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-baseline gap-1.5 mb-0.5">
          <span className="text-base font-extrabold text-slate-900 truncate">{row.athleteName}</span>
          <span className="text-[12px] font-semibold text-slate-500 shrink-0">{row.tour}</span>
        </div>
        <p className="text-[12px] text-slate-500 truncate mb-3">
          {row.slotName || BODY_PART_LABEL[row.bodyPart] || '스폰서십 슬롯'}
        </p>

        <div className="mt-auto">
          <div className="text-[12.5px] text-slate-500 mb-0.5">
            {row.kind === 'AUCTION' ? '경매 시작가' : row.kind === 'DIRECT' ? '바로 구매가' : '협의 시작가'}
          </div>
          {row.kind === 'INQUIRY' && row.price === 0 ? (
            <div className="text-base font-extrabold text-emerald-600">협의 가능</div>
          ) : (
            <div className={`text-lg font-black tabular-nums ${meta.price}`}>
              ₩{row.price.toLocaleString()}
              <span className="text-[12.5px] font-bold text-slate-500 ml-1">부터</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 mt-2">
            {row.kind === 'AUCTION' && row.endAt ? (
              <span
                className={`inline-flex items-center gap-1 text-[12px] font-semibold ${
                  soon ? 'text-amber-600' : 'text-slate-500'
                }`}
              >
                <Timer className="w-3 h-3" />
                {formatTimeRemaining(row.endAt)}
              </span>
            ) : (
              <span className="text-[12px] font-semibold text-slate-500">
                {row.kind === 'DIRECT' ? '바로 구매 가능' : '계약 협의 가능'}
              </span>
            )}
            <span className="text-[12px] font-bold text-emerald-600 group-hover:underline shrink-0">{meta.cta}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function PageBtn({ disabled, onClick, children }: { disabled: boolean; onClick: () => void; children: any }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-9 h-9 inline-flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:border-slate-400 transition-colors"
    >
      {children}
    </button>
  );
}

/** 1 … 4 5 [6] 7 8 … 36 형태의 페이지 번호 */
function pageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | '...')[] = [1];
  const from = Math.max(2, current - 1);
  const to = Math.min(total - 1, current + 1);
  if (from > 2) out.push('...');
  for (let i = from; i <= to; i++) out.push(i);
  if (to < total - 1) out.push('...');
  out.push(total);
  return out;
}
