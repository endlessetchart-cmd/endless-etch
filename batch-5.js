// Endless Etch — batch 5. 48 subjects for 2026-11-15 (each plays about three times, shuffled per round) plus the Daily Super Sketch.
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

// ---- chunk A: buildings, places, trees ----
S('Greek temple ruins',['Six Columns Left','Marble at Noon','After the Gods','Stylobate and Sky','Doric Afternoon'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,160,166),x0=RR(R,58,74),x1=x0+RR(R,160,176);
  for(var i=0;i<3;i++){var P=RP(x0-14+i*5,gy-i*6,x1+14-i*5,gy-(i+1)*6);SOL(s,sol,P);H(s,P,RR(R,3.4,4),90);}
  var top=gy-18,n=RI(R,6,7),cw=11,ch=RR(R,66,76),step=(x1-x0-cw)/(n-1),keep=RI(R,3,4);
  for(var c=0;c<n;c++){var cx=x0+c*step,full=c<keep,h=full?ch:ch*RR(R,0.3,0.85),st=top-h+(full?7:0),sh;
    if(full){sh=RP(cx,top,cx+cw,st);var cap=RP(cx-2.5,st,cx+cw+2.5,st-7);SOL(s,sol,cap);H(s,cap,1.6,0);}
    else sh=[[cx,top],[cx,st],[cx+3,st-RR(R,1,4)],[cx+6,st+RR(R,0,3)],[cx+8.5,st-RR(R,1,4)],[cx+cw,st+1],[cx+cw,top]];
    SOL(s,sol,sh);[3,5.5,8].forEach(function(f){s.push([[cx+f,top],[cx+f,st+3]]);});
    H(s,RP(cx+cw-3,top,cx+cw,st+3),1.4,0);}
  var ex0=x0-4,ex1=x0+(keep-1)*step+cw+4,ey=top-ch;var arc1=RP(ex0,ey,ex1,ey-9);SOL(s,sol,arc1);
  var fr=RP(ex0,ey-9,ex1,ey-19);SOL(s,sol,fr);for(var x=ex0+5;x<ex1-3;x+=10){H(s,RP(x,ey-9,x+4,ey-19),1.2,90);}
  var ped=[[ex0-3,ey-19],[(ex0+ex1)/2,ey-19-RR(R,20,26)],[ex1+3,ey-19]];SOL(s,sol,ped);H(s,ped,RR(R,2.6,3.2),RR(R,20,40));
  for(var d=0;d<RI(R,2,3);d++){var dx=RR(R,x0+keep*step,x1),dy=gy+RR(R,10,22),L=RR(R,16,22);var D=RP(dx-L/2,dy-9,dx+L/2,dy);SOL(s,sol,D);s.push(ellipse(dx+L/2,dy-4.5,3,4.5));H(s,D,1.8,0);}
  var cx2=R()<0.5?x0-36:x1+36;cypress(s,sol,cx2,gy,RR(R,80,95),RR(R,9,12),2,70);cypress(s,sol,cx2+(cx2<150?-16:16),gy,RR(R,55,70),RR(R,7,9),2,70);
  hills(bg,R,gy-6,RR(R,22,34),RR(R,4.6,5.8),[],RR(R,8,20));gnd(bg,R,gy);
  return fin(s,R,bg,sol,gy-10);});

S('Village church with steeple',['Evensong Lane','Bells at Nine','The Parish Green','Spire Over the Elms','Sunday, Early'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,160,166),tw=RR(R,32,38),tx=RR(R,60,80),th=RR(R,82,96),nx=tx+tw,nw=RR(R,110,124),nh=RR(R,40,46);
  var T=RP(tx,gy,tx+tw,gy-th);SOL(s,sol,T);
  var door=archP(tx+tw/2,gy,6,14),bel=archP(tx+tw/2,gy-th+34,6,10),clk=EP(tx+tw/2,gy-th+50,6,6);s.push(poly(door));s.push(poly(bel));s.push(poly(clk));
  H(s,door,1.8,90);H(s,bel,2,0);s.push([[tx+tw/2,gy-th+50],[tx+tw/2,gy-th+46]],[[tx+tw/2,gy-th+50],[tx+tw/2+3.5,gy-th+51]]);
  clipIn(s,[brickS(tx,gy-th,tx+tw,gy,RR(R,8,10),RR(R,5.5,6.5))],T,[door,bel,clk]);
  var sp=RR(R,48,60),SP=[[tx-3,gy-th],[tx+tw/2,gy-th-sp],[tx+tw+3,gy-th]];SOL(s,sol,SP);H(s,[[tx+tw/2,gy-th-sp],[tx+tw+3,gy-th],[tx+tw/2,gy-th]],1.7,RR(R,55,70));
  s.push([[tx+tw/2,gy-th-sp],[tx+tw/2,gy-th-sp-10]],[[tx+tw/2-4,gy-th-sp-6],[tx+tw/2+4,gy-th-sp-6]]);
  var N=RP(nx,gy,nx+nw,gy-nh);SOL(s,sol,N);var rf=[[nx,gy-nh],[nx+8,gy-nh-RR(R,26,32)],[nx+nw-10,gy-nh-RR(R,26,32)],[nx+nw+6,gy-nh]];SOL(s,sol,rf);H(s,rf,RR(R,2.4,2.9),0);
  var nwn=RI(R,3,4);for(var i=0;i<nwn;i++){var wx=nx+nw*(i+0.6)/(nwn+0.2),G=gothic(wx,gy-12,4.5,12);s.push(poly(G));H(s,G,1.6,90);}
  H(s,RP(nx+nw-14,gy,nx+nw,gy-nh),RR(R,2.2,2.8),0);
  for(var k=0;k<RI(R,3,5);k++){var hx=nx+nw+RR(R,10,60);if(hx>286)break;var hs=archP(hx,gy+RR(R,4,14),3.5,RR(R,4,7));s.push(poly(hs));sol.push(hs);}
  treeR(s,R,tx-RR(R,26,36),gy,RR(R,14,18),2.4);
  s.push(comb(nx+nw+4,292,gy-2,7,5));s.push([[nx+nw+4,gy-6],[292,gy-6]]);
  hills(bg,R,gy-4,RR(R,18,28),RR(R,4.6,5.6),[],RR(R,8,18));gnd(bg,R,gy);
  return fin(s,R,bg,sol,gy-8);});

S('Tudor timber-framed house',['Black and White Lane','Leaded Panes','Jetty Over the Street','Oak Bones','Market Town, 1580'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,162,168),hw=RR(R,118,132),hx=150-hw/2+RR(R,-20,20),f1=RR(R,36,40),f2=RR(R,34,38),j=5,rh=RR(R,44,52);
  var G=RP(hx,gy,hx+hw,gy-f1),U=RP(hx-j,gy-f1,hx+hw+j,gy-f1-f2);SOL(s,sol,G);SOL(s,sol,U);
  var gab=[[hx-j-6,gy-f1-f2],[hx+hw/2,gy-f1-f2-rh],[hx+hw+j+6,gy-f1-f2]];SOL(s,sol,gab);s.push([[hx-j-1,gy-f1-f2],[hx+hw/2,gy-f1-f2-rh+5],[hx+hw+j+1,gy-f1-f2]]);
  var b=hw/6;function post(x,y0,y1){s.push(rect(x-1.5,y0,x+1.5,y1));H(s,RP(x-1.5,y0,x+1.5,y1),1.1,0);}
  for(var i=0;i<=6;i++){post(hx+i*b,gy,gy-f1);post(hx-j+i*(hw+2*j)/6,gy-f1,gy-f1-f2);}
  H(s,RP(hx-j,gy-f1,hx+hw+j,gy-f1-3),1,0);
  [0,5].forEach(function(k){win(s,hx+k*b+3,gy-f1+8,b-6,16);H(s,RP(hx+k*b+3,gy-f1+8,hx+k*b+b-3,gy-f1+24),2.6,-45);});
  var dr=RP(hx+2.5*b-6,gy,hx+2.5*b+6,gy-26);s.push(poly(dr));H(s,dr,1.8,90);win(s,hx+3*b+6,gy-f1+8,b*1.5,16);
  var ub=(hw+2*j)/6;for(var k2=0;k2<6;k2++){var x0=hx-j+k2*ub,yb=gy-f1,yt=gy-f1-f2;
    if(k2===1||k2===4){win(s,x0+3,yt+7,ub-6,16);H(s,RP(x0+3,yt+7,x0+ub-3,yt+23),2.6,45);}
    else{if(R()<0.5)s.push([[x0,yb],[x0+ub,yt]]);else s.push([[x0,yt],[x0+ub,yb]]);s.push([[x0,(yb+yt)/2],[x0+ub,(yb+yt)/2]]);}}
  var cx=hx+hw/2;post(cx,gy-f1-f2,gy-f1-f2-rh+8);s.push([[cx-rh*0.5,gy-f1-f2],[cx,gy-f1-f2-rh*0.45]],[[cx+rh*0.5,gy-f1-f2],[cx,gy-f1-f2-rh*0.45]]);
  win(s,cx-24,gy-f1-f2-20,14,12);win(s,cx+10,gy-f1-f2-20,14,12);
  var chx=hx+hw*RR(R,0.12,0.22),ch=RP(chx,gy-f1-f2-rh*0.4,chx+10,gy-f1-f2-rh-14);SOL(s,sol,ch);H(s,ch,2.2,0);
  s.push([[hx+2.5*b-6,gy],[hx+2.5*b-20,196]],[[hx+2.5*b+6,gy],[hx+2.5*b+20,196]]);
  for(var t=0;t<2;t++){var tx=t?hx+hw+RR(R,22,34):hx-RR(R,22,34);if(tx>12&&tx<288)treeR(s,R,tx,gy,RR(R,12,16),2.4);}
  hills(bg,R,gy-4,RR(R,16,26),RR(R,5,6),[],RR(R,8,18));gnd(bg,R,gy);
  return fin(s,R,bg,sol,gy-8);});

S('Japanese tea house',['Steam and Stillness','Stepping Stones','Paper Screens at Dusk','Maple by the Veranda','One Bowl, Slowly'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,156,162),hw=RR(R,110,124),hx=RR(R,90,110),wh=RR(R,36,42),ph=6;
  var plat=RP(hx-10,gy,hx+hw+10,gy-ph);SOL(s,sol,plat);H(s,plat,1.6,0);
  for(var k=0;k<4;k++){var px=hx-6+k*(hw+12)/3;s.push([[px,gy],[px,gy+5]]);}
  var W=RP(hx,gy-ph,hx+hw,gy-ph-wh);SOL(s,sol,W);
  var n=RI(R,4,5),bw=hw/n;for(var i=1;i<n;i++)s.push([[hx+i*bw,gy-ph],[hx+i*bw,gy-ph-wh]]);
  for(var i2=0;i2<n;i2++){var x0=hx+i2*bw;for(var gx=1;gx<3;gx++)s.push([[x0+gx*bw/3,gy-ph-4],[x0+gx*bw/3,gy-ph-wh+4]]);for(var gyy=gy-ph-8;gyy>gy-ph-wh+4;gyy-=8)s.push([[x0+1,gyy],[x0+bw-1,gyy]]);}
  var oh=RR(R,16,22),rt=gy-ph-wh-RR(R,32,38),eave=gy-ph-wh;
  var roof=[[hx-oh,eave+4]].concat(quad([hx-oh,eave+4],[hx-oh*0.2,eave-2],[hx+12,rt],10)).concat([[hx+hw-12,rt]]).concat(quad([hx+hw-12,rt],[hx+hw+oh*0.2,eave-2],[hx+hw+oh,eave+4],10));
  SOL(s,sol,roof);H(s,roof,RR(R,2.2,2.7),0);s.push([[hx+8,rt-5],[hx+hw-8,rt-5],[hx+hw-12,rt],[hx+12,rt]]);
  for(var st=0;st<5;st++){var sx=hx+hw*0.3-st*RR(R,12,16),sy=gy+8+st*7;if(sx<10)break;var E=EP(sx,sy,5,2.2);s.push(poly(E));sol.push(E);}
  var lx=hx+hw+RR(R,24,36);s.push(rect(lx-2,gy,lx+2,gy-24));var LB=RP(lx-6,gy-24,lx+6,gy-36);SOL(s,sol,LB);H(s,RP(lx-3,gy-27,lx+3,gy-33),1.2,0);
  s.push([[lx-9,gy-36],[lx,gy-43],[lx+9,gy-36],[lx-9,gy-36]]);s.push(rect(lx-5,gy,lx+5,gy-3));
  var mx=hx-RR(R,30,42);s.push(curve([[mx,gy],[mx+2,gy-20],[mx-4,gy-38],[mx+6,gy-54]],6));var cr=scallop(mx,gy-62,RR(R,22,28),RR(R,16,20),RI(R,9,12),0.18);s.push(cr);sol.push(cr);H(s,cr.slice(0,-1),RR(R,2.6,3.2),RR(R,30,60));
  for(var b2=0;b2<RI(R,3,5);b2++){var bx=hx+hw+RR(R,6,60);if(bx>290)continue;s.push(scallop(bx,gy-3,RR(R,6,9),3,5,0.2));}
  var pond=EP(RR(R,200,240),gy+RR(R,18,24),RR(R,34,44),RR(R,6,8));s.push(poly(pond));sol.push(pond);H(s,pond,2,0);
  hills(bg,R,gy-8,RR(R,26,40),RR(R,4.4,5.6),[],RR(R,8,20));gnd(bg,R,gy,RR(R,4.2,5),RR(R,6,14));
  return fin(s,R,bg,sol,gy-10);});

S('Gothic cathedral facade',['Rose Window West','Twin Towers at Vespers','Flying Stone','Portal of Saints','Pilgrims\' First Sight'],function(R){
  var s=[],sol=[],gy=RR(R,176,182),cx=150+RR(R,-14,14),tw=RR(R,40,46),nw=RR(R,52,58),th=RR(R,128,140),nh=RR(R,96,106);
  var L=RP(cx-nw/2-tw,gy,cx-nw/2,gy-th),Rt=RP(cx+nw/2,gy,cx+nw/2+tw,gy-th),N=RP(cx-nw/2,gy,cx+nw/2,gy-nh);SOL(s,sol,L);SOL(s,sol,Rt);SOL(s,sol,N);
  var gab=[[cx-nw/2,gy-nh],[cx,gy-nh-RR(R,26,32)],[cx+nw/2,gy-nh]];SOL(s,sol,gab);H(s,gab,2,RR(R,-20,20));
  var rose=EP(cx,gy-nh+24,15,15);s.push(poly(rose));s.push(circle(cx,gy-nh+24,5));for(var k=0;k<12;k++){var a=k*TAU/12;s.push([[cx+5*Math.cos(a),gy-nh+24+5*Math.sin(a)],[cx+15*Math.cos(a),gy-nh+24+15*Math.sin(a)]]);}
  for(var k2=0;k2<12;k2++){var a2=(k2+0.5)*TAU/12;s.push(circle(cx+11*Math.cos(a2),gy-nh+24+11*Math.sin(a2),1.8));}
  var P=gothic(cx,gy,13,26);s.push(poly(P));H(s,P,1.6,90);s.push(gothic(cx,gy,17,26));s.push(gothic(cx,gy,21,26));
  [cx-nw/2-tw/2,cx+nw/2+tw/2].forEach(function(x){var D=gothic(x,gy,8,18);s.push(poly(D));H(s,D,1.6,90);s.push(gothic(x,gy,11,18));
    for(var lv=0;lv<2;lv++){var by=gy-56-lv*36,G1=gothic(x-7,by,4,14),G2=gothic(x+7,by,4,14);s.push(poly(G1),poly(G2));H(s,G1,1.4,90);H(s,G2,1.4,90);s.push([[x-tw/2,by+3],[x+tw/2,by+3]]);}
    s.push(merlons(x-tw/2,x+tw/2,gy-th,4,5.5));
    for(var p=0;p<2;p++){var px=x-tw/2+(p?tw-3:3);s.push([[px,gy-th],[px,gy-th-12],[px+(p?-2:2),gy-th-18]]);}});
  s.push(merlons(cx-nw/2,cx+nw/2,gy-nh+4,3,4));
  var gal=gy-nh+50;s.push([[cx-nw/2,gal],[cx+nw/2,gal]]);for(var g=cx-nw/2+5;g<cx+nw/2-2;g+=7){var A1=archP(g+2,gal+12,2.5,6);s.push(A1);}s.push([[cx-nw/2,gal+12],[cx+nw/2,gal+12]]);
  H(s,RP(cx+nw/2+tw-10,gy-30,cx+nw/2+tw,gy-th),RR(R,2.2,2.6),0);
  [cx-nw/2-tw-RR(R,26,40),cx+nw/2+tw+RR(R,26,40)].forEach(function(x){if(x>14&&x<286)treeR(s,R,x,gy,RR(R,14,18),2.6);});
  for(var f=0;f<5;f++){var yy=gy+3+f*3.2;s.push(f%2?[[296,yy],[4,yy]]:[[4,yy],[296,yy]]);}
  return sky(s,R,gy-4,sol);});

S('Brick factory with smokestacks',['Shift Change','Sawtooth Roofline','Three Chimneys, Monday','Mill Town','Steam and Soot'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,164,170),fx=RR(R,36,50),fw=RR(R,170,190),fh=RR(R,46,54),nt=RI(R,5,6),tw=fw/nt;
  var B=RP(fx,gy,fx+fw,gy-fh);SOL(s,sol,B);
  var saw=[[fx,gy-fh]];for(var i=0;i<nt;i++){saw.push([fx+i*tw,gy-fh-RR(R,16,18)],[fx+(i+1)*tw,gy-fh]);H(s,[[fx+i*tw,gy-fh],[fx+i*tw,gy-fh-16],[fx+i*tw+5,gy-fh-13],[fx+i*tw+5,gy-fh]],1.3,0);}
  s.push(saw);sol.push(saw.concat([[fx+fw,gy-fh]]));
  var wins=[];var nw=RI(R,6,8);for(var w=0;w<nw;w++){var wx=fx+8+w*(fw-16)/nw,P=archP(wx+(fw-16)/nw/2-4,gy-14,(fw-16)/nw/2-4,14);wins.push(P);s.push(poly(P));s.push([[wx+(fw-16)/nw/2-4,gy-14],[wx+(fw-16)/nw/2-4,gy-14-14-((fw-16)/nw/2-4)]]);}
  clipIn(s,[brickS(fx,gy-fh,fx+fw,gy,RR(R,12,14),RR(R,5.4,6.2))],B,wins.map(function(P){return P;}));
  var ns=RI(R,2,3);for(var c=0;c<ns;c++){var sx=fx+fw*(0.15+c*0.35)+RR(R,-6,6),sh=RR(R,60,80),St=[[sx-6,gy-fh-14],[sx-4,gy-fh-14-sh],[sx+4,gy-fh-14-sh],[sx+6,gy-fh-14]];SOL(s,sol,St);
    H(s,St,RR(R,4,5),0);var cap=RP(sx-6,gy-fh-14-sh,sx+6,gy-fh-18-sh);SOL(s,sol,cap);
    for(var t=0;t<4;t++){var pr=4+t*1.6,pxx=sx+(t*9+3)*(c%2?-1:1),pyy=gy-fh-20-sh-pr-t*7;var C=scallop(pxx,pyy,pr,pr*0.8,6,0.2);s.push(C);sol.push(C.slice(0,-1));if(t<2)H(s,C.slice(0,-1),1.8,40);}}
  var tk=RP(fx+fw+8,gy,fx+fw+30,gy-40);if(fx+fw+30<294){cyl(s,fx+fw+19,gy,11,38,1.6,1);sol.push(RP(fx+fw+8,gy,fx+fw+30,gy-41));}
  for(var r=0;r<2;r++){var yy=gy+10+r*6;s.push([[4,yy],[296,yy]]);}for(var x=8;x<296;x+=7)s.push([[x,gy+8],[x,gy+18]]);
  gnd(bg,R,gy,RR(R,4,5));hills(bg,R,gy-2,RR(R,12,20),0);
  return fin(s,R,bg,sol,gy-6);});

S('Mountain refuge hut',['Last Shelter Below','Rope and Stone','Crampons on the Porch','Above the Treeline','Hut Book Signed'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,160,166),hx=RR(R,120,150),hw=RR(R,62,72),wh=RR(R,26,30);
  var peaks=[[4,gy-40]];var n=RI(R,3,4);for(var i=0;i<n;i++){var x=4+(i+0.5)*292/n+RR(R,-15,15);peaks.push([x-25,gy-RR(R,60,80)],[x,gy-RR(R,110,140)],[x+25,gy-RR(R,70,90)]);}peaks.push([296,gy-50]);
  bg.push(peaks);for(var j=1;j<peaks.length-1;j+=3){var p=peaks[j+1];if(!p)break;H(bg,[peaks[j],p,[p[0]+20,gy-20],[p[0]-10,gy-20]],RR(R,2.4,3),RR(R,50,70));}
  H(bg,peaks.concat([[296,gy-10],[4,gy-10]]),RR(R,6,7),RR(R,-30,-15));
  var W=RP(hx,gy,hx+hw,gy-wh);SOL(s,sol,W);var sw=[];for(var yy=gy-5;yy>gy-wh;yy-=5)sw.push(yy);
  var stones=[];sw.forEach(function(yy,k){var q=[[hx,yy]];for(var xx=hx+RR(R,4,8);xx<hx+hw;xx+=RR(R,6,10))q.push([xx,yy+RR(R,-0.8,0.8)]);q.push([hx+hw,yy]);stones.push(q);for(var xx2=hx+RR(R,3,9);xx2<hx+hw-2;xx2+=RR(R,7,11))stones.push([[xx2,yy],[xx2,yy+5]]);});
  var dr=RP(hx+8,gy,hx+20,gy-20),w1=RP(hx+30,gy-18,hx+42,gy-9),w2=RP(hx+50,gy-18,hx+62,gy-9);[dr,w1,w2].forEach(function(P){s.push(poly(P));});H(s,dr,1.6,90);win(s,hx+30,gy-18,12,9);win(s,hx+50,gy-18,12,9);
  clipIn(s,stones,W,[dr,w1,w2]);
  var rt=gy-wh-RR(R,24,30),roof=[[hx-8,gy-wh+2],[hx+hw/2,rt],[hx+hw+8,gy-wh+2]];SOL(s,sol,roof);H(s,roof,RR(R,2,2.5),RR(R,-10,10));
  for(var k=0;k<3;k++){var bx=hx+hw*(0.2+0.3*k);s.push(rect(bx-2.5,gy-wh-6-k,bx+2.5,gy-wh-1-k));}
  var fx=hx+hw+RR(R,14,20);s.push([[fx,gy],[fx,gy-60]]);var fl=[[fx,gy-60],[fx+16,gy-56],[fx,gy-51]];s.push(fl);H(s,fl,1.4,0);
  var chx=hx+hw*0.72;var Ch=RP(chx,rt+12,chx+8,rt-4);SOL(s,sol,Ch);H(s,Ch,2,0);
  var path=[];for(var t=0;t<8;t++)path.push([hx+14-t*RR(R,8,14)+(t%2?12:-4),gy+t*5]);s.push(curve(path,5));
  for(var r=0;r<RI(R,4,6);r++){var rx=RR(R,10,280),ry=RR(R,gy+8,190);if(Math.abs(rx-hx-hw/2)<hw/2+10)continue;var rk=blob([[rx-6,ry],[rx-4,ry-5],[rx+3,ry-6],[rx+7,ry]],4);s.push(poly(rk));sol.push(rk);H(s,rk,1.5,40);}
  gnd(bg,R,gy,RR(R,4.4,5.4));
  return fin(s,R,bg,sol,gy-50);});

