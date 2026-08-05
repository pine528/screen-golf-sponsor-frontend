/**
 * 성장마켓 (/growth-market)
 *
 * 프로와 후원 브랜드가 팬을 대상으로 함께 운영하는 스토어를 모아 보여준다.
 * 스토어 목록은 큐레이션(`data/growthMarket.ts`), 상품은 미니스토어 API 실데이터를 쓴다.
 * 상품이 아직 등록되지 않은 스토어는 상품 영역을 비워 두고 준비중으로 표시한다.
 */
import { Link } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { ArrowRight, Box, CalendarClock, CreditCard, Percent, Ticket } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import Breadcrumb from '../components/Breadcrumb';
import { api } from '../services/api';
import { FAN_STORES, HOW_TO_USE, type FanStore } from '../data/growthMarket';

const BENEFITS = [
  { icon: Ticket, title: '할인코드', desc: '전용 할인 제공' },
  { icon: Percent, title: '팬포인트', desc: '사용 가능' },
  { icon: CreditCard, title: 'SPON Pay', desc: '일반결제도 가능' },
  { icon: CalendarClock, title: '기간 한정 혜택', desc: '놓치지 마세요' },
  { icon: Box, title: '선수 AR 이미지', desc: '확인 가능' },
];

export default function GrowthMarket() {
  // slug가 있는 스토어만 상품을 조회한다
  const results = useQueries({
    queries: FAN_STORES.map((s) => ({
      queryKey: ['mini-store', s.slug],
      queryFn: () => api.getPublicMiniStore(s.slug!),
      enabled: !!s.slug,
      staleTime: 60_000,
    })),
  });

  const productsOf = (i: number): any[] => (results[i]?.data as any)?.data?.products || [];
  const allProducts = FAN_STORES.flatMap((s, i) => productsOf(i).map((p) => ({ ...p, store: s })));

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-5">
        <Breadcrumb className="mb-0" />
      </div>

      {/* 히어로 */}
      <section className="px-5 sm:px-8 pt-6 pb-10">
        <div className="max-w-7xl mx-auto rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-white p-6 sm:p-10 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold mb-4">
                프로 × 브랜드 협업 스토어
              </span>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 leading-tight mb-3 break-keep">
                프로와 브랜드가 함께,
                <br />
                팬과 함께 <span className="text-emerald-600">성장하는 마켓</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-500 break-keep max-w-xl">
                SPONPIK은 프로 선수와 스폰서 브랜드를 연결하여 팬만을 위한 특별한 상품과 혜택을 제공합니다.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-6">
                {BENEFITS.map((b) => (
                  <div key={b.title} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                    <b.icon className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-slate-900 truncate">{b.title}</div>
                      <div className="text-[10px] text-slate-400 truncate">{b.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 협업 브랜드 로고 — 원본 그대로 */}
            <div className="flex lg:flex-col items-center justify-center gap-3">
              {FAN_STORES.map((s) => (
                <div key={s.brandName} className="h-16 w-36 rounded-2xl bg-white border border-slate-200 flex items-center justify-center px-3">
                  <img src={s.brandLogo} alt={s.brandName} className="max-h-9 max-w-full object-contain" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 팬스토어 */}
      <section className="px-5 sm:px-8 pb-10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-4">지금 만나볼 팬스토어</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {FAN_STORES.map((s, i) => (
              <StoreCard key={s.athleteName + s.brandName} store={s} products={productsOf(i)} />
            ))}
          </div>
        </div>
      </section>

      {/* 인기 상품 — 실제 등록된 상품이 있을 때만 */}
      {allProducts.length > 0 && (
        <section className="px-5 sm:px-8 pb-10">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-4">인기 상품 미리보기</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {allProducts.slice(0, 12).map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 이용 방법 */}
      <section className="px-5 sm:px-8 pb-16">
        <div className="max-w-7xl mx-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="text-lg font-extrabold text-slate-900 mb-5">이렇게 이용해요</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {HOW_TO_USE.map((h, i) => (
              <div key={h.title} className="flex items-start gap-3">
                <span className="w-8 h-8 shrink-0 rounded-full bg-emerald-50 text-emerald-600 text-sm font-black inline-flex items-center justify-center tabular-nums">
                  {i + 1}
                </span>
                <div>
                  <div className="text-sm font-bold text-slate-900">{h.title}</div>
                  <p className="text-xs text-slate-500 break-keep leading-relaxed">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function StoreCard({ store, products }: { store: FanStore; products: any[] }) {
  const inner = (
    <>
      <div className="relative">
        {/* 선수 원본 사진 + 가슴 브랜드 패치 */}
        <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
          <img src={store.heroImage} alt={`${store.athleteName} × ${store.brandName}`} className="w-full h-full object-cover object-[50%_20%]" loading="lazy" />
        </div>
        <div className="absolute top-3 right-3 h-10 px-3 rounded-xl bg-white/95 backdrop-blur border border-slate-200 flex items-center">
          <img src={store.brandLogo} alt={store.brandName} className="max-h-6 max-w-[92px] object-contain" />
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="text-base font-extrabold text-slate-900 mb-1">
          {store.athleteName} 프로 <span className="text-slate-400 font-bold">×</span> {store.brandName} 팬 스토어
        </div>
        <p className="text-xs text-slate-500 break-keep leading-relaxed mb-3 line-clamp-2">{store.description}</p>

        <div className="flex items-center gap-1.5 mb-3">
          {store.benefit && (
            <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold">{store.benefit}</span>
          )}
          <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-500 text-[11px] font-bold">
            상품 {products.length}개
          </span>
        </div>

        <span
          className={`mt-auto inline-flex items-center justify-center gap-1 h-10 rounded-xl text-sm font-bold ${
            store.slug ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
          }`}
        >
          {store.slug ? '스토어 보기' : '오픈 준비 중'}
          {store.slug && <ArrowRight className="w-4 h-4" />}
        </span>
      </div>
    </>
  );

  const cls = 'flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all';
  return store.slug ? (
    <Link to={`/store/brand/${store.slug}`} className={`${cls} hover:border-emerald-300 hover:shadow-sm`}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

function ProductCard({ product }: { product: any }) {
  const price = Number(product.price ?? 0);
  const list = Number(product.listPrice ?? product.originalPrice ?? 0);
  const off = list > price && list > 0 ? Math.round((1 - price / list) * 100) : 0;
  return (
    <Link
      to={product.store?.slug ? `/store/brand/${product.store.slug}/product/${product.id}` : '#'}
      className="rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-emerald-300 transition-colors"
    >
      <div className="relative aspect-square bg-slate-50">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-2" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">이미지 준비중</div>
        )}
        {off > 0 && (
          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-rose-500 text-white text-[10px] font-black">{off}%</span>
        )}
      </div>
      <div className="p-2.5">
        <div className="text-[11px] text-slate-600 line-clamp-2 min-h-[2rem] mb-1">{product.name}</div>
        {list > price && <div className="text-[10px] text-slate-400 line-through">{list.toLocaleString()}원</div>}
        <div className="text-sm font-black text-slate-900 tabular-nums">{price.toLocaleString()}원</div>
      </div>
    </Link>
  );
}
