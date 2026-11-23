// Endless Etch — batch 14. 48 subjects for 2026-11-24 (each plays about three times, shuffled per round) plus the Daily Super Sketch.
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
// ---- batch 5 additions ----
function S(n,t,f){SUBJ.push({name:n,titles:t,build:f});}
function gnd(b,R,gy,g,a){b.push([[4,gy],[296,gy]]);return H(b,[[4,gy],[296,gy],[296,196],[4,196]],g||RR(R,3.4,4.4),a==null?RR(R,10,26)*sgn(R):a);}
function fin(s,R,bg,sol,yl){if(bg.length)behind(s,bg,sol);return sky(s,R,yl,sol);}
function win(s,x,y,w,h,g){s.push(rect(x,y,x+w,y+h));s.push([[x+w/2,y],[x+w/2,y+h]]);s.push([[x,y+h/2],[x+w,y+h/2]]);if(g)H(s,[[x,y],[x+w,y],[x+w,y+h/2],[x,y+h/2]],g,45);return s;}
function RP(x0,y0,x1,y1){return [[x0,y0],[x1,y0],[x1,y1],[x0,y1]];}
function cypress(s,sol,x,b,h,w,g,a){var P=blob([[x,b-h],[x+w*0.6,b-h*0.7],[x+w,b-h*0.3],[x+w*0.4,b-2],[x-w*0.4,b-2],[x-w,b-h*0.3],[x-w*0.6,b-h*0.7]],6);SOL(s,sol,P);H(s,P,g||2,a||60);s.push([[x,b-2],[x,b]]);return P;}
function wall(s,R,x0,x1,y,h,sw){var p=[[x0,y],[x0,y-h]],x=x0;while(x<x1){var w=RR(R,sw*0.7,sw*1.3),nx=Math.min(x1,x+w);p.push([x,y-h-RR(R,0,2)],[nx,y-h-RR(R,0,2)]);x=nx;}p.push([x1,y-h],[x1,y]);s.push(p);
  var rows=Math.max(1,Math.round(h/5)),q=[],d=1;for(var r=1;r<rows;r++){var yy=y-h*r/rows;q.push(d>0?[x0,yy]:[x1,yy]);var xs=[];for(var xx=x0+RR(R,3,sw);xx<x1-2;xx+=RR(R,sw*0.6,sw*1.2))xs.push(xx);if(d<0)xs.reverse();xs.forEach(function(xx){q.push([xx,yy],[xx,yy+h/rows],[xx,yy]);});q.push(d>0?[x1,yy]:[x0,yy]);d=-d;}if(q.length)s.push(q);return p;}


// ---- batch 6 additions ----
// one-stroke vertical zigzag across [x0,x1] between y0 and y1
function zz(x0,x1,y0,y1,step){var p=[],d=1;for(var x=x0;x<=x1+0.01;x+=step){if(d>0)p.push([x,y0],[x,y1]);else p.push([x,y1],[x,y0]);d=-d;}return p;}
// a row of rounded rocks along base b, hatched
function rocks(s,sol,R,x0,x1,b,h,n){var w=(x1-x0)/n;for(var i=0;i<n;i++){var cx=x0+w*(i+0.5)+RR(R,-w*0.15,w*0.15),rw=w*RR(R,0.5,0.7),rh=h*RR(R,0.6,1);
  var P=blob([[cx-rw,b],[cx-rw*0.85,b-rh*0.55],[cx-rw*0.25,b-rh],[cx+rw*0.45,b-rh*0.85],[cx+rw,b-rh*0.3],[cx+rw*0.9,b]],5);SOL(s,sol,P);H(s,P,RR(R,1.8,2.6),RR(R,30,70));}return s;}
// clip a serpentine of water rows into polygon P
function waterIn(s,R,P,y0,y1,gap,holes){clipIn(s,[waterS(R,4,296,y0,y1,gap||RR(R,4.5,5.5),1.1)],P,holes||[]);return s;}
// tall grass tufts along a line (one stroke)
function tufts(x0,x1,y,h,R){var p=[[x0,y]];for(var x=x0;x<x1;x+=RR(R,5,9)){var hh=h*RR(R,0.5,1);p.push([x+1,y-hh],[x+2,y],[x+3.5,y-hh*0.8],[x+4.5,y]);}p.push([x1,y]);return p;}
// mountain range silhouette with snow line; returns polygon
function peaks(s,R,y,hmax,n,g){var pts=[[4,y]],x=4;for(var i=0;i<n;i++){var w=292/n,px=x+w*RR(R,0.35,0.65),ph=y-hmax*RR(R,0.55,1);pts.push([px,ph]);x+=w;pts.push([x,y-hmax*RR(R,0.1,0.35)]);}pts[pts.length-1]=[296,y-hmax*RR(R,0.1,0.3)];pts.push([296,y]);
  s.push(pts.slice(0,-1));for(var j=1;j<pts.length-2;j+=2){var a=pts[j],l=pts[j-1],r=pts[j+1];H(s,[a,[a[0]+(r[0]-a[0])*0.8,a[1]+(r[1]-a[1])*0.8],[a[0]+(r[0]-a[0])*0.3,y]],g||2.4,75);
    s.push([[a[0]+(l[0]-a[0])*0.3,a[1]+(l[1]-a[1])*0.3],[a[0]-2,a[1]+(l[1]-a[1])*0.4],[a[0]+2,a[1]+(r[1]-a[1])*0.25],[a[0]+(r[0]-a[0])*0.3,a[1]+(r[1]-a[1])*0.3]]);}
  return pts;}
// tube: polygon around a spine with half-width wf(t), t = 0..1 along the spine
function tube(sp,wf){var L=[],Rr=[],n=sp.length;for(var i=0;i<n;i++){var a=sp[Math.max(0,i-1)],b=sp[Math.min(n-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,w=wf(i/(n-1));
  L.push([sp[i][0]-dy/l*w,sp[i][1]+dx/l*w]);Rr.push([sp[i][0]+dy/l*w,sp[i][1]-dx/l*w]);}return {P:L.concat(Rr.reverse()),L:L,R:Rr};}
// spiky ball in one stroke: zigzag between radius r and r+sp
function spiky(cx,cy,r,sp,n,R){var p=[];for(var i=0;i<=n*2;i++){var a=i/(n*2)*TAU,rr=i%2?r+sp*(0.7+0.5*R()):r;p.push([cx+rr*Math.cos(a),cy+rr*Math.sin(a)]);}return p;}
function sand(s,R,y,g){var p=[],d=1;for(var yy=y;yy<196;yy+=g||RR(R,5,7)){var w=wave(4,296,yy,1.2,RR(R,16,28),R()*6);if(d<0)w.reverse();A(p,w);d=-d;}s.push(p);return s;}
function wallK(R){return pick(R,['stripes','tiles','diag']);}

// ---- batch 7 additions ----
function FS(s,sol,P,g,a){SOL(s,sol,P);if(g)H(s,P,g,a||0);return P;}
// one-stroke vertical zigzag following cylinder boards: x = cx - w cos(theta)
function boardsC(cx,w,y0,y1,n){var p=[],d=1;for(var i=1;i<n;i++){var x=cx-w*Math.cos(i*PI/n);if(d>0)p.push([x,y0],[x,y1]);else p.push([x,y1],[x,y0]);d=-d;}return p;}
// leaf-ish star polygon
function leafStar(cx,cy,r,a){var p=[];for(var i=0;i<10;i++){var rr=i%2?r*0.45:r,an=a+i*PI/5;p.push([cx+rr*Math.cos(an),cy+rr*Math.sin(an)]);}return p;}
// a hanging cone of blossoms as one zigzag stroke from (x,y) down length L
function raceme(x,y,L,w0,R){var p=[[x,y]],n=Math.round(L/2.6);for(var i=1;i<=n;i++){var t=i/n,w=w0*(1-t*0.85)*(0.8+0.4*R());p.push([x+(i%2?w:-w),y+L*t]);}p.push([x,y+L]);return p;}
// prayer flags: line from a to b sagging, small flags hanging along it (one stroke)
function flagLine(a,b,sag,n,sz){var c=[(a[0]+b[0])/2,(a[1]+b[1])/2+sag],L=quad(a,c,b,n*4),p=[L[0]];for(var i=1;i<L.length;i++){var q=L[i];if(i%4===2){p.push(q,[q[0],q[1]+sz],[q[0]+sz*0.9,q[1]+sz],[q[0]+sz*0.9,q[1]+0.3],q);}else p.push(q);}return p;}

function legT(s,sol,pts,w0,w1){var t=tube(curve(pts,6),function(u){return w0+(w1-w0)*u;});SOL(s,sol,t.P);s.push(poly(t.P));return t.P;}
function road(s,R,y){s.push([[4,y],[296,y]]);var d=1,p=[];for(var yy=y+5;yy<196;yy+=RR(R,5,7)){if(d>0)p.push([4,yy],[296,yy]);else p.push([296,yy],[4,yy]);d=-d;}s.push([[4,y],[4,y+5]].concat(p));var dash=[];for(var x=10;x<290;x+=24)dash.push([[x,y+12],[x+12,y+12]]);return s;}
// interior: perspective floor plus a wall pattern, both kept behind the solids
function room(s,R,fy,sol,kk){var f=[];floorS(f,R,fy,RI(R,14,18));behind(s,f,sol);var w=[],k=kk||wallK(R),W=RP(4,4,296,fy-8);
  if(k==='stripes')H(w,W,RR(R,6.5,8),90);else if(k==='tiles'){var g=RR(R,12,15);H(w,W,g,0);H(w,W,g,90);}else{var g2=RR(R,10,12),an=RR(R,35,55);H(w,W,g2,an);H(w,W,g2,-an);}
  behind(s,w,sol);behind(s,[[[4,fy-8],[296,fy-8]],[[4,fy-3],[296,fy-3]]],sol);return s;}
function onTable(s,R,ty,sol){var t=[];tableS(t,R,ty,pick(R,['stripes','tiles','diag']));behind(s,t,sol);return s;}
function turned(cx,y0,y1,w){var p=[],n=4,h=(y1-y0)/n;for(var i=0;i<n;i++){var a=y0+i*h;p.push([cx-w,a],[cx-w*0.6,a+h*0.5],[cx-w,a+h]);}var q=[];for(var j=n-1;j>=0;j--){var b=y0+j*h;q.push([cx+w,b+h],[cx+w*0.6,b+h*0.5],[cx+w,b]);}return p.concat(q);}

function onion(cx,b,w,h){var L=cubic([cx-w*0.62,b],[cx-w*1.3,b-h*0.32],[cx-w*0.25,b-h*0.62],[cx,b-h],16),Rr=cubic([cx,b-h],[cx+w*0.25,b-h*0.62],[cx+w*1.3,b-h*0.32],[cx+w*0.62,b],16);return L.concat(Rr.slice(1));}
function crossT(s,x,y,h){s.push([[x,y],[x,y-h]]);s.push([[x-h*0.3,y-h*0.7],[x+h*0.3,y-h*0.7]]);s.push([[x-h*0.22,y-h*0.35],[x+h*0.22,y-h*0.45]]);return s;}
function tyre(s,sol,cx,cy,r,g){var P=EP(cx,cy,r,r);SOL(s,sol,P);s.push(circle(cx,cy,r*0.62));HX(s,[P,EP(cx,cy,r*0.62,r*0.62)],g||1.4,30);s.push(circle(cx,cy,r*0.2));return s;}
function glassE(s,cx,cy,rx,ry){s.push(poly(EP(cx,cy,rx,ry)));return s;}
function bumps(x0,x1,y,h,step){var p=[[x0,y]];for(var x=x0;x+step<=x1+0.01;x+=step)A(p,arc(x+step/2,y,step/2,h,PI,TAU).slice(1));return p;}
function serp(rowsArr){var out=[];rowsArr.forEach(function(r,i){A(out,i%2?r.slice().reverse():r);});return out;}

var MASTER=null;

// ---- batch 9 additions ----
// leaf: lens outline with a midrib (and optional shading on one half)
function leafL(s,sol,p0,p1,w,g){var L=lens(p0,p1,w);SOL(s,sol,L);s.push([p0,p1]);if(g){var m=[(p0[0]+p1[0])/2,(p0[1]+p1[1])/2],dx=p1[0]-p0[0],dy=p1[1]-p0[1],l=Math.hypot(dx,dy),nx=-dy/l*w,ny=dx/l*w;
  H(s,quad(p0,[m[0]+nx,m[1]+ny],p1,10).concat([m]),g,Math.atan2(dy,dx)*180/PI+60);}return L;}
// spiked outline along a polyline: every few points a short spike outward (normal side d)
function spikes(pts,every,len,d){var p=[];for(var i=0;i<pts.length;i++){p.push(pts[i]);if(i%every===0&&i>0&&i<pts.length-1){var a=pts[i-1],b=pts[i+1],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;p.push([pts[i][0]-dy/l*len*d,pts[i][1]+dx/l*len*d],pts[i]);}}return p;}
// fan of lines from apex to points along a base curve, one stroke (zigzag apex-side to base)
function fan(ap,base,step,t){var p=[],d=1;t=t||0.92;for(var i=0;i<base.length;i+=step){var b=base[i],a=lerp(b,ap,t);if(d>0)p.push(b,a);else p.push(a,b);d=-d;}return p;}
// horse silhouette (facing right), origin at hoof line under the middle; sc scale
var HORSE=[[-30,-41],[-10,-43],[12,-42],[22,-47],[30,-57],[38,-65],[44,-67],[52,-57],[53,-52],[49,-50],[42,-54],[34,-46],[30,-36],[28,-26],[29,-14],[31,0],[26,0],[24,-14],[22,-26],[14,-27],[16,-12],[18,0],[13,0],[10,-12],[8,-25],[-16,-25],[-19,-12],[-18,0],[-23,0],[-25,-12],[-25,-22],[-29,-13],[-27,0],[-32,0],[-34,-15],[-35,-30]];
function horse(s,sol,x,b,sc,fx,g){var P=M(HORSE,x,b,sc,fx);SOL(s,sol,P);var mane=[];for(var i=0;i<7;i++){var t=i/6,q=lerp(M([[22,-47]],x,b,sc,fx)[0],M([[42,-66]],x,b,sc,fx)[0],t);mane.push(q,[q[0]-3*sc*fx,q[1]-2*sc]);}s.push(mane);
  s.push(curve(M([[-34,-36],[-40,-28],[-41,-16],[-38,-8]],x,b,sc,fx),5));s.push(circle(x+46*sc*fx,b-60*sc,1.2*sc));
  if(g)H(s,M([[-30,-30],[20,-30],[22,-26],[8,-25],[-16,-25],[-25,-22]],x,b,sc,fx),g,20);H(s,M([[-28,-40],[-10,-42],[-10,-30],[-28,-30]],x,b,sc,fx),g||2,70);return P;}


// ---- batch 10 additions ----
// sheep: woolly scalloped body, dark head, legs; returns body polygon
function sheep(s,sol,x,b,sz,dir){var body=scallop(x,b-sz*1.1,sz*1.25,sz*0.75,14,0.1);body.pop();SOL(s,sol,body);
  var hd=EP(x+dir*sz*1.45,b-sz*1.35,sz*0.42,sz*0.32);FS(s,sol,hd,0.7,0);s.push([[x+dir*sz*1.2,b-sz*1.6],[x+dir*sz*1.05,b-sz*1.85]]);
  [-0.6,-0.25,0.3,0.65].forEach(function(f){s.push([[x+f*sz,b-sz*0.45],[x+f*sz,b]]);});return body;}
// curling vine through points with a few tendrils
function vine(s,pts,R){var c=curve(pts,6);s.push(c);for(var i=8;i<c.length-4;i+=RI(R,14,20)){var p=c[i];s.push(spiral(p[0]+3,p[1]-3,4,0.6,1.6,PI));}return c;}
// heart-shaped leaf polygon pointing direction a
function heartLeaf(cx,cy,r,a){var P=[];for(var i=0;i<=24;i++){var t=i/24*TAU,x=16*Math.pow(Math.sin(t),3),y=-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t));P.push([x*r/16,y*r/16]);}
  P.pop();return P.map(function(p){var c=Math.cos(a),sn=Math.sin(a);return [cx+p[0]*c-p[1]*sn,cy+p[0]*sn+p[1]*c];});}
function spokeW(s,sol,cx,cy,r,n){var P=EP(cx,cy,r,r);SOL(s,sol,P);s.push(circle(cx,cy,r*0.86));for(var k=0;k<n;k++){var a=k*TAU/n;s.push([[cx+2*Math.cos(a),cy+2*Math.sin(a)],[cx+r*0.86*Math.cos(a),cy+r*0.86*Math.sin(a)]]);}s.push(circle(cx,cy,2.5));return P;}
function cobbles(s,R,y,sol){var c=[];for(var yy=y+5,row=0;yy<196;yy+=RR(R,7,8),row++){var p=[[4,yy]];c.push([[4,yy],[296,yy]]);var xs=[];for(var x=4+(row%2)*7;x<296;x+=RR(R,13,16))xs.push([[x,yy],[x,Math.min(196,yy+5)]]);A(c,xs);}c.push([[4,y],[296,y]]);behind(s,c,sol);return s;}
function facade(s,R,y,sol){var b=[],x=4;while(x<296){var w=RR(R,44,60),h=RR(R,70,100),P=RP(x,y-h,Math.min(296,x+w),y);b.push(poly(P));for(var r=0;r<3;r++)for(var c=0;c<2;c++){var wx=x+8+c*(w/2),wy=y-h+10+r*22;if(wx+8<x+w-2)b.push(rect(wx,wy,wx+8,wy+13));}b.push([[x,y-h+4],[Math.min(296,x+w),y-h+4]]);x+=w;}behind(s,b,sol);return s;}

function legsR(s,sol,xs,y0,y1,w,g){xs.forEach(function(x,i){var P=RP(x-w,y0,x+w,y1);FS(s,sol,P,g&&i%2?g:0,90);});}
function quills(cx,cy,rx,ry,a0,a1,L,n,R){var p=[],d=1;for(var i=0;i<=n;i++){var a=a0+(a1-a0)*i/n,b=[cx+rx*Math.cos(a),cy+ry*Math.sin(a)],e=[cx+(rx+L*(0.6+0.6*R()))*Math.cos(a+0.12),cy+(ry+L*(0.6+0.6*R()))*Math.sin(a+0.12)];if(d>0)p.push(b,e);else p.push(e,b);d=-d;}return p;}
function hexP(cx,cy,r,a){var p=[];for(var i=0;i<6;i++){var an=(a||0)+i*PI/3;p.push([cx+r*Math.cos(an),cy+r*Math.sin(an)]);}return p;}
// ---- batch 12 ----

// ---- batch 12 chunk A: places, landscapes, plants, vehicles ----
// ---- batch 13 additions ----
// ladder from a (foot) to b (top), width w, n rungs; rungs in one zigzag stroke
function ladder(s,a,b,w,n){var dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy),nx=-dy/l*w/2,ny=dx/l*w/2;
  var L0=[a[0]+nx,a[1]+ny],L1=[b[0]+nx,b[1]+ny],R0=[a[0]-nx,a[1]-ny],R1=[b[0]-nx,b[1]-ny];s.push([L0,L1]);s.push([R0,R1]);
  var p=[],d=1;for(var i=1;i<n;i++){var t=i/n,P1=lerp(L0,L1,t),P2=lerp(R0,R1,t);if(d>0)p.push(P1,P2);else p.push(P2,P1);d=-d;}s.push(p);return s;}
