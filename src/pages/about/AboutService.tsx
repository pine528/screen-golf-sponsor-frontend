/**
 * 서비스 소개 — 리디자인 시안 (선수·브랜드·팬 연결 다이어그램 + 4 기능 카드 + 3 CTA)
 */
import { Link } from 'react-router-dom';
import {
  BarChart3, CalendarCheck, ChevronRight, Crosshair, ExternalLink,
  Instagram, Sparkles, Trophy, Users,
} from 'lucide-react';
import AboutLayout from './AboutLayout';

const FEATURES_LEFT = [
  {
    icon: Trophy, title: '오프라인 후원슬롯',
    desc: <>대회·경기복 중심의<br /><b>짧고 강한 노출</b></>,
  },
  {
    icon: CalendarCheck, title: '디지털 파트너 구독', badge: 'NEW',
    desc: <>12개월 온라인·팬스토어·<br />등록매장 파트너십</>,
  },
];
const FEATURES_RIGHT = [
  {
    icon: Users, title: '팬 참여 · 팬온도',
    desc: <>추천과 구매가<br />선수의 가치로</>,
  },
  {
    icon: BarChart3, title: '성과 · ROI 리포트',
    desc: <>노출·클릭·QR·구매 확인</>,
  },
];

const CTAS = [
  { icon: Crosshair, title: '직접 PICK', desc: '선수와 후원위치를 직접 선택', to: '/athletes', tone: 'emerald' },
  { icon: Sparkles, title: '스폰픽 추천 PICK', desc: '목표와 예산에 맞는 조합 추천', to: '/ai-match', tone: 'emerald' },
  { icon: CalendarCheck, title: '디지털 파트너 월 구독', desc: '12개월 파트너십으로 지속 노출', to: '/digital-partner', tone: 'indigo' },
];

function Node({ icon: Icon, label, className = '' }: { icon: any; label: string; className?: string }) {
  return (
    <div className={`absolute flex flex-col items-center gap-1.5 ${className}`}>
      <span className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
        <Icon className="w-8 h-8 sm:w-9 sm:h-9 text-emerald-600" strokeWidth={1.8} />
      </span>
      <span className="text-[14px] font-extrabold text-slate-800">{label}</span>
    </div>
  );
}

export default function AboutService() {
  return (
    <AboutLayout current="서비스 소개">
      <section className="max-w-7xl mx-auto px-5 pt-12 pb-16">
        <h1 className="text-center text-[26px] sm:text-4xl font-black tracking-tight break-keep">
          <span className="text-emerald-600">선수</span>의 가능성과{' '}
          <span className="text-emerald-600">브랜드</span>의 성장을 연결합니다
        </h1>
        <p className="mt-4 text-center text-[14px] sm:text-[15px] text-slate-500 leading-relaxed break-keep">
          SPONPIK은 선수·브랜드·팬 데이터를 기반으로<br />
          후원을 선택하고, 실행하고, 성과까지 확인하는 스포츠 후원 플랫폼입니다.
        </p>

        {/* 4 기능 카드 + 중앙 다이어그램 */}
        <div className="mt-12 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)_minmax(0,1fr)] gap-5 items-center">
          <div className="space-y-4 order-2 lg:order-1">
            {FEATURES_LEFT.map((f) => (
              <div key={f.title} className="rounded-2xl border border-slate-200 p-6 flex items-center gap-5">
                <span className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <f.icon className="w-7 h-7 text-emerald-600" strokeWidth={1.9} />
                </span>
                <div>
                  <h3 className="text-[16px] font-extrabold flex items-center gap-1.5">
                    {f.title}
                    {'badge' in f && f.badge && (
                      <span className="px-1.5 py-0.5 rounded-full bg-indigo-500 text-white text-[9px] font-black">{f.badge}</span>
                    )}
                  </h3>
                  <p className="mt-1 text-[13px] text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 다이어그램 */}
          <div className="relative h-[300px] sm:h-[340px] order-1 lg:order-2">
            <span aria-hidden className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 sm:w-64 sm:h-64 rounded-full border-2 border-dashed border-emerald-200" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <img src="/logo-48.png" alt="SPONPIK" className="w-9 h-9 rounded-xl" />
            </span>
            <Node icon={Users} label="선수" className="left-1/2 -translate-x-1/2 top-0" />
            <Node icon={Trophy} label="브랜드" className="left-2 sm:left-8 bottom-2" />
            <Node icon={Users} label="팬" className="right-2 sm:right-8 bottom-2" />
          </div>

          <div className="space-y-4 order-3">
            {FEATURES_RIGHT.map((f) => (
              <div key={f.title} className="rounded-2xl border border-slate-200 p-6 flex items-center gap-5">
                <span className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <f.icon className="w-7 h-7 text-emerald-600" strokeWidth={1.9} />
                </span>
                <div>
                  <h3 className="text-[16px] font-extrabold">{f.title}</h3>
                  <p className="mt-1 text-[13px] text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3 CTA */}
        <div className="mt-10 grid sm:grid-cols-3 gap-4">
          {CTAS.map((c) => (
            <Link
              key={c.title}
              to={c.to}
              className={`group rounded-2xl border p-6 flex items-center gap-4 transition-all hover:-translate-y-0.5 ${
                c.tone === 'indigo'
                  ? 'border-indigo-100 bg-indigo-50/50 hover:border-indigo-300'
                  : 'border-emerald-100 bg-emerald-50/50 hover:border-emerald-300'
              }`}
            >
              <span className={`w-14 h-14 rounded-full bg-white border flex items-center justify-center shrink-0 ${
                c.tone === 'indigo' ? 'border-indigo-100' : 'border-emerald-100'
              }`}>
                <c.icon className={`w-6 h-6 ${c.tone === 'indigo' ? 'text-indigo-500' : 'text-emerald-600'}`} strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-[15.5px] font-extrabold ${c.tone === 'indigo' ? 'text-indigo-900' : 'text-emerald-900'}`}>{c.title}</span>
                <span className="block text-[12.5px] text-slate-500 mt-0.5">{c.desc}</span>
              </span>
              <ChevronRight className={`w-5 h-5 shrink-0 group-hover:translate-x-0.5 transition-transform ${
                c.tone === 'indigo' ? 'text-indigo-400' : 'text-emerald-500'
              }`} />
            </Link>
          ))}
        </div>

        {/* 인스타그램 배너 */}
        <div className="mt-6 rounded-2xl border border-slate-200 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <span className="w-12 h-12 rounded-2xl border-2 border-slate-800 flex items-center justify-center shrink-0">
            <Instagram className="w-6 h-6 text-slate-800" />
          </span>
          <p className="text-[14px] font-semibold text-slate-700 flex-1 break-keep">
            스폰픽의 선수 이야기와 최신 소식은 공식 인스타그램에서 확인하세요.
          </p>
          <a
            href="https://www.instagram.com/sponpik_official/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="스폰픽 공식 인스타그램 (새 창)"
            className="shrink-0 inline-flex flex-col items-center gap-1"
          >
            <span className="h-11 px-5 inline-flex items-center gap-1.5 rounded-xl border border-indigo-300 text-indigo-600 text-sm font-bold hover:bg-indigo-50 transition-colors">
              @sponpik_official 바로가기 <ExternalLink className="w-4 h-4" />
            </span>
            <span className="text-[12.5px] text-slate-500">instagram.com/sponpik_official</span>
          </a>
        </div>
      </section>
    </AboutLayout>
  );
}
