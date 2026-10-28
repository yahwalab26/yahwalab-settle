/* core/invite.js — 메일 링크로 들어온 경우 계정 활성화
   index.html 또는 core/loader.js의 순서대로 로드(앞 파일의 변수·함수를 뒤 파일이 전역으로 씀). 순서를 바꾸면 깨질 수 있음 */
/* ---------- 메일 링크로 들어온 경우: 버튼을 눌러야 계정 활성화 ---------- */
const QP=new URLSearchParams(location.search);
$('#ab').onclick=async e=>{e.target.disabled=true;$('#ae2').textContent='';
  const{data,error}=await SB.auth.verifyOtp({token_hash:QP.get('th'),type:QP.get('t')==='recovery'?'recovery':'invite'});
  if(error){e.target.disabled=false;return $('#ae2').textContent='링크가 만료되었거나 이미 사용되었습니다. 담당자에게 재발급을 요청해 주세요.'}
  history.replaceState(null,'',location.pathname+'#/home');stamp();enter(data.user)};
(async()=>{if(QP.get('th'))return view('accept');const{data:{session}}=await SB.auth.getSession();session?enter(session.user):view('login')})();
