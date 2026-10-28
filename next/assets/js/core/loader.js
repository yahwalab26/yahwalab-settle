/* core/loader.js — 역할별 코드 불러오기: 로그인 후 역할(작가/관리자)에 맞는 파일만 받는다(작가는 관리자 코드를 받지 않음)
   BUNDLES 배열의 순서가 곧 실행 순서(앞 파일의 전역을 뒤 파일이 씀). 파일을 추가·이름 변경하면 여기도 고칠 것(scripts/check_split.py가 점검) */
const BUNDLES={
author:["author/home.js","author/rates.js","author/statements.js"],
admin:["admin/month.js","admin/totp.js","admin/password.js","admin/shell.js","admin/docs.js","admin/works-publish.js","admin/tools.js","admin/stats.js","admin/confirm.js","admin/work-detail.js","admin/statements.js","admin/statement-pdf.js","admin/uploads.js","admin/authors.js","admin/refs.js","admin/upload-read.js","admin/upload-ui.js","admin/upload-infer.js"]},BUNDLE_P={};
function loadBundle(n){return BUNDLE_P[n]??=new Promise((ok,ko)=>{const L=BUNDLES[n];let k=0;   /* 동시에 내려받고 순서대로 실행(async=false) */
  L.forEach(f=>{const s=document.createElement('script');s.src='assets/js/'+f+'?v='+VER.slice(1);s.async=false;
    s.onload=()=>{if(++k===L.length)ok()};s.onerror=()=>ko(new Error(f));document.head.appendChild(s)})})}
async function needBundle(n){try{await loadBundle(n);return true}catch(e){dbg('코드 불러오기',e);view('login');$('#le').textContent='화면을 불러오지 못했습니다. 새로고침한 뒤 다시 시도해 주세요.';return false}}
