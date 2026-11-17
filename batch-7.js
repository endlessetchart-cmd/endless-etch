// Endless Etch — batch 7. 48 subjects for 2026-11-17 (each plays about three times, shuffled per round) plus the Daily Super Sketch.
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

// ---- chunk A: buildings, places, landscapes, plants ----
S('Round barn',['Twelve-Sided Barn','Hay Under the Dome','Circle of Stalls','Prairie Rotunda','Cupola and Vane'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,160,166),cx=RR(R,125,160),w=RR(R,56,62),h=RR(R,46,52),top=gy-h,ry=w*0.2;
  var body=[[cx-w,top],[cx-w,gy]].concat(arc(cx,gy,w,ry,PI,0)).concat([[cx+w,top]]).concat(arc(cx,top,w,ry,0,PI).slice(1));SOL(s,sol,body);
  clipIn(s,[boardsC(cx,w,top-ry-2,gy+ry+2,RI(R,22,26))],body,[]);
  H(s,[[cx+w*0.45,top+ry*0.9],[cx+w,top],[cx+w,gy],[cx+w*0.45,gy+ry*0.9]],RR(R,1.6,2),RR(R,-70,-50));
  var ch=RR(R,40,46),rf=curve([[cx-w-6,top+2],[cx-w+6,top-ch*0.45],[cx-w*0.5,top-ch*0.85],[cx-11,top-ch]],8),rr=rf.map(function(p){return [2*cx-p[0],p[1]];}).reverse();
  var roof=rf.concat(rr).concat(arc(cx,top+2,w+6,ry+1,0,PI).slice(1));FS(s,sol,roof,RR(R,2,2.4),RR(R,15,30));
  for(var k=1;k<6;k++){var t=k/6,x0=cx-w-6+(2*w+12)*t;s.push(quad([x0,top+2+ry*Math.sin(PI*t)],[cx+(x0-cx)*0.7,top-ch*0.7],[cx+(x0-cx)*0.15,top-ch]));}
  var cu=RP(cx-11,top-ch,cx+11,top-ch-14);FS(s,sol,cu);s.push(zz(cx-9,cx+9,top-ch-12,top-ch-2,3));var cr=[[cx-14,top-ch-14],[cx,top-ch-26],[cx+14,top-ch-14]];FS(s,sol,poly(cr).slice(0,-1),1.4,0);
  s.push([[cx,top-ch-26],[cx,top-ch-40]]);s.push([[cx-8,top-ch-36],[cx+8,top-ch-36],[cx+5,top-ch-38]]);
  var dw=RR(R,13,16),D=RP(cx-dw,gy+ry,cx+dw,gy-34);FS(s,sol,D);s.push([[cx-dw,gy+ry],[cx+dw,gy-34]],[[cx+dw,gy+ry],[cx-dw,gy-34]],[[cx,gy-34],[cx,gy+ry]]);
  [0.22,0.36,0.64,0.78].forEach(function(f){var x=cx-w*Math.cos(f*PI),wy=top+h*0.3;var Wn=RP(x-3.5,wy,x+3.5,wy+9);s.push(poly(Wn));H(s,Wn,1.2,45);});
  var sx=cx+w+RR(R,18,26),sr=RR(R,12,15),shh=RR(R,92,104);if(sx+sr<292){cyl(s,sx,gy,sr,shh,1.8,1);sol.push(RP(sx-sr,gy+4,sx+sr,gy-shh-sr*0.3));s.push(arc(sx,gy-shh,sr,sr*0.9,PI,TAU));for(var j=1;j<7;j++)s.push(arc(sx,gy-shh*j/7,sr,sr*0.28,0,PI));}
  s.push(comb(6,cx-w-8,gy+10,10,8));s.push([[6,gy+6],[cx-w-8,gy+6]]);
  hills(bg,R,gy-10,RR(R,20,30),RR(R,4.4,5.2),[],RR(R,8,18));gnd(bg,R,gy);
  return fin(s,R,bg,sol,gy-14);});

S('Gabled canal houses',['Seven Gables','Hoist Beams','Lean on Your Neighbour','Canal Ring, Morning','Narrow and Tall'],function(R){
  var s=[],sol=[],bg=[],qy=RR(R,138,144),x=RR(R,6,14),i=0;
  while(x<280){var w=Math.min(292-x,RR(R,36,46)),hh=RR(R,78,104),ty=qy-hh,kind=i%3===(R()<0.5?0:1)?'step':pick(R,['bell','neck','step','spout']),gtop=ty-RR(R,18,24),cx=x+w/2,G;
    if(kind==='step'){G=[[x,qy],[x,ty]];var st=4,sw=w/(2*st+1);for(var k=0;k<st;k++){var yy=ty-(gtop-ty)*-(k+1)/(st+1);G.push([x+sw*k+sw*0.0,yy],[x+sw*(k+1),yy]);}G.push([x+sw*st,gtop],[x+w-sw*st,gtop]);for(var k2=st-1;k2>=0;k2--){var y2=ty-(gtop-ty)*-(k2+1)/(st+1);G.push([x+w-sw*(k2+1),y2],[x+w-sw*k2,y2]);}G.push([x+w,ty],[x+w,qy]);}
    else if(kind==='bell'){G=[[x,qy],[x,ty]].concat(cubic([x,ty],[x+w*0.05,ty-8],[cx-w*0.32,ty-6],[cx-w*0.22,gtop+4],10)).concat(arc(cx,gtop+4,w*0.22,5,PI,TAU)).concat(cubic([cx+w*0.22,gtop+4],[cx+w*0.32,ty-6],[x+w*0.95,ty-8],[x+w,ty],10)).concat([[x+w,qy]]);}
    else if(kind==='neck'){G=[[x,qy],[x,ty],[x+w*0.2,ty],[x+w*0.24,ty-10],[cx-w*0.26,ty-10],[cx-w*0.26,gtop+4]].concat(arc(cx,gtop+4,w*0.26,6,PI,TAU)).concat([[cx+w*0.26,ty-10],[x+w*0.76,ty-10],[x+w*0.8,ty],[x+w,ty],[x+w,qy]]);}
    else G=[[x,qy],[x,ty],[cx,gtop],[x+w,ty],[x+w,qy]];
    SOL(s,sol,G);s.push([[x,ty],[x+w,ty]]);
    var nc=w>40?3:2,cw=w/(nc+0.6),holes=[],fl=Math.min(4,Math.floor((hh-22)/18));
    for(var f=0;f<fl;f++)for(var c=0;c<nc;c++){var wx=x+cw*0.45+c*cw,wy=ty+6+f*18,ww=cw*0.6,W=RP(wx,wy,wx+ww,wy+12);holes.push(W);s.push([[wx,wy],[wx+ww,wy],[wx+ww,wy+12],[wx,wy+12],[wx,wy],[wx+ww/2,wy],[wx+ww/2,wy+12],[wx+ww/2,wy+6],[wx,wy+6],[wx+ww,wy+6]]);}
    var dx=cx-5,Dr=RP(dx,qy,dx+10,qy-16);holes.push(Dr);s.push(poly(Dr));H(s,Dr,1.3,90);s.push([[dx-3,qy],[dx-3,qy-3],[dx+13,qy-3],[dx+13,qy]]);
    s.push([[cx,gtop+6],[cx,gtop+12],[cx+6,gtop+12]]);
    if(i%3===0)HX(s,[G.slice(0,-1).concat([[x,qy]])].concat(holes),RR(R,3.4,4),RR(R,30,60)*sgn(R));
    x+=w;i++;}
  var Q=RP(4,qy,296,qy+8);FS(s,sol,Q);s.push(brickS(4,qy,296,qy+8,9,4));
  var tx=RR(R,30,270),tr=[];treeR(tr,R,tx,qy,RR(R,16,20),2.2);A(s,tr);
  waterIn(bg,R,RP(4,qy+8,296,196),qy+12,194,RR(R,6,6.8));
  for(var r=0;r<3;r++){var rx=RR(R,20,260);bg.push([[rx,qy+12+r*14],[rx+RR(R,16,30),qy+12+r*14]]);}
  var bx=RR(R,40,200);s.push([[bx,qy+30],[bx+44,qy+30],[bx+50,qy+24],[bx-4,qy+24],[bx,qy+30]]);sol.push(poly([[bx,qy+30],[bx+44,qy+30],[bx+50,qy+24],[bx-4,qy+24]]));H(s,[[bx,qy+30],[bx+44,qy+30],[bx+50,qy+24],[bx-4,qy+24]],1.4,0);
  return fin(s,R,bg,sol,qy-2);});

S('Stupa with prayer flags',['White Dome, Blue Wind','Prayers on the Line','Above the Valley','Thirteen Rings','Pass at Dawn'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,170,176),cx=RR(R,130,170);
  var t1=RP(cx-64,gy,cx+64,gy-10),t2=RP(cx-54,gy-10,cx+54,gy-20),t3=RP(cx-46,gy-20,cx+46,gy-28);[t1,t2,t3].forEach(function(T,i){FS(s,sol,T);H(s,RP(T[0][0]+((i%2)?0:1)*((T[1][0]-T[0][0])*0.7),T[0][1],T[1][0],T[2][1]),1.8,90);});
  s.push(brickS(cx-64,gy-10,cx+64,gy,8,5));
  var dr=RR(R,38,42),dy=gy-28,dome=[[cx-dr,dy]].concat(arc(cx,dy,dr,dr*0.95,PI,TAU)).concat([[cx+dr,dy]]);SOL(s,sol,dome);
  H(s,[[cx+dr*0.3,dy]].concat(arc(cx,dy,dr,dr*0.95,-PI*0.42,0)).concat([[cx+dr*0.3,dy]]),RR(R,2,2.4),-70);
  var hy=dy-dr*0.95,hm=RP(cx-11,hy,cx+11,hy-12);FS(s,sol,hm);s.push(ellipse(cx-5,hy-6,3,1.8),ellipse(cx+5,hy-6,3,1.8));H(s,RP(cx-11,hy-12,cx+11,hy-14),1,0);
  var sp=[[cx-10,hy-14],[cx-3,hy-58],[cx+3,hy-58],[cx+10,hy-14]];FS(s,sol,sp);var rg=[];for(var k=1;k<13;k++){var yy=hy-14-44*k/13,ww=10-7*k/13;rg.push(k%2?[cx-ww,yy]:[cx+ww,yy],k%2?[cx+ww,yy]:[cx-ww,yy]);}s.push(rg);
  var um=[[cx-9,hy-58],[cx,hy-66],[cx+9,hy-58]];FS(s,sol,um,1.2,0);s.push([[cx,hy-66],[cx,hy-74]]);s.push(circle(cx,hy-76,2));
  var top=[cx,hy-60];s.push(flagLine(top,[RR(R,8,20),gy-RR(R,4,10)],RR(R,6,12),RI(R,9,11),5));s.push(flagLine(top,[RR(R,280,292),gy-RR(R,4,10)],RR(R,6,12),RI(R,9,11),5));
  s.push(flagLine([cx-46,gy-28],[RR(R,30,50),gy],4,4,4));
  for(var e=0;e<4;e++){var ex=cx-30+e*20;s.push(archP(ex,dy,3,3));}
  peaks(bg,R,gy-24,RR(R,70,90),RI(R,3,4),RR(R,2.4,3));gnd(bg,R,gy,RR(R,3.6,4.4));
  return fin(s,R,bg,sol,gy-30);});

S('Farmhouse with a wraparound porch',['Sweet Tea Porch','Swing at the Corner','Screen Door Summer','White Clapboard','Two Rockers Waiting'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,168,174),x0=RR(R,58,82),w=RR(R,124,136),h=RR(R,66,72),ty=gy-h,dpt=RR(R,30,36),pr=gy-28;
  var F=RP(x0,gy,x0+w,ty);SOL(s,sol,F);var sd=[[x0+w,gy],[x0+w+dpt,gy-dpt*0.5],[x0+w+dpt,ty-dpt*0.5],[x0+w,ty]];SOL(s,sol,sd);
  var rf=[[x0-6,ty],[x0+w*0.5,ty-RR(R,40,46)],[x0+w+6,ty]];var rP=rf.concat([[x0+w+6+dpt,ty-dpt*0.5],[x0+w*0.5+dpt,rf[1][1]-dpt*0.5]]);FS(s,sol,rP,RR(R,2,2.4),RR(R,60,75));s.push([[x0+w+6,ty],[x0+w*0.5,rf[1][1]]]);
  var gh=[];var cl=[];for(var yy=ty+5;yy<gy;yy+=4)cl.push([[x0+w,yy],[x0+w+dpt,yy-dpt*0.5]]);clipIn(s,cl,sd,[]);
  var holes=[];[[0.12,ty+8],[0.42,ty+8],[0.72,ty+8],[0.12,pr-30],[0.72,pr-30]].forEach(function(q){var wx=x0+w*q[0],W=RP(wx,q[1],wx+16,q[1]+20);holes.push(W);win(s,wx,q[1],16,20,1.6);s.push([[wx-2,q[1]-2],[wx+18,q[1]-2]]);});
  var aw=RP(x0+w*0.42,ty-RR(R,22,26),x0+w*0.42+16,ty-8);
  var cbd=[];for(var y=ty+4;y<gy;y+=3.4)cbd.push([[x0,y],[x0+w,y]]);behind(s,[].concat(cbd.reduce(function(a,b){return a.concat([b]);},[])),holes.concat([RP(x0-8,pr,x0+w+8,gy+2)]));
  var Pr=[[x0-12,pr],[x0+w+12,pr],[x0+w+12+dpt*0.8,pr-dpt*0.4],[x0+w+12+dpt*0.8,pr-dpt*0.4-6],[x0+w+12,pr-6],[x0-12,pr-6]];SOL(s,sol,Pr);H(s,Pr,1.4,0);
  var deck=gy-4,posts=[];for(var px=x0-10;px<=x0+w+12;px+=RR(R,20,24))posts.push(px);posts.forEach(function(px){var P=RP(px,deck,px+3,pr);SOL(s,sol,P);});
  for(var j=1;j<3;j++){var qx=x0+w+12+dpt*0.8*j/2,qy=pr-dpt*0.4*j/2;s.push(rect(qx,qy,qx+3,deck-dpt*0.4*j/2));}
  s.push(comb(x0-10,x0+w*0.4,deck-11,11,4));s.push(comb(x0+w*0.62,x0+w+12,deck-11,11,4));s.push([[x0-10,deck-11],[x0+w*0.4,deck-11]],[[x0+w*0.62,deck-11],[x0+w+12,deck-11]]);
  var dw=RP(x0+w*0.47,deck,x0+w*0.47+14,deck-26);FS(s,sol,dw,1.6,90);
  var D=[[x0-14,deck],[x0+w+14,deck],[x0+w+14,gy+2],[x0-14,gy+2]];FS(s,sol,D);s.push(zz(x0-14,x0+w+14,deck,gy+2,3));
  for(var st=0;st<3;st++){var sx=x0+w*0.43-st*2,sy=gy+2+st*4;s.push(rect(sx,sy,sx+24+st*4,sy+4));}
  var ch=RP(x0+w*0.75,ty-24,x0+w*0.75+10,ty-46);FS(s,sol,ch);s.push(brickS(x0+w*0.75,ty-46,x0+w*0.75+10,ty-24,5,3));
  var rc=x0+w*0.2;s.push([[rc,deck],[rc-2,deck-14],[rc+8,deck-14],[rc+10,deck],[rc+2,deck+1],[rc+12,deck+1]]);s.push([[rc-2,deck-14],[rc-4,deck-28],[rc+6,deck-28],[rc+8,deck-14]]);
  var tx=x0>70?RR(R,14,34):RR(R,250,280);if(tx>250&&x0+w+dpt+20>tx)tx=RR(R,14,34);treeR(s,R,tx,gy,RR(R,18,24),2.2);
  hills(bg,R,gy-12,RR(R,20,30),RR(R,4.4,5),[],RR(R,8,18));gnd(bg,R,gy+2,RR(R,3.6,4.2));
  return fin(s,R,bg,sol,gy-16);});

S('Steel truss bridge',['Rivets Over the River','Through Truss','Pratt and Pier','Iron Span, Low Water','Freight Crossing'],function(R){
  var s=[],sol=[],bg=[],dk=RR(R,110,118),th=RR(R,30,36),wl=dk+RR(R,26,32),x0=RR(R,30,42),x1=RR(R,258,270),n=RI(R,8,10),pw=(x1-x0)/n;
  s.push([[x0,dk],[x1,dk]]);var Dk=RP(x0-4,dk,x1+4,dk+6);FS(s,sol,Dk,1.5,0);
  var tc=[[x0,dk],[x0+pw,dk-th]];for(var i=1;i<n-1;i++)tc.push([x0+pw*(i+1),dk-th]);tc.push([x1,dk]);s.push(tc);s.push(tc.map(function(p){return [p[0],p[1]-2.5];}));
  var z=[];for(var j=1;j<n;j++){var xx=x0+pw*j;z.push([xx,dk],[xx,dk-th]);var nx=x0+pw*(j+(j<n/2?-1:1)),ny=(j+(j<n/2?-1:1)===0||j+(j<n/2?-1:1)===n)?dk:dk-th;if(j<n/2)z.push([nx+pw*2,ny===dk?dk:dk]);}
  var web=[];for(var k=1;k<n;k++){var xa=x0+pw*k;web.push([xa,dk-th],[xa,dk]);var xb=x0+pw*(k+1);if(k<n-1)web.push(k<n/2?[xb,dk]:[xa,dk],k<n/2?[xb,dk-th]:[xb,dk-th]);}
  for(var m=1;m<n;m++){var xm=x0+pw*m;s.push([[xm,dk],[xm,dk-th]]);if(m<n/2)s.push([[xm-pw,dk],[xm,dk-th]]);else s.push([[xm+pw,dk],[xm,dk-th]]);}
  s.push([[x0+pw*Math.floor(n/2),dk],[x0+pw*Math.floor(n/2+0.5),dk-th]]);
  for(var r2=0;r2<n;r2++){var xr=x0+pw*r2+pw/2;s.push(circle(xr,dk+3,0.8));}
  var piers=[x0,x1,(x0+x1)/2];piers.forEach(function(px,i){var pwd=i<2?14:10,P=[[px-pwd,dk+6],[px+pwd,dk+6],[px+pwd+3,wl+8],[px-pwd-3,wl+8]];FS(s,sol,P);s.push(brickS(px-pwd,dk+6,px+pwd,wl,7,4));H(s,[[px+pwd*0.3,dk+6],[px+pwd,dk+6],[px+pwd+3,wl+8],[px+pwd*0.3,wl+8]],1.3,90);});
  var lb=[[4,dk+6],[x0-10,dk+6],[x0-2,wl+6],[4,wl+16]],rb=[[296,dk+6],[x1+10,dk+6],[x1+2,wl+6],[296,wl+16]];FS(s,sol,lb,RR(R,2.6,3),30);FS(s,sol,rb,RR(R,2.6,3),-30);
  if(R()<0.6){var tl=RR(R,x0+30,x1-110),ty=dk-2;var cars=RI(R,3,4);for(var c=0;c<cars;c++){var cx0=tl+c*26,C=RP(cx0,ty,cx0+24,ty-14);FS(s,sol,C,c===0?0:2,90);s.push(circle(cx0+5,ty+0,2),circle(cx0+19,ty,2));}var lc=RP(tl-30,ty,tl-2,ty-16);FS(s,sol,lc,1.6,0);s.push(RP(tl-10,ty-16,tl-4,ty-22));}
  var trees=[];for(var t=0;t<RI(R,2,3);t++)pineT(trees,RR(R,8,x0-14),dk+6,RR(R,0.9,1.2),1.8);for(var t2=0;t2<RI(R,2,3);t2++)pineT(trees,RR(R,x1+14,292),dk+6,RR(R,0.9,1.2),1.8);A(s,trees);
  waterIn(bg,R,RP(4,wl,296,196),wl+3,194,RR(R,5.6,6.4));bg.push([[4,wl],[296,wl]]);
  var rf=[];piers.forEach(function(px){for(var q=0;q<4;q++)rf.push([[px-8+RR(R,-2,2),wl+12+q*8],[px+8+RR(R,-2,2),wl+12+q*8]]);});A(bg,rf);
    return fin(s,R,bg,sol,dk-20);});

