/* core/dates.js — 날짜 계산 도우미(kst·iso·addD·w0·mon1)
   index.html 또는 core/loader.js의 순서대로 로드(앞 파일의 변수·함수를 뒤 파일이 전역으로 씀). 순서를 바꾸면 깨질 수 있음 */
/* ---------- 작가 화면 ---------- */
const kst=()=>new Date(Date.now()+9*36e5),iso=d=>d.toISOString().slice(0,10),addD=(d,n)=>new Date(d.getTime()+n*864e5),w0=n=>Math.round(n).toLocaleString('ko-KR'),mon1=(y,m)=>new Date(Date.UTC(y,m,1));
