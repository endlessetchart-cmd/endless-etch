// Endless Etch — batch 13. 48 subjects for 2026-11-23 (each plays about three times, shuffled per round) plus the Daily Super Sketch.
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

S('Corn crib',['Slats and Gold Ears','Winter Store','Crib by the Lane','Air Through the Boards','Harvest Put By'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,164,170),cx=RR(R,120,165),wb=RR(R,22,26),wt=wb+RR(R,7,10),h=RR(R,68,78),py=gy-9;
  [-1,0,1].forEach(function(d){FS(s,sol,RP(cx+d*(wb-5)-4,py,cx+d*(wb-5)+4,gy),1.3,45);});
  var body=[[cx-wb,py],[cx-wt,py-h],[cx+wt,py-h],[cx+wb,py]];SOL(s,sol,body);
  var corn=[];for(var y=py-4;y>py-h*RR(R,0.6,0.8);y-=4){var xa=cx-wb-(wt-wb)*(py-y)/h+2,xb=cx+wb+(wt-wb)*(py-y)/h-2;corn.push(bumps(xa,xb,y,2.4,4.6));}
  clipIn(s,[serp(corn)],body);clipIn(s,[rows(cx-wt,cx+wt,py-h+3,py-2,RR(R,6,7))],body);
  [-0.33,0.33].forEach(function(f){s.push([[cx+f*wb,py],[cx+f*wt,py-h]]);});
  H(s,[[cx-wb,py],[cx-wt,py-h],[cx-wt+8,py-h],[cx-wb+8,py]],1.5,80);
  var rt=py-h-RR(R,26,32),roof=[[cx-wt-9,py-h+2],[cx,rt],[cx+wt+9,py-h+2]];FS(s,sol,roof);clipIn(s,[zz(cx-wt-9,cx+wt+9,rt,py-h+2,4.2)],roof);
  s.push(rect(cx-7,py-h+6,cx+7,py-h+22));H(s,RP(cx-7,py-h+6,cx+7,py-h+22),1.4,0);
  ladder(s,[cx+wb+RR(R,14,20),gy],[cx+wt+2,py-h+12],7,8);
  var bx=cx-wb-RR(R,40,60);s.push(rect(bx-12,gy-12,bx+12,gy));s.push(zz(bx-10,bx+10,gy-10,gy-2,3));
  bg.push(tufts(4,296,gy,4,R));treeR(bg,R,RR(R,240,280),gy,RR(R,14,18),2);return outdoor(s,R,bg,sol,gy);});

S('Wayside shrine',['Candle at the Crossroads','Little Roof, Little Light','For Travellers','Fieldside Niche','Stone by the Path'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,166,172),cx=RR(R,120,170),w=RR(R,15,18),h=RR(R,78,90);
  FS(s,sol,RP(cx-w-6,gy-10,cx+w+6,gy),0);s.push(zz(cx-w-5,cx+w+5,gy-9,gy-1,5));
  var col=RP(cx-w,gy-10-h,cx+w,gy-10);SOL(s,sol,col);clipIn(s,[brickS(cx-w,gy-10-h,cx+w,gy-10,9,5)],col,[RP(cx-w+4,gy-10-h+6,cx+w-4,gy-10-h+40)]);
  var ni=archP(cx,gy-10-h+40,w-5,22);s.push(ni);H(s,[[cx+2,gy-10-h+40],[cx+2,gy-10-h+14],[cx+w-5,gy-10-h+18],[cx+w-5,gy-10-h+40]],1.2,90);
  s.push(rect(cx-4,gy-10-h+26,cx+1,gy-10-h+39));s.push([[cx-1.5,gy-10-h+26],[cx-1.5,gy-10-h+21]].concat(arc(cx-1.5,gy-10-h+19,1.6,2.6,PI/2,PI/2+TAU)));
  s.push(rect(cx-w+6,gy-10-h+33,cx-w+10,gy-10-h+39));s.push([[cx-w+8,gy-10-h+33],[cx-w+6,gy-10-h+29],[cx-w+8,gy-10-h+33],[cx-w+11,gy-10-h+28]]);
  var rt=gy-10-h-RR(R,18,24),roof=[[cx-w-9,gy-10-h+2],[cx,rt],[cx+w+9,gy-10-h+2]];FS(s,sol,roof);clipIn(s,[scallopRows(cx-w-9,cx+w+9,rt+3,gy-10-h+2,5,3.5)],roof);
  crossT(s,cx,rt,RR(R,12,15));
  var pth=[[cx+w+10,gy],[cx+w+40,gy],[296,196],[cx-30,196]];s.push([pth[0],pth[3]]);s.push([pth[1],pth[2]]);clipIn(s,[waterS(R,4,296,gy+5,196,6,0.8)],pth);sol.push(pth);
  var fx=cx-w-RR(R,20,30),f=[[fx,gy],[fx,gy-20]];for(var x=fx;x>8;x-=RR(R,18,22)){f.push([x,gy-20],[x,gy],[x,gy-20]);}f.push([8,gy-20]);s.push(f);s.push([[fx,gy-12],[8,gy-12]]);
  treeR(bg,R,cx+w+RR(R,50,80),gy,RR(R,20,26),2);bg.push(tufts(4,296,gy,5,R));return outdoor(s,R,bg,sol,gy);});

S('Clapper bridge',['Slabs Over the Brook','Old as the Moor','Stepping Stones Grown Up','Three Long Stones','Granite Crossing'],function(R){
  var s=[],sol=[],bg=[],wy=RR(R,128,136),sy=wy-RR(R,16,20),x0=RR(R,30,45),x1=RR(R,255,270),n=3,sp=(x1-x0)/n;
  var deck=RP(x0,sy-7,x1,sy);SOL(s,sol,deck);for(var i=1;i<n;i++)s.push([[x0+sp*i,sy-7],[x0+sp*i,sy]]);H(s,RP(x0,sy-3,x1,sy),1.3,0);
  var piers=[];for(var j=1;j<n;j++){var px=x0+sp*j,pw=RR(R,9,12),P=RP(px-pw,sy,px+pw,wy+8);SOL(s,sol,P);piers.push(P);clipIn(s,[brickS(px-pw,sy,px+pw,wy+8,8,5)],P);H(s,RP(px+pw*0.4,sy,px+pw,wy+8),1.5,90);}
  var bankL=blob([[4,sy-4],[x0+6,sy-2],[x0+4,wy+4],[4,wy+10]],5),bankR=blob([[296,sy-6],[x1-6,sy-2],[x1-4,wy+4],[296,wy+10]],5);
  [bankL,bankR].forEach(function(B){SOL(s,sol,B);H(s,B,RR(R,3,3.6),RR(R,20,40));});
  var water=[[4,wy],[296,wy],[296,196],[4,196]];s.push([[4,wy],[296,wy]]);waterIn(s,R,water,wy+4,194,RR(R,4.5,5.5),piers.concat([bankL,bankR]));
  rocks(s,sol,R,x0+40,x0+120,wy+24,9,3);
  for(var k=0;k<3;k++){var tx=RR(R,20,280);if(Math.abs(tx-150)>40)treeR(bg,R,tx,sy-2,RR(R,12,18),2.2);}
  bg.push(tufts(4,296,sy-2,4,R));hills(bg,R,sy-4,RR(R,28,40),5);return fin(s,R,bg,sol,sy-6);});

S('Hay barrack',['Roof on Four Poles','Hay Under a Hat','Rising Roof','Summer Kept Dry','Dutch Field Corner'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,164,170),cx=RR(R,120,170),w=RR(R,40,48),dp=RR(R,12,16),ph=RR(R,95,110),ry=gy-ph*RR(R,0.62,0.78);
  var posts=[[cx-w,gy],[cx+w,gy],[cx-w+dp,gy-dp*0.6],[cx+w+dp,gy-dp*0.6]];
  var hay=blob([[cx-w+4,gy],[cx-w+2,gy-25],[cx-w+10,ry+14],[cx,ry+8],[cx+w-6,ry+14],[cx+w+4,gy-22],[cx+w+2,gy]],6);SOL(s,sol,hay);
  var hz=[];for(var y=gy-4;y>ry+8;y-=4.2)hz.push(wave(cx-w-4,cx+w+8,y,1.4,7,y));clipIn(s,[serp(hz)],hay);
  posts.forEach(function(p,i){var P=RP(p[0]-2.4,gy-ph+(i>1?-dp*0.6:0),p[0]+2.4,p[1]);if(i<2){SOL(s,sol,P);H(s,P,1,90);}else behind(s,[poly(P)],[hay]);});
  var rf=[[cx-w-10,ry],[cx+dp*0.5,ry-RR(R,32,40)],[cx+w+dp+10,ry-dp*0.6],[cx+w+10,ry+2]];FS(s,sol,rf);
  var apex=rf[1];s.push([[cx-w-10,ry],[cx+w+10,ry+2]]);clipIn(s,[fan(apex,arc(apex[0],apex[1],80,80,0.1*PI,0.95*PI),9,1.0)],rf);
  H(s,[apex,rf[2],rf[3]],1.6,70);
  [0,1].forEach(function(d){var px=d?cx+w:cx-w;s.push(zz(px-2,px+2,ry+8,ry+40,1.3));});
  var bx=cx+w+RR(R,30,45);if(bx<280){s.push(ellipse(bx,gy-8,10,8));H(s,EP(bx,gy-8,10,8),2,30);}
  bg.push(tufts(4,296,gy,5,R));return outdoor(s,R,bg,sol,gy);});

S('Chicken coop',['Hens at Home','Ramp to the Roost','Morning Eggs','Wire and Clapboard','Clucking Yard'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,166,172),cx=RR(R,80,110),w=RR(R,34,40),hy=gy-RR(R,20,24),h=RR(R,38,44);
  var hs=RP(cx-w,hy-h,cx+w,hy);SOL(s,sol,hs);clipIn(s,[rows(cx-w,cx+w,hy-h+4,hy-2,4)],hs,[RP(cx-12,hy-h+8,cx+10,hy-4)]);
  s.push(rect(cx-12,hy-h+8,cx+10,hy-4));H(s,RP(cx-12,hy-h+8,cx+10,hy-4),1.4,90);
  var rf=[[cx-w-6,hy-h+2],[cx,hy-h-RR(R,20,26)],[cx+w+6,hy-h+2]];FS(s,sol,rf,2.2,25);
  [-0.85,0.85].forEach(function(f){FS(s,sol,RP(cx+f*w-2.5,hy,cx+f*w+2.5,gy),1,90);});
  var nb=RP(cx-w-18,hy-h+12,cx-w,hy-8);FS(s,sol,nb);s.push(zz(cx-w-16,cx-w-2,hy-h+14,hy-10,3));
  var r0=[cx+4,hy],r1=[cx+RR(R,36,46),gy];s.push([r0,r1]);s.push([[r0[0]+6,r0[1]],[r1[0]+6,r1[1]]]);var cl=[],d=1;for(var t=0.1;t<1;t+=0.12){var a=lerp(r0,r1,t);if(d>0)cl.push(a,[a[0]+6,a[1]]);else cl.push([a[0]+6,a[1]],a);d=-d;}s.push(cl);
  var rx0=cx+w,rx1=Math.min(290,cx+w+RR(R,110,140)),rt=gy-RR(R,40,48),run=RP(rx0,rt,rx1,gy);s.push(rect(rx0,rt,rx1,gy));
  var hens=[];for(var k=0;k<RI(R,2,3);k++){var hx=rx0+(rx1-rx0)*(0.25+0.3*k)+RR(R,-6,6);hens.push(hen(s,sol,hx,gy-2,RR(R,8,10),sgn(R)));}
  clipIn(s,hatch(RP(rx0,rt,rx1,gy),5,45).concat(hatch(RP(rx0,rt,rx1,gy),5,-45)),run,hens);
  for(var x=rx0;x<=rx1;x+=(rx1-rx0)/4)s.push([[x,rt],[x,gy]]);
  var hh=hen(s,sol,RR(R,30,50),gy+12,RR(R,9,11),sgn(R));
  bg.push(tufts(4,296,gy,4,R));return outdoor(s,R,bg,sol,gy);});

S('Street clock',['Meet Me Under the Clock','Five to Nine','Cast Iron Timekeeper','Corner Hours','Two Faces, One Time'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,170,176),cx=RR(R,130,170),cy=RR(R,52,62),r=RR(R,22,26);
  var face=EP(cx,cy,r,r);SOL(s,sol,face);s.push(circle(cx,cy,r-3));HX(s,[face,EP(cx,cy,r-3,r-3)],1,30);
  var tk=[];for(var i=0;i<12;i++){var a=i*TAU/12,rr=i%3?r-7:r-9;tk.push([cx+(r-4)*Math.cos(a),cy+(r-4)*Math.sin(a)],[cx+rr*Math.cos(a),cy+rr*Math.sin(a)],[cx+(r-4)*Math.cos(a+TAU/24),cy+(r-4)*Math.sin(a+TAU/24)]);}s.push(tk);
  var hA=RR(R,0,TAU),mA=RR(R,0,TAU);s.push([[cx,cy],[cx+(r-12)*Math.cos(hA),cy+(r-12)*Math.sin(hA)]]);s.push([[cx,cy],[cx+(r-7)*Math.cos(mA),cy+(r-7)*Math.sin(mA)]]);s.push(circle(cx,cy,1.4));
  var fin2=[[cx-5,cy-r],[cx,cy-r-14],[cx+5,cy-r]];FS(s,sol,fin2,1,90);s.push(circle(cx,cy-r-16,2.2));
  var post=[[cx-4,cy+r],[cx-5,gy-26],[cx-10,gy-18],[cx-12,gy],[cx+12,gy],[cx+10,gy-18],[cx+5,gy-26],[cx+4,cy+r]];SOL(s,sol,post);H(s,[[cx+1,cy+r],[cx+5,gy-26],[cx+10,gy-18],[cx+12,gy],[cx+3,gy]],1.2,90);
  [cy+r+12,cy+r+40,gy-26].forEach(function(y){s.push(rect(cx-7,y-2,cx+7,y+2));});s.push(rect(cx-15,gy-5,cx+15,gy));
  var sw=[[4,gy],[296,gy]];s.push(sw);var cb=[[4,gy+6],[296,gy+6]];s.push(cb);s.push(zz(4,296,gy,gy+6,14));H(s,RP(4,gy+10,296,196),3.6,8);
  var x=4,d=0;while(x<292){var bw=RR(R,50,72),bt=RR(R,40,80),B=RP(x,bt,Math.min(296,x+bw),gy);bg.push(rect(B[0][0],B[0][1],B[1][0],gy));
    var wins=[];for(var wy=bt+10,nr=0;nr<1&&wy<gy-40;wy+=26,nr++)for(var wx=x+10;wx<x+bw-14;wx+=24){bg.push(rect(wx,wy,wx+10,wy+13));wins.push(RP(wx,wy,wx+10,wy+13));}
    if(gy-26-bt>20)HX(bg,[RP(x,bt,Math.min(296,x+bw),gy-25)].concat(wins),d%2?RR(R,4.5,5.5):RR(R,6,7),d%2?90:0);
    var aw=[[x+3,gy-24],[x+bw-3,gy-24],[x+bw-6,gy-16],[x+6,gy-16]];bg.push(poly(aw));bg.push(zz(x+5,x+bw-5,gy-24,gy-16,7));bg.push(rect(x+bw*0.3,gy-14,x+bw*0.7,gy));x+=bw;d++;}
  return fin(s,R,bg,sol,gy-3);});

S('Unicycle',['One Wheel Will Do','Balance Practice','Leaning Wheel','Courtyard Circus','Spokes and a Saddle'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,170,176),cx=RR(R,130,170),r=RR(R,38,44),cy=gy-r,lean=RR(R,0.18,0.28);
  var tyre=EP(cx,cy,r,r);SOL(s,sol,tyre);s.push(circle(cx,cy,r-4));HX(s,[tyre,EP(cx,cy,r-4,r-4)],1.1,30);s.push(circle(cx,cy,r-6));
  var sp=[],n=RI(R,28,36);for(var i=0;i<n;i++){var a=i*TAU/n,b=a+TAU/n*7;sp.push([cx+3*Math.cos(a),cy+3*Math.sin(a)],[cx+(r-6)*Math.cos(b),cy+(r-6)*Math.sin(b)],[cx+3*Math.cos(a+TAU/n),cy+3*Math.sin(a+TAU/n)]);}s.push(sp);s.push(circle(cx,cy,4));
  var top=[cx+lean*(r+60),cy-r-50],dx=top[0]-cx,dy=top[1]-cy,L=Math.hypot(dx,dy),nx=-dy/L*3,ny=dx/L*3;
  var fork=[[cx+nx*1.5,cy+ny*1.5],[top[0]+nx,top[1]+ny],[top[0]-nx,top[1]-ny],[cx-nx*1.5,cy-ny*1.5]];FS(s,sol,fork,1,90);
  var sad=blob([[top[0]-18,top[1]-4],[top[0]-10,top[1]-10],[top[0]+12,top[1]-11],[top[0]+20,top[1]-6],[top[0]+14,top[1]],[top[0]-12,top[1]]],5);FS(s,sol,sad,1.3,0);
  [0,1].forEach(function(k){var a=RR(R,0,TAU)+k*PI,ex=cx+16*Math.cos(a),ey=cy+16*Math.sin(a);s.push([[cx,cy],[ex,ey]]);var pd=RP(ex-7,ey-2,ex+7,ey+2);s.push(poly(pd));});
  var wx0=4,wx1=296,wt=RR(R,40,60),W=RP(wx0,wt,wx1,gy);bg.push(brickS(wx0,wt,wx1,gy-1,RR(R,16,20),RR(R,7,8)));
  bg.push(rect(RR(R,20,40),wt+20,RR(R,70,90),wt+70));
  s.push([[4,gy],[296,gy]]);var cob=[],d=1;for(var y=gy+5;y<196;y+=6){var r2=bumps(4,296,y,2.2,9);if(d<0)r2.reverse();A(cob,r2);d=-d;}s.push(cob);
  behind(s,bg,sol);return skyFill(s,wt,6,5,5,sol);});

