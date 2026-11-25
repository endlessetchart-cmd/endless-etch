// Endless Etch — batch 15. 48 subjects for 2026-11-25 (each plays about three times, shuffled per round) plus the Daily Super Sketch.
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


function sideShade(s,P,f,g,a,left){var x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;P.forEach(function(p){x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1]);});
  var B=left?RP(x0-2,y0-2,x0+(x1-x0)*f,y1+2):RP(x1-(x1-x0)*f,y0-2,x1+2,y1+2);clipIn(s,hatch(B,g,a),P);return s;}
function stone(R,x0,y0,x1,y1){var cx=(x0+x1)/2,cy=(y0+y1)/2,w=(x1-x0)/2,h=(y1-y0)/2;return blob([[x0,y1],[x0+RR(R,-2,2),cy],[x0+w*0.3,y0+RR(R,0,3)],[cx+w*0.4,y0],[x1+RR(R,-2,2),cy-h*0.3],[x1,y1]],5);}

function scallopOutline(P){var out=[];for(var i=0;i<P.length;i+=3){var a=P[i],b=P[(i+3)%P.length],m=lerp(a,b,0.5),dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;out.push(a,[m[0]+dy/l*1.6,m[1]-dx/l*1.6]);}return out;}

function furT(P,every,len){var p=[],n=P.length;for(var i=0;i<n;i+=every){var a=P[i],b=P[(i+1)%n],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;p.push(a,[a[0]+dy/l*len,a[1]-dx/l*len],a);}return p;}
function streetBG(s,R,gy,sol){var bg=[];road(bg,R,gy);facade(bg,R,gy-2,sol);behind(s,bg,sol);return sky(s,R,gy-3,sol);}

function gullAt(s,sol,x,b,sz,dir){var P=blob(M([[-24,-30],[-6,-34],[14,-36],[22,-44],[30,-46],[36,-40],[30,-34],[24,-26],[10,-14],[-10,-12],[-30,-22]],x,b-24*sz,sz,dir),5);SOL(s,sol,P);
  var wing=blob(M([[-30,-24],[-8,-32],[10,-30],[6,-20],[-14,-18]],x,b-24*sz,sz,dir),4);s.push(poly(wing));
  var tip=M([[-30,-24],[-40,-22],[-24,-18],[-14,-18]],x,b-24*sz,sz,dir);FS(s,sol,tip,1,0);s.push(M([[36,-40],[46,-39],[36,-37]],x,b-24*sz,sz,dir));eye(s,x+dir*28*sz,b-24*sz-41*sz,1.2);
  s.push(M([[2,-14],[2,0],[-2,0]],x,b-24*sz,sz,dir).concat([[x,b]]));s.push(M([[10,-14],[10,0],[14,0]],x,b-24*sz,sz,dir).concat([[x+dir*12*sz,b]]));return P;}
function quail(s,sol,x,b,sz,dir,adult){var P=blob(M([[-16,-8],[-10,-20],[4,-24],[12,-30],[18,-32],[22,-26],[18,-18],[14,-8],[2,-2],[-12,-3]],x,b,sz,dir),5);SOL(s,sol,P);
  if(adult){s.push(curve(M([[16,-32],[14,-40],[18,-46],[23,-45]],x,b,sz,dir),5));var sc=[];clipIn(s,[scallopRows(x-30*sz,x+30*sz,b-22*sz,b-3,6,4)],P);
    s.push(M([[12,-24],[18,-20],[22,-26]],x,b,sz,dir));}else clipIn(s,hatch(RP(x-20*sz,b-30*sz,x+20*sz,b),2.2,dir*40),P);
  s.push(M([[22,-28],[26,-27],[22,-25]],x,b,sz,dir));eye(s,x+dir*18*sz,b-28*sz,0.9);s.push(M([[2,-2],[2,1],[5,1]],x,b,sz,dir));s.push(M([[-4,-3],[-4,1],[-1,1]],x,b,sz,dir));return P;}
function jarS(s,sol,x,b,w,h,g){var P=[[x-w,b]].concat(arc(x-w+3,b-h+3,3,3,PI,1.5*PI)).concat(arc(x+w-3,b-h+3,3,3,1.5*PI,TAU)).concat([[x+w,b]]);SOL(s,sol,P);var lid=RP(x-w-1,b-h-6,x+w+1,b-h+1);FS(s,sol,lid,g||1.2,90);return P;}
function sideBox(s,sol,x0,y0,x1,y1,d,g){var P=[[x0,y1],[x0,y0],[x0+d,y0-d*0.6],[x1+d,y0-d*0.6],[x1+d,y1-d*0.6],[x1,y1]];SOL(s,sol,P);s.push([[x0,y0],[x1,y0],[x1,y1]]);s.push([[x1,y0],[x1+d,y0-d*0.6]]);H(s,[[x1,y0],[x1+d,y0-d*0.6],[x1+d,y1-d*0.6],[x1,y1]],g||1.6,90);return P;}

function gearP(cx,cy,r,n,th,a0){var p=[];for(var i=0;i<n;i++){var a=a0+i*TAU/n,w=TAU/n;p.push([cx+(r-th)*Math.cos(a),cy+(r-th)*Math.sin(a)],[cx+r*Math.cos(a+w*0.18),cy+r*Math.sin(a+w*0.18)],[cx+r*Math.cos(a+w*0.42),cy+r*Math.sin(a+w*0.42)],[cx+(r-th)*Math.cos(a+w*0.6),cy+(r-th)*Math.sin(a+w*0.6)]);}return p;}
function escP(cx,cy,r,n,a0){var p=[];for(var i=0;i<n;i++){var a=a0+i*TAU/n,w=TAU/n;p.push([cx+r*0.62*Math.cos(a),cy+r*0.62*Math.sin(a)],[cx+r*Math.cos(a+w*0.55),cy+r*Math.sin(a+w*0.55)],[cx+r*0.92*Math.cos(a+w*0.75),cy+r*0.92*Math.sin(a+w*0.75)],[cx+r*0.66*Math.cos(a+w*0.95),cy+r*0.66*Math.sin(a+w*0.95)]);}return p;}
function wheelG(g,cx,cy,r,n,ns,a0,R){var P=gearP(cx,cy,r,n,Math.max(2.2,r*0.07),a0);g.push(poly(P));var ri=r*0.78;g.push(spiral(cx,cy,ri,r-r*0.08-0.6,RR(R,2.2,3),a0));
  if(ns){var hub=r*0.18;for(var k=0;k<ns;k++){var a=a0+k*TAU/ns,b=a+0.35;[-0.09,0.09].forEach(function(o){g.push(quad([cx+hub*Math.cos(a+o*3),cy+hub*Math.sin(a+o*3)],[cx+r*0.5*Math.cos((a+b)/2+o),cy+r*0.5*Math.sin((a+b)/2+o)],[cx+ri*Math.cos(b+o),cy+ri*Math.sin(b+o)],10));});}g.push(circle(cx,cy,hub));}
  else g.push(circle(cx,cy,ri*0.5));g.push(poly(gearP(cx,cy,Math.max(5,r*0.15),8,1.6,a0)));return EP(cx,cy,r,r);}
function jewel(s,cx,cy,r){s.push(circle(cx,cy,r));s.push(circle(cx,cy,r*0.45));H(s,EP(cx,cy,r*0.45,r*0.45),0.8,30);return s;}
function screwS(s,cx,cy,r,a){s.push(circle(cx,cy,r));s.push([[cx-r*0.8*Math.cos(a),cy-r*0.8*Math.sin(a)],[cx+r*0.8*Math.cos(a),cy+r*0.8*Math.sin(a)]]);return s;}


// ---- batch 15 ----
// ---- batch 15 chunk A: places, landscapes, plants ----
// spotted petal recurved: from p0 out along angle a, length L, width w, curling tip
function petalC(s,sol,p0,a,L,w,curl){var d=[Math.cos(a),Math.sin(a)],n=[-d[1],d[0]],tip=[p0[0]+d[0]*L+n[0]*curl,p0[1]+d[1]*L+n[1]*curl];
  var P=quad(p0,[p0[0]+d[0]*L*0.5+n[0]*w,p0[1]+d[1]*L*0.5+n[1]*w],tip,10).concat(quad(tip,[p0[0]+d[0]*L*0.5-n[0]*w,p0[1]+d[1]*L*0.5-n[1]*w],p0,10).slice(1));SOL(s,sol,P);s.push([p0,lerp(p0,tip,0.8)]);return P;}
function conifer(bg,x,b,h,w){var P=[[x-w,b],[x,b-h],[x+w,b]];bg.push(P);H(bg,P,2.2,70);return bg;}

S('Cricket pavilion',['Tea Interval','Long Room, Late June','Clock Over the Steps','Rain Stopped Play','White Paint, Green Field'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,150,156),cx=RR(R,140,160),w=RR(R,74,82),h=RR(R,40,46),x0=cx-w,x1=cx+w,ey=gy-h,rt=ey-RR(R,34,40);
  var body=RP(x0,ey,x1,gy);SOL(s,sol,body);clipIn(s,[zz(x0,x1,ey,gy,RR(R,3.2,3.8))],RP(x0,ey+12,x1,gy-14));
  var roof=[[x0-10,ey],[cx-w*0.45,rt],[cx+w*0.45,rt],[x1+10,ey]];FS(s,sol,roof);clipIn(s,[rows(x0-10,x1+10,rt+3,ey-1,3)],roof);
  var gab=[[cx-24,ey],[cx,rt-22],[cx+24,ey]];FS(s,sol,gab);s.push(circle(cx,ey-16,8));s.push([[cx,ey-16],[cx,ey-21]]);s.push([[cx,ey-16],[cx+4,ey-14]]);
  s.push([[cx,rt-22],[cx,rt-36],[cx+9,rt-33],[cx,rt-30]]);
  var vy=gy-14;s.push([[x0-8,vy],[x1+8,vy]]);var rail=[];for(var x=x0-6;x<x1+8;x+=5)rail.push([x,vy],[x,vy-8],[x,vy]);rail.unshift([x0-8,vy-8]);s.push([[x0-8,vy-8],[x1+8,vy-8]]);s.push(rail);
  for(var i=0;i<=6;i++){var px=x0+i*(2*w)/6;s.push([[px,ey],[px,gy]]);}
  [[x0+14,ey+14],[x0+40,ey+14],[x1-40,ey+14],[x1-14,ey+14]].forEach(function(p){var d=RP(p[0]-7,p[1],p[0]+7,p[1]+20);FS(s,sol,d,1.6,45);});
  var st=[];for(var k=0;k<4;k++)st.push(RP(cx-14-k*3,gy+k*4-4,cx+14+k*3,gy+k*4));st.forEach(function(P){s.push(poly(P));});
  // the field: mown stripes and a set of stumps
  var sx=RR(R,60,240),sy=RR(R,182,188);if(Math.abs(sx-cx)<20)sx=cx+60;for(var j=-1;j<=1;j++)s.push([[sx+j*4,sy],[sx+j*4,sy-18]]);s.push([[sx-5,sy-18],[sx+5,sy-18]]);
  bg.push(rows(4,296,gy+16,196,RR(R,4.5,5.5)));bg.push([[4,gy],[296,gy]]);
  for(var t=0;t<RI(R,3,5);t++){var tx=RR(R,10,290);if(Math.abs(tx-cx)>w+26)treeR(bg,R,tx,gy,RR(R,14,20),2.2);}
  return fin(s,R,bg,sol,gy-2);});

S('Suspension footbridge',['Walking on a Hammock','Cables to the Far Bank','Sway at Midspan','Over the Gorge River','Hangers in a Row'],function(R){
  var s=[],sol=[],bg=[],dy=RR(R,108,116),tl=RR(R,52,62),tr=RR(R,238,248),tt=RR(R,46,54),sag=RR(R,24,30);
  [tl,tr].forEach(function(x){var P=RP(x-5,tt,x+5,dy+48);FS(s,sol,P,1.4,90);s.push(RP(x-8,tt-4,x+8,tt));s.push([[x-5,dy-8],[x+5,dy-8]]);});
  var cab=quad([tl,tt],[(tl+tr)/2,tt+sag*2],[tr,tt],40);s.push(cab);s.push([[4,dy+30],[tl,tt]]);s.push([[tr,tt],[296,dy+30]]);
  var hg=[],d=1;for(var x=tl+8;x<tr-4;x+=8){var cy=interpY(cab,x);if(d>0)hg.push([x,cy],[x,dy]);else hg.push([x,dy],[x,cy]);d=-d;}s.push(hg);
  var deck=RP(4,dy,296,dy+5);SOL(s,sol,deck);clipIn(s,[zz(4,296,dy,dy+5,3)],deck);s.push([[4,dy-10],[296,dy-10]]);
  // gorge banks and river
  var lb=[[4,dy+5],[tl+20,dy+5],[tl+34,dy+50],[tl+20,196],[4,196]],rb=[[296,dy+5],[tr-20,dy+5],[tr-34,dy+56],[tr-18,196],[296,196]];
  [lb,rb].forEach(function(P,i){SOL(s,sol,P);H(s,P,RR(R,2.2,2.8),i?-60:60);});
  var riv=[[4,150],[296,150],[296,196],[4,196]];waterIn(bg,R,riv,154,194,RR(R,4.5,5.2));bg.push([[4,150],[296,150]]);
  hills(bg,R,148,RR(R,30,40),5);for(var t=0;t<RI(R,4,6);t++)conifer(bg,RR(R,10,290),RR(R,118,140),RR(R,22,34),RR(R,7,10));
  return fin(s,R,bg,sol,dy-12);});

S('Bottle kilns',['Potteries Skyline','Smoke Over the Bottle Ovens','Brick Shoulders','Firing Day','Three Kilns, One Yard'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,174,180),n=RI(R,2,3),xs=n===2?[RR(R,90,110),RR(R,190,210)]:[RR(R,62,74),RR(R,146,156),RR(R,226,238)];
  xs.forEach(function(x,i){var sc=n===2?1.1:0.9,bw=34*sc,nk=9*sc,h=RR(R,118,128)*sc,top=gy-h;
    var P=[[x-bw,gy]].concat(cubic([x-bw,gy-h*0.28],[x-bw*1.05,gy-h*0.62],[x-nk*1.2,gy-h*0.78],[x-nk,top+8],16)).concat([[x-nk-2,top],[x+nk+2,top],[x+nk,top+8]]).concat(cubic([x+nk*1.2,gy-h*0.78],[x+bw*1.05,gy-h*0.62],[x+bw,gy-h*0.28],[x+bw,gy],16));
    P.splice(1,0,[x-bw,gy-h*0.28]);SOL(s,sol,P);var br=[];for(var y=top+12;y<gy;y+=6)br.push(wave(x-bw-2,x+bw+2,y,0.6,8,y));clipIn(s,[serp(br)],P.filter(function(p){return true;}),[RP(x-bw,gy-h*0.5,x-bw*0.2,gy)]);
    s.push([[x-bw*1.02,gy-h*0.3],[x+bw*1.02,gy-h*0.3]]);s.push([[x-bw*0.95,gy-h*0.55],[x+bw*0.95,gy-h*0.55]]);
    var dr=archP(x,gy,8*sc,10*sc);FS(s,sol,dr,1.4,90);
    if(R()<0.8){s.push(curve([[x,top],[x+RR(R,-4,4),top-12],[x+10,top-22],[x+RR(R,4,16),top-34]],5));}});
  var shop=RP(xs[0]+20,gy-44,xs[xs.length-1]-20,gy);behind(s,[poly(shop),rows(shop[0][0],shop[1][0],gy-40,gy-4,6)],sol);sol.push(shop);
  var roofS=[[shop[0][0]-4,gy-44],[shop[1][0]+4,gy-44],[shop[1][0]-6,gy-56],[shop[0][0]+6,gy-56]];behind(s,[poly(roofS)],sol);sol.push(roofS);
  gnd(bg,R,gy);cobbles(bg,R,gy,sol);return fin(s,R,bg,sol,gy-3);});

S('Tipis by a river',['Camp at the Bend','Poles Against the Sky','Smoke from the Lodge','Evening by the Water','Three Lodges'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,138,146),n=RI(R,2,3);
  for(var i=0;i<n;i++){var x=n===2?[100,198][i]+RR(R,-8,8):[70,150,228][i]+RR(R,-6,6),h=RR(R,82,96)*(i===1?1:0.88),w=h*0.42,b=gy+RR(R,0,4),top=b-h;
    var P=[[x-w,b],[x-w*0.08,top+10],[x+w*0.08,top+10],[x+w,b]];SOL(s,sol,P);
    for(var k=-2;k<=2;k++)s.push([[x+k*2.4,top+10],[x+k*5,top-6]]);
    var seams=[],dd=1;for(var k2=-3;k2<=3;k2++){var bx=x+k2*w/3.5;if(dd>0)seams.push([x,top+10],[bx,b]);else seams.push([bx,b],[x,top+10]);dd=-dd;}clipIn(s,[seams],P);
    var dr=[[x-9,b],[x-2,b-24],[x+2,b-24],[x+9,b]];FS(s,sol,dr,1.3,90);
    s.push(wave(x-w*0.7,x+w*0.7,b-h*0.42,1.4,8,0));s.push(wave(x-w*0.86,x+w*0.86,b-h*0.2,1.4,8,1));
    for(var p=0;p<4;p++){var py=b-h*(0.55+p*0.06);s.push(circle(x-w*0.2+p*3,py,1.2));}}
  var riv=[[4,gy+16],[296,gy+10],[296,196],[4,196]];waterIn(s,R,riv,gy+18,194,RR(R,4.4,5));s.push([[4,gy+16],[296,gy+10]]);
  s.push(tufts(4,296,gy+12,5,R));gnd(bg,R,gy+8,RR(R,4,5),0);hills(bg,R,gy-2,RR(R,28,40),5);for(var t=0;t<RI(R,3,5);t++)conifer(bg,RR(R,10,290),gy-2,RR(R,26,40),RR(R,8,11));
  return fin(s,R,bg,sol,gy-4);});

S('Stepping stones across a stream',['One Foot, Then the Next','Dry Shoes, Almost','Path Through the Ford','Seven Stones','Cold Water Crossing'],function(R){
  var s=[],sol=[],bg=[],y0=RR(R,106,114),y1=RR(R,170,176);
  var bankT=wave(4,296,y0,3,RR(R,80,120),R()*6),bankB=wave(4,296,y1,3,RR(R,80,120),R()*6);s.push(bankT);s.push(bankB);
  var n=RI(R,6,8),stones=[];for(var i=0;i<n;i++){var t=(i+0.5)/n,x=RR(R,90,120)+t*RR(R,70,110)+Math.sin(t*5)*12,y=y0+8+(y1-y0-14)*t,rx=RR(R,17,23)*(0.75+t*0.5),ry=rx*0.42;
    var P=blob([[x-rx,y],[x-rx*0.6,y-ry],[x+rx*0.5,y-ry*1.1],[x+rx,y-ry*0.1],[x+rx*0.6,y+ry*0.9],[x-rx*0.5,y+ry]],5);FS(s,sol,P);
    H(s,P.filter(function(p){return p[1]>=y;}),RR(R,1.4,1.8),20);s.push(arc(x,y+ry*0.9,rx*1.15,ry*0.6,0.1,PI-0.1));stones.push(P);}
  var W=[[4,y0],[296,y0],[296,y1],[4,y1]];waterIn(bg,R,W,y0+4,y1-2,RR(R,4,4.6));
  for(var r=0;r<RI(R,3,4);r++){var rx2=pick(R,[RR(R,20,70),RR(R,230,285)]),ry2=pick(R,[y0,y1]);rocks(s,sol,R,rx2-14,rx2+14,ry2+3,10,2);}
  var reeds=[],rx3=RR(R,240,280);for(var k=0;k<6;k++){var bx=rx3+k*3;reeds.push([[bx,y0+2],[bx+RR(R,-4,4),y0-RR(R,22,34)]]);}A(s,reeds);
  var bank=[[4,y1],[296,y1],[296,196],[4,196]];H(bg,bank,RR(R,3.4,4),RR(R,12,24));A(bg,[grass(4,296,y1+2,5,4,R)]);
  hills(bg,R,y0-2,RR(R,22,32),5);for(var t=0;t<RI(R,3,4);t++)treeR(bg,R,RR(R,10,290),y0-2,RR(R,12,18),2.2);
  return fin(s,R,bg,sol,y0-4);});

