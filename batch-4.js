// Endless Etch — batch 4. 48 subjects for 2026-11-14 (each plays about three times, shuffled per round) plus the Daily Super Sketch.
// Helpers live inside this closure so etch-core.js stays unchanged; only ETCH_BATCH is defined at top level.
var ETCH_BATCH = (function(){
// ---- batch-local helpers (kept inside this file so etch-core.js stays unchanged) ----
var PI=Math.PI;
function A(s,x){for(var i=0;i<x.length;i++)s.push(x[i]);return s;}
function F(s,P,g,a){s.push(poly(P));if(g)A(s,hatch(P,g,a||0));return s;}
function H(s,P,g,a){A(s,hatch(P,g,a||0));return s;}
function EP(cx,cy,rx,ry){var p=ellipse(cx,cy,rx,ry);p.pop();return p;}
function RR(R,a,b){return a+(b-a)*R();}
function RI(R,a,b){return Math.floor(a+(b-a+1)*R());}
function pick(R,a){return a[Math.floor(R()*a.length)];}
function sgn(R){return R()<0.5?-1:1;}
// crescent shading on one side of an ellipse (side 1 = right, -1 = left)
function shadeE(s,cx,cy,rx,ry,g,a,side,k){k=k==null?0.3:k;side=side||1;
  var P=side>0?arc(cx,cy,rx,ry,-PI/2,PI/2).concat(arc(cx,cy,rx*k,ry,PI/2,-PI/2)):arc(cx,cy,rx,ry,PI/2,1.5*PI).concat(arc(cx,cy,rx*k,ry,1.5*PI,PI/2));
  return H(s,P,g,a);}
// even-odd hatch over several polygons (outer shape plus holes)
function hatchEO(polys,gap,ang){var a=(ang||0)*PI/180,c=Math.cos(-a),sn=Math.sin(-a);
  var PP=polys.map(function(P){return P.map(function(p){return [p[0]*c-p[1]*sn,p[0]*sn+p[1]*c];});});
  var minY=1e9,maxY=-1e9;PP[0].forEach(function(p){minY=Math.min(minY,p[1]);maxY=Math.max(maxY,p[1]);});
  var out=[],cur=null,dir=1,row=0;
  for(var y=minY+gap/2;y<maxY;y+=gap){var xs=[];
    PP.forEach(function(P){for(var i=0;i<P.length;i++){var p=P[i],q=P[(i+1)%P.length];if((p[1]<=y&&q[1]>y)||(q[1]<=y&&p[1]>y))xs.push(p[0]+(y-p[1])/(q[1]-p[1])*(q[0]-p[0]));}});
    xs.sort(function(m,n){return m-n;});
    if(xs.length===2){if(!cur){cur=[];out.push(cur);}if(dir>0)cur.push([xs[0],y],[xs[1],y]);else cur.push([xs[1],y],[xs[0],y]);dir=-dir;}
    else{cur=null;for(var j=0;j+1<xs.length;j+=2){if(xs[j+1]-xs[j]<0.8)continue;out.push(row%2?[[xs[j+1],y],[xs[j],y]]:[[xs[j],y],[xs[j+1],y]]);}}
    row++;}
  var ci=Math.cos(a),si=Math.sin(a);
  return out.map(function(st){return st.map(function(p){return [p[0]*ci-p[1]*si,p[0]*si+p[1]*ci];});});}
function HX(s,polys,g,a){return A(s,hatchEO(polys,g,a));}
// serpentine of horizontal rows across [x0,x1] from y0 to y1 (one stroke)
function rows(x0,x1,y0,y1,gap){var p=[],d=1;for(var y=y0;y<=y1+0.01;y+=gap){if(d>0)p.push([x0,y],[x1,y]);else p.push([x1,y],[x0,y]);d=-d;}return p;}
// serpentine of wave rows (water), one stroke
function waterS(R,x0,x1,y0,y1,gap,amp){var p=[],d=1,i=0;for(var y=y0;y<=y1+0.01;y+=gap){var w=wave(x0,x1,y,amp*(0.6+0.5*R()),RR(R,10,22),R()*6);if(d<0)w.reverse();A(p,w);d=-d;i++;}return p;}
// one-stroke brick wall
function brickS(x0,y0,x1,y1,bw,bh){var p=[],row=0,d=1;for(var y=y0;y<y1-0.01;y+=bh){var yb=Math.min(y1,y+bh),off=(row%2)*bw/2,xs=[];for(var x=x0+off+bw;x<x1-1;x+=bw)xs.push(x);
  if(d<0)xs.reverse();p.push(d>0?[x0,y]:[x1,y]);xs.forEach(function(x){p.push([x,y],[x,yb],[x,y]);});p.push(d>0?[x1,y]:[x0,y]);p.push(d>0?[x1,yb]:[x0,yb]);d=-d;row++;}
  p.push(d>0?[x1,y1]:[x0,y1]);return p;}
// one-stroke row of teeth along a baseline: fence pickets, railings, shingles
function comb(x0,x1,y,h,step){var p=[[x0,y]];for(var x=x0+step/2;x<x1;x+=step){p.push([x,y],[x,y-h],[x,y]);}p.push([x1,y]);return p;}
function scallopRows(x0,x1,y0,y1,w,h){var p=[],d=1;for(var y=y0;y<=y1;y+=h){var r=[];for(var x=x0;x+w<=x1+0.01;x+=w)A(r,arc(x+w/2,y,w/2,h*0.9,PI,0));if(d<0)r.reverse();A(p,r);d=-d;}return p;}
// ground band: horizon line plus hatched ground
function ground(s,R,y,g,a){s.push([[4,y],[296,y]]);return H(s,[[4,y],[296,y],[296,196],[4,196]],g||RR(R,3.2,4.2),a==null?RR(R,10,28)*sgn(R):a);}
// perspective furrows/floorboards from a vanishing point above the horizon (one stroke)
function furrows(s,R,y,n,vx){vx=vx==null?RR(R,100,200):vx;var vy=y-RR(R,50,110),t=(y-vy)/(196-vy),p=[];
  for(var i=0;i<=n;i++){var xb=4+i*292/n,xh=vx+(xb-vx)*t;if(i%2)p.push([xb,196],[xh,y]);else p.push([xh,y],[xb,196]);}
  s.push([[4,y],[296,y]]);s.push(p);return s;}
// floor: perspective boards plus cross lines getting wider toward the viewer
function floorS(s,R,y,n){furrows(s,R,y,n);var m=RI(R,5,7),p=[],d=1;for(var j=1;j<=m;j++){var yy=y+(196-y)*Math.pow(j/m,1.5);if(d>0)p.push([4,yy],[296,yy]);else p.push([296,yy],[4,yy]);d=-d;}s.push(p);return s;}
// rolling hills behind: silhouette from edge to edge, hatched lightly
function hills(s,R,y,hmax,g,holes,ang){var pts=[],n=RI(R,2,4),ph=R()*6;for(var x=4;x<=296.1;x+=4){var h=0;for(var k=1;k<=n;k++)h+=Math.sin(x/300*PI*k*1.3+ph*k)/k;pts.push([x,y-hmax*(0.55+0.45*h/1.6)]);}
  pts=pts.map(function(p){return [p[0],Math.min(y,p[1])];});s.push(pts);if(g!==0)HX(s,[pts.concat([[296,y],[4,y]])].concat(holes||[]),g||4,ang||0);return pts;}
// sky bands: horizontal lines from edge to edge, spacing widening upward (one stroke)
function skyS(y0,y1,g0,g1){var p=[],d=1,y=y1,g=g0;while(y>y0){if(d>0)p.push([4,y],[296,y]);else p.push([296,y],[4,y]);d=-d;y-=g;g=Math.min(g1,g*1.25);}return p;}
// a sun on the horizon with rays, attached to the horizon line
function sunH(s,cx,y,r){s.push(arc(cx,y,r,r,PI,TAU));for(var k=1;k<8;k++){var a=PI+k*PI/8;s.push([[cx+(r+3)*Math.cos(a),y+(r+3)*Math.sin(a)],[cx+(r+9)*Math.cos(a),y+(r+9)*Math.sin(a)]]);}return s;}
// round tree: scalloped crown hatched, trunk to ground
function treeR(s,R,x,b,sz,g){var cy=b-sz*1.6,rx=sz,ry=sz*0.85;s.push([[x-2,b],[x-2,cy+ry*0.6],[x+2,cy+ry*0.6],[x+2,b]]);var c=scallop(x,cy,rx,ry,RI(R,7,10),0.12);s.push(c);H(s,c.slice(0,-1),g||2.4,RR(R,30,60));return s;}
function pineT(s,x,b,sz,g){var P=pine(x,b,sz);A(s,P);if(g)for(var i=1;i<P.length;i++)H(s,P[i].slice(0,3),g,0);return s;}
// a 3D box: front face (x,y,w,h) with top and side depth d (side shaded)
function box3(s,x,y,w,h,d,g,side){side=side||1;var dx=d*side,dy=-d*0.6;s.push(rect(x,y,x+w,y+h));
  var top=side>0?[[x,y],[x+dx,y+dy],[x+w+dx,y+dy],[x+w,y]]:[[x+w,y],[x+w+dx,y+dy],[x+dx,y+dy],[x,y]];s.push(top);
  var sx=side>0?x+w:x,sideP=[[sx,y],[sx+dx,y+dy],[sx+dx,y+h+dy],[sx,y+h]];s.push(sideP);if(g)H(s,sideP,g,90);return s;}
// cylinder standing on base y with radius rx, height h; shaded side
function cyl(s,cx,b,rx,h,g,side){var ry=rx*0.28;s.push(ellipse(cx,b-h,rx,ry));s.push([[cx-rx,b-h],[cx-rx,b]].concat(arc(cx,b,rx,ry,PI,0)).concat([[cx+rx,b-h]]));
  if(g){side=side||1;var x0=side>0?cx+rx*0.35:cx-rx,x1=side>0?cx+rx:cx-rx*0.35;H(s,[[x0,b-h+ry*0.6],[x1,b-h+ry*0.6],[x1,b],[x0,b]],g,0);}return s;}
// tabletop scene: wall with wainscot, table edge
function tableS(s,R,y,kind){s.push([[4,y],[296,y]]);var y2=Math.min(194,y+RR(R,7,10));s.push([[4,y2],[296,y2]]);H(s,[[4,y],[296,y],[296,y2],[4,y2]],2,0);
  var p=[],d=1;for(var yy=y2+6;yy<196;yy+=RR(R,5,8)){if(d>0)p.push([4,yy],[296,yy]);else p.push([296,yy],[4,yy]);d=-d;}if(p.length)s.push([[4,y2],[4,p[0][1]]].concat(p));
  var W=[[4,4],[296,4],[296,y],[4,y]],holes=arguments[4]||[];
  if(kind==='stripes')HX(s,[W].concat(holes),RR(R,5.5,7.5),90);
  else if(kind==='tiles'){var g=RR(R,10,13);HX(s,[W].concat(holes),g,0);HX(s,[W].concat(holes),g,90);}
  else if(kind==='diag'){var g2=RR(R,8,10),an=RR(R,35,55);HX(s,[W].concat(holes),g2,an);HX(s,[W].concat(holes),g2,-an);}
  return s;}
// Sky / backdrop fill: rasterize the drawing, flood-fill the open area connected to the top edge,
// then lay horizontal rows through it (stopping at every line), spacing from gTop (top) to gLow (at yLow).
function skyFill(s,yLow,gTop,gLow,yTop){yTop=yTop||5;gTop=Math.min(gTop,7.5);var W=300,Hh=200,G=new Uint8Array(W*Hh);
  function mark(x,y){var xi=Math.round(x),yi=Math.round(y);for(var dy=-1;dy<=1;dy++)for(var dx=-1;dx<=1;dx++){var X=xi+dx,Y=yi+dy;if(X>=0&&X<W&&Y>=0&&Y<Hh)G[Y*W+X]=1;}}
  s.forEach(function(st){for(var i=0;i<st.length;i++){var a=st[i],b=st[i+1]||a,n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/0.5));for(var k=0;k<=n;k++)mark(a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n);}});
  (arguments[5]||[]).forEach(function(P){var x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;P.forEach(function(p){x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1]);});
    for(var yy=Math.max(0,Math.floor(y0));yy<=Math.min(Hh-1,Math.ceil(y1));yy++)for(var xx=Math.max(0,Math.floor(x0));xx<=Math.min(W-1,Math.ceil(x1));xx++)if(pip([xx,yy],P))G[yy*W+xx]=1;});
  var S=new Uint8Array(W*Hh),q=[];for(var x=4;x<=296;x++){var id=4*W+x;if(!G[id]){S[id]=1;q.push(id);}}
  while(q.length){var c=q.pop(),cx=c%W,cy=(c/W)|0;[[1,0],[-1,0],[0,1],[0,-1]].forEach(function(d){var X=cx+d[0],Y=cy+d[1];if(X<4||X>296||Y<4||Y>yLow)return;var j=Y*W+X;if(!S[j]&&!G[j]){S[j]=1;q.push(j);}});}
  var out=[],prev=null,dir=1,y=yLow-gLow*0.6;
  while(y>yTop){var yi=Math.round(y),segs=[],x0=-1;for(var x2=4;x2<=297;x2++){var on=x2<=296&&S[yi*W+x2];if(on&&x0<0)x0=x2;if(!on&&x0>=0){if(x2-1-x0>=4)segs.push([x0+(x0>4?1:0),x2-1-(x2-1<296?1:0)]);x0=-1;}}
    if(segs.length===1&&prev&&Math.abs((dir>0?segs[0][0]:segs[0][1])-prev[prev.length-1][0])<9){var sg=segs[0];if(dir>0)prev.push([sg[0],y],[sg[1],y]);else prev.push([sg[1],y],[sg[0],y]);}
    else{prev=null;segs.forEach(function(sg,i){out.push(dir>0?[[sg[0],y],[sg[1],y]]:[[sg[1],y],[sg[0],y]]);});if(segs.length===1)prev=out[out.length-1];}
    dir=-dir;var t=(yLow-y)/Math.max(1,yLow-yTop);y-=gLow+(gTop-gLow)*t;}
  A(s,out);return s;}
function pip(p,P){var x=p[0],y=p[1],c=false;for(var i=0,j=P.length-1;i<P.length;j=i++){var a=P[i],b=P[j];if(((a[1]>y)!==(b[1]>y))&&(x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]))c=!c;}return c;}
// add background strokes, cutting away every part that falls inside a foreground silhouette
function behind(s,bg,holes){bg.forEach(function(st){var d=[st[0]];for(var i=1;i<st.length;i++){var a=d[d.length-1],b=st[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1]));for(var k=1;k<=n;k++)d.push(lerp(a,b,k/n));}
  var run=[];d.forEach(function(p){var inside=false;for(var h=0;h<holes.length;h++)if(pip(p,holes[h])){inside=true;break;}if(inside){if(run.length>1)s.push(run);run=[];}else run.push(p);});if(run.length>1)s.push(run);});return s;}
// wheel: tyre ring shaded, rim, spokes
function wheel(s,cx,cy,r,n,g){s.push(circle(cx,cy,r));s.push(circle(cx,cy,r*0.72));if(g)HX(s,[EP(cx,cy,r,r),EP(cx,cy,r*0.72,r*0.72)],g,30);s.push(circle(cx,cy,r*0.18));
  for(var k=0;k<(n||0);k++){var a=k*TAU/n;s.push([[cx+r*0.18*Math.cos(a),cy+r*0.18*Math.sin(a)],[cx+r*0.72*Math.cos(a),cy+r*0.72*Math.sin(a)]]);}return s;}
// smooth closed blob through points (Catmull-Rom), returns polygon points
function blob(pts,n){n=n||8;var out=[],L=pts.length;for(var i=0;i<L;i++){var p0=pts[(i-1+L)%L],p1=pts[i],p2=pts[(i+1)%L],p3=pts[(i+2)%L];for(var k=0;k<n;k++){var t=k/n,t2=t*t,t3=t2*t;
  out.push([0.5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),0.5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)]);}}return out;}
// open smooth curve through points
function curve(pts,n){n=n||8;var out=[],L=pts.length;for(var i=0;i<L-1;i++){var p0=pts[Math.max(0,i-1)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(L-1,i+2)];for(var k=0;k<n;k++){var t=k/n,t2=t*t,t3=t2*t;
  out.push([0.5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),0.5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)]);}}out.push(pts[L-1]);return out;}
// map a shape given in local units (origin, scale, mirror)
function M(pts,ox,oy,sc,fx){fx=fx||1;return pts.map(function(p){return [ox+p[0]*sc*fx,oy+p[1]*sc];});}
// underwater: sandy seabed with ripples, rocks and kelp rising from it
function seabed(s,R,y,kelp){var bed=[];for(var x=4;x<=296;x+=4)bed.push([x,y+3*Math.sin(x/31+R()*0.2)+2*Math.sin(x/11)]);s.push(bed);var d=1,rw=[];for(var yy=y+8;yy<196;yy+=5){var w=wave(4,296,yy,1,RR(R,14,24),R()*6);if(d<0)w.reverse();A(rw,w);d=-d;}s.push([[4,bed[0][1]]].concat(rw));
  for(var k=0;k<(kelp||0);k++){var kx=RR(R,10,290),b=interpY(bed,kx),h=RR(R,50,110),pts=[];for(var t=0;t<=8;t++)pts.push([kx+6*Math.sin(t*0.9+k),b-h*t/8]);var c=curve(pts,6);s.push(c);for(var t2=2;t2<8;t2+=2){var p=c[t2*6];s.push(quad(p,[p[0]+10*(t2%4?1:-1),p[1]-6],[p[0]+14*(t2%4?1:-1),p[1]-2]));}}
  return bed;}
function eye(s,x,y,r){s.push(circle(x,y,r));H(s,EP(x,y,r*0.6,r*0.6),0.8,0);return s;}

// ---- batch 3 additions ----
// keep only the parts of background strokes that fall inside poly and outside every hole
function clipIn(s,bg,P,holes){holes=holes||[];bg.forEach(function(st){var d=[st[0]];for(var i=1;i<st.length;i++){var a=d[d.length-1],b=st[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1]));for(var k=1;k<=n;k++)d.push(lerp(a,b,k/n));}
  var run=[];d.forEach(function(p){var ok=pip(p,P);for(var h=0;ok&&h<holes.length;h++)if(pip(p,holes[h]))ok=false;if(!ok){if(run.length>1)s.push(run);run=[];}else run.push(p);});if(run.length>1)s.push(run);});return s;}
// battlement line along y from x0 to x1 (one stroke)
function merlons(x0,x1,y,h,step){var p=[[x0,y]];for(var x=x0;x+step<=x1+0.01;x+=step){p.push([x,y-h],[x+step/2,y-h],[x+step/2,y],[x+step,y]);}return p;}
// pointed (gothic) arch opening: base y, half-width w, spring height h
function gothic(cx,b,w,h){var top=b-h-w*1.5;return [[cx-w,b],[cx-w,b-h]].concat(quad([cx-w,b-h],[cx-w,top+w*0.4],[cx,top],12)).concat(quad([cx,top],[cx+w,top+w*0.4],[cx+w,b-h],12)).concat([[cx+w,b]]);}
// round-top arch opening
function archP(cx,b,w,h){return [[cx-w,b],[cx-w,b-h]].concat(arc(cx,b-h,w,w,PI,TAU)).concat([[cx+w,b]]);}
// small bird sitting on a perch line at (x,y), facing dir
function perched(s,x,y,sz,dir){var b=EP(x,y-sz*0.7,sz,sz*0.6);s.push(poly(b));H(s,b,sz*0.25,30);s.push(circle(x+dir*sz*0.9,y-sz*1.35,sz*0.4));s.push([[x-dir*sz,y-sz*0.6],[x-dir*sz*1.8,y-sz*0.2]]);s.push([[x,y-sz*0.1],[x,y]]);return s;}

// ---- batch 4 additions ----
function SOL(s,sol,P){s.push(poly(P));sol.push(P);return P;}
function sky(s,R,gy,sol){return skyFill(s,gy,RR(R,7,8.5),RR(R,4.2,5.2),5,sol||[]);}
function rot(P,cx,cy,a){return rotateAbout(P,cx,cy,a);}
function lens(p0,p1,w){var dx=p1[0]-p0[0],dy=p1[1]-p0[1],L=Math.hypot(dx,dy),nx=-dy/L*w,ny=dx/L*w,m=[(p0[0]+p1[0])/2,(p0[1]+p1[1])/2];
  return quad(p0,[m[0]+nx,m[1]+ny],p1,10).concat(quad(p1,[m[0]-nx,m[1]-ny],p0,10).slice(1));}

var SUBJ=[];
// ---- chunk A: structures and machines ----
SUBJ.push({name:'Stave church',titles:['Tarred Timber','Dragons on the Gables','Fjord Sunday','Shingles Like Scales','Midwinter Bells'],build(R){
  var s=[],sol=[],gy=RR(R,164,170),cx=RR(R,138,162),hw=RR(R,40,46),y=gy,h=RR(R,30,36);
  ground(s,R,gy);
  for(var i=0;i<3;i++){var top=y-h,W=[[cx-hw,y],[cx-hw,top],[cx+hw,top],[cx+hw,y]];SOL(s,sol,W);H(s,W,RR(R,4,5),90);
    if(i===0){var d=archP(cx,y,7,12);s.push(d);H(s,d,1.5,0);for(var j=-1;j<=1;j+=2){var wn=archP(cx+j*hw*0.6,top+h*0.62,3,4);s.push(wn);H(s,wn,1.1,0);}}
    else{for(var j2=-1;j2<=1;j2++){var wx=cx+j2*hw*0.5;var wr=rect(wx-2,top+h*0.3,wx+2,top+h*0.62);s.push(wr);H(s,wr.slice(0,4),1,0);}}
    var nhw=i<1?hw*0.68:hw*0.55,ov=RR(R,10,14),rl=top+RR(R,7,10),ru=top-RR(R,9,12),RF=[[cx-hw-ov,rl],[cx-nhw,ru],[cx+nhw,ru],[cx+hw+ov,rl]];
    SOL(s,sol,RF);clipIn(s,[scallopRows(cx-hw-ov,cx+hw+ov,ru+3,rl+2,RR(R,5,6.5),2.6)],RF);
    for(var e=-1;e<=1;e+=2){var ex=cx+e*(hw+ov);s.push(curve([[ex,rl],[ex+e*5,rl-6],[ex+e*4,rl-13],[ex+e*9,rl-18],[ex+e*14,rl-16]],6));s.push([[ex+e*9,rl-18],[ex+e*7,rl-23]]);s.push([[ex+e*14,rl-16],[ex+e*11,rl-14]]);}
    y=ru;hw=nhw;h=RR(R,18,23);}
  var sp=[[cx-hw-6,y+3],[cx,y-RR(R,40,50)],[cx+hw+6,y+3]],ty=sp[1][1];SOL(s,sol,sp);H(s,sp,RR(R,2,2.6),RR(R,50,70));s.push([[cx,ty],[cx,ty-9]]);s.push([[cx-3,ty-5],[cx+3,ty-5]]);
  [RR(R,16,34),RR(R,48,64),RR(R,236,252),RR(R,266,284)].forEach(function(x){var z=RR(R,1.1,1.5);pineT(s,x,gy,z,RR(R,2.6,3.2));sol.push([[x-15*z,gy],[x,gy-52*z],[x+15*z,gy]]);});
  s.push(comb(6,cx-58,gy,7,5));s.push(comb(cx+58,294,gy,7,5));
  return sky(s,R,gy,sol);}});

SUBJ.push({name:'Drawbridge over a canal',titles:['Up for the Barge','White Beams','Canal at Seven','Counterweight Morning','Lifting Hour'],build(R){
  var s=[],sol=[],wl=RR(R,156,162),dk=wl-RR(R,28,34),x0=RR(R,66,80),x1=300-RR(R,66,80),m=(x0+x1)/2;
  var QL=[[4,wl],[4,dk+4],[x0,dk+4],[x0,wl]],QR=[[x1,wl],[x1,dk+4],[296,dk+4],[296,wl]];
  s.push(QL);s.push(QR);s.push(brickS(4,dk+4,x0,wl,10,4.5));s.push(brickS(x1,dk+4,296,wl,10,4.5));
  var piers=[x0+(x1-x0)*0.25,x0+(x1-x0)*0.75],ph=piers.map(function(px){return [[px-4,wl],[px-4,dk+4],[px+4,dk+4],[px+4,wl]];});
  HX(s,[[[x0,dk+4],[x1,dk+4],[x1,wl],[x0,wl]]].concat(ph),RR(R,2.6,3.2),0);ph.forEach(function(P){s.push(P);});
  var D=[[x0,dk+4],[x0,dk-2],[x1,dk-2],[x1,dk+4]];SOL(s,sol,D);s.push([[x0,dk+1],[x1,dk+1]]);
  s.push(comb(x0,x1,dk-2,7,5));s.push([[x0,dk-9],[x1,dk-9]]);
  var off=(x1-x0)*0.25,lg=0,ang=RR(R,0.72,0.88);s.length=s.length;
  [-1,1].forEach(function(e){var hx=m+e*off,lf=[[hx,dk+4],[hx,dk-2],[hx+e*lg,dk-2],[hx+e*lg,dk+4]];});
  var gapP=[[m-off,dk-3],[m+off,dk-3],[m+off,dk+5],[m-off,dk+5]];
  var keep=s.splice(0,s.length);behind(s,keep,[[[m-off+0.5,dk-12],[m+off-0.5,dk-12],[m+off-0.5,dk+4.5],[m-off+0.5,dk+4.5]]]);
  [-1,1].forEach(function(e){var hx=m-e*off,ln=off+RR(R,4,8),a=-e*ang;
    var L=rot([[hx,dk+4],[hx+e*ln,dk+4],[hx+e*ln,dk-2],[hx,dk-2]],hx,dk+4,a);SOL(s,sol,L);H(s,rot([[hx,dk+4],[hx+e*ln,dk+4],[hx+e*ln,dk+1],[hx,dk+1]],hx,dk+4,a),1,0);
    var rl=[];for(var t=4;t<ln;t+=5)rl.push([[hx+e*t,dk-2],[hx+e*t,dk-8]]);rl.push([[hx,dk-8],[hx+e*ln,dk-8]]);A(s,rl.map(function(st){return rot(st,hx,dk+4,a);}));
    var tw=[[hx-e*2,dk-2],[hx-e*2,dk-30],[hx-e*10,dk-30],[hx-e*10,dk-2]];SOL(s,sol,tw);H(s,tw,1.6,90);s.push(poly([[hx-e*0,dk-30],[hx-e*6,dk-40],[hx-e*12,dk-30]]));
    var tip=rot([[hx+e*ln,dk-2]],hx,dk+4,a)[0];s.push([[hx-e*6,dk-30],tip]);});
  var bgY=wl-RR(R,4,8),bgx=m+RR(R,-10,10);var BG=[[bgx-30,wl],[bgx-26,bgY-6],[bgx+30,bgY-6],[bgx+34,wl]];
  [[4,x0+6],[x1-6,296]].forEach(function(r){var hx=r[0];while(hx<r[1]-12){var w=Math.min(RR(R,22,30),r[1]-hx),hh=RR(R,44,66),tp=dk+4-hh,pk=tp-RR(R,9,14);
    var Hs=[[hx,dk+4],[hx,tp],[hx+w/2,pk],[hx+w,tp],[hx+w,dk+4]];s.push(Hs);sol.push(Hs);s.push([[hx+w/2,pk],[hx+w/2,pk-3]]);
    for(var wy=tp+5;wy<dk-6;wy+=13)for(var wx=hx+4;wx+6<hx+w-2;wx+=10){s.push(rect(wx,wy,wx+6,wy+8));s.push([[wx+3,wy],[wx+3,wy+8]]);}
    if(R()<0.5)H(s,[[hx,tp],[hx+w/2,pk],[hx+w,tp]],1.6,0);hx+=w;}});
  var wat=waterS(R,4,296,wl+5,194,RR(R,5,6.5),1.2);s.push([[4,wl],[296,wl]]);
  behind(s,[wat],ph.map(function(P){return [[P[0][0],200],[P[0][0],wl-1],[P[2][0],wl-1],[P[2][0],200]];}));
  for(var k=0;k<2;k++){var rx=piers[k];s.push([[rx-4,wl],[rx-4,wl+RR(R,8,14)]]);s.push([[rx+4,wl],[rx+4,wl+RR(R,8,14)]]);}
  return sky(s,R,dk+4,sol);}});

