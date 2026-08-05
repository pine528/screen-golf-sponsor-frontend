/**
 * 호이베이커리 팬스토어 — 전체 상품 목록 (/fan-store/hoi-bakery/products)
 * 사용자 제공 시안 기준: [히어로 바] [좌: 카테고리·가격·배송 유형 필터] [우: 상품 그리드]
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, ChevronDown, Ticket } from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import Breadcrumb from '../../components/Breadcrumb';
import { HOI_PRODUCTS, HOI_STORE, type HoiShipping } from '../../data/hoiStore';
import { HoiProductCard } from './FanStoreHoi';

const PRICE_RANGES = [
  { label: '~ 1만원', min: 0, max: 10000 },
  { label: '1만원 ~ 2만원', min: 10000, max: 20000 },
  { label: '2만원 ~ 3만원', min: 20000, max: 30000 },
  { label: '3만원 이상', min: 30000, max: Infinity },
];

const SHIPPING_TYPES: HoiShipping[] = ['상온 배송', '냉장 배송', '냉동 배송'];

export default function FanStoreHoiProducts() {
  const [categories, setCategories] = useState<Set<string>>(new Set());
  const [priceIdx, setPriceIdx] = useState<number | null>(null);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [shipping, setShipping] = useState<Set<string>>(new Set());

  const categoryCounts = useMemo(
    () =>
      HOI_PRODUCTS.reduce<Record<string, number>>((acc, p) => ((acc[p.category] = (acc[p.category] || 0) + 1), acc), {}),
    [],
  );

  const filtered = HOI_PRODUCTS.filter((p) => {
    if (categories.size > 0 && !categories.has(p.category)) return false;
    if (priceIdx !== null) {
      const r = PRICE_RANGES[priceIdx];
      if (p.price < r.min || p.price >= r.max) return false;
    }
    const min = Number(minPrice);
    const max = Number(maxPrice);
    if (minPrice && p.price < min) return false;
    if (maxPrice && p.price > max) return false;
    if (shipping.size > 0 && !shipping.has(p.shipping)) return false;
    return true;
  });

  const toggleCategory = (c: string) => {
    const next = new Set(categories);
    next.has(c) ? next.delete(c) : next.add(c);
    setCategories(next);
  };
  const toggleShipping = (s: string) => {
    const next = new Set(shipping);
    next.has(s) ? next.delete(s) : next.add(s);
    setShipping(next);
  };

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-5">
        <Breadcrumb className="mb-0" />
      </div>

      {/* ── 히어로 바 ── */}
      <section className="px-5 sm:px-8 pt-2 pb-6">
        <div className="max-w-7xl mx-auto rounded-2xl bg-gradient-to-r from-amber-50/70 to-emerald-50/40 border border-amber-100/80 overflow-hidden flex items-center">
          <div className="flex-1 min-w-0 p-5 sm:p-6">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mb-3 break-keep">
              {HOI_STORE.athleteName} 프로 × {HOI_STORE.brandName} 팬스토어
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <img src={HOI_STORE.brandLogo} alt={HOI_STORE.brandName} className="h-9 object-contain mr-1" />
              <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                <Ticket className="w-4 h-4 text-emerald-700 shrink-0" />
                <div className="leading-tight">
                  <div className="text-[10px] text-slate-400">팬 할인코드</div>
                  <div className="text-[12px] font-black text-slate-900 tracking-wide">{HOI_STORE.fanCode}</div>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                <span className="w-4 h-4 rounded-full bg-emerald-700 text-white text-[9px] font-black flex items-center justify-center shrink-0">P</span>
                <div className="leading-tight">
                  <div className="text-[12px] font-bold text-slate-900">팬포인트</div>
                  <div className="text-[10px] text-slate-400">사용 가능</div>
                </div>
              </div>
              <Link
                to={`${HOI_STORE.path}/ar`}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 hover:border-emerald-300 transition-colors"
              >
                <Box className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="leading-tight">
                  <div className="text-[12px] font-bold text-slate-900">선수 AR 이미지</div>
                  <div className="text-[10px] text-slate-400">보기</div>
                </div>
              </Link>
            </div>
          </div>
          <div className="relative w-[24%] max-w-[240px] shrink-0 hidden sm:block self-stretch overflow-hidden">
            <img
              src={HOI_STORE.athletePhoto}
              alt={`${HOI_STORE.athleteName} 프로`}
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
          </div>
        </div>
      </section>

      {/* ── 필터 + 상품 그리드 ── */}
      <section className="px-5 sm:px-8 pb-16">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 items-start">
          <aside className="w-full lg:w-[230px] shrink-0 rounded-2xl border border-slate-200 p-4">
            <div className="text-sm font-extrabold text-slate-900 mb-3">카테고리</div>
            <div className="space-y-2 mb-5">
              {Object.entries(categoryCounts).map(([c, n]) => (
                <label key={c} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={categories.has(c)}
                    onChange={() => toggleCategory(c)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-600 flex-1">{c}</span>
                  <span className="text-[11px] text-slate-400 tabular-nums">{n}</span>
                </label>
              ))}
            </div>

            <div className="text-sm font-extrabold text-slate-900 mb-2">가격</div>
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              {PRICE_RANGES.map((r, i) => (
                <button
                  key={r.label}
                  onClick={() => setPriceIdx(priceIdx === i ? null : i)}
                  className={`px-2 py-1.5 rounded-lg border text-[11px] font-medium transition-colors ${
                    priceIdx === i ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 mb-5">
              <input
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value.replace(/\D/g, ''))}
                placeholder="최소"
                className="w-full h-8 px-2 rounded-lg border border-slate-200 text-[11px] text-right tabular-nums focus:outline-none focus:border-emerald-400"
              />
              <span className="text-slate-300 text-xs shrink-0">~</span>
              <input
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ''))}
                placeholder="최대"
                className="w-full h-8 px-2 rounded-lg border border-slate-200 text-[11px] text-right tabular-nums focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="text-sm font-extrabold text-slate-900 mb-2">배송 유형</div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={shipping.size === 0}
                  onChange={() => setShipping(new Set())}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-600">전체</span>
              </label>
              {SHIPPING_TYPES.map((s) => (
                <label key={s} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={shipping.has(s)}
                    onChange={() => toggleShipping(s)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-600">{s}</span>
                </label>
              ))}
            </div>
          </aside>

          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                추천 스토어 상품 <span className="text-emerald-700 tabular-nums">{filtered.length}</span>
              </h2>
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600">
                추천순 <ChevronDown className="w-3.5 h-3.5" />
              </span>
            </div>
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center text-sm text-slate-500">
                조건에 맞는 상품이 없습니다. 필터를 조정해 보세요.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((p) => (
                  <HoiProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