S('Cedar of Lebanon',['Tiers of Old Green','Flat Shelves of Shade','Two Hundred Summers','Lawn Under the Cedar','Plates of Needles'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,172,178),cx=RR(R,135,165),th=RR(R,12,15);
  var trunk=[[cx-th-8,gy],[cx-th,gy-30],[cx-th*0.8,gy-150],[cx+th*0.8,gy-150],[cx+th,gy-30],[cx+th+10,gy]],tk=[poly(trunk),zz(cx,cx+th+8,gy-150,gy,2.6)];
  var tiers=RI(R,4,5),cols=[];for(var i=0;i<tiers;i++){var ty=gy-58-i*RR(R,22,26),half=RR(R,100,116)*(1-i*0.17),off=(i%2?1:-1)*RR(R,10,28),tx0=cx+off-half,tx1=cx+off+half,tk2=RR(R,6,9);
    var P=blob([[tx0,ty+2],[tx0+half*0.25,ty-tk2],[cx+off,ty-tk2-3],[tx1-half*0.25,ty-tk2],[tx1,ty+1],[tx1-half*0.3,ty+5],[cx+off,ty+4],[tx0+half*0.3,ty+5]],5);cols.push(P);
    tk.push([[cx,ty+10],[cx+off*0.5+(i%2?half*0.5:-half*0.5),ty+3]]);tk.push([[cx,ty+12],[cx-off*0.3-(i%2?half*0.4:-half*0.4),ty+4]]);}
  cols.forEach(function(P){SOL(s,sol,P);s.push(scallopOutline(P));});behind(s,tk,cols);sol.push(trunk);
  cols.forEach(function(P){var ys=P.map(function(p){return p[1];}),mid=(Math.min.apply(null,ys)+Math.max.apply(null,ys))/2;H(s,P.filter(function(p){return p[1]>=mid-2;}),RR(R,1.6,2),RR(R,-10,10));});
  gnd(bg,R,gy,RR(R,4.4,5.2),0);hills(bg,R,gy-2,RR(R,16,26),5);var hx=pick(R,[RR(R,10,40),RR(R,250,280)]);bg.push(rect(hx,gy-26,hx+28,gy));bg.push([[hx-3,gy-26],[hx+14,gy-38],[hx+31,gy-26]]);
  return fin(s,R,bg,sol,gy-3);});

S('Rope swing on an oak',['Long Summer Arc','Plank Seat, Frayed Rope','Waiting for Someone','Push Me Higher','The Old Swing'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,176,182),tx=RR(R,62,86);
  var bY=gy-RR(R,98,104),br=tube(curve([[tx,gy-92],[tx+60,bY-2],[tx+140,bY+6],[tx+186,bY]],8),function(u){return 7-4*u;});
  var crown=scallop(tx+14,gy-138,RR(R,84,94),RR(R,44,50),RI(R,13,16),0.12);crown.pop();SOL(s,sol,crown);H(s,crown.filter(function(p){return p[1]>=gy-150;}),RR(R,2.2,2.6),RR(R,20,40));
  SOL(s,sol,br.P);clipIn(s,[rows(tx,tx+192,bY-12,bY+14,2.4)],br.P);
  var trunk=[[tx-18,gy],[tx-12,gy-50],[tx-10,gy-100],[tx+12,gy-100],[tx+14,gy-50],[tx+22,gy]];SOL(s,sol,trunk);clipIn(s,[zz(tx,tx+24,gy-102,gy,2.8)],trunk);
  s.push(curve([[tx-6,gy-80],[tx-4,gy-50],[tx-8,gy-20]],5));s.push(EP(tx-1,gy-60,3,6));
  var rx=RR(R,tx+118,tx+150),sw=RR(R,-8,8),sy=gy-RR(R,28,36);
  s.push([[rx-2,bY+3],[rx-2+sw,sy]]);s.push([[rx+2,bY+3],[rx+2+sw,sy]]);var seat=RP(rx-16+sw,sy,rx+16+sw,sy+5);FS(s,sol,seat,1.2,0);
  [[rx-2,bY+3],[rx+2,bY+3]].forEach(function(p){s.push([[p[0]-3,p[1]-3],[p[0]+3,p[1]+2],[p[0]-3,p[1]+6]]);});
  s.push(poly(EP(rx+sw,gy+6,22,4)));
  gnd(bg,R,gy,RR(R,4.4,5),RR(R,-14,14));A(bg,[grass(4,296,gy,5,4,R)]);hills(bg,R,gy-4,RR(R,18,26),5);return fin(s,R,bg,sol,gy-5);});

S('Ocotillo',['Candles of the Desert','Red Tips After Rain','Whips in the Wind','Thorny Fountain','Spring on the Bajada'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,172,178),cx=RR(R,130,170),n=RI(R,9,11);
  for(var i=0;i<n;i++){var a=-PI/2+(i/(n-1)-0.5)*RR(R,1.3,1.6),L=RR(R,110,150),bend=RR(R,-14,14);
    var tip=[cx+Math.cos(a)*L,gy+Math.sin(a)*L],mid=[cx+Math.cos(a)*L*0.5+bend,gy+Math.sin(a)*L*0.5];var st=quad([cx+(i-n/2)*0.8,gy],mid,tip,18);
    var sp=[];for(var k=0;k<st.length;k++){sp.push(st[k]);if(k%2===1&&k<st.length-3)sp.push([st[k][0]+(k%4===1?4:-4),st[k][1]-2],st[k]);}s.push(sp);
    var fl=[];for(var j=0;j<8;j++)fl.push([tip[0]+(j%2?2.5:-2.5),tip[1]-j*2.2]);fl.push(tip);s.push(fl);}
  var base=EP(cx,gy,16,5);FS(s,sol,base,1.2,0);
  for(var r=0;r<RI(R,2,4);r++){var x=RR(R,20,280);if(Math.abs(x-cx)<40)continue;var P=blob([[x-10,gy],[x-8,gy-6],[x,gy-9],[x+9,gy-5],[x+10,gy]],4);FS(s,sol,P,1.5,60);}
  var pr=RR(R,30,60);if(R()<0.6){var pp=[[pr-2,gy],[pr-2,gy-30],[pr-10,gy-30],[pr-10,gy-44]];s.push(pp);s.push([[pr-2,gy-22],[pr+6,gy-22],[pr+6,gy-36]]);}
  gnd(bg,R,gy,RR(R,4.4,5.4),RR(R,-20,20));var m=[];hills(bg,R,gy-2,RR(R,34,48),5);
  return fin(s,R,bg,sol,gy-3);});

S('Fuchsia',['Ballerinas in a Basket','Dancing Earrings','Pink Skirts Hanging','Lanterns on the Stem','Greenhouse Shelf'],function(R){
  var s=[],sol=[],ty=RR(R,164,170),px=RR(R,135,165),pw=RR(R,26,30),ph=RR(R,30,36);
  var pot=[[px-pw,ty-ph],[px+pw,ty-ph],[px+pw*0.75,ty],[px-pw*0.75,ty]];FS(s,sol,pot);clipIn(s,[zz(px-pw,px+pw,ty-ph+8,ty,3)],pot);var rim=RP(px-pw-3,ty-ph-6,px+pw+3,ty-ph);FS(s,sol,rim,1.3,0);
  var stems=RI(R,4,5);for(var i=0;i<stems;i++){var dir=i%2?1:-1,len=RR(R,70,110)*(i<2?1.1:0.8),a0=[px+dir*RR(R,4,pw*0.7),ty-ph-6],top=[a0[0]+dir*len*0.45,a0[1]-RR(R,50,80)],end=[a0[0]+dir*len,a0[1]-RR(R,10,30)];
    var c=quad(a0,top,end,24);s.push(c);
    [8,16].forEach(function(k){var p=c[k];leafL(s,sol,p,[p[0]-dir*RR(R,6,10),p[1]-RR(R,14,18)],4.5,0);});
    [14,22].forEach(function(f){if(f>=c.length)return;var q=c[f],L=RR(R,12,18),fy=q[1]+L;s.push(quad(q,[q[0]+dir*4,q[1]+L*0.5],[q[0],fy],6));
      var tube2=[[q[0]-2,fy],[q[0]+2,fy],[q[0]+3,fy+6],[q[0]-3,fy+6]];FS(s,sol,tube2,1,0);
      [-1,1].forEach(function(sd){var sp=lens([q[0]+sd*2,fy+6],[q[0]+sd*14,fy-2],3);SOL(s,sol,sp);});
      var sk=[[q[0]-6,fy+6],[q[0]-8,fy+18],[q[0]-4,fy+16],[q[0],fy+20],[q[0]+4,fy+16],[q[0]+8,fy+18],[q[0]+6,fy+6]];FS(s,sol,sk,1.3,90);
      s.push([[q[0],fy+19],[q[0]-3,fy+30]]);s.push([[q[0],fy+19],[q[0]+1,fy+32]]);s.push([[q[0],fy+19],[q[0]+4,fy+29]]);});}
  onT(s,R,ty,sol);return s;});

S('Bracket fungi on a stump',['Shelves on the Old Stump','Turkey Tails','Woodland Steps','Autumn Brackets','Rot and Splendour'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,176,182),cx=RR(R,130,170),w=RR(R,50,58),h=RR(R,86,96),top=gy-h;
  var stump=[[cx-w-18,gy]].concat(curve([[cx-w-18,gy],[cx-w+2,gy-14],[cx-w+2,gy-h*0.5],[cx-w+4,top+10],[cx-w*0.5,top+RR(R,-2,4)],[cx-w*0.1,top+10],[cx+w*0.3,top-RR(R,8,14)],[cx+w*0.55,top+2],[cx+w-2,top+8],[cx+w-2,gy-h*0.5],[cx+w,gy-14],[cx+w+20,gy]],6));SOL(s,sol,stump);
  var bark=[];for(var x=cx-w+6;x<cx+w-4;x+=RR(R,6,9))bark.push(curve([[x,top+12],[x+RR(R,-3,3),top+h*0.5],[x+RR(R,-4,4),gy]],5));
  var brk=[],n=RI(R,6,8);for(var i=0;i<n;i++){var side=i%3===2?-1:1,bx=cx+side*RR(R,w*0.2,w*0.85),by=top+18+i*(h-30)/n,bw=RR(R,18,30),bh=bw*0.45;
    var B=[[bx-bw,by]].concat(arc(bx,by,bw,bh,0,PI).reverse()).concat([[bx+bw,by]]);B=arc(bx,by,bw,bh,0,PI);B.push([bx-bw,by]);brk.push(B);}
  brk.forEach(function(B){SOL(s,sol,B);var cxB=(B[0][0]+B[B.length-2][0])/2,by=B[0][1],bw=Math.abs(B[0][0]-cxB);for(var k=1;k<4;k++)s.push(arc(cxB,by,bw*(1-k*0.22),bw*0.45*(1-k*0.22),0.05,PI-0.05));});
  behind(s,[serp(bark)],brk);s.push([[cx-w*0.3,top+2],[cx,top+8]]);s.push(spiral(cx-4,top+4,1,10,2.5,0).map(function(p){return [p[0],top+4+(p[1]-top-4)*0.3];}));
  var fern=[];[[cx-w-30,gy],[cx+w+34,gy]].forEach(function(b,j){for(var k=0;k<3;k++){var d=k-1,c=quad(b,[b[0]+d*20,b[1]-40],[b[0]+d*34+(j?10:-10),b[1]-30],14);fern.push(spikes(c,2,6,1));}});A(s,fern);
  gnd(bg,R,gy,RR(R,3.6,4.4),RR(R,-20,20));for(var t=0;t<RI(R,5,7);t++){var tx=RR(R,6,294);if(Math.abs(tx-cx)>w+40){var tw=RR(R,6,10);bg.push(RP(tx-tw,4,tx+tw,gy));H(bg,RP(tx,4,tx+tw,gy),2.2,90);}}
  return fin(s,R,bg,sol,gy-3);});

S('Chalk cliffs',['White Walls of the Channel','Seven Sisters Light','Where the Downs Stop','Gulls and Chalk','Edge of the Land'],function(R){
  var s=[],sol=[],bg=[],n=RI(R,5,7),tp=[],bt=[];
  // the edge recedes from the left foreground to the right distance, rising and dipping over each "sister"
  for(var i=0;i<=n;i++){var t=i/n,x=4+292*Math.pow(t,0.8),base=40+t*70;tp.push([x,base+(i%2?-RR(R,6,12):RR(R,4,8))*(1-t*0.6)]);bt.push([x,150+t*(-34)]);}
  var top=curve(tp,8),bot=curve(bt,6);var face=top.concat(bot.slice().reverse());SOL(s,sol,face);
  var cr=[];for(var x=10;x<290;x+=RR(R,16,30)*(1-(x/300)*0.5)){var a=interpY(top,x)+2,b=interpY(bot,x)-1;if(b-a<8)continue;var sl=RR(R,-8,8);cr.push(curve([[x,a],[x+sl*0.4+RR(R,-2,2),(a+b)/2],[x+sl,b]],5));}clipIn(s,cr,face);H(s,face.filter(function(p,i){return true;}).slice(0,0).length?[]:[],2,0);
  var fl=[];for(var k=1;k<4;k++){var row=[];for(var x2=4;x2<=296;x2+=3){var a2=interpY(top,x2),b2=interpY(bot,x2);row.push([x2,a2+(b2-a2)*k/4+Math.sin(x2/7+k)*0.8]);}fl.push(row);}clipIn(s,[serp(fl)],face);
  // downs above the edge: turf hatch and a little lighthouse
  var downs=[[4,4]].concat(top.map(function(p){return [p[0],p[1]];})).concat([[296,4]]);var dn=[];H(dn,[[4,top[0][1]-30]].concat(top).concat([[296,top[top.length-1][1]-14]]),RR(R,3.4,4),RR(R,8,16));clipIn(s,dn,downs);
  var lx=RR(R,40,90),lt=interpY(top,lx)-6;var tower=RP(lx-5,lt-30,lx+5,lt);FS(s,sol,tower);s.push([[lx-8,lt-30],[lx,lt-40],[lx+8,lt-30]]);H(s,RP(lx-5,lt-20,lx+5,lt-12),1.4,0);s.push(RP(lx-10,lt-6,lx+10,lt));
  // beach and sea below the face
  var beach=[[4,150]].concat(bot).concat([[296,122],[296,132],[4,162]]);FS(s,sol,beach,2,20);
  var sea=[[4,162],[296,132],[296,196],[4,196]];waterIn(s,R,sea,134,194,RR(R,4.2,4.8));s.push([[4,162],[296,132]]);
  return fin(s,R,bg,sol,110);});

S('Tiger lilies',['Freckled and Curled','July by the Fence','Orange Turks-Caps','Spots and Stamens','Lilies at the Gate'],function(R){
  var s=[],sol=[],gy=RR(R,178,184),n=RI(R,2,3);
  for(var i=0;i<n;i++){var x=(n===2?[105,205]:[75,155,232])[i]+RR(R,-8,8),top=RR(R,38,50)+(i%2)*14,st=curve([[x,gy],[x+RR(R,-5,5),(gy+top)/2],[x+RR(R,-6,6),top]],8);s.push(st);
    var lv=[],d=1;for(var k=2;k<st.length-3;k+=2){var p=st[k];lv.push(p,[p[0]+d*RR(R,12,18),p[1]-RR(R,4,8)],p);d=-d;}s.push(lv);
    var tp=st[st.length-1],fl=RI(R,1,2);for(var f=0;f<fl;f++){var sd=(f?-1:1)*(i%2?1:-1),ex=tp[0]+sd*RR(R,18,24),ey=tp[1]+RR(R,10,14)+f*10;
      s.push(quad(tp,[ex,tp[1]-8],[ex,ey],8));var c=[ex,ey+5];
      [-2.75,-2.25,-1.85,-1.3,-0.9,-0.4].forEach(function(a,j){var L=RR(R,20,24),tip=[c[0]+Math.cos(a)*L,c[1]+Math.sin(a)*L];var P=lens(c,tip,4.2);SOL(s,sol,P);
        s.push(quad(tip,[tip[0]+Math.cos(a)*4,tip[1]+Math.sin(a)*4+3],[tip[0]+(Math.cos(a)>0?-2:2),tip[1]+6],5));
        var sp=[];for(var q=0.3;q<0.85;q+=0.18){var m=lerp(c,tip,q);sp.push(m,[m[0]+1.2,m[1]+1.2],m);}s.push(sp);});
      var stm=[];for(var j=0;j<6;j++){var a2=PI/2+(j-2.5)*0.15,e=[c[0]+Math.cos(a2)*24,c[1]+Math.sin(a2)*24];stm.push(c,e,[e[0]+2,e[1]],c);}s.push(stm);}}
  var bg=[],fy0=gy-64;for(var xx=8;xx<296;xx+=14)bg.push([[xx,gy],[xx,fy0+6],[xx+5,fy0],[xx+10,fy0+6],[xx+10,gy]]);bg.push([[4,fy0+16],[296,fy0+16]]);bg.push([[4,gy-14],[296,gy-14]]);
  gnd(bg,R,gy,RR(R,4,5),RR(R,-20,20));bg.push(rows(4,296,6,fy0-4,RR(R,6,7.5)));behind(s,bg,sol);return s;});


// ---- batch 15 chunk B: vehicles, animals, birds, insects, sea life ----
function bodyB(s,sol,pts,ox,oy,sc,fx,g,ang,cut){var P=blob(M(pts,ox,oy,sc,fx),6);SOL(s,sol,P);if(g){var ys=P.map(function(p){return p[1];}),y0=Math.min.apply(null,ys),y1=Math.max.apply(null,ys),yc=y0+(y1-y0)*(cut==null?0.55:cut);H(s,P.filter(function(p){return p[1]>=yc;}),g,ang||0);}return P;}
function legL(s,sol,pts,ox,oy,sc,fx,w){var P=tube(curve(M(pts,ox,oy,sc,fx),5),function(u){return w*(1-u*0.4);}).P;SOL(s,sol,P);return P;}

