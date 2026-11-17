// Endless Etch — batch 8. 48 subjects for 2026-11-18 (each plays about three times, shuffled per round) plus the Daily Super Sketch.
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

// ---- chunk A: buildings, places, landscapes, plants ----
function onion(cx,b,w,h){var L=cubic([cx-w*0.62,b],[cx-w*1.3,b-h*0.32],[cx-w*0.25,b-h*0.62],[cx,b-h],16),Rr=cubic([cx,b-h],[cx+w*0.25,b-h*0.62],[cx+w*1.3,b-h*0.32],[cx+w*0.62,b],16);return L.concat(Rr.slice(1));}
function crossT(s,x,y,h){s.push([[x,y],[x,y-h]]);s.push([[x-h*0.3,y-h*0.7],[x+h*0.3,y-h*0.7]]);s.push([[x-h*0.22,y-h*0.35],[x+h*0.22,y-h*0.45]]);return s;}

S('Post mill on a hill',['Turned to the Wind','Four Sails, One Post',"Miller's Ladder",'Heath Mill','Grist on the Rise'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,182,188),cx=RR(R,135,165),hh=RR(R,26,32),hill=[];
  for(var x=4;x<=296.1;x+=4)hill.push([x,gy-hh*Math.exp(-Math.pow((x-cx)/RR(R,70,75),2))-4]);var hy=interpY(hill,cx);
  var bw=RR(R,40,46),bh=RR(R,54,60),by=hy-RR(R,22,26),bt=by-bh,hub=[cx-bw*0.15,bt+14];
  // trestle and post
  s.push([[cx-28,hy+2],[cx-2,by]]);s.push([[cx+28,hy+2],[cx+2,by]]);FS(s,sol,RP(cx-3,hy+2,cx+3,by));s.push([[cx-34,hy+2],[cx+34,hy+2]]);s.push([[cx-16,hy-8],[cx+16,hy-8]]);
  // ladder and tail pole
  var lx=cx+bw*0.18;s.push([[lx-5,by],[lx+14,hy+4]]);s.push([[lx+5,by],[lx+24,hy+4]]);var lr=[];for(var k=1;k<6;k++){var t=k/6;lr.push([[lx-5+19*t,by+(hy+4-by)*t],[lx+5+19*t,by+(hy+4-by)*t]]);}A(s,lr);
  s.push([[cx+bw/2,by-4],[cx+bw/2+RR(R,30,40),hy+3]]);
  // body: weatherboarded box with curved roof
  var body=[[cx-bw/2,by],[cx-bw/2,bt]].concat(arc(cx,bt,bw/2,RR(R,10,14),PI,TAU).slice(1)).concat([[cx+bw/2,by]]);SOL(s,sol,body);
  var D=RP(lx-5,by,lx+5,by-16);s.push(poly(D));H(s,D,1.2,90);var Wn=RP(cx-bw/2+6,bt+24,cx-bw/2+14,bt+34);s.push(poly(Wn));H(s,Wn,1.2,45);
  clipIn(s,[rows(cx-bw/2,cx+bw/2,bt+3,by-2,RR(R,3.6,4.2))],body,[D,Wn]);
  H(s,[[cx+bw*0.18,bt+2],[cx+bw/2,bt+2],[cx+bw/2,by],[cx+bw*0.18,by]],RR(R,1.6,2),RR(R,60,75));
  // sails
  var a0=R()*PI/2,L=RR(R,70,78);s.push(circle(hub[0],hub[1],4));
  for(var q=0;q<4;q++){var a=a0+q*PI/2,u=[Math.cos(a),Math.sin(a)],n=[-u[1],u[0]],w=RR(R,12,15);
    function P(t,v){return [hub[0]+u[0]*t+n[0]*v,hub[1]+u[1]*t+n[1]*v];}
    s.push([P(4,0),P(L,0)]);var fr=[P(L*0.28,0),P(L*0.28,w),P(L,w),P(L,0)];SOL(s,sol,fr);
    var lat=[P(L*0.28,w*0.5),P(L,w*0.5)],zg=[];for(var j=0;j<=10;j++){var tt=L*0.28+(L*0.72)*j/10;zg.push(j%2?P(tt,0):P(tt,w));}s.push(lat);s.push(zg);
    if(q%2===0)H(s,fr,RR(R,2.2,2.8),a*180/PI+90);}
  // hill and ground
  s.push(hill);H(bg,[[4,196]].concat(hill).concat([[296,196]]),RR(R,3.6,4.4),RR(R,8,20)*sgn(R));
  s.push(tufts(RR(R,10,40),RR(R,80,110),interpY(hill,60)+2,6,R));
  return fin(s,R,bg,sol,gy);});

S('Art deco skyscraper',['Setbacks and Spire','Chrome Crown','Forty Floors of Stone','Zigzag Modern','Evening Shift Begins'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,178,184),cx=RR(R,130,170),tiers=[[RR(R,44,48),0,RR(R,62,70)],[RR(R,34,37),0,RR(R,108,116)],[RR(R,24,27),0,RR(R,140,146)]];
  var prev=gy;tiers.forEach(function(T,i){var w=T[0],top=gy-T[2],P=RP(cx-w,prev,cx+w,top);FS(s,sol,P);
    clipIn(s,[zz(cx-w+3,cx+w-3,top+2,prev-2,RR(R,4.2,5))],P,[]);H(s,RP(cx+w*0.45,top,cx+w,prev),RR(R,1.6,1.9),90);
    for(var y=top+12;y<prev-4;y+=RR(R,14,18))s.push([[cx-w,y],[cx+w,y]]);prev=top;});
  var ct=gy-tiers[2][2];for(var k=0;k<3;k++){var r=22-k*6.5;var Ar=[[cx-r,ct-k*7]].concat(arc(cx,ct-k*7,r,r*0.7,PI,TAU)).concat([[cx+r,ct-k*7]]);SOL(s,sol,Ar);
    for(var j=1;j<6;j++){var an=PI+j*PI/6;s.push([[cx+r*0.45*Math.cos(an),ct-k*7+r*0.3*Math.sin(an)],[cx+r*Math.cos(an),ct-k*7+r*0.7*Math.sin(an)]]);}}
  var sp=[[cx-3,ct-24],[cx,RR(R,8,14)],[cx+3,ct-24]];FS(s,sol,sp);
  var D=RP(cx-12,gy,cx+12,gy-24);s.push(poly(D));s.push(arc(cx,gy-24,12,10,PI,TAU));H(s,D,1.3,90);
  // neighbours
  var xs=[[4,cx-tiers[0][0]-RR(R,4,10)],[cx+tiers[0][0]+RR(R,4,10),296]];xs.forEach(function(X,i){var x=X[0];while(x<X[1]-10){var w=Math.min(X[1]-x,RR(R,30,48)),h=RR(R,40,90),P=RP(x,gy,x+w,gy-h);bg.push(poly(P));
    var G=[];H(G,RP(x+3,gy-h+5,x+w-3,gy-6),RR(R,6,8),0);H(G,RP(x+3,gy-h+5,x+w-3,gy-6),RR(R,7,9),90);clipIn(bg,G,P,[]);if(R()<0.5)bg.push(merlons(x,x+w,gy-h,3,6));x+=w+RR(R,0,4);}});
  behind(s,bg,sol);bg=[];road(s,R,gy);sol.push(RP(4,gy,296,196));
  return sky(s,R,gy-1,sol);});

S('Moated manor house',['Across the Moat','Mullions and Ivy','The Old Hall','Bridge to the Porch','Tall Chimneys'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,128,134),cx=RR(R,135,165),hw=RR(R,92,100),eh=RR(R,42,48),ey=gy-eh,ry=ey-RR(R,26,30);
  var wallP=RP(cx-hw,gy,cx+hw,ey);SOL(s,sol,wallP);var roof=[[cx-hw-4,ey],[cx-hw+20,ry],[cx+hw-20,ry],[cx+hw+4,ey]];FS(s,sol,roof,RR(R,2.4,3),RR(R,20,35)*sgn(R));
  var gw=RR(R,24,28),gT=ry-RR(R,14,20),gab=[[cx-gw,gy],[cx-gw,ey+2],[cx,gT],[cx+gw,ey+2],[cx+gw,gy]];FS(s,sol,gab);H(s,[[cx,gT],[cx+gw,ey+2],[cx+gw,gy],[cx,gy]],RR(R,1.8,2.2),90);
  var holes=[];[-0.78,-0.5,0.5,0.78].forEach(function(f){var x=cx+hw*f,W=RP(x-8,ey+8,x+8,ey+24);holes.push(W);s.push(rect(x-8,ey+8,x+8,ey+24));s.push(zz(x-8,x+8,ey+8,ey+24,4));s.push([[x-8,ey+16],[x+8,ey+16]]);});
  var dw=RP(cx-7,gy,cx+7,gy-18);s.push(poly(dw));s.push(arc(cx,gy-18,7,6,PI,TAU));H(s,dw,1.2,90);var gwin=RP(cx-6,ey+2,cx+6,ey-10);s.push(poly(gwin));s.push(zz(cx-6,cx+6,ey-10,ey+2,3));
  HX(s,[wallP].concat(holes).concat([gab.slice(0,-1)]),RR(R,4,4.6),RR(R,40,55));
  [-0.62,-0.3,0.3,0.62].forEach(function(f,i){if(R()<0.8){var x=cx+hw*f,c=RP(x-4,ry+(ey-ry)*0.4,x+4,ry-RR(R,14,20));FS(s,sol,c);s.push([[x-5.5,c[2][1]],[x+5.5,c[2][1]]]);}});
  // moat bank, bridge, water
  var bank=RP(4,gy,296,gy+7);SOL(s,sol,bank);s.push(brickS(4,gy,296,gy+7,9,3.5));
  var bw=RR(R,16,20),bd=[[cx-bw,196],[cx-bw,gy+7],[cx+bw,gy+7],[cx+bw,196]],arch=[[cx-bw+4,196]].concat(arc(cx,196,bw-4,RR(R,28,34),PI,TAU)).concat([[cx+bw-4,196]]);
  SOL(s,sol,bd);s.push(arch);s.push([[cx-bw,gy+12],[cx+bw,gy+12]]);H(s,[[cx-bw,gy+12],[cx+bw,gy+12],[cx+bw,196]].concat(arc(cx,196,bw-4,RR(R,28,34),0,-PI)).concat([[cx-bw,196]]),2.2,90);
  waterIn(bg,R,RP(4,gy+7,296,196),gy+12,194,RR(R,5,6));
  for(var t=0;t<2;t++){var tx=t?RR(R,cx+hw+8,288):RR(R,12,cx-hw-8);if(tx>8&&tx<292)treeR(s,R,tx,gy,RR(R,13,17),2.2);}
  hills(bg,R,ey+10,RR(R,14,22),RR(R,4,5),[],RR(R,10,20));
  return fin(s,R,bg,sol,gy);});

S('Classical rotunda',['Temple of the Winds','Eight Columns, One Dome','Folly by the Lake','Afternoon in the Park','Lantern and Drum'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,174,180),cx=RR(R,135,165),rw=RR(R,58,64),ry=rw*0.18;
  for(var k=0;k<3;k++){var w=rw+16-k*5,y=gy-k*5,P=[[cx-w,y],[cx-w,y-5],[cx+w,y-5],[cx+w,y]];SOL(s,sol,P);s.push(poly(P));}
  var cb=gy-15,ch=RR(R,58,64),et=cb-ch,n=7;
  var ent=RP(cx-rw-4,et,cx+rw+4,et-12);FS(s,sol,ent);s.push([[cx-rw-4,et-4],[cx+rw+4,et-4]]);s.push(comb(cx-rw-4,cx+rw+4,et-8,2.5,4));
  for(var i=0;i<n;i++){var x=cx-rw+i*(2*rw)/(n-1),c=RP(x-4,cb,x+4,et);FS(s,sol,c);s.push([[x-5.5,et],[x-5.5,et+3],[x+5.5,et+3],[x+5.5,et]]);s.push([[x-5,cb],[x-5,cb-3],[x+5,cb-3],[x+5,cb]]);s.push([[x-1.4,cb-3],[x-1.4,et+3]]);s.push([[x+1.4,cb-3],[x+1.4,et+3]]);
    if(i<n-1){var nx=x+(2*rw)/(n-1);var gap=RP(x+4,cb,nx-4,et+3);var b=[];H(b,gap,RR(R,3.5,4.2),90);clipIn(s,b,gap,[]);}}
  var dr=rw+2,dome=[[cx-dr,et-12]].concat(arc(cx,et-12,dr,dr*0.62,PI,TAU)).concat([[cx+dr,et-12]]);SOL(s,sol,dome);
  for(var j=1;j<6;j++){var f=-1+j/3;s.push(quad([cx+dr*f,et-12],[cx+dr*f*0.95,et-12-dr*0.45],[cx+dr*f*0.2,et-12-dr*0.62]));}
  H(s,[[cx+dr*0.25,et-12]].concat(arc(cx,et-12,dr,dr*0.62,-PI*0.4,0)).concat([[cx+dr*0.25,et-12]]),RR(R,2,2.4),-65);
  var lt=et-12-dr*0.62,ln=RP(cx-7,lt+2,cx+7,lt-14);FS(s,sol,ln);s.push(zz(cx-7,cx+7,lt-12,lt,3.5));s.push(arc(cx,lt-14,8,7,PI,TAU));s.push([[cx,lt-21],[cx,lt-27]]);
  var lawn=[];H(lawn,RP(4,gy,296,196),RR(R,3.6,4.4),RR(R,8,20)*sgn(R));behind(bg,lawn,[[[cx-12,gy],[cx+12,gy],[cx+30,196],[cx-30,196]]]);s.push([[cx-12,gy],[cx-30,196]]);s.push([[cx+12,gy],[cx+30,196]]);s.push([[4,gy],[296,gy]]);
  [[RR(R,8,30),cx-rw-20],[cx+rw+20,RR(R,270,292)]].forEach(function(X){if(X[1]-X[0]>14){var hd=[[X[0],gy]].concat(curve([[X[0],gy-14],[(X[0]+X[1])/2,gy-RR(R,18,24)],[X[1],gy-14]],8)).concat([[X[1],gy]]);FS(s,sol,hd,RR(R,2,2.6),RR(R,40,60));}});
  var tx=pick(R,[RR(R,20,50),RR(R,250,280)]);var tr=[];treeR(tr,R,tx,gy-12,RR(R,18,22),2.4);behind(bg,tr,sol);
  return fin(s,R,bg,sol,gy);});

S('Wooden roller coaster',['First Drop','Click, Click, Click','Timber and Screams','Boardwalk Thrills','Hands in the Air'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,182,188),h1=RR(R,26,40),xp=RR(R,70,100);
  var ctrl=[[4,RR(R,140,150)],[xp-40,RR(R,110,120)],[xp,h1],[xp+32,RR(R,120,140)],[xp+70,RR(R,150,160)],[xp+110,RR(R,80,100)],[xp+140,RR(R,70,86)],[xp+175,RR(R,120,135)],[296,RR(R,110,125)]];
  var tr=curve(ctrl.filter(function(p){return p[0]<=296;}),10),tr2=tr.map(function(p){return [p[0],p[1]+4];});s.push(tr);s.push(tr2);
  var trs=tr2.concat([[296,gy],[4,gy]]);sol.push(trs);
  var posts=[],z=[],step=RR(R,8,9),d=1;for(var x=6;x<=294;x+=step){var ty=interpY(tr2,x);posts.push([[x,ty],[x,gy]]);z.push(d>0?[x,ty]:[x,gy]);d=-d;}A(s,posts);s.push(z);
  var led=[];for(var y=gy-14;y>20;y-=RR(R,14,18))led.push([[4,y],[296,y]]);clipIn(s,led,trs,[]);
  // cars on the first climb
  var ca=0.3;for(var c=0;c<3;c++){var x0=xp-36+c*11,y0=interpY(tr,x0),y1=interpY(tr,x0+9),car=[[x0,y0],[x0+9,y1],[x0+9,y1-6],[x0,y0-6]];FS(s,sol,car,1.4,0);s.push(circle(x0+4.5,(y0+y1)/2-9,2.5));s.push([[x0+3,(y0+y1)/2-11],[x0+1,(y0+y1)/2-17]]);}
  s.push(comb(4,296,gy,RR(R,3,5),RR(R,6,9)));gnd(bg,R,gy);
  return fin(s,R,bg,sol,gy);});

S('Aerial tramway',['Halfway Across','Cabin Over the Pines','Cable to the Summit','Valley Floor Below','Up in Six Minutes'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,182,188),pk=peaks(bg,R,RR(R,120,130),RR(R,60,80),RI(R,3,4),RR(R,2.2,2.8));
  var us=[RR(R,20,30),RR(R,38,48)],ls=[RR(R,250,262),RR(R,150,160)];
  var top=RP(us[0]-14,us[1]+20,us[0]+20,us[1]);FS(s,sol,top);s.push([[us[0]-18,us[1]],[us[0]+2,us[1]-10],[us[0]+24,us[1]]]);H(s,RP(us[0]+8,us[1]+20,us[0]+20,us[1]),1.6,90);s.push([[us[0]-14,us[1]+20],[us[0]-14,gy-80]]);s.push([[us[0]+20,us[1]+20],[us[0]+24,gy-80]]);
  var bot=RP(ls[0]-16,gy,ls[0]+30,ls[1]);FS(s,sol,bot);s.push([[ls[0]-20,ls[1]],[ls[0]+7,ls[1]-12],[ls[0]+34,ls[1]]]);for(var w=0;w<3;w++){var W=RP(ls[0]-10+w*14,ls[1]+8,ls[0]-2+w*14,ls[1]+18);s.push(poly(W));H(s,W,1.2,45);}
  var tx=RR(R,120,150),tb=gy,tt=RR(R,70,80),tw=[[tx-14,tb],[tx-4,tt],[tx+4,tt],[tx+14,tb]];FS(s,sol,tw);var z=[],d=1;for(var y=tt+4;y<tb;y+=8){var f=(y-tt)/(tb-tt),hw=4+10*f;z.push(d>0?[tx-hw,y]:[tx+hw,y]);d=-d;}s.push(z);s.push([[tx-12,tt],[tx+12,tt]]);
  var a=[us[0]+20,us[1]+4],b=[tx,tt],c=[ls[0],ls[1]+4],c1=quad(a,[(a[0]+b[0])/2,(a[1]+b[1])/2+12],b,20),c2=quad(b,[(b[0]+c[0])/2,(b[1]+c[1])/2+8],c,20);
  s.push(c1.concat(c2.slice(1)));s.push(translate(c1.concat(c2.slice(1)),0,3));
  var cab=c1[RI(R,7,13)],cw=RR(R,16,19),ch=RR(R,14,16);s.push([[cab[0]-3,cab[1]],[cab[0]+3,cab[1]]]);s.push(circle(cab[0]-2,cab[1]+1,1.5));s.push([[cab[0],cab[1]+2],[cab[0],cab[1]+16]]);
  var C=[[cab[0]-cw,cab[1]+16],[cab[0]+cw,cab[1]+16],[cab[0]+cw-2,cab[1]+16+ch*2],[cab[0]-cw+2,cab[1]+16+ch*2]];FS(s,sol,C);s.push(zz(cab[0]-cw+3,cab[0]+cw-3,cab[1]+18,cab[1]+16+ch,4));s.push([[cab[0]-cw+1,cab[1]+16+ch],[cab[0]+cw-1,cab[1]+16+ch]]);H(s,RP(cab[0]-cw+3,cab[1]+18+ch,cab[0]+cw-3,cab[1]+14+ch*2),RR(R,1.6,2),0);
  for(var p=0;p<RI(R,11,15);p++){var px=RR(R,10,290);if(Math.abs(px-tx)>18&&Math.abs(px-ls[0]-7)>30)pineT(s,px,gy,RR(R,0.7,1.15),2.2);}hills(bg,R,gy-6,RR(R,26,36),RR(R,3.4,4),[],RR(R,-25,-10));
  gnd(bg,R,gy);return fin(s,R,bg,sol,gy);});

