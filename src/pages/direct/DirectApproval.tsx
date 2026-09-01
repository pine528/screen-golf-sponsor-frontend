/**
 * 직접 선택 PICK 7단계 — 선수 승인 현황 (핸드오프 v1.0 §9, 시안 img_05)
 *
 * 기본은 모든 선수 승인 후 일괄결제이며, 부분 진행은 재확인 후에만 허용한다 (§9.3).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle, Check, CheckCircle2, ChevronRight, Clock, Loader2, Lock,
  Pencil, RefreshCw, Users, Wallet, XCircle,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import DirectStepBar from '../../components/direct/DirectStepBar';
import { api } from '../../services/api';

const ITEM_UI: Record<string, { label: string; cls: string; icon: any }> = {
  PENDING: { label: '확인 중', cls: 'bg-amber-50 text-amber-700', icon: Clock },
  APPROVED: { label: '승인 완료', cls: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
  NEEDS_REVISION: { label: '조정 요청', cls: 'bg-sky-50 text-sky-700', icon: Pencil },
  REJECTED: { label: '거절', cls: 'bg-slate-100 text-slate-500', icon: XCircle },
  EXPIRED: { label: '기간 만료', cls: 'bg-slate-100 text-slate-400', icon: Clock },
};

export default function DirectApproval() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [partialOk, setPartialOk] = useState(false);

  const load = useCallback(async () => {
    try {
      const r: any = await api.getApplication(requestId!);
      setApp(r?.data || null);
    } catch (e: any) {
      if (e?.response?.status === 401) { navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`); return; }
      setErr(e?.response?.data?.error?.message || '승인 현황을 불러오지 못했습니다');
    } finally { setLoading(false); }
  }, [requestId, navigate]);
  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const items = app?.items || [];
    const approved = items.filter((i: any) => i.status === 'APPROVED');
    const pending = items.filter((i: any) => i.status === 'PENDING');
    return {
      total: items.length,
      approved: approved.length,
      pending: pending.length,
      blocked: items.length - approved.length - pending.length,
      progress: items.length ? Math.round((approved.length / items.length) * 100) : 0,
      approvedAmount: approved.reduce((s: number, i: any) => s + i.price, 0),
      allApproved: items.length > 0 && approved.length === items.length,
    };
  }, [app]);

  const due = app?.approvalDueAt ? new Date(app.approvalDueAt) : null;
  const hoursLeft = due ? Math.max(0, Math.round((due.getTime() - Date.now()) / 3600_000)) : null;

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
          <p className="mt-4 text-[15px] font-bold">{err || '승인 요청을 찾을 수 없습니다'}</p>
        </div>
      </div>
    );
  }

  const canPay = stats.allApproved || (stats.approved > 0 && partialOk);

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 pb-16">
      <PublicHeader />
      <DirectStepBar current={7} crumbs={[{ label: '선수 승인' }]} backTo={`/sponsor/direct/cart`} backLabel="견적함으로" />

      <div className="max-w-[1400px] mx-auto px-5 pt-6">
        <h1 className="text-[26px] sm:text-[32px] font-black tracking-tight break-keep">
          {stats.allApproved ? '모든 선수가 조건을 확인했습니다' : '선수의 최종 확인을 진행하고 있습니다'}
        </h1>
        <p className="mt-2 text-[13.5px] text-slate-500">
          {stats.allApproved ? '이제 계약과 결제를 진행할 수 있습니다.' : '모든 선수가 조건을 확인하면 계약과 결제를 진행할 수 있습니다.'}
        </p>

        <div className="mt-5 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] gap-5 items-start">
          <div className="space-y-3">
            {/* 진행 요약 */}
            <div className="rounded-2xl bg-white border border-slate-200 p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* 승인은 항목 단위다 — 한 선수가 여러 상품을 가질 수 있어 '명'으로 세지 않는다 */}
              <Metric icon={Users} label="승인 현황" value={`${stats.total}건 중 ${stats.approved}건`} />
              <Metric icon={RefreshCw} label="전체 진행률" value={`${stats.progress}%`} />
              <Metric icon={Clock} label="승인 유효 시간" value={hoursLeft != null ? `${hoursLeft}시간 남음` : '—'} />
              <Metric icon={Wallet} label="승인 금액" value={`${stats.approvedAmount.toLocaleString()}원`} />
            </div>

            {/* 선수별 상태 */}
            {(app.items || []).map((i: any) => {
              const ui = ITEM_UI[i.status] || ITEM_UI.PENDING;
              const bad = i.status === 'NEEDS_REVISION' || i.status === 'REJECTED';
              return (
                <article key={i.id} className={`rounded-2xl bg-white border p-5 ${bad ? 'border-rose-200' : 'border-slate-200'}`}>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                    <span className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 shrink-0">
                      {i.athlete?.profileImageUrl && <img src={i.athlete.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[15px] font-extrabold">{i.athlete?.name} <span className="text-[11.5px] font-bold text-slate-400">프로</span></p>
                      <p className="text-[11.5px] text-slate-400">{i.athlete?.tour}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[12px] font-black inline-flex items-center gap-1.5 ${ui.cls}`}>
                      <ui.icon className="w-3.5 h-3.5" /> {ui.label}
                    </span>
                    <div className="hidden sm:block">
                      <p className="text-[11px] text-slate-400">노출 위치</p>
                      <p className="text-[12.5px] font-bold">{i.slotName || '-'}</p>
                    </div>
                    <div className="hidden md:block">
                      <p className="text-[11px] text-slate-400">유형</p>
                      <p className="text-[12.5px] font-bold">{i.role || '착장'}</p>
                    </div>
                    <p className="ml-auto text-[15px] font-black tabular-nums">{i.price.toLocaleString()}원</p>
                  </div>

                  {bad && i.comment && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-x-6 gap-y-3">
                      <div>
                        <p className="text-[11px] text-slate-400">선수 의견</p>
                        <p className="text-[13px] font-bold break-keep">{i.comment}</p>
                      </div>
                      <div className="ml-auto flex gap-2">
                        <Link
                          to={`/sponsor/direct/build/${i.athleteId}`}
                          className="h-10 px-4 inline-flex items-center rounded-xl bg-rose-600 text-white text-[12.5px] font-bold hover:bg-rose-700"
                        >
                          조건 조정하기
                        </Link>
                        <Link
                          to="/sponsor/direct/athletes"
                          className="h-10 px-4 inline-flex items-center rounded-xl border border-slate-200 text-[12.5px] font-bold text-slate-600 hover:bg-slate-50"
                        >
                          대체 선수 찾기
                        </Link>
                      </div>
                    </div>
                  )}

                  {i.status === 'APPROVED' && i.reviewedAt && (
                    <p className="mt-3 pt-3 border-t border-slate-100 text-[11.5px] text-slate-400">
                      {new Date(i.reviewedAt).toLocaleString('ko-KR')} 승인 완료
                    </p>
                  )}
                </article>
              );
            })}
          </div>

          {/* 우: 다음 단계 · 진행 내역 */}
          <aside className="lg:sticky lg:top-24 space-y-4">
            <div className="rounded-2xl bg-white border border-slate-200 p-5">
              <h2 className="text-[15px] font-extrabold">다음 단계</h2>

              {stats.allApproved ? (
                <Link
                  to={`/sponsor/direct/checkout/${app.id}`}
                  className="mt-4 w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white text-[14.5px] font-bold hover:bg-emerald-700"
                >
                  계약 · 결제로 이동 <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <p className="mt-4 w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 text-slate-400 text-[13.5px] font-bold">
                    <Lock className="w-4 h-4" /> 모든 승인 후 결제 가능
                  </p>
                  {stats.approved > 0 && (
                    <div className="mt-3 rounded-xl border border-slate-200 p-3.5">
                      <p className="text-[12.5px] font-extrabold">승인된 선수만 먼저 진행</p>
                      <p className="mt-1 text-[11.5px] text-slate-500 break-keep">
                        {stats.approved}건 · {stats.approvedAmount.toLocaleString()}원으로 진행합니다.
                        나머지 {stats.total - stats.approved}건은 별도 요청이 필요하며 캠페인 목표가 달라질 수 있습니다.
                      </p>
                      <label className="mt-2 flex items-start gap-2 cursor-pointer">
                        <input type="checkbox" checked={partialOk} onChange={(e) => setPartialOk(e.target.checked)} className="w-4 h-4 accent-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-[11.5px] text-slate-600 break-keep">변경된 구성과 총액에 동의합니다.</span>
                      </label>
                      <button
                        onClick={() => navigate(`/sponsor/direct/checkout/${app.id}?partial=1`)}
                        disabled={!canPay}
                        className="mt-2.5 w-full h-11 inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-600 text-emerald-700 text-[13px] font-bold hover:bg-emerald-50 disabled:opacity-40 disabled:hover:bg-transparent"
                      >
                        <Check className="w-4 h-4" /> 부분 진행하기
                      </button>
                    </div>
                  )}
                </>
              )}

              <button
                onClick={load}
                className="mt-2 w-full h-11 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 hover:bg-slate-50"
              >
                <RefreshCw className="w-4 h-4" /> 상태 새로고침
              </button>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-5">
              <h2 className="text-[15px] font-extrabold">승인 진행 내역</h2>
              <ul className="mt-3 space-y-3">
                {(app.reviews || []).map((r: any) => (
                  <li key={r.id} className="flex items-start gap-2.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      r.action === 'APPROVE' ? 'bg-emerald-100 text-emerald-700'
                        : r.action === 'REJECT' ? 'bg-rose-100 text-rose-700'
                        : r.action === 'REVISION' ? 'bg-sky-100 text-sky-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      <Check className="w-3 h-3" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[12.5px] font-bold break-keep">{r.comment || r.action}</span>
                      <span className="block text-[11px] text-slate-400">{new Date(r.createdAt).toLocaleString('ko-KR')}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-emerald-600" />
      </span>
      <div className="min-w-0">
        <p className="text-[11.5px] text-slate-400">{label}</p>
        <p className="text-[14px] font-extrabold truncate">{value}</p>
      </div>
    </div>
  );
}
