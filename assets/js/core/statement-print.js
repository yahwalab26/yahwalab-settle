/* core/statement-print.js — 정산서 인쇄/PDF 저장(printSt) — 작가·관리자 공용
   index.html 또는 core/loader.js의 순서대로 로드(앞 파일의 변수·함수를 뒤 파일이 전역으로 씀). 순서를 바꾸면 깨질 수 있음 */
/* ---------- 작가: 확정된 월별 정산서 열람 ---------- */
// 정산서 파일 이름: 야화랩_{정산월}_{작가필명} (예: 야화랩_202609_마요마요참지마요) — PDF로 저장/인쇄할 때 브라우저가 문서 제목을 파일 이름으로 쓴다
const fname=S=>`야화랩_${String(S.month).replace('-','')}_${(S.pens[0]||'작가').replace(/[\\/:*?"<>|]/g,'')}`;
function printSt(S){const old=document.title;document.title=fname(S);const back=()=>{document.title=old;removeEventListener('afterprint',back)};addEventListener('afterprint',back);print()}