S('Moon gate in a garden wall',['Round Doorway','Through the Circle','Walled Garden, Spring','Step In, Look Out','A Bridge Beyond'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,166,172),wt=RR(R,30,38),cx=RR(R,130,170),cy=RR(R,98,106),r=RR(R,52,58);
  var wallP=RP(4,gy,296,wt),moon=EP(cx,cy,r,r);s.push([[4,wt],[296,wt]]);s.push(poly(moon));s.push(circle(cx,cy,r+5));
  var cop=[[4,wt],[296,wt],[296,wt-6],[4,wt-6]];s.push(poly(cop));s.push(scallopRows(4,296,wt-1,wt-1,6,4));H(s,RP(4,wt-6,296,wt-10),1.2,0);s.push([[4,wt-10],[296,wt-10]]);
  var wb=[];H(wb,wallP,RR(R,5.5,6.5),RR(R,80,100));clipIn(s,wb,wallP,[EP(cx,cy,r+5,r+5)]);
  // view through the gate: far shore, little arched bridge, pond
  var inn=EP(cx,cy,r-0.5,r-0.5),sh=cy+RR(R,4,10);var view=[];view.push([[cx-r,sh],[cx+r,sh]]);var by=sh+RR(R,10,14),bx=cx+RR(R,-14,14);
  view.push([[bx-36,by]].concat(arc(bx,by,36,RR(R,16,20),PI,TAU)).concat([[bx+36,by]]));view.push([[bx-34,by-3]].concat(arc(bx,by-3,34,RR(R,16,20),PI,TAU)).concat([[bx+34,by-3]]));
  for(var k=-3;k<=3;k++){var px=bx+k*10;view.push([[px,by-Math.sqrt(Math.max(0,1-Math.pow(k*10/36,2)))*18],[px,by-Math.sqrt(Math.max(0,1-Math.pow(k*10/36,2)))*18-7]]);}
  var wv=waterS(R,cx-r,cx+r,by+4,cy+r,4.6,0.9);view.push(wv);var sk=rows(cx-r,cx+r,cy-r,sh-8,RR(R,6,7));view.push(sk);
  view.push(curve([[cx-r,sh-2],[cx-r*0.5,sh-14],[cx,sh-6],[cx+r*0.6,sh-16],[cx+r,sh-4]],6));
  clipIn(s,view,inn,[]);
  // paving and bamboo
  furrows(bg,R,gy,RI(R,10,14),cx);var pv=[];for(var y=gy+6;y<196;y+=RR(R,7,9))pv.push([[4,y],[296,y]]);A(bg,pv);
  [[RR(R,14,30),cx-r-18],[cx+r+18,RR(R,270,288)]].forEach(function(X){for(var b=0;b<RI(R,3,4);b++){var x=X[0]+(X[1]-X[0])*b/3,top=RR(R,40,70),cn=[[x,gy]];for(var y=gy;y>top;y-=RR(R,12,16))cn.push([x+RR(R,-1,1),y],[x-2,y],[x+2,y],[x,y]);s.push(cn);
    for(var l=0;l<3;l++){var ly=RR(R,top+6,gy-30),d=sgn(R);s.push(lens([x,ly],[x+d*RR(R,14,20),ly+RR(R,4,9)],2.2));}}});
  behind(s,bg,[EP(cx,cy,r+5,r+5)]);s.push([[4,gy],[296,gy]]);
  return s;});

S('Onion-domed church',['Five Gold Domes','Bells Above the Birches','Saint of the Village','Painted Domes','Feast Day Morning'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,174,180),cx=RR(R,125,160),bw=RR(R,40,46),bt=gy-RR(R,62,70);
  var body=RP(cx-bw,gy,cx+bw,bt);SOL(s,sol,body);s.push([[cx-bw-3,bt],[cx+bw+3,bt]]);s.push([[cx-bw,bt+6],[cx+bw,bt+6]]);
  var holes=[];[-0.55,0,0.55].forEach(function(f){var x=cx+bw*f,W=archP(x,bt+40,5,14);holes.push(W);s.push(W);s.push([[x,bt+40],[x,bt+26]]);});
  var D=archP(cx,gy,9,18);holes.push(D);s.push(D);H(s,D,1.2,90);H(s,RP(cx+bw*0.5,bt+6,cx+bw,gy),RR(R,1.8,2.2),90);
  var dr=RP(cx-16,bt,cx+16,bt-24);FS(s,sol,dr);s.push(zz(cx-14,cx+14,bt-20,bt-6,4.5));
  function dome(x,b,w,h,g){var O=onion(x,b,w,h);FS(s,sol,O);var bands=[];for(var k=1;k<5;k++){var yy=b-h*k*0.17;bands.push([[x-w*1.2,yy],[x+w*1.2,yy]]);}clipIn(s,bands,O,[]);var hs=[];H(hs,[[x,b],[x+w*1.3,b-h*0.3],[x,b-h]],g,-60);clipIn(s,hs,O,[]);crossT(s,x,b-h,h*0.32);}
  dome(cx,bt-24,22,RR(R,40,46),1.8);
  [[-1,0.75],[1,0.75]].forEach(function(o){var x=cx+o[0]*bw*o[1],dm=RP(x-8,bt,x+8,bt-12);FS(s,sol,dm);dome(x,bt-12,10,RR(R,22,26),1.6);});
  var tx=cx+bw+RR(R,26,34),tw=RR(R,14,16),tb=gy-RR(R,92,102);if(tx+tw<290){var T=RP(tx-tw,gy,tx+tw,tb);FS(s,sol,T);for(var l=0;l<3;l++)s.push([[tx-tw,gy-30-l*24],[tx+tw,gy-30-l*24]]);var bel=archP(tx,tb+22,6,8);s.push(bel);s.push(circle(tx,tb+12,3));
    var tent=[[tx-tw-2,tb],[tx,tb-RR(R,34,40)],[tx+tw+2,tb]];FS(s,sol,tent,RR(R,1.8,2.2),70);dome(tx,tb-34,6,14,1.4);s.push([[cx+bw,gy-24],[tx-tw,gy-24]]);}
  for(var b=0;b<RI(R,1,2);b++){var x=RR(R,12,cx-bw-14);if(x>10){var top=RR(R,70,100);var tr=[[x,gy],[x,top]];s.push(tr);s.push([[x+2,gy],[x+2,top+4]]);for(var m=0;m<5;m++){var my=RR(R,top+10,gy-10);s.push([[x,my],[x+2,my+1]]);}var cr=blob([[x,top-10],[x+16,top+8],[x+10,top+34],[x-10,top+34],[x-16,top+8]],5);var ch=[];H(ch,cr,2.4,70);A(s,ch);s.push(poly(cr));}}
  gnd(bg,R,gy);return fin(s,R,bg,sol,gy);});

// ---- plants and landscapes ----
S('Agave',['Century Plant','Blue Rosette','Spines to the Sky','Desert Garden','Slow Bloom'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,178,184),cx=RR(R,130,170),by=gy-RR(R,28,34),n=RI(R,9,12),leaves=[];
  for(var i=0;i<n;i++){var t=i/(n-1),a=-PI*(0.08+0.84*t)+RR(R,-0.06,0.06),front=1-Math.abs(t-0.5)*2,L=RR(R,60,84)*(0.75+0.35*(1-front)),w=RR(R,10,13);leaves.push({a:a,L:L,w:w,o:front+R()*0.3});}
  leaves.sort(function(p,q){return q.o-p.o;});
  leaves.forEach(function(lf,j){var tip=[cx+Math.cos(lf.a)*lf.L,by+Math.sin(lf.a)*lf.L*0.95];var base=[cx+Math.cos(lf.a)*6,by+2];var P=lens(base,tip,lf.w);var tmp=[poly(P)];
    var half=quad(base,[(base[0]+tip[0])/2-Math.sin(lf.a)*lf.w,(base[1]+tip[1])/2+Math.cos(lf.a)*lf.w],tip,10).concat([[(base[0]+tip[0])/2,(base[1]+tip[1])/2]]);H(tmp,half,RR(R,1.6,2.1),lf.a*180/PI+30);
    var teeth=[];for(var k=1;k<6;k++){var q=P[k*2];teeth.push([q,[q[0]-Math.sin(lf.a)*2.5,q[1]+Math.cos(lf.a)*2.5]]);}A(tmp,teeth);tmp.push([tip,[tip[0]+Math.cos(lf.a)*4,tip[1]+Math.sin(lf.a)*4]]);
    behind(s,tmp,sol);sol.push(P);});
  var pot=[[cx-30,by+2],[cx+30,by+2],[cx+24,gy],[cx-24,gy]];behind(s,[poly(pot)],sol.slice(0));sol.push(pot);var ph=[];H(ph,[[cx+8,by+2],[cx+30,by+2],[cx+24,gy],[cx+6,gy]],1.8,80);behind(s,ph,sol.slice(0,-1));
  var bgl=[];var ms=[[4,gy-30],[40,gy-30],[50,gy-56],[96,gy-58],[104,gy-30],[200,gy-28],[214,gy-48],[262,gy-50],[270,gy-28],[296,gy-28]];bgl.push(ms);H(bgl,ms.concat([[296,gy],[4,gy]]),RR(R,4,5),RR(R,15,30));
  var sb=[];for(var c=0;c<RI(R,2,3);c++){var x=pick(R,[RR(R,14,60),RR(R,240,286)]),h=RR(R,26,40);sb.push(rect(x-3,gy,x+3,gy-h));sb.push([[x-3,gy-h*0.5],[x-10,gy-h*0.5],[x-10,gy-h*0.75]]);}A(bgl,sb);
  gnd(bgl,R,gy);behind(s,bgl,sol);return sky(s,R,gy-28,sol);});

S('Fiddlehead ferns',['Uncurling','Spring Coils','Forest Floor, April','Question Marks','Before the Fronds'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,170,176),n=RI(R,5,7),x0=RR(R,50,70),span=RR(R,170,200);
  for(var i=0;i<n;i++){var x=x0+span*i/(n-1)+RR(R,-8,8),h=RR(R,70,120),d=sgn(R),r=RR(R,9,14),top=[x+d*RR(R,6,16),gy-h],c=[top[0]+d*r,top[1]];
    var sp=curve([[x,gy],[x-d*3,gy-h*0.4],[top[0]-d*2,gy-h*0.8],top],8);var tb=tube(sp,function(u){return 2.4-1.2*u;});FS(s,sol,tb.P);
    var sp2=spiral(c[0],c[1],r,1.5,2.6,d>0?PI:0);if(d<0)sp2=sp2.map(function(p){return [2*c[0]-p[0],p[1]];});s.push(sp2);var sp3=spiral(c[0],c[1],r-3,1,2,d>0?PI:0);if(d<0)sp3=sp3.map(function(p){return [2*c[0]-p[0],p[1]];});s.push(sp3);
    sol.push(EP(c[0],c[1],r+1,r+1));
    var sc=[];for(var j=4;j<sp.length-6;j+=4){var p=sp[j];sc.push([[p[0]-2,p[1]],[p[0]-5,p[1]-3]]);sc.push([[p[0]+2,p[1]],[p[0]+5,p[1]-3]]);}A(s,sc);}
  // leaf litter and mossy floor
  var fl=[[4,gy]];for(var x=4;x<296;x+=RR(R,7,11))fl.push([x+3,gy-RR(R,2,5)],[x+6,gy]);s.push(fl);
  for(var lv=0;lv<RI(R,6,9);lv++){var lx=RR(R,10,286),ly=RR(R,gy+6,190),L=lens([lx,ly],[lx+RR(R,10,16),ly+RR(R,-3,3)],3);s.push(poly(L));s.push([[lx,ly],[lx+12,ly]]);sol.push(L);}
  var f2=[];H(f2,RP(4,gy,296,196),RR(R,3.5,4.2),RR(R,10,25)*sgn(R));behind(s,f2,sol);
  // trunks behind
  var tk=[];for(var t=0;t<RI(R,3,4);t++){var tx=RR(R,10,280),tw=RR(R,12,22);tk.push(rect(tx,gy,tx+tw,4));tk.push([[tx+tw*0.7,6],[tx+tw*0.7,gy-2]]);}
  var lt=[];for(var y=8;y<gy-4;y+=RR(R,6,8))lt.push([[4,y],[296,y]]);var tsol=[];behind(s,lt,sol.concat(tk.filter(function(_,i){return i%2===0;}).map(function(P){return P.slice(0,4);})));behind(s,tk,sol);
  return s;});

S('Hot spring terraces',['Steps of Steam','Travertine Pools','Warm Water Falling','White Terraces','Mineral Staircase'],function(R){
  var s=[],sol=[],bg=[],lv=RI(R,4,5),y0=RR(R,78,86),dy=(188-y0)/lv,cx=RR(R,130,170),T=[];
  for(var i=0;i<lv;i++){var y=y0+i*dy,w=RR(R,50,62)+i*RR(R,22,28),x0=Math.max(6,cx-w),x1=Math.min(294,cx+w),nb=Math.max(2,Math.round((x1-x0)/RR(R,28,36))),bw=(x1-x0)/nb,rim=[];
    for(var b=0;b<nb;b++){var c=x0+bw*(b+0.5),a=arc(c,y,bw/2,RR(R,5,8),PI,0);a=a.map(function(p){return [p[0],2*y-p[1]];});if(b)a=a.slice(1);A(rim,a);}T.push({x0:x0,x1:x1,y:y,rim:rim});}
  var L=[],Rt=[];T.forEach(function(p){L.push([p.x0,p.y-dy*0.6]);L.push([p.x0,p.y]);Rt.push([p.x1,p.y-dy*0.6]);Rt.push([p.x1,p.y]);});var region=L.concat([[T[lv-1].x0,196],[T[lv-1].x1,196]]).concat(Rt.reverse());SOL(s,sol,region);
  T.forEach(function(p,i){s.push(p.rim);var top=p.y-dy*0.6,pool=[[p.x0,top],[p.x1,top]].concat(p.rim.slice().reverse());
    var r=rows(p.x0+3,p.x1-3,top+2,p.y-RR(R,6,8),RR(R,3,3.4));if(r.length>1)clipIn(s,[r],pool,[]);
    var nx=i<lv-1?T[i+1].y-dy*0.6:196,face=p.rim.concat([[p.x1,nx],[p.x0,nx]]);var dr=[],d=1;for(var x=p.x0+2;x<p.x1-2;x+=RR(R,4.5,6)){var yy=interpY(p.rim,x);dr.push(d>0?[x,yy]:[x,yy+RR(R,5,Math.max(6,nx-yy-1))]);dr.push(d>0?[x,yy+RR(R,5,Math.max(6,nx-yy-1))]:[x,yy]);d=-d;}if(dr.length>1)clipIn(s,[dr],face,[]);
    if(i<2){for(var k2=0;k2<2;k2++){var sx=RR(R,p.x0+14,p.x1-14),st=[[sx,top]];for(var k=1;k<=7;k++)st.push([sx+5*Math.sin(k*1.1+i+k2),top-k*5]);s.push(curve(st,4));}}});
  var hill=curve([[4,y0+20],[cx-110,y0-6],[cx-30,y0-18],[cx+50,y0-14],[cx+110,y0],[296,y0+16]],8);s.push(hill);
  H(bg,hill.concat([[296,196],[4,196]]),RR(R,4,4.8),RR(R,20,35)*sgn(R));
  peaks(bg,R,y0-12,RR(R,30,44),RI(R,3,4),RR(R,2.6,3.2));
  for(var p=0;p<RI(R,4,6);p++){var px=pick(R,[RR(R,10,cx-80),RR(R,cx+80,290)]);if(px>8&&px<292)pineT(s,px,interpY(hill,px)+RR(R,10,40),RR(R,0.6,0.85),2.2);}
  return fin(s,R,bg,sol,y0-4);});

S('Slot canyon',['Light Shaft at Noon','Sandstone Waves','Narrows','Where the Flood Carved','A Slice of Sky'],function(R){
  var s=[],sol=[],L=[],Rr=[],n=12,cx=RR(R,130,170);
  for(var i=0;i<=n;i++){var y=4+192*i/n,c=cx+Math.sin(i*0.7+R()*0.4)*RR(R,18,30),w=RR(R,9,16)+i*1.2;L.push([c-w,y]);Rr.push([c+w,y]);}
  var cl=curve(L,8),cr=curve(Rr,8);s.push(cl);s.push(cr);
  var lw=[],rw=[],g=RR(R,5.2,6.2);for(var k=1;k<40;k++){var off=k*g;var a=cl.map(function(p,i){return [p[0]-off+3*Math.sin(p[1]/18+k*0.5),p[1]];}).filter(function(p){return p[0]>4;});if(a.length>2)lw.push(k%2?a:a.slice().reverse());
    var b=cr.map(function(p){return [p[0]+off+3*Math.sin(p[1]/18+k*0.5),p[1]];}).filter(function(p){return p[0]<296;});if(b.length>2)rw.push(k%2?b:b.slice().reverse());}
  A(s,lw);A(s,rw);
  // shading on the walls near the gap
  var sh=[];H(sh,cl.concat(cl.slice().reverse().map(function(p){return [p[0]-RR(R,14,20),p[1]];})),1.6,70);A(s,sh);
  // light shaft and sky slit
  var gap=cl.concat(cr.slice().reverse());var sky=rows(4,296,6,30,4);var beam=[];var bx=RR(R,-30,30);H(beam,[[cx-14+bx,4],[cx+4+bx,4],[cx+40+bx,196],[cx+12+bx,196]],2.4,-80);
  clipIn(s,[sky],gap,[]);clipIn(s,beam,gap,[]);
  var fl=[];for(var y=176;y<196;y+=5)fl.push(wave(4,296,y,1.2,14,y));clipIn(s,fl,gap,[]);
  for(var r=0;r<RI(R,2,4);r++){var ry=RR(R,160,186),rx=interpY(cl.map(function(p){return [p[1],p[0]];}),ry);var rk=blob([[rx,ry],[rx+10,ry-8],[rx+20,ry-2],[rx+18,ry+6],[rx+4,ry+6]],4);s.push(rk);}
  return s;});

S('Pussy willow in a jug',['Soft Buds in March','Silver Catkins','Kitchen Window Branches','First Sign of Spring','Grey Velvet'],function(R){
  var s=[],sol=[],ty=RR(R,160,166),cx=RR(R,130,170),jw=RR(R,28,32),jh=RR(R,54,62),jt=ty-jh;
  var jug=blob([[cx-jw*0.55,jt],[cx-jw,jt+jh*0.4],[cx-jw*0.85,ty-4],[cx,ty],[cx+jw*0.85,ty-4],[cx+jw,jt+jh*0.4],[cx+jw*0.55,jt]],6).filter(function(p){return p[1]>=jt-1;});
  var J=[[cx-jw*0.55,jt]].concat(jug.filter(function(p){return p[1]>jt+1;})).concat([[cx+jw*0.55,jt]]);J=J.sort(function(a,b){return 0;});
  var body=[[cx-jw*0.5,jt]].concat(cubic([cx-jw*0.5,jt],[cx-jw*1.25,jt+jh*0.3],[cx-jw*1.1,ty],[cx-jw*0.5,ty],14).slice(1)).concat([[cx+jw*0.5,ty]]).concat(cubic([cx+jw*0.5,ty],[cx+jw*1.1,ty],[cx+jw*1.25,jt+jh*0.3],[cx+jw*0.5,jt],14).slice(1));
  FS(s,sol,body);s.push(EP(cx,jt,jw*0.5,3).concat([[cx+jw*0.5,jt]]));s.push([[cx+jw*0.5,jt],[cx+jw*0.72,jt-5],[cx+jw*0.3,jt-1]]);
  var hd=[[cx-jw*0.95,jt+8]].concat(cubic([cx-jw*0.95,jt+8],[cx-jw*1.8,jt+6],[cx-jw*1.7,jt+jh*0.6],[cx-jw*1.05,jt+jh*0.62],10).slice(1));s.push(hd);s.push(translate(hd,3,3));
  var band=[];for(var b=0;b<3;b++){var yy=jt+jh*(0.42+b*0.06);band.push([[cx-jw*1.3,yy],[cx+jw*1.3,yy]]);}clipIn(s,band,body,[]);var sd=[];H(sd,[[cx+jw*0.2,jt],[cx+jw*1.3,jt],[cx+jw*1.3,ty],[cx+jw*0.2,ty]],1.8,80);clipIn(s,sd,body,[]);
  var br=RI(R,6,8);for(var i=0;i<br;i++){var a=-PI/2+RR(R,-0.7,0.7),L=RR(R,90,130),p0=[cx+RR(R,-6,6),jt+2],p1=[p0[0]+Math.cos(a)*L*0.5+RR(R,-10,10),p0[1]+Math.sin(a)*L*0.5],p2=[p0[0]+Math.cos(a)*L,Math.max(10,p0[1]+Math.sin(a)*L)];
    var st=curve([p0,p1,p2],10);s.push(st);for(var k=6;k<st.length-1;k+=RI(R,3,4)){var q=st[k],d=k%2?1:-1,c=[q[0]+d*4,q[1]-2];var cat=EP(c[0],c[1],2.6,4.2);s.push(rotateAbout(poly(cat),c[0],c[1],d*0.5));s.push([q,[c[0],c[1]+3]]);}}
  var nap=[[cx+jw*1.4,ty],[cx+jw*1.4+44,ty],[cx+jw*1.4+48,ty-3],[cx+jw*1.4+4,ty-3]];if(nap[1][0]<294){FS(s,sol,nap);}
  onTable(s,R,ty,sol);return s;});