SUBJ.push({name:'Railway signal box',titles:['Levers and Bells','Box at the Junction','Line Clear','The Night Turn','Arm Down, Go'],build(R){
  var s=[],sol=[],gy=RR(R,148,154),bx=RR(R,52,80),bw=RR(R,92,104),lh=RR(R,32,38),uh=RR(R,30,34),y1=gy-lh,y2=y1-uh;
  var L=[[bx,gy],[bx,y1],[bx+bw,y1],[bx+bw,gy]];SOL(s,sol,L);s.push(brickS(bx,y1,bx+bw,gy,9,4.2));
  for(var i=0;i<3;i++){var a=archP(bx+bw*(0.2+0.3*i),gy-8,4,10);s.push(a);H(s,a,1.3,0);}
  var U=[[bx-3,y1],[bx-3,y2],[bx+bw+3,y2],[bx+bw+3,y1]];SOL(s,sol,U);s.push([[bx-3,y1+2],[bx+bw+3,y1+2]]);
  var n=RI(R,7,9),pw=(bw+6)/n;for(var j=0;j<n;j++){var x=bx-3+j*pw;s.push(rect(x+1.5,y2+4,x+pw-1.5,y1-3));s.push([[x+pw/2,y2+4],[x+pw/2,y1-3]]);s.push([[x+1.5,y2+12],[x+pw-1.5,y2+12]]);
    if(R()<0.45)H(s,[[x+1.5,y2+12],[x+pw-1.5,y2+12],[x+pw-1.5,y1-3],[x+1.5,y1-3]],RR(R,1.8,2.4),RR(R,30,60));}
  var rh=RR(R,20,24),rf=[[bx-10,y2],[bx+16,y2-rh],[bx+bw-16,y2-rh],[bx+bw+10,y2]];SOL(s,sol,rf);H(s,rf,RR(R,2,2.6),RR(R,-15,15));
  var nb=rect(bx+bw*0.25,y1+5,bx+bw*0.75,y1+11);s.push(nb);s.push([[bx+bw*0.3,y1+8],[bx+bw*0.7,y1+8]]);
  var cx=bx+bw-18,ch=[[cx,y2-rh+4],[cx,y2-rh-12],[cx+8,y2-rh-12],[cx+8,y2-rh+4]];SOL(s,sol,ch);s.push(rect(cx-1,y2-rh-15,cx+9,y2-rh-12));
  var sx=bx+bw+3;s.push([[sx,y1],[sx+32,gy]]);s.push([[sx+6,y1],[sx+38,gy]]);for(var t=1;t<8;t++){var f=t/8;s.push([[sx+32*f,y1+lh*f],[sx+6+32*f,y1+lh*f]]);}
  s.push([[sx+3,y1],[sx+3,y1-12],[sx+35,gy-12],[sx+35,gy]]);
  var gx=RR(R,232,262),st=gy-RR(R,96,106);s.push([[gx-1.5,gy],[gx-1.5,st],[gx+1.5,st],[gx+1.5,gy]]);sol.push([[gx-2,gy],[gx-2,st],[gx+2,st],[gx+2,gy]]);
  var ld=[[gx+4,gy],[gx+4,st+12]];s.push(ld);s.push([[gx+9,gy],[gx+9,st+12]]);for(var r=gy-6;r>st+14;r-=6)s.push([[gx+4,r],[gx+9,r]]);
  var ang=R()<0.5?-0.5:0,arm=rot([[gx+2,st+6],[gx+36,st+6],[gx+36,st+12],[gx+2,st+12]],gx,st+9,ang);SOL(s,sol,arm);
  var st2=rot([[gx+24,st+6],[gx+29,st+6],[gx+29,st+12],[gx+24,st+12]],gx,st+9,ang);H(s,st2,1,90);
  s.push(circle(gx-6,st+16,4));s.push([[gx-2,st+16],[gx-1.5,st+16]]);s.push(arc(gx,st,3,3,PI,TAU));s.push([[gx,st-3],[gx,st-8]]);
  s.push([[gx-1.5,st+40],[gx-20,st+60],[gx-20,gy]]);
  s.push([[4,gy],[296,gy]]);var rails=[gy+14,gy+18,gy+30,gy+34];
  [[gy+12,gy+20],[gy+28,gy+36]].forEach(function(p){s.push(comb(4,296,p[1],p[1]-p[0],RR(R,7,9)));});rails.forEach(function(y){s.push([[4,y],[296,y]]);});
  H(s,[[4,gy],[296,gy],[296,gy+11],[4,gy+11]],RR(R,2.6,3.4),30);H(s,[[4,gy+38],[296,gy+38],[296,196],[4,196]],RR(R,3,4),-30);
  return sky(s,R,gy,sol);}});

SUBJ.push({name:'Oast house',titles:['Hop Kiln, Kent Road','White Cowls','September Drying','Roundel and Barn','Scent of Hops'],build(R){
  var s=[],sol=[],gy=RR(R,160,166),kx=RR(R,84,104),kr=RR(R,22,26),kh=RR(R,54,62),top=gy-kh;
  ground(s,R,gy);
  var K=[[kx-kr,gy],[kx-kr,top],[kx+kr,top],[kx+kr,gy]];sol.push(K);s.push(K);s.push(arc(kx,gy,kr,kr*0.22,PI,0));
  clipIn(s,[brickS(kx-kr,top+2,kx+kr,gy,8,4)],[[kx-kr+0.5,gy+1],[kx-kr+0.5,top],[kx+kr-0.5,top],[kx+kr-0.5,gy+1]]);
  var dr=archP(kx-6,gy,5,9);s.push(dr);H(s,dr,1.3,0);
  var ch=RR(R,42,50),C=[[kx-kr-3,top],[kx-5,top-ch],[kx+5,top-ch],[kx+kr+3,top]];SOL(s,sol,C);H(s,C,RR(R,2.2,2.8),0);H(s,[[kx+4,top-ch+2],[kx+5,top-ch],[kx+kr+3,top],[kx+kr*0.4,top]],1.4,70);
  var cy=top-ch,cw=[[kx-6,cy],[kx-8,cy-11],[kx-3,cy-18],[kx+5,cy-18],[kx+9,cy-8],[kx+7,cy]];SOL(s,sol,cw);s.push([[kx-7,cy-5],[kx+8,cy-5]]);s.push([[kx-7,cy-10],[kx+8,cy-10]]);
  var vd=R()<0.5?1:-1;s.push([[kx+(vd>0?8:-7),cy-12],[kx+vd*22,cy-14],[kx+vd*22,cy-8],[kx+(vd>0?8:-7),cy-7]]);s.push([[kx,cy-18],[kx,cy-25]]);
  var bx=kx+kr,bw=RR(R,96,112),eh=RR(R,38,44),et=gy-eh,rt=et-RR(R,26,32);
  var B=[[bx,gy],[bx,et],[bx+bw,et],[bx+bw,gy]];SOL(s,sol,B);H(s,B,RR(R,3.4,4),0);
  var RF=[[bx-2,et],[bx+10,rt],[bx+bw-10,rt],[bx+bw+4,et]];SOL(s,sol,RF);H(s,RF,RR(R,1.8,2.3),0);
  var ld=[[bx+bw*0.45,et+2],[bx+bw*0.45,et+22],[bx+bw*0.62,et+22],[bx+bw*0.62,et+2]];s.push(poly(ld));H(s,ld,1.3,90);s.push([[bx+bw*0.535,et+2],[bx+bw*0.535,rt+6],[bx+bw*0.535+14,rt+6]]);
  for(var w=0;w<2;w++){var wx=bx+bw*(0.15+w*0.7);s.push(rect(wx,gy-18,wx+10,gy-6));s.push([[wx+5,gy-18],[wx+5,gy-6]]);}
  var dx=bx+bw*0.25;s.push(rect(dx,gy-24,dx+14,gy));H(s,[[dx,gy-24],[dx+14,gy-24],[dx+14,gy],[dx,gy]],2.2,45);
  if(R()<0.7&&kx-kr>40){var k2=kx-kr-RR(R,6,10),r2=kr*0.8,t2=gy-kh*0.85;var K2=[[k2-r2,gy],[k2-r2,t2],[Math.min(k2+r2,kx-kr),t2]];s.push(K2);
    var C2=[[k2-r2-2,t2],[k2-4,t2-ch*0.85],[k2+4,t2-ch*0.85],[Math.min(k2+r2+2,kx-kr),t2]];s.push(C2);sol.push([[k2-r2,gy],[k2-r2-2,t2],[k2-4,t2-ch*0.85],[k2+4,t2-ch*0.85],[kx-kr,t2],[kx-kr,gy]]);H(s,poly(C2).slice(0,4),2.4,0);
    var c2=t2-ch*0.85;s.push([[k2-4,c2],[k2-5,c2-10],[k2+3,c2-14],[k2+6,c2-6],[k2+4,c2]]);sol.push([[k2-4,c2],[k2-5,c2-10],[k2+3,c2-14],[k2+6,c2-6],[k2+4,c2]]);}
  for(var px=bx+bw+12;px<292;px+=RR(R,11,14)){var pt=gy-RR(R,46,56);s.push([[px,gy],[px,pt]]);var b=[];for(var yy=gy;yy>pt+4;yy-=3)b.push([px+2.5*Math.sin(yy/3),yy]);s.push(b);}
  return sky(s,R,gy,sol);}});

SUBJ.push({name:'Tower crane on a building site',titles:['Steel Over the Block','Hook and Load','Topping Out','The Long Jib','Six Floors Up'],build(R){
  var s=[],sol=[],gy=RR(R,172,178),mx=RR(R,190,212),mw=9,jy=RR(R,34,42);
  s.push([[mx-mw/2,gy],[mx-mw/2,jy]]);s.push([[mx+mw/2,jy],[mx+mw/2,gy]]);var z=[],d=1;for(var y=gy;y>jy;y-=mw){z.push([mx-mw/2*d,y]);d=-d;}s.push(z);
  var jl=RR(R,14,24),cj=Math.min(292,mx+RR(R,58,70));s.push([[jl,jy],[cj,jy]]);s.push([[jl+8,jy-8],[mx,jy-8]]);
  var zz=[],dd=1;for(var x=jl+8;x<mx;x+=8){zz.push([x,dd>0?jy:jy-8]);dd=-dd;}s.push(zz);
  var ap=[[mx-mw/2,jy],[mx,jy-30],[mx+mw/2,jy]];s.push(ap);s.push([[mx,jy-30],[jl+60,jy-8]]);s.push([[mx,jy-30],[cj-6,jy]]);
  s.push([[mx,jy],[cj,jy+5]]);s.push([[mx,jy+5],[cj,jy+5]]);
  var wg=[[cj-22,jy+5],[cj-22,jy+22],[cj-4,jy+22],[cj-4,jy+5]];SOL(s,sol,wg);H(s,wg,1.4,0);s.push([[cj-22,jy+11],[cj-4,jy+11]]);s.push([[cj-22,jy+16],[cj-4,jy+16]]);
  var cab=[[mx-mw/2,jy+2],[mx-mw/2-14,jy+2],[mx-mw/2-14,jy+16],[mx-mw/2,jy+16]];SOL(s,sol,cab);H(s,[[mx-mw/2-12,jy+4],[mx-mw/2-4,jy+4],[mx-mw/2-4,jy+10],[mx-mw/2-12,jy+10]],1.2,30);
  var tx=RR(R,60,110),hy=RR(R,78,96);s.push(rect(tx-5,jy,tx+5,jy+4));s.push([[tx-2,jy+4],[tx-2,hy]]);s.push([[tx+2,jy+4],[tx+2,hy]]);s.push(rect(tx-4,hy,tx+4,hy+6));s.push(arc(tx,hy+9,3,3,-PI/2,PI));
  var lw=RR(R,34,44),ly=hy+RR(R,18,22);s.push([[tx,hy+12],[tx-lw/2,ly]]);s.push([[tx,hy+12],[tx+lw/2,ly]]);var LD=[[tx-lw/2,ly],[tx+lw/2,ly],[tx+lw/2,ly+8],[tx-lw/2,ly+8]];SOL(s,sol,LD);s.push([[tx-lw/2,ly+4],[tx+lw/2,ly+4]]);for(var q=-lw/2+4;q<lw/2;q+=6)s.push([[tx+q,ly],[tx+q,ly+8]]);
  var b0=RR(R,22,36),b1=mx-mw/2-RR(R,18,26),fl=RI(R,4,5),fh=RR(R,15,17),btop=gy-fl*fh;
  sol.push([[b0,gy],[b0,btop-12],[b1,btop-12],[b1,gy]]);
  var nc=Math.max(3,Math.round((b1-b0)/24)),cwd=(b1-b0)/nc;
  for(var f=0;f<=fl;f++){var yy=gy-f*fh;s.push([[b0,yy],[b1,yy]]);if(f>0)s.push([[b0,yy+2],[b1,yy+2]]);}
  for(var c=0;c<=nc;c++){var xx=b0+c*cwd;s.push([[xx,gy],[xx,btop]]);if(R()<0.6)s.push([[xx,btop],[xx,btop-RR(R,6,12)]]);}
  for(var f2=0;f2<fl;f2++)for(var c2=0;c2<nc;c2++){if(R()<0.4+f2*-0.06){var X0=b0+c2*cwd+2,Y0=gy-(f2+1)*fh+4,P=[[X0,Y0],[X0+cwd-4,Y0],[X0+cwd-4,Y0+fh-6],[X0,Y0+fh-6]];H(s,P,RR(R,1.8,2.4),R()<0.5?0:90);}}
  var scx=b1+2;s.push([[scx,gy],[scx,btop]]);s.push([[scx+6,gy],[scx+6,btop]]);var zs=[],ds=1;for(var y2=gy;y2>btop;y2-=fh/2){zs.push([ds>0?scx:scx+6,y2]);ds=-ds;}s.push(zs);
  s.push([[4,gy],[296,gy]]);var hd=[[4,gy],[4,gy-14],[296,gy-14],[296,gy]];
  var hoard=[];for(var hx=4;hx<296;hx+=RR(R,5,7))hoard.push([[hx,gy],[hx,gy-14]]);behind(s,[[[4,gy-14],[296,gy-14]]].concat(hoard),[[[mx-mw/2-1,gy+1],[mx-mw/2-1,gy-15],[mx+mw/2+1,gy-15],[mx+mw/2+1,gy+1]]]);
  H(s,[[4,gy],[296,gy],[296,196],[4,196]],RR(R,3.2,4),RR(R,15,30));
  return sky(s,R,gy-14,sol);}});

SUBJ.push({name:'Telephone booth',titles:['Call Box, Corner','Coins Ready','Reverse the Charges','Glass and Iron','Under the Lamp'],build(R){
  var s=[],sol=[],gy=RR(R,172,178),bx=RR(R,116,136),bw=RR(R,40,46),bh=RR(R,116,126),d=RR(R,14,18),top=gy-bh,e=bx+bw;
  var F=[[bx,gy],[bx,top],[e,top],[e,gy]],S=[[e,top],[e+d,top-d*0.5],[e+d,gy-d*0.5],[e,gy]];s.push(F);s.push(S);
  var dome=[[bx-2,top]].concat(arc(bx+bw/2,top,bw/2+2,12,PI,TAU)),dm2=quad([e+2,top],[e+d*0.6,top-14],[e+d,top-d*0.5],8);s.push(dome);s.push(dm2);s.push([[bx-2,top],[e+2,top]]);
  s.push(circle(bx+bw/2,top-15,2.5));sol.push(F,S,[[bx-2,top]].concat(arc(bx+bw/2,top,bw/2+2,12,PI,TAU)),[[e,top],[e+d*0.6,top-14],[e+d,top-d*0.5]],EP(bx+bw/2,top-15,3,3));
  var sg=rect(bx+4,top+4,e-4,top+11);s.push(sg);s.push([[bx+8,top+7.5],[e-8,top+7.5]]);
  var gx0=bx+5,gx1=e-5,gy0=top+16,gy1=gy-14,ncol=3,nrow=RI(R,7,8);
  for(var r=0;r<=nrow;r++){var y=gy0+(gy1-gy0)*r/nrow;s.push([[gx0,y],[gx1,y]]);}for(var c=0;c<=ncol;c++){var x=gx0+(gx1-gx0)*c/ncol;s.push([[x,gy0],[x,gy1]]);}
  var sk=function(u,v){return [e+d*u,(top+16+(gy-14-top-16)*v)-d*0.5*u];};
  var sp=[sk(0.2,0),sk(0.85,0),sk(0.85,1),sk(0.2,1)];s.push(poly(sp));for(var r2=1;r2<nrow;r2++){s.push([sk(0.2,r2/nrow),sk(0.85,r2/nrow)]);}
  H(s,[[e,top],[e+d,top-d*0.5],[e+d,top+14-d*0.5],[e,top+14]],1.2,90);H(s,[[e,gy-12],[e+d,gy-12-d*0.5],[e+d,gy-d*0.5],[e,gy]],1.2,90);
  HX(s,[[[e+0.5,top+14],[e+d-0.5,top+14-d*0.5],[e+d-0.5,gy-12-d*0.5],[e+0.5,gy-12]],sp],2.2,0);
  s.push(rect(e-9,gy0+(gy1-gy0)*0.4,e-6,gy0+(gy1-gy0)*0.4+6));
  var ps=rect(bx-3,gy-4,e+3,gy);s.push(ps);
  var lx=RR(R,30,60);s.push([[lx-1.5,gy],[lx-1.5,gy-110],[lx+1.5,gy-110],[lx+1.5,gy]]);s.push(poly([[lx-7,gy-110],[lx+7,gy-110],[lx+9,gy-126],[lx-9,gy-126]]));s.push(poly([[lx-10,gy-126],[lx,gy-134],[lx+10,gy-126]]));
  s.push([[lx,gy-110],[lx,gy-126]]);sol.push([[lx-2,gy],[lx-2,gy-110],[lx-10,gy-110],[lx-10,gy-126],[lx,gy-135],[lx+10,gy-126],[lx+10,gy-110],[lx+2,gy-110],[lx+2,gy]]);
  var hy=gy-RR(R,20,26),hed=scallop(4,0,1,1,1,0);
  var hedge=[[e+d+6,gy]];for(var hx=e+d+6;hx<294;hx+=8)A(hedge,arc(hx+4,hy,4,5,PI,TAU));hedge.push([294,gy]);s.push(hedge);sol.push(hedge.slice());H(s,hedge,RR(R,2,2.6),45);
  s.push([[4,gy],[296,gy]]);s.push([[4,gy+6],[296,gy+6]]);var pv=[];for(var px=8;px<296;px+=RR(R,24,30))pv.push([[px,gy],[px,gy+6]]);A(s,pv);
  H(s,[[4,gy+6],[296,gy+6],[296,196],[4,196]],RR(R,2.6,3.2),0);
  return sky(s,R,gy,sol);}});

SUBJ.push({name:'Roadside gas pump',titles:['Last Fill for Miles','Route Station','Globe on Top','Out on the Two-Lane','Twelve Cents a Gallon'],build(R){
  var s=[],sol=[],gy=RR(R,160,166),ct=RR(R,32,40),p1=RR(R,70,86),gap=RR(R,52,60);
  hills(s,R,gy,RR(R,26,36),RR(R,4.5,5.5),[],RR(R,10,20));
  [p1,p1+gap].forEach(function(px,ix){var w=22,h=RR(R,70,76),t=gy-6-h;
    var base=[[px-w/2-4,gy],[px-w/2-4,gy-6],[px+w/2+4,gy-6],[px+w/2+4,gy]];SOL(s,sol,base);
    var B=[[px-w/2,gy-6],[px-w/2,t]].concat(arc(px,t,w/2,8,PI,TAU)).concat([[px+w/2,gy-6]]);s.push(B);sol.push(B);
    H(s,[[px+w/2-6,gy-6],[px+w/2-6,t],[px+w/2,t],[px+w/2,gy-6]],1.4,90);
    s.push(circle(px-2,t+16,7));for(var k=0;k<10;k++){var a=PI+k*PI/9;s.push([[px-2+7*Math.cos(a),t+16+7*Math.sin(a)],[px-2+5*Math.cos(a),t+16+5*Math.sin(a)]]);}var na=RR(R,PI*1.1,PI*1.9);s.push([[px-2,t+16],[px-2+5*Math.cos(na),t+16+5*Math.sin(na)]]);
    s.push(rect(px-7,t+30,px+3,t+44));H(s,[[px-7,t+30],[px+3,t+30],[px+3,t+44],[px-7,t+44]],2,40);
    s.push([[px-w/2,t+52],[px+w/2,t+52]]);s.push([[px-2,t-8],[px-2,t-12]]);var g=circle(px-2,t-20,8);s.push(g);s.push([[px-10,t-20],[px+6,t-20]]);s.push(arc(px-2,t-20,8,3,0,PI));sol.push(EP(px-2,t-20,8.5,8.5));
    var hx=px+w/2;s.push(curve([[hx,t+26],[hx+8,t+40],[hx+12,gy-14],[hx+6,gy-24],[hx+4,t+22]],6));s.push([[hx,t+20],[hx+6,t+18],[hx+6,t+26],[hx,t+26]]);});
  var c0=p1-30,c1=p1+gap+30;var cn=[[c0,ct],[c1,ct],[c1,ct+8],[c0,ct+8]];SOL(s,sol,cn);H(s,cn,1.6,0);s.push(comb(c0,c1,ct,4,8));
  [c0+6,c1-6].forEach(function(x){s.push([[x-2,ct+8],[x-2,gy],[x+2,gy],[x+2,ct+8]]);sol.push([[x-2,ct+8],[x-2,gy],[x+2,gy],[x+2,ct+8]]);});
  var sx=c1+10,sw=Math.min(296-sx-4,RR(R,58,70)),sh=RR(R,52,60),st=gy-sh;var SB=[[sx,gy],[sx,st],[sx+sw,st],[sx+sw,gy]];SOL(s,sol,SB);s.push(rect(sx-2,st-6,sx+sw+2,st));
  s.push(rect(sx+6,gy-30,sx+sw*0.55,gy-10));s.push([[sx+6+((sx+sw*0.55)-(sx+6))/2,gy-30],[sx+6+((sx+sw*0.55)-(sx+6))/2,gy-10]]);var dd=rect(sx+sw*0.65,gy-34,sx+sw*0.88,gy);s.push(dd);H(s,dd.slice(0,4),2,90);
  var sg=[[sx+8,st-6],[sx+8,st-20],[sx+sw-8,st-20],[sx+sw-8,st-6]];SOL(s,sol,sg);H(s,sg,2,0);H(s,[[sx,st+4],[sx+sw,st+4],[sx+sw,gy-36],[sx,gy-36]],RR(R,3,3.6),90);
  s.push([[4,gy],[296,gy]]);furrows(s,R,gy,RI(R,10,14),150);
  return sky(s,R,gy-RR(R,20,30),sol);}});

SUBJ.push({name:'Desert pyramids',titles:['Older Than Names','Three on the Plateau','Sand and Limestone','Long Shadows East','Before the Caravans'],build(R){
  var s=[],gy=RR(R,128,136),pyr=[],side=R()<0.5?1:-1;
  var defs=[[RR(R,92,120),RR(R,74,84)],[RR(R,186,206),RR(R,58,66)],[RR(R,252,268),RR(R,34,40)]];
  defs.forEach(function(dv,i){var cx=dv[0],h=dv[1],w=h*1.45,ap=[cx+side*h*0.12,gy-h];pyr.push({cx:cx,h:h,w:w,ap:ap,P:[[cx-w,gy],ap,[cx+w,gy]]});});
  var holes=[];for(var i=0;i<3;i++){var p=pyr[i],strokes=[];strokes.push(p.P);var mid=[p.ap,[p.cx+side*p.w*0.25,gy]];strokes.push(mid);
    var sh=side>0?[p.ap,[p.cx+side*p.w*0.25,gy],[p.cx+p.w,gy]]:[p.ap,[p.cx+side*p.w*0.25,gy],[p.cx-p.w,gy]];A(strokes,hatch(sh,1.5,side*70));
    var lit=side>0?[p.ap,[p.cx-p.w,gy],[p.cx+side*p.w*0.25,gy]]:[p.ap,[p.cx+p.w,gy],[p.cx+side*p.w*0.25,gy]];var crs=[];for(var y=gy-4;y>p.ap[1]+3;y-=RR(R,3.6,4.4))crs.push([[0,y],[300,y]]);clipIn(strokes,crs,lit);
    if(i===0)A(s,strokes);else behind(s,strokes,holes);holes.push(p.P);}
  var sx=side>0?RR(R,24,50):RR(R,250,276);sunH(s,sx,gy,RR(R,9,12));
  s.push([[4,gy],[296,gy]]);var dn=[],y0=gy+RR(R,18,24);for(var k=0;k<3;k++){var yy=y0+k*RR(R,16,20),c=[];for(var x=4;x<=296;x+=6)c.push([x,yy+5*Math.sin(x/RR(R,30,50)+k*2)]);dn.push(c);s.push(c);}
  H(s,[[4,gy],[296,gy],[296,y0],[4,y0]],RR(R,4.5,5.5),0);
  for(var k2=0;k2<3;k2++){var c2=dn[k2],nxt=k2<2?dn[k2+1]:[[4,196],[296,196]];var P=c2.concat(nxt.slice().reverse());H(s,c2.slice(Math.floor(c2.length*0.3*k2/2),Math.floor(c2.length*(0.5+0.2*k2))).concat([[c2[Math.floor(c2.length*(0.5+0.2*k2))][0],c2[Math.floor(c2.length*(0.5+0.2*k2))][1]+8]]),2,side*20);}
  H(s,[[4,dn[2][0][1]],[296,dn[2][dn[2].length-1][1]],[296,196],[4,196]],RR(R,3,3.6),-side*25);
  return sky(s,R,gy,pyr.map(function(p){return p.P;}));}});

