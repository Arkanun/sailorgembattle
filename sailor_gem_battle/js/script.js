const GEMS=['❤️','💙','💚','💛','💜','🤍','🟠','⭐'];
const GEM_COLORS={'❤️':'#ff4444','💙':'#4488ff','💚':'#44cc44','💛':'#ffcc00','💜':'#aa44ff','🤍':'#ccccff','🟠':'#ff8800','⭐':'#ffdd00'};
const COLS=8,ROWS=9,CELL=48;
let boards=[null,null,null],scores=[0,0,0],lines=[0,0,0],charges=[0,0,0];
let timeLeft=90,timerInterval=null,gameRunning=false,processing=[false,false,false];
let aiDiff='easy',aiTimeout=null;
const DIFF={easy:{delay:2200,missChance:.45,thinkTime:1800},medium:{delay:1400,missChance:.2,thinkTime:1100},hard:{delay:700,missChance:.04,thinkTime:500}};

let particles=[];
let fxCtx,fxCanvas;

function setDiff(d){
  aiDiff=d;
  ['easy','medium','hard'].forEach(x=>{
    ['diff-','ov-'].forEach(p=>{const b=document.getElementById(p+x);if(b)b.className='diff-btn'+(x===d?' active':'');});
  });
}

function initBg(){
  const c=document.getElementById('bg-canvas');
  c.width=1200;
  c.height=700;
  const ctx=c.getContext('2d');

  // FUNDO BASE ESCURO
  ctx.fillStyle="#020818";
  ctx.fillRect(0,0,1200,700);

  // LADO ESQUERDO (AZUL)
  const gLeft=ctx.createRadialGradient(250,350,50,250,350,500);
  gLeft.addColorStop(0,'rgba(0,150,255,0.6)');
  gLeft.addColorStop(1,'rgba(0,0,50,0)');
  ctx.fillStyle=gLeft;
  ctx.fillRect(0,0,1200,700);

  // LADO DIREITO (VERDE)
  const gRight=ctx.createRadialGradient(950,350,50,950,350,500);
  gRight.addColorStop(0,'rgba(0,255,150,0.6)');
  gRight.addColorStop(1,'rgba(0,50,0,0)');
  ctx.fillStyle=gRight;
  ctx.fillRect(0,0,1200,700);

  // LINHA CENTRAL (DIVISÃO)
  const midGlow=ctx.createLinearGradient(590,0,610,0);
  midGlow.addColorStop(0,'transparent');
  midGlow.addColorStop(0.5,'rgba(255,255,255,0.2)');
  midGlow.addColorStop(1,'transparent');
  ctx.fillStyle=midGlow;
  ctx.fillRect(580,0,40,700);

  // ESTRELAS
  for(let i=0;i<200;i++){
    ctx.beginPath();
    ctx.arc(Math.random()*1200,Math.random()*700,Math.random()*1.5+0.3,0,Math.PI*2);
    ctx.fillStyle=`rgba(255,255,255,${Math.random()*0.8})`;
    ctx.fill();
  }

  // PARTÍCULAS COLORIDAS
  for(let i=0;i<60;i++){
    ctx.beginPath();
    ctx.arc(Math.random()*600,Math.random()*700,Math.random()*2+1,0,Math.PI*2);
    ctx.fillStyle='rgba(0,180,255,0.5)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(600+Math.random()*600,Math.random()*700,Math.random()*2+1,0,Math.PI*2);
    ctx.fillStyle='rgba(0,255,150,0.5)';
    ctx.fill();
  }

  // GLOW CENTRAL (tipo coração)
  const centerGlow=ctx.createRadialGradient(600,350,10,600,350,200);
  centerGlow.addColorStop(0,'rgba(255,100,200,0.5)');
  centerGlow.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=centerGlow;
  ctx.fillRect(0,0,1200,700);

  // FX canvas
  fxCanvas=document.getElementById('fx-canvas');
  fxCanvas.width=1200;
  fxCanvas.height=700;
  fxCtx=fxCanvas.getContext('2d');

  requestAnimationFrame(fxLoop);
}

