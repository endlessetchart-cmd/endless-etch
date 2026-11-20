// Endless Etch — batch 9. 48 subjects for 2026-11-19 (each plays about three times, shuffled per round) plus the Daily Super Sketch.
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

// ---- chunk A: buildings, places, landscapes, plants ----
S('Thatched roundhouse',['Smoke Through the Thatch','Wattle and Daub','Hearth on the Hill','Iron Age Evening','Round Against the Wind'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,166,174),cx=RR(R,130,170),rw=RR(R,48,56),wh=RR(R,26,32),rh=RR(R,52,60),ry=rw*0.22,ey=gy-wh;
  var wallP=[[cx-rw,ey]].concat(arc(cx,gy,rw,ry,PI,0)).concat([[cx+rw,ey]]).concat(arc(cx,ey,rw,ry,0,PI).slice(1));FS(s,sol,wallP);
  var posts=boardsC(cx,rw,ey+ry*0.5,gy+ry*0.6,RI(R,16,22));clipIn(s,[posts],wallP);var weave=[];for(var y=ey+5;y<gy;y+=RR(R,3.6,4.4))weave.push(arc(cx,y,rw,ry,PI,0));clipIn(s,[serp(weave)],wallP.slice(0).concat([[cx-rw,ey]]));
  var dw=RR(R,9,11),dx=cx+RR(R,-14,10);var door=archP(dx,gy+ry*0.9,dw,22);FS(s,sol,door,1.2,0);
  var rx=rw+RR(R,8,12),rf=arc(cx,ey+3,rx,ry*1.2,PI,0),apex=[cx+RR(R,-3,3),ey-rh],roof=[apex].concat(rf);FS(s,sol,roof);
  s.push(fan(apex,rf,2,0.9));H(s,[apex].concat(arc(cx,ey+3,rx,ry*1.2,0.5,0)),2,80);s.push(scallop(cx,ey+3,rx,ry*1.2,26,0.05).slice(0,Math.floor(26*4.2)));
  s.push(curve([apex,[apex[0]+6,apex[1]-10],[apex[0]-2,apex[1]-20],[apex[0]+8,apex[1]-32],[apex[0]+2,apex[1]-44]],6));
  // wattle fence and hills
  var fx0=RR(R,8,30);s.push(comb(fx0,cx-rw-10,gy+10,12,5));s.push([[fx0,gy+6],[cx-rw-10,gy+6]]);s.push(comb(cx+rw+10,292,gy+12,12,5));
  hills(bg,R,gy-RR(R,4,8),RR(R,22,36),4.6);gnd(bg,R,gy);return fin(s,R,bg,sol,gy-4);});

S('Trulli houses',['Cones of Stone','Whitewash and Limestone','Three Little Domes','Pinnacles at Noon','Dry-Stone Village'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,170,178),xs=[RR(R,58,72),RR(R,140,156),RR(R,222,238)];
  xs.forEach(function(x,i){var w=RR(R,26,32)*(i===1?1.15:1),h=RR(R,40,48),wt=gy-h,ch=RR(R,52,66)*(i===1?1.15:1);
    var body=RP(x-w,wt,x+w,gy);FS(s,sol,body);var cone=[[x-w-3,wt]].concat(quad([x-w-3,wt],[x-w*0.55,wt-ch*0.75],[x,wt-ch],14).slice(1)).concat(quad([x,wt-ch],[x+w*0.55,wt-ch*0.75],[x+w+3,wt],14).slice(1));FS(s,sol,cone,RR(R,2.6,3.2),0);
    var shade=[];H(shade,[[x,wt-ch],[x+w+3,wt],[x+w*0.3,wt]],1.3,75);A(s,shade);
    s.push([[x,wt-ch],[x,wt-ch-6]]);s.push(circle(x,wt-ch-9,3));s.push([[x-4,wt-ch-3],[x+4,wt-ch-3]]);
    if(i!==0){var d=archP(x+RR(R,-6,6),gy,RR(R,7,9),RR(R,14,18));FS(s,sol,d,1.2,90);}else{win(s,x-8,wt+12,10,10,1.6);}
    s.push([[x-w,wt+4],[x+w,wt+4]]);H(s,RP(x+w*0.6,wt+4,x+w,gy),2.2,90);});
  // linking walls
  s.push([[xs[0]+30,gy-18],[xs[1]-34,gy-18],[xs[1]-34,gy]]);s.push([[xs[1]+34,gy-16],[xs[2]-30,gy-16]]);
  wall(s,R,4,296,gy+RR(R,12,16),RR(R,8,10),RR(R,8,12));
  var ol=RR(R,0,1)<0.5?[18,gy]:[282,gy];var tr=[];treeR(tr,R,ol[0],ol[1],14,2.4);behind(s,tr,sol);
  gnd(bg,R,gy,RR(R,5,6));return fin(s,R,bg,sol,gy);});

S('Cornish engine house',['Beam Engine Above the Sea','Tin Coast Ruin','Stack and Gable','Granite Against Weather','Old Workings'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,150,160),cx=RR(R,120,160),w=RR(R,30,36),h=RR(R,70,80),top=gy-h;
  var house=[[cx-w,gy],[cx-w,top],[cx,top-RR(R,20,26)],[cx+w,top],[cx+w,gy]];FS(s,sol,house);
  var st=[];A(st,[brickS(cx-w,top,cx+w,gy,RR(R,7,9),RR(R,4.4,5))]);clipIn(s,st,house);
  var ow=RR(R,9,11),ah=archP(cx,top+30,ow,14);FS(s,sol,ah,1.3,0);[cx-w+8,cx+w-14].forEach(function(x){var a=archP(x+3,gy-12,4,10);FS(s,sol,a,1,0);});
  var bx=cx+w,ck=[[bx,gy],[bx+3,top-RR(R,46,56)],[bx+13,top-RR(R,46,56)],[bx+16,gy]];ck[2][1]=ck[1][1];FS(s,sol,ck);s.push(rect(ck[1][0]-1,ck[1][1]-4,ck[2][0]+1,ck[1][1]));
  H(s,[[bx+9,gy],[bx+9,ck[1][1]],ck[2],ck[3]],1.4,90);for(var y=ck[1][1]+6;y<gy-40;y+=12)s.push([[bx+1.5+3*(gy-y)/(gy-ck[1][1])*0,y],[bx+14,y]]);
  // cliff and sea
  var cl=[[4,gy]];for(var x=4;x<=296;x+=6)cl.push([x,gy+(x>200?RR(R,0,2)+(x-200)*0.35:RR(R,0,2))]);var cliff=cl.concat([[296,196],[4,196]]);
  bg.push(cl);H(bg,cliff,RR(R,3.6,4.4),RR(R,50,70));var sy=gy-RR(R,6,12);var sea=[];sea.push([[4,sy],[296,sy]]);A(sea,[waterS(R,4,296,sy+4,gy+40,RR(R,4,5),0.8)]);behind(bg,sea,[cliff]);
  s.push(tufts(8,cx-w-4,gy,6,R));return fin(s,R,bg,sol,sy);});

S('Cable-stayed bridge',['Harp of Steel','Strung Across the Bay','Two Towers, Many Strings','Evening Commute Span','Fan Over the Estuary'],function(R){
  var s=[],sol=[],bg=[],dy=RR(R,118,128),wy=RR(R,150,158),px=[RR(R,78,92),RR(R,208,222)],th=RR(R,84,94);
  var deck=RP(4,dy,296,dy+7);FS(s,sol,deck,1.6,0);s.push([[4,dy-5],[296,dy-5]]);s.push(comb(4,296,dy,5,6));
  px.forEach(function(x){var tt=dy-th;var L=[[x-12,wy+4],[x-3,tt],[x+3,tt],[x+12,wy+4]];FS(s,sol,poly([[x-12,wy+4],[x-3,tt],[x+3,tt],[x+12,wy+4],[x+7,wy+4],[x+1,tt+14],[x-1,tt+14],[x-7,wy+4]]).slice(0,-1));H(s,[[x+1,tt+14],[x+3,tt],[x+12,wy+4],[x+7,wy+4]],1.3,80);
    s.push([[x-9,dy+14],[x+9,dy+14]]);var base=[];for(var cx=x-RR(R,70,78);cx<=x+72;cx+=RR(R,6.5,7.5))if(cx>5&&cx<295&&Math.abs(cx-x)>8)base.push([cx,dy-5]);
    var fl=base.filter(function(p){return p[0]<x;}),fr=base.filter(function(p){return p[0]>x;});[fl,fr].forEach(function(b,j){var p=[],d=1;b.forEach(function(q,i){var a=[x,tt+6+i%5*0+ (j?1:1)*Math.abs(q[0]-x)/80*14];if(d>0)p.push(a,q);else p.push(q,a);d=-d;});if(p.length)s.push(p);});
    var pier=RP(x-8,wy,x+8,wy+14);FS(s,sol,pier,1.6,90);});
  var wat=[];wat.push([[4,wy],[296,wy]]);A(wat,[waterS(R,4,296,wy+5,196,RR(R,4.2,5),1)]);behind(bg,wat,[]);
  var hz=dy+RR(R,10,16);var hl=hills(bg,R,hz,RR(R,16,24),0);var hq=[];H(hq,hl.concat([[296,hz],[4,hz]]),3.4,0);A(bg,hq);bg.push([[4,hz],[296,hz]]);behind(bg,[],[]);
  var cut=[];behind(cut,bg,[RP(4,dy-6,296,dy+8)]);A(s,cut);return sky(s,R,wy,sol.concat([RP(4,hz,296,wy)]));});

S('Ski jump',['Inrun at First Light','Flight Over the Knoll','The Long Hill','Skis in a V','Landing Below the Pines'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,186,190),tx=RR(R,24,40),tt=RR(R,24,32),ex=RR(R,120,140),ey=RR(R,100,110);
  var inrun=cubic([tx,tt],[tx+40,tt+30],[ex-50,ey-6],[ex,ey-4],30),under=inrun.map(function(p){return [p[0],p[1]+6];}).reverse();var ramp=inrun.concat(under);FS(s,sol,ramp);H(s,ramp,1.4,0);
  var tw=[];for(var i=1;i<inrun.length-6;i+=4){var p=inrun[i];tw.push([p[0],p[1]+6],[p[0],Math.min(gy,ey+60+(p[0]-tx)*0.2)]);tw.push([p[0],p[1]+6]);}s.push(tw);
  for(var i2=3;i2<inrun.length-8;i2+=8){var a=inrun[i2],b=inrun[i2+4];s.push([[a[0],a[1]+6],[b[0],Math.min(gy,ey+60)]]);}
  s.push(rect(tx-8,tt-14,tx+8,tt));s.push([[tx-10,tt-14],[tx,tt-22],[tx+10,tt-14]]);
  var land=cubic([ex+4,ey+8],[ex+40,ey+20],[ex+80,gy-40],[296,gy-4],30);s.push(land);s.push([[ex,ey+2],[ex+4,ey+8]]);var lp=land.concat([[296,196],[ex+4,196]]);H(bg,lp,RR(R,3,3.5),RR(R,-30,-20));H(bg,lp,RR(R,7,8),RR(R,50,60));
  // skier in flight, skis touching the landing slope line visually via a dashed shadow line
  var sx=ex+RR(R,46,60),sy=interpY(land,sx)-RR(R,18,24);s.push([[sx-16,sy+8],[sx+14,sy-6]]);s.push([[sx-14,sy+12],[sx+16,sy-2]]);
  var body=[[sx-4,sy+4],[sx+8,sy-10],[sx+12,sy-12]];s.push(body);s.push(circle(sx+14,sy-14,3));s.push([[sx+2,sy-3],[sx-6,sy+2]]);s.push([[sx+6,sy-7],[sx-2,sy-2]]);
  s.push([[sx,sy+6],[sx,interpY(land,sx)]]);
  // flags and pines
  for(var f=0;f<4;f++){var fx=ex+20+f*RR(R,30,36);if(fx>290)break;var fy=interpY(land,fx);s.push([[fx,fy],[fx,fy-12],[fx+6,fy-10],[fx,fy-8]]);}
  for(var k=0;k<RI(R,6,8);k++){var px=RR(R,150,292),pb=RR(R,ey-6,ey+30);if(pb>interpY(land,px)-4)continue;pineT(bg,px,pb,RR(R,0.6,0.9),2);}
  var mt=peaks(bg,R,ey+10,RR(R,40,54),3,2.6);behind(s,bg,sol.concat([lp]));return sky(s,R,ey+10,sol.concat([lp]));});

S('Tiered garden fountain',['Three Bowls of Water','Courtyard Spill','Afternoon Splash','Stone and Spray','Where the Sparrows Bathe'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,176,182),cx=RR(R,140,160),bw=RR(R,88,98);
  var basin=[[cx-bw,gy-20]].concat(arc(cx,gy-20,bw,10,PI,0).slice(1)).concat([[cx+bw,gy-6]]).concat(arc(cx,gy-6,bw,10,0,PI).slice(1));FS(s,sol,basin);s.push(ellipse(cx,gy-20,bw-6,7));H(s,[[cx+bw*0.5,gy-12],[cx+bw,gy-20],[cx+bw,gy-6],[cx+bw*0.5,gy+3]],1.6,90);
  clipIn(s,[waterS(R,cx-bw,cx+bw,gy-26,gy-14,2.4,0.6)],EP(cx,gy-20,bw-7,6));
  var tiers=[[gy-74,RR(R,42,48)],[gy-112,RR(R,22,26)]];var stem=RP(cx-6,gy-26,cx+6,tiers[0][0]+4);FS(s,sol,stem,1.6,90);s.push(rect(cx-10,tiers[0][0]+12,cx+10,tiers[0][0]+16));
  tiers.forEach(function(t,i){var y=t[0],r=t[1],bowl=[[cx-r,y]].concat(quad([cx-r,y],[cx-r*0.4,y+r*0.45],[cx,y+r*0.45],10).slice(1)).concat(quad([cx,y+r*0.45],[cx+r*0.4,y+r*0.45],[cx+r,y],10).slice(1));FS(s,sol,bowl);s.push(ellipse(cx,y,r,r*0.14));H(s,bowl.slice(Math.floor(bowl.length/2)),1.4,60);
    for(var k=-2;k<=2;k++){var ex=cx+k*r*0.4,ey=y+r*0.14*(1-Math.abs(k)*0.2),lx=cx+k*r*0.4+k*6,ly=i?tiers[0][0]:gy-20;s.push(curve([[ex,ey],[ex+k*4,ey+(ly-ey)*0.3],[lx,ly-2]],6));}
    if(i)s.push(RP(cx-4,y+r*0.4,cx+4,tiers[0][0]));});
  var ft=tiers[1][0];s.push([[cx,ft],[cx,ft-14]]);s.push(circle(cx,ft-18,4));for(var j=-1;j<=1;j+=2)s.push(curve([[cx,ft-22],[cx+j*10,ft-34],[cx+j*20,ft-20],[cx+j*24,ft]],6));
  // hedge and path
  var hy=RR(R,80,92),hd=[[4,hy]];for(var x=4;x<=296;x+=9)A(hd,arc(x+4.5,hy,4.5,3,PI,TAU).slice(1));hd.push([296,gy-24],[4,gy-24]);bg.push(hd);H(bg,hd,RR(R,2.6,3.2),RR(R,40,60));
  var path=[];furrows(path,R,gy-24,14,cx);A(bg,path);behind(s,bg,sol);return sky(s,R,hy,sol);});

S('Breaking wave',['The Curl at Dawn','Barrel Before It Falls','Spindrift','Green Room','Shorebreak'],function(R){
  var s=[],sol=[],bg=[],base=RR(R,150,158),cx=RR(R,170,200),cy=RR(R,50,62),lip=[cx+RR(R,28,36),cy+RR(R,26,32)];
  var back=cubic([4,base-20],[60,base-28],[cx-60,cy+10],[cx,cy],30),curl=quad([cx,cy],[cx+30,cy-4],lip,14);
  var face=cubic([cx+10,base],[cx+2,base-30],[cx-6,cy+40],[cx+6,cy+18],20);
  var body=back.concat(curl.slice(1)).concat([[lip[0]-4,lip[1]+8]]).concat(face.slice().reverse()).concat([[4,base]]);FS(s,sol,body);
  s.push(spiral(lip[0]-12,lip[1]-2,1,14,1.4,0.6));
  for(var k=1;k<16;k++){var t=k/16;s.push(cubic([4+t*(cx-4),base],[4+t*(cx-20),base-24*t],[back[Math.floor(t*29)][0]+6,back[Math.floor(t*29)][1]+30],back[Math.floor(t*29)],14));}
  var tube=[[cx+6,cy+18]].concat(quad([cx+6,cy+18],[cx+20,cy+20],lip,8).slice(1)).concat([[lip[0]-4,lip[1]+8]]).concat(face.slice().reverse());H(s,tube,1.3,80);
  var foam=[];for(var i=0;i<curl.length;i+=2)foam.push(curl[i]);s.push(spikes(curve(foam,3),2,3,-1));
  var spray=[];for(var j=0;j<6;j++){var p=curl[Math.floor(R()*curl.length)];spray.push(p,[p[0]+RR(R,4,14),p[1]-RR(R,6,16)],p);}s.push(spray);
  // white water spilling to the right, sea rows in front
  var ww=[[cx+10,base]];for(var x=cx+10;x<296;x+=8)A(ww,arc(x+4,base-2,4,4,PI,TAU).slice(1));s.push(ww);
  var sea=[];sea.push([[4,base],[296,base]]);A(sea,[waterS(R,4,296,base+4,196,RR(R,3.6,4.2),1.4)]);A(bg,sea);
  var hz=RR(R,88,98),hd=[[230,hz]];var head=[[4,hz]];for(var x2=4;x2<=100;x2+=6)head.push([x2,hz-14*Math.sin((x2-4)/96*PI)-RR(R,0,3)]);bg.push(head.concat([[4,hz]]));H(bg,head,2.6,40);
  var far=[];far.push([[4,hz],[296,hz]]);A(far,[waterS(R,4,296,hz+5,base-4,6,0.6)]);behind(bg,far,[body]);
  behind(s,bg,sol);return sky(s,R,hz,sol.concat([RP(4,hz,296,196)]));});

