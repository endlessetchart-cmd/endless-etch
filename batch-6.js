// Endless Etch — batch 6. 48 subjects for 2026-11-16 (each plays about three times, shuffled per round) plus the Daily Super Sketch.
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

// ---- chunk A: buildings, places, landscapes, plants ----
S('Mayan step pyramid',['Nine Terraces','Stair to the Sun','Jungle Clearing','Limestone and Vines','Equinox Steps'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,166,172),cx=RR(R,135,165),n=RI(R,6,7),bw=RR(R,204,222),tw=RR(R,60,70),th=RR(R,14,16),sw0=28,sw1=18;
  for(var i=0;i<n;i++){var w0=bw-(bw-tw)*i/n,w1=bw-(bw-tw)*(i+1)/n,y0=gy-i*th,y1=y0-th;
    var P=[[cx-w0/2,y0],[cx-w1/2-4,y1+2],[cx-w1/2-4,y1],[cx+w1/2+4,y1],[cx+w1/2+4,y1+2],[cx+w0/2,y0]];SOL(s,sol,P);
    H(s,[[cx+sw0/2,y0],[cx+w0/2,y0],[cx+w1/2+4,y1+2],[cx+sw0/2,y1+2]],RR(R,2.2,2.8),0);
    s.push([[cx-w0/2+3,y0-th*0.5],[cx-sw0/2,y0-th*0.5]]);}
  var top=gy-n*th,St=[[cx-sw0/2,gy],[cx-sw1/2,top],[cx+sw1/2,top],[cx+sw0/2,gy]];SOL(s,sol,St);H(s,St,2.6,0);
  s.push([[cx-sw0/2-3,gy],[cx-sw1/2-3,top]],[[cx+sw0/2+3,gy],[cx+sw1/2+3,top]]);
  var T=RP(cx-tw/2+8,top,cx+tw/2-8,top-24);SOL(s,sol,T);var D=RP(cx-6,top,cx+6,top-15);s.push(poly(D));H(s,D,1.4,90);
  for(var d=-1;d<=1;d+=2){var dd=RP(cx+d*16-3,top,cx+d*16+3,top-12);s.push(poly(dd));H(s,dd,1.4,90);}
  var crest=RP(cx-tw/2+14,top-24,cx+tw/2-14,top-36);SOL(s,sol,crest);H(s,crest,3,90);s.push(merlons(cx-tw/2+6,cx+tw/2-6,top-24,3,6));
  for(var k=0;k<RI(R,3,4);k++){treeR(s,R,RR(R,10,cx-bw/2-6),gy,RR(R,12,18),2.3);}
  for(var k2=0;k2<RI(R,3,4);k2++){treeR(s,R,RR(R,cx+bw/2+6,290),gy,RR(R,12,18),2.3);}
  hills(bg,R,gy-6,RR(R,26,36),RR(R,4.4,5.4),[],RR(R,10,20));gnd(bg,R,gy);
  return fin(s,R,bg,sol,gy-10);});

S('Martello tower',['Round Fort, Calm Sea','Guns Long Gone','Granite Drum','Watch Over the Bay','Ladder to the Door'],function(R){
  var s=[],sol=[],bg=[],sy=RR(R,150,156),cx=RR(R,120,180),rb=RR(R,42,48),rt=rb-6,tb=sy+RR(R,4,8),h=RR(R,74,84),tt=tb-h;
  var T=[[cx-rb,tb]].concat([[cx-rt,tt]]).concat(arc(cx,tt,rt,rt*0.22,PI,0)).concat([[cx+rb,tb]]).concat(arc(cx,tb,rb,rb*0.22,0,PI).slice(1));
  SOL(s,sol,T);s.push(ellipse(cx,tt,rt,rt*0.22));
  for(var j=1;j<7;j++){var yy=tb-h*j/7,rr=rb-(rb-rt)*j/7;s.push(arc(cx,yy,rr,rr*0.22,0,PI));}
  H(s,[[cx+rb*0.35,tb+rb*0.2],[cx+rb,tb],[cx+rt,tt],[cx+rt*0.35,tt+rt*0.2]],RR(R,1.8,2.3),90);
  var pr=[[cx-rt-2,tt],[cx-rt-2,tt-8],[cx+rt+2,tt-8],[cx+rt+2,tt]];SOL(s,sol,pr);s.push(merlons(cx-rt-2,cx+rt+2,tt-8,4,9));H(s,[[cx+rt*0.4,tt],[cx+rt+2,tt],[cx+rt+2,tt-8],[cx+rt*0.4,tt-8]],1.4,0);
  var dx=cx-RR(R,2,12),dy=tt+h*0.45,Dr=archP(dx,dy,5,8);s.push(poly(Dr));H(s,Dr,1.3,90);
  s.push([[dx-4,dy],[dx-8,tb+6]],[[dx+4,dy],[dx,tb+6]]);for(var r=1;r<8;r++){var t=r/8;s.push([[dx-4-4*t,dy+(tb+6-dy)*t],[dx+4-4*t,dy+(tb+6-dy)*t]]);}
  for(var w=0;w<3;w++){var wx=cx+RR(R,-rt*0.6,rt*0.6),wy=tt+RR(R,10,h*0.35);s.push(rect(wx-1.2,wy,wx+1.2,wy+7));}
  s.push([[cx,tt-8],[cx,tt-30]]);s.push([[cx,tt-30],[cx+16,tt-27],[cx,tt-23]]);H(s,[[cx,tt-30],[cx+16,tt-27],[cx,tt-23]],1.4,0);
  var hd=[[4,sy],[cx-rb-RR(R,24,40),sy],[cx-rb-8,tb-4],[cx+rb+8,tb-4],[cx+rb+RR(R,30,50),sy+12],[cx+rb+70,196],[4,196]];
  var rk=[];rocks(rk,sol,R,cx-rb-30,cx+rb+40,tb+10,RR(R,14,20),RI(R,4,6));A(s,rk);
  var land=[[cx-rb-40,196],[cx-rb-26,tb+8],[cx+rb+34,tb+8],[cx+rb+60,196]];SOL(s,sol,land);H(s,land,RR(R,3,3.6),RR(R,-30,-15));
  waterIn(bg,R,[[4,sy],[296,sy],[296,196],[4,196]],sy+4,194,RR(R,5,6));bg.push([[4,sy],[296,sy]]);
  return fin(s,R,bg,sol,sy-4);});

S('Ice fishing shacks',['Holes in the Lake','Minus Twelve','Smoke From Every Shack','Village on the Ice','Waiting for a Bite'],function(R){
  var s=[],sol=[],bg=[],hz=RR(R,104,112),n=RI(R,3,4),xs=[];
  for(var i=0;i<n;i++)xs.push(30+i*(240/(n-0.4))+RR(R,-8,8));
  xs.forEach(function(x,i){var near=i%2===0,sc=near?1:0.72,b=near?RR(R,160,172):RR(R,132,142),w=RR(R,34,42)*sc,h=RR(R,30,36)*sc,d=12*sc;
    var F=RP(x,b,x+w,b-h);SOL(s,sol,F);var side=[[x+w,b],[x+w+d,b-d*0.5],[x+w+d,b-h-d*0.5],[x+w,b-h]];SOL(s,sol,side);H(s,side,1.6,90);
    var roof=[[x-3,b-h],[x+w/2,b-h-14*sc],[x+w+3,b-h],[x+w+d+3,b-h-d*0.5],[x+w/2+d,b-h-14*sc-d*0.5],[x+w/2,b-h-14*sc]];SOL(s,sol,roof);H(s,roof,RR(R,1.8,2.2),RR(R,20,40));
    clipIn(s,[zz(x,x+w,b-h,b,RR(R,3.2,4)*sc)],F,[]);
    var dr=RP(x+w*0.55,b,x+w*0.8,b-h*0.7);SOL(s,sol,dr);H(s,dr,1.2,90);s.push(rect(x+w*0.12,b-h*0.7,x+w*0.38,b-h*0.42));
    var px=x+w*0.2;s.push([[px,b-h-6*sc],[px,b-h-22*sc],[px+3,b-h-22*sc],[px+3,b-h-6*sc]]);
    s.push(curve([[px+1.5,b-h-22*sc],[px+6,b-h-30*sc],[px-2,b-h-38*sc],[px+8,b-h-46*sc]],6));
    if(near){var hx=x+w+d+RR(R,12,20),hy=b-3;s.push(ellipse(hx,hy,6,2));s.push([[hx-4,hy-14],[hx,hy],[hx+4,hy-14]]);s.push([[hx,hy],[hx,hy-14],[hx+10,hy-18]]);}
  });
  var tl=[];for(var x=4;x<=296;x+=RR(R,6,10)){var hh=RR(R,8,16);tl.push([x,hz],[x+3,hz-hh],[x+6,hz]);}s.push(tl);
  s.push([[4,hz],[296,hz]]);
  var pr=[],d=1;for(var y=hz+6;y<196;y+=RR(R,6,10)*(1+(y-hz)/80)){var a=RR(R,4,60),bb=RR(R,240,296);if(d>0)pr.push([a,y],[bb,y]);else pr.push([bb,y],[a,y]);d=-d;}behind(s,[pr],sol);
  for(var c=0;c<RI(R,2,3);c++){var cx0=RR(R,20,280),cy0=RR(R,hz+20,190),cr=[[cx0,cy0]];for(var t=0;t<5;t++)cr.push([cr[t][0]+RR(R,6,14),cr[t][1]+RR(R,-4,4)]);behind(s,[cr],sol);}
  return fin(s,R,bg,sol,hz-14);});

S('Farm gate in a hedgerow',['Five Bars and a Latch','Through to the Barley','Lane End','Hawthorn Gap','Gate Left Open'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,162,168),gx=RR(R,100,130),gw=RR(R,72,82),gh=RR(R,34,40);
  var p1=RP(gx-6,gy+2,gx,gy-gh-14),p2=RP(gx+gw,gy+2,gx+gw+6,gy-gh-14);SOL(s,sol,p1);SOL(s,sol,p2);H(s,p1,1.3,90);H(s,p2,1.3,90);
  var bars=5;for(var b=0;b<bars;b++){var y=gy-4-b*(gh-4)/(bars-1);var B=RP(gx,y,gx+gw,y-2.4);s.push(poly(B));}
  s.push([[gx+3,gy-4],[gx+gw-3,gy-gh]]);s.push([[gx+6,gy-4],[gx+gw-1,gy-gh+3]]);s.push([[gx+gw*0.5,gy-4],[gx+gw*0.5,gy-gh]]);
  s.push(circle(gx+gw-3,gy-gh/2,1.6));
  function hedge(x0,x1,h,ang){var P=[[x0,gy]],x=x0;while(x<x1-4){var w=Math.min(x1-x,RR(R,9,14));A(P,arc(x+w/2,gy-h+RR(R,-3,3),w/2,RR(R,4,7),PI,TAU));x+=w;}P.push([x1,gy]);SOL(s,sol,P);H(s,P,RR(R,1.9,2.3),ang);return P;}
  hedge(4,gx-8,RR(R,40,48),RR(R,40,60));hedge(gx+gw+8,296,RR(R,40,48),RR(R,-60,-40));sol.push(RP(gx,gy,gx+gw,gy-gh-2));
  
  var lane=[[gx-14,196],[gx+8,gy],[gx+gw-8,gy],[gx+gw+20,196]];s.push([[gx-14,196],[gx+8,gy]],[[gx+gw-8,gy],[gx+gw+20,196]]);
  var ln=[],d=1;for(var y=gy+5;y<196;y+=4+(y-gy)*0.12){var a=gx+8-(y-gy)/(196-gy)*22+2,bb=gx+gw-8+(y-gy)/(196-gy)*28-2;if(d>0)ln.push([a,y],[bb,y]);else ln.push([bb,y],[a,y]);d=-d;}s.push(ln);
  var fy=gy-RR(R,54,62);bg.push([[4,fy],[296,fy]]);var ft=[];furrows(ft,R,fy,RI(R,16,22),RR(R,120,180));clipIn(bg,ft,RP(4,fy,296,gy),[]);
  hills(bg,R,fy-2,RR(R,16,24),RR(R,4.2,5),[],RR(R,8,16));
  H(bg,[[4,gy],[gx+8,gy],[gx-14,196],[4,196]],RR(R,3.4,4),25);H(bg,[[gx+gw-8,gy],[296,gy],[296,196],[gx+gw+20,196]],RR(R,3.4,4),-25);treeR(bg,R,RR(R,40,80),fy+2,RR(R,10,13),2.4);
  return fin(s,R,bg,sol,fy-8);});

S('Island chapel in a lake',['Bell Across the Water','Ferry on Sundays','Still Lake, White Walls','Pilgrims by Boat','Chapel of the Rocks'],function(R){
  var s=[],sol=[],bg=[],wl=RR(R,128,136),cx=RR(R,120,180),iw=RR(R,70,86);
  var I=blob([[cx-iw,wl],[cx-iw*0.6,wl-10],[cx-iw*0.1,wl-14],[cx+iw*0.5,wl-12],[cx+iw,wl]],6);I=[[cx-iw,wl]].concat(I.filter(function(p){return p[1]<=wl;})).concat([[cx+iw,wl]]);SOL(s,sol,I);H(s,I,RR(R,2,2.6),RR(R,20,40));
  var by=wl-12,nw=RR(R,40,48),nh=RR(R,22,26),nx=cx-nw/2+RR(R,-10,10);var N=RP(nx,by,nx+nw,by-nh);SOL(s,sol,N);
  var rf=[[nx-3,by-nh],[nx+nw/2,by-nh-RR(R,16,20)],[nx+nw+3,by-nh]];SOL(s,sol,rf);H(s,rf,RR(R,1.8,2.2),RR(R,50,70));
  var tx=nx+nw-2,tw=14,th=nh+RR(R,20,26);var T=RP(tx,by,tx+tw,by-th);SOL(s,sol,T);H(s,RP(tx+tw-4,by,tx+tw,by-th),1.2,0);var bl=archP(tx+tw/2,by-th+12,3.5,6);s.push(poly(bl));H(s,bl,1,0);
  var sp=[[tx-2,by-th],[tx+tw/2,by-th-20],[tx+tw+2,by-th]];SOL(s,sol,sp);H(s,sp,1.5,70);s.push([[tx+tw/2,by-th-20],[tx+tw/2,by-th-28]],[[tx+tw/2-3,by-th-25],[tx+tw/2+3,by-th-25]]);
  var dr=archP(nx+12,by,4,8);s.push(poly(dr));H(s,dr,1.2,90);for(var w=0;w<2;w++){var G=gothic(nx+24+w*9,by-8,2.4,6);s.push(poly(G));}
  cypress(s,sol,cx-iw*0.55,wl-8,RR(R,40,50),RR(R,6,8),1.8,70);treeR(s,R,cx+iw*0.65,wl-4,RR(R,9,12),2);
  s.push([[cx-iw*0.8,wl],[cx-iw*0.8-20,wl+2]]);for(var p=0;p<4;p++)s.push([[cx-iw*0.8-p*6,wl],[cx-iw*0.8-p*6,wl+5]]);
  var mt=peaks(bg,R,wl,RR(R,60,78),RI(R,3,4),RR(R,2.2,2.8));
  var water=[[4,wl],[296,wl],[296,196],[4,196]];var refl=[];for(var y=wl+4;y<196;y+=RR(R,4,5.5)){var L=RR(R,30,70),x0=cx-L/2+RR(R,-10,10);refl.push([[x0,y],[x0+L,y]]);}
  waterIn(s,R,water,wl+4,194,RR(R,4.6,5.6));
  s.push([[4,wl],[296,wl]]);
  behind(s,bg,sol);return sky(s,R,wl-30,sol);});

S('Garden shed with tools',['Potting Bench','Rake, Spade, Twine','Behind the Beans','Saturday Shed','Seed Packets and Rust'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,164,170),sx=RR(R,96,124),sw=RR(R,84,94),sh=RR(R,56,62),rh=RR(R,24,30);
  var W=RP(sx,gy,sx+sw,gy-sh);SOL(s,sol,W);var dr=RP(sx+10,gy,sx+36,gy-sh+8);SOL(s,sol,dr);s.push([[sx+10,gy-sh+8],[sx+36,gy-4]]);s.push(circle(sx+32,gy-sh/2+2,1.4));
  var wn=RP(sx+sw-36,gy-sh+12,sx+sw-12,gy-sh+30);SOL(s,sol,wn);s.push([[sx+sw-24,gy-sh+12],[sx+sw-24,gy-sh+30]],[[sx+sw-36,gy-sh+21],[sx+sw-12,gy-sh+21]]);H(s,RP(sx+sw-36,gy-sh+12,sx+sw-24,gy-sh+21),1.3,45);
  s.push([[sx+sw-38,gy-sh+31],[sx+sw-10,gy-sh+31]]);
  clipIn(s,[zz(sx,sx+sw,gy-sh,gy,RR(R,3.6,4.4))],W,[dr,wn]);clipIn(s,[zz(sx+10,sx+36,gy-sh+8,gy,RR(R,4.5,5.5))],dr,[]);
  var rf=[[sx-6,gy-sh],[sx+sw/2,gy-sh-rh],[sx+sw+6,gy-sh]];SOL(s,sol,rf);clipIn(s,[scallopRows(sx-10,sx+sw+10,gy-sh-rh+4,gy-sh,5,4)],rf,[]);
  var lx=sx+sw+RR(R,6,12);s.push([[lx,gy],[lx+16,gy-60]]);s.push([[lx+12,gy-60],[lx+22,gy-60]]);s.push(comb(lx+11,lx+23,gy-60,-6,2.4));
  var sp=sx-RR(R,10,16);s.push([[sp,gy-6],[sp+10,gy-56]]);var bl=[[sp-5,gy],[sp-4,gy-10],[sp+4,gy-12],[sp+5,gy-2]];SOL(s,sol,bl);H(s,bl,1.2,80);s.push([[sp+7,gy-56],[sp+14,gy-56]]);
  for(var p=0;p<RI(R,2,3);p++){var px=sx+sw+RR(R,30,60)+p*20;if(px>282)break;var pot=[[px-7,gy],[px-9,gy-12],[px+9,gy-12],[px+7,gy]];SOL(s,sol,pot);H(s,pot,1.6,0);s.push(curve([[px,gy-12],[px-3,gy-22],[px-8,gy-26]],5));s.push(curve([[px,gy-12],[px+2,gy-24],[px+7,gy-30]],5));s.push(lens([px,gy-20],[px-9,gy-28],3));}
  var bx0=8,bx1=sx-24;if(bx1>bx0+30){for(var bb=0;bb<3;bb++){var bx=bx0+10+bb*(bx1-bx0-20)/2;s.push([[bx,gy],[bx,gy-RR(R,60,76)]]);for(var l=0;l<5;l++){var ly=gy-12-l*11;s.push(lens([bx,ly],[bx+(l%2?7:-7),ly-6],2.6));}}}
  bg.push(comb(4,296,gy-24,24,6));bg.push([[4,gy-34],[296,gy-34]]);bg.push([[4,gy-18],[296,gy-18]]);
  gnd(bg,R,gy);return fin(s,R,bg,sol,gy-30);});

