/**
 * 지금 가능한 후원 — 전체 목록 (핸드오프 v1.0 §4, 시안 img_12)
 *
 * 카드의 주어는 선수가 아니라 상품/기회다 (§14.2).
 * SOLD_OUT·PAUSED는 목록에서 빼고 상세와 재오픈 알림만 유지한다 (§4.4).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bookmark, CheckCircle2, ChevronRight, Loader2, Lock, Megaphone,
  RotateCcw, Search, ShieldCheck, ShoppingCart,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import OfferCard from '../../components/offer/OfferCard';
import { api } from '../../services/api';

const TABS = [
  { key: 'ALL', label: '전체' },
  { key: 'BUY_NOW', label: '바로구매' },
  { key: 'NEEDS_APPROVAL', label: '선수확인' },
  { key: 'ONLINE_ONLY', label: '온라인전용' },
  { key: 'CLOSING', label: '마감임박' },
];

const TRUST = [
  { icon: ShieldCheck, title: '검증된 상품만 제공', desc: '구성이 완료된 상품만 등록됩니다.' },
  { icon: Megaphone, title: '간편 비교 & 빠른 시작', desc: '조건 비교 후 즉시 후원을 시작하세요.' },
  { icon: Lock, title: '안전한 거래', desc: '선수 승인 전에는 결제가 진행되지 않습니다.' },
];

export default function AvailableOffers() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();

  const [options, setOptions] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const state = sp.get('state') || 'ALL';
  const [q, setQ] = useState(sp.get('q') || '');
  const [purpose, setPurpose] = useState(sp.get('purpose') || '');
  const [budget, setBudget] = useState(sp.get('budget') || '');
  const [duration, setDuration] = useState(sp.get('duration') || '');
  const [mode, setMode] = useState(sp.get('mode') || '');
  const [sort, setSort] = useState(sp.get('sort') || 'RECENT');

  useEffect(() => {
    api.getOfferOptions().then((r: any) => setOptions(r?.data || null)).catch(() => null);
    api.getSavedOffers()
      .then((r: any) => setSavedIds((r?.data?.saved || []).map((s: any) => s.offer.id)))
      .catch(() => null); // 비로그인은 보관함 없음
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r: any = await api.listAvailableOffers({
        q: q.trim() || undefined,
        purpose: purpose || undefined,
        budget: budget || undefined,
        duration: duration || undefined,
        mode: mode || undefined,
        state: state === 'ALL' ? undefined : state,
        sort,
        limit: 24,
      });
      setData(r?.data || null);
      /* 화면에 그려진 카드만 노출로 집계한다 (§11.4) */
      const ids = (r?.data?.offers || []).map((o: any) => o.id);
      if (ids.length) api.trackOfferImpressions(ids).catch(() => null);
    } finally { setLoading(false); }
  }, [q, purpose, budget, duration, mode, state, sort]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const setParam = (patch: Record<string, string>) => {
    const next = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v); else next.delete(k);
    }
    setSp(next, { replace: true });
  };

  const needLogin = (e: any) => {
    if (e?.response?.status === 401 || e?.response?.status === 403) {
      navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return true;
    }
    return false;
  };

  const toggleSave = async (o: any) => {
    try {
      if (savedIds.includes(o.id)) {
        await api.unsaveOffer(o.id);
        setSavedIds((prev) => prev.filter((x) => x !== o.id));
      } else {
        await api.saveOffer(o.id);
        setSavedIds((prev) => [...prev, o.id]);
        setMsg('보관함에 담았습니다');
        setTimeout(() => setMsg(null), 2000);
      }
    } catch (e) { needLogin(e); }
  };

  const addCart = async (o: any) => {
    try {
      await api.addOfferToCart({ offerId: o.id });
      setSavedIds((prev) => prev.filter((x) => x !== o.id));
      setMsg('장바구니에 담았습니다');
      setTimeout(() => setMsg(null), 2000);
    } catch (e: any) {
      if (needLogin(e)) return;
      setMsg(e?.response?.data?.error?.message || '담지 못했습니다');
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const reset = () => {
    setQ(''); setPurpose(''); setBudget(''); setDuration(''); setMode(''); setSort('RECENT');
    setSp({}, { replace: true });
  };

  const counts = data?.counts ?? {};
  const offers = data?.offers ?? [];
  const filtersOn = useMemo(
    () => !!(q || purpose || budget || duration || mode || state !== 'ALL'),
    [q, purpose, budget, duration, mode, state],
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-16">
      <PublicHeader />

      {/* 히어로 */}
      <section className="bg-gradient-to-b from-[#f2faf5] to-white border-b border-slate-100 px-5 pt-6 pb-8">
        <div className="max-w-[1400px] mx-auto">
          <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[12.5px] mb-4">
            <Link to="/" className="text-slate-500 hover:text-slate-600">홈</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <Link to="/sponsor" className="text-slate-500 hover:text-slate-700">후원하기</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-bold text-emerald-700">지금 가능한 후원</span>
          </nav>
          <h1 className="text-[28px] sm:text-[38px] font-black tracking-tight">지금 가능한 후원</h1>
          <p className="mt-2.5 text-[15px] text-slate-600 break-keep">
            선수와 스폰픽이 미리 구성한 후원상품입니다. 핵심 구성은 고정돼 있고, 바로 구매 · 선수확인 · 협의 · 월 구독 · 경매 중 어떤 방식인지 카드에서 바로 알 수 있습니다.
          </p>
        </div>
      </section>

      <section className="max-w-[1400px] mx-auto px-5 pt-6">
        {/* 필터 */}
        <div className="rounded-2xl border border-slate-200 p-4 grid lg:grid-cols-[repeat(5,minmax(0,150px))_minmax(0,1fr)_auto] gap-2.5 items-center">
          <Select label="목적" value={purpose} onChange={(v) => { setPurpose(v); setParam({ purpose: v }); }}
            options={(options?.purposes || []).map((p: string) => ({ value: p, label: p }))} />
          <Select label="예산" value={budget} onChange={(v) => { setBudget(v); setParam({ budget: v }); }}
            options={(options?.budgets || []).map((b: any) => ({ value: b.code, label: b.label }))} />
          <Select label="기간" value={duration} onChange={(v) => { setDuration(v); setParam({ duration: v }); }}
            options={(options?.durations || []).map((d: any) => ({ value: d.code, label: d.label }))} />
          <Select label="후원방식" value={mode} onChange={(v) => { setMode(v); setParam({ mode: v }); }}
            options={(options?.modes || []).map((m: any) => ({ value: m.code, label: m.label }))} />
          <Select label="정렬" value={sort} onChange={(v) => { setSort(v); setParam({ sort: v }); }}
            options={(options?.sorts || []).map((s: any) => ({ value: s.code, label: s.label }))} allowEmpty={false} />
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-300" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setParam({ q: e.target.value }); }}
              placeholder="상품명, 선수명, 노출 위치 검색"
              className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 text-[13.5px] focus:outline-none focus:border-emerald-400"
            />
          </div>
          <button
            onClick={reset}
            disabled={!filtersOn}
            className="h-11 px-4 inline-flex items-center gap-1.5 rounded-xl text-[12.5px] font-bold text-slate-500 hover:text-slate-800 disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5" /> 초기화
          </button>
        </div>

        {/* 탭 */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {TABS.map((t) => {
            const on = state === t.key;
            const n = counts[t.key];
            return (
              <button
                key={t.key}
                onClick={() => setParam({ state: t.key === 'ALL' ? '' : t.key })}
                aria-pressed={on}
                className={`h-10 px-4 rounded-xl text-[13px] font-bold inline-flex items-center gap-1.5 transition-colors ${
                  on ? 'bg-emerald-600 text-white' : 'border border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {t.label}
                {n != null && (
                  <span className={`text-[12px] font-black ${on ? 'text-emerald-100' : t.key === 'CLOSING' ? 'text-rose-500' : 'text-slate-500'}`}>
                    {n}
                  </span>
                )}
              </button>
            );
          })}
          <Link
            to="/sponsor/cart"
            className="ml-auto h-10 px-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 hover:bg-slate-50"
          >
            <ShoppingCart className="w-4 h-4" /> 보관함 · 장바구니
          </Link>
        </div>

        {msg && (
          <p role="status" aria-live="polite" className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3.5 py-2 text-[12.5px] font-bold text-emerald-700">
            <CheckCircle2 className="w-4 h-4" /> {msg}
          </p>
        )}

        {/* 카드 */}
        {loading ? (
          <div className="py-24 text-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" /></div>
        ) : offers.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 py-20 text-center">
            <Bookmark className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="mt-3 text-[14px] font-bold text-slate-600">조건에 맞는 상품이 없습니다</p>
            <p className="mt-1 text-[12.5px] text-slate-500">필터를 넓히거나 직접 PICK으로 원하는 구성을 만들어보세요.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button onClick={reset} className="h-11 px-5 inline-flex items-center rounded-xl border border-slate-200 text-sm font-bold text-slate-600">
                필터 초기화
              </button>
              <Link to="/sponsor/direct/athletes" className="h-11 px-5 inline-flex items-center rounded-xl bg-emerald-600 text-white text-sm font-bold">
                직접 PICK으로 만들기
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {offers.map((o: any) => (
              <OfferCard
                key={o.id}
                offer={o}
                saved={savedIds.includes(o.id)}
                onSave={toggleSave}
                onAddCart={addCart}
              />
            ))}
          </div>
        )}

        {/* 신뢰 배너 */}
        <div className="mt-6 rounded-2xl border border-slate-200 p-5 grid sm:grid-cols-3 gap-5">
          {TRUST.map((t) => (
            <div key={t.title} className="flex items-start gap-3">
              <span className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <t.icon className="w-4 h-4 text-emerald-600" />
              </span>
              <div>
                <p className="text-[13px] font-extrabold">{t.title}</p>
                <p className="mt-0.5 text-[12.5px] text-slate-500 break-keep">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Select({ label, value, onChange, options, allowEmpty = true }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; allowEmpty?: boolean;
}) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className={`w-full h-11 px-3 rounded-xl border text-[13px] font-bold focus:outline-none focus:border-emerald-400 ${
          value ? 'border-emerald-400 text-emerald-700' : 'border-slate-200 text-slate-600'
        }`}
      >
        {allowEmpty && <option value="">{label} 전체</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