S('Tithe barn',['Oak Crucks','Long Barn in Frost','Threshing Doors Open','A Tenth of Everything','Stone and Stone Slates'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,162,168),bx=RR(R,34,50),bw=RR(R,200,220),wh=RR(R,30,36),rh=RR(R,44,52);
  var W=RP(bx,gy,bx+bw,gy-wh);SOL(s,sol,W);var roof=[[bx-6,gy-wh],[bx+18,gy-wh-rh],[bx+bw-18,gy-wh-rh],[bx+bw+6,gy-wh]];SOL(s,sol,roof);
  var tiles=[],d=1;for(var y=gy-wh-4;y>gy-wh-rh+2;y-=RR(R,3,3.6)){var t=(gy-wh-y)/rh,xl=bx-6+24*t,xr=bx+bw+6-24*t;tiles.push(d>0?[[xl,y],[xr,y]]:[[xr,y],[xl,y]]);d=-d;}
  var px=bx+bw*RR(R,0.4,0.5),porch=[[px-18,gy],[px-18,gy-wh-14],[px,gy-wh-34],[px+18,gy-wh-14],[px+18,gy]];
  clipIn(s,tiles,roof,[porch]);SOL(s,sol,porch);var dr=[[px-11,gy],[px-11,gy-26]].concat(arc(px,gy-26,11,8,PI,TAU)).concat([[px+11,gy]]);s.push(dr);H(s,dr,2,90);s.push([[px,gy],[px,gy-34]]);
  H(s,[[px+18,gy],[px+18,gy-wh-14],[px+10,gy-wh-22],[px+10,gy]],1.8,0);
  var slits=[];for(var i=0;i<8;i++){var sx=bx+12+i*(bw-24)/7;if(Math.abs(sx-px)<26)continue;var sl=RP(sx-1.2,gy-wh+8,sx+1.2,gy-8);slits.push(sl);s.push(poly(sl));
    var bt=[[sx-4,gy],[sx-4,gy-wh+2],[sx-2,gy-wh+2]];s.push([[sx+6,gy],[sx+6,gy-wh*0.6],[sx+3,gy-wh+2]]);}
  var st=[];for(var y2=gy-5;y2>gy-wh+1;y2-=RR(R,4.5,5.5)){st.push([[bx,y2],[bx+bw,y2]]);for(var x2=bx+RR(R,2,8);x2<bx+bw-2;x2+=RR(R,6,10))st.push([[x2,y2],[x2,y2+4.8]]);}
  clipIn(s,st,W,slits.concat([porch]));
  var cart=bx+bw+RR(R,10,14);if(cart<270){wheel(s,cart+10,gy-9,9,8,0);s.push(rect(cart,gy-24,cart+24,gy-14));H(s,RP(cart,gy-24,cart+24,gy-14),2,0);s.push([[cart+24,gy-19],[cart+32,gy-8]]);}
  treeR(s,R,bx-RR(R,16,24)>16?bx-RR(R,16,24):bx+bw+RR(R,40,48),gy,RR(R,12,16),2.4);
  hills(bg,R,gy-6,RR(R,20,30),RR(R,4.6,5.6),[],RR(R,8,18));gnd(bg,R,gy);
  return fin(s,R,bg,sol,gy-10);});

S('Brownstone with a stoop',['Stoop Sitting','Eleven Steps Up','August on the Block','Cornice and Ironwork','Garden Level'],function(R){
  var s=[],sol=[],gy=RR(R,178,184),hx=RR(R,74,92),hw=RR(R,118,128),fl=RI(R,3,4),fh=RR(R,36,42)*3/fl;
  var top=gy-14-fh*fl;var B=RP(hx,gy,hx+hw,top);SOL(s,sol,B);
  var cor=RP(hx-5,top,hx+hw+5,top-10);SOL(s,sol,cor);for(var c=hx-3;c<hx+hw+4;c+=5)s.push([[c,top],[c,top-4]]);s.push([[hx-5,top-6],[hx+hw+5,top-6]]);
  var dx=hx+8,dw=26;var door=RP(dx+4,gy-14,dx+dw-4,gy-14-fh+4);s.push(poly(door));H(s,RP(dx+6,gy-16,dx+dw-6,gy-14-fh+18),1.8,90);s.push(arc(dx+dw/2,gy-14-fh+18,dw/2-4,8,PI,TAU));
  var nst=RI(R,6,7),run=RR(R,6,7),sp=[];for(var k3=0;k3<=nst;k3++){var yy3=gy-14+14*k3/nst,xx3=dx+dw+2+k3*run;sp.push([xx3,yy3]);if(k3<nst)sp.push([xx3+run,yy3]);}
  s.push([[dx,gy-14],[dx+dw+2,gy-14]].concat(sp).concat([[dx,gy],[dx,gy-14]]));for(var q2=1;q2<sp.length-1;q2+=2)s.push([sp[q2],[sp[q2][0],gy]]);
  var rail=sp.filter(function(p,i){return i%2===0;}).map(function(p){return [p[0],p[1]-16];});s.push([[dx+dw+2,gy-30]].concat(rail));for(var q=0;q<rail.length;q++)s.push([rail[q],[rail[q][0],rail[q][1]+16]]);sol.push(sp.concat([[dx,gy],[dx,gy-14]]));
  var holes=[door];for(var f=0;f<fl;f++){var fy=gy-14-f*fh,nw=f===0?2:3;for(var w=0;w<nw;w++){var wx=f===0?hx+hw-24-w*30:hx+12+w*(hw-24)/3+((hw-24)/3-18)/2,ww=18,wy=fy-fh+8;
      var Wp=RP(wx,fy-6,wx+ww,wy);holes.push(Wp);s.push(poly(Wp));s.push([[wx,(fy-6+wy)/2],[wx+ww,(fy-6+wy)/2]]);H(s,RP(wx,wy,wx+ww,(fy-6+wy)/2),RR(R,2.2,2.8),RR(R,30,60));
      var cap=RP(wx-3,wy,wx+ww+3,wy-4);s.push(poly(cap));holes.push(cap);s.push(rect(wx-2,fy-6,wx+ww+2,fy-4));}}
  var gl=RP(hx+hw-60,gy,hx+hw-6,gy-12);s.push(poly(gl));holes.push(gl);for(var gx=hx+hw-58;gx<hx+hw-6;gx+=4)s.push([[gx,gy],[gx,gy-12]]);
  clipIn(s,[rows(hx,hx+hw,top+4,gy-1,RR(R,4.4,5.2))],B,holes);
  [hx-RR(R,30,40),hx+hw+RR(R,6,14)].forEach(function(x,i){if(i===0){var NB=RP(4,gy,hx-2,top+RR(R,10,20));SOL(s,sol,NB);for(var f2=1;f2<4;f2++){var yy=gy-14-f2*fh+10;if(yy>top+20)win(s,hx-28,yy,16,fh-16);}H(s,NB,RR(R,6,7),90);}
    else{var NB2=RP(x,gy,296,top+RR(R,-10,10));SOL(s,sol,NB2);H(s,NB2,RR(R,3.5,4.5),0);}});
  for(var r=0;r<3;r++){var yy2=gy+4+r*4;s.push([[4,yy2],[296,yy2]]);}
  return sky(s,R,gy-20,sol);});

S('Pueblo dwellings',['Ladders to the Roof','Terraced Adobe','Vigas and Shadows','High Desert Morning','Bread Oven Smoke'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,164,170),x0=RR(R,40,60),blocks=[],levels=RI(R,3,4),bw=RR(R,46,54),bh=RR(R,24,28);
  for(var l=0;l<levels;l++){var n=levels-l+1,xs=x0+l*bw*0.45;for(var i=0;i<n;i++){var bx=xs+i*bw,by=gy-l*bh;if(bx+bw>290)continue;blocks.push([bx,by,bx+bw,by-bh]);}}
  blocks.forEach(function(b,i){var P=RP(b[0],b[1],b[2],b[3]);sol.push(P);});
  var out=[];blocks.forEach(function(b,i){var P=RP(b[0],b[1],b[2],b[3]);s.push(poly(P));
    for(var v=b[0]+5;v<b[2]-2;v+=RR(R,7,9))s.push([[v,b[3]+2],[v,b[3]+5]]);
    var dw=RR(R,8,10),dx=b[0]+RR(R,8,b[2]-b[0]-dw-8),D=RP(dx,b[1],dx+dw,b[1]-RR(R,12,15));s.push(poly(D));H(s,D,1.4,90);
    if(R()<0.6){var wx=b[0]+RR(R,4,10);if(Math.abs(wx-dx)>14){var Wn=RP(wx,b[1]-14,wx+6,b[1]-20);s.push(poly(Wn));H(s,Wn,1.2,0);}}
    H(s,RP(b[2]-RR(R,8,12),b[1],b[2],b[3]),RR(R,1.8,2.4),90);});
  for(var k=0;k<RI(R,2,3);k++){var b=blocks[RI(R,0,blocks.length-1)],lx=b[0]+RR(R,10,b[2]-b[0]-16),lt=b[3]-RR(R,14,20);s.push([[lx,b[1]],[lx+2,lt]],[[lx+7,b[1]],[lx+9,lt]]);for(var r=b[1]-4;r>lt+2;r-=5)s.push([[lx+(b[1]-r)/(b[1]-lt)*2,r],[lx+7+(b[1]-r)/(b[1]-lt)*2,r]]);}
  var ox=blocks[0][0]-RR(R,24,30);if(ox>14){var ov=[[ox-12,gy]].concat(arc(ox,gy,12,14,PI,TAU)).concat([[ox+12,gy]]);SOL(s,sol,ov);var mo=archP(ox,gy,4,2);s.push(mo);H(s,mo,1.2,90);H(s,ov,2.6,40);}
  var mesa=[[4,gy-50],[30,gy-52],[40,gy-80],[110,gy-84],[120,gy-56],[200,gy-50],[215,gy-90],[270,gy-92],[280,gy-60],[296,gy-58]].map(function(p){return [p[0],p[1]+RR(R,-4,4)];});
  bg.push(mesa);H(bg,mesa.concat([[296,gy],[4,gy]]),RR(R,4.4,5.2),RR(R,-12,12));gnd(bg,R,gy,RR(R,4.2,5));
  for(var c=0;c<2;c++){var cx=RR(R,10,40)+c*250;if(cx>290)continue;s.push([[cx,gy],[cx,gy-24]],[[cx,gy-12],[cx-6,gy-12],[cx-6,gy-18]],[[cx,gy-15],[cx+5,gy-15],[cx+5,gy-22]]);}
  return fin(s,R,bg,sol,gy-60);});

S('Cliffside monastery',['Bells Above the Cloud','Built on Rock','Pilgrim Stair','Hermit Windows','Where Eagles Pass'],function(R){
  var s=[],sol=[],bg=[],ct=RR(R,92,100),ce=RR(R,150,170);
  var cl=[[4,ct+4],[ce-30,ct],[ce-10,ct+20],[ce-18,ct+50],[ce+6,ct+80],[ce+20,196]];var cliff=[[4,196]].concat(curve(cl,6)).concat([[4,196]]);
  var mx=RR(R,24,40),b1=RP(mx,ct+2,mx+RR(R,56,64),ct-RR(R,30,34)),b2=RP(mx+38,ct-28,mx+62,ct-62),b3=RP(b1[1][0]-2,ct+2,b1[1][0]+30,ct-20);
  [b1,b2,b3].forEach(function(P){SOL(s,sol,P);});
  var r1=[[b1[0][0]-4,b1[2][1]],[b1[0][0]+8,b1[2][1]-12],[b1[1][0]-8,b1[2][1]-12],[b1[1][0]+4,b1[2][1]]];SOL(s,sol,r1);H(s,r1,2,0);
  var r3=[[b3[0][0],b3[2][1]],[b3[1][0]+3,b3[2][1]-8],[b3[1][0]+3,b3[2][1]]];SOL(s,sol,r3);H(s,r3,1.6,0);
  var bc=(b2[0][0]+b2[1][0])/2,r2=[[b2[0][0]-3,b2[2][1]],[bc,b2[2][1]-20],[b2[1][0]+3,b2[2][1]]];SOL(s,sol,r2);H(s,r2,1.8,30);s.push([[bc,b2[2][1]-20],[bc,b2[2][1]-30]],[[bc-4,b2[2][1]-26],[bc+4,b2[2][1]-26]]);
  var bel=archP(bc,b2[2][1]+16,5,6);s.push(bel);s.push(arc(bc,b2[2][1]+10,3,3,0,PI));
  var ws=[];for(var w=0;w<5;w++){var wx=b1[0][0]+6+w*10;if(wx>b1[1][0]-6)break;var A1=archP(wx+2,ct-6,2.5,7);s.push(A1);H(s,A1,1,90);}
  for(var w2=0;w2<2;w2++){var A2=archP(b3[0][0]+8+w2*12,ct-4,2.5,6);s.push(A2);H(s,A2,1,90);}
  H(s,RP(b1[1][0]-10,ct+2,b1[1][0],b1[2][1]),1.6,0);H(s,RP(b2[1][0]-6,ct-28,b2[1][0],b2[2][1]),1.4,0);
  s.push(cliff);var crk=[];for(var k=0;k<RI(R,10,14);k++){var y1=RR(R,ct+10,190),x1=RR(R,8,interpY(cl.map(function(p){return [p[1],p[0]];}),y1)-12);crk.push([[x1,y1],[x1+RR(R,4,10),y1+RR(R,6,14)],[x1+RR(R,0,6),y1+RR(R,14,22)]]);}
  A(s,crk);HX(s,[cliff],RR(R,3.2,3.8),RR(R,60,72));
  var stair=[];var sx=b3[1][0]+2,sy=ct;for(var t=0;t<14;t++){var X=sx-4+t*1.2+(t%2?3:0),Y=sy+t*6;stair.push([X,Y],[X+5,Y]);}s.push(stair);
  var vy=RR(R,128,140),far=[[ce,vy]];for(var x=ce+10;x<=296;x+=8)far.push([x,vy-RR(R,6,12)-28*Math.abs(Math.sin(x/40+1))]);bg.push(far);H(bg,far.concat([[296,196],[ce,196]]),RR(R,4.6,5.6),RR(R,-25,-10));
  var cls=[];for(var c=0;c<RI(R,2,3);c++){var cx=RR(R,ce+40,270),cy=RR(R,vy+6,vy+40),cw=RR(R,26,36);var C=blob([[cx-cw,cy],[cx-cw*0.4,cy-7],[cx+cw*0.3,cy-9],[cx+cw,cy],[cx,cy+4]],6);s.push(poly(C));sol.push(C);}
  behind(s,bg,sol.concat([cliff]));
  return sky(s,R,196,sol.concat([cliff]));});

S('Railway turntable and roundhouse',['Stall Number Six','Turning for Home','Engine Shed, Sunday','Pit and Bridge','Smoke in the Rafters'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,118,126),cx=RR(R,140,160),cy=RR(R,160,166),r=RR(R,60,70);
  var rh=[[4,gy]];var ns=7,sx=[];for(var i=0;i<=ns;i++){var x=4+i*292/ns;sx.push(x);}
  var RH=RP(4,gy,296,gy-RR(R,38,44));SOL(s,sol,RH);var top=RH[2][1];
  var doors=[];for(var i2=0;i2<ns;i2++){var x0=sx[i2]+6,x1=sx[i2+1]-6,D=[[x0,gy],[x0,gy-24]].concat(arc((x0+x1)/2,gy-24,(x1-x0)/2,8,PI,TAU)).concat([[x1,gy]]);doors.push(D);s.push(D);
    H(s,D,RR(R,1.6,2),90);s.push([[sx[i2],gy],[sx[i2],top]]);}
  var rf=[[4,top],[20,top-16],[280,top-16],[296,top]];SOL(s,sol,rf);H(s,rf,2.4,0);for(var v=30;v<280;v+=40){s.push(rect(v,top-16,v+14,top-22));}
  clipIn(s,[brickS(4,top,296,gy,10,5.5)],RH,doors);
  var pit=EP(cx,cy,r,r*0.24);s.push(poly(pit));var inner=EP(cx,cy+3,r-4,r*0.24-3);s.push(poly(inner));HX(s,[pit,inner],1.4,0);
  var ang=RR(R,-0.2,0.2);var br=[[cx-r*Math.cos(ang),cy-r*0.24*Math.sin(ang)*4],[cx+r*Math.cos(ang),cy+r*0.24*Math.sin(ang)*4]];
  s.push([[br[0][0],br[0][1]-3],[br[1][0],br[1][1]-3]],[[br[0][0],br[0][1]+3],[br[1][0],br[1][1]+3]]);for(var t=0;t<=12;t++){var p=lerp(br[0],br[1],t/12);s.push([[p[0],p[1]-4],[p[0],p[1]+4]]);}
  var ex=cx-30,ey=br[0][1]+(br[1][1]-br[0][1])*0.4-3;
  var loco=[[ex,ey],[ex,ey-14],[ex+30,ey-14],[ex+30,ey-24],[ex+50,ey-24],[ex+50,ey]];s.push(poly(loco));sol.push(loco);H(s,RP(ex+30,ey-14,ex+50,ey-24),1.6,0);
  s.push(ellipse(ex+15,ey-14,15,6));s.push(rect(ex+5,ey-20,ex+10,ey-30));H(s,RP(ex+5,ey-20,ex+10,ey-30),1.2,0);s.push(rect(ex+34,ey-20,ex+44,ey-14));
  [ex+8,ex+20,ex+34,ex+46].forEach(function(wx){s.push(circle(wx,ey-2,4));});
  for(var k=0;k<ns;k++){var tx=(sx[k]+sx[k+1])/2,dy=cy-r*0.24;s.push([[tx-4,gy],[cx+(tx-cx)*0.4-4,dy]],[[tx+4,gy],[cx+(tx-cx)*0.4+4,dy]]);}
  s.push([[4,gy],[296,gy]]);
  return sky(s,R,top-18,sol);});

S('Joshua tree',['Arms Raised','High Desert, Dusk','Spiky Elder','Mojave Silence','Rock Pile and Thorns'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,166,172),x=RR(R,120,170);
  function branch(x0,y0,a,len,d){var x1=x0+Math.cos(a)*len,y1=y0+Math.sin(a)*len,w=Math.max(2.5,6-d*1.4);
    var P=[[x0-w,y0],[x1-w*0.8,y1],[x1+w*0.8,y1],[x0+w,y0]];s.push(P);H(s,P,1.6,RR(R,30,60));
    if(d<3&&len>14){var nb=d===0?RI(R,2,3):RI(R,1,2);for(var b=0;b<nb;b++)branch(x1,y1,a+RR(R,-0.9,0.9)+(b-(nb-1)/2)*0.6,len*RR(R,0.6,0.8),d+1);}
    else{var tuft=[];for(var k=0;k<14;k++){var aa=k/14*TAU;tuft.push([x1+Math.cos(aa)*RR(R,6,9),y1+Math.sin(aa)*RR(R,6,9)-4],[x1+Math.cos(aa+0.2)*2,y1+Math.sin(aa+0.2)*2-4]);}s.push(tuft);}}
  var tr=[[x-7,gy],[x-5,gy-50],[x+5,gy-50],[x+7,gy]];SOL(s,sol,tr);H(s,tr,1.5,30);for(var y=gy-6;y>gy-48;y-=6)s.push([[x-5,y],[x+5,y-3]]);
  branch(x,gy-48,-PI/2-0.6,RR(R,26,32),0);branch(x,gy-48,-PI/2+0.6,RR(R,22,30),0);
  var x2=x+sgn(R)*RR(R,70,100);if(x2>30&&x2<270){var t2=[[x2-4,gy],[x2-3,gy-24],[x2+3,gy-24],[x2+4,gy]];s.push(t2);H(s,t2,1.5,30);branch(x2,gy-24,-PI/2+RR(R,-0.4,0.4),16,2);}
  for(var r=0;r<RI(R,3,5);r++){var rx=RR(R,20,280),rr=RR(R,6,14);if(Math.abs(rx-x)<20)continue;var rk=blob([[rx-rr,gy],[rx-rr*0.6,gy-rr*0.8],[rx+rr*0.3,gy-rr],[rx+rr,gy-rr*0.3],[rx+rr,gy]],5);s.push(poly(rk));sol.push(rk);H(s,rk,1.8,RR(R,30,60));}
  var mt=[[4,gy-30],[50,gy-46],[90,gy-38],[140,gy-58],[190,gy-44],[240,gy-62],[296,gy-40]].map(function(p){return [p[0],p[1]+RR(R,-6,6)];});bg.push(mt);H(bg,mt.concat([[296,gy],[4,gy]]),RR(R,4.6,5.6),RR(R,-20,20));
  gnd(bg,R,gy,RR(R,3.6,4.4));
  var sx=RR(R,40,260),sr=RR(R,12,16);sunH(s,sx,gy-RR(R,48,62)-sr,sr);
  return fin(s,R,bg,sol,gy-30);});

