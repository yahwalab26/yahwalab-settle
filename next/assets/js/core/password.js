/* core/password.js — 비밀번호 설정/변경
   index.html의 <script> 순서대로 로드(앞 파일의 변수·함수를 뒤 파일이 전역으로 씀). 순서를 바꾸면 깨질 수 있음 */
/* ---------- 비밀번호 설정/변경 ---------- */
function askPw(f){forced=f;$('#ct').textContent=f?'비밀번호 설정':'비밀번호 변경';
  $('#cs').textContent=f?'처음 접속하셨습니다. 앞으로 사용할 비밀번호를 설정해 주세요.':'새 비밀번호를 입력하세요.';
  $('#cc').hidden=f;$('#cf').reset();$('#ce').textContent='';view('chpw')}
$('#pwb').onclick=()=>askPw(false);$('#cc').onclick=()=>enter(ME);
$('#cf').onsubmit=async e=>{e.preventDefault();const a=$('#np').value,m=$('#ce');m.textContent='';
  if(a.length<6)return m.textContent='6자 이상으로 입력하세요.';
  if(a!==$('#np2').value)return m.textContent='비밀번호 확인이 일치하지 않습니다.';
  const{error}=await SB.auth.updateUser({password:a});
  if(error)return m.textContent=/different|same/i.test(error.message)?'기존 비밀번호와 다른 비밀번호를 입력하세요.':error.message;
  await SB.rpc('complete_password_change');enter(ME)};