// standard outdoor finish: hatched ground, rolling hills, sky rows
function outdoor(s,R,bg,sol,gy,hh){gnd(bg,R,gy);hills(bg,R,gy-2,hh==null?RR(R,18,30):hh,5);return fin(s,R,bg,sol,gy-3);}
// still life on a table with a striped wall (never tiles: they swallow the subject)
function onT(s,R,ty,sol){var t=[];tableS(t,R,ty,'stripes');behind(s,t,sol);return s;}
// a hen facing dir, standing on b
function hen(s,sol,x,b,sz,dir){var P=blob([[x-sz*1.1*dir,b-sz*1.2],[x-sz*0.4*dir,b-sz*0.5],[x+sz*0.6*dir,b-sz*0.55],[x+sz*1.0*dir,b-sz*1.3],[x+sz*0.85*dir,b-sz*1.95],[x+sz*0.45*dir,b-sz*1.6],[x-sz*0.4*dir,b-sz*1.5],[x-sz*1.3*dir,b-sz*2.0]],5);
  SOL(s,sol,P);H(s,[[x-sz*1.1*dir,b-sz*1.2],[x-sz*0.4*dir,b-sz*0.5],[x+sz*0.6*dir,b-sz*0.55],[x+sz*0.7*dir,b-sz*1.0],[x-sz*0.9*dir,b-sz*1.05]],sz*0.28,30);
  s.push([[x+sz*0.95*dir,b-sz*1.75],[x+sz*1.35*dir,b-sz*1.68],[x+sz*0.98*dir,b-sz*1.58]]);s.push([[x+sz*0.7*dir,b-sz*1.95],[x+sz*0.8*dir,b-sz*2.2],[x+sz*0.95*dir,b-sz*1.98]]);
  s.push([[x-sz*0.1,b-sz*0.55],[x-sz*0.1,b],[x+sz*0.2,b]]);s.push([[x+sz*0.3,b-sz*0.55],[x+sz*0.3,b],[x+sz*0.6,b]]);return P;}
// tall pointed column tree (poplar / cypress style) at x on base b; returns outline
function poplar(s,sol,R,x,b,h,w,g){var P=blob([[x,b-h],[x+w*0.55,b-h*0.75],[x+w,b-h*0.4],[x+w*0.8,b-h*0.08],[x,b-h*0.02],[x-w*0.8,b-h*0.08],[x-w,b-h*0.4],[x-w*0.55,b-h*0.75]],6);
  SOL(s,sol,P);H(s,P.filter(function(p){return p[0]>=x-0.5;}).concat([[x,b-h*0.03]]),g||1.8,RR(R,55,75));s.push([[x,b-h*0.02],[x,b]]);return P;}

function beast(s,sol,pts,ox,oy,sc,fx,n){var P=blob(M(pts,ox,oy,sc,fx),n||5);SOL(s,sol,P);return P;}
// shade the lower part of an outline below y (one hatch block)
function belly(s,P,y,g,a){var Q=P.filter(function(p){return p[1]>=y;});if(Q.length>2)H(s,Q,g,a);return s;}
// savanna/plain backdrop: tufts, an acacia, hills
function acacia(bg,x,b,sz){bg.push([[x-1.5,b],[x-1,b-sz*1.6],[x-sz*0.6,b-sz*2.2]]);bg.push([[x+1.5,b],[x+1,b-sz*1.5],[x+sz*0.7,b-sz*2.1]]);
  var c=blob([[x-sz*1.6,b-sz*2.1],[x-sz*0.8,b-sz*2.6],[x+sz*0.6,b-sz*2.7],[x+sz*1.7,b-sz*2.2],[x+sz*0.4,b-sz*1.95],[x-sz*0.6,b-sz*1.95]],5);bg.push(poly(c));H(bg,c,1.8,10);return bg;}
function rrect(x0,y0,x1,y1,r){return arc(x1-r,y0+r,r,r,-PI/2,0).concat(arc(x1-r,y1-r,r,r,0,PI/2)).concat(arc(x0+r,y1-r,r,r,PI/2,PI)).concat(arc(x0+r,y0+r,r,r,PI,1.5*PI));}
// a fruit-like oval with a crease and a shaded crescent
function fruit(s,sol,cx,cy,rx,ry,g,side){var P=EP(cx,cy,rx,ry);SOL(s,sol,P);s.push(quad([cx-rx*0.1,cy-ry],[cx+rx*0.25,cy],[cx-rx*0.05,cy+ry*0.9],8));shadeE(s,cx,cy,rx,ry,g||1.3,70,side||1,0.35);return P;}
function peaksMini(x,y,w){return [[x,y],[x+w*0.3,y-18],[x+w*0.5,y-8],[x+w*0.7,y-22],[x+w,y]];}
function room2(s,R,fy,sol){return room(s,R,fy,sol,'stripes');}
function logEnd(s,sol,cx,cy,rx,ry){var P=EP(cx,cy,rx,ry);SOL(s,sol,P);s.push(spiral(cx,cy,0.8,Math.min(rx,ry)*0.85,Math.max(2,Math.round(rx/3.5)),0).map(function(p){return [cx+(p[0]-cx),cy+(p[1]-cy)*ry/rx];}));return P;}
// horizontal log: body to the right of its end ellipse
function logH(s,sol,x,cy,r,L,g){var body=[[x,cy-r],[x+L,cy-r]].concat(arc(x+L,cy,r*0.45,r,-PI/2,PI/2).slice(1)).concat([[x,cy+r]]);SOL(s,sol,body);var bk=[];for(var y=cy-r+3;y<cy+r;y+=g||4)bk.push(wave(x,x+L,y,0.8,RR2(y),y));clipIn(s,[serp(bk)],body);logEnd(s,sol,x,cy,r*0.45,r);return body;}
function RR2(y){return 10+(Math.abs(Math.sin(y))*10);}

// ---- batch 14 ----
// ---- batch 14 chunk A: places, landscapes, plants ----
// shade the right part (fraction f) of polygon P with lines at angle a, clipped inside P
function sideShade(s,P,f,g,a,left){var x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;P.forEach(function(p){x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1]);});
  var B=left?RP(x0-2,y0-2,x0+(x1-x0)*f,y1+2):RP(x1-(x1-x0)*f,y0-2,x1+2,y1+2);clipIn(s,hatch(B,g,a),P);return s;}
// stone slab / boulder: wobbly blob around a box
function stone(R,x0,y0,x1,y1){var cx=(x0+x1)/2,cy=(y0+y1)/2,w=(x1-x0)/2,h=(y1-y0)/2;return blob([[x0,y1],[x0+RR(R,-2,2),cy],[x0+w*0.3,y0+RR(R,0,3)],[cx+w*0.4,y0],[x1+RR(R,-2,2),cy-h*0.3],[x1,y1]],5);}

S('Dolmen',['Table of the Giants','Capstone at Dusk','Older Than the Fields','Three Legs of Stone','Portal on the Moor'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,166,172),cx=RR(R,135,165),w=RR(R,62,72),h=RR(R,50,58);
  var mound=quad([cx-w-60,gy],[cx,gy-30],[cx+w+60,gy],24);var M0=mound.concat([[cx+w+60,gy],[cx-w-60,gy]]);SOL(s,sol,M0);
  clipIn(s,[rows(cx-w-60,cx+w+60,gy-24,gy,RR(R,3.6,4.4))],M0);var my=gy-14;
  [[-0.78,24],[-0.05,28],[0.66,22]].forEach(function(L,i){var x=cx+L[0]*w,lw=L[1],b=my+(i===1?-4:3),top=my-h+RR(R,-3,3);
    var P=stone(R,x-lw/2,top,x+lw/2,b);FS(s,sol,P);sideShade(s,P,0.45,RR(R,1.6,2.1),RR(R,70,85));
    s.push(curve([[x-lw*0.2,top+8],[x-lw*0.05,top+h*0.4],[x-lw*0.15,b-6]],5));});
  var ct=my-h-RR(R,20,26),cb=my-h+6,tilt=RR(R,-6,6);
  var cap=blob([[cx-w-18,cb+tilt],[cx-w-12,ct+8+tilt],[cx-w*0.3,ct],[cx+w*0.5,ct+2],[cx+w+16,ct+10-tilt],[cx+w+20,cb-tilt],[cx+w*0.2,cb+3],[cx-w*0.4,cb+4]],5);
  FS(s,sol,cap);clipIn(s,hatch(RP(cx-w-24,cb-8,cx+w+24,cb+8),1.6,RR(R,-8,8)),cap);
  s.push(curve([[cx-w*0.5,ct+4],[cx-w*0.2,ct+10],[cx+w*0.1,ct+7]],5));s.push(curve([[cx+w*0.4,ct+5],[cx+w*0.6,ct+12]],4));
  // dark gap under the capstone between the uprights
  var gap=RP(cx-w*0.78+12,cb+4,cx+w*0.66-11,my-4);clipIn(s,[zz(gap[0][0],gap[1][0],gap[0][1],gap[2][1],2.2)],gap,sol);
  for(var i=0;i<RI(R,3,5);i++){var rx=RR(R,20,280);if(Math.abs(rx-cx)<w+40)continue;var r=stone(R,rx-7,gy-7,rx+7,gy);FS(s,sol,r,1.6,60);}
  bg.push(tufts(4,296,gy,4,R));return outdoor(s,R,bg,sol,gy,RR(R,26,40));});

S('Helter skelter',['Round and Down','Mat Under the Arm','Fairground Spiral','Top of the Tower','One More Go'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,176,182),cx=RR(R,130,170),tw=RR(R,15,18),top=RR(R,46,52),rs=RR(R,44,50),turns=3,pitch=(gy-12-top-14)/turns;
  var T=RP(cx-tw,top,cx+tw,gy);SOL(s,sol,T);
  var roofT=top-RR(R,30,36),roof=[[cx-tw-8,top],[cx,roofT],[cx+tw+8,top]];FS(s,sol,roof);clipIn(s,[zz(cx-tw-8,cx+tw+8,roofT,top,4)],roof);
  s.push([[cx,roofT],[cx,roofT-12],[cx+10,roofT-9],[cx,roofT-6]]);
  // slide: helical band; front halves drawn, back halves only outside the tower
  var y0=top+14,bands=[];
  for(var t=0;t<turns;t++){var up=[],lo=[];for(var k=0;k<=40;k++){var a=k/40*PI,yy=y0+(t+a/TAU)*pitch+Math.sin(a)*rs*0.22;up.push([cx+rs*Math.cos(a),yy]);lo.push([cx+rs*Math.cos(a),yy+6]);}
    var band=up.concat(lo.slice().reverse());SOL(s,sol,band);var st=[],d=1;for(var k2=0;k2<=40;k2+=4){if(d>0)st.push(up[k2],lo[k2]);else st.push(lo[k2],up[k2]);d=-d;}s.push(st);
    var bk=[];for(var k3=0;k3<=40;k3++){var a2=PI+k3/40*PI,yy2=y0+(t+0.5+k3/80)*pitch+Math.sin(a2)*rs*0.22,xx=cx+rs*Math.cos(a2);if(Math.abs(xx-cx)>tw+1)bk.push([xx,yy2]);else if(bk.length>1){s.push(bk);bk=[];}else bk=[];}if(bk.length>1)s.push(bk);}
  clipIn(s,[zz(cx-tw,cx+tw,top,gy,RR(R,5,6))],T,sol.slice(1));
  s.push(archP(cx,gy,6,10));var mat=[[cx-rs-30,gy],[cx-rs-24,gy-4],[cx-rs+6,gy-4],[cx-rs+10,gy]];FS(s,sol,mat,1.4,0);
  var f0=[cx+rs+20,gy],pole=[[f0[0],gy],[f0[0],gy-60]];s.push(pole);s.push(flagLine([f0[0],gy-60],[cx+tw+8,top],10,7,6));
  bg.push(comb(4,296,gy-2,10,6));treeR(bg,R,RR(R,30,60),gy,RR(R,14,18),2);return outdoor(s,R,bg,sol,gy,RR(R,14,24));});

S('Hooded beach chairs',['Wicker Against the Wind','Two Hoods Facing the Sea','North Sea Afternoon','Shelter for Two','Stripes on the Sand'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,150,156),n=RI(R,2,3),xs=n===2?[RR(R,80,105),RR(R,185,215)]:[60,150,240];
  xs.forEach(function(x,i){var w=RR(R,30,36),b=gy+RR(R,22,34),seatY=b-RR(R,34,40),hoodT=seatY-RR(R,46,54);
    var base=RP(x-w,seatY,x+w,b);FS(s,sol,base);clipIn(s,[zz(x-w,x+w,seatY,b,3.2)],base);s.push([[x-w,seatY+6],[x+w,seatY+6]]);
    var hood=[[x-w,seatY]].concat(arc(x,hoodT+w*0.4,w,w*0.5,PI,TAU)).concat([[x+w,seatY]]);SOL(s,sol,hood);
    var inner=[[x-w+7,seatY]].concat(arc(x,hoodT+w*0.5,w-7,w*0.38,PI,TAU)).concat([[x+w-7,seatY]]);s.push(inner);
    clipIn(s,[rows(x-w,x+w,hoodT,seatY,1.6)],inner);clipIn(s,[zz(x-w,x+w,hoodT,seatY,RR(R,4.5,5.5))],hood,[inner]);
    var fy=seatY-6;s.push([[x-w+7,fy],[x+w-7,fy]]);FS(s,sol,RP(x-w+9,fy-2,x+w-9,fy+6),0);
    [[x-w*0.7,b],[x+w*0.7,b]].forEach(function(p){s.push([[p[0]-3,p[1]],[p[0]-3,p[1]+3],[p[0]+3,p[1]+3],[p[0]+3,p[1]]]);});});
  var sea=RP(4,gy-34,296,gy);bg.push([[4,gy-34],[296,gy-34]]);bg.push(waterS(R,4,296,gy-30,gy-2,RR(R,4.5,5.5),1.1));
  bg.push(wave(4,296,gy,1.6,RR(R,18,26),R()*6));sand(bg,R,gy+6,RR(R,6,8));
  var gx=RR(R,10,30);bg.push([[gx,gy+20],[gx+8,gy+8],[gx+16,gy+20]]);return fin(s,R,bg,sol,gy-35);});

S('Wooden footbridge',['Over the Brook','Plank by Plank','Crossing at the Mill Race','Handrail Worn Smooth','Little Arch, Low Water'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,128,134),x0=RR(R,38,52),x1=RR(R,248,262),rise=RR(R,22,30),th=6,rh=RR(R,18,22);
  var deck=quad([x0,gy],[(x0+x1)/2,gy-rise*2],[x1,gy],30),under=deck.map(function(p){return [p[0],p[1]+th];});
  var D=deck.concat(under.slice().reverse());FS(s,sol,D);clipIn(s,[zz(x0,x1,gy-rise-4,gy+th+2,3)],D);
  var rail=deck.map(function(p){return [p[0],p[1]-rh];});s.push(rail);var mid=deck.map(function(p){return [p[0],p[1]-rh*0.5];});s.push(mid);
  var posts=[];for(var i=0;i<=30;i+=3){var p=deck[i];posts.push([p[0],p[1]],[p[0],p[1]-rh],[p[0],p[1]]);}s.push(posts);
  var xb=[];for(var j=0;j<30;j+=6){var a=deck[j],b=deck[Math.min(30,j+6)];xb.push([a[0],a[1]-rh*0.5],[b[0],b[1]],[a[0],a[1]],[b[0],b[1]-rh*0.5]);}s.push(xb);
  var arch=quad([x0+18,gy+th],[(x0+x1)/2,gy-rise+th+10],[x1-18,gy+th],20);s.push(arch);
  [x0+30,(x0+x1)/2,x1-30].forEach(function(px){var py=interpY(arch,px);FS(s,sol,RP(px-3,py,px+3,gy+38),1.2,90);});
  var bankL=blob([[4,gy-4],[x0+12,gy-2],[x0+26,gy+20],[x0+8,gy+44],[4,gy+48]],4),bankR=blob([[296,gy-4],[x1-12,gy-2],[x1-26,gy+20],[x1-8,gy+44],[296,gy+48]],4);
  [bankL,bankR].forEach(function(P){FS(s,sol,P,RR(R,2.6,3.2),RR(R,20,60));});
  var wat=RP(4,gy+6,296,196);waterIn(bg,R,wat,gy+10,194,RR(R,4.6,5.4));bg.push([[4,gy],[296,gy]]);
  treeR(bg,R,RR(R,14,30),gy,RR(R,16,20),2);treeR(bg,R,RR(R,265,285),gy,RR(R,14,18),2);hills(bg,R,gy-1,RR(R,20,30),5);
  return fin(s,R,bg,sol,gy-2);});

S('Salt flats',['White to the Horizon','Crust and Mirror','Tracks to Nowhere','Dry Lake, Noon','Hexagons Underfoot'],function(R){
  var s=[],sol=[],hy=RR(R,92,100);peaks(s,R,hy,RR(R,26,38),RI(R,4,6),2.2);s.push([[4,hy],[296,hy]]);
  var vx=RR(R,110,190),rowsY=[],y=hy+3,g=2.6;while(y<196){rowsY.push(y);y+=g;g*=1.22;}rowsY.push(196);
  var net=[],d=1;for(var i=0;i<rowsY.length-1;i++){var ya=rowsY[i],yb=rowsY[i+1],cw=(yb-ya)*1.9,pts=[];for(var x=4;x<=296;x+=cw)pts.push([x,ya+RR(R,-0.4,0.4)*(yb-ya)*0.3]);
    if(d<0)pts.reverse();var q=[];pts.forEach(function(p,k){q.push(p);if(k%2===(i%2))q.push([p[0]+RR(R,-2,2),yb],p);});net.push(q);d=-d;}
  var tr=[];[-1,1].forEach(function(sgn2){[-6,6].forEach(function(o){tr.push([[vx+sgn2*0+o*0.1,hy+1],[vx+sgn2*60+o*4+(sgn2>0?60:-60)*0,196]]);});});
  var t1=[[vx-2,hy+1],[vx-70,196]],t2=[[vx+2,hy+1],[vx-30,196]];var tracks=[t1,t2],tpoly=[[vx-3,hy+1],[vx+3,hy+1],[vx-26,196],[vx-74,196]];
  s.push(t1);s.push(t2);clipIn(s,hatch(tpoly,1.6,0),tpoly);behind(s,net,[tpoly]);
  var mir=[];for(var yy=hy+4;yy<hy+16;yy+=2.6)mir.push([[RR(R,30,90),yy],[RR(R,180,270),yy]]);behind(s,mir,[tpoly]);
  return skyFill(s,hy-2,RR(R,7,8),RR(R,4.2,5),5,[]);});

S('Mountain stream with boulders',['Snowmelt Hurrying','Boulders in the Current','Cold Water Talking','Down from the Pass','Ford in the Pines'],function(R){
  var s=[],sol=[],bg=[],hy=RR(R,74,82),sx=RR(R,130,170);
  var Lb=curve([[sx-6,hy],[sx-20,hy+30],[sx-40,hy+70],[sx-90,196]],6),Rb=curve([[sx+6,hy],[sx+26,hy+34],[sx+50,hy+72],[sx+100,196]],6);
  s.push(Lb);s.push(Rb);var stream=Lb.concat(Rb.slice().reverse());
  var nb=RI(R,3,5);for(var i=0;i<nb;i++){var t=RR(R,0.3,0.95),yy=hy+(196-hy)*t,xl=interpY(Lb.map(function(p){return [p[1],p[0]];}),yy),xr=interpY(Rb.map(function(p){return [p[1],p[0]];}),yy),bx=RR(R,xl+6,xr-6),bs=4+t*16;
    var P=stone(R,bx-bs,yy-bs*0.8,bx+bs,yy);FS(s,sol,P);sideShade(s,P,0.5,1.4,RR(R,60,80));s.push(arc(bx,yy+1,bs*1.2,bs*0.35,0.2,PI-0.2));}
  var wl=[];for(var y=hy+3;y<196;y+=4.4+((y-hy)/(196-hy))*4){var xl2=interpY(Lb.map(function(p){return [p[1],p[0]];}),y),xr2=interpY(Rb.map(function(p){return [p[1],p[0]];}),y);wl.push(wave(xl2,xr2,y,0.8,RR(R,8,14),R()*6));}
  clipIn(s,[serp(wl)],stream,sol);
  var gL=[[4,hy],[sx-6,hy]].concat(Lb).concat([[4,196]]),gR=[[296,hy],[sx+6,hy]].concat(Rb).concat([[296,196]]);
  [gL,gR].forEach(function(G,k){clipIn(bg,[rows(4,296,hy+4,196,RR(R,6.5,7.5))],G);});
  for(var j=0;j<RI(R,3,4);j++){var side=j%2?1:-1,px=side<0?RR(R,14,sx-60):RR(R,sx+60,286),pb=RR(R,hy+8,hy+40);pineT(s,px,pb,RR(R,0.9,1.3),2.8);sol.push([[px-16,pb],[px,pb-60],[px+16,pb]]);}
  peaks(bg,R,hy,RR(R,34,46),RI(R,3,5),2.2);return fin(s,R,bg,sol,hy-2);});

