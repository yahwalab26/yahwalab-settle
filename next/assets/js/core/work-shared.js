/* core/work-shared.js — 작품 화면 공용(pct·KD·CFURL)
   index.html 또는 core/loader.js의 순서대로 로드(앞 파일의 변수·함수를 뒤 파일이 전역으로 씀). 순서를 바꾸면 깨질 수 있음 */

const pct=r=>Math.round(Number(r)*1000)/10+'%',KD={base:'기본',special:'특약'};
let CFURL=null;
