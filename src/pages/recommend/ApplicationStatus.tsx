/**
 * 신청 승인 현황 (핸드오프 v1.0 §9.2, 시안 img_16)
 *
 * 선수별 승인 상태와 남은 유효기간을 보여주고, 전원 승인 시 결제로 넘어간다.
 * 일부만 승인되면 "승인된 선수만 먼저 진행"을 명시적으로 선택하게 한다 (§9.3).
 */
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, Check, CheckCircle2, ChevronRight, Clock,
  Flag, Lock, Pencil, Send, Users, Wallet, XCircle,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import { api } from '../../services/api';

const STEPS = ['추천안 선택', '패키지 구성', '조건 및 일정', '계약 검토', '선수 승인', '결제'];

const ITEM_UI: Record<string, { label: string; cls: string; icon: any }> = {
  APPROVED: { label: '승인 완료', cls: 'text-emerald-600', icon: CheckCircle2 },
  PENDING: { label: '확인 중', cls: 'text-amber-500', icon: Clock },
  NEEDS_REVISION: { label: '조정 요청', cls: 'text-rose-600', icon: AlertTriangle },
  REJECTED: { label: '승인 거절', cls: 'text-slate-500', icon: XCircle },
  EXPIRED: { label: '기간 만료', cls: 'text-slate-500', icon: Clock },
};

const ACTION_LABEL: Record<string, string> = {
  SUBMIT: '승인 요청 발송', APPROVE: '승인 완료', REVISION: '조정 요청', REJECT: '승인 거절', PAY: '결제 완료',
};

function remainText(due?: string | null) {
  if (!due) return null;
  const ms = new Date(due).getTime() - Date.now();
  if (ms <= 0) return '기간 만료';
  const h = Math.floor(ms / 3600000);
  return h >= 24 ? `${Math.floor(h / 24)}일 ${h % 24}시간` : `${h}시간`;
}