S('Aurora over the tundra',['Curtains of Light','Midnight Glow','Ribbons Over the Snow','Northern Hush','Sky on Fire, Quietly'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,140,150);
  var tl=[[4,gy]];for(var x=4;x<=296;x+=RR(R,7,11)){var h=RR(R,4,16);tl.push([x,gy],[x+2,gy-h],[x+4,gy]);}tl.push([296,gy]);s.push(tl);
  var cx=RR(R,60,240),cab=RP(cx-12,gy-12,cx+12,gy);FS(s,sol,cab);s.push([[cx-15,gy-12],[cx,gy-22],[cx+15,gy-12]]);win(s,cx-4,gy-9,8,6,0);H(s,[[cx-15,gy-12],[cx,gy-22],[cx+15,gy-12]],1.3,0);s.push([[cx+6,gy-18],[cx+6,gy-24],[cx+9,gy-24],[cx+9,gy-16]]);
  // frozen lake with reflections and snow
  var lake=[],ly=gy+RR(R,10,16);lake.push([[4,ly],[296,ly]]);for(var y=ly+6;y<196;y+=RR(R,6,8))lake.push(wave(4,296,y,0.8,RR(R,30,50),R()*6));s.push(serp(lake));
  var sh=[];H(sh,RP(4,gy,296,ly),3,RR(R,4,8));A(s,sh);
  // aurora ribbons: wavy top and bottom edges joined by a one-stroke zigzag of rays
  var nb=RI(R,3,4);for(var b=0;b<nb;b++){var y0=RR(R,18,40)+b*RR(R,16,22),hh=RR(R,26,44),ph=R()*6,amp=RR(R,8,14),wl=RR(R,90,140),p=[],d=1,tops=[];
    for(var x3=4;x3<=296;x3+=RR(R,2.6,3.4)){var yt=y0+amp*Math.sin(x3/wl*TAU+ph),yb=yt+hh*(0.6+0.4*Math.sin(x3/37+ph*2));yb=Math.min(yb,gy-26);if(d>0)p.push([x3,yt],[x3,yb]);else p.push([x3,yb],[x3,yt]);d=-d;tops.push([x3,yt]);}
    s.push(p);s.push(tops);}
  return skyFill(s,gy-24,7,5,5,sol);});

function flytrap(s,sol,x,y,ang,sz,R){var o=RR(R,0.5,0.8),up=[],lo=[];for(var i=0;i<=16;i++){var t=i/16*PI;up.push([x+sz*Math.cos(PI-t)*1.0,y-sz*0.6*Math.sin(t)]);}
  var U=rotateAbout(up,x,y,ang-o/2),L=rotateAbout(up.map(function(p){return [p[0],2*y-p[1]];}),x,y,ang+o/2);
  [U,L].forEach(function(P,j){var cent=[x,y];SOL(s,sol,P.concat([cent]));var teeth=[];for(var i=1;i<P.length-1;i+=1){var a=P[i-1],b=P[i+1],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy),sg=j?1:-1;teeth.push(P[i],[P[i][0]+dy/l*4*sg,P[i][1]-dx/l*4*sg],P[i]);}s.push(teeth);H(s,P.concat([cent]),1.2,ang*180/PI+90);});}
S('Venus flytrap',['Snap Shut','Patient Jaws','Bog Garden Sill','Waiting for a Fly','Green Teeth'],function(R){
  var s=[],sol=[],ty=RR(R,166,172),cx=RR(R,130,170),pw=RR(R,40,46);
  var pot=[[cx-pw,ty-48],[cx+pw,ty-48],[cx+pw-8,ty],[cx-pw+8,ty]];FS(s,sol,pot);var rim=RP(cx-pw-4,ty-56,cx+pw+4,ty-46);FS(s,sol,rim);H(s,[[cx+pw*0.4,ty-46],[cx+pw,ty-46],[cx+pw-8,ty],[cx+pw*0.4-6,ty]],1.6,90);
  var moss=[[cx-pw,ty-56]];for(var x=cx-pw;x<cx+pw;x+=5)A(moss,arc(x+2.5,ty-56,2.5,2.5,PI,TAU).slice(1));s.push(moss);
  var n=RI(R,5,7);for(var i=0;i<n;i++){var a=-PI/2+(i-(n-1)/2)*RR(R,0.32,0.4),L=RR(R,50,80),bx=cx+(i-(n-1)/2)*6,by=ty-58,tx=bx+L*Math.cos(a),tyy=by+L*Math.sin(a);
    s.push(curve([[bx,by],[bx+(tx-bx)*0.4+RR(R,-6,6),by+(tyy-by)*0.5],[tx,tyy]],6));flytrap(s,sol,tx,tyy,a,RR(R,11,14),R);}
  var lv=[];for(var j=0;j<6;j++){var a2=PI+j*0.25-0.6+(j>2?PI-0.4:0),p0=[cx+(j>2?pw*0.3:-pw*0.3),ty-57];leafL(lv,[],p0,[p0[0]+18*Math.cos(a2),p0[1]+6*Math.sin(a2)-2],3,0);}A(s,lv);
  var fly=[cx+RR(R,-30,30),ty-58-RR(R,10,20)];
  // windowsill and window
  var t=[];tableS(t,R,ty,'none');var wx=RR(R,20,40),W=RP(wx,10,296-wx,ty-4);t.push(poly(W));t.push([[150,10],[150,ty-4]]);t.push([[wx,(ty+6)/2],[296-wx,(ty+6)/2]]);var gl=[];H(gl,W,RR(R,7,9),RR(R,30,50));A(t,gl);behind(s,t,sol);return s;});

S('Barrel cactus in bloom',['Crown of Flowers','Desert Lantern','Ribbed and Patient','Spring After Rain','Golden Barrel'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,170,178);
  function barrel(cx,b,rx,ry,flowers){var top=b-ry*2,P=EP(cx,b-ry,rx,ry);SOL(s,sol,P);var nr=RI(R,9,12),d=1;
    for(var i=1;i<nr;i++){var a=i/nr*PI,pts=[];for(var t=0;t<=24;t++){var u=t/24;pts.push([cx-rx*Math.cos(a)*Math.sin(PI*(0.08+0.84*u)),top+ry*2*(0.04+0.92*u)]);}var sp=spikes(pts,3,3,i<nr/2?-1:1);if(d<0)sp.reverse();s.push(sp);d=-d;}
    H(s,[[cx+rx*0.3,b-ry*1.8]].concat(arc(cx,b-ry,rx,ry,-PI/2.6,PI/2)).concat([[cx+rx*0.3,b]]),1.6,80);
    for(var f=0;f<flowers;f++){var fx=cx+(f-(flowers-1)/2)*rx*0.3,fy=top+4+Math.abs(f-(flowers-1)/2)*2;var fl=scallop(fx,fy-4,5,4,7,0.5);s.push(fl.slice(0,-1));s.push([[fx,fy-4],[fx,fy+2]]);}}
  var cx=RR(R,110,150);barrel(cx,gy,RR(R,40,46),RR(R,34,40),RI(R,4,6));barrel(cx+RR(R,64,78),gy,RR(R,18,22),RR(R,15,18),2);
  var rk=[];rocks(rk,sol,R,cx-90,cx-50,gy,14,2);A(s,rk);
  var mx=RR(R,30,270),hz=gy-RR(R,30,40),mesa=[[mx-60,hz],[mx-44,hz-30],[mx+36,hz-32],[mx+56,hz]];bg.push(mesa);H(bg,mesa,2.4,0);bg.push([[4,hz],[296,hz]]);H(bg,RP(4,hz,296,gy),RR(R,5,6),RR(R,-4,4));
  var pb=[];for(var k=0;k<RI(R,8,12);k++){var px=RR(R,10,290),py=RR(R,gy+6,190);pb.push(arc(px,py,RR(R,2,4),1.5,PI,TAU));}A(bg,pb);gnd(bg,R,gy,RR(R,6,7));
  behind(s,bg,sol);return sky(s,R,hz,sol.concat([RP(4,hz,296,196)]));});

function hollyLeaf(s,sol,p0,p1,w,R){var L=lens(p0,p1,w),n=L.length,out=[];for(var i=0;i<n;i++){out.push(L[i]);if(i%5===2&&i>2&&i<n-3){var a=L[i-1],b=L[i+1],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,c=[(p0[0]+p1[0])/2,(p0[1]+p1[1])/2];var sg=((L[i][0]-c[0])*(-dy)+(L[i][1]-c[1])*dx)>0?1:-1;out.push([L[i][0]-dy/l*4*sg,L[i][1]+dx/l*4*sg],L[i]);}}
  SOL(s,sol,L);s.push(out);s.push([p0,p1]);var m=lerp(p0,p1,0.5),dx2=p1[0]-p0[0],dy2=p1[1]-p0[1],ll=Math.hypot(dx2,dy2);H(s,quad(p0,[m[0]-dy2/ll*w,m[1]+dx2/ll*w],p1,10),1.3,Math.atan2(dy2,dx2)*180/PI+50);
  for(var k=1;k<4;k++){var q=lerp(p0,p1,k/4);s.push([q,[q[0]+dx2/ll*6-dy2/ll*w*0.6,q[1]+dy2/ll*6+dx2/ll*w*0.6]]);}}
S('Holly sprig with berries',['Midwinter Green','Red Among the Prickles','Sprig on the Mantel','First Frost Berries','Cut for the Door'],function(R){
  var s=[],sol=[],ty=RR(R,168,176),cx=RR(R,135,165),cy=RR(R,96,108),ber=[];
  var nb=RI(R,7,10);for(var i=0;i<nb;i++){var a=R()*TAU,r=RR(R,0,14),bx=cx+r*Math.cos(a),by=cy+r*Math.sin(a)*0.8;ber.push([bx,by,RR(R,5,6.5)]);}
  var leaves=RI(R,5,7);for(var j=0;j<leaves;j++){var a2=j/leaves*TAU+RR(R,-0.2,0.2),L=RR(R,52,66),p0=[cx+8*Math.cos(a2),cy+8*Math.sin(a2)],p1=[cx+L*Math.cos(a2),cy+L*Math.sin(a2)*0.75];hollyLeaf(s,sol,p0,p1,RR(R,11,14),R);}
  var bs=[];ber.forEach(function(b){var P=EP(b[0],b[1],b[2],b[2]);bs.push(P);});var top=[];ber.forEach(function(b){top.push(circle(b[0],b[1],b[2]));var h=[];H(h,[[b[0],b[1]-b[2]]].concat(arc(b[0],b[1],b[2],b[2],-PI/2,PI/2)),1,45);A(top,h);top.push(arc(b[0]-b[2]*0.35,b[1]-b[2]*0.35,1.4,1.4,0,TAU));});
  var st=[[cx,cy],[cx+RR(R,-30,30),ty-4]];s.push(curve([st[0],[cx+RR(R,-8,8),(cy+ty)/2],st[1]],6));
  var cut=[];behind(cut,s,bs);s.length=0;A(s,cut);A(s,top);var sol2=sol.concat(bs);
  var rib=[[cx-6,cy+20],[cx-30,cy+50],[cx-20,cy+60],[cx,cy+30],[cx+20,cy+60],[cx+30,cy+50],[cx+6,cy+20]];s.push(rib);
  onTable(s,R,ty,sol2.concat([poly(rib).slice(0,-1)]));return s;});

S('Hydrangea bush',['Mopheads by the Porch','Blue Summer','Heavy Heads','Clapboard and Blossom','After the Hose'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,178,184),cx=RR(R,130,170);
  var heads=[],nh=RI(R,6,8);for(var i=0;i<nh;i++){var a=PI+i/(nh-1)*PI,r=RR(R,50,64)*(i%2?0.75:1),hx=cx+r*Math.cos(a)*1.25,hy=gy-50+r*Math.sin(a)*0.9;heads.push([hx,hy,RR(R,18,24)]);}
  heads.sort(function(a,b){return b[1]-a[1];});
  var lv=[];for(var k=0;k<RI(R,14,18);k++){var a2=PI+R()*PI,r2=RR(R,40,76),x=cx+r2*Math.cos(a2)*1.3,y=gy-24+r2*Math.sin(a2)*0.8,ang=R()*TAU;leafL(lv,[],[x,y],[x+16*Math.cos(ang),y+10*Math.sin(ang)],5,1.5);}
  var hs=[],hp=[];heads.slice().reverse().forEach(function(h){var P=scallop(h[0],h[1],h[2],h[2]*0.85,RI(R,9,12),0.12);hp.push(P.slice(0,-1));});
  heads.forEach(function(h,i){var P=hp[heads.length-1-i];var z=[];z.push(P);clipIn(z,[scallopRows(h[0]-h[2]-4,h[0]+h[2]+4,h[1]-h[2],h[1]+h[2],RR(R,4.5,5.5),RR(R,3.6,4.2))],P.slice(0,-1));
    var shd=[];H(shd,arc(h[0],h[1],h[2],h[2]*0.85,-PI/3,PI*0.8).concat([[h[0]+h[2]*0.2,h[1]]]),1.3,30);A(z,shd);behind(s,z,hp.slice(0,heads.length-1-i));});
  behind(s,lv,hp);var stems=[];for(var j=0;j<6;j++)stems.push([[cx+RR(R,-20,20),gy],[cx+RR(R,-60,60),gy-30]]);behind(s,stems,hp);
  // clapboard wall, window and picket fence
  var wy=RR(R,14,22),cl=[];for(var y=wy;y<gy-12;y+=RR(R,6,7))cl.push([[4,y],[296,y]]);var W=RP(RR(R,20,40),wy+18,RR(R,90,110),gy-70);s.push(poly(W));
  var fence=[];var fy=gy-10;fence.push(comb(4,296,fy+10,RR(R,22,26),7));fence.push([[4,fy-4],[296,fy-4]]);fence.push([[4,fy+4],[296,fy+4]]);behind(s,fence,hp);
  behind(s,[serp(cl)],hp.concat([W,RP(4,fy-16,296,gy+12)]));H(s,W,RR(R,3,4),60);
  gnd(bg,R,gy+10,4.4);behind(s,bg,hp);return s;});

S('Strawberry plant',['Runners in the Straw','June Bed','Ripening Under Leaves','Three Reds, One White','Sweet in the Mulch'],function(R){
  var s=[],sol=[],gy=RR(R,120,132),cx=RR(R,130,170);
  function berry(x,y,sz){var P=[[x,y-sz*0.2]].concat(cubic([x,y-sz*0.2],[x+sz,y-sz*0.6],[x+sz*0.7,y+sz*0.6],[x,y+sz],10).slice(1)).concat(cubic([x,y+sz],[x-sz*0.7,y+sz*0.6],[x-sz,y-sz*0.6],[x,y-sz*0.2],10).slice(1));SOL(s,sol,P);
    clipIn(s,[zz(x-sz,x+sz,y-sz,y+sz*1.1,2.6)],P);var cal=[];for(var k=0;k<5;k++){var a=PI+k*PI/4;cal.push([x,y-sz*0.25],[x+sz*0.55*Math.cos(a),y-sz*0.25+sz*0.35*Math.sin(a)+2]);}cal.push([x,y-sz*0.25]);s.push(cal);return P;}
  var bs=[];for(var b=0;b<RI(R,4,6);b++){var bx=cx+RR(R,-70,70),by=gy+RR(R,6,30);bs.push([bx,by,RR(R,8,11)]);}
  bs.forEach(function(b){s.push(curve([[b[0],b[1]-b[2]*0.25],[b[0]+(cx-b[0])*0.4,b[1]-24],[cx,gy-10]],6));berry(b[0],b[1],b[2]);});
  var lvs=RI(R,6,8);for(var i=0;i<lvs;i++){var a=PI+(i+0.5)/lvs*PI,L=RR(R,44,60),tx=cx+L*Math.cos(a)*1.2,ty=gy-10+L*Math.sin(a);var st=curve([[cx,gy-10],[cx+(tx-cx)*0.5,ty+8],[tx,ty]],6),lf=[];
    for(var j=-1;j<=1;j++){var aa=Math.atan2(ty-gy,tx-cx)+j*0.7,p1=[tx+16*Math.cos(aa),ty+16*Math.sin(aa)];var sv=spikes(lens([tx,ty],p1,6),2,1.6,1);lf.push(sv);lf.push([[tx,ty],p1]);var hh=[];H(hh,lens([tx,ty],p1,6).slice(0,11),1.4,aa*180/PI+60);A(lf,hh);}
    var tmp=[st];A(tmp,lf);behind(s,tmp,bs.map(function(b){return EP(b[0],b[1]+b[2]*0.3,b[2],b[2]);}));}
  for(var f=0;f<RI(R,2,3);f++){var fx=cx+RR(R,-50,50),fy=gy-RR(R,40,56);s.push([[cx,gy-10],[fx,fy]]);s.push(scallop(fx,fy,5,5,5,0.6).slice(0,-1));s.push(circle(fx,fy,1.6));}
  var rn=[[cx+40,gy],[cx+80,gy+10],[cx+110,gy+4],[cx+130,gy+16]];s.push(curve(rn,6));
  // straw mulch and soil bed
  var st2=[],bed=RP(4,gy-4,296,196);H(st2,bed,RR(R,3.4,4),RR(R,15,25));H(st2,bed,RR(R,5,6),RR(R,-35,-25));behind(s,st2,sol);
  var bk=[];bk.push([[4,gy-4],[296,gy-4]]);H(bk,RP(4,4,296,gy-4),RR(R,6,7),90);var fence=[];for(var x=4;x<296;x+=RR(R,14,18))fence.push([x,gy-4],[x,24],[x+3,20],[x+6,24],[x+6,gy-4]);bk.push(fence);
  var cut=[];behind(cut,bk,sol);behind(s,cut,s.filter(function(){return false;}));return s;});

S('Windswept hawthorn',['Leaning East','Bent by Gales','Lone Thorn on the Fell','Shaped by Weather','Where the Wind Lives'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,166,174),bx=RR(R,90,130),lean=RR(R,80,110);
  var hill=[];for(var x=4;x<=296;x+=4)hill.push([x,gy-18*Math.sin((x-4)/292*PI)+(x-bx)*0.06]);var hy=interpY(hill,bx);
  var trunk=tube(curve([[bx,hy+2],[bx+8,hy-20],[bx+lean*0.4,hy-40],[bx+lean*0.8,hy-52]],6),function(u){return 7-5*u;});FS(s,sol,trunk.P);H(s,trunk.R.concat(trunk.L.slice().reverse().slice(0,8)),1.4,30);
  var cr=[[bx-10,hy-46],[bx+4,hy-74],[bx+40,hy-86],[bx+lean+20,hy-80],[bx+lean+60,hy-62],[bx+lean+70,hy-48],[bx+lean+30,hy-40],[bx+20,hy-36]];cr=cr.map(function(p){return [p[0]+RR(R,-4,4),p[1]+RR(R,-4,4)];});
  var crown=blob(cr,6),sc=[];for(var i=0;i<crown.length;i+=2)sc.push(crown[i]);var edge=spikes(sc,1,3,1);FS(s,sol,crown);s.push(edge);
  var hc=[];H(hc,crown,RR(R,2.2,2.6),RR(R,10,20));var lt=EP(bx+lean*0.3,hy-74,lean*0.5,10);behind(s,hc,[lt]);H(s,crown.slice(Math.floor(crown.length*0.55)),1.2,-20);
  for(var b=0;b<4;b++){var p=trunk.L[RI(R,6,14)];s.push(curve([p,[p[0]+RR(R,10,20),p[1]-RR(R,8,16)],[p[0]+RR(R,30,50),p[1]-RR(R,14,24)]],5));}
  s.push(hill);var hb=hill.concat([[296,196],[4,196]]);var gr=[];for(var y=gy-10;y<196;y+=RR(R,5,6.5)){var row=[],d=1;for(var x2=4;x2<296;x2+=RR(R,6,9)){var yy=Math.max(y,interpY(hill,x2)+3);row.push([x2,yy],[x2+5,yy-4],[x2+3,yy]);}A(gr,[row]);}clipIn(bg,gr,hb);
  wall(bg,R,4,296,gy+RR(R,14,20),RR(R,8,10),RR(R,9,12));
  var wl=[];for(var k=0;k<RI(R,3,5);k++){var y2=RR(R,18,gy-90);wl.push(wave(RR(R,4,60),RR(R,200,296),y2,1.5,RR(R,40,60),R()*6));}A(bg,wl);
  behind(s,bg,sol);return sky(s,R,interpY(hill,4)-2,sol.concat([hb]));});

