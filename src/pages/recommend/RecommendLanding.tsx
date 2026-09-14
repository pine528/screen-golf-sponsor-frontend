/**
 * 스폰픽 추천 PICK — 시작 화면
 * UI/UX 통합 가이드 v1.0 §7.1 · 통합 핸드오프 v2.1 §7
 *
 *  - "AI가 선수를 순위대로 뽑아주는 검색창"처럼 보이지 않게 한다.
 *    추천 PICK은 실행 가능한 후원안 1~3개를 조합해 주는 의사결정 서비스다.
 *  - 첫 질문 하나: "이번 후원에서 가장 얻고 싶은 것은 무엇인가요?"
 *  - 자연어 1~500자 + 예시 chip → 자동 추출한 조건을 사용자가 확인·수정한다.
 *  - 비로그인도 입력·미리보기까지 가능. 값은 localStorage 24시간 보관.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, ChevronRight, ListChecks, ShieldCheck, Target, Users } from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';

export const BRIEF_STORAGE_KEY = 'sponpik.recommend.brief';

/** 예시 chip — 누르면 문장이 입력된다 (§7.1) */
const OBJECTIVES = [
  { key: 'AWARENESS', label: '인지도', example: '신제품을 3040 골퍼에게 알리고 싶어요. 대회 노출과 SNS를 같이 활용하고 싶습니다.' },
  { key: 'TRIAL', label: '제품 체험', example: '선수가 실제로 우리 제품을 써보고 후기를 남겨주면 좋겠어요.' },
  { key: 'SNS', label: 'SNS 확산', example: '선수 인스타그램과 릴스로 브랜드 콘텐츠를 확산하고 싶어요.' },
  { key: 'PURCHASE', label: '판매 전환', example: '할인코드와 팬스토어로 실제 구매까지 이어지게 하고 싶어요.' },
  { key: 'LOCAL', label: '지역 상생', example: '우리 지역 매장 방문과 동네 홍보에 도움이 되는 선수를 찾고 있어요.' },
];

const BUDGETS = [
  { key: 'UNDER_30', label: '월 30만원 이하' },
  { key: 'M30_60', label: '월 30–60만원' },
  { key: 'M60_100', label: '월 60–100만원' },
  { key: 'OVER_100', label: '월 100만원 이상' },
];

const DURATIONS = [
  { key: 'M1', label: '1개월 이내' },
  { key: 'M1_3', label: '1–3개월' },
  { key: 'M3_6', label: '3–6개월' },
  { key: 'M6_PLUS', label: '6개월 이상' },
];

/** 자연어에서 힌트 추출 — 서버와 같은 규칙. 확인용 초안이며 사용자가 고친 값이 우선한다 */
function extractHints(text: string) {
  const out: { objective?: string; budget?: string; duration?: string } = {};
  if (/인지도|알리|브랜딩|노출/.test(text)) out.objective = 'AWARENESS';
  if (/체험|리뷰|사용후기|후기|시식/.test(text)) out.objective = 'TRIAL';
  if (/SNS|인스타|릴스|숏폼|확산|바이럴/i.test(text)) out.objective = 'SNS';
  if (/구매|판매|전환|매출/.test(text)) out.objective = 'PURCHASE';
  if (/지역|매장|방문|동네|상권/.test(text)) out.objective = 'LOCAL';
  const man = text.match(/(\d{1,4})\s*만\s*원/);
  if (man) {
    const v = Number(man[1]);
    out.budget = v <= 30 ? 'UNDER_30' : v <= 60 ? 'M30_60' : v < 100 ? 'M60_100' : 'OVER_100';
  }
  const mon = text.match(/(\d{1,2})\s*개월/);
  if (mon) {
    const v = Number(mon[1]);
    out.duration = v <= 1 ? 'M1' : v <= 3 ? 'M1_3' : v <= 6 ? 'M3_6' : 'M6_PLUS';
  }
  return out;
}

