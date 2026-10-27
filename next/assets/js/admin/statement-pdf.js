/* admin/statement-pdf.js — 정산서 PDF 생성
   index.html의 <script> 순서대로 로드(앞 파일의 변수·함수를 뒤 파일이 전역으로 씀). 순서를 바꾸면 깨질 수 있음 */
/* ---------- 정산서 PDF 생성(브라우저): 정산서를 이미지로 그려 A4 PDF로 만든 뒤 메일에 첨부 ---------- */
const loadLib=(u,g)=>window[g]?Promise.resolve():new Promise((res,rej)=>{const e=document.createElement('script');e.src=u;e.onload=res;e.onerror=()=>rej('PDF 라이브러리를 불러오지 못했습니다.');document.head.appendChild(e)});
async function makePdf(S){await loadLib('/libs/html2canvas-1.4.1.min.js','html2canvas');await loadLib('/libs/jspdf-4.2.1.umd.min.js','jspdf');
  const box=document.createElement('div');box.style.cssText='position:fixed;left:-10000px;top:0;width:760px;padding:24px;background:#fff;color:#111';
  box.innerHTML=stHtml(S).replace(/ id="lt"/,'').replace(/class="([^"]*)"/g,(m,c)=>'class="'+c.split(/\s+/).filter(x=>x!=='hm').join(' ')+'"');document.body.appendChild(box);
  try{const cv=await html2canvas(box,{scale:2,backgroundColor:'#fff'}),pdf=new jspdf.jsPDF({unit:'mm',format:'a4'}),W=190,ph=Math.floor(cv.width*277/W);
    for(let y=0,n=0;y<cv.height;y+=ph,n++){const hh=Math.min(ph,cv.height-y),c=document.createElement('canvas');c.width=cv.width;c.height=hh;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,hh);g.drawImage(cv,0,y,cv.width,hh,0,0,cv.width,hh);if(n)pdf.addPage();pdf.addImage(c.toDataURL('image/jpeg',.92),'JPEG',10,10,W,hh*W/cv.width)}
    return pdf.output('datauristring').split(',')[1]}finally{box.remove()}}
async function mailPdf(pid,m,S){const pdf=await makePdf(S);return call({action:'send_statement_mail',person_id:pid,month:m,pdf,filename:fname(S)+'.pdf'})}
function mailSt(pid){const p=buildSt().find(x=>x.id===pid),x=SS[pid],m=monVal('#sm')+'-01';if(!p||!x||x.status==='draft')return alert('확정된 정산서만 메일을 보낼 수 있습니다.');
  if(Number(x.author_total)!==p.A||Number(x.payable_amount)!==p.pay)return alert('확정 후 금액이 변경되었습니다. 먼저 재확정한 뒤 메일을 발송해 주세요.');
  const sent=x.status==='sent';
  confirmLay({title:sent?'정산 메일 재발송':'정산 메일 발송',danger:false,body:`<p style="margin:0"><b>${esc([...p.pens].join(', '))}</b> 작가님께 ${m.slice(0,7)} 정산서 확정 안내 메일을 ${sent?'다시 ':''}발송합니다.<br>정산서 PDF를 첨부해 발송합니다(PDF에는 정산 금액이 포함됩니다).${sent?`<br><span class="bad">${(x.sent_at||'').slice(0,10)}에 이미 발송했습니다.</span>`:''}</p>`,ok:sent?'재발송':'발송',onOk:async()=>{
    openLay('<p class="k">정산서 PDF 생성·메일 발송 중…</p>');let r;try{const{data:sn,error:se}=await SB.from('settlements').select('snapshot').eq('id',x.id).single();if(se||!sn?.snapshot)throw '확정된 정산서를 불러오지 못했습니다.';r=await mailPdf(pid,m,sn.snapshot)}catch(e){closeLay();return alert(String(e.message||e))}
    closeLay();if(r.error)return alert(r.error);alert(`${r.data.to} 로 발송했습니다.`);loadSettle()}})}
