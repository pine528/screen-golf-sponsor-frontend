/**
 * 이용방법 — 리디자인 시안 (3방식 카드 → 4단계 플로우 → 역할별 안내)
 */
import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Building2, CalendarCheck, ChevronRight, FileCheck, HelpCircle,
  MousePointerClick, Star, TrendingUp, User, UserRound, Users,
} from 'lucide-react';
import AboutLayout from './AboutLayout';

const MODES = [
  {
    icon: MousePointerClick, title: '직접 PICK', desc: '경기복·후원슬롯 직접 선택',
    chips: ['자유로운 구성'], to: '/athletes/search',
  },
  {
    icon: Star, title: '추천 PICK', desc: '목표·예산 기반 조합',
    chips: ['전문가 추천'], to: '/ai-match',
  },
  {
    icon: CalendarCheck, title: '디지털 파트너 월 구독', badge: 'NEW', desc: '12개월 온라인·등록매장 활용',
    chips: ['월 구독형', '온라인 확산'], note: '경기복 부착 미포함', to: '/digital-partner',
  },
];

const STEPS = [
  { icon: MousePointerClick, title: '방식 선택', desc: '직접 PICK · 추천 PICK · 월 구독' },
  { icon: UserRound, title: '선수 · 상품 구성', desc: '선수 · 슬롯 · 기간 · 활동 선택' },
  { icon: FileCheck, title: '계약 · 선수 승인', desc: '표준계약 · 전자확인 · 선수 승인' },
  { icon: TrendingUp, title: '실행 · 성과 확인', desc: '노출집행 · 성과 분석 · ROI 리포트' },
];

const ROLES = [
  { icon: Building2, title: '브랜드 · 광고주', desc: '우리 브랜드에 맞는 후원을 시작하세요.', link: '브랜드 이용안내', to: '/athletes/search' },
  { icon: User, title: '선수 · 매니지먼트', desc: '나에게 맞는 후원을 구성해보세요.', link: '선수 이용안내', to: '/register' },
  { icon: Users, title: '팬', desc: '좋아하는 선수를 응원하고 참여하세요.', link: '팬 참여 안내', to: '/votes' },
];

export default function AboutHow() {
  return (
    <AboutLayout current="이용방법">
      <section className="max-w-7xl mx-auto px-5 pt-12 pb-16">
        <h1 className="text-center text-[26px] sm:text-4xl font-black tracking-tight break-keep">
          원하는 후원방식부터 선택하세요
        </h1>
        <p className="mt-4 text-center text-[14px] sm:text-[15px] text-slate-500 break-keep">
          오프라인 노출, 추천 조합, 월 구독 중 목적에 맞는 방식으로 시작할 수 있습니다.
        </p>

        {/* 3방식 카드 */}
        <div className="mt-10 grid sm:grid-cols-3 gap-4">
          {MODES.map((m) => (
            <Link key={m.title} to={m.to} className="rounded-2xl border border-slate-200 p-6 hover:border-emerald-300 hover:shadow-[0_12px_32px_-14px_rgba(15,23,42,0.15)] transition-all">
              <div className="flex items-start gap-4">
                <span className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <m.icon className="w-6 h-6 text-emerald-600" strokeWidth={1.9} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[16px] font-extrabold flex items-center gap-1.5 whitespace-nowrap">
                    {m.title}
                    {'badge' in m && m.badge && (
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-white text-[9px] font-black">{m.badge}</span>
                    )}
                  </h3>
                  <p className="mt-1 text-[13px] text-slate-500">{m.desc}</p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {m.chips.map((c) => (
                      <span key={c} className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[12px] font-bold">{c}</span>
                    ))}
                  </div>
                  {'note' in m && m.note && <p className="mt-2.5 text-[12.5px] text-slate-500">{m.note}</p>}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 4단계 플로우 */}
        <div className="mt-10 grid sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] gap-3 items-stretch">
          {STEPS.map((s, i) => (
            <Fragment key={s.title}>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
                <span className="inline-flex w-7 h-7 rounded-full bg-emerald-600 text-white text-[13px] font-black items-center justify-center">{i + 1}</span>
                <s.icon className="w-9 h-9 text-emerald-600 mx-auto mt-3" strokeWidth={1.7} />
                <h3 className="mt-3 text-[15px] font-extrabold">{s.title}</h3>
                <p className="mt-1.5 text-[12px] text-slate-500 break-keep">{s.desc}</p>
              </div>
              {i < STEPS.length - 1 && (
                <span className="hidden sm:flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-emerald-400" />
                </span>
              )}
            </Fragment>
          ))}
        </div>

        {/* 역할별 안내 + 추천 PICK 유도 */}
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ROLES.map((r) => (
            <div key={r.title} className="rounded-2xl border border-slate-200 p-6">
              <span className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <r.icon className="w-[22px] h-[22px] text-emerald-600" strokeWidth={1.9} />
              </span>
              <h3 className="mt-4 text-[15.5px] font-extrabold">{r.title}</h3>
              <p className="mt-1.5 text-[13px] text-slate-500 break-keep">{r.desc}</p>
              <Link to={r.to} className="mt-4 inline-flex items-center gap-1 text-[13px] font-bold text-emerald-600 hover:text-emerald-700">
                {r.link} <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 flex flex-col">
            <span className="w-12 h-12 rounded-full bg-white border border-emerald-100 flex items-center justify-center">
              <HelpCircle className="w-[22px] h-[22px] text-emerald-600" strokeWidth={1.9} />
            </span>
            <h3 className="mt-4 text-[15.5px] font-extrabold text-emerald-900">어디서 시작할지 모르겠다면?</h3>
            <p className="mt-1.5 text-[13px] text-slate-600 break-keep flex-1">
              선택이 고민될 때 추천 PICK으로 빠르고 쉽게 시작할 수 있어요.
            </p>
            <Link
              to="/ai-match"
              className="mt-4 h-11 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-white text-[13.5px] font-bold hover:bg-emerald-700 transition-colors"
            >
              스폰픽 추천 PICK 시작하기 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </AboutLayout>
  );
}
