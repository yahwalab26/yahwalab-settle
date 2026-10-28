/* core/enter.js — 로그인 후 역할 판별·진입(enter)·로그인 기록
   index.html 또는 core/loader.js의 순서대로 로드(앞 파일의 변수·함수를 뒤 파일이 전역으로 씀). 순서를 바꾸면 깨질 수 있음 */

/* 로그인 기록: 로그인 성공 직후 서버 함수(log_login) 호출. 실패해도 화면 동작에는 영향 없음 */
let LOGID='',LOGAT=0;
function uaShort(){const u=navigator.userAgent||'',os=/iPhone|iPad|iPod/.test(u)?'iOS':/Android/.test(u)?'Android':/Windows/.test(u)?'Windows':/Mac OS X/.test(u)?'macOS':/Linux/.test(u)?'Linux':'',br=/Edg\//.test(u)?'Edge':/OPR\//.test(u)?'Opera':/SamsungBrowser/.test(u)?'Samsung':/CriOS|Chrome\//.test(u)?'Chrome':/FxiOS|Firefox\//.test(u)?'Firefox':/Safari\//.test(u)?'Safari':'',mo=/Mobi/.test(u)?' 모바일':'';return (br+(os?' · '+os:'')+mo).trim()||'알 수 없음'}
function logLogin(){try{if(!ME||(LOGID===ME.id&&Date.now()-LOGAT<6e5))return;LOGID=ME.id;LOGAT=Date.now();SB.rpc('log_login',{p_ua:uaShort()}).then(()=>{},e=>dbg('로그인 기록',e))}catch(e){dbg('로그인 기록',e)}}
async function enter(u){ME=u;const{data}=await SB.from('profiles').select('role,must_change_password').eq('id',u.id).maybeSingle();
  if(data?.must_change_password)return askPw(true);
  if(data?.role==='author'&&stale()){await SB.auth.signOut();view('login');$('#le').textContent='1시간 이상 사용이 없어 자동 로그아웃되었습니다. 다시 로그인해 주세요.';return}
  if(data?.role==='author'){if(!await needBundle('author'))return;$('#awho').textContent=u.email;view('author');drawSchedule();loadRates();loadStats();initSearch();loadMyStatements();startIdle();logLogin();return}
  stopIdle();
  if(data?.role!=='admin')return view('denied');
  if(!await needBundle('admin'))return;
  if(!await mfaGate())return;
  $('#who').textContent=u.email;$('#ver').textContent=VER;view('app');loadFresh();route();loadPeople();logLogin();
  try{document.cookie='yw_nt=1;domain=.yahwalab.xyz;path=/;max-age=31536000;SameSite=Lax;Secure'}catch(e){dbg('관리자 제외 쿠키',e)} /* 홈페이지 버튼 클릭 집계에서 관리자 본인 제외 */}
try{const se=localStorage.getItem('yw_email');if(se){$('#em').value=se;$('#rm').checked=true}}catch(e){dbg('아이디 불러오기',e)}
