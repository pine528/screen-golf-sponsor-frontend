/**
 * IU07 이의제기 · 보완지원 `/about/my-guarantees/:id/appeal` — 시안 2026-09-17 (리디자인/10 · 36)
 *
 *  좌: 대상 계약 선택(내 계약 드롭다운) → 최종 KPI 결과(NOT_MET 박스 · 미달 사유 · 이의제기 마감일 D-n)
 *     → 이의 사유(필수 0/1,000) → 증빙 자료 첨부(PDF·JPG·PNG 10MB, 드래그/클릭 업로드) + 증빙 유형 체크 → 사실 확인(필수) → 접수 / 담당자 문의
 *  우: 보완지원 예상 안내(자격 · 차기 후원 지원 최대 n% · 최대 한도 · 사용 기한 · 현금 환급 아님 · 양도 불가) → 절차 4단계(가로) → 공정 검토 · 문의
 *  예상 보완지원은 계약 스냅샷의 규칙으로만 계산한다.
 */
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Upload, CheckCircle2, AlertCircle, Scale, FileSearch, Gift, ShieldCheck, HelpCircle, ChevronDown, X, FileText, Loader2, Info } from 'lucide-react';
import { api } from '../../services/api';
import AboutShell, { Tag, StateNotice, Skeleton, nf, ymd } from '../../components/about/AboutShell';

const STEP_ICON: Record<string, any> = { RECEIVED: Upload, UNDER_REVIEW: FileSearch, DECIDED: Scale, SUPPORT_ISSUED: Gift };
const MAX_FILE = 10 * 1024 * 1024;

