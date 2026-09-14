/**
 * F12 스토어 상세 — 협업 이유 · 혜택코드 · 상품 목록 · 책임주체 (핸드오프 §8.2)
 */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Ticket, Copy, Check, ExternalLink, Store, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';
import {
  Card, Chip, AthleteAvatar, Notice, Skeleton, EmptyState, nf,
} from '../../components/fanhub/FanKit';

export default function FanStoreDetail() {
  const { idOrSlug = '' } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    api.getFanStore(idOrSlug)
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [idOrSlug]);

  const copyCode = () => {
    if (!data?.benefit?.code) return;
    navigator.clipboard?.writeText(data.benefit.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const goExternal = async (productId?: string) => {
    setExiting(true);
    try {
      const r = await api.exitToFanStore(data.id, productId);
      window.open(r.data.url, '_blank', 'noopener,noreferrer');
    } catch {
      /* 이동 주소가 없으면 버튼이 비활성이므로 여기 도달하면 서버 오류다 */
    } finally { setExiting(false); }
  };

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-10 space-y-4"><Skeleton className="h-[200px]" /><Skeleton className="h-[300px]" /></div>;
  }
  if (!data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20">
        <EmptyState icon={<Store className="w-5 h-5" />} title="스토어를 찾을 수 없습니다"
          action={<Link to="/fan/store" className="inline-flex h-10 px-5 rounded-2xl bg-slate-900 text-white text-[13px] font-bold items-center">팬스토어로</Link>} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <Link to="/fan/store" className="inline-flex items-center gap-1 text-[13px] font-semibold text-slate-500 hover:text-slate-700 mb-5">
        <ArrowLeft className="w-4 h-4" /> 팬스토어
      </Link>

      {/* 히어로 */}
      <div className="rounded-[28px] overflow-hidden bg-slate-100 aspect-[16/9] mb-5">
        {data.heroImageUrl && <img src={data.heroImageUrl} alt={data.title} className="w-full h-full object-cover" />}
      </div>

      <div className="flex items-center gap-2.5 mb-3">
        {data.athlete && <AthleteAvatar athlete={data.athlete} size={32} />}
        <span className="text-[13px] font-semibold text-slate-500">
          {data.athlete?.name} <span className="text-slate-300 mx-1">×</span> {data.brandName}
        </span>
        {data.closed && <Chip size="xs">종료</Chip>}
      </div>

      <h1 className="text-[24px] sm:text-[28px] font-extrabold text-slate-900 leading-snug tracking-[-0.02em]">
        {data.title}
      </h1>
      {data.summary && <p className="mt-2.5 text-[14px] text-slate-500 leading-relaxed">{data.summary}</p>}

      {/* 1. 스토리 — 선수 × 브랜드가 왜 함께하는지 (§11.5: 스토리 → 혜택 → 상품) */}
      {data.story && (
        <section className="mt-5">
          <h2 className="text-[15px] font-bold text-slate-900 mb-2.5">이 협업을 시작한 이유</h2>
          <Card className="p-5">
            <p className="text-[14px] text-slate-600 leading-[1.75] whitespace-pre-line">{data.story}</p>
          </Card>
        </section>
      )}

      {/* 2. 팬 혜택 */}
      {data.benefit && (
        <Card className="mt-5 p-5 border-amber-200 bg-amber-50/50">
          <div className="flex items-center gap-1.5 mb-2">
            <Ticket className="w-4 h-4 text-amber-600" />
            <span className="text-[13px] font-bold text-amber-700">{data.benefit.label}</span>
          </div>
          {data.benefit.desc && <p className="text-[13px] text-amber-700/80 leading-relaxed mb-3">{data.benefit.desc}</p>}
          {data.benefit.code && (
            <button onClick={copyCode}
              className="w-full h-12 rounded-2xl bg-white border border-amber-200 flex items-center justify-between px-4 hover:border-amber-300 transition">
              <span className="text-[16px] font-extrabold text-slate-900 tracking-wider">{data.benefit.code}</span>
              <span className="inline-flex items-center gap-1 text-[12px] font-bold text-amber-700">
                {copied ? <><Check className="w-3.5 h-3.5" /> 복사됨</> : <><Copy className="w-3.5 h-3.5" /> 코드 복사</>}
              </span>
            </button>
          )}
        </Card>
      )}

      {/* 3. 상품 */}
      <section className="mt-6">
        <h2 className="text-[15px] font-bold text-slate-900 mb-3">상품</h2>
        <p className="text-[12.5px] text-slate-500 mb-3 inline-flex items-center gap-1">
          <ExternalLink className="w-3.5 h-3.5" /> 구매는 브랜드몰에서 진행됩니다. SPONPIK 주문이 아닙니다.
        </p>
        {data.products?.length ? (
          <div className="space-y-2.5">
            {data.products.map((p: any) => (
              <Card key={p.id} as="link" to={`/fan/store/product/${p.id}`} className="p-4">
                <div className="flex gap-3.5">
                  <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden shrink-0">
                    {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      {p.isSponsored && <Chip size="xs" tone="slate">광고</Chip>}
                      {p.discountRate && <Chip size="xs" tone="rose">{p.discountRate}%</Chip>}
                    </div>
                    <p className="text-[14px] font-bold text-slate-900 line-clamp-2 leading-snug">{p.name}</p>
                    <div className="flex items-baseline gap-2 mt-1.5">
                      <span className="text-[16px] font-extrabold text-slate-900 tabular-nums">{nf(p.price)}원</span>
                      {p.originalPrice && p.originalPrice > p.price && (
                        <span className="text-[12px] text-slate-300 line-through tabular-nums">{nf(p.originalPrice)}원</span>
                      )}
                    </div>
                    {p.estimatedPoints !== null && (
                      <p className="text-[12px] text-emerald-600 font-semibold mt-1">
                        구매확정 시 약 {nf(p.estimatedPoints)}P 적립
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="등록된 상품이 없습니다" desc="브랜드몰에서 전체 상품을 확인해주세요." />
        )}
      </section>

      {/* 책임주체 */}
      <Card className="mt-6 p-5">
        <div className="flex items-center gap-1.5 mb-2">
          <ShieldCheck className="w-4 h-4 text-slate-500" />
          <span className="text-[13px] font-bold text-slate-700">{data.responsibleLabel}</span>
        </div>
        <p className="text-[13px] text-slate-500 leading-relaxed">{data.responsibleDesc}</p>
        {(data.sellerName || data.sellerContact) && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
            {data.sellerName && (
              <p className="text-[12px] text-slate-500">판매자 · <b className="text-slate-700">{data.sellerName}</b></p>
            )}
            {data.sellerContact && (
              <p className="text-[12px] text-slate-500">문의 · <b className="text-slate-700">{data.sellerContact}</b></p>
            )}
          </div>
        )}
      </Card>

      {/* 이동 */}
      {!data.closed && data.externalUrl && (
        <>
          <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-100 p-4">
            <p className="text-[12px] font-bold text-slate-500 mb-2">브랜드몰로 이동하기 전에</p>
            <ul className="space-y-1">
              {data.exitNotice?.map((t: string, i: number) => (
                <li key={i} className="text-[12px] text-slate-500 leading-relaxed pl-2.5 relative">
                  <span className="absolute left-0 top-[7px] w-1 h-1 rounded-full bg-slate-300" />{t}
                </li>
              ))}
            </ul>
          </div>
          <button onClick={() => goExternal()} disabled={exiting}
            className="mt-4 w-full h-13 py-4 rounded-2xl bg-slate-900 text-white text-[15px] font-bold hover:bg-slate-800 transition inline-flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:text-slate-400">
            {exiting ? '이동 중…' : <>브랜드몰에서 구매하기 <ExternalLink className="w-4 h-4" /></>}
          </button>
        </>
      )}

      {data.disclosures && (
        <div className="mt-6">
          <Notice title="거래 고지" items={data.disclosures} />
        </div>
      )}
    </div>
  );
}
