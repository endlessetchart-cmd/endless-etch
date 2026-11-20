// Endless Etch — batch 10. 48 subjects for 2026-11-20 (each plays about three times, shuffled per round) plus the Daily Super Sketch.
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

// ---- chunk A: places, landscapes, plants ----
S('Moon bridge over a pond',['Full Circle at Dusk','Arch and Its Echo','Still Water Crossing','The Round Reflection','Garden of the Moon'],function(R){
  var s=[],sol=[],bg=[],wy=RR(R,124,130),cx=RR(R,138,162),r=RR(R,48,54),t=RR(R,7,9),q=r+t;
  var body=arc(cx,wy,q,q,PI,TAU).concat(arc(cx,wy,r,r,TAU,PI));FS(s,sol,body);
  var st=[];for(var a=PI+0.12;a<TAU-0.05;a+=RR(R,0.15,0.2))st.push([[cx+r*Math.cos(a),wy+r*Math.sin(a)],[cx+q*Math.cos(a),wy+q*Math.sin(a)]]);A(s,st);
  var rl=q+RR(R,8,10),rail=arc(cx,wy,rl,rl,PI+0.08,TAU-0.08);s.push(rail);for(var a2=PI+0.08;a2<TAU-0.05;a2+=0.2)s.push([[cx+q*Math.cos(a2),wy+q*Math.sin(a2)],[cx+rl*Math.cos(a2),wy+rl*Math.sin(a2)]]);
  var lb=[[4,wy],[cx-q-RR(R,14,22),wy]],rb=[[cx+q+RR(R,14,22),wy],[296,wy]];
  // banks with rocks and a willow
  var bankL=[[4,wy-RR(R,10,16)],[lb[1][0]-10,wy-RR(R,6,10)],[lb[1][0],wy],[4,wy]],bankR=[[rb[0][0],wy],[rb[0][0]+10,wy-RR(R,6,10)],[296,wy-RR(R,10,16)],[296,wy]];
  FS(s,sol,bankL,RR(R,2.4,3),40);FS(s,sol,bankR,RR(R,2.4,3),-40);s.push([[lb[1][0],wy],[cx-q,wy]]);s.push([[cx+q,wy],[rb[0][0],wy]]);
  var wx=R()<0.5?RR(R,22,40):RR(R,260,278),wb=wy-12,tr=[[wx-3,wb],[wx-1,wb-50],[wx+2,wb-50],[wx+4,wb]];FS(s,sol,tr,1.2,80);
  var cr=[];for(var k=0;k<11;k++){var sx=wx-30+k*6,sy=wb-58+Math.abs(k-5)*2,L=RR(R,40,52);cr.push([[sx,sy],[sx+RR(R,-3,3),sy+L]]);}var crP=EP(wx,wb-62,34,14);FS(s,sol,crP,2.2,20);A(s,cr);
  rocks(s,sol,R,lb[1][0]-30,lb[1][0]-2,wy,10,2);rocks(s,sol,R,rb[0][0]+2,rb[0][0]+30,wy,10,2);
  // reflection: inverted ring broken into short bands
  var refl=arc(cx,wy,q,q,0,PI).concat(arc(cx,wy,r,r,PI,0));s.push([[cx+q,wy]].concat(arc(cx,wy,q,q,0,PI)));s.push(arc(cx,wy,r,r,0,PI));
  var rr=[];H(rr,refl,RR(R,3,3.6),0);A(s,rr);
  var water=RP(4,wy,296,196),w=[];A(w,[waterS(R,4,296,wy+5,195,RR(R,5,6),1)]);clipIn(s,w,water,[refl]);
  hills(bg,R,wy-RR(R,14,20),RR(R,20,30),5);return fin(s,R,bg,sol,wy-4);});

S('Stilted granary',['Raised Against the Rats','Grain on Stone Feet','Barley Store','Harvest Kept Dry','Granary on Mushrooms'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,168,174),cx=RR(R,130,170),w=RR(R,44,52),bh=RR(R,44,52),sh=RR(R,22,26),by=gy-sh;
  var n=RI(R,3,4);for(var i=0;i<n;i++){var x=cx-w+6+i*(2*w-12)/(n-1);var leg=RP(x-3,by+6,x+3,gy);FS(s,sol,leg,1.2,90);var cap=[[x-9,by+6]].concat(arc(x,by+6,9,6,PI,TAU).slice(1));FS(s,sol,cap,1.5,0);}
  var box=RP(cx-w,by-bh,cx+w,by);FS(s,sol,box);var pl=zz(cx-w+4,cx+w-4,by-bh,by,RR(R,4,5));clipIn(s,[pl],box);
  var rf=[[cx-w-8,by-bh],[cx-w*0.4,by-bh-RR(R,30,36)],[cx+w*0.4,by-bh-RR(R,30,36)],[cx+w+8,by-bh]];rf[2][1]=rf[1][1];FS(s,sol,rf);
  clipIn(s,[scallopRows(cx-w-10,cx+w+10,rf[1][1]+4,by-bh,6,4.4)],rf);s.push([[rf[1][0],rf[1][1]],[rf[2][0],rf[2][1]]]);
  var dx=cx+RR(R,-14,6),door=RP(dx,by-30,dx+16,by);FS(s,sol,door,1.4,0);s.push([[dx+13,by-16],[dx+13,by-14]]);
  var lx=dx+8,lad=[[lx-4,by],[lx-14,gy]],lad2=[[lx+6,by],[lx-4,gy]];s.push(lad);s.push(lad2);for(var u=1;u<5;u++){var tt=u/5;s.push([lerp(lad[0],lad[1],tt),lerp(lad2[0],lad2[1],tt)]);}
  H(s,RP(cx+w-12,by-bh,cx+w,by),1.3,90);
  // sacks and a cart wheel beside
  var sx=cx+w+RR(R,14,24);[0,1].forEach(function(j){var P=blob([[sx+j*16-7,gy],[sx+j*16-8,gy-12],[sx+j*16-3,gy-17],[sx+j*16+4,gy-15],[sx+j*16+7,gy]],5);FS(s,sol,P,1.6,60);});
  var tx=R()<0.5?RR(R,24,40):RR(R,262,280);var tr=[];treeR(tr,R,tx,gy,RR(R,16,20),2.4);A(s,tr);
  s.push(tufts(8,cx-w-12,gy,5,R));hills(bg,R,gy-6,RR(R,22,30),4.6);gnd(bg,R,gy);return fin(s,R,bg,sol,gy-4);});

S('Kasbah tower',['Mud Walls, Blue Sky','Gate of the Valley','Four Corners of Clay','Afternoon on the Ramparts','Palms Below the Tower'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,170,176),cx=RR(R,134,166),w0=RR(R,34,40),w1=w0-RR(R,6,9),h=RR(R,108,120),top=gy-h;
  var tw=[[cx-w0,gy],[cx-w1,top],[cx+w1,top],[cx+w0,gy]];FS(s,sol,tw);
  [-1,1].forEach(function(d){var x=cx+d*w1,P=[[x-d*0,top],[x,top-14],[x-d*10,top-14],[x-d*10,top]];var tp=[[x,top+2],[x+d*3,top-16],[x-d*12,top-16],[x-d*12,top+2]];FS(s,sol,tp);s.push(merlons(Math.min(x,x-d*12),Math.max(x,x-d*12),top-16,4,4));});
  s.push(merlons(cx-w1+12,cx+w1-12,top,5,5));
  // pattern bands of triangles near the top
  for(var b=0;b<2;b++){var yb=top+14+b*14,ww=w1+(w0-w1)*(14+b*14)/h,p=[[cx-ww,yb]];for(var x=cx-ww;x<cx+ww-5;x+=6)p.push([x+3,yb-6],[x+6,yb]);s.push(p);s.push([[cx-ww,yb+2],[cx+ww,yb+2]]);}
  for(var r=0;r<3;r++){var yy=top+48+r*20,ww2=w1+(w0-w1)*(yy-top)/h;[-0.45,0,0.45].forEach(function(f){var x=cx+f*ww2;var win2=archP(x,yy+10,3,6);FS(s,sol,win2,1,0);});}
  var dr=archP(cx,gy,10,22);FS(s,sol,dr,1.3,90);H(s,[[cx+w1*0.5,top],[cx+w1,top],[cx+w0,gy],[cx+w0*0.5,gy]],RR(R,2,2.6),90);
  // lower walls with towers at the ends
  [-1,1].forEach(function(d){var x0=cx+d*w0,x1=d<0?RR(R,30,50):RR(R,250,270),wh=RR(R,34,42);var P=[[x0,gy],[x0,gy-wh],[x1,gy-wh],[x1,gy]];FS(s,sol,P);s.push(merlons(Math.min(x0,x1),Math.max(x0,x1),gy-wh,3,5));
    var tx=x1,tP=[[tx-d*0,gy],[tx-d*0,gy-wh-18],[tx+d*14,gy-wh-18],[tx+d*16,gy]];FS(s,sol,tP,2.2,90);
    for(var k=0;k<3;k++){var wx=Math.min(x0,x1)+(Math.abs(x1-x0))*(0.25+k*0.25);var sl=RP(wx-1.5,gy-wh+10,wx+1.5,gy-wh+18);FS(s,sol,sl,0.8,0);}});
  // palms in front
  var px=R()<0.5?RR(R,60,90):RR(R,210,240),ph=RR(R,70,86);var trunk=curve([[px,gy],[px+4,gy-ph*0.5],[px+2,gy-ph]],6);s.push(trunk);s.push(translate(trunk,4,0));
  for(var i=2;i<trunk.length;i+=3)s.push([trunk[i],[trunk[i][0]+4,trunk[i][1]-1.5]]);var tp2=trunk[trunk.length-1];
  for(var f=0;f<7;f++){var an=PI+f*PI/6+RR(R,-0.1,0.1),L=RR(R,26,34),e=[tp2[0]+L*Math.cos(an),tp2[1]+L*Math.sin(an)*0.6+10];s.push(spikes(quad(tp2,[tp2[0]+L*0.6*Math.cos(an),tp2[1]-12],e,12),1,4,1));}
  gnd(bg,R,gy,RR(R,4.6,5.6));return fin(s,R,bg,sol,gy);});

S('Beach boardwalk',['Over the Dunes','Last Steps to the Sea','Planks and Marram','Summer Path','Walk to the Water'],function(R){
  var s=[],sol=[],bg=[],hz=RR(R,92,100),vx=RR(R,130,170),bL=RR(R,100,118),bR=RR(R,182,200),ex=RR(R,-6,6);
  var path=[[bL,196],[vx-6+ex,hz+16],[vx+6+ex,hz+16],[bR,196]];FS(s,sol,path);
  var pl=[],d=1;for(var t=0;t<1;t+=0.0){var y=hz+16+(196-hz-16)*t,xl=interpYx(path[1],path[0],y),xr=interpYx(path[2],path[3],y);if(d>0)pl.push([xl,y],[xr,y]);else pl.push([xr,y],[xl,y]);d=-d;t+=0.012+t*0.05;}s.push(pl);
  function interpYx(a,b,y){return a[0]+(b[0]-a[0])*(y-a[1])/(b[1]-a[1]);}
  // posts and rope rails along both sides
  [[path[1],path[0],-1],[path[2],path[3],1]].forEach(function(e){var pts=[];for(var t=0;t<=1.001;t+=0.12){var y=e[0][1]+(e[1][1]-e[0][1])*t*t,x=interpYx(e[0],e[1],y),ph=2+16*t*t;pts.push([x,y,ph]);}
    pts.forEach(function(p){s.push([[p[0],p[1]],[p[0],p[1]-p[2]]]);});var rope=[];for(var i=0;i<pts.length-1;i++){var a=[pts[i][0],pts[i][1]-pts[i][2]],b=[pts[i+1][0],pts[i+1][1]-pts[i+1][2]];A(rope,quad(a,[(a[0]+b[0])/2,(a[1]+b[1])/2+1+pts[i+1][2]*0.15],b,8));}s.push(rope);});
  // dunes either side with marram grass
  var dl=[[4,hz+4]],dr=[];for(var x=4;x<=296;x+=4){var y=hz+6+10*Math.sin(x/37+1)+6*Math.sin(x/13);dl.push([x,y]);}
  var dune=dl.slice(1);s.push(dune);var dP=dune.concat([[296,196],[4,196]]);var dh=[];H(dh,dP,RR(R,3.6,4.4),RR(R,15,30)*sgn(R));behind(s,dh,sol);
  for(var g=0;g<14;g++){var gx=RR(R,8,292);if(gx>bL-14&&gx<bR+14&&R()<0.8)continue;var gy=interpY(dune,gx)+RR(R,6,60);if(gy>192)gy=192;var tf=[[gx-8,gy]];for(var b=0;b<5;b++)tf.push([gx-6+b*3+RR(R,-2,2),gy-RR(R,10,18)],[gx-4+b*3,gy]);var tufP=tf;behind(s,[tufP],sol);}
  // sea at the end of the path
  var sea=[[4,hz],[296,hz]];s.push(sea);var sw=[];A(sw,[waterS(R,4,296,hz+3,hz+20,3,0.6)]);behind(s,sw,[dP.concat([]),path]);
  var bx=RR(R,40,80);s.push([[bx,hz],[bx+8,hz-14],[bx+8,hz],[bx+16,hz]]);s.push([[bx+8,hz-14],[bx+14,hz-2]]);
  return fin(s,R,bg,sol,hz);});

S('Level crossing with gates',['Gates Across the Lane','Waiting for the Down Train','Keeper\'s Crossing','Halt at the Rails','Country Line'],function(R){
  var s=[],sol=[],bg=[],ry=RR(R,140,148),hz=ry-RR(R,22,28),cx=RR(R,140,160),rw=RR(R,30,36);
  // road from the viewer to the horizon
  var road=[[cx-rw*2.2,196],[cx-6,hz],[cx+6,hz],[cx+rw*2.2,196]];var rd=[[road[0],road[1]],[road[2],road[3]]];for(var y=hz+6;y<196;y+=RR(R,6,9)){var t=(y-hz)/(196-hz);rd.push([[cx-1-0.5*t,y],[cx+1+0.5*t,y+3*t]]);}
  // rails across the picture
  var trk=[];[ry,ry+16].forEach(function(y){var T=RP(4,y,296,y+11);trk.push(T);s.push([[4,y+3],[296,y+3]]);s.push([[4,y+8],[296,y+8]]);s.push(zz(6,294,y,y+11,RR(R,6,7)));});sol.push(RP(4,ry,296,ry+27));
  // two gates closed across the road
  [-1,1].forEach(function(d){var px=cx+d*(rw+12),gt=ry-RR(R,30,34),post=RP(px-2.5,gt-6,px+2.5,ry);FS(s,sol,post,1,90);s.push([[px-3,gt-8],[px,gt-12],[px+3,gt-8]]);
    var x1=cx+d*2,gate=[[px,gt],[x1,gt+4],[x1,ry-6],[px,ry-6]];SOL(s,sol,gate);for(var k=1;k<6;k++){var x=px+(x1-px)*k/6;s.push([[x,gt+4*k/6],[x,ry-6]]);}s.push([[px,ry-6],[x1,gt+4]]);
    var disc=circle((px+x1)/2,gt+12,5);s.push(disc);H(s,EP((px+x1)/2,gt+12,5,5),1,45);});
  // keeper's cottage beside the line
  var hx=R()<0.5?RR(R,30,50):RR(R,226,246),hw=RR(R,26,30),hh=RR(R,26,30),hb=ry-4;var hs=RP(hx-hw,hb-hh,hx+hw,hb);FS(s,sol,hs);A(s,[brickS(hx-hw,hb-hh,hx+hw,hb,8,4.5)]);
  var rf=[[hx-hw-5,hb-hh],[hx,hb-hh-20],[hx+hw+5,hb-hh]];FS(s,sol,rf,2.2,0);var ch=RP(hx+hw*0.4,hb-hh-24,hx+hw*0.4+6,hb-hh-10);FS(s,sol,ch,1,90);
  win(s,hx-hw+5,hb-hh+7,10,9,1.4);var dr=RP(hx+4,hb-18,hx+13,hb);FS(s,sol,dr,1.3,0);
  // crossing sign and a signal post
  var sx=cx+(hx<150?1:-1)*(rw+30),sb=ry+34;s.push([[sx,sb],[sx,sb-40]]);s.push([[sx-10,sb-48],[sx+10,sb-32]]);s.push([[sx-10,sb-32],[sx+10,sb-48]]);
  var gx=cx+(hx<150?-1:1)*RR(R,70,90);s.push([[gx,ry-2],[gx,ry-62]]);var arm=RP(gx,ry-60,gx+(hx<150?-1:1)*18,ry-56);FS(s,sol,arm,1,0);s.push(circle(gx,ry-64,2));
  // fields
  behind(s,rd,sol);hills(bg,R,hz,RR(R,16,24),5);var f=[];f.push([[4,hz],[296,hz]]);H(f,[[4,hz],[296,hz],[296,ry-4],[4,ry-4]],RR(R,4,5),RR(R,5,10));gnd(f,R,ry+34);behind(bg,f,[road]);A(bg,[]);return fin(s,R,bg,sol,hz);});

S('Dry stone sheepfold',['Fold on the Fell','Gathered In','Stone Ring, Wool Inside','Shepherd\'s Circle','Evening Count'],function(R){
  var s=[],sol=[],bg=[],cx=RR(R,140,160),cy=RR(R,138,146),rx=RR(R,96,108),ry=RR(R,30,36),wh=RR(R,14,17);
  var ga=PI/2+RR(R,-0.5,0.5),gw=0.18;
  // back wall (top half) and front wall (bottom half), stone courses
  function wallArc(a0,a1){var out=arc(cx,cy,rx,ry,a0,a1),top=out.map(function(p){return [p[0],p[1]-wh];});return {P:out.concat(top.slice().reverse()),out:out,top:top};}
  var back=wallArc(PI+0.02,TAU-0.02);s.push(poly(back.P));var bs=[];for(var c=1;c<3;c++)bs.push(arc(cx,cy-wh*c/3,rx,ry,PI,TAU));A(s,bs);
  var fr1=wallArc(0.02,ga-gw),fr2=wallArc(ga+gw,PI-0.02);[fr1,fr2].forEach(function(W){FS(s,sol,W.P);var st=[];var serpA=[];for(var c=1;c<4;c++){var row=W.out.map(function(p){return [p[0],p[1]-wh*c/4];});serpA.push(row);}s.push(serp(serpA));
    for(var i=2;i<W.out.length-1;i+=RI(R,3,5)){var p=W.out[i],c2=RI(R,0,3);s.push([[p[0],p[1]-wh*c2/4],[p[0],p[1]-wh*(c2+1)/4]]);}s.push(W.top);});
  // sheep inside the fold
  var ns=RI(R,4,6);for(var k=0;k<ns;k++){var sx=cx-rx*0.6+k*rx*1.2/(ns-1)+RR(R,-6,6),sb=cy+RR(R,-14,4);sheep(s,sol,sx,sb,RR(R,7,9),sgn(R));}
  // one sheep at the gate outside
  var gp=[cx+rx*Math.cos(ga),cy+ry*Math.sin(ga)];sheep(s,sol,gp[0]+RR(R,16,24),Math.min(190,gp[1]+18),9,1);
  // fells behind
  var hz=cy-ry-RR(R,10,18);peaks(bg,R,hz,RR(R,38,52),RI(R,2,3),3);var fl=[];fl.push([[4,hz],[296,hz]]);H(fl,RP(4,hz,296,196),RR(R,4.4,5.4),RR(R,8,16)*sgn(R));behind(bg,fl,[poly(EP(cx,cy-wh*0.5,rx+2,ry+wh*0.6))]);
  s.push(tufts(6,80,192,6,R));return fin(s,R,bg,sol,hz);});

S('Pergola with grapevines',['Lunch Under the Leaves','Shade of the Vine','Late Summer Table','Bunches Overhead','Terrace Afternoon'],function(R){
  var s=[],sol=[],fy=RR(R,166,172),x0=RR(R,28,40),x1=RR(R,260,272),bt=RR(R,46,54),dp=RR(R,16,22);
  [x0,x0+(x1-x0)*0.5,x1].forEach(function(x){var P=RP(x-3,bt,x+3,fy);FS(s,sol,P,1.6,90);});
  var beam=RP(x0-12,bt-6,x1+12,bt);FS(s,sol,beam,1.6,0);for(var x=x0-8;x<x1+10;x+=RR(R,14,18)){var j=[[x,bt-6],[x+dp,bt-6-dp*0.7],[x+dp+4,bt-6-dp*0.7],[x+4,bt-6]];FS(s,sol,j);}
  // leaves and grape bunches hanging from the beam
  var nl=RI(R,9,12);for(var i=0;i<nl;i++){var lx=RR(R,x0-6,x1+6),ly=bt+RR(R,-14,10),L=leafStar(lx,ly,RR(R,6,9),R()*PI);FS(s,sol,L,1.4,RR(R,0,90));}
  var nb=RI(R,5,7);for(var b=0;b<nb;b++){var gx=x0+20+b*(x1-x0-40)/(nb-1)+RR(R,-6,6),gt=bt+RR(R,0,6),L2=RR(R,18,26);s.push([[gx,bt],[gx,gt]]);
    var bu=scallop(gx,gt+L2*0.45,7,L2*0.45,8,0.12);bu=bu.map(function(p){return [gx+(p[0]-gx)*(1-0.6*Math.max(0,(p[1]-gt)/L2)),p[1]];});bu.pop();FS(s,sol,bu);HX(s,[bu],1.6,45);HX(s,[bu],1.6,-45);}
  vine(s,[[x0+3,fy-8],[x0-6,fy-40],[x0+6,fy-80],[x0-2,bt]],R);
  // table and chairs
  var tc=RR(R,130,170),tt=fy-RR(R,30,34),tbl=RP(tc-40,tt-3,tc+40,tt);FS(s,sol,tbl,1,0);var cl=[];H(cl,RP(tc-38,tt,tc+38,tt+10),2,90);A(s,cl);
  [tc-34,tc+34].forEach(function(x){s.push([[x,tt],[x,fy]]);});
  s.push(ellipse(tc-12,tt-6,7,2.5));s.push([[tc-12,tt-6],[tc-12,tt-3]]);s.push([[tc+12,tt-3],[tc+11,tt-18],[tc+15,tt-24],[tc+15,tt-30],[tc+19,tt-30],[tc+19,tt-24],[tc+23,tt-18],[tc+22,tt-3]]);
  [-1,1].forEach(function(d){var cx3=tc+d*56,ch=[[cx3-d*8,fy],[cx3-d*8,fy-20],[cx3+d*8,fy-20],[cx3+d*8,fy]];s.push(ch);s.push([[cx3+d*8,fy-20],[cx3+d*10,fy-46]]);s.push([[cx3+d*8,fy-30],[cx3+d*9.4,fy-30]]);s.push([[cx3+d*8.6,fy-38],[cx3+d*9.6,fy-38]]);});
  // terrace tiles and a view of hills
  var f=[];floorS(f,R,fy,RI(R,16,20));behind(s,f,sol);var bg=[];hills(bg,R,fy-4,RR(R,40,60),RR(R,4,5));behind(s,bg,sol);return skyFill(s,fy-4,RR(R,7,8),RR(R,4.4,5.2),5,sol);});

