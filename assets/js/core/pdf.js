/* core/pdf.js — 정산서 PDF 만들기·저장. 관리자(메일 첨부)와 작가(PDF 저장)가 함께 쓴다(statement-html·statement-print 뒤에 로드)
   index.html 또는 core/loader.js의 순서대로 로드(앞 파일의 변수·함수를 뒤 파일이 전역으로 씀). 순서를 바꾸면 깨질 수 있음 */
const loadLib=(u,g)=>window[g]?Promise.resolve():new Promise((res,rej)=>{const e=document.createElement('script');e.src=u;e.onload=res;e.onerror=()=>rej('PDF 라이브러리를 불러오지 못했습니다.');document.head.appendChild(e)});
async function makePdf(S){await loadLib('/libs/html2canvas-1.4.1.min.js','html2canvas');await loadLib('/libs/jspdf-4.2.1.umd.min.js','jspdf');
  const box=document.createElement('div');box.style.cssText='position:fixed;left:-10000px;top:0;width:760px;padding:24px;background:#fff;color:#111';
  box.innerHTML=stHtml(S).replace(/ id="lt"/,'').replace(/class="([^"]*)"/g,(m,c)=>'class="'+c.split(/\s+/).filter(x=>x!=='hm').join(' ')+'"');document.body.appendChild(box);
  try{const cv=await html2canvas(box,{scale:2,backgroundColor:'#fff'}),pdf=new jspdf.jsPDF({unit:'mm',format:'a4'}),W=190,ph=Math.floor(cv.width*277/W);
    for(let y=0,n=0;y<cv.height;y+=ph,n++){const hh=Math.min(ph,cv.height-y),c=document.createElement('canvas');c.width=cv.width;c.height=hh;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,hh);g.drawImage(cv,0,y,cv.width,hh,0,0,cv.width,hh);if(n)pdf.addPage();pdf.addImage(c.toDataURL('image/jpeg',.92),'JPEG',10,10,W,hh*W/cv.width)}
    return pdf.output('datauristring').split(',')[1]}finally{box.remove()}}
/* PDF를 바로 내려받기(인쇄창을 거치지 않음). btn 을 주면 만드는 동안 비활성화 */
async function savePdf(S,btn){const t=btn&&btn.textContent;if(btn){btn.disabled=true;btn.textContent='PDF 만드는 중…'}
  try{const b64=await makePdf(S),bin=atob(b64),u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);
    const url=URL.createObjectURL(new Blob([u8],{type:'application/pdf'})),a=document.createElement('a');a.href=url;a.download=fname(S)+'.pdf';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)}
  catch(e){alert((e&&e.message)||String(e)||'PDF를 만들지 못했습니다. 잠시 후 다시 시도하거나 [인쇄]를 이용해 주세요.')}
  finally{if(btn){btn.disabled=false;btn.textContent=t}}}
