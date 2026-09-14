/**
 * OREX 팬스토어 — 선수 AR 보기 (/fan-store/orex/ar) + AR 이미지 다운로드 (/fan-store/orex/ar/download)
 * 사용자 제공 시안 기준. AR 링크는 시안에 명시된 photoar.elgrim.kr 링크를 쓴다.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Calendar,
  Check,
  Copy,
  Download,
  ExternalLink,
  Gift,
  HelpCircle,
  Image,
  MessageCircle,
  Share2,
  ShieldCheck,
  User,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import Breadcrumb from '../../components/Breadcrumb';
import { OREX_STORE } from '../../data/orexStore';

export default function FanStoreOrexAr() {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const copyLink = async (link: string, i: number) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedIdx(i);
      setTimeout(() => setCopiedIdx(null), 1500);
    } catch {
      /* 링크가 화면에 보이므로 무시 */
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-5 flex items-center gap-3">
        <Breadcrumb className="mb-0 flex-1" />
        <Link
          to={OREX_STORE.path}
          className="shrink-0 hidden sm:inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
        >
          팬스토어 홈
        </Link>
      </div>

      <section className="px-5 sm:px-8 pt-4 pb-6">
        <div className="max-w-7xl mx-auto rounded-2xl border border-slate-200 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <span className="px-4 py-2 rounded-full border border-slate-900 text-slate-900 text-sm font-extrabold">
              {OREX_STORE.athleteName} 프로 × {OREX_STORE.brandName} 팬스토어
            </span>
            <img src={OREX_STORE.brandLogo} alt={OREX_STORE.brandName} className="h-9 object-contain" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,38%)] gap-5 items-stretch">
            {/* 미디어 영역 */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-800 min-h-[340px] flex items-center justify-center">
              <img
                src={OREX_STORE.athletePhoto}
                alt={`${OREX_STORE.athleteName} 프로`}
                className="max-h-[440px] w-auto object-contain"
              />
              <span className="absolute bottom-3 left-4 text-[12px] text-white/70">*AR로 제작된 영상입니다.</span>
            </div>

            {/* 우측 패널 */}
            <div className="rounded-2xl border border-slate-200 p-5">
              <h1 className="text-lg font-extrabold text-slate-900 mb-1">{OREX_STORE.athleteName} 프로 AR 이미지</h1>
              <div className="w-8 h-0.5 bg-emerald-600 mb-4" />

              {OREX_STORE.arLinks.map((link, i) => (
                <div key={link} className="mb-3">
                  <div className="text-[12px] font-bold text-slate-600 mb-1">AR 링크 {i + 1}</div>
                  <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden">
                    <span className="px-3 py-2.5 text-[12px] text-slate-500 truncate flex-1">{link}</span>
                    <button
                      onClick={() => copyLink(link, i)}
                      className="px-3 h-full py-2.5 border-l border-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-50 shrink-0"
                    >
                      {copiedIdx === i ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}

              <a
                href={OREX_STORE.arLinks[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white text-[13px] font-bold hover:bg-emerald-700"
              >
                AR 체험 링크 보기 <ExternalLink className="w-4 h-4" />
              </a>
              <Link
                to={`${OREX_STORE.path}/ar/download`}
                className="mt-2 w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-600 text-emerald-700 text-[13px] font-bold hover:bg-emerald-50"
              >
                이미지 다운로드 <Download className="w-4 h-4" />
              </Link>

              <div className="grid grid-cols-4 gap-2 mt-4">
                <MiniTile icon={User} title="프로필 사진" desc="고화질 프로필 이미지 다운로드" />
                <MiniTile icon={MessageCircle} title="팬 메시지" desc={`${OREX_STORE.athleteName} 프로의 응원 메시지 보기`} />
                <MiniTile icon={Share2} title="SNS 공유" desc="AR 이미지를 공유해보세요" />
                <MiniTile icon={Image} title="테마 배경" desc="다양한 배경으로 AR을 즐겨보세요" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 하단 안내 타일 */}
      <section className="px-5 sm:px-8 pb-16">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-5 gap-3">
          <BottomTile icon={Box} title="브랜드" desc={OREX_STORE.brandName} />
          <BottomTile icon={Calendar} title="선수" desc={`${OREX_STORE.athleteName} 프로`} />
          <BottomTile icon={Gift} title="포인트 적립" desc={`결제 시 ${Math.round(OREX_STORE.earnRate * 100)}% 적립`} />
          <BottomTile icon={Gift} title="팬 전용 혜택" desc="스페셜 굿즈 & 이벤트" />
          <BottomTile icon={ShieldCheck} title="안전한 서비스" desc="공식 파트너 인증" />
        </div>
      </section>
    </div>
  );
}

function MiniTile({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-slate-200 px-2 py-3 text-center">
      <Icon className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
      <div className="text-[12px] font-extrabold text-slate-900 break-keep">{title}</div>
      <div className="text-[9px] text-slate-500 break-keep leading-snug mt-0.5">{desc}</div>
    </div>
  );
}

function BottomTile({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 px-4 py-3.5 flex items-center gap-3">
      <Icon className="w-5 h-5 text-emerald-600 shrink-0" />
      <div className="min-w-0">
        <div className="text-[12px] text-slate-500">{title}</div>
        <div className="text-[13px] font-extrabold text-slate-900 truncate">{desc}</div>
      </div>
    </div>
  );
}

/* ── AR 이미지 다운로드 ─────────────────────────────────────── */

const SIZES = [
  { key: 'square', label: '정사각형', dim: '1080x1080', w: 40, h: 40 },
  { key: 'portrait', label: '세로', dim: '1080x1350', w: 32, h: 40 },
  { key: 'landscape', label: '가로', dim: '1200x675', w: 48, h: 27 },
];

export function FanStoreOrexArDownload() {
  const [sizeIdx, setSizeIdx] = useState(0);

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-5">
        <Breadcrumb className="mb-0" />
      </div>

      <section className="px-5 sm:px-8 pt-4 pb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">AR 이미지 다운로드</h1>
        <p className="text-sm text-slate-500">다양한 사이즈로 다운로드하여 팬 콘텐츠에 활용해보세요.</p>
      </section>

      <section className="px-5 sm:px-8 pb-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {/* 미리보기 */}
          <div className="rounded-2xl border border-slate-200 p-6 flex flex-col items-center">
            <div className="w-full max-w-[340px] rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
              <img src={OREX_STORE.athletePhoto} alt={`${OREX_STORE.athleteName} 프로`} className="w-full object-cover" />
              <div className="px-4 py-3 flex items-center justify-between bg-white">
                <div>
                  <div className="text-[14px] font-black text-slate-900">{OREX_STORE.athleteName} 프로</div>
                  <div className="text-[9px] font-bold tracking-widest text-emerald-600">PROFESSIONAL GOLFER</div>
                </div>
                <img src={OREX_STORE.brandLogo} alt={OREX_STORE.brandName} className="h-6 object-contain" />
              </div>
            </div>
          </div>

          {/* 사이즈 선택 + 안내 */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 p-5">
              <h2 className="text-[15px] font-extrabold text-slate-900 mb-4">다운로드 사이즈 선택</h2>
              <div className="grid grid-cols-3 gap-2.5 mb-4">
                {SIZES.map((s, i) => (
                  <button
                    key={s.key}
                    onClick={() => setSizeIdx(i)}
                    className={`relative rounded-xl border px-3 py-4 flex flex-col items-center gap-2 transition-colors ${
                      sizeIdx === i ? 'border-emerald-600 bg-emerald-50/40' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {sizeIdx === i && (
                      <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                    <span
                      className="border-2 border-dashed border-slate-300 rounded"
                      style={{ width: s.w, height: s.h }}
                    />
                    <div className="text-center leading-tight">
                      <div className="text-[12px] font-bold text-slate-900">{s.label}</div>
                      <div className="text-[12.5px] text-slate-500 tabular-nums">({s.dim})</div>
                    </div>
                  </button>
                ))}
              </div>
              <a
                href={OREX_STORE.athletePhoto}
                download={`${OREX_STORE.athleteName}-프로-AR-${SIZES[sizeIdx].dim}.jpg`}
                className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700"
              >
                <Download className="w-4 h-4" /> 다운로드하기
              </a>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <h2 className="text-[14px] font-extrabold text-slate-900 mb-3">다운로드 이용 안내</h2>
              <div className="space-y-3">
                <GuideRow icon={User} title="팬 콘텐츠 개인 사용" desc="다운로드한 이미지는 팬 콘텐츠 제작 등 개인적인 용도로 자유롭게 사용하실 수 있습니다." />
                <GuideRow icon={Share2} title="SNS 업로드 가능" desc="다운로드한 이미지는 SNS 채널에 업로드가 가능합니다." />
                <GuideRow icon={ShieldCheck} title="2차 가공 제한" desc="이미지의 상업적 이용, 재배포, 변형, 2차 가공은 제한됩니다." />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 sm:px-8 pb-16">
        <div className="max-w-5xl mx-auto rounded-2xl bg-slate-50 border border-slate-100 px-5 py-3.5 flex items-center gap-3">
          <HelpCircle className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="text-[12px] text-slate-500 flex-1">이미지 사용 관련 문의는 고객센터를 이용해주세요.</span>
          <Link to="/contact" className="shrink-0 inline-flex items-center px-3 h-8 rounded-lg border border-slate-200 bg-white text-[12px] font-bold text-slate-600 hover:bg-slate-50">
            고객센터 바로가기
          </Link>
        </div>
      </section>
    </div>
  );
}

function GuideRow({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-emerald-600" />
      </div>
      <div className="min-w-0">
        <div className="text-[12px] font-bold text-slate-900">{title}</div>
        <p className="text-[12px] text-slate-500 break-keep leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