SUBJ.push({name:'Viking longship',titles:['Dragon Prow North','Shields Along the Rail','Oars Out','Striped Sail, Grey Sea','Rowing Home'],build(R){
  var s=[],sol=[],wl=RR(R,138,146),x0=RR(R,30,42),x1=300-RR(R,30,42),mid=(x0+x1)/2,dip=RR(R,18,22);
  var gun=[],keel=[];for(var x=x0+16;x<=x1-16;x+=4){var t=(x-mid)/((x1-x0)/2-16);gun.push([x,wl-dip+Math.pow(t,4)*-24]);keel.push([x,wl+8-Math.pow(Math.abs(t),3)*10]);}
  var bow=curve([gun[gun.length-1],[x1-6,wl-56],[x1+2,wl-80],[x1-6,wl-96],[x1-16,wl-92]],8),stern=curve([gun[0],[x0+6,wl-56],[x0-2,wl-80],[x0+6,wl-94],[x0+14,wl-88]],8);
  var hull=gun.concat(bow.slice(1)).concat(bow.slice().reverse().map(function(p){return [p[0]-5,p[1]+6];}));
  var sil=stern.slice().reverse().concat(gun).concat(bow.slice(1)).concat([[x1-12,wl],keel[keel.length-1]]).concat(keel.slice().reverse()).concat([[x0+12,wl]]);
  s.push(stern.slice().reverse().concat(gun).concat(bow.slice(1)));s.push(curve([[x1-16,wl-92],[x1-12,wl-80],[x1-14,wl-50],gun[gun.length-1]],6));s.push(curve([[x0+14,wl-88],[x0+8,wl-76],[x0+12,wl-48],gun[0]],6));
  s.push(spiral(x1-12,wl-92,0.5,4,1.4));s.push(spiral(x0+10,wl-90,0.5,4,1.4));
  s.push([gun[gun.length-1],[x1-12,wl]].concat(keel.slice().reverse()).concat([[x0+12,wl],gun[0]]));
  for(var k=1;k<=3;k++){s.push(gun.map(function(p,i){return [p[0],p[1]+(keel[i][1]-p[1])*k/4];}));}
  H(s,gun.map(function(p,i){return [p[0],p[1]+(keel[i][1]-p[1])*0.5];}).concat(keel.slice().reverse()),RR(R,1.8,2.3),RR(R,-10,10));
  var sw=RR(R,9,11),sh=[];for(var sx=x0+40;sx+sw<=x1-40;sx+=sw){var gyy=interpY(gun,sx+sw/2);A(sh,arc(sx+sw/2,gyy,sw/2,sw/2,PI,TAU));}s.push(sh);
  var mx=mid+RR(R,-10,10),yt=RR(R,12,18),ya=yt+6,sb=wl-dip-RR(R,10,14),sw2=RR(R,58,68);s.push([[mx,interpY(gun,mx)],[mx,yt]]);s.push([[mx-sw2-6,ya],[mx+sw2+6,ya]]);
  var bl=RR(R,6,12),SA=[[mx-sw2,ya]].concat(quad([mx-sw2,ya],[mx-sw2-bl,(ya+sb)/2],[mx-sw2+4,sb],10).slice(1)).concat(quad([mx+sw2-4,sb],[mx+sw2+bl,(ya+sb)/2],[mx+sw2,ya],10));
  SOL(s,sol,SA);var st=[];var ns=7,swd=2*sw2/ns;for(var i=0;i<ns;i+=2){var X0=mx-sw2+i*swd;st.push([[X0,ya],[X0+swd,ya],[X0+swd,sb],[X0,sb]]);}st.forEach(function(P){clipIn(s,hatch(P,1.6,90),SA);});
  s.push([[mx-sw2-6,ya],[x0+22,interpY(gun,x0+22)]]);s.push([[mx+sw2+6,ya],[x1-22,interpY(gun,x1-22)]]);
  sol.push(sil);
  var oars=[];for(var ox=x0+48;ox<x1-48;ox+=RR(R,16,20)){var oy=interpY(gun,ox)+4;oars.push([[ox,oy],[ox-14,wl+22]]);}A(s,oars);
  var wat=waterS(R,4,296,wl+2,194,RR(R,5,6.5),1.5);behind(s,[[[4,wl],[296,wl]],wat],[sil.concat([[x0+12,wl+12],[x1-12,wl+12]])].concat(oars.map(function(o){return [[o[0][0]-1,o[0][1]],[o[1][0]-1.5,o[1][1]],[o[1][0]+1.5,o[1][1]],[o[0][0]+1,o[0][1]]];})));
  hills(s,R,wl,RR(R,30,46),0);
  return sky(s,R,wl,sol.concat([[[mx-1,wl],[mx-1,yt],[mx+1,yt],[mx+1,wl]]]));}});

SUBJ.push({name:'Streetcar',titles:['The Number Four Line','Bell at the Corner','Sparks on the Wire','Downtown Run','Clang and Roll'],build(R){
  var s=[],sol=[],gy=RR(R,166,172),x0=RR(R,48,64),x1=x0+RR(R,186,198),fb=gy-16,rt=fb-RR(R,58,64),ow=RR(R,22,28);
  var body=[[x0,fb]].concat(arc(x0+10,rt+10,10,10,PI,1.5*PI)).concat(arc(x1-10,rt+10,10,10,1.5*PI,TAU)).concat([[x1,fb],[x0,fb]]);s.push(body);sol.push(body);
  var lp=[[x0,fb],[x1,fb],[x1,fb-20],[x0,fb-20]];s.push([[x0,fb-20],[x1,fb-20]]);H(s,lp,1.5,0);s.push([[x0,fb-22],[x1,fb-22]]);
  var nw=RI(R,7,8),ww=(x1-x0-30)/nw;for(var i=0;i<nw;i++){var wx=x0+15+i*ww;var W=[[wx+2,fb-26],[wx+2,rt+12],[wx+ww-2,rt+12],[wx+ww-2,fb-26]];s.push(poly(W));s.push([[wx+2,rt+20],[wx+ww-2,rt+20]]);}
  var cl=[[x0+22,rt],[x0+26,rt-8],[x1-26,rt-8],[x1-22,rt]];SOL(s,sol,cl);for(var cx=x0+30;cx<x1-34;cx+=12)s.push(rect(cx,rt-6,cx+7,rt-2));
  var dx=x0+3;s.push(rect(dx,fb-50,dx+10,fb-2));s.push([[dx+5,fb-50],[dx+5,fb-2]]);s.push(circle(x1-6,fb-12,3));
  s.push(rect(x1-30,rt+2,x1-12,rt+9));
  var pb=x0+(x1-x0)*0.55,ph=rt-8,P=[[pb-14,ph],[pb,ph-(ph-ow)/2],[pb+14,ph],[pb,ow]];s.push([[pb-14,ph],[pb,ow+2]]);s.push([[pb+14,ph],[pb,ow+2]]);s.push([[pb-14,ph],[pb+14,ph]]);s.push([[pb-6,ow+1],[pb+6,ow+1]]);
  s.push([[10,ow],[290,ow]]);[10,290].forEach(function(px){s.push([[px,ow],[px,gy]]);s.push([[px-1.5,ow-6],[px-1.5,gy],[px+1.5,gy],[px+1.5,ow-6]]);});
  [x0+30,x1-30].forEach(function(bx){var bg=[[bx-22,fb],[bx-22,fb+6],[bx+22,fb+6],[bx+22,fb]];s.push(poly(bg));H(s,bg,1.2,0);wheel(s,bx-12,gy-6,6,0,0);wheel(s,bx+12,gy-6,6,0,0);});
  s.push([[4,gy],[296,gy]]);s.push([[4,gy+3],[296,gy+3]]);var cob=[],n=RI(R,6,8),prev=gy+3;
  for(var r=1;r<=n;r++){var y=gy+3+(193-gy)*Math.pow(r/n,1.3),hh=y-prev,step=6+10*r/n,off=(r%2)*step/2,p=[[4,y]];for(var xx=4+off+step;xx<296;xx+=step)p.push([xx,y],[xx,y-hh],[xx,y]);p.push([296,y]);cob.push(p);prev=y;}A(s,cob);
  var bh=[];var hx=4;while(hx<292){var w=RR(R,34,52),h=RR(R,70,110),tp=gy-h;var Hh=[[hx,gy],[hx,tp],[hx+w,tp],[hx+w,gy]];bh.push(Hh);for(var wy=tp+8;wy<gy-26;wy+=16)for(var wx2=hx+5;wx2+7<hx+w-3;wx2+=12)bh.push(rect(wx2,wy,wx2+7,wy+10));sol.push(Hh);hx+=w+RR(R,0,6);}
  behind(s,bh,[body.concat([[x1,gy],[x0,gy]]),[[pb-15,rt],[pb-15,ow],[pb+15,ow],[pb+15,rt]],[[8,ow],[8,gy],[12,gy],[12,ow]],[[288,ow],[288,gy],[292,gy],[292,ow]]]);
  return sky(s,R,gy,sol);}});

SUBJ.push({name:'Space shuttle on the pad',titles:['T Minus Nine','Venting at Dawn','Stacked and Ready','The Last Hold','Pad at Sunrise'],build(R){
  var s=[],sol=[],gy=RR(R,176,182),cx=RR(R,118,150),pb=gy-RR(R,16,20);
  var PL=[[cx-70,gy],[cx-70,pb],[cx+70,pb],[cx+70,gy]];SOL(s,sol,PL);H(s,PL,RR(R,2,2.6),0);for(var k=-1;k<=1;k+=2){var fo=archP(cx+k*28,gy,10,4);s.push(fo);H(s,fo,1.2,90);}
  var tw=13,tt=pb-RR(R,140,150);var ET=[[cx-tw,pb],[cx-tw,tt+20]].concat(quad([cx-tw,tt+20],[cx-tw,tt],[cx,tt-8],10)).concat(quad([cx,tt-8],[cx+tw,tt],[cx+tw,tt+20],10)).concat([[cx+tw,pb]]);SOL(s,sol,ET);
  H(s,[[cx+tw*0.35,pb],[cx+tw*0.35,tt+14],[cx+tw,tt+20],[cx+tw,pb]],1.5,90);[0.25,0.55].forEach(function(f){var y=tt+(pb-tt)*f;s.push([[cx-tw,y],[cx+tw,y]]);});
  [-1,1].forEach(function(e){var bx=cx+e*(tw+6),bt=tt+RR(R,26,30);var SB=[[bx-5,pb-6],[bx-5,bt+10],[bx,bt],[bx+5,bt+10],[bx+5,pb-6]];SOL(s,sol,SB);var nz=[[bx-5,pb-6],[bx-7,pb],[bx+7,pb],[bx+5,pb-6]];s.push(nz);
    for(var y=bt+24;y<pb-12;y+=RR(R,18,24))s.push([[bx-5,y],[bx+5,y]]);if(e>0)H(s,[[bx+1,bt+10],[bx+5,bt+10],[bx+5,pb-6],[bx+1,pb-6]],1.2,90);});
  var on=tt+RR(R,40,48),fw=8,ty=pb-14,wy=ty-RR(R,36,42);
  var OR=[[cx-fw,ty],[cx-fw,wy]].concat(quad([cx-fw,wy],[cx-fw,on+6],[cx,on],8)).concat(quad([cx,on],[cx+fw,on+6],[cx+fw,wy],8)).concat([[cx+fw,ty]]);
  var WG=[[cx-fw,wy],[cx-38,ty-2],[cx-38,ty+2],[cx+38,ty+2],[cx+38,ty-2],[cx+fw,wy]];sol.push(WG.concat([[cx+fw,ty]]).concat([[cx-fw,ty]]));
  behind(s,[],[]);var orb=[];orb.push(OR);orb.push(poly(WG));H(orb,quad([cx-fw,on+14],[cx,on-4],[cx+fw,on+14],8),1,0);H(orb,[[cx-fw,wy],[cx-38,ty-2],[cx-34,ty-2],[cx-fw+2,wy+4]],1.1,40);H(orb,[[cx+fw,wy],[cx+38,ty-2],[cx+34,ty-2],[cx+fw-2,wy+4]],1.1,-40);
  s.push([[cx,on+16],[cx,ty]]);s.push(rect(cx-5,on+12,cx+5,on+16));
  var cleared=[];var oh=OR.concat([[cx+fw,ty]]);
  var cut=s.slice();s.length=0;behind(s,cut,[poly(WG).slice(0,-1),OR]);A(s,orb);sol.push(OR);
  var lx=cx+RR(R,62,72),lt=pb-RR(R,160,168);s.push([[lx-7,pb],[lx-7,lt]]);s.push([[lx+7,lt],[lx+7,pb]]);var z=[],d=1;for(var y2=pb;y2>lt;y2-=9){z.push([lx+7*d,y2]);d=-d;}s.push(z);
  for(var y3=pb-14;y3>lt+10;y3-=28)s.push([[lx-7,y3],[lx+7,y3]]);s.push([[lx,lt],[lx,lt-18]]);sol.push([[lx-8,pb],[lx-8,lt],[lx+8,lt],[lx+8,pb]]);
  var arm=on+RR(R,6,12);s.push([[lx-7,arm],[cx+fw+2,arm]]);s.push([[lx-7,arm+5],[cx+fw+2,arm+5]]);s.push(rect(cx+fw+2,arm-2,cx+fw+8,arm+7));
  var ga=tt+RR(R,4,10);s.push([[lx-7,ga],[cx+tw,ga+4]]);
  [-1,1].forEach(function(e){var px=cx+e*RR(R,40,58),cl=[];var c=scallop(px,pb-6,RR(R,12,16),RR(R,6,8),RI(R,7,9),0.18);c=c.filter(function(p){return p[1]<=pb;});s.push(c);sol.push(c);});
  s.push([[4,gy],[296,gy]]);H(s,[[4,gy],[296,gy],[296,196],[4,196]],RR(R,3,3.8),RR(R,10,25));
  var ws=[];for(var x=4;x<cx-72;x+=RR(R,7,11))ws.push([[x,gy],[x+2,gy-RR(R,4,9)],[x+4,gy]]);A(s,ws);
  return sky(s,R,gy,sol);}});

SUBJ.push({name:'Combine harvester',titles:['Cutting the Last Field','Dust and Chaff','August Evening Harvest','Reel Turning','The Long Pass'],build(R){
  var s=[],sol=[],gy=RR(R,160,166),bx=RR(R,118,132),bw=RR(R,98,108),bt=gy-62,bb=gy-22;
  var B=[[bx,bb],[bx,bt],[bx+bw,bt],[bx+bw,bb]];SOL(s,sol,B);H(s,[[bx,bb-12],[bx+bw,bb-12],[bx+bw,bb],[bx,bb]],1.5,0);s.push([[bx,bb-12],[bx+bw,bb-12]]);
  for(var v=0;v<4;v++){var vx=bx+40+v*12;s.push(rect(vx,bt+10,vx+8,bt+28));}
  var GT=[[bx+28,bt],[bx+22,bt-22],[bx+bw-4,bt-22],[bx+bw-10,bt]];SOL(s,sol,GT);H(s,[[bx+bw-24,bt-22],[bx+bw-4,bt-22],[bx+bw-10,bt],[bx+bw-28,bt]],1.6,90);
  var CB=[[bx,bt],[bx-4,bt-34],[bx+24,bt-34],[bx+28,bt]];SOL(s,sol,CB);s.push([[bx-6,bt-34],[bx+26,bt-34],[bx+26,bt-38],[bx-6,bt-38],[bx-6,bt-34]]);s.push([[bx+2,bt-30],[bx+22,bt-30],[bx+24,bt-4],[bx+4,bt-4],[bx+2,bt-30]]);s.push([[bx+13,bt-30],[bx+14,bt-4]]);
  var au=[[bx+bw-8,bt-22],[bx+bw-4,bt-30],[bx+30,bt-32],[bx+28,bt-28],[bx+bw-10,bt-26]];s.push(au);sol.push(au);
  s.push([[bx+bw-30,bt-22],[bx+bw-30,bt-44],[bx+bw-25,bt-44],[bx+bw-25,bt-22]]);sol.push([[bx+bw-30,bt-22],[bx+bw-30,bt-44],[bx+bw-25,bt-44],[bx+bw-25,bt-22]]);
  var hx0=RR(R,22,34),hdy=gy-8,FH=[[bx,bb-6],[hx0+60,hdy-14],[hx0+60,hdy],[bx,bb+2]];s.push(FH);
  var HD=[[hx0,hdy],[hx0,hdy-18],[hx0+64,hdy-18],[hx0+64,hdy]];SOL(s,sol,HD);H(s,HD,1.6,0);s.push(comb(hx0,hx0+64,hdy+4,4,4));
  var rc=[hx0+32,hdy-34],rr=RR(R,15,18);s.push(circle(rc[0],rc[1],rr));var ra=R()*PI;for(var k=0;k<6;k++){var a=ra+k*PI/3;s.push([[rc[0],rc[1]],[rc[0]+rr*Math.cos(a),rc[1]+rr*Math.sin(a)]]);}
  s.push([[rc[0],rc[1]],[bx-2,bt+6]]);sol.push(EP(rc[0],rc[1],rr+1,rr+1));
  wheel(s,bx+28,gy-21,21,10,2);wheel(s,bx+bw-14,gy-13,13,6,0);s.push([[bx+6,bt-34],[bx+6,bb]]);
  var stub=[];for(var x=bx-2;x<296;x+=5)stub.push([x,gy],[x+1,gy-3],[x+2,gy]);s.push([[4,gy],[296,gy]]);
  var wh=[[4,gy]];for(var x2=4;x2<hx0-2;x2+=3)wh.push([x2+1,gy-RR(R,20,26)],[x2+3,gy]);s.push(wh);H(s,[[4,gy-18],[hx0-2,gy-18],[hx0-2,gy],[4,gy]],2.2,70);
  behind(s,[stub],[[[bx+5,gy+1],[bx+5,gy-44],[bx+51,gy-44],[bx+51,gy+1]],[[bx+bw-28,gy+1],[bx+bw-28,gy-28],[bx+bw,gy-28],[bx+bw,gy+1]]]);
  var dust=scallop(Math.min(270,bx+bw+28),gy-22,RR(R,16,22),RR(R,12,16),RI(R,7,9),0.2);dust=dust.filter(function(p){return p[0]>bx+bw-4;});s.push(dust);H(s,dust,RR(R,3,3.6),RR(R,20,40));sol.push(dust);
  H(s,[[4,gy],[296,gy],[296,196],[4,196]],RR(R,3,3.8),RR(R,-30,-15));
  hills(s,R,gy-24,RR(R,16,26),0);
  return sky(s,R,gy-24,sol);}});

SUBJ.push({name:'Bandstand in a park',titles:['Sunday Brass','Lattice and Lanterns','Eight Columns','The Band Has Gone Home','Park Pavilion'],build(R){
  var s=[],sol=[],gy=RR(R,166,172),cx=RR(R,136,164),w=RR(R,62,70),pb=gy-RR(R,20,24),ch=RR(R,48,54),ce=pb-ch;
  ground(s,R,gy);
  var BS=[[cx-w,gy],[cx-w,pb],[cx+w,pb],[cx+w,gy]];SOL(s,sol,BS);var lat=[];var g=RR(R,5,6);lat=hatch(BS,g,45).concat(hatch(BS,g,-45));
  var st=[[cx-12,gy],[cx-12,pb],[cx+12,pb],[cx+12,gy]];behind(s,lat,[st]);s.push(st);for(var y=pb+4;y<gy;y+=4)s.push([[cx-12,y],[cx+12,y]]);
  s.push([[cx-w,pb-2],[cx+w,pb-2]]);s.push(comb(cx-w,cx-12,pb-2,10,4));s.push(comb(cx+12,cx+w,pb-2,10,4));s.push([[cx-w,pb-12],[cx-12,pb-12]]);s.push([[cx+12,pb-12],[cx+w,pb-12]]);
  var nc=5;for(var i=0;i<nc;i++){var x=cx-w+4+i*(2*w-8)/(nc-1);s.push([[x-1.5,pb-2],[x-1.5,ce],[x+1.5,ce],[x+1.5,pb-2]]);s.push(rect(x-3,ce,x+3,ce+3));}
  s.push([[cx-w-6,ce],[cx+w+6,ce]]);s.push(scallopRows(cx-w-6,cx+w+6,ce+3,ce+3,RR(R,6,8),3));
  var rh=RR(R,44,52),top=ce-rh,RFL=curve([[cx-w-6,ce],[cx-w+2,ce-rh*0.3],[cx-w*0.5,ce-rh*0.55],[cx-8,ce-rh*0.85],[cx,top]],8),RFR=RFL.slice().reverse().map(function(p){return [2*cx-p[0],p[1]];});
  var RF=RFL.concat(RFR.slice(1));SOL(s,sol,RF);
  for(var k=1;k<8;k++){var f=k/8,bx=cx-w-6+f*(2*w+12);s.push(quad([bx,ce],[cx+(bx-cx)*0.6,ce-rh*0.6],[cx,top],10));}
  H(s,RFR.concat([[cx,ce]]),RR(R,2,2.6),RR(R,60,75));
  s.push(circle(cx,top-4,3.5));s.push([[cx,top-7.5],[cx,top-16]]);sol.push(EP(cx,top-4,4,4));
  [[RR(R,22,44),1],[RR(R,256,278),1]].forEach(function(t){treeR(s,R,t[0],gy,RR(R,20,26),RR(R,2.2,2.8));sol.push(EP(t[0],gy-RR(R,20,26)*1.6,30,30));});
  var path=[[cx-12,gy],[cx-40,196]],p2=[[cx+12,gy],[cx+40,196]];s.push(path);s.push(p2);
  return sky(s,R,gy,sol);}});

SUBJ.push({name:'Traction engine',titles:['Steam Fair Arrival','Brass and Coal','Rolling at Four Miles','Smoke Over the Lane','Iron Giant at Rest'],build(R){
  var s=[],sol=[],gy=RR(R,172,178),bx0=RR(R,70,86),bx1=bx0+RR(R,104,114),by=gy-RR(R,58,62),br=15;
  var rwx=bx1+RR(R,10,16),rwr=RR(R,32,35),fwx=bx0+RR(R,16,20),fwr=20;
  var rw=[],fw=[];wheel(rw,rwx,gy-rwr,rwr,14,0);for(var k=0;k<24;k++){var a=k*TAU/24;rw.push([[rwx+(rwr-3)*Math.cos(a),gy-rwr+(rwr-3)*Math.sin(a)],[rwx+rwr*Math.cos(a+0.12),gy-rwr+rwr*Math.sin(a+0.12)]]);}
  wheel(fw,fwx,gy-fwr,fwr,10,0);
  var boiler=[[bx0,by-br],[bx1,by-br],[bx1,by+br],[bx0,by+br],[bx0,by-br]],bs=[boiler];for(var x=bx0+24;x<bx1;x+=24)bs.push([[x,by-br],[x,by+br]]);A(bs,hatch([[bx0,by+5],[bx1,by+5],[bx1,by+br],[bx0,by+br]],1.5,0));
  bs.push(ellipse(bx0,by,5,br));var fb=[[bx1,by-br-4],[bx1+40,by-br-4],[bx1+40,gy-rwr+4],[bx1,gy-rwr+4]];bs.push(poly(fb));
  behind(s,bs,[EP(rwx,gy-rwr,rwr+0.5,rwr+0.5),EP(fwx,gy-fwr,fwr+0.5,fwr+0.5)]);A(s,rw);A(s,fw);sol.push(EP(rwx,gy-rwr,rwr+1,rwr+1),EP(fwx,gy-fwr,fwr+1,fwr+1),boiler.slice(0,4),fb);
  var cx=bx0+10,ct=by-br-RR(R,52,60);var C=[[cx-4,by-br],[cx-4,ct+6],[cx-7,ct],[cx+7,ct],[cx+4,ct+6],[cx+4,by-br]];SOL(s,sol,C);H(s,[[cx,by-br],[cx,ct+6],[cx+4,ct+6],[cx+4,by-br]],1.2,90);
  var cy=[[bx0+30,by-br],[bx0+30,by-br-10],[bx0+62,by-br-10],[bx0+62,by-br]];SOL(s,sol,cy);H(s,cy,1.4,90);
  var fx=bx0+80,fy=by-br-14;s.push(circle(fx,fy,16));s.push(circle(fx,fy,3));for(var k2=0;k2<6;k2++){var a2=k2*PI/3+R();s.push([[fx+3*Math.cos(a2),fy+3*Math.sin(a2)],[fx+15*Math.cos(a2),fy+15*Math.sin(a2)]]);}sol.push(EP(fx,fy,16.5,16.5));
  s.push([[bx0+46,by-br-10],[bx0+46,by-br-20]]);s.push(circle(bx0+42,by-br-22,2.5));s.push(circle(bx0+50,by-br-22,2.5));
  var cnt=ct-RR(R,6,10),cnp=[[bx0+4,cnt],[bx1+44,cnt],[bx1+44,cnt+5],[bx0+4,cnt+5]];SOL(s,sol,cnp);s.push(scallopRows(bx0+4,bx1+44,cnt+7,cnt+7,6,2.4));
  [bx0+30,bx1+40].forEach(function(x){s.push([[x,cnt+5],[x,x>bx1?by-br-4:by-br-10]]);});
  var sm=scallop(cx-RR(R,14,20),ct-14,RR(R,12,16),RR(R,8,10),7,0.25);s.push(sm);sol.push(sm);H(s,sm,RR(R,3,3.6),RR(R,20,40));s.push([[cx-4,ct],[cx-8,ct-6]]);
  s.push([[4,gy],[296,gy]]);H(s,[[4,gy],[296,gy],[296,196],[4,196]],RR(R,3.2,4),RR(R,-25,-10));
  var hy=gy-RR(R,26,32),hg=[[4,gy]];for(var hx2=4;hx2<292;hx2+=10)A(hg,arc(hx2+5,hy,5,RR(R,4,7),PI,TAU));hg.push([296,gy]);behind(s,[hg].concat(hatch(hg,RR(R,2.4,3),40)),sol.slice(0,4).concat([C,cnp]));
  return sky(s,R,gy,sol);}});