S('Olive tree',['Twisted Silver','Five Hundred Harvests','Terrace in the Heat','Gnarled and Patient','Shade on the Wall'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,164,170),x=RR(R,130,170);
  var trunk=[[x-16,gy],[x-12,gy-14],[x-18,gy-30],[x-8,gy-48],[x-2,gy-56],[x+4,gy-50],[x+10,gy-36],[x+6,gy-22],[x+14,gy-10],[x+18,gy]];var T=blob(trunk,5);SOL(s,sol,T);
  for(var k=0;k<5;k++){var p=[];for(var t=0;t<6;t++)p.push([x-12+k*6+Math.sin(t+k)*3,gy-t*10]);s.push(curve(p,4));}H(s,T,RR(R,2.6,3.2),RR(R,30,60));
  var holes=[];var cr=[];var nc=RI(R,5,7);for(var c=0;c<nc;c++){var a=-PI+c*PI/(nc-1),cx=x+Math.cos(a)*RR(R,40,54),cy=gy-64+Math.sin(a)*RR(R,26,34),rx=RR(R,18,26),ry=RR(R,11,15);
    var C=scallop(cx,cy,rx,ry,RI(R,9,13),0.14);cr.push(C);}
  cr.forEach(function(C){s.push(C);sol.push(C.slice(0,-1));});
  cr.forEach(function(C,i){H(s,C.slice(0,-1),RR(R,2.6,3.2),i%2?40:-40);});
  for(var b=0;b<4;b++){var bx=x+RR(R,-30,30);s.push([[x+RR(R,-4,4),gy-52],[bx,gy-72]]);}
  hills(bg,R,gy-10,RR(R,22,34),RR(R,4.4,5.4),[],RR(R,6,16));
  for(var t2=0;t2<3;t2++){var ty=gy-12-t2*10;bg.push(wave(4,296,ty,1.4,40,t2));}
  gnd(bg,R,gy,RR(R,4,5));
  return fin(s,R,bg,sol,gy-14);});

S('Glacier above a lake',['Blue Ice Tongue','Meltwater Morning','The Retreating Ice','Moraine and Mirror','Cold Light, Calving'],function(R){
  var s=[],sol=[],bg=[],ly=RR(R,128,136),gx=RR(R,110,170);
  var mts=[[4,ly-30],[40,ly-70],[70,ly-100],[gx-50,ly-120],[gx-20,ly-80],[gx+20,ly-84],[gx+60,ly-128],[240,ly-90],[270,ly-110],[296,ly-60]].map(function(p){return [p[0],p[1]+RR(R,-6,6)];});
  var gl=[[gx-20,ly-160],[gx-14,ly-120],[gx-16,ly-80],[gx-30,ly-44],[gx-52,ly-10],[gx-48,ly],[gx+52,ly],[gx+56,ly-10],[gx+32,ly-44],[gx+18,ly-80],[gx+16,ly-120],[gx+24,ly-160]];var G=blob(gl,6);
  s.push(mts);var crev=[];for(var y=ly-150;y<ly-4;y+=RR(R,5,7)){var t=Math.max(0,(y-ly+112)/112),w=18+t*42;crev.push(curve([[gx-w,y-4*t],[gx-w*0.3,y+4+5*t],[gx+w*0.3,y+4+5*t],[gx+w,y-4*t]],4));}
  s.push(poly(G));clipIn(s,crev,G,[]);
  var face=[[gx-46,ly],[gx-46,ly-8],[gx+50,ly-8],[gx+50,ly]];for(var fx=gx-44;fx<gx+48;fx+=3)s.push([[fx,ly],[fx+RR(R,-1,1),ly-RR(R,5,9)]]);
  HX(s,[mts.concat([[296,ly],[4,ly]]),G],RR(R,4,4.6),RR(R,50,70));
  var snow=[];mts.forEach(function(p,i){if(i>0&&i<mts.length-1&&p[1]<ly-90)snow.push(p);});
  var lake=[];var d=1;for(var y2=ly+5;y2<ly+52;y2+=RR(R,4.4,5.4)){var w2=wave(4,296,y2,0.8,RR(R,18,26),R()*6);if(d<0)w2.reverse();A(lake,w2);d=-d;}s.push([[4,ly],[296,ly]]);s.push(lake);
  for(var k=0;k<RI(R,2,4);k++){var ix=RR(R,30,270),iy=ly+RR(R,10,40),iw=RR(R,6,12);var I=[[ix-iw,iy],[ix-iw*0.5,iy-iw*0.6],[ix+iw*0.3,iy-iw*0.8],[ix+iw,iy]];s.push(poly(I));H(s,I,1.2,0);}
  var shore=[];for(var x=4;x<=296;x+=6)shore.push([x,ly+54+RR(R,-2,3)]);s.push(shore);
  for(var r=0;r<RI(R,10,14);r++){var rx=RR(R,10,290),ry=RR(R,ly+60,192),rr=RR(R,3,7);var rk=blob([[rx-rr,ry],[rx-rr*0.5,ry-rr*0.8],[rx+rr*0.4,ry-rr*0.9],[rx+rr,ry]],4);s.push(poly(rk));sol.push(rk);H(s,rk,1.3,40);}
  H(s,shore.concat([[296,196],[4,196]]),RR(R,6,7),RR(R,10,20));
  return sky(s,R,ly-20,sol.concat([mts.concat([[296,ly],[4,ly]])]));});

S('Stork on a chimney nest',['Back for Spring','Rooftop Tenant','Clattering Bill','Stick Crown','Over the Village'],function(R){
  var s=[],sol=[],bg=[],cx=RR(R,130,170),ct=RR(R,104,112);
  var ch=RP(cx-14,196,cx+14,ct);SOL(s,sol,ch);s.push(rect(cx-17,ct,cx+17,ct-6));sol.push(RP(cx-17,ct,cx+17,ct-6));clipIn(s,[brickS(cx-14,ct,cx+14,196,9,5)],ch,[]);
  var roofL=[[4,170],[cx-14,128],[cx+14,128],[296,180]];var rf=[[4,170],[cx-14,128]];s.push(rf);s.push([[cx+14,132],[296,178]]);
  var RF=[[4,170],[cx-14,128],[cx-14,196],[4,196]];HX(s,[RF],RR(R,3.2,3.8),-RR(R,25,35));var RF2=[[cx+14,132],[296,178],[296,196],[cx+14,196]];HX(s,[RF2],RR(R,3.2,3.8),RR(R,25,35));
  var ny=ct-6,nest=[[cx-28,ny]].concat(quad([cx-28,ny],[cx,ny+8],[cx+28,ny],10)).concat([[cx+24,ny-10],[cx-24,ny-10]]);SOL(s,sol,nest);
  for(var k=0;k<22;k++){var a=RR(R,-0.5,0.5);var x0=RR(R,cx-30,cx+20);s.push([[x0,ny-RR(R,0,10)],[x0+12*Math.cos(a),ny-RR(R,0,10)+12*Math.sin(a)]]);}
  var dir=sgn(R),by=ny-10;var body=blob([[cx-14*dir,by-14],[cx-4*dir,by-24],[cx+12*dir,by-26],[cx+22*dir,by-18],[cx+10*dir,by-10],[cx-8*dir,by-8],[cx-22*dir,by-10]],6);SOL(s,sol,body);
  var wing=blob([[cx-22*dir,by-11],[cx-6*dir,by-18],[cx+12*dir,by-20],[cx+6*dir,by-12]],5);s.push(poly(wing));H(s,wing,1.2,0);
  var neck=[[cx+16*dir,by-22],[cx+20*dir,by-36],[cx+16*dir,by-48],[cx+20*dir,by-56]];var nk=curve(neck,5);s.push(nk);s.push(nk.map(function(p){return [p[0]+4*dir,p[1]+1];}));
  var hx=cx+21*dir,hy=by-58;s.push(circle(hx,hy,4.5));s.push(circle(hx+1.5*dir,hy-1,0.8));var bill=[[hx+4*dir,hy-2],[hx+30*dir,hy+6],[hx+4*dir,hy+2]];s.push(bill);H(s,bill,1,0);
  s.push([[cx-2,by-9],[cx-2,ny-2]],[[cx+6,by-9],[cx+6,ny-2]]);
  var town=[];for(var b=0;b<6;b++){var bx=b*50+RR(R,0,10),bh=RR(R,20,34);town.push([bx,160],[bx,160-bh],[bx+22,160-bh-12],[bx+44,160-bh],[bx+44,160]);}bg.push(town);
  H(bg,town.concat([[296,196],[4,196]]),RR(R,4.4,5.2),RR(R,40,60));
  behind(s,bg,sol.concat([RF,RF2]));
  return sky(s,R,160,sol.concat([RF,RF2]));});

// ---- chunk B: vehicles, animals, toys, furniture ----
S('Lightship at anchor',['Light Where No Tower Stands','Riding the Swell','Red Hull, Fog Bell','Station Ship','Anchored Beacon'],function(R){
  var s=[],sol=[],wy=RR(R,138,146),cx=RR(R,130,170),L=RR(R,150,170);
  var hull=[[cx-L/2,wy-20]].concat(quad([cx-L/2,wy-20],[cx-L/2+10,wy+8],[cx-L/2+30,wy+10],8)).concat([[cx+L/2-30,wy+10]]).concat(quad([cx+L/2-30,wy+10],[cx+L/2-6,wy+6],[cx+L/2+6,wy-24],8));
  SOL(s,sol,hull);H(s,hull,RR(R,1.8,2.2),0);var dk=[[cx-L/2+2,wy-20],[cx+L/2+5,wy-23]];s.push(dk);
  var nm=[];for(var x=cx-L/2+20;x<cx+L/2-20;x+=6)nm.push([[x,wy-14],[x,wy-10]]);
  var hs=RP(cx-28,wy-20,cx+20,wy-36);SOL(s,sol,hs);for(var p=cx-24;p<cx+16;p+=9)s.push(circle(p+3,wy-28,2.2));
  var wh=RP(cx-10,wy-36,cx+12,wy-50);SOL(s,sol,wh);win(s,cx-7,wy-48,8,8);win(s,cx+2,wy-48,8,8);
  var m1=cx-L*0.28,m2=cx+L*0.26;[m1,m2].forEach(function(mx,i){var mh=i?RR(R,80,90):RR(R,90,104);s.push(rect(mx-1.5,wy-20,mx+1.5,wy-20-mh));sol.push(RP(mx-1.5,wy-20,mx+1.5,wy-20-mh));
    if(!i){var ly=wy-20-mh*0.7,lp=RP(mx-8,ly,mx+8,ly-14);s.push(poly(lp));s.push([[mx-8,ly-7],[mx+8,ly-7]]);for(var g=mx-6;g<mx+8;g+=4)s.push([[g,ly],[g,ly-14]]);var cap=[[mx-10,ly-14],[mx,ly-22],[mx+10,ly-14]];SOL(s,sol,cap);H(s,cap,1.2,0);sol.push(RP(mx-8,ly,mx+8,ly-14));
      for(var r=0;r<6;r++){var a=-PI+r*PI/5;s.push([[mx+12*Math.cos(a),ly-7+12*Math.sin(a)*0.5],[mx+24*Math.cos(a),ly-7+24*Math.sin(a)*0.5]]);}}
    else{var sm=RP(mx-6,wy-20-mh*0.6,mx+6,wy-20-mh*0.6-12);s.push(poly(sm));H(s,sm,1.4,0);}
    s.push([[mx,wy-20-mh*0.85],[i?cx+L/2+2:cx-L/2+4,wy-22]]);});
  s.push([[cx-L/2+6,wy-12],[cx-L/2-14,wy+28]]);for(var c=0;c<5;c++){var t=c/5;s.push(ellipse(cx-L/2+6-20*t,wy-12+40*t,2,3));}
  var sea=waterS(R,4,296,wy+4,196,RR(R,5,6),RR(R,1.4,2));behind(s,[sea],sol);
  var bx=cx+sgn(R)*RR(R,100,120);if(bx>20&&bx<280){s.push([[bx-6,wy+6],[bx+6,wy+6],[bx+3,wy-4],[bx-3,wy-4],[bx-6,wy+6]]);s.push([[bx,wy-4],[bx,wy-18]]);s.push(circle(bx,wy-20,2.4));}
  return sky(s,R,wy+2,sol);});

S('Car ferry at the landing',['Last Boat Over','Ramp Down','Crossing at Six','Lane Two, Please','The Short Sail'],function(R){
  var s=[],sol=[],wy=RR(R,140,146),fx=RR(R,90,120),fw=RR(R,150,170);
  var hull=[[fx,wy-16],[fx+fw,wy-16],[fx+fw-8,wy+8],[fx+10,wy+8]];SOL(s,sol,hull);H(s,hull,RR(R,2,2.4),0);
  var deck=RP(fx+6,wy-16,fx+fw-6,wy-30);SOL(s,sol,deck);for(var x=fx+12;x<fx+fw-10;x+=10){var W=archP(x+4,wy-18,3,6);s.push(W);}
  var sup=RP(fx+fw*0.3,wy-30,fx+fw*0.75,wy-48);SOL(s,sol,sup);for(var x2=fx+fw*0.3+4;x2<fx+fw*0.75-6;x2+=9)win(s,x2,wy-44,6,8);
  var br=RP(fx+fw*0.42,wy-48,fx+fw*0.62,wy-60);SOL(s,sol,br);H(s,RP(fx+fw*0.44,wy-52,fx+fw*0.6,wy-57),1.2,0);
  var fun=[[fx+fw*0.66,wy-48],[fx+fw*0.68,wy-70],[fx+fw*0.74,wy-70],[fx+fw*0.75,wy-48]];SOL(s,sol,fun);H(s,RP(fx+fw*0.66,wy-62,fx+fw*0.76,wy-68),1.2,0);
  s.push([[fx+fw*0.5,wy-60],[fx+fw*0.5,wy-76]],[[fx+fw*0.5,wy-76],[fx+fw*0.5+10,wy-73],[fx+fw*0.5,wy-70]]);
  for(var r=0;r<RI(R,2,3);r++){var cx=fx+18+r*26,car=[[cx,wy-30],[cx,wy-36],[cx+4,wy-36],[cx+7,wy-41],[cx+16,wy-41],[cx+19,wy-36],[cx+22,wy-36],[cx+22,wy-30]];s.push(car);}
  var ramp=[[fx,wy-16],[fx-30,wy-4],[fx-30,wy-1],[fx,wy-12]];s.push(poly(ramp));H(s,ramp,1.6,0);
  var dock=RP(4,wy-4,fx-28,wy+4);SOL(s,sol,dock);H(s,dock,1.6,90);for(var p=10;p<fx-30;p+=14)s.push([[p,wy+4],[p,wy+30]]);
  var hut=RP(20,wy-4,46,wy-26);SOL(s,sol,hut);s.push([[16,wy-26],[33,wy-36],[50,wy-26]]);win(s,26,wy-20,12,8);
  var gate=[[54,wy-4],[54,wy-20],[fx-34,wy-14]];if(fx-34>60)s.push(gate);
  var sea=waterS(R,4,296,wy+6,196,RR(R,5,6),RR(R,1.2,1.8));behind(s,[sea],sol);
  var hil=[[fx+fw+4,wy],[fx+fw+30,wy-30],[296,wy-40]];s.push(hil);H(s,hil.concat([[296,wy]]),RR(R,3,3.6),RR(R,30,50));sol.push(hil.concat([[296,wy]]));
  return sky(s,R,wy,sol);});

S('Autogyro',['Rotor Turning Free','Gyro Over the Fields','Slow Flight','Windmill Plane','Airshow Oddity'],function(R){
  var s=[],sol=[],gy=RR(R,166,172),cx=RR(R,130,160),cy=gy-RR(R,60,80);
  var fus=blob([[cx-48,cy+2],[cx-30,cy-8],[cx+10,cy-10],[cx+40,cy-6],[cx+46,cy+2],[cx+30,cy+10],[cx-10,cy+10],[cx-40,cy+6]],6);SOL(s,sol,fus);
  H(s,blob([[cx-30,cy+4],[cx+30,cy+4],[cx+40,cy+6],[cx+20,cy+10],[cx-20,cy+10]],4),1.4,0);
  var ck=[[cx-6,cy-9],[cx-2,cy-16],[cx+10,cy-16],[cx+14,cy-10]];s.push(ck);
  s.push([[cx+4,cy-10],[cx+4,cy-28]],[[cx-2,cy-10],[cx+4,cy-28]]);var rot=RR(R,-0.15,0.15),RL=RR(R,80,96);
  var b1=lens([cx+4-RL*Math.cos(rot),cy-28-RL*Math.sin(rot)],[cx+4,cy-28],3),b2=lens([cx+4,cy-28],[cx+4+RL*Math.cos(rot),cy-28+RL*Math.sin(rot)],3);s.push(poly(b1),poly(b2));H(s,b1,1.2,0);
  s.push(circle(cx+4,cy-28,3));
  var nose=cx+46;s.push(circle(nose,cy+2,4));s.push([[nose+2,cy-20],[nose+6,cy+2],[nose+2,cy+24]]);
  var tail=[[cx-48,cy+2],[cx-60,cy-14],[cx-54,cy-14],[cx-40,cy-4]];s.push(tail);H(s,tail,1.4,0);s.push([[cx-56,cy+2],[cx-40,cy+2]]);
  var wing=[[cx-6,cy+2],[cx+16,cy+2],[cx+12,cy+6],[cx-10,cy+6]];s.push(wing);
  var circ=[];for(var k=0;k<3;k++)circ.push(circle(cx-30+k*10,cy-2,2));A(s,circ);
  var gear=[[cx-4,cy+10],[cx-10,cy+22]];s.push(gear,[[cx+14,cy+10],[cx+20,cy+22]]);s.push(circle(cx-10,cy+25,4),circle(cx+20,cy+25,4));
  var sh=EP(cx,gy+6,60,4);s.push(poly(sh));H(s,sh,1.4,0);
  var bg=[];hills(bg,R,gy,RR(R,24,34),RR(R,4.4,5.2),[],RR(R,8,18));gnd(bg,R,gy,RR(R,4,5));
  var wsx=RR(R,30,60);s.push([[wsx,gy],[wsx,gy-40]]);var sock=[[wsx,gy-40],[wsx+18,gy-37],[wsx+18,gy-33],[wsx,gy-30]];s.push(poly(sock));H(s,RP(wsx+6,gy-39,wsx+12,gy-31),1.2,90);
  var hg=RR(R,210,240);if(hg<260){var hang=[[hg,gy],[hg,gy-22]].concat(arc(hg+25,gy-22,25,14,PI,TAU)).concat([[hg+50,gy]]);SOL(s,sol,hang);H(s,hang,RR(R,3,3.6),90);}
  return fin(s,R,bg,sol,gy-10);});

S('Delivery tricycle',['Bread Round','Front Box, Full','Three Wheels to Market','Morning Rounds','Pedal Grocer'],function(R){
  var s=[],sol=[],gy=RR(R,162,168),cx=RR(R,120,160),wr=RR(R,15,17);
  var fx=cx-30,rx=cx+50;wheel(s,fx,gy-wr,wr,12,0);wheel(s,rx,gy-wr,wr,12,0);
  var box=RP(fx-26,gy-wr-6,fx+26,gy-wr-42);SOL(s,sol,box);H(s,RP(fx-26,gy-wr-6,fx+26,gy-wr-14),1.4,0);s.push(rect(fx-14,gy-wr-18,fx+14,gy-wr-34));H(s,RP(fx-14,gy-wr-18,fx+14,gy-wr-34),2.4,45);
  var lid=[[fx-28,gy-wr-42],[fx-26,gy-wr-48],[fx+26,gy-wr-48],[fx+28,gy-wr-42]];s.push(lid);
  for(var k=0;k<RI(R,3,4);k++){var lx=fx-20+k*12;s.push(ellipse(lx,gy-wr-52,6,4));}
  s.push([[fx+26,gy-wr-24],[cx+14,gy-wr-14],[rx,gy-wr]],[[cx+14,gy-wr-14],[cx+8,gy-wr-50]],[[fx+26,gy-wr-10],[cx+14,gy-wr-14]]);
  s.push([[cx+2,gy-wr-50],[cx+16,gy-wr-50]]);var seat=[[cx+20,gy-wr-46],[cx+34,gy-wr-46],[cx+30,gy-wr-50],[cx+22,gy-wr-50]];s.push(seat);H(s,seat,1,0);
  s.push([[cx+28,gy-wr-46],[cx+14,gy-wr-14]]);s.push([[cx+28,gy-wr-46],[rx,gy-wr]]);s.push(circle(cx+14,gy-wr-14,5));s.push([[cx+14,gy-wr-14],[cx+20,gy-wr-6]],[[cx+14,gy-wr-14],[cx+8,gy-wr-22]]);
  s.push([[cx+4,gy-wr-50],[cx-2,gy-wr-56]]);s.push(circle(cx-4,gy-wr-58,2.5));
  var bld=RP(4,gy,RR(R,70,90),gy-RR(R,100,120));SOL(s,sol,bld);var bt=bld[2][1];H(s,RP(4,bt,bld[1][0],bt+8),1.6,0);
  var aw=[[4,gy-70],[bld[1][0]+12,gy-62],[bld[1][0]+12,gy-58],[4,gy-58]];s.push(aw);s.push(scallop(0,0,0,0,1,0).length?[[4,gy-58],[bld[1][0]+12,gy-58]]:[]);for(var x=8;x<bld[1][0]+10;x+=6)s.push([[x,gy-70+((x-4)/(bld[1][0]+8))*8],[x,gy-58]]);
  win(s,12,gy-50,bld[1][0]-24,30);var dr=RP(bld[1][0]-16,gy,bld[1][0]-4,gy-24);
  win(s,14,bt+16,16,20);win(s,bld[1][0]-30,bt+16,16,20);H(s,RP(4,bt+8,bld[1][0],gy-74),RR(R,4.6,5.6),90);
  var cob=[];var d=1;for(var y=gy+4;y<196;y+=RR(R,4.5,5.5)){var row=[];for(var x2=4;x2<=296;x2+=RR(R,8,12))row.push([x2,y],[x2+RR(R,6,8),y],[x2+RR(R,6,8),y+3]);if(d<0)row.reverse();A(cob,row);d=-d;}
  s.push([[4,gy],[296,gy]]);s.push(cob);
  var lp=RR(R,240,270);s.push([[lp,gy],[lp,gy-90]],[[lp,gy-90],[lp-8,gy-90]]);var lb=[[lp-12,gy-90],[lp-4,gy-90],[lp-6,gy-82],[lp-10,gy-82]];s.push(poly(lb));
  return sky(s,R,gy-6,sol);});

