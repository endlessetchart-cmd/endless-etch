// Endless Etch — batch 12. 48 subjects for 2026-11-22 (each plays about three times, shuffled per round) plus the Daily Super Sketch.
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
S('Toll house',['Pay at the Window','Turnpike Keeper','Penny for the Road','Bar Across the Lane','Six-Sided House'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,160,168),cx=RR(R,105,135),w=RR(R,24,30),h=RR(R,46,54),sd=RR(R,16,20);
  var cL=RP(cx-w,gy-h,cx+w,gy),lL=[[cx-w-sd,gy-h+4],[cx-w,gy-h],[cx-w,gy],[cx-w-sd,gy-3]],rL=[[cx+w,gy-h],[cx+w+sd,gy-h+4],[cx+w+sd,gy-3],[cx+w,gy]];
  FS(s,sol,cL);FS(s,sol,lL,1.6,90);FS(s,sol,rL);
  var ch=RP(cx+w-16,gy-h-44,cx+w-7,gy-h-20);
  var rf=[[cx-w-sd-6,gy-h+5],[cx-w+6,gy-h-30],[cx+w-6,gy-h-30],[cx+w+sd+6,gy-h+5]];s.push(poly(rf));sol.push(rf);
  clipIn(s,[scallopRows(cx-w-sd-6,cx+w+sd+6,gy-h-27,gy-h+5,6,4)],rf,[ch]);FS(s,sol,ch,1.3,90);s.push(rect(cx+w-18,gy-h-46,cx+w-5,gy-h-43));
  s.push(archP(cx,gy,7,15));H(s,RP(cx-6,gy-15,cx+6,gy),1.6,90);
  win(s,cx-w+4,gy-h+12,11,15,1.6);win(s,cx+w-15,gy-h+12,11,15,1.6);
  clipIn(s,[brickS(cx+w,gy-h-6,cx+w+sd,gy,7,4)],rL);
  s.push(rect(cx-w-sd+3,gy-h+14,cx-w-3,gy-h+34));s.push(zz(cx-w-sd+5,cx-w-5,gy-h+17,gy-h+31,2.4));
  var gx=cx+w+sd+RR(R,22,30),gl=RR(R,70,90);FS(s,sol,RP(gx-3,gy-36,gx+3,gy+8),1.2,90);s.push(rect(gx-4,gy-39,gx+4,gy-36));
  var bar=RP(gx+3,gy-26,Math.min(292,gx+gl),gy-18);FS(s,sol,bar);s.push(zz(gx+6,Math.min(290,gx+gl-3),gy-25,gy-19,RR(R,6,8)));
  FS(s,sol,RP(Math.min(288,gx+gl-6),gy-18,Math.min(292,gx+gl-2),gy+6),1,90);
  var rd=[[cx+w+sd+4,gy],[Math.min(296,gx+gl+10),gy],[296,196],[cx+w-10,196]];SOL(s,sol,rd);s.push([rd[0],rd[3]]);
  var d=1,rr=[];for(var y=gy+7;y<194;y+=RR(R,6,8)){var t=(y-gy)/(196-gy),xl=lerp(rd[0],rd[3],t)[0];if(d>0)rr.push([xl,y],[296,y]);else rr.push([296,y],[xl,y]);d=-d;}s.push(rr);
  treeR(bg,R,RR(R,20,45),gy,RR(R,16,20),2.2);gnd(bg,R,gy);hills(bg,R,gy-2,RR(R,22,32),5);return fin(s,R,bg,sol,gy-3);});

S('Quonset hut',['Half a Tin Can','Corrugated Afternoon','Surplus Shelter','Arched Steel Barn','Rib by Rib'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,162,170),fx=RR(R,70,95),r=RR(R,42,50),L=RR(R,110,140),up=RR(R,16,22);
  var front=arc(fx,gy,r,r,PI,TAU);var bx=fx+L,by=gy-up;
  var body=[[fx-r,gy]].concat(arc(fx,gy,r,r,PI,1.5*PI)).concat(arc(bx,by,r,r,1.5*PI,TAU)).concat([[bx+r,by],[fx+r,gy]]);SOL(s,sol,body);
  s.push(front.concat([[fx-r,gy]]));s.push([[fx,gy-r],[bx,by-r]]);s.push(arc(bx,by,r,r,1.5*PI,TAU));s.push([[fx+r,gy],[bx+r,by]]);
  var ribs=[],n=RI(R,24,28);for(var i=1;i<n;i++){var t=i/n,c=lerp([fx,gy],[bx,by],t);ribs.push(arc(c[0],c[1],r,r,1.5*PI,TAU));}s.push(serp(ribs));
  var sh=[];for(var j=1;j<n;j+=2){var t2=j/n,c2=lerp([fx,gy],[bx,by],t2),c3=lerp([fx,gy],[bx,by],(j+1)/n);sh.push(arc(c2[0],c2[1],r,r,1.85*PI,TAU));}s.push(serp(sh));
  var dw=RR(R,12,15);s.push(rect(fx-dw,gy-28,fx+dw,gy));s.push([[fx,gy-28],[fx,gy]]);H(s,RP(fx-dw,gy-28,fx,gy),1.8,45);
  [-1,1].forEach(function(d){var wx=fx+d*(dw+12);s.push(rect(wx-6,gy-30,wx+6,gy-20));s.push([[wx,gy-30],[wx,gy-20]]);});
  s.push(rect(fx-6,gy-r+6,fx+6,gy-r+12));s.push([[fx-dw-2,gy-30],[fx+dw+2,gy-30]]);
  var dr=fx-r-RR(R,6,12);[0,1].forEach(function(k){cyl(s,dr-k*15,gy,6,15,1.4,1);sol.push(RP(dr-k*15-6,gy-17,dr-k*15+6,gy));});
  for(var p=0;p<RI(R,4,6);p++){var px=bx+r+12+p*14;if(px<290){bg.push([[px,by+4],[px,by-14]]);bg.push([[px,by-11],[px+14,by-11]]);}}
  treeR(bg,R,RR(R,250,280),gy,RR(R,14,18),2);bg.push(tufts(4,296,gy,4,R));H(s,[[fx-r,gy],[fx-r*0.7,gy-r*0.7],[fx-dw,gy-r*0.7],[fx-dw,gy]],2.4,0);
  gnd(bg,R,gy);hills(bg,R,gy-6,RR(R,18,26),5);return fin(s,R,bg,sol,gy-3);});

S('Fire escape on a brick wall',['Zigzag to the Street','Summer Night Landing','Iron Stairs Down','Third-Floor Balcony','Ladder to the Alley'],function(R){
  var s=[],sol=[],holes=[],fy=RR(R,182,188),cols=[RR(R,30,50),RR(R,125,145),RR(R,220,245)],rowsY=[RR(R,14,20),RR(R,68,74),RR(R,122,128)];
  rowsY.forEach(function(y){cols.forEach(function(x){var W=RP(x,y,x+28,y+36);holes.push(W);s.push(poly(W));s.push(rect(x-3,y+36,x+31,y+40));s.push([[x,y+18],[x+28,y+18]]);s.push([[x+14,y],[x+14,y+36]]);H(s,RP(x,y,x+14,y+18),1.6,0);H(s,RP(x+14,y+18,x+28,y+36),1.8,0);});});
  var ex=cols[1]-RR(R,16,22),ew=RR(R,64,72);
  rowsY.forEach(function(y,i){var py=y+41;var P=RP(ex,py,ex+ew,py+3);holes.push(RP(ex,py-14,ex+ew,py+3));s.push(poly(P));s.push(comb(ex,ex+ew,py,13,4));s.push([[ex,py-13],[ex+ew,py-13]]);
    if(i<2){var ny=rowsY[i+1]+41,dir=i%2?1:-1,x0=dir>0?ex+4:ex+ew-4,x1=dir>0?ex+ew-24:ex+24,st=[[x0,py+3],[x1,ny]];s.push(st);s.push(translate(st,dir*-8,0));
      var rung=[];for(var k=1;k<10;k++){var a=lerp(st[0],st[1],k/10);rung.push(k%2?[a,[a[0]-dir*8,a[1]]]:[[a[0]-dir*8,a[1]],a]);}A(s,rung);s.push([[x0,py-10],[x1,ny-13]]);}});
  var ly=rowsY[2]+44;s.push([[ex+8,ly],[ex+8,fy-14]]);s.push([[ex+18,ly],[ex+18,fy-14]]);for(var y2=ly+5;y2<fy-14;y2+=6)s.push([[ex+8,y2],[ex+18,y2]]);
  if(R()<0.7){var pt=ex+RR(R,30,50),pb=rowsY[0]+41;cyl(s,pt,pb,4,6,1,1);s.push(scallop(pt,pb-11,7,5,7,0.2));}
  var wall=[];clipIn(wall,[brickS(4,4,296,fy,RR(R,20,23),RR(R,8.5,9.5))],RP(4,4,296,fy),holes);A(s,wall);
  s.push([[4,fy],[296,fy]]);s.push(rows(4,296,fy+4,196,6));return s;});

S('Cycladic chapel',['Blue Dome, White Walls','Above the Aegean','Bell at Noon','Whitewash and Sea','Island Afternoon'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,160,166),cx=RR(R,120,170),w=RR(R,36,42),h=RR(R,38,44),top=gy-h;
  var body=RP(cx-w,top,cx+w,gy);FS(s,sol,body);s.push([[cx-w-2,top],[cx+w+2,top]]);
  var dr=RR(R,20,24),dome=[[cx-dr,top]].concat(arc(cx,top,dr,dr*1.05,PI,TAU)).concat([[cx+dr,top]]);FS(s,sol,RP(cx-dr-2,top-6,cx+dr+2,top));
  var dm=translate(dome,0,-6);FS(s,sol,dm,1.6,0);s.push([[cx,top-6-dr*1.05],[cx,top-16-dr*1.05]]);s.push([[cx-4,top-12-dr*1.05],[cx+4,top-12-dr*1.05]]);
  var bs=R()<0.5?-1:1,bx=cx+bs*(w-12),bell=[[bx-12,top],[bx-12,top-22]].concat(arc(bx,top-22,12,10,PI,TAU)).concat([[bx+12,top]]);FS(s,sol,bell);
  s.push(archP(bx,top-4,5,10));s.push(arc(bx,top-10,3,3,PI,TAU).concat([[bx+3,top-8],[bx-3,top-8]]));s.push([[bx,top-17],[bx,top-13]]);
  var dx=cx-bs*12;s.push(archP(dx,gy,7,16));H(s,RP(dx-6,gy-16,dx+6,gy),1.5,90);
  [cx+bs*16,cx-bs*(w-10)].forEach(function(x){s.push(archP(x,top+22,4,6));H(s,RP(x-4,top+16,x+4,top+22),1.2,90);});
  H(s,[[cx+w*0.55,top],[cx+w,top],[cx+w,gy],[cx+w*0.55,gy]].map(function(p){return [bs>0?p[0]:2*cx-p[0],p[1]];}),2.2,90);
  var steps=[];for(var k=0;k<4;k++){var y=gy+k*5,x0=dx-10-k*6,x1=dx+10+k*6;steps.push(rect(x0,y,x1,y+5));}A(s,steps);sol.push(RP(dx-28,gy,dx+28,gy+20));
  var sw=wall(s,R,4,cx-w,gy,12,9);var sw2=wall(s,R,cx+w,296,gy,12,9);sol.push(RP(4,gy-14,cx-w,gy));sol.push(RP(cx+w,gy-14,296,gy));
  var hy=gy-RR(R,36,46);bg.push([[4,hy],[296,hy]]);bg.push(waterS(R,4,296,hy+4,gy-2,RR(R,5,6),1));
  var rk=[[4,gy],[4,gy-6]];gnd(bg,R,gy+20,3.6,RR(R,15,25));var sl=[];hatch(RP(4,gy,296,gy+20),4,RR(R,-25,-10)).forEach(function(x){sl.push(x);});behind(s,sl,sol);
  return fin(s,R,bg,sol,hy-1);});

S('Harbor breakwater with beacon',['Last Light on the Mole','Green to Starboard','Seawall and Beacon','Spray on the Blocks','End of the Breakwater'],function(R){
  var s=[],sol=[],bg=[],hy=RR(R,98,108),by=RR(R,150,158),ex=RR(R,190,230);
  var top=[[4,by-14],[ex,by-20]],bw=[[4,by+6],[4,by-14],[ex,by-20],[ex+6,by-14],[ex+6,by-4],[4,by+10]];FS(s,sol,bw);
  var fac=[];for(var x=10;x<ex;x+=RR(R,9,12)){var t=x/ex,y0=by-14-6*t;fac.push([[x,y0+0.2],[x,y0+10]]);}var d=1,f=[];fac.forEach(function(st){if(d>0)A(f,st);else A(f,st.slice().reverse());d=-d;});
  var face=[[4,by-4],[ex+6,by-14],[ex+6,by-4],[4,by+10]];H(s,face,2,10);
  var bl=[];for(var x2=6;x2<ex;x2+=RR(R,12,18)){var t2=x2/ex,yb=by+10-14*t2+2;bl.push([[x2-6,yb+2],[x2-3,yb+6],[x2+5,yb+6],[x2+7,yb+1],[x2+2,yb-2],[x2-5,yb-1],[x2-6,yb+2]]);}bl.forEach(function(P){SOL(s,sol,P);});
  var lx=ex-10,lb=by-19,lh=RR(R,48,58);var tw=[[lx-7,lb],[lx-5,lb-lh],[lx+5,lb-lh],[lx+7,lb]];FS(s,sol,tw);
  for(var k=0;k<3;k++){var y1=lb-lh*(0.15+k*0.3),y2=y1-lh*0.13;H(s,[[lx-7+2*(lb-y1)/lh,y1],[lx+7-2*(lb-y1)/lh,y1],[lx+7-2*(lb-y2)/lh,y2],[lx-7+2*(lb-y2)/lh,y2]],1.3,0);}
  var g=RP(lx-6,lb-lh-12,lx+6,lb-lh);s.push(poly(g));sol.push(g);s.push([[lx,lb-lh-12],[lx,lb-lh]]);s.push([[lx-8,lb-lh],[lx+8,lb-lh]]);s.push([[lx-7,lb-lh-12],[lx,lb-lh-19],[lx+7,lb-lh-12]]);s.push([[lx,lb-lh-19],[lx,lb-lh-23]]);
  for(var r=0;r<4;r++){var a=-PI/2+(r-1.5)*0.35;s.push([[lx+12*Math.cos(a)*1.4,lb-lh-6+12*Math.sin(a)*0.3],[lx+30*Math.cos(a)*1.4,lb-lh-6+30*Math.sin(a)*0.5]]);}
  s.push(comb(10,ex-20,by-16,6,RR(R,14,18)));
  for(var b=0;b<RI(R,2,3);b++){var px=RR(R,30,ex-40),py=by-14-6*px/ex;perched(s,px,py-6,3,sgn(R));s.push([[px,py-6],[px,py]]);}
  var sp=[];for(var q=0;q<RI(R,2,3);q++){var sx=RR(R,40,ex-20),sy=by+8-14*sx/ex;sp.push(scallop(sx,sy-4,8,5,8,0.25));}A(s,sp);
  bg.push([[4,hy],[296,hy]]);if(R()<0.6)hills(bg,R,hy,RR(R,10,16),3);
  var wt=[waterS(R,4,296,hy+5,196,RR(R,5,6.5),1.3)];behind(s,wt,sol);behind(s,bg,sol);return sky(s,R,hy-1,sol);});

S('Cave with stalactites',['Looking Out from Within','Drip by Drip','Mouth of the Cave','Limestone Teeth','Daylight at the Entrance'],function(R){
  var s=[],cx=RR(R,130,170),cy=RR(R,96,106),mw=RR(R,95,110),mh=RR(R,62,72);
  var mouth=blob([[cx-mw,cy+mh*0.6],[cx-mw*0.95,cy-mh*0.2],[cx-mw*0.6,cy-mh*0.85],[cx,cy-mh],[cx+mw*0.6,cy-mh*0.8],[cx+mw*0.95,cy-mh*0.1],[cx+mw,cy+mh*0.6],[cx+mw*0.3,cy+mh*0.75],[cx-mw*0.3,cy+mh*0.72]],8);
  s.push(poly(mouth));var holes=[mouth];
  var tites=[],n=RI(R,9,12);for(var i=0;i<n;i++){var t=(i+0.5)/n,a=PI+0.25+t*(PI-0.5),px=cx+mw*0.92*Math.cos(a),py=cy+mh*0.92*Math.sin(a),L=RR(R,12,34)*(0.6+0.6*Math.sin(t*PI)),wd=RR(R,3,6);
    var T=[[px-wd,py-4],[px-wd*0.6,py+L*0.5],[px,py+L],[px+wd*0.6,py+L*0.5],[px+wd,py-4]];tites.push(T);}
  var gy=cy+mh*0.62,mites=[];for(var j=0;j<RI(R,4,6);j++){var mx=cx+RR(R,-mw*0.8,mw*0.8),mL=RR(R,10,22),mw2=RR(R,4,7);mites.push([[mx-mw2,gy+6],[mx-mw2*0.5,gy-mL*0.5],[mx,gy-mL],[mx+mw2*0.5,gy-mL*0.5],[mx+mw2,gy+6]]);}
  var hy=cy+RR(R,0,12),inside=[];inside.push([[4,hy],[296,hy]]);inside.push(waterS(R,4,296,hy+4,gy+6,RR(R,4.5,5.5),1));hills(inside,R,hy,RR(R,14,22),4);
  inside.push(skyS(4,hy-24,RR(R,5,6),9));
  var cut=[];clipIn(cut,inside,mouth,tites.concat(mites));A(s,cut);
  tites.forEach(function(T){s.push(T);H(s,T,1.6,RR(R,70,110));});mites.forEach(function(T){s.push(T);H(s,T,1.6,RR(R,70,110));});
  var pool=EP(cx+RR(R,-30,30),gy+20,RR(R,40,60),8);s.push(poly(pool));var pc=[];clipIn(pc,[rows(4,296,gy+15,gy+28,3)],pool);A(s,pc);
  var rock=[RP(4,4,296,196),mouth,pool];HX(s,rock,RR(R,3.3,3.8),RR(R,30,60)*sgn(R));
  var cr=[];for(var c=0;c<RI(R,5,8);c++){var x0=RR(R,10,290),y0=R()<0.5?RR(R,8,40):RR(R,170,192),cc=[[x0,y0]];for(var q=0;q<4;q++)cc.push([cc[q][0]+RR(R,-10,10),cc[q][1]+RR(R,3,7)*(y0<100?1:-1)]);cr.push(cc);}behind(s,cr,[mouth]);
  return s;});

S('Moonrise over a field',['Harvest Moon Rising','Big Moon, Low Field','The Moon Clears the Hedge','Evening Furrows','Night Comes Up Orange'],function(R){
  var s=[],sol=[],bg=[],hy=RR(R,108,118),mx=RR(R,90,210),mr=RR(R,34,40);
  var moon=arc(mx,hy,mr,mr,PI,TAU);SOL(s,sol,moon.concat([[mx-mr,hy]]));s.push(moon);
  for(var m=0;m<RI(R,4,6);m++){var a=PI+RR(R,0.3,2.8),rr=RR(R,0.25,0.7)*mr,px=mx+rr*Math.cos(a),py=hy+rr*Math.sin(a)*0.9;if(py>hy-5)continue;var P=blob([[px-6,py],[px-3,py-4],[px+4,py-3],[px+6,py+1],[px+1,py+4],[px-4,py+3]],4);s.push(poly(P));H(s,P,1.2,30);}
  var ty=hy,tx=mx+sgn(R)*RR(R,mr+20,mr+60);tx=Math.max(30,Math.min(270,tx));var tr=scallop(tx,ty-34,22,18,9,0.12);SOL(s,sol,tr);H(s,tr.slice(0,-1),1.6,RR(R,30,60));s.push([[tx-3,ty],[tx-3,ty-18],[tx+3,ty-18],[tx+3,ty]]);sol.push(RP(tx-3,ty-18,tx+3,ty));
  var hxs=[];for(var c=20;c<=280;c+=20)if(Math.abs(c-mx)>mr+18&&Math.abs(c-tx)>32)hxs.push(c);for(var hh=0;hh<2&&hxs.length;hh++){var hx=hxs.splice(Math.floor(R()*hxs.length),1)[0],hb=hy+10+hh*12,hs=[[hx-14,hb],[hx-12,hb-12],[hx,hb-20],[hx+12,hb-12],[hx+14,hb]];FS(s,sol,hs,1.8,RR(R,50,70));s.push([[hx-10,hb-6],[hx+10,hb-6]]);}
  var fp=[[4,hy+4]];for(var x=10;x<296;x+=RR(R,14,22)){fp.push([x,hy+4],[x,hy-6],[x,hy+4]);}fp.push([296,hy+4]);s.push(fp);s.push([[4,hy-2],[296,hy-2]]);
  furrows(bg,R,hy+4,RI(R,30,38),mx);var gh=[];H(gh,RP(4,hy+4,296,196),RR(R,6,8),RR(R,-8,8));behind(s,gh,sol);s.push([[4,hy],[296,hy]]);
  behind(s,bg,sol);return sky(s,R,hy-1,sol);});

