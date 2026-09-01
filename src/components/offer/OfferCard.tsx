/**
 * 지금 가능한 후원 — 상품 카드 (핸드오프 v1.0 §4.1)
 *
 * 카드의 주어는 선수가 아니라 "후원 기회"다. 첫 줄에 상품명·유형·마감/재고 배지,
 * 그다음 선수·구성·기간·가격·예상성과·승인 상태 순으로 둔다 (§14.2 수용 기준).
 */
import { Link } from 'react-router-dom';
import {
  Bookmark, Calendar, Eye, Package, ShoppingCart,
} from 'lucide-react';

export const BADGE_STYLE: Record<string, string> = {
  즉시구매: 'bg-emerald-500 text-white',
  '바로 시작': 'bg-emerald-500 text-white',
  선수확인: 'bg-amber-500 text-white',
  조건협의: 'bg-violet-500 text-white',
  정기후원: 'bg-sky-500 text-white',
  온라인전용: 'bg-sky-100 text-sky-700',
  '온라인 전용': 'bg-sky-100 text-sky-700',
  마감임박: 'bg-rose-500 text-white',
  신규: 'bg-slate-900 text-white',
};

/** 상품 상태 → 사람이 읽는 문구. 색상만으로 구분하지 않는다 (§12.3 접근성) */
export const OFFER_STATUS: Record<string, { label: string; cls: string }> = {
  PUBLISHED: { label: '판매중', cls: 'bg-emerald-50 text-emerald-700' },
  LOW_STOCK: { label: '마감임박', cls: 'bg-amber-50 text-amber-700' },
  SOLD_OUT: { label: '품절', cls: 'bg-slate-100 text-slate-500' },
  PAUSED: { label: '일시중지', cls: 'bg-slate-100 text-slate-500' },
  EXPIRED: { label: '판매종료', cls: 'bg-slate-100 text-slate-400' },
  DRAFT: { label: '작성 중', cls: 'bg-slate-100 text-slate-500' },
  REVIEW: { label: '검토 대기', cls: 'bg-sky-50 text-sky-700' },
  SCHEDULED: { label: '예약 발행', cls: 'bg-violet-50 text-violet-700' },
  ARCHIVED: { label: '보관', cls: 'bg-slate-100 text-slate-400' },
};

/** 가격 유형 — 승인 방식(즉시구매/선수확인)과 다른 축이므로 이름을 섞지 않는다 */
export const PRICE_TYPE_LABEL: Record<string, string> = {
  FIXED: '확정가', SUBSCRIPTION: '월 구독', NEGOTIABLE: '조건협의',
  AUCTION: '경매', DISCOUNTED: '할인가', MIXED: '혼합',
};

/** 예상성과 범위 문구 — 단일 숫자보다 범위를 먼저 쓴다 (§5.2) */
export function metricRange(m: any) {
  const f = (n: number) => (n >= 10000 ? `${Math.round(n / 10000).toLocaleString()}만` : n.toLocaleString());
  if (m.minValue != null && m.maxValue != null && m.minValue !== m.maxValue) {
    return `${f(m.minValue)}~${f(m.maxValue)}`;
  }
  return f(m.maxValue ?? m.minValue ?? 0);
}

