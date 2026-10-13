# Crypto Price Viewer

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/TuYv/CryptoPriceViewer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

[English](./README.md) · [中文](./README-zh.md) · [日本語](./README-ja.md) · **한국어**

툴바 아이콘을 누르면 관심 코인의 시세를 바로 보여 주는 Chrome 확장 프로그램입니다. 코인 하나를 툴바 아이콘에 고정하면 열지 않아도 가격을 볼 수 있습니다. 암호화폐 뉴스 타임라인도 함께 제공합니다.

![시세](./store-assets/screenshots/en/1-market.png)

## 기능

**시세**
- 코인마다 고유 브랜드 색상의 타일로 표시하고, 아래에 최근 7일 추이를 그립니다
- 툴바에 고정한 코인은 한 줄 전체를 차지합니다
- 제목 옆 버튼으로 타일 보기와 목록 보기를 바꿀 수 있습니다. 목록에서는 한 줄에 코인 하나씩 보여 주고, 고정한 코인이 맨 앞에 옵니다
- 타일을 끌어서 순서를 바꿀 수 있습니다. 타일의 “⋯” 메뉴에서 고정, 자세히 보기, 맨 앞으로 이동, 삭제를 할 수 있고, 삭제는 5초 안에 실행 취소할 수 있습니다
- 검색은 입력하는 대로 결과를 보여 주며 ↑↓로 선택, Enter로 추가합니다
- CoinGecko가 요청을 제한하거나 오프라인일 때도 마지막 가격을 몇 시 기준인지와 함께 계속 보여 줍니다

**코인 상세**
- 1일·7일·30일·90일·1년 가격 차트. 기간 중 최고가와 최저가를 표시하고, 마우스를 올리면 그 시점의 가격을 보여 줍니다
- 시가총액, 24시간 거래량, 유통량, 역대 최고가(와 현재 얼마나 낮은지), 시가총액 순위
- 해당 코인 관련 뉴스

**툴바 아이콘**
- 고정한 코인의 가격 또는 24시간 등락률을 표시합니다
- 색상은 등락 색상 설정을 따르며, 아이콘에 마우스를 올리면 코인 이름·가격·등락률이 보입니다
- 설정한 간격으로 백그라운드에서 새로고침합니다

**뉴스**
- 날짜별로 묶은 타임라인. 내 코인이나 특정 코인 관련 뉴스만 볼 수 있습니다
- 여러 사이트가 같은 소식을 보도하면 가장 먼저 나온 한 건만 보여 줍니다
- 뉴스 탭을 열기 전에는 어떤 뉴스 사이트에도 접속하지 않습니다. PANews와 Odaily는 바로 보이고, Decrypt는 먼저 허용을 요청합니다

**설정**
- 표시 통화: 미국 달러, 중국 위안, 유로
- 언어: 简体中文, English, 日本語, 한국어 (기본값은 브라우저 설정)
- 등락 색상: 빨강 상승·초록 하락, 초록 상승·빨강 하락, 빨강 상승·파랑 하락. 기본값은 언어별 관례를 따릅니다(한국어는 국내 거래소처럼 빨강 상승·파랑 하락)
- 화면 모드: 시스템, 라이트, 다크
- 무료 CoinGecko API 키를 등록하면 요청 제한에 덜 걸립니다
- 코인 목록은 같은 Chrome 계정으로 로그인한 컴퓨터끼리 동기화됩니다

## 설치

- **Chrome 웹 스토어**: “Crypto Price Viewer”를 검색하세요.
- **직접 빌드** (Node.js 22 이상 필요):

  ```bash
  git clone https://github.com/TuYv/CryptoPriceViewer.git
  cd CryptoPriceViewer
  npm install
  npm run build
  ```

  `chrome://extensions`를 열고 개발자 모드를 켠 뒤 “압축해제된 확장 프로그램을 로드합니다”를 눌러 `.output/chrome-mv3` 폴더를 선택합니다.

0.1.x에서 업데이트하면 코인 목록, 고정한 코인, 통화, 언어, 새로고침 간격이 그대로 유지됩니다.

## 데이터 출처

- **시세**: [CoinGecko](https://www.coingecko.com/) 공개 API
- **뉴스**: [PANews](https://www.panewslab.com/), [Odaily](https://www.odaily.news/), [Decrypt](https://decrypt.co/). 확장 프로그램은 제목과 링크만 보여 주고, 기사는 원래 사이트에서 열립니다. 기사의 저작권은 각 사이트에 있습니다. 설정 › 뉴스 출처에서 출처별로 끌 수 있습니다.

## 개인정보

- 개인정보를 수집하거나 전송하지 않으며, 분석 도구나 광고가 없습니다
- 설정은 Chrome 기본 동기화 저장소에 저장되고, 내 Chrome 계정 안에서만 동기화됩니다
- CoinGecko API 키는 이 컴퓨터에만 저장됩니다
- 접속하는 곳은 CoinGecko와, 뉴스 탭을 연 뒤 켜 둔 뉴스 사이트뿐입니다

자세한 내용은 [개인정보처리방침](./privacy-policy.html)을 참고하세요.

## 피드백

문제 신고나 제안은 [GitHub Issues](https://github.com/TuYv/CryptoPriceViewer/issues)에 남겨 주세요.

## 개발

[DEVELOPMENT.md](./DEVELOPMENT.md)를 참고하세요(중국어).

## 라이선스

[MIT](./LICENSE)
