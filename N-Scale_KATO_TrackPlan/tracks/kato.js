/* 軌道檔：KATO Unitrack（N 規，軌距 9 mm，單位 mm）
   新增其他品牌或零件組時，複製此檔改名（例如 tracks/tomix.js），
   再把路徑加進 index.html 的 TRACK_FILES 即可。可用的函式：
   - reg(id,name,cat,conns,paths)   登記軌道零件
       conns = [[x,y,角度],...]  接合端（局部座標，角度為出口方向）
       paths = [{f:起點接合端序號,t:終點接合端序號,pts:[[x,y],...]},...]
   - arcPts(R,角度,方向)             產生圓弧點列（方向 1=右彎、-1=左彎）
   - registerStation({id,name,cat,L,W,mesh})  登記月台（無軌道，只有外觀）
   - registerPreset({n,d,f})         登記預設軌道組
       f 內可用 A(id,x,y,rot) 放第一塊、B/seq 接續、rep(id,n) 重複 */
(function(){

/* ---------- 直線 ---------- */
[248,186,124,62,64.5].forEach(L=>reg('S'+L,'直線 S'+L,'直線',[[0,0,180],[L,0,0]],[{f:0,t:1,pts:[[0,0],[L,0]]}]));

/* ---------- 曲線 [半徑, 角度] ---------- */
[[249,45],[282,45],[315,45],[348,45],[381,45],[414,15],[481,15],[718,15],[718,45]].forEach(([R,A])=>{
  const p=arcPts(R,A),e=p[p.length-1];
  reg(`R${R}_${A}`,`R${R} ${A}°`,'曲線',[[0,0,180],[e[0],e[1],A]],[{f:0,t:1,pts:p}])});

/* ---------- #4 道岔（右／左） ---------- */
[['TR',1,'右'],['TL',-1,'左']].forEach(([id,s,n])=>{
  const p=arcPts(718,15,s),e=p[p.length-1];
  reg(id,`#4 道岔(${n})`,'道岔',[[0,0,180],[186,0,0],[e[0],e[1],s*15]],[{f:0,t:1,pts:[[0,0],[186,0]]},{f:0,t:2,pts:p}]);
  CAT[id].sw=true});

/* ---------- 90° 交叉 ---------- */
reg('X90','90° 交叉','特殊',[[-31,0,180],[31,0,0],[0,-31,270],[0,31,90]],[{f:0,t:1,pts:[[-31,0],[31,0]]},{f:2,t:3,pts:[[0,-31],[0,31]]}]);

/* ---------- 島式月台（局部座標：x 0..L、y ±W/2；無接合端） ---------- */
const SL=372,SW=26;
function signTex(){const c=document.createElement('canvas');c.width=256;c.height=64;const x=c.getContext('2d');
  x.fillStyle='#1d5e3a';x.fillRect(0,0,256,64);x.strokeStyle='#fff';x.lineWidth=4;x.strokeRect(3,3,250,58);
  x.fillStyle='#fff';x.textAlign='center';x.textBaseline='middle';x.font='bold 34px sans-serif';x.fillText('KATO 駅',128,30);
  x.font='12px sans-serif';x.fillText('かとう',128,52);return new THREE.CanvasTexture(c)}
function stationMesh(){const g3=new THREE.Group(),L=SL,Wd=SW;
  const M=(c,o)=>new THREE.MeshLambertMaterial(Object.assign({color:c},o||{}));
  const add=(geo,c,x,y,z,o)=>{const m=new THREE.Mesh(geo,M(c,o));m.position.set(x,y,z);g3.add(m);return m};
  const bx=(a,b,c)=>new THREE.BoxGeometry(a,b,c);
  add(bx(L,8,Wd),0xbfc3c8,L/2,4,0);
  [-1,1].forEach(s=>{add(bx(L,.4,2),0xf1c40f,L/2,8.2,s*(Wd/2-2));add(bx(L,1.2,.8),0x9aa0a6,L/2,7.4,s*(Wd/2+.1))});
  for(let k=0;k<7;k++){const x=30+k*50;[-1,1].forEach(s=>{const c=new THREE.Mesh(new THREE.CylinderGeometry(.9,.9,26,10),M(0x8a9199));c.position.set(x,21,s*7);g3.add(c)})}
  add(bx(320,1.6,Wd-4),0x3d6f9e,180,34.8,0);
  [-1,1].forEach(s=>add(bx(322,2.4,1),0xe9eced,180,34,s*((Wd-4)/2)));
  add(bx(320,1,3),0x2c557c,180,36,0);
  [90,186,282].forEach(x=>{add(bx(10,1,3),0x7a5230,x,11,0);add(bx(10,2.4,.8),0x7a5230,x,13,-1.4);[-4,4].forEach(d=>add(bx(.8,3,2.6),0x444a50,x+d,9.5,0))});
  [60,180,300].forEach(x=>add(bx(6,.6,2),0xfff6d0,x,33.6,0,{emissive:0xffeeaa}));
  const tex=signTex();[110,250].forEach(x=>{
    add(bx(.8,3,.8),0x555b61,x,32.6,0);
    [0,Math.PI].forEach(r=>{const p=new THREE.Mesh(new THREE.PlaneGeometry(40,10),new THREE.MeshBasicMaterial({map:tex,side:THREE.FrontSide}));p.position.set(x,28,r?-.5:.5);p.rotation.y=r;g3.add(p)})});
  add(bx(20,22,18),0xe9dfc8,360,19,0);add(bx(23,2.2,21),0xa04a3a,360,31,0);
  add(bx(.6,9,8),0x2a3340,349.7,13,0);
  return g3}
registerStation({id:'STN',name:'島式月台',cat:'特殊',L:SL,W:SW,mesh:stationMesh});

/* ---------- 預設軌道組 ---------- */
registerPreset({n:'M1 基本環形',d:'R315-45 ×8 + S248 ×6（預設，省略平交道與入電軌）',f:()=>{
  const i=A('S248',0,0,0);seq(i,['S248','S248',...rep('R315_45',4),'S248','S248','S248',...rep('R315_45',4)])}});

registerPreset({n:'M1 + V1 島式車站',d:'內側 M1 環線 R315、外側 V1 環線 R381，中間為島式月台',f:()=>{
  const i=A('S248',0,0,0);seq(i,['S248','S248',...rep('R315_45',4),'S248','S248','S248',...rep('R315_45',4)]);
  const j=A('S248',0,-66,0);seq(j,['S248','S248',...rep('R381_45',4),'S248','S248','S248',...rep('R381_45',4)]);
  A('STN',186,-33,0)}});

registerPreset({n:'雙線同心環形',d:'內 R315、外 R348，兩條獨立環線',f:()=>{
  const i=A('S248',0,0,0);seq(i,['S248','S248',...rep('R315_45',4),'S248','S248','S248',...rep('R315_45',4)]);
  const j=A('S248',0,-33,0);seq(j,['S248','S248',...rep('R348_45',4),'S248','S248','S248',...rep('R348_45',4)])}});

registerPreset({n:'M1 + 側線(道岔)',d:'上方直線加裝 #4 左道岔與側線',f:()=>{
  const i=A('S248',0,0,0),t=B(i,1,'TL',0);
  seq(t,['S248','S248','S62',...rep('R315_45',4),'S248','S248','S248',...rep('R315_45',4)]);
  const br=B(t,2,'R718_15',0);seq(br,['S248','S124'])}});

registerPreset({n:'大型環形',d:'R381-45 ×8 + S248 ×8',f:()=>{
  const i=A('S248',0,0,0);seq(i,['S248','S248','S248',...rep('R381_45',4),...rep('S248',4),...rep('R381_45',4)])}});

registerPreset({n:'小圓環',d:'R249-45 ×8 圓形',f:()=>{
  const i=A('R249_45',0,0,0);seq(i,rep('R249_45',7))}});

})();
