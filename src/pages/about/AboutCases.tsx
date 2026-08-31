/**
 * 매칭사례 — 리디자인 시안 (대표 사례 + 보조 사례 + 매칭 프로세스 4단계)
 * 사례·수치는 2026-08 GTOUR/WGTOUR 방송 노출 트래킹 실측 데이터만 사용 (LEG-06).
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BarChart3, CheckCircle2, ChevronRight, FileText,
  Layers, ShieldCheck, Target, Users,
} from 'lucide-react';
import AboutLayout from './AboutLayout';

const FILTERS = ['전체', '후원슬롯', 'SNS 콘텐츠', '팬스토어'] as const;

/** 실측 사례 — 2026 GTOUR/WGTOUR 6차 메이저 방송 노출 트래킹 리포트 기준 */
const SUB_CASES = [
  {
    brandLogo: '/brands/orex.png', brandName: '오렉스', brandDesc: '골프 용품',
    athlete: '염돈웅', athleteImg: '/golfers/youm-donwoong-2026.jpeg', tour: 'KPGA 프로 골퍼',
    tags: ['후원슬롯'],
    goal: '대회 중계 중심 브랜드 노출',
    combo: '우측 소매 · GTOUR 6차 · 공동 2위',
    result: '중계 착용 노출 실측 확인 (조회 22.8만 중계)',
  },
  {
    brandLogo: '/brands/elensilia.png', brandName: '엘렌실라', brandDesc: '뷰티 브랜드',
    athlete: '장연주', athleteImg: '/golfers/jang-yeonju.jpeg', tour: 'KLPGA 프로 골퍼',
    tags: ['후원슬롯', '팬스토어'],
    goal: '여성 골프 팬 대상 브랜드 인지',
    combo: '우측 소매 2단 패치 · WGTOUR 6차',
    result: '버디 세리머니 클로즈업 노출 확인',
  },
];

const PROCESS = [
  { icon: Target, no: 1, title: '목표 입력', desc: '브랜드 목표와 예산 입력' },
  { icon: Users, no: 2, title: '선수 · 활동 매칭', desc: '최적의 선수와 활동 조합 제안' },
  { icon: FileText, no: 3, title: '계약 · 실행', desc: '계약 체결 후 콘텐츠 실행' },
  { icon: BarChart3, no: 4, title: '성과 리포트', desc: '데이터 기반 성과 리포트 제공' },
];