S('Monkey puzzle tree',['Scales on Every Arm','Candelabra of Spines','Old Tree, Odd Shape','Arms Turned Upward','Garden Curiosity'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,172,178),cx=RR(R,130,170),top=RR(R,16,22);
  var trunk=[[cx-7,gy],[cx-4,top+20],[cx+4,top+20],[cx+7,gy]];FS(s,sol,trunk);clipIn(s,[zz(cx-8,cx+8,top+20,gy,3)],trunk);
  for(var y=top+24;y<gy-50;y+=RR(R,14,18)){[-1,1].forEach(function(d){var L=RR(R,34,58)*(0.7+0.5*(y-top)/(gy-top)),dy=RR(R,8,14);
    var br=curve([[cx+d*3,y],[cx+d*L*0.5,y+dy*0.6],[cx+d*L*0.9,y+dy*0.2],[cx+d*L,y-dy*1.2]],6);
    var tb=tube(br,function(u){return 3.2-1.2*u;});SOL(s,sol,tb.P);s.push(spikes(tb.L,2,3.5,-1));s.push(spikes(tb.R,2,3.5,1));
    s.push(zz(0,0,0,0,1).length?br:br);});}
  var crown=[];for(var k=0;k<4;k++){var a=-PI/2+(k-1.5)*0.5;crown.push(curve([[cx,top+22],[cx+Math.cos(a)*10,top+12],[cx+Math.cos(a)*16,top+4]],5));}
  crown.forEach(function(c){s.push(spikes(c,2,3,1));});
  bg.push(tufts(4,296,gy,4,R));var bx=RR(R,30,70);bg.push(comb(4,cx-40,gy,12,8));return outdoor(s,R,bg,sol,gy,RR(R,16,26));});

S('Lilac branch',['Purple in the Jug','Scent at the Window','May Cuttings','Heavy Heads of Lilac','Kitchen Bouquet'],function(R){
  var s=[],sol=[],ty=RR(R,156,162),jx=RR(R,130,170),jw=RR(R,26,30),jh=RR(R,46,52);
  var jug=[[jx-jw*0.7,ty]].concat(cubic([jx-jw*0.7,ty],[jx-jw*1.3,ty-jh*0.5],[jx-jw*0.6,ty-jh*0.8],[jx-jw*0.5,ty-jh],12).slice(1)).concat([[jx+jw*0.5,ty-jh]]).concat(cubic([jx+jw*0.5,ty-jh],[jx+jw*0.6,ty-jh*0.8],[jx+jw*1.3,ty-jh*0.5],[jx+jw*0.7,ty],12).slice(1));
  FS(s,sol,jug);sideShade(s,jug,0.35,1.5,80);s.push(arc(jx,ty-jh,jw*0.5,3,0,PI));
  s.push(curve([[jx+jw*0.9,ty-jh*0.75],[jx+jw*1.45,ty-jh*0.6],[jx+jw*1.2,ty-jh*0.2],[jx+jw*0.85,ty-jh*0.2]],5));
  var heads=RI(R,3,4),stems=[];for(var i=0;i<heads;i++){var a=-PI/2+(i-(heads-1)/2)*RR(R,0.42,0.52),L=RR(R,70,92),tip=[jx+Math.cos(a)*L*1.2,ty-jh+Math.sin(a)*L];
    s.push(curve([[jx+(i-1)*4,ty-jh],[lerp([jx,ty-jh],tip,0.5)[0]+RR(R,-6,6),lerp([jx,ty-jh],tip,0.5)[1]],tip],5));
    var hw=RR(R,13,16),hl=RR(R,34,42),ang=a+PI/2,base=tip,cone=[];
    for(var k=0;k<=16;k++){var t=k/16,side=-1;cone.push([base[0]+Math.cos(ang)*(-hw*(1-t)),base[1]+Math.sin(ang)*(-hw*(1-t))]);}
    var P=blob([[-hw,0],[-hw*0.9,-hl*0.4],[-hw*0.5,-hl*0.8],[0,-hl],[hw*0.5,-hl*0.8],[hw*0.9,-hl*0.4],[hw,0],[0,hw*0.3]].map(function(p){var c=Math.cos(a+PI/2),sn=Math.sin(a+PI/2);return [base[0]+p[0]*c-p[1]*sn,base[1]+p[0]*sn+p[1]*c];}),4);
    P=scallopOutline(P);SOL(s,sol,P);var fl=[];for(var r=0;r<10;r++){var ya=r/10;fl.push(bumps(-hw,hw,-hl*ya,2.2,4.4).map(function(p){var c=Math.cos(a+PI/2),sn=Math.sin(a+PI/2);return [base[0]+p[0]*c-p[1]*sn,base[1]+p[0]*sn+p[1]*c];}));}
    clipIn(s,[serp(fl)],P);
    leafL(s,sol,tip,[tip[0]+(i%2?18:-18),tip[1]+20],7,1.4);var lm=lerp([jx,ty-jh],tip,0.45);leafL(s,sol,lm,[lm[0]+(i%2?-22:22),lm[1]-8],8,1.4);}
  onT(s,R,ty,sol);return s;});
function scallopOutline(P){var out=[];for(var i=0;i<P.length;i+=3){var a=P[i],b=P[(i+3)%P.length],m=lerp(a,b,0.5),dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;out.push(a,[m[0]+dy/l*1.6,m[1]-dx/l*1.6]);}return out;}

S('Calla lilies in a vase',['White Trumpets','Five Stems in Glass','Curl at the Lip','Still Life with Callas','Cool Linen Morning'],function(R){
  var s=[],sol=[],ty=RR(R,160,166),vx=RR(R,135,165),vw=RR(R,17,20),vh=RR(R,62,70);
  var vase=[[vx-vw,ty],[vx-vw*0.8,ty-vh],[vx+vw*0.8,ty-vh],[vx+vw,ty]];SOL(s,sol,vase);s.push(arc(vx,ty-vh,vw*0.8,3,0,TAU));
  var n=RI(R,4,5),tips=[];for(var i=0;i<n;i++){var a=-PI/2+(i-(n-1)/2)*RR(R,0.3,0.38),L=RR(R,44,58);tips.push({p:[vx+Math.cos(a)*L*1.3,ty-vh+Math.sin(a)*L],a:a,b:[vx+(i-(n-1)/2)*5,ty-4]});}
  tips.forEach(function(t){s.push(curve([t.b,[lerp(t.b,t.p,0.6)[0],lerp(t.b,t.p,0.6)[1]],t.p],5));});
  clipIn(s,[waterS(R,vx-vw,vx+vw,ty-vh*0.55,ty-2,3.6,0.6)],vase);
  tips.forEach(function(t,k){var c=Math.cos(t.a+PI/2),sn=Math.sin(t.a+PI/2),sz=RR(R,1.5,1.75),T=function(pts){return pts.map(function(p){return [t.p[0]+(p[0]*c-p[1]*sn)*sz,t.p[1]+(p[0]*sn+p[1]*c)*sz];});};
    var spathe=T(blob([[0,0],[-6,-8],[-11,-20],[-8,-30],[4,-36],[14,-30],[9,-22],[6,-10]],5));SOL(s,sol,spathe);
    var lip=T(curve([[4,-36],[-2,-28],[-6,-22],[0,-14]],5));s.push(lip);s.push(T([[0,-4],[1,-14],[2,-22]]));
    clipIn(s,hatch(T([[-12,0],[0,0],[0,-40],[-12,-40]]),1.3,t.a*180/PI),spathe);});
  [-1,1].forEach(function(d){var p0=[vx+d*vw*0.6,ty-vh],tip=[vx+d*RR(R,48,60),ty-vh-RR(R,24,36)];leafL(s,sol,p0,tip,RR(R,9,12),1.6);});
  onT(s,R,ty,sol);return s;});

S('Bird of paradise flower',['Crane in the Garden','Orange Crest, Blue Tongue','Beak Among the Leaves','Strelitzia Morning','Tropical Head'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,176,182),cx=RR(R,120,180),hy=RR(R,72,82);
  var stem=curve([[cx+6,gy],[cx+2,hy+60],[cx-4,hy+20],[cx-10,hy+6]],6);var st=tube(stem,function(u){return 3;});SOL(s,sol,st.P);
  var sheath=blob([[cx-10,hy+6],[cx-30,hy+2],[cx-62,hy-6],[cx-82,hy-14],[cx-60,hy+2],[cx-36,hy+12],[cx-14,hy+14]],5);FS(s,sol,sheath);
  clipIn(s,hatch(RP(cx-90,hy-20,cx,hy+20),1.4,12),sheath,[]);
  var pet=[];for(var k=0;k<3;k++){var base=[cx-40-k*6,hy-2],tip=[cx-14-k*22+RR(R,-4,4),hy-RR(R,58,72)+k*6];var L=lens(base,tip,RR(R,5,7));SOL(s,sol,L);s.push(lerp(base,tip,0.1).concat?[base,lerp(base,tip,0.85)]:[]);pet.push(L);}
  pet.forEach(function(L){clipIn(s,hatch(RP(cx-120,hy-90,cx+20,hy),RR(R,2.4,3),-60),L);});
  var tongue=lens([cx-44,hy-4],[cx-80,hy-34],4);FS(s,sol,tongue,0.9,40);
  for(var j=0;j<RI(R,3,4);j++){var lx=cx+RR(R,-60,60)+(j%2?30:-30),tipx=lx+RR(R,-30,30),tipy=gy-RR(R,90,128),p0=[lx,gy];s.push([p0,[tipx,tipy+24]]);
    var Lf=lens([tipx,tipy+24],[tipx+RR(R,-6,6),tipy-30],RR(R,13,17));SOL(s,sol,Lf);s.push(lerp([tipx,tipy+24],[tipx,tipy-30],0).concat?[[tipx,tipy+24],[tipx+RR(R,-3,3),tipy-26]]:[]);clipIn(s,hatch(RP(tipx-20,tipy-34,tipx+20,tipy+26),2.4,55),Lf);}
  bg.push(comb(4,296,gy-24,26,7));bg.push([[4,gy-50],[296,gy-50]]);return outdoor(s,R,bg,sol,gy,0);});

S('Pampas grass',['Plumes in the Wind','Feather Dusters','Autumn Border','Silver Heads Nodding','Tall by the Gate'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,176,182),cx=RR(R,120,180),n=RI(R,4,6);
  for(var i=0;i<n;i++){var a=-PI/2+(i-(n-1)/2)*RR(R,0.16,0.22),L=RR(R,110,140),bend=RR(R,-14,14),tip=[cx+Math.cos(a)*L*1.4+bend,gy-24+Math.sin(a)*L];
    s.push(curve([[cx+(i-(n-1)/2)*3,gy-12],[lerp([cx,gy-12],tip,0.5)[0]+bend*0.5,lerp([cx,gy-12],tip,0.5)[1]],tip],6));
    var pl=lens(lerp([cx,gy-12],tip,0.68),[tip[0]+bend*0.25,tip[1]-RR(R,8,14)],RR(R,8,11));SOL(s,sol,pl);clipIn(s,[zz(tip[0]-30,tip[0]+30,tip[1]-40,tip[1]+60,3.2)].map(function(z){return rotateAbout(z,tip[0],tip[1],RR(R,-0.5,0.5));}),pl);}
  var leaves=[],d=1;for(var j=0;j<RI(R,12,15);j++){var la=PI+RR(R,0.1,PI-0.1),ll=RR(R,40,90),p0=[cx+RR(R,-10,10),gy],tip2=[cx+Math.cos(la)*ll*1.3,gy-14+Math.sin(la)*ll*0.5];var c=quad(p0,[lerp(p0,tip2,0.5)[0],tip2[1]-ll*0.4],tip2,10);if(d<0)c.reverse();A(leaves,c);d=-d;}
  s.push(leaves);var clump=[[cx-60,gy],[cx-30,gy-20],[cx+30,gy-20],[cx+60,gy]];sol.push(clump);
  var fx=RR(R,20,60);bg.push(comb(4,296,gy-6,22,9));bg.push([[4,gy-22],[296,gy-22]]);bg.push([[4,gy-14],[296,gy-14]]);return outdoor(s,R,bg,sol,gy,RR(R,10,22));});

S('Passing rain shower',['Rain Walking the Hills','Grey Veil to the West','Shower Over the Farm','Here Comes the Wet','Sun Behind, Rain Ahead'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,150,158),cx=RR(R,110,190),cy=RR(R,40,50),cw=RR(R,66,80);
  var cloud=scallop(cx,cy,cw,RR(R,18,22),RI(R,9,12),0.16);cloud.pop();var cb=cloud.filter(function(p){return p[1]>cy;});SOL(s,sol,cloud);clipIn(s,hatch(RP(cx-cw*1.2,cy,cx+cw*1.2,cy+30),2,0),cloud);
  var slant=RR(R,8,16)*sgn(R),rainP=[[cx-cw*0.7,cy+12],[cx+cw*0.7,cy+12],[cx+cw*0.7+slant*3,gy],[cx-cw*0.7+slant*3,gy]];
  var hl=hills(bg,R,gy-2,RR(R,22,34),0);var farm=RR(R,30,80);if(Math.abs(farm-cx)<50)farm=cx+90>270?cx-110:cx+90;
  var bh=[[farm-18,gy-4],[farm-18,gy-24],[farm,gy-38],[farm+18,gy-24],[farm+18,gy-4]];FS(s,sol,bh);s.push(rect(farm-5,gy-16,farm+5,gy-4));clipIn(s,[zz(farm-18,farm+18,gy-38,gy-24,3)],bh);
  treeR(s,R,farm+34,gy-4,RR(R,10,13),2);sol.push(EP(farm+34,gy-4-RR(R,10,13)*1.6,14,12));
  var rain=[],dd=1;for(var x=cx-cw*0.75;x<cx+cw*0.75;x+=2.6){var a=[x,cy+10],b=[x+slant*3,gy];if(dd>0)rain.push(a,b);else rain.push(b,a);dd=-dd;}
  clipIn(s,[rain],rainP,sol.slice(1));
  var fur=[];furrows(fur,R,gy,RI(R,14,18));behind(s,fur,sol);behind(s,[hl],[rainP].concat(sol));
  return skyFill(s,gy-3,RR(R,7,8),RR(R,4.5,5.2),5,[rainP].concat(sol));});

// ---- batch 14 chunk B: vehicles, animals, birds, sea life ----
// fur ticks along an outline: short strokes pointing inward every few points (one stroke)
function furT(P,every,len){var p=[],n=P.length;for(var i=0;i<n;i+=every){var a=P[i],b=P[(i+1)%n],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;p.push(a,[a[0]+dy/l*len,a[1]-dx/l*len],a);}return p;}
function streetBG(s,R,gy,sol){var bg=[];road(bg,R,gy);facade(bg,R,gy-2,sol);behind(s,bg,sol);return sky(s,R,gy-3,sol);}

S('Ambulance',['On Call','Lights on the Roof','Night Shift Parked','Doors Ready','Quiet Before the Siren'],function(R){
  var s=[],sol=[],gy=RR(R,168,174),x0=RR(R,40,56),L=RR(R,190,204),x1=x0+L,top=gy-RR(R,92,100),cabX=x1-RR(R,52,58);
  var body=[[x0,gy-12],[x0,top],[cabX,top],[cabX,top+18],[x1-14,top+30],[x1,top+52],[x1,gy-12]];FS(s,sol,body);
  s.push([[x0,top+44],[cabX-4,top+44]]);s.push([[x0,top+56],[x1,top+56]]);clipIn(s,[rows(x0,x1,top+45,top+55,2.2)],RP(x0,top+44,x1,top+56));
  var ws=[[cabX+4,top+22],[x1-15,top+32],[x1-6,top+44],[cabX+4,top+44]];FS(s,sol,ws,1.8,45);
  [[x0+14,top+12,34,22],[x0+62,top+12,34,22]].forEach(function(w){s.push(rrect(w[0],w[1],w[0]+w[2],w[1]+w[3],3));H(s,RP(w[0]+3,w[1]+3,w[0]+w[2]-3,w[1]+w[3]-3),2.4,60);});
  s.push([[x0+110,top+6],[x0+110,gy-14]]);s.push([[cabX-2,top+6],[cabX-2,gy-14]]);s.push([[x0+104,top+62],[x0+116,top+62]]);
  var lb=RP(cabX-30,top-7,cabX+2,top);FS(s,sol,lb,1.2,90);s.push(RP(x0+6,top-4,x0+22,top));
  var ch=[[x0+150,top+62],[x0+150,top+82]];var cx2=x0+130,cy2=top+68;s.push([[cx2-8,cy2],[cx2+8,cy2]]);s.push([[cx2,cy2-8],[cx2,cy2+8]]);s.push(circle(cx2,cy2,11));
  s.push(rect(x1-6,gy-30,x1+2,gy-20));s.push([[x0-2,gy-14],[x1+2,gy-14]]);
  [x0+36,x1-36].forEach(function(wx){var P=arc(wx,gy-12,20,20,PI,TAU);s.push(P);tyre(s,sol,wx,gy-6,15,1.4);});
  return streetBG(s,R,gy,sol);});

S('Cargo bike',['Groceries Up Front','School Run','Box on the Front Wheel','Market Morning','Long Wheelbase'],function(R){
  var s=[],sol=[],gy=RR(R,170,176),fx=RR(R,70,90),rx=fx+RR(R,150,166),fr=18,rr=22;
  spokeW(s,sol,fx,gy-fr,fr,12);spokeW(s,sol,rx,gy-rr,rr,14);
  var bb=[rx-44,gy-22],seat=[rx-50,gy-84],head=[fx+44,gy-72];
  s.push([[fx,gy-fr],[fx+38,gy-30],[bb[0],bb[1]],[rx,gy-rr]]);s.push([bb,[seat[0]+2,seat[1]+6]]);s.push([[seat[0]+4,seat[1]+16],[rx,gy-rr]]);
  s.push([[fx+38,gy-30],[head[0],head[1]]]);s.push([[fx,gy-fr],[head[0]-4,head[1]+10]]);s.push([[head[0],head[1]],[head[0]-10,head[1]-12],[head[0]+8,head[1]-16]]);
  FS(s,sol,[[seat[0]-12,seat[1]],[seat[0]+10,seat[1]-2],[seat[0]+12,seat[1]+4],[seat[0]-8,seat[1]+5]],1,0);
  var bx0=fx-20,bx1=fx+40,bt=gy-RR(R,70,76),bxb=gy-34;var box=[[bx0,bt],[bx1,bt],[bx1-4,bxb],[bx0+6,bxb]];FS(s,sol,box);clipIn(s,[rows(bx0,bx1,bt+5,bxb,5.5)],box);
  var stuff=[];for(var i=0;i<RI(R,3,4);i++){var cx=bx0+10+i*14,h=RR(R,10,24);stuff.push(RP(cx-6,bt-h,cx+6,bt));}stuff.forEach(function(P,k){FS(s,sol,P,k%2?1.6:0,30);});
  var lv=[bx0+4,bt-RR(R,22,30)];for(var j=0;j<3;j++)leafL(s,sol,[bx0+8,bt],[lv[0]-8+j*10,lv[1]-j*4],4,0);
  s.push(circle(bb[0],bb[1],6));s.push([[bb[0],bb[1]],[bb[0]+8,bb[1]+10],[bb[0]+14,bb[1]+10]]);
  s.push([[rx-22,gy-rr-10],[rx+20,gy-rr-10]]);s.push(arc(rx,gy-rr,rr+4,rr+4,PI+0.3,TAU-0.2));
  var bg=[];road(bg,R,gy);hills(bg,R,gy-2,RR(R,22,32),5);treeR(bg,R,RR(R,20,50),gy,RR(R,16,20),2.4);treeR(bg,R,RR(R,250,280),gy,RR(R,14,18),2.4);return fin(s,R,bg,sol,gy-3);});

