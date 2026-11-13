// Endless Etch — batch 3. 48 subjects for 2026-11-13 (each plays three times, shuffled per round).
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

var SUBJ=[];
SUBJ.push(
{name:'Stone well with a bucket',titles:['Drawing Water','The Village Well','Cool Depths','Rope and Windlass','Wishing Hour'],build(R){var s=[],g=RR(R,158,166),cx=RR(R,135,165),w=RR(R,36,42),h=RR(R,34,40),top=g-h;
  ground(s,R,g,RR(R,3.4,4.2));
  s.push([[cx-w,g],[cx-w,top],[cx+w,top],[cx+w,g]]);s.push(brickS(cx-w,top+5,cx+w,g,RR(R,11,14),RR(R,6,7)));
  s.push(ellipse(cx,top,w,w*0.25));s.push(ellipse(cx,top+1,w-5,w*0.25-3));H(s,arc(cx,top+1,w-5,w*0.25-3,PI,TAU),1.3,0);
  var py=top-RR(R,62,72);[cx-w+4,cx+w-4].forEach(function(px){var P=[[px-3,py],[px+3,py],[px+3,top],[px-3,top]];s.push(poly(P));H(s,P,1.6,90);});
  var roof=[[cx-w-14,py+4],[cx,py-RR(R,30,38)],[cx+w+14,py+4]];F(s,roof,2.2,RR(R,15,35)*sgn(R));s.push([[cx-w-14,py+4],[cx+w+14,py+4]]);
  s.push(scallopRows(cx-w-10,cx+w+10,py+6,py+6,6,4));
  var wy=py+18,WP=[[cx-w+7,wy-3],[cx+w-7,wy-3],[cx+w-7,wy+3],[cx-w+7,wy+3]];s.push(poly(WP));H(s,WP,1.2,0);
  s.push([[cx+w-1,wy],[cx+w+10,wy],[cx+w+10,wy+12],[cx+w+16,wy+12]]);
  var by=top-RR(R,8,20);s.push([[cx,wy+3],[cx,by-13]]);s.push(arc(cx,by-6,8,7,PI,TAU));var bk=[[cx-8,by-6],[cx+8,by-6],[cx+6,by+8],[cx-6,by+8]];F(s,bk,1.6,90);
  s.push([[cx-7,by-1],[cx+7,by-1]]);s.push([[cx-6.5,by+4],[cx+6.5,by+4]]);
  var tx=cx<150?RR(R,232,262):RR(R,40,68);treeR(s,R,tx,g,RR(R,22,28),2.4);
  s.push(grass(cx-w-26,cx-w,g,7,3,R));s.push(grass(cx+w,cx+w+22,g,6,3,R));
  for(var k=0;k<RI(R,3,5);k++){var sx=cx+RR(R,-w-30,w+30);if(Math.abs(sx-cx)<w+6)continue;s.push(arc(sx,g,RR(R,4,7),RR(R,3,4),PI,TAU));}
  skyFill(s,g,RR(R,8,11),RR(R,4.2,5));return s;}},

{name:'Torii gate by the water',titles:['Gate to the Tide','Vermilion Morning','Standing in the Shallows','Between Two Worlds','Low Water Shrine'],build(R){var s=[],bg=[],wl=RR(R,124,132),cx=RR(R,135,165),sp=RR(R,42,50),k0=RR(R,38,46);
  var top=quad([cx-82,k0-6],[cx,k0+8],[cx+82,k0-6]),bot=quad([cx+74,k0+3],[cx,k0+14],[cx-74,k0+3]),KAS=top.concat(bot);s.push(poly(KAS));H(s,KAS,1.3,0);
  var SH=[[cx-70,k0+12],[cx+70,k0+12],[cx+70,k0+18],[cx-70,k0+18]];s.push(poly(SH));H(s,SH,2,0);
  var ny=k0+RR(R,34,40),NU=[[cx-sp-20,ny],[cx+sp+20,ny],[cx+sp+20,ny+7],[cx-sp-20,ny+7]];s.push(poly(NU));H(s,NU,1.5,0);
  var GK=[[cx-4,k0+18],[cx+4,k0+18],[cx+4,ny],[cx-4,ny]];s.push(poly(GK));H(s,GK,1.2,90);
  var holes=[];[cx-sp,cx+sp].forEach(function(px){var P=[[px-5,k0+18],[px+5,k0+18],[px+6.5,wl+12],[px-6.5,wl+12]];s.push(poly(P));H(s,P,2.2,90);holes.push(P);
    var Rf=[[px-6.5,wl+13],[px+6.5,wl+13],[px+4,wl+52],[px-4,wl+52]];H(s,Rf,3,0);holes.push(Rf);
    s.push([[px-9,wl+12],[px+9,wl+12]]);});
  hills(bg,R,wl,RR(R,26,40),RR(R,4,5));behind(s,bg,holes);s.push([[4,wl],[296,wl]]);
  behind(s,[waterS(R,4,296,wl+5,194,RR(R,5,6),1.1)],holes);
  var ix=cx<150?RR(R,236,262):RR(R,30,56);s.push(arc(ix,wl+2,26,9,PI,TAU));pineT(s,ix,wl-3,RR(R,1.1,1.4),2.4);
  skyFill(s,wl,RR(R,8,11),RR(R,4.4,5.2),5,[KAS,SH,NU]);return s;}},

{name:'Canal lock with a narrowboat',titles:['Waiting for the Level','Slow Water','Lock Keeper\'s Morning','Through the Gates','Four Miles an Hour'],build(R){var s=[],b=RR(R,112,120),wl=RR(R,160,166),gx=RR(R,236,250);
  s.push([[4,b],[296,b]]);var L=Math.min(RR(R,140,160),gx-30),bx=gx-8-L,c0=bx+28,c1=bx+L-16;behind(s,[brickS(4,b,gx,b+18,RR(R,11,13),6)],[[[c0-3,wl-38],[c1+3,wl-38],[c1+3,wl],[c0-3,wl]]]);s.push([[4,b+18],[c0-3,b+18]]);s.push([[c1+3,b+18],[gx,b+18]]);
  var HUL=[[bx,wl-12],[bx+L,wl-12],[bx+L-4,wl+5],[bx+8,wl+5]];s.push(poly(HUL));H(s,[[bx+2,wl-4],[bx+L-2,wl-4],[bx+L-4,wl+5],[bx+8,wl+5]],1.6,0);
  s.push(rect(c0,wl-34,c1,wl-12));s.push(rect(c0-2,wl-37,c1+2,wl-34));
  for(var x=c0+6;x<c1-10;x+=RR(R,15,19)){s.push(rect(x,wl-29,x+8,wl-20));}
  H(s,[[c0,wl-17],[c1,wl-17],[c1,wl-14],[c0,wl-14]],1.5,0);
  s.push(rect(c0+8,wl-46,c0+13,wl-37));s.push(spiral(c0+11,wl-52,1,5,1.3,PI/2));
  for(var p=0;p<RI(R,2,4);p++){var px=c0+30+p*22;s.push([[px,wl-37],[px-2,wl-44],[px+6,wl-44],[px+4,wl-37]]);s.push(scallop(px+2,wl-48,4,3,5,0.3));}
  s.push(spiral(bx+14,wl-15,1,5,2.5));s.push([[bx+L,wl-14],[bx+L+6,wl-26],[bx+L+14,wl-28]]);
  var GT=[[gx,b-12],[gx+12,b-12],[gx+12,196],[gx,196]];s.push(poly(GT));A(s,planks(gx,b-4,gx+12,194,6,false));s.push([[gx,b-12],[gx+12,196]]);
  var BM=[[gx+6,b-18],[296,b-22],[296,b-14],[gx+6,b-10]];s.push(poly(BM));H(s,BM,1.6,0);
  behind(s,[waterS(R,4,gx,b+22,194,RR(R,5,6),1)],[HUL.concat([]),[[bx-2,wl-12],[bx+L+2,wl-12],[bx+L+2,wl+8],[bx-2,wl+8]]]);
  var hx=RR(R,20,50),hw=60,ht=b-38;s.push([[hx,b],[hx,ht],[hx+hw,ht],[hx+hw,b]]);var rf=[[hx-6,ht],[hx+hw/2,ht-26],[hx+hw+6,ht]];F(s,rf,2.2,RR(R,20,35));
  s.push(rect(hx+8,ht+10,hx+20,ht+22));s.push(rect(hx+hw-20,ht+10,hx+hw-8,ht+22));s.push(rect(hx+25,b-20,hx+35,b));
  s.push(rect(hx+hw-16,ht-26,hx+hw-8,ht-10));
  treeR(s,R,hx+hw+RR(R,30,60),b,RR(R,16,20),2.4);
  skyFill(s,b,RR(R,8,11),RR(R,4.2,5));return s;}},

{name:'Grain elevator by the tracks',titles:['Prairie Cathedral','Harvest Rail','Loading Day','Tall on the Plains','Wheat Town'],build(R){var s=[],g=RR(R,146,152),ex=RR(R,118,138),ew=46,ty=RR(R,34,44);
  s.push([[4,g],[296,g]]);s.push([[4,g+11],[296,g+11]]);s.push([[4,g+18],[296,g+18]]);s.push(comb(4,296,g+21,13,7));
  H(s,[[4,g+24],[296,g+24],[296,196],[4,196]],RR(R,3.6,4.4),RR(R,8,20)*sgn(R));
  s.push(rect(ex,ty,ex+ew,g));A(s,planks(ex+4.5,ty+2,ex+ew-2,g,4.5,true));
  var hh=[[ex+8,ty],[ex+8,ty-20],[ex+38,ty-20],[ex+38,ty]];s.push(hh);F(s,[[ex+4,ty-20],[ex+23,ty-34],[ex+42,ty-20]],1.8,30);s.push(rect(ex+18,ty-14,ex+28,ty-6));
  for(var i=0;i<3;i++)cyl(s,ex+ew+17+i*33,g,16,RR(R,82,96),2.4,1);
  var hx=ex-RR(R,92,100),CAR=[[hx,g-30],[hx+80,g-30],[hx+72,g-2],[hx+8,g-2]];s.push(poly(CAR));for(var x=hx+10;x<hx+76;x+=8)s.push([[x,g-30],[x,g-2]]);
  s.push([[hx-2,g-30],[hx+82,g-30]]);[hx+14,hx+26,hx+54,hx+66].forEach(function(wx){wheel(s,wx,g+5,6,4,0);});
  s.push([[ex,ty+30],[hx+42,g-44],[hx+42,g-32]]);s.push([[ex,ty+36],[hx+46,g-44]]);
  for(var j=0;j<3;j++){var ux=4+j*RR(R,26,32);s.push([[ux,g],[ux,g-70]]);s.push([[ux-6,g-66],[ux+6,g-66]]);}
  s.push(cubic([4,g-62],[30,g-54],[60,g-56],[ux,g-62]));
  skyFill(s,g,RR(R,8,11),RR(R,4,4.8));return s;}},

{name:'Stone dovecote',titles:['Four Hundred Doors','Coo at Dusk','The Pigeon House','Old Stone Roost'],build(R){var s=[],bg=[],g=RR(R,158,164),cx=RR(R,135,165),r=RR(R,32,36),h=RR(R,76,86),top=g-h;
  var body=[[cx-r,g],[cx-r,top]].concat(arc(cx,top,r,r*0.22,PI,0)).concat([[cx+r,g]]);s.push([[cx-r,g],[cx-r,top],[cx+r,top],[cx+r,g]]);s.push(arc(cx,g,r,r*0.22,0,PI));
  var rows=[],k=0;for(var y=top+7;y<g;y+=7){s.push(arc(cx,y,r,r*0.22,0,PI));for(var a=0.35+(k%2)*0.2;a<PI-0.3;a+=0.42){var x=cx+r*Math.cos(a);s.push([[x,y+r*0.22*Math.sin(a)],[x,y+7+r*0.22*Math.sin(a)]]);}k++;}
  var ly=top+h*0.45;H(s,arc(cx,ly,r+2,r*0.24,0,PI).concat(arc(cx,ly+4,r+2,r*0.24,PI,0)),1,0);
  H(s,[[cx+r*0.45,top+2],[cx+r,top+2],[cx+r,g],[cx+r*0.45,g+4]],2.8,90);
  var rh=RR(R,50,62),RF=[[cx-r-7,top]].concat([[cx,top-rh]]).concat([[cx+r+7,top]]);s.push(poly(RF.concat(arc(cx,top,r+7,r*0.25,0,PI).reverse())));H(s,RF,2,RR(R,60,75));
  s.push(rect(cx-5,top-rh-12,cx+5,top-rh+4));s.push([[cx-8,top-rh-12],[cx,top-rh-20],[cx+8,top-rh-12]]);s.push([[cx,top-rh-20],[cx,top-rh-27]]);
  for(var i=-2;i<=2;i++){var ox=cx+i*12;var op=archP(ox,top+18,3.5,5);s.push(op);H(s,op,1,0);}
  var dr=archP(cx-8,g+3,9,18);s.push(dr);H(s,dr,2.2,90);
  for(var b=0;b<RI(R,2,4);b++){var bx=cx+RR(R,-r+6,r-6);perched(s,bx,ly+r*0.2,RR(R,4,5),sgn(R));}
  perched(s,cx,top-rh-20,4,sgn(R));
  hills(bg,R,g,RR(R,26,36),RR(R,4.2,5));behind(s,bg,[[[cx-r-8,g],[cx-r-8,top-2],[cx+r+8,top-2],[cx+r+8,g]],RF]);ground(s,R,g,RR(R,3.4,4));
  s.push(comb(cx+r+14,296,g,10,7));s.push([[cx+r+14,g-7],[296,g-7]]);s.push(comb(4,cx-r-14,g,10,7));s.push([[4,g-7],[cx-r-14,g-7]]);
  skyFill(s,g,RR(R,8,11),RR(R,4.2,5),5,[RF]);return s;}},

{name:'Medieval gatehouse',titles:['Drawbridge Down','Under the Portcullis','The Barbican','Gate at First Bell','Moat and Arrow Slit'],build(R){var s=[],g=RR(R,148,154),x0=RR(R,70,86),tt=RR(R,40,50),cw=70,gx=x0+40+cw/2;
  var T1=[[x0,g],[x0,tt],[x0+40,tt],[x0+40,g]],T2=[[x0+40+cw,g],[x0+40+cw,tt],[x0+80+cw,tt],[x0+80+cw,g]];
  s.push(T1);s.push(T2);s.push(merlons(x0-3,x0+43,tt,7,7.6));s.push(merlons(x0+37+cw,x0+83+cw,tt,7,7.6));
  var ct=tt+RR(R,20,26);s.push([[x0+40,ct],[x0+40+cw,ct]]);s.push(merlons(x0+40,x0+40+cw,ct,6,7));
  var GA=archP(gx,g,18,30);s.push(GA);var gin=archP(gx,g,15,30);HX(s,[gin],5,0);HX(s,[gin],5,90);
  behind(s,[brickS(x0,tt+2,x0+40,g,12,7),brickS(x0+40+cw,tt+2,x0+80+cw,g,12,7),brickS(x0+40,ct+2,x0+40+cw,g,12,7)],[GA]);
  [x0+20,x0+60+cw].forEach(function(sx){var SL=[[sx-2,tt+22],[sx+2,tt+22],[sx+2,tt+42],[sx-2,tt+42]];s.push(poly(SL));H(s,SL,0.8,90);s.push([[sx-5,tt+32],[sx+5,tt+32]]);
    s.push([[sx,tt],[sx,tt-24]]);var fd=sgn(R);s.push([[sx,tt-24],[sx+fd*16,tt-20],[sx,tt-16]]);});
  H(s,[[x0+30,tt],[x0+40,tt],[x0+40,g],[x0+30,g]],2.2,90);H(s,[[x0+70+cw,tt],[x0+80+cw,tt],[x0+80+cw,g],[x0+70+cw,g]],2.2,90);
  var DB=[[gx-17,g],[gx+17,g],[gx+27,192],[gx-27,192]];s.push(poly(DB));for(var y=g+5;y<192;y+=5){var t=(y-g)/(192-g),hw=17+10*t;s.push([[gx-hw,y],[gx+hw,y]]);}
  s.push([[gx-18,g-32],[gx-27,192]]);s.push([[gx+18,g-32],[gx+27,192]]);
  s.push([[4,g],[296,g]]);behind(s,[waterS(R,4,296,g+6,194,RR(R,5,6),1)],[DB]);
  s.push(grass(4,x0-4,g,6,4,R));s.push(grass(x0+84+cw,296,g,6,4,R));
  skyFill(s,g,RR(R,8,11),RR(R,4.2,5),5,[T1,T2]);return s;}},

{name:'Boathouse on the lake',titles:['Summer Shed','Oars Hung Up','Morning on the Lake','Slip and Mooring'],build(R){var s=[],bg=[],wl=RR(R,128,136),x0=RR(R,70,100),w=RR(R,104,116),fl=wl-6,wt=wl-58,rd=wt-RR(R,30,38);
  var HS=[[x0-6,wl+2],[x0-6,wt],[x0+w/2,rd],[x0+w+6,wt],[x0+w+6,wl+2]];
  hills(bg,R,wl,RR(R,26,40),RR(R,4.2,5));behind(s,bg,[HS]);s.push([[4,wl],[x0-6,wl]]);s.push([[x0+w+6,wl],[296,wl]]);
  s.push([[x0,fl],[x0,wt],[x0+w,wt],[x0+w,fl]]);var RF=[[x0-8,wt+2],[x0+w/2,rd],[x0+w+8,wt+2]];s.push(RF);s.push(scallopRows(x0,x0+w,wt-4,wt-4,6,3));
  H(s,[[x0+w/2,rd],[x0+w+8,wt+2],[x0+w/2+8,wt+2]],1.8,RR(R,30,50));
  var bw=RR(R,46,54),b0=x0+w/2-bw/2,BAY=[[b0,fl],[b0,wt+12],[b0+bw,wt+12],[b0+bw,fl]];s.push(BAY);
  var BOW=[[b0+10,fl],[b0+bw/2,fl-14],[b0+bw-10,fl]];s.push(BOW);
  behind(s,hatch(BAY,1.7,0),[BOW]);behind(s,planks(x0+4,wt+2,x0+w-2,fl,4.5,true),[BAY]);
  s.push(circle(x0+w/2,wt-14,6));s.push([[x0+w/2-6,wt-14],[x0+w/2+6,wt-14]]);
  for(var x=x0+4;x<=x0+w;x+=14)s.push([[x,fl],[x,wl+14]]);s.push([[x0-2,fl],[x0+w+2,fl]]);
  var dx1=RR(R,250,284);s.push([[x0+w,fl],[dx1,fl],[dx1,fl+4],[x0+w,fl+4]]);for(var px=x0+w+18;px<dx1;px+=18)s.push([[px,fl+4],[px,wl+14]]);
  s.push(rect(dx1-14,fl-7,dx1-8,fl));
  var ox=x0-RR(R,8,14);s.push([[ox,fl-40],[ox-10,fl-4]]);s.push(EP(ox-11,fl-2,3,6).concat([[ox-10,fl-4]]));
  behind(s,[waterS(R,4,296,wl+6,194,RR(R,5,6),1)],[[[x0-4,wl],[x0+w+4,wl],[x0+w+4,wl+15],[x0-4,wl+15]]]);
  skyFill(s,wl,RR(R,8,11),RR(R,4.2,5),5,[HS]);return s;}},

{name:'Seaside pier',titles:['End of the Pier','Promenade, Off Season','Salt and Ironwork','Gulls on the Rail','Out Over the Water'],build(R){var s=[],dy=RR(R,112,120),sea=dy+RR(R,26,32),px=RR(R,186,212),pw=74;
  s.push([[4,sea],[296,sea]]);
  s.push([[4,dy],[px,dy]]);s.push([[4,dy+5],[px+pw,dy+5]]);s.push(comb(4,px,dy,9,6));s.push([[4,dy-9],[px,dy-9]]);
  var st=RR(R,26,32),piles=[];for(var x=8;x<px+pw;x+=st){s.push([[x,dy+5],[x,196]]);piles.push(x);}
  for(var i=0;i+1<piles.length;i++){var a=piles[i],b=piles[i+1];s.push([[a,dy+7],[b,sea-3]]);s.push([[b,dy+7],[a,sea-3]]);}
  var PV=[[px,dy],[px,dy-38],[px+pw,dy-38],[px+pw,dy]];s.push(PV);
  for(var wx=px+6;wx+12<=px+pw-4;wx+=16){var W=archP(wx+6,dy-10,6,14);s.push(W);s.push([[wx+6,dy-10],[wx+6,dy-30]]);}
  var dm=[[px-4,dy-38]].concat(arc(px+pw/2,dy-38,pw/2+4,RR(R,26,32),PI,TAU));s.push(dm);H(s,arc(px+pw/2,dy-38,pw/2+4,RR(R,26,32),PI,TAU),2.2,RR(R,70,90));
  var tp=dy-38-RR(R,26,32);s.push([[px+pw/2,tp],[px+pw/2,tp-16]]);s.push([[px+pw/2,tp-16],[px+pw/2+12,tp-13],[px+pw/2,tp-10]]);
  s.push(rect(px-2,dy-41,px+pw+2,dy-38));
  for(var lx=24;lx<px-10;lx+=RR(R,40,50)){s.push([[lx,dy-9],[lx,dy-32]]);s.push(circle(lx,dy-35,3));s.push([[lx-4,dy-38],[lx+4,dy-38]]);}
  perched(s,24,dy-38,3.5,1);
  behind(s,[waterS(R,4,296,sea+5,194,RR(R,5,6),1.1)],[]);
  skyFill(s,sea,RR(R,8,11),RR(R,4.2,5),5,[PV]);return s;}},

{name:'Market stall with an awning',titles:['Saturday Market','Early Pears','Under Stripes','Weigh It Out','Last Crates of Summer'],build(R){var s=[],g=RR(R,150,156),sx=RR(R,60,80),sw=RR(R,150,166),ay=RR(R,58,66);
  floorS(s,R,g,RI(R,16,20));
  s.push([[sx,g],[sx,ay]]);s.push([[sx+sw,g],[sx+sw,ay]]);
  var at=ay-RR(R,26,32),AW=[[sx-10,ay],[sx+10,at],[sx+sw-10,at],[sx+sw+10,ay]];s.push(poly(AW));
  var n=10;for(var i=0;i<n;i++){var u0=i/n,u1=(i+1)/n,P=[[sx+10+(sw-20)*u0,at],[sx+10+(sw-20)*u1,at],[sx-10+(sw+20)*u1,ay],[sx-10+(sw+20)*u0,ay]];s.push([P[0],P[3]]);if(i%2==0)H(s,P,1.6,90);}
  var val=[];for(var j=0;j<n;j++){var xa=sx-10+(sw+20)*j/n,xb=sx-10+(sw+20)*(j+1)/n;A(val,arc((xa+xb)/2,ay,(xb-xa)/2,6,PI,0));}s.push(val);
  var ty=g-34;s.push(rect(sx+4,ty-4,sx+sw-4,ty));var CL=[[sx+6,ty],[sx+sw-6,ty],[sx+sw-6,g],[sx+6,g]];s.push(CL);for(var x=sx+12;x<sx+sw-6;x+=RR(R,7,9))s.push(quad([x,ty],[x+2,(ty+g)/2],[x-1,g]));
  var cx=sx+12,cn=0;while(cx<sx+sw-40&&cn<4){var cw=RR(R,30,38);s.push(rect(cx,ty-16,cx+cw,ty-4));s.push([[cx,ty-10],[cx+cw,ty-10]]);
    var kind=cn%3;for(var q=0;q<RI(R,4,6);q++){var fx=cx+4+q*(cw-8)/5,fy=ty-19-(q%2)*4;if(kind==0){s.push(circle(fx,fy,3.5));s.push([[fx,fy-3.5],[fx+1,fy-6]]);}else if(kind==1){s.push(scallop(fx,fy,4,3.5,6,0.2));}else{s.push(EP(fx,fy,2,4).concat([EP(fx,fy,2,4)[0]]));}}
    cx+=cw+RR(R,4,8);cn++;}
  var hx=sx+sw-RR(R,26,34);s.push([[hx,at+4],[hx,ay+20]]);s.push(rect(hx-5,ay+20,hx+5,ay+30));s.push(circle(hx,ay+25,3));s.push([[hx,ay+30],[hx,ay+40]]);s.push(arc(hx,ay+40,12,6,0,PI));s.push([[hx-12,ay+40],[hx+12,ay+40]]);
  var bx=sx-RR(R,34,44),BD=[[bx,g-50],[bx+26,g-50],[bx+26,g-20],[bx,g-20]];s.push([[bx-2,g],[bx+3,g-54],[bx+23,g-54],[bx+28,g]]);s.push(poly(BD));H(s,BD,1.8,0);
  skyFill(s,g,RR(R,8,11),RR(R,4.4,5.2),5,[AW]);return s;}},

{name:'Rooftops and chimneys',titles:['Over the Slates','Chimney Pots at Dusk','Attic View','Smoke in a Row','Roofline Quarter'],build(R){var s=[],x=4,i=0,sol=[];
  while(x<290){var w=Math.min(RR(R,48,70),296-x),e=RR(R,108,140),rd=e-RR(R,26,46),gab=R()<0.5;
    s.push([[x,196],[x,e]]);s.push([[x+w,e],[x+w,196]]);
    var RP=gab?[[x-2,e],[x+w/2,rd],[x+w+2,e]]:[[x-2,e],[x+8,rd],[x+w-8,rd],[x+w+2,e]];s.push(poly(RP));sol.push(RP);
    if(i%2)H(s,RP,RR(R,2,2.6),RR(R,-60,60));else{var t=[],d=1;for(var y=e-4;y>rd+1;y-=4){var tt=(e-y)/(e-rd),xl=gab?x-2+tt*(w/2+2):x-2+tt*10,xr=gab?x+w+2-tt*(w/2+2):x+w+2-tt*10;if(d>0)t.push([xl,y],[xr,y]);else t.push([xr,y],[xl,y]);d=-d;}s.push(t);}
    for(var wy=e+14;wy<Math.min(186,e+60);wy+=30){for(var wx=x+8;wx+12<x+w-4;wx+=20){s.push(rect(wx,wy,wx+12,wy+16));s.push([[wx+6,wy],[wx+6,wy+16]]);s.push([[wx,wy+8],[wx+12,wy+8]]);}}
    if(R()<0.8){var cx=gab?x+w*RR(R,0.25,0.65):x+RR(R,12,w-24),ct=rd-RR(R,14,24),base=gab?interpY([[x-2,e],[x+w/2,rd],[x+w+2,e]],cx):rd;var CH=[[cx,base],[cx,ct],[cx+12,ct],[cx+12,base]];s.push(CH);s.push(brickS(cx,ct+3,cx+12,base,6,4));s.push(rect(cx-2,ct-3,cx+14,ct));
      for(var p=0;p<RI(R,1,2);p++){var pxx=cx+2+p*5;s.push(rect(pxx,ct-9,pxx+3,ct-3));}
      if(R()<0.6){var sm=[[cx+3,ct-9]];for(var k=1;k<6;k++)sm.push([cx+3+k*6+RR(R,-2,2),ct-9-k*7]);s.push(curve(sm,5));}}
    if(R()<0.35){var ax=x+w*0.5,ay=gab?rd:rd;s.push([[ax,ay],[ax,ay-26]]);s.push([[ax-10,ay-20],[ax+10,ay-20]]);s.push([[ax-7,ay-14],[ax+7,ay-14]]);}
    x+=w;i++;}
  skyFill(s,140,RR(R,8,11),RR(R,4.2,5),5,sol);return s;}},

{name:'Bus stop in the rain',titles:['Waiting for the Number Nine','Wet Tuesday','Shelter','The Last Bus','Puddles at the Curb'],build(R){var s=[],g=RR(R,148,154),x0=RR(R,70,100),w=RR(R,112,128);
  s.push([[4,g],[296,g]]);s.push([[4,g+8],[296,g+8]]);s.push([[4,g+10],[296,g+10]]);var pud=[];for(var k=0;k<RI(R,2,3);k++){var px=RR(R,30,270),py=RR(R,g+24,186),P=EP(px,py,RR(R,16,26),RR(R,4,6));s.push(poly(P));pud.push(P);s.push(ellipse(px+3,py,5,1.5));}
  HX(s,[[[4,g+14],[296,g+14],[296,196],[4,196]]].concat(pud),RR(R,4.4,5.2),0);
  var RFP=[[x0-8,g-84],[x0+w+8,g-84],[x0+w+8,g-77],[x0-8,g-77]];s.push(poly(RFP));H(s,RFP,1.2,0);
  s.push([[x0,g],[x0,g-77]]);s.push([[x0+w,g],[x0+w,g-77]]);s.push([[x0,g-10],[x0+w,g-10]]);s.push([[x0,g-70],[x0+w,g-70]]);
  for(var x=x0+w/4;x<x0+w-1;x+=w/4)s.push([[x,g-70],[x,g-10]]);
  var AD=[[x0+3,g-66],[x0+w/4-3,g-66],[x0+w/4-3,g-14],[x0+3,g-14]];s.push(poly(AD));H(s,AD,2.4,45);
  s.push([[x0+w/4+4,g-28],[x0+w-6,g-28],[x0+w-6,g-24],[x0+w/4+4,g-24]]);s.push([[x0+w/4+8,g-24],[x0+w/4+8,g]]);s.push([[x0+w-10,g-24],[x0+w-10,g]]);
  var ux=x0+w-26;s.push([[ux,g],[ux-6,g-26]]);s.push([[ux-6,g-26],[ux-14,g-24],[ux-9,g-34],[ux-6,g-26]]);s.push(arc(ux+2,g-1,3,3,0,PI));
  var sp=x0+w+RR(R,22,34),SG=circle(sp,g-102,10);s.push([[sp,g],[sp,g-92]]);s.push(SG);s.push(circle(sp,g-102,7));s.push([[sp-6,g-102],[sp+6,g-102]]);
  s.push(rect(sp-8,g-86,sp+8,g-62));for(var ty=g-82;ty<g-64;ty+=4)s.push([[sp-6,ty],[sp+6,ty]]);
  var lx=x0-RR(R,34,46);s.push([[lx,g],[lx,g-112],[lx+14,g-118]]);s.push([[lx+10,g-118],[lx+20,g-118],[lx+18,g-112],[lx+12,g-112],[lx+10,g-118]]);
  var big=[[4,4],[296,4],[296,g-1],[4,g-1]],SH=[[x0-9,g-85],[x0+w+9,g-85],[x0+w+9,g],[x0-9,g]];
  behind(s,hatch(big,RR(R,5,6.5),RR(R,72,80)),[SH,poly(EP(sp,g-102,11,11)),[[sp-9,g-87],[sp+9,g-87],[sp+9,g-61],[sp-9,g-61]]]);
  return s;}},

{name:'Sea stacks on the coast',titles:['Old Teeth of the Coast','Arch and Swell','Where the Land Gave Up','Spray at the Stacks','Headland Weather'],build(R){var s=[],hz=RR(R,92,100),holes=[];
  var ct=hz-RR(R,30,44),cw=RR(R,60,80),CL=[[4,ct],[cw*0.4,ct-3],[cw*0.7,ct+4],[cw,ct+18],[cw+8,hz+20],[cw+18,170],[cw+30,196],[4,196]];s.push(CL.slice(0,7));
  HX(s,[CL],RR(R,2.4,2.9),RR(R,55,70));s.push(grass(4,cw*0.8,ct,5,3,R));holes.push(CL);
  var xs=[cw+RR(R,40,60),cw+RR(R,110,130),cw+RR(R,170,190)];
  xs.forEach(function(x,i){if(x>285)return;var hgt=RR(R,50,90)*(1-i*0.18),wd=RR(R,22,30)*(1-i*0.15),b=hz+RR(R,28,44)-i*8,top=b-hgt;
    var P=[[x-wd,b],[x-wd*0.85,b-hgt*0.3],[x-wd*0.6,b-hgt*0.55],[x-wd*0.65,top+10],[x-wd*0.3,top+2],[x-wd*0.05,top+6],[x+wd*0.25,top],[x+wd*0.55,top+12],[x+wd*0.6,b-hgt*0.45],[x+wd*0.85,b-hgt*0.2],[x+wd,b]];
    if(i==0&&wd>18){var AR=[[x-wd*0.45,b]].concat(arc(x,b-hgt*0.35,wd*0.45,hgt*0.25,PI,TAU)).concat([[x+wd*0.45,b]]);s.push(poly(P));s.push(AR);HX(s,[P,AR],RR(R,2.2,2.6),RR(R,55,75));}
    else{s.push(poly(P));H(s,P,RR(R,2.2,2.6),RR(R,55,75));}
    holes.push(P);s.push(scallop(x,b,wd+4,3,10,0.25));
    s.push(grass(x-wd*0.5,x+wd*0.4,top+2,3,3,R));});
  s.push([[cw+8,hz],[296,hz]]);
  behind(s,[waterS(R,4,296,hz+4,194,RR(R,5,6),1.2)],holes);
  var sx=RR(R,200,260);if(!xs.some(function(x){return Math.abs(x-sx)<34;}))sunH(s,sx,hz,RR(R,10,14));
  skyFill(s,hz,RR(R,8,11),RR(R,4.4,5.2),5,holes);return s;}},

{name:'Abbey ruins in a meadow',titles:['Roofless Choir','Where the Monks Sang','Arches to the Sky','Ivy and Ashlar','Evensong, Long Ago'],build(R){var s=[],g=RR(R,158,164),x0=RR(R,38,52),x1=RR(R,248,262);
  ground(s,R,g,RR(R,3.4,4.2));
  var top=[[x0,g]],n=14;for(var i=0;i<=n;i++){var x=x0+(x1-x0)*i/n,base=i>9?g-RR(R,118,128):g-RR(R,60,96)-(i>4&&i<8?20:0);top.push([x,base+(i%2?RR(R,-6,6):0)]);}top.push([x1,g]);
  var W=top;s.push(W.slice(0));
  var holes=[],nw=3;for(var k=0;k<nw;k++){var cx=x0+28+k*((x1-x0)*0.62/nw),G=gothic(cx,g-18,RR(R,11,13),RR(R,34,40));if(Math.min.apply(null,G.map(function(p){return p[1];}))<interpY(W,cx)+8)G=gothic(cx,g-18,11,26);s.push(G.concat([G[0]]));holes.push(G);
    s.push([[cx,g-18],[cx,G[G.length-1][1]-34]]);}
  var tx=x0+(x1-x0)*0.83,TG=gothic(tx,g-60,8,22);s.push(TG.concat([TG[0]]));holes.push(TG);
  var DR=archP(tx,g,10,22);s.push(DR);holes.push(DR);
  clipIn(s,[brickS(x0,g-140,x1,g,RR(R,13,16),RR(R,7,8))],poly(W.slice(0)),holes);
  for(var v=0;v<RI(R,3,5);v++){var vx=RR(R,x0+10,x1-10),vy=interpY(W,vx);var iv=[];for(var t=0;t<8;t++)iv.push([vx+5*Math.sin(t*1.3+v),vy+t*7]);s.push(curve(iv,4));for(var t2=1;t2<8;t2+=2)s.push(scallop(iv[t2][0]+3,iv[t2][1],3,2.5,5,0.25));}
  s.push(grass(4,296,g,RR(R,6,9),4,R));
  for(var f=0;f<RI(R,4,7);f++){var fx=RR(R,10,290),fy=g+RR(R,8,30);s.push([[fx,fy],[fx,fy-8]]);s.push(scallop(fx,fy-10,2.5,2.5,5,0.4));}
  skyFill(s,g,RR(R,8,11),RR(R,4.4,5),5,[poly(W.slice(0))]);return s;}},

{name:'Tornado over farmland',titles:['Green Sky, Four O\'Clock','The Funnel','Storm Cellar Weather','Touchdown, County Road','Wind Out of the West'],build(R){var s=[],g=RR(R,140,148),cb=RR(R,44,54);
  var CB=[[4,4],[296,4],[296,cb]];for(var x=296;x>=4;x-=10)CB.push([x,cb+3*Math.sin(x/9)+4*Math.sin(x/23)]);CB.push([4,cb]);s.push(CB.slice(2));H(s,CB,RR(R,2,2.4),0);
  var cx=RR(R,120,180),fx=cx+RR(R,-40,40),L=[],Rr=[];for(var t=0;t<=1.001;t+=0.04){var p=cubic([cx,cb],[cx+RR(R,-4,4),cb+40],[fx-20,g-40],[fx,g],1)[0];
    var u=1-t,xx=u*u*u*cx+3*u*u*t*(cx+10)+3*u*t*t*(fx-25)+t*t*t*fx,yy=cb+(g-cb)*t,rx=4+36*Math.pow(Math.max(0,1-t),1.6);
    s.push(arc(xx,yy,rx,rx*0.22,0,PI));L.push([xx-rx,yy]);Rr.push([xx+rx,yy]);}
  s.push(L);s.push(Rr);var FUN=L.concat(Rr.slice().reverse());
  s.push(scallop(fx,g-2,16,5,8,0.4));
  furrows(s,R,g,RI(R,16,22));
  var bx=fx<150?RR(R,200,240):RR(R,40,70);s.push([[bx,g],[bx,g-24],[bx+15,g-34],[bx+30,g-24],[bx+30,g]]);s.push(rect(bx+10,g-14,bx+20,g));s.push([[bx+10,g-14],[bx+20,g]]);s.push([[bx+20,g-14],[bx+10,g]]);cyl(s,bx+40,g,7,38,1.8);
  s.push(comb(4,bx-4,g,8,10));
  var rx0=fx<150?250:10;H(s,[[rx0,cb+6],[rx0+40,cb+6],[rx0+30,g],[rx0-10,g]].map(function(p){return [Math.max(4,Math.min(296,p[0])),p[1]];}),5,75);
  behind(s,hatch([[4,cb+8],[296,cb+8],[296,g-1],[4,g-1]],RR(R,5,6),0),[FUN,[[bx-2,g],[bx-2,g-26],[bx+15,g-36],[bx+32,g-26],[bx+48,g-42],[bx+48,g]]]);
  return s;}},

{name:'Baobab tree',titles:['Upside-Down Tree','A Thousand Dry Seasons','Savanna Sentinel','Bottle Trunk, Evening'],build(R){var s=[],g=RR(R,160,166),cx=RR(R,135,165),tw=RR(R,30,36),th=RR(R,74,86),tt=g-th;
  var TR=blob([[cx-tw,g],[cx-tw*1.15,g-th*0.4],[cx-tw*0.75,tt+8],[cx-tw*0.4,tt],[cx+tw*0.4,tt],[cx+tw*0.8,tt+8],[cx+tw*1.15,g-th*0.4],[cx+tw,g]],6);s.push(poly(TR));
  A(s,clipIn([],hatch(TR,RR(R,4.6,5.2),90),TR));shadeE(s,cx,g-th*0.45,tw*1.05,th*0.55,1.4,90,sgn(R),0.35);
  var br=RI(R,5,7),tips=[];for(var i=0;i<br;i++){var a=-PI+PI*(i+0.5)/br+RR(R,-0.12,0.12),bx=cx+Math.cos(a)*tw*0.4*(i/br*2-1)*-1,sx=cx+(i-(br-1)/2)*tw*0.25,L=RR(R,34,52),ex=sx+Math.cos(a)*L,ey=tt-Math.abs(Math.sin(a))*L*0.9;
    s.push([[sx-2,tt+2],[ex-1,ey],[ex+1,ey],[sx+2,tt+2]]);for(var j=0;j<2;j++){var a2=a+(j?0.5:-0.5),tx=ex+Math.cos(a2)*RR(R,10,18),ty=ey-Math.abs(Math.sin(a2))*RR(R,10,16);s.push([[ex,ey],[tx,ty]]);s.push(scallop(tx,ty-3,RR(R,6,9),RR(R,4,6),7,0.25));tips.push([tx,ty]);}}
  ground(s,R,g,RR(R,3.4,4.2));s.push(grass(4,cx-tw-4,g,6,4,R));s.push(grass(cx+tw+4,296,g,6,4,R));
  var sx2=cx<150?RR(R,220,265):RR(R,35,80);sunH(s,sx2,g,RR(R,14,18));
  var ax=cx<150?RR(R,30,60):RR(R,240,270);s.push([[ax,g],[ax,g-22]]);var cr=[[ax-20,g-24],[ax+20,g-24],[ax+14,g-30],[ax-14,g-30],[ax-20,g-24]];s.push(cr);H(s,cr,1.6,0);
  skyFill(s,g,RR(R,8,11),RR(R,4.4,5.2),5,[TR]);return s;}},

{name:'Lavender field and farmhouse',titles:['Purple Rows, July','Toward the Farmhouse','Bees and Stone','Midsummer Rows','Scent on the Wind'],build(R){var s=[],bg=[],g=RR(R,104,112),vx=RR(R,120,180),vy=g-RR(R,40,70),n=RI(R,17,21);
  s.push([[4,g],[296,g]]);var t=(g-vy)/(196-vy);
  for(var i=0;i<=n;i++){var xb=4+i*292/n,xh=vx+(xb-vx)*t,pts=[],N=RI(R,12,16);for(var k=0;k<=N*4;k++){var u=k/(N*4),p=lerp([xh,g],[xb,196],u),amp=1.5+u*u*13;pts.push([p[0],p[1]-amp*Math.abs(Math.sin(u*N*PI))]);}s.push(i%2?pts.reverse():pts);}
  var hx=RR(R,60,100),hw=56,ht=g-30,HO=[[hx,g],[hx,ht],[hx+hw,ht],[hx+hw,g]];s.push(HO);var RF=[[hx-6,ht+2],[hx+hw/2,ht-20],[hx+hw+6,ht+2]];F(s,RF,2,RR(R,-20,20));
  s.push(brickS(hx,ht+4,hx+hw,g,9,5));s.push(rect(hx+8,ht+8,hx+18,ht+18));s.push(rect(hx+hw-18,ht+8,hx+hw-8,ht+18));s.push(rect(hx+24,g-14,hx+32,g));s.push(rect(hx+hw-14,ht-16,hx+hw-8,ht-4));
  var cy=[];for(var c=0;c<RI(R,2,3);c++){var cxp=hx+hw+16+c*14,CY=EP(cxp,g-24,5,24);s.push(poly(CY));H(s,CY,1.6,RR(R,60,80));cy.push(CY);s.push([[cxp,g],[cxp,g-1]]);}
  hills(bg,R,g,RR(R,22,34),RR(R,4,5));behind(s,bg,[[[hx-7,g],[hx-7,ht+2],[hx+hw/2,ht-21],[hx+hw+7,ht+2],[hx+hw+7,g]]].concat(cy));
  skyFill(s,g,RR(R,8,11),RR(R,4.4,5),5,[RF].concat(cy));return s;}}
);

