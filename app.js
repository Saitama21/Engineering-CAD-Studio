(() => {
'use strict';
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const state = {
  params:{outer:82.5,pcd:58,bore:25,thickness:36,bossH:12,holes:4,angle:45,hole:9},
  precision:3, density:7850, material:'Сталь 45', unit:'мм', history:[], future:[], selectedTool:'select', theme:'dark'
};
const defaults = JSON.parse(JSON.stringify(state.params));
const fitData={
  'Ø25 H7':{lower:0,upper:.021},'Ø25 H8':{lower:0,upper:.033},'Ø25 H9':{lower:0,upper:.052},
  'Ø25 h6':{lower:-.013,upper:0},'Ø25 g6':{lower:-.020,upper:-.007},'Ø25 k6':{lower:.002,upper:.015},'Ø25 p6':{lower:.022,upper:.035}
};
const materialNames={'7850':'Сталь 45','7930':'AISI 304','8000':'AISI 316L','2700':'Алюминий 6061','8500':'Латунь','1140':'Полиамид PA6'};

function clamp(n,min,max){return Math.min(max,Math.max(min,n));}
function num(v,fallback=0){const n=Number(String(v).replace(',','.'));return Number.isFinite(n)?n:fallback;}
function fmt(v,p=3){return Number(v).toFixed(p);}
function snapshot(){return JSON.stringify({params:state.params,density:state.density,material:state.material,unit:state.unit});}
function pushHistory(){state.history.push(snapshot());if(state.history.length>30)state.history.shift();state.future=[];}
function applySnapshot(raw){try{const s=JSON.parse(raw);Object.assign(state.params,s.params||{});state.density=s.density||7850;state.material=s.material||'Сталь 45';state.unit=s.unit||'мм';syncInputs();renderAll();}catch{}}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),1800);}
function saveLocal(silent=false){const payload={params:state.params,precision:state.precision,density:state.density,material:state.material,unit:state.unit,project:$('#projectNameTop').textContent,ts:Date.now()};localStorage.setItem('engineering-studio-project',JSON.stringify(payload));if(!silent)toast('Проект сохранён локально');}
function loadLocal(){try{const p=JSON.parse(localStorage.getItem('engineering-studio-project'));if(!p)return;Object.assign(state.params,p.params||{});state.precision=p.precision??3;state.density=p.density??7850;state.material=p.material||materialNames[String(state.density)]||'Сталь 45';state.unit=p.unit||'мм';if(p.project){$('#projectNameTop').textContent=p.project;$('#projectNameTree').textContent=p.project;$('#projectNameInput').value=p.project;}}catch{}}
function syncInputs(){$$('[data-param]').forEach(i=>{const k=i.dataset.param;i.value=k==='holes'?Math.round(state.params[k]):fmt(state.params[k],3)});$('#materialSelect').value=String(state.density);$('#densityText').textContent=state.density;$('#treeMaterial').textContent=state.material;$$('[data-live="bore"]').forEach(e=>e.textContent=fmt(state.params.bore,0));$$('[data-live="holes"]').forEach(e=>e.textContent=Math.round(state.params.holes));$$('#precisionRow button').forEach(b=>b.classList.toggle('active',Number(b.dataset.precision)===state.precision));}