S('Kick scooter',['Leaning on the Wall','Two Small Wheels','After School','Fold and Go','Pavement Racer'],function(R){
  var s=[],sol=[],gy=RR(R,172,178),x0=RR(R,50,70),L=RR(R,170,190),wr=RR(R,13,15),dy=gy-wr*1.2;
  var deck=[[x0+14,dy-6],[x0+L-30,dy-6],[x0+L-24,dy+2],[x0+18,dy+2]];FS(s,sol,deck);clipIn(s,[zz(x0+14,x0+L-24,dy-6,dy+2,3)],deck);
  tyre(s,sol,x0+6,gy-wr,wr,1.2);tyre(s,sol,x0+L-14,gy-wr,wr,1.2);s.push(arc(x0+L-14,gy-wr,wr+3,wr+3,PI,TAU-0.6));
  var hb=[x0+20,gy-RR(R,118,128)];var st=[[x0+6,gy-wr],[x0+14,dy],[hb[0],hb[1]]];s.push(st);var stem=tube([[x0+12,dy-4],hb],function(){return 3;});SOL(s,sol,stem.P);
  var grips=[[hb[0]-26,hb[1]],[hb[0]+26,hb[1]]];s.push(grips);[grips[0],grips[1]].forEach(function(g,k){var P=RP(g[0]+(k?-12:0),g[1]-3,g[0]+(k?0:12),g[1]+3);FS(s,sol,P,1,90);});
  s.push([[x0+L-24,dy-2],[x0+L-12,gy-wr-10]]);s.push(rect(x0+20,dy-10,x0+34,dy-6));
  var wall=[];var wy=gy-6;A(wall,[brickS(4,6,296,wy,RR(R,22,26),RR(R,9,10))]);wall.push([[4,wy],[296,wy]]);
  var pav=[],d=1;for(var y=wy+4;y<196;y+=5){pav.push(d>0?[4,y]:[296,y],d>0?[296,y]:[4,y]);d=-d;}wall.push(pav);for(var x=30;x<296;x+=60)wall.push([[x,wy],[x-10,196]]);
  behind(s,wall,sol);return s;});

S('Dune buggy',['Sand in the Cage','Fat Tyres, No Roof','Over the Crest','Desert Weekend','Roll Bar Sunset'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,168,174),x0=RR(R,58,72),fw=RR(R,17,19),rw=RR(R,24,27),fxw=x0+20,rxw=x0+RR(R,150,162);
  tyre(s,sol,fxw,gy-fw,fw,1.3);tyre(s,sol,rxw,gy-rw,rw,1.3);
  var tub=[[fxw-24,gy-fw-2],[fxw+6,gy-fw-14],[rxw-34,gy-rw-14],[rxw+20,gy-rw-6],[rxw+26,gy-rw+8],[rxw-30,gy-rw+12],[fxw+10,gy-fw+6]];FS(s,sol,tub);clipIn(s,hatch(RP(fxw-30,gy-60,rxw+30,gy),2.2,-10),tub);
  s.push(arc(fxw,gy-fw,fw+5,fw+5,PI+0.2,TAU-0.2));s.push(arc(rxw,gy-rw,rw+5,rw+5,PI+0.1,TAU-0.1));
  var c0=[fxw+40,gy-fw-12],c1=[rxw-10,gy-rw-12],ch=RR(R,52,60);
  s.push([c0,[c0[0]+18,c0[1]-ch],[c1[0]-6,c1[1]-ch-2],c1]);s.push([[c0[0]+18,c0[1]-ch],[c1[0]-30,c1[1]]]);s.push([[c0[0]+8,c0[1]-ch*0.5],[c1[0]-2,c1[1]-ch*0.5]]);
  var seat=[[c1[0]-40,c1[1]],[c1[0]-36,c1[1]-24],[c1[0]-28,c1[1]-24],[c1[0]-26,c1[1]]];FS(s,sol,seat,1.3,90);
  s.push([[c0[0]+10,c0[1]],[c0[0]+18,c0[1]-14],[c0[0]+6,c0[1]-18]]);s.push(circle(c0[0]+20,c0[1]-14,5));
  s.push(rect(rxw+18,gy-rw-14,rxw+30,gy-rw-6));
  var spray=[];for(var k=0;k<5;k++)spray.push([[rxw+rw,gy-2],[rxw+rw+10+k*6,gy-6-k*4]]);A(s,spray);
  var dun=[],ph=R()*6;for(var x=4;x<=296;x+=4)dun.push([x,gy-30-14*Math.sin(x/70+ph)-6*Math.sin(x/23)]);bg.push(dun);clipIn(bg,[rows(4,296,gy-56,gy,RR(R,3.6,4.4))],dun.concat([[296,gy],[4,gy]]));
  sand(bg,R,gy,RR(R,5,6.5));bg.push([[4,gy],[296,gy]]);var sx=RR(R,40,260);bg.push(sunH([],sx,interpY(dun,sx),RR(R,14,18))[0]);
  behind(s,bg,sol);return sky(s,R,gy-46,sol);});

var BEAR=[[-62,-48],[-44,-64],[-12,-72],[12,-76],[30,-70],[42,-62],[52,-60],[58,-66],[64,-64],[66,-56],[78,-48],[82,-42],[76,-37],[64,-36],[54,-38],[48,-30],[46,-14],[48,0],[34,0],[32,-14],[24,-24],[-18,-24],[-24,-12],[-22,0],[-36,0],[-40,-14],[-48,-22],[-54,-10],[-52,0],[-66,0],[-68,-18],[-70,-36]];
S('Brown bear in a meadow',['Grazing Bear','Hump and Shoulders','Late Summer Clover','Heavy Paws in the Grass','Big Animal, Slow Walk'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,166,172),x=RR(R,130,170),sc=RR(R,1.25,1.4),fx=sgn(R);
  var P=beast(s,sol,BEAR,x,gy,sc,fx,5);var Q=M([[-62,-48],[-44,-64],[-12,-72],[12,-76],[30,-70],[42,-62],[40,-40],[-60,-36]],x,gy,sc,fx);
  clipIn(s,hatch(RP(x-110,gy-110,x+110,gy),RR(R,3.2,3.6),fx*RR(R,20,35)),P);s.push(furT(P,3,3));
  belly(s,P,gy-30*sc,1.6,fx*70);var ear=M([[56,-66],[58,-74],[64,-70]],x,gy,sc,fx);s.push(ear);eye(s,x+66*sc*fx,gy-54*sc,1.6);
  var nose=EP(x+80*sc*fx,gy-43*sc,3,2.4);FS(s,sol,nose,0.8,0);s.push(M([[66,-40],[72,-38]],x,gy,sc,fx));
  [[-30,0],[-60,0],[40,0],[26,0]].forEach(function(c){var cl=M([[c[0]-4,c[1]],[c[0]-3,c[1]+2],[c[0],c[1]],[c[0]+1,c[1]+2],[c[0]+4,c[1]]],x,gy,sc,fx);s.push(cl);});
  for(var i=0;i<RI(R,6,9);i++){var fxp=RR(R,10,290),fy=gy+RR(R,6,24);if(Math.abs(fxp-x)<70)continue;bg.push([[fxp,fy],[fxp,fy-8]]);bg.push(scallop(fxp,fy-10,3,3,5,0.4));}
  bg.push(tufts(4,296,gy,5,R));return outdoor(s,R,bg,sol,gy,RR(R,20,32));});

var SKUNK=[[-34,-10],[-30,-26],[-14,-36],[8,-38],[24,-32],[34,-24],[44,-20],[48,-14],[42,-9],[32,-10],[28,-4],[28,0],[20,0],[18,-6],[-10,-6],[-14,0],[-22,0],[-24,-6]];
S('Skunk',['Striped and Unbothered','Evening Visitor','Tail Up, Fair Warning','Under the Porch Light','Garden Patrol'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,168,174),x=RR(R,140,170),sc=RR(R,1.7,1.85),fx=sgn(R);
  var P=beast(s,sol,SKUNK,x,gy,sc,fx,5);
  var stripe=blob(M([[42,-22],[24,-34],[6,-38],[-14,-34],[-30,-24],[-30,-18],[-14,-26],[6,-29],[22,-26],[36,-18]],x,gy,sc,fx),4);s.push(poly(stripe));
  clipIn(s,hatch(RP(x-120,gy-100,x+120,gy),2,fx*30),P,[stripe]);
  var tail=blob(M([[-30,-16],[-46,-30],[-58,-56],[-50,-80],[-30,-88],[-20,-74],[-30,-62],[-34,-44],[-22,-28]],x,gy,sc,fx),5);SOL(s,sol,tail);
  var ts=blob(M([[-40,-34],[-50,-58],[-42,-78],[-34,-74],[-40,-58],[-34,-38]],x,gy,sc,fx),4);s.push(poly(ts));
  clipIn(s,hatch(RP(x-160,gy-220,x+160,gy),2.2,fx*-40),tail,[ts]);s.push(furT(tail,4,4));
  eye(s,x+36*sc*fx,gy-24*sc,1.4);s.push(M([[30,-28],[32,-33],[36,-30]],x,gy,sc,fx));
  var porch=[];var py=gy-RR(R,70,80);porch.push(comb(4,296,gy-2,py>0?gy-py:60,14));porch.push([[4,py],[296,py]]);porch.push([[4,py+6],[296,py+6]]);
  bg.push(tufts(4,296,gy,4,R));A(bg,porch);return outdoor(s,R,bg,sol,gy,0);});

S('Ram with curled horns',['Horns Like Ammonites','King of the Fell','Wind on the Ridge','Heavy Fleece','Standing His Ground'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,166,172),x=RR(R,130,165),sz=RR(R,42,48),dir=sgn(R);
  var body=sheep(s,sol,x,gy,sz,dir);clipIn(s,[scallopRows(x-sz*1.5,x+sz*1.5,gy-sz*1.8,gy-sz*0.4,6,4)],body);
  var hx=x+dir*sz*1.45,hy=gy-sz*1.35,hc=[hx-dir*sz*0.1,hy-sz*0.25];
  var horn=spiral(hc[0],hc[1],sz*0.1,sz*0.48,1.6,dir>0?PI*0.2:PI*0.8);if(dir<0)horn=horn.map(function(p){return [2*hc[0]-p[0],p[1]];});
  var hornO=spiral(hc[0],hc[1],sz*0.18,sz*0.66,1.6,dir>0?PI*0.2:PI*0.8);if(dir<0)hornO=hornO.map(function(p){return [2*hc[0]-p[0],p[1]];});
  s.push(horn);s.push(hornO);var rib=[],d=1;for(var i=6;i<horn.length;i+=5){if(d>0)rib.push(horn[i],hornO[i]);else rib.push(hornO[i],horn[i]);d=-d;}s.push(rib);
  eye(s,hx+dir*sz*0.15,hy-sz*0.05,1.6);
  var wy=gy-RR(R,18,26);wall(bg,R,4,296,wy,RR(R,14,18),RR(R,10,14));bg.push(tufts(4,296,gy,4,R));
  var rk=[];rocks(rk,[],R,x+dir*70-30,x+dir*70+30,gy+8,10,2);A(s,rk);return outdoor(s,R,bg,sol,gy,RR(R,40,56));});

S('River otter',['Sunning on the Rock','Sleek and Wet','Whiskers Up','Between Dives','Riverbank Lookout'],function(R){
  var s=[],sol=[],bg=[],wy=RR(R,120,128),rx=RR(R,130,170),fx=sgn(R);
  var rock=blob([[rx-80,wy+18],[rx-70,wy-4],[rx-30,wy-14],[rx+30,wy-16],[rx+76,wy-2],[rx+86,wy+18]],5);FS(s,sol,rock);sideShade(s,rock,0.4,2,70);
  var sp=[[rx-74*fx,wy-16],[rx-40*fx,wy-20],[rx-4*fx,wy-24],[rx+26*fx,wy-30],[rx+44*fx,wy-40]];
  var body=tube(curve(sp,6),function(u){return 2+13*Math.sin(Math.min(1,u*1.25)*PI*0.85);});var bP=body.P;SOL(s,sol,bP);
  var hd=[rx+56*fx,wy-48],head=EP(hd[0],hd[1],13,10);SOL(s,sol,head);eye(s,hd[0]+5*fx,hd[1]-3,1.4);
  var nose=EP(hd[0]+13*fx,hd[1]+1,2.5,2);FS(s,sol,nose,0.7,0);for(var w=-1;w<=1;w++)s.push([[hd[0]+12*fx,hd[1]+3],[hd[0]+26*fx,hd[1]+3+w*4]]);
  s.push(arc(hd[0]-8*fx,hd[1]-10,3,3,PI,TAU));clipIn(s,hatch(RP(rx-120,wy-120,rx+120,wy),2,fx*60),bP.concat([]),[]);
  s.push(curve([[rx-30*fx,wy-14],[rx+10*fx,wy-16],[rx+40*fx,wy-30]],5));
  [[rx+30*fx,wy-24],[rx-20*fx,wy-12]].forEach(function(p){s.push([[p[0],p[1]],[p[0]+6*fx,wy-12],[p[0]+12*fx,wy-12]]);});
  var wat=RP(4,wy,296,196);waterIn(bg,R,wat,wy+4,194,RR(R,4.6,5.4));bg.push([[4,wy],[296,wy]]);
  var bank=[];for(var x=4;x<=296;x+=4)bank.push([x,wy-30-6*Math.sin(x/40)]);bg.push(bank);clipIn(bg,[rows(4,296,wy-40,wy,4)],bank.concat([[296,wy],[4,wy]]));
  bg.push(tufts(4,296,interpY(bank,150),6,R));for(var t=0;t<3;t++)treeR(bg,R,RR(R,20,280),wy-30,RR(R,14,18),2.4);return fin(s,R,bg,sol,wy-40);});

S('Dung beetle with its ball',['Rolling Home','Head Down, Legs Up','Small Sisyphus','Star-Guided Path','The Big Push'],function(R){
  var s=[],sol=[],gy=RR(R,166,172),bx=RR(R,90,120),br=RR(R,40,46),fx=sgn(R);if(fx<0)bx=300-bx;
  var ball=EP(bx,gy-br,br,br);SOL(s,sol,ball);s.push(spiral(bx,gy-br,2,br-3,RR(R,7,8),R()*6));sideShade(s,ball,0.35,1.8,fx*-60,fx>0);
  var bc=[bx+fx*(br+44),gy-28],body=EP(bc[0],bc[1],34,20);var Bd=rotateAbout(body,bc[0],bc[1],fx*0.35);SOL(s,sol,Bd);
  s.push(rotateAbout([[bc[0]+fx*6,bc[1]-20],[bc[0]-fx*30,bc[1]+6]],bc[0],bc[1],fx*0.35));clipIn(s,hatch(RP(bc[0]-40,bc[1]-30,bc[0]+40,bc[1]+30),1.2,fx*50),Bd);
  var pr=[bc[0]+fx*36,bc[1]+12],pron=EP(pr[0],pr[1],14,12);FS(s,sol,pron,1.4,fx*-30);
  var hd=[pr[0]+fx*14,pr[1]+12];s.push(zz(0,0,0,0,1)&&[[hd[0]-fx*6,hd[1]-8],[hd[0]+fx*10,hd[1]+4],[hd[0]+fx*4,hd[1]+6],[hd[0]+fx*12,hd[1]+10],[hd[0]-fx*4,hd[1]+8]]);
  var legs=[[[bc[0]-fx*20,bc[1]-6],[bc[0]-fx*40,bc[1]-34],[bx+fx*br*0.7,gy-br*1.5]],[[bc[0]-fx*12,bc[1]+4],[bc[0]-fx*34,bc[1]-8],[bx+fx*br*0.95,gy-br*0.9]],
    [[bc[0]+fx*6,bc[1]+14],[bc[0]-fx*4,gy-8],[bc[0]-fx*16,gy]],[[pr[0],pr[1]+10],[pr[0]+fx*10,gy-6],[pr[0]+fx*22,gy]],[[bc[0]+fx*14,bc[1]+12],[bc[0]+fx*22,gy-4],[bc[0]+fx*30,gy]]];
  legs.forEach(function(L){s.push(spikes(L,1,2.2,1));});
  var sd=[];sand(sd,R,gy+2,RR(R,3.6,4.2));sd.push([[4,gy],[296,gy]]);var trail=[];for(var x=fx>0?4:296;fx>0?x<bx-br:x>bx+br;x+=fx*6)trail.push([[x,gy+3],[x+fx*3,gy+6]]);A(sd,trail);
  var dn=[];for(var xx=4;xx<=296;xx+=4)dn.push([xx,gy-40-10*Math.sin(xx/55)]);sd.push(dn);behind(s,sd,sol);return skyFill(s,gy-3,RR(R,7,8),RR(R,4.4,5),5,sol);});

S('Stick insect on a twig',['Hiding in Plain Sight','Twig Among Twigs','Slow Sway','Six Long Legs','Patience on a Branch'],function(R){
  var s=[],sol=[],a=RR(R,-0.25,0.25),c=[150,100];
  var tw=[[8,RR(R,150,170)],[150,RR(R,96,110)],[292,RR(R,40,60)]];var T=tube(curve(tw,8),function(u){return 5-2*u;});FS(s,sol,T.P);clipIn(s,hatch(RP(4,30,296,180),2.2,-20),T.P);
  var tw2=curve([lerp(tw[0],tw[1],0.6),[110,70],[100,30]],6);var T2=tube(tw2,function(u){return 3-1.5*u;});SOL(s,sol,T2.P);
  [[lerp(tw[1],tw[2],0.6),[230,20]],[[100,40],[70,18]],[lerp(tw[0],tw[1],0.3),[40,190]]].forEach(function(l,k){leafL(s,sol,l[0],l[1],RR(R,10,13),1.8);});
  var tc=curve(tw,8),i0=Math.floor(tc.length*0.32),i1=Math.floor(tc.length*0.72),sp=tc.slice(i0,i1).map(function(p){return [p[0],p[1]-12];});
  var ins=tube(sp,function(u){return 2.6+1.6*Math.sin(u*PI);});FS(s,sol,ins.P,1.2,0);
  var hd=sp[sp.length-1],an=[[hd[0]+40,hd[1]-30],[hd[0]+50,hd[1]-8]];an.forEach(function(e){s.push(quad(hd,[hd[0]+20,hd[1]-20],e,10));});
  [0.12,0.45,0.8].forEach(function(f,k){var p=sp[Math.floor(f*(sp.length-1))];[-1,1].forEach(function(side){var knee=[p[0]+(k-1)*14+side*10,p[1]-side*22-8],foot=[knee[0]+(k-1)*16+side*6,p[1]+side*14+12];s.push([p,knee,foot]);});});
  var bgl=[];for(var x=4;x<=296;x+=RR(R,6,7.5))bgl.push([[x,4],[x,196]]);var bgS=[],d=1;bgl.forEach(function(l){A(bgS,d>0?l:l.slice().reverse());d=-d;});behind(s,[bgS],sol);return s;});

