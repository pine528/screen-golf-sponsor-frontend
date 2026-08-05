/**
 * 성장마켓 (/growth-market)
 *
 * 프로와 후원 브랜드가 팬을 대상으로 함께 운영하는 스토어를 모아 보여준다.
 * 스토어 목록은 큐레이션(`data/growthMarket.ts`), 상품은 미니스토어 API 실데이터를 쓴다.
 * 상품이 아직 등록되지 않은 스토어는 자리만 잡아 두고 준비중으로 표시한다
 * (임의 가격 노출 금지 — 개편 LEG-06).
 */
import { Link } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { ArrowRight, Box, CalendarClock, CreditCard, Percent, ShoppingCart, Store, Ticket } from 'lucide-react';
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

const STEP_ICONS = [Store, Ticket, CreditCard];

export function useStoreProducts() {
  const results = useQueries({
    queries: FAN_STORES.map((s) => ({
      queryKey: ['mini-store', s.slug],
      queryFn: () => api.getPublicMiniStore(s.slug!),
      enabled: !!s.slug,
      staleTime: 60_000,
    })),
  });
  return (i: number): any[] => (results[i]?.data as any)?.data?.products || [];
}

export default function GrowthMarket() {
  const productsOf = useStoreProducts();
  const allProducts = FAN_STORES.flatMap((s, i) => productsOf(i).map((p) => ({ ...p, store: s })));

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-5">
        <Breadcrumb className="mb-0" />
      </div>

      {/* ── 히어로 ── */}
      <section className="px-5 sm:px-8 pt-2 pb-8">
        <div className="max-w-7xl mx-auto rounded-3xl bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/40 border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,46%)] gap-6 items-center p-6 sm:p-10">
            <div className="min-w-0">
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold mb-5">
                프로 × 브랜드 협업 스토어
              </span>
              <h1 className="text-[26px] sm:text-4xl font-black tracking-tight text-slate-900 leading-[1.25] mb-4 break-keep">
                프로와 브랜드가 함께,
                <br />
                팬과 함께 <span className="text-emerald-600">성장하는 마켓</span>
              </h1>
              <p className="text-sm sm:text-[15px] text-slate-500 break-keep leading-relaxed mb-6">
                SPONPIK은 프로 선수와 스폰서 브랜드를 연결하여
                <br className="hidden sm:block" />
                팬만을 위한 특별한 상품, 혜택, AR 경험을 제공합니다.
              </p>

              <div className="flex flex-wrap gap-2">
                {BENEFITS.map((b) => (
                  <div key={b.title} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                    <b.icon className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="leading-tight">
                      <div className="text-[11px] font-bold text-slate-900 whitespace-nowrap">{b.title}</div>
                      <div className="text-[10px] text-slate-400 whitespace-nowrap">{b.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 선수 원본 사진 + 브랜드 로고 말풍선 */}
            <div className="relative min-h-[240px] sm:min-h-[300px]">
              <div className="flex items-end justify-center gap-1 sm:gap-2">
                {FAN_STORES.map((s, i) => (
                  <div key={s.brandName} className="relative flex-1 max-w-[150px]">
                    <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-white/60">
                      <img
                        src={s.heroImage}
                        alt={`${s.athleteName} 프로 × ${s.brandName}`}
                        className="w-full h-full object-cover object-[50%_18%]"
                      />
                    </div>
                    <div
                      className={`absolute -top-3 ${i % 2 === 0 ? '-left-2' : '-right-2'} h-11 px-3 rounded-2xl bg-white shadow-lg border border-slate-100 flex items-center`}
                    >
                      <img src={s.brandLogo} alt={s.brandName} className="max-h-6 max-w-[74px] object-contain" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 팬스토어 ── */}
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

      {/* ── 인기 상품 ── */}
      <section className="px-5 sm:px-8 pb-10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-4">인기 상품 미리보기</h2>
          {allProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {allProducts.slice(0, 12).map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
              <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">상품이 등록되면 이곳에 표시됩니다.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── 이용 방법 ── */}
      <section className="px-5 sm:px-8 pb-16">
        <div className="max-w-7xl mx-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <h2 className="text-lg font-extrabold text-slate-900 mb-6">이렇게 이용해요</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {HOW_TO_USE.map((h, i) => {
              const Icon = STEP_ICONS[i] || Store;
              return (
                <div key={h.title} className="flex items-center gap-4 flex-1">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-emerald-600" />
                      </div>
                      <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center tabular-nums">
                        {i + 1}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900">{h.title}</div>
                      <p className="text-xs text-slate-500 break-keep leading-relaxed">{h.desc}</p>
                    </div>
                  </div>
                  {i < HOW_TO_USE.length - 1 && (
                    <ArrowRight className="hidden sm:block w-5 h-5 text-slate-300 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

/** 팬스토어 카드 — 좌: 선수 사진 / 우: 브랜드·설명·혜택·CTA, 하단: 상품 스트립 */
export function StoreCard({ store, products }: { store: FanStore; products: any[] }) {
  const body = (
    <>
      <div className="flex gap-4 p-4">
        <div className="w-[38%] shrink-0 aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100">
          <img
            src={store.heroImage}
            alt={`${store.athleteName} 프로 × ${store.brandName}`}
            className="w-full h-full object-cover object-[50%_18%]"
            loading="lazy"
          />
        </div>

        <div className="min-w-0 flex flex-col flex-1">
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <span className="text-sm font-extrabold text-slate-900">{store.athleteName} 프로</span>
            <span className="text-slate-300 font-bold">×</span>
            <img src={store.brandLogo} alt={store.brandName} className="max-h-6 max-w-[92px] object-contain" />
          </div>
          <div className="text-[13px] font-extrabold text-slate-900 mb-1.5">팬 스토어</div>
          <p className="text-[11px] text-slate-500 break-keep leading-relaxed line-clamp-3 mb-3">{store.description}</p>

          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {store.benefit && (
              <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold">{store.benefit}</span>
            )}
            <span className="px-2 py-1 rounded-lg border border-slate-200 text-slate-500 text-[11px] font-bold">AR 보기</span>
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
      </div>

      {/* 상품 스트립 */}
      <div className="border-t border-slate-100 p-3 grid grid-cols-3 gap-2">
        {products.length > 0
          ? products.slice(0, 3).map((p: any) => <MiniProduct key={p.id} product={p} />)
          : [0, 1, 2].map((i) => (
              <div key={i} className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 aspect-[3/4] flex items-center justify-center">
                <span className="text-[10px] text-slate-400">상품 준비중</span>
              </div>
            ))}
      </div>
    </>
  );

  const cls = 'flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all';
  return store.slug ? (
    <Link to={`/store/brand/${store.slug}`} className={`${cls} hover:border-emerald-300 hover:shadow-sm`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function discountOf(product: any) {
  const price = Number(product.price ?? 0);
  const list = Number(product.listPrice ?? product.originalPrice ?? 0);
  return { price, list, off: list > price && list > 0 ? Math.round((1 - price / list) * 100) : 0 };
}

function MiniProduct({ product }: { product: any }) {
  const { price, off } = discountOf(product);
  return (
    <div className="rounded-xl border border-slate-100 bg-white overflow-hidden">
      <div className="relative aspect-square bg-slate-50">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-1.5" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-300">이미지 준비중</div>
        )}
        {off > 0 && (
          <span className="absolute top-1 left-1 px-1 py-0.5 rounded bg-rose-500 text-white text-[9px] font-black">{off}%</span>
        )}
      </div>
      <div className="px-1.5 py-1">
        <div className="text-[10px] text-slate-500 truncate">{product.name}</div>
        <div className="text-[11px] font-black text-slate-900 tabular-nums">{price.toLocaleString()}원</div>
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: any }) {
  const { price, list, off } = discountOf(product);
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
        <div className="mt-1.5 inline-flex items-center justify-center gap-1 w-full h-7 rounded-lg border border-emerald-200 text-emerald-700 text-[11px] font-bold">
          <ShoppingCart className="w-3 h-3" /> 구매하기
        </div>
      </div>
    </Link>
  );
}
