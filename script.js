/* Full corrected Euler graph code */

const canvas=document.getElementById("canvas");
const ctx=canvas.getContext("2d");
canvas.width=canvas.clientWidth;
canvas.height=canvas.clientHeight;

let mode="node";
let state={nodes:[],edges:[],nextNodeId:1,nextEdgeId:1};

let hover=null;
let dragging=null;
let highlightEdges=[];
let animIndex=-1;
let animTimer=null;

document.querySelectorAll(".mode").forEach(b=>{
 b.onclick=()=>{
   document.querySelectorAll(".mode").forEach(x=>x.classList.remove("active"));
   b.classList.add("active");
   mode=b.id.replace("btn-","");
 };
});

document.querySelectorAll(".tab-btn").forEach(b=>{
 b.onclick=()=>{
   document.querySelectorAll(".tab-btn").forEach(x=>x.classList.remove("active"));
   document.querySelectorAll(".tab").forEach(x=>x.classList.remove("visible"));
   b.classList.add("active");
   document.getElementById(b.dataset.tab).classList.add("visible");
 };
});

document.getElementById("btn-clear").onclick=()=>{state={nodes:[],edges:[],nextNodeId:1,nextEdgeId:1};updateInfo();draw();};
document.getElementById("btn-sample").onclick=loadSample;
document.getElementById("btn-check").onclick=checkEuler;
document.getElementById("btn-run").onclick=runEuler;

canvas.addEventListener("pointerdown",e=>{
 const p=pos(e); const n=nodeAt(p.x,p.y);
 if(mode==="node" && !n){
   state.nodes.push({id:state.nextNodeId++,x:p.x,y:p.y});
 }
 if(mode==="edge" && n){
   if(!window._edgeStart) window._edgeStart=n;
   else{
     if(window._edgeStart.id!==n.id){
       state.edges.push({id:state.nextEdgeId++,a:window._edgeStart.id,b:n.id});
     }
     window._edgeStart=null;
   }
 }
 if(mode==="move" && n){
   dragging=n;
   dragging.offx=p.x-n.x;
   dragging.offy=p.y-n.y;
 }
 if(mode==="delete"){
   if(n){
     state.edges=state.edges.filter(e=>e.a!==n.id && e.b!==n.id);
     state.nodes=state.nodes.filter(x=>x.id!==n.id);
   } else{
     const ed=edgeAt(p.x,p.y);
     if(ed) state.edges=state.edges.filter(e=>e.id!==ed.id);
   }
 }

 updateInfo();
 draw();
});

canvas.addEventListener("pointermove",e=>{
 const p=pos(e);
 hover={node:nodeAt(p.x,p.y),edge:edgeAt(p.x,p.y)};
 if(dragging){
   dragging.x=p.x-dragging.offx;
   dragging.y=p.y-dragging.offy;
 }
 draw();
});

canvas.addEventListener("pointerup",()=> dragging=null);

