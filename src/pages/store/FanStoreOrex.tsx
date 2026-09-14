/**
 * OREX 팬스토어 메인 (/fan-store/orex) — 사용자 제공 시안 기준
 *
 * [스토어 히어로: 선수 × 브랜드 + 혜택 칩 + 선수 사진]
 * [좌: 카테고리/가격 필터] [우: 추천 스토어 상품 그리드 (랭킹 뱃지)]
 *
 * 전시용 카탈로그(`data/orexStore.ts`) — 실구매는 상품 등록 후 연결한다.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, ChevronDown, RotateCcw, ShoppingCart, Ticket } from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import Breadcrumb from '../../components/Breadcrumb';
import { OREX_PRODUCTS, OREX_STORE, tomorrowLabel } from '../../data/orexStore';

const PRICE_RANGES = [
  { label: '~ 5,000원', min: 0, max: 5000 },
  { label: '5,000원 ~ 10,000원', min: 5000, max: 10000 },
  { label: '10,000원 ~ 20,000원', min: 10000, max: 20000 },
  { label: '20,000원 ~', min: 20000, max: Infinity },
];

export default function FanStoreOrex() {
  const [categories, setCategories] = useState<Set<string>>(new Set());
  const [sizes, setSizes] = useState<Set<string>>(new Set());
  const [priceIdx, setPriceIdx] = useState<number | null>(null);

  const categoryCounts = useMemo(() => countBy(OREX_PRODUCTS.map((p) => p.category)), []);
  const sizeCounts = useMemo(() => countBy(OREX_PRODUCTS.map((p) => p.size)), []);

  const filtered = OREX_PRODUCTS.filter((p) => {
    if (categories.size > 0 && !categories.has(p.category)) return false;
    if (sizes.size > 0 && !sizes.has(p.size)) return false;
    if (priceIdx !== null) {
      const r = PRICE_RANGES[priceIdx];
      if (p.price < r.min || p.price >= r.max) return false;
    }
    return true;
  });

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, v: string) => {
    const next = new Set(set);
    next.has(v) ? next.delete(v) : next.add(v);
    setter(next);
  };
  const reset = () => {
    setCategories(new Set());
    setSizes(new Set());
    setPriceIdx(null);
  };

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-5">
        <Breadcrumb className="mb-0" />
      </div>

      {/* ── 스토어 히어로 ── */}
      <section className="px-5 sm:px-8 pt-2 pb-6">
        <div className="max-w-7xl mx-auto rounded-2xl border border-slate-200 overflow-hidden flex items-stretch">
          <div className="flex-1 min-w-0 p-5 sm:p-6">
            <div className="flex items-center gap-2.5 flex-wrap mb-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900">{OREX_STORE.athleteName} 프로</span>
              <span className="text-slate-300 font-bold">×</span>
              <img src={OREX_STORE.brandLogo} alt={OREX_STORE.brandName} className="h-9 object-contain" />
              <span className="text-xl sm:text-2xl font-black text-slate-900">팬 스토어</span>
            </div>
            <p className="text-sm text-slate-500 break-keep mb-4">{OREX_STORE.description}</p>
            <div className="flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                <Ticket className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="leading-tight">
                  <div className="text-[12px] font-bold text-slate-900">팬 할인코드</div>
                  <div className="text-[12px] font-black text-emerald-700 tracking-wide">{OREX_STORE.fanCode}</div>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[12.5px] font-black flex items-center justify-center shrink-0">P</span>
                <div className="leading-tight">
                  <div className="text-[12px] font-bold text-slate-900">팬포인트</div>
                  <div className="text-[12.5px] text-slate-500">사용 가능</div>
                </div>
              </div>
              <Link
                to={`${OREX_STORE.path}/ar`}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 hover:border-emerald-300 transition-colors"
              >
                <Box className="w-4 h-4 text-slate-500 shrink-0" />
                <div className="leading-tight">
                  <div className="text-[12px] font-bold text-slate-900">AR 선수 이미지 보기</div>
                  <div className="text-[12.5px] text-slate-500">AR 체험 가능</div>
                </div>
              </Link>
            </div>
          </div>
          <div className="relative w-[30%] max-w-[320px] shrink-0 hidden sm:block bg-slate-50 overflow-hidden">
            <img
              src={OREX_STORE.athletePhoto}
              alt={`${OREX_STORE.athleteName} 프로`}
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
            <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur text-[12px] font-bold text-slate-900">
              {OREX_STORE.athleteName} 프로
            </span>
          </div>
        </div>
      </section>

      {/* ── 필터 + 상품 그리드 ── */}
      <section className="px-5 sm:px-8 pb-16">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 items-start">
          {/* 필터 사이드바 */}
          <aside className="w-full lg:w-[230px] shrink-0 rounded-2xl border border-slate-200 p-4">
            <div className="text-sm font-extrabold text-slate-900 mb-3">카테고리</div>
            <div className="space-y-2 mb-4">
              {Object.entries(categoryCounts).map(([c, n]) => (
                <FilterCheck key={c} label={c} count={n} checked={categories.has(c)} onToggle={() => toggle(categories, setCategories, c)} />
              ))}
            </div>
            <div className="border-t border-slate-100 pt-3 space-y-2 mb-4">
              {Object.entries(sizeCounts).map(([s, n]) => (
                <FilterCheck key={s} label={s} count={n} checked={sizes.has(s)} onToggle={() => toggle(sizes, setSizes, s)} />
              ))}
            </div>
            <div className="text-sm font-extrabold text-slate-900 mb-2">가격</div>
            <div className="flex flex-col items-start gap-1.5 mb-4">
              {PRICE_RANGES.map((r, i) => (
                <button
                  key={r.label}
                  onClick={() => setPriceIdx(priceIdx === i ? null : i)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    priceIdx === i ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button
              onClick={reset}
              className="w-full h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              <RotateCcw className="w-3.5 h-3.5" /> 필터 초기화
            </button>
          </aside>

          {/* 상품 그리드 */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">추천 스토어 상품</h2>
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600">
                추천순 <ChevronDown className="w-3.5 h-3.5" />
              </span>
            </div>
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center text-sm text-slate-500">
                조건에 맞는 상품이 없습니다. 필터를 초기화해 보세요.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((p) => (
                  <Link
                    key={p.id}
                    to={`${OREX_STORE.path}/${p.id}`}
                    className="relative rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-emerald-300 transition-colors flex flex-col"
                  >
                    <span className="absolute top-0 left-3 w-6 h-8 bg-rose-500 text-white text-[12px] font-black flex items-center justify-center [clip-path:polygon(0_0,100%_0,100%_100%,50%_78%,0_100%)] z-10">
                      {OREX_PRODUCTS.indexOf(p) + 1}
                    </span>
                    <div className="aspect-square bg-slate-50 flex items-center justify-center p-4">
                      <span className="text-xs text-slate-500 text-center break-keep leading-relaxed">{p.name}</span>
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                      <div className="text-[12px] text-slate-600 line-clamp-2 min-h-[2.1rem] mb-1.5">{p.name}</div>
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="text-[15px] font-black text-slate-900 tabular-nums">{p.price.toLocaleString()}원</span>
                        <span className="text-[12.5px] text-slate-500 tabular-nums">
                          (1개당 {Math.round(p.price / p.unitCount).toLocaleString()}원)
                        </span>
                      </div>
                      <div className="text-[12.5px] text-slate-500 mb-1">
                        배송비 {OREX_STORE.shippingFee.toLocaleString()}원 | {tomorrowLabel()} 도착 예정
                      </div>
                      <div className="text-[12.5px] font-bold text-amber-500 mb-2.5">
                        최대 {Math.round(p.price * OREX_STORE.earnRate).toLocaleString()}P 적립
                      </div>
                      <span className="mt-auto inline-flex items-center justify-center gap-1.5 h-9 rounded-lg bg-emerald-600 text-white text-[12px] font-bold">
                        <ShoppingCart className="w-3.5 h-3.5" /> 구매하기
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {/* 페이지네이션 (현재 1페이지) */}
            <div className="flex justify-center mt-6">
              <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white text-sm font-bold flex items-center justify-center">1</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FilterCheck({ label, count, checked, onToggle }: { label: string; count: number; checked: boolean; onToggle: () => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
      />
      <span className="text-xs text-slate-600 flex-1">{label}</span>
      <span className="text-[12px] text-slate-500 tabular-nums">{count}</span>
    </label>
  );
}

function countBy(values: string[]) {
  return values.reduce<Record<string, number>>((acc, v) => ((acc[v] = (acc[v] || 0) + 1), acc), {});
}