S('Small-town fire station',['Engine No. 2','Bay Doors Open','Hose Tower','Volunteers Wanted','Polished Brass Bell'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,170,176),bx=RR(R,70,90),bw=RR(R,140,152),bh=RR(R,84,94);
  var B=RP(bx,gy,bx+bw,gy-bh);SOL(s,sol,B);var cor=RP(bx-3,gy-bh,bx+bw+3,gy-bh-8);SOL(s,sol,cor);H(s,cor,1.6,0);
  var holes=[];var bays=[bx+14,bx+bw/2+6];bays.forEach(function(x){var w=bw/2-20,D=RP(x,gy,x+w,gy-36);SOL(s,sol,D);holes.push(D);
    for(var r=1;r<6;r++)s.push([[x,gy-r*7],[x+w,gy-r*7]]);s.push([[x+w/2,gy],[x+w/2,gy-36]]);H(s,RP(x+2,gy-36,x+w-2,gy-29),1.4,90);});
  for(var w2=0;w2<4;w2++){var wx=bx+12+w2*(bw-24)/4+6,wy=gy-bh+12,W=archP(wx+6,wy+22,6,16);s.push(poly(W));holes.push(W);s.push([[wx+6,wy],[wx+6,wy+22]]);H(s,RP(wx,wy+11,wx+12,wy+22),1.6,45);}
  var sign=RP(bx+bw/2-30,gy-bh+42,bx+bw/2+30,gy-bh+50);SOL(s,sol,sign);holes.push(sign);for(var c=0;c<8;c++)s.push(rect(bx+bw/2-26+c*6.8,gy-bh+44,bx+bw/2-22+c*6.8,gy-bh+48));
  clipIn(s,[brickS(bx,gy-bh,bx+bw,gy,RR(R,9,11),RR(R,5,6))],B,holes);
  var tx=bx+bw,tw=RR(R,22,26),th=bh+RR(R,30,40);var T=RP(tx,gy,tx+tw,gy-th);SOL(s,sol,T);H(s,RP(tx+tw-8,gy,tx+tw,gy-th),1.4,0);
  for(var l=0;l<3;l++){var ly=gy-th+14+l*26;s.push(rect(tx+6,ly,tx+tw-6,ly+12));}
  var cap=[[tx-3,gy-th],[tx+tw/2,gy-th-14],[tx+tw+3,gy-th]];SOL(s,sol,cap);H(s,cap,1.4,60);
  var bl=[[tx+tw/2,gy-th-14],[tx+tw/2,gy-th-20]];s.push(bl);s.push(arc(tx+tw/2,gy-th-14,5,6,PI,TAU));
  var fp=bx-RR(R,20,30);s.push([[fp,gy],[fp,gy-bh-40]]);var fl=[[fp,gy-bh-40],[fp+26,gy-bh-38],[fp+26,gy-bh-24],[fp,gy-bh-26]];SOL(s,sol,fl);H(s,[[fp,gy-bh-40],[fp+26,gy-bh-38],[fp+26,gy-bh-31],[fp,gy-bh-33]],1.6,0);
  var hy=bx+bw+tw+RR(R,10,20);if(hy<280){s.push([[hy,gy],[hy,gy-14],[hy+6,gy-14],[hy+6,gy]]);s.push(ellipse(hy+3,gy-16,5,3));H(s,RP(hy,gy-14,hy+6,gy),1.2,90);}
  bg.push([[4,gy],[296,gy]]);var sw=[],d=1;for(var y=gy+5;y<196;y+=5){if(d>0)sw.push([4,y],[296,y]);else sw.push([296,y],[4,y]);d=-d;}bg.push(sw);
  for(var x=8;x<296;x+=RR(R,26,34))bg.push([[x,gy],[x,gy+5]]);
  return fin(s,R,bg,sol,gy-6);});

S('Old cinema marquee',['Tonight Only','Two Shows Nightly','Ticket Booth','The Matinee Crowd','Bulbs Around the Sign'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,172,178),fx=RR(R,56,76),fw=RR(R,168,184),fh=RR(R,128,138),cx=fx+fw/2;
  var F=RP(fx,gy,fx+fw,gy-fh);SOL(s,sol,F);var holes=[];
  var my=gy-RR(R,52,58),mh=26,M0=[[fx-8,my],[fx+fw+8,my],[fx+fw+16,my-mh],[fx-16,my-mh]];SOL(s,sol,M0);holes.push(M0);
  s.push(scallop(cx,my-mh/2,fw/2+14,mh/2+2,60,0.0));
  for(var r=0;r<2;r++){var ry=my-mh+5+r*9;var p=[];for(var x=fx+4;x<fx+fw-4;x+=RR(R,7,11)){var w=RR(R,4,7);p.push([x,ry+1],[x,ry+6],[x+w,ry+6],[x+w,ry+1],[x,ry+1]);}s.push(p);}
  H(s,RP(fx-8,my,fx+fw+8,my+5),1.2,0);s.push(rect(fx-8,my,fx+fw+8,my+5));
  var bl=RP(cx-9,my-mh-4,cx+9,gy-fh-22);SOL(s,sol,bl);holes.push(bl);for(var k=0;k<7;k++){var by=gy-fh-14+k*((my-mh-4)-(gy-fh-14))/7;s.push(rect(cx-5,by,cx+5,by+((my-mh-4)-(gy-fh-14))/7-3));}
  s.push(scallop(cx,(my-mh-4+gy-fh-22)/2,11,(my-mh-4-(gy-fh-22))/2+2,40,0));
  var tb=RP(cx-14,gy,cx+14,gy-34);SOL(s,sol,tb);holes.push(tb);s.push(archP(cx,gy-14,9,6));H(s,RP(cx-14,gy-6,cx+14,gy),1.4,0);
  [fx+10,fx+fw-56].forEach(function(dx){var D=RP(dx,gy,dx+46,gy-36);SOL(s,sol,D);holes.push(D);for(var q=1;q<4;q++)s.push([[dx+q*11.5,gy],[dx+q*11.5,gy-36]]);H(s,RP(dx,gy-36,dx+46,gy-30),1.4,0);});
  for(var p2=0;p2<2;p2++){var px=p2?fx+fw-38:fx+12,P=RP(px,my-mh-14,px+26,my-mh-50);SOL(s,sol,P);holes.push(P);H(s,P,RR(R,2,2.6),RR(R,30,60)*(p2?1:-1));}
  clipIn(s,[zz(fx,fx+fw,gy-fh,gy,RR(R,5,6))],F,holes);
  s.push(merlons(fx-2,fx+fw+2,gy-fh,4,10));
  [fx-RR(R,40,60),fx+fw+RR(R,10,24)].forEach(function(bx){var b2=RP(Math.max(4,bx),gy,Math.min(296,bx+46),gy-fh+RR(R,10,30));bg.push(poly(b2));HX(bg,[b2],RR(R,3.4,4),90);});
  bg.push([[4,gy],[296,gy]]);var sw=[],d=1;for(var y=gy+5;y<196;y+=5){if(d>0)sw.push([4,y],[296,y]);else sw.push([296,y],[4,y]);d=-d;}bg.push(sw);
  return fin(s,R,bg,sol,gy-fh+10);});

S('Standing stones on a moor',['Nine Stones Dancing','Older Than the Road','Heather and Granite','Circle at Dusk','The Moor Remembers'],function(R){
  var s=[],sol=[],bg=[],cy=RR(R,150,156),cx=RR(R,140,160),rx=RR(R,108,118),ry=RR(R,20,26),n=RI(R,8,10),items=[];
  for(var i=0;i<n;i++){var a=i/n*TAU+R()*0.3,x=cx+rx*Math.cos(a),y=cy+ry*Math.sin(a),sc=0.75+0.35*(y-(cy-ry))/(2*ry);items.push([y,x,sc]);}
  items.sort(function(a,b){return b[0]-a[0];});
  var lint=RI(R,0,n-1);
  items.forEach(function(it,j){var y=it[0],x=it[1],sc=it[2],w=RR(R,9,14)*sc,h=RR(R,36,54)*sc;
    var P=blob([[x-w,y],[x-w*1.1,y-h*0.5],[x-w*0.7,y-h],[x+w*0.4,y-h*1.04],[x+w,y-h*0.6],[x+w*0.9,y]],5);SOL(s,sol,P);
    H(s,[[x+w*0.1,y],[x+w*0.9,y],[x+w,y-h*0.6],[x+w*0.4,y-h*1.0],[x+w*0.1,y-h]],RR(R,1.4,1.9),RR(R,70,100));
    s.push([[x-w*0.6,y-h*0.3],[x-w*0.2,y-h*0.38]]);s.push(tufts(x-w-6,x+w+6,y,5*sc,R));
    if(j===lint&&h>40){var L=RP(x-w-4,y-h-2,x+w+20,y-h-10);}});
  var hs=[];var hy=cy-ry-RR(R,24,34);var Hl=hills(bg,R,hy,RR(R,14,22),RR(R,4,5),[],RR(R,6,14));
  var moor=[],d=1;for(var y=hy+6;y<196;y+=RR(R,4.5,6)){var w=wave(4,296,y,0.8,RR(R,20,40),R()*6);if(d<0)w.reverse();A(moor,w);d=-d;}bg.push(moor);
  for(var t=0;t<RI(R,5,8);t++){var tx=RR(R,10,290),ty=RR(R,hy+10,194);bg.push(tufts(tx-8,tx+8,ty,RR(R,4,7),R));}
  behind(s,bg,sol);return sky(s,R,hy-10,sol);});

S('Hedge maze',['Lost by the Fountain','Yew Corridors','The Long Way Round','Dead End, Again','Garden Puzzle'],function(R){
  var s=[],cols=RI(R,11,12),nr=8,cw=Math.min(22,280/cols),ch=Math.min(22,184/nr),ox=150-cols*cw/2,oy=100-nr*ch/2;
  var vis=new Uint8Array(cols*nr),right=[],down=[];for(var i=0;i<cols*nr;i++){right[i]=1;down[i]=1;}
  var st=[[Math.floor(cols/2),Math.floor(nr/2)]];vis[st[0][1]*cols+st[0][0]]=1;
  while(st.length){var c=st[st.length-1],nb=[];[[1,0],[-1,0],[0,1],[0,-1]].forEach(function(d){var x=c[0]+d[0],y=c[1]+d[1];if(x>=0&&y>=0&&x<cols&&y<nr&&!vis[y*cols+x])nb.push([x,y,d]);});
    if(!nb.length){st.pop();continue;}var n=nb[Math.floor(R()*nb.length)],d=n[2];
    if(d[0]===1)right[c[1]*cols+c[0]]=0;else if(d[0]===-1)right[n[1]*cols+n[0]]=0;else if(d[1]===1)down[c[1]*cols+c[0]]=0;else down[n[1]*cols+n[0]]=0;
    vis[n[1]*cols+n[0]]=1;st.push([n[0],n[1]]);}
  var hw=2.6,segs=[];
  for(var y=0;y<=nr;y++){var run=null;for(var x=0;x<cols;x++){var wall=y===0||y===nr?!((y===nr&&x===Math.floor(cols/2))||(y===0&&x===Math.floor(cols/2))):down[(y-1)*cols+x];
    if(wall){if(!run)run=[x,x+1];else run[1]=x+1;}else if(run){segs.push([ox+run[0]*cw,oy+y*ch,ox+run[1]*cw,oy+y*ch]);run=null;}}if(run)segs.push([ox+run[0]*cw,oy+y*ch,ox+run[1]*cw,oy+y*ch]);}
  for(var x2=0;x2<=cols;x2++){var run2=null;for(var y2=0;y2<nr;y2++){var wall2=x2===0||x2===cols?true:right[y2*cols+x2-1];
    if(wall2){if(!run2)run2=[y2,y2+1];else run2[1]=y2+1;}else if(run2){segs.push([ox+x2*cw,oy+run2[0]*ch,ox+x2*cw,oy+run2[1]*ch]);run2=null;}}if(run2)segs.push([ox+x2*cw,oy+run2[0]*ch,ox+x2*cw,oy+run2[1]*ch]);}
  var ang=RR(R,35,55);
  segs.forEach(function(g){if(g[1]===g[3])s.push(zz(g[0]-hw,g[2]+hw,g[1]-hw,g[1]+hw,1.7));else s.push(rows(g[0]-hw,g[0]+hw,g[1]-hw,g[3]+hw,1.7));});
  var mx=ox+(Math.floor(cols/2)+0.5)*cw,my=oy+(Math.floor(nr/2)+0.5)*ch;s.push(spiral(mx,my,1,ch*0.36,3));
  var pth=[],d2=1;for(var yy=oy+ch*0.5;yy<oy+nr*ch;yy+=ch){if(d2>0)pth.push([ox+cw*0.3,yy],[ox+cols*cw-cw*0.3,yy]);else pth.push([ox+cols*cw-cw*0.3,yy],[ox+cw*0.3,yy]);d2=-d2;}
  var border=RP(ox-10,oy-10,ox+cols*cw+10,oy+nr*ch+10);s.push(poly(border));
  var outer=RP(4,4,296,196);clipIn(s,[rows(4,296,6,194,RR(R,5.5,7))],outer,[border]);
  return s;});

S('Snowy pine forest',['First Snow in the Spruce','Hush Under the Boughs','Tracks Between Trees','Blue Hour, Deep Woods','Winter Stand'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,168,174),trees=[];
  for(var i=0;i<RI(R,7,9);i++){var dep=R(),x=24+i*30+RR(R,-8,8),b=gy-22+dep*26,sz=0.95+dep*1.25;trees.push([b,x,sz]);}
  trees.sort(function(a,b){return a[0]-b[0];});
  var snowLine=[];
  trees.reverse().forEach(function(t){var x=t[1],b=t[0],sz=t[2],tiers=4,P=[[x-2*sz,b],[x-2*sz,b-6*sz]],tierPolys=[];
    for(var k=0;k<tiers;k++){var by=b-6*sz-k*11*sz,w=(18-k*4)*sz,top=by-18*sz;tierPolys.push([[x-w,by],[x,top],[x+w,by]]);}
    var out=[[x-2*sz,b]];for(var k2=0;k2<tiers;k2++){var tp=tierPolys[k2];out.push([x-2*sz,tp[0][1]],tp[0]);}
    var top=tierPolys[tiers-1][1];out=[[x-2*sz,b],[x-2*sz,b-6*sz]];var L=[],Rr=[];for(var k3=0;k3<tiers;k3++){var tp2=tierPolys[k3];L.push(tp2[0],[x-(tp2[2][0]-x)*0.45,tp2[0][1]-8*sz]);Rr.unshift([x+(tp2[2][0]-x)*0.45,tp2[0][1]-8*sz],tp2[2]);}
    var sil=[[x-2*sz,b],[x-2*sz,b-6*sz]].concat(L.slice(0,-1)).concat([top]).concat(Rr.slice(1)).concat([[x+2*sz,b-6*sz],[x+2*sz,b]]);
    var keep=sol.slice();SOL(s,sol,sil);
    for(var k4=0;k4<tiers;k4++){var tp3=tierPolys[k4],yb=tp3[0][1],ht=yb-tp3[1][1];var sh=[[tp3[0][0]+2,yb],[tp3[2][0]-2,yb],[x+(tp3[2][0]-x)*0.5,yb-ht*0.45],[x-(x-tp3[0][0])*0.5,yb-ht*0.45]];
      var tmp=[];H(tmp,sh,Math.max(1.5,1.3*sz),0);behind(s,tmp,keep);
      var sn=[[tp3[0][0],yb],[tp3[0][0]+3,yb-2],[x-(x-tp3[0][0])*0.5,yb-ht*0.45],[x-(x-tp3[0][0])*0.45,yb-ht*0.55]];var tmp2=[sn];behind(s,tmp2,keep);}
  });
  var snow=[],d=1;for(var y=gy+6;y<196;y+=RR(R,6,9)){var a=RR(R,4,80),bb=RR(R,220,296);if(d>0)snow.push([a,y],[bb,y]);else snow.push([bb,y],[a,y]);d=-d;}bg.push(snow);bg.push([[4,gy],[296,gy]]);
  var tr=[];for(var q=0;q<10;q++){var tx=RR(R,120,180)+q*RR(R,-3,3),ty=196-q*2.6;tr.push([[tx-2,ty],[tx-1,ty-1]]);}A(bg,tr);
  return fin(s,R,bg,sol,gy-10);});

S('Fjord',['Walls of the Fjord','Meltwater Falling','Green Water, Grey Stone','Cruise Through the Gap','Seven Sisters Falling'],function(R){
  var s=[],sol=[],bg=[],wl=RR(R,138,146),vx=RR(R,130,170);
  var L=[[4,wl],[4,RR(R,20,34)],[RR(R,40,60),RR(R,26,40)],[vx-RR(R,40,50),RR(R,60,76)],[vx-6,wl-RR(R,24,32)],[vx-4,wl]];SOL(s,sol,L);
  var Rt=[[296,wl],[296,RR(R,16,30)],[RR(R,240,262),RR(R,24,36)],[vx+RR(R,40,52),RR(R,58,72)],[vx+6,wl-RR(R,24,32)],[vx+4,wl]];SOL(s,sol,Rt);
  H(s,L,RR(R,2.6,3.2),RR(R,62,76));H(s,Rt,RR(R,1.8,2.2),RR(R,-80,-66));
  for(var k=0;k<5;k++){var t=RR(R,0.1,0.9),y=L[1][1]+(wl-L[1][1])*t;s.push(curve([[4,y],[40,y+RR(R,4,10)],[vx-30,y+RR(R,14,24)]],6));}
  var fxw=RR(R,vx+40,250);var fy0=interpY([[vx+6,Rt[4][1]],[Rt[3][0],Rt[3][1]],[Rt[2][0],Rt[2][1]]],fxw);var fall=[];for(var f=0;f<4;f++){var x=fxw-6+f*3;fall.push([x,Math.max(30,fy0-4)],[x+RR(R,-1,1),wl-2]);}
  var fd=[];for(var g=0;g<fall.length;g+=2){fd.push(fall[g],fall[g+1]);}s.push(fd);
  var snow=[[vx-30,RR(R,96,104)],[vx,RR(R,80,90)],[vx+30,RR(R,96,104)]];s.push(curve(snow,6));var mt=[[vx-36,112],[vx-14,RR(R,80,88)],[vx-6,RR(R,74,82)],[vx+8,RR(R,78,86)],[vx+36,112]];
  var hz=[[vx-40,wl],[vx-40,112]].concat(mt).concat([[vx+40,112],[vx+40,wl]]);bg.push(mt);H(bg,[[vx-36,112],[vx-6,mt[2][1]],[vx+36,112]],3,0);
  var bx=vx+RR(R,-20,10),by=wl+RR(R,16,28),boat=[[bx-14,by-4],[bx+14,by-4],[bx+10,by],[bx-11,by]];SOL(s,sol,boat);H(s,boat,1.2,0);s.push([[bx,by-4],[bx,by-24]]);var sail=[[bx,by-24],[bx+11,by-6],[bx,by-6]];SOL(s,sol,sail);
  s.push([[bx-14,by-2],[bx-40,by+2]]);s.push([[bx-12,by],[bx-34,by+6]]);
  var water=[[4,wl],[296,wl],[296,196],[4,196]];waterIn(s,R,water,wl+4,194,RR(R,5,6),[boat]);s.push([[4,wl],[296,wl]]);
  behind(s,bg,sol);return sky(s,R,wl-20,sol);});

S('Cattail marsh',['Redwing on a Reed','Brown Velvet Heads','Where the Creek Slows','Late Summer Marsh','Reed Song'],function(R){
  var s=[],sol=[],bg=[],wl=RR(R,150,158),n=RI(R,7,9);
  for(var i=0;i<n;i++){var x=RR(R,14,286),b=wl+RR(R,0,24),h=RR(R,70,120),lean=RR(R,-14,14),tip=[x+lean,b-h];
    var stem=curve([[x,b],[x+lean*0.3,b-h*0.5],tip],8);s.push(stem);
    var hy=b-h+RR(R,10,14),hx=x+lean*0.95,head=lens([hx,hy-14],[hx-lean*0.06,hy+8],3.2);SOL(s,sol,head);H(s,head,1.1,90);
    var lf=RI(R,1,2);for(var l=0;l<lf;l++){var sg=l?1:-1,lh=RR(R,50,90);s.push(curve([[x,b],[x+sg*6,b-lh*0.5],[x+sg*RR(R,14,24),b-lh]],8));}}
  var pl=RI(R,0,n-1),bx=RR(R,60,240),by=RR(R,60,80);var stem2=curve([[bx-6,wl+10],[bx-2,by+30],[bx,by]],8);s.push(stem2);perched(s,bx,by,5,sgn(R));H(s,[[bx-3,by-6],[bx+1,by-6],[bx+1,by-3],[bx-3,by-3]],0.8,0);
  var tl=[[4,wl-30]];for(var x=4;x<=296;x+=RR(R,8,14))tl.push([x,wl-30-RR(R,6,18)]);tl.push([296,wl-30]);var TL=blob(tl.slice(1,-1),4);TL=[[4,wl-26]].concat(TL).concat([[296,wl-26]]);bg.push(TL);HX(bg,[TL.concat([[296,wl],[4,wl]])],RR(R,2.6,3.2),RR(R,30,60));
  var water=[[4,wl],[296,wl],[296,196],[4,196]];var wtmp=[];waterIn(wtmp,R,water,wl+4,194,RR(R,4.6,5.6));A(bg,wtmp);bg.push([[4,wl],[296,wl]]);
  behind(s,bg,sol);return sky(s,R,wl-40,sol);});