class Particle{
  constructor(x,y,color,type='spark'){
    this.x=x;this.y=y;this.color=color;this.type=type;
    this.life=1;
    if(type==='spark'){
      const a=Math.random()*Math.PI*2;const s=2+Math.random()*5;
      this.vx=Math.cos(a)*s;this.vy=Math.sin(a)*s-2;
      this.size=2+Math.random()*4;this.decay=.03+Math.random()*.04;
    } else if(type==='ring'){
      this.r=4;this.maxR=28+Math.random()*16;this.decay=.04;this.size=2;
    } else if(type==='star'){
      const a=Math.random()*Math.PI*2;const s=1+Math.random()*3;
      this.vx=Math.cos(a)*s;this.vy=Math.sin(a)*s-3;
      this.size=4+Math.random()*6;this.decay=.025+Math.random()*.03;this.rot=Math.random()*Math.PI;
    } else if(type==='trail'){
      this.vx=(Math.random()-.5)*2;this.vy=-1-Math.random()*2;
      this.size=2+Math.random()*3;this.decay=.05+Math.random()*.05;
    }
  }
  update(){
    this.life-=this.decay;
    if(this.type==='spark'||this.type==='trail'){this.x+=this.vx;this.y+=this.vy;this.vy+=.15;this.vx*=.97;}
    else if(this.type==='star'){this.x+=this.vx;this.y+=this.vy;this.vy+=.08;this.rot+=.1;}
    else if(this.type==='ring'){this.r+=( this.maxR-this.r)*.15;}
    return this.life>0;
  }
  draw(ctx){
    ctx.save();ctx.globalAlpha=Math.max(0,this.life);
    if(this.type==='ring'){
      ctx.strokeStyle=this.color;ctx.lineWidth=2;ctx.beginPath();
      ctx.arc(this.x,this.y,this.r,0,Math.PI*2);ctx.stroke();
    } else if(this.type==='star'){
      ctx.translate(this.x,this.y);ctx.rotate(this.rot);
      ctx.fillStyle=this.color;ctx.beginPath();
      for(let i=0;i<5;i++){
        ctx.lineTo(Math.cos((i*4*Math.PI/5)-Math.PI/2)*this.size,Math.sin((i*4*Math.PI/5)-Math.PI/2)*this.size);
        ctx.lineTo(Math.cos((i*4*Math.PI/5+Math.PI/5)-Math.PI/2)*this.size*.4,Math.sin((i*4*Math.PI/5+Math.PI/5)-Math.PI/2)*this.size*.4);
      }
      ctx.closePath();ctx.fill();
    } else {
      ctx.fillStyle=this.color;ctx.beginPath();
      ctx.arc(this.x,this.y,Math.max(0,this.size*this.life),0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }
}

function spawnMatchFX(boardEl,indices,board,combo){
  const gr=document.getElementById('game').getBoundingClientRect();
  const br=boardEl.getBoundingClientRect();
  const gems=boardEl.querySelectorAll('.gem');
  indices.forEach(idx=>{
    const g=gems[idx];if(!g)return;
    const r2=g.getBoundingClientRect();
    const cx=r2.left-gr.left+r2.width/2;
    const cy=r2.top-gr.top+r2.height/2;
    const gemType=board[Math.floor(idx/COLS)][idx%COLS];
    const col=GEM_COLORS[gemType]||'#ffffff';
    for(let i=0;i<14;i++)particles.push(new Particle(cx,cy,col,'spark'));
    for(let i=0;i<6;i++)particles.push(new Particle(cx,cy,col,'trail'));
    particles.push(new Particle(cx,cy,col,'ring'));
    if(combo>=2){for(let i=0;i<4;i++)particles.push(new Particle(cx,cy,'#ffd740','star'));}
    if(combo>=3){particles.push(new Particle(cx,cy,'#ffffff','ring'));particles.push(new Particle(cx,cy,col,'ring'));}
  });
}

function spawnSkillFX(x,y,color){
  for(let i=0;i<30;i++)particles.push(new Particle(x,y,color,'spark'));
  for(let i=0;i<10;i++)particles.push(new Particle(x,y,color,'star'));
  for(let i=0;i<3;i++){const p=new Particle(x,y,color,'ring');p.maxR=50+i*20;particles.push(p);}
}

function fxLoop(){
  fxCtx.clearRect(0,0,1200,700);
  particles=particles.filter(p=>{const alive=p.update();if(alive)p.draw(fxCtx);return alive;});
  requestAnimationFrame(fxLoop);
}

function showComboText(p,combo){
  const board=document.getElementById('board'+p);
  const rect=board.getBoundingClientRect();
  const gr=document.getElementById('game').getBoundingClientRect();
  const d=document.createElement('div');d.className='combo-popup';
  const size=combo>=4?32:combo>=3?26:20;
  const color=combo>=4?'#ff6b35':combo>=3?'#ffd740':'#fff';
  d.style.cssText=`font-size:${size}px;color:${color};text-shadow:0 0 12px ${color};`;
  d.textContent=combo>=2?(combo+'x COMBO!'):'MATCH!';
  d.style.left=(rect.left-gr.left+rect.width/2-60)+'px';
  d.style.top=(rect.top-gr.top+rect.height/2-20)+'px';
  document.getElementById('game').appendChild(d);
  setTimeout(()=>d.remove(),1000);
}

function randGem(){return GEMS[Math.floor(Math.random()*GEMS.length)];}
function mkBoard(){const b=[];for(let r=0;r<ROWS;r++){b.push([]);for(let c=0;c<COLS;c++)b[r].push(randGem());}return b;}
function noMatches(b){
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS-2;c++)if(b[r][c]===b[r][c+1]&&b[r][c]===b[r][c+2])return false;
  for(let r=0;r<ROWS-2;r++)for(let c=0;c<COLS;c++)if(b[r][c]===b[r+1][c]&&b[r][c]===b[r+2][c])return false;
  return true;
}
function mkSafeBoard(){let b;do{b=mkBoard();}while(!noMatches(b));return b;}

function renderBoard(p,animFall){
  const el=document.getElementById('board'+p);
  const aiEl=p===2?document.getElementById('aiThinking'):null;
  el.innerHTML='';if(aiEl)el.appendChild(aiEl);
  const b=boards[p];
  for(let r=0;r<ROWS;r++){
    for(let c=0;c<COLS;c++){
      const g=document.createElement('div');g.className='gem';
      if(animFall&&animFall.has(r*COLS+c))g.classList.add('falling');
      g.textContent=b[r][c];g.dataset.r=r;g.dataset.c=c;
      el.appendChild(g);
    }
  }
   if(p===1)setupDrag(el,p);
}

function getGemEl(p,r,c){return document.getElementById('board'+p).querySelectorAll('.gem')[r*COLS+c];}

function setupDrag(el,p){
  let dragStart=null,dragGem=null;
  function getCell(clientX,clientY){
    const rect=el.getBoundingClientRect();
    const x=clientX-rect.left-5,y=clientY-rect.top-5;
    const c=Math.floor(x/CELL),r=Math.floor(y/CELL);
    if(r>=0&&r<ROWS&&c>=0&&c<COLS)return{r,c};
    return null;
  }
  function onStart(e){
    if(!gameRunning||processing[p])return;
    e.preventDefault();
    const pt=e.touches?e.touches[0]:e;
    const cell=getCell(pt.clientX,pt.clientY);
    if(!cell)return;
    dragStart=cell;
    dragGem=getGemEl(p,cell.r,cell.c);
    if(dragGem){dragGem.classList.add('dragging');dragGem.classList.add('drag-hint');}
  }
  function onMove(e){
    if(!dragStart)return;e.preventDefault();
    const pt=e.touches?e.touches[0]:e;
    const cell=getCell(pt.clientX,pt.clientY);
    if(!cell||!dragStart)return;
    const dr=cell.r-dragStart.r,dc=cell.c-dragStart.c;
    if(Math.abs(dr)+Math.abs(dc)>=1){
      let tr=dragStart.r,tc=dragStart.c;
      if(Math.abs(dc)>=Math.abs(dr)){tc+=dc>0?1:-1;}
      else{tr+=dr>0?1:-1;}
      if(tr>=0&&tr<ROWS&&tc>=0&&tc<COLS){
        if(dragGem){dragGem.classList.remove('dragging');dragGem.classList.remove('drag-hint');}
        const s={...dragStart};
        dragStart=null;dragGem=null;
        doSwap(p,s.r,s.c,tr,tc);
      }
    }
  }
  function onEnd(){
    if(dragGem){dragGem.classList.remove('dragging');dragGem.classList.remove('drag-hint');}
    dragStart=null;dragGem=null;
  }
  el.addEventListener('mousedown',onStart);
  el.addEventListener('mousemove',onMove);
  el.addEventListener('mouseup',onEnd);
  el.addEventListener('mouseleave',onEnd);
  el.addEventListener('touchstart',onStart,{passive:false});
  el.addEventListener('touchmove',onMove,{passive:false});
  el.addEventListener('touchend',onEnd);
}

async function doSwap(p,r1,c1,r2,c2){
  if(processing[p])return;
  processing[p]=true;
  const b=boards[p];
  const g1=getGemEl(p,r1,c1),g2=getGemEl(p,r2,c2);
  const dc=c2-c1,dr=r2-r1;
  if(g1){g1.classList.add(dr===0?(dc>0?'swap-right':'swap-left'):(dr>0?'swap-down':'swap-up'));}
  if(g2){g2.classList.add(dr===0?(dc>0?'swap-left':'swap-right'):(dr>0?'swap-up':'swap-down'));}
  await sleep(130);
  [b[r1][c1],b[r2][c2]]=[b[r2][c2],b[r1][c1]];
  if(findMatches(b).length===0){
    [b[r1][c1],b[r2][c2]]=[b[r2][c2],b[r1][c1]];
    processing[p]=false;renderBoard(p);
    if(p===2)scheduleAI();return;
  }
  renderBoard(p);
  await processMatches(p);
  processing[p]=false;
  if(p===2)scheduleAI();
}

function findMatches(b){
  const m=new Set();
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS-2;c++)if(b[r][c]&&b[r][c]===b[r][c+1]&&b[r][c]===b[r][c+2]){let e=c+2;while(e+1<COLS&&b[r][e+1]===b[r][c])e++;for(let k=c;k<=e;k++)m.add(r*COLS+k);}
  for(let c=0;c<COLS;c++)for(let r=0;r<ROWS-2;r++)if(b[r][c]&&b[r][c]===b[r+1][c]&&b[r][c]===b[r+2][c]){let e=r+2;while(e+1<ROWS&&b[e+1][c]===b[r][c])e++;for(let k=r;k<=e;k++)m.add(k*COLS+c);}
  return [...m];
}