S('Snowplow truck',['First Through','Blade Down, Four A.M.','Clearing the Pass','Chains On','Storm Shift'],function(R){
  var s=[],sol=[],gy=RR(R,158,164),tx=RR(R,90,120),wr=RR(R,13,15);
  var cab=[[tx+40,gy-wr-2],[tx+40,gy-62],[tx+70,gy-62],[tx+78,gy-44],[tx+78,gy-wr-2]];SOL(s,sol,cab);var cw=[[tx+46,gy-58],[tx+68,gy-58],[tx+74,gy-46],[tx+46,gy-46]];s.push(poly(cw));H(s,cw,2.2,40);
  var bed=RP(tx-50,gy-wr-2,tx+36,gy-52);SOL(s,sol,bed);H(s,RP(tx-50,gy-52,tx+36,gy-46),1.4,0);var sand=[[tx-50,gy-52],[tx-30,gy-62],[tx+20,gy-62],[tx+36,gy-52]];s.push(sand);H(s,sand,1.6,10);
  s.push(rect(tx-52,gy-wr-2,tx+80,gy-wr-8));H(s,RP(tx-52,gy-wr-8,tx+80,gy-wr-2),1.4,0);
  [tx-30,tx+10,tx+62].forEach(function(x){wheel(s,x,gy-wr,wr,0,1.4);});
  var px=tx+82,plow=[[px,gy-wr-14],[px+10,gy-46]].concat(quad([px+10,gy-46],[px+30,gy-36],[px+34,gy-2],8)).concat([[px+4,gy-2]]);SOL(s,sol,plow);H(s,plow,1.5,RR(R,50,70));
  for(var k=0;k<3;k++)s.push([[px+12+k*7,gy-44+k*2],[px+18+k*7,gy-4]]);
  var lb=RP(tx+48,gy-62,tx+66,gy-66);s.push(poly(lb));H(s,lb,1,0);for(var r=0;r<3;r++){var a=-PI*0.75+r*PI/4;s.push([[tx+57+8*Math.cos(a),gy-66+8*Math.sin(a)],[tx+57+16*Math.cos(a),gy-66+16*Math.sin(a)]]);}
  var drift=[[4,gy-12]].concat(curve([[4,gy-12],[40,gy-24],[tx-56,gy-18]],6)).concat([[tx-56,gy]]);s.push(drift);
  var wave1=[[px+34,gy-2]].concat(curve([[px+34,gy-2],[px+44,gy-22],[px+60,gy-18],[296,gy-28]],6));s.push(wave1);H(s,wave1.concat([[296,gy],[px+34,gy]]),RR(R,3,3.6),-30);
  var pole=[];for(var p=0;p<5;p++){var xx=8+p*60;if(Math.abs(xx-tx-10)<100)continue;pole.push(xx);s.push([[xx,gy],[xx,gy-46]],[[xx-2,gy-46],[xx+2,gy-46]]);}
  for(var pi=0;pi<pole.length-1;pi++)s.push(curve([[pole[pi],gy-44],[(pole[pi]+pole[pi+1])/2,gy-38],[pole[pi+1],gy-44]],4));
  var road=[];var d=1;for(var y=gy+4;y<196;y+=RR(R,5,6)){var r2=d>0?[[4,y],[296,y]]:[[296,y],[4,y]];A(road,r2);d=-d;}s.push([[4,gy],[296,gy]]);s.push(road);
  var pines=[];for(var t=0;t<RI(R,4,6);t++){var x=RR(R,8,292);if(x>tx-60&&x<px+40)continue;pineT(s,x,gy-RR(R,14,20),RR(R,0.9,1.3),2.6);}
  var fl=[];for(var f=0;f<RI(R,10,14);f++){var fx=RR(R,10,290),fy=RR(R,20,gy-80);fl.push(fx,fy);}
  return sky(s,R,gy-14,sol);});

S('Hovercraft on the beach',['Skirt Inflated','Cushion of Air','Crossing to the Island','Spray and Thunder','Beach Landing'],function(R){
  var s=[],sol=[],sy=RR(R,148,154),cx=RR(R,130,160),L=RR(R,140,160);
  var sk=[[cx-L/2,sy-14]].concat(quad([cx-L/2,sy-14],[cx-L/2-6,sy+2],[cx-L/2+10,sy+4],6)).concat([[cx+L/2-10,sy+4]]).concat(quad([cx+L/2-10,sy+4],[cx+L/2+6,sy+2],[cx+L/2,sy-14],6));SOL(s,sol,sk);
  for(var x=cx-L/2+4;x<cx+L/2-4;x+=5)s.push([[x,sy-12],[x,sy+3]]);
  var bd=[[cx-L/2+4,sy-14],[cx-L/2+10,sy-36],[cx+L/2-30,sy-36],[cx+L/2-6,sy-14]];SOL(s,sol,bd);
  var cab=[[cx-L/2+24,sy-36],[cx-L/2+30,sy-52],[cx+16,sy-52],[cx+30,sy-36]];SOL(s,sol,cab);for(var w=cx-L/2+32;w<cx+18;w+=10){var wp=[[w,sy-40],[w+2,sy-49],[w+7,sy-49],[w+7,sy-40]];s.push(poly(wp));H(s,wp,1.4,0);}
  H(s,RP(cx-L/2+12,sy-20,cx+L/2-20,sy-26),1.4,0);
  var fx=cx+L/2-50,duct=[fx-14,sy-36];[0,1].forEach(function(i){var dx=cx-L/2+30+i*36;});
  var D1=EP(cx+L/2-46,sy-56,14,20);s.push(poly(D1));s.push(circle(cx+L/2-46,sy-56,3));for(var k=0;k<4;k++){var a=k*PI/2+0.4;s.push([[cx+L/2-46+3*Math.cos(a),sy-56+3*Math.sin(a)],[cx+L/2-46+12*Math.cos(a),sy-56+18*Math.sin(a)]]);}
  s.push([[cx+L/2-56,sy-40],[cx+L/2-46,sy-36]],[[cx+L/2-36,sy-40],[cx+L/2-46,sy-36]]);s.push(rect(cx+L/2-32,sy-40,cx+L/2-28,sy-70));sol.push(D1);
  var fin2=[[cx+L/2-30,sy-70],[cx+L/2-18,sy-70],[cx+L/2-22,sy-44]];s.push(fin2);H(s,fin2,1.2,0);
  var spray=[];for(var p=0;p<8;p++){var px=cx-L/2-4-p*8,py=sy-2-RR(R,0,14);spray.push(scallop(px,py+6,RR(R,5,8),RR(R,4,6),6,0.25));}spray.forEach(function(c){s.push(c);});
  var sea=waterS(R,4,cx-L/2+10,sy-4,sy+16,RR(R,4.6,5.4),1.2);var beach=[[4,sy+16],[296,sy+8]];
  var bgS=[sea];behind(s,bgS,sol.concat(spray.map(function(c){return c.slice(0,-1);})));
  s.push([[4,sy+16],[cx-L/2,sy+6],[296,sy+6]]);H(s,[[4,196],[4,sy+16],[cx-L/2,sy+6],[296,sy+6],[296,196]],RR(R,3.6,4.4),RR(R,8,18));
  var hd=[[cx+L/2+10,sy+6],[cx+L/2+20,sy-30],[296,sy-44],[296,sy+6]];if(cx+L/2+20<280){s.push(hd);H(s,hd,RR(R,3,3.6),RR(R,40,60));sol.push(hd);}
  var bc=[[4,sy-4],[cx-L/2-40,sy-4]];
  return sky(s,R,sy-2,sol);});

S('Funicular railway',['Up the Steep Street','Counterweight Cars','Halfway Pass','Twelve Percent Grade','The Hill Lift'],function(R){
  var s=[],sol=[],x0=RR(R,30,44),y0=RR(R,182,188),x1=RR(R,236,250),y1=RR(R,66,76),ang=Math.atan2(y1-y0,x1-x0);
  var hill=[[4,y0-2],[x0,y0-4],[x1+6,y1-2],[296,y1+10],[296,196],[4,196]];s.push([[4,y0-2],[x0,y0-4],[x1+6,y1-2],[296,y1+10]]);
  function along(t,off){return [x0+(x1-x0)*t-Math.sin(ang)*off,y0+(y1-y0)*t+Math.cos(ang)*off];}
  s.push([along(0,-6),along(1,-6)],[along(0,-1),along(1,-1)]);for(var t=0;t<=1;t+=0.03){s.push([along(t,-7),along(t,0)]);}
  function car(t){var w=RR(R,26,30),h=18,b0=along(t-w/2/Math.hypot(x1-x0,y1-y0),-7),b1=along(t+w/2/Math.hypot(x1-x0,y1-y0),-7);
    var P=[b0,b1,[b1[0],b1[1]-h],[b0[0],b0[1]-h-(b0[1]-b1[1])*0]];SOL(s,sol,P);var stp=4;for(var k=0;k<3;k++){var q0=lerp(b0,b1,k/3+0.05),q1=lerp(b0,b1,(k+1)/3-0.05);var W=[[q0[0],q0[1]-h+4],[q1[0],q1[1]-h+4],[q1[0],q1[1]-h+11],[q0[0],q0[1]-h+11]];s.push(poly(W));H(s,W,1.6,45);}
    var rf=[[b0[0]-2,b0[1]-h],[b1[0]+2,b1[1]-h],[b1[0]+2,b1[1]-h-3],[b0[0]-2,b0[1]-h-3]];s.push(poly(rf));H(s,rf,1,0);H(s,[lerp(b0,b1,0),lerp(b0,b1,1),[b1[0],b1[1]-4],[b0[0],b0[1]-4]],1.4,0);}
  car(RR(R,0.25,0.35));car(RR(R,0.62,0.72));
  var st=RP(x1-10,y1-4,x1+30,y1-30);if(x1+30<296){SOL(s,sol,st);s.push([[x1-14,y1-30],[x1+10,y1-44],[x1+34,y1-30]]);H(s,[[x1-14,y1-30],[x1+10,y1-44],[x1+34,y1-30]],1.6,0);win(s,x1+14,y1-24,10,12);}
  var lst=RP(4,y0-4,x0+6,y0-30);SOL(s,sol,lst);s.push([[2,y0-30],[x0/2+5,y0-42],[x0+10,y0-30]]);
  var houses=[];for(var h=0;h<7;h++){var t2=RR(R,0.08,0.92),p=along(t2,RR(R,14,50)),hw=RR(R,14,22),hh=RR(R,14,22);var HP=RP(p[0],p[1]+4,p[0]+hw,p[1]-hh);
    if(p[1]+4>194)continue;var bad=false;sol.forEach(function(S){if(pip([p[0]+hw/2,p[1]-hh/2],S))bad=true;});if(bad)continue;SOL(s,sol,HP);s.push([[p[0]-2,p[1]-hh],[p[0]+hw/2,p[1]-hh-8],[p[0]+hw+2,p[1]-hh]]);win(s,p[0]+3,p[1]-hh+4,6,6);}
  var hillP=hill;var bg=[];H(bg,hillP,RR(R,4,4.8),RR(R,-40,-25));for(var t3=0.05;t3<0.95;t3+=RR(R,0.1,0.16)){var q=along(t3,RR(R,60,110));if(q[1]>y1&&q[1]<196){var tr=scallop(q[0],q[1]-6,6,5,6,0.2);s.push(tr);sol.push(tr.slice(0,-1));}}
  behind(s,bg,sol);
  return sky(s,R,y0,sol.concat([hill]));});

S('Forklift with pallets',['Loading Bay Four','Tines Up','Stack It High','Warehouse Ballet','Last Truck In'],function(R){
  var s=[],sol=[],gy=RR(R,168,174),fx=RR(R,110,140);
  wheel(s,fx+10,gy-10,10,0,1.4);wheel(s,fx+58,gy-8,8,0,1.4);
  var body=[[fx-2,gy-14],[fx-2,gy-30],[fx+30,gy-30],[fx+34,gy-40],[fx+66,gy-40],[fx+70,gy-14]];SOL(s,sol,body);H(s,RP(fx+50,gy-40,fx+70,gy-18),1.4,0);
  var cage=[[fx+22,gy-30],[fx+22,gy-74],[fx+58,gy-74],[fx+58,gy-40]];s.push(cage);s.push([[fx+22,gy-74],[fx+58,gy-74]]);for(var k=fx+26;k<fx+58;k+=6)s.push([[k,gy-74],[k,gy-71]]);
  s.push([[fx+36,gy-40],[fx+36,gy-48],[fx+44,gy-48]]);s.push(circle(fx+30,gy-50,4));s.push([[fx+30,gy-50],[fx+36,gy-56]]);
  var mast=RP(fx-12,gy-6,fx-4,gy-104);SOL(s,sol,mast);s.push([[fx-8,gy-6],[fx-8,gy-104]]);for(var c=gy-12;c>gy-102;c-=8)s.push([[fx-12,c],[fx-4,c-4]]);
  var ly=gy-RR(R,30,60);var tine=[[fx-12,ly],[fx-52,ly],[fx-52,ly-2],[fx-12,ly-2]];s.push(tine);s.push(rect(fx-14,ly-2,fx-10,ly-26));
  function pallet(x,y,w,load){var P=RP(x,y,x+w,y-6);SOL(s,sol,P);for(var b=x+3;b<x+w;b+=w/3)H(s,RP(b,y,b+4,y-6),1,90);s.push([[x,y-3],[x+w,y-3]]);
    if(load){var B=RP(x+2,y-6,x+w-2,y-6-load);SOL(s,sol,B);s.push([[x+w/2,y-6],[x+w/2,y-6-load]]);s.push([[x+2,y-6-load/2],[x+w-2,y-6-load/2]]);H(s,RP(x+w-8,y-6,x+w-2,y-6-load),1.3,0);}}
  pallet(fx-52,ly-2,40,RR(R,20,28));
  var sx=RR(R,186,200);for(var p=0;p<RI(R,3,4);p++)pallet(sx,gy-p*(RR(R,24,26)+6),46,RR(R,18,20));
  var sx2=RR(R,250,256);for(var p2=0;p2<RI(R,1,3);p2++)pallet(sx2,gy-p2*26,40,20);
  var wl=RP(4,gy,296,30);var bayd=RP(20,gy,RR(R,60,70),gy-RR(R,90,100));s.push(poly(bayd));for(var y=bayd[2][1]+4;y<gy;y+=5)s.push([[20,y],[bayd[1][0],y]]);
  s.push([[4,30],[296,30]]);
  clipIn(s,[rows(4,296,34,gy-2,RR(R,6,7))],wl,sol.concat([bayd]));
  floorS(s,R,gy,RI(R,10,14));
  return s;});

S('Woodpecker on a trunk',['Knock, Knock, Knock','Red Cap in the Oaks','Drumming at Dawn','Bark Detective','Hollow Sound'],function(R){
  var s=[],sol=[],tx=RR(R,130,160),tw=RR(R,40,48),dir=sgn(R);
  var T=[[tx-tw/2,196],[tx-tw/2+4,4],[tx+tw/2-2,4],[tx+tw/2,196]];s.push(poly(T));
  var bx=tx+dir*(tw/2-2),by=RR(R,90,110);
  var body=blob([[bx,by-24],[bx+dir*12,by-30],[bx+dir*20,by-20],[bx+dir*20,by],[bx+dir*14,by+18],[bx+dir*4,by+26],[bx-dir*2,by+10]],6);SOL(s,sol,body);
  var wing=blob([[bx+dir*14,by-18],[bx+dir*22,by-4],[bx+dir*18,by+14],[bx+dir*8,by+20],[bx+dir*8,by-4]],5);s.push(poly(wing));H(s,wing,1.3,0);
  for(var k=0;k<4;k++)s.push([[bx+dir*10,by-6+k*6],[bx+dir*20,by-4+k*6]]);
  var hx=bx+dir*14,hy=by-34;var head=EP(hx,hy,9,9);SOL(s,sol,head);var cap=arc(hx,hy,9,9,PI*1.1,PI*1.9);s.push(cap);H(s,cap.concat([[hx,hy-3]]),1,0);
  s.push(circle(hx-dir*2,hy,1.6));s.push([[hx-dir*6,hy+3],[hx+dir*6,hy+5]]);var bill=[[hx-dir*7,hy-2],[hx-dir*22,hy+1],[hx-dir*7,hy+3]];s.push(bill);H(s,bill,0.9,0);
  var tail=[[bx+dir*4,by+24],[bx-dir*2,by+44],[bx+dir*6,by+42],[bx+dir*10,by+22]];s.push(tail);H(s,tail,1.2,0);
  s.push([[bx+dir*2,by+14],[bx-dir*4,by+16],[bx-dir*2,by+20]],[[bx+dir*2,by+6],[bx-dir*4,by+8]]);
  var hole=EP(tx-dir*6,by-RR(R,40,50),6,8);s.push(poly(hole));H(s,hole,1.2,0);sol.push(hole);
  var chips=[];for(var c=0;c<RI(R,4,6);c++)s.push([[bx-dir*RR(R,4,12),by-RR(R,0,10)],[bx-dir*RR(R,14,20),by-RR(R,0,14)]]);
  var bark=[];for(var j=0;j<RI(R,8,11);j++){var x0=tx-tw/2+4+j*(tw-8)/9,p=[];for(var y=4;y<=196;y+=8)p.push([x0+Math.sin(y/14+j)*2.2,y]);bark.push(curve(p,3));}
  clipIn(s,bark,T,sol);
  var br=dir>0?[[tx-tw/2+2,60],[20,40],[16,44],[tx-tw/2+2,68]]:[[tx+tw/2-2,60],[280,40],[284,44],[tx+tw/2-2,68]];s.push(br);
  for(var l=0;l<RI(R,4,6);l++){var lx=dir>0?RR(R,22,tx-tw/2-10):RR(R,tx+tw/2+10,278),ly=br[0][1]+(lx-br[0][0])/(br[1][0]-br[0][0])*(br[1][1]-br[0][1]);var lf=lens([lx,ly],[lx+RR(R,-6,6),ly-RR(R,10,14)],4);s.push(poly(lf));H(s,lf,1.2,60);}
  var Tp=T.concat([]);var bg=[];for(var t2=0;t2<RI(R,3,5);t2++){var ox=RR(R,10,290);if(Math.abs(ox-tx)<tw)continue;var ow=RR(R,8,14);bg.push([[ox-ow/2,196],[ox-ow/2+1,4]],[[ox+ow/2,196],[ox+ow/2-1,4]]);for(var bl=196;bl>10;bl-=RR(R,14,22))bg.push([[ox-ow/2+1,bl],[ox,bl-5],[ox+ow/2-1,bl]]);}
  behind(s,bg,[T].concat(sol));
  return sky(s,R,196,[T].concat(sol));});

S('Sheep by a stone wall',['Wool on the Wall','Fell Grazing','Two and a Lamb','Dry-Stone Morning','Counting None'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,166,172),wy=gy-RR(R,6,12);
  var wl=wall(s,R,4,296,wy,RR(R,18,22),RR(R,9,12));sol.push(wl.concat([[296,wy],[4,wy]]));
  function sheep(x,y,sc,dir){var b=scallop(x,y-16*sc,22*sc,12*sc,RI(R,12,15),0.12);SOL(s,sol,b.slice(0,-1));
    var hd=blob([[x+dir*18*sc,y-24*sc],[x+dir*30*sc,y-24*sc],[x+dir*34*sc,y-14*sc],[x+dir*26*sc,y-12*sc],[x+dir*18*sc,y-16*sc]],5);SOL(s,sol,hd);H(s,hd,0.9*sc+0.4,0);
    s.push([[x+dir*22*sc,y-24*sc],[x+dir*16*sc,y-26*sc],[x+dir*18*sc,y-22*sc]]);
    [-12,-4,6,13].forEach(function(lx){var L=RP(x+lx*sc-1.2,y-5*sc,x+lx*sc+1.2,y);s.push(poly(L));H(s,L,0.9,0);});
    for(var k=0;k<RI(R,9,13);k++){var cx=x+RR(R,-16,14)*sc,cy=y-16*sc+RR(R,-7,7)*sc;s.push(arc(cx,cy,2.6*sc,2*sc,0,PI*1.6));}}
  var n=RI(R,2,3);var xs=[RR(R,50,70),RR(R,160,180),RR(R,250,262)];for(var i=0;i<n;i++)sheep(xs[i],gy+RR(R,14,24),i===2?0.9:RR(R,1.4,1.6),sgn(R));
  hills(bg,R,wy-14,RR(R,30,44),RR(R,4.4,5.2),[],RR(R,8,20));for(var k=0;k<2;k++){var x0=RR(R,20,260);bg.push([[x0,wy-30-k*16],[x0+60,wy-34-k*14]]);}
  gnd(bg,R,gy,RR(R,4.6,5.4),RR(R,5,12));bg.push([[4,wy],[296,wy]]);
  return fin(s,R,bg,sol,wy-20);});

S('Covered market hall',['Saturday Under Iron','Stalls Beneath the Arches','Market Clock at Nine','Open Sides, Cobbles','Fish, Flowers, Cheese'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,164,170),x0=RR(R,30,42),x1=300-x0+RR(R,-6,6),eh=RR(R,54,60),n=RI(R,5,6),bw=(x1-x0)/n,cx=(x0+x1)/2;
  s.push([[x0-6,gy],[x1+6,gy]]);var shell=RP(x0,gy,x1,gy-eh);sol.push(shell);
  for(var i=0;i<=n;i++){var px=x0+i*bw;var C=RP(px-3,gy,px+3,gy-eh);s.push(poly(C));H(s,C,1.2,0);s.push(rect(px-5,gy,px+5,gy-4),rect(px-5,gy-eh+4,px+5,gy-eh));}
  for(var b=0;b<n;b++){var b0=x0+b*bw+3,b1=b0+bw-6,bc=(b0+b1)/2,rw=(b1-b0)/2,ah=eh-rw-4,A1=archP(bc,gy,rw,ah);s.push(A1);
    var aw=[[b0+3,gy-30],[b1-3,gy-30],[b1-1,gy-22],[b0+1,gy-22]];var tb=RP(b0+5,gy-14,b1-5,gy-10);
    var stl=[];for(var x=b0+4;x<b1-3;x+=4)stl.push([[x,gy-30],[x+(x<bc?-0.6:0.6),gy-22]]);s.push(poly(aw));A(s,stl);s.push(scallop(0,0,1,1,1,0).length?arcs(b0+1,b1-1,gy-22):[]);
    s.push(poly(tb));s.push([[b0+7,gy-10],[b0+7,gy]],[[b1-7,gy-10],[b1-7,gy]]);s.push([[b0+4,gy-30],[b0+4,gy-10]],[[b1-4,gy-30],[b1-4,gy-10]]);
    var kind=RI(R,0,2);for(var p=b0+9;p<b1-8;p+=RR(R,5,7)){if(kind===0)s.push(circle(p,gy-16.5,2.4));else if(kind===1){s.push([[p-2,gy-14],[p,gy-22],[p+2,gy-14]]);}else s.push(ellipse(p,gy-16,2.6,1.8));}
    var inner=[];for(var x2=b0+2;x2<b1;x2+=RR(R,3.8,4.4))inner.push([[x2,gy-31],[x2,gy-eh]]);clipIn(s,inner,A1,[aw]);}
  function arcs(a,b2,y){var p=[[a,y]],w=(b2-a)/Math.max(2,Math.round((b2-a)/6));for(var x=a;x<b2-0.1;x+=w)A(p,arc(x+w/2,y,w/2,2.4,PI,0));return p;}
  var ent=RP(x0-6,gy-eh,x1+6,gy-eh-10);SOL(s,sol,ent);s.push(comb(x0-6,x1+6,gy-eh-2,3,4));
  var rt=gy-eh-RR(R,34,40),roof=[[x0-12,gy-eh-10],[x0+26,rt],[x1-26,rt],[x1+12,gy-eh-10]];SOL(s,sol,roof);H(s,roof,RR(R,2.4,2.8),0);
  var ct=RP(cx-11,rt,cx+11,rt-22);SOL(s,sol,ct);s.push(circle(cx,rt-11,7));for(var k=0;k<12;k++){var a=k*TAU/12;s.push([[cx+5.5*Math.cos(a),rt-11+5.5*Math.sin(a)],[cx+7*Math.cos(a),rt-11+7*Math.sin(a)]]);}
  var ha=RR(R,0,TAU);s.push([[cx,rt-11],[cx+4*Math.cos(ha),rt-11+4*Math.sin(ha)]],[[cx,rt-11],[cx,rt-17]]);
  var cap=[[cx-14,rt-22],[cx,rt-38],[cx+14,rt-22]];SOL(s,sol,cap);H(s,cap,1.6,0);s.push([[cx,rt-38],[cx,rt-50]],[[cx,rt-48],[cx+10,rt-46],[cx,rt-44]]);
  var cob=[];var d=1;for(var y=gy+4;y<196;y+=RR(R,4.4,5.2)){var row=[];var w=4+(y-gy)/8;for(var x3=4;x3<296;x3+=w)A(row,arc(x3+w/2,y,w/2,1.6,PI,TAU));if(d<0)row.reverse();A(cob,row);d=-d;}s.push(cob);
  hills(bg,R,gy-30,RR(R,16,26),RR(R,5.4,6.4),[],RR(R,8,16));
  return fin(s,R,bg,sol,gy-2);});

