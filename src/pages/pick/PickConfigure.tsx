/**
 * 직접 PICK 3단계 — 후원 구성 (리디자인 v2.0 시안 img_14)
 *
 * 기간 · 유형 · 추가 활동 · 구매 방식을 고르면 금액은 서버 견적(§14.4)으로
 * 다시 계산해 받아온다. 클라이언트에서 합산한 금액은 표시하지 않는다.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, BarChart3, CheckCircle2, ChevronRight, FileSignature,
  Loader2, PenLine, ShieldCheck,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import { api } from '../../services/api';

const STEPS = ['선수 선택', '슬롯 선택', '후원 구성', '확인 · 결제'];
const DRAFT_KEY = 'sponpik.directPick.draft';

const TRUST = [
  { icon: ShieldCheck, title: '표준계약', desc: '공정하고 투명한 표준계약서 제공' },
  { icon: FileSignature, title: '전자확인', desc: '모든 계약은 전자 서명으로 안전하게' },
  { icon: CheckCircle2, title: '활동검증', desc: '노출 이행을 검증하여 신뢰도 확보' },
  { icon: BarChart3, title: 'ROI 리포트 제공', desc: '후원 성과 리포트로 효과를 확인' },
];

export default function PickConfigure() {
  const { athleteId } = useParams();
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const slotCode = sp.get('slot');

  const [options, setOptions] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [duration, setDuration] = useState('SINGLE_EVENT');
  const [productType, setProductType] = useState('APPAREL');
  const [addOns, setAddOns] = useState<string[]>([]);
  const [transactionType, setTransactionType] = useState('BUY_NOW');
  const [quote, setQuote] = useState<any>(null);
  const [quoting, setQuoting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [o, d]: any[] = await Promise.all([api.getPickOptions(), api.getPickAthlete(athleteId!)]);
      setOptions(o?.data || null);
      setDetail(d?.data || null);
    })();
  }, [athleteId]);

  /* 임시저장 복원 */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.athleteId !== athleteId || d.slotCode !== slotCode) return;
      setDuration(d.duration || 'SINGLE_EVENT');
      setProductType(d.productType || 'APPAREL');
      setAddOns(d.addOns || []);
      setTransactionType(d.transactionType || 'BUY_NOW');
    } catch { /* 저장값이 깨졌으면 기본값으로 시작한다 */ }
  }, [athleteId, slotCode]);

  const auctionBlocked = useMemo(
    () => (options?.auctionBlockedDurations || []).includes(duration),
    [options, duration],
  );
  useEffect(() => {
    if (auctionBlocked && transactionType === 'AUCTION') setTransactionType('BUY_NOW');
  }, [auctionBlocked, transactionType]);

  const refreshQuote = useCallback(async () => {
    if (!slotCode) return;
    setQuoting(true);
    setErr(null);
    try {
      const r: any = await api.getDirectPickQuote({
        athleteId, slotCode, durationCode: duration, productType, addOns, transactionType,
      });
      setQuote(r?.data || null);
    } catch (e: any) {
      setErr(e?.response?.data?.error?.message || '견적을 계산하지 못했습니다');
      setQuote(null);
    } finally { setQuoting(false); }
  }, [athleteId, slotCode, duration, productType, addOns, transactionType]);

  useEffect(() => { refreshQuote(); }, [refreshQuote]);

  const saveDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ athleteId, slotCode, duration, productType, addOns, transactionType }));
    setErr(null);
  };

  const submit = async () => {
    if (!quote) return;
    setSubmitting(true);
    setErr(null);
    try {
      const r: any = await api.submitApplication({
        sourceType: 'DIRECT_PICK',
        items: [{ athleteId, slotCode, slotName: quote.slot.name, role: quote.productType.label }],
        config: { durationCode: duration, productType, transactionType, addOns },
      });
      localStorage.removeItem(DRAFT_KEY);
      navigate(`/sponsor/applications/${r.data.id}`);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401) { navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`); return; }
      setErr(status === 403 ? '브랜드 계정으로 로그인하면 신청할 수 있어요.' : e?.response?.data?.error?.message || '신청에 실패했습니다');
    } finally { setSubmitting(false); }
  };

  if (!options || !detail) {
    return (
      <div className="min-h-screen bg-white">
        <PublicHeader />
        <div className="py-24 text-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" /></div>
      </div>
    );
  }

  if (!slotCode) {
    return (
      <div className="min-h-screen bg-white">
        <PublicHeader />
        <div className="max-w-lg mx-auto px-5 py-24 text-center">
          <p className="text-[15px] font-bold">후원할 슬롯을 먼저 선택해주세요</p>
          <Link to={`/sponsor/pick/${athleteId}/slots`} className="mt-5 inline-flex h-11 px-5 items-center rounded-xl bg-emerald-600 text-white text-sm font-bold">
            슬롯 선택으로 이동
          </Link>
        </div>
      </div>
    );
  }

  const a = detail.athlete;
  const num = (n: number) => n.toLocaleString();

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-16">
      <PublicHeader />

      <div className="max-w-[1400px] mx-auto px-5 pt-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[12.5px]">
            <Link to="/" className="text-slate-400 hover:text-slate-600">홈</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <Link to="/sponsor/pick" className="text-slate-400 hover:text-slate-600">직접 PICK</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-bold text-emerald-700">후원 구성</span>
          </nav>
          <ol className="flex items-center gap-1.5 overflow-x-auto">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-1.5 shrink-0">
                <span className={`w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center ${
                  i < 2 ? 'bg-emerald-100 text-emerald-700' : i === 2 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                }`}>{i + 1}</span>
                <span className={`text-[12px] font-bold ${i === 2 ? 'text-emerald-700' : 'text-slate-400'}`}>{s}</span>
                {i < STEPS.length - 1 && <span className="w-5 h-px bg-slate-200 mx-1" />}
              </li>
            ))}
          </ol>
        </div>

        <Link to={`/sponsor/pick/${athleteId}/slots?slot=${slotCode}`} className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-emerald-700 hover:text-emerald-800">
          <ArrowLeft className="w-4 h-4" /> 슬롯 선택으로 돌아가기
        </Link>

        <h1 className="mt-3 text-[26px] sm:text-[32px] font-black tracking-tight">후원 구성을 완성하세요</h1>
        <p className="mt-2 text-[13.5px] text-slate-500">기간과 활동을 선택하면 예상 후원금액이 바로 계산됩니다.</p>

        <div className="mt-6 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] gap-5 items-start">
          <div className="space-y-3">
            {/* 1 후원 기간 */}
            <Row n={1} title="후원 기간">
              <div className="flex flex-wrap gap-2">
                {options.durations.map((d: any) => (
                  <Chip key={d.code} on={duration === d.code} onClick={() => setDuration(d.code)}>
                    {d.label}
                  </Chip>
                ))}
              </div>
            </Row>

            {/* 2 후원 유형 */}
            <Row n={2} title="후원 유형">
              <div className="flex flex-wrap gap-2">
                {options.productTypes.map((p: any) => (
                  <Chip key={p.code} on={productType === p.code} onClick={() => setProductType(p.code)} title={p.desc}>
                    {p.label}
                  </Chip>
                ))}
              </div>
            </Row>

            {/* 3 선택 슬롯 */}
            <Row n={3} title="선택 슬롯">
              <div className="flex flex-wrap items-center gap-3">
                <span className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                  {a.profileImageUrl && <img src={a.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] font-extrabold">
                    {a.name} <span className="text-[11.5px] font-bold text-slate-400">프로</span>
                    <span className="text-slate-300 mx-1.5">·</span>
                    {quote?.slot?.name || '-'}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-emerald-600 font-bold">
                    월 단가 {quote ? `${num(quote.slot.monthlyPrice)}원` : '-'}
                  </p>
                </div>
                <p className="ml-auto text-[17px] font-black tabular-nums">
                  {quote ? `${num(quote.slotAmount)}원` : '-'}
                </p>
                <Link
                  to={`/sponsor/pick/${athleteId}/slots?slot=${slotCode}`}
                  className="h-10 px-4 inline-flex items-center rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 hover:bg-slate-50"
                >
                  슬롯 변경
                </Link>
              </div>
            </Row>

            {/* 4 추가 활동 */}
            <Row n={4} title="추가 활동" hint={'선택하지 않아도\n기본 착장 후원으로\n진행할 수 있습니다.'}>
              <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {options.addOns.map((o: any) => {
                  const on = addOns.includes(o.code);
                  return (
                    <button
                      key={o.code}
                      onClick={() => setAddOns(on ? addOns.filter((x) => x !== o.code) : [...addOns, o.code])}
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        on ? 'border-emerald-500 bg-emerald-50/60' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          on ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
                        }`}>
                          {on && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </span>
                        <span className="text-[12.5px] font-bold">{o.label}</span>
                      </span>
                      <span className="mt-1.5 block text-[12.5px] font-extrabold text-emerald-600">+{num(o.price)}원</span>
                    </button>
                  );
                })}
              </div>
            </Row>

            {/* 5 구매 방식 */}
            <Row n={5} title="구매 방식">
              <div className="flex flex-wrap gap-2">
                {options.transactionTypes.map((t: any) => {
                  const blocked = t.code === 'AUCTION' && auctionBlocked;
                  return (
                    <Chip
                      key={t.code}
                      on={transactionType === t.code}
                      disabled={blocked}
                      onClick={() => !blocked && setTransactionType(t.code)}
                      title={blocked ? '6개월 이상 장기 상품은 경매로 판매하지 않습니다' : t.desc}
                    >
                      {t.label}
                    </Chip>
                  );
                })}
              </div>
              {auctionBlocked && (
                <p className="mt-2 text-[11.5px] text-slate-400">6개월 이상 장기 상품은 경매로 판매하지 않습니다.</p>
              )}
            </Row>
          </div>

          {/* 우: 요약 */}
          <aside className="lg:sticky lg:top-24 rounded-2xl border border-slate-200 p-5">
            <h2 className="text-[15px] font-extrabold">후원 구성 요약</h2>

            <div className="mt-4 flex items-center gap-3 pb-4 border-b border-slate-100">
              <span className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 shrink-0">
                {a.profileImageUrl && <img src={a.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}
              </span>
              <div>
                <p className="text-[15px] font-extrabold">{a.name} <span className="text-[11.5px] font-bold text-slate-400">프로</span></p>
                <p className="text-[11.5px] text-slate-400">{[a.tour, a.region].filter(Boolean).join(' · ')}</p>
              </div>
            </div>

            <dl className="mt-4 space-y-2.5 text-[13px]">
              <SumRow k="선수" v={a.name} />
              <SumRow k="기간" v={quote?.duration?.label || '-'} />
              <SumRow k="유형" v={quote?.productType?.label || '-'} />
              <SumRow k="슬롯" v={quote?.slot?.name || '-'} />
              <SumRow k="구매 방식" v={quote?.transactionType?.label || '-'} />
              <SumRow k="추가활동" v={quote?.addOns?.length ? quote.addOns.map((o: any) => o.label).join(' · ') : '선택 안 함'} />
            </dl>

            <dl className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-[13px]">
              <div className="flex justify-between"><dt className="text-slate-500">기본 슬롯가</dt><dd className="font-bold tabular-nums">{quote ? `${num(quote.slotAmount)}원` : '-'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">추가 활동</dt><dd className="font-bold tabular-nums">{quote ? `${num(quote.addOnAmount)}원` : '-'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">VAT (10%)</dt><dd className="font-bold tabular-nums">{quote ? `${num(quote.vatAmount)}원` : '-'}</dd></div>
            </dl>

            <div className="mt-4 pt-4 border-t border-slate-200 flex items-baseline justify-between gap-3">
              <span className="text-[13px] font-bold">예상 후원금액</span>
              <span className="text-[24px] font-black text-emerald-600 tabular-nums">
                {quoting ? <Loader2 className="w-5 h-5 animate-spin" /> : quote ? `${num(quote.total)}원` : '-'}
              </span>
            </div>
            {quote && <p className="mt-1 text-right text-[11px] text-slate-400">{quote.pricingRule} · VAT 포함</p>}

            {err && <p className="mt-3 text-[12.5px] font-bold text-rose-600 break-keep">{err}</p>}

            <p className="mt-3 text-[11.5px] text-slate-400 break-keep">
              신청은 결제가 아닙니다. 선수 승인 후 계약조건을 확인하고 결제가 진행됩니다.
            </p>

            <button
              onClick={submit}
              disabled={!quote || submitting || quoting}
              className="mt-3 w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white text-[14.5px] font-bold hover:bg-emerald-700 disabled:opacity-40"
            >
              {submitting ? '신청 중…' : <>계약내용 확인하기 <ChevronRight className="w-4 h-4" /></>}
            </button>
            <button
              onClick={saveDraft}
              className="mt-2 w-full h-11 inline-flex items-center justify-center gap-1.5 rounded-xl text-[13px] font-bold text-emerald-700 hover:bg-emerald-50"
            >
              <PenLine className="w-4 h-4" /> 임시저장
            </button>
          </aside>
        </div>

        {/* 신뢰 배너 */}
        <div className="mt-6 rounded-2xl border border-slate-200 p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TRUST.map((t) => (
            <div key={t.title} className="flex items-start gap-3">
              <span className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <t.icon className="w-4 h-4 text-emerald-600" />
              </span>
              <div>
                <p className="text-[13px] font-extrabold">{t.title}</p>
                <p className="mt-0.5 text-[11.5px] text-slate-500 break-keep">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 p-4 sm:p-5 grid sm:grid-cols-[140px_minmax(0,1fr)] gap-3 sm:gap-5 items-start">
      <div className="flex items-start gap-2">
        <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-[11px] font-black flex items-center justify-center shrink-0">{n}</span>
        <div>
          <p className="text-[14px] font-extrabold">{title}</p>
          {hint && <p className="mt-1 text-[11px] text-slate-400 whitespace-pre-line break-keep">{hint}</p>}
        </div>
      </div>
      <div>{children}</div>
    </section>
  );
}

function Chip({ on, disabled, onClick, title, children }: {
  on: boolean; disabled?: boolean; onClick: () => void; title?: string; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={on}
      className={`h-11 px-5 rounded-xl text-[13.5px] font-bold transition-colors ${
        disabled ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
          : on ? 'bg-emerald-500 text-white'
          : 'border border-slate-200 text-slate-600 hover:border-emerald-300'
      }`}
    >
      {children}
    </button>
  );
}

function SumRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500 shrink-0">{k}</dt>
      <dd className="font-bold text-right break-keep">{v}</dd>
    </div>
  );
}