S('Fog in the valley',['Morning Fog Settling','Spire Above the Mist','Valley Asleep','Ridges in the White','Before the Sun Burns It Off'],function(R){
  var s=[],sol=[],bg=[],fy=RR(R,118,128);
  var far=peaks(bg,R,fy,RR(R,60,80),RI(R,4,5),RR(R,2.2,2.8));
  var sx=RR(R,100,200),spire=[[sx-5,fy],[sx-5,fy-18],[sx,fy-36],[sx+5,fy-18],[sx+5,fy]];FS(s,sol,spire);H(s,[[sx,fy-36],[sx+5,fy-18],[sx+5,fy],[sx,fy]],1.2,90);s.push([[sx,fy-36],[sx,fy-44]]);s.push([[sx-3,fy-41],[sx+3,fy-41]]);s.push(archP(sx,fy-8,2,4));
  var fog=[],d=1;for(var y=fy-1;y<fy+30;y+=RR(R,6,9)){var w=wave(4,296,y,RR(R,1,2.5),RR(R,40,80),R()*6);if(d<0)w.reverse();fog.push(w);d=-d;}
  var near=[],ny=fy+RR(R,26,34);for(var x=4;x<=296.1;x+=4)near.push([x,ny+RR(R,-1,1)+18*Math.sin(x/95+R()*0.1)-14*Math.cos(x/47)]);near=near.map(function(p){return [p[0],Math.max(fy+12,p[1])];});
  var NP=near.concat([[296,196],[4,196]]);SOL(s,sol,NP);s.push(near);HX(s,[NP],RR(R,2.2,2.8),RR(R,15,35)*sgn(R));
  for(var p=0;p<RI(R,5,8);p++){var px=RR(R,8,292),pb=interpY(near,px)+2;pineT(s,px,pb,RR(R,0.7,1),1.6);}
  for(var c=0;c<2;c++){var cx=RR(R,60,240),cy=fy+RR(R,6,16);fog.push(scallop(cx,cy,RR(R,26,40),5,6,0.2));}
  behind(s,fog,sol);behind(s,bg,sol);return sky(s,R,fy-2,sol);});

S('Lava flow into the sea',['Where Fire Meets Water','New Land Forming','Steam at the Edge','Red River Downhill','The Island Grows'],function(R){
  var s=[],sol=[],bg=[],sea=RR(R,128,138),cl=RR(R,150,190);
  var slope=[[4,RR(R,34,50)],[cl*0.5,RR(R,80,95)],[cl,sea-8],[cl+8,sea],[cl+14,196],[4,196]];var SL=curve(slope.slice(0,4),8).concat([[cl+14,196],[4,196]]);SOL(s,sol,SL);s.push(SL.slice(0,-2));
  var lv=[],l0=[],l1=[];for(var t=0;t<=1.0001;t+=0.05){var p=[18+t*(cl-20),interpY(SL.slice(0,-2),18+t*(cl-20))+14+t*10+5*Math.sin(t*7)],w=6+t*10;l0.push([p[0]-w*0.4,p[1]-w]);l1.push([p[0]+w*0.4,p[1]+w]);}
  var LP=l0.concat(l1.slice().reverse());s.push(poly(LP));var cr=[];for(var i=1;i<l0.length-1;i++){var a=l0[i],b=l1[i];cr.push(i%2?[a,lerp(a,b,0.5),[b[0]+1,b[1]]]:[b,lerp(a,b,0.5),a]);}var crs=[];cr.forEach(function(c){A(crs,c);});s.push(crs);
  var rk=[SL,LP];HX(s,rk,RR(R,2.4,3),RR(R,40,60));
  var plume=blob([[cl-4,sea-2],[cl-10,sea-24],[cl-2,sea-48],[cl+22,sea-62],[cl+50,sea-56],[cl+62,sea-36],[cl+48,sea-14],[cl+30,sea-2]],6);SOL(s,sol,plume);
  var pl=[];for(var k=0;k<5;k++)pl.push(scallop(cl+12+k*7,sea-14-k*9,12-k,8-k*0.6,7,0.2));clipIn(s,pl,plume);
  s.push([[cl+14,sea],[296,sea]]);var sp=[];for(var q=0;q<RI(R,6,9);q++){var x=cl+RR(R,10,30);sp.push([[x,sea],[x+RR(R,-6,6),sea-RR(R,4,10)]]);}A(s,sp);
  var w=[waterS(R,4,296,sea+5,196,RR(R,5,6),1.2)];behind(s,w,sol);
  bg.push([[cl,sea-30],[296,sea-30]]);var far=[];for(var x2=cl+60;x2<296;x2+=4)far.push([x2,sea-30-10*Math.sin((x2-cl-60)/40)]);bg.push(far);
  return fin(s,R,[],sol,sea-1);});

S('Lupins',['Spires of Lupins','Roadside Colour','June Border','Tall Ones by the Wall','Lupin Patch'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,166,172),n=RI(R,3,4);
  for(var i=0;i<n;i++){var x=34+i*232/(n-1)+RR(R,-10,10),b=gy-RR(R,22,34),L=RR(R,66,96),bend=RR(R,-8,8),w0=RR(R,9,11),m=Math.round(L/4.2);
    s.push(quad([x,gy],[x,b-L*0.5],[x+bend,b-L],14));var p=[],env=[],envR=[];
    for(var k=0;k<m;k++){var t=k/m,y=b-L*t,cx=x+bend*t*t,ww=w0*(1-t*0.8);
      A(p,arc(cx-ww*0.5,y-1.5,ww*0.5,2.4,0,TAU));A(p,arc(cx+ww*0.5,y-3.6,ww*0.5,2.4,PI,PI+TAU));env.push([cx-ww-0.5,y]);envR.push([cx+ww+0.5,y-2]);}
    p.push([x+bend,b-L-7]);s.push(p);var E=env.concat([[x+bend,b-L-7]]).concat(envR.reverse());sol.push(E);

    var lc=[x,gy-RR(R,8,12)],fp=[lc],fe=[lc];for(var f=0;f<RI(R,7,9);f++){var a=PI*1.08+f*PI*0.84/8,rl=RR(R,14,19),tip=[lc[0]+rl*Math.cos(a),lc[1]+rl*0.68*Math.sin(a)],nx=-Math.sin(a)*2.6,ny=Math.cos(a)*2.6,mid=lerp(lc,tip,0.55);
      A(fp,quad(lc,[mid[0]+nx,mid[1]+ny],tip,6).slice(1));A(fp,quad(tip,[mid[0]-nx,mid[1]-ny],lc,6).slice(1));fe.push(tip);}
    s.push(fp);sol.push(fe);}
  wall(bg,R,4,296,gy-6,RR(R,22,28),12);
  bg.push(tufts(4,296,gy,5,R));gnd(bg,R,gy);hills(bg,R,gy-30,RR(R,14,22),4.5);return fin(s,R,bg,sol,gy-32);});

S('Gourds on a vine',['Gourds on the Rail','Bottle Necks Hanging','Late Vine','Squash Arbor','Curing in the Sun'],function(R){
  var s=[],sol=[],bg=[],ty=RR(R,30,40),fy=RR(R,176,182);
  var beam=RP(4,ty,296,ty+6);FS(s,sol,beam,1.4,0);for(var x=20;x<296;x+=RR(R,46,60)){var P=RP(x-3,ty+6,x+3,fy);FS(s,sol,P,1.2,90);}
  var vp=[];for(var k=0;k<=12;k++)vp.push([4+k*24.3,ty+3+RR(R,-4,10)]);var vc=vine(s,vp,R);
  var n=RI(R,6,8);for(var i=0;i<n;i++){var gx=18+i*264/(n-1)+RR(R,-6,6),gt=interpY(vc,gx),L=RR(R,30,70),kind=R(),G;
    s.push([[gx,gt],[gx,gt+L*0.35]]);var y0=gt+L*0.35;
    if(kind<0.45)G=blob([[gx,y0],[gx+5,y0+L*0.2],[gx+3,y0+L*0.35],[gx+10,y0+L*0.6],[gx,y0+L*0.75],[gx-10,y0+L*0.6],[gx-3,y0+L*0.35],[gx-5,y0+L*0.2]],6);
    else if(kind<0.75)G=EP(gx,y0+12,RR(R,10,14),12);else G=blob([[gx,y0],[gx+7,y0+8],[gx+9,y0+24],[gx,y0+34],[gx-9,y0+24],[gx-7,y0+8]],6);
    FS(s,sol,G);H(s,G,RR(R,1.6,2.4),RR(R,60,120));}
  for(var l=0;l<RI(R,7,10);l++){var lx=RR(R,10,290),ly=interpY(vc,lx),hl=heartLeaf(lx,ly-6,RR(R,7,10),RR(R,-0.6,0.6)+PI);FS(s,sol,hl);s.push([[lx,ly],[lx,ly-10]]);}
  var wall=[];H(wall,RP(4,4,296,fy),RR(R,10,11.5),90);behind(s,wall,sol);s.push([[4,fy],[296,fy]]);s.push(rows(4,296,fy+4,196,4));return s;});

S('Ox cart',['Slow Road Home','Yoked Pair','Hay at Walking Pace','Wheels and Horns','Down to the Village'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,166,172),ox=RR(R,190,215),OX=[[-40,-44],[-10,-46],[20,-46],[30,-44],[36,-48],[44,-50],[50,-46],[54,-40],[52,-32],[46,-30],[40,-34],[34,-30],[32,-18],[32,0],[26,0],[25,-16],[18,-20],[14,-14],[14,0],[8,0],[7,-18],[-24,-20],[-24,0],[-30,0],[-32,-16],[-36,-18],[-36,0],[-42,0],[-44,-18],[-46,-32],[-44,-42]];
  var sc=RR(R,0.95,1.05);
  [[ox+10,gy-6],[ox,gy]].forEach(function(o,j){var P=M(OX,o[0],o[1],sc,1);SOL(s,sol,P);if(j===1)H(s,M([[-40,-40],[-10,-42],[-10,-22],[-24,-20],[-34,-20],[-44,-30]],o[0],o[1],sc,1),1.8,70);
    s.push(quad(M([[40,-49]],o[0],o[1],sc,1)[0],M([[36,-62]],o[0],o[1],sc,1)[0],M([[46,-64]],o[0],o[1],sc,1)[0]));s.push(curve(M([[-45,-40],[-50,-30],[-50,-14]],o[0],o[1],sc,1),5));s.push(circle(o[0]+46*sc,o[1]-44*sc,1));});
  var yk=[[ox+26*sc,gy-50*sc],[ox+38*sc,gy-52*sc]];s.push(rect(ox+24*sc,gy-56*sc,ox+40*sc,gy-50*sc));
  var cx=ox-RR(R,70,80),wr=RR(R,22,26),wy=gy-wr;spokeW(s,sol,cx,wy,wr,RI(R,8,12));
  var bed=RP(cx-44,wy-10,cx+30,wy-2);FS(s,sol,bed,1.6,0);s.push([[cx+30,wy-6],[ox+30*sc,gy-52*sc]]);s.push([[cx+30,wy-3],[ox+30*sc,gy-50*sc]]);
  var st=comb(cx-44,cx+30,wy-10,20,RR(R,9,12));s.push(st);
  var hay=scallop(cx-7,wy-30,40,16,14,0.12);hay=hay.filter(function(p){return p[1]<wy-10;});hay=[[cx-46,wy-10]].concat(hay).concat([[cx+32,wy-10]]);SOL(s,sol,hay);s.push(hay);
  var hl=[];for(var k=0;k<14;k++){var hx=cx-40+k*5.5,hy=wy-12-RR(R,6,26)*Math.sin((k+0.5)/14*PI);hl.push([[hx,wy-12],[hx+RR(R,-3,3),hy]]);}clipIn(s,hl,hay);
  var rd=[];road(rd,R,gy);behind(s,rd,sol);treeR(bg,R,RR(R,20,50),gy,RR(R,15,19),2.2);hills(bg,R,gy,RR(R,26,38),5);return fin(s,R,bg,sol,gy-2);});

S('Fishing dory on the beach',['Hauled Up Above the Tide','Oars Shipped','Ebb Morning','Dory and Floats','Waiting for the Turn'],function(R){
  var s=[],sol=[],bg=[],hy=RR(R,96,106),sy=RR(R,130,138),bx=RR(R,90,120),bl=RR(R,120,140),bh=RR(R,26,32),by=RR(R,165,172);
  var hull=[[bx,by-bh-6],[bx+bl,by-bh-12],[bx+bl-22,by],[bx+20,by-2]];FS(s,sol,hull);
  var gw=quad([bx,by-bh-6],[bx+bl*0.5,by-bh+4],[bx+bl,by-bh-12],16);s.push(gw);s.push(translate(gw,0,4));
  var pl=[];for(var k=1;k<4;k++){var t=k/4;pl.push(quad(lerp([bx,by-bh-6],[bx+20,by-2],t),[bx+bl*0.5,lerp([by-bh+4,0],[by,0],t)[0]],lerp([bx+bl,by-bh-12],[bx+bl-22,by],t),16));}s.push(serp(pl));
  H(s,[[bx+8,by-bh*0.45],[bx+bl-10,by-bh*0.55],[bx+bl-22,by],[bx+20,by-2]],1.8,RR(R,-10,10));
  var op=[[bx+30,by-bh-2],[bx+bl+30,by-bh-34]];s.push(op);s.push(translate(op,0,3));var bld=lens([bx+bl+10,by-bh-24],[bx+bl+34,by-bh-38],4);s.push(bld);
  var ax=bx-RR(R,24,34),ay=by+6;s.push([[bx+4,by-bh-4],[ax+12,ay-8]]);s.push([[ax,ay-14],[ax,ay+2]]);s.push(arc(ax,ay-4,8,6,0,PI));s.push([[ax-4,ay-12],[ax+4,ay-12]]);s.push(circle(ax,ay-16,2));
  for(var f=0;f<RI(R,2,3);f++){var fx=bx+bl+RR(R,0,40),fy=by+RR(R,4,14);if(fx>290)continue;var fl=EP(fx,fy,5,3.5);SOL(s,sol,fl);s.push(poly(fl));H(s,RP(fx-5,fy-3.5,fx,fy+3.5),1.2,90);s.push([[fx+5,fy],[fx+12,fy+3]]);}
  var net=[[bx+40,by-bh-6],[bx+60,by-bh+14],[bx+70,by-bh-10]];var nt=[];for(var n2=0;n2<5;n2++)nt.push(quad([bx+38+n2*6,by-bh-5],[bx+46+n2*6,by-bh+10],[bx+54+n2*6,by-bh-6],8));s.push(serp(nt));
  s.push([[4,sy],[296,sy]]);var foam=[];for(var x=4;x<296;x+=RR(R,12,18))foam.push([x,sy],[x+5,sy-2],[x+9,sy]);s.push(foam);
  sand(bg,R,sy+6);bg.push(waterS(R,4,296,hy+5,sy-4,RR(R,5,6),1.1));bg.push([[4,hy],[296,hy]]);hills(bg,R,hy,RR(R,10,18),4);return fin(s,R,bg,sol,hy-1);});

S('Windsurfer',['Planing in the Gusts','Sail Full, Board Flying','Beam Reach','Wind on the Bay','Leaning Out'],function(R){
  var s=[],sol=[],bg=[],hy=RR(R,92,100),cx=RR(R,130,170),by=RR(R,160,168);
  var board=[[cx-50,by],[cx+48,by-4],[cx+58,by-2],[cx+50,by+3],[cx-48,by+5]];FS(s,sol,board);s.push([[cx-45,by+2],[cx+50,by-1]]);
  var mb=[cx+4,by-2],mt=[cx+RR(R,14,22),by-RR(R,106,120)],cl=[cx+RR(R,58,66),by-RR(R,24,30)];
  var sail=[mb,mt].concat(quad(mt,[cx+70,by-90],cl,14).slice(1)).concat([mb]);SOL(s,sol,sail);s.push(sail);s.push([mb,mt]);
  var bt=[];for(var k=1;k<6;k++){var t=k/6,a=lerp(mb,mt,t),q=quad(mt,[cx+70,by-90],cl,14),b=q[Math.round((1-t)*14)];bt.push(k%2?[a,b]:[b,a]);}var bs=[];bt.forEach(function(x){A(bs,x);});s.push(bs);
  var pan=[lerp(mb,mt,0.33),lerp(mb,mt,0.5)],q2=quad(mt,[cx+70,by-90],cl,14);H(s,[pan[0],pan[1],q2[7],q2[9]],1.8,RR(R,20,40));H(s,[lerp(mb,mt,0.66),lerp(mb,mt,0.83),q2[2],q2[4]],1.8,RR(R,20,40));
  var bm=[lerp(mb,mt,0.36),[cx+RR(R,40,48),by-RR(R,44,50)],cl];s.push(quad(bm[0],[cx+30,by-58],bm[2],10));s.push(quad(bm[0],[cx+32,by-38],bm[2],10));
  var hx=cx-RR(R,16,22),hd=[hx-4,by-58];s.push(circle(hd[0],hd[1],5));var sh=[hx-3,by-52],hp=[hx-8,by-30];s.push([sh,hp]);s.push([hp,[cx-14,by-2]]);s.push([hp,[cx-24,by-1]]);s.push([sh,[cx+8,by-52]]);s.push([[hx-2,by-46],[cx+10,by-42]]);H(s,[[hx-6,by-52],[hx,by-52],[hx-4,by-38],[hx-10,by-38]],1.2,0);
  var wk=[];for(var w=0;w<4;w++){wk.push(wave(cx-90-w*8,cx-48,by+6+w*4,1.5,10,w));}A(s,wk);
  var sp=[];for(var q=0;q<5;q++){sp.push([[cx+56,by-1],[cx+62+q*3,by-6-q*2]]);}A(s,sp);
  bg.push([[4,hy],[296,hy]]);bg.push(waterS(R,4,296,hy+5,196,RR(R,5,6.5),1.4));var hl=[];hills(bg,R,hy,RR(R,12,20),4);return fin(s,R,bg,sol,hy-1);});