S('Banyan tree',['A Forest of One','Roots Coming Down','Shade for the Village','Old Fig','Hanging Pillars'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,170,176),cx=RR(R,130,170),cw=RR(R,128,140),cy=RR(R,58,66);
  var cp=[];for(var a=0;a<=TAU+0.01;a+=TAU/18){var r=1+0.12*Math.sin(a*5+R());cp.push([cx+cw*r*Math.cos(a),cy+RR(R,32,40)*r*Math.sin(a)]);}cp.pop();
  var C=blob(cp,5);SOL(s,sol,C);H(s,C,RR(R,2.2,2.7),RR(R,25,45));
  var tr=[[cx-14,gy],[cx-10,cy+30],[cx-24,cy+16],[cx-18,cy+14],[cx-4,cy+26],[cx+4,cy+26],[cx+18,cy+14],[cx+24,cy+16],[cx+10,cy+30],[cx+14,gy]];SOL(s,sol,tr);
  for(var k=0;k<4;k++)s.push(curve([[cx-10+k*6,gy],[cx-8+k*5,gy-30],[cx-6+k*4,cy+34]],6));
  for(var r2=0;r2<RI(R,9,12);r2++){var rx=cx+RR(R,-cw*0.9,cw*0.9),ry=cy+RR(R,22,32);if(Math.abs(rx-cx)<20)continue;var thick=R()<0.35;
    if(thick){var P=[[rx-2.5,gy],[rx-1.5,ry],[rx+1.5,ry],[rx+2.5,gy]];SOL(s,sol,P);}else s.push(curve([[rx,ry],[rx+RR(R,-2,2),(ry+gy)/2],[rx+RR(R,-3,3),gy-RR(R,0,24)]],6));}
  var bn=RP(cx+30,gy-8,cx+64,gy-11);s.push(poly(bn));s.push([[cx+33,gy-8],[cx+33,gy]],[[cx+61,gy-8],[cx+61,gy]]);
  gnd(bg,R,gy);hills(bg,R,gy-4,RR(R,10,16),RR(R,4.2,5),[],RR(R,8,14));
  return fin(s,R,bg,sol,gy-8);});

S('Magnolia branch',['Saucer Magnolia','March in the Courtyard','Tulips on a Tree','Pink Before the Leaves','Velvet Buds'],function(R){
  var s=[],sol=[],bg=[],x0=RR(R,6,20),y0=RR(R,170,186),x1=RR(R,276,290),y1=RR(R,70,84);
  var br=curve([[x0,y0],[x0+60,y0-RR(R,20,40)],[150,128+RR(R,-8,8)],[x1-60,y1+RR(R,20,40)],[x1,y1]],10);
  var off=br.map(function(p,i){var q=br[Math.min(br.length-1,i+1)],o=br[Math.max(0,i-1)],dx=q[0]-o[0],dy=q[1]-o[1],L=Math.hypot(dx,dy)||1,w=4.5*(1-i/br.length)+1.2;return [[p[0]-dy/L*w,p[1]+dx/L*w],[p[0]+dy/L*w,p[1]-dx/L*w]];});
  var Bp=off.map(function(o){return o[0];}).concat(off.map(function(o){return o[1];}).reverse());SOL(s,sol,Bp);H(s,off.map(function(o){return o[0];}).concat(br.slice().reverse()),1.3,RR(R,30,60));
  var tw=[];for(var t=0;t<RI(R,2,3);t++){var i0=Math.floor(br.length*RR(R,0.25,0.7)),p=br[i0],dir=sgn(R),e=[p[0]+RR(R,20,34),p[1]+dir*RR(R,24,36)];tw.push([p,e]);s.push(curve([p,[(p[0]+e[0])/2,(p[1]+e[1])/2+dir*4],e],6));}
  var spots=[br[Math.floor(br.length*0.98)]].concat(tw.map(function(t){return t[1];}));for(var f=0;f<RI(R,2,3);f++)spots.push(br[Math.floor(br.length*RR(R,0.3,0.85))]);
  spots.forEach(function(p,j){var sz=j===0?RR(R,1.9,2.2):RR(R,1.4,1.75),cx=p[0],cy=p[1]-6*sz,open=R()<0.6;
    s.push(rect(cx-2*sz,cy+2*sz,cx+2*sz,cy+8*sz));
    var petals=open?[[-0.9,1.0],[-0.35,1.15],[0.35,1.15],[0.9,1.0]]:[[-0.3,1.0],[0.3,1.0],[0,1.1]];
    petals.forEach(function(pt,k){var a=-PI/2+pt[0],L=16*sz*pt[1],tip=[cx+L*Math.cos(a),cy+L*Math.sin(a)],P=lens([cx,cy+2],tip,(open?13:9)*sz);SOL(s,sol,P);
      var sh=lens([cx,cy+2],[cx+L*0.55*Math.cos(a),cy+L*0.55*Math.sin(a)],(open?9:6)*sz);if(k%2===0)H(s,sh,1.9,RR(R,60,120));s.push([[cx,cy],[cx+L*0.8*Math.cos(a),cy+L*0.8*Math.sin(a)]]);});});
  for(var b=0;b<RI(R,2,3);b++){var bp=br[Math.floor(br.length*RR(R,0.15,0.6))],bud=lens(bp,[bp[0]+RR(R,4,10),bp[1]-RR(R,12,16)],3.2);SOL(s,sol,bud);H(s,bud,0.9,90);}
  var W=RP(4,4,296,196);var g1=RR(R,7,9);var lat=[];HX(lat,[W],g1,45);HX(lat,[W],g1,-45);A(bg,lat);
  behind(s,bg,sol);return s;});

S('Cypress on a sea bluff',['Windswept and Holding','Leaning Into Weather','The Last Tree West','Fog Coming In','Salt-Shaped'],function(R){
  var s=[],sol=[],bg=[],sl=RR(R,124,132),bx=RR(R,180,220),cl=[[bx-130,196],[bx-110,sl+10],[bx-60,sl-6],[bx-10,sl-12],[bx+40,sl-6],[296,sl+RR(R,0,8)],[296,196]];
  var C=[[cl[0][0],196]].concat(curve(cl.slice(1,-1),6)).concat([[296,196]]);SOL(s,sol,C);
  for(var k=0;k<6;k++){var y=sl+6+k*11;var st=[];for(var x=cl[1][0]+k*4;x<296;x+=6)st.push([x,y+RR(R,-2,2)]);clipIn(s,[st],C,[]);}
  H(s,[[cl[0][0],196],[cl[1][0],sl+10],[cl[1][0]+30,sl+40],[cl[0][0]+40,196]],2,60);
  var tx=bx-RR(R,30,50),ty=interpY(C.slice(1,-1),tx),lean=-RR(R,50,70);
  var trunk=curve([[tx,ty],[tx-8,ty-20],[tx-24,ty-34],[tx+lean*0.7,ty-46]],8);var tr2=curve([[tx+6,ty],[tx+2,ty-18],[tx-16,ty-34],[tx+lean*0.65,ty-42]],8);s.push(trunk);s.push(tr2);
  s.push(curve([[tx-8,ty-22],[tx+10,ty-40],[tx+26,ty-46]],6));
  var pads=[[tx+lean*0.7-30,ty-58,46,10],[tx+lean*0.3,ty-50,40,9],[tx+18,ty-56,30,8],[tx+lean*0.5,ty-70,36,9]];
  pads.forEach(function(p){var P=blob([[p[0]-p[2],p[1]+2],[p[0]-p[2]*0.6,p[1]-p[3]],[p[0],p[1]-p[3]*1.2],[p[0]+p[2]*0.7,p[1]-p[3]*0.9],[p[0]+p[2]*1.05,p[1]+1],[p[0],p[1]+p[3]*0.4]],5);SOL(s,sol,P);H(s,P,RR(R,1.5,1.9),RR(R,-10,10));});
  s.push(tufts(bx-60,bx+60,sl-8,6,R));
  var sea=[[4,sl+10],[296,sl+10],[296,196],[4,196]];var wtmp=[];waterIn(wtmp,R,sea,sl+14,194,RR(R,4.8,5.8));A(bg,wtmp);bg.push([[4,sl+10],[bx-110,sl+10]]);
  rocks(s,sol,R,8,cl[0][0]+10,190,RR(R,14,20),RI(R,2,3));
  behind(s,bg,sol);return sky(s,R,sl,sol);});

// tube: polygon around a spine with half-width wf(t), t = 0..1 along the spine
function tube(sp,wf){var L=[],Rr=[],n=sp.length;for(var i=0;i<n;i++){var a=sp[Math.max(0,i-1)],b=sp[Math.min(n-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,w=wf(i/(n-1));
  L.push([sp[i][0]-dy/l*w,sp[i][1]+dx/l*w]);Rr.push([sp[i][0]+dy/l*w,sp[i][1]-dx/l*w]);}return {P:L.concat(Rr.reverse()),L:L,R:Rr};}
// spiky ball in one stroke: zigzag between radius r and r+sp
function spiky(cx,cy,r,sp,n,R){var p=[];for(var i=0;i<=n*2;i++){var a=i/(n*2)*TAU,rr=i%2?r+sp*(0.7+0.5*R()):r;p.push([cx+rr*Math.cos(a),cy+rr*Math.sin(a)]);}return p;}
function sand(s,R,y,g){var p=[],d=1;for(var yy=y;yy<196;yy+=g||RR(R,5,7)){var w=wave(4,296,yy,1.2,RR(R,16,28),R()*6);if(d<0)w.reverse();A(p,w);d=-d;}s.push(p);return s;}

// ---- chunk B: vehicles, animals, sea life ----
S('Rickshaw',['Waiting at the Corner','Two Wheels and a Hood','Station Rank','Folded Canopy','Fare Paid'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,170,176),wx=RR(R,110,140),wr=RR(R,30,34),wy=gy-wr;
  wheel(s,wx,wy,wr,RI(R,14,18),1.8);
  var by=wy-6,body=[[wx-34,by],[wx-30,by-34],[wx+22,by-34],[wx+30,by-10],[wx+44,by-6],[wx+44,by]];SOL(s,sol,body);H(s,[[wx-34,by],[wx-31,by-24],[wx+28,by-24],[wx+30,by-10],[wx+44,by-6],[wx+44,by]],2,RR(R,20,40));
  var seat=RP(wx-28,by-34,wx+18,by-42);SOL(s,sol,seat);H(s,seat,1.4,0);
  var hc=[wx-30,by-40],H0=blob([[wx-36,by-40],[wx-42,by-66],[wx-26,by-86],[wx+2,by-92],[wx+18,by-84],[wx+14,by-62],[wx+6,by-40]],6);SOL(s,sol,H0);
  for(var k=1;k<4;k++){var tp=H0[Math.floor(H0.length*(0.18+k*0.11))];s.push(quad([wx-28,by-40],[(wx-28+tp[0])/2-6,(by-40+tp[1])/2-4],tp,10));}
  H(s,[[wx-36,by-40],[wx-42,by-66],[wx-26,by-86],[wx-16,by-88],[wx-24,by-40]],1.7,RR(R,60,80));
  var fx=wx+44,sh0=[[fx,by-4],[fx+RR(R,80,96),gy-RR(R,8,14)]];s.push(sh0);s.push([[fx,by+1],[sh0[1][0]+3,sh0[1][1]+4]]);var sb=[[sh0[1][0]-30,interpY(sh0,sh0[1][0]-30)],[sh0[1][0]-30,interpY(sh0,sh0[1][0]-30)+6]];s.push(sb);
  s.push([[wx-10,by],[wx-6,gy-4],[wx+12,gy-4]]);s.push(rect(wx+30,by+2,wx+48,by+5));
  var row=[],xx=4;while(xx<290){var w=RR(R,40,60),h=RR(R,70,110),P=RP(xx,gy-24,xx+w,gy-24-h);bg.push(poly(P));bg.push(rect(xx+8,gy-24-h+12,xx+w-8,gy-24-h+30));HX(bg,[P],RR(R,4,5),90);xx+=w+RR(R,4,10);}
  bg.push([[4,gy-24],[296,gy-24]]);var road=[],d=1;for(var y=gy+4;y<196;y+=5){if(d>0)road.push([4,y],[296,y]);else road.push([296,y],[4,y]);d=-d;}bg.push(road);bg.push([[4,gy],[296,gy]]);
  return fin(s,R,bg,sol,gy-26);});

S('Bow-top caravan',['Painted Wagon, Resting','Smoke From the Stovepipe','Meadow Camp','Road Home Tomorrow','Canvas and Spokes'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,168,174),cx=RR(R,130,160),bw=RR(R,96,108),bb=gy-RR(R,34,38),bh=RR(R,52,58);
  var bed=RP(cx-bw/2,bb,cx+bw/2,bb-12);SOL(s,sol,bed);H(s,bed,1.5,0);
  var top=[[cx-bw/2+2,bb-12]].concat(arc(cx,bb-12,bw/2-2,bh,PI,TAU)).concat([[cx+bw/2-2,bb-12]]);SOL(s,sol,top);
  for(var r=1;r<7;r++){var a=PI+r*PI/7;s.push(quad([cx+(bw/2-2)*Math.cos(a)*0.98,bb-12+bh*Math.sin(a)*0.98],[cx+(bw/2-2)*Math.cos(a)*0.6,bb-12+bh*Math.sin(a)*0.5],[cx+(bw/2-2)*Math.cos(a)*0.4,bb-12],8));}
  var hs=[[cx+bw/2-2,bb-12]].concat(arc(cx,bb-12,bw/2-2,bh,-PI*0.5,0).reverse()).concat([[cx+bw*0.18,bb-12-bh]]);H(s,[[cx+bw*0.15,bb-12]].concat(arc(cx,bb-12,bw/2-2,bh,-PI*0.42,0)),2,RR(R,70,85));
  var door=[[cx-bw/2-2,bb-12],[cx-bw/2-2,bb-12-bh*0.62],[cx-bw/2+10,bb-12-bh*0.62],[cx-bw/2+10,bb-12]];s.push(door);
  var sp=cx+RR(R,-10,20);s.push([[sp,bb-12-bh+1],[sp,bb-12-bh-18],[sp+3,bb-12-bh-18],[sp+3,bb-12-bh+1]]);s.push(curve([[sp+1.5,bb-30-bh],[sp+8,bb-40-bh],[sp,bb-50-bh],[sp+10,bb-60-bh]],6));
  var w1=cx-bw/2+20,w2=cx+bw/2-16;wheel(s,w1,gy-17,17,12,1.5);wheel(s,w2,gy-24,24,14,1.6);
  for(var st=0;st<4;st++){var sy=bb+st*7,sx=cx-bw/2-6-st*4;s.push([[sx,sy],[sx-8,sy]]);}s.push([[cx-bw/2-6,bb],[cx-bw/2-22,gy]]);s.push([[cx-bw/2-2,bb],[cx-bw/2-18,gy]]);
  var shx=cx+bw/2+4;s.push([[shx,bb-6],[shx+RR(R,60,76),gy-2]]);s.push([[shx,bb-2],[shx+RR(R,60,76),gy]]);
  treeR(s,R,RR(R,20,50),gy-4,RR(R,15,20),2.2);
  hills(bg,R,gy-10,RR(R,20,30),RR(R,4.4,5.4),[],RR(R,8,16));gnd(bg,R,gy);bg.push(tufts(4,296,gy,6,R));
  return fin(s,R,bg,sol,gy-14);});

S('Catamaran',['Two Hulls, One Wind','Reaching Across the Bay','Trampoline Deck','Heeled and Flying','Afternoon Breeze'],function(R){
  var s=[],sol=[],bg=[],wl=RR(R,150,158),cx=RR(R,130,160),L=RR(R,120,136),mh=RR(R,110,122);
  var h1=[[cx-L/2,wl-8],[cx+L/2-6,wl-10],[cx+L/2+6,wl-16],[cx+L/2-4,wl-3],[cx-L/2+8,wl]];SOL(s,sol,h1);H(s,h1,1.5,0);
  var h2=[[cx-L/2+18,wl-16],[cx+L/2+8,wl-18],[cx+L/2+16,wl-22],[cx+L/2+6,wl-12],[cx-L/2+24,wl-10]];SOL(s,sol,h2);H(s,h2,1.8,0);
  s.push([[cx-L/2+30,wl-9],[cx-L/2+40,wl-17]],[[cx+20,wl-10],[cx+30,wl-18]]);var tr=[[cx-L/2+30,wl-9],[cx+20,wl-10],[cx+30,wl-18],[cx-L/2+40,wl-17]];A(s,hatch(tr,2,60));A(s,hatch(tr,2,-30));
  var mx=cx-4,mb=wl-12,mt=mb-mh;s.push([[mx,mb],[mx+6,mt]]);
  var main=[[mx+5,mt+4],[mx+1,mb-10],[mx-RR(R,62,72),mb-12]];var mainP=[[mx+5,mt+4]].concat(quad([mx+5,mt+4],[mx-40,mt+50],[main[2][0],main[2][1]],14)).concat([[mx+1,mb-10]]);SOL(s,sol,mainP);
  for(var b=1;b<6;b++){var t=b/6;s.push([[mx+5-4*t,mt+4+(mb-14-mt)*t],[mx+5-4*t-(mx+5-main[2][0])*t*0.9-6*t,mt+4+(mb-14-mt)*t+t*4]]);}
  H(s,[[mx+3,mt+40],[mx+1,mb-10],[mx-24,mb-11],[mx-14,mt+50]],1.8,80);
  var jib=[[mx+6,mt+18],[mx+50,wl-18],[mx+10,wl-16]];var jibP=[[mx+6,mt+18]].concat(quad([mx+6,mt+18],[mx+40,mt+60],[mx+50,wl-18],12)).concat([[mx+10,wl-16]]);SOL(s,sol,jibP);H(s,jibP,2.4,RR(R,-70,-50));
  s.push([[mx+6,mt],[mx+6,mt-8],[mx+16,mt-5],[mx+6,mt-3]]);
  for(var w=0;w<3;w++){var wy=wl+2+w*5;s.push(wave(cx-L/2-20-w*12,cx-L/2+10,wy,1.5,10));}
  var land=[[4,wl-22],[30,wl-34],[70,wl-30],[110,wl-22]];bg.push(curve(land,6).concat([[110,wl-22]]));H(bg,curve(land,6).concat([[110,wl-22]]),3,0);
  var sea=RP(4,wl-22,296,196);var wt=[];waterIn(wt,R,sea,wl-18,194,RR(R,4.6,5.6));A(bg,wt);bg.push([[4,wl-22],[296,wl-22]]);
  return fin(s,R,bg,sol,wl-26);});