SUBJ.push(
{name:'Motorcycle with a sidecar',titles:['Sunday Run','Room for One More','Two Wheels and a Half','Chrome and Leather'],build(R){var s=[],bg=[],g=RR(R,160,166),rx=RR(R,96,116),fx=rx+78,wr=17;
  var holes=[circle(rx,g-wr,wr+1),circle(fx,g-wr,wr+1),[[rx+26,g-62],[rx+64,g-62],[rx+56,g-20],[rx+28,g-20]]];
  var SC=blob([[rx-14,g-34],[rx+6,g-54],[rx+56,g-58],[fx+10,g-52],[fx+26,g-40],[fx+10,g-28],[rx+10,g-26]],6);
  var sb=[];sb.push(poly(SC));A(sb,hatch(SC,2.4,RR(R,30,50)));sb.push(arc(rx+44,g-58,14,8,PI,TAU));sb.push(circle(rx+52,g-15,13));sb.push(circle(rx+52,g-15,4));
  behind(s,sb,holes);
  wheel(s,rx,g-wr,wr,12,1.6);wheel(s,fx,g-wr,wr,12,1.6);s.push(arc(rx,g-wr,wr+4,wr+4,PI*1.05,PI*1.85));s.push(arc(fx,g-wr,wr+4,wr+4,PI*1.15,PI*1.95));
  s.push([[rx,g-wr],[rx+20,g-48],[fx-12,g-58],[rx+40,g-22],[rx,g-wr]]);s.push([[fx-12,g-58],[fx,g-wr]]);s.push([[fx-14,g-58],[fx-2,g-wr]]);
  var TK=EP(rx+46,g-54,15,7);s.push(poly(TK));H(s,TK,1.4,RR(R,-20,20));
  var ST=[[rx+12,g-52],[rx+32,g-52],[rx+30,g-46],[rx+14,g-46]];s.push(poly(ST));H(s,ST,1.2,0);
  var EN=[[rx+30,g-40],[rx+54,g-40],[rx+52,g-22],[rx+32,g-22]];s.push(poly(EN));for(var y=g-37;y<g-23;y+=3)s.push([[rx+31,y],[rx+53,y]]);
  s.push([[rx+34,g-24],[rx-12,g-26],[rx-14,g-22],[rx+34,g-20]]);
  s.push([[fx-14,g-62],[fx-24,g-72],[fx-30,g-72]]);s.push(circle(fx-4,g-56,5));H(s,EP(fx-4,g-56,3,3),1,0);
  hills(bg,R,g,RR(R,26,36),RR(R,4.2,5));behind(s,bg,holes.concat([SC,[[rx-20,g],[rx-20,g-60],[fx+30,g-75],[fx+30,g]]]));ground(s,R,g,RR(R,3.4,4.2));
  var tx=RR(R,22,50);treeR(s,R,tx,g,RR(R,18,22),2.4);s.push(comb(tx+24,rx-24,g,12,9));s.push([[tx+24,g-9],[rx-24,g-9]]);
  skyFill(s,g,RR(R,8,11),RR(R,4.4,5),5,[SC]);return s;}},

{name:'Tall ship under sail',titles:['Full Canvas','Running Before the Wind','Three Masts, Fair Weather','Out of the Sound','Landfall in a Week'],build(R){var s=[],wl=RR(R,152,160),hx=RR(R,40,56),L=RR(R,190,206);
  var HU=[[hx,wl-34],[hx+16,wl-30],[hx+L-30,wl-22],[hx+L,wl-28],[hx+L-14,wl+4],[hx+20,wl+4],[hx+6,wl-8]];s.push(poly(HU));
  H(s,[[hx+8,wl-6],[hx+L-12,wl-6],[hx+L-14,wl+4],[hx+20,wl+4]],1.5,0);s.push(cubic([hx+2,wl-20],[hx+60,wl-14],[hx+150,wl-12],[hx+L-6,wl-18]));
  for(var x=hx+30;x<hx+L-30;x+=13)s.push(rect(x,wl-17,x+5,wl-12));
  s.push([[hx+L-6,wl-26],[hx+L+44,wl-48]]);
  var ms=[hx+L*0.26,hx+L*0.52,hx+L*0.77],mh=[RR(R,118,126),RR(R,130,138),RR(R,116,124)],tops=[];
  ms.forEach(function(mx,i){var by=interpY([[hx,wl-34],[hx+16,wl-30],[hx+L-30,wl-22],[hx+L,wl-28]],mx),top=wl-mh[i];s.push([[mx,by],[mx,top]]);tops.push([mx,top]);
    var y=top+10,ww=[14,20,26];for(var k=0;k<3;k++){var w=ww[k]*(i==1?1.1:1),h=k==2?32:26,bul=RR(R,4,7);var SL=[[mx-w,y],[mx+w,y]].concat(quad([mx+w-1,y+h],[mx+bul,y+h+bul*1.2],[mx-w+1,y+h],10).reverse().reverse());
      s.push([[mx-w-3,y],[mx+w+3,y]]);s.push([[mx-w,y],[mx-w+1,y+h]]);s.push([[mx+w,y],[mx+w-1,y+h]]);s.push(quad([mx-w+1,y+h],[mx,y+h+bul*1.6],[mx+w-1,y+h]));
      for(var q=-2;q<=2;q++){if(q==0)continue;var sx=mx+q*w/3;s.push(quad([sx,y],[sx+bul*0.4,y+h*0.5],[sx,y+h+bul*1.6*(1-Math.abs(q)/3)]));}
      H(s,[[mx+w*0.35,y+1],[mx+w-0.5,y+1],[mx+w-1,y+h-1],[mx+w*0.35,y+h+bul*0.6]],1.8,90);
      y+=h+4;}
    s.push([[mx,top],[mx+12,top+3],[mx,top+6]]);});
  s.push([[tops[2][0],tops[2][1]+8],[hx+L+44,wl-48]]);s.push([[tops[2][0],tops[2][1]+30],[hx+L+30,wl-42]]);
  var J=[[tops[2][0]+2,tops[2][1]+12],[hx+L+40,wl-46],[tops[2][0]+4,wl-50]];s.push(poly(J));H(s,J,3,80);
  s.push([[tops[0][0],tops[0][1]],[hx+4,wl-34]]);s.push([[tops[1][0],tops[1][1]],[tops[0][0],tops[0][1]+6]]);s.push([[tops[2][0],tops[2][1]],[tops[1][0],tops[1][1]+6]]);
  s.push([[4,wl-12],[hx-2,wl-12]]);s.push([[hx+L+8,wl-12],[296,wl-12]]);
  behind(s,[waterS(R,4,296,wl-6,194,RR(R,5,6),1.2)],[HU.concat([]),[[hx,wl-12],[hx+L,wl-12],[hx+L-10,wl+8],[hx+16,wl+8]]]);
  return s;}},

{name:'Hay wagon',titles:['Last Load Before Rain','Bales and Twine','Haying Time','Into the Loft','August Afternoon'],build(R){var s=[],g=RR(R,160,166),wx=RR(R,76,96),ww=RR(R,130,140),dy=g-RR(R,30,34);
  var bx=RR(R,200,232),BN=[[bx,g],[bx,g-90],[bx+36,g-124],[296,g-124],[296,g]];s.push(BN.slice(0,4));
  A(s,planks(bx+4,g-86,296,g,5,true).map(function(st){return [[st[0][0],Math.max(st[0][1],interpY([[bx,g-90],[bx+36,g-124],[296,g-124]],st[0][0]))],st[1]];}));
  var DR=[[bx+18,g],[bx+18,g-60],[bx+66,g-60],[bx+66,g]];
  ground(s,R,g,RR(R,3.4,4.2));
  s.push(rect(wx,dy,wx+ww,dy+7));H(s,[[wx,dy],[wx+ww,dy],[wx+ww,dy+7],[wx,dy+7]],1.8,0);
  wheel(s,wx+24,g-14,14,10,0);wheel(s,wx+ww-26,g-17,17,12,0);
  s.push([[wx,dy+4],[wx-46,g-6]]);s.push([[wx,dy+7],[wx-46,g-3]]);
  var rows=RI(R,3,4),bh=13,bw=ww/RI(R,3,4);for(var r=0;r<rows;r++){var y0=dy-(r+1)*bh,off=r%2?bw/2:0,x=wx+2+off*(r==rows-1?1:0.5);
    var xe=wx+ww-2-(r==rows-1?bw*0.6:0);for(var xx=x;xx+bw*0.6<xe;xx+=bw){var x1=Math.min(xx+bw-1,xe);var BL=[[xx,y0],[x1,y0],[x1,y0+bh],[xx,y0+bh]];s.push(poly(BL));H(s,BL,RR(R,2.2,2.8),RR(R,-8,8));s.push([[xx+(x1-xx)*0.3,y0],[xx+(x1-xx)*0.3,y0+bh]]);s.push([[xx+(x1-xx)*0.7,y0],[xx+(x1-xx)*0.7,y0+bh]]);}}
  var px=wx-RR(R,14,24);s.push([[px,g],[px+16,g-78]]);s.push([[px+12,g-78],[px+20,g-78]]);for(var t=0;t<3;t++)s.push([[px+12+t*4,g-78],[px+11+t*4,g-92]]);
  s.push(grass(4,wx-50,g,6,4,R));
  skyFill(s,g,RR(R,8,11),RR(R,4.4,5),5,[BN]);return s;}},

{name:'Ice cream truck',titles:['Three Scoops, Please','Chime Down the Block','Summer Street','Waffle Cone Wednesday'],build(R){var s=[],g=RR(R,158,164),x0=RR(R,50,70),w=RR(R,170,184),tt=g-RR(R,78,86);
  s.push([[4,g],[296,g]]);s.push([[4,g+6],[296,g+6]]);H(s,[[4,g+12],[296,g+12],[296,196],[4,196]],RR(R,5,6),0);
  var BX=[[x0,g-12],[x0,tt],[x0+w-46,tt],[x0+w-46,g-12]];s.push(BX);var CAB=[[x0+w-46,tt+14],[x0+w-22,tt+14],[x0+w,g-40],[x0+w,g-12],[x0+w-46,g-12]];s.push(CAB);
  var WS=[[x0+w-42,tt+18],[x0+w-24,tt+18],[x0+w-6,g-44],[x0+w-42,g-44]];s.push(poly(WS));H(s,WS,2.2,60);
  s.push([[x0,g-12],[x0+w,g-12]]);H(s,[[x0,g-26],[x0+w,g-26],[x0+w,g-20],[x0,g-20]],1.4,0);
  var sw0=x0+20,sw1=x0+w-80,SW=[[sw0,tt+16],[sw1,tt+16],[sw1,g-46],[sw0,g-46]];s.push(poly(SW));s.push([[sw0-4,g-46],[sw1+4,g-46],[sw1+4,g-42],[sw0-4,g-42]]);
  var aw=[];for(var x=sw0-6;x<sw1+6;x+=8)A(aw,arc(x+4,tt+16,4,5,PI,0));s.push([[sw0-6,tt+8],[sw1+6,tt+8],[sw1+6,tt+16]].concat(aw.reverse()).concat([[sw0-6,tt+16],[sw0-6,tt+8]]));
  for(var i=0;i<4;i++){var mx=sw0+6+i*((sw1-sw0-12)/4),MN=[[mx,tt+22],[mx+(sw1-sw0-12)/4-4,tt+22],[mx+(sw1-sw0-12)/4-4,g-52],[mx,g-52]];s.push(poly(MN));for(var y=tt+27;y<g-54;y+=5)s.push([[mx+3,y],[mx+(sw1-sw0-12)/4-7,y]]);}
  var cx=x0+(w-46)/2,CO=[[cx-12,tt],[cx,tt-8],[cx+12,tt]];s.push(rect(cx-16,tt-8,cx+16,tt));
  var cone=[[cx-11,tt-8],[cx+11,tt-8],[cx,tt-42]];s.push(poly([[cx-11,tt-42],[cx+11,tt-42],[cx,tt-8]]));HX(s,[[[cx-11,tt-42],[cx+11,tt-42],[cx,tt-8]]],4,60);HX(s,[[[cx-11,tt-42],[cx+11,tt-42],[cx,tt-8]]],4,-60);
  var sc=scallop(cx,tt-50,14,10,9,0.15);s.push(sc);H(s,sc.slice(0,-1),2,RR(R,20,50));s.push(scallop(cx+2,tt-64,9,7,7,0.2));s.push(circle(cx+3,tt-73,3));
  wheel(s,x0+34,g-6,12,6,1.6);wheel(s,x0+w-30,g-6,12,6,1.6);s.push(arc(x0+34,g-6,15,15,PI,TAU));s.push(arc(x0+w-30,g-6,15,15,PI,TAU));
  s.push(circle(x0+w-4,g-28,3));
  var lx=x0<60?RR(R,264,280):RR(R,16,30);s.push([[lx,g],[lx,g-120]]);s.push(arc(lx+8,g-120,8,6,PI,TAU));s.push(rect(lx+12,g-118,lx+20,g-112));
  skyFill(s,g,RR(R,8,11),RR(R,4.4,5),5,[BX,CAB,cone]);return s;}},

{name:'Chairlift over the slope',titles:['First Chair','Powder Day','Up Through the Pines','Cold Cable, Bright Sky'],build(R){var s=[],y0=RR(R,182,190),y1=RR(R,70,80);
  var SL=[[4,y0],[296,y1]];var sly=function(x){return y0+(y1-y0)*(x-4)/292;};
  var pk=[[4,y1-10]];for(var x=4;x<=296;x+=12)pk.push([x,y1-30-RR(R,0,8)-40*Math.max(0,Math.sin((x-RR(R,0,40))/60))]);pk=pk.slice(1);
  var MP=pk.concat([[296,sly(296)],[4,sly(4)]]);s.push(pk);
  var towers=[];for(var tx=40;tx<290;tx+=RR(R,78,92))towers.push(tx);
  var holes=[];towers.forEach(function(tx){var b=sly(tx),top=b-RR(R,58,64);s.push([[tx-2,b],[tx-2,top],[tx+2,top],[tx+2,b]]);s.push([[tx-16,top],[tx+16,top]]);s.push([[tx-16,top+3],[tx+16,top+3]]);holes.push([[tx-17,top-1],[tx+17,top-1],[tx+3,b],[tx-3,b]]);towers[towers.indexOf(tx)]=[tx,top];});
  var cab=[],cabB=[];var off=-RR(R,52,58);
  s.push([[4,sly(4)+off],[296,sly(296)+off]].map(function(p,i){return p;}));s.push([[4,sly(4)+off+3],[296,sly(296)+off+3]]);
  for(var cx=20;cx<290;cx+=RR(R,34,40)){if(towers.some(function(t){return Math.abs(t[0]-cx)<14;}))continue;var cy=sly(cx)+off+3*(cx%2?0:1);s.push([[cx,cy],[cx,cy+16]]);s.push([[cx-8,cy+16],[cx+8,cy+16],[cx+8,cy+22],[cx-8,cy+22]]);s.push([[cx-8,cy+16],[cx-8,cy+10]]);s.push([[cx-10,cy+10],[cx-6,cy+10]]);}
  HX(s,[MP].concat(holes),RR(R,3,3.6),RR(R,40,60));
  for(var p=0;p<RI(R,7,10);p++){var px=RR(R,10,290),pb=sly(px)+RR(R,6,40);if(pb>194)continue;pineT(s,px,pb,RR(R,0.6,0.9),0);}
  s.push(SL);for(var m=0;m<RI(R,4,6);m++){var mx=RR(R,20,280),my=sly(mx)+RR(R,10,30);s.push(arc(mx,my,RR(R,8,14),3,PI,TAU));}
  skyFill(s,y1,RR(R,8,11),RR(R,4.2,5),5,[MP]);return s;}},

{name:'Bison on the prairie',titles:['Shoulders of the Plains','Winter Coat','Old Grazer','Thunder at Rest','Grass to the Horizon'],build(R){var s=[],bg=[],g=RR(R,162,168),sc=RR(R,1.45,1.6),cx=RR(R,140,165);
  var oy=g-44*sc;var BD=M(blob([[-70,18],[-72,8],[-66,-6],[-56,-22],[-44,-40],[-28,-50],[-12,-46],[6,-36],[26,-28],[46,-26],[58,-20],[62,-12],[60,4],[54,14],[40,14],[10,16],[-14,18],[-36,24],[-50,30],[-62,26]],4),cx,oy,sc);s.push(poly(BD));
  var HDz=M([[-80,-30],[-50,-30],[-48,40],[-80,40]],cx,oy,sc),HD=HDz;
  clipIn(s,hatch(BD,2.1,80),BD,[M([[-50,-60],[80,-60],[80,40],[-50,40]],cx,oy,sc)]);
  clipIn(s,hatch(BD,3.4,72),BD,[M([[-90,-60],[-50,-60],[-50,40],[-90,40]],cx,oy,sc),M([[-8,-60],[80,-60],[80,40],[-16,40]],cx,oy,sc)]);
  clipIn(s,hatch(BD,4.6,15),BD,[M([[-90,-60],[-8,-60],[-16,40],[-90,40]],cx,oy,sc)]);
  [[-30,22],[-18,19],[42,13],[52,10]].forEach(function(l,i){var L=M([[l[0]-4,l[1]],[l[0]+4,l[1]],[l[0]+3,40],[l[0]+4,44],[l[0]-4,44],[l[0]-3,40]],cx,oy,sc);s.push(poly(L));H(s,L,1.4,90);});
  s.push(M([[-62,26],[-58,36],[-55,28],[-51,38],[-48,29],[-44,32],[-40,24]],cx,oy,sc));
  s.push(M(quad([-54,-14],[-50,-26],[-42,-26]),cx,oy,sc));
  s.push(circle(cx-61*sc,oy-2*sc,2));
  s.push(M(curve([[61,-10],[66,0],[65,14]],5),cx,oy,sc));s.push(scallop(cx+65*sc,oy+18*sc,2.5,4,5,0.3));
  behind(s,hatch(M([[-26,16],[46,12],[46,44],[-26,44]],cx,oy,sc),5,0),[BD].concat([[-30,22],[-18,19],[42,13],[52,10]].map(function(l){return M([[l[0]-5,l[1]-4],[l[0]+5,l[1]-4],[l[0]+5,45],[l[0]-5,45]],cx,oy,sc);})));
  var bt=[];for(var x=4;x<=296;x+=14)bt.push([x,g-RR(R,22,28)+(x>200&&x<260?-RR(R,20,26):0)]);bt[bt.length-1][0]=296;bg.push(bt);
  var BT=bt.concat([[296,g],[4,g]]);A(bg,hatch(BT,RR(R,4.4,5.2),0));behind(s,bg,[BD]);
  s.push([[4,g],[296,g]]);s.push(grass(4,296,g,RR(R,6,9),3,R));H(s,[[4,g+4],[296,g+4],[296,196],[4,196]],RR(R,4.8,5.6),RR(R,10,25)*sgn(R));
  skyFill(s,g-20,RR(R,8,11),RR(R,5.6,6.2),5,[BD]);return s;}},

{name:'Heron in the reeds',titles:['Patience','Still as the Reeds','Grey Fisher','Low Water, Long Legs','The Wait'],build(R){var s=[],wl=RR(R,148,156),cx=RR(R,130,170),sc=RR(R,1.15,1.3);
  var oy=wl;var Bd=blob([[-26,-62],[-16,-76],[0,-80],[18,-72],[36,-58],[46,-50],[24,-50],[2,-52],[-16,-54]],6);var BD=M(Bd,cx,oy,sc);s.push(poly(BD));H(s,BD,1.8,RR(R,10,30));
  var nk=M(curve([[-24,-68],[-30,-84],[-20,-98],[-26,-112],[-34,-116]],8),cx,oy,sc);var nk2=M(curve([[-18,-70],[-24,-84],[-14,-98],[-20,-110],[-28,-118]],8),cx,oy,sc);s.push(nk);s.push(nk2);
  var hd=M(blob([[-36,-114],[-30,-122],[-24,-120],[-24,-112],[-32,-110]],5),cx,oy,sc);s.push(poly(hd));
  s.push(M([[-34,-118],[-62,-113],[-34,-112]],cx,oy,sc));s.push(circle(cx-30*sc,oy-117*sc,1.2));s.push(M([[-26,-120],[-8,-124],[-12,-120]],cx,oy,sc));
  s.push(M([[28,-66],[48,-60],[34,-58]],cx,oy,sc));H(s,M([[-10,-72],[20,-72],[30,-62],[0,-62]],cx,oy,sc),1,10);
  s.push(M([[4,-56],[3,-28],[2,0]],cx,oy,sc));s.push(M([[10,-56],[14,-34],[6,-26],[6,-24]],cx,oy,sc));s.push(M([[2,0],[-8,2]],cx,oy,sc));
  s.push([[4,wl],[296,wl]]);
  var reed=[];for(var k=0;k<RI(R,9,12);k++){var rx=RR(R,6,294);if(Math.abs(rx-cx)<26)continue;var h=RR(R,40,110),lean=RR(R,-10,10),c=quad([rx,wl],[rx+lean*0.3,wl-h*0.5],[rx+lean,wl-h]);s.push(c);
    if(R()<0.45){var tp=c[c.length-1];var CT=EP(tp[0],tp[1]+8,2.4,8);s.push(poly(CT));H(s,CT,1,0);}else s.push(quad([rx,wl-h*0.3],[rx+8*sgn(R),wl-h*0.6],[rx+12*sgn(R),wl-h*0.75]));reed.push(rx);}
  s.push(cubic([4,wl+2],[60,wl-4],[90,wl+4],[cx-40,wl+2]));
  behind(s,[waterS(R,4,296,wl+5,194,RR(R,6,7),1)],[M([[-2,-2],[7,-2],[7,24],[-2,24]],cx,oy,sc)]);
  H(s,M([[0,2],[5,2],[5,22],[0,22]],cx,oy,sc),2,0);
  skyFill(s,wl,RR(R,8,11),RR(R,5.2,5.8),5,[BD]);return s;}},

{name:'Squirrel with an acorn',titles:['Winter Stores','Caught in the Act','Bright Eyes, Busy Paws','October Hoard'],build(R){var s=[],g=RR(R,160,166),stx=RR(R,120,160),sw=RR(R,44,52),st=g-RR(R,38,46),sc=RR(R,1.35,1.5);
  ground(s,R,g,RR(R,3.4,4.2));
  s.push([[stx-sw,g],[stx-sw,st]]);s.push([[stx+sw,st],[stx+sw,g]]);s.push(ellipse(stx,st,sw,10));for(var r=1;r<4;r++)s.push(ellipse(stx,st,sw*r/4,10*r/4));
  A(s,clipIn([],hatch([[stx-sw,st],[stx+sw,st],[stx+sw,g],[stx-sw,g]],RR(R,3.4,4),90),[[stx-sw,st+2],[stx+sw,st+2],[stx+sw,g],[stx-sw,g]]));
  s.push(quad([stx-sw,g-6],[stx-sw-10,g-2],[stx-sw-18,g]));s.push(quad([stx+sw,g-8],[stx+sw+12,g-2],[stx+sw+22,g]));
  var ox=stx-6,oy=st;var Bd=M(blob([[-14,0],[-16,-16],[-10,-32],[2,-38],[10,-30],[12,-14],[14,0]],6),ox,oy,sc);s.push(poly(Bd));H(s,Bd,1.8,RR(R,20,40));
  var HD=M(blob([[-2,-36],[4,-48],[16,-50],[24,-42],[18,-36],[8,-32]],5),ox,oy,sc);s.push(poly(HD));H(s,HD,2,RR(R,-30,0));
  s.push(M([[6,-48],[8,-58],[12,-49]],ox,oy,sc));s.push(circle(ox+16*sc,oy-45*sc,1.5));s.push(circle(ox+16*sc,oy-45*sc,2.6));
  var TL=M(blob([[-14,-2],[-30,-8],[-40,-26],[-36,-52],[-24,-66],[-8,-68],[-4,-56],[-18,-50],[-24,-30],[-12,-14]],6),ox,oy,sc);s.push(poly(TL));
  for(var i=0;i<TL.length-6;i+=3){var p=TL[i];s.push([p,[p[0]+RR(R,-5,-2),p[1]+RR(R,-4,4)]]);}H(s,TL,3.4,RR(R,50,70));
  var ac=[ox+20*sc,oy-26*sc];s.push(ellipse(ac[0],ac[1]+2,4,5));var CP=[[ac[0]-5,ac[1]-2],[ac[0]+5,ac[1]-2],[ac[0]+4,ac[1]-6],[ac[0]-4,ac[1]-6]];s.push(poly(CP));HX(s,[CP],1.4,45);HX(s,[CP],1.4,-45);s.push([[ac[0],ac[1]-6],[ac[0],ac[1]-9]]);
  s.push(M([[8,-30],[18,-26],[20,-22]],ox,oy,sc));s.push(M([[6,0],[12,-2],[16,0]],ox,oy,sc));
  for(var a=0;a<RI(R,3,5);a++){var lx=RR(R,10,290);if(Math.abs(lx-stx)<sw+20)continue;var ly=g+RR(R,6,20),LF=blob([[lx-7,ly],[lx,ly-4],[lx+7,ly],[lx,ly+3]],4);s.push(poly(LF));s.push([[lx-7,ly],[lx+7,ly]]);}
  var tx=stx<150?RR(R,236,270):RR(R,26,60);s.push([[tx-8,g],[tx-8,4]]);s.push([[tx+8,g],[tx+8,4]]);A(s,clipIn([],hatch([[tx-8,4],[tx+8,4],[tx+8,g],[tx-8,g]],4,90),[[tx-8,4],[tx+8,4],[tx+8,g],[tx-8,g]]));
  skyFill(s,g,RR(R,8,11),RR(R,5.2,5.8),5,[TL,HD,Bd]);return s;}},

{name:'Walrus on an ice floe',titles:['Tusks and Whiskers','Basking on the Floe','Arctic Afternoon','Heavy Sleeper'],build(R){var s=[],wl=RR(R,146,154),cx=RR(R,140,165),fw=RR(R,100,112),ft=wl-RR(R,14,18),sc=RR(R,1.1,1.2);
  var FL=[[cx-fw,wl],[cx-fw+8,ft],[cx+fw-6,ft],[cx+fw,wl]];s.push(FL.concat([[cx-fw,wl]]));H(s,[[cx-fw,wl],[cx-fw+8,ft+5],[cx+fw-6,ft+5],[cx+fw,wl]],2,90);s.push([[cx-fw+8,ft+5],[cx+fw-6,ft+5]]);
  var ox=cx+8,oy=ft;var Bd=M(blob([[-48,0],[-50,-20],[-36,-36],[-10,-44],[18,-42],[40,-34],[56,-20],[64,-6],[66,0]],6),ox,oy,sc);s.push(poly(Bd));
  clipIn(s,hatch(Bd,2.6,RR(R,15,30)),Bd,[M(EP(4,-30,20,8),ox,oy,sc)]);for(var w=0;w<4;w++)s.push(M(arc(-6+w*16,-18,9,7,PI*1.1,PI*1.6),ox,oy,sc));
  var HD=M(blob([[-44,-12],[-50,-34],[-62,-44],[-78,-42],[-88,-30],[-88,-16],[-76,-8],[-58,-4]],6),ox,oy,sc);s.push(poly(HD));var MZ=M(EP(-82,-20,9,8),ox,oy,sc);clipIn(s,hatch(HD,3.2,70),HD,[MZ]);s.push(poly(MZ));for(var d=0;d<9;d++){var p=MZ[Math.floor(MZ.length*(0.25+d*0.05))];s.push([p,[p[0]-6,p[1]+(d-4)*0.8]]);}
  s.push(M([[-87,-14],[-89,14],[-86,16],[-84,-14]],ox,oy,sc));s.push(M([[-79,-13],[-80,14],[-77,16],[-76,-13]],ox,oy,sc));
  s.push(circle(ox-72*sc,oy-34*sc,1.6));s.push(circle(ox-72*sc,oy-34*sc,0.5));
  s.push(M([[-30,0],[-44,6],[-20,6],[-24,0]],ox,oy,sc));s.push(M([[62,-4],[80,-12],[74,0],[82,6],[64,2]],ox,oy,sc));
  var bx=cx<150?RR(R,252,272):RR(R,24,44),IB=[[bx-24,wl],[bx-14,wl-30],[bx-2,wl-44],[bx+8,wl-36],[bx+18,wl-48],[bx+30,wl]];
  s.push([[4,wl],[296,wl]]);s.push(IB);H(s,[[bx-2,wl-44],[bx+8,wl-36],[bx+18,wl-48],[bx+30,wl],[bx+6,wl]],2.4,70);
  behind(s,[waterS(R,4,296,wl+5,194,RR(R,5,6),1.1)],[[[cx-fw-2,wl-2],[cx+fw+2,wl-2],[cx+fw+2,wl+3],[cx-fw-2,wl+3]]]);
  skyFill(s,wl,RR(R,8,11),RR(R,4.4,5),5,[Bd,HD,IB]);return s;}},

{name:'Stag beetle on a log',titles:['Antlers in Miniature','Forest Floor Knight','June Evening Patrol','Armored and Slow'],build(R){var s=[],ly=RR(R,128,136),lh=RR(R,40,46),lx0=RR(R,14,24),lx1=RR(R,250,270);
  s.push([[lx0,ly],[lx1,ly]]);s.push([[lx0,ly+lh],[lx1,ly+lh]]);s.push(ellipse(lx1,ly+lh/2,10,lh/2));for(var r=1;r<4;r++)s.push(ellipse(lx1,ly+lh/2,10*r/4,lh/2*r/4));
  s.push(arc(lx0,ly+lh/2,10,lh/2,PI/2,1.5*PI));
  for(var k=0;k<RI(R,9,13);k++){var x=RR(R,lx0+6,lx1-14),y=ly+RR(R,4,lh-6),L=RR(R,20,46);s.push(quad([x,y],[x+L/2,y+RR(R,-3,3)],[Math.min(lx1-12,x+L),y+RR(R,-2,2)]));}
  H(s,[[lx0,ly+lh*0.65],[lx1-10,ly+lh*0.65],[lx1-10,ly+lh],[lx0,ly+lh]],2,0);
  for(var m=0;m<RI(R,3,5);m++){var mx=RR(R,lx0+10,lx1-30);s.push(scallop(mx,ly-2,RR(R,6,10),3,6,0.4));}
  var cx=RR(R,120,170),cy=ly-16,sc=RR(R,1.2,1.35);
  var EL=M(EP(18,0,34,13),cx,cy,sc);s.push(poly(EL));s.push(M([[-16,0],[52,0]],cx,cy,sc));clipIn(s,hatch(EL,2.2,RR(R,-10,10)),EL,[M(EP(24,-6,16,3.5),cx,cy,sc)]);
  var PN=M(EP(-22,-2,9,10),cx,cy,sc);s.push(poly(PN));H(s,PN,1.2,90);var HDp=M(EP(-36,-4,7,7),cx,cy,sc);s.push(poly(HDp));H(s,HDp,1.6,0);
  var MD=M(curve([[-40,-9],[-56,-24],[-72,-18],[-76,-6]],6).concat(curve([[-74,-8],[-66,-10],[-54,-12],[-41,-5]],6)),cx,cy,sc);s.push(poly(MD));H(s,MD,1.2,30);s.push(M([[-60,-19],[-58,-12]],cx,cy,sc));
  s.push(M(curve([[-38,-10],[-44,-24],[-40,-30]],4),cx,cy,sc));
  [[-22,8],[2,10],[26,10]].forEach(function(l,i){s.push(M([[l[0],l[1]],[l[0]-8,l[1]+8],[l[0]-14,16]],cx,cy,sc));s.push(M([[l[0]+3,l[1]],[l[0]+10,l[1]+7],[l[0]+16,16]],cx,cy,sc));});
  for(var gr=0;gr<RI(R,4,6);gr++){var gx=RR(R,6,290);s.push(quad([gx,196],[gx+RR(R,-6,6),ly+lh+RR(R,0,10)],[gx+RR(R,-10,10),ly+lh-RR(R,0,14)]));}
  H(s,[[4,ly+lh+6],[296,ly+lh+6],[296,196],[4,196]],RR(R,4.6,5.4),RR(R,15,30)*sgn(R));s.push([[4,ly+lh+6],[296,ly+lh+6]]);
  
  skyFill(s,ly+lh+6,RR(R,8,11),RR(R,5,5.6),5,[EL,PN]);return s;}},

{name:'Bumblebee on a foxglove',titles:['Inside the Bell','Pollen Coat','Hum of June','Speckled Throats','A Heavy Flight'],build(R){var s=[],g=RR(R,170,176),fx=RR(R,140,170),ft=RR(R,24,32);
  ground(s,R,g,RR(R,3.6,4.4));
  var st=quad([fx,g],[fx+RR(R,-8,8),(g+ft)/2],[fx+RR(R,-4,4),ft]);s.push(st);
  var bells=[],n=RI(R,8,10);for(var i=0;i<n;i++){var t=0.12+i/n*0.72,p=st[Math.floor(t*(st.length-1))],side=i%2?1:-1,sz=1-t*0.55;
    var bx=p[0]+side*4,by=p[1]+2,L=24*sz+6,W=8*sz+3,BE=[[bx,by-W*0.6]].concat(quad([bx,by-W*0.6],[bx+side*L*0.6,by-W*1.2],[bx+side*L,by-W*0.9],8)).concat(arc(bx+side*L,by,W*0.4,W,-PI/2,PI/2).map(function(q){return [bx+side*L+(q[0]-bx-side*L)*side,q[1]];})).concat(quad([bx+side*L,by+W],[bx+side*L*0.6,by+W*0.6],[bx,by+W*0.2],8));
    s.push(poly(BE));s.push([p,[bx,by]]);bells.push([bx+side*L,by,side,W]);for(var d=0;d<3;d++)s.push(circle(bx+side*(L*0.55+d*L*0.12),by+W*0.2,0.9));H(s,BE.slice(0,9).concat([[bx+side*L,by]]),2.2,90*side);}
  for(var b=0;b<5;b++){var tp=st[Math.floor((0.88+b*0.025)*(st.length-1))];s.push(EP(tp[0],tp[1]-2,1.6,3).concat([[tp[0],tp[1]+1]]));}
  for(var l=0;l<RI(R,4,6);l++){var side2=l%2?1:-1,lx=fx+side2*RR(R,22,40),LF=blob([[fx,g],[fx+side2*12,g-RR(R,16,24)],[lx,g-RR(R,22,34)],[lx+side2*6,g-RR(R,12,18)],[fx+side2*10,g-3]],5);s.push(poly(LF));s.push([[fx,g],[lx,g-RR(R,20,26)]]);}
  var tb=bells[RI(R,1,3)],bx2=tb[0]+tb[2]*14,by2=tb[1]-6;var BB=EP(bx2,by2,13,9);s.push(poly(BB));
  [-4,4].forEach(function(o){HX(s,[[[bx2+o-3,by2-10],[bx2+o+3,by2-10],[bx2+o+3,by2+10],[bx2+o-3,by2+10]],BB],1.1,90);});
  var hd=EP(bx2-tb[2]*15,by2+2,5,5);s.push(poly(hd));H(s,hd,1.2,0);s.push([[bx2-tb[2]*18,by2-2],[bx2-tb[2]*22,by2-10]]);
  s.push(EP(bx2+tb[2]*2,by2-16,10,5));s.push(EP(bx2+tb[2]*8,by2-13,8,4));
  for(var lg=0;lg<3;lg++)s.push([[bx2-tb[2]*(6-lg*5),by2+8],[bx2-tb[2]*(8-lg*5),by2+15]]);
  var g2=[];for(var f=0;f<RI(R,2,3);f++){var ox=fx+(f%2?1:-1)*RR(R,60,110);if(ox<10||ox>290)continue;s.push(quad([ox,g],[ox+RR(R,-6,6),g-40],[ox+RR(R,-4,4),g-RR(R,60,90)]));s.push(scallop(ox,g-RR(R,60,90)-4,4,4,6,0.3));}
  skyFill(s,g,RR(R,8,11),RR(R,4.4,5),5,[BB]);return s;}},

{name:'Manta ray',titles:['Wings Underwater','Gliding Over the Reef','Blue Hour, Deep Water','The Slow Flier'],build(R){var s=[],cx=RR(R,135,165),cy=RR(R,74,90),W=RR(R,96,108),sc=1;
  var bed=seabed(s,R,RR(R,166,174),RI(R,3,4));
  var MW=[[cx-W,cy-14],[cx-W*0.6,cy-24],[cx-18,cy-20],[cx-10,cy-30],[cx-6,cy-20],[cx+6,cy-20],[cx+10,cy-30],[cx+18,cy-20],[cx+W*0.6,cy-24],[cx+W,cy-14],[cx+W*0.55,cy+4],[cx+20,cy+24],[cx,cy+30],[cx-20,cy+24],[cx-W*0.55,cy+4]];
  var MB=blob(MW,5);s.push(poly(MB));clipIn(s,hatch(MB,RR(R,1.8,2.2),RR(R,-15,15)),MB,[EP(cx-W*0.45,cy-6,14,4),EP(cx+W*0.45,cy-6,14,4)]);
  s.push(quad([cx,cy+30],[cx+6,cy+60],[cx+RR(R,-10,10),cy+86]));
  for(var k=0;k<5;k++){s.push([[cx-14+k*7,cy+6],[cx-12+k*6,cy+12]]);}
  var rays=[];for(var r=0;r<RI(R,2,3);r++){var x0=RR(R,10,280);rays.push([[x0,4],[x0+20,4],[x0+70,140],[x0+56,140]]);}
  rays.forEach(function(P){behind(s,hatch(P,6,0),[MB]);});
  skyFill(s,interpY(bed,150)-1,7.5,7.5,5,[MB]);return s;}},

{name:'Nautilus shell',titles:['Chambers of the Deep','Golden Spiral','Sea Mathematics','Room by Room','Tide-Left Treasure'],build(R){var s=[],cx=RR(R,135,165),cy=RR(R,92,100),a=RR(R,3.9,4.3),b=0.17,rot=RR(R,-0.4,0.4);
  var rr=function(t){return a*Math.exp(b*t);},P=function(t){return [cx+rr(t)*Math.cos(t+rot),cy+rr(t)*Math.sin(t+rot)*0.95];};
  var T=4*PI+PI*0.9,sp=[];for(var t=0;t<=T;t+=0.05)sp.push(P(t));s.push(sp);
  var outer=[];for(var t2=T-2*PI;t2<=T;t2+=0.05)outer.push(P(t2+2*PI*0+0));
  var OS=[];for(var t3=T-2*PI;t3<=T;t3+=0.05)OS.push(P(t3));
  var lip=[];for(var t4=T-2*PI;t4<=T;t4+=0.05){var p=P(t4),q=P(t4-2*PI);lip.push(p);}
  for(var t5=2*PI+0.3;t5<T;t5+=0.42){var p1=P(t5),p0=P(t5-2*PI),mid=[(p1[0]+p0[0])/2+(p1[1]-p0[1])*0.25,(p1[1]+p0[1])/2-(p1[0]-p0[0])*0.25];s.push(quad(p0,mid,p1,10));}
  s.push([P(T),P(T-2*PI)]);
  var sh=[];for(var t6=T-2*PI+0.2;t6<T-0.3;t6+=0.35){var p2=P(t6),c=[cx,cy],L=Math.hypot(p2[0]-c[0],p2[1]-c[1]);var d=[(p2[0]-c[0])/L,(p2[1]-c[1])/L];var ST=[p2,[p2[0]-d[0]*L*0.18-d[1]*3,p2[1]-d[1]*L*0.18+d[0]*3],[p2[0]-d[0]*L*0.12-d[1]*6,p2[1]-d[1]*L*0.12+d[0]*6]];if(t6%1<0.6)H(s,ST.concat([[P(t6+0.18)[0],P(t6+0.18)[1]]]),1.1,RR(R,0,180));}
  var by=RR(R,160,168);s.push([[4,by],[296,by]]);for(var y=by+6;y<196;y+=RR(R,5,7))s.push(wave(4,296,y,1.2,RR(R,16,26),R()*6));s.push([[4,by],[4,194]]);
  var sx=cx-rr(T)*0.9;s.push(quad([cx-30,P(T)[1]+rr(T)*0.3>by?by:by],[cx,by+4],[cx+40,by]));
  for(var pb=0;pb<RI(R,4,7);pb++){var px=RR(R,10,290);if(Math.abs(px-cx)<rr(T)+10)continue;s.push(arc(px,by,RR(R,3,7),RR(R,2,4),PI,TAU));}
  var sf=cx<150?RR(R,230,260):RR(R,40,70);var SF=[];for(var k=0;k<10;k++){var ang=-PI/2+k*PI/5,rad=k%2?6:16;SF.push([sf+rad*Math.cos(ang),by-14+rad*Math.sin(ang)*0.6]);}s.push(poly(SF));H(s,SF,2,20);s.push([[sf,by-5],[sf,by]]);
  var SHp=[];for(var t7=T-2*PI;t7<=T;t7+=0.1)SHp.push(P(t7));
  skyFill(s,by,RR(R,7,8),RR(R,3.8,4.2),5,[SHp,SF]);return s;}},

{name:'Koi in a pond',titles:['Orange and White','Under the Pads','Slow Circles','Garden Pond, Noon','Ripples and Scales'],build(R){var s=[],cx=150,cy=100,rx=RR(R,136,142),ry=RR(R,88,92);
  var RIM=EP(cx,cy,rx,ry);s.push(poly(RIM));s.push(ellipse(cx,cy,rx-8,ry-7));for(var a=0;a<TAU;a+=RR(R,0.6,0.7)){s.push([[cx+(rx-8)*Math.cos(a),cy+(ry-7)*Math.sin(a)],[cx+rx*Math.cos(a+0.04),cy+ry*Math.sin(a+0.04)]]);}
  var holes=[],fish=RI(R,3,4);
  for(var f=0;f<fish;f++){var a2=f*TAU/fish+RR(R,-0.3,0.3),fx=cx+Math.cos(a2)*RR(R,40,70),fy=cy+Math.sin(a2)*RR(R,28,44),ang=a2+PI/2+RR(R,-0.4,0.4),L=RR(R,26,32);
    var body=blob([[-L,0],[-L*0.6,-7],[0,-9],[L*0.6,-5],[L,-1],[L,1],[L*0.6,5],[0,9],[-L*0.6,7]],4);var tail=[[L,0],[L+12,-8],[L+8,0],[L+12,8],[L,0]];
    var fin1=[[-L*0.3,-8],[-L*0.1,-17],[L*0.05,-9]],fin2=[[-L*0.3,8],[-L*0.1,17],[L*0.05,9]];
    var rotp=function(P){return rotateAbout(translate(P,fx,fy),fx,fy,ang);};
    var B=rotp(body);s.push(poly(B));s.push(rotp(tail));s.push(rotp(fin1));s.push(rotp(fin2));holes.push(B);holes.push(rotp(tail));
    for(var sp=0;sp<RI(R,2,3);sp++){var SP=rotp(blob([[-L*0.5+sp*L*0.5,-6],[-L*0.2+sp*L*0.5,-7],[-L*0.1+sp*L*0.5,4],[-L*0.45+sp*L*0.5,5]],3));H(s,SP,1.1,ang*180/PI+90);}
    s.push(circle(rotp([[-L*0.75,-4]])[0][0],rotp([[-L*0.75,-4]])[0][1],1.2));}
  var pads=[];for(var p=0;p<3;p++){var pa=RR(R,0,TAU),pr=RR(R,12,18),px=cx+Math.cos(pa)*(rx-30),py=cy+Math.sin(pa)*(ry-24);var PD=arc(px,py,pr,pr*0.8,pa+0.2,pa+TAU-0.2).concat([[px,py]]);s.push(poly(PD));for(var v=0;v<5;v++){var va=pa+0.5+v*1.1;s.push([[px,py],[px+pr*0.8*Math.cos(va),py+pr*0.64*Math.sin(va)]]);}pads.push(PD);
    if(p==0){var fl=scallop(px,py,6,5,8,0.4);s.push(fl);s.push(circle(px,py,2));}}
  for(var rg=0;rg<2;rg++){var rcx=cx+RR(R,-50,50),rcy=cy+RR(R,-30,30);s.push(ellipse(rcx,rcy,8,5));s.push(ellipse(rcx,rcy,14,9));holes.push(EP(rcx,rcy,15,10));}
  behind(s,hatch(EP(cx,cy,rx-9,ry-8),RR(R,4.2,4.6),RR(R,-10,10)),holes.concat(pads));
  s.push(rect(4,4,296,196));[[4,4],[296,4],[296,196],[4,196]].forEach(function(c){for(var k=1;k<4;k++)s.push(arc(c[0],c[1],k*9,k*9,0,TAU).filter(function(p){return p[0]>=4&&p[0]<=296&&p[1]>=4&&p[1]<=196;}));});return s;}},

{name:'Toucan on a branch',titles:['Banana Bill','Canopy Call','Bright Beak, Dark Coat','Rainforest Morning'],build(R){var s=[],cx=RR(R,120,150),by=RR(R,128,136),sc=RR(R,1.45,1.6);
  var BR=[[4,by+10],[60,by+3],[140,by+6],[220,by-2],[296,by-10]];var br=curve(BR,6),br2=curve(BR.map(function(p){return [p[0],p[1]+8];}),6);s.push(br);s.push(br2);
  for(var k=0;k<14;k++){var x=10+k*20;s.push([[x,interpY(br,x)+1],[x+8,interpY(br,x+8)+6]]);}
  var oy=interpY(br,cx);
  var Bd=M(blob([[-8,-2],[-16,-22],[-14,-44],[-4,-56],[10,-54],[14,-34],[8,-10],[10,8],[6,24],[-2,26],[-4,6]],6),cx,oy,sc);s.push(poly(Bd));
  var TH=M(blob([[-2,-55],[10,-53],[12,-42],[4,-36],[-6,-44]],4),cx,oy,sc);s.push(poly(TH));clipIn(s,hatch(Bd,1.3,RR(R,60,80)),Bd,[TH]);
  var top=quad([8,-55],[36,-72],[68,-54],10),bot=quad([68,-54],[38,-48],[10,-42],10),BK=M(top.concat(bot),cx,oy,sc);s.push(poly(BK));
  s.push(M(quad([12,-48],[40,-56],[68,-54],10),cx,oy,sc));H(s,M([[52,-62],[68,-54],[60,-49],[50,-50]],cx,oy,sc),1.2,90);H(s,M([[10,-55],[18,-59],[18,-44],[10,-43]],cx,oy,sc),1.6,0);
  s.push(circle(cx+3*sc,oy-50*sc,2.6));s.push(circle(cx+3*sc,oy-50*sc,1));
  s.push(M([[-2,0],[-4,4],[-8,6]],cx,oy,sc));s.push(M([[4,0],[4,5],[0,7]],cx,oy,sc));
  var leaves=[];for(var l=0;l<RI(R,6,8);l++){var lx=RR(R,10,290);if(Math.abs(lx-cx)<50)continue;var ly=interpY(br,lx),dir=R()<0.5?-1:1,L=RR(R,40,62),a=RR(R,-0.9,0.9)+(dir>0?PI/2:-PI/2);
    var tip=[lx+Math.sin(a)*L,ly+dir*Math.abs(Math.cos(a))*L*0.9],mid=lerp([lx,ly],tip,0.5),nx=-(tip[1]-ly)/L*12,ny=(tip[0]-lx)/L*12;
    var LF=quad([lx,ly],[mid[0]+nx,mid[1]+ny],tip,10).concat(quad(tip,[mid[0]-nx,mid[1]-ny],[lx,ly],10));s.push(poly(LF));s.push([[lx,ly],tip]);
    for(var v=0.2;v<0.9;v+=0.17){var vp=lerp([lx,ly],tip,v);s.push([vp,[vp[0]+nx*0.7,vp[1]+ny*0.7]]);}if(l%2)H(s,LF,2.4,RR(R,0,180));leaves.push(LF);}
  var vx=cx<150?RR(R,230,270):RR(R,30,70);s.push(curve([[vx,interpY(br,vx)],[vx+6,interpY(br,vx)-40],[vx-4,interpY(br,vx)-90],[vx+4,4]],6));
  skyFill(s,194,RR(R,8,11),RR(R,4.2,4.8),5,[Bd,BK].concat(leaves));return s;}},

{name:'Camel at an oasis',titles:['Water at Last','Ship of the Sand','Palms and Patience','Caravan Rest','Noon Shade'],build(R){var s=[],g=RR(R,158,164),cx=RR(R,120,150),sc=RR(R,1.15,1.25);
  var oy=g-60*sc;
  var Bd=M(blob([[-30,0],[-28,-14],[-12,-22],[2,-38],[16,-40],[26,-24],[36,-16],[40,-2],[30,8],[-20,8]],6),cx,oy,sc);s.push(poly(Bd));H(s,Bd,2.6,RR(R,20,40));
  var NK=M([[-28,-6],[-44,-14],[-52,-30],[-52,-40],[-62,-46],[-70,-44],[-72,-38],[-62,-34],[-56,-22],[-46,-4],[-30,6]],cx,oy,sc);s.push(poly(NK));H(s,NK,2.2,RR(R,60,80));
  s.push(circle(cx-62*sc,oy-42*sc,1.3));s.push(M([[-58,-46],[-56,-50],[-54,-46]],cx,oy,sc));
  [[-22,6],[-12,7],[24,7],[34,5]].forEach(function(l,i){var k=i%2?2:-2,LG=M([[l[0]-2.5,l[1]],[l[0]+2.5,l[1]],[l[0]+1.5+k,32],[l[0]+1,58],[l[0]+4,60],[l[0]-2.5,60],[l[0]-1.5,58],[l[0]-2+k,32]],cx,oy,sc);s.push(poly(LG));H(s,LG,1.2,90);});
  s.push(M(curve([[40,-4],[44,8],[42,22]],4),cx,oy,sc));
  var SD=M([[2,-38],[16,-40],[22,-30],[0,-28]],cx,oy,sc);H(s,SD,1.2,0);behind(s,hatch(M([[-30,6],[40,6],[40,60],[-30,60]],cx,oy,sc),5,0),[Bd].concat([[-22,6],[-12,7],[24,7],[34,5]].map(function(l){return M([[l[0]-5,l[1]-4],[l[0]+5,l[1]-4],[l[0]+5,61],[l[0]-5,61]],cx,oy,sc);})));
  var pl=[cx+RR(R,70,90),cx+RR(R,100,128)].filter(function(x){return x<285;});
  var pw=[cx-RR(R,60,30)+0,0];var px0=Math.min(cx+46,240);var PO=EP(px0+20,g+14,RR(R,40,50),7);s.push(poly(PO));H(s,PO,2.4,0);
  pl.forEach(function(px){var h=RR(R,90,120),lean=RR(R,-14,14),tr=quad([px,g],[px+lean*0.3,g-h*0.5],[px+lean,g-h]);s.push(tr);s.push(tr.map(function(p){return [p[0]+5,p[1]];}));for(var i=2;i<tr.length;i+=5)s.push([tr[i],[tr[i][0]+5,tr[i][1]]]);
    var tp=tr[tr.length-1];for(var f=0;f<6;f++){var a=-PI+f*PI/5+RR(R,-0.1,0.1),L=RR(R,26,36),e=[tp[0]+Math.cos(a)*L,tp[1]+Math.sin(a)*L*0.5+L*0.35],c=[tp[0]+Math.cos(a)*L*0.5,tp[1]-8];var fr=quad(tp,c,e,10);s.push(fr);for(var q=2;q<fr.length;q+=4)s.push([fr[q],[fr[q][0]+3,fr[q][1]+5]]);}
    s.push(circle(tp[0]+3,tp[1]+4,2.4));s.push(circle(tp[0]-2,tp[1]+5,2.4));});
  var du=[];for(var x=4;x<=296;x+=4)du.push([x,g-RR(R,0,1)-14*Math.max(0,Math.sin((x-RR(R,0,4))/48))-6]);var DU=du.concat([[296,g],[4,g]]);
  behind(s,[du].concat(hatch(DU,RR(R,4,5),RR(R,10,20))),[Bd,NK,[[cx-40,g],[cx-40,oy],[cx+50,oy],[cx+50,g]]].concat(pl.map(function(px){return [[px-4,g],[px-4,g-130],[px+24,g-130],[px+24,g]];})));
  s.push([[4,g],[296,g]]);H(s,[[4,g+4],[296,g+4],[296,196],[4,196]],RR(R,4,5),RR(R,-10,10));
  sunH(s,cx<150?RR(R,30,60):RR(R,240,270),g-20,0.01);
  skyFill(s,g-20,RR(R,8,11),RR(R,4.4,5),5,[Bd,NK]);return s;}}
);