S('River barge',['Sand Going Downstream','Low in the Water','Slow Freight','Wheelhouse at the Stern','Under the Willows'],function(R){
  var s=[],sol=[],bg=[],wy=RR(R,134,142),x0=RR(R,30,45),x1=RR(R,250,268),fb=RR(R,12,15);
  var hull=[[x0,wy-fb],[x1,wy-fb],[x1+8,wy-fb-2],[x1+2,wy+6],[x0+10,wy+6],[x0-4,wy-fb-2]];SOL(s,sol,hull);s.push([[x0,wy-fb+4],[x1,wy-fb+4]]);H(s,[[x0+2,wy-fb+4],[x1+2,wy-fb+4],[x1+2,wy+6],[x0+10,wy+6]],1.5,0);
  var nh=RI(R,2,3),hx1=x1-60,seg=(hx1-x0-6)/nh,heaps=[];for(var i=0;i<nh;i++){var a=x0+6+seg*i,b=a+seg-4,hh=RR(R,16,24),P=blob([[a,wy-fb],[a+seg*0.25,wy-fb-hh*0.7],[(a+b)/2,wy-fb-hh],[b-seg*0.25,wy-fb-hh*0.75],[b,wy-fb]],6);SOL(s,sol,P);H(s,P.slice(0,Math.floor(P.length*0.55)).concat([[(a+b)/2,wy-fb]]),RR(R,1.6,2.2),RR(R,50,70));heaps.push(P);}
  var wh=RP(x1-46,wy-fb-34,x1-14,wy-fb);SOL(s,sol,wh);win(s,x1-42,wy-fb-28,10,10,0);win(s,x1-28,wy-fb-28,10,10,1.4);s.push(rect(x1-50,wy-fb-38,x1-10,wy-fb-34));
  FS(s,sol,RP(x1-24,wy-fb-52,x1-18,wy-fb-38),1,90);s.push([[x1-10,wy-fb-20],[x1+4,wy-fb-30],[x1+4,wy-fb-22],[x1-10,wy-fb-20]]);
  s.push([[x0-4,wy-fb-2],[x0-18,wy+2]]);var ty=[];for(var k=0;k<5;k++)ty.push(EP(x0+20+k*48,wy-2,4,3));ty.forEach(function(t){s.push(poly(t));});
  var water=[[4,wy],[296,wy],[296,196],[4,196]];s.push([[4,wy],[296,wy]]);waterIn(s,R,water,wy+4,194,RR(R,6,7),[hull]);
  var bank=wy-RR(R,20,26);bg.push([[4,bank],[296,bank]]);H(bg,RP(4,bank,296,wy),4.5,0);for(var t2=0;t2<4;t2++)treeR(bg,R,RR(R,15,285),bank,RR(R,12,17),2.2);
  return fin(s,R,bg,sol,bank-2);});

S('Milk float',['Before the Sun','Crates of White Bottles','Silent Round','Doorstep Delivery','Pint for Number Nine'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,170,176),x0=RR(R,50,70),L=RR(R,170,190),wr=RR(R,11,13),wy=gy-wr,bt=wy-RR(R,48,54),x1=x0+L;
  var cab=[[x0,wy],[x0,bt+18],[x0+8,bt],[x0+46,bt],[x0+46,wy]];SOL(s,sol,cab);var ws=[[x0+4,bt+18],[x0+10,bt+5],[x0+30,bt+5],[x0+30,bt+18]];s.push(poly(ws));H(s,ws,1.4,60);
  s.push(rect(x0+34,bt+8,x0+44,wy-6));
  var roof=RP(x0-4,bt-6,x1+4,bt);FS(s,sol,roof,1.2,0);var bed=RP(x0+46,wy-6,x1,wy);FS(s,sol,bed,1.3,0);s.push([[x1,bt],[x1,wy]]);s.push([[x0+46,bt],[x0+46,wy-6]]);
  var cr=[],ncol=RI(R,5,6),cw=(L-52)/ncol;for(var row=0;row<2;row++){var cy0=wy-6-row*20;for(var c=0;c<ncol;c++){var cxa=x0+48+c*cw;cr.push(rect(cxa,cy0-18,cxa+cw-2,cy0));var bt2=[],nb=4;for(var b=0;b<nb;b++){var bx=cxa+2+b*(cw-4)/nb,bw=(cw-4)/nb-1;bt2.push([bx,cy0-9],[bx,cy0-14],[bx+bw*0.3,cy0-16],[bx+bw*0.3,cy0-18],[bx+bw*0.7,cy0-18],[bx+bw*0.7,cy0-16],[bx+bw,cy0-14],[bx+bw,cy0-9]);}cr.push(bt2);cr.push([[cxa,cy0-9],[cxa+cw-2,cy0-9]]);}}A(s,cr);
  [x0+24,x1-26].forEach(function(cx){tyre(s,sol,cx,wy,wr,1.3);s.push(arc(cx,wy,wr+4,wr+4,PI,TAU));});
  road(s,R,gy);
  var x=4;while(x<292){var bw=RR(R,55,80),bt3=RR(R,30,70);bg.push(rect(x,bt3,Math.min(296,x+bw),gy));var dx=x+bw*0.4;bg.push(rect(dx,gy-26,dx+14,gy));bg.push(circle(dx+11,gy-13,1));
    for(var wy2=bt3+10;wy2<gy-60;wy2+=24){bg.push(rect(x+8,wy2,x+20,wy2+14));bg.push(rect(x+bw-22,wy2,x+bw-10,wy2+14));}bg.push(rect(dx-4,gy-3,dx+18,gy));x+=bw;}
  return fin(s,R,bg,sol,gy-3);});

S('Hang glider',['Riding the Ridge Lift','Above the Valley Floor','Thermal at Noon','Kite with a Pilot','Long Way Down'],function(R){
  var s=[],sol=[],bg=[],cx=RR(R,130,170),ny=RR(R,42,52),sp=RR(R,105,120),tilt=RR(R,-0.12,0.12);
  var nose=[cx+RR(R,10,20),ny-8],lt=[cx-sp,ny+18],rt=[cx+sp,ny+14],keel=[cx-8,ny+26];
  var wing=[nose,rt].concat(quad(rt,[cx+sp*0.4,ny+40],keel,12).slice(1)).concat(quad(keel,[cx-sp*0.4,ny+44],lt,12).slice(1));wing=rotateAbout(wing,cx,ny,tilt);SOL(s,sol,wing);
  var nr=rotateAbout([nose],cx,ny,tilt)[0],kr=rotateAbout([keel],cx,ny,tilt)[0];s.push([nr,kr]);
  var bat=[];for(var i=1;i<6;i++){var t=i/6;bat.push(rotateAbout([lerp(nose,lerp(lt,keel,t),1)],cx,ny,tilt)[0]);}
  var bt=[],d=1;bat.forEach(function(b){if(d>0)bt.push(nr,b);else bt.push(b,nr);d=-d;});s.push(bt);var bt2=[],bat2=[];for(var j=1;j<6;j++)bat2.push(rotateAbout([lerp(rt,keel,j/6)],cx,ny,tilt)[0]);d=1;bat2.forEach(function(b){if(d>0)bt2.push(nr,b);else bt2.push(b,nr);d=-d;});s.push(bt2);
  H(s,[nr].concat(rotateAbout(quad(keel,[cx-sp*0.4,ny+44],lt,12),cx,ny,tilt)),1.8,RR(R,20,40));
  var hp=[cx-4,ny+30],bar=[[cx-24,ny+62],[cx+18,ny+62]];s.push([hp,bar[0],bar[1],hp]);
  var body=[[cx-6,ny+50],[cx+30,ny+52],[cx+34,ny+57],[cx-6,ny+58]];FS(s,sol,body,1.2,0);s.push(circle(cx-10,ny+53,5));s.push([[cx-4,ny+50],[cx-2,ny+40],[hp[0],hp[1]]]);s.push([[cx-6,ny+56],[cx-14,ny+62]]);s.push([[cx+2,ny+58],[cx+4,ny+62]]);
  var gl=RR(R,148,156);var val=[[4,gl]];for(var x=4;x<=296;x+=8)val.push([x,gl+6*Math.sin(x/40)]);bg.push(val);
  var fl=[],dd=1;for(var y=gl+8;y<196;y+=RR(R,6,8)){var w=wave(4,296,y,0.8,30,y);if(dd<0)w.reverse();A(fl,w);dd=-dd;}bg.push(fl);
  for(var k=0;k<6;k++){var fx=RR(R,10,280),fy=RR(R,gl+14,190);bg.push(rect(fx,fy,fx+RR(R,20,40),fy+RR(R,8,14)));}
  var rd=[];for(var t2=0;t2<=1;t2+=0.05)rd.push([20+260*t2,gl+10+30*t2*t2+8*Math.sin(t2*9)]);bg.push(rd);
  var ridge=[[4,gl-50],[40,gl-70],[80,gl-40],[130,gl-24],[180,gl-30],[230,gl-60],[270,gl-74],[296,gl-60],[296,gl],[4,gl]];bg.push(ridge.slice(0,8));H(bg,ridge,6,70);
  behind(s,bg,sol);return skyFill(s,gl-20,7,5,5,sol);});

S('Mine cart on rails',['Ore Out of the Hill','Last Load of the Shift','Into the Adit','Timber and Iron','Down the Narrow Gauge'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,160,166),vx=RR(R,190,230),vy=gy-RR(R,40,48),cx=RR(R,90,120),cw=RR(R,40,48);
  var ent=[[vx-34,gy-6],[vx-34,vy-28],[vx+34,vy-28],[vx+34,gy-6]];var dark=archP(vx,gy-6,28,gy-vy-12).slice(0,-1);
  SOL(s,sol,ent);FS(s,sol,RP(vx-34,vy-36,vx+34,vy-28),1.4,0);FS(s,sol,RP(vx-34,vy-28,vx-28,gy-6),1.2,90);FS(s,sol,RP(vx+28,vy-28,vx+34,gy-6),1.2,90);H(s,dark,1.6,0);
  var hill=blob([[4,gy-10],[20,vy-60],[90,vy-90],[170,vy-110],[250,vy-80],[296,vy-60],[296,gy-10]],6);bg.push(hill.slice(0,Math.floor(hill.length*0.8)));H(bg,hill,5.5,60);
  var rl=[[cx-cw-30,196],[vx-10,gy-6]],rr=[[cx+cw+50,196],[vx+10,gy-6]];s.push(rl);s.push(rr);var sl=[],d=1;for(var t=0.02;t<1;t*=1.35){var a=lerp(rl[0],rl[1],t),b=lerp(rr[0],rr[1],t);var ex=(b[0]-a[0])*0.15;if(d>0)sl.push([a[0]-ex,a[1]],[b[0]+ex,b[1]]);else sl.push([b[0]+ex,b[1]],[a[0]-ex,a[1]]);d=-d;}s.push(sl);
  var cy=gy+RR(R,4,10),body=[[cx-cw,cy-46],[cx+cw,cy-46],[cx+cw-6,cy-10],[cx-cw+6,cy-10]];SOL(s,sol,body);s.push([[cx-cw+2,cy-40],[cx+cw-2,cy-40]]);
  [-0.5,0,0.5].forEach(function(f){s.push([[cx+f*cw,cy-46],[cx+f*(cw-6),cy-10]]);});H(s,[[cx+cw*0.5,cy-40],[cx+cw-1,cy-40],[cx+cw-6,cy-10],[cx+(cw-6)*0.5,cy-10]],1.4,90);
  var ore=blob([[cx-cw+2,cy-46],[cx-cw+8,cy-56],[cx-12,cy-62],[cx+6,cy-58],[cx+18,cy-64],[cx+cw-6,cy-55],[cx+cw-2,cy-46]],4);SOL(s,sol,ore);s.push(bumps(cx-cw+4,cx+cw-4,cy-50,4,8));H(s,ore,2.2,35);
  [cx-cw*0.55,cx+cw*0.55].forEach(function(wx){tyre(s,sol,wx,cy-5,7,1.2);});
  var lamp=[vx+40,vy-24];s.push([[vx+34,vy-24],lamp,[lamp[0],lamp[1]+6]]);s.push(poly(RP(lamp[0]-3,lamp[1]+6,lamp[0]+3,lamp[1]+14)));
  gnd(bg,R,gy-6);behind(s,bg,sol);return skyFill(s,gy-10,7.5,5,5,sol.concat([hill]));});

S('Crop duster',['Low Pass Over the Rows','Fine Mist at Dawn','Pull Up at the Fence','Yellow Wings, Green Field','Ag Run'],function(R){
  var s=[],sol=[],bg=[],cx=RR(R,130,170),cy=RR(R,60,72),L=RR(R,90,104),dir=1;
  var fus=blob([[cx-L*0.5,cy-2],[cx-L*0.2,cy-8],[cx+L*0.25,cy-9],[cx+L*0.48,cy-6],[cx+L*0.5,cy+4],[cx+L*0.2,cy+8],[cx-L*0.3,cy+4],[cx-L*0.55,cy+1]],6);SOL(s,sol,fus);
  var can=[[cx+L*0.02,cy-8],[cx+L*0.08,cy-20],[cx+L*0.22,cy-20],[cx+L*0.28,cy-9]];FS(s,sol,can,1.3,60);
  var wg=[[cx-14,cy+2],[cx+22,cy+2],[cx+30,cy+8],[cx-6,cy+12]],wgL=[[cx-10,cy+4],[cx-L*0.95,cy-4],[cx-L*0.95+8,cy+4],[cx-4,cy+12]];
  var wing=[[cx-4,cy+3],[cx+L*0.3,cy+1],[cx+L*0.33,cy+10],[cx+2,cy+14],[cx-L*0.55,cy+22],[cx-L*0.62,cy+14]];FS(s,sol,wing);H(s,[[cx-4,cy+9],[cx+L*0.32,cy+6],[cx+L*0.33,cy+10],[cx+2,cy+14],[cx-L*0.55,cy+22],[cx-L*0.58,cy+18]],1.3,0);
  var tail=[[cx-L*0.42,cy-3],[cx-L*0.55,cy-24],[cx-L*0.47,cy-24],[cx-L*0.3,cy-6]];FS(s,sol,tail,1.4,80);var hs=[[cx-L*0.5,cy],[cx-L*0.72,cy+4],[cx-L*0.66,cy+7],[cx-L*0.42,cy+4]];FS(s,sol,hs);
  var px=cx+L*0.5;s.push([[px,cy-1],[px+5,cy-1]]);s.push([[px+5,cy-16],[px+5,cy+14]]);s.push(circle(px+2,cy-1,2));
  s.push([[cx+4,cy+8],[cx+10,cy+22],[cx+20,cy+8]]);tyre(s,sol,cx+10,cy+26,4,0);
  var bar=[[cx-L*0.55,cy+24],[cx+L*0.25,cy+16]];s.push(bar);var sp=[],d=1,nn=14;for(var i=0;i<=nn;i++){var a=lerp(bar[0],bar[1],i/nn),b=[a[0]-RR(R,20,40),a[1]+RR(R,30,60)];if(d>0)sp.push(a,b);else sp.push(b,a);d=-d;}s.push(sp);
  var gy=RR(R,128,138);s.push([[4,gy],[296,gy]]);furrows(s,R,gy,RI(R,22,28),RR(R,60,240));
  for(var k=0;k<3;k++)treeR(bg,R,RR(R,15,285),gy,RR(R,8,12),2);bg.push([[4,gy-4],[296,gy-4]]);hills(bg,R,gy-2,RR(R,14,22),5);
  behind(s,bg,sol);return skyFill(s,gy-6,7.5,5,5,sol);});

S('Karst peaks on a river',['Green Towers, Slow Water','Raft Among the Pinnacles','Mist Between the Peaks','Limestone Guardians','The River Bends Twice'],function(R){
  var s=[],sol=[],bg=[],wy=RR(R,140,148),n=RI(R,5,6),peaks2=[];
  for(var i=0;i<n;i++){var x=20+i*(260/(n-1))+RR(R,-14,14),w=RR(R,22,34),h=RR(R,70,115)*(i%2?0.8:1),b=wy;
    var P=blob([[x-w,b],[x-w*0.9,b-h*0.5],[x-w*0.6,b-h*0.85],[x-w*0.1,b-h],[x+w*0.5,b-h*0.9],[x+w*0.9,b-h*0.5],[x+w,b]],6);peaks2.push({P:P,x:x,w:w,h:h,front:i%2===1});}
  peaks2.filter(function(p){return p.front;}).forEach(function(p){SOL(s,sol,p.P);var st=[],d=1;for(var xx=p.x-p.w+3;xx<p.x+p.w-2;xx+=RR(R,4,6)){var y0=wy-p.h*RR(R,0.2,0.7);if(d>0)st.push([xx,wy],[xx,y0]);else st.push([xx,y0],[xx,wy]);d=-d;}clipIn(s,[st],p.P);H(s,p.P.filter(function(q){return q[0]>p.x+p.w*0.2;}).concat([[p.x+p.w*0.2,wy]]),1.6,70);});
  peaks2.filter(function(p){return !p.front;}).forEach(function(p){bg.push(p.P.slice(0,-1));H(bg,p.P,3.4,80);});
  var water=[[4,wy],[296,wy],[296,196],[4,196]];s.push([[4,wy],[296,wy]]);
  var rx=RR(R,90,200),raft=[[rx-24,wy+18],[rx+24,wy+18],[rx+20,wy+23],[rx-20,wy+23]];FS(s,sol,raft,1.2,90);s.push([[rx+6,wy+18],[rx+6,wy+8]]);var hat=[[rx+1,wy+8],[rx+6,wy+3],[rx+11,wy+8],[rx+1,wy+8]];s.push(hat);s.push([[rx-20,wy+18],[rx-34,wy-6]]);
  waterIn(s,R,water,wy+4,194,RR(R,4.5,5.5),[raft]);
  var bank=blob([[4,wy-4],[30,wy-8],[60,wy-2],[60,wy+10],[4,wy+14]],5);SOL(s,sol,bank);s.push(tufts(6,58,wy-6,6,R));H(s,bank,2.4,30);
  behind(s,bg,sol);return skyFill(s,wy-2,7.5,5,5,sol.concat(peaks2.map(function(p){return p.P;})));});

S('Tidal flats at low tide',['Boats on Their Sides','Waiting for the Flood','Mud and Mooring Posts','The Sea Went Out','Channel at Slack Water'],function(R){
  var s=[],sol=[],bg=[],hy=RR(R,72,82);
  var ch=[];for(var t=0;t<=1;t+=0.04)ch.push([40+220*t+30*Math.sin(t*5),hy+6+(196-hy)*t]);var ch2=ch.map(function(p,i){return [p[0]+6+i*0.9,p[1]];});
  var chan=ch.concat(ch2.slice().reverse());s.push(ch);s.push(ch2);clipIn(s,[waterS(R,4,296,hy+8,196,3.2,0.8)],chan);sol.push(chan);
  function boat(x,b,L,tilt,dir){var P=[[x-L/2,b-L*0.25],[x+L/2,b-L*0.32],[x+L*0.42,b-L*0.05],[x+L*0.2,b],[x-L*0.3,b],[x-L*0.45,b-L*0.08]];if(dir<0)P=P.map(function(p){return [2*x-p[0],p[1]];});P=rotateAbout(P,x,b,tilt);SOL(s,sol,P);
    var st=rotateAbout([[x-L/2+3,b-L*0.25+5],[x+L/2-3,b-L*0.32+5]],x,b,tilt);if(dir<0)st=st.map(function(p){return [2*x-p[0],p[1]];});s.push(st);H(s,P.slice(2,5).concat([P[5]]),1.3,0);
    var m0=rotateAbout([[x,b-L*0.3]],x,b,tilt)[0],m1=rotateAbout([[x-L*0.05,b-L*1.0]],x,b,tilt)[0];s.push([m0,m1]);s.push([m1,P[0]]);return P;}
  var b1=boat(RR(R,70,110),RR(R,150,165),RR(R,70,84),RR(R,-0.35,-0.2),1),b2=boat(RR(R,200,240),RR(R,118,128),RR(R,40,48),RR(R,0.2,0.32),-1);
  s.push([[b1[0][0],b1[0][1]],[b1[0][0]-30,b1[0][1]+20],[b1[0][0]-34,b1[0][1]+20]]);
  var po=[];for(var k=0;k<5;k++){var px=RR(R,20,280),py=RR(R,hy+20,190);po.push(RP(px-1.5,py-14,px+1.5,py));}po.forEach(function(P){if(!sol.some(function(Q){return pip(P[0],Q);}))FS(s,sol,P,0.8,90);});
  var mud=[],d=1;for(var y=hy+6;y<196;y+=RR(R,4,5.5)){var w=wave(4,296,y,0.9,RR(R,20,40),R()*6);if(d<0)w.reverse();A(mud,w);d=-d;}behind(s,[mud],sol);
  s.push([[4,hy],[296,hy]]);var x=10;var shore=[];while(x<280){var hw=RR(R,10,16),hh2=RR(R,8,14);shore.push([x,hy],[x,hy-hh2],[x+hw/2,hy-hh2-6],[x+hw,hy-hh2],[x+hw,hy]);x+=hw+RR(R,4,30);}bg.push(shore);
  bg.push([[4,hy-2],[296,hy-2]]);behind(s,bg,sol);return skyFill(s,hy-2,7.5,5.5,5,sol);});