function renderSketch(){
  const g=$('#sketchGeometry'), d=$('#sketchDims');
  const p=state.params; const cx=450,cy=260; const scale=3.45;
  const R=clamp(p.outer*scale/2,65,175), pcdR=clamp(p.pcd*scale/2,30,R-18), boreR=clamp(p.bore*scale/2,18,R-24), holeR=clamp(p.hole*scale/2,7,22); const n=clamp(Math.round(p.holes),1,16);
  let holes='';
  for(let i=0;i<n;i++){const a=(-90+i*360/n)*Math.PI/180;const x=cx+pcdR*Math.cos(a),y=cy+pcdR*Math.sin(a);holes+=`<circle cx="${x}" cy="${y}" r="${holeR}" fill="none" stroke="#eef5ff" stroke-width="2"/><circle cx="${x}" cy="${y}" r="3" fill="#ea5866"/>`;}
  g.innerHTML=`
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="rgba(255,255,255,.025)" stroke="#e6edf6" stroke-width="2.4"/>
    <circle cx="${cx}" cy="${cy}" r="${pcdR}" fill="none" stroke="#60738a" stroke-width="1.2" stroke-dasharray="7 7"/>
    <circle cx="${cx}" cy="${cy}" r="${boreR}" fill="#07101a" stroke="#f3f7fc" stroke-width="2.2"/>
    <circle cx="${cx}" cy="${cy}" r="${Math.max(boreR+20,R*.34)}" fill="none" stroke="#6f829a" stroke-width="1.2"/>
    ${holes}`;
  const top=cy-R,left=cx-R,right=cx+R;
  d.innerHTML=`
    <line x1="${left}" y1="${top-48}" x2="${right}" y2="${top-48}" stroke="#6cff3a" marker-start="url(#arrowGreen)" marker-end="url(#arrowGreen)"/>
    <line x1="${left}" y1="${top-58}" x2="${left}" y2="${top-28}" stroke="#6cff3a"/><line x1="${right}" y1="${top-58}" x2="${right}" y2="${top-28}" stroke="#6cff3a"/>
    <text x="${cx}" y="${top-58}" text-anchor="middle" fill="#6cff3a" font-size="17">${fmt(p.outer,3)}</text>
    <line x1="${cx-pcdR}" y1="${top-18}" x2="${cx+pcdR}" y2="${top-18}" stroke="#28a8ff" marker-start="url(#arrowBlue)" marker-end="url(#arrowBlue)"/>
    <text x="${cx}" y="${top-28}" text-anchor="middle" fill="#28a8ff" font-size="15">${fmt(p.pcd,3)}</text>
    <line x1="${cx}" y1="${cy}" x2="${cx+boreR}" y2="${cy-boreR*.12}" stroke="#28a8ff" marker-end="url(#arrowBlue)"/>
    <text x="${cx+boreR+26}" y="${cy-boreR*.12-8}" fill="#28a8ff" font-size="15">Ø${fmt(p.bore,3)} H7</text>
    <line x1="${cx+pcdR*.7}" y1="${cy-pcdR*.7}" x2="${right+55}" y2="${top+60}" stroke="#6cff3a"/>
    <text x="${right+60}" y="${top+58}" fill="#6cff3a" font-size="15">${n}×Ø${fmt(p.hole,3)}</text>`;
}