async function processMatches(p){
  const b=boards[p];const boardEl=document.getElementById('board'+p);let combo=0;
  while(true){
    const matches=findMatches(b);if(!matches.length)break;
    combo++;
    const pts=matches.length*100*combo+(combo>=3?500:combo>=2?200:0);
    scores[p]+=pts;lines[p]+=Math.floor(matches.length/3);charges[p]=Math.min(100,charges[p]+matches.length*8);
    updateHUD(p);
    spawnMatchFX(boardEl,matches,b,combo);
    const gems=boardEl.querySelectorAll('.gem');
    matches.forEach(idx=>{if(gems[idx])gems[idx].classList.add('match-out');});
    showComboText(p,combo);
    await sleep(380);
    matches.forEach(idx=>{b[Math.floor(idx/COLS)][idx%COLS]=null;});
    const fallen=new Set();
    for(let c=0;c<COLS;c++){let e=ROWS-1;for(let r=ROWS-1;r>=0;r--){if(b[r][c]!==null){if(e!==r){b[e][c]=b[r][c];b[r][c]=null;fallen.add(e*COLS+c);}e--;}}for(let r=e;r>=0;r--){b[r][c]=randGem();fallen.add(r*COLS+c);}}
    renderBoard(p,fallen);
    await sleep(220);
  }
  if(p===2&&charges[2]>=100){await sleep(300);useSkillAI();}
}