S('Conch shell',['Pink Mouth, Spiral Crown','Listen for the Sea','Washed Up at Dawn','Tide Gift','Spines and Whorls'],function(R){
  var s=[],sol=[],gy=RR(R,170,176),cx=RR(R,130,165),fx=sgn(R),sh=gy-RR(R,94,100),ap=[cx-fx*14,gy-RR(R,166,174)];
  var spire=[[cx-fx*48,sh],ap,[cx+fx*44,sh]];
  var body=blob([[cx-fx*52,sh],[cx-fx*34,sh-24],ap,[cx+fx*30,sh-26],[cx+fx*50,sh],[cx+fx*40,gy-50],[cx+fx*16,gy-14],[cx+fx*6,gy-2],[cx-fx*8,gy-16],[cx-fx*36,gy-46]],6);SOL(s,sol,body);
  for(var k=1;k<=4;k++){var t=k/5,a=lerp(ap,[cx-fx*46,sh],t),b=lerp(ap,[cx+fx*42,sh],t+0.08);s.push(quad(a,[(a[0]+b[0])/2,Math.max(a[1],b[1])+5],b,10));}
  var kn=[];for(var j=0;j<=7;j++){var q=[cx-fx*50+fx*j*94/7,sh+RR(R,-1,1)];kn.push([q[0]-fx*5,q[1]+2],[q[0],q[1]-RR(R,9,13)],[q[0]+fx*5,q[1]+2]);}s.push(kn);
  var lip=blob([[cx+fx*46,sh-6],[cx+fx*78,sh-24],[cx+fx*92,sh+10],[cx+fx*84,gy-36],[cx+fx*50,gy-18],[cx+fx*30,gy-36],[cx+fx*44,sh+20]],5);SOL(s,sol,lip);
  var mouth=lens([cx+fx*48,sh+4],[cx+fx*44,gy-30],9);s.push(poly(mouth));clipIn(s,hatch(RP(cx-130,sh-10,cx+130,gy),1.4,fx*80),mouth);
  clipIn(s,hatch(RP(cx-130,ap[1],cx+130,gy),RR(R,2.4,2.8),fx*-35),body,[lip]);s.push(curve([[cx-fx*30,sh+12],[cx-fx*6,gy-40],[cx+fx*8,gy-12]],5));
  var bg=[];sand(bg,R,gy-2,RR(R,5,6.5));bg.push([[4,gy-50],[296,gy-50]]);bg.push(waterS(R,4,296,gy-46,gy-24,4.6,1));bg.push(wave(4,296,gy-20,2,22,R()*6));
  for(var i=0;i<3;i++){var px=RR(R,20,280);if(Math.abs(px-cx)<110)continue;bg.push(scallop(px,gy+10,5,3,6,0.3));}behind(s,bg,sol);return skyFill(s,gy-52,RR(R,7,8),RR(R,4.4,5),5,sol);});

S('Flying fish',['Gliding the Swell','Wings Over Water','Escape into Air','Blue Water Leap','Fins Like Sails'],function(R){
  var s=[],sol=[],wy=RR(R,138,146),cx=RR(R,130,170),cy=RR(R,70,86),fx=sgn(R),L=RR(R,96,110);
  var body=blob(M([[-50,0],[-30,-9],[10,-12],[40,-8],[54,-2],[40,6],[10,9],[-30,6]],cx,cy,L/100,fx),6);SOL(s,sol,body);
  clipIn(s,hatch(RP(cx-80,cy-20,cx+80,cy),1.4,0),body);s.push(M([[30,-10],[34,0],[30,8]],cx,cy,L/100,fx));eye(s,cx+fx*44*L/100,cy-3,2.2);
  var tail=M([[-50,0],[-74,-22],[-66,-2],[-82,16],[-50,2]],cx,cy,L/100,fx);FS(s,sol,tail,1.4,fx*40);
  [[-1,-1],[1,1]].forEach(function(w,k){var root=M([[16,-4]],cx,cy,L/100,fx)[0],tipw=[root[0]-fx*RR(R,50,64),root[1]+w[0]*RR(R,40,54)],wing=blob([root,[root[0]-fx*20,root[1]+w[0]*30],tipw,[root[0]-fx*44,root[1]+w[0]*12],[root[0]-fx*14,root[1]+w[0]*2]],5);
    SOL(s,sol,wing);var rays=[],d=1;for(var j=0;j<=8;j++){var e=lerp([root[0]-fx*20,root[1]+w[0]*30],tipw,j/8);e=lerp(e,[root[0]-fx*44,root[1]+w[0]*12],j%2?0:0);if(d>0)rays.push(root,e);else rays.push(e,root);d=-d;}clipIn(s,[rays],wing);});
  var bg=[],sea=RP(4,wy,296,196);bg.push([[4,wy],[296,wy]]);waterIn(bg,R,sea,wy+4,194,RR(R,4,5));
  var trail=[];for(var i=0;i<5;i++){var tx=cx-fx*(70+i*22);trail.push(arc(tx,wy,6-i*0.6,2.5,PI,TAU));}A(bg,trail);
  var sw=[];for(var x=4;x<=296;x+=4)sw.push([x,wy-2-3*Math.abs(Math.sin(x/18))]);bg.push(sw);behind(s,bg,sol);return skyFill(s,wy-4,RR(R,7,8),RR(R,4.4,5),5,sol);});

S('Leaping trout',['Rise to the Fly','Arc Above the Pool','Spotted Leap','Evening Hatch','Silver Out of Brown Water'],function(R){
  var s=[],sol=[],wy=RR(R,130,138),cx=RR(R,130,170),fx=sgn(R),sz=RR(R,1.15,1.3);
  var sp=[[cx-fx*58*sz,wy-6],[cx-fx*30*sz,wy-46*sz],[cx+fx*14*sz,wy-62*sz],[cx+fx*54*sz,wy-40*sz]];var c=curve(sp,8);
  var B=tube(c,function(u){return (u<0.1?5+u*60:u>0.85?4+(1-u)*60:11)*sz*0.9;});SOL(s,sol,B.P);
  var tail=[c[0],[c[0][0]-fx*10*sz,c[0][1]+16*sz],[c[0][0]+fx*2,c[0][1]+6],[c[0][0]+fx*14*sz,c[0][1]+18*sz]];FS(s,sol,poly(tail).slice(0,-1),1.3,90);
  var hd=c[c.length-1];eye(s,hd[0]-fx*8*sz,hd[1]-6*sz,2);s.push([[hd[0]-fx*16*sz,hd[1]-12*sz],[hd[0]-fx*20*sz,hd[1]+2*sz],[hd[0]-fx*12*sz,hd[1]+10*sz]]);
  s.push(B.L.slice(4,B.L.length-6).map(function(p,i,arr){var q=B.R[4+i];return lerp(p,q,0.5);}));clipIn(s,hatch(RP(cx-120,wy-100,cx+120,wy+10),2.4,fx*-35),B.L.concat(B.L.map(function(p,i){return lerp(p,B.R[i],0.45);}).reverse()));
  for(var i=0;i<RI(R,9,12);i++){var j=RI(R,10,c.length-14),p=lerp(B.L[j],B.R[j],RR(R,0.5,0.9));s.push(circle(p[0],p[1],2));}
  var fin1=B.R[Math.floor(B.R.length*0.5)];s.push([fin1,[fin1[0]-fx*6,fin1[1]+12],[fin1[0]+fx*8,fin1[1]+4]]);
  var bg=[];var ring=EP(cx-fx*50*sz,wy+2,34,6);bg.push(poly(ring));bg.push(poly(EP(cx-fx*50*sz,wy+2,48,9)));
  for(var d=0;d<7;d++){var a=PI+d*PI/6,o=[cx-fx*50*sz+30*Math.cos(a),wy+4*Math.sin(a)];bg.push([o,[o[0]+8*Math.cos(a),o[1]-10]]);}
  var sea=RP(4,wy,296,196);waterIn(bg,R,sea,wy+6,194,RR(R,4.6,5.4),[EP(cx-fx*50*sz,wy+2,48,9)]);bg.push([[4,wy],[296,wy]]);
  var reeds=[];for(var x=RR(R,6,20);x<300;x+=RR(R,40,70)){if(Math.abs(x-cx)<90)continue;reeds.push(tufts(x-10,x+10,wy,RR(R,26,40),R));}A(bg,reeds);
  var bank=[];for(var xx=4;xx<=296;xx+=4)bank.push([xx,wy-14-5*Math.sin(xx/37)]);bg.push(bank);for(var t=0;t<3;t++)treeR(bg,R,RR(R,20,280),interpY(bank,150),RR(R,14,18),2.4);
  behind(s,bg,sol);return skyFill(s,wy-16,RR(R,7,8),RR(R,4.4,5),5,sol);});

function gullAt(s,sol,x,b,sz,dir){var P=blob(M([[-24,-30],[-6,-34],[14,-36],[22,-44],[30,-46],[36,-40],[30,-34],[24,-26],[10,-14],[-10,-12],[-30,-22]],x,b-24*sz,sz,dir),5);SOL(s,sol,P);
  var wing=blob(M([[-30,-24],[-8,-32],[10,-30],[6,-20],[-14,-18]],x,b-24*sz,sz,dir),4);s.push(poly(wing));
  var tip=M([[-30,-24],[-40,-22],[-24,-18],[-14,-18]],x,b-24*sz,sz,dir);FS(s,sol,tip,1,0);s.push(M([[36,-40],[46,-39],[36,-37]],x,b-24*sz,sz,dir));eye(s,x+dir*28*sz,b-24*sz-41*sz,1.2);
  s.push(M([[2,-14],[2,0],[-2,0]],x,b-24*sz,sz,dir).concat([[x,b]]));s.push(M([[10,-14],[10,0],[14,0]],x,b-24*sz,sz,dir).concat([[x+dir*12*sz,b]]));return P;}
S('Seagull on a post',['Harbour Lookout','One Leg, Then Two','Chips Watch','Salt Wind Sentinel','Grey Back, White Breast'],function(R){
  var s=[],sol=[],wy=RR(R,130,136),px=RR(R,120,180),pw=RR(R,16,19),pt=RR(R,88,96),fx=sgn(R),sz=RR(R,1.15,1.35);
  var post=[[px-pw,196],[px-pw,pt],[px+pw,pt-2],[px+pw,196]];FS(s,sol,post);clipIn(s,[zz(px-pw,px+pw,pt,196,RR(R,3.4,4))],post);s.push(EP(px,pt-1,pw,3));
  var rope=[];for(var k=0;k<4;k++){var y=pt+24+k*5;rope.push([[px-pw-2,y],[px+pw+2,y+3]]);}A(s,rope);s.push(quad([px+pw+2,pt+42],[px+pw+20,pt+70],[px+pw+8,pt+90],12));
  gullAt(s,sol,px+fx*4,pt-1,sz,fx);
  var bg=[],sea=RP(4,wy,296,196);waterIn(bg,R,sea,wy+4,194,RR(R,4.6,5.4));bg.push([[4,wy],[296,wy]]);
  var bw=[[4,wy],[4,wy-8],[RR(R,90,140),wy-8],[RR(R,140,160),wy]];bg.push(bw);var lx=bw[2][0]-6;bg.push(rect(lx-4,wy-30,lx+4,wy-8));bg.push([[lx-6,wy-30],[lx,wy-36],[lx+6,wy-30]]);
  var bx=RR(R,210,270);bg.push([[bx-26,wy-4],[bx+26,wy-4],[bx+18,wy+2],[bx-20,wy+2],[bx-26,wy-4]]);bg.push([[bx,wy-4],[bx,wy-40],[bx+18,wy-8]]);
  behind(s,bg,sol);return skyFill(s,wy-2,RR(R,7,8),RR(R,4.4,5),5,sol);});

S('Pigeon on a ledge',['City Window Sill','Cooing Under the Cornice','Neck Like Oil on Water','Morning Commuter','Stone and Feather'],function(R){
  var s=[],sol=[],ly=RR(R,132,140),fx=sgn(R),x=RR(R,130,170),sz=RR(R,1.6,1.8);
  var ledge=RP(4,ly,296,ly+12);FS(s,sol,ledge);s.push([[4,ly+4],[296,ly+4]]);clipIn(s,hatch(RP(4,ly+12,296,ly+22),1.6,0),RP(4,ly+12,296,ly+22));s.push(RP(4,ly+12,296,ly+22));
  var dent=[];for(var dx=8;dx<296;dx+=10)dent.push([[dx,ly+22],[dx,ly+28],[dx+5,ly+28],[dx+5,ly+22]]);A(s,dent);
  var b=ly,P=blob(M([[-30,-14],[-18,-26],[0,-32],[12,-40],[16,-52],[24,-56],[30,-50],[28,-42],[24,-30],[20,-16],[8,-6],[-14,-6],[-36,-10]],x,b,sz,fx),5);SOL(s,sol,P);
  var neck=blob(M([[12,-40],[16,-52],[26,-50],[26,-38],[18,-34]],x,b,sz,fx),3);s.push(poly(neck));clipIn(s,hatch(RP(x-80,b-120,x+80,b),1.2,fx*60),neck);
  var wing=blob(M([[-30,-14],[-16,-24],[2,-28],[14,-22],[4,-12],[-20,-10]],x,b,sz,fx),4);s.push(poly(wing));s.push(M([[-14,-18],[-8,-12]],x,b,sz,fx));s.push(M([[-4,-22],[2,-14]],x,b,sz,fx));
  clipIn(s,[rows(x-80,x+80,b-30*sz,b-6,2.4)],wing);s.push(M([[30,-50],[36,-48],[30,-46]],x,b,sz,fx));eye(s,x+fx*25*sz,b-51*sz,1.2);
  s.push(M([[-2,-6],[-2,0],[-6,0]],x,b,sz,fx));s.push(M([[6,-6],[6,0],[10,0]],x,b,sz,fx));
  var bg=[];var wx=RR(R,30,60);if(Math.abs(wx-x)<70)wx=x+90;var win2=[];win(win2,wx-24,ly-84,48,74,0);A(bg,win2);bg.push(gothic(wx,ly-84,24,0));
  A(bg,[brickS(4,4,296,ly,RR(R,22,26),RR(R,8.5,10))]);behind(s,bg,sol.concat([RP(wx-24,ly-110,wx+24,ly)]));
  var lower=[];A(lower,[brickS(4,ly+28,296,196,24,9)]);behind(s,lower,sol);return s;});

function quail(s,sol,x,b,sz,dir,adult){var P=blob(M([[-16,-8],[-10,-20],[4,-24],[12,-30],[18,-32],[22,-26],[18,-18],[14,-8],[2,-2],[-12,-3]],x,b,sz,dir),5);SOL(s,sol,P);
  if(adult){s.push(curve(M([[16,-32],[14,-40],[18,-46],[23,-45]],x,b,sz,dir),5));var sc=[];clipIn(s,[scallopRows(x-30*sz,x+30*sz,b-22*sz,b-3,6,4)],P);
    s.push(M([[12,-24],[18,-20],[22,-26]],x,b,sz,dir));}else clipIn(s,hatch(RP(x-20*sz,b-30*sz,x+20*sz,b),2.2,dir*40),P);
  s.push(M([[22,-28],[26,-27],[22,-25]],x,b,sz,dir));eye(s,x+dir*18*sz,b-28*sz,0.9);s.push(M([[2,-2],[2,1],[5,1]],x,b,sz,dir));s.push(M([[-4,-3],[-4,1],[-1,1]],x,b,sz,dir));return P;}
S('Quail family',['Topknots in a Row','Follow Mother','Covey at the Brush','Short Legs, Quick Steps','Morning Parade'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,168,174),fx=sgn(R),x=fx>0?RR(R,190,220):RR(R,80,110);
  quail(s,sol,x,gy,RR(R,2.5,2.7),fx,true);var n=RI(R,3,4);for(var i=0;i<n;i++)quail(s,sol,x-fx*(70+i*RR(R,34,40)),gy+RR(R,-2,4),RR(R,1.3,1.6),fx,false);
  var bush=scallop(fx>0?40:260,gy-26,44,30,9,0.15);bush.pop();bg.push(poly(bush));H(bg,bush,2.2,30);
  bg.push(tufts(4,296,gy,5,R));return outdoor(s,R,bg,sol,gy,RR(R,16,26));});

S('Kookaburra',['Laughing Bird at Dawn','Big Head, Bigger Beak','Gum Tree Perch','Brown Wings, Pale Breast','Waiting for a Lizard'],function(R){
  var s=[],sol=[],fx=sgn(R),x=RR(R,130,170),by=RR(R,124,132),sz=RR(R,1.9,2.1);
  var br=curve([[4,by+RR(R,4,12)],[x,by+2],[296,by-RR(R,10,20)]],8);var B=tube(br,function(u){return 4.5-u;});FS(s,sol,B.P);clipIn(s,hatch(RP(4,by-30,296,by+30),2,-15),B.P);
  var P=blob(M([[-10,0],[-16,-14],[-14,-30],[-4,-40],[8,-48],[20,-50],[28,-44],[30,-34],[22,-24],[14,-10],[6,0]],x,by,sz,fx),5);SOL(s,sol,P);
  var beak=M([[26,-42],[48,-36],[26,-32]],x,by,sz,fx);FS(s,sol,beak,1.2,0);s.push(M([[26,-37],[44,-36]],x,by,sz,fx));
  var stripe=blob(M([[8,-40],[22,-40],[26,-36],[10,-36]],x,by,sz,fx),3);FS(s,sol,stripe,1,0);eye(s,x+fx*18*sz,by-42*sz,1.6);
  var wing=blob(M([[-14,-12],[-14,-30],[-4,-38],[8,-30],[6,-10]],x,by,sz,fx),4);s.push(poly(wing));clipIn(s,hatch(RP(x-80,by-100,x+80,by),1.5,fx*50),wing);
  var cap=blob(M([[2,-44],[12,-50],[24,-50],[22,-44],[10,-42]],x,by,sz,fx),3);FS(s,sol,cap,1.2,90);
  var tail=M([[-14,-6],[-30,12],[-22,14],[-8,0]],x,by,sz,fx);FS(s,sol,tail,0);for(var t=0;t<3;t++)s.push(M([[-16-t*3,4+t*2],[-26+t*2,10]],x,by,sz,fx));
  s.push(M([[-2,0],[0,4]],x,by,sz,fx));s.push(M([[4,0],[6,4]],x,by,sz,fx));
  for(var i=0;i<RI(R,4,6);i++){var t2=RR(R,0.05,0.95),p=br[Math.floor(t2*(br.length-1))];if(Math.abs(p[0]-x)<40)continue;leafL(s,sol,p,[p[0]+RR(R,-14,14),p[1]+RR(R,24,36)],RR(R,4,5),1.4);}
  var bg=[];for(var x2=4;x2<=296;x2+=RR(R,6,7.5))bg.push([[x2,4],[x2,196]]);behind(s,[serp(bg)],sol);return s;});

// ---- batch 14 chunk C: instruments, tools, kitchen, food, toys, furniture, machines ----
// a jar: rounded body with lid band; returns outline
function jarS(s,sol,x,b,w,h,g){var P=[[x-w,b]].concat(arc(x-w+3,b-h+3,3,3,PI,1.5*PI)).concat(arc(x+w-3,b-h+3,3,3,1.5*PI,TAU)).concat([[x+w,b]]);SOL(s,sol,P);var lid=RP(x-w-1,b-h-6,x+w+1,b-h+1);FS(s,sol,lid,g||1.2,90);return P;}
function sideBox(s,sol,x0,y0,x1,y1,d,g){var P=[[x0,y1],[x0,y0],[x0+d,y0-d*0.6],[x1+d,y0-d*0.6],[x1+d,y1-d*0.6],[x1,y1]];SOL(s,sol,P);s.push([[x0,y0],[x1,y0],[x1,y1]]);s.push([[x1,y0],[x1+d,y0-d*0.6]]);H(s,[[x1,y0],[x1+d,y0-d*0.6],[x1+d,y1-d*0.6],[x1,y1]],g||1.6,90);return P;}