S('Dragon blood tree',['Umbrella of the Island','Upturned Crown','Red Resin','Plateau Sentinel','Branches Like Ribs'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,176,182),cx=RR(R,130,170),cw=RR(R,92,104),cb=RR(R,82,92),ct=cb-RR(R,44,54);
  var crown=[[cx-cw,cb]].concat(curve([[cx-cw,cb],[cx-cw*0.85,cb-(cb-ct)*0.6],[cx-cw*0.4,ct+4],[cx,ct],[cx+cw*0.4,ct+4],[cx+cw*0.85,cb-(cb-ct)*0.6],[cx+cw,cb]],8)).concat(curve([[cx+cw,cb],[cx+cw*0.5,cb+5],[cx,cb+7],[cx-cw*0.5,cb+5],[cx-cw,cb]],8).slice(1));
  FS(s,sol,crown);var tx=[];H(tx,crown,RR(R,2.6,3.2),RR(R,-20,20));A(s,tx);var un=[];H(un,curve([[cx-cw,cb],[cx-cw*0.5,cb+5],[cx,cb+7],[cx+cw*0.5,cb+5],[cx+cw,cb]],8).concat(curve([[cx+cw,cb-6],[cx,cb-2],[cx-cw,cb-6]],6)),1.4,0);A(s,un);
  var tw=RR(R,9,12),tt=cb+RR(R,50,58),tr=[[cx-tw,gy],[cx-tw*0.7,tt],[cx+tw*0.7,tt],[cx+tw,gy]];FS(s,sol,tr);H(s,[[cx+tw*0.1,tt],[cx+tw*0.7,tt],[cx+tw,gy],[cx+tw*0.1,gy]],1.6,90);
  function br(x,y,a,len,dep){var ex=x+Math.cos(a)*len,ey=y+Math.sin(a)*len;if(ey<cb+4){var t=(cb+4-y)/(ey-y);ex=x+(ex-x)*t;ey=cb+4;}var P=lens([x,y],[ex,ey],Math.max(1.2,dep*1.1));s.push(poly(P));sol.push(P);
    if(dep>0&&ey>cb+6){br(ex,ey,a-RR(R,0.3,0.5),len*0.8,dep-1);br(ex,ey,a+RR(R,0.3,0.5),len*0.8,dep-1);}}
  br(cx,tt,-PI/2-RR(R,0.4,0.55),RR(R,20,24),3);br(cx,tt,-PI/2+RR(R,0.4,0.55),RR(R,20,24),3);br(cx,tt,-PI/2+RR(R,-0.1,0.1),RR(R,18,22),2);
  rocks(s,sol,R,4,cx-tw-10,gy+2,RR(R,12,18),RI(R,3,4));rocks(s,sol,R,cx+tw+10,296,gy+2,RR(R,12,18),RI(R,3,4));
  var cl=[[4,gy-RR(R,40,50)],[60,gy-RR(R,40,50)],[70,gy-24],[230,gy-26],[240,gy-46],[296,gy-46]];bg.push(cl);H(bg,cl.concat([[296,gy],[4,gy]]),RR(R,4.2,5),RR(R,15,30));
  gnd(bg,R,gy);return fin(s,R,bg,sol,gy-24);});

S('Mangrove roots',['Stilts in the Tide','Roots Like Arches','Brackish Shade','High Water','Nursery of Fish'],function(R){
  var s=[],sol=[],bg=[],wy=RR(R,138,146),n=RI(R,2,3);
  for(var t=0;t<n;t++){var cx=40+(220)*(n===1?0.5:t/(n-1))+RR(R,-15,15),tb=wy-RR(R,16,26),ct=RR(R,26,40),tw=RR(R,4,6);
    var crown=scallop(cx,ct+18,RR(R,46,58),RR(R,24,30),RI(R,9,12),0.14);FS(s,sol,crown.slice(0,-1),RR(R,2.4,3),RR(R,30,60)*sgn(R));
    var tk=[[cx-tw,tb],[cx-tw*0.7,ct+40],[cx+tw*0.7,ct+40],[cx+tw,tb]];FS(s,sol,tk);H(s,[[cx,tb],[cx,ct+40],[cx+tw*0.7,ct+40],[cx+tw,tb]],1.4,90);
    for(var r=0;r<RI(R,8,11);r++){var d=r%2?1:-1,fx=cx+d*RR(R,10,46),sy=tb-RR(R,0,14),pk=sy-RR(R,6,18),rt=quad([cx+d*tw*0.6,sy],[(cx+fx)/2,pk],[fx,wy+RR(R,6,16)],14);s.push(rt);s.push(translate(rt,d*1.6,0.4));}}
  var w=[];var ws=waterS(R,4,296,wy,194,RR(R,5,6),1.1);w.push(ws);behind(s,w,sol);s.push([[4,wy],[296,wy]]);
  var refl=[];for(var k=0;k<RI(R,6,9);k++){var rx=RR(R,10,280),ry=RR(R,wy+8,188);refl.push([[rx,ry],[rx+RR(R,10,24),ry]]);}A(s,refl);
  
  return sky(s,R,wy-1,sol);});

// ---- chunk B: vehicles, machines, animals, birds, insects, sea life ----
function tyre(s,sol,cx,cy,r,g){var P=EP(cx,cy,r,r);SOL(s,sol,P);s.push(circle(cx,cy,r*0.62));HX(s,[P,EP(cx,cy,r*0.62,r*0.62)],g||1.4,30);s.push(circle(cx,cy,r*0.2));return s;}

S('Lunar rover',['Tracks in the Dust','Long Drive, No Air','Mesh Wheels','Sea of Tranquil Grey','Parked by the Crater'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,150,156),cx=RR(R,125,170),wr=RR(R,13,15),wb=RR(R,46,52),cy=gy+12-wr;
  [[cx-wb,cy],[cx+wb,cy]].forEach(function(w){var P=EP(w[0],w[1],wr,wr);SOL(s,sol,P);var m=[];H(m,P,2.2,45);H(m,P,2.2,-45);A(s,m);s.push(circle(w[0],w[1],3));s.push(arc(w[0],w[1],wr+4,wr+4,PI*1.1,PI*1.9));});
  var ch=[[cx-wb-14,cy-6],[cx+wb+14,cy-6],[cx+wb+10,cy-12],[cx-wb-10,cy-12]];FS(s,sol,ch,1.4,0);
  [[cx-wb,cy-6],[cx+wb,cy-6]].forEach(function(p){s.push([[p[0]-6,p[1]],[p[0],cy],[p[0]+6,p[1]]]);});
  var st=[cx-12,cy-12];[-1,1].forEach(function(d,i){var x=cx+d*14;var seat=[[x-9,cy-12],[x-9,cy-30],[x-5,cy-30],[x-5,cy-16],[x+9,cy-16],[x+9,cy-12]];FS(s,sol,seat);H(s,[[x-9,cy-16],[x+9,cy-16],[x+9,cy-12],[x-9,cy-12]],1.2,0);});
  var con=[[cx+wb-10,cy-12],[cx+wb-4,cy-34],[cx+wb+6,cy-34],[cx+wb+4,cy-12]];FS(s,sol,con);s.push(zz(cx+wb-6,cx+wb+3,cy-30,cy-22,2.5));
  var mx=cx+wb+2;s.push([[mx,cy-34],[mx,cy-70]]);var dsh=[[mx-16,cy-74]].concat(arc(mx,cy-74,16,7,PI,0).reverse().map(function(p){return [p[0],2*(cy-74)-p[1]];})).concat([[mx-16,cy-74]]);FS(s,sol,dsh,1.4,30);s.push([[mx,cy-70],[mx,cy-80]]);
  s.push([[cx-wb-8,cy-12],[cx-wb-8,cy-40],[cx-wb-4,cy-44]]);
  var tr=[],ty=gy+20;for(var x=4;x<cx-wb-wr;x+=5)tr.push([[x,ty],[x+2,ty+2]]);A(s,tr);
  // craters and ground
  var hz=gy-RR(R,30,40),hor=[];for(var x2=4;x2<=296;x2+=6)hor.push([x2,hz-RR(R,0,6)*Math.abs(Math.sin(x2/40))]);bg.push(hor);
  for(var c=0;c<RI(R,5,7);c++){var kx=RR(R,14,286),ky=RR(R,hz+10,190),kr=RR(R,8,22)*(0.5+(ky-hz)/(196-hz));var Cr=EP(kx,ky,kr,kr*0.3);bg.push(poly(Cr));H(bg,[[kx-kr,ky]].concat(arc(kx,ky,kr,kr*0.3,PI,TAU)).concat(arc(kx,ky+kr*0.08,kr*0.85,kr*0.18,0,PI).reverse()),1.4,0);}
  var gd=[];H(gd,hor.concat([[296,196],[4,196]]),RR(R,5,6),RR(R,-6,6));A(bg,gd);
  var lx=pick(R,[RR(R,20,50),RR(R,250,280)]);var lm=[[lx-10,hz],[lx-6,hz-12],[lx+6,hz-12],[lx+10,hz]];bg.push(lm);bg.push(RP(lx-5,hz-12,lx+5,hz-20));bg.push([[lx,hz-20],[lx,hz-26]]);
  behind(s,bg,sol);return skyFill(s,hz,4.2,3.6,5,sol);});

S('Monorail',['One Rail Downtown','Gliding Above Traffic','Next Stop, Plaza','Beam and Pylon','Future, Yesterday'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,180,186),by=RR(R,112,120),bh=8;
  var beam=RP(4,by,296,by+bh);FS(s,sol,beam);for(var px=RR(R,30,60);px<290;px+=RR(R,90,110)){var py=[[px-5,by+bh],[px-5,gy],[px+5,gy],[px+5,by+bh+10],[px+16,by+bh],[px-16,by+bh]];FS(s,sol,poly([[px-16,by+bh],[px+16,by+bh],[px+5,by+bh+10],[px+5,gy],[px-5,gy],[px-5,by+bh+10]]).slice(0,-1));H(s,RP(px+1,by+bh+10,px+5,gy),1.3,90);}
  var tx0=RR(R,30,70),tl=RR(R,190,210),tt=by-RR(R,30,34),nose=tx0+tl;
  var body=[[tx0,by+2],[tx0,tt+6],[tx0+6,tt]].concat([[nose-26,tt]]).concat(quad([nose-26,tt],[nose+6,tt+2],[nose+6,by+2],12).slice(1)).concat([[tx0,by+2]]);SOL(s,sol,body);s.push(body);
  var wy=tt+7,wh=10,holes=[];for(var x=tx0+10;x<nose-30;x+=RR(R,15,17)){var W=RP(x,wy,x+11,wy+wh);holes.push(W);s.push(poly(W));}
  var ws=quad([nose-24,tt+3],[nose-6,tt+4],[nose,wy+wh],8).concat([[nose-26,wy+wh]]);s.push(poly(ws));H(s,ws,1.4,70);
  s.push([[tx0,by-6],[nose+3,by-6]]);H(s,[[tx0,by-6],[nose+3,by-6],[nose+6,by+2],[tx0,by+2]],1.6,0);
  [0.33,0.66].forEach(function(f){var dx=tx0+tl*f;s.push(rect(dx,wy-1,dx+9,by-6));s.push([[dx+4.5,wy-1],[dx+4.5,by-6]]);});
  // skyline behind
  var x=4;while(x<292){var w=RR(R,22,40),h=RR(R,40,120),P=RP(x,gy,x+w,gy-h);bg.push(poly(P));var G=[];H(G,RP(x+3,gy-h+4,x+w-3,gy-4),RR(R,7,9),0);H(G,RP(x+3,gy-h+4,x+w-3,gy-4),RR(R,6,8),90);clipIn(bg,G,P,[]);x+=w+RR(R,2,8);}
  behind(s,bg,sol);road(s,R,gy);sol.push(RP(4,gy,296,196));
  [RR(R,12,30),RR(R,270,290)].forEach(function(px){s.push([[px,gy],[px+2,gy-46]]);for(var f=0;f<5;f++){var a=-PI+f*PI/4;s.push(quad([px+2,gy-46],[px+2+12*Math.cos(a),gy-54+6*Math.sin(a)],[px+2+20*Math.cos(a),gy-40+8*Math.sin(a)*0.3],8));}});
  return sky(s,R,gy-1,sol);});

S('Fireboat',['Salute in the Harbor','Arcs of Water','Pumps Wide Open','Welcome Home Spray','Red Hull, White Plumes'],function(R){
  var s=[],sol=[],bg=[],wy=RR(R,150,156),cx=RR(R,130,170),hl=RR(R,82,92),hd=RR(R,20,24);
  var hull=[[cx-hl,wy-hd]].concat(quad([cx+hl-10,wy-hd],[cx+hl+12,wy-hd-4],[cx+hl+14,wy-hd-8],6).slice(0,0)).concat([[cx+hl+12,wy-hd-6],[cx+hl-14,wy+4],[cx-hl+6,wy+4],[cx-hl,wy-hd]]);FS(s,sol,hull);
  s.push([[cx-hl+2,wy-hd+6],[cx+hl+6,wy-hd+4]]);H(s,[[cx-hl+3,wy-hd+8],[cx+hl+4,wy-hd+6],[cx+hl-14,wy+4],[cx-hl+6,wy+4]],RR(R,1.8,2.2),0);
  var c1=RP(cx-hl*0.55,wy-hd,cx+hl*0.25,wy-hd-24);FS(s,sol,c1);for(var x=c1[0][0]+6;x<c1[1][0]-10;x+=14){var W=RP(x,wy-hd-18,x+9,wy-hd-10);s.push(poly(W));H(s,W,1.2,45);}
  var c2=RP(cx-hl*0.35,wy-hd-24,cx+hl*0.1,wy-hd-42);FS(s,sol,c2);s.push(zz(c2[0][0]+3,c2[1][0]-3,wy-hd-38,wy-hd-30,4));s.push([[c2[0][0]-4,wy-hd-42],[c2[1][0]+4,wy-hd-42]]);
  var mast=[[cx-hl*0.1,wy-hd-42],[cx-hl*0.1,wy-hd-64]];s.push(mast);s.push([[cx-hl*0.1-8,wy-hd-56],[cx-hl*0.1+8,wy-hd-56]]);
  var noz=[[cx+hl*0.1,wy-hd-42,-1],[cx+hl*0.55,wy-hd-4,1],[cx-hl*0.75,wy-hd-4,-1],[cx+hl*0.35,wy-hd-24,1]];
  noz.forEach(function(n,i){var x=n[0],y=n[1],d=n[2]*(i%2?1:1);s.push(RP(x-2,y,x+2,y-8));var a=-PI/2+d*RR(R,0.35,0.7),v=RR(R,60,90),tip=[x+Math.cos(a)*v*1.6,y-8+Math.sin(a)*v*0.9];
    var land=[x+d*RR(R,90,140),wy];var arcC=quad([x,y-8],tip,land,24);if(arcC.some(function(p){return p[0]<6||p[0]>294;}))arcC=arcC.filter(function(p){return p[0]>6&&p[0]<294;});
    if(arcC.length>3){s.push(arcC);[-1,1].forEach(function(o){var c2=quad([x,y-8],[tip[0]+o*6,tip[1]-o*5],[land[0]+o*d*16,land[1]],24).filter(function(p){return p[0]>6&&p[0]<294;});if(c2.length>3)s.push(c2);});var dr=[];for(var k=6;k<arcC.length;k+=3){var p=arcC[k];dr.push([[p[0]-1.5,p[1]+2],[p[0]+1.5,p[1]+5]]);}A(s,dr);}});
  waterIn(bg,R,RP(4,wy,296,196),wy+4,194,RR(R,5,6));
  var pr=RR(R,0,1)<0.5?[4,RR(R,40,60)]:[RR(R,240,260),296];bg.push([[pr[0],wy-26],[pr[1],wy-26]]);bg.push([[pr[0],wy-22],[pr[1],wy-22]]);for(var px=pr[0]+6;px<pr[1];px+=12){bg.push(rect(px-2,wy-22,px+2,wy+14));}
  var sk=[];for(var b=0;b<RI(R,4,6);b++){var bx=RR(R,10,280),bh=RR(R,16,40);sk.push(rect(bx,wy,bx+RR(R,14,30),wy-bh));}A(bg,sk);
  behind(s,bg,sol);s.push([[4,wy],[296,wy]]);return sky(s,R,wy-1,sol);});

S('Open-wheel race car',['Pole Position','Low and Wide','Pit Lane Exit','Downforce','Last Lap Flag'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,150,156),cx=RR(R,135,165),wr=RR(R,15,17),fx=cx+RR(R,62,70),rx=cx-RR(R,58,66),cy=gy-wr;
  var body=[[rx-6,cy-6],[rx+10,cy-22],[cx-10,cy-24],[cx+4,cy-30],[cx+18,cy-30],[cx+26,cy-20],[fx-6,cy-14],[fx+20,cy-8],[fx+26,cy-4],[fx+12,cy-2],[cx+10,cy-4],[rx+10,cy-4]];FS(s,sol,body);
  H(s,[[rx+10,cy-14],[fx-6,cy-12],[fx+20,cy-8],[fx+12,cy-4],[rx+10,cy-6]],RR(R,1.6,2),0);
  var hel=EP(cx+10,cy-36,8,7);FS(s,sol,hel);H(s,[[cx+6,cy-38],[cx+18,cy-38],[cx+18,cy-33],[cx+6,cy-33]],1,0);s.push([[cx-2,cy-30],[cx+4,cy-42],[cx+20,cy-42],[cx+28,cy-30]]);
  var rn=[cx-26,cy-16];s.push(circle(rn[0],rn[1],8));s.push([[rn[0]-2,rn[1]-4],[rn[0]+1,rn[1]-5],[rn[0]+1,rn[1]+5]]);
  var rw=[[rx-16,cy-44],[rx+8,cy-44],[rx+8,cy-36],[rx-16,cy-36]];FS(s,sol,rw,1.2,0);s.push([[rx-14,cy-36],[rx-4,cy-14]]);s.push([[rx+4,cy-36],[rx+6,cy-20]]);
  var fw=[[fx+4,cy+4],[fx+32,cy+4],[fx+32,cy],[fx+8,cy]];FS(s,sol,fw,1,0);
  tyre(s,sol,rx,cy,wr+2,1.4);tyre(s,sol,fx,cy,wr,1.4);
  // track, kerb, fence, grandstand
  s.push([[4,gy],[296,gy]]);var kb=[[4,gy+6]];for(var x=4;x<296;x+=12){kb.push([x+6,gy+6],[x+6,gy+12],[x+12,gy+12],[x+12,gy+6]);}s.push(kb);
  var tk=[];H(tk,RP(4,gy+14,296,196),RR(R,5,6),0);A(s,tk);s.push([[4,gy+14],[296,gy+14]]);
  var fy=gy-RR(R,40,48);bg.push([[4,fy],[296,fy]]);var m=[];H(m,RP(4,fy,296,gy),RR(R,5,6),45);H(m,RP(4,fy,296,gy),RR(R,5,6),-45);A(bg,m);for(var p=4;p<296;p+=30)bg.push([[p,fy],[p,gy]]);
  var gs=[[4,fy-6],[296,fy-6],[296,fy-50],[4,fy-30]];bg.push(gs);var sr=[];for(var y=fy-10;y>fy-48;y-=5)sr.push([[4,y],[296,y]]);clipIn(bg,sr,gs,[]);
  behind(s,bg,sol);return sky(s,R,fy-10,sol);});

S('Bathysphere',['Half a Mile Down','Portholes and Bolts','Lowered on a Cable','Into the Twilight Zone','Steel Pearl'],function(R){
  var s=[],sol=[],bg=[],cx=RR(R,130,170),cy=RR(R,88,98),r=RR(R,38,42);
  var B=EP(cx,cy,r,r);SOL(s,sol,B);s.push(poly(B));H(s,[[cx+r*0.15,cy-r]].concat(arc(cx,cy,r,r,-PI/2,PI/2)).concat(arc(cx,cy,r*0.6,r,PI/2,-PI/2)),RR(R,1.8,2.2),70);
  var ph=[[cx-r*0.35,cy-r*0.05,9],[cx+r*0.25,cy+r*0.3,6],[cx-r*0.05,cy-r*0.55,5]];ph.forEach(function(p){var P=EP(p[0],p[1],p[2]+3,p[2]+3);s.push(poly(P));sol.push(P);s.push(circle(p[0],p[1],p[2]));for(var k=0;k<8;k++){var a=k*PI/4;s.push(circle(p[0]+(p[2]+1.6)*Math.cos(a),p[1]+(p[2]+1.6)*Math.sin(a),0.6));}});
  var hatchT=RP(cx-8,cy-r+2,cx+8,cy-r-8);FS(s,sol,hatchT);var ring=EP(cx,cy-r-12,6,4);s.push(poly(ring));s.push([[cx,cy-r-16],[cx,4]]);s.push([[cx+3,cy-r-16],[cx+3,4]]);
  var pp=ph[0],beam=[[pp[0]-6,pp[1]-4],[pp[0]-90,pp[1]-40],[pp[0]-110,pp[1]+50],[pp[0]-6,pp[1]+6]];var bh=[];H(bh,beam,2.2,-20);clipIn(s,bh,beam,[EP(cx,cy,r,r)]);
  var bed=seabed(bg,R,RR(R,170,176),RI(R,3,5));
  var wl=[];for(var y=10;y<168;y+=RR(R,5,6))wl.push(wave(4,296,y,0.9,RR(R,20,30),y*0.3));bg.push([wl[0][0]].concat([].concat.apply([],wl.map(function(w,i){return i%2?w.slice().reverse():w;}))));
  behind(s,bg,sol.concat([beam,RP(cx-6,4,cx+6,cy-r)]));
  return s;});

