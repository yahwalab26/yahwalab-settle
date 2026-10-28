/* core/boot.js — 시작 준비: 로고 오류 처리 · VER · Supabase 클라이언트 · 공통 함수($·esc·won·dbg·monVal) · 전역 상태
   index.html 또는 core/loader.js의 순서대로 로드(앞 파일의 변수·함수를 뒤 파일이 전역으로 씀). 순서를 바꾸면 깨질 수 있음 */

document.querySelectorAll('.logo').forEach(i=>i.onerror=()=>{i.outerHTML='<b class="wm">야화랩 YAHWA LAB</b>'});
const VER='v2.16.1-B10'; /* 새 기능=minor, 수정·문구=patch, 구조 개편=major */
const SB=supabase.createClient('https://wddixxdrndgvjgicwunu.supabase.co','sb_publishable_fIrxIqOmX_-BFpSELdmvXQ_kkYSkaCx');
const $=s=>document.querySelector(s),won=n=>n==null?'-':Number(n).toLocaleString('ko-KR')+'원';
const esc=s=>String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const DBGS={},dbg=(w,e)=>{if(DBGS[w])return;DBGS[w]=1;try{console.warn('[정산]',w,(e&&e.message)||e)}catch(_){return}}; /* 월 입력이 비어 있으면(미방문·삭제·미지원 브라우저) 이번 달로 보정 */ const PN={aladin:'알라딘',yes24:'예스24',kyobo:'교보문고',bookcube:'북큐브',ridi:'리디북스'},pnm=n=>n==='리디'?'리디북스':n,c=v=>String(v??'').trim();
let S=null,WORKS=[],ISBN={},AUTHORS=[],WA={};