S('Lyre',['Strings Between Horns','Song of the Old Halls','Seven Strings','Bard\'s Rest','Wood and Gut'],function(R){
  var s=[],sol=[],ty=RR(R,172,178),cx=RR(R,135,165),w=RR(R,38,44),h=RR(R,128,140),top=ty-h;
  var box=blob([[cx-w*1.15,ty-4],[cx-w*1.25,ty-26],[cx-w*0.8,ty-40],[cx+w*0.8,ty-40],[cx+w*1.25,ty-26],[cx+w*1.15,ty-4]],5);FS(s,sol,box);sideShade(s,box,0.3,1.4,80);
  s.push(spiral(cx,ty-22,1,7,2.2));
  var armL=curve([[cx-w*0.8,ty-38],[cx-w*1.25,ty-80],[cx-w*1.05,top+20],[cx-w*1.3,top]],6),armR=curve([[cx+w*0.8,ty-38],[cx+w*1.25,ty-80],[cx+w*1.05,top+20],[cx+w*1.3,top]],6);
  [armL,armR].forEach(function(a,k){var T=tube(a,function(u){return 6-2.5*u;});FS(s,sol,T.P);clipIn(s,hatch(RP(cx-120,top-10,cx+120,ty),1.5,k?70:-70),T.P,[]);});
  var yb=top+RR(R,22,28),bar=RP(cx-w*1.2,yb-5,cx+w*1.2,yb+3);FS(s,sol,bar,1.2,0);var n=RI(R,7,8),str=[],d=1;
  for(var i=0;i<n;i++){var x=cx-w*0.6+i*w*1.2/(n-1);if(d>0)str.push([x,yb+3],[x,ty-30]);else str.push([x,ty-30],[x,yb+3]);d=-d;}s.push(str);
  var pegs=[];for(var j=0;j<n;j++){var px=cx-w*0.6+j*w*1.2/(n-1);pegs.push([px,yb-5],[px,yb-10],[px,yb-5]);}s.push(pegs);
  var brg=RP(cx-w*0.7,ty-34,cx+w*0.7,ty-29);FS(s,sol,brg,1,0);
  var cloth=[[cx-w*1.6,ty],[cx-w*1.4,ty-6],[cx+w*1.6,ty-6],[cx+w*1.8,ty]];sol.push(cloth);
  onT(s,R,ty,sol);return s;});

S('Ocarina',['Clay Bird Song','Eight Holes','Sweet Potato Flute','Breath and Fingers','Hollow Earth Tune'],function(R){
  var s=[],sol=[],ty=RR(R,158,164),cx=RR(R,130,160),fx=sgn(R),rx=RR(R,62,70),ry=RR(R,30,34),cy=ty-ry-6;
  var body=blob([[cx-fx*rx,cy+4],[cx-fx*rx*0.7,cy-ry*0.9],[cx,cy-ry],[cx+fx*rx*0.7,cy-ry*0.7],[cx+fx*rx*1.05,cy-4],[cx+fx*rx*0.8,cy+ry*0.6],[cx,cy+ry],[cx-fx*rx*0.75,cy+ry*0.7]],6);SOL(s,sol,body);
  var mp=[[cx-fx*rx*0.9,cy-6],[cx-fx*(rx+26),cy-10],[cx-fx*(rx+28),cy+2],[cx-fx*rx*0.92,cy+8]];FS(s,sol,mp);s.push(RP(cx-fx*(rx*0.9)-6,cy-14,cx-fx*rx*0.9+6,cy-8));
  clipIn(s,hatch(RP(cx-120,cy,cx+120,cy+ry+4),1.6,fx*20),body);
  var holes=[[-30,-12],[-14,-18],[2,-20],[18,-18],[34,-14],[-6,4],[12,6],[26,2]];holes.forEach(function(h,k){var hx=cx+fx*h[0]*rx/66,hy=cy+h[1]*ry/32,P=EP(hx,hy,k<5?4.5:3.5,k<5?3.5:2.8);FS(s,sol,P,0.9,0);});
  s.push(arc(cx+fx*rx*0.8,cy-ry*0.2,6,6,0,TAU));s.push(quad([cx+fx*rx*0.86,cy-ry*0.2],[cx+fx*(rx+40),cy-60],[cx+fx*(rx+20),ty-2],16));
  var cup=[[cx+fx*(rx+48)-16,ty],[cx+fx*(rx+48)-18,ty-36],[cx+fx*(rx+48)+18,ty-36],[cx+fx*(rx+48)+16,ty]];if(Math.abs(cup[0][0]-150)<140){FS(s,sol,cup);sideShade(s,cup,0.35,1.6,80);s.push(EP(cup[1][0]+18,ty-36,18,3).concat([]));}
  var sh=EP(cx,ty-2,rx*1.05,5);clipIn(s,[rows(cx-rx*1.1,cx+rx*1.1,ty-6,ty,1.6)],sh,sol);
  onT(s,R,ty,sol);return s;});

S('Hammered dulcimer',['Struck Strings','Trapezoid of Bells','Two Bridges, Many Courses','Folk Hall Evening','Light Hammers'],function(R){
  var s=[],sol=[],fy=RR(R,168,174),top=fy-RR(R,92,100),cx=RR(R,140,160),wt=RR(R,74,82),wb=RR(R,112,122),dh=RR(R,52,58);
  var front=[[cx-wb,top+dh],[cx-wt,top],[cx+wt,top],[cx+wb,top+dh]];var thick=[[cx-wb,top+dh],[cx+wb,top+dh],[cx+wb,top+dh+9],[cx-wb,top+dh+9]];
  FS(s,sol,front);FS(s,sol,thick,1.6,0);
  var str=[],d=1;for(var y=top+4;y<top+dh-2;y+=2.4){var xl=cx-wt-(wb-wt)*(y-top)/dh+3,xr=cx+wt+(wb-wt)*(y-top)/dh-3;if(d>0)str.push([xl,y],[xr,y]);else str.push([xr,y],[xl,y]);d=-d;}
  [0.3,0.68].forEach(function(f){var a=[cx-wt+2*wt*f-(f<0.5?14:-14),top+2],b=[cx-wb+2*wb*f-(f<0.5?18:-18),top+dh-2];var br=[];for(var k=0;k<=14;k++){var p=lerp(a,b,k/14);br.push([p[0]-2,p[1]],[p[0],p[1]-2],[p[0]+2,p[1]]);}s.push(br);});
  [[cx-wt*0.6,top+dh*0.45],[cx+wt*0.6,top+dh*0.45]].forEach(function(c){var ro=scallop(c[0],c[1],9,7,8,0.18);ro.pop();SOL(s,sol,ro);s.push(spiral(c[0],c[1],1,6,2));});
  clipIn(s,[str],front,sol.slice(2));
  [[cx-wb+20,-1],[cx+wb-20,1]].forEach(function(l){var a=[l[0],top+dh+9],b=[l[0]+l[1]*18,fy];FS(s,sol,[[a[0]-4,a[1]],[a[0]+4,a[1]],[b[0]+3,b[1]],[b[0]-3,b[1]]],1.4,90);});
  s.push([[cx-wb+24,fy-30],[cx+wb-24,fy-30]]);
  [[cx-20,top+dh+20],[cx+14,top+dh+24]].forEach(function(h,k){s.push([[h[0],h[1]],[h[0]+(k?40:-40),h[1]-(k?10:-6)]]);FS(s,sol,EP(h[0]+(k?42:-42),h[1]-(k?10:-6),5,3),0.9,0);});
  room2(s,R,fy,sol);return s;});

S('Paint roller and tray',['Half a Wall Done','Second Coat','Fresh Colour, Old Room','Weekend Project','Roll It On'],function(R){
  var s=[],sol=[],fy=RR(R,150,156),split=RR(R,120,180),fx=sgn(R);
  var tx=RR(R,90,150),tray=[[tx-50,fy+30],[tx-36,fy+8],[tx+36,fy+8],[tx+56,fy+30]];FS(s,sol,tray);var well=[[tx+6,fy+12],[tx+34,fy+12],[tx+50,fy+28],[tx+10,fy+28]];FS(s,sol,well,1.2,0);
  var ribs=[];for(var r=0;r<5;r++){var a=lerp([tx-34,fy+12],[tx-46,fy+27],r/4);ribs.push([a,[a[0]+36+r*1.5,a[1]]]);}ribs.forEach(function(l){s.push(l);});
  var rc=[tx+70,fy-20],rl=RR(R,34,40);var cyl=RP(rc[0]-rl/2,rc[1]-9,rc[0]+rl/2,rc[1]+9);FS(s,sol,cyl);clipIn(s,[zz(rc[0]-rl/2,rc[0]+rl/2,rc[1]-9,rc[1]+9,2.2)],cyl);
  s.push([[rc[0]+rl/2,rc[1]],[rc[0]+rl/2+8,rc[1]],[rc[0]+rl/2+8,rc[1]+20],[rc[0]+6,rc[1]+34],[rc[0]-20,fy+40]]);var hd=tube([[rc[0]-4,fy+30],[rc[0]-26,fy+44]],function(){return 4;});FS(s,sol,hd.P,1.2,0);
  var can=[[tx+130,fy+36],[tx+130,fy-10],[tx+170,fy-10],[tx+170,fy+36]];if(can[3][0]<292){FS(s,sol,can);s.push(EP(tx+150,fy-10,20,4));clipIn(s,[rows(tx+130,tx+170,fy+2,fy+20,2)],RP(tx+130,fy+2,tx+170,fy+20));s.push(arc(tx+150,fy-10,20,24,PI,TAU));}
  var drips=[];for(var dx=split-6;dx<split+6;dx+=4)drips.push([[dx,4],[dx,fy-2]]);
  var bg=[],wp=fx>0?RP(4,4,split,fy-2):RP(split,4,296,fy-2);H(bg,wp,RR(R,2.2,2.6),0);var edge=[];for(var y=4;y<fy;y+=6)edge.push([split+RR(R,-3,3),y]);bg.push(edge);
  bg.push([[4,fy],[296,fy]]);var cloth=[],d=1;for(var y2=fy+6;y2<196;y2+=RR(R,6,8)){var w=wave(4,296,y2,1.4,RR(R,30,50),R()*6);if(d<0)w.reverse();A(cloth,w);d=-d;}bg.push(cloth);
  bg.push([[4,fy-8],[296,fy-8]]);behind(s,bg,sol);return s;});

S('Rake and leaf pile',['October Chore','Leaves Waiting for a Jump','Fan of Tines','Raked Before the Rain','Garden Gold'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,168,174),px=RR(R,90,200),pw=RR(R,62,74),ph=RR(R,34,40);
  var pile=blob([[px-pw,gy],[px-pw*0.7,gy-ph*0.7],[px-pw*0.2,gy-ph],[px+pw*0.3,gy-ph*0.95],[px+pw*0.8,gy-ph*0.5],[px+pw,gy]],6);SOL(s,sol,pile);
  var lv=[];for(var i=0;i<RI(R,14,18);i++){var lx=RR(R,px-pw*0.8,px+pw*0.8),ly=interpY(pile.filter(function(p){return p[1]<gy-1;}).sort(function(a,b){return a[0]-b[0];}),lx)+RR(R,4,ph*0.8);if(ly>gy-3)continue;lv.push(leafStar(lx,ly,RR(R,5,7),R()*6));}
  lv.forEach(function(L){s.push(poly(L));});clipIn(s,hatch(RP(px-pw,gy-ph,px+pw,gy),2.6,RR(R,20,50)),pile,lv);
  var rx=px+(px<150?1:-1)*(pw+RR(R,30,40)),rt=[rx+(px<150?1:-1)*RR(R,30,40),gy-RR(R,140,150)],head=[rx,gy-4];
  var hdl=tube([head,rt],function(){return 2.2;});FS(s,sol,hdl.P,0);
  var fan=[],n=14,d=1;for(var k=0;k<=n;k++){var a=-PI/2+(k/n-0.5)*1.4,tip=[head[0]+Math.cos(a)*30,head[1]+8+Math.sin(a)*-4];var base=lerp(head,[head[0]+(rt[0]-head[0])*0.12,head[1]+(rt[1]-head[1])*0.12],1);var t2=[head[0]+(k/n-0.5)*56,gy];if(d>0)fan.push(base,t2);else fan.push(t2,base);d=-d;}s.push(fan);s.push([[head[0]-28,gy],[head[0]+28,gy]]);
  for(var j=0;j<RI(R,5,8);j++){var fx2=RR(R,10,290);if(Math.abs(fx2-px)<pw+10)continue;var L2=leafStar(fx2,gy+RR(R,6,20),RR(R,4,6),R()*6);bg.push(poly(L2));}
  var tx=px<150?RR(R,250,280):RR(R,20,50),trunk=[[tx-10,gy],[tx-7,4],[tx+7,4],[tx+10,gy]];FS(s,sol,trunk);clipIn(s,[zz(tx-10,tx+10,4,gy,3.2)],trunk);
  bg.push(comb(4,296,gy-2,30,10));bg.push([[4,gy-24],[296,gy-24]]);bg.push(tufts(4,296,gy,4,R));return outdoor(s,R,bg,sol,gy,0);});

S('Garden trowel and seedlings',['Potting Bench, April','Twelve Small Starts','Dirt Under the Nails','Ready to Plant Out','Seed Tray Morning'],function(R){
  var s=[],sol=[],ty=RR(R,150,156),tx0=RR(R,30,50),cols=4,rowsN=3,cw=RR(R,22,24),ch=12;
  var tw=cols*cw,tray=[[tx0,ty],[tx0+16,ty-rowsN*ch],[tx0+16+tw,ty-rowsN*ch],[tx0+tw,ty]];FS(s,sol,tray);var front=RP(tx0,ty,tx0+tw,ty+10);FS(s,sol,front,1.8,90);
  var grid=[];for(var r=1;r<rowsN;r++){var y=ty-r*ch;grid.push([[tx0+16*r/rowsN,y],[tx0+16*r/rowsN+tw,y]]);}for(var c=1;c<cols;c++)grid.push([[tx0+c*cw,ty],[tx0+16+c*cw,ty-rowsN*ch]]);A(s,grid);
  for(var r2=0;r2<rowsN;r2++)for(var c2=0;c2<cols;c2++){var cx=tx0+c2*cw+cw/2+16*(r2+0.5)/rowsN,cy=ty-r2*ch-ch*0.4,h=RR(R,8,16);s.push([[cx,cy],[cx,cy-h]]);s.push([[cx,cy-h],[cx-6,cy-h-4],[cx-2,cy-h+1],[cx,cy-h],[cx+6,cy-h-5],[cx+2,cy-h+1],[cx,cy-h]]);}
  var px=tx0+tw+RR(R,50,60),pot=[[px-18,ty],[px-24,ty-34],[px+24,ty-34],[px+18,ty]];FS(s,sol,pot);sideShade(s,pot,0.35,1.6,80);FS(s,sol,RP(px-26,ty-42,px+26,ty-34),1.6,90);
  for(var l=0;l<5;l++){var a=-PI/2+(l-2)*0.45;leafL(s,sol,[px,ty-42],[px+Math.cos(a)*40,ty-42+Math.sin(a)*34],RR(R,6,8),1.6);}
  var t0=[px+RR(R,40,50),ty-6],ang=RR(R,-0.25,-0.1),blade=lens(t0,[t0[0]+64,t0[1]+ang*64],15);var B=rotateAbout(blade,t0[0],t0[1],0);FS(s,sol,B);s.push([t0,[t0[0]+56,t0[1]+ang*56]]);sideShade(s,B,0.4,1.4,30,true);
  var hd=tube([[t0[0]+64,t0[1]+ang*64],[t0[0]+112,t0[1]+ang*112]],function(){return 5;});FS(s,sol,hd.P);clipIn(s,[zz(t0[0]+64,t0[0]+114,t0[1]-40,t0[1]+20,4)],hd.P);
  var soil=[];for(var i=0;i<10;i++){var sx=RR(R,tx0,tx0+tw+40);soil.push([[sx,ty+12],[sx+2,ty+10]]);}A(s,soil);
  onT(s,R,ty,sol);return s;});

S('Broom and dustpan',['Sweeping Up','Corner of the Kitchen','Straw and Tin','Last Crumbs','Tidy by Noon'],function(R){
  var s=[],sol=[],fy=RR(R,160,166),bx=RR(R,170,210),fx=sgn(R);
  var top=[bx+fx*30,RR(R,14,22)],foot=[bx,fy-48];var st=tube([foot,top],function(){return 2.6;});FS(s,sol,st.P,0);
  var bind=[[foot[0]-14,fy-48],[foot[0]+14,fy-48],[foot[0]+16,fy-36],[foot[0]-16,fy-36]];FS(s,sol,bind);s.push([[foot[0]-15,fy-42],[foot[0]+15,fy-42]]);
  var brush=[[foot[0]-16,fy-36],[foot[0]+16,fy-36],[foot[0]+32,fy],[foot[0]-30,fy]];SOL(s,sol,brush);clipIn(s,[zz(foot[0]-34,foot[0]+34,fy-36,fy,1.4)].map(function(z){return z.map(function(p){return [p[0]+(p[1]-fy+36)*((p[0]-foot[0])/40),p[1]];});}),brush);
  var dx=bx-fx*RR(R,90,110),pan=[[dx-28,fy],[dx-24,fy-22],[dx+24,fy-22],[dx+30,fy]];FS(s,sol,pan);clipIn(s,[rows(dx-30,dx+30,fy-20,fy,1.8)],[[dx-24,fy-20],[dx+24,fy-20],[dx+20,fy-8],[dx-20,fy-8]]);
  var ph=tube([[dx,fy-22],[dx-fx*8,fy-58]],function(){return 3;});FS(s,sol,ph.P,1,0);s.push(circle(dx-fx*8,fy-62,3));
  var bk=[dx+fx*RR(R,150,170),fy];if(bk[0]>40&&bk[0]<260){var bu=[[bk[0]-24,fy],[bk[0]-28,fy-44],[bk[0]+28,fy-44],[bk[0]+24,fy]];FS(s,sol,bu);sideShade(s,bu,0.4,1.4,85);s.push(EP(bk[0],fy-44,28,5));s.push(arc(bk[0],fy-44,28,30,PI,TAU));}var dust=[];for(var i=0;i<14;i++){var px=RR(R,dx+30,foot[0]-30),py=fy+RR(R,4,14);dust.push([[px,py],[px+1.5,py+1]]);}A(s,dust);
  room2(s,R,fy,sol);return s;});

S('Bento box',['Lunch in Compartments','Rice, Egg, Greens','Packed at Dawn','Chopsticks Waiting','Tidy Little Feast'],function(R){
  var s=[],sol=[],ty=RR(R,162,168),x0=RR(R,48,60),x1=x0+RR(R,170,184),y0=ty-RR(R,86,94),dp=12;
  var box=[[x0,ty],[x0,y0],[x0+dp,y0-dp],[x1+dp,y0-dp],[x1+dp,ty-dp],[x1,ty]];SOL(s,sol,box);s.push([[x0,y0],[x1,y0],[x1,ty]]);s.push([[x1,y0],[x1+dp,y0-dp]]);H(s,[[x1,y0],[x1+dp,y0-dp],[x1+dp,ty-dp],[x1,ty]],1.4,90);
  var inn=RP(x0+5,y0+5,x1-5,ty-5);s.push(poly(inn));var mx=x0+(x1-x0)*0.48,my=y0+(ty-y0)*0.5;s.push([[mx,y0+5],[mx,ty-5]]);s.push([[mx,my],[x1-5,my]]);
  var rice=RP(x0+6,y0+6,mx-1,ty-6);clipIn(s,[scallopRows(x0+6,mx,y0+8,ty-6,6,4)],rice);var ume=EP((x0+mx)/2,(y0+ty)/2,8,8);FS(s,sol,ume,1,30);
  for(var k=0;k<3;k++){var ex=mx+10+k*20,P=RP(ex,y0+12,ex+16,my-6);FS(s,sol,P);s.push(spiral(ex+8,(y0+12+my-6)/2,1,6,1.6));}
  for(var j=0;j<RI(R,3,4);j++){var bxp=mx+18+j*24,byp=my+22,br=scallop(bxp,byp,10,8,7,0.2);br.pop();SOL(s,sol,br);H(s,br,1.6,40);s.push([[bxp,byp+8],[bxp,ty-6]]);}
  var cs=[[x0-6,ty+14],[x1+20,ty+4]];[0,7].forEach(function(o){var t=tube([[cs[0][0],cs[0][1]+o],[cs[1][0],cs[1][1]+o]],function(u){return 2.2-u;});FS(s,sol,t.P,0);});
  var cloth=[[x0-20,ty+24],[x0-10,ty-10],[x1+30,ty-10],[x1+40,ty+24]];sol.push(cloth);
  onT(s,R,ty,sol);return s;});