S('Semi truck',['Long Haul','Eighteen Wheels West','Chrome Stack','Interstate Morning','Rest Stop Ahead'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,160,166),wr=RR(R,9,10),cy=gy-wr,cab=RR(R,206,222);
  var cb=[[cab,cy+2],[cab,cy-48],[cab+8,cy-58],[cab+30,cy-58],[cab+34,cy-30],[cab+56,cy-28],[cab+60,cy-10],[cab+60,cy+2]];FS(s,sol,cb);
  var ww=[[cab+12,cy-52],[cab+28,cy-52],[cab+31,cy-34],[cab+12,cy-34]];s.push(poly(ww));H(s,ww,1.4,60);s.push(rect(cab+4,cy-30,cab+28,cy-4));s.push([[cab+28,cy-14],[cab+22,cy-14]]);
  s.push(zz(cab+52,cab+58,cy-26,cy-10,2));s.push(rect(cab+46,cy-10,cab+62,cy-4));var stk=RP(cab-2,cy-30,cab+3,cy-74);FS(s,sol,stk);s.push(rect(cab-6,cy-6,cab+18,cy-2));
  var tl=[[12,cy-2],[cab-6,cy-2],[cab-6,cy-80],[12,cy-80]];FS(s,sol,tl);clipIn(s,[zz(14,cab-8,cy-78,cy-4,RR(R,3.2,3.8))],tl,[]);H(s,RP(12,cy-6,cab-6,cy-2),1,0);
  s.push(rect(cab-14,cy-2,cab-4,cy+2));[[cab+44],[cab+12],[cab-10],[40],[62]].forEach(function(w){tyre(s,sol,w[0],cy,wr,1.2);});
  road(s,R,gy);sol.push(RP(4,gy,296,196));
  hills(bg,R,gy-6,RR(R,24,36),RR(R,4,5),[],RR(R,10,25));for(var p=0;p<RI(R,2,3);p++){var px=RR(R,10,290),ph=RR(R,8,12);bg.push([[px,gy],[px,gy-60]]);bg.push([[px-ph,gy-56],[px+ph,gy-56]]);bg.push([[px-ph,gy-50],[px+ph,gy-50]]);}
  behind(s,bg,sol);
  return sky(s,R,gy-1,sol);});

S('Beaver lodge',['Sticks and Mud','Home in the Pond','Evening Swim','Built Overnight','Gnawed Stumps'],function(R){
  var s=[],sol=[],bg=[],wy=RR(R,140,146),cx=RR(R,90,130),lw=RR(R,62,72),lh=RR(R,44,52);
  var lodge=[[cx-lw,wy]].concat(curve([[cx-lw,wy],[cx-lw*0.6,wy-lh*0.8],[cx,wy-lh],[cx+lw*0.6,wy-lh*0.75],[cx+lw,wy]],8)).concat([[cx-lw,wy]]);SOL(s,sol,lodge);s.push(lodge);
  var st=[];for(var k=0;k<RI(R,70,85);k++){var x=RR(R,cx-lw*0.9,cx+lw*0.9),y=RR(R,wy-lh,wy-2),a=RR(R,-0.9,0.9),L=RR(R,10,24);st.push([[x-Math.cos(a)*L/2,y-Math.sin(a)*L/2],[x+Math.cos(a)*L/2,y+Math.sin(a)*L/2]]);}clipIn(s,st,lodge,[]);
  var sh=[];H(sh,[[cx+lw*0.2,wy-lh*0.95],[cx+lw,wy],[cx+lw*0.2,wy]],2.2,70);clipIn(s,sh,lodge,[]);
  var bx=RR(R,cx+lw+40,250),by=wy+RR(R,18,26),hd=blob([[bx,by],[bx+12,by-12],[bx+27,by-11],[bx+36,by-3],[bx+30,by+1]],5);FS(s,sol,hd,1.2,0);s.push(circle(bx+22,by-7,1.5));s.push(arc(bx+9,by-12,3.5,3.5,PI,TAU));s.push(circle(bx+35,by-4,1.2));
  s.push([[bx,by+1],[bx-60,by-8]]);s.push([[bx,by+1],[bx-60,by+12]]);s.push([[bx-14,by-1],[bx-60,by+2]]);
  var bank=[[4,wy-RR(R,14,20)],[296,wy-RR(R,6,12)]];s.push([[4,wy],[296,wy]]);
  for(var t=0;t<RI(R,2,3);t++){var tx=RR(R,cx+lw+10,286),sb=wy;if(Math.abs(tx-bx)<20)continue;var stmp=[[tx-6,sb],[tx-6,sb-10],[tx-2,sb-16],[tx+2,sb-16],[tx+6,sb-10],[tx+6,sb]];FS(s,sol,stmp,1.3,90);}
  waterIn(bg,R,RP(4,wy,296,196),wy+4,194,RR(R,5,6));
  for(var p=0;p<RI(R,7,9);p++){var px=RR(R,6,294);pineT(bg,px,wy-RR(R,0,6),RR(R,0.8,1.3),2.6);}
  behind(s,bg,sol);return skyFill(s,wy-1,RR(R,7,8.5),RR(R,4.2,5),5,sol);});

S('Harbor seal on a rock',['Hauled Out','Spotted Sunbather','Low Tide Nap','Whiskers to the Wind','Rock Sitter'],function(R){
  var s=[],sol=[],bg=[],wy=RR(R,128,136),cx=RR(R,130,170),ry=RR(R,118,124),sc=RR(R,1.35,1.5),f=sgn(R);
  var rock=blob([[cx-110,wy+40],[cx-90,ry+6],[cx-40,ry-4],[cx+30,ry-2],[cx+90,ry+8],[cx+112,wy+40]],6);rock=rock.filter(function(p){return p[1]<=wy+40;});var RK=rock.concat([[cx+112,wy+44],[cx-110,wy+44]]);
  var body=[[-62,-2],[-50,-8],[-30,-14],[-6,-19],[18,-22],[34,-30],[44,-42],[54,-48],[64,-47],[70,-42],[68,-36],[58,-30],[50,-16],[40,-4],[20,2],[-10,3],[-40,2]];var BP=blob(body.map(function(p){return [cx+p[0]*sc*f,ry+p[1]*sc];}),5);SOL(s,sol,BP);s.push(poly(BP));
  var tail=[[-60,-2],[-78,-12],[-74,-2],[-80,6],[-60,0]].map(function(p){return [cx+p[0]*sc*f,ry+p[1]*sc];});FS(s,sol,tail,1.2,0);
  var fl=lens([cx+30*sc*f,ry-6*sc],[cx+46*sc*f,ry+2*sc],3);FS(s,sol,fl,1,0);
  var eyeP=[cx+58*sc*f,ry-42*sc];eye(s,eyeP[0],eyeP[1],2.4);s.push(circle(cx+69*sc*f,ry-40*sc,1.2));for(var w=0;w<3;w++)s.push([[cx+66*sc*f,ry-(37-w*1.5)*sc],[cx+(78+w*2)*sc*f,ry-(38-w*3)*sc]]);s.push([[cx+64*sc*f,ry-34*sc],[cx+68*sc*f,ry-33*sc]]);
  var top=body.slice(1,8).map(function(p){return [cx+p[0]*sc*f,ry+p[1]*sc];});var back=top.concat(top.slice().reverse().map(function(p){return [p[0],p[1]+7*sc];}));var bh=[];H(bh,back,1.8,f>0?-20:20);clipIn(s,bh,BP,[]);
  
  s.push(rock);var rh=[];H(rh,RK,RR(R,2.4,3),RR(R,30,60));behind(s,rh,sol);var cr=[];for(var c=0;c<5;c++){var x0=RR(R,cx-100,cx+100);cr.push(curve([[x0,interpY(rock,x0)+4],[x0+RR(R,-8,8),wy+10],[x0+RR(R,-10,10),wy+30]],4));}behind(s,cr,sol);sol.push(RK);
  waterIn(bg,R,RP(4,wy,296,196),wy+4,194,RR(R,5,6));bg.push([[4,wy],[296,wy]]);var hz=wy-RR(R,20,30);var hd=[];hills(hd,R,wy,RR(R,16,26),RR(R,4,5),[],RR(R,10,20));A(bg,hd);
  behind(s,bg,sol);return sky(s,R,wy-6,sol);});

S("Ship's wheel",['Hand on the Helm','Eight Spokes of Teak','Steady As She Goes','Wheelhouse Brass','Course Due West'],function(R){
  var s=[],sol=[],cx=RR(R,135,165),cy=RR(R,88,96),r=RR(R,56,62),n=8,a0=R()*PI/8;
  var rim=EP(cx,cy,r,r),rin=EP(cx,cy,r-9,r-9);SOL(s,sol,rim);s.push(poly(rim));s.push(poly(rin));var rh=[];H(rh,[[cx,cy-r]].concat(arc(cx,cy,r,r,-PI/2,PI/2)).concat(arc(cx,cy,r-9,r-9,PI/2,-PI/2)),1.6,60);clipIn(s,rh,rim,[rin]);
  for(var k=0;k<n;k++){var a=a0+k*TAU/n,c=Math.cos(a),sn=Math.sin(a),nx=-sn,ny=c;
    var sp=[[cx+c*12+nx*2.4,cy+sn*12+ny*2.4],[cx+c*(r-9)+nx*2.4,cy+sn*(r-9)+ny*2.4],[cx+c*(r-9)-nx*2.4,cy+sn*(r-9)-ny*2.4],[cx+c*12-nx*2.4,cy+sn*12-ny*2.4]];s.push(poly(sp));sol.push(sp);
    var hb=r+3,he=r+24,h=[[cx+c*hb+nx*3,cy+sn*hb+ny*3]];for(var q=1;q<=4;q++){var t=hb+(he-hb)*q/4,w=q%2?4.5:3;h.push([cx+c*t+nx*w,cy+sn*t+ny*w]);}for(var q2=4;q2>=0;q2--){var t2=hb+(he-hb)*q2/4,w2=q2%2?4.5:3;h.push([cx+c*t2-nx*w2,cy+sn*t2-ny*w2]);}
    var hp=h;s.push(poly(hp));sol.push(hp);var hh=[];H(hh,hp,1.3,a*180/PI);A(s,hh);}
  var hub=EP(cx,cy,14,14);SOL(s,sol,hub);s.push(poly(hub));s.push(circle(cx,cy,8));s.push(circle(cx,cy,3));for(var b=0;b<6;b++){var ba=b*PI/3;s.push(circle(cx+11*Math.cos(ba),cy+11*Math.sin(ba),1));}
  var ped=[[cx-10,cy+r-4],[cx-16,196],[cx+16,196],[cx+10,cy+r-4]];FS(s,sol,ped);H(s,[[cx+2,cy+r-4],[cx+10,cy+r-4],[cx+16,196],[cx+4,196]],1.6,90);
  var dk=[];var fy=RR(R,164,170);floorS(dk,R,fy,RI(R,16,20));behind(s,dk,sol);
  var wh=[],wy=fy-8;wh.push([[4,wy],[296,wy]]);var pn=[];H(pn,RP(4,4,296,wy),RR(R,6,7.5),90);A(wh,pn);var ws=[];
  [[RR(R,10,26),20],[RR(R,248,262),20]].forEach(function(w){var W=RP(w[0],w[1],w[0]+40,w[1]+50);ws.push(W);s.push(poly(W));s.push(circle(w[0]+20,w[1]+25,14));var gl=[];H(gl,EP(w[0]+20,w[1]+25,12,12),2.2,45);A(s,gl);});
  behind(s,wh,sol.concat(ws));var rope=[];for(var c=0;c<4;c++)rope.push(EP(pick(R,[60,240])+0,fy+14+c*0,24-c*4,6-c));return s;});

S('Cormorants drying wings',['Wings Out to Dry','Three on the Pilings','Heraldic Pose','Fisherman\'s Rest','Black Flags'],function(R){
  var s=[],sol=[],bg=[],wy=RR(R,150,156),n=RI(R,2,3);
  for(var i=0;i<n;i++){var x=40+220*(n===1?0.5:i/(n-1))+RR(R,-10,10),pt=wy-RR(R,30,46)-i*RR(R,-6,6),sc=RR(R,0.9,1.05),d=i%2?1:-1;
    var pile=[[x-7,wy+10],[x-7,pt],[x+7,pt],[x+7,wy+10]];FS(s,sol,pile);s.push(EP(x,pt,7,2).concat([[x+7,pt]]));H(s,RP(x+2,pt+2,x+7,wy+10),1.4,90);for(var r=pt+10;r<wy;r+=10)s.push(arc(x,r,7,2,0,PI));
    function P(a){return a.map(function(p){return [x+p[0]*sc*d,pt+p[1]*sc];});}
    var body=blob(P([[0,-2],[-6,-18],[-4,-36],[4,-40],[6,-20],[4,-2]]),4);FS(s,sol,body,1.4,80);
    var neck=P([[0,-38],[4,-48],[2,-54],[8,-58],[16,-56]]);s.push(neck);s.push(translate(neck,-2.5*d,1));var hd=EP(x+8*sc*d,pt-57*sc,4*sc,3*sc);FS(s,sol,hd,0.9,0);s.push(P([[11,-58],[24,-56],[25,-54]]));
    [1,-1].forEach(function(side){var w=P([[side*3,-34],[side*14,-46],[side*30,-52],[side*44,-48],[side*40,-42],[side*44,-36],[side*38,-32],[side*40,-24],[side*32,-22],[side*30,-16],[side*20,-20],[side*4,-24]]);FS(s,sol,w);
      var fh=[];H(fh,w,RR(R,1.8,2.2),side*d*50);A(s,fh);s.push(P([[side*30,-52],[side*32,-22]]));});
    s.push(P([[-3,-2],[-4,2]]));s.push(P([[3,-2],[4,2]]));s.push(P([[0,-2],[-2,8],[2,8],[0,-2]]));}
  waterIn(bg,R,RP(4,wy,296,196),wy+4,194,RR(R,5,6));bg.push([[4,wy],[296,wy]]);
  var hl=[];hills(hl,R,wy,RR(R,16,26),RR(R,4,5),[],RR(R,10,20));A(bg,hl);
  behind(s,bg,sol);return sky(s,R,wy-8,sol);});

S('Anglerfish',['Lantern in the Dark','The Bait Glows','Deep and Hungry','Teeth Below the Light','Midnight Zone'],function(R){
  var s=[],sol=[],bg=[],cx=RR(R,140,165),cy=RR(R,108,118),f=sgn(R),sc=RR(R,1.15,1.3);function X(P){return P.map(function(p){return [cx+p[0]*sc*f,cy+p[1]*sc];});}
  var body=blob(X([[-80,-6],[-60,-30],[-20,-48],[20,-50],[50,-36],[62,-14],[60,10],[40,30],[0,40],[-40,30],[-70,10]]),5);FS(s,sol,body);
  var mouth=X([[60,-8],[30,4],[62,22]]);s.push(curve(X([[62,-12],[36,-2],[30,6],[38,16],[60,24]]),6));
  var t1=[],t2=[];for(var k=0;k<7;k++){var a=lerp(X([[60,-10]])[0],X([[34,-1]])[0],k/7),b=lerp(X([[60,-10]])[0],X([[34,-1]])[0],(k+0.5)/7);t1.push(a,[b[0],b[1]+6*sc]);var c=lerp(X([[60,22]])[0],X([[36,14]])[0],k/7),d=lerp(X([[60,22]])[0],X([[36,14]])[0],(k+0.5)/7);t2.push(c,[d[0],d[1]-6*sc]);}s.push(t1);s.push(t2);
  var e=X([[28,-24]])[0];s.push(circle(e[0],e[1],5*sc));H(s,EP(e[0],e[1],3*sc,3*sc),0.8,0);
  var lure=curve(X([[10,-48],[20,-72],[50,-78],[72,-62],[76,-50]]),8);s.push(lure);var lb=X([[76,-46]])[0];var bulb=EP(lb[0],lb[1],5*sc,5*sc);FS(s,sol,bulb);H(s,bulb,1.2,0);
  var glow=[];for(var k2=0;k2<12;k2++){var a2=k2*PI/6;glow.push([[lb[0]+9*sc*Math.cos(a2),lb[1]+9*sc*Math.sin(a2)],[lb[0]+14*sc*Math.cos(a2),lb[1]+14*sc*Math.sin(a2)]]);}A(s,glow);sol.push(EP(lb[0],lb[1],16*sc,16*sc));
  var tail=X([[-78,-4],[-102,-26],[-96,0],[-102,24],[-76,6]]);FS(s,sol,tail);for(var r=0;r<4;r++)s.push(X([[-80,-2+r*1.5],[-100,-20+r*13]]));
  var fin=X([[-10,30],[-6,48],[10,44],[12,32]]);FS(s,sol,fin,1.4,90);var df=X([[-30,-44],[-40,-60],[-20,-58],[-10,-48]]);FS(s,sol,df,1.4,0);
  var sh=[];H(sh,X([[-70,10],[-40,30],[0,40],[40,30],[60,10],[0,22]]),1.8,0);A(s,sh);var spots=[];for(var p=0;p<8;p++){var q=X([[RR(R,-60,20),RR(R,-36,-6)]])[0];spots.push(circle(q[0],q[1],1.2));}clipIn(s,spots,body,[]);
  var bed=[];seabed(bed,R,RR(R,180,186),0);A(bg,bed);var dk=[];for(var y=6;y<176;y+=RR(R,3.4,3.8))dk.push([[4,y],[296,y]]);var zz2=[dk[0][0]];dk.forEach(function(l,i){A(zz2,i%2?l.slice().reverse():l);});bg.push(zz2);
  behind(s,bg,sol);return s;});

S('Insect hotel',['Rooms for Bees','Bamboo and Pinecones','Guest House for Bugs','Garden Lodging','Vacancies Daily'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,178,184),cx=RR(R,130,170),hw=RR(R,48,54),hb=gy-RR(R,30,36),ht=hb-RR(R,96,104);
  var frame=RP(cx-hw,hb,cx+hw,ht);FS(s,sol,frame);s.push(rect(cx-hw+4,hb-4,cx+hw-4,ht+4));var roof=[[cx-hw-10,ht+2],[cx,ht-30],[cx+hw+10,ht+2]];FS(s,sol,poly(roof).slice(0,-1));H(s,[[cx-hw-4,ht],[cx,ht-26],[cx+hw+4,ht]],RR(R,2.2,2.6),RR(R,15,30));
  var gx=[cx-hw+4,cx-hw*0.2,cx+hw-4],gyy=[ht+4,ht+(hb-ht)*0.36,ht+(hb-ht)*0.68,hb-4];s.push([[gx[1],ht+4],[gx[1],hb-4]]);for(var j=1;j<3;j++)s.push([[cx-hw+4,gyy[j]],[cx+hw-4,gyy[j]]]);
  var kinds=['tubes','cones','log','straw','bricks','tubes'];var ord=[0,1,2,3,4,5].sort(function(){return R()-0.5;});var ci=0;
  for(var r=0;r<3;r++)for(var c=0;c<2;c++){var x0=gx[c]+1,x1=gx[c+1]-1,y0=gyy[r]+1,y1=gyy[r+1]-1,k=kinds[ord[ci++]],w=x1-x0,h=y1-y0,cx2=(x0+x1)/2,cy2=(y0+y1)/2,cell=RP(x0,y0,x1,y1),z=[];
    if(k==='tubes'){for(var yy=y0+4;yy<y1-3;yy+=8)for(var xx=x0+4+((yy-y0)%16>7?4:0);xx<x1-3;xx+=8.5){z.push(circle(xx,yy,3.4));}}
    else if(k==='cones'){for(var q=0;q<3;q++){var px=x0+w*(q+0.5)/3,P=scallop(px,cy2,w/7,h/2.6,7,0.18);z.push(P);H(z,P.slice(0,-1),1.6,0);}}
    else if(k==='log'){var L=EP(cx2,cy2,w/2-2,h/2-2);z.push(poly(L));z.push(spiral(cx2,cy2,1,Math.min(w,h)/2-6,3,0));for(var d2=0;d2<6;d2++){var a=d2*1.05;z.push(circle(cx2+(Math.min(w,h)/2-10)*Math.cos(a),cy2+(h/2-8)*Math.sin(a),1.4));}}
    else if(k==='straw'){z.push(zz(x0+1,x1-1,y0+1,y1-1,1.6));}
    else{A(z,[].concat(bricks(x0,y0,x1,y1,w/3,h/3)));for(var bx=x0+w/6;bx<x1;bx+=w/3)for(var by=y0+h/6;by<y1;by+=h/3)z.push(circle(bx,by,1.6));}
    clipIn(s,z,cell,[]);}
  var post=RP(cx-5,gy,cx+5,hb);FS(s,sol,post);H(s,RP(cx+1,hb,cx+5,gy),1.2,90);
  var bee=[cx+hw+RR(R,6,12),RR(R,ht+20,hb-20)];s.push(poly(EP(bee[0],bee[1],5,3)));s.push(zz(bee[0]-3,bee[0]+3,bee[1]-2.5,bee[1]+2.5,2));s.push(arc(bee[0]-1,bee[1]-5,3,4,PI,TAU));s.push([[cx+hw,bee[1]],[bee[0]-5,bee[1]]]);
  for(var fl=0;fl<RI(R,4,6);fl++){var fx=pick(R,[RR(R,12,cx-hw-14),RR(R,cx+hw+14,288)]),fh=RR(R,30,60);if(fx<8||fx>292)continue;s.push(quad([fx,gy],[fx+RR(R,-6,6),gy-fh*0.5],[fx,gy-fh],8));var fP=scallop(fx,gy-fh-4,5,5,6,0.4);s.push(fP);s.push(circle(fx,gy-fh-4,1.6));s.push(lens([fx,gy-fh*0.4],[fx+8,gy-fh*0.5],2));}
  var fen=[];for(var x=8;x<292;x+=12)fen.push(poly([[x,gy],[x,gy-60],[x+4,gy-64],[x+8,gy-60],[x+8,gy]]).slice(0,-1));fen.push([[4,gy-46],[296,gy-46]]);fen.push([[4,gy-20],[296,gy-20]]);A(bg,fen);
  gnd(bg,R,gy);behind(s,bg,sol);return sky(s,R,gy-1,sol.concat([RP(4,gy,296,gy-64)]));});