function scoreMove(b,r1,c1,r2,c2){const cp=b.map(r=>[...r]);[cp[r1][c1],cp[r2][c2]]=[cp[r2][c2],cp[r1][c1]];const m=findMatches(cp);return m.length===0?-1:m.length;}
function findBestMove(b){let mv=[];for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){if(c+1<COLS){const s=scoreMove(b,r,c,r,c+1);if(s>0)mv.push({r1:r,c1:c,r2:r,c2:c+1,score:s});}if(r+1<ROWS){const s=scoreMove(b,r,c,r+1,c);if(s>0)mv.push({r1:r,c1:c,r2:r+1,c2:c,score:s});}}if(!mv.length)return null;mv.sort((a,b)=>b.score-a.score);return mv[0];}
function findRandomMove(b){let mv=[];for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){if(c+1<COLS&&scoreMove(b,r,c,r,c+1)>0)mv.push({r1:r,c1:c,r2:r,c2:c+1});if(r+1<ROWS&&scoreMove(b,r,c,r+1,c)>0)mv.push({r1:r,c1:c,r2:r+1,c2:c});}if(!mv.length)return null;return mv[Math.floor(Math.random()*mv.length)];}

function scheduleAI(){if(!gameRunning)return;clearTimeout(aiTimeout);aiTimeout=setTimeout(doAIMove,DIFF[aiDiff].delay);}

