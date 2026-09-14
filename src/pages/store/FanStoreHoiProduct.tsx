/**
 * 호이베이커리 팬스토어 상품 상세 (/fan-store/hoi-bakery/:productId) — 사용자 제공 시안 기준
 *
 * [좌: 상품 이미지] [중: 선수·브랜드 협업 카드] [우: 가격·팬 코드 할인액·결제·수량·CTA]
 * [팬 코드/적립/배송 타일] [상품 설명 + 해시태그 | 함께 보면 좋은 상품]
 *
 * 전시용 — 구매/장바구니는 "오픈 준비 중" 안내.
 */
import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, ChevronRight, Coins, Minus, Percent, Plus, ShieldCheck, Truck } from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import Breadcrumb from '../../components/Breadcrumb';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { HOI_PRODUCTS, HOI_STORE, findHoiProduct } from '../../data/hoiStore';

export default function FanStoreHoiProduct() {
  const { productId } = useParams();
  const product = findHoiProduct(productId);

  const { isAuthenticated } = useAuth();
  const { data: pointData } = useQuery({
    queryKey: ['my-point-balance'],
    queryFn: () => api.getMyPointBalance(),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const balance = (pointData as any)?.data?.balance;

  const [qty, setQty] = useState(1);
  const [payMethod, setPayMethod] = useState(0);
  const [notice, setNotice] = useState(false);

  if (!product) return <Navigate to={`${HOI_STORE.path}/products`} replace />;

  const off = Math.round((1 - product.price / product.listPrice) * 100);
  /* 시안 기준: 팬 코드 할인액은 정가 기준으로 표기 (36,000원 → -3,600원) */
  const codeDiscount = Math.round((product.listPrice * HOI_STORE.fanDiscountPct) / 100);
  const others = HOI_PRODUCTS.filter((p) => p.id !== product.id).slice(0, 4);

  const comingSoon = () => {
    setNotice(true);
    setTimeout(() => setNotice(false), 2500);
  };

  return (
    <div className="min-h-screen bg-white pb-16 lg:pb-0">
      <PublicHeader />
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-5">
        <Breadcrumb className="mb-0" title={product.name} />
      </div>

      {/* ── 상단 3컬럼 ── */}
      <section className="px-5 sm:px-8 pt-2 pb-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,38%)_minmax(0,24%)_minmax(0,1fr)] gap-4 items-stretch">
          {/* 좌: 상품 이미지 */}
          <div className="relative rounded-2xl border border-slate-200 bg-amber-50/50 min-h-[320px] flex items-center justify-center p-8">
            <span className="text-sm text-slate-500 text-center break-keep leading-relaxed">
              {product.name}
              <br />
              (상품 이미지 준비중)
            </span>
          </div>

          {/* 중: 협업 카드 */}
          <div className="rounded-2xl border border-slate-200 p-4 flex flex-col items-center text-center">
            <span className="px-3 py-1 rounded-full border border-emerald-700 text-emerald-800 text-[12px] font-bold mb-3">
              선수·브랜드 협업 상품
            </span>
            <div className="w-full aspect-[4/5] rounded-xl overflow-hidden bg-slate-50 mb-3">
              <img src={HOI_STORE.athletePhoto} alt={`${HOI_STORE.athleteName} 프로`} className="w-full h-full object-cover object-top" />
            </div>
            <div className="text-[14px] font-extrabold text-slate-900 mb-2">{HOI_STORE.athleteName} 프로</div>
            <span className="text-slate-300 font-bold mb-2">×</span>
            <img src={HOI_STORE.brandLogo} alt={HOI_STORE.brandName} className="h-10 object-contain mb-2" />
            <p className="text-[12px] font-bold text-slate-600 break-keep leading-relaxed">좋은 기운을 굽는 빵집,<br />{HOI_STORE.brandName}</p>
            <Link
              to={`${HOI_STORE.path}/ar`}
              className="mt-auto pt-3 w-full h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-700 text-emerald-800 text-[12px] font-bold hover:bg-emerald-50"
            >
              <Box className="w-4 h-4" /> AR 보기
            </Link>
          </div>

          {/* 우: 가격·결제 */}
          <div className="rounded-2xl border border-slate-200 p-5 flex flex-col">
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 break-keep mb-1">{product.name}</h1>
            <div className="text-[12px] text-slate-500 mb-3">
              {HOI_STORE.athleteName} 프로 × {HOI_STORE.brandName}
            </div>
            <div className="text-[13px] text-slate-500 line-through tabular-nums">{product.listPrice.toLocaleString()}원</div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[26px] font-black text-emerald-800 tabular-nums">{product.price.toLocaleString()}원</span>
              {off > 0 && <span className="px-1.5 py-0.5 rounded-md bg-emerald-700 text-white text-[12px] font-black">{off}%</span>}
            </div>

            {/* 팬 전용 할인 */}
            <div className="flex items-center rounded-xl border border-emerald-200 bg-emerald-50/50 px-3 py-2.5 mb-3 gap-2 flex-wrap">
              <span className="text-[12px] font-bold text-slate-500">팬 전용 할인</span>
              <span className="px-2 py-1 rounded-lg border border-emerald-300 bg-white font-black text-slate-900 text-[12px] tracking-wide">
                {HOI_STORE.fanCode}
              </span>
              <span className="text-[12px] text-slate-500">{HOI_STORE.fanDiscountPct}% 팬 할인 적용</span>
              <span className="ml-auto text-[13px] font-black text-emerald-700 tabular-nums">-{codeDiscount.toLocaleString()}원</span>
            </div>

            {/* 보유 팬포인트 */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 mb-3">
              <span className="text-[12px] font-bold text-slate-600">보유 팬포인트</span>
              <span className="text-[13px] font-black text-slate-900 tabular-nums">
                {typeof balance === 'number' ? `${balance.toLocaleString()}P` : '로그인 후 확인'}
              </span>
            </div>

            {/* 결제 수단 */}
            <div className="text-[12px] font-bold text-slate-700 mb-1.5">결제 수단 선택</div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { t: '팬포인트', d: typeof balance === 'number' ? `${balance.toLocaleString()}P 사용 가능` : '로그인 후 사용' },
                { t: 'SPON Pay', d: '간편결제' },
                { t: '일반결제', d: '카드 / 간편결제' },
              ].map((m, i) => (
                <button
                  key={m.t}
                  onClick={() => setPayMethod(i)}
                  className={`rounded-xl border px-2 py-2.5 text-center transition-colors ${
                    payMethod === i ? 'border-emerald-700 bg-emerald-50/50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-[12px] font-extrabold text-slate-900">{m.t}</div>
                  <div className="text-[9px] text-slate-500 truncate">{m.d}</div>
                </button>
              ))}
            </div>

            {/* 수량 */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[12px] font-bold text-slate-700">수량</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center font-bold tabular-nums">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* CTA */}
            <div className="grid grid-cols-2 gap-2 mt-auto">
              <button onClick={comingSoon} className="h-11 rounded-xl bg-emerald-700 text-white text-[13px] font-bold hover:bg-emerald-800">
                팬 할인가로 구매
              </button>
              <button onClick={comingSoon} className="h-11 rounded-xl border border-emerald-700 text-emerald-800 text-[13px] font-bold hover:bg-emerald-50">
                장바구니 담기
              </button>
            </div>
            <p className="text-[12px] text-slate-500 mt-2 inline-flex items-center gap-1">
              {notice ? (
                <span className="font-bold text-emerald-700">정식 오픈 준비 중입니다. 곧 구매하실 수 있어요.</span>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" /> 안전하고 간편한 결제 | SPONPIK 구매 보호 정책
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* ── 안내 타일 + 추천 상품 ── */}
      <section className="px-5 sm:px-8 pb-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,44%)_minmax(0,1fr)] gap-4 items-start">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 grid grid-cols-3 divide-x divide-slate-100 overflow-hidden">
              <MiniTile icon={Percent} title={`팬 코드 ${HOI_STORE.fanDiscountPct}%`} desc={HOI_STORE.fanCode} />
              <MiniTile icon={Coins} title={`구매 적립 ${Math.round(HOI_STORE.earnRate * 100)}%`} desc="팬포인트 적립" />
              <MiniTile
                icon={Truck}
                title={`배송 ${HOI_STORE.shippingFee.toLocaleString()}원`}
                desc={`${HOI_STORE.freeShippingOver.toLocaleString()}원 이상 무료배송`}
              />
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <h2 className="text-sm font-extrabold text-slate-900 mb-3">상품 설명</h2>
              <p className="text-[13px] text-slate-600 break-keep leading-relaxed mb-4">{product.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {product.hashtags.map((h) => (
                  <span key={h} className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[12px] font-bold text-slate-500">
                    {h}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-extrabold text-slate-900">함께 보면 좋은 상품</h2>
              <Link to={`${HOI_STORE.path}/products`} className="inline-flex items-center gap-0.5 text-[12px] font-bold text-slate-500 hover:text-slate-900">
                전체보기 <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {others.map((p) => {
                const pOff = Math.round((1 - p.price / p.listPrice) * 100);
                return (
                  <Link key={p.id} to={`${HOI_STORE.path}/${p.id}`} className="rounded-2xl border border-slate-200 overflow-hidden hover:border-emerald-300 transition-colors">
                    <div className="relative aspect-square bg-amber-50/50 flex items-center justify-center p-3">
                      <span className="text-[12.5px] text-slate-500 text-center break-keep leading-relaxed">{p.name}</span>
                    </div>
                    <div className="p-2.5">
                      <div className="text-[12px] text-slate-600 line-clamp-2 min-h-[2rem] mb-1">{p.name}</div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[13px] font-black text-emerald-800 tabular-nums">{p.price.toLocaleString()}원</span>
                        {pOff > 0 && (
                          <span className="px-1 py-0.5 rounded bg-emerald-700 text-white text-[9px] font-black">{pOff}%</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 모바일 하단 고정 구매 바 (모바일 전면 개편) */}
      <div className="lg:hidden fixed bottom-14 inset-x-0 z-40 bg-white border-t border-slate-200 px-4 py-2.5 flex items-center gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <div className="min-w-0 flex-1">
          <div className="text-[12px] text-slate-500 truncate">{product.name}</div>
          <div className="text-sm font-extrabold text-emerald-800 tabular-nums">{product.price.toLocaleString()}원</div>
        </div>
        <button onClick={comingSoon} className="shrink-0 h-10 px-4 rounded-xl bg-emerald-700 text-white text-sm font-bold">
          팬 할인가로 구매
        </button>
      </div>
    </div>
  );
}

function MiniTile({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-3 py-4 text-center">
      <Icon className="w-5 h-5 text-emerald-700 mb-0.5" />
      <div className="text-[12px] font-extrabold text-slate-900 break-keep">{title}</div>
      <div className="text-[12.5px] text-slate-500 break-keep">{desc}</div>
    </div>
  );
}