S('Round hay bales at sunset',['Rolled and Waiting','Last Light on Stubble','Seven Bales West','Field After Cutting','Long Shadows, Late August'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,128,136);
  var sx=RR(R,60,240),sr=RR(R,18,24);var sun=arc(sx,gy,sr,sr,PI,TAU);s.push(sun);for(var k=0;k<9;k++){var a=PI+(k+0.5)*PI/9;s.push([[sx+(sr+4)*Math.cos(a),gy+(sr+4)*Math.sin(a)],[sx+(sr+14)*Math.cos(a),gy+(sr+14)*Math.sin(a)]]);}
  var n=RI(R,5,6),bales=[];for(var i=0;i<n;i++){var t=i/(n-1);bales.push([26+t*236+RR(R,-8,8),gy+8+((i*7)%n)/(n-1)*50,0]);}
  bales.forEach(function(b){b[2]=6+(b[1]-gy-8)/50*16;});bales.sort(function(p,q){return p[1]-q[1];});
  bales.forEach(function(b){var x=b[0],y=b[1],r=b[2],dir=x<sx?1:-1,L=r*1.3;
    var body=[[x,y-2*r],[x+dir*L,y-2*r],[x+dir*L,y],[x,y]];var face=EP(x,y-r,r,r);
    var hb=[];for(var yy=y-2*r+2;yy<y;yy+=Math.max(1.6,r/7))hb.push([[x,yy],[x+dir*L,yy]]);clipIn(s,hb,body,[face]);s.push([[x,y-2*r],[x+dir*L,y-2*r]],[[x+dir*L,y-2*r],[x+dir*L,y]],[[x,y],[x+dir*L,y]]);
    s.push(poly(face));s.push(spiral(x,y-r,0.5,r*0.85,Math.max(1.5,r/3.5),R()*6));sol.push(body);sol.push(face);
    var shd=[[x+dir*L,y],[x+dir*(L+r*2.4),y+r*0.2],[x+dir*(L+r*2.2),y+r*0.45],[x,y+r*0.1]];s.push(poly(shd));H(s,shd,Math.max(1.2,r/9),0);sol.push(shd);});
  var tl=[];for(var x=4;x<=296;x+=5)tl.push([x,gy-RR(R,4,10)*Math.abs(Math.sin(x/23))]);var trees=[[4,gy]].concat(tl).concat([[296,gy]]);s.push(trees);H(s,trees,1.6,RR(R,30,60));sol.push(trees);
  furrows(bg,R,gy,RI(R,16,22),sx);
  var stub=[];var d=1;for(var y2=gy+4;y2<196;y2+=RR(R,5,7)*(1+(y2-gy)/80)){var row=[];for(var x2=4;x2<296;x2+=RR(R,5,8))row.push([x2,y2],[x2+1,y2-RR(R,1.5,3)],[x2+2,y2]);if(d<0)row.reverse();A(stub,row);d=-d;}bg.push(stub);
  behind(s,bg,sol);return sky(s,R,gy-2,sol);});

S('Wooden sled in the snow',['First Run of Winter','Runners Waxed','Up the Hill Again','Snow Day','Red Rope, White Field'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,160,166),sx=RR(R,90,130),L=RR(R,90,104),ang=RR(R,0.08,0.16);
  function T(p){return rotateAbout([[sx+p[0],gy-p[1]]],sx,gy,ang)[0];}
  var deck=[T([0,22]),T([L,22]),T([L,28]),T([0,28])];SOL(s,sol,deck);for(var k=0;k<5;k++){var a=T([4+k*(L-8)/4.5,22]),b=T([4+k*(L-8)/4.5+(L-8)/6,28]);var sl=[a,T([4+k*(L-8)/4.5+(L-8)/6,22]),b,T([4+k*(L-8)/4.5,28])];s.push(poly(sl));H(s,sl,1.1,ang*57);}
  var run=[T([-6,8])].concat(quad(T([-6,8]),T([-22,8]),T([-18,22]),6)).concat([T([-10,24])]);var rn=[T([-6,8]),T([L+6,8])];s.push(rn.concat([]));s.push(run);s.push([T([-6,4]),T([L+6,4])]);s.push(quad(T([-6,4]),T([-26,4]),T([-20,24]),6));
  for(var p=0;p<4;p++){var x=6+p*(L-12)/3;s.push([T([x,8]),T([x,22])]);H(s,[T([x-1.5,8]),T([x+1.5,8]),T([x+1.5,22]),T([x-1.5,22])],1,90);}
  var rope=curve([T([-18,22]),T([-40,10]),T([-60,4]),T([-80,10]),T([-100,30])],6);s.push(rope);
  var tracks=[];var t0=T([L+6,4]),t1=T([L+6,8]);s.push([t0,[296,t0[1]+(296-t0[0])*Math.tan(ang)]]);s.push([t1,[296,t1[1]+(296-t1[0])*Math.tan(ang)]]);
  var slope=[[4,gy-50],[296,gy+20]];
  var hill=[];for(var x2=4;x2<=296;x2+=6)hill.push([x2,gy-RR(R,58,64)+x2*0.14+6*Math.sin(x2/40)]);bg.push(hill);
  for(var t=0;t<RI(R,6,9);t++){var px=RR(R,10,290),py=interpY(hill,px);pineT(s,px,py,RR(R,0.6,1),2.2);sol.push(pine(px,py,1)[1]);}
  var fence=[];for(var f=0;f<10;f++){var fx=12+f*30,fy=interpY(hill,fx)+RR(R,18,30);if(Math.abs(fx-sx-L/2)<L)continue;s.push([[fx,fy],[fx,fy-14]]);}
  var snow=[];var d=1;for(var y=10;y<196;y+=RR(R,9,12)){}
  H(bg,[[4,196]].concat(hill).concat([[296,196]]),RR(R,7,8),-ang*57);
  var foot=[];for(var q=0;q<8;q++){var fp=T([-40-q*14,RR(R,-6,-2)]);if(fp[0]<6)break;s.push(EP(fp[0],fp[1]+(q%2?3:-3),2.2,1.2).concat([[fp[0]+2.2,fp[1]+(q%2?3:-3)]]));}
  behind(s,bg,sol);
  return sky(s,R,gy-40,sol.concat([[[4,196]].concat(hill).concat([[296,196]])]));});

S('Toy sailboat on a pond',['Park Pond Regatta','Pushed Off with a Stick','Little Mainsail','Sunday in the Gardens','Becalmed by the Lilies'],function(R){
  var s=[],sol=[],wy=RR(R,120,130),cx=RR(R,120,170),dir=sgn(R);
  var hull=[[cx-36,wy]].concat(quad([cx-36,wy],[cx-20,wy+16],[cx+40*1,wy+4],8)).concat([[cx+44,wy-4]]);hull.push([cx-36,wy]);
  hull=hull.map(function(p){return [cx+(p[0]-cx)*dir,p[1]];});SOL(s,sol,hull.slice(0,-1));H(s,hull.slice(0,-1),1.6,0);
  var mx=cx;s.push([[mx,wy-1],[mx,wy-80]]);var main=[[mx-dir*2,wy-6],[mx-dir*2,wy-78],[mx-dir*34,wy-8]];s.push(poly(main));H(s,main,RR(R,2.6,3.2),dir*60);
  var jib=[[mx+dir*2,wy-74],[mx+dir*40,wy-6],[mx+dir*4,wy-8]];s.push(poly(jib));s.push([[mx,wy-80],[mx+dir*8,wy-84],[mx,wy-86]]);
  s.push(wave(cx-50,cx+50,wy+6,1,10,0));
  var rim=[[4,wy-14],[296,wy-14]];var stone=[];for(var x=4;x<296;x+=RR(R,14,20))stone.push([[x,wy-14],[x,wy-22]]);s.push([[4,wy-22],[296,wy-22]]);A(s,stone);s.push(rim);
  var water=[];var d=1;for(var y=wy-10;y<196;y+=RR(R,5,6)){var w=wave(4,296,y,RR(R,0.6,1.4),RR(R,16,24),R()*6);if(d<0)w.reverse();A(water,w);d=-d;}
  var lil=[];for(var l=0;l<RI(R,3,5);l++){var lx=RR(R,20,280),ly=RR(R,wy+20,186);if(Math.abs(lx-cx)<60)continue;var L=arc(lx,ly,RR(R,10,14),RR(R,4,5),0.3,TAU-0.1);L.push([lx,ly]);L.push(L[0]);s.push(L);sol.push(L.slice(0,-1));}
  var refl=[];for(var r=0;r<8;r++){var ry=wy+8+r*5,w2=34-r*4;if(w2<4)break;refl.push([[mx-dir*w2,ry],[mx,ry]]);}A(s,refl);
  behind(s,[water],sol.concat(refl.map(function(q){return [[q[0][0],q[0][1]-2],[q[1][0],q[1][1]-2],[q[1][0],q[1][1]+2],[q[0][0],q[0][1]+2]];})));
  var trees=[];for(var t=0;t<RI(R,4,6);t++){var tx=RR(R,12,288);if(Math.abs(tx-cx)<56)continue;treeR(s,R,tx,wy-22,RR(R,10,16),2.6);}
  return sky(s,R,wy-24,sol);});

S('Chest of drawers',['Top Drawer Sticks','Brass Pulls','Mother\'s Linen','Walnut Bow Front','Bedroom Corner'],function(R){
  var s=[],sol=[],fy=RR(R,170,176),cx=RR(R,130,170),w=RR(R,100,116),h=RR(R,90,100);
  var top=RP(cx-w/2-6,fy-h,cx+w/2+6,fy-h-6);SOL(s,sol,top);H(s,top,1.4,0);
  var B=RP(cx-w/2,fy-8,cx+w/2,fy-h);SOL(s,sol,B);var nd=RI(R,4,5),dh=(h-14)/nd;
  for(var i=0;i<nd;i++){var y0=fy-h+3+i*dh,y1=y0+dh-3;var D=RP(cx-w/2+4,y0,cx+w/2-4,y1);s.push(poly(D));
    [cx-w/4,cx+w/4].forEach(function(px){s.push(arc(px,y0+dh/2-2,5,3,0,PI));s.push(circle(px-5,y0+dh/2-2,1.2),circle(px+5,y0+dh/2-2,1.2));});s.push(rect(cx-3,y0+4,cx+3,y0+8));
    H(s,RP(cx-w/2+4,y1-3,cx+w/2-4,y1),1,0);}
  [cx-w/2+2,cx+w/2-8].forEach(function(x){var L=[[x,fy-8],[x+1,fy],[x+5,fy],[x+6,fy-8]];s.push(L);H(s,L,1,0);});
  H(s,RP(cx+w/2-6,fy-8,cx+w/2,fy-h),1.2,0);
  var mir=EP(cx,fy-h-40,26,32);s.push(poly(mir));s.push(circle(cx,fy-h-40,1));sol.push(EP(cx,fy-h-40,30,36));s.push(ellipse(cx,fy-h-40,30,36));
  H(s,[[cx-14,fy-h-60],[cx+6,fy-h-70],[cx+18,fy-h-40],[cx-2,fy-h-28]],2.6,-40);s.push([[cx-30,fy-h-40],[cx-36,fy-h-6]],[[cx+30,fy-h-40],[cx+36,fy-h-6]]);
  var vx=cx-w/2+16;var vase=[[vx-5,fy-h-6]].concat(quad([vx-5,fy-h-6],[vx-10,fy-h-18],[vx-3,fy-h-24],5)).concat([[vx+3,fy-h-24]]).concat(quad([vx+3,fy-h-24],[vx+10,fy-h-18],[vx+5,fy-h-6],5));s.push(vase);
  for(var f=0;f<3;f++){var a=-PI/2+(f-1)*0.4;s.push([[vx,fy-h-24],[vx+22*Math.cos(a),fy-h-24+22*Math.sin(a)]]);s.push(circle(vx+24*Math.cos(a),fy-h-24+24*Math.sin(a),3));}
  var bx=cx+w/2-24;s.push(rect(bx,fy-h-6,bx+16,fy-h-14));H(s,RP(bx,fy-h-6,bx+16,fy-h-14),1.6,45);
  var wl=RP(4,4,296,fy-16);s.push([[4,fy-16],[296,fy-16]]);var bb=RP(4,fy-16,296,fy-8);
  var pap=[];for(var x=8;x<296;x+=RR(R,8,10)){var p=[];for(var y=6;y<fy-16;y+=4)p.push([x+2*Math.sin(y/8),y]);pap.push(p);}
  clipIn(s,pap,wl,sol);s.push([[4,fy-8],[296,fy-8]]);H(s,RP(4,fy-16,cx-w/2-6,fy-8),2,0);H(s,RP(cx+w/2+6,fy-16,296,fy-8),2,0);
  floorS(s,R,fy,RI(R,10,14));return s;});

S('Porch swing',['Chains Creak at Dusk','Screen Door Summer','Two Cushions','Lemonade Hour','Front Porch, Late June'],function(R){
  var s=[],sol=[],fy=RR(R,164,170),cx=RR(R,130,170),sw=RR(R,80,92),sy=fy-RR(R,34,40),ceil=RR(R,26,32);
  s.push([[4,ceil],[296,ceil]]);for(var b=10;b<296;b+=RR(R,22,26))s.push([[b,ceil],[b,ceil-6]]);s.push([[4,ceil-6],[296,ceil-6]]);H(s,RP(4,ceil-6,296,4),RR(R,3,3.6),0);
  var sl=[[cx-sw/2,sy],[cx+sw/2,sy],[cx+sw/2,sy+5],[cx-sw/2,sy+5]];SOL(s,sol,sl);
  var back=[[cx-sw/2,sy],[cx-sw/2+4,sy-32],[cx+sw/2-4,sy-32],[cx+sw/2,sy]];s.push(back);for(var x=cx-sw/2+6;x<cx+sw/2-4;x+=6)s.push([[x,sy],[x+(x<cx?0.5:-0.5),sy-30]]);s.push([[cx-sw/2+3,sy-26],[cx+sw/2-3,sy-26]]);
  [cx-sw/2,cx+sw/2].forEach(function(x,i){s.push([[x,sy+5],[x+(i?6:-6),sy-16],[x+(i?6:-6),sy-20]]);
    var ch=[];for(var y=ceil;y<sy-18;y+=5)ch.push(ellipse(x+(i?6:-6),y+2.5,1.6,2.6));A(s,ch);});
  var c1=blob([[cx-sw/2+8,sy],[cx-sw/2+12,sy-22],[cx-6,sy-24],[cx-4,sy-2]],5);SOL(s,sol,c1);H(s,c1,2.4,45);var c2=blob([[cx+6,sy],[cx+8,sy-20],[cx+sw/2-12,sy-22],[cx+sw/2-8,sy]],5);SOL(s,sol,c2);H(s,c2,2.4,-45);
  var post1=RP(18,fy,26,ceil),post2=RP(274,fy,282,ceil);[post1,post2].forEach(function(P){SOL(s,sol,P);H(s,P,1.6,0);});
  var rail=RP(26,fy-26,cx-sw/2-20,fy-30),rail2=RP(cx+sw/2+20,fy-26,274,fy-30);[rail,rail2].forEach(function(P){if(P[1][0]>P[0][0]){s.push(poly(P));for(var x=P[0][0]+4;x<P[1][0];x+=6)s.push([[x,fy-26],[x,fy]]);}});
  var wall=RP(26,ceil,274,fy-30);var door=RP(cx-14,fy-30,cx+14,ceil+30);var win1=RP(cx-sw/2-30,fy-52,cx-sw/2-6,fy-90),win2=RP(cx+sw/2+6,fy-52,cx+sw/2+30,fy-90);
  var sid=[];for(var y2=ceil+4;y2<fy-30;y2+=RR(R,4.4,5))sid.push([[26,y2],[274,y2]]);clipIn(s,sid,wall,sol.concat([back.concat([[cx+sw/2,sy+5],[cx-sw/2,sy+5]])],win1,win2));
  [win1,win2].forEach(function(W){if(W[0][0]>26&&W[1][0]<274){win(s,W[0][0],W[2][1],W[1][0]-W[0][0],W[0][1]-W[2][1],2.6);s.push(rect(W[0][0]-6,W[2][1],W[0][0],W[0][1]),rect(W[1][0],W[2][1],W[1][0]+6,W[0][1]));}});
  var pl=fy-6;var pot=[[244,fy],[240,fy-14],[260,fy-14],[256,fy]];s.push(pot);for(var l=0;l<5;l++){var a=-PI/2+(l-2)*0.45;s.push(lens([250,fy-14],[250+18*Math.cos(a),fy-14+20*Math.sin(a)],3));}
  floorS(s,R,fy,RI(R,14,18));
  s.push([[4,ceil],[4,fy]]);
  return s;});

// ---- chunk C: instruments, tools, kitchen, objects, food ----
S('Tuba',['Oompah at the Bandstand','Big Brass Bell','Low and Round','Valves and Coils','Bottom of the Band'],function(R){
  var s=[],sol=[],fy=RR(R,174,180),cx=RR(R,140,160),by=RR(R,40,48),br=RR(R,30,34);
  var bell=[[cx-br,by]].concat(quad([cx-br,by],[cx-10,by+18],[cx-8,by+48],8)).concat([[cx-8,fy-60]]).concat(quad([cx-8,fy-60],[cx-34,fy-50],[cx-30,fy-26],8)).concat(arc(cx-2,fy-26,28,22,PI,PI*0.1).slice(1)).concat([[cx+20,fy-46]]).concat([[cx+8,fy-60],[cx+8,by+48]]).concat(quad([cx+8,by+48],[cx+10,by+18],[cx+br,by],8));
  SOL(s,sol,bell);s.push(ellipse(cx,by,br,6));H(s,EP(cx,by,br-3,4),1.2,0);
  H(s,[[cx+2,by+6],[cx+br-4,by+2],[cx+8,by+46],[cx+2,by+48]],1.4,80);
  var loop=EP(cx-2,fy-28,18,13);s.push(poly(loop));H(s,[[cx+8,fy-40],[cx+24,fy-30],[cx+18,fy-14],[cx+8,fy-18]],1.4,60);
  for(var v=0;v<3;v++){var vx=cx+14+v*8,vy=fy-76;s.push(rect(vx,vy,vx+5,vy+22));s.push(rect(vx-1,vy-4,vx+6,vy));s.push(circle(vx+2.5,vy-6,2.6));H(s,RP(vx+3,vy,vx+5,vy+22),0.9,0);}
  s.push([[cx+8,fy-70],[cx+14,fy-70]],[[cx+8,fy-56],[cx+14,fy-56]]);var tube=curve([[cx+38,fy-60],[cx+50,fy-70],[cx+50,fy-86],[cx+36,fy-96],[cx+20,fy-96]],6);s.push(tube);s.push(tube.map(function(p){return [p[0]+3,p[1]+3];}));
  var mp=[[cx+20,fy-96],[cx+10,fy-100],[cx+6,fy-104],[cx+10,fy-108]];s.push(mp);
  s.push(curve([[cx+38,fy-54],[cx+46,fy-40],[cx+36,fy-28],[cx+24,fy-30]],6));
  var stand=[[cx-20,fy],[cx-6,fy-6],[cx+6,fy-6],[cx+20,fy]];s.push(stand);
  var ch=RR(R,40,60);var chair=[[ch,fy],[ch,fy-44],[ch+30,fy-44],[ch+30,fy]];s.push([[ch,fy-90],[ch,fy]],[[ch+30,fy-44],[ch+30,fy]],[[ch,fy-44],[ch+34,fy-44]],[[ch+4,fy-44],[ch+4,fy-90]]);H(s,RP(ch,fy-90,ch+4,fy-60),1.2,0);
  var mx=RR(R,230,250);s.push([[mx,fy],[mx,fy-80]],[[mx-12,fy],[mx,fy-14],[mx+12,fy]]);var sh=[[mx-22,fy-80],[mx+22,fy-80],[mx+18,fy-108],[mx-18,fy-108]];SOL(s,sol,sh);
  for(var l=0;l<5;l++){var y=fy-102+l*4.5;s.push([[mx-18+l*0.6,y],[mx+18-l*0.6,y]]);}for(var n=0;n<6;n++){var nx=mx-14+n*5.5,ny=fy-102+((n*7)%5)*4.5;s.push(circle(nx,ny,1.4));s.push([[nx+1.4,ny],[nx+1.4,ny-7]]);}
  var curtain=[];for(var x=6;x<296;x+=RR(R,6,8)){var p=[];for(var y2=4;y2<fy-10;y2+=6)p.push([x+2.4*Math.sin(y2/18+x),y2]);curtain.push(p);}
  clipIn(s,curtain,RP(4,4,296,fy-10),sol.concat([RP(ch,fy-90,ch+34,fy),RP(mx-14,fy-80,mx+14,fy)]));
  s.push([[4,fy-10],[296,fy-10]]);H(s,RP(4,fy-10,296,fy),2,0);floorS(s,R,fy,RI(R,10,14));
  return s;});