S('Luna moth',['Green Moon Wings','One Week of Night','Porch Light Visitor','Tails Like Ribbons','Eyespots'],function(R){
  var s=[],sol=[],cx=RR(R,140,160),cy=RR(R,80,90),sc=RR(R,1.05,1.15),tilt=RR(R,-0.12,0.12);function X(P){return rotateAbout(P.map(function(p){return [cx+p[0]*sc,cy+p[1]*sc];}),cx,cy,tilt);}
  [1,-1].forEach(function(d){function M2(P){return X(P.map(function(p){return [p[0]*d,p[1]];}));}
    var fw=blob(M2([[4,-8],[30,-30],[66,-40],[90,-34],[82,-10],[52,6],[8,6]]),5);FS(s,sol,fw);
    var hw=blob(M2([[6,6],[40,8],[62,24],[60,44],[48,60],[40,90],[34,104],[30,90],[30,60],[16,36],[4,18]]),5);var tmp=[poly(hw)];behind(s,tmp,[fw]);sol.push(hw);
    var vs=[[6,-2],[60,-36]];s.push(M2([[6,-2],[60,-34]]));s.push(M2([[6,0],[86,-30]]));s.push(M2([[8,2],[70,-8]]));var hv=[];hv.push(M2([[8,10],[56,30]]));hv.push(M2([[8,14],[38,92]]));behind(s,hv,[fw]);
    var e1=M2([[50,-14]])[0];s.push(circle(e1[0],e1[1],6*sc));s.push(circle(e1[0],e1[1],2.4*sc));var e2=M2([[38,30]])[0];var ec=[circle(e2[0],e2[1],5*sc),circle(e2[0],e2[1],2*sc)];behind(s,ec,[fw]);
    var edge=[];H(edge,M2([[30,-30],[66,-40],[90,-34],[86,-28],[62,-34],[30,-24]]),1.6,20);A(s,edge);var he=[];H(he,M2([[40,8],[62,24],[60,44],[54,40],[54,26],[38,14]]),1.6,-30);behind(s,he,[fw]);
    var ant=curve(M2([[3,-14],[10,-30],[22,-42]]),6);s.push(ant);for(var k=1;k<ant.length-1;k+=2){var p=ant[k];s.push([[p[0]-2.5,p[1]-1],p,[p[0]+2.5,p[1]+1.5]]);}});
  var body=EP(cx,cy+8*sc,5*sc,22*sc);var bp=rotateAbout(poly(body),cx,cy,tilt);FS(s,sol,bp);clipIn(s,[zz(cx-6*sc,cx+6*sc,cy-14*sc,cy+30*sc,1.6)],bp,[]);s.push(rotateAbout(poly(EP(cx,cy-16*sc,4.5*sc,4*sc)),cx,cy,tilt));
  var bark=[];for(var x=6;x<294;x+=RR(R,4.5,6)){var pts=[];for(var y=4;y<=196;y+=10)pts.push([x+2*Math.sin(y/14+x),y]);bark.push(curve(pts,3));}var kn=[];
  behind(s,bark.concat(kn),sol);return s;});

S('Gecko on a wall',['Sticky Toes','Warm Stucco','Night Hunter','Still as a Brooch','Porch Lamp Patrol'],function(R){
  var s=[],sol=[],cx=RR(R,130,170),cy=RR(R,96,104),a=RR(R,-0.5,0.5),sc=RR(R,1.25,1.4);function X(P){return rotateAbout(P.map(function(p){return [cx+p[0]*sc,cy+p[1]*sc];}),cx,cy,a);}
  var sp=X([[-70,0],[-40,0],[0,0],[30,0],[46,0]]),spine=curve(X([[56,0],[40,1],[10,2],[-20,0],[-44,-4],[-62,-14],[-74,-30],[-70,-46],[-58,-50],[-52,-42]]),8);
  var tb=tube(spine,function(u){return u<0.15?7*Math.sin(u/0.15*PI/2)+1:u<0.4?9-(u-0.15)*6:Math.max(0.8,7.5*(1-(u-0.4)/0.6));});FS(s,sol,tb.P);
  var head=blob(X([[40,-8],[54,-6],[62,0],[54,6],[40,8],[36,0]]),4);FS(s,sol,head);[[46,-6],[46,6]].forEach(function(e){var q=X([e])[0];s.push(circle(q[0],q[1],2.2*sc));});
  var legs=[[[28,-6],[34,-20],[44,-26]],[[28,6],[34,20],[44,26]],[[-14,-6],[-22,-20],[-12,-30]],[[-14,6],[-22,20],[-12,30]]];
  legs.forEach(function(L){var P=X(L);s.push(P);s.push(translate(P,1.4,1.4));var e=P[2],b=P[1],ang=Math.atan2(e[1]-b[1],e[0]-b[0]);for(var t=-2;t<=2;t++){var ta=ang+t*0.45,te=[e[0]+6*Math.cos(ta),e[1]+6*Math.sin(ta)];s.push([e,te]);s.push(circle(te[0]+1.2*Math.cos(ta),te[1]+1.2*Math.sin(ta),1.2));}});
  var dots=[];for(var k=0;k<RI(R,16,22);k++){var t=RR(R,0.05,0.75),p=spine[Math.floor(t*(spine.length-1))];dots.push(circle(p[0]+RR(R,-3,3),p[1]+RR(R,-3,3),1));}clipIn(s,dots,tb.P,[]);
  var bands=[];for(var b2=0;b2<6;b2++){var i=Math.floor((0.45+b2*0.08)*(spine.length-1)),p2=spine[i],q2=spine[i+1],nx=-(q2[1]-p2[1]),ny=q2[0]-p2[0],l=Math.hypot(nx,ny);bands.push([[p2[0]+nx/l*8,p2[1]+ny/l*8],[p2[0]-nx/l*8,p2[1]-ny/l*8]]);}clipIn(s,bands,tb.P,[]);
  var wall=[];wall.push(brickS(4,4,296,196,RR(R,17,20),RR(R,8,9)));var cr=[];var c0=[RR(R,20,80),4];cr.push(curve([c0,[c0[0]+10,40],[c0[0]-4,80],[c0[0]+12,110]],5));A(wall,cr);
  var lx=pick(R,[RR(R,26,40),RR(R,260,274)]);var lamp=[[lx-14,40],[lx+14,40],[lx+10,70],[lx-10,70]];FS(s,sol,lamp);s.push(zz(lx-10,lx+10,44,66,4));s.push(RP(lx-4,40,lx+4,30));s.push(rect(lx-8,30,lx+8,26));
  behind(s,wall,sol);return s;});

S('Fresnel lighthouse lens',['Beehive of Glass','First Order Light','Prisms in the Lamp Room','Bullseye Panel','Twenty Miles Out'],function(R){
  var s=[],sol=[],fy=RR(R,170,176),cx=RR(R,135,165),cy=RR(R,84,90),w=RR(R,48,54),hh=RR(R,64,70),y0=cy-hh,y1=cy+hh,bul=RR(R,24,27);
  var body=[[cx-w*0.62,y0]].concat(quad([cx-w*0.62,y0],[cx-w*1.15,cy],[cx-w*0.62,y1],16).slice(1)).concat([[cx+w*0.62,y1]]).concat(quad([cx+w*0.62,y1],[cx+w*1.15,cy],[cx+w*0.62,y0],16).slice(1));SOL(s,sol,body);s.push(poly(body));
  var hole=EP(cx,cy,bul+3,bul+3),pr=[];for(var y=y0+5;y<y1-2;y+=RR(R,4.6,5.2)){if(Math.abs(y-cy)<bul+4)continue;var t=(y-cy)/hh,xw=w*0.62+w*0.53*(1-t*t)*0.9,sag=4*(1-Math.abs(t));pr.push(quad([cx-xw,y],[cx,y+sag],[cx+xw,y],16));}clipIn(s,pr,body,[hole]);
  s.push(circle(cx,cy,bul+3));s.push(spiral(cx,cy,2,bul,RR(R,5,6),R()*TAU));s.push(circle(cx,cy,bul));
  [-0.55,0,0.55].forEach(function(f){var x=cx+w*f;s.push(clipIn([],[[[x,y0],[x,y1]]],body,[hole]).length?[[x,y0],[x,cy-bul-3]]:[[x,y0],[x,y0]]);s.push([[x,cy+bul+3],[x,y1]]);});
  var sh=[];H(sh,[[cx+w*0.62,y0],[cx+w*0.62,y1]].concat(quad([cx+w*0.62,y1],[cx+w*1.15,cy],[cx+w*0.62,y0],16).slice(1)).concat([]),1.4,90);A(s,sh);
  var cap=[[cx-w*0.66,y0],[cx-w*0.4,y0-16],[cx+w*0.4,y0-16],[cx+w*0.66,y0]];FS(s,sol,cap,1.6,0);s.push(RP(cx-6,y0-16,cx+6,y0-26));s.push(circle(cx,y0-30,4));
  var ped=[[cx-w*0.7,y1],[cx+w*0.7,y1],[cx+w*0.7,y1+6],[cx-w*0.7,y1+6]];FS(s,sol,ped);cyl(s,cx,fy,w*0.55,fy-y1-6,1.8,1);sol.push(RP(cx-w*0.55,fy+4,cx+w*0.55,y1+6));
  for(var r2=0;r2<3;r2++){var ry=y1+14+r2*((fy-y1-14)/3);s.push(arc(cx,ry,w*0.55,w*0.15,0,PI));}
  var fl=[];floorS(fl,R,fy,RI(R,14,18));behind(s,fl,sol);
  var bg=[],wy=fy-10;bg.push([[4,wy],[296,wy]]);bg.push([[4,wy-4],[296,wy-4]]);var hz=RR(R,108,118);var lt=[];H(lt,RP(4,8,296,wy-4),RR(R,11,13),45);H(lt,RP(4,8,296,wy-4),RR(R,11,13),-45);A(bg,lt);
  for(var m=4;m<296;m+=RR(R,56,64))bg.push(rect(m,8,m+5,wy-4));bg.push([[4,8],[296,8]]);var sea=[];sea.push(wave(4,296,hz,1,18,0));A(bg,sea);
  behind(s,bg,sol);return s;});

S('Radio telescope dish',['Listening to Quasars','Dish Toward the South','Big Ear','Signals from Far Away','Valley Array'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,176,182),cx=RR(R,130,165),tilt=RR(R,-0.55,-0.3),dr=RR(R,74,82),dcy=RR(R,72,80);function T(P){return rotateAbout(P,cx,dcy,tilt);}
  var rim=T(poly(EP(cx,dcy,dr,dr*0.28)));var bowl=T([[cx-dr,dcy]].concat(arc(cx,dcy,dr,dr*0.55,0,PI).reverse()).concat([[cx+dr,dcy]]).concat(arc(cx,dcy,dr,dr*0.28,0,PI).slice(1)));
  SOL(s,sol,bowl);s.push(bowl);s.push(rim);var pan=[];for(var k=1;k<8;k++){var f=-1+k/4;pan.push(T(quad([cx+dr*f,dcy+dr*0.28*Math.sqrt(1-f*f)],[cx+dr*f*0.9,dcy+dr*0.4],[cx+dr*f*0.4,dcy+dr*0.55],8)));}A(s,pan);
  var inner=T(poly(EP(cx,dcy,dr*0.94,dr*0.25)));s.push(inner);var ih=[];H(ih,T(EP(cx,dcy,dr*0.92,dr*0.24)),RR(R,3.4,4),tilt*180/PI);A(s,ih);
  var foc=T([[cx,dcy-dr*0.72]])[0],legs=[T([[cx-dr*0.9,dcy]])[0],T([[cx+dr*0.9,dcy]])[0],T([[cx,dcy+dr*0.25]])[0]];legs.forEach(function(p){s.push([p,foc]);});var fh=RP(foc[0]-5,foc[1]-6,foc[0]+5,foc[1]+6);FS(s,sol,T(fh).length?fh:fh,1.2,0);
  var piv=T([[cx,dcy+dr*0.5]])[0];var yoke=[[piv[0]-26,gy-62],[piv[0]-10,piv[1]],[piv[0]+10,piv[1]],[piv[0]+26,gy-62]];s.push(yoke);var mnt=[[piv[0]-34,gy-62],[piv[0]+34,gy-62],[piv[0]+30,gy-50],[piv[0]-30,gy-50]];FS(s,sol,mnt,1.6,0);
  var ped=[[piv[0]-20,gy-50],[piv[0]-26,gy],[piv[0]+26,gy],[piv[0]+20,gy-50]];FS(s,sol,ped);var z=[],d=1;for(var y=gy-46;y<gy;y+=7){var t=(y-gy+50)/50,hw=20+6*t;z.push(d>0?[piv[0]-hw,y]:[piv[0]+hw,y]);d=-d;}s.push(z);
  var hut=RP(piv[0]+40,gy,piv[0]+80,gy-26);if(hut[1][0]<292){FS(s,sol,hut);s.push([[hut[0][0]-3,gy-26],[hut[1][0]+3,gy-26]]);var W=RP(hut[0][0]+6,gy-20,hut[0][0]+16,gy-10);s.push(poly(W));H(s,W,1.2,45);s.push(rect(hut[0][0]+24,gy,hut[0][0]+32,gy-16));}
  var fd=[];for(var x=8;x<292;x+=RR(R,40,60)){if(Math.abs(x-piv[0])<50)continue;var sm=EP(x,gy-12,7,3);fd.push([[x,gy],[x,gy-10]]);fd.push(poly(sm));}A(bg,fd);
  hills(bg,R,gy-4,RR(R,30,46),RR(R,4,5),[],RR(R,10,25));gnd(bg,R,gy);return fin(s,R,bg,sol,gy-4);});

S('Lobster pots on the quay',['Stacked for Winter','Rope and Buoys','Harbor Wall, Low Tide','Slatted Traps','Gear Ashore'],function(R){
  var s=[],sol=[],bg=[],qy=RR(R,148,154),x=RR(R,40,70),pots=[];
  function pot(px,by,w,h){var top=by-h,P=[[px,by],[px,top+h*0.35]].concat(arc(px+w/2,top+h*0.35,w/2,h*0.35,PI,TAU).slice(1)).concat([[px+w,by]]);SOL(s,sol,P);s.push(P);
    var sl=[];for(var k=1;k<6;k++){var sx=px+w*k/6;sl.push([[sx,by],[sx,top+h*0.35-Math.sqrt(Math.max(0,1-Math.pow((sx-px-w/2)/(w/2),2)))*h*0.35]]);}A(s,sl);s.push([[px,by-h*0.3],[px+w,by-h*0.3]]);
    var m=[];H(m,RP(px+3,by-2,px+w-3,top+h*0.4),3,45);H(m,RP(px+3,by-2,px+w-3,top+h*0.4),3,-45);clipIn(s,m,RP(px+w*0.15,by-2,px+w*0.5,by-h*0.3+2),[]);s.push(rect(px+w*0.15,by-2,px+w*0.5,by-h*0.3+2));}
  var w=RR(R,40,44),h=RR(R,30,34);for(var i=0;i<3;i++)pot(x+i*(w+2),qy,w,h);for(var j=0;j<2;j++)pot(x+w/2+j*(w+2)+1,qy-h-1,w,h);if(R()<0.7)pot(x+w+2,qy-2*h-2,w,h);
  var cx=x+3*(w+2)+RR(R,24,34),coil=[];for(var c=0;c<5;c++)coil.push(EP(cx,qy-3-c*3.2,22-c*1.4,5));coil.forEach(function(P){s.push(poly(P));});sol.push(RP(cx-22,qy,cx+22,qy-20));
  var bx=cx+RR(R,34,44);if(bx<270){[[bx,0],[bx+18,1]].forEach(function(b,k){var by=qy-RR(R,6,8),P=EP(b[0],by-6,6,10);s.push(poly(P));sol.push(P);s.push([[b[0]-6,by-6],[b[0]+6,by-6]]);H(s,[[b[0]-6,by-6],[b[0]+6,by-6],[b[0]+5,by-12],[b[0]-5,by-12]],1.2,0);s.push([[b[0],by-16],[b[0],by-22]]);s.push(quad([b[0],by+4],[b[0]-10,qy+2],[cx+18,qy-6]));});}
  var qw=RP(4,qy,296,qy+16);SOL(s,sol,qw);s.push([[4,qy],[296,qy]]);A(s,[].concat(bricks(4,qy,296,qy+16,RR(R,16,20),8)));var bol=RR(R,10,30);var BL=[[bol,qy],[bol,qy-12]].concat(arc(bol+5,qy-12,5,4,PI,TAU)).concat([[bol+10,qy]]);FS(s,sol,BL,1.2,90);
  waterIn(bg,R,RP(4,qy+16,296,196),qy+20,194,RR(R,5,6));
  var hz=qy-RR(R,40,50);bg.push([[4,hz],[296,hz]]);var hw=[];hills(hw,R,hz,RR(R,14,22),RR(R,4,5),[],RR(R,10,20));A(bg,hw);var sea=[];var ws=waterS(R,4,296,hz+4,qy-2,RR(R,5,6),0.9);sea.push(ws);A(bg,sea);
  var hb=RR(R,200,260),boat=[[hb-30,hz+20],[hb+34,hz+20],[hb+26,hz+30],[hb-24,hz+30]];bg.push(poly(boat));bg.push(rect(hb-6,hz+20,hb+10,hz+8));bg.push([[hb+16,hz+20],[hb+16,hz-14]]);
  behind(s,bg,sol);return sky(s,R,hz,sol);});

// ---- chunk C: instruments, tools, kitchen, food, toys, furniture ----
function glassE(s,cx,cy,rx,ry){s.push(poly(EP(cx,cy,rx,ry)));return s;}

S('Sitar',['Sympathetic Strings','Gourd and Long Neck','Evening Raga','Curved Frets','Seventeen Strings Waiting'],function(R){
  var s=[],sol=[],fy=RR(R,166,172),a=RR(R,-0.42,-0.32),f=sgn(R),cx=f>0?RR(R,70,84):RR(R,216,230),cy=fy-38,sc=RR(R,1,1.08);
  function X(P){return rotateAbout(P.map(function(p){return [cx+p[0]*sc*f,cy+p[1]*sc];}),cx,cy,a*f);}
  var gd=X(EP(0,0,40,34));FS(s,sol,gd);var cr=[];H(cr,X([[0,-34]].concat(arc(0,0,40,34,-PI/2,PI/2)).concat(arc(0,0,22,34,PI/2,-PI/2))),1.7,0);A(s,cr);
  var top=X(poly(EP(-4,0,30,26)).slice(0,-1));s.push(poly(top));var ros=X([[-10,0]])[0];s.push(scallop(ros[0],ros[1],8,8,8,0.25));s.push(circle(ros[0],ros[1],3));
  var nk=X([[30,-8],[210,-7],[210,7],[30,8]]);FS(s,sol,nk);var fr=[];for(var k=0;k<15;k++){var x=46+k*10.5;fr.push(X(quad([x,-10],[x+4,0],[x,10],6)));}A(s,fr);
  var g2=X(EP(150,20,13,13));FS(s,sol,g2);H(s,X([[150,7]].concat(arc(150,20,13,13,-PI/2,PI/2))),1.4,0);s.push(X([[150,7],[150,8]]));
  var pb=X([[210,-8],[232,-10],[234,10],[210,8]]);FS(s,sol,pb,1.4,90);for(var p=0;p<4;p++){s.push(X([[214+p*5,-8],[216+p*5,-20]]));s.push(circle.apply(null,X([[216+p*5,-21]])[0].concat([1.6])));}
  for(var q=0;q<6;q++){var px=60+q*24;s.push(X([[px,8],[px+2,15]]));}
  var br=X([[-22,-8],[-18,-8],[-18,8],[-22,8]]);FS(s,sol,br,1,0);var st=[];for(var t=0;t<5;t++){var y=-5+t*2.5;st.push(X([[-20,y],[212,y*0.7]]));}A(s,st);
  var rug=[[4,fy+4],[296,fy+4],[296,fy+20],[4,fy+20]];var rg=[];rg.push([[4,fy+4],[296,fy+4]]);rg.push([[4,fy+20],[296,fy+20]]);rg.push(zz(4,296,fy+6,fy+18,6));behind(s,rg,sol);sol.push(rug);
  var cush=f>0?[RR(R,232,250),fy]:[RR(R,40,58),fy],cu=blob([[cush[0]-30,cush[1]],[cush[0]-26,cush[1]-14],[cush[0],cush[1]-18],[cush[0]+26,cush[1]-14],[cush[0]+30,cush[1]]],5);FS(s,sol,cu);s.push(arc(cush[0],cush[1]-9,22,4,0,PI));var tsl=[];[-30,30].forEach(function(o){tsl.push([[cush[0]+o,cush[1]-2],[cush[0]+o*1.15,cush[1]+4]]);});A(s,tsl);
  room(s,R,fy,sol);return s;});

