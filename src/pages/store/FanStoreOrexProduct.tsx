/**
 * OREX 팬스토어 상품 상세 (/fan-store/orex/:productId) — 사용자 제공 시안 기준
 *
 * [좌: 상품 이미지] [중: 선수·브랜드 협업 카드] [우: 가격·할인코드·결제·CTA]
 * [팬 코드/적립/배송/스토리 안내 타일] [상품 설명 | 함께 보면 좋은 상품]
 *
 * 전시용 카탈로그 — 구매/장바구니는 상품 등록 전이라 "오픈 준비 중" 안내만 한다.
 */
import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, Check, ChevronRight, Coins, Copy, Heart, Minus, Package, Percent, Plus, Truck } from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import Breadcrumb from '../../components/Breadcrumb';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { OREX_PRODUCTS, OREX_STORE, findOrexProduct } from '../../data/orexStore';

export default function FanStoreOrexProduct() {
  const { productId } = useParams();
  const product = findOrexProduct(productId);

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
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState(false);

  if (!product) return <Navigate to={OREX_STORE.path} replace />;

  const off = product.listPrice ? Math.round((1 - product.price / product.listPrice) * 100) : 0;
  const others = OREX_PRODUCTS.filter((p) => p.id !== product.id).slice(0, 4);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(OREX_STORE.fanCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard 미지원 브라우저 — 코드가 화면에 보이므로 무시 */
    }
  };
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
          <div className="relative rounded-2xl border border-slate-200 bg-slate-50 min-h-[320px] flex items-center justify-center p-8">
            <span className="text-sm text-slate-500 text-center break-keep leading-relaxed">{product.name}<br />(상품 이미지 준비중)</span>
            <button className="absolute top-4 right-4 w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-rose-500">
              <Heart className="w-4 h-4" />
            </button>
          </div>

          {/* 중: 선수·브랜드 협업 카드 */}
          <div className="rounded-2xl border border-slate-200 p-4 flex flex-col items-center text-center">
            <span className="px-3 py-1 rounded-full border border-emerald-600 text-emerald-700 text-[12px] font-bold mb-3">
              선수·브랜드 협업 상품
            </span>
            <div className="w-full aspect-[4/5] rounded-xl overflow-hidden bg-slate-50 mb-3">
              <img src={OREX_STORE.athletePhoto} alt={`${OREX_STORE.athleteName} 프로`} className="w-full h-full object-cover object-top" />
            </div>
            <div className="text-[15px] font-extrabold text-slate-900">{OREX_STORE.athleteName} 프로</div>
            <div className="text-[12px] text-slate-500 mb-3">{OREX_STORE.athleteTitle}</div>
            <img src={OREX_STORE.brandLogo} alt={OREX_STORE.brandName} className="h-9 object-contain mb-2" />
            <div className="text-[12px] font-bold text-slate-900 mb-1">
              {OREX_STORE.athleteName} 프로 × {OREX_STORE.brandName} 팬스토어
            </div>
            <p className="text-[12px] text-slate-500 break-keep leading-relaxed mb-3">{OREX_STORE.description}</p>
            <Link
              to={`${OREX_STORE.path}/ar`}
              className="mt-auto w-full h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-600 text-emerald-700 text-[12px] font-bold hover:bg-emerald-50"
            >
              <Box className="w-4 h-4" /> AR 보기
            </Link>
          </div>

          {/* 우: 가격·결제 */}
          <div className="rounded-2xl border border-slate-200 p-5 flex flex-col">
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 break-keep mb-1">{product.name}</h1>
            <div className="text-[12px] text-slate-500 mb-3">
              {OREX_STORE.athleteName} 프로 × {OREX_STORE.brandName} 팬스토어
            </div>
            {product.listPrice && (
              <div className="text-[13px] text-slate-500 line-through tabular-nums">{product.listPrice.toLocaleString()}원</div>
            )}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[26px] font-black text-slate-900 tabular-nums">{product.price.toLocaleString()}원</span>
              {off > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[12px] font-black">{off}%</span>
              )}
            </div>

            {/* 팬 할인코드 */}
            <div className="flex items-center rounded-xl border border-emerald-200 bg-emerald-50/50 overflow-hidden mb-2.5">
              <span className="px-3 py-2.5 text-[12px] font-bold text-slate-500 border-r border-emerald-100 shrink-0">팬 할인코드</span>
              <span className="px-3 font-black text-slate-900 tracking-wider flex-1">{OREX_STORE.fanCode}</span>
              <span className="text-[12px] font-bold text-emerald-700 tabular-nums">{OREX_STORE.fanDiscountPct}%</span>
              <button
                onClick={copyCode}
                className="ml-2 mr-2 my-1.5 px-2.5 h-7 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white text-[12px] font-bold text-slate-600 hover:bg-slate-50 shrink-0"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />} {copied ? '복사됨' : '복사'}
              </button>
            </div>

            {/* 보유 팬포인트 */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 mb-3">
              <span className="text-[12px] font-bold text-slate-600">보유 팬포인트</span>
              <span className="inline-flex items-center gap-1.5 text-[13px] font-black text-slate-900 tabular-nums">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center">P</span>
                {typeof balance === 'number' ? `${balance.toLocaleString()}P` : '로그인 후 확인'}
              </span>
            </div>

            {/* 결제 방법 */}
            <div className="text-[12px] font-bold text-slate-700 mb-1.5">결제 방법</div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { t: '팬포인트', d: 'P 사용' },
                { t: 'SPON Pay', d: 'SPONPay' },
                { t: '일반결제', d: '카드 / 간편결제' },
              ].map((m, i) => (
                <button
                  key={m.t}
                  onClick={() => setPayMethod(i)}
                  className={`rounded-xl border px-2 py-2.5 text-center transition-colors ${
                    payMethod === i ? 'border-emerald-600 bg-emerald-50/50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-[12px] font-extrabold text-slate-900">{m.t}</div>
                  <div className="text-[12.5px] text-slate-500">{m.d}</div>
                </button>
              ))}
            </div>

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
                예상 적립 <span className="font-black text-amber-500 tabular-nums">{Math.round(product.price * qty * OREX_STORE.earnRate).toLocaleString()}P</span>
              </div>
            </div>

            {/* CTA */}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={comingSoon} className="h-11 rounded-xl bg-emerald-600 text-white text-[13px] font-bold hover:bg-emerald-700">
                팬 할인가로 구매
              </button>
              <button onClick={comingSoon} className="h-11 rounded-xl border border-emerald-600 text-emerald-700 text-[13px] font-bold hover:bg-emerald-50">
                장바구니 담기
              </button>
            </div>
            <p className="text-[12px] text-slate-500 mt-2">
              {notice ? (
                <span className="font-bold text-emerald-700">정식 오픈 준비 중입니다. 곧 구매하실 수 있어요.</span>
              ) : (
                '결제 시 팬 할인코드가 자동 적용됩니다.'
              )}
            </p>
          </div>
        </div>
      </section>

      {/* ── 안내 타일 ── */}
      <section className="px-5 sm:px-8 pb-6">
        <div className="max-w-7xl mx-auto rounded-2xl border border-slate-200 grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-slate-100 overflow-hidden">
          <InfoTile icon={Percent} title={`팬 코드 ${OREX_STORE.fanDiscountPct}%`} desc={`${OREX_STORE.fanCode} 입력 시 ${OREX_STORE.fanDiscountPct}% 할인`} />
          <InfoTile icon={Coins} title={`구매 적립 ${Math.round(OREX_STORE.earnRate * 100)}%`} desc="구매 금액의 일부를 팬포인트로 적립" />
          <InfoTile
            icon={Truck}
            title={`배송 ${OREX_STORE.shippingFee.toLocaleString()}원 / ${OREX_STORE.freeShippingOver.toLocaleString()}원 이상 무료배송`}
            desc="오후 2시 이전 주문 시 당일 출발"
          />
          <Link to="/growth-market" className="hover:bg-slate-50 transition-colors">
            <InfoTile icon={Package} title="선수·브랜드 스토리" desc={`${OREX_STORE.athleteName} 프로 × ${OREX_STORE.brandName} 스토리 보기`} chevron />
          </Link>
        </div>
      </section>

      {/* ── 상품 설명 + 함께 보면 좋은 상품 ── */}
      <section className="px-5 sm:px-8 pb-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,34%)_minmax(0,1fr)] gap-4 items-start">
          <div className="rounded-2xl border border-slate-200 p-5">
            <h2 className="text-sm font-extrabold text-slate-900 mb-3">상품 설명</h2>
            <p className="text-[13px] text-slate-600 break-keep leading-relaxed mb-3">
              {product.name}은 고성능 알카라인 기술로 더 오래, 더 강력한 에너지를 제공합니다.
            </p>
            <ul className="space-y-1.5 mb-5">
              {product.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2 text-[12px] text-slate-500">
                  <span className="w-1 h-1 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
            <h3 className="text-sm font-extrabold text-slate-900 mb-2">상품 정보</h3>
            <dl className="text-[12px]">
              <div className="flex gap-4 py-1.5 border-t border-slate-100">
                <dt className="w-24 shrink-0 text-slate-500">구성</dt>
                <dd className="text-slate-700">{product.composition}</dd>
              </div>
              <div className="flex gap-4 py-1.5 border-t border-slate-100">
                <dt className="w-24 shrink-0 text-slate-500">제조사 / 브랜드</dt>
                <dd className="text-slate-700">{OREX_STORE.brandName}</dd>
              </div>
            </dl>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-extrabold text-slate-900">함께 보면 좋은 상품</h2>
              <Link to={OREX_STORE.path} className="inline-flex items-center gap-0.5 text-[12px] font-bold text-slate-500 hover:text-slate-900">
                더보기 <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {others.map((p) => {
                const pOff = p.listPrice ? Math.round((1 - p.price / p.listPrice) * 100) : 0;
                return (
                  <Link key={p.id} to={`${OREX_STORE.path}/${p.id}`} className="rounded-2xl border border-slate-200 overflow-hidden hover:border-emerald-300 transition-colors">
                    <div className="relative aspect-square bg-slate-50 flex items-center justify-center p-3">
                      <span className="text-[12.5px] text-slate-500 text-center break-keep leading-relaxed">{p.name}</span>
                      {pOff > 0 && (
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-rose-500 text-white text-[12.5px] font-black">{pOff}%</span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <div className="text-[12px] text-slate-600 line-clamp-2 min-h-[2rem] mb-1">{p.name}</div>
                      <div className="text-[13px] font-black text-slate-900 tabular-nums mb-0.5">{p.price.toLocaleString()}원</div>
                      <div className="text-[12.5px] font-bold text-amber-500 tabular-nums">{Math.round(p.price * OREX_STORE.earnRate).toLocaleString()}P 적립</div>
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
          <div className="text-sm font-extrabold text-slate-900 tabular-nums">{product.price.toLocaleString()}원</div>
        </div>
        <button onClick={comingSoon} className="shrink-0 h-10 px-4 rounded-xl bg-emerald-600 text-white text-sm font-bold">
          팬 할인가로 구매
        </button>
      </div>
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
        <div className="text-[12px] text-slate-500 break-keep">{desc}</div>
      </div>
      {chevron && <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />}
    </div>
  );
}
