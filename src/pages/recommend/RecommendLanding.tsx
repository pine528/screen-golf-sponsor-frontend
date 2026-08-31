/**
 * 스폰픽 추천 PICK — 시작(랜딩) 화면
 * 추천 PICK 핸드오프 v1.0 §2.1 (자연어 우선 입력) · 시안 2026-08-21
 *
 * 자연어 한 문장 + 목표 칩만으로 시작하고, 상세 질문은 다음 단계(brief)에서 받는다.
 * 비로그인도 입력·미리보기까지 가능하며 값은 localStorage에 24시간 보관한다(§1.2).
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronRight, ShieldCheck } from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import { Link } from 'react-router-dom';

export const BRIEF_STORAGE_KEY = 'sponpik.recommend.brief';

const OBJECTIVES = [
  { key: 'AWARENESS', label: '브랜드 인지도' },
  { key: 'TRIAL', label: '제품 체험' },
  { key: 'PURCHASE', label: '구매 전환' },
  { key: 'LOCAL', label: '지역 홍보' },
];

const BUDGETS = [
  { key: 'UNDER_30', label: '월 30만원 이하', short: '월 30만원' },
  { key: 'M30_60', label: '월 30–60만원', short: '월 30–60만원' },
  { key: 'M60_100', label: '월 60–100만원', short: '월 60–100만원' },
  { key: 'OVER_100', label: '월 100만원 이상', short: '월 100만원' },
];

const DURATIONS = [
  { key: 'M1', label: '1개월 이내', short: '1개월' },
  { key: 'M1_3', label: '1–3개월', short: '3개월' },
  { key: 'M3_6', label: '3–6개월', short: '6개월' },
  { key: 'M6_PLUS', label: '6개월 이상', short: '6개월+' },
];

/** 자연어에서 예산·목표·기간 힌트를 뽑아 칩을 자동 선택 (§3.2 확인용 초안) */
function extractHints(text: string) {
  const out: { objective?: string; budget?: string; duration?: string } = {};
  if (/인지도|알리|브랜딩|노출/.test(text)) out.objective = 'AWARENESS';
  if (/체험|리뷰|사용후기|시식/.test(text)) out.objective = 'TRIAL';
  if (/구매|판매|전환|매출/.test(text)) out.objective = 'PURCHASE';
  if (/지역|매장|방문|동네/.test(text)) out.objective = 'LOCAL';
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

export default function RecommendLanding() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [objective, setObjective] = useState<string | null>(null);
  const [budget, setBudget] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);

  /* 이전 입력 복구 (§1.2) */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(BRIEF_STORAGE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.savedAt && Date.now() - d.savedAt > 86_400_000) return; // 24h
      if (d.freeText) setText(d.freeText);
      if (d.objective) setObjective(d.objective);
      if (d.budget) setBudget(d.budget);
      if (d.duration) setDuration(d.duration);
    } catch { /* 무시 */ }
  }, []);

  /* 자연어 입력에서 조건 자동 추출 — 사용자가 직접 고른 값은 덮어쓰지 않는다 */
  const hints = useMemo(() => extractHints(text), [text]);
  useEffect(() => {
    if (hints.objective && !objective) setObjective(hints.objective);
    if (hints.budget && !budget) setBudget(hints.budget);
    if (hints.duration && !duration) setDuration(hints.duration);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hints]);

  const submit = () => {
    const payload = { freeText: text.trim(), objective, budget, duration, savedAt: Date.now() };
    try { localStorage.setItem(BRIEF_STORAGE_KEY, JSON.stringify(payload)); } catch { /* 무시 */ }
    navigate('/sponsor/recommended/brief');
  };

  const label = (list: { key: string; short: string }[], key: string | null, fallback: string) =>
    list.find((x) => x.key === key)?.short || fallback;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4faf6] to-white text-slate-900">
      <PublicHeader />

      <section className="max-w-4xl mx-auto px-5 pt-14 sm:pt-20 pb-20">
        <p className="text-center text-[12.5px] font-black tracking-[0.14em] text-emerald-600">
          SPONPIK RECOMMEND PICK
        </p>
        <h1 className="mt-4 text-center text-[28px] sm:text-[42px] font-black tracking-tight leading-tight break-keep">
          어떤 후원 <span className="text-emerald-500">성과</span>를 만들고 싶으세요?
        </h1>
        <p className="mt-4 text-center text-[14px] sm:text-[15px] text-slate-500 break-keep">
          목표와 예산을 문장으로 입력하면 스폰픽이 선수·슬롯·콘텐츠를 조합해 추천합니다.
        </p>

        {/* 자연어 입력 */}
        <div className="mt-9 relative">
          <label htmlFor="brief-free" className="sr-only">후원 목표와 예산</label>
          <textarea
            id="brief-free"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 500))}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }}
            rows={3}
            placeholder="예: 월 300만원으로 3040 여성 골퍼에게 화장품을 알리고 구매로 연결하고 싶어요."
            className="w-full rounded-2xl border-2 border-emerald-400/70 bg-white px-5 py-5 pr-16 text-[15px] leading-relaxed placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 resize-none shadow-[0_10px_30px_-18px_rgba(16,185,129,0.5)]"
          />
          <button
            onClick={submit}
            aria-label="추천 조건 입력 계속하기"
            className="absolute right-4 bottom-4 w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <span className="absolute right-[74px] bottom-6 text-[11px] text-slate-300 tabular-nums">{text.length}/500</span>
        </div>

        {/* 목표 칩 */}
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          {OBJECTIVES.map((o) => {
            const on = objective === o.key;
            return (
              <button
                key={o.key}
                onClick={() => setObjective(on ? null : o.key)}
                aria-pressed={on}
                className={`h-11 px-5 rounded-full border text-[13.5px] font-bold inline-flex items-center gap-2 transition-colors ${
                  on ? 'border-emerald-500 bg-white text-emerald-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {o.label}
                {on && (
                  <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-black flex items-center justify-center">✓</span>
                )}
              </button>
            );
          })}
        </div>

        {/* 요약 바 */}
        <div className="mt-7 rounded-2xl bg-white border border-slate-100 shadow-[0_12px_36px_-20px_rgba(15,23,42,0.25)] px-6 py-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-5">
          <dl className="flex-1 grid grid-cols-3 divide-x divide-slate-100">
            <div className="px-1 sm:px-3">
              <dt className="text-[11.5px] text-slate-400 font-bold">목표</dt>
              <dd className="mt-1 text-[15px] sm:text-[17px] font-black text-emerald-600 truncate">
                {OBJECTIVES.find((o) => o.key === objective)?.label || '선택 전'}
              </dd>
            </div>
            <div className="px-3">
              <dt className="text-[11.5px] text-slate-400 font-bold">예산</dt>
              <dd className="mt-1 text-[15px] sm:text-[17px] font-black text-slate-900 truncate">
                {label(BUDGETS, budget, '미정')}
              </dd>
            </div>
            <div className="px-3">
              <dt className="text-[11.5px] text-slate-400 font-bold">추천 기간</dt>
              <dd className="mt-1 text-[15px] sm:text-[17px] font-black text-slate-900 truncate">
                {label(DURATIONS, duration, '미정')}
              </dd>
            </div>
          </dl>
          <button
            onClick={submit}
            className="shrink-0 h-12 px-7 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 text-white text-[14.5px] font-bold hover:bg-emerald-600 transition-colors"
          >
            추천 PICK 만들기 <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 예산·기간 빠른 선택 */}
        <div className="mt-5 grid sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[12px] font-black text-slate-500 mb-2.5">월 예산</p>
            <div className="flex flex-wrap gap-2">
              {BUDGETS.map((b) => (
                <button
                  key={b.key}
                  onClick={() => setBudget(budget === b.key ? null : b.key)}
                  aria-pressed={budget === b.key}
                  className={`px-3 py-1.5 rounded-lg text-[12.5px] font-bold border transition-colors ${
                    budget === b.key ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[12px] font-black text-slate-500 mb-2.5">희망 기간</p>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d.key}
                  onClick={() => setDuration(duration === d.key ? null : d.key)}
                  aria-pressed={duration === d.key}
                  className={`px-3 py-1.5 rounded-lg text-[12.5px] font-bold border transition-colors ${
                    duration === d.key ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 성과보장 안내 */}
        <p className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[12.5px] text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            약정 활동과 성과기준 미달 시 차기 후원 최대 50% 보정 지원.
          </span>
          <span className="hidden sm:inline w-px h-3 bg-slate-200" />
          <Link to="/about/guarantee" className="inline-flex items-center gap-0.5 font-bold text-emerald-600 hover:text-emerald-700">
            성과보장 프로그램 자세히 <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </p>
      </section>
    </div>
  );
}