S('Badlands buttes',['Layered Like a Cake','Striped Hills','Million Years of Mud','Erosion at Work','Dry Gullies at Dusk'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,150,158),bs=[];
  var n=RI(R,3,4);for(var i=0;i<n;i++){var x=40+i*(220/(n-1))+RR(R,-12,12),w=RR(R,30,42),h=RR(R,50,90),top=gy-h,tw=w*RR(R,0.35,0.6);
    var P=[[x-w-10,gy],[x-w,gy-h*0.35],[x-tw-6,top+8],[x-tw,top],[x+tw,top],[x+tw+5,top+10],[x+w,gy-h*0.4],[x+w+12,gy]];bs.push(P);SOL(s,sol,P);
    var st=[];for(var y=top+5;y<gy;y+=RR(R,4.5,7)){st.push(wave(x-w-12,x+w+14,y,0.8,9,y));}clipIn(s,[serp(st)],P);
    H(s,P.filter(function(q){return q[0]>=x+tw*0.4;}).concat([[x+tw*0.4,gy]]),1.5,75);
    var gl=[],dd=1;for(var xx=x-w+6;xx<x-tw;xx+=RR(R,5,8)){var yy=gy-h*RR(R,0.2,0.5);if(dd>0)gl.push([xx,gy],[xx+2,yy]);else gl.push([xx+2,yy],[xx,gy]);dd=-dd;}clipIn(s,[gl],P);}
  var fg=blob([[4,gy+8],[80,gy+2],[160,gy+12],[240,gy+4],[296,gy+10],[296,196],[4,196]],5);s.push([[4,gy],[296,gy]]);H(s,RP(4,gy,296,196),RR(R,3.4,4),RR(R,8,16));
  for(var k=0;k<5;k++){var sx=RR(R,10,290),sy=RR(R,gy+14,190);s.push(zz(sx,sx+RR(R,8,14),sy-5,sy,1.6));}
  var far=[[4,gy-30],[50,gy-38],[110,gy-34],[170,gy-44],[230,gy-36],[296,gy-40]];bg.push(far);H(bg,far.concat([[296,gy],[4,gy]]),4.2,0);
  behind(s,bg,sol);return skyFill(s,gy-8,7.5,5,5,sol);});

S('Lombardy poplars',['Avenue to the Farm','Green Exclamation Marks','Wind in the Column Trees','Long Road, Tall Trees','Row Against the Gale'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,140,150),vx=RR(R,120,180),vy=gy-RR(R,2,6);
  var rl=[[vx-3,vy],[RR(R,40,80),196]],rr=[[vx+3,vy],[RR(R,220,260),196]];s.push(rl);s.push(rr);var rd=[rl[0],rr[0],rr[1],rl[1]];sol.push(rd);
  var dash=[];for(var t=0.08;t<1;t*=1.45){var a=lerp([vx,vy],[(rl[1][0]+rr[1][0])/2,196],t),b=lerp([vx,vy],[(rl[1][0]+rr[1][0])/2,196],t*1.18);dash.push([a,b]);}A(s,dash);
  [-1,1].forEach(function(side){var foot=side<0?[rl[1][0]-26,196]:[rr[1][0]+26,196];for(var t2=0.95;t2>0.12;t2*=0.74){var p=lerp([vx+side*4,vy],foot,t2),h=10+150*t2,w=3+15*t2;if(p[0]<8||p[0]>292)continue;poplar(s,sol,R,p[0],p[1],h,w,Math.max(1.2,2.2*t2));}});
  var fl=[];furrows(fl,R,gy,RI(R,24,30),vx);behind(s,fl,sol);s.push([[4,gy],[296,gy]]);
  var fx=RR(R,30,80);if(Math.abs(fx-vx)>30){bg.push(rect(fx-10,gy-14,fx+10,gy));bg.push([[fx-13,gy-13],[fx,gy-22],[fx+13,gy-13]]);}
  hills(bg,R,gy-2,RR(R,10,18),5);behind(s,bg,sol);return skyFill(s,gy-4,7.5,5,5,sol);});

// animal body from local points (facing right, origin on the foot line); returns the outline
function beast(s,sol,pts,ox,oy,sc,fx,n){var P=blob(M(pts,ox,oy,sc,fx),n||5);SOL(s,sol,P);return P;}
// shade the lower part of an outline below y (one hatch block)
function belly(s,P,y,g,a){var Q=P.filter(function(p){return p[1]>=y;});if(Q.length>2)H(s,Q,g,a);return s;}
// savanna/plain backdrop: tufts, an acacia, hills
function acacia(bg,x,b,sz){bg.push([[x-1.5,b],[x-1,b-sz*1.6],[x-sz*0.6,b-sz*2.2]]);bg.push([[x+1.5,b],[x+1,b-sz*1.5],[x+sz*0.7,b-sz*2.1]]);
  var c=blob([[x-sz*1.6,b-sz*2.1],[x-sz*0.8,b-sz*2.6],[x+sz*0.6,b-sz*2.7],[x+sz*1.7,b-sz*2.2],[x+sz*0.4,b-sz*1.95],[x-sz*0.6,b-sz*1.95]],5);bg.push(poly(c));H(bg,c,1.8,10);return bg;}

S('Lion on a rock',['King of the Kopje','Afternoon Watch','Mane in the Wind','Lord of the Long Grass','Golden Hour Lookout'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,168,174),rx=RR(R,120,160),rt=gy-RR(R,38,46),sc=RR(R,1.25,1.4),ox=rx-6,oy=rt+4;
  var rock=blob([[rx-80,gy],[rx-74,rt+18],[rx-50,rt+2],[rx,rt-2],[rx+50,rt+4],[rx+78,rt+20],[rx+86,gy]],6);
  var body=beast(s,sol,[[-48,-46],[-30,-52],[0,-50],[24,-54],[34,-46],[36,-30],[30,-26],[31,0],[22,0],[21,-22],[8,-25],[-20,-25],[-25,-22],[-25,0],[-34,0],[-36,-22],[-44,-26],[-50,-36]],ox,oy,sc,1,4);
  belly(s,body,oy-34*sc,1.8,30);
  var mc=[ox+38*sc,oy-58*sc],mane=scallop(mc[0],mc[1],20*sc,22*sc,16,0.14);mane.pop();SOL(s,sol,mane);var face=EP(mc[0]+8*sc,mc[1]+2*sc,10*sc,12*sc);s.push(poly(face));HX(s,[mane,face],1.4,RR(R,40,70));
  s.push(circle(mc[0]+10*sc,mc[1]-3*sc,1.3*sc));s.push([[mc[0]+15*sc,mc[1]+4*sc],[mc[0]+18*sc,mc[1]+5*sc],[mc[0]+15*sc,mc[1]+8*sc],[mc[0]+10*sc,mc[1]+9*sc]]);s.push(arc(mc[0]+2*sc,mc[1]-12*sc,3*sc,3*sc,PI,TAU));
  var tl=curve(M([[-48,-44],[-62,-36],[-66,-20],[-60,-8]],ox,oy,sc,1),6);s.push(tl);var tf=EP(tl[tl.length-1][0],tl[tl.length-1][1]+3,3*sc,4*sc);FS(s,sol,tf,0.8,0);
  [-30,-18,24].forEach(function(x){s.push([[ox+x*sc,oy],[ox+(x+4)*sc,oy]]);});
  SOL(s,sol,rock);var rh=[];H(rh,rock,RR(R,2.4,3),RR(R,30,60));behind(s,rh,[body,mane]);s.push([[rx-40,rt+20],[rx-20,rt+30],[rx-24,rt+42]]);
  acacia(bg,RR(R,30,60),gy-4,RR(R,16,20));bg.push(tufts(4,296,gy,6,R));return outdoor(s,R,bg,sol,gy,RR(R,10,18));});

S('Koala in a eucalyptus',['Fork of the Gum Tree','Sleepy Grip','Leaves for Dinner','Grey Ears, Grey Bark','Twenty Hours of Sleep'],function(R){
  var s=[],sol=[],bg=[],tx=RR(R,130,160),sc=RR(R,1.1,1.25);
  var trunk=tube(curve([[tx-10,196],[tx-4,140],[tx+4,90],[tx+2,40],[tx+10,4]],6),function(u){return 15-6*u;});SOL(s,sol,trunk.P);
  var br=tube(curve([[tx+4,92],[tx+40,70],[tx+90,58],[tx+140,40]],6),function(u){return 6-3.5*u;});
  var kx=tx-18*sc,ky=110;var body=beast(s,sol,[[0,-30],[12,-36],[24,-30],[28,-10],[22,8],[6,14],[-6,8],[-8,-12]],kx,ky,sc,1,5);
  var hc=[kx+14*sc,ky-44*sc],head=EP(hc[0],hc[1],16*sc,13*sc);SOL(s,sol,head);
  [-1,1].forEach(function(d){var e=EP(hc[0]+d*15*sc,hc[1]-10*sc,9*sc,8*sc);SOL(s,sol,e);s.push(arc(hc[0]+d*15*sc,hc[1]-10*sc,5*sc,4.5*sc,0,TAU));var fz=[],q=arc(hc[0]+d*15*sc,hc[1]-10*sc,9*sc,8*sc,0,TAU);for(var i=0;i<q.length;i+=3)fz.push(q[i],[hc[0]+d*15*sc+(q[i][0]-hc[0]-d*15*sc)*0.6,hc[1]-10*sc+(q[i][1]-hc[1]+10*sc)*0.6]);s.push(fz);});
  var nose=EP(hc[0]+1*sc,hc[1]+3*sc,4.5*sc,6*sc);FS(s,sol,nose,0.7,0);eye(s,hc[0]-7*sc,hc[1]-1*sc,1.8*sc);eye(s,hc[0]+9*sc,hc[1]-1*sc,1.8*sc);
  H(s,body.filter(function(p){return p[0]<kx+4*sc;}).concat([[kx+4*sc,ky]]),1.6,70);
  var arm=tube(curve([[kx+22*sc,ky-26*sc],[tx+14,ky-28*sc],[tx+16,ky-14*sc]],5),function(){return 3.5*sc;});SOL(s,sol,arm.P);var leg=tube(curve([[kx+18*sc,ky+6*sc],[tx+12,ky+8*sc],[tx+14,ky+16*sc]],5),function(){return 4*sc;});SOL(s,sol,leg.P);
  behind(s,[poly(br.P)],sol);sol.push(br.P);
  var bk=[],d=1;for(var y=8;y<194;y+=RR(R,6,9)){var a=interpY(trunk.L.map(function(p){return [p[1],p[0]];}),y),b=interpY(trunk.R.map(function(p){return [p[1],p[0]];}),y);if(d>0)bk.push([a,y],[a+(b-a)*0.4,y+2],[b,y]);else bk.push([b,y],[a+(b-a)*0.6,y+2],[a,y]);d=-d;}behind(s,[bk],sol.filter(function(P){return P!==trunk.P;}));
  var lv=[];for(var t=0.2;t<1;t+=0.12){var p=lerp([tx+40,70],[tx+140,40],t);for(var k=0;k<2;k++){var e=[p[0]+RR(R,-14,14),p[1]+RR(R,16,30)];leafL(lv,[],p,e,RR(R,3,4),0);}}
  for(var u=0;u<5;u++){var q2=[tx+RR(R,-4,6),RR(R,10,40)];leafL(lv,[],q2,[q2[0]-RR(R,20,40),q2[1]+RR(R,12,24)],3.4,0);}
  behind(s,lv,[body,head]);
  return skyFill(s,194,7.5,5.5,5,sol);});

S('Lemur on a branch',['Ringtail Sunbathing','Striped Tail Down','Morning on the Limb','Amber Eyes','Balance by Tail'],function(R){
  var s=[],sol=[],bg=[],by=RR(R,96,106),sc=RR(R,1.15,1.3),lx=RR(R,120,160);
  var br=tube(curve([[4,by+8],[80,by+2],[180,by+4],[296,by-6]],6),function(u){return 7-2*u;});SOL(s,sol,br.P);
  var body=beast(s,sol,[[-24,-6],[-26,-26],[-14,-40],[6,-42],[18,-30],[20,-8],[10,2],[-14,2]],lx,by-6,sc,1,5);
  var hc=[lx+14*sc,by-6-50*sc],head=blob([[hc[0]-12*sc,hc[1]-2*sc],[hc[0]-6*sc,hc[1]-12*sc],[hc[0]+8*sc,hc[1]-10*sc],[hc[0]+24*sc,hc[1]+2*sc],[hc[0]+8*sc,hc[1]+8*sc],[hc[0]-8*sc,hc[1]+8*sc]],5);SOL(s,sol,head);
  [-1,1].forEach(function(d){var ex=hc[0]+(d<0?-8:4)*sc,eyP=EP(ex,hc[1]-1*sc,4*sc,3.6*sc);s.push(poly(eyP));H(s,EP(ex,hc[1]-1*sc,1.6*sc,1.6*sc),0.6,0);});
  s.push([[hc[0]+22*sc,hc[1]+1*sc],[hc[0]+24*sc,hc[1]+2*sc]]);[-1,1].forEach(function(d){s.push([[hc[0]-6*sc+d*3*sc,hc[1]-10*sc],[hc[0]-8*sc+d*5*sc,hc[1]-18*sc],[hc[0]-2*sc+d*4*sc,hc[1]-12*sc]]);});
  HX(s,[EP(hc[0]+4*sc,hc[1]+3*sc,9*sc,3*sc)],1,0);
  var tsp=curve([[lx-22*sc,by-4],[lx-40*sc,by+20],[lx-30*sc,by+60],[lx-44*sc,by+90]],8),tl=tube(tsp,function(u){return 6*sc*(1-0.3*u);});SOL(s,sol,tl.P);
  var nb=12;for(var i=0;i<nb;i+=2){var a=Math.floor(i/nb*(tsp.length-1)),b=Math.floor((i+1)/nb*(tsp.length-1));var band=tl.L.slice(a,b+1).concat(tl.R.slice().reverse().slice(a,b+1).reverse());H(s,band,1.1,0);}
  [[0.2,0],[0.6,0]].forEach(function(f){var x=lx+(f[0]*40-12)*sc;s.push([[x,by-8],[x-3*sc,by-1],[x+4*sc,by]]);});
  H(s,body.filter(function(p){return p[1]>by-6-20*sc;}),1.8,40);
  var lv=[];for(var k=0;k<7;k++){var p=lerp([4,by+6],[296,by-4],RR(R,0,1));if(Math.abs(p[0]-lx)<40)continue;leafL(lv,[],p,[p[0]+RR(R,-20,20),p[1]-RR(R,18,30)],4,1.4);}
  var vine=[];for(var v=0;v<3;v++){var vx=RR(R,20,280);if(Math.abs(vx-lx)>50)vine.push(wave(vx-1,vx+1,0,0,1,0).length?curve([[vx,by],[vx+6,by+40],[vx-4,by+80],[vx+2,190]],6):[]);}
  behind(s,lv.concat(vine),sol);behind(s,[rows(4,296,by+16,194,RR(R,4.5,5.5))],sol);
  return skyFill(s,194,7.5,5.5,5,sol);});

S('Warthog',['Tusks and Whiskers','Kneeling to Graze','Tail Up, Running','Mud Spa Regular','Handsome Enough'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,166,172),sc=RR(R,1.5,1.7),ox=RR(R,130,160);
  var body=beast(s,sol,[[-50,-30],[-40,-50],[-10,-56],[20,-52],[34,-44],[40,-30],[30,-22],[30,0],[22,0],[20,-18],[-28,-18],[-30,0],[-38,0],[-40,-18],[-48,-22]],ox,gy,sc,1,4);
  var hd=blob(M([[30,-48],[44,-52],[58,-44],[68,-30],[72,-14],[62,-10],[50,-18],[36,-22]],ox,gy,sc,1),5);SOL(s,sol,hd);
  s.push(curve(M([[60,-16],[66,-22],[70,-32],[66,-40]],ox,gy,sc,1),5));s.push(curve(M([[54,-18],[58,-24],[60,-30]],ox,gy,sc,1),5));
  s.push(EP(ox+50*sc,gy-38*sc,2.4*sc,2.4*sc).concat([[ox+50*sc+2.4*sc,gy-38*sc]]));s.push(arc(ox+57*sc,gy-30*sc,3*sc,2*sc,PI,TAU));s.push(arc(ox+42*sc,gy-32*sc,3*sc,2*sc,PI,TAU));
  s.push(M([[36,-50],[34,-60],[40,-52]],ox,gy,sc,1));var mane=[],mp=M([[-30,-54],[-10,-58],[10,-56],[30,-52]],ox,gy,sc,1);for(var i=0;i<16;i++){var q=lerp(mp[0],mp[3],i/15);mane.push(q,[q[0]-2,q[1]-RR(R,5,9)]);}s.push(mane);
  s.push(curve(M([[-50,-30],[-58,-40],[-60,-56]],ox,gy,sc,1),5));s.push(M([[-62,-58],[-60,-52],[-57,-59]],ox,gy,sc,1));
  H(s,body.filter(function(p){return p[1]>gy-32*sc;}),1.7,30);H(s,M([[44,-52],[58,-44],[64,-34],[50,-36],[40,-44]],ox,gy,sc,1),1.5,70);
  [-38,-30,22,30].forEach(function(x){s.push([[ox+(x-2)*sc,gy],[ox+(x+3)*sc,gy]]);});
  var mud=EP(ox-20,gy+14,90,10);s.push(poly(mud));clipIn(s,[waterS(R,4,296,gy+6,gy+24,3.6,0.7)],mud,[body]);
  acacia(bg,RR(R,30,60),gy-2,RR(R,15,19));bg.push(tufts(4,296,gy,6,R));return outdoor(s,R,bg,sol,gy,RR(R,10,16));});