S('Snowmobile',['Tracks to the Cabin','Below Zero, Full Throttle','Parked by the Pines','Fresh Powder','Two Skis and a Track'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,168,174),x0=RR(R,70,100),L=RR(R,140,152);
  var trk=[[x0+20,gy-2]].concat(arc(x0+20,gy-12,10,10,PI/2,PI*1.5)).concat([[x0+L*0.62,gy-22],[x0+L*0.62,gy-2]]);trk=[[x0+20,gy-2],[x0+L*0.62,gy-2]].concat(arc(x0+L*0.62,gy-12,10,10,PI/2,-PI/2).slice(1)).concat([[x0+20,gy-22]]).concat(arc(x0+20,gy-12,10,10,-PI/2,-PI*1.5).slice(1));
  SOL(s,sol,trk);s.push(zz(x0+18,x0+L*0.62+2,gy-4,gy,2.4));for(var r=0;r<4;r++)s.push(circle(x0+28+r*(L*0.62-28)/3.5,gy-12,4.5));
  var body=[[x0+4,gy-24],[x0+2,gy-36],[x0+30,gy-40],[x0+L*0.45,gy-44],[x0+L*0.65,gy-54],[x0+L*0.88,gy-46],[x0+L,gy-32],[x0+L*0.96,gy-24]];SOL(s,sol,body);
  H(s,[[x0+L*0.6,gy-24],[x0+L*0.62,gy-50],[x0+L*0.88,gy-46],[x0+L,gy-32],[x0+L*0.96,gy-24]],1.7,RR(R,60,80));
  var seat=[[x0+8,gy-38],[x0+10,gy-48],[x0+L*0.45,gy-50],[x0+L*0.47,gy-44]];SOL(s,sol,seat);H(s,seat,1.4,0);
  var ws=[[x0+L*0.64,gy-54],[x0+L*0.6,gy-74],[x0+L*0.72,gy-76],[x0+L*0.8,gy-50]];SOL(s,sol,ws);s.push([[x0+L*0.62,gy-58],[x0+L*0.7,gy-72]]);
  s.push([[x0+L*0.55,gy-52],[x0+L*0.5,gy-62],[x0+L*0.42,gy-62]]);s.push(rect(x0+L*0.9,gy-40,x0+L*0.98,gy-34));
  var sk=x0+L*0.84;s.push([[sk,gy-24],[sk,gy-6]]);s.push([[sk-30,gy-2],[sk+20,gy-2]].concat(arc(sk+20,gy-8,6,6,PI/2,-PI/2)).concat([[sk+18,gy-14]]));
  s.push([[x0-2,gy-28],[x0-14,gy-22],[x0-30,gy-20]]);
  for(var t=0;t<RI(R,3,4);t++){pineT(bg,RR(R,8,x0-20)+(t%2)*RR(R,170,230),gy-RR(R,20,30),RR(R,1.2,1.8),RR(R,2.2,2.8));}
  var tr1=[],tr2=[];for(var x=4;x<x0+18;x+=3){tr1.push([x,gy+RR(R,2,3)]);}s.push(zz(4,x0+18,gy+1,gy+5,2.2));
  bg.push([[4,gy-28],[296,gy-28]]);hills(bg,R,gy-28,RR(R,24,34),0,[],0);
  var sn=[],d=1;for(var y=gy+10;y<196;y+=RR(R,7,10)){var a=RR(R,40,120),b=RR(R,180,296);if(d>0)sn.push([a,y],[b,y]);else sn.push([b,y],[a,y]);d=-d;}bg.push(sn);
  return fin(s,R,bg,sol,gy-40);});

S('Cement mixer truck',['Drum Turning','Pour at Nine','Ready-Mix','Site Delivery','Chute Down'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,172,178),x0=RR(R,30,50),L=RR(R,216,230),fr=gy-26;
  var ch=RP(x0+20,fr,x0+L-10,fr-8);SOL(s,sol,ch);H(s,ch,1.6,0);
  var cx=x0+L-56,cab=[[cx,fr-8],[cx,fr-62],[cx+30,fr-62],[cx+46,fr-36],[cx+50,fr-34],[cx+50,fr-8]];SOL(s,sol,cab);
  var cw=[[cx+6,fr-38],[cx+6,fr-56],[cx+28,fr-56],[cx+40,fr-38]];s.push(poly(cw));H(s,[[cx+28,fr-56],[cx+40,fr-38],[cx+30,fr-38]],1.2,60);s.push(rect(cx+44,fr-24,cx+50,fr-14));H(s,[[cx,fr-8],[cx+50,fr-8],[cx+50,fr-20],[cx,fr-20]],1.8,0);
  var dc=[x0+L*0.4,fr-46],drum=rotateAbout([[dc[0]-74,dc[1]+6]].concat(arc(dc[0]-74,dc[1]+6,10,26,PI*0.5,PI*1.5).reverse()).concat([[dc[0]+20,dc[1]-38],[dc[0]+50,dc[1]-24],[dc[0]+58,dc[1]-8],[dc[0]+58,dc[1]+8],[dc[0]+50,dc[1]+22],[dc[0]+20,dc[1]+30]]),dc[0],dc[1],RR(R,-0.12,-0.06));
  SOL(s,sol,drum);var fins=[];for(var f=0;f<6;f++){var x=dc[0]-60+f*20;fins.push(quad([x,dc[1]-30],[x+14,dc[1]],[x+2,dc[1]+30],10));}clipIn(s,fins,drum,[]);
  H(s,rotateAbout([[dc[0]-70,dc[1]+14],[dc[0]+52,dc[1]+14],[dc[0]+50,dc[1]+24],[dc[0]+20,dc[1]+30],[dc[0]-70,dc[1]+30]],dc[0],dc[1],-0.09),1.7,0);
  s.push([[dc[0]-74,dc[1]-14],[dc[0]-90,dc[1]-4],[dc[0]-96,fr-6]]);s.push([[dc[0]-84,dc[1]-8],[dc[0]-108,fr+6]]);
  s.push([[dc[0]-30,fr-8],[dc[0]-26,dc[1]+26]],[[dc[0]+30,fr-8],[dc[0]+28,dc[1]+28]]);
  [x0+40,x0+68,cx+28].forEach(function(x){wheel(s,x,gy-15,15,0,1.6);});
  var fence=comb(4,296,gy-30,30,11);bg.push(fence);bg.push([[4,gy-24],[296,gy-24]]);bg.push([[4,gy-50],[296,gy-50]]);
  var cr=[[250,gy-50],[250,30],[256,30],[256,gy-50]];bg.push(cr);bg.push(zz(250,256,30,gy-50,4));bg.push([[150,30],[290,30],[290,36],[150,36]]);bg.push(zz(150,290,30,36,6));
  gnd(bg,R,gy);return fin(s,R,bg,sol,gy-56);});

S('Outrigger canoe',['Float on the Left','Paddles Resting','Lagoon Crossing','Reef Pass','Six Seats Empty'],function(R){
  var s=[],sol=[],bg=[],wl=RR(R,138,146),cx=RR(R,140,160),L=RR(R,200,220);
  var hull=[[cx-L/2,wl-14]].concat(quad([cx-L/2,wl-14],[cx,wl-6],[cx+L/2,wl-16],18)).concat(quad([cx+L/2,wl-16],[cx+L/2-30,wl+4],[cx-L/2+20,wl+2],18));SOL(s,sol,hull);H(s,hull.slice(19),1.6,0);
  s.push(quad([cx-L/2+4,wl-12],[cx,wl-4],[cx+L/2-6,wl-13],18));
  var fy=wl+RR(R,26,32),flt=[[cx-L*0.3,fy-4]].concat(quad([cx-L*0.3,fy-4],[cx,fy-8],[cx+L*0.3,fy-5],12)).concat(quad([cx+L*0.3,fy-5],[cx,fy+4],[cx-L*0.3,fy-4],12));SOL(s,sol,flt);H(s,flt,1.4,0);
  [cx-L*0.18,cx+L*0.16].forEach(function(x){s.push([[x,wl-10],[x-6,fy-6]]);s.push([[x+3,wl-10],[x-3,fy-6]]);s.push([[x-4,fy-12],[x-8,fy-4]]);});
  for(var p=0;p<RI(R,2,3);p++){var px=cx-L*0.3+p*L*0.25,P=[[px,wl-12],[px+30,wl-30]];s.push(P);var bl=lens([px+30,wl-30],[px+44,wl-40],5);SOL(s,sol,bl);H(s,bl,1,0);}
  var ix=RR(R,30,80),isl=[[ix-40,wl-20],[ix-20,wl-26],[ix+20,wl-26],[ix+44,wl-20]];var I=[[ix-40,wl-20]].concat(curve(isl,6)).concat([[ix+44,wl-20]]);bg.push(I);H(bg,I,2.4,0);
  var tx=ix+RR(R,-5,10),tt=curve([[tx,wl-25],[tx+6,wl-50],[tx+14,wl-70]],6);bg.push(tt);for(var f=0;f<6;f++){var a=-PI+f*PI/5.2;bg.push(quad([tx+14,wl-70],[tx+14+12*Math.cos(a),wl-76+8*Math.sin(a)],[tx+14+22*Math.cos(a),wl-68+10*Math.sin(a)],8));}
  var sea=RP(4,wl-20,296,196),wt=[];waterIn(wt,R,sea,wl-16,194,RR(R,4.6,5.6));A(bg,wt);bg.push([[4,wl-20],[296,wl-20]]);
  return fin(s,R,bg,sol,wl-30);});

S('Armadillo',['Little Armored One','Dusk Forager','Nine Bands','Rattling Through the Brush','Desert Road Shoulder'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,168,174),cx=RR(R,130,160),bw=RR(R,80,88),bh=RR(R,56,62),by=gy-12;
  var shell=[[cx-bw,by]].concat(arc(cx,by,bw,bh,PI,TAU).slice(1)).concat([[cx+bw,by]]);SOL(s,sol,shell);
  var nb=RI(R,7,9),bands=[];for(var b=0;b<nb;b++){var x=cx-bw*0.45+b*bw*0.9/(nb-1);bands.push([[x,by],[x+RR(R,-1,1),by-bh*Math.sqrt(Math.max(0,1-Math.pow((x-cx)/bw,2)))]]);}A(s,bands);
  for(var b2=0;b2<nb-1;b2++){var xa=cx-bw*0.45+b2*bw*0.9/(nb-1);s.push(comb(xa,xa+bw*0.9/(nb-1),by-bh*0.25,-3,2.4));}
  var sh=[];for(var a=0;a<10;a++){var ang=PI+a*PI/10;}
  clipIn(s,[scallopRows(cx-bw,cx-bw*0.45,by-bh,by,6,5),scallopRows(cx+bw*0.45,cx+bw,by-bh,by,6,5)],shell,[]);
  H(s,[[cx-bw*0.2,by]].concat(arc(cx,by,bw,bh,PI*1.75,TAU).concat([[cx+bw,by]])),1.7,RR(R,60,80));
  var hx=cx+bw-2,head=[[hx,by-18],[hx+18,by-16],[hx+42,by-6],[hx+44,by-2],[hx+22,by+2],[hx,by]];SOL(s,sol,head);H(s,[[hx,by-18],[hx+18,by-16],[hx+20,by-10],[hx,by-8]],1.4,30);
  var ear=lens([hx+12,by-16],[hx+10,by-32],6);SOL(s,sol,ear);s.push(circle(hx+24,by-9,1.6));
  var tail=tube(curve([[cx-bw+2,by-6],[cx-bw-20,by-2],[cx-bw-40,gy-1]],6),function(t){return 5*(1-t)+0.6;});SOL(s,sol,tail.P);for(var r=1;r<6;r++){var i=Math.floor(tail.L.length*r/7);s.push([tail.L[i],tail.R[i]]);}
  [[cx-bw*0.6,1],[cx-bw*0.2,-1],[cx+bw*0.3,1],[cx+bw*0.7,-1]].forEach(function(l){var x=l[0];var leg=[[x-4,by],[x-5,gy],[x+5,gy],[x+4,by]];s.push(leg);s.push([[x-5,gy],[x-8,gy+1]],[[x+5,gy],[x+8,gy+1]]);});
  rocks(bg,[],R,4,cx-bw-46,gy,RR(R,10,16),2);
  bg.push(tufts(4,296,gy,5,R));gnd(bg,R,gy);hills(bg,R,gy-6,RR(R,30,46),RR(R,4,5),[],RR(R,8,20));
  return fin(s,R,bg,sol,gy-14);});

S('Pangolin',['Walking Pinecone','Scales Like Shingles','Night Ant-Hunter','Rolled and Unrolled','Forest Floor Wanderer'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,170,176),cx=RR(R,130,160);
  var sp=curve([[cx+74,gy-22],[cx+52,gy-36],[cx+10,gy-44],[cx-34,gy-40],[cx-70,gy-24],[cx-96,gy-8],[cx-122,gy-3]],8);
  var tb=tube(sp,function(t){return t<0.12?6+t/0.12*12:t<0.6?18+Math.sin((t-0.12)/0.48*PI)*8:Math.max(1.5,18*(1-t)/0.4);});
  var body=tb.P;SOL(s,sol,body);var sc=[];for(var i=Math.floor(sp.length*0.1);i<sp.length-2;i+=3){var p=sp[i],w=(i/sp.length<0.6?22:16*(1-i/sp.length)/0.4)+2;sc.push(arc(p[0],p[1]-1,w*0.55,w,PI*0.1,PI*0.9));}
  var bb=[1e9,1e9,-1e9,-1e9];body.forEach(function(p){bb[0]=Math.min(bb[0],p[0]);bb[1]=Math.min(bb[1],p[1]);bb[2]=Math.max(bb[2],p[0]);bb[3]=Math.max(bb[3],p[1]);});
  clipIn(s,[scallopRows(bb[0]-6,cx+50,bb[1],bb[3],RR(R,8,9),RR(R,6,7))],body,[]);
  var hp=sp[0],head=[[hp[0]-8,hp[1]-6],[hp[0]+6,hp[1]-6],[hp[0]+20,hp[1]+6],[hp[0]+22,hp[1]+10],[hp[0]+4,hp[1]+8],[hp[0]-6,hp[1]+8]];SOL(s,sol,head);s.push(circle(hp[0]+6,hp[1]-1,1.4));
  [[cx+40,-1],[cx+20,1],[cx-30,-1],[cx-50,1]].forEach(function(l){var x=l[0],y0=interpY(tb.R,x);s.push([[x-4,y0-2],[x-6,gy],[x+5,gy],[x+4,y0-2]]);s.push([[x+5,gy],[x+9,gy],[x+11,gy-2]]);});
  var tree=[[RR(R,240,262),gy],[RR(R,246,264),10]];bg.push([[tree[0][0],gy],[tree[1][0],4]]);bg.push([[tree[0][0]+26,gy],[tree[1][0]+24,4]]);var tp=RP(tree[0][0],gy,tree[0][0]+26,4);HX(bg,[tp],RR(R,3.2,4),90);
  var lf=[];for(var k=0;k<RI(R,8,12);k++){var lx=RR(R,10,290),ly=RR(R,gy+4,192);lf.push(lens([lx,ly],[lx+RR(R,8,14),ly+RR(R,-3,3)],4));}A(bg,lf);
  gnd(bg,R,gy);bg.push(tufts(4,296,gy,8,R));
  return fin(s,R,bg,sol,gy-10);});

S('Horseshoe crab',['Older Than Dinosaurs','Spawning Night','Helmet on the Sand','Tide Line Traveler','Blue-Blooded'],function(R){
  var s=[],sol=[],bg=[],cx=RR(R,140,160),cy=RR(R,96,104),rw=RR(R,56,62),rh=RR(R,44,50),rotA=RR(R,-0.35,0.35);
  var shell=[[cx-rw,cy+10]].concat(arc(cx,cy+10,rw,rh,PI,TAU).slice(1)).concat(quad([cx+rw,cy+10],[cx+rw*0.7,cy+20],[cx+rw*0.55,cy+16],8)).concat([[cx-rw*0.55,cy+16]]).concat(quad([cx-rw*0.55,cy+16],[cx-rw*0.7,cy+20],[cx-rw,cy+10],8));
  var abd=[[cx-rw*0.55,cy+16],[cx-rw*0.5,cy+38],[cx-14,cy+52],[cx+14,cy+52],[cx+rw*0.5,cy+38],[cx+rw*0.55,cy+16]];
  var tail=[[cx-3,cy+52],[cx-1,cy+104],[cx+1,cy+104],[cx+3,cy+52]];
  var parts=[shell,abd,tail].map(function(P){return rotateAbout(P,cx,cy+20,rotA);});
  parts.forEach(function(P){SOL(s,sol,P);});
  var ridge=rotateAbout([[cx,cy+10-rh],[cx,cy+52]],cx,cy+20,rotA);s.push(ridge);
  var e1=rotateAbout(arc(cx,cy+10,rw*0.55,rh*0.75,PI*1.1,PI*1.9),cx,cy+20,rotA);s.push(e1);
  [-1,1].forEach(function(d){var e=rotateAbout([[cx+d*rw*0.35,cy-14]],cx,cy+20,rotA)[0];s.push(rotateAbout(lens([cx+d*rw*0.35-4*d,cy-16],[cx+d*rw*0.35+4*d,cy-12],3),cx,cy+20,rotA));});
  H(s,rotateAbout([[cx,cy+10-rh],[cx+rw*0.4,cy+10-rh*0.9],[cx+rw*0.85,cy-6],[cx+rw,cy+10],[cx+rw*0.55,cy+16],[cx,cy+16]],cx,cy+20,rotA),1.4,RR(R,60,80)+rotA*57);
  H(s,parts[1],2.2,RR(R,-20,20));
  for(var k=0;k<5;k++){var t=k/5,y=cy+20+t*30,x=cx-rw*0.52+t*14;[-1,1].forEach(function(d){var p=rotateAbout([[cx+d*(rw*0.52-t*14),y],[cx+d*(rw*0.52-t*14+8),y+2]],cx,cy+20,rotA);s.push(p);});}
  var trail=[];for(var y2=cy+70;y2<196;y2+=6){trail.push([[cx-46+RR(R,-3,3),y2],[cx-40,y2+3]]);trail.push([[cx+46+RR(R,-3,3),y2],[cx+40,y2+3]]);}A(bg,trail);bg.push(curve([[cx,cy+106],[cx+4,cy+130],[cx-4,196]],5));
  sand(bg,R,8,RR(R,5.5,7));
  for(var sh=0;sh<RI(R,2,3);sh++){var sx=RR(R,30,270),sy=RR(R,20,180);if(Math.abs(sx-cx)<80)sx=sx<cx?sx-60:sx+60;if(sx<10||sx>290)continue;var shp=[[sx-8,sy+4]].concat(arc(sx,sy+4,8,8,PI,TAU)).concat([[sx+8,sy+4]]);SOL(s,sol,shp);for(var r=0;r<5;r++){var a=PI+(r+0.5)*PI/5;s.push([[sx,sy+4],[sx+8*Math.cos(a),sy+4+8*Math.sin(a)]]);}}
  behind(s,bg,sol);return s;});

