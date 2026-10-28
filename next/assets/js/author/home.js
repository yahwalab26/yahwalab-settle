/* author/home.js — 작가 화면
   index.html 또는 core/loader.js의 순서대로 로드(앞 파일의 변수·함수를 뒤 파일이 전역으로 씀). 순서를 바꾸면 깨질 수 있음 */

// 공휴일(정산일 계산용). 2026년은 전체, 2027년은 고정 공휴일만 포함 — 설·추석 등 음력 공휴일은 해마다 추가해야 합니다.
const HOL=new Set(['2026-01-01','2026-02-16','2026-02-17','2026-02-18','2026-03-01','2026-03-02','2026-05-05','2026-05-24','2026-05-25','2026-06-03','2026-06-06','2026-08-15','2026-08-17','2026-09-24','2026-09-25','2026-09-26','2026-10-03','2026-10-05','2026-10-09','2026-12-25','2027-01-01','2027-02-06','2027-02-07','2027-02-08','2027-02-09','2027-03-01','2027-05-05','2027-05-13','2027-06-06','2027-08-15','2027-08-16','2027-09-14','2027-09-15','2027-09-16','2027-10-03','2027-10-04','2027-10-09','2027-10-11','2027-12-25','2027-12-27']);
const fmtD=d=>`${d.getUTCMonth()+1}월 ${d.getUTCDate()}일(${'일월화수목금토'[d.getUTCDay()]})`;
function biz(y,m,d){const x=new Date(Date.UTC(y,m,d));while([0,6].includes(x.getUTCDay())||HOL.has(iso(x)))x.setUTCDate(x.getUTCDate()-1);return x}   // 주말·공휴일이면 앞선 평일
function drawSchedule(){const t=kst();let y=t.getUTCFullYear(),m=t.getUTCMonth(),pay=biz(y,m+1,0);if(iso(pay)<iso(t)){m++;pay=biz(y,m+1,0)}const mail=biz(y,m,25),mm=mon1(y,m).getUTCMonth()+1;
  $('#sch').innerHTML=`<div class="k" style="font-size:12px;letter-spacing:.06em">${mm}월 정산 일정</div><div class="row" style="gap:36px;margin-top:8px"><div><div class="k">정산 메일 발송</div><div style="font-size:19px;font-weight:700">${fmtD(mail)}</div></div><div><div class="k">정산일</div><div style="font-size:19px;font-weight:700">${fmtD(pay)}</div></div></div><p class="k" style="font-size:12px;margin:14px 0 0;text-align:center">※ 공휴일인 경우 영업일 기준으로 처리</p>`}