SUBJ.push({name:'Bakery storefront',titles:['Warm Loaves at Six','Window Full of Bread','Corner Bakery','Flour on the Step','Morning Bake'],build(R){
  var s=[],sol=[],gy=RR(R,176,180),x0=RR(R,24,36),x1=300-RR(R,24,36),rt=RR(R,26,34),fs=gy-RR(R,74,82);
  var FA=[[x0,gy],[x0,rt],[x1,rt],[x1,gy]];sol.push(FA);s.push(FA);s.push(rect(x0-4,rt-6,x1+4,rt));s.push(comb(x0,x1,rt+6,6,6));
  var chx=x1-RR(R,40,60),CH=[[chx,rt-6],[chx,rt-24],[chx+14,rt-24],[chx+14,rt-6]];SOL(s,sol,CH);s.push(brickS(chx,rt-22,chx+14,rt-6,7,4));s.push(rect(chx-2,rt-27,chx+16,rt-24));
  var uw=[x0+(x1-x0)*0.22,x0+(x1-x0)*0.62],holes=[];uw.forEach(function(wx){var W=[[wx,rt+16],[wx+34,rt+16],[wx+34,fs-22],[wx,fs-22]];s.push(poly(W));holes.push(W);s.push([[wx+17,rt+16],[wx+17,fs-22]]);s.push([[wx,rt+30],[wx+34,rt+30]]);
    var bx=[[wx-3,fs-22],[wx+37,fs-22],[wx+35,fs-14],[wx-1,fs-14]];s.push(poly(bx));holes.push(bx);H(s,bx,1.4,90);var fl=[[wx-2,fs-22]];for(var f=wx;f<wx+36;f+=6)A(fl,arc(f+3,fs-24,3,3,PI,TAU));fl.push([wx+37,fs-22]);s.push(fl);});
  HX(s,[[[x0,rt+8],[x1,rt+8],[x1,fs-4],[x0,fs-4]]].concat(holes),RR(R,4,5),90);
  var SG=[[x0+8,fs-4],[x1-8,fs-4],[x1-8,fs+10],[x0+8,fs+10]];s.push(poly(SG));s.push(rect(x0+11,fs-1,x1-11,fs+7));H(s,[[x0+11,fs-1],[x1-11,fs-1],[x1-11,fs+7],[x0+11,fs+7]],2.6,0);
  var px=x0-2;s.push([[x0,fs+16],[px-2,fs+16]]);var pz=[[px-4,fs+16],[px-4,fs+22]];s.push(pz);var pc=[px-4,fs+32];s.push(circle(pc[0],pc[1],9));s.push(circle(pc[0]-3,pc[1]+2,4));s.push(circle(pc[0]+3,pc[1]+2,4));
  var dw0=x1-56,dw1=x1-20,wy0=fs+16,wy1=gy-12;var WIN=[[x0+14,wy0],[dw0-10,wy0],[dw0-10,wy1],[x0+14,wy1]];s.push(poly(WIN));
  var sh1=wy0+(wy1-wy0)*0.42,sh2=wy1-6;s.push([[x0+14,sh1],[dw0-10,sh1]]);s.push([[x0+14,sh2],[dw0-10,sh2]]);
  for(var lx=x0+24;lx<dw0-24;lx+=RR(R,20,26)){var lr=RR(R,8,10);s.push(arc(lx,sh1,lr,lr*0.8,PI,TAU));for(var c=-1;c<=1;c++)s.push([[lx+c*4-2,sh1-lr*0.6],[lx+c*4+2,sh1-lr*0.3]]);}
  for(var cx2=x0+30;cx2<dw0-24;cx2+=RR(R,26,32)){var cw=RR(R,9,12),chh=RR(R,10,14);s.push([[cx2-cw,sh2],[cx2-cw,sh2-chh],[cx2+cw,sh2-chh],[cx2+cw,sh2]]);s.push(scallopRows(cx2-cw,cx2+cw,sh2-chh,sh2-chh,cw/2,2));H(s,[[cx2-cw,sh2-chh*0.5],[cx2+cw,sh2-chh*0.5],[cx2+cw,sh2],[cx2-cw,sh2]],1.3,0);}
  s.push([[x0+14,wy1+4],[dw0-10,wy1+4]]);H(s,[[x0+4,wy1+4],[dw0-4,wy1+4],[dw0-4,gy],[x0+4,gy]],1.6,90);
  var D=[[dw0,gy],[dw0,wy0-2],[dw1,wy0-2],[dw1,gy]];s.push(D);s.push(rect(dw0+4,wy0+10,dw1-4,wy0+40));s.push(rect(dw0+4,wy0+46,dw1-4,gy-4));H(s,[[dw0+4,wy0+46],[dw1-4,wy0+46],[dw1-4,gy-4],[dw0+4,gy-4]],2,45);s.push(circle(dw1-7,wy0+43,1.5));
  s.push(rect(dw0,wy0-2,dw1,wy0+6));
  s.push([[4,gy],[296,gy]]);H(s,[[4,gy],[296,gy],[296,196],[4,196]],RR(R,2.8,3.4),0);for(var vx=10;vx<296;vx+=RR(R,26,34))s.push([[vx,gy],[vx-4,196]]);
  return sky(s,R,rt,sol);}});

SUBJ.push({name:'Weather vane on a barn roof',titles:['Wind From the West','Arrow on the Ridge','Copper Gone Green','Which Way the Weather','Cupola Morning'],build(R){
  var s=[],sol=[],ry=RR(R,124,132),cx=RR(R,130,170),eave=RR(R,176,182);
  var RF=[[4,eave],[4,ry],[296,ry],[296,eave]];sol.push(RF);s.push([[4,ry],[296,ry]]);clipIn(s,[scallopRows(4,296,ry+5,eave,RR(R,7,9),3.2)],[[3,ry],[297,ry],[297,eave+1],[3,eave+1]]);
  s.push([[4,eave],[296,eave]]);H(s,[[4,eave],[296,eave],[296,196],[4,196]],RR(R,4,5),90);
  var cw=RR(R,18,22),ch=RR(R,28,32),ct=ry-ch;var CU=[[cx-cw,ry],[cx-cw,ct],[cx+cw,ct],[cx+cw,ry]];SOL(s,sol,CU);
  var lv=[[cx-cw+4,ry-4],[cx+cw-4,ry-4],[cx+cw-4,ct+5],[cx-cw+4,ct+5]];s.push(poly(lv));H(s,lv,2.2,0);s.push([[cx,ry-4],[cx,ct+5]]);
  var rh=RR(R,16,20),PY=[[cx-cw-5,ct],[cx,ct-rh],[cx+cw+5,ct]];SOL(s,sol,PY);H(s,[[cx,ct-rh],[cx+cw+5,ct],[cx+2,ct]],1.4,70);
  var top=ct-rh,vy=RR(R,30,40),ay=vy+RR(R,18,22);s.push([[cx,top],[cx,vy-8]]);s.push(circle(cx,top-5,2.5));
  var al=RR(R,30,36),k=R()<0.5?1:-1;s.push([[cx-28,ay],[cx+28,ay]]);s.push([[cx-16,ay+6],[cx+16,ay-6]]);[[cx-28,ay],[cx+28,ay],[cx-16,ay+6],[cx+16,ay-6]].forEach(function(p){s.push(circle(p[0],p[1],1.8));});
  var tip=[cx+k*al,vy],tail=[cx-k*al,vy];s.push([tail,tip]);var head=[[tip[0]-k*10,vy-6],tip,[tip[0]-k*10,vy+6]];s.push(poly([[tip[0]-k*10,vy-6],tip,[tip[0]-k*10,vy+6],[tip[0]-k*7,vy]]));H(s,head,1,0);
  var fe=[];for(var f=0;f<3;f++){var fx=tail[0]+k*f*5;fe.push([[fx,vy],[fx-k*6,vy-8],[fx-k*1,vy-8],[fx+k*5,vy]]);fe.push([[fx,vy],[fx-k*6,vy+8],[fx-k*1,vy+8],[fx+k*5,vy]]);}A(s,fe);
  var sc=[[cx,vy],[cx+k*6,vy-10]].concat(arc(cx+k*12,vy-12,6*k,6,PI,TAU*0.85));s.push(sc);s.push(spiral(cx-k*8,vy-8,0.5,5,1.2));s.push([[cx,vy],[cx-k*8,vy-3]]);
  sol.push([[cx-k*al,vy-9],[cx+k*al,vy-9],[cx+k*al,vy+7],[cx-k*al,vy+7]]);
  var bd=[];if(R()<0.8){var bx=cx+k*RR(R,60,90);perched(s,cx+k*24,ry,4,-k);}
  return sky(s,R,ry,sol);}});

// ---- chunk B: animals, plants, landscapes ----
SUBJ.push({name:'Kingfisher on a branch',titles:['Flash of Blue','Waiting Over the Pool','Dagger Bill','Still Before the Dive','Riverbank Jewel'],build(R){
  var s=[],sol=[],sc=RR(R,1.35,1.5),fx=RR(R,130,160),fy=RR(R,122,130),wl=RR(R,150,156);
  var T=function(P){return M(P,fx,fy,sc);};
  var body=T(blob([[-6,-66],[4,-74],[16,-72],[24,-64],[25,-54],[19,-44],[14,-30],[8,-16],[0,-6],[-10,-4],[-18,-10],[-30,2],[-34,-2],[-22,-18],[-18,-34],[-14,-50]],6));
  var bill=T([[23,-63],[64,-57],[23,-51]]);s.push(poly(body));s.push(poly(bill));H(s,T([[23,-63],[64,-57],[23,-57]]),1.2,0);s.push(T([[23,-57],[60,-57]]));sol.push(body,bill);
  var wing=T(blob([[-14,-50],[-4,-58],[6,-50],[8,-32],[0,-14],[-14,-12],[-20,-28]],5));s.push(poly(wing));H(s,wing,RR(R,1.3,1.6),RR(R,55,65));
  clipIn(s,[scallopRows(fx-30*sc,fx+10*sc,fy-48*sc,fy-20*sc,4*sc,2.2*sc)],wing);
  var cap=T(blob([[-6,-66],[4,-73],[16,-71],[22,-64],[12,-62],[0,-58],[-10,-56]],5));H(s,cap,1.1,-30);
  var cheek=T(EP(4,-56,6,3.2));s.push(poly(cheek));var br=T(blob([[19,-44],[14,-30],[8,-16],[0,-8],[4,-24],[8,-40]],4));H(s,br,RR(R,2.2,2.6),-25);
  var ey=T([[13,-62]])[0];s.push(circle(ey[0],ey[1],2.6));H(s,EP(ey[0],ey[1],1.6,1.6),0.8,0);
  var tl=T([[-22,-18],[-34,-2]]);s.push(tl);
  var f1=T([[0,-6],[0,0],[6,1]]),f2=T([[-8,-5],[-8,0],[-2,1]]);s.push(f1);s.push(f2);
  var by=fy+sc*1,br0=[],br1=[];for(var x=4;x<=296;x+=6){var yy=by+4*Math.sin((x-fx)/70)+(x>fx?0:(fx-x)*0.06);br0.push([x,yy]);br1.push([x,yy+RR(R,5,7)]);}
  var bend=RR(R,220,260);br0=br0.filter(function(p){return p[0]<=bend;});br1=br1.filter(function(p){return p[0]<=bend-4;});
  s.push(br0);s.push(br1);s.push([br0[br0.length-1],br1[br1.length-1]]);var BR=br0.concat(br1.slice().reverse());sol.push(BR);H(s,BR,RR(R,2,2.4),RR(R,-20,20));
  var tw=[br0[Math.floor(br0.length*0.2)],[br0[Math.floor(br0.length*0.2)][0]+10,by-36],[br0[Math.floor(br0.length*0.2)][0]+24,by-52]];s.push(curve(tw,6));s.push(lens(tw[1],[tw[1][0]-14,tw[1][1]-10],4));s.push(lens(tw[2],[tw[2][0]+12,tw[2][1]-12],4));
  var wat=waterS(R,4,296,wl,194,RR(R,5,6),1.2);s.push([[4,wl],[296,wl]]);var refl=[];for(var r=0;r<5;r++){var ry=wl+6+r*5;refl.push([[fx-20+r*3,ry],[fx+20-r*3,ry]]);}
  behind(s,[wat],[]);A(s,refl);
  for(var k=0;k<RI(R,4,6);k++){var rx=RR(R,6,90)+(k%2?200:0);if(Math.abs(rx-fx)<50)continue;var rh=RR(R,40,70);s.push([[rx,wl],[rx+3,wl-rh]]);s.push(lens([rx+3,wl-rh],[rx+3,wl-rh+12],2.2));}
  return sky(s,R,wl,sol);}});

SUBJ.push({name:'Puffin on a cliff',titles:['Clown of the Cliffs','Sea Parrot','Burrow Doorstep','North Atlantic Summer','Beak Full of Stripes'],build(R){
  var s=[],sol=[],sc=RR(R,1.6,1.8),cg=RR(R,110,118),px=RR(R,96,130),dr=1;
  var T=function(P){return M(P,px,cg,sc);};
  var body=T(blob([[-8,-62],[4,-66],[14,-60],[16,-50],[14,-40],[18,-28],[16,-12],[8,-2],[-8,-2],[-18,-10],[-24,-20],[-22,-36],[-16,-48]],6));
  var face=T(EP(5,-52,8.5,7.5)),belly=T(blob([[16,-12],[18,-28],[14,-40],[7,-42],[2,-28],[3,-12],[8,-3]],4));
  s.push(poly(body));s.push(poly(face));s.push(poly(belly));HX(s,[body,face,belly],RR(R,1.2,1.5),RR(R,60,75));sol.push(body);
  var bk=T([[12,-58],[22,-55],[28,-50],[22,-45],[13,-43]]);SOL(s,sol,bk);s.push(T([[15,-57],[15,-44]]));s.push(T([[19,-56],[19,-45]]));H(s,T([[19,-56],[22,-55],[28,-50],[22,-45],[19,-45]]),1,0);
  var ey=T([[7,-54]])[0];s.push(circle(ey[0],ey[1],1.8));s.push([[ey[0]-4,ey[1]-2],[ey[0]-2,ey[1]-1]]);s.push([[ey[0]+2,ey[1]+1],[ey[0]+4,ey[1]+3]]);
  s.push(T([[-2,-2],[-2,3],[6,4]]));s.push(T([[6,-2],[6,3],[13,4]]));
  var ed=RR(R,170,190),cliff=[[4,cg+2]];for(var x=10;x<ed;x+=8)cliff.push([x,cg+2+RR(R,-2,2)]);cliff.push([ed,cg+4],[ed+6,cg+20],[ed+2,cg+40],[ed+12,cg+62],[ed+8,196]);
  s.push(cliff);var CL=cliff.concat([[4,196]]);sol.push(CL);
  var cr=[];for(var y=cg+10;y<196;y+=RR(R,8,12)){var xr=interpY([[cg,ed],[cg+20,ed+6],[cg+40,ed+2],[cg+62,ed+12],[196,ed+8]].map(function(p){return [p[0],p[1]];}),y);cr.push([[4,y],[xr-2,y+RR(R,-2,2)]]);}
  var CF=[[ed-30,cg+6],[ed,cg+4],[ed+6,cg+20],[ed+2,cg+40],[ed+12,cg+62],[ed+8,196],[ed-30,196]];H(s,CF,RR(R,1.8,2.2),80);clipIn(s,cr,[[4,cg+5]].concat(CF.slice(0,6)).concat([[4,196]]));
  var gr=[[4,cg+2]];for(var x2=4;x2<ed;x2+=4)gr.push([x2+2,cg+2-RR(R,3,7)],[x2+4,cg+2]);behind(s,[gr],[body]);
  var bh=archP(px-sc*34,cg+2,7,3);s.push(bh);H(s,bh,1.2,0);
  var sea=waterS(R,ed-20,296,cg+30,194,RR(R,5,6.5),1.3);behind(s,[[[ed-20,cg+30],[296,cg+30]],sea],[CL]);
  if(R()<0.7){var p2=ed+RR(R,30,60),q=M(blob([[-6,-26],[4,-28],[8,-18],[6,-6],[-4,-2],[-10,-12]],4),p2,cg+26,0.9);s.push(poly(q));H(s,q,1.2,70);s.push(M([[6,-24],[13,-21],[6,-18]],p2,cg+26,0.9));}
  return sky(s,R,cg+30,sol);}});

SUBJ.push({name:'Sea otter afloat',titles:['Breakfast on the Belly','Kelp Bed Napping','Holding a Clam','Drifting Monterey Style','Whiskers Up'],build(R){
  var s=[],sol=[],sc=RR(R,1.15,1.3),ox=RR(R,140,160),oy=RR(R,104,112);
  var T=function(P){return M(P,ox,oy,sc);};
  var body=T(blob([[-48,-14],[-20,-22],[20,-22],[50,-16],[72,-10],[94,-12],[100,-6],[84,2],[60,6],[30,12],[0,14],[-34,12],[-52,6]],6));
  var head=T(EP(-62,-8,18,16));s.push(poly(body));s.push(poly(head));sol.push(body,head);
  HX(s,[body,T(blob([[-30,-22],[-6,-24],[-4,-12],[-24,-10]],4))],RR(R,2,2.4),RR(R,8,16));
  var mz=T(EP(-74,-4,8,6));s.push(poly(mz));var ns=T([[-80,-8],[-74,-8],[-77,-4]]);s.push(poly(ns));H(s,ns,0.8,0);s.push(T([[-77,-4],[-77,-1],[-72,0]]));
  [[-60,-14],[-70,-14]].forEach(function(e){var p=T([e])[0];s.push(circle(p[0],p[1],1.6));});
  [[-52,-22],[-66,-22]].forEach(function(e){var p=T([e])[0];s.push(arc(p[0],p[1]+2,4,4,PI,TAU));});
  for(var w=0;w<3;w++){s.push(T([[-80,-3+w*1.6],[-92,-6+w*3]]));s.push(T([[-70,-2+w*1.6],[-58,-4+w*3]]));}
  var cl=T([[-26,-24]])[0];var sh=scallop(cl[0],cl[1]-6,8,6,6,0.15);s.push(sh);for(var k=-2;k<=2;k++)s.push([[cl[0],cl[1]],[cl[0]+k*3,cl[1]-11]]);
  s.push(T(blob([[-36,-22],[-30,-30],[-24,-28],[-28,-20]],3)));s.push(T(blob([[-18,-22],[-20,-30],[-14,-30],[-12,-22]],3)));
  [[60,-14],[70,-16]].forEach(function(f,i){var P=T(blob([[f[0],f[1]],[f[0]+4,f[1]-14],[f[0]+10,f[1]-12],[f[0]+8,f[1]]],3));s.push(poly(P));H(s,P,1.2,80);sol.push(P);});
  var wl=oy+4,wat=waterS(R,4,296,wl,194,RR(R,4.6,5.6),1.4);var kelp=[];for(var k2=0;k2<RI(R,4,6);k2++){var kx=RR(R,10,290),ky=RR(R,wl+8,186);if(Math.abs(kx-ox)<sc*80&&ky<wl+20)continue;var kl=wave(kx,kx+RR(R,40,70),ky,2.5,RR(R,14,20));kelp.push(kl);for(var b=0;b<3;b++){var bp=kl[Math.floor(kl.length*(b+0.5)/3)];kelp.push(circle(bp[0],bp[1]-2,2));}}
  behind(s,[[[4,wl],[296,wl]],wat].concat(kelp),[body,head]);
  var rip=[];for(var r=1;r<=3;r++)rip.push(arc(ox,wl+2,sc*(80+r*12),r*4,0.1,PI-0.1));behind(s,rip,[body,head]);
  hills(s,R,RR(R,64,72),RR(R,22,32),RR(R,4,5),[],0);
  return sky(s,R,RR(R,64,72),sol);}});

SUBJ.push({name:'Hippo in the river',titles:['Mostly Submerged','River Horse','Ears Above Water','Noon on the Zambezi','Passenger Aboard'],build(R){
  var s=[],sol=[],wl=RR(R,128,136),hx=RR(R,140,165),sc=RR(R,1.15,1.3);
  var pts=[[-90,0],[-93,-10],[-88,-18],[-76,-21],[-70,-25],[-63,-21],[-52,-19],[-42,-25],[-36,-34],[-28,-37],[-22,-33],[-17,-35],[-12,-41],[-6,-37],[0,-31],[30,-35],[62,-31],[86,-17],[98,0]];
  var top=M(curve(pts,5),hx,wl,sc);s.push(top);var SIL=top.concat([[top[top.length-1][0],wl+1],[top[0][0],wl+1]]);sol.push(SIL);
  H(s,SIL,RR(R,2.2,2.6),RR(R,70,80));
  [[-86,-17],[-78,-19]].forEach(function(n){var p=M([n],hx,wl,sc)[0];s.push(ellipse(p[0],p[1]+1,2.2,1.2));});
  var e=M([[-31,-31]],hx,wl,sc)[0];s.push(circle(e[0],e[1],2.2));H(s,EP(e[0],e[1],1.3,1.3),0.7,0);var ea=M([[-12,-41]],hx,wl,sc)[0];s.push(arc(ea[0],ea[1]+3,3,5,PI,TAU));
  s.push(M([[-90,-4],[-70,-6],[-58,-10]],hx,wl,sc));
  var bp=M([[34,-35]],hx,wl,sc)[0];perched(s,bp[0],bp[1]-0.5,4.2,-1);
  var wat=waterS(R,4,296,wl+5,194,RR(R,5,6),1.3);s.push([[4,wl],[296,wl]]);var rf=[];for(var r=0;r<4;r++){var y=wl+4+r*4;rf.push(M([[-80+r*6,0],[80-r*8,0]],hx,y,sc));}
  var rip=[];for(var r2=1;r2<=2;r2++)rip.push(arc(hx,wl,sc*(100+r2*14),r2*5,0.05,PI-0.05));behind(s,[wat].concat(rip),[M([[-84,0],[-84,24],[84,24],[84,0]],hx,wl,sc)]);A(s,rf);
  for(var k=0;k<RI(R,5,8);k++){var rx=k%2?RR(R,6,60):RR(R,240,294),rh=RR(R,30,60);s.push([[rx,wl],[rx+RR(R,-4,4),wl-rh]]);var t=[rx,wl-rh];A(s,[[[t[0],t[1]],[t[0]-8,t[1]-6]],[[t[0],t[1]],[t[0]+8,t[1]-6]],[[t[0],t[1]],[t[0],t[1]-9]]]);}
  var bank=hills(s,R,wl,RR(R,16,24),RR(R,3.5,4.5),[],0);
  var ax=RR(R,230,270),ab=interpY(bank,ax);s.push([[ax,ab],[ax+4,ab-30],[ax+6,ab-36]]);var cn=[[ax-24,ab-36],[ax+30,ab-36],[ax+24,ab-42],[ax-16,ab-42]];SOL(s,sol,cn);H(s,cn,1.4,0);
  return sky(s,R,wl,sol);}});

SUBJ.push({name:'Polar bear on the ice',titles:['White on White','Walking the Floe','Arctic Patrol','Pack Ice, Late Spring','Heavy Paws'],build(R){
  var s=[],sol=[],gy=RR(R,138,146),bx=RR(R,140,160),sc=RR(R,1.1,1.25),dir=1;
  var T=function(P){return M(P,bx,gy,sc);};
  var far1=T(blob([[-46,-24],[-42,0],[-32,0],[-32,-22]],3)),far2=T(blob([[34,-26],[40,0],[50,0],[46,-28]],3));
  var B=T(blob([[80,-36],[76,-44],[66,-50],[56,-50],[52,-56],[47,-51],[30,-48],[10,-58],[-20,-60],[-50,-54],[-66,-44],[-72,-26],[-68,0],[-56,0],[-52,-16],[-40,-20],[-20,-22],[10,-22],[16,-18],[18,0],[30,0],[32,-20],[40,-30],[52,-34],[64,-30],[76,-30]],4));
  behind(s,[poly(far1),poly(far2)].concat(hatch(far1,1.8,80)).concat(hatch(far2,1.8,80)),[B]);s.push(poly(B));sol.push(B,far1,far2);
  H(s,T(blob([[-50,-22],[-20,-24],[10,-24],[16,-20],[-10,-30],[-40,-30],[-60,-30]],4)),RR(R,2.4,3),RR(R,-10,10));
  H(s,T([[-68,0],[-56,0],[-52,-16],[-60,-22],[-70,-20]]),2.2,70);H(s,T([[18,0],[30,0],[32,-20],[22,-22]]),2.2,70);
  var ns=T([[80,-36],[77,-39],[80,-41]]);s.push(poly(ns));H(s,ns,0.8,0);var ey=T([[66,-44]])[0];s.push(circle(ey[0],ey[1],1.4));s.push(T([[76,-31],[70,-33]]));
  s.push(T([[50,-54],[50,-50]]));
  var fl=[[4,gy]],x=4;while(x<296){x+=RR(R,14,26);fl.push([Math.min(296,x),gy+RR(R,-2,2)]);}s.push(fl);var fe=gy+RR(R,10,14);s.push([[4,fe],[296,fe]]);
  for(var c=0;c<RI(R,4,6);c++){var cx=RR(R,10,290);s.push([[cx,gy],[cx+RR(R,-6,6),fe]]);}H(s,[[4,gy+1],[296,gy+1],[296,fe],[4,fe]],RR(R,2.2,2.8),90);
  s.push(waterS(R,4,296,fe+5,194,RR(R,5,6),1.2));var cs=[];for(var k=0;k<3;k++){var ix=RR(R,20,280),iw=RR(R,20,40),iy=fe+RR(R,10,30);var P=[[ix-iw,iy],[ix-iw*0.6,iy-6],[ix+iw*0.7,iy-6],[ix+iw,iy]];cs.push(poly(P));cs.push(hatch(P,2,90)[0]||[[ix,iy],[ix,iy]]);}A(s,cs);
  var bg=[];for(var b=0;b<2;b++){var ix2=b?RR(R,20,70):RR(R,230,280),ih=RR(R,24,40),iw2=RR(R,24,36);var I=[[ix2-iw2,gy],[ix2-iw2*0.4,gy-ih],[ix2+iw2*0.1,gy-ih*0.8],[ix2+iw2*0.5,gy-ih*1.05],[ix2+iw2,gy]];bg.push(I);A(bg,hatch([[ix2+iw2*0.1,gy-ih*0.8],[ix2+iw2*0.5,gy-ih*1.05],[ix2+iw2,gy],[ix2+iw2*0.2,gy]],1.8,70));sol.push(I);}
  behind(s,bg,[B,far1,far2]);
  return sky(s,R,gy,sol);}});

SUBJ.push({name:'Praying mantis',titles:['Patience on the Stem','Folded Hands','Garden Sentinel','Green Stillness','Waiting for a Fly'],build(R){
  var s=[],sol=[],a=RR(R,-0.12,0.12),cx=150,cy=100;
  var st=curve([[RR(R,30,60),196],[110,150],[170,110],[230,80],[RR(R,276,292),RR(R,40,60)]],8);s.push(st);s.push(st.map(function(p){return [p[0]+3,p[1]+2];}));
  [0.25,0.5,0.8].forEach(function(f,i){var p=st[Math.floor(st.length*f)],q=[p[0]+(i%2?28:-30),p[1]+(i%2?-20:24)];var L=lens(p,q,7);s.push(L);s.push([p,q]);H(s,L,1.8,i%2?-35:40);});
  var ab0=[208,96],ab1=[120,118];var wg=lens([214,92],[110,112],13);s.push(wg);H(s,wg,RR(R,2.2,2.6),RR(R,-14,-8));s.push([[214,92],[110,112]]);
  var abd=lens([212,98],[124,118],8);s.push(abd);for(var k=1;k<7;k++){var p=lerp([212,98],[124,118],k/7);s.push([[p[0]-2,p[1]-7],[p[0]+2,p[1]+7]]);}
  var th=[[124,114],[110,96],[100,76],[96,62]];s.push(curve(th,6));s.push(curve(th.map(function(p){return [p[0]+5,p[1]+1];}),6));
  var hd=[[90,56],[100,48],[106,54],[100,62],[94,62]];SOL(s,sol,hd);s.push(circle(92,54,3.5));H(s,EP(92,54,2.2,2.2),0.8,0);s.push(circle(104,52,3));
  s.push(curve([[98,48],[86,30],[70,20],[56,18]],6));s.push(curve([[102,48],[100,30],[92,14],[82,8]],6));
  var fm=[[100,74],[78,86],[74,92],[80,92],[102,80]];s.push(poly(fm));H(s,fm,1.2,30);s.push([[76,90],[92,70],[96,72],[80,92]]);for(var t=0;t<4;t++){var tp=lerp([78,88],[92,72],t/4);s.push([tp,[tp[0]+3,tp[1]+1]]);}
  var fm2=[[104,78],[90,94],[94,98],[108,84]];s.push(poly(fm2));s.push([[92,96],[100,76]]);
  [[[116,106],[120,128],[110,142]],[[122,108],[140,124],[146,136]],[[160,104],[170,124],[166,134]],[[170,102],[186,116],[190,120]]].forEach(function(L){s.push(L);});
  sol.push(wg,abd);
  var fl=st[st.length-1],fc=[fl[0],fl[1]-8];var pet=[];for(var p2=0;p2<6;p2++){var an=p2*TAU/6;pet.push(lens(fc,[fc[0]+16*Math.cos(an),fc[1]+16*Math.sin(an)],5));}A(s,pet);s.push(circle(fc[0],fc[1],4));H(s,EP(fc[0],fc[1],3,3),1,0);s.push([fl,[fc[0],fc[1]+4]]);sol.push(EP(fc[0],fc[1],20,20));
  var gb=[[4,196]];for(var x=4;x<296;x+=5)gb.push([x+2.5,196-RR(R,10,26)],[x+5,196]);s.push(gb);hills(s,R,186,RR(R,40,56),RR(R,3.6,4.4),[],0);
  return sky(s,R,150,sol);}});