S('Jet airliner',['Climbing Out','Contrails at Noon','Wheels Up','Over the Runway Lights','Long Haul'],function(R){
  var s=[],sol=[],bg=[],cx=RR(R,140,160),cy=RR(R,88,98),L=RR(R,118,128),tilt=RR(R,-0.16,-0.08),fx=1;
  var F=[[-L,0],[-L+10,-8],[-L*0.3,-11],[L*0.55,-11],[L*0.82,-8],[L,-1],[L*0.84,5],[L*0.5,8],[-L*0.55,8],[-L+6,4]];
  var fus=rot(blob(M(F,cx,cy,1,fx),5),cx,cy,tilt);SOL(s,sol,fus);
  var win=[];for(var x=-L*0.6;x<L*0.6;x+=6){var p=rot([[cx+x,cy-3]],cx,cy,tilt)[0];win.push([p[0]-1.4,p[1]],[p[0]+1.4,p[1]],[p[0]+1.4,p[1]-2],[p[0]+3.6,p[1]-2]);}s.push(win);
  s.push(rot([[cx-L*0.5,cy+2],[cx+L*0.7,cy+2]],cx,cy,tilt));H(s,rot([[cx-L*0.55,cy+3],[cx+L*0.6,cy+3],[cx+L*0.5,cy+8],[cx-L*0.5,cy+8]],cx,cy,tilt),1.4,tilt*57);
  var ck=rot([[cx+L*0.78,cy-7],[cx+L*0.9,cy-6],[cx+L*0.92,cy-3],[cx+L*0.78,cy-3]],cx,cy,tilt);FS(s,sol,ck,0.9,0);
  var wing=rot([[cx-8,cy+4],[cx-52,cy+46],[cx-38,cy+48],[cx+30,cy+6]],cx,cy,tilt);FS(s,sol,wing);H(s,rot([[cx-8,cy+4],[cx-52,cy+46],[cx-46,cy+47],[cx+4,cy+6]],cx,cy,tilt),1.8,40);
  var far=rot([[cx+6,cy-9],[cx-18,cy-40],[cx-10,cy-41],[cx+28,cy-10]],cx,cy,tilt);behind(s,[poly(far)],sol);sol.push(far);
  [[-22,24],[-38,36]].forEach(function(o){var e=rot([[cx+o[0]-12,cy+o[1]-3],[cx+o[0]+12,cy+o[1]-4],[cx+o[0]+12,cy+o[1]+5],[cx+o[0]-12,cy+o[1]+6]],cx,cy,tilt);FS(s,sol,e,1.2,90);});
  var tail=rot([[cx-L+14,cy-6],[cx-L-2,cy-42],[cx-L+10,cy-42],[cx-L+40,cy-9]],cx,cy,tilt);FS(s,sol,tail);H(s,tail,2,70);
  var stab=rot([[cx-L+12,cy+1],[cx-L-10,cy+14],[cx-L+2,cy+14],[cx-L+28,cy+2]],cx,cy,tilt);FS(s,sol,stab,1.4,0);
  var gear=rot([[cx+10,cy+8],[cx+10,cy+18]],cx,cy,tilt);s.push(gear);s.push(circle(gear[1][0],gear[1][1]+3,3));
  // runway and terminal below, contrail behind the tail
  var gy=RR(R,176,182);bg.push([[4,gy],[296,gy]]);var rw=[];for(var x2=10;x2<296;x2+=26)rw.push(RP(x2,gy+6,x2+14,gy+9));rw.forEach(function(P){bg.push(poly(P));});bg.push(rows(4,296,gy+12,196,4));
  bg.push(RP(20,gy-18,120,gy));bg.push(rows(20,120,gy-14,gy-2,4));bg.push([[60,gy-18],[60,gy-34],[70,gy-34],[70,gy-18]]);bg.push(RP(54,gy-42,76,gy-34));
  return fin(s,R,bg,sol,gy-1);});

S('Station wagon',['Packed for the Coast','Wood-Panel Sides','Roof Rack Summer','Family Car','Long Back, Long Trip'],function(R){
  var s=[],sol=[],gy=RR(R,170,176),x0=RR(R,40,56),L=RR(R,200,212),x1=x0+L,bt=gy-RR(R,44,48),rt=bt-RR(R,30,34);
  var body=[[x0,gy-12],[x0+2,bt],[x0+18,bt-2],[x0+26,rt],[x1-62,rt],[x1-44,bt-2],[x1-6,bt+2],[x1,gy-16],[x1-4,gy-12]];FS(s,sol,body);
  var pan=[[x0+4,bt+8],[x1-70,bt+8],[x1-70,gy-18],[x0+4,gy-18]];s.push(poly(pan));clipIn(s,[zz(x0+4,x1-70,bt+8,gy-18,RR(R,5,7))],pan);
  s.push(rect(x0+6,bt+11,x1-73,gy-21));
  var wins=[[x0+22,bt-4,x0+56,rt+4],[x0+60,bt-4,x0+108,rt+4],[x0+112,bt-4,x1-66,rt+4]];wins.forEach(function(w,i){var P=i===0?[[w[0],w[1]],[w[0]+6,w[3]],[w[2],w[3]],[w[2],w[1]]]:i===2?[[w[0],w[1]],[w[0],w[3]],[w[2]-4,w[3]],[w[2]+10,w[1]]]:RP(w[0],w[3],w[2],w[1]);FS(s,sol,P,2.2,60);});
  s.push([[x1-6,bt+6],[x1,bt+6]]);s.push(rect(x1-8,bt+10,x1-2,bt+18));s.push(rect(x0-2,bt+4,x0+4,bt+12));
  var rack=[[x0+28,rt-6],[x1-66,rt-6]];s.push(rack);for(var r=0;r<4;r++){var rx=x0+34+r*(L-104)/3;s.push([[rx,rt],[rx,rt-6]]);}
  var lug=RP(x0+50,rt-22,x0+120,rt-6);FS(s,sol,lug);clipIn(s,[rows(x0+50,x0+120,rt-18,rt-8,4)],lug);s.push([[x0+60,rt-6],[x0+74,rt-22]]);
  if(R()<0.6){var sb=[[x0+120,rt-8],[x0+178,rt-14],[x0+180,rt-10],[x0+122,rt-4]];FS(s,sol,sb,1.6,0);}
  s.push([[x0-4,gy-12],[x1+4,gy-12]]);[x0+40,x1-40].forEach(function(wx){s.push(arc(wx,gy-14,19,19,PI,TAU));tyre(s,sol,wx,gy-8,15,1.4);});
  var bg=[];road(bg,R,gy);hills(bg,R,gy-2,RR(R,22,32),5);for(var t=0;t<4;t++){var tx=RR(R,10,290);bg.push([[tx,gy-2],[tx,gy-30]]);s.push([]);}
  var palm=pick(R,[RR(R,14,30),RR(R,270,290)]);bg.push(curve([[palm,gy-2],[palm+4,gy-40],[palm+2,gy-80]],6));for(var k=0;k<5;k++){var a=PI+k*PI/4;bg.push(quad([palm+2,gy-80],[palm+2+Math.cos(a)*14,gy-92],[palm+2+Math.cos(a)*28,gy-76+Math.abs(Math.cos(a))*4],8));}
  return fin(s,R,bg,sol,gy-3);});

S('Sampan',['Market Boat at Dawn','Canopy of Woven Reed','One Oar at the Stern','River Home','Drifting Downstream'],function(R){
  var s=[],sol=[],bg=[],wy=RR(R,138,146),cx=RR(R,140,160),L=RR(R,110,120);
  var hull=[[cx-L,wy-16],[cx-L*0.7,wy+8],[cx+L*0.65,wy+8],[cx+L,wy-20],[cx+L*0.9,wy-16],[cx-L*0.88,wy-12]];FS(s,sol,hull);clipIn(s,[rows(cx-L,cx+L,wy-6,wy+8,2.4)],hull);
  s.push([[cx-L*0.88,wy-12],[cx+L*0.9,wy-16]].map(function(p){return [p[0],p[1]+4];}));
  var ch=[[cx-50,wy-12],[cx-50,wy-30]].concat(arc(cx-6,wy-30,44,22,PI,TAU)).concat([[cx+38,wy-30],[cx+38,wy-14]]);FS(s,sol,ch);
  var ribs=[],d=1;for(var x=cx-46;x<cx+36;x+=5){var t=interpY(arc(cx-6,wy-30,44,22,PI,TAU),x);ribs.push(d>0?[x,t]:[x,wy-14],d>0?[x,wy-14]:[x,t]);d=-d;}clipIn(s,[ribs],ch);
  var oar=[[cx+L*0.85,wy-22],[cx+L*0.5,wy-58]];s.push(oar);var bl=[[cx+L*0.85,wy-22],[cx+L+14,wy+10],[cx+L+8,wy+12],[cx+L*0.8,wy-18]];FS(s,sol,bl,1.2,60);
  var bsk=[[cx-L*0.7,wy-12],[cx-L*0.7+4,wy-26],[cx-L*0.7+22,wy-26],[cx-L*0.7+24,wy-12]];FS(s,sol,bsk);clipIn(s,[zz(cx-L*0.7,cx-L*0.7+24,wy-26,wy-12,3)],bsk);
  for(var f=0;f<3;f++){var fx=cx-L*0.7+5+f*7;s.push(circle(fx,wy-30,3.2));}
  s.push(wave(cx-L-10,cx+L+20,wy+12,1.2,14,0));var ref=[];for(var r=0;r<4;r++)ref.push(wave(cx-L*0.6,cx+L*0.6,wy+16+r*4,1,10,r));clipIn(s,ref,RP(cx-L,wy+13,cx+L,wy+32));
  var W=[[4,wy],[296,wy],[296,196],[4,196]];waterIn(bg,R,W,wy+2,194,RR(R,4.6,5.4),[RP(cx-L,wy+13,cx+L,wy+32)]);
  var sh=[];var sy=wy-RR(R,30,40);sh.push([[4,wy],[4,sy]]);for(var k=0;k<5;k++){var kx=RR(R,10,290);if(Math.abs(kx-cx)<L)continue;var hh=RR(R,40,70);bg.push(curve([[kx,wy],[kx+RR(R,-4,4),wy-hh*0.5],[kx+RR(R,-10,10),wy-hh]],5));for(var j=0;j<4;j++){var a=-PI/2+(j-1.5)*0.7;bg.push(quad([kx,wy-hh],[kx+Math.cos(a)*10,wy-hh-6],[kx+Math.cos(a)*18,wy-hh+8],6));}}
  peaksMini;bg.push([[4,wy-2],[296,wy-2]]);hills(bg,R,wy-4,RR(R,40,60),5);return fin(s,R,bg,sol,wy-6);});

S('Street sweeper',['Before the Shops Open','Brushes Turning','Clean Kerb','Night Rounds','Gutter Dance'],function(R){
  var s=[],sol=[],gy=RR(R,168,174),x0=RR(R,50,66),L=RR(R,176,186),x1=x0+L;
  var cab=[[x1-64,gy-20],[x1-64,gy-96],[x1-10,gy-96],[x1,gy-60],[x1,gy-20]];FS(s,sol,cab);var ws=[[x1-58,gy-90],[x1-14,gy-90],[x1-6,gy-62],[x1-58,gy-62]];FS(s,sol,ws,2,60);s.push([[x1-36,gy-90],[x1-36,gy-62]]);
  var hop=[[x0,gy-24],[x0,gy-80],[x0+10,gy-88],[x1-66,gy-88],[x1-66,gy-24]];FS(s,sol,hop);clipIn(s,[rows(x0,x1-66,gy-82,gy-30,6)],hop);
  s.push(RP(x0+14,gy-74,x0+60,gy-50));s.push([[x0+18,gy-44],[x1-72,gy-44]]);var bk=RP(x0+70,gy-82,x0+80,gy-30);FS(s,sol,bk,1.6,90);
  var lt=RP(x1-50,gy-104,x1-26,gy-96);FS(s,sol,lt,1.2,0);s.push([[x0-4,gy-24],[x1+4,gy-24]]);
  [[x0+30,10],[x1-30,12]].forEach(function(w){s.push(arc(w[0],gy-w[1],w[1]+4,w[1]+4,PI,TAU));tyre(s,sol,w[0],gy-w[1],w[1],1.4);});
  // rotating gutter brush under the cab
  var bx=x1-80,by=gy-6;var brush=EP(bx,by,14,5);s.push(poly(brush));var br=[];for(var k=0;k<22;k++){var a=k/22*TAU,p=[bx+14*Math.cos(a),by+5*Math.sin(a)];br.push(p,[p[0]+Math.cos(a)*7,p[1]+Math.sin(a)*3+2],p);}s.push(br);s.push([[bx,by],[bx+6,gy-26]]);
  var sp=[];for(var j=0;j<8;j++)sp.push([bx-20-j*6,gy-1+(j%2?-2:0)]);s.push(sp);
  var bg=[];road(bg,R,gy);bg.push([[4,gy-6],[296,gy-6]]);for(var lx=20;lx<296;lx+=RR(R,90,120)){bg.push([[lx,gy-6],[lx,gy-110],[lx+16,gy-114]]);bg.push(RP(lx+12,gy-116,lx+24,gy-110));}
  facade(bg,R,gy-6,sol);behind(s,bg,sol);return sky(s,R,gy-8,sol);});

S('Auto rickshaw',['Three Wheels, One Horn','Waiting at the Rank','Canvas Roof, Open Sides','Rush Hour Hop','Meter Running'],function(R){
  var s=[],sol=[],gy=RR(R,170,176),cx=RR(R,140,160);
  var roof=[[cx-58,gy-108],[cx+40,gy-108],[cx+56,gy-96],[cx+56,gy-90],[cx-58,gy-90]];FS(s,sol,roof);clipIn(s,[rows(cx-58,cx+56,gy-104,gy-92,3)],roof);
  var nose=[[cx+40,gy-90],[cx+60,gy-90],[cx+74,gy-40],[cx+66,gy-22],[cx+44,gy-22]];FS(s,sol,nose);s.push([[cx+46,gy-86],[cx+60,gy-86],[cx+64,gy-60],[cx+46,gy-60]]);H(s,[[cx+46,gy-86],[cx+60,gy-86],[cx+64,gy-60],[cx+46,gy-60]],2,60);
  s.push(circle(cx+70,gy-50,4));var rear=[[cx-60,gy-90],[cx-58,gy-26],[cx-10,gy-26],[cx-6,gy-60],[cx-30,gy-60],[cx-34,gy-90]];FS(s,sol,rear);clipIn(s,[zz(cx-60,cx-34,gy-90,gy-62,3.4)],rear);
  s.push([[cx-6,gy-90],[cx-6,gy-60]]);s.push([[cx+40,gy-90],[cx+40,gy-60]]);var seat=[[cx-34,gy-60],[cx-8,gy-60],[cx-8,gy-48],[cx-32,gy-48]];FS(s,sol,seat,1.4,0);
  s.push([[cx+10,gy-60],[cx+24,gy-68],[cx+40,gy-66]]);s.push(circle(cx+24,gy-68,3));
  var fl=[[cx-60,gy-26],[cx+66,gy-26]];s.push(fl);s.push([[cx-58,gy-34],[cx+44,gy-34]]);
  [[cx-38,13],[cx+54,12]].forEach(function(w){s.push(arc(w[0],gy-w[1],w[1]+4,w[1]+4,PI,TAU));tyre(s,sol,w[0],gy-w[1],w[1],1.3);});
  var bg=[];road(bg,R,gy);facade(bg,R,gy-2,sol);behind(s,bg,sol);return sky(s,R,gy-3,sol);});

S('Greyhound',['Born to Run','Long Nose, Soft Eyes','Retired and Resting','Lean in the Morning','Waiting at the Gate'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,174,180),x=RR(R,130,160),sc=RR(R,1.3,1.45),fx=sgn(R);
  var B=[[-46,-62],[-20,-67],[10,-64],[30,-62],[40,-74],[50,-86],[60,-87],[72,-82],[84,-78],[82,-74],[64,-73],[54,-68],[46,-56],[42,-42],[28,-37],[10,-40],[-8,-52],[-28,-52],[-44,-56]];
  var P=blob(M(B,x,gy,sc,fx),4);SOL(s,sol,P);
  var legs=[[[34,-42],[36,-20],[38,0],[44,0]],[[26,-40],[26,-20],[25,0],[31,0]],[[-38,-56],[-46,-36],[-38,-14],[-42,0],[-36,0]],[[-28,-52],[-34,-32],[-26,-14],[-30,0],[-24,0]]];
  legs.forEach(function(L,i){var p=M(L,x,gy,sc,fx);var t=tube(curve(p.slice(0,p.length-1),5),function(u){return (i<2?2.6:3.4)*(1-u*0.4)*sc;});SOL(s,sol,t.P);s.push(p.slice(p.length-2));});
  s.push(curve(M([[-46,-60],[-60,-44],[-62,-22],[-54,-10]],x,gy,sc,fx),6));
  var ear=blob(M([[54,-86],[48,-92],[44,-86],[50,-82]],x,gy,sc,fx),3);FS(s,sol,ear,0.9,0);s.push(circle(x+fx*64*sc,gy-82*sc,1.5));s.push(circle(x+fx*83*sc,gy-77*sc,1.6));s.push(M([[66,-74],[76,-75]],x,gy,sc,fx));
  H(s,blob(M([[-8,-54],[10,-42],[28,-39],[40,-44],[30,-50],[0,-58]],x,gy,sc,fx),4),1.8,fx*25);H(s,blob(M([[-40,-58],[-20,-64],[0,-62],[-10,-56],[-36,-54]],x,gy,sc,fx),4),2,0);
  s.push(curve(M([[40,-70],[44,-60],[46,-56]],x,gy,sc,fx),4));
  gnd(bg,R,gy,RR(R,4,4.8),RR(R,-14,14));var fy=gy-RR(R,40,48);bg.push([[4,fy],[296,fy]]);bg.push([[4,fy+12],[296,fy+12]]);for(var px=10;px<296;px+=30)bg.push([[px,gy],[px,fy-6]]);
  hills(bg,R,fy-4,RR(R,18,26),5);return fin(s,R,bg,sol,fy-8);});

S('Gorilla',['Silverback Resting','Knuckles Down','The Quiet Giant','Forest Elder','Long Look Back'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,178,184),cx=RR(R,138,162),sc=RR(R,1.0,1.1);function Q(a,b){return [cx+a*sc,gy+b*sc];}
  var head=blob([Q(-20,-128),Q(-14,-150),Q(0,-160),Q(14,-150),Q(20,-128),Q(10,-114),Q(-10,-114)],6);
  var body=blob([Q(-30,-118),Q(-62,-106),Q(-66,-80),Q(-50,-40),Q(-40,-6),Q(40,-6),Q(50,-40),Q(66,-80),Q(62,-106),Q(30,-118)],6);
  var arms=[-1,1].map(function(sd){return tube(curve([Q(sd*58,-100),Q(sd*76,-70),Q(sd*80,-30),Q(sd*78,-6)],6),function(u){return (16-4*u)*sc;}).P;});
  arms.forEach(function(A2){FS(s,sol,A2);H(s,A2,2,80);});
  [-1,1].forEach(function(sd){var k=EP(cx+sd*78*sc,gy-4*sc,12*sc,5*sc);FS(s,sol,k);for(var f=-1;f<=1;f++)s.push([[cx+sd*78*sc+f*5,gy-8*sc],[cx+sd*78*sc+f*5,gy-1]]);});
  SOL(s,sol,body);var face=blob([Q(-13,-136),Q(13,-136),Q(15,-122),Q(8,-112),Q(-8,-112),Q(-15,-122)],5);FS(s,sol,face);SOL(s,sol,head);
  s.push([Q(-14,-136),Q(-6,-140),Q(0,-137),Q(6,-140),Q(14,-136)]);s.push(circle(cx-6*sc,gy-131*sc,1.6));s.push(circle(cx+6*sc,gy-131*sc,1.6));
  s.push(arc(cx,gy-122*sc,7*sc,3*sc,0,PI));s.push(circle(cx-3*sc,gy-123*sc,1.2));s.push(circle(cx+3*sc,gy-123*sc,1.2));s.push([Q(-6,-115),Q(6,-115)]);
  var hf=[];H(hf,head,2,60);clipIn(s,hf,head,[face]);
  s.push(arc(cx-18*sc,gy-92*sc,18*sc,10*sc,0.2,PI-0.2));s.push(arc(cx+18*sc,gy-92*sc,18*sc,10*sc,0.2,PI-0.2));
  var fur=[];H(fur,body,2.4,60);clipIn(s,fur,body,[blob([Q(-30,-100),Q(30,-100),Q(26,-56),Q(-26,-56)],5)]);
  [-1,1].forEach(function(sd){var lg=blob([Q(sd*10,-30),Q(sd*46,-36),Q(sd*52,-10),Q(sd*20,-4)],5);FS(s,sol,lg,2.2,sd*40);});
  gnd(bg,R,gy,RR(R,4,5),RR(R,-20,20));for(var k=0;k<RI(R,4,6);k++){var tx=RR(R,6,294),tw=RR(R,6,12);if(Math.abs(tx-cx)<100)continue;bg.push(RP(tx-tw,4,tx+tw,gy));H(bg,RP(tx,4,tx+tw,gy),2,90);}
  var lv=[];for(var j=0;j<14;j++){var lx=RR(R,8,292),ly=RR(R,10,gy-40);lv.push(poly(lens([lx,ly],[lx+RR(R,-20,20),ly+RR(R,10,18)],4)));}A(bg,lv);behind(s,bg,sol);return s;});