export default function AboutCases() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('전체');
  const subs = SUB_CASES.filter((c) => filter === '전체' || c.tags.includes(filter));

  return (
    <AboutLayout current="매칭사례">
      <section className="max-w-7xl mx-auto px-5 pt-12 pb-16">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4 justify-between">
          <div>
            <h1 className="text-[24px] sm:text-[32px] font-black tracking-tight break-keep">
              선택부터 성과까지, <span className="text-emerald-600">실제 매칭의 흐름</span>을 확인하세요
            </h1>
            <p className="mt-2.5 text-[13.5px] sm:text-[14.5px] text-slate-500 break-keep">
              브랜드의 목표와 선수의 강점을 연결해 실행하고 결과를 리포트합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3.5 py-1.5 rounded-lg text-[12.5px] font-bold border transition-colors ${
                  filter === f ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid lg:grid-cols-2 gap-5 items-start">
          {/* 대표 사례 — 배진리 × 엘렌실라 (방송 노출 실측) */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-6 sm:p-7">
            <span className="inline-flex px-2.5 py-1 rounded-md bg-emerald-600 text-white text-[11px] font-black">대표 사례</span>
            <div className="mt-5 grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-6">
              <div className="flex sm:flex-col items-center gap-4">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white border border-slate-200 flex items-center justify-center p-4">
                  <img src="/brands/elensilia.png" alt="ELENSILIA" className="max-w-full object-contain" />
                </div>
                <span className="text-slate-300 text-xl font-light">×</span>
                <div className="text-center">
                  <img src="/golfers/bae-jinri.png" alt="배진리 프로" className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover object-top border border-slate-200" />
                  <p className="mt-2 text-[15px] font-extrabold">배진리</p>
                  <p className="text-[11px] text-slate-400 font-semibold">KLPGA 프로 골퍼</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="flex items-center gap-1.5 text-[12px] font-black text-emerald-700"><Target className="w-4 h-4" /> 목표</p>
                  <p className="mt-1 text-[14.5px] font-bold text-slate-800 break-keep">여성 골프 팬 대상 브랜드 인지도</p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-[12px] font-black text-emerald-700"><Layers className="w-4 h-4" /> 선정 조합</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {['바이저 정면', 'WGTOUR 6차', '팬스토어 협업'].map((c) => (
                      <span key={c} className="px-2 py-1 rounded-md bg-white border border-slate-200 text-[11.5px] font-bold text-slate-600">{c}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-[12px] font-black text-emerald-700"><CheckCircle2 className="w-4 h-4" /> 성과 요약 <span className="text-[10px] font-bold text-slate-400">(중계 실측)</span></p>
                  <div className="mt-1.5 grid grid-cols-3 gap-2">
                    {[
                      { k: '중계 착용 노출', v: '57초' },
                      { k: '클로즈업 확인', v: '2회' },
                      { k: '팬스토어', v: '협업 진행' },
                    ].map((s) => (
                      <div key={s.k} className="rounded-xl bg-white border border-slate-200 px-2 py-2.5 text-center">
                        <p className="text-[13.5px] font-black text-slate-900">{s.v}</p>
                        <p className="text-[10px] text-slate-400 font-semibold break-keep">{s.k}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <Link
                  to={`/contact?subject=${encodeURIComponent('[매칭사례] 상세 자료 요청')}`}
                  className="h-11 w-full inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-600 text-white text-[13.5px] font-bold hover:bg-emerald-700 transition-colors"
                >
                  사례 자세히 <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* 보조 사례 2건 */}
          <div className="space-y-4">
            {subs.map((c) => (
              <div key={c.brandName + c.athlete} className="rounded-2xl border border-slate-200 p-5 sm:p-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center p-2.5">
                      <img src={c.brandLogo} alt={c.brandName} className="max-w-full max-h-full object-contain" />
                    </span>
                    <span className="text-slate-300">×</span>
                    <span className="w-16 h-16 rounded-full overflow-hidden border border-slate-200">
                      <img src={c.athleteImg} alt={c.athlete} className="w-full h-full object-cover object-top" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14.5px] font-extrabold truncate">{c.brandName} × {c.athlete}</p>
                    <p className="text-[11px] text-slate-400 font-semibold">{c.brandDesc} · {c.tour}</p>
                  </div>
                </div>
                <dl className="mt-4 space-y-2 text-[13px]">
                  {[
                    { icon: Target, k: '목표', v: c.goal },
                    { icon: Layers, k: '선정 조합', v: c.combo },
                    { icon: CheckCircle2, k: '성과', v: c.result },
                  ].map((row) => (
                    <div key={row.k} className="flex items-start gap-2">
                      <dt className="flex items-center gap-1 w-[76px] shrink-0 text-[12px] font-black text-emerald-700">
                        <row.icon className="w-3.5 h-3.5" /> {row.k}
                      </dt>
                      <dd className="text-slate-600 break-keep">{row.v}</dd>
                    </div>
                  ))}
                </dl>
                <Link to={`/contact?subject=${encodeURIComponent(`[매칭사례] ${c.brandName} × ${c.athlete} 자료 요청`)}`} className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-bold text-emerald-600 hover:text-emerald-700">
                  사례 보기 <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* 매칭 프로세스 */}
        <div className="mt-6 rounded-2xl border border-slate-200 px-6 py-6 flex flex-col lg:flex-row items-stretch lg:items-center gap-5">
          <p className="text-[15px] font-extrabold shrink-0 lg:w-24 break-keep">우리의 매칭<br className="hidden lg:block" /> 프로세스</p>
          <div className="flex-1 grid sm:grid-cols-4 gap-3">
            {PROCESS.map((p, i) => (
              <div key={p.title} className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <p.icon className="w-5 h-5 text-emerald-600" strokeWidth={1.9} />
                </span>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-extrabold whitespace-nowrap">{p.no}. {p.title}</p>
                  <p className="text-[11px] text-slate-400 break-keep">{p.desc}</p>
                </div>
                {i < PROCESS.length - 1 && <ArrowRight className="hidden sm:block w-4 h-4 text-slate-300 ml-auto shrink-0" />}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-9 text-center">
          <Link
            to="/ai-match"
            className="h-12 px-8 inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors"
          >
            우리 브랜드 매칭안 받아보기 <ChevronRight className="w-4 h-4" />
          </Link>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> 성과보장 프로그램으로 안심하고 시작하세요.
          </p>
        </div>
      </section>
    </AboutLayout>
  );
}