SUBJ.push({name:'Chameleon on a branch',titles:['Slow Hands','One Eye Each Way','Changing the Subject','Curled Tail','Leaf Mimic'],build(R){
  var s=[],sol=[],cx=RR(R,138,158),cy=RR(R,92,100),sc=1;
  var T=function(P){return M(P,cx,cy,sc);};
  var B=T(blob([[-62,-6],[-74,-22],[-86,-30],[-92,-18],[-100,-8],[-92,2],[-70,6],[-56,10],[-30,16],[0,20],[30,16],[50,4],[54,-12],[40,-28],[14,-38],[-16,-38],[-40,-30],[-56,-18]],5));
  s.push(poly(B));sol.push(B);var cr=[];for(var x=-50;x<46;x+=6){var yb=interpY(B.filter(function(p){return p[1]<cy;}),cx+x);cr.push([cx+x,yb],[cx+x+3,yb-3]);}s.push(cr);
  for(var b=0;b<5;b++){var x0=-46+b*20,P=T([[x0,-40],[x0+8,-40],[x0+12,24],[x0+4,24]]);clipIn(s,hatch(P,1.4,80),B);}
  var e=T([[-80,-14]])[0];s.push(circle(e[0],e[1],7));s.push(circle(e[0],e[1],4));H(s,EP(e[0],e[1],1.8,1.8),0.8,0);s.push(T([[-100,-8],[-80,-2],[-70,0]]));
  var tb=T([[50,4]])[0];var tl=curve([tb,[tb[0]+14,tb[1]+12],[tb[0]+20,tb[1]+30]],6).concat(spiral(tb[0]+8,tb[1]+38,14,2,2.2,-0.5).slice(1));s.push(tl);s.push(curve([[tb[0]-4,tb[1]+10],[tb[0]+8,tb[1]+24],[tb[0]+6,tb[1]+40]],6));
  var by=cy+RR(R,26,30),br=[],br2=[];for(var x2=4;x2<=296;x2+=6){var yy=by+(x2-150)*0.12+3*Math.sin(x2/40);br.push([x2,yy]);br2.push([x2,yy+7]);}s.push(br);s.push(br2);H(s,br.concat(br2.slice().reverse()),RR(R,2.4,3),60);sol.push(br.concat(br2.slice().reverse()));
  [[-50,10],[-28,14],[20,14],[38,8]].forEach(function(l,i){var p=T([l])[0],fy=interpY(br,p[0]);var kx=p[0]+(i%2?6:-6);s.push([[p[0]-3,p[1]-2],[kx-2,(p[1]+fy)/2],[p[0]-3,fy]]);s.push([[p[0]+3,p[1]-2],[kx+2,(p[1]+fy)/2],[p[0]+3,fy]]);s.push([[p[0]-5,fy],[p[0]+5,fy]]);});
  hills(s,R,196,RR(R,50,70),RR(R,3.4,4),[],RR(R,-15,15));for(var k=0;k<RI(R,7,9);k++){var lx=RR(R,10,290),ly=interpY(br,lx);if(Math.abs(lx-cx)<70)continue;var up=R()<0.5?-1:1,q=[lx+RR(R,-12,12),ly+up*RR(R,22,34)];var L=lens([lx,ly],q,8);s.push(L);s.push([[lx,ly],q]);H(s,L,2,up*50);sol.push(L);}
  return sky(s,R,by,sol);}});

SUBJ.push({name:'Goldfish bowl',titles:['Round World','Two in the Glass','Window Ledge Aquarium','Orange Slowness','Bubbles at Noon'],build(R){
  var s=[],sol=[],ty=RR(R,158,164),cx=RR(R,136,164),r=RR(R,56,60),cy=ty-r+6;
  var rimY=cy-r*0.72,rx=r*0.68,a0=Math.asin(-0.72),ang=Math.acos(rx/r);
  var bowl=arc(cx,cy,r,r,-PI/2+0.75,PI/2).concat(arc(cx,cy,r,r,PI/2,1.5*PI-0.75).slice(1));
  var BW=arc(cx,cy,r,r,-PI/2+0.76,1.5*PI-0.76);s.push(BW);s.push(ellipse(cx,rimY,rx,4.5));var B=BW.concat([[cx-rx,rimY]]);sol.push(B);
  var wl=cy-r*0.45,ww=Math.sqrt(r*r-(wl-cy)*(wl-cy));s.push(ellipse(cx,wl,ww,4));
  var gravel=[];var gy0=cy+r*0.62;clipIn(s,[scallopRows(cx-r,cx+r,gy0,cy+r,5,2.2)],EP(cx,cy,r-1,r-1));
  for(var p=0;p<3;p++){var px=cx+RR(R,-30,30),pts=[];for(var t=0;t<=6;t++)pts.push([px+4*Math.sin(t+p),gy0-t*RR(R,6,8)]);s.push(curve(pts,5));}
  function fish(fx,fy,d,sz){var F=M(blob([[0,-6],[9,-5],[14,0],[9,5],[0,6],[-8,3],[-10,0],[-8,-3]],4),fx,fy,sz,d);var Tl=M([[-9,0],[-20,-9],[-17,0],[-20,9]],fx,fy,sz,d);s.push(poly(F));s.push(poly(Tl));H(s,Tl,1,d*20);
    clipIn(s,[scallopRows(fx-10*sz,fx+12*sz,fy-6*sz,fy+6*sz,2.4*sz,1.4*sz)],F);var e=M([[8,-1.5]],fx,fy,sz,d)[0];s.push(circle(e[0],e[1],1.3));s.push(M([[0,-6],[-4,-11],[4,-6]],fx,fy,sz,d));s.push(M([[2,5],[-2,9],[5,5]],fx,fy,sz,d));}
  fish(cx-RR(R,6,16),cy+RR(R,-4,8),1,RR(R,1.4,1.7));fish(cx+RR(R,16,26),cy-RR(R,12,20),-1,RR(R,1.1,1.3));
  var bl=[[cx+12,wl-2],[cx+14,wl+20],[cx+10,wl+40]];for(var k=0;k<3;k++){var bp=lerp(bl[0],bl[2],k/3);s.push(circle(bp[0]+2,bp[1]+2,1.4+k*0.4));}
  s.push(arc(cx,cy,r-6,r-6,PI*1.05,PI*1.35));s.push(arc(cx,cy,r-9,r-9,PI*1.08,PI*1.3));
  var sh=arc(cx+10,ty,r*0.8,5,0,PI);s.push(sh);H(s,sh.concat([[cx+10-r*0.8,ty]]),1.4,0);
  s.push([[4,ty],[296,ty]]);s.push([[4,ty+6],[296,ty+6]]);H(s,[[4,ty+6],[296,ty+6],[296,196],[4,196]],RR(R,3,3.6),0);
  var wx=cx>150?RR(R,20,40):RR(R,200,230),ww2=RR(R,60,70),wt=RR(R,24,34),wb=ty-RR(R,24,30);if(wx+ww2>292)wx=292-ww2;var W=[[wx,wb],[wx,wt],[wx+ww2,wt],[wx+ww2,wb]];s.push(poly(W));s.push(rect(wx+4,wt+4,wx+ww2-4,wb-4));s.push([[wx+ww2/2,wt+4],[wx+ww2/2,wb-4]]);s.push([[wx+4,(wt+wb)/2],[wx+ww2-4,(wt+wb)/2]]);s.push(rect(wx-4,wb,wx+ww2+4,wb+4));
  sol.push(W.concat());
  return sky(s,R,ty,sol);}});

SUBJ.push({name:'Desert island with a palm',titles:['Only One Tree','Castaway Weather','Coconut Shade','Message Pending','Low Tide Islet'],build(R){
  var s=[],sol=[],wl=RR(R,132,140),ix=RR(R,130,170),iw=RR(R,70,86),ih=RR(R,18,24),d=R()<0.5?1:-1;
  var isl=arc(ix,wl,iw,ih,PI,TAU);s.push(isl);var IS=isl.concat([[ix+iw,wl+2],[ix-iw,wl+2]]);sol.push(IS);H(s,isl,RR(R,3,3.6),d*15);
  function palm(bx,lean,ht,nf){var tp=[bx+lean,wl-ih*0.7-ht],tr=curve([[bx,wl-ih*0.7],[bx+lean*0.3,wl-ih*0.7-ht*0.5],tp],10);var tr2=tr.map(function(p,i){var w=4-2*i/tr.length;return [p[0]+w,p[1]];});s.push(tr);s.push(tr2);
    for(var i=2;i<tr.length-1;i+=2)s.push([tr[i],[tr2[i][0],tr2[i][1]-2]]);sol.push(tr.concat(tr2.slice().reverse()));
    for(var f=0;f<nf;f++){var an=-PI+f*PI/(nf-1)+RR(R,-0.15,0.15),L=RR(R,42,54),e=[tp[0]+L*Math.cos(an),tp[1]+L*Math.sin(an)*0.5+L*0.35],c=[tp[0]+L*0.6*Math.cos(an),tp[1]-12];var fr=quad(tp,c,e,14);s.push(fr);
      for(var j=2;j<fr.length;j+=3){var p=fr[j],q=[p[0]+3*Math.cos(an+1.2),p[1]+6];s.push([p,q,p]);}}
    for(var c2=0;c2<3;c2++)s.push(circle(tp[0]-3+c2*3,tp[1]+4,2.3));}
  palm(ix+d*8,d*RR(R,26,36),RR(R,88,100),RI(R,7,8));palm(ix-d*16,-d*RR(R,16,24),RR(R,56,66),6);
  var wat=waterS(R,4,296,wl+3,194,RR(R,5.5,6.5),1.4);behind(s,[[[4,wl],[296,wl]],wat],[IS.concat([[ix+iw,wl+8],[ix-iw,wl+8]])]);
  var fo=[];for(var x=ix-iw-8;x<ix+iw+8;x+=6)A(fo,arc(x+3,wl+3,3,2,PI,0));s.push(fo);
  sunH(s,d>0?RR(R,28,60):RR(R,240,272),wl,RR(R,10,13));
  return sky(s,R,wl,sol);}});

SUBJ.push({name:'Giant sequoia',titles:['Three Thousand Winters','Red Column','Forest Elder','Looking Up','Bark Like Rope'],build(R){
  var s=[],sol=[],gy=RR(R,176,182),cx=RR(R,130,160),w0=RR(R,42,48),w1=RR(R,26,30);
  var L=[[cx-w0-10,gy],[cx-w0,gy-12],[cx-w0+4,gy-40],[cx-w1,gy-110],[cx-w1+2,4]],Rr=[[cx+w0+12,gy],[cx+w0,gy-14],[cx+w0-3,gy-44],[cx+w1,gy-112],[cx+w1-2,4]];
  var lc=curve(L,8),rc=curve(Rr,8);s.push(lc);s.push(rc);var TR=lc.concat(rc.slice().reverse());sol.push(TR);
  var bark=[];for(var k=0;k<7;k++){var f=(k+0.5)/7,pts=[];for(var t=0;t<=10;t++){var y=gy-(gy-4)*t/10,xl=interpY(lc.map(function(p){return [p[1],p[0]];}),y),xr=interpY(rc.map(function(p){return [p[1],p[0]];}),y);pts.push([xl+(xr-xl)*f+RR(R,-1.5,1.5),y]);}bark.push(curve(pts,4));}A(s,bark);
  var sh=[];for(var t2=0;t2<=12;t2++){var y2=gy-(gy-4)*t2/12,xr2=interpY(rc.map(function(p){return [p[1],p[0]];}),y2);sh.push([xr2,y2]);}
  var shP=sh.concat(sh.slice().reverse().map(function(p){return [p[0]-RR(R,14,18),p[1]];}));H(s,shP,1.5,RR(R,70,80));
  var bs=[[cx-6,gy],[cx-4,gy-26],[cx+6,gy-26],[cx+8,gy]];s.push(bs);H(s,bs,1.2,0);
  [[-1,60],[1,46],[-1,22],[1,12]].forEach(function(b){var y=b[1]+RR(R,-4,4),x0=interpY((b[0]<0?lc:rc).map(function(p){return [p[1],p[0]];}),y),bx=x0+b[0]*RR(R,30,46);s.push([[x0,y],[bx,y-8]]);var fol=scallop(bx,y-12,RR(R,16,22),RR(R,8,11),RI(R,7,9),0.2);s.push(fol);H(s,fol,RR(R,2.4,3),RR(R,30,50));sol.push(fol);});
  [[RR(R,20,50),RR(R,8,10)],[RR(R,240,280),RR(R,10,12)]].forEach(function(t){var x=t[0],w=t[1],P=[[x-w,gy],[x-w*0.7,4],[x+w*0.7,4],[x+w,gy]];s.push([[x-w,gy],[x-w*0.7,4]]);s.push([[x+w*0.7,4],[x+w,gy]]);sol.push(P);A(s,hatch(P,RR(R,3,3.6),90).slice(0,1));});
  var fern=function(fx,fy,d){for(var f=0;f<4;f++){var an=-PI/2+d*(0.3+f*0.3),e=[fx+30*Math.cos(an),fy+20*Math.sin(an)-4],c=quad([fx,fy],[fx+16*Math.cos(an),fy-18],e,10);s.push(c);for(var j=2;j<c.length-1;j+=2)s.push([c[j],[c[j][0]+d*3,c[j][1]+4],c[j]]);}};
  fern(cx-w0-18,gy,-1);fern(cx+w0+20,gy,1);
  s.push([[4,gy],[296,gy]]);H(s,[[4,gy],[296,gy],[296,196],[4,196]],RR(R,3,3.6),RR(R,10,25));
  return sky(s,R,gy,sol);}});

SUBJ.push({name:'Monstera in a pot',titles:['Swiss Cheese Plant','Split Leaves','Corner by the Window','Green Windows','Sunday Repotting'],build(R){
  var s=[],sol=[],fy=RR(R,166,172),px=RR(R,136,164),pw=RR(R,28,32),ph=RR(R,40,46),pt=fy-ph;
  var P=[[px-pw,pt],[px+pw,pt],[px+pw*0.75,fy],[px-pw*0.75,fy]];SOL(s,sol,P);s.push(rect(px-pw-3,pt-6,px+pw+3,pt));H(s,[[px+pw*0.3,pt],[px+pw,pt],[px+pw*0.75,fy],[px+pw*0.25,fy]],1.6,90);
  for(var b=0;b<3;b++){var by=pt+10+b*10;s.push([[px-pw+b*2.5+1,by],[px+pw-b*2.5-1,by]]);}
  var leaves=[[-1.9,62,30],[-1.4,80,34],[-0.9,70,32],[-2.4,52,26],[-0.5,54,26],[-1.65,40,22]];
  leaves.forEach(function(Lv,i){var an=Lv[0]+RR(R,-0.12,0.12),len=Lv[1]*RR(R,0.92,1.08),sz=Lv[2],base=[px+RR(R,-8,8),pt-6],tip=[base[0]+len*Math.cos(an),base[1]+len*Math.sin(an)];
    s.push(quad(base,[base[0]+len*0.4*Math.cos(an),base[1]+len*0.6*Math.sin(an)-10],tip,10));
    var d=an+RR(R,-0.4,0.4),cx=tip[0]+sz*0.8*Math.cos(d),cy=tip[1]+sz*0.8*Math.sin(d),out=[];var n=40;
    for(var k=0;k<=n;k++){var t=k/n*TAU,rr=sz*(0.8+0.25*Math.cos(t)),q=[cx+rr*Math.cos(t+d),cy+rr*0.8*Math.sin(t+d)];
      if(k%5===2&&k>3&&k<n-3){var inner=[cx+(q[0]-cx)*0.45,cy+(q[1]-cy)*0.45];out.push(q,inner,[cx+rr*Math.cos(t+d+0.08),cy+rr*0.8*Math.sin(t+d+0.08)]);}else out.push(q);}
    s.push(out);s.push([tip,[cx+sz*1.05*Math.cos(d),cy+sz*0.84*Math.sin(d)]]);sol.push(out);
    var half=[];for(var k2=0;k2<=n/2;k2++){var t2=k2/n*TAU,r2=sz*(0.8+0.25*Math.cos(t2))*0.42;half.push([cx+r2*Math.cos(t2+d),cy+r2*0.8*Math.sin(t2+d)]);}H(s,half.concat([[cx,cy]]),1.4,RR(R,0,180));
    if(sz>28)for(var h=0;h<2;h++){var ht=RR(R,0.6,2.4),hr=sz*0.6;s.push(ellipse(cx+hr*Math.cos(ht+d),cy+hr*0.8*Math.sin(ht+d),2.4,1.4));}});
  floorS(s,R,fy,RI(R,10,14));
  return sky(s,R,fy,sol);}});

SUBJ.push({name:'Dandelion clock',titles:['Make a Wish','One Breath Away','Seed Globe','Late May Meadow','Before the Wind'],build(R){
  var s=[],sol=[],gy=RR(R,166,172),hx=RR(R,140,170),hy=RR(R,66,74),hr=RR(R,34,38);
  s.push(curve([[hx-RR(R,10,30),196],[hx-10,(gy+hy)/2+20],[hx-2,hy+hr*0.4],[hx,hy+4]],8));s.push(circle(hx,hy,4));H(s,EP(hx,hy,3,3),0.8,0);
  var n=RI(R,40,48),ph=R()*TAU;for(var k=0;k<n;k++){var a=ph+k*TAU/n+RR(R,-0.04,0.04),L=hr*RR(R,0.9,1.05),e=[hx+L*Math.cos(a),hy+L*Math.sin(a)];if(a%TAU>1.2&&a%TAU<1.9&&R()<0.7)continue;s.push([[hx+4*Math.cos(a),hy+4*Math.sin(a)],e]);
    for(var f=-1;f<=1;f++){var b=a+f*0.4;s.push([e,[e[0]+6*Math.cos(b),e[1]+6*Math.sin(b)]]);}}
  sol.push(EP(hx,hy,hr+8,hr+8));
  var sx=hx+RR(R,40,60);for(var d=0;d<3;d++){var p=[sx+d*16,hy-10-d*14],q=[p[0]-10,p[1]+8];s.push([q,p]);for(var f2=-2;f2<=2;f2++){var b2=-0.8+f2*0.3;s.push([p,[p[0]+5*Math.cos(b2),p[1]+5*Math.sin(b2)]]);}}
  s.push([[hx+hr*0.7,hy-hr*0.7],[sx-10,hy-2]]);
  var f=[hx-RR(R,70,90),gy-RR(R,30,40)];s.push(curve([[f[0]+6,196],[f[0]+2,gy],[f[0],f[1]+6]],6));var fl=scallop(f[0],f[1],12,12,14,0.18);s.push(fl);s.push(scallop(f[0],f[1],7,7,10,0.2));H(s,EP(f[0],f[1],5,5),1.2,0);sol.push(EP(f[0],f[1],14.5,14.5));
  var bud=[hx+RR(R,60,80),gy-RR(R,20,26)];s.push(curve([[bud[0]-4,196],[bud[0]-2,gy],[bud[0],bud[1]+6]],6));var bd=lens([bud[0],bud[1]+6],[bud[0],bud[1]-8],5);s.push(bd);H(s,bd,1.3,90);sol.push(bd);
  for(var l=0;l<3;l++){var lx=RR(R,40,260),lf=[[lx,196]];for(var j=1;j<=6;j++)lf.push([lx+j*6*(l%2?1:-1),196-j*4-(j%2?6:0)]);for(var j2=6;j2>=1;j2--)lf.push([lx+j2*6*(l%2?1:-1)+(l%2?-2:2),196-j2*4+2]);lf.push([lx,196]);s.push(lf);}
  var gr=[[4,gy]];for(var x=4;x<296;x+=4)gr.push([x+2,gy-RR(R,8,18)],[x+4,gy]);s.push(gr);H(s,[[4,gy],[296,gy],[296,196],[4,196]],RR(R,2.6,3.2),RR(R,70,85));
  return sky(s,R,gy,sol);}});

SUBJ.push({name:'Pinecone on the forest floor',titles:['Fallen in October','Scales and Spirals','Forest Floor Still Life','Seed Keeper','Needles and Moss'],build(R){
  var s=[],sol=[],hz=RR(R,66,76),cx=RR(R,140,160),cy=RR(R,138,146),a=RR(R,-0.35,-0.15),L=RR(R,64,72),W=RR(R,26,30);
  var trunks=[];for(var t=0;t<RI(R,5,7);t++){var tx=RR(R,10,290),tw=RR(R,6,14);trunks.push([[tx-tw,hz+RR(R,4,12)],[tx-tw,4],[tx+tw,4],[tx+tw,hz+RR(R,4,12)]]);}
  var cone=[];for(var k=0;k<=40;k++){var u=k/40*TAU,rx=L,ry=W*(1-0.25*Math.cos(u));cone.push([cx+rx*Math.cos(u),cy+ry*Math.sin(u)]);}cone=rot(cone,cx,cy,a);
  var sc=[];for(var r=0;r<9;r++){var x0=cx-L*0.85+r*L*0.2,rows=Math.round(5-Math.abs(r-4)*0.4);for(var j=0;j<6;j++){var y0=cy-W*0.85+j*W*0.34+(r%2)*W*0.17;sc.push(arc(x0,y0,L*0.1,W*0.15,-0.3*PI,0.9*PI));}}
  var scr=sc.map(function(st){return rot(st,cx,cy,a);});clipIn(s,scr,cone);s.push(poly(cone).slice(0,-1).concat([cone[0]]));sol.push(cone);
  var low=[];for(var k2=0;k2<=20;k2++){var u2=k2/20*PI;low.push([cx+L*Math.cos(u2),cy+W*0.95*Math.sin(u2)*(1-0.25*Math.cos(u2))]);}H(s,rot(low,cx,cy,a),1.6,a*180/PI);
  var tipP=rot([[cx+L,cy]],cx,cy,a)[0];s.push([tipP,[tipP[0]+10,tipP[1]-4],[tipP[0]+14,tipP[1]-2]]);
  var sh=rot(arc(cx+6,cy+W*0.8,L*0.9,6,0,PI),cx,cy,a);s.push(sh);H(s,sh,1.6,0);
  s.push([[4,hz],[296,hz]]);behind(s,trunks.concat(trunks.map(function(P){return hatch(P,RR(R,2.6,3.2),90)[0]||P;})),[]);sol.push.apply(sol,trunks);
  var fl=[];for(var y=hz+8;y<196;y+=RR(R,6,9)){var w=wave(4,296,y,1.4,RR(R,20,34),R()*6);fl.push(w);}behind(s,fl,[cone,[[cx-L,cy+W*0.4],[cx+L,cy+W*0.4],[cx+L,cy+W+10],[cx-L,cy+W+10]].map(function(p){return p;})]);
  for(var n=0;n<RI(R,6,9);n++){var nx=RR(R,10,290),ny=RR(R,hz+20,190);if(Math.abs(nx-cx)<L+10&&Math.abs(ny-cy)<W+10)continue;var na=RR(R,0,PI);s.push([[nx,ny],[nx+18*Math.cos(na),ny+18*Math.sin(na)*0.4]]);s.push([[nx,ny],[nx+18*Math.cos(na+0.2),ny+18*Math.sin(na+0.2)*0.4]]);}
  var mx=cx>150?RR(R,30,60):RR(R,230,270),my=RR(R,hz+40,hz+60);s.push([[mx-3,my+18],[mx-2,my],[mx+2,my],[mx+3,my+18]]);var cap=arc(mx,my,14,10,PI,TAU);s.push(cap);s.push([[mx-14,my],[mx+14,my]]);H(s,cap,1.6,20);sol.push(cap);
  return sky(s,R,hz,sol);}});

SUBJ.push({name:'Daffodils',titles:['March Trumpets','Wordless Yellow','First Warm Week','Nodding by the Wall','Spring Brass'],build(R){
  var s=[],sol=[],gy=RR(R,174,180),wy=gy-RR(R,40,48);
  s.push(brickS(4,wy,296,gy,RR(R,26,30),RR(R,10,12)));s.push(rect(4,wy-5,296,wy));H(s,[[4,wy-5],[296,wy-5],[296,wy],[4,wy]],1.4,0);
  var fl=[];var n=RI(R,5,6);for(var i=0;i<n;i++){var x=40+i*220/(n-1)+RR(R,-10,10),hy=RR(R,50,96),d=R()<0.5?1:-1;fl.push([x,hy,d]);}
  var front=[];fl.forEach(function(f){var x=f[0],hy=f[1],d=f[2],st=quad([x+RR(R,-6,6),gy],[x-d*6,(gy+hy)/2],[x,hy+10],10);var pe=[],c=[x,hy];
    for(var p=0;p<6;p++){var an=p*TAU/6+R()*0.3,e=[c[0]+18*Math.cos(an),c[1]+13*Math.sin(an)];var L=lens(c,e,6);pe.push(L);}
    var tr=[[c[0]-5,c[1]-1],[c[0]-6+d*12,c[1]-4],[c[0]+6+d*12,c[1]+4],[c[0]+5,c[1]+1]];
    var rim=scallop(c[0]+d*13,c[1],4,7,8,0.2);front.push({st:st,pe:pe,tr:tr,rim:rim,c:c,d:d});
    sol.push(EP(c[0],c[1],20,15));});
  var lvs=[];for(var k=0;k<RI(R,7,10);k++){var lx=RR(R,30,270),lh=RR(R,60,100),lean=RR(R,-30,30);lvs.push(lens([lx,gy],[lx+lean,gy-lh],4));}
  var holes=[];front.forEach(function(F){s.push(F.st);});A(s,lvs);lvs.forEach(function(L,i){if(i%2)H(s,L,1.6,80);});
  front.forEach(function(F){var c=F.c;F.pe.forEach(function(P){s.push(P);});H(s,EP(c[0],c[1],8,6),1.4,30);s.push(poly(F.tr));H(s,F.tr,1.3,F.d>0?80:-80);s.push(F.rim);});
  s.push([[4,gy],[296,gy]]);H(s,[[4,gy],[296,gy],[296,196],[4,196]],RR(R,3,3.6),RR(R,-20,20));
  return sky(s,R,wy-5,sol.concat(lvs));}});