S('Fawn in the ferns',['Spots in the Bracken','Lying Still','First Morning','Hidden at the Wood Edge','Ears Up'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,170,176),x=RR(R,130,160),sc=RR(R,1.2,1.35),fx=sgn(R);
  var B=[[-40,-30],[-30,-40],[-4,-42],[18,-42],[28,-56],[30,-70],[40,-76],[54,-72],[60,-66],[50,-62],[40,-58],[36,-44],[30,-28],[6,-24],[-24,-24],[-40,-26]];
  var P=bodyB(s,sol,B,x,gy-14,sc,fx,2.2,10,0.75);
  [[[-34,-28],[-38,-12],[-34,4]],[[-24,-26],[-22,-12],[-26,4]],[[22,-30],[26,-14],[22,4]],[[30,-32],[34,-14],[32,4]]].forEach(function(L){legL(s,sol,L,x,gy-14,sc,fx,2.6);});
  [[[38,-74],[34,-90],[30,-84]],[[46,-76],[50,-92],[54,-80]]].forEach(function(E){var e=blob(M(E,x,gy-14,sc,fx),4);FS(s,sol,e,0.9,90);});
  s.push(circle(x+fx*48*sc,gy-14-70*sc,1.8));s.push(circle(x+fx*59*sc,gy-14-66*sc,1.2));
  var sp=[];for(var k=0;k<12;k++){var px=RR(R,-30,20),py=RR(R,-38,-30),p=M([[px,py]],x,gy-14,sc,fx)[0];sp.push(EP(p[0],p[1],2,1.3));}sp.forEach(function(e){s.push(poly(e));});
  var fr=[];for(var f=0;f<RI(R,7,9);f++){var bx=RR(R,6,294),h=RR(R,40,70),dir=bx<x?1:-1,c=quad([bx,gy+6],[bx+dir*h*0.3,gy-h],[bx+dir*h*0.8,gy-h*0.6],14);fr.push(spikes(c,1,RR(R,7,10),dir));}
  var front=fr.filter(function(_,i){return i<3;}),back2=fr.slice(3);A(s,front);gnd(bg,R,gy,RR(R,4,5),RR(R,-20,20));A(bg,back2);for(var t=0;t<RI(R,4,6);t++){var tx=RR(R,6,294),tw=RR(R,5,9);bg.push(RP(tx-tw,4,tx+tw,gy-30));}
  return fin(s,R,bg,sol,gy-28);});

S('Platypus',['Duck Bill, Beaver Tail','Paddling the Creek','Dusk Forager','Odd and Wonderful','Bubbles Rising'],function(R){
  var s=[],sol=[],bg=[],cx=RR(R,140,160),cy=RR(R,108,116),sc=RR(R,1.3,1.45),fx=sgn(R);
  var B=[[-60,-2],[-40,-14],[-6,-18],[26,-14],[42,-6],[44,6],[24,14],[-10,16],[-40,12],[-60,6]];var P=bodyB(s,sol,B,cx,cy,sc,fx,1.5,8,0.45);
  var bill=blob(M([[40,-6],[60,-8],[76,-4],[78,4],[60,6],[42,6]],cx,cy,sc,fx),4);FS(s,sol,bill,1.2,0);s.push(M([[44,0],[76,0]],cx,cy,sc,fx));s.push(circle(cx+fx*34*sc,cy-6*sc,1.6));
  var tail=blob(M([[-58,-6],[-82,-8],[-92,0],[-82,8],[-58,6]],cx,cy,sc,fx),4);FS(s,sol,tail);H(s,tail,2.2,90);
  [[[16,12],[24,24],[34,24]],[[-34,12],[-40,24],[-30,26]]].forEach(function(L){var p=M(L,cx,cy,sc,fx);s.push(p);var w=p[2];s.push([[w[0]-4,w[1]],[w[0],w[1]+4],[w[0]+4,w[1]],[w[0]+8,w[1]+3]]);});
  var bub=[],bx=cx+fx*70*sc,by=cy-10;for(var k=0;k<4;k++)bub.push(circle(bx+(k%2?3:-2),by-k*12-6,2+k*0.6));A(s,bub);s.push([[bx,by],[bx,by-6]]);
  var W=[[4,4],[296,4],[296,196],[4,196]];var bg2=[];waterIn(bg2,R,W,8,150,RR(R,5,6));seabed(bg,R,RR(R,160,166),RI(R,3,5));A(bg,bg2.filter(function(st){return st[0][1]<150;}));
  
  behind(s,bg,sol);return s;});

S('Chipmunk on a stump',['Cheeks Full','Stripes on the Stump','Lookout Post','Acorn Accountant','Quick Pause'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,180,186),cx=RR(R,130,170),sw=RR(R,58,66),st=gy-RR(R,44,50);
  var stump=[[cx-sw-16,gy],[cx-sw,gy-10],[cx-sw,st]].concat(arc(cx,st,sw,10,PI,0)).concat([[cx+sw,gy-10],[cx+sw+18,gy]]);FS(s,sol,stump);
  s.push(ellipse(cx,st,sw,10));s.push(spiral(cx,st,1,sw*0.85,5,0).map(function(p){return [p[0],st+(p[1]-st)*0.18];}));
  var bark=[];for(var x0=cx-sw+6;x0<cx+sw;x0+=RR(R,6,9))bark.push([[x0,st+10],[x0+RR(R,-3,3),gy-2]]);clipIn(s,bark,stump);
  var x=cx+RR(R,-10,10),b=st+3,sc=RR(R,1.75,1.95),fx=sgn(R);
  var tl=tube(quad(M([[-14,-6]],x,b,sc,fx)[0],M([[-40,-12]],x,b,sc,fx)[0],M([[-32,-46]],x,b,sc,fx)[0],14),function(u){return (3.6+2*Math.sin(u*PI))*sc*0.7;}).P;FS(s,sol,tl);H(s,tl,1.8,40);
  var B=[[-16,-4],[-22,-22],[-14,-40],[2,-46],[10,-52],[20,-54],[28,-46],[24,-38],[14,-32],[14,-16],[10,0]];var P=blob(M(B,x,b,sc,fx),5);SOL(s,sol,P);
  var str=[[[-14,-36],[8,-42]],[[-18,-26],[10,-32]]].map(function(L){return M(L,x,b,sc,fx);});
  str.forEach(function(L){var d=lens(L[0],L[1],2.6*sc);FS(s,sol,d,1,0);});s.push(M([[-18,-16],[10,-22]],x,b,sc,fx));
  s.push(circle(x+fx*18*sc,b-46*sc,2));s.push(circle(x+fx*18*sc,b-46*sc,0.8));s.push(M([[16,-42],[26,-41]],x,b,sc,fx));s.push(M([[22,-48],[27,-47]],x,b,sc,fx));
  var ear=blob(M([[12,-52],[12,-60],[16,-54]],x,b,sc,fx),4);s.push(poly(ear));s.push(poly(EP(x+fx*20*sc,b-38*sc,5*sc,3.5*sc)));
  var paw=M([[14,-30],[20,-26],[22,-22]],x,b,sc,fx);s.push(paw);var nut=EP(paw[2][0]+fx*4,paw[2][1]+3,5,6);FS(s,sol,nut);H(s,RP(nut[0][0]-6,paw[2][1]-4,nut[0][0]+2,paw[2][1]+2),1,0);
  s.push([M([[4,0]],x,b,sc,fx)[0],M([[8,-6]],x,b,sc,fx)[0]]);
  gnd(bg,R,gy,RR(R,4,5),RR(R,-20,20));for(var k=0;k<RI(R,4,6);k++){var tx=RR(R,6,294),tw=RR(R,6,10);if(Math.abs(tx-cx)<sw+10)continue;bg.push(RP(tx-tw,4,tx+tw,gy));H(bg,RP(tx,4,tx+tw,gy),2.2,90);}
  for(var m=0;m<RI(R,2,3);m++){var mx=pick(R,[RR(R,20,cx-sw-20),RR(R,cx+sw+20,280)]);bg.push([[mx-2,gy],[mx-2,gy-10],[mx+2,gy-10],[mx+2,gy]]);bg.push(arc(mx,gy-10,9,7,PI,TAU).concat([[mx-9,gy-10]]));}
  A(bg,[grass(4,296,gy,6,4,R)]);behind(s,bg,sol);return sky(s,R,gy-2,sol);});

S('Emu',['Long Legs, Shaggy Coat','Outback Wanderer','Three Toes in the Dust','Curious Stare','Big Bird, Red Earth'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,174,180),x=RR(R,130,160),sc=RR(R,1.05,1.15),fx=sgn(R);
  var B=[[-46,-80],[-30,-100],[0,-106],[22,-100],[32,-88],[24,-72],[-6,-64],[-36,-66]];var P=bodyB(s,sol,B,x,gy,sc,fx,0);
  var fe=[],d=1;for(var t=0;t<=1.001;t+=0.05){var p=lerp(M([[-40,-90]],x,gy,sc,fx)[0],M([[22,-92]],x,gy,sc,fx)[0],t);fe.push(d>0?[p[0],p[1]-6]:[p[0]+fx*3,p[1]+22]);d=-d;}clipIn(s,[fe],P);
  var neck=tube(curve(M([[22,-96],[34,-118],[34,-140],[40,-156]],x,gy,sc,fx),6),function(u){return 5-1.5*u;}).P;FS(s,sol,neck);clipIn(s,[zz(x-60,x+60,gy-160*sc,gy-96*sc,3)],neck);
  var hd=blob(M([[36,-160],[46,-162],[56,-156],[44,-152],[36,-152]],x,gy,sc,fx),4);FS(s,sol,hd);s.push(circle(x+fx*43*sc,gy-157*sc,1.4));
  [[[-6,-66],[-10,-36],[-2,-2]],[[8,-68],[12,-36],[6,-2]]].forEach(function(L){var p=M(L,x,gy,sc,fx);var lg=tube(curve(p,5),function(u){return 2.6-u;}).P;FS(s,sol,lg);var f=p[2];s.push([[f[0]-8,f[1]+2],[f[0],f[1]],[f[0]+8*fx,f[1]+2]]);s.push([f,[f[0]+2*fx,f[1]+3]]);
    var kn=lerp(p[0],p[1],0.9);s.push(rows(kn[0]-2,kn[0]+2,kn[1],kn[1]+20,3));});
  gnd(bg,R,gy,RR(R,4,5),RR(R,-20,20));for(var k=0;k<RI(R,3,5);k++){var sx=RR(R,10,290);if(Math.abs(sx-x)<40)continue;bg.push(spiky(sx,gy-6,4,6,10,R));}
  hills(bg,R,gy-2,RR(R,16,26),5);acacia(bg,pick(R,[RR(R,20,60),RR(R,240,280)]),gy-2,RR(R,12,16));return fin(s,R,bg,sol,gy-4);});

S('Albatross over the waves',['Ten Feet of Wing','Riding the Swell Wind','Southern Ocean','Never Flapping','Wave-Skimmer'],function(R){
  var s=[],sol=[],bg=[],cx=RR(R,140,160),cy=RR(R,74,86),span=RR(R,128,140),tilt=RR(R,-0.12,0.12);
  var lw=[[cx-10,cy],[cx-span*0.5,cy-RR(R,10,16)],[cx-span,cy+RR(R,4,10)],[cx-span*0.55,cy+4],[cx-10,cy+8]],rw=[[cx+10,cy],[cx+span*0.5,cy-RR(R,8,14)],[cx+span,cy+RR(R,0,8)],[cx+span*0.55,cy+4],[cx+10,cy+8]];
  [lw,rw].forEach(function(W){var P=rot(blob(W,5),cx,cy,tilt);FS(s,sol,P);var tipH=rot([[W[2][0],W[2][1]],lerp(W[1],W[2],0.4),lerp(W[3],W[2],0.4)],cx,cy,tilt);H(s,tipH,1.4,0);
    s.push(rot(curve([W[0],lerp(W[0],W[1],0.5),[W[1][0],W[1][1]+6],lerp(W[1],W[2],0.6)],5),cx,cy,tilt));});
  var body=rot(blob([[cx-24,cy+2],[cx-6,cy-6],[cx+20,cy-4],[cx+30,cy+2],[cx+20,cy+8],[cx-8,cy+8]],5),cx,cy,tilt);FS(s,sol,body);
  var hd=rot(blob([[cx+24,cy-6],[cx+34,cy-8],[cx+40,cy-4],[cx+32,cy+2]],4),cx,cy,tilt);FS(s,sol,hd);var bill=rot([[cx+38,cy-6],[cx+52,cy-3],[cx+40,cy]],cx,cy,tilt);FS(s,sol,bill,0.9,0);
  var e=rot([[cx+33,cy-5]],cx,cy,tilt)[0];s.push(circle(e[0],e[1],1.2));var tl=rot([[cx-24,cy+2],[cx-34,cy],[cx-34,cy+6],[cx-24,cy+6]],cx,cy,tilt);FS(s,sol,tl,1,0);
  var sea=[];var hz=RR(R,120,126);sea.push([[4,hz],[296,hz]]);var y=hz+4,d=1,rw2=[];while(y<196){var w=wave(4,296,y,1+(y-hz)*0.05,RR(R,14,24)+(y-hz)*0.4,R()*6);if(d<0)w.reverse();A(rw2,w);d=-d;y+=4+(y-hz)*0.06;}sea.push(rw2);
  var cr=RR(R,30,90);var crest=[[cr-40,hz+40]].concat(quad([cr-40,hz+40],[cr,hz+14],[cr+50,hz+34],14));s.push(crest);
  behind(s,sea,sol);return sky(s,R,hz-1,sol);});

S('Blue tit at a feeder',['Peanuts in the Wire','Upside Down for Lunch','Little Acrobat','Garden Visitor','Blue Cap, Yellow Vest'],function(R){
  var s=[],sol=[],cx=RR(R,120,180),top=RR(R,22,28),fw=RR(R,20,24),fh=RR(R,100,108);
  s.push([[cx,4],[cx,top-8]]);var cap=[[cx-fw-4,top],[cx,top-12],[cx+fw+4,top]];FS(s,sol,cap,1.6,0);
  var cage=RP(cx-fw,top,cx+fw,top+fh);var side=sgn(R),bx=cx+side*(fw+2),by=top+RR(R,46,60),sc=RR(R,1.7,1.9),fx=side;
  var B=[[-4,-10],[6,-18],[18,-16],[24,-6],[20,8],[6,14],[-6,10]];var P=blob(M(B,bx,by,sc,fx),5);SOL(s,sol,P);
  var belly=blob(M([[8,-4],[20,-2],[18,8],[6,12]],bx,by,sc,fx),4);H(s,belly,1.6,0);
  var capS=blob(M([[6,-18],[18,-18],[22,-12],[10,-12]],bx,by,sc,fx),4);FS(s,sol,capS,1.6,90);s.push(M([[10,-10],[23,-8]],bx,by,sc,fx));s.push(circle(bx+fx*17*sc,by-11*sc,1.4));
  s.push(M([[24,-8],[29,-7],[24,-5]],bx,by,sc,fx));var wing=blob(M([[-2,-8],[10,-10],[12,2],[-10,6]],bx,by,sc,fx),4);SOL(s,sol,wing);s.push(M([[-4,-4],[9,-6]],bx,by,sc,fx));s.push(M([[-6,0],[9,-2]],bx,by,sc,fx));
  var tail=blob(M([[-6,6],[-18,16],[-14,20],[-2,10]],bx,by,sc,fx),4);FS(s,sol,tail,1.6,40);
  s.push(M([[0,-16],[-4,-20],[-6,-18]],bx,by,sc,fx));s.push(M([[2,12],[-2,16],[-5,15]],bx,by,sc,fx));
  SOL(s,sol,cage);var mesh=[];H(mesh,cage,6,45);H(mesh,cage,6,-45);clipIn(s,mesh,cage,[P,wing,tail]);
  s.push(rect(cx-fw-3,top+fh,cx+fw+3,top+fh+6));s.push([[cx,top+fh+6],[cx,top+fh+20]]);
  var br=tube(curve([[4,RR(R,150,160)],[80,RR(R,140,148)],[180,RR(R,152,160)],[296,RR(R,142,150)]],8),function(u){return 5;});FS(s,sol,br.P);clipIn(s,[rows(4,296,130,170,2.2)],br.P);
  for(var k=0;k<RI(R,5,7);k++){var p=br.L[RI(R,4,br.L.length-5)];leafL(s,sol,p,[p[0]+RR(R,-14,14),p[1]+RR(R,14,22)],4,k%2?1.2:0);}
  var hedge=[];for(var j=0;j<RI(R,3,4);j++){var hx=RR(R,10,290);if(Math.abs(hx-cx)<50)continue;treeR(hedge,R,hx,196,RR(R,22,30),2.4);}behind(s,hedge,sol);return sky(s,R,190,sol);});

S('Avocet in the shallows',['Upturned Bill','Sweeping the Mud','Pied Wader','Thin Legs, Still Water','Estuary Morning'],function(R){
  var s=[],sol=[],bg=[],wy=RR(R,150,156),x=RR(R,130,160),sc=RR(R,1.05,1.15),fx=sgn(R);
  var B=[[-36,-50],[-14,-60],[10,-62],[22,-56],[26,-46],[10,-38],[-20,-38],[-38,-44]];var P=bodyB(s,sol,B,x,wy,sc,fx,0);
  var stripe=blob(M([[-30,-48],[-10,-54],[12,-56],[6,-50],[-16,-46]],x,wy,sc,fx),4);FS(s,sol,stripe,1,0);var tip=blob(M([[-38,-46],[-48,-44],[-36,-40]],x,wy,sc,fx),3);FS(s,sol,tip,0.9,0);
  var neck=tube(curve(M([[18,-58],[26,-72],[24,-86],[30,-94]],x,wy,sc,fx),6),function(){return 2.8*sc;}).P;FS(s,sol,neck);
  var hd=blob(M([[24,-96],[32,-100],[38,-94],[30,-88]],x,wy,sc,fx),4);FS(s,sol,hd,0.9,0);var cap=blob(M([[24,-92],[26,-84],[22,-74],[20,-80]],x,wy,sc,fx),3);FS(s,sol,cap,0.9,0);
  s.push(curve(M([[36,-94],[48,-94],[58,-98],[64,-104]],x,wy,sc,fx),6));s.push(circle(x+fx*31*sc,wy-95*sc,1.1));
  [[[0,-38],[2,-18],[4,4]],[[8,-38],[14,-18],[18,4]]].forEach(function(L){var p=M(L,x,wy,sc,fx);s.push(p);});
  var ref=[];for(var r=0;r<5;r++){var yy=wy+6+r*4,w=wave(x-40,x+40,yy,1,8,r);ref.push(w);}clipIn(s,ref,RP(x-34,wy+4,x+34,wy+26));
  var W=[[4,wy],[296,wy],[296,196],[4,196]];waterIn(bg,R,W,wy+3,194,RR(R,4.4,5),[RP(x-34,wy+4,x+34,wy+26)]);bg.push([[4,wy],[296,wy]]);
  var mud=[[4,wy-2]].concat(quad([4,wy-2],[80,wy-20],[160,wy-4],10)).concat([[160,wy-2]]);bg.push(mud);
  var rd=[];var rx=pick(R,[RR(R,10,40),RR(R,250,280)]);for(var k=0;k<7;k++)rd.push([[rx+k*3,wy],[rx+k*3+RR(R,-5,5),wy-RR(R,26,46)]]);A(bg,rd);hills(bg,R,wy-2,RR(R,14,22),5);return fin(s,R,bg,sol,wy-4);});

