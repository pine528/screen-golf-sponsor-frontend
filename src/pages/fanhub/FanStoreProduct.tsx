/**
 * F13 상품 상세 · 외부이동 (핸드오프 §8.2 · §8.3)
 * 가격·배송·반품·포인트·판매자·재고·광고성 표시를 모두 노출한 뒤 이동시킨다.
 */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, ShieldCheck, Package } from 'lucide-react';
import { api } from '../../services/api';
import {
  Card, Chip, AthleteAvatar, Notice, Skeleton, EmptyState, StickyCTA, nf,
} from '../../components/fanhub/FanKit';

export default function FanStoreProduct() {
  const { id = '' } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    api.getFanStoreProduct(id)
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  const go = async () => {
    setExiting(true);
    try {
      const r = await api.exitToFanStore(data.store.id, data.product.id);
      window.open(r.data.url, '_blank', 'noopener,noreferrer');
      setConfirm(false);
    } finally { setExiting(false); }
  };

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-10 space-y-4"><Skeleton className="h-[260px]" /><Skeleton className="h-[220px]" /></div>;
  }
  if (!data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20">
        <EmptyState icon={<Package className="w-5 h-5" />} title="상품을 찾을 수 없습니다"
          action={<Link to="/fan/store" className="inline-flex h-10 px-5 rounded-2xl bg-slate-900 text-white text-[13px] font-bold items-center">팬스토어로</Link>} />
      </div>
    );
  }

  const p = data.product;
  const s = data.store;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <Link to={`/fan/store/${s.slug || s.id}`} className="inline-flex items-center gap-1 text-[13px] font-semibold text-slate-500 hover:text-slate-700 mb-5">
        <ArrowLeft className="w-4 h-4" /> {s.title}
      </Link>

      <div className="rounded-[28px] overflow-hidden bg-slate-100 aspect-square mb-5">
        {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />}
      </div>

      <div className="flex items-center gap-1.5 mb-2.5">
        {p.isSponsored && <Chip size="xs">광고 · 브랜드 협찬</Chip>}
        {p.discountRate && <Chip size="xs" tone="rose">{p.discountRate}% 할인</Chip>}
      </div>

      <h1 className="text-[22px] font-extrabold text-slate-900 leading-snug tracking-[-0.02em]">{p.name}</h1>

      <div className="flex items-baseline gap-2.5 mt-3">
        <span className="text-[28px] font-extrabold text-slate-900 tabular-nums tracking-[-0.02em]">{nf(p.price)}원</span>
        {p.originalPrice && p.originalPrice > p.price && (
          <span className="text-[15px] text-slate-300 line-through tabular-nums">{nf(p.originalPrice)}원</span>
        )}
      </div>

      {p.description && (
        <p className="mt-4 text-[14px] text-slate-600 leading-[1.75] whitespace-pre-line">{p.description}</p>
      )}

      {/* 협업 선수 */}
      {s.athlete && (
        <Card className="mt-5 p-4">
          <Link to={`/fan/temperature/${s.athlete.id}`} className="flex items-center gap-3">
            <AthleteAvatar athlete={s.athlete} size={40} />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-slate-900">{s.athlete.name}</p>
              <p className="text-[12px] text-slate-500">{s.brandName}와 함께하는 협업 상품</p>
            </div>
          </Link>
        </Card>
      )}

      {/* 판매 정보 */}
      <Card className="mt-4 divide-y divide-slate-100">
        {data.policies?.map((pol: any) => (
          <div key={pol.key} className="flex gap-4 px-4 py-3.5">
            <span className="text-[13px] font-semibold text-slate-500 w-20 shrink-0">{pol.label}</span>
            <span className="text-[13px] text-slate-700 leading-relaxed flex-1">{pol.value}</span>
          </div>
        ))}
      </Card>

      {/* 판매자 · 책임주체 */}
      <Card className="mt-4 p-5">
        <div className="flex items-center gap-1.5 mb-2">
          <ShieldCheck className="w-4 h-4 text-slate-500" />
          <span className="text-[13px] font-bold text-slate-700">{data.seller.responsibleLabel}</span>
        </div>
        <p className="text-[13px] text-slate-500 leading-relaxed mb-3">{data.seller.responsibleDesc}</p>
        <div className="space-y-1 pt-3 border-t border-slate-100">
          <p className="text-[12px] text-slate-500">판매자 · <b className="text-slate-700">{data.seller.name}</b></p>
          {data.seller.contact && (
            <p className="text-[12px] text-slate-500">문의 · <b className="text-slate-700">{data.seller.contact}</b></p>
          )}
        </div>
      </Card>

      <div className="mt-6">
        <Notice title="구매 전 확인해주세요" items={data.exitNotice || []} />
      </div>

      {/* 이동 확인 */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 px-4"
          onClick={() => setConfirm(false)}>
          <div className="w-full max-w-sm rounded-[28px] bg-white p-6 mb-4 sm:mb-0" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[18px] font-extrabold text-slate-900 tracking-[-0.02em]">브랜드몰로 이동합니다</h2>
            <p className="mt-2.5 text-[13px] text-slate-500 leading-relaxed">
              {data.seller.name}이(가) 운영하는 외부 쇼핑몰입니다.
              결제·배송·교환·환불은 해당 브랜드의 정책과 책임에 따릅니다.
            </p>
            {p.pointRate && (
              <p className="mt-3 text-[12px] text-emerald-600 font-semibold">
                구매확정이 확인되면 약 {nf(p.estimatedPoints)}P가 적립됩니다.
              </p>
            )}
            <div className="mt-6 flex gap-2">
              <button onClick={() => setConfirm(false)}
                className="flex-1 h-12 rounded-2xl bg-slate-100 text-slate-700 text-[14px] font-bold hover:bg-slate-200 transition">
                취소
              </button>
              <button onClick={go} disabled={exiting}
                className="flex-1 h-12 rounded-2xl bg-slate-900 text-white text-[14px] font-bold hover:bg-slate-800 transition disabled:bg-slate-200 disabled:text-slate-400">
                {exiting ? '이동 중…' : '이동하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-5">
        <StickyCTA>
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setConfirm(true)}
              className="w-full h-12 rounded-2xl bg-slate-900 text-white text-[15px] font-bold hover:bg-slate-800 transition inline-flex items-center justify-center gap-2">
              브랜드몰에서 구매하기 <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </StickyCTA>
      </div>
    </div>
  );
}
