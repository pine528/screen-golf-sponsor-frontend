/**
 * 함께하는 브랜드 — 리디자인 시안 (유형 3카드 + 업종 필터 + 로고 그리드 + 협업 스토리)
 * 시안의 가상 브랜드 대신 실제 협업 브랜드 로고·실측 협업 스토리를 사용한다 (LEG-06).
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Shirt, Smartphone, Store, Trophy } from 'lucide-react';
import AboutLayout from './AboutLayout';

const TYPES = [
  { icon: Shirt, title: '후원슬롯', desc: '경기 착장과 노출' },
  { icon: Smartphone, title: '콘텐츠 협업', desc: 'SNS · 방문 · 제품 체험' },
  { icon: Store, title: '팬스토어', desc: '팬 구매와 성장 연결' },
];

const CATEGORIES = ['전체', '건강 · 뷰티', '골프 · 스포츠', '식품 · 라이프'] as const;

const BRANDS: { src: string; name: string; cat: (typeof CATEGORIES)[number] }[] = [
  { src: '/brands/orex.png', name: 'OREX', cat: '골프 · 스포츠' },
  { src: '/brands/fau.png', name: 'FAU', cat: '골프 · 스포츠' },
  { src: '/brands/elensilia.png', name: 'ELENSILIA', cat: '건강 · 뷰티' },
  { src: '/brands/nature-republic.png', name: 'NATURE REPUBLIC', cat: '건강 · 뷰티' },
  { src: '/brands/kilogram-studio.png', name: 'Kilogram studio', cat: '골프 · 스포츠' },
  { src: '/brands/brrr-studio.png', name: 'Brrr. studio', cat: '식품 · 라이프' },
  { src: '/brands/nlt1.png', name: 'NLT1 COMPANY', cat: '식품 · 라이프' },
  { src: '/brands/ahnguk-health.png', name: '안국건강', cat: '건강 · 뷰티' },
];

export default function AboutBrands() {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>('전체');
  const filtered = BRANDS.filter((b) => cat === '전체' || b.cat === cat);

  return (
    <AboutLayout current="함께하는 브랜드">
      <section className="max-w-7xl mx-auto px-5 pt-12 pb-16">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,540px)] gap-8 items-center">
          <div>
            <h1 className="text-[26px] sm:text-4xl font-black tracking-tight leading-snug break-keep">
              스폰픽과 함께<br />선수의 가능성을 키우는 브랜드
            </h1>
            <p className="mt-4 text-[14px] sm:text-[15px] text-slate-500 break-keep">
              규모와 업종에 관계없이 각자의 방식으로 선수와 성장하고 있습니다.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {TYPES.map((t) => (
              <div key={t.title} className="rounded-2xl border border-slate-200 px-4 py-6 text-center">
                <span className="mx-auto w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center">
                  <t.icon className="w-6 h-6 text-white" strokeWidth={1.9} />
                </span>
                <h3 className="mt-3 text-[14.5px] font-extrabold">{t.title}</h3>
                <p className="mt-1 text-[11.5px] text-slate-500 break-keep">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] gap-5 items-start">
          {/* 좌: 필터 + 로고 그리드 */}
          <div className="rounded-2xl border border-slate-200 p-6">
            <div className="flex flex-wrap gap-2 mb-5">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-bold border transition-colors ${
                    cat === c
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {filtered.map((b) => (
                <div key={b.name} className="flex flex-col items-center justify-center h-24 bg-white rounded-2xl border border-slate-200 px-3 hover:border-emerald-200 hover:shadow-md transition-all">
                  <img src={b.src} alt={b.name} title={b.name} className="max-h-11 max-w-full object-contain" loading="lazy" />
                  <span className="mt-1.5 text-[10.5px] text-slate-400 font-semibold truncate max-w-full">{b.name}</span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-[12px] text-slate-400">
              다양한 브랜드들이 스폰픽을 통해 선수와 팬을 연결하고 함께 성장하고 있습니다.
            </p>
          </div>

          {/* 우: 협업 스토리 (실측 사례) */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="relative">
              <img src="/golfers/bae-jinri.png" alt="배진리 프로" className="w-full h-44 object-cover object-top" />
              <span className="absolute top-4 left-4 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-700 text-[11px] font-black">협업 스토리</span>
            </div>
            <div className="p-6">
              <h2 className="text-[20px] font-black">엘렌실라 × 배진리</h2>
              <p className="mt-2 text-[13px] text-slate-500 leading-relaxed break-keep">
                바이저 후원으로 대회·중계 노출과 팬스토어 협업까지,
                선수와 팬의 일상을 함께 응원합니다.
              </p>
              <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 flex items-center justify-center gap-3">
                <img src="/brands/elensilia.png" alt="ELENSILIA" className="h-6 object-contain" />
                <span className="text-slate-300">×</span>
                <span className="text-[13.5px] font-extrabold text-slate-800">배진리 <span className="text-[11px] font-bold text-slate-400">프로 골퍼</span></span>
              </div>
              <p className="mt-4 text-[11.5px] font-black tracking-wide text-emerald-700">주요 협업 성과</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  { icon: Shirt, t: '착장', d: '경기 착용 및 노출' },
                  { icon: Smartphone, t: '방송 노출', d: 'WGTOUR 중계 확인' },
                  { icon: Store, t: '팬스토어', d: '한정 굿즈 협업' },
                ].map((s) => (
                  <div key={s.t} className="rounded-xl border border-slate-100 px-2 py-3 text-center">
                    <s.icon className="w-[18px] h-[18px] text-emerald-600 mx-auto" />
                    <p className="mt-1.5 text-[11.5px] font-extrabold text-slate-800">{s.t}</p>
                    <p className="text-[10px] text-slate-400 break-keep">{s.d}</p>
                  </div>
                ))}
              </div>
              <Link
                to="/about/cases"
                className="mt-5 h-11 w-full inline-flex items-center justify-center gap-1 rounded-xl border border-emerald-600 text-emerald-700 text-[13.5px] font-bold hover:bg-emerald-50 transition-colors"
              >
                협업사례 보기 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* 하단 CTA */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/60 px-6 sm:px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <span className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6 text-white" strokeWidth={1.9} />
          </span>
          <div className="flex-1">
            <h3 className="text-[16.5px] font-extrabold break-keep">우리 브랜드도 선수와 함께 성장할 수 있을까요?</h3>
            <p className="mt-1 text-[13px] text-slate-500 break-keep">스폰픽이 브랜드에 가장 적합한 선수와 협업 방식을 추천해 드립니다.</p>
          </div>
          <div className="flex gap-2.5 shrink-0">
            <Link to="/ai-match" className="h-11 px-5 inline-flex items-center rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors">
              스폰픽 추천받기
            </Link>
            <Link to={`/contact?subject=${encodeURIComponent('[제휴 문의] 브랜드 협업 상담')}`} className="h-11 px-5 inline-flex items-center rounded-xl border border-slate-300 text-slate-700 text-sm font-bold hover:bg-white transition-colors">
              제휴 문의
            </Link>
          </div>
        </div>
      </section>
    </AboutLayout>
  );
}