S("Shepherd's hut",['Lambing Season','Hut on Iron Wheels','Stove Lit, Hill Quiet','Curved Tin Roof','Summer Pasture'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,168,174),x0=RR(R,70,100),w=RR(R,110,124),bb=gy-22,h=RR(R,40,46),ty=bb-h;
  var B=RP(x0,bb,x0+w,ty);SOL(s,sol,B);clipIn(s,[zz(x0,x0+w,ty,bb,RR(R,3.2,3.8))],B,[]);
  var rf=[[x0-8,ty+2]].concat(arc(x0+w/2,ty+2,w/2+8,RR(R,18,22),PI,TAU)).concat([[x0+w+8,ty+2]]);var rP=rf.concat([[x0-8,ty+2]]);SOL(s,sol,rf);
  var ribs=[],d=1;for(var i=0;i<=24;i++){var xx=x0-8+(w+16)*i/24,yt=interpY(rf,xx);if(d>0)ribs.push([xx,ty+2],[xx,yt]);else ribs.push([xx,yt],[xx,ty+2]);d=-d;}s.push(ribs);
  var holes=[];var wx=x0+w*RR(R,0.15,0.25),W=RP(wx,ty+8,wx+20,ty+24);FS(s,sol,W);win(s,wx,ty+8,20,16,1.6);
  var dx=x0+w*0.66,D=RP(dx,bb,dx+18,ty+6);FS(s,sol,D);s.push(rect(dx+2,ty+9,dx+16,ty+20));H(s,RP(dx+2,ty+9,dx+16,ty+20),1.5,45);s.push(circle(dx+15,ty+26,1.2));
  for(var st=0;st<3;st++){var sy=bb+st*7+2;s.push([[dx-2-st*3,sy+5],[dx+20+st*3,sy+5]]);}s.push([[dx-2,bb],[dx-12,gy]],[[dx+20,bb],[dx+30,gy]]);
  var px=x0+w*0.3;s.push(RP(px,ty-14,px+4,ty-34));s.push([[px-3,ty-34],[px+7,ty-34]]);s.push(curve([[px+2,ty-36],[px+8,ty-44],[px+2,ty-52],[px+12,ty-60]],6));
  var ch=RP(x0-2,bb,x0+w+2,bb+4);FS(s,sol,ch,1.2,0);
  [x0+16,x0+w-16].forEach(function(cx){wheel(s,cx,gy-11,11,8,1.5);});
  s.push([[x0,bb+2],[x0-22,bb+12],[x0-26,bb+12]]);
  var wl=[];wall(wl,R,4,x0-30,gy+8,14,9);A(s,wl);wl=[];wall(wl,R,x0+w+40,296,gy+8,14,9);A(s,wl);sol.push(RP(4,gy+8,x0-30,gy-8),RP(x0+w+40,gy+8,296,gy-8));
  var sh=x0+w+RR(R,10,22),sb=gy+2;var sb2=EP(sh+14,sb-10,14,8);FS(s,sol,sb2);s.push(scallop(sh+14,sb-10,13,7,14,0.15));s.push(EP(sh+30,sb-14,4,5).concat([[sh+30,sb-19]]));H(s,EP(sh+30,sb-14,4,5),1,0);s.push([[sh+6,sb-3],[sh+6,sb+2]],[[sh+22,sb-3],[sh+22,sb+2]]);
  hills(bg,R,gy-18,RR(R,40,54),RR(R,4.2,5),[],RR(R,8,20));gnd(bg,R,gy,RR(R,3.6,4.2));
  return fin(s,R,bg,sol,gy-24);});

S('Lifeboat station with slipway',['Launch Down the Slip','Station on Stilts','Shout at Midnight','Doors Open to the Sea','Volunteer Crew'],function(R){
  var s=[],sol=[],bg=[],sea=RR(R,150,156),hx=RR(R,30,60),hw=RR(R,92,104),fl=RR(R,104,112),hh=RR(R,34,40);
  var H0=RP(hx,fl,hx+hw,fl-hh);SOL(s,sol,H0);s.push(zz(hx,hx+hw,fl-hh,fl,RR(R,3.4,4)));
  var rf=[[hx-6,fl-hh],[hx+hw/2,fl-hh-RR(R,22,26)],[hx+hw+6,fl-hh]];FS(s,sol,poly(rf).slice(0,-1),RR(R,1.8,2.2),70);
  var dX=hx+hw*0.6,Dr=RP(dX,fl,hx+hw-6,fl-hh+6);FS(s,sol,Dr,1.4,90);s.push(win(s,hx+8,fl-hh+8,18,12,0)&&[]);
  var lc=[hx+hw/2,fl-hh-14];s.push(RP(lc[0]-4,lc[1]+6,lc[0]+4,lc[1]-4));s.push([[lc[0],lc[1]-4],[lc[0],lc[1]-26]],[[lc[0],lc[1]-26],[lc[0]+14,lc[1]-22],[lc[0],lc[1]-18]]);
  var pl=[];for(var p=hx+4;p<=hx+hw;p+=RR(R,14,18))pl.push(p);pl.forEach(function(px){var P=RP(px,fl,px+3,sea+20);SOL(s,sol,P);});for(var c=0;c+1<pl.length;c++){s.push([[pl[c]+1.5,fl+4],[pl[c+1]+1.5,sea-4]],[[pl[c+1]+1.5,fl+4],[pl[c]+1.5,sea-4]]);}
  var sx0=hx+hw,sx1=RR(R,250,272),sl=[[sx0,fl],[sx1,sea+18],[sx1,sea+24],[sx0,fl+6]];FS(s,sol,sl);var rl=[];for(var k=0;k<14;k++){var t=k/14;rl.push([[sx0+(sx1-sx0)*t,fl+(sea+18-fl)*t],[sx0+(sx1-sx0)*t,fl+6+(sea+18-fl)*t]]);}A(s,rl);
  for(var q=1;q<4;q++){var t2=q/4,qx=sx0+(sx1-sx0)*t2,qy=fl+6+(sea+18-fl)*t2;s.push([[qx,qy],[qx,sea+24]]);}
  var bt=RR(R,0.18,0.4),bx=sx0+(sx1-sx0)*bt,by=fl+(sea+18-fl)*bt,ang=Math.atan2(sea+18-fl,sx1-sx0),bl=46;
  var boat=[[0,0],[bl,0],[bl+6,-12],[-4,-12]].map(function(p){return [p[0],p[1]];}),cab=[[10,-12],[30,-12],[28,-22],[12,-22]];
  var Bt=rotateAbout(translate(boat,bx,by-1),bx,by,ang),Cb=rotateAbout(translate(cab,bx,by-1),bx,by,ang);FS(s,sol,Bt,1.5,ang*180/PI);FS(s,sol,Cb);s.push(rotateAbout([[bx+20,by-23],[bx+20,by-34]],bx,by,ang));
  var cl=[[4,sea],[4,RR(R,60,80)],[RR(R,20,30),RR(R,50,64)],[hx-4,fl-hh-30],[hx-2,fl],[hx+4,sea]];FS(s,sol,cl,RR(R,2.2,2.6),RR(R,50,70));for(var str=0;str<4;str++){var yy=RR(R,70,sea-10);s.push([[4,yy],[Math.min(hx-4,RR(R,16,hx-6)),yy+RR(R,-4,4)]]);}
  waterIn(bg,R,RP(4,sea,296,196),sea+3,194,RR(R,4.4,5.2));bg.push([[4,sea],[296,sea]]);
  return fin(s,R,bg,sol,sea-6);});

S('Maple tree in autumn',['October Blaze','Leaves Let Go','Raked Into Piles','Red Before Bare','Last Warm Week'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,166,172),cx=RR(R,135,165),cy=RR(R,80,90),rx=RR(R,92,104),ry=RR(R,58,66);
  var tr=[[cx-7,gy],[cx-5,cy+30],[cx-20,cy+10],[cx-14,cy+8],[cx-2,cy+24],[cx+2,cy+4],[cx+8,cy+6],[cx+5,cy+26],[cx+22,cy+12],[cx+26,cy+16],[cx+7,cy+34],[cx+8,gy]];
  var lobes=[],n=RI(R,9,11);for(var i=0;i<n;i++){var a=PI+0.15+(PI*2-0.3)*i/n+RR(R,-0.1,0.1);lobes.push([cx+rx*0.8*Math.cos(a)*(i%2?1:0.92),cy+ry*0.8*Math.sin(a)*(i%2?1:0.92)]);}
  var crown=blob([[cx-rx,cy+ry*0.35],[cx-rx*0.95,cy-ry*0.3],[cx-rx*0.55,cy-ry*0.85],[cx,cy-ry],[cx+rx*0.55,cy-ry*0.85],[cx+rx*0.95,cy-ry*0.3],[cx+rx,cy+ry*0.35],[cx+rx*0.5,cy+ry*0.62],[cx,cy+ry*0.5],[cx-rx*0.5,cy+ry*0.62]],6);
  var edge=[];for(var k=0;k<crown.length;k+=3){var p=crown[k],q=crown[(k+3)%crown.length];edge.push(p);var m=[(p[0]+q[0])/2,(p[1]+q[1])/2],dd=Math.hypot(m[0]-cx,m[1]-cy)||1;edge.push([m[0]+(m[0]-cx)/dd*3.2,m[1]+(m[1]-cy)/dd*3.2]);}
  SOL(s,sol,edge);s.push(edge.concat([edge[0]]));
  HX(s,[edge],RR(R,3.2,3.6),RR(R,35,55));var br=[];for(var g=0;g<4;g++){var ba=-PI/2+(g-1.5)*0.6;br.push(curve([[cx,cy+30],[cx+rx*0.3*Math.cos(ba),cy+20+ry*0.4*Math.sin(ba)],[cx+rx*0.6*Math.cos(ba),cy+ry*0.6*Math.sin(ba)]],6));}A(s,br);var lv=[];for(var l=0;l<RI(R,14,18);l++){var lx=cx+RR(R,-rx*0.8,rx*0.8),ly=cy+RR(R,-ry*0.7,ry*0.4);if(pip([lx,ly],edge))lv.push(poly(leafStar(lx,ly,RR(R,3,4.5),R()*TAU)));}A(s,lv);
  var T=tr.concat([[cx-7,gy]]);FS(s,sol,tr);H(s,[[cx+1,gy],[cx+1,cy+30],[cx+8,cy+34],[cx+8,gy]],1.2,90);
  var pile=[];for(var pl=0;pl<RI(R,10,14);pl++){var px=RR(R,20,280),py=gy+RR(R,2,22);pile.push(leafStar(px,py,RR(R,3.5,5),R()*TAU));}pile.forEach(function(P){SOL(s,sol,P);s.push(poly(P));});
  var rk=RR(R,30,80)*(R()<0.5?1:-1)+cx;if(rk>20&&rk<280){s.push([[rk,gy+16],[rk+30,gy-24]]);s.push([[rk-6,gy+14],[rk+6,gy+18]]);for(var t=0;t<5;t++)s.push([[rk-6+t*3,gy+14+t],[rk-7+t*3,gy+20+t]]);}
  var fen=[];fen.push(comb(4,296,gy-2,12,9));bg.push([[4,gy-8],[296,gy-8]]);A(bg,fen);
  hills(bg,R,gy-14,RR(R,16,24),RR(R,4.6,5.2),[],RR(R,8,16));gnd(bg,R,gy,RR(R,3.6,4.4));
  return fin(s,R,bg,sol,gy-18);});

S('Wisteria arbor',['Purple Rain in May','Under the Pergola','Hanging Blooms','Path of Lanterns','Heavy With Flower'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,170,176),bt=RR(R,52,60),x0=RR(R,22,40),x1=RR(R,260,278),np=RI(R,3,4);
  var posts=[];for(var i=0;i<np;i++)posts.push(x0+(x1-x0)*i/(np-1));posts.forEach(function(px){var P=RP(px-4,gy,px+4,bt);SOL(s,sol,P);H(s,RP(px+1,gy,px+4,bt),1.1,90);});
  var bm=RP(x0-14,bt,x1+14,bt-7);FS(s,sol,bm);s.push([[x0-14,bt-3.5],[x1+14,bt-3.5]]);
  var raf=[];for(var x=x0-10;x<=x1+10;x+=RR(R,10,13)){raf.push([[x-2,bt-7],[x+4,bt-16],[x+8,bt-16],[x+2,bt-7]]);}raf.forEach(function(P){s.push(P);});
  var vine=curve([[x0-6,gy],[x0-10,gy-50],[x0+4,bt+20],[x0+30,bt+4],[x0+80,bt-2]],8);s.push(vine);s.push(curve([[x1+6,gy],[x1+10,gy-60],[x1-10,bt+16],[x1-50,bt+2]],8));
  var rc=[];for(var r=x0-8;r<=x1+8;r+=RR(R,6,9)){var L=RR(R,18,40);rc.push(raceme(r,bt,L,RR(R,3,4.5),R));}A(s,rc);
  var leaves=[];for(var lx=x0-12;lx<=x1+12;lx+=6)leaves.push([lx,bt-7-RR(R,2,8)],[lx+3,bt-7]);s.push([[x0-12,bt-7]].concat(leaves));
  var bx=RR(R,x0+30,x1-90),by=gy-6;s.push([[bx,by],[bx,by-14],[bx+60,by-14],[bx+60,by]]);s.push(rect(bx-2,by-16,bx+62,by-13));s.push([[bx+2,by-16],[bx+2,by-30],[bx+58,by-30],[bx+58,by-16]]);s.push(zz(bx+2,bx+58,by-30,by-16,5));sol.push(RP(bx-2,by,bx+62,by-30));
  var ph=[[RR(R,120,140),196],[150-6,gy-26],[150+6,gy-26],[RR(R,160,180),196]];bg.push([[ph[0][0],196],[ph[1][0],gy-26]],[[ph[3][0],196],[ph[2][0],gy-26]]);
  var stn=[],d=1;for(var yy=gy-22;yy<196;yy+=6+(yy-gy+22)*0.12){var f=(yy-gy+26)/(196-gy+26),a=150-6-(150-6-ph[0][0])*f,b=150+6+(ph[3][0]-150-6)*f;if(d>0)stn.push([a,yy],[b,yy]);else stn.push([b,yy],[a,yy]);d=-d;}bg.push(stn);
  for(var sh=0;sh<RI(R,3,5);sh++){var sx=RR(R,8,290),sb=gy-26;bg.push(scallop(sx,sb-6,RR(R,10,16),7,8,0.15));}
  bg.push([[4,gy-26],[296,gy-26]]);var gr=[];gnd(gr,R,gy-26,RR(R,4,4.6));A(bg,gr);
  return fin(s,R,bg,sol,gy-34);});

S('Irises by a stream',['Blue Flags','Iris Bank','Where the Water Bends','Swords and Petals','Early June'],function(R){
  var s=[],sol=[],bg=[],sb=RR(R,120,130);
  var st=[[4,sb+10],[80,sb+4],[150,sb+16],[220,sb+6],[296,sb+12]],st2=st.map(function(p,i){return [p[0],p[1]+RR(R,26,34)+i*4];});
  var bank1=curve(st,8),bank2=curve(st2,8);bg.push(bank1);bg.push(bank2);var W=bank1.concat(bank2.slice().reverse());var ws=[];waterIn(ws,R,W,sb,196,RR(R,5,5.8));A(bg,ws);
  function iris(x,b,h,sc){var top=b-h;s.push(curve([[x,b],[x+RR(R,-3,3),b-h*0.5],[x,top+6*sc]],6));
    var F1=[[x,top+5*sc],[x-12*sc,top+10*sc],[x-16*sc,top+20*sc],[x-9*sc,top+18*sc],[x-2*sc,top+9*sc]],F2=F1.map(function(p){return [2*x-p[0],p[1]];});
    var S1=blob([[x,top+5*sc],[x-7*sc,top-6*sc],[x-2*sc,top-14*sc],[x+1*sc,top-4*sc]],5),S2=S1.map(function(p){return [2*x-p[0],p[1]];});
    [S1,S2].forEach(function(P){FS(s,sol,P,2.2*sc,80);});[F1,F2].forEach(function(P,i){var B=blob(P,4);FS(s,sol,B,2.2*sc,i?30:-30);});
    var Sm=blob([[x-2*sc,top+6*sc],[x,top-16*sc],[x+2*sc,top+6*sc]],4);SOL(s,sol,Sm);s.push(poly(Sm));
    s.push(quad([x,b-h*0.45],[x+10*sc,b-h*0.55],[x+8*sc,b-h*0.75]));var bud=EP(x+8*sc,b-h*0.75-4*sc,2*sc,5*sc);FS(s,sol,bud,1,0);}
  var cnt=RI(R,4,5);for(var i=0;i<cnt;i++){var x=24+i*(252/(cnt-1))+RR(R,-8,8),near=i%2===0,b=near?RR(R,186,194):interpY(bank1,x)+2,h=near?RR(R,96,116):RR(R,62,74);iris(x,b,h,near?1.25:0.85);
    for(var l=0;l<2;l++){var lx=x+RR(R,-12,12),lh=h*RR(R,0.55,0.85),lean=RR(R,-14,14),L=[[lx-2,b],[lx+lean*0.5,b-lh*0.5],[lx+lean,b-lh],[lx+lean*0.5+2,b-lh*0.5],[lx+2,b]];FS(s,sol,L,2,80);}}
  var rk=[];rocks(rk,sol,R,90,210,interpY(bank2,150)+6,12,4);A(s,rk);
  var tf=[];tf.push(tufts(4,296,interpY(bank1,150)-8,10,R));
  hills(bg,R,sb-6,RR(R,30,46),RR(R,4.4,5.2),[],RR(R,10,20));var fl=[];fl.push([[4,sb-6],[296,sb-6]]);A(bg,fl);
  
  return fin(s,R,bg,sol,sb-10);});

S('Poppies in a field',['Red Field, Wide Sky','Paper Petals','Summer Wheat Edge','Nodding Buds','Afternoon of Poppies'],function(R){
  var s=[],sol=[],bg=[],hz=RR(R,94,104);
  function poppy(x,y,r,b,tilt){var P=[];for(var k=0;k<4;k++){var a=tilt+k*PI/2;var c=[x+r*0.6*Math.cos(a),y+r*0.45*Math.sin(a)];P.push(blob([[x,y],[c[0]+r*0.5*Math.cos(a-0.9),c[1]+r*0.4*Math.sin(a-0.9)],[x+r*Math.cos(a),y+r*0.72*Math.sin(a)],[c[0]+r*0.5*Math.cos(a+0.9),c[1]+r*0.4*Math.sin(a+0.9)]],5));}
    var cup=blob([[x-r,y-r*0.2],[x-r*0.8,y-r*0.8],[x-r*0.2,y-r*0.95],[x+r*0.3,y-r*0.9],[x+r,y-r*0.6],[x+r*0.95,y+r*0.1],[x+r*0.4,y+r*0.6],[x-r*0.5,y+r*0.55]],5);FS(s,sol,cup);
    for(var j=0;j<4;j++){var a2=tilt+j*PI/2+PI/4;s.push(quad([x,y],[x+r*0.5*Math.cos(a2),y+r*0.4*Math.sin(a2)],[x+r*0.9*Math.cos(a2),y+r*0.7*Math.sin(a2)],8));}
    var cc=EP(x,y,r*0.26,r*0.22);FS(s,sol,cc,0.9,0);s.push(spiral(x,y,0.3,r*0.32,2,0));
    HX(s,[cup,cc],RR(R,1.6,2),RR(R,-20,20));
    s.push(curve([[x,y+r*0.6],[x+RR(R,-6,6),(y+b)/2],[x+RR(R,-4,4),b]],6));}
  var n=RI(R,4,5);for(var i=0;i<n;i++){var x=30+i*(240/(n-1))+RR(R,-10,10),y=RR(R,104,150),r=RR(R,14,22);poppy(x,y,r,196,R()*PI);}
  for(var b=0;b<RI(R,3,4);b++){var bx=RR(R,20,280),by=RR(R,120,160);s.push(curve([[bx,196],[bx+4,by+20],[bx+10,by]],6));var bd=EP(bx+12,by+3,3,5.5);FS(s,sol,bd,1,30);}
  var gr=[],d=1;for(var yy=hz+4;yy<196;yy+=RR(R,6,9)){var t=tufts(4,296,yy,3+(yy-hz)*0.06,R);if(d<0)t.reverse();A(gr,t);d=-d;}behind(bg,[gr],[]);
  var small=[];for(var q=0;q<RI(R,20,26);q++){var qx=RR(R,8,292),qy=RR(R,hz+4,hz+30);small.push(circle(qx,qy,RR(R,1,2)));}A(bg,small);
  bg.push([[4,hz],[296,hz]]);hills(bg,R,hz,RR(R,14,22),RR(R,4.6,5.4),[],RR(R,8,16));
  return fin(s,R,bg,sol,hz-6);});

S('Pitcher plants',['Bog Trumpets','Hooded and Waiting','Sundew Neighbours','Veins of the Pitcher','Wet Meadow'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,176,182),n=RI(R,4,6);
  for(var i=0;i<n;i++){var x=24+i*(252/(n-1))+RR(R,-8,8),h=RR(R,96,150)*(i%2?0.8:1),top=gy-h,w0=RR(R,4,6),w1=RR(R,13,17),lean=RR(R,-10,10);
    var sp=curve([[x,gy],[x+lean*0.4,gy-h*0.5],[x+lean,top]],10),tb=tube(sp,function(t){return w0+(w1-w0)*Math.pow(t,1.6);});FS(s,sol,tb.P);
    var mouth=EP(x+lean,top,w1,w1*0.35);s.push(poly(mouth));
    var hood=blob([[x+lean-w1,top-1],[x+lean-w1*0.8,top-w1*1.1],[x+lean+w1*0.2,top-w1*1.5],[x+lean+w1*1.1,top-w1*0.8],[x+lean+w1,top]],6);FS(s,sol,hood);
    var vz=[],d=1;for(var t=0.15;t<0.98;t+=0.09){var L=tb.L[Math.round(t*(tb.L.length-1))],Rr=tb.R[Math.round(t*(tb.R.length-1))];if(d>0)vz.push(L,Rr);else vz.push(Rr,L);d=-d;}s.push(vz);
    var hv=[];for(var k=0;k<5;k++){hv.push(curve([[x+lean+w1*(k/5-0.5)*1.6,top-1],[x+lean+w1*(k/5-0.4)*0.9,top-w1*0.9],[x+lean+w1*0.1,top-w1*1.4]],5));}A(s,hv);
    H(s,tb.L.slice(Math.round(tb.L.length*0.2)).concat(sp.slice(Math.round(sp.length*0.2)).reverse()),2.6,70);
    if(R()<0.6){var lx=x+RR(R,6,10),ld=RR(R,24,34);s.push(curve([[x+2,gy],[lx+6,gy-ld*0.5],[lx+14,gy-ld]],5));var fl=EP(lx+14,gy-ld-4,5,4);FS(s,sol,fl,1,45);}}
  var sd=[];for(var q=0;q<RI(R,3,5);q++){var sx=RR(R,10,290),sy=gy-2;sd.push([[sx,sy],[sx+RR(R,-3,3),sy-10]]);sd.push(spiky(sx,sy-12,2.5,2,8,R));}A(s,sd);
  var moss=[],d2=1;for(var yy=gy;yy<196;yy+=4.6){var w=wave(4,296,yy,1.2,8,R()*6);if(d2<0)w.reverse();A(moss,w);d2=-d2;}s.push(moss);s.push([[4,gy],[296,gy]]);
  var gr=[];gr.push(tufts(4,296,gy,RR(R,16,26),R));behind(bg,gr,[]);
  
  return fin(s,R,bg,sol,gy-40);});

