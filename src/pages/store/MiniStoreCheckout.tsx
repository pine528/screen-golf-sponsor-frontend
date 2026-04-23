/**
 * STO-03: 체크아웃 / 주문 완료
 *
 * Refs: wireframe_spec.docx > STO-03
 * - 코드 적용 (promo-apply 이벤트)
 * - 결제 시작 (begin-checkout 이벤트)
 * - 결제 완료 (purchase 이벤트 + 트랜잭션)
 * - 주문완료 화면 (선수 추천 공유)
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useFunnelTracking } from '../../hooks/useFunnelTracking';
import { CheckCircle2, Tag, ArrowLeft, Share2 } from 'lucide-react';

const CART_KEY = 'sponpik_cart';

export default function MiniStoreCheckout() {
  const { slug } = useParams<{ slug: string }>();
  const { trackEvent, sessionId } = useFunnelTracking();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [orderResult, setOrderResult] = useState<any>(null);

  const { data: resp } = useQuery({
    queryKey: ['public-mini-store', slug],
    queryFn: () => api.getPublicMiniStore(slug!),
    enabled: !!slug,
  });
  const store = resp?.data;

  const cartItems = JSON.parse(localStorage.getItem(CART_KEY) || '[]').filter((c: any) => c.slug === slug);
  const grossAmount = cartItems.reduce((sum: number, c: any) => sum + c.price * c.qty, 0);

  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoApplied, setPromoApplied] = useState<any>(null);
  const [promoError, setPromoError] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  useEffect(() => {
    if (store) {
      trackEvent('begin-checkout', {
        campaign_id: store.campaignId,
        brand_id: store.brandId,
        cart_id: `cart_${sessionId}`,
        order_amount: grossAmount,
      });
    }
  }, [store]);

  const applyMut = useMutation({
    mutationFn: () => api.applyPromoCode({ promo_code: promoCode, order_preview_amount: grossAmount, session_id: sessionId }),
    onSuccess: (resp) => {
      const r = resp.data;
      if (r.applied) {
        setDiscountAmount(r.discount_amount);
        setPromoApplied({ code: promoCode });
        setPromoError('');
      } else {
        setPromoError(r.message || '코드를 사용할 수 없습니다');
      }
    },
  });

  const purchaseMut = useMutation({
    mutationFn: () => {
      const items = cartItems.map((c: any) => ({ product_id: c.productId, qty: c.qty, unit_price: c.price }));
      const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      return api.createFunnelPurchase({
        order_id: orderId,
        campaign_id: store?.campaignId,
        brand_id: store?.brandId,
        promo_code: promoApplied?.code,
        gross_amount: grossAmount,
        discount_amount: discountAmount,
        net_amount: grossAmount - discountAmount,
        items,
        is_new_customer: !customerEmail || true,  // 임시: 항상 신규
        session_id: sessionId,
        customer_email: customerEmail,
      });
    },
    onSuccess: (resp) => {
      setOrderResult(resp.data);
      localStorage.removeItem(CART_KEY);
      setStep('success');
    },
    onError: (e: any) => {
      alert('결제 실패: ' + (e?.response?.data?.error?.message || e.message));
    },
  });

  if (!store) return <div className="p-6">로딩 중...</div>;

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">주문이 완료되었습니다!</h1>
          <p className="text-sm text-slate-500 mb-6">{store.athleteImageUrl ? `${store.brand?.name} 추천 상품을 주문해주셔서 감사합니다.` : ''}</p>

          <div className="bg-slate-50 rounded-lg p-4 text-left mb-6">
            <Field label="주문번호" value={<code className="text-xs">{orderResult?.purchase_event_id?.slice(0, 12)}</code>} />
            <Field label="결제 금액" value={`₩${(grossAmount - discountAmount).toLocaleString()}`} />
            <Field label="귀속" value={orderResult?.attribution_reason || '-'} />
          </div>

          <button
            onClick={() => navigator.share?.({ title: store.brand?.name, text: store.mainCopy, url: window.location.origin + '/store/' + slug }).catch(() => {})}
            className="w-full mb-2 bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 rounded-xl inline-flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" /> 친구에게 공유하기
          </button>
          <Link to={`/store/${slug}`} className="block w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl">
            스토어로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="max-w-3xl mx-auto p-4">
        <Link to={`/store/${slug}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> 스토어로
        </Link>

        {/* 주문 요약 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
          <h2 className="text-sm font-bold mb-3">주문 요약</h2>
          {cartItems.length === 0 && (
            <div className="text-center py-6 text-sm text-slate-400">장바구니가 비어있습니다</div>
          )}
          {cartItems.map((c: any, i: number) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-b-0">
              <div>
                <div className="text-sm font-semibold">{c.name}</div>
                <div className="text-xs text-slate-500">{c.qty}개</div>
              </div>
              <div className="text-sm font-bold">₩{(c.price * c.qty).toLocaleString()}</div>
            </div>
          ))}
        </div>

        {/* 코드 적용 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
          <h2 className="text-sm font-bold mb-3 inline-flex items-center gap-2"><Tag className="w-4 h-4" /> 프로모션 코드</h2>
          {!promoApplied ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="코드 입력"
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 font-mono"
              />
              <button
                onClick={() => applyMut.mutate()}
                disabled={!promoCode || applyMut.isPending}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg"
              >
                적용
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-emerald-50 p-3 rounded-lg">
              <div>
                <code className="text-sm font-bold text-emerald-700">{promoApplied.code}</code>
                <div className="text-xs text-emerald-600 mt-0.5">-₩{discountAmount.toLocaleString()} 할인 적용됨</div>
              </div>
              <button onClick={() => { setPromoApplied(null); setDiscountAmount(0); setPromoCode(''); }} className="text-xs text-rose-600 font-semibold">제거</button>
            </div>
          )}
          {promoError && <div className="mt-2 text-xs text-rose-600">{promoError}</div>}
        </div>

        {/* 결제 정보 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
          <h2 className="text-sm font-bold mb-3">배송/결제 정보 (시뮬레이션)</h2>
          <div className="space-y-2">
            <input type="text" placeholder="이름" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2" />
            <input type="tel" placeholder="전화번호" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2" />
            <input type="email" placeholder="이메일 (선택)" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2" />
          </div>
        </div>

        {/* 합계 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex justify-between text-sm mb-1">
            <span>상품 금액</span>
            <span>₩{grossAmount.toLocaleString()}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-emerald-600 mb-1">
              <span>할인</span>
              <span>-₩{discountAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-extrabold text-lg pt-2 border-t border-slate-100">
            <span>최종 결제금액</span>
            <span className="text-emerald-600">₩{(grossAmount - discountAmount).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 shadow-2xl">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => purchaseMut.mutate()}
            disabled={cartItems.length === 0 || purchaseMut.isPending || !customerName}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-base font-extrabold py-4 rounded-xl shadow-lg disabled:opacity-50"
          >
            {purchaseMut.isPending ? '결제 중...' : `₩${(grossAmount - discountAmount).toLocaleString()} 결제하기`}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: any) {
  return (
    <div className="flex justify-between py-1.5 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