S('Bongo drums',['Macho and Hembra','Between the Knees','Rumba Corner','Two Heads, One Block','Afternoon Rhythm'],function(R){
  var s=[],sol=[],ty=RR(R,150,156),cx=RR(R,130,170);
  function drum(x,b,r,h){var ry=r*0.32,top=b-h,body=[[x-r,top]].concat(quad([x-r,top],[x-r*0.9,b-h*0.4],[x-r*0.72,b],10).slice(1)).concat(arc(x,b,r*0.72,ry*0.72,PI,0).slice(1)).concat(quad([x+r*0.72,b],[x+r*0.9,b-h*0.4],[x+r,top],10).slice(1));SOL(s,sol,body);s.push(body);
    var head=EP(x,top,r,ry);SOL(s,sol,head);s.push(poly(head));s.push(arc(x,top,r+2,ry+1.5,0,PI));s.push(arc(x,top+5,r*0.99,ry,0,PI));
    var lugs=[];for(var k=0;k<5;k++){var t=-0.8+k*0.4,lx=x+t*r;lugs.push([[lx,top+ry*Math.sqrt(1-t*t)+1],[lx*0.97+x*0.03,b-h*0.35]]);s.push(rect(lx-2,b-h*0.35,lx+2,b-h*0.35+6));}A(s,lugs);
    var wd=[];var zzz=zz(x-r,x+r,top+6,b+ry,RR(R,3,3.6));clipIn(s,[zzz],body,[head]);var sh=[];H(sh,[[x+r*0.3,top+ry],[x+r,top],[x+r*0.72,b],[x+r*0.2,b]],1.4,80);clipIn(s,sh,body,[head]);}
  var r1=RR(R,30,34),r2=RR(R,38,42),h=RR(R,48,54),x1=cx-r1-6,x2=cx+r2-4;drum(x1,ty,r1,h-4);drum(x2,ty,r2,h);
  var blk=RP(x1+r1*0.6,ty-h*0.6,x2-r2*0.6,ty-h*0.35);FS(s,sol,blk,1.2,0);
  var mx=cx+r2*2+RR(R,8,16);if(mx<280){var mar=EP(mx,ty-32,10,14);FS(s,sol,mar);H(s,mar,2,30);s.push([[mx,ty-18],[mx-4,ty-2],[mx+2,ty-2]]);}
  onTable(s,R,ty,sol);return s;});

S('Music box',['Wind It Once More','Pins and Comb','Waltz Under the Lid','Velvet and Brass','Little Mechanism'],function(R){
  var s=[],sol=[],ty=RR(R,158,164),cx=RR(R,130,170),bw=RR(R,62,70),bh=RR(R,34,38),d=RR(R,30,36);
  var x0=cx-bw,x1=cx+bw,front=RP(x0,ty,x1,ty-bh);FS(s,sol,front);var topP=[[x0,ty-bh],[x0+d,ty-bh-d*0.6],[x1+d,ty-bh-d*0.6],[x1,ty-bh]];SOL(s,sol,topP);s.push(poly(topP));
  var sideP=[[x1,ty],[x1,ty-bh],[x1+d,ty-bh-d*0.6],[x1+d,ty-d*0.6]];FS(s,sol,sideP,1.6,90);
  var inl=RP(x0+8,ty-8,x1-8,ty-bh+8);s.push(poly(inl));s.push(scallop(cx,ty-bh/2,10,8,8,0.3));s.push(circle(cx,ty-bh/2,3));
  var lidA=RR(R,0.15,0.35),lid=[[x0+d,ty-bh-d*0.6],[x1+d,ty-bh-d*0.6],[x1+d+8,ty-bh-d*0.6-60],[x0+d+8+lidA*10,ty-bh-d*0.6-58]];FS(s,sol,lid);var ln=[];H(ln,[[x0+d+6,ty-bh-d*0.6-4],[x1+d-6,ty-bh-d*0.6-4],[x1+d+2,ty-bh-d*0.6-54],[x0+d+12,ty-bh-d*0.6-52]],RR(R,2.2,2.6),RR(R,30,60));A(s,ln);
  var mr=[cx+d*0.5-30,ty-bh-d*0.3];var cyP=RP(mr[0]-20,mr[1]+6,mr[0]+20,mr[1]-6);s.push(poly(cyP));var pins=[];for(var i=0;i<30;i++)pins.push([[mr[0]+RR(R,-18,18),mr[1]+RR(R,-4,4)],[mr[0]+RR(R,-18,18)+0.6,mr[1]+RR(R,-4,4)]]);clipIn(s,pins,cyP,[]);
  s.push(zz(mr[0]+24,mr[0]+50,mr[1]-6,mr[1]+4,2));s.push(rect(mr[0]+52,mr[1]-8,mr[0]+60,mr[1]+6));s.push(circle(mr[0]-24,mr[1],4));
  var ck=[[x1+d*0.5,ty-bh*0.5],[x1+d*0.5+16,ty-bh*0.5-4],[x1+d*0.5+16,ty-bh*0.5-16]];s.push(ck);s.push(rect(x1+d*0.5+13,ty-bh*0.5-24,x1+d*0.5+19,ty-bh*0.5-14));
  var key=[RR(R,30,60)];if(cx-bw>70){var kx=key[0],k=[[kx,ty],[kx+30,ty]];s.push(k);s.push(circle(kx-5,ty-4,5));s.push([[kx+30,ty],[kx+30,ty-6],[kx+24,ty-6]]);}
  onTable(s,R,ty,sol);return s;});

S("Cobbler's last and boots",['Resoled by Friday','Iron Foot','Tacks and Leather','Workbench, Back Room','Hobnails'],function(R){
  var s=[],sol=[],ty=RR(R,160,166),lx=RR(R,70,96);
  var post=RP(lx-4,ty,lx+4,ty-60);FS(s,sol,post);H(s,RP(lx,ty,lx+4,ty-60),1.2,90);s.push([[lx-18,ty],[lx+18,ty]]);
  [[-1,-60,-24],[1,-60,24],[0,-72,0]].forEach(function(o){var bx=lx+o[2]*0.8,by=ty+o[1],ft=o[0]===0?[[bx-6,by],[bx-6,by-10],[bx+20,by-14],[bx+26,by-8],[bx+20,by]]:[[bx,by],[bx+o[0]*6,by-6],[bx+o[0]*28,by-10],[bx+o[0]*30,by-4],[bx+o[0]*26,by]];FS(s,sol,ft,1.2,0);s.push([[lx,ty-60],[bx,by]]);});
  function boot(x,b,dir){var P=[[x,b],[x,b-56],[x+22*dir,b-58],[x+22*dir,b-26],[x+30*dir,b-20],[x+44*dir,b-14],[x+46*dir,b-4],[x+46*dir,b],[x,b]];FS(s,sol,P);
    s.push([[x+0,b-4],[x+46*dir,b-4]]);var hs=[];H(hs,[[x+22*dir,b-58],[x+22*dir,b-26],[x+16*dir,b-26],[x+16*dir,b-56]],1.4,90);A(s,hs);var lc=[[x+14*dir,b-52]];for(var k=0;k<7;k++){lc.push([x+(k%2?20:14)*dir,b-48+k*4.5]);}s.push(lc);s.push(rect(x+2*dir,b-58,x+20*dir,b-54));
    var nl=[];for(var n=0;n<5;n++)nl.push(circle(x+(6+n*8)*dir,b-1.5,0.8));s.push(arc(x+2*dir,b-40,6,10,PI*0.5,PI*1.5));}
  var b1=lx+RR(R,40,54);boot(b1,ty,1);boot(b1+RR(R,72,80),ty,1);
  var hm=[RR(R,240,260),ty-2];s.push(RP(hm[0]-24,hm[1],hm[0]+12,hm[1]-4));s.push(poly([[hm[0]+12,hm[1]-8],[hm[0]+26,hm[1]-8],[hm[0]+30,hm[1]],[hm[0]+12,hm[1]]]));var tk=[];for(var t=0;t<5;t++){var tx=hm[0]-30+t*5;tk.push([[tx,ty],[tx+2,ty-4]]);}A(s,tk);
  onTable(s,R,ty,sol);return s;});

S('Stepladder and paint cans',['Half a Wall Done','Second Coat','Drop Cloth Days','Rung by Rung','Fresh Color'],function(R){
  var s=[],sol=[],fy=RR(R,164,170),lx=RR(R,110,140),lt=RR(R,40,48),lw=RR(R,26,30);
  var fr=[[lx-lw,fy],[lx-8,lt],[lx+8,lt],[lx+lw,fy]];s.push([[lx-lw,fy],[lx-8,lt]]);s.push([[lx-lw+5,fy],[lx-4,lt]]);s.push([[lx+8,lt],[lx+lw+22,fy]]);s.push([[lx+4,lt],[lx+lw+17,fy]]);sol.push(poly([[lx-lw,fy],[lx-8,lt],[lx+8,lt],[lx+lw+22,fy]]));
  var tp=RP(lx-12,lt,lx+12,lt-6);FS(s,sol,tp,1.2,0);for(var k=1;k<5;k++){var t=k/5,y=lt+(fy-lt)*t,x0=lx-8+(-lw+8)*t,x1=lx-2+(-lw+12)*t;var st=[[x0,y],[x1+18,y],[x1+18,y+3],[x0,y+3]];FS(s,sol,st);}
  s.push([[lx-lw*0.5,lt+(fy-lt)*0.5],[lx+lw*0.7+8,lt+(fy-lt)*0.6]]);
  var cn=[[lx-4,lt-6,9,14],[lx+lw+40,fy,13,22],[lx+lw+70,fy,11,18],[lx-lw-30,fy,12,20]];cn.forEach(function(c,i){if(c[0]<20||c[0]>280)return;cyl(s,c[0],c[1],c[2],c[3],1.6,1);sol.push(RP(c[0]-c[2],c[1]+3,c[0]+c[2],c[1]-c[3]-c[2]*0.3));s.push(arc(c[0],c[1]-c[3],c[2]*0.8,c[2]*0.2,0,PI));s.push(arc(c[0],c[1]-c[3]-c[2]*0.3,c[2]*0.9,c[2]*0.9,PI,TAU));
    for(var d=0;d<3;d++){var dx=c[0]-c[2]+c[2]*0.6*(d+0.5);s.push([[dx,c[1]-c[3]+c[2]*0.2],[dx,c[1]-c[3]+RR(R,6,12)]]);}});
  var br=[lx+lw+56,fy-4];s.push(RP(br[0],br[1],br[0]+26,br[1]-4));s.push(poly([[br[0]+26,br[1]+1],[br[0]+40,br[1]+2],[br[0]+40,br[1]-7],[br[0]+26,br[1]-5]]));s.push(zz(br[0]+30,br[0]+40,br[1]-6,br[1]+1,1.6));
  var cloth=[[4,fy+8]];for(var x=4;x<=200;x+=12)cloth.push([x+6,fy+8+RR(R,2,6)],[x+12,fy+8]);s.push(cloth);var cf=[];for(var q=0;q<6;q++){var qx=RR(R,10,290);cf.push(quad([qx,fy+10],[qx+RR(R,-10,10),fy+18],[qx+RR(R,-14,14),196]));}A(s,cf);sol.push(cloth.concat([[cloth[cloth.length-1][0],196],[4,196]]));var ch2=[];H(ch2,cloth.concat([[cloth[cloth.length-1][0],196],[4,196]]),RR(R,6,7),RR(R,20,40));behind(s,ch2,[]);
  var edge=RR(R,170,230),wall=[];var ws=[];H(ws,RP(4,4,edge,fy-8),RR(R,4.4,5.2),90);A(wall,ws);var ragged=[[edge,4]];for(var y=4;y<fy-8;y+=8)ragged.push([edge+RR(R,-3,3),y+4],[edge,y+8]);wall.push(ragged);
  var roll=[[edge-6,30],[edge+20,30]];var rl=RP(edge+20,24,edge+44,36);
  var flr=[];floorS(flr,R,fy,RI(R,14,18));behind(s,flr,sol);behind(s,wall,sol);behind(s,[[[4,fy-8],[296,fy-8]],[[4,fy-3],[296,fy-3]]],sol);return s;});

S('Crank pencil sharpener',['Grind to a Point','Schoolroom Crank','Cedar Curls','Sharp for the Test','Ten Turns'],function(R){
  var s=[],sol=[],ty=RR(R,156,162),cx=RR(R,110,150),cy=ty-RR(R,52,58),r=RR(R,22,25),L=RR(R,44,50);
  var body=[[cx-L,cy-r]].concat(arc(cx-L,cy,r*0.35,r,-PI/2,-PI*1.5).slice(0,0)).concat([[cx+10,cy-r]]).concat(arc(cx+10,cy,r*0.35,r,-PI/2,PI/2).slice(1)).concat([[cx-L,cy+r]]).concat(arc(cx-L,cy,r*0.35,r,PI/2,PI*1.5).slice(1));FS(s,sol,body);
  var fc=EP(cx-L,cy,r*0.35,r);s.push(poly(fc));var dial=EP(cx-L-1,cy,r*0.3,r*0.85);s.push(poly(dial));for(var k=0;k<6;k++){var a=k*PI/3;s.push(circle(cx-L-1+r*0.2*Math.cos(a),cy+r*0.62*Math.sin(a),1.4));}
  var sh=[];H(sh,[[cx-L+4,cy+r*0.3],[cx+10,cy+r*0.3],[cx+10,cy+r],[cx-L+4,cy+r]],1.4,0);A(s,sh);var gr=[];for(var g=0;g<5;g++)gr.push([[cx-L+10+g*10,cy-r],[cx-L+10+g*10,cy+r]]);A(s,gr);
  var ax=[cx+10+r*0.35,cy];s.push([ax,[ax[0]+8,ax[1]]]);var ca=RR(R,-1.2,1.2),ce=[ax[0]+8+26*Math.sin(ca)*0.4,ax[1]-26*Math.cos(ca)];s.push(lens([ax[0]+8,ax[1]],ce,2.6));var kn=EP(ce[0]+6,ce[1],7,4);FS(s,sol,kn,1,90);s.push([[ce[0],ce[1]],[ce[0]+2,ce[1]]]);
  var base=[[cx-L-6,cy+r],[cx+14,cy+r],[cx+14,ty],[cx-L-6,ty]];FS(s,sol,base);var bx=[];H(bx,[[cx-L-2,cy+r+4],[cx+10,cy+r+4],[cx+10,ty-3],[cx-L-2,ty-3]],2.2,45);A(s,bx);s.push(rect(cx-L-2,cy+r+4,cx+10,ty-3));
  var cup=[cx+RR(R,70,90),ty],cw=16,ch=34;var CP=[[cup[0]-cw,cup[1]],[cup[0]-cw-2,cup[1]-ch],[cup[0]+cw+2,cup[1]-ch],[cup[0]+cw,cup[1]]];FS(s,sol,CP);clipIn(s,[zz(cup[0]-cw-2,cup[0]+cw+2,cup[1]-ch,cup[1],3.4)],CP,[]);
  for(var p=0;p<RI(R,4,5);p++){var px=cup[0]-10+p*5.5,ang=RR(R,-0.25,0.25),len=RR(R,40,56),tip=[px+Math.sin(ang)*len,cup[1]-ch-Math.cos(ang)*len];var pc=[[px-2.2,cup[1]-ch],[tip[0]-2.2,tip[1]+6],[tip[0],tip[1]],[tip[0]+2.2,tip[1]+6],[px+2.2,cup[1]-ch]];s.push(pc);sol.push(pc);s.push([[tip[0]-2.2,tip[1]+6],[tip[0]+2.2,tip[1]+6]]);}
  var curl=[];for(var c=0;c<RI(R,4,6);c++){var sx=cx-L-RR(R,8,40),sy=ty-2;curl.push(spiral(sx,sy-3,0.5,3,1.4,R()*TAU));}A(s,curl);var pn=[[cx-L-60,ty-2],[cx-L-14,ty-2]];if(pn[0][0]>8){s.push(pn);s.push([[cx-L-14,ty-2],[cx-L-8,ty-4],[cx-L-14,ty-6],[cx-L-60,ty-6],[cx-L-60,ty-2]]);}
  onTable(s,R,ty,sol);return s;});

S('Sushi on a board',['Omakase Board','Rice, Fish, Wasabi','Counter Seat','Eight Pieces','Ginger on the Side'],function(R){
  var s=[],sol=[],ty=RR(R,154,160),bx0=RR(R,34,48),bx1=RR(R,250,266),bt=ty-RR(R,10,12);
  var board=[[bx0,ty],[bx1,ty],[bx1+10,bt-14],[bx0+10,bt-14]];var bst=[poly(board),RP(bx0,ty,bx1,ty+5)];for(var g=0;g<4;g++){var gy=bt-12+g*4;bst.push(wave(bx0+12,bx1+4,gy,0.6,RR(R,30,50),g));}
  s.push(RP(bx0+12,ty+5,bx0+22,ty+10));s.push(RP(bx1-22,ty+5,bx1-12,ty+10));
  var x=bx0+RR(R,20,26),items=[];while(x<bx1-30){var k=pick(R,['nigiri','nigiri','maki','maki','gunkan']);items.push([k,x]);x+=k==='maki'?RR(R,28,32):RR(R,40,46);}
  items.forEach(function(it){var k=it[0],x=it[1],y=bt-4;
    if(k==='nigiri'){var rice=blob([[x-16,y],[x-14,y-10],[x,y-12],[x+14,y-10],[x+16,y]],4);var fish=[[x-20,y-8]].concat(quad([x-20,y-8],[x,y-24],[x+20,y-10],12).slice(1)).concat(quad([x+20,y-10],[x+4,y-12],[x-20,y-8],8).slice(1));var tmp=[poly(fish)];var fs=[];for(var q=0;q<4;q++)fs.push([[x-12+q*7,y-18+q*0.5],[x-8+q*7,y-10]]);A(tmp,fs);behind(s,tmp,sol);sol.push(fish);behind(s,[poly(rice)],sol);sol.push(rice);var dots=[];for(var d=0;d<4;d++)dots.push(circle(x-10+d*6,y-4,1));behind(s,dots,sol.slice(0,-1));}
    else if(k==='maki'){var top=EP(x,y-20,11,5),side=[[x-11,y-20],[x-11,y]].concat(arc(x,y,11,5,PI,0)).concat([[x+11,y-20]]);behind(s,[side,poly(top),spiral(x,y-20,1,6,2,0)],sol);H(s,[[x+4,y-18],[x+11,y-20],[x+11,y],[x+4,y+2]],1.2,90);sol.push(side.concat(arc(x,y-20,11,5,0,PI).reverse()));}
    else{var cup=[[x-14,y],[x-14,y-16],[x+14,y-16],[x+14,y]];var roe=[];for(var e=0;e<8;e++)roe.push(circle(x-11+e*3,y-19,1.5));behind(s,[poly(cup)].concat(roe),sol);var nr=[];H(nr,cup,1.4,90);behind(s,nr,sol);sol.push(cup);}});
  var gx=bx1-14,gg=scallop(gx,bt-8,10,5,6,0.3);behind(s,[gg],sol);var wb=blob([[bx0+14,bt-4],[bx0+16,bt-10],[bx0+22,bt-8],[bx0+20,bt-3]],3);
  var cs=[[bx0+30,ty+16],[bx1+20,ty+8]],cs2=[[bx0+30,ty+20],[bx1+20,ty+13]];s.push(cs);s.push(cs2);var rest=RP(bx1-30,ty+18,bx1-18,ty+12);s.push(poly(rest));
  var sc=EP(RR(R,262,276),ty-6,14,4);if(sc[0][0]<294){s.push(poly(sc));s.push(arc(sc[0][0]-14,ty-6,14,8,0,PI));}
  behind(s,bst,sol);sol.push(board);onTable(s,R,ty,sol);return s;});