S('Iguana on a rock',['Spines in the Sun','Basking Dragon','Green Stillness','Dewlap and Crest','Warm Stone'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,170,176),rx=RR(R,140,160),rt=gy-RR(R,40,50),sc=RR(R,1.35,1.5),ox=rx-30,oy=rt+2;
  var rock=blob([[rx-110,gy],[rx-100,rt+14],[rx-50,rt+2],[rx+40,rt],[rx+100,rt+10],[rx+120,gy]],6);
  var top=M([[-40,-8],[-30,-18],[-6,-24],[20,-24],[34,-30],[46,-34],[58,-30],[62,-24]],ox,oy,sc,1),bot=M([[62,-20],[50,-14],[40,-8],[30,-6],[10,-4],[-20,-2],[-40,-2]],ox,oy,sc,1);
  var tailT=curve(M([[-40,-8],[-60,-6],[-80,0],[-96,6],[-108,4]],ox,oy,sc,1),6),tailB=curve(M([[-108,4],[-96,8],[-80,4],[-60,2],[-40,-2]],ox,oy,sc,1),6);
  var body=curve(top,6).concat(bot.length?curve(bot,6):[]).concat(tailB).concat(tailT.slice().reverse());SOL(s,sol,body);
  s.push(spikes(curve(M([[-30,-18],[-6,-24],[20,-24],[34,-30],[46,-34]],ox,oy,sc,1),5),2,4*sc,1));
  var dew=blob(M([[48,-14],[46,-6],[40,0],[36,-6],[40,-10]],ox,oy,sc,1),4);s.push(poly(dew));H(s,dew,1,90);
  eye(s,ox+50*sc,oy-27*sc,2*sc);s.push(circle(ox+44*sc,oy-18*sc,2.4*sc));
  [[-22,-2,-30,10],[-16,-2,-8,10],[26,-6,20,8],[34,-8,42,8]].forEach(function(l){var a=[ox+l[0]*sc,oy+l[1]*sc],b=[ox+l[2]*sc,oy+l[3]*sc];s.push([a,b]);s.push([[b[0]-4,b[1]+1],b,[b[0]+4,b[1]+1],b,[b[0],b[1]+4]]);});
  var sc2=[],rr=curve(M([[-38,-10],[-6,-16],[20,-16],[40,-20]],ox,oy,sc,1),5);for(var b2=0;b2<rr.length;b2+=2){var p=rr[b2];sc2.push(p,[p[0]+2,p[1]-4],[p[0]+4,p[1]]);}s.push(sc2);
  var tb=[],tc=curve(M([[-44,-4],[-60,-3],[-80,2],[-100,5]],ox,oy,sc,1),6);for(var i=0;i<tc.length;i+=3){var q=tc[i];tb.push([q[0],q[1]-3*sc*(1-i/tc.length)],[q[0],q[1]+3*sc*(1-i/tc.length)]);}s.push(serp(tb.map(function(_,j,a){return j%2?null:[a[j],a[j+1]];}).filter(Boolean)));
  SOL(s,sol,rock);var rh=[];H(rh,rock,RR(R,2.1,2.5),RR(R,20,50));behind(s,rh,[body]);
  bg.push(tufts(4,296,gy,5,R));return outdoor(s,R,bg,sol,gy,RR(R,10,18));});

S('Harvest mouse on wheat',['Tiny Climber','Ears of Gold','Tail for a Hand','Late Summer Stalks','Field Edge Acrobat'],function(R){
  var s=[],sol=[],bg=[],sc=RR(R,1.6,1.8),n=RI(R,5,7),st=[],mx=RR(R,130,160),my=RR(R,98,108);
  for(var i=0;i<n;i++){var x0=30+i*(240/(n-1))+RR(R,-10,10),lean=RR(R,-18,18),top=[x0+lean,RR(R,30,60)];st.push({b:[x0,196],t:top});}
  var main={b:[mx-4,196],t:[mx+6,RR(R,26,34)]};st.push(main);
  st.forEach(function(q){var c=[(q.b[0]+q.t[0])/2+RR(R,-6,6),(q.b[1]+q.t[1])/2];var stem=quad(q.b,c,q.t,16);s.push(stem);
    var ear=[],L=40,dx=(q.t[0]-c[0]),dy=(q.t[1]-c[1]),l=Math.hypot(dx,dy),ux=dx/l,uy=dy/l;for(var k=0;k<9;k++){var p=[q.t[0]+ux*k*4.4,q.t[1]+uy*k*4.4];ear.push(p,[p[0]-uy*4-ux*3,p[1]+ux*4-uy*3],[p[0]+ux*1.5,p[1]+uy*1.5],[p[0]+uy*4-ux*3,p[1]-ux*4-uy*3],[p[0]+ux*2.2,p[1]+uy*2.2]);}s.push(ear);
    var awn=[];for(var a=0;a<9;a+=2){var p2=[q.t[0]+ux*a*4.4,q.t[1]+uy*a*4.4];awn.push(p2,[p2[0]+ux*14-uy*6,p2[1]+uy*14+ux*6],p2);}s.push(awn);
    var lf=lerp(q.b,q.t,RR(R,0.35,0.6));s.push(quad(lf,[lf[0]+RR(R,10,20)*sgn(R),lf[1]-10],[lf[0]+RR(R,20,34)*sgn(R),lf[1]+12],10));});
  var body=beast(s,sol,[[-14,0],[-16,-12],[-6,-20],[10,-20],[20,-12],[26,-4],[18,4],[0,6]],mx,my,sc,1,5);
  var hd=[mx+26*sc,my-6*sc];s.push(circle(hd[0]-2*sc,hd[1]-8*sc,4*sc));H(s,EP(hd[0]-2*sc,hd[1]-8*sc,2.4*sc,2.4*sc),0.9,0);eye(s,hd[0]+3*sc,hd[1]-3*sc,1.5*sc);s.push([[hd[0]+8*sc,hd[1]+1*sc],[hd[0]+10*sc,hd[1]+1.4*sc]]);
  s.push([[hd[0]+9*sc,hd[1]],[hd[0]+16*sc,hd[1]-3*sc],[hd[0]+9*sc,hd[1]+1],[hd[0]+16*sc,hd[1]+3*sc]]);
  H(s,body.filter(function(p){return p[1]<my-6*sc;}),1.4,30);
  s.push([[mx+12*sc,my+4*sc],[mx+8,my+16],[main.b[0]+(main.t[0]-main.b[0])*0.45,my+18]]);s.push([[mx-6*sc,my+5*sc],[mx-4,my+18]]);
  var tl=[[mx-14*sc,my-2*sc]];for(var t=0;t<=1;t+=0.04){var a2=t*TAU*1.6;tl.push([mx-14*sc-18*t*sc+5*Math.cos(a2),my+14*t*sc+18*t+5*Math.sin(a2)]);}s.push(tl);
  var gr=[];gr.push(grass(4,296,192,10,6,R));behind(s,gr,sol);
  return skyFill(s,194,7.5,5.5,5,sol);});

S('Farmyard goose',['Guarding the Gate','Honk at Strangers','White Wings, Orange Bill','Strutting the Yard','Boss of the Barn'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,168,174),sc=RR(R,1.4,1.55),ox=RR(R,120,150);
  var body=beast(s,sol,[[-50,-30],[-30,-46],[0,-48],[20,-42],[30,-30],[26,-18],[6,-10],[-24,-12],[-44,-18],[-60,-24]],ox,gy-14*sc,sc,1,5);
  var nk=tube(curve(M([[18,-40],[24,-60],[22,-80],[28,-94]],ox,gy-14*sc,sc,1),6),function(u){return 6*sc*(1-0.25*u);});SOL(s,sol,nk.P);
  var hc=M([[32,-96]],ox,gy-14*sc,sc,1)[0],head=EP(hc[0],hc[1],8*sc,6*sc);SOL(s,sol,head);var bill=[[hc[0]+6*sc,hc[1]-2*sc],[hc[0]+20*sc,hc[1]+1*sc],[hc[0]+6*sc,hc[1]+4*sc]];FS(s,sol,bill,0.9,0);eye(s,hc[0]+2*sc,hc[1]-1.5*sc,1.5*sc);
  var w=[],wp=M([[-40,-30],[-20,-38],[4,-38],[14,-30]],ox,gy-14*sc,sc,1);for(var r=0;r<3;r++){var row=[];for(var i=0;i<6;i++){var a=lerp(lerp(wp[0],wp[3],i/6),lerp(wp[0],wp[3],(i+1)/6),0);var b=lerp(wp[0],wp[3],(i+1)/6);row=row.concat(arc((a[0]+b[0])/2,a[1]+r*7*sc,(b[0]-a[0])/2,4*sc,0,PI).reverse());}w.push(row);}s.push(serp(w));
  s.push(M([[-50,-30],[-64,-34],[-58,-26]],ox,gy-14*sc,sc,1));
  [[-6,-10],[8,-11]].forEach(function(l){var a=[ox+l[0]*sc,gy-14*sc+l[1]*sc+2],b=[a[0]+2,gy];var leg=[[a[0]-1.5,a[1]],[b[0]-1.5,b[1]-3],[b[0]-8,b[1]],[b[0]+9,b[1]],[b[0]+1.5,b[1]-3],[a[0]+1.5,a[1]]];FS(s,sol,leg,0.8,90);});
  H(s,body.filter(function(p){return p[1]>gy-14*sc-22*sc;}),1.8,30);
  var bx=RR(R,200,240),bw=RR(R,70,90),bt=gy-RR(R,80,96),barn=[[bx,gy],[bx,bt+24],[bx+bw/2,bt],[bx+bw,bt+24],[bx+bw,gy]];bg.push(barn);bg.push(rect(bx+bw*0.25,gy-46,bx+bw*0.75,gy));bg.push([[bx+bw*0.25,gy-46],[bx+bw*0.75,gy],[bx+bw*0.5,gy-23],[bx+bw*0.75,gy-46],[bx+bw*0.25,gy]]);
  H(bg,[[bx,gy],[bx,bt+24],[bx+bw/2,bt],[bx+bw,bt+24],[bx+bw,gy]],RR(R,5,6),90);
  var f=[[4,gy-24]];for(var x=4;x<bx;x+=22)f.push([x,gy-24],[x,gy],[x,gy-24]);f.push([bx,gy-24]);bg.push(f);bg.push([[4,gy-12],[bx,gy-12]]);
  bg.push(tufts(4,296,gy,4,R));return outdoor(s,R,bg,sol,gy,RR(R,10,16));});

S('Wren on a log',['Loud Little Bird','Tail Cocked High','Mossy Perch','Brown as Bark','Song Bigger Than Him'],function(R){
  var s=[],sol=[],bg=[],ly=RR(R,128,136),lr=RR(R,20,24),x0=RR(R,30,50),x1=RR(R,230,260),sc=RR(R,1.7,1.9),bx=RR(R,130,160),by=ly-lr;
  var log=[[x0,ly-lr],[x1,ly-lr-4]].concat(arc(x1,ly-2,lr*0.5,lr+1,-PI/2,PI/2).slice(1)).concat([[x0,ly+lr]]);SOL(s,sol,log);
  var end=EP(x0,ly,lr*0.5,lr);s.push(poly(end));s.push(spiral(x0,ly,1,lr*0.45,4,0).map(function(p){return [x0+(p[0]-x0),ly+(p[1]-ly)*2.1];}));
  var body=beast(s,sol,[[-16,0],[-18,-12],[-8,-22],[8,-24],[18,-18],[20,-8],[10,0]],bx,by,sc,1,5);
  var tail=[[bx-14*sc,by-12*sc],[bx-30*sc,by-36*sc],[bx-24*sc,by-40*sc],[bx-10*sc,by-18*sc]];FS(s,sol,tail);H(s,tail,1.4,RR(R,20,40));
  var bill=[[bx+20*sc,by-16*sc],[bx+28*sc,by-15*sc],[bx+20*sc,by-13*sc]];s.push(bill);eye(s,bx+13*sc,by-17*sc,1.6*sc);s.push([[bx+6*sc,by-20*sc],[bx+15*sc,by-21*sc],[bx+19*sc,by-18*sc]]);
  var wing=blob([[bx-12*sc,by-10*sc],[bx-2*sc,by-18*sc],[bx+8*sc,by-12*sc],[bx-2*sc,by-6*sc]],4);s.push(poly(wing));H(s,wing,1.2,60);
  H(s,body.filter(function(p){return p[1]<by-14*sc;}),1.3,20);
  [-2,6].forEach(function(f){s.push([[bx+f*sc,by],[bx+f*sc,by+3],[bx+(f+4)*sc,by+3]]);});
  var bark=[],d=1;for(var y=ly-lr+6;y<ly+lr;y+=RR(R,4,5.5)){var w2=wave(x0+lr*0.5,x1,y,1,RR(R,12,20),R()*6);if(d<0)w2.reverse();A(bark,w2);d=-d;}clipIn(s,[bark],log,[end,body]);
  var moss=[[x0+20,ly-lr]];for(var x=x0+20;x<x1-20;x+=6)moss.push([x+3,ly-lr-3-R()*3],[x+6,ly-lr-1]);behind(s,[moss],[body]);
  var gy=ly+lr+4;bg.push(grass(4,296,gy,8,5,R));var ff=[];for(var f2=0;f2<3;f2++){var fx=RR(R,20,280);ff.push(curve([[fx,gy],[fx+10,gy-40],[fx+30,gy-60]],6));}A(bg,ff);
  gnd(bg,R,gy);behind(s,bg,sol);return skyFill(s,gy-2,7.5,5.5,5,sol);});

S('Ibis wading',['Curved Bill Probing','Shallows at Dawn','Long Legs, Still Water','Marsh Walker','Reflection of a Hook'],function(R){
  var s=[],sol=[],bg=[],wy=RR(R,138,146),sc=RR(R,1.4,1.55),ox=RR(R,130,160),oy=wy-RR(R,40,48);
  var body=beast(s,sol,[[-40,-8],[-26,-22],[0,-26],[20,-20],[26,-10],[14,0],[-14,2],[-34,-2]],ox,oy,sc,1,5);
  var nk=tube(curve(M([[18,-18],[28,-32],[26,-48],[34,-56]],ox,oy,sc,1),6),function(u){return 4*sc*(1-0.2*u);});SOL(s,sol,nk.P);
  var hc=M([[36,-58]],ox,oy,sc,1)[0];var head=EP(hc[0],hc[1],6*sc,5*sc);SOL(s,sol,head);eye(s,hc[0]+1*sc,hc[1]-1*sc,1.3*sc);
  var bill=quad([hc[0]+5*sc,hc[1]],[hc[0]+28*sc,hc[1]+4*sc],[hc[0]+36*sc,hc[1]+26*sc],14),bill2=quad([hc[0]+35*sc,hc[1]+26*sc],[hc[0]+26*sc,hc[1]+7*sc],[hc[0]+5*sc,hc[1]+3*sc],14);s.push(bill.concat(bill2));
  var wingP=M([[-36,-8],[-20,-20],[4,-20],[16,-12],[0,-4],[-20,-2]],ox,oy,sc,1);s.push(blob(wingP,4));H(s,M([[-36,-8],[-20,-14],[0,-12],[-20,-4]],ox,oy,sc,1),1.4,20);
  var tp=[];for(var i=0;i<4;i++){var a=M([[-36+i*4,-6]],ox,oy,sc,1)[0];tp.push(a,[a[0]-10*sc,a[1]+4*sc],[a[0]+2,a[1]]);}s.push(tp);
  [[-4,2,-18,wy+6],[6,1,20,wy+4]].forEach(function(l){var a=[ox+l[0]*sc,oy+l[1]*sc],b=[ox+l[2]*sc,l[3]];var kn=lerp(a,b,0.5);s.push([a,[kn[0]+3,kn[1]],b]);s.push([[b[0]-6,b[1]+1],b,[b[0]+6,b[1]+1]]);});
  s.push([[4,wy],[296,wy]]);var water=[[4,wy],[296,wy],[296,196],[4,196]];var refl=[];var bp=body.map(function(p){return [p[0],2*wy-p[1]+12];});
  var rf=[],d=1;for(var y=wy+16;y<wy+60;y+=3){var xs=bp.filter(function(p){return Math.abs(p[1]-y)<1.6;}).map(function(p){return p[0];});if(xs.length>1){var a2=Math.min.apply(null,xs),b2=Math.max.apply(null,xs);rf.push(d>0?[[a2,y],[a2+(b2-a2)*0.3,y]]:[[b2,y],[b2-(b2-a2)*0.3,y]]);d=-d;}}A(s,rf);
  waterIn(s,R,water,wy+5,194,RR(R,5,6),[]);
  var rd=[];for(var k=0;k<RI(R,12,18);k++){var rx=RR(R,6,294);if(Math.abs(rx-ox)<60)continue;var h=RR(R,30,70);rd.push(quad([rx,wy],[rx+RR(R,-6,6),wy-h*0.5],[rx+RR(R,-10,10),wy-h],8));if(R()<0.5)rd.push(lens([rx,wy-h*0.75],[rx+1,wy-h-8],2.4));}behind(s,rd,sol);
  hills(bg,R,wy-2,RR(R,12,20),5);behind(s,bg,sol);return skyFill(s,wy-2,7.5,5.5,5,sol);});

S('Kiwi bird',['Night Forager','All Nose, No Wings','Fern Floor Wanderer','Shaggy and Round','Sniffing for Worms'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,168,174),sc=RR(R,1.6,1.8),ox=RR(R,120,150);
  var body=beast(s,sol,[[-40,-20],[-34,-42],[-10,-52],[16,-48],[30,-34],[32,-20],[20,-8],[-10,-4],[-34,-8]],ox,gy-10*sc,sc,1,6);
  var hc=M([[34,-32]],ox,gy-10*sc,sc,1)[0];s.push(circle(hc[0],hc[1],5*sc));eye(s,hc[0]+1*sc,hc[1]-1.5*sc,1.1*sc);
  var bill=quad([hc[0]+4*sc,hc[1]+1*sc],[hc[0]+22*sc,hc[1]+12*sc],[hc[0]+28*sc,gy-1],10);s.push(bill);s.push([[hc[0]+4*sc,hc[1]+3*sc],[hc[0]+20*sc,hc[1]+14*sc],[hc[0]+27*sc,gy-1]]);
  var sh=[],ins=M([[-30,-20],[-28,-36],[-8,-44],[12,-40],[22,-30]],ox,gy-10*sc,sc,1);for(var r=0;r<5;r++){var row=[];for(var i=0;i<24;i++){var t=i/23,p=lerp(lerp(ins[0],ins[2],t),lerp(ins[2],ins[4],t),t);var q=[p[0],p[1]+r*6*sc];row.push(q,[q[0]-1.5,q[1]+4]);}sh.push(row);}clipIn(s,[serp(sh)],body);
  H(s,body.filter(function(p){return p[1]>gy-10*sc-18*sc;}),1.5,25);
  [[-6,-4],[8,-6]].forEach(function(l){var a=[ox+l[0]*sc,gy-10*sc+l[1]*sc],b=[a[0]+3,gy];s.push([a,b]);s.push([[b[0]-7,b[1]],b,[b[0]+7,b[1]],b,[b[0]+2,b[1]-3]]);});
  var fn=[];for(var k=0;k<RI(R,3,4);k++){var fx=RR(R,10,290);if(Math.abs(fx-ox)<70)continue;var sp=curve([[fx,gy],[fx+RR(R,-10,10),gy-40],[fx+RR(R,10,30),gy-70]],8),fp=[];sp.forEach(function(p,i){if(i%2)return;var len=10*(1-i/sp.length)+3;fp.push(p,[p[0]-len,p[1]+len*0.3],p,[p[0]+len,p[1]+len*0.1],p);});fn.push(fp);}
  for(var tr=0;tr<3;tr++){var tx=RR(R,10,290);if(Math.abs(tx-ox)<60)continue;fn.push([[tx-6,gy],[tx-5,4]]);fn.push([[tx+6,gy],[tx+5,4]]);}
  fn.push(EP(RR(R,40,260),gy-4,1,1).length?[[4,gy],[296,gy]]:[]);behind(s,fn,sol);var lit=[],d=1;for(var y=gy+5;y<196;y+=RR(R,5,6)){var r2=bumps(4,296,y,1.6,RR(R,6,10));if(d<0)r2.reverse();A(lit,r2);d=-d;}s.push(lit);
  return skyFill(s,gy-2,7,5.5,5,sol);});