S('Basalt columns',['Steps of the Giants','Hexagons to the Sea','Cooling Lava, Long Ago','Stone Organ Pipes','Causeway at Low Tide'],function(R){
  var s=[],sol=[],bg=[],sy=RR(R,108,116),hx=RR(R,16,18);
  // columns: rows from back (high) to front (low), each column a hex top and a shaded side
  var rows=[];for(var r=0;r<3;r++){var y=sy+18+r*28,cols=[];for(var x=RR(R,10,20)+(r%2)*hx;x<290;x+=hx*2+1){var hgt=RR(R,18,40)+(2-r)*12;cols.push([x,y-hgt*0.3,hgt]);}rows.push(cols);}
  rows.slice().reverse().forEach(function(cols,ri){var r=2-ri;cols.forEach(function(c){if(R()<0.12&&r>0)return;var x=c[0],y=c[1],h=c[2]*0.7+8,w=hx,ht=w*0.42;
    var top=[[x-w,y],[x-w*0.5,y-ht],[x+w*0.5,y-ht],[x+w,y],[x+w*0.5,y+ht],[x-w*0.5,y+ht]];var side=[[x-w,y],[x-w*0.5,y+ht],[x+w*0.5,y+ht],[x+w,y],[x+w,y+h],[x-w,y+h]];
    behind(s,[[[x-w,y],[x-w,y+h],[x+w,y+h],[x+w,y]],[[x-w*0.5,y+ht],[x-w*0.5,y+h]],zz(x+w*0.5,x+w,y+ht*0.5,y+h,1.6)],sol);
    behind(s,[poly(top)],sol);sol.push(top);sol.push(side);});});
  // sea and cliffs beyond
  var cl=[[4,sy]];for(var x=4;x<=120;x+=6)cl.push([x,sy-20-30*Math.sin(x/120*PI*0.9)+RR(R,0,2)]);cl.push([126,sy]);var clP=cl;bg.push(clP);var ch=[];H(ch,clP,2.6,80);A(bg,ch);
  var sea=[];sea.push([[4,sy],[296,sy]]);A(sea,[waterS(R,4,296,sy+4,196,RR(R,4.6,5.4),1)]);behind(bg,sea,[clP]);
  return fin(s,R,bg,sol,sy-2);});

S('Waterspout at sea',['Funnel Over the Swell','The Sea Lifts Up','Squall Line','Spout Off the Point','Grey Column'],function(R){
  var s=[],sol=[],bg=[],sy=RR(R,128,136),fx=RR(R,120,180),cb=RR(R,46,54);
  // cloud base: lumpy dark band across the top
  var cl=[[4,4],[296,4],[296,cb+RR(R,-4,4)]];for(var x=292;x>=4;x-=RR(R,14,22))cl.push([x,cb+RR(R,-6,8)]);cl.push([4,cb]);var cloud=blob(cl.slice(2),5).filter(function(p){return p[0]>=4&&p[0]<=296;});
  var cloudP=[[4,4],[296,4]].concat(cloud.slice().sort(function(a,b){return b[0]-a[0];}));FS(s,sol,cloudP);HX(s,[cloudP],RR(R,1.8,2.2),RR(R,-8,8));
  var bumpsL=[];for(var x2=10;x2<290;x2+=RR(R,26,40))bumpsL.push(arc(x2+12,interpY(cloudP.slice(2).reverse(),x2+12)+2,12,6,0,PI));A(s,bumpsL);
  // funnel
  var top=interpY(cloudP.slice(2).reverse(),fx),bend=RR(R,-20,20),sp=[];for(var i=0;i<=12;i++){var t=i/12;sp.push([fx+bend*Math.sin(t*PI)+t*RR(R,-2,2)+t*14*sgn(R)*0,top+(sy-6-top)*t]);}
  var tb=tube(curve(sp,4),function(u){return 28*Math.pow(1-u,1.6)+2.5;});FS(s,sol,tb.P);H(s,tb.R.concat(curve(sp,4).slice().reverse()),1.2,80);var sw2=[];for(var j2=3;j2<tb.L.length-3;j2+=3)sw2.push(lerp(tb.L[j2],tb.R[j2],j2%2?0.15:0.6));s.push(sw2);
  var bands=[];for(var j=4;j<tb.L.length-4;j+=5)bands.push([tb.L[j],tb.R[j]]);A(s,bands);
  // spray at the foot
  var foot=sp[sp.length-1],spr=[];for(var k=0;k<=16;k++){var a=PI+k*PI/16,r=k%2?RR(R,8,14):RR(R,3,5);spr.push([foot[0]+r*1.8*Math.cos(a),sy+r*Math.sin(a)]);}FS(s,sol,spr.concat([[foot[0]-29,sy]]));
  // rain curtain at one side
  var rx=fx+(fx<150?1:-1)*RR(R,60,90),rain=[[rx-20,cb],[rx+20,cb],[rx+34,sy],[rx-6,sy]];
  // sea
  s.push([[4,sy],[296,sy]]);var sea=[];A(sea,[waterS(R,4,296,sy+4,196,RR(R,4,5),1.4)]);behind(s,sea,sol);
  var bx=fx+(fx<150?1:-1)*RR(R,50,70),bt=[[bx-14,sy-1],[bx+14,sy-1],[bx+10,sy+4],[bx-10,sy+4]];FS(s,sol,bt,1,0);s.push([[bx,sy-1],[bx,sy-26],[bx+12,sy-4],[bx,sy-4]]);
  return fin(s,R,bg,sol,sy);});

S('Crater lake',['Blue Bowl of the Mountain','Water Where Fire Was','Rim Trail Morning','Island in the Caldera','Silent Caldera'],function(R){
  var s=[],sol=[],bg=[],cx=RR(R,140,160),ly=RR(R,124,132),lrx=RR(R,96,108),lry=RR(R,22,26),rimH=RR(R,26,34);
  var lake=EP(cx,ly,lrx,lry);s.push(poly(lake));
  // far rim (behind the lake): jagged ridge above the lake's far edge
  var far=[[4,ly-lry+6]];for(var x=4;x<=296;x+=8){var e=Math.abs(x-cx)<lrx?ly-lry*Math.sqrt(Math.max(0,1-Math.pow((x-cx)/lrx,2))):ly;far.push([x,e-rimH*(0.6+0.5*Math.sin(x/23+1))-RR(R,0,4)]);}far.shift();
  var farP=far.concat(arc(cx,ly,lrx,lry,0,-PI).reverse().concat([]));s.push(far);
  var ridge=[];var cliffs=[];for(var i=0;i<far.length;i+=1){var p=far[i],b=Math.abs(p[0]-cx)<lrx?ly-lry*Math.sqrt(Math.max(0,1-Math.pow((p[0]-cx)/lrx,2))):ly;if(i%2===0)cliffs.push([p,[p[0]+RR(R,-3,3),b]]);}A(s,cliffs);
  var snow=[];for(var k=0;k<far.length-3;k+=RI(R,3,5)){var p2=far[k];snow.push([p2,[p2[0]+3,p2[1]+7],[p2[0]+6,p2[1]+3]]);}A(s,snow);
  // island cinder cone in the lake
  var ix=cx+RR(R,-40,30),iw=RR(R,22,28),ih=RR(R,16,20),isl=[[ix-iw,ly+2],[ix-iw*0.3,ly-ih],[ix+iw*0.25,ly-ih+1],[ix+iw,ly+2]];FS(s,sol,isl);H(s,[[ix,ly-ih+0.5],[ix+iw*0.25,ly-ih+1],[ix+iw,ly+2],[ix,ly+2]],1.5,70);s.push(ellipse(ix-1,ly-ih+0.5,iw*0.25,1.5));
  for(var t=0;t<4;t++){var tx=ix-iw*0.6+t*iw*0.35;pineT(s,tx,ly+1-ih*(1-Math.abs(tx-ix)/iw)*0.6,0.35,0);}
  var wt=[];A(wt,[waterS(R,4,296,ly-lry+3,ly+lry,RR(R,3.4,4),0.6)]);clipIn(s,wt,lake,[isl]);
  // near rim: slope from the lake edge to the bottom, hatched, with pines
  var near=arc(cx,ly,lrx,lry,0,PI);var nearP=[[296,ly]].concat(near).concat([[4,ly],[4,196],[296,196]]);var nh=[];H(nh,nearP,RR(R,3.6,4.4),RR(R,-20,-30));behind(s,nh,sol);s.push([[4,ly],[cx-lrx,ly]]);s.push([[cx+lrx,ly],[296,ly]]);
  var np=RI(R,4,6);for(var j=0;j<np;j++){var px=RR(R,10,290),pb=RR(R,170,192);var pt=[];pineT(pt,px,pb,RR(R,0.8,1.1),1.6);A(s,pt);FS([],sol,poly([[px-16,pb],[px,pb-70],[px+16,pb]]));}
  // farther peaks
  var farS=far.concat([[296,196],[4,196]]);peaks(bg,R,ly-lry-RR(R,30,40),RR(R,24,34),2,3);return fin(s,R,bg,sol.concat([farS]),ly-lry);});

S('Snowdrifts and a fence',['After the Blizzard','Rails in the Drift','Buried to the Second Rail','White Field, Grey Posts','Wind-Carved Snow'],function(R){
  var s=[],sol=[],bg=[],hz=RR(R,92,100),x0=RR(R,4,20),y0=RR(R,176,186),x1=RR(R,250,290),y1=hz+RR(R,6,10);
  // fence running back toward the horizon
  var n=RI(R,10,12),posts=[];for(var i=0;i<=n;i++){var t=Math.pow(i/n,0.8),x=x0+(x1-x0)*t,y=y0+(y1-y0)*t,h=34*(1-t*0.82);posts.push([x,y,h]);}
  posts.forEach(function(p,i){var w=2.6*(1-i/n*0.7);var P=RP(p[0]-w,p[1]-p[2],p[0]+w,p[1]);FS(s,sol,P,1,90);});
  [0.35,0.7].forEach(function(f){var r=[];posts.forEach(function(p,i){r.push([p[0],p[1]-p[2]*f+(i%2?1:-1)*0.5]);});s.push(r);});
  // drifts: smooth mounds piled against the fence, shaded on the lee side
  var dr=[];posts.forEach(function(p,i){dr.push([p[0]-4,p[1]-p[2]*RR(R,0.15,0.45)]);});var drift=curve([[x0-6,y0+4]].concat(dr).concat([[x1+20,y1+4]]),6);s.push(drift);
  var lee=drift.concat(drift.slice().reverse().map(function(p){return [p[0]+10,p[1]+8];}));var lh=[];H(lh,lee,1.8,-10);behind(s,lh,sol);
  var md=[];for(var k=0;k<3;k++){var mx=RR(R,30,270),my=RR(R,130,190),mw=RR(R,30,50);md.push(quad([mx-mw,my],[mx,my-RR(R,10,18)],[mx+mw,my],12));}A(s,md);md.forEach(function(m){var h2=[];H(h2,m.concat([m[0]]).slice(Math.floor(m.length/2)),1.6,0);A(s,h2);});
  // half-buried pines and a farmhouse on the horizon
  var px=x1<270?RR(R,200,240):RR(R,180,220);[0,1,2].forEach(function(j){var pp=[];pineT(pp,px+j*RR(R,16,22),hz+RR(R,4,8),RR(R,0.9,1.3),2);behind(s,pp,sol);});
  var fx=RR(R,50,100),fh=[[fx-16,hz],[fx-16,hz-12],[fx,hz-22],[fx+16,hz-12],[fx+16,hz]];FS(s,sol,fh);var rf=[[fx-18,hz-11],[fx,hz-23],[fx+18,hz-11]];s.push(rf);win(s,fx-6,hz-9,6,6,0);s.push(RP(fx+8,hz-28,fx+12,hz-17));
  s.push([[4,hz],[296,hz]]);
  // falling snow as short dashes through a light sky (sky fill rows broken)
  return skyFill(s,hz,RR(R,5,6),RR(R,3.4,4),5,sol);});

S('Date palms',['Oasis Noon','Clusters of Amber','Three Palms, One Spring','Shade by the Well','Desert Orchard'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,168,176),np=3;
  for(var i=0;i<np;i++){var bx=RR(R,50,80)+i*RR(R,70,90),h=RR(R,110,140)-i*8,lean=RR(R,-30,30),sp=[[bx,gy],[bx+lean*0.3,gy-h*0.4],[bx+lean*0.7,gy-h*0.75],[bx+lean,gy-h]];
    var c=curve(sp,8),tb=tube(c,function(u){return 5.5-2*u;});FS(s,sol,tb.P);var rings=[];for(var j=2;j<c.length-2;j+=2)rings.push([tb.L[j],[c[j][0],c[j][1]+1.5],tb.R[j]]);A(s,rings);
    var tp=c[c.length-1];for(var f=0;f<9;f++){var an=-PI+f*PI/8+RR(R,-0.12,0.12),L=RR(R,38,50),dropE=Math.abs(Math.cos(an))*L*0.5+8,e=[tp[0]+L*Math.cos(an),tp[1]+L*Math.sin(an)*0.55+dropE];
      var fr=quad(tp,[tp[0]+L*0.55*Math.cos(an),tp[1]+L*0.55*Math.sin(an)-10],e,14);s.push(spikes(fr,1,5,Math.cos(an)>0?1:-1));}
    for(var d=0;d<RI(R,2,3);d++){var dx=tp[0]+RR(R,-8,8),dy=tp[1]+6,dc=raceme(dx,dy,RR(R,14,20),5,R);s.push(dc);}}
  // well and water
  var wx=RR(R,200,250),well=[[wx-14,gy],[wx-14,gy-14],[wx+14,gy-14],[wx+14,gy]];FS(s,sol,well);A(s,[brickS(wx-14,gy-14,wx+14,gy,7,4.5)]);s.push(ellipse(wx,gy-14,14,3));s.push([[wx-12,gy-14],[wx-12,gy-36],[wx+12,gy-36],[wx+12,gy-14]]);s.push([[wx,gy-36],[wx,gy-24]]);s.push(RP(wx-3,gy-24,wx+3,gy-19));
  var pool=EP(RR(R,90,140),gy+12,RR(R,30,40),4);s.push(poly(pool));var pw=[];H(pw,pool,1.6,0);A(s,pw);
  // dunes behind, sand in front
  var dn=[];hills(dn,R,gy-6,RR(R,18,26),0);A(bg,dn);sand(bg,R,gy+2,RR(R,5,6));bg.push([[4,gy],[296,gy]]);behind(bg,[],[]);var b2=[];behind(b2,bg,[pool]);return fin(s,R,b2,sol,gy-4);});

S('Morning glory on a fence',['Trumpets at Sunrise','Climbing the Pickets','Blue Before Noon','Twining Upward','Garden Fence in July'],function(R){
  var s=[],sol=[],fy=RR(R,150,158),ft=RR(R,70,80),pw=RR(R,13,15);
  // picket fence
  var pk=[];for(var x=8;x<292;x+=pw){var P=[[x,fy],[x,ft+6],[x+pw*0.35,ft],[x+pw*0.7,ft+6],[x+pw*0.7,fy]];pk.push(P);}
  // vines first (in front), leaves and flowers
  var nv=RI(R,3,4),flowers=[];for(var v=0;v<nv;v++){var vx=30+v*(240/(nv-1))+RR(R,-10,10),pts=[[vx,fy+6]];for(var k=1;k<6;k++)pts.push([vx+Math.sin(k*1.3+v)*RR(R,12,22),fy-k*RR(R,16,20)]);var vc=vine(s,pts,R);
    for(var l=6;l<vc.length;l+=RI(R,14,18)){var p=vc[l],hl=heartLeaf(p[0]+sgn(R)*7,p[1],RR(R,6,8),RR(R,-0.8,0.8));FS(s,sol,hl,RR(R,1.4,1.8),RR(R,20,70));s.push([p,hl[0]]);}
    for(var f=0;f<RI(R,2,3);f++){var p2=vc[Math.floor(RR(R,0.3,0.95)*vc.length)];flowers.push(p2);}}
  flowers.forEach(function(p){var r=RR(R,8,11),fl=scallop(p[0],p[1],r,r*0.9,5,0.08);fl.pop();FS(s,sol,fl);s.push(circle(p[0],p[1],r*0.3));
    for(var k=0;k<5;k++){var a=k*TAU/5+0.3;s.push([[p[0]+r*0.3*Math.cos(a),p[1]+r*0.3*Math.sin(a)],[p[0]+r*Math.cos(a),p[1]+r*0.9*Math.sin(a)]]);}H(s,fl.slice(0,Math.floor(fl.length/2)).concat([p]),1.6,30);});
  var bud=[];A(s,bud);
  // fence behind vines
  var fc=[];pk.forEach(function(P){fc.push(poly(P));var sh=[];H(sh,[[P[3][0]-3,P[3][1]],[P[4][0],P[3][1]],[P[4][0],fy],[P[4][0]-3,fy]],1.2,90);A(fc,sh);});fc.push([[4,fy-12],[296,fy-12]]);fc.push([[4,ft+18],[296,ft+18]]);behind(s,fc,sol);
  pk.forEach(function(P){sol.push(P);});
  // lawn and a hedge line, sky
  var g=[];g.push([[4,fy],[296,fy]]);A(g,[grass(4,296,fy,6,3,R)]);H(g,RP(4,fy,296,196),RR(R,4,5),RR(R,8,14));behind(s,g,sol);
  var hd=[];var hb=scallop(150,ft+8,150,14,30,0.1).filter(function(p){return p[1]<ft+8;});return skyFill(s,fy-12,RR(R,7,8),RR(R,4.6,5.4),5,sol);});

S('Fig branch with fruit',['Ripe in September','Under the Fig Leaves','Purple and Split','Mediterranean Wall','Three Figs Hanging'],function(R){
  var s=[],sol=[],a0=RR(R,-0.25,0.15),bx0=4,by0=RR(R,40,70),bx1=296,by1=by0+RR(R,10,40);
  var br=curve([[bx0,by0],[90,by0+RR(R,-10,10)],[200,by1-RR(R,0,10)],[bx1,by1]],10),bt=tube(br,function(u){return 5-2*u;});FS(s,sol,bt.P);H(s,bt.R.concat(br.slice().reverse()),1.3,10);
  for(var k=12;k<br.length-6;k+=RI(R,10,14))s.push(arc(br[k][0],br[k][1],2.5,4,-PI/2,PI/2));
  // big lobed leaves
  var nl=RI(R,3,4);for(var i=0;i<nl;i++){var p=br[Math.floor((0.12+i*0.8/nl)*br.length)],up=i%2?-1:1,cx=p[0]+RR(R,-10,10),cy=p[1]+up*RR(R,30,40),r=RR(R,22,28),lb=[];
    var dir=up>0?PI/2:-PI/2;cx=p[0]+RR(R,-6,6);cy=p[1]+up*r*0.95;for(var j=0;j<5;j++){var an=dir+PI+(j-2)*0.62,rr=r*(j===2?1:j%2?0.9:0.7);var bc=[p[0]*0.3+cx*0.7,p[1]*0.3+cy*0.7];an=dir+(j-2)*0.62;lb.push([cx+rr*Math.cos(an),cy+rr*Math.sin(an)]);lb.push([cx+r*0.4*Math.cos(an+0.31),cy+r*0.4*Math.sin(an+0.31)]);}lb.pop();lb.push([cx-r*0.35*Math.cos(dir),cy-r*0.35*Math.sin(dir)]);
    var leaf=blob(lb,5);FS(s,sol,leaf);s.push([p,[cx,cy]]);for(var v=0;v<5;v+=2){s.push([[cx,cy],lb[v*2]]);}H(s,leaf.slice(0,Math.floor(leaf.length/2)).concat([[cx,cy]]),RR(R,1.6,2),RR(R,20,70));}
  // figs hanging from the branch
  var nf=RI(R,3,5);for(var f=0;f<nf;f++){var q=br[Math.floor(RR(R,0.15,0.9)*br.length)],fx=q[0]+RR(R,-6,6),fy=q[1]+RR(R,10,16),fr=RR(R,9,12);
    var fig=[[fx-2,fy-fr*0.9]].concat(cubic([fx-2,fy-fr*0.9],[fx-fr*1.4,fy],[fx-fr*0.9,fy+fr*1.3],[fx,fy+fr*1.3],10).slice(1)).concat(cubic([fx,fy+fr*1.3],[fx+fr*0.9,fy+fr*1.3],[fx+fr*1.4,fy],[fx+2,fy-fr*0.9],10).slice(1));
    FS(s,sol,fig);s.push([q,[fx,fy-fr*0.9]]);HX(s,[fig.slice(0,12).concat([[fx,fy+fr*1.3],[fx,fy-fr*0.9]])],1.2,60);s.push(arc(fx+fr*0.3,fy+fr*0.2,fr*0.35,fr*0.5,-1,0.6));}
  // a halved fig and a plate on a ledge below
  var ly=RR(R,166,174);s.push([[4,ly],[296,ly]]);H(s,RP(4,ly,296,ly+8),2,0);s.push([[4,ly+8],[296,ly+8]]);var px=RR(R,180,240);s.push(ellipse(px,ly-4,30,5));s.push(ellipse(px,ly-4,22,3.4));
  [-1,1].forEach(function(d){var hx=px+d*9,hf=[[hx-8,ly-6]].concat(arc(hx,ly-12,8,8,PI*0.9,PI*0.1+TAU).slice(1)).concat([[hx+8,ly-6]]);FS(s,sol,hf);var inner=EP(hx,ly-12,5,5);s.push(poly(inner));
    for(var k2=0;k2<8;k2++){var a=k2*PI/4;s.push([[hx,ly-12],[hx+4*Math.cos(a),ly-12+4*Math.sin(a)]]);}});
  // plaster wall behind with cracks and light diagonal shading
  var w=[];var g=RR(R,6,7.5);H(w,RP(4,4,296,ly),g,RR(R,30,60));behind(s,w,sol);var below=[];H(below,RP(4,ly+8,296,196),RR(R,4,5),90);A(s,below);return s;});

