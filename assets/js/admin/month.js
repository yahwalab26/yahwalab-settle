/* admin/month.js — 월 입력칸 보정(monVal)
   index.html 또는 core/loader.js의 순서대로 로드(앞 파일의 변수·함수를 뒤 파일이 전역으로 씀). 순서를 바꾸면 깨질 수 있음 */
 /* 조용히 넘기던 오류를 콘솔에 남김(같은 항목은 1번만) */
const monVal=sel=>{const e=$(sel);if(!/^\d{4}-\d{2}$/.test(e.value))e.value=kst().toISOString().slice(0,7);return e.value};
