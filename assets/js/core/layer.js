/* core/layer.js — 레이어(상세 창)·확인 창
   index.html 또는 core/loader.js의 순서대로 로드(앞 파일의 변수·함수를 뒤 파일이 전역으로 씀). 순서를 바꾸면 깨질 수 있음 */
/* ---------- 레이어(상세 창) · 확인 창 ---------- */
function openLay(h){$('#lbody').onclick=null;$('#lbody').innerHTML=h;$('#lay').hidden=false;document.documentElement.classList.add('lock')}
function closeLay(){if(CFURL){URL.revokeObjectURL(CFURL);CFURL=null}$('#lay').hidden=true;document.documentElement.classList.remove('lock')}
$('#lxb').onclick=closeLay;$('#lay').onclick=e=>{if(e.target.id==='lay')closeLay()};addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#lay').hidden)closeLay()});