function confirmSt(ids){const L=buildSt().filter(p=>ids.includes(p.id)),m=monVal('#sm')+'-01',bad=L.filter(p=>p.nr);
  if(!L.length)return alert('확정할 정산서가 없습니다.');
  if(bad.length)return alert(`계약 비율이 설정되지 않은 판매가 있어 확정할 수 없습니다.\\n${bad.map(p=>[...p.pens][0]+' ('+p.nr+'건)').join(', ')}\\n작품 상세에서 계약 비율을 먼저 입력하세요.`);
  const over=L.some(p=>SS[p.id]&&SS[p.id].status!=='draft');
  confirmLay({title:'정산서 확정',danger:false,body:`<p style="margin:0">${m.slice(0,7)} 정산서 <b>${L.length}명</b>을 확정하고, 작가가 본인 정산서를 열람할 수 있게 합니다.<br>확정만 하며 <b>메일은 발송되지 않습니다</b>. 정산서 메일은 정산 화면의 '메일 발송' 버튼으로 보냅니다.<br>원천징수율 <b>${$('#sx').value}%</b> 기준으로 저장됩니다.${over?'<br><span class="bad">이미 확정된 정산서는 현재 값으로 덮어씁니다.</span>':''}</p>`,ok:'확정',onOk:async()=>{
    for(const p of L){const row={person_id:p.id,period_month:m,status:'confirmed',gross_total:p.gross,net_total:p.net,author_total:p.A,deduction:p.ded,tax_amount:p.tax,payable_amount:p.pay,tax_rate:Number($('#sx').value),snapshot:mkSnap(p),confirmed_at:new Date().toISOString()},x=SS[p.id];
      const r=x?await SB.from('settlements').update(row).eq('id',x.id):await SB.from('settlements').insert(row);if(r.error){alert('확정 실패: '+r.error.message);break}}
    closeLay();loadSettle()}})}
function unconfirmSt(pid){const x=SS[pid];confirmLay({title:'확정 취소',body:'<p style="margin:0">작가 화면에서 이 정산서가 보이지 않게 됩니다. 확정한 내용은 유지되지 않고 미확정 상태로 돌아갑니다.</p>',ok:'확정 취소',onOk:async()=>{const r=await SB.from('settlements').update({status:'draft',confirmed_at:null,snapshot:null}).eq('id',x.id);closeLay();if(r.error)alert(r.error.message);loadSettle()}})}
function stRows(p){const m=monVal('#sm');let n=0;const det=[];
  p.W.forEach(w=>{n++;ORD.forEach((c,i)=>{const x=w.pl[c]||{q:0,lp:w.pl[Object.keys(w.pl)[0]]?.lp||0,g:0,n:0};det.push([i?'':n,i?'':w.t,i?'':(w.rd||'').replace(/-/g,'.'),PN[c],x.q,x.lp,x.g,x.n])})});return det}
const mkSnap=p=>({month:monVal('#sm'),tax_rate:Number($('#sx').value||0),tax_rule:Math.abs(Number($('#sx').value||0)-3.3)<1e-9?(LOCAL_MIN>0?'A2':'A'):'',pens:[...p.pens],totals:{gross:p.gross,net:p.net,A:p.A,ded:p.ded,tax:p.tax,pay:p.pay},
  works:p.W.map(w=>({t:w.t,gross:w.gross,net:w.net,a:w.a,ded:w.ded,rate:w.rate})),detail:stRows(p),nr:p.nr});
// 확정 당시 플랫폼 목록이 달랐던 정산서(예: 리디북스 추가 전)도 모든 판매처 행이 보이도록 보정 — 표시용이며 금액은 바뀌지 않음
function fillPl(S){const d=S.detail||[],G=[];d.forEach(r=>{if(r[0]!==''||!G.length)G.push([]);G[G.length-1].push(r)});
  const out=[];G.forEach(g=>{const f=g[0],by={};g.forEach(r=>by[r[3]]=r);const lp=f[5]||0,names=ORD.map(c=>PN[c]),rest=g.filter(r=>!names.includes(r[3]));
    [...names.map(n=>by[n]||['','','',n,0,lp,0,0]),...rest].forEach((r,i)=>out.push(i?['','','',r[3],r[4],r[5],r[6],r[7]]:[f[0],f[1],f[2],r[3],r[4],r[5],r[6],r[7]]))});
  return{...S,detail:out}}
