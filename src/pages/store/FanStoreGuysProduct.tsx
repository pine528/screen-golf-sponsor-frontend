/**
 * the GUYS 팬스토어 상품 상세 (/fan-store/the-guys/:productId) — 사용자 제공 시안 기준
 *
 * [좌: 상품 이미지(BEST/한정판)] [중: 브랜드 카드(로고+선수+인용구)] [우: 팬 할인가·코드·결제·사이즈·수량·CTA]
 * [안내 타일 5종] [상품 설명 + 해시태그 | 함께 보면 좋은 추천 상품]
 *
 * 전시용 — 구매/장바구니는 "오픈 준비 중" 안내.
 */
import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, ChevronRight, Coins, Gift, Heart, Minus, Percent, Plus, UserRound } from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import Breadcrumb from '../../components/Breadcrumb';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { GUYS_PRODUCTS, GUYS_STORE, findGuysProduct } from '../../data/guysStore';

export default function FanStoreGuysProduct() {
  const { productId } = useParams();
  const product = findGuysProduct(productId);

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
  const [size, setSize] = useState(0);
  const [notice, setNotice] = useState(false);

  if (!product) return <Navigate to={GUYS_STORE.path} replace />;

  const finalPrice = product.fanPrice ?? product.price;
  const base = product.listPrice ?? (product.fanPrice ? product.price : undefined);
  const off = base && base > finalPrice ? Math.round((1 - finalPrice / base) * 100) : 0;
  const others = GUYS_PRODUCTS.filter((p) => p.id !== product.id).slice(0, 5);

  const comingSoon = () => {
    setNotice(true);
    setTimeout(() => setNotice(false), 2500);
  };

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-5">
        <Breadcrumb className="mb-0" title={product.name} />
      </div>

      {/* ── 상단 3컬럼 ── */}
      <section className="px-5 sm:px-8 pt-2 pb-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,38%)_minmax(0,24%)_minmax(0,1fr)] gap-4 items-stretch">
          {/* 좌: 상품 이미지 */}
          <div className="relative rounded-2xl border border-slate-200 bg-slate-50 min-h-[320px] flex items-center justify-center p-8">
            <span className="absolute top-4 left-4 px-2 py-1 rounded-md bg-slate-900 text-white text-[10px] font-black">
              {product.limited ? '한정판' : 'BEST'}
            </span>
            <span className="text-sm text-slate-400 text-center break-keep leading-relaxed">
              {product.name}
              <br />
              (상품 이미지 준비중)
            </span>
            <button className="absolute top-4 right-4 w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-rose-500">
              <Heart className="w-4 h-4" />
            </button>
          </div>

          {/* 중: 브랜드 카드 */}
          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50/60 to-white p-4 flex flex-col items-center text-center">
            <img src={GUYS_STORE.brandLogo} alt={GUYS_STORE.brandName} className="h-9 object-contain mb-1" />
            <div className="text-[11px] text-slate-400 mb-2">× {GUYS_STORE.athleteName} 프로</div>
            <div className="w-full aspect-[4/5] rounded-xl overflow-hidden bg-white mb-3">
              <img src={GUYS_STORE.athletePhoto} alt={`${GUYS_STORE.athleteName} 프로`} className="w-full h-full object-cover object-top" />
            </div>
            <p className="text-[12px] font-bold text-slate-700 break-keep leading-relaxed">{GUYS_STORE.quote}</p>
            <Link
              to={`${GUYS_STORE.path}/ar`}
              className="mt-auto pt-3 w-full h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-600 text-emerald-700 text-[12px] font-bold hover:bg-emerald-50"
            >
              <Box className="w-4 h-4" /> AR 보기
            </Link>
          </div>

          {/* 우: 가격·결제 */}
          <div className="rounded-2xl border border-slate-200 p-5 flex flex-col">
            {product.limited && (
              <span className="self-start px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold mb-2">
                팬 스토어 · 한정판
              </span>
            )}
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 break-keep mb-1">{product.name}</h1>
            <div className="text-[12px] text-slate-400 mb-3">
              {GUYS_STORE.athleteName} 프로 × {GUYS_STORE.brandName}
            </div>
            {base && base > finalPrice && (
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-slate-400 line-through tabular-nums">{base.toLocaleString()}원</span>
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[11px] font-black">{off}%</span>
              </div>
            )}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[26px] font-black text-slate-900 tabular-nums">{finalPrice.toLocaleString()}원</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold">팬 할인가</span>
            </div>

            {/* 할인코드 + 팬포인트 */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="rounded-xl border border-slate-200 px-3 py-2.5">
                <div className="text-[11px] text-slate-400 mb-0.5">팬 할인코드</div>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[11px] font-black tracking-wide">{GUYS_STORE.fanCode}</span>
                  <span className="text-[11px] font-bold text-emerald-700">{GUYS_STORE.fanDiscountPct}%</span>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 px-3 py-2.5">
                <div className="text-[11px] text-slate-400 mb-0.5">보유 팬포인트</div>
                <div className="text-[13px] font-black text-slate-900 tabular-nums">
                  {typeof balance === 'number' ? `${balance.toLocaleString()}P` : '로그인 후 확인'}
                </div>
              </div>
            </div>

            {/* 결제 수단 */}
            <div className="text-[12px] font-bold text-slate-700 mb-1.5">결제 수단</div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {['팬포인트', 'SPON Pay', '일반결제'].map((m, i) => (
                <button
                  key={m}
                  onClick={() => setPayMethod(i)}
                  className={`rounded-xl border px-2 py-2.5 text-[12px] font-extrabold transition-colors ${
                    payMethod === i ? 'border-emerald-600 bg-emerald-50/50 text-slate-900' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* 사이즈 */}
            {product.sizes && (
              <>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] font-bold text-slate-700">사이즈</span>
                  <span className="text-[11px] text-slate-400">사이즈 가이드 ›</span>
                </div>
                <div className="flex gap-2 mb-4">
                  {product.sizes.map((s, i) => (
                    <button
                      key={s}
                      onClick={() => setSize(i)}
                      className={`w-11 h-9 rounded-lg border text-[12px] font-bold transition-colors ${
                        size === i ? 'border-emerald-600 bg-emerald-50/50 text-slate-900' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* 수량 + 적립 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold text-slate-700 mr-1">수량</span>
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center font-bold tabular-nums">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-[12px] text-slate-500">
                예상 적립 포인트{' '}
                <span className="font-black text-emerald-700 tabular-nums">
                  {Math.floor(finalPrice * qty * GUYS_STORE.earnRate).toLocaleString()}P ({Math.round(GUYS_STORE.earnRate * 100)}%)
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="grid grid-cols-2 gap-2 mt-auto">
              <button onClick={comingSoon} className="h-11 rounded-xl bg-emerald-600 text-white text-[13px] font-bold hover:bg-emerald-700">
                팬 할인가로 구매 →
              </button>
              <button onClick={comingSoon} className="h-11 rounded-xl border border-emerald-600 text-emerald-700 text-[13px] font-bold hover:bg-emerald-50">
                장바구니 담기
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              {notice ? (
                <span className="font-bold text-emerald-700">정식 오픈 준비 중입니다. 곧 구매하실 수 있어요.</span>
              ) : (
                '상품은 결제 완료 후 5~7영업일 이내 발송됩니다.'
              )}
            </p>
          </div>
        </div>
      </section>

      {/* ── 안내 타일 ── */}
      <section className="px-5 sm:px-8 pb-6">
        <div className="max-w-7xl mx-auto rounded-2xl border border-slate-200 grid grid-cols-2 lg:grid-cols-5 divide-x divide-y lg:divide-y-0 divide-slate-100 overflow-hidden">
          <InfoTile icon={Percent} title={`팬 할인코드 ${GUYS_STORE.fanDiscountPct}%`} desc={`${GUYS_STORE.fanCode} 코드로 ${GUYS_STORE.fanDiscountPct}% 할인`} />
          <InfoTile icon={Coins} title={`구매 적립 ${Math.round(GUYS_STORE.earnRate * 100)}%`} desc={`구매 금액의 ${Math.round(GUYS_STORE.earnRate * 100)}% 팬포인트 적립`} />
          <InfoTile icon={Gift} title={product.limited ? '한정 혜택' : '한정 수량'} desc={product.limited ? '협업 패키지 전용 포토카드 3종 증정' : '콜라보 한정 수량으로 소장 가치 UP'} />
          <InfoTile icon={UserRound} title="선수 응원 포인트 적립" desc={`구매 금액의 ${GUYS_STORE.athleteEarnPct}%가 선수에게 적립`} />
          <Link to={`${GUYS_STORE.path}/ar`} className="hover:bg-slate-50 transition-colors">
            <InfoTile icon={Box} title="AR 이미지 체험" desc="선수 착용 컷을 모바일로 AR로 확인하세요" chevron />
          </Link>
        </div>
      </section>

      {/* ── 상품 설명 + 추천 상품 ── */}
      <section className="px-5 sm:px-8 pb-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,34%)_minmax(0,1fr)] gap-4 items-start">
          <div className="rounded-2xl border border-slate-200 p-5">
            <h2 className="text-sm font-extrabold text-slate-900 mb-3">상품 설명</h2>
            <p className="text-[13px] text-slate-600 break-keep leading-relaxed mb-3">{product.description}</p>
            {product.bullets && (
              <ul className="space-y-1.5 mb-4">
                {product.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-[12px] text-slate-500">
                    <span className="w-1 h-1 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-1.5">
              {product.hashtags.map((h) => (
                <span key={h} className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-500">
                  {h}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-extrabold text-slate-900">함께 보면 좋은 추천 상품</h2>
              <Link to={GUYS_STORE.path} className="inline-flex items-center gap-0.5 text-[12px] font-bold text-slate-500 hover:text-slate-900">
                더보기 <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {others.map((p) => {
                const pOff = p.listPrice ? Math.round((1 - p.price / p.listPrice) * 100) : 0;
                return (
                  <Link key={p.id} to={`${GUYS_STORE.path}/${p.id}`} className="rounded-2xl border border-slate-200 overflow-hidden hover:border-emerald-300 transition-colors">
                    <div className="relative aspect-square bg-slate-50 flex items-center justify-center p-3">
                      <span className="text-[10px] text-slate-400 text-center break-keep leading-relaxed">{p.name}</span>
                      {p.isNew && <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black">NEW</span>}
                      {pOff > 0 && <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black">{pOff}%</span>}
                    </div>
                    <div className="p-2.5">
                      <div className="text-[11px] text-slate-600 line-clamp-2 min-h-[2rem] mb-1">{p.name}</div>
                      {p.listPrice && <div className="text-[10px] text-slate-400 line-through tabular-nums">{p.listPrice.toLocaleString()}원</div>}
                      <div className="text-[13px] font-black text-slate-900 tabular-nums">{p.price.toLocaleString()}원</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoTile({ icon: Icon, title, desc, chevron = false }: { icon: any; title: string; desc: string; chevron?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-emerald-600" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-extrabold text-slate-900 break-keep">{title}</div>
        <div className="text-[11px] text-slate-400 break-keep">{desc}</div>
      </div>
      {chevron && <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />}
    </div>
  );
}
