/* admin/tools.js — 교정고 점검·메일 작성(iframe 끼워넣기)
   index.html 또는 core/loader.js의 순서대로 로드(앞 파일의 변수·함수를 뒤 파일이 전역으로 씀). 순서를 바꾸면 깨질 수 있음 */

function openEmbed(id,src,title){if(EF[id])return;const f=document.createElement('iframe');f.className='ef';f.title=title;f.src=src+'?v='+encodeURIComponent(VER);EF[id]=f;$('#pg-'+id).append(f)}   // 로그아웃·자동 로그아웃 때 입력한 내용이 메모리에 남지 않게 제거
addEventListener('message',e=>{if(e.origin===location.origin&&e.data&&e.data.t==='yw-act'&&Object.keys(EF).some(k=>EF[k].contentWindow===e.source)){LA=Date.now();if(LA-LW>10000){LW=LA;stamp()}}});   // 끼워 넣은 화면에서 작업 중이면 '사용 중'으로 인정