function renderModel(){
  const p=state.params; const g=$('#modelGroup'); const cx=450, cy=135; const rx=clamp(p.outer*3.1,190,300), ry=rx*.34; const thick=clamp(p.thickness*.5,10,34); const bossRx=clamp(rx*.38,80,120), bossRy=bossRx*.34; const boreRx=clamp(p.bore*2.2,35,bossRx-24), boreRy=boreRx*.34; const pcdRx=clamp(p.pcd/p.outer*rx,70,rx-40), pcdRy=pcdRx*.34; const n=clamp(Math.round(p.holes),1,16); const holeRx=clamp(p.hole*1.9,11,28), holeRy=holeRx*.34;
  let holes='';
  for(let i=0;i<n;i++){const a=(-90+i*360/n)*Math.PI/180;const x=cx+pcdRx*Math.cos(a),y=cy+pcdRy*Math.sin(a);holes+=`<ellipse cx="${x}" cy="${y}" rx="${holeRx}" ry="${holeRy}" fill="url(#metalInner)" stroke="#d1d6dd" stroke-width="1.5"/>`;}
  g.innerHTML=`
    <ellipse cx="${cx}" cy="${cy+thick+48}" rx="${rx*.85}" ry="${ry*.72}" fill="#000" opacity=".44" filter="url(#softShadow)"/>
    <path d="M ${cx-rx},${cy} A ${rx},${ry} 0 0 0 ${cx+rx},${cy} L ${cx+rx},${cy+thick} A ${rx},${ry} 0 0 1 ${cx-rx},${cy+thick} Z" fill="url(#metalSide)"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#metalTop)" stroke="#dbe0e6" stroke-width="1.2"/>
    ${holes}
    <path d="M ${cx-bossRx},${cy-3} A ${bossRx},${bossRy} 0 0 0 ${cx+bossRx},${cy-3} L ${cx+bossRx},${cy-30} A ${bossRx},${bossRy} 0 0 1 ${cx-bossRx},${cy-30} Z" fill="url(#metalSide)"/>
    <ellipse cx="${cx}" cy="${cy-30}" rx="${bossRx}" ry="${bossRy}" fill="url(#metalTop)" stroke="#e0e4e9" stroke-width="1.2"/>
    <ellipse cx="${cx}" cy="${cy-30}" rx="${boreRx}" ry="${boreRy}" fill="url(#metalInner)" stroke="#e8edf2" stroke-width="1.3"/>
  `;
}
function renderMass(){
  const p=state.params; const R=p.outer/2/1000, r=p.bore/2/1000, h=p.thickness/1000, bossR=Math.max(p.bore/2+10,p.outer*.19)/1000, bossH=p.bossH/1000, holeR=p.hole/2/1000, n=clamp(Math.round(p.holes),1,16);
  let v=Math.PI*(R*R-r*r)*h + Math.PI*Math.max(0,bossR*bossR-r*r)*bossH - n*Math.PI*holeR*holeR*h; v=Math.max(v,0); const mass=v*state.density; const cm3=v*1e6;
  $('#volumeResult').textContent=`${fmt(cm3,3)} см³`;$('#massResult').textContent=`${fmt(mass,3)} кг`;$('#ringMass').textContent=fmt(mass,2);$('#densityText').textContent=state.density;$('#treeMaterial').textContent=state.material;
}
function safeEval(expr){
  let s=String(expr).replace(/,/g,'.').replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/π/gi,'pi');
  if(!/^[0-9+\-*/().\s_a-zA-Z]+$/.test(s))throw new Error('Недопустимый символ');
  const names={pi:Math.PI,e:Math.E,sqrt:Math.sqrt,sin:(x)=>Math.sin(x*Math.PI/180),cos:(x)=>Math.cos(x*Math.PI/180),tan:(x)=>Math.tan(x*Math.PI/180),abs:Math.abs};
  const fn=Function(...Object.keys(names),`"use strict"; return (${s});`);const v=fn(...Object.values(names));if(!Number.isFinite(v))throw new Error('Ошибка расчёта');return v;
}
function renderCalc(){try{const v=safeEval($('#calcExpr').value);$('#calcResult').textContent=fmt(v,state.precision);}catch{$('#calcResult').textContent='—';}}
function renderChain(){
  const expr=$('#chainExpr').value;try{const v=safeEval(expr);$('#chainResult').textContent=fmt(v,3);$('#chainMin').textContent=fmt(v-.035,3);$('#chainMax').textContent=fmt(v+.035,3);const terms=expr.match(/[+-]?\s*\d+(?:\.\d+)?/g)||[];$('#chainTerms').innerHTML=terms.slice(0,6).map(t=>`<span>${t.trim()}</span>`).join('');}catch{$('#chainResult').textContent='—';$('#chainTerms').textContent='Проверьте выражение';}
}
function renderFits(){
  const h=fitData[$('#holeFit').value]||fitData['Ø25 H7']; const s=fitData[$('#shaftFit').value]||fitData['Ø25 h6'];
  $('#fitUpper').textContent=`${h.upper>=0?'+':''}${fmt(h.upper,3)} мм`;$('#fitLower').textContent=`${h.lower>=0?'':''}${fmt(h.lower,3)} мм`;$('#fitMax').textContent=`${fmt(25+h.upper,3)} мм`;$('#fitMin').textContent=`${fmt(25+h.lower,3)} мм`;
  const minGap=(25+h.lower)-(25+s.upper),maxGap=(25+h.upper)-(25+s.lower);$('#fitType').textContent=minGap>0?'с зазором':maxGap<0?'с натягом':'переходная';
}
function renderAll(){renderSketch();renderModel();renderMass();renderCalc();renderChain();renderFits();}