const STEPS = [
  { icon: Target, title: '목표 정리', desc: '문장에서 목표·예산·타깃·기간을 뽑아 확인합니다.' },
  { icon: ListChecks, title: '실행 가능성 검증', desc: '선수 재고 · 일정 · 권리 · 업종 제한을 실제 데이터로 거릅니다.' },
  { icon: Users, title: '후원안 1~3개', desc: '안정형 · 균형형 · 도전형으로 조합하고 근거와 위험을 함께 보여드립니다.' },
];

export default function RecommendLanding() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [objective, setObjective] = useState<string | null>(null);
  const [budget, setBudget] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(BRIEF_STORAGE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.savedAt && Date.now() - d.savedAt > 86_400_000) return;
      if (d.freeText) setText(d.freeText);
      if (d.objective) setObjective(d.objective);
      if (d.budget) setBudget(d.budget);
      if (d.duration) setDuration(d.duration);
    } catch { /* 무시 */ }
  }, []);

  const hints = useMemo(() => extractHints(text), [text]);
  useEffect(() => {
    if (hints.objective && !objective) setObjective(hints.objective);
    if (hints.budget && !budget) setBudget(hints.budget);
    if (hints.duration && !duration) setDuration(hints.duration);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hints]);

  const canSubmit = text.trim().length > 0 || !!objective;

  const submit = () => {
    if (!canSubmit) return;
    const payload = { freeText: text.trim(), objective, budget, duration, savedAt: Date.now() };
    try { localStorage.setItem(BRIEF_STORAGE_KEY, JSON.stringify(payload)); } catch { /* 무시 */ }
    navigate('/sponsor/recommended/brief');
  };

  const useExample = (o: typeof OBJECTIVES[number]) => {
    setObjective(o.key);
    if (!text.trim()) setText(o.example);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicHeader />

      <div className="max-w-[1180px] mx-auto px-5 pt-6">
        <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[13px]">
          <Link to="/" className="text-slate-500 hover:text-slate-700">홈</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <Link to="/sponsor" className="text-slate-500 hover:text-slate-700">후원하기</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-bold text-rose-600">스폰픽 추천 PICK</span>
        </nav>
        <Link to="/sponsor" className="mt-2 inline-flex items-center gap-1 text-[13px] font-bold text-emerald-700 hover:text-emerald-800">
          <ChevronRight className="w-4 h-4 rotate-180" /> 후원 방식 다시 선택
        </Link>
      </div>

      <section className="max-w-[1180px] mx-auto px-5 pt-8 sm:pt-10 pb-24 grid lg:grid-cols-[minmax(0,1fr)_340px] gap-8 lg:gap-12 items-start">
        {/* 좌: 한 질문 + 브리프 */}
        <div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-rose-500 text-white text-[12.5px] font-black tracking-wide">
            SPONPIK RECOMMENDED
          </span>
          <h1 className="mt-4 text-[27px] sm:text-[36px] font-extrabold tracking-[-0.02em] leading-tight break-keep">
            이번 후원에서 가장 얻고 싶은 것은 무엇인가요?
          </h1>
          <p className="mt-3 text-[15px] text-slate-600 leading-relaxed break-keep">
            문장으로 편하게 적어주세요. 스폰픽이 목표를 정리하고 실제로 진행할 수 있는 후원안을 조합합니다.
            선수 순위를 매기는 화면이 아닙니다.
          </p>

          {/* 예시 chip */}
          <div className="mt-6">
            <p className="text-[13px] font-bold text-slate-600">예시로 시작하기</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {OBJECTIVES.map((o) => {
                const on = objective === o.key;
                return (
                  <button
                    key={o.key}
                    onClick={() => useExample(o)}
                    aria-pressed={on}
                    className={`h-10 px-4 rounded-full border text-[13.5px] font-bold inline-flex items-center gap-1.5 transition-colors ${
                      on ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    {on && <Check className="w-3.5 h-3.5" />}
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 자연어 입력 */}
          <div className="mt-5 rounded-3xl border-2 border-slate-200 bg-white focus-within:border-rose-400 transition-colors">
            <label htmlFor="brief-free" className="block px-5 pt-4 text-[13px] font-bold text-slate-600">
              후원 목표 <span className="font-normal text-slate-500">(1~500자)</span>
            </label>
            <textarea
              id="brief-free"
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 500))}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }}
              rows={4}
              placeholder="예: 월 300만원으로 3040 여성 골퍼에게 화장품을 알리고 구매로 연결하고 싶어요."
              className="w-full px-5 py-3 text-[15.5px] leading-relaxed placeholder:text-slate-400 focus:outline-none resize-none bg-transparent"
            />
            <div className="px-5 pb-3 flex items-center justify-between text-[12px] text-slate-500">
              <span>브랜드명 · 제품 · 타깃 · 지역 · 예산 · 기간을 적으면 더 정확해집니다.</span>
              <span className="tabular-nums">{text.length}/500</span>
            </div>
          </div>

          {/* 자동 추출 확인 — 사용자가 고칠 수 있다 (§7.2 B층) */}
          <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-[13.5px] font-bold text-slate-800">이렇게 이해했어요. 다르면 바꿔주세요.</p>
            <div className="mt-3 grid sm:grid-cols-3 gap-3">
              <Field label="목표">
                <select value={objective ?? ''} onChange={(e) => setObjective(e.target.value || null)} className={selectCls}>
                  <option value="">선택 전</option>
                  {OBJECTIVES.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="월 예산">
                <select value={budget ?? ''} onChange={(e) => setBudget(e.target.value || null)} className={selectCls}>
                  <option value="">미정 (다음 단계에서)</option>
                  {BUDGETS.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
                </select>
              </Field>
              <Field label="희망 기간">
                <select value={duration ?? ''} onChange={(e) => setDuration(e.target.value || null)} className={selectCls}>
                  <option value="">미정 (다음 단계에서)</option>
                  {DURATIONS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
                </select>
              </Field>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
            <button
              onClick={submit}
              disabled={!canSubmit}
              className="h-[52px] px-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-500 text-white text-[15px] font-bold hover:bg-rose-600 transition-colors disabled:opacity-40"
            >
              다음 · 조건 확인하기 <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[13px] text-slate-600">
              로그인 없이 3문항까지 미리 볼 수 있어요. 추천안 확인 단계에서 브랜드 로그인이 필요합니다.
            </p>
          </div>
        </div>

        {/* 우: 이 화면이 하는 일 */}
        <aside className="rounded-3xl border border-slate-200 p-6">
          <p className="text-[13px] font-bold text-slate-500">추천 PICK은 이렇게 진행됩니다</p>
          <ol className="mt-4 space-y-4">
            {STEPS.map((s, i) => {
              const I = s.icon;
              return (
                <li key={s.title} className="flex gap-3">
                  <span className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 inline-flex items-center justify-center shrink-0">
                    <I className="w-[18px] h-[18px]" />
                  </span>
                  <div>
                    <p className="text-[14px] font-extrabold">{i + 1}. {s.title}</p>
                    <p className="mt-0.5 text-[13px] text-slate-600 leading-relaxed break-keep">{s.desc}</p>
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="mt-5 pt-5 border-t border-slate-100 text-[13px] text-slate-600 leading-relaxed break-keep">
            <p className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                추천안에 성과보장 정책이 붙은 경우, 계약 KPI 미달 시 약정에 따른 보완지원을 받습니다.
                <Link to="/about/performance-guarantee" className="ml-1 font-bold text-emerald-700 hover:text-emerald-800">자세히</Link>
              </span>
            </p>
            <p className="mt-3 text-slate-500">
              가격 · 재고 · 승인 가능 여부는 서버 데이터로 검증하며, 후보가 부족하면 억지로 3안을 만들지 않습니다.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}

const selectCls = 'w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-[13.5px] font-bold text-slate-800 focus:outline-none focus:border-rose-400';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block mb-1.5 text-[12.5px] font-bold text-slate-600">{label}</span>
      {children}
    </label>
  );
}
