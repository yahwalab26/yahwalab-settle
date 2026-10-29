/* admin/confirm.js — 확인 창(confirmLay) — 관리자 전용
   index.html 또는 core/loader.js의 순서대로 로드(앞 파일의 변수·함수를 뒤 파일이 전역으로 씀). 순서를 바꾸면 깨질 수 있음 */

function confirmLay({title,body,phrase,ok,onOk,danger}){openLay(`<h3 id="lt" style="margin:0 0 10px">${title}</h3><div style="margin-bottom:16px">${body}</div>${phrase?`<input id="cph" type="text" autocomplete="off" placeholder="“${phrase}”를 입력하세요" style="margin-bottom:16px">`:''}<div class="row" style="justify-content:flex-end"><button class="ghost" id="cno">취소</button><button id="cok" ${phrase?'disabled':''}${danger===false?'':' style="background:var(--bad);border-color:var(--bad)"'}>${ok}</button></div>`);
  if(phrase)$('#cph').oninput=e=>{$('#cok').disabled=e.target.value.trim()!==phrase};$('#cno').onclick=closeLay;$('#cok').onclick=async()=>{$('#cok').disabled=true;await onOk()}}
