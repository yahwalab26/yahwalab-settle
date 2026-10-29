/* core/start-hash.js — 새로 접속하면 현황(#/home)에서 시작
   index.html 또는 core/loader.js의 순서대로 로드(앞 파일의 변수·함수를 뒤 파일이 전역으로 씀). 순서를 바꾸면 깨질 수 있음 */

/* 새로 접속(주소 입력·북마크·탭 복원)하면 현황에서 시작. 같은 탭의 새로고침·뒤로가기만 보던 화면 유지 */
try{const nt=(performance.getEntriesByType('navigation')[0]||{}).type;if(!sessionStorage.getItem('yw_s')||nt==='navigate'){if(location.hash&&location.hash!=='#/home')history.replaceState(null,'',location.pathname+'#/home')}sessionStorage.setItem('yw_s','1')}catch(e){dbg('세션 표시',e)}
