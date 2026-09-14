/**
 * 직접 선택 PICK 8단계 — 계약 · 결제 (핸드오프 v1.0 §10, 시안 img_06·img_08)
 *
 * 승인된 항목만 청구한다. 중복 클릭은 서버 상태로 차단된다 (§10.2).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle, Ban, Building2, ChevronDown, CreditCard, FileText,
  Loader2, Lock, ShieldCheck, Wallet,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import DirectStepBar from '../../components/direct/DirectStepBar';
import { api } from '../../services/api';

const AGREEMENTS = [
  '후원 계약서 및 위 약관의 내용을 모두 확인하였으며, 이에 동의합니다.',
  '개인(신용)정보 수집·이용 및 제3자 제공에 동의합니다.',
  '결제 진행에 동의하며, 결제 이후에는 취소 및 환불 규정에 따릅니다.',
];

const CONTRACT_TERMS = [
  { title: '활용 제한 사항', body: '온라인 전용 상품은 오프라인 대회 현장에서 사용할 수 없습니다. 브랜드 자체 광고 집행과 제3자 유통은 별도 협의가 필요합니다.' },
  { title: '제공 내역 (딜리버러블)', body: '상품별 노출 위치와 기간, 추가 활동 횟수는 승인된 조건 그대로 이행됩니다.' },
  { title: '실행 일정', body: '패치 제작 리드타임을 고려해 시작일이 조정될 수 있으며, 변경 시 사전 안내합니다.' },
  { title: '계약 해지 및 환불', body: '선수 불참·대회 취소 등 이행 불가 사유가 발생하면 잔여 기간에 대해 정산합니다.' },
];

const METHODS = [
  { code: 'CARD', label: '신용카드', desc: '가장 빠르고 간편해요', icon: CreditCard },
  { code: 'TRANSFER', label: '계좌이체', desc: '주문 후 24시간 이내 입금', icon: Building2 },
  { code: 'SPON_PAY', label: 'SPON Pay', desc: 'SPON Pay 잔액으로 결제', icon: Wallet },
];

export default function DirectCheckout() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const partial = sp.get('partial') === '1';

  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [agreed, setAgreed] = useState<number[]>([]);
  const [method, setMethod] = useState('CARD');
  const [openTerm, setOpenTerm] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const r: any = await api.getApplication(applicationId!);
      setApp(r?.data || null);
      /* 결제 진입 시 hold 10분 1회 연장 (§6.2) */
      const draftId = r?.data?.snapshot?.draftId;
      if (draftId) await api.extendDirectHold(draftId).catch(() => null);
    } catch (e: any) {
      if (e?.response?.status === 401) { navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`); return; }
      setErr(e?.response?.data?.error?.message || '결제 정보를 불러오지 못했습니다');
    } finally { setLoading(false); }
  }, [applicationId, navigate]);
  useEffect(() => { load(); }, [load]);

  const approved = useMemo(() => (app?.items || []).filter((i: any) => i.status === 'APPROVED'), [app]);
  const pendingCount = (app?.items || []).length - approved.length;
  const supply = approved.reduce((s: number, i: any) => s + i.price, 0);
  const vat = Math.round(supply * 0.1);
  const canPay = approved.length > 0 && agreed.length === AGREEMENTS.length && app?.status !== 'ACTIVE';

  const pay = async () => {
    setPaying(true);
    setErr(null);
    try {
      const r: any = await api.checkoutApplication(applicationId!, {});
      setApp(r?.data);
      navigate(`/sponsor/direct/complete/${applicationId}`);
    } catch (e: any) {
      setErr(e?.response?.data?.error?.message || '결제를 완료하지 못했습니다');
    } finally { setPaying(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <PublicHeader />
        <div className="py-24 text-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" /></div>
      </div>
    );
  }
  if (!app) {
    return (
      <div className="min-h-screen bg-white">
        <PublicHeader />
        <div className="max-w-lg mx-auto px-5 py-24 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <p className="mt-4 text-[15px] font-bold">{err || '결제 정보를 찾을 수 없습니다'}</p>
        </div>
      </div>
    );
  }

  const hasOnlineOnly = approved.some((i: any) => i.role === '온라인 전용');

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-16">
      <PublicHeader />
      <DirectStepBar current={8} crumbs={[{ label: '결제' }]} backTo={`/sponsor/direct/approval/${applicationId}`} backLabel="승인 현황으로" />

      <div className="max-w-[1400px] mx-auto px-5 pt-6">
        <h1 className="text-[26px] sm:text-[32px] font-black tracking-tight">후원 계약과 결제를 완료해주세요</h1>
        <p className="mt-2 text-[13.5px] text-slate-500">결제가 완료되면 선수별 실행 일정과 성과 대시보드가 열립니다.</p>

        {partial && pendingCount > 0 && (
          <p className="mt-4 flex items-start gap-2 rounded-2xl bg-amber-50 border border-amber-100 px-5 py-4 text-[12.5px] text-amber-800 break-keep">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <b>부분 진행으로 결제합니다.</b> 승인된 {approved.length}건만 청구되며,
              미승인 {pendingCount}건은 별도 요청이 필요합니다.
            </span>
          </p>
        )}

        <div className="mt-5 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] gap-5 items-start">
          <div className="space-y-3">
            {/* 최종 구성 */}
            <div className="rounded-2xl border border-slate-200 p-5">
              <h2 className="flex items-center gap-2 text-[15px] font-extrabold">
                최종 후원 구성
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[12px] font-bold">
                  항목 {approved.length}건 승인 완료
                </span>
              </h2>
              <ul className="mt-4 divide-y divide-slate-100">
                {approved.map((i: any) => (
                  <li key={i.id} className="py-3.5 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="w-11 h-11 rounded-full overflow-hidden bg-slate-100 shrink-0">
                      {i.athlete?.profileImageUrl && <img src={i.athlete.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[14px] font-extrabold">{i.athlete?.name} <span className="text-[12px] font-bold text-slate-500">프로</span></p>
                      <p className="text-[12.5px] text-slate-500">{i.athlete?.tour}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold">{i.slotName}</p>
                      <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-md text-[12.5px] font-bold ${
                        i.role === '온라인 전용' ? 'bg-sky-50 text-sky-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {i.role || '착장'}
                      </span>
                    </div>
                    <p className="ml-auto text-[15px] font-black tabular-nums">{i.price.toLocaleString()}원</p>
                  </li>
                ))}
              </ul>
              <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[13px] font-bold">후원금 합계</span>
                <span className="text-[16px] font-black">{supply.toLocaleString()}원</span>
              </div>
            </div>

            {/* 계약 내용 */}
            <div className="rounded-2xl border border-slate-200 p-5">
              <h2 className="flex items-center gap-2 text-[15px] font-extrabold">
                <FileText className="w-4 h-4 text-slate-500" /> 계약 내용 검토
              </h2>
              <ul className="mt-3 divide-y divide-slate-100">
                {CONTRACT_TERMS.map((t, i) => (
                  <li key={t.title}>
                    <button
                      onClick={() => setOpenTerm(openTerm === i ? null : i)}
                      aria-expanded={openTerm === i}
                      className="w-full py-3.5 flex items-center gap-3 text-left"
                    >
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-[12px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                      <span className="text-[13.5px] font-bold">{t.title}</span>
                      <ChevronDown className={`ml-auto w-4 h-4 text-slate-500 transition-transform ${openTerm === i ? 'rotate-180' : ''}`} />
                    </button>
                    {openTerm === i && (
                      <p className="pb-3.5 pl-9 text-[12.5px] text-slate-600 leading-relaxed break-keep">{t.body}</p>
                    )}
                  </li>
                ))}
              </ul>
              {hasOnlineOnly && (
                <p className="mt-2 flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-100 px-3.5 py-3 text-[12px] text-rose-700 break-keep">
                  <Ban className="w-4 h-4 shrink-0 mt-0.5" />
                  온라인 전용 상품이 포함되어 있습니다. 대회 현장·오프라인 매체 사용은 계약 위반입니다.
                </p>
              )}
            </div>

            {/* 세금계산서 */}
            <div className="rounded-2xl border border-slate-200 p-5">
              <h2 className="text-[15px] font-extrabold">세금계산서 정보</h2>
              <dl className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-[12.5px]">
                {[
                  ['상호 (법인명)', app.snapshot?.brandInfo?.company || '—'],
                  ['사업자등록번호', app.snapshot?.brandInfo?.bizNo || '—'],
                  ['담당자', app.snapshot?.brandInfo?.manager || '—'],
                  ['이메일 (세금계산서 수신)', app.snapshot?.brandInfo?.email || '—'],
                  ['연락처', app.snapshot?.brandInfo?.phone || '—'],
                  ['업종', app.snapshot?.brandInfo?.category || '—'],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <dt className="text-[12px] text-slate-500">{k}</dt>
                    <dd className="mt-0.5 font-bold break-keep">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-[12.5px] text-slate-500">
                정보를 수정하려면 승인 요청 화면에서 브랜드 정보를 다시 입력해주세요.
              </p>
            </div>
          </div>

          {/* 우: 결제 */}
          <aside className="lg:sticky lg:top-24 rounded-2xl border border-slate-200 p-5">
            <h2 className="text-[15px] font-extrabold">결제 요약</h2>

            <dl className="mt-4 space-y-2.5 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-slate-500">후원금 ({approved.length}건)</dt>
                <dd className="font-bold tabular-nums">{supply.toLocaleString()}원</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">플랫폼 이용 수수료 (포함)</dt>
                <dd className="font-bold tabular-nums">0원</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">부가가치세 (10%)</dt>
                <dd className="font-bold tabular-nums">{vat.toLocaleString()}원</dd>
              </div>
            </dl>

            <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3.5 flex items-baseline justify-between">
              <span className="text-[13px] font-bold">오늘 결제 금액</span>
              <span className="text-[22px] font-black text-emerald-700 tabular-nums">{(supply + vat).toLocaleString()}원</span>
            </div>

            <div className="mt-4">
              <p className="text-[12.5px] font-extrabold mb-2">결제 수단</p>
              <div className="space-y-2">
                {METHODS.map((m) => (
                  <label
                    key={m.code}
                    className={`flex items-center gap-3 rounded-xl border p-3.5 cursor-pointer transition-colors ${
                      method === m.code ? 'border-emerald-500 bg-emerald-50/40' : 'border-slate-200'
                    }`}
                  >
                    <input type="radio" checked={method === m.code} onChange={() => setMethod(m.code)} className="w-4 h-4 accent-emerald-600 shrink-0" />
                    <m.icon className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="text-[13px] font-bold">{m.label}</span>
                    <span className="ml-auto text-[12px] text-slate-500 text-right">{m.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {AGREEMENTS.map((a, i) => (
                <label key={a} className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed.includes(i)}
                    onChange={(e) => setAgreed(e.target.checked ? [...agreed, i] : agreed.filter((x) => x !== i))}
                    className="w-4 h-4 accent-emerald-600 shrink-0 mt-0.5"
                  />
                  <span className="text-[12px] text-slate-600 break-keep">
                    <span className="font-bold text-rose-500">(필수)</span> {a}
                  </span>
                </label>
              ))}
            </div>

            {err && <p className="mt-3 text-[12.5px] font-bold text-rose-600 break-keep">{err}</p>}

            <button
              onClick={pay}
              disabled={!canPay || paying}
              className={`mt-4 w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl text-[14.5px] font-bold transition-colors ${
                canPay ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-100 text-slate-500 cursor-not-allowed'
              }`}
            >
              {paying ? '결제 처리 중…'
                : app.status === 'ACTIVE' ? '이미 결제되었습니다'
                : approved.length === 0 ? <><Lock className="w-4 h-4" /> 승인된 항목이 없습니다</>
                : <><Lock className="w-4 h-4" /> {(supply + vat).toLocaleString()}원 결제하기</>}
            </button>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-[12.5px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5" /> 결제 정보는 PG사에서 암호화 처리됩니다
            </p>

            <Link
              to={`/sponsor/direct/approval/${applicationId}`}
              className="mt-3 w-full h-11 inline-flex items-center justify-center rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 hover:bg-slate-50"
            >
              승인 현황으로 돌아가기
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