S('Vintage delivery van',['Morning Round','Fresh from the Bakery','Deliveries by Nine','Painted Panel Van','Parked on the High Street'],function(R){
  var s=[],sol=[],gy=RR(R,170,176),x0=RR(R,50,70),L=RR(R,175,190),wr=RR(R,13,15);
  var bx1=x0+L*0.62,box=RP(x0,gy-84,bx1,gy-wr-6);FS(s,sol,box);s.push(rect(x0+8,gy-76,bx1-8,gy-48));s.push(zz(x0+14,bx1-14,gy-70,gy-54,RR(R,5,7)));
  var cab=[[bx1,gy-wr-6],[bx1,gy-78],[bx1+14,gy-78],[bx1+30,gy-54],[x0+L-6,gy-52],[x0+L,gy-40],[x0+L,gy-wr-6]];FS(s,sol,cab);
  var cw=[[bx1+4,gy-74],[bx1+13,gy-74],[bx1+25,gy-56],[bx1+4,gy-56]];s.push(poly(cw));H(s,cw,1.6,45);s.push([[bx1+30,gy-54],[bx1+30,gy-wr-6]]);s.push(rect(bx1+22,gy-50,bx1+28,gy-47));
  var gr=RP(x0+L-4,gy-48,x0+L+2,gy-24);FS(s,sol,gr,1,90);s.push(circle(x0+L-2,gy-56,4));s.push([[x0+L-2,gy-52],[x0+L-6,gy-50]]);
  [[x0+28,gy-wr],[x0+L-30,gy-wr]].forEach(function(c){var fd=[[c[0]-wr-6,gy-wr-4]].concat(arc(c[0],gy-wr,wr+5,wr+5,PI,TAU)).concat([[c[0]+wr+6,gy-wr-4]]);s.push(fd);H(s,fd.concat([[c[0]+wr+6,gy-wr-6],[c[0]-wr-6,gy-wr-6]]).slice(0),1.6,0);spokeW(s,sol,c[0],c[1],wr,12);});
  s.push(rect(x0-4,gy-wr-8,x0+L+4,gy-wr-4));s.push([[x0+L-30+wr+6,gy-wr-6],[bx1-2,gy-wr-6]]);
  var lp=RR(R,262,285);if(lp<x0+L+12)lp=x0+L+16;if(lp<292){s.push([[lp,gy],[lp,gy-96]]);s.push(rect(lp-5,gy-108,lp+5,gy-96));s.push([[lp-6,gy-108],[lp,gy-114],[lp+6,gy-108]]);sol.push(RP(lp-1,gy-114,lp+1,gy));}
  facade(s,R,gy-6,sol);cobbles(s,R,gy,sol);return sky(s,R,gy-8,sol);});

S('Vintage taxi cab',['Hailed at the Corner','Fare to Uptown','Light On, For Hire','Checkered Ride','Late Shift'],function(R){
  var s=[],sol=[],gy=RR(R,170,176),x0=RR(R,40,60),L=RR(R,200,215),wr=RR(R,13,15);
  var body=[[x0,gy-wr-2],[x0,gy-44],[x0+12,gy-50],[x0+56,gy-52],[x0+76,gy-80],[x0+136,gy-80],[x0+158,gy-54],[x0+L-14,gy-50],[x0+L,gy-44],[x0+L,gy-wr-2]];FS(s,sol,body);
  var w1=[[x0+80,gy-76],[x0+104,gy-76],[x0+104,gy-54],[x0+64,gy-54]],w2=[[x0+108,gy-76],[x0+134,gy-76],[x0+152,gy-54],[x0+108,gy-54]];s.push(poly(w1));s.push(poly(w2));H(s,w1,1.8,50);H(s,w2,1.8,50);
  var sg=RP(x0+96,gy-90,x0+118,gy-80);FS(s,sol,sg,1.2,0);
  var cy0=gy-44,ch=7,tp=[],bt=[];for(var x=x0+4,k=0;x+ch<x0+L-4;x+=ch,k++){var yt=k%2?cy0+ch:cy0;tp.push([x,yt],[x+ch,yt]);bt.push([x,yt+ch],[x+ch,yt+ch]);}s.push([[x0,cy0],[x0+L,cy0]]);s.push([[x0,cy0+ch*2],[x0+L,cy0+ch*2]]);var CB=tp.concat(bt.reverse());s.push(poly(CB));H(s,CB,1.2,90);
  s.push([[x0+60,gy-54],[x0+60,gy-wr-2]]);s.push([[x0+106,gy-54],[x0+106,gy-wr-2]]);s.push([[x0+52,gy-28],[x0+58,gy-28]]);s.push([[x0+98,gy-28],[x0+104,gy-28]]);
  [[x0+40,gy-wr],[x0+L-40,gy-wr]].forEach(function(c){s.push([[c[0]-wr-6,gy-wr-2]].concat(arc(c[0],gy-wr,wr+5,wr+5,PI,TAU)).concat([[c[0]+wr+6,gy-wr-2]]));tyre(s,sol,c[0],c[1],wr,1.4);s.push(circle(c[0],c[1],wr*0.45));});
  s.push(circle(x0+L-4,gy-40,3));s.push(rect(x0-3,gy-wr-6,x0+6,gy-wr));s.push(rect(x0+L-6,gy-wr-6,x0+L+3,gy-wr));
  facade(s,R,gy-6,sol);cobbles(s,R,gy,sol);return sky(s,R,gy-8,sol);});

S('Ivy on a brick wall',['Ivy Takes the Wall','Green Over Red','Shuttered and Climbed','Old House, New Leaves','Slow Green Climb'],function(R){
  var s=[],sol=[],holes=[],fy=RR(R,182,188),wx=RR(R,110,170),wy=RR(R,46,60),ww=RR(R,44,52),wh=RR(R,58,66);
  var W=RP(wx,wy,wx+ww,wy+wh);holes.push(RP(wx-ww*0.5-2,wy-4,wx+ww*1.5+2,wy+wh+8));s.push(poly(W));s.push([[wx+ww/2,wy],[wx+ww/2,wy+wh]]);s.push([[wx,wy+wh/2],[wx+ww,wy+wh/2]]);H(s,RP(wx,wy,wx+ww/2,wy+wh/2),1.8,0);H(s,RP(wx+ww/2,wy+wh/2,wx+ww,wy+wh),1.8,0);
  [-1,1].forEach(function(d){var sx=d<0?wx-ww*0.5:wx+ww;var P=RP(sx,wy,sx+ww*0.5,wy+wh);s.push(poly(P));s.push(zz(sx+3,sx+ww*0.5-3,wy+3,wy+wh-3,4));});
  s.push(rect(wx-ww*0.5-2,wy+wh,wx+ww*1.5+2,wy+wh+6));
  var stems=[],n=RI(R,2,3);for(var i=0;i<n;i++){var x0=RR(R,10,290),pts=[[x0,fy]];for(var k=1;k<8;k++)pts.push([pts[k-1][0]+RR(R,-16,16),fy-k*RR(R,18,24)]);stems.push(curve(pts,5));}
  var lv=[];stems.forEach(function(c){for(var j=3;j<c.length;j+=RI(R,6,8)){var p=c[j];if(p[1]<6)break;var side=j%2?1:-1,lc=[p[0]+side*7,p[1]-3],L=leafStar(lc[0],lc[1],RR(R,7,9),-PI/2+RR(R,-0.4,0.4));L=blob(L,3);lv.push({c:lc,P:L,p:p});}});
  lv.forEach(function(o,qi){holes.push(o.P);});
  stems.forEach(function(c){var cut=[];behind(cut,[c],lv.map(function(o){return o.P;}));A(s,cut);});
  lv.forEach(function(o,qi){s.push(poly(o.P));s.push([o.p,o.c]);if(qi%2)H(s,o.P,1.3,RR(R,30,80));});
  var wall=[];clipIn(wall,[brickS(4,4,296,fy,RR(R,15,18),RR(R,6.5,7.5))],RP(4,4,296,fy),holes);A(s,wall);
  s.push([[4,fy],[296,fy]]);s.push(rows(4,296,fy+4,196,4));return s;});

// ---- batch 12 chunk B: animals, instruments, tools ----
function shadeLow(s,P,yc,g,a){var c=P.filter(function(p){return p[1]>=yc;});if(c.length>2)H(s,c,g,a);return s;}
var DACH=[[-52,-20],[-50,-30],[-40,-34],[0,-35],[26,-34],[34,-38],[38,-48],[46,-52],[54,-50],[58,-44],[70,-40],[72,-36],[66,-33],[54,-32],[44,-30],[40,-22],[38,-14],[38,0],[32,0],[30,-12],[24,-14],[22,0],[16,0],[16,-14],[-30,-14],[-32,0],[-38,0],[-38,-12],[-42,-14],[-42,0],[-48,0],[-48,-12]];
S('Dachshund',['Long Dog, Short Legs','Waiting by the Ball','Sausage on Patrol','Low Rider','Ears Like Flaps'],function(R){
  var s=[],sol=[],fy=RR(R,128,138),b=RR(R,172,178),x=RR(R,130,160),sc=RR(R,1.3,1.45),fx=sgn(R);
  var P=M(DACH,x,b,sc,fx);SOL(s,sol,P);clipIn(s,[rows(4,296,b-23*sc,b-14*sc,1.8)],P);
  var ear=M(blob([[42,-48],[48,-46],[48,-36],[44,-30],[40,-36]],4),x,b,sc,fx);FS(s,sol,ear,1.2,90);
  s.push(circle(x+fx*52*sc,b-45*sc,1.4));s.push(circle(x+fx*71*sc,b-38*sc,1.4));s.push(M([[60,-36],[66,-35]],x,b,sc,fx));
  s.push(curve(M([[-50,-28],[-58,-32],[-66,-42],[-68,-48]],x,b,sc,fx),5));
  var col=M([[36,-40],[40,-30]],x,b,sc,fx);s.push(col);s.push(circle(col[1][0],col[1][1]+3,2));
  var bx=x-fx*RR(R,90,110),br=RR(R,9,11);bx=Math.max(18,Math.min(282,bx));var ball=EP(bx,b-br,br,br);SOL(s,sol,ball);s.push(poly(ball));s.push(arc(bx-br*0.9,b-br,br*0.6,br,-PI/2,PI/2));s.push(arc(bx+br*0.9,b-br,br*0.6,br,PI/2,1.5*PI));
  var rug=EP(x,b+2,RR(R,90,100),10);s.push(poly(rug));sol.push(rug);s.push(poly(EP(x,b+2,82,7)));
  room(s,R,fy,sol);return s;});

S('Meerkats on lookout',['Sentry Duty','Three on the Mound','All Eyes East','Morning Watch','Standing Tall in the Sun'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,166,172),mx=RR(R,120,180),mw=RR(R,70,80),mh=RR(R,22,28);
  var mound=blob([[mx-mw,gy],[mx-mw*0.6,gy-mh*0.8],[mx,gy-mh],[mx+mw*0.6,gy-mh*0.8],[mx+mw,gy]],8);FS(s,sol,mound);H(s,mound,RR(R,3,3.6),RR(R,15,30));
  var hole=archP(mx+RR(R,-30,30),gy,9,2);FS(s,sol,hole,1.1,0);
  var MK=[[0,-60],[5,-58],[8,-56],[13,-53],[8,-50],[5,-48],[8,-40],[10,-20],[9,-6],[12,0],[-12,0],[-9,-6],[-10,-20],[-8,-40],[-5,-48],[-7,-52],[-5,-58]];
  var n=3,xs=[mx-RR(R,34,40),mx+RR(R,-4,4),mx+RR(R,34,40)];
  xs.forEach(function(kx,i){var sc=RR(R,0.95,1.15)*(i===1?1.15:1),f=i===0?-1:1,kb=interpY(mound.slice(0,mound.length/2+8),kx)+3;kb=Math.min(gy,kb+2);
    var P=M(MK,kx,kb,sc,f);SOL(s,sol,P);H(s,M([[-8,-40],[-2,-44],[-2,-6],[-9,-6],[-10,-20]],kx,kb,sc,f),1.6,80);
    var ep=EP(kx+f*3*sc,kb-55*sc,2.4*sc,1.7*sc);FS(s,sol,ep,0.7,0);s.push(M([[2,-38],[6,-34],[3,-30]],kx,kb,sc,f));s.push(M([[-1,-37],[3,-33],[0,-29]],kx,kb,sc,f));
    s.push(curve(M([[-9,-4],[-16,-1],[-24,0],[-30,-2]],kx,kb,sc,f),5));s.push(M([[-2,-59],[-4,-61],[-6,-58]],kx,kb,sc,f));});
  var tx=mx<150?RR(R,220,270):RR(R,30,80),acacia=blob([[tx-40,gy-60],[tx-20,gy-70],[tx+20,gy-72],[tx+42,gy-62],[tx+20,gy-56],[tx-20,gy-56]],6);bg.push(poly(acacia));H(bg,acacia,2,RR(R,0,10));bg.push([[tx,gy],[tx-2,gy-30],[tx-14,gy-56]]);bg.push([[tx-2,gy-30],[tx+12,gy-56]]);bg.push([[tx+2,gy],[tx+2,gy-28]]);
  bg.push(tufts(4,296,gy,6,R));gnd(bg,R,gy);hills(bg,R,gy,RR(R,10,18),5);return fin(s,R,bg,sol,gy-2);});

S('Axolotl',['Smiling in the Shallows','Feathered Gills','Lake Dweller','Pink and Patient','Water Dragon, Small'],function(R){
  var s=[],sol=[],cx=RR(R,125,165),cy=RR(R,112,122),f=sgn(R),L=RR(R,104,114);
  var hx=cx+f*L*0.48,head=blob([[hx-f*14,cy-14],[hx+f*4,cy-20],[hx+f*20,cy-15],[hx+f*27,cy-2],[hx+f*22,cy+12],[hx+f*2,cy+16],[hx-f*14,cy+12]],6);
  var body=blob([[hx-f*10,cy-11],[cx-f*L*0.1,cy-12],[cx-f*L*0.45,cy-8],[cx-f*L*0.62,cy-2],[cx-f*L*0.5,cy+8],[cx-f*L*0.1,cy+12],[hx-f*10,cy+11]],6);
  var tail=blob([[cx-f*L*0.45,cy-10],[cx-f*L*0.6,cy-16],[cx-f*L*0.85,cy-10],[cx-f*L*1.02,cy-1],[cx-f*L*0.85,cy+6],[cx-f*L*0.6,cy+8],[cx-f*L*0.5,cy+6]],6);
  FS(s,sol,head);var bh=[];FS(bh,sol,body);behind(s,bh,[head]);var th=[];FS(th,sol,tail);behind(s,th,[head,body]);
  var gb=[hx-f*8,cy-6];[[-1,-0.95],[-1,-0.5],[-1,-0.05],[1,0.05],[1,0.5],[1,0.95]].forEach(function(g,i){var a=(f>0?PI:0)+g[1]*f*-1*1.2,len=RR(R,18,24),base=[gb[0],gb[1]+g[0]*7+g[1]*3],tip=[base[0]+len*Math.cos(a)*0.9,base[1]+len*Math.sin(a)-6*(g[1]<0.6&&g[1]>-0.6?0:1)*Math.sign(g[1])];
    var c=lens(base,tip,3.2);SOL(s,sol,c);s.push(poly(c));var ln=[base];for(var q=1;q<7;q++){var p=lerp(base,tip,q/7);ln.push(p,[p[0]+3.5*Math.cos(a+1.6),p[1]+3.5*Math.sin(a+1.6)],p,[p[0]+3.5*Math.cos(a-1.6),p[1]+3.5*Math.sin(a-1.6)],p);}s.push(ln);});
  s.push(circle(hx+f*12,cy-6,2.4));H(s,EP(hx+f*12,cy-6,1.4,1.4),0.7,0);s.push(quad([hx+f*8,cy+5],[hx+f*16,cy+10],[hx+f*24,cy+4],8));
  [[hx-f*14,cy+10],[cx-f*L*0.38,cy+7]].forEach(function(o){var leg=[o,[o[0]+f*4,o[1]+12],[o[0]+f*9,o[1]+15]];s.push(leg);for(var t=0;t<4;t++)s.push([[o[0]+f*9,o[1]+15],[o[0]+f*(11+t*1.5),o[1]+12+t*2]]);});
  clipIn(s,[rows(cx-L,cx+L,cy+4,cy+14,1.8)],body);var fr=[];for(var k=0;k<14;k++){var x=cx-f*L*(0.5+k*0.035);fr.push([x,cy-10-Math.sin(k/13*PI)*5],[x-f*1.5,cy-8]);}s.push(fr);
  for(var sp=0;sp<RI(R,6,9);sp++){var px=cx+RR(R,-L*0.5,L*0.3),py=cy+RR(R,-7,2);s.push(circle(px,py,0.9));}
  var bed=[];var bd=seabed(bed,R,RR(R,166,174),RI(R,3,5));var pb=[];for(var g=0;g<RI(R,12,16);g++){var gx=RR(R,8,292),gy2=interpY(bd,gx);pb.push(EP(gx,gy2+4,RR(R,2.5,4),2));}
  var w=[];for(var y=8;y<160;y+=RR(R,6.5,8))w.push(wave(4,296,y,1,RR(R,24,40),R()*6));bed.push(serp(w));behind(s,bed,sol.concat(pb));pb.forEach(function(P){s.push(poly(P));});return s;});

S('Tree frog on a leaf',['Sticky Toes','Red Eyes, Green Night','Holding On','Rainforest Perch','Big-Eyed Climber'],function(R){
  var s=[],sol=[],f=sgn(R),lp0=[RR(R,10,30),RR(R,180,190)],lp1=[RR(R,270,290),RR(R,120,140)];if(f<0){lp0[0]=300-lp0[0];lp1[0]=300-lp1[0];}
  var leaf=lens(lp0,lp1,RR(R,40,46));SOL(s,sol,leaf);var fx=RR(R,130,170),fb=interpY([lp0,lp1],fx)-4,w=RR(R,30,34);
  var body=blob([[fx-w,fb],[fx-w*0.9,fb-20],[fx-w*0.55,fb-36],[fx,fb-40],[fx+w*0.55,fb-36],[fx+w*0.9,fb-20],[fx+w,fb]],6);FS(s,sol,body);
  [-1,1].forEach(function(d){var ex=fx+d*w*0.55,ey=fb-40,E=EP(ex,ey,10,10);FS(s,sol,E);s.push(poly(EP(ex,ey,6.5,6.5)));FS(s,sol,EP(ex,ey,1.8,5.4),0.6,90);
    var th=[[fx+d*w*0.95,fb-8],[fx+d*(w+16),fb-30],[fx+d*(w+26),fb-6],[fx+d*w*0.6,fb]];FS(s,sol,blob(th,5));
    var arm=[[fx+d*w*0.35,fb-12],[fx+d*w*0.5,fb+2],[fx+d*w*0.35,fb+10]];s.push(arm);[-1,0,1].forEach(function(k){var tp=[fx+d*w*0.35+k*5,fb+16];s.push([arm[2],tp]);s.push(circle(tp[0],tp[1]+1.8,1.8));});
    var ft=[fx+d*(w+24),fb+4];[-1,0,1].forEach(function(k){var tp=[ft[0]+d*6,ft[1]+k*5];s.push([[fx+d*(w+20),fb-4],tp]);s.push(circle(tp[0]+d*1.8,tp[1],1.8));});});
  s.push(quad([fx-w*0.7,fb-20],[fx,fb-12],[fx+w*0.7,fb-20],12));s.push(circle(fx-4,fb-28,0.8));s.push(circle(fx+4,fb-28,0.8));
  H(s,[[fx+w*0.2,fb-36],[fx+w*0.55,fb-36],[fx+w*0.9,fb-20],[fx+w,fb],[fx+w*0.5,fb]],1.6,RR(R,60,80));
  s.push(poly(leaf));var vv=[lp0,lp1];for(var v=1;v<9;v++){var p=lerp(lp0,lp1,v/9),q=lerp(lp0,lp1,v/9+0.1),dx=(lp1[1]-lp0[1])*0.14,dy=(lp1[0]-lp0[0])*0.14;vv.push([p,[q[0]-dx,q[1]+dy]]);vv.push([p,[q[0]+dx,q[1]-dy]]);}behind(s,vv,sol.slice(1));
  var lh=[];H(lh,leaf.slice(Math.floor(leaf.length/2)).concat([lp1]),2.4,RR(R,40,60));behind(s,lh,sol.slice(1));
  var bg=[];for(var k2=0;k2<RI(R,3,4);k2++){var a=[RR(R,10,290),RR(R,6,50)],b=[a[0]+RR(R,-70,70),a[1]+RR(R,40,70)];var L2=lens(a,b,RR(R,14,20));bg.push(poly(L2));bg.push([a,b]);}
  H(bg,RP(4,4,296,196),RR(R,4,4.8),RR(R,-60,-30));behind(s,bg,sol);return s;});