S('Leafcutter ants',['Green Parade','Carrying the Harvest','Single File to the Nest','Little Sails','Forest Floor Highway'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,170,176),path=curve([[4,gy-RR(R,10,30)],[90,gy-RR(R,40,60)],[190,gy-RR(R,20,40)],[296,gy-RR(R,50,70)]],10);
  s.push(path.map(function(p){return [p[0],p[1]+6];}));s.push(path.map(function(p){return [p[0],p[1]+12];}));
  var n=RI(R,6,7);for(var i=0;i<n;i++){var t=0.08+i*0.84/(n-1),k=Math.floor(t*(path.length-1)),p=path[k],q=path[Math.min(path.length-1,k+2)],a=Math.atan2(q[1]-p[1],q[0]-p[0]),sc=RR(R,1.4,1.7);
    var x=p[0],y=p[1]+3;function Q(px,py){var c=Math.cos(a),sn=Math.sin(a);return [x+(px*c-py*sn)*sc,y+(px*sn+py*c)*sc];}
    var ab=poly(EP(0,0,1,1)).map(function(){return 0;});var abd=EP(0,0,5,3.4).map(function(pp){return Q(pp[0]-8,pp[1]-3);}),th=EP(0,0,3,2.2).map(function(pp){return Q(pp[0],pp[1]-3);}),hd=EP(0,0,3.2,3).map(function(pp){return Q(pp[0]+6,pp[1]-4);});
    [abd,th,hd].forEach(function(P){FS(s,sol,P,0.9,0);});
    for(var l=-1;l<=1;l++){s.push([Q(l*2,-3),Q(l*4-2,3),Q(l*5-1,5)]);s.push([Q(l*2,-3),Q(l*4-2,-9),Q(l*5-1,-6)]);}
    s.push([Q(8,-6),Q(10,-14)]);var leaf=[Q(10,-12)].concat(quad(Q(10,-12),Q(RR(R,-4,4),-34),Q(RR(R,-10,0),-22),8)).concat(quad(Q(RR(R,-10,0),-22),Q(4,-14),Q(10,-12),8).slice(1));
    FS(s,sol,leaf);s.push([Q(10,-12),lerp(Q(10,-12),leaf[8],0.9)]);}
  var mound=[[200,gy+4]].concat(quad([200,gy+4],[250,gy-50],[296,gy-20],14)).concat([[296,gy+4]]);
  var bgx=[];gnd(bgx,R,gy,RR(R,4,5),RR(R,-20,20));bgx.push(mound);H(bgx,mound,2.2,60);for(var k2=0;k2<RI(R,3,5);k2++){var lx=RR(R,10,280),ly=RR(R,gy+6,192);bgx.push(poly(lens([lx,ly],[lx+20,ly+RR(R,-4,4)],6)));}
  var stems=[];for(var j=0;j<RI(R,4,6);j++){var sx=RR(R,6,294),sh=RR(R,70,140);stems.push(curve([[sx,gy],[sx+RR(R,-8,8),gy-sh*0.5],[sx+RR(R,-14,14),gy-sh]],6));var tp=stems[stems.length-1];tp=tp[tp.length-1];stems.push(poly(lens(tp,[tp[0]+RR(R,-30,30),tp[1]-RR(R,10,20)],8)));}
  A(bgx,stems);behind(s,bgx,sol);return sky(s,R,gy-2,sol);});

S('Scorpion on a rock',['Tail Raised','Desert Night Hunter','Pincers Ready','Warm Sandstone','Eight Legs, One Sting'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,176,182),rx=RR(R,130,170),rw=RR(R,110,124),rt=gy-RR(R,40,46);
  var rock=blob([[rx-rw,gy],[rx-rw*0.8,rt+20],[rx-rw*0.3,rt],[rx+rw*0.4,rt+4],[rx+rw*0.85,rt+24],[rx+rw,gy]],6);FS(s,sol,rock);sideShade(s,rock,0.25,RR(R,2,2.4),RR(R,60,75));
  s.push(curve([[rx-rw*0.5,rt+20],[rx-rw*0.2,rt+30],[rx+rw*0.1,rt+26]],5));
  var cx=rx+RR(R,-14,14),cy=rt+RR(R,10,14),sc=RR(R,1.6,1.75),fx=sgn(R);function Q(a,b){return [cx+a*sc*fx,cy+b*sc];}
  var segs=[];for(var i=0;i<6;i++){var x0=-20+i*7;segs.push([Q(x0,-6),Q(x0+7,-7),Q(x0+7,5),Q(x0,5)]);}segs.forEach(function(P,i){FS(s,sol,P,i%2?1.1:0,90);});
  var ceph=blob([Q(20,-6),Q(30,-6),Q(34,0),Q(30,5),Q(20,5)],4);FS(s,sol,ceph,1,0);
  var tail=[Q(-20,0),Q(-30,-6),Q(-36,-18),Q(-34,-32),Q(-24,-42),Q(-12,-44),Q(-4,-38)];var tl=tube(curve(tail,6),function(u){return 3.6-1.6*u;});FS(s,sol,tl.P);
  var rings=[];for(var k=6;k<tl.L.length-2;k+=6)rings.push([tl.L[k],tl.R[k]]);A(s,rings);
  var sting=[Q(-4,-38),Q(4,-34),Q(2,-30),Q(-2,-36)];FS(s,sol,sting,0.8,0);
  [1,-1].forEach(function(sd){var arm=[Q(30,sd*3),Q(40,sd*12),Q(52,sd*10)];s.push(arm);var cl=blob([Q(50,sd*7),Q(62,sd*6),Q(70,sd*12),Q(60,sd*16),Q(50,sd*14)],4);FS(s,sol,cl,1,0);s.push([Q(62,sd*12),Q(72,sd*6)]);});
  for(var l=0;l<4;l++){[1,-1].forEach(function(sd){var x0=12-l*7;s.push([Q(x0,sd*4),Q(x0+2-l,sd*14),Q(x0-4-l*2,sd*20)]);});}
  gnd(bg,R,gy,RR(R,4,5),RR(R,-20,20));sand(bg,R,gy+4);var mx=pick(R,[RR(R,20,60),RR(R,240,280)]);bg.push([[mx-20,gy-2],[mx-14,gy-40],[mx+14,gy-44],[mx+20,gy-2]]);H(bg,[[mx-20,gy-2],[mx-14,gy-40],[mx+14,gy-44],[mx+20,gy-2]],2.2,80);
  return fin(s,R,bg,sol,gy-3);});

S('Nudibranch',['Frilled and Slow','Sea Slug in Silk','Gills Like a Crown','Painted Crawler','Reef Jewel'],function(R){
  var s=[],sol=[],bg=[],cx=RR(R,140,160),cy=RR(R,112,120),L=RR(R,90,100),fx=sgn(R);
  var top=[],bot=[];for(var i=0;i<=24;i++){var t=i/24,x=cx+fx*(-L+2*L*t),w=18*Math.sin(Math.PI*Math.pow(t,0.8))+3;top.push([x,cy-w+3*Math.sin(t*9)]);bot.push([x,cy+w*0.5]);}
  var body=top.concat(bot.slice().reverse());FS(s,sol,body);
  var fr=[];for(var j=0;j<top.length-1;j++){var p=top[j],q=top[j+1];fr.push(p,[(p[0]+q[0])/2,(p[1]+q[1])/2-3.5]);}fr.push(top[top.length-1]);s.push(fr);
  var fr2=[];for(var j2=0;j2<bot.length-1;j2++){var p2=bot[j2],q2=bot[j2+1];fr2.push(p2,[(p2[0]+q2[0])/2,(p2[1]+q2[1])/2+3.5]);}s.push(fr2);
  var spots=[];for(var k=0;k<RI(R,6,9);k++){var t2=RR(R,0.15,0.8),xx=cx+fx*(-L+2*L*t2),yy=cy-RR(R,0,10);spots.push(EP(xx,yy,RR(R,2,3.4),RR(R,1.6,2.4)));}spots.forEach(function(e){FS(s,sol,e,0.8,0);});
  var stripe=top.slice(3,22).map(function(p){return [p[0],p[1]+5];});s.push(stripe);
  var rh=top[22];[-1,1].forEach(function(sd){var tip=[rh[0]+fx*6+sd*4,rh[1]-18];s.push(rows(Math.min(rh[0],tip[0])-1,Math.max(rh[0],tip[0])+1,tip[1],rh[1],2.2).slice(0,0).concat([rh,tip]));var cone=[[tip[0]-2,tip[1]+10],[tip[0],tip[1]],[tip[0]+2,tip[1]+10]];FS(s,sol,cone,1,0);});
  var gx=cx+fx*(-L*0.55),gyy=interpY(fx>0?top:top.slice().reverse(),gx);var gill=[];for(var g=0;g<9;g++){var a=-PI/2+(g-4)*0.24,e=[gx+Math.cos(a)*18,gyy-4+Math.sin(a)*18];gill.push([gx,gyy-2],e,[e[0]+Math.cos(a+1.5)*3,e[1]+Math.sin(a+1.5)*3]);}s.push(gill);
  var rock=[[4,196]].concat(curve([[4,cy+16],[60,cy+8],[140,cy+12],[220,cy+6],[296,cy+14]],8)).concat([[296,196]]);FS(s,sol,rock);H(s,rock,RR(R,3,3.6),RR(R,15,30));
  for(var c=0;c<RI(R,3,5);c++){var bx2=RR(R,10,290);if(Math.abs(bx2-cx)<L+10)continue;var by2=cy+8;var co=[[bx2,by2]];for(var b2=0;b2<5;b2++){var a2=-PI/2+(b2-2)*0.4;co.push(quad([bx2,by2],[bx2+Math.cos(a2)*14,by2-20],[bx2+Math.cos(a2)*24,by2-34],8));}co.slice(1).forEach(function(st){s.push(st);});}
  var W=[];waterIn(W,R,RP(4,4,296,cy+8),8,cy+4,RR(R,7,8));behind(s,W,sol);return s;});

S('Barracuda',['Silver Torpedo','Underbite and Stripes','Patrolling the Reef Edge','Long and Lean','Hanging in the Blue'],function(R){
  var s=[],sol=[],bg=[],cx=RR(R,140,160),cy=RR(R,88,98),L=RR(R,120,130),fx=sgn(R);
  var B=[[-L,-2],[-L*0.7,-10],[-L*0.1,-14],[L*0.6,-12],[L*0.92,-5],[L,0],[L*0.92,4],[L*0.6,10],[-L*0.1,12],[-L*0.7,8],[-L,2]];var P=bodyB(s,sol,B,cx,cy,1,fx,1.6,0,0.55);
  var bars=[],d=1;for(var x=-L*0.6;x<L*0.4;x+=RR(R,12,16)){var a=M([[x,-12]],cx,cy,1,fx)[0],b=M([[x-6,2]],cx,cy,1,fx)[0];bars.push(d>0?a:b,d>0?b:a);d=-d;}clipIn(s,[bars],P);
  s.push(M([[-L*0.8,0],[L*0.75,-1]],cx,cy,1,fx));s.push(M([[L*0.82,1],[L,0]],cx,cy,1,fx));var e=M([[L*0.72,-4]],cx,cy,1,fx)[0];s.push(circle(e[0],e[1],3));s.push(circle(e[0],e[1],1.2));
  s.push(M([[L*0.6,-8],[L*0.6,6]],cx,cy,1,fx));var tf=blob(M([[-L,0],[-L-22,-18],[-L-16,0],[-L-22,18]],cx,cy,1,fx),3);FS(s,sol,tf,1.4,90);
  [[[-L*0.05,-13],[-L*0.15,-30],[-L*0.25,-13]],[[-L*0.5,-9],[-L*0.56,-22],[-L*0.62,-8]],[[-L*0.5,9],[-L*0.56,22],[-L*0.62,8]],[[L*0.35,6],[L*0.25,18],[L*0.2,9]]].forEach(function(F){var Fp=M(F,cx,cy,1,fx);FS(s,sol,Fp,1.2,70);});
  var fish=[];for(var k=0;k<RI(R,5,8);k++){var sx=RR(R,14,286),sy=RR(R,130,170);fish.push(poly(lens([sx,sy],[sx+10,sy],3)));fish.push([[sx,sy],[sx-4,sy-3],[sx-4,sy+3],[sx,sy]]);}
  seabed(bg,R,RR(R,168,174),RI(R,3,5));A(bg,fish);var W=[];waterIn(W,R,RP(4,4,296,160),8,150,RR(R,6,7.5));A(bg,W);behind(s,bg,sol);return s;});

S('Giant clam',['Lips of the Lagoon','Blue Mantle, Ridged Shell','A Century on the Reef','Open to the Sun','Wavy Smile'],function(R){
  var s=[],sol=[],bg=[],cx=RR(R,140,160),by=RR(R,160,166),w=RR(R,84,94),h=RR(R,58,66);
  var shell=[[cx-w,by]].concat(cubic([cx-w,by],[cx-w,by-h*0.8],[cx-w*0.4,by-h],[cx,by-h*0.7],16)).concat(cubic([cx,by-h*0.7],[cx+w*0.4,by-h],[cx+w,by-h*0.8],[cx+w,by],16).slice(1));FS(s,sol,shell);
  var n=5,rib=[],d=1;for(var i=0;i<=n;i++){var t=i/n,xa=cx-w+2*w*t;}
  var mouth=[];for(var x=cx-w+8;x<=cx+w-8;x+=2){var t2=(x-cx+w)/(2*w),amp=10*Math.sin(t2*PI);mouth.push([x,by-h*0.45-amp*0.4+6*Math.sin(t2*PI*n*2)]);}
  var mant=mouth.concat(mouth.slice().reverse().map(function(p){return [p[0],p[1]+RR(R,7,9)];}));FS(s,sol,mant);
  var dots=[];for(var k=0;k<14;k++){var p=mouth[RI(R,2,mouth.length-3)];dots.push(EP(p[0],p[1]+4,1.6,1.2));}dots.forEach(function(e){s.push(poly(e));});
  var rs=[];for(var r=1;r<n*2;r++){var t3=r/(n*2),xx=cx-w+2*w*t3,yTop=interpY(shell.slice(1),xx),yM=interpY(mouth,xx);if(yM-yTop>4)rs.push([[xx,yTop+2],[cx+(xx-cx)*0.4,by-4]]);}clipIn(s,rs,shell,[mant]);
  var sc=[];for(var y=by-h*0.4;y<by;y+=6)sc.push(wave(cx-w,cx+w,y,1.6,(2*w)/(n*2),0));clipIn(s,[serp(sc)],shell,[mant]);
  seabed(bg,R,by+2,RI(R,3,5));for(var c=0;c<RI(R,3,4);c++){var bx=RR(R,10,290);if(Math.abs(bx-cx)<w+12)continue;var co=blob([[bx-18,by],[bx-14,by-20],[bx,by-28],[bx+14,by-18],[bx+18,by]],5);bg.push(poly(co));H(bg,co,2,45);H(bg,co,2,-45);}
  var fish=[];for(var f=0;f<RI(R,3,5);f++){var fx2=RR(R,20,280),fy=RR(R,30,90);fish.push(poly(lens([fx2,fy],[fx2+12,fy],4)));fish.push([[fx2,fy],[fx2-5,fy-4],[fx2-5,fy+4],[fx2,fy]]);}A(bg,fish);
  var W=[];waterIn(W,R,RP(4,4,296,by),8,by-4,RR(R,6,7.5));A(bg,W);behind(s,bg,sol);return s;});

// ---- batch 15 chunk C: instruments, tools, kitchen, food, toys, furniture, machines ----
function keysOn(s,sp,ts,r){ts.forEach(function(t){var i=Math.round(t*(sp.length-1)),p=sp[i];s.push(circle(p[0],p[1],r));});return s;}

S('Bassoon',['Low Reed in the Corner','Bundle of Maple','Crook and Bell','Orchestra Pit, Empty','The Woodwind Grandfather'],function(R){
  var s=[],sol=[],fy=RR(R,176,182),cx=RR(R,130,170),tilt=RR(R,0.12,0.2),bot=fy-6,top=RR(R,14,20);
  function T(a,b){return rotateAbout([[cx+a,b]],cx,bot,tilt)[0];}
  var boot=[T(-12,bot),T(-12,bot-40),T(12,bot-40),T(12,bot)];boot=blob(boot.concat([T(0,bot+4)]),4);FS(s,sol,boot,1.6,90);
  var wing=[T(-12,bot-40),T(-12,top+70),T(-2,top+66),T(-2,bot-40)];FS(s,sol,wing);clipIn(s,[zz(T(-14,0)[0]-40,T(0,0)[0]+40,top+60,bot-36,3.2)],wing);
  var long=[T(2,bot-40),T(2,top),T(12,top),T(12,bot-40)];FS(s,sol,long);var bell=[T(0,top),T(1,top-8),T(13,top-8),T(14,top)];FS(s,sol,bell,1.2,0);
  [[0.25,-7],[0.4,-7],[0.55,-7],[0.3,7],[0.45,7]].forEach(function(k){var p=T(k[1],bot-40-(bot-40-top)*k[0]);s.push(circle(p[0],p[1],2.2));});
  var rods=[];for(var j=0;j<4;j++){var a=T(-14,bot-30-j*20),b=T(-20,bot-40-j*20);rods.push([a,b,[b[0]+3,b[1]]]);}A(s,rods);
  var cr=T(-12,top+76),crook=curve([cr,T(-26,top+70),T(-40,top+78),T(-48,top+90)],6);s.push(crook);s.push([crook[crook.length-1],[crook[crook.length-1][0]-6,crook[crook.length-1][1]+4]]);
  var band=[T(-13,bot-42),T(13,bot-42),T(13,bot-38),T(-13,bot-38)];FS(s,sol,band,0.9,0);
  var stand=[[cx-20,fy],[cx,bot+2],[cx+20,fy]];s.push(stand);
  var ch=[[cx+60,fy],[cx+62,fy-50],[cx+100,fy-50],[cx+102,fy]];var seat=RP(cx+56,fy-54,cx+106,fy-48);FS(s,sol,seat,1.4,0);s.push([[cx+60,fy-48],[cx+60,fy]]);s.push([[cx+102,fy-48],[cx+102,fy]]);s.push([[cx+60,fy-54],[cx+62,fy-110],[cx+100,fy-110],[cx+102,fy-54]]);H(s,RP(cx+64,fy-104,cx+98,fy-90),2,0);
  var ms=[[cx-70,fy],[cx-60,fy-4],[cx-50,fy]];s.push(ms);s.push([[cx-60,fy-4],[cx-60,fy-80]]);var desk=[[cx-84,fy-110],[cx-36,fy-110],[cx-40,fy-80],[cx-80,fy-80]];FS(s,sol,desk);H(s,desk,4,0);
  room2(s,R,fy,sol);return s;});

