/**
 * F12 팬스토어 상세 `/fan/store/:idOrSlug` — 시안 2026-09-15 (리디자인/9 · 23)
 *
 *  좌: 히어로 배너(선수 × 브랜드 · 제목 · 요약) + "선수와 브랜드가 함께 전하는 진심"(스토리)
 *  우: 팬 혜택(전용 할인 코드 · 코드 받기 · 혜택 설명 · 팬 포인트 적립 · 기간 한정) → 외부 스토어 바로가기 (AR 보기는 미연동 → 비활성)
 *  → 판매 및 배송 책임 스트립 → 팬들의 응원(누적: 스토어 방문 · 상품 구매 · 응원 메시지) + 팬 스토어 상품(NEW/SALE 배지)
 *  값은 실데이터만 — 방문은 viewCount, 구매는 브랜드가 확정 회신한 건, 메시지는 커뮤니티 공개 글.
 */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bookmark, Box, CalendarDays, Check, Copy, ExternalLink, Eye, Heart, Info, MessageCircle, Percent, ShoppingBag, ShoppingCart, Store, Ticket, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';
import { AthleteAvatar, Skeleton, nf } from '../../components/fanhub/FanKit';
import { FanPage, Container, FanCrumb, BackButton, Panel, fmtDate } from '../../components/fanhub/FanShell';