S('Hoodoo rock spires',['Goblin Chimneys','Amphitheater at Noon','Caprock and Column','Red Rock Crowd','Frost Carved'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,174,180),n=RI(R,5,6);
  var rim=[[4,RR(R,40,50)]];for(var x=20;x<=296;x+=RR(R,18,30))rim.push([x,RR(R,36,56)]);rim.push([296,RR(R,40,50)]);bg.push(rim);var rimP=rim.concat([[296,100],[4,100]]);var rh=[];var rz=[],d=1;for(var y=40;y<100;y+=RR(R,6.5,8)){if(d>0)rz.push([4,y],[296,y]);else rz.push([296,y],[4,y]);d=-d;}clipIn(bg,[rz],rimP,[]);
  var order=[];for(var i=0;i<n;i++)order.push(i);
  order.forEach(function(i){var near=i%2===0,x=14+i*(272/(n-1))+RR(R,-8,8),b=near?gy+RR(R,0,8):gy-RR(R,16,26),h=near?RR(R,100,130):RR(R,70,96),w=near?RR(R,11,15):RR(R,8,10),top=b-h;
    var L=[[x-w*1.5,b]],Rr=[[x+w*1.5,b]],segs=RI(R,3,4);for(var k=1;k<=segs;k++){var t=k/segs,yy=b-h*t,ww=w*(0.75+0.4*Math.sin(t*PI*segs+R()))*(1-t*0.25);L.push([x-ww,yy]);Rr.push([x+ww,yy]);}
    var cap=[[x-w*1.2,top],[x-w*1.3,top-5],[x-w*0.5,top-9],[x+w*0.8,top-8],[x+w*1.3,top-3],[x+w*1.1,top]];
    var P=blob(L.concat(cap).concat(Rr.reverse()),4);FS(s,sol,P);
    var bands=[],dd=1;for(var yy2=b-4;yy2>top;yy2-=RR(R,6,8.5)){var xl=x-w*1.6,xr=x+w*1.6;if(dd>0)bands.push([xl,yy2],[xr,yy2]);else bands.push([xr,yy2],[xl,yy2]);dd=-dd;}clipIn(s,[bands],P,[]);
    H(s,[[x+w*0.2,b],[x+w*1.5,b],[x+w*1.2,top+4],[x+w*0.2,top+4]].filter(function(){return true;}),near?2.2:2.8,80);});
  var tr=[];for(var t=0;t<RI(R,3,5);t++)pineT(tr,RR(R,10,290),gy+RR(R,6,14),RR(R,0.8,1.1),1.8);A(s,tr);
  s.push([[4,gy+4],[296,gy+4]]);var gr=[];H(gr,RP(4,gy+4,296,196),RR(R,3.4,4),RR(R,10,20));A(s,gr);
  return fin(s,R,bg,sol,36);});

S('Sea arch',['Window in the Headland','Tide Through the Arch','Gull Rock','Worn by Ten Thousand Winters','Low Sun, High Swell'],function(R){
  var s=[],sol=[],bg=[],sea=RR(R,140,148),ax=RR(R,120,170),aw=RR(R,30,40),ah=RR(R,44,56),top=RR(R,46,58),x0=RR(R,44,70),x1=RR(R,226,256);
  var rock=[[x0,sea+4],[x0+6,top+30],[x0+20,top+10],[x0+40,top],[ax,top-RR(R,2,8)],[x1-30,top+6],[x1-10,top+24],[x1,sea+4]];var rk=curve(rock,6);
  var hole=[[ax-aw,sea+4]].concat(curve([[ax-aw,sea+4],[ax-aw*0.9,sea-ah*0.6],[ax-aw*0.4,sea-ah],[ax+aw*0.3,sea-ah*0.95],[ax+aw*0.85,sea-ah*0.5],[ax+aw,sea+4]],6));
  var P=rk.concat([[x0,sea+4]]);SOL(s,sol,P);s.push(rk);s.push(hole);
  var str=[],d=1;for(var y=top+4;y<sea;y+=RR(R,4.5,6)){var w=wave(x0-10,x1+10,y,1.4,RR(R,30,50),R()*6);if(d<0)w.reverse();A(str,w);d=-d;}clipIn(s,[str],P,[hole]);
  H(s,[[ax+aw*0.2,sea],[ax+aw,sea],[ax+aw*0.8,sea-ah*0.5],[ax+aw*0.2,sea-ah*0.95]],1.4,80);
  var cap=[];var gr=curve([[x0+20,top+10],[x0+40,top-4],[ax,top-RR(R,6,10)],[x1-30,top+2]],6);s.push(gr);s.push(tufts(x0+24,x1-34,top+2,5,R));
  var st=[[x1+14,sea+4],[x1+18,sea-RR(R,40,54)],[x1+30,sea-RR(R,50,60)],[x1+38,sea+4]];FS(s,sol,blob(st,4),1.8,70);
  var gx=x1+26,gyy=interpY([[x1+14,0],[x1+38,0]],gx);var gt=sea-RR(R,48,56);s.push([[gx-4,gt],[gx+4,gt-4],[gx+6,gt],[gx+4,gt-4]]);
  var cl=[[4,sea+4],[4,RR(R,40,60)],[24,RR(R,50,66)],[x0-6,sea-30],[x0,sea+4]];FS(s,sol,cl,RR(R,2,2.4),60);
  var fo=[];for(var f=0;f<RI(R,6,9);f++){var fx=RR(R,x0-10,x1+30);fo.push(scallop(fx,sea+6,RR(R,6,12),2,6,0.3));}A(s,fo);
  var bch=[[4,180],[60,174],[140,182],[220,176],[296,182]],bc=curve(bch,6);s.push(bc);var sd=[];sand(sd,R,190,RR(R,5,6));A(s,sd.map(function(st){return st.filter(function(p){return p[1]>interpY(bc,p[0])+1;});}).filter(function(a){return a.length>1;}));
  waterIn(bg,R,[[4,sea]].concat([[296,sea]]).concat(bc.slice().reverse()),sea+3,190,RR(R,4.4,5.2));bg.push([[4,sea],[296,sea]]);
  var thru=[];waterIn(thru,R,hole,sea-ah,sea+2,4,[]);
  return fin(s,R,bg,sol,sea-6);});

// ---- chunk B: vehicles, animals, birds, sea life ----
function legT(s,sol,pts,w0,w1){var t=tube(curve(pts,6),function(u){return w0+(w1-w0)*u;});SOL(s,sol,t.P);s.push(poly(t.P));return t.P;}
function road(s,R,y){s.push([[4,y],[296,y]]);var d=1,p=[];for(var yy=y+5;yy<196;yy+=RR(R,5,7)){if(d>0)p.push([4,yy],[296,yy]);else p.push([296,yy],[4,yy]);d=-d;}s.push([[4,y],[4,y+5]].concat(p));var dash=[];for(var x=10;x<290;x+=24)dash.push([[x,y+12],[x+12,y+12]]);return s;}

S('Dump truck',['Twenty Tons of Gravel','Bed Up, Load Out','Quarry Run','Tipping Point','Shift Change at the Pit'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,170,176),x0=RR(R,40,60),tilt=RR(R,0.25,0.42),wr=RR(R,15,17);
  var cab=[[x0,gy-16],[x0,gy-60],[x0+8,gy-70],[x0+40,gy-70],[x0+44,gy-40],[x0+48,gy-36],[x0+48,gy-16]];FS(s,sol,cab);
  var wnd=[[x0+6,gy-44],[x0+6,gy-62],[x0+10,gy-66],[x0+36,gy-66],[x0+40,gy-44]];s.push(poly(wnd));H(s,wnd,1.6,40);s.push([[x0+24,gy-66],[x0+24,gy-44]]);
  s.push(rect(x0-4,gy-30,x0+4,gy-16));s.push(zz(x0-3,x0+3,gy-29,gy-17,1.6));s.push([[x0+30,gy-38],[x0+30,gy-34],[x0+38,gy-34]]);
  var ch=RP(x0,gy-16,x0+200,gy-24);FS(s,sol,ch,1.4,0);
  var px=x0+196,py=gy-24,bl=124,bh=40;var bed=[[0,0],[-bl,0],[-bl-8,-bh],[-6,-bh-6],[4,-bh]].map(function(p){return [px+p[0],py+p[1]];});bed=rotateAbout(bed,px,py,tilt);FS(s,sol,bed);
  var rib=[];for(var k=1;k<6;k++){var a=lerp(bed[0],bed[1],k/6),b=lerp(bed[3],bed[2],k/6);rib.push([a,b]);}A(s,rib);H(s,[bed[0],lerp(bed[0],bed[1],0.35),lerp(bed[3],bed[2],0.35),bed[3]],2.4,90);
  
  var ram=[[x0+70,gy-24],[lerp(bed[0],bed[1],0.62)[0],lerp(bed[0],bed[1],0.62)[1]]];s.push(ram);s.push(ram.map(function(p){return [p[0]+3,p[1]];}));
  var pile=blob([[px-20,gy+2],[px-6,gy-14],[px+20,gy-30],[px+46,gy-28],[px+70,gy-10],[px+86,gy+2]],6).filter(function(p){return p[1]<=gy+2;});FS(s,sol,pile.concat([[px+86,gy+2]]),1.6,20);var st=[];for(var q=0;q<10;q++){st.push(circle(RR(R,px-4,px+70),RR(R,gy-14,gy-2),RR(R,1,2)));}A(s,st);
  [x0+24,x0+128,x0+162].forEach(function(cx){wheel(s,cx,gy-wr+2,wr,6,1.3);sol.push(EP(cx,gy-wr+2,wr,wr));});
  var ml=[[x0+8,gy-16],[x0+6,gy-34],[x0+44,gy-34],[x0+42,gy-16]];s.push(arc(x0+24,gy-wr+2,wr+4,wr+4,PI,TAU));
  peaks(bg,R,gy-8,RR(R,50,70),RI(R,3,4),RR(R,2.6,3.2));gnd(bg,R,gy+2,RR(R,3.6,4.2));
  return fin(s,R,bg,sol,gy-14);});

S('Tow truck',['Hook and Boom','Roadside Rescue','Front Wheels Up','Wrecker on Call','Mile Marker 42'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,166,172),x0=RR(R,150,170),wr=13;
  var cab=[[x0,gy-12],[x0,gy-44],[x0+10,gy-62],[x0+40,gy-62],[x0+42,gy-38],[x0+70,gy-36],[x0+76,gy-28],[x0+76,gy-12]];FS(s,sol,cab);
  var w1=[[x0+6,gy-42],[x0+13,gy-57],[x0+36,gy-57],[x0+37,gy-42]];s.push(poly(w1));H(s,w1,1.6,40);s.push(rect(x0+46,gy-34,x0+56,gy-26));s.push([[x0+42,gy-38],[x0+42,gy-12]]);
  s.push(zz(x0+62,x0+74,gy-34,gy-26,2));s.push(RP(x0+18,gy-62,x0+30,gy-66));
  var bed=RP(x0-62,gy-12,x0,gy-30);FS(s,sol,bed);s.push(zz(x0-60,x0-2,gy-28,gy-14,4));
  var boom=[[x0-8,gy-30],[x0-58,gy-78],[x0-64,gy-74],[x0-16,gy-30]];FS(s,sol,boom,1.4,45);s.push([[x0-30,gy-30],[x0-44,gy-60]]);
  var hk=[x0-70,gy-50];s.push([[x0-61,gy-76],[hk[0]+2,hk[1]-10]]);s.push(arc(hk[0],hk[1]-6,4,4,-PI/2,PI*0.9));
  var cx=x0-148,lift=RR(R,0.12,0.2),car=[[0,0],[0,-16],[14,-18],[26,-32],[58,-32],[72,-18],[86,-16],[88,0]].map(function(p){return [cx+p[0],gy-6+p[1]];});car=rotateAbout(car,cx,gy-6,-lift);
  FS(s,sol,car);var cw=rotateAbout([[cx+30,gy-24],[cx+40,gy-34],[cx+56,gy-34],[cx+66,gy-24]],cx,gy-6,-lift);s.push(poly(cw));H(s,cw,1.4,40);
  var fw=rotateAbout([[cx+72,gy-4]],cx,gy-6,-lift)[0],rw=[cx+16,gy-4];wheel(s,rw[0],gy-10,10,6,1.2);wheel(s,fw[0],fw[1]-6,10,6,1.2);
  s.push([[fw[0]+4,fw[1]-14],[hk[0],hk[1]-2]]);s.push([[x0-62,gy-14],[fw[0]+6,fw[1]-6]]);
  [x0+56,x0-40].forEach(function(c){wheel(s,c,gy-wr+1,wr,6,1.3);sol.push(EP(c,gy-wr+1,wr,wr));});
  s.push([[x0+28,gy-66],[x0+28,gy-70]]);var lb=RP(x0+20,gy-70,x0+36,gy-74);FS(s,sol,lb,1,0);
  var sg=RR(R,250,286);s.push([[sg,gy],[sg,gy-44]]);s.push(poly([[sg-8,gy-44],[sg+8,gy-44],[sg+8,gy-60],[sg-8,gy-60]]));H(s,RP(sg-8,gy-60,sg+8,gy-56),1,0);
  for(var t=0;t<RI(R,3,4);t++)treeR(bg,R,RR(R,10,290),gy-20,RR(R,10,14),2.6);bg.push([[4,gy-20],[296,gy-20]]);var f=[];furrows(f,R,gy-20,16,150);clipIn(bg,f,RP(4,gy-20,296,gy),[]);
  road(s,R,gy+2);
  return fin(s,R,bg,sol,gy-24);});

S('Sailplane at the airfield',['Waiting for Lift','Long Wings Resting','Silent Flight Ahead','Thermal Season','Wingtip in the Grass'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,160,166),cx=RR(R,130,170),cy=gy-16,tilt=RR(R,0.05,0.09)*(R()<0.5?1:-1);
  var fus=[[-60,0],[-40,-6],[-8,-9],[10,-12],[24,-10],[34,-4],[36,2],[24,6],[-10,4],[-60,2]].map(function(p){return [cx+p[0]*1.3,cy+p[1]*1.3];});
  var fP=blob(fus,6);var cn=blob([[cx+2,cy-13],[cx+14,cy-20],[cx+32,cy-18],[cx+40,cy-10],[cx+24,cy-12]],5);
  var wing=[[cx-6,cy-14],[cx-6,cy-2],[cx-140,cy],[cx-142,cy-7]];var wing2=[[cx+16,cy-14],[cx+16,cy-2],[cx+150,cy+20],[cx+150,cy+12]];
  var tail=[[cx-74,cy-4],[cx-86,cy-34],[cx-76,cy-34],[cx-62,cy-6]],ht=[[cx-92,cy-34],[cx-66,cy-34],[cx-66,cy-31],[cx-92,cy-31]];
  [wing,wing2,tail,ht,fP,cn].forEach(function(P,i){P=rotateAbout(P,cx,cy,tilt);if(i===5){FS(s,sol,P,1.2,30);}else if(i===4){FS(s,sol,P);H(s,P.slice(Math.floor(P.length*0.55)),1.6,0);}else{FS(s,sol,P,i===2?1.6:0,80);}});
  var wl=rotateAbout([[cx-6,cy-9],[cx-140,cy-4]],cx,cy,tilt);s.push(wl);var wl2=rotateAbout([[cx+16,cy-9],[cx+150,cy+15]],cx,cy,tilt);s.push(wl2);
  s.push(circle(cx+8,gy-6,5));s.push([[cx+8,cy+4],[cx+8,gy-6]]);
  var wt=rotateAbout([[cx+150,cy+18]],cx,cy,tilt)[0];s.push([[wt[0],wt[1]],[wt[0],gy]]);
  var ws=RR(R,20,50);s.push([[ws,gy],[ws,gy-50]]);var sock=[[ws,gy-50],[ws+26,gy-46],[ws+26,gy-40],[ws,gy-42]];FS(s,sol,sock);s.push(zz(ws+6,ws+22,gy-49,gy-41,4));
  var hg=RR(R,224,250);var hn=[[hg,gy],[hg,gy-30]].concat(arc(hg+28,gy-30,28,16,PI,TAU)).concat([[hg+56,gy-30],[hg+56,gy]]);if(hg+56<296){FS(s,sol,hn);clipIn(s,[zz(hg,hg+56,gy-48,gy,3.5)],hn,[RP(hg+12,gy,hg+44,gy-24)]);s.push(RP(hg+12,gy,hg+44,gy-24));}
  var rw=[[4,gy+10],[296,gy+10]];s.push(rw);s.push([[4,gy+24],[296,gy+24]]);for(var x=10;x<296;x+=20)s.push([[x,gy+17],[x+10,gy+17]]);
  hills(bg,R,gy-4,RR(R,24,36),RR(R,4.2,5),[],RR(R,10,20));gnd(bg,R,gy,RR(R,3.6,4.2));
  return fin(s,R,bg,sol,gy-10);});

S('Swan pedalo on a lake',['Pedal to the Island','Two Seats, One Swan','Hired by the Hour','Lake Afternoon','Neck Held High'],function(R){
  var s=[],sol=[],bg=[],wl=RR(R,140,148),cx=RR(R,120,170),f=R()<0.5?1:-1;
  function X(p){return [cx+p[0]*f,p[1]];}
  var hull=[[-70,wl+4],[-74,wl-14],[-60,wl-28],[40,wl-26],[56,wl-16],[60,wl+4]].map(X);var hP=blob(hull,6);FS(s,sol,hP);
  var neck=tube(curve([[42,wl-24],[54,wl-50],[52,wl-80],[42,wl-100],[48,wl-112]].map(X),8),function(t){return 10-5*t;});FS(s,sol,neck.P);
  var hd=EP(cx+52*f,wl-112,10,7);FS(s,sol,hd);var bk=[[60,wl-114],[76,wl-108],[60,wl-106]].map(X);FS(s,sol,bk,1.2,0);s.push(circle(cx+52*f,wl-114,1.6));
  var wing=blob([[-60,wl-28],[-74,wl-50],[-50,wl-62],[-20,wl-56],[6,wl-40],[20,wl-28]].map(X),6);FS(s,sol,wing);var fe=[];for(var k=0;k<6;k++){fe.push(quad(X([-62+k*12,wl-28]),X([-58+k*12,wl-44]),X([-50+k*10,wl-56+k*3])));}A(s,fe);
  var seat=[[-34,wl-26],[-30,wl-46],[-6,wl-46],[-4,wl-26]].map(X);FS(s,sol,seat,1.6,90);var seat2=[[0,wl-26],[4,wl-40],[22,wl-40],[24,wl-26]].map(X);FS(s,sol,seat2,1.6,90);
  var pw=EP(cx-50*f,wl-10,14,10);s.push(poly(pw));for(var j=0;j<6;j++){var a=j*PI/3;s.push([[cx-50*f,wl-10],[cx-50*f+12*Math.cos(a),wl-10+8*Math.sin(a)]]);}
  H(s,[[-70,wl+4],[60,wl+4],[56,wl-8],[-72,wl-8]].map(X),1.6,0);
  var rp=[];for(var r=0;r<4;r++)rp.push(wave(cx-90+r*6,cx+90-r*6,wl+8+r*6,1.2,14,r));A(s,rp);
  var sh=wl-RR(R,40,50);var trees=[];for(var t=0;t<RI(R,5,7);t++)treeR(trees,R,RR(R,10,290),sh,RR(R,10,16),2.6);A(bg,trees);bg.push([[4,sh],[296,sh]]);
  var bh=RR(R,20,60),bo=[[bh,sh],[bh,sh-16],[bh+22,sh-24],[bh+44,sh-16],[bh+44,sh]];if(R()<0.7){bg.push(poly(bo));}
  waterIn(bg,R,RP(4,sh,296,196),sh+4,194,RR(R,5,5.8));
  return fin(s,R,bg,sol,sh-8);});