S('Rain on a pond',['Rings on the Water','Shower Over the Reeds','Every Drop a Circle','Wet Afternoon','Pond in a Downpour'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,86,96),py=RR(R,104,114);
  var pond=EP(150,py+44,150,46),pc=pond;var rings=[];for(var i=0;i<RI(R,9,13);i++){var rx=RR(R,30,270),ry=RR(R,py+10,190);if(!pip([rx,ry],pond))continue;var rr=RR(R,6,16);for(var k=0;k<3;k++)rings.push(ellipse(rx,ry,rr*(1-k*0.3),rr*(1-k*0.3)*0.3));}
  var rs=[];rings.forEach(function(r){rs.push(r.slice(0,-1));});A(s,rings);var wat=[];for(var y=py+4;y<196;y+=RR(R,5,6))wat.push([[4,y],[296,y]]);var wc=[];clipIn(wc,[serp(wat)],pond,rs);A(s,wc);
  for(var l=0;l<RI(R,3,5);l++){var lx=RR(R,30,270),ly=RR(R,py+30,186);if(!pip([lx,ly],pond))continue;var lr=RR(R,8,12);var pad=arc(lx,ly,lr,lr*0.35,0.4,TAU).concat([[lx,ly]]);s.push(pad);sol.push(EP(lx,ly,lr,lr*0.35));}
  // reeds and bank
  var bank=[[4,py+8],[60,py-2],[150,py],[240,py-4],[296,py+6]];s.push(curve(bank,6));var rd=[];for(var r2=0;r2<RI(R,14,20);r2++){var rx2=R()<0.5?RR(R,6,70):RR(R,230,294),rb=py+RR(R,0,8),rh=RR(R,30,60);rd.push([[rx2,rb],[rx2+RR(R,-4,4),rb-rh]]);if(R()<0.4){s.push(RP(rx2-1.6,rb-rh*0.8,rx2+1.6,rb-rh*0.55));}}A(s,rd);
  var bk=[];H(bk,curve(bank,6).concat([[296,gy],[4,gy]]),3.2,RR(R,5,15));A(bg,bk);bg.push([[4,gy],[296,gy]]);
  for(var t=0;t<RI(R,5,8);t++){var tx=RR(R,10,290);treeR(bg,R,tx,gy+2,RR(R,10,16),2.6);}
  behind(s,bg,sol);
  // rain: slanted lines over the sky and the water
  var rain=[];H(rain,RP(4,4,296,196),RR(R,7,9),RR(R,70,78));var rc=[];behind(rc,rain,sol.concat(rs));var dash=[];rc.forEach(function(st){var d=[st[0]];for(var i=1;i<st.length;i++){var a=d[d.length-1],b=st[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1]));for(var k=1;k<=n;k++)d.push(lerp(a,b,k/n));}var run=[];d.forEach(function(p,i){if(i%14<9)run.push(p);else{if(run.length>1)dash.push(run);run=[];}});if(run.length>1)dash.push(run);});
  A(s,rc);return s;});

S('Mountain pass with switchbacks',['Hairpins to the Col','Road Up the Wall','Twelve Turns Higher','Summit Hut in View','The Long Climb'],function(R){
  var s=[],sol=[],bg=[],cy=RR(R,46,56),cx=RR(R,130,170);
  var slope=[[4,cy+60],[cx-60,cy+10],[cx,cy],[cx+60,cy+8],[296,cy+50]];var sl=curve(slope,8);s.push(sl);
  var pts=[[cx+RR(R,-10,10),cy+2]],y=cy+14,dir=1,n=RI(R,5,6);for(var i=0;i<n;i++){y+=RR(R,18,22);var w=60+i*16;pts.push([cx+dir*w,y]);dir=-dir;}pts.push([cx-dir*30,196]);
  var rd=tube(curve(pts,10),function(u){return 3+5*u;});FS(s,sol,rd.P);var cen=curve(pts,10),dsh=[];for(var j=0;j<cen.length-4;j+=6)dsh.push([cen[j],cen[j+2]]);A(s,dsh);
  var posts=[];rd.R.forEach(function(p,i){if(i%5===0)posts.push([p,[p[0],p[1]-3]]);});A(s,posts);
  var hut=[cx-8,cy+2];FS(s,sol,RP(hut[0]-10,hut[1]-10,hut[0]+10,hut[1]));s.push([[hut[0]-13,hut[1]-10],[hut[0],hut[1]-18],[hut[0]+13,hut[1]-10]]);win(s,hut[0]-4,hut[1]-8,6,5,0);s.push([[hut[0]+18,hut[1]],[hut[0]+18,hut[1]-16],[hut[0]+26,hut[1]-14],[hut[0]+18,hut[1]-12]]);
  var sp=sl.concat([[296,196],[4,196]]);var gr=[];H(gr,sp,RR(R,3.4,4),RR(R,30,50));var rk=[];for(var k=0;k<RI(R,8,12);k++){var rx=RR(R,10,290),ry=RR(R,interpY(sl,rx)+10,190);rk.push(arc(rx,ry,RR(R,4,8),3,PI,TAU));}behind(bg,gr.concat(rk),[rd.P]);
  var pk=peaks(bg,R,cy+8,RR(R,30,40),RI(R,3,4),2.2);behind(s,bg,sol);return sky(s,R,cy+30,sol.concat([sp]));});


// ---- chunk B: vehicles, machines, animals, birds, insects, sea life ----
function spoked(s,sol,cx,cy,r,n){var P=EP(cx,cy,r,r);SOL(s,sol,P);s.push(circle(cx,cy,r-2.4));s.push(circle(cx,cy,r*0.2));var sp=[];for(var k=0;k<n;k++){var a=k*TAU/n;sp.push([cx+r*0.2*Math.cos(a),cy+r*0.2*Math.sin(a)],[cx+(r-2.4)*Math.cos(a),cy+(r-2.4)*Math.sin(a)],[cx+r*0.2*Math.cos(a+TAU/n),cy+r*0.2*Math.sin(a+TAU/n)]);}s.push(sp);return P;}
S('Stagecoach',['Mail Run West','Dust on the Spokes','Four Days to the Coast','Box Seat Ride','Last Stage Before Dark'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,170,176),cx=RR(R,100,116),bl=RR(R,44,50),bt=gy-RR(R,70,78);
  spoked(s,sol,cx-bl+6,gy-20,20,12);spoked(s,sol,cx+bl-2,gy-15,15,10);
  var body=[[cx-bl,bt+6],[cx+bl,bt+6]].concat(quad([cx+bl,bt+6],[cx+bl+8,bt+40],[cx+bl-6,bt+52],10).slice(1)).concat(quad([cx+bl-6,bt+52],[cx,bt+64],[cx-bl+4,bt+52],10).slice(1)).concat(quad([cx-bl+4,bt+52],[cx-bl-8,bt+40],[cx-bl,bt+6],10).slice(1));
  FS(s,sol,body);var dr=RP(cx-12,bt+14,cx+12,bt+48);s.push(poly(dr));var wn=RP(cx-8,bt+18,cx+8,bt+30);s.push(poly(wn));H(s,wn,1.4,45);[cx-34,cx+22].forEach(function(x){var w=RP(x,bt+16,x+14,bt+30);s.push(poly(w));H(s,w,1.6,-45);});
  s.push(rect(cx-bl-2,bt,cx+bl+2,bt+6));H(s,[[cx+12,bt+34],[cx+bl+2,bt+34]].concat(quad([cx+bl+2,bt+34],[cx+bl,bt+48],[cx+bl-6,bt+52],6).slice(1)).concat([[cx+12,bt+56]]),1.6,90);
  var lug=[];for(var i=0;i<3;i++){var lx=cx-bl+8+i*30,lw=RR(R,18,26),lh=RR(R,8,12);lug.push(RP(lx,bt-lh,lx+lw,bt));}lug.forEach(function(L){FS(s,sol,L);s.push([[L[0][0]+3,L[0][1]],[L[0][0]+3,L[2][1]]]);});
  var bx=cx+bl+2;s.push([[bx,bt+20],[bx+16,bt+6],[bx+20,bt+6]]);s.push([[bx+8,bt+24],[bx+20,bt+6]]);s.push(rect(bx+12,bt+2,bx+28,bt+6));s.push([[bx+18,bt+2],[bx+22,bt-12]]);s.push(circle(bx+23,bt-16,4));s.push([[bx+21,bt-8],[bx+36,bt]]);
  s.push([[cx-bl+6,gy-20],[cx+bl-2,gy-15]]);s.push([[cx+bl-2,gy-15],[cx+bl+40,gy-28]]);
  var hx=cx+bl+RR(R,58,64);horse(s,sol,hx,gy,0.85,1,2.2);horse(s,sol,hx+RR(R,10,14),gy+4,0.85,1,1.6);s.push([[hx+28,gy-48],[bx+28,bt+4]]);
  var mx=RR(R,40,90),hz=gy-RR(R,40,50);bg.push([[mx-40,hz],[mx-26,hz-34],[mx+30,hz-36],[mx+46,hz]]);H(bg,[[mx-40,hz],[mx-26,hz-34],[mx+30,hz-36],[mx+46,hz]],2.4,0);bg.push([[4,hz],[296,hz]]);H(bg,RP(4,hz,296,gy),6,0);
  var cx2=RR(R,20,40);bg.push([[cx2,gy],[cx2,gy-34]].concat(arc(cx2+3,gy-34,3,3,PI,TAU)).concat([[cx2+6,gy-34],[cx2+6,gy]]));bg.push([[cx2,gy-18],[cx2-8,gy-18],[cx2-8,gy-26]]);
  road(bg,R,gy);behind(s,bg,sol);return sky(s,R,hz,sol.concat([RP(4,hz,296,196)]));});

S('Kayak in rapids',['White Water Line','Paddle Hard Left','Through the Chute','River Running Fast','Spray and Stroke'],function(R){
  var s=[],sol=[],bg=[],cx=RR(R,130,170),cy=RR(R,120,130),ang=RR(R,-0.25,-0.1);
  var hull=rotateAbout(lens([cx-64,cy],[cx+64,cy],9),cx,cy,ang);FS(s,sol,hull);s.push(rotateAbout([[cx-60,cy],[cx+60,cy]],cx,cy,ang));H(s,rotateAbout(lens([cx-64,cy],[cx+64,cy],9).slice(10),cx,cy,ang),1.4,ang*180/PI+70);
  var ck=rotateAbout(EP(cx,cy-2,13,4),cx,cy,ang);s.push(poly(ck));
  var tor=[[cx-6,cy-4],[cx-9,cy-26],[cx+5,cy-28],[cx+8,cy-4]];FS(s,sol,tor,1.4,90);var hd=EP(cx-1,cy-35,6,6);FS(s,sol,hd);s.push(arc(cx-1,cy-36,7,7,PI,TAU));H(s,arc(cx-1,cy-36,7,7,PI,TAU),1.2,0);
  var pa=RR(R,0.5,0.8),pl=[[cx-46*Math.cos(pa),cy-22+46*Math.sin(pa)],[cx+46*Math.cos(pa),cy-22-46*Math.sin(pa)]];s.push(pl);s.push([[cx-7,cy-22],[pl[0][0]*0.3+cx*0.7,pl[0][1]*0.3+(cy-22)*0.7]]);s.push([[cx+6,cy-22],[pl[1][0]*0.3+cx*0.7,pl[1][1]*0.3+(cy-22)*0.7]]);
  pl.forEach(function(p,i){var q=lerp(p,[cx,cy-22],0.14);var bl=lens(p,q,4);FS(s,sol,bl,1,0);});
  // rocks with foam collars, rapids
  var rk=[];rocks(rk,sol,R,RR(R,10,30),RR(R,70,90),cy+40,18,2);rocks(rk,sol,R,RR(R,210,230),RR(R,280,292),cy+20,16,2);A(s,rk);
  sol.slice(-4).forEach(function(P){var c=P.reduce(function(a,p){return [a[0]+p[0]/P.length,a[1]+p[1]/P.length];},[0,0]);s.push(scallop(c[0],c[1]+4,22,6,10,0.3).slice(0,-1));});
  var foam=[];for(var y=cy+6;y<196;y+=RR(R,5,6)){var w=wave(4,296,y,RR(R,1,2.6),RR(R,8,14),R()*6);foam.push(w);}var fz=[];A(fz,[serp(foam)]);
  behind(s,fz,sol);
  var bk=[[4,cy-30]];for(var x2=4;x2<=296;x2+=8)bk.push([x2,cy-30-RR(R,0,6)-(x2<60||x2>240?10:0)]);bg.push(bk);var up=[];A(up,[waterS(R,4,296,cy-26,cy+4,4,1.6)]);A(bg,up);
  for(var t=0;t<RI(R,5,7);t++){pineT(bg,RR(R,6,294),cy-32,RR(R,0.8,1.3),2.4);}behind(s,bg,sol);return sky(s,R,cy-34,sol.concat([RP(4,cy-32,296,196)]));});

S('Icebreaker ship',['Opening the Channel','Bow Up on the Floe','Polar Escort','Grinding North','Red Hull, White Sea'],function(R){
  var s=[],sol=[],bg=[],wl=RR(R,138,146),x0=RR(R,30,50),x1=RR(R,230,250);
  var hull=[[x0,wl-30],[x1-20,wl-34],[x1+20,wl-38],[x1+6,wl-6],[x1-10,wl+4],[x0+10,wl+4],[x0,wl-6]];FS(s,sol,hull);s.push([[x0+2,wl-14],[x1+12,wl-16]]);H(s,[[x0+4,wl-10],[x1+10,wl-12],[x1-10,wl+4],[x0+10,wl+4]],1.6,0);
  var sup=[[x0+40,wl-30],[x0+40,wl-60],[x0+110,wl-60],[x0+118,wl-31]];FS(s,sol,sup);var s2=RP(x0+52,wl-82,x0+104,wl-60);FS(s,sol,s2);var br=[[x0+48,wl-82],[x0+112,wl-82],[x0+108,wl-94],[x0+52,wl-94]];FS(s,sol,br);
  var ws=[];for(var x=x0+56;x<x0+104;x+=8)ws.push(RP(x,wl-91,x+6,wl-85));ws.forEach(function(w){s.push(poly(w));H(s,w,1,0);});for(var x2=x0+46;x2<x0+108;x2+=9)s.push(rect(x2,wl-52,x2+5,wl-46));for(var x3=x0+58;x3<x0+100;x3+=9)s.push(rect(x3,wl-76,x3+5,wl-70));
  var fn=[[x0+18,wl-30],[x0+20,wl-64],[x0+38,wl-64],[x0+40,wl-30]];FS(s,sol,fn);H(s,[[x0+19,wl-64],[x0+39,wl-64],[x0+39,wl-56],[x0+19,wl-56]],1.2,0);
  var mx=x0+80;s.push([[mx,wl-94],[mx,wl-124]]);s.push([[mx-12,wl-114],[mx+12,wl-114]]);s.push([[mx-8,wl-104],[mx+8,wl-104]]);s.push(lens([mx-10,wl-124],[mx+10,wl-124],3));
  var crane=[[x1-40,wl-34],[x1-40,wl-60],[x1-10,wl-70]];s.push(crane);s.push([[x1-10,wl-70],[x1-10,wl-50]]);s.push([[x1+14,wl-38],[x1+14,wl-56],[x1+4,wl-52]]);
  s.push(comb(x1-34,x1+16,wl-36,5,5));
  // ice field
  var ice=[];for(var r=0;r<5;r++){var y=wl+8+r*RR(R,9,11),x=4;while(x<296){var w=RR(R,18,40)*(1+r*0.3),h=RR(R,4,6)+r;var sl=[[x,y],[x+3,y-h],[x+w-4,y-h-RR(R,0,2)],[x+w,y]];if(x>x1+20||x<x0-10||r>1)ice.push(sl);x+=w+RR(R,2,6);}}A(ice,[]);var ic=[];ice.forEach(function(P){ic.push(P);});behind(s,ic,sol);
  var ch=[];A(ch,[waterS(R,4,296,wl+6,196,4.4,1)]);behind(s,ch,sol.concat(ice.map(function(P){return [[P[0][0],P[0][1]+8],P[1],P[2],[P[3][0],P[3][1]+8]];})));
  var hz=wl-RR(R,20,26);bg.push([[4,hz],[296,hz]]);var cliff=[[4,hz]];for(var x4=4;x4<=296;x4+=12)cliff.push([x4,hz-RR(R,4,12)],[x4+12,hz-RR(R,4,12)]);bg.push(cliff);H(bg,RP(4,hz,296,wl),4,0);
  behind(s,bg,sol);return sky(s,R,hz-14,sol.concat([RP(4,hz-6,296,196)]));});

S('Diesel shunter',['Yard Engine at Rest','Six Wheels, One Cab','Coupling Up','Night Shift Shunter','Short Hood, Long Day'],function(R){
  var s=[],sol=[],bg=[],ry=RR(R,160,166),cx=RR(R,130,170),L=RR(R,74,82),fy=ry-18;
  var frame=RP(cx-L,fy-6,cx+L,fy);FS(s,sol,frame,1.4,0);var hood=RP(cx-L+6,fy-46,cx+L*0.35,fy-6);FS(s,sol,hood);var cab=RP(cx+L*0.35,fy-70,cx+L-4,fy-6);FS(s,sol,cab);s.push([[cx+L*0.35-4,fy-70],[cx+L,fy-70]]);
  s.push(zz(cx-L+12,cx-L+60,fy-40,fy-14,2.4));s.push(rect(cx-L+66,fy-40,cx+L*0.3,fy-14));H(s,RP(cx-L+66,fy-40,cx+L*0.3,fy-14),3,0);
  [[cx+L*0.4,fy-62],[cx+L*0.68,fy-62]].forEach(function(p){var w=RP(p[0],p[1],p[0]+14,p[1]+18);s.push(poly(w));H(s,w,1.6,45);});var dr=RP(cx+L*0.43,fy-40,cx+L*0.62,fy-8);s.push(poly(dr));
  s.push([[cx-L+20,fy-46],[cx-L+20,fy-54],[cx-L+30,fy-54],[cx-L+30,fy-46]]);s.push(comb(cx-L+4,cx+L*0.33,fy-48,6,8));
  for(var k=0;k<3;k++){var wx=cx-L*0.65+k*L*0.55;var P=EP(wx,ry-9,9,9);SOL(s,sol,P);s.push(circle(wx,ry-9,6));s.push(circle(wx,ry-9,1.6));}s.push([[cx-L*0.65,ry-6],[cx+L*0.45,ry-6]]);
  [cx-L-6,cx+L+6].forEach(function(x,i){var d=i?1:-1;s.push(rect(Math.min(x,x-d*6),fy-5,Math.max(x,x-d*6),fy-1));s.push(circle(x,fy-3,3));});
  var stripes=[];for(var x=cx-L+2;x<cx-L+30;x+=5)stripes.push([[x,fy],[x+4,fy-6]]);A(s,stripes);
  // track and yard
  s.push([[4,ry],[296,ry]]);s.push([[4,ry+3],[296,ry+3]]);var sl=[];for(var x2=6;x2<296;x2+=8)sl.push([x2,ry+3],[x2-3,ry+10],[x2+5,ry+10],[x2+8,ry+3]);s.push(sl);
  var ws=RR(R,40,60);var wag=RP(4,ry-60,ws+20,ry-14);bg.push(poly(wag));H(bg,wag,5,90);bg.push(circle(ws-10,ry-8,7));
  var shed=[[200,ry-14],[200,ry-90],[248,ry-110],[296,ry-90],[296,ry-14]];bg.push(shed);H(bg,shed,RR(R,5,6),90);bg.push(archP(248,ry-14,16,40));
  var sg=RR(R,20,40);bg.push([[sg,ry],[sg,ry-90]]);bg.push(rect(sg-6,ry-100,sg+6,ry-86));bg.push(circle(sg,ry-96,2.6));bg.push(circle(sg,ry-90,2.6));
  var gr=[];H(gr,RP(4,ry+10,296,196),4,RR(R,10,20));A(bg,gr);bg.push([[4,ry-14],[296,ry-14]]);
  behind(s,bg,sol);return sky(s,R,ry-14,sol.concat([RP(4,ry-14,296,196),shed,poly(wag).slice(0,-1)]));});

