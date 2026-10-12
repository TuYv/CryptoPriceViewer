# 🚀 암호화폐 가격 뷰어

> 실시간 암호화폐 가격 모니터링, 다국어 지원, 아름다운 UI 디자인을 갖춘 현대적인 Chrome 확장 프로그램.

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Available-brightgreen)](https://chrome.google.com/webstore)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-0.1.3-blue.svg)](https://github.com/TuYv/CryptoPriceViewer)

## 🌍 다국어 문서

- 🇺🇸 **[English](./README.md)**
- 🇨🇳 **[中文](./README-zh.md)**
- 🇯🇵 **[日本語](./README-ja.md)**
- 🇰🇷 **한국어** (현재)

## 📖 개요

암호화폐 가격 뷰어는 현대적이고 사용자 친화적인 인터페이스로 실시간 암호화폐 가격 모니터링을 제공하는 포괄적인 Chrome 확장 프로그램입니다. 좋아하는 암호화폐를 추적하고, 즉시 가격 업데이트를 받고, 관심 목록을 쉽게 관리하세요.

## ✨ 기능

### 🔥 핵심 기능
- **실시간 가격 모니터링**: 자동 업데이트되는 실시간 암호화폐 가격
- **스마트 검색**: 자동완성 제안이 있는 지능형 암호화폐 검색
- **동적 코인 관리**: 모든 암호화폐를 동적으로 추가/제거
- **다중 통화 지원**: USD, CNY, EUR 중 하나로 가격 표시
- **가격 추세 지표**: 가격 변동의 시각적 지표
- **시장 데이터**: 포괄적인 시가총액, 거래량, 24시간 변동 데이터

### 🌍 국제화
- **4개 언어 지원**: 
  - 🇨🇳 중국어 (简体中文)
  - 🇺🇸 영어
  - 🇯🇵 일본어 (日本語)
  - 🇰🇷 한국어
- **즉시 언어 전환**: 페이지 새로고침 없이 언어 변경
- **지속적인 설정**: 세션 간 언어 선택 기억

### 🎨 현대적 UI/UX
- **글래스모피즘 디자인**: 현대적이고 반투명한 인터페이스
- **반응형 레이아웃**: 다양한 화면 크기에 적응
- **부드러운 애니메이션**: CSS 전환 및 호버 효과
- **직관적인 내비게이션**: 명확한 섹션이 있는 탭 기반 인터페이스

### ⚙️ 고급 설정
- **사용자 정의 새로고침 간격**: 선호하는 업데이트 빈도 설정
- **로컬 저장소**: 개인정보 보호를 위해 모든 데이터를 로컬에 저장

### 💬 사용자 피드백 시스템
- **GitHub 피드백**: 피드백 버튼을 누르면 프로젝트의 GitHub Issues 페이지가 열립니다
- **기부 지원**: BNB 및 SOL 기부 QR 코드

## 🛠️ 기술 스택

- **프론트엔드**: HTML5, CSS3, 바닐라 JavaScript (ES6+)
- **API**: 암호화폐 데이터용 CoinGecko API
- **저장소**: Chrome 확장 저장소 API
- **아키텍처**: 모듈식 ES6 클래스
- **스타일링**: Flexbox 및 Grid를 사용한 현대적 CSS
- **국제화**: 사용자 정의 i18n 구현

## 📁 프로젝트 구조

```
CryptoPriceViewer/
├── manifest.json          # 확장 프로그램 구성
├── popup.html             # 메인 화면
├── privacy-policy.html    # Chrome Web Store용 개인정보 보호정책
├── css/
│   └── style.css          # 스타일
├── js/
│   ├── popup.js           # 팝업 메인 로직
│   ├── background.js      # Service Worker: 아이콘에 고정한 코인의 배지 가격 새로고침
│   ├── badge-updater.js   # 배지 텍스트와 색상
│   ├── config.js          # 상수 및 기본 설정
│   ├── i18n.js            # 번역 (zh / en / ja / ko)
│   ├── lib/
│   │   ├── chart.js       # Canvas 가격 차트
│   │   ├── storage.js     # chrome.storage / localStorage 래퍼
│   │   └── deep-storage.js # 경로로 중첩된 값 읽기/쓰기
│   ├── services/
│   │   ├── CoinDetailService.js # 코인 상세 정보와 가격 기록 (캐시 포함)
│   │   └── StorageService.js    # API 요청 제한 상태
│   └── clients/
│       └── CoinGeckoClient.js   # CoinGecko API 클라이언트
└── images/                # 아이콘 및 기부용 QR 코드
```

## 🚀 설치

### Chrome Web Store에서 설치 (권장)
1. [Chrome Web Store 페이지](https://chrome.google.com/webstore) 방문 (곧 출시)
2. "Chrome에 추가" 클릭
3. 설치 확인

### 수동 설치 (개발자 모드)
1. 이 저장소 복제:
   ```bash
   git clone https://github.com/TuYv/CryptoPriceViewer.git
   ```
2. Chrome을 열고 `chrome://extensions/`로 이동
3. 오른쪽 상단에서 "개발자 모드" 활성화
4. "압축해제된 확장 프로그램 로드"를 클릭하고 프로젝트 폴더 선택
5. 확장 프로그램이 Chrome 도구 모음에 나타납니다

## 📱 사용법

### 시작하기
1. **확장 프로그램 아이콘 클릭** Chrome 도구 모음에서
2. **암호화폐 검색** 검색 바 사용
3. **코인 추가** "+" 버튼을 클릭하여 관심 목록에 추가
4. **가격 모니터링** 자동 업데이트로 실시간 가격 확인

### 주요 기능
- **검색**: 암호화폐 이름 또는 기호 입력
- **추가/제거**: 관심 목록을 쉽게 관리
- **설정**: 언어, 통화, 새로고침 빈도 사용자 정의
- **피드백**: 생각과 제안 공유

## 🔧 구성

### API 구성
확장 프로그램은 암호화폐 데이터에 CoinGecko API를 사용합니다. 기본 사용에는 API 키가 필요하지 않습니다.

### 사용자 정의
- **언어**: 지원되는 4개 언어 중 선택
- **통화**: 선호하는 법정 통화 선택
- **새로고침 빈도**: 업데이트 간격 설정 (끄기, 30초, 1분, 5분, 10분)

## 🤝 기여

기여를 환영합니다! 다음 단계를 따라주세요:

1. **저장소 포크**
2. **기능 브랜치 생성**: `git checkout -b feature/amazing-feature`
3. **변경사항 커밋**: `git commit -m 'Add amazing feature'`
4. **브랜치에 푸시**: `git push origin feature/amazing-feature`
5. **풀 리퀘스트 열기**

### 개발 환경 설정
```bash
# 저장소 복제
git clone https://github.com/TuYv/CryptoPriceViewer.git

# 프로젝트 디렉토리로 이동
cd CryptoPriceViewer

# 개발 서버 시작 (선택사항)
python3 -m http.server 8080
```

### 코드 스타일
- ES6+ 기능 사용
- 모듈식 아키텍처 따르기
- 복잡한 로직에 주석 추가
- 일관된 들여쓰기 유지
- 다양한 브라우저에서 테스트

## 🐛 버그 리포트 및 기능 요청

- **버그 리포트**: [GitHub Issues](https://github.com/TuYv/CryptoPriceViewer/issues)에 등록해주세요
- **기능 요청**: 마찬가지로 GitHub Issues에 등록해주세요
- **보안 문제**: GitHub Issues에 등록해주세요 (비밀 키나 개인 정보는 적지 마세요)

## 📄 개인정보 보호정책

귀하의 개인정보를 진지하게 생각합니다. 데이터 처리 방법을 이해하려면 전체 [개인정보 보호정책](./privacy-policy.html)을 읽어보세요.

**주요 사항**:
- ✅ 모든 데이터는 브라우저에 로컬로 저장
- ✅ 개인 정보 수집 안 함
- ✅ 추적 또는 분석 없음
- ✅ 네트워크 요청은 CoinGecko 시세 데이터 요청뿐입니다

## 📜 라이선스

이 프로젝트는 MIT 라이선스 하에 라이선스됩니다 - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🙏 감사의 말

- **CoinGecko**: 우수한 암호화폐 API 제공
- **Chrome 확장 팀**: 강력한 확장 플랫폼 제공
- **오픈 소스 커뮤니티**: 영감과 모범 사례 제공
- **기여자**: 이 프로젝트 개선을 도와주는 모든 분들께 감사

## 📊 로드맵

### 버전 1.1 (곧 출시)
- [ ] 손익 계산이 포함된 포트폴리오 추적
- [ ] 가격 알림 및 알림
- [ ] 과거 가격 차트
- [ ] 고급 필터링 옵션

### 버전 1.2 (미래)
- [ ] 뉴스 통합
- [ ] DeFi 프로토콜 지원
- [ ] NFT 플로어 가격 추적
- [ ] 소셜 기능 및 관심 목록 공유

### 버전 2.0 (장기)
- [ ] 모바일 앱 컴패니언
- [ ] 고급 분석 대시보드
- [ ] 타사 통합 API
- [ ] 프리미엄 기능

## 📞 지원

- **확장 프로그램 피드백**: 확장 프로그램의 피드백 버튼으로 GitHub Issues를 엽니다
- **GitHub 이슈**: 버그나 기능에 대한 이슈 생성

## 🌟 지원 보여주기

이 프로젝트가 도움이 된다면 다음을 고려해 주세요:
- ⭐ 이 저장소에 별표 주기
- 🐛 버그 신고
- 💡 새로운 기능 제안
- 🤝 코드 기여
- 💰 개발 지원 (확장 프로그램 내 기부 QR 코드)

---

<div align="center">
  <p>암호화폐 커뮤니티를 위해 ❤️로 제작</p>
  <p>© 2024 암호화폐 가격 뷰어. 모든 권리 보유.</p>
</div>