async function doAIMove(){
  if(!gameRunning||processing[2])return;
  const cfg=DIFF[aiDiff];
  const thinkEl=document.getElementById('aiThinking');
  if(thinkEl)thinkEl.classList.add('show');
  await sleep(cfg.thinkTime);
  if(!gameRunning){if(thinkEl)thinkEl.classList.remove('show');return;}
  if(thinkEl)thinkEl.classList.remove('show');
  const b=boards[2];
  let move=Math.random()<cfg.missChance?findRandomMove(b)||findBestMove(b):findBestMove(b)||findRandomMove(b);
  if(!move){scheduleAI();return;}
  const g1=getGemEl(2,move.r1,move.c1),g2=getGemEl(2,move.r2,move.c2);
  if(g1)g1.classList.add('ai-hint');await sleep(250);if(g1)g1.classList.remove('ai-hint');
  if(g2)g2.classList.add('ai-hint');await sleep(180);if(g2)g2.classList.remove('ai-hint');
  await doSwap(2,move.r1,move.c1,move.r2,move.c2);
}

function updateHUD(p){
  document.getElementById('score'+p).textContent=scores[p].toString().padStart(7,'0').replace(/\B(?=(\d{3})+(?!\d))/g,',');
  document.getElementById('lines'+p).textContent=lines[p];
  document.getElementById('charge'+p).style.width=charges[p]+'%';
  if(p===1)document.getElementById('skillBtn1').disabled=charges[p]<100;
}

function useSkill(p){
  if(p!==1||charges[1]<100||processing[1])return;
  charges[1]=0;updateHUD(1);
  const b=boards[1];const col=Math.floor(Math.random()*COLS);
  const gr=document.getElementById('game').getBoundingClientRect();
  const br=document.getElementById('board1').getBoundingClientRect();
  const cx=br.left-gr.left+(col*CELL)+CELL/2;const cy=br.top-gr.top+ROWS*CELL/2;
  spawnSkillFX(cx,cy,'#4fc3f7');
  for(let r=0;r<ROWS;r++)b[r][col]=null;
  const f=new Set();for(let r=0;r<ROWS;r++){b[r][col]=randGem();f.add(r*COLS+col);}
  scores[1]+=ROWS*150;updateHUD(1);renderBoard(1,f);
}