export default function FanStoreDetail() {
  const { idOrSlug = '' } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getFanStore(idOrSlug).then((r) => setData(r.data)).catch(() => setData(null)).finally(() => setLoading(false));
  }, [idOrSlug]);
  useEffect(() => {
    try { const w = JSON.parse(localStorage.getItem('sponpik.store.saved') || '[]'); setSaved(!!data?.id && w.includes(data.id)); } catch { /* noop */ }
  }, [data?.id]);

  const toggleSave = () => {
    if (!data?.id) return;
    try {
      const w: string[] = JSON.parse(localStorage.getItem('sponpik.store.saved') || '[]');
      const next = w.includes(data.id) ? w.filter((x) => x !== data.id) : [...w, data.id];
      localStorage.setItem('sponpik.store.saved', JSON.stringify(next)); setSaved(next.includes(data.id));
    } catch { /* noop */ }
  };
  const copyCode = () => {
    if (!data?.benefit?.code) return;
    navigator.clipboard?.writeText(data.benefit.code); setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  const goExternal = async (productId?: string) => {
    setExiting(true);
    try { const r = await api.exitToFanStore(data.id, productId); window.open(r.data.url, '_blank', 'noopener,noreferrer'); }
    catch { /* 서버 오류 — 버튼은 externalUrl 있을 때만 활성 */ }
    finally { setExiting(false); }
  };

  if (loading) {
    return <FanPage><Container className="pt-5 space-y-4"><Skeleton className="h-8 w-60" /><Skeleton className="h-[380px] rounded-3xl" /><Skeleton className="h-[260px] rounded-3xl" /></Container></FanPage>;
  }
  if (!data) {
    return (
      <FanPage><Container className="py-20 text-center">
        <Store className="w-8 h-8 text-slate-300 mx-auto" /><p className="mt-3 text-[15px] font-bold text-slate-600">스토어를 찾을 수 없습니다</p>
        <Link to="/fan/store" className="mt-4 inline-flex h-10 px-5 rounded-xl bg-emerald-600 text-white text-[13px] font-bold items-center">팬스토어로</Link>
      </Container></FanPage>
    );
  }

  const a = data.athlete;
  const b = data.benefit;
  const products: any[] = data.products || [];
  const title = `${a?.name ? `${a.name} 프로` : ''} × ${data.brandName}`;

  return (
    <FanPage>
      <Container className="pt-5">
        <div className="flex flex-wrap items-center gap-3">
          <BackButton to="/fan/store" label="팬스토어 목록으로" />
          <FanCrumb items={[{ label: '팬 참여', to: '/fan' }, { label: '팬스토어', to: '/fan/store' }, { label: title }]} />
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-4 items-start">
          {/* ── 히어로 + 스토리 ── */}
          <section className="rounded-3xl bg-white border border-slate-200 overflow-hidden">
            <div className="relative aspect-[16/7] min-h-[220px] bg-gradient-to-br from-emerald-100 via-[#ecf8f1] to-amber-50 overflow-hidden">
              {data.heroImageUrl && <img src={data.heroImageUrl} alt={data.title} className="absolute inset-0 w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-transparent" />
              <div className="absolute left-5 sm:left-8 right-5 bottom-5 sm:bottom-8 text-white">
                <p className="text-[12.5px] font-bold text-white/85 inline-flex items-center gap-2">{a && <AthleteAvatar athlete={a} size={26} />}{title}</p>
                <h1 className="mt-1.5 text-[24px] sm:text-[34px] font-extrabold tracking-[-0.03em] leading-tight break-keep drop-shadow">{data.title}</h1>
                {data.summary && <p className="mt-2 font-script text-[20px] sm:text-[24px] text-amber-200 leading-none drop-shadow">{/[A-Za-z]/.test(data.summary) && !/[가-힣]/.test(data.summary) ? data.summary : ''}</p>}
                {data.summary && /[가-힣]/.test(data.summary) && <p className="mt-2 text-[13.5px] text-white/90 break-keep max-w-xl">{data.summary}</p>}
              </div>
              {data.closed && <span className="absolute top-4 left-4 px-2.5 py-1 rounded-md bg-slate-900/80 text-white text-[11.5px] font-extrabold">종료된 스토어</span>}
            </div>
            <div className="p-5 sm:p-6 flex gap-4">
              <span className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 inline-flex items-center justify-center shrink-0"><Heart className="w-6 h-6 fill-current" /></span>
              <div className="min-w-0">
                <p className="text-[15px] font-extrabold text-emerald-800">선수와 브랜드가 함께 전하는 진심</p>
                <p className="mt-1.5 text-[13.5px] text-slate-700 leading-relaxed whitespace-pre-line break-keep">{data.story || data.summary || `${a?.name || '선수'} 프로와 ${data.brandName}의 협업 스토어입니다.`}</p>
              </div>
            </div>
          </section>

          {/* ── 팬 혜택 ── */}
          <aside className="relative rounded-3xl bg-white border border-slate-200 p-5">
            <button type="button" onClick={toggleSave} aria-pressed={saved} aria-label="스토어 저장" className={`absolute right-5 -top-px w-9 h-11 rounded-b-xl inline-flex items-center justify-center ${saved ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'}`}><Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} /></button>
            <p className="text-[16px] font-extrabold">팬 혜택</p>
            <ul className="mt-3 rounded-2xl border border-slate-200 divide-y divide-slate-100">
              <li className="p-4 flex gap-3">
                <span className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 inline-flex items-center justify-center shrink-0"><Ticket className="w-[18px] h-[18px]" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] text-slate-600">팬 전용 할인 코드</p>
                  {b?.code ? (
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="flex-1 h-10 px-3 rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50/40 text-[16px] font-black text-emerald-700 tracking-wider inline-flex items-center">{b.code}</span>
                      <button type="button" onClick={copyCode} className="h-10 px-3 rounded-lg bg-emerald-600 text-white text-[12px] font-bold inline-flex items-center gap-1 hover:bg-emerald-700">{copied ? <><Check className="w-3.5 h-3.5" /> 복사됨</> : <><Copy className="w-3.5 h-3.5" /> 코드 받기</>}</button>
                    </div>
                  ) : <p className="mt-1 text-[13px] font-bold text-slate-500">이 스토어는 별도 코드 없이 혜택이 적용됩니다</p>}
                </div>
              </li>
              <li className="p-4 flex gap-3">
                <span className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 inline-flex items-center justify-center shrink-0"><Percent className="w-[18px] h-[18px]" /></span>
                <div><p className="text-[14px] font-extrabold">{b?.label || '팬 전용 혜택'}</p><p className="text-[12px] text-slate-500 break-keep">{b?.desc || '혜택 내용은 브랜드 스토어에서 확인할 수 있습니다.'}</p></div>
              </li>
              <li className="p-4 flex gap-3">
                <span className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 inline-flex items-center justify-center shrink-0"><ShoppingBag className="w-[18px] h-[18px]" /></span>
                <div><p className="text-[14px] font-extrabold">팬 포인트 적립</p><p className="text-[12px] text-slate-500 break-keep">{data.pointRatePercent ? `구매 확정 시 구매 금액의 ${data.pointRatePercent}% 적립 (SPONPIK 팬포인트)` : '이 스토어 상품은 포인트 적립 대상이 아닙니다'}</p></div>
              </li>
              <li className="p-4 flex gap-3">
                <span className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 inline-flex items-center justify-center shrink-0"><CalendarDays className="w-[18px] h-[18px]" /></span>
                <div><p className="text-[14px] font-extrabold">{data.endAt ? '기간 한정 혜택' : '상시 운영'}</p><p className="text-[12px] text-slate-500 tabular-nums">{data.startAt || data.endAt ? `${data.startAt ? fmtDate(data.startAt) : ''} ~ ${data.endAt ? fmtDate(data.endAt) : ''}` : '종료일이 정해지면 안내됩니다'}{data.daysLeft != null && data.daysLeft <= 7 ? ` · D-${data.daysLeft}` : ''}</p></div>
              </li>
            </ul>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => goExternal()} disabled={exiting || data.closed || !data.externalUrl}
                className="h-12 rounded-xl border-2 border-emerald-600 text-emerald-700 text-[13.5px] font-extrabold inline-flex items-center justify-center gap-1.5 hover:bg-emerald-50 disabled:border-slate-200 disabled:text-slate-400 disabled:bg-slate-50">
                {exiting ? '이동 중…' : <>외부 스토어 바로가기 <ExternalLink className="w-4 h-4" /></>}
              </button>
              <button type="button" disabled title="AR 콘텐츠는 준비 중입니다" className="h-12 rounded-xl border border-slate-200 text-slate-400 text-[13.5px] font-bold inline-flex items-center justify-center gap-1.5 bg-slate-50 cursor-not-allowed"><Box className="w-4 h-4" /> AR 보기 <span className="text-[10.5px] font-extrabold px-1.5 rounded bg-slate-200 text-slate-500">준비 중</span></button>
            </div>
            {data.closed && <p className="mt-2 text-[12px] text-rose-500 font-bold">종료된 스토어는 외부 이동이 제공되지 않습니다.</p>}
          </aside>
        </div>

        {/* ── 책임 스트립 ── */}
        <div className="mt-4 rounded-2xl bg-white border border-slate-200 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-2 text-[12.5px]">
          <span className="inline-flex items-start sm:items-center gap-2 break-keep"><Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 sm:mt-0" /><b className="text-slate-800 shrink-0">판매 및 배송 책임</b><span className="text-slate-600">본 스토어는 '{data.sellerName || data.brandName}'에서 운영하며, 상품 판매·배송·교환/환불은 {data.responsible === 'SPONPIK' ? 'SPONPIK' : '브랜드 스토어'} 정책을 따릅니다.</span></span>
          <a href="#disclosure" className="sm:ml-auto font-bold text-slate-700 inline-flex items-center gap-1 shrink-0">자세히 보기 <ChevronRight className="w-3.5 h-3.5" /></a>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[200px_minmax(0,1fr)] gap-4 items-start">
          {/* ── 팬들의 응원 ── */}
          <Panel>
            <p className="text-[15px] font-extrabold">팬들의 응원 <span className="text-[11.5px] text-slate-500 font-bold">(누적)</span></p>
            <ul className="mt-2 divide-y divide-slate-100">
              {[
                { icon: Eye, k: '스토어 방문', v: data.stats?.views, unit: '회' },
                { icon: ShoppingCart, k: '상품 구매', v: data.stats?.purchases, unit: '건', hint: '브랜드 확정 회신 기준' },
                { icon: MessageCircle, k: '응원 메시지', v: data.stats?.messages, unit: '개', hint: `${a?.name || '선수'} 프로 커뮤니티` },
              ].map((x) => { const I = x.icon; return (
                <li key={x.k} className="py-3 flex items-center gap-3">
                  <span className="w-9 h-9 rounded-lg bg-slate-50 text-slate-500 inline-flex items-center justify-center shrink-0"><I className="w-4 h-4" /></span>
                  <div className="min-w-0"><p className="text-[12px] text-slate-500">{x.k}</p><p className="text-[16px] font-black tabular-nums text-emerald-700 leading-none mt-0.5">{x.v != null ? nf(x.v) : '집계 중'}<span className="text-[11px] text-slate-500 font-bold ml-0.5">{x.v != null ? x.unit : ''}</span></p>{x.hint && <p className="text-[10.5px] text-slate-400">{x.hint}</p>}</div>
                </li>
              ); })}
            </ul>
          </Panel>

          {/* ── 상품 ── */}
          <Panel>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[15px] font-extrabold">팬 스토어 상품</p>
              {data.externalUrl && !data.closed && <button type="button" onClick={() => goExternal()} className="text-[12px] font-bold text-slate-600 inline-flex items-center gap-1 hover:text-slate-900">전체 상품 보기 <ChevronRight className="w-3.5 h-3.5" /></button>}
            </div>
            <p className="mt-1 text-[12px] text-slate-500 inline-flex items-center gap-1"><ExternalLink className="w-3.5 h-3.5" /> 구매는 브랜드 스토어에서 진행됩니다. SPONPIK 주문이 아닙니다.</p>
            {products.length ? (
              <div className="mt-3 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                {products.map((p) => (
                  <Link key={p.id} to={`/fan/store/product/${p.id}`} className="group rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-emerald-400 hover:shadow-[0_12px_30px_-18px_rgba(16,185,129,0.5)] transition">
                    <div className="relative aspect-square bg-slate-100 overflow-hidden">
                      {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-[1.03] transition" /> : <span className="w-full h-full flex items-center justify-center text-slate-300"><ShoppingBag className="w-8 h-8" /></span>}
                      {(p.isNew || p.discountRate || p.isSponsored) && (
                        <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10.5px] font-extrabold text-white ${p.discountRate ? 'bg-rose-500' : p.isNew ? 'bg-emerald-600' : 'bg-slate-700'}`}>{p.discountRate ? `SALE ${p.discountRate}%` : p.isNew ? 'NEW' : '광고'}</span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-[13.5px] font-extrabold truncate" title={p.name}>{p.name}</p>
                      {p.description && <p className="mt-0.5 text-[11.5px] text-slate-500 truncate">{p.description}</p>}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[14.5px] font-black tabular-nums">{nf(p.price)}원 {p.originalPrice > p.price && <span className="text-[11px] text-slate-400 line-through font-bold">{nf(p.originalPrice)}</span>}{p.discountRate ? <span className="ml-1 text-[11px] text-rose-500 font-extrabold">{p.discountRate}%</span> : null}</span>
                        <span className="w-8 h-8 rounded-full border border-emerald-200 text-emerald-700 inline-flex items-center justify-center shrink-0"><ShoppingCart className="w-3.5 h-3.5" /></span>
                      </div>
                      {p.estimatedPoints != null && <p className="mt-1 text-[11px] text-emerald-700 font-bold">구매 확정 시 약 {nf(p.estimatedPoints)}P</p>}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 py-10 text-center"><p className="text-[13.5px] font-bold text-slate-600">등록된 상품이 없습니다</p><p className="text-[12px] text-slate-500">브랜드 스토어에서 전체 상품을 확인해주세요.</p></div>
            )}
          </Panel>
        </div>

        {/* ── 거래 고지 · 판매자 ── */}
        <div id="disclosure" className="mt-4 rounded-2xl bg-white border border-slate-200 p-5 grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-5">
          <div>
            <p className="text-[13.5px] font-extrabold inline-flex items-center gap-1.5"><Store className="w-4 h-4 text-slate-500" /> {data.responsibleLabel}</p>
            <p className="mt-1.5 text-[12.5px] text-slate-600 break-keep">{data.responsibleDesc}</p>
            <dl className="mt-3 text-[12.5px] space-y-1">
              {data.sellerName && <div className="flex gap-2"><dt className="text-slate-500 w-14 shrink-0">판매자</dt><dd className="font-bold text-slate-800">{data.sellerName}</dd></div>}
              {data.sellerContact && <div className="flex gap-2"><dt className="text-slate-500 w-14 shrink-0">문의</dt><dd className="font-bold text-slate-800">{data.sellerContact}</dd></div>}
            </dl>
          </div>
          <div>
            <p className="text-[13.5px] font-extrabold">거래 고지</p>
            <ul className="mt-1.5 space-y-1">{(data.disclosures || []).map((t: string) => <li key={t} className="flex gap-2 text-[12.5px] text-slate-600 break-keep"><span className="w-1 h-1 rounded-full bg-slate-400 mt-2 shrink-0" />{t}</li>)}</ul>
            {data.exitNotice?.length > 0 && <><p className="mt-3 text-[13.5px] font-extrabold">브랜드 스토어로 이동하기 전에</p><ul className="mt-1.5 space-y-1">{data.exitNotice.map((t: string) => <li key={t} className="flex gap-2 text-[12.5px] text-slate-600 break-keep"><span className="w-1 h-1 rounded-full bg-slate-400 mt-2 shrink-0" />{t}</li>)}</ul></>}
          </div>
        </div>
      </Container>
    </FanPage>
  );
}
