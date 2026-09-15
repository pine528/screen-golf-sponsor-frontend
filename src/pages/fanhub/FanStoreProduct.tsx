/**
 * F13 상품 상세 · 외부 이동 `/fan/store/product/:id` — 시안 2026-09-15 (리디자인/9 · 24)
 *
 *  좌: 상품 이미지(선수 콜라보 배지)  중: 브랜드 · 상품명 · 가격 · 팬 혜택(즉시 할인 %) · 구매 확정 시 적립(예상) · 판매처 · 상품 소개 · 판매 정보
 *  우: 팬 혜택가 카드(정가 · 할인율) · 팬 전용 할인 코드(복사) · [브랜드 스토어로 이동하기] · 주문/결제 고지 · SPON Pay(준비 중 · 비활성)
 *  이동 모달: 3가지 고지 + 기록 정보 안내 + 동의 체크 → 이동하기
 */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, CheckCircle2, Copy, CreditCard, ExternalLink, HelpCircle, Info, Package, ShoppingBag, Star, Store, Ticket, X, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../../services/api';
import { AthleteAvatar, Skeleton, nf } from '../../components/fanhub/FanKit';
import { FanPage, Container, FanCrumb, BackButton, Panel } from '../../components/fanhub/FanShell';

export default function FanStoreProduct() {
  const { id = '' } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [agree, setAgree] = useState(false);
  const [copied, setCopied] = useState(false);
  const [moreDesc, setMoreDesc] = useState(false);

  useEffect(() => {
    api.getFanStoreProduct(id).then((r) => setData(r.data)).catch(() => setData(null)).finally(() => setLoading(false));
  }, [id]);

  const go = async () => {
    setExiting(true);
    try { const r = await api.exitToFanStore(data.store.id, data.product.id); window.open(r.data.url, '_blank', 'noopener,noreferrer'); setConfirm(false); setAgree(false); }
    finally { setExiting(false); }
  };
  const copyCode = () => {
    const code = data?.store?.benefit?.code; if (!code) return;
    navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <FanPage><Container className="pt-5 space-y-4"><Skeleton className="h-8 w-72" /><div className="grid grid-cols-1 lg:grid-cols-3 gap-4"><Skeleton className="h-[420px] rounded-3xl" /><Skeleton className="h-[420px] rounded-3xl" /><Skeleton className="h-[420px] rounded-3xl" /></div></Container></FanPage>;
  }
  if (!data) {
    return (
      <FanPage><Container className="py-20 text-center">
        <Package className="w-8 h-8 text-slate-300 mx-auto" /><p className="mt-3 text-[15px] font-bold text-slate-600">상품을 찾을 수 없습니다</p>
        <Link to="/fan/store" className="mt-4 inline-flex h-10 px-5 rounded-xl bg-emerald-600 text-white text-[13px] font-bold items-center">팬스토어로</Link>
      </Container></FanPage>
    );
  }

  const p = data.product;
  const s = data.store;
  const a = s.athlete;
  const code = s.benefit?.code;
  const canGo = !s.closed && !!s.externalUrl;
  const longDesc = (p.description || '').length > 160;

  return (
    <FanPage>
      <Container className="pt-5">
        <div className="flex flex-wrap items-center gap-3">
          <BackButton to={`/fan/store/${s.slug || s.id}`} label="목록으로 돌아가기" />
          <FanCrumb items={[{ label: '팬 참여', to: '/fan' }, { label: '팬스토어', to: '/fan/store' }, { label: s.brandName, to: `/fan/store/${s.slug || s.id}` }, { label: p.name }]} />
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)_340px] gap-4 items-start">
          {/* ── 이미지 ── */}
          <div className="relative rounded-3xl bg-white border border-slate-200 overflow-hidden aspect-square">
            {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center text-slate-300"><ShoppingBag className="w-12 h-12" /></span>}
            {a && (
              <Link to={`/fan/community/${a.id}`} className="absolute top-4 left-4 pl-1.5 pr-3 h-11 rounded-full bg-rose-500/90 text-white inline-flex items-center gap-2 backdrop-blur">
                <AthleteAvatar athlete={a} size={32} />
                <span className="leading-tight"><span className="block text-[12.5px] font-extrabold">{a.name} 프로</span><span className="block text-[10.5px] text-white/85">콜라보 상품</span></span>
              </Link>
            )}
            {p.isSponsored && <span className="absolute bottom-4 left-4 px-2 py-0.5 rounded-md bg-slate-900/80 text-white text-[11px] font-bold">광고 · 브랜드 협찬</span>}
          </div>

          {/* ── 정보 ── */}
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-emerald-700">{s.brandName}</p>
            <h1 className="mt-1 text-[22px] sm:text-[26px] font-extrabold tracking-[-0.02em] leading-snug break-keep">{p.name}</h1>
            <p className="mt-3 text-[26px] sm:text-[30px] font-black tabular-nums tracking-[-0.02em]">{nf(p.price)}<span className="text-[17px] font-extrabold">원</span></p>

            <ul className="mt-4 rounded-2xl border border-slate-200 divide-y divide-slate-100 text-[13.5px]">
              <li className="px-4 py-3.5 flex items-center gap-3"><Star className="w-4 h-4 text-slate-500" /><span className="flex-1 font-bold text-slate-700">팬 혜택 (즉시 할인)</span><span className="font-black text-rose-500 tabular-nums">{p.discountRate ? `${p.discountRate}%` : '—'}</span></li>
              <li className="px-4 py-3.5 flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-slate-500" /><span className="flex-1 font-bold text-slate-700">구매 확정 시 적립 (예상)</span><span className="font-black text-emerald-700 tabular-nums">{p.estimatedPoints != null ? `${nf(p.estimatedPoints)}P` : '적립 대상 아님'}</span></li>
              <li className="px-4 py-3.5 flex items-center gap-3"><Store className="w-4 h-4 text-slate-500" /><span className="flex-1 font-bold text-slate-700">판매처</span><span className="font-bold text-slate-800">{data.seller.name}</span></li>
            </ul>

            <div className="mt-5">
              <p className="text-[14px] font-extrabold">상품 소개</p>
              {p.description ? (
                <>
                  <p className={`mt-2 text-[13.5px] text-slate-700 leading-[1.75] whitespace-pre-line break-keep ${!moreDesc && longDesc ? 'line-clamp-4' : ''}`}>{p.description}</p>
                  {longDesc && <button type="button" onClick={() => setMoreDesc((v) => !v)} className="mt-1.5 text-[12.5px] font-bold text-emerald-700 inline-flex items-center gap-1">{moreDesc ? <>접기 <ChevronUp className="w-3.5 h-3.5" /></> : <>자세히 보기 <ChevronDown className="w-3.5 h-3.5" /></>}</button>}
                </>
              ) : <p className="mt-2 text-[13px] text-slate-500">상세 소개는 브랜드 스토어에서 확인해주세요.</p>}
            </div>

            <div className="mt-5">
              <p className="text-[14px] font-extrabold">판매 정보</p>
              <dl className="mt-2 rounded-2xl bg-slate-50 divide-y divide-white">
                {data.policies?.map((pol: any) => (
                  <div key={pol.key} className="px-4 py-2.5 flex gap-4 text-[12.5px]"><dt className="w-16 shrink-0 font-bold text-slate-500">{pol.label}</dt><dd className="text-slate-700 break-keep">{pol.value}</dd></div>
                ))}
              </dl>
            </div>

            <Panel className="mt-4 !p-4">
              <p className="text-[13px] font-extrabold inline-flex items-center gap-1.5"><Info className="w-4 h-4 text-slate-500" /> {data.seller.responsibleLabel}</p>
              <p className="mt-1 text-[12px] text-slate-600 break-keep">{data.seller.responsibleDesc}{data.seller.contact ? ` 문의 · ${data.seller.contact}` : ''}</p>
            </Panel>
          </div>

          {/* ── 구매 패널 ── */}
          <aside className="md:col-span-2 lg:col-span-1 rounded-3xl bg-white border border-slate-200 p-5 lg:sticky lg:top-20">
            <p className="text-[13px] font-bold text-slate-600">팬 혜택가</p>
            <p className="mt-1 flex flex-wrap items-baseline gap-2"><span className="text-[32px] font-black tabular-nums tracking-[-0.02em] text-emerald-800 leading-none">{nf(p.price)}원</span>{p.originalPrice > p.price && <span className="text-[14px] text-slate-400 line-through tabular-nums">{nf(p.originalPrice)}원</span>}{p.discountRate ? <span className="text-[14px] font-extrabold text-rose-500">{p.discountRate}%</span> : null}</p>

            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
              <p className="text-[13.5px] font-extrabold inline-flex items-center gap-1.5"><Ticket className="w-4 h-4 text-emerald-700" /> 팬 전용 할인 코드 <HelpCircle className="w-3.5 h-3.5 text-slate-400" /></p>
              {code ? (
                <>
                  <div className="mt-2.5 h-12 rounded-xl border-2 border-dashed border-emerald-300 bg-white px-4 flex items-center justify-between gap-2">
                    <span className="text-[20px] font-black text-emerald-700 tracking-wider truncate">{code}</span>
                    <button type="button" onClick={copyCode} className="h-8 px-3 rounded-lg border border-emerald-300 text-emerald-700 text-[12px] font-bold inline-flex items-center gap-1 hover:bg-emerald-50 shrink-0">{copied ? <><Check className="w-3.5 h-3.5" /> 복사됨</> : <><Copy className="w-3.5 h-3.5" /> 복사</>}</button>
                  </div>
                  <p className="mt-2 text-[12px] text-slate-600">브랜드 스토어 결제 단계에서 입력해 주세요.</p>
                  <p className="mt-0.5 text-[11.5px] text-slate-500">· 일부 상품은 쿠폰 적용이 제한될 수 있습니다.</p>
                </>
              ) : <p className="mt-2 text-[12.5px] text-slate-600 break-keep">{s.benefit?.label ? `${s.benefit.label} — 코드 없이 브랜드 스토어에서 적용됩니다.` : '이 스토어는 별도 할인 코드가 없습니다.'}</p>}
            </div>

            <button type="button" onClick={() => setConfirm(true)} disabled={!canGo}
              className="mt-4 w-full h-13 py-4 rounded-xl bg-emerald-700 text-white text-[15px] font-extrabold inline-flex items-center justify-center gap-2 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400">
              <ShoppingBag className="w-[18px] h-[18px]" /> {s.closed ? '종료된 스토어입니다' : '브랜드 스토어로 이동하기'}
            </button>
            <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-[12px] text-slate-600 flex gap-2 break-keep"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /><span>주문 및 결제는 브랜드 스토어에서 진행됩니다. SPONPIK에서는 주문 정보를 확인할 수 없습니다.</span></div>

            <div className="my-4 flex items-center gap-3 text-[11.5px] text-slate-400"><span className="flex-1 h-px bg-slate-200" />또는<span className="flex-1 h-px bg-slate-200" /></div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 opacity-70" aria-disabled>
              <p className="text-[13.5px] font-extrabold inline-flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-slate-500" /> SPON Pay로 후원과 함께 결제하기 <span className="px-1.5 rounded bg-slate-200 text-slate-600 text-[10.5px]">준비 중</span></p>
              <p className="mt-1 text-[12px] text-slate-500 break-keep">선수에게 적립금이 직접 전달되는 결제 방식은 준비 중입니다.</p>
              <button type="button" disabled className="mt-3 h-9 px-4 rounded-lg border border-slate-200 bg-white text-[12px] font-bold text-slate-400 cursor-not-allowed">자세히 보기</button>
            </div>
          </aside>
        </div>
      </Container>

      {/* ── 이동 모달 ── */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 px-4" onClick={() => setConfirm(false)}>
          <div role="dialog" aria-modal className="w-full max-w-md rounded-3xl bg-white p-6 mb-4 sm:mb-0 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <span className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 inline-flex items-center justify-center shrink-0"><ExternalLink className="w-5 h-5" /></span>
              <div className="min-w-0 flex-1"><h2 className="text-[18px] font-extrabold tracking-[-0.02em]">브랜드 스토어로 이동합니다</h2><p className="text-[12px] text-slate-500 mt-0.5">{data.seller.name}이(가) 운영하는 외부 쇼핑몰</p></div>
              <button type="button" onClick={() => setConfirm(false)} aria-label="닫기" className="w-8 h-8 rounded-full text-slate-400 hover:bg-slate-100 inline-flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
            <ul className="mt-4 space-y-2">
              {['주문, 결제, 배송, 교환/환불은 브랜드 스토어에서 처리됩니다.', 'SPONPIK은 해당 과정에 관여하지 않으며, 문의는 브랜드 스토어로 해주세요.', '이동 후 구매를 완료해야 팬 혜택(할인, 포인트 적립 등)이 적용됩니다.'].map((t) => (
                <li key={t} className="flex gap-2 text-[13px] text-slate-700 break-keep"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-px" />{t}</li>
              ))}
            </ul>
            <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-[12px] text-slate-600 break-keep">
              <p className="font-bold text-slate-700 inline-flex items-center gap-1"><Info className="w-3.5 h-3.5" /> SPONPIK는 팬 혜택 제공을 위해 클릭 정보를 익명으로 기록합니다.</p>
              <p className="mt-0.5">기록되는 정보: 클릭 일시, 상품 정보 (개인 식별 정보는 포함되지 않습니다.){p.pointRate ? ` 구매 확정이 확인되면 약 ${nf(p.estimatedPoints)}P가 적립됩니다.` : ''}</p>
            </div>
            <label className="mt-4 flex items-center gap-2.5 text-[13px] cursor-pointer"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="w-[18px] h-[18px] accent-emerald-600" /> 위 내용을 확인했으며, 브랜드 스토어로 이동하는 것에 동의합니다.</label>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setConfirm(false)} className="h-12 rounded-xl border border-slate-200 text-slate-700 text-[14px] font-bold hover:bg-slate-50">취소</button>
              <button type="button" onClick={go} disabled={!agree || exiting} className="h-12 rounded-xl bg-emerald-700 text-white text-[14px] font-extrabold hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400">{exiting ? '이동 중…' : '이동하기'}</button>
            </div>
          </div>
        </div>
      )}
    </FanPage>
  );
}
