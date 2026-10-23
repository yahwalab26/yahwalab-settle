# libs — 자체 호스팅 외부 라이브러리 (정산 사이트)
외부 CDN을 쓰지 않도록 npm 공식 배포본을 그대로 복사해 둔 폴더입니다. 파일 내용은 수정하지 않습니다.

| 파일 | 출처(npm) | npm 공식 무결성(sha512) |
|---|---|---|
| supabase-2.49.4.js | @supabase/supabase-js@2.49.4 `dist/umd/supabase.js` | jUF0uRUmS8BKt37t01qaZ88H9yV1mbGYnqLeuFWLcdV+x1P4fl0yP9DGtaEhFPZcwSom7u16GkLEH9QJZOqOkw== |
| xlsx-0.18.5.full.min.js | xlsx@0.18.5 `dist/xlsx.full.min.js` | dmg3LCjBPHZnQp5/F/+nnTa+miPJxUXB6vtk42YjBBKayDNagxGEeIdWApkYPOf3Z3pm3k62Knjzp7lMeTEtFQ== |
| html2canvas-1.4.1.min.js | html2canvas@1.4.1 `dist/html2canvas.min.js` | fPU6BHNpsyIhr8yyMpTLLxAbkaK8ArIBcmZIRiBLiDhjeqvXolaEmDGmELFuX9I4xDcaKKcJl+TKZLqruBbmWA== |
| jspdf-4.2.1.umd.min.js | jspdf@4.2.1 `dist/jspdf.umd.min.js` | sha512-YyAXyvnmjTbR4bHQRLzex3CuINCDlQnBqoSYyjJwTP2x9jDLuKDzy7aKUl0hgx3uhcl7xzg32agn5vlie6HIlQ== |

(무결성 값은 각 패키지 압축 파일(.tgz) 전체의 값이며 `npm view <패키지>@<버전> dist.integrity` 로 확인됩니다.)

## 버전을 올릴 때
1. `npm pack <패키지>@<새 버전>` 으로 받아 `npm view ... dist.integrity` 와 대조
2. 새 파일명(버전 포함)으로 이 폴더에 추가 → `index.html` 의 주소 교체 → `VER` 올림 → **libs 먼저, index.html 나중에 업로드**
3. 이전 파일은 새 버전이 정상 확인된 뒤 삭제