SUBJ.push({name:'Cornfield and scarecrow',titles:['Guarding the Rows','Straw Sentry','Crows Know Better','Late Summer Field','Old Coat, Old Hat'],build(R){
  var s=[],sol=[],gy=RR(R,166,172),cx=RR(R,136,164),bar=RR(R,70,78),aw=RR(R,58,66);
  s.push([[cx-2,gy],[cx-2,bar-26],[cx+2,bar-26],[cx+2,gy]]);s.push([[cx-aw,bar],[cx+aw,bar]]);s.push([[cx-aw,bar+3],[cx+aw,bar+3]]);
  var hd=EP(cx,bar-24,11,12);SOL(s,sol,hd);s.push([[cx-11,bar-30],[cx+11,bar-30]]);var hat=[[cx-18,bar-32],[cx+18,bar-32],[cx+10,bar-36],[cx+8,bar-50],[cx-8,bar-50],[cx-10,bar-36]];SOL(s,sol,hat);H(s,[[cx-10,bar-36],[cx+10,bar-36],[cx+8,bar-50],[cx-8,bar-50]],1.3,0);
  s.push([[cx-5,bar-26],[cx-3,bar-24]]);s.push([[cx-3,bar-26],[cx-5,bar-24]]);s.push([[cx+3,bar-26],[cx+5,bar-24]]);s.push([[cx+5,bar-26],[cx+3,bar-24]]);for(var m=-5;m<=5;m+=2.5)s.push([[cx+m,bar-18],[cx+m,bar-16]]);
  var coat=[[cx-14,bar-8],[cx-aw+8,bar-4],[cx-aw+8,bar+10],[cx-18,bar+8],[cx-20,bar+56],[cx+20,bar+56],[cx+18,bar+8],[cx+aw-8,bar+10],[cx+aw-8,bar-4],[cx+14,bar-8]];SOL(s,sol,coat);
  H(s,[[cx-18,bar+8],[cx-20,bar+56],[cx-6,bar+56],[cx-4,bar-6]],1.6,80);s.push([[cx,bar-8],[cx,bar+56]]);var pa=[[cx+6,bar+20],[cx+16,bar+20],[cx+16,bar+32],[cx+6,bar+32]];s.push(poly(pa));H(s,pa,1.2,45);
  [-1,1].forEach(function(e){var ex=cx+e*(aw-8);for(var k=-2;k<=2;k++)s.push([[ex,bar+3+k*2.5],[ex+e*9,bar+3+k*4]]);});
  for(var k2=-3;k2<=3;k2++)s.push([[cx+k2*5,bar+56],[cx+k2*6,bar+66]]);
  [-1,1].forEach(function(e){var L=[[cx+e*4,bar+56],[cx+e*5,bar+86],[cx+e*13,bar+86],[cx+e*14,bar+56]];s.push(L);H(s,L,2,e*80);});
  perched(s,cx-aw+RR(R,4,12),bar,4.5,1);if(R()<0.7)perched(s,cx+aw-RR(R,4,12),bar,4.5,-1);
  var rows=[];for(var x=8;x<292;x+=RR(R,14,18)){if(Math.abs(x-cx)<26)continue;var h=RR(R,70,92),b=gy+RR(R,0,8),st=[[x,b],[x+RR(R,-2,2),b-h]];rows.push(st);
    for(var j=0;j<3;j++){var ly=b-h*(0.3+j*0.22),dd=j%2?1:-1;rows.push(quad([x,ly],[x+dd*12,ly-10],[x+dd*16,ly+4],8));}rows.push([[x,b-h],[x-4,b-h-8]]);rows.push([[x,b-h],[x+4,b-h-8]]);
    if(R()<0.5){var cb=lens([x,b-h*0.5],[x+5,b-h*0.5-14],3);rows.push(cb);}sol.push([[x-16,b],[x-16,b-h-8],[x+16,b-h-8],[x+16,b]]);}
  behind(s,rows,[coat,hd,hat,[[cx-15,gy],[cx-15,bar+56],[cx+15,bar+56],[cx+15,gy]]]);
  s.push([[4,gy],[296,gy]]);H(s,[[4,gy],[296,gy],[296,196],[4,196]],RR(R,3,3.8),RR(R,10,25));
  return sky(s,R,gy,[coat,hd,hat]);}});

SUBJ.push({name:'Geyser',titles:['Right on Schedule','Steam Column','Earth Exhales','Boardwalk Crowd Gone','Sulfur Morning'],build(R){
  var s=[],sol=[],gy=RR(R,162,168),vx=RR(R,136,164),top=RR(R,30,40);
  var mound=arc(vx,gy,RR(R,90,110),RR(R,14,18),PI,TAU);s.push(mound);for(var t=1;t<4;t++){var tr=arc(vx,gy,(100-t*22),(16-t*3),PI,TAU);s.push(scallopRows(vx-(100-t*22),vx+(100-t*22),gy-(16-t*3)+2,gy-(16-t*3)+2,6,1.5));}
  var col=[[vx-5,gy-14]];for(var y=gy-14;y>top+40;y-=6){var f=(gy-14-y)/(gy-54-top);col.push([vx-5-f*16+RR(R,-2,2),y]);}
  var colR=[];for(var y2=top+40;y2<=gy-14;y2+=6){var f2=(gy-14-y2)/(gy-54-top);colR.push([vx+5+f2*16+RR(R,-2,2),y2]);}
  var cl=scallop(vx,top+26,RR(R,36,44),RR(R,24,28),RI(R,9,11),0.22);var clT=cl.filter(function(p){return p[1]<top+38||Math.abs(p[0]-vx)>22;});
  var C=col.concat(clT.filter(function(p){return p[0]<vx;}).sort(function(a,b){return 0;}));
  s.push(col);s.push(colR);s.push(cl);sol.push(col.concat(colR),cl);
  var stk=[];for(var k=-3;k<=3;k++){var pts=[];for(var y3=gy-16;y3>top+30;y3-=5){var f3=(gy-14-y3)/(gy-54-top);pts.push([vx+k*(1.6+f3*3)+1.5*Math.sin(y3/6+k),y3]);}stk.push(pts);}A(s,stk);
  for(var q=0;q<3;q++){var cq=scallop(vx+RR(R,-14,14),top+RR(R,14,34),RR(R,10,16),RR(R,7,10),6,0.25);clipIn(s,[cq],cl);}
  [[-1,RR(R,30,50)],[1,RR(R,24,40)]].forEach(function(p){var px=vx+p[0]*(60+p[1]),pc=scallop(px,gy-26,RR(R,14,18),RR(R,10,12),7,0.25);pc=pc.filter(function(q){return q[1]<gy-14;});s.push(pc);s.push([[px,gy-16],[px,gy-6]]);H(s,pc,3,40);sol.push(pc);});
  s.push([[4,gy],[296,gy]]);var bw=gy+RR(R,14,18);s.push([[10,bw],[290,bw]]);s.push([[10,bw+4],[290,bw+4]]);s.push(comb(10,290,bw,12,10));s.push([[10,bw-12],[290,bw-12]]);H(s,[[10,bw],[290,bw],[290,bw+4],[10,bw+4]],1.2,0);
  for(var px2=14;px2<290;px2+=30)s.push([[px2,bw+4],[px2,196]]);
  H(s,[[4,gy],[296,gy],[296,bw-12],[4,bw-12]],RR(R,3.4,4),RR(R,10,20));
  var hl=hills(s,R,gy-6,RR(R,30,40),0);for(var p3=0;p3<RI(R,5,8);p3++){var tx=RR(R,6,294);if(Math.abs(tx-vx)<70)continue;pineT(s,tx,interpY(hl,tx)+6,RR(R,0.6,0.9),2.2);}
  return sky(s,R,gy-6,sol.concat([hl.concat([[296,gy],[4,gy]])]));}});

// ---- chunk C: objects, food, toys, interiors ----
function wallTable(s,R,ty,sol){s.push([[4,ty],[296,ty]]);var y2=ty+RR(R,6,9);s.push([[4,y2],[296,y2]]);H(s,[[4,ty],[296,ty],[296,y2],[4,y2]],1.8,0);
  var p=[],d=1;for(var yy=y2+6;yy<196;yy+=RR(R,6,9)){if(d>0)p.push([4,yy],[296,yy]);else p.push([296,yy],[4,yy]);d=-d;}if(p.length)s.push([[4,y2],[4,p[0][1]]].concat(p));return s;}

SUBJ.push({name:'Sand castle on the beach',titles:['Before the Tide Turns','Bucket Towers','King of the Low Tide','Moat Full of Sea','August Fortress'],build(R){
  var s=[],sol=[],gy=RR(R,150,156),cx=RR(R,130,160),sh=RR(R,92,100),kw=RR(R,26,30),kh=RR(R,40,46),kt=gy-kh;
  var wl=[[cx-62,gy],[cx-62,gy-22],[cx+62,gy-22],[cx+62,gy]];s.push(wl);s.push(merlons(cx-62,cx+62,gy-22,4,8));sol.push([[cx-62,gy],[cx-62,gy-26],[cx+62,gy-26],[cx+62,gy]]);
  H(s,[[cx-62,gy-12],[cx+62,gy-12],[cx+62,gy],[cx-62,gy]],RR(R,3,3.6),RR(R,20,30));
  var K=[[cx-kw,gy-22],[cx-kw,kt],[cx+kw,kt],[cx+kw,gy-22]];SOL(s,sol,K);s.push(merlons(cx-kw,cx+kw,kt,5,8));sol.push([[cx-kw,kt],[cx-kw,kt-5],[cx+kw,kt-5],[cx+kw,kt]]);
  var gt=archP(cx,gy,8,10);s.push(gt);H(s,gt,1.3,0);for(var w=-1;w<=1;w+=2){var wn=archP(cx+w*12,kt+18,3,4);s.push(wn);H(s,wn,1,0);}
  [-1,1].forEach(function(e){var tx=cx+e*RR(R,52,58),tw=RR(R,13,15),th=RR(R,50,58),tt=gy-th;var T=[[tx-tw,gy],[tx-tw*0.8,tt],[tx+tw*0.8,tt],[tx+tw,gy]];SOL(s,sol,T);
    for(var r=1;r<5;r++){var y=gy-th*r/5,ww=tw-(tw*0.2)*r/5;s.push([[tx-ww,y],[tx+ww,y]]);}s.push(ellipse(tx,tt,tw*0.8,2.5));s.push(merlons(tx-tw*0.8,tx+tw*0.8,tt,3,5.5));
    H(s,[[tx+e*tw*0.2,gy],[tx+e*tw*0.2,tt],[tx+e*tw*0.8,tt],[tx+e*tw,gy]],1.5,90);});
  s.push([[cx,kt-5],[cx,kt-30]]);var fl=[[cx,kt-30],[cx+16,kt-25],[cx,kt-20]];s.push(fl);H(s,fl,1,0);
  var mt=arc(cx,gy+10,82,8,0,PI);s.push(arc(cx,gy+4,78,6,0,PI));s.push(mt);H(s,arc(cx,gy+10,80,7,0.2,PI-0.2),2,0);
  var bx=cx+RR(R,92,104);if(bx>270)bx=cx-RR(R,92,104);var bk=[[bx-12,gy+16],[bx-15,gy-6],[bx+15,gy-6],[bx+12,gy+16]];SOL(s,sol,bk);s.push(ellipse(bx,gy-6,15,3));s.push(arc(bx,gy-6,15,14,PI,TAU));H(s,[[bx+4,gy+16],[bx+4,gy-6],[bx+15,gy-6],[bx+12,gy+16]],1.4,90);
  var spx=bx+(bx>cx?-28:28);s.push([[spx,gy+14],[spx+8,gy-36]]);s.push([[spx+6,gy-36],[spx+11,gy-36]]);var bl=[[spx-6,gy+14],[spx+6,gy+14],[spx+4,gy+24],[spx-4,gy+24]];s.push(poly(bl));H(s,bl,1,0);
  s.push([[4,gy-sh+50],[296,gy-sh+50]]);var sea=waterS(R,4,296,gy-sh+54,gy-24,RR(R,5,6),1.2);behind(s,[sea],sol);var fo=[[4,gy-22]];for(var x=4;x<296;x+=8)A(fo,arc(x+4,gy-22,4,2.4,PI,0));behind(s,[fo],sol);
  for(var k=0;k<RI(R,3,5);k++){var sx=RR(R,10,290),sy=RR(R,gy+22,190);if(Math.abs(sx-cx)<90&&sy<gy+30)continue;s.push(scallop(sx,sy,4,3,5,0.2));}
  H(s,[[4,gy+18],[296,gy+18],[296,196],[4,196]],RR(R,4,5),RR(R,-20,-10));
  return sky(s,R,gy-sh+50,sol);}});

SUBJ.push({name:'Drum kit',titles:['Count It In','Four on the Floor','Brass and Skins','Rehearsal Room','Before the Gig'],build(R){
  var s=[],sol=[],fy=RR(R,176,182),cx=RR(R,140,160),br=RR(R,30,34),bc=fy-br-2;
  var BD=EP(cx,bc,br,br);s.push(poly(BD));s.push(circle(cx,bc,br-4));HX(s,[BD,EP(cx,bc,br-4,br-4)],1.2,0);for(var k=0;k<10;k++){var a=k*TAU/10;s.push([[cx+br*Math.cos(a),bc+br*Math.sin(a)],[cx+(br+3)*Math.cos(a),bc+(br+3)*Math.sin(a)]]);}
  s.push(circle(cx,bc,8));sol.push(EP(cx,bc,br+3,br+3));
  var tm=[];[-1,1].forEach(function(e){var tx=cx+e*16,ty=bc-br-8;cyl(s,tx,ty+8,11,14,1.4,e);s.push([[tx,ty+8],[cx,bc-br]]);sol.push([[tx-11,ty+8],[tx-11,ty-9],[tx+11,ty-9],[tx+11,ty+8]]);});
  var ft=cx+br+RR(R,26,30);cyl(s,ft,fy-12,16,26,1.6,1);[-1,1].forEach(function(e){s.push([[ft+e*14,fy-12],[ft+e*18,fy]]);});sol.push([[ft-16,fy-12],[ft-16,fy-42],[ft+16,fy-42],[ft+16,fy-12]]);
  var sx=cx-br-RR(R,22,26),sy=fy-RR(R,44,48);cyl(s,sx,sy,15,10,1.4,-1);s.push([[sx,sy],[sx,fy-14]]);[-1,0,1].forEach(function(e){s.push([[sx,fy-14],[sx+e*14,fy]]);});sol.push([[sx-15,sy],[sx-15,sy-14],[sx+15,sy-14],[sx+15,sy]]);
  var hx=sx-RR(R,30,36),hy=fy-RR(R,76,84);s.push([[hx,hy],[hx,fy-16]]);[-1,1].forEach(function(e){s.push([[hx,fy-16],[hx+e*14,fy]]);});s.push(ellipse(hx,hy,18,3.5));s.push(ellipse(hx,hy+3,18,3.5));s.push(rect(hx-6,fy-4,hx+6,fy));
  var cy=fy-RR(R,120,130),crx=cx+RR(R,40,56);s.push([[ft,fy],[ft+20,fy-8],[crx+4,cy+30]]);s.push([[crx+4,cy+30],[crx,cy]]);var cym=EP(crx,cy,22,5);s.push(poly(cym));H(s,[[crx-22,cy],[crx+22,cy],[crx+16,cy+3],[crx-16,cy+3]],1.2,0);s.push(circle(crx,cy-1,2));
  var rx=cx-RR(R,30,40),ry=fy-RR(R,110,118);s.push([[sx-8,fy],[sx-8,fy-10],[rx+6,ry+26],[rx,ry]]);s.push(ellipse(rx,ry,20,4.5));s.push(circle(rx,ry-1,2));sol.push(EP(rx,ry,21,6),cym);
  var pd=[[cx-6,fy],[cx-4,fy-8],[cx+4,fy-8],[cx+6,fy]];s.push(poly(pd));s.push([[cx,fy-8],[cx,bc+br-2]]);
  var th=[cx+RR(R,4,12),fy-RR(R,30,34)];
  var ru=[[cx-120,fy+14],[cx+120,fy+14],[cx+100,fy-6],[cx-100,fy-6]];
  floorS(s,R,fy,RI(R,12,16));
  return skyFill(s,fy,RR(R,7,8),RR(R,5.5,6.5),5,sol);}});

SUBJ.push({name:'Mandolin on sheet music',titles:['Eight Strings','Tremolo','Folk Tune at Dusk','Teardrop and Frets','Waltz in G'],build(R){
  var s=[],sol=[],ty=RR(R,108,116),a=RR(R,-0.5,-0.3),cx=RR(R,110,130),cy=ty+RR(R,40,46);
  wallTable(s,R,ty,sol);
  var pap=[];for(var p=0;p<2;p++){var px=RR(R,150,200)+p*30,py=ty+RR(R,14,30),P=rot([[px,py],[px+64,py],[px+64,py+44],[px,py+44]],px+32,py+22,RR(R,-0.25,0.25));pap.push(P);}
  var body=blob([[-40,0],[-34,-22],[-10,-28],[16,-22],[30,-10],[32,0],[30,10],[16,22],[-10,28],[-34,22]],6);
  var neck=[[30,-5],[96,-4],[96,4],[30,5]],head=[[96,-7],[124,-9],[128,0],[124,9],[96,7]];
  var Bt=function(P){return rot(M(P,cx,cy,1),cx,cy,a);};
  var B=Bt(body),N=Bt(neck),Hd=Bt(head);
  pap.forEach(function(P){var st=[];for(var l=0;l<3;l++)for(var m=0;m<5;m++){var f=(l*12+6+m*1.8)/44;st.push([lerp(P[0],P[3],f),lerp(P[1],P[2],f)]);}st.push(P);behind(s,[poly(P)].concat(st),[B,N,Hd]);});
  s.push(poly(B));s.push(poly(N));s.push(poly(Hd));sol.push(B,N,Hd);
  var sh=Bt(EP(-8,0,8,6));s.push(poly(sh));s.push(poly(Bt(EP(-8,0,10.5,8))));H(s,sh,1.1,0);
  var pg=Bt([[4,-10],[18,-14],[24,-4],[8,2]]);s.push(poly(pg));H(s,pg,1.2,40);
  s.push(Bt([[-30,-4],[-30,4]]));s.push(poly(Bt([[-38,-6],[-30,-6],[-30,6],[-38,6]])));H(s,Bt([[-38,-6],[-30,-6],[-30,6],[-38,6]]),1,0);
  for(var st2=-3;st2<=3;st2+=2)s.push(Bt([[-34,st2*0.9],[98,st2*0.9]]));
  for(var f=0;f<10;f++){var fx=32+64*(1-Math.pow(0.88,f+1))/(1-Math.pow(0.88,10));s.push(Bt([[fx,-4.5],[fx,4.5]]));}
  for(var t=0;t<4;t++){var tx=102+t*6;s.push(Bt([[tx,-8],[tx,-13]]));s.push(Bt([[tx,8],[tx,13]]));s.push(poly(Bt([[tx-2,-13],[tx+2,-13],[tx+2,-16],[tx-2,-16]])));s.push(poly(Bt([[tx-2,13],[tx+2,13],[tx+2,16],[tx-2,16]])));}
  var hs=Bt(blob([[-34,22],[-10,28],[16,22],[30,10],[20,8],[0,18],[-24,16]],4));H(s,hs,1.4,RR(R,30,60));
  var shd=Bt(blob([[-34,26],[-8,34],[20,26],[34,12],[20,30],[-10,38],[-38,28]],4));H(s,shd,1.6,0);
  var cnd=RR(R,226,260),cb=ty+RR(R,30,40);s.push([[cnd-8,cb],[cnd-8,cb-40],[cnd+8,cb-40],[cnd+8,cb]]);s.push(ellipse(cnd,cb,14,3.5));s.push([[cnd,cb-40],[cnd,cb-45]]);var fl=lens([cnd,cb-45],[cnd,cb-58],3.5);s.push(fl);sol.push([[cnd-8,cb],[cnd-8,cb-40],[cnd+8,cb-40],[cnd+8,cb]]);
  H(s,[[cnd+3,cb-40],[cnd+8,cb-40],[cnd+8,cb],[cnd+3,cb]],1.2,90);
  return sky(s,R,ty,sol.concat([fl]));}});

SUBJ.push({name:'Wood plane and shavings',titles:['Long Curls of Pine','Truing the Edge','Workshop Saturday','Sharp Iron, Slow Pass','Smell of Sawdust'],build(R){
  var s=[],sol=[],bt=RR(R,112,118),bf=bt+RR(R,22,26),px=RR(R,96,128);
  var top=[[4,bf],[30,bt],[270,bt],[296,bf]];s.push(top);s.push([[4,bf],[296,bf]]);s.push([[4,bf+16],[296,bf+16]]);H(s,[[4,bf],[296,bf],[296,bf+16],[4,bf+16]],RR(R,1.6,2),0);
  for(var dh=40;dh<270;dh+=RR(R,40,50))s.push(rect(dh,bf+5,dh+5,bf+11));
  var by=bt+RR(R,8,12),b0=RR(R,30,50),b1=RR(R,240,270);var bd=[[b0,by+6],[b0+8,by],[b1,by],[b1-8,by+6]];s.push(poly(bd));s.push([[b0,by+6],[b0,by+12],[b1-8,by+12],[b1-8,by+6]]);
  H(s,[[b0,by+6],[b1-8,by+6],[b1-8,by+12],[b0,by+12]],1.6,0);for(var g=0;g<3;g++){s.push(wave(b0+12,b1-12,by+1.5+g*1.5,0.6,RR(R,30,50),R()*6));}
  var pl=RR(R,90,100),pb=by-1,ph=16,Pb=[[px,pb],[px,pb-ph],[px+pl,pb-ph],[px+pl,pb]];SOL(s,sol,Pb);H(s,[[px,pb-5],[px+pl,pb-5],[px+pl,pb],[px,pb]],1.2,0);
  var tote=[[px+pl-30,pb-ph],[px+pl-34,pb-ph-26],[px+pl-26,pb-ph-36],[px+pl-14,pb-ph-36],[px+pl-10,pb-ph-28],[px+pl-16,pb-ph-24],[px+pl-20,pb-ph-30],[px+pl-26,pb-ph-28],[px+pl-20,pb-ph]];SOL(s,sol,tote);H(s,tote,1.6,60);
  var kn=[[px+10,pb-ph],[px+8,pb-ph-6]].concat(arc(px+16,pb-ph-10,9,7,PI,TAU)).concat([[px+24,pb-ph-6],[px+22,pb-ph]]);SOL(s,sol,kn);H(s,kn,1.6,60);
  var lc=[[px+36,pb-ph],[px+46,pb-ph-22],[px+62,pb-ph-16],[px+56,pb-ph]];SOL(s,sol,lc);s.push(circle(px+50,pb-ph-12,2.6));H(s,[[px+46,pb-ph-22],[px+62,pb-ph-16],[px+58,pb-ph-8],[px+50,pb-ph-16]],1,30);
  s.push(circle(px+pl-38,pb-ph-6,3.5));
  var curls=[];var cx0=px-6;for(var c=0;c<RI(R,3,4);c++){var cx=cx0-c*RR(R,16,22),cy=pb-RR(R,8,16)-c*2;var sp=spiral(cx,cy,RR(R,9,12),2,RR(R,1.6,2.2),R()*TAU);s.push([[px,pb-2]].concat(quad([px,pb-2],[cx+6,pb-4],sp[0],6)).concat(sp));}
  for(var c2=0;c2<RI(R,4,6);c2++){var sx=RR(R,170,290),sy=RR(R,bt+4,bf-4);if(sx<px+pl+10)continue;s.push(spiral(sx,sy,RR(R,5,8),1,RR(R,1.3,1.8),R()*TAU));}
  var wy=RR(R,26,34);s.push([[60,wy],[240,wy]]);s.push([[60,wy+3],[240,wy+3]]);
  var sq=[[80,wy+3],[80,wy+50],[86,wy+50],[86,wy+9],[110,wy+9],[110,wy+3]];s.push(sq);H(s,[[80,wy+3],[86,wy+3],[86,wy+50],[80,wy+50]],1.2,90);
  var ml=[[150,wy+3],[150,wy+40]];s.push(ml);var mh=[[140,wy+40],[160,wy+40],[160,wy+54],[140,wy+54]];s.push(poly(mh));H(s,mh,1.6,0);
  var ch=[[200,wy+3],[200,wy+10]];s.push(ch);s.push([[200,wy+10],[200,wy+52]]);s.push(lens([200,wy+52],[200,wy+68],3));sol.push([[136,wy],[164,wy],[164,wy+56],[136,wy+56]],[[78,wy],[112,wy],[112,wy+52],[78,wy+52]]);
  return sky(s,R,bt,sol);}});

SUBJ.push({name:'Pincushion and spools',titles:['Mending Basket','Pins and Needles','Thread for Tuesday','Hemline Evening','Grandmother\'s Table'],build(R){
  var s=[],sol=[],ty=RR(R,96,104);wallTable(s,R,ty,sol);
  var py=ty+RR(R,52,58),pxx=RR(R,74,100),pr=RR(R,24,28);var PC=EP(pxx,py,pr,pr*0.82);SOL(s,sol,PC);for(var k=1;k<6;k++){var f=-1+k/3;s.push(arc(pxx+f*pr*0.6,py,pr*Math.abs(f)*0.4+2,pr*0.8,-PI/2,PI/2).map(function(p,i){return [p[0],p[1]];}));}
  H(s,arc(pxx,py,pr,pr*0.82,-0.3,PI*0.6).concat([[pxx,py]]),1.6,30);var cap=[[pxx-6,py-pr*0.82],[pxx,py-pr*0.82-6],[pxx+6,py-pr*0.82]];s.push(cap);
  for(var p=0;p<7;p++){var an=-PI*0.9+p*PI*0.8/6+RR(R,-0.1,0.1),e0=[pxx+pr*0.9*Math.cos(an),py+pr*0.75*Math.sin(an)],e1=[pxx+(pr+12)*Math.cos(an),py+(pr*0.82+12)*Math.sin(an)];s.push([e0,e1]);s.push(circle(e1[0],e1[1],1.8));}
  s.push([[pxx+pr*0.7,py+pr*0.5],[pxx+pr*0.9,py+pr*0.9],[pxx+pr*0.95,py+pr+10]]);var sb=lens([pxx+pr*0.95,py+pr+10],[pxx+pr*0.95,py+pr+22],5);s.push(sb);H(s,sb,1.2,0);
  var sp=[[RR(R,140,150),ty+RR(R,48,52),12,26],[RR(R,170,180),ty+RR(R,58,62),10,22],[RR(R,198,208),ty+RR(R,44,48),11,24]];
  sp.forEach(function(q){var x=q[0],b=q[1],r=q[2],h=q[3];s.push(ellipse(x,b-h,r+3,3));s.push([[x-r-3,b-h],[x-r-3,b-h+3]]);s.push([[x+r+3,b-h],[x+r+3,b-h+3]]);var th=[[x-r,b-h+3],[x+r,b-h+3],[x+r,b-3],[x-r,b-3]];s.push(poly(th));H(s,th,RR(R,1.1,1.4),RR(R,-8,8));
    s.push([[x-r-3,b-3],[x-r-3,b]].concat(arc(x,b,r+3,3,PI,0)).concat([[x+r+3,b-3]]));s.push([[x-r-3,b-3],[x+r+3,b-3]]);sol.push([[x-r-3,b],[x-r-3,b-h-3],[x+r+3,b-h-3],[x+r+3,b]]);});
  var tl=sp[1];s.push(curve([[tl[0]+tl[2],tl[1]-10],[tl[0]+30,tl[1]+10],[tl[0]+60,tl[1]+4],[tl[0]+90,tl[1]+18],[RR(R,276,290),tl[1]+10]],8));var nd=[RR(R,250,270),tl[1]+20];s.push([[nd[0]-24,nd[1]+6],[nd[0]+10,nd[1]-4]]);s.push(ellipse(nd[0]+7,nd[1]-3,2,1));
  var sx=RR(R,236,256),sy=ty+RR(R,28,34);var h1=EP(sx-10,sy,6,4.5),h2=EP(sx-8,sy+10,6,4.5);s.push(poly(h1));s.push(poly(h2));s.push(lens([sx-4,sy+2],[sx+36,sy-6],2.5));s.push(lens([sx-3,sy+8],[sx+36,sy+12],2.5));s.push(circle(sx-1,sy+5,1.2));
  var tx=RR(R,30,46),tb=ty+RR(R,76,84);cyl(s,tx,tb,7,12,1,1);
  return sky(s,R,ty,sol);}});