S('Mole at its hill',['Up for Air','Velvet Digger','Molehill Morning','Spade Hands','Breaking Ground'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,164,170),mx=RR(R,110,190),mw=RR(R,70,80),mh=RR(R,40,46),f=sgn(R);
  var hill=blob([[mx-mw,gy],[mx-mw*0.7,gy-mh*0.6],[mx-mw*0.2,gy-mh],[mx+mw*0.3,gy-mh*0.95],[mx+mw*0.75,gy-mh*0.5],[mx+mw,gy]],8);SOL(s,sol,hill);s.push(poly(hill));
  var cr=[];for(var k=0;k<RI(R,14,18);k++){var a=RR(R,0.15,0.85)*PI,rr=RR(R,0.3,0.9),cx=mx+mw*rr*Math.cos(PI+a)*-1,cy=gy-mh*rr*Math.sin(a)*0.9;cr.push(EP(cx,cy,RR(R,2,3.5),RR(R,1.6,2.6)));}cr.forEach(function(P){s.push(poly(P));});
  var hb=[];H(hb,hill,RR(R,3.4,4.2),RR(R,20,40));behind(s,hb,cr);
  var top=[mx+f*6,gy-mh+4],MS=1.6,body0=blob([[top[0]-f*20,top[1]+8],[top[0]-f*18,top[1]-10],[top[0],top[1]-20],[top[0]+f*16,top[1]-16],[top[0]+f*24,top[1]-8],[top[0]+f*22,top[1]+8]],6),body=scaleAbout(body0,top[0],top[1],MS);
  FS(s,sol,body,1.1,RR(R,30,60));var sn=scaleAbout([[top[0]+f*22,top[1]-10],[top[0]+f*34,top[1]-6],[top[0]+f*22,top[1]-2]],top[0],top[1],MS);SOL(s,sol,sn);s.push(poly(sn));
  [[top[0]+f*8,top[1]+8],[top[0]+f*30,top[1]+6]].forEach(function(p){var paw=scaleAbout(blob([[p[0]-6,p[1]],[p[0],p[1]-4],[p[0]+7,p[1]-1],[p[0]+5,p[1]+5],[p[0]-4,p[1]+5]],4),p[0],p[1],1.5);SOL(s,sol,paw);s.push(poly(paw));for(var c=0;c<4;c++)s.push([[p[0]-6+c*4,p[1]+6],[p[0]-6+c*4+f*1,p[1]+11]]);});
  var fn=[],fx0=RR(R,4,30);for(var x=fx0;x<296;x+=RR(R,24,30)){fn.push(RP(x,gy-46,x+5,gy));fn.push([[x+2.5,gy-50],[x,gy-46],[x+5,gy-46],[x+2.5,gy-50]]);}A(bg,fn.map(function(P){return P.length===4?poly(P):P;}));bg.push([[4,gy-36],[296,gy-36]]);bg.push([[4,gy-16],[296,gy-16]]);
  bg.push(tufts(4,296,gy,5,R));gnd(bg,R,gy);return fin(s,R,bg,sol,gy-2);});

S('Tapir',['Saddle of White','Nose Like a Question','Dusk at the River','Rainforest Wanderer','Quiet Browser'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,166,172),x=RR(R,135,165),sc=RR(R,1.4,1.55),f=sgn(R);
  var body=M(blob([[-48,-28],[-42,-48],[-14,-56],[18,-52],[34,-44],[36,-26],[22,-16],[-30,-16],[-46,-18]],6),x,gy,sc,f);
  var head=M(blob([[26,-48],[42,-46],[54,-38],[62,-28],[66,-16],[60,-15],[54,-24],[40,-24],[28,-28]],6),x,gy,sc,f);
  var legs=[];[-38,-26,14,26].forEach(function(lx){legs.push(M(RP(lx-4,-20,lx+4,0),x,gy,sc,f));});
  legs.forEach(function(P,i){FS(s,sol,P,i%2?1.4:0,90);});var hb=[];FS(hb,sol,body);behind(s,hb,legs);FS(s,sol,head);
  var dk=[];H(dk,M(RP(-50,-60,-16,-14),x,gy,sc,f),1.5,80);H(dk,M(RP(14,-60,40,-14),x,gy,sc,f),1.5,80);clipIn(s,dk,body,[head]);H(s,head,1.6,70);
  var er=M(EP(34,-50,3,5),x,gy,sc,f);FS(s,sol,er);s.push(circle(x+f*46*sc,gy-38*sc,1.4));
  s.push([[4,gy+4],[296,gy+4]]);var rv=[waterS(R,4,296,gy+9,196,RR(R,7,8),1)];behind(s,rv,sol);
  for(var t=0;t<2;t++){var tx=t?RR(R,240,285):RR(R,15,60);bg.push(RP(tx-6,4,tx+6,gy));H(bg,RP(tx-6,4,tx+6,gy),2,90);}
  treeR(bg,R,R()<0.5?RR(R,30,70):RR(R,230,270),gy,RR(R,16,20),3);
  gnd(bg,R,gy,4.5,0);return fin(s,R,bg,sol,gy-1);});

S('Anteater',['Long Snout, Long Walk','Termite Country','Plume of a Tail','Striped Shoulder','Savanna Forager'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,166,172),x=RR(R,140,165),sc=RR(R,1.05,1.15),f=sgn(R);
  var AT=[[-40,-30],[-30,-44],[-8,-48],[14,-46],[28,-40],[38,-36],[56,-30],[76,-24],[78,-22],[56,-24],[38,-22],[30,-18],[30,0],[24,0],[22,-12],[14,-14],[14,0],[8,0],[8,-14],[-20,-16],[-22,0],[-28,0],[-30,-14],[-32,-16],[-32,0],[-38,0],[-40,-14]];
  var P=M(AT,x,gy,sc,f);SOL(s,sol,P);
  var tail=M(blob([[-38,-40],[-54,-52],[-74,-54],[-90,-44],[-80,-34],[-62,-26],[-46,-24],[-40,-28]],6),x,gy,sc,f);SOL(s,sol,tail);s.push(poly(tail));H(s,tail,1.6,RR(R,60,75));
  var tf=[];for(var k=0;k<12;k++){var t=k/11,a=M([[-40-t*44,-30-Math.sin(t*PI)*24]],x,gy,sc,f)[0],b=M([[-50-t*40,-22-Math.sin(t*PI)*30-12]],x,gy,sc,f)[0];tf.push(k%2?[a,b]:[b,a]);}var tfs=[];tf.forEach(function(q){A(tfs,q);});clipIn(s,[tfs],tail);
  var str=M([[30,-41],[16,-28],[-8,-20],[-6,-26],[14,-34],[26,-44]],x,gy,sc,f);FS(s,sol,str,1,0);s.push(M([[33,-38],[18,-24],[-8,-16]],x,gy,sc,f));
  s.push(circle(x+f*48*sc,gy-30*sc,1.2));H(s,M([[-20,-16],[8,-14],[8,0],[14,0],[14,-14],[22,-12],[24,0],[30,0],[30,-18],[-8,-22]],x,gy,sc,f),1.6,90);
  [[24,0],[8,0]].forEach(function(o){var p=M([[o[0]+4,0]],x,gy,sc,f)[0];s.push([[p[0],p[1]-1],[p[0]+f*4,p[1]-4]]);});
  var mx=x-f*RR(R,95,115);mx=Math.max(26,Math.min(274,mx));var mnd=[[mx-24,gy],[mx-18,gy-40],[mx-10,gy-72],[mx-4,gy-90],[mx+4,gy-84],[mx+10,gy-56],[mx+16,gy-46],[mx+20,gy-20],[mx+26,gy]];var MN=curve(mnd,5);bg.push(MN);H(bg,MN,RR(R,2.4,3),RR(R,60,80));
  bg.push(tufts(4,296,gy,6,R));gnd(bg,R,gy);hills(bg,R,gy-4,RR(R,10,18),5);return fin(s,R,bg,sol,gy-5);});

S('Cuttlefish',['Zebra Skin','Hovering on Its Fin','Colour Shifter','Eight Arms Folded','Over the Seagrass'],function(R){
  var s=[],sol=[],cx=RR(R,135,165),cy=RR(R,90,104),f=sgn(R),L=RR(R,64,72),hh=RR(R,26,30);
  var man=blob([[cx-f*L,cy],[cx-f*L*0.7,cy-hh],[cx,cy-hh*1.05],[cx+f*L*0.6,cy-hh*0.85],[cx+f*L*0.8,cy-hh*0.2],[cx+f*L*0.8,cy+hh*0.3],[cx+f*L*0.6,cy+hh*0.9],[cx,cy+hh],[cx-f*L*0.7,cy+hh*0.85]],8);
  var fr=[],fr2=[];man.forEach(function(p,i){var t=Math.atan2(p[1]-cy,p[0]-cx);fr.push([cx+(p[0]-cx)*1.12+Math.sin(i*1.3)*1.2,cy+(p[1]-cy)*1.16+Math.cos(i*1.3)*1.2]);});
  var fin=fr.filter(function(p){return f>0?p[0]<cx+L*0.75:p[0]>cx-L*0.75;});SOL(s,sol,fin);s.push(fin);
  FS(s,sol,man);var zb=[];for(var k=0;k<RI(R,9,12);k++){var xx=cx-f*L*0.9+f*k*L*0.16;zb.push(wave(xx-12,xx+12,cy,2,24,k).map(function(p){return [p[0]+(p[1]-cy),p[1]];}));}
  var zz2=[];for(var j=0;j<14;j++){var xs=cx-f*L+f*j*L*0.13;zz2.push(curve([[xs,cy-hh*1.1],[xs+f*4,cy-hh*0.3],[xs-f*3,cy+hh*0.4],[xs+f*2,cy+hh*1.1]],5));}var zs=[];zz2.forEach(function(c,i){A(zs,i%2?c.slice().reverse():c);});
  clipIn(s,[zs],man);
  var hx=cx+f*L*0.85,head=blob([[hx-f*4,cy-hh*0.6],[hx+f*14,cy-hh*0.5],[hx+f*20,cy],[hx+f*14,cy+hh*0.5],[hx-f*4,cy+hh*0.6]],5);FS(s,sol,head);
  var eye=EP(hx+f*8,cy-hh*0.22,5,4);s.push(poly(eye));s.push([[hx+f*4,cy-hh*0.2],[hx+f*6,cy-hh*0.3],[hx+f*8,cy-hh*0.18],[hx+f*10,cy-hh*0.3],[hx+f*12,cy-hh*0.2]]);
  var arms=[];for(var a=0;a<5;a++){var y0=cy-hh*0.3+a*hh*0.15,tip=[hx+f*RR(R,40,52),y0+RR(R,-8,8)+(a-2)*3];arms.push(curve([[hx+f*18,y0],[hx+f*30,y0+(a-2)*2],tip],6));}var ar=[];arms.forEach(function(c,i){A(ar,c);A(ar,c.slice().reverse());});s.push(ar);
  var bed=[];var bd=seabed(bed,R,RR(R,166,174),0);for(var g=0;g<RI(R,8,12);g++){var gx=RR(R,8,292),gb=interpY(bd,gx),h=RR(R,30,60),sw=RR(R,-10,10);bed.push(quad([gx,gb],[gx+sw*0.3,gb-h*0.6],[gx+sw,gb-h],8));bed.push(quad([gx+2,gb],[gx+2+sw*0.6,gb-h*0.5],[gx+sw*1.4,gb-h*0.8],8));}
  var w=[];for(var y=8;y<156;y+=RR(R,5.5,7))w.push(wave(4,296,y,1,RR(R,24,40),R()*6));bed.push(serp(w));behind(s,bed,sol);return s;});

S('Goldfinch on a teasel',['Seed Picker','Gold Bar on the Wing','Winter Teasels','Thistle Head Breakfast','Red Mask, Black Cap'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,176,182),hx=RR(R,130,170),hy=RR(R,74,86);
  function teasel(x,y,sz,keep){var hd=EP(x,y,sz*0.55,sz);var sp=spiky(x,y,sz*0.55,3,18,R);if(keep)SOL(s,sol,hd);s.push(poly(hd));HX(s,[hd],1.8,45);HX(s,[hd],1.8,-45);
    var br=[];for(var k=0;k<5;k++){var a=PI/2+(k-2)*0.45;br.push([[x+sz*0.5*Math.cos(a),y+sz*0.85],[x+sz*1.6*Math.cos(a)*1.2,y+sz+sz*1.1*Math.sin(a)*0.6-4]]);}A(s,br);s.push(quad([x,y+sz],[x+RR(R,-4,4),(y+gy)/2],[x+RR(R,-10,10),gy],10));}
  teasel(hx,hy,RR(R,15,18),true);for(var t=0;t<RI(R,2,3);t++){var tx=hx+(t%2?1:-1)*RR(R,50,100),ty=RR(R,80,120);if(tx>20&&tx<280)teasel(tx,ty,RR(R,11,14),true);}
  var f=sgn(R),bx=hx-f*4,by=hy-18,G0=s.length,SB=sol.length,B=blob([[bx-f*16,by+6],[bx-f*12,by-8],[bx,by-12],[bx+f*10,by-16],[bx+f*16,by-12],[bx+f*14,by-4],[bx+f*8,by+6],[bx-f*4,by+10]],5);FS(s,sol,B);
  var mask=blob([[bx+f*10,by-17],[bx+f*16,by-13],[bx+f*15,by-8],[bx+f*9,by-9]],3);FS(s,sol,mask,0.9,0);var cap=blob([[bx+f*4,by-15],[bx+f*9,by-18],[bx+f*9,by-13],[bx+f*5,by-11]],3);FS(s,sol,cap,0.7,90);
  s.push([[bx+f*16,by-12],[bx+f*22,by-10],[bx+f*15,by-8]]);s.push(circle(bx+f*11,by-13,0.8));
  var wing=blob([[bx-f*2,by-8],[bx-f*16,by-2],[bx-f*26,by+6],[bx-f*12,by+4],[bx,by+2]],4);s.push(poly(wing));H(s,wing.slice(0,Math.floor(wing.length*0.5)),1,30);s.push([[bx-f*6,by-2],[bx-f*16,by+2]]);
  s.push([[bx-f*16,by+6],[bx-f*28,by+12],[bx-f*24,by+5]]);s.push([[bx,by+8],[hx-2,hy-14]]);s.push([[bx+f*4,by+8],[hx+3,hy-14]]);
  var GB=sol.length;for(var gi=G0;gi<s.length;gi++)s[gi]=scaleAbout(s[gi],hx,hy-14,1.8);for(var gj=SB;gj<sol.length;gj++)sol[gj]=scaleAbout(sol[gj],hx,hy-14,1.8);
  bg.push(tufts(4,296,gy,8,R));gnd(bg,R,gy);hills(bg,R,gy,RR(R,16,24),5);return fin(s,R,bg,sol,gy-1);});

S('Didgeridoo',['Low Drone at Dusk','Hollow Eucalyptus','Red Earth Song','Circular Breath','Leaning on the Rock'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,170,176),f=sgn(R),Ln=RR(R,150,166),bx=150+f*RR(R,30,50),ang=-f*RR(R,1.0,1.15);
  var loc=[],lsol=[],w0=9,w1=5.5;function wd(x){return w0+(w1-w0)*x/Ln;}
  var outline=[[0,-w0],[Ln,-w1],[Ln,w1],[0,w0]];FS(loc,lsol,outline);loc.push(ellipse(Ln,0,2.5,w1));
  var cuts=[0,10,18,52,60,92,100,132,140,Ln];for(var c=1;c<cuts.length-1;c++){var x=cuts[c];loc.push([[x,-wd(x)],[x,wd(x)]]);}
  [[18,52,45],[60,92,-45],[100,132,0],[140,Ln-4,90]].forEach(function(r){var P=[[r[0],-wd(r[0])],[r[1],-wd(r[1])],[r[1],wd(r[1])],[r[0],wd(r[0])]];if(r[2]===0){var z=[];for(var x=r[0]+3;x<r[1];x+=4)z.push([x,-wd(x)+1],[x+2,wd(x)-1]);z.push([r[1],0]);loc.push(z);}else H(loc,P,1.7,r[2]);});
  H(loc,[[0,-w0],[10,-wd(10)],[10,wd(10)],[0,w0]],1.1,90);
  function tr(st){return st.map(function(p){var c=Math.cos(ang),sn=Math.sin(ang);return [bx+p[0]*c-p[1]*sn,gy-3+p[0]*sn+p[1]*c];});}
  loc.forEach(function(st){s.push(tr(st));});lsol.forEach(function(P){sol.push(tr(P));});
  var top=tr([[Ln,0]])[0],rx=top[0]-f*RR(R,20,36),rock=blob([[rx-60,gy],[rx-54,gy-40],[rx-20,gy-64],[rx+30,gy-60],[rx+60,gy-30],[rx+64,gy]],6);
  var rk=[];rk.push(poly(rock));H(rk,rock,RR(R,2.8,3.4),RR(R,20,40));behind(s,rk,sol);sol.push(rock);
  sunH(bg,rx<150?RR(R,220,270):RR(R,30,80),gy-30,RR(R,14,18));bg.push([[4,gy-30],[296,gy-30]]);
  for(var g=0;g<RI(R,5,8);g++){var gx=RR(R,8,292);bg.push(tufts(gx-8,gx+8,gy,RR(R,8,14),R));}
  gnd(bg,R,gy);return fin(s,R,bg,sol,gy-31);});

S('Kalimba',['Thumb Piano','Tines in a Row','Plucked Lullaby','Little Steel Keys','Box of Notes'],function(R){
  var s=[],sol=[],ty=RR(R,128,136),cx=RR(R,135,165),w=RR(R,68,76),h=RR(R,92,100),tilt=RR(R,-0.12,0.12);
  var top=[[cx-w,ty+18],[cx+w,ty+18],[cx+w*0.8,ty+18-h*0.55],[cx-w*0.8,ty+18-h*0.55]];
  var box=[[cx-w,ty+18],[cx+w,ty+18],[cx+w,ty+30],[cx-w,ty+30]];FS(s,sol,box,1.6,0);FS(s,sol,top);
  var hole=EP(cx,ty+18-h*0.18,9,5);s.push(poly(hole));HX(s,[hole],1,0);
  var by=ty+18-h*0.36;s.push([[cx-w*0.82,by],[cx+w*0.82,by]]);s.push([[cx-w*0.82,by+3],[cx+w*0.82,by+3]]);
  var n=RI(R,15,17),tn=[];for(var i=0;i<n;i++){var u=i/(n-1)-0.5,x=cx+u*w*1.5,len=10+Math.abs(u)*2*28;tn.push(RP(x-1.6,by+3-len,x+1.6,by+3+6));}
  var tns=[];tn.forEach(function(P,i){var a=i%2?[[P[0][0],P[2][1]],[P[0][0],P[0][1]],[P[1][0],P[0][1]],[P[1][0],P[2][1]]]:[[P[0][0],P[0][1]],[P[0][0],P[2][1]],[P[1][0],P[2][1]],[P[1][0],P[0][1]]];A(tns,a);});s.push(tns);
  s.push([[cx-w*0.82,by+9],[cx+w*0.82,by+9]]);
  var gr=[];H(gr,[[cx-w*0.8,ty+18-h*0.55],[cx+w*0.8,ty+18-h*0.55],[cx+w*0.86,ty+18-h*0.38],[cx-w*0.86,ty+18-h*0.38]],2.4,0);clipIn(s,gr,top,tn);
  var tk=[];tableS(tk,R,ty+30,'stripes');behind(s,tk,sol);return s;});