export default function GuaranteeAppeal() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState<any>(null);
  const [mine, setMine] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState('');
  const [types, setTypes] = useState<string[]>([]);
  const [files, setFiles] = useState<{ name: string; url: string; size: number }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [attested, setAttested] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getGuaranteeAppealContext(id).then((r) => setData(r.data)).catch((e) => setError(e?.response?.data?.error?.message || '대상 계약을 불러오지 못했습니다')),
      api.getMyGuarantees().then((r) => setMine(r.data?.snapshots ?? [])).catch(() => null),
    ]).finally(() => setLoading(false));
  }, [id]);

  const onFile = async (list?: FileList | null) => {
    if (!list?.length) return;
    setError(null);
    for (const f of Array.from(list)) {
      if (!/^(application\/pdf|image\/(jpeg|png|jpg))$/.test(f.type)) { setError('PDF, JPG, PNG 파일만 첨부할 수 있습니다'); continue; }
      if (f.size > MAX_FILE) { setError('10MB 이하 파일만 첨부할 수 있습니다'); continue; }
      setUploading(true);
      try { const r: any = await api.uploadFile(f, 'asset'); if (r?.data?.fileUrl) setFiles((v) => [...v, { name: f.name, url: r.data.fileUrl, size: f.size }]); }
      catch (e: any) { setError(e?.response?.data?.error?.message || '파일을 올리지 못했습니다'); }
      finally { setUploading(false); }
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      const r = await api.submitGuaranteeAppeal(id, { reason, evidenceTypes: types, attachments: files, attested });
      setDone(r.data);
    } catch (e: any) {
      if (e?.response?.status === 401) { nav(`/login?returnUrl=/about/my-guarantees/${id}/appeal`); return; }
      setError(e?.response?.data?.error?.message || '접수에 실패했습니다');
    } finally { setBusy(false); }
  };

  const crumb = [{ label: '성과보장 프로그램', to: '/about/performance-guarantee' }, { label: '내 성과보장 현황', to: '/about/my-guarantees' }, { label: '이의제기 · 보완지원' }];

  if (loading) {
    return <AboutShell current="guarantee" crumb={crumb}><div className="max-w-[1280px] mx-auto px-5 py-10 space-y-4"><Skeleton className="h-[160px] rounded-3xl" /><Skeleton className="h-[320px] rounded-3xl" /></div></AboutShell>;
  }
  if (!data) {
    return <AboutShell current="guarantee" crumb={crumb}><div className="max-w-2xl mx-auto px-5 py-20"><StateNotice kind="error" title="이의제기를 진행할 수 없습니다" desc={error ?? undefined} action={<Link to="/about/my-guarantees" className="inline-flex h-11 px-5 rounded-2xl bg-slate-900 text-white text-[14px] font-bold items-center">내 보장 현황</Link>} /></div></AboutShell>;
  }
  if (done) {
    return (
      <AboutShell current="guarantee" crumb={crumb}>
        <div className="max-w-lg mx-auto px-5 py-20 text-center">
          <div className="mx-auto w-16 h-16 rounded-3xl bg-emerald-50 flex items-center justify-center mb-5"><CheckCircle2 className="w-7 h-7 text-emerald-500" /></div>
          <h1 className="text-[24px] font-extrabold text-slate-900 tracking-[-0.02em]">이의제기가 접수되었습니다</h1>
          <p className="mt-3 text-[14px] text-slate-500 leading-relaxed break-keep">{done.message}</p>
          <p className="mt-4 font-mono text-[13px] text-slate-500">{done.appeal.code}</p>
          {done.appeal.slaDueAt && <p className="mt-1.5 text-[12px] text-slate-500">검토 예정 {ymd(done.appeal.slaDueAt)} 까지</p>}
          <Link to="/about/my-guarantees" className="mt-8 inline-flex h-12 px-6 rounded-2xl bg-slate-900 text-white text-[15px] font-bold items-center">내 보장 현황으로</Link>
        </div>
      </AboutShell>
    );
  }

  const s = data.snapshot;
  const len = reason.trim().length;
  const valid = data.canAppeal && len >= 10 && len <= 1000 && attested && !uploading;
  const est = data.remedyEstimate;

  return (
    <AboutShell current="guarantee" crumb={crumb} title="이의제기 · 보완지원" desc="최종 KPI 결과에 이의가 있거나, 보완지원이 필요하신 경우 아래 내용을 제출해 주세요.">
      <div className="max-w-[1280px] mx-auto px-5 pb-20">
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_440px] gap-4 items-start">
          {/* 좌: 폼 */}
          <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 space-y-6">
            <div>
              <p className="text-[13.5px] font-extrabold text-slate-800 mb-2">대상 계약 선택</p>
              <div className="relative">
                <select value={id} onChange={(e) => nav(`/about/my-guarantees/${e.target.value}/appeal`)} className="w-full h-12 pl-4 pr-10 rounded-xl border border-slate-200 bg-white text-[14px] font-bold appearance-none focus:outline-none focus:border-emerald-400">
                  {(mine.length ? mine : [s]).map((m: any) => <option key={m.id} value={m.id}>{m.brandName} × {m.athleteName} 프로{m.statusLabel ? ` · ${m.statusLabel}` : ''}</option>)}
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <p className="text-[13.5px] font-extrabold text-slate-800 mb-2">최종 KPI 결과</p>
              <div className={`rounded-2xl border p-4 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-4 ${['NOT_MET', 'REMEDY_ELIGIBLE', 'APPEALED'].includes(s.status) ? 'border-rose-200 bg-rose-50/60' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex gap-3">
                  <span className={`self-start px-2.5 py-1.5 rounded-md text-[12px] font-black tracking-wide shrink-0 ${['NOT_MET', 'REMEDY_ELIGIBLE', 'APPEALED'].includes(s.status) ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-700'}`}>{s.status}</span>
                  <div className="min-w-0"><p className="text-[13px] text-slate-700 leading-relaxed break-keep">{s.statusDesc}</p>
                    {data.failedMetrics.length > 0 && <p className="mt-1 text-[12.5px] text-slate-700 break-keep">주요 미달 사유: {data.failedMetrics.map((f: any) => f.summary).join(' · ')}</p>}
                  </div>
                </div>
                {data.appealRemainDays !== null && (
                  <div className="text-right sm:border-l border-rose-100 sm:pl-4">
                    <p className="text-[12px] text-slate-500 font-semibold">이의제기 마감일</p>
                    <p className={`text-[26px] font-black tabular-nums leading-none ${data.appealRemainDays > 0 ? 'text-rose-600' : 'text-slate-500'}`}>{data.appealRemainDays > 0 ? `D-${data.appealRemainDays}` : '마감'}</p>
                    {data.appealDueAt && <p className="mt-1 text-[11.5px] text-slate-500 tabular-nums">{ymd(data.appealDueAt)} 23:59 까지</p>}
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="text-[13.5px] font-extrabold text-slate-800 mb-2 inline-flex items-center gap-1.5">이의 사유 입력 <Tag tone="emerald">필수</Tag></p>
              <textarea value={reason} onChange={(e) => setReason(e.target.value.slice(0, 1000))} placeholder="이의 사유를 입력해 주세요." rows={5} disabled={!data.canAppeal}
                className="w-full rounded-xl border border-slate-200 p-4 text-[14px] text-slate-700 leading-relaxed placeholder:text-slate-300 resize-y focus:outline-none focus:border-emerald-400 disabled:bg-slate-50" />
              <p className="mt-1 text-right text-[12px] text-slate-500 tabular-nums">{nf(len)} / 1,000</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-5">
              <div>
                <p className="text-[13.5px] font-extrabold text-slate-800 mb-2 inline-flex items-center gap-1.5">증빙 자료 첨부 <Tag>선택</Tag></p>
                <input ref={fileRef} type="file" multiple accept="application/pdf,image/jpeg,image/png" className="hidden" onChange={(e) => onFile(e.target.files)} />
                <button type="button" disabled={!data.canAppeal || uploading} onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); onFile(e.dataTransfer.files); }}
                  className={`w-full rounded-xl border-2 border-dashed px-4 py-7 text-center transition ${dragging ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-slate-50/60 hover:border-slate-400'} disabled:opacity-60`}>
                  {uploading ? <Loader2 className="w-6 h-6 text-emerald-500 mx-auto mb-2 animate-spin" /> : <Upload className="w-6 h-6 text-emerald-600 mx-auto mb-2" />}
                  <p className="text-[13px] font-bold text-slate-700">파일을 드래그하거나 클릭하여 업로드하세요.</p>
                  <p className="text-[12px] text-slate-400 mt-1">PDF, JPG, PNG 파일 (최대 10MB)</p>
                </button>
                {files.length > 0 && (
                  <ul className="mt-2 space-y-1.5">{files.map((f, i) => <li key={f.url} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[12.5px]"><FileText className="w-4 h-4 text-slate-500 shrink-0" /><span className="flex-1 truncate font-bold text-slate-700">{f.name}</span><span className="text-slate-400 tabular-nums">{(f.size / 1024).toFixed(0)}KB</span><button type="button" onClick={() => setFiles((v) => v.filter((_, j) => j !== i))} aria-label="삭제" className="text-slate-400 hover:text-rose-500"><X className="w-4 h-4" /></button></li>)}</ul>
                )}
              </div>
              <div>
                <p className="text-[13.5px] font-extrabold text-slate-800 mb-2">증빙 유형 체크 <span className="text-[11.5px] text-slate-400 font-medium">(해당되는 항목을 선택해 주세요)</span></p>
                <div className="space-y-2.5">
                  {data.evidenceTypes.map((t: any) => (
                    <label key={t.code} className="flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox" checked={types.includes(t.code)} onChange={(e) => setTypes((v) => e.target.checked ? [...v, t.code] : v.filter((x) => x !== t.code))} disabled={!data.canAppeal} className="w-4 h-4 rounded accent-emerald-600" />
                      <span className="text-[13px] text-slate-700">{t.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3.5 cursor-pointer">
              <input type="checkbox" checked={attested} onChange={(e) => setAttested(e.target.checked)} disabled={!data.canAppeal} className="w-4.5 h-4.5 w-[18px] h-[18px] mt-0.5 rounded accent-emerald-600" />
              <span className="flex-1"><span className="block text-[13.5px] font-bold text-slate-800">상기 내용이 사실이며, 제출한 증빙자료가 진실됨을 확인합니다.</span><span className="block text-[12px] text-slate-500 mt-0.5">허위 제출 시 서비스 이용 제한 및 법적 책임이 발생할 수 있습니다.</span></span>
              <Tag tone="emerald">필수</Tag>
            </label>

            {!data.canAppeal && (
              <div className="rounded-xl bg-amber-50 px-4 py-3 flex items-start gap-2.5"><AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" /><p className="text-[12.5px] text-amber-700 leading-relaxed break-keep">
                {data.existingAppeals.some((a: any) => ['RECEIVED', 'UNDER_REVIEW'].includes(a.status)) ? '이미 접수된 이의제기가 처리 중입니다.' : data.appealRemainDays !== null && data.appealRemainDays <= 0 ? '이의제기 기간이 지났습니다.' : '판정이 확정된 뒤에 이의제기를 할 수 있습니다.'}
              </p></div>
            )}
            {error && <div className="rounded-xl bg-rose-50 px-4 py-3 text-[13px] font-semibold text-rose-600 break-keep">{error}</div>}

            <div className="grid sm:grid-cols-2 gap-3">
              <button disabled={!valid || busy} onClick={submit} className="h-12 rounded-xl bg-emerald-800 text-white text-[15px] font-extrabold hover:bg-emerald-900 disabled:bg-slate-200 disabled:text-slate-400 transition">{busy ? '접수 중…' : '이의제기 접수'}</button>
              <Link to="/contact" className="h-12 rounded-xl border-2 border-emerald-700 text-emerald-800 text-[15px] font-extrabold flex items-center justify-center hover:bg-emerald-50 transition">담당자 문의</Link>
            </div>

            {data.existingAppeals.length > 0 && (
              <div className="pt-5 border-t border-slate-100">
                <p className="text-[13px] font-bold text-slate-500 mb-2">접수 이력</p>
                <div className="space-y-1.5">{data.existingAppeals.map((a: any) => <div key={a.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-2.5 text-[12.5px]"><span className="font-mono text-slate-500">{a.code}</span><Tag tone={a.status === 'DECIDED' ? 'emerald' : 'sky'}>{a.status}</Tag>{a.decisionNote && <span className="text-slate-600 truncate">{a.decisionNote}</span>}<span className="ml-auto text-slate-500 tabular-nums">{ymd(a.createdAt)}</span></div>)}</div>
              </div>
            )}
          </section>

          {/* 우: 안내 */}
          <aside className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
            <p className="text-[16px] font-extrabold text-slate-900 inline-flex items-center gap-1">보완지원 예상 안내 <HelpCircle className="w-3.5 h-3.5 text-slate-400" /></p>
            {est ? (
              <dl className="mt-3 divide-y divide-slate-100">
                <div className="py-3 flex items-center justify-between"><dt className="text-[13px] text-slate-600">보완지원 자격</dt><dd className="inline-flex items-center gap-1 text-[13px] font-extrabold text-emerald-700">산정 완료 <CheckCircle2 className="w-4 h-4" /></dd></div>
                <div className="py-3 flex items-start justify-between gap-3"><dt className="text-[13px] text-slate-600">차기 후원 지원 <span className="text-slate-400">(계약금액 기준)</span></dt><dd className="text-right"><p className="text-[24px] font-black text-emerald-700 tabular-nums leading-none">{est.ratio ? `최대 ${est.ratio}%` : '계약별'}</p><p className="mt-1 text-[11.5px] text-slate-500">({est.basis})</p></dd></div>
                {est.estimatedAmount !== null && <div className="py-3 flex items-center justify-between"><dt className="text-[13px] text-slate-600">최대 지원 한도</dt><dd className="text-[22px] font-black text-emerald-800 tabular-nums">₩{nf(est.estimatedAmount)}</dd></div>}
                {est.validMonths && <div className="py-3 flex items-center justify-between"><dt className="text-[13px] text-slate-600">사용 기한</dt><dd className="text-[15px] font-extrabold text-emerald-800">발급일로부터 {est.validMonths}개월</dd></div>}
              </dl>
            ) : <p className="mt-3 text-[13px] text-slate-500 leading-relaxed break-keep">보완지원 자격은 최종 판정이 확정된 뒤에 산정됩니다.</p>}
            <div className="mt-2 space-y-2.5">
              <div className="flex items-start gap-2.5"><span className="px-2 py-1 rounded-md bg-rose-50 text-rose-600 text-[11.5px] font-extrabold shrink-0">현금 환급 아님</span><p className="text-[12.5px] text-slate-600 leading-relaxed break-keep">보완지원은 현금 환급이 아닌, 차기 후원 시 사용할 수 있는 지원입니다.</p></div>
              <div className="flex items-start gap-2.5"><span className="px-2 py-1 rounded-md bg-rose-50 text-rose-600 text-[11.5px] font-extrabold shrink-0">양도 불가</span><p className="text-[12.5px] text-slate-600 leading-relaxed break-keep">보완지원은 계약 브랜드에 한해 사용 가능하며, 타 브랜드로 양도할 수 없습니다.</p></div>
            </div>

            <p className="mt-6 pt-5 border-t border-slate-100 text-[15px] font-extrabold text-slate-900">이의제기·보완지원 절차</p>
            <ol className="mt-4 grid grid-cols-4 relative">
              <span aria-hidden className="absolute left-[12%] right-[12%] top-[26px] h-[2px] bg-slate-200" />
              {data.process.map((p: any, i: number) => { const I = STEP_ICON[p.code] ?? Upload; return (
                <li key={p.code} className="relative text-center">
                  <span className={`mx-auto w-[52px] h-[52px] rounded-full border-2 flex items-center justify-center bg-white ${i === 0 ? 'border-emerald-600 text-emerald-700' : 'border-slate-200 text-slate-500'}`}><I className="w-5 h-5" /></span>
                  <p className={`mt-2 text-[12.5px] font-extrabold ${i === 0 ? 'text-emerald-700' : 'text-slate-700'}`}>{p.label}</p>
                  <p className="text-[11px] text-slate-500 break-keep leading-tight">{p.desc}</p>
                </li>
              ); })}
            </ol>

            <div className="mt-6 rounded-2xl bg-emerald-50 border border-emerald-100 p-4 flex items-start gap-2.5"><ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" /><div><p className="text-[13.5px] font-extrabold text-emerald-900">공정하고 투명한 검토</p><p className="mt-1 text-[12.5px] text-slate-700 leading-relaxed break-keep">스폰픽은 계약서 및 제출 자료를 기반으로 공정하게 검토합니다. 이의가 타당하다고 판단될 경우, 보완지원이 제공됩니다.</p></div></div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-start gap-2.5 text-[12.5px] text-slate-600"><Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" /><p className="break-keep"><b className="text-slate-800">궁금한 점이 있으신가요?</b><br />담당자에게 문의하시면 빠르게 안내해 드리겠습니다.</p></div>
            <ul className="mt-3 space-y-1">{data.notices.map((n: string, i: number) => <li key={i} className="text-[11.5px] text-slate-400 leading-relaxed pl-3 relative break-keep"><span className="absolute left-0 top-[7px] w-1 h-1 rounded-full bg-slate-300" />{n}</li>)}</ul>
          </aside>
        </div>
      </div>
    </AboutShell>
  );
}