S('Sea urchins on the rocks',['Spines in the Crevice','Purple at Low Tide','Kelp Forest Floor','Pincushions of the Sea','Tide Pool Garden'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,150,158);
  var rk=[];var RRk=[[4,196],[4,gy-RR(R,30,40)],[40,gy-RR(R,50,60)],[90,gy-RR(R,20,30)],[130,gy-RR(R,8,14)],[170,gy-RR(R,20,30)],[220,gy-RR(R,46,56)],[270,gy-RR(R,30,40)],[296,gy-RR(R,20,30)],[296,196]];
  var rockP=[RRk[0]].concat(curve(RRk.slice(1,-1),6)).concat([RRk[RRk.length-1]]);s.push(rockP.slice(1,-1));
  var cracks=[];for(var c=0;c<5;c++){var x=RR(R,10,290),y=interpY(rockP.slice(1,-1),x)+4;cracks.push(curve([[x,y],[x+RR(R,-14,14),y+20],[x+RR(R,-20,20),y+50]],5));}A(s,cracks);
  var ur=[];for(var u=0;u<RI(R,4,6);u++){var x2=30+u*(240/5)+RR(R,-10,10),r=RR(R,10,18),y2=interpY(rockP.slice(1,-1),x2)+r*0.5;ur.push([x2,y2,r]);}
  ur.forEach(function(q){var x=q[0],y=q[1],r=q[2];var body=EP(x,y,r,r*0.8);SOL(s,sol,spiky(x,y,r,r*0.8,RI(R,22,30),R).slice(0,-1));H(s,EP(x,y,r*0.8,r*0.62),1.4,RR(R,30,60));});
  for(var k=0;k<RI(R,2,3);k++){var kx=RR(R,10,290),kb=interpY(rockP.slice(1,-1),kx),h=RR(R,60,100),pts=[];for(var t=0;t<=6;t++)pts.push([kx+8*Math.sin(t*0.9+k),kb-h*t/6]);var cc=curve(pts,6);s.push(cc);for(var t2=1;t2<6;t2++){var p=cc[t2*6];s.push(lens(p,[p[0]+(t2%2?14:-14),p[1]-8],5));}}
  var lowRock=[];H(lowRock,rockP,RR(R,3.2,3.8),RR(R,20,40));behind(s,lowRock,sol);
  var water=[];for(var y=8;y<gy-30;y+=RR(R,6,8)){water.push(wave(4,296,y,1,RR(R,20,30),R()*6));}var wp=[];water.forEach(function(w,i){if(i%2)w.reverse();A(wp,w);});
  var rays=[];for(var r2=0;r2<4;r2++){var rx=RR(R,30,270);rays.push([[rx,4],[rx+40,gy]]);}
  bg.push(wp);A(bg,rays);var hole=rockP.slice();behind(s,bg,sol.concat([hole]));
  return s;});

S('Ammonite in stone',['Coiled in Limestone','Ninety Million Years','The Quarry Gift','Chambers and Sutures','Spiral Fossil'],function(R){
  var s=[],sol=[],bg=[],cx=RR(R,140,160),cy=RR(R,96,104),R0=RR(R,70,78),turns=3.2;
  var outer=EP(cx,cy,R0,R0);SOL(s,sol,outer);var sp=spiral(cx,cy,R0,R0*0.08,turns,R()*TAU);s.push(sp);
  var ribs=[];for(var i=0;i<sp.length-30;i+=4){var p=sp[i],q=sp[Math.min(sp.length-1,i+60)],t=i/sp.length;var dx=p[0]-cx,dy=p[1]-cy,L=Math.hypot(dx,dy),inner=L*(1-0.31);ribs.push(quad(p,[cx+dx/L*(L-L*0.15)+dy/L*3,cy+dy/L*(L-L*0.15)-dx/L*3],[cx+dx/L*inner,cy+dy/L*inner],5));}
  var rb=[],d=1;ribs.forEach(function(r){if(d<0)r=r.slice().reverse();A(rb,r);d=-d;});s.push(rb);
  H(s,arc(cx,cy,R0,R0,PI*0.1,PI*0.9).concat(arc(cx,cy,R0*0.7,R0*0.7,PI*0.9,PI*0.1)),1.6,RR(R,30,60));
  var slab=[[RR(R,8,20),RR(R,10,20)],[RR(R,280,292),RR(R,6,16)],[RR(R,284,294),RR(R,180,190)],[RR(R,10,22),RR(R,184,194)]];s.push(poly(slab));
  var tex=[];HX(tex,[slab,outer],RR(R,4.4,5.2),RR(R,10,30));behind(s,tex,[outer]);
  for(var c=0;c<RI(R,3,5);c++){var x=RR(R,30,270),y=RR(R,24,180);if(Math.hypot(x-cx,y-cy)<R0+16)continue;s.push(curve([[x,y],[x+RR(R,-14,14),y+RR(R,6,14)],[x+RR(R,-20,20),y+RR(R,16,26)]],4));}
  var chis=[];for(var k=0;k<6;k++){var a=k/6*TAU+R(),x0=cx+(R0+6)*Math.cos(a),y0=cy+(R0+6)*Math.sin(a);chis.push([[x0,y0],[x0+8*Math.cos(a),y0+8*Math.sin(a)]]);}A(s,chis);
  return s;});

S('Caterpillar on a leaf',['Munching Through June','Hungry Stripes','Leaf Edge Lunch','Eleven Segments','Before the Wings'],function(R){
  var s=[],sol=[],bg=[],lc=[RR(R,140,160),RR(R,110,120)],lr=RR(R,-0.4,-0.2);
  var leaf=rotateAbout(lens([lc[0]-120,lc[1]],[lc[0]+120,lc[1]],70),lc[0],lc[1],lr);
  var bite=[];for(var b=0;b<3;b++){var bx=lc[0]+40+b*16;bite.push([bx,lc[1]-30]);}
  SOL(s,sol,leaf);var mid=rotateAbout([[lc[0]-120,lc[1]],[lc[0]+120,lc[1]]],lc[0],lc[1],lr);s.push(mid);
  var veins=[];for(var v=0;v<8;v++){var t=(v+1)/9,x=lc[0]-120+240*t;[-1,1].forEach(function(d){var w=34*Math.sin(t*PI);veins.push(rotateAbout(quad([x,lc[1]],[x+10,lc[1]+d*w*0.5],[x+22,lc[1]+d*w*0.9],6),lc[0],lc[1],lr));});}A(s,veins);
  var stem=rotateAbout([[lc[0]-120,lc[1]],[lc[0]-150,lc[1]+12],[lc[0]-170,lc[1]+40]],lc[0],lc[1],lr);s.push(stem);
  var spine=[];for(var i=0;i<=40;i++){var t2=i/40,x2=lc[0]-70+150*t2,y2=lc[1]-8-14*Math.max(0,Math.sin((t2-0.2)*PI*1.6))*(t2>0.25&&t2<0.75?1:0.2);spine.push([x2,y2]);}
  spine=rotateAbout(curve(spine.filter(function(p,i){return i%4===0;}),6),lc[0],lc[1],lr);
  var tb=tube(spine,function(t){return t>0.92?9:8.5;});SOL(s,sol,tb.P);
  var seg=[],nseg=11;for(var k=1;k<nseg;k++){var j=Math.floor(tb.L.length*k/nseg);seg.push([tb.L[j],tb.R[j]]);}A(s,seg);
  var dots=[];for(var k2=0;k2<nseg;k2++){var j2=Math.floor(tb.L.length*(k2+0.5)/nseg),m=lerp(tb.L[j2],tb.R[j2],0.65);dots.push(lens([m[0]-2.5,m[1]],[m[0]+2.5,m[1]],3));}A(s,dots);
  var stripe=[];for(var k3=0;k3<nseg;k3++){var j3=Math.floor(tb.L.length*(k3+0.5)/nseg);stripe.push(tb.L[j3]);}
  H(s,tb.R.concat(tb.R.map(function(p,i){return lerp(p,tb.L[i],0.3);}).reverse()),1.3,RR(R,60,100));
  for(var k4=0;k4<nseg;k4++){var j4=Math.floor(tb.L.length*(k4+0.5)/nseg),p=tb.L[j4];s.push([p,[p[0]+1,p[1]+4]]);}
  var hd=spine[spine.length-1];s.push(circle(hd[0]+6,hd[1],9));s.push(circle(hd[0]+9,hd[1]-2,1.8));s.push([[hd[0]+8,hd[1]-8],[hd[0]+12,hd[1]-16]],[[hd[0]+4,hd[1]-8],[hd[0]+4,hd[1]-17]]);
  var W=RP(4,4,296,196),bgh=[];HX(bgh,[W],RR(R,4.5,5.5),RR(R,60,75));A(bg,bgh);
  behind(s,bg,sol);return s;});

S('Parrot on a perch',['Feathers Like Paint','Pretty Polly','Head Tilted','Talker on the Stand','Tropical Afternoon'],function(R){
  var s=[],sol=[],bg=[],px=RR(R,130,160),py=RR(R,120,128);
  var perch=RP(px-70,py,px+70,py+7);SOL(s,sol,perch);H(s,perch,1.5,0);s.push([[px+50,py+7],[px+50,192]],[[px+56,py+7],[px+56,192]]);s.push(rect(px+30,188,px+76,194));
  var bx=px-4,body=blob([[bx+2,py-2],[bx+18,py-18],[bx+22,py-46],[bx+14,py-72],[bx-2,py-88],[bx-20,py-82],[bx-24,py-60],[bx-20,py-30],[bx-10,py-6]],6);SOL(s,sol,body);
  var head=blob([[bx-2,py-88],[bx+6,py-102],[bx+20,py-108],[bx+34,py-100],[bx+36,py-86],[bx+24,py-76],[bx+10,py-74]],6);SOL(s,sol,head);
  var beak=[[bx+34,py-100],[bx+46,py-98],[bx+50,py-86],[bx+44,py-76],[bx+42,py-84],[bx+36,py-86]];SOL(s,sol,beak);H(s,beak,1.2,30);s.push([[bx+36,py-86],[bx+46,py-88]]);
  s.push(EP(bx+22,py-94,6,6).concat([[bx+28,py-94]]));s.push(circle(bx+23,py-94,1.8));
  var wing=blob([[bx-18,py-74],[bx+6,py-70],[bx+14,py-48],[bx+10,py-20],[bx-2,py+14],[bx-16,py-20]],6);SOL(s,sol,wing);
  var fr=[];for(var r=0;r<5;r++){var y=py-62+r*14;fr.push(scallopRows(bx-18,bx+14,y,y,6,5));}clipIn(s,fr,wing,[]);
  var tail=[[bx-6,py+2],[bx-26,py+70],[bx-14,py+74],[bx+6,py+4]];SOL(s,sol,tail);s.push([[bx-2,py+4],[bx-20,py+72]]);H(s,[[bx-6,py+2],[bx-26,py+70],[bx-20,py+72],[bx-2,py+4]],1.5,70);
  H(s,blob([[bx-20,py-60],[bx-6,py-66],[bx-4,py-30],[bx-14,py-10],[bx-22,py-30]],5),1.6,RR(R,30,60));H(s,blob([[bx+4,py-80],[bx+20,py-104],[bx+30,py-100],[bx+26,py-84],[bx+12,py-76]],5),1.5,RR(R,-30,0));H(s,blob([[bx+10,py-30],[bx+20,py-40],[bx+18,py-12],[bx+4,py-4]],5),1.5,80);
  [bx+4,bx+12].forEach(function(x){s.push([[x,py-8],[x-2,py],[x-6,py+4]],[[x,py-8],[x+4,py+4]]);});
  var W=RP(4,4,296,196),wl=[];HX(wl,[W],RR(R,5,6),90);A(bg,wl);bg.push([[4,150],[296,150]]);H(bg,RP(4,170,296,196),RR(R,3.4,4),RR(R,15,30));bg.push([[4,170],[296,170]]);
  behind(s,bg,sol);return s;});

S('Ostrich',['Long Legs, Long Look','Savanna Sprinter','Two Toes Each','Head Above the Grass','Dust at Midday'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,176,182),cx=RR(R,130,160),by=gy-RR(R,64,70);
  var body=blob([[cx-46,by-6],[cx-30,by-30],[cx+8,by-36],[cx+36,by-22],[cx+40,by],[cx+18,by+16],[cx-20,by+16],[cx-48,by+8]],6);SOL(s,sol,body);
  var plume=[];for(var r=0;r<5;r++){var y=by-28+r*9;plume.push(scallopRows(cx-48,cx+40,y,y,8,6));}clipIn(s,plume,body,[]);
  var tl=[[cx-46,by-6],[cx-62,by-22],[cx-58,by-6],[cx-66,by-2],[cx-48,by+8]];SOL(s,sol,tl);H(s,tl,1.4,30);
  var neck=tube(curve([[cx+30,by-20],[cx+38,by-42],[cx+36,by-62],[cx+44,by-80]],8),function(t){return 6-t*2.5;});SOL(s,sol,neck.P);
  var hp=[cx+44,by-80],head=blob([[hp[0]-6,hp[1]+2],[hp[0]-4,hp[1]-8],[hp[0]+6,hp[1]-10],[hp[0]+12,hp[1]-6],[hp[0]+22,hp[1]-3],[hp[0]+10,hp[1]+2]],5);SOL(s,sol,head);s.push(circle(hp[0]+3,hp[1]-5,1.6));s.push([[hp[0]+8,hp[1]-3],[hp[0]+20,hp[1]-3]]);
  var legs=[[cx-6,RR(R,-6,6)],[cx+14,RR(R,-14,14)]];legs.forEach(function(l,i){var x=l[0],k=[x-6+l[1]*0.5,by+36],f=[x+l[1],gy];var th=tube([[x,by+10],k],function(t){return 6-t*3;});SOL(s,sol,th.P);s.push([k,f]);s.push([[k[0]+3,k[1]],[f[0]+3,f[1]]]);s.push([[f[0]-2,gy],[f[0]+14,gy]]);});
  var ac=RR(R,230,270),at=[[ac,gy],[ac+2,gy-60],[ac-14,gy-80],[ac+2,gy-60],[ac+18,gy-82]];bg.push(at);var crown=[[ac-40,gy-80],[ac-30,gy-94],[ac+20,gy-98],[ac+48,gy-86],[ac+40,gy-78]];var C=blob(crown,5);bg.push(poly(C));HX(bg,[C],2.4,0);
  var at2=RR(R,20,60);bg.push([[at2,gy-20],[at2,gy-40]]);var C2=blob([[at2-24,gy-40],[at2-12,gy-48],[at2+16,gy-50],[at2+28,gy-42]],5);bg.push(poly(C2));HX(bg,[C2],2.4,0);
  bg.push(tufts(4,296,gy,10,R));gnd(bg,R,gy);hills(bg,R,gy-18,RR(R,10,18),RR(R,4.4,5.4),[],0);
  return fin(s,R,bg,sol,gy-24);});

S('Crocodile on a riverbank',['Basking at Noon','Grin With Teeth','Log That Isn\'t','Mud and Armor','Still as Stone'],function(R){
  var s=[],sol=[],bg=[],bk=RR(R,140,148),cx=RR(R,140,160),by=bk-6;
  var sp=curve([[cx+110,by-6],[cx+70,by-10],[cx+30,by-14],[cx-20,by-14],[cx-70,by-10],[cx-110,by-2],[cx-140,by+2]],8);
  var tb=tube(sp,function(t){return t<0.22?4+t/0.22*8:t<0.55?12+Math.sin((t-0.22)/0.33*PI)*6:Math.max(1.2,12*(1-t)/0.45);});SOL(s,sol,tb.P);
  var sc=[];for(var i=Math.floor(sp.length*0.25);i<sp.length-2;i+=2){var t=i/(sp.length-1),w=t<0.55?12:12*(1-t)/0.45;var m=sp[i];sc.push([[m[0],m[1]-w*0.95],[m[0]-2,m[1]-w*1.25-2],[m[0]-4,m[1]-w*0.95]]);}var scs=[];sc.forEach(function(q){A(scs,q);});s.push(scs);
  var grid=[];for(var r=-2;r<=2;r++){var line=[];for(var i2=Math.floor(sp.length*0.25);i2<sp.length-1;i2++){var a=tb.L[i2],b=tb.R[i2];line.push(lerp(a,b,0.5+r*0.18));}grid.push(line);}A(s,grid);
  for(var i3=Math.floor(sp.length*0.25);i3<sp.length-2;i3+=3)s.push([tb.L[i3],tb.R[i3]]);
  H(s,tb.L.slice(Math.floor(sp.length*0.2)).concat(tb.L.slice(Math.floor(sp.length*0.2)).map(function(p,j){return lerp(p,tb.R[Math.floor(sp.length*0.2)+j],0.3);}).reverse()),1.4,RR(R,70,100));
  var hd=sp[0];s.push(comb(hd[0]-26,hd[0]-4,by-6,3,3));s.push(circle(sp[Math.floor(sp.length*0.18)][0],sp[Math.floor(sp.length*0.18)][1]-11,2.5));
  [[0.3,1],[0.5,-1]].forEach(function(l){var i=Math.floor(sp.length*l[0]),p=tb.R[i];s.push([p,[p[0]-6,p[1]+10],[p[0]+6,p[1]+14],[p[0]+14,p[1]+12]]);s.push([[p[0]+6,p[1]+14],[p[0]+12,p[1]+16]]);});
  var bank=[[4,bk-4],[60,bk-10],[150,bk-6],[240,bk-12],[296,bk-4]],B=[[4,196]].concat(curve(bank,6)).concat([[296,196]]);
  var mud=[];H(mud,[[4,bk+10],[296,bk+8],[296,bk+30],[4,bk+30]],RR(R,2.8,3.4),RR(R,-15,15));
  var water=RP(4,bk+30,296,196),wt=[];waterIn(wt,R,water,bk+34,194,RR(R,4.8,5.6));A(bg,wt);bg.push([[4,bk+30],[296,bk+30]]);A(bg,mud);bg.push(curve(bank,6));
  for(var k=0;k<RI(R,8,12);k++){var x=RR(R,6,294),b2=interpY(curve(bank,6),x);if(Math.abs(x-cx)<130&&b2>by-30)continue;bg.push(curve([[x,b2],[x+RR(R,-6,6),b2-RR(R,30,60)]],4));}
  var tlb=[[4,bk-40],[296,bk-40]];bg.push(tlb);var trees=[];for(var x2=4;x2<296;x2+=RR(R,14,22))trees.push([x2,bk-40-RR(R,10,26)]);var T=[[4,bk-40]].concat(curve(trees,4)).concat([[296,bk-40]]);bg.push(T);HX(bg,[T],RR(R,2.6,3.2),RR(R,40,60));
  return fin(s,R,bg,sol,bk-44);});

S('Hammerhead shark',['T-Bone Cruiser','Wide-Eyed Hunter','Over the Sand Flat','Blue Patrol','Head Like a Wing'],function(R){
  var s=[],sol=[],bg=[],cx=RR(R,130,160),cy=RR(R,90,100),ang=RR(R,-0.12,0.12);
  var sp=curve([[cx+90,cy],[cx+50,cy-2],[cx,cy],[cx-50,cy+2],[cx-90,cy]],8);
  var tb=tube(sp,function(t){return t<0.08?6:t<0.4?14:Math.max(2,14*(1-t)/0.6);});
  var head=blob([[cx+76,cy-6],[cx+90,cy-34],[cx+98,cy-40],[cx+106,cy-34],[cx+108,cy],[cx+106,cy+34],[cx+98,cy+40],[cx+90,cy+34],[cx+76,cy+6]],5);
  var pecL=[[cx+40,cy-12],[cx+10,cy-52],[cx+22,cy-50],[cx+50,cy-12]],pecR=[[cx+40,cy+12],[cx+10,cy+52],[cx+22,cy+50],[cx+50,cy+12]];
  var tail=[[cx-86,cy],[cx-120,cy-32],[cx-112,cy],[cx-120,cy+20]],dor=[[cx+10,cy-1],[cx-14,cy-4],[cx-14,cy+4],[cx+10,cy+1]];
  var pl=[tb.P,head,pecL,pecR,tail].map(function(P){return rotateAbout(P,cx,cy,ang);});pl.forEach(function(P){SOL(s,sol,P);});
  H(s,pl[1],2.2,RR(R,0,30));H(s,pl[2],1.8,60);H(s,pl[3],1.8,-60);H(s,pl[4],1.8,20);
  s.push(rotateAbout(dor,cx,cy,ang));s.push(rotateAbout(sp.slice(4,-4),cx,cy,ang));
  var gl=[];for(var g=0;g<5;g++){var x=cx+70-g*5;gl.push(rotateAbout([[x,cy-10],[x-3,cy-2]],cx,cy,ang));gl.push(rotateAbout([[x,cy+10],[x-3,cy+2]],cx,cy,ang));}A(s,gl);
  [-1,1].forEach(function(d){s.push(rotateAbout(EP(cx+98,cy+d*30,2,2).concat([[cx+100,cy+d*30]]),cx,cy,ang));});
  H(s,rotateAbout(tb.L.slice(4,-3).concat(sp.slice(4,-3).reverse()),cx,cy,ang),2,RR(R,80,100));
  
  var bed=[];for(var x=4;x<=296;x+=4)bed.push([x,166+3*Math.sin(x/27)+2*Math.sin(x/9)]);bg.push(bed);sand(bg,R,174,5);
  for(var k=0;k<RI(R,2,4);k++){var kx=RR(R,10,290),kb=interpY(bed,kx),h=RR(R,40,80),pts=[];for(var t=0;t<=6;t++)pts.push([kx+6*Math.sin(t+k),kb-h*t/6]);bg.push(curve(pts,6));}
  var wtr=[],d=1;for(var y=8;y<160;y+=RR(R,7,9)){var w=wave(4,296,y,0.8,RR(R,24,40),R()*6);if(d<0)w.reverse();A(wtr,w);d=-d;}bg.push(wtr);
  behind(s,bg,sol);return s;});

