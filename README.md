# SPONPIK Frontend

SPONPIK 웹 프론트엔드. React 18 + Vite + TypeScript + Tailwind CSS 3.4. 배포는 Vercel.

- 백엔드 API 저장소: https://github.com/pine528/screen-golf-sponsor (Render)
- 기획·상태 문서: 백엔드 저장소 `master` 브랜치 [`docs/`](https://github.com/pine528/screen-golf-sponsor/tree/master/docs)

## 실행

```bash
npm install
cp .env.example .env          # VITE_API_URL=http://localhost:3000/api
npm run dev                   # http://localhost:5173
npm run build                 # dist/ (Vercel이 빌드; dist는 커밋하지 않음)
```

`.env.production`의 `VITE_API_URL`이 운영 API(Render)를 가리킵니다.

## 브랜치

- `redesign` — 2026-08~09 전면 리디자인 작업 브랜치 (Vercel 프리뷰 배포)
- `main` — 리디자인 확정 후 머지 예정

## 구조

```
src/
├── App.tsx                 # 라우트 정의 (공개 · 로그인 · 역할별 · 관리자)
├── pages/
│   ├── sponsor/            # 후원하기 (직접 PICK · 추천 PICK · 후원상품 · 디지털 파트너)
│   ├── athletes/           # 선수 메뉴 (찾기 · 나에게 맞는 선수 · 비교 · 관심)
│   ├── fanhub/             # 팬 참여 (VOTE · 커뮤니티 · 팬온도 · 팬포인트 · 팬스토어)
│   ├── about/              # 스폰픽 소개 (서비스 · 이용방법 · 성과보장 · 브랜드 · 매칭사례)
│   ├── admin/              # 관리자 콘솔
│   └── ...                 # 대시보드 · 계약 · 정산 등 로그인 화면
├── components/             # PublicHeader(메가메뉴) · Layout · ui/StateView · 도메인 컴포넌트
├── services/api.ts         # API 클라이언트 (axios, 모든 엔드포인트 메서드)
└── hooks/useAuth.ts        # zustand 인증 스토어
```

## 규칙

- 표시 수치는 서버가 준 값만 쓴다. 미측정은 "집계 중"/"확인 필요"로 표기하고 추정치를 만들지 않는다.
- `font-script`(Great Vibes)는 한글 글리프가 없으므로 영문 장식에만 사용한다.
- 반응형 그리드는 `grid-cols-1`을 기본으로 두고 `lg:grid-cols-[...]`를 얹는다 (모바일 폭 넘침 방지).
- 구 화면은 `*-legacy` 라우트로 남겨 두었고 신규 라우트가 기본이다 (`docs/REDESIGN_BACKLOG.md` 참고).