function pos(e){const r=canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
function nodeAt(x,y){return state.nodes.find(n=>Math.hypot(n.x-x,n.y-y)<=20);}
function edgeAt(x,y){
 for(const e of state.edges){
   const a=findNode(e.a), b=findNode(e.b);
   if(distPointToSeg({x,y},a,b)<6) return e;
 }
 return null;
}
function findNode(id){return state.nodes.find(n=>n.id===id);}

function draw(){
 ctx.clearRect(0,0,canvas.width,canvas.height);

 // normal edges
 ctx.lineWidth=2;
 ctx.strokeStyle="#94a3b8";
 state.edges.forEach(e=>{
   const a=findNode(e.a),b=findNode(e.b);
   ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
 });

 // highlighted Euler edges
 if(highlightEdges.length>0){
   for(let i=0;i<highlightEdges.length;i++){
     const eid=highlightEdges[i];
     const ed=state.edges.find(e=>e.id===eid);
     if(!ed) continue;
     const a=findNode(ed.a),b=findNode(ed.b);

     ctx.beginPath();
     ctx.lineWidth=6;
     ctx.strokeStyle=(i<=animIndex ? "#ef4444" : "#fca5a5");
     ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
   }
 }

 // nodes
 state.nodes.forEach(n=>{
   ctx.beginPath();
   ctx.fillStyle="#0ea5e9"; ctx.strokeStyle="#083344"; ctx.lineWidth=2;
   ctx.arc(n.x,n.y,20,0,Math.PI*2);
   ctx.fill(); ctx.stroke();
   ctx.fillStyle="white"; ctx.textAlign="center"; ctx.textBaseline="middle";
   ctx.fillText(n.id,n.x,n.y);
 });

 // hover
 if(hover && hover.node){
   const n=hover.node;
   ctx.beginPath();ctx.strokeStyle="#f59e0b";ctx.lineWidth=3;
   ctx.arc(n.x,n.y,25,0,Math.PI*2);ctx.stroke();
 }
 if(hover && hover.edge){
   const e=hover.edge;
   const a=findNode(e.a),b=findNode(e.b);
   ctx.beginPath();ctx.strokeStyle="#f59e0b";ctx.lineWidth=4;
   ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
 }
}

function updateInfo(){
 document.getElementById("info-deg").textContent=`Nodos: ${state.nodes.length} — Aristas: ${state.edges.length}`;
 renderAdjList();renderAdjMatrix();renderEdgeList();
}

function adjacency(){
 const m={}; state.nodes.forEach(n=>m[n.id]=[]);
 state.edges.forEach(e=>{m[e.a].push(e.b);m[e.b].push(e.a);});
 return m;
}

function renderAdjList(){
 const adj=adjacency();
 let h="<table><tr><th>Nodo</th><th>Vecinos</th></tr>";
 Object.keys(adj).forEach(k=>{h+=`<tr><td>${k}</td><td>${adj[k].join(", ")}</td></tr>`;});
 document.getElementById("adj-list").innerHTML=h+"</table>";
}

function renderAdjMatrix(){
 const ids=state.nodes.map(n=>n.id).sort((a,b)=>a-b);
 let mat=Array.from({length:ids.length},()=>Array(ids.length).fill(0));
 state.edges.forEach(e=>{
   let i=ids.indexOf(e.a),j=ids.indexOf(e.b);
   mat[i][j]=mat[j][i]=1;
 });
 let h="<table><tr><th></th>"+ids.map(i=>`<th>${i}</th>`).join("")+"</tr>";
 ids.forEach((id,r)=>{
   h+=`<tr><th>${id}</th>`+mat[r].map(v=>`<td>${v}</td>`).join("")+"</tr>";
 });
 document.getElementById("adj-matrix").innerHTML=h+"</table>";
}

function renderEdgeList(){
 let h="<table><tr><th>ID</th><th>A</th><th>B</th></tr>";
 state.edges.forEach(e=>{h+=`<tr><td>${e.id}</td><td>${e.a}</td><td>${e.b}</td></tr>`});
 document.getElementById("edge-list").innerHTML=h+"</table>";
}

function detectEuler(){
 if(!state.nodes.length) return {exists:false};
 const adj=adjacency();

 // degrees
 let deg={}; state.nodes.forEach(n=>deg[n.id]=0);
 state.edges.forEach(e=>{deg[e.a]++;deg[e.b]++;});

 // nodes with edges
 const active=state.nodes.filter(n=>deg[n.id]>0).map(n=>n.id);
 if(active.length){
   const stack=[active[0]]; const vis=new Set([active[0]]);
   while(stack.length){
     let u=stack.pop();
     for(let v of adj[u]) if(!vis.has(v)){vis.add(v);stack.push(v);}
   }
   for(let id of active) if(!vis.has(id)) return {exists:false};
 }

 const odd=Object.keys(deg).filter(k=>deg[k]%2===1);
 if(odd.length===0) return {exists:true,type:"circuit",start:parseInt(state.nodes[0].id)};
 if(odd.length===2) return {exists:true,type:"path",start:parseInt(odd[0])};
 return {exists:false};
}

function fleury(start){
 let edges=state.edges.map(e=>({...e}));
 function adjNow(){
   const m={}; state.nodes.forEach(n=>m[n.id]=[]);
   edges.forEach(e=>{m[e.a].push({id:e.id,to:e.b});m[e.b].push({id:e.id,to:e.a});});
   return m;
 }
 function isBridge(edgeId,u,v){
   const m={}; state.nodes.forEach(n=>m[n.id]=[]);
   edges.forEach(e=>{if(e.id===edgeId) return; m[e.a].push(e.b);m[e.b].push(e.a);});
   let vis=new Set([u]), st=[u];
   while(st.length){
     let x=st.pop();
     for(let w of m[x]||[]) if(!vis.has(w)){vis.add(w);st.push(w);}
   }
   return !vis.has(v);
 }
 let seq=[];
 let curr=start;

 while(edges.length){
   let adj=adjNow()[curr];
   if(!adj.length) return null;
   let pick=null;
   if(adj.length===1) pick=adj[0];
   else{
     for(let op of adj){ if(!isBridge(op.id,curr,op.to)){pick=op;break;} }
     if(!pick) pick=adj[0];
   }
   seq.push(pick.id);
   edges=edges.filter(e=>e.id!==pick.id);
   curr=pick.to;
 }
 return seq;
}

function runEuler(){
 const det=detectEuler();
 if(!det.exists){alert("No Euleriano");return;}
 const seq=fleury(det.start);
 if(!seq){alert("Error en Fleury");return;}

 highlightEdges=seq.slice();
 animIndex=-1;
 document.getElementById("euler-path").textContent="Recorrido: "+seq.join(" → ");
 animate();
}

function animate(){
 if(animTimer){clearTimeout(animTimer);}
 animIndex=-1; draw();
 const speed=parseInt(document.getElementById("speed").value);

 function step(){
   animIndex++;
   draw();
   if(animIndex<highlightEdges.length-1){
     animTimer=setTimeout(step,speed);
   }
 }
 step();
}

function checkEuler() {
  const det = detectEuler();
  const status = document.getElementById("euler-status");

  // --- Caso: NO es Euleriano ---
  if (!det.exists) {
    alert("❌ El grafo NO es Euleriano.\nDebe ser conexo y tener 0 o 2 nodos impares.");
    status.textContent = "No Euleriano";
    return;
  }

  // --- Caso: SÍ es Euleriano ---
  if (det.type === "circuit") {
    alert("✔ El grafo ES Euleriano.\nTipo: CIRCUITO (regresa al inicio).");
    status.textContent = "Circuito Euleriano";
  } 
  else if (det.type === "path") {
    alert("✔ El grafo ES Euleriano.\nTipo: CAMINO (NO regresa al inicio).");
    status.textContent = "Camino Euleriano";
  }
}


function loadSample(){
 state.nodes=[
  {id:1,x:150,y:300},{id:2,x:350,y:300},{id:3,x:250,y:150}
 ];
 state.edges=[
  {id:1,a:1,b:2},{id:2,a:2,b:3},{id:3,a:3,b:1}
 ];
 state.nextNodeId=4;state.nextEdgeId=4;
 updateInfo();draw();
}

function distPointToSeg(p,a,b){
 const vx=b.x-a.x, vy=b.y-a.y;
 const wx=p.x-a.x, wy=p.y-a.y;
 const c1=vx*wx+vy*wy;
 if(c1<=0) return Math.hypot(p.x-a.x,p.y-a.y);
 const c2=vx*vx+vy*vy;
 if(c2<=c1) return Math.hypot(p.x-b.x,p.y-b.y);
 const t=c1/c2;
 const px=a.x+t*vx, py=a.y+t*vy;
 return Math.hypot(p.x-px,p.y-py);
}

updateInfo();
draw();