SUBJ.push({name:'Kitchen scale with apples',titles:['Weighed and Measured','Two Pounds of Apples','Harvest Kitchen','Needle at Twelve','Baking Day'],build(R){
  var s=[],sol=[],ty=RR(R,150,156),cx=RR(R,136,160),dr=RR(R,30,34),dc=ty-RR(R,44,48);wallTable(s,R,ty,sol);
  var base=[[cx-46,ty],[cx-40,ty-14],[cx+40,ty-14],[cx+46,ty]];SOL(s,sol,base);H(s,[[cx+20,ty-14],[cx+40,ty-14],[cx+46,ty],[cx+24,ty]],1.4,90);
  var bod=[[cx-34,ty-14]].concat(arc(cx,dc,dr+8,dr+8,PI*0.85,TAU+PI*0.15)).concat([[cx+34,ty-14]]);SOL(s,sol,bod);s.push(circle(cx,dc,dr));s.push(circle(cx,dc,dr-3));
  for(var k=0;k<30;k++){var a=-PI*1.25+k*PI*1.5/29,L=k%5===0?7:3.5;s.push([[cx+(dr-3)*Math.cos(a),dc+(dr-3)*Math.sin(a)],[cx+(dr-3-L)*Math.cos(a),dc+(dr-3-L)*Math.sin(a)]]);}
  var na=-PI*1.25+RR(R,0.3,1.2)*PI;s.push([[cx-6*Math.cos(na),dc-6*Math.sin(na)],[cx+(dr-8)*Math.cos(na),dc+(dr-8)*Math.sin(na)]]);s.push(circle(cx,dc,2.5));
  var ny=dc-dr-10;s.push([[cx-4,ny],[cx-4,dc-dr-6]]);s.push([[cx+4,ny],[cx+4,dc-dr-6]]);var pan=[[cx-46,ny-6],[cx+46,ny-6]].concat(arc(cx,ny-6,46,10,0,PI).reverse());s.push(pan);s.push(ellipse(cx,ny-6,46,5));H(s,arc(cx,ny-6,46,10,0.1,PI-0.1).concat([[cx-40,ny-2],[cx+40,ny-2]].reverse()),1.6,0);
  sol.push([[cx-46,ny-6],[cx+46,ny-6],[cx+46,ny+4],[cx-46,ny+4]]);
  var ap=[[cx-22,ny-18,13],[cx+4,ny-20,14],[cx+26,ny-16,12],[cx-8,ny-38,13]];ap.forEach(function(q,i){var A0=blob([[q[0]-q[2],q[1]],[q[0]-q[2]*0.6,q[1]-q[2]*0.9],[q[0],q[1]-q[2]*0.75],[q[0]+q[2]*0.6,q[1]-q[2]*0.9],[q[0]+q[2],q[1]],[q[0]+q[2]*0.6,q[1]+q[2]*0.9],[q[0]-q[2]*0.6,q[1]+q[2]*0.9]],5);SOL(s,sol,A0);
    H(s,arc(q[0],q[1],q[2],q[2]*0.9,-0.4,PI*0.6).concat([[q[0]+2,q[1]+2]]),1.4,40);s.push([[q[0],q[1]-q[2]*0.75],[q[0]+2,q[1]-q[2]*0.75-6]]);if(i%2)s.push(lens([q[0]+2,q[1]-q[2]*0.75-5],[q[0]+12,q[1]-q[2]*0.75-9],3));});
  var fx=cx+RR(R,70,86),fb=ty;var sack=[[fx-18,fb],[fx-22,fb-30],[fx-14,fb-44],[fx-18,fb-50],[fx+18,fb-50],[fx+14,fb-44],[fx+22,fb-30],[fx+18,fb]];SOL(s,sol,sack);s.push([[fx-14,fb-44],[fx+14,fb-44]]);H(s,[[fx+6,fb-44],[fx+14,fb-44],[fx+22,fb-30],[fx+18,fb],[fx+8,fb]],1.6,80);
  s.push(rect(fx-10,fb-30,fx+10,fb-18));s.push([[fx-6,fb-24],[fx+6,fb-24]]);
  var rp=[cx-RR(R,80,96),ty+RR(R,10,16)];s.push(rect(rp[0]-26,rp[1]-4,rp[0]+26,rp[1]+4));s.push(rect(rp[0]-36,rp[1]-1.5,rp[0]-26,rp[1]+1.5));s.push(rect(rp[0]+26,rp[1]-1.5,rp[0]+36,rp[1]+1.5));H(s,[[rp[0]-26,rp[1]],[rp[0]+26,rp[1]],[rp[0]+26,rp[1]+4],[rp[0]-26,rp[1]+4]],1.2,0);
  return sky(s,R,ty,sol);}});

SUBJ.push({name:'Croissants in a basket',titles:['Butter and Layers','Breakfast for Four','Still Warm','Paris, Any Morning','Crescent Moons'],build(R){
  var s=[],sol=[],ty=RR(R,108,116),cx=RR(R,130,160),cy=ty+RR(R,40,46),rx=RR(R,62,70),ry=RR(R,14,16),bh=RR(R,30,34);wallTable(s,R,ty,sol);
  var bk=arc(cx,cy,rx,ry,PI,0,true);var body=[[cx-rx,cy]].concat(quad([cx-rx,cy],[cx-rx+6,cy+bh],[cx,cy+bh],10)).concat(quad([cx,cy+bh],[cx+rx-6,cy+bh],[cx+rx,cy],10));s.push(body);var BD=body.concat(arc(cx,cy,rx,ry,0,-PI).slice(1));sol.push(BD);
  var wv=[];clipIn(s,[brickS(cx-rx,cy+2,cx+rx,cy+bh,8,5)],body.concat([[cx+rx,cy+0.5],[cx-rx,cy+0.5]]));s.push(ellipse(cx,cy,rx,ry));s.push(ellipse(cx,cy,rx-4,ry-3));
  var nap=[[cx-rx+4,cy+2],[cx-rx-8,cy+bh+6],[cx-rx+16,cy+bh+12],[cx-rx+26,cy+4]];s.push(poly(nap));sol.push(nap);for(var k=1;k<4;k++)s.push([lerp(nap[0],nap[3],k/4),lerp(nap[1],nap[2],k/4)]);
  function croissant(x,y,sz,an){var parts=[[-1,0.45],[-0.55,0.75],[0,1],[0.55,0.75],[1,0.45]],out=[];
    parts.forEach(function(p,i){var px=x+p[0]*22*sz,py=y-Math.abs(p[0])*-6*sz,w=10*sz*p[1];var L=rot(EP(px,py+Math.abs(p[0])*8*sz,w,w*0.8),x,y,an);out.push(L);});
    var sil=rot(blob([[-28,8],[-20,-2],[-8,-8],[8,-8],[20,-2],[28,8],[14,6],[0,8],[-14,6]].map(function(p){return [x+p[0]*sz,y+p[1]*sz];}),4),x,y,an);
    return {parts:out,sil:sil};}
  var cr=[croissant(cx-24,cy-8,RR(R,1,1.1),RR(R,-0.25,-0.1)),croissant(cx+22,cy-10,RR(R,1,1.1),RR(R,0.1,0.25)),croissant(cx,cy-24,RR(R,0.95,1.05),RR(R,-0.1,0.1))];
  var placed=[];for(var i=cr.length-1;i>=0;i--){var c=cr[i],st=c.parts.map(function(P){return poly(P);});c.parts.forEach(function(P,j){if(j%2===0)A(st,hatch(P.slice(Math.floor(P.length/2)),1.4,30));});behind(s,st,placed);placed.push(c.sil);sol.push(c.sil);}
  var jx=cx+rx+RR(R,22,30),jb=ty+RR(R,48,54);cyl(s,jx,jb,12,24,1.6,1);var cl=scallop(jx,jb-24,15,4,10,0.2);s.push(cl);s.push([[jx-14,jb-20],[jx+14,jb-20]]);sol.push([[jx-12,jb],[jx-12,jb-26],[jx+12,jb-26],[jx+12,jb]]);
  var kx=cx-rx-RR(R,26,34);s.push(lens([kx,jb],[kx+40,jb+6],2.5));s.push(lens([kx-18,jb-3],[kx,jb],2));
  return sky(s,R,ty,sol);}});

SUBJ.push({name:'Bowl of ramen',titles:['Steam and Broth','Late Night Noodles','One More Slurp','Counter Seat','Chopsticks Lifted'],build(R){
  var s=[],sol=[],ty=RR(R,148,154),cx=RR(R,136,160),rx=RR(R,66,72),ry=13,rim=ty-RR(R,52,56);wallTable(s,R,ty,sol);
  var body=[[cx-rx,rim]].concat(quad([cx-rx,rim],[cx-rx+6,ty-6],[cx-18,ty-6],10)).concat([[cx-18,ty],[cx+18,ty],[cx+18,ty-6]]).concat(quad([cx+18,ty-6],[cx+rx-6,ty-6],[cx+rx,rim],10));
  s.push(body);s.push(ellipse(cx,rim,rx,ry));var BS=body.concat(arc(cx,rim,rx,ry,0,-PI).slice(1));sol.push(BS);
  var band=[];for(var x=cx-rx+8;x<cx+rx-8;x+=8){var yb=rim+14+((x-cx)*(x-cx))/(rx*rx)*-6;band.push([x,yb],[x+4,yb+5]);}s.push(band);
  clipIn(s,hatch(body.concat([[cx+rx,rim]]),2,-70).slice(0),[[cx+rx*0.3,rim],[cx+rx,rim],[cx+18,ty],[cx+rx*0.2,ty]]);
  var su=EP(cx,rim+2,rx-6,ry-4);s.push(poly(su));
  var eg=[cx-RR(R,30,36),rim];s.push(ellipse(eg[0],eg[1],11,6));s.push(ellipse(eg[0]+1,eg[1],5,3));H(s,EP(eg[0]+1,eg[1],5,3),1,0);
  var nr=[[cx+20,rim+4],[cx+22,rim-26],[cx+44,rim-28],[cx+42,rim+2]];s.push(poly(nr));H(s,nr,1.2,90);
  var nk=[cx-6,rim+2];s.push(ellipse(nk[0],nk[1],8,4.5));s.push(spiral(nk[0],nk[1],0.5,5,1.6));
  for(var c=0;c<5;c++){var px=cx+RR(R,-44,40),py=rim+RR(R,-4,6);if(Math.abs(px-eg[0])<14)continue;s.push(ellipse(px,py,2.2,1.4));}
  for(var w=0;w<3;w++)s.push(wave(cx-30,cx+14,rim+4+w*2.2-6,1.2,8,w));
  var ch0=[cx+rx+30,rim-90],ch1=[cx-6,rim-12];s.push([[ch0[0],ch0[1]],ch1]);s.push([[ch0[0]+6,ch0[1]+2],[ch1[0]+6,ch1[1]+2]]);var lift=[];for(var n=0;n<4;n++){var nx=ch1[0]+2+n*2,pts=[];for(var y=ch1[1];y<rim+2;y+=2)pts.push([nx+1.5*Math.sin(y/3+n),y]);lift.push(pts);}A(s,lift);
  for(var st=0;st<3;st++){var sx=cx-40+st*24,pts2=[];for(var y2=rim-6;y2>rim-60-st*6;y2-=3)pts2.push([sx+6*Math.sin((rim-y2)/10+st),y2]);s.push(pts2);}
  var sp=[cx-rx-RR(R,24,30),ty+RR(R,12,16)];var sh=EP(sp[0],sp[1],12,6);s.push(poly(sh));s.push([[sp[0]+12,sp[1]-1],[sp[0]+34,sp[1]-8]]);H(s,sh,1.4,0);
  return sky(s,R,ty,sol);}});

SUBJ.push({name:'Pears and grapes',titles:['Still Life, Autumn','Bosc and Concord','Fruit on Blue Plate','After the Market','Late Harvest'],build(R){
  var s=[],sol=[],ty=RR(R,118,126),cx=RR(R,140,160),py=ty+RR(R,40,46);wallTable(s,R,ty,sol);
  s.push(ellipse(cx,py,90,16));s.push(ellipse(cx,py,74,11));sol.push(EP(cx,py,90,16));
  var dr=[];for(var k=0;k<7;k++){var x=RR(R,8,292),c=[];for(var y=6;y<ty;y+=6)c.push([x+6*Math.sin(y/20+k),y]);dr.push(c);}
  function pear(x,b,sz,lean){var P=rot(blob([[0,0],[16,-6],[18,-22],[10,-34],[7,-50],[0,-56],[-7,-50],[-10,-34],[-18,-22],[-16,-6]].map(function(p){return [x+p[0]*sz,b+p[1]*sz];}),6),x,b,lean);return P;}
  var p1=pear(cx-30,py+2,RR(R,1.15,1.3),RR(R,-0.2,0)),p2=pear(cx+4,py+4,RR(R,1.05,1.2),RR(R,0.05,0.25));
  var gx=cx+RR(R,46,56),gyy=py-6,gr=[];for(var r=0;r<5;r++)for(var c=0;c<5-r;c++){var x2=gx-(4-r)*5+c*10+RR(R,-1,1),y2=gyy-r*8;gr.push([x2,y2]);}
  var grapes=[];gr.reverse().forEach(function(g){var G=EP(g[0],g[1],5.5,5.5);var st=[poly(G)];A(st,hatch(arc(g[0],g[1],5.5,5.5,-0.3,PI*0.7).concat([[g[0],g[1]]]),1.2,40));behind(s,st,grapes);grapes.push(G);});sol.push.apply(sol,grapes);
  s.push([[gx,gyy-38],[gx+2,gyy-46],[gx+8,gyy-50]]);s.push(lens([gx+2,gyy-44],[gx-14,gyy-52],5));
  [p2,p1].forEach(function(P,i){var st=[poly(P)];var c=P[Math.floor(P.length*0.5)];A(st,hatch(P.slice(Math.floor(P.length*0.05),Math.floor(P.length*0.45)),RR(R,1.4,1.7),RR(R,50,70)));behind(s,st,i?[p2].concat(grapes):grapes);sol.push(P);
    var tp=P[Math.floor(P.length*0.5)];s.push([tp,[tp[0]+3,tp[1]-10]]);if(i)s.push(lens([tp[0]+2,tp[1]-6],[tp[0]+16,tp[1]-12],4));});
  return sky(s,R,ty,sol);}});

SUBJ.push({name:'Teddy bear',titles:['Loved Threadbare','Button Eyes','Nursery Shelf','Patient Friend','One Ear Mended'],build(R){
  var s=[],sol=[],cx=RR(R,136,160),sy=RR(R,150,156),hr=RR(R,25,28),hy=sy-RR(R,92,98);
  var by=sy-RR(R,38,42),body=blob([[cx-30,by+30],[cx-34,by],[cx-22,by-30],[cx,by-36],[cx+22,by-30],[cx+34,by],[cx+30,by+30],[cx,by+36]],6);
  var legs=[[-1],[1]].map(function(e){return EP(cx+e[0]*24,sy-6,16,11);}),arms=[-1,1].map(function(e){return rot(EP(cx+e*34,by-6,10,22),cx+e*34,by-6,e*-0.5);});
  var head=EP(cx,hy,hr,hr*0.92),ears=[-1,1].map(function(e){return EP(cx+e*hr*0.75,hy-hr*0.75,9,9);});
  var order=[body].concat(arms).concat(legs).concat(ears).concat([head]);
  var drawn=[];
  [ears[0],ears[1],body,arms[0],arms[1],legs[0],legs[1],head].reverse().forEach(function(P){var st=[poly(P)];behind(s,st,drawn);drawn.push(P);});sol.push.apply(sol,drawn);
  ears.forEach(function(E,i){var c=[cx+(i?1:-1)*hr*0.75,hy-hr*0.75];var inr=EP(c[0],c[1],5,5);behind(s,[poly(inr)].concat(hatch(inr,1.2,0)),[head]);});
  legs.forEach(function(L,i){var c=[cx+(i?1:-1)*24,sy-6];var pd=EP(c[0]+(i?6:-6),c[1],7,8);s.push(poly(pd));H(s,pd,1.3,90);});
  var mz=EP(cx,hy+9,11,8);s.push(poly(mz));var ns=[[cx-5,hy+4],[cx+5,hy+4],[cx,hy+9]];s.push(poly(ns));H(s,ns,0.8,0);s.push([[cx,hy+9],[cx,hy+12]]);s.push(arc(cx-3,hy+12,3,2,0,PI));s.push(arc(cx+3,hy+12,3,2,0,PI));
  [-1,1].forEach(function(e){s.push(circle(cx+e*10,hy-5,2.6));H(s,EP(cx+e*10,hy-5,1.6,1.6),0.7,0);});
  var bw=[[cx,hy+hr*0.92],[cx-14,hy+hr*0.92-7],[cx-14,hy+hr*0.92+7],[cx,hy+hr*0.92],[cx+14,hy+hr*0.92-7],[cx+14,hy+hr*0.92+7],[cx,hy+hr*0.92]];s.push(bw);H(s,[[cx,hy+hr*0.92],[cx-14,hy+hr*0.92-7],[cx-14,hy+hr*0.92+7]],1,90);
  var sm=[];for(var y=by-20;y<by+30;y+=5)sm.push([[cx-1,y],[cx+1,y+3]]);A(s,sm);
  H(s,body.slice(0,Math.floor(body.length*0.35)).concat([[cx-10,by+30]]),RR(R,2.2,2.6),RR(R,60,75));H(s,arc(cx,hy,hr,hr*0.92,PI*0.6,PI*1.1).concat([[cx-hr*0.4,hy]]),2.2,70);
  var bx0=cx-RR(R,90,110),bx1=cx+RR(R,90,110);var ch=[[bx0,196],[bx0,sy],[bx1,sy],[bx1,196]];s.push(ch);s.push([[bx0-4,sy],[bx1+4,sy],[bx1+4,sy+5],[bx0-4,sy+5],[bx0-4,sy]]);H(s,[[bx0,sy+5],[bx1,sy+5],[bx1,196],[bx0,196]],RR(R,3.4,4),90);sol.push(ch);
  var bk=cx+RR(R,58,70);[[0,0],[1,0],[0.5,1]].forEach(function(b){var x=bk+b[0]*22,y=sy-b[1]*20;box3(s,x,y-18,18,18,6,1.4,1);s.push(circle(x+9,y-9,4));});
  s.push([[4,sy],[bx0-4,sy]]);s.push([[bx1+4,sy],[296,sy]]);H(s,[[4,sy],[bx0,sy],[bx0,196],[4,196]],RR(R,3,3.6),0);H(s,[[bx1,sy],[296,sy],[296,196],[bx1,196]],RR(R,3,3.6),0);
  return sky(s,R,sy,sol.concat([[[bk,sy],[bk,sy-44],[bk+50,sy-44],[bk+50,sy]]]));}});

SUBJ.push({name:'Marionette on a little stage',titles:['Strings Attached','The Wooden Dancer','Curtain Up','Who Pulls the Strings','Matinee for Six'],build(R){
  var s=[],sol=[],fy=RR(R,166,172),cx=RR(R,138,162),pw=RR(R,108,116),pt=RR(R,24,30);
  var PR=[[cx-pw,fy],[cx-pw,pt],[cx+pw,pt],[cx+pw,fy]];s.push(PR);s.push(rect(cx-pw-8,pt-8,cx+pw+8,pt));H(s,[[cx-pw-8,pt-8],[cx+pw+8,pt-8],[cx+pw+8,pt],[cx-pw-8,pt]],1.6,0);s.push(scallopRows(cx-pw,cx+pw,pt+6,pt+6,12,5));
  [-1,1].forEach(function(e){var x0=cx+e*pw,x1=cx+e*(pw-RR(R,30,36)),tie=fy-RR(R,60,70);var C=[[x0,pt+2],[x1,pt+2]].concat(quad([x1,pt+2],[x1+e*-4,tie-20],[x0-e*(pw*0.12),tie],10)).concat([[x0-e*6,fy],[x0,fy]]);s.push(C);
    for(var k=1;k<5;k++){var f=k/5,xa=x0+(x1-x0)*f,xb=x0-e*(pw*0.12)*f;s.push(curve([[xa,pt+2],[xa+e*2,(pt+tie)/2],[xb,tie],[x0-e*6*f,fy]],6));}s.push([[x0-e*(pw*0.12)-3,tie-2],[x0-e*(pw*0.12)+3,tie+3]]);sol.push(C);});
  var sb=fy-RR(R,8,10);s.push([[cx-pw,sb],[cx+pw,sb]]);H(s,[[cx-pw,sb],[cx+pw,sb],[cx+pw,fy],[cx-pw,fy]],1.6,0);
  var mx=cx+RR(R,-14,14),hy=RR(R,68,76),lean=RR(R,-0.1,0.1);
  var cby=pt+RR(R,12,16);s.push([[mx-24,cby],[mx+24,cby]]);s.push([[mx,cby-8],[mx,cby+8]]);s.push([[mx-14,cby+6],[mx+14,cby+6]]);
  var hd=EP(mx,hy,9,10);SOL(s,sol,hd);var hat=[[mx-9,hy-6],[mx,hy-24],[mx+9,hy-6]];s.push(hat);H(s,hat,1.2,0);s.push(circle(mx,hy-25,2));s.push(circle(mx-3,hy-1,1.2));s.push(circle(mx+3,hy-1,1.2));s.push([[mx,hy],[mx+2,hy+3]]);s.push(arc(mx,hy+4,3,2,0,PI));
  var nk=hy+10,tb=nk+30;var TO=[[mx-10,nk+2],[mx+10,nk+2],[mx+12,tb],[mx-12,tb]];SOL(s,sol,TO);H(s,TO,RR(R,1.6,2),RR(R,30,60));[nk+10,nk+18].forEach(function(y){s.push(circle(mx,y,1.5));});s.push([[mx-12,tb],[mx+12,tb],[mx+12,tb+6],[mx-12,tb+6],[mx-12,tb]]);
  var arm=function(e){var sh=[mx+e*11,nk+4],el=[mx+e*RR(R,20,26),nk+RR(R,12,20)],hn=[mx+e*RR(R,26,34),nk-RR(R,0,10)];s.push(lens(sh,el,2.5));s.push(lens(el,hn,2.2));s.push(circle(hn[0],hn[1],3));s.push([[hn[0],hn[1]-3],[mx+e*(e<0?24:24),cby+6]]);};arm(-1);arm(1);
  [-1,1].forEach(function(e){var hp=[mx+e*7,tb+6],kn=[mx+e*RR(R,10,16),tb+RR(R,18,22)],ft=[mx+e*RR(R,10,14),sb-1];s.push(lens(hp,kn,3));s.push(lens(kn,ft,2.6));s.push([[ft[0]-e*2,ft[1]],[ft[0]+e*8,ft[1]],[ft[0]+e*8,ft[1]-4],[ft[0],ft[1]-4]]);s.push([kn,[mx+e*14,cby+6]]);});
  s.push([[mx,hy-26],[mx,cby+8]]);
  var bg=[];for(var y=pt+16;y<sb;y+=RR(R,9,11))bg.push([[cx-pw,y],[cx+pw,y]]);
  for(var st=0;st<RI(R,5,7);st++){var sx=RR(R,cx-pw+30,cx+pw-30),sy=RR(R,pt+20,pt+60);if(Math.abs(sx-mx)<40)continue;bg.push([[sx-4,sy],[sx+4,sy]]);bg.push([[sx,sy-4],[sx,sy+4]]);}
  behind(s,bg,sol.concat([[[mx-40,cby-10],[mx+40,cby-10],[mx+40,sb],[mx-40,sb]]]));
  s.push([[4,fy],[296,fy]]);H(s,[[4,fy],[296,fy],[296,196],[4,196]],RR(R,3,3.6),0);
  return sky(s,R,fy,[PR]);}});

SUBJ.push({name:'Spiral staircase',titles:['Up to the Lantern Room','Iron Helix','Climbing in Circles','Library Stair','Forty Steps'],build(R){
  var s=[],sol=[],fy=RR(R,182,186),cx=RR(R,136,164),r=RR(R,46,52),rise=RR(R,7.2,7.8),n=RI(R,20,22),da=TAU/RI(R,13,14),ph=R()*TAU,dir=R()<0.5?1:-1;
  s.push([[cx-3,fy],[cx-3,4]]);s.push([[cx+3,4],[cx+3,fy]]);H(s,[[cx,fy],[cx,4],[cx+3,4],[cx+3,fy]],1,90);
  var P=function(a,rr,y){return [cx+rr*Math.sin(a),y+rr*Math.cos(a)*0.22];};
  var rail=[],tops=[];for(var i=0;i<n;i++){var a=ph+dir*i*da,y=fy-8-i*rise,a1=a+dir*da;var o0=P(a,r,y),o1=P(a1,r,y),i0=P(a,3,y),i1=P(a1,3,y);var front=Math.cos(a+dir*da/2)>-0.2;
    var tr=[i0,o0,o1,i1];if(front){s.push(tr);s.push([o0,[o0[0],o0[1]+rise]]);s.push([o1,[o1[0],o1[1]+rise*0.6]]);H(s,[o0,[o0[0],o0[1]+rise],[o1[0],o1[1]+rise],o1],1.4,90);}else{s.push([o0,o1]);}
    s.push([o0,[o0[0],o0[1]-30]]);tops.push([o0[0],o0[1]-30]);}
  s.push(curve(tops,4));s.push(curve(tops.map(function(p){return [p[0],p[1]+3];}),4));
  var wl=cx-r-RR(R,36,44),wr=cx+r+RR(R,36,44);var win=archP(wr+RR(R,10,20),RR(R,110,118),16,46);s.push(win);s.push([[wr+RR(R,10,20),48],[wr+RR(R,10,20),118]]);
  floorS(s,R,fy,RI(R,10,12));
  var wall=[];for(var y=6;y<fy;y+=RR(R,4.5,5.5))wall.push([[4,y],[296,y]]);
  var hole=[[cx-r-4,fy],[cx-r-4,tops[tops.length-1][1]-6],[cx+r+4,tops[tops.length-1][1]-6],[cx+r+4,fy]];behind(s,wall,[hole,win.concat([win[0]])]);
  return s;}});

