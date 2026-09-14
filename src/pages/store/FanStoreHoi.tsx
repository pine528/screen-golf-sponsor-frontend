/**
 * 호이베이커리 팬스토어 메인 (/fan-store/hoi-bakery) — 사용자 제공 시안 기준
 *
 * [베이지 히어로: 배진리 프로 × 호이베이커리 + CTA + 선수 사진 + 나의 팬포인트 패널]
 * [혜택 스트립 5종] [추천 스토어 상품 (전체보기 → /products)] [이렇게 구매해요 | 팬을 위한 특별한 혜택]
 *
 * 전시용 카탈로그(`data/hoiStore.ts`) — 실구매는 상품 등록 후 연결한다.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Box,
  Check,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  Leaf,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Ticket,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import PublicHeader from '../../components/PublicHeader';
import Breadcrumb from '../../components/Breadcrumb';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { HOI_PRODUCTS, HOI_STORE } from '../../data/hoiStore';

export default function FanStoreHoi() {
  const [copied, setCopied] = useState(false);
  const { isAuthenticated } = useAuth();
  const { data: pointData } = useQuery({
    queryKey: ['my-point-balance'],
    queryFn: () => api.getMyPointBalance(),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const balance = (pointData as any)?.data?.balance;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(HOI_STORE.fanCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 코드가 화면에 보이므로 무시 */
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-5">
        <Breadcrumb className="mb-0" />
      </div>

      {/* ── 히어로 ── */}
      <section className="px-5 sm:px-8 pt-2 pb-6">
        <div className="max-w-7xl mx-auto rounded-3xl bg-gradient-to-br from-amber-50/70 via-white to-emerald-50/40 border border-amber-100/80 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,34%)_minmax(0,240px)] gap-6 items-center p-6 sm:p-8">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-700 text-white text-[12px] font-bold mb-3">
                ★ 팬 전용
              </span>
              <h1 className="text-[26px] sm:text-3xl font-black text-slate-900 leading-snug mb-3 break-keep">
                {HOI_STORE.athleteName} 프로 <span className="text-slate-300">×</span>
                <br />
                {HOI_STORE.brandName} 팬 스토어
              </h1>
              <p className="text-sm text-slate-500 break-keep leading-relaxed mb-4">{HOI_STORE.tagline}</p>

              <div className="flex items-center gap-3 mb-5">
                <span className="text-[15px] italic font-bold text-slate-700">
                  Bae Jinri <span className="text-[12.5px] not-italic font-black text-slate-500 align-top">PRO</span>
                </span>
                <span className="text-slate-300 font-bold">×</span>
                <img src={HOI_STORE.brandLogo} alt={HOI_STORE.brandName} className="h-9 object-contain" />
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  to={`${HOI_STORE.path}/products`}
                  className="h-11 px-5 inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 text-white text-[13px] font-bold hover:bg-emerald-800"
                >
                  스토어 입장 <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={copyCode}
                  className="h-11 px-5 inline-flex items-center gap-1.5 rounded-xl border border-emerald-700 text-emerald-800 text-[13px] font-bold hover:bg-emerald-50"
                >
                  {copied ? <Check className="w-4 h-4" /> : null} {copied ? '코드 복사됨' : '코드 받기'}
                </button>
                <Link
                  to={`${HOI_STORE.path}/ar`}
                  className="h-11 px-5 inline-flex items-center gap-1.5 rounded-xl border border-emerald-700 text-emerald-800 text-[13px] font-bold hover:bg-emerald-50"
                >
                  <Box className="w-4 h-4" /> AR 보기
                </Link>
              </div>
            </div>

            {/* 선수 사진 */}
            <div className="relative hidden lg:block">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden">
                <img
                  src={HOI_STORE.athletePhoto}
                  alt={`${HOI_STORE.athleteName} 프로`}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <span className="absolute top-3 right-3 px-2.5 py-1.5 rounded-xl bg-white/90 backdrop-blur text-[12px] font-bold text-slate-700 shadow-sm">
                좋은 기운을 굽는 빵집
              </span>
            </div>

            {/* 나의 팬포인트 패널 */}
            <div className="hidden lg:block rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] font-bold text-slate-500">나의 팬포인트</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              </div>
              <div className="text-[20px] font-black text-slate-900 tabular-nums mb-3">
                {typeof balance === 'number' ? `${balance.toLocaleString()}P` : '로그인 후 확인'}
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-2.5 mb-2">
                <div className="text-[12px] text-slate-500 mb-1">팬 할인코드</div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900 tracking-wider text-[14px]">{HOI_STORE.fanCode}</span>
                  <button
                    onClick={copyCode}
                    className="ml-auto px-2 h-6 inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white text-[12.5px] font-bold text-slate-600 hover:bg-slate-50"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />} 복사
                  </button>
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 px-3 py-2.5 mb-3">
                <div className="text-[12px] text-slate-500 mb-0.5">팬 전용 할인 혜택</div>
                <div className="text-[16px] font-black text-emerald-700">{HOI_STORE.fanDiscountPct}%</div>
                <div className="text-[12.5px] text-slate-500">{HOI_STORE.fanCode} 코드 입력 시 적용</div>
              </div>
              <Link
                to={`${HOI_STORE.path}/products`}
                className="w-full h-9 inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-700 text-white text-[12px] font-bold hover:bg-emerald-800"
              >
                스토어 바로가기 <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 혜택 스트립 ── */}
      <section className="px-5 sm:px-8 pb-8">
        <div className="max-w-7xl mx-auto rounded-2xl border border-slate-200 grid grid-cols-2 lg:grid-cols-5 divide-x divide-y lg:divide-y-0 divide-slate-100 overflow-hidden">
          <Strip icon={Ticket} text={`팬 할인코드 ${HOI_STORE.fanCode}`} />
          <Strip icon={Sparkles} text="팬포인트 사용 가능" />
          <Strip icon={CreditCard} text="SPON Pay / 일반결제 가능" />
          <Strip icon={Clock} text="기간 한정 혜택" />
          <Link to={`${HOI_STORE.path}/ar`} className="hover:bg-slate-50 transition-colors">
            <Strip icon={Box} text="선수 AR 이미지 보기" />
          </Link>
        </div>
      </section>

      {/* ── 추천 스토어 상품 ── */}
      <section className="px-5 sm:px-8 pb-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">추천 스토어 상품</h2>
            <Link to={`${HOI_STORE.path}/products`} className="inline-flex items-center gap-0.5 text-[13px] font-bold text-slate-500 hover:text-slate-900">
              전체보기 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {HOI_PRODUCTS.slice(0, 6).map((p) => (
              <HoiProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 이렇게 구매해요 + 팬 혜택 ── */}
      <section className="px-5 sm:px-8 pb-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,42%)_minmax(0,1fr)] gap-4 items-stretch">
          <div className="rounded-2xl border border-slate-200 p-5">
            <h2 className="text-[15px] font-extrabold text-slate-900 mb-4">이렇게 구매해요</h2>
            <div className="flex flex-col sm:flex-row items-stretch gap-3">
              {[
                { t: '코드 받기', d: '팬 할인코드 받기', icon: Ticket },
                { t: '상품 선택', d: '원하는 상품 담기', icon: ShoppingBag },
                { t: '결제 & 혜택 적용', d: '코드 적용하고 결제 완료!', icon: CreditCard },
              ].map((s, i, arr) => (
                <div key={s.t} className="flex items-center gap-3 flex-1">
                  <div className="flex items-start gap-2.5 flex-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[12px] font-black flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[12px] font-bold text-slate-900">{s.t}</div>
                      <p className="text-[12px] text-slate-500 break-keep">{s.d}</p>
                    </div>
                  </div>
                  {i < arr.length - 1 && <ArrowRight className="hidden sm:block w-4 h-4 text-slate-300 shrink-0" />}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <h2 className="text-[15px] font-extrabold text-slate-900 mb-4">팬을 위한 특별한 혜택</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <FanBenefit icon={Sparkles} title="팬포인트 적립" desc="구매 금액을 팬포인트로 적립" />
              <FanBenefit icon={Ticket} title="팬 전용 할인" desc={`${HOI_STORE.fanCode} 코드로 ${HOI_STORE.fanDiscountPct}% 할인`} />
              <FanBenefit icon={Leaf} title="호이베이커리 이야기" desc="좋은 재료로 정성껏 굽는 건강한 빵" />
              <Link to={`${HOI_STORE.path}/ar`} className="block">
                <FanBenefit icon={Box} title="AR 이미지 체험" desc={`${HOI_STORE.athleteName} 프로 AR 이미지를 만나보세요`} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Strip({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-3.5">
      <Icon className="w-4 h-4 text-emerald-700 shrink-0" />
      <span className="text-[12px] font-bold text-slate-700 break-keep">{text}</span>
    </div>
  );
}

function FanBenefit({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="text-center px-1">
      <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-2">
        <Icon className="w-5 h-5 text-emerald-700" />
      </div>
      <div className="text-[12px] font-bold text-slate-900 break-keep">{title}</div>
      <p className="text-[12.5px] text-slate-500 break-keep leading-snug mt-0.5">{desc}</p>
    </div>
  );
}

/** 상품 카드 — 메인/목록 공용 */
export function HoiProductCard({ product: p }: { product: import('../../data/hoiStore').HoiProduct }) {
  const off = Math.round((1 - p.price / p.listPrice) * 100);
  return (
    <Link
      to={`${HOI_STORE.path}/${p.id}`}
      className="rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-emerald-300 transition-colors flex flex-col"
    >
      <div className="relative aspect-square bg-amber-50/50 flex items-center justify-center p-4">
        <span className="text-[12px] text-slate-500 text-center break-keep leading-relaxed">{p.name}</span>
        {off > 0 && (
          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-emerald-700 text-white text-[12.5px] font-black">{off}%</span>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <div className="text-[12px] text-slate-600 line-clamp-2 min-h-[2.1rem] mb-1.5">{p.name}</div>
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="text-[12px] text-slate-500 line-through tabular-nums">{p.listPrice.toLocaleString()}원</span>
          <span className="text-[15px] font-black text-emerald-800 tabular-nums">{p.price.toLocaleString()}원</span>
        </div>
        <div className="text-[12.5px] text-slate-500 mb-2.5">
          {p.shipping === '냉동 배송' ? '❄️' : p.shipping === '냉장 배송' ? '🧊' : '📦'} {p.shipping}
        </div>
        <span className="mt-auto inline-flex items-center justify-center gap-1.5 h-8 rounded-lg bg-emerald-700 text-white text-[12px] font-bold">
          <ShoppingCart className="w-3.5 h-3.5" /> 구매하기
        </span>
      </div>
    </Link>
  );
}