S('Coffee siphon',['Vacuum Brew','Two Glass Globes','Flame and Rising Water','Laboratory Breakfast','Draw Down'],function(R){
  var s=[],sol=[],ty=RR(R,160,166),cx=RR(R,120,160),lr=RR(R,28,31),ly=ty-24-lr;
  var lower=EP(cx,ly,lr,lr);SOL(s,sol,lower);s.push(poly(lower));var lq=[[cx-lr*0.95,ly+6]].concat(arc(cx,ly,lr,lr,PI*0.08+0.1,PI*0.92).reverse()).concat([[cx+lr*0.95,ly+6]]);var lh=[];H(lh,arc(cx,ly,lr-2,lr-2,0.2,PI-0.2).concat([[cx-lr*0.96,ly+6],[cx+lr*0.96,ly+6]]),1.8,0);A(s,lh);s.push([[cx-lr*0.96,ly+6],[cx+lr*0.96,ly+6]]);
  s.push(EP(cx+lr*0.5,ly-lr*0.5,3,6).concat([]));
  var nk=RP(cx-6,ly-lr+1,cx+6,ly-lr-8);s.push(poly(nk));var ut=ly-lr-8,uw=RR(R,24,27),uh=RR(R,52,58);var upper=[[cx-6,ut]].concat(quad([cx-6,ut],[cx-uw*1.1,ut-6],[cx-uw,ut-uh*0.5],10).slice(1)).concat([[cx-uw,ut-uh],[cx+uw,ut-uh],[cx+uw,ut-uh*0.5]]).concat(quad([cx+uw,ut-uh*0.5],[cx+uw*1.1,ut-6],[cx+6,ut],10).slice(1));
  SOL(s,sol,upper);s.push(upper);s.push([[cx-3,ut],[cx-3,ly+lr*0.4]]);s.push([[cx+3,ut],[cx+3,ly+lr*0.4]]);var uq=[];H(uq,[[cx-uw,ut-uh*0.35],[cx+uw,ut-uh*0.35],[cx+uw,ut-uh*0.5]].concat(quad([cx+uw,ut-uh*0.5],[cx+uw*1.1,ut-6],[cx+6,ut],10)).concat([[cx-6,ut]]).concat(quad([cx-6,ut],[cx-uw*1.1,ut-6],[cx-uw,ut-uh*0.5],10)),1.6,0);clipIn(s,uq,upper,[]);
  s.push(EP(cx,ut-uh,uw,3).concat([[cx+uw,ut-uh]]));var bub=[];for(var b=0;b<4;b++)bub.push(circle(cx+RR(R,-10,10),ut-uh*0.38+RR(R,-3,3),1.4));A(s,bub);
  var sx=cx+lr+10;var stand=[[sx,ty],[sx,ut-uh*0.7],[cx+uw+2,ut-uh*0.7]];s.push(stand);s.push(rect(sx-3,ty,sx+3,ty-4));s.push([[sx,ly],[cx+lr,ly]]);s.push(RP(sx-12,ty,sx+30,ty-6));s.push(circle(cx+uw+4,ut-uh*0.7,3));
  var bn=[[cx-10,ty],[cx-12,ly+lr+12],[cx+12,ly+lr+12],[cx+10,ty]];FS(s,sol,bn,1.4,90);var fl=blob([[cx,ly+lr+12],[cx-5,ly+lr+6],[cx,ly+lr+1],[cx+5,ly+lr+6]],4);s.push(fl);
  var cpx=cx+RR(R,80,100);if(cpx<270){var cp=[[cpx-16,ty],[cpx-18,ty-22],[cpx+18,ty-22],[cpx+16,ty]];FS(s,sol,cp);s.push(EP(cpx,ty-22,18,4).concat([[cpx+18,ty-22]]));s.push(arc(cpx+20,ty-12,7,7,-PI/2,PI/2));var sau=EP(cpx,ty,28,5);s.push(poly(sau));sol.push(sau);var st=[];for(var w=0;w<2;w++){var wx=cpx-6+w*10,p=[[wx,ty-26]];for(var k=1;k<6;k++)p.push([wx+4*Math.sin(k*1.3+w),ty-26-k*5]);st.push(curve(p,4));}A(s,st);}
  var jar=RP(cx-lr-70,ty,cx-lr-34,ty-40);if(jar[0][0]>8){FS(s,sol,jar);s.push(rect(cx-lr-72,ty-40,cx-lr-32,ty-48));var bn2=[];for(var q=0;q<10;q++)bn2.push(poly(EP(RR(R,jar[0][0]+5,jar[1][0]-5),RR(R,ty-34,ty-5),2.4,1.6)));clipIn(s,bn2,jar,[]);}
  onTable(s,R,ty,sol);return s;});

S('Cupcakes on a tray',['Six for the Party','Swirls and Cherries','Cooling Rack','Bake Sale Saturday','Frosting Peaks'],function(R){
  var s=[],sol=[],ty=RR(R,160,166),n=RI(R,4,5),gap=RR(R,44,50),x0=150-gap*(n-1)/2+RR(R,-10,10);
  var tray=[[x0-34,ty],[x0+gap*(n-1)+34,ty],[x0+gap*(n-1)+44,ty-12],[x0-24,ty-12]];FS(s,sol,tray);s.push(zz(x0-26,x0+gap*(n-1)+40,ty-11,ty-1,5));
  var order=[];for(var i=0;i<n;i++)order.push(i);
  for(var i2=0;i2<n;i2++){var x=x0+i2*gap+RR(R,-3,3),b=ty-6,lw=RR(R,15,17),lh=RR(R,20,24),liner=[[x-lw*0.8,b],[x-lw,b-lh],[x+lw,b-lh],[x+lw*0.8,b]];SOL(s,sol,liner);s.push(poly(liner));var pl=[],d=1;for(var k=0;k<=10;k++){var t=k/10;pl.push(d>0?[x-lw+2*lw*t,b-lh]:[x-lw*0.8+1.6*lw*t,b]);d=-d;}s.push(pl);
    var fr=[];var lv=RI(R,3,4),top=b-lh;for(var l=0;l<lv;l++){var w=lw*(1.1-l*0.24),yy=top-l*7;fr.push([[x-w,yy]].concat(scallop(x,yy-3,w,4,7,0.2).slice(17,0)).concat(arc(x,yy,w,6,PI,TAU)).concat([[x+w,yy]]));}
    var cream=[[x-lw*1.1,top]].concat(curve([[x-lw*1.1,top],[x-lw,top-8],[x-lw*0.6,top-16],[x-4,top-26],[x,top-30],[x+4,top-26],[x+lw*0.6,top-16],[x+lw,top-8],[x+lw*1.1,top]],5)).concat([[x-lw*1.1,top]]);SOL(s,sol,cream);s.push(cream);
    for(var l2=1;l2<lv;l2++){var yy2=top-l2*8,w2=lw*(1-l2*0.24);s.push(arc(x,yy2,w2,3,0,PI));}
    if(R()<0.75){var ch=EP(x,top-33,4,4);s.push(poly(ch));H(s,ch,1,30);s.push(quad([x,top-37],[x+4,top-44],[x+8,top-46]));}else{var sp=[];for(var q=0;q<6;q++){var px=x+RR(R,-lw*0.7,lw*0.7),py=top-RR(R,4,20);sp.push([[px,py],[px+2,py-1]]);}A(s,sp);}
    var lsh=[];H(lsh,[[x+lw*0.4,b-lh],[x+lw,b-lh],[x+lw*0.8,b],[x+lw*0.3,b]],1.4,90);A(s,lsh);}
  var wsk=[RR(R,24,40),ty-4];if(x0-34-30>wsk[0]){s.push([[wsk[0],wsk[1]],[wsk[0]+26,wsk[1]-10]]);for(var w3=0;w3<4;w3++)s.push(arc(wsk[0]+34,wsk[1]-13,10,4+w3*1.5,PI*0.8,PI*2.2).map(function(p){return rotateAbout([p],wsk[0]+34,wsk[1]-13,-0.36)[0];}));}
  onTable(s,R,ty,sol);return s;});

S('Lemons and a juicer',['Squeeze Before Noon','Ribbed Glass Cone','Halves and Pips','Lemonade Morning','Zest and Juice'],function(R){
  var s=[],sol=[],ty=RR(R,156,162),jx=RR(R,110,150);
  var dish=[[jx-44,ty-14],[jx-38,ty],[jx+38,ty],[jx+44,ty-14]];FS(s,sol,dish);s.push(EP(jx,ty-14,44,7).concat([[jx+44,ty-14]]));var jq=[];H(jq,arc(jx,ty-14,40,5,0,PI).concat([[jx-38,ty-4],[jx+38,ty-4]]),1.6,0);A(s,jq);
  var cone=[[jx-22,ty-16],[jx-6,ty-52],[jx,ty-56],[jx+6,ty-52],[jx+22,ty-16]];FS(s,sol,cone);for(var r=-3;r<=3;r++){s.push([[jx+r*1.6,ty-54],[jx+r*6.8,ty-17]]);}
  var sp=[[jx+44,ty-14],[jx+56,ty-18],[jx+46,ty-10]];s.push(sp);var hd=arc(jx-44,ty-8,10,8,PI*0.5,PI*1.5);s.push(hd);
  function half(x,y,r,a){var P=EP(x,y,r,r*0.8);FS(s,sol,P);s.push(poly(EP(x,y,r-3,(r-3)*0.8)));for(var k=0;k<8;k++){var an=k*PI/4;s.push([[x+2*Math.cos(an),y+1.6*Math.sin(an)],[x+(r-4)*Math.cos(an),y+(r-4)*0.8*Math.sin(an)]]);}s.push(circle(x,y,1.6));s.push(arc(x,y+2,r,r*0.8+2,0.2,PI-0.2));}
  function whole(x,y,r,a){var P=rotateAbout(blob([[x-r*1.25,y],[x-r*0.8,y-r*0.8],[x,y-r],[x+r*0.8,y-r*0.8],[x+r*1.25,y],[x+r*0.8,y+r*0.8],[x,y+r],[x-r*0.8,y+r*0.8]],4),x,y,a);FS(s,sol,P);var dm=[];for(var k=0;k<10;k++)dm.push(circle(x+RR(R,-r*0.7,r*0.7),y+RR(R,-r*0.5,r*0.5),0.6));clipIn(s,dm,P,[]);var sh=[];H(sh,rotateAbout([[x,y+r*0.2],[x+r*1.1,y+r*0.1],[x+r*0.6,y+r*0.85],[x,y+r]],x,y,a),1.6,30);clipIn(s,sh,P,[]);}
  var hx=jx+RR(R,70,84);half(hx,ty-12,16);if(hx+46<290)half(hx+38,ty-10,14);
  whole(jx-RR(R,70,80),ty-14,15,RR(R,-0.3,0.3));if(jx-120>20)whole(jx-110,ty-12,13,RR(R,-0.4,0.4));
  var lf=lens([jx-58,ty-26],[jx-30,ty-44],6);FS(s,sol,lf);s.push([[jx-58,ty-26],[jx-30,ty-44]]);
  var kn=[[jx+60,ty+6],[jx+140,ty+4]];onTable(s,R,ty,sol);return s;});

S('Marble run',['Down the Zigzag','Six Ramps, One Marble','Clack and Roll','Living Room Gravity','Funnel to Floor'],function(R){
  var s=[],sol=[],fy=RR(R,170,176),cx=RR(R,130,170),hw=RR(R,46,52),top=RR(R,24,30);
  var frL=RP(cx-hw-6,fy,cx-hw,top),frR=RP(cx+hw,fy,cx+hw+6,top);FS(s,sol,frL,1.4,90);FS(s,sol,frR,1.4,90);s.push(rect(cx-hw-12,fy,cx+hw+12,fy-6));
  var lv=RI(R,5,6),dy=(fy-top-30)/lv,marb=[];
  for(var i=0;i<lv;i++){var y=top+24+i*dy,dir=i%2?1:-1,yl=y+(dir>0?0:9),yr=y+(dir>0?9:0);var ramp=[[cx-hw,yl],[cx+hw,yr],[cx+hw,yr+5],[cx-hw,yl+5]];FS(s,sol,ramp);s.push([[cx-hw,yl-3],[cx+hw,yr-3]]);
    var px=cx+(R()-0.5)*hw*1.2,py=yl+(yr-yl)*(px-cx+hw)/(2*hw);if(R()<0.6){var m=EP(px,py-5,5,5);FS(s,sol,m);H(s,EP(px+1.5,py-5,2.4,3.6),0.9,40);}
    var ex=dir>0?cx+hw-8:cx-hw+8;s.push([[ex,(dir>0?yr:yl)+5],[ex,(dir>0?yr:yl)+dy-2]]);}
  var fun=[[cx-22,top+18],[cx-30,top-4],[cx+30,top-4],[cx+22,top+18]];FS(s,sol,fun);s.push(zz(cx-24,cx+24,top,top+14,4));s.push([[cx-hw-6,top],[cx+hw+6,top]]);
  var cup=[cx+hw+30,fy];if(cup[0]<280){var cp=[[cup[0]-14,fy],[cup[0]-16,fy-20],[cup[0]+16,fy-20],[cup[0]+14,fy]];FS(s,sol,cp,1.6,90);for(var m2=0;m2<3;m2++){var mm=EP(cup[0]-8+m2*8,fy-24,4.5,4.5);FS(s,sol,mm);}}
  var loose=[[cx-hw-30,fy+6],[cx-hw-48,fy+14]];loose.forEach(function(p){if(p[0]>10){var m=EP(p[0],p[1],5,5);s.push(poly(m));s.push(arc(p[0]-1,p[1]-1,2.5,2.5,PI,PI*1.6));}});
  room(s,R,fy,sol);return s;});

S('Rubber ducks in a basin',['Bath Time Fleet','Three in a Row','Yellow Flotilla','Squeak and Bob','Enamel and Bubbles'],function(R){
  var s=[],sol=[],ty=RR(R,166,172),cx=RR(R,135,165),bw=RR(R,98,108),rim=ty-RR(R,56,62),bry=RR(R,16,20);
  var basin=[[cx-bw,rim]].concat(quad([cx-bw,rim],[cx-bw*0.85,ty-4],[cx-bw*0.55,ty],12).slice(1)).concat([[cx+bw*0.55,ty]]).concat(quad([cx+bw*0.55,ty],[cx+bw*0.85,ty-4],[cx+bw,rim],12).slice(1));var bs=[basin];var top=EP(cx,rim,bw,bry);bs.push(poly(top));bs.push(poly(EP(cx,rim,bw-5,bry-3)));H(bs,[[cx+bw*0.45,rim+bry*0.8],[cx+bw,rim]].concat(quad([cx+bw,rim],[cx+bw*0.85,ty-4],[cx+bw*0.55,ty],12)),1.8,80);bs.push(arc(cx,rim+16,bw*0.93,bry,0.15,PI-0.15));
  var wl=rim+RR(R,2,5),water=EP(cx,wl,bw-10,bry-5),ducks=[],nd=RI(R,2,3);
  for(var d=0;d<nd;d++){var dx=cx-bw*0.5+bw*(nd===1?0.5:d/(nd-1))+RR(R,-8,8),dy=wl+RR(R,-4,6),sz=RR(R,0.85,1.05),f=d%2?-1:1;function D(P){return P.map(function(p){return [dx+p[0]*sz*f,dy+p[1]*sz];});}
    var body=blob(D([[-22,0],[-26,-12],[-16,-14],[0,-12],[16,-10],[20,0],[10,4],[-14,4]]),4),head=EP(dx+10*sz*f,dy-22*sz,9*sz,9*sz),beak=D([[17,-22],[27,-20],[26,-17],[17,-17]]);
    var dk=[poly(body),poly(head),poly(beak)];var wing=D([[-12,-8],[0,-10],[8,-4],[-6,-2]]);dk.push(poly(wing));dk.push(circle(dx+12*sz*f,dy-25*sz,1.4));var wh=[];H(wh,wing,1.2,20);A(dk,wh);
    behind(s,dk,sol);sol.push(body,head,beak);ducks.push(body);}
  var wv=[];for(var y=wl-bry+7;y<wl+bry-4;y+=4.2)wv.push(wave(cx-bw,cx+bw,y,0.8,14,y));clipIn(s,wv,EP(cx,wl,bw-8,bry-4),sol.slice(0));behind(s,bs,sol);sol.push(basin);
  var bub=[];for(var b=0;b<RI(R,5,8);b++){var a=RR(R,0,TAU),bx=cx+Math.cos(a)*(bw-10),by=rim+Math.sin(a)*(bry-4);bub.push(circle(bx,by,RR(R,1.6,3)));}A(s,bub);
  var tw=RR(R,30,40),tp=[cx-bw-RR(R,0,20),ty];if(tp[0]>40){var tow=[[tp[0]-34,ty],[tp[0]-36,ty-30],[tp[0]-4,ty-30],[tp[0]-2,ty]];FS(s,sol,tow);s.push(zz(tp[0]-34,tp[0]-4,ty-28,ty-24,3));}
  var wall=[];var g=RR(R,13,16);H(wall,RP(4,4,296,ty),g,0);H(wall,RP(4,4,296,ty),g,90);behind(s,wall,sol);var fl=[];tableS(fl,R,ty,'none');behind(s,fl,sol);return s;});

S('Paper lanterns on a string',['Festival Night','Strung Across the Lane','Glow Between Rooftops','Summer Fair','Lantern Row'],function(R){
  var s=[],sol=[],bg=[],n=2;
  for(var l=0;l<1;l++){var y0=RR(R,30,40),y1=y0+RR(R,-8,8),sag=RR(R,24,36),line=quad([4,y0],[150,y0+sag*2],[296,y1],40);s.push(line);
    var k=RI(R,5,6);for(var i=0;i<k;i++){var t=(i+0.5+RR(R,-0.15,0.15))/k,p=line[Math.round(t*40)],hang=RR(R,4,8),w=RR(R,13,16)*(l?0.85:1),h=w*RR(R,1.15,1.35),cy=p[1]+hang+h;
      s.push([p,[p[0],p[1]+hang]]);var cap=RP(p[0]-w*0.4,p[1]+hang,p[0]+w*0.4,p[1]+hang+3);s.push(poly(cap));var L=EP(p[0],cy,w,h);SOL(s,sol,L);s.push(poly(L));
      var rb=[];for(var r=1;r<6;r++){var yy=cy-h+2*h*r/6,hw=w*Math.sqrt(1-Math.pow((yy-cy)/h,2));rb.push(arc(p[0],yy,hw,1.6,0,PI));}A(s,rb);s.push([[p[0],cy-h],[p[0],cy+h]]);
      var sh=[];H(sh,[[p[0]+w*0.35,cy-h*0.9]].concat(arc(p[0],cy,w,h,-PI*0.4,PI*0.4)).concat([[p[0]+w*0.35,cy+h*0.9]]),1.6,90);A(s,sh);
      s.push(RP(p[0]-w*0.35,cy+h,p[0]+w*0.35,cy+h+3));s.push([[p[0],cy+h+3],[p[0],cy+h+12]]);s.push(zz(p[0]-2,p[0]+2,cy+h+12,cy+h+18,1));}}
  var gy=RR(R,176,182),rf=[];var x=4;while(x<292){var w=RR(R,36,56),h=RR(R,36,60),ty=gy-h,kind=R()<0.5;var P=kind?[[x,gy],[x,ty],[x+w/2,ty-RR(R,14,20)],[x+w,ty],[x+w,gy]]:[[x,gy],[x,ty],[x-3,ty],[x+w*0.2,ty-12],[x+w*0.8,ty-12],[x+w+3,ty],[x+w,ty],[x+w,gy]];bg.push(P);
    var Wn=RP(x+w*0.3,ty+10,x+w*0.7,ty+24);bg.push(poly(Wn));var dk=[];H(dk,P.concat([[x,gy]]),RR(R,3.2,3.8),RR(R,30,60));A(bg,dk);x+=w+RR(R,0,4);}
  behind(s,bg,sol);s.push([[4,gy],[296,gy]]);var st=[];H(st,RP(4,gy,296,196),RR(R,3.4,4),0);behind(s,st,sol);return skyFill(s,gy,RR(R,6,7),RR(R,4.6,5.4),5,sol);});

S('Folding deck chairs',['Two for the Shore','Striped Canvas','Afternoon Off','Facing the Sea','Promenade Rest'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,174,180),wy=gy-RR(R,48,56);
  function chair(x,dir,sc){function P(a){return a.map(function(p){return [x+p[0]*sc*dir,gy+p[1]*sc];});}
    var back=P([[-30,0],[22,-74]]),front=P([[16,0],[-14,-34]]),seatL=P([[-24,-30],[24,-34]]);s.push(back);s.push(translate(back,2,0));s.push(front);s.push(translate(front,2,0));s.push(seatL);s.push(P([[-14,-34],[-34,-46]]));s.push(P([[-34,-46],[-30,-50]]));
    var sling=P([[22,-74],[-6,-40],[-26,-32],[-28,-36],[-8,-44],[18,-74]]);SOL(s,sol,sling);s.push(poly(sling));var stp=[];H(stp,sling,RR(R,3,3.6),dir>0?60:120);A(s,stp);}
  var c1=RR(R,80,100),c2=c1+RR(R,96,116);chair(c1,1,RR(R,1.05,1.15));chair(c2,R()<0.5?1:-1,RR(R,1,1.1));
  var tb=[(c1+c2)/2+RR(R,-6,6),gy],tbt=RP(tb[0]-14,gy-30,tb[0]+14,gy-34);FS(s,sol,tbt);s.push([[tb[0]-10,gy-30],[tb[0]+10,gy]]);s.push([[tb[0]+10,gy-30],[tb[0]-10,gy]]);
  var gl=[[tb[0]-6,gy-34],[tb[0]-8,gy-46],[tb[0]-2,gy-46],[tb[0]-4,gy-34]];s.push(gl);s.push([[tb[0]+4,gy-34],[tb[0]+4,gy-42],[tb[0]+10,gy-42],[tb[0]+10,gy-34]]);
  var hat=[RR(R,236,262),gy-2];if(hat[0]<280){var hb=EP(hat[0],hat[1]-2,18,4);s.push(poly(hb));s.push([[hat[0]-10,hat[1]-2]].concat(arc(hat[0],hat[1]-4,10,10,PI,TAU)).concat([[hat[0]+10,hat[1]-2]]));sol.push(hb);H(s,RP(hat[0]-10,hat[1]-5,hat[0]+10,hat[1]-8),1,0);}
  sand(bg,R,gy+4,RR(R,5,6));bg.push([[4,gy],[296,gy]]);var sea=waterS(R,4,296,wy+3,gy-4,RR(R,5,6),1);bg.push(sea);bg.push([[4,wy],[296,wy]]);var fm=[];for(var f=0;f<RI(R,3,5);f++){var fx=RR(R,10,260);fm.push(wave(fx,fx+RR(R,20,40),gy-2,1.2,8,0));}A(bg,fm);
  var sb=RR(R,200,270),sail=[[sb,wy-2],[sb+20,wy-2],[sb+16,wy+2],[sb+4,wy+2]];bg.push(poly(sail));bg.push([[sb+10,wy-2],[sb+10,wy-26],[sb+20,wy-6],[sb+10,wy-6]]);
  behind(s,bg,sol);return sky(s,R,wy-1,sol);});

