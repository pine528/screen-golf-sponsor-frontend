/**
 * 직접 선택 PICK 6단계 — 승인 요청 전 검토 (핸드오프 v1.0 §8, 시안 img_04·img_07)
 *
 * 브랜드·소재·사용권·일정을 확인하고 선수에게 승인 요청을 보낸다.
 * 이 단계는 결제가 아니며, 조건 변경 시 재승인이 필요하다 (§8.1 동의).
 */
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle, Ban, Calendar, CheckCircle2, ChevronDown,
  FileUp, Info, Loader2, Send, ShieldCheck, Tag, Users, Wallet,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import DirectStepBar from '../../components/direct/DirectStepBar';
import { api } from '../../services/api';

const BRAND_KEY = 'sponpik.direct.brandInfo';

const SCOPE_LABEL: Record<string, string> = {
  OFFLINE: '대회 착장', ONLINE: '온라인 이미지', PRINT: '매장 인쇄물', SECONDARY: '2차 활용',
};

export default function DirectRequest() {
  const { draftId } = useParams();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>('brand');

  const [brand, setBrand] = useState({
    company: '', bizNo: '', manager: '', email: '', phone: '',
    category: '', website: '', target: '', message: '',
  });
  const [agreed, setAgreed] = useState(false);

  const load = useCallback(async () => {
    try {
      const r: any = await api.getDirectDraft(draftId!);
      setDraft(r?.data || null);
    } catch (e: any) {
      if (e?.response?.status === 401) { navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`); return; }
      setErr(e?.response?.data?.error?.message || '견적을 불러오지 못했습니다');
    } finally { setLoading(false); }
  }, [draftId, navigate]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(BRAND_KEY);
      if (raw) setBrand((b) => ({ ...b, ...JSON.parse(raw) }));
    } catch { /* 저장값이 깨졌으면 빈 폼으로 시작한다 */ }
  }, []);

  const missing = !brand.company || !brand.manager || !brand.email;

  const submit = async () => {
    if (missing) { setErr('회사명 · 담당자 · 이메일은 필수입니다'); setOpen('brand'); return; }
    if (!agreed) { setErr('승인 요청 안내에 동의해주세요'); return; }
    setBusy(true);
    setErr(null);
    try {
      localStorage.setItem(BRAND_KEY, JSON.stringify(brand));
      const r: any = await api.submitDirectDraft(draftId!, brand);
      navigate(`/sponsor/direct/approval/${r.data.applicationId}`);
    } catch (e: any) {
      setErr(e?.response?.data?.error?.message || '승인 요청을 보내지 못했습니다');
      if (e?.response?.status === 409) await load();
    } finally { setBusy(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <PublicHeader />
        <div className="py-24 text-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" /></div>
      </div>
    );
  }
  if (!draft) {
    return (
      <div className="min-h-screen bg-white">
        <PublicHeader />
        <div className="max-w-lg mx-auto px-5 py-24 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <p className="mt-4 text-[15px] font-bold">{err || '견적을 찾을 수 없습니다'}</p>
          <Link to="/sponsor/direct/cart" className="mt-5 inline-flex h-11 px-5 items-center rounded-xl bg-emerald-600 text-white text-sm font-bold">
            견적함으로
          </Link>
        </div>
      </div>
    );
  }

  const s = draft.summary;
  const onlineOnly = draft.items.filter((i: any) => i.kind === 'ONLINE_PRODUCT');
  const needsConfirm = draft.items.filter((i: any) => i.status === 'NEEDS_CONFIRMATION');
  const allScopes = [...new Set(draft.items.flatMap((i: any) => (i.scopes as string[]) || []))];

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-16">
      <PublicHeader />
      <DirectStepBar current={6} crumbs={[{ label: '승인 요청' }]} backTo={`/sponsor/direct/cart?draft=${draft.id}`} backLabel="견적함으로 돌아가기" />

      <div className="max-w-[1400px] mx-auto px-5 pt-6">
        <h1 className="text-[26px] sm:text-[32px] font-black tracking-tight break-keep">선수에게 보낼 요청 내용을 최종 확인하세요</h1>
        <p className="mt-2 text-[13.5px] text-slate-500">요청 전 브랜드 · 소재 · 후원 조건과 사용 범위를 확인해주세요.</p>

        <div className="mt-6 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] gap-5 items-start">
          <div className="space-y-3">
            {/* 브랜드/제품 정보 */}
            <Section
              id="brand" open={open} setOpen={setOpen}
              icon={Tag} title="브랜드 / 제품 정보"
              status={missing ? 'TODO' : 'DONE'}
              summary={missing ? '필수 항목을 입력하세요' : `${brand.company} · ${brand.category || '업종 미기재'}`}
            >
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field label="회사명" required value={brand.company} onChange={(v) => setBrand({ ...brand, company: v })} />
                <Field label="사업자번호" value={brand.bizNo} onChange={(v) => setBrand({ ...brand, bizNo: v })} placeholder="000-00-00000" />
                <Field label="담당자" required value={brand.manager} onChange={(v) => setBrand({ ...brand, manager: v })} />
                <Field label="이메일" required value={brand.email} onChange={(v) => setBrand({ ...brand, email: v })} placeholder="brand@example.com" />
                <Field label="연락처" value={brand.phone} onChange={(v) => setBrand({ ...brand, phone: v })} />
                <Field label="업종" value={brand.category} onChange={(v) => setBrand({ ...brand, category: v })} placeholder="예) cosmetics" />
                <Field label="홈페이지" value={brand.website} onChange={(v) => setBrand({ ...brand, website: v })} placeholder="https://" />
                <Field label="주요 타깃" value={brand.target} onChange={(v) => setBrand({ ...brand, target: v })} placeholder="예) 3040 여성" />
              </div>
              <label className="mt-3 block">
                <span className="text-[12px] font-bold text-slate-500">선수에게 전달할 메시지 <span className="font-normal text-slate-400">(선택)</span></span>
                <textarea
                  value={brand.message}
                  onChange={(e) => setBrand({ ...brand, message: e.target.value.slice(0, 500) })}
                  rows={3}
                  placeholder="후원 목표와 핵심 메시지를 적어주세요"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-emerald-400 resize-none"
                />
              </label>
            </Section>

            {/* 선수별 후원 구성 */}
            <Section
              id="items" open={open} setOpen={setOpen}
              icon={Users} title="선수별 후원 구성" status="DONE"
              summary={`선수 ${s.athleteCount}명 · 상품 ${s.itemCount}개`}
            >
              <ul className="divide-y divide-slate-100">
                {draft.items.map((i: any) => (
                  <li key={i.id} className="py-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 shrink-0">
                      {i.athlete.profileImageUrl && <img src={i.athlete.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}
                    </span>
                    <span className="text-[13.5px] font-extrabold">{i.athlete.name} 프로</span>
                    <span className="text-[12px] text-slate-400">{i.athlete.tour}</span>
                    <span className="text-[12.5px] text-slate-600">{i.slotName}</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold">
                      {i.months > 1 ? `${i.months}개월` : i.durationCode === 'SINGLE_EVENT' ? '대회 1회' : '30일'}
                    </span>
                    {i.status === 'NEEDS_CONFIRMATION' && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[11px] font-bold">확인 필요</span>
                    )}
                    <span className="ml-auto text-[14px] font-black tabular-nums">{i.subtotal.toLocaleString()}원</span>
                  </li>
                ))}
              </ul>
            </Section>

            {/* 소재 제출 */}
            <Section
              id="assets" open={open} setOpen={setOpen}
              icon={FileUp} title="소재 제출" status="PENDING"
              summary="승인 후 제출 가능"
            >
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { k: '브랜드 로고', v: '승인 후 제출' },
                  { k: '캠페인 문구', v: brand.message ? '입력 완료' : '미입력' },
                  { k: '랜딩 URL', v: brand.website || '미입력' },
                  { k: '패치/로고 아트워크', v: '결제 후 제출 가능' },
                ].map((r) => (
                  <div key={r.k} className="flex items-center justify-between rounded-xl border border-slate-100 px-3.5 py-3">
                    <span className="text-[12.5px] font-bold">{r.k}</span>
                    <span className="text-[12px] text-slate-500 truncate max-w-[55%]">{r.v}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11.5px] text-slate-400 break-keep">
                소재는 선수 승인 후 안내드리는 경로로 제출합니다. 제출 마감일은 승인 완료 시 생성됩니다.
              </p>
            </Section>

            {/* 사용권과 제한 */}
            <Section
              id="rights" open={open} setOpen={setOpen}
              icon={ShieldCheck} title="사용권과 제한" status="DONE"
              summary={allScopes.map((c: any) => SCOPE_LABEL[c] || c).join(' · ') || '온라인 이미지'}
            >
              <div className="flex flex-wrap gap-2">
                {Object.entries(SCOPE_LABEL).map(([code, label]) => {
                  const on = allScopes.includes(code);
                  return (
                    <span key={code} className={`px-3 py-1.5 rounded-lg text-[12.5px] font-bold ${on ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400 line-through'}`}>
                      {label} {on ? '가능' : '불가'}
                    </span>
                  );
                })}
              </div>
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 px-3.5 py-3 text-[12px] text-slate-600 break-keep">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
                온라인 사용은 선수 개인 SNS와 선수 관련 공식 채널로 제한됩니다.
                브랜드 자체 채널·광고 집행·제3자 유통은 별도 협의가 필요합니다.
              </p>
              {onlineOnly.length > 0 && (
                <p className="mt-2 flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-100 px-3.5 py-3 text-[12px] text-rose-700 break-keep">
                  <Ban className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <b>온라인 전용 상품 {onlineOnly.length}개가 포함되어 있습니다.</b><br />
                    대회 현장 및 오프라인 매체에는 사용하실 수 없습니다.
                  </span>
                </p>
              )}
            </Section>

            {/* 일정 */}
            <Section
              id="schedule" open={open} setOpen={setOpen}
              icon={Calendar} title="일정 · 추가 활동" status="DONE"
              summary={draft.items.some((i: any) => (i.addOns as any[])?.length)
                ? draft.items.flatMap((i: any) => (i.addOns as any[]) || []).map((a: any) => `${a.label} ${a.count}회`).join(' · ')
                : '추가 활동 없음'}
            >
              <ul className="space-y-2 text-[12.5px]">
                {draft.items.map((i: any) => (
                  <li key={i.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-bold">{i.athlete.name} · {i.slotName}</span>
                    <span className="text-slate-500">
                      {i.startDate ? `${new Date(i.startDate).toLocaleDateString('ko-KR')} 시작` : '시작일 협의'}
                      {i.months > 1 && ` · ${i.months}개월`}
                    </span>
                    {(i.addOns as any[])?.length > 0 && (
                      <span className="text-slate-500">{(i.addOns as any[]).map((a) => `${a.label} ${a.count}회`).join(' · ')}</span>
                    )}
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          {/* 우: 요청 요약 */}
          <aside className="lg:sticky lg:top-24 rounded-2xl border border-slate-200 p-5">
            <h2 className="text-[15px] font-extrabold">요청 요약</h2>

            <dl className="mt-4 space-y-3 text-[13px]">
              <div className="flex items-center justify-between">
                <dt className="inline-flex items-center gap-2 text-slate-500"><Users className="w-4 h-4" /> 후원 선수</dt>
                <dd className="font-extrabold">{s.athleteCount}명</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="inline-flex items-center gap-2 text-slate-500"><Wallet className="w-4 h-4" /> 총 후원 금액</dt>
                <dd className="font-extrabold text-emerald-600">{s.supplyAmount.toLocaleString()}원</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">예상 응답 기한</dt>
                <dd className="font-bold">72시간 이내</dd>
              </div>
            </dl>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-[12.5px] font-extrabold mb-2">항목별 요청 상태</p>
              <ul className="space-y-2">
                {draft.items.map((i: any) => (
                  <li key={i.id} className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full overflow-hidden bg-slate-100 shrink-0">
                      {i.athlete.profileImageUrl && <img src={i.athlete.profileImageUrl} alt="" className="w-full h-full object-cover object-top" />}
                    </span>
                    <span className="text-[12.5px] font-bold truncate">{i.athlete.name}</span>
                    <span className={`ml-auto shrink-0 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                      i.status === 'NEEDS_CONFIRMATION' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {i.status === 'NEEDS_CONFIRMATION' ? '확인 필요' : '즉시 요청 가능'}
                    </span>
                  </li>
                ))}
              </ul>
              {needsConfirm.length > 0 && (
                <p className="mt-2 text-[11.5px] text-amber-700 break-keep">
                  확인 필요 {needsConfirm.length}건은 선수가 조건을 확정한 뒤 금액이 확정됩니다.
                </p>
              )}
            </div>

            <ul className="mt-4 space-y-1.5 text-[12px] text-slate-500">
              <li className="flex items-start gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-500" /> 선수 승인 후 계약과 결제가 진행됩니다.</li>
              <li className="flex items-start gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-500" /> 조건 변경 시 재승인이 필요합니다.</li>
            </ul>

            <label className="mt-4 flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="w-4 h-4 accent-emerald-600 shrink-0 mt-0.5" />
              <span className="text-[12px] text-slate-600 break-keep">
                승인 요청은 결제가 아니며, 조건 변경 시 재승인이 필요함을 확인했습니다. <span className="font-bold text-rose-500">(필수)</span>
              </span>
            </label>

            {err && <p className="mt-3 text-[12.5px] font-bold text-rose-600 break-keep">{err}</p>}

            <button
              onClick={submit}
              disabled={busy}
              className="mt-4 w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white text-[14.5px] font-bold hover:bg-emerald-700 disabled:opacity-40"
            >
              {busy ? '요청 보내는 중…' : <><Send className="w-4 h-4" /> 선수 승인 요청하기</>}
            </button>
            <Link
              to={`/sponsor/direct/cart?draft=${draft.id}`}
              className="mt-2 w-full h-11 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 hover:bg-slate-50"
            >
              견적함으로 돌아가기
            </Link>
            <p className="mt-3 flex items-start gap-1.5 text-[11.5px] text-slate-400 break-keep">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              아직 결제는 진행되지 않습니다. 선수의 승인이 완료되어야 계약 및 결제로 이어집니다.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}

const STATUS_CHIP: Record<string, { label: string; cls: string }> = {
  DONE: { label: '완료', cls: 'bg-emerald-50 text-emerald-700' },
  TODO: { label: '입력 필요', cls: 'bg-rose-50 text-rose-700' },
  PENDING: { label: '승인 후', cls: 'bg-amber-50 text-amber-700' },
};

function Section({ id, open, setOpen, icon: Icon, title, status, summary, children }: {
  id: string; open: string | null; setOpen: (v: string | null) => void;
  icon: any; title: string; status: keyof typeof STATUS_CHIP | string; summary: string; children: React.ReactNode;
}) {
  const isOpen = open === id;
  const chip = STATUS_CHIP[status] || STATUS_CHIP.DONE;
  return (
    <section className="rounded-2xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setOpen(isOpen ? null : id)}
        aria-expanded={isOpen}
        className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-slate-50/60"
      >
        <span className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-emerald-600" />
        </span>
        <span className="text-[14px] font-extrabold shrink-0">{title}</span>
        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold shrink-0 ${chip.cls}`}>{chip.label}</span>
        <span className="text-[12px] text-slate-400 truncate hidden sm:block">{summary}</span>
        <ChevronDown className={`ml-auto w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="px-5 pb-5 border-t border-slate-100 pt-4">{children}</div>}
    </section>
  );
}

function Field({ label, value, onChange, placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[12px] font-bold text-slate-500">
        {label}{required && <span className="ml-1 text-rose-500">*</span>}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full h-11 px-3.5 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-emerald-400"
      />
    </label>
  );
}
