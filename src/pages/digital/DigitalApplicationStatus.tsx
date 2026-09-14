/**
 * 디지털 파트너 — 승인 대기 · 계약 · 결제 (핸드오프 v1.0 §5.5)
 *
 * 승인 전에는 결제 버튼이 잠긴다 (UX-04). 승인 후 12개월 약정 계약을 확인하고
 * 첫 달 구독료를 결제하면 ACTIVE로 전환된다 (§7.3).
 */
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle, Ban, Calendar, CheckCircle2, ChevronRight, Clock,
  FileText, Lock, Pencil, XCircle,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import { api } from '../../services/api';

const STEPS = ['선수 선택', '상품 선택', '브랜드 승인', '계약 · 결제'];

const STATUS_UI: Record<string, { label: string; desc: string; cls: string; icon: any }> = {
  SUBMITTED: { label: '승인 대기', desc: '선수가 후원 조건을 확인하고 있습니다.', cls: 'bg-amber-50 text-amber-700', icon: Clock },
  NEEDS_REVISION: { label: '수정 요청', desc: '선수가 조건 조정을 요청했습니다.', cls: 'bg-sky-50 text-sky-700', icon: Pencil },
  ATHLETE_APPROVED: { label: '선수 승인 완료', desc: '계약과 결제를 진행할 수 있습니다.', cls: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
  REJECTED: { label: '승인 거절', desc: '선수의 파트너 정책과 맞지 않아 승인되지 않았습니다.', cls: 'bg-slate-100 text-slate-500', icon: XCircle },
  ACTIVE: { label: '구독 중', desc: '자산 준비와 성과 리포트가 제공됩니다.', cls: 'bg-emerald-600 text-white', icon: CheckCircle2 },
  EXPIRED: { label: '기간 만료', desc: '승인 유효기간이 지났습니다.', cls: 'bg-slate-100 text-slate-500', icon: Clock },
};

const AGREEMENTS = [
  '12개월 약정과 월 자동결제에 동의합니다. (필수)',
  '경기복·대회 현장 부착이 포함되지 않음을 확인했습니다. (필수)',
  '이용약관 및 개인정보 처리방침에 동의합니다. (필수)',
];

export default function DigitalApplicationStatus() {
  const { id } = useParams();
  const [app, setApp] = useState<any>(null);
  const [agreed, setAgreed] = useState<number[]>([]);
  const [paying, setPaying] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r: any = await api.getDigitalApplication(id!);
      setApp(r?.data);
    } catch (e: any) {
      setErr(e?.response?.data?.error?.message || '신청 정보를 불러오지 못했습니다');
    }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const pay = async () => {
    setPaying(true); setErr(null);
    try {
      const r: any = await api.checkoutDigital(app.id);
      setApp(r?.data);
      window.scrollTo({ top: 0 });
    } catch (e: any) {
      setErr(e?.response?.data?.error?.message || '결제를 완료하지 못했습니다');
    } finally { setPaying(false); }
  };

  if (err && !app) {
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

  const ui = STATUS_UI[app.status] || STATUS_UI.SUBMITTED;
  const approved = app.status === 'ATHLETE_APPROVED';
  const active = app.status === 'ACTIVE';
  const stepIdx = active ? 3 : approved ? 3 : 2;
  const annual = app.monthlyAmount * app.termMonths;
  const vat = Math.round(app.monthlyAmount * 0.1);
  const canPay = approved && agreed.length === AGREEMENTS.length;

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 pb-16">
      <PublicHeader />

      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-5 py-3.5 flex items-center gap-2 overflow-x-auto">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5 shrink-0">
              <span className={`w-6 h-6 rounded-full text-[12px] font-black flex items-center justify-center ${
                i < stepIdx ? 'bg-emerald-100 text-emerald-700' : i === stepIdx ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
              }`}>{i + 1}</span>
              <span className={`text-[12px] font-bold ${i === stepIdx ? 'text-emerald-700' : 'text-slate-500'}`}>{s}</span>
              {i < STEPS.length - 1 && <span className="w-6 h-px bg-slate-200 mx-1" />}
            </div>
          ))}
        </div>
      </div>

      <section className="max-w-5xl mx-auto px-5 pt-8">
        {/* 상태 */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-7 text-center">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-black ${ui.cls}`}>
            <ui.icon className="w-4 h-4" /> {ui.label}
          </span>
          <h1 className="mt-4 text-[22px] sm:text-[26px] font-black tracking-tight break-keep">
            {active ? '디지털 파트너 구독이 시작되었습니다' : approved ? '계약과 결제를 완료해주세요' : '선수의 승인을 기다리고 있습니다'}
          </h1>
          <p className="mt-2 text-[13.5px] text-slate-500 break-keep">{ui.desc}</p>
          <p className="mt-3 text-[12px] text-slate-500">
            접수번호 {String(app.id).slice(0, 8).toUpperCase()}
            {app.approvalDueAt && !active && ` · 승인 기한 ${new Date(app.approvalDueAt).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`}
          </p>
          {(app.status === 'NEEDS_REVISION' || app.status === 'REJECTED') && app.comment && (
            <p className="mt-4 mx-auto max-w-lg rounded-xl bg-slate-50 px-4 py-3 text-[12.5px] text-slate-600 break-keep">
              선수 의견: {app.comment}
            </p>
          )}
        </div>

        <div className="mt-5 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] gap-5 items-start">
          {/* 계약 내용 */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6">
              <h2 className="text-[15px] font-extrabold mb-4">구독 내용</h2>
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <span className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 shrink-0">
                  {app.athlete?.profileImageUrl && <img src={app.athlete.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}
                </span>
                <div>
                  <p className="text-[15px] font-extrabold">{app.athlete?.name} 프로</p>
                  <p className="text-[12.5px] text-slate-500">{app.athlete?.tour}</p>
                </div>
                <span className="ml-auto px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[12px] font-black">{app.planCode}</span>
              </div>
              <dl className="mt-4 space-y-2.5 text-[13px]">
                {[
                  { k: '월 구독료', v: `${app.monthlyAmount.toLocaleString()}원 (VAT 별도)` },
                  { k: '약정 기간', v: `${app.termMonths}개월` },
                  { k: '총 계약금액', v: `${annual.toLocaleString()}원` },
                  { k: '사용 범위', v: (app.scopes || []).map((s: string) => ({ WEB_SNS: '홈페이지·SNS', FANSTORE: '팬스토어', STORE_POP: '등록매장 POP' } as any)[s] || s).join(' · ') || '-' },
                  ...(app.category ? [{ k: '업종', v: app.category }] : []),
                  ...(active && app.effectiveFrom ? [{ k: '계약 기간', v: `${new Date(app.effectiveFrom).toLocaleDateString('ko-KR')} ~ ${new Date(app.effectiveTo).toLocaleDateString('ko-KR')}` }] : []),
                  ...(active && app.nextBillingAt ? [{ k: '다음 결제일', v: new Date(app.nextBillingAt).toLocaleDateString('ko-KR') }] : []),
                ].map((r) => (
                  <div key={r.k} className="flex justify-between gap-4">
                    <dt className="text-slate-500 shrink-0">{r.k}</dt>
                    <dd className="font-bold text-right break-keep">{r.v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-[15px] font-extrabold mb-3">
                <FileText className="w-4 h-4 text-slate-500" /> 사용권과 제한
              </h2>
              <ul className="space-y-2 text-[12.5px] text-slate-600">
                {[
                  '허용: 브랜드 소유 웹·SNS, 스폰픽 팬스토어, 계약에 등록된 매장 내부 POP',
                  '금지: 경기복, 대회장, 방송화면 합성, 옥외광고, 제품 패키지, 제3자 재판매',
                  '표기: "공식 디지털 파트너" 사용 (대회 공식후원사 표현 금지)',
                  '종료: 계약 종료일 이후 신규 게시·노출 중단, 디지털 자산 비활성화',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2 break-keep">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0 mt-1.5" /> {t}
                  </li>
                ))}
              </ul>
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 px-3.5 py-3 text-[12px] text-rose-700">
                <Ban className="w-4 h-4 shrink-0 mt-0.5" />
                본 상품은 경기복 · 대회 현장 부착이 포함되지 않습니다.
              </p>
            </div>
          </div>

          {/* 결제 */}
          <aside className="lg:sticky lg:top-24 space-y-4">
            {active ? (
              <div className="rounded-2xl bg-white border border-emerald-200 p-5 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="mt-3 text-[15px] font-extrabold">구독이 시작되었습니다</p>
                <p className="mt-1 text-[12px] text-slate-500">소재 제작 안내를 순차적으로 보내드립니다.</p>
                <Link to="/dashboard" className="mt-4 w-full h-11 inline-flex items-center justify-center rounded-xl bg-emerald-600 text-white text-[13.5px] font-bold">
                  대시보드로 이동
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl bg-white border border-slate-200 p-5">
                <h2 className="text-[15px] font-extrabold mb-4">결제 요약</h2>
                <dl className="space-y-2.5 text-[13px]">
                  <div className="flex justify-between"><dt className="text-slate-500">첫 달 구독료</dt><dd className="font-bold tabular-nums">{app.monthlyAmount.toLocaleString()}원</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">VAT (10%)</dt><dd className="font-bold tabular-nums">{vat.toLocaleString()}원</dd></div>
                </dl>
                <div className="mt-3 pt-3 border-t border-slate-200 flex items-baseline justify-between">
                  <span className="text-[13px] font-bold">이번 결제금액</span>
                  <span className="text-[22px] font-black text-emerald-600 tabular-nums">{(app.monthlyAmount + vat).toLocaleString()}원</span>
                </div>
                <p className="mt-1 text-right text-[12px] text-slate-500">이후 매월 동일 금액 자동결제 · 총 {app.termMonths}회</p>

                <div className="mt-4 space-y-2">
                  {AGREEMENTS.map((a, i) => (
                    <label key={a} className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreed.includes(i)}
                        onChange={(e) => setAgreed(e.target.checked ? [...agreed, i] : agreed.filter((x) => x !== i))}
                        disabled={!approved}
                        className="w-4 h-4 accent-emerald-600 shrink-0 mt-0.5"
                      />
                      <span className="text-[12px] text-slate-600 break-keep">{a}</span>
                    </label>
                  ))}
                </div>

                {err && <p className="mt-3 text-[12.5px] font-bold text-rose-600 break-keep">{err}</p>}

                <button
                  onClick={pay}
                  disabled={!canPay || paying}
                  className={`mt-4 w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl text-[14px] font-bold transition-colors ${
                    canPay ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-100 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {paying ? '결제 처리 중…'
                    : approved ? `${(app.monthlyAmount + vat).toLocaleString()}원 결제하기`
                    : <><Lock className="w-4 h-4" /> 선수 승인 후 결제 가능</>}
                </button>
              </div>
            )}

            <Link to="/digital-partner/athletes" className="flex items-center gap-2 rounded-2xl bg-white border border-slate-200 px-5 py-4 hover:border-emerald-300 transition-colors">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-[13px] font-bold">다른 선수 둘러보기</span>
              <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
            </Link>
          </aside>
        </div>
      </section>
    </div>
  );
}