S('Welsh dresser with plates',['Willow Pattern Rack','Sunday Best','Cups on Hooks','Kitchen Heirloom','Plates in a Row'],function(R){
  var s=[],sol=[],fy=RR(R,172,178),cx=RR(R,135,165),w=RR(R,74,80),bt=fy-RR(R,58,64),tt=RR(R,16,22);
  var low=RP(cx-w,fy,cx+w,bt);FS(s,sol,low);var top=RP(cx-w-6,bt,cx+w+6,bt-6);FS(s,sol,top,1.2,0);
  s.push([[cx-w,bt+16],[cx+w,bt+16]]);for(var d=0;d<3;d++){var dx=cx-w+d*(2*w/3);s.push([[dx,bt],[dx,bt+16]]);s.push(circle(dx+w/3,bt+8,1.6));}
  [[cx-w+6,cx-6],[cx+6,cx+w-6]].forEach(function(X){var D=RP(X[0],fy-6,X[1],bt+22);s.push(poly(D));s.push(rect(X[0]+6,fy-12,X[1]-6,bt+28));s.push(circle(X[0]===cx+6?X[0]+5:X[1]-5,(fy+bt)/2+10,1.6));});H(s,RP(cx+w*0.75,bt+16,cx+w,fy),1.4,90);s.push(rect(cx-w,fy,cx+w,fy+4).slice(0,2));
  var up=[[cx-w+6,bt-6],[cx-w+6,tt],[cx+w-6,tt],[cx+w-6,bt-6]];SOL(s,sol,up);s.push(up);var cor=[[cx-w-2,tt],[cx+w+2,tt],[cx+w+2,tt-8],[cx-w-2,tt-8]];FS(s,sol,cor);s.push(scallopRows(cx-w-2,cx+w+2,tt,tt,8,4));
  var sh=[tt+34,tt+(bt-6-tt)*0.62];sh.forEach(function(y){s.push(RP(cx-w+6,y,cx+w-6,y+3));s.push([[cx-w+6,y-5],[cx+w-6,y-5]]);});
  var back=[];H(back,RP(cx-w+8,tt+2,cx+w-8,bt-8),RR(R,5,6),90);var holes=[];
  sh.forEach(function(y,row){var r=row?RR(R,13,15):RR(R,11,13),n=Math.floor((2*w-16)/(2*r+2));for(var i=0;i<n;i++){var px=cx-w+10+r+i*(2*r+2)+((2*w-20)-(n*(2*r+2)))/2,py=y-r-1;var P=EP(px,py,r,r);holes.push(P);s.push(poly(P));s.push(circle(px,py,r*0.62));if(i%2===0)s.push(scallop(px,py,r*0.82,r*0.82,10,0.08));else{var c=[];H(c,EP(px,py,r*0.4,r*0.4),1.3,45);A(s,c);}}});
  for(var c2=0;c2<RI(R,4,6);c2++){var hx=cx-w+18+c2*((2*w-36)/5),hy=bt-12;s.push([[hx,hy-6],[hx,hy-2]]);var cup=[[hx-5,hy-2],[hx+5,hy-2],[hx+4,hy+6],[hx-4,hy+6]];s.push(poly(cup));holes.push(cup);s.push(arc(hx+6,hy+2,3,3,-PI/2,PI/2));}
  clipIn(s,back,up,holes);
  var jug=[cx+w-24,bt-6];var J=blob([[jug[0]-8,jug[1]],[jug[0]-10,jug[1]-12],[jug[0]-5,jug[1]-20],[jug[0]+6,jug[1]-20],[jug[0]+10,jug[1]-12],[jug[0]+8,jug[1]]],4);
  room(s,R,fy,sol,'stripes');return s;});

S('Bunk beds',['Top Bunk Called It','Ladder at Lights Out','Patchwork Upstairs','Sleepover Fort','Two Quilts'],function(R){
  var s=[],sol=[],fy=RR(R,174,180),x0=RR(R,50,66),x1=x0+RR(R,170,184),top=RR(R,22,28),m1=fy-RR(R,30,34),m2=top+RR(R,58,66);
  [x0,x1].forEach(function(x){var P=RP(x-4,fy,x+4,top);FS(s,sol,P);H(s,RP(x,fy,x+4,top),1.2,90);s.push(arc(x,top,5,4,PI,TAU));});
  [m1,m2].forEach(function(y,k){var rail=RP(x0+4,y+8,x1-4,y+2);FS(s,sol,rail,1.4,0);var mat=RP(x0+4,y+2,x1-4,y-8);FS(s,sol,mat);
    var q=[[x0+60,y-8],[x1-4,y-8],[x1-4,y-14],[x0+56,y-16]];FS(s,sol,q);var pq=[];var g=RR(R,9,11);H(pq,q,g,90);H(pq,q,g*0.7,0);A(s,pq);var hf=[];H(hf,[[x0+80,y-8],[x0+120,y-8],[x0+120,y-14],[x0+80,y-15]],1.6,45);A(s,hf);
    var pil=blob([[x0+8,y-8],[x0+8,y-18],[x0+30,y-20],[x0+48,y-17],[x0+48,y-8]],4);FS(s,sol,pil);s.push(arc(x0+28,y-14,10,2,0,PI));});
  var gr=[top+10,top+20];gr.forEach(function(y){s.push(RP(x0+4,y,x1-4,y+4));});
  var lx=x1-RR(R,34,44);s.push([[lx,fy],[lx+6,m2+8]]);s.push([[lx+16,fy],[lx+22,m2+8]]);for(var r=1;r<6;r++){var t=r/6,y=fy-(fy-m2-8)*t;s.push([[lx+6*t,y],[lx+16+6*t,y]]);}
  var bear=[x0+RR(R,70,90),m2-16];var bh=EP(bear[0],bear[1]-8,6,6),bb=EP(bear[0],bear[1]+2,8,8);s.push(poly(bb));s.push(poly(bh));s.push(circle(bear[0]-5,bear[1]-14,2));s.push(circle(bear[0]+5,bear[1]-14,2));sol.push(bb,bh);
  var under=RP(x0+4,fy,x1-4,m1+8);var ub=[];H(ub,under,RR(R,4,5),RR(R,30,50));
  var wx=x1+RR(R,12,20);var win=null;if(wx+40<294){win=RP(wx,40,wx+40,104);s.push(poly(win));s.push([[wx+20,40],[wx+20,104]]);s.push([[wx,72],[wx+40,72]]);s.push(rect(wx-4,104,wx+44,108));var cur=[];for(var c=0;c<4;c++)cur.push(curve([[wx-2+c*2,38],[wx+3+c*2,70],[wx+c*3,104]],5));A(s,cur);sol.push(win);}
  var rug=EP((x0+x1)/2,fy+12,70,8);var rr=[poly(rug),poly(EP((x0+x1)/2,fy+12,62,5))];behind(s,rr,sol);sol.push(rug);
  room(s,R,fy,sol,'tiles');return s;});

// ---- Daily Super Sketch: a view from above (allotment gardens seen from the air, no sky, no horizon) ----
function bumps(x0,x1,y,h,step){var p=[[x0,y]];for(var x=x0;x+step<=x1+0.01;x+=step)A(p,arc(x+step/2,y,step/2,h,PI,TAU).slice(1));return p;}
function serp(rowsArr){var out=[];rowsArr.forEach(function(r,i){A(out,i%2?r.slice().reverse():r);});return out;}
var MASTER={name:'Allotment gardens from above',titles:['Plots from the Air','Sunday on the Allotments','Patchwork of Beds','Sheds and Bean Rows','Bird\'s-Eye Harvest'],build:function(R){
  var s=[],vx=RR(R,130,170),hy=RR(R,92,108),pw=RR(R,9,11),plots=[];
  // main paths: one vertical, one horizontal, paved
  var Q=[[4,4,vx-pw/2,hy-pw/2],[vx+pw/2,4,296,hy-pw/2],[4,hy+pw/2,vx-pw/2,196],[vx+pw/2,hy+pw/2,296,196]];
  var pv=[];for(var y=4;y<196;y+=RR(R,5,6))if(Math.abs(y-hy)>pw/2+1)pv.push([[vx-pw/2,y],[vx+pw/2,y]]);for(var x=4;x<296;x+=RR(R,5,6))if(Math.abs(x-vx)>pw/2+1)pv.push([[x,hy-pw/2],[x,hy+pw/2]]);A(s,pv);
  s.push(circle(vx,hy,pw*0.9));s.push(circle(vx,hy,pw*0.45));
  Q.forEach(function(q){var x0=q[0],y0=q[1],x1=q[2],y1=q[3],g=4;
    function cut(a0,a1,n){var c=[],cur=a0;for(var i=0;i<n;i++){var e=i===n-1?a1:cur+(a1-a0)/n+RR(R,-5,5);c.push([cur,i===n-1?e:e-g/2]);cur=e+g/2;}return c;}
    var n=RI(R,2,3);if(x1-x0>y1-y0){cut(x0,x1,n).forEach(function(cx){if(R()<0.4)cut(y0,y1,2).forEach(function(cy){plots.push([cx[0],cy[0],cx[1],cy[1]]);});else plots.push([cx[0],y0,cx[1],y1]);});}
    else{cut(y0,y1,n).forEach(function(cy){if(R()<0.4)cut(x0,x1,2).forEach(function(cx){plots.push([cx[0],cy[0],cx[1],cy[1]]);});else plots.push([x0,cy[0],x1,cy[1]]);});}});
  var kinds=['rows','cabbage','shed','glass','trees','pond','beans','compost','ridges','flowers','rows','cabbage','lawn','rows'];
  for(var j=kinds.length-1;j>0;j--){var q2=Math.floor(R()*(j+1)),tk=kinds[j];kinds[j]=kinds[q2];kinds[q2]=tk;}
  plots.forEach(function(P,i){var x0=P[0]+2,y0=P[1]+2,x1=P[2]-2,y1=P[3]-2,w=x1-x0,h=y1-y0,cx=(x0+x1)/2,cy=(y0+y1)/2,k=kinds[i%kinds.length],box=RP(x0,y0,x1,y1);s.push(rect(P[0],P[1],P[2],P[3]).concat(rect(P[0]+1.4,P[1]+1.4,P[2]-1.4,P[3]-1.4)));
    if(w<14||h<14)return;var z=[];
    if(k==='rows'){var vert=w<h,rs=[];if(vert){for(var xx=x0+4;xx<x1-2;xx+=RR(R,4.8,5.4))rs.push(bumps(y0+2,y1-2,0,2.2,4.5).map(function(p){return [xx+p[1],p[0]];}));}else{for(var yy=y0+4;yy<y1-2;yy+=RR(R,4.8,5.4))rs.push(bumps(x0+2,x1-2,yy,2.2,4.5));}z.push(serp(rs));}
    else if(k==='cabbage'){var st=RR(R,10,11.5);var rw=0;for(var yy2=y0+st/2;yy2<y1-3;yy2+=st){var row=[];for(var xx2=x0+st/2+(rw%2?st/2:0);xx2<x1-3;xx2+=st){var sp0=spiral(xx2,yy2,0.8,st*0.38,1.6,PI/2);A(row,sp0.slice().reverse().concat(sp0.slice(1)));}if(rw%2)row.reverse();if(row.length)z.push(row);rw++;}}
    else if(k==='shed'){var sw=Math.min(w*0.55,40),sh=Math.min(h*0.6,30),sx=x0+4,sy=y0+4;var roof=RP(sx,sy,sx+sw,sy+sh);z.push(poly(roof));z.push([[sx,sy+sh/2],[sx+sw,sy+sh/2]]);var hh=[];H(hh,RP(sx,sy+sh/2,sx+sw,sy+sh),1.8,90);A(z,hh);z.push(circle(sx+sw+7,sy+5,5));z.push(circle(sx+sw+7,sy+5,3.5));
      var rr=[];for(var yy3=sy+sh+5;yy3<y1-2;yy3+=4.5)rr.push([[x0+2,yy3],[x1-2,yy3]]);if(rr.length)z.push(serp(rr));var pth=[[sx+sw/2,sy+sh],[sx+sw/2,y1]];z.push(pth);
      var rest=RP(sx+sw+16,y0+2,x1-2,sy+sh);if(x1-2-(sx+sw+16)>10){var gg=[];H(gg,rest,3.2,45);A(z,gg);}}
    else if(k==='glass'){var gw=Math.min(w-8,64),gh=Math.min(h-8,34),gx=cx-gw/2,gy=cy-gh/2;z.push(rect(gx,gy,gx+gw,gy+gh));var gl=[];for(var a=gx+6;a<gx+gw-1;a+=6)gl.push([[a,gy],[a,gy+gh]]);z.push(serp(gl));z.push([[gx,gy+gh/2],[gx+gw,gy+gh/2]]);var tr=[];H(tr,RP(gx+2,gy+gh*0.15,gx+gw-2,gy+gh*0.4),2,0);A(z,tr);
      var bd=[];if(gy-y0>8)bd.push(bumps(x0+3,x1-3,y0+5,2,5));if(y1-gy-gh>8)bd.push(bumps(x0+3,x1-3,y1-4,2,5));A(z,bd);}
    else if(k==='trees'){var gr=[];H(gr,box,RR(R,3.2,3.6),RR(R,30,60));var tsol=[],nt=Math.max(1,Math.min(4,Math.floor(w*h/1400)));var cs=[];for(var t=0;t<nt;t++){var r=RR(R,9,13),tx=x0+r+2+(w-2*r-4)*(nt===1?0.5:t/(nt-1)),ty=cy+RR(R,-h*0.2,h*0.2);ty=Math.max(y0+r+2,Math.min(y1-r-2,ty));cs.push([tx,ty,r]);}
      cs.forEach(function(c){var sh2=EP(c[0]+4,c[1]+4,c[2],c[2]);tsol.push(sh2);var cr=scallop(c[0],c[1],c[2],c[2],9,0.12);tsol.push(cr.slice(0,-1));});behind(z,gr,tsol);
      cs.forEach(function(c){var cr=scallop(c[0],c[1],c[2],c[2],9,0.12);z.push(cr);var hc=[];H(hc,[[c[0],c[1]-c[2]]].concat(arc(c[0],c[1],c[2],c[2],-PI/2,PI/2)),1.6,45);A(z,hc);z.push(spiral(c[0]-c[2]*0.2,c[1]-c[2]*0.2,0.5,c[2]*0.45,1.5,0));var sd=[];H(sd,arc(c[0]+4,c[1]+4,c[2],c[2],-PI*0.2,PI*0.8).concat(arc(c[0],c[1],c[2],c[2],PI*0.8,-PI*0.2).slice(1)),1.6,0);behind(z,sd,[cr.slice(0,-1)]);});}
    else if(k==='pond'){var pr=Math.min(w,h)*0.38,pd=blob([[cx-pr*1.3,cy],[cx-pr*0.6,cy-pr],[cx+pr*0.7,cy-pr*0.9],[cx+pr*1.3,cy+pr*0.1],[cx+pr*0.4,cy+pr],[cx-pr*0.8,cy+pr*0.8]],6);z.push(poly(pd));z.push(scallop(cx,cy,pr*1.42,pr*1.08,16,0.06));
      var pads=[];for(var l=0;l<RI(R,3,5);l++){var lx=cx+RR(R,-pr*0.8,pr*0.8),ly=cy+RR(R,-pr*0.5,pr*0.5),lr=RR(R,3,4.5);pads.push(arc(lx,ly,lr,lr,0.4,TAU).concat([[lx,ly],[lx+lr*Math.cos(0.4),ly+lr*Math.sin(0.4)]]));}A(z,pads);
      var wv=[];for(var yy4=cy-pr;yy4<cy+pr;yy4+=4.5)wv.push(wave(cx-pr*1.4,cx+pr*1.4,yy4,0.8,10,yy4));var cl=[];clipIn(cl,[serp(wv)],pd,[]);A(z,cl);
      var gr2=[];H(gr2,box,RR(R,3.2,3.8),RR(R,-60,-30));behind(z,gr2,[scallop(cx,cy,pr*1.42,pr*1.08,16,0.06).slice(0,-1)]);}
    else if(k==='beans'){var nb=Math.max(2,Math.floor(w/26)),mb=Math.max(1,Math.floor(h/26));for(var bi=0;bi<nb;bi++)for(var bj=0;bj<mb;bj++){var bx=x0+w*(bi+0.5)/nb,by=y0+h*(bj+0.5)/mb,br=RR(R,8,10),sp2=[];for(var q=0;q<6;q++){var an=q*PI/3+R()*0.2;sp2.push([bx,by],[bx+br*Math.cos(an),by+br*Math.sin(an)]);}sp2.push([bx,by]);z.push(sp2);z.push(scallop(bx,by,br+2,br+2,8,0.25));}
      var rr2=[];for(var yy5=y0+3;yy5<y1-2;yy5+=5)rr2.push([[x0+2,yy5],[x1-2,yy5]]);var bsol=[];for(var bi2=0;bi2<nb;bi2++)for(var bj2=0;bj2<mb;bj2++)bsol.push(EP(x0+w*(bi2+0.5)/nb,y0+h*(bj2+0.5)/mb,12.5,12.5));behind(z,[serp(rr2)],bsol);}
    else if(k==='compost'){var cw=Math.min(16,(w-8)/3),cy0=y0+4;for(var c2=0;c2<3;c2++){var bx0=x0+4+c2*(cw+2),B=RP(bx0,cy0,bx0+cw,cy0+cw);z.push(poly(B));var hc2=[];H(hc2,B,c2===1?1.6:2.6,c2*40+20);A(z,hc2);}
      var wb=[x0+4+3*(cw+2)+8,cy0+cw/2];if(wb[0]+16<x1){z.push(poly([[wb[0],wb[1]-6],[wb[0]+14,wb[1]-7],[wb[0]+14,wb[1]+7],[wb[0],wb[1]+6]]));z.push([[wb[0]+14,wb[1]-4],[wb[0]+26,wb[1]-5]]);z.push([[wb[0]+14,wb[1]+4],[wb[0]+26,wb[1]+5]]);z.push(circle(wb[0]-3,wb[1],3));}
      var rr3=[];for(var yy6=cy0+cw+6;yy6<y1-2;yy6+=4.5)rr3.push([[x0+2,yy6],[x1-2,yy6]]);if(rr3.length)z.push(serp(rr3));}
    else if(k==='ridges'){var rr4=[];for(var xx4=x0+3;xx4<x1-2;xx4+=2.8)rr4.push([[xx4,y0+2],[xx4,y1-2]]);z.push(serp(rr4));}
    else if(k==='flowers'){var st2=RR(R,13,15);for(var yy7=y0+st2/2+1;yy7<y1-4;yy7+=st2)for(var xx7=x0+st2/2+1+((yy7-y0)%(2*st2)>st2?st2/2:0);xx7<x1-4;xx7+=st2){var fl=scallop(xx7,yy7,4.5,4.5,8,0.45);fl=fl.slice(Math.floor(fl.length*0.25)).concat(fl.slice(1,Math.floor(fl.length*0.25)+1));z.push(fl);}}
    else{var lw=[];H(lw,box,RR(R,3,3.4),RR(R,10,30));var tb=RP(cx-12,cy-7,cx+12,cy+7);behind(z,lw,[tb]);z.push(poly(tb));z.push([[cx-12,cy],[cx+12,cy]]);z.push(rect(cx-12,cy-12,cx+12,cy-9));z.push(rect(cx-12,cy+9,cx+12,cy+12));
      var um=[cx+RR(R,-w*0.3,w*0.3),cy+RR(R,-h*0.3,h*0.3)];}
    A(s,z);});
  // a gardener's footpath stepping stones along the main path edge, and a few birds-eye wheelbarrow / hose
  var hose=[];var hx=vx+pw/2+2,hs=[[hx,hy+pw/2+2]];for(var k2=1;k2<8;k2++)hs.push([hx+8+6*Math.sin(k2*1.3),hy+pw/2+2+k2*6]);s.push(curve(hs,5));
  return s.filter(function(st){return st&&st.length>1;}).map(function(st){var a=st[0],b=st[st.length-1];return st.length>4&&Math.hypot(a[0]-b[0],a[1]-b[1])<0.6?st.slice(0,-1):st;});}};

return {number:8,startedOn:"2026-11-18",notes:"Batch 8 (Nov 18). Review of Nov 16-17 plays: Honeycomb frame held its 20 minutes - bees and cells read clearly. Strong: hedge maze, Mayan pyramid, ammonite, fire station, block tower, doll's pram, stupa, ice fishing shacks, round barn, cinema marquee. Weak: crocodile, hammerhead, sailplane and outrigger canoe muddled (long thin side views drowned in hatching); garden fork read as a sign; poppies lost in grass zigzags; artichokes and bananas blobby. Lessons kept: one line, keep extras touching; clip backgrounds with behind()/clipIn(); fill the frame; animals need a bold silhouette with one shaded side, kept light; one-stroke zigzags and serpentines keep the planner fast; drop the last point of small closed shapes (open strokes plan much faster); never add a base solid (board, basin) to sol before the things resting on it. New this batch: onion(), bumps(), serp(), tyre(). Daily Super Sketch: Allotment gardens from above, a view from above (type 3); previous two were Coral reef (natural scene, type 4) and Honeycomb frame with bees (close-up, type 2).",master:(typeof MASTER!=="undefined"?MASTER:undefined),subjects:SUBJ};
})();