// ---- chunk C: instruments, tools, kitchen, food, toys, furniture ----
function wallK(R){return pick(R,['stripes','tiles','diag']);}
S('Bagpipes',['Drones Tuned','Tartan and Reed','Before the March','Three Drones Up','Highland Morning'],function(R){
  var s=[],sol=[],ty=RR(R,168,174),bx=RR(R,110,140),by=RR(R,128,136);
  var bag=blob([[bx-50,by],[bx-40,by-30],[bx,by-40],[bx+40,by-30],[bx+54,by-4],[bx+40,by+22],[bx,by+30],[bx-36,by+22]],6);SOL(s,sol,bag);
  var tart=[];HX(tart,[bag],RR(R,7,8),20);HX(tart,[bag],RR(R,7,8),-70);A(s,tart);H(s,[[bx-50,by],[bx-40,by+10],[bx-30,by+24],[bx,by+30],[bx+10,by+22],[bx-20,by+10]],1.5,30);
  var tops=[[bx-30,by-30,-1.15,84],[bx-6,by-36,-1.3,76],[bx+18,by-34,-1.45,68]];
  tops.forEach(function(d,i){var a=d[2],L=d[3],x1=d[0]+L*Math.cos(a),y1=d[1]+L*Math.sin(a);var tb=tube([[d[0],d[1]],[x1,y1]],function(){return 3.2;});SOL(s,sol,tb.P);
    for(var k=1;k<4;k++){var p=lerp([d[0],d[1]],[x1,y1],k/4),n=[-Math.sin(a)*5,Math.cos(a)*5];var ring=[[p[0]+n[0],p[1]+n[1]],[p[0]-n[0],p[1]-n[1]],[p[0]-n[0]+Math.cos(a)*4,p[1]-n[1]+Math.sin(a)*4],[p[0]+n[0]+Math.cos(a)*4,p[1]+n[1]+Math.sin(a)*4]];SOL(s,sol,ring);H(s,ring,1,0);}
    var cap=[[x1-6,y1+2],[x1-5,y1-6],[x1+5,y1-6],[x1+6,y1+2]];SOL(s,sol,cap);H(s,cap,1.2,90);});
  s.push(quad([tops[0][0]+84*Math.cos(-1.15)*0.85,tops[0][1]+84*Math.sin(-1.15)*0.85],[bx,by-50],[tops[2][0]+68*Math.cos(-1.45)*0.8,tops[2][1]+68*Math.sin(-1.45)*0.8],12));
  var ch=tube([[bx+30,by+20],[bx+50,by+76]],function(t){return 3.5+t*1.5;});SOL(s,sol,ch.P);for(var h=1;h<7;h++){var p=lerp([bx+30,by+20],[bx+50,by+76],h/8);s.push(circle(p[0],p[1],1.1));}
  var bp=tube([[bx+44,by-14],[bx+90,by-46]],function(){return 2.4;});SOL(s,sol,bp.P);
  for(var f=0;f<3;f++){var fx=bx-10+f*14;s.push(curve([[fx,by+30],[fx-4,by+44],[fx+2,by+56]],5));}
  tableS(s,R,ty,wallK(R),sol);return s;});

S('Trombone',['Slide Position Six','Brass at Rest','Bell and Slide','Jazz Club, Closing','Glissando'],function(R){
  var s=[],sol=[],ty=RR(R,150,156),y0=ty-RR(R,26,34),x0=RR(R,24,40),L=RR(R,220,236),gap=12,rot=RR(R,-0.08,0.08),cx=150,cy=y0;
  function T(P){return rotateAbout(P,cx,cy,rot);}
  var s1=tube([[x0+10,y0],[x0+L*0.62,y0]],function(){return 2.2;}),s2=tube([[x0+10,y0+gap],[x0+L*0.62,y0+gap]],function(){return 2.2;});
  [s1,s2].forEach(function(t){SOL(s,sol,T(t.P));});
  var ub=[[x0+10,y0-2.2]].concat(arc(x0+10,y0+gap/2,gap/2+2.2,gap/2+2.2,-PI/2,-PI*1.5)).concat([[x0+10,y0+gap+2.2]]);s.push(T(ub));s.push(T(arc(x0+10,y0+gap/2,gap/2-2.2,gap/2-2.2,-PI/2,-PI*1.5)));
  var b0=x0+L*0.4,bell=[[b0,y0-14]].concat([[x0+L*0.9,y0-16],[x0+L,y0-34]]).concat(arc(x0+L,y0-14,8,20,-PI/2,PI/2)).concat([[x0+L*0.9,y0-12],[b0,y0-10]]);SOL(s,sol,T(bell));
  s.push(T(ellipse(x0+L,y0-14,8,20)));H(s,T(arc(x0+L,y0-14,8,20,-PI/2,PI/2).concat([[x0+L-5,y0+4],[x0+L-5,y0-32]])),1.2,90);
  var bb=[[b0,y0-14]].concat(arc(b0,y0-12+gap/2,gap/2+8,gap/2+8,-PI/2,-PI*1.5).slice(0,1));
  var u2=[[x0+L*0.62+4,y0-2]].concat(arc(x0+L*0.62+4,y0-6,4,4,PI/2,-PI/2)).concat([[x0+L*0.62+4,y0-10]]);s.push(T(u2));
  s.push(T([[b0,y0-14],[b0-12,y0-14]].concat(arc(b0-12,y0-12+0,2,2,-PI/2,-PI*1.5)).concat([[b0,y0-10]])));
  var mp=[[x0+L*0.62+8,y0+gap-1],[x0+L*0.62+20,y0+gap-3],[x0+L*0.62+20,y0+gap+3],[x0+L*0.62+8,y0+gap+1]];SOL(s,sol,T(mp));
  for(var b=0;b<3;b++){var bx=x0+L*(0.2+b*0.15);s.push(T([[bx,y0-2],[bx,y0+gap+2]]));}
  H(s,T(RP(x0+L*0.45,y0-14,x0+L*0.9,y0-12)),0.8,0);
  var shadow=T([[x0+20,ty-2],[x0+L-10,ty-2]]);s.push(shadow);s.push(T([[x0+L*0.3,y0+gap+3],[x0+L*0.3,ty-2]]));s.push(T([[x0+L*0.75,y0-2],[x0+L*0.78,ty-2]]));
  var case_=RP(20,ty,120,ty-8);
  tableS(s,R,ty,wallK(R),sol);return s;});

S('Timpani',['Kettle Drums','Thunder in the Pit','Pedal Tuned','Copper Bowls','Rolling Timpani'],function(R){
  var s=[],sol=[],fy=RR(R,176,182),drums=[[RR(R,80,96),RR(R,52,58)],[RR(R,200,214),RR(R,44,50)]];
  drums.forEach(function(d,i){var cx=d[0],r=d[1],hy=fy-RR(R,64,72)+(i?8:0),ry=r*0.28;
    var bowl=[[cx-r,hy]].concat(cubic([cx-r,hy],[cx-r,hy+r*0.7],[cx-r*0.3,hy+r*0.9],[cx,hy+r*0.9],14)).concat(cubic([cx,hy+r*0.9],[cx+r*0.3,hy+r*0.9],[cx+r,hy+r*0.7],[cx+r,hy],14));SOL(s,sol,bowl);
    var head=EP(cx,hy,r,ry);SOL(s,sol,head);s.push(EP(cx,hy,r*0.94,ry*0.9).concat([[cx+r*0.94,hy]]));
    H(s,[[cx+r*0.2,hy+ry*0.8],[cx+r,hy]].concat(cubic([cx+r,hy],[cx+r,hy+r*0.7],[cx+r*0.3,hy+r*0.9],[cx+r*0.2,hy+r*0.9],10)),1.6,RR(R,70,90));
    for(var k=0;k<7;k++){var a=PI*0.1+k*PI*0.8/6,x=cx-r*Math.cos(a),y=hy+ry*Math.sin(a)*0.9;s.push([[x,y],[x+(cx-x)*0.08,y+r*0.5*Math.sin(a)*0.7+6]]);s.push(rect(x-1.5,y-4,x+1.5,y));}
    [-0.6,0,0.6].forEach(function(f){var lx=cx+f*r*0.8;s.push([[lx,hy+r*0.75],[lx+f*14,fy]]);});
    s.push(EP(cx,fy-2,r*0.75,4).concat([[cx+r*0.75,fy-2]]));var pd=[[cx-10,fy-1],[cx+r*0.4,fy-6],[cx+r*0.4+6,fy-4],[cx-6,fy+1]];SOL(s,sol,pd);});
  var mx=drums[0][0]+10,my=fy-RR(R,64,72)-2;[0,1].forEach(function(j){var x=mx-10+j*18;s.push([[x,my],[x+40,my-30+j*4]]);var hd=EP(x+42,my-32+j*4,4,4);SOL(s,sol,hd);H(s,hd,1,0);});
  var stand=[[150,fy],[150,fy-110],[146,fy-110],[146,fy]];s.push(stand);var sheet=[[118,fy-110],[178,fy-110],[182,fy-150],[114,fy-150]];SOL(s,sol,sheet);var st=[];for(var l=0;l<5;l++)st.push([[120,fy-118-l*6],[176,fy-118-l*6]]);A(s,st);
  floorS(s,R,fy,RI(R,12,16));var W=RP(4,4,296,fy),bg=[];HX(bg,[W],RR(R,6,7.5),90);var cur=[];for(var c=0;c<6;c++){var x=4+c*58;cur.push(curve([[x,4],[x+10,fy*0.5],[x-4,fy]],6));}A(bg,cur);behind(s,bg,sol);
  return s;});

S('Hurdy-gurdy',['Wheel and Drone','Crank Turned Slowly','Village Dance','Keys Along the Neck','Medieval Hum'],function(R){
  var s=[],sol=[],ty=RR(R,166,172),cx=RR(R,140,160),cy=ty-RR(R,44,50),rot=RR(R,-0.12,0.05);
  function T(P){return rotateAbout(P,cx,cy,rot);}
  var body=blob([[cx-96,cy-4],[cx-80,cy-34],[cx-40,cy-38],[cx,cy-30],[cx+40,cy-38],[cx+76,cy-30],[cx+90,cy],[cx+76,cy+30],[cx+40,cy+38],[cx,cy+30],[cx-40,cy+38],[cx-80,cy+34]],6);SOL(s,sol,T(body));
  s.push(T(blob([[cx-90,cy-2],[cx-76,cy-28],[cx-40,cy-32],[cx,cy-25],[cx+40,cy-32],[cx+72,cy-24],[cx+84,cy],[cx+72,cy+24],[cx+40,cy+32],[cx,cy+25],[cx-40,cy+32],[cx-76,cy+28]],6)));
  var kb=RP(cx-60,cy-10,cx+50,cy+10);SOL(s,sol,T(kb));H(s,T(RP(cx-60,cy+4,cx+50,cy+10)),1.1,0);for(var k=0;k<12;k++){var x=cx-56+k*9;s.push(T([[x,cy-10],[x,cy-16],[x+4,cy-16],[x+4,cy-10]]));}
  var wc=T(arc(cx-74,cy,18,26,-PI/2,PI/2).concat([[cx-74,cy+26],[cx-74,cy-26]]));SOL(s,sol,wc);H(s,wc,2.6,90);
  var head=[[cx+50,cy-8],[cx+100,cy-14],[cx+110,cy-8],[cx+110,cy+8],[cx+100,cy+14],[cx+50,cy+8]];SOL(s,sol,T(head));for(var p=0;p<3;p++){var px=cx+66+p*14;s.push(T([[px,cy-12],[px,cy-24]]));s.push(T(rect(px-3,cy-28,px+3,cy-24)));}
  var str=[];for(var j=0;j<4;j++){var y=cy-6+j*4;str.push([[cx-56,y],[cx+104,y]]);}A(s,T(str[0]).length?str.map(function(q){return T(q);}):[]);
  var cr=[[cx-96,cy],[cx-118,cy],[cx-118,cy+24],[cx-126,cy+24]];s.push(T(cr));var kn=T(EP(cx-126,cy+30,4,7));SOL(s,sol,kn);
  H(s,T([[cx-80,cy+34],[cx-40,cy+38],[cx,cy+30],[cx+40,cy+38],[cx+76,cy+30],[cx+76,cy+20],[cx-80,cy+24]]),1.6,RR(R,20,40));
  s.push(T([[cx+20,cy+30],[cx+30,ty-2]]));
  tableS(s,R,ty,wallK(R),sol);return s;});

S('Brace and bit drill',['Bore at the Bench','Crank and Auger','Hole by Hand','Before Electricity','Chips on the Plank'],function(R){
  var s=[],sol=[],ty=RR(R,158,164),cx=RR(R,130,160),pl=RP(cx-110,ty-10,cx+110,ty-22);
  SOL(s,sol,pl);H(s,pl,2.6,0);var gr=[];for(var g=0;g<3;g++)gr.push(wave(cx-108,cx+108,ty-13-g*3,0.6,RR(R,30,50),R()*6));A(s,gr);H(s,RP(cx-110,ty-10,cx+110,ty-13),1,0);
  var hy=ty-22,top=hy-RR(R,118,126),kx=cx+RR(R,-6,6);
  var bit=[[kx,hy+2],[kx,hy-26]];s.push(bit);var aug=[];for(var t=0;t<=10;t++){var y=hy-2-t*2.4;aug.push([kx+(t%2?3:-3),y]);}s.push(aug);
  var chuck=[[kx-4,hy-26],[kx-6,hy-40],[kx+6,hy-40],[kx+4,hy-26]];SOL(s,sol,chuck);H(s,chuck,1.2,90);
  var sh=[[kx-1.5,hy-40],[kx-1.5,hy-58],[kx-30,hy-62],[kx-30,hy-86],[kx-1.5,hy-90],[kx-1.5,top+10],[kx+1.5,top+10],[kx+1.5,hy-87],[kx-27,hy-83],[kx-27,hy-65],[kx+1.5,hy-61],[kx+1.5,hy-40]];SOL(s,sol,sh);
  var hd=[[kx-14,top+10],[kx-12,top],[kx+12,top],[kx+14,top+10]];SOL(s,sol,hd);H(s,hd,1.3,0);var knob=EP(kx,top-4,16,6);SOL(s,sol,knob);H(s,EP(kx,top-2,14,3),1.1,0);
  var gp=RP(kx-36,hy-84,kx-22,hy-64);SOL(s,sol,gp);H(s,gp,1.6,90);
  var sh1=[];for(var c=0;c<RI(R,5,7);c++){var x=kx+RR(R,-50,50),y=hy-RR(R,0,2);if(Math.abs(x-kx)<8)continue;sh1.push(spiral(x,y-3,0.5,RR(R,3,5),1.4,R()*6));}A(s,sh1);
  [cx-90,cx+90].forEach(function(x){s.push([[x-6,ty-10],[x-16,ty+30]],[[x+6,ty-10],[x+16,ty+30]]);});
  var W=[];tableS(s,R,ty+30,wallK(R),sol.concat([RP(cx-110,ty-10,cx+110,ty+30)]));return s;});

S('Blacksmith\'s bellows',['Breath for the Fire','Leather Lungs','Forge Morning','Heat Rising','Pump and Glow'],function(R){
  var s=[],sol=[],fy=RR(R,176,182),hx=RR(R,170,190),hw=RR(R,90,100);
  var hearth=RP(hx,fy,hx+hw,fy-56);SOL(s,sol,hearth);clipIn(s,[brickS(hx,fy-56,hx+hw,fy,RR(R,10,12),RR(R,6,7))],hearth,[]);
  var top=RP(hx-4,fy-56,hx+hw+4,fy-62);SOL(s,sol,top);H(s,top,1.4,0);
  var hood=[[hx+10,fy-62],[hx+hw-10,fy-62],[hx+hw*0.7,fy-110],[hx+hw*0.3,fy-110]];SOL(s,sol,hood);H(s,[[hx+hw*0.55,fy-62],[hx+hw-10,fy-62],[hx+hw*0.7,fy-110],[hx+hw*0.55,fy-110]],1.6,90);
  var ch=RP(hx+hw*0.3,fy-110,hx+hw*0.7,4);SOL(s,sol,ch);clipIn(s,[brickS(hx+hw*0.3,4,hx+hw*0.7,fy-110,10,7)],ch,[]);
  var fc=hx+hw/2;for(var f=0;f<5;f++){var fx=fc-20+f*10;s.push(curve([[fx-4,fy-62],[fx+RR(R,-4,4),fy-74],[fx+RR(R,-3,3),fy-84],[fx+RR(R,-2,2),fy-90-RR(R,0,8)]],5));}
  var coal=[];for(var c=0;c<6;c++)coal.push(arc(fc-24+c*9,fy-62,4.5,3,PI,TAU));A(s,coal);
  var bx=RR(R,30,50),by=fy-RR(R,62,70),bl=RR(R,110,120),top1=[[bx,by-22],[bx+bl*0.75,by-10],[bx+bl,by-4],[bx+bl*0.75,by+2],[bx,by-6]];
  var low=[[bx,by+12],[bx+bl*0.75,by+10],[bx+bl,by+2],[bx+bl*0.75,by+20],[bx,by+28]];
  var ub=blob([[bx-6,by-24],[bx+bl*0.5,by-20],[bx+bl,by-6],[bx+bl*0.5,by-8],[bx-6,by-10]],5);SOL(s,sol,ub);H(s,ub,RR(R,1.8,2.2),RR(R,-5,5));
  var lb=blob([[bx-6,by+16],[bx+bl*0.5,by+12],[bx+bl,by+2],[bx+bl*0.5,by+24],[bx-6,by+30]],5);SOL(s,sol,lb);H(s,lb,RR(R,1.8,2.2),RR(R,-5,5));
  var pl=[];for(var x=bx;x<bx+bl*0.9;x+=4){var t=(x-bx)/bl,y0=by-8+t*2,y1=by+14-t*12;pl.push([x,y0],[x+2,(y0+y1)/2+4],[x+4,y1]);}var pp=[];for(var i=0;i<pl.length;i+=3){pp.push(pl[i],pl[i+1]);}s.push(zz(bx,bx+bl*0.88,by-8,by+14,3.4).map(function(p){var t=(p[0]-bx)/bl;return [p[0],p[1]<by?by-8+t*6:by+14-t*12];}));
  var nz=[[bx+bl,by],[hx+6,fy-50],[hx+6,fy-44],[bx+bl,by+4]];SOL(s,sol,nz);
  s.push([[bx-6,by-17],[bx-30,by-30]],[[bx-30,by-30],[bx-30,by-40]]);s.push([[bx+bl*0.4,by+26],[bx+bl*0.4,fy]],[[bx+bl*0.2,by+28],[bx+bl*0.1,fy]]);
  var tools=[];for(var t2=0;t2<3;t2++){var x2=hx+hw+RR(R,10,24)+t2*6;if(x2>292)break;tools.push([[x2,fy-56],[x2+2,fy-120]]);}A(s,tools);
  floorS(s,R,fy,RI(R,10,14));var W=RP(4,4,296,fy),bg=[];var st=[];for(var y=10;y<fy;y+=RR(R,9,12))st.push(wall(st,R,4,296,y+10,10,RR(R,18,26)));
  var bgw=[];HX(bgw,[W],RR(R,6,7),0);behind(s,bgw,sol);return s;});