S('Chestnuts in their husks',['Autumn Burrs','Split Open, Glossy','Under the Chestnut Tree','Prickles and Shine','October Windfall'],function(R){
  var s=[],sol=[],gy=RR(R,150,160);
  var items=[[RR(R,70,100),gy+RR(R,4,14),RR(R,26,32)],[RR(R,170,210),gy+RR(R,10,20),RR(R,28,34)],[RR(R,240,270),gy-RR(R,4,8),RR(R,16,20)]];
  items.forEach(function(it,i){var x=it[0],y=it[1],r=it[2];
    var hk=spiky(x,y,r,r*0.28,RI(R,26,34),R);hk.pop();var husk=EP(x,y,r,r*0.92);SOL(s,sol,husk.map(function(p){return [x+(p[0]-x)*1.2,y+(p[1]-y)*1.2];}));s.push(hk.concat([hk[0]]));
    if(i<2){var open=[[x-r*0.75,y-r*0.1],[x-r*0.2,y-r*0.5],[x+r*0.6,y-r*0.35],[x+r*0.7,y+r*0.25],[x,y+r*0.55],[x-r*0.6,y+r*0.3]];var op=blob(open,6);s.push(poly(op));H(s,op,1.6,RR(R,-30,30));
      var nut=[[x-r*0.45,y+r*0.1],[x-r*0.3,y-r*0.38],[x+r*0.25,y-r*0.42],[x+r*0.48,y],[x+r*0.2,y+r*0.35],[x-r*0.2,y+r*0.32]];var nb=blob(nut,6);s.push(poly(nb));var hl=EP(x-r*0.05,y-r*0.12,r*0.14,r*0.08);
      HX(s,[nb,hl],1,25);s.push(poly(hl));s.push([[x-r*0.2,y+r*0.25],[x+r*0.15,y+r*0.25]]);}else{HX(s,[husk],2,40);}
    var ins=[];var rr=r*0.82;for(var k=0;k<RI(R,10,14);k++){var a=R()*TAU,d=RR(R,0.85,1);ins.push([[x+rr*d*Math.cos(a),y+rr*d*Math.sin(a)],[x+(rr+5)*Math.cos(a+0.1),y+(rr+5)*Math.sin(a+0.1)]]);}A(s,ins);});
  // loose nut and long serrated leaves on the ground
  var lx=RR(R,130,150),ly=gy+RR(R,26,32),ln=blob([[lx-10,ly+6],[lx-8,ly-6],[lx+6,ly-8],[lx+11,ly+4],[lx,ly+8]],6);FS(s,sol,ln,1,30);s.push(ellipse(lx-1,ly+5,6,1.5));
  for(var l=0;l<3;l++){var p0=[RR(R,10,280),RR(R,gy-24,gy+30)],an=RR(R,-0.5,0.5),L=RR(R,60,80),p1=[p0[0]+L*Math.cos(an),p0[1]+L*Math.sin(an)],Lf=lens(p0,p1,RR(R,9,11)),sr=spikes(Lf,2,2.5,-1);if(behindAny(Lf))continue;SOL(s,sol,Lf);s.push(sr);s.push([p0,p1]);
    for(var v=1;v<7;v++){var m=lerp(p0,p1,v/7);s.push([m,[m[0]+6*Math.cos(an-1.1),m[1]+6*Math.sin(an-1.1)]]);s.push([m,[m[0]+6*Math.cos(an+1.1),m[1]+6*Math.sin(an+1.1)]]);}}
  function behindAny(P){return false;}
  // forest floor and a trunk behind
  var tx=RR(R,10,40),tr=RP(tx,4,tx+RR(R,34,44),gy-14);var tb=[];tb.push(poly(tr));tb.push(zz(tx+4,tr[1][0]-3,8,gy-16,RR(R,3,4)));behind(s,tb,sol);
  var fl=[];fl.push([[4,gy-14],[296,gy-14]]);H(fl,RP(4,gy-14,296,196),RR(R,3.4,4),RR(R,10,20));behind(s,fl,sol);var bk=[];H(bk,RP(4,4,296,gy-14),RR(R,6.5,8),0);behind(s,bk,sol.concat([tr]));return s;});

S('Hollow oak',['Old Hollow Heart','Three Hundred Winters','Doorway in the Trunk','Ancient Pasture Oak','Room for an Owl'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,168,176),cx=RR(R,130,170),tw=RR(R,26,32),ty=gy-RR(R,70,80);
  var trunk=[[cx-tw-18,gy],[cx-tw-4,gy-12],[cx-tw,gy-40],[cx-tw*0.7,ty],[cx-tw*1.6,ty-30],[cx-tw*1.2,ty-34],[cx-tw*0.2,ty-12],[cx+tw*0.3,ty-38],[cx+tw*0.7,ty-36],[cx+tw*0.6,ty-8],[cx+tw*1.7,ty-28],[cx+tw*1.9,ty-22],[cx+tw*0.9,ty+6],[cx+tw,gy-36],[cx+tw+6,gy-10],[cx+tw+22,gy]];
  var tb=blob(trunk,4);tb=tb.filter(function(p){return p[1]<=gy;});tb.push([cx+tw+22,gy],[cx-tw-18,gy]);FS(s,sol,tb);
  var hol=blob([[cx-8,gy-4],[cx-12,gy-26],[cx-6,gy-46],[cx+4,gy-48],[cx+11,gy-28],[cx+8,gy-4]],6);s.push(poly(hol));HX(s,[hol],1.1,0);
  var bark=[];for(var x=cx-tw+3;x<cx+tw-2;x+=RR(R,4,6)){if(Math.abs(x-cx)<14)continue;var p=[];for(var y=gy-2;y>ty+4;y-=6)p.push([x+RR(R,-1.5,1.5),y]);bark.push(p);}clipIn(s,[serp(bark)],tb,[hol]);
  H(s,[[cx+tw*0.4,ty+4],[cx+tw,gy-36],[cx+tw+6,gy-10],[cx+tw*0.5,gy-6]],1.5,80);
  // big crown, scalloped, with gaps of light
  var crP=[];var crc=scallop(cx,ty-34,RR(R,118,128),RR(R,40,46),RI(R,14,18),0.1);crc.pop();var cr=crc.filter(function(p){return true;});SOL(s,sol,cr);
  var holes=[];for(var k=0;k<RI(R,3,5);k++){var hx=cx+RR(R,-90,90),hy=ty-34+RR(R,-22,18);holes.push(EP(hx,hy,RR(R,8,14),RR(R,4,7)));}holes.forEach(function(h){s.push(poly(h));});
  HX(s,[cr].concat(holes).concat([tb]),RR(R,2.9,3.3),RR(R,20,50));
  // roots, grass, fence, cows far off
  [-1,1].forEach(function(d){s.push(curve([[cx+d*tw,gy-6],[cx+d*(tw+12),gy-2],[cx+d*(tw+34),gy+3]],5));});
  s.push(tufts(4,296,gy+6,6,R));var fx=cx<150?RR(R,226,250):RR(R,30,60);s.push(comb(fx-30,fx+30,gy-2,12,8));s.push([[fx-30,gy-8],[fx+30,gy-8]]);
  hills(bg,R,gy-4,RR(R,16,24),5);gnd(bg,R,gy);return fin(s,R,bg,sol,gy-4);});

// ---- chunk B: vehicles, animals, birds, insects, sea life ----
function spokeW(s,sol,cx,cy,r,n){var P=EP(cx,cy,r,r);SOL(s,sol,P);s.push(circle(cx,cy,r*0.86));for(var k=0;k<n;k++){var a=k*TAU/n;s.push([[cx+2*Math.cos(a),cy+2*Math.sin(a)],[cx+r*0.86*Math.cos(a),cy+r*0.86*Math.sin(a)]]);}s.push(circle(cx,cy,2.5));return P;}
function cobbles(s,R,y,sol){var c=[];for(var yy=y+5,row=0;yy<196;yy+=RR(R,7,8),row++){var p=[[4,yy]];c.push([[4,yy],[296,yy]]);var xs=[];for(var x=4+(row%2)*7;x<296;x+=RR(R,13,16))xs.push([[x,yy],[x,Math.min(196,yy+5)]]);A(c,xs);}c.push([[4,y],[296,y]]);behind(s,c,sol);return s;}
function facade(s,R,y,sol){var b=[],x=4;while(x<296){var w=RR(R,44,60),h=RR(R,70,100),P=RP(x,y-h,Math.min(296,x+w),y);b.push(poly(P));for(var r=0;r<3;r++)for(var c=0;c<2;c++){var wx=x+8+c*(w/2),wy=y-h+10+r*22;if(wx+8<x+w-2)b.push(rect(wx,wy,wx+8,wy+13));}b.push([[x,y-h+4],[Math.min(296,x+w),y-h+4]]);x+=w;}behind(s,b,sol);return s;}

S('Hansom cab',['Fare Through the Fog','Two Wheels and a Bay','Cabman Up Behind','Night Rank','Clip-Clop on Cobbles'],function(R){
  var s=[],sol=[],gy=RR(R,166,172),wx=RR(R,170,196),wr=RR(R,30,34),cy=gy-wr;
  spokeW(s,sol,wx,cy,wr,14);
  var bx0=wx-30,bx1=wx+18,bt=cy-46,body=[[bx0,cy+6],[bx0-4,cy-14],[bx0,bt],[bx1,bt],[bx1+6,cy-10],[bx1,cy+6]];FS(s,sol,body);H(s,[[bx1-10,bt],[bx1,bt],[bx1+6,cy-10],[bx1,cy+6],[bx1-10,cy+6]],1.5,90);
  var win2=RP(bx0+6,bt+6,bx0+26,cy-14);s.push(poly(win2));H(s,win2,1.6,60);var doors=[[bx0-4,cy-14],[bx0-14,cy-6],[bx0-14,cy+6],[bx0,cy+6]];FS(s,sol,doors,1.6,0);
  var roof=[[bx0-6,bt],[bx0+2,bt-8],[bx1+4,bt-8],[bx1+6,bt]];FS(s,sol,roof,1.4,0);
  // driver's seat up behind, with a figure in a hat
  var sx=bx1+10;s.push([[bx1+4,bt-8],[sx,bt-10],[sx+12,bt-10]]);s.push([[sx+6,bt-10],[sx+6,cy-6]]);var drv=[[sx,bt-10],[sx+2,bt-30],[sx+10,bt-30],[sx+12,bt-10]];FS(s,sol,drv,1.6,70);s.push(circle(sx+6,bt-36,5));var hat=RP(sx+1,bt-50,sx+11,bt-40);FS(s,sol,hat,1,90);s.push([[sx-2,bt-40],[sx+14,bt-40]]);
  s.push([[sx+2,bt-26],[sx-30,bt-48]]);
  // shafts to the horse
  var hx=bx0-RR(R,56,64);s.push([[bx0-14,cy],[hx+26,cy-34]]);s.push([[bx0-12,cy+3],[hx+30,cy-31]]);
  horse(s,sol,hx+6,gy,RR(R,1.12,1.2),-1,2);s.push([[hx-6,gy-40],[hx+26,gy-34]]);s.push(ellipse(hx-16,gy-44,6,9));
  // street lamp and buildings
  var lx=wx+RR(R,46,70);var lp=RP(lx-2,gy-90,lx+2,gy);FS(s,sol,lp,1,90);var lan=[[lx-7,gy-92],[lx-5,gy-106],[lx+5,gy-106],[lx+7,gy-92]];FS(s,sol,lan);s.push([[lx,gy-106],[lx,gy-110]]);
  cobbles(s,R,gy,sol);facade(s,R,gy-6,sol);var fg=[];H(fg,RP(4,4,296,gy-6),RR(R,8.5,9.5),RR(R,-5,5));behind(s,fg,sol.concat([]));return s;});

S('Houseboat',['Moored Under the Willows','Home on the River','Geraniums Afloat','Chimney Smoke at the Bank','Low Water, Slow Life'],function(R){
  var s=[],sol=[],bg=[],wy=RR(R,140,148),cx=RR(R,140,160),hl=RR(R,100,116),hd=RR(R,16,20);
  var hull=[[cx-hl,wy-hd],[cx+hl,wy-hd],[cx+hl-8,wy+4],[cx-hl+8,wy+4]];FS(s,sol,hull);s.push([[cx-hl+2,wy-hd+5],[cx+hl-2,wy-hd+5]]);H(s,[[cx-hl+6,wy-hd+5],[cx+hl-6,wy-hd+5],[cx+hl-8,wy+4],[cx-hl+8,wy+4]],1.8,0);
  var ch=RR(R,30,36),cab=RP(cx-hl+18,wy-hd-ch,cx+hl-26,wy-hd);FS(s,sol,cab);clipIn(s,[zz(cab[0][0]+3,cab[1][0]-3,cab[0][1],wy-hd,RR(R,4,5))],cab);
  var nw=RI(R,4,6),ww=(cab[1][0]-cab[0][0])/nw;for(var i=0;i<nw;i++){var x=cab[0][0]+i*ww+ww*0.2;if(i===1){var d=RP(x,wy-hd-ch+6,x+ww*0.6,wy-hd);FS(s,sol,d,1.3,0);continue;}var W=RP(x,wy-hd-ch+8,x+ww*0.6,wy-hd-12);FS(s,sol,W,1.4,45);s.push([[x-2,wy-hd-11],[x+ww*0.6+2,wy-hd-11]]);
    var bx=RP(x-1,wy-hd-11,x+ww*0.6+1,wy-hd-6);s.push(poly(bx));s.push(scallop(x+ww*0.3,wy-hd-13,ww*0.32,3,6,0.3).slice(0,40));}
  var roof=[[cab[0][0]-6,cab[0][1]],[cab[0][0]-2,cab[0][1]-6],[cab[1][0]+2,cab[0][1]-6],[cab[1][0]+6,cab[0][1]]];FS(s,sol,roof,1.6,0);
  var chx=cab[1][0]-14,chm=RP(chx,cab[0][1]-20,chx+5,cab[0][1]-6);FS(s,sol,chm,1,90);s.push(curve([[chx+2,cab[0][1]-22],[chx-4,cab[0][1]-32],[chx+4,cab[0][1]-42],[chx-6,cab[0][1]-54]],5));
  for(var p=0;p<RI(R,3,4);p++){var px=cab[0][0]+10+p*24,pot=[[px-4,cab[0][1]-6],[px-3,cab[0][1]-12],[px+3,cab[0][1]-12],[px+4,cab[0][1]-6]];FS(s,sol,pot,1,90);s.push(scallop(px,cab[0][1]-16,6,5,6,0.2));}
  s.push([[cx-hl,wy-hd],[cx-hl-14,wy-hd-4]]);for(var r2=0;r2<3;r2++)s.push(circle(cx+hl-14-r2*12,wy-hd+0.5,3.4));
  // bank with willow and mooring post
  var bk=[[4,wy-8],[60,wy-10],[296,wy-12]];var bank=[[4,wy-8],[296,wy-12],[296,wy-4],[4,wy-2]];bg.push(bk.slice(0,1).concat([[296,wy-12]]));var tw=R()<0.5?RR(R,20,40):RR(R,260,280);var wl=[];treeR(wl,R,tw,wy-10,RR(R,18,22),2.2);A(bg,wl);
  bg.push([[4,wy],[296,wy]]);var w=[];A(w,[waterS(R,4,296,wy+4,196,RR(R,7,7.6),1)]);var refl=[];H(refl,[[cx-hl+8,wy+4],[cx+hl-8,wy+4],[cx+hl-20,wy+26],[cx-hl+20,wy+26]],2.4,0);behind(bg,w,[]);A(s,refl.filter(function(_,i){return i%2===0;}));
  hills(bg,R,wy-10,RR(R,22,30),4.6);return fin(s,R,bg,sol,wy-12);});

S('Racing scull',['Dawn Practice','Catch and Drive','Long Oars, Flat Water','Single on the River','Ripples Behind'],function(R){
  var s=[],sol=[],bg=[],wy=RR(R,126,134),cx=RR(R,140,160),L=RR(R,120,132);
  var shell=[[cx-L,wy-3]].concat(quad([cx-L,wy-3],[cx,wy-12],[cx+L,wy-2],20).slice(1)).concat(quad([cx+L,wy-2],[cx,wy+8],[cx-L,wy-3],20).slice(1));FS(s,sol,shell);H(s,shell.slice(21),1.2,0);
  // rower: seat, legs bent, body leaning, arms to the oar handles
  var rx=cx+RR(R,-6,6),lean=RR(R,-0.4,0.5),hip=[rx,wy-8],sh=[hip[0]+34*Math.sin(lean),hip[1]-34*Math.cos(lean)];
  var torso=tube([hip,sh],function(u){return 7-1.5*u;});FS(s,sol,torso.P,1.4,70);s.push(circle(sh[0]+2*Math.sin(lean),sh[1]-9,7));var cap=arc(sh[0]+2*Math.sin(lean),sh[1]-9,7.4,7.4,PI,TAU);FS(s,sol,cap.concat([]),1,0);
  var knee=[rx-20,wy-30],foot=[rx-36,wy-6];s.push([hip,knee,foot]);s.push([[hip[0],hip[1]+2],[knee[0]+2,knee[1]+3],[foot[0]+1,foot[1]+1]]);
  var hand=[rx-10,sh[1]+18];s.push([sh,[sh[0]-6,sh[1]+8],hand]);
  // oars: riggers and long oars to the water with puddles
  [-1,1].forEach(function(d){var rg=[rx-4,wy-14];s.push([[rx+4,wy-6],rg]);var bl=[rx-4-d*RR(R,6,20)-30,wy+d*RR(R,10,22)+18];s.push([hand,rg,bl]);var bp=[[bl[0]-6,bl[1]-2],[bl[0]+6,bl[1]-4],[bl[0]+5,bl[1]+2],[bl[0]-5,bl[1]+3]];FS(s,sol,bp,1,60);
    for(var k=1;k<=3;k++)s.push(ellipse(bl[0]+18+k*16,bl[1]+1,6-k,1.6));});
  // river banks, boathouse, trees
  var by=wy-RR(R,30,38);var bh=RR(R,40,80),bhw=RR(R,34,40),bhP=[[bh-bhw,by],[bh-bhw,by-18],[bh,by-34],[bh+bhw,by-18],[bh+bhw,by]];FS(s,sol,bhP);s.push(archP(bh-14,by,8,10));s.push(archP(bh+14,by,8,10));H(s,[[bh,by-34],[bh+bhw,by-18],[bh,by-18]],1.6,0);A(s,[zz(bh-bhw+2,bh+bhw-2,by-17,by-1,3)].filter(function(){return false;}));
  for(var t=0;t<RI(R,4,6);t++){var tr=[];treeR(tr,R,RR(R,140,290),by,RR(R,12,18),2.6);A(bg,tr);}
  bg.push([[4,by],[296,by]]);var w=[];A(w,[waterS(R,4,296,by+4,196,RR(R,5,6),0.8)]);var rf=[];H(rf,RP(bh-bhw,by,bh+bhw,by+18),3,90);behind(bg,w,[]);A(bg,rf);
  return fin(s,R,bg,sol,by);});

S('Garbage truck',['Tuesday Pickup','Before Seven','Bins at the Curb','The Morning Round','Compactor Song'],function(R){
  var s=[],sol=[],gy=RR(R,170,176),x0=RR(R,30,46),bw=RR(R,140,152),bh=RR(R,62,70),wr=RR(R,13,15);
  var body=[[x0,gy-wr-4],[x0,gy-wr-bh],[x0+bw-10,gy-wr-bh],[x0+bw,gy-wr-bh+10],[x0+bw,gy-wr-4]];FS(s,sol,body);
  var ribs=[];for(var x=x0+16;x<x0+bw-6;x+=RR(R,18,22))ribs.push([[x,gy-wr-bh],[x,gy-wr-4]]);A(s,ribs);H(s,RP(x0+4,gy-wr-bh+6,x0+bw-4,gy-wr-bh+14),1.4,0);
  var hop=[[x0,gy-wr-bh+6],[x0-22,gy-wr-bh+16],[x0-24,gy-wr-6],[x0,gy-wr-4]];FS(s,sol,hop,1.8,90);s.push([[x0-24,gy-wr-26],[x0-6,gy-wr-26]]);s.push([[x0-30,gy-wr-2],[x0-6,gy-wr-2]]);
  var cx0=x0+bw+4,cab=[[cx0,gy-wr-4],[cx0,gy-wr-bh+4],[cx0+30,gy-wr-bh+4],[cx0+44,gy-wr-36],[cx0+48,gy-wr-30],[cx0+48,gy-wr-4]];FS(s,sol,cab);
  var ws=[[cx0+26,gy-wr-bh+10],[cx0+38,gy-wr-36],[cx0+26,gy-wr-36]];FS(s,sol,ws,1.4,60);var dw=RP(cx0+4,gy-wr-bh+10,cx0+22,gy-wr-36);FS(s,sol,dw,1.4,45);s.push([[cx0+22,gy-wr-30],[cx0+18,gy-wr-30]]);
  s.push(RP(cx0+44,gy-wr-18,cx0+50,gy-wr-12));s.push([[cx0+48,gy-wr-26],[cx0+52,gy-wr-26]]);var stp=RP(cx0+6,gy-wr-2,cx0+18,gy-wr+2);s.push(poly(stp));
  [x0+22,x0+48,cx0+30].forEach(function(x){tyre(s,sol,x,gy-wr,wr,1.3);});var arch=[];
  s.push([[x0-24,gy-wr-4],[cx0+50,gy-wr-4]]);H(s,RP(x0,gy-wr-4,cx0+48,gy-wr+2),1.6,0);
  // wheelie bins at the curb, one being lifted
  var bnx=RR(R,236,256);for(var b=0;b<2;b++){var x=bnx+b*22,bin=[[x-8,gy+8],[x-10,gy-22],[x+10,gy-22],[x+8,gy+8]];FS(s,sol,bin,RR(R,2.6,3.2),90);var lid=RP(x-12,gy-26,x+12,gy-22);FS(s,sol,lid,1,0);s.push(circle(x+7,gy+8,2.5));}
  // street: curb, road, houses behind
  var c=[];c.push([[4,gy],[296,gy]]);c.push([[4,gy+10],[296,gy+10]]);H(c,RP(4,gy+10,296,196),RR(R,4.6,5.4),RR(R,4,8));behind(s,c,sol);
  var hs=[];var hx=4;while(hx<296){var hw=RR(R,50,64),hh=RR(R,44,56),hb=gy-4,hP=[[hx,hb],[hx,hb-hh],[hx+hw/2,hb-hh-22],[hx+hw,hb-hh],[hx+hw,hb]];hs.push(poly(hP));hs.push(rect(hx+10,hb-hh+10,hx+22,hb-hh+24));hs.push(rect(hx+hw-22,hb-hh+10,hx+hw-10,hb-hh+24));H(hs,[[hx+hw/2,hb-hh-22],[hx+hw,hb-hh],[hx+hw/2,hb-hh]],2.4,0);hx+=hw+RR(R,4,10);}
  behind(s,hs,sol);var hP2=[];return skyFill(s,gy-4,RR(R,7,8),RR(R,4.6,5.4),5,sol);});

