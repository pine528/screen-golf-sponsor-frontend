/**
 * 전역 "위로 가기" 버튼
 *
 * 스크롤을 내려 상단 경로 표시(브레드크럼)가 화면에서 사라지면 우측 하단에 나타난다.
 * 브레드크럼이 없는 화면에서는 한 화면 이상 내려갔을 때를 기준으로 삼는다.
 */
import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const check = () => {
      const crumb = document.querySelector('nav[aria-label="현재 위치"]');
      if (crumb) {
        // 경로 표시가 위로 지나갔는지
        setShow(crumb.getBoundingClientRect().bottom < 0);
      } else {
        setShow(window.scrollY > window.innerHeight * 0.8);
      }
    };
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, []);

  const toTop = () =>
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label="맨 위로 이동"
      title="맨 위로"
      /* 우측 하단 스택: (모바일) 탭 바 → 요약 바 → 카카오 문의(bottom-32) → 이 버튼.
         데스크톱은 카카오 문의(bottom-5) 위 bottom-24. */
      className={`fixed right-4 bottom-48 lg:right-5 lg:bottom-24 z-40 inline-flex flex-col items-center justify-center gap-0.5
        w-12 h-12 rounded-full bg-white/95 backdrop-blur border border-slate-200 shadow-lg
        text-slate-600 hover:text-slate-900 hover:border-slate-400 transition-all duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400
        ${show ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}`}
    >
      <ArrowUp className="w-4 h-4" />
      <span className="text-[9px] font-bold leading-none">위로</span>
    </button>
  );
}