S('Spice rack',['Twelve Small Jars','Cumin to Cardamom','Kitchen Wall','Pinch of Everything','Labels Facing Out'],function(R){
  var s=[],sol=[],x0=RR(R,40,60),x1=300-x0,sh=[RR(R,74,80),RR(R,128,134)],jw=RR(R,15,17),jh=RR(R,34,38);
  var frame=[[x0,sh[1]+10],[x0,sh[0]-jh-22],[x1,sh[0]-jh-22],[x1,sh[1]+10]];s.push(frame);
  sh.forEach(function(y){var P=RP(x0,y,x1,y+7);FS(s,sol,P,1.6,0);s.push([[x0,y-14],[x1,y-14]]);var n=Math.floor((x1-x0-10)/(jw*2+6));
    for(var i=0;i<n;i++){var x=x0+8+jw+i*(jw*2+6);var J=jarS(s,sol,x,y,jw,jh);var lab=RP(x-jw+2,y-jh*0.6,x+jw-2,y-jh*0.25);s.push(poly(lab));var lvl=y-jh*RR(R,0.15,0.5);if(R()<0.5)clipIn(s,[rows(x-jw,x+jw,lvl,y-1,1.6)],J,[lab]);else clipIn(s,hatch(RP(x-jw,lvl,x+jw,y),1.4,45),J,[lab]);}});
  var hk=[x1-20,sh[1]+10];s.push([hk,[hk[0],hk[1]+16]]);var sp=[[hk[0],hk[1]+16],[hk[0]-6,hk[1]+40]];s.push(sp);for(var l=0;l<5;l++){var p=lerp(sp[0],sp[1],l/5);leafL(s,sol,p,[p[0]+(l%2?10:-10),p[1]+6],3,0);}
  var bg=[];H(bg,RP(4,4,296,196),RR(R,6.5,7.5),90);behind(s,bg,sol.concat([frame.concat([[x0,sh[1]+10]])]));return s;});

S('Pitcher of lemonade',['Ice and Lemon Wheels','Porch Pitcher','Hot Afternoon Cure','Pour Me One','Sweating Glass'],function(R){
  var s=[],sol=[],ty=RR(R,164,170),px=RR(R,120,150),pw=RR(R,32,36),ph=RR(R,98,106),top=ty-ph;
  var P=[[px-pw,ty],[px-pw-4,top+20],[px-pw+2,top],[px+pw-6,top],[px+pw+12,top-8],[px+pw+2,top+18],[px+pw+4,ty]];SOL(s,sol,P);
  s.push(curve([[px-pw-4,top+20],[px-pw-26,top+30],[px-pw-26,top+70],[px-pw-2,top+76]],6));
  var lvl=top+RR(R,22,28),liq=[[px-pw,ty],[px-pw-3,lvl],[px+pw+3,lvl],[px+pw+4,ty]];s.push([[px-pw-3,lvl],[px+pw+3,lvl]]);
  var items=[];for(var i=0;i<3;i++){var c=[px+RR(R,-pw*0.5,pw*0.5),lvl+18+i*24],r=RR(R,10,12),L=EP(c[0],c[1],r,r);items.push(L);s.push(poly(L));s.push(circle(c[0],c[1],r*0.75));var sp=[];for(var k=0;k<8;k++){var a=k*PI/4;sp.push(c,[c[0]+r*0.75*Math.cos(a),c[1]+r*0.75*Math.sin(a)]);}s.push(sp);}
  for(var j=0;j<3;j++){var c2=[px+RR(R,-pw*0.6,pw*0.6),lvl+6+j*26],q=rotateAbout(RP(c2[0]-6,c2[1]-6,c2[0]+6,c2[1]+6),c2[0],c2[1],R());items.push(q);s.push(poly(q));}
  clipIn(s,[rows(px-pw-6,px+pw+6,lvl+3,ty-1,2.6)],liq,items);
  [px+pw+RR(R,40,50),px-pw-RR(R,64,72)].forEach(function(gx,k){var g=[[gx-14,ty],[gx-17,ty-46],[gx+17,ty-46],[gx+14,ty]];SOL(s,sol,g);var gl=ty-RR(R,30,36);s.push([[gx-16,gl],[gx+16,gl]]);clipIn(s,[rows(gx-18,gx+18,gl+3,ty-1,2.4)],g);
    if(k===0){var c3=[gx+12,ty-46],sl=EP(c3[0],c3[1],9,9);s.push(poly(sl));s.push(circle(c3[0],c3[1],6.5));}});
  var lx=RR(R,240,270);var lem=EP(lx,ty-12,16,11);FS(s,sol,lem);sideShade(s,lem,0.3,1.4,80);
  onT(s,R,ty,sol);return s;});

S('Milk bottles in a crate',['Doorstep, Six A.M.','Wire Crate, Glass Bottles','Delivered Before Dawn','Gold Tops','On the Step'],function(R){
  var s=[],sol=[],gy=RR(R,166,172),cx=RR(R,130,170),n=3,bw=RR(R,17,19),bh=RR(R,66,72),cw=n*bw*2+20;
  var crate=RP(cx-cw/2,gy-34,cx+cw/2,gy);
  for(var i=0;i<n;i++){var x=cx-cw/2+10+bw+i*(bw*2+4)+6,b=gy-2,P=[[x-bw,b],[x-bw,b-bh*0.55]].concat(cubic([x-bw,b-bh*0.55],[x-bw,b-bh*0.75],[x-bw*0.45,b-bh*0.78],[x-bw*0.45,b-bh*0.9],8).slice(1)).concat([[x-bw*0.45,b-bh],[x+bw*0.45,b-bh]]).concat(cubic([x+bw*0.45,b-bh*0.9],[x+bw*0.45,b-bh*0.78],[x+bw,b-bh*0.75],[x+bw,b-bh*0.55],8)).concat([[x+bw,b]]);
    SOL(s,sol,P);var cap=RP(x-bw*0.5,b-bh-5,x+bw*0.5,b-bh+2);FS(s,sol,cap,1,90);clipIn(s,hatch(RP(x-bw,b-bh,x+bw,b-bh*0.62),1.4,45),P);s.push([[x-bw,b-bh*0.62],[x+bw,b-bh*0.62]]);
    s.push([[x+bw*0.5,b-bh*0.5],[x+bw*0.5,b-bh*0.15]]);}
  for(var j=0;j<n;j++){var bx=cx-cw/2+18+bw+j*(bw*2+4)+18;s.push([[bx-bw*0.45,gy-bh-8],[bx-bw*0.45,gy-bh+4]]);s.push([[bx+bw*0.45,gy-bh-8],[bx+bw*0.45,gy-bh+4]]);FS(s,sol,RP(bx-bw*0.5,gy-bh-13,bx+bw*0.5,gy-bh-7),1,90);}
  var wires=[];for(var x2=crate[0][0];x2<=crate[1][0]+0.1;x2+=8)wires.push([[x2,gy-34],[x2,gy]]);wires.push([[crate[0][0],gy-17],[crate[1][0],gy-17]]);behind(s,wires,sol);s.push(poly(crate));
  var hd=[[cx-cw/2+10,gy-34],[cx-cw/2+10,gy-bh-24],[cx+cw/2-10,gy-bh-24],[cx+cw/2-10,gy-34]];behind(s,[hd],sol);
  var bg=[],dx=cx+(cx<150?1:-1)*RR(R,60,80),door=RP(dx-34,10,dx+34,gy-14);bg.push(poly(door));bg.push(rect(dx-26,20,dx+26,60));bg.push(rect(dx-26,70,dx+26,gy-24));bg.push(circle(dx+24,95,3));
  var step=RP(dx-60,gy-14,dx+60,gy);bg.push(poly(step));H(bg,RP(dx-60,gy-6,dx+60,gy),1.6,0);bg.push(brickS(4,6,296,gy-14,24,9));bg.push([[4,gy],[296,gy]]);sand(bg,R,gy+4,6);
  behind(s,bg,sol.concat([door]));return s;});

S('Hamburger on a plate',['Stacked High','Sesame and Char','Lunch Counter Special','With Fries','Everything On It'],function(R){
  var s=[],sol=[],ty=RR(R,166,172),cx=RR(R,120,160),w=RR(R,56,62),py=ty-10;
  var plate=EP(cx+20,py,w*1.9,14);SOL(s,sol,plate);s.push(EP(cx+20,py,w*1.5,10));
  var b0=py-4,bb=[[cx-w,b0-4],[cx-w+4,b0-16],[cx+w-4,b0-16],[cx+w,b0-4],[cx+w-6,b0],[cx-w+6,b0]];FS(s,sol,bb);
  var pt=b0-16,pat=blob([[cx-w-2,pt],[cx-w,pt-14],[cx+w,pt-14],[cx+w+2,pt],[cx,pt+2]],4);FS(s,sol,pat);clipIn(s,[zz(cx-w-4,cx+w+4,pt-14,pt+2,2)],pat);
  var ch=[[cx-w-4,pt-14],[cx+w+4,pt-14],[cx+w-2,pt-8],[cx+w-12,pt-14]];var drips=[[cx-w-4,pt-14]];for(var x=cx-w;x<cx+w;x+=16)drips.push([x+4,pt-14],[x+8,pt-6],[x+12,pt-14]);drips.push([cx+w+4,pt-14]);s.push(drips);
  var tom=RP(cx-w+2,pt-22,cx+w-2,pt-15);FS(s,sol,tom,1.3,0);
  var let=[];for(var x2=cx-w-8;x2<=cx+w+8;x2+=3)let.push([x2,pt-24+2.6*Math.sin(x2*0.9)+(Math.abs(x2-cx)>w?2:0)]);s.push(let);
  var tt=pt-24,top=[[cx-w-2,tt]].concat(cubic([cx-w-2,tt],[cx-w,tt-44],[cx+w,tt-44],[cx+w+2,tt],20).slice(1)).concat([[cx-w-2,tt]]);SOL(s,sol,top);sideShade(s,top,0.25,1.4,80);
  for(var i=0;i<RI(R,10,14);i++){var sx=RR(R,cx-w*0.75,cx+w*0.6),sy=interpY(top.slice(0,21),sx)+RR(R,5,20);if(sy>tt-4)continue;s.push(lens([sx-2,sy],[sx+2,sy-1],1));}
  var fx0=cx+w+RR(R,16,22);for(var f=0;f<RI(R,6,8);f++){var a=RR(R,-0.5,0.5),fx1=fx0+f*7,P=rotateAbout(RP(fx1-2.5,py-50,fx1+2.5,py-4),fx1,py-4,a);FS(s,sol,P,f%2?1.4:0,90);}
  var cup=RP(fx0-4,py-30,fx0+52,py-4);s.push([[fx0-4,py-30],[fx0+2,py-4],[fx0+46,py-4],[fx0+52,py-30]]);
  onT(s,R,ty,sol);return s;});

S('Snow globe',['Winter in a Ball','Shake It Again','Cottage Under Glass','Little Blizzard','Keepsake on the Shelf'],function(R){
  var s=[],sol=[],ty=RR(R,168,174),cx=RR(R,135,165),r=RR(R,58,64),gb=ty-26,gc=[cx,gb-r*0.82];
  var base=[[cx-r*0.85,ty],[cx-r*0.7,gb],[cx+r*0.7,gb],[cx+r*0.85,ty]];FS(s,sol,base);clipIn(s,[zz(cx-r,cx+r,gb,ty,2.6)],base);s.push(EP(cx,gb,r*0.7,4));
  var ball=EP(gc[0],gc[1],r,r);SOL(s,sol,ball);var fl=gb-8,hillP=[];for(var x=cx-r*0.68;x<=cx+r*0.68;x+=4)hillP.push([x,fl-6*Math.sin((x-cx)/r*PI+0.4)]);s.push(hillP);
  var hx=cx-r*0.15,house=[[hx-16,fl-4],[hx-16,fl-24],[hx,fl-38],[hx+16,fl-24],[hx+16,fl-4]];FS(s,sol,house);s.push(rect(hx-4,fl-16,hx+4,fl-4));clipIn(s,[zz(hx-16,hx+16,fl-38,fl-24,2.6)],house);
  s.push(rect(hx+6,fl-36,hx+10,fl-28));pineT(s,cx+r*0.38,fl-4,0.95,2);
  var flakes=[];for(var i=0;i<RI(R,9,12);i++){var a=R()*TAU,d=RR(R,0.2,0.85)*r,p=[gc[0]+Math.cos(a)*d,gc[1]-Math.abs(Math.sin(a))*d*0.9];if(p[1]>fl-40&&Math.abs(p[0]-hx)<24)continue;flakes.push([[p[0]-2,p[1]],[p[0]+2,p[1]],[p[0],p[1]],[p[0],p[1]-2],[p[0],p[1]+2],[p[0],p[1]]]);}A(s,flakes);
  s.push(arc(gc[0],gc[1],r*0.82,r*0.82,PI*1.15,PI*1.45));s.push(arc(gc[0],gc[1],r*0.72,r*0.72,PI*1.2,PI*1.35));
  onT(s,R,ty,sol);return s;});

S('Seesaw in a park',['Up and Down','Balance Point','Empty Playground, Sunday','Painted Plank','Wait for a Friend'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,168,174),cx=RR(R,130,170),L=RR(R,110,124),tilt=RR(R,0.16,0.24)*sgn(R),pv=[cx,gy-26];
  var piv=[[cx-16,gy],[cx-6,gy-26],[cx+6,gy-26],[cx+16,gy]];FS(s,sol,piv);clipIn(s,[zz(cx-16,cx+16,gy-26,gy,3)],piv);
  var plank=rotateAbout(RP(cx-L,pv[1]-7,cx+L,pv[1]),cx,pv[1],tilt);FS(s,sol,plank);clipIn(s,[rotateAbout(zz(cx-L,cx+L,pv[1]-7,pv[1],4),cx,pv[1],tilt)],plank);
  [-1,1].forEach(function(d){var e=rotateAbout([[cx+d*(L-22),pv[1]-7],[cx+d*(L-22),pv[1]-26],[cx+d*(L-30),pv[1]-26]],cx,pv[1],tilt);s.push(e);var seat=rotateAbout(RP(cx+d*(L-14)-10,pv[1]-11,cx+d*(L-14)+10,pv[1]-7),cx,pv[1],tilt);FS(s,sol,seat,1.2,0);
    var end=rotateAbout([[cx+d*L,pv[1]]],cx,pv[1],tilt)[0];if(end[1]<gy-4){var tyre2=EP(end[0],gy-5,10,5);s.push(poly(tyre2));}});
  var bx=cx+(cx<150?1:-1)*RR(R,100,116),bench=[];bench.push([[bx-26,gy-18],[bx+26,gy-18]]);bench.push([[bx-26,gy-24],[bx+26,gy-24]]);bench.push([[bx-26,gy-34],[bx+26,gy-34]]);bench.push([[bx-22,gy],[bx-22,gy-34]]);bench.push([[bx+22,gy],[bx+22,gy-34]]);A(s,bench);
  treeR(bg,R,cx-(cx<150?1:-1)*RR(R,100,116),gy,RR(R,22,26),2.2);bg.push(tufts(4,296,gy,4,R));var sb=EP(cx,gy+12,L*0.9,8);bg.push(poly(sb));
  return outdoor(s,R,bg,sol,gy,RR(R,14,24));});

S('Trestle table with benches',['Supper Under the Lights','Long Table, Late Summer','Room for Everyone','Harvest Table','Bench Seats for Twelve'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,174,180),x0=RR(R,40,54),x1=300-x0,ty=gy-RR(R,62,68),dp=RR(R,22,26);
  var top=[[x0,ty],[x0+dp,ty-dp*0.6],[x1-dp*0.2,ty-dp*0.6],[x1,ty]];FS(s,sol,top);clipIn(s,[rows(x0,x1,ty-dp*0.6,ty,3.4)],top);var edge=RP(x0,ty,x1,ty+6);FS(s,sol,edge,1.6,0);
  [x0+30,x1-30].forEach(function(lx){s.push([[lx-20,gy],[lx+16,ty+6]]);s.push([[lx+20,gy],[lx-16,ty+6]]);s.push([[lx-24,gy],[lx+24,gy]]);});s.push([[x0+30,gy-26],[x1-30,gy-26]]);
  var bnY=gy-RR(R,26,30),bench=RP(x0-10,bnY,x1+10,bnY+5);FS(s,sol,bench,1.4,0);[x0+4,x1-4].forEach(function(lx){s.push([[lx-8,gy],[lx,bnY+5],[lx+8,gy]]);});
  var items=[];for(var i=0;i<RI(R,4,6);i++){var ix=x0+30+i*(x1-x0-60)/5,P=[[ix-6,ty-2],[ix-7,ty-18],[ix+7,ty-18],[ix+6,ty-2]];FS(s,sol,P);if(i%2)clipIn(s,[rows(ix-7,ix+7,ty-12,ty-2,1.6)],P);}
  var plates=[];for(var j=0;j<4;j++){var pxp=x0+50+j*(x1-x0-80)/3;s.push(EP(pxp,ty-6,12,2.4));}
  var lt=[[4,30],[296,34]];bg.push(flagLine([4,26],[296,30],RR(R,22,30),12,4));
  [16,284].forEach(function(px){bg.push([[px,gy],[px,24]]);});treeR(bg,R,RR(R,250,280),gy-40,RR(R,22,26),2.4);bg.push(tufts(4,296,gy,4,R));return outdoor(s,R,bg,sol,gy,RR(R,10,18));});

S('Vending machine',['Make a Selection','Coins in the Slot','Corridor Glow','Row C, Number Four','Something Cold'],function(R){
  var s=[],sol=[],fy=RR(R,176,182),x0=RR(R,80,110),w=RR(R,96,104),x1=x0+w,top=RR(R,12,18);
  var body=RP(x0,top,x1,fy);sideBox(s,sol,x0,top,x1,fy,14,1.8);var gw=w*0.68,glass=RP(x0+8,top+10,x0+gw,fy-46);s.push(poly(glass));
  var nr=5,rh=(fy-46-top-10)/nr,goods=[];for(var r=0;r<nr;r++){var yb=top+10+(r+1)*rh-3;s.push([[x0+8,yb+2],[x0+gw,yb+2]]);var p=[[x0+10,yb]],cw=(gw-14)/5;
    for(var c=0;c<5;c++){var cx=x0+12+c*cw+cw/2,h=rh*RR(R,0.55,0.75),kind=(r+c)%3;if(kind===0)p.push([cx-cw*0.3,yb],[cx-cw*0.3,yb-h],[cx+cw*0.3,yb-h],[cx+cw*0.3,yb]);else if(kind===1)p.push([cx-cw*0.25,yb],[cx-cw*0.25,yb-h*0.6],[cx-cw*0.1,yb-h],[cx+cw*0.1,yb-h],[cx+cw*0.25,yb-h*0.6],[cx+cw*0.25,yb]);else p.push([cx-cw*0.35,yb],[cx-cw*0.35,yb-h*0.8],[cx+cw*0.35,yb-h*0.8],[cx+cw*0.35,yb]);}
    p.push([x0+gw,yb]);s.push(p);}
  var pk=[x0+gw+6,top+16],pw=x1-pk[0]-6;s.push(rect(pk[0],pk[1],pk[0]+pw,pk[1]+16));H(s,RP(pk[0]+2,pk[1]+2,pk[0]+pw-2,pk[1]+14),1.6,0);
  var keys=[],d=1;for(var kr=0;kr<4;kr++){var ky=pk[1]+26+kr*9;keys.push([[pk[0]+2,ky],[pk[0]+pw-2,ky]]);}A(s,keys);for(var kc=1;kc<3;kc++)s.push([[pk[0]+2+kc*(pw-4)/3,pk[1]+26],[pk[0]+2+kc*(pw-4)/3,pk[1]+53]]);
  s.push(rect(pk[0]+pw*0.3,pk[1]+64,pk[0]+pw*0.7,pk[1]+70));s.push(rect(pk[0]+2,pk[1]+80,pk[0]+pw-2,pk[1]+92));
  var flap=RP(x0+14,fy-36,x0+gw-6,fy-16);FS(s,sol,flap,1.6,0);s.push(rect(x0+8,fy-8,x1-8,fy-2));
  var gl=[];H(gl,[[x0+12,top+14],[x0+40,top+14],[x0+12,top+60]],3,45);A(s,gl.slice(0,3));
  var bin=[[x1+40,fy],[x1+36,fy-44],[x1+70,fy-44],[x1+66,fy]];if(x1+70<292){FS(s,sol,bin);clipIn(s,[zz(x1+36,x1+70,fy-44,fy,3.4)],bin);}
  room2(s,R,fy,sol);return s;});