S('Motor launch',['Mahogany Wake','Throttle Open','Lake Run at Noon','Varnish and Spray','Afternoon Across the Bay'],function(R){
  var s=[],sol=[],bg=[],wy=RR(R,134,142),cx=RR(R,140,160),L=RR(R,96,106),dh=RR(R,20,24);
  var hull=[[cx-L,wy-dh]].concat(quad([cx-L*0.2,wy-dh-2],[cx+L*0.8,wy-dh-2],[cx+L,wy-dh+4],12)).concat(quad([cx+L,wy-dh+4],[cx+L*0.7,wy+2],[cx+L*0.2,wy+2],12).slice(1)).concat([[cx-L,wy+2]]);
  hull=[[cx-L,wy-dh],[cx+L*0.5,wy-dh-4],[cx+L,wy-dh-12],[cx+L*0.85,wy-4],[cx+L*0.6,wy+2],[cx-L,wy+2]];FS(s,sol,hull);var pk=[];for(var i=1;i<5;i++){var y=wy-dh+i*(dh+2)/5;pk.push([[cx-L,y],[cx+L*(0.98-0.25*i/5)-(i>3?10:0),y]]);}s.push(serp(pk));
  H(s,[[cx-L,wy-dh*0.3],[cx+L*0.88,wy-dh*0.3],[cx+L*0.85,wy-4],[cx+L*0.6,wy+2],[cx-L,wy+2]],2.2,0);
  var dk=[[cx-L+4,wy-dh],[cx-L+10,wy-dh-6],[cx+L*0.55,wy-dh-6],[cx+L*0.95,wy-dh+4]];s.push(dk);var dz=[];for(var x=cx+10;x<cx+L*0.5;x+=5)dz.push([[x,wy-dh-6],[x+4,wy-dh-1]]);
  var wsh=[[cx-4,wy-dh-6],[cx+4,wy-dh-24],[cx+10,wy-dh-24],[cx+14,wy-dh-6]];FS(s,sol,wsh,2,60);s.push([[cx+1,wy-dh-14],[cx+12,wy-dh-14]]);
  // seats, a driver and a flag at the stern
  [cx-26,cx-60].forEach(function(x,i){var st=RP(x-12,wy-dh-14,x+10,wy-dh-6);FS(s,sol,st,1.4,90);});var dr=[[cx-30,wy-dh-14],[cx-28,wy-dh-30],[cx-18,wy-dh-30],[cx-16,wy-dh-14]];FS(s,sol,dr,1.8,60);s.push(circle(cx-23,wy-dh-36,5));s.push([[cx-18,wy-dh-26],[cx-4,wy-dh-20]]);
  s.push([[cx-L+6,wy-dh-6],[cx-L+6,wy-dh-30]]);s.push([[cx-L+6,wy-dh-30],[cx-L-12,wy-dh-26],[cx-L+6,wy-dh-22]]);
  // bow wave and wake
  var bw=[[cx+L*0.6,wy+2],[cx+L*0.9,wy-6],[cx+L+8,wy-2],[cx+L+20,wy+4]];s.push(curve(bw,5));s.push(spikes(curve([[cx-L,wy+1],[cx-L-30,wy-3],[cx-L-60,wy+2],[cx-L-90,wy+6]],6),2,4,1));
  var wk=[];for(var k=0;k<5;k++)wk.push(quad([cx-L,wy+4+k*4],[cx-L-40,wy+10+k*6],[4,wy+12+k*9],10));A(s,wk);
  var w=[];A(w,[waterS(R,4,296,wy-14,196,RR(R,5,6),1.1)]);behind(s,w,sol.concat([[[4,wy+2],[cx-L,wy+2],[cx-L,wy+6],[4,wy+50]]]));
  var hz=wy-RR(R,16,22);s.push([[4,hz],[296,hz]]);hills(bg,R,hz,RR(R,22,34),4.4);var dock=RR(R,30,70);bg.push(RP(dock,hz-6,dock+40,hz));bg.push([[dock+40,hz-14],[dock+40,hz-6]]);return fin(s,R,bg,sol,hz);});

S('Shire horse',['Feathered Feet','Gentle Giant at the Gate','Plough Horse Resting','Brass and Leather','Seventeen Hands'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,176,182),hx=RR(R,140,160),sc=RR(R,1.6,1.75);
  var P=horse(s,sol,hx,gy,sc,1,RR(R,2,2.4));
  [28,15,-20,-29].forEach(function(lx){var x=hx+lx*sc,f=[];for(var k=0;k<=8;k++){var y=gy-k*2;f.push([x-5-(k%2?3:0),y]);}s.push(f.concat([[x+4,gy]]));});
  var col=rotateAbout(ellipse(hx+30*sc,gy-44*sc,6*sc,12*sc),hx+30*sc,gy-44*sc,0.5);s.push(col);var c2=rotateAbout(ellipse(hx+30*sc,gy-44*sc,3.6*sc,9*sc),hx+30*sc,gy-44*sc,0.5);s.push(c2);
  s.push([[hx+44*sc,gy-58*sc],[hx+10*sc,gy-36*sc],[hx-26*sc,gy-36*sc]]);for(var b=0;b<4;b++){var bp=lerp([hx+10*sc,gy-36*sc],[hx-26*sc,gy-36*sc],b/4+0.1);s.push(circle(bp[0],bp[1]+2,1.6));}
  // field fence and hills
  var fy=gy-RR(R,50,60);var fn=[];for(var x=8;x<292;x+=RR(R,26,32)){fn.push(RP(x-1.5,fy-22,x+1.5,fy));}fn.push([[4,fy-16],[296,fy-16]]);fn.push([[4,fy-7],[296,fy-7]]);A(bg,fn.map(function(p){return p.length===4?poly(p):p;}));
  hills(bg,R,fy-2,RR(R,24,34),4.6);var g=[];g.push([[4,fy],[296,fy]]);A(g,[tufts(4,296,gy+4,5,R)]);H(g,RP(4,fy,296,196),RR(R,4.4,5),RR(R,6,14)*sgn(R));A(bg,g);return fin(s,R,bg,sol,fy-2);});

var COW=[[-48,-60],[-20,-63],[10,-61],[32,-64],[40,-66],[37,-72],[46,-68],[50,-68],[50,-76],[55,-68],[60,-62],[67,-40],[66,-33],[57,-32],[50,-44],[40,-46],[34,-34],[29,-22],[29,-2],[30,0],[23,0],[23,-2],[22,-18],[17,-20],[15,-2],[16,0],[9,0],[10,-2],[8,-22],[-22,-22],[-25,-2],[-24,0],[-31,0],[-31,-2],[-34,-18],[-37,-18],[-39,-2],[-38,0],[-45,0],[-45,-2],[-46,-24],[-50,-36],[-52,-50]];
S('Dairy cow at a gate',['Patchwork Grazer','Waiting for Milking','Five-Bar Gate','Muddy Lane Evening','Clover Up to the Knees'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,176,182),cx=RR(R,130,160),sc=RR(R,1.75,1.9),fx=sgn(R);
  var P=M(COW,cx,gy,sc,fx);SOL(s,sol,P);var ps=[],PC=[[-34,-48],[-8,-40],[16,-52],[-20,-56]];for(var k=0;k<RI(R,3,4);k++){var px=PC[k][0]+RR(R,-4,4),py=PC[k][1]+RR(R,-3,3),pb=blob([[px-10,py],[px-4,py-8],[px+8,py-6],[px+12,py+4],[px+2,py+10],[px-8,py+6]],5);ps.push(M(pb,cx,gy,sc,fx));}
  clipIn(s,[].concat.apply([],ps.map(function(p){var h=[];H(h,p,RR(R,1.4,1.7),RR(R,30,60));return h;})),P);ps.forEach(function(p){clipIn(s,[poly(p)],P);});
  var hd=M([[52,-58]],cx,gy,sc,fx)[0];s.push(circle(hd[0],hd[1],1.6));var mz=M([[58,-38],[66,-40],[66,-34],[58,-33]],cx,gy,sc,fx);H(s,mz,1,0);
  var ud=M([[-10,-22],[-8,-15],[2,-15],[4,-22]],cx,gy,sc,fx);s.push(ud);s.push(M([[-6,-15],[-6,-12]],cx,gy,sc,fx));s.push(M([[0,-15],[0,-12]],cx,gy,sc,fx));
  var tl=curve(M([[-50,-55],[-56,-44],[-56,-28],[-54,-18]],cx,gy,sc,fx),6);s.push(tl);var tt=tl[tl.length-1];s.push(lens(tt,[tt[0],tt[1]+8],2.5));
  H(s,M([[-46,-24],[28,-24],[30,-30],[-48,-30]],cx,gy,sc,fx),2.2,0);
  // gate and hedge behind
  var gx0=fx>0?RR(R,10,30):RR(R,170,190),gw=110,gt=gy-RR(R,64,70),gb=gy-RR(R,20,26);var gate=[];gate.push(RP(gx0-3,gt-6,gx0+3,gy-10));gate.push(RP(gx0+gw-3,gt-6,gx0+gw+3,gy-10));
  for(var b=0;b<5;b++){var y=gt+b*(gb-gt)/4;gate.push([[gx0,y],[gx0+gw,y]]);}gate.push([[gx0,gb],[gx0+gw*0.5,gt]]);gate.push([[gx0+gw*0.5,gt],[gx0+gw*0.5,gb]]);behind(s,gate.map(function(p){return p.length===4?poly(p):p;}),sol);
  var hd2=[];var hy=gt-RR(R,4,10);var hg=scallop(150,hy,150,10,40,0.08).filter(function(p){return p[1]<=hy;});hd2.push(hg);H(hd2,hg.concat([[296,hy],[4,hy]]),2.4,60);behind(bg,hd2,[]);
  var g=[];g.push([[4,hy],[296,hy]]);H(g,RP(4,hy,296,196),RR(R,4.6,5.4),RR(R,8,16)*sgn(R));s.push(tufts(4,296,gy+6,7,R));A(bg,g);return fin(s,R,bg,sol,hy-8);});

S('Fruit bat',['Hanging Out at Dusk','Upside-Down Supper','Flying Fox at Rest','Wrapped in Its Wings','Mango Season'],function(R){
  var s=[],sol=[],by=RR(R,30,40),a0=RR(R,-0.06,0.06);
  var br=curve([[4,by+RR(R,-6,6)],[100,by],[200,by+RR(R,-4,8)],[296,by+RR(R,-6,6)]],10),bt=tube(br,function(u){return 4.5;});FS(s,sol,bt.P);H(s,bt.R.concat(br.slice().reverse()),1.3,0);
  var nb=2,xs=[RR(R,90,120),RR(R,180,214)];for(var i=0;i<nb;i++){var x=xs[i],top=interpY(br,x)+3,L=RR(R,86,100)*(i?0.9:1),w=RR(R,22,26)*(i?0.9:1);
    s.push([[x-4,top-4],[x-3,top+6]]);s.push([[x+4,top-4],[x+3,top+6]]);
    var wrap=[[x-3,top+6],[x-w*0.7,top+18],[x-w,top+L*0.45],[x-w*0.75,top+L*0.8],[x-6,top+L*0.92],[x+6,top+L*0.92],[x+w*0.75,top+L*0.8],[x+w,top+L*0.45],[x+w*0.7,top+18],[x+3,top+6]];var wp=blob(wrap,5);FS(s,sol,wp);
    var fold=[];for(var f=0;f<4;f++)fold.push(curve([[x-w*0.6+f*w*0.4,top+16],[x-w*0.75+f*w*0.5,top+L*0.5],[x-w*0.3+f*w*0.2,top+L*0.85]],6));A(s,fold);HX(s,[wp,EP(x,top+L*0.55,w*0.35,L*0.18)],3.2,80);s.push(poly(EP(x,top+L*0.55,w*0.35,L*0.18)));
    var hy=top+L*0.9,head=[[x-11,hy-2],[x-12,hy+8],[x-5,hy+18],[x-2,hy+26],[x+2,hy+26],[x+5,hy+18],[x+12,hy+8],[x+11,hy-2]];FS(s,sol,head);H(s,[[x-11,hy-2],[x+11,hy-2],[x+12,hy+4],[x-12,hy+4]],1.2,0);[-1,1].forEach(function(d){var ear=[[x+d*7,hy+2],[x+d*16,hy-6],[x+d*13,hy+7]];FS(s,sol,ear,1,90);s.push(circle(x+d*5,hy+12,2.4));H(s,EP(x+d*5,hy+12,1.6,1.6),0.8,0);});s.push([[x-2,hy+24],[x+2,hy+24]]);
    var cl=[[x-w*0.9,top+L*0.4],[x-w*1.05,top+L*0.36],[x-w*0.98,top+L*0.48]];s.push(cl);}
  // leaves and fruit along the branch
  for(var l=0;l<RI(R,3,5);l++){var p=br[Math.floor(RR(R,0.04,0.96)*br.length)];if(Math.abs(p[0]-xs[0])<30||Math.abs(p[0]-xs[1])<30)continue;var up=R()<0.5?-1:1,e=[p[0]+RR(R,-20,20),p[1]+up*RR(R,22,34)];leafL(s,sol,p,e,RR(R,6,8),1.6);}
  var mx=R()<0.5?RR(R,20,60):RR(R,240,280),mt=interpY(br,mx);s.push([[mx,mt],[mx+2,mt+12]]);var mg=blob([[mx-8,mt+14],[mx+6,mt+12],[mx+12,mt+28],[mx+2,mt+38],[mx-8,mt+30]],6);FS(s,sol,mg);H(s,mg.slice(10),1.4,60);
  // dusk sky lines behind, with treetops
  var tt=[];for(var x2=4;x2<296;x2+=RR(R,55,75)){var tr=[];treeR(tr,R,x2,196,RR(R,16,22),0);A(tt,tr);}behind(s,tt,sol);var sk=[];H(sk,RP(4,4,296,196),RR(R,6.6,7.4),0);var tsol=[];tt.forEach(function(st){if(st.length>20)tsol.push(st);});behind(s,sk,sol.concat(tsol));return s;});

var HARE=[[24,0],[-28,0],[-36,-6],[-40,-18],[-34,-32],[-22,-40],[-6,-42],[4,-46],[8,-54],[12,-58],[22,-59],[30,-55],[33,-49],[30,-44],[20,-42],[16,-36],[15,-24],[12,-12],[18,-4]];
S('Hare in a meadow',['Long Ears Listening','Sitting Up in the Clover','March Morning','Still as a Stone','Watchful in the Grass'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,166,174),cx=RR(R,130,170),sc=RR(R,2,2.2),fx=sgn(R);
  var P=M(HARE,cx,gy,sc,fx);SOL(s,sol,P);[[10,-58,2,-100,7],[16,-58,16,-98,6]].forEach(function(e){var L=lens(M([[e[0],e[1]]],cx,gy,sc,fx)[0],M([[e[2],e[3]]],cx,gy,sc,fx)[0],e[4]*sc*0.5);SOL(s,sol,L);H(s,L.slice(0,11),1.4,80);});
  var tip=M([[3,-94],[7,-99],[9,-92]],cx,gy,sc,fx);H(s,tip,0.9,0);
  var ey=M([[22,-52]],cx,gy,sc,fx)[0];s.push(circle(ey[0],ey[1],2.8));H(s,EP(ey[0],ey[1],1.8,1.8),0.8,0);
  var fur=[];for(var k=0;k<14;k++){var p=M([[RR(R,-34,10),RR(R,-38,-4)]],cx,gy,sc,fx)[0];fur.push([p,[p[0]+fx*RR(R,3,6),p[1]+RR(R,-2,2)]]);}A(s,fur);
  H(s,M([[-28,-2],[-36,-8],[-38,-18],[-30,-30],[-14,-34],[-24,-22],[-20,-8]],cx,gy,sc,fx),RR(R,1.8,2.2),45);
  s.push(M([[-4,-2],[-6,-14],[2,-22],[8,-12]],cx,gy,sc,fx));s.push(M([[16,-4],[24,-2]],cx,gy,sc,fx));var wh=M([[31,-48]],cx,gy,sc,fx)[0];for(var w=-1;w<=1;w++)s.push([wh,[wh[0]+fx*14,wh[1]+w*4]]);
  // tall grass and flowers around, meadow behind
  var gl=[];for(var g=0;g<RI(R,30,40);g++){var x=RR(R,6,294),h=RR(R,10,30);gl.push([[x,gy+RR(R,0,18)],[x+RR(R,-6,6),gy-h]]);}behind(s,gl,sol);
  for(var f=0;f<RI(R,4,6);f++){var x=RR(R,10,290);if(Math.abs(x-cx)<60)continue;var h=RR(R,26,40),fh=gy-h;s.push([[x,gy+6],[x,fh]]);s.push(scallop(x,fh,5,5,5,0.3));s.push(circle(x,fh,1.5));}
  hills(bg,R,gy-30,RR(R,18,26),4.6);var m=[];m.push([[4,gy-30],[296,gy-30]]);H(m,RP(4,gy-30,296,196),RR(R,3.8,4.6),RR(R,4,8));A(bg,m);var b2=[];behind(b2,bg,sol);return skyFill(s.concat(b2),gy-30,RR(R,7,8),RR(R,4.6,5.4),5,sol);});

S('Cicada on bark',['Summer Song, Paused','Glass Wings','On the Elm Trunk','August Drone','Seventeen Years Waiting'],function(R){
  var s=[],sol=[],cx=RR(R,140,160),hy=RR(R,30,38),a=RR(R,-0.25,0.25);
  var head=[[cx-22,hy+10],[cx-18,hy],[cx+18,hy],[cx+22,hy+10],[cx+14,hy+16],[cx-14,hy+16]];FS(s,sol,head,1.4,0);[-1,1].forEach(function(d){var e=EP(cx+d*24,hy+8,7,6);FS(s,sol,e,1,30);s.push(circle(cx+d*25,hy+6,1.6));});
  for(var o=-1;o<=1;o++)s.push(circle(cx+o*5,hy+5,1.2));
  var th=[[cx-24,hy+16],[cx+24,hy+16],[cx+22,hy+40],[cx-22,hy+40]];FS(s,sol,th);s.push([[cx-10,hy+18],[cx-6,hy+34],[cx+6,hy+34],[cx+10,hy+18]]);H(s,[[cx-22,hy+16],[cx-10,hy+18],[cx-6,hy+34],[cx-22,hy+40]],1.2,80);H(s,[[cx+22,hy+16],[cx+10,hy+18],[cx+6,hy+34],[cx+22,hy+40]],1.2,100);
  var ab=[[cx-20,hy+42],[cx+20,hy+42],[cx+14,hy+100],[cx,hy+116],[cx-14,hy+100]];FS(s,sol,ab);for(var k=1;k<7;k++){var y=hy+42+k*10;s.push(arc(cx,y-4,18-k*2,5,0.2,PI-0.2));}
  // wings: long clear panels with veins, lying over the abdomen at a slight angle
  [-1,1].forEach(function(d){var root=[cx+d*16,hy+40],tip=[cx+d*RR(R,30,40),hy+150],wing=[root,[cx+d*48,hy+70],[tip[0]+d*10,tip[1]-14],tip,[cx+d*4,hy+120],[cx+d*8,hy+60]];var wb=blob(wing,6);SOL(s,sol,wb);s.push(poly(wb));
    var veins=[];for(var v=0;v<5;v++){var e=lerp([cx+d*44,hy+76],[cx+d*10,hy+124],v/4);veins.push(curve([root,lerp(root,e,0.5),e],4));}A(s,veins);s.push(curve([[cx+d*44,hy+76],[tip[0]+d*6,tip[1]-18],[cx+d*10,hy+130]],8));
    var cells=[];for(var c=0;c<6;c++){var p=lerp([cx+d*40,hy+96],[tip[0],tip[1]-6],c/5);cells.push([p,[p[0]-d*10,p[1]+6]]);}A(s,cells);
    [[0,1],[1,2]].forEach(function(lg){var y0=hy+30+lg[0]*12;s.push([[cx+d*20,y0],[cx+d*40,y0-10-lg[0]*6],[cx+d*52,y0+6]]);});});
  // bark: vertical furrows with cross cracks
  var bk=[];for(var x=6;x<296;x+=RR(R,10,13)){var p=[];for(var y=4;y<=196;y+=8)p.push([x+3*Math.sin(y/17+x)+RR(R,-1,1),y]);bk.push(p);}var bs=[];behind(bs,[serp(bk)],sol);A(s,bs);
  var cr=[];for(var k2=0;k2<26;k2++){var x2=RR(R,8,292),y2=RR(R,8,192);cr.push([[x2,y2],[x2+RR(R,4,8),y2+RR(R,-2,2)]]);}behind(s,cr,sol);var dk=[];for(var k3=0;k3<4;k3++){var x3=RR(R,8,280),y3=RR(R,8,170),P=RP(x3,y3,x3+RR(R,6,10),y3+RR(R,20,30));H(dk,P,1.2,90);}behind(s,dk,sol);return s;});