S('Electric guitar',['Plugged In','Three Pickups, One Song','Leaning on the Amp','Practice Room Hum','Sunburst at Rest'],function(R){
  var s=[],sol=[],fy=RR(R,178,184),bx=RR(R,110,150),by=fy-RR(R,46,52),tilt=RR(R,-0.5,-0.36);
  function T(a,b){return rotateAbout([[bx+a,by+b]],bx,by,tilt)[0];}
  var body=blob([T(-40,0),T(-34,-26),T(-14,-28),T(-4,-18),T(10,-30),T(26,-24),T(22,-6),T(36,8),T(30,28),T(-6,34),T(-36,22)],6);FS(s,sol,body);
  var guard=blob([T(-20,-14),T(-6,-12),T(6,-20),T(12,-6),T(10,18),T(-14,22),T(-26,8)],5);s.push(poly(guard));
  var shade=[];H(shade,body,1.6,tilt*57+80);clipIn(s,shade,body.filter(function(p){return true;}),[blob([T(-30,-10),T(16,-16),T(22,14),T(-26,16)],5)]);
  [-2,10,22].forEach(function(o){var P=[T(o-3,-12),T(o+3,-12),T(o+3,8),T(o-3,8)];FS(s,sol,P,1.2,0);});
  var neck=[T(36,-4),T(150,-4),T(150,4),T(36,4)];FS(s,sol,neck);var fr=[],d=1;for(var x=46;x<148;x+=7-((x-46)/30)){var a=T(x,-4),b=T(x,4);fr.push(d>0?a:b,d>0?b:a);d=-d;}s.push(fr);
  var head=blob([T(150,-6),T(176,-10),T(184,-4),T(180,4),T(150,6)],4);FS(s,sol,head);for(var k=0;k<6;k++){var p=T(156+k*4.4,-9);s.push([p,T(156+k*4.4,-15)]);}
  var str=[];for(var j=-1;j<=1;j++)str.push([T(-14,j*2),T(152,j*2)]);A(s,str);var br=[T(-16,-6),T(-12,-6),T(-12,6),T(-16,6)];FS(s,sol,br,1,0);
  var kn=[T(-24,18),T(-14,24)];kn.forEach(function(p){s.push(circle(p[0],p[1],3));});
  var jack=T(-30,20),cab=curve([jack,[jack[0]-20,fy-4],[jack[0]-60,fy-2],[jack[0]-80,fy-8]],8);s.push(cab);
  var ax=pick(R,[RR(R,30,60),RR(R,230,260)]),amp=RP(ax-28,fy-60,ax+28,fy);FS(s,sol,amp);var grill=RP(ax-22,fy-48,ax+22,fy-6);s.push(poly(grill));H(s,grill,2.4,45);H(s,grill,2.4,-45);s.push(rect(ax-22,fy-56,ax+22,fy-50));
  for(var n=0;n<4;n++)s.push(circle(ax-15+n*10,fy-53,1.6));
  room2(s,R,fy,sol);return s;});

S('Maracas',['Shake, Shake','Beans in a Gourd','Fiesta Pair','Rhythm Section','Painted Rattles'],function(R){
  var s=[],sol=[],ty=RR(R,164,170);
  [[RR(R,90,120),RR(R,-0.5,-0.2)],[RR(R,170,200),RR(R,0.2,0.6)]].forEach(function(M2,i){var cx=M2[0],a=M2[1],r=RR(R,30,34),hb=ty-8;
    var hc=[cx,hb],top=[cx+Math.sin(a)*90,hb-Math.cos(a)*90],cg=lerp(hc,top,0.7);
    var handle=tube([hc,lerp(hc,top,0.42)],function(u){return 5-1.5*u;}).P;FS(s,sol,handle);H(s,handle,1.6,90);
    var head=EP(cg[0],cg[1],r,r*1.15);var hr=rotateAbout(head,cg[0],cg[1],a);FS(s,sol,hr);
    var bands=[];for(var k=-2;k<=2;k++){var yy=k*r*0.38,w=Math.sqrt(Math.max(0,1-Math.pow(yy/(r*1.15),2)))*r;bands.push(rotateAbout(wave(cg[0]-w,cg[0]+w,cg[1]+yy,2,10,k),cg[0],cg[1],a));}A(s,bands);
    var zz2=[];for(var x=-r;x<=r;x+=6){zz2.push([cg[0]+x,cg[1]-r*0.2+(x/6%2?-4:4)]);}clipIn(s,[rotateAbout(zz2,cg[0],cg[1],a)],hr);
    var dk=[];H(dk,rotateAbout(arc(cg[0],cg[1],r,r*1.15,-PI/2,PI/2).concat(arc(cg[0],cg[1],r*0.4,r*1.15,PI/2,-PI/2)),cg[0],cg[1],a),1.6,70);A(s,dk);
    s.push(EP(hc[0],hc[1]+2,7,3));});
  var shaker=[];for(var b=0;b<RI(R,5,8);b++){var bx=RR(R,60,240),byy=ty+RR(R,2,8);shaker.push(EP(bx,byy-2,2.4,1.6));}shaker.forEach(function(e){s.push(poly(e));});
  onT(s,R,ty,sol);return s;});

S('Hacksaw and pipe',['Cut to Length','Teeth on Copper','Plumber at Work','Half Way Through','Bench Work'],function(R){
  var s=[],sol=[],ty=RR(R,150,156),cx=RR(R,140,160);
  var vise=[[cx-30,ty],[cx-30,ty-30],[cx-24,ty-34],[cx+24,ty-34],[cx+30,ty-30],[cx+30,ty]];FS(s,sol,vise);H(s,vise,2.4,90);
  var jaws=[RP(cx-26,ty-58,cx-6,ty-34),RP(cx+6,ty-58,cx+26,ty-34)];jaws.forEach(function(J){FS(s,sol,J,1.6,0);});s.push([[cx+30,ty-46],[cx+66,ty-46]]);s.push(rect(cx+64,ty-52,cx+70,ty-40));
  var py=ty-66,pipe=[[4,py-8],[cx+50,py-8],[cx+50,py+8],[4,py+8]];FS(s,sol,pipe);s.push(ellipse(cx+50,py,3,8));s.push(ellipse(cx+50,py,1.6,5));H(s,RP(4,py+2,cx+50,py+8),1.4,0);
  var cut=cx+RR(R,24,36);s.push([[cut,py-8],[cut,py-2]]);
  var a=RR(R,-0.12,0.05),fr=[[cut-60,py-4],[cut+40,py-4],[cut+40,py-34],[cut-60,py-34]];var F=rotateAbout(fr,cut,py-4,a);
  var bar=tube([F[3],F[2]],function(){return 2.6;}).P;FS(s,sol,bar);[[F[0],F[3]],[F[1],F[2]]].forEach(function(L){var t=tube(L,function(){return 2.4;}).P;FS(s,sol,t);});
  var blade=rotateAbout([[cut-58,py-6],[cut+38,py-6],[cut+38,py-2],[cut-58,py-2]],cut,py-4,a);SOL(s,sol,blade);var teeth=[];for(var x=cut-58;x<cut+38;x+=3)teeth.push(rotateAbout([[x,py-2],[x+1.5,py+0.5]],cut,py-4,a)[0],rotateAbout([[x+1.5,py+0.5]],cut,py-4,a)[0]);s.push(teeth);
  var gr=rotateAbout([[cut+40,py-34],[cut+52,py-34],[cut+62,py-20],[cut+60,py-4],[cut+46,py-4],[cut+40,py-14]],cut,py-4,a);FS(s,sol,gr);H(s,gr,1.6,60);
  var sh=[];for(var k=0;k<RI(R,6,10);k++){var x2=cut+RR(R,-8,8),y2=ty+RR(R,2,6);sh.push([[x2,y2],[x2+1.6,y2+0.6]]);}A(s,sh);
  var bench=[];tableS(bench,R,ty,'stripes');var wall=[];var tools=[];for(var t=0;t<4;t++){var tx=20+t*66;tools.push([[tx,10],[tx,14]]);tools.push(rect(tx-8,14,tx+8,40+t*6));}
  A(bench,[]);behind(s,bench.concat(tools),sol);return s;});

S('Car jack',['Flat on the Shoulder','Crank It Up','Scissor Lift','Roadside Repair','Half an Inch More'],function(R){
  var s=[],sol=[],gy=RR(R,170,176),cx=RR(R,120,150),h=RR(R,40,50),w=RR(R,36,42);
  var base=[[cx-w-10,gy],[cx-w,gy-8],[cx+w,gy-8],[cx+w+10,gy]];FS(s,sol,base,1.6,0);var pad=RP(cx-12,gy-14-h*2,cx+12,gy-8-h*2);FS(s,sol,pad,1.2,0);
  var L=[cx-w,gy-8-h],Rt=[cx+w,gy-8-h],B=[cx,gy-8],T=[cx,gy-8-h*2];
  [[B,L],[L,T],[T,Rt],[Rt,B]].forEach(function(seg){var t=tube(seg,function(){return 3.2;}).P;FS(s,sol,t);s.push(lerp(seg[0],seg[1],0).concat?[]:[]);});
  var scr=[[L[0]-6,L[1]],[Rt[0]+30,Rt[1]]];var thr=tube(scr,function(){return 2.4;}).P;SOL(s,sol,thr);s.push(poly(thr));var th=[];for(var x=L[0]-4;x<Rt[0]+28;x+=3)th.push([x,L[1]-2.4],[x+1.5,L[1]+2.4]);s.push(th);
  [L,Rt,B,T].forEach(function(p){s.push(circle(p[0],p[1],3.4));});var eye=[Rt[0]+30,Rt[1]];s.push(circle(eye[0],eye[1],4));
  var hand=[eye,[eye[0]+40,eye[1]+6],[eye[0]+44,eye[1]+24],[eye[0]+60,eye[1]+26]];s.push(hand);
  var car=[[cx-100,gy-12-h*2],[cx-90,gy-60-h*2],[cx+40,gy-64-h*2],[cx+90,gy-30-h*2],[cx+130,gy-24-h*2],[cx+134,gy-12-h*2]];var body=car.concat([[cx+134,gy-8-h*2],[cx-100,gy-8-h*2]]);SOL(s,sol,body);s.push(poly(body));
  clipIn(s,[rows(cx-100,cx+134,gy-24-h*2,gy-10-h*2,3)],body);var wa=[cx-60,gy-8-h*2+4];s.push(arc(wa[0],wa[1],24,24,PI,TAU));
  var tyr=[cx-60,gy-26];tyre(s,sol,tyr[0],tyr[1],18,1.4);var wd=RR(R,0.2,0.6);for(var k=0;k<5;k++){var a=wd+k*TAU/5;s.push(circle(tyr[0]+Math.cos(a)*7,tyr[1]+Math.sin(a)*7,1.4));}
  var spare=[cx+120,gy-20];tyre(s,sol,spare[0],spare[1],16,1.4);s.push(circle(spare[0],spare[1],5));
  var bg=[];road(bg,R,gy);hills(bg,R,gy-2,RR(R,22,30),5);bg.push(poly([[RR(R,250,280),gy],[RR(R,250,280)+8,gy-30],[RR(R,250,280)+16,gy]]));return fin(s,R,bg,sol,gy-3);});

S('Blowtorch',['Blue Flame','Brazing the Joint','Brass and Fire','Workshop Hiss','Point of Heat'],function(R){
  var s=[],sol=[],ty=RR(R,160,166),cx=RR(R,100,130),cw=RR(R,22,26),ch=RR(R,70,80);
  var can=[[cx-cw,ty],[cx-cw,ty-ch]].concat(arc(cx,ty-ch,cw,cw*0.5,PI,TAU)).concat([[cx+cw,ty]]);FS(s,sol,can);
  var lbl=RP(cx-cw,ty-ch*0.7,cx+cw,ty-ch*0.3);s.push(poly(lbl));H(s,RP(cx+cw*0.3,ty-ch,cx+cw,ty),1.6,90);var nk=RP(cx-6,ty-ch-cw*0.5-10,cx+6,ty-ch-cw*0.5+2);FS(s,sol,nk,1.2,0);
  var vt=ty-ch-cw*0.5-10;var valve=[[cx-12,vt],[cx+12,vt],[cx+12,vt-10],[cx-12,vt-10]];FS(s,sol,valve);s.push(circle(cx-16,vt-5,5));s.push([[cx-21,vt-5],[cx-11,vt-5]]);
  var tube1=tube([[cx+12,vt-5],[cx+80,vt-20]],function(){return 3;}).P;FS(s,sol,tube1);clipIn(s,[zz(cx+10,cx+82,vt-30,vt+4,3)],tube1);
  var tip=[cx+80,vt-20],nz=tube([tip,[tip[0]+12,tip[1]-2.6]],function(){return 4.4;}).P;FS(s,sol,nz,1,0);
  var f0=[tip[0]+12,tip[1]-2.6],fl=[f0].concat(quad(f0,[f0[0]+40,f0[1]-20],[f0[0]+70,f0[1]-12],12)).concat(quad([f0[0]+70,f0[1]-12],[f0[0]+40,f0[1]+6],f0,12).slice(1));s.push(fl);
  var inner=[f0].concat(quad(f0,[f0[0]+20,f0[1]-8],[f0[0]+32,f0[1]-6],8)).concat(quad([f0[0]+32,f0[1]-6],[f0[0]+20,f0[1]+3],f0,8).slice(1));s.push(inner);
  var pipe1=[[f0[0]+44,ty-6],[f0[0]+52,ty-6],[f0[0]+52,f0[1]-14],[f0[0]+44,f0[1]-14]];FS(s,sol,pipe1);var fit=RP(f0[0]+40,f0[1]-2,f0[0]+56,f0[1]+10);FS(s,sol,fit,1.3,0);
  var pipe2=[[f0[0]+56,f0[1]+2],[296,f0[1]+2],[296,f0[1]+8],[f0[0]+56,f0[1]+8]];FS(s,sol,pipe2);H(s,RP(f0[0]+56,f0[1]+5,296,f0[1]+8),1.2,0);
  var sold=[];for(var k=0;k<3;k++)sold.push(spiral(f0[0]+70,ty-10-k*1,1,6,2,k));var roll=EP(f0[0]-30,ty-8,10,8);FS(s,sol,roll);s.push(spiral(f0[0]-30,ty-8,1,7,3,0));
  onT(s,R,ty,sol);return s;});

S('Tacos on a plate',['Three in a Row','Lime on the Side','Taqueria Lunch','Folded and Filled','Tuesday Special'],function(R){
  var s=[],sol=[],ty=RR(R,150,156),cx=RR(R,140,160),pw=RR(R,110,118),pr=RR(R,26,30);
  var plate=EP(cx,ty+4,pw,pr);SOL(s,sol,plate);s.push(poly(plate));s.push(ellipse(cx,ty+4,pw*0.82,pr*0.72));
  var n=3;for(var i=0;i<n;i++){var tx=cx-62+i*62+RR(R,-4,4),tb=ty+6,tw=RR(R,30,34),th=RR(R,42,48);
    var shell=[[tx-tw,tb]].concat(arc(tx,tb,tw,th,PI,TAU)).concat([[tx+tw,tb]]);var top=arc(tx,tb,tw,th,PI,TAU);
    var fill=[[tx-tw*0.86,tb-th*0.4]];for(var x=-tw*0.86;x<=tw*0.86;x+=4)fill.push([tx+x,tb-th*Math.sqrt(1-Math.pow(x/tw,2))*0.98-RR(R,2,8)]);
    var filling=fill.concat([[tx+tw*0.86,tb-th*0.4]]);SOL(s,sol,shell);var lettuce=[];for(var k=0;k<fill.length-1;k++){var p=fill[k];lettuce.push(p,[p[0]+2,p[1]-RR(R,3,6)]);}lettuce.push(fill[fill.length-1]);s.push(lettuce);
    var front=[[tx-tw,tb]].concat(arc(tx,tb,tw,th*0.86,PI,TAU)).concat([[tx+tw,tb]]);s.push(front);var dots=[];for(var d=0;d<5;d++){var a=PI+0.4+d*0.5;dots.push(circle(tx+Math.cos(a)*tw*0.6,tb+Math.sin(a)*th*0.5,1.2));}A(s,dots);
    var sh=[];H(sh,front.slice(0,-1),1.8,i%2?60:-60);clipIn(s,sh,front.slice(0,-1),[EP(tx,tb-th*0.4,tw*0.4,th*0.25)]);
    var cubes=[];for(var c=0;c<4;c++){var cx2=tx+RR(R,-tw*0.6,tw*0.6),cy2=interpY(fill,cx2)-2;cubes.push(rect(cx2-2,cy2-3,cx2+2,cy2));}A(s,cubes);}
  var lx=cx+pw-20,ly=ty-4;var lime=[[lx-14,ly]].concat(arc(lx,ly,14,12,PI,TAU));lime.push([lx-14,ly]);FS(s,sol,lime);for(var k2=0;k2<5;k2++){var a2=PI+(k2+0.5)*PI/5;s.push([[lx,ly],[lx+Math.cos(a2)*11,ly+Math.sin(a2)*10]]);}
  var bowl=[[cx-pw-6,ty-20],[cx-pw+40,ty-20],[cx-pw+34,ty-2],[cx-pw,ty-2]];FS(s,sol,bowl);s.push(wave(cx-pw-4,cx-pw+38,ty-22,1.5,6,0));
  onT(s,R,ty-12,sol);return s;});

S('Salad spinner',['Wash and Whirl','Lettuce Carousel','Pull the Cord','Dry Leaves for Dinner','Kitchen Centrifuge'],function(R){
  var s=[],sol=[],ty=RR(R,166,172),cx=RR(R,130,160),bw=RR(R,62,68),bh=RR(R,62,68);
  var bowl=[[cx-bw,ty-bh]].concat(cubic([cx-bw,ty-bh],[cx-bw,ty-10],[cx-bw*0.6,ty],[cx,ty],12)).concat(cubic([cx,ty],[cx+bw*0.6,ty],[cx+bw,ty-10],[cx+bw,ty-bh],12).slice(1));FS(s,sol,bowl);
  var bask=[];for(var x=cx-bw+8;x<cx+bw-8;x+=6){bask.push([[x,ty-bh+6],[x+(x-cx)*-0.1,ty-10]]);}clipIn(s,bask,bowl);var rimL=[];for(var y=ty-bh+16;y<ty-8;y+=12)rimL.push([[cx-bw,y],[cx+bw,y]]);clipIn(s,rimL,bowl);
  var lid=EP(cx,ty-bh,bw+4,10);FS(s,sol,lid);s.push(ellipse(cx,ty-bh,bw*0.7,7));
  var knob=[[cx-8,ty-bh-2],[cx-6,ty-bh-26],[cx+6,ty-bh-26],[cx+8,ty-bh-2]];FS(s,sol,knob,1.4,90);var cap=EP(cx,ty-bh-26,9,4);FS(s,sol,cap,1,0);
  var crank=[[cx+6,ty-bh-24],[cx+34,ty-bh-30],[cx+36,ty-bh-44]];s.push(crank);s.push(circle(cx+36,ty-bh-46,3));
  var lv=[];for(var k=0;k<5;k++){var lx=cx+RR(R,-bw*0.6,bw*0.6);lv.push(scallop(lx,ty-bh-6,8,4,8,0.25));}clipIn(s,lv,RP(cx-bw,ty-bh-20,cx+bw,ty-bh-8));
  var lx2=cx+bw+40;var head=scallop(lx2,ty-26,30,24,14,0.12);head.pop();FS(s,sol,head);for(var v=0;v<5;v++){var a=PI+0.4+v*0.5;s.push(quad([lx2,ty-4],[lx2+Math.cos(a)*14,ty-14+Math.sin(a)*6],[lx2+Math.cos(a)*26,ty-24+Math.sin(a)*18],6));}
  var leaf=lens([cx-bw-60,ty-4],[cx-bw-10,ty-12],8);FS(s,sol,leaf);s.push([[cx-bw-60,ty-4],[cx-bw-10,ty-12]]);
  onT(s,R,ty,sol);return s;});