function useSkillAI(){
  if(charges[2]<100)return;charges[2]=0;updateHUD(2);
  const b=boards[2];const sr=Math.floor(Math.random()*(ROWS-2)),sc=Math.floor(Math.random()*(COLS-2));
  const gr=document.getElementById('game').getBoundingClientRect();
  const br=document.getElementById('board2').getBoundingClientRect();
  const cx=br.left-gr.left+(sc+1)*CELL;const cy=br.top-gr.top+(sr+1)*CELL;
  spawnSkillFX(cx,cy,'#69f0ae');
  const f=new Set();
  for(let r=sr;r<sr+3;r++)for(let c=sc;c<sc+3;c++){b[r][c]=randGem();f.add(r*COLS+c);}
  scores[2]+=9*150;updateHUD(2);renderBoard(2,f);
}

function updateTimer(){
  const m=Math.floor(timeLeft/60),s=timeLeft%60;
  document.getElementById('timer').textContent=m+':'+(s<10?'0':'')+s;
  if(timeLeft<=10)document.getElementById('timer').style.color='#ef5350';
  if(timeLeft<=0)endGame();
  timeLeft--;
}

function endGame(){
  clearInterval(timerInterval);clearTimeout(aiTimeout);gameRunning=false;
  let winner='',wc='#ffd740';
  if(scores[1]>scores[2]){winner='VOCÊ VENCEU!';wc='#4fc3f7';}
  else if(scores[2]>scores[1]){winner='CPU VENCEU!';wc='#69f0ae';}
  else winner='EMPATE!';
  const ov=document.getElementById('overlay');
  ov.innerHTML=`<div style="text-align:center"><div style="font-size:50px">&#127942;</div><h2 style="color:${wc}">${winner}</h2></div>
  <div style="display:flex;gap:36px;text-align:center">
    <div><div style="color:#4fc3f7;font-size:22px;font-weight:700">${scores[1].toLocaleString()}</div><div style="font-size:11px;color:#78909c">VOCÊ</div></div>
    <div style="color:#546e7a;font-size:22px;align-self:center">VS</div>
    <div><div style="color:#69f0ae;font-size:22px;font-weight:700">${scores[2].toLocaleString()}</div><div style="font-size:11px;color:#78909c">CPU</div></div>
  </div>
  <div class="diff-row">
    <span class="diff-label">DIFICULDADE:</span>
    <button class="diff-btn${aiDiff==='easy'?' active':''}" id="ov-easy" onclick="setDiff('easy')">FÁCIL</button>
    <button class="diff-btn${aiDiff==='medium'?' active':''}" id="ov-medium" onclick="setDiff('medium')">MÉDIO</button>
    <button class="diff-btn${aiDiff==='hard'?' active':''}" id="ov-hard" onclick="setDiff('hard')">DIFÍCIL</button>
  </div>
  <button class="start-btn" onclick="startGame()">&#9654; JOGAR NOVAMENTE</button>`;
  ov.style.display='flex';
}

function startGame(){
  scores=[0,0,0];lines=[0,0,0];charges=[0,0,0];processing=[false,false,false];timeLeft=90;
  clearTimeout(aiTimeout);boards[1]=mkSafeBoard();boards[2]=mkSafeBoard();
  renderBoard(1);renderBoard(2);updateHUD(1);updateHUD(2);
  document.getElementById('timer').style.color='#e0e0e0';
  document.getElementById('overlay').style.display='none';
  clearInterval(timerInterval);timerInterval=setInterval(updateTimer,1000);
  gameRunning=true;scheduleAI();
}

function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
initBg();