function craneB(s,sol,R,x,b,sc,fx,up){
  var body=M([[-22,-62],[-6,-70],[12,-66],[18,-58],[8,-50],[-12,-48],[-30,-52]],x,b,sc,fx);var bp=blob(body,5);FS(s,sol,bp);
  var neck=curve(M([[12,-64],[20,-80],[18,-96],[26,-112]],x,b,sc,fx),6),nt=tube(neck,function(u){return 2.6*sc;});FS(s,sol,nt.P);H(s,nt.L.slice(0,Math.floor(nt.L.length*0.6)).concat(nt.R.slice(0,Math.floor(nt.R.length*0.6)).reverse()),1.1,0);
  var hd=M([[26,-112]],x,b,sc,fx)[0];var head=EP(hd[0],hd[1],4.5*sc,3.6*sc);FS(s,sol,head);var cr=EP(hd[0]-fx*sc,hd[1]-3*sc,2.6*sc,1.6*sc);FS(s,sol,cr,0.7,0);s.push([[hd[0]+fx*4*sc,hd[1]],[hd[0]+fx*15*sc,hd[1]+(up?-4:3)*sc]]);s.push(circle(hd[0]+fx*1.6*sc,hd[1]-0.5*sc,0.8*sc));
  [[-4,-2],[4,4]].forEach(function(l,i){var k=M([[l[0],-50],[l[0]+l[1],-26],[l[0]+(i?6:-2),0]],x,b,sc,fx);s.push(k);s.push([k[2],[k[2][0]+fx*6*sc,k[2][1]]]);});
  // raised wings: big feathered fans
  [-1,1].forEach(function(d){var root=M([[-2+d*4,-64]],x,b,sc,fx)[0],tips=[];for(var f=0;f<7;f++){var an=(up?-PI/2:-PI*0.65)+d*fx*(0.25+f*0.16),L=(up?62:48)*sc*(1-f*0.04);tips.push([root[0]+L*Math.cos(an)*1.1,root[1]+L*Math.sin(an)]);}
    var wing=[root].concat(tips);var wb=wing.concat([[root[0]+d*fx*6*sc,root[1]+6*sc]]);SOL(s,sol,wb);var out=[root];tips.forEach(function(t,i){out.push(t);out.push(lerp(t,root,0.18));});s.push(out.concat([root]));
    var fz=[];tips.forEach(function(t,i){if(i>3)fz.push([t,lerp(t,root,0.55)]);});A(s,fz);var dk=tips.slice(4).concat([lerp(tips[6],root,0.35),lerp(tips[4],root,0.4)]);H(s,dk,1.3,60);});
  var tail=M([[-30,-52],[-40,-46],[-36,-56]],x,b,sc,fx);FS(s,sol,tail,1,30);return bp;}
S('Dancing cranes',['Courtship in the Snow','Wings Wide, Heads High','Pair on the Marsh','Leap and Bow','Winter Ballet'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,176,184),x1=RR(R,80,104),x2=RR(R,186,212),sc=RR(R,1.05,1.15);
  craneB(s,sol,R,x1,gy,sc,1,true);craneB(s,sol,R,x2,gy-RR(R,4,10),sc*0.96,-1,R()<0.5);
  var rd=[];for(var r=0;r<RI(R,10,14);r++){var x=R()<0.5?RR(R,6,60):RR(R,240,294),h=RR(R,20,46),yb=gy+RR(R,-6,8);rd.push([[x,yb],[x+RR(R,-4,4),yb-h]]);if(R()<0.4)rd.push(lens([x,yb-h],[x+0.5,yb-h-10],2));}behind(s,rd,sol);
  var sn=[];for(var k=0;k<3;k++){var mx=RR(R,30,270),my=gy+RR(R,4,12);sn.push(quad([mx-40,my],[mx,my-RR(R,6,10)],[mx+40,my],10));}A(s,sn);
  var hz=gy-RR(R,60,70);s.push([[4,hz],[296,hz]]);hills(bg,R,hz,RR(R,16,24),5);var sh=[];var stream=[[4,hz+20],[100,hz+28],[200,hz+18],[296,hz+26]];var sp=curve(stream,8);bg.push(sp);bg.push(translate(sp,0,6));var w=[];H(w,sp.concat(translate(sp,0,6).reverse()),1.4,0);A(bg,w);
  return fin(s,R,bg,sol,hz);});

S('Magpie on a gatepost',['One for Sorrow','Black, White, Blue','Lookout on the Post','Bright-Eyed Thief','Farm Gate Sentinel'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,178,184),px=RR(R,120,160),pt=RR(R,108,116),fx=sgn(R),sc=RR(R,1.75,1.9);
  var post=RP(px-12,pt,px+12,gy);FS(s,sol,post);var cap=[[px-15,pt],[px-15,pt-4],[px,pt-10],[px+15,pt-4],[px+15,pt]];FS(s,sol,cap,1.6,0);clipIn(s,[zz(px-10,px+10,pt+2,gy,3)].filter(function(){return false;}),post);
  var gr=[];for(var y=pt+6;y<gy;y+=RR(R,8,12))gr.push(curve([[px-12,y],[px-4,y+RR(R,-2,2)],[px+4,y+RR(R,-2,2)],[px+12,y]],4));A(s,gr);H(s,RP(px+5,pt,px+12,gy),1.4,90);
  // magpie: body, white belly and shoulder, long tail angled down
  var b=pt-4,body=M([[-14,-4],[-10,-18],[2,-26],[14,-28],[22,-24],[24,-16],[16,-6],[4,-2]],px,b,sc,fx);var bb=blob(body,5);FS(s,sol,bb);
  var belly=blob(M([[0,-4],[10,-10],[16,-6],[8,-2]],px,b,sc,fx),5);s.push(poly(belly));var sh=blob(M([[-6,-16],[4,-20],[8,-16],[-2,-12]],px,b,sc,fx),5);s.push(poly(sh));HX(s,[bb,belly,sh],1.2,30);
  var head=M([[22,-26],[18,-38],[26,-42],[32,-36],[30,-28]],px,b,sc,fx);var hb=blob(head,5);FS(s,sol,hb,1,0);var ey=M([[27,-36]],px,b,sc,fx)[0];s.push(circle(ey[0],ey[1],1.5*sc));s.push(M([[31,-36],[40,-34],[31,-32]],px,b,sc,fx));
  var tail=M([[-12,-12],[-56,-2],[-60,2],[-12,-6]],px,b,sc,fx);FS(s,sol,tail,1.4,0);s.push(M([[-14,-10],[-58,0]],px,b,sc,fx));
  var wing=M([[-2,-20],[-20,-12],[-28,-10],[-4,-12]],px,b,sc,fx);s.push(poly(wing));[[6,-3],[10,-3]].forEach(function(l){s.push(M([[l[0],-3],[l[0]+1,4],[l[0]+4,5]],px,b,sc,fx));});
  // gate swinging from the post, hedges, fields
  var gw=RR(R,110,130),gx=px+fx*12,ge=gx+fx*gw,g=[];for(var r=0;r<5;r++){var y=pt+20+r*12;g.push([[gx,y],[ge,y]]);}g.push([[ge,pt+20],[ge,pt+68]]);g.push([[gx,pt+68],[gx+fx*gw*0.45,pt+20]]);g.push([[gx+fx*gw*0.45,pt+20],[gx+fx*gw*0.45,pt+68]]);A(s,g);
  var hy=pt+RR(R,18,26);var hd=[];var hg=[];for(var x=4;x<=296;x+=5)hg.push([x,hy-RR(R,8,16)]);hd.push(hg);H(hd,hg.concat([[296,hy],[4,hy]]),2.4,70);hd.push([[4,hy],[296,hy]]);behind(bg,hd,[]);
  var fl=[];H(fl,RP(4,hy,296,196),RR(R,4.4,5),RR(R,6,14)*sgn(R));behind(bg,fl,[]);A(s,[tufts(4,296,gy+4,6,R)]);var b2=[];behind(b2,bg,sol.concat([RP(Math.min(gx,ge),pt+18,Math.max(gx,ge),pt+70)]));return skyFill(s.concat(b2),hy-16,RR(R,7,8),RR(R,4.6,5.4),5,sol);});

S('Hornbill',['Casque and Canopy','Bill Like a Bow','Fig Season in the Forest','Heavy Wingbeats','High in the Kapok'],function(R){
  var s=[],sol=[],fx=sgn(R),cx=RR(R,130,160),by=RR(R,130,140),sc=RR(R,1.5,1.65);
  var br=curve([[4,by+RR(R,-10,10)],[110,by+4],[200,by-4],[296,by+RR(R,-14,6)]],10),bt=tube(br,function(u){return 6-2*u;});FS(s,sol,bt.P);H(s,bt.R.concat(br.slice().reverse()),1.3,0);
  var b=interpY(br,cx)-2;var body=blob(M([[-30,-6],[-26,-28],[-8,-44],[10,-48],[20,-40],[16,-20],[4,-6],[-14,0]],cx,b,sc,fx),5);FS(s,sol,body);HX(s,[body,blob(M([[2,-10],[12,-22],[14,-36],[6,-28],[0,-14]],cx,b,sc,fx),5)],RR(R,1.5,1.8),50);
  var tail=M([[-28,-8],[-62,30],[-50,34],[-18,0]],cx,b,sc,fx);FS(s,sol,tail);s.push(M([[-36,10],[-56,32]],cx,b,sc,fx));s.push(M([[-30,18],[-46,32]],cx,b,sc,fx));H(s,M([[-42,16],[-58,32],[-52,34],[-38,18]],cx,b,sc,fx),1.4,0);
  var head=blob(M([[10,-48],[14,-60],[26,-62],[32,-54],[26,-44],[16,-42]],cx,b,sc,fx),5);FS(s,sol,head);var ey=M([[24,-54]],cx,b,sc,fx)[0];s.push(circle(ey[0],ey[1],2.2));s.push(circle(ey[0],ey[1],3.8));
  var bill=M([[30,-58],[46,-60],[66,-52],[76,-40],[60,-46],[42,-48],[30,-50]],cx,b,sc,fx);FS(s,sol,bill);s.push(M([[32,-54],[50,-53],[72,-43]],cx,b,sc,fx));
  var casque=M([[26,-62],[34,-72],[54,-70],[66,-60],[48,-62],[32,-60]],cx,b,sc,fx);FS(s,sol,casque,1.3,0);H(s,M([[48,-48],[60,-46],[76,-40],[66,-52]],cx,b,sc,fx),1.1,30);
  [[-2,0],[6,0]].forEach(function(l){s.push(M([[l[0],-4],[l[0]+2,2],[l[0]+6,4]],cx,b,sc,fx));});
  // leaves and figs around, forest behind
  for(var l=0;l<RI(R,7,9);l++){var p=br[Math.floor(RR(R,0.02,0.98)*br.length)];if(Math.abs(p[0]-cx)<70)continue;var e=[p[0]+RR(R,-26,26),p[1]+sgn(R)*RR(R,24,40)];leafL(s,sol,p,e,RR(R,7,10),1.6);}
  for(var f=0;f<RI(R,4,6);f++){var p2=br[Math.floor(RR(R,0.05,0.95)*br.length)];if(Math.abs(p2[0]-cx)<50)continue;var fc=[p2[0]+RR(R,-6,6),p2[1]+RR(R,8,12)];s.push([p2,fc]);var fg=EP(fc[0],fc[1]+4,4.5,5);FS(s,sol,fg,1,45);}
  var vn=[];for(var v=0;v<RI(R,4,6);v++){var vx=RR(R,10,290);vn.push(curve([[vx,4],[vx+RR(R,-14,14),60],[vx+RR(R,-10,10),120],[vx+RR(R,-14,14),196]],6));}behind(s,vn,sol);
  var bg=[];H(bg,RP(4,4,296,196),RR(R,6,6.8),RR(R,70,80));var bgk=[];behind(bgk,bg,sol);A(s,bgk);return s;});

S('Rhinoceros beetle',['Armored Heavyweight','One Great Horn','Night Crawler on the Log','Polished Shell','Strongest in the Forest'],function(R){
  var s=[],sol=[],fx=sgn(R),cx=RR(R,140,160),ly=RR(R,150,158),sc=RR(R,1.05,1.15);
  // log under the beetle
  var log=RP(4,ly,296,196);var lg=[[4,ly]];for(var x=4;x<=296;x+=8)lg.push([x,ly+RR(R,-1.5,1.5)]);s.push(lg);var bark=[];for(var y=ly+6;y<196;y+=RR(R,6,8)){var p=[];for(var x2=4;x2<=296;x2+=10)p.push([x2,y+RR(R,-1.5,1.5)]);bark.push(p);}
  var rings=[];var ex=fx>0?RR(R,260,280):RR(R,20,40);for(var r=6;r<40;r+=6)rings.push(ellipse(ex,ly+24,r*0.7,r));
  // legs (behind body)
  var legs=[];[-1,0,1].forEach(function(i){var hx=cx+fx*i*28*sc,top=[hx,ly-36*sc],kn=[hx+fx*i*14*sc-8*sc,ly-14*sc+RR(R,-3,3)],ft=[hx+fx*(i*26-6)*sc,ly];legs.push(tube([top,kn],function(){return 2.8*sc;}).P);legs.push(tube([kn,ft],function(){return 2*sc;}).P);});
  legs.forEach(function(P){s.push(poly(P));});
  // elytra (wing case), pronotum, head and horn
  var el=blob(M([[-62,-30],[-56,-56],[-30,-70],[10,-70],[30,-60],[30,-30],[0,-22],[-40,-22]],cx,ly,sc,fx),6);FS(s,sol,el);s.push(M([[-56,-46],[30,-46]],cx,ly,sc,fx));
  var hi=blob(M([[-40,-60],[-16,-66],[0,-64],[-20,-58]],cx,ly,sc,fx),5);s.push(poly(hi));HX(s,[el,hi],1.4,M([[0,0]],0,0,1,fx)[0][0]>0?20:-20);
  var pr=blob(M([[28,-62],[44,-72],[64,-66],[70,-46],[56,-30],[30,-30]],cx,ly,sc,fx),6);FS(s,sol,pr);HX(s,[pr,EP(M([[50,-60]],cx,ly,sc,fx)[0][0],M([[50,-60]],cx,ly,sc,fx)[0][1],5*sc,3*sc)],1.2,60);
  var ph=M([[54,-70],[60,-86],[66,-90],[62,-72]],cx,ly,sc,fx);FS(s,sol,ph,1,0);
  var hd=M([[68,-48],[80,-46],[84,-36],[70,-30]],cx,ly,sc,fx);FS(s,sol,hd,1.1,0);var horn=M([[78,-46],[88,-62],[94,-86],[90,-100],[96,-96],[100,-78],[96,-56],[84,-38]],cx,ly,sc,fx);var hb=blob(horn,4);FS(s,sol,hb);H(s,hb.slice(0,Math.floor(hb.length/2)),1.2,80);
  s.push(M([[84,-36],[94,-30],[98,-34]],cx,ly,sc,fx));var ey=M([[76,-40]],cx,ly,sc,fx)[0];s.push(circle(ey[0],ey[1],2));
  behind(s,legs.map(function(P){var h=[];return P;}).length?[]:[],sol);var lb=[];A(lb,[serp(bark)]);A(lb,rings);behind(s,lb,sol.concat(legs).concat([RP(ex-30,ly+2,ex+30,ly+60)].filter(function(){return false;})));
  // dark forest floor behind: leaf litter and fern fronds
  var bk=[];for(var f=0;f<RI(R,3,4);f++){var fx0=RR(R,10,290),fr=curve([[fx0,ly],[fx0+RR(R,-20,20),ly-60],[fx0+RR(R,-40,40),ly-110]],6);bk.push(fr);for(var k=4;k<fr.length-2;k+=3){bk.push([fr[k],[fr[k][0]+10,fr[k][1]+3]]);bk.push([fr[k],[fr[k][0]-10,fr[k][1]+3]]);}}
  var sk=[];H(sk,RP(4,4,296,ly),RR(R,5.4,6.4),RR(R,-10,10));A(bk,sk);behind(s,bk,sol.concat(legs));return s;});

S('Lionfish',['Spines Like Feathers','Striped Drifter','Fanfare on the Reef','Venom in Stripes','Slow Hunter'],function(R){
  var s=[],sol=[],fx=sgn(R),cx=RR(R,130,160),cy=RR(R,90,104),sc=RR(R,1.15,1.25);
  var body=blob(M([[-50,0],[-30,-18],[0,-24],[30,-18],[46,-6],[44,6],[24,16],[-10,18],[-40,10]],cx,cy,sc,fx),6);FS(s,sol,body);
  var st=[];for(var k=-40;k<40;k+=RR(R,6,8)){var a=M([[k,-30],[k+6,30]],cx,cy,sc,fx);st.push(a);}clipIn(s,st,body);
  var ey=M([[32,-8]],cx,cy,sc,fx)[0];s.push(circle(ey[0],ey[1],3.4));H(s,EP(ey[0],ey[1],2.2,2.2),0.8,0);s.push(M([[46,2],[40,4]],cx,cy,sc,fx));s.push(M([[50,-2],[58,-8],[56,0]],cx,cy,sc,fx));
  // dorsal spines
  var ds=[];for(var i=0;i<12;i++){var bx=-30+i*6,a=M([[bx,-20+Math.abs(bx)*0.02]],cx,cy,sc,fx)[0],L=(48-Math.abs(i-4)*3)*sc,an=-PI/2+fx*(-0.5+i*0.08);var e=[a[0]+L*Math.cos(an),a[1]+L*Math.sin(an)];ds.push([a,e]);ds.push(lens(a,e,1.6));}A(s,ds);
  // big pectoral fan fins with banded rays
  [[6,8,0.4],[0,4,0.9]].forEach(function(f,j){var root=M([[f[0],f[1]]],cx,cy,sc,fx)[0],rays=[];for(var r=0;r<9;r++){var an=PI/2+fx*(-0.2+f[2]+r*0.16)*-1,L=(56+R()*10)*sc;rays.push([root[0]-fx*L*Math.cos(an)*0.9,root[1]+L*Math.sin(an)]);}
    var fan=[root].concat(rays);SOL(s,sol,fan);var p=[root];rays.forEach(function(e,i){p.push(e,root);});s.push(p);for(var bnd=0.3;bnd<1;bnd+=0.22){var arcp=rays.map(function(e){return lerp(root,e,bnd);});s.push(arcp);}});
  var tail=M([[-48,0],[-72,-18],[-66,0],[-72,18]],cx,cy,sc,fx);FS(s,sol,poly(tail),1.4,90);var an2=M([[-20,16],[-30,36],[-14,20]],cx,cy,sc,fx);s.push(an2);
  // reef below, water lines
  var rf=[];var rk=[];rocks(rk,sol,R,4,296,196,RR(R,24,34),RI(R,6,8));A(s,rk);for(var c=0;c<RI(R,3,5);c++){var x=RR(R,10,290),b=RR(R,170,186);var br=[[x,b]],y=b;for(var k2=0;k2<4;k2++){y-=RR(R,8,12);br.push([x+RR(R,-10,10),y]);}s.push(curve(br,4));s.push(circle(br[4][0],br[4][1]-3,3));}
  var w=[];A(w,[waterS(R,4,296,8,180,RR(R,6,7),1.2)]);behind(s,w,sol);return s;});

S('Narwhal',['Unicorn of the Ice','Spiral Tooth','Under the Floe','Arctic Blue','Slow Turn in Cold Water'],function(R){
  var s=[],sol=[],fx=sgn(R),cx=RR(R,130,150),cy=RR(R,116,126),sc=RR(R,1.1,1.2);
  var body=blob(M([[-80,-4],[-60,-16],[-20,-24],[20,-22],[48,-12],[58,0],[48,12],[10,18],[-40,14],[-74,6],[-92,0]],cx,cy,sc,fx),6);FS(s,sol,body);
  var fl=M([[-92,0],[-112,-16],[-106,0],[-112,14]],cx,cy,sc,fx);FS(s,sol,fl,1.4,90);var fp=M([[20,10],[6,26],[30,14]],cx,cy,sc,fx);FS(s,sol,fp,1.2,0);
  var dots=[];for(var d=0;d<12;d++){var p=M([[RR(R,-70,30),RR(R,-18,-4)]],cx,cy,sc,fx)[0];dots.push(EP(p[0],p[1],RR(R,1.5,3),RR(R,1,2)));}dots.forEach(function(e){s.push(poly(e));});
  H(s,M([[-80,4],[40,10],[10,18],[-40,14]],cx,cy,sc,fx),1.6,0);var ey=M([[40,-4]],cx,cy,sc,fx)[0];s.push(circle(ey[0],ey[1],1.6));s.push(M([[52,4],[46,6]],cx,cy,sc,fx));
  // the tusk: long tapering spiral
  var t0=M([[56,-4]],cx,cy,sc,fx)[0],t1=M([[150,-34]],cx,cy,sc,fx)[0],tk=[];var N=60,dx=t1[0]-t0[0],dy=t1[1]-t0[1],L=Math.hypot(dx,dy),nx=-dy/L,ny=dx/L;var e1=[],e2=[];
  for(var i=0;i<=N;i++){var t=i/N,w=3*(1-t)+0.5,c=lerp(t0,t1,t);e1.push([c[0]+nx*w,c[1]+ny*w]);e2.push([c[0]-nx*w,c[1]-ny*w]);}var tP=e1.concat(e2.reverse());FS(s,sol,tP);
  var sp=[];for(var j=0;j<N;j+=2){var a=lerp(t0,t1,j/N),b=lerp(t0,t1,(j+1.6)/N),w2=3*(1-j/N)+0.5;sp.push([[a[0]+nx*w2,a[1]+ny*w2],[b[0]-nx*w2,b[1]-ny*w2]]);}A(s,sp);
  // sea ice above with cracks, light rays and a second narwhal far behind
  var iy=RR(R,30,40),ice=[[4,4],[296,4],[296,iy]];for(var x=292;x>=4;x-=RR(R,16,26))ice.push([x,iy+RR(R,-8,8)]);var holes=[];for(var k=0;k<2;k++){var hx=RR(R,40,260);holes.push(EP(hx,iy-RR(R,10,16),RR(R,16,24),5));}
  s.push(ice.slice(2));HX(s,[ice].concat(holes),RR(R,2.2,2.6),RR(R,-10,10));holes.forEach(function(h){s.push(poly(h));});var rays=[];holes.forEach(function(h){var hx=h[0][0]-20;for(var r=0;r<4;r++)rays.push([[hx+r*10,iy],[hx+r*10+30,170]]);});behind(s,rays,sol);
  var f2=blob(M([[-30,-4],[0,-8],[20,-2],[0,6],[-30,4],[-40,0]],RR(R,60,240),RR(R,160,176),0.5,-fx),4);FS(s,sol,f2,1.2,0);
  var w=[];A(w,[waterS(R,4,296,iy+12,196,RR(R,6,7),1)]);behind(s,w,sol.concat([ice.concat([])]));return s;});

