/* core/auth.js — 인증(로그인·로그아웃·세션)
   index.html 또는 core/loader.js의 순서대로 로드(앞 파일의 변수·함수를 뒤 파일이 전역으로 씀). 순서를 바꾸면 깨질 수 있음 */
/* ---------- 인증 ---------- */
const view=id=>['login','accept','chpw','mfa','denied','app','author'].forEach(v=>$('#'+v).hidden=v!==id);
document.querySelectorAll('.out').forEach(b=>b.onclick=async()=>{stopIdle();dropEmbeds();await SB.auth.signOut();view('login')});
$('#lf').onsubmit=async e=>{e.preventDefault();$('#le').textContent='';
  const{data,error}=await SB.auth.signInWithPassword({email:$('#em').value.trim(),password:$('#pw').value});
  if(error)return $('#le').textContent='이메일 또는 비밀번호가 올바르지 않습니다.';
  try{$('#rm').checked?localStorage.setItem('yw_email',$('#em').value.trim()):localStorage.removeItem('yw_email')}catch(e){dbg('아이디 저장',e)}
  stamp();enter(data.user)};
let ME=null,forced=false;