S('Upright bass',['Walking Line','Four Strings Down Low','After the Last Set','Rosin Dust','The Big Fiddle'],function(R){
  var s=[],sol=[],fy=RR(R,174,180),cx=RR(R,130,160),tilt=RR(R,-0.18,-0.08)*sgn(R);
  function T(P){return rotateAbout(P,cx,fy-6,tilt);}
  var bt=fy-10,lw=34,uw=28,wy=bt-46;
  var body=T(blob([[cx,bt],[cx+lw,bt-10],[cx+lw+2,bt-34],[cx+14,wy],[cx+16,wy-14],[cx+uw,wy-26],[cx+uw-2,wy-46],[cx+10,wy-58],[cx,wy-60],[cx-10,wy-58],[cx-uw+2,wy-46],[cx-uw,wy-26],[cx-16,wy-14],[cx-14,wy],[cx-lw-2,bt-34],[cx-lw,bt-10]],5));
  SOL(s,sol,body);s.push(T(blob([[cx,bt+3],[cx+lw+3,bt-9],[cx+lw+5,bt-34],[cx+17,wy],[cx+19,wy-14],[cx+uw+3,wy-26],[cx+uw+1,wy-46],[cx+10,wy-62],[cx-10,wy-62],[cx-uw-1,wy-46],[cx-uw-3,wy-26],[cx-19,wy-14],[cx-17,wy],[cx-lw-5,bt-34],[cx-lw-3,bt-9]],5)));
  H(s,body,RR(R,2.6,3),RR(R,40,60)+tilt*57);
  var fh=function(dx){return T(curve([[cx+dx,wy-30],[cx+dx*1.3,wy-18],[cx+dx,wy-6],[cx+dx*0.7,wy+6]],5));};s.push(fh(12),fh(-12));
  var brg=T([[cx-10,wy-4],[cx+10,wy-4],[cx+8,wy-10],[cx-8,wy-10]]);s.push(poly(brg));sol.push(brg);var tp=T([[cx-6,bt-4],[cx-3,wy+4],[cx+3,wy+4],[cx+6,bt-4]]);s.push(poly(tp));sol.push(tp);
  var nk=T(RP(cx-4,wy-60,cx+4,wy-128));SOL(s,sol,nk);H(s,nk,1.2,tilt*57);var sc=T(blob([[cx-4,wy-128],[cx-6,wy-138],[cx+2,wy-146],[cx+8,wy-140],[cx+4,wy-132],[cx+4,wy-128]],5));SOL(s,sol,sc);
  for(var p=0;p<4;p++){var py=wy-118+p*5;s.push(T([[cx-4,py],[cx-11,py-1]]));s.push(T(EP(cx-12,py-1,2,1.4)).concat([T([[cx-10,py-1]])[0]]));}
  for(var st=0;st<4;st++){var sx=cx-3+st*2;s.push(T([[sx,wy-120],[sx,wy-4]]));s.push(T([[sx,wy-10],[sx-1+st*0.6,bt-4]]));}
  s.push(T([[cx,bt+3],[cx,fy]]));
  var bow=[[cx+RR(R,40,50),fy-4],[cx+RR(R,70,90),fy-110]];s.push(bow);s.push([[bow[0][0]+3,fy-8],[bow[1][0]+3,fy-104]]);
  var stool=RR(R,40,60);s.push(ellipse(stool,fy-60,18,4));s.push([[stool-14,fy-58],[stool-18,fy]],[[stool+14,fy-58],[stool+18,fy]],[[stool,fy-56],[stool,fy]],[[stool-16,fy-24],[stool+16,fy-24]]);
  var bg=[];var sp=RR(R,7,9);for(var x=4;x<=296;x+=sp)bg.push([[x,4],[x,fy-14]]);for(var y=30;y<fy-14;y+=RR(R,30,40)){bg.push([[4,y],[296,y]]);}
  behind(s,bg,sol.concat([EP(stool,fy-60,19,5)]));s.push([[4,fy-14],[296,fy-14]]);floorS(s,R,fy-14,RI(R,10,14));
  return s;});

S('Harmonium',['Pump and Drone','Parlour Hymn','Stops Pulled Out','Bellows Breathing','Chapel by the Sea'],function(R){
  var s=[],sol=[],fy=RR(R,174,180),cx=RR(R,140,160),w=RR(R,110,124),kh=fy-RR(R,62,68);
  var body=RP(cx-w/2,fy-8,cx+w/2,kh);SOL(s,sol,body);var top=RP(cx-w/2+6,kh-6,cx+w/2-6,kh-60);SOL(s,sol,top);
  var cr=[[cx-w/2+2,kh-60],[cx-w/2+12,kh-72],[cx+w/2-12,kh-72],[cx+w/2-2,kh-60]];SOL(s,sol,cr);H(s,cr,1.4,0);var arch=[[cx-20,kh-72]].concat(arc(cx,kh-72,20,12,PI,TAU)).concat([[cx+20,kh-72]]);s.push(arch);H(s,arch,1.6,0);
  var mir=archP(cx,kh-14,16,22);s.push(poly(mir));H(s,[[cx-10,kh-20],[cx+4,kh-44],[cx+10,kh-38],[cx-4,kh-14]],2,45);
  for(var sd=0;sd<2;sd++){var x0=sd?cx+24:cx-w/2+12,x1=sd?cx+w/2-12:cx-24,sh=RP(x0,kh-12,x1,kh-48);s.push(poly(sh));H(s,sh,RR(R,2.4,3),sd?45:-45);}
  var kb=RP(cx-w/2+4,kh,cx+w/2-4,kh+12);s.push(poly(kb));for(var k=cx-w/2+8;k<cx+w/2-4;k+=4)s.push([[k,kh+12],[k,kh+3]]);
  for(var b=0;b<Math.floor((w-12)/4);b++){if(b%7===2||b%7===6)continue;var bx=cx-w/2+9+b*4;H(s,RP(bx,kh,bx+2,kh+7),0.8,0);}
  for(var st=0;st<8;st++){var sx=cx-w/2+16+st*(w-32)/7;s.push(circle(sx,kh-3,2));s.push([[sx,kh-1],[sx,kh]]);}
  var pnl=RP(cx-w/2+8,kh+18,cx+w/2-8,fy-24);s.push(poly(pnl));H(s,pnl,RR(R,3,3.6),90);
  [-1,1].forEach(function(d){var px=cx+d*w*0.2;var pd=[[px-12,fy-10],[px-10,fy-22],[px+10,fy-22],[px+12,fy-10]];s.push(poly(pd));H(s,pd,1.4,0);});
  [cx-w/2,cx+w/2-6].forEach(function(x){s.push(rect(x,fy-8,x+6,fy));});
  var lx=cx-w/2+10;s.push(rect(lx-2,kh-6,lx+2,kh-24));s.push(curve([[lx,kh-24],[lx-2,kh-30],[lx+2,kh-34]],4));
  var bench=RP(cx-36,fy-30,cx+36,fy-36);if(true){s.push(poly(bench));sol.push(bench);s.push([[cx-32,fy-30],[cx-32,fy]],[[cx+32,fy-30],[cx+32,fy]]);H(s,bench,1.2,0);}
  var wl=RP(4,4,296,fy-12);var bg=[];var g=RR(R,11,14);HX(bg,[wl],g,45);HX(bg,[wl],g,-45);behind(s,bg,sol.concat([cr,arch.concat([[cx+20,kh-72]])]));
  s.push([[4,fy-12],[296,fy-12]]);floorS(s,R,fy-12,RI(R,10,14));return s;});

S('Grindstone on a frame',['Sharpening Day','Crank and Water','Edge on the Axe','Sandstone Wheel','Sparks Before Spring'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,168,174),cx=RR(R,130,160),wr=RR(R,34,40),wy=gy-RR(R,50,56);
  var fr=[[cx-46,gy],[cx-40,wy+8]];s.push(fr,[[cx+46,gy],[cx+40,wy+8]],[[cx-60,gy],[cx-44,wy+4],[cx+44,wy+4],[cx+60,gy]]);var frL=[[cx-60,gy],[cx-44,wy+4],[cx-40,wy+4],[cx-54,gy]];H(s,frL,1,0);var frR=[[cx+60,gy],[cx+44,wy+4],[cx+40,wy+4],[cx+54,gy]];H(s,frR,1,0);
  s.push([[cx-52,gy-16],[cx+52,gy-16]]);
  var W=EP(cx,wy,wr,wr);SOL(s,sol,W);s.push(circle(cx,wy,wr-4));for(var k=0;k<RI(R,5,7);k++){s.push(circle(cx,wy,wr-8-k*4));}
  s.push(circle(cx,wy,5));HX(s,[W,EP(cx,wy,wr-4,wr-4)],1.4,30);
  var tr=[[cx-wr+4,wy+wr-12],[cx-wr+8,wy+wr+2],[cx+wr-8,wy+wr+2],[cx+wr-4,wy+wr-12]];SOL(s,sol,tr);H(s,tr,1.6,0);
  s.push([[cx+5,wy],[cx+56,wy]]);s.push([[cx+56,wy],[cx+56,wy+22],[cx+68,wy+22]]);s.push(circle(cx+56,wy,3));
  var seat=RP(cx-90,gy-30,cx-56,gy-36);if(cx-90>8){s.push(poly(seat));s.push([[cx-86,gy-30],[cx-88,gy]],[[cx-60,gy-30],[cx-58,gy]]);sol.push(seat);}
  var ax=[[cx-10,wy-wr-4],[cx-40,wy-wr-50]];s.push(ax);s.push([[cx-12,wy-wr-2],[cx-42,wy-wr-48]]);var hd=[[cx-4,wy-wr+2],[cx-10,wy-wr-8],[cx+6,wy-wr-14],[cx+14,wy-wr-6]];s.push(poly(hd));H(s,hd,1,30);
  for(var sp=0;sp<5;sp++){var a=-PI*0.15-sp*0.12;s.push([[cx+wr*0.2,wy-wr+2],[cx+wr*0.2+RR(R,14,24)*Math.cos(a),wy-wr+2+RR(R,14,24)*Math.sin(a)]]);}
  var buck=[[cx+70,gy],[cx+66,gy-22],[cx+88,gy-22],[cx+84,gy]];if(cx+88<292){s.push(buck);s.push(ellipse(cx+77,gy-22,11,3));s.push(arc(cx+77,gy-22,11,14,PI,TAU));H(s,buck,2.2,90);}
  var barn=RP(4,gy,RR(R,50,60),gy-RR(R,90,100));if(cx-90>60){}SOL(s,sol,barn);var bdr=RP(12,gy,barn[1][0]-10,gy-50);s.push(poly(bdr));s.push([bdr[0],bdr[2]],[bdr[1],bdr[3]]);H(s,RP(4,barn[2][1],barn[1][0],gy-52),RR(R,3.6,4.2),90);
  var fence=[];for(var x=barn[1][0]+10;x<296;x+=RR(R,26,32))s.push([[x,gy-RR(R,8,12)],[x,gy-30]]);s.push([[barn[1][0],gy-26],[296,gy-24]]);
  hills(bg,R,gy-8,RR(R,20,30),RR(R,4.6,5.6),[],RR(R,8,16));gnd(bg,R,gy);
  return fin(s,R,bg,sol.concat([frL,frR]),gy-10);});

S('Cast iron hand pump',['Prime It First','Cold Water, Long Handle','Farmyard Spout','Trough Overflowing','Twelve Strokes Up'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,166,172),cx=RR(R,110,140);
  var base=RP(cx-18,gy,cx+18,gy-10);SOL(s,sol,base);H(s,base,1.6,0);
  var col=[[cx-10,gy-10],[cx-8,gy-70],[cx+8,gy-70],[cx+10,gy-10]];SOL(s,sol,col);for(var r=gy-18;r>gy-68;r-=10)s.push([[cx-9.5,r],[cx+9.5,r]]);H(s,[[cx+3,gy-10],[cx+4,gy-70],[cx+8,gy-70],[cx+10,gy-10]],1,0);
  var cap=[[cx-12,gy-70],[cx-12,gy-76]].concat(arc(cx,gy-76,12,8,PI,TAU)).concat([[cx+12,gy-70]]);SOL(s,sol,cap);H(s,cap,1.4,0);s.push(circle(cx,gy-86,3));
  var sp=[[cx+8,gy-52],[cx+30,gy-52],[cx+36,gy-46],[cx+36,gy-40],[cx+30,gy-44],[cx+8,gy-44]];SOL(s,sol,sp);H(s,sp,1.2,0);
  var ha=RR(R,-0.5,-0.2),hl=RR(R,56,66);s.push(circle(cx-12,gy-74,2.4));var he=[cx-12-hl*Math.cos(ha),gy-74+hl*Math.sin(ha)];s.push([[cx-10,gy-76],[he[0],he[1]-2]],[[cx-10,gy-72],[he[0],he[1]+2]]);s.push(circle(he[0],he[1],3));
  s.push([[cx-4,gy-76],[cx-12,gy-74]]);
  var tx=cx+22,tw=RR(R,70,84),tr=[[tx,gy],[tx-4,gy-28],[tx+tw+4,gy-28],[tx+tw,gy]];SOL(s,sol,tr);H(s,RP(tx,gy-4,tx+tw,gy-20),RR(R,2.6,3),90);s.push([[tx-4,gy-28],[tx+tw+4,gy-28]],[[tx-2,gy-24],[tx+tw+2,gy-24]]);
  for(var d=0;d<6;d++){var dy=gy-38+d*2;s.push([[cx+34+RR(R,-1,1),dy],[cx+34,dy+1]]);}s.push([[cx+34,gy-40],[cx+34,gy-26]]);
  var wv=wave(tx+2,tx+tw-2,gy-27,0.8,8,0);s.push(wv);
  var bk=cx-RR(R,46,56);s.push([[bk-12,gy],[bk-14,gy-24],[bk+14,gy-24],[bk+12,gy]]);s.push(ellipse(bk,gy-24,14,3.4));s.push(arc(bk,gy-24,14,18,PI,TAU));H(s,[[bk+4,gy],[bk+5,gy-23],[bk+14,gy-23],[bk+12,gy]],1.2,0);sol.push(RP(bk-14,gy,bk+14,gy-28));
  var bx=RR(R,180,200);var barn=[[bx+20,gy-30],[bx+20,gy-90],[bx+58,gy-120],[bx+96,gy-90],[bx+96,gy-30]];var BR=barn.concat([[bx+96,gy-30],[bx+20,gy-30]]);
  bg.push(barn);H(bg,RP(bx+20,gy-30,bx+96,gy-90),RR(R,4,5),90);var dr=RP(bx+40,gy-30,bx+76,gy-76);bg.push(poly(dr));bg.push([dr[0],dr[2]],[dr[1],dr[3]]);
  var fen=[];for(var x=4;x<296;x+=RR(R,22,28))bg.push([[x,gy-14],[x,gy-40]]);bg.push([[4,gy-22],[296,gy-22]],[[4,gy-34],[296,gy-34]]);
  hills(bg,R,gy-30,RR(R,18,28),RR(R,5,6),[],RR(R,8,16));gnd(bg,R,gy);
  return fin(s,R,bg,sol,gy-40);});

S('Hand coffee grinder',['Grinding Before Dawn','Crank and Drawer','Burr and Bean','Six Turns Fine','Kitchen Ritual'],function(R){
  var s=[],sol=[],ty=RR(R,148,156),cx=RR(R,130,160),bw=RR(R,46,52),bh=RR(R,44,50);
  var box=RP(cx-bw/2,ty,cx+bw/2,ty-bh);SOL(s,sol,box);for(var p=cx-bw/2+6;p<cx+bw/2;p+=7)s.push([[p,ty],[p,ty-bh]]);
  var dr=RP(cx-bw/2+8,ty-6,cx+bw/2-8,ty-20);s.push(poly(dr));s.push(circle(cx,ty-13,2.4));H(s,RP(cx+bw/2-6,ty,cx+bw/2,ty-bh),1.2,0);
  var tp=RP(cx-bw/2-3,ty-bh,cx+bw/2+3,ty-bh-5);SOL(s,sol,tp);H(s,tp,1,0);
  var bowl=[[cx-18,ty-bh-5]].concat(quad([cx-18,ty-bh-5],[cx-24,ty-bh-18],[cx-20,ty-bh-24],6)).concat([[cx+20,ty-bh-24]]).concat(quad([cx+20,ty-bh-24],[cx+24,ty-bh-18],[cx+18,ty-bh-5],6));SOL(s,sol,bowl);H(s,bowl,RR(R,1.6,2),80);s.push(ellipse(cx,ty-bh-24,20,4));
  s.push([[cx,ty-bh-24],[cx,ty-bh-34]]);s.push(circle(cx,ty-bh-36,2.4));var ca=RR(R,-0.5,0.5);s.push([[cx,ty-bh-34],[cx+34*Math.cos(ca),ty-bh-34+12*Math.sin(ca)]]);var kx=cx+34*Math.cos(ca),ky=ty-bh-34+12*Math.sin(ca);
  var knob=[[kx-2,ky],[kx-3,ky-12],[kx+3,ky-12],[kx+2,ky]];s.push(poly(knob));H(s,knob,1,0);
  for(var b=0;b<RI(R,8,12);b++){var bx=cx+RR(R,-80,90),by=ty-RR(R,1,3);if(Math.abs(bx-cx)<bw/2+6)continue;var be=EP(bx,by,3,2);s.push(poly(be));s.push([[bx-2,by],[bx+2,by]]);sol.push(be);}
  var cup=cx+RR(R,60,80);s.push([[cup-14,ty],[cup-16,ty-22],[cup+16,ty-22],[cup+14,ty]]);s.push(ellipse(cup,ty-22,16,3.5));s.push(arc(cup+18,ty-12,6,7,-PI/2,PI/2));s.push(ellipse(cup,ty+1,24,3));H(s,[[cup-14,ty],[cup-16,ty-22],[cup-6,ty-22],[cup-6,ty]],1.4,90);sol.push(RP(cup-24,ty+3,cup+26,ty-26));
  for(var st=0;st<3;st++)s.push(curve([[cup-6+st*6,ty-28],[cup-10+st*6,ty-38],[cup-4+st*6,ty-48],[cup-8+st*6,ty-58]],4));
  var jar=cx-RR(R,70,86);if(jar>20){var J=RP(jar-14,ty,jar+14,ty-40);SOL(s,sol,J);s.push(rect(jar-16,ty-40,jar+16,ty-46));sol.push(RP(jar-16,ty-40,jar+16,ty-46));H(s,RP(jar-12,ty-4,jar+12,ty-24),1.6,0);s.push(rect(jar-8,ty-26,jar+8,ty-34));}
  tableS(s,R,ty,pick(R,['stripes','tiles','diag']),sol.concat([knob]));
  return s;});

S('Copper pots on a rack',['Seven Pans, One Hook Free','Farmhouse Kitchen','Hung to Dry','Burnished Rows','Saucepan Ladder'],function(R){
  var s=[],sol=[],ry=RR(R,30,36),fy=RR(R,176,182);
  s.push([[20,ry],[280,ry]]);s.push([[20,ry+4],[280,ry+4]]);s.push([[30,ry],[30,4]],[[270,ry],[270,4]]);H(s,RP(20,ry,280,ry+4),1,0);
  var n=RI(R,5,6),sp=240/n,x=34;
  for(var i=0;i<n;i++){var px=34+i*sp+sp/2,r=RR(R,12,sp/2-3),dy=ry+RR(R,40,60),kind=RI(R,0,2);
    s.push([[px,ry+4],[px,ry+10]]);s.push(arc(px,ry+12,2.4,2.4,-PI/2,PI*1.5));
    var hl=[[px-2,ry+14],[px-2,dy-r-2],[px+2,dy-r-2],[px+2,ry+14]];s.push(poly(hl));
    var pan=kind===0?EP(px,dy,r,r):kind===1?[[px-r,dy-r*0.5]].concat(arc(px,dy-r*0.5,r,r*1.2,PI,0).reverse().reverse()):RP(px-r,dy-r,px+r,dy+r*0.6);
    if(kind===1){pan=[[px-r,dy-r*0.4],[px-r,dy+r*0.4]].concat(arc(px,dy+r*0.4,r,r*0.4,PI,0).reverse().map(function(q){return [2*px-q[0],q[1]];})).concat([[px+r,dy-r*0.4]]);}
    SOL(s,sol,pan);s.push(kind===0?circle(px,dy,r*0.72):ellipse(px,dy-r*0.4,r,r*0.25));
    if(kind===0)HX(s,[EP(px,dy,r,r),EP(px,dy,r*0.72,r*0.72)],1.3,RR(R,20,60));else H(s,[[px+r*0.3,dy-r*0.4],[px+r,dy-r*0.4],[px+r,dy+r*0.4],[px+r*0.3,dy+r*0.4]],1.3,0);
    for(var rv=0;rv<2;rv++)s.push(circle(px+(rv?2:-2),dy-r+3,0.8));}
  var ct=fy-RR(R,58,64);var ctr=RP(4,ct,296,ct+8);SOL(s,sol,ctr);H(s,ctr,1.6,0);var cab=RP(4,ct+8,296,fy-6);s.push(poly(cab));
  for(var d=0;d<4;d++){var dx=10+d*72;var D=RP(dx,ct+14,dx+62,fy-10);s.push(poly(D));s.push(rect(dx+6,ct+20,dx+56,fy-16));s.push(circle(d%2?dx+8:dx+54,ct+30,2));}
  var utx=RR(R,180,240);var crock=RP(utx,ct,utx+26,ct-30);SOL(s,sol,crock);H(s,RP(utx,ct-12,utx+26,ct-18),1.4,0);for(var u=0;u<3;u++){var ux=utx+6+u*7;s.push([[ux,ct-30],[ux+(u-1)*4,ct-56]]);s.push(ellipse(ux+(u-1)*4,ct-60,3,4));}
  var bx=RR(R,40,80);var brd=RP(bx,ct,bx+50,ct-34);s.push(poly(brd));s.push(circle(bx+25,ct-30,3));H(s,RP(bx+40,ct,bx+50,ct-34),1.4,90);
  var tl=RR(R,10,12),wl=RP(4,4,296,ct);var tiles=[];HX(tiles,[wl],tl,0);HX(tiles,[wl],tl,90);behind(s,tiles,sol.concat([RP(20,4,280,ry+6),crock,RP(utx-6,ct-30,utx+32,ct-66)]).concat(sol.map(function(P){return P;})).concat([RP(30,ry+6,270,ry+16)]));
  floorS(s,R,fy,RI(R,10,14));return s;});