const stHtml=S=>{S=fillPl(S);const[Y,M]=S.month.split('-'),T=S.totals;
  return `<h3 id="lt" style="margin:0 0 14px">${Y}년 ${+M}월 정산서</h3>
  <table><tbody><tr><th scope="row" style="width:34%">작가명</th><td>${esc(S.pens.join(', '))}</td></tr><tr><th scope="row">판매보고 기준</th><td>${S.month}-01 ~ ${S.month}-${String(new Date(Date.UTC(+Y,+M,0)).getUTCDate()).padStart(2,'0')}</td></tr><tr><th scope="row">총 정산액</th><td>${won1(T.net)}</td></tr><tr><th scope="row">출판사 공제액</th><td>${won1(T.ded)}</td></tr><tr><th scope="row">작가 정산액</th><td>${won1(T.A)}</td></tr><tr><th scope="row">원천징수액 (${S.tax_rate}%)</th><td>${won1(T.tax)}</td></tr><tr><th scope="row"><b>실 지급액</b></th><td><b>${won1(T.pay)}</b></td></tr></tbody></table>
  <h4 style="margin:22px 0 4px">작품별 정산</h4><table><thead><tr><th>번호</th><th>작품명</th><th class="r hm">판매금액</th><th class="r">총 정산액</th><th class="r hm">작가 비율</th><th class="r">작가 정산액</th><th class="r hm">출판사 공제액</th></tr></thead><tbody>${S.works.map((w,i)=>`<tr><td>${i+1}</td><td>${esc(w.t)}</td><td class="r hm">${w0(w.gross)}</td><td class="r">${w0(w.net)}</td><td class="r hm">${Math.round(w.rate*1000)/10}%</td><td class="r">${w0(w.a)}</td><td class="r hm">${w0(w.ded)}</td></tr>`).join('')}</tbody><tfoot><tr><td colspan="2"><b>합계</b></td><td class="r hm"><b>${w0(T.gross)}</b></td><td class="r"><b>${w0(T.net)}</b></td><td class="hm"></td><td class="r"><b>${w0(T.A)}</b></td><td class="r hm"><b>${w0(T.ded)}</b></td></tr></tfoot></table>
  <h4 style="margin:22px 0 4px">판매 상세</h4><table class="sd"><thead><tr><th class="cc">번호</th><th>제목</th><th class="cc hm">1차 출간일</th><th class="cc">판매처</th><th class="cc">수량</th><th class="r hm">정가</th><th class="r hm">판매금액</th><th class="r">정산액</th></tr></thead><tbody>${(()=>{let pt='';return ordDet(S.detail).map(r=>{const t=r[1]&&r[1]!==pt?r[1]:'';if(r[1])pt=r[1];return `<tr><td class="cc">${r[0]}</td><td>${esc(t)}</td><td class="cc hm">${r[2]}</td><td class="cc">${r[3]}</td><td class="cc">${r[4]}</td><td class="r hm">${w0(r[5])}</td><td class="r hm">${w0(r[6])}</td><td class="r">${w0(r[7])}</td></tr>`}).join('')})()}</tbody></table>
  <p class="k" style="font-size:12px;margin-top:14px">• 작가 정산 비율은 작품별 계약 기간에 따라 적용했습니다.<br>• ${S.tax_rule==='A2'?'원천징수는 작가 정산액 합계에 대해 소득세(3%)와 지방소득세(소득세의 10%)를 각각 10원 미만 내림하여 합산했으며, 지방소득세가 1,000원 미만이면 소액부징수로 징수하지 않습니다(합산 약 '+S.tax_rate+'%).':S.tax_rule==='A'?'원천징수는 작가 정산액 합계에 대해 소득세(3%)와 지방소득세(소득세의 10%)를 각각 10원 미만 내림하여 합산했습니다(합산 약 '+S.tax_rate+'%).':'원천징수는 소득세와 지방소득세를 합산한 '+S.tax_rate+'%를 작가 정산액 합계에 대해 계산했습니다(원 미만 내림).'}</p>`};
function openStatement(pid){const p=buildSt().find(x=>x.id===pid);if(!p)return;const S=mkSnap(p),[Y,M]=S.month.split('-'),T=S.totals;
  openLay(stHtml(S)+(p.nr?`<p class="bad" style="font-size:13px">계약 비율이 설정되지 않은 판매 ${p.nr}건은 작가 정산액이 0원으로 계산되었습니다. 작품 상세에서 계약 비율을 입력하세요.</p>`:'')+`<div class="row noprint" style="justify-content:flex-end;margin-top:14px"><button class="ghost" id="sxl">엑셀로 저장</button><button class="ghost" id="spr">인쇄 / PDF</button></div>`);
  $('#spr').onclick=()=>printSt(S);
  needXLSX().catch(()=>{});$('#sxl').onclick=async()=>{const a=[[`${Y}년 ${+M}월 정산서`],['작가명',S.pens.join(', ')],['판매보고 기준',S.month+'-01 ~ '+S.month+'-'+String(new Date(Date.UTC(+Y,+M,0)).getUTCDate()).padStart(2,'0')],['총 정산액',T.net],['출판사 공제액',T.ded],['작가 정산액',T.A],['원천징수율',S.tax_rate/100],['원천징수액',T.tax],['실 지급액',T.pay],[],['작품별 정산'],['번호','작품명','판매금액','총 정산액','작가 비율','공제 비율','작가 정산액','출판사 공제액'],
    ...S.works.map((w,i)=>[i+1,w.t,w.gross,w.net,w.rate,1-w.rate,w.a,w.ded]),['','합계',T.gross,T.net,'','',T.A,T.ded],[],['판매 상세'],['번호','제목','1차 출간일','판매처','판매수량','정가','판매금액','정산액'],...ordDet(S.detail),[],['상세 합계','','','','','',T.gross,T.net]];
    try{await needXLSX()}catch(e){alert(e.message);return}
    const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(a),'정산서');XLSX.writeFile(wb,fname(S)+'.xlsx')}}