S('Garden fork and spade',['Turning the Bed','Spring Digging','Tines in the Loam','Two Tools, One Row','After the Rain'],function(R){
  var s=[],sol=[],gy=RR(R,140,148),fx=RR(R,90,110),sx=RR(R,180,200);
  var fsh=[[fx-2.5,gy+10],[fx-3,gy-80],[fx+3,gy-80],[fx+2.5,gy+10]];SOL(s,sol,fsh);H(s,fsh,1.3,90);
  var dh=[[fx-12,gy-80],[fx-14,gy-104]].concat(arc(fx,gy-104,14,8,PI,TAU)).concat([[fx+14,gy-104],[fx+12,gy-80]]);SOL(s,sol,dh);s.push(RP(fx-8,gy-90,fx+8,gy-100).concat([[fx-8,gy-90]]));
  var tn=[];for(var t=0;t<4;t++){var x=fx-12+t*8;tn.push([[x-1.5,gy+4],[x-1.5,gy+30],[x,gy+33],[x+1.5,gy+30],[x+1.5,gy+4]]);}tn.forEach(function(P){SOL(s,sol,P);});var bar=RP(fx-14,gy+4,fx+14,gy);SOL(s,sol,bar);H(s,bar,1,0);
  var ang=RR(R,0.12,0.22);function T(P){return rotateAbout(P,sx,gy+20,ang);}
  var ssh=T([[sx-2.5,gy-4],[sx-3,gy-84],[sx+3,gy-84],[sx+2.5,gy-4]]);SOL(s,sol,ssh);H(s,ssh,1.3,90);
  var sh2=T([[sx-12,gy-84],[sx-14,gy-106]].concat(arc(sx,gy-106,14,8,PI,TAU)).concat([[sx+14,gy-106],[sx+12,gy-84]]));SOL(s,sol,sh2);
  var bl=T([[sx-14,gy-4],[sx-14,gy+26],[sx,gy+34],[sx+14,gy+26],[sx+14,gy-4]]);SOL(s,sol,bl);H(s,T([[sx+2,gy-4],[sx+14,gy-4],[sx+14,gy+26],[sx+2,gy+32]]),1.4,90);
  var mound=[[4,gy+4],[60,gy-4],[140,gy-2],[220,gy-6],[296,gy+2]],M=curve(mound,6);s.push(M);
  var clods=[];for(var c=0;c<RI(R,4,6);c++){var cxx=RR(R,10,290),cyy=interpY(M,cxx)+RR(R,4,30);clods.push(arc(cxx,cyy,RR(R,3,6),RR(R,2,4),PI,TAU));}A(s,clods);
  var soil=[];HX(soil,[[[4,gy+4]].concat(M).concat([[296,196],[4,196]])],RR(R,3.4,4),RR(R,10,30));behind(s,soil,sol);
  var bg=[];bg.push(comb(4,296,gy-30,40,9));bg.push([[4,gy-50],[296,gy-50]]);bg.push([[4,gy-36],[296,gy-36]]);
  for(var k=0;k<RI(R,3,5);k++){var kx=RR(R,10,290);bg.push([[kx,gy-4],[kx,gy-30]]);for(var l=0;l<3;l++)bg.push(lens([kx,gy-10-l*7],[kx+(l%2?10:-10),gy-16-l*7],4));}
  bg.push([[4,gy-30],[296,gy-30]]);behind(s,bg,sol);return sky(s,R,gy-52,sol);});

S('Toaster with toast',['Golden Brown','Pop!','Breakfast Counter','Two Slices Up','Chrome Morning'],function(R){
  var s=[],sol=[],ty=RR(R,160,166),tx=RR(R,92,118),tw=RR(R,100,110),th=RR(R,62,68),rr=12;
  var body=[[tx,ty]].concat(arc(tx+rr,ty-th+rr,rr,rr,PI,1.5*PI)).concat(arc(tx+tw-rr,ty-th+rr,rr,rr,1.5*PI,TAU)).concat([[tx+tw,ty]]);
  var slots=[];[0.3,0.7].forEach(function(f,i){var x=tx+tw*f,toast=[[x-22,ty-th+4],[x-22,ty-th-RR(R,18,26)]].concat(arc(x-14,ty-th-24,8,8,PI,1.6*PI)).concat(arc(x+14,ty-th-24,8,8,1.4*PI,TAU)).concat([[x+22,ty-th-RR(R,18,26)],[x+22,ty-th+4]]);
    SOL(s,sol,toast);s.push(toast.slice(1,-1).map(function(p){return [p[0]+(x-p[0])*0.12,p[1]+3];}));var crumb=[];for(var c=0;c<5;c++){var cx=x-12+c*6;crumb.push([[cx,ty-th-6],[cx+1,ty-th-8]]);}A(s,crumb);
    H(s,toast.slice(1,-1).map(function(p){return [p[0]+(x-p[0])*0.12,p[1]+3];}),RR(R,2.6,3.2),RR(R,30,60));slots.push(RP(x-24,ty-th+2,x+24,ty-th+6));});
  SOL(s,sol,body);slots.forEach(function(P){s.push(poly(P));});
  H(s,[[tx+tw*0.78,ty],[tx+tw*0.78,ty-th+4],[tx+tw-4,ty-th+8],[tx+tw,ty-th+14],[tx+tw,ty]],1.5,90);s.push([[tx+tw*0.12,ty-th+10],[tx+tw*0.12,ty-10]]);
  var lv=RP(tx+tw,ty-38,tx+tw+10,ty-32);SOL(s,sol,lv);s.push(EP(tx+tw*0.5,ty-18,6,6).concat([[tx+tw*0.5+6,ty-18]]));s.push([[tx+tw*0.5,ty-18],[tx+tw*0.5+4,ty-22]]);
  [tx+10,tx+tw-10].forEach(function(x){s.push(RP(x-5,ty,x+5,ty+3).concat([[x-5,ty]]));});
  var px=tx+tw+RR(R,40,60),plt=EP(px,ty-2,30,6);SOL(s,sol,plt);s.push(EP(px,ty-3,20,3.5).concat([[px+20,ty-3]]));var bt=[[px-10,ty-6],[px-10,ty-14],[px+6,ty-16],[px+10,ty-8]];SOL(s,sol,bt);H(s,bt,1.3,0);
  var kn=[[px-40,ty-4],[px-80,ty-1]];s.push(kn);var kb=lens([px-40,ty-4],[px-56,ty-3],4);SOL(s,sol,kb);
  var jar=RP(tx-50,ty,tx-20,ty-34);SOL(s,sol,jar);var lid=RP(tx-52,ty-34,tx-18,ty-40);SOL(s,sol,lid);H(s,lid,1.2,90);H(s,RP(tx-50,ty-26,tx-20,ty-6),1.6,45);
  tableS(s,R,ty,'tiles',sol);return s;});

S('Stockpot and ladle',['Simmering Since Noon','Sunday Broth','Lid Rattling','Big Pot, Small Kitchen','Soup for Twelve'],function(R){
  var s=[],sol=[],sy=RR(R,156,162),cx=RR(R,120,150),pr=RR(R,52,58),ph=RR(R,66,72);
  var st=RP(20,sy,280,sy+12);SOL(s,sol,st);H(s,st,1.6,0);var grate=[];for(var g=0;g<6;g++){var gx=cx-pr-6+g*(2*pr+12)/5;grate.push([[gx,sy],[gx,sy-4]]);}A(s,grate);s.push([[cx-pr-8,sy-4],[cx+pr+8,sy-4]]);
  var pot=[[cx-pr,sy-4],[cx-pr,sy-4-ph]].concat(arc(cx,sy-4-ph,pr,pr*0.22,PI,TAU).slice(1)).concat([[cx+pr,sy-4]]).concat(arc(cx,sy-4,pr,pr*0.22,0,PI).slice(1));SOL(s,sol,pot);
  H(s,[[cx+pr*0.3,sy-4+pr*0.2],[cx+pr,sy-4],[cx+pr,sy-4-ph],[cx+pr*0.3,sy-4-ph+pr*0.2]],1.7,90);for(var b=1;b<3;b++)s.push(arc(cx,sy-4-ph*b/3,pr,pr*0.22,0,PI));
  [-1,1].forEach(function(d){s.push([[cx+d*pr,sy-ph+8],[cx+d*(pr+10),sy-ph+6],[cx+d*(pr+10),sy-ph+16],[cx+d*pr,sy-ph+16]]);});
  var lt=RR(R,-0.18,-0.1),lid=rotateAbout(arc(cx,sy-4-ph-2,pr+3,pr*0.24,PI,TAU).concat([[cx+pr+3,sy-ph-4]]),cx+pr,sy-4-ph,lt);SOL(s,sol,lid);var kn=rotateAbout(RP(cx-6,sy-4-ph-pr*0.24-2,cx+6,sy-4-ph-pr*0.24-8),cx+pr,sy-4-ph,lt);SOL(s,sol,kn);H(s,kn,1,0);
  for(var f=0;f<3;f++){var fx=cx-pr*0.7+f*14;s.push(curve([[fx,sy-4-ph-2],[fx-6,sy-ph-22],[fx+4,sy-ph-36],[fx-4,sy-ph-52]],6));}
  var rail=[[150,30],[290,30]];s.push(rail);s.push([[150,27],[150,33]],[[290,27],[290,33]]);
  var lx=RR(R,210,230);s.push([[lx,30],[lx,34]]);var lh=tube([[lx,34],[lx,100]],function(){return 2;});SOL(s,sol,lh.P);var bowl=[[lx-14,100]].concat(arc(lx,100,14,12,PI,0)).concat([[lx+14,100]]);bowl=[[lx-14,100]].concat(arc(lx,100,14,12,PI,0).slice(1));SOL(s,sol,[[lx-14,100]].concat(arc(lx,100,14,12,0,PI).reverse()));H(s,arc(lx,100,14,12,0,PI),1.2,0);
  var sx=lx+28;s.push([[sx,30],[sx,34]]);var sp=tube([[sx,34],[sx,90]],function(){return 1.6;});SOL(s,sol,sp.P);var sb=EP(sx,98,7,10);SOL(s,sol,sb);for(var h=0;h<3;h++)s.push(circle(sx,94+h*4,1));
  var oven=RP(30,sy+12,270,196);s.push(poly(oven));var od=RP(60,sy+24,240,190);s.push(poly(od));s.push([[90,sy+18],[210,sy+18]]);H(s,RP(70,sy+40,230,180),RR(R,3,3.6),0);
  var bg=[],W=RP(4,4,296,sy);var g1=RR(R,11,13);HX(bg,[W],g1,0);HX(bg,[W],g1,90);behind(s,bg,sol);return s;});

S('Bunch of bananas',['Seven in a Hand','Ripening on the Counter','Freckles Coming','Tropical Arc','Yellow Crescent'],function(R){
  var s=[],sol=[],ty=RR(R,160,166),cx=RR(R,140,160),n=RI(R,5,7),st=[cx-RR(R,70,80),ty-RR(R,56,64)];
  var stem=tube([[st[0]-14,st[1]-10],[st[0]+6,st[1]+4]],function(){return 4;});SOL(s,sol,stem.P);H(s,stem.P,1.2,40);var cap=[[st[0]-18,st[1]-14],[st[0]-16,st[1]-6],[st[0]-10,st[1]-14]];SOL(s,sol,cap);
  var base=[st[0]+4,st[1]+2];for(var i=0;i<n;i++){var a=-0.55+i*0.75/(n-1)+RR(R,-0.04,0.04),Lb=RR(R,108,122),tip=[base[0]+Lb*Math.cos(a),base[1]+Lb*Math.sin(a)+Lb*0.22],m=lerp(base,tip,0.5),dx=tip[0]-base[0],dy=tip[1]-base[1],l=Math.hypot(dx,dy),nx=-dy/l,ny=dx/l;
    var P=quad(base,[m[0]+nx*30,m[1]+ny*30],tip,18).concat(quad(tip,[m[0]+nx*12,m[1]+ny*12],base,18).slice(1));SOL(s,sol,P);
    s.push(quad(base,[m[0]+nx*24,m[1]+ny*24],tip,14));s.push(quad([base[0]+dx*0.1,base[1]+dy*0.1],[m[0]+nx*18,m[1]+ny*18],[tip[0]-dx*0.08,tip[1]-dy*0.08],12));
    var tp=[[tip[0]-2,tip[1]-2],[tip[0]+5,tip[1]+1],[tip[0]-1,tip[1]+3]];SOL(s,sol,tp);H(s,tp,0.8,0);
    for(var f=0;f<RI(R,1,3);f++){var t=RR(R,0.3,0.8),p=quad(base,[m[0]+nx*22,m[1]+ny*22],tip,10)[Math.floor(t*10)];s.push(lens([p[0]-1.5,p[1]],[p[0]+1.5,p[1]+1],1.6));}}
  var bowl=[[cx-120,ty-30]].concat(arc(cx-10,ty-30,110,30,PI,0)).concat([[cx+100,ty-30]]);
  var lm=RR(R,230,262);if(lm<cx+100)lm=cx+110;if(lm<280){var L=EP(lm,ty-14,16,14);SOL(s,sol,L);H(s,EP(lm+4,ty-12,10,10),1.6,40);s.push([[lm,ty-28],[lm+4,ty-34]]);s.push(lens([lm+4,ty-30],[lm+16,ty-36],5));}
  tableS(s,R,ty,'stripes',sol);return s;});

S('Artichokes',['Thistle for Dinner','Green Armor','Three on the Board','Leaves to Pull','Market Haul'],function(R){
  var s=[],sol=[],ty=RR(R,160,166);var items=[[RR(R,80,100),RR(R,38,44)],[RR(R,170,190),RR(R,44,50)],[RR(R,250,262),RR(R,30,36)]];
  var board=[[30,ty],[40,ty-12],[260,ty-12],[270,ty]];
  items.forEach(function(a,j){var cx=a[0],r=a[1],cy=ty-12-r*1.15-(j===1?6:0),lean=RR(R,-0.25,0.25);var parts=[];
    var outl=[];var rows=5;for(var k=0;k<rows;k++){var yy=cy+r*0.9-k*r*0.42,w=r*(0.55+0.5*Math.sin(PI*(k+1)/(rows+0.6))),n=Math.max(2,RI(R,3,4)-Math.floor(k/2)),step=2*w/n;
      for(var q=0;q<n;q++){var x0=cx-w+q*step,x1=x0+step,tipx=(x0+x1)/2+RR(R,-1.5,1.5);var P=[[x0,yy]].concat(cubic([x0,yy],[x0-step*0.05,yy-r*0.35],[tipx-step*0.2,yy-r*0.5],[tipx,yy-r*0.56],6).slice(1)).concat(cubic([tipx,yy-r*0.56],[tipx+step*0.2,yy-r*0.5],[x1+step*0.05,yy-r*0.35],[x1,yy],6).slice(1));parts.push(P);}}
    var hull=EP(cx,cy,r*1.02,r*1.25);parts=parts.map(function(P){return rotateAbout(P,cx,cy+r,lean);});hull=rotateAbout(hull,cx,cy+r,lean);
    parts.slice().reverse().forEach(function(P){s.push(P);});sol.push(hull);
    parts.forEach(function(P,i){if(i%2===0){var t=[];H(t,P.slice(0,8).concat([[(P[0][0]+P[P.length-1][0])/2,P[0][1]]]),2.4,70);A(s,t);}});
    var stem=rotateAbout([[cx-5,cy+r*0.9],[cx-6,cy+r*1.4],[cx+6,cy+r*1.4],[cx+5,cy+r*0.9]],cx,cy+r,lean);s.push(stem);});
  s.push(board);H(s,board,RR(R,3,3.6),0);sol.push(board);
  tableS(s,R,ty,wallK(R),sol);return s;});

S('Pomegranate',['Garnets Inside','Split Open','Autumn Jewel','Seeds by the Hundred','Crown and Ruby'],function(R){
  var s=[],sol=[],ty=RR(R,162,168),cx=RR(R,96,116),r=RR(R,42,48),cy=ty-14-r;
  var fr=EP(cx,cy,r,r*0.95);SOL(s,sol,fr);var cr=[[cx-10,cy-r*0.9],[cx-12,cy-r-12],[cx-6,cy-r-6],[cx-3,cy-r-14],[cx,cy-r-6],[cx+3,cy-r-14],[cx+6,cy-r-6],[cx+12,cy-r-12],[cx+10,cy-r*0.9]];SOL(s,sol,cr);
  H(s,arc(cx,cy,r,r*0.95,-PI*0.45,PI*0.5).concat(arc(cx,cy,r*0.5,r*0.95,PI*0.5,-PI*0.45)),1.5,RR(R,60,80));s.push(arc(cx,cy,r*0.6,r*0.8,-PI*0.6,-PI*0.2));
  var hx=cx+r+RR(R,46,56),hy=ty-14-r*0.55,hr=r*0.95;var half=EP(hx,hy,hr,hr*0.62);SOL(s,sol,half);var rind=EP(hx,hy,hr*0.86,hr*0.52);s.push(rind.concat([rind[0]]));
  var ch=[];for(var c=0;c<5;c++){var a=c/5*TAU+R()*0.3;ch.push([[hx,hy],[hx+hr*0.84*Math.cos(a),hy+hr*0.5*Math.sin(a)]]);}A(s,ch);
  var seeds=[];for(var yy=hy-hr*0.46;yy<hy+hr*0.46;yy+=4.2){var w=hr*0.82*Math.sqrt(Math.max(0,1-Math.pow((yy-hy)/(hr*0.5),2)));var row=[];for(var xx=hx-w+3;xx<hx+w-3;xx+=5.2){var o=(Math.round(yy)%2)*2.6;row.push(lens([xx+o-1.8,yy],[xx+o+1.8,yy],2.6));}seeds.push(row);}
  var sp=[],d=1;seeds.forEach(function(row){if(d<0)row.reverse();row.forEach(function(L){A(sp,d<0?L.slice().reverse():L);});d=-d;});s.push(sp);
  var plate=EP(150,ty-6,RR(R,124,130),12);SOL(s,sol,plate);s.push(EP(150,ty-7,100,8).concat([[250,ty-7]]));
  var kx=RR(R,240,262);s.push([[kx-30,ty-18],[kx+28,ty-30]]);var kb=lens([kx+28,ty-30],[kx+48,ty-34],5);SOL(s,sol,kb);H(s,kb,1,0);
  var seeds2=[];for(var q=0;q<RI(R,3,6);q++){var sx=RR(R,60,240),sy=ty-8+RR(R,-2,3);seeds2.push(lens([sx-1.8,sy],[sx+1.8,sy],2.6));}A(s,seeds2);
  tableS(s,R,ty,wallK(R),sol);return s;});

