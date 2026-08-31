/**
 * 계약·결제 (핸드오프 v1.0 §10.2, 시안 img_21)
 *
 * 승인된 항목만 청구한다. 금액은 서버 응답 값을 그대로 쓰고 클라이언트에서 만들지 않는다.
 * 필수 동의 4종을 모두 체크해야 결제가 활성화된다 (§10.2-5).
 */
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle, Building2, Calendar, Check, CheckCircle2, ChevronRight,
  CreditCard, FileText, Info, Landmark, Lock, Shirt, Wallet,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import { api } from '../../services/api';

const STEPS = ['추천안 선택', '패키지 구성', '조건 및 일정', '계약 검토', '선수 승인', '결제'];

const AGREEMENTS = [
  { key: 'tos', label: '이용약관에 동의합니다.', to: '/terms' },
  { key: 'privacy', label: '개인정보 처리방침에 동의합니다.', to: '/privacy' },
  { key: 'efin', label: '전자금융거래 이용약관에 동의합니다.', to: '/terms' },
  { key: 'refund', label: '결제 및 환불 규정에 동의합니다.', to: '/terms' },
];

const METHODS = [
  { key: 'CARD', label: '신용카드', icon: CreditCard, badge: '추천' },
  { key: 'TRANSFER', label: '계좌이체', icon: Landmark },
  { key: 'SPONPAY', label: 'SPON Pay', icon: Wallet, note: '포인트 / 잔액 사용 가능' },
];