// rounded rectangle outline
function rrect(x0,y0,x1,y1,r){return arc(x1-r,y0+r,r,r,-PI/2,0).concat(arc(x1-r,y1-r,r,r,0,PI/2)).concat(arc(x0+r,y1-r,r,r,PI/2,PI)).concat(arc(x0+r,y0+r,r,r,PI,1.5*PI));}
// a fruit-like oval with a crease and a shaded crescent
function fruit(s,sol,cx,cy,rx,ry,g,side){var P=EP(cx,cy,rx,ry);SOL(s,sol,P);s.push(quad([cx-rx*0.1,cy-ry],[cx+rx*0.25,cy],[cx-rx*0.05,cy+ry*0.9],8));shadeE(s,cx,cy,rx,ry,g||1.3,70,side||1,0.35);return P;}
function peaksMini(x,y,w){return [[x,y],[x+w*0.3,y-18],[x+w*0.5,y-8],[x+w*0.7,y-22],[x+w,y]];}
function room2(s,R,fy,sol){return room(s,R,fy,sol,'stripes');}

S('Water strider on a pond',['Walking on Water','Six Dimples','Surface Tension','Pond Skater','Light Feet'],function(R){
  var s=[],sol=[],cx=RR(R,135,165),cy=RR(R,92,108),a=RR(R,-0.3,0.3);
  var body=rotateAbout(lens([cx-34,cy],[cx+30,cy],5),cx,cy,a);SOL(s,sol,body);var head=rotateAbout(EP(cx+36,cy,6,4.5),cx,cy,a);SOL(s,sol,head);H(s,body,1.2,a*180/PI+80);
  var eyes=rotateAbout([[cx+38,cy-4]],cx,cy,a)[0];s.push(circle(eyes[0],eyes[1],1.6));
  var ant=rotateAbout([[cx+40,cy-2],[cx+58,cy-10]],cx,cy,a);s.push(ant);s.push(rotateAbout([[cx+40,cy+2],[cx+58,cy+10]],cx,cy,a));
  var legs=[[[cx+22,cy-3],[cx+34,cy-16],[cx+44,cy-18]],[[cx+22,cy+3],[cx+34,cy+16],[cx+44,cy+18]],[[cx+6,cy-4],[cx-10,cy-60],[cx+30,cy-86]],[[cx+6,cy+4],[cx-10,cy+60],[cx+30,cy+86]],[[cx-4,cy-4],[cx-50,cy-40],[cx-120,cy-48]],[[cx-4,cy+4],[cx-50,cy+40],[cx-120,cy+52]]];
  var dimp=[];legs.forEach(function(l,i){var L=rotateAbout(l,cx,cy,a);s.push(L);var e=L[2];if(i>1){var D=EP(e[0],e[1],5,3.4);SOL(s,sol,D);s.push(spiral(e[0],e[1],6,16,2.5,0).map(function(p){return [p[0],e[1]+(p[1]-e[1])*0.7];}));dimp.push(EP(e[0],e[1],17,12));}});
  var pads=[];for(var k=0;k<RI(R,2,3);k++){var px=k%2?RR(R,230,270):RR(R,30,70),py=k?RR(R,40,70):RR(R,140,170),pr=RR(R,20,28),P=arc(px,py,pr,pr*0.8,0.25,TAU-0.05).concat([[px,py]]);SOL(s,sol,P);var v=[];for(var j=0;j<7;j++){var an=0.5+j*0.8;v.push([px,py],[px+pr*0.9*Math.cos(an),py+pr*0.72*Math.sin(an)]);}s.push(v);pads.push(P);}
  var w=waterS(R,4,296,6,194,RR(R,4.6,5.4),1);behind(s,[w],sol.concat(dimp));
  var rd=[];for(var r=0;r<5;r++){var rx=RR(R,240,292);rd.push([[rx,196],[rx+RR(R,-8,8),RR(R,150,175)]]);}behind(s,rd,sol);return s;});

S('Prawn',['Whiskers Longer Than Me','Curled in the Current','Rock Pool Glass','Little Armour','Feelers Forward'],function(R){
  var s=[],sol=[],cx=RR(R,140,160),cy=RR(R,104,112),Ro=RR(R,70,78),Ri=Ro*0.55,a0=-0.25,a1=PI*0.9,ry=0.8;
  function P(a,r){return [cx+r*Math.cos(a+PI),cy-r*Math.sin(a+PI)*ry*-1];}
  function pt(a,r){return [cx+r*Math.cos(a),cy-r*Math.sin(a)*ry];}
  var outer=[],inner=[];for(var i=0;i<=40;i++){var a=a0+(a1-a0)*i/40,w=i<14?1:1-(i-14)/26*0.45;outer.push(pt(a,Ri+(Ro-Ri)*(0.5+0.5*w)));inner.push(pt(a,Ri+(Ro-Ri)*(0.5-0.5*w)));}
  var body=outer.concat(inner.slice().reverse());SOL(s,sol,body);
  var seg=[],d=1;for(var k=14;k<40;k+=4){if(d>0)seg.push(outer[k],inner[k]);else seg.push(inner[k],outer[k]);d=-d;}s.push(seg);
  H(s,outer.slice(0,15).concat(inner.slice(0,15).reverse()),1.5,RR(R,20,50));
  var tO=outer[40],tI=inner[40],tm=lerp(tO,tI,0.5),dir=[tm[0]-pt(a1-0.1,(Ro+Ri)/2)[0],tm[1]-pt(a1-0.1,(Ro+Ri)/2)[1]],l=Math.hypot(dir[0],dir[1]);dir=[dir[0]/l,dir[1]/l];var nrm=[-dir[1],dir[0]];
  var fan=[tO,[tm[0]+dir[0]*18+nrm[0]*14,tm[1]+dir[1]*18+nrm[1]*14],[tm[0]+dir[0]*22,tm[1]+dir[1]*22],[tm[0]+dir[0]*18-nrm[0]*14,tm[1]+dir[1]*18-nrm[1]*14],tI];FS(s,sol,fan);s.push([tm,fan[1]]);s.push([tm,fan[2]]);s.push([tm,fan[3]]);
  var hO=outer[0],hI=inner[0],hm=lerp(hO,hI,0.5);s.push([hO,[hm[0]+34,hm[1]-16],[hm[0]+4,hm[1]-2]]);s.push(circle(hm[0]-2,hm[1]-6,3.4));H(s,EP(hm[0]-2,hm[1]-6,2,2),0.7,0);
  [0,1].forEach(function(i){s.push(curve([hm,[hm[0]+40,hm[1]-30-i*24],[hm[0]+90,hm[1]-40-i*14],[296,hm[1]-RR(R,10,60)-i*30]],8));});
  s.push(curve([hI,[hI[0]+30,hI[1]+20],[hI[0]+70,hI[1]+28],[292,hI[1]+RR(R,20,50)]],8));
  var lg=[];for(var j=2;j<30;j+=3){var p=inner[j],q=pt(a0+(a1-a0)*j/40,Ri*0.55);lg.push(p,lerp(p,q,j<14?0.9:0.5),p);}s.push(lg);
  var by=RR(R,174,180);var bed=[[4,by]];for(var x=4;x<=296;x+=6)bed.push([x,by+2*Math.sin(x/17)]);s.push(bed);sand(s,R,by+5,5.5);
  rocks(s,sol,R,10,80,by,22,2);var wd=[];for(var q2=0;q2<3;q2++){var wx=RR(R,220,290);wd.push(curve([[wx,by],[wx+8,by-30],[wx-6,by-60],[wx+4,by-RR(R,70,100)]],6));}A(s,wd);
  behind(s,[waterS(R,4,296,6,by-3,RR(R,5,6),1)],sol);return s;});

S('Mussels on a rock',['Blue-Black Cluster','Low Water Harvest','Byssus and Barnacles','Clinging On','Tideline Shellfish'],function(R){
  var s=[],sol=[],rx=RR(R,140,160),ry=RR(R,120,130),wy=RR(R,58,70);
  var rock=blob([[rx-120,196],[rx-116,ry],[rx-80,ry-34],[rx-20,ry-50],[rx+50,ry-46],[rx+104,ry-20],[rx+124,196]],6);
  var ms=[],n=RI(R,8,10);for(var i=0;i<n;i++){var a=RR(R,-0.6,0.6)+(i%2?PI:0)*0.15,mx=rx-70+i*(140/(n-1))+RR(R,-6,6),my=ry-30+RR(R,-10,30)+Math.abs(i-n/2)*4,L=RR(R,26,34),W=L*0.42;
    var P=rotateAbout(blob([[mx,my-L*0.55],[mx+W*0.6,my-L*0.2],[mx+W*0.5,my+L*0.35],[mx,my+L*0.5],[mx-W*0.5,my+L*0.3],[mx-W*0.45,my-L*0.25]],5),mx,my,a+RR(R,-0.4,0.4));
    if(ms.some(function(Q){return pip([mx,my],Q);}))continue;ms.push(P);}
  ms.forEach(function(P){var c=P.reduce(function(a,p){return [a[0]+p[0]/P.length,a[1]+p[1]/P.length];},[0,0]);behind(s,[poly(P)],ms.slice(ms.indexOf(P)+1));});
  ms.forEach(function(P,i){var c=P.reduce(function(a,p){return [a[0]+p[0]/P.length,a[1]+p[1]/P.length];},[0,0]);var lines=[];for(var r=0.75;r>0.3;r-=0.2)lines.push(scaleAbout(P,c[0],c[1],r));var hh=[];H(hh,P,1.1,RR(R,20,160));
    behind(s,lines.concat(hh),ms.slice(i+1));sol.push(P);});
  SOL(s,sol,rock);var rh=[];H(rh,rock,RR(R,3.4,4),RR(R,10,40));behind(s,rh,ms);
  var bn=[];for(var b=0;b<RI(R,6,9);b++){var bx=RR(R,rx-100,rx+100),by=RR(R,ry-10,190);if(!pip([bx,by],rock)||ms.some(function(Q){return pip([bx,by],Q);}))continue;bn.push([[bx-5,by],[bx-2,by-5],[bx+2,by-5],[bx+5,by],[bx-5,by]]);bn.push([[bx-2,by-5],[bx,by-2],[bx+2,by-5]]);}A(s,bn);
  var sw=[];for(var k=0;k<3;k++){var sx=RR(R,rx-110,rx-60);sw.push(curve([[sx,ry-10],[sx-20,ry+20],[sx-10,ry+50],[sx-30,190]],6));}behind(s,sw,ms);
  s.push([[4,wy],[296,wy]]);behind(s,[waterS(R,4,296,wy+4,196,RR(R,5,6),1)],[rock]);return skyFill(s,wy-2,7.5,5.5,5,sol);});

S('Beluga whale',['White Ghost of the Bay','Smiling Under the Ice','Melon Head','Arctic Song','Pale in Green Water'],function(R){
  var s=[],sol=[],cx=RR(R,140,160),cy=RR(R,108,118),sc=RR(R,1.3,1.4);
  var body=beast(s,sol,[[60,-6],[54,-24],[40,-30],[14,-28],[-20,-22],[-60,-12],[-84,-4],[-90,2],[-80,6],[-40,12],[0,16],[34,14],[52,8]],cx,cy,sc,1,6);
  var fl=[[cx+30*sc,cy+10*sc],[cx+14*sc,cy+30*sc],[cx+8*sc,cy+28*sc],[cx+16*sc,cy+10*sc]];FS(s,sol,blob(fl,4));
  var tf=[[cx-88*sc,cy+1*sc],[cx-104*sc,cy-14*sc],[cx-110*sc,cy-10*sc],[cx-100*sc,cy+2*sc],[cx-110*sc,cy+16*sc],[cx-104*sc,cy+18*sc]];FS(s,sol,blob(tf,4));
  s.push(quad([cx+56*sc,cy+2*sc],[cx+48*sc,cy+10*sc],[cx+38*sc,cy+6*sc],8));eye(s,cx+38*sc,cy-6*sc,1.8*sc);s.push(arc(cx+44*sc,cy-24*sc,6*sc,5*sc,-0.8,0.3));
  H(s,body.filter(function(p){return p[1]>cy+4*sc;}),2.2,10);var cr=[];for(var i=0;i<4;i++)cr.push(arc(cx+(10-i*18)*sc,cy-6*sc,4*sc,10*sc,PI*0.6,PI*1.4));A(s,cr);
  var sy=RR(R,26,34);s.push([[4,sy],[296,sy]]);var ice=[],x=4;while(x<290){var w=RR(R,40,80),P=[[x,sy],[x+4,sy-RR(R,8,14)],[x+w*0.5,sy-RR(R,10,16)],[x+w-6,sy-RR(R,6,12)],[Math.min(296,x+w),sy]];bgI(P);x+=w+RR(R,10,30);}
  function bgI(P){SOL(s,sol,P);var d=[P[0],[P[0][0]+2,P[0][1]+RR(R,8,14)],[P[4][0]-2,P[4][1]+RR(R,8,14)],P[4]];s.push(d);H(s,d,1.6,0);sol.push(d);}
  var light=[];for(var l=0;l<5;l++){var lx=RR(R,10,290);light.push([[lx,sy+16],[lx+RR(R,20,40),196]]);}
  behind(s,[waterS(R,4,296,sy+5,196,RR(R,4.6,5.2),0.9)],sol);var bot=[[4,186],[296,186]];s.push(bot);return skyFill(s,sy-2,7.5,6,5,sol);});

S('Hollyhocks by a wall',['Taller Than the Gate','Cottage Spires','Pink Towers in June','Bees Climbing Up','Leaning on the Stones'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,174,180),wy=gy-RR(R,40,48),n=RI(R,3,4);
  for(var i=0;i<n;i++){var x=60+i*(180/(n-1))+RR(R,-10,10),top=RR(R,24,44),stem=quad([x,gy],[x+RR(R,-8,8),(gy+top)/2],[x+RR(R,-6,6),top],16);s.push(stem);
    for(var k=0;k<RI(R,5,6);k++){var t=0.15+k*0.14;if(t>0.92)break;var p=stem[Math.floor((1-t)*16)],r=7.5-k*0.7,side=k%2?1:-1,c=[p[0]+side*(r*0.6),p[1]];var F=scallop(c[0],c[1],r,r,5,0.14);F.pop();SOL(s,sol,F);s.push(circle(c[0],c[1],r*0.3));
      var vv=[];for(var j=0;j<5;j++){var an=j*TAU/5+0.3;vv.push([c[0]+r*0.3*Math.cos(an),c[1]+r*0.3*Math.sin(an)],[c[0]+r*0.85*Math.cos(an),c[1]+r*0.85*Math.sin(an)],[c[0]+r*0.3*Math.cos(an+0.6),c[1]+r*0.3*Math.sin(an+0.6)]);}s.push(vv);if(k%2)shadeE(s,c[0],c[1],r,r,1.2,60,side,0.4);}
    var tp=stem[16];for(var b=0;b<3;b++){var bp=[tp[0]+(b-1)*3,tp[1]+b*5];FS(s,sol,EP(bp[0],bp[1],2.2,3.2),0.8,0);}
    for(var lf=0;lf<2;lf++){var lp=stem[3+lf*2],d=lf?1:-1;var L=blob([[lp[0],lp[1]],[lp[0]+d*12,lp[1]-10],[lp[0]+d*24,lp[1]-4],[lp[0]+d*22,lp[1]+8],[lp[0]+d*8,lp[1]+6]],5);SOL(s,sol,L);s.push([lp,[lp[0]+d*18,lp[1]]]);H(s,L,1.6,40);}}
  var wl=[];wall(wl,R,4,296,gy,gy-wy,RR(R,14,18));behind(s,wl,sol);var cw=[];var cx2=RR(R,20,60);cw.push(rect(cx2,wy-70,cx2+50,wy-10));win(cw,cx2+6,wy-64,38,48,0);cw.push([[4,wy-90],[296,wy-90]]);cw.push(zz(4,296,wy-90,wy,RR(R,11,14)).filter(function(_,i){return true;}));
  var cot=[];cot.push(rect(4,wy-100,296,wy));behind(s,[[[4,wy-100],[296,wy-100]]],sol);var bk=[];bk.push(brickS(4,wy-100,296,wy,RR(R,22,26),RR(R,11,12)));behind(s,bk,sol.concat([RP(cx2,wy-70,cx2+50,wy-10)]));behind(s,[rect(cx2,wy-70,cx2+50,wy-10)],sol);
  var wp=[];win(wp,cx2+4,wy-66,42,52,1.6);behind(s,wp,sol);
  s.push([[4,gy],[296,gy]]);H(s,RP(4,gy,296,196),4.6,12);s.push(tufts(4,296,gy,5,R));
  var rf=[[4,wy-100],[296,wy-100],[296,wy-118],[4,wy-118]];behind(s,[poly(rf)],sol);behind(s,[scallopRows(4,296,wy-116,wy-100,8,4)],sol);return skyFill(s,wy-120,7.5,6,5,sol);});

S('Snowdrops',['First Out of the Frost','Nodding White','February Promise','Bells in the Snow','Three Petals Down'],function(R){
  var s=[],sol=[],gy=RR(R,160,168),n=RI(R,6,8),x0=RR(R,50,80),x1=RR(R,220,250);
  for(var i=0;i<n;i++){var x=x0+(x1-x0)*i/(n-1)+RR(R,-8,8),h=RR(R,70,110),top=[x+RR(R,-10,10),gy-h],tip=[top[0]+RR(R,10,18)*(i%2?1:-1),top[1]+RR(R,8,12)];
    s.push(quad([x,gy],[x,gy-h*0.6],top,12).concat(quad(top,[top[0]+(tip[0]-top[0])*0.8,top[1]-3],tip,6).slice(1)));
    var fl=[tip[0],tip[1]+2],L=RR(R,24,30),pet=[];[-0.5,0,0.5].forEach(function(o,j){var P=lens(fl,[fl[0]+o*L*0.8,fl[1]+L],L*(j===1?0.2:0.3));pet.push(P);});
    var ov=EP(fl[0],fl[1],2.6,3.4);FS(s,sol,ov,0.8,0);pet.forEach(function(P,j){if(j===1)return;SOL(s,sol,P);});behind(s,[poly(pet[1])],sol);sol.push(pet[1]);
    var lf=lens([x,gy],[x+RR(R,-28,28),gy-h*RR(R,0.45,0.7)],RR(R,3,4.2));SOL(s,sol,lf);s.push([[x,gy],lf[Math.floor(lf.length/4)]]);H(s,lf,1.6,70);}
  var snow=[];for(var k=0;k<3;k++)snow.push(EP(RR(R,30,270),gy+RR(R,10,24),RR(R,24,40),RR(R,4,7)));snow.forEach(function(P){s.push(poly(P));});
  s.push([[4,gy],[296,gy]]);var g=[];H(g,RP(4,gy,296,196),5,RR(R,10,20));behind(s,g,snow.concat(sol));
  var lit=[];for(var q=0;q<12;q++){var lx=RR(R,10,290),ly=RR(R,gy+6,192);lit.push(lens([lx,ly],[lx+RR(R,6,10),ly+RR(R,-2,2)],1.8));}behind(s,lit,snow.concat(sol));
  
  behind(s,[rows(4,296,6,gy-3,RR(R,7,8))],sol);return s;});