// ---- chunk C: instruments, tools, kitchen, food, toys, furniture, objects ----
S('Ukulele',['Four Strings, Warm Wood','Porch Song','Strummed at Sunset','Little Guitar, Big Smile','Koa Grain'],function(R){
  var s=[],sol=[],ty=RR(R,170,176),a=RR(R,-0.5,-0.32),cx=RR(R,110,130),cy=ty-48;
  var bodyL=[[0,-44],[22,-40],[30,-24],[22,-6],[32,14],[30,36],[0,46],[-30,36],[-32,14],[-22,-6],[-30,-24],[-22,-40]];var B=rotateAbout(blob(bodyL,6).map(function(p){return [cx+p[0],cy+p[1]*1.15];}),cx,cy,a+PI/2);FS(s,sol,B);
  var ins=rotateAbout(blob(bodyL,6).map(function(p){return [cx+p[0]*0.88,cy+p[1]*1.01];}),cx,cy,a+PI/2);s.push(poly(ins));
  var hc=rotateAbout([[cx-14,cy]],cx,cy,a)[0];var hole=EP(hc[0],hc[1],11,11);s.push(poly(hole));s.push(circle(hc[0],hc[1],14));HX(s,[hole],1,0);
  var dir=[Math.cos(a),Math.sin(a)],nrm=[-dir[1],dir[0]];function P(u,v){return [cx+dir[0]*u+nrm[0]*v,cy+dir[1]*u+nrm[1]*v];}
  var neck=[P(-48,-6),P(-120,-5),P(-120,5),P(-48,6)];FS(s,sol,neck);var fr=[];for(var k=0;k<11;k++){var u=-58-k*6;fr.push([P(u,-5.4),P(u,5.4)]);}A(s,fr);
  var head=[P(-120,-8),P(-148,-10),P(-150,10),P(-120,8)];FS(s,sol,head,1.4,0);[-1,1].forEach(function(d){[-128,-140].forEach(function(u){var pg=P(u,d*12);s.push(circle(pg[0],pg[1],2.4));s.push([P(u,d*9),pg]);});});
  var bridge=[P(26,-10),P(30,-10),P(30,10),P(26,10)];FS(s,sol,bridge,1,0);for(var st=0;st<4;st++){var v=-4.2+st*2.8;s.push([P(28,v),P(-120,v*0.85)]);}
  H(s,rotateAbout(arc(cx,cy,30,48,0.3,PI-0.3).concat([[cx,cy+20]]),cx,cy,a+PI/2),1.6,RR(R,40,70));
  // a few strewn picks and sheet music; patterned wall
  var mx=RR(R,200,240),sh=[[mx-30,ty-4],[mx+30,ty-6],[mx+34,ty],[mx-28,ty+2]];FS(s,sol,[[mx-30,ty-36],[mx+26,ty-40],[mx+30,ty-2],[mx-26,ty+2]]);var lines=[];for(var l=0;l<5;l++){for(var q=0;q<5;q++){var y=ty-32+l*7+q*1.1;lines.push([[mx-24,y],[mx+24,y-3]]);}}A(s,lines.filter(function(_,i){return i%5<5;}));
  for(var n=0;n<6;n++){var nx=mx-20+n*8,ny=ty-30+RR(R,0,24);s.push(ellipse(nx,ny,1.8,1.3));s.push([[nx+1.8,ny],[nx+1.8,ny-6]]);}
  var pk=[[RR(R,240,270),ty+12]];var pp=[[pk[0][0]-6,pk[0][1]-4],[pk[0][0]+6,pk[0][1]-4],[pk[0][0],pk[0][1]+5]];FS(s,sol,pp,1,0);
  onTable(s,R,ty,sol);return s;});

S('Pan flute',['Breath Across Bamboo','Hillside Tune','Twelve Pipes Tied','Wind Through Reeds','Shepherd\'s Pipes'],function(R){
  var s=[],sol=[],ty=RR(R,172,178),n=RI(R,10,13),x0=RR(R,60,80),w=RR(R,12,14),top=RR(R,46,56),a=RR(R,-0.12,0.12);
  var tubes=[];for(var i=0;i<n;i++){var x=x0+i*w,h=RR(R,120,128)-i*RR(R,7.5,8.5);var T=RP(x,top,x+w-1,top+h);tubes.push(T);}
  tubes=tubes.map(function(T){return rotateAbout(T,150,110,a);});tubes.forEach(function(T,i){FS(s,sol,T);var tt=EP((T[0][0]+T[1][0])/2,(T[0][1]+T[1][1])/2,(w-1)/2,2.2);s.push(poly(tt));HX(s,[tt],0.8,0);
    var sh=[T[0],lerp(T[0],T[1],0.3),lerp(T[3],T[2],0.3),T[3]];H(s,sh,1.9,90+a*57);var nd=lerp(T[0],T[3],RR(R,0.4,0.6));s.push([nd,[nd[0]+w-1,nd[1]+(w-1)*Math.tan(a)]]);});
  // binding cords across the pipes
  [24,36].forEach(function(y){var L=rotateAbout([[x0-4,top+y],[x0+n*w+3,top+y]],150,110,a);var c=[];var steps=n*2;for(var k=0;k<=steps;k++){var p=lerp(L[0],L[1],k/steps);c.push([p[0],p[1]+(k%2?2.5:-2.5)]);}s.push(c);s.push(translate(c,0,5));});
  var tie=rotateAbout([[x0+n*w+3,top+30]],150,110,a)[0];s.push(curve([tie,[tie[0]+14,tie[1]+16],[tie[0]+8,tie[1]+40],[tie[0]+20,tie[1]+56]],6));s.push(curve([tie,[tie[0]+20,tie[1]+10],[tie[0]+26,tie[1]+30]],5));
  var fx=tie[0]+18,ft=tie[1]+60;var tas=[];for(var t=-4;t<=4;t+=2)tas.push([[fx,ft],[fx+t,ft+12]]);A(s,tas);
  // on a woven cloth over the table, stone wall behind
  var cl=[];H(cl,RP(4,ty+2,296,196),RR(R,3,3.6),45);H(cl,RP(4,ty+2,296,196),RR(R,3,3.6),-45);var cs=[];behind(cs,cl,sol);A(s,cs);s.push([[4,ty],[296,ty]]);s.push([[4,ty+2],[296,ty+2]]);
  var wl=[];wall(wl,R,4,296,ty,ty-6,RR(R,36,42));behind(s,wl,sol);return s;});

S('Gong on a stand',['One Stroke, Long Hum','Temple Bronze','The Hour Struck','Mallet at Rest','Ring Fading Slowly'],function(R){
  var s=[],sol=[],fy=RR(R,176,182),cx=RR(R,140,160),gr=RR(R,52,58),gc=fy-RR(R,92,100),pw=gr+RR(R,18,24),ft=gc-gr-RR(R,18,24);
  [-1,1].forEach(function(d){var x=cx+d*pw,post=RP(x-5,ft,x+5,fy-8);FS(s,sol,post,1.6,90);var foot=[[x-18,fy],[x-14,fy-8],[x+14,fy-8],[x+18,fy]];FS(s,sol,foot,1.4,0);var cap=[[x-8,ft],[x-8,ft-6],[x,ft-12],[x+8,ft-6],[x+8,ft]];FS(s,sol,cap);});
  var beam=[[cx-pw-14,ft],[cx-pw-18,ft-10],[cx-pw,ft-4],[cx+pw,ft-4],[cx+pw+18,ft-10],[cx+pw+14,ft]];FS(s,sol,beam,1.4,0);s.push([[cx-pw,fy-30],[cx+pw,fy-30]]);s.push([[cx-pw,fy-36],[cx+pw,fy-36]]);
  var G=EP(cx,gc,gr,gr);FS(s,sol,G);s.push(spiral(cx,gc,2,gr*0.92,RR(R,9,11),R()*TAU));s.push(circle(cx,gc,gr*0.98));var boss=EP(cx,gc,gr*0.22,gr*0.22);s.push(poly(boss));H(s,arc(cx,gc,gr*0.22,gr*0.22,-0.5,2),0.9,30);
  H(s,arc(cx,gc,gr,gr,-1.2,1.2).concat(arc(cx,gc,gr*0.8,gr,1.2,-1.2)),1.6,RR(R,60,80));
  [-0.5,0.5].forEach(function(o){var hx=cx+o*gr*0.9,hy=gc-gr*Math.sqrt(1-o*o*0.81);s.push([[hx,hy+2],[hx,ft-4]]);s.push(circle(hx,hy,2));});
  // mallet hanging from the post
  var mx=cx+pw+RR(R,-2,2),my=fy-RR(R,70,80);s.push([[mx+6,my-30],[mx+16,my+10]]);var mh=rotateAbout(EP(mx+18,my+18,7,10),mx+18,my+18,-0.4);FS(s,sol,mh,1.6,30);
  // floor and screen wall
  room(s,R,fy,sol,'stripes');return s;});

S('Pruning shears',['Clean Cut','Snip Before Spring','Garden Steel','Deadheading Day','Rust and Red Handles'],function(R){
  var s=[],sol=[],cx=RR(R,130,160),cy=RR(R,100,110),a=RR(R,-0.35,-0.1),o=RR(R,0.22,0.34);
  function blade(sign){var pts=[[0,0],[60,-4*sign],[90,-2*sign],[96,4*sign],[60,10*sign],[0,8*sign]];return pts;}
  function handle(sign){return [[0,6*sign],[-30,10*sign],[-90,26*sign],[-110,30*sign],[-112,20*sign],[-90,14*sign],[-30,0],[-4,0]];}
  [-1,1].forEach(function(d){var an=a+d*o/2;var bl=blade(d).map(function(p){return [p[0],p[1]];}),hd=handle(-d);
    var B=rotateAbout(bl.map(function(p){return [cx+p[0],cy+p[1]];}),cx,cy,an),Hd=rotateAbout(hd.map(function(p){return [cx+p[0],cy+p[1]];}),cx,cy,an);
    FS(s,sol,B);H(s,B.slice(1,4).concat([B[0]]),1.2,a*57+d*20);var hb=blob(Hd,4);FS(s,sol,hb);HX(s,[hb],RR(R,1.4,1.7),a*57+60);var gr=[];for(var k=1;k<5;k++){var p=lerp(Hd[2],Hd[1],k/5),q=lerp(Hd[5],Hd[6],k/5);gr.push([p,q]);}A(s,gr);});
  s.push(circle(cx,cy,6));s.push(circle(cx,cy,2.4));var sp=[];for(var k2=0;k2<5;k2++){var p2=rotateAbout([[cx-18-k2*4,cy-6+k2*0.5]],cx,cy,a)[0];sp.push(p2);}s.push(curve(sp,3));
  var lt=rotateAbout([[cx-40,cy-2],[cx-48,cy-10],[cx-44,cy+6]],cx,cy,a);s.push(lt);
  // clippings of a rose stem, potting bench planks
  var sx=RR(R,180,250),sy=RR(R,150,170),st=[[sx-40,sy],[sx+40,sy-10]];s.push(st);for(var t=0;t<4;t++){var p3=lerp(st[0],st[1],0.15+t*0.22);s.push([p3,[p3[0]+3,p3[1]-5]]);if(t%2)leafL(s,sol,p3,[p3[0]+RR(R,8,14),p3[1]+RR(R,8,14)],4,1.2);}
  var rb=scallop(sx+46,sy-12,8,7,5,0.25);rb.pop();FS(s,sol,rb);s.push(spiral(sx+46,sy-12,1,5,2));
  var tw=[];for(var k3=0;k3<RI(R,4,6);k3++){var x=RR(R,20,280),y=RR(R,160,190);tw.push([[x,y],[x+RR(R,14,26),y+RR(R,-6,6)]]);}A(s,tw);
  var pl=[];var y0=4,d2=1;for(var y=RR(R,24,30);y<196;y+=RR(R,26,32)){pl.push([[4,y],[296,y]]);pl.push([[4,y+2.5],[296,y+2.5]]);}var grain=[];H(grain,RP(4,4,296,196),RR(R,6.5,7.5),RR(R,-3,3));A(pl,grain);for(var g=0;g<RI(R,10,14);g++){var gx=RR(R,10,290),gy=RR(R,10,190);pl.push(curve([[gx,gy],[gx+12,gy+RR(R,-2,2)],[gx+24,gy+RR(R,-3,3)]],3));}
  behind(s,pl,sol);return s;});

S('Paint brushes in a jar',['Studio Window','Bristles Up','Turpentine and Light','Waiting Brushes','After the Lesson'],function(R){
  var s=[],sol=[],ty=RR(R,168,174),jx=RR(R,110,140),jw=RR(R,30,34),jh=RR(R,56,62);
  var jar=[[jx-jw,ty],[jx-jw,ty-jh],[jx-jw+3,ty-jh-6],[jx+jw-3,ty-jh-6],[jx+jw,ty-jh],[jx+jw,ty]];FS(s,sol,jar);s.push(ellipse(jx,ty-jh-6,jw-3,3));var wl=ty-jh*0.5;s.push(wave(jx-jw,jx+jw,wl,0.8,10));H(s,RP(jx-jw+1,wl+2,jx+jw-1,ty-1),2.4,0);
  s.push([[jx+jw-8,ty-jh+4],[jx+jw-8,ty-8]]);s.push([[jx+jw-5,ty-jh+8],[jx+jw-5,ty-16]]);
  var nb=RI(R,6,8);for(var b=0;b<nb;b++){var bx=jx-jw+8+b*(2*jw-16)/(nb-1),an=-PI/2+(b-(nb-1)/2)*RR(R,0.08,0.12),L=RR(R,90,118),base=[bx,ty-10],tip=[base[0]+L*Math.cos(an),base[1]+L*Math.sin(an)];
    var w=RR(R,2.2,3),dx=Math.cos(an),dy=Math.sin(an),nx=-dy,ny=dx;var shaft=[[tip[0]-nx*w*0.6,tip[1]-ny*w*0.6],[base[0]-nx*w,base[1]-ny*w],[base[0]+nx*w,base[1]+ny*w],[tip[0]+nx*w*0.6,tip[1]+ny*w*0.6]];
    var ferr=[lerp(base,tip,0.62),lerp(base,tip,0.78)];var fP=[[ferr[0][0]-nx*w*1.3,ferr[0][1]-ny*w*1.3],[ferr[1][0]-nx*w*1.3,ferr[1][1]-ny*w*1.3],[ferr[1][0]+nx*w*1.3,ferr[1][1]+ny*w*1.3],[ferr[0][0]+nx*w*1.3,ferr[0][1]+ny*w*1.3]];
    var bw=b%3===0?w*2.8:w*1.6,br=[[ferr[1][0]-nx*bw*0.6,ferr[1][1]-ny*bw*0.6],[ferr[1][0]+dx*14-nx*bw,ferr[1][1]+dy*14-ny*bw],[ferr[1][0]+dx*(b%2?26:20),ferr[1][1]+dy*(b%2?26:20)],[ferr[1][0]+dx*14+nx*bw,ferr[1][1]+dy*14+ny*bw],[ferr[1][0]+nx*bw*0.6,ferr[1][1]+ny*bw*0.6]];
    var sh2=shaft.slice(0);var stick=[[ferr[0][0]-nx*w,ferr[0][1]-ny*w],[base[0]-nx*w,base[1]-ny*w],[base[0]+nx*w,base[1]+ny*w],[ferr[0][0]+nx*w,ferr[0][1]+ny*w]];FS(s,sol,stick,b%2?1.2:0,b%2?an*57:0);FS(s,sol,fP,0.9,an*57+90);var bb=blob(br,4);FS(s,sol,bb);s.push(zz(0,0,0,0,1).length?[lerp(br[0],br[2],0.1),br[2]]:[]);if(b%2===0)H(s,bb,1.2,an*57);}
  // palette and tubes on the table, window behind
  var px=RR(R,210,240),pal=blob([[px-44,ty+8],[px-40,ty-4],[px,ty-8],[px+40,ty-4],[px+44,ty+8],[px,ty+12]],6);FS(s,sol,pal);var th=EP(px-30,ty+2,5,2.6);s.push(poly(th));for(var d=0;d<5;d++){var dbx=px-16+d*12,blob2=EP(dbx,ty+RR(R,-2,4),5,2.6);s.push(poly(blob2));H(s,blob2,0.9,d*30);}
  var tb=[[RR(R,30,60),ty+16]];tb.forEach(function(t){var tP=[[t[0],t[1]],[t[0]+40,t[1]-4],[t[0]+44,t[1]],[t[0]+40,t[1]+4]];FS(s,sol,poly(tP),1.2,0);s.push(RP(t[0]-6,t[1]-2,t[0],t[1]+2));});
  var wx0=RR(R,170,190),win=RP(wx0,20,wx0+96,ty-30);var wn=[];wn.push(poly(win));wn.push([[wx0+48,20],[wx0+48,ty-30]]);wn.push([[wx0,(20+ty-30)/2],[wx0+96,(20+ty-30)/2]]);var sky=[];H(sky,win,RR(R,6,7),0);A(wn,sky);H(wn,RP(4,4,296,ty),RR(R,5,5.6),90);
  var tbl=[];tbl.push([[4,ty],[296,ty]]);tbl.push([[4,ty+18],[296,ty+18]]);H(tbl,RP(4,ty+18,296,196),RR(R,4,5),0);var ww=[];behind(ww,wn,[win.slice(0,4)]);behind(s,ww.concat([poly(win)]).concat(wn.slice(0,3)).concat(sky),sol);behind(s,tbl,sol);return s;});

S('Colander of pasta',['Steam in the Sink','Drained and Ready','Sunday Supper','Holes and Noodles','Al Dente'],function(R){
  var s=[],sol=[],ty=RR(R,166,172),cx=RR(R,130,160),rw=RR(R,70,78),rh=RR(R,52,58),rim=ty-rh-8;
  var bowl=[[cx-rw,rim]].concat(cubic([cx-rw,rim],[cx-rw+4,rim+rh*0.9],[cx-rw*0.5,rim+rh],[cx,rim+rh],14).slice(1)).concat(cubic([cx,rim+rh],[cx+rw*0.5,rim+rh],[cx+rw-4,rim+rh*0.9],[cx+rw,rim],14).slice(1));FS(s,sol,bowl);
  var ft=[[cx-30,rim+rh],[cx-34,ty],[cx+34,ty],[cx+30,rim+rh]];FS(s,sol,ft,1.4,0);var rimE=EP(cx,rim,rw,9);s.push(poly(rimE));s.push(ellipse(cx,rim,rw-4,6.5));
  [-1,1].forEach(function(d){var hx=cx+d*rw,hd=[[hx,rim-2],[hx+d*22,rim-6],[hx+d*24,rim+2],[hx+d*2,rim+6]];FS(s,sol,hd,1.2,0);s.push(ellipse(hx+d*16,rim-1,4,2));});
  var holes=[];for(var r=0;r<4;r++){var y=rim+12+r*10,t=(y-rim)/rh,hw=rw*(1-t*t*0.55)-10;for(var x=cx-hw;x<=cx+hw;x+=RR(R,9,11)){holes.push(circle(x,y,1.6));}}A(s,holes);
  H(s,[[cx+rw*0.4,rim+4],[cx+rw,rim],[cx+rw*0.8,rim+rh*0.7],[cx+rw*0.3,rim+rh]],1.5,80);
  // a heap of spaghetti piled above the rim
  var heap=[[cx-rw+8,rim+2],[cx-rw*0.6,rim-RR(R,20,26)],[cx,rim-RR(R,32,38)],[cx+rw*0.6,rim-RR(R,20,26)],[cx+rw-8,rim+2]];var hp=curve(heap,8);SOL(s,sol,hp.concat([[cx+rw-8,rim+4],[cx-rw+8,rim+4]]));
  var nd=[];for(var k=0;k<RI(R,26,32);k++){var y0=rim-RR(R,0,30),x0=cx+RR(R,-rw*0.8,rw*0.8),L=RR(R,30,60),pts=[];for(var j=0;j<=8;j++){pts.push([x0+L*(j/8-0.5),y0+4*Math.sin(j*1.2+k)]);}nd.push(pts);}clipIn(s,nd,hp.concat([[cx+rw,rim+6],[cx-rw,rim+6]]));s.push(hp);
  var hang=[];for(var h=0;h<3;h++){var hx2=cx+RR(R,-rw*0.6,rw*0.6);hang.push(curve([[hx2,rim+3],[hx2+RR(R,-6,6),rim+16],[hx2+RR(R,-10,10),rim+30]],5));}A(s,hang);
  // steam, a wooden spoon, tiled kitchen wall
  for(var st=0;st<3;st++){var sx=cx-30+st*30;s.push(curve([[sx,rim-38],[sx+8,rim-54],[sx-6,rim-70],[sx+4,rim-86]],6));}
  var spx=RR(R,230,260),sp=[[spx-40,ty+10],[spx+18,ty+4]];s.push(sp);s.push(translate(sp,0,4));var bowlS=EP(spx+28,ty+5,12,6);FS(s,sol,bowlS,1.4,30);
  onTable(s,R,ty,sol);return s;});