S('Treadwheel crane',['Walking the Stone Up','Builders of the Nave','Wheel Above the Scaffold','Mason Season','Up by Footsteps'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,178,184),cx=RR(R,90,120),wr=RR(R,36,40),wy=gy-wr-14;
  var fr=[[cx-wr-6,gy],[cx,wy-wr-10],[cx+wr+6,gy]];s.push(fr);s.push([[cx-wr-10,gy],[cx+wr+10,gy]]);s.push([[cx,wy-wr-10],[cx,gy]]);
  s.push(circle(cx,wy,wr));s.push(circle(cx,wy,wr-5));var sp=[];for(var k=0;k<8;k++){var a=k*PI/4;sp.push([cx,wy],[cx+wr*Math.cos(a),wy+wr*Math.sin(a)],[cx,wy]);}s.push(sp);var tr=[];for(var k2=0;k2<32;k2++){var a2=k2*TAU/32;tr.push([cx+(wr-5)*Math.cos(a2),wy+(wr-5)*Math.sin(a2)],[cx+wr*Math.cos(a2+0.05),wy+wr*Math.sin(a2+0.05)]);}s.push(tr);
  var walker=[cx-4,wy+wr-6];s.push([[walker[0],walker[1]],[walker[0]-3,walker[1]-14],[walker[0]-5,walker[1]-24]]);s.push(circle(walker[0]-6,walker[1]-28,3));s.push([[walker[0]-4,walker[1]-20],[walker[0]+4,walker[1]-16]]);s.push([[walker[0]-3,walker[1]-14],[walker[0]+5,walker[1]-4]]);
  var tip=[cx+RR(R,110,130),wy-wr-RR(R,30,40)];var jib=[[cx,wy-wr-10],tip];s.push(jib);s.push([[cx+wr*0.5,wy-wr*0.9],[cx+wr*1.6,wy-wr*1.2]]);
  var hy=RR(R,gy-70,gy-50);s.push([tip,[tip[0],hy]]);s.push(arc(tip[0]+3,hy+2,3,3,PI,TAU*1.0));var stone=RP(tip[0]-12,hy+6,tip[0]+12,hy+22);FS(s,sol,stone,1.6,45);s.push([[tip[0],hy+2],[tip[0]-10,hy+6]]);s.push([[tip[0],hy+2],[tip[0]+10,hy+6]]);
  s.push([[cx,wy],[cx+20,wy-wr-4],tip]);
  // church wall rising with scaffold
  var wx=tip[0]+RR(R,16,24),wt=RR(R,60,80),wallP=[[wx,gy],[wx,wt+20],[wx+20,wt],[296,wt+RR(R,0,20)],[296,gy]];FS(s,sol,wallP);var st=[];A(st,[brickS(wx,wt,296,gy,RR(R,10,12),RR(R,6,7))]);clipIn(s,st,wallP,[gothic(wx+50,gy-40,10,30)]);s.push(gothic(wx+50,gy-40,10,30));
  var sc=[];for(var x=wx-8;x<300;x+=26)sc.push([[x,gy],[x,wt+6]]);for(var y=gy-24;y>wt+10;y-=24)sc.push([[wx-8,y],[296,y]]);behind(s,sc,[stone]);
  gnd(bg,R,gy);hills(bg,R,gy-2,RR(R,16,24),5);behind(s,bg,sol);return sky(s,R,gy-2,sol);});

var ZEB=[[-34,-46],[-12,-48],[14,-46],[24,-50],[34,-62],[40,-72],[44,-74],[54,-62],[56,-56],[50,-54],[42,-58],[34,-48],[30,-36],[28,-26],[29,-14],[30,0],[25,0],[23,-14],[21,-26],[14,-28],[16,-12],[17,0],[12,0],[10,-12],[8,-26],[-18,-28],[-20,-12],[-19,0],[-24,0],[-26,-12],[-26,-24],[-30,-12],[-29,0],[-34,0],[-36,-16],[-38,-34]];
S('Zebra',['Stripes in the Heat','Dazzle on the Plain','Grazing by the Acacia','Black and White Noon','Herd Lookout'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,170,178),cx=RR(R,120,170),sc=RR(R,1.5,1.7),fx=sgn(R);
  var P=M(ZEB,cx,gy,sc,fx);FS(s,sol,P);var st=[];
  for(var x=-36;x<56;x+=RR(R,6.5,7.5)){var band=[],d=1;for(var y=-78;y<0;y+=1.6){var xx=x+3*Math.sin(y/9+x*0.3)+(y<-46?(y+46)*-0.2*(x>20?1:0):0);band.push(d>0?[xx,y]:[xx+2.6,y]);d=-d;}st.push(M(band,cx,gy,sc,fx));}
  clipIn(s,st,P,[M(EP(47,-62,4,3),cx,gy,sc,fx)]);s.push(M(circle(47,-63,1.6),cx,gy,sc,fx));
  var mane=[];for(var t=0;t<=10;t++){var q=lerp([24,-50],[42,-74],t/10);mane.push(q,[q[0]-3,q[1]-4]);}s.push(M(mane,cx,gy,sc,fx));s.push(M(curve([[-37,-38],[-42,-28],[-42,-16]],5),cx,gy,sc,fx));s.push(M([[42,-74],[40,-82],[44,-76]],cx,gy,sc,fx));
  // acacia, grass, sky
  var ax=fx>0?RR(R,30,60):RR(R,240,270),ay=gy-RR(R,70,86),can=[[ax-50,ay]];for(var x2=ax-50;x2<ax+50;x2+=8)A(can,arc(x2+4,ay,4,3,PI,TAU).slice(1));can.push([ax+50,ay]);A(can,arc(ax,ay,50,8,0,PI).slice(1));bg.push(can);H(bg,can,2,0);
  bg.push([[ax-2,gy],[ax-2,ay+8],[ax-14,ay+2]]);bg.push([[ax+2,gy],[ax+2,ay+14],[ax+18,ay+4]]);bg.push([[ax,ay+20],[ax,ay+6]]);
  var hz=gy-RR(R,24,32);bg.push([[4,hz],[296,hz]]);var gr=[];for(var y2=hz+5;y2<196;y2+=RR(R,5,6))gr.push(tufts(4,296,y2,RR(R,3,5),R));var gs=[];A(gs,[serp(gr)]);A(bg,gs);
  behind(s,bg,sol);return sky(s,R,hz,sol.concat([RP(4,hz,296,196),can.slice(0)]));});

var WOLF=[[-24,0],[-28,-14],[-24,-30],[-14,-40],[-6,-48],[0,-58],[3,-68],[6,-76],[8,-86],[12,-78],[18,-77],[30,-90],[33,-87],[26,-74],[20,-66],[17,-56],[15,-44],[12,-32],[11,-16],[13,0],[7,0],[5,-18],[2,-24],[0,-10],[2,0],[-4,0],[-8,-12],[-14,-6],[-16,0]];
S('Wolf howling',['Song for the Moon','Ridge at Midnight','Calling the Pack','Breath in the Cold','One Voice, Far Hills'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,150,160),cx=RR(R,120,170),sc=RR(R,1.25,1.4),fx=sgn(R);
  var ridge=[[4,gy+20]];for(var x=4;x<=296;x+=6)ridge.push([x,gy+20-24*Math.exp(-Math.pow((x-cx)/60,2))-RR(R,0,3)]);var rg=ridge.concat([[296,196],[4,196]]);
  var by=interpY(ridge,cx)+2,P=blob(M(WOLF,cx,by,sc,fx),3);FS(s,sol,P);var fur=[];H(fur,P,RR(R,2,2.4),fx*RR(R,50,70));var belly=EP(cx-fx*4*sc,by-20*sc,10*sc,16*sc);behind(s,fur,[belly]);
  var tail=curve(M([[-22,-2],[-36,0],[-46,-4],[-50,-12]],cx,by,sc,fx),6);s.push(tail);s.push(M(circle(14,-76,1.5),cx,by,sc,fx));
  var mo=[cx+fx*RR(R,50,80),RR(R,50,64)],mr=RR(R,30,36),moon=EP(mo[0],mo[1],mr,mr);s.push(poly(moon));var mc=[];H(mc,arc(mo[0],mo[1],mr,mr,-PI/2,PI/2).concat(arc(mo[0]+mr*0.4,mo[1],mr*0.75,mr,PI/2,-PI/2)),1.6,0);
  s.push(ridge);var rh=[];H(rh,rg,RR(R,2.6,3.2),RR(R,20,35));behind(s,rh,[]);
  for(var t=0;t<RI(R,5,8);t++){var px=RR(R,6,294);if(Math.abs(px-cx)<40)continue;pineT(s,px,interpY(ridge,px)+2,RR(R,0.9,1.4),0);}
  var hz=gy-RR(R,6,14),far=peaks(bg,R,hz+16,RR(R,24,34),RI(R,4,5),3);
  behind(s,bg,sol.concat([rg,moon]));var cut=[];behind(cut,mc,sol);A(s,cut);return skyFill(s,interpY(ridge,4),5.5,4.5,5,sol.concat([rg]));});

S('Badger at its sett',['Out at Dusk','Stripes at the Burrow','Under the Beech Roots','Sniffing the Air','Old Sett, New Season'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,160,168),cx=RR(R,150,180),fx=sgn(R),sc=RR(R,1.65,1.8);
  var B=[[-46,-6],[-50,-16],[-44,-28],[-26,-34],[0,-36],[16,-34],[28,-30],[40,-22],[52,-12],[60,-8],[58,-4],[46,-4],[36,-6],[32,0],[24,0],[22,-8],[8,-10],[6,0],[-2,0],[-4,-10],[-26,-10],[-28,0],[-36,0],[-38,-8]];
  var P=M(B,cx,gy,sc,fx);FS(s,sol,P);var band=M([[27,-29],[40,-21],[58,-8],[56,-7],[38,-15],[26,-23]],cx,gy,sc,fx);s.push(poly(band));H(s,band,0.9,fx*-30);
  var fur=[];H(fur,M([[-46,-8],[-50,-16],[-44,-28],[-26,-34],[0,-36],[16,-34],[24,-31],[22,-20],[8,-12],[-26,-12],[-38,-10]],cx,gy,sc,fx),RR(R,1.8,2.1),fx*15);A(s,fur);
  [[[22,-8],[32,0],[24,0]],[[8,-10],[6,0],[-2,0],[-4,-10]],[[-26,-10],[-28,0],[-36,0],[-38,-8]]].forEach(function(L){H(s,M(L,cx,gy,sc,fx),1,fx*80);});
  s.push(M(circle(44,-17,1.3),cx,gy,sc,fx));s.push(M(arc(30,-31,3,2.4,PI,TAU),cx,gy,sc,fx));s.push(M([[-50,-14],[-56,-12],[-50,-10]],cx,gy,sc,fx));
  // the sett: a low bank with a dark entrance and roots, ferns, beech trunks
  var hx=fx>0?RR(R,30,60):RR(R,240,270),bank=[[4,gy]];for(var x=4;x<=296;x+=6){var d=Math.abs(x-hx);bank.push([x,gy-Math.max(0,34-d*0.35)-RR(R,0,2)]);}s.push(bank);var hole=EP(hx,gy-6,20,14);s.push(poly(hole));H(s,hole,1.4,0);sol.push(hole);
  var bp=bank.concat([[296,gy+2],[4,gy+2]]);var bh=[];H(bh,bp,3,RR(R,20,35));behind(s,bh,sol);for(var r=0;r<3;r++){var rx=hx+RR(R,-26,26);s.push(curve([[rx,interpY(bank,rx)],[rx+RR(R,-10,10),gy-24],[hx+RR(R,-14,14),gy-16]],6));}
  for(var f=0;f<3;f++){var fxp=RR(R,10,290);if(Math.abs(fxp-cx)<70)continue;s.push(fan([fxp,gy],arc(fxp,gy,22,20,PI*1.1,PI*1.9),2,0.95));}
  var gr=[];for(var y=gy+5;y<196;y+=RR(R,4.5,5.5))gr.push(tufts(4,296,y,3,R));A(bg,[serp(gr)]);bg.push([[4,gy],[296,gy]]);
  var tr=[];for(var t=0;t<RI(R,3,4);t++){var tx=RR(R,10,280),tw=RR(R,12,18),T=[[tx,gy-30],[tx+2,4],[tx+tw-2,4],[tx+tw,gy-30]];tr.push(T);bg.push(T);var bk=[];H(bk,T,3.4,90);A(bg,bk);}
  var far=hills([],R,gy-30,RR(R,10,16),0);bg.push(far);behind(s,bg,sol.concat([bp]));return skyFill(s,gy-30,6,4.4,5,sol.concat([bp]).concat(tr));});
S('Mountain goat on a crag',['Hooves on the Edge','Above the Tree Line','White Coat, Thin Air','Summit Keeper','Lookout on the Rock'],function(R){
  var s=[],sol=[],bg=[],cx=RR(R,130,170),cy=RR(R,100,110),fx=sgn(R);
  var crag=[[cx-60,196],[cx-46,cy+40],[cx-30,cy+10],[cx-10,cy+4],[cx+22,cy+6],[cx+38,cy+24],[cx+54,cy+60],[cx+70,196]];FS(s,sol,crag);var ch=[];H(ch,crag,RR(R,2.4,2.8),RR(R,55,70));A(s,ch);var cr=[];for(var k=0;k<5;k++){var x=cx+RR(R,-40,40);cr.push([[x,cy+RR(R,20,40)],[x+RR(R,-10,10),cy+RR(R,50,80)]]);}A(s,cr);
  var G=[[-26,0],[-26,-12],[-30,-26],[-26,-38],[-8,-40],[12,-40],[20,-44],[24,-56],[28,-62],[36,-56],[34,-48],[30,-42],[26,-36],[24,-24],[22,-12],[24,0],[20,0],[18,-14],[14,-22],[10,-22],[12,-10],[13,0],[9,0],[7,-12],[2,-24],[-14,-24],[-14,-10],[-12,0],[-16,0],[-18,-12],[-20,-20],[-22,-10],[-22,0]];
  var gb=cy+4,P=M(G,cx,gb,1.1,fx);FS(s,sol,P);var sh=[];H(sh,M([[-26,-30],[20,-30],[22,-26],[2,-24],[-14,-24],[-24,-26]],cx,gb,1.1,fx),1.4,0);A(s,sh);
  s.push(M(zz(-24,18,-40,-36,3),cx,gb,1.1,fx));s.push(M([[30,-42],[32,-34],[28,-38]],cx,gb,1.1,fx));var hn=tube(curve([[27,-60],[22,-74],[12,-80],[6,-76]],5),function(u){return 2.2*(1-u)+0.4;});s.push(M(poly(hn.P),cx,gb,1.1,fx));s.push(M([[34,-46],[36,-36],[32,-40]],cx,gb,1.1,fx));s.push(M(circle(30,-56,1.2),cx,gb,1.1,fx));
  var pk=peaks(bg,R,cy+60,RR(R,60,80),RI(R,3,4),2.4);var vl=[[4,cy+60],[296,cy+60]];bg.push(vl);var vh=[];H(vh,RP(4,cy+60,296,196),RR(R,6,7),RR(R,8,16));A(bg,vh);
  for(var t=0;t<RI(R,6,10);t++)pineT(bg,RR(R,6,294),RR(R,cy+70,190),RR(R,0.6,1),2);behind(s,bg,sol);return sky(s,R,cy+60,sol.concat([RP(4,cy+60,296,196)]));});

S('Pheasant in stubble',['Copper in the Stubble','Ring-Necked Morning','Cock Bird Strutting','Harvest Edge','Bronze and Green'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,160,168),cx=RR(R,130,160),fx=sgn(R);
  var Bd=[[-20,-6],[-24,-18],[-14,-30],[4,-34],[20,-36],[28,-46],[30,-56],[36,-62],[44,-60],[48,-56],[42,-54],[38,-50],[38,-40],[34,-28],[24,-14],[8,-6]];
  var P=blob(M(Bd,cx,gy-14,1.3,fx),4);FS(s,sol,P);var sc=[];clipIn(sc,[scallopRows(cx-60,cx+80,gy-60,gy,5,4)],P,[M(blob([[24,-40],[30,-56],[44,-58],[40,-48],[34,-38]],3),cx,gy-14,1.3,fx)]);A(s,sc);
  var hd=M(blob([[24,-40],[30,-56],[44,-58],[40,-48],[34,-38]],3),cx,gy-14,1.3,fx);s.push(poly(hd));H(s,hd,1,30);s.push(M(arc(30,-36,9,3,0,PI),cx,gy-14,1.3,fx));s.push(M(arc(30,-37,9,3,0,PI),cx,gy-14,1.3,fx));
  var wat=M(EP(40,-55,3,4),cx,gy-14,1.3,fx);s.push(poly(wat));s.push(M(circle(42,-58,1),cx,gy-14,1.3,fx));
  var tl=M([[-20,-14],[-60,-30],[-100,-42],[-104,-40],[-62,-24],[-22,-8]],cx,gy-14,1.3,fx);s.push(tl);var tb=[];for(var t=1;t<10;t++){var a=lerp(tl[0],tl[2],t/10),b=lerp(tl[5],tl[3],t/10);tb.push(a,b);}s.push(tb);
  s.push(M([[4,-6],[2,10],[-2,14]],cx,gy-14,1.3,fx));s.push(M([[12,-8],[14,10],[18,14]],cx,gy-14,1.3,fx));
  // stubble rows in perspective, hedgerow, sky
  var hz=gy-RR(R,40,50);var st=[],n=RI(R,18,24),vx=RR(R,100,200);for(var i=0;i<=n;i++){var xb=4+i*292/n,xh=vx+(xb-vx)*0.2;var row=[[xh,hz]];for(var u=0.05;u<=1;u+=0.05){var p=lerp([xh,hz],[xb,196],u);row.push(p,[p[0],p[1]-2-4*u],p);}st.push(row);}A(bg,[serp(st)]);
  var hd2=[[4,hz]];for(var x=4;x<=296;x+=8)A(hd2,arc(x+4,hz,4,RR(R,4,8),PI,TAU).slice(1));bg.push(hd2);H(bg,hd2.concat([[4,hz]]),2,40);bg.push([[4,hz],[296,hz]]);
  var tr=RR(R,20,280);treeR(bg,R,tr,hz,RR(R,14,18),2.4);behind(s,bg,sol);return sky(s,R,hz,sol.concat([RP(4,hz,296,196)]));});

