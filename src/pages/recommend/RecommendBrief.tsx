/**
 * 추천 PICK — 상세 입력 (핸드오프 v1.0 §2.2, 시안 img_17)
 *
 * 자연어 문장 + 자동추출 확인 칩 + 4개 필수 질문. 우측에 추천 조건 요약과
 * 입력 완료율을 보여준다. 답변은 localStorage에 즉시 저장한다(§1.2 autosave).
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Bookmark, ChevronRight, Info, ShieldCheck, Target, Users, Wallet } from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import { BRIEF_STORAGE_KEY } from './RecommendLanding';

const CATEGORIES = [
  { key: 'BEAUTY', label: '뷰티/화장품' }, { key: 'FASHION', label: '패션/의류' },
  { key: 'FOOD', label: '식품/음료' }, { key: 'IT', label: 'IT/전자제품' },
  { key: 'HEALTH', label: '건강/헬스' }, { key: 'ETC', label: '기타' },
];
const AGES = ['10대', '20대', '30대', '40대', '50대', '60대 이상'];
const OBJECTIVES = [
  { key: 'AWARENESS', label: '브랜드 인지도 향상' },
  { key: 'PURCHASE', label: '구매 전환' },
  { key: 'TRIAL', label: '제품 체험/리뷰 생성' },
  { key: 'LOCAL', label: '지역 홍보 · 매장 방문' },
];
const CHANNELS = [
  { key: 'INSTAGRAM', label: '인스타그램' }, { key: 'YOUTUBE', label: '유튜브' },
  { key: 'BLOG', label: '블로그' }, { key: 'STORE', label: '오프라인 매장' },
  { key: 'MALL', label: '온라인몰' }, { key: 'ETC', label: '기타' },
];
const BUDGETS = [
  { key: 'UNDER_30', label: '월 30만원 이하' }, { key: 'M30_60', label: '월 30–60만원' },
  { key: 'M60_100', label: '월 60–100만원' }, { key: 'OVER_100', label: '월 100만원 이상' },
];
const DURATIONS = [
  { key: 'M1', label: '1개월 이내' }, { key: 'M1_3', label: '1–3개월' },
  { key: 'M3_6', label: '3–6개월' }, { key: 'M6_PLUS', label: '6개월 이상' },
];

const STEPS = ['입력', '분석', '추천 결과', '추천안 수정', '선수 승인', '결제'];

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`px-3.5 py-2 rounded-lg text-[13px] font-bold border inline-flex items-center gap-1.5 transition-colors ${
        on ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
      }`}
    >
      {children}
      {on && <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-black flex items-center justify-center">✓</span>}
    </button>
  );
}

function Radio({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      role="radio"
      aria-checked={on}
      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-[13.5px] font-semibold text-left transition-colors ${
        on ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-600 hover:border-slate-300'
      }`}
    >
      <span className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${on ? 'border-emerald-500' : 'border-slate-300'}`}>
        {on && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
      </span>
      {children}
    </button>
  );
}

export default function RecommendBrief() {
  const navigate = useNavigate();
  const [freeText, setFreeText] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [ages, setAges] = useState<string[]>([]);
  const [objective, setObjective] = useState<string | null>(null);
  const [channels, setChannels] = useState<string[]>([]);
  const [budget, setBudget] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [constraints, setConstraints] = useState('');
  const [saved, setSaved] = useState(false);

  /* 랜딩 입력값 복구 */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(BRIEF_STORAGE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.freeText) setFreeText(d.freeText);
      if (d.objective) setObjective(d.objective);
      if (d.budget) setBudget(d.budget);
      if (d.duration) setDuration(d.duration);
      if (d.category) setCategory(d.category);
      if (d.ages) setAges(d.ages);
      if (d.channels) setChannels(d.channels);
      if (d.constraints) setConstraints(d.constraints);
      if (d.url) setUrl(d.url);
    } catch { /* 무시 */ }
  }, []);

  const payload = useMemo(() => ({
    freeText: freeText.trim(), url, category, ages, objective, channels, budget, duration, constraints,
    savedAt: Date.now(),
  }), [freeText, url, category, ages, objective, channels, budget, duration, constraints]);

  /* autosave */
  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(BRIEF_STORAGE_KEY, JSON.stringify(payload)); } catch { /* 무시 */ }
    }, 400);
    return () => clearTimeout(t);
  }, [payload]);

  const completion = useMemo(() => {
    const checks = [!!freeText.trim(), !!category, ages.length > 0, !!objective, channels.length > 0, !!budget, !!duration];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [freeText, category, ages, objective, channels, budget, duration]);

  const canStart = !!freeText.trim() && !!objective && !!budget;

  const start = () => {
    try { localStorage.setItem(BRIEF_STORAGE_KEY, JSON.stringify(payload)); } catch { /* 무시 */ }
    navigate('/sponsor/recommended/analyzing');
  };

  const toggle = (list: string[], setList: (v: string[]) => void, v: string, max?: number) => {
    if (list.includes(v)) setList(list.filter((x) => x !== v));
    else if (!max || list.length < max) setList([...list, v]);
  };

  const label = (list: { key: string; label: string }[], key: string | null, fallback: string) =>
    list.find((x) => x.key === key)?.label || fallback;

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-28">
      <PublicHeader />

      <div className="max-w-7xl mx-auto px-5 pt-5">
        {/* 브레드크럼 + 단계 */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
          <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[12.5px]">
            <Link to="/" className="text-slate-400 hover:text-slate-600">홈</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-400">후원하기</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-bold text-emerald-700">스폰픽 추천 PICK</span>
          </nav>
          <ol className="flex items-center gap-1.5 overflow-x-auto">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-1.5 shrink-0">
                <span className={`w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center ${
                  i === 0 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                }`}>{i + 1}</span>
                <span className={`text-[12px] font-bold ${i === 0 ? 'text-emerald-700' : 'text-slate-400'}`}>{s}</span>
                {i < STEPS.length - 1 && <span className="w-5 h-px bg-slate-200 mx-1" />}
              </li>
            ))}
          </ol>
        </div>

        <h1 className="mt-7 text-[24px] sm:text-[30px] font-black tracking-tight">원하는 후원 성과를 알려주세요</h1>
        <p className="mt-2 text-[13.5px] text-slate-500">간단한 정보만 입력하면 선수·후원 위치·콘텐츠를 조합해 추천해드립니다.</p>

        <div className="mt-7 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,330px)] gap-5 items-start">
          {/* 좌: 입력 */}
          <div className="space-y-4">
            <section className="rounded-2xl border border-slate-200 p-5 sm:p-6">
              <label htmlFor="ft" className="flex items-center gap-1.5 text-[14px] font-extrabold">
                브랜드와 제품을 소개해주세요
                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-black">필수</span>
              </label>
              <div className="relative mt-3">
                <textarea
                  id="ft"
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value.slice(0, 500))}
                  rows={3}
                  placeholder="월 100만원으로 3040 여성 골퍼에게 화장품을 알리고 구매로 연결하고 싶어요."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-[14px] leading-relaxed focus:outline-none focus:border-emerald-400 resize-none"
                />
                <span className="absolute right-3 bottom-2.5 text-[11px] text-slate-300 tabular-nums">{freeText.length} / 500</span>
              </div>

              <label htmlFor="url" className="block mt-4 text-[12.5px] font-bold text-slate-500">브랜드/제품 관련 URL <span className="font-normal text-slate-400">(선택)</span></label>
              <input
                id="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://"
                className="mt-1.5 w-full h-11 rounded-xl border border-slate-200 px-4 text-[13.5px] focus:outline-none focus:border-emerald-400"
              />

              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-[12.5px] font-bold text-slate-500 mb-2">업종</p>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((c) => <Chip key={c.key} on={category === c.key} onClick={() => setCategory(category === c.key ? null : c.key)}>{c.label}</Chip>)}
                  </div>
                </div>
                <div>
                  <p className="text-[12.5px] font-bold text-slate-500 mb-2">주요 고객</p>
                  <div className="flex flex-wrap gap-2">
                    {AGES.map((a) => <Chip key={a} on={ages.includes(a)} onClick={() => toggle(ages, setAges, a, 3)}>{a}</Chip>)}
                  </div>
                </div>
                <div>
                  <p className="text-[12.5px] font-bold text-slate-500 mb-2">선호 채널</p>
                  <div className="flex flex-wrap gap-2">
                    {CHANNELS.map((c) => <Chip key={c.key} on={channels.includes(c.key)} onClick={() => toggle(channels, setChannels, c.key)}>{c.label}</Chip>)}
                  </div>
                </div>
              </div>
            </section>

            {/* 4개 질문 */}
            <div className="grid sm:grid-cols-2 gap-4">
              <section className="rounded-2xl border border-slate-200 p-5">
                <h2 className="text-[13.5px] font-extrabold flex items-center gap-1.5">
                  <span className="text-emerald-600">①</span> 월 예산은 얼마인가요?
                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-black">필수</span>
                </h2>
                <div role="radiogroup" className="mt-3 space-y-2">
                  {BUDGETS.map((b) => <Radio key={b.key} on={budget === b.key} onClick={() => setBudget(b.key)}>{b.label}</Radio>)}
                </div>
              </section>
              <section className="rounded-2xl border border-slate-200 p-5">
                <h2 className="text-[13.5px] font-extrabold flex items-center gap-1.5">
                  <span className="text-emerald-600">②</span> 목표는 무엇인가요?
                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-black">필수</span>
                </h2>
                <div role="radiogroup" className="mt-3 space-y-2">
                  {OBJECTIVES.map((o) => <Radio key={o.key} on={objective === o.key} onClick={() => setObjective(o.key)}>{o.label}</Radio>)}
                </div>
              </section>
              <section className="rounded-2xl border border-slate-200 p-5">
                <h2 className="text-[13.5px] font-extrabold flex items-center gap-1.5">
                  <span className="text-emerald-600">③</span> 희망 기간은 어떻게 되나요?
                </h2>
                <div role="radiogroup" className="mt-3 space-y-2">
                  {DURATIONS.map((d) => <Radio key={d.key} on={duration === d.key} onClick={() => setDuration(d.key)}>{d.label}</Radio>)}
                </div>
              </section>
              <section className="rounded-2xl border border-slate-200 p-5">
                <h2 className="text-[13.5px] font-extrabold flex items-center gap-1.5">
                  <span className="text-emerald-600">④</span> 필수/제외 조건이 있나요?
                  <span className="text-[10.5px] font-bold text-slate-400">선택</span>
                </h2>
                <div className="relative mt-3">
                  <textarea
                    value={constraints}
                    onChange={(e) => setConstraints(e.target.value.slice(0, 300))}
                    rows={5}
                    placeholder="예) 여성 골프 선수 선호해요. 정치/주류/도박 관련은 제외합니다."
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-[13px] leading-relaxed focus:outline-none focus:border-emerald-400 resize-none"
                  />
                  <span className="absolute right-3 bottom-2.5 text-[11px] text-slate-300 tabular-nums">{constraints.length} / 300</span>
                </div>
              </section>
            </div>
          </div>

          {/* 우: 요약 */}
          <aside className="lg:sticky lg:top-24 rounded-2xl border border-slate-200 p-5">
            <h2 className="text-[14.5px] font-extrabold mb-4">추천 조건</h2>
            <dl className="space-y-3">
              {[
                { icon: Wallet, k: '월 예산', v: label(BUDGETS, budget, '미선택') },
                { icon: Target, k: '목표', v: label(OBJECTIVES, objective, '미선택') },
                { icon: Users, k: '타겟', v: ages.length ? ages.join(' · ') : '미선택' },
              ].map((row) => (
                <div key={row.k} className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <row.icon className="w-4 h-4 text-emerald-600" />
                  </span>
                  <span className="text-[12.5px] text-slate-500">{row.k}</span>
                  <span className="ml-auto text-[13px] font-extrabold text-slate-900 text-right truncate max-w-[52%]">{row.v}</span>
                </div>
              ))}
            </dl>

            <div className="mt-5">
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-[12px] font-bold text-slate-500">입력 완료율</span>
                <span className="text-[15px] font-black text-emerald-600 tabular-nums">{completion}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${completion}%` }} />
              </div>
            </div>

            <p className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50/70 px-3.5 py-3 text-[11.5px] text-emerald-800 leading-relaxed">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              입력 정보는 추천 분석과 제안서 작성에만 사용됩니다.
            </p>
          </aside>
        </div>
      </div>

      {/* 하단 고정 CTA */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-5 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <button
            onClick={() => { try { localStorage.setItem(BRIEF_STORAGE_KEY, JSON.stringify(payload)); setSaved(true); setTimeout(() => setSaved(false), 1800); } catch { /* 무시 */ } }}
            className="h-12 px-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 text-slate-700 text-[13.5px] font-bold hover:bg-slate-50"
          >
            <Bookmark className="w-4 h-4" /> {saved ? '저장했어요' : '저장 후 나중에 계속'}
          </button>
          <p className="hidden sm:flex items-center gap-1.5 text-[11.5px] text-slate-400">
            <Info className="w-3.5 h-3.5" /> 입력 정보는 추천 분석과 제안서 작성에만 사용됩니다.
          </p>
          <button
            onClick={start}
            disabled={!canStart}
            className="ml-auto h-12 px-8 inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white text-[14.5px] font-bold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            추천 분석 시작 <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