export default function ApplicationStatus() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState<any>(null);
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
          <Link to="/sponsor/recommended" className="mt-6 inline-flex h-11 px-5 items-center rounded-xl bg-emerald-600 text-white text-sm font-bold">
            추천 PICK으로
          </Link>
        </div>
      </div>
    );
  }
  if (!app) {
    return (
      <div className="min-h-screen bg-white">
        <PublicHeader />
        <div className="py-24 text-center">
          <div className="w-10 h-10 rounded-full border-4 border-emerald-100 border-t-emerald-500 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  const items: any[] = app.items || [];
  const approved = items.filter((i) => i.status === 'APPROVED');
  const pending = items.filter((i) => i.status === 'PENDING');
  const revision = items.filter((i) => i.status === 'NEEDS_REVISION');
  const pct = Math.round((approved.length / Math.max(1, items.length)) * 100);
  const allApproved = approved.length === items.length;
  const canPartial = !allApproved && approved.length > 0 && pending.length === 0;
  const total = items.reduce((s, i) => s + i.price, 0);
  const approvedTotal = approved.reduce((s, i) => s + i.price, 0);

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 pb-16">
      <PublicHeader />

      {/* 단계 */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-5 py-3.5 flex items-center gap-2 overflow-x-auto">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5 shrink-0">
              <span className={`w-6 h-6 rounded-full text-[12px] font-black flex items-center justify-center ${
                i < 4 ? 'bg-emerald-100 text-emerald-700' : i === 4 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
              }`}>{i + 1}</span>
              <span className={`text-[12px] font-bold ${i === 4 ? 'text-emerald-700' : 'text-slate-500'}`}>{s}</span>
              {i < STEPS.length - 1 && <span className="w-6 h-px bg-slate-200 mx-1" />}
            </div>
          ))}
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-5 pt-8">
        <h1 className="text-[24px] sm:text-[30px] font-black tracking-tight">선수의 최종 확인을 진행하고 있습니다</h1>
        <p className="mt-2 text-[13.5px] text-slate-500">선수가 일정과 후원 조건을 확인하면 계약과 결제를 진행할 수 있습니다.</p>

        <div className="mt-6 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,330px)] gap-5 items-start">
          <div className="space-y-4">
            {/* 요약 */}
            <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 grid sm:grid-cols-3 gap-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
              <div className="flex items-center gap-4">
                <span className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-emerald-600" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[17px] font-black">{items.length}명 중 {approved.length}명 승인</p>
                  <p className="text-[12.5px] text-slate-500 mt-0.5">
                    승인 {approved.length}명 · 확인 중 {pending.length}명{revision.length ? ` · 조정 요청 ${revision.length}명` : ''}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[12px] font-black text-emerald-600 tabular-nums">{pct}%</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 pt-5 sm:pt-0 sm:pl-5">
                <span className="w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-sky-600" />
                </span>
                <div>
                  <p className="text-[12.5px] text-slate-500 font-bold">승인 요청 유효기간</p>
                  <p className="text-[19px] font-black">{remainText(app.approvalDueAt) || '-'}</p>
                  <p className="text-[12px] text-slate-500">
                    {app.approvalDueAt ? new Date(app.approvalDueAt).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) + '까지' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 pt-5 sm:pt-0 sm:pl-5">
                <span className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5 text-violet-600" />
                </span>
                <div>
                  <p className="text-[12.5px] text-slate-500 font-bold">패키지 총 금액</p>
                  <p className="text-[19px] font-black">월 {Math.round(total / 10000)}만원</p>
                  <p className="text-[12px] text-slate-500">부가세 별도</p>
                </div>
              </div>
            </div>

            {/* 선수별 상태 */}
            <div className="space-y-3">
              {items.map((it) => {
                const ui = ITEM_UI[it.status] || ITEM_UI.PENDING;
                const danger = it.status === 'NEEDS_REVISION' || it.status === 'REJECTED';
                return (
                  <div key={it.id} className={`rounded-2xl bg-white border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${danger ? 'border-rose-200' : 'border-slate-200'}`}>
                    <span className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 shrink-0">
                      {it.athlete?.profileImageUrl && <img src={it.athlete.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}
                    </span>
                    <div className="min-w-0 sm:w-40">
                      <p className="text-[15px] font-extrabold">{it.athlete?.name} 프로</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {[it.athlete?.tour, it.role].filter(Boolean).map((t: string) => (
                          <span key={t} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[12.5px] font-bold">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 sm:w-32 ${ui.cls}`}>
                      <ui.icon className="w-5 h-5 shrink-0" />
                      <span className="text-[14px] font-extrabold">{ui.label}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      {it.status === 'APPROVED' ? (
                        <>
                          <p className="text-[12.5px] text-slate-500 font-bold">승인한 후원 구성</p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {[it.slotName, `${app.durationMonths}개월`].filter(Boolean).map((t: string) => (
                              <span key={t} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[12.5px] font-bold">{t}</span>
                            ))}
                          </div>
                        </>
                      ) : it.status === 'PENDING' ? (
                        <p className="text-[12.5px] text-slate-500">선수에게 승인 요청을 보냈습니다.</p>
                      ) : (
                        <>
                          <p className="text-[12.5px] text-slate-500 font-bold">사유</p>
                          <p className="text-[12.5px] text-slate-600 break-keep">{it.comment || it.reasonCode || '사유 미기재'}</p>
                        </>
                      )}
                    </div>
                    <span className="text-[13px] font-black tabular-nums shrink-0">{(it.price / 10000).toLocaleString()}만원</span>
                  </div>
                );
              })}
            </div>

            {/* 진행 기록 */}
            <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6">
              <h2 className="text-[14.5px] font-extrabold mb-4">진행 기록</h2>
              <ol className="space-y-3">
                {(app.reviews || []).map((r: any) => (
                  <li key={r.id} className="flex items-start gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      r.action === 'APPROVE' ? 'bg-emerald-50 text-emerald-600'
                        : r.action === 'REJECT' || r.action === 'REVISION' ? 'bg-rose-50 text-rose-500'
                        : r.action === 'PAY' ? 'bg-violet-50 text-violet-600' : 'bg-sky-50 text-sky-600'
                    }`}>
                      {r.action === 'APPROVE' ? <Check className="w-4 h-4" />
                        : r.action === 'REJECT' || r.action === 'REVISION' ? <AlertTriangle className="w-4 h-4" />
                        : r.action === 'PAY' ? <Wallet className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold">{ACTION_LABEL[r.action] || r.action}</p>
                      <p className="text-[12.5px] text-slate-500">
                        {new Date(r.createdAt).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        {r.comment ? ` · ${r.comment}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* 우: 다음 단계 */}
          <aside className="lg:sticky lg:top-24 space-y-4">
            <div className="rounded-2xl bg-white border border-slate-200 p-5">
              <h2 className="flex items-center gap-2 text-[15px] font-extrabold mb-3">
                <Flag className="w-4 h-4 text-emerald-600" /> 다음 단계
              </h2>
              <p className="text-[13px] text-slate-600 break-keep leading-relaxed">
                {allApproved
                  ? '모든 선수가 승인했습니다. 계약과 결제를 진행할 수 있어요.'
                  : `모든 선수가 승인해야 결제가 활성화됩니다. 현재 ${items.length - approved.length}명의 승인이 남아 있습니다.`}
              </p>
              <button
                onClick={() => navigate(`/sponsor/applications/${app.id}/checkout`)}
                disabled={!allApproved}
                className={`mt-4 w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl text-[14px] font-bold transition-colors ${
                  allApproved ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-100 text-slate-500 cursor-not-allowed'
                }`}
              >
                {allApproved ? <>계약·결제 진행 <ArrowRight className="w-4 h-4" /></> : <><Lock className="w-4 h-4" /> 모든 승인 후 결제 가능</>}
              </button>

              {canPartial && (
                <>
                  <p className="mt-5 mb-2.5 text-center text-[12.5px] text-slate-500 font-bold">다른 방법으로 진행하기</p>
                  <button
                    onClick={() => navigate(`/sponsor/applications/${app.id}/checkout?partial=1`)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-left hover:border-emerald-300 transition-colors"
                  >
                    <span className="flex items-center gap-2 text-[13.5px] font-extrabold">
                      <Users className="w-4 h-4 text-emerald-600" /> 승인된 선수만 먼저 진행
                    </span>
                    <span className="block mt-1 text-[12.5px] text-slate-500">
                      승인 완료된 선수 {approved.length}명으로 먼저 계약 및 결제 (월 {Math.round(approvedTotal / 10000)}만원)
                    </span>
                  </button>
                </>
              )}

              <Link
                to="/sponsor/recommended/brief"
                className="mt-2.5 block w-full rounded-xl border border-slate-200 px-4 py-3.5 hover:border-emerald-300 transition-colors"
              >
                <span className="flex items-center gap-2 text-[13.5px] font-extrabold">
                  <Pencil className="w-4 h-4 text-emerald-600" /> 추천안 수정
                </span>
                <span className="block mt-1 text-[12.5px] text-slate-500">구성·일정·조건을 변경하여 재요청</span>
              </Link>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-5">
              <h2 className="text-[14px] font-extrabold mb-2">문의</h2>
              <p className="text-[12.5px] text-slate-500 break-keep">승인이 지연되면 담당자가 확인해 드립니다.</p>
              <Link
                to={`/contact?subject=${encodeURIComponent(`[승인 문의] 신청번호 ${String(app.id).slice(0, 8)}`)}`}
                className="mt-3 inline-flex items-center gap-1 text-[13px] font-bold text-emerald-600 hover:text-emerald-700"
              >
                담당자 문의 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