export default function OfferCard({
  offer, saved, onSave, onAddCart, compact,
}: {
  offer: any;
  saved?: boolean;
  onSave?: (o: any) => void;
  onAddCart?: (o: any) => void;
  compact?: boolean;
}) {
  const metrics = offer.expectedPerformance?.metrics ?? [];
  const athletes = offer.athletes ?? [];
  const tags = (offer.components ?? []).slice(0, 3);

  return (
    <article
      data-offer-id={offer.id}
      className="rounded-2xl border border-slate-200 overflow-hidden bg-white hover:border-emerald-300 hover:shadow-[0_12px_32px_-14px_rgba(15,23,42,0.16)] transition-all flex flex-col"
    >
      <div className="p-5 flex-1 flex flex-col">
        {/* 1. 배지 */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(offer.badges ?? []).slice(0, 3).map((b: string) => (
            <span key={b} className={`px-2 py-0.5 rounded-md text-[10.5px] font-black ${BADGE_STYLE[b] || 'bg-slate-100 text-slate-600'}`}>
              {b}
            </span>
          ))}
          {offer.daysLeft != null && offer.daysLeft >= 0 && offer.daysLeft <= 14 && (
            <span className="text-[11px] font-bold text-rose-600">{offer.daysLeft}일 남음</span>
          )}
        </div>

        {/* 2. 상품명 + 한 줄 가치 */}
        <Link to={`/sponsor/available/${offer.id}`} className="mt-2.5 block">
          <h3 className="text-[17px] font-black leading-snug break-keep hover:text-emerald-700">{offer.title}</h3>
        </Link>
        {offer.subtitle && <p className="mt-1 text-[12.5px] text-slate-500 break-keep line-clamp-2">{offer.subtitle}</p>}

        {/* 3. 선수 (최대 3명) */}
        {athletes.length > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <span className="flex -space-x-2">
              {athletes.slice(0, 3).map((a: any) => (
                <span key={a.athleteId} className="w-7 h-7 rounded-full overflow-hidden bg-slate-100 ring-2 ring-white">
                  {a.athlete?.profileImageUrl && <img src={a.athlete.profileImageUrl} alt="" loading="lazy" className="w-full h-full object-cover object-top" />}
                </span>
              ))}
            </span>
            <span className="text-[12.5px] font-bold truncate">
              {athletes.slice(0, 2).map((a: any) => a.athlete?.name).join(' · ')}
              {athletes.length > 2 && ` 외 ${athletes.length - 2}명`}
            </span>
            <span className="text-[11.5px] text-slate-400 truncate">{athletes[0]?.athlete?.tour}</span>
          </div>
        )}

        {/* 4. 구성 태그 */}
        {tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {tags.map((c: any) => (
              <span key={c.id} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold">
                {c.label}
              </span>
            ))}
          </div>
        )}

        {/* 5·7. 기간 · 예상성과 */}
        <dl className={`mt-3 grid gap-x-3 gap-y-2 text-[11.5px] pt-3 border-t border-slate-100 ${compact ? 'grid-cols-2' : 'grid-cols-3'}`}>
          <div>
            <dt className="text-slate-400 inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> 기간</dt>
            <dd className="mt-0.5 font-extrabold text-[12.5px]">
              {offer.months > 1 ? `${offer.months}개월` : offer.durationCode === 'SINGLE_EVENT' ? '대회 1회' : '30일'}
            </dd>
          </div>
          {metrics[0] && (
            <div>
              <dt className="text-slate-400 inline-flex items-center gap-1"><Eye className="w-3 h-3" /> {metrics[0].metric}</dt>
              <dd className="mt-0.5 font-extrabold text-[12.5px]">{metricRange(metrics[0])}</dd>
            </div>
          )}
          {!compact && (
            <div>
              <dt className="text-slate-400 inline-flex items-center gap-1"><Package className="w-3 h-3" /> 재고</dt>
              <dd className="mt-0.5 font-extrabold text-[12.5px]">
                {offer.availableQty == null ? '제한 없음' : `${offer.availableQty} / ${offer.capacity}`}
              </dd>
            </div>
          )}
        </dl>

        {metrics[0]?.basis && (
          <p className="mt-1.5 text-[10.5px] text-slate-400 break-keep">
            {offer.expectedPerformance?.dataAsOf
              ? `${new Date(offer.expectedPerformance.dataAsOf).toLocaleDateString('ko-KR')} 기준 · `
              : ''}
            추정치이며 성과를 보장하지 않습니다
          </p>
        )}

        {/* 6. 가격 */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-end justify-between gap-2">
          <div>
            {offer.originalPrice && offer.originalPrice > offer.supplyAmount && (
              <p className="text-[11px] text-slate-400 line-through">{offer.originalPrice.toLocaleString()}원</p>
            )}
            <p className="text-[19px] font-black text-emerald-600 leading-none">
              {offer.priceType === 'NEGOTIABLE'
                ? '협의'
                : offer.priceType === 'SUBSCRIPTION'
                  ? `월 ${offer.monthlyAmount.toLocaleString()}원`
                  : `${offer.supplyAmount.toLocaleString()}원`}
            </p>
            <p className="mt-0.5 text-[10.5px] text-slate-400">VAT 별도</p>
          </div>
          <span className={`px-2.5 py-1 rounded-lg text-[11.5px] font-bold ${OFFER_STATUS[offer.displayStatus]?.cls || 'bg-slate-100 text-slate-500'}`}>
            {PRICE_TYPE_LABEL[offer.priceType] || offer.priceType}
          </span>
        </div>

        {/* 9. CTA */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => onSave?.(offer)}
            aria-pressed={saved}
            className={`h-10 px-3 inline-flex items-center gap-1.5 rounded-xl border text-[12.5px] font-bold transition-colors ${
              saved ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} /> {saved ? '보관됨' : '보관함'}
          </button>
          {offer.allowedActions?.includes('ADD') && onAddCart && (
            <button
              onClick={() => onAddCart(offer)}
              className="h-10 px-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 text-[12.5px] font-bold text-slate-600 hover:bg-slate-50"
              aria-label="장바구니에 담기"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
            </button>
          )}
          <Link
            to={`/sponsor/available/${offer.id}`}
            className="flex-1 h-10 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-white text-[13px] font-bold hover:bg-emerald-700"
          >
            {offer.allowedActions?.includes('BUY') ? '바로 구매'
              : offer.allowedActions?.includes('NEGOTIATE') ? '상담 요청'
              : offer.allowedActions?.includes('AUCTION') ? '경매 참여'
              : offer.allowedActions?.includes('NOTIFY') ? '재오픈 알림'
              : '승인 요청하기'}
          </Link>
        </div>
      </div>
    </article>
  );
}

/** 승인 상태 요약 — 카드·상세·장바구니가 같은 문구를 쓴다 (§5.3) */
export function approvalHint(offer: any) {
  if (offer.allowedActions?.includes('BUY')) return { label: '즉시 구매 가능', tone: 'ok' as const };
  if (offer.priceType === 'NEGOTIABLE') return { label: '조건 협의가 필요합니다', tone: 'warn' as const };
  if (offer.priceType === 'AUCTION') return { label: '경매로 진행됩니다', tone: 'warn' as const };
  if (offer.displayStatus === 'SOLD_OUT') return { label: '재고가 소진되었습니다', tone: 'off' as const };
  return { label: '구매 전 선수 확인이 필요합니다', tone: 'warn' as const };
}

/** 노출 집계 — 목록에 그려진 카드 id를 모아 한 번만 올린다 (§11.4) */
export function useImpressions(offers: any[], send: (ids: string[]) => void) {
  const ids = offers.map((o) => o.id).join(',');
  if (typeof window !== 'undefined' && ids) {
    const key = `imp:${ids}`;
    if (!(window as any).__offerImp) (window as any).__offerImp = new Set<string>();
    const seen: Set<string> = (window as any).__offerImp;
    if (!seen.has(key)) {
      seen.add(key);
      send(offers.map((o) => o.id));
    }
  }
}