S('Dhow under sail',['Monsoon Wind','Lateen and Teak','Coast of Spice','Old Trade Route','Evening Crossing'],function(R){
  var s=[],sol=[],bg=[],wl=RR(R,146,152),cx=RR(R,130,170),f=R()<0.5?1:-1;function X(p){return [cx+p[0]*f,p[1]];}
  var hull=[[-80,wl-26],[-60,wl-16],[-30,wl+4],[40,wl+4],[70,wl-10],[96,wl-32],[60,wl-20],[-50,wl-18]].map(X);FS(s,sol,hull);
  var pl=[];for(var k=1;k<4;k++)pl.push(curve([[-62,wl-16+k*5],[0,wl-14+k*5.5],[66,wl-18+k*4]].map(X),6));A(s,pl);H(s,[[-30,wl+4],[40,wl+4],[64,wl-6],[-50,wl-6]].map(X),1.6,0);
  var stern=[[-80,wl-26],[-82,wl-40],[-62,wl-36],[-58,wl-18]].map(X);FS(s,sol,stern,1.6,90);
  var mx=cx+RR(R,4,14)*f;s.push([[mx,wl-18],[mx,wl-118]]);
  var yt=[mx+70*f,wl-132],yb=[mx-84*f,wl-30];s.push([yb,yt]);
  var sail=[yt,yb,[mx+(-30)*f,wl-24],[mx+50*f,wl-42]],sP=[yt].concat(quad(yb,[mx-20*f,wl-14],[mx+50*f,wl-36],10)).concat([[mx+60*f,wl-60]]);
  var Sp=[yt,yb].concat(quad(yb,[mx+10*f,wl-30],[mx+52*f,wl-40],10).slice(1)).concat(quad([mx+52*f,wl-40],[mx+70*f,wl-80],yt,10).slice(1));FS(s,sol,Sp);
  var sm=[];for(var j=1;j<7;j++){var a=lerp(yb,yt,j/7),b=lerp([mx+52*f,wl-40],yt,j/7*0.6);sm.push([a,lerp(b,a,0.05)]);}A(s,sm);
  H(s,[yt,lerp(yb,yt,0.5),[mx+52*f,wl-40],[mx+64*f,wl-70]],RR(R,1.8,2.2),f>0?-60:60);
  s.push([[mx,wl-118],[cx+92*f,wl-32]]);s.push([[mx,wl-100],[cx-76*f,wl-38]]);s.push([[mx,wl-118],[mx+6*f,wl-124],[mx,wl-128]]);
  var coast=[[4,wl-18],[40,wl-30],[70,wl-24],[110,wl-36],[150,wl-22],[200,wl-28],[240,wl-20],[296,wl-26]];var cl=curve(coast,6);bg.push(cl);var cp=cl.concat([[296,wl],[4,wl]]);var ch=[];H(ch,cp,RR(R,3,3.6),RR(R,15,30));A(bg,ch);
  var palms=[];for(var p=0;p<RI(R,3,5);p++){var px=RR(R,14,286),py=interpY(cl,px);palms.push(curve([[px,py],[px+3,py-12],[px+2,py-22]],5));for(var l=0;l<5;l++){var a2=PI+l*PI/4;palms.push(quad([px+2,py-22],[px+2+8*Math.cos(a2),py-22-6],[px+2+12*Math.cos(a2),py-22+4*Math.abs(Math.sin(a2))]));}}A(bg,palms);
  waterIn(bg,R,RP(4,wl,296,196),wl+3,194,RR(R,4.6,5.4));bg.push([[4,wl],[296,wl]]);var wk=[];for(var w=0;w<3;w++)wk.push(wave(cx-110*f,cx-50*f,wl+6+w*5,1.5,10,w));A(s,wk);
  return fin(s,R,bg,sol,wl-36);});

S('School bus',['Stop Arm Out','Seven Fifteen Pickup','Field Trip Day','Bench Seats and Windows','Last Stop, Home'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,166,172),x0=RR(R,34,50),L=RR(R,190,204),h=56,wr=12;
  var body=[[x0,gy-10],[x0,gy-h+4],[x0+4,gy-h],[x0+L-40,gy-h],[x0+L-34,gy-h+6],[x0+L-34,gy-36],[x0+L-6,gy-34],[x0+L,gy-28],[x0+L,gy-10]];FS(s,sol,body);
  s.push([[x0,gy-24],[x0+L,gy-24]]);s.push([[x0,gy-20],[x0+L,gy-20]]);s.push([[x0,gy-h+12],[x0+L-34,gy-h+12]]);
  var holes=[],n=Math.floor((L-60)/18);for(var i=0;i<n;i++){var wx=x0+8+i*18,W=RP(wx,gy-h+14,wx+14,gy-30);holes.push(W);s.push(poly(W));s.push([[wx,gy-h+22],[wx+14,gy-h+22]]);}
  var dx=x0+L-52,D=RP(dx,gy-10,dx+14,gy-h+8);holes.push(D);s.push(poly(D));s.push([[dx+7,gy-10],[dx+7,gy-h+8]]);H(s,RP(dx+1,gy-h+10,dx+13,gy-30),1.4,45);
  var ws=[[x0+L-34,gy-h+8],[x0+L-24,gy-38]];s.push(ws);
  HX(s,[[[x0,gy-24],[x0+L,gy-24],[x0+L,gy-10],[x0,gy-10]]],1.6,0);
  holes.forEach(function(W,i){if(i<n&&i%2===0)H(s,W,1.8,50);});
  var arm=[x0+28,gy-34];var oct=[];for(var k=0;k<8;k++){var a=PI/8+k*PI/4;oct.push([arm[0]-14+9*Math.cos(a),arm[1]+9*Math.sin(a)]);}s.push([[x0,arm[1]],[arm[0]-14+9,arm[1]]]);FS(s,sol,oct);s.push(poly(oct.map(function(p){return [arm[0]-14+(p[0]-arm[0]+14)*0.75,arm[1]+(p[1]-arm[1])*0.75];})));
  s.push(rect(x0+6,gy-h-4,x0+16,gy-h));s.push(rect(x0+L-50,gy-h-4,x0+L-40,gy-h));
  s.push(rect(x0+L-4,gy-26,x0+L+2,gy-18));s.push([[x0+L-6,gy-12],[x0+L+4,gy-12]]);
  [x0+30,x0+L-22].forEach(function(cx){wheel(s,cx,gy-wr+2,wr,6,1.3);sol.push(EP(cx,gy-wr+2,wr,wr));s.push(arc(cx,gy-wr+2,wr+3,wr+3,PI,TAU));});
  var sx=RR(R,250,280);if(sx>x0+L+10){s.push([[sx,gy],[sx,gy-56]]);var sg=RP(sx-9,gy-56,sx+9,gy-70);FS(s,sol,sg,1.4,0);}
  for(var t=0;t<RI(R,3,4);t++){var tx=RR(R,10,290);treeR(bg,R,tx,gy-18,RR(R,12,18),2.4);}bg.push([[4,gy-18],[296,gy-18]]);s.push(comb(4,296,gy-6,8,10));bg.push([[4,gy-10],[296,gy-10]]);
  road(s,R,gy+2);
  return fin(s,R,bg,sol,gy-22);});

S('Moose by a lake',['Antlers at the Shore','Dawn Browser','North Woods Giant','Wading for Lilies','Breath on the Water'],function(R){
  var s=[],sol=[],bg=[],sh=RR(R,124,132),f=R()<0.5?1:-1,ox=RR(R,130,160),oy=RR(R,176,184),sc=RR(R,1.15,1.3);function X(P){return M(P,ox,oy,sc,f);}
  var body=X([[-45,-62],[-32,-72],[-5,-74],[14,-86],[30,-82],[40,-68],[42,-50],[30,-40],[-10,-38],[-40,-42],[-50,-52]]);var bP=blob(body,6);
  var head=blob(X([[34,-80],[48,-76],[64,-64],[76,-56],[80,-50],[74,-45],[62,-50],[46,-58],[34,-62]]),5);
  var legs=[];[[30,-42,1],[20,-42,0],[-34,-44,1],[-26,-44,0]].forEach(function(l){var x=l[0],k=l[2]?3:-3;legs.push(legT(s,sol,X([[x,l[1]],[x+k,-22],[x-k*0.3,-4],[x+2,0]]),3.4,2.4));});
  FS(s,sol,bP);FS(s,sol,head);H(s,bP,RR(R,2.6,3),f>0?60:-60);H(s,head,1.6,f>0?50:-50);
  var bell=X([[54,-58],[56,-44],[60,-56]]);s.push(bell);s.push(circle(ox+60*sc*f,oy-64*sc,1.4));s.push(X([[44,-80],[46,-90],[50,-80]]));
  var ant=blob(X([[44,-82],[32,-90],[22,-104],[30,-100],[30,-112],[38,-102],[42,-114],[48,-102],[54,-112],[54,-96],[50,-84]]),4);FS(s,sol,ant,1.4,30);
  var ant2=blob(X([[46,-84],[56,-96],[64,-108],[66,-100],[72,-106],[70,-94],[60,-84]]),4);FS(s,sol,ant2,1.4,-30);
  var ripple=[];for(var r=0;r<3;r++)ripple.push(wave(ox-70,ox+70,oy+2+r*5,1,10,r));A(s,ripple);
  var trees=[];for(var t=0;t<RI(R,8,11);t++)pineT(trees,4+t*(292/10)+RR(R,-6,6),sh,RR(R,0.9,1.5),1.9);behind(bg,trees,sol);
  peaks(bg,R,sh-20,RR(R,40,56),RI(R,3,4),RR(R,2.6,3.2));bg.push([[4,sh],[296,sh]]);
  waterIn(bg,R,RP(4,sh,296,196),sh+4,194,RR(R,4.6,5.4));
  return fin(s,R,bg,sol,sh-24);});

S('Kangaroo',['Big Red at Dusk','Tail as a Stool','Outback Sentinel','Ears Up','Long Feet, Red Dirt'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,168,174),f=R()<0.5?1:-1,ox=RR(R,120,170),sc=RR(R,1.5,1.7);function X(P){return M(P,ox,gy,sc,f);}
  var tail=tube(curve(X([[-12,-20],[-28,-10],[-46,-2],[-60,0]]),6),function(t){return (6-5*t)*sc;});FS(s,sol,tail.P);
  var body=blob(X([[-14,-14],[-18,-34],[-12,-54],[0,-68],[10,-70],[16,-58],[18,-40],[12,-22],[0,-12]]),6);FS(s,sol,body);
  var thigh=blob(X([[-18,-28],[-6,-38],[8,-28],[6,-10],[-6,-6],[-18,-14]]),5);FS(s,sol,thigh,1.6,f>0?40:-40);
  var foot=X([[-6,-7],[-8,0],[26,0],[26,-3],[4,-8]]);FS(s,sol,foot,1.2,0);
  var head=blob(X([[6,-68],[12,-78],[20,-82],[32,-78],[38,-74],[32,-71],[20,-68],[12,-64]]),5);FS(s,sol,head);
  [[12,-79],[17,-80]].forEach(function(e){var E=blob(X([[e[0]-2,e[1]],[e[0]-4,e[1]-7],[e[0]-1,e[1]-10],[e[0]+2,e[1]-6],[e[0]+2,e[1]]]),4);FS(s,sol,E);s.push(X([[e[0],e[1]-1],[e[0]-1,e[1]-7]]));});
  s.push(circle(ox+24*sc*f,gy-76*sc,1.4));var arm=X([[14,-52],[20,-46],[24,-40],[22,-38]]);s.push(arm);s.push(X([[12,-48],[18,-42],[20,-38]]));
  H(s,X([[-14,-20],[-16,-36],[-10,-52],[-2,-58],[-4,-30]]),1.6,f>0?70:-70);
  if(R()<0.6){var jy=X([[8,-40],[16,-44],[18,-32],[10,-30]]);s.push(poly(jy));s.push(circle(ox+13*sc*f,gy-40*sc,2*sc));}
  var tx=ox<150?RR(R,210,260):RR(R,40,90),tr=[[tx-5,gy],[tx-3,gy-50],[tx-22,gy-80],[tx-18,gy-82],[tx,gy-58],[tx+6,gy-90],[tx+10,gy-88],[tx+6,gy-56],[tx+22,gy-74],[tx+25,gy-72],[tx+6,gy-44],[tx+5,gy]];FS(s,sol,tr);H(s,tr.slice(-4),1.1,90);
  [[tx-26,gy-86],[tx+8,gy-96],[tx+28,gy-78]].forEach(function(c){var C=scallop(c[0],c[1],RR(R,16,22),RR(R,8,11),9,0.15);s.push(C);H(s,C.slice(0,-1),2.4,30);});
  s.push(tufts(4,296,gy,8,R));sunH(bg,RR(R,40,260),gy-20,RR(R,12,16));bg.push([[4,gy-20],[296,gy-20]]);var lh=[];H(lh,RP(4,gy-20,296,gy),RR(R,4,4.8),RR(R,5,12));A(bg,lh);gnd(bg,R,gy,RR(R,3.4,4));
  return fin(s,R,bg,sol,gy-24);});

S('Rhinoceros',['Armour Plate','Horn First','Mud Wallow Afternoon','Grey Giant','Oxpecker on Board'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,172,178),f=R()<0.5?1:-1,ox=RR(R,130,165),sc=RR(R,1.55,1.75);function X(P){return M(P,ox,gy,sc,f);}
  [[-30,-2],[30,-2]].forEach(function(o){var F=blob(X([[o[0]-6,-24],[o[0]-7,0],[o[0]+6,0],[o[0]+6,-24]]),3);FS(s,sol,F,2.6,90);});
  var body=blob(X([[-52,-60],[-30,-70],[0,-72],[20,-74],[34,-64],[46,-60],[58,-50],[70,-38],[78,-28],[76,-22],[66,-20],[54,-24],[44,-28],[38,-22],[38,-2],[36,0],[24,0],[23,-18],[10,-22],[-20,-22],[-22,-16],[-22,0],[-38,0],[-40,-18],[-50,-32],[-56,-46]]),4);FS(s,sol,body);
  var horn=X([[64,-42],[80,-66],[72,-38]]);FS(s,sol,horn,1,0);var hn2=X([[54,-50],[58,-60],[60,-48]]);FS(s,sol,hn2);
  var ear=X([[40,-62],[38,-76],[46,-64]]);FS(s,sol,ear,1,0);s.push(circle(ox+58*sc*f,gy-44*sc,1.4));s.push(X([[74,-26],[68,-28]]));
  s.push(curve(X([[22,-72],[16,-50],[24,-26]]),5));s.push(curve(X([[-28,-68],[-34,-48],[-30,-24]]),5));s.push(curve(X([[44,-58],[42,-42],[46,-30]]),4));
  var sk=[];HX(sk,[blob(X([[-50,-40],[-44,-60],[-20,-68],[10,-70],[30,-64],[20,-40],[0,-26],[-30,-26]]),4)],RR(R,2.4,2.8),f>0?-30:30);A(s,sk);
  s.push(X([[-54,-44],[-60,-34],[-58,-26]]));[[-30,0],[30,0]].forEach(function(o){s.push(X([[o[0]-6,-2],[o[0]-3,-4],[o[0],-2],[o[0]+3,-4]]));});
  perched(s,ox-10*sc*f,gy-67*sc,3,f);
  var tx=RR(R,30,90)*(ox>150?1:-1)+(ox>150?0:300);var ty=gy-8;s.push([[tx-3,ty],[tx-2,ty-60]]);s.push([[tx+3,ty],[tx+2,ty-60]]);s.push([[tx-2,ty-60],[tx-30,ty-74]],[[tx+2,ty-60],[tx+28,ty-76]]);
  var cr=[[tx-50,ty-72],[tx-36,ty-82],[tx+30,ty-84],[tx+50,ty-74],[tx+30,ty-70],[tx-30,ty-70]];var crP=blob(cr,5);FS(s,sol,crP,2.2,0);
  var gr=[];gr.push(tufts(4,296,gy+2,10,R));A(s,gr);bg.push([[4,gy-14],[296,gy-14]]);var lh=[];H(lh,RP(4,gy-14,296,gy),RR(R,4,4.8),RR(R,4,10));A(bg,lh);hills(bg,R,gy-14,RR(R,14,22),RR(R,4.8,5.4),[],8);gnd(bg,R,gy+2,RR(R,3.8,4.4));
  return fin(s,R,bg,sol,gy-24);});

S('Llama on a hillside',['Wool and Patience','High Pasture','Ears Like Bananas','Andes Afternoon','The Long Stare'],function(R){
  var s=[],sol=[],bg=[],f=R()<0.5?1:-1,gy=RR(R,170,176),ox=RR(R,120,160),sc=RR(R,1.45,1.6);function X(P){return M(P,ox,gy,sc,f);}
  [[22,1],[14,0],[-24,1],[-30,0]].forEach(function(l){var x=l[0];legT(s,sol,X([[x,-36],[x+1,-18],[x,-2],[x+2,0]]),2.8,2);});
  var body=blob(X([[-34,-42],[-26,-54],[0,-56],[20,-54],[30,-46],[26,-36],[-28,-34],[-36,-38]]),6);FS(s,sol,body);
  var neck=tube(curve(X([[20,-50],[24,-70],[26,-90]]),6),function(t){return (8-2*t)*sc;});FS(s,sol,neck.P);
  var head=blob(X([[20,-90],[28,-98],[38,-96],[46,-90],[42,-86],[30,-86]]),5);FS(s,sol,head);
  [[24,-96],[30,-98]].forEach(function(e){var E=blob(X([[e[0],e[1]],[e[0]-2,e[1]-12],[e[0]+3,e[1]-10],[e[0]+3,e[1]]]),4);FS(s,sol,E);});s.push(circle(ox+34*sc*f,gy-93*sc,1.3));s.push(X([[44,-88],[42,-87]]));
  var wool=[];wool.push(scallopRows(ox-40*sc,ox+40*sc,gy-56*sc,gy-34*sc,5,3.4));clipIn(s,wool,body,[]);var nw=[];nw.push(scallopRows(ox-20*sc,ox+50*sc,gy-92*sc,gy-50*sc,5,3.4));clipIn(s,nw,neck.P,[]);
  s.push(X([[-34,-44],[-40,-38],[-38,-32]]));
  var bl=X([[-10,-56],[-6,-60],[10,-60],[14,-56]]);s.push(bl);s.push(zz(Math.min(bl[0][0],bl[3][0]),Math.max(bl[0][0],bl[3][0]),gy-60*sc,gy-56*sc,3));
  var slope=[[4,gy-60],[80,gy-40],[160,gy-18],[296,gy+4]];var sl=curve(slope,6);bg.push(sl);
  for(var t=0;t<4;t++){var y0=gy-110+t*14;bg.push(curve([[4,y0],[90,y0+10],[200,y0+30],[296,y0+44]],6));}
  peaks(bg,R,gy-70,RR(R,60,80),RI(R,3,4),RR(R,2.4,3));
  var gr=[];gr.push(tufts(4,296,gy+2,8,R));A(s,gr);s.push([[4,gy+2],[296,gy+2]]);var gh=[];H(gh,RP(4,gy+2,296,196),RR(R,3.6,4.2),RR(R,8,20));A(s,gh);
  var sh2=[];H(sh2,sl.concat([[296,gy+2],[4,gy+2]]),RR(R,4.4,5),RR(R,20,30));A(bg,sh2);
  return fin(s,R,bg,sol,gy-130);});

S('Eagle on a snag',['White Head, Dead Pine','Watching the River','Talons and Bark','Lookout Post','Wind in the Hackles'],function(R){
  var s=[],sol=[],bg=[],f=R()<0.5?1:-1,px=RR(R,130,160),py=RR(R,110,120),sc=RR(R,1.5,1.7);function X(P){return M(P,px,py,sc,f);}
  var tr=[[px-20*f,196],[px-16*f,py+40],[px-10*f,py+6],[px+2*f,py-30],[px+6*f,py-28],[px-2*f,py+8],[px+40*f,py-2],[px+70*f,py-10],[px+70*f,py-4],[px+40*f,py+6],[px-2*f,py+18],[px-4*f,py+50],[px-4*f,196]];
  var trP=tr;FS(s,sol,trP);var bk=[];for(var k=0;k<7;k++){var yy=py+30+k*10;bk.push(curve([[px-17*f,yy],[px-12*f,yy+4],[px-6*f,yy+2]],4));}A(s,bk);s.push(curve([[px-12*f,py+30],[px-10*f,py+80],[px-12*f,190]],6));
  var tail=blob(X([[-4,-6],[-12,16],[-6,20],[4,16],[4,-4]]),4);FS(s,sol,tail,1.2,80);
  var body=blob(X([[-8,-4],[-16,-22],[-14,-40],[-6,-52],[6,-54],[14,-44],[14,-26],[8,-8]]),6);FS(s,sol,body);
  var wingE=blob(X([[-14,-44],[-2,-48],[8,-30],[2,-8],[-8,2],[-14,-14]]),5);FS(s,sol,wingE);var fe=[];for(var j=0;j<5;j++)fe.push(curve(X([[-10+j*3,-40+j*4],[-6+j*2,-20+j*3],[-8+j*2,-2+j]]),4));A(s,fe);
  var bh=[];HX(bh,[body],2,f>0?40:-40);A(s,bh);
  var head=blob(X([[2,-50],[-2,-62],[6,-70],[16,-70],[22,-66],[26,-62],[22,-58],[14,-54],[10,-48]]),5);FS(s,sol,head);
  var beak=X([[22,-64],[30,-62],[32,-58],[28,-58],[27,-60],[22,-58]]);FS(s,sol,beak,0.9,0);s.push(circle(px+15*sc*f,py-64*sc,1.5));s.push(X([[14,-66],[19,-65]]));
  s.push(X([[2,-50],[6,-48],[4,-46],[8,-45]]));
  [[0,0],[6,0]].forEach(function(t){s.push(X([[t[0],-6],[t[0],0],[t[0]-3,2],[t[0],0],[t[0]+3,2],[t[0],0],[t[0]+1,3]]));});
  var ry=RR(R,160,168);var riv=curve([[4,ry],[100,ry-6],[200,ry+4],[296,ry-2]],6);bg.push(riv);var rv=[];waterIn(rv,R,riv.concat([[296,196],[4,196]]),ry,196,RR(R,4.6,5.4));A(bg,rv);
  var ftr=[];for(var t=0;t<RI(R,9,12);t++)pineT(ftr,4+t*26+RR(R,-5,5),ry-2,RR(R,0.8,1.3),2);A(bg,ftr);
  peaks(bg,R,ry-20,RR(R,40,60),RI(R,3,4),RR(R,2.6,3.2));
  return fin(s,R,bg,sol,ry-30);});

