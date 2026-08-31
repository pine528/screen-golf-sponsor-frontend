/**
 * 성과보장 프로그램 — 리디자인 시안 (5단계 + 확인 항목 + 최대 50% 보정 + 예시 흐름)
 * 카피 기준(§9.2): 매출보장·우승보장 표현 금지, 계약 기준·지원 한도 함께 노출.
 */
import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle, ArrowRight, BarChart3, ChevronRight, Handshake, Hash, Heart,
  MessageSquare, Search, ShieldCheck, Tv, Users, Zap,
} from 'lucide-react';
import AboutLayout from './AboutLayout';

const STEPS = [
  { icon: Handshake, title: '성과기준 합의', desc: '후원 목적과 성과기준을 사전 합의합니다.' },
  { icon: Zap, title: '활동 실행', desc: '선수가 합의한 활동을 계획에 따라 실행합니다.' },
  { icon: Search, title: '노출 · 콘텐츠 검증', desc: '전문 검증 프로세스로 사실과 데이터를 확인합니다.' },
  { icon: BarChart3, title: 'ROI 리포트', desc: '성과를 리포트로 제공하여 투명하게 공유합니다.' },
  { icon: ShieldCheck, title: '미달 시 보정 지원', desc: '기준에 미달한 경우, 보정 지원을 검토합니다.', gold: true },
];

const CHECKS = [
  { icon: Tv, label: '방송 노출' },
  { icon: Hash, label: 'SNS 활동' },
  { icon: Heart, label: '콘텐츠 반응' },
  { icon: Users, label: '팬 · 방문 전환' },
];

const EXAMPLE = [
  { icon: Tv, label: '목표', value: '방송 10초' },
  { icon: MessageSquare, label: '실행', value: 'SNS 2건' },
  { icon: AlertCircle, label: '결과', value: '일부 미달', warn: true },
  { icon: ShieldCheck, label: '다음 후원', value: '보정 검토', gold: true },
];

export default function AboutGuarantee() {
  return (
    <AboutLayout current="성과보장 프로그램">
      <section className="max-w-7xl mx-auto px-5 pt-12 pb-16">
        <h1 className="text-center text-[26px] sm:text-4xl font-black tracking-tight break-keep">
          후원은 실행에서 끝나지 않습니다
        </h1>
        <p className="mt-4 text-center text-[14px] sm:text-[15px] text-slate-500 break-keep">
          약정한 활동을 확인하고, 합의한 성과기준까지 투명하게 관리합니다.
        </p>

        {/* 5단계 */}
        <div className="mt-10 rounded-2xl border border-slate-200 p-6 sm:p-8">
          <div className="grid sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr] gap-3 items-stretch">
            {STEPS.map((s, i) => (
              <Fragment key={s.title}>
                <div className={`rounded-2xl p-5 text-center ${s.gold ? 'bg-amber-50 border border-amber-200' : ''}`}>
                  <span className="inline-flex w-6 h-6 rounded-full bg-emerald-600 text-white text-[12px] font-black items-center justify-center">{i + 1}</span>
                  <span className={`mt-3 mx-auto w-16 h-16 rounded-full flex items-center justify-center ${s.gold ? 'bg-white border border-amber-200' : 'bg-emerald-50'}`}>
                    <s.icon className={`w-7 h-7 ${s.gold ? 'text-amber-600' : 'text-emerald-600'}`} strokeWidth={1.8} />
                  </span>
                  <h3 className={`mt-3 text-[14.5px] font-extrabold ${s.gold ? 'text-amber-700' : ''}`}>{s.title}</h3>
                  <p className="mt-1.5 text-[12px] text-slate-500 break-keep leading-relaxed">{s.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <span className="hidden sm:flex items-center justify-center">
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </span>
                )}
              </Fragment>
            ))}
          </div>
        </div>

        {/* 확인 항목 + 최대 50% */}
        <div className="mt-6 grid lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 p-6 sm:p-7">
            <h2 className="text-[16px] font-extrabold mb-5">무엇을 확인하나요?</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CHECKS.map((c) => (
                <div key={c.label} className="rounded-xl border border-slate-200 px-3 py-4 text-center">
                  <c.icon className="w-6 h-6 text-emerald-600 mx-auto" strokeWidth={1.9} />
                  <p className="mt-2 text-[12.5px] font-bold text-slate-700">{c.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6 sm:p-7 flex items-center gap-5">
            <div className="flex-1">
              <p className="text-[14px] font-bold text-slate-600">기준에 미달하면?</p>
              <p className="mt-1.5 text-[20px] sm:text-[24px] font-black text-slate-900 break-keep">
                차기 후원금 <span className="text-emerald-600 text-[26px] sm:text-[32px]">최대 50%</span> 보정 지원
              </p>
              <p className="mt-2 text-[12.5px] text-slate-500 break-keep">
                사전 합의한 기준과 프로그램 적용조건에 따라 지원범위가 결정됩니다.
              </p>
            </div>
            <span className="hidden sm:flex w-20 h-20 rounded-full bg-emerald-600 items-center justify-center shrink-0 shadow-lg shadow-emerald-500/25">
              <ShieldCheck className="w-10 h-10 text-white" strokeWidth={1.8} />
            </span>
          </div>
        </div>

        {/* 예시 흐름 */}
        <div className="mt-6 rounded-2xl border border-slate-200 px-6 py-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <p className="text-[14.5px] font-extrabold text-slate-800 shrink-0 sm:w-28 break-keep">예시로 보는<br className="hidden sm:block" /> 보정 지원 흐름</p>
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] gap-2.5 items-center">
            {EXAMPLE.map((e, i) => (
              <Fragment key={e.label}>
                <div className={`rounded-xl border px-4 py-3.5 flex items-center gap-3 ${
                  e.gold ? 'border-amber-200 bg-amber-50' : e.warn ? 'border-rose-100 bg-rose-50/40' : 'border-slate-200'
                }`}>
                  <e.icon className={`w-5 h-5 shrink-0 ${e.gold ? 'text-amber-600' : e.warn ? 'text-rose-500' : 'text-emerald-600'}`} />
                  <span>
                    <span className="block text-[10.5px] text-slate-400 font-bold">{e.label}</span>
                    <span className="block text-[13.5px] font-extrabold text-slate-800">{e.value}</span>
                  </span>
                </div>
                {i < EXAMPLE.length - 1 && (
                  <ChevronRight className="hidden sm:block w-4 h-4 text-slate-300 mx-auto" />
                )}
              </Fragment>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to={`/contact?subject=${encodeURIComponent('[성과보장 프로그램] 적용 상담 요청')}`}
            className="h-12 px-7 inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors"
          >
            성과보장 적용 상담하기 <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/faq" className="inline-flex items-center gap-1 text-[13.5px] font-bold text-slate-600 hover:text-slate-900">
            운영기준 자세히 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <p className="mt-5 text-center text-[11.5px] text-slate-400 break-keep">
          성과보장은 추천 PICK 중 성과보장 배지 상품에 적용되며, 매출·순위를 보장하는 프로그램이 아닙니다.
          적용 기준·제외 조건·지원 한도는 계약 시 확정됩니다.
        </p>
      </section>
    </AboutLayout>
  );
}