S('Rhubarb patch',['Pink Stalks, Giant Leaves','Under the Forcing Pot','Crumble Season','Elephant Ears in the Bed','Kitchen Garden Corner'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,166,172),cx=RR(R,120,150),n=RI(R,4,5);
  var px=cx+RR(R,70,90),pot=[[px-22,gy],[px-26,gy-36],[px-20,gy-48],[px+20,gy-48],[px+26,gy-36],[px+22,gy]];SOL(s,sol,pot);s.push([[px-25,gy-30],[px+25,gy-30]]);H(s,[[px+6,gy-48],[px+20,gy-48],[px+26,gy-36],[px+22,gy],[px+8,gy]],1.4,90);
  var lid=EP(px,gy-50,12,3);s.push(poly(lid));s.push(rect(px-4,gy-58,px+4,gy-52));
  var leaves=[];for(var i=0;i<n;i++){var a=-PI/2+(i-(n-1)/2)*0.5+RR(R,-0.1,0.1),L=RR(R,60,80),e=[cx+L*Math.cos(a)*1.1,gy-18+L*Math.sin(a)*0.9];
    var stalk=tube(quad([cx+(i-n/2)*4,gy],[cx+(e[0]-cx)*0.4,gy-20],e,10),function(u){return 3.4-u;});SOL(s,sol,stalk.P);s.push(zz(0,0,0,0,1).length?[]:[]);var st=[];for(var k=1;k<4;k++)st.push(stalk.L.map(function(p,j){return lerp(p,stalk.R[j],k/4);}));A(s,st);
    var Lf=scallop(e[0],e[1]-14,RR(R,30,38),RR(R,20,26),9,0.16);Lf.pop();Lf=rotateAbout(Lf,e[0],e[1]-14,a+PI/2);leaves.push({P:Lf,e:e});}
  leaves.slice().reverse().forEach(function(l,i,arr){var ve=[],c=[l.e[0],l.e[1]-14];for(var j=0;j<7;j++){var an=j*TAU/7;ve.push(l.e,[c[0]+30*Math.cos(an),c[1]+22*Math.sin(an)],l.e);}var hh=[];H(hh,l.P,2.2,RR(R,30,70));
    var above=arr.slice(i+1).map(function(q){return q.P;});behind(s,[poly(l.P)],above);clipIn(s,[ve],l.P,above);if(i%2)clipIn(s,hh,l.P,above);sol.push(l.P);});
  s.push([[4,gy],[296,gy]]);var soil=[],d=1;for(var y=gy+5;y<196;y+=RR(R,5,6)){var r2=bumps(4,296,y,1.6,RR(R,7,11));if(d<0)r2.reverse();A(soil,r2);d=-d;}s.push(soil);
  var f=[[4,gy-40]];for(var x=4;x<296;x+=14)f.push([x,gy-40],[x,gy],[x+3,gy],[x+3,gy-44],[x+6,gy-40]);f.push([296,gy-40]);bg.push(f);bg.push([[4,gy-30],[296,gy-30]]);bg.push([[4,gy-12],[296,gy-12]]);
  behind(s,bg,sol);return skyFill(s,gy-42,7.5,5.5,5,sol);});

S('Balalaika',['Three Strings, Three Corners','Triangle Song','Folk Night','Leaning in the Corner','Before the Dance'],function(R){
  var s=[],sol=[],fy=RR(R,168,174),cx=RR(R,130,160),by=fy-4,bw=RR(R,46,54),bh=RR(R,58,66),tilt=RR(R,-0.18,-0.08);
  var tri=rotateAbout(blob([[cx-bw,by-6],[cx-bw+4,by],[cx+bw-4,by],[cx+bw,by-6],[cx+6,by-bh],[cx-6,by-bh]],4),cx,by,tilt);SOL(s,sol,tri);
  var hole=rotateAbout([[cx,by-bh*0.42]],cx,by,tilt)[0];s.push(circle(hole[0],hole[1],7));s.push(spiral(hole[0],hole[1],8,12,2.2,0));H(s,EP(hole[0],hole[1],6,6),1,0);
  var nb=rotateAbout([[cx-4,by-bh+2],[cx-4,by-bh-78],[cx+4,by-bh-78],[cx+4,by-bh+2]],cx,by,tilt);FS(s,sol,nb);
  var fr=[],d=1;for(var t=0.05;t<1;t+=0.075){var a=lerp(nb[0],nb[1],t),b=lerp(nb[3],nb[2],t);if(d>0)fr.push(a,b);else fr.push(b,a);d=-d;}s.push(fr);
  var hs=rotateAbout([[cx-7,by-bh-78],[cx-8,by-bh-104],[cx,by-bh-108],[cx+8,by-bh-104],[cx+7,by-bh-78]],cx,by,tilt);FS(s,sol,hs,1.2,90);
  var pg=[];[0.25,0.55,0.85].forEach(function(f){var p=lerp(hs[0],hs[1],f),q=lerp(hs[4],hs[3],f);pg.push([p,[p[0]-7,p[1]]],[q,[q[0]+7,q[1]]]);});pg.forEach(function(l){s.push(l);s.push(circle(l[1][0],l[1][1],1.8));});
  var br=rotateAbout([[cx-10,by-16],[cx+10,by-16]],cx,by,tilt);s.push(br);[-3,0,3].forEach(function(o){s.push(rotateAbout([[cx+o,by-8],[cx+o*0.6,by-bh-100]],cx,by,tilt));});
  var ribs=rotateAbout(zz(cx-bw+10,cx+bw-10,by-4,by-10,8),cx,by,tilt);clipIn(s,[ribs],tri);
  H(s,rotateAbout([[cx+bw*0.4,by],[cx+bw-4,by],[cx+bw,by-6],[cx+8,by-bh+4]],cx,by,tilt),1.4,70);
  var st=[];var lx=cx+bw+RR(R,20,30);cyl(s,lx,fy,12,40,1.4,1);sol.push(RP(lx-12,fy-44,lx+12,fy));var fl=[[lx,fy-44],[lx-6,fy-70],[lx+4,fy-74]];s.push(fl);
  var chx=RR(R,30,60);if(chx<cx-bw-30){var seat=RP(chx-20,fy-34,chx+20,fy-28);FS(s,sol,seat,1.2,0);[-17,17].forEach(function(o){FS(s,sol,RP(chx+o-2,fy-28,chx+o+2,fy),0.9,90);});var bk2=RP(chx-20,fy-80,chx-14,fy-34);FS(s,sol,bk2,1,90);s.push(zz(chx-14,chx+18,fy-78,fy-74,32));var bb=RP(chx-14,fy-80,chx+18,fy-72);SOL(s,sol,bb);}
  var pf=RP(cx+bw+50,30,cx+bw+100,70);if(pf[1][0]<292){SOL(s,sol,pf);s.push(rect(cx+bw+55,35,cx+bw+95,65));s.push(peaksMini(cx+bw+55,65,40));}
  room2(s,R,fy,sol);return s.filter(function(x){return x&&x.length>1;});});

S('Bodhran',['Goatskin and Ash','Tipper at Rest','Session Night Drum','Heartbeat Frame','Round as the Moon'],function(R){
  var s=[],sol=[],ty=RR(R,150,158),cx=RR(R,130,165),r=RR(R,52,58),cy=ty+7-r,k=RR(R,0.82,0.9);
  var skin=EP(cx,cy,r*k,r);SOL(s,sol,skin);var rim=EP(cx+9,cy,r*k,r);var side=arc(cx,cy,r*k,r,-PI/2,PI/2).concat(arc(cx+9,cy,r*k,r,PI/2,-PI/2));SOL(s,sol,side);s.push(arc(cx+9,cy,r*k,r,-PI/2,PI/2));H(s,side,1.3,90);
  s.push(arc(cx,cy,r*k-4,r-4,0,TAU));var tk=[],q=arc(cx,cy,r*k-2,r-2,0,TAU);for(var i=0;i<q.length;i+=6)tk.push(q[i],lerp(q[i],[cx,cy],0.03),q[i]);s.push(tk);
  var kn=[];for(var j=0;j<4;j++){var an=j*PI/2+0.4;kn.push(arc(cx+r*k*0.3*Math.cos(an),cy+r*0.3*Math.sin(an),10,10,an+PI*0.6,an+PI*1.4));}A(s,kn);s.push(spiral(cx,cy,1,8,2,0));
  shadeE(s,cx,cy,r*k-4,r-4,2.2,70,-1,0.75);
  var t0=[cx+r*0.7,ty+4],t1=[cx-r*0.8,ty-6];var tp=tube([t0,t1],function(u){return 2+1.6*Math.abs(Math.sin(u*PI*2));});FS(s,sol,tp.P);[t0,t1].forEach(function(p){FS(s,sol,EP(p[0],p[1],4,3.5),1,0);});
  var mx=cx+r+RR(R,30,45);if(mx<280){cyl(s,mx,ty+8,10,26,1.3,1);sol.push(RP(mx-10,ty-21,mx+10,ty+8));s.push(arc(mx+10,ty-8,6,7,-PI/2,PI/2));}
  var sh=[[cx-r-50,ty+8],[cx-r-10,ty+8],[cx-r-4,ty+2],[cx-r-44,ty+2]];if(sh[0][0]>6){SOL(s,sol,sh);s.push(zz(cx-r-46,cx-r-12,ty+3,ty+7,3));}
  onT(s,R,ty+8,sol);return s;});

// log end with growth rings (one spiral) and bark ring
function logEnd(s,sol,cx,cy,rx,ry){var P=EP(cx,cy,rx,ry);SOL(s,sol,P);s.push(spiral(cx,cy,0.8,Math.min(rx,ry)*0.85,Math.max(2,Math.round(rx/3.5)),0).map(function(p){return [cx+(p[0]-cx),cy+(p[1]-cy)*ry/rx];}));return P;}
// horizontal log: body to the right of its end ellipse
function logH(s,sol,x,cy,r,L,g){var body=[[x,cy-r],[x+L,cy-r]].concat(arc(x+L,cy,r*0.45,r,-PI/2,PI/2).slice(1)).concat([[x,cy+r]]);SOL(s,sol,body);var bk=[];for(var y=cy-r+3;y<cy+r;y+=g||4)bk.push(wave(x,x+L,y,0.8,RR2(y),y));clipIn(s,[serp(bk)],body);logEnd(s,sol,x,cy,r*0.45,r);return body;}
function RR2(y){return 10+(Math.abs(Math.sin(y))*10);}

S('Pliers and wire coil',['Snip and Twist','Fence Mending Kit','Copper Spiral','Grip Like a Jaw','Spare Wire'],function(R){
  var s=[],sol=[],ty=RR(R,138,146),pv=[RR(R,140,170),ty-RR(R,22,30)],a=RR(R,-0.5,-0.3);
  function rp(pts){return rotateAbout(pts.map(function(p){return [pv[0]+p[0]*1.45,pv[1]+p[1]*1.45];}),pv[0],pv[1],a);}
  var j1=rp([[0,-5],[30,-6],[56,-2],[58,0],[30,0],[0,0]]),j2=rp([[0,0],[30,0],[58,0],[56,3],[30,6],[0,5]]);FS(s,sol,j1,1.2,a*180/PI+60);SOL(s,sol,j2);
  var ser=[],q=rp([[24,0]])[0],q2=rp([[54,0]])[0];for(var i=0;i<=12;i++){var p=lerp(q,q2,i/12);ser.push(p,[p[0]+(i%2?2:-2)*Math.sin(a),p[1]+(i%2?-2:2)*Math.cos(a)]);}s.push(ser);
  var h1=rp([[-2,-4],[-60,-14],[-110,-16],[-112,-8],[-60,-6],[-2,2]]),h2=rp([[-2,-2],[-60,6],[-110,16],[-112,24],[-60,14],[-2,5]]);[h1,h2].forEach(function(h){SOL(s,sol,h);});
  var g1=rp([[-60,-14],[-110,-16],[-112,-8],[-60,-6]]),g2=rp([[-60,6],[-110,16],[-112,24],[-60,14]]);H(s,g1,1.4,a*180/PI+90);H(s,g2,1.4,a*180/PI+90);
  s.push(circle(pv[0],pv[1],7));s.push(circle(pv[0],pv[1],2.4));
  var cx=RR(R,220,250),cy=ty+2,rx=RR(R,36,42),ry=rx*0.45,co=[];for(var t=0;t<=TAU*9;t+=0.12){co.push([cx+rx*Math.cos(t)+t*0.5-14,cy-14+ry*Math.sin(t)-t*0.1]);}s.push(co);var last=co[co.length-1];s.push(curve([last,[last[0]+10,last[1]-30],[last[0]-20,last[1]-50],[last[0]-40,last[1]-40]],6));
  sol.push(EP(cx,cy-16,rx+8,ry+12));
  var nl=[];for(var n=0;n<RI(R,3,5);n++){var nx=RR(R,20,110),ny=ty+RR(R,4,12);nl.push([[nx,ny],[nx+12,ny-3]]);nl.push([[nx-1,ny-2],[nx-1,ny+2]]);}A(s,nl);
  var tb=[],d=1;for(var y=ty;y<196;y+=RR(R,6,8)){if(d>0)tb.push([4,y],[296,y]);else tb.push([296,y],[4,y]);d=-d;}
  var wl=[];H(wl,RP(4,4,296,ty-2),RR(R,6,7.5),90);behind(s,wl,sol);s.push([[4,ty],[296,ty]]);behind(s,[tb],sol);
  var pegs=[];for(var k=0;k<3;k++){var kx=40+k*60;pegs.push([[kx,40],[kx,48],[kx+8,48]]);}behind(s,pegs,sol);var hm=RP(34,48,50,96);behind(s,[poly(hm)],sol);return s;});

S('Sledgehammer and wedges',['Splitting Day','Steel on Oak','Wedge Number Three','Heavy Swing Ahead','Winter Fuel'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,170,176),bx=RR(R,110,140),br=RR(R,34,40),bh=RR(R,34,40),top=gy-bh;
  cyl(s,bx,gy,br,bh,0,1);sol.push([[bx-br,gy],[bx-br,top],[bx+br,top],[bx+br,gy]]);s.push(spiral(bx,top,1,br*0.85,6,0).map(function(p){return [p[0],top+(p[1]-top)*0.28];}));
  var bk=[],d=1;for(var x=bx-br+4;x<bx+br-2;x+=RR(R,4,6)){if(d>0)bk.push([x,top+br*0.28],[x+RR(R,-1,1),gy]);else bk.push([x,gy],[x,top+br*0.28]);d=-d;}s.push(bk);
  var rnd=EP(bx+4,top-14,22,7);s.push(poly(rnd));sol.push(rnd);var rs=[];rs.push([[bx-18,top-14],[bx-18,top-4]]);rs.push([[bx+26,top-14],[bx+26,top-4]]);A(s,rs);
  [[bx-4,top-14,0.2],[bx+14,top-12,-0.3]].forEach(function(w){var P=rotateAbout([[w[0]-5,w[1]-26],[w[0]+5,w[1]-26],[w[0]+1,w[1]+2],[w[0]-1,w[1]+2]],w[0],w[1],w[2]);FS(s,sol,P,1,90);});
  var hx=bx+br+RR(R,40,60),hd=[hx,gy-RR(R,14,18)],ht=[bx+br+4,top-RR(R,30,50)];
  var hp=tube([[hd[0]+20,gy-4],ht],function(u){return 3.2-u*0.6;});FS(s,sol,hp.P);var hb=RP(hd[0]+4,gy-26,hd[0]+44,gy);box3(s,hd[0]+4,gy-26,40,26,8,1.4,1);sol.push(RP(hd[0]+4,gy-34,hd[0]+52,gy));
  var grip=hp.L.slice(Math.floor(hp.L.length*0.7)).concat(hp.R.slice(Math.floor(hp.R.length*0.7)).reverse());H(s,grip,1.2,30);
  var wpx=RR(R,10,40),wpy=gy-6;for(var row=0;row<3;row++){for(var c=0;c<4-row;c++){var lx=wpx+12+c*24+row*12,ly=wpy-row*20;if(lx>bx-br-14)continue;logEnd(bg,[],lx,ly-10,10,10);}}
  var ch=[];for(var k=0;k<RI(R,4,6);k++){var cx=RR(R,bx-br-30,bx+br+80),cy=gy+RR(R,6,16);ch.push([[cx,cy],[cx+RR(R,6,10),cy-3],[cx+RR(R,8,12),cy+2]]);}A(s,ch);
  bg.push(tufts(4,296,gy,4,R));treeR(bg,R,RR(R,240,285),gy,RR(R,16,20),2);return outdoor(s,R,bg,sol,gy);});

S('Bow saw and logs',['Halfway Through','Sawhorse Morning','Firewood by Hand','Teeth in the Birch','Kerf and Dust'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,170,176),hx=RR(R,110,150),ly=gy-RR(R,44,50),lr=RR(R,13,16);
  var lg=logH(s,sol,hx-70,ly,lr,140,4);var kx=hx+RR(R,-6,6);s.push([[kx,ly-lr],[kx+1,ly+2]]);
  [-50,40].forEach(function(o){var x=hx+o;s.push([[x-16,gy],[x+12,ly-lr-6]]);s.push([[x+16,gy],[x-12,ly-lr-6]]);H(s,[[x-16,gy],[x-12,gy],[x+14,ly-lr-6],[x+10,ly-lr-6]],1.2,60);});
  var bl0=[kx-60,ly-lr-6],bl1=[kx+60,ly-lr-10];var tooth=[];for(var i=0;i<=40;i++){var p=lerp(bl0,bl1,i/40);tooth.push([p[0],p[1]+(i%2?2.4:0)]);}s.push(tooth);s.push([[bl0[0],bl0[1]-3],[bl1[0],bl1[1]-3]]);
  var fr=tube(quad([bl0[0]-4,bl0[1]],[(bl0[0]+bl1[0])/2,ly-lr-90],[bl1[0]+4,bl1[1]],20),function(){return 2.6;});FS(s,sol,fr.P,1,90);
  var hd=RP(bl0[0]-14,bl0[1]-6,bl0[0]+2,bl0[1]+4);FS(s,sol,hd,1.2,0);s.push([[bl1[0]+4,bl1[1]-3],[bl1[0]+6,bl1[1]+2]]);
  var px=RR(R,210,250),pile=[];for(var row=0;row<3;row++)for(var c=0;c<3-row;c++){var cx=px+c*24+row*12,cy=gy-11-row*20;logEnd(s,sol,cx,cy,10,10);}
  var dust=[];for(var k=0;k<10;k++){var dx=kx+RR(R,-10,10),dy=gy-RR(R,0,6);dust.push([dx,dy]);}s.push(dust);
  bg.push(tufts(4,296,gy,4,R));for(var t=0;t<3;t++){var tx=RR(R,10,290);if(Math.abs(tx-hx)>80)pineT(bg,tx,gy,RR(R,1.4,2),1.8);}return outdoor(s,R,bg,sol,gy);});

