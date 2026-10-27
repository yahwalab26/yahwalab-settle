/* core/totp.js — 관리자 2단계 인증(TOTP)
   index.html의 <script> 순서대로 로드(앞 파일의 변수·함수를 뒤 파일이 전역으로 씀). 순서를 바꾸면 깨질 수 있음 */
/* ---------- 관리자 2단계 인증(TOTP) ---------- */
let MFA_FID=null;
async function mfaGate(){ /* true=통과, false=코드 입력/등록 화면을 띄움 */
  const{data:a,error}=await SB.auth.mfa.getAuthenticatorAssuranceLevel();
  if(error){await SB.auth.signOut();view('login');$('#le').textContent='2단계 인증 상태를 확인하지 못했습니다. 다시 로그인해 주세요.';return false}
  if(a.currentLevel==='aal2')return true;
  const{data:l,error:le}=await SB.auth.mfa.listFactors();
  if(le){await SB.auth.signOut();view('login');$('#le').textContent='2단계 인증 정보를 불러오지 못했습니다. 다시 로그인해 주세요.';return false}
  const ok=(l?.totp||[]).find(f=>f.status==='verified');
  $('#mf').reset();$('#me').textContent='';
  if(ok){MFA_FID=ok.id;$('#mq').hidden=true;$('#mt').textContent='2단계 인증';
    $('#ms').textContent='인증 앱에 표시된 6자리 코드를 입력하세요.';view('mfa');$('#mc').focus();return false}
  /* 등록: 이전에 끝내지 못한 미완료 요소는 정리하고 새로 만든다 */
  for(const f of (l?.all||[]).filter(f=>f.factor_type==='totp'&&f.status!=='verified'))await SB.auth.mfa.unenroll({factorId:f.id});
  const{data:en,error:ee}=await SB.auth.mfa.enroll({factorType:'totp',friendlyName:'yahwa-'+Date.now()});
  if(ee){await SB.auth.signOut();view('login');$('#le').textContent='2단계 인증 등록을 시작하지 못했습니다: '+ee.message;return false}
  MFA_FID=en.id;$('#mqi').src=en.totp.qr_code;$('#mk').textContent=en.totp.secret;$('#mq').hidden=false;
  $('#mt').textContent='2단계 인증 등록';
  $('#ms').textContent='인증 앱(Google Authenticator, Microsoft Authenticator 등)으로 QR을 스캔한 뒤, 앱에 표시된 6자리 코드를 입력하세요.';
  view('mfa');$('#mc').focus();return false}
$('#mf').onsubmit=async e=>{e.preventDefault();const m=$('#me'),b=$('#mb');m.textContent='';
  const code=$('#mc').value.replace(/\s/g,'');if(!/^\d{6}$/.test(code))return m.textContent='6자리 숫자를 입력하세요.';
  b.disabled=true;const{error}=await SB.auth.mfa.challengeAndVerify({factorId:MFA_FID,code});b.disabled=false;
  if(error){$('#mc').value='';return m.textContent='코드가 올바르지 않거나 만료되었습니다. 앱의 새 코드를 입력하세요.'}
  enter(ME)};
/* 로그인 기록: 로그인 성공 직후 서버 함수(log_login) 호출. 실패해도 화면 동작에는 영향 없음 */
let LOGID='',LOGAT=0;
function uaShort(){const u=navigator.userAgent||'',os=/iPhone|iPad|iPod/.test(u)?'iOS':/Android/.test(u)?'Android':/Windows/.test(u)?'Windows':/Mac OS X/.test(u)?'macOS':/Linux/.test(u)?'Linux':'',br=/Edg\//.test(u)?'Edge':/OPR\//.test(u)?'Opera':/SamsungBrowser/.test(u)?'Samsung':/CriOS|Chrome\//.test(u)?'Chrome':/FxiOS|Firefox\//.test(u)?'Firefox':/Safari\//.test(u)?'Safari':'',mo=/Mobi/.test(u)?' 모바일':'';return (br+(os?' · '+os:'')+mo).trim()||'알 수 없음'}
function logLogin(){try{if(!ME||(LOGID===ME.id&&Date.now()-LOGAT<6e5))return;LOGID=ME.id;LOGAT=Date.now();SB.rpc('log_login',{p_ua:uaShort()}).then(()=>{},e=>dbg('로그인 기록',e))}catch(e){dbg('로그인 기록',e)}}
async function enter(u){ME=u;const{data}=await SB.from('profiles').select('role,must_change_password').eq('id',u.id).maybeSingle();
  if(data?.must_change_password)return askPw(true);
  if(data?.role==='author'&&stale()){await SB.auth.signOut();view('login');$('#le').textContent='1시간 이상 사용이 없어 자동 로그아웃되었습니다. 다시 로그인해 주세요.';return}
  if(data?.role==='author'){$('#awho').textContent=u.email;view('author');drawSchedule();loadRates();loadStats();initSearch();loadMyStatements();startIdle();logLogin();return}
  stopIdle();
  if(data?.role!=='admin')return view('denied');
  if(!await mfaGate())return;
  $('#who').textContent=u.email;$('#ver').textContent=VER;view('app');loadFresh();route();loadPeople();logLogin();
  try{document.cookie='yw_nt=1;domain=.yahwalab.xyz;path=/;max-age=31536000;SameSite=Lax;Secure'}catch(e){dbg('관리자 제외 쿠키',e)} /* 홈페이지 버튼 클릭 집계에서 관리자 본인 제외 */}
try{const se=localStorage.getItem('yw_email');if(se){$('#em').value=se;$('#rm').checked=true}}catch(e){dbg('아이디 불러오기',e)}