S('Robin on a spade handle',["Gardener's Shadow",'Red Breast, Turned Soil','Worms Coming Up','Spring Digging','Little Foreman'],function(R){
  var s=[],sol=[],bg=[],f=R()<0.5?1:-1,gy=RR(R,174,180),hx=RR(R,130,170),hy=RR(R,110,118),sc=RR(R,2,2.2),lean=RR(R,0.12,0.2)*f;
  var sh=[[hx-4,hy+16],[hx+4,hy+16],[hx+4+lean*120,gy-34],[hx-4+lean*120,gy-34]];FS(s,sol,sh,0,0);var gr=[];for(var k=0;k<4;k++)gr.push(curve([[hx-2+k,hy+20],[hx-2+k+lean*60,hy+70],[hx-2+k+lean*118,gy-36]],4));A(s,gr);
  var D=[[hx-14,hy+16],[hx-14,hy+2]].concat(arc(hx,hy+2,14,10,PI,TAU)).concat([[hx+14,hy+16]]);FS(s,sol,D);var Di=[[hx-8,hy+12],[hx-8,hy+4]].concat(arc(hx,hy+4,8,6,PI,TAU)).concat([[hx+8,hy+12]]);s.push(poly(Di));
  var bx=hx+lean*120,blade=[[bx-14,gy-34],[bx+14,gy-34],[bx+14,gy-6],[bx,gy+6],[bx-14,gy-6]];FS(s,sol,blade,1.6,80);s.push([[bx-14,gy-30],[bx+14,gy-30]]);
  function X(P){return M(P,hx,hy-8,sc,f);}
  var tail=blob(X([[-10,0],[-22,2],[-24,6],[-10,6]]),3);FS(s,sol,tail,1.4,10);
  var body=blob(X([[-12,0],[-12,-8],[-6,-14],[2,-16],[8,-14],[10,-8],[8,-2],[0,2],[-8,2]]),6);FS(s,sol,body);
  var head=EP(hx+6*sc*f,hy-8-16*sc,5.5*sc,5*sc);FS(s,sol,head);var beak=X([[11,-17],[15,-16],[11,-15]]);FS(s,sol,beak,0.5,0);s.push(circle(hx+8*sc*f,hy-8-17*sc,1.6));
  var breast=blob(X([[10,-20],[11,-14],[10,-6],[4,0],[0,-2],[4,-10],[6,-18]]),4);FS(s,sol,breast);var bh=[];HX(bh,[breast],1.4,30);A(s,bh);
  var wing=blob(X([[-10,-10],[-2,-13],[4,-10],[0,-4],[-12,-2]]),4);FS(s,sol,wing,1.6,f>0?-20:20);s.push(X([[-8,-6],[0,-8]]));s.push(X([[-8,-4],[-2,-5]]));
  var bkh=[];HX(bkh,[blob(X([[-6,-14],[2,-17],[8,-22],[10,-24],[2,-24],[-4,-20]]),3)],1.4,0);A(s,bkh);
  [[-2,1],[2,1]].forEach(function(l){s.push(X([[l[0],l[1]],[l[0],l[1]+3],[l[0]-2,l[1]+4],[l[0],l[1]+3],[l[0]+2,l[1]+4]]));});
  var soil=[];for(var m=0;m<RI(R,3,4);m++){var mx=RR(R,30,270),mw=RR(R,20,34);soil.push(arc(mx,gy,mw,RR(R,8,12),PI,TAU));}soil.forEach(function(P){var Q=P.concat([P[0]]);FS(s,sol,Q.slice(0,-1),2,RR(R,20,60));});
  var wm=RR(R,40,250);s.push(curve([[wm,gy+4],[wm+5,gy-2],[wm+9,gy+3],[wm+14,gy-1]],5));
  var fn=[];var fy=gy-RR(R,40,50);fn.push(comb(4,296,fy,22,9));s.push([[4,fy-12],[296,fy-12]]);s.push([[4,fy-4],[296,fy-4]]);behind(s,fn,sol);
  var bush=[];for(var b=0;b<RI(R,3,4);b++){var bbx=RR(R,10,290);bush.push(scallop(bbx,fy-26,RR(R,14,20),RR(R,10,14),9,0.15));}behind(bg,bush,sol);
  s.push([[4,gy],[296,gy]]);var g2=[];H(g2,RP(4,gy,296,196),RR(R,3.2,3.8),RR(R,10,25));behind(s,g2,sol);var lw=[];H(lw,RP(4,fy,296,gy),RR(R,4.4,5),RR(R,4,10));behind(bg,lw,sol);
  return fin(s,R,bg,sol,fy-14);});

S('Dolphins leaping',['Bow Riders','Three in the Air','Splash and Arc','Pod at Play','Clear Water Morning'],function(R){
  var s=[],sol=[],bg=[],wl=RR(R,128,136),n=RI(R,2,3);
  function dolphin(x0,x1,h,dir){var mid=(x0+x1)/2,sp=curve([[x0,wl+2],[x0+(x1-x0)*0.25,wl-h*0.8],[mid,wl-h],[x0+(x1-x0)*0.75,wl-h*0.8],[x1,wl+2]],8);
    var tb=tube(sp,function(t){return Math.max(1.2,9*Math.sin(Math.min(1,t*1.15)*PI)*(t<0.2?t/0.2*0.6+0.4:1));});var P=tb.P;FS(s,sol,P);
    var head=sp[sp.length-1],hd=sp[sp.length-6];var nose=[head[0]+(head[0]-hd[0])*0.7,head[1]+(head[1]-hd[1])*0.7];s.push([tb.L[tb.L.length-1],nose,tb.R[tb.R.length-1]]);
    var top=sp[Math.floor(sp.length*0.48)],fin=[[top[0]-6,top[1]-7],[top[0]-12,top[1]-20],[top[0]+4,top[1]-8]];FS(s,sol,fin,1,0);
    var fl=sp[Math.floor(sp.length*0.65)];var flp=[[fl[0],fl[1]+6],[fl[0]-8,fl[1]+16],[fl[0]+3,fl[1]+8]];FS(s,sol,flp);
    var t0=sp[1],tl=[[t0[0]-12,t0[1]-4],[t0[0],t0[1]],[t0[0]-8,t0[1]+10]];FS(s,sol,tl.concat([[t0[0]-3,t0[1]+2]]));
    var sh=[];HX(sh,[tb.R.concat(sp.slice().reverse())],1.7,30);A(s,sh);var e=sp[sp.length-10];s.push(circle(e[0],e[1]-2,1.1));
    for(var k=0;k<5;k++){var sx=x1+RR(R,-10,10);s.push([[sx,wl],[sx+RR(R,-8,8),wl-RR(R,6,14)]]);}}
  for(var i=0;i<n;i++){var w=RR(R,80,100),x0=20+i*(230/n)+RR(R,-6,6),h=RR(R,50,80)-i*6;dolphin(x0,x0+w,h);}
  var sw=[];sw.push(wave(4,296,wl,2.4,18,0));A(s,sw);var wv=[];waterIn(wv,R,RP(4,wl+2,296,196),wl+6,194,RR(R,4.4,5.2));A(bg,wv);
  var hz=RR(R,80,90);bg.push([[4,hz],[296,hz]]);var far=[];waterIn(far,R,RP(4,hz,296,wl-1),hz+3,wl-2,RR(R,6,7));behind(bg,far,sol);
  var isl=[[RR(R,200,240),hz],[RR(R,240,250),hz-14],[RR(R,262,272),hz-18],[290,hz]];bg.push(curve(isl,6));
  return fin(s,R,bg,sol,hz-4);});

S('Swordfish',['Blue Water Leap','Bill First','Out of the Deep','Sail and Sword','Gulf Stream Morning'],function(R){
  var s=[],sol=[],bg=[],wl=RR(R,140,150),f=R()<0.5?1:-1,cx=RR(R,130,170),cy=RR(R,90,100),ang=RR(R,-0.5,-0.3)*f;
  function X(P){return rotateAbout(M(P,cx,cy,1.4,f),cx,cy,ang);}
  var body=blob(X([[-70,0],[-50,-8],[-10,-16],[30,-16],[50,-10],[58,-4],[56,4],[30,10],[-20,10],[-60,4]]),6);FS(s,sol,body);
  var bill=X([[56,-4],[120,-2],[56,2]]);FS(s,sol,bill);
  var dors=blob(X([[0,-15],[6,-46],[16,-44],[22,-16]]),4);FS(s,sol,dors,1.4,80);var tl=X([[-68,0],[-92,-30],[-84,-2],[-92,28],[-68,2]]);FS(s,sol,tl,1.4,60);
  var pec=X([[30,6],[16,24],[24,8]]);FS(s,sol,pec);s.push(circle(X([[46,-5]])[0][0],X([[46,-5]])[0][1],2.4));s.push(X([[40,-12],[38,0],[40,8]]));
  var sh=[];HX(sh,[blob(X([[-60,-2],[-40,-8],[-10,-15],[30,-15],[50,-8],[30,-6],[-20,-4]]),5)],1.5,f>0?-20:20);A(s,sh);s.push(X([[-60,0],[50,-1]]));
  var tail=X([[-70,0]])[0];var dr=[];for(var d=0;d<6;d++){var a=-PI/2+(d-2.5)*0.25;dr.push([[tail[0],tail[1]],[tail[0]+Math.cos(a)*RR(R,8,20)*-f,Math.min(wl,tail[1]+RR(R,10,30))]]);}
  var spl=[];var sx=X([[-80,10]])[0][0];for(var k=0;k<7;k++){var x=sx+RR(R,-30,30);spl.push([[x,wl],[x+RR(R,-10,10),wl-RR(R,6,20)]]);}A(s,spl);s.push(scallop(sx,wl,34,5,10,0.3));
  var wv=[];waterIn(wv,R,RP(4,wl,296,196),wl+3,194,RR(R,4.4,5.2));A(bg,wv);bg.push(wave(4,296,wl,2,22,0));
  var cl=[];for(var c=0;c<2;c++){var ccx=c?RR(R,40,90):RR(R,210,260);cl.push(scallop(ccx,wl-4,RR(R,20,30),6,7,0.2));}A(bg,cl);
  return fin(s,R,bg,sol,wl-6);});

S('Swallows on a wire',['Gathering to Leave','Notes on a Line','Forked Tails','Late August Wire','Seven Before the Storm'],function(R){
  var s=[],sol=[],bg=[],p0=RR(R,14,30),p1=RR(R,270,286),wy=RR(R,78,86),sag=RR(R,8,14);
  [p0,p1].forEach(function(px){var P=RP(px-3,196,px+3,wy-14);FS(s,sol,P,1.2,90);s.push(rect(px-14,wy-14,px+14,wy-10));s.push(circle(px-10,wy-15,2),circle(px+10,wy-15,2));});
  var wire=quad([p0,wy-12],[(p0+p1)/2,wy+sag*2],[p1,wy-12],40),wire2=quad([p0,wy-12],[(p0+p1)/2,wy+sag*2+14],[p1,wy-12],40);s.push(wire);
  var n=RI(R,6,8);for(var i=0;i<n;i++){var x=p0+30+i*((p1-p0-60)/(n-1))+RR(R,-4,4),y=interpY(wire,x),d=R()<0.7?1:-1,sz=RR(R,1.9,2.2);
    var b=M([[0,0],[-3,-6],[-2,-12],[3,-16],[7,-15],[8,-10],[5,-3]],x,y,sz,d);var bP=blob(b,4);FS(s,sol,bP);
    var bk=M([[1,-14],[3,-16],[7,-16],[8,-12],[4,-12]],x,y,sz,d);FS(s,sol,bk,0.6*sz,0);s.push(M([[8,-14],[10,-13.5],[8,-13]],x,y,sz,d));
    var wg=M([[-2,-12],[-6,-2],[-10,8],[-5,0],[2,-9]],x,y,sz,d);FS(s,sol,wg,0.55*sz,60);
    s.push(M([[-4,-2],[-12,10],[-7,0],[-6,12],[-2,-1]],x,y,sz,d));s.push(M([[1,-1],[1,1]],x,y,sz,d));}
  var gy=RR(R,160,168),bx=RR(R,60,150),bw=RR(R,110,130);var barn=[[bx,gy],[bx,gy-40],[bx+bw*0.2,gy-60],[bx+bw*0.5,gy-70],[bx+bw*0.8,gy-60],[bx+bw,gy-40],[bx+bw,gy]];FS(s,sol,barn);
  clipIn(s,[zz(bx,bx+bw,gy-72,gy,4)],barn,[RP(bx+bw*0.38,gy,bx+bw*0.62,gy-30)]);var dr=RP(bx+bw*0.38,gy,bx+bw*0.62,gy-30);s.push(poly(dr));s.push([[dr[0][0],gy],[dr[2][0],gy-30]],[[dr[2][0],gy],[dr[0][0],gy-30]]);
  var lf=RP(bx+bw*0.44,gy-44,bx+bw*0.56,gy-54);FS(s,sol,lf,1.2,0);
  hills(bg,R,gy-10,RR(R,20,30),RR(R,4.4,5),[],RR(R,8,16));gnd(bg,R,gy,RR(R,3.6,4.2));
  return fin(s,R,bg,sol,gy-16);});

// ---- chunk C: instruments, tools, kitchen, food, toys, furniture ----
// interior: perspective floor plus a wall pattern, both kept behind the solids
function room(s,R,fy,sol,kk){var f=[];floorS(f,R,fy,RI(R,14,18));behind(s,f,sol);var w=[],k=kk||wallK(R),W=RP(4,4,296,fy-8);
  if(k==='stripes')H(w,W,RR(R,6.5,8),90);else if(k==='tiles'){var g=RR(R,12,15);H(w,W,g,0);H(w,W,g,90);}else{var g2=RR(R,10,12),an=RR(R,35,55);H(w,W,g2,an);H(w,W,g2,-an);}
  behind(s,w,sol);behind(s,[[[4,fy-8],[296,fy-8]],[[4,fy-3],[296,fy-3]]],sol);return s;}
function onTable(s,R,ty,sol){var t=[];tableS(t,R,ty,pick(R,['stripes','tiles','diag']));behind(s,t,sol);return s;}
function turned(cx,y0,y1,w){var p=[],n=4,h=(y1-y0)/n;for(var i=0;i<n;i++){var a=y0+i*h;p.push([cx-w,a],[cx-w*0.6,a+h*0.5],[cx-w,a+h]);}var q=[];for(var j=n-1;j>=0;j--){var b=y0+j*h;q.push([cx+w,b+h],[cx+w*0.6,b+h*0.5],[cx+w,b]);}return p.concat(q);}

S('Harpsichord',['Two Manuals, Lid Up','Plucked Not Struck','Painted Lid','Continuo Hour','Quills and Jacks'],function(R){
  var s=[],sol=[],fy=RR(R,158,164),x0=RR(R,30,44),x1=RR(R,262,276),ct=fy-RR(R,54,60),ch=20;
  var cs=[[x0,ct],[x1-40,ct],[x1,ct+4],[x1,ct+ch],[x0,ct+ch]];FS(s,sol,cs);s.push(zz(x0+30,x1-2,ct+3,ct+ch-2,RR(R,6,8)));s.push([[x0,ct+4],[x1-30,ct+4]]);
  var la=RR(R,0.42,0.58),lid=[[x0+34,ct],[x1,ct+2],[x1-30-Math.cos(la)*10,ct-Math.sin(la)*(x1-x0-70)],[x0+34,ct-8]];FS(s,sol,lid);
  var inn=[[x0+44,ct-6],[x1-14,ct-2],[x1-38,ct-Math.sin(la)*(x1-x0-80)]];s.push(poly(inn));var ls=[];H(ls,inn,RR(R,2.6,3.2),RR(R,20,40));A(s,ls);
  var ex=x1-50,stick=[[ex,ct],[ex-20,ct-Math.sin(la)*(x1-x0-70)*0.7]];s.push(stick);
  var kb=RP(x0-4,ct+ch,x0+34,ct+2);FS(s,sol,kb);for(var m=0;m<2;m++){var ky=ct+6+m*7;s.push(zz(x0,x0+30,ky,ky+5,1.6));s.push([[x0,ky+5],[x0+30,ky+5]]);}
  s.push(RP(x0+2,ct-2,x0+30,ct-14));H(s,RP(x0+2,ct-2,x0+30,ct-14),1.6,0);
  var legs=[x0+8,x0+(x1-x0)*0.35,x0+(x1-x0)*0.65,x1-8];legs.forEach(function(lx){var L=turned(lx,ct+ch,fy,3);FS(s,sol,L);});s.push([[x0,ct+ch+12],[x1,ct+ch+12]]);
  var sx=x0+RR(R,4,14),st=RP(sx-14,fy-28,sx+14,fy-24);FS(s,sol,st,1.2,0);[sx-11,sx+11].forEach(function(lx){FS(s,sol,RP(lx-1.5,fy,lx+1.5,fy-24));});
  var mus=[[x0+6,ct-14],[x0+28,ct-14],[x0+30,ct-34],[x0+8,ct-34]];FS(s,sol,mus);for(var r=0;r<4;r++){var yy=ct-30+r*4;s.push(wave(x0+10,x0+26,yy,0.6,6,r));}
  room(s,R,fy,sol);return s;});

S('Lute',['Rose and Ribs','Pegbox Bent Back','Eleven Strings','Renaissance Corner','Gut and Spruce'],function(R){
  var s=[],sol=[],ty=RR(R,150,156),a=RR(R,-0.38,-0.26),f=R()<0.5?1:-1,cx=f>0?RR(R,78,90):RR(R,210,222),cy=ty-34;
  function X(P){return rotateAbout(P.map(function(p){return [cx+p[0]*f,cy+p[1]];}),cx,cy,a*f);}
  var bowl=X(ellipse(0,0,46,32).slice(0,-1).map(function(p){return [p[0]<0?p[0]:p[0]*1.25,p[1]];}));var bP=blob(bowl.filter(function(_,i){return i%6===0;}),5);FS(s,sol,bP);
  var rib=[];for(var k=1;k<5;k++)rib.push(X(arc(0,0,46+k*0.01,32-k*6,PI*0.6,PI*1.4)));var neck=X([[56,-6],[140,-4],[140,4],[56,6]]);FS(s,sol,neck);
  var fr=[];for(var q=0;q<8;q++){var fx=62+q*9.5;fr.push(X([[fx,-5.5],[fx,5.5]]));}A(s,fr);
  var pb=X([[140,-5],[168,-14],[170,-6],[140,6]]);FS(s,sol,pb,1.2,30);for(var p=0;p<5;p++){var px=146+p*5;s.push(X([[px,-8+p*-1.4],[px+2,-16-p*1.4]]));s.push(X([[px,6-p*1.4],[px+2,12-p*1.4]]));}
  var rose=X([[-6,0]])[0];s.push(circle(rose[0],rose[1],11));s.push(spiral(rose[0],rose[1],1,10,4,0));for(var j=0;j<8;j++){var aa=j*PI/4;s.push([[rose[0]+3*Math.cos(aa),rose[1]+3*Math.sin(aa)],[rose[0]+10*Math.cos(aa),rose[1]+10*Math.sin(aa)]]);}
  var br=X([[-34,-12],[-30,-12],[-30,12],[-34,12]]);FS(s,sol,br,1,0);var str=[];for(var t=0;t<6;t++){var y=-4+t*1.6;str.push(X([[-32,y],[140,y*0.8]]));}A(s,str);
  var sh=[];H(sh,X([[-46,6],[-30,26],[10,30],[40,22],[56,8],[20,22],[-20,22]]),1.6,a*180/PI*f+(f>0?20:-20));A(s,sh);
  var cnd=f>0?RR(R,236,262):RR(R,30,56),cb=RP(cnd-10,ty,cnd+10,ty-4);FS(s,sol,cb,1,0);var cd=RP(cnd-4,ty-4,cnd+4,ty-40);FS(s,sol,cd);H(s,RP(cnd+1,ty-4,cnd+4,ty-40),1,90);s.push([[cnd,ty-40],[cnd,ty-44]]);s.push(blob([[cnd,ty-44],[cnd-3,ty-50],[cnd,ty-58],[cnd+3,ty-50]],4));
  var smx=f>0?RR(R,160,176):RR(R,62,76),sm=[[smx,ty],[smx+62,ty],[smx+66,ty-3],[smx+4,ty-3]];FS(s,sol,sm);for(var l=0;l<3;l++)s.push(wave(sm[0][0]+6,sm[1][0]-6,ty-1.5,0.4,5,l));
  onTable(s,R,ty,sol);return s;});

S('Steel pan drum',['Caribbean Steel','Notes in the Dents','Tenor Pan','Rubber Tips','Carnival Practice'],function(R){
  var s=[],sol=[],fy=RR(R,166,172),cx=RR(R,130,170),cy=RR(R,92,100),rx=RR(R,84,92),ry=rx*0.36,sk=RR(R,36,42);
  var rim=EP(cx,cy,rx,ry);var side=[[cx-rx,cy]].concat(arc(cx,cy+sk,rx,ry,PI,0)).concat([[cx+rx,cy]]).concat(arc(cx,cy,rx,ry,0,PI).slice(1));FS(s,sol,side);s.push(poly(rim));sol.push(rim);
  var sd=[];H(sd,[[cx+rx*0.4,cy+ry*0.9],[cx+rx,cy],[cx+rx,cy+sk]].concat(arc(cx,cy+sk,rx,ry,0,PI*0.38)),1.6,90);A(s,sd);s.push(arc(cx,cy+sk*0.4,rx,ry,0,PI));clipIn(s,[zz(cx-rx,cx+rx*0.4,cy,cy+sk+ry,4)],side,[rim]);var ib=[];H(ib,EP(cx,cy+ry*0.1,rx*0.86,ry*0.82),5,0);A(s,ib);
  s.push(EP(cx,cy+ry*0.1,rx*0.88,ry*0.85).concat([[cx+rx*0.88,cy+ry*0.1]]));
  var notes=[];for(var i=0;i<10;i++){var t=i/10*TAU,nx=cx+rx*0.68*Math.cos(t),ny=cy+ry*0.66*Math.sin(t);notes.push(poly(rotateAbout(EP(nx,ny,9,4.5),nx,ny,t*0.3)));}for(var j=0;j<4;j++){var t2=j/4*TAU+0.4,nx2=cx+rx*0.32*Math.cos(t2),ny2=cy+ry*0.3*Math.sin(t2);notes.push(poly(EP(nx2,ny2,7,3.2)));}notes.push(poly(EP(cx,cy,5,2.2)));A(s,notes);
  [cx-rx*0.7,cx+rx*0.7].forEach(function(lx,i){s.push([[lx,cy+sk+ry*0.6],[lx+(i?14:-14),fy]]);s.push([[lx,cy+sk+ry*0.6],[lx+(i?-6:6),fy]]);});s.push([[cx-rx*0.7-8,fy-20],[cx+rx*0.7+8,fy-20]]);
  [[-1,0.3],[1,-0.4]].forEach(function(m){var mx=cx+m[0]*rx*0.35,my=cy-RR(R,4,10),st=rotateAbout([[mx,my],[mx+46,my-14]],mx,my,m[1]);s.push(st);var tip=st[1];var T=EP(tip[0],tip[1],4,3.4);FS(s,sol,T,1,0);});
  room(s,R,fy,sol);return s;});