S('Hen and chicks',['Mother Hen','Gathering the Brood','Barnyard Morning','Seven Under a Wing','Scratch and Peck'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,170,176),cx=RR(R,110,150),fx=sgn(R);
  var H0=[[-40,-10],[-48,-30],[-56,-56],[-40,-48],[-24,-46],[0,-50],[16,-56],[22,-70],[32,-74],[40,-66],[44,-60],[38,-56],[34,-46],[30,-30],[20,-14],[0,-6]];
  var P=blob(M(H0,cx,gy-8,1.2,fx),4);FS(s,sol,P);var wg=M(blob([[-26,-40],[0,-44],[18,-34],[10,-20],[-16,-18]],4),cx,gy-8,1.2,fx);s.push(poly(wg));clipIn(s,[scallopRows(cx-60,cx+60,gy-70,gy,6,4.5)],wg);
  var tail=[];for(var k=0;k<4;k++)tail.push(M(curve([[-40,-34],[-52-k*3,-50-k*4],[-44-k*4,-62-k*2]],5),cx,gy-8,1.2,fx));A(s,tail);H(s,M([[-40,-12],[-20,-10],[0,-8],[-30,-24]],cx,gy-8,1.2,fx),1.4,30);
  s.push(M(scallop(30,-76,8,3,5,0.6).slice(0,20),cx,gy-8,1.2,fx));s.push(M([[42,-62],[50,-60],[42,-58]],cx,gy-8,1.2,fx));s.push(M(EP(40,-54,2.5,4),cx,gy-8,1.2,fx));s.push(M(circle(34,-64,1.4),cx,gy-8,1.2,fx));
  s.push(M([[-4,-6],[-4,8],[-10,10],[-4,8],[2,10]],cx,gy-8,1.2,fx));s.push(M([[10,-8],[10,8],[4,10],[10,8],[16,10]],cx,gy-8,1.2,fx));
  var nc=RI(R,4,6);for(var i=0;i<nc;i++){var x=cx+fx*(RR(R,60,140)*(i%2?1:0.6))+RR(R,-10,10)*i,y=gy+RR(R,-4,12),c=EP(x,y-6,7,6);if(x<14||x>286)continue;FS(s,sol,c);s.push(circle(x+fx*6,y-14,4.4));s.push([[x+fx*10,y-15],[x+fx*13,y-14],[x+fx*10,y-13]]);s.push([[x,y],[x,y+3]]);H(s,arc(x,y-6,7,6,0,PI),1.2,0);}
  // feed pan, straw, barn wall
  var pan=[[cx+fx*60-14,gy+14],[cx+fx*60+14,gy+14],[cx+fx*60+10,gy+20],[cx+fx*60-10,gy+20]];s.push(poly(pan));s.push(EP(cx+fx*60,gy+14,14,3));
  var straw=[];H(straw,RP(4,gy-14,296,196),RR(R,3.4,4),RR(R,18,28));H(straw,RP(4,gy-14,296,196),RR(R,6,7),RR(R,-30,-20));behind(s,straw,sol);
  var wall=[];wall.push([[4,gy-14],[296,gy-14]]);for(var x2=4;x2<296;x2+=RR(R,10,12))wall.push([[x2,4],[x2,gy-14]]);var dw=RP(RR(R,190,230),40,RR(R,250,280),gy-14);var bw=[];behind(bw,[serp(wall.slice(1))],sol.concat([dw]));A(s,bw);s.push(poly(dw));s.push([dw[0],dw[2]]);s.push([dw[1],dw[3]]);s.push(wall[0]);return s;});

S('Roadrunner',['Dust Behind the Tail','Desert Sprint','Crest Up, Head Low','Noon on the Mesa Road','Speed in the Scrub'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,166,174),cx=RR(R,130,160),fx=sgn(R),sc=RR(R,1.3,1.45);
  var Bd=[[-16,-30],[-6,-40],[10,-44],[22,-50],[28,-62],[36,-66],[42,-64],[62,-62],[42,-58],[36,-52],[30,-40],[20,-30],[0,-24]];
  var P=blob(M(Bd,cx,gy,sc,fx),4);FS(s,sol,P);var st=[];clipIn(st,[zz(cx-60,cx+80,gy-90,gy,3)],P);A(s,st);
  s.push(M([[28,-62],[24,-74],[30,-68],[30,-78],[34,-68],[38,-76],[36,-66]],cx,gy,sc,fx));s.push(M(circle(38,-62,1.4),cx,gy,sc,fx));
  var tl=M([[-14,-34],[-50,-62],[-56,-58],[-20,-28]],cx,gy,sc,fx);FS(s,sol,tl);var tb=[];H(tb,tl,1.4,fx*-40);A(s,tb);
  s.push(M([[4,-26],[10,-14],[2,-2],[8,0],[2,-2],[-2,2]],cx,gy,sc,fx));s.push(M([[10,-28],[-2,-14],[-14,-12],[-18,-6],[-14,-12],[-20,-14]],cx,gy,sc,fx));
  var dust=[];for(var k=0;k<4;k++)dust.push(M(arc(-30-k*14,-4,6+k*2,4+k,PI,TAU),cx,gy,sc,fx));A(s,dust);
  var cx2=fx>0?RR(R,230,270):RR(R,30,70);var cac=[[cx2-5,gy],[cx2-5,gy-60]].concat(arc(cx2,gy-60,5,5,PI,TAU).slice(1)).concat([[cx2+5,gy-40],[cx2+14,gy-40],[cx2+14,gy-54]]).concat(arc(cx2+18,gy-54,4,4,PI,TAU).slice(1)).concat([[cx2+22,gy-34],[cx2+5,gy-34],[cx2+5,gy]]);FS(s,sol,cac);H(s,cac,2,90);
  var hz=gy-RR(R,30,40),mx=RR(R,60,240);bg.push([[mx-70,hz],[mx-54,hz-28],[mx+40,hz-30],[mx+60,hz]]);H(bg,[[mx-70,hz],[mx-54,hz-28],[mx+40,hz-30],[mx+60,hz]],2.4,0);bg.push([[4,hz],[296,hz]]);
  var g=[];H(g,RP(4,hz,296,196),RR(R,5,6),RR(R,-6,6));A(bg,g);var sc2=[];for(var b=0;b<RI(R,5,8);b++){var bx=RR(R,10,290),by=RR(R,hz+8,190);sc2.push(scallop(bx,by,RR(R,6,10),RR(R,3,5),7,0.3));}A(bg,sc2);
  behind(s,bg,sol);return sky(s,R,hz,sol.concat([RP(4,hz,296,196)]));});

S('Grasshopper on a stem',['Spring-Loaded','Meadow Jumper','Long Legs, Green Coat','Waiting to Leap','Late Summer Chirp'],function(R){
  var s=[],sol=[],cx=RR(R,130,170),cy=RR(R,96,106),fx=sgn(R),sc=RR(R,2.5,2.7);
  var stem=curve([[cx-80*fx,196],[cx-20*fx,cy+40],[cx+30*fx,cy+12],[cx+110*fx,4]],10);var st=tube(stem,function(u){return 3.4-1.6*u;});FS(s,sol,st.P);
  var Bd=[[-40,4],[-30,-2],[-10,-6],[10,-8],[22,-12],[30,-10],[34,-4],[30,4],[20,8],[0,8],[-20,8]];var P=blob(M(Bd,cx,cy,sc,fx),4);FS(s,sol,P);var seg=[];for(var x=-34;x<10;x+=5)seg.push(M([[x,-4],[x+1,8]],cx,cy,sc,fx));A(s,seg);
  var hd=M(blob([[20,-12],[30,-14],[36,-6],[32,4],[24,6]],3),cx,cy,sc,fx);s.push(poly(hd));var ey=M(EP(30,-6,3,3.6),cx,cy,sc,fx);s.push(poly(ey));H(s,ey,0.8,0);
  s.push(M(curve([[30,-12],[44,-30],[70,-40],[96,-38]],6),cx,cy,sc,fx));s.push(M(curve([[28,-13],[38,-34],[56,-50],[74,-56]],6),cx,cy,sc,fx));
  var fem=M(lens([-6,-2],[-44,-26],7),cx,cy,sc,fx);FS(s,sol,fem);var hb=[];for(var t=1;t<12;t++){var a=lerp(M([[-6,-2]],cx,cy,sc,fx)[0],M([[-44,-26]],cx,cy,sc,fx)[0],t/12);hb.push(a,[a[0]+3*fx,a[1]+3],a,[a[0]+3*fx,a[1]-3],a);}s.push(hb);
  s.push(M([[-44,-26],[-28,10],[-24,12],[-32,12]],cx,cy,sc,fx));s.push(M(zz(-42,-30,-20,8,3).slice(0,0).concat([[-42,-18],[-40,-14],[-38,-10],[-36,-4]]),cx,cy,sc,fx));
  s.push(M([[10,6],[14,14],[8,18]],cx,cy,sc,fx));s.push(M([[18,6],[24,14],[20,18]],cx,cy,sc,fx));
  var wing=M([[-6,-6],[-40,-2],[-36,2],[-4,0]],cx,cy,sc,fx);s.push(poly(wing));H(s,wing,1.6,fx*80);H(s,P.slice(0,Math.floor(P.length/2)),1.6,fx*20);
  var bgL=[];for(var k=0;k<RI(R,6,8);k++){var bx=RR(R,4,296),bb=196,bh=RR(R,60,190),bc=bx+RR(R,-40,40);bgL.push(curve([[bx,bb],[bx+(bc-bx)*0.3,bb-bh*0.5],[bc,bb-bh]],6));}behind(s,bgL,sol);
  var soft=[];H(soft,RP(4,4,296,196),RR(R,6.5,7.5),RR(R,30,45));behind(s,soft,sol);return s;});

S('Squid',['Ten Arms Trailing','Jet Through the Blue','Torpedo of the Deep','Midwater Drifter','Fins Like Wings'],function(R){
  var s=[],sol=[],cx=RR(R,130,170),ty=RR(R,26,34),fx=sgn(R);
  var mL=RR(R,64,74),mw=RR(R,20,24),man=[[cx,ty]].concat(quad([cx,ty],[cx+mw*1.2,ty+mL*0.4],[cx+mw,ty+mL],12).slice(1)).concat([[cx-mw,ty+mL]]).concat(quad([cx-mw,ty+mL],[cx-mw*1.2,ty+mL*0.4],[cx,ty],12).slice(1));FS(s,sol,man);
  var fins=[[cx,ty+2],[cx+mw*1.8,ty+mL*0.28],[cx+mw*0.7,ty+mL*0.38]];s.push(fins);s.push([[cx,ty+2],[cx-mw*1.8,ty+mL*0.28],[cx-mw*0.7,ty+mL*0.38]]);
  var sp=[];for(var k=0;k<14;k++){var y=ty+RR(R,10,mL-6),w=mw*Math.min(1,(y-ty)/mL*1.6)*0.8,x=cx+RR(R,-w,w);sp.push(circle(x,y,RR(R,1.4,2.6)));}A(s,sp);H(s,[[cx,ty]].concat(quad([cx,ty],[cx+mw*1.2,ty+mL*0.4],[cx+mw,ty+mL],12).slice(1)).concat([[cx+mw*0.3,ty+mL]]),1.6,80);
  var hy=ty+mL,hd=EP(cx,hy+8,mw*0.8,10);FS(s,sol,hd);[-1,1].forEach(function(d){var e=EP(cx+d*mw*0.5,hy+7,4,5);s.push(poly(e));H(s,e,0.9,0);});
  var arms=[];for(var a=0;a<8;a++){var x0=cx+(a-3.5)*mw*0.2,L=RR(R,50,70),ph=R()*6,pts=[];for(var t=0;t<=8;t++){var u=t/8;pts.push([x0+(a-3.5)*u*8+6*Math.sin(u*5+ph),hy+16+L*u]);}var c=curve(pts,5);var tb=tube(c,function(u){return 2.4*(1-u)+0.4;});arms.push(tb.P);}
  arms.forEach(function(P){s.push(poly(P));});for(var tt=0;tt<2;tt++){var x1=cx+(tt?1:-1)*mw*0.3,pts2=[];for(var t2=0;t2<=10;t2++){var u2=t2/10;pts2.push([x1+(tt?1:-1)*u2*40*fx+8*Math.sin(u2*6),hy+16+u2*96]);}var c2=curve(pts2,5);s.push(c2);var e2=c2[c2.length-1];s.push(lens(c2[c2.length-12],e2,3));}
  // water light from above, a seabed hint
  var bed=seabed(s,R,RR(R,186,190),0);var rays=[];H(rays,RP(4,4,296,184),RR(R,8,9),fx*RR(R,70,80));behind(s,rays,sol.concat(arms));return s;});

S('Moray eel in the rocks',['Gape at the Crevice','Speckled Guardian','Den in the Reef','Watching From the Hole','Open Mouth, No Threat'],function(R){
  var s=[],sol=[],fx=sgn(R),cx=RR(R,130,160),cy=RR(R,90,100);
  var rk=[];rocks(rk,sol,R,4,296,196,RR(R,70,90),RI(R,4,5));var cav=EP(cx-fx*30,cy+30,36,26);
  var sp=[[cx-fx*30,cy+34],[cx-fx*10,cy+10],[cx+fx*20,cy-10],[cx+fx*50,cy-14]];var body=tube(curve(sp,8),function(u){return 10+4*u;});FS(s,sol,body.P);
  var hd=[[cx+fx*44,cy-30],[cx+fx*70,cy-28],[cx+fx*84,cy-20],[cx+fx*74,cy-16],[cx+fx*84,cy-8],[cx+fx*68,cy-2],[cx+fx*44,cy-2]];FS(s,sol,hd);
  var mouth=[[cx+fx*84,cy-20],[cx+fx*64,cy-15],[cx+fx*84,cy-8]];s.push(mouth);var th=[];for(var t=0;t<5;t++){var p=lerp([cx+fx*82,cy-19],[cx+fx*66,cy-15.5],t/5);th.push(p,[p[0],p[1]+2]);}s.push(th);
  s.push(circle(cx+fx*66,cy-24,2.4));s.push(circle(cx+fx*66,cy-24,1));
  var dots=[];clipIn(dots,[scallopRows(cx-80,cx+100,cy-40,cy+60,6,5)],body.P);clipIn(dots,[scallopRows(cx-80,cx+100,cy-40,cy+60,6,5)],hd,[EP(cx+fx*66,cy-24,4,4)]);A(s,dots);
  var fin=body.R.slice(4).map(function(p,i){return [p[0],p[1]-3-1.5*Math.sin(i)];});s.push(fin);
  s.push(poly(cav));var ch=[];H(ch,cav,1.2,0);behind(s,ch,sol);var rkc=[];behind(rkc,rk,[body.P,hd]);A(s,rkc);
  var cor=[];for(var c=0;c<RI(R,3,5);c++){var x=RR(R,10,290),b=RR(R,104,130),tips=[];for(var k=0;k<6;k++){var a=-PI/2+(k-2.5)*0.3;tips.push([x,b],[x+RR(R,14,22)*Math.cos(a),b+RR(R,14,22)*Math.sin(a)]);}tips.push([x,b]);cor.push(tips);}behind(s,cor,sol);
  var w=[];A(w,[waterS(R,4,296,6,110,RR(R,5,6),1.2)]);behind(s,w,sol.concat([RP(4,106,296,196)]));
  var fish=[];for(var f=0;f<RI(R,2,3);f++){var fx2=RR(R,30,270),fy=RR(R,20,60);fish.push(poly([[fx2,fy],[fx2+8,fy-4],[fx2+14,fy],[fx2+8,fy+4],[fx2,fy],[fx2-4,fy-3],[fx2-4,fy+3]]).slice(0,-1));}A(s,fish);return s;});

S('Clownfish in an anemone',['Home Among the Tentacles','Striped Tenants','Safe in the Sway','Orange Flicker','Partners on the Reef'],function(R){
  var s=[],sol=[],cx=RR(R,130,170),by=RR(R,170,178);
  function fish(x,y,sz,d){var P=blob([[x-sz,y],[x-sz*0.4,y-sz*0.5],[x+sz*0.4,y-sz*0.5],[x+sz,y-sz*0.1],[x+sz*0.9,y+sz*0.2],[x+sz*0.4,y+sz*0.45],[x-sz*0.4,y+sz*0.4]].map(function(p){return [x+(p[0]-x)*d,p[1]];}),4);FS(s,sol,P);
    var tail=[[x-d*sz,y],[x-d*sz*1.5,y-sz*0.35],[x-d*sz*1.4,y],[x-d*sz*1.5,y+sz*0.35],[x-d*sz,y]];s.push(tail);
    var bands=[[0.55,0.75],[0.05,0.25],[-0.75,-0.6]],holes=bands.map(function(b){return RP(x+d*sz*b[0],y-sz,x+d*sz*b[1],y+sz);});holes.forEach(function(Hh){clipIn(s,[[[Hh[0][0],y-sz],[Hh[0][0],y+sz]],[[Hh[1][0],y-sz],[Hh[1][0],y+sz]]],P);});
    var orange=[];H(orange,P,1.5,d*70);clipIn(s,orange,P,holes);s.push(circle(x+d*sz*0.7,y-sz*0.15,sz*0.1));s.push(lens([x+d*sz*0.2,y+sz*0.3],[x-d*sz*0.1,y+sz*0.75],sz*0.12));}
  fish(cx+RR(R,-30,-10),RR(R,70,84),RR(R,24,28),sgn(R));fish(cx+RR(R,40,70),RR(R,100,116),RR(R,16,20),sgn(R));
  var base=EP(cx,by,RR(R,60,70),10);var ten=[],n=RI(R,40,50);for(var i=0;i<n;i++){var t=i/(n-1),x0=cx-64+t*128,L=RR(R,50,80)*(1-Math.abs(t-0.5)),ang=-PI/2+(t-0.5)*1.6+RR(R,-0.2,0.2),ph=R()*6,pts=[];for(var u=0;u<=6;u++){var v=u/6;pts.push([x0+L*v*Math.cos(ang)+4*Math.sin(v*5+ph),by-6+L*v*Math.sin(ang)]);}var c=curve(pts,4);ten.push(c.concat(c.slice(0,-1).reverse().map(function(p){return [p[0]+1.8,p[1]+0.6];})));}
  behind(s,ten,sol);var col=[[cx-60,by],[cx-56,by+16],[cx+56,by+16],[cx+60,by]];s.push(col);H(s,col,1.6,90);
  var w=[],rk=[];rocks(rk,[],R,4,cx-70,196,24,2);rocks(rk,[],R,cx+70,296,196,24,2);behind(s,rk,sol.concat([col]));A(w,[waterS(R,4,296,6,by-4,RR(R,5,6),1.2)]);var tops=ten.map(function(T){return T;});
  var hole=[];ten.forEach(function(T){});behind(s,w,sol.concat([EP(cx,by-30,86,62)]));return s;});


