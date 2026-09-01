/**
 * 직접 선택 PICK 5단계 — 견적함 (핸드오프 v1.0 §7, 시안 img_03)
 *
 * 복수 선수·복수 상품을 한 화면에서 검토하고 충돌을 해결한다.
 * hold 남은 시간을 초 단위로 보여주고, 만료 시 즉시 재검증한다 (§6.2).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle, Bookmark, Box, CheckCircle2, ChevronRight, Clock, Loader2,
  Package, RefreshCw, Trash2, UserPlus, Users,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import DirectStepBar, { CONFLICT_LABEL } from '../../components/direct/DirectStepBar';
import { api } from '../../services/api';

const mmss = (ms: number) => {
  const t = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
};

export default function DirectCart() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const draftId = sp.get('draft');

  const [draft, setDraft] = useState<any>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [alts, setAlts] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    try {
      const r: any = draftId ? await api.getDirectDraft(draftId) : await api.openDirectDraft();
      setDraft(r?.data || null);
    } catch (e: any) {
      if (e?.response?.status === 401) { navigate(`/login?returnUrl=${encodeURIComponent('/sponsor/direct/cart')}`); return; }
      setErr(e?.response?.data?.error?.message || '견적함을 불러오지 못했습니다');
    } finally { setLoading(false); }
  }, [draftId, navigate]);
  useEffect(() => { load(); }, [load]);

  /* hold 카운트다운 — 1초 간격, 만료되면 한 번만 재검증한다 */
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const holdEnd = draft?.summary?.holdExpiresAt ? new Date(draft.summary.holdExpiresAt).getTime() : null;
  const expired = holdEnd != null && holdEnd <= now;
  useEffect(() => {
    if (expired && draft && !busy) revalidate();
  }, [expired]); // eslint-disable-line react-hooks/exhaustive-deps

  const revalidate = async () => {
    if (!draft) return;
    setBusy(true);
    setErr(null);
    try {
      const r: any = await api.validateDirectDraft(draft.id);
      setDraft(r.data.draft);
      setIssues(r.data.issues || []);
      /* 충돌 항목마다 대체안을 미리 받아 둔다 (§6.3) */
      const conflicts = (r.data.issues || []).filter((i: any) => i.severity === 'ERROR');
      const pairs = await Promise.all(conflicts.map(async (i: any) => {
        try {
          const a: any = await api.getDirectAlternatives(i.itemId);
          return [i.itemId, a.data.alternatives] as const;
        } catch { return [i.itemId, []] as const; }
      }));
      setAlts(Object.fromEntries(pairs));
    } catch (e: any) {
      setErr(e?.response?.data?.error?.message || '재검증에 실패했습니다');
    } finally { setBusy(false); }
  };

  const remove = async (itemId: string) => {
    setBusy(true);
    try {
      const r: any = await api.removeDirectItem(itemId);
      setDraft(r.data);
      setIssues((prev) => prev.filter((i) => i.itemId !== itemId));
    } catch (e: any) {
      setErr(e?.response?.data?.error?.message || '삭제하지 못했습니다');
    } finally { setBusy(false); }
  };

  const goRequest = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r: any = await api.validateDirectDraft(draft.id);
      setDraft(r.data.draft);
      setIssues(r.data.issues || []);
      if (r.data.result === 'CONFLICT') {
        setErr('해결해야 할 항목이 있습니다. 아래 경고를 확인해주세요.');
        return;
      }
      navigate(`/sponsor/direct/request/${draft.id}`);
    } catch (e: any) {
      setErr(e?.response?.data?.error?.message || '검증에 실패했습니다');
    } finally { setBusy(false); }
  };

  /* 선수 그룹 (§7.1) */
  const groups = useMemo(() => {
    const map = new Map<string, { athlete: any; items: any[] }>();
    for (const i of draft?.items || []) {
      const g = map.get(i.athleteId) || { athlete: i.athlete, items: [] };
      g.items.push(i);
      map.set(i.athleteId, g);
    }
    return [...map.values()];
  }, [draft]);

  const issueOf = (itemId: string) => issues.filter((i) => i.itemId === itemId);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <PublicHeader />
        <div className="py-24 text-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" /></div>
      </div>
    );
  }

  const s = draft?.summary;
  const empty = !draft?.items?.length;

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-16">
      <PublicHeader />
      <DirectStepBar current={5} crumbs={[{ label: '견적함' }]} backTo="/sponsor/direct/athletes" backLabel="선수 더 둘러보기" />

      <div className="max-w-[1400px] mx-auto px-5 pt-6">
        <h1 className="text-[26px] sm:text-[32px] font-black tracking-tight">선택한 후원 구성을 확인하세요</h1>
        <p className="mt-2 text-[13.5px] text-slate-500">선수별 상품 · 기간 · 가격과 확인이 필요한 조건을 검토하세요.</p>

        {empty ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 py-20 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="mt-3 text-[14px] font-bold text-slate-600">견적함이 비어 있습니다</p>
            <p className="mt-1 text-[12.5px] text-slate-400">선수를 고르고 후원 위치를 담아보세요.</p>
            <Link to="/sponsor/direct/athletes" className="mt-5 inline-flex h-11 px-5 items-center rounded-xl bg-emerald-600 text-white text-sm font-bold">
              선수 탐색으로 이동
            </Link>
          </div>
        ) : (
          <div className="mt-5 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] gap-5 items-start">
            <div className="space-y-3">
              {/* 헤더 요약 */}
              <div className="rounded-2xl border border-slate-200 px-5 py-4 flex flex-wrap items-center gap-x-8 gap-y-2">
                <span className="inline-flex items-center gap-2 text-[13px] font-bold">
                  <Users className="w-4 h-4 text-slate-400" /> 선수 {s.athleteCount}명
                </span>
                <span className="inline-flex items-center gap-2 text-[13px] font-bold">
                  <Box className="w-4 h-4 text-slate-400" /> 상품 {s.itemCount}개
                </span>
                {holdEnd != null && (
                  <span className={`inline-flex items-center gap-2 text-[13px] font-bold ${expired ? 'text-rose-600' : 'text-emerald-700'}`}>
                    <Clock className="w-4 h-4" />
                    {expired ? '임시 보유 만료' : `${mmss(holdEnd - now)} 남음`}
                  </span>
                )}
                <button
                  onClick={revalidate}
                  disabled={busy}
                  className="ml-auto h-9 px-3.5 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 text-[12.5px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} /> 재검증
                </button>
              </div>

              {/* 선수 그룹 */}
              {groups.map((g) => (
                <div key={g.athlete.id} className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center gap-3">
                    <span className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 shrink-0">
                      {g.athlete.profileImageUrl && <img src={g.athlete.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[15.5px] font-extrabold">{g.athlete.name} <span className="text-[11.5px] font-bold text-slate-400">프로</span></p>
                      <p className="text-[11.5px] text-slate-400">{[g.athlete.tour, g.athlete.region].filter(Boolean).join(' · ')}</p>
                    </div>
                    <Link
                      to={`/sponsor/direct/build/${g.athlete.id}`}
                      className="ml-auto shrink-0 h-9 px-3.5 inline-flex items-center gap-1 rounded-lg border border-slate-200 text-[12.5px] font-bold text-slate-600 hover:bg-slate-50"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> 상품 추가
                    </Link>
                  </div>

                  <ul className="mt-4 space-y-2.5">
                    {g.items.map((i: any) => {
                      const its = issueOf(i.id);
                      const bad = its.some((x) => x.severity === 'ERROR');
                      return (
                        <li key={i.id} className={`rounded-xl border p-3.5 ${bad ? 'border-rose-200 bg-rose-50/40' : 'border-slate-100'}`}>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold">
                              {i.kind === 'ONLINE_PRODUCT' ? '온라인 전용' : '착장'}
                            </span>
                            <span className="text-[13.5px] font-extrabold">{i.slotName}</span>
                            <span className="text-[12px] text-slate-400">{i.months > 1 ? `${i.months}개월` : i.durationCode === 'SINGLE_EVENT' ? '대회 1회' : '30일'}</span>
                            {i.status === 'NEEDS_CONFIRMATION' && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[11px] font-bold">선수 확인 필요</span>
                            )}
                            {i.status === 'OK' && !bad && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> 재고 확보
                              </span>
                            )}
                            <span className="ml-auto text-[15px] font-black tabular-nums">{i.subtotal.toLocaleString()}원</span>
                            <button
                              onClick={() => remove(i.id)}
                              aria-label={`${i.slotName} 삭제`}
                              className="shrink-0 w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-200"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {(i.addOns as any[])?.length > 0 && (
                            <p className="mt-1.5 text-[11.5px] text-slate-500">
                              추가 활동: {(i.addOns as any[]).map((a) => `${a.label} ${a.count}회`).join(' · ')}
                            </p>
                          )}

                          {its.map((x, k) => (
                            <p key={k} className={`mt-2 flex items-start gap-1.5 text-[12px] break-keep ${x.severity === 'ERROR' ? 'text-rose-700' : 'text-amber-700'}`}>
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <span>
                                <b>{CONFLICT_LABEL[x.code] || x.code}</b> — {x.message}
                                <span className="block text-slate-500">{x.resolution}</span>
                              </span>
                            </p>
                          ))}

                          {alts[i.id]?.length > 0 && (
                            <div className="mt-2.5 pt-2.5 border-t border-rose-100">
                              <p className="text-[11.5px] font-bold text-slate-500 mb-1.5">대체 가능한 위치</p>
                              <div className="flex flex-wrap gap-1.5">
                                {alts[i.id].map((alt: any) => (
                                  <Link
                                    key={alt.code}
                                    to={`/sponsor/direct/build/${g.athlete.id}?slot=${alt.code}`}
                                    className="px-2.5 py-1.5 rounded-lg border border-emerald-300 text-emerald-700 text-[11.5px] font-bold hover:bg-emerald-50"
                                  >
                                    {alt.name} {(alt.price / 10000).toLocaleString()}만원
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}

              <p className="flex items-start gap-2 rounded-2xl bg-slate-50 px-5 py-4 text-[12.5px] text-slate-500 break-keep">
                <Bookmark className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
                <span>
                  <b className="text-slate-700">임시 보유 시간이 만료되어도 저장된 견적은 유지됩니다.</b><br />
                  단, 재고는 확보가 해제되므로 승인 요청 전 다시 확인이 필요합니다.
                </span>
              </p>
            </div>

            {/* 우: 견적 요약 */}
            <aside className="lg:sticky lg:top-24 rounded-2xl border border-slate-200 p-5">
              <h2 className="text-[15px] font-extrabold">견적 요약</h2>

              <dl className="mt-4 space-y-2.5 text-[13px]">
                <div className="flex justify-between"><dt className="text-slate-500">공급가 합계</dt><dd className="font-bold tabular-nums">{s.supplyAmount.toLocaleString()}원</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">부가세 (10%)</dt><dd className="font-bold tabular-nums">{s.vatAmount.toLocaleString()}원</dd></div>
              </dl>
              <div className="mt-3 pt-3 border-t border-slate-200 flex items-baseline justify-between">
                <span className="text-[13px] font-bold">총 합계</span>
                <span className="text-[22px] font-black text-emerald-600 tabular-nums">{s.totalAmount.toLocaleString()}원</span>
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-3.5 space-y-2 text-[12.5px]">
                <div className="flex justify-between">
                  <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> 확정 금액 (재고 확보)</span>
                  <b className="text-emerald-700 tabular-nums">{s.confirmedAmount.toLocaleString()}원</b>
                </div>
                <div className="flex justify-between">
                  <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> 확인 필요 금액</span>
                  <b className="text-amber-700 tabular-nums">{s.pendingAmount.toLocaleString()}원</b>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="text-slate-500">월 환산</span>
                  <b className="tabular-nums">{s.monthlyEquivalent.toLocaleString()}원 / 월</b>
                </div>
              </div>

              {err && <p className="mt-3 text-[12.5px] font-bold text-rose-600 break-keep">{err}</p>}

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link
                  to="/sponsor/direct/athletes"
                  className="h-11 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 hover:bg-slate-50"
                >
                  <UserPlus className="w-4 h-4" /> 선수 더 추가
                </Link>
                <button
                  onClick={revalidate}
                  disabled={busy}
                  className="h-11 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} /> 재검증
                </button>
              </div>
              <button
                onClick={goRequest}
                disabled={busy}
                className="mt-2 w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white text-[14.5px] font-bold hover:bg-emerald-700 disabled:opacity-40"
              >
                {busy ? '검증 중…' : <>승인 요청 준비 <ChevronRight className="w-4 h-4" /></>}
              </button>
              <p className="mt-2 text-center text-[11px] text-slate-400">승인 요청 전까지 선수에게 노출되지 않습니다.</p>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