S('Block and tackle',['Four Falls','Mechanical Advantage','Hoist From the Loft','Hook and Sheave','Heave Together'],function(R){
  var s=[],sol=[],bm=RR(R,20,26),cx=RR(R,130,170),y1=RR(R,44,50),y2=RR(R,104,114);
  var B=RP(4,bm,296,bm-14);FS(s,sol,B);s.push(planks(4,bm-14,296,bm,4.6)[1]);s.push(planks(4,bm-14,296,bm,4.6)[2]);
  s.push([[cx,bm],[cx,y1-14]]);s.push(circle(cx,bm+4,3));
  function block(y,dn){var P=blob([[cx-12,y-12],[cx,y-16],[cx+12,y-12],[cx+12,y+10],[cx,y+14],[cx-12,y+10]],4);FS(s,sol,P);s.push(circle(cx-4,y,6.5),circle(cx+4,y,6.5));s.push(circle(cx,y,1.5));H(s,[[cx+6,y-12],[cx+12,y-12],[cx+12,y+10],[cx+6,y+12]],1.2,90);
    if(dn){s.push([[cx,y+14],[cx,y+20]]);s.push(arc(cx,y+28,7,8,-PI/2,PI*0.95));}}
  block(y1,false);block(y2,true);
  var rp=[];[-10,-3,3,10].forEach(function(dx,i){rp.push([[cx+dx,y1+5],[cx+dx,y2-6]]);});A(s,rp);var fall=curve([[cx-10,y1],[cx-30,y1+40],[cx-60,y2+20],[cx-70,170]],8);s.push(fall);s.push(fall.map(function(p){return [p[0]+2,p[1]];}));
  var ly=y2+34,ld=RR(R,0,1)<0.5?'crate':'barrel';s.push([[cx,y2+28],[cx-20,ly],[cx+20,ly]]);s.push([[cx,y2+28],[cx+20,ly]]);
  if(ld==='crate'){var C=RP(cx-28,ly,cx+28,ly+44);FS(s,sol,C);s.push(planks(cx-28,ly,cx+28,ly+44,7.3).reduce(function(a,b){return a.concat(b);},[]));s.push([[cx-28,ly],[cx+28,ly+44]]);H(s,RP(cx+14,ly,cx+28,ly+44),1.6,90);}
  else{var Bp=[[cx-22,ly]].concat(cubic([cx-22,ly],[cx-32,ly+20],[cx-32,ly+30],[cx-22,ly+48],10)).concat([[cx+22,ly+48]]).concat(cubic([cx+22,ly+48],[cx+32,ly+30],[cx+32,ly+20],[cx+22,ly],10));FS(s,sol,Bp);for(var h=0;h<3;h++){var hy=ly+8+h*16;s.push([[cx-28,hy],[cx+28,hy]]);}H(s,[[cx+10,ly],[cx+22,ly],[cx+30,ly+24],[cx+22,ly+48],[cx+10,ly+48]],1.6,90);}
  var dr=RP(RR(R,30,60),196,RR(R,90,110),RR(R,60,70));var dw=dr[1][0]-dr[0][0];var dP=poly(dr);
  var br=[];br.push(brickS(4,bm,296,196,RR(R,16,20),RR(R,7,8)));behind(s,br,sol.concat([dr]));s.push(dP);var dl=[];H(dl,dr,RR(R,3,3.6),RR(R,30,60));behind(s,dl,sol);
  var fh=[];fh.push(curve([[cx-70,170],[cx-80,186],[cx-60,192],[cx-50,184]],5));A(s,fh);s.push([[4,192],[296,192]]);
  return s;});

S('Cider press',['First Pressing','Turn the Screw','Pomace and Juice','October Orchard','Russet and Bramley'],function(R){
  var s=[],sol=[],fy=RR(R,168,174),cx=RR(R,120,150),w=RR(R,46,52),ty=RR(R,36,44);
  var p1=RP(cx-w-8,fy,cx-w,ty),p2=RP(cx+w,fy,cx+w+8,ty);FS(s,sol,p1,1.4,90);FS(s,sol,p2,1.4,90);var tb=RP(cx-w-14,ty+12,cx+w+14,ty);FS(s,sol,tb,1.6,0);
  var scr=RP(cx-4,ty,cx+4,ty+52);FS(s,sol,scr);var th=[];for(var y=ty+3;y<ty+52;y+=3)th.push([[cx-4,y],[cx+4,y+2]]);A(s,th);
  var hb=rotateAbout(RP(cx-40,ty+18,cx+40,ty+22),cx,ty+20,RR(R,-0.2,0.2));FS(s,sol,hb);s.push(circle(cx-38,ty+20,3));s.push(circle(cx+38,ty+20,3));
  var pl=RP(cx-w+6,ty+52,cx+w-6,ty+60);FS(s,sol,pl,1.4,0);
  var bk=RP(cx-w+8,ty+60,cx+w-8,fy-30);FS(s,sol,bk);s.push(zz(cx-w+8,cx+w-8,ty+60,fy-30,RR(R,5,6)));var bh=[];H(bh,RP(cx-w+8,ty+60,cx+w-8,fy-30),RR(R,8,9),0);A(s,bh);
  var tr=[[cx-w-6,fy-30],[cx+w+6,fy-30],[cx+w+16,fy-24],[cx+w+6,fy-18],[cx-w-6,fy-18]];FS(s,sol,tr,1.4,0);s.push([[cx+w+16,fy-24],[cx+w+18,fy-20]]);
  var jug=[[cx+w+10,fy],[cx+w+8,fy-12],[cx+w+12,fy-16],[cx+w+26,fy-16],[cx+w+30,fy-12],[cx+w+28,fy]];FS(s,sol,jug,1.6,80);s.push(arc(cx+w+30,fy-8,4,5,-PI/2,PI/2));s.push([[cx+w+18,fy-20],[cx+w+18,fy-16]]);
  var bx=RR(R,210,240),bk2=[[bx,fy],[bx-4,fy-30],[bx+50,fy-30],[bx+46,fy]];FS(s,sol,bk2);s.push(zz(bx,bx+46,fy-28,fy-2,3));
  for(var a=0;a<RI(R,6,8);a++){var ax=bx+4+a*6.5,ay=fy-34-((a%2)*7),A0=circle(ax,ay,5.5);FS(s,sol,A0.slice(0,-1),a%2?1.2:0,30);s.push([[ax,ay-5],[ax+1,ay-8]]);}
  var gr=[];for(var g=0;g<RI(R,4,6);g++){var gx=RR(R,10,cx-w-20),gyy=fy-RR(R,0,4);gr.push(circle(gx,gyy-5,5));}gr.forEach(function(c){SOL(s,sol,c.slice(0,-1));s.push(c);});
  room(s,R,fy,sol);return s;});

S('Butter churn',['Dasher Up, Dasher Down','Cream Turning','Farm Kitchen Chore','Staves and Hoops','Buttermilk by Noon'],function(R){
  var s=[],sol=[],fy=RR(R,170,176),cx=RR(R,120,160),bw=RR(R,30,34),tw=RR(R,22,25),h=RR(R,100,110),ty=fy-h;
  var ch=[[cx-bw,fy]].concat(arc(cx,fy,bw,bw*0.25,PI,0).slice(1)).concat([[cx+tw,ty]]).concat(arc(cx,ty,tw,tw*0.25,0,PI).slice(1));FS(s,sol,ch);
  var st=[],d=1;for(var i=1;i<9;i++){var t=i/9,a=PI*t,xb=cx-bw*Math.cos(a),xt=cx-tw*Math.cos(a);if(d>0)st.push([xb,fy+bw*0.25*Math.sin(a)],[xt,ty+tw*0.25*Math.sin(a)]);else st.push([xt,ty+tw*0.25*Math.sin(a)],[xb,fy+bw*0.25*Math.sin(a)]);d=-d;}s.push(st);
  [0.15,0.5,0.85].forEach(function(t){var yy=fy-h*t,ww=bw+(tw-bw)*t;var hp=[[cx-ww,yy-2]].concat(arc(cx,yy-2,ww,ww*0.25,PI,0).slice(1)).concat([[cx+ww,yy+2]]).concat(arc(cx,yy+2,ww,ww*0.25,0,PI).slice(1));FS(s,sol,hp,1,0);});
  H(s,[[cx+bw*0.45,fy+bw*0.2],[cx+bw,fy],[cx+tw,ty],[cx+tw*0.45,ty+tw*0.2]],1.6,90);
  var lid=EP(cx,ty-2,tw+3,(tw+3)*0.28);FS(s,sol,lid);s.push([[cx-tw-3,ty-2],[cx-tw-3,ty+1]].concat(arc(cx,ty+1,tw+3,(tw+3)*0.28,PI,0).slice(1)).concat([[cx+tw+3,ty-2]]));
  var dsh=RP(cx-2.2,ty-2,cx+2.2,ty-56);FS(s,sol,dsh);s.push(EP(cx,ty-58,5,2.4).concat([[cx+5,ty-58]]));
  var py=fy,px=cx+bw+RR(R,30,46),pail=[[px-16,py],[px-20,py-30],[px+20,py-30],[px+16,py]];FS(s,sol,pail);s.push(EP(px,py-30,20,4));H(s,[[px+6,py],[px+16,py],[px+20,py-30],[px+8,py-30]],1.4,80);s.push(arc(px,py-30,20,22,PI,TAU));s.push(zz(px-16,px+16,py-24,py-22,4));
  var sx=cx-bw-RR(R,40,56),stl=EP(sx,fy-28,20,5);FS(s,sol,stl);s.push([[sx-20,fy-28],[sx-20,fy-24]].concat(arc(sx,fy-24,20,5,PI,0).slice(1)).concat([[sx+20,fy-28]]));[[-14,-4],[0,0],[14,4]].forEach(function(l){FS(s,sol,RP(sx+l[0]-1.5,fy+l[1]*0.5,sx+l[0]+1.5,fy-22));});
  var bt=EP(sx,fy-36,10,3);var bb=[[sx-12,fy-30],[sx-10,fy-36],[sx+10,fy-36],[sx+12,fy-30]];FS(s,sol,bb,1,0);s.push([[sx-8,fy-36],[sx-6,fy-42],[sx+6,fy-42],[sx+8,fy-36]]);
  room(s,R,fy,sol);return s;});

S('Floor loom',['Warp and Weft','Shuttle Thrown','Treadles and Heddles','Twill in Progress','Four Shafts'],function(R){
  var s=[],sol=[],fy=RR(R,174,180),x0=RR(R,50,64),x1=RR(R,236,250),top=RR(R,26,34),bh=fy-60;
  [x0,x1].forEach(function(x){var P=RP(x-5,fy,x+5,top);FS(s,sol,P,1.3,90);});var tb=RP(x0-8,top+8,x1+8,top);FS(s,sol,tb,1.5,0);
  var cb=RP(x0-6,bh+4,x1+6,bh-4);FS(s,sol,cb);var hb=RP(x0+8,top+50,x1-8,top+44);FS(s,sol,hb);var hb2=RP(x0+8,top+76,x1-8,top+70);FS(s,sol,hb2);
  var wp=[],d=1,n=RI(R,28,32);for(var i=0;i<=n;i++){var xt=x0+14+(x1-x0-28)*i/n,xb=x0+10+(x1-x0-20)*i/n;if(d>0)wp.push([xt,top+8],[xb,bh-4]);else wp.push([xb,bh-4],[xt,top+8]);d=-d;}clipIn(s,[wp],RP(x0,top+8,x1,bh-4),[hb,hb2]);
  
  var cl=RP(x0+10,bh-4,x1-10,bh-28);FS(s,sol,cl);var tw=[];H(tw,cl,RR(R,2.8,3.2),40);A(s,tw);
  var bt=RP(x0+10,bh-34,x1-10,bh-30);FS(s,sol,bt);var sh=blob([[x0+60,bh-36],[x0+70,bh-40],[x0+110,bh-40],[x0+120,bh-36],[x0+110,bh-33],[x0+70,bh-33]],4);FS(s,sol,sh,1,0);
  s.push([[x0-6,bh+4],[x0-14,fy]],[[x1+6,bh+4],[x1+14,fy]]);for(var t=0;t<4;t++){var tx=x0+50+t*26;s.push([[tx,bh+4],[tx-8,fy-4],[tx+6,fy-4],[tx+12,bh+4]]);}
  var bn=RP(x0+30,fy-26,x1-30,fy-30);FS(s,sol,bn,1,0);[x0+36,x1-36].forEach(function(lx){FS(s,sol,RP(lx-2,fy,lx+2,fy-26));});
  var bs=x1+RR(R,12,20);if(bs<270){var bk=[[bs,fy],[bs-4,fy-24],[bs+30,fy-24],[bs+26,fy]];FS(s,sol,bk);s.push(zz(bs,bs+26,fy-22,fy-2,3));[0,1,2].forEach(function(b){var c=circle(bs+6+b*9,fy-30,5.5);SOL(s,sol,c.slice(0,-1));s.push(c);s.push(spiral(bs+6+b*9,fy-30,0.5,5,2,b));});}
  room(s,R,fy,sol,'stripes');return s;});

S('Stand mixer',['Speed Two, Folding','Whisk Raised','Sunday Batter','Countertop Engine','Bowl Locked In'],function(R){
  var s=[],sol=[],ty=RR(R,160,166),cx=RR(R,120,170),f=R()<0.5?1:-1;function X(P){return P.map(function(p){return [cx+p[0]*f,p[1]];});}
  var base=X([[-60,ty],[-60,ty-12],[40,ty-12],[50,ty-6],[50,ty]]);FS(s,sol,base,1.6,0);
  var col=blob(X([[-60,ty-12],[-64,ty-50],[-56,ty-96],[-34,ty-100],[-36,ty-60],[-30,ty-12]]),5);FS(s,sol,col);H(s,X([[-60,ty-14],[-64,ty-50],[-58,ty-90],[-50,ty-92],[-52,ty-50],[-50,ty-14]]),1.6,80);
  var head=blob(X([[-64,ty-96],[-60,ty-122],[-20,ty-130],[30,ty-126],[50,ty-114],[46,ty-98],[10,ty-94],[-40,ty-92]]),6);FS(s,sol,head);
  var hl=[];for(var k=0;k<3;k++)hl.push(curve(X([[-50,ty-112+k*5],[0,ty-118+k*5],[40,ty-112+k*5]]),5));A(s,hl);s.push(circle(cx-40*f,ty-110,4));s.push(X([[-56,ty-100],[-62,ty-104],[-66,ty-100]]));
  var bw=[[-20,ty-70],[52,ty-70],[44,ty-30],[30,ty-14],[-6,ty-14],[-14,ty-30]];var bP=blob(X(bw),5);FS(s,sol,bP);s.push(EP(cx+16*f,ty-70,36,6).concat([[cx+16*f+36,ty-70]]));
  var shine=[];H(shine,X([[30,ty-66],[48,ty-66],[42,ty-34],[30,ty-20]]),1.6,80);A(s,shine);s.push(X([[-6,ty-14],[-4,ty-12],[34,ty-12],[30,ty-14]]));
  var shaft=X([[14,ty-96],[14,ty-72]]);s.push(shaft);var wk=[];for(var j=0;j<5;j++){var wx=6+j*4;wk.push(X([[14,ty-74],[wx,ty-54],[14,ty-38],[28-j*4,ty-54],[14,ty-74]]));}A(s,wk);
  var bat=[];bat.push(scallop(cx+16*f,ty-66,30,4,9,0.3));A(s,bat);
  var eg=RR(R,0.5,1)<0.75;var ex=cx-90*f;if(ex>20&&ex<280){var eb=[[ex-20,ty],[ex-24,ty-12],[ex+24,ty-12],[ex+20,ty]];FS(s,sol,eb,1.6,80);[[-10,0],[2,-2],[13,0]].forEach(function(e){var E=EP(ex+e[0],ty-18+e[1],6,8);FS(s,sol,E);});}
  var fx=cx+90*f;if(fx>20&&fx<280){var bag=[[fx-18,ty],[fx-20,ty-44],[fx-14,ty-50],[fx+14,ty-50],[fx+20,ty-44],[fx+18,ty]];FS(s,sol,bag);s.push(zz(fx-14,fx+14,ty-50,ty-44,3));s.push(RP(fx-12,ty-14,fx+12,ty-30));}
  onTable(s,R,ty,sol);return s;});

S('Bundt cake',['Fluted and Glazed','Ring of Lemon','Sunday Ring','Drip by Drip','One Slice Missing'],function(R){
  var s=[],sol=[],ty=RR(R,162,168),cx=RR(R,130,160),rx=RR(R,62,70),ry=rx*0.32,h=RR(R,46,52),py=ty-22;
  var st=[[cx-12,ty],[cx-6,ty-6],[cx-6,py],[cx+6,py],[cx+6,ty-6],[cx+12,ty]];FS(s,sol,st);var pl=EP(cx,py,rx+16,(rx+16)*0.28);FS(s,sol,pl);s.push(EP(cx,py-1,rx+10,(rx+10)*0.26).concat([[cx+rx+10,py-1]]));
  var bt=py-2,tp=bt-h,flutes=RI(R,10,12),side=[[cx-rx,bt]];for(var i=0;i<=flutes*2;i++){var t=i/(flutes*2),a=PI-PI*t;side.push([cx+rx*Math.cos(a),bt+ry*Math.sin(a)]);}
  var cake=[[cx-rx,bt],[cx-rx*0.82,tp+8]].concat(arc(cx,tp+8,rx*0.82,ry*0.8,PI,TAU).slice(1)).concat([[cx+rx,bt]]).concat(arc(cx,bt,rx,ry,0,PI).slice(1));FS(s,sol,cake);
  var fl=[],d=1;for(var j=1;j<flutes*2;j++){var a2=PI-PI*j/(flutes*2),xb=cx+rx*Math.cos(a2),yb=bt+ry*Math.sin(a2),xt=cx+rx*0.82*Math.cos(a2),yt=tp+8+ry*0.8*Math.sin(a2);if(j%2){fl.push(d>0?[[xb,yb],[xt,yt]]:[[xt,yt],[xb,yb]]);d=-d;}}A(s,fl);
  var hole=EP(cx,tp+8,rx*0.24,ry*0.22);s.push(poly(hole));H(s,hole,1,0);
  var gl=[];for(var k=0;k<=flutes*2;k++){var a3=PI-PI*k/(flutes*2),x=cx+rx*0.85*Math.cos(a3),y=tp+8+ry*0.85*Math.sin(a3);gl.push([x,y]);if(k%3===1){var dl=RR(R,8,20);gl.push([x-1.5,y+dl],[x+1.5,y+dl],[x,y]);}}s.push(gl);
  var sh=[];H(sh,[[cx+rx*0.4,bt+ry*0.9],[cx+rx,bt],[cx+rx*0.82,tp+8],[cx+rx*0.35,tp+8+ry*0.7]],1.6,85);A(s,sh);
  var sx=cx+(R()<0.5?-1:1)*RR(R,100,116);if(sx>20&&sx<280){var plt=EP(sx,ty-4,26,7);FS(s,sol,plt);var sl=[[sx-16,ty-6],[sx-10,ty-36],[sx+4,ty-36],[sx+14,ty-6]];FS(s,sol,sl);H(s,[[sx-12,ty-14],[sx-10,ty-30],[sx+4,ty-30],[sx+10,ty-14]],RR(R,2,2.4),45);s.push(wave(sx-10,sx+4,ty-36,1.2,5,0));s.push([[sx+18,ty-4],[sx+30,ty-26],[sx+32,ty-24],[sx+22,ty-3]]);}
  var lx=cx-(sx>cx?1:-1)*RR(R,96,110);if(lx>20&&lx<280){[[0,0],[16,4]].forEach(function(l){var L=EP(lx+l[0],ty-8-l[1],10,7);FS(s,sol,L,1.4,30);s.push([[lx+l[0]+10,ty-8-l[1]],[lx+l[0]+13,ty-9-l[1]]]);});}
  onTable(s,R,ty,sol);return s;});