// ---- chunk C: instruments, tools, kitchen, food, toys, furniture ----
S('Clarinet',['Reed and Blackwood','Before the Concert','Rest on the Score','Chalumeau Low','Silver Keys'],function(R){
  var s=[],sol=[],ty=RR(R,160,168),a=RR(R,-0.42,-0.3),x0=RR(R,40,60),y0=ty-RR(R,10,16),L=RR(R,210,230);
  function T(p){return rotateAbout([p],x0,y0,a)[0];}
  var prof=[[0,-3.4],[16,-3.6],[18,-5],[60,-5],[62,-6],[150,-6],[170,-7],[L-34,-8],[L-12,-14],[L,-22]],top=prof.map(function(p){return T([x0+p[0],y0+p[1]]);}),bot=prof.slice().reverse().map(function(p){return T([x0+p[0],y0-p[1]]);});
  var P=top.concat(bot);FS(s,sol,P);H(s,prof.map(function(p){return T([x0+p[0],y0+p[1]*0.2]);}).concat(bot),1.4,a*180/PI);
  [[16,5],[60,6],[150,6],[L-34,8]].forEach(function(q){s.push([T([x0+q[0],y0-q[1]]),T([x0+q[0],y0+q[1]])]);});s.push([T([x0-4,y0-2]),T([x0,y0-3.4])]);s.push(rotateAbout(rect(x0+4,y0-4.4,x0+12,y0+4.4),x0,y0,a));
  var keys=[];for(var k=0;k<9;k++){var kx=x0+70+k*15;keys.push(rotateAbout(EP(kx,y0,2.6,2.6),x0,y0,a));}keys.forEach(function(K){s.push(poly(K));});
  s.push(rotateAbout([[x0+64,y0-4],[x0+200,y0-4]],x0,y0,a));for(var k2=0;k2<6;k2++){var kx2=x0+70+k2*22;s.push(rotateAbout([[kx2,y0-4],[kx2+6,y0-8],[kx2+14,y0-8],[kx2+16,y0-4]],x0,y0,a));}
  // sheet music under it
  var pg=[RP(RR(R,30,50),ty-90,RR(R,140,150),ty-6),RR(R,0,1)];var sheets=[RP(pg[0][0][0],ty-90,pg[0][1][0],ty-4),RP(pg[0][1][0]+6,ty-86,pg[0][1][0]+118,ty-4)];var mus=[];sheets.forEach(function(Q){mus.push(poly(Q));for(var g=0;g<4;g++){var sy=Q[0][1]+12+g*18;var st=[];for(var l=0;l<5;l++)st.push([[Q[0][0]+6,sy+l*2.4],[Q[1][0]-6,sy+l*2.4]]);mus.push(serp(st));for(var n=0;n<RI(R,4,7);n++){var nx=Q[0][0]+14+n*14+RR(R,-2,2),ny=sy+RI(R,0,8)*1.2;mus.push(arc(nx,ny,2,1.4,0,TAU*1.0));mus.push([[nx+2,ny],[nx+2,ny-9]]);}}});behind(s,mus,sol);
  onTable(s,R,ty,sol.concat(sheets));return s;});

S('Tambourine',['Jingles at Rest','Frame and Skin','Festival Morning','Shake It Twice','Ribbons and Brass'],function(R){
  var s=[],sol=[],ty=RR(R,166,172),cx=RR(R,130,160),cy=ty-RR(R,30,36),rx=RR(R,70,78),ry=rx*RR(R,0.36,0.42),h=RR(R,14,16);
  var outer=[[cx-rx,cy-h]].concat(arc(cx,cy,rx,ry,PI,0)).concat([[cx+rx,cy-h]]).concat(arc(cx,cy-h,rx,ry,0,PI).slice(1));FS(s,sol,outer);s.push(ellipse(cx,cy-h,rx-4,ry-3));
  var skin=EP(cx,cy-h,rx-4,ry-3);var sk=[];H(sk,skin,RR(R,5,6),RR(R,10,20));var hl=EP(cx-rx*0.2,cy-h-ry*0.2,rx*0.3,ry*0.25);clipIn(s,sk,skin,[hl]);
  var nj=RI(R,5,6);for(var j=0;j<nj;j++){var a=PI*(0.1+0.8*j/(nj-1)),jx=cx-rx*Math.cos(a),jy=cy+ry*Math.sin(a)-h/2;var slot=RP(jx-6,jy-4,jx+6,jy+4);s.push(poly(slot));H(s,slot,1,90);[-3,3].forEach(function(d){s.push(ellipse(jx+d,jy,4,2));});}
  var bd=[];H(bd,[[cx-rx,cy-h]].concat(arc(cx,cy,rx,ry,PI,0)).concat([[cx+rx,cy-h]]),RR(R,3.5,4.5),90);behind(s,bd,sol.slice(1).concat([]).concat([]));
  var rib=[[cx+rx,cy-h/2]];for(var t=0;t<=8;t++)rib.push([cx+rx+t*8,cy-h/2+t*4+5*Math.sin(t)]);s.push(rib);s.push(rib.map(function(p){return [p[0]+3,p[1]+4];}));
  // maracas beside
  var mx=cx-rx-RR(R,20,30);if(mx>30){var m=EP(mx,ty-24,14,18);FS(s,sol,m);var mh=[];H(mh,m,2.4,45);A(s,mh);s.push(RP(mx-2,ty-6,mx+2,ty));}
  var cloth=[[cx-rx-40,ty],[cx-rx-20,ty-6],[cx+rx+30,ty-4],[cx+rx+50,ty]];s.push(cloth);
  onTable(s,R,ty,sol);return s;});

S('Scythe and whetstone',['Hay Time','Leaning on the Stack','The Long Blade','Mown Rows Drying','Sharpened at Noon'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,166,174),hx=RR(R,170,200),hw=RR(R,48,56),hh=RR(R,84,94);
  var stack=blob([[hx-hw,gy],[hx-hw*0.9,gy-hh*0.5],[hx-hw*0.5,gy-hh*0.92],[hx,gy-hh],[hx+hw*0.5,gy-hh*0.92],[hx+hw*0.9,gy-hh*0.5],[hx+hw,gy]],6);FS(s,sol,stack);var st=[];for(var y=gy-hh+6;y<gy;y+=RR(R,5,6)){st.push(wave(hx-hw,hx+hw,y,1.4,10,R()*6));}clipIn(s,[serp(st)],stack);
  var sx=hx-hw*0.6,base=[sx-30,gy],top=[sx+8,gy-110];var sn=curve([base,[sx-16,gy-50],[sx-6,gy-80],top],8);var sn2=tube(sn,function(){return 1.8;});FS(s,sol,sn2.P);
  [0.3,0.62].forEach(function(t){var p=sn[Math.floor(t*(sn.length-1))];var hd=[[p[0],p[1]],[p[0]+14,p[1]-4],[p[0]+16,p[1]-1],[p[0]+2,p[1]+3]];FS(s,sol,hd);});
  var bl=[base,[base[0]-20,gy-4],[base[0]-60,gy-20],[base[0]-78,gy-40]];var blade=curve(bl,8),bt=blade.slice().reverse().map(function(p,i,arr){var u=i/(arr.length-1);return [p[0]+3*u,p[1]+8*u];});var Bp=blade.concat(bt);FS(s,sol,Bp);H(s,Bp,1.2,30);
  var ws=[hx+hw*0.4,gy-hh*0.5];s.push([[ws[0],ws[1]-12],[ws[0],ws[1]]]);var holder=RP(ws[0]-4,ws[1],ws[0]+4,ws[1]+20);FS(s,sol,holder,1.4,0);s.push(lens([ws[0],ws[1]-4],[ws[0],ws[1]+28],3));
  // mown swathes, field, sky
  var sw=[];for(var r=0;r<5;r++){var y2=gy+6+r*RR(R,6,8);sw.push(scallopRows(4,296,y2,y2,RR(R,8,12),2.4));}A(bg,sw);
  var hz=gy-RR(R,30,40);bg.push([[4,hz],[296,hz]]);var gr=[];for(var y3=hz+4;y3<gy;y3+=4.5)gr.push(tufts(4,296,y3,3,R));A(bg,[serp(gr)]);
  treeR(bg,R,RR(R,20,60),hz,RR(R,12,16),2.4);behind(s,bg,sol);return sky(s,R,hz,sol.concat([RP(4,hz,296,196)]));});

S('Mallet and chisels',['Carver\'s Bench','Gouge, Skew, Mallet','Shavings Everywhere','Cutting a Mortise','Beech and Steel'],function(R){
  var s=[],sol=[],ty=RR(R,138,148);
  var mx=RR(R,40,70),mh=[mx,ty-30],head=[[mh[0]-16,mh[1]-24],[mh[0]+16,mh[1]-24],[mh[0]+16,mh[1]+18],[mh[0]-16,mh[1]+18]];
  var hdl=RP(mh[0]+16,mh[1]-4,mh[0]+86,mh[1]+4);FS(s,sol,hdl,1.6,0);FS(s,sol,head);var gr=[];for(var y=mh[1]-20;y<mh[1]+16;y+=3)gr.push(wave(mh[0]-16,mh[0]+16,y,0.6,14,y));clipIn(s,[serp(gr)],head);s.push(ellipse(mh[0],mh[1]-24,16,4));
  var nc=RI(R,3,4);for(var c=0;c<nc;c++){var cx=RR(R,130,150)+c*RR(R,28,34),ang=-PI/2+RR(R,-0.2,0.2)+(c-nc/2)*0.05,L=RR(R,90,110),b=[cx,ty+20];var tip=[b[0]+L*Math.cos(ang),b[1]+L*Math.sin(ang)];
    var hd2=[lerp(b,tip,0),lerp(b,tip,0.4)],sh=[lerp(b,tip,0.42),tip];var hw=7;var h2=tube([hd2[0],hd2[1]],function(u){return hw-u*1.6;});FS(s,sol,h2.P);H(s,h2.P,1.6,ang*180/PI);
    var fer=tube([lerp(b,tip,0.4),lerp(b,tip,0.46)],function(){return 4.4;});FS(s,sol,fer.P);var bl=tube(sh,function(u){return 2.6+u*(c%2?3:0.4);});FS(s,sol,bl.P);s.push([lerp(b,tip,0.46),tip]);}
  var blk=RP(RR(R,190,210),ty-40,296,ty);var bk=[];var pts=[[blk[0][0],ty-40],[blk[0][0]+8,ty-48],[300,ty-48]];FS(s,sol,blk);s.push(pts);var gv=[[blk[0][0]+20,ty-40],[blk[0][0]+26,ty-28],[blk[0][0]+50,ty-28],[blk[0][0]+56,ty-40]];s.push(gv);H(s,gv,1.2,0);var grain=[];for(var y2=ty-34;y2<ty;y2+=4)grain.push(wave(blk[0][0],296,y2,1,30,y2));clipIn(s,[serp(grain)],blk,[gv]);
  var shv=[];for(var k=0;k<RI(R,6,9);k++){var sx=RR(R,90,260),sy=ty+RR(R,8,40);shv.push(spiral(sx,sy,1,RR(R,4,7),1.6,R()*6));}var cut=[];behind(cut,shv,sol);A(s,cut);
  // bench top planks and wall of boards
  var bench=[];bench.push([[4,ty+48],[296,ty+48]]);var pl=[];for(var y3=ty+4;y3<ty+48;y3+=RR(R,9,11))pl.push([[4,y3],[296,y3]]);bench.push(serp(pl));H(bench,RP(4,ty+48,296,196),RR(R,3,3.6),90);bench.push([[4,ty-6],[296,ty-6]]);
  var wall=[];for(var x=4;x<296;x+=RR(R,7,8))wall.push([[x,4],[x,ty-6]]);bench.push(serp(wall));var pegs=[];[60,120,240].forEach(function(x){pegs.push(circle(x,30,3));});A(bench,pegs);behind(s,bench,sol.concat(shv.map(function(P){return P;})));return s;});

S('Box grater and cheese',['Four Sides of Sharp','Before the Pasta','Shredded Mountain','Parmesan Hour','Kitchen Corner'],function(R){
  var s=[],sol=[],ty=RR(R,166,172),cx=RR(R,120,150),gw=RR(R,30,34),gh=RR(R,100,110),tw=gw*0.6;
  var front=[[cx-gw,ty],[cx-tw,ty-gh],[cx+tw,ty-gh],[cx+gw,ty]];FS(s,sol,front);var side=[[cx+gw,ty],[cx+tw,ty-gh],[cx+tw+12,ty-gh-6],[cx+gw+16,ty-6]];FS(s,sol,side);H(s,side,1.6,80);
  var holes=[];clipIn(holes,[scallopRows(cx-gw,cx+gw,ty-gh+8,ty-6,RR(R,6,7),RR(R,7,8))],front);A(s,holes);
  var hd=[[cx-tw*0.6,ty-gh],[cx-tw*0.6,ty-gh-18],[cx+tw*0.6,ty-gh-18],[cx+tw*0.6,ty-gh]];s.push(hd);s.push(RP(cx-tw*0.6-2,ty-gh-22,cx+tw*0.6+2,ty-gh-18));
  var pile=[[cx-gw-10,ty]];for(var k=0;k<14;k++){var a=PI-k*PI/13;pile.push([cx+gw*0.2+30*Math.cos(a),ty-RR(R,6,14)*Math.sin(a)]);}var pz=[];for(var t=0;t<80;t++){var a2=R()*PI;pz.push([cx+gw*0.2+28*Math.cos(a2)*R(),ty-12*Math.sin(a2)*R()]);}s.push(pz);
  var ch=RR(R,200,220),cheese=[[ch,ty],[ch,ty-34],[ch+60,ty-46],[ch+60,ty-12]];FS(s,sol,cheese);s.push([[ch,ty-34],[ch+16,ty-50],[ch+70,ty-56],[ch+60,ty-46]]);H(s,[[ch+60,ty-46],[ch+70,ty-56],[ch+70,ty-22],[ch+60,ty-12]],1.4,90);
  H(s,cheese,RR(R,3,3.4),RR(R,20,30));
  var board=[[cx-gw-40,ty+4],[ch+80,ty+4],[ch+86,ty+12],[cx-gw-34,ty+12]];s.push(poly(board));H(s,board,2,0);
  onTable(s,R,ty+12,sol.concat([board]));return s;});

S('Rolling pin and dough',['Flour on Everything','Star Cutters Out','Sunday Biscuits','Rolled Thin','Baker\'s Bench'],function(R){
  var s=[],sol=[],ty=RR(R,176,182),cy=RR(R,128,136);
  var dough=blob([[30,cy+30],[60,cy-6],[150,cy-14],[250,cy-4],[280,cy+28],[200,cy+44],[90,cy+44]],8);FS(s,sol,dough);var fl=[];for(var k=0;k<60;k++)fl.push([RR(R,40,260),RR(R,cy,cy+36)]);var fd=[];clipIn(fd,[fl],dough);
  var px=RR(R,120,170),pin=[[px-60,cy-6],[px+60,cy-26],[px+64,cy-12],[px-56,cy+8]];FS(s,sol,pin);s.push(rotateAbout(ellipse(px+62,cy-19,3,7),px+62,cy-19,-0.16));H(s,[[px-58,cy+2],[px+62,cy-18],[px+64,cy-12],[px-56,cy+8]],1.2,-9);
  [[px-60,cy-6,-1],[px+62,cy-19,1]].forEach(function(e){var h=[[e[0],e[1]-2],[e[0]+e[2]*24,e[1]-2-e[2]*4],[e[0]+e[2]*26,e[1]+4-e[2]*4],[e[0],e[1]+6]];FS(s,sol,h,1.4,90);});
  var cuts=[];for(var c=0;c<RI(R,3,5);c++){var x=RR(R,50,250),y=RR(R,cy+14,cy+36);if(Math.abs(x-px)<50)continue;var star=poly(leafStar(x,y,8,R()*TAU));cuts.push(star);}A(s,cuts);
  var cutter=[RR(R,20,40),ty-24];var hs=cubic([cutter[0],cutter[1]-10],[cutter[0]-12,cutter[1]-22],[cutter[0]-12,cutter[1]-4],[cutter[0],cutter[1]+8],10).concat(cubic([cutter[0],cutter[1]+8],[cutter[0]+12,cutter[1]-4],[cutter[0]+12,cutter[1]-22],[cutter[0],cutter[1]-10],10).slice(1));s.push(hs);
  var bag=[[248,ty],[244,ty-50],[250,ty-56],[290,ty-56],[294,ty-50],[292,ty]];FS(s,sol,bag);s.push(zz(246,292,ty-56,ty-50,4));s.push(rect(256,ty-40,284,ty-24));H(s,[[278,ty-50],[292,ty-50],[292,ty],[280,ty]],1.6,90);
  var board=[[16,cy+48],[24,cy-24],[276,cy-24],[288,cy+48]];var bd=[];bd.push(poly(board));H(bd,board,RR(R,4,5),90);behind(s,bd,sol.concat([dough]));
  onTable(s,R,ty,sol.concat([board]));return s;});

S('Wok on a burner',['Flame High','Stir-Fry Hour','Breath of the Wok','Tossed in Seconds','Blue Fire, Black Steel'],function(R){
  var s=[],sol=[],ty=RR(R,150,158),cx=RR(R,120,150),wr=RR(R,60,68),wy=ty-RR(R,34,40);
  var wok=[[cx-wr,wy]].concat(quad([cx-wr,wy],[cx,wy+wr*0.9],[cx+wr,wy],20).slice(1));var rim=EP(cx,wy,wr,wr*0.2);FS(s,sol,wok.concat(arc(cx,wy,wr,wr*0.2,0,PI).slice(1)));s.push(ellipse(cx,wy,wr,wr*0.2));H(s,wok.slice(10).concat([[cx,wy+4]]),1.4,60);
  var hd=[[cx+wr,wy+2],[cx+wr+70,wy-12],[cx+wr+72,wy-6],[cx+wr+2,wy+6]];FS(s,sol,hd);var hw=[[cx+wr+40,wy-6],[cx+wr+72,wy-12],[cx+wr+74,wy-4],[cx+wr+42,wy+1]];H(s,hw,1.2,-10);
  var veg=[];for(var k=0;k<RI(R,7,10);k++){var vx=cx+RR(R,-wr*0.7,wr*0.7),vy=wy+RR(R,-6,3);veg.push(R()<0.5?arc(vx,vy,RR(R,4,6),RR(R,2,3),PI,TAU):lens([vx-6,vy],[vx+6,vy-2],2));}var vc=[];A(s,veg);
  var steam=[];for(var t=0;t<3;t++){var sx=cx+(t-1)*wr*0.5;steam.push(curve([[sx,wy-6],[sx+8,wy-24],[sx-6,wy-42],[sx+6,wy-62]],6));}A(s,steam);
  var bur=EP(cx,ty-8,34,7);s.push(poly(bur));var fl=[[cx-30,ty-8]];for(var f=0;f<10;f++){var fx=cx-30+f*6;fl.push([fx+3,ty-8-RR(R,10,18)],[fx+6,ty-8]);}s.push(fl);
  var grate=[];[-1,1].forEach(function(d){grate.push([[cx+d*48,ty-4],[cx+d*42,wy+22],[cx+d*30,wy+22]]);});A(s,grate);
  var top=[[4,ty],[296,ty]];s.push(top);var st=[];H(st,RP(4,ty,296,196),RR(R,4,5),0);s.push(rect(20,ty+12,80,ty+30));s.push(circle(220,ty+20,6));s.push(circle(250,ty+20,6));behind(s,st,[RP(20,ty+12,80,ty+30),EP(220,ty+20,6,6),EP(250,ty+20,6,6)]);
  var wall=[];var g=RR(R,12,14);H(wall,RP(4,4,296,ty),g,0);H(wall,RP(4,4,296,ty),g,90);behind(s,wall,sol);return s;});