function bind(){
  $$('[data-param]').forEach(inp=>inp.addEventListener('change',()=>{pushHistory();const k=inp.dataset.param;let v=num(inp.value,state.params[k]);if(k==='holes')v=clamp(Math.round(v),1,16);else v=clamp(v,.001,10000);state.params[k]=v;syncInputs();renderAll();saveLocal(true);}));
  $('#resetParamsBtn').addEventListener('click',()=>{pushHistory();state.params={...defaults};syncInputs();renderAll();saveLocal(true);toast('Параметры сброшены');});
  $('#calcExpr').addEventListener('input',renderCalc);$('#chainExpr').addEventListener('input',renderChain);
  $('#precisionRow').addEventListener('click',e=>{const b=e.target.closest('[data-precision]');if(!b)return;state.precision=Number(b.dataset.precision);syncInputs();renderCalc();});
  $('#keypad').addEventListener('click',e=>{const b=e.target.closest('[data-key]');if(!b)return;const k=b.dataset.key,input=$('#calcExpr');if(k==='C')input.value='';else if(k==='='){renderCalc();return;}else if(k==='neg'){const v=num(input.value,NaN);if(Number.isFinite(v))input.value=String(-v);}else input.value+=k;renderCalc();input.focus();});
  $('#clearChainBtn').addEventListener('click',()=>{$('#chainExpr').value='';renderChain();});
  $('#holeFit').addEventListener('change',renderFits);$('#shaftFit').addEventListener('change',renderFits);
  $('#materialSelect').addEventListener('change',e=>{pushHistory();state.density=Number(e.target.value);state.material=materialNames[e.target.value];renderMass();syncInputs();saveLocal(true);});
  $('#saveBtn').addEventListener('click',()=>saveLocal(false));
  $('#undoBtn').addEventListener('click',()=>{if(!state.history.length)return toast('Нет действий для отмены');state.future.push(snapshot());applySnapshot(state.history.pop());toast('Отменено');});
  $('#redoBtn').addEventListener('click',()=>{if(!state.future.length)return toast('Нет действий для повтора');state.history.push(snapshot());applySnapshot(state.future.pop());toast('Повторено');});
  $('#themeBtn').addEventListener('click',()=>{state.theme=state.theme==='dark'?'light':'dark';$('#appShell').classList.toggle('light',state.theme==='light');});
  $('#settingsBtn').addEventListener('click',()=>$('#settingsDialog').showModal());
  $('#applySettingsBtn').addEventListener('click',e=>{e.preventDefault();const n=$('#projectNameInput').value.trim()||'Безымянный проект';$('#projectNameTop').textContent=n;$('#projectNameTree').textContent=n;state.unit=$('#unitSelect').value;$('#calcUnit').textContent=state.unit;$('#settingsDialog').close();saveLocal(true);toast('Настройки применены');});
  $$('.tool').forEach(b=>b.addEventListener('click',()=>{$$('.tool').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.selectedTool=b.dataset.tool;$('#toolStatus').textContent={select:'Выбор',line:'Линия',dimension:'Размер',circle:'Окружность',rect:'Прямоугольник',arc:'Дуга',trim:'Обрезать',constraint:'Связь'}[state.selectedTool]||'Инструмент';}));
  $('#sketchSvg').addEventListener('pointermove',e=>{const r=e.currentTarget.getBoundingClientRect();const x=(e.clientX-r.left)/r.width*900,y=(e.clientY-r.top)/r.height*520;$('#coordX').textContent=fmt((x-450)/3.45,3);$('#coordY').textContent=fmt((260-y)/3.45,3);});
  $('#sketchSvg').addEventListener('click',()=>{if(state.selectedTool!=='select')toast(`Инструмент «${$('#toolStatus').textContent}» активен — демо построения`);});
  $$('.mode-tab,.mobile-dock button').forEach(b=>b.addEventListener('click',()=>activateMode(b.dataset.mode)));
  $$('.rail-item[data-panel]').forEach(b=>b.addEventListener('click',()=>{const p=b.dataset.panel;if(p==='calculator')document.querySelector('.calc-panel').scrollIntoView({behavior:'smooth'});else if(p==='materials')document.querySelector('.mass-panel').scrollIntoView({behavior:'smooth'});else if(p==='tolerances')document.querySelector('.tolerance-panel').scrollIntoView({behavior:'smooth'});else toast(`Раздел «${b.textContent.trim()}» открыт в рабочем пространстве`);}));
  $$('.formula-grid button').forEach(b=>b.addEventListener('click',()=>{toast(`Формула: ${b.querySelector('b').textContent}`);}));
  $$('.feature-strip button').forEach(b=>b.addEventListener('click',()=>toast(`Операция «${b.textContent.trim()}» добавлена в демо-дерево`)));
  window.addEventListener('beforeunload',()=>{if($('#autoSaveToggle').checked)saveLocal(true);});
}
function activateMode(mode){
  $$('.mode-tab,.mobile-dock button').forEach(x=>x.classList.toggle('active',x.dataset.mode===mode));
  const map={sketch:['.cad-panel','Эскиз1'],model:['.model-panel','3D Модель'],drawing:['.cad-panel','Чертёж'],calc:['.calc-panel','Расчёты'],analysis:['.chain-panel','Анализ'],materials:['.mass-panel','Материалы']};
  const [sel,title]=map[mode]||map.sketch; const el=$(sel); if(innerWidth<981&&el)el.scrollIntoView({behavior:'smooth',block:'start'}); $('#cadTitle').textContent=mode==='drawing'?'Чертёж · вид сверху':'Эскиз1';toast(title);
}
function boot(){loadLocal();syncInputs();bind();renderAll();if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});}
boot();
})();