export default function ApplicationCheckout() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const partial = sp.get('partial') === '1';
  const [app, setApp] = useState<any>(null);
  const [agreed, setAgreed] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [method, setMethod] = useState('CARD');
  const [paying, setPaying] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r: any = await api.getApplication(id!);
      setApp(r?.data);
    } catch (e: any) {
      setErr(e?.response?.data?.error?.message || '신청 정보를 불러오지 못했습니다');
    }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  if (err) {
    return (
      <div className="min-h-screen bg-white">
        <PublicHeader />
        <div className="max-w-lg mx-auto px-5 py-24 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <p className="mt-4 text-[15px] font-bold">{err}</p>
        </div>
      </div>
    );
  }
  if (!app) {
    return (
      <div className="min-h-screen bg-white">
        <PublicHeader />
        <div className="py-24 text-center"><div className="w-10 h-10 rounded-full border-4 border-emerald-100 border-t-emerald-500 animate-spin mx-auto" /></div>
      </div>
    );
  }

  if (app.status === 'ACTIVE') {
    return (
      <div className="min-h-screen bg-white">
        <PublicHeader />
        <div className="max-w-lg mx-auto px-5 py-24 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h1 className="mt-4 text-[22px] font-black">후원 계약이 완료되었습니다</h1>
          <p className="mt-2 text-[13.5px] text-slate-500">
            계약번호 {String(app.id).slice(0, 8).toUpperCase()} · 선수별 실행 일정과 성과 대시보드가 열립니다.
          </p>
          <div className="mt-7 flex gap-2.5 justify-center">
            <Link to="/dashboard" className="h-11 px-5 inline-flex items-center rounded-xl bg-emerald-600 text-white text-sm font-bold">대시보드로</Link>
            <Link to={`/sponsor/applications/${app.id}`} className="h-11 px-5 inline-flex items-center rounded-xl border border-slate-200 text-slate-700 text-sm font-bold">신청 내역 보기</Link>
          </div>
        </div>
      </div>
    );
  }

  const items: any[] = app.items || [];
  const billable = items.filter((i) => i.status === 'APPROVED');
  const supply = billable.reduce((s, i) => s + i.price, 0);
  const vat = Math.round(supply * 0.1);
  const total = supply + vat;
  const allAgreed = AGREEMENTS.every((a) => agreed.includes(a.key)) && confirmed;

  const pay = async () => {
    setPaying(true);
    setErr(null);
    try {
      const r: any = await api.checkoutApplication(app.id, { partial });
      setApp(r?.data);
      window.scrollTo({ top: 0 });
    } catch (e: any) {
      setErr(e?.response?.data?.error?.message || '결제를 완료하지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally { setPaying(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 pb-16">
      <PublicHeader />

      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-5 py-3.5 flex items-center gap-2 overflow-x-auto">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5 shrink-0">
              <span className={`w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center ${
                i < 5 ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500 text-white'
              }`}>{i < 5 ? <Check className="w-3 h-3" /> : i + 1}</span>
              <span className={`text-[12px] font-bold ${i === 5 ? 'text-emerald-700' : 'text-slate-400'}`}>{s}</span>
              {i < STEPS.length - 1 && <span className="w-6 h-px bg-slate-200 mx-1" />}
            </div>
          ))}
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-5 pt-8">
        <h1 className="text-center text-[24px] sm:text-[30px] font-black tracking-tight">후원 계약과 결제를 완료해주세요</h1>
        <p className="mt-2 text-center text-[13.5px] text-slate-500">결제가 완료되면 선수별 실행 일정과 성과 대시보드가 열립니다.</p>

        {partial && (
          <p className="mt-5 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-[12.5px] text-amber-800 max-w-3xl mx-auto">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            승인된 선수 {billable.length}명으로만 진행합니다. 미승인 선수는 이번 계약에서 제외되며, 목표 커버리지가 달라질 수 있습니다.
          </p>
        )}

        <div className="mt-7 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] gap-5 items-start">
          {/* 좌: 구성·계약서 */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6">
              <h2 className="text-[15px] font-extrabold mb-4">최종 후원 구성</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px] min-w-[520px]">
                  <thead>
                    <tr className="text-[11px] text-slate-400 font-bold border-b border-slate-200">
                      <th className="text-left pb-2.5">선수</th>
                      <th className="text-left pb-2.5">선택한 후원 유형</th>
                      <th className="text-left pb-2.5">후원 기간</th>
                      <th className="text-right pb-2.5">월 후원금</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => {
                      const excluded = it.status !== 'APPROVED';
                      return (
                        <tr key={it.id} className={`border-b border-slate-50 last:border-none ${excluded ? 'opacity-45' : ''}`}>
                          <td className="py-3">
                            <span className="flex items-center gap-2.5">
                              <span className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 shrink-0">
                                {it.athlete?.profileImageUrl && <img src={it.athlete.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}
                              </span>
                              <span className="font-bold">{it.athlete?.name}</span>
                            </span>
                          </td>
                          <td className="py-3">
                            <span className="inline-flex items-center gap-1.5">
                              <Shirt className="w-3.5 h-3.5 text-slate-400" />
                              {it.slotName}{it.role ? ` · ${it.role}` : ''}
                            </span>
                          </td>
                          <td className="py-3 text-slate-500">{app.durationMonths}개월</td>
                          <td className="py-3 text-right font-black tabular-nums">
                            {excluded ? <span className="text-[11.5px] text-slate-400">미승인 · 제외</span> : `${(it.price / 10000).toLocaleString()}만원`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-[15px] font-extrabold mb-4">
                <FileText className="w-4 h-4 text-slate-400" /> 계약서 확인
              </h2>
              <dl className="space-y-3 text-[13px]">
                {[
                  { k: '권리 및 사용 제한', v: '계약에 명시된 슬롯·기간에 한해 사용하며, 계약 외 위치·기간 사용은 불가합니다.' },
                  { k: '사용 기간', v: `계약 효력일부터 ${app.durationMonths}개월` },
                  { k: '주요 제공물', v: '지정 슬롯 노출, 이행 증빙 리포트 제공' },
                  { k: '계약 해지', v: '선수 또는 스폰서의 귀책 사유 시, 계약 해지 및 환불 규정에 따릅니다.' },
                ].map((r) => (
                  <div key={r.k} className="flex gap-4">
                    <dt className="w-28 shrink-0 text-slate-400 font-bold">{r.k}</dt>
                    <dd className="text-slate-700 break-keep">{r.v}</dd>
                  </div>
                ))}
              </dl>
              <label className="mt-5 flex items-center gap-2.5 pt-4 border-t border-slate-100 cursor-pointer">
                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="w-4 h-4 accent-emerald-600" />
                <span className="text-[13px] font-bold">계약 내용과 유의사항을 확인했습니다.</span>
                <Link to="/terms" className="ml-auto text-[12px] font-bold text-slate-500 hover:text-slate-800 inline-flex items-center gap-0.5">
                  표준계약서 전체 보기 <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </label>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-[15px] font-extrabold mb-4">
                <Building2 className="w-4 h-4 text-slate-400" /> 세금계산서 / 사업자 정보
              </h2>
              <p className="text-[12.5px] text-slate-500 break-keep">
                세금계산서는 결제 완료 후 등록된 사업자 정보로 발행됩니다.
                사업자 정보가 없으면 마이페이지에서 먼저 등록해 주세요.
              </p>
              <Link to="/profile" className="mt-3 inline-flex items-center gap-1 text-[13px] font-bold text-emerald-600 hover:text-emerald-700">
                사업자 정보 확인 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* 우: 결제 */}
          <aside className="lg:sticky lg:top-24 space-y-4">
            <div className="rounded-2xl bg-white border border-slate-200 p-5">
              <h2 className="text-[15px] font-extrabold mb-4">결제 요약</h2>
              <dl className="space-y-2.5 text-[13px]">
                <div className="flex justify-between">
                  <dt className="text-slate-500">월 후원금 ({billable.length}명)</dt>
                  <dd className="font-bold tabular-nums">{supply.toLocaleString()}원</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500 inline-flex items-center gap-1">플랫폼 이용료 <Info className="w-3 h-3 text-slate-300" /></dt>
                  <dd className="font-bold text-emerald-600">포함</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">VAT (10%)</dt>
                  <dd className="font-bold tabular-nums">{vat.toLocaleString()}원</dd>
                </div>
              </dl>
              <div className="mt-4 pt-4 border-t border-slate-200 flex items-baseline justify-between">
                <span className="text-[13px] font-bold">이번 결제금액</span>
                <span className="text-[24px] font-black text-emerald-600 tabular-nums">{total.toLocaleString()}원</span>
              </div>

              <p className="mt-5 mb-2.5 text-[13px] font-extrabold">결제 방법 선택</p>
              <div className="space-y-2">
                {METHODS.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setMethod(m.key)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${
                      method === m.key ? 'border-emerald-500 bg-emerald-50/60' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${method === m.key ? 'border-emerald-500' : 'border-slate-300'}`}>
                      {method === m.key && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                    </span>
                    <m.icon className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="text-[13.5px] font-bold">{m.label}</span>
                    {m.badge && <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-black">{m.badge}</span>}
                    {m.note && <span className="ml-auto text-[11px] text-slate-400">{m.note}</span>}
                  </button>
                ))}
              </div>

              <div className="mt-4 space-y-2">
                {AGREEMENTS.map((a) => (
                  <label key={a.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreed.includes(a.key)}
                      onChange={(e) => setAgreed(e.target.checked ? [...agreed, a.key] : agreed.filter((k) => k !== a.key))}
                      className="w-4 h-4 accent-emerald-600 shrink-0"
                    />
                    <span className="text-[12px] text-slate-600">{a.label} <span className="text-slate-400">(필수)</span></span>
                    <Link to={a.to} className="ml-auto text-[11px] text-slate-400 hover:text-slate-600 shrink-0">보기</Link>
                  </label>
                ))}
              </div>

              {err && <p className="mt-3 text-[12.5px] font-bold text-rose-600 break-keep">{err}</p>}

              <button
                onClick={pay}
                disabled={!allAgreed || paying}
                className="mt-4 w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white text-[15px] font-bold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {paying ? '결제 처리 중…' : <>{total.toLocaleString()}원 결제하기 <Lock className="w-4 h-4" /></>}
              </button>
              <p className="mt-2 text-center text-[11px] text-slate-400">결제는 선수 승인 완료 후에만 진행됩니다.</p>
            </div>

            <Link to={`/sponsor/applications/${app.id}`} className="flex items-center gap-2 rounded-2xl bg-white border border-slate-200 px-5 py-4 hover:border-emerald-300 transition-colors">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-[13px] font-bold">승인 현황 다시 보기</span>
              <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
            </Link>
          </aside>
        </div>
      </section>
    </div>
  );
}