S('Rotary egg beater',['Whisk by Hand','Crank and Gears','Batter Rising','Grandmother\'s Drawer','Meringue Arm'],function(R){
  var s=[],sol=[],ty=RR(R,168,174),cx=RR(R,120,150),by=ty-RR(R,10,14),bw=RR(R,56,62);
  var bowl=[[cx-bw,by-44]].concat(quad([cx-bw,by-44],[cx-bw*0.9,by+6],[cx,by+6],12).slice(1)).concat(quad([cx,by+6],[cx+bw*0.9,by+6],[cx+bw,by-44],12).slice(1));FS(s,sol,bowl.concat(arc(cx,by-44,bw,8,0,PI).slice(1)));s.push(ellipse(cx,by-44,bw,8));H(s,bowl.slice(12),1.6,70);
  var bat=EP(cx,by-40,bw-6,5);s.push(spiral(cx+8,by-40,1,bw*0.5,2.2,0).map(function(p){return [p[0],by-40+(p[1]-(by-40))*0.12];}));
  var gx=cx+4,gy2=by-108,gr=RR(R,22,26);var gear=[];for(var k=0;k<=48;k++){var a=k/48*TAU,r=gr+(k%2?2.6:0);gear.push([gx+r*Math.cos(a),gy2+r*Math.sin(a)]);}FS(s,sol,gear.slice(0,-1));s.push(circle(gx,gy2,gr-6));var sp=[];for(var k2=0;k2<4;k2++){var a2=k2*PI/2+0.4;sp.push([gx,gy2],[gx+(gr-6)*Math.cos(a2),gy2+(gr-6)*Math.sin(a2)],[gx,gy2]);}s.push(sp);
  var crank=[[gx,gy2],[gx+gr+14,gy2-10]];s.push(crank);var kn=[[gx+gr+14,gy2-10],[gx+gr+18,gy2-24],[gx+gr+24,gy2-24],[gx+gr+22,gy2-8]];FS(s,sol,kn,1.2,90);
  var fr=[[gx-8,gy2-gr-30],[gx-8,by-30]];s.push(fr);s.push([[gx-14,gy2-gr-30],[gx-2,gy2-gr-30]]);var hdl=RP(gx-14,gy2-gr-56,gx-2,gy2-gr-30);FS(s,sol,hdl,1.6,90);
  [-1,1].forEach(function(d){var bx=gx-8+d*7;s.push([[bx,gy2+gr+2],[bx,by-46]]);for(var l=0;l<3;l++){var w=6-l*1.6;s.push(arc(bx,by-40,w,14,0,TAU));}});
  var eggs=[];[[cx+bw+30,ty-10],[cx+bw+52,ty-9]].forEach(function(e,i){var E=EP(e[0],e[1],9,11);FS(s,sol,E);H(s,arc(e[0],e[1],9,11,-PI/2,PI/2),1.4,60);});var shell=[[cx-bw-40,ty]].concat(scallop(cx-bw-30,ty-2,10,5,6,0.3).slice(20,40)).concat([[cx-bw-20,ty]]);s.push(shell);
  onTable(s,R,ty,sol);return s;});

S('French press',['Four Minutes, Then Press','Morning Brew','Grounds Settling','Plunger Up','Steam on the Glass'],function(R){
  var s=[],sol=[],ty=RR(R,166,172),cx=RR(R,110,140),r=RR(R,24,28),h=RR(R,96,104),top=ty-h;
  var gl=RP(cx-r,top,cx+r,ty-8);FS(s,sol,gl);var cof=RP(cx-r,top+28,cx+r,ty-8);H(s,cof,1.3,0);H(s,RP(cx-r,ty-30,cx+r,ty-8),1.3,90);s.push([[cx-r,top+28],[cx+r,top+28]]);s.push(wave(cx-r,cx+r,top+30,0.8,8));
  var frame=[[cx-r-3,ty],[cx-r-3,ty-8],[cx+r+3,ty-8],[cx+r+3,ty]];FS(s,sol,frame);s.push(RP(cx-r-3,top+40,cx+r+3,top+44));s.push(RP(cx-r-3,top+70,cx+r+3,top+74));
  var lid=[[cx-r-4,top],[cx-r,top-8],[cx+r,top-8],[cx+r+4,top]];FS(s,sol,lid);s.push([[cx,top-8],[cx,top-40]]);s.push(circle(cx,top-46,6));s.push([[cx-r,top+24],[cx+r,top+24]]);
  var hdl=[[cx+r+3,top+12],[cx+r+24,top+16],[cx+r+24,ty-28],[cx+r+3,ty-24],[cx+r+3,ty-34],[cx+r+16,ty-36],[cx+r+16,top+24],[cx+r+3,top+22]];FS(s,sol,hdl,1.6,90);
  var sp=[[cx-r,top+6],[cx-r-12,top+2],[cx-r,top+12]];s.push(sp);var gl2=[];gl2.push([[cx-r+6,top+6],[cx-r+6,top+22]]);gl2.push([[cx-r+10,top+34],[cx-r+10,top+60]]);A(s,gl2);
  var cpx=cx+RR(R,96,116),cup=[[cpx-20,ty-34],[cpx-16,ty-6],[cpx+16,ty-6],[cpx+20,ty-34]];FS(s,sol,cup);s.push(ellipse(cpx,ty-34,20,4));H(s,EP(cpx,ty-33,17,2.6),0.9,0);s.push(arc(cpx+22,ty-22,8,8,-PI/2,PI/2));var sau=EP(cpx,ty-4,32,5);s.push(poly(sau));H(s,[[cpx+16,ty-34],[cpx+20,ty-34],[cpx+16,ty-6],[cpx+10,ty-6]],1.2,80);
  var stm=[];for(var t=0;t<2;t++){var sx=cpx+(t?6:-6);stm.push(curve([[sx,ty-40],[sx+6,ty-54],[sx-4,ty-68],[sx+4,ty-80]],6));}A(s,stm);
  var bn=[];for(var b=0;b<RI(R,5,7);b++){var bx=RR(R,30,cx-r-14),byy=ty-RR(R,3,6);bn.push(poly(EP(bx,byy,4,2.6)));bn.push([[bx-3,byy],[bx+3,byy]]);}A(s,bn);
  onTable(s,R,ty,sol);return s;});

S('Avocado halves',['Pit and Hollow','Green Halves','Toast Waiting','Split Clean','Ripe Today'],function(R){
  var s=[],sol=[],ty=RR(R,166,172),cy=ty-RR(R,34,40);
  function half(x,y,pit,a){var out=blob([[x,y-34],[x+20,y-20],[x+26,y+8],[x+14,y+28],[x-14,y+28],[x-26,y+8],[x-20,y-20]],6),inn=blob([[x,y-28],[x+15,y-16],[x+20,y+8],[x+10,y+22],[x-10,y+22],[x-20,y+8],[x-15,y-16]],6);
    out=rotateAbout(out,x,y,a);inn=rotateAbout(inn,x,y,a);FS(s,sol,out);s.push(poly(inn));HX(s,[out,inn],1.1,30);var fl=[];H(fl,inn,RR(R,4.5,5.5),20);var pc=EP(x+1,y+8,11,12);
    if(pit){clipIn(s,fl,inn,[pc]);s.push(poly(pc));H(s,arc(x+1,y+8,11,12,-PI/2,PI/2).concat([[x+4,y+8]]),1.1,60);s.push(arc(x-3,y+3,4,5,PI,1.6*PI));}else{clipIn(s,fl,inn,[pc]);s.push(poly(pc));s.push(arc(x+1,y+8,9,10,0.2,PI-0.2));}}
  var x1=RR(R,90,110);half(x1,cy,true,RR(R,-0.4,-0.2));half(x1+RR(R,70,80),cy,false,RR(R,0.2,0.4));
  var wx=RR(R,236,256),whole=blob([[wx,ty-60],[wx+16,ty-44],[wx+22,ty-14],[wx+10,ty],[wx-10,ty],[wx-22,ty-14],[wx-16,ty-44]],6);FS(s,sol,whole);var dt=[];clipIn(dt,[zz(wx-24,wx+24,ty-60,ty,3)],whole);A(s,dt);
  var kn=[[30,ty-8],[90,ty-14],[94,ty-10],[30,ty-4]];FS(s,sol,kn);var kh=[[94,ty-12],[140,ty-18],[142,ty-12],[94,ty-8]];FS(s,sol,kh,1.4,90);
  var board=blob([[20,ty+2],[30,ty-82],[220,ty-84],[230,ty+2]],2);var bd=[];bd.push(poly(board));H(bd,board,RR(R,7,8),88);behind(s,bd,sol);onTable(s,R,ty,sol.concat([board]));return s;});

S('Doughnuts on a plate',['Glazed and Waiting','Half Dozen','Coffee Break','Sprinkles on Top','The Last One'],function(R){
  var s=[],sol=[],ty=RR(R,168,174),cx=RR(R,130,160),py=ty-14,pr=RR(R,90,100);
  var plate=EP(cx,py,pr,pr*0.24);FS(s,sol,plate);s.push(ellipse(cx,py,pr*0.7,pr*0.16));
  var ds=[[cx-pr*0.45,py-6],[cx+pr*0.4,py-4],[cx,py-26]];if(R()<0.6)ds.push([cx-pr*0.1,py+6]);ds.sort(function(a,b){return b[1]-a[1];});var drawn=[];
  ds.slice().reverse().forEach(function(d,i){var rx=RR(R,30,34),ry=rx*0.5,x=d[0],y=d[1];var out=EP(x,y,rx,ry),hole=EP(x,y-2,rx*0.32,ry*0.3),side=[[x-rx,y]].concat(arc(x,y+6,rx,ry,PI,0)).concat([[x+rx,y]]);
    var g=[];g.push(poly(out));g.push(poly(hole));g.push(side);var ic=[];for(var k=0;k<=36;k++){var a=k/36*TAU,r=0.78+0.08*Math.sin(k*1.7)+(k%5===0?0.12:0);ic.push([x+rx*r*Math.cos(a),y+ry*r*Math.sin(a)+(Math.sin(a)>0?2:0)]);}g.push(ic);
    var spr=[];for(var q=0;q<14;q++){var a2=R()*TAU,r2=RR(R,0.4,0.7);var p=[x+rx*r2*Math.cos(a2),y-2+ry*r2*Math.sin(a2)];spr.push([p,[p[0]+RR(R,-2.4,2.4),p[1]+RR(R,-1.6,1.6)]]);}if(i%2)A(g,spr);else H(g,ic,1.6,30);
    H(g,side.concat([[x+rx,y+6]]),1.3,90);behind(s,g,drawn);drawn.push(out.concat([]),side.slice(0));sol.push(out);});
  var mx=cx+pr+RR(R,10,20);if(mx+30<296){var mug=RP(mx,ty-56,mx+34,ty);FS(s,sol,mug);s.push(ellipse(mx+17,ty-56,17,4));s.push(arc(mx+34,ty-30,10,12,-PI/2,PI/2));H(s,RP(mx+24,ty-52,mx+34,ty),1.4,90);}
  onTable(s,R,ty,sol);return s;});

S('Pea pods',['Shelling on the Step','Nine in a Row','Garden Sweet','Split Along the Seam','Bowl of Green'],function(R){
  var s=[],sol=[],ty=RR(R,166,172);
  function pod(x,y,L,a,open){var p0=[x,y],p1=[x+L*Math.cos(a),y+L*Math.sin(a)];var P=lens(p0,p1,open?14:9);FS(s,sol,P);
    if(open){var inn=lens(lerp(p0,p1,0.06),lerp(p1,p0,0.06),9);s.push(poly(inn));var n=Math.floor(L/12);for(var k=0;k<n;k++){var c=lerp(p0,p1,(k+0.75)/(n+0.5));s.push(circle(c[0],c[1],5));s.push(arc(c[0]+1,c[1]+1,3.4,3.4,0,PI/2));}}
    else{s.push(curve([p0,lerp(p0,p1,0.5).map(function(v,i){return v+(i?3:0);}),p1],6));var bumps=[];H(bumps,lens(p0,p1,9).slice(0,11),1.4,a*180/PI+70);A(s,bumps);}
    s.push(curve([p0,[p0[0]-6*Math.cos(a)-4,p0[1]-8],[p0[0]-10*Math.cos(a)-2,p0[1]-14]],4));}
  pod(RR(R,40,60),ty-60,RR(R,100,120),RR(R,-0.18,-0.04),true);pod(RR(R,70,90),ty-24,RR(R,80,90),RR(R,0.05,0.15),false);pod(RR(R,170,190),ty-96,RR(R,70,80),RR(R,0.3,0.5),false);
  var bx=RR(R,210,230),bowl=[[bx-50,ty-40]].concat(quad([bx-50,ty-40],[bx,ty+8],[bx+50,ty-40],14).slice(1));FS(s,sol,bowl.concat(arc(bx,ty-40,50,9,0,PI).slice(1)));s.push(ellipse(bx,ty-40,50,9));
  var pe=[];for(var k=0;k<14;k++){var a=R()*PI,r=R();pe.push(circle(bx+r*42*Math.cos(a+PI),ty-42+r*6*Math.sin(a+PI),4));}A(s,pe);H(s,bowl.slice(14),1.6,70);
  var tn=[];for(var t=0;t<2;t++){var tx=RR(R,140,200),tyy=ty-RR(R,20,40);tn.push(spiral(tx,tyy,1,8,2,0));tn.push(curve([[tx+8,tyy],[tx+20,tyy+10],[tx+30,tyy+6]],4));}A(s,tn);
  var lf=[];leafL(lf,sol,[RR(R,20,40),ty-6],[RR(R,60,80),ty-30],8,1.6);A(s,lf);
  onTable(s,R,ty,sol);return s;});

S('Tricycle',['Sidewalk Racer','Three Wheels, One Bell','Left by the Gate','Streamers Flying','Saturday Laps'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,166,172),cx=RR(R,130,160),fr=RR(R,30,34),br=RR(R,15,17);
  var fw=[cx+38,gy-fr];spoked(s,sol,fw[0],fw[1],fr,16);var bw=[cx-44,gy-br];spoked(s,sol,bw[0],bw[1],br,10);spoked(s,sol,bw[0]-14,gy-br-3,br,10);
  s.push([[bw[0]-18,bw[1]],[bw[0]+6,bw[1]]]);var fk=[fw[0]-10,gy-fr*2-30];s.push([fw,fk]);s.push([[bw[0],bw[1]-4],[cx-6,gy-fr-24],[fw[0]-6,gy-fr*2-14]]);
  s.push([[fk[0],fk[1]],[fk[0]-8,fk[1]-8],[fk[0]-20,fk[1]-6]]);s.push([[fk[0],fk[1]],[fk[0]+6,fk[1]-10],[fk[0]+18,fk[1]-12]]);
  var gr=[[fk[0]-26,fk[1]-8],[fk[0]-18,fk[1]-4]];s.push(RP(fk[0]-28,fk[1]-10,fk[0]-18,fk[1]-3));s.push(RP(fk[0]+16,fk[1]-15,fk[0]+26,fk[1]-8));
  [[fk[0]-28,fk[1]-6],[fk[0]+26,fk[1]-12]].forEach(function(p,i){var st=[p];for(var t=1;t<=5;t++)st.push([p[0]+(i?1:-1)*t*5,p[1]+t*3+3*Math.sin(t*1.5)]);s.push(st);s.push(st.map(function(q){return [q[0],q[1]+2];}));});
  var seat=[[cx-22,gy-fr-30],[cx-2,gy-fr-30],[cx,gy-fr-26],[cx-24,gy-fr-26]];FS(s,sol,seat);s.push([[cx-12,gy-fr-26],[cx-8,gy-fr-20]]);
  s.push([[fw[0],fw[1]],[fw[0]+8,fw[1]-6],[fw[0]+12,fw[1]-6]]);s.push([[fw[0],fw[1]],[fw[0]-8,fw[1]+6],[fw[0]-12,fw[1]+6]]);s.push(circle(fk[0]+10,fk[1]-14,3));
  // sidewalk, lawn, picket fence, house
  var sw=[];sw.push([[4,gy],[296,gy]]);var sl=[];for(var x=4;x<296;x+=RR(R,30,36))sl.push([[x,gy],[x-8,196]]);A(sw,sl);sw.push([[4,gy+14],[296,gy+14]]);
  var lawn=[];var fy=gy-RR(R,20,26);lawn.push([[4,fy],[296,fy]]);for(var y=fy+4;y<gy;y+=4)lawn.push(tufts(4,296,y,3,R));A(bg,[serp(lawn.slice(1))]);bg.push(lawn[0]);
  bg.push(comb(4,296,fy,RR(R,26,30),9));bg.push([[4,fy-10],[296,fy-10]]);bg.push([[4,fy-20],[296,fy-20]]);
  var hx=RR(R,30,170),hs=[[hx,fy-30],[hx,fy-90],[hx+60,fy-120],[hx+120,fy-90],[hx+120,fy-30]];bg.push(hs);var hh=[];for(var y2=fy-86;y2<fy-30;y2+=5)hh.push([[hx,y2],[hx+120,y2]]);clipIn(bg,[serp(hh)],hs.concat([[hx,fy-30]]),[RP(hx+20,fy-80,hx+44,fy-56),RP(hx+76,fy-80,hx+100,fy-56)]);win(bg,hx+20,fy-80,24,24,0);win(bg,hx+76,fy-80,24,24,0);
  A(bg,sw);behind(s,bg,sol);return sky(s,R,fy-30,sol.concat([RP(4,fy-30,296,196),hs.slice(0)]));});

