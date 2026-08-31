/**
 * 선수 승인함 (핸드오프 v1.0 §9.4)
 *
 * 나에게 온 후원 신청을 승인 / 수정요청 / 거절한다.
 * 거절·수정요청에는 사유가 필수다 (BR-04).
 */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, Check, CheckCircle2, Clock, Inbox, Pencil, Shirt, Wallet, XCircle,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import { api } from '../../services/api';

const STATUS_UI: Record<string, { label: string; cls: string; icon: any }> = {
  PENDING: { label: '승인 대기', cls: 'bg-amber-50 text-amber-700', icon: Clock },
  APPROVED: { label: '승인 완료', cls: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
  NEEDS_REVISION: { label: '수정 요청함', cls: 'bg-sky-50 text-sky-700', icon: Pencil },
  REJECTED: { label: '거절함', cls: 'bg-slate-100 text-slate-500', icon: XCircle },
  EXPIRED: { label: '기간 만료', cls: 'bg-slate-100 text-slate-400', icon: Clock },
};

const REASONS = [
  { code: 'SCHEDULE', label: '일정이 맞지 않음' },
  { code: 'CATEGORY', label: '업종·브랜드가 맞지 않음' },
  { code: 'PRICE', label: '조건·금액 조정 필요' },
  { code: 'CONFLICT', label: '기존 계약과 충돌' },
  { code: 'ETC', label: '기타' },
];

export default function AthleteRequests() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<{ itemId: string; action: 'REVISION' | 'REJECT' } | null>(null);
  const [reason, setReason] = useState('SCHEDULE');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r: any = await api.getAthleteRequests();
      setItems(r?.data || []);
    } catch (e: any) {
      setErr(e?.response?.data?.error?.message || '요청 목록을 불러오지 못했습니다');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const act = async (item: any, action: 'APPROVE' | 'REVISION' | 'REJECT') => {
    if (action !== 'APPROVE' && !open) { setOpen({ itemId: item.id, action }); setComment(''); return; }
    setBusy(item.id);
    setErr(null);
    try {
      await api.reviewApplicationItem(item.applicationId, item.id, {
        action,
        ...(action !== 'APPROVE' ? { reasonCode: reason, comment: comment || REASONS.find((r) => r.code === reason)?.label } : {}),
      });
      setOpen(null);
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.error?.message || '처리에 실패했습니다');
    } finally { setBusy(null); }
  };

  const pending = items.filter((i) => i.status === 'PENDING');

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 pb-16">
      <PublicHeader />
      <section className="max-w-4xl mx-auto px-5 pt-8">
        <h1 className="text-[24px] sm:text-[28px] font-black tracking-tight">후원 승인함</h1>
        <p className="mt-2 text-[13.5px] text-slate-500">
          브랜드가 보낸 후원 요청을 확인하고 승인 여부를 결정하세요.
          {pending.length > 0 && <span className="ml-1 font-bold text-emerald-600">승인 대기 {pending.length}건</span>}
        </p>

        {err && <p className="mt-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-[12.5px] font-bold text-rose-700">{err}</p>}

        {loading ? (
          <div className="py-20 text-center"><div className="w-9 h-9 rounded-full border-4 border-emerald-100 border-t-emerald-500 animate-spin mx-auto" /></div>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 py-16 text-center">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="mt-3 text-[14px] font-bold text-slate-600">아직 도착한 후원 요청이 없습니다</p>
            <p className="mt-1 text-[12.5px] text-slate-400">프로필과 판매 슬롯을 완성하면 추천에 더 자주 노출됩니다.</p>
            <Link to="/my-slots" className="mt-5 inline-flex h-11 px-5 items-center rounded-xl bg-emerald-600 text-white text-sm font-bold">
              내 슬롯 관리
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {items.map((it) => {
              const ui = STATUS_UI[it.status] || STATUS_UI.PENDING;
              const app = it.application || {};
              const due = app.approvalDueAt ? new Date(app.approvalDueAt) : null;
              const expired = due ? due.getTime() < Date.now() : false;
              return (
                <article key={it.id} className="rounded-2xl bg-white border border-slate-200 p-5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-black ${ui.cls}`}>
                      <ui.icon className="w-3.5 h-3.5" /> {ui.label}
                    </span>
                    {app.planName && <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11.5px] font-bold">{app.planName}</span>}
                    <span className="ml-auto text-[11.5px] text-slate-400">
                      신청번호 {String(it.applicationId).slice(0, 8).toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-4 grid sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-[11.5px] text-slate-400 font-bold">후원 위치</p>
                      <p className="mt-1 text-[14px] font-extrabold inline-flex items-center gap-1.5">
                        <Shirt className="w-4 h-4 text-slate-400" /> {it.slotName || '-'}
                      </p>
                      {it.role && <p className="text-[11.5px] text-slate-400 mt-0.5">{it.role}</p>}
                    </div>
                    <div>
                      <p className="text-[11.5px] text-slate-400 font-bold">기간 · 금액</p>
                      <p className="mt-1 text-[14px] font-extrabold inline-flex items-center gap-1.5">
                        <Wallet className="w-4 h-4 text-slate-400" /> 월 {(it.price / 10000).toLocaleString()}만원
                      </p>
                      <p className="text-[11.5px] text-slate-400 mt-0.5">{app.durationMonths || 1}개월 · VAT 별도</p>
                    </div>
                    <div>
                      <p className="text-[11.5px] text-slate-400 font-bold">승인 기한</p>
                      <p className={`mt-1 text-[14px] font-extrabold ${expired ? 'text-rose-500' : ''}`}>
                        {due ? due.toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </p>
                      <p className="text-[11.5px] text-slate-400 mt-0.5">{expired ? '기한이 지났습니다' : '기한 내 응답해 주세요'}</p>
                    </div>
                  </div>

                  {it.status === 'PENDING' && !expired && (
                    <>
                      {open?.itemId === it.id ? (
                        <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-4">
                          <p className="text-[13px] font-extrabold mb-2.5">
                            {open!.action === 'REJECT' ? '거절 사유를 알려주세요' : '어떤 조정이 필요한가요?'}
                            <span className="ml-1 text-[11px] font-bold text-rose-500">필수</span>
                          </p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {REASONS.map((r) => (
                              <button
                                key={r.code}
                                onClick={() => setReason(r.code)}
                                className={`px-3 py-1.5 rounded-lg text-[12px] font-bold border transition-colors ${
                                  reason === r.code ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'
                                }`}
                              >
                                {r.label}
                              </button>
                            ))}
                          </div>
                          <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value.slice(0, 300))}
                            rows={2}
                            placeholder="브랜드에 전달할 내용을 적어주세요 (예: 9월 대회 일정과 겹칩니다. 10월부터 가능해요)"
                            className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-emerald-400 resize-none"
                          />
                          <div className="mt-3 flex gap-2 justify-end">
                            <button onClick={() => setOpen(null)} className="h-10 px-4 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600">
                              취소
                            </button>
                            <button
                              onClick={() => act(it, open!.action)}
                              disabled={busy === it.id}
                              className={`h-10 px-5 rounded-xl text-white text-[13px] font-bold disabled:opacity-50 ${
                                open!.action === 'REJECT' ? 'bg-slate-700 hover:bg-slate-800' : 'bg-sky-600 hover:bg-sky-700'
                              }`}
                            >
                              {busy === it.id ? '처리 중…' : open!.action === 'REJECT' ? '거절하기' : '수정 요청 보내기'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                          <button
                            onClick={() => act(it, 'APPROVE')}
                            disabled={busy === it.id}
                            className="h-11 px-6 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 text-white text-[13.5px] font-bold hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" /> {busy === it.id ? '처리 중…' : '승인하기'}
                          </button>
                          <button
                            onClick={() => { setOpen({ itemId: it.id, action: 'REVISION' }); setComment(''); }}
                            className="h-11 px-5 inline-flex items-center gap-1.5 rounded-xl border border-sky-300 text-sky-700 text-[13.5px] font-bold hover:bg-sky-50"
                          >
                            <Pencil className="w-4 h-4" /> 조건 조정 요청
                          </button>
                          <button
                            onClick={() => { setOpen({ itemId: it.id, action: 'REJECT' }); setComment(''); }}
                            className="h-11 px-5 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 text-slate-600 text-[13.5px] font-bold hover:bg-slate-50"
                          >
                            <XCircle className="w-4 h-4" /> 거절
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {(it.status === 'NEEDS_REVISION' || it.status === 'REJECTED') && it.comment && (
                    <p className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 px-3.5 py-3 text-[12.5px] text-slate-600">
                      <AlertTriangle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      내가 보낸 사유: {it.comment}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
