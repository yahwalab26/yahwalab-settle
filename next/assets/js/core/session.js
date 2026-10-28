/* core/session.js — 작가 자동 로그아웃(1시간) · 로그인 입력칸 X 버튼
   index.html 또는 core/loader.js의 순서대로 로드(앞 파일의 변수·함수를 뒤 파일이 전역으로 씀). 순서를 바꾸면 깨질 수 있음 */
/* ---------- 작가 자동 로그아웃 (1시간 미사용) ---------- */
const IDLE=60*60*1000;let LA=Date.now(),LW=0,IT=null;
const stamp=()=>{try{localStorage.setItem('yw_la',String(Date.now()))}catch(e){dbg('활동 시각 저장',e)}};
const stale=()=>{try{return Date.now()-Number(localStorage.getItem('yw_la')||0)>IDLE}catch{return false}};
['click','keydown','touchstart','scroll','mousemove'].forEach(ev=>addEventListener(ev,()=>{LA=Date.now();if(LA-LW>10000){LW=LA;stamp()}},{passive:true,capture:true}));
async function idleOut(msg){stopIdle();dropEmbeds();await SB.auth.signOut();closeLay();view('login');$('#le').textContent=msg}
function startIdle(){stopIdle();LA=Date.now();IT=setInterval(()=>{if(Date.now()-LA>IDLE||stale())idleOut('1시간 이상 사용이 없어 자동 로그아웃되었습니다. 다시 로그인해 주세요.')},30000)}
function stopIdle(){clearInterval(IT);IT=null}

/* ---------- 로그인 입력칸: X 버튼 · 아이디를 고치면 비밀번호 비움 ---------- */
const syncX=()=>document.querySelectorAll('.xb[data-x]').forEach(b=>b.hidden=!$('#'+b.dataset.x).value);
['em','pw'].forEach(id=>$('#'+id).addEventListener('input',syncX));
document.querySelectorAll('.xb[data-x]').forEach(b=>b.onclick=()=>{const i=$('#'+b.dataset.x);i.value='';i.focus();if(b.dataset.x==='em')$('#pw').value='';syncX()});
$('#em').addEventListener('input',e=>{if(e.isTrusted&&/^(insert(?!Replacement)|delete)/.test(e.inputType||'')){$('#pw').value='';syncX()}});   // 자동완성은 제외, 직접 입력·삭제 시에만
setTimeout(syncX,0);
