/* admin/totp.js — 관리자 2단계 인증(TOTP)
   index.html 또는 core/loader.js의 순서대로 로드(앞 파일의 변수·함수를 뒤 파일이 전역으로 씀). 순서를 바꾸면 깨질 수 있음 */
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