S('Baguettes in a basket',['Still Warm','Morning Bake','Crust and Crumb','Long Loaves','From the Corner Oven'],function(R){
  var s=[],sol=[],ty=RR(R,172,178),bx=RR(R,130,160),bw=RR(R,58,66),bt=ty-RR(R,52,58);
  var bk=[[bx-bw,bt],[bx-bw+10,ty],[bx+bw-10,ty],[bx+bw,bt]];
  // loaves standing up out of the basket, leaning
  var nl=RI(R,4,5),loaves=[];for(var i=0;i<nl;i++){var lx=bx-bw*0.6+i*bw*1.2/(nl-1)+RR(R,-4,4),an=-PI/2+(i-(nl-1)/2)*RR(R,0.12,0.18),L=RR(R,110,140),w=RR(R,8,10),base=[lx,bt+20],tip=[base[0]+L*Math.cos(an),base[1]+L*Math.sin(an)];
    var lv=lens(base,tip,w);var lb=lv.map(function(p){return p;});loaves.push({P:lb,base:base,tip:tip,w:w,an:an});}
  loaves.slice().reverse().forEach(function(l){var P=l.P;var cuts=[];for(var c=0;c<5;c++){var m=lerp(l.base,l.tip,0.3+c*0.13),dx=Math.cos(l.an),dy=Math.sin(l.an);cuts.push([[m[0]-dy*l.w*0.5-dx*3,m[1]+dx*l.w*0.5-dy*3],[m[0]+dy*l.w*0.5+dx*5,m[1]-dx*l.w*0.5+dy*5]]);}
    var tmp=[];tmp.push(poly(P));A(tmp,cuts);var sh=[];H(sh,P.slice(0,Math.floor(P.length/2)),1.4,l.an*57+90);A(tmp,sh);behind(s,tmp,sol);sol.push(P);});
  // basket: weave as rows of short dashes; rim; handle
  var bP=bk;FS(s,sol,bP);var rimP=RP(bx-bw-4,bt-6,bx+bw+4,bt);FS(s,sol,rimP);clipIn(s,[zz(bx-bw-4,bx+bw+4,bt-6,bt,3)],rimP);
  var wv=[];for(var y=bt+6,r=0;y<ty-2;y+=6,r++){var row=[];var t=(y-bt)/(ty-bt),xl=bx-bw+10*t,xr=bx+bw-10*t;for(var x=xl+(r%2)*5;x<xr-4;x+=10)row.push([[x,y],[x+5,y+3]]);A(wv,row);}clipIn(s,wv,bP);var ribs=[];for(var k=0;k<8;k++){var xt=bx-bw+k*2*bw/7,xb=bx-bw+10+k*(2*bw-20)/7;ribs.push([[xt,bt],[xb,ty]]);}A(s,ribs);
  // cloth draped, crumbs; checked tablecloth
  var cl=[[bx-bw-10,bt-2],[bx-bw-30,bt+30],[bx-bw-20,bt+50],[bx-bw+6,bt+10]];FS(s,sol,cl);var ch=[];H(ch,cl,3,0);H(ch,cl,3,90);A(s,ch);
  var tc=[];tc.push([[4,ty],[296,ty]]);H(tc,RP(4,ty,296,196),RR(R,5,5.6),0);behind(s,tc,sol);
  var wl=[];H(wl,RP(4,4,296,ty),RR(R,7,8),90);var shelf=RP(4,40,296,44);wl.push(poly(shelf));behind(s,wl,sol);return s;});

S('Savoy cabbage',['Crinkled Green','Frost-Sweet','Market Morning','Leaves Like Lace','Winter Kitchen'],function(R){
  var s=[],sol=[],ty=RR(R,166,172),cx=RR(R,130,160),cy=ty-RR(R,46,52),r=RR(R,46,52);
  // outer leaves spreading, crinkled with veins
  var nl=RI(R,6,7);for(var i=0;i<nl;i++){var an=-PI+i*PI/(nl-1)+RR(R,-0.1,0.1),lr=r*RR(R,1.25,1.45),lc=[cx+lr*0.55*Math.cos(an),cy+lr*0.45*Math.sin(an)+10];
    var leaf=scallop(lc[0],lc[1],lr*0.6,lr*0.42,RI(R,9,12),0.12);leaf.pop();leaf=rotateAbout(leaf,lc[0],lc[1],an+PI/2);var lt=[];lt.push(poly(leaf));var vein=[[cx,cy+10],[lc[0]+lr*0.5*Math.cos(an),lc[1]+lr*0.4*Math.sin(an)]];lt.push(vein);
    for(var v=1;v<4;v++){var m=lerp(vein[0],vein[1],v/4);lt.push([m,[m[0]+12*Math.cos(an-0.9),m[1]+12*Math.sin(an-0.9)]]);lt.push([m,[m[0]+12*Math.cos(an+0.9),m[1]+12*Math.sin(an+0.9)]]);}behind(s,lt,sol);sol.push(leaf);}
  // the head: tight ball with crinkle texture and a few wrapping leaves
  var head=scallop(cx,cy,r,r*0.9,14,0.05);head.pop();var hs=[];hs.push(poly(head));for(var w=0;w<3;w++){var a0=-PI*0.9+w*0.7,ar=arc(cx,cy,r*(0.92-w*0.12),r*(0.85-w*0.1),a0,a0+RR(R,1.8,2.4));hs.push(ar);}
  var cr=[];for(var y=cy-r+6;y<cy+r;y+=RR(R,5,6)){var hw=r*Math.sqrt(Math.max(0,1-Math.pow((y-cy)/(r*0.9),2)));if(hw<6)continue;cr.push(wave(cx-hw+2,cx+hw-2,y,1.4,6,y));}A(hs,[serp(cr)]);H(hs,arc(cx,cy,r,r*0.9,-0.6,1.4).concat([[cx+r*0.3,cy+r*0.4]]),1.4,60);
  var ins=[];behind(ins,hs,[]);clipIn(s,ins,head);s.push(poly(head));sol.push(head);
  // knife and a cut wedge; slate board; tiles
  var kx=RR(R,30,60),kn=[[kx,ty+8],[kx+60,ty+2],[kx+70,ty+6],[kx+8,ty+12]];FS(s,sol,kn,1.4,0);var kh=RP(kx-30,ty+8,kx,ty+14);FS(s,sol,kh,1.4,90);
  var bd=[[20,ty-2],[280,ty-2],[284,ty+18],[16,ty+18]];s.push(poly(bd));var bh=[];H(bh,bd,2.6,3);behind(s,bh,sol);
  onTable(s,R,ty+18,sol);return s;});

S('Garlic and onions',['Papery Skins','Strung for Winter','Pantry Basket','Bulbs and Cloves','Kitchen Staples'],function(R){
  var s=[],sol=[],ty=RR(R,168,174);
  function bulb(x,b,w,h,lines,tuft){var P=[[x,b-h-10]].concat(cubic([x,b-h-10],[x-w*0.2,b-h],[x-w*1.2,b-h*0.7],[x-w*0.9,b-h*0.2],10).slice(1)).concat(quad([x-w*0.9,b-h*0.2],[x-w*0.4,b+2],[x,b],8).slice(1)).concat(quad([x,b],[x+w*0.4,b+2],[x+w*0.9,b-h*0.2],8).slice(1)).concat(cubic([x+w*0.9,b-h*0.2],[x+w*1.2,b-h*0.7],[x+w*0.2,b-h],[x,b-h-10],10).slice(1));
    FS(s,sol,P);var ln=[];for(var k=1;k<lines;k++){var f=-1+2*k/lines;ln.push(quad([x,b-h-8],[x+f*w*1.4,b-h*0.5],[x+f*w*0.2,b],10));}A(s,ln);if(tuft){var t=[];for(var j=-2;j<=2;j++)t.push([[x+j,b],[x+j*2.5,b+5]]);A(s,t);}return P;}
  var ox=[RR(R,60,80),RR(R,110,130),RR(R,224,250)],gs=[];
  ox.forEach(function(x,i){var w=RR(R,24,30),h=RR(R,40,48),P=bulb(x,ty,w,h,RI(R,7,9),true);H(s,P.slice(Math.floor(P.length/2)),RR(R,1.5,1.8),RR(R,60,80));s.push(curve([[x,ty-h-10],[x+4,ty-h-24],[x-2,ty-h-36]],4));});
  // garlic heads in the middle, one broken into cloves
  var gx=RR(R,170,190);var g1=bulb(gx,ty,18,30,6,true);H(s,g1.slice(0,Math.floor(g1.length/2)),1.4,100);s.push([[gx,ty-40],[gx+2,ty-60],[gx-2,ty-62]]);
  for(var c=0;c<3;c++){var cx=gx-30+c*14+RR(R,-3,3),cl=[[cx,ty],[cx-6,ty-6],[cx-4,ty-16],[cx+1,ty-22],[cx+5,ty-12],[cx+5,ty]];var cb=blob(cl,4);FS(s,sol,cb,1.2,70);}
  // a braid of garlic hanging from the shelf above
  var hx=RR(R,30,60),hy=20;s.push([[hx,4],[hx,hy]]);for(var b=0;b<4;b++){var y=hy+8+b*18,x=hx+(b%2?8:-8);var gb=bulb(x,y+12,8,10,4,false);H(s,gb.slice(0,Math.floor(gb.length/2)),1.4,90);s.push([[hx,y-4],[x,y]]);}
  // shelf, wall of planks
  var w=[];H(w,RP(4,4,296,ty),RR(R,9,11),90);var nl=[];for(var k2=0;k2<14;k2++){var nx=RR(R,10,290),ny=RR(R,10,ty-10);nl.push(circle(nx,ny,0.8));}A(w,nl);var sh=[];sh.push([[4,ty],[296,ty]]);sh.push([[4,ty+8],[296,ty+8]]);H(sh,RP(4,ty,296,ty+8),1.6,0);H(sh,RP(4,ty+8,296,196),RR(R,5,6),88);
  behind(s,w.concat(sh),sol);return s;});

S('Pepper mill and salt cellar',['Twist and Pinch','Table Set for Two','Coarse Ground','Supper Table Pair','Salt and Spice'],function(R){
  var s=[],sol=[],ty=RR(R,168,174),mx=RR(R,100,130),mw=RR(R,18,22),mh=RR(R,120,130);
  var top=ty-mh,mill=[[mx-mw,ty],[mx-mw-4,ty-10],[mx-mw*0.6,ty-34],[mx-mw*0.6,ty-48],[mx-mw*0.9,ty-60],[mx-mw*0.9,ty-74],[mx-mw*0.5,ty-82],[mx-mw*0.5,ty-90],[mx-mw*0.95,ty-100],[mx-mw*0.8,top+8],[mx-mw*0.2,top]];
  var mP=mill.concat(mill.slice().reverse().map(function(p){return [2*mx-p[0],p[1]];}));FS(s,sol,mP);[[ty-10],[ty-34],[ty-48],[ty-60],[ty-74],[ty-82],[ty-90],[ty-100]].forEach(function(y){var p=mill.filter(function(q){return Math.abs(q[1]-y[0])<0.5;})[0];if(p)s.push([p,[2*mx-p[0],p[1]]]);});
  s.push([[mx,top],[mx,top-8]]);s.push(circle(mx,top-10,2.6));H(s,[[mx+mw*0.3,ty],[mx+mw,ty],[mx+mw+4,ty-10],[mx+mw*0.6,ty-34],[mx+mw*0.6,ty-48],[mx+mw*0.9,ty-60],[mx+mw*0.9,ty-74],[mx+mw*0.5,ty-82],[mx+mw*0.5,ty-90],[mx+mw*0.95,ty-100],[mx+mw*0.8,top+8],[mx+mw*0.2,top],[mx+mw*0.2,ty]],1.5,90);
  var gr=[];for(var k=0;k<RI(R,10,16);k++){var gx=mx+RR(R,-40,40),gy=ty+RR(R,4,14);gr.push(circle(gx,gy,0.7));}
  // salt cellar: small bowl with a spoon
  var sx=RR(R,180,210),sw=RR(R,26,30),sb=ty,bowl=[[sx-sw,sb-26]].concat(quad([sx-sw,sb-26],[sx-sw,sb-4],[sx-sw*0.4,sb-4],8).slice(1)).concat([[sx-sw*0.5,sb],[sx+sw*0.5,sb],[sx+sw*0.4,sb-4]]).concat(quad([sx+sw*0.4,sb-4],[sx+sw,sb-4],[sx+sw,sb-26],8).slice(1));FS(s,sol,bowl);
  s.push(ellipse(sx,sb-26,sw,5));var salt=scallop(sx,sb-27,sw-4,3.4,10,0.15);s.push(salt);H(s,bowl.slice(Math.floor(bowl.length/2)),1.4,80);
  var sp=[[sx+4,sb-28],[sx+30,sb-62]];s.push(sp);s.push(translate(sp,2,1));var spb=EP(sx+2,sb-27,4,2.4);FS(s,sol,spb);
  // linen napkin and plate edge; striped wall
  var nx=RR(R,230,260),nap=[[nx-20,ty+16],[nx+30,ty+12],[nx+36,ty+24],[nx-14,ty+28]];FS(s,sol,nap,2.4,-6);var pl=EP(RR(R,40,60),ty+22,40,6);s.push(poly(pl));s.push(ellipse(pl[0][0]-40,ty+22,30,4.4));sol.push(pl);
  onTable(s,R,ty,sol);return s;});

S('Hobby horse',['Gallop Round the Garden','Stick Pony','Woolen Mane','Ready to Ride','Nursery Steed'],function(R){
  var s=[],sol=[],fy=RR(R,176,182),a=RR(R,-1.15,-1.0),bx=RR(R,96,120),base=[bx,fy-2],L=RR(R,150,166),top=[base[0]+L*Math.cos(a)*-1,base[1]+L*Math.sin(a)];
  top=[base[0]+L*Math.cos(-a)*0.5,base[1]-L*Math.sin(-a)];var stick=tube([base,top],function(){return 3.2;});FS(s,sol,stick.P,1.6,a*57);
  var wh=[];[0,1].forEach(function(i){});s.push(circle(base[0],base[1]-6,8));s.push(circle(base[0],base[1]-6,2));var whP=EP(base[0],base[1]-6,8,8);sol.push(whP);
  // head: long horse head at the top of the stick
  var hx=top[0],hy=top[1],sc=1.15,fx=1;var head=M([[-10,10],[-14,-6],[-8,-22],[4,-30],[12,-34],[20,-30],[44,-14],[50,-4],[46,4],[36,4],[20,0],[8,8],[4,20],[-8,24]],hx,hy,sc,fx);var hb=blob(head,4);FS(s,sol,hb);
  var ear=M([[6,-30],[8,-44],[14,-32]],hx,hy,sc,fx);FS(s,sol,ear,1,0);var ey=M([[16,-20]],hx,hy,sc,fx)[0];s.push(circle(ey[0],ey[1],3));H(s,EP(ey[0],ey[1],1.8,1.8),0.8,0);s.push(circle(M([[44,-6]],hx,hy,sc,fx)[0][0],M([[44,-6]],hx,hy,sc,fx)[0][1],1.8));
  var mane=[];for(var k=0;k<12;k++){var p=lerp(M([[4,-30]],hx,hy,sc,fx)[0],M([[-12,18]],hx,hy,sc,fx)[0],k/11);mane.push(p,[p[0]-RR(R,8,14),p[1]+RR(R,-4,4)]);}s.push(mane);
  var bri=[M([[30,-22],[30,0]],hx,hy,sc,fx),M([[30,-12],[48,-8]],hx,hy,sc,fx)];A(s,bri);var rein=curve(M([[30,-12],[20,20],[0,40],[-4,30]],hx,hy,sc,fx),6);s.push(rein);
  var cuff=M([[-10,18],[6,14],[8,26],[-6,30]],hx,hy,sc,fx);FS(s,sol,cuff,1.2,90);H(s,M([[-10,10],[-14,-6],[-8,-22],[-2,-20],[-4,8]],hx,hy,sc,fx),1.6,60);
  // playroom: rug, skirting, wallpaper of small diamonds
  var rug=EP(150,fy+8,110,10);s.push(poly(rug));var rh=[];H(rh,rug,2.6,0);A(s,rh);var bl=RR(R,200,240),blk=[[bl,fy],[bl,fy-20],[bl+20,fy-20],[bl+20,fy]];FS(s,sol,blk,0,0);s.push([[bl,fy-20],[bl+6,fy-26],[bl+26,fy-26],[bl+20,fy-20]]);s.push([[bl+26,fy-26],[bl+26,fy-6],[bl+20,fy]]);s.push(circle(bl+10,fy-10,5));
  var b2=[[bl+24,fy],[bl+24,fy-14],[bl+38,fy-14],[bl+38,fy]];FS(s,sol,b2,1.4,45);
  room(s,R,fy,sol,'diag');return s;});

S('Nesting dolls',['Smaller and Smaller','Five Inside One','Painted Shawls','Family on the Shelf','Lacquer Sisters'],function(R){
  var s=[],sol=[],ty=RR(R,168,174),n=5,x=RR(R,34,52),sz=[1,0.82,0.66,0.52,0.4];
  for(var i=0;i<n;i++){var k=sz[i],w=36*k,h=104*k,cx=x+w;var b=ty,body=[[cx-w*0.9,b]].concat(cubic([cx-w*0.9,b],[cx-w*1.2,b-h*0.45],[cx-w*0.95,b-h*0.62],[cx-w*0.55,b-h*0.66],10).slice(1)).concat(arc(cx,b-h*0.78,w*0.62,h*0.22,PI*0.75,PI*2.25).slice(1)).concat(cubic([cx+w*0.55,b-h*0.66],[cx+w*0.95,b-h*0.62],[cx+w*1.2,b-h*0.45],[cx+w*0.9,b],10).slice(1));
    FS(s,sol,body);var face=EP(cx,b-h*0.78,w*0.4,h*0.13);s.push(poly(face));s.push(circle(cx-w*0.15,b-h*0.8,1.2));s.push(circle(cx+w*0.15,b-h*0.8,1.2));s.push(arc(cx,b-h*0.74,w*0.12,h*0.03,0.3,PI-0.3));
    var hair=arc(cx,b-h*0.84,w*0.4,h*0.08,PI,TAU);H(s,hair.concat([[cx+w*0.4,b-h*0.82],[cx-w*0.4,b-h*0.82]]),1,0);
    
    var apr=EP(cx,b-h*0.3,w*0.62,h*0.24);s.push(poly(apr));var fl=scallop(cx,b-h*0.32,w*0.3,w*0.3,5,0.35);s.push(fl);if(i<3){s.push(circle(cx,b-h*0.32,w*0.08));}
    var sk=[];HX(sk,[body.slice(0),apr,face,arc(cx,b-h*0.78,w*0.62,h*0.22,0,TAU)],RR(R,3.8,4.2),-45+i*8);A(s,sk);x+=2*w+RR(R,6,10);}
  // the open top half of the biggest doll lying on the shelf
  var ox=RR(R,250,270),half=[[ox-24,ty],[ox-28,ty-22]].concat(arc(ox,ty-22,28,12,PI,TAU).slice(1)).concat([[ox+24,ty]]);var hP=rotateAbout(half,ox,ty,0.3);FS(s,sol,hP,2.6,45);
  var sh=[];sh.push([[4,ty],[296,ty]]);sh.push([[4,ty+10],[296,ty+10]]);H(sh,RP(4,ty,296,ty+10),2,0);H(sh,RP(4,ty+10,296,196),RR(R,5,6),90);var wl=[];H(wl,RP(4,4,296,ty),RR(R,12,13),0);H(wl,RP(4,4,296,ty),RR(R,12,13),90);behind(s,sh.concat(wl),sol);return s;});

S('Chesterfield sofa',['Buttoned Leather','Club Room Afternoon','Rolled Arms','Deep Seat, Low Light','Old Library Corner'],function(R){
  var s=[],sol=[],fy=RR(R,176,182),cx=RR(R,140,160),sw=RR(R,104,112),sb=fy-10,sh=RR(R,72,78),st=sb-sh,seat=sb-RR(R,34,38);
  var back=[[cx-sw+14,seat],[cx-sw+14,st+6],[cx+sw-14,st+6],[cx+sw-14,seat]];FS(s,sol,back);
  var but=[],rows=3;for(var r=0;r<rows;r++){var y=st+14+r*((seat-st-18)/(rows-1));for(var x=cx-sw+26+(r%2)*10;x<cx+sw-22;x+=20){but.push([x,y]);}}but.forEach(function(p){s.push(circle(p[0],p[1],1.4));});
  var dia=[];but.forEach(function(p){but.forEach(function(q){var dx=q[0]-p[0],dy=q[1]-p[1];if(dy>0&&Math.abs(Math.abs(dx)-10)<1&&Math.abs(dy-(seat-st-18)/(rows-1))<1)dia.push([p,q]);});});A(s,dia);
  s.push([[cx-sw+14,st+6]].concat(scallop(cx,st+6,sw-14,3,16,0.3).filter(function(p){return p[1]<=st+6;}).sort(function(a,b){return a[0]-b[0];})).concat([[cx+sw-14,st+6]]));
  [-1,1].forEach(function(d){var ax=cx+d*sw,arm=[[ax-d*22,sb],[ax-d*22,st+30],[ax-d*24,st+22]].concat(arc(ax-d*10,st+24,14,12,d>0?PI:0,d>0?TAU:-PI).slice(1)).concat([[ax+d*4,st+26],[ax+d*2,sb]]);FS(s,sol,arm);
    var sp=spiral(ax-d*10,st+24,1,10,2.4,d>0?0:PI);s.push(sp);var pl=[];for(var y=st+40;y<sb-4;y+=6)pl.push([[ax-d*20,y],[ax,y+(d>0?0:0)]]);A(s,zz(Math.min(ax-d*20,ax),Math.max(ax-d*20,ax),st+40,sb-4,4).length?[zz(Math.min(ax-d*20,ax),Math.max(ax-d*20,ax),st+40,sb-4,4)]:[]);});
  var cush=[];for(var c=0;c<3;c++){var x0=cx-sw+22+c*(2*sw-44)/3,x1=x0+(2*sw-44)/3,P=[[x0,seat+12],[x0+2,seat-2],[x1-2,seat-2],[x1,seat+12]];cush.push(P);FS(s,sol,P);H(s,[[x0,seat+6],[x1,seat+6],[x1,seat+12],[x0,seat+12]],1.4,0);}
  var front=RP(cx-sw+22,seat+12,cx+sw-22,sb);FS(s,sol,front,RR(R,2.4,2.8),90);[cx-sw+8,cx-sw+30,cx+sw-30,cx+sw-8].forEach(function(x){var lg=[[x-3,sb],[x-2,fy],[x+2,fy],[x+3,sb]];FS(s,sol,lg,1,0);});
  H(s,[[cx-sw+14,st+6],[cx-sw+30,st+6],[cx-sw+30,seat],[cx-sw+14,seat]],1.6,90);
  // a lamp table and a framed picture
  var tx=cx+sw+RR(R,8,16);if(tx<280){s.push([[tx,fy],[tx,fy-50]]);s.push([[tx+24,fy],[tx+24,fy-50]]);var tt=RP(tx-4,fy-54,tx+28,fy-50);FS(s,sol,tt,1,0);var lp=[[tx+6,fy-54],[tx+8,fy-74],[tx+16,fy-74],[tx+18,fy-54]];FS(s,sol,lp);var shd=[[tx-2,fy-74],[tx+4,fy-98],[tx+20,fy-98],[tx+26,fy-74]];FS(s,sol,shd,2,90);}
  var px=cx+RR(R,-50,10),pic=RP(px-30,22,px+30,st-12);FS(s,sol,pic);s.push(rect(px-24,28,px+24,st-18));var ld=[];hills(ld,R,st-24,14,0);clipIn(s,ld,RP(px-24,28,px+24,st-18));
  room(s,R,fy,sol,'stripes');return s;});