S('Bamboo dumpling steamer',['Three Tiers of Steam','Pleated Pockets','Dim Sum Morning','Lid Lifted','Chopsticks Ready'],function(R){
  var s=[],sol=[],ty=RR(R,160,166),cx=RR(R,110,140),rx=RR(R,50,56),ry=rx*0.3,th=RR(R,20,24),n=3;
  for(var i=0;i<n;i++){var b=ty-i*th,t=b-th;var P=[[cx-rx,t],[cx-rx,b]].concat(arc(cx,b,rx,ry,PI,0).slice(1)).concat([[cx+rx,t]]).concat(arc(cx,t,rx,ry,0,PI).slice(1));FS(s,sol,P);
    var wv=[];H(wv,P,RR(R,3.6,4),35);H(wv,P,RR(R,3.6,4),-35);clipIn(s,wv,P,[]);s.push(arc(cx,t+3,rx,ry,0,PI));s.push(arc(cx,b-3,rx,ry,0,PI));}
  var lt=ty-n*th,la=RR(R,-0.25,-0.12),lid=rotateAbout([[cx-rx,lt-2]].concat(arc(cx,lt-2,rx,ry*2.2,PI,TAU)).concat([[cx+rx,lt-2]]),cx+rx,lt,la);FS(s,sol,lid);s.push(rotateAbout(arc(cx,lt-2,rx*0.4,ry*0.9,PI,TAU),cx+rx,lt,la));
  var ldw=[];H(ldw,lid,3,40);H(ldw,lid,3,-40);clipIn(s,ldw,lid,[]);
  var top=EP(cx,lt,rx,ry);s.push(poly(top));
  for(var d=0;d<3;d++){var dx=cx-rx*0.5+d*rx*0.5,dy=lt-2;var dm=[[dx-12,dy+2]].concat(arc(dx,dy+2,12,10,PI,TAU).slice(1));SOL(s,sol,dm);s.push(dm);for(var p=0;p<5;p++)s.push(quad([dx-8+p*4,dy-7],[dx-6+p*4,dy-2],[dx-7+p*4,dy+2]));}
  var stm=[];for(var q=0;q<3;q++){var sx=cx-24+q*24;stm.push(curve([[sx,lt-14],[sx+6,lt-26],[sx-4,lt-38],[sx+6,lt-50]],5));}A(s,stm);
  var px=cx+rx+RR(R,60,80);if(px<270){var pl=EP(px,ty-4,30,8);FS(s,sol,pl);[[-12,0],[10,1],[0,-6]].forEach(function(o){var g=[[px+o[0]-10,ty-6+o[1]]].concat(arc(px+o[0],ty-6+o[1],10,8,PI,TAU).slice(1));SOL(s,sol,g);s.push(g);s.push(zz(px+o[0]-6,px+o[0]+6,ty-14+o[1],ty-10+o[1],2.4));});
    var ds=EP(px-44,ty-3,10,3);FS(s,sol,ds,1,0);s.push([[px-60,ty-10],[px-10,ty-28]],[[px-58,ty-8],[px-8,ty-24]]);}
  var tp=[[cx-rx-60,ty],[cx-rx-62,ty-24],[cx-rx-30,ty-24],[cx-rx-32,ty]];if(tp[1][0]>10){FS(s,sol,tp,1.6,80);s.push(EP(cx-rx-46,ty-24,16,3));}
  onTable(s,R,ty,sol);return s;});

S('Corn on the cob',['Husks Pulled Back','Butter Melting','August Harvest','Golden Rows','Three Ears Shucked'],function(R){
  var s=[],sol=[],ty=RR(R,164,170),n=3;var gapC=84;
  var bd=[[24,ty],[30,ty-14],[270,ty-14],[276,ty]];FS(s,sol,bd);s.push(zz(30,270,ty-13,ty-1,RR(R,10,14)));
  for(var i=0;i<n;i++){var cx=72+i*gapC+RR(R,-4,4),cy=ty-30-(i%2)*16,a=RR(R,-0.2,0.2),L=RR(R,36,40),W=RR(R,12,13);
    var cob=rotateAbout(blob([[cx-L,cy],[cx-L+6,cy-W],[cx+L-14,cy-W*0.85],[cx+L,cy],[cx+L-14,cy+W*0.85],[cx-L+6,cy+W]],5),cx,cy,a);FS(s,sol,cob);
    var kr=[];kr.push(scallopRows(cx-L-4,cx+L+4,cy-W,cy+W,5,4.2));clipIn(s,kr.map(function(st){return rotateAbout(st,cx,cy,a);}),cob,[]);
    var hk=[];[[-1,1.6],[1,1.2],[0,1.9]].forEach(function(h){var P=[[cx-L+2,cy+h[0]*W*0.4],[cx-L-14,cy+h[0]*W*1.6],[cx-L-24*h[1],cy+h[0]*W*1.1+4],[cx-L-4,cy+h[0]*2]];hk.push(rotateAbout(blob(P,4),cx,cy,a));});
    hk.forEach(function(P){FS(s,sol,P);var v=[];H(v,P,2.2,a*180/PI+10);A(s,v);});var stem=rotateAbout(RP(cx-L-12,cy-4,cx-L+2,cy+4),cx,cy,a);FS(s,sol,stem);}
  var bx=RR(R,236,252),bt=RP(bx,ty-14,bx+20,ty-26);FS(s,sol,bt);s.push([[bx,ty-26],[bx+6,ty-30],[bx+26,ty-30],[bx+20,ty-26]],[[bx+20,ty-14],[bx+26,ty-18],[bx+26,ty-30]]);s.push(curve([[bx+4,ty-26],[bx+6,ty-22],[bx+8,ty-26]],3));
  var sl=RR(R,20,44),sh=[[sl,ty-14],[sl+3,ty-30],[sl+11,ty-30],[sl+14,ty-14]];FS(s,sol,sh,1.6,90);s.push(EP(sl+7,ty-32,5,2.4));
  onTable(s,R,ty,sol);return s;});

S('Egg carton',['A Dozen Brown','Two Missing','Farm Stand Eggs','Speckled Shells','Cracked for Breakfast'],function(R){
  var s=[],sol=[],ty=RR(R,160,166),x0=RR(R,34,46),x1=RR(R,250,262),dep=RR(R,26,32),h=22,cw=(x1-x0)/6;
  var box=[[x0,ty],[x0+10,ty-dep],[x1+10,ty-dep],[x1+10,ty-dep+h],[x1,ty],[x0,ty]];var bx=[[x0,ty],[x0+10,ty-dep],[x1+10,ty-dep],[x1+10,ty-dep+h],[x1,ty]];
  var fr=RP(x0,ty,x1,ty-h);FS(s,sol,fr);var bump=[[x0,ty-h]];for(var c=0;c<6;c++){A(bump,arc(x0+cw*(c+0.5),ty-h,cw/2,4,PI,0).slice(1));}s.push(bump);for(var c2=1;c2<6;c2++)s.push([[x0+cw*c2,ty-h],[x0+cw*c2,ty]]);
  H(s,[[x1,ty],[x1,ty-h],[x1+10,ty-dep],[x1+10,ty-dep+h]],1.4,90);s.push([[x1,ty-h],[x1+10,ty-dep]]);
  var lid=[[x0+10,ty-dep],[x0+6,ty-dep-40],[x1+6,ty-dep-40],[x1+10,ty-dep]];FS(s,sol,lid);s.push(zz(x0+12,x1+8,ty-dep-38,ty-dep-2,RR(R,12,16)));var lab=RP(x0+80,ty-dep-30,x0+140,ty-dep-12);s.push(poly(lab));H(s,lab,1.4,0);
  var miss=[RI(R,0,11),RI(R,0,11)];var eggs=[];for(var r=0;r<2;r++)for(var k=0;k<6;k++){var id=r*6+k;if(miss.indexOf(id)>=0)continue;var ex=x0+cw*(k+0.5)+(1-r)*6,ey=ty-h-(1-r)*12+2,E=EP(ex,ey-8,cw*0.36,11);eggs.push([E,ex,ey,r]);}
  eggs.sort(function(a,b){return a[3]-b[3];}).forEach(function(e){FS(s,sol,e[0]);var sh=[];H(sh,[[e[1]+cw*0.12,e[2]-14],[e[1]+cw*0.36,e[2]-8],[e[1]+cw*0.2,e[2]+2],[e[1]+cw*0.05,e[2]+2]],1.5,80);A(s,sh);for(var sp=0;sp<2;sp++)s.push(circle(e[1]+RR(R,-6,2),e[2]-8+RR(R,-6,4),0.7));});
  var bw=RR(R,0,1);var bwx=x1+RR(R,-10,0)<260?RR(R,264,276):RR(R,264,276);var bowl=[[bwx-16,ty],[bwx-22,ty-14],[bwx+14,ty-14],[bwx+10,ty]];if(bwx+14<296){FS(s,sol,bowl,1.6,80);s.push(EP(bwx-4,ty-14,18,3.5));}
  var cr=[[x0-14,ty],[x0-26,ty-10],[x0-22,ty-16],[x0-18,ty-10],[x0-14,ty-16],[x0-10,ty-8],[x0-6,ty]];if(x0-26>6){FS(s,sol,cr,1.2,30);}
  onTable(s,R,ty,sol);return s;});

S('Gingerbread house',['Icing on the Eaves','Gumdrop Path','Candy Cane Porch','Sugar Snow','Baked for December'],function(R){
  var s=[],sol=[],ty=RR(R,166,172),cx=RR(R,130,160),w=RR(R,66,74),h=RR(R,46,52),wt=ty-h,pk=wt-RR(R,46,52),d=RR(R,30,36);
  var bd=EP(cx+10,ty+2,w+40,10);FS(s,sol,bd);
  var F=[[cx-w/2,ty],[cx-w/2,wt],[cx,pk],[cx+w/2,wt],[cx+w/2,ty]];FS(s,sol,F);var S1=[[cx+w/2,ty],[cx+w/2+d,ty-d*0.4],[cx+w/2+d,wt-d*0.4],[cx+w/2,wt]];FS(s,sol,S1);
  var roof=[[cx-w/2-6,wt+4],[cx,pk-4],[cx+d,pk-4-d*0.4],[cx+w/2+d+6,wt-d*0.4+4],[cx+w/2+6,wt+4]];FS(s,sol,roof);
  var sc=[];sc.push(scallopRows(cx+2,cx+w/2+d+6,pk,wt+4,7,5));clipIn(s,sc,[[cx+2,pk-2],[cx+d,pk-6-d*0.4],[cx+w/2+d+6,wt-d*0.4+4],[cx+w/2+6,wt+4]],[]);
  var ic=[];var e1=lerp([cx-w/2-6,wt+4],[cx,pk-4],0),e2=[cx,pk-4];for(var i=0;i<=10;i++){var p=lerp([cx-w/2-6,wt+4],[cx,pk-4],i/10);ic.push(p);if(i<10){var q=lerp([cx-w/2-6,wt+4],[cx,pk-4],(i+0.5)/10);ic.push([q[0]+1,q[1]+4]);}}for(var j=0;j<=10;j++){var p2=lerp([cx,pk-4],[cx+w/2+6,wt+4],j/10);ic.push(p2);if(j<10){var q2=lerp([cx,pk-4],[cx+w/2+6,wt+4],(j+0.5)/10);ic.push([q2[0]-1,q2[1]+4]);}}s.push(ic);
  var eave=[];for(var k=0;k<14;k++){var ex=cx+w/2+6+k*(d/14),ey=wt+4-k*(d*0.4/14);eave.push([ex,ey],[ex+d/28,ey+3]);}s.push(eave);
  var dr=[[cx-9,ty],[cx-9,ty-20]].concat(arc(cx,ty-20,9,9,PI,TAU).slice(1)).concat([[cx+9,ty]]);FS(s,sol,dr);s.push(circle(cx+5,ty-12,1.4));var dz=[];H(dz,dr,2.2,90);A(s,dz);
  [[cx-w/2+8,wt+10],[cx+w/2-24,wt+10]].forEach(function(p){var W=RP(p[0],p[1],p[0]+16,p[1]+14);FS(s,sol,W,1.4,45);s.push([[p[0]+8,p[1]],[p[0]+8,p[1]+14]],[[p[0],p[1]+7],[p[0]+16,p[1]+7]]);s.push(scallop(p[0]+8,p[1]-1,9,2,6,0.3).slice(0,24));});
  s.push(circle(cx,pk+18,6));s.push(spiral(cx,pk+18,0.5,5,2,0));
  var sw=[];sw.push(circle(cx+w/2+d/2,ty-d*0.2-20,6));sw.push(circle(cx+w/2+d/2,ty-d*0.2-20,3));A(s,sw);
  [cx-w/2-10,cx+w/2+d+10].forEach(function(px,i){var cc=[[px-2,ty],[px-2,ty-28]].concat(arc(px+4,ty-28,6,6,PI,TAU).slice(1)).concat([[px+10,ty-28],[px+7,ty-28]]).concat(arc(px+4,ty-28,3,3,0,-PI).slice(1)).concat([[px+1,ty-28],[px+1,ty]]);FS(s,sol,cc);for(var st=0;st<6;st++)s.push([[px-2,ty-4-st*4],[px+1,ty-6-st*4]]);});
  for(var g=0;g<RI(R,6,8);g++){var gx=cx-w/2-30+g*14+RR(R,-3,3),gp=[[gx-5,ty+4]].concat(arc(gx,ty+4,5,5,PI,TAU).slice(1));SOL(s,sol,gp);s.push(gp);s.push(circle(gx,ty+1,0.8));}
  var ch=RP(cx+d*0.6,pk-d*0.24+2,cx+d*0.6+10,pk-d*0.24-16);FS(s,sol,ch);s.push(scallop(cx+d*0.6+5,pk-d*0.24-17,7,2.4,6,0.3));
  onTable(s,R,ty-4,sol);return s;});

S('Pinwheel',['Turning in the Breeze','Four Curls','Paper Windmill','Spin Me','Garden Gust'],function(R){
  var s=[],sol=[],gy=RR(R,170,176),cx=RR(R,130,170),cy=RR(R,70,80),r=RR(R,50,56),a0=R()*TAU;
  var stk=RP(cx-2,gy,cx+2,cy);FS(s,sol,stk);
  for(var k=0;k<4;k++){var a=a0+k*PI/2,b=a+PI/2;var tip=[cx+r*Math.cos(a),cy+r*Math.sin(a)],side=[cx+r*0.7*Math.cos(b),cy+r*0.7*Math.sin(b)];var c=[cx+r*0.42*Math.cos(a+0.6),cy+r*0.42*Math.sin(a+0.6)];
    var V=[[cx,cy],tip].concat(quad(tip,[cx+r*0.9*Math.cos(a+0.5),cy+r*0.9*Math.sin(a+0.5)],c,8)).concat([[cx,cy]]);FS(s,sol,V.slice(0,-1));
    var V2=[[cx,cy],side,tip];var vh=[];H(vh,V2,RR(R,2,2.4),(a*180/PI)+20);behind(s,vh,[V.slice(0,-1)]);s.push(V2);}
  s.push(circle(cx,cy,3.4));s.push(circle(cx,cy,1.2));
  
  var pot=[[cx-30,gy],[cx-36,gy-30],[cx+36,gy-30],[cx+30,gy]];FS(s,sol,pot);var rim=RP(cx-38,gy-30,cx+38,gy-38);FS(s,sol,rim,1.6,0);H(s,[[cx+12,gy],[cx+30,gy],[cx+36,gy-30],[cx+14,gy-30]],1.6,80);
  var fl=[];for(var f=0;f<5;f++){var fx=cx-26+f*13,fh=RR(R,10,22);fl.push([[fx,gy-38],[fx+RR(R,-3,3),gy-38-fh]]);fl.push(scallop(fx,gy-42-fh,5,5,6,0.3));}A(s,fl);
  for(var p=0;p<RI(R,2,3);p++){var px=R()<0.5?RR(R,20,cx-70):RR(R,cx+70,280),ps=RR(R,0.35,0.5),py=gy-RR(R,40,60);s.push([[px,gy],[px,py]]);for(var k2=0;k2<4;k2++){var aa=k2*PI/2+R(),tp=[px+r*ps*Math.cos(aa),py+r*ps*Math.sin(aa)];var VV=[[px,py],tp,[px+r*ps*0.45*Math.cos(aa+0.6),py+r*ps*0.45*Math.sin(aa+0.6)],[px,py]];s.push(VV);}}
  var fn=[];fn.push(comb(4,296,gy-24,26,10));behind(s,fn,sol);s.push([[4,gy-38],[296,gy-38]]);
  var g=[];gnd(g,R,gy,RR(R,3.4,4));behind(s,g,sol);
  return sky(s,R,gy-50,sol);});