S('Djembe',['Goatskin and Rope','Heartbeat Drum','Village Rhythm','Laced Up Tight','Hands Ready'],function(R){
  var s=[],sol=[],fy=RR(R,134,142),cx=RR(R,130,170),b=RR(R,184,190),H1=RR(R,108,118),rt=RR(R,32,36),ry=rt*0.3,top=b-H1;
  var prof=function(t){return t<0.45?rt*(1-0.5*Math.pow(t/0.45,1.4))+0:t<0.6?rt*0.5:rt*(0.5+0.35*Math.pow((t-0.6)/0.4,1.2));};
  var L=[],Rr=[];for(var i=0;i<=20;i++){var t=i/20,y=top+H1*t,w=prof(t);L.push([cx-w,y]);Rr.push([cx+w,y]);}var body=L.concat(Rr.slice().reverse());FS(s,sol,body);
  s.push(ellipse(cx,top,rt,ry));s.push(arc(cx,top+8,rt+1,ry,0,PI));s.push(arc(cx,top+3,rt+1,ry,0,PI));
  var lace=[],nl=RI(R,14,18);for(var k=0;k<=nl;k++){var u=k/nl,a=PI*(0.05+0.9*u),xa=cx-rt*Math.cos(a),xb=cx-rt*0.58*Math.cos(a+PI/nl);lace.push([xa,top+9+ry*Math.sin(a)],[xb,top+H1*0.45+ry*0.5*Math.sin(a)]);}s.push(lace);
  var lw=[];H(lw,body.filter(function(p){return p[1]>top+H1*0.6;}).concat([]),2,0);
  var foot=[];for(var j=0;j<RI(R,5,7);j++){var y=top+H1*(0.66+j*0.05);var w2=prof((y-top)/H1);foot.push([[cx-w2,y],[cx+w2,y]]);}var fs=[];foot.forEach(function(q,i){A(fs,i%2?q.slice().reverse():q);});s.push(fs);
  var tri=[];for(var t2=0;t2<6;t2++){var x=cx-rt*0.6+t2*rt*0.24;tri.push([x,top+H1*0.9],[x+rt*0.12,top+H1*0.8],[x+rt*0.24,top+H1*0.9]);}s.push(tri);
  H(s,[[cx+rt*0.6,top+ry],[cx+rt,top+ry],[cx+rt*0.5,top+H1*0.45],[cx+rt*0.3,top+H1*0.45]],1.6,80);
  var mt=EP(cx,b+2,rt*1.4,6);s.push(poly(mt));sol.push(mt);room(s,R,fy,sol);return s;});

S('Zither',['Forty Strings','Parlour Music','Tuning Pins','Plucked and Strummed','Alpine Evenings'],function(R){
  var s=[],sol=[],ty=RR(R,150,158),x0=RR(R,30,44),x1=RR(R,256,270),yb=ty-6,yt=RR(R,36,46);
  var board=[[x0,yb],[x1,yb],[x1,yt+12],[x1-30,yt],[x0+60,yt],[x0,yt+30]];FS(s,sol,board);s.push(translate(board,0,6).slice(0,2));s.push([[x0,yb],[x0,yb+6]]);s.push([[x1,yb],[x1,yb+6]]);
  var hx=(x0+x1)/2+RR(R,10,30),hy=(yb+yt)/2+6;s.push(circle(hx,hy,13));s.push(spiral(hx,hy,13,15,1,0));HX(s,[EP(hx,hy,10,10)],1.4,0);
  var fb=[[x0+8,yb-6],[x0+90,yb-6],[x0+90,yb-26],[x0+8,yb-26]];s.push(poly(fb));for(var fr=0;fr<RI(R,10,13);fr++){var fx=x0+10+fr*80/12*Math.pow(1.04,fr);s.push([[fx,yb-26],[fx,yb-6]]);}
  var st=[],n=RI(R,22,26);for(var i=0;i<n;i++){var y=yb-4-i*(yb-yt-14)/n,xl=x0+6+Math.max(0,(yb-y-14))*0.6+(i<6?0:0),xr=x1-6-Math.max(0,(y-yt-12))*0+Math.max(0,(yt+28-y))*0.9;if(i%2)st.push([xl,y],[xr,y]);else st.push([xr,y],[xl,y]);}
  var sc=[];clipIn(sc,[st],board,[EP(hx,hy,13,13)]);A(s,sc);
  var pins=[];for(var p=0;p<n;p+=1){var y2=yb-4-p*(yb-yt-14)/n,px=x1-10-Math.max(0,(yt+28-y2))*0.9;pins.push([px,y2],[px+2,y2-2],[px,y2]);}s.push(pins);
  s.push([[x0+40,yb-2],[x0+40,yt+12]]);s.push([[x1-20,yb-2],[x1-20,yt+6]]);
  var pk=[[hx-40,yb+3],[hx-32,yb+2],[hx-34,yb+7]];s.push(poly(pk));
  onTable(s,R,ty,sol);return s;});

S('Spirit level and square',['Plumb, Level, Square','Bubble in the Middle','Measure Twice','The Carpenter’s Truth','True and Square'],function(R){
  var s=[],sol=[],ty=RR(R,116,124),f=sgn(R);
  var ly=ty+RR(R,30,40),lx0=RR(R,24,40),lx1=lx0+RR(R,190,210),lv=RP(lx0,ly-16,lx1,ly);FS(s,sol,lv);H(s,RP(lx0,ly-16,lx1,ly-12),1.3,0);
  var vials=[(lx0+lx1)/2,lx0+22,lx1-22];vials.forEach(function(vx,i){var w=RP(vx-10,ly-10,vx+10,ly-2);s.push(poly(w));H(s,w,1.6,90);var v=EP(vx+RR(R,-2,2),ly-6,7,2.6);s.push(poly(v));s.push([[vx-2.6,ly-10],[vx-2.6,ly-2]]);s.push([[vx+2.6,ly-10],[vx+2.6,ly-2]]);});
  H(s,RP(lx0,ly-12,lx0+8,ly),1.2,0);H(s,RP(lx1-8,ly-12,lx1,ly),1.2,0);
  var sx=150+f*RR(R,20,40),sy=ty+RR(R,60,68),L1=RR(R,110,130),L2=RR(R,64,74),bw=10;
  var sq=[[sx,sy],[sx+f*L1,sy],[sx+f*L1,sy-bw],[sx+f*bw,sy-bw],[sx+f*bw,sy-L2],[sx,sy-L2]];FS(s,sol,sq);
  var tk=[];for(var k=1;k<L1/3.5;k++){var x=sx+f*(bw+k*3.5);if(f*(x-(sx+f*L1))>-2)break;tk.push([x,sy-bw],[x,sy-bw+(k%4===0?6:3)],[x,sy-bw]);}s.push(tk);
  var tk2=[];for(var k2=1;k2<L2/3.5-3;k2++){var y=sy-bw-k2*3.5;tk2.push([sx+f*bw,y],[sx+f*(bw-(k2%4===0?6:3)),y],[sx+f*bw,y]);}s.push(tk2);
  var px=sx+f*RR(R,30,60),pencil=[[px,sy+14],[px+f*60,sy+8],[px+f*62,sy+11],[px+f*2,sy+17]];FS(s,sol,pencil,1,0);s.push([[px+f*62,sy+11],[px+f*70,sy+9],[px+f*60,sy+8]]);
  for(var c=0;c<RI(R,2,3);c++){var cx=RR(R,30,270),cy=ty+RR(R,10,20);var sh=spiral(cx,cy,1,7,1.6,R()*6);s.push(sh);}
  var pl=[];planks(4,ty,296,196,RR(R,9,12)).forEach(function(q,i){pl.push(i%2?q.slice().reverse():q);});var pls=[];pl.forEach(function(q){A(pls,q);});var grn=[];for(var g=0;g<RI(R,6,9);g++){var gx=RR(R,10,280),gy=ty+RR(R,4,70);grn.push(wave(gx,gx+RR(R,20,40),gy,1.2,12,0));}
  var bench=[pls].concat(grn);behind(s,bench,sol);
  var wall=[],G=RR(R,9,11);H(wall,RP(4,4,296,ty-4),G,0);H(wall,RP(4,4,296,ty-4),G,90);behind(s,wall,sol);s.push([[4,ty-4],[296,ty-4]]);s.push([[4,ty],[296,ty]]);return s;});

S('Wood lathe',['Turning a Spindle','Shavings Fly','Between Centres','The Spinning Blank','Chisel on the Rest'],function(R){
  var s=[],sol=[],fy=RR(R,160,166),x0=RR(R,36,50),x1=RR(R,250,262),by=RR(R,98,106);
  var bed=RP(x0,by,x1,by+12);FS(s,sol,bed,2,0);
  [x0+16,x1-16].forEach(function(lx){var lg=[[lx-14,fy],[lx-6,by+12],[lx+6,by+12],[lx+14,fy]];FS(s,sol,lg);s.push(rect(lx-16,fy-4,lx+16,fy));});
  var hs=RP(x0+4,by-46,x0+40,by);FS(s,sol,hs);H(s,RP(x0+4,by-46,x0+12,by),1.4,90);
  var pul=[x0+22,by-56];s.push(circle(pul[0],pul[1],10));s.push(circle(pul[0],pul[1],4));var mot=RP(x0+6,fy-30,x0+40,fy-10);FS(s,sol,mot,2,90);s.push([[pul[0]-9,pul[1]+3],[x0+14,fy-30]]);s.push([[pul[0]+9,pul[1]+3],[x0+32,fy-30]]);
  var ts=[[x1-44,by],[x1-40,by-36],[x1-12,by-36],[x1-8,by]];FS(s,sol,ts);s.push([[x1-8,by-26],[x1+6,by-26]]);s.push(circle(x1+8,by-26,4));for(var a=0;a<4;a++){var an=a*PI/2;s.push([[x1+8,by-26],[x1+8+9*Math.cos(an),by-26+9*Math.sin(an)]]);}
  var ay=by-26,sx0=x0+40,sx1=x1-44;s.push([[sx0,ay],[sx0+8,ay]]);s.push([[sx1-8,ay],[sx1,ay]]);
  var w=RR(R,11,13),sp=turned((sx0+sx1)/2,sx0+8,sx1-8,w);var SP=sp.map(function(p){return [p[1],ay+(p[0]-(sx0+sx1)/2)];});
  var prof=[],bot=[],n=40;for(var i=0;i<=n;i++){var t=i/n,x=sx0+8+t*(sx1-sx0-16),r=w*(0.7+0.3*Math.cos(t*TAU*RI(R,2,2)+R()*0.2))*(t<0.1||t>0.9?1:1);prof.push([x,ay-r]);bot.push([x,ay+r]);}
  var SPP=prof.concat(bot.reverse());FS(s,sol,SPP);H(s,prof.slice(0,0).concat(bot.slice(0,n+1)).concat([[sx0+8,ay]]).length?SPP.filter(function(p){return p[1]>=ay+2;}).concat([[sx0+8,ay+2]]):[],1.4,90);
  for(var b2=0;b2<4;b2++){var bx=sx0+20+b2*(sx1-sx0-40)/3;s.push([[bx,ay-w*0.9],[bx,ay+w*0.9]]);}
  var rest=[[(sx0+sx1)/2-40,ay+w+6],[(sx0+sx1)/2+40,ay+w+6]];s.push(rest);s.push([[(sx0+sx1)/2,ay+w+6],[(sx0+sx1)/2,by]]);
  var cxp=(sx0+sx1)/2+RR(R,-20,20),ch=[[cxp,ay+w+2],[cxp+30,ay+w+24],[cxp+34,ay+w+22],[cxp+2,ay+w-1]];FS(s,sol,ch);var hd=RP(cxp+28,ay+w+20,cxp+60,ay+w+30);
  var cu=[];for(var c=0;c<RI(R,6,9);c++){var px=cxp+RR(R,-30,30),py=ay-w-RR(R,4,24);cu.push(spiral(px,py,1,RR(R,3,6),1.5,R()*6));}A(s,cu);
  var sh=[];for(var q=0;q<RI(R,10,14);q++){var qx=RR(R,x0+50,x1-50),qy=fy-RR(R,0,4);sh.push(arc(qx,qy,RR(R,3,6),2,PI,TAU));}A(s,sh);
  room(s,R,fy,sol,'tiles');return s;});

S('Pickaxe and shovel',['Dig Here','Tools of the Trench','Leaning on the Shed','After the Ditch','Pick, Spade, Bucket'],function(R){
  var s=[],sol=[],gy=RR(R,166,172),wy=RR(R,20,30);
  var px=RR(R,80,110),pk=[[px,gy],[px+RR(R,26,34),wy+30]],dir=[pk[1][0]-pk[0][0],pk[1][1]-pk[0][1]],ln=Math.hypot(dir[0],dir[1]),u=[dir[0]/ln,dir[1]/ln],nrm=[-u[1],u[0]];
  var hdl=[[pk[0][0]-nrm[0]*3,pk[0][1]-nrm[1]*3],[pk[1][0]-nrm[0]*3,pk[1][1]-nrm[1]*3],[pk[1][0]+nrm[0]*3,pk[1][1]+nrm[1]*3],[pk[0][0]+nrm[0]*3,pk[0][1]+nrm[1]*3]];FS(s,sol,hdl,1.4,0);
  var hc=[pk[1][0]-u[0]*6,pk[1][1]-u[1]*6],hL=[hc[0]-nrm[0]*46,hc[1]-nrm[1]*46+10],hR=[hc[0]+nrm[0]*46,hc[1]+nrm[1]*46+12];
  var head=[hL].concat(quad(hL,[hc[0]-nrm[0]*20,hc[1]-nrm[1]*20-10],[hc[0],hc[1]-6],10).slice(1)).concat(quad([hc[0],hc[1]-6],[hc[0]+nrm[0]*20,hc[1]+nrm[1]*20-10],hR,10).slice(1)).concat([[hR[0]-u[0]*2,hR[1]+3]]).concat(quad([hc[0]+nrm[0]*30,hc[1]+nrm[1]*30],[hc[0],hc[1]+4],[hc[0]-nrm[0]*30,hc[1]-nrm[1]*30],10));
  FS(s,sol,head,1.2,RR(R,20,40));
  var sx=RR(R,170,200),sb=[sx+RR(R,10,16),gy-4],st=[sx-RR(R,6,12),wy+12];var dd=[st[0]-sb[0],st[1]-sb[1]],l2=Math.hypot(dd[0],dd[1]),v=[dd[0]/l2,dd[1]/l2],n2=[-v[1],v[0]];
  var bl0=sb,bl1=[sb[0]+v[0]*44,sb[1]+v[1]*44];var blade=[[bl1[0]-n2[0]*13,bl1[1]-n2[1]*13]].concat(quad([bl1[0]-n2[0]*15,bl1[1]-n2[1]*15],[bl0[0]-n2[0]*18,bl0[1]-n2[1]*18],[bl0[0]-v[0]*8,bl0[1]-v[1]*8],10)).concat(quad([bl0[0]-v[0]*8,bl0[1]-v[1]*8],[bl0[0]+n2[0]*18,bl0[1]+n2[1]*18],[bl1[0]+n2[0]*15,bl1[1]+n2[1]*15],10)).concat([[bl1[0]+n2[0]*13,bl1[1]+n2[1]*13]]);
  FS(s,sol,blade);H(s,blade.slice(0,12).concat([lerp(bl0,bl1,0.5)]),1.6,RR(R,60,80));var sh2=[[bl1[0]-n2[0]*3,bl1[1]-n2[1]*3],[st[0]-n2[0]*3,st[1]-n2[1]*3],[st[0]+n2[0]*3,st[1]+n2[1]*3],[bl1[0]+n2[0]*3,bl1[1]+n2[1]*3]];FS(s,sol,sh2,1.4,0);
  var dg=[[st[0]-n2[0]*8,st[1]-n2[1]*8],[st[0]+n2[0]*8,st[1]+n2[1]*8],[st[0]+n2[0]*6+v[0]*12,st[1]+n2[1]*6+v[1]*12],[st[0]-n2[0]*6+v[0]*12,st[1]-n2[1]*6+v[1]*12]];FS(s,sol,dg);
  var bk=RR(R,230,260);cyl(s,bk,gy,16,30,1.6,1);sol.push(RP(bk-16,gy-36,bk+16,gy+4));s.push(arc(bk,gy-30,16,22,PI,TAU));
  var pile=blob([[RR(R,8,20),gy],[30,gy-20],[52,gy-26],[70,gy-12],[78,gy]],6);FS(s,sol,pile);for(var r=0;r<RI(R,6,9);r++){var rx=RR(R,22,66),ry=gy-RR(R,4,16);s.push(poly(EP(rx,ry,RR(R,2,4),RR(R,1.5,2.5))));}H(s,pile,2.6,RR(R,20,40));
  var wall=[];planks(4,4,296,gy-6,RR(R,8,10),true).forEach(function(q,i){wall.push(i%2?q.slice().reverse():q);});var ws=[];wall.forEach(function(q){A(ws,q);});var kn=[];for(var k=0;k<RI(R,5,8);k++)kn.push(ellipse(RR(R,10,290),RR(R,10,gy-20),2,4));
  behind(s,[ws].concat(kn),sol);s.push([[4,gy-6],[296,gy-6]]);var gnd2=[];gnd(gnd2,R,gy);behind(s,gnd2,sol);return s;});

S('Tape measure',['Pulled Out to Fifty','Every Sixteenth','Hook on the Edge','Lock and Read','Measured Once'],function(R){
  var s=[],sol=[],ty=RR(R,110,118),cx=RR(R,62,80),cy=RR(R,128,140),r=RR(R,38,42),f=1;
  var cs=blob([[cx-r,cy-r*0.7],[cx-r*0.7,cy-r],[cx+r*0.6,cy-r],[cx+r,cy-r*0.6],[cx+r,cy+r],[cx-r,cy+r]],4);FS(s,sol,cs);
  var inn=blob([[cx-r*0.7,cy-r*0.5],[cx-r*0.5,cy-r*0.72],[cx+r*0.4,cy-r*0.72],[cx+r*0.72,cy-r*0.4],[cx+r*0.72,cy+r*0.72],[cx-r*0.7,cy+r*0.72]],4);s.push(poly(inn));HX(s,[cs,inn],1.6,45);
  s.push(circle(cx,cy,r*0.22));s.push(circle(cx,cy,r*0.08));var lk=RP(cx-6,cy-r-6,cx+12,cy-r);FS(s,sol,lk,1,0);
  var x0=cx+r,y0=cy+r-12,x1=RR(R,262,286),tp=RP(x0,y0,x1,y0+12);FS(s,sol,tp);
  var tk=[];for(var k=1;x0+k*2.6<x1-3;k++){var x=x0+k*2.6,h=k%8===0?10:k%4===0?7:k%2===0?5:3;tk.push([x,y0],[x,y0+h],[x,y0]);}s.push(tk);
  for(var n=8;x0+n*2.6<x1-8;n+=8){var nx=x0+n*2.6;s.push(rect(nx+1,y0+7,nx+4,y0+11));}
  var hk=[[x1,y0-4],[x1+4,y0-4],[x1+4,y0+14],[x1,y0+14]];FS(s,sol,hk,1,90);
  var pl=[];planks(4,ty,296,196,RR(R,11,14)).forEach(function(q,i){pl.push(i%2?q.slice().reverse():q);});var pls=[];pl.forEach(function(q){A(pls,q);});var grn=[];for(var g=0;g<RI(R,7,10);g++){var gx=RR(R,10,270),gy=ty+RR(R,6,76);grn.push(wave(gx,gx+RR(R,20,40),gy,1.2,12,0));}
  var pencil=[[RR(R,160,200),ty+70],[RR(R,250,270),ty+56]];var pd=[pencil[1][0]-pencil[0][0],pencil[1][1]-pencil[0][1]],pl2=Math.hypot(pd[0],pd[1]),pn=[-pd[1]/pl2*3,pd[0]/pl2*3];var PP=[[pencil[0][0]+pn[0],pencil[0][1]+pn[1]],[pencil[1][0]+pn[0],pencil[1][1]+pn[1]],[pencil[1][0]-pn[0],pencil[1][1]-pn[1]],[pencil[0][0]-pn[0],pencil[0][1]-pn[1]]];FS(s,sol,PP,1.2,0);s.push([PP[0],[pencil[0][0]-pd[0]/pl2*8,pencil[0][1]-pd[1]/pl2*8],PP[3]]);
  behind(s,[pls].concat(grn),sol);var wall=[];H(wall,RP(4,4,296,ty-4),RR(R,6,7),90);behind(s,wall,sol);s.push([[4,ty-4],[296,ty-4]]);s.push([[4,ty],[296,ty]]);return s;});