SUBJ.push(
{name:'Cello on a stand',titles:['Before the Concert','Low Strings','Rosin and Maple','The Quiet Instrument','Practice Room, Evening'],build(R){var s=[],g=RR(R,176,182),cx=RR(R,120,170),sc=RR(R,0.84,0.88),oy=g-62*sc;
  floorS(s,R,g,RI(R,14,18));
  var rs=[[0,-48],[14,-46],[24,-38],[27,-26],[22,-14],[17,-6],[17,4],[24,12],[32,26],[32,38],[24,48],[10,52],[0,52]],ls=rs.slice(1,-1).reverse().map(function(p){return [-p[0],p[1]];});
  var BD=M(blob(rs.concat(ls),4),cx,oy,sc);s.push(poly(BD));s.push(M(blob(rs.concat(ls),4).map(function(p){return [p[0]*0.93,p[1]*0.95];}),cx,oy,sc));
  var sd=sgn(R);clipIn(s,hatch(BD,1.8,90),BD,[M(sd>0?[[-40,-60],[8,-60],[8,60],[-40,60]]:[[-8,-60],[40,-60],[40,60],[-8,60]],cx,oy,sc)]);
  var FB=M([[-4,-112],[4,-112],[5,-20],[-5,-20]],cx,oy,sc);s.push(poly(FB));H(s,FB,1,90);
  s.push(M([[-3,-112],[-4,-128],[4,-128],[3,-112]],cx,oy,sc));s.push(spiral(cx+2*sc,oy-133*sc,0.5,6*sc,1.6,0));
  for(var k=0;k<2;k++){s.push(M([[-4,-118+k*7],[-10,-120+k*7]],cx,oy,sc));s.push(M([[4,-121+k*7],[10,-123+k*7]],cx,oy,sc));}
  for(var st=-1.5;st<=1.5;st++)s.push(M([[st*1.6,-112],[st*2.2,40]],cx,oy,sc));
  s.push(M([[-9,24],[9,24],[7,19],[-7,19],[-9,24]],cx,oy,sc));var TP=M([[-6,32],[6,32],[3,50],[-3,50]],cx,oy,sc);s.push(poly(TP));H(s,TP,1,90);
  [-12,12].forEach(function(fx){s.push(M(curve([[fx-2,-6],[fx+2,0],[fx-2,10],[fx+2,18]],5),cx,oy,sc));s.push(circle(cx+(fx-2)*sc,oy-7*sc,1));s.push(circle(cx+(fx+2)*sc,oy+19*sc,1));});
  s.push([[cx,oy+52*sc],[cx+2,g]]);
  var bx=cx+RR(R,40,56)*(cx<150?1:-1);s.push([[bx,g],[bx+(cx<150?-8:8),g-150]]);s.push([[bx+3,g],[bx+3+(cx<150?-8:8),g-150]]);s.push(rect(bx-3,g-18,bx+5,g-10));
  var mx=cx<150?RR(R,236,262):RR(R,32,60),MS=[[mx-26,g-96],[mx+26,g-96],[mx+22,g-64],[mx-22,g-64]];s.push(poly(MS));for(var y=g-90;y<g-68;y+=3.5)s.push([[mx-20,y],[mx+20,y]]);
  s.push([[mx,g-64],[mx,g-10]]);s.push([[mx-18,g],[mx,g-10],[mx+18,g]]);
  skyFill(s,g,RR(R,8,11),RR(R,4.6,5.2),5,[BD,FB,MS]);return s;}},

{name:'French horn',titles:['Brass Coil','Hunting Call','Hand in the Bell','Mellow Brass','Orchestra Pit'],build(R){var s=[],y=RR(R,156,162),cx=RR(R,120,150),cy=y-RR(R,52,58);
  tableS(s,R,y);
  var holes=[];for(var k=0;k<3;k++){var r=34-k*6;s.push(ellipse(cx,cy,r,r*0.9));s.push(ellipse(cx,cy,r-3,(r-3)*0.9));}
  holes.push(EP(cx,cy,35,32));H(s,arc(cx,cy,37,34,PI*0.1,PI*0.9).concat(arc(cx,cy,34,31,PI*0.9,PI*0.1)),1.4,30);
  var bx=cx+RR(R,62,72),by=cy-RR(R,6,14),BR=RR(R,26,32);
  s.push(cubic([cx+30,cy+14],[cx+46,cy+18],[bx-22,by+16],[bx-6,by+BR*0.9]));s.push(cubic([cx+30,cy+8],[cx+48,cy+8],[bx-20,by],[bx-6,by-BR*0.9]));
  var BL=EP(bx,by,10,BR);s.push(poly(BL));s.push(ellipse(bx,by,6,BR-5));H(s,EP(bx,by,6,BR-5),1.5,90);holes.push(BL);
  for(var v=0;v<3;v++){var vx=cx-14+v*12,vy=cy-40;s.push(circle(vx,vy,5));s.push(circle(vx,vy,2));s.push([[vx,vy+5],[vx,cy-31]]);s.push([[vx-2,vy-5],[vx-2,vy-12],[vx+2,vy-12],[vx+2,vy-5]]);}
  s.push([[cx-30,cy-12],[cx-60,cy-34],[cx-70,cy-34]]);s.push([[cx-30,cy-8],[cx-62,cy-30],[cx-70,cy-30]]);s.push(rect(cx-80,cy-35,cx-70,cy-29));s.push(EP(cx-82,cy-32,2,5).concat([[cx-80,cy-35]]));
  s.push(cubic([cx+20,cy-24],[cx+8,cy-60],[cx-30,cy-54],[cx-28,cy-34]));
  var sx=cx<150?RR(R,216,240):RR(R,24,50),SH=[[sx,y-2],[sx+52,y-2],[sx+48,y-14],[sx-4,y-14]];s.push(poly(SH));for(var l=0;l<4;l++)s.push([[sx+2+l*0,y-4-l*2.5],[sx+48-l,y-4-l*2.5]]);
  skyFill(s,y,RR(R,8,11),RR(R,4.4,5),5,[EP(cx,cy,36,33),BL,[[cx+28,cy+16],[bx-6,by+BR],[bx-6,by-BR],[cx+28,cy+6]]]);return s;}},

{name:'Pipe organ',titles:['Sunday Thunder','Forty Ranks','The Loft','Pipes and Pedals','Fugue at Noon'],build(R){var s=[],g=RR(R,182,188),cx=150,cw=RR(R,120,136),ct=RR(R,108,116);
  floorS(s,R,g,RI(R,14,18));
  var CS=[[cx-cw/2,g],[cx-cw/2,ct],[cx+cw/2,ct],[cx+cw/2,g]];s.push(CS);s.push(rect(cx-cw/2-4,ct-6,cx+cw/2+4,ct));
  var n=RI(R,13,17),pw=cw/n,PS=[];for(var i=0;i<n;i++){var x0=cx-cw/2+i*pw+1,x1=x0+pw-2,d=Math.abs(i-(n-1)/2)/((n-1)/2),top=ct-6-RR(R,0,4)-(1-d*d)*RR(R,80,92)-14;
    var P=[[x0,ct-6],[x0,top]].concat(arc((x0+x1)/2,top,(x1-x0)/2,2.5,PI,TAU)).concat([[x1,ct-6]]);s.push(P);PS.push(P.concat([[x0,ct-6]]));
    var my=ct-26-(1-d)*6;s.push([[x0,my],[(x0+x1)/2,my-5],[x1,my]]);H(s,[[x0+(x1-x0)*0.6,top],[x1,top],[x1,ct-6],[x0+(x1-x0)*0.6,ct-6]],1.3,90);}
  for(var a=0;a<5;a++){var ax=cx-cw/2+10+a*(cw-20)/4;s.push(arc(ax,ct+16,10,10,PI,TAU));s.push([[ax-10,ct+16],[ax-10,ct+30]]);}
  var ky=ct+48;for(var m=0;m<3;m++){var yy=ky+m*9;s.push(rect(cx-50,yy,cx+50,yy+6));s.push(comb(cx-50,cx+50,yy+6,6,4));}
  for(var sp=0;sp<5;sp++){s.push(circle(cx-60+sp*0,ky+sp*6,2));s.push(circle(cx+60,ky+sp*6,2));}
  var by=g-14;s.push(rect(cx-44,by-6,cx+44,by));s.push([[cx-40,by],[cx-40,g]]);s.push([[cx+40,by],[cx+40,g]]);
  H(s,[[cx-cw/2,ky-8],[cx+cw/2,ky-8],[cx+cw/2,ky-4],[cx-cw/2,ky-4]],1.2,0);
  skyFill(s,g,RR(R,8,11),RR(R,5,5.6),5,PS.concat([CS]));return s;}},

{name:'Hand saw and sawhorse',titles:['Measure Twice','Halfway Through','Pine Shavings','Saturday Project'],build(R){var s=[],g=RR(R,178,184),hx=RR(R,90,120),hw=RR(R,108,118),ht=g-RR(R,52,58);
  floorS(s,R,g,RI(R,12,16));
  s.push(rect(hx,ht,hx+hw,ht+8));H(s,[[hx,ht],[hx+hw,ht],[hx+hw,ht+8],[hx,ht+8]],2.4,0);
  [hx+10,hx+hw-10].forEach(function(lx){s.push([[lx-2,ht+8],[lx-14,g]]);s.push([[lx+2,ht+8],[lx-8,g]]);s.push([[lx+2,ht+8],[lx+14,g]]);s.push([[lx+6,ht+8],[lx+20,g]]);s.push([[lx-11,g-14],[lx+17,g-14]]);});
  var py=ht-8,px0=hx-RR(R,30,40),px1=hx+hw+RR(R,20,40),PL=[[px0,py],[px1,py],[px1,ht],[px0,ht]];s.push(poly(PL));for(var k=0;k<4;k++)s.push(wave(px0+2,px1-2,py+1.6+k*1.6,0.4,RR(R,20,40),R()*6));
  var cx=hx+hw+RR(R,-6,4);s.push([[cx,py],[cx+1,ht]]);
  var a=PI+RR(R,0.6,0.8),L=96,bx=cx+2,by=py+4,tip=[bx-Math.cos(a)*L*0.15,by-Math.sin(a)*L*0.15*-1];
  var dir=[Math.cos(a),Math.sin(a)],nrm=[-dir[1],dir[0]];
  var p0=[cx-dir[0]*10,py+6-dir[1]*10],p1=[p0[0]+dir[0]*L,p0[1]+dir[1]*L];
  var BL=[p0,[p1[0],p1[1]],[p1[0]+nrm[0]*-22,p1[1]+nrm[1]*-22],[p0[0]+nrm[0]*-10,p0[1]+nrm[1]*-10]];s.push(poly(BL));
  var teeth=[];for(var t=0;t<=1.001;t+=0.025){var q=[p0[0]+dir[0]*L*t,p0[1]+dir[1]*L*t];teeth.push(q);teeth.push([q[0]+dir[0]*1.2+nrm[0]*1.8,q[1]+dir[1]*1.2+nrm[1]*1.8]);}s.push(teeth);
  var hc=[p1[0]+nrm[0]*-11+dir[0]*8,p1[1]+nrm[1]*-11+dir[1]*8],HA=rotateAbout(blob([[-6,-16],[10,-16],[18,-6],[18,8],[10,16],[-6,16],[-2,0]],4).map(function(p){return [p[0]+hc[0],p[1]+hc[1]];}),hc[0],hc[1],a);s.push(poly(HA));H(s,HA,1.8,a*180/PI+60);s.push(ellipse(hc[0]+dir[0]*6,hc[1]+dir[1]*6,4,6));
  for(var d=0;d<RI(R,3,5);d++){var dx=cx+RR(R,-14,14);s.push(arc(dx,g,RR(R,4,8),RR(R,2,4),PI,TAU));}
  var ry=RR(R,40,50);s.push([[16,ry],[284,ry]]);s.push([[16,ry+4],[284,ry+4]]);var tl=RR(R,20,40);[0,1,2,3].forEach(function(k){var tx2=tl+k*RR(R,60,70);if(tx2>280)return;s.push([[tx2,ry+4],[tx2,ry+10]]);if(k%2==0){s.push(rect(tx2-2,ry+10,tx2+2,ry+44));var HM=[[tx2-10,ry+44],[tx2+12,ry+44],[tx2+12,ry+52],[tx2-10,ry+52]];s.push(poly(HM));H(s,HM,1.4,0);}else{var SQ=[[tx2,ry+10],[tx2+6,ry+10],[tx2+6,ry+50],[tx2+34,ry+50],[tx2+34,ry+56],[tx2,ry+56]];s.push(poly(SQ));H(s,[[tx2,ry+10],[tx2+6,ry+10],[tx2+6,ry+56],[tx2,ry+56]],1.4,90);}});
  s.push(scallop(cx,g,12,4,9,0.3));
  var tx=hx<105?RR(R,240,270):RR(R,22,40);s.push(rect(tx,g-8,tx+24,g));s.push(rect(tx+3,g-14,tx+21,g-8));s.push(circle(tx+12,g-11,2));
  skyFill(s,g,RR(R,7,9),RR(R,4,4.4),5,[PL,BL,HA]);return s;}},

{name:'Oil can on a workbench',titles:['A Drop for the Hinges','Garage Still Life','Grease and Patience','Fix-It Saturday'],build(R){var s=[],y=RR(R,150,156),cx=RR(R,110,140);
  tableS(s,R,y);
  var CB=[[cx-30,y],[cx+30,y],[cx+18,y-34],[cx-18,y-34]];s.push(poly(CB));s.push(ellipse(cx,y,30,5));s.push(ellipse(cx,y-34,18,4));H(s,[[cx+6,y-34],[cx+18,y-34],[cx+30,y],[cx+12,y]],1.4,90);
  for(var r=0;r<3;r++)s.push(arc(cx,y-8-r*8,27-r*3.6,4,0,PI));
  var SP=[[cx-6,y-36],[cx+6,y-36],[cx+2,y-46],[cx-2,y-46]];s.push(poly(SP));var a=RR(R,-0.35,-0.2)+(R()<0.5?0:-PI+0.55),L=RR(R,48,58);s.push([[cx-1,y-46],[cx-1+Math.cos(a)*L,y-46+Math.sin(a)*L]]);s.push([[cx+1.5,y-46],[cx+1.5+Math.cos(a)*L,y-46+Math.sin(a)*L+1.2]]);
  s.push(rect(cx+12,y-40,cx+26,y-36));s.push([[cx+24,y-40],[cx+30,y-50]]);
  var wx=cx+RR(R,50,64),wy=y-6,wa=RR(R,-0.15,0.15),W=rotateAbout([[wx,wy-4],[wx+84,wy-4],[wx+84,wy+4],[wx,wy+4]],wx+40,wy,wa);s.push(poly(W));H(s,W,1.6,wa*180/PI);
  var JW=rotateAbout([[wx-4,wy-4],[wx-14,wy-12],[wx-26,wy-12],[wx-30,wy-6],[wx-22,wy-6],[wx-20,wy+2],[wx-28,wy+2],[wx-26,wy+8],[wx-12,wy+8],[wx-4,wy+4]],wx+40,wy,wa);s.push(poly(JW));s.push(circle(wx+76,wy,2.5));
  for(var n=0;n<RI(R,3,5);n++){var nx=cx-RR(R,46,80)+n*12,hexP=[];for(var k=0;k<6;k++)hexP.push([nx+4.5*Math.cos(k*PI/3),y-3+3*Math.sin(k*PI/3)]);s.push(poly(hexP));s.push(ellipse(nx,y-3,2,1.3));}
  var rx=cx-RR(R,100,116);if(rx>8){var RG=blob([[rx,y],[rx+6,y-14],[rx+20,y-10],[rx+30,y-18],[rx+38,y-4],[rx+34,y]],4);s.push(poly(RG));for(var f=0;f<4;f++)s.push(quad([rx+6+f*7,y],[rx+8+f*7,y-8],[rx+12+f*7,y-12]));}
  var sh=RR(R,60,72);s.push([[20,sh],[280,sh]]);s.push([[20,sh+4],[280,sh+4]]);[40,150,260].forEach(function(bx){s.push([[bx,sh+4],[bx,sh+14],[bx+10,sh+4]]);});
  for(var j=0;j<RI(R,3,5);j++){var jx=RR(R,20,260),jh=RR(R,16,28),JR=[[jx,sh],[jx,sh-jh],[jx+18,sh-jh],[jx+18,sh]];s.push(JR);s.push(rect(jx-1,sh-jh-4,jx+19,sh-jh));H(s,[[jx+2,sh-jh*0.6],[jx+16,sh-jh*0.6],[jx+16,sh-2],[jx+2,sh-2]],2,0);}
  skyFill(s,y,RR(R,7,9),RR(R,3.8,4.2),5,[CB]);return s;}},

{name:'Samovar',titles:['Tea for the Whole Table','Brass and Steam','Winter Kitchen','Long Conversation','Glasses in Silver Holders'],build(R){var s=[],y=RR(R,164,170),cx=RR(R,130,160);
  tableS(s,R,y);
  var TR=EP(cx,y-3,54,6);s.push(poly(TR));s.push(ellipse(cx,y-3,48,4));
  var BS=[[cx-22,y-6],[cx-12,y-16],[cx-14,y-24],[cx+14,y-24],[cx+12,y-16],[cx+22,y-6]];s.push(BS);H(s,BS.concat([[cx-22,y-6]]),1.6,0);
  var UB=blob([[cx-14,y-24],[cx-30,y-40],[cx-34,y-70],[cx-26,y-96],[cx-16,y-104],[cx+16,y-104],[cx+26,y-96],[cx+34,y-70],[cx+30,y-40],[cx+14,y-24]],5);s.push(poly(UB));
  for(var r=0;r<3;r++)s.push(arc(cx,y-50-r*18,33-Math.abs(r-1)*3,4,0,PI));var sd=sgn(R);H(s,sd>0?[[cx+12,y-100],[cx+28,y-94],[cx+34,y-70],[cx+30,y-42],[cx+12,y-28]]:[[cx-12,y-100],[cx-28,y-94],[cx-34,y-70],[cx-30,y-42],[cx-12,y-28]],1.6,90);
  [-1,1].forEach(function(d){s.push([[cx+d*30,y-90],[cx+d*44,y-90],[cx+d*46,y-80],[cx+d*36,y-80]]);s.push(circle(cx+d*46,y-85,3));});
  s.push([[cx-4,y-50],[cx-4,y-46],[cx-24*0-30,y-46]]);var TP=[[cx-32,y-52],[cx-46,y-50],[cx-48,y-46],[cx-44,y-44],[cx-32,y-44]];s.push(TP);s.push([[cx-44,y-50],[cx-44,y-58],[cx-38,y-58]]);
  var CR=[[cx-16,y-104],[cx-10,y-112],[cx+10,y-112],[cx+16,y-104]];s.push(CR);
  var tx=cx,ty=y-112,TP2=blob([[tx-14,ty],[tx-18,ty-12],[tx-10,ty-22],[tx+10,ty-22],[tx+18,ty-12],[tx+14,ty]],4);s.push(poly(TP2));H(s,TP2,2.2,RR(R,30,60));s.push([[tx+16,ty-12],[tx+28,ty-20],[tx+30,ty-24]]);s.push(arc(tx-18,ty-12,6,7,PI/2,1.5*PI));s.push(rect(tx-4,ty-27,tx+4,ty-22));s.push(circle(tx,ty-29,2));
  var sm=[[tx+30,ty-24]];for(var k=1;k<5;k++)sm.push([tx+30+k*6+RR(R,-2,2),ty-24-k*8]);s.push(curve(sm,5));
  for(var gl=0;gl<RI(R,2,3);gl++){var gx=cx+(gl%2?1:-1)*RR(R,74,92)+(gl>1?24:0);if(gx<14||gx>286)continue;var GL=[[gx-8,y],[gx-9,y-26],[gx+9,y-26],[gx+8,y]];s.push(poly(GL));H(s,[[gx-7,y-14],[gx+7,y-14],[gx+7,y-2],[gx-7,y-2]],1.4,0);s.push(arc(gx+10,y-14,6,7,-PI/2,PI/2));for(var c=0;c<4;c++)s.push([[gx-8.5,y-22+c*5],[gx+8.5,y-24+c*5]]);}
  skyFill(s,y,RR(R,8,11),RR(R,4.4,5),5,[UB,TP2]);return s;}},

{name:'Pie on a windowsill',titles:['Cooling','Lattice and Steam','Blackberry Season','Left Out to Tempt You','Kitchen Window, Four O\'Clock'],build(R){var s=[],sy=RR(R,138,146),wx0=RR(R,64,80),wx1=300-wx0,wt=RR(R,18,26);
  s.push(rect(wx0,wt,wx1,sy));s.push(rect(wx0+6,wt+6,wx1-6,sy-2));var mx=(wx0+wx1)/2;s.push([[mx,wt+6],[mx,sy-2]]);s.push([[wx0+6,(wt+sy)/2],[wx1-6,(wt+sy)/2]]);
  s.push([[wx0-14,sy],[wx1+14,sy],[wx1+14,sy+8],[wx0-14,sy+8],[wx0-14,sy]]);H(s,[[wx0-14,sy+8],[wx1+14,sy+8],[wx1+10,sy+13],[wx0-10,sy+13]],1.4,0);
  var hl=[];for(var x=wx0+6;x<=wx1-6;x+=6)hl.push([x,sy-26-12*Math.sin((x-wx0)/40)-6*Math.sin(x/17)]);s.push(hl);
  A(s,clipIn([],hatch(hl.concat([[wx1-6,sy-2],[wx0+6,sy-2]]),3.2,0),[[wx0+6,wt+6],[wx1-6,wt+6],[wx1-6,sy-2],[wx0+6,sy-2]]));
  var pcx=mx+RR(R,-30,30),py=sy-2,PR=RR(R,34,40),PT=EP(pcx,py-12,PR,9);s.push(poly(PT));s.push([[pcx-PR-3,py-12],[pcx-PR+4,py],[pcx+PR-4,py],[pcx+PR+3,py-12]]);H(s,[[pcx-PR+4,py-6],[pcx+PR-4,py-6],[pcx+PR-4,py],[pcx-PR+4,py]],1.3,0);
  s.push(scallop(pcx,py-12,PR,9,22,0.06));var inner=EP(pcx,py-12,PR-5,6.5);HX(s,[inner],4.6,40);HX(s,[inner],4.6,-40);
  for(var k=0;k<3;k++){var sx=pcx-12+k*12,sm=[[sx,py-22]];for(var j=1;j<5;j++)sm.push([sx+5*Math.sin(j*1.5+k),py-22-j*7]);s.push(curve(sm,5));}
  var fx=pcx<mx?RR(R,mx+30,wx1-26):RR(R,wx0+26,mx-30);s.push([[fx-10,sy],[fx-12,sy-16],[fx+12,sy-16],[fx+10,sy]]);s.push(rect(fx-13,sy-19,fx+13,sy-16));for(var f=0;f<5;f++){var a=-PI/2+(f-2)*0.4,ex=fx+Math.cos(a)*22,ey=sy-19+Math.sin(a)*22;s.push(quad([fx,sy-19],[fx+Math.cos(a)*12,sy-26],[ex,ey]));s.push(scallop(ex,ey,3.5,3.5,6,0.4));}
  [[wx0-2,1],[wx1+2,-1]].forEach(function(c){var x=c[0],d=c[1],CU=[[x,6],[x-d*44,6],[x-d*40,60],[x-d*48,sy+30]].concat(quad([x-d*48,sy+30],[x-d*20,sy],[x+d*4,sy-30])).concat([[x,6]]);s.push(poly(CU));for(var q=1;q<5;q++)s.push(quad([x-d*q*9,8],[x-d*(q*9+4),70],[x-d*q*10,sy+10]));});
  s.push([[4,6],[296,6]]);
  var W=[[[4,8],[296,8],[296,196],[4,196]],[[wx0-14,wt-2],[wx1+14,wt-2],[wx1+14,sy+14],[wx0-14,sy+14]]];HX(s,W,RR(R,5,6),RR(R,70,90));
  return s;}},

{name:'Preserve jars on a shelf',titles:['Summer in Glass','The Pantry Shelf','Apricot, Plum, Fig','Labeled in Pencil','Put Up for Winter'],build(R){var s=[],ys=[RR(R,96,102),RR(R,176,182)],sol=[];
  ys.forEach(function(y,row){s.push([[12,y],[288,y]]);s.push([[12,y+6],[288,y+6]]);H(s,[[12,y],[288,y],[288,y+6],[12,y+6]],2,0);[30,270].forEach(function(bx){s.push([[bx,y+6],[bx,y+20],[bx+12,y+6]]);});
    var x=RR(R,12,24);while(x<262){var w=RR(R,32,44),h=RR(R,36,62),top=y-h,J=[[x,y]].concat(arc(x+5,y-5,5,5,PI/2,PI)).concat([[x,top+10]]).concat(arc(x+6,top+10,6,6,PI,1.5*PI)).concat([[x+w-6,top+4]]).concat(arc(x+w-6,top+10,6,6,1.5*PI,TAU)).concat([[x+w,y-5]]).concat(arc(x+w-5,y-5,5,5,0,PI/2));
      s.push(J.concat([[x,y]]));sol.push(J);var lid=R()<0.5;if(lid){var LD=[[x+3,top+4],[x+w-3,top+4],[x+w-3,top-4],[x+3,top-4]];s.push(poly(LD));H(s,LD,1.2,90);}else{var CL=[[x-3,top+10]].concat(arc(x+w/2,top+4,w/2+3,8,PI,TAU)).concat([[x+w+3,top+10]]);s.push(CL.concat(wave(x-3,x+w+3,top+11,1.2,6,0).reverse()));s.push([[x,top+7],[x+w,top+7]]);H(s,arc(x+w/2,top+4,w/2+2,7,PI,TAU),2,45);}
      var fill=top+RR(R,12,18),kind=RI(R,0,2);if(kind==0)H(s,[[x+2,fill],[x+w-2,fill],[x+w-2,y-3],[x+2,y-3]],RR(R,1.8,2.6),RR(R,-50,50));else if(kind==1){var FP=[[x+2,fill],[x+w-2,fill],[x+w-2,y-3],[x+2,y-3]];HX(s,[FP],3.2,45);HX(s,[FP],3.2,-45);s.push([[x+2,fill],[x+w-2,fill]]);}else{s.push([[x+2,fill],[x+w-2,fill]]);for(var p=0;p<3;p++)s.push(EP(x+w/2,fill+8+p*((y-fill-12)/3),w*0.3,4).concat([[x+w/2+w*0.3,fill+8+p*((y-fill-12)/3)]]));}
      var LB=[[x+5,y-h*0.45],[x+w-5,y-h*0.45],[x+w-5,y-h*0.45+10],[x+5,y-h*0.45+10]];s.push(poly(LB));s.push([[x+8,y-h*0.45+4],[x+w-8,y-h*0.45+4]]);
      x+=w+RR(R,8,16);}});
  s.push(rect(4,4,296,196));return s;}},

{name:'Wood-fired pizza oven',titles:['Ninety Seconds','Embers and Dough','Backyard Fire','The Dome','Saturday Pies'],build(R){var s=[],g=RR(R,168,174),cx=RR(R,130,160),bw=RR(R,62,70),bt=g-RR(R,40,46),dh=RR(R,58,66);
  ground(s,R,g,RR(R,3.6,4.4));
  var BASE=[[cx-bw-4,g],[cx-bw-4,bt],[cx+bw+4,bt],[cx+bw+4,g]];s.push(BASE);s.push(brickS(cx-bw-4,bt+4,cx+bw+4,g,14,7));var BB=[[cx-bw-6,bt-4],[cx+bw+6,bt-4],[cx+bw+6,bt+2],[cx-bw-6,bt+2]];s.push(poly(BB));H(s,BB,1.5,0);
  var DOME=[[cx-bw,bt-4]].concat(arc(cx,bt-4,bw,dh,PI,TAU));s.push(DOME);var MO=archP(cx,bt-4,20,10);s.push(MO);
  clipIn(s,[brickS(cx-bw,bt-4-dh,cx+bw,bt-4,12,6.5)].map(function(st){return st;}),poly(DOME),[MO]);
  var FI=EP(cx,bt-12,16,8);var fl=[[cx-14,bt-5]];for(var f=0;f<6;f++)fl.push([cx-12+f*5,bt-12-RR(R,6,14)],[cx-10+f*5,bt-6]);s.push(fl);H(s,[[cx-18,bt-5],[cx+18,bt-5],[cx+18,bt-24],[cx-18,bt-24]].map(function(p){return p;}),1.2,0);
  var ch=[[cx+bw*0.4,bt-4-dh*0.8],[cx+bw*0.4,bt-4-dh-30],[cx+bw*0.4+12,bt-4-dh-30],[cx+bw*0.4+12,bt-4-dh*0.75]];s.push(ch);s.push(rect(cx+bw*0.4-3,bt-dh-38,cx+bw*0.4+15,bt-dh-34));
  var sm=[[cx+bw*0.4+6,bt-dh-38]];for(var k=1;k<5;k++)sm.push([cx+bw*0.4+6+k*7+RR(R,-2,2),bt-dh-38-k*7]);s.push(curve(sm,5));
  var px=cx-bw-RR(R,18,26);s.push([[px,g],[px+22,g-110]]);s.push([[px+3,g],[px+25,g-110]]);var PE=EP(px+28,g-122,12,14);s.push(poly(PE));
  var lx=cx+bw+RR(R,12,18);for(var r=0;r<3;r++)for(var c=0;c<3-r;c++){var lc=[lx+10+c*14+r*7,g-7-r*12];s.push(circle(lc[0],lc[1],6.5));s.push(circle(lc[0],lc[1],2.5));}
  skyFill(s,g,RR(R,8,11),RR(R,4.4,5),5,[DOME,PE]);return s;}},

{name:'Tin robot toy',titles:['Wind Me Up','Sparks and Springs','Toy Shelf Hero','Clockwork Friend','Beep, Whirr, March'],build(R){var s=[],y=RR(R,172,178),cx=RR(R,130,160);
  tableS(s,R,y);
  var lgw=12,hip=y-36;[cx-16,cx+4].forEach(function(lx){box3(s,lx,hip,lgw,30,4,2,1);var FT=[[lx-3,y-6],[lx+lgw+3,y-6],[lx+lgw+3,y],[lx-3,y]];s.push(poly(FT));H(s,FT,1.4,0);});
  var tw=48,th=48,tt=hip-th;box3(s,cx-tw/2,tt,tw,th,8,2.2,1);
  var PN=[[cx-16,tt+8],[cx+16,tt+8],[cx+16,tt+30],[cx-16,tt+30]];s.push(poly(PN));for(var d=0;d<3;d++){s.push(circle(cx-10+d*10,tt+15,3.5));s.push([[cx-10+d*10,tt+15],[cx-10+d*10+2,tt+12.5]]);}
  for(var l=0;l<4;l++)s.push([[cx-12,tt+22+l*2],[cx+12,tt+22+l*2]]);s.push(rect(cx-6,tt+36,cx+6,tt+42));
  [-1,1].forEach(function(dd){var ax=dd<0?cx-tw/2-10:cx+tw/2+8;var AR=[[ax,tt+6],[ax+10,tt+6],[ax+10,tt+34],[ax,tt+34]];s.push(poly(AR));for(var r=0;r<4;r++)s.push([[ax,tt+12+r*6],[ax+10,tt+12+r*6]]);
    s.push([[ax+1,tt+34],[ax-2,tt+44],[ax+5,tt+40],[ax+12,tt+44],[ax+9,tt+34]]);});
  var hw=32,hh=28,ht=tt-hh-4;s.push(rect(cx-5,tt-4,cx+5,tt));box3(s,cx-hw/2,ht,hw,hh,6,2,1);
  [cx-8,cx+8].forEach(function(ex){s.push(circle(ex,ht+10,5));s.push(circle(ex,ht+10,2));H(s,EP(ex,ht+10,1.8,1.8),0.8,0);});
  var MO=[[cx-9,ht+19],[cx+9,ht+19],[cx+9,ht+24],[cx-9,ht+24]];s.push(poly(MO));for(var m=0;m<4;m++)s.push([[cx-6+m*4,ht+19],[cx-6+m*4,ht+24]]);
  s.push([[cx,ht],[cx,ht-14]]);s.push(circle(cx,ht-17,3));[[-1],[1]].forEach(function(d){s.push([[cx+d*hw/2,ht+10],[cx+d*(hw/2+6),ht+10]]);s.push(circle(cx+d*(hw/2+8),ht+10,2.5));});
  var kx=cx+tw/2+8;s.push([[kx,tt+20],[kx+12,tt+20]]);s.push(EP(kx+18,tt+14,4,6).concat([[kx+14,tt+14]]));s.push(EP(kx+18,tt+26,4,6).concat([[kx+14,tt+26]]));
  var bx=cx<150?RR(R,210,236):RR(R,30,56),BX=[[bx,y],[bx,y-34],[bx+40,y-34],[bx+40,y]];box3(s,bx,y-34,40,34,10,0,1);for(var st=0;st<5;st++)s.push([[bx+4,y-30+st*6],[bx+36,y-30+st*6]]);
  skyFill(s,y,RR(R,8,11),RR(R,4.4,5),5,[[[cx-tw/2,tt],[cx+tw/2+8,tt-5],[cx+tw/2+8,hip-5],[cx+tw/2,hip]]]);return s;}},

{name:'Dollhouse',titles:['Rooms Without a Front Wall','Tiny Staircase','Somebody\'s Attic','Little Lives','Lamplight in Miniature'],build(R){var s=[],g=RR(R,176,182),cx=RR(R,135,165),w=RR(R,130,140),fh=RR(R,44,48),x0=cx-w/2,x1=cx+w/2;
  floorS(s,R,g,RI(R,14,18));
  var b0=g-4,f1=b0-fh,f2=f1-fh,rt=f2-RR(R,40,48);s.push(rect(x0-4,b0,x1+4,g));
  s.push([[x0,b0],[x0,f2]]);s.push([[x1,b0],[x1,f2]]);s.push([[x0,f1],[x1,f1]]);s.push([[x0,f1+3],[x1,f1+3]]);s.push([[x0-4,f2],[x1+4,f2]]);s.push([[x0,f2+3],[x1,f2+3]]);
  var RF=[[x0-8,f2],[cx,rt],[x1+8,f2]];s.push(poly(RF));s.push(scallopRows(x0+6,x1-6,f2-8,f2-4,7,4));s.push(scallopRows(x0+22,x1-22,f2-18,f2-14,7,4));
  var mw=cx+RR(R,-10,10);s.push([[mw,b0],[mw,f2+3]]);
  s.push(rect(cx-10,rt+14,cx+10,f2-22));s.push([[cx,rt+14],[cx,f2-22]]);var ch=[[x1-30,interpY([[cx,rt],[x1+8,f2]],x1-30)],[x1-30,rt-4],[x1-20,rt-4],[x1-20,interpY([[cx,rt],[x1+8,f2]],x1-20)]];s.push(ch);
  var wp=[[x0+2,f1+3],[mw-2,f1+3],[mw-2,b0-1],[x0+2,b0-1]];HX(s,[wp],6,90);
  s.push([[x0+8,b0],[x0+8,b0-18],[x0+40,b0-18],[x0+40,b0]]);s.push([[x0+6,b0-18],[x0+42,b0-18]]);s.push(rect(x0+20,b0-26,x0+28,b0-18));
  var sx=mw+4,st=[[sx,b0]];for(var k=0;k<7;k++){st.push([sx+k*6,b0-k*fh/7],[sx+(k+1)*6,b0-k*fh/7]);}st.push([sx+42,f1+3]);s.push(st);s.push([[sx,b0],[sx+42,f1+3]]);
  s.push(rect(x0+8,f2+20,x0+40,f1-2));s.push(rect(x0+8,f2+14,x0+14,f1));H(s,[[x0+8,f2+20],[x0+40,f2+20],[x0+40,f2+26],[x0+8,f2+26]],1.4,0);s.push(EP(x0+20,f2+18,6,3).concat([[x0+26,f2+18]]));
  var wx=x0+22,WI=[[wx,f2+8],[wx+16,f2+8],[wx+16,f2+20],[wx,f2+20]];
  var tx=mw+20;s.push(rect(tx-14,f1-14,tx+14,f1-12));s.push([[tx-12,f1-12],[tx-12,f1]]);s.push([[tx+12,f1-12],[tx+12,f1]]);s.push(rect(tx-4,f1-22,tx+4,f1-14));s.push(arc(tx,f1-24,6,4,PI,TAU));
  s.push([[x1-10,f2+3],[x1-10,f2+16]]);s.push(arc(x1-10,f2+20,6,4,PI,TAU));s.push([[x1-16,f2+20],[x1-4,f2+20]]);
  s.push(rect(x1-30,b0-30,x1-14,b0-10));s.push([[x1-22,b0-30],[x1-22,b0-10]]);s.push(circle(x1-38,b0-6,5));
  skyFill(s,g,RR(R,8,11),RR(R,4.4,5),5,[RF.concat([]),[[x0-4,g],[x0-4,f2],[x1+4,f2],[x1+4,g]]]);return s;}},

{name:'Wingback armchair',titles:['Reading Chair','Fireside','Velvet and Brass Tacks','Grandfather\'s Seat','The Good Chair'],build(R){var s=[],g=RR(R,176,182),cx=RR(R,130,170),w=RR(R,92,100);
  floorS(s,R,g,RI(R,14,18));var RG=EP(cx,g+6,w*0.9,10);
  var BK=blob([[cx-w/2+8,g-50],[cx-w/2+4,g-110],[cx-w/2+12,g-130],[cx,g-136],[cx+w/2-12,g-130],[cx+w/2-4,g-110],[cx+w/2-8,g-50]],5);s.push(poly(BK));
  [-1,1].forEach(function(d){var WG=[[cx+d*(w/2-8),g-56],[cx+d*(w/2+6),g-70],[cx+d*(w/2+10),g-104],[cx+d*(w/2),g-120],[cx+d*(w/2-6),g-112]];s.push(WG);H(s,WG.concat([[cx+d*(w/2-8),g-56]]),2,d*70);
    var AR=[[cx+d*(w/2+12),g-64]].concat(arc(cx+d*(w/2+4),g-64,8,8,d>0?0:PI,d>0?-PI:-TAU+PI*2)).concat([[cx+d*(w/2-4),g-30],[cx+d*(w/2+12),g-30],[cx+d*(w/2+12),g-64]]);s.push(AR);s.push(spiral(cx+d*(w/2+4),g-64,1,6,1.4));
    s.push([[cx+d*(w/2+8),g-30],[cx+d*(w/2+6),g]]);s.push([[cx+d*(w/2+4),g-30],[cx+d*(w/2+2),g]]);});
  var SC=[[cx-w/2+2,g-46],[cx+w/2-2,g-46],[cx+w/2,g-34],[cx-w/2,g-34]];s.push(poly(SC));s.push(rect(cx-w/2,g-34,cx+w/2,g-18));
  s.push(comb(cx-w/2,cx+w/2,g-18,10,6).map(function(p){return [p[0],p[1]];}));
  var tuf=[];for(var ty=g-120;ty<g-56;ty+=12)for(var tx=cx-w/2+16+((ty/12)%2?6:0);tx<cx+w/2-14;tx+=12)if(pip([tx,ty],BK)){s.push(circle(tx,ty,1.4));}
  HX(s,[BK.slice(0)],RR(R,8,9),45);HX(s,[BK.slice(0)],RR(R,8,9),-45);
  var fx=cx<150?RR(R,226,256):RR(R,40,70),FS=[[fx-22,g-26],[fx+22,g-26],[fx+22,g-14],[fx-22,g-14]];s.push(poly(FS));s.push(ellipse(fx,g-26,22,4));H(s,FS,2,0);s.push([[fx-18,g-14],[fx-18,g]]);s.push([[fx+18,g-14],[fx+18,g]]);
  var lx=cx<150?RR(R,30,56):RR(R,240,268);s.push([[lx,g],[lx,g-120]]);s.push([[lx-12,g],[lx+12,g]]);var SHd=[[lx-18,g-120],[lx+18,g-120],[lx+12,g-146],[lx-12,g-146]];s.push(poly(SHd));H(s,SHd,2.4,90);
  skyFill(s,g,RR(R,8,11),RR(R,4.4,5),5,[BK,SHd,[[cx-w/2-14,g],[cx-w/2-14,g-72],[cx+w/2+14,g-72],[cx+w/2+14,g]]]);return s;}},

{name:'Rolltop desk',titles:['Letters Unanswered','Pigeonholes','Oak and Ink','The Study','Half Open'],build(R){var s=[],g=RR(R,178,184),cx=RR(R,135,165),w=RR(R,150,164),x0=cx-w/2,x1=cx+w/2,dt=g-RR(R,64,70);
  floorS(s,R,g,RI(R,14,18));
  [[x0,x0+44],[x1-44,x1]].forEach(function(p){s.push(rect(p[0],dt,p[1],g-4));for(var d=0;d<3;d++){var yy=dt+4+d*((g-8-dt)/3);s.push(rect(p[0]+4,yy,p[1]-4,yy+(g-8-dt)/3-4));s.push(circle((p[0]+p[1])/2,yy+((g-8-dt)/3-4)/2,2));}H(s,[[p[1]-6,dt],[p[1],dt],[p[1],g-4],[p[1]-6,g-4]],1.2,90);});
  s.push([[x0+44,dt+16],[x1-44,dt+16]]);s.push(rect(cx-24,dt+3,cx+24,dt+13));s.push(circle(cx,dt+8,2));
  var DT=[[x0-4,dt-6],[x1+4,dt-6],[x1+4,dt],[x0-4,dt]];s.push(poly(DT));H(s,DT,1.5,0);
  var tb=dt-RR(R,64,72),TOP=[[x0,dt-6],[x0,tb+12],[x0+16,tb],[x1-16,tb],[x1,tb+12],[x1,dt-6]];s.push(TOP);s.push([[x0-3,tb],[x1+3,tb]]);
  var ro=dt-6-RR(R,24,34);var RL=[[x0+6,tb+4],[x1-6,tb+4],[x1-6,ro],[x0+6,ro]];s.push(poly(RL));for(var yy2=tb+7;yy2<ro;yy2+=3.2)s.push([[x0+6,yy2],[x1-6,yy2]]);s.push(rect(cx-6,ro-3,cx+6,ro));
  var ph=[[x0+10,ro+2],[x1-10,ro+2],[x1-10,dt-8],[x0+10,dt-8]];s.push(poly(ph));for(var c=1;c<7;c++){var px=x0+10+c*(w-20)/7;s.push([[px,ro+2],[px,dt-8]]);}s.push([[x0+10,(ro+dt)/2-3],[x1-10,(ro+dt)/2-3]]);
  for(var e=0;e<RI(R,3,5);e++){var ex=x0+12+RI(R,0,6)*(w-20)/7;s.push([[ex,ro+6],[ex+6,ro+4],[ex+8,(ro+dt)/2-4]]);}
  var lx=x1-RR(R,26,34);s.push([[lx,dt-6],[lx,tb-30]]);s.push(EP(lx,dt-8,10,3));var SHd=[[lx-16,tb-30],[lx+16,tb-30],[lx+10,tb-44],[lx-10,tb-44]];s.push(poly(SHd));H(s,SHd,2,90);
  for(var b=0;b<RI(R,3,4);b++){var bx=x0+4+b*9;s.push(rect(bx,tb-RR(R,20,28),bx+8,tb));}
  var ix=x0+RR(R,40,60);s.push(rect(ix,dt-12,ix+10,dt-6));s.push([[ix+5,dt-12],[ix+14,dt-30]]);
  skyFill(s,g,RR(R,8,11),RR(R,4.4,5),5,[[[x0-4,g],[x0-4,tb],[x1+4,tb],[x1+4,g]],SHd]);return s;}},

{name:'Iron hand press',titles:['Ink on the Platen','Pull the Bar','Broadside Day','Type Set by Hand','Wet Sheets Drying'],build(R){var s=[],g=RR(R,180,186),cx=RR(R,130,160);
  floorS(s,R,g,RI(R,12,16));
  var fw=RR(R,40,46),ft=g-RR(R,128,138),fb=g-30;
  [-1,1].forEach(function(d){var CH=[[cx+d*fw,g-4],[cx+d*(fw-4),ft+10],[cx+d*(fw-12),ft],[cx+d*(fw-22),ft],[cx+d*(fw-22),ft+12],[cx+d*(fw-14),ft+16],[cx+d*(fw-12),g-4]];s.push(poly(CH));H(s,CH,2,90);});
  s.push(rect(cx-fw+14,ft-6,cx+fw-14,ft+4));H(s,[[cx-fw+14,ft-6],[cx+fw-14,ft-6],[cx+fw-14,ft+4],[cx-fw+14,ft+4]],1.4,0);
  var sy0=ft+4,sy1=ft+46;s.push([[cx-3,sy0],[cx-3,sy1]]);s.push([[cx+3,sy0],[cx+3,sy1]]);for(var t=sy0+3;t<sy1;t+=4)s.push([[cx-3,t],[cx+3,t+2]]);
  var PL=[[cx-fw+14,sy1],[cx+fw-14,sy1],[cx+fw-14,sy1+8],[cx-fw+14,sy1+8]];s.push(poly(PL));H(s,PL,1.4,0);
  var la=RR(R,0.15,0.35),L=RR(R,70,84);s.push([[cx+4,sy0+14],[cx+4+Math.cos(la)*L,sy0+14+Math.sin(la)*L]]);s.push([[cx+4,sy0+19],[cx+4+Math.cos(la)*L,sy0+19+Math.sin(la)*L]]);s.push(circle(cx+4+Math.cos(la)*L,sy0+16+Math.sin(la)*L,4));
  var by=fb-14;s.push([[cx-fw-50,by],[cx+fw+40,by]]);s.push([[cx-fw-50,by+6],[cx+fw+40,by+6]]);s.push([[cx-fw-46,by+6],[cx-fw-46,g]]);s.push([[cx+fw+36,by+6],[cx+fw+36,g]]);
  var TY=[[cx-fw-46,by-10],[cx-fw-6,by-10],[cx-fw-6,by],[cx-fw-46,by]];s.push(poly(TY));s.push([[cx-fw-46,by-10],[cx-fw-62,by-40],[cx-fw-22,by-40],[cx-fw-6,by-10]]);
  for(var r=0;r<4;r++)s.push([[cx-fw-42,by-8+r*2],[cx-fw-10,by-8+r*2]]);
  var kx=cx<150?RR(R,226,252):RR(R,22,48),KC=[[kx,g],[kx,g-70],[kx+44,g-70],[kx+44,g]];s.push(KC);for(var dd=0;dd<5;dd++){var yy=g-66+dd*13;s.push(rect(kx+4,yy,kx+40,yy+10));s.push(circle(kx+22,yy+5,1.5));}
  s.push([[24,26],[276,26]]);for(var sh=0;sh<RI(R,3,4);sh++){var sx=30+sh*RR(R,58,66);s.push([[sx,26],[sx,30],[sx-2,52],[sx+26,52],[sx+28,30],[sx+26,26]]);s.push(circle(sx+13,28,1.5));}
  skyFill(s,g,RR(R,8,10),RR(R,4,4.6),5,[[[cx-fw,g],[cx-fw,ft-6],[cx+fw,ft-6],[cx+fw,g]],KC]);return s;}},

{name:'Cash register',titles:['No Sale','Brass Keys and Bells','The General Store','Change for a Dollar','Corner Shop, Est. Long Ago'],build(R){var s=[],y=RR(R,150,156),cx=RR(R,130,160),w=RR(R,90,100);
  tableS(s,R,y);
  var DR=[[cx-w/2,y],[cx+w/2,y],[cx+w/2,y-16],[cx-w/2,y-16]];s.push(poly(DR));H(s,DR,2,0);s.push(rect(cx-10,y-11,cx+10,y-5));
  var BD=[[cx-w/2+2,y-16],[cx-w/2+10,y-70],[cx+w/2-10,y-70],[cx+w/2-2,y-16]];s.push(poly(BD));
  for(var r=0;r<4;r++){var ky=y-24-r*11,kw=w/2-8-r*2;for(var kx=cx-kw;kx<=cx+kw+0.1;kx+=(2*kw)/7){s.push(circle(kx,ky,3.4));s.push([[kx,ky+3.4],[kx,ky+6]]);}}
  var TP=[[cx-w/2+10,y-70],[cx-w/2+16,y-92],[cx+w/2-16,y-92],[cx+w/2-10,y-70]];s.push(poly(TP));HX(s,[TP],5,45);HX(s,[TP],5,-45);
  var tb=[[cx-26,y-92],[cx-22,y-112],[cx+22,y-112],[cx+26,y-92]];s.push(tb);for(var f=0;f<3;f++){var fx=cx-18+f*14;s.push(rect(fx,y-108,fx+10,y-96));s.push([[fx+3,y-104],[fx+7,y-104],[fx+7,y-100],[fx+3,y-100]]);}
  s.push(arc(cx,y-112,22,10,PI,TAU));H(s,arc(cx,y-112,22,10,PI,TAU),2,90);s.push(circle(cx,y-125,3));
  var cr=cx+w/2;s.push([[cr-4,y-44],[cr+8,y-44],[cr+8,y-60]]);s.push(circle(cr+8,y-64,4));
  var bx=cx<150?RR(R,214,240):RR(R,24,50);s.push(EP(bx+20,y-3,22,4).concat([[bx+42,y-3]]));for(var c=0;c<RI(R,4,6);c++){var ccx=bx+10+(c%3)*10,ccy=y-6-Math.floor(c/3)*5;s.push(ellipse(ccx,ccy,5,2));}
  var jx=cx<150?RR(R,20,44):RR(R,238,262);var JR=[[jx,y],[jx,y-40],[jx+28,y-40],[jx+28,y]];s.push(JR);s.push(rect(jx-2,y-46,jx+30,y-40));for(var cd=0;cd<RI(R,6,9);cd++){var ddx=jx+5+(cd%3)*9,ddy=y-6-Math.floor(cd/3)*9;s.push(circle(ddx,ddy,3.5));}
  skyFill(s,y,RR(R,8,11),RR(R,4.6,5.2),5,[BD,TP,tb.concat([[cx-26,y-92]])]);return s;}},

{name:'Cathedral radio',titles:['Evening Broadcast','Static and Swing','The Living Room Glow','Tuned to the Station','Walnut Arch'],build(R){var s=[],y=RR(R,150,156),cx=RR(R,130,160),w=RR(R,40,46),h=RR(R,98,108);
  tableS(s,R,y);var DY=[];for(var a=0;a<=TAU;a+=0.05){var r=1+0.08*Math.abs(Math.sin(a*9));DY.push([cx+w*1.9*r*Math.cos(a),y+3+6*r*Math.sin(a)]);}s.push(DY);
  var CAB=[[cx-w,y],[cx-w,y-h+w]].concat(arc(cx,y-h+w,w,w,PI,TAU)).concat([[cx+w,y]]);s.push(CAB);var IN=[[cx-w+7,y-40],[cx-w+7,y-h+w]].concat(arc(cx,y-h+w,w-7,w-7,PI,TAU)).concat([[cx+w-7,y-40]]);s.push(IN.concat([IN[0]]));
  var GR=[[cx-w+13,y-48],[cx-w+13,y-h+w]].concat(arc(cx,y-h+w,w-13,w-13,PI,TAU)).concat([[cx+w-13,y-48]]);HX(s,[GR.concat([GR[0]])],2,90);
  var gl=GR.concat([GR[0]]);for(var k=-1;k<=1;k++){var kx=cx+k*10;s.push([[kx-3,y-50],[kx-3,y-h+w-8+Math.abs(k)*12],[kx+3,y-h+w-8+Math.abs(k)*12],[kx+3,y-50]]);}
  s.push(scallop(cx,y-h+w-14,10,8,6,0.2));
  s.push(EP(cx,y-30,10,6).concat([[cx+10,y-30]]));s.push([[cx,y-30],[cx+5,y-34]]);for(var t=0;t<7;t++){var a2=PI+t*PI/6;s.push([[cx+8*Math.cos(a2),y-30+4.5*Math.sin(a2)],[cx+10*Math.cos(a2),y-30+6*Math.sin(a2)]]);}
  [cx-w+14,cx,cx+w-14].forEach(function(kx,i){if(i==1)return;s.push(circle(kx,y-14,5));s.push(circle(kx,y-14,2));});s.push(circle(cx,y-12,3));
  H(s,[[cx+w-6,y-h+w],[cx+w,y-h+w],[cx+w,y],[cx+w-6,y]],1.4,90);H(s,arc(cx,y-h+w,w,w,-PI/2,0).concat(arc(cx,y-h+w,w-6,w-6,0,-PI/2)),1.4,90);
  s.push([[cx-w,y-4],[cx+w,y-4]]);
  var px=cx<150?RR(R,214,240):RR(R,30,56);var PF=[[px,y],[px+4,y-50],[px+40,y-50],[px+44,y]];s.push(PF);var PH=[[px+4,y-50],[px+40,y-50],[px+40,y-4],[px+4,y-4]];H(s,[[px+8,y-46],[px+36,y-46],[px+36,y-12],[px+8,y-12]],2.4,0);s.push(rect(px+8,y-46,px+36,y-12));
  var vx=cx<150?RR(R,30,60):RR(R,236,262);s.push([[vx-8,y],[vx-10,y-18]].concat(arc(vx,y-18,10,6,PI,TAU)).concat([[vx+8,y]]));for(var f=0;f<4;f++){var fa=-PI/2+(f-1.5)*0.45;s.push(quad([vx,y-22],[vx+Math.cos(fa)*14,y-30],[vx+Math.cos(fa)*24,y-22+Math.sin(fa)*30]));s.push(scallop(vx+Math.cos(fa)*24,y-22+Math.sin(fa)*30,4,4,6,0.3));}
  skyFill(s,y,RR(R,8,11),RR(R,4.6,5.2),5,[CAB,PF]);return s;}}
);

return {number:3,startedOn:"2026-11-13",notes:"Batch 3 (Nov 13): first 48-subject day, each played 3x. Review of batch 2: best were structures and machines - bell tower, rope bridge, container ship, carousel, windpump, chalet, lookout tower, trawler, grand piano, greenhouse; pufferfish and whale read well too. Weak: giraffe, oil pumpjack, rail handcar, rooster, swan, seahorse (muddled shapes); skillet, microscope, bread loaf drowned in tile/grid backgrounds; rice terraces too busy. Timing was right (300-570s). Lessons kept: one line, keep extras touching; clip backgrounds with behind()/clipIn(); skyFill with solids; strokes under ~250 and planner under 2s; full-width lines block skyFill's flood, so keep shelves/rails short of the edges. New: animals need a careful outline (12-20 blob points with the real silhouette, head and legs drawn as their own shapes) and the open space under a body must be filled or it reads as a solid block; skip grid backgrounds behind tabletop objects; many small closed shapes (circles) slow the planner sharply.",subjects:SUBJ};
})();