S('Pull-along duck',['Quack on Wheels','Down the Hallway','String in Hand','Wooden Waddle','Nursery Parade'],function(R){
  var s=[],sol=[],fy=RR(R,128,136),cx=RR(R,120,150),cy=fy+RR(R,22,30);
  var body=blob([[cx-46,cy-20],[cx-30,cy-34],[cx+10,cy-32],[cx+30,cy-24],[cx+36,cy-6],[cx+10,cy+4],[cx-36,cy+2],[cx-56,cy-26]],6);FS(s,sol,body);
  var nk=[[cx+12,cy-30],[cx+18,cy-60],[cx+34,cy-74],[cx+50,cy-68],[cx+52,cy-58],[cx+38,cy-54],[cx+30,cy-26]];var head=blob(nk,5);FS(s,sol,head);var bk=[[cx+50,cy-66],[cx+68,cy-62],[cx+66,cy-56],[cx+51,cy-58]];FS(s,sol,bk,1,0);s.push(circle(cx+40,cy-64,2.4));
  var wg=blob([[cx-30,cy-22],[cx-6,cy-26],[cx+14,cy-16],[cx-6,cy-6],[cx-36,cy-10]],5);s.push(poly(wg));var wl=[];for(var k=0;k<4;k++)wl.push(arc(cx-14+k*4,cy-16,10-k*2,6-k,0.2,PI*0.9));A(s,wl);
  var stripes=[];clipIn(stripes,[zz(cx-60,cx+40,cy-40,cy+6,5)],body,[wg]);A(s,stripes);
  var base=RP(cx-44,cy+2,cx+30,cy+10);FS(s,sol,base,1.6,0);[[cx-32,cy+14],[cx+18,cy+14]].forEach(function(w){var P=EP(w[0],w[1],10,10);FS(s,sol,P);s.push(circle(w[0],w[1],2.6));var sp=[];for(var a=0;a<4;a++){var t=a*PI/2+0.3;sp.push([w[0],w[1]],[w[0]+8*Math.cos(t),w[1]+8*Math.sin(t)],[w[0],w[1]]);}s.push(sp);});
  var str=[[cx+30,cy+6]];for(var t=1;t<=10;t++)str.push([cx+30+t*12,cy+6-t*4+6*Math.sin(t*0.6)]);s.push(curve(str,3));var en=str[str.length-1];s.push(circle(en[0]+4,en[1]-2,4));
  // floorboards, rug, wall with skirting and window
  var rug=EP(cx,cy+18,110,16);var rr=[poly(rug),poly(EP(cx,cy+18,98,11))];var fringe=[];for(var a2=0;a2<TAU;a2+=0.12){var p=[cx+110*Math.cos(a2),cy+18+16*Math.sin(a2)];fringe.push(p,[cx+116*Math.cos(a2),cy+18+18*Math.sin(a2)],p);}rr.push(fringe);behind(s,rr,sol);sol.push(rug);
  var W=RP(RR(R,190,220),20,RR(R,260,280),fy-30);room(s,R,fy,sol.concat([W]),'stripes');s.push(poly(W));s.push([[(W[0][0]+W[1][0])/2,20],[(W[0][0]+W[1][0])/2,fy-30]]);s.push([[W[0][0],(fy-10)/2],[W[1][0],(fy-10)/2]]);H(s,W,6,45);return s;});

S('Windsor chair',['Bow Back by the Hearth','Spindles and Elm','Kitchen Corner Seat','Turned Legs, Saddle Seat','Farmhouse Chair'],function(R){
  var s=[],sol=[],fy=RR(R,128,136),cx=RR(R,130,160),sy=fy+RR(R,4,10),sw=RR(R,40,46);
  var seat=[[cx-sw,sy]].concat(arc(cx,sy,sw,10,PI,0).slice(1)).concat([[cx+sw,sy+6]]).concat(arc(cx,sy+6,sw,10,0,PI).slice(1));FS(s,sol,seat);s.push(ellipse(cx,sy,sw-8,6));H(s,[[cx-sw,sy]].concat(arc(cx,sy+6,sw,10,PI,0)),1.6,90);
  var legs=[[cx-sw+8,sy+12,-1],[cx+sw-8,sy+12,1],[cx-sw+18,sy+8,-0.4],[cx+sw-18,sy+8,0.4]];legs.forEach(function(l){var b=[l[0]+l[2]*12,Math.min(194,sy+64)];var tb=tube([[l[0],l[1]],b],function(u){return 2.4+Math.sin(u*PI*3)*0.8;});FS(s,sol,tb.P);});
  s.push([[cx-sw+4,sy+40],[cx+sw-4,sy+40]]);s.push([[cx-sw+10,sy+40],[cx-sw+18,sy+30]]);s.push([[cx+sw-10,sy+40],[cx+sw-18,sy+30]]);
  var bow=arc(cx,sy-10,sw-6,RR(R,74,82),PI,TAU);var bw=tube(bow,function(){return 2.2;});FS(s,sol,bw.P);var sp=[],d=1,ns=RI(R,7,9);for(var i=1;i<ns;i++){var t=i/ns,x=cx-(sw-6)+2*(sw-6)*t,yt=interpY(bow,x)+2;if(d>0)sp.push([x,sy-2],[x,yt]);else sp.push([x,yt],[x,sy-2]);d=-d;}s.push(sp);
  var arms=[[cx-sw,sy-26],[cx-sw-10,sy-28],[cx-sw-12,sy-24],[cx-sw+4,sy-22]];s.push(arms);s.push([[cx-sw-6,sy-24],[cx-sw-4,sy+2]]);s.push([[cx+sw,sy-26],[cx+sw+10,sy-28],[cx+sw+12,sy-24],[cx+sw-4,sy-22]]);s.push([[cx+sw+6,sy-24],[cx+sw+4,sy+2]]);
  var cush=[[cx-sw+10,sy-2],[cx+sw-10,sy-2],[cx+sw-14,sy+4],[cx-sw+14,sy+4]];s.push(cush);
  var rug=EP(cx,sy+66,90,12);var rr=[poly(rug)];for(var k=1;k<4;k++)rr.push(ellipse(cx,sy+66,90-k*14,12-k*2.6));behind(s,rr,sol);sol.push(rug);
  var hx=fx(cx);function fx(x){return x>150?RR(R,20,60):RR(R,230,270);}var hearth=RP(hx-26,fy-70,hx+26,fy);s.push(poly(hearth));var fp=archP(hx,fy,16,24);s.push(fp);H(s,fp.concat([[hx-16,fy]]),1.2,0);s.push(rect(hx-32,fy-76,hx+32,fy-70));
  room(s,R,fy,sol.concat([hearth,RP(hx-32,fy-76,hx+32,fy-70)]),'diag');return s;});

S('Dressing table with mirror',['Before the Evening Out','Oval Glass','Powder and Comb','Three Drawers Deep','Morning Light Vanity'],function(R){
  var s=[],sol=[],fy=RR(R,166,172),cx=RR(R,130,170),tw=RR(R,70,78),tt=fy-RR(R,64,70);
  var top=RP(cx-tw-4,tt-6,cx+tw+4,tt);FS(s,sol,top);[-1,1].forEach(function(d){var ped=RP(d<0?cx-tw:cx+tw-34,tt,d<0?cx-tw+34:cx+tw,fy-6);FS(s,sol,ped);for(var k=0;k<3;k++){var y=tt+4+k*((fy-tt-12)/3);s.push(rect(ped[0][0]+4,y,ped[1][0]-4,y+(fy-tt-12)/3-4));s.push(circle((ped[0][0]+ped[1][0])/2,y+(fy-tt-12)/6-2,1.8));}
    s.push([[ped[0][0]+3,fy-6],[ped[0][0]+5,fy]]);s.push([[ped[1][0]-3,fy-6],[ped[1][0]-5,fy]]);});
  var dr=RP(cx-tw+34,tt,cx+tw-34,tt+14);s.push(poly(dr));s.push(circle(cx,tt+7,1.8));H(s,RP(cx-tw+34,tt+14,cx+tw-34,tt+40),2,0);
  var my=tt-RR(R,56,62),mr=EP(cx,my,RR(R,36,40),RR(R,46,50)),mi=EP(cx,my,RR(R,30,34),RR(R,40,44));FS(s,sol,mr);s.push(poly(mi));HX(s,[mr,mi],1.2,40);var refl=[];H(refl,mi,RR(R,6,7),RR(R,50,60));var cut=[];clipIn(cut,refl,mi,[EP(cx-10,my-14,8,14)]);A(s,cut);
  s.push([[cx-6,tt-6],[cx-6,my+44]]);s.push([[cx+6,tt-6],[cx+6,my+44]]);
  var items=[];var bx=cx-tw+14;var bot=[[bx-6,tt-6],[bx-6,tt-24],[bx-2,tt-30],[bx-2,tt-36],[bx+2,tt-36],[bx+2,tt-30],[bx+6,tt-24],[bx+6,tt-6]];FS(s,sol,bot,1.6,90);s.push(circle(bx,tt-40,4));
  var pw=cx+tw-22;var box=[[pw-12,tt-6],[pw-12,tt-14]].concat(arc(pw,tt-14,12,4,PI,TAU).slice(1)).concat([[pw+12,tt-6]]);FS(s,sol,box);s.push(ellipse(pw,tt-14,12,3));
  var comb2=[];for(var c=0;c<10;c++){comb2.push([cx-tw+36+c*2.4,tt-6],[cx-tw+37+c*2.4,tt-10]);}s.push(comb2);
  var stool=RP(cx-24,fy-30,cx+24,fy-24);FS(s,sol,stool,1.6,0);s.push([[cx-20,fy-24],[cx-22,fy]]);s.push([[cx+20,fy-24],[cx+22,fy]]);var cu=[[cx-24,fy-30]].concat(arc(cx,fy-30,24,6,PI,TAU).slice(1));FS(s,sol,cu.concat([[cx-24,fy-30]]).slice(0,-1),1.4,0);
  room(s,R,fy,sol,pick(R,['stripes','diag']));return s;});


// ---- Daily Super Sketch: an interior (an old apothecary shop, no sky) ----
function jar(s,sol,R,x,b,w,h,kind){var P;
  if(kind===0){P=[[x-w,b],[x-w,b-h],[x-w-1,b-h],[x-w-1,b-h-4],[x+w+1,b-h-4],[x+w+1,b-h],[x+w,b-h],[x+w,b]];SOL(s,sol,P);s.push([[x+w,b-h*0.35],[x-w+2,b-h*0.35],[x-w+2,b-h*0.7],[x+w,b-h*0.7]]);}
  else if(kind===1){var r=w*1.1;P=[[x-3,b-h-4],[x-2.2,b-h]].concat(arc(x,b-r,r,r,-PI/2-0.22,-PI/2-TAU+0.22)).concat([[x+2.2,b-h],[x+3,b-h-4]]);SOL(s,sol,P);H(s,arc(x,b-r,r,r,0.25,PI-0.25),1.2,0);}
  else if(kind===2){P=[[x-w,b],[x-w,b-h*0.6],[x-2,b-h*0.8],[x-2,b-h],[x-3,b-h-4],[x+3,b-h-4],[x+2,b-h],[x+2,b-h*0.8],[x+w,b-h*0.6],[x+w,b]];SOL(s,sol,P);H(s,[[x,b-h*0.7],[x+w,b-h*0.6],[x+w,b],[x,b]],1.2,90);}
  else{P=[[x-w,b]].concat(arc(x,b-h*0.5,w,h*0.5,PI,TAU).slice(1)).concat([[x+w,b]]);SOL(s,sol,P);}
  return P;}
var MASTER={name:'Old apothecary shop',titles:['Remedies on the Shelf','The Chemist\'s Counter','Tinctures and Tonics','Brass Scales at Noon','Bottles to the Ceiling'],build:function(R){
  var s=[],sol=[],fy=RR(R,176,182),sx0=RR(R,12,20),sx1=RR(R,280,288),ct=RR(R,118,124),cx0=RR(R,52,64),cx1=RR(R,236,248);
  // counter
  var ctop=RP(cx0-6,ct-5,cx1+6,ct);FS(s,sol,ctop,1.6,0);var cfront=RP(cx0,ct,cx1,fy-2);FS(s,sol,cfront);var np=RI(R,4,5),pw=(cx1-cx0)/np;
  for(var i=0;i<np;i++){var x=cx0+i*pw;s.push(rect(x+5,ct+8,x+pw-5,fy-10));s.push(rect(x+9,ct+12,x+pw-9,fy-14));H(s,RP(x+9,ct+12,x+pw-9,fy-14),RR(R,3.2,3.8),RR(R,30,60));H(s,RP(x+pw-9,ct+12,x+pw-5,fy-10),1.2,90);}
  s.push(rect(cx0-4,fy-4,cx1+4,fy));
  // things on the counter: scales, mortar, show globes, ledger, bell
  var scx=RR(R,130,170),sb=ct-5;s.push(RP(scx-14,sb-4,scx+14,sb));s.push([[scx,sb-4],[scx,sb-56]]);s.push(circle(scx,sb-58,2.4));var bm=[[scx-34,sb-52],[scx+34,sb-50]];s.push(bm);
  [-1,1].forEach(function(d){var px=scx+d*34,py=sb-51+d;s.push([[px,py],[px-9,py+22]]);s.push([[px,py],[px+9,py+22]]);var pan=[[px-12,py+22]].concat(arc(px,py+22,12,5,PI,0).reverse().map(function(p){return [p[0],2*(py+22)-p[1]];})).concat([[px-12,py+22]]);var pn=[[px-12,py+22]].concat(arc(px,py+22,12,6,PI,0).slice(1).reverse().reverse());FS(s,sol,[[px-12,py+22],[px+12,py+22],[px+6,py+27],[px-6,py+27]],1,0);});
  s.push([[scx-4,sb-50],[scx,sb-60],[scx+4,sb-50]]);
  var mx=scx+RR(R,46,56),mort=[[mx-14,sb-16]].concat(quad([mx-14,sb-16],[mx-12,sb],[mx,sb],8).slice(1)).concat(quad([mx,sb],[mx+12,sb],[mx+14,sb-16],8).slice(1));FS(s,sol,mort);s.push(ellipse(mx,sb-16,14,3));H(s,mort.slice(8),1.2,70);s.push([[mx-4,sb-16],[mx+10,sb-34],[mx+14,sb-32],[mx+2,sb-16]]);
  var gl=[cx0+RR(R,16,22),cx1-RR(R,16,22)];gl.forEach(function(gx,i){var gr=RR(R,13,16),gb=sb,P=[[gx-3,gb-gr*2-26],[gx-3,gb-gr*2+1]].concat(arc(gx,gb-gr,gr,gr,-PI/2-0.2,-PI/2-TAU+0.2)).concat([[gx+3,gb-gr*2+1],[gx+3,gb-gr*2-26]]);FS(s,sol,P);
    s.push(arc(gx,gb-gr*2-30,5,5,0,TAU));s.push(rect(gx-8,gb-2,gx+8,gb));var lq=[];H(lq,arc(gx,gb-gr,gr,gr,-0.3+(i?0.4:0),PI+0.3-(i?0.4:0)),1.1,i?45:0);A(s,lq);});
  var lx=scx-RR(R,50,60),led=[[lx-22,sb],[lx-20,sb-6],[lx,sb-4],[lx+20,sb-6],[lx+22,sb]];s.push(led);s.push([[lx,sb-4],[lx,sb]]);var lines=[];for(var l=0;l<3;l++)lines.push([[lx-17,sb-4+l*1.2-0.5],[lx-4,sb-3+l*1.2-0.5]]);A(s,lines);s.push([[lx+6,sb-12],[lx+14,sb-5]]);
  // shelving: frame, shelves and the jars on them
  var stp=RR(R,22,26),rows=4,rh=(ct-10-stp)/rows;var frame=[[sx0,fy],[sx0,stp-6],[sx1,stp-6],[sx1,fy]];s.push(frame);s.push(rect(sx0-4,stp-12,sx1+4,stp-6));
  var shelfJ=[];for(var r=0;r<rows;r++){var by=stp+(r+1)*rh;s.push([[sx0,by],[sx1,by]]);s.push([[sx0,by+3],[sx1,by+3]]);
    var x=sx0+RR(R,4,8);while(x<sx1-14){var k=RI(R,0,3),w=k===1?RR(R,6,8):RR(R,6,9),h=Math.min(rh-8,k===1?RR(R,22,28):RR(R,16,rh-8));if(x+2*w>sx1-4)break;
      if(r>=2&&x>cx0-14&&x<cx1+4){x+=2*w+3;continue;}var P=jar(s,sol,R,x+w,by,w,h,k);shelfJ.push(P);x+=2*w+RR(R,2,5);}}
  // drawer cabinet low at the sides (under the bottom shelf, beside the counter)
  var db=stp+rows*rh+3,dc=[];[[sx0,cx0-10],[cx1+10,sx1]].forEach(function(q){if(q[1]-q[0]<16)return;var D=RP(q[0],db,q[1],fy);s.push(poly(D));var nr=RI(R,4,5),nc=Math.max(1,Math.round((q[1]-q[0])/18)),dh=(fy-db)/nr,dw=(q[1]-q[0])/nc;var g=[];for(var j=1;j<nr;j++)g.push([[q[0],db+j*dh],[q[1],db+j*dh]]);for(var c=1;c<nc;c++)g.push([[q[0]+c*dw,db],[q[0]+c*dw,fy]]);A(s,g);
    var dh2=[];H(dh2,D,4.5,90);behind(s,dh2,[]);sol.push(D);});
  // rolling ladder against the shelves
  var lxp=R()<0.5?RR(R,cx0+10,cx0+30):RR(R,cx1-40,cx1-20),lt=[lxp-14,stp-8],lb=[lxp+18,ct-6];s.push([[lt[0]-6,stp-9],[lt[0]+14,stp-9]]);var lad=[[lt[0]-4,lt[1]],[lb[0]-4,lb[1]]],lad2=[[lt[0]+8,lt[1]],[lb[0]+8,lb[1]]];s.push(lad);s.push(lad2);for(var u=1;u<9;u++){var t=u/9;s.push([lerp(lad[0],lad[1],t),lerp(lad2[0],lad2[1],t)]);}
  // hanging herbs from the cornice
  var nh=RI(R,5,7);for(var hb=0;hb<nh;hb++){var hx=sx0+20+hb*(sx1-sx0-40)/(nh-1)+RR(R,-6,6),hy=stp-6,L=RR(R,14,20);s.push([[hx,hy],[hx,hy+6]]);s.push(raceme(hx,hy+6,L,5,R));}
  // back boards of the shelving, kept behind the jars
  var bk=[];var bb=[];for(var xx=sx0+6;xx<sx1;xx+=RR(R,9,10))bb.push([[xx,stp-6],[xx,stp+rows*rh]]);bk.push(serp(bb));var shelfBoards=[];for(var r2=0;r2<rows;r2++){var y2=stp+(r2+1)*rh;shelfBoards.push(RP(sx0,y2,sx1,y2+3));}
  behind(s,bk,sol.concat(shelfBoards).concat([ctop,cfront]));
  // floor tiles in front, and the wall/ceiling around the shelving
  var fl=[];floorS(fl,R,fy,RI(R,16,20));behind(s,fl,sol);var wl=[];H(wl,RP(4,4,296,stp-12),RR(R,3.4,4),0);behind(s,wl,sol);
  var dot=[];return s.filter(function(st){return st&&st.length>1;});}};


return {number:9,startedOn:"2026-11-19",notes:"Batch 9 (Nov 19). Review of Nov 17-18 plays: Coral reef held its 20 minutes - fan coral, fish and kelp all read. Strong: gabled canal houses, round barn, bookcase, stupa, farmhouse porch, steel truss bridge, dumpling steamer, moon gate, luna moth. Weak: rhinoceros, moose, kangaroo and llama stiff or muddled; swordfish had a long connector; pinwheel, poppies and slot canyon unreadable; corn on the cob looked like bugs; lunar rover, fiddleheads and pussy willow too sparse. Lessons kept: one line, keep extras touching; clip backgrounds with behind()/clipIn(); fill the frame; animals need a bold plain polygon silhouette (blob smoothing turns legs to mush) with one shaded side; one-stroke zigzags keep the planner fast; keep stroke counts low (masters under ~250). New: leafL(), spikes(), fan(), horse(), spoked(), jar(). Daily Super Sketch: Old apothecary shop, an interior (type 1); previous two were Allotment gardens from above (type 3) and Coral reef (type 4).",master:MASTER||undefined,subjects:SUBJ};
})();