// ---- batch 12 chunk C: kitchen, food, toys, furniture, machines ----
function onTableK(s,R,ty,sol,kinds){var t=[];tableS(t,R,ty,pick(R,kinds));behind(s,t,sol);return s;}
S('Pressure cooker',['Hiss on the Stove','Under Pressure','Rattling Weight','Beans in Twenty Minutes','Locked Lid'],function(R){
  var s=[],sol=[],ty=RR(R,156,162),cx=RR(R,140,165),rx=RR(R,60,66),h=RR(R,64,70),ry=rx*0.26,top=ty-h;
  var pot=[[cx-rx,top]].concat([[cx-rx,ty-ry*0.4]]).concat(arc(cx,ty-ry*0.4,rx,ry,PI,0)).concat([[cx+rx,top]]);FS(s,sol,pot);
  var lid=arc(cx,top,rx+3,ry+1,PI,TAU).concat(arc(cx,top,rx+3,ry+1,0,PI));SOL(s,sol,lid);s.push(lid);var dome=arc(cx,top-2,rx-2,ry+8,PI,TAU);s.push(dome);sol.push(dome.concat([[cx+rx,top]]));
  s.push(arc(cx,top+6,rx,ry,0,PI));H(s,[[cx+rx*0.45,top+ry],[cx+rx,top],[cx+rx,ty-ry*0.4],[cx+rx*0.45,ty]],1.8,90);
  var hd=[[cx-rx-2,top-2],[cx-rx-58,top-8],[cx-rx-60,top-1],[cx-rx-2,top+5]];FS(s,sol,hd,1.6,0);s.push([[cx-rx-34,top-6],[cx-rx-34,top+2]]);
  var sh=[[cx+rx,top+16],[cx+rx+18,top+14],[cx+rx+18,top+22],[cx+rx,top+24]];FS(s,sol,sh,1.4,0);
  var vt=[cx+8,top-ry-8];s.push([[vt[0],top-ry-4],[vt[0],vt[1]]]);var wt=[[vt[0]-5,vt[1]],[vt[0]-4,vt[1]-9],[vt[0]+4,vt[1]-9],[vt[0]+5,vt[1]]];FS(s,sol,wt,1,90);
  var st=[];for(var k=0;k<3;k++){var sx=vt[0]+k*6-6,c=curve([[vt[0],vt[1]-9],[sx+RR(R,-4,4),vt[1]-22],[sx+8,vt[1]-36],[sx-2,vt[1]-52],[sx+6,vt[1]-66]],6);st.push(c);}A(s,st);
  var gx=cx-22,gy=top-ry-4;s.push(circle(gx,gy,6));s.push([[gx,gy],[gx+4,gy-3]]);
  var bn=EP(cx,ty+2,rx+14,ry+6);s.push(poly(bn));sol.push(bn);for(var g=0;g<8;g++){var a=g*PI/4;s.push([[cx+(rx+4)*Math.cos(a),ty+2+(ry+2)*Math.sin(a)],[cx+(rx+14)*Math.cos(a),ty+2+(ry+6)*Math.sin(a)]]);}
  var jx=cx-rx-RR(R,40,50);if(jx>20){cyl(s,jx,ty,14,40,1.6,1);sol.push(RP(jx-14,ty-46,jx+14,ty+4));s.push(rect(jx-15,ty-48,jx+15,ty-42));H(s,RP(jx-15,ty-48,jx+15,ty-42),1.2,90);s.push(rect(jx-10,ty-30,jx+10,ty-18));}
  onTableK(s,R,ty+4,sol,['tiles','diag']);return s;});

S('Dish rack with plates',['Drying Rack','After Sunday Lunch','Plates on Edge','Cups Upside Down','Left to Drip'],function(R){
  var s=[],sol=[],ty=RR(R,150,156),x0=RR(R,50,70),x1=RR(R,230,250),rb=ty-4,rt=ty-44;
  var tray=[[x0-10,ty],[x1+10,ty],[x1+6,ty-6],[x0-6,ty-6]];FS(s,sol,tray,1.4,0);
  var n=RI(R,6,8),pw=(x1-x0-60)/n,plates=[];for(var i=0;i<n;i++){var px=x0+12+i*pw,pr=RR(R,30,36),cyp=rb-pr+6,P=EP(px,cyp,pr*0.24,pr);plates.push({P:P,x:px,y:cyp,r:pr});}
  for(var j=plates.length-1;j>=0;j--){var o=plates[j],tmp=[];tmp.push(poly(o.P));tmp.push(poly(EP(o.x,o.y,o.r*0.17,o.r*0.72)));if(j%2)H(tmp,EP(o.x+o.r*0.06,o.y,o.r*0.12,o.r*0.6),1.4,0);behind(s,tmp,sol);sol.push(o.P);}
  var wr=[];for(var x=x0;x<=x1;x+=8)wr.push([[x,rb],[x,rt+(x>x1-50?10:24)]]);var ws=[];wr.forEach(function(q,i){A(ws,i%2?q.slice().reverse():q);});behind(s,[ws],sol);
  s.push([[x0,rb],[x1,rb]]);s.push([[x0,rt+24],[x1-50,rt+24]]);s.push([[x0,rb-10],[x1,rb-10]]);
  for(var c=0;c<RI(R,2,3);c++){var cx=x1-36+c*16,cy=rt+4-c*0;var cup=[[cx-7,cy-12],[cx+7,cy-12],[cx+6,cy+4],[cx-6,cy+4]];FS(s,sol,cup,c%2?1.5:0,90);s.push(arc(cx-9,cy-4,3,5,PI*0.5,PI*1.5));s.push([[cx,cy+4],[cx,rb-10]]);}
  var gl=RR(R,x1+20,x1+34);if(gl<285){var G=[[gl-9,ty],[gl-11,ty-34],[gl+11,ty-34],[gl+9,ty]];FS(s,sol,G);s.push([[gl-5,ty-30],[gl-6,ty-6]]);}
  onTableK(s,R,ty,sol,['stripes']);return s;});

S('Toast rack',['Breakfast in Silver','Cold Toast, Proper','Four Slices Standing','Marmalade Morning','The Rack and the Jar'],function(R){
  var s=[],sol=[],ty=RR(R,150,156),cx=RR(R,120,150),n=RI(R,5,6),gap=RR(R,20,24),x0=cx-gap*(n-1)/2,base=RP(x0-14,ty-6,x0+gap*(n-1)+14,ty);FS(s,sol,base,1.4,0);
  for(var i=0;i<n-1;i++){var tx=x0+i*gap+gap/2,tw=RR(R,8,9.5),th=RR(R,40,48),T=[[tx-tw,ty-6],[tx-tw,ty-th+8]].concat(arc(tx-tw+4,ty-th+8,4,6,PI,1.5*PI)).concat(arc(tx+tw-4,ty-th+8,4,6,1.5*PI,TAU)).concat([[tx+tw,ty-6]]);
    var tmp=[];tmp.push(poly(T));var dots=[];for(var dd=0;dd<9;dd++){var px=tx+RR(R,-tw+3,tw-3),py=ty-RR(R,10,th-6);dots.push([[px,py],[px+1.5,py+1]]);}A(tmp,dots);var cr=[];tmp.push(T.slice(1,-1).map(function(p){return [p[0]+(p[0]<tx?1.6:-1.6),p[1]+1.8];}));behind(s,tmp,sol);sol.push(T);}
  for(var j=0;j<n;j++){var ax=x0+j*gap;var A1=archP(ax,ty-6,3,32);s.push(A1);s.push(archP(ax,ty-6,1.5,32));}
  s.push(circle(x0+gap*(n-1)/2,ty-42,4));s.push([[x0+gap*(n-1)/2,ty-38],[x0+gap*(n-1)/2,ty-34]]);
  var jx=x0+gap*(n-1)+RR(R,40,56);if(jx<270){var J=[[jx-14,ty],[jx-16,ty-30],[jx+16,ty-30],[jx+14,ty]];FS(s,sol,J);s.push(rect(jx-17,ty-38,jx+17,ty-30));H(s,RP(jx-17,ty-38,jx+17,ty-30),1.2,90);clipIn(s,[rows(jx-16,jx+16,ty-20,ty-2,2)],J);s.push(rect(jx-10,ty-24,jx+10,ty-14));}
  var kx=x0-RR(R,40,60);if(kx>24){var K=[[kx-22,ty-2],[kx+22,ty-10],[kx+24,ty-6],[kx-20,ty+2]];FS(s,sol,K,1,0);s.push(EP(kx-30,ty-1,8,3));}
  var pl=EP(cx,ty+6,90,8);s.push(poly(pl));sol.push(pl);onTable(s,R,ty+4,sol);return s;});

S('Cookie jar',['Hand in the Jar','Baked on Saturday','Chocolate Chip Stash','Just One More','Lid Off, Crumbs Out'],function(R){
  var s=[],sol=[],ty=RR(R,152,158),cx=RR(R,100,140),rx=RR(R,40,46),h=RR(R,74,82),top=ty-h;
  var J=[[cx-rx*0.7,ty]].concat(cubic([cx-rx*0.7,ty],[cx-rx*1.25,ty-h*0.3],[cx-rx*1.15,ty-h*0.85],[cx-rx*0.6,top],16).slice(1)).concat([[cx+rx*0.6,top]]).concat(cubic([cx+rx*0.6,top],[cx+rx*1.15,ty-h*0.85],[cx+rx*1.25,ty-h*0.3],[cx+rx*0.7,ty],16).slice(1));FS(s,sol,J);
  var lid=[[cx-rx*0.68,top]].concat(arc(cx,top,rx*0.68,10,PI,TAU)).concat([[cx+rx*0.68,top]]);FS(s,sol,lid,1.6,0);s.push(EP(cx,top-12,6,4).concat([[cx+6,top-12]]));sol.push(EP(cx,top-12,6,4));
  var bandY=ty-h*0.55,band=[];var bl=[],br=[];for(var t=0;t<=10;t++){var y=bandY-10+t*2;bl.push([interpY(J.slice(0,17).map(function(p){return [p[1],p[0]];}),y),y]);}
  clipIn(s,[rows(cx-rx*1.3,cx+rx*1.3,bandY-10,bandY-8,2)],J);clipIn(s,[rows(cx-rx*1.3,cx+rx*1.3,bandY+8,bandY+10,2)],J);
  var hs=[];for(var k=0;k<5;k++){var hx=cx-rx*0.8+k*rx*0.4;hs.push(heartLeaf(hx,bandY,4.5,PI));}hs.forEach(function(P){s.push(poly(P));});
  H(s,J.filter(function(p){return p[0]>cx+rx*0.4;}).concat([[cx+rx*0.4,ty]]),1.8,90);
  var px=cx+rx+RR(R,50,70),pl=EP(px,ty+2,40,7);SOL(s,sol,pl);s.push(poly(pl));
  for(var c=0;c<4;c++){var ccx=px-24+c*14+RR(R,-2,2),ccy=ty-4-(c%2)*5,C=EP(ccx,ccy,11,4.5);FS(s,sol,C);for(var d=0;d<4;d++){var dx=ccx+RR(R,-7,7),dy=ccy+RR(R,-2,2);s.push(circle(dx,dy,0.8));}s.push(arc(ccx,ccy+2,11,4.5,0.2,PI-0.2));}
  var cb=[cx-rx-RR(R,24,34),ty-2];var cr=[];for(var q=0;q<RI(R,4,6);q++)cr.push(circle(cb[0]+RR(R,-14,14),cb[1]+RR(R,0,4),RR(R,0.8,1.6)));A(s,cr);
  onTable(s,R,ty+6,sol);return s;});

S('Carrots with tops',['From the Allotment','Feathery Greens','Pulled This Morning','Bunch of Orange','Soil Still On'],function(R){
  var s=[],sol=[],ty=RR(R,112,122),n=RI(R,5,6),ox=RR(R,120,150),oy=RR(R,150,160);
  for(var i=0;i<n;i++){var a=RR(R,-0.35,0.35)+(i-(n-1)/2)*0.12,L=RR(R,115,135),w=RR(R,11,13),root=[ox+(i-(n-1)/2)*8,oy+(i-(n-1)/2)*2],tip=[root[0]+L*Math.cos(a),root[1]+L*Math.sin(a)*0.5+6];
    var dx=tip[0]-root[0],dy=tip[1]-root[1],l=Math.hypot(dx,dy),nx=-dy/l,ny=dx/l;var C=[[root[0]+nx*w,root[1]+ny*w]].concat(quad([root[0]+nx*w,root[1]+ny*w],[root[0]+dx*0.6+nx*w*0.6,root[1]+dy*0.6+ny*w*0.6],tip,12).slice(1)).concat(quad(tip,[root[0]+dx*0.6-nx*w*0.6,root[1]+dy*0.6-ny*w*0.6],[root[0]-nx*w,root[1]-ny*w],12).slice(1));
    var tmp=[];tmp.push(poly(C));for(var r=1;r<7;r++){var p=lerp(root,tip,r/8),ww=w*(1-r/8)*0.8;tmp.push([[p[0]+nx*ww,p[1]+ny*ww],[p[0]+nx*ww*0.2+dx*0.01,p[1]+ny*ww*0.2]]);}H(tmp,C.slice(0,13).concat([root]),1.8,Math.atan2(dy,dx)*180/PI+80);behind(s,tmp,sol);sol.push(C);
    var tp=[];for(var f=0;f<RI(R,3,4);f++){var fa=PI+a+RR(R,-0.5,0.5),fl=RR(R,40,70),end=[root[0]+fl*Math.cos(fa),root[1]+fl*Math.sin(fa)*0.6-RR(R,4,20)],stem=quad(root,[(root[0]+end[0])/2,(root[1]+end[1])/2-8],end,10);tp.push(stem);
      var fr=[];for(var q=2;q<stem.length;q+=2){var p2=stem[q];fr.push(p2,[p2[0]+RR(R,-5,5),p2[1]-RR(R,4,8)],p2,[p2[0]+RR(R,-5,5),p2[1]+RR(R,3,6)],p2);}tp.push(fr);}behind(s,tp,sol);}
  var tw=[[ox-6,oy-12],[ox+8,oy+12]];s.push(tw);s.push([[ox-10,oy-8],[ox+12,oy+8]]);
  var board=[[20,ty+30],[280,ty+30],[290,196],[10,196]];var bb=[];bb.push(poly(board));bb.push(rows(20,280,ty+40,190,RR(R,10,13)));behind(s,bb,sol);
  onTable(s,R,ty,sol);return s;});

S('Asparagus bunch',['Spears in a Jug','Green Tips','Tied with String','Spring Spears','Fresh from the Bed'],function(R){
  var s=[],sol=[],ty=RR(R,156,162),cx=RR(R,130,160),jw=RR(R,32,36),jh=RR(R,52,58),jt=ty-jh;
  var jug=[[cx-jw*0.85,ty]].concat(cubic([cx-jw*0.85,ty],[cx-jw*1.15,ty-jh*0.5],[cx-jw*0.9,jt+8],[cx-jw,jt],12).slice(1)).concat([[cx+jw*1.05,jt],[cx+jw*1.2,jt-5]]).concat(cubic([cx+jw*0.9,jt+4],[cx+jw*0.95,jt+8],[cx+jw*1.15,ty-jh*0.5],[cx+jw*0.85,ty],12));
  var n=RI(R,10,12),sp=[];for(var i=0;i<n;i++){var u=(i+0.5)/n-0.5,b=[cx+u*jw*1.2,jt+20],t=[cx+u*jw*2.8+RR(R,-4,4),jt-RR(R,70,96)],w=RR(R,2.4,3);
    var P=[[b[0]-w,b[1]],[t[0]-w*0.8,t[1]+10],[t[0]-w*1.2,t[1]+4],[t[0],t[1]-3],[t[0]+w*1.2,t[1]+4],[t[0]+w*0.8,t[1]+10],[b[0]+w,b[1]]];sp.push({P:P,t:t,b:b,w:w});}
  sp.sort(function(a,b){return Math.abs(b.b[0]-cx)-Math.abs(a.b[0]-cx);});
  SOL(s,sol,jug);s.push(jug);H(s,jug.filter(function(p){return p[0]>cx+jw*0.4;}).concat([[cx+jw*0.4,ty]]),1.8,90);var ap=[];clipIn(ap,[rows(cx-jw*1.2,cx+jw*1.2,jt+12,ty-4,RR(R,6,7))],jug);behind(s,ap,[]);
  var hd=arc(cx-jw*1.05,ty-jh*0.55,10,14,PI*0.5,PI*1.5);s.push(hd);
  for(var k=sp.length-1;k>=0;k--){var o=sp[k],tmp=[];tmp.push(poly(o.P));for(var q=1;q<5;q++){var p=lerp(o.b,o.t,0.35+q*0.13);tmp.push([[p[0]-o.w,p[1]],[p[0],p[1]-3],[p[0]+o.w,p[1]]]);}H(tmp,o.P.slice(1,6),1,0);behind(s,tmp,sol.slice(1));sol.push(o.P);}
  var by=jt-RR(R,14,20);s.push([[cx-jw*1.1,by],[cx+jw*1.1,by]]);s.push([[cx-jw*1.1,by+3],[cx+jw*1.1,by+3]]);s.push([[cx+4,by+3],[cx+10,by+14]]);s.push([[cx+4,by+3],[cx-2,by+16]]);
  var lx=cx+jw+RR(R,40,60);if(lx<260){for(var l=0;l<3;l++){var y=ty-2-l*4,P2=[[lx-30,y],[lx+30,y-6],[lx+36,y-9],[lx+30,y-3],[lx-30,y+3]];FS(s,sol,P2);}}
  onTableK(s,R,ty,sol,['stripes']);return s;});

S('Coconut halves',['Cracked Open','Milk and Meat','Beach Snack','Three Eyes and a Straw','Under the Palm'],function(R){
  var s=[],sol=[],bg=[],sy=RR(R,150,156),hy=RR(R,96,104),cx=RR(R,110,150);
  [[cx-34,1],[cx+34,-1]].forEach(function(o,i){var x=o[0],r=RR(R,28,32),y=sy+12,top=y-r*0.55;var shell=[[x-r,top]].concat(arc(x,top,r,r*0.9,PI,0).reverse().reverse()).concat([[x+r,top]]);
    var sh=arc(x,top,r,r*1.0,0,PI);var P=[[x+r,top]].concat(sh).concat([[x-r,top]]);var rim=EP(x,top,r,r*0.32);SOL(s,sol,P);SOL(s,sol,rim);s.push(poly(rim));s.push(sh);
    var fb=[];for(var k=0;k<9;k++){var a=0.25+k*(PI-0.5)/8;fb.push([[x+r*Math.cos(a)*0.98,top+r*Math.sin(a)*0.98],[x+r*Math.cos(a+0.25)*0.6,top+r*0.25+r*Math.sin(a+0.25)*0.5]]);}var fs=[];fb.forEach(function(q,j){A(fs,j%2?q.slice().reverse():q);});clipIn(s,[fs],P,[rim]);H(s,P.filter(function(p){return p[1]>top+r*0.5;}),1.4,RR(R,20,40));
    s.push(poly(EP(x,top,r*0.8,r*0.24)));var inner=EP(x,top+2,r*0.68,r*0.18);H(s,inner,1.6,0);});
  var wx=cx+RR(R,95,115),wr=RR(R,24,28),wy=sy+8-wr;if(wx>270)wx=cx-110;var W=EP(wx,wy,wr,wr*0.92);FS(s,sol,W);var fb2=[];for(var k2=0;k2<12;k2++){var a2=-PI/2+k2*0.28;fb2.push(curve([[wx+wr*0.2*Math.cos(a2),wy-wr*0.9],[wx+wr*0.9*Math.cos(a2)*0.7,wy],[wx+wr*Math.cos(a2)*0.8,wy+wr*0.8]],5));}var f2=[];fb2.forEach(function(c,j){A(f2,j%2?c.slice().reverse():c);});clipIn(s,[f2],W);
  [[-5,-12],[5,-12],[0,-5]].forEach(function(e){s.push(circle(wx+e[0],wy+e[1],2.2));});
  var st=[[cx+30,sy-6],[cx+46,sy-46]];s.push(st);s.push(translate(st,3,0));s.push([[cx+46,sy-46],[cx+52,sy-54],[cx+55,sy-52]]);
  var px=R()<0.5?RR(R,20,40):RR(R,260,280),trunk=[];for(var t=0;t<=8;t++)trunk.push([px+12*Math.sin(t/8*1.4),sy-t*(sy-20)/8]);var TL=tube(trunk,function(u){return 6-2*u;});bg.push(poly(TL.P));var rg=[];for(var q=1;q<8;q++)rg.push([TL.L[q],TL.R[q]]);A(bg,rg);
  var crown=trunk[8];for(var fr=0;fr<6;fr++){var fa=PI*(0.1+fr*0.16),end=[crown[0]+50*Math.cos(fa+PI),crown[1]+30*Math.sin(fa)*0.6+10];bg.push(spikes(quad(crown,[(crown[0]+end[0])/2,crown[1]-14],end,16),2,7,1));}
  bg.push([[4,hy],[296,hy]]);bg.push(waterS(R,4,296,hy+4,sy-4,RR(R,5,6),1));s.push([[4,sy],[296,sy]]);sand(bg,R,sy+5);
  return fin(s,R,bg,sol,hy-1);});