S('Waffle iron',['Sunday Grid','Batter at the Edges','Hot Plate, Sweet Steam','Grid and Syrup','First One Is the Test'],function(R){
  var s=[],sol=[],ty=RR(R,146,152),cx=RR(R,110,140),r=RR(R,34,38);
  var base=EP(cx,ty-8,r+6,(r+6)*0.3);SOL(s,sol,base);s.push([[cx-r-6,ty-8],[cx-r-6,ty-2]].concat(arc(cx,ty-2,r+6,(r+6)*0.3,PI,0).reverse().map(function(q){return [2*cx-q[0],q[1]];})).concat([[cx+r+6,ty-8]]));
  var plate=EP(cx,ty-12,r,r*0.3);s.push(poly(plate));var grid=[];HX(grid,[plate],3,0);HX(grid,[plate],3.6,90);A(s,grid);
  var lid=[[cx-r,ty-14]].concat(arc(cx-r,ty-14,0.1,0.1,0,0)).concat(arc(cx-r*0.2,ty-14-r*0.9,r*0.95,r*0.95,PI*0.55,PI*1.45).reverse()).concat([[cx+r*0.6,ty-14-r*1.7]]);
  var L=EP(cx-r*0.6,ty-14-r*0.95,r*0.3,r);L=rotateAbout(L,cx-r,ty-14,-0.35);SOL(s,sol,L);var Li=rotateAbout(EP(cx-r*0.6,ty-14-r*0.95,r*0.2,r*0.8),cx-r,ty-14,-0.35);s.push(poly(Li));HX(s,[L,Li],1.4,70);
  var hn=rotateAbout([[cx-r*0.6,ty-14-r*1.95],[cx-r*0.6,ty-14-r*1.95-22]],cx-r,ty-14,-0.35);s.push(hn);var hk=rotateAbout(RP(cx-r*0.6-4,ty-14-r*1.95-22,cx-r*0.6+4,ty-14-r*1.95-40),cx-r,ty-14,-0.35);s.push(poly(hk));H(s,hk,1,0);
  var hb=[[cx+r+6,ty-8],[cx+r+40,ty-12],[cx+r+40,ty-6],[cx+r+6,ty-4]];s.push(poly(hb));H(s,hb,1,0);
  var px=cx+RR(R,96,120),pr=RR(R,30,34);if(px+pr<292){var pl=EP(px,ty-4,pr,pr*0.28);s.push(poly(pl));s.push(ellipse(px,ty-4,pr*0.75,pr*0.2));sol.push(pl);
    for(var w=0;w<2;w++){var wy=ty-8-w*6,sq=[[px-18,wy],[px+18,wy],[px+14,wy-6],[px-14,wy-6]];SOL(s,sol,sq);H(s,sq,1.6,0);for(var g=px-14;g<px+14;g+=5)s.push([[g,wy],[g+1,wy-6]]);}
    s.push(rect(px-4,ty-20,px+4,ty-24));H(s,RP(px-4,ty-20,px+4,ty-24),1,0);var syr=curve([[px+2,ty-24],[px+8,ty-16],[px+4,ty-10]],4);s.push(syr);}
  var jx=cx-r-RR(R,30,40);if(jx>20){var jg=[[jx-12,ty],[jx-14,ty-34],[jx+14,ty-34],[jx+12,ty]];SOL(s,sol,jg);s.push([[jx+14,ty-30],[jx+22,ty-26],[jx+20,ty-12],[jx+12,ty-10]]);H(s,RP(jx-12,ty-14,jx+12,ty),1.6,0);s.push([[jx-16,ty-34],[jx-20,ty-38]]);}
  for(var st=0;st<3;st++)s.push(curve([[cx-10+st*12,ty-20],[cx-14+st*12,ty-34],[cx-8+st*12,ty-48],[cx-12+st*12,ty-62]],4));
  tableS(s,R,ty,pick(R,['stripes','tiles','diag']),sol.concat([hk,hb]));return s;});

S('Abacus',['Counting in Beads','Nine and Carry','Ledger Before Paper','Merchant\'s Frame','Rows of Ten'],function(R){
  var s=[],sol=[],ty=RR(R,152,158),cx=RR(R,140,160),w=RR(R,150,170),h=RR(R,90,100),ang=RR(R,-0.04,0.04);
  var F=RP(cx-w/2,ty,cx+w/2,ty-h);var Fi=RP(cx-w/2+8,ty-8,cx+w/2-8,ty-h+8);SOL(s,sol,F);s.push(poly(Fi));s.push(rect(cx-w/2+3,ty-3,cx+w/2-3,ty-h+3));
  var bar=ty-h+8+(h-16)*0.3;s.push([[cx-w/2+8,bar],[cx+w/2-8,bar]]);s.push([[cx-w/2+8,bar+3],[cx+w/2-8,bar+3]]);
  var nr=RI(R,8,9),cw=(w-16)/nr;for(var c=0;c<nr;c++){var x=cx-w/2+8+cw*(c+0.5);s.push([[x,ty-h+8],[x,ty-8]]);
    var up=RI(R,0,2),dn=RI(R,0,5);for(var b=0;b<2;b++){var by=b<up?bar-5-b*7:ty-h+13+b*7;var bd=[[x-cw*0.42,by],[x,by-3.2],[x+cw*0.42,by],[x,by+3.2]];s.push(poly(bd));}
    for(var b2=0;b2<5;b2++){var by2=b2<dn?bar+9+b2*7:ty-13-(4-b2)*7;var bd2=[[x-cw*0.42,by2],[x,by2-3.2],[x+cw*0.42,by2],[x,by2+3.2]];s.push(poly(bd2));if(b2<dn&&c%3===0)H(s,bd2,1.4,0);}}
  s.push([[cx-w/2+4,ty],[cx-w/2+4,ty+4],[cx+w/2-4,ty+4],[cx+w/2-4,ty]]);
  var bk=RP(cx+w/2+8,ty,cx+w/2+44,ty-8);if(cx+w/2+44<294){SOL(s,sol,bk);H(s,bk,1.4,0);s.push(rect(cx+w/2+10,ty-8,cx+w/2+42,ty-14));sol.push(RP(cx+w/2+10,ty-8,cx+w/2+42,ty-14));}
  var pen=[[cx-w/2-40,ty-2],[cx-w/2-8,ty-6]];if(cx-w/2-40>6){s.push(pen);s.push([[cx-w/2-40,ty-2],[cx-w/2-44,ty-1]]);}
  tableS(s,R,ty+4,pick(R,['stripes','tiles','diag']),sol.concat([RP(cx-w/2-2,ty+2,cx+w/2+2,ty-h-2)]));return s;});

S('Chess game in progress',['Your Move','Queen\'s Gambit Pending','Endgame by Lamplight','Check, Not Mate','Two Kings Standing'],function(R){
  var s=[],sol=[],ty=RR(R,150,156),cx=RR(R,140,160),bw=RR(R,170,186),bd=RR(R,40,48);
  var near=ty,far=ty-bd,P=[[cx-bw/2,near],[cx+bw/2,near],[cx+bw*0.36,far],[cx-bw*0.36,far]];SOL(s,sol,P);
  function pt(u,v){var y=near+(far-near)*v,hw=bw/2+(bw*0.36-bw/2)*v;return [cx-hw+2*hw*u,y];}
  for(var i=0;i<=8;i++){s.push([pt(i/8,0),pt(i/8,1)]);s.push([pt(0,i/8),pt(1,i/8)]);}
  for(var a=0;a<8;a++)for(var b=0;b<8;b++)if((a+b)%2){H(s,[pt(a/8,b/8),pt((a+1)/8,b/8),pt((a+1)/8,(b+1)/8),pt(a/8,(b+1)/8)],1.6,0);}
  s.push([[cx-bw/2,near],[cx-bw/2,near+6],[cx+bw/2,near+6],[cx+bw/2,near]]);
  function piece(u,v,kind){var p=pt(u,v),sc=0.7+0.3*(1-v),x=p[0],y=p[1]-1,h=(kind==='k'?34:kind==='q'?30:kind==='r'?20:kind==='n'?24:kind==='b'?26:14)*sc,w=7*sc;
    var base=[[x-w,y],[x-w,y-3*sc],[x+w,y-3*sc],[x+w,y]];var body=[[x-w*0.7,y-3*sc],[x-w*0.4,y-h*0.7],[x+w*0.4,y-h*0.7],[x+w*0.7,y-3*sc]];var out=[base,body];
    if(kind==='p'){out.push(EP(x,y-h*0.85,w*0.5,w*0.5));}
    else if(kind==='r'){out.push(RP(x-w*0.6,y-h*0.7,x+w*0.6,y-h));out.push(merlons(x-w*0.6,x+w*0.6,y-h,2*sc,w*0.4));}
    else if(kind==='n'){out.push([[x-w*0.4,y-h*0.7],[x-w*0.5,y-h],[x+w*0.2,y-h*1.05],[x+w*0.9,y-h*0.75],[x+w*0.6,y-h*0.65],[x+w*0.1,y-h*0.75],[x+w*0.4,y-h*0.7]]);}
    else if(kind==='b'){out.push(EP(x,y-h*0.85,w*0.45,w*0.7));out.push(circle(x,y-h*1.02,1.2));}
    else if(kind==='q'){out.push([[x-w*0.6,y-h*0.7],[x-w*0.8,y-h],[x-w*0.3,y-h*0.86],[x,y-h*1.04],[x+w*0.3,y-h*0.86],[x+w*0.8,y-h],[x+w*0.6,y-h*0.7]]);}
    else{out.push(RP(x-w*0.5,y-h*0.7,x+w*0.5,y-h*0.88));out.push([[x,y-h*0.88],[x,y-h*1.1]],[[x-3*sc,y-h],[x+3*sc,y-h]]);}
    return out;}
  var pcs=[];var kinds=['k','q','r','r','n','b','b','p','p','p','p','p','n','p'];var nP=RI(R,10,14),used={};
  for(var k=0;k<nP;k++){var u=RI(R,0,7),v=RI(R,0,7);if(used[u+','+v])continue;used[u+','+v]=1;pcs.push({u:u,v:v,k:kinds[k],dark:k%2});}
  pcs.sort(function(A1,B1){return B1.v-A1.v;});
  pcs.forEach(function(q){var shapes=piece((q.u+0.5)/8,(q.v+0.5)/8,q.k);var pp=shapes.map(function(sh){return sh;});
    var outline=[];shapes.forEach(function(sh){s.push(sh===shapes[0]||sh===shapes[1]?poly(sh):sh);});if(q.dark){H(s,shapes[1],1,0);}
    shapes.forEach(function(sh){sol.push(sh);});});
  var clx=cx+bw/2-RR(R,10,20);var cl=RP(clx-14,far-2,clx+14,far-22);if(clx+14<294){SOL(s,sol,cl);s.push(circle(clx-6,far-12,4),circle(clx+6,far-12,4));H(s,RP(clx-14,far-22,clx+14,far-26),1,0);s.push(rect(clx-14,far-22,clx+14,far-26));}
  var lp=RR(R,20,40);s.push([[lp,far-2],[lp,far-80]]);var shd=[[lp-18,far-80],[lp+18,far-80],[lp+10,far-104],[lp-10,far-104]];SOL(s,sol,shd);H(s,shd,1.8,0);s.push(ellipse(lp,far-2,12,3));
  var bg=[];tableS(bg,R,far-2,pick(R,['stripes','tiles','diag']),[]);behind(s,bg,sol.concat([P]));return s;});

S('Birdhouse on a post',['Vacancy, Spring','Round Door Rental','Wren\'s Cottage','Post in the Garden','Morning Visitors'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,170,176),cx=RR(R,130,170),bw=RR(R,40,46),bh=RR(R,40,46),by=gy-RR(R,64,74);
  var post=RP(cx-4,gy,cx+4,by);SOL(s,sol,post);H(s,RP(cx+1,gy,cx+4,by),1,0);
  var bx=RP(cx-bw/2,by,cx+bw/2,by-bh);SOL(s,sol,bx);for(var p=cx-bw/2+6;p<cx+bw/2;p+=6)s.push([[p,by],[p,by-bh]]);
  var rf=[[cx-bw/2-8,by-bh+4],[cx,by-bh-26],[cx+bw/2+8,by-bh+4]];SOL(s,sol,rf);var sh=[];for(var r=0;r<5;r++){var t=(r+1)/6,y=by-bh+4-26*t;sh.push([[cx-(bw/2+8)*(1-t),y],[cx+(bw/2+8)*(1-t),y]]);}A(s,sh);
  for(var r2=0;r2<4;r2++){var t2=(r2+0.5)/6,y2=by-bh+4-26*t2;for(var x=cx-(bw/2+8)*(1-t2)+5;x<cx+(bw/2+8)*(1-t2);x+=7)s.push([[x,y2],[x,y2+4.3]]);}
  var hole=EP(cx,by-bh*0.55,6,6);s.push(poly(hole));H(s,hole,1,0);sol.push(hole);s.push([[cx,by-bh*0.3],[cx+sgn(R)*0,by-bh*0.3+0]]);s.push([[cx-6,by-bh*0.3+2],[cx+6,by-bh*0.3+2]]);
  var dir=sgn(R);perched(s,cx+dir*4,by-bh*0.3+2,4,dir);
  var fl=[];var nf=RI(R,6,9);for(var f=0;f<nf;f++){var fx=RR(R,10,290),fh=RR(R,20,46);if(Math.abs(fx-cx)<14)continue;s.push(curve([[fx,gy],[fx+RR(R,-4,4),gy-fh*0.6],[fx+RR(R,-6,6),gy-fh]],4));var hd=scallop(fx+0,gy-fh-4,RR(R,4,6),RR(R,4,6),RI(R,5,7),0.4);s.push(hd);sol.push(hd.slice(0,-1));s.push(circle(fx,gy-fh-4,1.4));
    s.push(lens([fx,gy-fh*0.4],[fx+8,gy-fh*0.5-4],2.4));}
  var fence=[];for(var x2=4;x2<296;x2+=8){fence.push([x2,gy-6],[x2,gy-36],[x2+3,gy-40],[x2+6,gy-36],[x2+6,gy-6]);}bg.push(fence);bg.push([[4,gy-14],[296,gy-14]],[[4,gy-30],[296,gy-30]]);
  hills(bg,R,gy-30,RR(R,14,24),RR(R,5,6),[],RR(R,8,16));gnd(bg,R,gy,RR(R,4,5));
  return fin(s,R,bg,sol,gy-40);});

S('Steamer trunk',['Bound for Southampton','Labels from Everywhere','Brass Corners','Attic Treasure','Packed for a Season'],function(R){
  var s=[],sol=[],fy=RR(R,170,176),cx=RR(R,140,160),w=RR(R,130,146),h=RR(R,64,72),lid=RR(R,20,26);
  var B=RP(cx-w/2,fy-4,cx+w/2,fy-4-h);SOL(s,sol,B);var L=[[cx-w/2,fy-4-h],[cx-w/2+4,fy-4-h-lid]].concat(quad([cx-w/2+4,fy-4-h-lid],[cx,fy-4-h-lid-12],[cx+w/2-4,fy-4-h-lid],10)).concat([[cx+w/2,fy-4-h]]);SOL(s,sol,L);
  var slats=[];for(var k=0;k<5;k++){var x=cx-w/2+10+k*(w-20)/4;s.push([[x-3,fy-4],[x-3,fy-4-h]],[[x+3,fy-4],[x+3,fy-4-h]]);H(s,RP(x-3,fy-4,x+3,fy-4-h),RR(R,3,4),0);}
  s.push([[cx-w/2,fy-4-h*0.5],[cx+w/2,fy-4-h*0.5]],[[cx-w/2,fy-4-h*0.5-4],[cx+w/2,fy-4-h*0.5-4]]);
  [[cx-w/2,fy-4],[cx+w/2,fy-4],[cx-w/2,fy-4-h],[cx+w/2,fy-4-h]].forEach(function(c){var dx=c[0]<cx?1:-1,dy=c[1]>fy-10?-1:1;var cor=[[c[0],c[1]],[c[0]+dx*10,c[1]],[c[0],c[1]+dy*10]];s.push(poly(cor));H(s,cor,1,0);});
  var lk=RP(cx-6,fy-4-h+2,cx+6,fy-4-h+14);s.push(poly(lk));H(s,lk,1.2,0);s.push(circle(cx,fy-4-h+9,1.4));
  var labels=[];for(var l=0;l<RI(R,3,5);l++){var lx=cx-w/2+RR(R,10,w-40),ly=fy-4-RR(R,10,h-24),lw=RR(R,16,22),lh=RR(R,10,14);if(Math.abs(lx+lw/2-cx)<14)continue;var lb=rotateAbout(R()<0.5?EP(lx+lw/2,ly,lw/2,lh/2):RP(lx,ly-lh/2,lx+lw,ly+lh/2),lx+lw/2,ly,RR(R,-0.3,0.3));s.push(poly(lb));H(s,lb,RR(R,1.6,2.4),RR(R,-60,60));}
  s.push([[cx-w/2-6,fy-4-h*0.5-10],[cx-w/2,fy-4-h*0.5-10]],[[cx-w/2-6,fy-4-h*0.5+4],[cx-w/2,fy-4-h*0.5+4]]);s.push(arc(cx-w/2-6,fy-4-h*0.5-3,4,7,PI*0.5,PI*1.5));
  H(s,L,RR(R,2.6,3.2),RR(R,-10,10));
  var hb=RR(R,40,70);var hat=[[cx+w/2-hb,fy-4-h-lid-4]];var hx=cx+RR(R,-20,20);s.push(ellipse(hx,fy-4-h-lid-8,24,5));var cr=[[hx-14,fy-4-h-lid-8],[hx-12,fy-4-h-lid-30],[hx+12,fy-4-h-lid-30],[hx+14,fy-4-h-lid-8]];SOL(s,sol,cr);H(s,RP(hx-13,fy-4-h-lid-12,hx+13,fy-4-h-lid-16),1,0);sol.push(EP(hx,fy-4-h-lid-8,24,5));
  var win1=RP(30,24,90,100);var beam=[[4,4],[296,4]];s.push([[4,20],[296,20]]);H(s,RP(4,4,296,20),2,0);
  var wl=RP(4,20,296,fy-12);var bg=[rows(4,296,24,fy-14,RR(R,4.4,5.2))];var wp=RR(R,20,40),W=RP(wp,30,wp+50,94);s.push(poly(W));s.push([[wp+25,30],[wp+25,94]],[[wp,62],[wp+50,62]]);H(s,RP(wp,30,wp+50,62),2.6,40);
  behind(s,bg,sol.concat([W]));s.push([[4,fy-12],[296,fy-12]]);floorS(s,R,fy-12,RI(R,10,14));return s;});

S('Carriage clock',['Quarter to Midnight','Brass and Bevelled Glass','Mantel Time','Traveller\'s Hours','Tick, Tock, Tea'],function(R){
  var s=[],sol=[],ty=RR(R,150,156),cx=RR(R,130,160),w=RR(R,56,62),h=RR(R,78,86);
  var base=RP(cx-w/2-6,ty,cx+w/2+6,ty-8);SOL(s,sol,base);H(s,base,1.4,0);var top=RP(cx-w/2-4,ty-8-h,cx+w/2+4,ty-16-h);SOL(s,sol,top);H(s,top,1.2,0);
  var B=RP(cx-w/2,ty-8,cx+w/2,ty-8-h);SOL(s,sol,B);[cx-w/2+4,cx+w/2-4].forEach(function(x){s.push(rect(x-3,ty-8,x+3,ty-8-h));H(s,RP(x-3,ty-8,x+3,ty-8-h),1,90);});
  var dy=ty-8-h*0.45,dr=w/2-12;s.push(circle(cx,dy,dr+3));s.push(circle(cx,dy,dr));for(var k=0;k<12;k++){var a=k*TAU/12;s.push([[cx+dr*0.82*Math.cos(a),dy+dr*0.82*Math.sin(a)],[cx+dr*Math.cos(a),dy+dr*Math.sin(a)]]);}
  var ha=RR(R,0,TAU),ma=RR(R,0,TAU);s.push([[cx,dy],[cx+dr*0.5*Math.cos(ha),dy+dr*0.5*Math.sin(ha)]]);s.push([[cx,dy],[cx+dr*0.8*Math.cos(ma),dy+dr*0.8*Math.sin(ma)]]);s.push(circle(cx,dy,1.4));
  var esc=RP(cx-10,ty-8-h+4,cx+10,ty-8-h+14);s.push(poly(esc));s.push(circle(cx,ty-8-h+9,3));
  var bot=RP(cx-w/2+8,ty-12,cx+w/2-8,dy+dr+6);s.push(poly(bot));H(s,bot,1.6,45);
  var hd=[[cx-14,ty-16-h],[cx-14,ty-24-h]].concat(arc(cx,ty-24-h,14,10,PI,TAU)).concat([[cx+14,ty-16-h]]);s.push(hd);s.push(arc(cx,ty-24-h,10,6,PI,TAU));
  H(s,RP(cx+w/2-10,ty-10,cx+w/2-7,ty-8-h+2),0.9,0);
  var cd=cx+RR(R,62,80);if(cd<280){var C=RP(cd-6,ty,cd+6,ty-RR(R,40,54));SOL(s,sol,C);var ct=C[2][1];s.push(ellipse(cd,ty,14,3));s.push([[cd,ct],[cd,ct-4]]);var fl=lens([cd,ct-4],[cd,ct-18],3.4);s.push(poly(fl));H(s,RP(cd+2,ty,cd+6,ct),0.9,0);sol.push(EP(cd,ct-11,5,9));}
  var bk=cx-RR(R,64,80);if(bk>20){for(var b=0;b<3;b++){var bh=RR(R,8,10),by=ty-b*bh;var BK=RP(bk-24+b*2,by,bk+24-b*3,by-bh);SOL(s,sol,BK);H(s,RP(bk+14-b*3,by,bk+24-b*3,by-bh),1.2,90);}}
  var ml=ty;s.push([[4,ml],[296,ml]]);var shelf=RP(4,ml,296,ml+10);H(s,shelf,1.4,0);s.push([[4,ml+10],[296,ml+10]]);
  var fire=RP(60,ml+10,240,196);s.push([[60,196],[60,ml+10]],[[240,196],[240,ml+10]]);var op=archP(150,196,56,10);s.push(op);s.push(archP(150,196,62,10));
  var wl=RP(4,4,296,ml);var bg=[];var g=RR(R,9,11);HX(bg,[wl],g,0);for(var x=4;x<296;x+=g*2)bg.push([[x,4],[x,ml]]);
  var pic=RP(cx-50,30,cx+50,ty-8-h-40);if(ty-8-h-40>46){s.push(poly(pic));s.push(rect(cx-44,36,cx+44,ty-8-h-46));H(s,[[cx-44,ty-8-h-46],[cx-20,60],[cx,ty-8-h-56],[cx+20,56],[cx+44,ty-8-h-46]],2.4,0);sol.push(pic);}
  behind(s,bg,sol);return s;});

