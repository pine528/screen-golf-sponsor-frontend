/**
 * F11 팬스토어 홈 — 선수×브랜드 협업 스토리 (핸드오프 §8.2)
 * 응원이 성장으로 이어진다는 맥락을 보여주되 구매 CTA를 방해하지 않는다 (§18.3).
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, ExternalLink, Ticket, Clock } from 'lucide-react';
import { api } from '../../services/api';
import {
  FanHeader, Card, Chip, AthleteAvatar, EmptyState, Notice, Skeleton,
} from '../../components/fanhub/FanKit';

export default function FanStoreHome() {
  const [data, setData] = useState<any>(null);
  const [exits, setExits] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.listFanStores({ limit: 20 }).then((r) => setData(r.data)).catch(() => setData(null)),
      api.getMyStoreExits().then((r) => setExits(r.data)).catch(() => setExits(null)),
    ]).finally(() => setLoading(false));
  }, []);

  const stores = data?.stores || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <Link to="/fan" className="inline-flex items-center gap-1 text-[13px] font-semibold text-slate-500 hover:text-slate-700 mb-5">
        <ArrowLeft className="w-4 h-4" /> 팬 참여
      </Link>

      <FanHeader eyebrow="FAN STORE" title="팬스토어"
        desc="선수와 브랜드가 함께 만든 협업 스토어입니다. 팬 혜택을 확인하고 브랜드몰에서 구매하세요." />

      {/* 이용 방법 */}
      {data?.howItWorks && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-8">
          {data.howItWorks.map((s: any) => (
            <div key={s.step} className="rounded-3xl bg-slate-50 p-4">
              <span className="inline-flex w-6 h-6 rounded-lg bg-white text-slate-900 text-[12px] font-extrabold items-center justify-center mb-2.5">
                {s.step}
              </span>
              <p className="text-[13px] font-bold text-slate-900">{s.title}</p>
              <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[280px]" />)}</div>
      ) : stores.length ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {stores.map((s: any) => (
            <Card key={s.id} as="link" to={`/fan/store/${s.slug || s.id}`} className="overflow-hidden">
              <div className="aspect-[16/9] bg-slate-100 relative">
                {s.heroImageUrl && <img src={s.heroImageUrl} alt={s.title} className="w-full h-full object-cover" />}
                {s.daysLeft !== null && s.daysLeft <= 7 && (
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-slate-900/85 px-2.5 py-1 text-[12px] font-bold text-white">
                    <Clock className="w-3 h-3" /> {s.daysLeft}일 남음
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2.5">
                  {s.athlete && <AthleteAvatar athlete={s.athlete} size={26} />}
                  <span className="text-[12px] font-semibold text-slate-500 truncate">
                    {s.athlete?.name} <span className="text-slate-300 mx-0.5">×</span> {s.brandName}
                  </span>
                </div>
                <p className="text-[15px] font-bold text-slate-900 leading-snug line-clamp-2">{s.title}</p>
                {s.summary && <p className="text-[12px] text-slate-500 mt-1.5 line-clamp-2">{s.summary}</p>}

                {s.benefit && (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5">
                    <Ticket className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-[12px] font-bold text-amber-700">{s.benefit.label}</span>
                  </div>
                )}

                <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Chip size="xs">{s.responsibleLabel}</Chip>
                  <span className="text-[12px] font-semibold text-slate-500 inline-flex items-center gap-1">
                    {s.productCount !== null ? `상품 ${s.productCount}개` : '상품 보기'}
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={<ShoppingBag className="w-5 h-5" />} title="열려 있는 스토어가 없습니다"
          desc={'선수와 브랜드의 새 협업이 준비되면\n이곳에서 가장 먼저 소개해드립니다.'} />
      )}

      {/* 외부몰 이동 내역 — 내부 주문과 분리 (§8.2) */}
      {exits?.exits?.length > 0 && (
        <section className="mt-10">
          <h2 className="text-[15px] font-bold text-slate-900 mb-1">브랜드몰 이동 내역</h2>
          <p className="text-[13px] text-slate-500 mb-3">SPONPIK 주문이 아닙니다. 주문 조회는 브랜드 고객센터를 이용해주세요.</p>
          <Card className="divide-y divide-slate-100">
            {exits.exits.slice(0, 5).map((e: any) => (
              <div key={e.clickId} className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                  {e.product?.imageUrl && <img src={e.product.imageUrl} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-slate-800 truncate">
                    {e.product?.name || e.store?.title}
                  </p>
                  <p className="text-[12px] text-slate-500 mt-0.5">
                    {e.store?.brandName} · {new Date(e.createdAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <Chip size="xs" tone={e.confirmed ? 'emerald' : 'slate'}>
                  {e.confirmed ? '구매확정' : '이동함'}
                </Chip>
              </div>
            ))}
          </Card>
          {exits.notice && <p className="mt-2.5 text-[12px] text-slate-500 leading-relaxed">{exits.notice}</p>}
        </section>
      )}

      {data?.notice && (
        <div className="mt-8">
          <Notice title="팬스토어 안내" items={[
            data.notice,
            'SPONPIK은 통신판매중개자로서 브랜드가 판매하는 상품의 거래 당사자가 아닙니다.',
            '팬포인트는 브랜드가 구매확정을 회신한 뒤 적립되며, 취소·반품 시 회수됩니다.',
          ]} />
        </div>
      )}
    </div>
  );
}
