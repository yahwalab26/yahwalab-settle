/* admin/tools.js — 교정고 점검·메일 작성(iframe 끼워넣기)
   index.html의 <script> 순서대로 로드(앞 파일의 변수·함수를 뒤 파일이 전역으로 씀). 순서를 바꾸면 깨질 수 있음 */
/* ---------- 교정고 점검·메일 작성(별도 페이지를 탭 안에 끼워 넣음) ---------- */
const EF={};
function openEmbed(id,src,title){if(EF[id])return;const f=document.createElement('iframe');f.className='ef';f.title=title;f.src=src+'?v='+encodeURIComponent(VER);EF[id]=f;$('#pg-'+id).append(f)}   // 한 번 열면 탭을 옮겨도 작업이 유지됨
function dropEmbeds(){Object.keys(EF).forEach(k=>{EF[k].remove();delete EF[k]})}   // 로그아웃·자동 로그아웃 때 입력한 내용이 메모리에 남지 않게 제거
addEventListener('message',e=>{if(e.origin===location.origin&&e.data&&e.data.t==='yw-act'&&Object.keys(EF).some(k=>EF[k].contentWindow===e.source)){LA=Date.now();if(LA-LW>10000){LW=LA;stamp()}}});   // 끼워 넣은 화면에서 작업 중이면 '사용 중'으로 인정

