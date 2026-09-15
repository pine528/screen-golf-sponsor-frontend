/**
 * 추천 PICK — 분석 중 (핸드오프 v1.0 §4.1, 시안 img_18)
 *
 * 실제 API 호출 시간에 맞춰 5단계 진행을 보여주고, 완료되면 결과를 세션에 담아
 * 결과 화면으로 이동한다. 실패 시 재시도·입력수정·상담 경로를 제공한다(§4.1).
 */
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, BarChart3, CalendarCheck, Check, ChevronRight, Clock, Users } from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import { api } from '../../services/api';
import { BRIEF_STORAGE_KEY } from './RecommendLanding';

export const RESULT_STORAGE_KEY = 'sponpik.recommend.result';

const STEPS = [
  '브랜드 목표 구조화',
  '예산 · 기간 조건 확인',
  '후원 가능한 선수 검토',
  '슬롯 · 콘텐츠 조합 계산',
  '중복 · 업종 충돌 검증',
];

const FACETS = [
  { icon: Users, title: '선수 적합도', desc: '타깃 · 활동 분야 · 팬 반응' },
  { icon: CalendarCheck, title: '후원 실행성', desc: '일정 · 슬롯 · 추가 활동 가능 여부' },
  { icon: BarChart3, title: '측정 가능성', desc: '노출 · 콘텐츠 · 구매 연결 지표' },
];

const CHIP_LABEL: Record<string, string> = {
  UNDER_30: '월 30만원 이하', M30_60: '월 30–60만원', M60_100: '월 60–100만원', OVER_100: '월 100만원 이상',
  AWARENESS: '브랜드 인지도', TRIAL: '제품 체험', PURCHASE: '구매 전환', LOCAL: '지역 홍보',
  M1: '1개월', M1_3: '1–3개월', M3_6: '3–6개월', M6_PLUS: '6개월 이상',
  BEAUTY: '뷰티/화장품', FASHION: '패션/의류', FOOD: '식품/음료', IT: 'IT/전자제품', HEALTH: '건강/헬스', ETC: '기타',
};