S('Fondue pot',['Long Forks, Warm Cheese','Alpine Supper','Bubbling Slowly','Bread Lost in the Pot','Shared Pot'],function(R){
  var s=[],sol=[],ty=RR(R,150,158),cx=RR(R,130,160),pr=RR(R,40,46),py=ty-RR(R,40,46);
  var pot=[[cx-pr,py]].concat(arc(cx,py,pr,pr*0.85,PI,0).reverse().slice(1)).concat([[cx+pr,py]]);var potP=[[cx-pr,py]].concat(quad([cx-pr,py],[cx-pr,py+pr*0.9],[cx,py+pr*0.85],12)).concat(quad([cx,py+pr*0.85],[cx+pr,py+pr*0.9],[cx+pr,py],12));SOL(s,sol,potP);
  var rim=EP(cx,py,pr,pr*0.26);s.push(poly(rim));s.push(arc(cx,py,pr-4,pr*0.2,0,PI));var ch=[];for(var b=0;b<5;b++){var bx=cx+RR(R,-pr*0.6,pr*0.6);ch.push(arc(bx,py+1,3,1.6,PI,TAU));}A(s,ch);
  H(s,[[cx+pr*0.3,py+pr*0.25],[cx+pr,py+pr*0.1]].concat(quad([cx+pr,py],[cx+pr,py+pr*0.9],[cx,py+pr*0.85],10).slice(2)),1.4,80);s.push(wave(cx-pr+4,cx+pr-4,py+pr*0.4,2,12,0));
  var hdl=RP(cx+pr,py+6,cx+pr+50,py+12);FS(s,sol,hdl,1.2,0);
  var sb=py+pr*0.8,stand=EP(cx,sb,pr*0.9,6);s.push(poly(stand));[-0.8,0,0.8].forEach(function(f){s.push([[cx+f*pr*0.9,sb],[cx+f*pr*1.05,ty]]);});
  var bn=RP(cx-14,ty-14,cx+14,ty-4);FS(s,sol,bn,1.2,90);var fl=[[cx-8,ty-14],[cx-4,ty-24],[cx,ty-16],[cx+4,ty-26],[cx+8,ty-14]];s.push(fl);
  var forks=[];for(var f2=0;f2<3;f2++){var a=-PI/2+(f2-1)*0.55+RR(R,-0.1,0.1),st=[cx+(f2-1)*14,py-2],en=[st[0]+Math.cos(a)*90,st[1]+Math.sin(a)*90];if(en[1]<6)en[1]=6;s.push([st,en]);FS(s,sol,RP(en[0]-2.4,en[1]-4,en[0]+2.4,en[1]+18),0.9,90);if(f2!==1)box3(s,st[0]-5,st[1]-10,9,8,3,0,1);}
  var bw=cx-pr-RR(R,40,50),bwl=[[bw-30,ty-14],[bw+30,ty-14]].concat(arc(bw,ty-14,30,14,0,PI).slice(1));if(bw-30>6){SOL(s,sol,bwl);for(var c=0;c<4;c++)box3(s,bw-22+c*11,ty-24-(c%2)*6,9,9,3,c%2?1.2:0,1);}
  onT(s,R,ty,sol);return s;});

S('Flour sifter',['Snow on the Board','Crank Three Times','Baking Sunday','Fine as Dust','Before the Dough'],function(R){
  var s=[],sol=[],ty=RR(R,152,160),cx=RR(R,120,150),r=RR(R,32,36),top=ty-RR(R,96,106),bot=top+RR(R,58,64);
  var can=[[cx-r,top],[cx-r,bot],[cx+r,bot],[cx+r,top]];var body=[[cx-r,top]].concat([[cx-r,bot]]).concat(arc(cx,bot,r,r*0.28,PI,0).slice(1)).concat([[cx+r,top]]).concat(arc(cx,top,r,r*0.28,0,-PI).slice(1));SOL(s,sol,body);s.push(ellipse(cx,top,r,r*0.28));
  H(s,[[cx+r*0.4,top+r*0.25],[cx+r,top],[cx+r,bot],[cx+r*0.4,bot+r*0.25]],1.3,90);[top+14,bot-8].forEach(function(y){s.push(arc(cx,y,r,r*0.28,0,PI));});
  var mesh=[[cx-r+2,bot+2],[cx+r-2,bot+2],[cx+r*0.7,bot+12],[cx-r*0.7,bot+12]];SOL(s,sol,mesh);HX(s,[mesh],1.6,45);HX(s,[mesh],1.6,-45);
  var ax=cx+r,arm=[[ax,top+20],[ax+22,top+12],[ax+30,top+30]];s.push(arm);s.push(rect(ax+26,top+30,ax+34,top+44));H(s,RP(ax+26,top+30,ax+34,top+44),1,90);
  var hd=arc(cx-r,top+30,16,16,PI*0.5,PI*1.5);s.push(hd);s.push(arc(cx-r,top+30,11,11,PI*0.5,PI*1.5));
  var fp=blob([[cx-r-6,ty],[cx-r+10,ty-12],[cx,ty-18],[cx+r-8,ty-12],[cx+r+8,ty]],5);SOL(s,sol,fp);H(s,fp.filter(function(p){return p[0]>cx;}).concat([[cx,ty]]),1.8,20);var dots=[],d=1;for(var x=cx-r*0.6;x<cx+r*0.6;x+=4){if(d>0)dots.push([x,bot+16],[x+1,bot+20],[x+2,bot+16]);else dots.push([x,bot+24],[x+1,bot+28],[x+2,bot+24]);d=-d;}s.push(dots);
  var rpx=cx+r+RR(R,50,70);if(rpx+70<292){var rp=tube([[rpx,ty-8],[rpx+60,ty-14]],function(){return 7;});FS(s,sol,rp.P);s.push(zz(rpx+6,rpx+54,ty-14,ty-5,10));[[rpx-12,ty-6],[rpx+72,ty-15]].forEach(function(p){FS(s,sol,RP(p[0]-6,p[1]-3,p[0]+6,p[1]+3),1,0);});}
  var eg=cx-r-RR(R,30,40);if(eg>20){[0,1].forEach(function(k){var e=EP(eg-k*16,ty-10,7,10);SOL(s,sol,e);if(k)shadeE(s,eg-k*16,ty-10,7,10,1.2,70,1,0.4);});}
  onT(s,R,ty,sol);return s;});

S('Plums in a bowl',['Dusk-Coloured Fruit','Bloom on the Skin','Late Summer Bowl','One Cut Open','Ripe Enough'],function(R){
  var s=[],sol=[],ty=RR(R,150,158),cx=RR(R,130,160),bw=RR(R,62,70),bt=ty-RR(R,36,42);
  var bowl=[[cx-bw,bt]].concat(quad([cx-bw,bt],[cx-bw*0.8,ty-4],[cx-bw*0.35,ty-2],10)).concat([[cx-bw*0.35,ty],[cx+bw*0.35,ty],[cx+bw*0.35,ty-2]]).concat(quad([cx+bw*0.35,ty-2],[cx+bw*0.8,ty-4],[cx+bw,bt],10));SOL(s,sol,bowl);
  s.push(ellipse(cx,bt,bw,bw*0.14));H(s,[[cx+bw*0.35,bt+bw*0.1],[cx+bw,bt]].concat(quad([cx+bw,bt],[cx+bw*0.8,ty-4],[cx+bw*0.35,ty-2],8)),1.4,80);
  var pl=[[-36,-8],[-12,-10],[14,-9],[38,-7],[-22,-26],[4,-28],[26,-24],[-8,-44]],fr=[];
  pl.forEach(function(p,i){if(i>RI(R,6,7))return;var x=cx+p[0]+RR(R,-3,3),y=bt+p[1]+RR(R,-2,2),rx=RR(R,13,15),ry=rx*1.08;var P=EP(x,y,rx,ry);behind(s,[poly(P)],fr);var dd=[];dd.push(quad([x-rx*0.1,y-ry],[x+rx*0.25,y],[x-rx*0.05,y+ry*0.9],8));
    var sh=arc(x,y,rx,ry,-PI/2,PI/2).concat(arc(x,y,rx*0.35,ry,PI/2,-PI/2));H(dd,sh,1.2,70);behind(s,dd,fr.concat([bowl.slice(0,23)]));fr.push(P);if(i===pl.length-1||R()<0.2)s.push([[x,y-ry],[x+3,y-ry-8]]);});
  var tp=fr.concat([]);sol.push.apply(sol,tp);
  var px=cx+bw+RR(R,22,34);if(px<278){fruit(s,sol,px,ty-14,13,14,1.2,1);var hx=px+30;if(hx<284){var half=EP(hx,ty-7,13,7);SOL(s,sol,half);var pit=EP(hx,ty-8,4,5);FS(s,sol,pit,0.8,30);s.push(ellipse(hx,ty-8,9,5));}}
  var lx=cx-bw-RR(R,20,30);if(lx>20){var lf=lens([lx-16,ty-4],[lx+14,ty-10],5);SOL(s,sol,lf);s.push([[lx-16,ty-4],[lx+14,ty-10]]);}
  onT(s,R,ty,sol);return s;});

S('Club sandwich',['Three Decks High','Toothpick Holds It All','Diner Lunch Special','Lettuce, Tomato, Toast','Cut Corner to Corner'],function(R){
  var s=[],sol=[],ty=RR(R,150,156),cx=RR(R,130,160);
  var pl=EP(cx,ty-6,RR(R,96,104),RR(R,16,20));s.push(poly(pl));s.push(ellipse(cx,ty-8,70,11));
  function wedge(x0,base,w,h,flip){var apex=[x0+(flip?w:0),base-h],P=[[x0,base],[x0+w,base],apex];SOL(s,sol,P);
    var lay=[0,0.12,0.28,0.4,0.52,0.66,0.78,0.92],kinds=['bread','lettuce','tomato','bread','bacon','turkey','bread'];
    for(var i=0;i<lay.length-1;i++){var y0=base-h*lay[i],y1=base-h*lay[i+1];var xl=function(y){var t=(base-y)/h;return flip?x0+w*t:x0;},xr=function(y){var t=(base-y)/h;return flip?x0+w:x0+w*(1-t);};
      var band=[[xl(y0),y0],[xr(y0),y0],[xr(y1),y1],[xl(y1),y1]];s.push([[xl(y1),y1],[xr(y1),y1]]);var k=kinds[i],tx=[];
      if(k==='lettuce')tx.push(wave(x0-4,x0+w+4,(y0+y1)/2,2,8,0));else if(k==='tomato')tx.push(bumps(x0,x0+w,y0-1,(y0-y1)*0.8,10));else if(k==='bacon')tx.push(zz(x0,x0+w,y0-1,y1+1,4));else if(k==='turkey')H(tx,band,1.4,0);else tx.push(wave(x0,x0+w,(y0+y1)/2,0.6,5,1));
      clipIn(s,tx,band);}
    var tp=[apex[0]+(flip?-8:8),base-h-2];s.push([[tp[0],tp[1]+24],[tp[0],tp[1]-18]]);var frl=[];for(var j=0;j<6;j++)frl.push([tp[0]+(j%2?4:-4),tp[1]-18-j*2]);s.push(frl);return P;}
  var w=RR(R,60,70),h=RR(R,70,80);wedge(cx-w-4,ty-10,w,h,true);wedge(cx+4,ty-10,w,h,false);
  var pk=lens([cx+w+12,ty-12],[cx+w+40,ty-20],5);SOL(s,sol,pk);s.push(bumps(cx+w+16,cx+w+36,ty-16,1.2,4));
  var ch=[];for(var c=0;c<4;c++){var x=cx-w-30+c*8;if(x>8)ch.push(EP(x,ty-10-c%2*4,7,4));}ch.forEach(function(P){behind(s,[poly(P)],sol);sol.push(P);});
  var gl=cx+w+RR(R,60,70);if(gl<280){cyl(s,gl,ty-6,12,44,1.3,1);sol.push(RP(gl-12,ty-54,gl+12,ty-6));s.push([[gl+4,ty-50],[gl+12,ty-70]]);}
  onT(s,R,ty-6,sol);return s;});

S('Yo-yo',['Walk the Dog','Up and Down Again','String Theory','Sleeping Spin','Pocket Trick'],function(R){
  var s=[],sol=[],ty=RR(R,158,164),cx=RR(R,130,160),cy=RR(R,92,104),r=RR(R,40,46),k=0.86;
  var side=arc(cx,cy,r*k,r,-PI/2,PI/2).concat(arc(cx+12,cy,r*k,r,PI/2,-PI/2));var back=EP(cx+12,cy,r*k,r);var front=EP(cx,cy,r*k,r);SOL(s,sol,front);SOL(s,sol,side);s.push(arc(cx+12,cy,r*k,r,-PI/2,PI/2));
  var gap=arc(cx+6,cy,r*k,r,-PI/2,PI/2);s.push(gap);H(s,side,1.2,90);
  s.push(ellipse(cx,cy,r*k*0.78,r*0.78));var st=leafStar(cx,cy,r*0.6,-PI/2);s.push(poly(st));HX(s,[EP(cx,cy,r*k*0.78,r*0.78),st],2.2,30);s.push(circle(cx,cy,5));H(s,EP(cx,cy,4,4),1,0);
  var str=curve([[cx+6,cy],[cx+10,cy-60],[cx+2,cy-r-30],[cx+8,4]],8);s.push(str);var lp=EP(cx+8,12,5,8);s.push(poly(lp));
  var mo=[];for(var m=0;m<3;m++)mo.push(arc(cx,cy,r+10+m*7,r+10+m*7,PI*0.65,PI*0.95));A(s,mo);
  var x2=cx+r+RR(R,40,60);if(x2<260){var f2=EP(x2,ty-14,14,14);SOL(s,sol,f2);s.push(circle(x2,ty-14,8));shadeE(s,x2,ty-14,14,14,1.4,70,1,0.4);var coil=[];for(var t=0;t<TAU*3;t+=0.2)coil.push([x2+22+t*2+6*Math.cos(t),ty-4+3*Math.sin(t)]);s.push(coil);}
  var x3=cx-r-RR(R,40,60);if(x3>30){box3(s,x3-18,ty-26,30,26,8,1.4,1);sol.push(RP(x3-18,ty-34,x3+20,ty));s.push(rect(x3-12,ty-20,x3+6,ty-6));}
  onT(s,R,ty,sol);return s;});

S('Stacking rings toy',['Biggest at the Bottom','Rainbow Tower','Nursery Pyramid','Five Rings and a Knob','First Puzzle'],function(R){
  var s=[],sol=[],fy=RR(R,168,174),cx=RR(R,130,160),n=5,y=fy-2;
  var base=[[cx-50,y],[cx-50,y-10]].concat(arc(cx,y-10,50,12,PI,TAU).slice(1)).concat([[cx+50,y]]).concat(arc(cx,y,50,12,0,PI).slice(1));SOL(s,sol,base);s.push(arc(cx,y-10,50,12,0,PI));H(s,arc(cx,y,50,12,0,PI).concat(arc(cx,y-10,50,12,PI,0)),1.6,0);y-=12;
  for(var i=0;i<n;i++){var rx=44-i*7,h=14,ry=rx*0.26;var P=[[cx-rx,y]].concat(arc(cx,y,rx,ry,PI,0).reverse()).concat([[cx+rx,y],[cx+rx,y-h]]).concat(arc(cx,y-h,rx,ry,0,-PI).slice(1)).concat([[cx-rx,y-h]]);SOL(s,sol,P);s.push(arc(cx,y-h,rx,ry,0,PI));s.push(arc(cx,y-h,rx*0.35,ry*0.35,PI,TAU));
    var band=[[cx-rx,y-h]].concat(arc(cx,y-h,rx,ry,PI,0).reverse()).concat(arc(cx,y,rx,ry,0,PI));if(i%2===0)H(s,band,1.4,i%4?40:-40);else s.push(wave(cx-rx+2,cx+rx-2,y-h/2+ry*0.6,1.2,10,0));y-=h;}
  var kb=EP(cx,y-10,12,12);SOL(s,sol,kb);shadeE(s,cx,y-10,12,12,1.2,70,1,0.4);s.push(arc(cx-4,y-14,3,3,PI,PI*1.7));
  var bx=cx+RR(R,70,90);if(bx<260){box3(s,bx,fy-24,24,24,8,1.4,1);sol.push(RP(bx,fy-32,bx+32,fy));s.push([[bx+4,fy-4],[bx+12,fy-20],[bx+20,fy-4],[bx+4,fy-4]]);box3(s,bx+6,fy-48,20,20,7,0,1);sol.push(RP(bx+6,fy-55,bx+33,fy-24));s.push(circle(bx+16,fy-38,5));}
  var ba=cx-RR(R,80,100);if(ba>24){var b=EP(ba,fy-16,16,16);SOL(s,sol,b);s.push(arc(ba,fy-16,16,6,0,TAU));s.push(arc(ba,fy-16,6,16,0,TAU));shadeE(s,ba,fy-16,16,16,1.4,70,1,0.4);}
  room2(s,R,fy,sol);return s.filter(function(x){return x&&x.length>1;});});

S('Sideboard with a lamp',['Good China Inside','Lamp Lit at Six','Walnut and Brass','Dining Room Wall','Keys in the Dish'],function(R){
  var s=[],sol=[],fy=RR(R,170,176),x0=RR(R,50,70),x1=x0+RR(R,170,190),top=fy-RR(R,62,68),lg=12;
  var body=RP(x0,top,x1,fy-lg);SOL(s,sol,body);var slab=RP(x0-6,top-6,x1+6,top);FS(s,sol,slab,1.4,0);
  var dw=(x1-x0)/3;for(var i=0;i<3;i++){var a=x0+i*dw;s.push(rect(a+3,top+4,a+dw-3,top+14));s.push(circle(a+dw/2,top+9,1.6));s.push(rect(a+3,top+18,a+dw-3,fy-lg-4));s.push(rect(a+8,top+23,a+dw-8,fy-lg-9));if(i!==1)s.push(circle(i?a+8:a+dw-8,(top+fy-lg)/2+6,1.6));}
  H(s,RP(x1-dw+3,top+18,x1-3,fy-lg-4),1.6,90);[x0+6,x1-6].forEach(function(x){s.push([[x-3,fy-lg],[x-2,fy],[x+2,fy],[x+3,fy-lg]]);});
  var lx=x0+RR(R,30,45),lb=top-6,vase=[[lx-6,lb],[lx-10,lb-12],[lx-4,lb-26],[lx-2,lb-34],[lx+2,lb-34],[lx+4,lb-26],[lx+10,lb-12],[lx+6,lb]];FS(s,sol,vase);H(s,[[lx+1,lb],[lx+6,lb],[lx+10,lb-12],[lx+4,lb-26],[lx+1,lb-26]],1.2,90);
  var sh=[[lx-24,lb-36],[lx-14,lb-66],[lx+14,lb-66],[lx+24,lb-36]];FS(s,sol,sh);s.push(zz(lx-22,lx+22,lb-64,lb-38,5).length?[[lx-24,lb-36],[lx+24,lb-36]]:[]);clipIn(s,[zz(lx-24,lx+24,lb-66,lb-36,4)],sh);
  var vx=x1-RR(R,30,45);cyl(s,vx,lb,8,22,1.2,1);sol.push(RP(vx-8,lb-25,vx+8,lb));var br=[];for(var b=0;b<5;b++){var a2=-PI/2+(b-2)*0.35;br.push([[vx,lb-22],[vx+40*Math.cos(a2),lb-22+40*Math.sin(a2)]]);}A(s,br);
  var dsh=EP((lx+vx)/2,lb-3,14,3);s.push(poly(dsh));s.push([[(lx+vx)/2-4,lb-5],[(lx+vx)/2+6,lb-8]]);
  var fx=(x0+x1)/2-30,pf=RP(fx,top-110,fx+60,top-46);if(pf[0][1]>6){SOL(s,sol,pf);s.push(rect(fx+5,top-105,fx+55,top-51));s.push(peaksMini(fx+5,top-51,50));s.push(circle(fx+42,top-92,4));}
  room2(s,R,fy,sol);return s.filter(function(x){return x&&x.length>1;});});

