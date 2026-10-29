/* core/error-report.js — 오류 알림(관리자 메일)
   index.html 또는 core/loader.js의 순서대로 로드(앞 파일의 변수·함수를 뒤 파일이 전역으로 씀). 순서를 바꾸면 깨질 수 있음 */
/* ---------- 오류 알림(관리자 메일) ---------- */
let LR=0;async function reportErr(w,m){if(Date.now()-LR<6e4)return;LR=Date.now();try{await SB.functions.invoke('admin-author',{body:{action:'report_error',where:w,message:String(m).slice(0,300)}})}catch(e){dbg('오류 보고 전송',e)}}
addEventListener('unhandledrejection',e=>reportErr('예상치 못한 오류',e.reason?.message||e.reason));
addEventListener('error',e=>reportErr('화면 오류',e.message));
