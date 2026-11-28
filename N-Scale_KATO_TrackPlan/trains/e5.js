/* 車輛檔：E5 系 はやぶさ
   新增車種時，複製此檔改名（例如 trains/n700.js），
   然後把路徑加進 index.html 的 TRAIN_FILES 即可。
   每個車輛檔必須呼叫 registerTrain({id,name,vmax,spec,mesh})：
   - id    車種代號
   - name  下拉選單顯示名稱
   - vmax  最高速度 km/h
   - spec(i,n)  回傳第 i 節（共 n 節）的規格，需含 L（車長 mm）、head、tail，
                可選 eye、eh（車頭視角位置）
   - mesh(spec) 回傳該節的 THREE.Group（車頭朝 +x，軌面在 y=0）*/
(function(){
const E5COL=[0xe9eced,0xe2518c,0x2a8f5f,0x24805a]; // 白(下半) / 粉紅線 / 飛鳥綠(車身) / 飛鳥綠(車頂)
const E5SEG=[4,1,5,5];
const E5H={y0:7.5,h:22.5,hw:11.15,Ln:100};

function loftMesh(st,capA,capB,capCol=0x20262c){
  const pos=[],col=[],idx=[],c=new THREE.Color(),N=4;let R=0;
  st.forEach(s=>{
    const bnd=[0,s.sp[0],s.sp[1],s.sp[2],1],ents=[];
    for(let j=0;j<4;j++)for(let i=0;i<=E5SEG[j];i++)ents.push({u:bnd[j]+(bnd[j+1]-bnd[j])*i/E5SEG[j],c:j});
    const ring=[...ents.map(o=>({o,sd:1})),...ents.slice().reverse().map(o=>({o,sd:-1}))];R=ring.length;
    ring.forEach(({o,sd})=>{
      const e=2*o.u-1,r=s.hw*Math.pow(Math.max(0,1-Math.pow(Math.abs(e),N)),1/N);
      pos.push(s.x,s.yb+(s.yt-s.yb)*o.u,sd*r);c.setHex(E5COL[o.c]);col.push(c.r,c.g,c.b)})});
  for(let i=0;i<st.length-1;i++)for(let k=0;k<R;k++){const a=i*R+k,b=i*R+(k+1)%R,cc=(i+1)*R+(k+1)%R,d=(i+1)*R+k;idx.push(a,b,cc,a,cc,d)}
  const cap=i=>{const s=st[i],ci=pos.length/3;pos.push(s.x,(s.yt+s.yb)/2,0);c.setHex(capCol);col.push(c.r,c.g,c.b);for(let k=0;k<R;k++)idx.push(ci,i*R+k,i*R+(k+1)%R)};
  if(capA)cap(0);if(capB)cap(st.length-1);
  const gm=new THREE.BufferGeometry();gm.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));gm.setAttribute('color',new THREE.Float32BufferAttribute(col,3));gm.setIndex(idx);gm.computeVertexNormals();
  return new THREE.Mesh(gm,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}))}

function noseSec(t){const {y0,h,hw}=E5H,cl=(v,a,b)=>Math.min(b,Math.max(a,v));
  const yb=y0+h*.2*Math.pow(t,2.6),yt=y0+h*(1-.6*Math.pow(t,1.9)),w=Math.max(2.8,hw*Math.pow(1-Math.pow(t,1.7),.55));
  const f=a=>cl((y0+h*a-yb)/(yt-yb),.03,.97);
  const a1=.34-.2*Math.pow(t,1.4),a2=a1+.08*(1-.3*t);
  const l1=f(a1),l2=Math.max(f(a2),l1+.03),l3=Math.max(Math.min(f(.9),.95),l2+.03);
  return{yb,yt,hw:w,sp:[l1,l2,l3]}}

function e5Nose(x0,dir){const {Ln}=E5H,o=[],n=24;for(let i=0;i<=n;i++){const t=i/n,s=noseSec(t);o.push({x:x0+dir*t*Ln,yb:s.yb,yt:s.yt,hw:s.hw,sp:s.sp})}return o}