S('Cheese wedge and knife',['Holes and Rind','Afternoon Board','Cut From the Wheel','Alpine Wedge','With a Pear'],function(R){
  var s=[],sol=[],ty=RR(R,162,168),bx=RR(R,60,80),bw=RR(R,140,150),h=RR(R,58,64),dep=RR(R,30,36);
  var front=[[bx,ty-14],[bx+bw,ty-14],[bx+bw,ty-14-h*0.25],[bx,ty-14-h]];var top=[[bx,ty-14-h],[bx+bw,ty-14-h*0.25],[bx+bw+dep,ty-14-h*0.25-dep*0.5],[bx+dep,ty-14-h-dep*0.5]];
  var side=[[bx+bw,ty-14],[bx+bw+dep,ty-14-dep*0.5],[bx+bw+dep,ty-14-h*0.25-dep*0.5],[bx+bw,ty-14-h*0.25]];
  SOL(s,sol,front);SOL(s,sol,top);SOL(s,sol,side);H(s,side,1.3,90);var rind=[[bx,ty-14],[bx+bw,ty-14],[bx+bw,ty-18],[bx,ty-18]];H(s,rind,1,0);
  var holes=[];for(var k=0;k<RI(R,7,10);k++){var t=RR(R,0.05,0.9),x=bx+t*bw,ytop=ty-14-h+(h*0.75)*t,y=RR(R,ytop+6,ty-22),rr=RR(R,3,7);if(y>ty-22)continue;var e=EP(x,y,rr,rr*0.8);s.push(poly(e));holes.push(e);H(s,arc(x,y,rr,rr*0.8,PI*1.1,PI*1.9).concat(arc(x,y-rr*0.3,rr*0.8,rr*0.4,PI*1.9,PI*1.1)),0.9,0);}
  for(var k2=0;k2<RI(R,3,5);k2++){var tx=RR(R,0.15,0.8),xx=bx+tx*bw+dep*0.4,yy=ty-14-h+(h*0.75)*tx-dep*0.25;s.push(EP(xx,yy,RR(R,3,5),1.6).concat([[xx+3,yy]]));}
  var kx=bx+bw+dep+RR(R,10,20);var blade=[[kx-60,ty-16],[kx-4,ty-22],[kx,ty-16]];SOL(s,sol,blade);for(var p=0;p<3;p++)s.push(circle(kx-44+p*12,ty-18,1.6));var hd=RP(kx,ty-16,kx+36,ty-22);SOL(s,sol,hd);H(s,hd,1.4,0);
  var pr=RR(R,30,40);var pear=blob([[pr-12,ty-14],[pr-14,ty-34],[pr-6,ty-50],[pr,ty-60],[pr+6,ty-50],[pr+14,ty-34],[pr+12,ty-14]],6);if(bx>60){SOL(s,sol,pear);H(s,pear.slice(0,Math.floor(pear.length/2)),1.6,60);s.push([[pr,ty-60],[pr+2,ty-68]]);}
  var board=[[20,ty],[30,ty-12],[270,ty-12],[280,ty]];s.push(board);H(s,board,RR(R,3.2,3.8),0);sol.push(board);
  tableS(s,R,ty,wallK(R),sol);return s;});

S('Gumball machine',['A Penny a Turn','Glass Globe, Full','Corner Store Treat','Twist the Handle','Hundred Colors'],function(R){
  var s=[],sol=[],fy=RR(R,180,186),cx=RR(R,140,160),gr=RR(R,46,52),gy0=fy-RR(R,120,128);
  var globe=EP(cx,gy0,gr,gr);SOL(s,sol,globe);var balls=[];for(var y=gy0+gr-8;y>gy0-gr*0.55;y-=8){var w=Math.sqrt(Math.max(0,gr*gr-Math.pow(y-gy0,2)))-4;if(w<8)continue;balls.push(scallopRows(cx-w,cx+w,y,y,8,7.2));}
  var bb=[];balls.forEach(function(b,i){A(bb,i%2?b.slice().reverse():b);});clipIn(s,[bb],globe,[]);
  s.push(arc(cx,gy0,gr*0.8,gr*0.8,PI*1.15,PI*1.45));s.push(arc(cx,gy0,gr*0.7,gr*0.7,PI*1.2,PI*1.38));
  var cap=[[cx-gr*0.5,gy0-gr*0.86],[cx-gr*0.45,gy0-gr*1.1],[cx+gr*0.45,gy0-gr*1.1],[cx+gr*0.5,gy0-gr*0.86]];SOL(s,sol,cap);H(s,cap,1.4,90);var kn=EP(cx,gy0-gr*1.1-5,6,5);SOL(s,sol,kn);
  var base=[[cx-gr*0.6,gy0+gr*0.9],[cx-gr*0.75,gy0+gr+44],[cx+gr*0.75,gy0+gr+44],[cx+gr*0.6,gy0+gr*0.9]];SOL(s,sol,base);H(s,[[cx+gr*0.2,gy0+gr*0.9],[cx+gr*0.6,gy0+gr*0.9],[cx+gr*0.75,gy0+gr+44],[cx+gr*0.25,gy0+gr+44]],1.5,90);
  var plate=RP(cx-14,gy0+gr+6,cx+14,gy0+gr+26);SOL(s,sol,plate);s.push(EP(cx,gy0+gr+16,7,7).concat([[cx+7,gy0+gr+16]]));s.push([[cx-6,gy0+gr+16],[cx+6,gy0+gr+16]]);s.push(rect(cx+8,gy0+gr+9,cx+10,gy0+gr+14));
  var chute=[[cx-10,gy0+gr+30],[cx-10,gy0+gr+40],[cx+10,gy0+gr+40],[cx+10,gy0+gr+30]];s.push(chute);s.push(arc(cx,gy0+gr+30,10,4,PI,TAU));
  var ped=[[cx-6,gy0+gr+44],[cx-6,fy-6],[cx+6,fy-6],[cx+6,gy0+gr+44]];SOL(s,sol,ped);H(s,ped,1.3,90);var ft=EP(cx,fy-3,30,5);SOL(s,sol,ft);
  floorS(s,R,fy,RI(R,10,14));var bg=[],W=RP(4,4,296,fy);var g=RR(R,8,10),a=RR(R,35,55);HX(bg,[W],g,a);HX(bg,[W],g,-a);behind(s,bg,sol);return s;});

S('Wooden block tower',['Taller Than Yesterday','One More Block','The Wobble','Nursery Skyline','Before It Falls'],function(R){
  var s=[],sol=[],fy=RR(R,174,180),sz=RR(R,26,30),d=sz*0.45;
  function block(x,y,mark){var F=RP(x,y,x+sz,y-sz),T=[[x,y-sz],[x+d,y-sz-d*0.6],[x+sz+d,y-sz-d*0.6],[x+sz,y-sz]],Sd=[[x+sz,y],[x+sz+d,y-d*0.6],[x+sz+d,y-sz-d*0.6],[x+sz,y-sz]];
    SOL(s,sol,F);SOL(s,sol,T);SOL(s,sol,Sd);H(s,Sd,1.5,90);s.push(rect(x+3,y-3,x+sz-3,y-sz+3));var cx=x+sz/2,cy=y-sz/2;
    if(mark===0)s.push(circle(cx,cy,sz*0.25));else if(mark===1)s.push(poly([[cx,cy-sz*0.28],[cx+sz*0.26,cy+sz*0.2],[cx-sz*0.26,cy+sz*0.2]]));else if(mark===2){var st=[];for(var i=0;i<=10;i++){var a=-PI/2+i*PI/5,r=i%2?sz*0.12:sz*0.3;st.push([cx+r*Math.cos(a),cy+r*Math.sin(a)]);}s.push(st);}else{var hh=EP(cx,cy,sz*0.22,sz*0.22);s.push(poly(hh));H(s,hh,1.2,0);}}
  var x0=RR(R,70,90),n=RI(R,4,5),y=fy;for(var i=0;i<n;i++){var xx=x0+RR(R,-3,3)+(i===n-1?RR(R,-6,6):0);block(xx,y,RI(R,0,3));y-=sz;}
  var x1=x0+sz+d+RR(R,14,22);block(x1,fy,RI(R,0,3));block(x1+sz+d+4,fy,RI(R,0,3));block(x1+(sz+d+4)/2,fy-sz,RI(R,0,3));
  var tx=RR(R,226,250);var tp=[[tx,fy],[tx+sz*1.1,fy-6],[tx+sz*0.9,fy-6-sz],[tx-sz*0.2,fy-sz]];SOL(s,sol,tp);H(s,tp,1.6,20);s.push(circle(tx+sz*0.45,fy-sz*0.5-3,sz*0.2));
  var ball=EP(40,fy-18,18,18);SOL(s,sol,ball);s.push(arc(40,fy-18,18,8,0,PI));s.push(arc(40,fy-18,8,18,-PI/2,PI/2));H(s,arc(40,fy-18,18,18,-PI/2,PI/2).concat(arc(40,fy-18,8,18,PI/2,-PI/2)),1.6,30);
  floorS(s,R,fy,RI(R,10,14));var bg=[],W=RP(4,4,296,fy-40);HX(bg,[W],RR(R,6,7),90);bg.push([[4,fy-40],[296,fy-40]]);bg.push([[4,fy-46],[296,fy-46]]);H(bg,RP(4,fy-40,296,fy),2.8,0);behind(s,bg,sol);return s;});

S('Hall coat rack',['Hats Come Home','Wet Umbrella','The Front Hall','Scarf on the Hook','Bentwood Stand'],function(R){
  var s=[],sol=[],fy=RR(R,180,186),cx=RR(R,120,150),top=RR(R,24,32);
  var pole=tube([[cx,fy-8],[cx,top]],function(t){return 3.2-t*0.8;});SOL(s,sol,pole.P);H(s,pole.P,1.3,90);var fin=EP(cx,top-4,5,6);SOL(s,sol,fin);
  for(var l=0;l<4;l++){var a=-PI/2+(l-1.5)*0.9,lx=cx+40*Math.cos(a+PI/2)*0.0;var dir=l%2?1:-1,ln=[[cx,fy-10],[cx+dir*(30+l*4),fy+2]];s.push(curve([[cx,fy-30],[cx+dir*20,fy-14],[cx+dir*(34-l*3),fy]],6));}
  for(var h=0;h<4;h++){var dir2=h%2?1:-1,hy=top+14+Math.floor(h/2)*12;s.push(curve([[cx,hy],[cx+dir2*14,hy-2],[cx+dir2*20,hy+6],[cx+dir2*16,hy+10]],5));}
  var hat=[[cx-26,top+24],[cx-20,top+10],[cx-18,top-4],[cx+4,top-4],[cx+6,top+10],[cx+12,top+24]];var hb=[[cx-34,top+26],[cx+20,top+24]];s.push(hb);SOL(s,sol,hat);H(s,[[cx-20,top+10],[cx+6,top+10],[cx+7,top+16],[cx-21,top+16]],1.2,0);
  var sc=tube(curve([[cx+16,top+38],[cx+22,top+70],[cx+18,top+110],[cx+24,top+130]],6),function(t){return 6;});SOL(s,sol,sc.P);H(s,sc.P,RR(R,2.4,3),RR(R,-20,20));s.push(comb(sc.L[sc.L.length-1][0]-2,sc.R[0][0]+2,top+136,-6,2.4));
  var coat=blob([[cx-16,top+36],[cx-40,top+50],[cx-46,top+120],[cx-36,top+140],[cx-14,top+136],[cx-6,top+60]],6);SOL(s,sol,coat);s.push(curve([[cx-16,top+40],[cx-26,top+70],[cx-28,top+130]],5));H(s,coat.slice(0,Math.floor(coat.length*0.5)),1.8,70);
  var ux=cx+RR(R,50,70),ust=[[ux-14,fy],[ux-16,fy-40],[ux+16,fy-40],[ux+14,fy]];SOL(s,sol,ust);H(s,ust,2,90);var um=[[ux+4,fy-40],[ux+10,fy-110]];s.push(um);s.push(arc(ux+12,fy-112,3,3,PI,TAU));var uc=[[ux+6,fy-48],[ux+2,fy-90],[ux+10,fy-104],[ux+16,fy-90],[ux+14,fy-48]];SOL(s,sol,uc);H(s,uc,1.6,80);
  var br=[[ux-8,fy-40],[ux-24,fy-90],[ux-20,fy-92],[ux-4,fy-40]];SOL(s,sol,br);
  var mx=RR(R,210,240);if(mx<ux+30)mx=ux+40;if(mx<270){var mir=EP(mx,70,22,30);SOL(s,sol,mir);s.push(EP(mx,70,18,26).concat([[mx+18,70]]));H(s,[[mx-12,52],[mx,48],[mx-14,80]],1.6,45);}
  floorS(s,R,fy,RI(R,10,14));var bg=[],W=RP(4,4,296,fy-46);HX(bg,[W],RR(R,6,7.5),90);bg.push([[4,fy-46],[296,fy-46]]);bg.push(zz(4,296,fy-46,fy,RR(R,8,10)));behind(s,bg,sol);return s;});

// ---- Daily Super Sketch: a close-up that fills the screen, no horizon ----
function beeS(s,sol,x,y,ang,sz,queen){function T(P){return P.map(function(p){var c=Math.cos(ang),sn=Math.sin(ang);return [x+(p[0]*c-p[1]*sn)*sz,y+(p[0]*sn+p[1]*c)*sz];});}
  var arx=queen?11:7,ab=T(EP(-4-arx,0,arx,4.4));SOL(s,sol,ab);var th=T(EP(1.5,0,3.4,3.2));SOL(s,sol,th);var hd=T(EP(6.6,0,2.4,2.6));SOL(s,sol,hd);
  var bands=[];for(var b=0;b<(queen?4:3);b++){var bx=-5-b*(arx*1.5/(queen?4:3));var hb=queen?3.6:2.6;s.push(T(zz(bx-1.8,bx,-hb,hb,0.55)));}
  var w1=T(lens([1,-2],[-9,-10],4.5)),w2=T(lens([1,2],[-9,10],4.5));SOL(s,sol,w1);SOL(s,sol,w2);
  s.push(T([[4,-8],[1.5,-1],[0,-8.5],[1.5,-1],[-3,-7],[1.5,-1],[1.5,1],[-3,7],[1.5,1],[0,8.5],[1.5,1],[4,8]]));s.push(T([[11,-4],[8.4,-0.6],[8.4,0.6],[11,4]]));}
var MASTER={name:'Honeycomb frame with bees',titles:['The Hive Opened','Queen and Court','Capped by September','Six Sides, Ten Thousand','Frame From the Middle'],build:function(R){
  var s=[],sol=[],bgS=[];
  var tb=RR(R,22,26),sw=RR(R,13,15),r=RR(R,9.6,10.4),w=Math.sqrt(3)*r,vs=1.5*r,ox=sw+RR(R,0,w),oy=tb+RR(R,2,r);
  var frame=RP(4,4,296,196);s.push(poly(frame));var top=RP(4,4,296,tb);s.push(poly(top));var ls=RP(4,tb,4+sw,196),rs=RP(296-sw,tb,296,196);s.push(poly(ls));s.push(poly(rs));
  var gr=[];for(var g=0;g<4;g++){var gy=6+g*(tb-6)/4+RR(R,1,3);gr.push(wave(6,294,gy,0.7,RR(R,40,70),R()*6));}A(s,gr);H(s,RP(4,tb-5,296,tb),1.2,0);
  [ls,rs].forEach(function(P,i){H(s,P,RR(R,1.8,2.1),90);});
  var comb=RP(4+sw,tb,296-sw,196);
  // honeycomb rows: zigzag top edge with the cell walls hanging from it, one stroke per row
  var rowsH=[],nr=Math.ceil((196-oy)/vs)+1;
  for(var j=0;j<=nr;j++){var cy=oy+j*vs,xo=ox+(j%2)*w/2-w,p=[];for(var k=0;xo+k*w/2<300;k++){var x=xo+k*w/2;var up=(k%2===0);var y=up?cy-r/2:cy-r;if(k%2===1){p.push([x,y]);}else{p.push([x,y]);p.push([x,cy+r/2]);p.push([x,y]);}}rowsH.push(p);}
  // capped honey across the top corner, and capped brood lower down
  var hy=[];for(var x=4+sw;x<=296-sw+0.1;x+=24)hy.push([x,tb+RR(R,24,32)+10*Math.sin(x/70+R())]);var honey=[[4+sw,tb]].concat(curve(hy,6)).concat([[296-sw,tb]]);
  var bc=R()<0.5?[RR(R,60,76),RR(R,166,174)]:[RR(R,224,240),RR(R,166,174)],brood=blob([[bc[0]-60,bc[1]+6],[bc[0]-44,bc[1]-22],[bc[0]-6,bc[1]-30],[bc[0]+40,bc[1]-22],[bc[0]+58,bc[1]+4],[bc[0]+40,bc[1]+40],[bc[0]-30,bc[1]+40]],6);
  // the queen with her court, and some foragers
  var qx=RR(R,120,180),qy=RR(R,108,124),qa=RR(R,-0.6,0.6)+(R()<0.5?PI:0),bees=[[qx,qy,qa,2.0,true]];
  var nc=4;for(var c=0;c<nc;c++){var a=c/nc*TAU+R()*0.3,d=RR(R,32,36),bx=qx+d*Math.cos(a)*1.35,by=qy+d*Math.sin(a)*0.8;bees.push([bx,by,Math.atan2(qy-by,qx-bx)+RR(R,-0.25,0.25),RR(R,1.45,1.6),false]);}
  var spots=bc[0]<150?[[RR(R,236,266),RR(R,150,170)],[RR(R,40,64),RR(R,92,108)],[RR(R,236,266),RR(R,92,108)],[RR(R,180,210),RR(R,168,180)]]:[[RR(R,34,64),RR(R,150,170)],[RR(R,40,64),RR(R,92,108)],[RR(R,236,266),RR(R,92,108)],[RR(R,90,120),RR(R,168,180)]];
  spots.forEach(function(p){bees.push([p[0],p[1],R()*TAU,RR(R,1.3,1.55),false]);});
  var beeSol=[];bees.forEach(function(b){var bs=[];beeS(bs,beeSol,b[0],b[1],b[2],b[3],b[4]);A(s,bs);});
  A(sol,beeSol);
  clipIn(s,rowsH,comb,beeSol);
  var hh=[];HX(hh,[honey],RR(R,2.1,2.3),0);clipIn(s,hh,comb,beeSol);s.push(curve(hy,6));
  var bh=[];HX(bh,[brood],RR(R,2.8,3.1),RR(R,30,50));clipIn(s,bh,comb,beeSol);
  // pollen in a few open cells, and a drip of honey
  for(var q=0;q<RI(R,7,9);q++){var j2=RI(R,4,nr-2),k2=RI(R,1,15),cx=ox+(j2%2)*w/2+k2*w-w/2,cy2=oy+j2*vs;if(cx<sw+10||cx>286-sw)continue;if(beeSol.some(function(P){return pip([cx,cy2],P);})||pip([cx,cy2],honey))continue;s.push(spiral(cx,cy2,0.6,r*0.55,1.6,R()*6));}
  var dx=RR(R,60,240),dy=interpY(curve(hy,6),dx);s.push([[dx-2,dy],[dx-1.5,dy+14],[dx,dy+18],[dx+1.5,dy+14],[dx+2,dy]]);
  return s;}};

return {number:6,startedOn:"2026-11-16",notes:"Batch 6 (Nov 16). Review of Nov 14-15 plays: structures with clear silhouettes led again - stave church, drawbridge, signal box, Greek temple, telephone booth, bandstand, tea house, stork on a chimney; kitchen scale and dandelion clock also read well. Weak: pincushion, croissant basket, hermit crab, sea otter, mantis and hippo stayed muddled; small still lifes on a big empty wall looked thin, and when the subject is small the skyFill stripes take over the picture. Lessons kept: one line, keep extras touching; clip backgrounds with behind()/clipIn(); finish with skyFill and pass solids; fill the frame with the subject; animals need a careful silhouette (tube() spine + width profile helps); one-stroke zigzags (zz) beat many short hatch strokes for planner speed; never name a local variable after a helper (rows). New this batch: hedge maze from above, banyan, fjord, bow-top caravan, crocodile, pangolin scales, timpani, gumball machine. Daily Super Sketch: Honeycomb frame with bees, a close-up filling the screen with no horizon (type 2); previous two were Clockmaker's workshop (interior, type 1) and railway viaduct (townscape, type 5).",master:(typeof MASTER!=="undefined"?MASTER:undefined),subjects:SUBJ};
})();