S('Kaleidoscope',['Turn and Look','Six Mirrors','Coloured Glass Flower','Brass Tube Dreams','Endless Symmetry'],function(R){
  var s=[],sol=[],ty=RR(R,158,164),f=sgn(R),vx=150+f*RR(R,58,70),vy=RR(R,84,94),vr=RR(R,64,70);
  var V=EP(vx,vy,vr,vr);SOL(s,sol,V);s.push(poly(V));s.push(circle(vx,vy,vr+4));
  var motif=[],kind=RI(R,0,2);for(var m=0;m<RI(R,3,4);m++){var rr=RR(R,12,vr-16),a=RR(R,0.05,0.45),sz=RR(R,5,10),c=[vx+rr*Math.cos(a),vy+rr*Math.sin(a)];motif.push(m%2?EP(c[0],c[1],sz,sz*0.6):[[c[0]-sz,c[1]],[c[0],c[1]-sz],[c[0]+sz,c[1]],[c[0],c[1]+sz]]);}
  var all=[];for(var k=0;k<6;k++){motif.forEach(function(P,j){var Q=rotateAbout(P,vx,vy,k*PI/3);all.push(Q);var M2=rotateAbout(P.map(function(p){var dx=p[0]-vx,dy=p[1]-vy;return [vx+dx,vy-dy];}),vx,vy,k*PI/3);all.push(M2);});}
  all.forEach(function(P,i){s.push(poly(P));if(i%4<2)H(s,P,1.3,(i%3)*60);});
  for(var sp=0;sp<6;sp++){var a2=sp*PI/3+PI/6;s.push([[vx,vy],[vx+vr*Math.cos(a2),vy+vr*Math.sin(a2)]]);}
  s.push(circle(vx,vy,5));
  var tx=150-f*RR(R,40,60),tl=RR(R,90,100),tr=RR(R,12,14),ang=f*RR(R,0.05,0.2);var tube0=RP(-tl/2,-tr,tl/2,tr),loc=[];loc.push(poly(tube0));loc.push(ellipse(tl/2*-f,0,4,tr));loc.push(ellipse(tl/2*f,0,5,tr+3));loc.push(ellipse(tl/2*f,0,2,4));
  [-0.3,0.1,0.3].forEach(function(u){loc.push([[u*tl,-tr],[u*tl,tr]]);});H(loc,RP(-0.3*tl,-tr,0.1*tl,tr),1.6,45);H(loc,RP(-tl/2,tr*0.3,tl/2,tr),1.4,0);
  var ty2=ty-tr-10;loc.forEach(function(st){s.push(rotateAbout(translate(st,tx,ty2),tx,ty2,ang));});sol.push(rotateAbout(translate(tube0,tx,ty2),tx,ty2,ang));
  s.push([[tx-20,ty2+tr],[tx-24,ty]]);s.push([[tx+20,ty2+tr],[tx+24,ty]]);
  onTable(s,R,ty,sol);return s;});

S('Jigsaw puzzle',['Two Pieces Missing','Sunday Afternoon Puzzle','Edges First','Five Hundred Pieces','Mountains in Pieces'],function(R){
  var s=[],sol=[],x0=RR(R,40,56),y0=RR(R,26,34),cols=RI(R,7,8),rowsN=5,cw=RR(R,24,26),ch=RR(R,24,26),x1=x0+cols*cw,y1=y0+rowsN*ch;
  var miss=[[RI(R,1,cols-2),RI(R,1,rowsN-2)]];miss.push([Math.min(cols-1,miss[0][0]+1),miss[0][1]]);
  function isM(c,r){return miss.some(function(m){return m[0]===c&&m[1]===r;});}
  var frame=RP(x0,y0,x1,y1);s.push(poly(frame));var holes=miss.map(function(m){return RP(x0+m[0]*cw,y0+m[1]*ch,x0+(m[0]+1)*cw,y0+(m[1]+1)*ch);});
  var lines=[];for(var r=1;r<rowsN;r++){var p=[[x0,y0+r*ch]];for(var c=0;c<cols;c++){var xa=x0+c*cw,y=y0+r*ch,d=((c+r)%2?1:-1);p.push([xa+cw*0.38,y]);A(p,arc(xa+cw/2,y+d*3.5,cw*0.14,4.5,d>0?PI*1.25:PI*0.75,d>0?PI*1.75+TAU-TAU:PI*0.25-TAU*0).slice(0));p.push([xa+cw*0.62,y],[xa+cw,y]);}lines.push(p);}
  for(var c2=1;c2<cols;c2++){var q=[[x0+c2*cw,y0]];for(var r2=0;r2<rowsN;r2++){var ya=y0+r2*ch,x=x0+c2*cw,d2=((c2+r2)%2?-1:1);q.push([x,ya+ch*0.38]);A(q,arc(x+d2*3.5,ya+ch/2,4.5,ch*0.14,d2>0?PI*0.75+PI:PI*0.25,d2>0?PI*1.25-PI+PI*2:PI*1.75-TAU));q.push([x,ya+ch*0.62],[x,ya+ch]);}lines.push(q);}
  var pic=[],hy=y0+ch*2.4;pic.push(peaks([],R,y1,ch*2.6,4,0).map(function(p){return [Math.max(x0,Math.min(x1,x0+(p[0]-4)*(x1-x0)/292)),Math.min(y1,p[1])];}));var pk=pic[0];
  var ptop=pk.concat([[x1,y1],[x0,y1]]);var ph=[];H(ph,ptop,2.4,RR(R,50,70));var lake=[];lake.push(rows(x0,x1,y1-ch*0.8,y1-2,3));
  var sunx=x0+RR(R,0.2,0.8)*(x1-x0);var sun=[circle(sunx,y0+ch*0.8,9)];
  var picAll=[pk].concat(ph).concat(lake).concat(sun).concat(lines);clipIn(s,picAll,frame,holes);
  holes.forEach(function(P){s.push(poly(P));H(s,P,4,0);});sol.push(frame);
  var loose=[];for(var l=0;l<RI(R,3,4);l++){var lx=R()<0.5?RR(R,16,x0-6):RR(R,x1+10,284),ly=RR(R,y1+16,184);if(lx<10||lx>290){lx=RR(R,30,270);ly=RR(R,y1+20,186);}var P2=[[0,0],[cw*0.38,0]].concat(arc(cw/2,-3.5,cw*0.14,4.5,PI*0.75,PI*2.25)).concat([[cw*0.62,0],[cw,0],[cw,ch],[0,ch]]);P2=rotateAbout(translate(P2,lx-cw/2,ly-ch/2),lx,ly,RR(R,-0.8,0.8));FS(s,sol,P2,l%2?2.2:0,RR(R,0,90));}
  var bx=[[RR(R,200,230),RR(R,186,190)],[296,RR(R,150,160)]];
  var tb=[];H(tb,RP(4,4,296,196),RR(R,6.5,7.5),RR(R,10,20));H(tb,RP(4,4,296,196),RR(R,16,20),RR(R,100,110));behind(s,tb,sol);return s;});

S('Barber chair',['Next, Please','Short Back and Sides','Leather and Chrome','The Big Red Chair','Saturday Trim'],function(R){
  var s=[],sol=[],fy=RR(R,138,146),cx=RR(R,130,160),b=RR(R,184,190);
  var base=EP(cx,b-3,34,6);FS(s,sol,base,1.4,0);var ped=[[cx-9,b-6],[cx-6,b-40],[cx+6,b-40],[cx+9,b-6]];FS(s,sol,ped);H(s,[[cx+2,b-40],[cx+6,b-40],[cx+9,b-6],[cx+3,b-6]],1.2,90);
  var seat=blob([[cx-40,b-44],[cx-38,b-56],[cx+30,b-58],[cx+42,b-52],[cx+40,b-42],[cx-30,b-40]],5);FS(s,sol,seat);clipIn(s,[rows(cx-42,cx+44,b-56,b-42,4)],seat);
  var back=blob([[cx-40,b-56],[cx-46,b-110],[cx-34,b-118],[cx-16,b-114],[cx-14,b-58]],5);FS(s,sol,back);var tf=[];for(var y=b-108;y<b-62;y+=9)for(var x=cx-40;x<cx-18;x+=8)tf.push(circle(x+((y/9|0)%2)*4,y,0.9));A(s,tf);
  var hr=[[cx-46,b-140],[cx-26,b-140],[cx-26,b-128],[cx-46,b-128]];FS(s,sol,hr);s.push([[cx-36,b-128],[cx-36,b-118]]);
  [-1,1].forEach(function(d){var ay=b-72+(d>0?2:0);var arm=[[cx-36,ay],[cx+40,ay-2],[cx+44,ay+4],[cx-36,ay+6]];FS(s,sol,arm,d>0?1.4:0,0);s.push([[cx+34,ay+4],[cx+34,b-56]]);});
  var fr=[[cx+40,b-44],[cx+56,b-18],[cx+80,b-18],[cx+80,b-12],[cx+52,b-12],[cx+36,b-38]];FS(s,sol,fr,1.6,0);s.push([[cx+16,b-40],[cx+30,b-20],[cx+36,b-22]]);
  var lv=[[cx-40,b-30],[cx-60,b-44]];s.push(lv);s.push(circle(cx-62,b-46,3));
  var px=cx>150?Math.min(282,cx+80):Math.max(18,cx-80),pole=RP(px-7,30,px+7,100);FS(s,sol,pole);var str=[];for(var k=-6;k<12;k++)str.push([[px-7,40+k*6],[px+7,40+k*6+10]]);var sc=[];clipIn(sc,str,pole);A(s,sc);s.push(arc(px,30,8,8,PI,TAU));s.push(rect(px-8,100,px+8,104));
  var mx=cx>150?Math.max(44,cx-120):Math.min(256,cx+120),M1=RP(mx-34,26,mx+34,96);FS(s,sol,M1);H(s,[[mx-20,30],[mx-10,30],[mx-28,92],[mx-34,92],[mx-34,60]],1.6,0);s.push([[mx+10,30],[mx-18,92]]);
  var sh=RP(mx-44,fy-24,mx+44,fy-18);FS(s,sol,sh,1.2,0);for(var bt=0;bt<3;bt++){var bx=mx-30+bt*14;s.push(rect(bx,fy-36,bx+7,fy-24));s.push([[bx+3.5,fy-40],[bx+3.5,fy-36]]);}
  room(s,R,fy,sol);return s;});

S('Wardrobe',['Mothballs and Cedar','Two Doors, One Mirror','Grandmother’s Wardrobe','Room for Coats','Brass Key in the Lock'],function(R){
  var s=[],sol=[],fy=RR(R,148,156),cx=RR(R,130,170),w=RR(R,54,60),b=RR(R,182,188),top=RR(R,14,20);
  var body=RP(cx-w,top+10,cx+w,b-6);FS(s,sol,body);var cr=[[cx-w-6,top+10],[cx-w-4,top],[cx+w+4,top],[cx+w+6,top+10]];FS(s,sol,cr,1.4,0);s.push(rect(cx-w-4,top+10,cx+w+4,top+14));
  var pl=[[cx-w-4,b-6],[cx+w+4,b-6],[cx+w+4,b-16],[cx-w-4,b-16]];s.push(poly(pl));[-1,1].forEach(function(d){var fx=cx+d*(w-6);s.push(rect(fx-4,b-6,fx+4,b));});
  var dr=RP(cx-w+6,b-40,cx+w-6,b-20);s.push(poly(dr));[cx-w*0.45,cx+w*0.45].forEach(function(x){s.push(circle(x,b-30,2.4));});
  var dt=top+20,db=b-46;s.push([[cx,dt],[cx,db]]);s.push(rect(cx-w+6,dt,cx+w-6,db));
  var mirLeft=R()<0.5;[-1,1].forEach(function(d){var x0=d<0?cx-w+12:cx+6,x1=d<0?cx-6:cx+w-12,P=RP(x0,dt+8,x1,db-8);
    if((d<0)===mirLeft){var Mi=[[x0,dt+24]].concat(arc((x0+x1)/2,dt+24,(x1-x0)/2,16,PI,TAU)).concat([[x1,db-8],[x0,db-8]]);s.push(poly(Mi));var rf=[];for(var k=0;k<3;k++){var xx=x0+6+k*8;rf.push([[xx,db-12],[xx+18,dt+30]]);}clipIn(s,rf,Mi);}
    else{s.push(poly(P));s.push(rect(x0+6,dt+14,x1-6,(dt+db)/2-4));s.push(rect(x0+6,(dt+db)/2+4,x1-6,db-14));H(s,RP(x0,dt+8,x0+5,db-8),1.2,90);}});
  s.push(circle(cx-4,(dt+db)/2,1.6));s.push(circle(cx+4,(dt+db)/2,1.6));s.push(rect(cx+3,(dt+db)/2+3,cx+5,(dt+db)/2+8));
  H(s,[[cx+w,top+14],[cx+w+12,top+20],[cx+w+12,b-14],[cx+w,b-6]],1.6,90);s.push(poly([[cx+w,top+14],[cx+w+12,top+20],[cx+w+12,b-14],[cx+w,b-6]]));sol.push([[cx+w,top+14],[cx+w+12,top+20],[cx+w+12,b-14],[cx+w,b-6]]);
  var hb=[[cx-w+10,top],[cx-w+20,top-6],[cx-w+40,top-6],[cx-w+44,top]];if(R()<0.7){var bx=RP(cx-w+14,top-14,cx-w+40,top);FS(s,sol,bx,1.6,90);}
  var rug=EP(cx,b+3,w+40,6);s.push(poly(rug));sol.push(rug);room(s,R,fy,sol);return s;});

S('Bar stools at a counter',['Counter Seats','Milkshake Row','Spin on the Stool','Lunch Counter Noon','Chrome and Vinyl'],function(R){
  var s=[],sol=[],ct=RR(R,108,116),b=RR(R,182,188),n=RI(R,4,5),x0=RR(R,30,46),gp=(296-2*x0)/(n-1);
  var top=RP(4,ct-6,296,ct);FS(s,sol,top,1.4,0);var front=RP(4,ct,296,b-24);s.push(poly(front));var fr=[];clipIn(fr,[rows(4,296,ct+8,ct+14,3)],front);A(s,fr);
  var pn=[];for(var x=4;x<296;x+=RR(R,22,26))pn.push(rect(x+3,ct+20,x+19,b-30));
  var sp=[[4,b-24],[296,b-24]];s.push(sp);s.push([[4,b-28],[296,b-28]]);
  var stools=[];for(var i=0;i<n;i++){var sx=x0+i*gp+RR(R,-4,4),sy=ct+RR(R,22,28),seat=[[sx-15,sy]].concat(arc(sx,sy,15,4,PI,TAU)).concat(arc(sx,sy+6,15,4,0,PI)).concat([[sx-15,sy]]);
    var st=[];FS(st,sol,seat.concat());H(st,arc(sx,sy+6,15,4,0,PI).concat([[sx-15,sy]]),1.2,0);st.push([[sx-2,sy+10],[sx-2,b-4]]);st.push([[sx+2,sy+10],[sx+2,b-4]]);sol.push(RP(sx-2,sy+10,sx+2,b-4));
    var ring=EP(sx,b-26,11,3);st.push(poly(ring));var bs=EP(sx,b-3,13,3.4);st.push(poly(bs));sol.push(bs);stools.push(st);}
  stools.forEach(function(st){A(s,st);});behind(s,pn,sol);
  var items=[];var nh=RR(R,60,90);items.push(rect(nh-10,ct-22,nh+10,ct-6));items.push(zz(nh-8,nh+8,ct-20,ct-8,2));var sg=RR(R,170,200);items.push([[sg-6,ct-6],[sg-7,ct-22],[sg+7,ct-22],[sg+6,ct-6],[sg-6,ct-6]]);items.push(arc(sg,ct-22,7,6,PI,TAU));items.push([[sg,ct-28],[sg+8,ct-32]]);
  var cp=RR(R,230,260);items.push([[cp-6,ct-6],[cp-7,ct-18],[cp+7,ct-18],[cp+6,ct-6]]);items.push(arc(cp+9,ct-12,3,4,-PI/2,PI/2));items.push(EP(cp,ct-5,10,2).concat([[cp+10,ct-5]]));
  A(s,items);items.forEach(function(it){if(it.length>4)sol.push(it);});
  var sh=[[4,40],[296,40]];s.push(sh);s.push([[4,44],[296,44]]);for(var g=0;g<RI(R,6,8);g++){var gx=RR(R,14,286);s.push(rect(gx-5,24,gx+5,40));}
  var wall=[];H(wall,RP(4,4,296,ct-6),RR(R,10,12),0);H(wall,RP(4,4,296,ct-6),RR(R,10,12),90);behind(s,wall,sol.concat([RP(4,22,296,44)]));
  s.push([[4,b],[296,b]]);var fl=[];H(fl,RP(4,b-24,296,196),RR(R,9,11),45);H(fl,RP(4,b-24,296,196),RR(R,9,11),-45);behind(s,fl,sol);return s;});

S('Wringer washer',['Monday Wash Day','Through the Rollers','Turn the Crank','Suds and Steel','Back Porch Laundry'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,172,178),cx=RR(R,115,145),rx=RR(R,46,50),th=RR(R,70,76),tt=gy-28-th;
  [-1,1].forEach(function(d){var lx=cx+d*(rx-4);s.push([[lx,tt+th],[lx+d*4,gy-6]]);s.push(circle(lx+d*4,gy-4,4));sol.push(RP(lx-2,tt+th,lx+2,gy));});s.push([[cx-rx+2,gy-22],[cx+rx-2,gy-22]]);
  var tub=[[cx-rx,tt]].concat([[cx-rx+3,tt+th]]).concat(arc(cx,tt+th,rx-3,8,PI,0)).concat([[cx+rx,tt]]);FS(s,sol,tub);var rb=[];for(var k=1;k<5;k++){var y=tt+k*th/5;rb.push(arc(cx,y,rx-k*0.6,7,0,PI));}s.push(serp(rb));
  s.push(ellipse(cx,tt,rx,8));var sud=[];for(var q=0;q<RI(R,6,8);q++)sud.push(circle(cx+RR(R,-rx*0.7,rx*0.7),tt+RR(R,-2,2),RR(R,2,4)));A(s,sud);
  H(s,[[cx+rx*0.5,tt+8],[cx+rx,tt],[cx+rx-3,tt+th],[cx+rx*0.5,tt+th+6]],1.8,90);
  var wy=tt-22,frm=[[cx-rx*0.9,tt-2],[cx-rx*0.9,wy-16],[cx+rx*0.9,wy-16],[cx+rx*0.9,tt-2]];s.push(frm);sol.push(RP(cx-rx*0.9,wy-16,cx+rx*0.9,tt));
  var r1=RP(cx-rx*0.85,wy-12,cx+rx*0.85,wy-4),r2=RP(cx-rx*0.85,wy-4,cx+rx*0.85,wy+4);FS(s,sol,r1,1.4,0);FS(s,sol,r2);s.push(rect(cx-rx*0.95,wy-20,cx+rx*0.95,wy-16));
  var hx=cx+rx*0.9,ha=RR(R,0,TAU);s.push(circle(hx+4,wy-4,4));var he=[hx+4+20*Math.cos(ha),wy-4+20*Math.sin(ha)];s.push([[hx+4,wy-4],he]);s.push([he,[he[0]+8,he[1]]]);
  var cl=[[cx-rx*0.85,wy+4],[cx-rx*0.6,wy+30],[cx-rx*0.4,wy+28],[cx-rx*0.3,wy+4]];s.push(cl);
  var bx=cx+rx+RR(R,40,60);if(bx<262){var bsk=[[bx-26,gy],[bx-32,gy-26],[bx+32,gy-26],[bx+26,gy]];FS(s,sol,bsk);var wv=[];for(var y2=gy-22;y2<gy;y2+=4)wv.push(wave(bx-30,bx+30,y2,1.4,6,y2));clipIn(s,[serp(wv)],bsk);var cloth=blob([[bx-30,gy-26],[bx-20,gy-36],[bx,gy-34],[bx+18,gy-40],[bx+30,gy-26]],5);FS(s,sol,cloth,2,RR(R,30,60));}
  var ln=RR(R,30,46);bg.push([[4,ln],[296,ln+6]]);for(var c=0;c<RI(R,3,5);c++){var lx2=RR(R,20,280),ly=ln+lx2*6/292;bg.push(RP(lx2-10,ly,lx2+10,ly+RR(R,22,34)));bg.push([[lx2-4,ly-3],[lx2-4,ly+3]]);bg.push([[lx2+4,ly-3],[lx2+4,ly+3]]);}
  var wl=[];planks(4,4,296,gy-40,RR(R,6,7),false).forEach(function(q,i){wl.push(i%2?q.slice().reverse():q);});var ws=[];wl.forEach(function(q){A(ws,q);});bg.push(ws);
  win(bg,R()<0.5?RR(R,30,60):RR(R,230,260),gy-110,36,46,0);bg.push([[4,gy-40],[296,gy-40]]);
  var fl=[];planks(4,gy-40,296,196,RR(R,7,9),false);furrows(bg,R,gy-40,RI(R,16,20));behind(s,bg,sol);return s;});