S('Pasta machine',['Sheets of Dough','Crank and Rollers','Sunday Fettuccine','Clamped to the Table','Flour Everywhere'],function(R){
  var s=[],sol=[],ty=RR(R,150,156),cx=RR(R,120,150),w=RR(R,40,46),h=RR(R,54,60);
  var box=RP(cx-w,ty-h,cx+w,ty);FS(s,sol,box);H(s,RP(cx+w*0.4,ty-h,cx+w,ty),1.8,90);s.push(rect(cx-w+6,ty-h+8,cx+w-6,ty-h+20));
  [ty-h+12,ty-h+16].forEach(function(y){s.push([[cx-w+8,y],[cx+w-8,y]]);});var dial=[cx-w-6,ty-h+14];s.push(circle(dial[0],dial[1],7));s.push([[dial[0],dial[1]],[dial[0]-5,dial[1]-4]]);
  var clamp=[[cx-10,ty],[cx-10,ty+20],[cx+10,ty+20],[cx+10,ty+14],[cx-4,ty+14],[cx-4,ty]];FS(s,sol,clamp,1.2,90);s.push([[cx,ty+20],[cx,ty+32]]);s.push([[cx-8,ty+32],[cx+8,ty+32]]);
  var ax=[cx+w,ty-h+14];var crank=[[ax[0],ax[1]],[ax[0]+30,ax[1]-34]];var arm=tube(crank,function(){return 3;}).P;FS(s,sol,arm);var hd=RP(ax[0]+26,ax[1]-50,ax[0]+34,ax[1]-34);FS(s,sol,hd,1.4,90);s.push(circle(ax[0],ax[1],5));
  var sheet=[[cx-w+10,ty-h+20],[cx+w-10,ty-h+20]].concat(cubic([cx+w-10,ty-h+20],[cx+w,ty+10],[cx+w+40,ty-20],[cx+w+80,ty-2],14)).concat([[cx+w+80,ty+2],[cx-w+40,ty+2]]);
  var sh2=[[cx-w+14,ty-h+20]].concat(cubic([cx-w+14,ty-h+20],[cx-w-30,ty-30],[cx-w-50,ty-10],[cx-w-90,ty-2],14)).concat([[cx-w-90,ty+2],[cx-w-60,ty+2],[cx-w-30,ty-20],[cx-w+12,ty-h+24]]);
  SOL(s,sol,sh2);s.push(poly(sh2));var cuts=[];for(var k=0;k<5;k++){var x=cx-w-80+k*12;cuts.push([[x,ty-1],[x+6,ty-14+k*2]]);}A(s,cuts);
  var nest=[];for(var r=0;r<3;r++){var nx=cx+w+RR(R,90,110)+r*4;nest.push(spiral(nx,ty-8,2,14-r*2,3,r));}nest.forEach(function(sp){s.push(sp.map(function(p){return [p[0],ty-8+(p[1]-ty+8)*0.5];}));});
  var flour=[];for(var f=0;f<RI(R,8,12);f++){var fx=RR(R,30,270),fyy=ty+RR(R,2,8);flour.push([[fx,fyy],[fx+1.5,fyy]]);}A(s,flour);
  var eggs=[];[[30,ty-10],[46,ty-8]].forEach(function(e){var E=EP(e[0],e[1],7,9);FS(s,sol,E);shadeE(s,e[0],e[1],7,9,1.2,70,1,0.4);});
  onT(s,R,ty,sol);return s;});

S('Cinnamon rolls in a pan',['Warm from the Oven','Swirls and Icing','Saturday Bake','Nine in a Tin','Sticky Fingers'],function(R){
  var s=[],sol=[],ty=RR(R,150,156),cx=RR(R,140,160),pw=RR(R,108,116),ph=RR(R,40,46);
  var pan=[[cx-pw,ty-ph],[cx+pw,ty-ph],[cx+pw-8,ty+14],[cx-pw+8,ty+14]];FS(s,sol,pan);var rim=[[cx-pw,ty-ph],[cx+pw,ty-ph],[cx+pw-4,ty-ph+6],[cx-pw+4,ty-ph+6]];s.push(poly(rim));H(s,RP(cx-pw+8,ty-ph+8,cx+pw-8,ty+14).map(function(p){return p;}),9999,0);
  var side=[[cx-pw+4,ty-ph+6],[cx+pw-4,ty-ph+6],[cx+pw-8,ty+14],[cx-pw+8,ty+14]];clipIn(s,[zz(cx-pw,cx+pw,ty-ph+6,ty+14,3.2)],side);
  var rows2=[[ty-ph-6,0.78],[ty-ph-18,0.86],[ty-ph-28,0.92]],cols=3;
  for(var r=0;r<3;r++){var yy=ty-ph-4-r*10,sc=1-r*0.1;for(var c=0;c<cols;c++){var x=cx+(c-1)*pw*0.62*sc,rx=pw*0.3*sc,ry=rx*0.5;var top=EP(x,yy-8,rx,ry);
    var dome=[[x-rx,yy-8]].concat(arc(x,yy-8,rx,ry*1.6,PI,TAU)).concat([[x+rx,yy-8]]).concat(arc(x,yy-8,rx,ry,0,PI).slice(1));
    SOL(s,sol,dome);s.push(poly(dome));s.push(spiral(x,yy-10,1,rx*0.85,3,R()*6).map(function(p){return [p[0],yy-10+(p[1]-yy+10)*0.5];}));
    s.push(wave(x-rx*0.8,x+rx*0.8,yy-12-ry*0.4,1.6,8,c));}}
  var mitt=blob([[cx+pw+6,ty+10],[cx+pw+10,ty-30],[cx+pw+30,ty-40],[cx+pw+44,ty-28],[cx+pw+40,ty+10]],5);FS(s,sol,mitt);clipIn(s,[zz(cx+pw,cx+pw+46,ty-42,ty+10,4)],mitt);s.push(blob([[cx+pw+8,ty-14],[cx+pw-2,ty-30],[cx+pw+6,ty-34],[cx+pw+14,ty-22]],4));
  onT(s,R,ty+14,sol);return s;});

S('Bunch of radishes',['Pulled This Morning','Red Globes, Green Tops','Tied with String','Market Bunch','Peppery Crunch'],function(R){
  var s=[],sol=[],ty=RR(R,160,166),cx=RR(R,130,160),n=RI(R,6,7);
  var tie=[cx-4,ty-70];
  for(var i=0;i<n;i++){var a=-0.7+i*1.4/(n-1)+RR(R,-0.08,0.08),L=RR(R,52,64),c=[tie[0]+Math.sin(a)*L*1.6,tie[1]+Math.cos(a)*L*0.6+30+Math.abs(a)*10],r=RR(R,13,16);
    s.push(quad(tie,[tie[0]+Math.sin(a)*20,tie[1]+16],[c[0],c[1]-r],8));var bulb=EP(c[0],c[1],r,r*0.92);FS(s,sol,bulb);shadeE(s,c[0],c[1],r,r*0.92,1.4,70,a>0?1:-1,0.2);
    s.push(quad([c[0],c[1]+r*0.9],[c[0]+a*8,c[1]+r*1.6],[c[0]+a*20,c[1]+r*2.2],6));}
  for(var j=0;j<n;j++){var b=-PI/2+(j-(n-1)/2)*0.32,L2=RR(R,60,80),tip=[tie[0]+Math.cos(b)*L2,tie[1]+Math.sin(b)*L2];var lf=lens(tie,tip,RR(R,9,12));FS(s,sol,lf);s.push([tie,tip]);
    var vn=[];for(var t=0.3;t<0.9;t+=0.2){var m=lerp(tie,tip,t);vn.push([m,[m[0]+Math.cos(b+0.8)*6,m[1]+Math.sin(b+0.8)*6]]);}A(s,vn);}
  var str=[[tie[0]-8,tie[1]-4],[tie[0]+8,tie[1]-4],[tie[0]+8,tie[1]+4],[tie[0]-8,tie[1]+4]];FS(s,sol,str,1.2,0);s.push(curve([[tie[0]+8,tie[1]],[tie[0]+20,tie[1]+12],[tie[0]+14,tie[1]+24]],5));
  var board=[[cx-120,ty-6],[cx+130,ty-6],[cx+136,ty+2],[cx-126,ty+2]];var bb=[];bb.push(poly(board));
  var knife=[[cx+60,ty-12],[cx+130,ty-14],[cx+134,ty-10],[cx+60,ty-8]];FS(s,sol,knife);var hdl=RP(cx+30,ty-14,cx+60,ty-6);FS(s,sol,hdl,1.4,0);
  var sl=[];for(var k=0;k<3;k++){var sx=cx+80+k*14;sl.push(EP(sx,ty-18,6,2.4));}sl.forEach(function(e){FS(s,sol,e);});
  onT(s,R,ty,sol);return s;});

S('Corkscrew and cork',['First Pull','Waiter\'s Friend','Vintage Uncorked','Before the Pour','Twist, Lever, Pop'],function(R){
  var s=[],sol=[],ty=RR(R,166,172),bx=RR(R,100,130),bw=RR(R,26,30),neckT=ty-RR(R,140,150);
  var bottle=[[bx-bw,ty],[bx-bw,ty-80]].concat(cubic([bx-bw,ty-80],[bx-bw,ty-104],[bx-8,ty-104],[bx-8,ty-120],8)).concat([[bx-8,neckT],[bx+8,neckT],[bx+8,ty-120]]).concat(cubic([bx+8,ty-120],[bx+8,ty-104],[bx+bw,ty-104],[bx+bw,ty-80],8)).concat([[bx+bw,ty]]);
  FS(s,sol,bottle);var lbl=RP(bx-bw,ty-64,bx+bw,ty-22);s.push(poly(lbl));s.push(rect(bx-bw+6,ty-58,bx+bw-6,ty-46));for(var l=0;l<3;l++)s.push([[bx-bw+8,ty-40+l*5],[bx+bw-8,ty-40+l*5]]);
  H(s,RP(bx+bw*0.4,ty-80,bx+bw,ty-66),1.6,90);var foil=RP(bx-8,neckT,bx+8,neckT+22);FS(s,sol,foil,1.4,0);
  var cx=RR(R,180,210),ck=[cx,ty-10];var cork=[[ck[0]-9,ty],[ck[0]-9,ty-30],[ck[0]+9,ty-30],[ck[0]+9,ty]];FS(s,sol,cork);s.push(ellipse(ck[0],ty-30,9,3));var dots=[];for(var d=0;d<8;d++)dots.push([[ck[0]+RR(R,-6,6),ty-RR(R,4,26)],[ck[0]+RR(R,-6,6)+1,ty-RR(R,4,26)]]);clipIn(s,dots,cork);
  var worm=[];for(var t=0;t<=1;t+=0.02){worm.push([ck[0]+Math.sin(t*TAU*4)*5,ty-36-t*40+Math.cos(t*TAU*4)*1.6]);}
  var wTop=[ck[0],ty-76];s.push(worm);var body=tube([[wTop[0]-50,wTop[1]-4],[wTop[0]+50,wTop[1]-4]],function(){return 5;}).P;FS(s,sol,body);clipIn(s,[rows(wTop[0]-50,wTop[0]+50,wTop[1]-8,wTop[1],2)],body);
  var lever=[[wTop[0]-50,wTop[1]-4],[wTop[0]-64,wTop[1]+6],[wTop[0]-70,wTop[1]+4]];s.push(lever);var knife=[[wTop[0]+40,wTop[1]-8],[wTop[0]+64,wTop[1]-20],[wTop[0]+66,wTop[1]-16],[wTop[0]+44,wTop[1]-4]];FS(s,sol,knife);
  s.push(circle(wTop[0],wTop[1]-4,2.4));
  var gl=RR(R,250,270),gb=ty;var glass=[[gl-18,gb-60]].concat(cubic([gl-18,gb-60],[gl-20,gb-34],[gl-4,gb-28],[gl-2,gb-24],8)).concat([[gl-2,gb-4],[gl-14,gb],[gl+14,gb],[gl+2,gb-4],[gl+2,gb-24]]).concat(cubic([gl+2,gb-24],[gl+4,gb-28],[gl+20,gb-34],[gl+18,gb-60],8));
  FS(s,sol,glass);s.push(ellipse(gl,gb-60,18,3));
  onT(s,R,ty,sol);return s;});

S('Paper airplane',['Folded on the Desk','Launch from the Window','Last Period Glider','Nose Down','Homework Flight'],function(R){
  var s=[],sol=[],fy=RR(R,176,182),wx=RR(R,180,200),wy=RR(R,30,36),ww=RR(R,80,90),wh=RR(R,90,100);
  var frame=RP(wx,wy,wx+ww,wy+wh);s.push(poly(frame));s.push(rect(wx+5,wy+5,wx+ww-5,wy+wh-5));s.push([[wx+ww/2,wy+5],[wx+ww/2,wy+wh-5]]);s.push([[wx+5,wy+wh/2],[wx+ww-5,wy+wh/2]]);
  var out=[];hills(out,R,wy+wh-14,24,5);treeR(out,R,wx+ww*0.3,wy+wh-8,10,2);clipIn(s,out,RP(wx+6,wy+6,wx+ww-6,wy+wh-6));sol.push(frame);
  var desk=[[20,fy-60],[280,fy-60],[280,fy-52],[20,fy-52]];FS(s,sol,desk,1.8,0);[[30,fy-52],[270,fy-52]].forEach(function(p){var L=RP(p[0]-4,p[1],p[0]+4,fy);FS(s,sol,L,1.6,90);});
  var dr=RP(200,fy-52,262,fy-30);FS(s,sol,dr);s.push(rect(226,fy-44,236,fy-40));
  var pl=function(cx,cy,sc,a){var P=[[0,0],[-60,-10],[-52,0],[-60,12]].map(function(p){return [cx+p[0]*sc,cy+p[1]*sc];});var Pr=rotateAbout(P,cx,cy,a);
    var top=rotateAbout([[cx,cy],[cx-60*sc,cy-10*sc],[cx-52*sc,cy]],cx,cy,a);var bot=rotateAbout([[cx,cy],[cx-52*sc,cy],[cx-60*sc,cy+12*sc]],cx,cy,a);
    FS(s,sol,poly(top).slice(0,-1));H(s,top,1.4,a*57+10);SOL(s,sol,bot);s.push(poly(bot));s.push(rotateAbout([[cx-4*sc,cy+1*sc],[cx-50*sc,cy+5*sc]],cx,cy,a));};
  pl(RR(R,130,160),RR(R,60,80),RR(R,1.4,1.6),RR(R,-0.3,-0.1));
  pl(RR(R,80,110),fy-62,0.8,0.04);
  var path=[];for(var t=0;t<1;t+=0.04)path.push([wx-10-t*60,wy+60+Math.sin(t*6)*12-t*10]);var dash=[];for(var k=0;k+1<path.length;k+=2)dash.push([path[k],path[k+1]]);A(s,dash);
  var pencils=[];var cup=[[40,fy-60],[44,fy-90],[64,fy-90],[68,fy-60]];FS(s,sol,cup);clipIn(s,[zz(40,68,fy-90,fy-60,3)],cup);for(var p2=0;p2<3;p2++)s.push([[48+p2*6,fy-90],[46+p2*7,fy-112]]);
  var bk=RP(120,fy-72,180,fy-60);FS(s,sol,bk);s.push([[122,fy-66],[178,fy-66]]);
  room2(s,R,fy,sol);return s;});

S('Skateboard',['Grip Tape and Bearings','Kicktail Up','Rolling to School','Against the Kerb','Four Small Wheels'],function(R){
  var s=[],sol=[],gy=RR(R,176,182),cx=RR(R,130,170),L=RR(R,96,104),dy=gy-RR(R,20,24),tilt=RR(R,-0.1,0.1);
  function T(p){return rotateAbout([p],cx,dy,tilt)[0];}
  var deck=[[cx-L,dy-14]].concat(quad([cx-L,dy-14],[cx-L+6,dy],[cx-L+24,dy],8)).concat([[cx+L-24,dy]]).concat(quad([cx+L-24,dy],[cx+L-6,dy],[cx+L,dy-14],8)).concat([[cx+L-2,dy-18]]).concat(quad([cx+L-2,dy-18],[cx+L-10,dy-6],[cx+L-26,dy-6],8)).concat([[cx-L+26,dy-6]]).concat(quad([cx-L+26,dy-6],[cx-L+10,dy-6],[cx-L+2,dy-18],8));
  deck=rotateAbout(deck,cx,dy,tilt);FS(s,sol,deck);clipIn(s,[rows(cx-L,cx+L,dy-20,dy,1.8)],deck);
  [-1,1].forEach(function(sd){var tx=cx+sd*(L-40);var tr=rotateAbout([[tx-14,dy],[tx+14,dy],[tx+8,dy+6],[tx-8,dy+6]],cx,dy,tilt);FS(s,sol,tr,1.2,0);
    [-1,1].forEach(function(w){var c=T([tx+w*12,dy+10]);var wh=EP(c[0],c[1],6,6);FS(s,sol,wh);s.push(circle(c[0],c[1],2.4));});});
  var curb=[[4,gy-30],[296,gy-30],[296,gy-6],[4,gy-6]];var bg=[];bg.push(poly(curb));H(bg,curb,3,0);for(var x=30;x<296;x+=60)bg.push([[x,gy-30],[x,gy-6]]);
  var sh=[];var shoe=[cx-L*0.4,dy-24];var sp=blob([[shoe[0]-26,shoe[1]+10],[shoe[0]-24,shoe[1]-6],[shoe[0]-4,shoe[1]-10],[shoe[0]+14,shoe[1]-2],[shoe[0]+22,shoe[1]+8],[shoe[0]+20,shoe[1]+12],[shoe[0]-26,shoe[1]+14]],4);
  if(false){FS(s,sol,sp);s.push([[shoe[0]-26,shoe[1]+10],[shoe[0]+22,shoe[1]+10]]);var lace=[];for(var k=0;k<4;k++)lace.push([shoe[0]-6+k*4,shoe[1]-8+k],[shoe[0]-2+k*4,shoe[1]-2+k]);s.push(lace);var leg=tube([[shoe[0]-12,shoe[1]-8],[shoe[0]-20,4]],function(){return 9;}).P;FS(s,sol,leg);clipIn(s,[zz(shoe[0]-40,shoe[0]+10,4,shoe[1]-8,4)],leg);}
  road(bg,R,gy);var wall=[];A(wall,[brickS(4,6,296,gy-30,RR(R,22,26),RR(R,9,10))]);A(bg,wall);behind(s,bg,sol);return s;});

S('Highchair',['Breakfast Throne','Tray Down, Spoon Up','Pea on the Floor','Wooden Spindles','First Birthday Seat'],function(R){
  var s=[],sol=[],fy=RR(R,178,184),cx=RR(R,130,160),sw=RR(R,30,34),sy=fy-RR(R,86,94);
  var legs=[[[cx-sw,sy],[cx-sw-20,fy]],[[cx+sw,sy],[cx+sw+20,fy]],[[cx-sw+10,sy],[cx-sw-4,fy-2]],[[cx+sw-10,sy],[cx+sw+4,fy-2]]];legs.forEach(function(L,i){var t=tube(L,function(){return i<2?3:2.4;}).P;FS(s,sol,t);if(i<2)H(s,t,1.4,90);});
  [fy-30,fy-60].forEach(function(y,i){var w=sw+(fy-y)*-0.22+20;s.push([[cx-w+4,y],[cx+w-4,y]]);});var foot=RP(cx-sw-10,fy-44,cx+sw+10,fy-40);FS(s,sol,foot,1,0);
  var seat=[[cx-sw-4,sy],[cx+sw+4,sy],[cx+sw,sy+8],[cx-sw,sy+8]];FS(s,sol,seat);H(s,seat,1.8,0);
  var back=[[cx-sw+2,sy],[cx-sw,sy-64],[cx+sw,sy-64],[cx+sw-2,sy]];var top=RP(cx-sw-4,sy-72,cx+sw+4,sy-62);FS(s,sol,top);H(s,top,2,0);var sp=[];for(var x=cx-sw+6;x<cx+sw-2;x+=8)sp.push(turned(x,sy-62,sy-2,2));sp.forEach(function(P){s.push(poly(P));});
  s.push(EP(cx,sy-67,10,2.4));
  var arm=[-1,1].map(function(sd){return [[cx+sd*sw,sy-30],[cx+sd*(sw+6),sy-34],[cx+sd*(sw+30),sy-34],[cx+sd*(sw+30),sy-28]];});arm.forEach(function(a){s.push(a);});
  var tray=[[cx-sw-12,sy-36],[cx+sw+40,sy-36],[cx+sw+44,sy-30],[cx-sw-8,sy-30]];FS(s,sol,tray,1.4,0);s.push([[cx-sw-10,sy-38],[cx+sw+42,sy-38]]);
  var bowl=[[cx+10,sy-38],[cx+12,sy-48],[cx+36,sy-48],[cx+38,sy-38]];FS(s,sol,bowl);s.push(ellipse(cx+24,sy-48,12,2.6));var spoon=[[cx-6,sy-40],[cx-30,sy-50]];s.push(spoon);s.push(ellipse(cx-34,sy-52,5,3));
  var bib=[[cx-14,sy-60],[cx+14,sy-60],[cx+12,sy-40],[cx-12,sy-40]];
  var peas=[];for(var p=0;p<RI(R,3,6);p++){var px=cx+RR(R,-60,60);peas.push(circle(px,fy+RR(R,4,10),1.6));}A(s,peas);
  room2(s,R,fy,sol);return s;});