SUBJ.push({name:'Film projector',titles:['Saturday Matinee','Flicker and Whirr','Home Movies','Reel to Reel','Beam Through the Dark'],build(R){
  var s=[],sol=[],ty=RR(R,138,144),px=RR(R,196,214),bw=RR(R,46,52),bh=RR(R,30,34);
  var tb=[[px-60,ty],[px+70,ty],[px+70,ty+6],[px-60,ty+6]];SOL(s,sol,tb);[px-52,px+62].forEach(function(x){s.push([[x,ty+6],[x-4,196]]);s.push([[x+4,ty+6],[x,196]]);});s.push([[px-48,ty+30],[px+58,ty+30]]);
  var B=[[px-bw/2,ty],[px-bw/2,ty-bh],[px+bw/2,ty-bh],[px+bw/2,ty]];SOL(s,sol,B);s.push(rect(px-bw/2+5,ty-bh+5,px+bw/2-5,ty-5));H(s,[[px+bw/2-12,ty-bh+5],[px+bw/2-5,ty-bh+5],[px+bw/2-5,ty-5],[px+bw/2-12,ty-5]],1.2,90);
  for(var v=0;v<4;v++)s.push([[px-10+v*5,ty-bh+8],[px-10+v*5,ty-bh+16]]);
  [[px-14,ty-bh-34,22,-1],[px+18,ty-bh-30,20,1]].forEach(function(q){var x=q[0],y=q[1],r=q[2];s.push([[x,y],[px+q[3]*4,ty-bh]]);s.push([[x+3,y],[px+q[3]*4+4,ty-bh]]);s.push(circle(x,y,r));s.push(circle(x,y,r-2.5));s.push(circle(x,y,3));
    for(var k=0;k<3;k++){var a=R()+k*TAU/3;var ho=EP(x+r*0.55*Math.cos(a),y+r*0.55*Math.sin(a),4,4);s.push(poly(ho));H(s,ho,1,0);}sol.push(EP(x,y,r+0.5,r+0.5));});
  s.push([[px-14-22,ty-bh-34],[px-bw/2,ty-bh+6]]);s.push([[px+18+20,ty-bh-30],[px+bw/2,ty-bh+6]]);
  var lx=px-bw/2,ly=ty-bh/2;var L=[[lx,ly-6],[lx-16,ly-6],[lx-16,ly+6],[lx,ly+6]];SOL(s,sol,L);s.push(ellipse(lx-16,ly,2.5,6));H(s,[[lx-14,ly+2],[lx,ly+2],[lx,ly+6],[lx-14,ly+6]],1,0);
  var b0=[lx-18,ly-5],b1=[lx-18,ly+5],e0=[4,ly-RR(R,56,70)],e1=[4,ly+RR(R,40,50)];s.push([b0,e0]);s.push([b1,e1]);
  var beam=[b0,e0,e1,b1];var dust=[];for(var d=0;d<RI(R,8,12);d++){var t=R(),u=R();var p=lerp(lerp(b0,e0,t),lerp(b1,e1,t),u);dust.push([[p[0]-1,p[1]],[p[0]+1,p[1]]]);}A(s,dust);
  var bh2=hatch(beam,RR(R,4.2,5),0);A(s,bh2);
  var cbl=curve([[px+bw/2,ty-6],[px+bw/2+14,ty+2],[px+60,ty-4],[px+64,ty]],6);s.push(cbl);
  var cans=[[px-40,ty,14,6],[px-40,ty-6,14,6]];cans.forEach(function(c){s.push(ellipse(c[0],c[1]-c[3],c[2],3));s.push([[c[0]-c[2],c[1]-c[3]],[c[0]-c[2],c[1]]].concat(arc(c[0],c[1],c[2],3,PI,0)).concat([[c[0]+c[2],c[1]-c[3]]]));});
  return sky(s,R,ty,sol.concat([beam]));}});

SUBJ.push({name:'Jukebox',titles:['Play Number Seven','Bubbles and Chrome','Quarter for a Song','Last Dance, Diner','Glowing Arch'],build(R){
  var s=[],sol=[],fy=RR(R,182,186),cx=RR(R,136,164),w=RR(R,46,50),hb=RR(R,96,104),top=fy-hb;
  var J=[[cx-w,fy],[cx-w,top]].concat(arc(cx,top,w,w*0.8,PI,TAU)).concat([[cx+w,fy]]);SOL(s,sol,J);
  for(var k=1;k<=2;k++){var ww=w-k*6;s.push([[cx-ww,fy-6],[cx-ww,top]].concat(arc(cx,top,ww,ww*0.8,PI,TAU)).concat([[cx+ww,fy-6]]));}
  for(var b=0;b<9;b++){var a=PI+(b+0.5)*PI/9,rr=w-9;s.push(circle(cx+rr*Math.cos(a),top+rr*0.8*Math.sin(a),1.6));}
  for(var y=top+6;y<fy-10;y+=14){s.push(circle(cx-w+9,y,1.6));s.push(circle(cx+w-9,y,1.6));}
  var gw=w-14,dm=[[cx-gw,top+10]].concat(arc(cx,top+10,gw,gw*0.6,PI,TAU)).concat([[cx+gw,top+10]]);s.push(poly(dm));
  s.push(ellipse(cx,top+4,gw*0.7,6));s.push(ellipse(cx,top+4,6,2));s.push([[cx+gw*0.5,top-8],[cx+gw*0.2,top+2]]);
  var ss=top+14;for(var c=0;c<2;c++){var x0=cx-gw+3+c*(gw+1),x1=x0+gw-4;s.push(rect(x0,ss,x1,ss+30));for(var l=1;l<6;l++)s.push([[x0,ss+l*5],[x1,ss+l*5]]);}
  var bt=ss+36;s.push(comb(cx-gw,cx+gw,bt+6,5,5));s.push([[cx-gw,bt+6],[cx+gw,bt+6]]);
  var gr=[[cx-gw,bt+12],[cx+gw,bt+12],[cx+gw,fy-12],[cx-gw,fy-12]];s.push(poly(gr));H(s,gr,RR(R,2.4,3),90);var oval=EP(cx,(bt+12+fy-12)/2,gw*0.6,(fy-bt-24)*0.32);s.push(poly(oval));
  s.push(rect(cx+gw-10,bt+2,cx+gw-4,bt+5));H(s,[[cx+w-6,top],[cx+w,top],[cx+w,fy],[cx+w-6,fy]],1.2,90);H(s,[[cx-w,top],[cx-w+6,top],[cx-w+6,fy],[cx-w,fy]],1.2,90);
  var st=[cx+w+RR(R,40,60),fy];if(st[0]>272)st[0]=cx-w-RR(R,40,60);s.push([[st[0]-2,fy],[st[0]-2,fy-38],[st[0]+2,fy-38],[st[0]+2,fy]]);var seat=EP(st[0],fy-40,15,4);s.push(poly(seat));s.push(arc(st[0],fy-40,15,7,PI,TAU));H(s,arc(st[0],fy-40,15,7,PI,TAU),1.2,0);s.push(ellipse(st[0],fy-1,12,3));sol.push([[st[0]-15,fy],[st[0]-15,fy-48],[st[0]+15,fy-48],[st[0]+15,fy]]);
  floorS(s,R,fy,RI(R,12,16));var wy=RR(R,110,116);s.push([[4,wy],[cx-w,wy]]);s.push([[cx+w,wy],[296,wy]]);
  var wc=[];for(var x=8;x<296;x+=RR(R,10,12))wc.push([[x,wy],[x,fy]]);behind(s,wc,sol);
  return sky(s,R,wy,sol);}});

SUBJ.push({name:'Reel lawn mower',titles:['Saturday Stripes','Whirr of Blades','Fresh Cut','Back and Forth','First Mow of May'],build(R){
  var s=[],sol=[],gy=RR(R,166,172),x0=RR(R,70,86),x1=x0+RR(R,104,114),wr=RR(R,20,23),wc=gy-wr;
  var cyl0=[[x0+6,wc-12],[x1-6,wc-12],[x1-6,wc+12],[x0+6,wc+12]];s.push(poly(cyl0));
  for(var b=0;b<5;b++){var pts=[];for(var x=x0+6;x<=x1-6;x+=3){var t=(x-x0-6)/(x1-x0-12);pts.push([x,wc-12+((b/5+t*0.6)%1)*24]);}var segs=[[]];pts.forEach(function(p,i){if(i&&p[1]<pts[i-1][1]-6)segs.push([]);segs[segs.length-1].push(p);});segs.forEach(function(sg){if(sg.length>1)s.push(sg);});}
  s.push([[x0+6,wc+14],[x1-6,wc+14]]);s.push([[x0+6,wc+16],[x1-6,wc+16]]);
  [x0,x1].forEach(function(x){wheel(s,x,wc,wr,8,1.6);sol.push(EP(x,wc,wr+1,wr+1));});
  var hx=x0+RR(R,140,150),hy=RR(R,40,48);s.push([[x0,wc],[hx-12,hy+6]]);s.push([[x1,wc],[hx+6,hy+14]]);s.push([[x0+40,wc-10],[hx-6,hy+10]]);s.push([[x1-40,wc-10],[hx,hy+12]]);
  var tg=[[hx-22,hy-6],[hx+16,hy+18]];s.push(lens(tg[0],tg[1],4));H(s,lens(tg[0],tg[1],4),1,30);s.push([[hx-12,hy+6],[hx+6,hy+14]]);
  var rl=[[x0+16,gy-6],[x1-16,gy-6]];s.push(rl);s.push(ellipse(x0+16,gy-6,3,3));s.push(ellipse(x1-16,gy-6,3,3));
  var tall=[[4,gy]];for(var x2=4;x2<x0-wr-2;x2+=3)tall.push([x2+1.5,gy-RR(R,10,16)],[x2+3,gy]);s.push(tall);
  var clip=[];for(var c=0;c<RI(R,8,12);c++){var cx=RR(R,x0-20,x0+10),cy=RR(R,wc-40,wc-10);clip.push([[cx,cy],[cx+3,cy-2]]);}A(s,clip);
  s.push([[4,gy],[296,gy]]);for(var bnd=0;bnd<4;bnd++){var y0=gy+bnd*7,P=[[4,y0],[296,y0],[296,y0+7],[4,y0+7]];H(s,P,RR(R,2.6,3.2),bnd%2?60:-60);}
  var fy2=gy-RR(R,44,52);s.push([[4,fy2],[296,fy2]]);s.push([[4,fy2+8],[296,fy2+8]]);var fence=[];for(var fx=8;fx<296;fx+=RR(R,9,11))fence.push([[fx,gy],[fx,fy2-6],[fx+3,fy2-9],[fx+6,fy2-6],[fx+6,gy]]);behind(s,fence,sol.concat([[[x0-wr,gy],[x0-wr,wc-14],[x1+wr,wc-14],[x1+wr,gy]],[[hx-24,hy-10],[hx+18,hy-10],[x1,gy],[x0,gy]]]));
  for(var f=0;f<RI(R,4,6);f++){var tx=RR(R,10,290);if(tx>x0-wr-10&&tx<hx+20)continue;s.push([[tx,gy],[tx+2,fy2-20]]);s.push(scallop(tx+2,fy2-24,5,5,6,0.25));}
  return sky(s,R,fy2-10,sol.concat([[[4,gy],[4,fy2-9],[296,fy2-9],[296,gy]]]));}});

SUBJ.push({name:'Hermit crab on the sand',titles:['Borrowed House','Moving Day','Tide Pool Tenant','Shell Shopping','Sideways Morning'],build(R){
  var s=[],sol=[],sh=RR(R,94,102),cx=RR(R,150,172),cy=RR(R,128,136),sc=RR(R,1.25,1.4);
  var shell=M(blob([[-6,24],[-30,18],[-40,0],[-34,-20],[-14,-32],[10,-32],[30,-20],[38,0],[30,18],[12,26]],6),cx,cy,sc);SOL(s,sol,shell);
  var sp=spiral(cx+2*sc,cy-4*sc,2,26*sc,2.6,R()*TAU);s.push(sp);H(s,M(blob([[-6,24],[-30,18],[-42,4],[-30,8],[-10,12],[10,14],[30,20]],4),cx,cy,sc),1.4,RR(R,20,40));
  H(s,M(arc(0,0,30,26,-0.2,1.4).concat([[0,0]]),cx+2*sc,cy-4*sc,sc),1.6,-30);
  var ap=[cx-34*sc,cy+14*sc];var crab=[];
  var cl=M(blob([[0,0],[-14,-6],[-28,-4],[-34,4],[-28,12],[-12,12]],4),ap[0],ap[1],sc);s.push(poly(cl));H(s,cl,1.2,30);s.push(M([[-28,4],[-16,4]],ap[0],ap[1],sc));
  var cl2=M(blob([[0,6],[-10,4],[-18,10],[-10,14]],3),ap[0],ap[1]+4,sc);s.push(poly(cl2));
  for(var l=0;l<3;l++){var b=M([[0,8+l*4]],ap[0],ap[1],sc)[0],k=[b[0]-RR(R,10,16)-l*4,b[1]+RR(R,6,10)],f=[k[0]-6,cy+30*sc];s.push(lens(b,k,1.8));s.push(lens(k,f,1.5));}
  var es=M([[-6,-4]],ap[0],ap[1],sc)[0];s.push([[es[0],es[1]],[es[0]-6,es[1]-18]]);s.push([[es[0]+3,es[1]],[es[0]+2,es[1]-20]]);s.push(circle(es[0]-6,es[1]-20,2));s.push(circle(es[0]+2,es[1]-22,2));
  s.push([[es[0]-4,es[1]-14],[es[0]-22,es[1]-34]]);s.push([[es[0],es[1]-16],[es[0]-12,es[1]-40]]);
  var sd=cy+30*sc;s.push([[4,sh],[296,sh]]);var fo=[[4,sh+8]];for(var x=4;x<296;x+=8)A(fo,arc(x+4,sh+8,4,2.5,PI,0));s.push(fo);
  var sea=waterS(R,4,296,sh+3,sh+6,3,1);s.push(sea);
  var rp=[];for(var y=sh+18;y<196;y+=RR(R,7,9))rp.push(wave(4,296,y,1.6,RR(R,24,36),R()*6));behind(s,rp,[shell,cl,cl2,M([[-40,0],[-40,40],[40,40],[40,0]],ap[0],ap[1],sc)]);
  for(var p=0;p<RI(R,3,5);p++){var px=RR(R,12,288),py=RR(R,sh+24,190);if(Math.abs(px-cx)<80)continue;var pb=EP(px,py,RR(R,6,10),RR(R,3,5));s.push(poly(pb));H(s,pb,1.4,0);}
  var sw=[RR(R,20,60),RR(R,sh+30,sh+50)];s.push(curve([[sw[0],sw[1]],[sw[0]+14,sw[1]-8],[sw[0]+30,sw[1]+4],[sw[0]+50,sw[1]-4]],6));for(var q=0;q<4;q++){var bp=[sw[0]+8+q*11,sw[1]-2];s.push(lens(bp,[bp[0]+6,bp[1]-8],2.5));}
  var sea2=[];for(var y2=sh-6;y2>sh-50;y2-=RR(R,5,6))sea2.push(wave(4,296,y2,1,RR(R,14,20),R()*6));A(s,sea2);
  return sky(s,R,sh-50,sol);}});

var MASTER={name:'Railway viaduct in the mountains',titles:['The High Crossing','Over the Gorge at Noon','Eleven Arches','Mountain Express','Steam Above the River'],build(R){
  var s=[],sol=[],dy=RR(R,86,92),x0=4,x1=296,na=RI(R,6,7),side=R()<0.5?1:-1;
  // gorge floor profile (V-shaped valley under the viaduct)
  var gx=RR(R,130,170),floor=function(x){var t=Math.abs(x-gx)/150;return Math.min(196,dy+40+(1-Math.min(1,t*1.1))*76);};
  // ---- viaduct ----
  var span=(x1-x0)/na,piers=[],deck=[[x0,dy],[x1,dy]],parT=dy-7;
  var vsil=[[x0,dy-7],[x1,dy-7]];
  for(var i=0;i<=na;i++){var px=x0+i*span;piers.push(px);}
  var front=[],arches=[];
  for(var i2=0;i2<na;i2++){var a0=piers[i2]+5,a1=piers[i2+1]-5,cx=(a0+a1)/2,ar=(a1-a0)/2,spring=dy+12+ar,bot=Math.max(floor(a0),floor(a1));
    var op=[[a0,bot],[a0,spring]].concat(arc(cx,spring,ar,ar,PI,TAU)).concat([[a1,bot]]);arches.push(op);
    // voussoirs
    var vz=[];for(var k=0;k<=9;k++){var an=PI+k*PI/9;vz.push([cx+ar*Math.cos(an),spring+ar*Math.sin(an)],[cx+(ar+5)*Math.cos(an),spring+(ar+5)*Math.sin(an)],[cx+ar*Math.cos(an+PI/18),spring+ar*Math.sin(an+PI/18)]);}vz.pop();front.push(vz);
    front.push(arc(cx,spring,ar+5,ar+5,PI,TAU));}
  // viaduct body outline: deck top to valley floor
  var body=[[x0,dy]];for(var x=x0;x<=x1;x+=4)body.push([x,floor(x)]);body.push([x1,dy]);
  var bodyP=[[x0,dy-1],[x1,dy-1]].concat(body.slice(1).reverse().slice(1));
  // stone courses on the piers (clipped to the body minus the arch openings)
  var courses=[];for(var y=dy+6;y<196;y+=RR(R,6,7))courses.push([[x0,y],[x1,y]]);
  var stone=[];
  var holes=arches.map(function(op){return op.slice(1,-1).concat([[op[op.length-1][0],op[0][1]]]);});
  // shade one side of each pier
  var shade=[];piers.forEach(function(px){var sx=px+side*5;shade.push([[sx,dy+4],[sx+side*-0,dy+4],[sx,196]]);});
  // ---- train on the deck ----
  var tr=[],tdir=side,ty=dy-7,lx=RR(R,90,200);
  var loco=[];var L0=lx,L1=lx+tdir*46;var lb=Math.min(L0,L1),lr=Math.max(L0,L1);
  var boiler=[[lb,ty-3],[lb,ty-17],[lr,ty-17],[lr,ty-3]];loco.push(poly(boiler));
  var cabx=tdir>0?lb:lr-16;var cab=[[cabx,ty-3],[cabx,ty-28],[cabx+16,ty-28],[cabx+16,ty-3]];loco.push(poly(cab));loco.push(rect(cabx+4,ty-24,cabx+12,ty-17));loco.push(rect(cabx-2,ty-31,cabx+18,ty-28));
  var chx=tdir>0?lr-8:lb+8;var ch=[[chx-3,ty-17],[chx-3,ty-28],[chx-5,ty-31],[chx+5,ty-31],[chx+3,ty-28],[chx+3,ty-17]];loco.push(ch);
  var dome=arc((lb+lr)/2,ty-17,4,4,PI,TAU);loco.push(dome);
  A(loco,hatch([[lb,ty-9],[lr,ty-9],[lr,ty-3],[lb,ty-3]],1.4,0));
  for(var w=0;w<3;w++){var wx=lb+8+w*13;loco.push(circle(wx,ty-3,4.5));}
  var cw=34,cars=[];var cxs=tdir>0?lb-4:lr+4;
  for(var c=0;c<RI(R,3,4);c++){var c1=cxs-tdir*c*(cw+3),c0=c1-tdir*cw;var cl=Math.min(c0,c1),cr=Math.max(c0,c1);if(cl<6||cr>294)break;
    var cb=[[cl,ty-3],[cl,ty-20],[cr,ty-20],[cr,ty-3]];cars.push(poly(cb));cars.push(arc((cl+cr)/2,ty-20,cw/2,3,PI,TAU));
    for(var wi=cl+4;wi+5<cr-2;wi+=7)cars.push(rect(wi,ty-16,wi+5,ty-10));cars.push(circle(cl+6,ty-2,2.6));cars.push(circle(cr-6,ty-2,2.6));cars.push([[cr,ty-8],[cr+tdir*3,ty-8]]);}
  // smoke trailing back
  var smx=chx-tdir*10,smoke=[];for(var p=0;p<4;p++){var sx2=smx-tdir*p*RR(R,16,22),sy2=ty-38-p*RR(R,3,6);smoke.push(scallop(sx2,sy2,RR(R,9,13)+p*2,RR(R,6,8)+p,7,0.25));}
  var trainSil=[[Math.min(lb,cxs-tdir*4*(cw+3))-2,ty],[Math.min(lb,cxs-tdir*4*(cw+3))-2,ty-22],[Math.max(lr,cxs+tdir*0)+2,ty-22],[Math.max(lr,cxs)+2,ty]];
  var tsil=[[lb,ty],[lb,ty-28],[lr,ty-28],[lr,ty]];
  // ---- mountains behind ----
  var peaks=[],mpts=[[4,dy-RR(R,20,30)]],mx=4;while(mx<296){mx+=RR(R,26,44);var top=RR(R,14,40);mpts.push([Math.min(296,mx),top]);mx+=RR(R,18,30);mpts.push([Math.min(296,mx),RR(R,48,70)]);}
  mpts=mpts.filter(function(p){return p[0]<=296;});var mbase=dy-RR(R,4,8);var ridge=mpts.concat([[296,mpts[mpts.length-1][1]]]);
  var mtn=[ridge];var mfill=[];
  for(var q=1;q<mpts.length-1;q++){var pk=mpts[q];if(pk[1]>45)continue;var l=mpts[q-1],r=mpts[q+1];
    var sh=side>0?[pk,r,[pk[0]+(r[0]-pk[0])*0.3,mbase],[pk[0],mbase]]:[pk,l,[pk[0]-(pk[0]-l[0])*0.3,mbase],[pk[0],mbase]];A(mtn,hatch(sh,RR(R,1.8,2.3),side*65));
    var sn=[lerp(pk,l,0.32),pk,lerp(pk,r,0.32)];mtn.push([sn[0],[lerp(sn[0],sn[2],0.25)[0],sn[0][1]+4],[lerp(sn[0],sn[2],0.5)[0],sn[0][1]-1],[lerp(sn[0],sn[2],0.75)[0],sn[2][1]+4],sn[2]]);}
  var mPoly=ridge.concat([[296,dy],[4,dy]]);
  // mid-ground slopes either side of the gorge
  var slopeL=[[4,dy+20],[40,dy+30],[gx-60,floor(gx-60)-20],[gx-30,floor(gx-30)]],slopeR=[[296,dy+16],[256,dy+28],[gx+60,floor(gx+60)-22],[gx+30,floor(gx+30)]];
  // river at the bottom
  var rv=[];var ry0=floor(gx)-4;for(var y3=ry0;y3<196;y3+=4){var hw=12+(y3-ry0)*1.8;rv.push(wave(gx-hw,gx+hw,y3,1,10,y3));}
  // ---- assemble back to front ----
  var viaSil=[[x0,dy-8],[x1,dy-8]].concat(body.slice(1).reverse());
  var viaHoles=holes;
  // background: mountains are hidden by viaduct (except through arches), train and smoke
  var fg=[viaSil.concat()].concat(smoke).concat([tsil,trainSil]);
  // arch openings are windows: show mountains/slopes through them, so clip bg by viaduct minus holes
  var bgStrokes=mtn.concat([slopeL,slopeR]).concat(hatch(slopeL.concat([[gx-30,196],[4,196]]),RR(R,4.4,5),-20)).concat(hatch(slopeR.concat([[gx+30,196],[296,196]]),RR(R,4.4,5),20)).concat(rv);
  var bgCut=[];behind(bgCut,bgStrokes,smoke.concat([tsil,trainSil]));
  // keep bg where it's outside the viaduct, or inside an arch opening
  bgCut.forEach(function(st){var d=[st[0]];for(var ii=1;ii<st.length;ii++){var a=d[d.length-1],b=st[ii],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1]));for(var kk=1;kk<=n;kk++)d.push(lerp(a,b,kk/n));}
    var run=[];d.forEach(function(pp){var inV=pip(pp,viaSil),inH=false;for(var h=0;h<viaHoles.length&&!inH;h++)if(pip(pp,viaHoles[h]))inH=true;var vis=!inV||inH;if(!vis){if(run.length>1)s.push(run);run=[];}else run.push(pp);});if(run.length>1)s.push(run);});
  // viaduct itself
  s.push([[x0,dy],[x1,dy]]);s.push([[x0,dy-7],[x1,dy-7]]);s.push([[x0,dy-3],[x1,dy-3]]);
  behind(s,[comb(x0,x1,dy-3,4,6)],[tsil,trainSil]);
  arches.forEach(function(op){s.push(op);});
  var fr2=[];front.forEach(function(st){fr2.push(st);});behind(s,fr2,[]);
  var stoneAll=[];clipIn(stoneAll,courses.concat(stone),viaSil.map(function(p){return [p[0],Math.max(p[1],dy+1)];}),viaHoles.map(function(hh){return hh.map(function(p){return p;});}));
  A(s,stoneAll);
  piers.forEach(function(px){var sx=px+side*3.5,P=[[sx,dy+3],[sx+side*1.5,dy+3],[sx+side*1.5,floor(sx)],[sx,floor(sx)]];});
  arches.forEach(function(op){var inner=op.slice(1,-1);var a0=op[0][0],a1=op[op.length-1][0],spring=op[1][1];var shP=side>0?[[a1-4,op[0][1]],[a1-4,spring],[a1,spring],[a1,op[0][1]]]:[[a0,op[0][1]],[a0,spring],[a0+4,spring],[a0+4,op[0][1]]];H(s,shP,1.3,90);
    H(s,arc((a0+a1)/2,spring,(a1-a0)/2,(a1-a0)/2,PI+(side>0?PI*0.55:0),PI+(side>0?PI:PI*0.45)).concat([[(a0+a1)/2+side*((a1-a0)/2-4),spring]]),1.3,side*60);});
  // train and smoke on top
  A(s,cars);A(s,loco);smoke.forEach(function(sm,ii){s.push(sm);if(ii<2)H(s,sm,RR(R,2.6,3.2),RR(R,20,40));});s.push([[chx,ty-31],lerp([chx,ty-31],[smx,ty-36],0.6)]);
  // pines on the near slopes, in front of the viaduct base
  var pz=[];for(var t=0;t<RI(R,2,4);t++){var tx=t%2?RR(R,10,30):RR(R,270,290),tb=Math.min(194,floor(tx)+RR(R,6,26));if(tb>194)continue;pineT(s,tx,tb,RR(R,0.8,1.2),RR(R,2,2.6));}
  sol.push(mPoly,viaSil,tsil,trainSil);sol.push.apply(sol,smoke);
  return skyFill(s,dy,RR(R,7,8),RR(R,4.8,5.6),5,sol);}};

return {number:4,startedOn:"2026-11-14",notes:"Batch 4 (Nov 14). Review of batch 3: structures and still lifes carried the day - tall ship, rooftops and chimneys, medieval gatehouse, preserve jars, pipe organ, cello, canal lock, torii gate; the town-square Super Sketch read well but ran only ~570s natural in its 20-minute slot, so it crawled. Weak: bison and walrus were shapeless blobs, squirrel, stag beetle and motorcycle-with-sidecar muddled, lavender field and nautilus too sparse. Lessons kept: one line, keep extras touching; clip backgrounds with behind()/clipIn(); finish with skyFill and pass solids; strokes under ~250 and planner under 2s (many small closed shapes and dense lattices slow it); full-width lines block skyFill's flood. Animals: a careful 12-20 point silhouette plus separate head/legs, and dark animals read better fully hatched; avoid pointed-tail shells (they read as fish). New: bascule bridges, staircases and tabletop scenes on a plain wall work well; never pass gap 0 to hatch. Daily Super Sketch: Railway viaduct in the mountains (aim 650s+).",master:MASTER,subjects:SUBJ};
})();