S('Desk fan',['Oscillating Breeze','Three Blades Behind Wire','Summer Office','Low Hum','Turned Toward You'],function(R){
  var s=[],sol=[],ty=RR(R,168,174),cx=RR(R,130,160),r=RR(R,52,58),cy=ty-r-RR(R,44,50);
  var cage=EP(cx,cy,r,r);SOL(s,sol,cage);s.push(spiral(cx,cy,6,r-2,RR(R,4.5,5.5)));
  var wires=[],d=1;for(var k=0;k<24;k++){var a=k*TAU/24;var e=[cx+r*Math.cos(a),cy+r*Math.sin(a)],b=[cx+7*Math.cos(a),cy+7*Math.sin(a)];if(d>0)wires.push(b,e);else wires.push(e,b);d=-d;}
  var a0=R()*TAU,blades=[];for(var j=0;j<3;j++){var a=a0+j*TAU/3,tip=[cx+(r-8)*Math.cos(a),cy+(r-8)*Math.sin(a)],B=blob([[cx+8*Math.cos(a-0.4),cy+8*Math.sin(a-0.4)],[cx+(r*0.55)*Math.cos(a-0.5),cy+(r*0.55)*Math.sin(a-0.5)],[tip[0],tip[1]],[cx+(r*0.6)*Math.cos(a+0.35),cy+(r*0.6)*Math.sin(a+0.35)],[cx+8*Math.cos(a+0.4),cy+8*Math.sin(a+0.4)]],5);blades.push(B);}
  blades.forEach(function(B){s.push(poly(B));clipIn(s,hatch(RP(cx-r,cy-r,cx+r,cy+r),1.5,RR(R,0,180)),B);});
  var hub=EP(cx,cy,9,9);FS(s,sol,hub,1.2,30);behind(s,[wires],blades.concat([hub]));
  var mot=[[cx-14,cy+r*0.1],[cx-16,cy+r+6],[cx+16,cy+r+6],[cx+14,cy+r*0.1]];behind(s,[mot],[cage]);
  var neck=RP(cx-5,cy+r,cx+5,ty-12);FS(s,sol,neck,1.4,90);var base=[[cx-46,ty],[cx-40,ty-14],[cx+40,ty-14],[cx+46,ty]];FS(s,sol,base);sideShade(s,base,0.35,1.6,80);
  s.push(rect(cx-30,ty-10,cx-20,ty-5));s.push(rect(cx-16,ty-10,cx-6,ty-5));s.push(quad([cx+40,ty-4],[cx+80,ty+6],[cx+120,ty-2],12));
  var pap=[[cx+70,ty],[cx+78,ty-6],[cx+130,ty-6],[cx+136,ty]];if(cx+136<292){FS(s,sol,pap);s.push([[cx+80,ty-3],[cx+126,ty-3]]);}
  onT(s,R,ty,sol);return s;});

S('Fire hydrant',['Corner Sentinel','Iron on the Kerb','Chain and Cap','Painted Every Spring','Summer Spray Waiting'],function(R){
  var s=[],sol=[],gy=RR(R,166,172),cx=RR(R,130,170),w=RR(R,22,25),h=RR(R,92,100),top=gy-h;
  var flange=RP(cx-w-8,gy-10,cx+w+8,gy);FS(s,sol,flange,1.6,0);var body=RP(cx-w,top+24,cx+w,gy-10);SOL(s,sol,body);sideShade(s,body,0.35,1.6,85);
  var ring=RP(cx-w-4,top+20,cx+w+4,top+28);FS(s,sol,ring);var dome=[[cx-w,top+20]].concat(arc(cx,top+20,w,20,PI,TAU)).concat([[cx+w,top+20]]);SOL(s,sol,dome);sideShade(s,dome,0.35,1.6,85);
  var nut=[[cx-6,top+2],[cx-5,top-8],[cx+5,top-8],[cx+6,top+2]];FS(s,sol,nut,1.2,90);
  [-1,1].forEach(function(d){var n0=cx+d*w,ny=top+46,noz=[[n0,ny-10],[n0+d*16,ny-10],[n0+d*16,ny+10],[n0,ny+10]];FS(s,sol,noz);var cap=[[n0+d*16,ny-13],[n0+d*24,ny-13],[n0+d*24,ny+13],[n0+d*16,ny+13]];FS(s,sol,cap,1.3,90);});
  var fr=[[cx-w*0.6,top+62],[cx+w*0.6,top+62],[cx+w*0.6,top+80],[cx-w*0.6,top+80]];FS(s,sol,fr);s.push(EP(cx,top+71,6,6).concat([]));
  var ch=[],cs=[cx+w+20,top+46],ce=[cx+w*0.5,top+70];var cq=quad(cs,[cx+w+14,top+86],ce,14);for(var i=0;i<cq.length;i+=2)ch.push(EP(cq[i][0],cq[i][1],2.4,1.6));ch.forEach(function(c){s.push(poly(c));});
  var bg=[],kerb=gy+8;bg.push([[4,kerb],[296,kerb]]);bg.push([[4,kerb+6],[296,kerb+6]]);H(bg,RP(4,kerb,296,kerb+6),1.6,0);var pv=[];for(var x=20;x<296;x+=40)pv.push([[x,gy-14],[x-6,kerb]]);A(bg,pv);bg.push([[4,gy-14],[296,gy-14]]);
  var road2=[],d2=1;for(var y=kerb+10;y<196;y+=5){road2.push(d2>0?[4,y]:[296,y],d2>0?[296,y]:[4,y]);d2=-d2;}bg.push(road2);
  bg.push(brickS(4,6,296,gy-14,RR(R,22,26),RR(R,9,10)));behind(s,bg,sol);return s;});

S('Reel-to-reel tape recorder',['Quarter-Inch Tape','Two Reels Turning','Studio Afternoon','Rewind and Listen','Needles in the Green'],function(R){
  var s=[],sol=[],ty=RR(R,170,176),x0=RR(R,48,60),x1=300-x0,top=ty-RR(R,118,126);
  var deck=RP(x0,top,x1,ty);sideBox(s,sol,x0,top,x1,ty,10,1.8);s.push([[x0+4,ty-34],[x1-4,ty-34]]);
  var rr=RR(R,30,34),ry=top+rr+10,cs=[[x0+rr+14,ry],[x1-rr-14,ry]];
  cs.forEach(function(c,k){var P=EP(c[0],c[1],rr,rr);SOL(s,sol,P);var fill=RR(R,0.45,0.85)*rr;if(k)fill=rr*1.3-fill;var tp=EP(c[0],c[1],Math.max(10,fill),Math.max(10,fill));s.push(poly(tp));s.push(spiral(c[0],c[1],8,Math.max(10,fill)-1,RR(R,4,6)));
    var hub=EP(c[0],c[1],7,7);FS(s,sol,hub,1,0);for(var h=0;h<3;h++){var a=h*TAU/3+R(),hc=[c[0]+rr*0.62*Math.cos(a),c[1]+rr*0.62*Math.sin(a)];if(Math.hypot(hc[0]-c[0],hc[1]-c[1])>fill+3){s.push(circle(hc[0],hc[1],5));}}});
  var hy=ry+rr+8,hd=RP((x0+x1)/2-22,hy-6,(x0+x1)/2+22,hy+8);FS(s,sol,hd,1.4,0);
  s.push([[cs[0][0],ry+rr],[cs[0][0]+10,hy+10],[(x0+x1)/2-22,hy+8],[(x0+x1)/2+22,hy+8],[cs[1][0]-10,hy+10],[cs[1][0],ry+rr]]);
  [cs[0][0]+20,cs[1][0]-20].forEach(function(gx){s.push(circle(gx,hy+10,3));});
  var my=ty-28;[x0+20,x0+64].forEach(function(mx){var M2=RP(mx,my-2,mx+36,my+20);FS(s,sol,M2);s.push(arc(mx+18,my+22,14,14,-PI*0.85,-PI*0.15));s.push([[mx+18,my+20],[mx+18+12*Math.cos(-PI*RR(R,0.3,0.7)),my+20+12*Math.sin(-PI*RR(R,0.3,0.7))]]);});
  var bts=[];for(var b=0;b<5;b++){var bx=x1-110+b*18;bts.push(RP(bx,my+2,bx+12,my+16));}bts.forEach(function(P,k){FS(s,sol,P,k===2?1:0,0);});
  [x1-150,x1-130].forEach(function(kx){s.push(circle(kx,my+9,6));s.push([[kx,my+9],[kx,my+3]]);});
  onT(s,R,ty,sol);return s;});

// ---- batch 14 master: Watch movement close-up (type 2, close-up, no horizon) ----
function gearP(cx,cy,r,n,th,a0){var p=[];for(var i=0;i<n;i++){var a=a0+i*TAU/n,w=TAU/n;p.push([cx+(r-th)*Math.cos(a),cy+(r-th)*Math.sin(a)],[cx+r*Math.cos(a+w*0.18),cy+r*Math.sin(a+w*0.18)],[cx+r*Math.cos(a+w*0.42),cy+r*Math.sin(a+w*0.42)],[cx+(r-th)*Math.cos(a+w*0.6),cy+(r-th)*Math.sin(a+w*0.6)]);}return p;}
function escP(cx,cy,r,n,a0){var p=[];for(var i=0;i<n;i++){var a=a0+i*TAU/n,w=TAU/n;p.push([cx+r*0.62*Math.cos(a),cy+r*0.62*Math.sin(a)],[cx+r*Math.cos(a+w*0.55),cy+r*Math.sin(a+w*0.55)],[cx+r*0.92*Math.cos(a+w*0.75),cy+r*0.92*Math.sin(a+w*0.75)],[cx+r*0.66*Math.cos(a+w*0.95),cy+r*0.66*Math.sin(a+w*0.95)]);}return p;}
// a wheel with toothed rim, spiral-shaded rim band, curved spokes, pinion
function wheelG(g,cx,cy,r,n,ns,a0,R){var P=gearP(cx,cy,r,n,Math.max(2.2,r*0.07),a0);g.push(poly(P));var ri=r*0.78;g.push(spiral(cx,cy,ri,r-r*0.08-0.6,RR(R,2.2,3),a0));
  if(ns){var hub=r*0.18;for(var k=0;k<ns;k++){var a=a0+k*TAU/ns,b=a+0.35;[-0.09,0.09].forEach(function(o){g.push(quad([cx+hub*Math.cos(a+o*3),cy+hub*Math.sin(a+o*3)],[cx+r*0.5*Math.cos((a+b)/2+o),cy+r*0.5*Math.sin((a+b)/2+o)],[cx+ri*Math.cos(b+o),cy+ri*Math.sin(b+o)],10));});}g.push(circle(cx,cy,hub));}
  else g.push(circle(cx,cy,ri*0.5));g.push(poly(gearP(cx,cy,Math.max(5,r*0.15),8,1.6,a0)));return EP(cx,cy,r,r);}
function jewel(s,cx,cy,r){s.push(circle(cx,cy,r));s.push(circle(cx,cy,r*0.45));H(s,EP(cx,cy,r*0.45,r*0.45),0.8,30);return s;}
function screwS(s,cx,cy,r,a){s.push(circle(cx,cy,r));s.push([[cx-r*0.8*Math.cos(a),cy-r*0.8*Math.sin(a)],[cx+r*0.8*Math.cos(a),cy+r*0.8*Math.sin(a)]]);return s;}

MASTER={name:'Watch movement close-up',titles:['Inside the Ticking','Jewels and Wheels','Balance at Rest','The Escapement Breathes','Eighteen Thousand an Hour'],build:function(R){
  var s=[],sol=[],g=[],brs=[],a0=R()*TAU;
  // wheel train: barrel -> center -> third -> fourth -> escape; balance at right
  var J=function(a,b){return [a+RR(R,-3,3),b+RR(R,-3,3)];};
  var B={c:J(78,116),r:RR(R,54,57)},C={c:J(162,56),r:RR(R,34,37)},T={c:J(184,122),r:RR(R,25,27)},F={c:J(132,164),r:RR(R,22,24)},E={c:J(218,66),r:RR(R,17,19)},BL={c:J(248,146),r:RR(R,40,42)};
  // bridges: sculpted bars over the train, each a tube with a bevel line inside
  var tb1=tube(curve([C.c,[176,92],T.c,[204,96],E.c],8),function(u){return 10+3*Math.sin(u*PI*3);}),tb2=tube(curve([F.c,[118,180],[104,190]],6),function(u){return 9-2*u;});
  var cock=tube(curve([BL.c,[268,112],[286,92]],6),function(u){return 9+5*u;});
  [tb1,tb2].forEach(function(T2){SOL(s,sol,T2.P);brs.push(T2.P);s.push(T2.L.map(function(p,i){return lerp(p,T2.R[i],0.22);}));s.push(T2.R.map(function(p,i){return lerp(p,T2.L[i],0.22);}));});
  // ratchet wheel on the barrel, jewels and screws
  var rt=EP(B.c[0],B.c[1],24,24);s.push(poly(escP(B.c[0],B.c[1],24,26,a0)));s.push(circle(B.c[0],B.c[1],11));screwS(s,B.c[0],B.c[1],6,a0);sol.push(rt);
  var click=[[B.c[0]+20,B.c[1]+16],[B.c[0]+34,B.c[1]+24],[B.c[0]+26,B.c[1]+30],[B.c[0]+20,B.c[1]+16]];s.push(click);screwS(s,B.c[0]+34,B.c[1]+30,3.4,R());
  [C,T,F,E].forEach(function(W){jewel(s,W.c[0],W.c[1],5.5);});
  [[176,92],[204,96],[104,190]].forEach(function(p){screwS(s,p[0],p[1],4.2,R()*PI);});
  // wheels behind the bridges
  wheelG(g,B.c[0],B.c[1],B.r,RI(R,80,90),0,a0,R);g.push(circle(B.c[0],B.c[1],B.r*0.62));
  var wc=wheelG(g,C.c[0],C.c[1],C.r,64,4,a0+0.2,R),wt=wheelG(g,T.c[0],T.c[1],T.r,60,4,a0+0.5,R),wf=wheelG(g,F.c[0],F.c[1],F.r,56,4,a0+0.9,R);
  var es=escP(E.c[0],E.c[1],E.r,15,a0);g.push(poly(es));g.push(circle(E.c[0],E.c[1],E.r*0.45));for(var k=0;k<4;k++){var a=a0+k*PI/2;g.push([[E.c[0]+3*Math.cos(a),E.c[1]+3*Math.sin(a)],[E.c[0]+E.r*0.45*Math.cos(a),E.c[1]+E.r*0.45*Math.sin(a)]]);}
  behind(s,g,brs.concat([rt]));[EP(B.c[0],B.c[1],B.r,B.r),wc,wt,wf,EP(E.c[0],E.c[1],E.r,E.r)].forEach(function(P){sol.push(P);});
  // pallet fork from escape wheel toward the balance
  var pv=[lerp(E.c,BL.c,0.42)[0],lerp(E.c,BL.c,0.42)[1]],dirv=Math.atan2(BL.c[1]-E.c[1],BL.c[0]-E.c[0]);
  var fork=[[E.c[0]+E.r*0.7*Math.cos(dirv-0.9),E.c[1]+E.r*0.7*Math.sin(dirv-0.9)],[pv[0]-6*Math.sin(dirv),pv[1]+6*Math.cos(dirv)],[pv[0]+28*Math.cos(dirv),pv[1]+28*Math.sin(dirv)],[pv[0]+6*Math.sin(dirv),pv[1]-6*Math.cos(dirv)],[E.c[0]+E.r*0.7*Math.cos(dirv+0.9),E.c[1]+E.r*0.7*Math.sin(dirv+0.9)],[pv[0],pv[1]]];
  FS(s,sol,fork.slice(0,5));s.push(fork.slice(4));jewel(s,pv[0],pv[1],3.5);
  [fork[0],fork[4]].forEach(function(p){var J=rotateAbout(RP(p[0]-2,p[1]-4,p[0]+2,p[1]+4),p[0],p[1],dirv);FS(s,sol,J,0.8,0);});
  // balance wheel: rim as a spiral bezel, three arms, rim screws, hairspring
  var bc=BL.c,br=BL.r,bal=EP(bc[0],bc[1],br,br);SOL(s,sol,bal);s.push(spiral(bc[0],bc[1],br*0.84,br-0.6,2.4,a0));
  var hs=spiral(bc[0],bc[1],4,br*0.62,RR(R,9,11),a0);var arms=[];for(var k2=0;k2<3;k2++){var aa=a0+k2*TAU/3;arms.push(tube([[bc[0]+5*Math.cos(aa),bc[1]+5*Math.sin(aa)],[bc[0]+br*0.84*Math.cos(aa),bc[1]+br*0.84*Math.sin(aa)]],function(){return 1.8;}).P);}
  arms.forEach(function(P){s.push(poly(P));});behind(s,[hs],arms);
  for(var q=0;q<8;q++){var aq=a0+0.2+q*TAU/8,p=[bc[0]+(br+3)*Math.cos(aq),bc[1]+(br+3)*Math.sin(aq)];s.push(circle(p[0],p[1],2.6));}
  // balance cock over the balance, with regulator and endstone
  SOL(s,sol,cock.P);s.push(cock.L.map(function(p,i){return lerp(p,cock.R[i],0.25);}));var ce=EP(BL.c[0],BL.c[1],12,12);SOL(s,sol,ce);jewel(s,bc[0],bc[1],7);
  screwS(s,286,92,7,R()*PI);s.push([[bc[0]+8,bc[1]-6],[bc[0]+34,bc[1]-30]]);s.push(arc(bc[0],bc[1],18,18,-PI*0.9,-PI*0.4));
  // case ring around the edge with winding stem
  var stemY=RR(R,96,104);var stem=RP(4,stemY-6,24,stemY+6);FS(s,sol,stem,1.4,0);
  // main plate: Geneva stripes behind everything, and a bevelled edge ring
  var plate=[];H(plate,RP(4,4,296,196),RR(R,5.4,5.8),RR(R,-22,-14));behind(s,plate,sol);
  return s;}};

var NOTES="Batch 14 (Nov 24). Review of Nov 22-23 plays: Library reading room (Super Sketch, type 1) held its 20 minutes well - deep perspective, shelves and a window read clearly. Strong: taxi, delivery van, bar stools, fire escape, karst peaks, quonset hut, cycladic chapel, wardrobe, fondue pot, corn crib. Weak: tapir, anteater, warthog and dachshund blocky; axolotl and water strider muddled; toast rack, kalimba and spirit level lost against tile grids; ox cart and wringer washer cluttered. Lessons kept: one line, keep extras touching; clip backgrounds with behind()/clipIn(); animals need a bold smooth silhouette with one shaded side; never cover the subject with all-over hatch, rays or tile grids - stripes or sky rows only; draw small objects big; facades, cobbles, tile walls and dozens of small closed shapes slow the planner; blobs with crossing control points self-intersect and break clipping - use tubes along a curve for bars and bridges. New this batch: conch and otter were hard to make read; check silhouettes first. Daily Super Sketch: Watch movement close-up, a close-up filling the screen with no horizon (type 2); previous two were Zen rock garden from above (type 3) and Library reading room (type 1).";
return {number:14,startedOn:"2026-11-24",notes:NOTES,master:MASTER||undefined,subjects:SUBJ};
})();