S('Folding screen',['Four Panels of Cranes','Dressing Room Corner','Behind the Screen','Lacquer and Hinges','Paper Garden'],function(R){
  var s=[],sol=[],fy=RR(R,174,180),n=4,x0=RR(R,50,64),pw=RR(R,44,48),ht=RR(R,130,138),zg=RR(R,10,14);
  var tops=[],xs=[];for(var i=0;i<=n;i++){xs.push(x0+i*pw);tops.push(fy-ht+(i%2?zg:0));}
  for(var j=0;j<n;j++){var a=xs[j],b=xs[j+1],ya=tops[j],yb=tops[j+1],ba=fy-(j%2?0:zg*0.6),bb=fy-((j+1)%2?0:zg*0.6);var P=[[a,ba],[a,ya],[b,yb],[b,bb]];FS(s,sol,P);
    var inn=[[a+5,ba-6],[a+5,ya+6],[b-5,yb+6],[b-5,bb-6]];s.push(poly(inn));
    // painting across the panels: branch, blossoms, a bird, distant mountain
    var pa=[];var m=(ya+yb)/2;pa.push(curve([[a+6,m+60],[a+pw*0.4,m+40+j*4],[b-6,m+30-j*6]],5));for(var k=0;k<3;k++){var fp=[a+8+k*12,m+50-k*8-j*4];pa.push(scallop(fp[0],fp[1],3.5,3.5,5,0.3));}
    if(j===1){pa.push(curve([[a+10,m+90],[a+22,m+80],[b-10,m+86]],4));}if(j===2){var bp=[b-20,m+8];pa.push(poly(blob([[bp[0]-10,bp[1]],[bp[0],bp[1]-6],[bp[0]+10,bp[1]-2],[bp[0]+4,bp[1]+4]],4)));pa.push([[bp[0]+10,bp[1]-2],[bp[0]+16,bp[1]-3]]);pa.push([[bp[0]-10,bp[1]],[bp[0]-20,bp[1]+6]]);}
    var mt=[[a+5,m+100],[a+pw*0.5,m+76-((j*7)%10)],[b-5,m+100]];pa.push(mt);var mh=[];H(mh,mt,2,70);A(pa,mh);clipIn(s,pa,inn);
    var fr=[];HX(fr,[P,inn],2.2,90);A(s,fr);s.push(circle(a+3,ba-3,1.5));}
  [0.25,0.75].forEach(function(f){for(var h=1;h<n;h++){var x=xs[h],y=lerp([x,tops[h]],[x,fy],f)[1];s.push(RP(x-1.5,y-4,x+1.5,y+4));}});
  // a robe draped over the top, slippers, floor and wall
  var rx=xs[1],rt=tops[1],robe=[[rx-24,rt+2],[rx+18,rt-4],[rx+22,rt+46],[rx+10,rt+56],[rx-18,rt+60],[rx-26,rt+30]];var rb=blob(robe,5);FS(s,sol,rb);var rf=[];for(var q=0;q<5;q++)rf.push(curve([[rx-16+q*8,rt+2],[rx-18+q*8,rt+30],[rx-14+q*8,rt+56]],4));clipIn(s,rf,rb);
  var slx=xs[n]+RR(R,10,24);[0,1].forEach(function(z){var sl=EP(slx+z*14,fy-3,6,3);FS(s,sol,sl,1,0);});
  room(s,R,fy,sol,'stripes');return s;});

S('Diving helmet',['Brass and Bolts','Down to the Wreck','Copper Bonnet','Twelve Bolts Tight','Air Line Waiting'],function(R){
  var s=[],sol=[],ty=RR(R,174,180),cx=RR(R,130,160),hr=RR(R,52,56),hc=ty-RR(R,64,70);
  var breast=[[cx-hr*1.4,ty],[cx-hr*1.3,ty-26],[cx-hr*0.7,ty-38],[cx+hr*0.7,ty-38],[cx+hr*1.3,ty-26],[cx+hr*1.4,ty]];FS(s,sol,breast);var bl=[];for(var b=0;b<8;b++){var t=b/7,p=lerp([cx-hr*1.3,ty-8],[cx+hr*1.3,ty-8],t);bl.push(circle(p[0],p[1]-(Math.sin(t*PI)*10),2.4));}A(s,bl);
  s.push([[cx-hr*1.35,ty-14],[cx+hr*1.35,ty-14]]);H(s,[[cx+hr*0.5,ty-38],[cx+hr*0.7,ty-38],[cx+hr*1.3,ty-26],[cx+hr*1.4,ty],[cx+hr*0.8,ty]],1.6,90);
  var H0=EP(cx,hc,hr,hr*1.02);FS(s,sol,H0);var seams=[arc(cx,hc,hr*0.98,hr,PI+0.1,TAU-0.1)];A(s,seams);s.push(ellipse(cx,hc+hr*0.75,hr*0.7,6));
  // front window: round port with grille, side windows
  var fw=EP(cx,hc+4,hr*0.42,hr*0.42);FS(s,sol,fw);s.push(circle(cx,hc+4,hr*0.52));s.push(circle(cx,hc+4,hr*0.58));for(var g=-2;g<=2;g++)s.push([[cx+g*hr*0.14,hc+4-hr*0.4],[cx+g*hr*0.14,hc+4+hr*0.4]]);
  var refl=[];refl.push(arc(cx-4,hc,hr*0.3,hr*0.3,PI*1.1,PI*1.45));A(s,refl);
  var bolts=[];for(var k=0;k<8;k++){var a=k*TAU/8;bolts.push(circle(cx+hr*0.55*Math.cos(a),hc+4+hr*0.55*Math.sin(a),1.6));}A(s,bolts);
  [-1,1].forEach(function(d){var sx=cx+d*hr*0.82,sw=EP(sx,hc-2,hr*0.18,hr*0.22);FS(s,sol,sw);s.push(ellipse(sx,hc-2,hr*0.24,hr*0.28));H(s,sw,1,0);});
  var top=EP(cx,hc-hr*0.86,hr*0.18,hr*0.08);s.push(poly(top));var valve=[[cx+hr*0.5,hc-hr*0.7],[cx+hr*0.9,hc-hr*0.95],[cx+hr*1.0,hc-hr*0.85],[cx+hr*0.62,hc-hr*0.6]];FS(s,sol,valve,1.2,0);
  var hose=curve([[cx+hr*0.95,hc-hr*0.9],[cx+hr*1.6,hc-hr*1.1],[cx+hr*2.2,hc-hr*0.3],[cx+hr*2.0,ty-6],[296,ty-2]],8),ht=tube(hose,function(){return 3;});FS(s,sol,ht.P);var hb=[];for(var q=2;q<hose.length-1;q+=3)hb.push([ht.L[q],ht.R[q]]);A(s,hb);
  HX(s,[arc(cx,hc,hr,hr*1.02,-1.3,1.3).concat(arc(cx,hc,hr*0.75,hr*1.02,1.3,-1.3)),fw,EP(cx+hr*0.82,hc-2,hr*0.24,hr*0.28)],RR(R,1.6,1.9),RR(R,70,85));
  // dockside planks, rope coil, harbor water and a wall behind
  var cx2=RR(R,30,60),rp=spiral(cx2,ty+8,2,22,5);rp=rp.map(function(p){return [p[0],ty+8+(p[1]-ty-8)*0.35];});s.push(rp);
  var pk=[];pk.push([[4,ty],[296,ty]]);for(var y=ty+6;y<196;y+=RR(R,6,7))pk.push([[4,y],[296,y]]);for(var x=20;x<290;x+=RR(R,40,60))pk.push([[x,ty],[x+RR(R,-4,4),196]]);behind(s,pk,sol.concat([poly(EP(cx2,ty+8,24,9))]));
  var wl=[];brickS&&A(wl,[brickS(4,4,296,ty,RR(R,16,20),RR(R,8,9))]);behind(s,wl,sol);return s;});

S('Gas street lamp',['Lamplighter\'s Round','Glow on Wet Cobbles','Corner at Dusk','Ladder Bar and Glass','Fog on the Square'],function(R){
  var s=[],sol=[],gy=RR(R,176,182),lx=RR(R,130,170),ph=RR(R,140,150),lt=gy-ph;
  var base=[[lx-14,gy],[lx-14,gy-10],[lx-10,gy-16],[lx-10,gy-34],[lx-6,gy-40]];var bP=base.concat(base.slice().reverse().map(function(p){return [2*lx-p[0],p[1]];}));FS(s,sol,bP);H(s,[[lx+4,gy-40],[lx+6,gy-40],[lx+10,gy-34],[lx+10,gy-16],[lx+14,gy-10],[lx+14,gy],[lx+4,gy]],1.3,90);
  var col=[[lx-4,gy-40],[lx-3,lt+20],[lx+3,lt+20],[lx+4,gy-40]];FS(s,sol,col);var fl=[];for(var x=lx-3;x<=lx+3;x+=2)fl.push([[x,gy-44],[x,lt+24]]);A(s,fl);
  var bar=[[lx-18,lt+28],[lx+18,lt+28]];s.push(bar);s.push([[lx-18,lt+28],[lx-16,lt+32]]);s.push([[lx+18,lt+28],[lx+16,lt+32]]);var col2=[[lx-6,lt+20],[lx-8,lt+14],[lx+8,lt+14],[lx+6,lt+20]];FS(s,sol,col2,1,0);
  var lan=[[lx-8,lt+14],[lx-14,lt-14],[lx+14,lt-14],[lx+8,lt+14]];FS(s,sol,lan);s.push([[lx,lt+14],[lx,lt-14]]);var roof=[[lx-18,lt-14],[lx-8,lt-24],[lx,lt-30],[lx+8,lt-24],[lx+18,lt-14]];FS(s,sol,roof,1.4,0);s.push(circle(lx,lt-34,3));
  s.push(circle(lx,lt,3));for(var r=0;r<8;r++){var a=r*TAU/8;s.push([[lx+5*Math.cos(a),lt+5*Math.sin(a)],[lx+9*Math.cos(a),lt+9*Math.sin(a)]]);}
  // glow rings through the fog (concentric, clipped behind)
  var glow=[];for(var g=1;g<5;g++)glow.push(ellipse(lx,lt,22+g*14,18+g*12));behind(s,glow,sol);
  // wet cobbles with the lamp's reflection, railings, houses in the fog
  var cb=[];for(var yy=gy+5,row=0;yy<196;yy+=RR(R,6,7),row++){cb.push([[4,yy],[296,yy]]);for(var x2=4+(row%2)*9;x2<296;x2+=RR(R,18,22)){if(Math.abs(x2-lx)<10)continue;cb.push([[x2,yy],[x2,Math.min(196,yy+6)]]);}}cb.push([[4,gy],[296,gy]]);var rf=[];H(rf,RP(lx-6,gy+2,lx+6,196),1.2,90);behind(s,cb,[RP(lx-8,gy+1,lx+8,196)]);A(s,rf);
  var rl=[];var ry=gy-RR(R,28,34);rl.push([[4,ry],[296,ry]]);rl.push([[4,gy-6],[296,gy-6]]);for(var x3=8;x3<296;x3+=9)rl.push([[x3,ry-4],[x3,gy-6]]);behind(s,rl,sol.concat(glow.map(function(){return [];}).filter(function(){return false;})));
  var hs=[];var hx=4;while(hx<296){var w=RR(R,46,60),h=RR(R,80,110),P=RP(hx,gy-6-h,Math.min(296,hx+w),gy-6);hs.push(poly(P));for(var wr=0;wr<3;wr++){var wy=gy-6-h+12+wr*24;if(wy>ry-14)break;hs.push(rect(hx+8,wy,hx+18,wy+14));if(hx+w-18>hx+22)hs.push(rect(hx+w-18,wy,hx+w-8,wy+14));}var ch=RP(hx+w*0.3,gy-6-h-12,hx+w*0.3+8,gy-6-h);hs.push(poly(ch));hx+=w;}
  var fog=[];H(fog,RP(4,4,296,gy-6),RR(R,6,7),0);var hsP=[];behind(hsP,hs,[RP(lx-24,4,lx+24,gy)]);behind(s,hsP,sol);behind(s,fog,sol.concat([RP(lx-20,lt-40,lx+20,lt+30)]));return s;});

// ---- Daily Super Sketch: a close-up (a bird's nest with eggs, fills the frame, no horizon) ----
var MASTER={name:'Bird\'s nest with eggs',titles:['Four Blue Promises','Woven in the Hawthorn','Spring Clutch','Twigs, Moss and Shell','Waiting for the Hatch','Cradle in the Fork'],build:function(R){
  var s=[],sol=[],cx=RR(R,144,156),ry0=RR(R,80,86),rx=RR(R,118,124),rr=RR(R,32,36),bot=RR(R,178,184);
  // nest silhouette: rim ellipse on top, bowl below
  var rimTop=arc(cx,ry0,rx,rr,PI,TAU),bowl=cubic([cx+rx,ry0],[cx+rx*1.02,ry0+(bot-ry0)*0.8],[cx+rx*0.45,bot],[cx,bot],18).concat(cubic([cx,bot],[cx-rx*0.45,bot],[cx-rx*1.02,ry0+(bot-ry0)*0.8],[cx-rx,ry0],18).slice(1));
  var nest=rimTop.concat(bowl.slice(1));nest.pop();
  var cupO=EP(cx,ry0+2,rx*0.74,rr*0.66),cupP=cupO;
  // eggs in the cup (drawn first so the cup texture stays behind them)
  var eggs=[],ne=RI(R,3,4);for(var i=0;i<ne;i++){var ex=cx-rx*0.42+i*rx*0.84/(ne-1)+RR(R,-6,6),ey=ry0+RR(R,-4,6),ew=RR(R,13,15),eh=RR(R,18,20),an=RR(R,-0.9,0.9);
    var eg=[];for(var k=0;k<36;k++){var t=k/36*TAU,c=Math.cos(t),sn=Math.sin(t);eg.push([ew*c*(1-0.16*sn),eh*sn]);}eg=rotateAbout(eg.map(function(p){return [ex+p[0],ey+p[1]];}),ex,ey,an+PI/2);eggs.push(eg);}
  eggs.forEach(function(eg,i){FS(s,sol,eg);var c0=eg[0],c1=eg[18];var half=eg.slice(4,22);H(s,half.concat([lerp(eg[22],eg[4],0.5)]),RR(R,1.5,1.8),RR(R,30,60));
    var sp=[];for(var k=0;k<1;k++){var p=lerp(eg[Math.floor(RR(R,0,36))],lerp(c0,c1,0.5),RR(R,0.25,0.7));sp.push([[p[0],p[1]],[p[0]+RR(R,1.2,2.4),p[1]+RR(R,-1,1)]]);}A(s,sp);s.push(arc((c0[0]+c1[0])/2-3,(c0[1]+c1[1])/2-4,4,3,PI*1.1,PI*1.6));});
  // cup lining: curved rows of fine grass following the bowl, behind the eggs
  var lin=[];for(var k2=0;k2<8;k2++){var f=0.25+k2*0.1;lin.push(arc(cx,ry0+2+rr*0.2*f,rx*0.74*(1-f*0.45),rr*0.66*(1-f*0.35),0.15,PI-0.15));}var lb=[];behind(lb,[serp(lin)],eggs);clipIn(s,lb,cupP);var lh=[];H(lh,cupP,RR(R,2.6,3),RR(R,-8,8));behind(s,[],[]);clipIn(s,lh.filter(function(_,j){return j%1===0;}),cupP,eggs);
  s.push(poly(cupO));s.push(arc(cx,ry0+2,rx*0.8,rr*0.74,PI,TAU));
  // woven twigs: contour rows around the bowl with wobble, and crossing sticks
  var ring=[];for(var c=0;c<RI(R,22,24);c++){var y=ry0+6+c*(bot-ry0-10)/23,f=(y-ry0)/(bot-ry0),hw=rx*(1.0-0.62*f*f),pts=[];for(var a=0;a<=24;a++){var u=a/24;pts.push([cx-hw+2*hw*u,y+10*Math.sin(u*PI)*(1-f)+RR(R,-1.6,1.6)]);}ring.push(curve(pts,2));}
  var rimRows=[];for(var r2=0;r2<6;r2++){rimRows.push(arc(cx,ry0,rx*(0.8+r2*0.04),rr*(0.74+r2*0.055),PI*1.02,TAU*0.99).map(function(p){return [p[0]+RR(R,-1,1),p[1]+RR(R,-1,1)];}));}
  var tw=[];tw.push(serp(ring));tw.push(serp(rimRows));clipIn(s,tw,nest,[cupO]);
  var st=[];for(var k3=0;k3<RI(R,12,15);k3++){var px=cx+RR(R,-rx,rx),py=RR(R,ry0-rr*0.8,bot-6),an2=RR(R,-0.7,0.7)+(R()<0.5?0:PI),L=RR(R,30,60),a0=[px,py],b0=[px+L*Math.cos(an2),py+L*Math.sin(an2)*0.6];st.push(quad(a0,[(a0[0]+b0[0])/2,(a0[1]+b0[1])/2+RR(R,-6,6)],b0,8));
    if(R()<0.35){var m=lerp(a0,b0,0.6);st.push([m,[m[0]+RR(R,-8,8),m[1]-RR(R,4,9)]]);}}clipIn(s,st,nest.map(function(p){return [cx+(p[0]-cx)*1.06,ry0+(p[1]-ry0)*1.08];}),[cupO]);
  var stray=[];for(var k4=0;k4<RI(R,8,10);k4++){var a3=RR(R,0,TAU),p0=[cx+rx*1.0*Math.cos(a3),(a3>PI?ry0+rr*Math.sin(a3):ry0+(bot-ry0)*Math.sin(a3))];if(p0[1]<ry0-rr+2)continue;stray.push([p0,[p0[0]+Math.cos(a3)*RR(R,10,22),p0[1]+Math.sin(a3)*RR(R,6,14)]]);}
  var shR=bowl.slice(0,19).concat(quad([cx,bot],[cx+rx*0.62,bot-14],[cx+rx*0.8,ry0+rr*0.6],12).slice(1));H(s,shR,RR(R,2.4,2.8),RR(R,55,70));sol.push(nest);
  // a soft feather caught on the rim
  var fa=[cx+rx*RR(R,0.5,0.8),ry0-rr*0.6],fb=[fa[0]+RR(R,26,34),fa[1]-RR(R,22,30)],fL=lens(fa,fb,6);FS(s,sol,fL);var bar=[];for(var b2=1;b2<9;b2++){var m2=lerp(fa,fb,b2/9);bar.push(m2,[m2[0]-5,m2[1]-3],m2,[m2[0]+5,m2[1]+2],m2);}s.push(bar);
  // the fork of the branch carrying the nest
  var fork=[];[[[4,196],[60,178],[cx-rx*0.6,bot-8]],[[296,190],[250,176],[cx+rx*0.55,bot-6]],[[cx+10,196],[cx+4,bot+4],[cx-6,bot-4]]].forEach(function(br,i){var c2=curve(br,8),tb=tube(c2,function(u){return 7-3*u;});FS(s,sol,tb.P);H(s,tb.R.concat(c2.slice().reverse()),1.5,i?20:-20);
});
  // hawthorn leaves and berries around the frame edges
  var leafB=[[[4,26],[50,34],[100,18]],[[296,22],[250,32],[204,16]]];leafB.forEach(function(br){var c3=curve(br,8);s.push(c3);for(var k6=3;k6<c3.length;k6+=RI(R,6,8)){var p=c3[k6],e=[p[0]+RR(R,-22,22),p[1]+RR(R,18,30)*(R()<0.6?1:-1)];var L2=lens(p,e,RR(R,7,9));FS(s,sol,L2);s.push([p,e]);}
    var bx=c3[Math.floor(c3.length*0.5)];for(var b3=0;b3<3;b3++){var bc=[bx[0]+RR(R,-10,10),bx[1]+RR(R,8,18)];s.push([bx,bc]);var be=EP(bc[0],bc[1],3.4,3.4);FS(s,sol,be,0.9,30);}});
  for(var k7=0;k7<RI(R,4,6);k7++){var side=k7%2?1:-1,p7=[side>0?RR(R,240,290):RR(R,10,60),RR(R,90,160)],e7=[p7[0]-side*RR(R,14,24),p7[1]+RR(R,-14,14)];leafL(s,sol,p7,e7,RR(R,6,8),1.6);}
  // dappled shade behind
  var bg=[];H(bg,RP(4,4,296,196),RR(R,8,9),RR(R,30,45));var bg2=[];behind(bg2,bg,sol);A(s,bg2);return s.filter(function(x){return x&&x.length>1;});}};

return {number:10,startedOn:"2026-11-20",notes:"Batch 10 (Nov 20). Review of Nov 18-19 plays: Old apothecary shop held its 20 minutes - shelves of jars, counter and scales all read; Allotment gardens from above was also strong. Strong: Welsh dresser, aerial tramway, classical rotunda, moon gate, ship's wheel, roller coaster, art deco skyscraper, dressing table, onion-domed church. Weak: gecko, slot canyon, beaver lodge and windswept hawthorn unreadable; lunar rover and lemons sparse; mallet and chisels and sushi cluttered; grasshopper had a long connector; zebra stiff. Tabletop scenes let the wall stripes dominate - make the object fill the frame. Lessons kept: one line, keep extras touching; clip backgrounds with behind()/clipIn(); animals need a bold plain silhouette with legs as clean rectangles and one shaded side; one-stroke zigzags and fewer tiny strokes keep the planner fast (many 2-point hatch bits are the main cost). New: sheep(), vine(), heartLeaf(), spokeW(), cobbles(), facade(), craneB(). Daily Super Sketch: Bird's nest with eggs, a close-up filling the frame (type 2); previous two were Old apothecary shop (type 1) and Allotment gardens from above (type 3).",master:MASTER||undefined,subjects:SUBJ};
})();