S('Fruit tart',['Glazed and Sliced','Apricot Rings','Pâtisserie Window','One Slice Missing','Custard Under Fruit'],function(R){
  var s=[],sol=[],ty=RR(R,146,152),cx=RR(R,130,160),r=RR(R,58,66);
  var stand=[[cx-r-6,ty-20]].concat(arc(cx,ty-20,r+6,(r+6)*0.25,PI,0).reverse().map(function(q){return [2*cx-q[0],q[1]];})).concat([[cx+r+6,ty-20]]);
  s.push(ellipse(cx,ty-20,r+6,(r+6)*0.25));s.push([[cx-6,ty-14],[cx-4,ty-4],[cx-18,ty],[cx+18,ty],[cx+4,ty-4],[cx+6,ty-14]]);sol.push(EP(cx,ty-20,r+7,(r+6)*0.25+1));
  var cut=RR(R,-0.6,0.6);var crust=[];var ry=r*0.26;var top=ty-30;s.push(ellipse(cx,top,r,ry));var side=[[cx-r,top],[cx-r,top+8]].concat(arc(cx,top+8,r,ry,PI,0).reverse().map(function(q){return [2*cx-q[0],q[1]];})).concat([[cx+r,top]]);s.push(side);
  for(var f=0;f<28;f++){var a=f/28*PI;s.push([[cx-r*Math.cos(a),top+8+ry*Math.sin(a)],[cx-r*Math.cos(a),top+ry*Math.sin(a)]]);}sol.push(EP(cx,top,r,ry));sol.push(RP(cx-r,top,cx+r,top+8+ry));
  for(var ring=0;ring<3;ring++){var rr=r*(0.82-ring*0.25),n=Math.round(12-ring*3);for(var k=0;k<n;k++){var a2=k/n*TAU+ring*0.3,px=cx+rr*Math.cos(a2),py=top+rr*0.26*Math.sin(a2);var sl=rotateAbout(EP(px,py,7*(1-ring*0.2),3.4*(1-ring*0.2)),px,py,a2+PI/2);s.push(poly(sl));H(s,sl,1,a2*57);}}
  s.push(circle(cx,top,4));H(s,EP(cx,top,3,1.5),1,0);
  var sx=cx+r+RR(R,24,30);if(sx+30<294){var pl=EP(sx+8,ty-2,26,6);s.push(poly(pl));sol.push(pl);var wd=[[sx-8,ty-4],[sx+28,ty-10],[sx+22,ty-18],[sx-8,ty-12]];s.push(poly(wd));H(s,[[sx-8,ty-12],[sx+22,ty-18],[sx+28,ty-10]],1.6,0);
    var fk=[[sx-24,ty-2],[sx+4,ty-6]];s.push(fk);for(var t=0;t<3;t++)s.push([[sx+4,ty-6+t*1.2],[sx+12,ty-7+t*1.2]]);}
  var cup=cx-r-RR(R,30,40);if(cup>24){s.push([[cup-12,ty],[cup-14,ty-24],[cup+14,ty-24],[cup+12,ty]]);s.push(ellipse(cup,ty-24,14,3));s.push(arc(cup-16,ty-12,5,6,PI/2,PI*1.5));H(s,RP(cup+4,ty-2,cup+12,ty-22),1.2,90);sol.push(RP(cup-22,ty+2,cup+16,ty-28));}
  tableS(s,R,ty,pick(R,['stripes','tiles','diag']),sol);return s;});

S('Pretzels on a board',['Salt and Twist','Bakery Knots','Beer Garden Snack','Three Loops Each','Oven Brown'],function(R){
  var s=[],sol=[],ty=RR(R,146,152),cx=RR(R,130,160);
  var bd=[[cx-100,ty],[cx-92,ty-20],[cx+86,ty-20],[cx+96,ty]];SOL(s,sol,bd);s.push([[cx-100,ty],[cx-100,ty+6],[cx+96,ty+6],[cx+96,ty]]);for(var g=0;g<4;g++)s.push(curve([[cx-96+g*2,ty-4-g*4],[cx,ty-5-g*4+RR(R,-1,1)],[cx+92-g*2,ty-4-g*4]],4));
  var hl=[[cx+96,ty-10],[cx+120,ty-12],[cx+122,ty-6],[cx+96,ty-4]];s.push(poly(hl));s.push(circle(cx+116,ty-9,1.6));
  function pretzel(x,y,sc,a){var C=[[-0.82,0.5],[-0.55,0.3],[-0.1,-0.05],[0.35,-0.45],[0.75,-0.62],[1.0,-0.2],[0.9,0.45],[0.45,0.85],[0,0.92],[-0.45,0.85],[-0.9,0.45],[-1.0,-0.2],[-0.75,-0.62],[-0.35,-0.45],[0.1,-0.05],[0.55,0.3],[0.82,0.5]];
    var P=curve(C.map(function(p){return [x+p[0]*22*sc,y+p[1]*20*sc];}),6);P=rotateAbout(P,x,y,a);var w=3.4*sc,L=[],Rr=[];
    for(var i=0;i<P.length;i++){var p0=P[Math.max(0,i-1)],p1=P[Math.min(P.length-1,i+1)],dx=p1[0]-p0[0],dy=p1[1]-p0[1],l=Math.hypot(dx,dy)||1;L.push([P[i][0]-dy/l*w,P[i][1]+dx/l*w]);Rr.push([P[i][0]+dy/l*w,P[i][1]-dx/l*w]);}
    s.push(L.concat(Rr.slice().reverse()).concat([L[0]]));for(var k=3;k<P.length-2;k+=3){s.push([L[k],Rr[k]]);}
    for(var k2=2;k2<P.length;k2+=9){var q=P[k2];s.push(rect(q[0]-0.8,q[1]-0.6,q[0]+0.8,q[1]+0.6));}
    var hull=[];for(var t=0;t<16;t++){var an=t/16*TAU;hull.push([x+Math.cos(an)*25*sc,y+Math.sin(an)*22*sc]);}sol.push(rotateAbout(hull,x,y,a));}
  var n=RI(R,2,3);for(var i=0;i<n;i++){pretzel(cx-60+i*(120/(n-1||1)),ty-40-(i%2)*6,RR(R,1.1,1.25),RR(R,-0.3,0.3));}
  var mx=cx+RR(R,110,130);if(mx<270){var mug=RP(mx,ty,mx+26,ty-50);SOL(s,sol,mug);s.push(arc(mx+26,ty-26,10,14,-PI/2,PI/2));s.push(arc(mx+26,ty-26,5,8,-PI/2,PI/2));H(s,RP(mx+2,ty-4,mx+24,ty-36),2,0);var fm=scallop(mx+13,ty-50,15,6,6,0.25);s.push(fm);sol.push(fm.slice(0,-1));}
  var mu=cx-RR(R,114,126);if(mu>20){s.push([[mu-10,ty],[mu-10,ty-16],[mu+10,ty-16],[mu+10,ty]]);s.push(ellipse(mu,ty-16,10,3));H(s,RP(mu-10,ty-8,mu+10,ty-2),1.4,0);s.push([[mu+4,ty-16],[mu+18,ty-30]]);sol.push(RP(mu-11,ty,mu+11,ty-19));}
  for(var sa=0;sa<RI(R,8,12);sa++){var sx=cx+RR(R,-90,90),sy=ty-RR(R,2,16);s.push(rect(sx-0.7,sy-0.5,sx+0.7,sy+0.5));}
  tableS(s,R,ty+6,pick(R,['stripes','tiles','diag']),sol);return s;});

S('Sundial in a garden',['Noon Exactly','Shadow Keeper','Hours of Sun Only','Gnomon and Roses','Garden Time'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,168,174),cx=RR(R,130,170);
  var ped=[[cx-14,gy-8],[cx-10,gy-60],[cx+10,gy-60],[cx+14,gy-8]];SOL(s,sol,ped);for(var r=gy-16;r>gy-58;r-=8)s.push([[cx-12,r],[cx+12,r]]);H(s,[[cx+4,gy-8],[cx+6,gy-60],[cx+10,gy-60],[cx+14,gy-8]],1.2,0);
  var bs=RP(cx-24,gy,cx+24,gy-8);SOL(s,sol,bs);H(s,bs,1.6,0);var cap=RP(cx-16,gy-60,cx+16,gy-66);SOL(s,sol,cap);
  var dial=EP(cx,gy-70,40,10);SOL(s,sol,dial);s.push(ellipse(cx,gy-70,32,8));for(var k=0;k<13;k++){var a=PI+k*PI/12;s.push([[cx+32*Math.cos(a),gy-70+8*Math.sin(a)],[cx+40*Math.cos(a),gy-70+10*Math.sin(a)]]);}
  var gn=[[cx-2,gy-70],[cx+20,gy-70],[cx-2,gy-92]];SOL(s,sol,gn);H(s,gn,1,0);var sa=RR(R,0.2,0.8);var shp=[[cx,gy-70],[cx+28*Math.cos(sa+PI*0.5),gy-70+7*Math.sin(sa+PI*0.5)],[cx+4,gy-70]];H(s,shp.concat([]),1,0);s.push(shp);
  var path=[[cx-24,gy],[cx-60,196]],path2=[[cx+24,gy],[cx+60,196]];s.push(path,path2);for(var p=0;p<5;p++){var y=gy+4+p*5,w=24+36*(y-gy)/(196-gy);s.push([[cx-w,y],[cx+w,y]]);}
  var bed=[];for(var b=0;b<2;b++){var x0=b?cx+70:20,x1=b?280:cx-70;if(x1-x0<20)continue;var hd=[];for(var x=x0;x<x1;x+=RR(R,10,14)){var rr=RR(R,6,9),yy=gy-RR(R,12,30);var rose=spiral(x,yy,0.6,rr,2.2,R()*6);s.push(rose);s.push([[x,yy+rr],[x+RR(R,-3,3),gy]]);sol.push(EP(x,yy,rr+0.6,rr+0.6));s.push(lens([x,yy+rr+6],[x+10,yy+rr+2],3));}}
  var hedge=[];for(var x2=4;x2<296;x2+=10)hedge.push([x2,gy-48-3*Math.sin(x2/7)]);hedge.push([296,gy-48]);bg.push(hedge);H(bg,hedge.concat([[296,gy-30],[4,gy-30]]),RR(R,2.4,3),RR(R,40,60));
  var arbor=RR(R,20,40)<cx-90;gnd(bg,R,gy,RR(R,4.6,5.4),RR(R,4,12));
  return fin(s,R,bg,sol.concat([[[cx-24,gy],[cx-60,196],[cx+60,196],[cx+24,gy]]]),gy-50);});

// ---- Daily Super Sketch ----
var MASTER={name:"Clockmaker's workshop",titles:['Forty Clocks, One Time','Bench Under the Lamp','Escapements and Springs','The Repairer\'s Wall','A Tick in Every Corner'],build:function(R){
  function gear(cx,cy,r,n,a0){var p=[];for(var i=0;i<n;i++){var a=a0+i*TAU/n,d=TAU/n;[[a,r],[a+d*0.15,r+1.8],[a+d*0.45,r+1.8],[a+d*0.6,r]].forEach(function(q){p.push([cx+q[1]*Math.cos(q[0]),cy+q[1]*Math.sin(q[0])]);});}p.push(p[0]);return p;}
  var s=[],sol=[],bg=[],bt=RR(R,150,154),fy=RR(R,186,190),sy=RR(R,84,88);
  var wx=RR(R,12,20),ww=RR(R,56,64),W=RP(wx,18,wx+ww,sy-6);SOL(s,sol,W);var sill=RP(wx-4,sy-6,wx+ww+4,sy-1);SOL(s,sol,sill);H(s,sill,1.2,0);
  for(var c=1;c<3;c++)s.push([[wx+c*ww/3,18],[wx+c*ww/3,sy-6]]);for(var r=1;r<4;r++)s.push([[wx,18+r*(sy-24)/4],[wx+ww,18+r*(sy-24)/4]]);
  var roofs=[[wx,70]];for(var x=wx;x<wx+ww;x+=RR(R,10,16))roofs.push([x+4,RR(R,52,64)],[x+10,RR(R,62,70)]);roofs.push([wx+ww,66]);var RF=roofs.concat([[wx+ww,sy-6],[wx,sy-6]]);
  clipIn(s,[roofs],W,[]);var rh=[];HX(rh,[RF],3.6,RR(R,30,60));clipIn(s,rh,W,[]);
  var x0=wx+ww+12,clocks=[];
  for(var t=0;t<120&&clocks.length<8;t++){var rr=RR(R,8,15),pend=rr>11&&R()<0.5,cx=RR(R,x0+rr,293-rr),cy=RR(R,14+rr,sy-8-rr-(pend?24:0)),ok=true;
    clocks.forEach(function(q){var dx=Math.abs(q[0]-cx),top=Math.min(cy-rr,q[1]-q[2]),bot=Math.max(cy+rr+(pend?24:0),q[1]+q[2]+(q[3]?24:0));
      if(dx<rr+q[2]+5&&!(cy-rr>q[1]+q[2]+(q[3]?24:0)+5||q[1]-q[2]>cy+rr+(pend?24:0)+5))ok=false;});
    if(ok)clocks.push([cx,cy,rr,pend]);}
  clocks.forEach(function(q){var cx=q[0],cy=q[1],r=q[2];
    if(q[3]){var pb=RP(cx-r*0.45,cy+r,cx+r*0.45,cy+r+24);SOL(s,sol,pb);var sw=RR(R,-4,4);s.push([[cx,cy+r],[cx+sw,cy+r+18]]);s.push(circle(cx+sw,cy+r+19,3));H(s,EP(cx+sw,cy+r+19,2,2),1,0);}
    var o=EP(cx,cy,r+2.5,r+2.5);SOL(s,sol,o);s.push(spiral(cx,cy,r,r+2.5,3,RR(R,0,6)));
    for(var k=0;k<12;k+=3){var a=k*TAU/12,l=0.74;s.push([[cx+r*l*Math.cos(a),cy+r*l*Math.sin(a)],[cx+r*0.95*Math.cos(a),cy+r*0.95*Math.sin(a)]]);}
    var ha=RR(R,0,TAU),ma=RR(R,0,TAU);s.push([[cx+r*0.5*Math.cos(ha),cy+r*0.5*Math.sin(ha)],[cx,cy],[cx+r*0.78*Math.cos(ma),cy+r*0.78*Math.sin(ma)]]);s.push(circle(cx,cy,1.2));
    s.push([[cx,cy-r-2.5],[cx,cy-r-6]]);});
  var shelf=RP(x0-4,sy-2,296,sy+3);SOL(s,sol,shelf);H(s,shelf,1.2,0);[x0+10,250].forEach(function(bx){s.push([[bx,sy+3],[bx,sy+14],[bx+10,sy+3]]);});
  var items=[];for(var ix=x0+6;ix<284;){var kind=RI(R,0,2),w=kind===0?16:kind===1?10:20;if(ix+w>292)break;
    if(kind===0){var dome=[[ix,sy-2]].concat(arc(ix+8,sy-14,8,12,PI,TAU)).concat([[ix+16,sy-2]]);s.push(dome);s.push(circle(ix+8,sy-10,4));s.push([[ix+8,sy-10],[ix+8,sy-13]]);sol.push(dome.concat([[ix,sy-2]]));}
    else if(kind===1){var J=RP(ix,sy-2,ix+10,sy-RR(R,10,16));SOL(s,sol,J);H(s,RP(ix+1,sy-4,ix+9,sy-8),1,0);s.push(rect(ix-1,J[2][1],ix+11,J[2][1]-2));}
    else{var mc=[[ix,sy-2],[ix,sy-14]].concat(arc(ix+10,sy-14,10,8,PI,TAU)).concat([[ix+20,sy-2]]);SOL(s,sol,mc);s.push(circle(ix+10,sy-12,5));H(s,RP(ix,sy-2,ix+20,sy-5),1,0);}
    ix+=w+RR(R,6,12);}
  var stripes=[];var g=RR(R,11,12.5),zp=[],dz=1;for(var x2=6;x2<296;x2+=g){zp.push(dz>0?[x2,4]:[x2,bt-1],dz>0?[x2,bt-1]:[x2,4]);dz=-dz;}stripes.push(zp);
  bg.push([[4,sy+3],[296,sy+3]]);A(bg,stripes.filter(function(q){return q.length;}));
  var top=RP(4,bt,296,bt+8);SOL(s,sol,top);H(s,top,1.7,0);var ap=RP(4,bt+8,296,bt+30);s.push(poly(ap));
  for(var d=0;d<4;d++){var dx=14+d*70,D=RP(dx,bt+11,dx+60,bt+27);s.push(poly(D));s.push(rect(dx+26,bt+17,dx+34,bt+21));H(s,RP(dx,bt+24,dx+60,bt+27),1,0);}
  [10,284].forEach(function(lx){var L=RP(lx,bt+30,lx+6,fy);s.push(poly(L));H(s,L,1.3,0);});s.push([[16,fy-12],[284,fy-12]]);H(s,RP(16,bt+30,284,fy-12),RR(R,3.2,3.8),0);
  var wc=RR(R,130,160),wy=bt-30,wr=22;s.push([[wc-14,bt],[wc-6,wy+wr-2]],[[wc+14,bt],[wc+6,wy+wr-2]]);
  var cs=EP(wc,wy,wr+3,wr+3);SOL(s,sol,cs);s.push(spiral(wc,wy,wr,wr+3,4,0));s.push(circle(wc,wy-wr-6,3.4));s.push(rect(wc-2,wy-wr-3,wc+2,wy-wr));
  var g1=gear(wc-6,wy+3,8,14,RR(R,0,1)),g2=gear(wc+9,wy+8,5,10,RR(R,0,1)),g3=gear(wc+7,wy-9,6,11,RR(R,0,1)),g4=gear(wc-8,wy-12,4,9,RR(R,0,1));
  [g1,g2,g3,g4].forEach(function(G){s.push(G);});s.push(circle(wc-6,wy+3,3),circle(wc+9,wy+8,1.5),circle(wc+7,wy-9,2),circle(wc-8,wy-12,1.4));
  s.push(spiral(wc+12,wy-14,0.5,4.5,3,0));for(var sp=0;sp<4;sp++){var a=sp*PI/2+0.3;s.push([[wc-6+3*Math.cos(a),wy+3+3*Math.sin(a)],[wc-6+7*Math.cos(a),wy+3+7*Math.sin(a)]]);}
  var lx=Math.min(262,wc+RR(R,70,90));s.push(rect(lx-6,bt,lx+6,bt-6));var arm=[[lx,bt-6],[lx+8,bt-44],[wc+30,bt-60]];s.push(arm);s.push(arm.map(function(p){return [p[0]+2.5,p[1]+1];}));s.push(circle(lx+8,bt-44,2.4));
  var lens=EP(wc+18,bt-52,15,8);SOL(s,sol,lens);s.push(ellipse(wc+18,bt-52,11,5.5));H(s,[[wc+8,bt-56],[wc+20,bt-58],[wc+14,bt-48],[wc+6,bt-50]],2,30);
  var shade=[[wc+28,bt-66],[wc+44,bt-76],[wc+52,bt-58],[wc+36,bt-56]];SOL(s,sol,shade);H(s,shade,1.4,60);s.push([[wc+30,bt-60],[wc+36,bt-62]]);
  for(var rr2=0;rr2<5;rr2++){var a2=PI*0.6+rr2*0.18;s.push([[wc+38+10*Math.cos(a2),bt-56+10*Math.sin(a2)],[wc+38+20*Math.cos(a2),bt-56+20*Math.sin(a2)]]);}
  var tw=wc-RR(R,58,72);s.push([[tw,bt-1],[tw+34,bt-4]],[[tw,bt-1],[tw+34,bt-1]]);for(var sd=0;sd<3;sd++){var sx=tw-6+sd*9;s.push(rect(sx,bt,sx+3,bt-14));s.push([[sx+1.5,bt-14],[sx+1.5,bt-22]]);H(s,RP(sx,bt,sx+3,bt-14),1,0);}
  var tray=RP(wc+30,bt,wc+62,bt-5);SOL(s,sol,tray);for(var p=0;p<6;p++)s.push(circle(wc+34+p*5,bt-2.5,1.2));
  var bx=wx+RR(R,14,26),gc=[[bx,bt],[bx,bt-50]].concat(arc(bx+14,bt-50,14,10,PI,TAU)).concat([[bx+28,bt]]);SOL(s,sol,gc);s.push(circle(bx+14,bt-44,9));for(var k2=0;k2<12;k2++){var a3=k2*TAU/12;s.push([[bx+14+7*Math.cos(a3),bt-44+7*Math.sin(a3)],[bx+14+9*Math.cos(a3),bt-44+9*Math.sin(a3)]]);}
  s.push([[bx+14,bt-44],[bx+18,bt-48]]);var gw=RP(bx+6,bt-30,bx+22,bt-6);s.push(poly(gw));s.push([[bx+14,bt-30],[bx+12,bt-12]]);s.push(circle(bx+12,bt-10,2.4));H(s,RP(bx+22,bt,bx+28,bt-50),1.2,0);
  floorS(s,R,fy,RI(R,12,16));
  behind(s,bg,sol);return s;}};

return {number:5,startedOn:"2026-11-15",notes:"Batch 5 (Nov 15). Review of batch 4: buildings and machines led again - town square and viaduct Super Sketches, dovecote, grain elevator, pipe organ, space shuttle, marionette stage, gas pump, rooftops, dollhouse. Weak: walrus and bison stayed shapeless, croissant basket and pincushion muddled, oil can and hermit crab unreadable, chairlift over-hatched; the viaduct Super Sketch ran ~630s natural so it crawled. Lessons kept: one line, keep extras touching; clip backgrounds with behind()/clipIn(); finish with skyFill and pass solids; strokes under ~250, planner under 2s; animals need a careful silhouette, so favor structures, still lifes and machines; avoid floating puffs (they read as rocks or clouds); keep sawtooth/zigzag loops guarded against zero-width steps; tableS holes must be the real solids, not big bounding boxes. New this batch: temples, cathedral facade, pueblo terraces, market hall, pretzels as offset ropes. Daily Super Sketch: Clockmaker's workshop, an interior with no sky; Super Sketches now rotate scene types (interior, close-up, overhead, nature, townscape).",master:(typeof MASTER!=="undefined"?MASTER:undefined),subjects:SUBJ};
})();
