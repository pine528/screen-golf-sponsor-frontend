/**
 * 호이베이커리 팬스토어 — 선수 AR 보기 (/fan-store/hoi-bakery/ar)
 *                     + AR 이미지 다운로드 (/fan-store/hoi-bakery/ar/download)
 * 사용자 제공 시안 기준. AR 링크는 시안 표기 URL을 그대로 쓰고,
 * 다운로드는 실제 생성해 둔 이미지 3종(정사각/세로/가로)을 내려받는다.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
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
  UserRound,
} from 'lucide-react';
import PublicHeader from '../../components/PublicHeader';
import Breadcrumb from '../../components/Breadcrumb';
import { HOI_STORE } from '../../data/hoiStore';

export default function FanStoreHoiAr() {
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
        <img src={HOI_STORE.brandLogo} alt={HOI_STORE.brandName} className="h-8 object-contain hidden sm:block" />
      </div>

      <section className="px-5 sm:px-8 pt-4 pb-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,36%)] gap-5 items-stretch">
          {/* 미디어 영역 */}
          <div className="relative rounded-2xl overflow-hidden bg-amber-50/60 min-h-[380px] flex items-center justify-center">
            <img
              src={HOI_STORE.athletePhoto}
              alt={`${HOI_STORE.athleteName} 프로`}
              className="max-h-[520px] w-auto object-contain"
            />
            <span className="absolute bottom-3 left-4 text-[11px] text-slate-400">*AR로 제작된 이미지입니다.</span>
            <a
              href={HOI_STORE.arPack[0].file}
              download={`${HOI_STORE.athleteName}-프로-AR.jpg`}
              className="absolute bottom-4 inline-flex items-center gap-3"
              title="이미지 저장"
            >
              <span className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-slate-600">📷</span>
              <span className="w-11 h-11 rounded-full bg-rose-500 shadow-md flex items-center justify-center text-white text-lg">●</span>
            </a>
          </div>

          {/* 우측 패널 */}
          <div className="rounded-2xl border border-slate-200 p-5">
            <h1 className="text-lg font-extrabold text-slate-900 mb-4">{HOI_STORE.athleteName} 프로 AR 이미지</h1>

            {HOI_STORE.arLinks.map((link, i) => (
              <div key={link} className="mb-3">
                <div className="text-[12px] font-bold text-slate-600 mb-1">AR 링크 {i + 1}</div>
                <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden">
                  <span className="px-3 py-2.5 text-[12px] text-slate-500 truncate flex-1">{link}</span>
                  <button
                    onClick={() => copyLink(link, i)}
                    className="px-3 py-2.5 border-l border-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-50 shrink-0"
                  >
                    {copiedIdx === i ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}

            <a
              href={HOI_STORE.arLinks[0]}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 text-white text-[13px] font-bold hover:bg-emerald-800"
            >
              AR 체험 링크 보기 <ExternalLink className="w-4 h-4" />
            </a>
            <Link
              to={`${HOI_STORE.path}/ar/download`}
              className="mt-2 w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-700 text-emerald-800 text-[13px] font-bold hover:bg-emerald-50"
            >
              이미지 다운로드 <Download className="w-4 h-4" />
            </Link>

            <div className="grid grid-cols-4 gap-2 mt-4">
              <MiniTile icon={User} title="프로필 사진" />
              <MiniTile icon={MessageCircle} title="팬 메시지" />
              <MiniTile icon={Share2} title="SNS 공유" />
              <MiniTile icon={Image} title="테마 배경" />
            </div>
          </div>
        </div>
      </section>

      {/* 하단 안내 타일 */}
      <section className="px-5 sm:px-8 pb-16">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-5 gap-3">
          <BottomTile icon={Box} title="브랜드" desc={HOI_STORE.brandName} />
          <BottomTile icon={UserRound} title="선수" desc={`${HOI_STORE.athleteName} 프로`} />
          <BottomTile icon={Gift} title="포인트 적립" desc={`결제 시 ${Math.round(HOI_STORE.earnRate * 100)}% 적립`} />
          <BottomTile icon={Gift} title="팬 전용 혜택" desc="다양한 팬 혜택 제공" />
          <BottomTile icon={ShieldCheck} title="안전한 서비스" desc="안심하고 이용하세요" />
        </div>
      </section>
    </div>
  );
}

function MiniTile({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="rounded-xl border border-slate-200 px-2 py-3.5 text-center">
      <Icon className="w-5 h-5 text-emerald-700 mx-auto mb-1.5" />
      <div className="text-[11px] font-bold text-slate-700 break-keep">{title}</div>
    </div>
  );
}

function BottomTile({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 px-4 py-3.5 flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-emerald-700" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] text-slate-400">{title}</div>
        <div className="text-[13px] font-extrabold text-slate-900 truncate">{desc}</div>
      </div>
    </div>
  );
}

/* ── AR 이미지 다운로드 ─────────────────────────────────────── */

export function FanStoreHoiArDownload() {
  const [sizeIdx, setSizeIdx] = useState(0);
  const selected = HOI_STORE.arPack[sizeIdx];

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-5">
        <Breadcrumb className="mb-0" />
      </div>

      <section className="px-5 sm:px-8 pt-4 pb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">AR 이미지 다운로드</h1>
        <p className="text-sm text-slate-500">팬 콘텐츠 제작을 위해 다양한 사이즈의 AR 이미지를 다운로드할 수 있습니다.</p>
      </section>

      <section className="px-5 sm:px-8 pb-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,52%)_minmax(0,1fr)] gap-5 items-start">
          {/* 미리보기 + 썸네일 */}
          <div className="rounded-2xl border border-slate-200 p-5">
            <div className="rounded-2xl overflow-hidden border border-slate-100 mb-4 bg-amber-50/50">
              <img src={selected.file} alt={`${selected.label} 미리보기`} className="w-full object-contain max-h-[420px]" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {HOI_STORE.arPack.map((a, i) => (
                <button
                  key={a.key}
                  onClick={() => setSizeIdx(i)}
                  className={`relative rounded-xl overflow-hidden border-2 transition-colors ${
                    sizeIdx === i ? 'border-emerald-600' : 'border-transparent hover:border-slate-200'
                  }`}
                >
                  {sizeIdx === i && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center z-10">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                  <img src={a.file} alt={a.label} className="w-full aspect-[4/3] object-cover object-top" />
                  <div className="px-1 py-1.5 text-[10px] font-bold text-slate-600 bg-white">
                    {a.label} ({a.dim})
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 사이즈 선택 + 안내 */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 p-5">
              <h2 className="text-[15px] font-extrabold text-slate-900 mb-4">다운로드 사이즈 선택</h2>
              <div className="grid grid-cols-3 gap-2.5 mb-4">
                {HOI_STORE.arPack.map((a, i) => (
                  <button
                    key={a.key}
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
                      className="border-2 border-dashed border-emerald-300 rounded"
                      style={{
                        width: a.key === 'landscape' ? 44 : a.key === 'portrait' ? 30 : 36,
                        height: a.key === 'landscape' ? 25 : a.key === 'portrait' ? 38 : 36,
                      }}
                    />
                    <div className="text-center leading-tight">
                      <div className="text-[12px] font-bold text-slate-900">{a.label}</div>
                      <div className="text-[10px] text-slate-400 tabular-nums">{a.dim}</div>
                    </div>
                  </button>
                ))}
              </div>
              <a
                href={selected.file}
                download={`${HOI_STORE.athleteName}-프로-AR-${selected.dim}.jpg`}
                className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 text-white text-sm font-bold hover:bg-emerald-800"
              >
                <Download className="w-4 h-4" /> 다운로드하기
              </a>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <h2 className="text-[14px] font-extrabold text-slate-900 mb-3">다운로드 이용 안내</h2>
              <div className="space-y-3">
                <GuideRow icon={User} title="팬 콘텐츠 개인 사용" desc="다운로드한 이미지는 팬 콘텐츠 제작 등 개인적인 용도로 자유롭게 사용 가능합니다." />
                <GuideRow icon={Share2} title="SNS 업로드 가능" desc="다운로드한 이미지는 SNS, 커뮤니티 등 온라인 업로드가 가능합니다." />
                <GuideRow icon={ShieldCheck} title="2차 가공 제한" desc="이미지의 무단 수정, 합성, 상업적 이용 및 재배포는 제한됩니다." />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 sm:px-8 pb-16">
        <div className="max-w-5xl mx-auto rounded-2xl bg-slate-50 border border-slate-100 px-5 py-3.5 flex items-center gap-3">
          <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-[12px] text-slate-500 flex-1">이미지 사용 관련 문의는 고객센터를 이용해주세요.</span>
          <Link to="/contact" className="shrink-0 inline-flex items-center px-3 h-8 rounded-lg border border-slate-200 bg-white text-[12px] font-bold text-slate-600 hover:bg-slate-50">
            고객센터 바로가기 ›
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
        <Icon className="w-4 h-4 text-emerald-700" />
      </div>
      <div className="min-w-0">
        <div className="text-[12px] font-bold text-slate-900">{title}</div>
        <p className="text-[11px] text-slate-500 break-keep leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
