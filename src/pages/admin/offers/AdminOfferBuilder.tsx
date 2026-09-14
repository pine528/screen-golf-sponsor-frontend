/**
 * A02~A06 상품 빌더 (핸드오프 v1.0 §7, 시안 img_02·img_07·img_11·img_10·img_04)
 *
 * 1 기본·템플릿 → 2 선수·슬롯·활동 → 3 옵션·가격·재고 → 4 성과·권리·검증 → 5 미리보기·검토·발행
 * 발행은 검증을 통과해야만 가능하다 (§7.3).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle, ArrowLeft, ArrowRight, Ban, BarChart3, Check,
  CheckCircle2, ChevronDown, FileText, Loader2, Minus, Plus,
  Send, ShieldCheck, Trash2,
} from 'lucide-react';
import { api } from '../../../services/api';
import { SLOT_STATUS } from '../../../components/direct/DirectStepBar';

const STEPS = ['기본 · 템플릿', '선수 · 구성', '옵션 · 가격 · 재고', '성과 · 권리', '검토 · 발행'];

const CATEGORY_OPTIONS = ['식음료', '스포츠 용품', '라이프스타일', '뷰티', '패션', '헬스케어', 'IT/테크', '금융/보험', '자동차'];
const CHANNEL_OPTIONS = ['대회 현장 (온사이트)', '공식 중계', '대회 웹사이트', '선수 SNS', '선수 온라인 프로필', '성장마켓', '등록 매장'];

const RIGHTS = [
  { key: 'offlineUse', label: '오프라인 (대회 현장·인쇄)' },
  { key: 'onlineUse', label: '온라인 (선수 채널)' },
  { key: 'printUse', label: '매장 인쇄물' },
  { key: 'secondaryUse', label: '2차 편집 (크리에이티브 변형)' },
];

const CONFIDENCE = [
  { code: 'HIGH', label: '높음' }, { code: 'MEDIUM', label: '보통' }, { code: 'LIMITED', label: '제한적' },
];

export default function AdminOfferBuilder() {
  const { offerId } = useParams();
  const navigate = useNavigate();
  const isNew = !offerId || offerId === 'new';

  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState<any[]>([]);
  const [template, setTemplate] = useState('EVENT_EXPOSURE');
  const [offer, setOffer] = useState<any>(null);
  const [validation, setValidation] = useState<any>(null);
  const [loading, setLoading] = useState(!isNew);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  /* 1단계 신규 입력 */
  const [draft, setDraft] = useState<any>({
    title: '', code: '', summary: '', categories: [] as string[],
    channels: [] as string[], priceType: 'FIXED', salesFrom: '', salesTo: '',
  });

  useEffect(() => {
    api.getOfferTemplates().then((r: any) => setTemplates(r?.data?.templates || [])).catch(() => null);
  }, []);

  const load = useCallback(async () => {
    if (isNew) return;
    try {
      const r: any = await api.getAdminOffer(offerId!);
      setOffer(r?.data || null);
    } catch (e: any) {
      setErr(e?.response?.data?.error?.message || '상품을 불러오지 못했습니다');
    } finally { setLoading(false); }
  }, [offerId, isNew]);
  useEffect(() => { load(); }, [load]);

  const patch = async (body: any, silent = false) => {
    if (isNew) return;
    if (!silent) setBusy(true);
    setErr(null);
    try {
      const r: any = await api.updateAdminOffer(offerId!, body);
      setOffer(r?.data);
      setSavedAt(new Date());
      return r?.data;
    } catch (e: any) {
      setErr(e?.response?.data?.error?.message || '저장하지 못했습니다');
      throw e;
    } finally { if (!silent) setBusy(false); }
  };

  const create = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r: any = await api.createAdminOffer({ ...draft, template });
      navigate(`/admin/offers/${r.data.id}`, { replace: true });
      setOffer(r.data);
      setStep(2);
    } catch (e: any) {
      setErr(e?.response?.data?.error?.message || '상품을 만들지 못했습니다');
    } finally { setBusy(false); }
  };

  const runValidate = async () => {
    setBusy(true);
    try {
      const r: any = await api.validateAdminOffer(offerId!);
      setValidation(r?.data);
      await load();
    } finally { setBusy(false); }
  };

  const publish = async (scheduledAt?: string) => {
    setBusy(true);
    setErr(null);
    try {
      await api.publishAdminOffer(offerId!, scheduledAt ? { scheduledAt } : {});
      navigate('/admin/offers');
    } catch (e: any) {
      setErr(e?.response?.data?.error?.message || '발행하지 못했습니다');
      await runValidate();
    } finally { setBusy(false); }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50/60 py-24 text-center"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" /></div>;
  }

  const completeness = offer?.completeness;

  return (
    <div className="min-h-screen bg-slate-50/60">
      <div className="max-w-[1600px] mx-auto px-5 py-6">
        {/* 헤더 · 스텝바 */}
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/admin/offers" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4" /> 상품 목록
          </Link>
          <h1 className="text-[20px] font-black">상품 빌더</h1>
          <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[12px] font-black">
            A{String(step + 1).padStart(2, '0')}
          </span>
          {offer && <span className="text-[12.5px] font-mono text-slate-500">{offer.code}</span>}
          {savedAt && (
            <span className="ml-auto text-[12.5px] text-emerald-600 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {savedAt.toLocaleTimeString('ko-KR')} 저장됨
            </span>
          )}
        </div>

        <ol className="mt-4 flex items-center gap-1 overflow-x-auto pb-1">
          {STEPS.map((s, i) => {
            const n = i + 1;
            const done = n < step;
            const active = n === step;
            return (
              <li key={s} className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => !isNew && setStep(n)}
                  disabled={isNew && n > 1}
                  className={`w-7 h-7 rounded-full text-[12.5px] font-black flex items-center justify-center ${
                    done ? 'bg-emerald-100 text-emerald-700' : active ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                  } disabled:opacity-50`}
                >
                  {done ? <Check className="w-3.5 h-3.5" /> : n}
                </button>
                <span className={`text-[12.5px] font-bold whitespace-nowrap ${active ? 'text-emerald-700' : done ? 'text-slate-600' : 'text-slate-500'}`}>{s}</span>
                {n < STEPS.length && <span className={`w-8 h-px mx-1 ${done ? 'bg-emerald-300' : 'bg-slate-200'}`} />}
              </li>
            );
          })}
        </ol>

        {err && (
          <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-[12.5px] font-bold text-rose-700 break-keep">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {err}
          </p>
        )}

        <div className="mt-5 grid xl:grid-cols-[minmax(0,1fr)_minmax(0,320px)] gap-5 items-start">
          <div className="space-y-4">
            {step === 1 && (
              <Step1
                templates={templates} template={template} setTemplate={setTemplate}
                draft={isNew ? draft : {
                  title: offer.title, code: offer.code, summary: offer.summary ?? '',
                  categories: offer.categories, channels: offer.channels, priceType: offer.priceType,
                  salesFrom: offer.salesFrom ? String(offer.salesFrom).slice(0, 10) : '',
                  salesTo: offer.salesTo ? String(offer.salesTo).slice(0, 10) : '',
                }}
                onChange={(d: any) => (isNew ? setDraft(d) : patch(d, true))}
                isNew={isNew}
              />
            )}
            {step === 2 && offer && <Step2 offer={offer} patch={patch} />}
            {step === 3 && offer && <Step3 offer={offer} patch={patch} />}
            {step === 4 && offer && <Step4 offer={offer} patch={patch} validation={validation} onValidate={runValidate} busy={busy} />}
            {step === 5 && offer && <Step5 offer={offer} validation={validation} onValidate={runValidate} onPublish={publish} busy={busy} />}
          </div>

          {/* 우: 완성도 · 검증 */}
          <aside className="xl:sticky xl:top-6 space-y-4">
            <div className="rounded-2xl bg-white border border-slate-200 p-5">
              <h2 className="text-[14px] font-extrabold">완성도</h2>
              {isNew ? (
                <p className="mt-3 text-[12.5px] text-slate-500">기본 정보를 저장하면 완성도가 계산됩니다.</p>
              ) : (
                <>
                  <div className="mt-4 flex items-center justify-center">
                    <div className="relative w-28 h-28">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3.2" />
                        <circle
                          cx="18" cy="18" r="15.9" fill="none" stroke="#059669" strokeWidth="3.2" strokeLinecap="round"
                          strokeDasharray={`${completeness?.percent ?? 0} 100`}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[22px] font-black">
                        {completeness?.percent ?? 0}%
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-center text-[12px] text-slate-500">
                    필수 항목 {completeness?.total ?? 0}개 중 {completeness?.done ?? 0}개 완료
                  </p>
                  <ul className="mt-4 space-y-1.5 max-h-[280px] overflow-y-auto">
                    {(completeness?.items || []).map((it: any) => (
                      <li key={it.key} className="flex items-center gap-2 text-[12px]">
                        {it.done
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          : <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                        <span className={it.done ? 'text-slate-600' : 'font-bold text-rose-600'}>{it.label}</span>
                        <span className="ml-auto text-[12.5px] text-slate-500">{it.group}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            {offer && (
              <div className="rounded-2xl bg-white border border-slate-200 p-5">
                <h2 className="text-[14px] font-extrabold">가격 · 마진</h2>
                <dl className="mt-3 space-y-2 text-[12.5px]">
                  <div className="flex justify-between"><dt className="text-slate-500">판매가</dt><dd className="font-bold">{offer.supplyAmount.toLocaleString()}원</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">예상 원가</dt><dd className="font-bold">{offer.costAmount.toLocaleString()}원</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">플랫폼 수수료</dt><dd className="font-bold">{offer.platformFee.toLocaleString()}원</dd></div>
                  <div className="flex justify-between pt-2 border-t border-slate-100">
                    <dt className="font-bold">예상 마진</dt>
                    <dd className={`font-black ${offer.margin < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{offer.margin.toLocaleString()}원</dd>
                  </div>
                </dl>
                {offer.margin < 0 && (
                  <p className="mt-2 text-[12.5px] font-bold text-rose-600 break-keep">마진이 음수면 발행할 수 없습니다.</p>
                )}
              </div>
            )}

            {/* 단계 이동 */}
            <div className="rounded-2xl bg-white border border-slate-200 p-4 flex gap-2">
              <button
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                className="h-11 px-4 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 disabled:opacity-40"
              >
                이전
              </button>
              {isNew ? (
                <button
                  onClick={create}
                  disabled={busy || !draft.title.trim()}
                  className="flex-1 h-11 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-white text-[13.5px] font-bold disabled:opacity-40"
                >
                  {busy ? '생성 중…' : <>다음: 선수 · 구성 <ArrowRight className="w-4 h-4" /></>}
                </button>
              ) : (
                <button
                  onClick={() => setStep(Math.min(5, step + 1))}
                  disabled={step === 5}
                  className="flex-1 h-11 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-white text-[13.5px] font-bold disabled:opacity-40"
                >
                  다음: {STEPS[step]} <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ── 1단계: 기본 · 템플릿 (시안 img_02) ─────────────── */

function Step1({ templates, template, setTemplate, draft, onChange, isNew }: any) {
  const [form, setForm] = useState(draft);
  useEffect(() => { setForm(draft); }, [draft.code]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (patch: any) => {
    const next = { ...form, ...patch };
    setForm(next);
    onChange(next);
  };
  const toggle = (key: 'categories' | 'channels', v: string) => {
    const cur: string[] = form[key] || [];
    set({ [key]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] });
  };

  return (
    <div className="grid lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] gap-4">
      <div className="rounded-2xl bg-white border border-slate-200 p-5">
        <h2 className="text-[14px] font-extrabold">템플릿 선택</h2>
        <p className="mt-1 text-[12px] text-slate-500">상품의 기본 구조를 선택하세요.</p>
        <ul className="mt-4 space-y-2">
          {templates.map((t: any) => {
            const on = template === t.code;
            return (
              <li key={t.code}>
                <button
                  onClick={() => setTemplate(t.code)}
                  disabled={!isNew}
                  className={`w-full rounded-xl border p-4 text-left transition-colors ${
                    on ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:border-slate-300'
                  } disabled:opacity-60`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[13.5px] font-extrabold">{t.name}</span>
                    {on && <Check className="w-4 h-4 text-emerald-600 ml-auto" />}
                  </span>
                  <span className="mt-1.5 block text-[12px] text-slate-500">필수 입력 {t.requiredFields}개 · 리드타임 {t.leadTimeDays}일</span>
                  <span className="mt-1 block text-[12px] text-slate-500 break-keep">고정: {t.fixed}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-5">
        <h2 className="text-[14px] font-extrabold">기본 정보 입력</h2>
        <div className="mt-4 space-y-4">
          <Field label="상품명" required value={form.title} onChange={(v: any) => set({ title: v })} max={100} placeholder="예) 9월 메이저 대회 노출 패키지" />
          <Field label="내부 코드" required value={form.code} onChange={(v: any) => set({ code: v.toUpperCase() })} max={30}
            placeholder="OFFER-0901" hint="영문, 숫자, 하이픈(-)만 사용 가능" disabled={!isNew} />
          <label className="block">
            <span className="text-[12px] font-bold text-slate-500">상품 요약 <span className="text-rose-500">*</span></span>
            <textarea
              value={form.summary}
              onChange={(e) => set({ summary: e.target.value.slice(0, 300) })}
              rows={3}
              placeholder="상품이 제공하는 노출과 활동을 한두 문장으로 적어주세요."
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-emerald-400 resize-none"
            />
            <span className="mt-1 block text-right text-[12px] text-slate-500">{(form.summary || '').length} / 300</span>
          </label>

          <Chips label="타겟 브랜드 카테고리" required options={CATEGORY_OPTIONS} selected={form.categories || []} onToggle={(v: string) => toggle('categories', v)} />

          <label className="block">
            <span className="text-[12px] font-bold text-slate-500">구매 방식 <span className="text-rose-500">*</span></span>
            <select
              value={form.priceType}
              onChange={(e) => set({ priceType: e.target.value })}
              className="mt-1.5 w-full h-11 px-3.5 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-emerald-400"
            >
              <option value="FIXED">즉시구매 (확정가)</option>
              <option value="SUBSCRIPTION">월 구독</option>
              <option value="NEGOTIABLE">협의형</option>
              <option value="AUCTION">경매</option>
            </select>
          </label>

          <Chips label="노출 채널" required options={CHANNEL_OPTIONS} selected={form.channels || []} onToggle={(v: string) => toggle('channels', v)} />

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[12px] font-bold text-slate-500">판매 시작 <span className="text-rose-500">*</span></span>
              <input type="date" value={form.salesFrom} onChange={(e) => set({ salesFrom: e.target.value })}
                className="mt-1.5 w-full h-11 px-3.5 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-emerald-400" />
            </label>
            <label className="block">
              <span className="text-[12px] font-bold text-slate-500">판매 종료 <span className="text-rose-500">*</span></span>
              <input type="date" value={form.salesTo} onChange={(e) => set({ salesTo: e.target.value })}
                className="mt-1.5 w-full h-11 px-3.5 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-emerald-400" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 2단계: 선수 · 슬롯 · 활동 (시안 img_07) ────────── */

function Step2({ offer, patch }: any) {
  const [athletes, setAthletes] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(offer.athletes?.[0]?.athleteId ?? null);
  const [slots, setSlots] = useState<any>(null);
  const [view, setView] = useState<'FRONT' | 'BACK'>('FRONT');
  const [components, setComponents] = useState<any[]>(offer.components || []);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getPickAthletes({ limit: 40 }).then((r: any) => {
      const list = r?.data?.athletes || [];
      setAthletes(list);
      if (!selected && list[0]) setSelected(list[0].id);
    }).catch(() => null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selected) return;
    api.getOfferBuilderSlots(selected, {
      from: offer.executionFrom ? String(offer.executionFrom).slice(0, 10) : undefined,
      to: offer.executionTo ? String(offer.executionTo).slice(0, 10) : undefined,
    }).then((r: any) => setSlots(r?.data || null)).catch(() => null);
  }, [selected, offer.executionFrom, offer.executionTo]);

  const save = async (next: any[]) => {
    setComponents(next);
    setBusy(true);
    const athleteIds = [...new Set(next.filter((c) => c.athleteId).map((c) => c.athleteId))];
    await patch({
      components: next,
      athletes: athleteIds.length ? athleteIds.map((id) => ({ athleteId: id })) : offer.athletes.map((a: any) => ({ athleteId: a.athleteId })),
    }, true).finally(() => setBusy(false));
  };

  const addSlot = (s: any) => {
    if (components.some((c) => c.slotCode === s.code && c.athleteId === selected)) return;
    save([...components, {
      componentType: 'SLOT', label: s.name, athleteId: selected,
      athleteSlotId: s.athleteSlotId, slotCode: s.code, unitPrice: s.price, quantity: 1,
    }]);
  };

  const addExtra = (type: string, label: string, price: number) => {
    save([...components, { componentType: type, label, quantity: 1, unitPrice: price }]);
  };

  const remove = (i: number) => save(components.filter((_, k) => k !== i));

  const conflicts = useMemo(
    () => components.flatMap((c) => (slots?.slots || []).find((s: any) => s.code === c.slotCode)?.conflicts ?? []),
    [components, slots],
  );
  const total = components.reduce((s, c) => s + (c.unitPrice || 0) * (c.quantity || 1), 0);
  const visible = (slots?.slots || []).filter((s: any) => s.view === view);

  return (
    <div className="grid lg:grid-cols-[minmax(0,230px)_minmax(0,1fr)_minmax(0,280px)] gap-4">
      {/* 선수 */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4">
        <h2 className="text-[13.5px] font-extrabold">선수 선택</h2>
        <ul className="mt-3 space-y-2 max-h-[520px] overflow-y-auto">
          {athletes.map((a) => {
            const on = a.id === selected;
            return (
              <li key={a.id}>
                <button onClick={() => setSelected(a.id)}
                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-colors ${
                    on ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:border-slate-300'
                  }`}>
                  <span className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 shrink-0">
                    {a.profileImageUrl && <img src={a.profileImageUrl} alt="" loading="lazy" className="w-full h-full object-cover object-top" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] font-extrabold truncate">{a.name} 프로</span>
                    <span className="block text-[12.5px] text-slate-500 truncate">{a.tour}</span>
                  </span>
                  {on && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-center text-[12px] text-slate-500">{athletes.length}명</p>
      </div>

      {/* 슬롯 */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[13.5px] font-extrabold">
            슬롯 선택 {selected && `(${athletes.find((a) => a.id === selected)?.name ?? ''} 프로)`}
          </h2>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5">
            {(['FRONT', 'BACK'] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`h-8 px-3.5 rounded-md text-[12px] font-bold ${view === v ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}>
                {v === 'FRONT' ? '앞면' : '뒷면'} <span className="opacity-70">{slots?.viewCounts?.[v] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="mt-2 text-[12.5px] text-slate-500">슬롯을 클릭하면 패키지 구성에 추가됩니다.</p>

        {!slots ? (
          <div className="py-16 text-center"><Loader2 className="w-6 h-6 text-emerald-500 animate-spin mx-auto" /></div>
        ) : (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-left">
                    {['슬롯', '상태', '충돌 정보', '기본 가격', ''].map((h) => (
                      <th key={h} className="px-3 py-2.5 font-bold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((s: any) => {
                    const meta = SLOT_STATUS[s.status] || SLOT_STATUS.EXPIRED;
                    const picked = components.some((c) => c.slotCode === s.code && c.athleteId === selected);
                    return (
                      <tr key={s.code} className={picked ? 'bg-emerald-50/40' : ''}>
                        <td className="px-3 py-2.5 font-bold whitespace-nowrap">{s.name}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 rounded text-[12.5px] font-bold ${meta.chip}`}>{meta.label}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          {s.conflicts?.length ? (
                            <span className="text-[12px] font-bold text-rose-600 break-keep">
                              {s.conflicts[0].title}와 기간 겹침
                            </span>
                          ) : <span className="text-[12px] text-slate-500">충돌 없음</span>}
                        </td>
                        <td className="px-3 py-2.5 font-bold whitespace-nowrap">{s.price.toLocaleString()}원</td>
                        <td className="px-3 py-2.5">
                          <button
                            onClick={() => addSlot(s)}
                            disabled={picked || !s.selectable || busy}
                            className="h-8 px-3 rounded-lg bg-emerald-600 text-white text-[12.5px] font-bold disabled:bg-slate-100 disabled:text-slate-400"
                          >
                            {picked ? '선택됨' : '추가'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-[12.5px] font-extrabold mb-2">추가 활동 선택</p>
              <div className="flex flex-wrap gap-2">
                {[
                  ['CONTENT', 'SNS 피드', 80000], ['CONTENT', 'SNS 스토리', 40000],
                  ['VISIT', '매장 방문', 300000], ['VISIT', '행사 참석', 700000],
                  ['REPORT', 'ROI 리포트', 0], ['MARKET', '성장마켓 노출', 250000],
                ].map(([type, label, price]) => (
                  <button
                    key={label as string}
                    onClick={() => addExtra(type as string, label as string, price as number)}
                    className="h-10 px-3.5 rounded-xl border border-slate-200 text-[12.5px] font-bold text-slate-600 hover:border-emerald-300"
                  >
                    {label as string} {price ? `+${(price as number).toLocaleString()}` : ''}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 구성 요약 */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5">
        <h2 className="text-[13.5px] font-extrabold">패키지 구성 요약</h2>
        {components.length === 0 ? (
          <p className="py-10 text-center text-[12px] text-slate-500 break-keep">슬롯이나 활동을 추가하세요</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {components.map((c, i) => (
              <li key={i} className="rounded-xl border border-slate-100 p-3">
                <div className="flex items-start gap-2">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] font-bold break-keep">{c.label}</span>
                    <span className="block text-[12.5px] text-slate-500">{c.componentType}</span>
                  </span>
                  <button onClick={() => remove(i)} aria-label="삭제" className="text-slate-300 hover:text-rose-600 shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={() => save(components.map((x, k) => k === i ? { ...x, quantity: Math.max(1, (x.quantity || 1) - 1) } : x))}
                      aria-label="수량 감소" className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-[12px] font-black tabular-nums w-5 text-center">{c.quantity || 1}</span>
                    <button onClick={() => save(components.map((x, k) => k === i ? { ...x, quantity: (x.quantity || 1) + 1 } : x))}
                      aria-label="수량 증가" className="w-6 h-6 rounded border border-slate-200 flex items-center justify-center">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-[12.5px] font-bold">{((c.unitPrice || 0) * (c.quantity || 1)).toLocaleString()}원</span>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 pt-4 border-t border-slate-200 flex items-baseline justify-between">
          <span className="text-[12.5px] font-bold">구성 합계</span>
          <span className="text-[17px] font-black text-emerald-600">{total.toLocaleString()}원</span>
        </div>
        <p className="mt-1 text-right text-[12.5px] text-slate-500">판매가는 3단계에서 정합니다</p>

        {conflicts.length > 0 ? (
          <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-rose-50 border border-rose-100 px-3 py-2.5 text-[12.5px] text-rose-700 break-keep">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span><b>기간 충돌 경고</b><br />{conflicts[0].title}와 기간이 겹칩니다.</span>
          </p>
        ) : components.some((c) => c.slotCode) && (
          <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2.5 text-[12.5px] text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> 기간 충돌 없음
          </p>
        )}
      </div>
    </div>
  );
}

/* ── 3단계: 옵션 · 가격 · 재고 (시안 img_11) ────────── */

function Step3({ offer, patch }: any) {
  const [f, setF] = useState({
    supplyAmount: offer.supplyAmount, costAmount: offer.costAmount, platformFee: offer.platformFee,
    capacity: offer.capacity, stockMode: offer.stockMode, holdMinutes: offer.holdMinutes,
    durationCode: offer.durationCode, months: offer.months,
    executionFrom: offer.executionFrom ? String(offer.executionFrom).slice(0, 10) : '',
    executionTo: offer.executionTo ? String(offer.executionTo).slice(0, 10) : '',
    leadTimeDays: offer.leadTimeDays,
    approvalMode: offer.approvalMode,
  });
  const [options, setOptions] = useState<any[]>(offer.options || []);

  const set = (p: any) => { const n = { ...f, ...p }; setF(n); patch(n, true); };
  const componentTotal = (offer.components || []).reduce((s: number, c: any) => s + (c.unitPrice || 0) * (c.quantity || 1), 0);
  const margin = f.supplyAmount - f.costAmount - f.platformFee;
  const vat = Math.round(f.supplyAmount * 0.1);

  const saveOptions = (next: any[]) => { setOptions(next); patch({ options: next }, true); };

  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-2 gap-4">
        {/* 옵션·예약 정책 */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <h2 className="text-[14px] font-extrabold">옵션 및 예약 정책</h2>
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[12px] font-bold text-slate-500">기간</span>
                <select value={f.durationCode}
                  onChange={(e) => {
                    const map: any = { SINGLE_EVENT: 1, DAYS_30: 1, MONTHS_3: 3, MONTHS_6: 6, MONTHS_12: 12 };
                    set({ durationCode: e.target.value, months: map[e.target.value] ?? 1 });
                  }}
                  className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-[13px]">
                  <option value="SINGLE_EVENT">대회 1회</option>
                  <option value="DAYS_30">30일</option>
                  <option value="MONTHS_3">3개월</option>
                  <option value="MONTHS_6">6개월</option>
                  <option value="MONTHS_12">12개월</option>
                </select>
              </label>
              <label className="block">
                <span className="text-[12px] font-bold text-slate-500">승인 방식</span>
                <select value={f.approvalMode} onChange={(e) => set({ approvalMode: e.target.value })}
                  className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-[13px]">
                  <option value="PRE_APPROVED">사전승인 (즉시구매)</option>
                  <option value="ATHLETE_APPROVAL">선수 확인 필요</option>
                  <option value="NEGOTIATION">협의</option>
                </select>
              </label>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <NumField label="수량 (재고)" value={f.capacity} onChange={(v: any) => set({ capacity: v })} />
              <NumField label="홀드 (분)" value={f.holdMinutes} onChange={(v: any) => set({ holdMinutes: v })} />
              <NumField label="리드타임 (일)" value={f.leadTimeDays} onChange={(v: any) => set({ leadTimeDays: v })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[12px] font-bold text-slate-500">실행 시작</span>
                <input type="date" value={f.executionFrom} onChange={(e) => set({ executionFrom: e.target.value })}
                  className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-[13px]" />
              </label>
              <label className="block">
                <span className="text-[12px] font-bold text-slate-500">실행 종료</span>
                <input type="date" value={f.executionTo} onChange={(e) => set({ executionTo: e.target.value })}
                  className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-[13px]" />
              </label>
            </div>
          </div>

          {/* 구매 옵션 */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <p className="text-[12.5px] font-extrabold">브랜드 선택 옵션</p>
              <button
                onClick={() => saveOptions([...options, { kind: 'ADD_ON', code: `OPT${options.length + 1}`, label: '추가 옵션', addPrice: 0 }])}
                className="h-8 px-3 rounded-lg border border-slate-200 text-[12px] font-bold text-slate-600 inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> 옵션 추가
              </button>
            </div>
            {options.length === 0 ? (
              <p className="mt-3 text-[12px] text-slate-500">브랜드가 바꿀 수 있는 항목이 없습니다 (전부 고정).</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {options.map((o, i) => (
                  <li key={i} className="rounded-xl border border-slate-100 p-3 grid grid-cols-[100px_minmax(0,1fr)_100px_auto] gap-2 items-center">
                    <select value={o.kind} onChange={(e) => saveOptions(options.map((x, k) => k === i ? { ...x, kind: e.target.value } : x))}
                      className="h-9 px-2 rounded-lg border border-slate-200 text-[12.5px] font-bold">
                      <option value="ADD_ON">추가</option>
                      <option value="SELECT_ONE">택1</option>
                      <option value="QUANTITY">수량</option>
                      <option value="BRAND_INPUT">입력</option>
                    </select>
                    <input value={o.label} onChange={(e) => saveOptions(options.map((x, k) => k === i ? { ...x, label: e.target.value } : x))}
                      className="h-9 px-3 rounded-lg border border-slate-200 text-[12.5px]" />
                    <input type="number" value={o.addPrice ?? 0}
                      onChange={(e) => saveOptions(options.map((x, k) => k === i ? { ...x, addPrice: Number(e.target.value) } : x))}
                      className="h-9 px-3 rounded-lg border border-slate-200 text-[12.5px] text-right" />
                    <button onClick={() => saveOptions(options.filter((_, k) => k !== i))} aria-label="삭제" className="text-slate-300 hover:text-rose-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 가격 설정 */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <h2 className="text-[14px] font-extrabold">가격 설정</h2>
          <table className="mt-4 w-full text-[12.5px]">
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2.5 text-slate-500">구성 요소 합계</td>
                <td className="py-2.5 text-right font-bold">{componentTotal.toLocaleString()}원</td>
              </tr>
              <tr>
                <td className="py-2.5 text-slate-500">예상 원가 (선수 정산)</td>
                <td className="py-2.5 text-right">
                  <input type="number" value={f.costAmount} onChange={(e) => set({ costAmount: Number(e.target.value) })}
                    className="w-32 h-9 px-3 rounded-lg border border-slate-200 text-[12.5px] text-right" />
                </td>
              </tr>
              <tr>
                <td className="py-2.5 text-slate-500">플랫폼 수수료</td>
                <td className="py-2.5 text-right">
                  <input type="number" value={f.platformFee} onChange={(e) => set({ platformFee: Number(e.target.value) })}
                    className="w-32 h-9 px-3 rounded-lg border border-slate-200 text-[12.5px] text-right" />
                </td>
              </tr>
              <tr className="bg-emerald-50/60">
                <td className="py-3 font-extrabold">판매가 (고객 가격)</td>
                <td className="py-3 text-right">
                  <input type="number" value={f.supplyAmount} onChange={(e) => set({ supplyAmount: Number(e.target.value) })}
                    className="w-36 h-10 px-3 rounded-lg border border-emerald-300 text-[14px] font-black text-right text-emerald-700" />
                </td>
              </tr>
            </tbody>
          </table>
          <p className="mt-2 text-right text-[12px] text-slate-500">VAT 별도 · 부가세 {vat.toLocaleString()}원</p>

          <div className="mt-4 rounded-xl bg-slate-50 p-4">
            <p className="text-[12.5px] font-extrabold">마진 시뮬레이터</p>
            <dl className="mt-2.5 space-y-1.5 text-[12px]">
              <div className="flex justify-between"><dt className="text-slate-500">예상 원가</dt><dd className="font-bold">{f.costAmount.toLocaleString()}원</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">플랫폼 수수료</dt><dd className="font-bold">{f.platformFee.toLocaleString()}원</dd></div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <dt className="font-bold">예상 마진</dt>
                <dd className={`font-black ${margin < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{margin.toLocaleString()}원</dd>
              </div>
            </dl>
            {margin < 0 && (
              <p className="mt-2 flex items-start gap-1.5 text-[12.5px] font-bold text-rose-600 break-keep">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> 마진이 음수입니다. 발행이 차단됩니다.
              </p>
            )}
            {componentTotal > 0 && f.supplyAmount < componentTotal && (
              <p className="mt-2 text-[12.5px] text-amber-700 break-keep">
                판매가가 구성 합계({componentTotal.toLocaleString()}원)보다 낮습니다.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 4단계: 성과 · 권리 · 검증 (시안 img_10) ────────── */

function Step4({ offer, patch, validation, onValidate, busy }: any) {
  const [metrics, setMetrics] = useState<any[]>((offer.expectedMetrics as any[]) || []);
  const [f, setF] = useState({
    methodology: offer.methodology ?? '', methodVersion: offer.methodVersion ?? 'v1.0',
    confidence: offer.confidence ?? 'MEDIUM',
    dataAsOf: offer.dataAsOf ? String(offer.dataAsOf).slice(0, 10) : '',
    guaranteed: offer.guaranteed,
    offlineUse: offer.offlineUse, onlineUse: offer.onlineUse, printUse: offer.printUse, secondaryUse: offer.secondaryUse,
    territory: offer.territory, rightsNote: offer.rightsNote ?? '',
  });

  const set = (p: any) => { const n = { ...f, ...p }; setF(n); patch(n, true); };
  const saveMetrics = (next: any[]) => { setMetrics(next); patch({ expectedMetrics: next }, true); };

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)] gap-4">
      <div className="space-y-4">
        {/* 성과 예측 */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[14px] font-extrabold">
              <BarChart3 className="w-4 h-4 text-emerald-600" /> 성과 예측 (Expected Performance)
            </h2>
            <button
              onClick={() => saveMetrics([...metrics, { metric: '예상 노출', minValue: 0, maxValue: 0, unit: '회', basis: '' }])}
              className="h-8 px-3 rounded-lg border border-slate-200 text-[12px] font-bold inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> 지표 추가
            </button>
          </div>

          {metrics.length === 0 ? (
            <p className="mt-4 text-[12.5px] text-slate-500">지표를 1개 이상 등록해야 발행할 수 있습니다.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {metrics.map((m, i) => (
                <li key={i} className="rounded-xl border border-slate-100 p-4 grid sm:grid-cols-[minmax(0,140px)_100px_100px_70px_minmax(0,1fr)_auto] gap-2 items-end">
                  <label className="block">
                    <span className="text-[12px] text-slate-500">지표명</span>
                    <input value={m.metric} onChange={(e) => saveMetrics(metrics.map((x, k) => k === i ? { ...x, metric: e.target.value } : x))}
                      className="mt-1 w-full h-9 px-2.5 rounded-lg border border-slate-200 text-[12.5px]" />
                  </label>
                  <label className="block">
                    <span className="text-[12px] text-slate-500">최소</span>
                    <input type="number" value={m.minValue} onChange={(e) => saveMetrics(metrics.map((x, k) => k === i ? { ...x, minValue: Number(e.target.value) } : x))}
                      className="mt-1 w-full h-9 px-2.5 rounded-lg border border-slate-200 text-[12.5px] text-right" />
                  </label>
                  <label className="block">
                    <span className="text-[12px] text-slate-500">최대</span>
                    <input type="number" value={m.maxValue} onChange={(e) => saveMetrics(metrics.map((x, k) => k === i ? { ...x, maxValue: Number(e.target.value) } : x))}
                      className="mt-1 w-full h-9 px-2.5 rounded-lg border border-slate-200 text-[12.5px] text-right" />
                  </label>
                  <label className="block">
                    <span className="text-[12px] text-slate-500">단위</span>
                    <input value={m.unit} onChange={(e) => saveMetrics(metrics.map((x, k) => k === i ? { ...x, unit: e.target.value } : x))}
                      className="mt-1 w-full h-9 px-2.5 rounded-lg border border-slate-200 text-[12.5px]" />
                  </label>
                  <label className="block">
                    <span className="text-[12px] text-slate-500">근거</span>
                    <input value={m.basis} onChange={(e) => saveMetrics(metrics.map((x, k) => k === i ? { ...x, basis: e.target.value } : x))}
                      placeholder="최근 5경기 중계 도달"
                      className="mt-1 w-full h-9 px-2.5 rounded-lg border border-slate-200 text-[12.5px]" />
                  </label>
                  <button onClick={() => saveMetrics(metrics.filter((_, k) => k !== i))} aria-label="삭제" className="h-9 text-slate-300 hover:text-rose-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 grid sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
            <label className="block sm:col-span-2">
              <span className="text-[12px] font-bold text-slate-500">측정 방법 <span className="text-rose-500">*</span></span>
              <input value={f.methodology} onChange={(e) => set({ methodology: e.target.value })}
                placeholder="최근 5경기 중계 도달과 SNS 평균 반응률 기반 추정"
                className="mt-1.5 w-full h-11 px-3.5 rounded-xl border border-slate-200 text-[13px]" />
            </label>
            <label className="block">
              <span className="text-[12px] font-bold text-slate-500">산식 버전</span>
              <input value={f.methodVersion} onChange={(e) => set({ methodVersion: e.target.value })}
                className="mt-1.5 w-full h-11 px-3.5 rounded-xl border border-slate-200 text-[13px]" />
            </label>
            <label className="block">
              <span className="text-[12px] font-bold text-slate-500">기준일 <span className="text-rose-500">*</span></span>
              <input type="date" value={f.dataAsOf} onChange={(e) => set({ dataAsOf: e.target.value })}
                className="mt-1.5 w-full h-11 px-3.5 rounded-xl border border-slate-200 text-[13px]" />
            </label>
            <label className="block">
              <span className="text-[12px] font-bold text-slate-500">신뢰도 <span className="text-rose-500">*</span></span>
              <select value={f.confidence} onChange={(e) => set({ confidence: e.target.value })}
                className="mt-1.5 w-full h-11 px-3.5 rounded-xl border border-slate-200 text-[13px]">
                {CONFIDENCE.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </label>
            <label className="sm:col-span-3 flex items-center gap-2 h-11">
              <input type="checkbox" checked={f.guaranteed} onChange={(e) => set({ guaranteed: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
              <span className="text-[12.5px]">성과 보장 상품 (법무 검토 필요)</span>
            </label>
          </div>

          <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-[12px] text-amber-800 break-keep">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            예상성과를 "확정 노출"이나 구매 보장으로 표현할 수 없습니다. 브랜드 화면에는 범위·근거·기준일·신뢰도가 함께 표시됩니다.
          </p>
        </div>

        {/* 권리 매트릭스 */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <h2 className="flex items-center gap-2 text-[14px] font-extrabold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> 권리 (Rights) 매트릭스
          </h2>
          <table className="mt-4 w-full text-[12.5px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-left">
                <th className="px-3 py-2.5 font-bold">사용 채널</th>
                <th className="px-3 py-2.5 font-bold text-center">허용</th>
                <th className="px-3 py-2.5 font-bold text-center">금지</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {RIGHTS.map((r) => (
                <tr key={r.key}>
                  <td className="px-3 py-3 font-bold">{r.label}</td>
                  <td className="px-3 py-3 text-center">
                    <input type="radio" name={r.key} checked={(f as any)[r.key]} onChange={() => set({ [r.key]: true })} className="w-4 h-4 accent-emerald-600" />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <input type="radio" name={r.key} checked={!(f as any)[r.key]} onChange={() => set({ [r.key]: false })} className="w-4 h-4 accent-rose-600" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[12px] font-bold text-slate-500">지역</span>
              <input value={f.territory} onChange={(e) => set({ territory: e.target.value })}
                className="mt-1.5 w-full h-11 px-3.5 rounded-xl border border-slate-200 text-[13px]" />
            </label>
            <label className="block">
              <span className="text-[12px] font-bold text-slate-500">권리 비고</span>
              <input value={f.rightsNote} onChange={(e) => set({ rightsNote: e.target.value })}
                placeholder="브랜드 자체 광고 집행은 별도 협의"
                className="mt-1.5 w-full h-11 px-3.5 rounded-xl border border-slate-200 text-[13px]" />
            </label>
          </div>

          {offer.type === 'ONLINE_SUBSCRIPTION' && f.offlineUse && (
            <p className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-[12px] font-bold text-rose-700 break-keep">
              <Ban className="w-4 h-4 shrink-0 mt-0.5" />
              온라인 전용 상품에는 오프라인 사용 권리를 설정할 수 없습니다. 저장이 거부됩니다.
            </p>
          )}
        </div>
      </div>

      {/* 검증 결과 */}
      <aside className="space-y-4">
        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-extrabold">검증 결과</h2>
            <button onClick={onValidate} disabled={busy}
              className="h-8 px-3 rounded-lg border border-slate-200 text-[12px] font-bold inline-flex items-center gap-1 disabled:opacity-50">
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />} 새로고침
            </button>
          </div>

          {!validation ? (
            <p className="mt-4 text-[12.5px] text-slate-500">자동 검증을 실행하면 결과가 표시됩니다.</p>
          ) : (
            <>
              <ul className="mt-4 space-y-2">
                {validation.checklist.map((c: any) => (
                  <li key={c.group} className={`rounded-xl border p-3.5 ${
                    c.status === 'ERROR' ? 'border-rose-200 bg-rose-50/60'
                      : c.status === 'WARN' ? 'border-amber-200 bg-amber-50/60'
                      : 'border-emerald-200 bg-emerald-50/60'
                  }`}>
                    <p className="flex items-center gap-2 text-[12.5px] font-extrabold">
                      {c.status === 'OK' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className={`w-4 h-4 ${c.status === 'ERROR' ? 'text-rose-600' : 'text-amber-600'}`} />}
                      {c.group}
                      <span className={`ml-auto text-[12px] ${c.status === 'OK' ? 'text-emerald-700' : c.status === 'ERROR' ? 'text-rose-700' : 'text-amber-700'}`}>
                        {c.status === 'OK' ? '통과' : c.status === 'ERROR' ? '오류' : '주의'}
                      </span>
                    </p>
                    {c.issues.slice(0, 2).map((i: any, k: number) => (
                      <p key={k} className="mt-1.5 text-[12.5px] text-slate-600 break-keep">• {i.message}</p>
                    ))}
                  </li>
                ))}
              </ul>
              <button
                onClick={onValidate}
                disabled={busy}
                className="mt-4 w-full h-11 rounded-xl bg-slate-900 text-white text-[13px] font-bold disabled:opacity-50"
              >
                자동 검증 실행
              </button>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

/* ── 5단계: 미리보기 · 검토 · 발행 (시안 img_04) ────── */

function Step5({ offer, validation, onValidate, onPublish, busy }: any) {
  const [mode, setMode] = useState<'DESKTOP' | 'MOBILE'>('DESKTOP');
  const [scheduled, setScheduled] = useState('');
  const [useSchedule, setUseSchedule] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  useEffect(() => { if (!validation) onValidate(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const canPublish = validation?.canPublish;

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {/* 미리보기 */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-extrabold">고객 노출 미리보기</h2>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5">
            {(['DESKTOP', 'MOBILE'] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`h-8 px-3.5 rounded-md text-[12px] font-bold ${mode === m ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}>
                {m === 'DESKTOP' ? '데스크톱' : '모바일'}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-1 text-[12.5px] text-slate-500">실제 고객이 상품을 확인하는 화면입니다.</p>

        <div className={`mt-4 mx-auto ${mode === 'MOBILE' ? 'max-w-[300px]' : ''}`}>
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="aspect-[16/9] bg-slate-800 relative">
              {offer.heroImageUrl && <img src={offer.heroImageUrl} alt="" className="w-full h-full object-cover object-top opacity-80" />}
              <div className="absolute inset-0 p-4 flex flex-col justify-end">
                <span className="self-start px-2 py-0.5 rounded bg-white/90 text-slate-800 text-[12.5px] font-black">
                  {offer.type === 'EVENT_SLOT' ? '대회 노출' : offer.type}
                </span>
                <p className="mt-2 text-white text-[16px] font-black break-keep">{offer.title}</p>
              </div>
            </div>
            <div className="p-4">
              <p className="text-[12px] text-slate-500">{(offer.athletes || []).map((a: any) => a.athlete.name).join(' · ')}</p>
              <p className="mt-1.5 text-[19px] font-black text-emerald-600">
                {offer.supplyAmount.toLocaleString()}원 <span className="text-[12px] font-bold text-slate-500">(VAT 별도)</span>
              </p>
              <p className="mt-2 text-[12px] text-slate-600 break-keep">{offer.summary}</p>
              <dl className="mt-3 space-y-1.5 text-[12.5px]">
                <Preview k="노출 위치" v={(offer.components || []).map((c: any) => c.label).join(', ') || '—'} />
                <Preview k="노출 기간" v={offer.executionFrom ? `${new Date(offer.executionFrom).toLocaleDateString('ko-KR')} ~ ${new Date(offer.executionTo).toLocaleDateString('ko-KR')}` : '—'} />
                <Preview k="예상 도달" v={(offer.expectedMetrics as any[])?.[0]
                  ? `${((offer.expectedMetrics as any[])[0].minValue / 10000).toLocaleString()}만 ~ ${((offer.expectedMetrics as any[])[0].maxValue / 10000).toLocaleString()}만`
                  : '—'} />
                <Preview k="재고" v={`${offer.availableQty ?? '—'} / ${offer.capacity}`} />
              </dl>
            </div>
          </div>
          <p className="mt-3 rounded-xl bg-slate-50 px-3.5 py-3 text-[12px] text-slate-500 break-keep">
            위 예상 수치는 선수의 최근 데이터를 기반으로 한 추정치이며, 실제 결과는 변동될 수 있습니다.
          </p>
        </div>
      </div>

      {/* 검토 · 발행 */}
      <div className="space-y-4">
        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-extrabold">검토 체크리스트</h2>
            {validation && !canPublish && (
              <span className="px-2 py-1 rounded-md bg-amber-100 text-amber-700 text-[12px] font-black">
                {validation.issues.filter((i: any) => i.severity === 'ERROR').length}건 해결 필요
              </span>
            )}
          </div>
          <p className="mt-1 text-[12.5px] text-slate-500">발행 전 필수 항목을 모두 확인해주세요.</p>

          {!validation ? (
            <div className="py-10 text-center"><Loader2 className="w-6 h-6 text-emerald-500 animate-spin mx-auto" /></div>
          ) : (
            <ul className="mt-4 space-y-2">
              {validation.checklist.map((c: any) => {
                const open = openGroup === c.group;
                return (
                  <li key={c.group} className="rounded-xl border border-slate-100 overflow-hidden">
                    <button onClick={() => setOpenGroup(open ? null : c.group)} className="w-full px-4 py-3 flex items-center gap-2.5 text-left hover:bg-slate-50">
                      {c.status === 'OK'
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        : <AlertTriangle className={`w-4 h-4 shrink-0 ${c.status === 'ERROR' ? 'text-rose-600' : 'text-amber-600'}`} />}
                      <span className="text-[13px] font-bold">{c.group}</span>
                      <span className={`ml-auto text-[12px] font-bold ${
                        c.status === 'OK' ? 'text-emerald-700' : c.status === 'ERROR' ? 'text-rose-700' : 'text-amber-700'
                      }`}>
                        {c.status === 'OK' ? '모두 완료' : c.status === 'ERROR' ? '오류 있음' : '확인 필요'}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                    </button>
                    {open && c.issues.length > 0 && (
                      <ul className="px-4 pb-3 space-y-1.5 border-t border-slate-100 pt-2.5">
                        {c.issues.map((i: any, k: number) => (
                          <li key={k} className="text-[12.5px] break-keep">
                            <span className={i.severity === 'ERROR' ? 'font-bold text-rose-700' : 'font-bold text-amber-700'}>{i.message}</span>
                            <span className="block text-slate-500">→ {i.resolution}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <h2 className="text-[14px] font-extrabold">발행 설정</h2>
          <div className="mt-3 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={!useSchedule} onChange={() => setUseSchedule(false)} className="w-4 h-4 accent-emerald-600" />
              <span className="text-[13px] font-bold">즉시 발행</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={useSchedule} onChange={() => setUseSchedule(true)} className="w-4 h-4 accent-emerald-600" />
              <span className="text-[13px] font-bold">예약 발행</span>
              <input
                type="datetime-local"
                value={scheduled}
                onChange={(e) => { setScheduled(e.target.value); setUseSchedule(true); }}
                className="ml-2 h-9 px-3 rounded-lg border border-slate-200 text-[12.5px]"
              />
            </label>
          </div>

          <button
            onClick={() => onPublish(useSchedule && scheduled ? new Date(scheduled).toISOString() : undefined)}
            disabled={busy || !canPublish}
            className={`mt-4 w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl text-[14.5px] font-bold ${
              canPublish ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-100 text-slate-500 cursor-not-allowed'
            }`}
          >
            {busy ? '처리 중…' : canPublish ? <><Send className="w-4 h-4" /> 발행하기</> : '검증 통과 후 발행할 수 있습니다'}
          </button>
          <p className="mt-2 text-center text-[12px] text-slate-500">모든 항목을 확인해야 발행이 가능합니다.</p>
        </div>

        {/* 변경 이력 */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <h2 className="flex items-center gap-2 text-[14px] font-extrabold">
            <FileText className="w-4 h-4 text-slate-500" /> 변경 이력
          </h2>
          {!offer.audits?.length ? (
            <p className="mt-3 text-[12px] text-slate-500">기록이 없습니다</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {offer.audits.slice(0, 6).map((a: any) => (
                <li key={a.id} className="flex items-center gap-3 text-[12px]">
                  <span className="text-slate-500 shrink-0 tabular-nums">
                    {new Date(a.createdAt).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="font-bold shrink-0">{a.actorName}</span>
                  <span className="text-slate-600 truncate">{a.action}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 공용 폼 ────────────────────────────────────────── */

function Field({ label, value, onChange, required, max, placeholder, hint, disabled }: any) {
  return (
    <label className="block">
      <span className="text-[12px] font-bold text-slate-500">
        {label}{required && <span className="ml-1 text-rose-500">*</span>}
      </span>
      <div className="relative">
        <input
          value={value}
          onChange={(e) => onChange(max ? e.target.value.slice(0, max) : e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="mt-1.5 w-full h-11 px-3.5 rounded-xl border border-slate-200 text-[13px] focus:outline-none focus:border-emerald-400 disabled:bg-slate-50"
        />
        {max && <span className="absolute right-3 top-4 text-[12px] text-slate-500">{(value || '').length} / {max}</span>}
      </div>
      {hint && <span className="mt-1 block text-[12px] text-slate-500">{hint}</span>}
    </label>
  );
}

function NumField({ label, value, onChange }: any) {
  return (
    <label className="block">
      <span className="text-[12px] font-bold text-slate-500">{label}</span>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 w-full h-11 px-3 rounded-xl border border-slate-200 text-[13px] text-right" />
    </label>
  );
}

function Chips({ label, options, selected, onToggle, required }: any) {
  return (
    <div>
      <span className="text-[12px] font-bold text-slate-500">
        {label}{required && <span className="ml-1 text-rose-500">*</span>}
      </span>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {options.map((o: string) => {
          const on = selected.includes(o);
          return (
            <button key={o} onClick={() => onToggle(o)}
              className={`h-9 px-3 rounded-lg border text-[12.5px] font-bold transition-colors ${
                on ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'
              }`}>
              {on && <Check className="w-3 h-3 inline mr-1" />}{o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Preview({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500 shrink-0">{k}</dt>
      <dd className="font-bold text-right break-keep">{v}</dd>
    </div>
  );
}