S('Hanging egg chair',['Cocoon on the Porch','Swinging Slowly','Wicker Nest','Reading Spot','Afternoon in a Shell'],function(R){
  var s=[],sol=[],fy=RR(R,172,178),cx=RR(R,130,160),cy=RR(R,108,116),ew=RR(R,40,46),eh=RR(R,56,62);
  var egg=blob([[cx,cy-eh],[cx+ew*0.8,cy-eh*0.6],[cx+ew,cy+eh*0.1],[cx+ew*0.7,cy+eh*0.7],[cx,cy+eh*0.85],[cx-ew*0.7,cy+eh*0.7],[cx-ew,cy+eh*0.1],[cx-ew*0.8,cy-eh*0.6]],6);SOL(s,sol,egg);
  var op=blob([[cx-4,cy-eh*0.55],[cx+ew*0.6,cy-eh*0.2],[cx+ew*0.65,cy+eh*0.35],[cx+ew*0.2,cy+eh*0.6],[cx-ew*0.4,cy+eh*0.5],[cx-ew*0.55,cy+eh*0.05]],6);s.push(poly(op));
  HX(s,[egg,op],3,45);HX(s,[egg,op],3,-45);
  var cu=blob([[cx-ew*0.45,cy+eh*0.3],[cx,cy+eh*0.15],[cx+ew*0.55,cy+eh*0.3],[cx+ew*0.2,cy+eh*0.55],[cx-ew*0.35,cy+eh*0.48]],5);s.push(poly(cu));var pil=blob([[cx-ew*0.4,cy-eh*0.25],[cx+ew*0.1,cy-eh*0.35],[cx+ew*0.45,cy],[cx,cy+eh*0.1],[cx-ew*0.45,cy+eh*0.05]],5);s.push(poly(pil));s.push(circle(cx,cy-eh*0.1,1.6));H(s,cu,1.6,0);
  var hk=[cx,cy-eh-RR(R,26,32)];s.push([[cx,cy-eh],hk]);var chain=[];for(var c=0;c<4;c++){var y=cy-eh-4-c*6;chain.push(EP(cx,y,2,3.4));}chain.forEach(function(P){s.push(poly(P));});
  var sx=cx+RR(R,60,70),arch=quad([sx,fy-8],[sx+10,hk[1]-60],[hk[0],hk[1]-8],20),st=tube(arch,function(){return 3.6;});FS(s,sol,st.P,1.4,30);s.push([[hk[0],hk[1]-8],hk]);
  var bs=EP(sx,fy-5,36,7);SOL(s,sol,bs);H(s,bs,1.5,0);
  var px=cx-ew-RR(R,40,60);if(px>30){var pot=[[px-16,fy],[px-20,fy-26],[px+20,fy-26],[px+16,fy]];FS(s,sol,pot,1.4,90);for(var l=0;l<6;l++){var a=-PI/2+(l-2.5)*0.4;leafL(s,sol,[px,fy-26],[px+44*Math.cos(a),fy-26+44*Math.sin(a)],5,l%2?1.4:0);}}
  var dk=[];floorS(dk,R,fy,RI(R,16,20));behind(s,dk,sol);var wl=[];H(wl,RP(4,4,296,fy-8),RR(R,7,8.5),90);behind(s,wl,sol);behind(s,[[[4,fy-8],[296,fy-8]]],sol);return s;});

S('Pinball machine',['Tilt!','Extra Ball','Silver Ball, Bright Lights','High Score Night','Flippers Ready'],function(R){
  var s=[],sol=[],fy=RR(R,174,180),x0=RR(R,70,90),L=RR(R,140,160),x1=x0+L,ct=fy-RR(R,62,68),dp=RR(R,26,32);
  var front=RP(x0,ct,x0+60,ct+40);var side=[[x0+60,ct],[x1,ct-dp],[x1,ct-dp+40],[x0+60,ct+40]];var topF=[[x0,ct],[x0+60,ct],[x1,ct-dp],[x1-60,ct-dp-0]];
  var pf=[[x0,ct],[x0+60,ct],[x1,ct-dp],[x1-60,ct-dp]];SOL(s,sol,front.concat([]));SOL(s,sol,side);SOL(s,sol,pf);H(s,side,1.6,90);
  var bb=[[x1-62,ct-dp],[x1-62,ct-dp-70],[x1+2,ct-dp-80],[x1+2,ct-dp-6]];FS(s,sol,bb);var scr=[[x1-56,ct-dp-14],[x1-56,ct-dp-60],[x1-4,ct-dp-68],[x1-4,ct-dp-20]];s.push(poly(scr));
  var sc=lerp(scr[0],scr[2],0.5);s.push(poly(leafStar(sc[0],sc[1],16,-PI/2)));s.push(circle(sc[0],sc[1],22));var ray=[];for(var r=0;r<12;r++){var a=r*TAU/12;ray.push([sc[0]+22*Math.cos(a),sc[1]+22*Math.sin(a)],[sc[0]+26*Math.cos(a),sc[1]+26*Math.sin(a)],[sc[0]+22*Math.cos(a+0.26),sc[1]+22*Math.sin(a+0.26)]);}s.push(ray);
  H(s,[[x1-62,ct-dp-70],[x1+2,ct-dp-80],[x1+2,ct-dp-70],[x1-62,ct-dp-60]],1.2,0);
  function pfp(u,v){return lerp(lerp(pf[0],pf[3],u),lerp(pf[1],pf[2],u),v);}
  [[0.55,0.3],[0.7,0.6],[0.8,0.35]].forEach(function(b){var p=pfp(b[0],b[1]);s.push(ellipse(p[0],p[1],7,4));s.push(ellipse(p[0],p[1],3,2));});
  [[0.12,0.25,0.18,0.45],[0.12,0.75,0.18,0.55]].forEach(function(f){var a=pfp(f[0],f[1]),b=pfp(f[2],f[3]);s.push(poly(lens(a,b,1.6)));});
  [[0.3,0.1,0.5,0.1],[0.3,0.9,0.5,0.9],[0.85,0.15,0.95,0.15],[0.85,0.5,0.95,0.5]].forEach(function(l){s.push([pfp(l[0],l[1]),pfp(l[2],l[3])]);});var ball=pfp(0.35,0.5);s.push(circle(ball[0],ball[1],2.4));
  s.push(rect(x0+20,ct+12,x0+40,ct+34));s.push(rect(x0+24,ct+16,x0+28,ct+22));s.push(rect(x0+32,ct+16,x0+36,ct+22));[ct+8].forEach(function(y){s.push(rect(x0-3,y,x0,y+5));});
  [[x0+4,ct+40],[x0+56,ct+40],[x1-4,ct-dp+40]].forEach(function(p){FS(s,sol,RP(p[0]-2.5,p[1],p[0]+2.5,Math.min(fy,p[1]+fy-ct-40)),1,90);});
  room2(s,R,fy,sol);return s.filter(function(x){return x&&x.length>1;});});

S('Vintage television set',['Test Card at Midnight','Warm Up the Tubes','Rabbit Ears','Family Room, 1958','Snow Between Stations'],function(R){
  var s=[],sol=[],fy=RR(R,172,178),x0=RR(R,70,90),w=RR(R,140,156),x1=x0+w,lg=RR(R,22,26),top=fy-lg-RR(R,92,100),bot=fy-lg;
  var cab=rrect(x0,top,x1,bot,8);SOL(s,sol,cab);s.push(rrect(x0+4,top+4,x1-4,bot-4,6));
  var sw=w*0.64,scr=rrect(x0+12,top+12,x0+sw,bot-12,14);s.push(scr);var sc=[(x0+12+x0+sw)/2,(top+bot)/2];
  s.push(circle(sc[0],sc[1],24));s.push([[sc[0]-24,sc[1]],[sc[0]+24,sc[1]]]);s.push([[sc[0],sc[1]-24],[sc[0],sc[1]+24]]);s.push(circle(sc[0],sc[1],10));
  var bars=[];var bw=(sw-24)/8;for(var i=0;i<8;i+=2){bars.push(RP(x0+14+i*bw,bot-26,x0+14+(i+1)*bw,bot-15));}bars.forEach(function(P){s.push(poly(P));H(s,P,1,90);});
  var gl=[];H(gl,[[x0+16,top+16],[x0+40,top+16],[x0+16,top+40]],2,45);A(s,gl);
  var px=x0+sw+10;[top+24,top+50].forEach(function(y){var c=[(px+x1-8)/2,y];s.push(circle(c[0],c[1],8));s.push(circle(c[0],c[1],3));s.push([[c[0],c[1]-3],[c[0],c[1]-8]]);});
  var gr=RP(px,top+64,x1-10,bot-10);s.push(poly(gr));clipIn(s,[zz(px,x1-10,top+64,bot-10,3)],gr);
  [[x0+16,-8],[x1-16,8]].forEach(function(l){var a=[l[0],bot],b=[l[0]+l[1],fy];FS(s,sol,[[a[0]-3,a[1]],[a[0]+3,a[1]],[b[0]+2,b[1]],[b[0]-2,b[1]]],1,90);});
  H(s,[[x1-6,top+10],[x1,top+10],[x1,bot-6],[x1-6,bot-6]],1,90);
  var px2=x1+RR(R,26,36);if(px2<270){var pot=[[px2-14,fy],[px2-17,fy-24],[px2+17,fy-24],[px2+14,fy]];FS(s,sol,pot,1.4,90);for(var l=0;l<7;l++){var aa=-PI/2+(l-3)*0.32;leafL(s,sol,[px2,fy-24],[px2+50*Math.cos(aa),fy-24+56*Math.sin(aa)],5,l%2?1.4:0);}}
  var rug=EP((x0+x1)/2,fy+10,w*0.6,8);s.push(poly(rug));sol.push(rug);s.push(zz((x0+x1)/2-w*0.5,(x0+x1)/2+w*0.5,fy+6,fy+14,6));
  var ab=[(x0+x1)/2+20,top],dome=arc(ab[0],ab[1],12,8,PI,TAU);FS(s,sol,dome.concat([[ab[0]+12,ab[1]],[ab[0]-12,ab[1]]]));
  var a1=RR(R,-2.3,-2.0),a2=RR(R,-1.1,-0.8);[a1,a2].forEach(function(a){var e=[ab[0]+86*Math.cos(a),ab[1]-6+86*Math.sin(a)];if(e[1]<6)e[1]=6;s.push([[ab[0],ab[1]-6],e]);s.push(circle(e[0],e[1],2));});
  room2(s,R,fy,sol);return s.filter(function(x){return x&&x.length>1;});});

MASTER={name:'Zen rock garden from above',titles:['Raked Gravel from the Roof','Islands in a Stone Sea','Ripples Around the Rocks','Fifteen Stones, One Morning','Quiet Lines from Above'],build:function(R){
  var s=[],sol=[],top=RR(R,20,24),vy=RR(R,162,168),gx0=4,gx1=296;
  var G=RP(gx0,top,gx1,vy);
  var lan=[RR(R,30,60),RR(R,top+26,top+40)],p0=[RR(R,110,190),vy-8],mx=RR(R,250,280),my=top+RR(R,10,24),mr=RR(R,34,42);
  var path=[];for(var k=0;k<7;k++){var t=k/6,p=lerp(p0,[lan[0]+20,lan[1]+20],t);path.push([p[0]+10*Math.sin(t*5),p[1]]);}
  var cl=[],tries=0,want=RI(R,3,4);
  while(cl.length<want&&tries<400){tries++;var r=RR(R,13,20),zr=r+RR(R,20,26),c=[RR(R,30+zr*0.5,270-zr*0.5),RR(R,top+zr*0.7,vy-zr*0.7)];
    if(cl.some(function(o){return Math.hypot(o.c[0]-c[0],o.c[1]-c[1])<o.zr+zr+6;}))continue;
    if(Math.hypot(lan[0]-c[0],lan[1]-c[1])<zr+24||Math.hypot(mx-c[0],my-c[1])<zr+mr+4||path.some(function(q){return Math.hypot(q[0]-c[0],q[1]-c[1])<zr+12;}))continue;cl.push({c:c,r:r,zr:zr});}
  var zones=cl.map(function(o){return EP(o.c[0],o.c[1],o.zr+1.5,o.zr+1.5);});
  var ss=path.map(function(q){return blob([[q[0]-9,q[1]],[q[0]-5,q[1]-6],[q[0]+5,q[1]-6],[q[0]+9,q[1]-1],[q[0]+5,q[1]+5],[q[0]-6,q[1]+5]],4);});
  ss.forEach(function(P){SOL(s,sol,P);H(s,P,2.2,RR(R,30,60));});
  // lantern seen from above: square roof, inner squares, round finial
  var L=lan,lw=13;var lr=RP(L[0]-lw,L[1]-lw,L[0]+lw,L[1]+lw);SOL(s,sol,lr);s.push(rect(L[0]-lw+4,L[1]-lw+4,L[0]+lw-4,L[1]+lw-4));s.push([[L[0]-lw,L[1]-lw],[L[0]+lw,L[1]+lw]]);s.push([[L[0]+lw,L[1]-lw],[L[0]-lw,L[1]+lw]]);s.push(circle(L[0],L[1],4.5));H(s,EP(L[0],L[1],3.5,3.5),1,0);
  H(s,[[L[0],L[1]+lw],[L[0]+lw,L[1]+lw],[L[0]+lw,L[1]+lw+8],[L[0]+4,L[1]+lw+8]],1.4,0);
  // maple canopy overhanging one corner, partly off the edge
  var can=scallop(mx,my,mr,mr*0.9,11,0.14);can.pop();
  can=can.map(function(p){return [Math.min(296,p[0]),Math.max(top,p[1])];});SOL(s,sol,can);
  var in2=scallop(mx,my,mr*0.6,mr*0.55,8,0.16);in2.pop();s.push(poly(in2));H(s,can.filter(function(p){return p[0]+p[1]>mx+my-mr*0.3;}).concat([[mx,my+mr*0.2]]),1.8,45);var ch=[];H(ch,in2,2.4,-30);A(s,ch);
  var shadow=EP(mx-mr*0.35,my+mr*0.6,mr*0.8,mr*0.45);
  // moss islands and rocks
  cl.forEach(function(o){var M=scallop(o.c[0],o.c[1],o.r,o.r*0.9,9,0.12);M.pop();SOL(s,sol,M);
    var nr=RI(R,1,3),rk=[];for(var j=0;j<nr;j++){var a=j*TAU/nr+RR(R,0,1),d=nr>1?o.r*0.35:0,rc=[o.c[0]+d*Math.cos(a),o.c[1]+d*Math.sin(a)],rs=o.r*(nr>1?0.42:0.62)*RR(R,0.85,1.1);
      var P=blob([[rc[0]-rs,rc[1]+rs*0.2],[rc[0]-rs*0.6,rc[1]-rs*0.8],[rc[0]+rs*0.3,rc[1]-rs],[rc[0]+rs,rc[1]-rs*0.3],[rc[0]+rs*0.8,rc[1]+rs*0.7],[rc[0]-rs*0.2,rc[1]+rs]],5);rk.push(P);SOL(s,sol,P);
      H(s,P.filter(function(p){return p[0]+p[1]>rc[0]+rc[1]-rs*0.2;}),1.5,-45);s.push([[rc[0]-rs*0.4,rc[1]-rs*0.3],[rc[0],rc[1]],[rc[0]+rs*0.2,rc[1]+rs*0.5]]);}
    var M2=scallop(o.c[0],o.c[1],o.r*0.8,o.r*0.72,9,0.14);M2.pop();behind(s,[poly(M2)],rk);
    var sp=spiral(o.c[0],o.c[1],o.r*1.12+2,o.zr,(o.zr-o.r*1.12-2)/RR(R,2.2,2.4),RR(R,0,TAU));clipIn(s,[sp],G,[can]);});
  // raked straight lines everywhere else (one serpentine, cut around zones, stones, lantern, canopy)
  var gap=RR(R,3.9,4.1),rk2=rows(gx0,gx1,top+gap,vy-1.5,gap);clipIn(s,[rk2],G,zones.concat(ss).concat([lr,can]));
  // fallen leaves on the gravel near the tree
  for(var f=0;f<3;f++){var fc=[mx-mr-RR(R,6,30),my+RR(R,10,40)];if(fc[1]<vy-8&&!zones.some(function(Z){return pip(fc,Z);}))s.push(poly(leafStar(fc[0],fc[1],4,RR(R,0,TAU))));}
  // garden wall along the top: tile ridge seen from above
  s.push([[4,top],[296,top]]);s.push([[4,top-6],[296,top-6]]);behind(s,[scallopRows(4,296,6,top-7,7,3.4)],[can]);behind(s,[zz(4,296,top-6,top,5)],[can]);
  // veranda: edge beam, boards, posts
  s.push([[4,vy],[296,vy]]);var bm=RP(4,vy,296,vy+6);H(s,bm,1.4,0);var bd=rows(4,296,vy+10,195,RR(R,3.6,4.2));s.push(bd);
  var jn=[];for(var x2=20;x2<296;x2+=RR(R,40,60)){var yy=vy+10+Math.floor(R()*7)*4;jn.push([[x2,yy],[x2,yy+4]]);}A(s,jn);
  [RR(R,30,50),RR(R,250,270)].forEach(function(px){var P=RP(px-7,vy-2,px+7,vy+12);SOL(s,sol,P);H(s,P,1.2,45);});
  var zb=[];var zx=RR(R,90,200);zb.push(rect(zx,vy+14,zx+40,vy+26));zb.push(circle(zx+20,vy+20,4));A(s,zb);
  return s.filter(function(x){return x&&x.length>1;});}};

return {number:13,startedOn:"2026-11-23",notes:"Batch 13 (Nov 23). Review of Nov 21-22 plays: Kelp forest (Super Sketch, type 4) was rich but its light rays crossed everything. Strong: fireplace, concrete dam, lych gate, bar stools, banjo barometer, taxi, delivery van, snowcat, frozen waterfall, honey jar, newsstand. Weak: sloth, tree frog, cardinal and ginkgo drowned by all-over diagonal hatch; wrench, spirit level and zither lost in tile grids; river-from-above and tumbleweed muddled; goldfinch, axolotl, snow leopard, donkey and plough horse crude; succulents tiny. Lessons kept: one line, keep extras touching; clip backgrounds with behind()/clipIn(); animals need a bold smooth silhouette with one shaded side; never cover the subject with all-over hatch, rays or tile grids - stripes or sky rows only; small objects drawn big; dozens of small closed shapes and long clipped row sets slow the planner (windows, raking). Daily Super Sketch: Zen rock garden from above, a top-down view with no horizon (type 3); previous two were Library reading room (type 1) and Kelp forest (type 4).",master:MASTER||undefined,subjects:SUBJ};
})();
