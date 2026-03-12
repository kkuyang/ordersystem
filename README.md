# 도미노피자 재고·발주 자동화

재고를 입력하고 부족 품목을 분석한 뒤, 담당 거래처에 발주 이메일을 보내는 웹 애플리케이션입니다.

## 기능

- 재고 입력 및 수정 (품목코드, 재료명, 규격, 단위, 현재재고, 안전재고, MOQ, 거래처, 이메일)
- 현재재고 < 안전재고 시 발주 필요 판정
- 발주 권장 수량: MAX(MOQ, 안전재고 - 현재재고)
- 거래처별 발주 현황 확인
- 이메일 발송 (EmailJS 설정 필요)

## 배포 (Vercel)

1. 이 저장소를 Vercel에 연결
2. **Settings** → **Environment Variables** → 추가:
   - Name: `GMAIL_APP_PASSWORD`
   - Value: `wzbwvnyszeuvfuwk` (Gmail 앱 비밀번호, 공백 없이)
3. 재배포 후 이메일 보내기 사용 가능

## EmailJS 설정

이메일 발송을 위해 [emailjs.com](https://www.emailjs.com) 무료 가입 후:

1. Add Email Service → Gmail 연결
2. Create Template → 변수 설정: `{{to_email}}`, `{{subject}}`, `{{message}}`
3. 발주 메일 화면에서 설정 저장