S('Popcorn cart',['Fresh Popped','Carnival Corner','Butter in the Air','Red and White Stripes','Paper Bags, Ten Cents'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,170,176),cx=RR(R,130,160),w=RR(R,40,46),gb=gy-36,gt=gb-56;
  var wr=RR(R,18,22);spokeW(s,sol,cx+w-10,gy-wr,wr,12);
  var base=RP(cx-w-6,gb,cx+w+6,gb+18);FS(s,sol,base,2,90);var lg=[[cx-w,gb+18],[cx-w+4,gy]];s.push(lg);s.push([[cx-w+8,gb+18],[cx-w+4,gy]]);
  var hd=[[cx-w-6,gb+6],[cx-w-36,gb-4],[cx-w-40,gb-2]];s.push(hd);s.push([[cx-w-36,gb-4],[cx-w-38,gb+6]]);
  var box=RP(cx-w,gt,cx+w,gb);SOL(s,sol,box);s.push(poly(box));s.push([[cx,gt],[cx,gb]]);
  var pile=[[cx-w,gb]];for(var x=cx-w;x<cx+w;x+=4){pile.push([x+2,gb-20-6*Math.sin((x-cx)/w*PI/2+PI/2)-RR(R,0,4)]);}pile.push([cx+w,gb]);var kb=[];var pp=[];for(var k=0;k<RI(R,26,34);k++){var px=cx+RR(R,-w+4,w-4),py=gb-RR(R,3,22);pp.push(scallop(px,py,2.6,2.2,5,0.35));}A(s,pp);
  var ket=[[cx-14,gt+10],[cx+14,gt+10],[cx+10,gt+26],[cx-10,gt+26]];FS(s,sol,ket,1.6,0);s.push([[cx,gt],[cx,gt+10]]);s.push(arc(cx,gt+10,14,4,PI,TAU));
  var spill=[];for(var q=0;q<5;q++)spill.push(scallop(cx+16+q*4,gt+20+q*5,2.4,2,5,0.35));A(s,spill);
  var rf=[[cx-w-8,gt],[cx-w+4,gt-24],[cx+w-4,gt-24],[cx+w+8,gt]];SOL(s,sol,rf);s.push(poly(rf));var stp=[];for(var t=0;t<8;t++){var u=t/8,a=lerp([cx-w-8,gt],[cx+w+8,gt],u),bb=lerp([cx-w+4,gt-24],[cx+w-4,gt-24],u);stp.push([a,bb]);}var sv=[];for(var t2=0;t2<8;t2+=2){var a1=lerp([cx-w-8,gt],[cx+w+8,gt],t2/8),a2=lerp([cx-w-8,gt],[cx+w+8,gt],(t2+1)/8),b1=lerp([cx-w+4,gt-24],[cx+w-4,gt-24],t2/8),b2=lerp([cx-w+4,gt-24],[cx+w-4,gt-24],(t2+1)/8);H(s,[a1,a2,b2,b1],1.4,0);}
  s.push(bumps(cx-w-8,cx+w+8,gt,4,6));s.push([[cx,gt-24],[cx,gt-34]]);s.push([[cx,gt-34],[cx+12,gt-30],[cx,gt-27]]);
  for(var bg2=0;bg2<3;bg2++){var bx=cx+w+10+bg2*12;if(bx>285)break;var B=[[bx-5,gb+18],[bx-4,gb+4],[bx+4,gb+4],[bx+5,gb+18]];s.push(poly(B));s.push(bumps(bx-4,bx+4,gb+4,2,4));}
  treeR(bg,R,R()<0.5?RR(R,20,50):RR(R,250,280),gy,RR(R,18,22),2.4);for(var f=0;f<RI(R,3,5);f++){var fx=RR(R,10,290);bg.push(comb(fx-12,fx+12,gy,8,4));}
  var pth=[];cobbles(s,R,gy,sol);bg.push(tufts(4,296,gy,4,R));hills(bg,R,gy-6,RR(R,16,24),5);return fin(s,R,bg,sol,gy-2);});

// ---- batch 12 Daily Super Sketch: Library reading room (type 1, interior, no sky) ----
MASTER={name:'Library reading room',titles:['Silence Under the Gallery','Green Lamps, Long Tables','Ten Thousand Spines','The Reading Room at Four','Ladder to the Top Shelf','Dust Motes and Oak'],build:function(R){
  var s=[],sol=[],bg=[],VX=RR(R,140,160),VY=RR(R,84,92),k=RR(R,0.36,0.4);
  function P(X,Y,u){var f=1-(1-k)*u;return [VX+(X-VX)*f,VY+(Y-VY)*f];}
  function Yh(h){return 196-192*h;}
  var bx0=P(4,4,1)[0],bx1=P(296,4,1)[0],by0=P(4,4,1)[1],by1=P(4,196,1)[1];
  // ---- foreground: reading table, chairs, lamps, open books ----
  var tY=Yh(0.2),tX0=RR(R,92,100),tX1=300-tX0,u0=0.12,u1=0.78;
  var top=[P(tX0,tY,u0),P(tX1,tY,u0),P(tX1,tY,u1),P(tX0,tY,u1)];
  var lamps=[],nl=3;for(var i=0;i<nl;i++){var u=u0+0.12+i*(u1-u0-0.2)/(nl-1),b=P(i%2?tX0+16:tX1-16,tY,u),sc=1-(1-k)*u,sh=[[b[0]-11*sc,b[1]-20*sc],[b[0]-6*sc,b[1]-28*sc],[b[0]+6*sc,b[1]-28*sc],[b[0]+11*sc,b[1]-20*sc]];
    var stem=RP(b[0]-1,b[1]-21*sc,b[0]+1,b[1]);lamps.push({sh:sh,b:b,sc:sc,stem:stem});}
  // chairs (front ones occlude table)
  var chairs=[];[0.08,0.42].forEach(function(u){[tX0-10,tX1+10].forEach(function(X){var d=X<150?-1:1,sb=P(X,Yh(0.12),u),st=P(X,Yh(0.36),u),sf=P(X-d*16,Yh(0.12),u),bk=[P(X,Yh(0.36),u),P(X,Yh(0.36),u+0.1),P(X,Yh(0.12),u+0.1),P(X,Yh(0),u+0.1),P(X,Yh(0),u),P(X,Yh(0.12),u)];
    var seat=[P(X,Yh(0.12),u),P(X,Yh(0.12),u+0.1),P(X-d*18,Yh(0.12),u+0.1),P(X-d*18,Yh(0.12),u)];chairs.push({bk:bk,seat:seat,u:u,X:X,d:d});});});
  chairs.forEach(function(c){if(c.u<0.2){SOL(s,sol,c.bk);s.push(poly(c.bk));var sl=[];for(var q=1;q<4;q++){var a=lerp(c.bk[0],c.bk[1],q/4),b2=lerp(c.bk[5],c.bk[2],q/4);sl.push(q%2?[a,b2]:[b2,a]);}var ss=[];sl.forEach(function(x){A(ss,x);});s.push(ss);var se=[];se.push(poly(c.seat));behind(s,se,sol);sol.push(c.seat);var lg=[];lg.push([c.seat[2],[c.seat[2][0],P(c.X-c.d*18,Yh(0),c.u+0.1)[1]]]);lg.push([c.seat[3],[c.seat[3][0],P(c.X-c.d*18,Yh(0),c.u)[1]]]);behind(s,lg,sol);}});
  lamps.forEach(function(l){FS(s,sol,l.sh,1.1,0);s.push(poly(l.stem));sol.push(l.stem);s.push(EP(l.b[0],l.b[1],5*l.sc,1.6*l.sc).concat([[l.b[0]+5*l.sc,l.b[1]]]));var gl=[];for(var r=0;r<3;r++){var a=PI*(0.25+r*0.25);gl.push([[l.b[0]+8*l.sc*Math.cos(a)*1.4,l.b[1]-18*l.sc+6*l.sc*Math.sin(a)],[l.b[0]+16*l.sc*Math.cos(a)*1.4,l.b[1]-18*l.sc+12*l.sc*Math.sin(a)]]);}});
  var bk=[];for(var o=0;o<3;o++){var u=u0+0.08+o*0.22,X=o%2?tX0+18:tX1-30,c=P(X,tY,u),sc=1-(1-k)*u,L=[[c[0]-10*sc,c[1]],[c[0],c[1]-2*sc],[c[0]+10*sc,c[1]],[c[0],c[1]+2.5*sc]];var ob=[c,[c[0]-10*sc,c[1]+0.5],[c[0]-9*sc,c[1]-3*sc],[c[0],c[1]-2*sc],[c[0]+9*sc,c[1]-3*sc],[c[0]+10*sc,c[1]+0.5],c];bk.push(ob);}
  var tt=[];tt.push(poly(top));var thick=[top[0],[top[0][0],top[0][1]+4],[top[1][0],top[1][1]+4],top[1]];tt.push(thick);A(tt,bk);
  var gr=[];for(var g=1;g<6;g++){var a=lerp(top[0],top[3],g/6),b3=lerp(top[1],top[2],g/6);gr.push(g%2?[a,b3]:[b3,a]);}var gs=[];gr.forEach(function(x){A(gs,x);});tt.push(gs);
  [[tX0,u0+0.03],[tX1,u0+0.03],[tX0,u1-0.03],[tX1,u1-0.03]].forEach(function(q){var a=P(q[0],tY,q[1]),b4=P(q[0],196,q[1]);tt.push([[a[0],a[1]+4],b4]);tt.push([[a[0]+2,a[1]+4],[b4[0]+2,b4[1]]]);});
  behind(s,tt,sol);sol.push(top.concat([]));sol.push([top[0],top[1],[top[1][0],P(tX1,196,u0)[1]],[top[0][0],P(tX0,196,u0)[1]]]);
  chairs.forEach(function(c){if(c.u>=0.2){var ch=[];ch.push(poly(c.bk));ch.push(poly(c.seat));behind(s,ch,sol);sol.push(c.bk);}});
  // globe on stand, front corner
  var gx=RR(R,34,46),gyb=192,gr2=RR(R,17,20),gc=[gx,gyb-38-gr2];
  var G=EP(gc[0],gc[1],gr2,gr2);FS(s,sol,G);s.push(arc(gc[0],gc[1],gr2+4,gr2+4,PI*0.6,PI*2.1));[0.35,0.7].forEach(function(m){s.push(arc(gc[0],gc[1],gr2*m,gr2,-PI/2,PI/2));});s.push([[gc[0]-gr2,gc[1]],[gc[0]+gr2,gc[1]]]);
  var cont=blob([[gc[0]-8,gc[1]-10],[gc[0]+2,gc[1]-12],[gc[0]+6,gc[1]-2],[gc[0],gc[1]+8],[gc[0]-6,gc[1]+2]],4);s.push(poly(cont));H(s,cont,1.2,30);
  var stand=[[gc[0],gc[1]+gr2],[gc[0],gyb-14]];s.push(stand);[-1,0,1].forEach(function(d){s.push([[gc[0],gyb-14],[gc[0]+d*16,gyb]]);});sol.push(RP(gc[0]-2,gc[1]+gr2,gc[0]+2,gyb));sol.push([[gc[0],gyb-14],[gc[0]-16,gyb],[gc[0]+16,gyb]]);
  // rolling ladder on the right wall
  var lb=P(296-24,196,0.26),lt=P(296,Yh(0.88),0.4),lb2=P(296-24,196,0.36),lt2=P(296,Yh(0.88),0.5);var LR=[lb,lt,lt2,lb2];SOL(s,sol,LR);s.push([lb,lt]);s.push([lb2,lt2]);
  var rg=[];for(var q2=1;q2<12;q2++){var a5=lerp(lb,lt,q2/12),b5=lerp(lb2,lt2,q2/12);rg.push(q2%2?[a5,b5]:[b5,a5]);}var rs=[];rg.forEach(function(x){A(rs,x);});s.push(rs);s.push(circle(lb[0],lb[1]-2,2));s.push(circle(lb2[0],lb2[1]-2,2));
  // ---- background: bookshelves on both side walls with a gallery ----
  var hg=RR(R,0.52,0.56),lower=[0,0.1,0.21,0.32,0.43,hg-0.02],upper=[hg+0.1,hg+0.2,hg+0.3,0.97];
  function rowBooks(X,h0,h1,side){var p=[],u=0.02,dir=1;while(u<0.985){var sc=1-(1-k)*u,w=RR(R,3.2,5.5),du=w*sc/((Math.abs(X-VX))*(1-k))*1.0;var u2=Math.min(0.99,u+du*Math.abs(X-VX)/Math.abs(X-VX));
      var hh=h0+(h1-h0)*RR(R,0.68,0.92),b0=P(X,Yh(h0),u),t0=P(X,Yh(hh),u),t1=P(X,Yh(hh),u2),b1=P(X,Yh(h0),u2);
      if(dir>0)p.push(b0,t0,t1,b1);else p.push(t0,b0,b1,t1);dir=-dir;if(R()<0.05)H(bg,[b0,t0,t1,b1],0.9,90);u=u2;}
    return p;}
  [4,296].forEach(function(X){var all=lower.concat(upper);all.forEach(function(h){bg.push([P(X,Yh(h),0),P(X,Yh(h),1)]);});
    for(var j=0;j<lower.length-1;j++)bg.push(rowBooks(X,lower[j]+0.004,lower[j+1]-0.004));for(var j2=0;j2<upper.length-1;j2++)bg.push(rowBooks(X,upper[j2]+0.004,upper[j2+1]-0.004));
    var gf=[P(X,Yh(hg),0),P(X,Yh(hg),1),P(X,Yh(hg+0.04),1),P(X,Yh(hg+0.04),0)];H(bg,gf,1.4,0);bg.push(poly(gf));
    var rl=[P(X,Yh(hg+0.1),0),P(X,Yh(hg+0.1),1)];var bal=[P(X,Yh(hg+0.04),0)];for(var u3=0.03;u3<1;u3+=0.03){bal.push(P(X,Yh(hg+0.04),u3),P(X,Yh(hg+0.1),u3),P(X,Yh(hg+0.04),u3));}bg.push(bal);
    var pil=[];for(var pu=0.25;pu<1;pu+=0.25){pil.push([P(X,Yh(0),pu),P(X,Yh(hg),pu)]);}A(bg,pil);});
  // back wall: tall arched window with leaded panes, flanked by bookcases
  var ww=(bx1-bx0)*0.2,wb=by1-(by1-by0)*0.18,wt=by0+(by1-by0)*0.16,W=archP(VX,wb,ww,wb-wt-ww);bg.push(W);
  var pane=[];H(pane,RP(VX-ww,wt-ww,VX+ww,wb),3.2,45);H(pane,RP(VX-ww,wt-ww,VX+ww,wb),3.2,-45);var pc=[];clipIn(pc,pane,W);A(bg,pc);bg.push([[VX,wb],[VX,wt-ww+2]]);bg.push([[VX-ww,wb-(wb-wt)*0.5],[VX+ww,wb-(wb-wt)*0.5]]);bg.push(rect(VX-ww-3,wb,VX+ww+3,wb+3));
  [-1,1].forEach(function(d){var x0=d<0?bx0+4:VX+ww+8,x1=d<0?VX-ww-8:bx1-4,yt2=by0+6,yb2=by1;bg.push(rect(x0,yt2,x1,yb2));var nr=5;for(var r3=1;r3<nr;r3++){var y=yt2+(yb2-yt2)*r3/nr;bg.push([[x0,y],[x1,y]]);}
    for(var r4=0;r4<nr;r4++){var y0=yt2+(yb2-yt2)*r4/nr,y1=yt2+(yb2-yt2)*(r4+1)/nr,zp=[],dd=1;for(var x=x0+1.5;x<x1-1;x+=RR(R,1.6,2.6)){var yy=y0+(y1-y0)*RR(R,0.15,0.3);if(dd>0)zp.push([x,y1],[x,yy]);else zp.push([x,yy],[x,y1]);dd=-dd;}bg.push(zp);}});
  bg.push(rect(bx0,by0,bx1,by1));
  // ceiling beams and coffers
  var cb=[],dd2=1;for(var cx2=4+292/16;cx2<296;cx2+=292/8){var a6=[cx2,4],b6=P(cx2,4,1);if(dd2>0)cb.push(a6,b6);else cb.push(b6,a6);dd2=-dd2;}bg.push(cb);
  [0.3,0.55,0.75,0.9].forEach(function(u){bg.push([P(4,4,u),P(296,4,u)]);});
  // floor: perspective boards and cross joints
  var fl=[],dd3=1;for(var fx=4;fx<=296.1;fx+=292/22){var a7=[fx,196],b7=P(fx,196,1);if(dd3>0)fl.push(a7,b7);else fl.push(b7,a7);dd3=-dd3;}bg.push(fl);
  [0.15,0.32,0.5,0.66,0.8,0.92].forEach(function(u){bg.push([P(4,196,u),P(296,196,u)]);});
  // corner lines
  [[4,4],[296,4],[4,196],[296,196]].forEach(function(c){bg.push([c,P(c[0],c[1],1)]);});
  behind(s,bg,sol);
  // dust in the window light (short strokes touching the window base)
  return s.filter(function(x){return x&&x.length>1;});}};


return {number:12,startedOn:"2026-11-22",notes:"Batch 12 (Nov 22). Review of Nov 20-21 plays: Bird's nest with eggs (Super Sketch, type 2) held up well over its 20 minutes. Strong: kasbah tower, chesterfield sofa, gong, nesting dolls, diving helmet, lych gate, banjo barometer, basalt columns, stilted granary, garbage truck. Weak: waterspout sparse and muddled, pruning shears lost in the sky lines again, baguettes read as spikes, dancing cranes and hornbill unreadable, cardinal and garlic sparse, narwhal crossed by light rays, cow and hare crude. Lessons kept: one line, keep extras touching; clip backgrounds with behind()/clipIn(); animals need a bold smooth silhouette (blob) with clean legs and one shaded side; never cover the subject with all-over hatch or rays; dozens of small closed shapes wreck the planner - use one-stroke zigzags and loops; small objects must be drawn big; a 'tiles' wall doubles the time, so use stripes behind busy still lifes. Daily Super Sketch: Library reading room, a one-point-perspective interior with no sky (type 1); previous two were Kelp forest (type 4) and Bird's nest with eggs (type 2).",master:MASTER||undefined,subjects:SUBJ};
})();