S('Dominoes toppling',['Chain Reaction','Double Six Falls','Click, Click, Click','The Long Line','Halfway Gone'],function(R){
  var s=[],sol=[],ty=RR(R,156,162),n=RI(R,10,12),x0=RR(R,20,30),gap=(270-x0)/n,fallN=RI(R,3,5),dh=RR(R,44,50),dw=RR(R,18,20),dp=6;
  var dom=[];for(var i=0;i<n;i++){var x=x0+i*gap,ang=i<fallN?-(1.4-i*0.28):0;ang=Math.max(-1.45,Math.min(0,ang));if(i===fallN)ang=-0.16;dom.push([x,ang]);}
  dom.slice().reverse().forEach(function(d,ii){var x=d[0],ang=d[1],piv=[x+dw,ty];function T(P){return rotateAbout(P,piv[0],piv[1],ang);}
    var face=T([[x,ty],[x,ty-dh],[x+dw,ty-dh],[x+dw,ty]]);var side=T([[x+dw,ty],[x+dw,ty-dh],[x+dw+dp,ty-dh-dp*0.5],[x+dw+dp,ty-dp*0.5]]);var top=T([[x,ty-dh],[x+dp,ty-dh-dp*0.5],[x+dw+dp,ty-dh-dp*0.5],[x+dw,ty-dh]]);
    FS(s,sol,face);FS(s,sol,side,1.2,90);FS(s,sol,top);s.push(T([[x+2,ty-dh/2],[x+dw-2,ty-dh/2]]));
    var pips=[RI(R,0,6),RI(R,0,6)];pips.forEach(function(pv,h){var cy=ty-dh*0.25-h*dh*0.5,ccx=x+dw/2,pts={0:[],1:[[0,0]],2:[[-1,-1],[1,1]],3:[[-1,-1],[0,0],[1,1]],4:[[-1,-1],[1,-1],[-1,1],[1,1]],5:[[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],6:[[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]]}[pv];
      pts.forEach(function(p){var c=T([[ccx+p[0]*5,cy+p[1]*6.5]])[0];s.push(circle(c[0],c[1],1.3));});});});
  var hand=RR(R,0,1)<0.5;var lx=x0+n*gap+4;if(lx<286){s.push(curve([[lx,ty],[lx+6,ty-10],[lx+2,ty-16]],4));}
  var bx=RR(R,20,60),box=[[bx,ty+18],[bx,ty+8],[bx+60,ty+8],[bx+60,ty+18]];
  onTable(s,R,ty,sol);return s;});

S("Doll's pram",['Afternoon Promenade','Hood Up, Doll Asleep','Lace and Spokes','Nursery Parade','Wicker Carriage'],function(R){
  var s=[],sol=[],fy=RR(R,170,176),cx=RR(R,130,160),f=R()<0.5?1:-1,wr=RR(R,20,23);function X(P){return P.map(function(p){return [cx+p[0]*f,p[1]];});}
  var body=blob(X([[-56,fy-80],[-58,fy-56],[-40,fy-40],[30,fy-40],[50,fy-56],[52,fy-80]]),5);FS(s,sol,body);var bw=[];bw.push(zz(cx-60,cx+56,fy-82,fy-40,4));clipIn(s,bw,body,[]);s.push(curve(X([[-56,fy-70],[0,fy-64],[52,fy-70]]),6));
  var hood=X([[-56,fy-80]]).concat(X(arc(-28,fy-80,30,40,PI,PI*1.62).map(function(p){return [p[0]-0,p[1]];})).map(function(p){return p;})).concat(X([[0,fy-80]]));var hd=[X([[-58,fy-80]])[0]].concat(X(arc(-28,fy-80,30,42,PI,1.55*PI)).slice(1)).concat(X([[2,fy-80]]));FS(s,sol,hd);
  var hr=[];for(var k=1;k<4;k++){var a=PI+k*0.55*PI/4;hr.push(X([[-28,fy-80],[-28+30*Math.cos(a),fy-80+42*Math.sin(a)]]));}A(s,hr);H(s,hd,RR(R,2.2,2.6),f>0?60:-60);
  var lace=[];for(var l=0;l<9;l++){var lx=-54+l*6;A(lace,X(arc(lx+3,fy-80,3,3,PI,0)));}s.push(lace);
  var dh=X([[10,fy-86]])[0];var head=circle(dh[0],dh[1],8);FS(s,sol,head.slice(0,-1));s.push(arc(dh[0],dh[1],8,8,PI*1.1,PI*1.9));s.push(circle(dh[0]-2,dh[1]+1,0.8),circle(dh[0]+3,dh[1]+1,0.8));var bl=X([[0,fy-80],[2,fy-86],[24,fy-86],[30,fy-80]]);FS(s,sol,bl,1.6,40);
  var hdl=X([[46,fy-62],[64,fy-104],[70,fy-104]]);s.push(hdl);s.push(hdl.map(function(p){return [p[0]+2,p[1]];}));var gp=X([[64,fy-104],[76,fy-104]]);s.push(gp);s.push(RP(Math.min(gp[0][0],gp[1][0]),fy-102,Math.max(gp[0][0],gp[1][0]),fy-106));
  var sp=X([[-40,fy-40],[-30,fy-wr],[30,fy-wr],[36,fy-40]]);s.push(sp);
  [-34,32].forEach(function(wx){var c=X([[wx,0]])[0][0];wheel(s,c,fy-wr,wr,10,1.4);sol.push(EP(c,fy-wr,wr,wr));});
  var bx=cx-90*f;if(bx>20&&bx<280){var ball=circle(bx,fy-14,14);FS(s,sol,ball.slice(0,-1));s.push(arc(bx,fy-14,14,6,0,PI));s.push(arc(bx,fy-14,6,14,-PI/2,PI/2));var bh=[];H(bh,[[bx,fy-28],[bx+14,fy-14],[bx,fy]],1.6,30);A(s,bh);}
  room(s,R,fy,sol);return s;});

S('Chaise longue',['Fainting Couch','Buttoned Velvet','Afternoon Recline','By the Tall Window','Scroll Arm'],function(R){
  var s=[],sol=[],fy=RR(R,170,176),x0=RR(R,40,60),x1=RR(R,236,256),sy=fy-RR(R,30,34),f=R()<0.5?1:-1;
  var wx=RR(R,110,170),W=RP(wx-34,fy-140,wx+34,fy-46);var wf=[[wx-34,fy-46],[wx-34,fy-140]].concat(arc(wx,fy-140,34,22,PI,TAU).slice(1)).concat([[wx+34,fy-46]]);s.push(poly(wf));sol.push(wf);
  s.push([[wx,fy-46],[wx,fy-162]]);for(var r=1;r<4;r++)s.push([[wx-34,fy-46-r*24],[wx+34,fy-46-r*24]]);var gl=[];H(gl,wf,RR(R,4,5),45);A(s,gl);
  var cr=[[wx-40,fy-170],[wx-40,fy-42]];s.push(cr);s.push([[wx+40,fy-170],[wx+40,fy-42]]);s.push([[wx-52,fy-172],[wx+52,fy-172]]);var cur=blob([[wx-48,fy-170],[wx-40,fy-170],[wx-36,fy-60],[wx-46,fy-46],[wx-54,fy-60]],4);FS(s,sol,cur,2,80);
  var X=function(P){return P.map(function(p){return [f>0?p[0]:x0+x1-p[0],p[1]];});};
  var back=blob(X([[x0,sy],[x0-6,sy-40],[x0+6,sy-62],[x0+24,sy-58],[x0+40,sy-30],[x0+80,sy-24],[x1-20,sy-16],[x1,sy-4],[x1,sy]]),5);FS(s,sol,back);
  var seat=X([[x0-4,sy],[x1+4,sy],[x1+4,sy+12],[x0-4,sy+12]]);FS(s,sol,seat);s.push(zz(Math.min(seat[0][0],seat[1][0]),Math.max(seat[0][0],seat[1][0]),sy+2,sy+10,3));
  var btn=[];for(var b=0;b<4;b++)for(var c=0;c<2;c++){var p=X([[x0+6+b*12+c*6,sy-48+b*8+c*10]])[0];btn.push(circle(p[0],p[1],1.3));}A(s,btn);var dm=[];H(dm,blob(X([[x0+2,sy-4],[x0,sy-40],[x0+10,sy-56],[x0+24,sy-52],[x0+36,sy-30],[x0+40,sy-4]]),4),RR(R,4,5),40);H(dm,blob(X([[x0+2,sy-4],[x0,sy-40],[x0+10,sy-56],[x0+24,sy-52],[x0+36,sy-30],[x0+40,sy-4]]),4),RR(R,4,5),-40);A(s,dm);
  s.push(spiral(X([[x0-2,sy-50]])[0][0],sy-50,1,7,1.5,0));
  [x0+4,x0+(x1-x0)/2,x1-4].forEach(function(lx){var L=X([[lx-3,sy+12],[lx-2,fy-4],[lx-4,fy],[lx+4,fy],[lx+2,fy-4],[lx+3,sy+12]]);FS(s,sol,L,1,90);});
  var pil=blob(X([[x1-40,sy-2],[x1-38,sy-14],[x1-10,sy-16],[x1-6,sy-4]]),4);FS(s,sol,pil,1.8,30);
  var rg=EP((x0+x1)/2,fy+10,(x1-x0)/2+20,8);s.push(poly(rg));sol.push(rg);
  room(s,R,fy,sol);return s;});

S('Wooden cradle',['Rock-a-Bye','Spindles and Rockers','Hush Now','Patchwork Quilt','Heirloom Oak'],function(R){
  var s=[],sol=[],fy=RR(R,170,176),cx=RR(R,130,170),w=RR(R,74,82),h=RR(R,40,46),bt=fy-RR(R,20,24),tp=bt-h,tilt=RR(R,-0.06,0.06);
  function T(P){return rotateAbout(P,cx,fy,tilt);}
  var rock=T(curve([[cx-w-14,bt-2],[cx-w*0.5,fy+2],[cx+w*0.5,fy+2],[cx+w+14,bt-2]],8));s.push(rock);s.push(T(curve([[cx-w-14,bt+2],[cx-w*0.5,fy-2],[cx+w*0.5,fy-2],[cx+w+14,bt+2]],8)));
  s.push(T([[cx-w+6,bt],[cx-w+6,fy-4]]));s.push(T([[cx+w-6,bt],[cx+w-6,fy-4]]));
  var hb=T([[cx-w,bt],[cx-w,tp-30]].concat(arc(cx-w+12,tp-30,12,14,PI,TAU).slice(1)).concat([[cx-w+24,tp-30],[cx-w+24,bt]]));FS(s,sol,hb);var hh=[];H(hh,hb,RR(R,2.2,2.6),60);A(s,hh);
  var fb=T([[cx+w-18,bt],[cx+w-18,tp-8],[cx+w,tp-12],[cx+w,bt]]);FS(s,sol,fb);var fh=[];H(fh,fb,RR(R,2.2,2.6),60);A(s,fh);
  var rail=T(RP(cx-w+24,tp,cx+w-18,tp+5));FS(s,sol,rail);var bot=T(RP(cx-w+24,bt-6,cx+w-18,bt));FS(s,sol,bot,1.4,0);
  var sp=[];for(var x=cx-w+30;x<cx+w-22;x+=RR(R,8,10))sp.push(T(turned(x,tp+5,bt-6,1.6)));
  var qt=T([[cx-w+24,tp+10],[cx-w+40,tp-6],[cx+w-30,tp-8],[cx+w-18,tp+12],[cx+w-22,bt-10],[cx-w+28,bt-10]]);var qP=blob(qt,4);FS(s,sol,qP);
  var qz=[];H(qz,qP,RR(R,9,11),0);H(qz,qP,RR(R,9,11),90);A(s,qz);var qh=[];H(qh,qP,3,45);clipIn(s,qh,qP,[]);
  behind(s,sp,[qP]);
  var pl=T(blob([[cx-w+26,tp+2],[cx-w+28,tp-10],[cx-w+50,tp-12],[cx-w+52,tp]],4));FS(s,sol,pl);
  var mob=RR(R,0,1);var ty2=cx+w+RR(R,18,30);if(ty2<270){var bear=circle(ty2+12,fy-14,12);FS(s,sol,bear.slice(0,-1));var bh=circle(ty2+12,fy-34,9);FS(s,sol,bh.slice(0,-1));s.push(circle(ty2+5,fy-41,3.4),circle(ty2+19,fy-41,3.4));s.push(circle(ty2+12,fy-31,1.6));s.push(circle(ty2+9,fy-36,0.7),circle(ty2+15,fy-36,0.7));}
  room(s,R,fy,sol);return s;});

S('Bookcase',['Five Shelves Full','Reading Later','Spines in a Row','Leaning Stack','The Library Wall'],function(R){
  var s=[],sol=[],fy=RR(R,182,188),x0=RR(R,40,56),x1=RR(R,244,260),top=RR(R,8,14),ns=4,sh=(fy-top-14)/ns;
  var cs=RP(x0,fy,x1,top);FS(s,sol,cs);s.push(rect(x0+6,fy-6,x1-6,top+8));var cr=RP(x0-6,top,x1+6,top-4);FS(s,sol,cr,1,0);
  for(var i=0;i<ns;i++){var sy=top+8+(i+1)*sh,x=x0+8;s.push([[x0+6,sy],[x1-6,sy]]);s.push([[x0+6,sy-2],[x1-6,sy-2]]);
    var hole=RR(R,0,1)<0.4?RR(R,x0+40,x1-60):-1;
    var sk=[[x,sy-2]],bks=[];
    while(x<x1-14){var bw=RR(R,4,9),bh=sh-RR(R,4,12),kind=R();
      if(hole>0&&x>hole&&x<hole+30){sk.push([x+36,sy-2]);if(R()<0.5){var lean=bh*0.7,bk=[[x+2,sy-2],[x+2+bw,sy-2],[x+2+bw+lean*0.6,sy-2-bh*0.8],[x+2+lean*0.6,sy-2-bh*0.8]];FS(s,sol,bk,1.8,60);}else{var st=RI(R,3,4);for(var q=0;q<st;q++){var sb=RP(x+2+RR(R,-2,2),sy-2-q*5,x+30+RR(R,-2,2),sy-7-q*5);FS(s,sol,sb);}}x+=36;hole=-1;continue;}
      if(x+bw>x1-8)break;sk.push([x,sy-2-bh],[x+bw,sy-2-bh],[x+bw,sy-2]);bks.push(RP(x,sy-2,x+bw,sy-2-bh));if(kind<0.18)H(s,RP(x,sy-2,x+bw,sy-2-bh),1.4,90);else if(kind<0.4){s.push([[x,sy-2-bh*0.2],[x+bw,sy-2-bh*0.2]]);}x+=bw;}
    s.push(sk);bks.forEach(function(b){sol.push(b);});}
  var side=[[x1,fy],[x1+10,fy-6],[x1+10,top-8],[x1+6,top-4],[x1+6,top],[x1,top]];FS(s,sol,side,1.6,90);
  var pl=RR(R,0,1);var px=x0-RR(R,22,30);if(px>10){var pot=[[px-10,fy],[px-12,fy-16],[px+12,fy-16],[px+10,fy]];FS(s,sol,pot,1.6,80);for(var l=0;l<5;l++){var a=-PI/2+(l-2)*0.45;s.push(quad([px,fy-16],[px+20*Math.cos(a),fy-16+30*Math.sin(a)],[px+30*Math.cos(a),fy-6+30*Math.sin(a)]));}}
  var sx=x1+RR(R,18,24);if(sx<282){var sl=RP(sx-8,fy,sx+8,fy-50);s.push(sl.slice(0,2).concat([[sx+8,fy-50]]));s.push([[sx-8,fy],[sx-8,fy-50],[sx+8,fy-50],[sx+8,fy]]);for(var r2=1;r2<5;r2++)s.push([[sx-8,fy-r2*10],[sx+8,fy-r2*10]]);sol.push(sl);}
  room(s,R,fy,sol);return s;});

// ---- Daily Super Sketch: a natural scene with no buildings (underwater reef, no sky) ----
function fishS(s,sol,x,y,sz,d,kind,R){function X(P){return M(P,x,y,sz,d);}
  var body,tail;
  if(kind==='angel'){body=blob(X([[-8,0],[0,-10],[10,-6],[14,0],[10,6],[0,10]]),4);tail=X([[-8,0],[-14,-6],[-13,6]]);var fu=X([[2,-9],[-6,-17],[-8,-6]]),fd=X([[2,9],[-6,17],[-8,6]]);FS(s,sol,fu);FS(s,sol,fd);}
  else if(kind==='clown'){body=blob(X([[-9,0],[-4,-5],[6,-5],[11,0],[6,4.5],[-4,4.5]]),4);tail=X([[-9,0],[-14,-4],[-14,4]]);}
  else{body=blob(X([[-8,0],[-2,-4],[6,-3.5],[10,0],[6,3.5],[-2,4]]),4);tail=X([[-8,0],[-13,-4],[-12,0],[-13,4]]);}
  FS(s,sol,tail);FS(s,sol,body);s.push(circle(x+(kind==='angel'?8:6)*sz*d,y-1.5*sz,0.9*sz>1.6?1.6:0.9*sz));
  if(kind==='clown'){s.push(X([[-3,-5],[-1.5,0],[-3,4.5],[-1,4.5],[0.5,0],[-1,-5],[4,-5],[5.5,0],[4,4.5]]));}
  else if(kind==='angel'){s.push(X([[-3,-8],[-1,0],[-3,8],[3,7],[5,0],[3,-7]]));}
  else s.push(X([[-6,0.5],[8,0.5]]));}
function branchC(s,sol,x,y,ang,len,w,dep,R){var ex=x+len*Math.cos(ang),ey=y+len*Math.sin(ang),mid=[x+len*0.5*Math.cos(ang)+RR(R,-3,3),y+len*0.5*Math.sin(ang)];
  var c=curve([[x,y],mid,[ex,ey]],5),nx=-Math.sin(ang)*w*0.5,ny=Math.cos(ang)*w*0.5;s.push(c.map(function(p){return [p[0]+nx,p[1]+ny];}));s.push(c.map(function(p){return [p[0]-nx,p[1]-ny];}));
  sol.push(tube(c,function(){return w*0.5+0.5;}).P);
  if(dep>0){branchC(s,sol,ex,ey,ang-RR(R,0.3,0.55),len*RR(R,0.7,0.82),w*0.8,dep-1,R);branchC(s,sol,ex,ey,ang+RR(R,0.3,0.55),len*RR(R,0.7,0.82),w*0.8,dep-1,R);}
  else s.push(circle(ex,ey,w*0.6));}
var MASTER={name:'Coral reef',titles:['Reef at Ten Metres','Garden Without Sky','Staghorn and Brain','Where the Clownfish Live','Blue Hour Below'],build:function(R){
  var s=[],sol=[],bd=RR(R,168,174),fl=R()<0.5?1:-1;function FX(x){return fl>0?x:300-x;}
  // brain coral, left
  var bx=FX(RR(R,50,58)),brx=RR(R,46,52),bry=RR(R,30,34),brain=[[bx-brx,bd+2]].concat(arc(bx,bd+2,brx,bry,PI,TAU).slice(1));FS(s,sol,brain);
  var mz=[],d=1;for(var y=bd+2-bry+4;y<bd;y+=4.2){var w=wave(bx-brx,bx+brx,y,1.8,RR(R,7,11),R()*6);if(d<0)w.reverse();A(mz,w);d=-d;}clipIn(s,[mz],brain,[]);H(s,[[bx+brx*0.3,bd+2]].concat(arc(bx,bd+2,brx,bry,-PI*0.38,0)),RR(R,2.2,2.6),-60);
  // anemone with clownfish next to it
  var ax=FX(RR(R,140,152)),an=[[ax-20,bd+2],[ax-16,bd-10],[ax+16,bd-10],[ax+20,bd+2]];FS(s,sol,an,1.6,80);
  var tn=[[ax-18,bd-10]];for(var k=0;k<14;k++){var tx=ax-18+k*2.7,h=RR(R,18,28),lean=RR(R,-6,6);tn.push([tx+lean*0.5,bd-10-h*0.6],[tx+lean,bd-10-h],[tx+1.4,bd-10]);}s.push(tn);sol.push([[ax-22,bd-10],[ax-24,bd-40],[ax+24,bd-40],[ax+22,bd-10]]);
  fishS(s,sol,ax-8*fl,bd-48,1.6,fl,'clown',R);fishS(s,sol,ax+16*fl,bd-40,1.4,-fl,'clown',R);
  // staghorn coral, centre-right
  var sx=FX(RR(R,196,206));for(var b=0;b<3;b++){branchC(s,sol,sx+(b-1)*8,bd+2,-PI/2+(b-1)*0.5,RR(R,30,34),5,2,R);}
  // tube sponges
  var tx0=FX(RR(R,236,244));for(var t=0;t<3;t++){var cx=tx0+(t-1)*13*fl,h2=RR(R,34,62)-t*6,rx=5.5;var T=[[cx-rx,bd+2],[cx-rx-1,bd-h2],[cx+rx+1,bd-h2],[cx+rx,bd+2]];FS(s,sol,T);s.push(EP(cx,bd-h2,rx+1,2.2).concat([[cx+rx+1,bd-h2]]));H(s,[[cx+1,bd+2],[cx+rx,bd+2],[cx+rx+1,bd-h2+2],[cx+1,bd-h2+2]],1.3,90);var pr=[];for(var q=0;q<4;q++)pr.push(circle(cx-2,bd-h2*0.2-q*h2*0.2,0.9));A(s,pr);}
  // table coral on a stalk, high on the right
  var tcx=FX(RR(R,262,270)),tcy=RR(R,96,106),tw=RR(R,34,40);var stk=[[tcx-4,bd-40],[tcx-3,tcy+4],[tcx+3,tcy+4],[tcx+4,bd-40]];var rk=blob([[tcx-30,bd+2],[tcx-24,bd-30],[tcx-6,bd-44],[tcx+14,bd-40],[tcx+34,bd-20],[tcx+38,bd+2]],5);
  var plate=[[tcx-tw,tcy]].concat(arc(tcx,tcy,tw,6,PI,TAU).slice(1)).concat([[tcx+tw,tcy+2]]).concat(arc(tcx,tcy+2,tw,7,0,PI).slice(1));FS(s,sol,plate);var pz=[];for(var r=0;r<9;r++){var aa=PI+r*PI/8;pz.push([[tcx,tcy+1],[tcx+tw*Math.cos(aa),tcy+6*Math.sin(aa)]]);}A(s,pz);H(s,arc(tcx,tcy+2,tw,7,0,PI).concat([[tcx-tw,tcy+2]]),1.2,0);
  FS(s,sol,stk,1.2,90);
  // fish around the coral
  fishS(s,sol,FX(RR(R,226,236)),RR(R,58,66),2,-fl,'angel',R);fishS(s,sol,FX(RR(R,60,72)),RR(R,64,72),1.8,fl,'angel',R);
  var schx=FX(RR(R,150,166)),schy=RR(R,34,44);for(var f=0;f<RI(R,3,4);f++){fishS(s,sol,schx+RR(R,-34,34),schy+RR(R,-12,12),RR(R,1.4,1.7),fl,'small',R);}
  // sea fan behind everything
  var fx=FX(RR(R,96,108)),fr=RR(R,70,78),fan=[[fx-4,bd]].concat(arc(fx,bd-24,fr,fr*0.95,PI*1.12,PI*1.88)).concat([[fx+4,bd]]);var fn=[];fn.push(poly(fan));
  var fz=[],dd=1;for(var i=0;i<=16;i++){var a=PI*1.12+(PI*0.76)*i/16;var e=[fx+fr*Math.cos(a),bd-24+fr*0.95*Math.sin(a)];if(dd>0)fz.push([fx,bd-6],e);else fz.push(e,[fx,bd-6]);dd=-dd;}fn.push(fz);
  for(var j=1;j<9;j++){var rr=fr*j/9;fn.push(arc(fx,bd-24,rr,rr*0.95,PI*1.12,PI*1.88));}behind(s,fn,sol);sol.push(fan);
  // rock under the table coral, starfish and shells on the sand
  behind(s,[rk.concat([rk[0]])],sol);var rh=[];H(rh,rk,RR(R,2.6,3),RR(R,30,50));behind(s,rh,sol);sol.push(rk);
  var stx=FX(RR(R,110,120));var st=[];for(var k2=0;k2<10;k2++){var a2=-PI/2+k2*PI/5,rr2=k2%2?4:11;st.push([stx+rr2*Math.cos(a2),bd+12+rr2*0.5*Math.sin(a2)]);}FS(s,sol,st,1.2,30);
  // seabed and open water
  var bed=[[4,bd+2],[296,bd+2]];s.push(bed);var sn=[],d3=1;for(var yy=bd+7;yy<196;yy+=RR(R,4,4.6)){var ww=wave(4,296,yy,1.2,RR(R,16,26),R()*6);if(d3<0)ww.reverse();A(sn,ww);d3=-d3;}behind(s,[sn],sol);
  var kelp=[];for(var kk=0;kk<3;kk++){var kx=FX([20,282,40][kk]+RR(R,-6,6)),hh=RR(R,90,140),pts=[];for(var t2=0;t2<=8;t2++)pts.push([kx+6*Math.sin(t2*0.9+kk),bd+2-hh*t2/8]);var c=curve(pts,6);kelp.push(c);for(var t3=2;t3<8;t3+=2){var p=c[t3*6];kelp.push(quad(p,[p[0]+10*(t3%4?1:-1),p[1]-6],[p[0]+14*(t3%4?1:-1),p[1]-2]));}}behind(s,kelp,sol);
  var wt=[],d4=1;for(var y2=RR(R,104,110);y2>5;y2-=RR(R,5.2,5.8)){var w2=wave(4,296,y2,1.4,RR(R,30,50),R()*6);if(d4<0)w2.reverse();A(wt,w2);d4=-d4;}behind(s,[wt],sol);
  return s;}};

return {number:7,startedOn:"2026-11-17",notes:"Batch 7 (Nov 17). Review of Nov 15-16 plays: Clockmaker's workshop held its 20 minutes well - dense but legible, every clock reads. Strong: gothic cathedral, covered market hall, lightship, Joshua tree, stork on a chimney, village church, pueblo, brick factory. Weak: crocodile and hammerhead muddled (hatching fights the silhouette), horseshoe crab read as an umbrella, trombone and garden tools thin, sea urchins sparse. Lessons kept: one line, keep extras touching; clip backgrounds with behind()/clipIn(); fill the frame with the subject; animals need a careful side-view silhouette with one shaded side, kept light; one-stroke zigzags and one-stroke skylines (book spines) keep the planner fast; fish and other solids drawn over earlier parts must be placed in open space. New this batch: room() and onTable() settings, round barn, canal gables, truss bridge, moose, swallows on a wire, bookcase. Daily Super Sketch: Coral reef, a natural scene with no buildings and no sky (type 4); previous two were Honeycomb frame with bees (close-up, type 2) and Clockmaker's workshop (interior, type 1).",master:(typeof MASTER!=="undefined"?MASTER:undefined),subjects:SUBJ};
})();
