/* core/embed.js — 도구 iframe(EF) 정리(dropEmbeds)
   index.html 또는 core/loader.js의 순서대로 로드(앞 파일의 변수·함수를 뒤 파일이 전역으로 씀). 순서를 바꾸면 깨질 수 있음 */
/* ---------- 교정고 점검·메일 작성(별도 페이지를 탭 안에 끼워 넣음) ---------- */
const EF={};   // 한 번 열면 탭을 옮겨도 작업이 유지됨
function dropEmbeds(){Object.keys(EF).forEach(k=>{EF[k].remove();delete EF[k]})}