export default function RecommendAnalyzing() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(6);
  const [error, setError] = useState<string | null>(null);
  const [brief, setBrief] = useState<any>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let raw: any = null;
    try { raw = JSON.parse(localStorage.getItem(BRIEF_STORAGE_KEY) || 'null'); } catch { /* 무시 */ }
    if (!raw || (!raw.freeText && !raw.objective)) { navigate('/sponsor/recommended', { replace: true }); return; }
    setBrief(raw);

    /* 진행 애니메이션 — 응답이 빨라도 최소 2.4초는 보여준다 */
    const startedAt = Date.now();
    const tick = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 7 + 2, 92));
      setStep((s) => Math.min(s + (Math.random() > 0.45 ? 1 : 0), STEPS.length - 1));
    }, 700);

    (async () => {
      try {
        const r: any = await api.createRecommendPick({
          freeText: raw.freeText,
          objective: raw.objective,
          budgetBand: raw.budget,
          durationBand: raw.duration,
          category: raw.category,
          targetAges: raw.ages,
          channels: raw.channels,
          constraints: raw.constraints,
        });
        const data = r?.data;
        if (!data?.plans?.length) throw new Error('EMPTY');
        const wait = Math.max(0, 2400 - (Date.now() - startedAt));
        setTimeout(() => {
          clearInterval(tick);
          setProgress(100);
          setStep(STEPS.length - 1);
          try { sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify({ requestId: data.requestId, data })); } catch { /* 무시 */ }
          setTimeout(() => navigate(`/sponsor/recommended/results/${data.requestId}`, { replace: true, state: { data } }), 450);
        }, wait);
      } catch (e: any) {
        clearInterval(tick);
        setError(e?.message === 'EMPTY'
          ? '현재 조건을 모두 만족하는 조합을 찾지 못했습니다.'
          : '추천을 완성하지 못했습니다.');
      }
    })();

    return () => clearInterval(tick);
  }, [navigate]);

  const chips = brief ? [brief.budget, brief.objective, brief.category, brief.duration].filter(Boolean).map((k: string) => CHIP_LABEL[k] || k) : [];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicHeader />
      <section className="max-w-4xl mx-auto px-5 pt-12 pb-20">
        {error ? (
          <div className="rounded-2xl border border-slate-200 p-8 text-center">
            <AlertCircle className="w-11 h-11 text-amber-500 mx-auto" />
            <h1 className="mt-4 text-[20px] font-black">{error}</h1>
            <p className="mt-2 text-[13.5px] text-slate-500 break-keep">
              조건을 조금 넓히거나 다시 시도해 보세요. 담당자 상담으로도 도와드릴 수 있어요.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5 justify-center">
              <Link to="/sponsor/recommended/brief" className="h-11 px-5 inline-flex items-center rounded-xl border border-slate-200 text-slate-700 text-[13.5px] font-bold hover:bg-slate-50">
                입력 수정하기
              </Link>
              <button onClick={() => window.location.reload()} className="h-11 px-5 inline-flex items-center rounded-xl bg-emerald-600 text-white text-[13.5px] font-bold hover:bg-emerald-700">
                다시 시도
              </button>
              <Link to={`/contact?subject=${encodeURIComponent('[추천 PICK] 상담 요청')}`} className="h-11 px-5 inline-flex items-center rounded-xl border border-emerald-600 text-emerald-700 text-[13.5px] font-bold hover:bg-emerald-50">
                상담 요청
              </Link>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-center text-[24px] sm:text-[30px] font-black tracking-tight break-keep">
              브랜드에 맞는 후원 조합을 분석하고 있어요
            </h1>
            <p className="mt-3 text-center text-[13.5px] sm:text-[14.5px] text-slate-500 break-keep">
              등록된 선수 정보와 후원 가능 조건을 비교해 최적의 조합을 찾습니다.
            </p>

            <div className="mt-9 rounded-2xl border border-slate-200 p-6 sm:p-8 grid sm:grid-cols-[minmax(0,260px)_minmax(0,1fr)] gap-8 items-center">
              {/* 진행 도넛 */}
              <div className="relative w-[200px] h-[200px] mx-auto">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#eef4ef" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="52" fill="none" stroke="#10b981" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${(progress / 100) * 326.7} 326.7`}
                    style={{ transition: 'stroke-dasharray 0.6s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[38px] font-black tabular-nums leading-none">{Math.round(progress)}<span className="text-[20px]">%</span></span>
                  <span className="mt-1.5 text-[12px] text-slate-500 font-bold">분석 진행 중</span>
                </div>
              </div>

              {/* 단계 */}
              <ol className="space-y-0.5">
                {STEPS.map((s, i) => {
                  const done = i < step || progress >= 100;
                  const active = i === step && progress < 100;
                  return (
                    <li key={s} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-none">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        done ? 'bg-emerald-500' : active ? 'border-2 border-emerald-400 border-dashed animate-spin' : 'border-2 border-slate-200'
                      }`} style={active ? { animationDuration: '2.4s' } : undefined}>
                        {done && <Check className="w-3 h-3 text-white" strokeWidth={3.5} />}
                      </span>
                      <span className={`text-[13.5px] font-bold ${done ? 'text-slate-700' : active ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {s}{active && ' 중'}{done && ' 완료'}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* 분석 관점 */}
            <div className="mt-4 grid sm:grid-cols-3 gap-4">
              {FACETS.map((f) => (
                <div key={f.title} className="rounded-2xl border border-slate-200 p-5 flex items-center gap-3.5">
                  <span className="w-11 h-11 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <f.icon className="w-5 h-5 text-emerald-600" strokeWidth={1.9} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-extrabold">{f.title}</p>
                    <p className="text-[12px] text-slate-500 break-keep">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* 조건 요약 */}
            <div className="mt-4 rounded-2xl border border-slate-200 px-5 py-4 flex flex-wrap items-center gap-3">
              <span className="text-[13px] font-extrabold shrink-0">입력 조건 요약</span>
              {chips.map((c) => (
                <span key={c} className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[12px] font-bold">{c}</span>
              ))}
              <Link to="/sponsor/recommended/brief" className="ml-auto inline-flex items-center gap-1 text-[12.5px] font-bold text-slate-500 hover:text-slate-800">
                입력 내용 수정 <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <p className="mt-5 flex items-center justify-center gap-1.5 text-[12px] text-slate-500">
              <Clock className="w-3.5 h-3.5" /> 보통 20초 이내로 끝나요. 화면을 닫아도 분석은 계속됩니다.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