S('Parking meter',['Twenty Minutes Left','Coins for the Kerb','Expired','Main Street Sentinel','Feed the Meter'],function(R){
  var s=[],sol=[],gy=RR(R,168,174),cx=RR(R,130,160),hy=gy-RR(R,128,136);
  var pole=RP(cx-4,hy+40,cx+4,gy);FS(s,sol,pole);H(s,RP(cx,hy+40,cx+4,gy),1.2,90);s.push(rect(cx-10,gy-6,cx+10,gy));
  var neck=[[cx-14,hy+40],[cx-10,hy+30],[cx+10,hy+30],[cx+14,hy+40]];FS(s,sol,neck,1.6,0);
  var head=[[cx-24,hy+30]].concat(arc(cx,hy,24,30,PI,TAU)).concat([[cx+24,hy+30]]);FS(s,sol,head);sideShade(s,head,0.3,1.6,90);
  var win=[[cx-16,hy+8]].concat(arc(cx,hy,16,18,PI,TAU)).concat([[cx+16,hy+8]]);FS(s,sol,win);
  var dial=arc(cx,hy+6,12,12,PI+0.2,TAU-0.2);s.push(dial);var tk=[];for(var k=0;k<7;k++){var a=PI+0.3+k*(PI-0.6)/6;tk.push([cx+12*Math.cos(a),hy+6+12*Math.sin(a)],[cx+9*Math.cos(a),hy+6+9*Math.sin(a)],[cx+12*Math.cos(a),hy+6+12*Math.sin(a)]);}s.push(tk);
  var needle=RR(R,PI+0.4,TAU-0.4);s.push([[cx,hy+6],[cx+11*Math.cos(needle),hy+6+11*Math.sin(needle)]]);if(needle>TAU-0.9){var fl=RP(cx-8,hy-8,cx+8,hy-2);FS(s,sol,fl,1,0);}
  s.push(RP(cx-6,hy+14,cx+6,hy+18));s.push(circle(cx+16,hy+22,4));s.push([[cx+16,hy+18],[cx+16,hy+26]]);
  var car=pick(R,[0,1]),cx2=car?cx+70:cx-200;var cb=[[cx2,gy-10],[cx2+4,gy-40],[cx2+30,gy-46],[cx2+50,gy-72],[cx2+110,gy-72],[cx2+130,gy-46],[cx2+150,gy-40],[cx2+154,gy-10]];
  var bg=[];bg.push(cb);bg.push(arc(cx2+34,gy-10,14,14,PI,TAU));bg.push(arc(cx2+120,gy-10,14,14,PI,TAU));bg.push(circle(cx2+34,gy-8,10));bg.push(circle(cx2+120,gy-8,10));
  bg.push(poly([[cx2+54,gy-68],[cx2+106,gy-68],[cx2+122,gy-46],[cx2+38,gy-46]]));H(bg,[[cx2+54,gy-68],[cx2+106,gy-68],[cx2+122,gy-46],[cx2+38,gy-46]],2.2,60);
  var walk=[];walk.push([[4,gy],[296,gy]]);walk.push([[4,gy+6],[296,gy+6]]);for(var x=10;x<296;x+=30)walk.push([[x,gy],[x-6,196]]);
  road(bg,R,gy+6);A(bg,walk);facade(bg,R,gy-24,sol.concat([cb.concat([[cx2+154,gy],[cx2,gy]])]));behind(s,bg,sol);return sky(s,R,gy-26,sol);});

S('Ship\'s telegraph',['Full Ahead','Engine Room, Stand By','Brass on the Bridge','Slow Astern','Ring Down for Speed'],function(R){
  var s=[],sol=[],fy=RR(R,182,186),cx=RR(R,135,165),hr=RR(R,54,58),hy=RR(R,72,78);
  var ped=[[cx-14,hy+hr-4],[cx-10,fy-20],[cx-22,fy-8],[cx-26,fy],[cx+26,fy],[cx+22,fy-8],[cx+10,fy-20],[cx+14,hy+hr-4]];FS(s,sol,ped);sideShade(s,ped,0.4,1.6,90);s.push([[cx-12,fy-30],[cx+12,fy-30]]);
  var rim=EP(cx,hy,hr,hr);SOL(s,sol,rim);s.push(spiral(cx,hy,hr*0.82,hr-0.8,3,0));var face=EP(cx,hy,hr*0.8,hr*0.8);s.push(poly(face));
  var lab=[];for(var k=0;k<9;k++){var a=PI+0.15+k*(PI-0.3)/8;lab.push([[cx+hr*0.8*Math.cos(a),hy+hr*0.8*Math.sin(a)],[cx+hr*0.3*Math.cos(a),hy+hr*0.3*Math.sin(a)]]);}A(s,lab);
  for(var j=0;j<8;j++){var a2=PI+0.15+(j+0.5)*(PI-0.3)/8,m=[cx+hr*0.56*Math.cos(a2),hy+hr*0.56*Math.sin(a2)];s.push([[m[0]-3,m[1]],[m[0]+3,m[1]]]);if(j%2)s.push([[m[0]-3,m[1]+2],[m[0]+3,m[1]+2]]);}
  s.push([[cx-hr*0.8,hy],[cx+hr*0.8,hy]]);var bot=[[cx-hr*0.7,hy+6]].concat(arc(cx,hy,hr*0.7,hr*0.7,0.15,PI-0.15).reverse()).concat([[cx+hr*0.7,hy+6]]);s.push(rows(cx-hr*0.5,cx+hr*0.5,hy+12,hy+22,5));
  var ang=PI+RR(R,0.4,PI-0.4),hl=[cx+Math.cos(ang)*hr*1.2,hy+Math.sin(ang)*hr*1.2];[-1,1].forEach(function(sd){var t=tube([[cx+sd*hr*1.02,hy],[hl[0]+sd*4,hl[1]]],function(){return 2.4;}).P;});
  var handle=tube([[cx,hy],hl],function(u){return 3-u;}).P;FS(s,sol,handle);var grip=RP(hl[0]-12,hl[1]-4,hl[0]+12,hl[1]+4);FS(s,sol,rotateAbout(grip,hl[0],hl[1],ang+PI/2),1.2,0);s.push(circle(cx,hy,6));s.push(circle(cx,hy,2.4));
  var bridge=[];var wy=RR(R,20,26);for(var w=0;w<3;w++){var wx=10+w*98;bridge.push(rect(wx,wy,wx+88,wy+60));H(bridge,RP(wx+4,wy+4,wx+84,wy+56),6,0);}
  bridge.push([[4,wy+70],[296,wy+70]]);bridge.push([[4,wy+76],[296,wy+76]]);var wheelX=pick(R,[RR(R,30,60),RR(R,240,270)]);bridge.push(circle(wheelX,wy+110,26));bridge.push(circle(wheelX,wy+110,6));for(var sp=0;sp<8;sp++){var a3=sp*PI/4;bridge.push([[wheelX+6*Math.cos(a3),wy+110+6*Math.sin(a3)],[wheelX+34*Math.cos(a3),wy+110+34*Math.sin(a3)]]);}
  bridge.push(rows(4,296,wy+82,fy-6,RR(R,5,6)));floorS(bridge,R,fy,RI(R,12,16));behind(s,bridge,sol);return s;});

// ---- batch 15 master: Tide pools on a rocky shore (type 4, natural scene, no buildings) ----
function anemone(s,sol,cx,cy,r,R){var P=EP(cx,cy,r,r*0.55);SOL(s,sol,P);s.push(poly(P));var t=[];for(var i=0;i<=28;i++){var a=i/28*TAU,b=[cx+r*0.35*Math.cos(a),cy+r*0.2*Math.sin(a)],e=[cx+r*(0.95+0.1*R())*Math.cos(a+0.15),cy+r*0.52*Math.sin(a+0.15)];t.push(b,e);}s.push(t);s.push(spiral(cx,cy,0.6,r*0.3,2,0).map(function(p){return [p[0],cy+(p[1]-cy)*0.55];}));return P;}
function star5(cx,cy,r,a){var p=[];for(var i=0;i<10;i++){var rr=i%2?r*0.38:r,an=a+i*PI/5;p.push([cx+rr*Math.cos(an),cy+rr*Math.sin(an)*0.7]);}return blob(p,3);}

MASTER={name:'Tide pools on a rocky shore',titles:['Low Tide, Late','Small Worlds in the Rock','Anemones Waiting','Between the Waves','Rock Pool Afternoon'],build:function(R){
  var s=[],sol=[],bg=[],hz=RR(R,38,44);
  // two big pools in the foreground rock, seen from slightly above
  var p1c=[RR(R,86,100),RR(R,140,148)],p2c=[RR(R,212,226),RR(R,116,124)];
  var pool1=blob([[p1c[0]-70,p1c[1]],[p1c[0]-56,p1c[1]-26],[p1c[0]-10,p1c[1]-34],[p1c[0]+40,p1c[1]-28],[p1c[0]+66,p1c[1]-6],[p1c[0]+54,p1c[1]+22],[p1c[0]+4,p1c[1]+32],[p1c[0]-48,p1c[1]+24]],6);
  var pool2=blob([[p2c[0]-58,p2c[1]],[p2c[0]-40,p2c[1]-22],[p2c[0]+6,p2c[1]-26],[p2c[0]+56,p2c[1]-14],[p2c[0]+64,p2c[1]+8],[p2c[0]+30,p2c[1]+24],[p2c[0]-20,p2c[1]+24],[p2c[0]-52,p2c[1]+16]],6);
  [pool1,pool2].forEach(function(P){s.push(poly(P));s.push(P.map(function(p,i){return [p[0],p[1]+(p[1]>p1c[1]-60?2.5:2.5)];}).slice(0,Math.floor(P.length*0.55)));});
  var inside=[];
  // pool 1: anemones, a starfish, urchins, weed and a crab at the rim
  var an=[[p1c[0]-36,p1c[1]+6,13],[p1c[0]+8,p1c[1]+14,10],[p1c[0]+38,p1c[1]-6,8]];an.forEach(function(a){inside.push(anemone(s,sol,a[0],a[1],a[2]+RR(R,-1,1),R));});
  var st=star5(p1c[0]-4,p1c[1]-14,RR(R,14,16),R()*TAU);FS(s,sol,st);var dots=[];for(var i=0;i<5;i++){var a2=i*TAU/5+R();dots.push([p1c[0]-4+Math.cos(a2)*6,p1c[1]-14+Math.sin(a2)*4],[p1c[0]-4,p1c[1]-14]);}s.push(dots);inside.push(st);
  var u1=spiky(p1c[0]+30,p1c[1]+18,5,5,14,R);s.push(u1);s.push(spiral(p1c[0]+30,p1c[1]+18,0.5,4.4,2.5,0));inside.push(EP(p1c[0]+30,p1c[1]+18,10,10));
  var weed=[];for(var w=0;w<5;w++){var b=[p1c[0]-60+w*6,p1c[1]+10],c=curve([b,[b[0]+8,b[1]-8],[b[0]+4,b[1]-18],[b[0]+12,b[1]-26]],5);weed.push(c);var tip=c[c.length-1];weed.push(poly(lens(tip,[tip[0]+8,tip[1]-6],2.4)));}
  // pool 2: anemones, a snail, a little fish and weed
  var an2=[[p2c[0]-28,p2c[1]+4,11],[p2c[0]+26,p2c[1]+8,12]];an2.forEach(function(a){inside.push(anemone(s,sol,a[0],a[1],a[2]+RR(R,-1,1),R));});
  var sn=[p2c[0]+2,p2c[1]-10];var shell=EP(sn[0],sn[1],8,6);SOL(s,sol,shell);s.push(spiral(sn[0],sn[1],0.6,7.4,3,0).map(function(p){return [p[0],sn[1]+(p[1]-sn[1])*0.75];}));inside.push(shell);
  var fx=p2c[0]+36,fy=p2c[1]-10,fish=lens([fx,fy],[fx+14,fy-2],4);s.push(poly(fish));s.push([[fx,fy],[fx-5,fy-4],[fx-5,fy+4],[fx,fy]]);inside.push(fish);
  var st2=star5(p2c[0]-46,p2c[1]-6,RR(R,9,11),R()*TAU);FS(s,sol,st2,1.1,30);inside.push(st2);
  // water ripples inside the pools (clipped around everything in them)
  var rip1=[],rip2=[];clipIn(s,[waterS(R,4,296,p1c[1]-36,p1c[1]+34,RR(R,5,6),0.8)],pool1,inside);clipIn(s,[waterS(R,4,296,p2c[1]-28,p2c[1]+26,RR(R,5,6),0.8)],pool2,inside);clipIn(s,weed,pool1,inside);
  sol.push(pool1,pool2);
  // crab on the rock between the pools
  var cx=RR(R,148,162),cy=RR(R,160,168);var cb=EP(cx,cy,13,8);FS(s,sol,cb);H(s,arc(cx,cy,13,8,PI,TAU).concat([[cx-13,cy]]),1.4,0);
  [1,-1].forEach(function(sd){for(var l=0;l<3;l++)s.push([[cx+sd*10,cy+1+l*2],[cx+sd*(18+l*2),cy-4+l*3],[cx+sd*(22+l*2),cy+6+l*3]]);var cl=[cx+sd*12,cy-6];s.push([cl,[cl[0]+sd*8,cl[1]-10]]);var pc=EP(cl[0]+sd*12,cl[1]-12,5,3.4);FS(s,sol,pc,1,0);});
  s.push([[cx-4,cy-8],[cx-5,cy-12]]);s.push([[cx+4,cy-8],[cx+5,cy-12]]);
  // mussel clusters and barnacles on the rock
  var mus=[];for(var m=0;m<2;m++){var mx=m?RR(R,250,280):RR(R,20,40),my=m?RR(R,160,172):RR(R,96,108);for(var k=0;k<5;k++){var a3=-PI/2+(k-2)*0.4,b2=[mx+k*5,my],e2=[mx+k*5+Math.cos(a3)*10,my+Math.sin(a3)*12];var L=lens(b2,e2,2.8);mus.push(L);}}
  mus.forEach(function(L){FS(s,sol,L,0.9,40);});
  var p3c=[RR(R,250,270),RR(R,170,178)],pool3=blob([[p3c[0]-26,p3c[1]],[p3c[0]-10,p3c[1]-9],[p3c[0]+20,p3c[1]-8],[p3c[0]+30,p3c[1]+2],[p3c[0]+8,p3c[1]+9],[p3c[0]-18,p3c[1]+8]],5);s.push(poly(pool3));var u3=spiky(p3c[0],p3c[1],4,4,12,R);s.push(u3);clipIn(s,[waterS(R,4,296,p3c[1]-9,p3c[1]+9,3.6,0.6)],pool3,[EP(p3c[0],p3c[1],9,9)]);sol.push(pool3);
  // rock: ledges and cracks behind the pools, foreground slabs hatched
  var rock=[];var ledges=[];for(var y=hz+30;y<196;y+=RR(R,16,22)){var row=[];for(var x=4;x<=296;x+=6)row.push([x,y+5*Math.sin(x/23+y)+3*Math.sin(x/9)]);ledges.push(row);}A(rock,ledges);
  var cr=[];for(var c=0;c<16;c++){var x0=RR(R,6,294),y0=RR(R,hz+34,190);cr.push([[x0,y0],[x0+RR(R,-6,6),y0+RR(R,8,16)]]);}A(rock,cr);
  H(rock,[[4,196],[4,170],[60,176],[120,184],[200,178],[296,168],[296,196]],RR(R,2.2,2.6),RR(R,25,40));
  H(rock,[[4,hz+30],[296,hz+26],[296,hz+44],[4,hz+48]],RR(R,2.4,2.8),RR(R,-30,-15));
  // seaweed hanging on the near ledge
  var kelp=[];for(var q=0;q<6;q++){var kx=RR(R,10,290),ky=RR(R,176,186);if(Math.abs(kx-cx)<30)continue;kelp.push(curve([[kx,ky],[kx+4,ky+6],[kx-2,ky+10],[kx+3,ky+14]],4));}A(rock,kelp);
  behind(s,rock,sol);
  // the sea beyond: breaking surf line, swell rows, a sea stack and the horizon
  var surf=[[4,hz+28]];for(var x2=4;x2<=296;x2+=8)surf.push([x2+4,hz+22-RR(R,0,4)],[x2+8,hz+28]);var sea=[surf];
  var sw=[],d=1;for(var y2=hz+3;y2<hz+24;y2+=3){var wv=wave(4,296,y2,0.9,RR(R,12,20),R()*6);if(d<0)wv.reverse();A(sw,wv);d=-d;}sea.push(sw);sea.push([[4,hz],[296,hz]]);
  var sx=pick(R,[RR(R,30,70),RR(R,230,270)]);var stack=[[sx-12,hz+20],[sx-10,hz-18],[sx-4,hz-26],[sx+6,hz-24],[sx+10,hz-10],[sx+14,hz+20]];sea.push(poly(stack));H(sea,stack,1.8,70);
  behind(s,sea,sol.concat([stack]));
  return sky(s,R,hz-1,sol.concat([stack]));}};

var NOTES="Batch 15 (Nov 25). Review of Nov 23-24 plays: Zen rock garden from above (Super Sketch, type 3) held its 20 minutes - raked rings and stepping stones read clearly, though the bottom strip was busy. Strong: lombardy poplars, desk fan, vintage TV, hollyhocks, pinball machine, unicycle, karst peaks, balalaika, street clock, cargo bike. Weak: harvest mouse, lemur, koala, warthog and ram lumpy or muddled; crop duster and hang glider tangled; beluga's ice blocky; mussels and quail too heavily hatched. Lessons kept: one line, keep extras touching; clip backgrounds with behind()/clipIn(); animals need a bold smooth silhouette (front views work for apes) with one shaded side; never cover the subject with all-over hatch or tile grids; draw small objects big; dozens of small closed shapes (nuts, spots, limpets) slow the planner; thin crossing stems trap skyFill - use rows behind() instead of sky there; vertical crack zigzags make cliffs look like fences. Daily Super Sketch: Tide pools on a rocky shore, a natural scene with no buildings (type 4); previous two were Watch movement close-up (type 2) and Zen rock garden from above (type 3).";
return {number:15,startedOn:"2026-11-25",notes:NOTES,master:MASTER||undefined,subjects:SUBJ};
})();