function e5Mesh(sp){const g3=new THREE.Group(),L=sp.L,{y0,h,hw,Ln}=E5H,w=hw*2,hd=sp.head,tl=sp.tail,xa=-L/2+(tl?Ln:0),xb=L/2-(hd?Ln:0),cx=(xa+xb)/2;
  const M=(c,o)=>new THREE.MeshLambertMaterial(Object.assign({color:c},o||{}));
  const box=(a,b,c,col,x,y,z,o)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(a,b,c),M(col,o));m.position.set(x,y,z);g3.add(m);return m};
  g3.add(loftMesh([xa,xb].map(x=>({x,yb:y0,yt:y0+h,hw,sp:[.34,.42,.9]})),true,true));
  const addNose=(x0,dir,lamp,emis)=>{
    g3.add(loftMesh(e5Nose(x0,dir),false,true,0xdfe3e6));
    const sv=noseSec(.43),slope=dir*(-h*.6*1.9*Math.pow(.43,.9))/Ln;
    const fr=box(27,1.6,17,0x9aa5ab,x0+dir*Ln*.43,sv.yt-.6,0);fr.rotation.z=Math.atan(slope);
    const gl=box(24,2.4,14,0x101822,x0+dir*Ln*.43,sv.yt-.6,0);gl.rotation.z=Math.atan(slope);
    const sf=noseSec(.56),sl2=box(10,1.6,12.5,0x101822,x0+dir*Ln*.56,sf.yt-.6,0);sl2.rotation.z=-dir*.42;
    const sn=noseSec(.9),ym=(sn.yb+sn.yt)/2;
    [-1,1].forEach(z=>box(2.4,1.6,2.2,lamp,x0+dir*Ln*.9,ym,z*2.4,{emissive:emis}))};
  if(hd)addNose(xb,1,0xfffbe0,0xffffaa);
  if(tl)addNose(xa,-1,0xff3030,0xaa0000);
  const len=xb-xa-16;
  if(len>30){const pitch=7.2,n=Math.floor(len/pitch);
    for(let k=0;k<n;k++){const x=cx-len/2+(k+.5)*len/n;if(Math.abs(Math.abs(x-cx)-.3*len)<6)continue;box(4.4,h*.14,w+.3,0x1a2530,x,y0+h*.62,0)}
    [-.3,.3].forEach(f=>[-3.4,3.4].forEach(d=>box(.5,h*.5,w+.2,0x66727a,cx+f*len+d,y0+h*.36,0)))}
  if(!hd)box(3,h*.85,w*.9,0x20262c,L/2+.5,y0+h*.45,0);
  if(!tl)box(3,h*.85,w*.9,0x20262c,-L/2-.5,y0+h*.45,0);
  box(L*.42,3,w*.72,0x2b3138,cx,y0-1.2,0);
  [-1,1].forEach(s=>{const bx=s*L*.33;box(20,2.4,w*.72,0x20252b,bx,y0-2,0);
    [-5.5,5.5].forEach(ax=>{const c=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.5,10.4,12),M(0x2d3339));c.rotation.x=Math.PI/2;c.position.set(bx+ax,6.2,0);g3.add(c)})});
  if(sp.pan){const yr=y0+h,px=0,gr=0x8a9199;box(12,1.3,8,0x4a525a,px,yr+.6,0);
    const arm=(x,y,len2,ang)=>{const m=box(len2,.9,.9,gr,x,y,0);m.rotation.z=ang};
    arm(px+2,yr+3.7,6.1,2.28);arm(px+1.75,yr+8.5,6.1,.96);box(1.6,.6,10,0x30363c,px+3.6,yr+11.2,0);
    [-1,1].forEach(s=>box(1.2,2.2,1.2,0xcfd4d8,px-3,yr+2,s*3))}
  return g3}

registerTrain({
  id:'e5',
  name:'E5系 はやぶさ (新幹線)',
  vmax:320,
  spec(i,n){const hd=i===0,tl=i===n-1;
    return{e5:1,L:(hd||tl)?178:167,head:hd,tail:tl,pan:(i===3||i===6),eye:178/2-45,eh:E5H.y0+E5H.h*.7}},
  mesh(sp){return e5Mesh(sp)}
});
})();
