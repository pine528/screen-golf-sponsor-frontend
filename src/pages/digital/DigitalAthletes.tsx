/**
 * 디지털 파트너 — 모집 중 선수 목록 (핸드오프 v1.0 §5.3, 시안 img_24)
 *
 * 경기복 부착 미포함을 카드마다 표기한다 (UX-02).
 * 비로그인도 가격·잔여 수량을 볼 수 있다 (UX-03).
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, RotateCcw, Search, Shirt, Zap } from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import { api } from '../../services/api';

const PRICE_BANDS = [
  { key: 'B1', label: '월 10만원 미만', test: (p: number) => p < 100_000 },
  { key: 'B2', label: '월 10~20만원', test: (p: number) => p >= 100_000 && p < 200_000 },
  { key: 'B3', label: '월 20만원 이상', test: (p: number) => p >= 200_000 },
];
const TOURS = ['KLPGA', 'KPGA'];

export default function DigitalAthletes() {
  const [data, setData] = useState<any>(null);
  const [q, setQ] = useState('');
  const [band, setBand] = useState<string | null>(null);
  const [tour, setTour] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r: any = await api.getDigitalAthletes({});
        setData(r?.data);
      } finally { setLoading(false); }
    })();
  }, []);

  const athletes = useMemo(() => {
    let list: any[] = data?.athletes || [];
    if (q.trim()) list = list.filter((a) => a.name.includes(q.trim()));
    if (tour) list = list.filter((a) => (a.tour || '').includes(tour));
    if (band) {
      const b = PRICE_BANDS.find((x) => x.key === band)!;
      list = list.filter((a) => a.minMonthlyPrice && b.test(a.minMonthlyPrice));
    }
    return list;
  }, [data, q, band, tour]);

  const reset = () => { setQ(''); setBand(null); setTour(null); };

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-16">
      <PublicHeader />

      {/* 히어로 */}
      <section className="bg-gradient-to-b from-[#f2faf5] to-white px-5 pt-8 pb-7 border-b border-slate-100">
        <div className="max-w-7xl mx-auto">
          <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-[12.5px] mb-4">
            <Link to="/" className="text-slate-500 hover:text-slate-600">홈</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <Link to="/sponsor" className="text-slate-500 hover:text-slate-600">후원하기</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <Link to="/digital-partner" className="text-slate-500 hover:text-slate-600">디지털 파트너</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-bold text-emerald-700">선수 선택</span>
          </nav>
          <h1 className="text-[26px] sm:text-[34px] font-black tracking-tight break-keep">
            월 부담으로 시작하는 디지털 파트너십
          </h1>
          <p className="mt-3 text-[13.5px] sm:text-[14.5px] text-slate-500 break-keep">
            경기복 부착 없이 온라인 채널 · 팬스토어 · 등록매장 홍보물에서 1년간 선수와 함께합니다.
          </p>
        </div>
      </section>

      {/* 필터 */}
      <section className="max-w-7xl mx-auto px-5 pt-6">
        <div className="rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-300" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="선수 이름 검색"
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-[13.5px] focus:outline-none focus:border-emerald-400"
            />
          </div>
          {PRICE_BANDS.map((b) => (
            <button
              key={b.key}
              onClick={() => setBand(band === b.key ? null : b.key)}
              className={`h-10 px-3.5 rounded-xl border text-[12.5px] font-bold transition-colors ${
                band === b.key ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {b.label}
            </button>
          ))}
          {TOURS.map((t) => (
            <button
              key={t}
              onClick={() => setTour(tour === t ? null : t)}
              className={`h-10 px-3.5 rounded-xl border text-[12.5px] font-bold transition-colors ${
                tour === t ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {t}
            </button>
          ))}
          <button onClick={reset} className="h-10 px-3.5 ml-auto inline-flex items-center gap-1.5 rounded-xl text-[12.5px] font-bold text-slate-500 hover:text-slate-800">
            <RotateCcw className="w-3.5 h-3.5" /> 필터 초기화
          </button>
        </div>

        {/* 카드 */}
        {loading ? (
          <div className="py-20 text-center"><div className="w-9 h-9 rounded-full border-4 border-emerald-100 border-t-emerald-500 animate-spin mx-auto" /></div>
        ) : athletes.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 py-16 text-center">
            <p className="text-[14px] font-bold text-slate-600">조건에 맞는 모집 중인 선수가 없습니다</p>
            <button onClick={reset} className="mt-4 h-11 px-5 inline-flex items-center rounded-xl bg-emerald-600 text-white text-sm font-bold">필터 초기화</button>
          </div>
        ) : (
          <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {athletes.map((a) => (
              <article key={a.id} className="rounded-2xl border border-slate-200 overflow-hidden hover:border-emerald-300 hover:shadow-[0_12px_32px_-14px_rgba(15,23,42,0.16)] transition-all">
                <div className="relative aspect-[4/3] bg-slate-100">
                  {a.profileImageUrl && <img src={a.profileImageUrl} alt={a.name} loading="lazy" className="w-full h-full object-cover object-top" />}
                  <span className="absolute top-3 right-3 px-2 py-1 rounded-md bg-slate-900/75 text-white text-[12.5px] font-bold backdrop-blur-sm">
                    경기복 부착 미포함
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-[15px] font-extrabold">
                    {a.name} <span className="ml-1 text-[12px] font-bold text-emerald-600">{a.tour}</span>
                  </p>
                  <p className="mt-0.5 text-[12px] text-slate-500">디지털 파트너 모집</p>

                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-[17px] font-black text-emerald-600">
                      월 {a.minMonthlyPrice ? a.minMonthlyPrice.toLocaleString() : '-'}원
                    </span>
                    <span className="text-[12px] text-slate-500 font-bold">12개월 약정</span>
                  </div>
                  <p className="mt-1.5 text-[12px] text-slate-500">
                    제공 가능 슬롯 <b className="text-slate-800">{a.totalRemaining}/{a.totalCapacity}</b>
                  </p>

                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {['디지털 배지', '팬스토어', '매장 POP'].map((t) => (
                      <span key={t} className="text-[12.5px] text-slate-500">{t}</span>
                    )).reduce((acc: any[], el, i) => i === 0 ? [el] : [...acc, <span key={`d${i}`} className="text-[12.5px] text-slate-300">·</span>, el], [])}
                  </div>

                  <Link
                    to={`/digital-partner/athletes/${a.id}`}
                    className="mt-4 h-11 w-full inline-flex items-center justify-center rounded-xl border border-emerald-600 text-emerald-700 text-[13.5px] font-bold hover:bg-emerald-50 transition-colors"
                  >
                    구독상품 보기
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* 오프라인 전환 유도 */}
        <div className="mt-6 rounded-2xl bg-emerald-50/60 border border-emerald-100 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <span className="w-11 h-11 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </span>
          <div className="flex-1">
            <p className="text-[15px] font-extrabold">강한 단기 노출이 필요하다면?</p>
            <p className="mt-0.5 text-[12.5px] text-slate-500 break-keep">경기복 · 모자 · 장비에 부착되는 오프라인 후원슬롯을 확인해 보세요.</p>
          </div>
          <Link to="/athletes" className="shrink-0 h-11 px-5 inline-flex items-center gap-1.5 rounded-xl border border-emerald-600 bg-white text-emerald-700 text-[13.5px] font-bold hover:bg-emerald-50">
            <Shirt className="w-4 h-4" /> 오프라인 후원슬롯 보기 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
