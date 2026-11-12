// Endless Etch — batch 2. Subjects and the Daily Super Sketch for 2026-11-12.
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

var SUBJ=[];
SUBJ.push(
{name:'Log cabin in the pines',titles:['Smoke at First Light','Woodpile Season','Two Rooms, One Stove','Cabin Above the Creek'],build(R){var s=[],bg=[],g=RR(R,150,158);
  var x0=RR(R,95,110),x1=x0+100,top=g-48,cx=x1-24;
  var p1=RR(R,30,55),p2=RR(R,245,270),fg=[[[x0-14,g],[x0-14,top],[(x0+x1)/2,top-38],[x1+14,top],[x1+14,g]],[[cx,top],[cx,top-20],[cx+12,top-20],[cx+12,top]]];
  [p1,p2].forEach(function(px){fg.push([[px-24,g],[px,g-90],[px+24,g]]);});
  hills(bg,R,g,RR(R,30,45),RR(R,3.6,4.4));behind(s,bg,fg);ground(s,R,g,RR(R,3.4,4.2));
  var p=[],d=1;for(var y=g-4;y>top;y-=5){if(d>0)p.push([x0-4,y],[x1+4,y]);else p.push([x1+4,y],[x0-4,y]);d=-d;}s.push([[x0-4,g]].concat(p));
  for(var y2=g-4;y2>top;y2-=5){s.push(arc(x0-4,y2-2.5,2.5,2.5,PI/2,1.5*PI));s.push(arc(x1+4,y2-2.5,2.5,2.5,-PI/2,PI/2));}
  var roof=[[x0-14,top],[(x0+x1)/2,top-38],[x1+14,top]];F(s,roof,2.2,RR(R,-20,20));
  var dx=(x0+x1)/2-12;s.push(rect(dx,g-34,dx+24,g));H(s,[[dx,g-34],[dx+24,g-34],[dx+24,g],[dx,g]],2.6,90);
  [x0+10,x1-30].forEach(function(wx){s.push(rect(wx,g-36,wx+20,g-18));s.push([[wx+10,g-36],[wx+10,g-18]]);s.push([[wx,g-27],[wx+20,g-27]]);});
  F(s,[[cx,top-20],[cx+12,top-20],[cx+12,top],[cx,top]],0);s.push(brickS(cx,top-20,cx+12,top-6,6,4));
  var sm=[[cx+6,top-20]];for(var i=0;i<4;i++)sm.push([cx+8+i*7,top-26-i*9]);s.push(sm);for(var j=1;j<5;j++)s.push(circle(sm[j][0]+2,sm[j][1]-2,2.5+j*1.3));
  pineT(s,p1,g,RR(R,1.3,1.7),2.4);pineT(s,p2,g,RR(R,1.4,1.8),2.4);
  for(var w=0;w<3;w++)s.push(ellipse(x1+20+w*7,g-4,3.5,3.5));s.push([[x1+16,g-8],[x1+38,g-8]]);
  skyFill(s,g,RR(R,8,11),RR(R,3.6,4.6));return s;}},

{name:'Adobe mission church',titles:['Bells at Vespers','Sun-Baked Walls','The Old Mission','Courtyard Noon'],build(R){var s=[],g=RR(R,158,164);
  ground(s,R,g,RR(R,3.4,4));var x0=RR(R,62,78),x1=x0+150;
  var face=[[x0,g],[x0,g-62],[x0+40,g-62],[x0+52,g-88],[x0+75,g-100],[x0+98,g-88],[x0+110,g-62],[x1,g-62],[x1,g]];s.push(face);
  H(s,[[x0+110,g-62],[x1,g-62],[x1,g],[x0+110,g]],2.6,RR(R,40,60));H(s,[[x0,g-62],[x0+12,g-62],[x0+12,g],[x0,g]],2.2,90);
  s.push([[x0+75,g-100],[x0+75,g-114]]);s.push([[x0+69,g-108],[x0+81,g-108]]);
  var bell=[[x0+67,g-62],[x0+67,g-74]].concat(arc(x0+75,g-74,8,8,PI,TAU),[[x0+83,g-62]]);s.push(bell);s.push(arc(x0+75,g-66,4,5,PI,TAU).concat([[x0+79,g-64],[x0+71,g-64],[x0+71,g-66]]));
  var dr=[[x0+62,g],[x0+62,g-30]].concat(arc(x0+75,g-30,13,13,PI,TAU),[[x0+88,g]]);s.push(dr);H(s,dr,2,90);s.push([[x0+75,g],[x0+75,g-43]]);
  [x0+20,x0+124].forEach(function(wx){var wd=[[wx,g-30],[wx,g-44]].concat(arc(wx+6,g-44,6,6,PI,TAU),[[wx+12,g-30],[wx,g-30]]);s.push(wd);H(s,wd,1.6,0);});
  for(var k=0;k<6;k++){var bx=x0+16+k*20;if(bx>x0+40&&bx<x0+110)continue;s.push([[bx,g-62],[bx,g-58]]);}
  var cxp=x1+RR(R,26,40);var cact=[[cxp-4,g],[cxp-4,g-44]].concat(arc(cxp,g-44,4,4,PI,TAU)).concat([[cxp+4,g-24],[cxp+10,g-24],[cxp+10,g-34]]).concat(arc(cxp+13,g-34,3,3,PI,TAU)).concat([[cxp+16,g-22],[cxp+4,g-18],[cxp+4,g]]);s.push(cact);H(s,[[cxp,g],[cxp,g-44],[cxp+4,g-44],[cxp+4,g]],1.3,90);
  var wl=[[4,g],[4,g-26],[x0,g-26]];s.push(wl);s.push(brickS(4,g-26,x0,g,10,6.5));
  var tx=RR(R,22,40);s.push(arc(tx,g-36,12,7,PI,TAU));
  skyFill(s,g,RR(R,8,12),RR(R,3.6,4.4));return s;}},

{name:'Victorian row houses',titles:['Painted Ladies, Dusk','Bay Windows','Steep Street','Gables in a Row'],build(R){var s=[],g=RR(R,168,174);
  ground(s,R,g,3.2,0);var n=RI(R,3,4),w=(270/n),x=15;
  for(var i=0;i<n;i++){var x0=x+i*w,x1=x0+w-2,h=RR(R,95,115),top=g-h;
    s.push([[x0,g],[x0,top],[x1,top],[x1,g]]);var gab=[[x0-3,top],[(x0+x1)/2,top-RR(R,22,30)],[x1+3,top]];s.push(poly(gab));s.push(scallopRows(x0+6,x1-6,top-6,top-2,5,4));
    s.push(circle((x0+x1)/2,top-12,3));
    var bx=x0+6,bw=w*0.45;s.push([[bx,g-30],[bx+4,g-36],[bx+4,g-70],[bx,g-76],[bx+bw,g-76],[bx+bw-4,g-70],[bx+bw-4,g-36],[bx+bw,g-30],[bx,g-30]]);
    s.push([[bx+4,g-36],[bx+bw-4,g-36]]);s.push([[bx+4,g-70],[bx+bw-4,g-70]]);s.push([[bx+bw/2,g-36],[bx+bw/2,g-70]]);
    s.push(rect(bx+3,top+10,bx+bw-3,top+28));s.push([[bx+bw/2,top+10],[bx+bw/2,top+28]]);
    var dx=x1-w*0.32;s.push(rect(dx,g-34,dx+w*0.22,g));H(s,[[dx,g-34],[dx+w*0.22,g-34],[dx+w*0.22,g],[dx,g]],2.2,90);s.push(arc(dx+w*0.11,g-34,w*0.11,6,PI,TAU));
    s.push(rect(dx,top+10,dx+w*0.22,top+28));
    for(var st=0;st<3;st++)s.push([[dx-4-st*3,g-st*4],[dx+w*0.22+4,g-st*4]]);
    H(s,[[x0,top+34],[x1,top+34],[x1,top+40],[x0,top+40]],1.5,0);
    if(R()<0.6)H(s,[[x0,top],[x0+5,top],[x0+5,g],[x0,g]],1.6,90);}
  skyFill(s,g,RR(R,9,12),RR(R,4,5));return s;}},

{name:'Glass greenhouse',titles:['Seedlings in March','Panes of Light','The Potting House','Warm Glass, Cold Air'],build(R){var s=[],g=RR(R,160,166);
  ground(s,R,g,RR(R,3.4,4));var x0=RR(R,60,75),x1=x0+170,eh=RR(R,50,58),rh=RR(R,38,46);
  s.push([[x0,g],[x0,g-eh],[x1,g-eh],[x1,g]]);var ridge=g-eh-rh;s.push([[x0,g-eh],[x0+28,ridge],[x1-28,ridge],[x1,g-eh]]);
  for(var x=x0;x<=x1;x+=17){s.push([[x,g],[x,g-eh]]);s.push([[x,g-eh],[x0+28+(x-x0)/(x1-x0)*(x1-x0-56),ridge]]);}
  s.push([[x0,g-eh*0.5],[x1,g-eh*0.5]]);s.push(brickS(x0,g-14,x1,g,10,4.7));
  var dx=(x0+x1)/2-12;s.push(rect(dx,g-46,dx+24,g-14));s.push([[dx+12,g-46],[dx+12,g-14]]);
  for(var k=0;k<RI(R,5,7);k++){var px=x0+12+k*25+RR(R,-3,3);s.push([[px-5,g-14],[px-6,g-22],[px+6,g-22],[px+5,g-14]]);var lf=RI(R,3,5);for(var l=0;l<lf;l++){var a=-PI/2+(l-(lf-1)/2)*0.5;s.push(quad([px,g-22],[px+Math.cos(a)*8,g-26+Math.sin(a)*6],[px+Math.cos(a)*14,g-22+Math.sin(a)*16]));}}
  var gl=RR(R,55,70);for(var x2=x0;x2<x1;x2+=17){H(s,[[x2+3,g-eh+4],[x2+14,g-eh+4],[x2+14,g-eh*0.5-4],[x2+3,g-eh*0.5-4]],5,gl);}
  var wx=x1+RR(R,12,24);cyl(s,wx+8,g,8,14,1.8);s.push(quad([wx+16,g-10],[wx+24,g-14],[wx+28,g-22]));
  skyFill(s,g,RR(R,8,11),RR(R,3.6,4.6));return s;}},

{name:'Stone arch bridge',titles:['Three Arches','Mossy Keystones','Over Slow Water','The Packhorse Crossing'],build(R){var s=[],bg=[],y=RR(R,92,100),w=RR(R,138,146);
  var arches=RI(R,2,3),span=260/arches;
  s.push([[4,y],[296,y]]);s.push([[4,y-8],[296,y-8]]);s.push(comb(4,296,y-8,6,6));
  var holes=[];for(var i=0;i<arches;i++){var cx=20+span*(i+0.5),r=span*0.36;var ap=[[cx-r,w]].concat(arc(cx,w,r,r*1.1,PI,TAU)).concat([[cx+r,w]]);s.push(ap);holes.push(ap);
    for(var k=0;k<=8;k++){var a=PI+k*PI/8;s.push([[cx+r*Math.cos(a),w+r*1.1*Math.sin(a)],[cx+(r+8)*Math.cos(a),w+(r*1.1+8)*Math.sin(a)]]);}}
  var wall=[[4,y],[296,y],[296,w],[4,w]];HX(s,[wall].concat(holes),4.4,0);
  hills(bg,R,y-14,RR(R,22,32),0);behind(s,bg,[]);s.push([[4,bg[0][0][1]],[4,y-14]]);
  s.push(waterS(R,4,296,w+3,194,5,1.6));
  for(var r2=0;r2<arches;r2++){var cx2=20+span*(r2+0.5);H(s,[[cx2-span*0.3,w+4],[cx2+span*0.3,w+4],[cx2+span*0.24,w+18],[cx2-span*0.24,w+18]],2.4,0);}
  skyFill(s,y-8,RR(R,9,12),RR(R,3.2,3.7));return s;}},

{name:'Fire lookout tower',titles:['Watch Over the Ridge','Cab on the Summit','Fire Season','Seventy Steps Up'],build(R){var s=[],bg=[],g=RR(R,168,176);
  var cx=RR(R,140,160),bw=56,tw=26,cb=g-112,t1=RR(R,40,70),t2=RR(R,225,260);
  var fg=[[[cx-bw/2,g],[cx-tw/2,cb],[cx+tw/2,cb],[cx+bw/2,g]],[[cx-34,cb+3],[cx-34,cb-26],[cx,cb-42],[cx+34,cb-26],[cx+34,cb+3]],[[t1-24,g],[t1,g-80],[t1+24,g]],[[t2-24,g],[t2,g-80],[t2+24,g]]];
  hills(bg,R,g,RR(R,40,60),4.2);behind(s,bg,fg);s.push([[4,g],[296,g]]);
  s.push([[cx-bw/2,g],[cx-tw/2,cb]]);s.push([[cx+bw/2,g],[cx+tw/2,cb]]);
  var lv=5,p=[];for(var i=0;i<=lv;i++){var t=i/lv,yy=g-(g-cb)*t,hw=bw/2+(tw/2-bw/2)*t;p.push([cx-hw,yy]);}
  for(var j=0;j<lv;j++){var a=p[j],b=p[j+1];s.push([[a[0],a[1]],[2*cx-a[0],a[1]]]);s.push([[a[0],a[1]],[2*cx-b[0],b[1]]]);s.push([[2*cx-a[0],a[1]],[b[0],b[1]]]);}
  var cab=[[cx-26,cb],[cx+26,cb],[cx+26,cb-26],[cx-26,cb-26]];s.push(poly(cab));
  s.push(rect(cx-30,cb,cx+30,cb+3));for(var x2=cx-30;x2<=cx+30;x2+=6)s.push([[x2,cb],[x2,cb-8]]);s.push([[cx-30,cb-8],[cx+30,cb-8]]);
  for(var w=0;w<4;w++){var wx=cx-22+w*11;s.push(rect(wx,cb-24,wx+9,cb-12));}
  var roof=[[cx-34,cb-26],[cx,cb-42],[cx+34,cb-26]];F(s,roof,1.9,0);s.push([[cx,cb-42],[cx,cb-52]]);s.push([[cx,cb-52],[cx+10,cb-49],[cx,cb-46]]);
  pineT(s,t1,g,RR(R,1.1,1.5),2.4);pineT(s,t2,g,RR(R,1.1,1.5),2.4);
  H(s,[[4,g],[296,g],[296,196],[4,196]],RR(R,3.6,4.4),RR(R,15,30));
  skyFill(s,g,RR(R,9,12),RR(R,4.5,5.5));return s;}},

{name:'Gristmill with waterwheel',titles:['Turning Since Dawn','Millrace','Stone and Spoke','The Miller\'s Pond'],build(R){var s=[],bg=[],g=RR(R,140,148);
  var x0=RR(R,30,45),x1=x0+120,top=g-70,wc=[x1+34,g-20],r=36;
  hills(bg,R,g-30,22,4.6);behind(s,bg,[[[x0-10,g],[x0-10,top],[x0+30,top-36],[x1-30,top-36],[x1+10,top],[x1+10,g]],circle(wc[0],wc[1],r+7)]);s.push([[4,g-30],[x0-10,g-30]]);s.push([[x1+10,g-30],[296,g-30]]);
  s.push([[x0,g],[x0,top],[x1,top],[x1,g]]);s.push(brickS(x0,top,x1,g,12,6));
  var roof=[[x0-10,top],[x0+30,top-36],[x1-30,top-36],[x1+10,top]];F(s,roof,2.4,RR(R,-15,15));
  [x0+18,x0+56,x0+94].forEach(function(wx){s.push(rect(wx,top+12,wx+14,top+30));H(s,[[wx,top+12],[wx+14,top+12],[wx+14,top+30],[wx,top+30]],2.3,90);});
  s.push(circle(wc[0],wc[1],r));s.push(circle(wc[0],wc[1],r-5));s.push(circle(wc[0],wc[1],5));
  var n=RI(R,10,14);for(var k=0;k<n;k++){var a=k*TAU/n;s.push([[wc[0]+5*Math.cos(a),wc[1]+5*Math.sin(a)],[wc[0]+r*Math.cos(a),wc[1]+r*Math.sin(a)],[wc[0]+(r+6)*Math.cos(a+0.12),wc[1]+(r+6)*Math.sin(a+0.12)]]);}
  s.push([[4,g],[wc[0]-r,g]]);s.push([[wc[0]+r,g],[296,g]]);
  var wt=[];for(var y=g+4;y<194;y+=5)wt.push(y);var hole=[circle(wc[0],wc[1],r+7)];var wb=[waterS(R,4,296,g+4,194,5,1.6)];behind(s,wb,hole);
  skyFill(s,g-30,RR(R,9,12),RR(R,4,5));return s;}},

{name:'Observatory dome',titles:['Slit Open to the Stars','Clear Night, High Desert','Seeing Is Good','Dome at Dusk'],build(R){var s=[],g=RR(R,160,166);
  ground(s,R,g,RR(R,3.6,4.4));var cx=RR(R,135,165),r=RR(R,48,56),wb=g-48;
  s.push([[cx-r-6,g],[cx-r-6,wb],[cx+r+6,wb],[cx+r+6,g]]);s.push(brickS(cx-r-6,wb,cx+r+6,g,14,6));
  var dome=arc(cx,wb,r,r,PI,TAU);s.push(dome);
  var sh=arc(cx,wb,r,r,-PI/2,0).concat(arc(cx+r*0.2,wb,r*0.5,r*0.85,0,-PI/2).map(function(p){return p;}).reverse().reverse());
  var shd=arc(cx,wb,r,r,-PI*0.42,0).concat(arc(cx,wb,r*0.62,r*0.94,0,-PI*0.42).reverse());H(s,shd.reverse(),2,0);
  var slit=[[cx-7,wb],[cx-7,wb-r+1],[cx+7,wb-r+1],[cx+7,wb]];F(s,slit,1.6,90);
  var ribs=RI(R,4,6);for(var k=1;k<ribs;k++){var x=cx-r+k*2*r/ribs;var yy=wb-Math.sqrt(Math.max(0,r*r-(x-cx)*(x-cx)));if(Math.abs(x-cx)>9)s.push([[x,wb],[x,yy]]);}
  var ta=-PI/2+RR(R,0.25,0.5);s.push([[cx,wb-r+4],[cx+Math.cos(ta)*r*0.5,wb-r+4+Math.sin(ta)*r*0.5]]);
  s.push(rect(cx-10,g-24,cx+10,g));H(s,[[cx-10,g-24],[cx+10,g-24],[cx+10,g],[cx-10,g]],2.2,90);
  var hx=cx-r-6;s.push([[4,g-22],[hx,g-22]]);s.push(comb(4,hx,g-22,6,8));var hx2=cx+r+6;s.push([[hx2,g-30],[hx2+40,g-30],[hx2+40,g]]);H(s,[[hx2,g-30],[hx2+40,g-30],[hx2+40,g],[hx2,g]],3,90);
  skyFill(s,g,RR(R,6,8),RR(R,3,3.6));return s;}},

{name:'Alpine chalet',titles:['Snowline Lodge','Geraniums on the Rail','After the Climb','Valley in Shadow'],build(R){var s=[],bg=[],g=RR(R,160,166);
  var x0=RR(R,85,100),x1=x0+110,ew=g-52,t1=RR(R,30,60),t2=RR(R,240,270);
  var pk=[[4,90],[50,40],[80,62],[130,18],[170,58],[210,30],[250,66],[296,46]];var pts=pk.map(function(p){return [p[0],p[1]+RR(R,-6,6)];});
  var fg=[[[x0-22,g],[x0-22,ew+6],[(x0+x1)/2,ew-40],[x1+22,ew+6],[x1+22,g]],[[t1-22,g],[t1,g-84],[t1+22,g]],[[t2-22,g],[t2,g-84],[t2+22,g]]];
  bg.push(pts);A(bg,hatch(pts.concat([[296,g],[4,g]]),RR(R,4.5,5.5),RR(R,30,50)));
  pts.forEach(function(p,i){if(i>0&&i<pts.length-1&&p[1]<pts[i-1][1]&&p[1]<pts[i+1][1])bg.push([[p[0]-14,p[1]+16],[p[0]-6,p[1]+10],[p[0],p[1]+18],[p[0]+8,p[1]+11],[p[0]+15,p[1]+17]]);});
  behind(s,bg,fg);ground(s,R,g,3.6);
  var body=[[x0,g],[x0,ew],[x1,ew],[x1,g]];s.push(body);HX(s,[body,[[x0+8,g],[x0+8,ew+16],[x1-8,ew+16],[x1-8,g]]],1.8,0);
  var roof=[[x0-22,ew+6],[(x0+x1)/2,ew-40],[x1+22,ew+6]];s.push(poly(roof));var inner=[[x0-10,ew+2],[(x0+x1)/2,ew-30],[x1+10,ew+2]];s.push(poly(inner));H(s,roof.concat([[x1+10,ew+2],[(x0+x1)/2,ew-30],[x0-10,ew+2]]).slice(0,3),0||3,0);
  s.push([[x0-6,ew+18],[x1+6,ew+18]]);s.push(comb(x0-6,x1+6,ew+30,12,5));s.push([[x0-6,ew+30],[x1+6,ew+30]]);
  for(var w=0;w<3;w++){var wx=x0+14+w*30;s.push(rect(wx,g-30,wx+18,g-10));s.push(scallop(wx+9,g-10,9,3,8,0.4));}
  s.push(rect((x0+x1)/2-6,ew-14,(x0+x1)/2+6,ew-2));
  pineT(s,t1,g,RR(R,1.2,1.5),2.3);pineT(s,t2,g,RR(R,1.2,1.5),2.3);
  return s;}},

{name:'Beach huts',titles:['Six Doors to the Sea','Striped and Shut','Off Season','Promenade, Late May'],build(R){var s=[],g=RR(R,140,148);
  var n=RI(R,4,5),w=RR(R,40,46),x=(300-n*(w+6))/2;s.push([[4,g],[296,g]]);
  for(var i=0;i<n;i++){var x0=x+i*(w+6),x1=x0+w,h=RR(R,52,60);var body=[[x0,g],[x0,g-h],[x1,g-h],[x1,g]];s.push(body);
    var roof=[[x0-3,g-h],[(x0+x1)/2,g-h-20],[x1+3,g-h]];s.push(poly(roof));
    var style=i%3;var dr=[[x0+w*0.25,g],[x0+w*0.25,g-h+12],[x1-w*0.25,g-h+12],[x1-w*0.25,g]];s.push(dr);
    if(style===0)HX(s,[body,dr],3.2,90);else if(style===1)HX(s,[body,dr],3,0);else{H(s,roof,2,0);H(s,dr,2.4,90);}
    s.push(circle(x1-w*0.3,g-h/2+6,1.3));}
  H(s,[[4,g],[296,g],[296,g+8],[4,g+8]],2,0);
  var sand=[],d=1;for(var y=g+12;y<170;y+=4){var w2=wave(4,296,y,0.8,30,R()*6);if(d<0)w2.reverse();A(sand,w2);d=-d;}s.push([[4,g+8]].concat(sand));
  s.push(waterS(R,4,296,174,194,4,1.6));
  skyFill(s,g,RR(R,8,11),RR(R,3.6,4.4));return s;}},

{name:'Bell tower',titles:['Noon Bells','The Campanile','Above the Square','Hours in Bronze'],build(R){var s=[],g=RR(R,176,182);
  ground(s,R,g,3,0);var cx=RR(R,140,160),w=34,top=g-120;
  s.push([[cx-w,g],[cx-w,top],[cx+w,top],[cx+w,g]]);s.push(brickS(cx-w,top+40,cx+w,g,11,5.5));
  var bo=[[cx-w+6,top+34],[cx-w+6,top+8]].concat(arc(cx-w+14,top+8,8,8,PI,TAU),[[cx-w+22,top+34]]);var bo2=translate(bo,40,0);s.push(bo);s.push(bo2);
  [cx-w+14,cx+w-14].forEach(function(bx){s.push([[bx,top+4],[bx,top+8]]);s.push([[bx-6,top+20]].concat(quad([bx-6,top+20],[bx-4,top+8],[bx,top+8]),quad([bx,top+8],[bx+4,top+8],[bx+6,top+20])).concat([[bx-6,top+20]]));H(s,[[bx-5,top+19],[bx-3,top+11],[bx+3,top+11],[bx+5,top+19]],1.6,0);});
  s.push(rect(cx-w-4,top-4,cx+w+4,top));var sp=[[cx-w-2,top-4],[cx,top-60],[cx+w+2,top-4]];F(s,sp,2,RR(R,-10,10));s.push([[cx,top-60],[cx,top-70]]);s.push([[cx-5,top-66],[cx+5,top-66]]);
  s.push(circle(cx,top+52,10));s.push([[cx,top+52],[cx,top+45]]);s.push([[cx,top+52],[cx+6,top+52]]);
  s.push([[4,g-44],[cx-w-10,g-44],[cx-w-10,g]]);var r1=[[4,g-44],[4,g-56],[cx-w-30,g-60],[cx-w-10,g-44]];s.push(r1);
  s.push([[cx+w+10,g],[cx+w+10,g-38],[296,g-38]]);s.push([[cx+w+10,g-38],[cx+w+40,g-54],[296,g-54]]);
  H(s,[[cx+w+10,g-38],[cx+w+40,g-54],[296,g-54],[296,g-38]],2.2,0);H(s,r1,2.2,0);
  for(var k=0;k<3;k++){s.push(rect(14+k*16,g-34,22+k*16,g-22));s.push(rect(cx+w+18+k*16,g-28,cx+w+26+k*16,g-16));}
  skyFill(s,g,RR(R,9,12),RR(R,4,5));return s;}},

{name:'Rope bridge over a gorge',titles:['Don\'t Look Down','Sway','The Long Crossing','Gorge Wind'],build(R){var s=[],y=RR(R,82,92);
  var lc=[[4,y],[70,y],[78,y+30],[72,y+60],[84,196],[4,196]],rc=[[296,y+4],[228,y+4],[220,y+34],[230,y+70],[214,196],[296,196]];
  s.push(lc);s.push(rc);H(s,lc,RR(R,3,3.6),RR(R,40,60));H(s,rc,RR(R,3,3.6),-RR(R,40,60));
  var sag=RR(R,22,30),deck=[];for(var t=0;t<=40;t++){var x=70+t/40*158,yy=y+(t/40)*4+sag*Math.sin(t/40*PI);deck.push([x,yy]);}s.push(deck);
  var hand=deck.map(function(p){return [p[0],p[1]-18];});s.push(hand);
  for(var i=0;i<=40;i+=2){s.push([deck[i],hand[i]]);s.push([[deck[i][0]-1,deck[i][1]],[deck[i][0]+1,deck[i][1]+3]]);}
  s.push([[70,y],[70,y-24]]);s.push([[228,y+4],[228,y-20]]);
  s.push(waterS(R,86,212,180,194,4,1.4));
  for(var p=0;p<3;p++){pineT(s,12+p*18+RR(R,0,6),y,RR(R,0.55,0.8),2.2);}
  for(var q=0;q<3;q++){pineT(s,240+q*18+RR(R,0,6),y+4,RR(R,0.55,0.8),2.2);}
  skyFill(s,178,RR(R,9,12),RR(R,4,5));return s;}},

{name:'Roman aqueduct',titles:['Water on the Arches','Two Tiers','Long Shadow at Noon','Built to Last'],build(R){var s=[],g=RR(R,174,180);
  ground(s,R,g,RR(R,3.6,4.2));var lv1=g-60,lv2=lv1-40,top=lv2-12;
  var w1=RR(R,34,40),o1=4+RR(R,0,w1*0.5),h1=[],h2=[];
  for(var i=0;i<12;i++){var cx=o1+w1*0.5+i*w1,r=w1*0.34;if(cx+r>292)break;var ap=[[cx-r,g]].concat(arc(cx,g-60+r+8,r,r,PI,TAU)).concat([[cx+r,g]]);h1.push(ap);s.push(ap);
    for(var j=0;j<2;j++){var cx2=cx-w1/4+j*w1/2,r2=w1*0.17;var ap2=[[cx2-r2,lv1]].concat(arc(cx2,lv2+r2+6,r2,r2,PI,TAU)).concat([[cx2+r2,lv1]]);h2.push(ap2);s.push(ap2);}}
  s.push([[4,lv1],[296,lv1]]);s.push([[4,lv2],[296,lv2]]);s.push([[4,top],[296,top]]);s.push(comb(4,296,top,4,8));
  HX(s,[[[4,lv1],[296,lv1],[296,g],[4,g]]].concat(h1),RR(R,3.2,3.8),90);HX(s,[[[4,lv2],[296,lv2],[296,lv1],[4,lv1]]].concat(h2),RR(R,3,3.6),90);
  H(s,[[4,top],[296,top],[296,lv2],[4,lv2]],2.2,0);
  skyFill(s,top-4,RR(R,10,13),RR(R,4.5,5.5));return s;}},

{name:'Clock tower',titles:['Ten Past Ten','Town Hall Time','Four Faces','Quarter Chime'],build(R){var s=[],g=RR(R,178,184);
  ground(s,R,g,3,0);var cx=RR(R,140,160),w=28,top=g-128;
  s.push([[cx-w,g],[cx-w,top],[cx+w,top],[cx+w,g]]);s.push(brickS(cx-w,top+66,cx+w,g,10,5));
  s.push(rect(cx-w-4,top+60,cx+w+4,top+66));s.push(circle(cx,top+32,22));s.push(circle(cx,top+32,19));
  for(var k=0;k<12;k++){var a=k*TAU/12;s.push([[cx+16*Math.cos(a),top+32+16*Math.sin(a)],[cx+19*Math.cos(a),top+32+19*Math.sin(a)]]);}
  var hh=RR(R,0,TAU),mm=RR(R,0,TAU);s.push([[cx,top+32],[cx+10*Math.cos(hh),top+32+10*Math.sin(hh)]]);s.push([[cx,top+32],[cx+16*Math.cos(mm),top+32+16*Math.sin(mm)]]);
  HX(s,[[[cx-w,top],[cx+w,top],[cx+w,top+60],[cx-w,top+60]],circle(cx,top+32,22)],2.4,RR(R,35,55));
  s.push(rect(cx-w-4,top-6,cx+w+4,top));var bel=[[cx-w+4,top-6],[cx-w+4,top-30],[cx+w-4,top-30],[cx+w-4,top-6]];s.push(bel);
  for(var c=0;c<3;c++){var ox=cx-w+8+c*((2*w-16)/3);s.push([[ox,top-6],[ox,top-22]].concat(arc(ox+(2*w-16)/6,top-22,(2*w-16)/6,5,PI,TAU),[[ox+(2*w-16)/3,top-6]]));}
  var sp=[[cx-w,top-30],[cx,top-76],[cx+w,top-30]];F(s,sp,1.9,RR(R,-12,12));s.push([[cx,top-76],[cx,top-86]]);s.push(circle(cx,top-88,2));
  var dr=[[cx-9,g],[cx-9,g-20]].concat(arc(cx,g-20,9,9,PI,TAU),[[cx+9,g]]);s.push(dr);H(s,dr,2,90);
  s.push([[4,g-36],[cx-w,g-36]]);s.push([[cx+w,g-36],[296,g-36]]);s.push(comb(4,cx-w,g-36,8,9));s.push(comb(cx+w,296,g-36,8,9));
  skyFill(s,g-37,RR(R,9,12),RR(R,4,5));return s;}},

{name:'Yurt on the steppe',titles:['Felt and Lattice','Open Country','Smoke Ring','Camp at the Grass Edge'],build(R){var s=[],bg=[],g=RR(R,156,164);
  var cx=RR(R,130,170),r=RR(R,56,64),wh=30;var fg=[[[cx-r-4,g],[cx-r-4,g-wh],[cx-14,g-wh-40],[cx+14,g-wh-40],[cx+r+4,g-wh],[cx+r+4,g]]];
  hills(bg,R,g-8,RR(R,18,28),0);behind(s,bg,fg);s.push([[4,g-8],[4,bg[0][0][1]]]);ground(s,R,g,RR(R,3.6,4.2));
  s.push([[cx-r,g],[cx-r,g-wh],[cx+r,g-wh],[cx+r,g]]);var roof=[[cx-r-4,g-wh],[cx-14,g-wh-34],[cx+14,g-wh-34],[cx+r+4,g-wh]];s.push(poly(roof));
  s.push([[cx-r,g-wh+6],[cx+r,g-wh+6]]);s.push([[cx-r,g-8],[cx+r,g-8]]);var dr=[[cx-10,g],[cx-10,g-24],[cx+10,g-24],[cx+10,g]];
  HX(s,[[[cx-r,g-wh+6],[cx+r,g-wh+6],[cx+r,g-8],[cx-r,g-8]],dr],RR(R,2.6,3.2),0);
  for(var k=0;k<=10;k++){var t=k/10;s.push([[cx-r-4+t*(2*r+8),g-wh],[cx-14+t*28,g-wh-34]]);}
  s.push(rect(cx-16,g-wh-40,cx+16,g-wh-34));s.push(dr);H(s,dr,1.6,90);
  var bx=cx+r+RR(R,20,40);s.push([[bx,g],[bx,g-34]]);s.push([[bx,g-34],[bx+14,g-29],[bx,g-24]]);
  s.push([[cx-14,g-wh-40],[cx-12,g-wh-52]]);for(var q=0;q<3;q++)s.push(circle(cx-12+q*5,g-wh-56-q*6,3+q));
  skyFill(s,g-8,RR(R,9,12),RR(R,4,5));return s;}},

{name:'Stilt houses on a lagoon',titles:['High Tide Village','Walkways at Dawn','Over the Shallows','Fishing Day'],build(R){var s=[],w=RR(R,138,146);
  s.push([[4,w],[296,w]]);s.push(waterS(R,4,296,w+5,194,5,1.6));var n=RI(R,3,4),sp=280/n;
  for(var i=0;i<n;i++){var x0=12+i*sp+RR(R,0,8),x1=x0+sp*0.7,fl=w-RR(R,24,32),h=RR(R,34,44);
    for(var x=x0+4;x<x1;x+=12){s.push([[x,fl],[x,w+10]]);}
    s.push(rect(x0-4,fl,x1+4,fl+4));var body=[[x0,fl],[x0,fl-h],[x1,fl-h],[x1,fl]];s.push(body);
    var roof=[[x0-10,fl-h],[(x0+x1)/2,fl-h-28],[x1+10,fl-h]];s.push(poly(roof));H(s,roof,2,RR(R,60,80));
    s.push(rect(x0+8,fl-h+10,x0+20,fl-h+22));var dw=(x0+x1)/2;s.push(rect(dw,fl-26,dw+12,fl));H(s,[[x0,fl-h],[x1,fl-h],[x1,fl],[x0,fl]],3.2,90);
    if(i<n-1)s.push([[x1+4,fl+2],[x1+sp*0.3+4,fl+2]]);}
  var bx=RR(R,60,200);s.push([[bx,w+16],[bx+40,w+16],[bx+34,w+22],[bx+6,w+22],[bx,w+16]]);
  skyFill(s,w,RR(R,9,12),RR(R,4,5));return s;}},

{name:'Roadside diner',titles:['Pie Under Glass','Open All Night','Booth by the Window','Blue Plate Special'],build(R){var s=[],g=RR(R,160,166);
  ground(s,R,g,RR(R,3.6,4.2),0);var x0=RR(R,40,55),x1=x0+200,top=g-56;
  var body=[[x0,g]].concat(arc(x0+12,top+12,12,12,PI,1.5*PI)).concat(arc(x1-12,top+12,12,12,1.5*PI,TAU)).concat([[x1,g]]);s.push(body);
  s.push([[x0,top+28],[x1,top+28]]);s.push([[x0,top+34],[x1,top+34]]);H(s,[[x0,top+34],[x1,top+34],[x1,g-4],[x0,g-4]],RR(R,2.4,3),90);
  for(var x=x0+14;x<x1-20;x+=22){if(x>x0+76&&x<x0+114)continue;s.push(rect(x,top+8,x+18,top+26));}
  var dx=x0+90;s.push(rect(dx,top+8,dx+20,g));s.push(rect(dx+4,top+12,dx+16,top+30));
  for(var st=0;st<2;st++)s.push([[dx-4-st*3,g+st*4+2],[dx+24+st*3,g+st*4+2]]);
  var sx=x1+RR(R,10,22);s.push([[sx,g],[sx,g-70]]);s.push([[sx+6,g],[sx+6,g-70]]);var sg=[[sx-14,g-70],[sx-14,g-100],[sx+30,g-100],[sx+30,g-70]];s.push(poly(sg));
  s.push(rect(sx-10,g-96,sx+26,g-74));H(s,[[sx-10,g-96],[sx+26,g-96],[sx+26,g-74],[sx-10,g-74]],2.4,0);
  s.push(rect(x0+40,top-14,x0+160,top));H(s,[[x0+40,top-14],[x0+160,top-14],[x0+160,top],[x0+40,top]],1.8,90);
  skyFill(s,g,RR(R,9,12),RR(R,4,5));return s;}},

{name:'Train station platform',titles:['Platform Two','Waiting for the 6:10','Canopy Light','The Last Local'],build(R){var s=[],pl=RR(R,128,134);
  s.push([[4,pl],[296,pl]]);H(s,[[4,pl],[296,pl],[296,pl+10],[4,pl+10]],2,0);
  s.push([[4,pl+26],[296,pl+26]]);s.push([[4,pl+30],[296,pl+30]]);for(var x=8;x<296;x+=10)s.push(rect(x,pl+30,x+6,pl+34));
  s.push([[4,pl+44],[296,pl+44]]);s.push([[4,pl+48],[296,pl+48]]);for(var x2=8;x2<296;x2+=10)s.push(rect(x2,pl+48,x2+6,pl+52));
  var ct=pl-72;s.push([[4,ct],[296,ct]]);var can=[[4,ct],[296,ct],[296,ct-14],[4,ct-14]];s.push(poly(can));s.push(scallopRows(4,296,ct+3,ct+3,10,4));H(s,can,2.2,0);
  var n=RI(R,4,6);for(var i=0;i<n;i++){var px=20+i*(260/(n-1));s.push([[px,ct],[px,pl]]);s.push([[px,ct+10],[px-8,ct]]);s.push([[px,ct+10],[px+8,ct]]);}
  var cx=RR(R,120,180);s.push([[cx,ct],[cx,ct+12]]);s.push(circle(cx,ct+20,8));s.push([[cx,ct+20],[cx,ct+15]]);s.push([[cx,ct+20],[cx+5,ct+20]]);
  var bx=RR(R,30,80);s.push([[bx,pl],[bx,pl-10],[bx+30,pl-10],[bx+30,pl]]);s.push(rect(bx-2,pl-24,bx+32,pl-20));s.push([[bx,pl-20],[bx,pl-10]]);s.push([[bx+30,pl-20],[bx+30,pl-10]]);
  var lx=RR(R,200,260);s.push([[lx,pl],[lx,pl-42]]);s.push(rect(lx-8,pl-54,lx+8,pl-42));H(s,[[lx-8,pl-54],[lx+8,pl-54],[lx+8,pl-42],[lx-8,pl-42]],1.8,90);
  s.push(brickS(4,ct-38,296,ct-14,14,6));H(s,[[4,pl+10],[296,pl+10],[296,pl+26],[4,pl+26]],3,90);
  return s;}},

{name:'Lifeguard tower',titles:['Flag Up, Swim Safe','Station Seven','Morning Watch','Empty Beach in May'],build(R){var s=[],g=RR(R,152,160);
  var cx=RR(R,120,180),fl=g-46,sea=g-RR(R,40,50);var fg=[[[cx-30,g+10],[cx-38,fl],[cx-38,fl-34],[cx,fl-50],[cx+38,fl-34],[cx+80,g+10]]];
  var bgs=[[[4,sea],[296,sea]],waterS(R,4,296,sea+4,g-14,4.5,1.4),wave(4,296,g-10,1.5,24)];behind(s,bgs,fg);
  var sand=[],d=1;for(var y=g;y<196;y+=4.2){if(d>0)sand.push([4,y],[296,y]);else sand.push([296,y],[4,y]);d=-d;}s.push(sand);
  [cx-26,cx+26].forEach(function(x){s.push([[x,g+10],[x+(x<cx?6:-6),fl]]);});
  s.push([[cx-23,g-10],[cx+23,g-30]]);s.push([[cx+23,g-10],[cx-23,g-30]]);
  s.push(rect(cx-36,fl-4,cx+36,fl));var hut=[[cx-30,fl-4],[cx-30,fl-34],[cx+30,fl-34],[cx+30,fl-4]];s.push(hut);
  var win=[[cx-18,fl-30],[cx+18,fl-30],[cx+18,fl-16],[cx-18,fl-16]];s.push(poly(win));HX(s,[hut,win],3,90);var roof=[[cx-38,fl-34],[cx,fl-50],[cx+38,fl-34]];F(s,roof,2,0);
  var rp=[];for(var k=0;k<7;k++){rp.push([cx+36+k*6,fl+k*7]);}s.push([[cx+36,fl]].concat(rp));s.push(rp.map(function(p){return [p[0]+8,p[1]];}));for(var k2=0;k2<7;k2++)s.push([rp[k2],[rp[k2][0]+8,rp[k2][1]]]);
  s.push([[cx-30,fl-34],[cx-30,fl-70]]);s.push([[cx-30,fl-70],[cx-10,fl-64],[cx-30,fl-58]]);
  skyFill(s,sea,RR(R,9,12),RR(R,4,5));return s;}},

{name:'Carousel',titles:['Brass Ring','Round and Round','Painted Horses','The Fair Comes to Town'],build(R){var s=[],g=RR(R,170,176);
  ground(s,R,g,RR(R,3.6,4.4));var cx=RR(R,140,160),rw=RR(R,108,118),top=g-104;
  s.push(ellipse(cx,g-6,rw,10));s.push([[cx-rw,g-6],[cx-rw,g]].concat(arc(cx,g,rw,10,PI,0)).concat([[cx+rw,g-6]]));
  var cr=[[cx-rw-6,top+10],[cx,top-30],[cx+rw+6,top+10]];s.push(poly(cr));H(s,cr,RR(R,2.2,2.8),0);s.push(scallopRows(cx-rw-6,cx+rw+6,top+16,top+16,12,6));
  s.push([[cx,top-30],[cx,top-40]]);s.push([[cx,top-40],[cx+12,top-36],[cx,top-32]]);
  s.push(rect(cx-8,top+10,cx+8,g-14));H(s,[[cx-8,top+10],[cx+8,top+10],[cx+8,g-14],[cx-8,g-14]],1.8,90);
  var n=RI(R,4,5);for(var i=0;i<n;i++){var px=cx-rw+14+i*((2*rw-28)/(n-1));if(Math.abs(px-cx)<16)continue;var hy=g-40+((i%2)?-8:4),f=px<cx?1:-1;s.push([[px,top+16],[px,g-8]]);
    var h=[[-14,0],[-10,-6],[6,-7],[10,-17],[13,-20],[20,-16],[18,-13],[12,-11],[11,-4],[10,2],[13,10],[16,14],[12,15],[7,4],[-6,4],[-9,10],[-12,15],[-15,13],[-11,4],[-14,0]].map(function(p){return [px+p[0]*f,hy+p[1]];});s.push(h);
    s.push([[px-14*f,hy],[px-20*f,hy+8]]);H(s,h.slice(0,-1),1.6,0);}
  skyFill(s,g,RR(R,9,12),RR(R,4,5));return s;}},

{name:'Farm windpump',titles:['Prairie Wind','Water from Deep Down','The Creaking Vane','Stock Tank Noon'],build(R){var s=[],g=RR(R,168,176);
  ground(s,R,g,RR(R,3.4,4.2));var cx=RR(R,120,170),bw=36,hb=g-118,tx=cx+RR(R,36,60);
  var hub=[cx,hb-6],r=RR(R,30,36);var bg=[];hills(bg,R,g,RR(R,10,18),5);behind(s,bg,[[[cx-bw/2,g],[cx-4,hb],[cx+4,hb],[cx+bw/2,g]],rect(tx-22,g-20,tx+22,g)]);
  s.push([[cx-bw/2,g],[cx-4,hb]]);s.push([[cx+bw/2,g],[cx+4,hb]]);for(var i=0;i<5;i++){var t0=i/5,t1=(i+1)/5;var y0=g-(g-hb)*t0,y1=g-(g-hb)*t1,w0=bw/2+(4-bw/2)*t0,w1=bw/2+(4-bw/2)*t1;s.push([[cx-w0,y0],[cx+w0,y0]]);s.push([[cx-w0,y0],[cx+w1,y1]]);s.push([[cx+w0,y0],[cx-w1,y1]]);}
  var n=RI(R,14,18);s.push(circle(hub[0],hub[1],4));s.push(circle(hub[0],hub[1],r));s.push(circle(hub[0],hub[1],r*0.55));
  for(var k=0;k<n;k++){var a=k*TAU/n;var bl=[[hub[0]+r*0.3*Math.cos(a),hub[1]+r*0.3*Math.sin(a)],[hub[0]+r*Math.cos(a),hub[1]+r*Math.sin(a)],[hub[0]+r*Math.cos(a+0.2),hub[1]+r*Math.sin(a+0.2)],[hub[0]+r*0.3*Math.cos(a+0.2),hub[1]+r*0.3*Math.sin(a+0.2)]];s.push(poly(bl));H(s,bl,1.5,a*180/PI);}
  var vane=[[hub[0]+40,hub[1]-2],[hub[0]+52,hub[1]-16],[hub[0]+64,hub[1]-14],[hub[0]+56,hub[1]+4],[hub[0]+40,hub[1]-2]];s.push([[hub[0]+4,hub[1]],[hub[0]+44,hub[1]-2]]);F(s,vane,1.6,0);
  cyl(s,tx,g,22,14,2.2);s.push([[cx,g-10],[tx-22,g-10]]);
  skyFill(s,g,RR(R,9,12),RR(R,4,5));return s;}},

{name:'Wind turbines on a ridge',titles:['Three Slow Turns','Ridge Line Power','Steady Westerly','White Giants'],build(R){var s=[],g=RR(R,150,160),bg=[];
  var hp=hills(bg,R,g,RR(R,30,48),RR(R,3.4,4));var xs=[50+RR(R,-10,10),150+RR(R,-10,10),250+RR(R,-10,10)];
  behind(s,bg,xs.map(function(x){return [[x-4,200],[x-3,40],[x+3,40],[x+4,200]];}));s.push([[4,g],[296,g]]);furrows(s,R,g,RI(R,16,22));
  for(var i=0;i<3;i++){var x=xs[i],b=interpY(hp,x)+1,h=RR(R,72,90)*(i===1?1.1:0.85),hy=b-h;
    s.push([[x-2.5,b],[x-1,hy],[x+1,hy],[x+2.5,b]]);s.push(ellipse(x+2,hy,5,2.5));var a0=RR(R,0,TAU);
    for(var k=0;k<3;k++){var a=a0+k*TAU/3,L=h*0.62;var bl=[[x,hy],[x+L*0.25*Math.cos(a+0.12),hy+L*0.25*Math.sin(a+0.12)],[x+L*Math.cos(a),hy+L*Math.sin(a)],[x+L*0.25*Math.cos(a-0.06),hy+L*0.25*Math.sin(a-0.06)],[x,hy]];F(s,bl,1.4,a*180/PI+90);}}
  skyFill(s,g,RR(R,9,12),RR(R,4,5));return s;}},

{name:'Oil pumpjack',titles:['Nodding Donkey','Slow Rhythm, Dry Field','Up and Down All Day','West Texas Noon'],build(R){var s=[],g=RR(R,164,170);
  ground(s,R,g,RR(R,3.4,4),0);var bx=RR(R,90,120),px=bx+60,py=g-82;
  var bg=[];hills(bg,R,g,RR(R,12,20),5.2);behind(s,bg,[[[bx-20,g],[bx-20,g-50],[px,py-8],[px+80,py],[px+80,g]]]);
  s.push(rect(bx-20,g-6,bx+150,g));H(s,[[bx-20,g-6],[bx+150,g-6],[bx+150,g],[bx-20,g]],1.5,0);
  s.push([[px-22,g-6],[px,py]]);s.push([[px+22,g-6],[px,py]]);s.push([[px-12,g-40],[px+12,g-40]]);s.push([[px-17,g-24],[px+17,g-24]]);
  var tilt=RR(R,-0.18,0.18),L1=70,L2=58,c=Math.cos(tilt),sn=Math.sin(tilt);var beam=[[px-L2*c,py-L2*sn],[px+L1*c,py+L1*sn]];
  var bm=[[beam[0][0],beam[0][1]-4],[beam[1][0],beam[1][1]-4],[beam[1][0],beam[1][1]+4],[beam[0][0],beam[0][1]+4]];F(s,bm,1.4,tilt*180/PI);
  var hx=beam[1][0],hy=beam[1][1];var head=[[hx,hy-10]].concat(arc(hx,hy,10,14,-PI/2,PI/2)).concat([[hx,hy+14],[hx,hy-10]]);F(s,head,1.8,90);s.push([[hx+10,hy],[hx+10,g-6]]);
  s.push(rect(hx+4,g-22,hx+16,g-6));
  var cx=bx+10,cy=g-30;s.push(circle(cx,cy,18));H(s,EP(cx,cy,18,18),2.4,60);s.push([[cx,cy],beam[0]]);s.push(rect(cx-12,cy+10,cx+12,g-6));
  s.push(circle(px,py,3));
  skyFill(s,g,RR(R,9,12),RR(R,4,5));return s;}},

{name:'Harbor crane',titles:['Lifting at Dusk','Container Stack','Dockside Giant','Night Shift Lights'],build(R){var s=[],w=RR(R,160,168);
  s.push([[4,w],[296,w]]);s.push(waterS(R,4,296,w+5,194,5,1.5));var qx=RR(R,140,170);
  s.push(rect(4,w-10,296,w));H(s,[[4,w-10],[296,w-10],[296,w],[4,w]],2.4,0);var leg=w-10,top=leg-96;
  [qx-30,qx+30].forEach(function(x){s.push([[x-3,leg],[x-3,top],[x+3,top],[x+3,leg]]);});
  for(var y=leg;y>top+10;y-=24){s.push([[qx-30,y],[qx+30,y-24]]);s.push([[qx+30,y],[qx-30,y-24]]);s.push([[qx-30,y],[qx+30,y]]);}
  s.push(rect(qx-40,top-16,qx+40,top));H(s,[[qx-40,top-16],[qx+40,top-16],[qx+40,top],[qx-40,top]],1.8,90);
  var bl=RR(R,4,30),br=296;s.push([[bl,top+4],[br,top+4]]);s.push([[bl,top+10],[br,top+10]]);for(var x2=bl;x2<br-6;x2+=12){s.push([[x2,top+4],[x2+6,top+10],[x2+12,top+4]]);}
  s.push([[qx,top-16],[qx,top-40],[bl,top+4]]);s.push([[qx,top-40],[br,top+4]]);
  var tx=RR(R,40,90);s.push(rect(tx-8,top+10,tx+8,top+16));s.push([[tx-4,top+16],[tx-4,top+56]]);s.push([[tx+4,top+16],[tx+4,top+56]]);
  var ct=[[tx-22,top+56],[tx+22,top+56],[tx+22,top+76],[tx-22,top+76]];s.push(poly(ct));for(var x3=tx-18;x3<tx+22;x3+=4)s.push([[x3,top+56],[x3,top+76]]);
  for(var r=0;r<3;r++){for(var c=0;c<RI(R,2,3);c++){var cx0=qx+50+c*40,cy0=leg-(r+1)*16;if(cx0+38>296)continue;s.push(rect(cx0,cy0,cx0+38,cy0+16));H(s,[[cx0,cy0],[cx0+38,cy0],[cx0+38,cy0+16],[cx0,cy0+16]],3,90);}}
  skyFill(s,leg-10,RR(R,9,12),RR(R,4.5,5.5));return s;}}
);

SUBJ.push(
{name:'Biplane on a grass strip',titles:['Before the Barnstorm','Two Wings, One Prop','Morning Preflight','Grass Field Aviator'],build(R){var s=[],g=RR(R,162,168);
  ground(s,R,g,RR(R,3.6,4.2));var x=RR(R,70,90),y=g-22;
  var fus=[[x,y-30],[x+20,y-36],[x+130,y-28],[x+150,y-22],[x+150,y-12],[x+130,y-8],[x+20,y-14],[x,y-22]];s.push(poly(fus));H(s,[[x+20,y-36],[x+60,y-34],[x+60,y-12],[x+20,y-14]],2,0);
  var tail=[[x,y-30],[x-6,y-54],[x+14,y-52],[x+26,y-35]];F(s,tail,2,90);s.push(rect(x-14,y-26,x+22,y-22));
  var wl=[[x+70,y-50],[x+160,y-50],[x+164,y-45],[x+70,y-44]];F(s,wl,2.2,0);var wl2=[[x+64,y-12],[x+158,y-12],[x+160,y-6],[x+64,y-6]];F(s,wl2,2.2,0);
  [x+88,x+140].forEach(function(sx){s.push([[sx,y-44],[sx-4,y-12]]);s.push([[sx,y-44],[sx+6,y-12]]);});
  s.push(arc(x+102,y-36,9,7,PI,TAU));s.push(ellipse(x+156,y-17,4,8));s.push([[x+160,y-40],[x+164,y-17],[x+160,y+6]]);s.push(ellipse(x+162,y-17,2.5,22));
  s.push([[x+110,y-6],[x+104,y+8]]);s.push([[x+110,y-6],[x+122,y+8]]);wheel(s,x+112,y+12,10,6,1.6);s.push([[x+4,y-22],[x+8,y+16]]);s.push(circle(x+8,y+18,3));
  var wsx=RR(R,230,270);s.push([[wsx,g],[wsx,g-70]]);s.push([[wsx,g-70],[wsx+26,g-64],[wsx+30,g-60],[wsx+26,g-56],[wsx,g-52]]);H(s,[[wsx,g-70],[wsx+26,g-64],[wsx+26,g-56],[wsx,g-52]],2,90);
  skyFill(s,g,7,RR(R,4,5),5,[fus,wl,wl2,tail]);return s;}},

{name:'Farm tractor',titles:['After the Harvest','Red Paint, Old Iron','Plowing the Low Field','Diesel at Dawn'],build(R){var s=[],g=RR(R,166,172);
  furrows(s,R,g,RI(R,18,24));var x=RR(R,80,100),rb=[x+40,g-36],fb=[x+150,g-18];
  wheel(s,rb[0],rb[1],36,0,0);for(var k=0;k<20;k++){var a=k*TAU/20;s.push([[rb[0]+36*Math.cos(a),rb[1]+36*Math.sin(a)],[rb[0]+42*Math.cos(a+0.04),rb[1]+42*Math.sin(a+0.04)],[rb[0]+42*Math.cos(a+0.16),rb[1]+42*Math.sin(a+0.16)],[rb[0]+36*Math.cos(a+0.2),rb[1]+36*Math.sin(a+0.2)]]);}
  HX(s,[EP(rb[0],rb[1],26,26),EP(rb[0],rb[1],8,8)],2.2,40);s.push(circle(rb[0],rb[1],26));wheel(s,fb[0],fb[1],18,6,1.8);
  var body=[[x+40,g-72],[x+60,g-72],[x+60,g-58],[x+168,g-58],[x+170,g-28],[x+76,g-28]];s.push(body);H(s,[[x+80,g-56],[x+166,g-56],[x+168,g-30],[x+80,g-30]],RR(R,2.6,3.2),0);
  for(var gx=x+150;gx<x+168;gx+=4)s.push([[gx,g-56],[gx,g-32]]);
  var cab=[[x+10,g-72],[x+10,g-120],[x+70,g-120],[x+70,g-72]];s.push(cab);s.push(rect(x+6,g-124,x+74,g-120));s.push(rect(x+18,g-114,x+62,g-80));
  s.push([[x+130,g-58],[x+130,g-96],[x+136,g-96],[x+136,g-58]]);s.push(arc(x+133,g-96,5,2,PI,TAU));
  s.push([[x+46,g-72],[x+40,g-62],[x+30,g-62]]);s.push(circle(x+34,g-92,5));s.push([[x+34,g-92],[x+42,g-78]]);
  skyFill(s,g,7,RR(R,4,5),5,[EP(rb[0],rb[1],42,42),[[x+40,g-72],[x+60,g-72],[x+60,g-58],[x+168,g-58],[x+170,g-28],[x+76,g-28]],cab]);return s;}},

{name:'Motor scooter',titles:['Riviera Errand','Two-Stroke Morning','Parked by the Café','Little Engine, Big Plans'],build(R){var s=[],g=RR(R,166,172);
  s.push([[4,g],[296,g]]);var cb=[],d=1;for(var y=g+5;y<196;y+=5){var r=[];for(var x=4;x<=296;x+=12)r.push([x,y],[x+6,y-1.2],[x+12,y]);if(d<0)r.reverse();A(cb,r);d=-d;}s.push(cb);
  var x=RR(R,60,80),y=g-13;wheel(s,x+40,y,13,0,1.6);wheel(s,x+150,y,13,0,1.6);
  var cowl=blob([[x+14,y-12],[x+20,y-36],[x+48,y-48],[x+84,y-44],[x+94,y-24],[x+84,y-11]],8);s.push(poly(cowl));H(s,cowl,2,RR(R,25,45));
  var seat=[[x+30,y-48],[x+34,y-58],[x+84,y-58],[x+86,y-48]];F(s,seat,1.4,0);
  var shield=[[x+84,y-11],[x+124,y-11],[x+126,y-40],[x+132,y-72],[x+124,y-72],[x+116,y-40],[x+112,y-16],[x+90,y-16]];s.push(poly(shield));H(s,[[x+116,y-40],[x+126,y-40],[x+132,y-70],[x+124,y-70]],1.4,0);
  s.push(arc(x+150,y,17,14,PI*1.05,PI*1.95));s.push([[x+128,y-70],[x+146,y-90]]);s.push([[x+126,y-92],[x+160,y-90]]);s.push(circle(x+150,y-98,6));s.push([[x+146,y-90],[x+150,y-14]]);
  s.push([[x+14,y-24],[x+4,y-26]]);var win=[[150,30],[260,30],[260,100],[150,100]];var sh1=[[130,30],[150,30],[150,100],[130,100]],sh2=[[260,30],[280,30],[280,100],[260,100]];
  s.push(poly(win));s.push([[205,30],[205,100]]);s.push([[150,65],[260,65]]);s.push(poly(sh1));s.push(poly(sh2));H(s,sh1,3,0);H(s,sh2,3,0);s.push(rect(144,100,266,106));
  var awn=[[20,20],[110,20],[116,40],[14,40]];s.push(poly(awn));for(var k=0;k<6;k++){var ax=20+k*15;H(s,[[ax,20],[ax+7.5,20],[ax+8.5,40],[ax+1,40]],1.6,90);}s.push(scallopRows(14,116,44,44,12,4));
  var wall=[[4,4],[296,4],[296,g],[4,g]],bike=[[x+4,g],[x+14,y-60],[x+90,y-62],[x+126,y-100],[x+166,y-104],[x+170,g]];
  HX(s,[wall,win,sh1,sh2,awn,[[14,40],[116,40],[116,50],[14,50]],[[144,100],[266,100],[266,106],[144,106]],bike],RR(R,8,10),RR(R,40,50));
  return s;}},

{name:'Fire engine',titles:['Ladder Company 9','Polished for the Parade','Station House Doors','Ready on the Apron'],build(R){var s=[],g=RR(R,168,174);
  ground(s,R,g,RR(R,3.6,4.2),0);var x=RR(R,30,45),y=g-14;
  [x+40,x+80,x+190].forEach(function(cx){wheel(s,cx,y,14,6,1.8);});
  var body=[[x,y],[x,y-50],[x+170,y-50],[x+170,y-74],[x+200,y-74],[x+222,y-44],[x+226,y]];s.push(body);s.push([[x,y],[x+226,y]]);
  H(s,[[x,y-30],[x+168,y-30],[x+168,y-18],[x,y-18]],1.6,0);for(var k=0;k<6;k++){var cx=x+10+k*26;s.push(rect(cx,y-46,cx+20,y-34));}
  s.push(rect(x+176,y-68,x+206,y-50));s.push(rect(x+176,y-46,x+212,y-24));
  var lad=[[x+10,y-58],[x+200,y-58]],lad2=[[x+10,y-66],[x+200,y-66]];s.push(lad);s.push(lad2);for(var lx=x+14;lx<x+200;lx+=8)s.push([[lx,y-58],[lx,y-66]]);
  s.push([[x+20,y-50],[x+20,y-58]]);s.push([[x+160,y-50],[x+160,y-58]]);s.push(rect(x+190,y-82,x+200,y-74));s.push(circle(x+224,y-20,4));
  s.push(spiral(x+120,y-24,1,6,2.5));
  var st=[[4,g],[4,g-140],[296,g-140],[296,g]];s.push([[4,g-140],[296,g-140]]);s.push(brickS(4,g-152,296,g-140,12,6));
  skyFill(s,g-152,7,6);H(s,[[x-10,g-132],[x+240,g-132],[x+240,g-104],[x-10,g-104]],3.2,0);s.push(rect(x-10,g-132,x+240,g-104));
  return s;}},

{name:'Double-decker bus',titles:['Top Deck, Front Seat','The Number Twelve','Rainy High Street','Next Stop, Market'],build(R){var s=[],g=RR(R,170,176);
  ground(s,R,g,3.4,0);var x=RR(R,50,70),y=g-12,w=180,h=110;
  var body=[[x,y]].concat(arc(x+10,y-h+10,10,10,PI,1.5*PI)).concat(arc(x+w-10,y-h+10,10,10,1.5*PI,TAU)).concat([[x+w,y],[x,y]]);s.push(body);
  wheel(s,x+36,y,14,6,1.8);wheel(s,x+w-36,y,14,6,1.8);
  s.push([[x,y-56],[x+w,y-56]]);s.push([[x,y-50],[x+w,y-50]]);H(s,[[x,y-56],[x+w,y-56],[x+w,y-50],[x,y-50]],1.4,0);
  for(var k=0;k<6;k++){var wx=x+8+k*28;s.push(rect(wx,y-h+12,wx+24,y-h+36));s.push(rect(wx,y-46,wx+24,y-24));}
  H(s,[[x,y-24],[x+w,y-24],[x+w,y-16],[x,y-16]],1.6,0);s.push(rect(x+w-30,y-h+2,x+w-6,y-h+10));
  var stp=RR(R,250,280);s.push([[stp,g],[stp,g-90]]);s.push(circle(stp,g-98,8));s.push(rect(stp-10,g-80,stp+10,g-60));H(s,[[stp-10,g-80],[stp+10,g-80],[stp+10,g-60],[stp-10,g-60]],2,0);
  skyFill(s,g,7,RR(R,4,5));return s;}},

{name:'Paddle steamer',titles:['Up the River','Churning Wake','Twin Stacks','Sunday Excursion'],build(R){var s=[],w=RR(R,148,156);
  var x=RR(R,40,55),y=w;var hull=[[x,y-14],[x+210,y-14],[x+200,y+6],[x+14,y+6]];s.push(poly(hull));H(s,hull,2,0);
  s.push(rect(x+20,y-40,x+190,y-14));for(var k=0;k<10;k++)s.push(rect(x+26+k*16,y-34,x+36+k*16,y-22));
  s.push(rect(x+30,y-62,x+170,y-40));for(var k2=0;k2<8;k2++)s.push(rect(x+38+k2*16,y-58,x+48+k2*16,y-46));s.push(rect(x+14,y-44,x+196,y-40));s.push(rect(x+24,y-66,x+176,y-62));
  s.push(comb(x+14,x+196,y-44,4,4));
  [x+80,x+110].forEach(function(sx){var st=[[sx,y-66],[sx,y-110],[sx+10,y-110],[sx+10,y-66]];F(s,st,1.6,0);s.push(scallop(sx+5,y-112,7,3,8,0.3));});
  s.push(rect(x+140,y-82,x+166,y-66));
  var pc=[x+105,y-24];s.push(arc(pc[0],pc[1],28,28,PI,TAU).concat([[pc[0]+28,pc[1]]]));for(var k3=0;k3<9;k3++){var a=PI+k3*PI/8;s.push([[pc[0],pc[1]],[pc[0]+28*Math.cos(a),pc[1]+28*Math.sin(a)]]);}
  s.push([[4,w],[296,w]]);s.push(waterS(R,4,296,w+10,194,5,1.6));
  skyFill(s,w,7,RR(R,4,5));return s;}},

{name:'Canoe on a still lake',titles:['Paddle at Rest','Glass Water','Loon Hour','The Far Shore'],build(R){var s=[],w=RR(R,120,130);
  var bg=[];var pts=[];for(var x=4;x<=296;x+=4)pts.push([x,w-14-10*Math.sin(x/40+R())-6*Math.sin(x/17)]);bg.push(pts);
  for(var i=0;i<14;i++){var px=10+i*21+RR(R,-4,4),b=interpY(pts,px);bg.push([[px-8,b],[px,b-RR(R,16,26)],[px+8,b]]);}
  A(s,bg);s.push([[4,w],[296,w]]);s.push([[4,pts[0][1]],[4,w]]);s.push([[296,pts[pts.length-1][1]],[296,w]]);H(s,pts.concat([[296,w],[4,w]]),2.6,0);
  var cx=RR(R,120,180),cy=w+34;var can=[[cx-70,cy-10]].concat(quad([cx-70,cy-10],[cx,cy+16],[cx+70,cy-10],20)).concat(quad([cx+70,cy-10],[cx,cy-2],[cx-70,cy-10],20));s.push(can);
  var inner=quad([cx-62,cy-7],[cx,cy+2],[cx+62,cy-7],20);s.push(inner);H(s,can.slice(0,21).concat(inner.slice().reverse()),1.6,0);
  for(var t=-2;t<=2;t++)s.push([[cx+t*20,cy-4],[cx+t*20,cy+5]]);
  s.push([[cx+20,cy-30],[cx+60,cy+22]]);var bl=[[cx+56,cy+16],[cx+66,cy+18],[cx+70,cy+32],[cx+60,cy+30]];F(s,bl,1.4,40);
  var rf=[],d=1;for(var y=cy+14;y<194;y+=4){var hw=70-(y-cy)*0.9;if(hw<10)break;if(d>0)rf.push([cx-hw,y],[cx+hw,y]);else rf.push([cx+hw,y],[cx-hw,y]);d=-d;}if(rf.length)s.push(rf);
  for(var r2=w+8;r2<194;r2+=7){s.push(wave(4,cx-80,r2,0.8,20));s.push(wave(cx+80,296,r2,0.8,20));}
  skyFill(s,w,7,RR(R,4,5));return s;}},

{name:'Surfaced submarine',titles:['Running on the Surface','Periscope Depth','Gray Hull, Gray Sea','Coming Home'],build(R){var s=[],w=RR(R,128,136);
  var x=RR(R,30,45),hull=[[x,w]].concat(quad([x,w],[x+20,w-22],[x+60,w-22])).concat([[x+190,w-22]]).concat(quad([x+190,w-22],[x+226,w-20],[x+236,w]));s.push(hull);
  H(s,[[x+10,w-14],[x+226,w-14],[x+232,w-4],[x+4,w-4]],2.2,0);
  var tw=[[x+100,w-22],[x+106,w-58],[x+150,w-58],[x+160,w-22]];F(s,tw,RR(R,2,2.6),90);s.push([[x+120,w-58],[x+120,w-80]]);s.push([[x+120,w-80],[x+128,w-80]]);s.push([[x+136,w-58],[x+136,w-74]]);
  s.push([[x+104,w-40],[x+92,w-40],[x+92,w-36],[x+104,w-36]]);
  for(var k=0;k<8;k++)s.push(circle(x+40+k*20,w-17,1.2));
  s.push([[4,w],[296,w]]);s.push(waterS(R,4,296,w+5,194,5,1.6));H(s,[[x+10,w+4],[x+220,w+4],[x+200,w+16],[x+30,w+16]],2.6,0);
  skyFill(s,w,7,RR(R,4,5));return s;}},

{name:'Vintage roadster',titles:['Sunday Drive','Chrome and Canvas','Top Down, Coast Road','Garage Find'],build(R){var s=[],g=RR(R,166,172);
  ground(s,R,g,3.4,0);var x=RR(R,50,70),y=g-16;wheel(s,x+44,y,16,10,1.6);wheel(s,x+164,y,16,10,1.6);
  var fender=arc(x+44,y,22,20,PI,TAU),fender2=arc(x+164,y,22,20,PI,TAU);s.push(fender);s.push(fender2);
  s.push([[x+66,y],[x+142,y]]);s.push([[x+20,y],[x+12,y-4]]);
  var body=[[x+16,y-14],[x+16,y-34],[x+60,y-38],[x+80,y-56],[x+90,y-56],[x+96,y-40],[x+190,y-40],[x+200,y-30],[x+200,y-14]];s.push(body);
  var hood=[[x+120,y-40],[x+190,y-40],[x+198,y-30],[x+120,y-28]];H(s,hood,2,0);for(var k=0;k<6;k++)s.push([[x+130+k*8,y-36],[x+130+k*8,y-30]]);
  s.push(rect(x+196,y-40,x+204,y-14));s.push(circle(x+200,y-46,5));s.push([[x+78,y-56],[x+96,y-40]]);
  s.push(arc(x+40,y-34,14,10,PI,1.6*PI));s.push(circle(x+100,y-48,6));
  var hx=RR(R,4,30);var bg=[];hills(bg,R,g,RR(R,18,28),4.4);behind(s,bg,[[[x-10,g],[x-10,y-60],[x+210,y-60],[x+210,g]]]);
  skyFill(s,g,7,RR(R,4,5),5,[[[x+16,y],[x+16,y-34],[x+60,y-38],[x+80,y-56],[x+96,y-40],[x+190,y-40],[x+204,y-30],[x+204,y],[x+16,y]]]);return s;}},

{name:'Airship at the mooring mast',titles:['Moored at Dawn','Silver Giant','Waiting for the Wind','Lighter Than Air'],build(R){var s=[],g=RR(R,170,176);
  ground(s,R,g,RR(R,3.6,4.2));var mx=RR(R,240,262),mt=g-104;
  s.push([[mx-12,g],[mx-3,mt]]);s.push([[mx+12,g],[mx+3,mt]]);for(var y=g;y>mt+10;y-=14){var t=(g-y)/(g-mt),hw=12-9*t,t2=(g-y+14)/(g-mt),hw2=12-9*t2;s.push([[mx-hw,y],[mx+hw2,y-14]]);s.push([[mx+hw,y],[mx-hw2,y-14]]);}
  s.push(circle(mx,mt-4,4));var cx=mx-118,cy=mt+4;var env=EP(cx,cy,112,30);s.push(poly(env));
  for(var k=-4;k<=4;k++){var xx=cx+k*24,hh=30*Math.sqrt(Math.max(0,1-Math.pow(k*24/112,2)));s.push([[xx,cy-hh],[xx,cy+hh]]);}
  s.push(arc(cx,cy,112,12,0,PI));s.push(arc(cx,cy,112,12,PI,TAU));
  H(s,arc(cx,cy,112,30,0.15,PI-0.15).concat(arc(cx,cy,104,14,PI-0.15,0.15)),2,0);
  var fin=[[cx-96,cy-14],[cx-118,cy-34],[cx-112,cy-12]];F(s,fin,1.4,0);var fin2=[[cx-96,cy+14],[cx-118,cy+34],[cx-112,cy+12]];F(s,fin2,1.4,0);
  var gon=[[cx+10,cy+30],[cx+50,cy+30],[cx+46,cy+40],[cx+14,cy+40]];s.push(poly(gon));for(var w=0;w<4;w++)s.push(rect(cx+16+w*8,cy+32,cx+22+w*8,cy+37));
  s.push([[cx+112,cy],[mx-4,mt-4]]);s.push([[cx+20,cy+40],[cx+10,g]]);s.push([[cx-40,cy+28],[cx-60,g]]);
  skyFill(s,g,7,RR(R,4,5));return s;}},

{name:'Sailing junk',titles:['Battened Sails','Harbor at Evening','Red Canvas, Calm Bay','Junk Under Way'],build(R){var s=[],w=RR(R,146,152);
  var x=RR(R,55,75);var hull=[[x,w-30],[x+20,w-12],[x+150,w-12],[x+176,w-34],[x+160,w+4],[x+16,w+4],[x,w-30]];s.push(hull);H(s,[[x+16,w-10],[x+154,w-10],[x+158,w+2],[x+18,w+2]],2,0);
  s.push(rect(x+130,w-30,x+170,w-12));
  var ms=[[x+60,140],[x+110,150]];[[x+60,w-12,104,60],[x+112,w-12,84,48],[x+150,w-30,52,30]].forEach(function(m){var mx=m[0],b=m[1],h=m[2],sw=m[3];s.push([[mx,b],[mx,b-h-6]]);
    var top=b-h,sail=[[mx,top],[mx-sw*0.8,top+6],[mx-sw,b-14],[mx+sw*0.15,b-14],[mx+sw*0.15,top]];s.push(poly(sail));
    for(var k=1;k<6;k++){var t=k/6;s.push([[mx-sw*0.8-(sw*0.2)*t,top+6+(b-14-top-6)*t],[mx+sw*0.15,top+(b-14-top)*t]]);}H(s,sail,RR(R,3.2,4),90);});
  s.push([[4,w],[296,w]]);s.push(waterS(R,4,296,w+6,194,5,1.6));
  skyFill(s,w,7,RR(R,4,5));return s;}},

{name:'Gondola in a canal',titles:['Under the Little Bridge','Lantern on the Bow','Slow Water, Old Walls','The Long Oar'],build(R){var s=[],w=RR(R,150,156);
  s.push([[4,w],[296,w]]);var lb=[[4,w],[4,30],[70,30],[70,w]],rb=[[230,w],[230,24],[296,24],[296,w]];s.push(lb);s.push(rb);s.push(brickS(4,30,70,w,11,6));
  for(var k=0;k<3;k++){s.push(rect(240+k*18,40,252+k*18,60));s.push(arc(246+k*18,40,6,6,PI,TAU));s.push(rect(240+k*18,80,252+k*18,100));}H(s,rb,4,0);
  var br=[[70,70],[230,70]];s.push([[70,64],[230,64]]);s.push([[70,70]].concat(arc(150,96,80,26,PI,TAU)).concat([[230,70]]));H(s,[[70,64],[230,64],[230,70]].concat(arc(150,96,80,26,TAU,PI)),2.2,0);
  s.push(comb(70,230,64,8,6));
  var cx=RR(R,120,180),y=w+16;var gd=[[cx-80,y-26]].concat(quad([cx-80,y-26],[cx-50,y+4],[cx,y+4]),quad([cx,y+4],[cx+60,y+4],[cx+86,y-30])).concat([[cx+76,y-14],[cx-70,y-12]]);s.push(poly(gd));H(s,gd,1.8,0);
  s.push([[cx+86,y-30],[cx+92,y-36],[cx+88,y-40],[cx+82,y-34]]);s.push([[cx-20,y-12],[cx-20,y-22],[cx+10,y-22],[cx+10,y-12]]);
  s.push([[cx-60,y-14],[cx-60,y-52]]);s.push(circle(cx-60,y-56,4));s.push([[cx-66,y-50],[cx-46,y+20]]);
  s.push(waterS(R,4,296,w+8,194,5,1.4));
  skyFill(s,64,7,5);return s;}},

{name:'Vintage camper trailer',titles:['Campground, Site 14','Riveted and Rounded','Lake Weekend','Awning Out'],build(R){var s=[],g=RR(R,166,172);
  ground(s,R,g,RR(R,3.6,4.2));var x=RR(R,60,80),y=g-14;
  var body=[[x,y]].concat(arc(x+40,y-36,40,36,PI,1.5*PI)).concat(arc(x+130,y-30,40,42,1.5*PI,TAU)).concat([[x+170,y],[x,y]]);s.push(body);
  for(var k=1;k<6;k++){var yy=y-k*12;s.push([[x+(k>3?14:4),yy],[x+(k>3?156:166),yy]]);}
  wheel(s,x+90,y,12,5,1.8);s.push([[x+170,y-6],[x+200,y-2]]);s.push([[x+196,y-2],[x+196,y+6]]);
  s.push(rect(x+30,y-50,x+60,y-30));s.push(ellipse(x+120,y-46,20,12));var dr=[[x+76,y],[x+76,y-56],[x+98,y-56],[x+98,y]];s.push(dr);
  var aw=[[x+20,y-62],[x+70,y-62],[x+80,y-46],[x+10,y-46]];F(s,aw,2,90);s.push([[x+10,y-46],[x+6,g]]);s.push([[x+80,y-46],[x+84,g]]);
  HX(s,[body.slice(0,-1),dr,EP(x+120,y-46,20,12),rect(x+30,y-50,x+60,y-30).slice(0,4)],RR(R,4,6),RR(R,60,80));
  var tx=RR(R,240,270);treeR(s,R,tx,g,RR(R,18,22),2.4);
  skyFill(s,g,7,RR(R,4,5));return s;}},

{name:'Tandem bicycle',titles:['Built for Two','Pedaling in Step','Boardwalk Ride','Front Seat Steers'],build(R){var s=[],g=RR(R,168,174);
  ground(s,R,g,3.4,0);var y=g-26,x1=RR(R,50,64),x2=x1+190,r=24;
  [x1,x2].forEach(function(cx){s.push(circle(cx,y,r));s.push(circle(cx,y,r-3));for(var k=0;k<16;k++){var a=k*TAU/16;s.push([[cx,y],[cx+(r-3)*Math.cos(a),y+(r-3)*Math.sin(a)]]);}});
  var c1=x1+70,c2=x1+130,st=y-44;
  s.push([[x1,y],[c1,y]]);s.push([[x1,y],[c1-10,st]]);s.push([[c1,y],[c1-10,st]]);s.push([[c1,y],[c2,y]]);s.push([[c1-10,st],[c2-10,st]]);s.push([[c2,y],[c2-10,st]]);s.push([[c1,y],[c2-10,st]]);
  s.push([[c2-10,st],[x2-10,st-6]]);s.push([[c2,y],[x2-10,st-6]]);s.push([[x2-10,st-6],[x2,y]]);s.push([[x2-10,st-6],[x2-14,st-18],[x2-24,st-20]]);
  [c1-10,c2-10].forEach(function(sx){s.push([[sx,st],[sx-2,st-8]]);s.push([[sx-12,st-10],[sx+6,st-10],[sx+4,st-6],[sx-10,st-6],[sx-12,st-10]]);});
  [c1,c2].forEach(function(cx){s.push(circle(cx,y,6));s.push([[cx-6,y+6],[cx+6,y-6]]);});
  s.push(arc(x2,y,r+4,r+4,PI*1.1,PI*1.6));s.push(arc(x1,y,r+4,r+4,PI*1.4,PI*1.9));
  var p=[],d=1;for(var yy=g-6;yy>g-50;yy-=6){}var fx=[];for(var x=4;x<296;x+=14){fx.push([x,g],[x,g-40],[x+7,g-46],[x+14,g-40],[x+14,g]);}s.push(fx);s.push([[4,g-30],[296,g-30]]);
  skyFill(s,g-48,7,RR(R,4,5));return s;}},

{name:'Seaplane at the dock',titles:['Float Plane, Lake Arrival','Morning Mail Run','Pontoons and Pilings','Island Hopper'],build(R){var s=[],w=RR(R,148,154);
  s.push([[4,w],[296,w]]);s.push(waterS(R,4,296,w+6,194,5,1.5));var dk=RR(R,200,220);s.push(rect(dk,w-8,296,w-4));for(var px=dk+6;px<296;px+=16)s.push([[px,w-4],[px,w+18]]);
  var x=RR(R,40,60),y=w-18;
  [[x+30,y+12],[x+30,y+12]].forEach(function(){});var pon=[[x+20,y+10],[x+150,y+10],[x+160,y+4],[x+152,y+16],[x+24,y+16]];s.push(poly(pon));H(s,pon,1.6,0);
  s.push([[x+70,y+10],[x+66,y-8]]);s.push([[x+120,y+10],[x+118,y-8]]);
  var fus=[[x,y-30],[x+10,y-40],[x+120,y-38],[x+150,y-30],[x+152,y-16],[x+120,y-8],[x+30,y-12]];s.push(poly(fus));
  var tail=[[x,y-30],[x-6,y-58],[x+12,y-56],[x+26,y-38]];F(s,tail,2,90);
  var wing=[[x+70,y-40],[x+140,y-40],[x+140,y-46],[x+70,y-46]];F(s,wing,1.6,0);s.push([[x+80,y-46],[x+100,y-8]]);
  s.push(rect(x+96,y-34,x+112,y-22));s.push(rect(x+116,y-34,x+130,y-22));H(s,[[x+20,y-24],[x+150,y-24],[x+150,y-16],[x+20,y-16]],1.6,0);
  s.push(ellipse(x+154,y-24,3,8));s.push(ellipse(x+156,y-24,2,18));
  skyFill(s,w,7,RR(R,4,5),5,[fus,wing,tail,pon,[[x+66,y-8],[x+120,y-8],[x+120,y+10],[x+66,y+10]]]);return s;}},

{name:'Container ship',titles:['Twelve Thousand Boxes','Outbound on the Tide','Stacked to the Bridge','Long Haul'],build(R){var s=[],w=RR(R,146,152);
  var x=RR(R,14,26),hull=[[x,w-30],[x+250,w-30],[x+268,w-44],[x+262,w+6],[x+10,w+6]];s.push(poly(hull));H(s,[[x+4,w-8],[x+262,w-8],[x+262,w+4],[x+10,w+4]],1.8,0);
  s.push([[x+2,w-14],[x+264,w-14]]);var br=[[x+10,w-30],[x+10,w-90],[x+50,w-90],[x+50,w-30]];s.push(br);s.push(rect(x+6,w-96,x+54,w-90));
  for(var r=0;r<5;r++){s.push([[x+12,w-38-r*10],[x+48,w-38-r*10]]);}s.push([[x+30,w-96],[x+30,w-112]]);s.push([[x+20,w-108],[x+40,w-108]]);
  var colw=RR(R,18,22);for(var cx=x+60;cx+colw<x+250;cx+=colw){var h=RI(R,2,5);for(var k=0;k<h;k++){var y0=w-30-(k+1)*11;var c=[[cx,y0],[cx+colw,y0],[cx+colw,y0+11],[cx,y0+11]];s.push(poly(c));if((k+Math.round(cx))%4===0)H(s,c,2.6,90);else s.push(comb(cx,cx+colw,y0+10,8,4));}}
  s.push([[4,w],[296,w]]);s.push(waterS(R,4,296,w+8,194,5,1.5));
  skyFill(s,w,7,RR(R,4,5));return s;}},

{name:'Lunar lander',titles:['Tranquility Base','One Small Step','Gold Foil, Gray Dust','Earthrise'],build(R){var s=[],g=RR(R,160,168);
  var gr=[];for(var x=4;x<=296;x+=4)gr.push([x,g+2*Math.sin(x/23)+1.5*Math.sin(x/9)]);s.push(gr);
  for(var c=0;c<RI(R,4,6);c++){var cx=RR(R,15,285),cy=RR(R,g+10,190),rx=RR(R,10,22);s.push(ellipse(cx,cy,rx,rx*0.28));H(s,arc(cx,cy,rx,rx*0.28,PI,TAU),1.6,0);}
  var lx=RR(R,120,170),ly=g-20;
  [[-50,1],[50,1]].forEach(function(l){var fx=lx+l[0];s.push([[lx+l[0]*0.5,ly-30],[fx,ly+14]]);s.push([[lx+l[0]*0.5,ly-10],[fx,ly+14]]);s.push(ellipse(fx,ly+15,7,2));});
  s.push([[lx,ly-10],[lx,ly+12]]);s.push(ellipse(lx,ly+13,7,2));
  var des=[[lx-34,ly-42],[lx+34,ly-42],[lx+40,ly-10],[lx-40,ly-10]];F(s,des,RR(R,2,2.6),RR(R,40,60));
  var asc=[[lx-30,ly-42],[lx-26,ly-70],[lx-10,ly-82],[lx+12,ly-82],[lx+28,ly-70],[lx+32,ly-42]];s.push(asc);s.push(poly([[lx-14,ly-72],[lx-4,ly-72],[lx-6,ly-60],[lx-14,ly-60]]));
  s.push([[lx+10,ly-82],[lx+10,ly-96]]);s.push(arc(lx+10,ly-100,8,4,0,PI));s.push(rect(lx-24,ly-52,lx-12,ly-44));
  s.push([[lx-40,ly-10],[lx-46,ly-4],[lx-46,ly+2]]);var fx2=lx+RR(R,60,90);s.push([[fx2,g],[fx2,g-44]]);s.push(rect(fx2,g-44,fx2+22,g-30));H(s,[[fx2,g-44],[fx2+22,g-44],[fx2+22,g-30],[fx2,g-30]],2.6,0);
  skyFill(s,g,4,RR(R,2.6,3.2));return s;}},

{name:'Fishing trawler',titles:['Nets Out at Dawn','Gulls Astern','Home Before the Weather','Working Boat'],build(R){var s=[],w=RR(R,146,152);
  var x=RR(R,50,70),hull=[[x,w-34],[x+40,w-26],[x+170,w-26],[x+194,w-40],[x+180,w+6],[x+16,w+6]];s.push(poly(hull));H(s,[[x+16,w-6],[x+180,w-6],[x+180,w+4],[x+16,w+4]],1.8,0);s.push([[x+10,w-16],[x+186,w-16]]);
  var wh=[[x+120,w-26],[x+120,w-66],[x+168,w-66],[x+172,w-26]];s.push(wh);s.push(rect(x+116,w-72,x+172,w-66));for(var k=0;k<3;k++)s.push(rect(x+126+k*14,w-60,x+136+k*14,w-48));H(s,[[x+120,w-44],[x+172,w-44],[x+172,w-26],[x+120,w-26]],2,90);
  s.push([[x+144,w-72],[x+144,w-104]]);s.push([[x+136,w-96],[x+152,w-96]]);s.push([[x+70,w-26],[x+70,w-110]]);s.push([[x+70,w-104],[x+20,w-40]]);s.push([[x+70,w-100],[x+110,w-30]]);
  var net=[];for(var i=0;i<6;i++){var t=i/5;net.push([x+20+t*10,w-40+t*30]);}s.push(net);for(var j=0;j<5;j++)s.push([[x+20+j*4,w-40+j*7],[x+40,w-30+j*5]]);
  s.push(circle(x+30,w-30,3));s.push(rect(x+90,w-36,x+110,w-26));
  s.push([[4,w],[296,w]]);s.push(waterS(R,4,296,w+8,194,5,1.6));
  skyFill(s,w,7,RR(R,4,5));return s;}},

{name:'Helicopter on a helipad',titles:['Rotor Down','Rooftop Pad','Waiting on the Pilot','Clear for Lift'],build(R){var s=[],g=RR(R,166,172);
  var pad=[[30,g],[270,g],[290,196],[10,196]];s.push(pad);H(s,[[30,g],[270,g],[290,196],[10,196]],RR(R,3.6,4.4),0);s.push(ellipse(150,g+14,70,10));
  var x=RR(R,90,110),y=g-14;s.push([[x+10,y+8],[x+120,y+8]]);s.push([[x+30,y+8],[x+34,y-6]]);s.push([[x+100,y+8],[x+96,y-6]]);
  var cab=blob([[x+20,y-30],[x+50,y-58],[x+110,y-56],[x+128,y-30],[x+110,y-6],[x+40,y-6]],8);s.push(poly(cab));
  var win=blob([[x+28,y-30],[x+50,y-52],[x+70,y-50],[x+70,y-28]],6);s.push(poly(win));HX(s,[cab,win],2.2,RR(R,20,40));
  s.push([[x+110,y-36],[x+196,y-38]]);s.push([[x+110,y-26],[x+196,y-36]]);var fin=[[x+190,y-38],[x+200,y-60],[x+206,y-58],[x+200,y-36]];F(s,fin,1.4,90);s.push(circle(x+200,y-44,7));
  s.push([[x+76,y-56],[x+76,y-66]]);s.push(rect(x+66,y-70,x+86,y-66));var rl=RR(R,90,120);s.push([[x+76-rl,y-70],[x+76+rl,y-74]]);s.push([[x+76-rl,y-72],[x+76+rl,y-72]]);
  var bg=[];for(var b=0;b<5;b++){var bx=8+b*58,bh=RR(R,30,70);bg.push([[bx,g],[bx,g-bh],[bx+44,g-bh],[bx+44,g]]);bg.push.apply(bg,hatch([[bx,g-bh],[bx+44,g-bh],[bx+44,g],[bx,g]],5,90));}
  behind(s,bg,[cab,[[x-10,g],[x-10,y-74],[x+210,y-74],[x+210,g]]]);s.push([[4,g],[296,g]]);
  skyFill(s,g,7,RR(R,4,5));return s;}},

{name:'Steamroller',titles:['Smoothing the New Road','Heavy and Slow','Iron Drum','Road Crew Noon'],build(R){var s=[],g=RR(R,168,174);
  var rd=[[4,g],[296,g]];s.push(rd);H(s,[[4,g],[296,g],[296,196],[4,196]],3,0);var x=RR(R,50,70),y=g;
  var dr=[x+180,y-26];s.push(circle(dr[0],dr[1],26));HX(s,[EP(dr[0],dr[1],26,26),EP(dr[0],dr[1],8,8)],2.2,90);s.push(circle(dr[0],dr[1],8));
  wheel(s,x+40,y-34,34,12,0);s.push(circle(x+40,y-34,30));
  var boil=[[x+60,y-80],[x+160,y-80],[x+160,y-56],[x+60,y-56]];s.push(poly(boil));H(s,boil,2.4,0);s.push(rect(x+156,y-60,x+204,y-50));s.push([[x+180,y-50],[x+180,y-26]]);
  var stk=[[x+140,y-80],[x+138,y-116],[x+152,y-116],[x+150,y-80]];F(s,stk,1.6,0);s.push(scallop(x+145,y-120,10,4,8,0.3));
  var cab=[[x+10,y-74],[x+10,y-120],[x+80,y-120],[x+80,y-74]];s.push(cab);s.push(rect(x+4,y-126,x+86,y-120));s.push([[x+16,y-120],[x+16,y-74]]);s.push([[x+74,y-120],[x+74,y-74]]);
  s.push(circle(x+96,y-92,8));for(var k=0;k<6;k++){var a=k*PI/3;s.push([[x+96,y-92],[x+96+8*Math.cos(a),y-92+8*Math.sin(a)]]);}
  var cn=[];for(var c=0;c<3;c++){var cx=RR(R,230,285);s.push([[cx-6,g],[cx,g-14],[cx+6,g]]);s.push([[cx-3,g-7],[cx+3,g-7]]);}
  skyFill(s,g,7,RR(R,4,5));return s;}},

{name:'Railway handcar',titles:['Pump and Roll','Section Gang','Down the Spur','Two Men, One Lever'],build(R){var s=[],g=RR(R,160,166);
  var bgh=[];hills(bgh,R,g-16,RR(R,16,26),0);
  s.push([[4,g],[296,g]]);s.push([[4,g+4],[296,g+4]]);for(var x=6;x<296;x+=12)s.push(rect(x,g+4,x+8,g+9));var gd=[];for(var yy=g+12;yy<196;yy+=4)gd.push(yy);H(s,[[4,g+9],[296,g+9],[296,196],[4,196]],3.6,RR(R,10,20));
  var cx=RR(R,120,180),y=g-10;wheel(s,cx-40,y,10,6,0);wheel(s,cx+40,y,10,6,0);
  var dk=[[cx-60,y-14],[cx+60,y-14],[cx+60,y-6],[cx-60,y-6]];F(s,dk,1.6,0);s.push([[cx-40,y-14],[cx-40,y]]);s.push([[cx+40,y-14],[cx+40,y]]);
  s.push([[cx-8,y-14],[cx,y-46],[cx+8,y-14]]);var t=RR(R,-0.4,0.4),L=46;s.push([[cx-L*Math.cos(t),y-46-L*Math.sin(t)],[cx+L*Math.cos(t),y-46+L*Math.sin(t)]]);
  [-1,1].forEach(function(sd){var hx=cx+sd*L*Math.cos(t),hy=y-46+sd*L*Math.sin(t);s.push([[hx-6,hy],[hx+6,hy]]);});
  s.push(rect(cx-56,y-24,cx-30,y-14));H(s,[[cx-56,y-24],[cx-30,y-24],[cx-30,y-14],[cx-56,y-14]],2,0);
  behind(s,bgh,[[[cx-62,g],[cx-62,y-24],[cx-50,y-80],[cx+50,y-80],[cx+62,y-24],[cx+62,g]]]);
  for(var k=0;k<RI(R,3,5);k++){var tx=RR(R,10,290);if(Math.abs(tx-cx)<80)continue;s.push([[tx,g],[tx,g-58]]);s.push([[tx-10,g-52],[tx+10,g-52]]);}
  skyFill(s,g-16,7,RR(R,4,5));return s;}},

{name:'Bulldozer',titles:['Clearing the Lot','Blade Down','Tracks in the Mud','Moving Earth'],build(R){var s=[],g=RR(R,168,174);
  ground(s,R,g,RR(R,3.4,4));var x=RR(R,60,80),y=g;
  var tr=[[x+20,y]].concat(arc(x+20,y-16,16,16,PI/2,1.5*PI)).concat(arc(x+140,y-16,16,16,-PI/2,PI/2)).concat([[x+20,y]]);s.push(tr);
  var it=[[x+22,y-6]].concat(arc(x+22,y-16,10,10,PI/2,1.5*PI)).concat(arc(x+138,y-16,10,10,-PI/2,PI/2)).concat([[x+22,y-6]]);s.push(it);
  for(var k=0;k<18;k++){var tx=x+20+k*7;s.push([[tx,y],[tx,y-6]]);s.push([[tx,y-26],[tx,y-32]]);}[x+20,x+50,x+80,x+110,x+140].forEach(function(cx){s.push(circle(cx,y-16,6));});
  var body=[[x+30,y-32],[x+30,y-62],[x+130,y-62],[x+140,y-32]];s.push(body);H(s,[[x+30,y-62],[x+130,y-62],[x+140,y-32],[x+30,y-32]],RR(R,2.4,3),0);
  var cab=[[x+40,y-62],[x+44,y-104],[x+96,y-104],[x+100,y-62]];s.push(cab);s.push(rect(x+38,y-108,x+102,y-104));s.push(rect(x+52,y-98,x+88,y-70));
  s.push([[x+116,y-62],[x+116,y-84]]);s.push(arc(x+116,y-86,4,2,PI,TAU));
  var bl=[[x+170,y-2],[x+166,y-54],[x+176,y-58],[x+188,y-2]];F(s,bl,2,80);s.push([[x+140,y-40],[x+168,y-30]]);s.push([[x+140,y-24],[x+168,y-12]]);
  var pl=[[x+190,g],[x+200,g-18],[x+222,g-26],[x+246,g-16],[x+262,g]];s.push(pl);H(s,pl,2.6,30);
  skyFill(s,g,7,RR(R,4,5));return s;}},

{name:'Excavator',titles:['Digging the Foundation','Boom and Bucket','Hard Hat Morning','First Scoop'],build(R){var s=[],g=RR(R,166,172);
  ground(s,R,g,RR(R,3.4,4));var x=RR(R,40,60),y=g;
  var tr=[[x+20,y]].concat(arc(x+20,y-14,14,14,PI/2,1.5*PI)).concat(arc(x+120,y-14,14,14,-PI/2,PI/2)).concat([[x+20,y]]);s.push(tr);H(s,tr.slice(0,-1),2,0);
  s.push(rect(x+40,y-36,x+100,y-28));var hs=[[x+20,y-36],[x+20,y-70],[x+120,y-70],[x+120,y-36]];s.push(hs);H(s,[[x+60,y-70],[x+120,y-70],[x+120,y-36],[x+60,y-36]],2.4,0);
  var cab=[[x+22,y-70],[x+22,y-110],[x+56,y-110],[x+60,y-70]];s.push(cab);s.push(rect(x+28,y-104,x+52,y-78));
  var a1=-RR(R,0.6,0.9),L1=80,p0=[x+100,y-70],p1=[p0[0]+L1*Math.cos(a1),p0[1]+L1*Math.sin(a1)];var b1=[[p0[0],p0[1]-4],[p1[0],p1[1]-4],[p1[0],p1[1]+4],[p0[0],p0[1]+4]];F(s,b1,1.6,a1*180/PI);
  var a2=RR(R,0.9,1.3),L2=64,p2=[p1[0]+L2*Math.cos(a2),p1[1]+L2*Math.sin(a2)];var b2=[[p1[0]-3,p1[1]],[p2[0]-3,p2[1]],[p2[0]+3,p2[1]],[p1[0]+3,p1[1]]];F(s,b2,1.4,a2*180/PI);
  var bk=[[p2[0],p2[1]],[p2[0]+22,p2[1]+4],[p2[0]+18,p2[1]+22],[p2[0]-2,p2[1]+18]];F(s,bk,1.6,0);for(var t=0;t<4;t++)s.push([[p2[0]+18-t*5,p2[1]+22],[p2[0]+16-t*5,p2[1]+26]]);
  s.push([[p0[0]-10,p0[1]+10],[p0[0]+L1*0.5*Math.cos(a1),p0[1]+L1*0.5*Math.sin(a1)+6]]);
  var pit=[[x+150,g]].concat(arc(x+200,g,50,22,PI,0)).concat([[x+250,g]]);s.push(pit);
  skyFill(s,g,7,RR(R,4.4,5.4),5,[hs,cab,tr]);return s;}}
);

SUBJ.push(
{name:'Sea turtle',titles:['Long Way Home','Reef Glide','Old Swimmer','Blue Hour Drift'],build(R){var s=[],bed=seabed(s,R,RR(R,168,176),RI(R,3,5));
  var cx=RR(R,135,165),cy=RR(R,88,100),f=1;var sh=EP(cx,cy,52,34);s.push(poly(sh));s.push(poly(EP(cx,cy,46,28)));
  var sc=[[cx-14,cy-10],[cx+14,cy-10],[cx+20,cy+6],[cx,cy+16],[cx-20,cy+6]];s.push(poly(sc));[[cx-14,cy-10],[cx+14,cy-10],[cx+20,cy+6],[cx,cy+16],[cx-20,cy+6]].forEach(function(p){var dx=p[0]-cx,dy=p[1]-cy,L=Math.hypot(dx,dy);s.push([p,[cx+dx/L*46*0.98,cy+dy/L*28]]);});
  HX(s,[sh,EP(cx,cy,46,28)],1.6,0);H(s,[[cx+20,cy+6],[cx+40,cy+12],[cx+30,cy+22],[cx,cy+16]],2,60);
  var hd=blob([[cx+50,cy-6],[cx+70,cy-12],[cx+84,cy-4],[cx+78,cy+6],[cx+52,cy+6]],6);s.push(poly(hd));eye(s,cx+74,cy-5,2.2);
  var fl1=blob([[cx+20,cy-26],[cx+40,cy-50],[cx+70,cy-64],[cx+56,cy-44],[cx+34,cy-24]],6);s.push(poly(fl1));H(s,fl1,2.2,40);
  var fl2=blob([[cx+20,cy+26],[cx+40,cy+44],[cx+64,cy+54],[cx+48,cy+36],[cx+30,cy+24]],6);s.push(poly(fl2));H(s,fl2,2.2,-40);
  var b1=blob([[cx-40,cy-20],[cx-58,cy-34],[cx-70,cy-30],[cx-52,cy-14]],6);s.push(poly(b1));var b2=blob([[cx-40,cy+22],[cx-56,cy+36],[cx-68,cy+32],[cx-50,cy+16]],6);s.push(poly(b2));s.push([[cx-52,cy],[cx-62,cy+2]]);
  skyFill(s,bed[0][1],5,RR(R,4.2,5),5,[sh,hd,fl1,fl2,b1,b2]);return s;}},

{name:'Humpback whale',titles:['Song in the Deep','Slow Giant','Breaching Season','Pectoral Wave'],build(R){var s=[],bed=seabed(s,R,RR(R,176,184),0);
  var y=RR(R,92,104),x=RR(R,20,30);var body=blob([[x,y],[x+30,y-22],[x+110,y-30],[x+190,y-18],[x+230,y-2],[x+244,y],[x+236,y+8],[x+200,y+16],[x+120,y+30],[x+40,y+22]],8);
  s.push(poly(body));for(var k=0;k<8;k++){var gy=y+6+k*2.4;s.push(curve([[x+14,gy],[x+50,gy+8+k],[x+100,gy+10+k*0.6]],8));}
  H(s,blob([[x+10,y-8],[x+40,y-20],[x+110,y-28],[x+190,y-16],[x+200,y-6],[x+110,y-12],[x+40,y-6]],6),2,0);
  var fl=blob([[x+240,y+2],[x+258,y-22],[x+276,y-30],[x+266,y-6],[x+282,y+12],[x+264,y+12],[x+248,y+8]],6);s.push(poly(fl));H(s,fl,1.8,70);eye(s,x+44,y+2,2.4);var fin=blob([[x+70,y+18],[x+90,y+46],[x+130,y+74],[x+112,y+48],[x+92,y+20]],6);s.push(poly(fin));H(s,fin,2.2,50);
  s.push([[x+170,y-20],[x+176,y-30],[x+184,y-18]]);for(var b=0;b<5;b++)s.push(circle(x+18+b*5,y-16-b*3,1.4));
  skyFill(s,bed[0][1],5,RR(R,4.2,5),5,[body,fin,fl]);return s;}},

{name:'Crab on the sand',titles:['Sideways Home','Low Tide Guard','Two Claws Up','Tide Pool Tenant'],build(R){var s=[],g=RR(R,118,126);
  s.push([[4,g],[296,g]]);s.push(waterS(R,4,296,g-36,g-4,4.5,1.4));s.push([[4,g-36],[296,g-36]]);
  var sand=[],d=1;for(var y=g+6;y<196;y+=5){var w=wave(4,296,y,0.7,30,R()*6);if(d<0)w.reverse();A(sand,w);d=-d;}s.push([[4,g]].concat(sand));
  var cx=RR(R,135,165),cy=RR(R,150,160);var body=EP(cx,cy,40,22);var hole=[body];s.push(poly(body));HX(s,[body,EP(cx,cy-4,26,12)],2,0);
  for(var e=-1;e<=1;e+=2){s.push([[cx+e*10,cy-20],[cx+e*12,cy-34]]);eye(s,cx+e*12,cy-37,3);}
  for(var side=-1;side<=1;side+=2){for(var l=0;l<3;l++){var a=[cx+side*34,cy+4+l*5];s.push([a,[a[0]+side*16,a[1]-8+l*3],[a[0]+side*26,a[1]+14+l*2]]);}
    var arm=[[cx+side*30,cy-10],[cx+side*46,cy-28],[cx+side*52,cy-40]];s.push(arm);var cl=blob([[cx+side*44,cy-42],[cx+side*54,cy-62],[cx+side*68,cy-60],[cx+side*66,cy-44],[cx+side*56,cy-38]],6);s.push(poly(cl));H(s,cl,1.6,30);
    s.push([[cx+side*58,cy-56],[cx+side*62,cy-48]]);}
  for(var sh=0;sh<3;sh++){var sx=RR(R,20,90)+sh*(sh>1?150:0);s.push(scallop(sx,g+30+sh*8,8,6,8,0.15));}
  skyFill(s,g-36,7,RR(R,4,5));return s;}},

{name:'Seahorse among kelp',titles:['Curled Tail','Upright Swimmer','Kelp Forest Hide','Little Knight'],build(R){var s=[],bed=seabed(s,R,RR(R,176,184),RI(R,5,7));
  var cx=RR(R,130,170),cy=RR(R,70,80),sc=RR(R,1,1.15);var P=function(p){return [cx+p[0]*sc,cy+p[1]*sc];};
  var out=curve([[0,-40],[14,-46],[22,-40],[18,-30],[10,-26],[14,-12],[20,4],[18,24],[8,38],[0,46],[2,58],[12,64],[16,56],[10,54]].map(P),6);
  var inn=curve([[0,-40],[-4,-30],[-6,-16],[-10,0],[-12,16],[-8,32],[-4,44],[-8,56],[2,70],[16,68],[22,56]].map(P),6);s.push(out);s.push(inn);
  var snout=[P([14,-46]),P([38,-48]),P([40,-42]),P([20,-38])];s.push(snout);eye(s,P([10,-38])[0],P([10,-38])[1],2.4);
  for(var k=0;k<14;k++){var t=k/14,a=out[Math.floor(t*(out.length-1))],b=inn[Math.floor(t*(inn.length-1))];s.push([a,b]);}
  var fin=[P([-8,0]),P([-22,-6]),P([-24,6]),P([-10,12])];F(s,fin,1.4,90);s.push([P([0,-40]),P([-4,-50]),P([4,-48]),P([6,-52]),P([10,-44])]);
  skyFill(s,bed[0][1],5,RR(R,4.2,5));return s;}},

{name:'Hedgehog',titles:['Autumn Forager','Prickly Wanderer','Under the Hedge','Leaf Litter'],build(R){var s=[],g=RR(R,158,166);
  ground(s,R,g,RR(R,3.4,4));var cx=RR(R,130,160),cy=g-4;var dome=arc(cx,cy,70,52,PI,TAU);s.push(dome.concat([[cx+70,cy]]));
  var n=RI(R,70,90),r2=rng(7);for(var k=0;k<n;k++){var t=k/n,a=PI+t*PI;var rr=RR(R,0.5,0.98);var bx=cx+70*rr*Math.cos(a),by=cy+52*rr*Math.sin(a),L=RR(R,10,16),aa=a+RR(R,-0.25,0.25);s.push([[bx,by],[bx+L*Math.cos(aa),by+L*Math.sin(aa)]]);}
  var face=blob([[cx+56,cy-30],[cx+80,cy-26],[cx+100,cy-10],[cx+104,cy-4],[cx+90,cy],[cx+60,cy]],6);s.push(poly(face));eye(s,cx+82,cy-18,2.6);s.push(circle(cx+104,cy-6,3));s.push(arc(cx+70,cy-30,6,5,PI,TAU));
  s.push([[cx-40,cy],[cx-42,cy+4]]);s.push([[cx+40,cy],[cx+42,cy+4]]);
  for(var l=0;l<RI(R,4,6);l++){var lx=RR(R,10,290);if(Math.abs(lx-cx)<90)continue;var ly=g+RR(R,8,30),la=RR(R,0,PI);var lf=[[lx-10*Math.cos(la),ly-10*Math.sin(la)]].concat(quad([lx-10*Math.cos(la),ly-10*Math.sin(la)],[lx+4,ly-8],[lx+10*Math.cos(la),ly+10*Math.sin(la)])).concat(quad([lx+10*Math.cos(la),ly+10*Math.sin(la)],[lx-4,ly+8],[lx-10*Math.cos(la),ly-10*Math.sin(la)]));s.push(lf);}
  treeR(s,R,RR(R,20,40),g,RR(R,16,20),2.4);
  skyFill(s,g,7,RR(R,4,5),5,[dome.concat([[cx+70,cy]]),face]);return s;}},

{name:'Rabbit in clover',titles:['Ears Up','Dusk Meadow','Clover Supper','Quiet Watch'],build(R){var s=[],g=RR(R,160,166);
  ground(s,R,g,RR(R,3.4,4));var cx=RR(R,120,150),cy=g-30;
  var body=blob([[cx-46,cy+28],[cx-56,cy],[cx-40,cy-26],[cx,cy-30],[cx+24,cy-16],[cx+30,cy+10],[cx+20,cy+28]],8);s.push(poly(body));
  var head=blob([[cx+18,cy-24],[cx+30,cy-44],[cx+56,cy-42],[cx+64,cy-28],[cx+48,cy-16],[cx+26,cy-12]],6);s.push(poly(head));eye(s,cx+46,cy-32,3);s.push(circle(cx+63,cy-30,1.6));
  var e1=blob([[cx+30,cy-42],[cx+20,cy-80],[cx+28,cy-92],[cx+38,cy-80],[cx+38,cy-44]],6),e2=blob([[cx+38,cy-44],[cx+38,cy-84],[cx+48,cy-94],[cx+54,cy-80],[cx+46,cy-44]],6);s.push(poly(e1));s.push(poly(e2));H(s,e1,1.6,90);
  s.push(circle(cx-56,cy+6,8));s.push(quad([cx+14,cy+28],[cx+30,cy+30],[cx+40,cy+30]));s.push([[cx+60,cy-26],[cx+76,cy-30]]);s.push([[cx+60,cy-24],[cx+76,cy-20]]);
  HX(s,[body,EP(cx-10,cy-6,22,14)],2.2,RR(R,30,50));
  for(var c=0;c<RI(R,6,9);c++){var kx=RR(R,10,290),ky=g+RR(R,0,4);if(Math.abs(kx-cx)<70)continue;s.push([[kx,ky],[kx,ky-12]]);for(var q=0;q<3;q++){var a=-PI/2+(q-1)*1.1;s.push(circle(kx+5*Math.cos(a),ky-12+5*Math.sin(a),3.2));}}
  skyFill(s,g,7,RR(R,4,5),5,[body,head,e1,e2]);return s;}},

{name:'Cat on a windowsill',titles:['Watching the Rain','Sill Sentinel','Afternoon Sun','Bird Television'],build(R){var s=[],sill=RR(R,150,158);
  var wx0=RR(R,40,60),wx1=wx0+200,wy0=24;var frame=[[wx0,sill],[wx0,wy0],[wx1,wy0],[wx1,sill]];s.push(frame);s.push(rect(wx0-10,sill,wx1+10,sill+8));H(s,[[wx0-10,sill],[wx1+10,sill],[wx1+10,sill+8],[wx0-10,sill+8]],1.6,0);
  s.push([[(wx0+wx1)/2,wy0],[(wx0+wx1)/2,sill]]);s.push([[wx0,(wy0+sill)/2],[wx1,(wy0+sill)/2]]);
  var cx=RR(R,wx0+60,wx1-60),b=sill;var body=blob([[cx-36,b],[cx-40,b-30],[cx-24,b-58],[cx,b-64],[cx+18,b-50],[cx+24,b-20],[cx+20,b]],8);s.push(poly(body));
  var head=blob([[cx-16,b-60],[cx-20,b-80],[cx-14,b-96],[cx-4,b-88],[cx+6,b-90],[cx+16,b-98],[cx+18,b-82],[cx+14,b-64]],5);s.push(poly(head));
  var tail=curve([[cx+18,b-4],[cx+44,b-6],[cx+56,b-20],[cx+50,b-36]],8);s.push(tail);s.push(curve([[cx+20,b-8],[cx+40,b-10],[cx+50,b-22],[cx+46,b-34]],8));
  HX(s,[body],RR(R,2,2.6),RR(R,60,80));HX(s,[head,EP(cx-6,b-78,4,3),EP(cx+8,b-78,4,3)],1.8,0);s.push(ellipse(cx-6,b-78,4,3));s.push(ellipse(cx+8,b-78,4,3));
  var c1=[[4,4],[wx0+18,4],[wx0+10,sill-20],[4,sill]],c2=[[296,4],[wx1-18,4],[wx1-10,sill-20],[296,sill]];s.push(poly(c1));s.push(poly(c2));H(s,c1,6,90);H(s,c2,6,90);s.push([[4,8],[296,8]]);
  var wallp=[[4,sill+8],[296,sill+8],[296,196],[4,196]];s.push(rows(4,296,sill+14,194,RR(R,5,7)));
  var ty=RR(R,70,100);var tree=[];for(var t=0;t<5;t++){}HX(s,[[[wx0,wy0],[wx1,wy0],[wx1,sill],[wx0,sill]],body,head,[[cx+14,b],[cx+14,b-40],[cx+60,b-40],[cx+60,b]]],RR(R,5,6),RR(R,30,50));
  return s;}},

{name:'Elephant at the waterhole',titles:['Matriarch','Dust and Thunder','Long Memory','Evening Drink'],build(R){var s=[],g=RR(R,166,172);
  ground(s,R,g,RR(R,3.6,4.2));var cx=RR(R,120,150),top=g-108;
  var body=blob([[cx-70,g-40],[cx-74,top+30],[cx-40,top+6],[cx+20,top+4],[cx+50,top+20],[cx+56,g-50],[cx+40,g-40]],8);
  var legs=[[cx-62,g-40,cx-44],[cx-34,g-40,cx-16],[cx+16,g-40,cx+34],[cx+38,g-46,cx+54]];legs.forEach(function(l){s.push([[l[0],l[1]],[l[0]+1,g],[l[2]-1,g],[l[2],l[1]]]);s.push(arc((l[0]+l[2])/2,g,(l[2]-l[0])/2,2,PI,TAU));});
  s.push(poly(body));var head=blob([[cx+36,top+20],[cx+56,top-2],[cx+86,top+4],[cx+92,top+30],[cx+84,top+52],[cx+60,top+60]],6);s.push(poly(head));
  var trunk=curve([[cx+86,top+44],[cx+94,top+70],[cx+96,g-30],[cx+104,g-14],[cx+112,g-18]],6),trunk2=curve([[cx+76,top+54],[cx+84,top+74],[cx+84,g-28],[cx+96,g-8],[cx+112,g-10]],6);s.push(trunk);s.push(trunk2);for(var k=0;k<8;k++){var a=trunk[4+k*3],b=trunk2[4+k*3];if(a&&b)s.push([a,b]);}
  var ear=blob([[cx+40,top+10],[cx+20,top+14],[cx+12,top+44],[cx+26,top+70],[cx+50,top+60],[cx+56,top+30]],6);s.push(poly(ear));H(s,ear,2,70);eye(s,cx+74,top+24,2.4);s.push([[cx+86,top+50],[cx+104,top+56],[cx+90,top+48]]);
  HX(s,[body,ear],RR(R,2.6,3.2),RR(R,-20,-40));s.push(curve([[cx-70,top+40],[cx-80,top+60],[cx-78,top+74]],6));
  var wh=[];var wx=RR(R,200,240);s.push(ellipse(wx+30,g+16,40,6));H(s,EP(wx+30,g+16,40,6),2,0);
  treeR(s,R,RR(R,20,40),g,RR(R,16,20),2.6);
  skyFill(s,g,7,RR(R,4,5),5,[body,head,ear]);return s;}},

{name:'Giraffe and acacia',titles:['Browsing the Crown','Tallest on the Plain','Patchwork Neck','Savanna Noon'],build(R){var s=[],g=RR(R,170,176);
  ground(s,R,g,RR(R,3.6,4.2));var ax=RR(R,200,240);s.push([[ax-3,g],[ax-3,g-60],[ax-30,g-90]]);s.push([[ax+3,g],[ax+3,g-60],[ax+30,g-92]]);s.push([[ax,g-60],[ax+6,g-96]]);
  var cr=blob([[ax-70,g-92],[ax-30,g-114],[ax+20,g-118],[ax+70,g-104],[ax+60,g-90],[ax-60,g-86]],8);s.push(poly(cr));H(s,cr,2.2,0);
  var bx=RR(R,80,110),by=g-62;var body=blob([[bx-40,by+10],[bx-44,by-12],[bx-20,by-24],[bx+30,by-26],[bx+44,by-14],[bx+40,by+12]],8);s.push(poly(body));
  [[bx-34,-1],[bx-22,1],[bx+26,-1],[bx+36,1]].forEach(function(l){s.push([[l[0],by+8],[l[0]+l[1]*3,g-2],[l[0]+l[1]*3+4,g],[l[0]+5,by+8]]);});
  var nk=[[bx+30,by-24],[bx+60,by-90],[bx+68,by-96],[bx+46,by-6]];s.push(nk);var hd=blob([[bx+58,by-94],[bx+66,by-106],[bx+94,by-104],[bx+96,by-96],[bx+70,by-88]],6);s.push(poly(hd));
  s.push([[bx+66,by-104],[bx+64,by-114]]);s.push([[bx+72,by-104],[bx+72,by-114]]);eye(s,bx+76,by-100,1.8);s.push([[bx-42,by-10],[bx-52,by+24]]);
  var sp=rng(hashStr('g')+Math.floor(bx));for(var k=0;k<14;k++){var px=bx-32+RR(R,0,70),py=by-16+RR(R,0,24);var spt=EP(px,py,5,4);if(pip([px,py],body)){s.push(poly(spt));H(s,spt,1.4,0);}}
  for(var j=0;j<5;j++){var t=0.15+j*0.16,px2=bx+30+(30)*t+8,py2=by-24-66*t;s.push(poly(EP(px2,py2,4,4)));}
  skyFill(s,g,7,RR(R,4,5),5,[body,hd,[[bx+30,by-24],[bx+60,by-90],[bx+68,by-96],[bx+46,by-6]],cr]);return s;}},

{name:'Fox in the snow',titles:['Listening for Mice','First Snowfall','Red Against White','Winter Hunter'],build(R){var s=[],g=RR(R,150,158);
  var sn=[];for(var x=4;x<=296;x+=4)sn.push([x,g+3*Math.sin(x/37)]);s.push(sn);for(var y=g+12;y<196;y+=10)s.push(wave(4,296,y,1.5,50,R()*6));
  [RR(R,20,50),RR(R,240,280)].forEach(function(px){pineT(s,px,g,RR(R,1.1,1.5),0);var P=pine(px,g,1.3);});
  var cx=RR(R,120,160),cy=g-34;var body=blob([[cx-40,cy+20],[cx-46,cy-4],[cx-20,cy-16],[cx+24,cy-16],[cx+40,cy-4],[cx+36,cy+18]],8);s.push(poly(body));
  var head=blob([[cx+30,cy-14],[cx+40,cy-30],[cx+52,cy-28],[cx+76,cy-18],[cx+56,cy-8],[cx+38,cy]],6);s.push(poly(head));s.push([[cx+40,cy-28],[cx+42,cy-46],[cx+50,cy-30]]);s.push([[cx+48,cy-28],[cx+56,cy-44],[cx+58,cy-26]]);eye(s,cx+54,cy-20,2);
  var tail=blob([[cx-40,cy+2],[cx-70,cy-10],[cx-98,cy+4],[cx-100,cy+18],[cx-76,cy+18],[cx-44,cy+14]],6);s.push(poly(tail));H(s,blob([[cx-80,cy+2],[cx-98,cy+6],[cx-98,cy+16],[cx-80,cy+14]],4),1.4,0);
  [[cx-30,1],[cx-18,-1],[cx+20,1],[cx+30,-1]].forEach(function(l){s.push([[l[0],cy+16],[l[0]+l[1]*4,g-2],[l[0]+l[1]*4+5,g-2]]);});
  HX(s,[body,head,tail],RR(R,2.2,2.8),RR(R,30,50));
  for(var f=0;f<RI(R,30,44);f++){var fx=RR(R,6,294),fy=RR(R,8,g-10);}
  skyFill(s,g,6,RR(R,3.6,4.4),5,[body,head,tail]);return s;}},

{name:'Frog on a lily pad',titles:['Pond King','Waiting for Flies','Green Throne','Croak at Dusk'],build(R){var s=[],w=RR(R,90,100);
  s.push([[4,w],[296,w]]);s.push(waterS(R,4,296,w+6,194,6,1.2));
  var bk=[];for(var x=4;x<=296;x+=4)bk.push([x,w-14-6*Math.sin(x/30)]);s.push(bk);H(s,bk.concat([[296,w],[4,w]]),2.8,0);
  for(var r=0;r<RI(R,8,12);r++){var rx=RR(R,6,294),rb=interpY(bk,rx),rh=RR(R,20,46);s.push([[rx,rb],[rx+RR(R,-4,4),rb-rh]]);if(R()<0.5){s.push(ellipse(rx,rb-rh+6,2.5,7));}}
  var px=RR(R,120,170),py=RR(R,150,158);var pad=arc(px,py,70,18,0.25,TAU-0.05).concat([[px,py]]);s.push(poly(pad));for(var v=0;v<7;v++){var a=0.5+v*0.85;s.push([[px,py],[px+60*Math.cos(a),py+15*Math.sin(a)]]);}
  var cx=px-6,cy=py-14;var body=blob([[cx-30,cy+8],[cx-26,cy-14],[cx-8,cy-26],[cx+20,cy-24],[cx+34,cy-8],[cx+30,cy+10]],8);s.push(poly(body));
  eye(s,cx+4,cy-30,6);eye(s,cx+22,cy-28,6);s.push(arc(cx+16,cy-10,16,6,0.2,PI*0.9));
  s.push([[cx-26,cy+6],[cx-46,cy+12],[cx-30,cy+14],[cx-50,cy+18]]);s.push([[cx+24,cy+6],[cx+36,cy+16],[cx+46,cy+14],[cx+40,cy+20]]);
  HX(s,[body,EP(cx+10,cy-4,12,8)],2,RR(R,20,40));
  for(var p2=0;p2<2;p2++){var qx=p2?RR(R,30,70):RR(R,230,270),qy=RR(R,120,180);s.push(poly(arc(qx,qy,26,7,0.3,TAU-0.1).concat([[qx,qy]])));}
  var fx=px+48,fy=py-4;s.push([[fx,fy],[fx+4,fy-20]]);for(var k=0;k<6;k++){var a2=-PI+k*PI/5;s.push([[fx+4,fy-20],[fx+4+12*Math.cos(a2),fy-20+10*Math.sin(a2)],[fx+4+6*Math.cos(a2+0.3),fy-20+5*Math.sin(a2+0.3)]]);}
  skyFill(s,w-14,7,RR(R,4,5));return s;}},

{name:'Ducks on a pond',titles:['Mallard Morning','Paddling Pair','Reeds and Ripples','Pond Life'],build(R){var s=[],w=RR(R,96,106);
  s.push([[4,w],[296,w]]);var bk=hills([],R,w,RR(R,10,18),0);s.push(bk);H(s,bk.concat([[296,w],[4,w]]),3,0);
  var ducks=[[RR(R,70,100),RR(R,140,150),1],[RR(R,180,220),RR(R,160,170),0.85]];var holes=[];
  ducks.forEach(function(d){var x=d[0],y=d[1],k=d[2];var bd=blob([[x-34*k,y],[x-30*k,y-14*k],[x,y-18*k],[x+22*k,y-12*k],[x+30*k,y-2*k],[x+20*k,y+6*k],[x-24*k,y+6*k]],8);s.push(poly(bd));holes.push(bd);
    var nk=blob([[x+14*k,y-14*k],[x+16*k,y-30*k],[x+22*k,y-42*k],[x+34*k,y-40*k],[x+30*k,y-26*k],[x+24*k,y-12*k]],6);s.push(poly(nk));holes.push(nk);
    var bill=[[x+32*k,y-38*k],[x+46*k,y-34*k],[x+32*k,y-32*k]];F(s,bill,0.9,0);eye(s,x+26*k,y-36*k,1.8);
    var wg=blob([[x-20*k,y-8*k],[x,y-14*k],[x+16*k,y-6*k],[x-10*k,y-2*k]],6);s.push(poly(wg));H(s,wg,1.4,20);H(s,EP(x+22*k,y-34*k,7*k,6*k),1.2,0);
    for(var r=1;r<=3;r++)s.push(arc(x,y+6*k,30*k+r*10,4+r*2,0.15,PI-0.15));});
  var wr=[waterS(R,4,296,w+6,194,6,1.2)];behind(s,wr,holes.concat(ducks.map(function(d){return EP(d[0],d[1]+10,70,14);})));
  for(var r2=0;r2<RI(R,10,14);r2++){var rx=RR(R,4,60)+(r2%2)*RR(R,230,236);var rb=w;s.push(curve([[rx,rb+8],[rx+2,rb-20],[rx+RR(R,-6,6),rb-RR(R,40,60)]],6));if(R()<0.4)s.push(ellipse(rx+1,rb-28,2.5,8));}
  skyFill(s,w-10,7,RR(R,4,5));return s;}},

{name:'Rooster on a fence',titles:['Wake-Up Call','Barnyard Herald','Crowing at Five','The Comb and the Spur'],build(R){var s=[],g=RR(R,168,174);
  ground(s,R,g,RR(R,3.4,4));var fy=g-60;s.push([[4,fy],[296,fy]]);s.push([[4,fy+18],[296,fy+18]]);for(var x=10;x<296;x+=36){s.push(rect(x,fy-10,x+8,g));}H(s,[[4,fy],[296,fy],[296,fy+6],[4,fy+6]],1.6,0);
  var cx=RR(R,130,160),cy=fy-32;var body=blob([[cx-26,cy+10],[cx-30,cy-10],[cx-10,cy-24],[cx+14,cy-30],[cx+26,cy-14],[cx+20,cy+16],[cx,cy+24]],8);s.push(poly(body));
  var head=blob([[cx+14,cy-32],[cx+16,cy-50],[cx+28,cy-56],[cx+36,cy-48],[cx+30,cy-30]],6);s.push(poly(head));s.push([[cx+34,cy-48],[cx+46,cy-44],[cx+34,cy-42]]);eye(s,cx+28,cy-48,1.8);
  s.push([[cx+16,cy-54],[cx+18,cy-64],[cx+22,cy-58],[cx+26,cy-68],[cx+28,cy-58],[cx+34,cy-64],[cx+32,cy-52]]);s.push(blob([[cx+30,cy-40],[cx+36,cy-38],[cx+32,cy-30]],4));
  for(var t=0;t<6;t++){var a=-PI*0.9+t*0.2;s.push(curve([[cx-26,cy-6],[cx-40+Math.cos(a)*10,cy-30+Math.sin(a)*10],[cx-56+Math.cos(a)*24,cy-20+Math.sin(a)*30]],8));}
  var wg=blob([[cx-16,cy-6],[cx+6,cy-14],[cx+16,cy],[cx-6,cy+10]],6);s.push(poly(wg));H(s,wg,1.4,30);HX(s,[body,wg],2.4,-40);
  s.push([[cx-4,cy+22],[cx-6,fy]]);s.push([[cx+6,cy+22],[cx+8,fy]]);s.push([[cx-12,fy],[cx,fy]]);s.push([[cx+2,fy],[cx+14,fy]]);
  skyFill(s,g,7,RR(R,4,5),5,[body,head]);return s;}},

{name:'Penguins on the ice',titles:['Huddle','Black Tie Gathering','Antarctic Noon','Three on a Floe'],build(R){var s=[],w=RR(R,150,158);
  var floe=[[20,w-14],[60,w-22],[150,w-24],[250,w-20],[284,w-12],[270,w],[30,w]];s.push(poly(floe));H(s,[[20,w-14],[30,w],[270,w],[284,w-12]],2,0);
  s.push([[4,w],[296,w]]);s.push(waterS(R,4,296,w+6,194,5,1.4));var ice=[[4,80],[40,60],[60,70],[100,50],[130,64],[170,40],[200,58],[240,46],[296,66]];s.push(ice.map(function(p){return [p[0],p[1]+RR(R,-5,5)];}));
  var n=3,holes=[];for(var i=0;i<n;i++){var px=90+i*RR(R,50,60),b=w-22,h=RR(R,58,70)*(i===1?1.1:0.9),f=i===2?-1:1;
    var bd=blob([[px-14,b],[px-18,b-h*0.4],[px-12,b-h*0.8],[px,b-h],[px+12,b-h*0.85],[px+16,b-h*0.4],[px+14,b]],8);s.push(poly(bd));holes.push(bd);
    var bel=blob([[px-8*f,b-2],[px-10*f,b-h*0.4],[px-4*f,b-h*0.72],[px+6*f,b-h*0.7],[px+10*f,b-h*0.3],[px+6*f,b-2]],6);s.push(poly(bel));
    HX(s,[bd,bel],1.6,0);s.push([[px+10*f,b-h*0.9],[px+20*f,b-h*0.86],[px+10*f,b-h*0.82]]);s.push(circle(px+5*f,b-h*0.9,1.6));
    s.push([[px-8,b],[px-12,b+2],[px-2,b+2]]);s.push([[px+4,b],[px+2,b+2],[px+12,b+2]]);s.push(curve([[px+14*f,b-h*0.6],[px+20*f,b-h*0.4],[px+18*f,b-h*0.2]],6));}
  skyFill(s,w,7,RR(R,4,5),5,holes);return s;}},

{name:'Flamingo',titles:['One-Legged Rest','Pink Lagoon','Salt Flat Dancer','Balanced'],build(R){var s=[],w=RR(R,150,158);
  s.push([[4,w],[296,w]]);var cx=RR(R,130,160),by=RR(R,80,90);
  var body=blob([[cx-40,by+4],[cx-30,by-14],[cx,by-20],[cx+26,by-12],[cx+30,by+4],[cx+10,by+16],[cx-24,by+16]],8);s.push(poly(body));
  var neck=curve([[cx+24,by-8],[cx+34,by-40],[cx+20,by-66],[cx+28,by-86],[cx+44,by-90]],8),neck2=curve([[cx+30,by+0],[cx+42,by-40],[cx+28,by-66],[cx+34,by-80],[cx+44,by-82]],8);s.push(neck);s.push(neck2);
  var hd=blob([[cx+40,by-92],[cx+52,by-94],[cx+58,by-88],[cx+50,by-80],[cx+40,by-82]],5);s.push(poly(hd));eye(s,cx+48,by-89,1.4);s.push([[cx+56,by-90],[cx+66,by-82],[cx+64,by-72],[cx+58,by-80]]);H(s,[[cx+60,by-86],[cx+66,by-82],[cx+64,by-74]],0.9,0);
  H(s,blob([[cx-30,by-4],[cx,by-14],[cx+20,by-6],[cx,by+8]],6),1.6,30);HX(s,[body],2.4,-30);
  s.push([[cx,by+16],[cx+2,by+50],[cx,w+4]]);s.push([[cx+4,by+16],[cx+6,by+50],[cx+4,w+4]]);s.push([[cx+2,by+50],[cx-18,by+40],[cx-34,by+50]]);
  for(var r=1;r<=4;r++)s.push(arc(cx+2,w+6,10+r*12,2+r*1.6,0,PI));var wr=[waterS(R,4,296,w+6,194,5,1.2)];behind(s,wr,[EP(cx+2,w+8,62,10)]);
  var hl=hills([],R,w,RR(R,10,20),0);s.push(hl);for(var p=0;p<RI(R,2,4);p++){var px=RR(R,20,280);if(Math.abs(px-cx)<70)continue;var b=interpY(hl,px);s.push([[px,b],[px+2,b-40]]);for(var k=0;k<5;k++){var a=-PI/2+(k-2)*0.6;s.push(quad([px+2,b-40],[px+2+14*Math.cos(a),b-46+Math.sin(a)*8],[px+2+24*Math.cos(a),b-38+Math.sin(a)*18]));}}
  skyFill(s,w,7,RR(R,4,5),5,[body,hd]);return s;}},

{name:'Swan on a lake',titles:['Glide','White on Still Water','The Curve of the Neck','Morning Mist'],build(R){var s=[],w=RR(R,104,112);
  s.push([[4,w],[296,w]]);var tr=[];for(var x=4;x<=296;x+=4)tr.push([x,w-10-8*Math.abs(Math.sin(x/26))-6*Math.sin(x/9)]);s.push(tr);H(s,tr.concat([[296,w],[4,w]]),2.6,0);
  var cx=RR(R,120,160),by=RR(R,150,158);var body=blob([[cx-60,by-10],[cx-40,by-34],[cx-6,by-36],[cx+20,by-24],[cx+30,by-4],[cx+10,by+4],[cx-40,by+4]],8);s.push(poly(body));
  for(var f=0;f<5;f++)s.push(curve([[cx-50+f*12,by-20],[cx-40+f*12,by-30],[cx-26+f*12,by-26]],5));
  var neck=curve([[cx+20,by-24],[cx+34,by-56],[cx+20,by-84],[cx+32,by-98],[cx+46,by-94]],8),neck2=curve([[cx+28,by-14],[cx+44,by-56],[cx+30,by-82],[cx+36,by-90],[cx+46,by-88]],8);s.push(neck);s.push(neck2);
  s.push([[cx+46,by-96],[cx+60,by-88],[cx+46,by-86]]);eye(s,cx+40,by-93,1.4);
  var ref=[];for(var r=0;r<9;r++){var yy=by+8+r*4,hw=60-r*5;ref.push([cx-30-hw*0.5,yy],[cx-30+hw,yy]);}s.push(ref);
  var wr=[waterS(R,4,296,w+6,194,5,1.1)];behind(s,wr,[EP(cx-10,by+8,90,26),body]);
  skyFill(s,w-10,7,RR(R,4,5));return s;}},

{name:'Pelican on a piling',titles:['Harbor Watchman','Pouch and Patience','Pier End','Waiting for Scraps'],build(R){var s=[],w=RR(R,150,158);
  s.push([[4,w],[296,w]]);s.push(waterS(R,4,296,w+6,194,5,1.5));var px=RR(R,120,160),pt=w-60;
  var pil=[[px-14,w+12],[px-14,pt],[px+14,pt],[px+14,w+12]];s.push(pil);s.push(ellipse(px,pt,14,4));HX(s,[pil],1.8,90);for(var k=0;k<3;k++)s.push([[px-14,w-10-k*14],[px+14,w-14-k*14]]);
  var by=pt-30;var body=blob([[px-30,pt-4],[px-34,by],[px-16,by-14],[px+10,by-12],[px+20,by+6],[px+14,pt-2]],8);s.push(poly(body));
  var neck=curve([[px+8,by-10],[px+14,by-30],[px+8,by-44],[px+14,by-54]],6);s.push(neck);s.push(curve([[px+16,by],[px+22,by-28],[px+18,by-42],[px+22,by-50]],6));
  var hd=blob([[px+8,by-52],[px+16,by-60],[px+26,by-56],[px+24,by-48]],4);s.push(poly(hd));eye(s,px+18,by-54,1.4);
  s.push([[px+24,by-54],[px+74,by-40],[px+24,by-48]]);var pouch=[[px+26,by-48]].concat(quad([px+26,by-48],[px+44,by-24],[px+70,by-40]));s.push(pouch);H(s,pouch.concat([[px+70,by-40]]),1.3,0);
  var wg=blob([[px-26,by-4],[px,by-8],[px+12,by+4],[px-30,pt-8]],6);s.push(poly(wg));H(s,wg,1.6,40);s.push([[px-30,pt-8],[px-46,pt+2]]);
  s.push([[px-6,pt-4],[px-6,pt]]);s.push([[px+4,pt-4],[px+4,pt]]);
  var dk=[[4,w-30],[px-40,w-30]];s.push(dk);s.push(rect(4,w-34,px-40,w-30));for(var q=10;q<px-40;q+=18)s.push([[q,w-30],[q,w+10]]);
  skyFill(s,w,7,RR(R,4,5),5,[body,hd,pil]);return s;}},

{name:'Hummingbird at a flower',titles:['Hover','Nectar Stop','Wings Like Smoke','Garden Jewel'],build(R){var s=[],g=RR(R,176,182);
  ground(s,R,g,3.6);var fx=RR(R,180,220);var st=curve([[fx,g],[fx-6,g-50],[fx+4,g-100],[fx-4,g-130]],8);s.push(st);
  [[g-60,1],[g-90,-1],[g-118,1]].forEach(function(l){var y=l[0],d=l[1];var lf=[[fx,y]].concat(quad([fx,y],[fx+d*20,y-14],[fx+d*40,y-4])).concat(quad([fx+d*40,y-4],[fx+d*20,y+6],[fx,y]));s.push(lf);H(s,lf,1.6,30*d);});
  var fl=[[fx-4,g-130],[fx-14,g-142],[fx-30,g-150],[fx-26,g-140],[fx-34,g-134],[fx-14,g-134],[fx-4,g-130]];s.push(fl);H(s,fl.slice(0,-1),1.4,60);
  var fl2=[[fx+2,g-100],[fx+16,g-118],[fx+30,g-124],[fx+26,g-112],[fx+34,g-108],[fx+14,g-104],[fx+2,g-100]];s.push(fl2);
  var bx=fx-66,by=g-128;var body=blob([[bx-20,by+10],[bx-10,by-4],[bx+10,by-6],[bx+20,by],[bx+10,by+8],[bx-6,by+12]],6);s.push(poly(body));
  s.push([[bx+18,by-2],[fx-32,g-140]]);eye(s,bx+12,by-2,1.4);var tl=[[bx-20,by+10],[bx-36,by+22],[bx-30,by+12],[bx-38,by+16],[bx-20,by+6]];s.push(tl);
  var w1=blob([[bx-4,by-2],[bx-20,by-30],[bx-14,by-40],[bx+4,by-10]],5);s.push(poly(w1));H(s,w1,1.4,70);var w2=blob([[bx-2,by],[bx+10,by-30],[bx+20,by-36],[bx+8,by-4]],5);s.push(poly(w2));
  HX(s,[body],1.4,0);for(var q=0;q<RI(R,2,4);q++){var qx=RR(R,20,120);var c=curve([[qx,g],[qx+4,g-40],[qx-2,g-70]],6);s.push(c);s.push(scallop(qx-2,g-76,8,7,6,0.3));s.push(circle(qx-2,g-76,3));}
  skyFill(s,g,7,RR(R,4,5),5,[body,w1,w2]);return s;}},

{name:'Butterfly on a thistle',titles:['Painted Lady','Rest Between Flights','Purple Crown','Midsummer Visitor'],build(R){var s=[],g=RR(R,176,182);
  ground(s,R,g,3.6);var tx=RR(R,130,170),top=g-82;s.push(curve([[tx,g],[tx-4,g-50],[tx,top]],8));
  for(var l=0;l<3;l++){var y=g-24-l*24,d=l%2?1:-1;var lf=[[tx,y],[tx+d*12,y-10],[tx+d*16,y-4],[tx+d*26,y-14],[tx+d*28,y-6],[tx+d*40,y-12],[tx+d*30,y+2],[tx,y]];s.push(lf);}
  var bulb=EP(tx,top+8,12,12);s.push(poly(bulb));H(s,bulb,1.6,45);H(s,bulb,1.6,-45);for(var k=0;k<13;k++){var a=-PI+k*PI/12;s.push([[tx+10*Math.cos(a),top+2+6*Math.sin(a)],[tx+22*Math.cos(a),top-4+18*Math.sin(a)]]);}
  var bx=tx,by=top-30;s.push([[bx,by-14],[bx,by+14]]);s.push(ellipse(bx,by,2.4,14));s.push([[bx,by-14],[bx-8,by-26]]);s.push([[bx,by-14],[bx+8,by-26]]);s.push([[bx,by+14],[bx,top-12]]);
  [-1,1].forEach(function(d){var up=blob([[bx,by-6],[bx+d*20,by-34],[bx+d*48,by-40],[bx+d*52,by-20],[bx+d*30,by+2]],6),lo=blob([[bx,by+2],[bx+d*30,by+6],[bx+d*40,by+24],[bx+d*24,by+34],[bx+d*6,by+16]],6);s.push(poly(up));s.push(poly(lo));
    var sp1=EP(bx+d*36,by-24,6,5),sp2=EP(bx+d*24,by+20,5,5);s.push(poly(sp1));s.push(poly(sp2));HX(s,[up,sp1],1.8,30*d);HX(s,[lo,sp2],2.4,-30*d);});
  for(var q=0;q<RI(R,3,5);q++){var qx=RR(R,10,290);if(Math.abs(qx-tx)<70)continue;s.push(curve([[qx,g],[qx+2,g-30],[qx-2,g-RR(R,40,60)]],6));}
  skyFill(s,g,7,RR(R,4,5),5,[EP(bx,by,56,44)]);return s;}},

{name:'Dragonfly on a reed',titles:['Four Glass Wings','Pond Edge, Noon','Needle and Thread','Resting Hunter'],build(R){var s=[],w=RR(R,150,158);
  s.push([[4,w],[296,w]]);s.push(waterS(R,4,296,w+6,194,5,1.2));var rx=RR(R,130,170);
  for(var r=0;r<RI(R,10,14);r++){var x=RR(R,8,292),h=RR(R,50,110);var c=curve([[x,w+4],[x+2,w-h/2],[x+RR(R,-10,10),w-h]],6);s.push(c);if(R()<0.4){var t=c[Math.floor(c.length*0.7)];s.push(ellipse(t[0],t[1],3,10));}}
  var top=w-96;s.push(curve([[rx,w+4],[rx+4,w-60],[rx-2,top]],8));s.push(curve([[rx+3,w+4],[rx+7,w-60],[rx+1,top]],8));
  var by=top+20,bx=rx;var body=[[bx-6,by],[bx+80,by-4],[bx+82,by],[bx-6,by+3]];s.push(poly(body));for(var k=0;k<8;k++)s.push([[bx+12+k*9,by-3],[bx+12+k*9,by+2]]);
  s.push(circle(bx-10,by+1,5));eye(s,bx-14,by,2.6);
  [[-1,-0.3],[-1,0.3],[1,-0.2],[1,0.25]].forEach(function(wg,i){var ox=bx+4+i%2*10,len=56,ang=-PI/2*(1)+wg[1]+(i<2?-0.6:0.6);var tip=[ox+len*Math.cos(ang),by-2+len*Math.sin(ang)];var wp=blob([[ox,by-2],[ox+(tip[0]-ox)*0.5-6,(by+tip[1])/2],[tip[0],tip[1]],[ox+(tip[0]-ox)*0.5+6,(by+tip[1])/2]],6);s.push(poly(wp));for(var v=1;v<4;v++){var t=v/4;s.push([[ox,by-2],[ox+(tip[0]-ox)*t+(v-2)*3,by-2+(tip[1]-by+2)*t]]);}});
  skyFill(s,w,7,RR(R,4,5));return s;}},

{name:'Ladybug on a leaf',titles:['Seven Spots','Garden Guardian','Red on Green','Small Visitor'],build(R){var s=[],cx=150,cy=RR(R,108,116);
  var lf=[[24,cy+30]].concat(quad([24,cy+30],[110,cy-80],[276,cy-10],30)).concat(quad([276,cy-10],[140,cy+90],[24,cy+30],30));s.push(lf);s.push(curve([[20,cy+34],[120,cy+8],[276,cy-10]],10));
  for(var v=0;v<7;v++){var t=0.12+v*0.12,px=20+256*t,py=interpY(curve([[20,cy+34],[120,cy+8],[276,cy-10]],10),px);s.push([[px,py],[px+24,py-28+v*2]]);s.push([[px,py],[px+20,py+30-v*2]]);}
  s.push([[24,cy+30],[4,cy+48]]);HX(s,[lf],RR(R,4.4,5.2),RR(R,60,80));
  var bx=RR(R,130,170),by=cy-6;var sh=EP(bx,by,30,22);s.push(poly(sh));s.push([[bx+30,by],[bx-30,by]]);var hd=arc(bx+34,by,10,12,-PI/2,PI/2);s.push(hd);
  s.push([[bx+40,by-8],[bx+52,by-18]]);s.push([[bx+40,by+8],[bx+52,by+18]]);
  var spots=[[bx-14,by-10],[bx+6,by-12],[bx-16,by+10],[bx+8,by+12],[bx-2,by]];spots.forEach(function(p){var sp=EP(p[0],p[1],4.5,4);s.push(poly(sp));H(s,sp,1,0);});
  HX(s,[sh].concat(spots.map(function(p){return EP(p[0],p[1],4.5,4);})),2.2,0);
  for(var l=0;l<3;l++){s.push([[bx-10+l*12,by-22],[bx-14+l*12,by-30]]);s.push([[bx-10+l*12,by+22],[bx-14+l*12,by+30]]);}
  var bg=[];for(var y=6;y<196;y+=RR(R,9,12))bg.push([[4,y],[296,y]]);behind(s,bg,[lf.slice(0,-1),[[4,cy+46],[24,cy+28],[28,cy+32],[8,cy+50]]]);
  return s;}},

{name:'Spider web with dew',titles:['Morning Silk','Strung Between Twigs','Dew Lines','Patient Weaver'],build(R){var s=[],cx=RR(R,140,160),cy=RR(R,90,100);
  var br=curve([[4,20],[60,30],[120,24],[180,30],[240,22],[296,30]],6);s.push(br);s.push(curve([[4,24],[60,34],[120,28],[180,34],[240,26],[296,34]],6));
  var tw=curve([[40,196],[50,140],[44,80],[56,30]],6);s.push(tw);s.push(curve([[262,196],[256,140],[266,80],[250,28]],6));
  var anc=[[50,40],[150,30],[248,40],[262,110],[258,170],[150,190],[46,170],[44,100]];var n=RI(R,14,18),spokes=[];
  for(var k=0;k<n;k++){var a=k*TAU/n+R()*0.1;var L=Math.min(110,anc.reduce(function(m,p){return m;},120));var ex=cx+Math.cos(a)*95,ey=cy+Math.sin(a)*80;ex=Math.max(46,Math.min(258,ex));ey=Math.max(30,Math.min(188,ey));spokes.push([ex,ey]);s.push([[cx,cy],[ex,ey]]);}
  var sp=[];for(var t=0;t<=n*16;t++){var k2=t%n,ring=t/n,r=4+ring*5.5;if(r>84)break;var e=spokes[k2],dx=e[0]-cx,dy=e[1]-cy,L2=Math.hypot(dx,dy),f=Math.min(1,r/L2*1.2);sp.push([cx+dx*f,cy+dy*f]);}s.push(sp);
  for(var d=0;d<RI(R,10,16);d++){var i=Math.floor(R()*sp.length);s.push(circle(sp[i][0],sp[i][1]+2,1.6));}
  s.push(ellipse(cx,cy,4,6));for(var l=0;l<4;l++){s.push([[cx,cy],[cx-10,cy-8+l*5],[cx-14,cy-4+l*6]]);s.push([[cx,cy],[cx+10,cy-8+l*5],[cx+14,cy-4+l*6]]);}
  H(s,[[4,20],[296,26],[296,34],[4,28]],1.2,0);for(var lv=0;lv<RI(R,6,9);lv++){var lx=RR(R,10,290),ly=interpY(br,lx);var lf=[[lx,ly]].concat(quad([lx,ly],[lx+8,ly+10],[lx+4,ly+24])).concat(quad([lx+4,ly+24],[lx-6,ly+12],[lx,ly]));s.push(lf);H(s,lf,1.4,70);}
  var tw1=curve([[40,196],[50,140],[44,80],[56,30]],6),tw2=curve([[262,196],[256,140],[266,80],[250,28]],6);H(s,tw1.concat(tw1.map(function(p){return [p[0]+5,p[1]];}).reverse()),1.4,0);H(s,tw2.concat(tw2.map(function(p){return [p[0]+5,p[1]];}).reverse()),1.4,0);
  var bgw=[];A(bgw,hatch([[4,38],[296,38],[296,196],[4,196]],5,RR(R,35,55)));behind(s,bgw,[EP(cx,cy,104,92),tw1.concat(tw1.map(function(p){return [p[0]+6,p[1]];}).reverse()),tw2.concat(tw2.map(function(p){return [p[0]+6,p[1]];}).reverse())]);
  return s;}},

{name:'Lobster on the dock',titles:['Catch of the Morning','Pots Stacked High','Harbor Red','Down East Dock'],build(R){var s=[],d0=RR(R,130,138);
  s.push([[4,d0],[296,d0]]);var dk=[],dd=1;for(var y=d0+6;y<196;y+=7){if(dd>0)dk.push([4,y],[296,y]);else dk.push([296,y],[4,y]);dd=-dd;}s.push(dk);for(var x=20;x<296;x+=40)s.push([[x,d0],[x,196]]);
  var tx=RR(R,200,230);for(var t=0;t<2;t++){var ty=d0-t*30;var tr=[[tx,ty],[tx,ty-30],[tx+70,ty-30],[tx+70,ty]];s.push(poly(tr));s.push(arc(tx+35,ty-30,35,10,PI,TAU));for(var k=1;k<7;k++)s.push([[tx+k*10,ty],[tx+k*10,ty-30]]);s.push([[tx,ty-15],[tx+70,ty-15]]);}
  var bx=RR(R,60,90),by=d0-18;var cara=blob([[bx,by-8],[bx+20,by-14],[bx+44,by-12],[bx+50,by],[bx+44,by+8],[bx,by+6]],6);s.push(poly(cara));H(s,cara,1.6,90);
  var seg=[];for(var k2=0;k2<5;k2++){var sx=bx-k2*12;s.push(poly([[sx,by-8+k2],[sx-12,by-7+k2],[sx-12,by+6-k2*0.5],[sx,by+6]]));}s.push([[bx-60,by-2],[bx-74,by-10],[bx-76,by+8],[bx-60,by+4]]);
  [-1,1].forEach(function(d){var arm=[[bx+48,by+d*4],[bx+64,by+d*14],[bx+76,by+d*10]];s.push(arm);var cl=blob([[bx+74,by+d*6],[bx+92,by+d*2],[bx+116,by+d*8],[bx+104,by+d*18],[bx+80,by+d*18]],6);s.push(poly(cl));H(s,cl,1.6,0);
    s.push([[bx+50,by-12],[bx+90,by-40+(d+1)*6]]);for(var l=0;l<4;l++)s.push([[bx+10+l*9,by+d*6],[bx+4+l*9,by+d*16],[bx+l*9,by+d*18]]);});
  eye(s,bx+50,by-8,1.6);var rp=spiral(tx-20,d0-6,2,12,2.5);s.push(rp);
  var w=[waterS(R,4,296,d0-34,d0-6,5,1.2)];behind(s,w,[[[tx-34,d0],[tx-34,d0-70],[tx+80,d0-70],[tx+80,d0]],[[bx-80,d0],[bx-80,by-20],[bx+120,by-44],[bx+120,d0]]]);s.push([[4,d0-36],[296,d0-36]]);
  skyFill(s,d0-36,7,RR(R,4,5));return s;}},

{name:'Pufferfish',titles:['All Puffed Up','Reef Balloon','Prickly Mood','Wide Eyes, Small Fins'],build(R){var s=[],bed=seabed(s,R,RR(R,174,182),RI(R,2,4));
  for(var c=0;c<RI(R,2,3);c++){var cx2=RR(R,20,280),b=interpY(bed,cx2);var cr=[[cx2,b]];for(var br=0;br<4;br++){var a=-PI/2+(br-1.5)*0.5;s.push(curve([[cx2,b],[cx2+20*Math.cos(a),b-24],[cx2+30*Math.cos(a),b-40-br*4]],6));}}
  var cx=RR(R,130,170),cy=RR(R,90,100),r=RR(R,40,46);var bd=EP(cx,cy,r,r*0.92);s.push(poly(bd));
  for(var k=0;k<36;k++){var a2=k*TAU/36;s.push([[cx+r*Math.cos(a2),cy+r*0.92*Math.sin(a2)],[cx+(r+8)*Math.cos(a2+0.05),cy+(r*0.92+8)*Math.sin(a2+0.05)]]);}
  eye(s,cx+18,cy-14,7);s.push(circle(cx+18,cy-14,10));s.push(ellipse(cx+r-2,cy+8,4,3));
  var tl=[[cx-r,cy],[cx-r-18,cy-14],[cx-r-14,cy],[cx-r-18,cy+14],[cx-r,cy]];s.push(tl);var fn=blob([[cx+4,cy+4],[cx-8,cy+14],[cx-2,cy+22],[cx+8,cy+14]],4);s.push(poly(fn));
  HX(s,[bd,EP(cx+18,cy-14,10,10),EP(cx+2,cy+14,10,10)],2.4,RR(R,20,50));
  for(var sp=0;sp<10;sp++){var px=cx+RR(R,-28,20),py=cy+RR(R,-28,28);if(Math.hypot(px-cx-18,py-cy+14)<14)continue;s.push(circle(px,py,1.6));}
  skyFill(s,bed[0][1],5,RR(R,4.2,5),5,[EP(cx,cy,r+9,r+9)]);return s;}},

{name:'Tortoise in the garden',titles:['Slow Afternoon','Domed and Steady','Hundred-Year Walk','Lettuce Hunter'],build(R){var s=[],g=RR(R,164,170);
  ground(s,R,g,RR(R,3.4,4));var cx=RR(R,130,160),b=g-10;var sh=arc(cx,b,64,56,PI,TAU).concat([[cx+64,b],[cx-64,b]]);s.push(sh);s.push([[cx-68,b],[cx+68,b]]);s.push([[cx-66,b+5],[cx+66,b+5]]);
  var sc=[[cx-14,b-50],[cx+14,b-50],[cx+20,b-28],[cx,b-16],[cx-20,b-28]];s.push(poly(sc));[[-40,-38],[40,-38],[-50,-10],[50,-10],[0,-4]].forEach(function(o){var p=[cx+o[0],b+o[1]];s.push(poly(EP(p[0],p[1],14,10)));});
  HX(s,[sh.slice(0,-1),sc,EP(cx-40,b-38,14,10),EP(cx+40,b-38,14,10),EP(cx-50,b-10,14,10),EP(cx+50,b-10,14,10),EP(cx,b-4,14,10)],2,RR(R,30,60));
  var hd=blob([[cx+60,b-14],[cx+78,b-30],[cx+98,b-28],[cx+102,b-16],[cx+84,b-8]],6);s.push(poly(hd));eye(s,cx+90,b-22,2);s.push([[cx+98,b-14],[cx+90,b-12]]);
  [[cx-44,1],[cx-20,-1],[cx+24,1],[cx+48,-1]].forEach(function(l){var lg=[[l[0]-6,b+5],[l[0]-8,g],[l[0]+8,g],[l[0]+6,b+5]];s.push(lg);for(var t=0;t<3;t++)s.push([[l[0]-6+t*6,g],[l[0]-6+t*6,g+2]]);});
  s.push([[cx-64,b],[cx-74,b+4]]);
  var lx=RR(R,30,60);var let=[[lx,g]];for(var k=0;k<6;k++){var a=-PI+k*PI/5;s.push(quad([lx,g],[lx+14*Math.cos(a)*1.3,g-16],[lx+22*Math.cos(a),g-6+22*Math.sin(a)]));}
  skyFill(s,g,7,RR(R,4,5),5,[sh.slice(0,-1),hd]);return s;}},

{name:'Peacock',titles:['Hundred Eyes','Courtyard Display','Fan of Feathers','Strutting at Noon'],build(R){var s=[],g=RR(R,172,178);
  ground(s,R,g,RR(R,3.4,4));var cx=RR(R,140,160),cy=g-40;var fan=arc(cx,cy,130,110,PI*1.02,PI*1.98).concat([[cx,cy]]);s.push(poly(fan));
  var n=17;for(var k=0;k<n;k++){var a=PI*1.04+k*(PI*0.92)/(n-1);s.push([[cx,cy],[cx+124*Math.cos(a),cy+104*Math.sin(a)]]);
    [0.94,0.7,0.48].forEach(function(f,i){if(i===2&&k%2)return;var ex=cx+124*f*Math.cos(a),ey=cy+104*f*Math.sin(a);var e1=EP(ex,ey,6-i,8-i*1.4);s.push(poly(e1));H(s,EP(ex,ey,3-i*0.4,4-i*0.6),1,0);});}
  var body=blob([[cx-16,cy+10],[cx-20,cy-14],[cx-8,cy-26],[cx+8,cy-24],[cx+16,cy-6],[cx+12,cy+12]],6);s.push(poly(body));
  var nk=curve([[cx+4,cy-24],[cx+8,cy-44],[cx+4,cy-60],[cx+10,cy-70]],6);s.push(nk);s.push(curve([[cx+12,cy-20],[cx+16,cy-44],[cx+12,cy-60],[cx+16,cy-66]],6));
  s.push(poly(EP(cx+12,cy-70,7,6)));eye(s,cx+14,cy-71,1.4);s.push([[cx+18,cy-70],[cx+26,cy-68],[cx+18,cy-66]]);for(var c=0;c<4;c++)s.push([[cx+8+c*2,cy-76],[cx+6+c*3,cy-88],[cx+6+c*3,cy-90]]);
  HX(s,[body],1.6,0);s.push([[cx-6,cy+10],[cx-8,g]]);s.push([[cx+6,cy+10],[cx+8,g]]);s.push([[cx-14,g],[cx-2,g]]);s.push([[cx+2,g],[cx+14,g]]);
  skyFill(s,g,7,RR(R,4.8,5.6),5,[fan,body]);return s;}}
);

SUBJ.push(
{name:'Weeping willow by a pond',titles:['Bowing to the Water','Green Curtain','Still Pond, Late June','Under the Willow'],build(R){var s=[],g=RR(R,140,148);
  ground(s,R,g,RR(R,3.6,4.2));var px=RR(R,170,200);var pond=EP(px,g+28,90,20);s.push(poly(pond));HX(s,[pond],3,0);
  var tx=RR(R,80,110),tb=g+2,top=g-110;s.push([[tx-8,tb],[tx-5,g-50],[tx-14,top+30]]);s.push([[tx+8,tb],[tx+5,g-50],[tx+12,top+30]]);H(s,[[tx-8,tb],[tx-5,g-50],[tx+5,g-50],[tx+8,tb]],1.6,90);
  var crown=arc(tx,top+20,70,30,PI,TAU);s.push(crown);var n=RI(R,26,34);for(var k=0;k<=n;k++){var x=tx-70+k*140/n,y0=top+20-30*Math.sqrt(Math.max(0,1-Math.pow((x-tx)/70,2))),L=RR(R,70,100)*(1-Math.pow((x-tx)/80,2)*0.4);
    var st=[];for(var t=0;t<=8;t++)st.push([x+(x-tx)*0.25*t/8+2*Math.sin(t+k),y0+L*t/8]);s.push(st);for(var lf=2;lf<8;lf+=2){var p=st[lf];s.push([[p[0],p[1]],[p[0]-3,p[1]+4]]);s.push([[p[0],p[1]],[p[0]+3,p[1]+4]]);}}
  for(var r=0;r<4;r++)s.push(wave(px-60+r*8,px+60-r*8,g+22+r*6,0.8,12));
  skyFill(s,g,7,RR(R,4,5),5,[crown.concat([[tx+70,top+20]])]);return s;}},

{name:'Birch grove',titles:['White Trunks','Paper Bark','Autumn Grove','Light Between the Birches'],build(R){var s=[],g=RR(R,168,176);
  ground(s,R,g,RR(R,3.4,4));var n=RI(R,6,8),holes=[];
  for(var i=0;i<n;i++){var x=14+i*(272/(n-1))+RR(R,-8,8),w=RR(R,6,10),lean=RR(R,-8,8),tr=[[x-w/2,g],[x-w/2+lean,6],[x+w/2+lean,6],[x+w/2,g]];s.push(tr);holes.push(tr);
    for(var m=0;m<RI(R,5,8);m++){var my=RR(R,14,g-10),mx=x-w/2+lean*(1-my/g),mw=RR(R,w*0.4,w*0.9);var mk=[[mx,my],[mx+mw,my-1],[mx+mw,my+2.5],[mx,my+2]];s.push(poly(mk));H(s,mk,0.8,0);}
    if(R()<0.7){var by=RR(R,30,90),bx=x+lean*(1-by/g);var d=R()<0.5?-1:1;s.push([[bx+d*w/2,by],[bx+d*26,by-20],[bx+d*36,by-24]]);for(var lf=0;lf<4;lf++){var lx=bx+d*(12+lf*6),ly=by-10-lf*4;s.push(poly(EP(lx,ly+5,2.4,3.4)));}}}
  var bg=[];A(bg,hatch([[4,4],[296,4],[296,g],[4,g]],RR(R,9.5,10.5),RR(R,60,75)));behind(s,bg,holes);
  return s;}},

{name:'Cherry blossom branch',titles:['First Week of April','Petals on the Wind','Pink Lantern Branch','Hanami'],build(R){var s=[];
  var br=curve([[4,RR(R,120,150)],[60,110],[130,96],[200,70],[260,60],[296,48]],8);var br2=br.map(function(p,i){return [p[0],p[1]+6*(1-i/br.length)+1];});s.push(br);s.push(br2);H(s,br.concat(br2.slice().reverse()),1.2,80);
  var holes=[br.concat(br2.slice().reverse())];var tw=[];for(var k=0;k<6;k++){var i=Math.floor((k+0.5)/6*br.length),p=br[i],d=k%2?-1:1;var t=curve([[p[0],p[1]],[p[0]+20,p[1]+d*18],[p[0]+40,p[1]+d*26]],6);s.push(t);tw.push(t);}
  var fl=[];tw.forEach(function(t){fl.push(t[t.length-1],t[Math.floor(t.length/2)]);});for(var j=0;j<6;j++)fl.push(br[Math.floor(R()*br.length)]);
  fl.forEach(function(c){var r=RR(R,7,10),cx=c[0],cy=c[1],a0=R()*TAU;var pts=[];for(var q=0;q<=150;q++){var t=q/150*TAU,rr=r*(0.35+0.65*Math.abs(Math.sin(t*2.5)));pts.push([cx+rr*Math.cos(t+a0),cy+rr*Math.sin(t+a0)]);}s.push(pts);holes.push(EP(cx,cy,r*1.1,r*1.1));
    var st=[];for(var k=0;k<5;k++){var a3=a0+k*TAU/5+0.63;st.push([cx,cy],[cx+r*0.45*Math.cos(a3),cy+r*0.45*Math.sin(a3)]);}st.push([cx,cy]);s.push(st);});
  var bg=[];for(var y=6;y<196;y+=RR(R,5,6))bg.push([[4,y],[296,y]]);behind(s,bg,holes.concat(tw.map(function(t){return t.concat(t.map(function(p){return [p[0]+1,p[1]+2];}).reverse());})));
  return s;}},

{name:'Tulips in a vase',titles:['Still Life with Tulips','Kitchen Table, Spring','Seven Stems','Morning Window Flowers'],build(R){var s=[],t=RR(R,150,156);
  var cx=RR(R,130,170);var vase=[[cx-22,t],[cx-28,t-30],[cx-18,t-56],[cx-12,t-60],[cx+12,t-60],[cx+18,t-56],[cx+28,t-30],[cx+22,t]];s.push(poly(vase));s.push(ellipse(cx,t-60,12,3));
  HX(s,[vase,[[cx-14,t-6],[cx-20,t-30],[cx-12,t-50],[cx-6,t-30],[cx-8,t-6]]],1.8,RR(R,30,60));
  var n=RI(R,5,7),heads=[];for(var i=0;i<n;i++){var a=-PI/2+(i-(n-1)/2)*0.24,L=RR(R,45,65),hx=cx+L*Math.cos(a)*1.2,hy=t-60+L*Math.sin(a);s.push(quad([cx+(i-(n-1)/2)*3,t-60],[cx+(hx-cx)*0.3,t-80],[hx,hy]));
    var h=[[hx-7,hy],[hx-8,hy-12],[hx-4,hy-18],[hx-1,hy-12],[hx+2,hy-19],[hx+5,hy-12],[hx+8,hy-18],[hx+8,hy-6],[hx+5,hy+2],[hx-4,hy+2],[hx-7,hy]];s.push(h);H(s,h.slice(0,-1),1.4,90);heads.push(h);
    if(i%2===0){var lf=[[cx+(i-(n-1)/2)*3,t-62]].concat(quad([cx,t-62],[hx+(i<n/2?-20:20),t-90],[hx+(i<n/2?-14:14),t-110]));s.push(lf.concat(quad([hx+(i<n/2?-14:14),t-110],[cx+(i<n/2?-6:6),t-84],[cx,t-62])));}}
  var pt=[[cx+40,t-8],[cx+60,t-4],[cx+52,t]];s.push(pt);var pt2=[[cx-60,t-2],[cx-48,t-6],[cx-44,t]];s.push(pt2);
  for(var bnd=0;bnd<3;bnd++)s.push([[cx-26+bnd*0.5,t-44+bnd*12],[cx+26-bnd*0.5,t-44+bnd*12]]);var cl=[[cx-80,t],[cx+80,t],[cx+90,t+30],[cx-90,t+30]];
  tableS(s,R,t,'tiles',[vase,[[cx-80,t],[cx-80,t-140],[cx+80,t-140],[cx+80,t]]]);s.push(poly(cl));H(s,cl,3,90);s.push(scallopRows(cx-90,cx+90,t+33,t+33,10,4));
  return s;}},

{name:'Potted fern',titles:['Parlor Fern','Fronds','Green Fountain','Shade Lover'],build(R){var s=[],t=RR(R,158,164);
  var cx=RR(R,130,170);var pot=[[cx-30,t],[cx-38,t-40],[cx+38,t-40],[cx+30,t]];s.push(poly(pot));s.push(rect(cx-42,t-48,cx+42,t-40));H(s,pot,2.2,90);
  var n=RI(R,11,15),hole=[[cx-130,t-40],[cx-130,t-140],[cx+130,t-140],[cx+130,t-40]];for(var i=0;i<n;i++){var a=-PI+0.15+i*(PI-0.3)/(n-1),L=RR(R,70,100);var tip=[cx+L*1.3*Math.cos(a),t-48+L*Math.sin(a)*0.95];var mid=[cx+L*0.6*Math.cos(a),t-48+L*0.9*Math.sin(a)-20];
    var fr=quad([cx,t-48],mid,tip,16);s.push(fr);for(var k=2;k<16;k+=1){var p=fr[k],q=fr[k+1]||tip,dx=q[0]-p[0],dy=q[1]-p[1],Ld=Math.hypot(dx,dy)||1,nx=-dy/Ld,ny=dx/Ld,ll=8*(1-k/17)+2;s.push([[p[0]+nx*ll,p[1]+ny*ll],p,[p[0]-nx*ll,p[1]-ny*ll]]);}}
  tableS(s,R,t,'tiles',[hole,pot]);return s;}},

{name:'Climbing roses on a trellis',titles:['Garden Arch in June','Roses Over the Gate','Climbing Toward the Sun','Petals and Lattice'],build(R){var s=[],g=RR(R,170,176);
  ground(s,R,g,RR(R,3.4,4));var cx=RR(R,135,165),w=56,top=g-118;var arch=[[cx-w,g],[cx-w,top+40]].concat(arc(cx,top+40,w,40,PI,TAU)).concat([[cx+w,g]]);var arch2=[[cx-w+8,g],[cx-w+8,top+40]].concat(arc(cx,top+40,w-8,34,PI,TAU)).concat([[cx+w-8,g]]);s.push(arch);s.push(arch2);
  for(var y=g-10;y>top+40;y-=10){s.push([[cx-w,y],[cx-w+8,y-8]]);s.push([[cx+w,y],[cx+w-8,y-8]]);}
  var roses=[];for(var k=0;k<RI(R,12,16);k++){var side=R()<0.5?-1:1,t=R();var p=t<0.6?[cx+side*(w-4),g-20-t*120]:(function(){var a=PI+R()*PI;return [cx+(w-4)*Math.cos(a),top+40+37*Math.sin(a)];})();roses.push(p);}
  roses.forEach(function(p){s.push(spiral(p[0],p[1],0.5,6,2.2));s.push(scallop(p[0],p[1],7,6,5,0.25));for(var l=0;l<2;l++){var a=R()*TAU;var lx=p[0]+12*Math.cos(a),ly=p[1]+12*Math.sin(a);var lf=[[p[0]+7*Math.cos(a),p[1]+7*Math.sin(a)],[lx-3,ly-3],[lx+6*Math.cos(a),ly+6*Math.sin(a)],[lx+3,ly+3]];s.push(poly(lf));H(s,lf,1,0);}});
  var fx=[];for(var x=4;x<cx-w-6;x+=10)fx.push([x,g],[x,g-40],[x+5,g-46],[x+10,g-40],[x+10,g]);if(fx.length)s.push(fx);var fx2=[];for(var x2=cx+w+6;x2<292;x2+=10)fx2.push([x2,g],[x2,g-40],[x2+5,g-46],[x2+10,g-40],[x2+10,g]);if(fx2.length)s.push(fx2);
  s.push([[4,g-30],[cx-w,g-30]]);s.push([[cx+w,g-30],[296,g-30]]);var path=[[cx-20,g],[cx-60,196]];s.push(path);s.push([[cx+20,g],[cx+60,196]]);
  skyFill(s,g,7,RR(R,4,5),5,[arch.slice(0,-1).concat(arch2.slice().reverse())]);return s;}},

{name:'Lotus pond',titles:['Opening at Dawn','Lotus and Lily Pad','Still Water Temple','Pink Above the Mud'],build(R){var s=[],w=RR(R,100,110);
  s.push([[4,w],[296,w]]);var hl=hills([],R,w,RR(R,14,24),0);s.push(hl);H(s,hl.concat([[296,w],[4,w]]),3,0);var holes=[];
  var lx=RR(R,130,170),ly=RR(R,140,150);var pts=[];for(var k=0;k<7;k++){var a=PI+k*PI/6,r=k%2?26:34;var tip=[lx+r*1.1*Math.cos(a),ly-6+r*Math.sin(a)];var pe=[[lx,ly]].concat(quad([lx,ly],[lx+(tip[0]-lx)*0.5+10*Math.cos(a+PI/2),ly+(tip[1]-ly)*0.5+10*Math.sin(a+PI/2)],tip,8)).concat(quad(tip,[lx+(tip[0]-lx)*0.5-10*Math.cos(a+PI/2),ly+(tip[1]-ly)*0.5-10*Math.sin(a+PI/2)],[lx,ly],8));s.push(pe);if(k%2)H(s,pe.slice(0,-1),1.4,90);}
  holes.push(EP(lx,ly-14,44,40));s.push(ellipse(lx,ly+2,30,4));
  [[RR(R,40,80),RR(R,150,170),40],[RR(R,210,260),RR(R,160,176),46],[RR(R,90,120),RR(R,176,186),30]].forEach(function(p){var pad=arc(p[0],p[1],p[2],p[2]*0.25,0.3,TAU-0.05).concat([[p[0],p[1]]]);s.push(poly(pad));holes.push(EP(p[0],p[1],p[2]+4,p[2]*0.25+3));for(var v=0;v<6;v++){var a=0.6+v*0.95;s.push([[p[0],p[1]],[p[0]+p[2]*0.85*Math.cos(a),p[1]+p[2]*0.2*Math.sin(a)]]);}});
  var bud=[[lx+60,ly-30],[lx+56,ly-46],[lx+60,ly-56],[lx+64,ly-46],[lx+60,ly-30]];s.push(bud);s.push([[lx+60,ly-30],[lx+62,ly+10]]);holes.push(EP(lx+60,ly-30,8,30));
  var wr=[waterS(R,4,296,w+6,194,5,1)];behind(s,wr,holes);
  skyFill(s,w,7,RR(R,4,5));return s;}},

{name:'Prickly pear cactus',titles:['Paddles in the Heat','Desert Fruit','Noon Shadow','Spines and Blossoms'],build(R){var s=[],g=RR(R,168,174);
  ground(s,R,g,RR(R,3.6,4.4));var cx=RR(R,130,170);var pads=[[cx,g-26,22,28,0]];var q=[0];var holes=[];
  function addPad(p,dir){var a=dir,r=p[3]*1.6,nx=p[0]+Math.sin(a)*r*0.75,ny=p[1]-Math.cos(a)*r*0.9,np=[nx,ny,p[2]*0.86,p[3]*0.86,a];pads.push(np);return np;}
  var p1=addPad(pads[0],-0.5),p2=addPad(pads[0],0.6);addPad(p1,-0.9);addPad(p1,0.1);addPad(p2,0.5);if(R()<0.6)addPad(p2,1.2);
  pads.forEach(function(p){var pts=rotateAbout(EP(p[0],p[1],p[2],p[3]),p[0],p[1],p[4]);s.push(poly(pts));holes.push(pts);H(s,rotateAbout(arc(p[0],p[1],p[2],p[3],-PI/2,PI/2).concat(arc(p[0],p[1],p[2]*0.4,p[3],PI/2,-PI/2)),p[0],p[1],p[4]),1.8,p[4]*57+90);
    for(var k=0;k<7;k++){var sx=p[0]+RR(R,-0.6,0.6)*p[2],sy=p[1]+RR(R,-0.6,0.6)*p[3];var sp=rotateAbout([[sx,sy]],p[0],p[1],p[4])[0];s.push([[sp[0]-2,sp[1]-2],[sp[0]+2,sp[1]+2]]);s.push([[sp[0]+2,sp[1]-2],[sp[0]-2,sp[1]+2]]);}
    if(p!==pads[0]&&R()<0.6){var top=rotateAbout([[p[0],p[1]-p[3]]],p[0],p[1],p[4])[0];s.push(ellipse(top[0],top[1]-4,4,5));}});
  var rk=[[cx+60,g],[cx+66,g-12],[cx+84,g-16],[cx+96,g-6],[cx+100,g]];s.push(rk);H(s,rk,2.4,40);
  var mt=[[4,g-30],[40,g-60],[70,g-50],[100,g-30]];var bgm=[mt];A(bgm,hatch(mt.concat([[100,g],[4,g]]),3.4,0));behind(s,bgm,holes);
  skyFill(s,g,7,RR(R,4,5),5,holes);return s;}},

{name:'Apple tree with a ladder',titles:['Picking Day','Orchard in September','The Top Branches','Bushel by the Trunk'],build(R){var s=[],g=RR(R,168,174);
  ground(s,R,g,RR(R,5,5.6));var tx=RR(R,130,160),cy=g-104;
  var tr=[[tx-10,g],[tx-8,g-50],[tx-30,cy+10],[tx-24,cy+6],[tx-2,g-56],[tx+4,g-56],[tx+30,cy+8],[tx+36,cy+12],[tx+8,g-50],[tx+10,g]];s.push(tr);H(s,[[tx-10,g],[tx-8,g-50],[tx+8,g-50],[tx+10,g]],1.6,90);
  var crown=scallop(tx,cy,82,52,14,0.1);s.push(crown);var cp=crown.slice(0,-1);var apples=[];for(var k=0;k<RI(R,14,20);k++){var a=R()*TAU,rr=Math.sqrt(R())*0.8;apples.push([tx+82*rr*Math.cos(a),cy+52*rr*Math.sin(a)]);}
  apples.forEach(function(p){s.push(circle(p[0],p[1],4));s.push([[p[0],p[1]-4],[p[0]+1,p[1]-7]]);});H(s,cp,3.2,RR(R,30,60));
  var lx=tx+RR(R,30,50);s.push([[lx,g],[lx+24,cy+20]]);s.push([[lx+14,g],[lx+38,cy+20]]);for(var r=0;r<8;r++){var t=(r+0.5)/8;s.push([[lx+24*t,g-(g-cy-20)*t],[lx+14+24*t,g-(g-cy-20)*t]]);}
  var bx=tx-60;var bk=[[bx-16,g],[bx-20,g-22],[bx+20,g-22],[bx+16,g]];s.push(poly(bk));for(var b=0;b<3;b++)s.push([[bx-18,g-6-b*6],[bx+18,g-6-b*6]]);for(var a2=0;a2<4;a2++)s.push(circle(bx-12+a2*8,g-25,4));
  skyFill(s,g,7,RR(R,6.5,7.5),5,[cp]);return s;}},

{name:'Vineyard rows',titles:['Rows to the Ridge','Harvest Week','Trellised Hillside','Valley Floor, Late Sun'],build(R){var s=[],h=RR(R,70,86);
  var hp=hills([],R,h,RR(R,16,26),0);s.push(hp);var vx=RR(R,110,190);var n=RI(R,9,12);
  for(var i=0;i<=n;i++){var xb=-80+i*(460/n),pts=[];for(var t=0;t<=12;t++){var tt=t/12,x=vx+(xb-vx)*tt,y=h+(196-h)*Math.pow(tt,1.05);pts.push([x,y]);}
    s.push(pts);if(i<n){var post=[];for(var t2=1;t2<=12;t2++){var tt2=t2/12,x2=vx+(xb-vx)*tt2,y2=h+(196-h)*tt2,sz=2+tt2*10;post.push([x2,y2],[x2,y2-sz*1.6],[x2-sz*0.6,y2-sz*1.2],[x2+sz*0.6,y2-sz*1.8],[x2,y2-sz*1.6],[x2,y2]);}s.push(post);}}
  for(var j=0;j<n;j+=2){var xa=-80+j*(460/n),xb2=-80+(j+1)*(460/n);H(s,[[vx,h],[xa,196],[xb2,196]],RR(R,3.4,4),0);}H(s,hp.concat([[296,h],[4,h]]),4,0);
  s.push([[4,h],[296,h]]);var bx=RR(R,30,70);var hb=interpY(hp,bx);s.push([[bx-14,h],[bx-14,h-14],[bx,h-24],[bx+14,h-14],[bx+14,h]]);
  pineT(s,RR(R,230,270),h,0.6,0);pineT(s,RR(R,200,220),h,0.5,0);
  skyFill(s,h,7,RR(R,4,5));return s;}},

{name:'Pumpkin patch',titles:['October Field','The Big One','Vines and Gourds','First Frost'],build(R){var s=[],g=RR(R,120,128);
  var bg=hills([],R,g,RR(R,14,24),0);s.push(bg);s.push([[4,g],[296,g]]);furrows(s,R,g,RI(R,14,18));var holes=[];
  var ps=[[RR(R,70,100),RR(R,160,170),34],[RR(R,180,220),RR(R,168,178),28],[RR(R,40,60),RR(R,140,146),18],[RR(R,240,270),RR(R,140,146),20],[RR(R,140,160),RR(R,138,144),16]];
  ps.forEach(function(p){var x=p[0],y=p[1],r=p[2];var body=EP(x,y-r*0.7,r*1.15,r*0.75);s.push(poly(body));holes.push(body);s.push(poly(EP(x,y-r*0.7,r*0.4,r*0.75)));s.push(poly(EP(x,y-r*0.7,r*0.8,r*0.75)));
    shadeE(s,x,y-r*0.7,r*1.15,r*0.75,1.8,0,1,0.6);s.push([[x,y-r*1.4],[x+2,y-r*1.4-8],[x+6,y-r*1.4-10]]);s.push(curve([[x+2,y-r*1.4-6],[x+14,y-r*1.4-12],[x+18,y-r*1.4-4],[x+12,y-r*1.4-2]],5));});
  var vin=curve(ps.map(function(p){return [p[0],p[1]-p[2]*1.4-4];}).sort(function(a,b){return a[0]-b[0];}),8);s.push(vin);
  var sc=[[RR(R,250,280),g]];var sx=sc[0][0];s.push([[sx,g],[sx,g-50]]);s.push([[sx-20,g-40],[sx+20,g-40]]);s.push(circle(sx,g-56,6));s.push([[sx-10,g-62],[sx+10,g-62],[sx+6,g-68],[sx-6,g-68],[sx-10,g-62]]);
  var bgl=[];A(bgl,hatch([[4,g],[296,g],[296,196],[4,196]],RR(R,3.6,4.4),RR(R,10,20)));behind(s,bgl,holes);
  skyFill(s,g,7,RR(R,4,5));return s;}},

{name:'Wheat sheaves',titles:['Stooked and Drying','After the Reaper','Gold Field','Late August'],build(R){var s=[],g=RR(R,150,158);
  hills(s,R,g,RR(R,14,22),0);s.push([[4,g],[296,g]]);var stb=[];for(var x=4;x<296;x+=3)stb.push([x,g],[x+1.5,g+3]);s.push(stb);H(s,[[4,g+4],[296,g+4],[296,196],[4,196]],RR(R,3.6,4.4),RR(R,8,18));
  var sh=[[RR(R,70,100),g+30,1],[RR(R,180,220),g+24,0.85],[RR(R,30,50),g+4,0.55],[RR(R,250,280),g+6,0.6]];var holes=[];
  sh.forEach(function(p){var x=p[0],b=p[1],k=p[2];var out=[[x-24*k,b],[x-10*k,b-40*k],[x-22*k,b-80*k],[x+22*k,b-80*k],[x+10*k,b-40*k],[x+24*k,b]];holes.push(out);
    for(var i=0;i<14;i++){var t=i/13,xb=x-24*k+48*k*t,xt=x-22*k+44*k*t;s.push([[xb,b],[x-6*k+12*k*t,b-40*k],[xt,b-80*k]]);s.push(ellipse(xt,b-84*k,1.8*k+0.6,5*k));}
    s.push(rect(x-11*k,b-46*k,x+11*k,b-38*k));});
  var bgl=[];behind(s,bgl,holes);
  skyFill(s,g,7,RR(R,4,5),5,holes);return s;}},

{name:'Bamboo grove',titles:['Green Hall','Knuckled Stems','Wind in the Leaves','Morning Path'],build(R){var s=[],g=RR(R,170,178);
  ground(s,R,g,3.4);var n=RI(R,7,9),holes=[];
  for(var i=0;i<n;i++){var x=10+i*(280/(n-1))+RR(R,-6,6),w=RR(R,6,11),le=RR(R,-10,10);var st=[[x-w/2,g],[x-w/2+le,4],[x+w/2+le,4],[x+w/2,g]];s.push(st);holes.push(st);
    for(var y=g-RR(R,10,24);y>12;y-=RR(R,22,32)){var xo=x+le*(1-y/g);s.push([[xo-w/2-1,y],[xo+w/2+1,y]]);
      if(R()<0.35){var d=R()<0.5?-1:1;var bx=xo+d*w/2;s.push([[bx,y],[bx+d*16,y-10]]);for(var l=0;l<3;l++){var a=d>0?-0.4+l*0.4:PI+0.4-l*0.4;var lf=[[bx+d*16,y-10],[bx+d*16+14*Math.cos(a)-2,y-10+14*Math.sin(a)-2],[bx+d*16+26*Math.cos(a),y-10+26*Math.sin(a)],[bx+d*16+14*Math.cos(a)+2,y-10+14*Math.sin(a)+2]];s.push(poly(lf));}}}
    H(s,[[x+w*0.05,g],[x+w*0.05+le,4],[x+w/2+le,4],[x+w/2,g]],1.8,90);}
  skyFill(s,g,7,RR(R,7,8));
  return s;}},

{name:'Waterfall',titles:['Falling Water','Mist at the Base','Granite Cascade','The Plunge Pool'],build(R){var s=[],t=RR(R,40,54),p=RR(R,150,158);
  var lx0=RR(R,110,125),lx1=lx0+RR(R,50,64);var lc=[[4,t+10],[lx0-20,t+4],[lx0,t],[lx0-4,p],[4,p]],rc=[[lx1,t],[lx1+24,t-6],[296,t+6],[296,p],[lx1+6,p]];
  s.push(lc);s.push(rc);H(s,lc,RR(R,2.8,3.4),RR(R,40,60));H(s,rc,RR(R,2.8,3.4),-RR(R,40,60));
  for(var k=0;k<7;k++){var x=lx0+2+k*(lx1-lx0-4)/6;s.push(curve([[x,t],[x+RR(R,-2,2),t+40],[x+RR(R,-3,3),t+80],[x+RR(R,-4,4),p-4]],6));}
  s.push([[lx0,t],[lx1,t]]);var top=wave(4,296,t-8,1,30);
  for(var m=0;m<6;m++){s.push(scallop(lx0-10+m*((lx1-lx0+20)/5),p-2,8,5,6,0.3));}
  s.push([[4,p],[296,p]]);s.push(waterS(R,4,296,p+6,194,5,1.6));
  [[RR(R,20,50),t+8],[RR(R,240,280),t]].forEach(function(q){pineT(s,q[0],q[1]+4,RR(R,0.8,1.1),0);});
  skyFill(s,t+4,7,RR(R,4,5));return s;}},

{name:'Volcano at dusk',titles:['Smoking Cone','The Mountain Wakes','Ash on the Wind','Fire Below'],build(R){var s=[],g=RR(R,168,174);
  var cx=RR(R,130,170),ct=RR(R,48,56),cw=22;var cone=[[4,g-10],[cx-cw-70,g-50],[cx-cw,ct],[cx+cw,ct],[cx+cw+80,g-46],[296,g-14]];s.push(cone);
  for(var k=0;k<14;k++){var t=k/13;var a=[cx-cw+t*2*cw,ct+2],b=[4+t*292,g-6];s.push(curve([a,[a[0]+(b[0]-a[0])*0.4,a[1]+(b[1]-a[1])*0.35+RR(R,-4,4)],b],6));}
  H(s,[[cx,ct],[cx+cw,ct],[cx+cw+80,g-46],[296,g-14],[296,g],[cx+20,g]],2.4,RR(R,40,60));
  var lava=curve([[cx-6,ct+2],[cx-14,ct+30],[cx-4,ct+60],[cx-20,g-30],[cx-14,g-6]],6);s.push(lava);s.push(lava.map(function(p){return [p[0]+4,p[1]];}));
  var sm=[[cx-cw+4,ct]];var sy=ct-4;var xx=cx;var pts=[];for(var i=0;i<6;i++){var r=8+i*4;xx+=RR(R,4,12);sy-=r*1.2;s.push(circle(xx,sy+r*0.6,r));pts.push([xx,sy]);}
  s.push([[cx,ct],[cx+4,ct-8]]);ground(s,R,g,RR(R,3.4,4));
  var np=RI(R,3,5);for(var pp=0;pp<np;pp++){var px=RR(R,10,290);if(Math.abs(px-cx)<60)continue;s.push([[px,g],[px+2,g-30]]);for(var q=0;q<5;q++){var a2=-PI/2+(q-2)*0.6;s.push(quad([px+2,g-30],[px+2+12*Math.cos(a2),g-36],[px+2+20*Math.cos(a2),g-28+Math.sin(a2)*14]));}}
  skyFill(s,g,6,RR(R,3.6,4.4));return s;}},

{name:'Desert dunes',titles:['Wind-Carved','Sand Sea','Crests at Sunrise','Caravan Line'],build(R){var s=[],y0=RR(R,80,92);
  var crests=[];for(var d=0;d<4;d++){var by=y0+d*30,amp=RR(R,14,22),ph=R()*6,pts=[];for(var x=4;x<=296;x+=3)pts.push([x,by-amp*Math.sin(x/RR(R,60,80)+ph)-6*Math.sin(x/23+d)]);crests.push(pts);}
  crests.forEach(function(c,i){s.push(c);var lo=c.map(function(p,k){return [p[0],p[1]+14+4*Math.sin(k/9)];});H(s,c.concat(lo.slice().reverse()),2+i*0.3,i%2?55:-55);});
  var cx=RR(R,180,240),cy=interpY(crests[0],cx);for(var c2=0;c2<3;c2++){var x=cx+c2*16,y=interpY(crests[0],x);s.push([[x-6,y],[x-5,y-8],[x-2,y-12],[x+2,y-10],[x+4,y-14],[x+7,y-12],[x+6,y-8],[x+6,y]]);}
  sunH(s,RR(R,40,90),interpY(crests[0],60)-0,14);
  skyFill(s,y0+30,6,RR(R,3.6,4.4));return s;}},

{name:'Rice terraces',titles:['Steps of Water','Mountain Paddies','Green Contours','Planting Season'],build(R){var s=[];
  var n=RI(R,9,12),prev=null;for(var i=0;i<n;i++){var by=40+i*(150/n),pts=[];for(var x=4;x<=296;x+=4)pts.push([x,by+10*Math.sin(x/50+i*0.6)+6*Math.sin(x/21)]);s.push(pts);var lip=pts.map(function(p){return [p[0],p[1]+3];});s.push(lip);
    if(i%2===0)for(var k=0;k<pts.length;k+=3)s.push([pts[k],[pts[k][0],pts[k][1]-RR(R,3,6)]]);else{var nx=pts.map(function(p){return [p[0],p[1]+150/n-4];});H(s,lip.concat(nx.slice().reverse()),3.4,0);}}
  var hx=RR(R,200,250),hy=40+3*(150/n);s.push([[hx-14,hy],[hx-14,hy-14],[hx,hy-26],[hx+14,hy-14],[hx+14,hy]]);H(s,[[hx-16,hy-14],[hx,hy-28],[hx+16,hy-14]],1.6,0);
  var m=[[4,40],[50,14],[90,30],[140,8],[190,26],[240,10],[296,30]];s.push(m.map(function(p){return [p[0],p[1]+RR(R,-3,3)];}));
  skyFill(s,40,6,RR(R,4,5));return s;}},

{name:'Thunderstorm over the plains',titles:['Supercell','Before the Rain','Anvil Cloud','Flash on the Horizon'],build(R){var s=[],g=RR(R,150,158);
  furrows(s,R,g,RI(R,16,20));var cl=[];var base=RR(R,70,80);for(var x=4;x<=296;x+=4)cl.push([x,base+4*Math.sin(x/9)+3*Math.sin(x/4.3)]);s.push(cl);
  var top=[];for(var x2=4;x2<=296;x2+=6)top.push([x2,base-30-26*Math.sin((x2-4)/292*PI)-8*Math.abs(Math.sin(x2/17))]);s.push([[4,base]].concat(top).concat([[296,base]]));
  HX(s,[cl.concat(top.slice().reverse())],RR(R,2.4,3),0);
  var lx=RR(R,120,190);var bolt=[[lx,base+4]];var y=base+4,x3=lx;while(y<g){y+=RR(R,10,18);x3+=RR(R,-14,14);bolt.push([x3,Math.min(y,g)]);}s.push(bolt);s.push(bolt.map(function(p){return [p[0]+2,p[1]];}));
  for(var r=0;r<RI(R,10,14);r++){var rx=RR(R,10,290);if(Math.abs(rx-lx)<20)continue;s.push([[rx,base+6],[rx-10,g]]);}
  var fx=RR(R,30,80);s.push([[fx-14,g],[fx-14,g-14],[fx,g-24],[fx+14,g-14],[fx+14,g]]);s.push([[fx+20,g],[fx+20,g-30],[fx+30,g-30],[fx+30,g]]);
  skyFill(s,base-34,6,RR(R,4.4,5.4));return s;}},

{name:'Rainbow over the hills',titles:['After the Shower','Seven Bands','Promise Over the Valley','Sun Breaks Through'],build(R){var s=[],g=RR(R,150,158);
  var cx=RR(R,130,170),r0=RR(R,96,110);var hl=hills([],R,g,RR(R,26,40),0);var hl2=hills([],R,g+18,RR(R,16,24),0);
  var bands=[];for(var b=0;b<7;b++){var r=r0-b*6;bands.push(arc(cx,g,r*1.3,r,PI,TAU));}
  var bgr=bands.slice();for(var b2=0;b2<6;b2+=2){A(bgr,hatch(arc(cx,g,(r0-b2*6)*1.3,r0-b2*6,PI,TAU).concat(arc(cx,g,(r0-b2*6-6)*1.3,r0-b2*6-6,TAU,PI)),1.8,RR(R,-30,30)));}
  behind(s,bgr,[hl.concat([[296,200],[4,200]])]);s.push(hl);HX(s,[hl2.concat([[296,g+18],[4,g+18]])],3,0);s.push(hl2);H(s,hl.concat([[296,g+20],[4,g+20]]),RR(R,4.4,5.4),0);
  ground(s,R,g+18,RR(R,3.4,4));var tr=RR(R,30,70);treeR(s,R,tr,interpY(hl,tr)+4,14,2.4);
  var cl=[];var cx2=RR(R,220,270);s.push(scallop(cx2,30,30,12,8,0.2));
  skyFill(s,g,7,RR(R,5,6),5,[EP(cx2,30,36,15)]);return s;}},

{name:'Iceberg',titles:['Nine Tenths Below','Blue Silence','Drifting South','Arctic Noon'],build(R){var s=[],w=RR(R,92,102);
  var cx=RR(R,130,170);var top=[[cx-90,w],[cx-70,w-20],[cx-40,w-30],[cx-24,w-62],[cx,w-70],[cx+18,w-50],[cx+40,w-56],[cx+66,w-24],[cx+96,w]];s.push(top);
  H(s,[[cx,w-70],[cx+18,w-50],[cx+40,w-56],[cx+66,w-24],[cx+96,w],[cx+10,w]],2,RR(R,60,80));
  var bot=[[cx-90,w],[cx-120,w+30],[cx-110,w+70],[cx-60,w+90],[cx+20,w+94],[cx+90,w+70],[cx+130,w+30],[cx+96,w]];s.push(bot);H(s,bot,RR(R,4,5),RR(R,30,50));
  s.push([[4,w],[cx-90,w]]);s.push([[cx+96,w],[296,w]]);var wl=[];for(var y=w+6;y<196;y+=6){wl.push(wave(4,296,y,1,24,R()*6));}behind(s,wl,[bot]);
  var sx=RR(R,30,70);s.push([[sx-16,w],[sx-6,w-8],[sx+10,w-6],[sx+18,w]]);
  skyFill(s,w,7,RR(R,3.2,3.6));return s;}},

{name:'Mesa and canyon',titles:['Red Rock Country','Butte at Sundown','Layers of Time','Canyon Rim'],build(R){var s=[],g=RR(R,160,166);
  var m1=[[4,g],[4,70],[30,64],[34,58],[110,58],[116,70],[140,g]];s.push(m1);var m2=[[170,g],[196,80],[200,74],[250,74],[256,86],[270,g]];s.push(m2);var m3=[[270,g],[276,100],[296,98],[296,g]];s.push(m3);
  [[m1,58],[m2,74],[m3,98]].forEach(function(m){var P=m[0];for(var y=m[1]+8;y<g;y+=RR(R,8,14)){var xs=[];for(var i=0;i<P.length-1;i++){var a=P[i],b=P[i+1];if((a[1]-y)*(b[1]-y)<0)xs.push(a[0]+(y-a[1])/(b[1]-a[1])*(b[0]-a[0]));}xs.sort(function(p,q){return p-q;});if(xs.length>=2)s.push([[xs[0],y],[xs[xs.length-1],y]]);}H(s,P.slice(0,-1),RR(R,2.6,3.2),RR(R,60,80));});
  ground(s,R,g,RR(R,3.4,4));var rv=curve([[150,g],[140,g+14],[170,g+24],[150,196]],8);s.push(rv);s.push(rv.map(function(p){return [p[0]+14,p[1]];}));
  for(var c=0;c<RI(R,3,5);c++){var px=RR(R,10,290),py=RR(R,g+10,190);s.push([[px,py],[px,py-14]]);s.push([[px-5,py-6],[px-5,py-10]]);s.push([[px,py-8],[px+5,py-8],[px+5,py-12]]);}
  skyFill(s,g,7,RR(R,4,5));return s;}},

{name:'Acorns and oak leaves',titles:['Squirrel\'s Pantry','Fallen in October','Little Caps','Under the Old Oak'],build(R){var s=[],t=RR(R,150,158);
  var holes=[];[[RR(R,60,90),t-40,-0.4,1],[RR(R,190,230),t-30,0.5,0.9]].forEach(function(l){var x=l[0],y=l[1],a=l[2],k=l[3];var pts=[];var N=7;for(var i=0;i<=N;i++){var u=i/N;var w=34*k*Math.sin(u*PI)*(0.75+0.25*Math.cos(u*PI*6));pts.push([x-60*k+u*120*k,y-w]);}
    for(var i2=N;i2>=0;i2--){var u2=i2/N;var w2=34*k*Math.sin(u2*PI)*(0.75+0.25*Math.cos(u2*PI*6));pts.push([x-60*k+u2*120*k,y+w2]);}var lf=rotateAbout(curve(pts,5),x,y,a);s.push(lf);holes.push(lf);
    s.push(rotateAbout([[x-70*k,y],[x+60*k,y]],x,y,a));for(var v=1;v<6;v++){var vx=x-60*k+v*20*k;s.push(rotateAbout([[vx,y],[vx+14*k,y-22*k]],x,y,a));s.push(rotateAbout([[vx,y],[vx+14*k,y+22*k]],x,y,a));}HX(s,[lf],2.6,a*57+70);});
  [[RR(R,120,150),t-14],[RR(R,160,180),t-10],[RR(R,100,120),t-6]].forEach(function(p,i){var x=p[0],y=p[1];var nut=[[x-10,y-16]].concat(quad([x-10,y-16],[x-12,y+4],[x,y+8]),quad([x,y+8],[x+12,y+4],[x+10,y-16]));s.push(nut);shadeE(s,x,y-6,10,13,1.4,0,1,0.4);
    var cap=arc(x,y-16,13,9,PI,TAU).concat([[x+13,y-16],[x-13,y-16]]);s.push(cap);H(s,cap,1.2,45);H(s,cap,1.2,-45);s.push([[x,y-25],[x+3,y-30]]);holes.push(EP(x,y-8,15,18));});
  tableS(s,R,t,'diag',holes);return s;}}
);

SUBJ.push(
{name:'Grand piano',titles:['Lid Up, Lights Down','Nocturne Hour','Concert Hall Empty','Eighty-Eight Keys'],build(R){var s=[],f=RR(R,172,178);
  floorS(s,R,f,RI(R,14,18));var x=RR(R,40,60),y=f-56;
  var body=[[x,y],[x+60,y]].concat(curve([[x+60,y],[x+120,y-6],[x+150,y-30],[x+200,y-24],[x+214,y]],8)).concat([[x+214,y+14],[x,y+14],[x,y]]);s.push(body);H(s,[[x,y+2],[x+214,y+2],[x+214,y+14],[x,y+14]],1.6,0);
  var lid=[[x+20,y],[x+90,y-90],[x+214,y-26]];s.push(lid);s.push([[x+150,y-6],[x+130,y-60]]);H(s,[[x+20,y],[x+90,y-90],[x+100,y-82],[x+36,y]],2,60);
  var kb=[[x-14,y+14],[x+40,y+14],[x+40,y+24],[x-14,y+24]];s.push(poly(kb));for(var k=x-12;k<x+40;k+=4){s.push([[k,y+14],[k,y+24]]);if((k/4|0)%7!==2&&(k/4|0)%7!==6)s.push(rect(k+2.5,y+14,k+4.5,y+20));}
  [x+10,x+190,x+120].forEach(function(lx){s.push([[lx,y+14],[lx+2,f-4],[lx+8,f-4],[lx+10,y+14]]);s.push(ellipse(lx+5,f-2,5,2));});s.push(rect(x+90,f-20,x+110,f-16));s.push([[x+100,y+14],[x+100,f-20]]);
  s.push(rect(x+6,y-12,x+34,y));s.push([[x+20,y-12],[x+20,y-22]]);var bx=x-30;s.push(rect(bx-10,f-34,bx+30,f-26));s.push([[bx-6,f-26],[bx-6,f]]);s.push([[bx+26,f-26],[bx+26,f]]);
  var cur=[[4,4],[50,4],[30,f],[4,f]],cur2=[[296,4],[250,4],[270,f],[296,f]];s.push(poly(cur));s.push(poly(cur2));for(var c=8;c<46;c+=6){s.push(curve([[c,4],[c-6,f/2],[c*0.6,f]],6));s.push(curve([[300-c,4],[300-c+6,f/2],[300-c*0.6,f]],6));}
  HX(s,[[[50,4],[250,4],[270,f],[30,f]],body.slice(0,-1),lid,kb,[[x-40,f],[x-40,f-40],[x+220,f-40],[x+220,f]]],RR(R,4.4,5.4),0);
  return s;}},

{name:'Trumpet',titles:['Brass in the Spotlight','Three Valves','Jazz Club Break','Morning Reveille'],build(R){var s=[],t=RR(R,150,158);
  var y=t-26,x=RR(R,40,60);var bell=[[x+170,y-26]].concat(quad([x+170,y-26],[x+190,y-6],[x+230,y-34],10)).concat([[x+230,y+18]]).concat(quad([x+230,y+18],[x+190,y-10],[x+170,y-14],10));s.push(bell);s.push(ellipse(x+230,y-8,5,26));
  H(s,[[x+212,y-30],[x+230,y-34],[x+230,y+18],[x+212,y+8]],1.6,90);
  s.push([[x,y-20],[x+170,y-20]]);s.push([[x,y-14],[x+170,y-14]]);s.push(rect(x-14,y-22,x,y-12));
  var lp=[[x+40,y-20]].concat(arc(x+40,y,20,20,1.5*PI,0.5*PI,true));s.push(arc(x+40,y,20,20,PI/2,1.5*PI));s.push(arc(x+40,y,14,14,PI/2,1.5*PI));s.push([[x+40,y+20],[x+150,y+20]]);s.push([[x+40,y+14],[x+150,y+14]]);s.push(arc(x+150,y-3,17,17,-PI/2,PI/2));
  [x+80,x+96,x+112].forEach(function(vx){s.push(rect(vx-4,y-34,vx+4,y+26));s.push(ellipse(vx,y-38,6,2.4));s.push([[vx,y-36],[vx,y-34]]);H(s,[[vx-4,y-34],[vx+4,y-34],[vx+4,y+26],[vx-4,y+26]],1.4,90);});
  var cs=[[x-20,t],[x+250,t],[x+260,t+24],[x-30,t+24]];s.push(poly(cs));H(s,[[x-24,t+12],[x+256,t+12],[x+260,t+24],[x-30,t+24]],2.4,0);
  var sh=[[x+10,t],[x+40,t-2],[x+240,t-2],[x+250,t]];s.push(sh);
  tableS(s,R,t,'stripes',[[[x-30,t],[x-30,y-44],[x+240,y-44],[x+240,t]]]);return s;}},

{name:'Snare drum',titles:['Rimshot','Marching Season','Tight Head','Brushes on the Skin'],build(R){var s=[],f=RR(R,174,180);
  floorS(s,R,f,RI(R,12,16));var cx=RR(R,130,170),top=f-90,rx=62,ry=16,h=40;
  s.push(ellipse(cx,top,rx,ry));s.push(ellipse(cx,top,rx-4,ry-3));s.push([[cx-rx,top],[cx-rx,top+h]].concat(arc(cx,top+h,rx,ry,PI,0)).concat([[cx+rx,top]]));
  s.push(arc(cx,top+6,rx,ry,0,PI));s.push(arc(cx,top+h-6,rx,ry,0,PI));
  for(var k=0;k<8;k++){var a=0.15+k*(PI-0.3)/7,lx=cx+rx*Math.cos(a);var y1=top+6+ry*Math.sin(a),y2=top+h-6+ry*Math.sin(a);s.push([[lx,y1],[lx,y2]]);s.push(rect(lx-2,y1+8,lx+2,y1+14));}
  H(s,[[cx-rx,top+6],[cx+rx,top+6],[cx+rx,top+h-6],[cx-rx,top+h-6]],2.2,0);var cym=[cx+rx+30,top-30];s.push(ellipse(cym[0],cym[1],36,6));H(s,EP(cym[0],cym[1],36,6),1.4,0);s.push([[cym[0],cym[1]],[cym[0],f-2]]);s.push([[cym[0]-16,f-2],[cym[0],f-40],[cym[0]+16,f-2]]);
  [[-1,0.8],[1,0.8]].forEach(function(d){s.push([[cx+d[0]*30,top+h+12],[cx+d[0]*56,f-2]]);});s.push([[cx,top+h+16],[cx,f-2]]);s.push(arc(cx,top+h+14,30,6,0,PI));
  var a1=RR(R,-0.6,-0.3);s.push([[cx-20,top-4],[cx-20+90*Math.cos(a1),top-4+90*Math.sin(a1)]]);s.push([[cx-20,top-1],[cx-20+90*Math.cos(a1),top-1+90*Math.sin(a1)]]);s.push([[cx+10,top+4],[cx-70,top-50]]);s.push([[cx+12,top+6],[cx-68,top-47]]);
  var rug=EP(cx,f+8,120,10);s.push(poly(rug));H(s,rug,2,0);var hs=[[4,4],[296,4],[296,f],[4,f]];HX(s,[hs,[[cx-80,f],[cx-80,top-20],[cx-74,top-60],[cx+80,top-80],[cx+rx+70,top-40],[cx+rx+70,f]]],RR(R,4.5,5.5),90);return s;}},

{name:'Concert harp',titles:['Forty-Seven Strings','Pedals and Gold','Before the Recital','Cascade of Notes'],build(R){var s=[],f=RR(R,176,182);
  floorS(s,R,f,RI(R,12,16));var bx=RR(R,110,140);var col=[[bx,f-10],[bx,f-160],[bx+8,f-160],[bx+8,f-10]];s.push(col);H(s,col,1.6,90);s.push(scallop(bx+4,f-166,10,6,8,0.3));
  var sb=[[bx+8,f-14],[bx+110,f-120]];s.push([[bx+4,f-10],[bx+112,f-122],[bx+118,f-116],[bx+12,f-4]]);H(s,[[bx+4,f-10],[bx+112,f-122],[bx+118,f-116],[bx+12,f-4]],1.6,45);
  var nk=curve([[bx+8,f-160],[bx+50,f-150],[bx+80,f-176],[bx+112,f-160],[bx+118,f-118]],8);s.push(nk);s.push(nk.map(function(p){return [p[0],p[1]+6];}));
  for(var k=1;k<22;k++){var t=k/22,x=bx+8+t*104,ys=f-14-t*104,yt=interpY(nk.map(function(p){return [p[0],p[1]+6];}),x);s.push([[x,ys],[x,yt]]);}
  s.push(rect(bx-10,f-10,bx+130,f));H(s,[[bx-10,f-10],[bx+130,f-10],[bx+130,f],[bx-10,f]],1.6,0);
  var st=RR(R,200,240);s.push([[st,f],[st,f-60]]);s.push([[st-10,f],[st+10,f]]);var mus=[[st-24,f-60],[st+24,f-60],[st+20,f-90],[st-20,f-90]];s.push(poly(mus));for(var l=0;l<5;l++)s.push([[st-18,f-68-l*4],[st+18,f-68-l*4]]);
  var cx=RR(R,30,60);s.push(rect(cx-12,f-26,cx+12,f-22));s.push([[cx-10,f-22],[cx-10,f]]);s.push([[cx+10,f-22],[cx+10,f]]);
  HX(s,[[[4,4],[296,4],[296,f],[4,f]],[[bx-14,f],[bx-14,f-176],[bx+130,f-184],[bx+130,f]],[[st-28,f],[st-28,f-94],[st+28,f-94],[st+28,f]]],RR(R,5,6),RR(R,40,50));return s;}},

{name:'Accordion',titles:['Squeezebox','Bellows Open','Café Waltz','Button and Key'],build(R){var s=[],t=RR(R,154,160);
  var cx=RR(R,130,170),y=t-60;var lb=[[cx-90,y-40],[cx-56,y-44],[cx-56,y+56],[cx-90,y+52]];s.push(poly(lb));for(var k=0;k<4;k++)for(var j=0;j<6;j++)s.push(circle(cx-82+k*8,y-30+j*14,2.4));
  var rb=[[cx+56,y-44],[cx+90,y-40],[cx+90,y+52],[cx+56,y+56]];s.push(poly(rb));for(var kk=0;kk<12;kk++){s.push(rect(cx+60,y-38+kk*7.5,cx+86,y-32+kk*7.5));if(kk%2)H(s,[[cx+62,y-38+kk*7.5],[cx+76,y-38+kk*7.5],[cx+76,y-32+kk*7.5],[cx+62,y-32+kk*7.5]],1,0);}
  var n=RI(R,10,14),pl=[];for(var i=0;i<=n;i++){var x=cx-56+i*112/n,dy=(i%2?4:0);pl.push([x,y-44+dy],[x,y+56-dy]);}
  var zz=[];for(var i2=0;i2<=n;i2++){var x2=cx-56+i2*112/n;zz.push([x2,i2%2?y-40:y-44]);}s.push(zz);var zz2=zz.map(function(p){return [p[0],p[1]+100];});s.push(zz2);for(var i3=0;i3<=n;i3++)s.push([zz[i3],zz2[i3]]);
  for(var i4=0;i4<n;i4+=2){H(s,[zz[i4],zz[i4+1],zz2[i4+1],zz2[i4]],1.8,90);}
  s.push(rect(cx-30,y-56,cx+30,y-44));s.push([[cx-20,y-56],[cx-20,y-62],[cx+20,y-62],[cx+20,y-56]]);
  var cl=[[4,t],[296,t],[296,t+40],[4,t+40]];
  tableS(s,R,t,'diag',[[[cx-96,t],[cx-96,y-66],[cx+96,y-66],[cx+96,t]]]);return s;}},

{name:'Banjo on a porch',titles:['Front Porch Tune','Five Strings','Evening Pickin\'','Bluegrass Hour'],build(R){var s=[],f=RR(R,172,178);
  var cx=RR(R,90,120),cy=f-64,r=40;var a=-0.55;s.push(circle(cx,cy,r));s.push(circle(cx,cy,r-6));for(var k=0;k<24;k++){var aa=k*TAU/24;s.push([[cx+(r-6)*Math.cos(aa),cy+(r-6)*Math.sin(aa)],[cx+r*Math.cos(aa),cy+r*Math.sin(aa)]]);}
  var ex=cx+150*Math.cos(a),ey=cy+150*Math.sin(a);var nk=[[cx+r*Math.cos(a+0.08),cy+r*Math.sin(a+0.08)],[ex,ey+5],[ex-1,ey-5],[cx+r*Math.cos(a-0.1),cy+r*Math.sin(a-0.1)]];s.push(nk);H(s,nk,1.2,a*57);
  var hd=rotateAbout([[ex,ey-6],[ex+30,ey-8],[ex+32,ey+8],[ex,ey+6]],ex,ey,a);s.push(poly(hd));for(var p=0;p<4;p++){var pp=rotateAbout([[ex+6+p*7,ey-8]],ex,ey,a)[0];s.push(circle(pp[0],pp[1]-3,2));}
  for(var st=0;st<5;st++){var o=(st-2)*1.6;s.push([[cx-r*0.6+o,cy+r*0.3],[ex+o*Math.sin(a),ey-o*Math.cos(a)]]);}s.push(rect(cx-r*0.7,cy+r*0.2,cx-r*0.4,cy+r*0.5));
  var ch=[[cx-40,f],[cx-36,f-30],[cx+50,f-30],[cx+54,f]];s.push([[cx+60,f],[cx+64,f-110],[cx+80,f-110],[cx+76,f]]);for(var sl=0;sl<6;sl++)s.push([[cx+64,f-100+sl*14],[cx+80,f-100+sl*14]]);
  floorS(s,R,f,RI(R,10,14));var post=[[230,f],[230,8],[240,8],[240,f]];s.push(post);H(s,post,1.6,90);s.push(comb(240,296,f-40,40,8));s.push([[240,f-40],[296,f-40]]);s.push([[240,f-80],[296,f-80]]);
  HX(s,[[[4,4],[230,4],[230,f],[4,f]],EP(cx,cy,r+2,r+2),nk,poly(hd).slice(0,4),[[cx+56,f],[cx+60,f-114],[cx+84,f-114],[cx+80,f]]],RR(R,5,6),0);
  return s;}},

{name:'Saxophone on a stand',titles:['Smoky Room, Late Set','The Curve of Brass','Blue Note','Between Solos'],build(R){var s=[],f=RR(R,174,180);
  floorS(s,R,f,RI(R,12,16));var x=RR(R,120,150);
  var outer=curve([[x+20,24],[x+18,60],[x+10,110],[x+6,140],[x+20,160],[x+50,160],[x+66,140],[x+70,120]],8),inner=curve([[x+30,24],[x+28,60],[x+22,110],[x+20,136],[x+30,148],[x+46,146],[x+56,132],[x+58,118]],8);
  s.push(outer);s.push(inner);s.push([[x+54,118],[x+80,108]]);s.push(ellipse(x+68,112,14,6));H(s,outer.concat(inner.slice().reverse()),1.8,RR(R,20,40));
  s.push([[x+20,24],[x+10,14],[x-10,10]]);s.push([[x+30,24],[x+14,8],[x-10,6]]);s.push(rect(x-20,4,x-8,12));
  for(var k=0;k<7;k++){var yy=40+k*14,kx=interpY(inner.map(function(p){return [p[1],p[0]];}),yy);s.push(circle(kx-2,yy,3.4));s.push([[kx-2,yy],[kx+10,yy+2]]);}
  s.push([[x+40,160],[x+20,f]]);s.push([[x+40,160],[x+60,f]]);s.push([[x+40,160],[x+40,f-6]]);s.push(arc(x+40,140,30,12,0.2,PI-0.2));
  var sp=RR(R,30,70);s.push(rect(sp-24,f-120,sp+24,f-20));H(s,[[sp-24,f-120],[sp+24,f-120],[sp+24,f-20],[sp-24,f-20]],2,0);s.push(circle(sp,f-80,18));s.push(circle(sp,f-80,6));s.push(circle(sp,f-40,10));
  HX(s,[[[4,4],[296,4],[296,f],[4,f]],[[x-24,f],[x-24,2],[x+90,2],[x+90,f]],[[sp-26,f],[sp-26,f-122],[sp+26,f-122],[sp+26,f]]],RR(R,5,6),RR(R,-50,-30));return s;}},

{name:'Gramophone',titles:['Seventy-Eight RPM','His Master\'s Parlor','Crackle and Hiss','Wind It Up'],build(R){var s=[],t=RR(R,154,160);
  var x=RR(R,60,90),bt=t-40;var box=[];box3(s,x,bt,90,40,16,2);H(s,[[x,bt+8],[x+90,bt+8],[x+90,bt+40],[x,bt+40]],2,0);var shd=[[x-20,t],[x+130,t],[x+120,t+8],[x-30,t+8]];s.push(ellipse(x+52,bt-4,40,6));s.push(ellipse(x+52,bt-6,4,1.4));s.push([[x+92,bt+20],[x+108,bt+18]]);s.push(circle(x+112,bt+18,4));
  var arm=[[x+80,bt-8],[x+84,bt-18],[x+96,bt-26]];s.push(arm);var hc=[x+96,bt-26];
  var horn=[];var L=70,ang=-0.45;var tip=[hc[0]+L*Math.cos(ang),hc[1]+L*Math.sin(ang)];var nrm=[Math.cos(ang+PI/2),Math.sin(ang+PI/2)];
  var e1=[tip[0]+nrm[0]*30,tip[1]+nrm[1]*30],e2=[tip[0]-nrm[0]*30,tip[1]-nrm[1]*30];s.push(quad(hc,[hc[0]+50*Math.cos(ang)+nrm[0]*6,hc[1]+50*Math.sin(ang)+nrm[1]*6],e1));s.push(quad(hc,[hc[0]+50*Math.cos(ang)-nrm[0]*6,hc[1]+50*Math.sin(ang)-nrm[1]*6],e2));
  var mouth=rotateAbout(EP(tip[0],tip[1],10,30),tip[0],tip[1],ang);s.push(poly(mouth));for(var k=1;k<6;k++){var t2=k/6;s.push(quad(hc,[hc[0]+50*Math.cos(ang)+nrm[0]*(6-t2*12),hc[1]+50*Math.sin(ang)+nrm[1]*(6-t2*12)],[tip[0]+nrm[0]*(30-60*t2),tip[1]+nrm[1]*(30-60*t2)]));}
  H(s,rotateAbout(arc(tip[0],tip[1],10,30,-PI/2,PI/2).concat(arc(tip[0],tip[1],3,30,PI/2,-PI/2)),tip[0],tip[1],ang),1.6,ang*57);
  for(var rc=0;rc<3;rc++){var rx=RR(R,210,250)+rc*4;s.push(rect(rx-20,t-4-rc*4,rx+20,t-rc*4));}
  tableS(s,R,t,'stripes',[[[x-10,t],[x-10,bt-12],[hc[0]-10,bt-60],[tip[0]-44,tip[1]-40],[tip[0]+30,tip[1]-40],[tip[0]+44,tip[1]+34],[x+120,bt-10],[x+120,t]],[[180,t],[180,t-16],[270,t-16],[270,t]]]);return s;}},

{name:'Metronome',titles:['Andante','Tick, Tock, Practice','Keeping Time','Sixty Beats'],build(R){var s=[],t=RR(R,154,160);
  var cx=RR(R,130,170);var body=[[cx-40,t],[cx-18,t-120],[cx+18,t-120],[cx+40,t]];s.push(poly(body));s.push(rect(cx-46,t-14,cx+46,t));H(s,[[cx-46,t-14],[cx+46,t-14],[cx+46,t],[cx-46,t]],1.6,0);
  var face=[[cx-24,t-24],[cx-12,t-110],[cx+12,t-110],[cx+24,t-24]];s.push(poly(face));for(var k=0;k<12;k++){var y=t-100+k*6;s.push([[cx-6,y],[cx+6,y]]);}
  HX(s,[body,face],RR(R,2,2.6),RR(R,60,80));var a=RR(R,-0.35,0.35);var piv=[cx,t-30];var tip=[piv[0]+Math.sin(a)*96,piv[1]-Math.cos(a)*96];s.push([piv,tip]);var wt=[piv[0]+Math.sin(a)*60,piv[1]-Math.cos(a)*60];s.push(rotateAbout(rect(wt[0]-6,wt[1]-5,wt[0]+6,wt[1]+5),wt[0],wt[1],a));
  s.push(circle(piv[0],piv[1],3));s.push([[cx+40,t-60],[cx+52,t-60]]);s.push(circle(cx+56,t-60,4));
  var sh=[[cx-120,t],[cx-100,t-40],[cx-70,t-40],[cx-60,t]];var bk=[[cx+70,t],[cx+70,t-30],[cx+130,t-30],[cx+130,t]];s.push(poly(bk));s.push(rect(cx+66,t-38,cx+134,t-30));for(var p=0;p<4;p++)s.push([[cx+74,t-8-p*6],[cx+126,t-8-p*6]]);
  tableS(s,R,t,'tiles',[[[cx-50,t],[cx-50,t-124],[cx+50,t-124],[cx+50,t]],[[cx+64,t],[cx+64,t-40],[cx+136,t-40],[cx+136,t]],[[tip[0]-6,tip[1]-4],[tip[0]+6,tip[1]-4],[piv[0]+4,piv[1]],[piv[0]-4,piv[1]]]]);return s;}},

{name:'Xylophone',titles:['Rosewood Bars','Mallet Music','Ascending Scale','Playroom Concert'],build(R){var s=[],f=RR(R,174,180);
  floorS(s,R,f,RI(R,12,16));var x0=RR(R,40,60),n=12,y0=f-70;
  s.push([[x0-6,y0+20],[x0+210,y0+44]]);s.push([[x0-6,y0-20],[x0+210,y0-4]]);
  for(var i=0;i<n;i++){var x=x0+i*17,h=60-i*3.2,yc=y0+i*1.6;var bar=[[x,yc-h/2],[x+13,yc-h/2],[x+13,yc+h/2],[x,yc+h/2]];s.push(poly(bar));H(s,bar,RR(R,1.8,2.4),90);s.push(circle(x+6.5,yc-h/2+5,1.4));s.push(circle(x+6.5,yc+h/2-5,1.4));}
  [x0+10,x0+200].forEach(function(lx){s.push([[lx,y0+24],[lx-10,f]]);s.push([[lx,y0+24],[lx+10,f]]);});
  var m1=RR(R,0.4,0.8);[[x0+60,y0-30,m1],[x0+120,y0-36,-m1]].forEach(function(m){var e=[m[0]+70*Math.cos(m[2]-PI/2),m[1]+70*Math.sin(m[2]-PI/2)];s.push([[m[0],m[1]],e]);s.push(circle(m[0],m[1],5));});
  HX(s,[[[4,4],[296,4],[296,f],[4,f]],[[x0-12,f],[x0-12,y0-40],[x0+60,y0-110],[x0+220,y0-110],[x0+220,f]]],RR(R,5.5,6.5),RR(R,40,50));return s;}},

{name:'Claw hammer and nails',titles:['Workbench Still Life','Hit It Square','Sixteen-Penny','Saturday Project'],build(R){var s=[],t=RR(R,148,156);
  var x=RR(R,50,80),y=t-14;var hn=[[x,y-6],[x+150,y-9],[x+150,y+3],[x,y+6]];s.push(poly(hn));H(s,hn,2.2,1);s.push(ellipse(x+2,y,3,6));for(var gr=0;gr<4;gr++)s.push([[x+10+gr*6,y-6],[x+10+gr*6,y+6]]);
  var face=[[x+150,y-12],[x+170,y-12],[x+172,y-8],[x+172,y+10],[x+150,y+10]];s.push(poly(face));H(s,face,1.4,90);var nk=[[x+152,y-12],[x+154,y-36],[x+168,y-36],[x+170,y-12]];s.push(poly(nk));H(s,nk,1.4,0);
  var cl=[[x+154,y-36]].concat(curve([[x+154,y-36],[x+144,y-50],[x+126,y-58],[x+116,y-56]],6)).concat(curve([[x+122,y-50],[x+140,y-44],[x+150,y-34]],5)).concat([[x+168,y-36]]);s.push(cl);H(s,cl,1.6,30);
  for(var k=0;k<RI(R,5,8);k++){var nx=RR(R,20,280),ny=t+RR(R,12,30),a=RR(R,-0.4,0.4);s.push(rotateAbout([[nx-18,ny],[nx+14,ny]],nx,ny,a));s.push(rotateAbout([[nx-18,ny-3],[nx-18,ny+3]],nx,ny,a));}
  var wood=[[4,t],[296,t],[296,196],[4,196]];var g=[];for(var yy=t+4;yy<196;yy+=4)g.push(wave(4,296,yy,1.2,RR(R,40,70),R()*6));A(s,g);s.push([[4,t],[296,t]]);
  s.push(rows(4,296,8,t-4,RR(R,7,9)));
  var sp=RR(R,40,80);s.push([[sp,8],[sp,40]]);s.push(rect(sp-10,40,sp+10,70));H(s,[[sp-10,40],[sp+10,40],[sp+10,70],[sp-10,70]],1.6,90);
  return s;}},

{name:'Toolbox',titles:['Everything in Its Place','Dad\'s Red Box','Sockets and Screwdrivers','Lid Open'],build(R){var s=[],t=RR(R,158,164);
  var x=RR(R,70,90),w=140,h=56,y=t-h;s.push(rect(x,y,x+w,t));s.push([[x,y+14],[x+w,y+14]]);H(s,[[x,y+14],[x+w,y+14],[x+w,t],[x,t]],2.2,0);s.push(rect(x+w/2-10,y+20,x+w/2+10,y+28));
  var lid=[[x,y],[x-6,y-40],[x+w-6,y-40],[x+w,y]];s.push(lid);s.push([[x-6,y-40],[x+w-6,y-40]]);H(s,[[x+4,y-4],[x-2,y-36],[x+w-10,y-36],[x+w-4,y-4]],3,90);
  s.push([[x+20,y],[x+20,y-14],[x+w-20,y-14],[x+w-20,y]]);s.push([[x+w/2-20,y-14],[x+w/2-20,y-24],[x+w/2+20,y-24],[x+w/2+20,y-14]]);
  s.push([[x+30,y],[x+40,y-40],[x+44,y-50]]);s.push(rect(x+38,y-60,x+48,y-48));s.push([[x+60,y],[x+70,y-30]]);s.push(ellipse(x+72,y-36,5,8));
  s.push([[x+100,y],[x+110,y-36],[x+100,y-46],[x+112,y-52],[x+122,y-40],[x+112,y-36]]);
  var sx=x+w+20;s.push([[sx,t],[sx+60,t-6]]);s.push(rect(sx+50,t-14,sx+80,t-2));H(s,[[sx+50,t-14],[sx+80,t-14],[sx+80,t-2],[sx+50,t-2]],1.4,90);
  tableS(s,R,t,'diag',[[[x-10,t],[x-10,y-64],[x+w+4,y-64],[x+w+4,t]]]);return s;}},

{name:'Bench vise',titles:['Grip and Hold','Cast Iron Jaw','Workshop Corner','Quarter Turn'],build(R){var s=[],t=RR(R,140,148);
  var x=RR(R,80,110);var bb=[[4,t],[296,t],[296,t+14],[4,t+14]];s.push(poly(bb));H(s,bb,2,0);s.push([[20,t+14],[20,196]]);s.push([[280,t+14],[280,196]]);H(s,[[20,t+14],[30,t+14],[30,196],[20,196]],1.6,90);
  var base=[[x,t],[x+10,t-20],[x+90,t-20],[x+100,t]];s.push(poly(base));H(s,base,1.6,0);
  var fj=[[x+10,t-20],[x+10,t-70],[x+30,t-70],[x+30,t-20]];s.push(poly(fj));H(s,fj,1.6,90);var mj=[[x+44,t-20],[x+44,t-70],[x+64,t-70],[x+64,t-20]];s.push(poly(mj));H(s,mj,1.6,90);
  s.push(rect(x+30,t-66,x+44,t-60));for(var k=0;k<5;k++)s.push([[x+31+k*3,t-66],[x+31+k*3,t-60]]);
  s.push(rect(x+30,t-36,x+120,t-30));s.push([[x+120,t-50],[x+120,t-16]]);s.push(circle(x+120,t-52,3));s.push(circle(x+120,t-14,3));
  s.push(rect(x+64,t-34,x+100,t-24));var wp=[[x+30,t-70],[x+20,t-100],[x+54,t-100],[x+44,t-70]];
  var pb=[[4,4],[296,4],[296,t],[4,t]];var tools=[];for(var tl=0;tl<5;tl++){var tx=170+tl*24;s.push([[tx,20],[tx,26]]);if(tl%2){s.push([[tx,26],[tx,80]]);s.push(rect(tx-4,80,tx+4,104));}else{s.push(rect(tx-3,26,tx+3,60));s.push([[tx,60],[tx,90]]);}}
  s.push(brickS(4,4,296,t,20,10));return s;}},

{name:'Axe in a chopping block',titles:['Woodpile Chores','Splitting Rounds','Stump and Steel','Before the Snow'],build(R){var s=[],g=RR(R,168,174);
  ground(s,R,g,RR(R,3.6,4.2));var cx=RR(R,110,140),r=40,top=g-46;
  s.push(ellipse(cx,top,r,12));for(var rr=6;rr<r;rr+=6)s.push(ellipse(cx,top,rr,rr*0.3));s.push([[cx-r,top],[cx-r+2,g]]);s.push([[cx+r,top],[cx+r-2,g]]);
  for(var k=0;k<9;k++){var x=cx-r+8+k*9;s.push(curve([[x,top+12],[x+RR(R,-2,2),top+26],[x+RR(R,-2,2),g]],5));}
  var a=RR(R,-0.35,-0.15);var hx=cx+6,hy=top-4;var bl=rotateAbout([[hx-12,hy-4],[hx+10,hy-6],[hx+16,hy-26],[hx-16,hy-26]],hx,hy,a*0.3);F(s,bl,1.4,0);
  var hl=[[hx-2,hy-24],[hx+90*Math.cos(a-PI/2.6),hy-24+90*Math.sin(a-PI/2.6)]];s.push(hl);s.push(hl.map(function(p){return [p[0]+5,p[1]+1];}));
  var wp=RR(R,190,230);for(var lg=0;lg<3;lg++)for(var c=0;c<4-lg;c++){var lx=wp+c*20+lg*10,ly=g-8-lg*16;s.push(circle(lx,ly,8));s.push(circle(lx,ly,3));}
  for(var ch=0;ch<6;ch++){var chx=RR(R,30,cx+60),chy=g+RR(R,6,20);s.push(poly([[chx,chy],[chx+8,chy-2],[chx+10,chy+2],[chx+2,chy+4]]));}
  var tr=RR(R,20,50);treeR(s,R,tr,g,18,2.4);
  skyFill(s,g,7,RR(R,4,5),5,[EP(cx,top+10,r+2,30)]);return s;}},

{name:'Wheelbarrow',titles:['Full Load','Garden Hauler','Spring Mulch','One Wheel, Two Handles'],build(R){var s=[],g=RR(R,168,174);
  ground(s,R,g,RR(R,3.4,4));var x=RR(R,80,100),y=g-50;
  var tray=[[x,y-30],[x+120,y-34],[x+100,y+10],[x+30,y+10]];s.push(poly(tray));H(s,[[x+10,y-20],[x+112,y-24],[x+98,y+6],[x+32,y+6]],2.4,RR(R,20,40));
  var load=scallop(x+60,y-34,58,14,10,0.15).filter(function(p){return p[1]<y-30;});if(load.length>2)s.push(load);
  wheel(s,x+132,g-18,18,10,1.6);s.push([[x+100,y+6],[x+132,g-18]]);s.push([[x+110,y-20],[x+132,g-18]]);
  s.push([[x+30,y+10],[x+20,g]]);s.push([[x+60,y+10],[x+56,g]]);s.push([[x+20,y-10],[x-40,y-30]]);s.push([[x+20,y-4],[x-40,y-24]]);s.push(rect(x-52,y-32,x-40,y-24));
  var sh=[[x+150,g],[x+160,g-70],[x+166,g-70],[x+158,g]];s.push(sh);s.push(rect(x+156,g-84,x+172,g-70));
  var bed=[[4,g],[60,g],[60,g-10],[4,g-10]];s.push(bed);for(var p=0;p<4;p++){var px=10+p*14;s.push([[px,g-10],[px,g-24]]);s.push(circle(px,g-28,4));}
  skyFill(s,g,7,RR(R,4,5),5,[tray]);return s;}},

{name:'Anvil and hammer',titles:['Ringing Iron','The Smithy','Heat and Horn','Forged by Hand'],build(R){var s=[],f=RR(R,172,178);
  floorS(s,R,f,RI(R,12,16));var cx=RR(R,130,160),top=f-80;
  var anv=[[cx-80,top],[cx+50,top],[cx+50,top+16],[cx+30,top+26],[cx+30,top+40],[cx+48,top+52],[cx-48,top+52],[cx-30,top+40],[cx-30,top+26],[cx-50,top+16]].concat(quad([cx-50,top+16],[cx-70,top+16],[cx-96,top+4])).concat([[cx-80,top]]);s.push(anv);
  H(s,[[cx-30,top+26],[cx+30,top+26],[cx+30,top+40],[cx-30,top+40]],1.6,0);H(s,[[cx-48,top+52],[cx+48,top+52],[cx+30,top+40],[cx-30,top+40]],2,90);
  s.push(rect(cx-50,top+52,cx+50,f));H(s,[[cx-50,top+52],[cx+50,top+52],[cx+50,f],[cx-50,f]],2.6,RR(R,60,80));
  var hx=cx+10,hy=top-4;s.push(rect(hx-6,hy-14,hx+16,hy));s.push([[hx+16,hy-8],[hx+70,hy-30]]);s.push([[hx+16,hy-4],[hx+70,hy-26]]);
  var fg=[[4,f],[4,f-110],[70,f-110],[70,f]];s.push(fg);s.push(brickS(4,f-110,70,f,12,6));var fire=[[16,f-60]];for(var k=0;k<6;k++)fire.push([20+k*8,f-60-(k%2?20:8)]);fire.push([66,f-60]);s.push(fire);s.push(rect(10,f-62,64,f-56));
  var tongs=[[cx+60,top],[cx+110,top-40]];s.push(tongs);s.push([[cx+64,top],[cx+116,top-38]]);
  HX(s,[[[70,4],[296,4],[296,f],[70,f]],[[cx-100,f],[cx-100,top-20],[cx+120,top-50],[cx+120,f]]],RR(R,4.2,4.8),90);return s;}},

{name:'Spinning wheel',titles:['Wool to Yarn','Treadle and Spindle','Winter Evenings','The Spinner\'s Chair'],build(R){var s=[],f=RR(R,174,180);
  floorS(s,R,f,RI(R,12,16));var cx=RR(R,110,140),cy=f-80,r=46;s.push(circle(cx,cy,r));s.push(circle(cx,cy,r-5));s.push(circle(cx,cy,5));for(var k=0;k<12;k++){var a=k*TAU/12;s.push([[cx+5*Math.cos(a),cy+5*Math.sin(a)],[cx+(r-5)*Math.cos(a),cy+(r-5)*Math.sin(a)]]);}
  var tb=[[cx-30,f-34],[cx+120,f-50]];s.push(tb);s.push([[cx-30,f-28],[cx+120,f-44]]);[[cx-24,f],[cx+40,f],[cx+110,f]].forEach(function(l){s.push([[l[0],f-30],[l[0]-6,f]]);});
  s.push([[cx-6,f-32],[cx-4,cy]]);s.push([[cx+6,f-34],[cx+4,cy]]);s.push(rect(cx-30,f-8,cx+30,f-2));
  var mx=cx+100;s.push([[mx,f-48],[mx,cy-20]]);s.push(ellipse(mx+14,cy-22,18,6));s.push(ellipse(mx+14,cy-22,8,10));s.push([[cx,cy-r],[mx+10,cy-28]]);s.push([[cx,cy+r],[mx+10,cy-16]]);
  var bs=[[mx+40,f],[mx+44,f-26],[mx+80,f-26],[mx+84,f]];s.push(bs);for(var y=0;y<3;y++)s.push(arc(mx+62,f-26-y*6,16,6,PI,TAU));
  HX(s,[[[4,4],[296,4],[296,f],[4,f]],EP(cx,cy,r+3,r+3),[[cx-40,f],[cx-40,f-40],[mx+40,cy-40],[mx+90,cy-40],[mx+90,f]]],RR(R,5,6),0);return s;}},

{name:'Treadle sewing machine',titles:['Grandmother\'s Machine','Bobbin and Thread','Stitch by Stitch','Iron Lace Legs'],build(R){var s=[],f=RR(R,174,180);
  floorS(s,R,f,RI(R,12,16));var x=RR(R,60,80),tt=f-74;var top=[[x,tt],[x+170,tt],[x+170,tt+8],[x,tt+8]];s.push(poly(top));H(s,top,1.6,0);s.push(rect(x+10,tt+8,x+60,tt+30));s.push(circle(x+35,tt+19,2));
  var body=[[x+40,tt],[x+40,tt-50]].concat(arc(x+56,tt-50,16,10,PI,1.5*PI)).concat([[x+120,tt-60],[x+130,tt-52],[x+130,tt-34],[x+118,tt-30],[x+70,tt-30],[x+66,tt]]);s.push(body);H(s,body,2,RR(R,20,40));
  s.push([[x+124,tt-30],[x+124,tt-8]]);s.push(rect(x+118,tt-12,x+130,tt-8));s.push(ellipse(x+30,tt-36,8,14));s.push(rect(x+80,tt-70,x+86,tt-60));s.push(ellipse(x+83,tt-74,4,6));
  [x+14,x+156].forEach(function(lx){var lg=[[lx-10,f],[lx-6,tt+8],[lx+6,tt+8],[lx+10,f]];s.push(lg);for(var k=0;k<3;k++)s.push(circle(lx,tt+28+k*20,5));});s.push(rect(x+40,f-14,x+130,f-6));H(s,[[x+40,f-14],[x+130,f-14],[x+130,f-6],[x+40,f-6]],1.4,45);
  s.push(circle(x+150,f-40,18));s.push(circle(x+150,f-40,4));for(var sp=0;sp<6;sp++){var a=sp*PI/3;s.push([[x+150,f-40],[x+150+18*Math.cos(a),f-40+18*Math.sin(a)]]);}
  HX(s,[[[4,4],[296,4],[296,f],[4,f]],[[x-4,f],[x-4,tt-80],[x+176,tt-80],[x+176,f]]],RR(R,6,7),RR(R,40,50));return s;}},

{name:'Typewriter',titles:['First Draft','Carriage Return','Letters Home','Ink Ribbon'],build(R){var s=[],t=RR(R,156,162);
  var x=RR(R,70,90),w=150;var body=[[x,t],[x+10,t-46],[x+w-10,t-46],[x+w,t]];s.push(poly(body));H(s,[[x+12,t-44],[x+w-12,t-44],[x+w-10,t-36],[x+10,t-36]],1.6,0);
  for(var r=0;r<4;r++){for(var k=0;k<10-r%2;k++){var kx=x+22+k*11.5+(r%2)*6,ky=t-8-r*8;s.push(circle(kx,ky,3.4));}}s.push(rect(x+40,t-6,x+110,t-2));
  var car=[[x-14,t-58],[x+w+14,t-58],[x+w+14,t-46],[x-14,t-46]];s.push(poly(car));s.push(ellipse(x-14,t-52,4,8));s.push(ellipse(x+w+14,t-52,4,8));s.push([[x+w+14,t-56],[x+w+30,t-70]]);
  var pap=[[x+30,t-58],[x+34,t-120],[x+116,t-120],[x+120,t-58]];s.push(poly(pap));for(var l=0;l<7;l++)s.push([[x+42,t-110+l*7],[x+42+RR(R,40,68),t-110+l*7]]);
  s.push(arc(x+w/2,t-46,30,10,PI,TAU));
  var mug=RR(R,250,270);cyl(s,mug,t,14,30,2);s.push(arc(mug-16,t-16,8,8,PI/2,1.5*PI));
  tableS(s,R,t,'stripes',[[[x-20,t],[x-20,t-62],[x+30,t-62],[x+34,t-124],[x+116,t-124],[x+120,t-62],[x+w+34,t-74],[x+w+34,t]],[[mug-26,t],[mug-26,t-36],[mug+16,t-36],[mug+16,t]]]);return s;}},

{name:'Padlock and key',titles:['Locked Tight','The Missing Key','Brass Shackle','Old Gate Lock'],build(R){var s=[],cx=RR(R,130,160),cy=RR(R,100,110);
  var sh1=[[cx-26,cy-30],[cx-26,cy-56]].concat(arc(cx,cy-56,26,26,PI,TAU)).concat([[cx+26,cy-30]]);var sh2=[[cx-16,cy-30],[cx-16,cy-56]].concat(arc(cx,cy-56,16,16,PI,TAU)).concat([[cx+16,cy-30]]);s.push(sh1);s.push(sh2);H(s,sh1.concat(sh2.slice().reverse()),1.4,0);
  var body=[[cx-40,cy-30],[cx+40,cy-30],[cx+40,cy+36],[cx-40,cy+36]];s.push(poly(body));H(s,[[cx+12,cy-30],[cx+40,cy-30],[cx+40,cy+36],[cx+12,cy+36]],1.6,90);s.push(circle(cx,cy,7));s.push([[cx,cy+6],[cx,cy+18]]);
  var g=[[4,cy-30],[296,cy-30]];var bars=[];for(var x=14;x<296;x+=22){if(Math.abs(x-cx)<48)continue;bars.push([[x,4],[x,196]]);}A(s,bars);s.push([[4,cy-36],[cx-40,cy-36]]);s.push([[cx+40,cy-36],[296,cy-36]]);s.push([[4,cy-24],[cx-40,cy-24]]);s.push([[cx+40,cy-24],[296,cy-24]]);
  var ch=[];for(var k=0;k<6;k++){var lx=cx-20+k*0;}
  var kx=cx+40,ky=cy+60;s.push(circle(kx+10,ky,10));s.push(circle(kx+10,ky,4));s.push([[kx+20,ky],[kx+70,ky]]);s.push([[kx+20,ky+4],[kx+70,ky+4]]);s.push([[kx+60,ky+4],[kx+60,ky+12],[kx+64,ky+12],[kx+64,ky+4]]);s.push([[kx+68,ky+4],[kx+68,ky+10],[kx+70,ky+10]]);
  s.push(curve([[cx-26,cy+36],[cx-30,cy+60],[kx+4,ky-6]],6));
  var bg=[];A(bg,hatch([[4,4],[296,4],[296,196],[4,196]],RR(R,4.5,5.5),RR(R,30,60)));behind(s,bg,[[[cx-44,cy+40],[cx-44,cy-34],[cx-30,cy-60],[cx,cy-86],[cx+30,cy-60],[cx+44,cy-34],[cx+44,cy+40]],EP(kx+10,ky,14,14),[[kx+18,ky-4],[kx+74,ky-4],[kx+74,ky+16],[kx+18,ky+16]]]);
  return s;}},

{name:'Magnifying glass on a map',titles:['Finding the Way','Close Reading','The Old Chart','X Marks Somewhere'],build(R){var s=[];var mp=[[14,14],[286,10],[290,186],[10,190]];s.push(poly(mp));
  for(var x=40;x<290;x+=40)s.push([[x,12],[x,188]]);for(var y=40;y<190;y+=40)s.push([[12,y],[288,y]]);
  var coast=curve([[14,60],[60,50],[90,80],[80,120],[120,150],[170,130],[200,160],[260,150],[288,170]],8);s.push(coast);H(s,coast.concat([[288,188],[14,188]]),RR(R,4,5),0);
  for(var i=0;i<4;i++){var mx=RR(R,140,260),my=RR(R,40,100);s.push([[mx-8,my+6],[mx,my-6],[mx+8,my+6]]);}var rv=curve([[90,30],[110,60],[150,70],[170,110]],8);s.push(rv);
  s.push(spiral(240,50,2,14,1.5));for(var k=0;k<8;k++){var a=k*PI/4;s.push([[240,50],[240+18*Math.cos(a),50+18*Math.sin(a)]]);}
  var cx=RR(R,110,150),cy=RR(R,90,110),r=36;s.push(circle(cx,cy,r));s.push(circle(cx,cy,r+6));HX(s,[EP(cx,cy,r+6,r+6),EP(cx,cy,r,r)],1.4,0);
  var a2=RR(R,0.5,0.9);var hb=[cx+(r+6)*Math.cos(a2),cy+(r+6)*Math.sin(a2)];var he=[hb[0]+70*Math.cos(a2),hb[1]+70*Math.sin(a2)];var nm=[-Math.sin(a2)*6,Math.cos(a2)*6];var hd=[[hb[0]+nm[0],hb[1]+nm[1]],[he[0]+nm[0],he[1]+nm[1]],[he[0]-nm[0],he[1]-nm[1]],[hb[0]-nm[0],hb[1]-nm[1]]];s.push(poly(hd));H(s,hd,1.6,a2*57);
  s.push(circle(cx-4,cy-2,10));s.push([[cx-10,cy-8],[cx+2,cy+4]]);s.push([[cx+2,cy-8],[cx-10,cy+4]]);
  return s;}},

{name:'Brass microscope',titles:['Under the Lens','Slide Number Nine','Small Worlds','Laboratory Bench'],build(R){var s=[],t=RR(R,156,162);
  var x=RR(R,110,140);var base=[[x-30,t],[x-20,t-14],[x+60,t-14],[x+70,t]];s.push(poly(base));H(s,base,1.6,0);
  var arm=curve([[x+40,t-14],[x+56,t-50],[x+50,t-90],[x+30,t-110]],8);s.push(arm);s.push(arm.map(function(p){return [p[0]+10,p[1]];}));H(s,arm.concat(arm.map(function(p){return [p[0]+10,p[1]];}).reverse()),1.4,0);
  var tube=rotateAbout([[x-8,t-150],[x+12,t-150],[x+12,t-70],[x-8,t-70]],x+2,t-110,-0.25);s.push(poly(tube));H(s,tube,1.6,75);var ep=rotateAbout([[x-4,t-166],[x+8,t-166],[x+8,t-150],[x-4,t-150]],x+2,t-110,-0.25);s.push(poly(ep));
  s.push(rect(x-20,t-60,x+40,t-54));s.push([[x+10,t-54],[x+10,t-14]]);s.push(circle(x+10,t-34,6));s.push(rect(x-4,t-62,x+24,t-60));
  s.push(circle(x+62,t-80,7));s.push(circle(x+62,t-80,3));
  var bk=[[x+100,t],[x+100,t-12],[x+160,t-12],[x+160,t]];s.push(poly(bk));s.push(rect(x+104,t-22,x+156,t-12));for(var sl=0;sl<3;sl++)s.push(rect(x-80+sl*14,t-4,x-70+sl*14,t));
  var fl=[[x+180,t],[x+176,t-30],[x+184,t-40],[x+184,t-60],[x+196,t-60],[x+196,t-40],[x+204,t-30],[x+200,t]];s.push(poly(fl));H(s,[[x+178,t-20],[x+202,t-20],[x+200,t],[x+180,t]],1.4,0);
  tableS(s,R,t,'tiles',[[[x-40,t],[x-40,t-172],[x+70,t-172],[x+70,t]],[[x+96,t],[x+96,t-26],[x+210,t-64],[x+210,t]]]);return s;}},

{name:'Globe on a stand',titles:['Whole World, Desk Size','Spin It and Point','Old Borders','Study at Night'],build(R){var s=[],t=RR(R,158,164);
  var cx=RR(R,130,170),cy=t-80,r=50;var gl=EP(cx,cy,r,r);s.push(poly(gl));for(var m=-2;m<=2;m++){s.push(arc(cx,cy,Math.abs(m)*r/3+0.1,r,-PI/2,PI/2).map(function(p){return [m<0?2*cx-p[0]:p[0],p[1]];}));}for(var l=-2;l<=2;l++){var yy=cy+l*r/3,hw=Math.sqrt(r*r-Math.pow(l*r/3,2));s.push([[cx-hw,yy],[cx+hw,yy]]);}
  var land=blob([[cx-30,cy-30],[cx-6,cy-36],[cx+4,cy-14],[cx-12,cy+4],[cx-4,cy+30],[cx-22,cy+20],[cx-34,cy-4]],6);s.push(poly(land));H(s,land,1.6,30);var land2=blob([[cx+14,cy-20],[cx+34,cy-28],[cx+42,cy-4],[cx+26,cy+12],[cx+16,cy-2]],6);s.push(poly(land2));H(s,land2,1.6,-30);HX(s,[gl,land,land2],3.2,0);
  s.push(arc(cx,cy,r+8,r+8,PI*0.55,PI*1.95));s.push(arc(cx,cy,r+12,r+12,PI*0.55,PI*1.95));
  s.push([[cx,cy+r+10],[cx,t-14]]);s.push(ellipse(cx,t-8,30,6));s.push([[cx-30,t-8],[cx-30,t-2]]);s.push([[cx+30,t-8],[cx+30,t-2]]);s.push(arc(cx,t-2,30,6,0,PI));
  var bks=RR(R,30,60);for(var b=0;b<4;b++){var bw=RR(R,8,12),bh=RR(R,40,56),bx=bks+b*13;s.push(rect(bx,t-bh,bx+bw,t));s.push([[bx,t-bh+8],[bx+bw,t-bh+8]]);}
  tableS(s,R,t,'stripes',[[[cx-r-16,t],[cx-r-16,cy-r-16],[cx+r+16,cy-r-16],[cx+r+16,t]],[[bks-2,t],[bks-2,t-60],[bks+56,t-60],[bks+56,t]]]);return s;}},

{name:'Brass sextant',titles:['Noon Sight','Shooting the Sun','Navigator\'s Arc','Latitude by Hand'],build(R){var s=[],t=RR(R,154,160);
  var px=RR(R,120,150),py=t-140;var arcp=arc(px,py,110,110,PI*0.34,PI*0.66);s.push(arcp);s.push(arc(px,py,100,100,PI*0.34,PI*0.66));for(var k=0;k<=30;k++){var a=PI*0.34+k*(PI*0.32)/30;s.push([[px+100*Math.cos(a),py+100*Math.sin(a)],[px+(k%5?104:108)*Math.cos(a),py+(k%5?104:108)*Math.sin(a)]]);}
  var e1=[px+110*Math.cos(PI*0.34),py+110*Math.sin(PI*0.34)],e2=[px+110*Math.cos(PI*0.66),py+110*Math.sin(PI*0.66)];s.push([[px,py],e1]);s.push([[px,py],e2]);s.push([[px+3,py],[e1[0]+3,e1[1]]]);s.push([[px-3,py],[e2[0]-3,e2[1]]]);
  var fr=[[px,py+30],[px+30,py+70],[px-30,py+70]];s.push(poly(fr));H(s,fr,1.6,0);var ia=RR(R,0.45,0.55)*PI;s.push([[px,py],[px+108*Math.cos(ia),py+108*Math.sin(ia)]]);
  s.push(rect(px-6,py-6,px+6,py+6));s.push(rotateAbout(rect(px-50,py+40,px-20,py+50),px-35,py+45,0.2));s.push(rect(px+20,py+30,px+40,py+46));
  var ch=[[4,t],[296,t],[296,196],[4,196]];var chart=[[20,t+4],[280,t+2],[284,194],[16,194]];s.push(poly(chart));for(var gx=40;gx<280;gx+=30)s.push([[gx,t+4],[gx,194]]);
  H(s,chart,RR(R,4.5,5.5),RR(R,20,40));var cmp=RR(R,230,260);s.push(circle(cmp,t+20,10));s.push([[cmp,t+10],[cmp,t+30]]);
  tableS(s,R,t,'diag',[[[px-80,t],[px-80,py-10],[px+80,py-10],[px+80,t]]]);return s;}},

{name:'Rotary telephone',titles:['Party Line','Ring Twice','Dial Zero','The Hall Table'],build(R){var s=[],t=RR(R,156,162);
  var cx=RR(R,120,160),y=t;var body=[[cx-56,y]].concat(curve([[cx-56,y],[cx-50,y-40],[cx-30,y-56],[cx+30,y-56],[cx+50,y-40],[cx+56,y]],8)).concat([[cx-56,y]]);s.push(body);H(s,body.slice(0,-1),2.2,RR(R,60,80));
  s.push(ellipse(cx,y-26,30,18));s.push(ellipse(cx,y-26,10,6));for(var k=0;k<10;k++){var a=PI*0.3+k*PI*1.4/9;s.push(circle(cx+20*Math.cos(a),y-26+12*Math.sin(a),3));}
  var hs=[[cx-70,y-66],[cx-56,y-80],[cx+56,y-80],[cx+70,y-66],[cx+56,y-58],[cx+40,y-66],[cx-40,y-66],[cx-56,y-58]];s.push(poly(hs));H(s,hs,1.6,0);
  var cord=[];for(var c=0;c<40;c++){var u=c/40;cord.push([cx+56+u*80+4*Math.sin(u*40),y-10+u*20+4*Math.cos(u*40)]);}s.push([[cx+56,y-10]].concat(cord));
  var nb=RR(R,30,60);s.push(rect(nb-20,y-8,nb+30,y));for(var pg=0;pg<4;pg++)s.push([[nb-16,y-8-pg*2],[nb+26,y-8-pg*2]]);s.push([[nb+32,y-2],[nb+60,y-30]]);
  tableS(s,R,t,'stripes',[[[cx-76,t],[cx-76,y-86],[cx+76,y-86],[cx+76,t]],[[nb-24,t],[nb-24,y-12],[nb+64,y-36],[nb+64,t]]]);return s;}}
);

SUBJ.push(
{name:'Cast iron skillet with eggs',titles:['Sunny Side Up','Sunday Breakfast','Two Yolks','Butter and Iron'],build(R){var s=[],t=RR(R,156,162);
  var cx=RR(R,120,150),cy=t-26,rx=78,ry=26;s.push(ellipse(cx,cy,rx,ry));s.push(ellipse(cx,cy,rx-8,ry-6));s.push([[cx-rx,cy],[cx-rx+4,cy+14]].concat(arc(cx,cy+14,rx-4,ry-2,PI,0)).concat([[cx+rx,cy]]));
  H(s,[[cx-rx,cy]].concat(arc(cx,cy,rx,ry,PI,0)).concat([[cx+rx,cy],[cx+rx-4,cy+14]]).concat(arc(cx,cy+14,rx-4,ry-2,0,PI)),2.2,0);
  var hdl=[[cx+rx-4,cy-6],[cx+rx+70,cy-14],[cx+rx+72,cy-6],[cx+rx-2,cy+4]];s.push(poly(hdl));H(s,hdl,1.6,0);s.push(ellipse(cx+rx+62,cy-10,4,2));
  [[cx-26,cy-2],[cx+22,cy+4]].forEach(function(e){var wh=blob([[e[0]-22,e[1]],[e[0]-14,e[1]-10],[e[0]+6,e[1]-12],[e[0]+22,e[1]-4],[e[0]+18,e[1]+8],[e[0]-8,e[1]+10]],6);s.push(poly(wh));var yk=EP(e[0],e[1]-1,8,5);s.push(poly(yk));H(s,yk,1,0);});
  var sp=RR(R,30,60);s.push([[sp,t-4],[sp+50,t-24]]);s.push(rect(sp+44,t-34,sp+64,t-18));
  var ins=[cx-110,t];s.push(circle(cx+rx+90,t-6,6));
  var pe=[];for(var k=0;k<5;k++){var px=RR(R,10,280);}
  var rows=[];tableS(s,R,t,'tiles',[[[cx-rx-6,t],[cx-rx-6,cy-ry-6],[cx+rx+80,cy-ry-6],[cx+rx+80,t]],[[sp-4,t],[sp-4,t-40],[sp+70,t-40],[sp+70,t]]]);return s;}},

{name:'Moka pot and cups',titles:['Stovetop Espresso','Gurgle at Seven','Two Small Cups','Aluminum and Steam'],build(R){var s=[],t=RR(R,156,162);
  var cx=RR(R,110,140);var bot=[[cx-30,t],[cx-24,t-46],[cx+24,t-46],[cx+30,t]];s.push(poly(bot));H(s,[[cx+6,t],[cx+6,t-46],[cx+24,t-46],[cx+30,t]],1.6,90);s.push(rect(cx-26,t-52,cx+26,t-46));
  var top=[[cx-24,t-52],[cx-30,t-100],[cx+30,t-100],[cx+24,t-52]];s.push(poly(top));H(s,[[cx+6,t-52],[cx+6,t-100],[cx+30,t-100],[cx+24,t-52]],1.6,90);s.push([[cx,t-46],[cx,t-100]]);s.push([[cx-12,t-46],[cx-14,t-100]]);s.push([[cx+12,t-46],[cx+14,t-100]]);
  s.push([[cx-30,t-100],[cx-38,t-96],[cx-30,t-86]]);var lid=[[cx-32,t-100],[cx,t-112],[cx+32,t-100]];s.push(lid);s.push(rect(cx-4,t-118,cx+4,t-112));
  var hd=[[cx+28,t-94],[cx+50,t-92],[cx+54,t-60],[cx+44,t-58],[cx+40,t-86],[cx+28,t-82]];s.push(poly(hd));H(s,hd,1.4,80);
  for(var st=0;st<3;st++)s.push(curve([[cx-34-st*6,t-100],[cx-42-st*6,t-116],[cx-34-st*6,t-128],[cx-42-st*6,t-140]],6));
  [[cx+90,1],[cx+140,1]].forEach(function(c){var x=c[0];var cup=[[x-14,t-6],[x-16,t-30],[x+16,t-30],[x+14,t-6]];s.push(poly(cup));s.push(arc(x+16,t-18,7,7,-PI/2,PI/2));s.push(ellipse(x,t-3,24,4));s.push(ellipse(x,t-30,16,3));H(s,cup,2,90);});
  tableS(s,R,t,'stripes',[[[cx-60,t],[cx-60,t-146],[cx+60,t-146],[cx+60,t]],[[cx+64,t],[cx+64,t-36],[cx+170,t-36],[cx+170,t]]]);return s;}},

{name:'Kettle on the stove',titles:['About to Whistle','Blue Flame','Tea in Five Minutes','Enamel and Steam'],build(R){var s=[],t=RR(R,150,156);
  var st=[[20,t],[280,t],[280,196],[20,196]];s.push(poly(st));s.push(rect(20,t,280,t+10));for(var k=0;k<4;k++)s.push(circle(60+k*60,t+5,3));var ov=[[40,t+18],[260,t+18],[260,192],[40,192]];s.push(poly(ov));s.push(rect(60,t+30,240,t+70));H(s,[[60,t+30],[240,t+30],[240,t+70],[60,t+70]],3,0);s.push([[80,t+22],[220,t+22]]);
  var cx=RR(R,120,180);s.push(ellipse(cx,t-2,40,4));for(var f=0;f<9;f++){var fx=cx-32+f*8;s.push([[fx,t-4],[fx+2,t-12],[fx+4,t-4]]);}
  var body=[[cx-46,t-12]].concat(curve([[cx-46,t-12],[cx-50,t-40],[cx-34,t-66],[cx,t-72],[cx+34,t-66],[cx+50,t-40],[cx+46,t-12]],8)).concat([[cx-46,t-12]]);s.push(body);shadeE(s,cx,t-40,48,30,2,0,1,0.45);
  s.push(ellipse(cx,t-72,16,4));s.push(circle(cx,t-80,4));var hd=arc(cx,t-72,40,40,PI*1.12,PI*1.88);s.push(hd);s.push(hd.map(function(p){return [p[0],p[1]+4];}));
  var sp=[[cx+40,t-40],[cx+66,t-62],[cx+74,t-64],[cx+70,t-56],[cx+46,t-26]];s.push(sp);for(var q=0;q<3;q++)s.push(curve([[cx+74,t-66-q*2],[cx+84+q*6,t-80-q*8],[cx+78+q*8,t-96-q*10],[cx+90+q*8,t-110-q*10]],6));
  
  var wall=[[4,4],[296,4],[296,t],[4,t]];HX(s,[wall,[[cx-60,t],[cx-60,t-120],[cx+120,t-130],[cx+120,t]]],RR(R,10,12),0);HX(s,[wall,[[cx-60,t],[cx-60,t-120],[cx+120,t-130],[cx+120,t]]],RR(R,10,12),90);
  return s;}},

{name:'Mortar and pestle',titles:['Ground by Hand','Pepper and Salt','Apothecary Bench','Stone Bowl'],build(R){var s=[],t=RR(R,156,162);
  var cx=RR(R,120,150),top=t-60;s.push(ellipse(cx,top,52,12));s.push(ellipse(cx,top,44,9));var bowl=[[cx-52,top]].concat(curve([[cx-52,top],[cx-48,top+30],[cx-26,top+50],[cx+26,top+50],[cx+48,top+30],[cx+52,top]],8));s.push(bowl);
  s.push(rect(cx-30,t-10,cx+30,t));s.push([[cx-26,top+50],[cx-30,t-10]]);s.push([[cx+26,top+50],[cx+30,t-10]]);H(s,bowl.concat(arc(cx,top,52,12,0,PI)),2.2,RR(R,50,70));
  var a=RR(R,-0.9,-0.6),p0=[cx+10,top+6],p1=[p0[0]+80*Math.cos(a),p0[1]+80*Math.sin(a)];var nm=[-Math.sin(a),Math.cos(a)];var ps=[[p0[0]+nm[0]*8,p0[1]+nm[1]*8],[p1[0]+nm[0]*5,p1[1]+nm[1]*5],[p1[0]-nm[0]*5,p1[1]-nm[1]*5],[p0[0]-nm[0]*8,p0[1]-nm[1]*8]];s.push(poly(ps));H(s,ps,1.6,a*57);
  var hb=[];for(var k=0;k<4;k++){var hx=RR(R,200,270),hy=t-RR(R,2,6);s.push(poly(EP(hx,hy,4,2.4)));}var lf=[[40,t]].concat(quad([40,t],[60,t-30],[80,t])) ;s.push(lf);for(var l=0;l<4;l++)s.push(quad([50+l*6,t],[58+l*6,t-16],[66+l*6,t-24]));
  var jar=[[220,t],[220,t-50],[260,t-50],[260,t]];s.push(poly(jar));s.push(rect(216,t-58,264,t-50));H(s,[[222,t-30],[258,t-30],[258,t-2],[222,t-2]],2,0);
  tableS(s,R,t,'diag',[[[cx-60,t],[cx-60,top-14],[p1[0]-10,p1[1]-10],[p1[0]+14,p1[1]-4],[cx+60,top-10],[cx+60,t]],[[214,t],[214,t-60],[266,t-60],[266,t]],[[36,t],[36,t-34],[86,t-34],[86,t]]]);return s;}},

{name:'Layer cake on a stand',titles:['Birthday Afternoon','Three Layers','Frosting and Crumbs','The First Slice'],build(R){var s=[],t=RR(R,156,162);
  var cx=RR(R,130,160),w=64;s.push(ellipse(cx,t-4,30,5));s.push([[cx-6,t-4],[cx-6,t-30]]);s.push([[cx+6,t-4],[cx+6,t-30]]);s.push(ellipse(cx,t-32,w+14,8));
  var lay=[[t-40,t-62],[t-62,t-84],[t-84,t-106]];lay.forEach(function(l,i){s.push([[cx-w,l[0]],[cx-w,l[1]]]);s.push([[cx+w,l[0]],[cx+w,l[1]]]);s.push(arc(cx,l[0],w,10,0,PI));H(s,[[cx-w,l[0]-4],[cx+w,l[0]-4],[cx+w,l[1]+4],[cx-w,l[1]+4]],i%2?3:2.2,i%2?0:90);});
  s.push(ellipse(cx,t-106,w,10));s.push(scallopRows(cx-w,cx+w,t-100,t-100,8,4));
  var cut=[[cx+10,t-106],[cx+44,t-112],[cx+44,t-40],[cx+10,t-34]];
  for(var c=0;c<5;c++){var x=cx-40+c*20;s.push(rect(x-2,t-130,x+2,t-110));s.push([[x,t-130],[x-2,t-136],[x,t-140],[x+2,t-136],[x,t-130]]);}
  var pl=RR(R,230,260);s.push(ellipse(pl,t-3,30,5));var sl=[[pl-16,t-6],[pl+20,t-10],[pl+16,t-34],[pl-16,t-30]];s.push(poly(sl));H(s,sl,2.4,0);s.push([[pl+30,t-4],[pl+60,t-10]]);
  tableS(s,R,t,'stripes',[[[cx-w-20,t],[cx-w-20,t-144],[cx+w+20,t-144],[cx+w+20,t]],[[pl-34,t],[pl-34,t-40],[pl+64,t-40],[pl+64,t]]]);return s;}},

{name:'Bread loaf and knife',titles:['Fresh from the Oven','Crust and Crumb','Baker\'s Morning','Sourdough Day'],build(R){var s=[],t=RR(R,156,162);
  var bd=[[30,t],[270,t],[274,t+10],[26,t+10]];s.push(poly(bd));
  var cx=RR(R,110,140);var loaf=[[cx-70,t]].concat(curve([[cx-70,t],[cx-76,t-30],[cx-50,t-56],[cx,t-62],[cx+50,t-56],[cx+70,t-30],[cx+64,t]],8));s.push(loaf);
  for(var k=0;k<4;k++){var sx=cx-40+k*26;s.push(curve([[sx-10,t-40],[sx,t-52],[sx+12,t-48]],5));}H(s,arc(cx,t,70,60,-PI/2,0).concat(arc(cx,t,40,56,0,-PI/2)),2.2,0);
  var sl=[cx+80,t];for(var q=0;q<2;q++){var x=sl[0]+q*14;var p=[[x,t]].concat(curve([[x,t],[x-4,t-28],[x+6,t-50],[x+10,t-48]],6));s.push(p);s.push(p.map(function(pp){return [pp[0]+10,pp[1]];}));}
  var kn=[[cx-60,t+18],[cx+100,t+14],[cx+104,t+20],[cx-60,t+22]];s.push(poly(kn));s.push(rect(cx-110,t+16,cx-60,t+24));H(s,[[cx-110,t+16],[cx-60,t+16],[cx-60,t+24],[cx-110,t+24]],1.4,0);
  for(var c=0;c<6;c++)s.push(circle(RR(R,40,260),t+RR(R,4,8),1));
  var ch=[[40,t],[40,t-20],[70,t-20],[70,t]];
  tableS(s,R,t,'tiles',[[[cx-82,t],[cx-82,t-68],[cx+120,t-68],[cx+120,t]]]);return s;}},

{name:'Bowl of cherries',titles:['Summer Bowl','Pairs on Stems','Ripe in July','Kitchen Window Fruit'],build(R){var s=[],t=RR(R,156,162);
  var cx=RR(R,130,160),top=t-44;var bowl=[[cx-70,top]].concat(curve([[cx-70,top],[cx-60,top+28],[cx-30,top+40],[cx+30,top+40],[cx+60,top+28],[cx+70,top]],8)).concat([[cx-70,top]]);s.push(bowl);s.push(rect(cx-24,top+40,cx+24,t));
  H(s,bowl.slice(0,-1),2.4,RR(R,60,80));var ch=[];for(var k=0;k<14;k++){var a=PI+(k+0.5)/14*PI,rr=R()*0.6+0.4;ch.push([cx+62*rr*Math.cos(a)*1.0,top-4+16*rr*Math.sin(a)]);}
  ch.forEach(function(c){s.push(circle(c[0],c[1],8));shadeE(s,c[0],c[1],8,8,1.4,0,1,0.3);s.push(quad([c[0],c[1]-8],[c[0]+4,c[1]-24],[c[0]+12,c[1]-30]));});
  for(var j=0;j<3;j++){var x=cx+90+j*18,y=t-8;s.push(circle(x,y,8));H(s,EP(x,y,8,8),1.6,40);s.push(quad([x,y-8],[x+6,y-22],[x+14,y-28]));}
  tableS(s,R,t,'diag',[[[cx-80,t],[cx-80,top-40],[cx+80,top-40],[cx+80,t]],[[cx+78,t],[cx+78,t-40],[cx+150,t-40],[cx+150,t]]]);return s;}},

{name:'Watermelon slices',titles:['Picnic Wedges','Seeds and Sun','August Porch','Rind and All'],build(R){var s=[],t=RR(R,156,162);
  var pl=[[20,t],[280,t],[288,t+10],[12,t+10]];s.push(poly(pl));var n=RI(R,3,4);for(var i=0;i<n;i++){var cx=60+i*(180/(n-1)),r=RR(R,38,46),a=RR(R,-0.15,0.15);
    var outer=rotateAbout([[cx-r,t]].concat(arc(cx,t,r,r,PI,TAU)).concat([[cx+r,t]]),cx,t,a);var inner=rotateAbout(arc(cx,t,r-7,r-7,PI,TAU),cx,t,a);s.push(outer);s.push(inner);H(s,outer.concat(inner.slice().reverse()),1.4,90);
    for(var k=0;k<7;k++){var aa=PI+0.4+k*0.35,rr=(r-16)*(0.5+0.4*(k%2));var sp=rotateAbout([[cx+rr*Math.cos(aa),t+rr*Math.sin(aa)]],cx,t,a)[0];var sd=EP(sp[0],sp[1],1.6,2.6);s.push(poly(sd));H(s,sd,0.8,0);}}
  var nap=[[230,t],[260,t-4],[290,t]];
  tableS(s,R,t,'stripes',[[[10,t],[10,t-56],[290,t-56],[290,t]]]);return s;}},

{name:'Ice cream cone',titles:['Two Scoops, Melting','Boardwalk Treat','Waffle and Cream','Before It Drips'],build(R){var s=[],cx=RR(R,130,170),y=RR(R,100,110);
  var cone=[[cx-30,y],[cx,y+86],[cx+30,y]];s.push(poly(cone));for(var k=-4;k<=6;k++){s.push([[cx-30+k*10,y],[cx+k*5+20,y+60]]);s.push([[cx+30-k*10,y],[cx-k*5-20,y+60]]);}
  var sc1=scallop(cx,y-6,36,18,10,0.12).filter(function(p){return p[1]<y+4;});s.push(sc1);var sc2=scallop(cx+4,y-38,30,22,9,0.12).filter(function(p){return p[1]<y-24;});s.push(sc2);
  H(s,EP(cx+4,y-38,28,20),2,0);s.push(curve([[cx+20,y],[cx+22,y+12],[cx+18,y+20]],5));s.push(circle(cx+6,y-62,6));s.push([[cx+6,y-68],[cx+12,y-78]]);
  var hand=[[cx-20,y+60],[cx-40,y+64],[cx-50,y+96],[cx-20,y+100],[cx+14,y+80]];
  var bg=[];for(var k2=0;k2<26;k2++){var r=24+k2*8;bg.push(arc(cx,y-20,r,r*0.8,0,TAU));}behind(s,bg,[[[cx-42,y+4],[cx-38,y-40],[cx-20,y-64],[cx+20,y-72],[cx+40,y-48],[cx+42,y+4],[cx+34,y+4],[cx,y+90],[cx-34,y+4]]]);
  return s;}},

{name:'Pancake stack',titles:['Short Stack','Syrup Run','Butter Pat','Weekend Breakfast'],build(R){var s=[],t=RR(R,156,162);
  var cx=RR(R,130,160);s.push(ellipse(cx,t-6,84,10));s.push(ellipse(cx,t-6,70,7));var n=RI(R,5,7),h=10;
  for(var i=0;i<n;i++){var y=t-14-i*h,w=62-i*1.2;s.push(arc(cx,y,w,8,0,PI));s.push([[cx-w,y],[cx-w,y-h]]);s.push([[cx+w,y],[cx+w,y-h]]);if(i%2===0)H(s,[[cx-w,y-1],[cx+w,y-1],[cx+w,y-h+1],[cx-w,y-h+1]],1.6,0);}
  var ty=t-14-n*h;s.push(ellipse(cx,ty,62-n*1.2,8));s.push(rect(cx-10,ty-10,cx+10,ty-2));var syr=[[cx-30,ty+2],[cx-34,ty+20],[cx-30,ty+34],[cx-26,ty+20],[cx-22,ty+4]];s.push(syr);H(s,syr,1,90);
  var jug=RR(R,230,260);s.push([[jug-14,t],[jug-18,t-40],[jug+18,t-40],[jug+14,t]]);s.push([[jug-18,t-40],[jug-26,t-46]]);s.push(arc(jug+18,t-24,9,10,-PI/2,PI/2));H(s,[[jug-16,t-24],[jug+16,t-24],[jug+14,t-2],[jug-14,t-2]],1.6,0);
  var fk=RR(R,30,50);s.push([[fk,t-2],[fk+60,t-6]]);for(var f=0;f<4;f++)s.push([[fk+60,t-6-f*1.5],[fk+76,t-8-f*1.5]]);
  tableS(s,R,t,'tiles',[[[cx-90,t],[cx-90,ty-16],[cx+90,ty-16],[cx+90,t]],[[jug-30,t],[jug-30,t-48],[jug+30,t-48],[jug+30,t]]]);return s;}},

{name:'Rocking horse',titles:['Nursery Gallop','Painted Pony','Christmas Morning','Ride to Nowhere'],build(R){var s=[],f=RR(R,172,178);
  floorS(s,R,f,RI(R,12,16));var cx=RR(R,130,160),y=f-60;
  var rk=curve([[cx-100,f-24],[cx-50,f-2],[cx,f],[cx+50,f-2],[cx+100,f-24]],8);s.push(rk);s.push(rk.map(function(p){return [p[0],p[1]-6];}));
  var body=blob([[cx-54,y-10],[cx-40,y-30],[cx+20,y-32],[cx+44,y-22],[cx+40,y],[cx-40,y+2]],8);s.push(poly(body));
  var hd=blob([[cx+30,y-28],[cx+44,y-62],[cx+60,y-70],[cx+84,y-52],[cx+80,y-44],[cx+58,y-46],[cx+48,y-24]],6);s.push(poly(hd));eye(s,cx+62,y-58,2);s.push([[cx+52,y-66],[cx+54,y-78],[cx+60,y-68]]);
  for(var m=0;m<6;m++)s.push(curve([[cx+30+m*4,y-30-m*6],[cx+20+m*4,y-36-m*6],[cx+16+m*4,y-28-m*6]],4));
  var tl=curve([[cx-54,y-14],[cx-74,y-10],[cx-80,y+10]],6);s.push(tl);s.push(tl.map(function(p){return [p[0]-4,p[1]+2];}));
  [[cx-40,-1],[cx-26,1],[cx+20,-1],[cx+34,1]].forEach(function(l){s.push([[l[0],y],[l[0]+l[1]*14,f-12]]);s.push([[l[0]+6,y],[l[0]+6+l[1]*14,f-12]]);});
  var sd=[[cx-16,y-32],[cx+12,y-34],[cx+10,y-24],[cx-14,y-22]];s.push(poly(sd));H(s,sd,1.2,0);HX(s,[body,sd],2.4,RR(R,30,50));
  HX(s,[[[4,4],[296,4],[296,f],[4,f]],[[cx-106,f],[cx-106,y-40],[cx+20,y-40],[cx+50,y-86],[cx+90,y-86],[cx+106,f]]],RR(R,4.4,5),90);return s;}},

{name:'Spinning top',titles:['Last Few Wobbles','Whirl','Painted Stripes','Kitchen Floor Game'],build(R){var s=[],f=RR(R,170,176);
  floorS(s,R,f,RI(R,12,16));var cx=RR(R,130,170),a=RR(R,-0.2,0.2);var tp=[[cx,f],[cx-50,f-50],[cx-46,f-62],[cx+46,f-62],[cx+50,f-50]].map(function(p){return p;});
  var body=rotateAbout([[cx,f]].concat(curve([[cx,f],[cx-30,f-26],[cx-52,f-52],[cx-46,f-64]],6)).concat(curve([[cx-46,f-64],[cx,f-74],[cx+46,f-64]],6)).concat(curve([[cx+46,f-64],[cx+52,f-52],[cx+30,f-26],[cx,f]],6)),cx,f,a);s.push(body);
  for(var b=0;b<4;b++){var y=f-20-b*12,w=20+b*9;var band=rotateAbout([[cx-w,y],[cx+w,y],[cx+w+5,y-6],[cx-w-5,y-6]],cx,f,a);if(b%2===0)F(s,band,1.4,a*57);else s.push(poly(band));}
  var st=rotateAbout([[cx-4,f-72],[cx-4,f-100],[cx+4,f-100],[cx+4,f-72]],cx,f,a);s.push(poly(st));s.push(rotateAbout(arc(cx,f-100,6,3,PI,TAU),cx,f,a));
  for(var m=0;m<3;m++)s.push(arc(cx,f-50,70+m*10,30+m*6,PI*1.1,PI*1.45));for(var m2=0;m2<3;m2++)s.push(arc(cx,f-50,70+m2*10,30+m2*6,-PI*0.45,-PI*0.1));
  var tp2=RR(R,40,70);s.push(rotateAbout([[tp2,f-6]].concat(arc(tp2+16,f-12,16,12,PI,TAU)).concat([[tp2+32,f-6],[tp2+16,f]]).concat([[tp2,f-6]]),tp2+16,f,1.3));
  HX(s,[[[4,4],[296,4],[296,f],[4,f]],[[cx-90,f],[cx-90,f-110],[cx+90,f-110],[cx+90,f]],[[tp2-10,f],[tp2-10,f-40],[tp2+40,f-40],[tp2+40,f]]],RR(R,4,4.5),RR(R,40,50));return s;}},

{name:'Jack-in-the-box',titles:['Pop Goes the Lid','Surprise!','Crank and Spring','Toy Chest Treasure'],build(R){var s=[],f=RR(R,172,178);
  floorS(s,R,f,RI(R,12,16));var cx=RR(R,120,150),bw=60,top=f-60;box3(s,cx-bw/2,top,bw,60,18,2);
  for(var k=0;k<2;k++){s.push(rect(cx-bw/2+8,top+8+k*26,cx+bw/2-8,top+28+k*26));}H(s,[[cx-bw/2+8,top+8],[cx+bw/2-8,top+8],[cx+bw/2-8,top+28],[cx-bw/2+8,top+28]],2.4,45);
  var lid=[[cx-bw/2,top-1],[cx-bw/2-24,top-50],[cx-bw/2-8,top-60],[cx-bw/2+16,top-10]];s.push(poly(lid));H(s,lid,2,60);
  var sp=[];for(var i=0;i<=60;i++){var t=i/60;sp.push([cx+9*Math.sin(t*TAU*6),top-4-t*50]);}s.push(sp);
  var hd=EP(cx,top-66,14,14);s.push(poly(hd));eye(s,cx-5,top-68,1.6);eye(s,cx+5,top-68,1.6);s.push(arc(cx,top-62,6,4,0.2,PI-0.2));s.push(circle(cx,top-64,2));
  var hat=[[cx-14,top-76],[cx-6,top-100],[cx+2,top-92],[cx+10,top-104],[cx+14,top-76]];s.push(hat);H(s,hat,1.4,0);s.push(circle(cx-6,top-102,2.4));s.push(circle(cx+10,top-106,2.4));
  s.push(scallop(cx,top-52,18,5,10,0.4));var ck=[cx+bw/2+18,top+30];s.push([ck,[ck[0]+12,ck[1]]]);s.push([[ck[0]+12,ck[1]],[ck[0]+12,ck[1]+12]]);s.push(circle(ck[0]+12,ck[1]+14,3));
  var bl=RR(R,200,250);for(var b=0;b<3;b++){var bx=bl+(b%2)*30,by=f-14-(b>1?28:0);s.push(rect(bx,by,bx+26,by+26));s.push(poly([[bx+6,by+20],[bx+13,by+6],[bx+20,by+20]]));}
  HX(s,[[[4,4],[296,4],[296,f],[4,f]],[[cx-bw/2-34,f],[cx-bw/2-34,top-64],[cx-24,top-110],[cx+30,top-110],[cx+bw/2+40,top-10],[cx+bw/2+40,f]],[[bl-4,f],[bl-4,f-46],[bl+60,f-46],[bl+60,f]]],RR(R,5,6),0);return s;}},

{name:'Wooden toy train',titles:['Choo on the Carpet','Painted Carriages','Nursery Line','Pull Along'],build(R){var s=[],f=RR(R,166,172);
  floorS(s,R,f,RI(R,12,16));var x=RR(R,30,50),y=f-12;
  var eng=[[x+150,y],[x+150,y-40],[x+190,y-40],[x+190,y-70],[x+230,y-70],[x+230,y]];s.push(eng);s.push(rect(x+186,y-76,x+234,y-70));s.push(rect(x+196,y-64,x+224,y-48));
  var bo=[[x+150,y-40],[x+150,y-56]].concat(arc(x+150,y-48,8,8,-PI/2,PI/2).reverse()).concat([[x+190,y-56]]);s.push([[x+130,y-40],[x+190,y-40],[x+190,y-56],[x+130,y-56]]);s.push(arc(x+130,y-48,6,8,PI/2,1.5*PI));
  var ch=[[x+140,y-56],[x+136,y-80],[x+156,y-80],[x+152,y-56]];s.push(poly(ch));H(s,ch,1.4,0);s.push(circle(x+146,y-86,6));
  [x+160,x+212].forEach(function(cx){wheel(s,cx,y,10,4,0);});
  for(var c=0;c<2;c++){var cx0=x+c*68,w=60;s.push(rect(cx0,y-34,cx0+w,y-6));s.push([[cx0+w,y-18],[cx0+w+8,y-18]]);wheel(s,cx0+14,y,9,4,0);wheel(s,cx0+46,y,9,4,0);
    if(c===0){for(var b=0;b<3;b++){s.push(rect(cx0+6+b*17,y-50,cx0+20+b*17,y-34));s.push(poly([[cx0+6+b*17,y-50],[cx0+13+b*17,y-60],[cx0+20+b*17,y-50]]));}}else{H(s,[[cx0,y-34],[cx0+w,y-34],[cx0+w,y-6],[cx0,y-6]],2.4,45);}}
  H(s,[[x+150,y-40],[x+190,y-40],[x+190,y],[x+150,y]],2.4,90);s.push(curve([[x+232,y-30],[x+260,y-40],[x+280,y-10],[x+290,f]],8));
  HX(s,[[[4,4],[296,4],[296,f],[4,f]],[[x-4,f],[x-4,y-64],[x+130,y-64],[x+130,y-96],[x+240,y-96],[x+240,f]]],RR(R,4.5,5.5),RR(R,40,50));return s;}},

{name:'Paper boat in a puddle',titles:['After the Rain','Folded from Newsprint','Gutter Voyage','Small Fleet'],build(R){var s=[],g=RR(R,110,120);
  var cb=[[4,g],[296,g]];s.push(cb);s.push(rect(4,g-14,296,g));H(s,[[4,g-14],[296,g-14],[296,g],[4,g]],2,0);s.push(brickS(4,10,296,g-14,22,10));
  var pd=EP(150,g+44,130,30);s.push(poly(pd));for(var r=1;r<5;r++){s.push(ellipse(RR(R,100,200),g+44+RR(R,-6,6),6+r*6,2+r*1.6));}
  var bx=RR(R,120,170),by=g+40;var hull=[[bx-40,by-14],[bx+40,by-14],[bx+28,by],[bx-28,by]];s.push(poly(hull));H(s,hull,1.6,0);
  var sail=[[bx-26,by-14],[bx,by-56],[bx+26,by-14]];s.push(poly(sail));s.push([[bx,by-56],[bx,by-14]]);H(s,[[bx,by-56],[bx+26,by-14],[bx,by-14]],1.8,60);
  for(var l=0;l<4;l++)s.push([[bx-18+l*3,by-24-l*6],[bx-6,by-24-l*6]]);
  var ref=[];for(var k=0;k<5;k++){var y=by+4+k*4;ref.push([bx-30+k*4,y],[bx+30-k*4,y]);}s.push(ref);
  var rest=[[4,g+14],[296,g+14]];var pv=[];for(var y2=g+18;y2<196;y2+=8){pv.push(wave(4,296,y2,0.8,30,R()*6));}behind(s,pv,[pd]);
  for(var dr=0;dr<RI(R,10,16);dr++){var dx=RR(R,10,290),dy=RR(R,20,g-24);s.push([[dx,dy],[dx-3,dy+8]]);}
  return s;}},

{name:'Clawfoot bathtub',titles:['Long Soak','Bubbles and Brass','The Tiled Room','Sunday Bath'],build(R){var s=[],f=RR(R,172,178);
  floorS(s,R,f,RI(R,14,18));var x=RR(R,50,70),w=180,top=f-80;var tub=[[x,top]].concat(curve([[x,top],[x+6,top+40],[x+30,top+62],[x+w-30,top+62],[x+w-6,top+40],[x+w,top]],8));s.push(tub);s.push([[x-4,top-4],[x+w+4,top-4],[x+w+4,top],[x-4,top]]);
  H(s,tub.concat([[x,top]]),2.6,RR(R,70,85));[[x+30,1],[x+w-30,-1]].forEach(function(l){var lx=l[0];s.push([[lx-4,top+60],[lx-10,f-6],[lx-16,f-2],[lx+2,f-2],[lx+2,top+60]]);s.push(circle(lx-8,f-3,3));});
  var bub=[];for(var b=0;b<RI(R,8,12);b++){var bx2=x+20+b*14,by2=top-6-RR(R,0,6);s.push(arc(bx2,top-4,7,6+RR(R,0,6),PI,TAU));}
  s.push([[x+w-20,top-4],[x+w-20,top-50],[x+w-46,top-50],[x+w-46,top-40]]);s.push(circle(x+w-46,top-36,3));s.push(circle(x+w-12,top-24,4));s.push(circle(x+w-28,top-24,4));
  var win=[[200,20],[270,20],[270,70],[200,70]];s.push(poly(win));s.push([[235,20],[235,70]]);s.push([[200,45],[270,45]]);
  HX(s,[[[4,4],[296,4],[296,f],[4,f]],[[x-8,f],[x-8,top-12],[x+w-50,top-12],[x+w-50,top-56],[x+w+8,top-56],[x+w+8,f]],win],RR(R,11,13),0);HX(s,[[[4,4],[296,4],[296,f],[4,f]],[[x-8,f],[x-8,top-12],[x+w-50,top-12],[x+w-50,top-56],[x+w+8,top-56],[x+w+8,f]],win],RR(R,11,13),90);
  return s;}},

{name:'Four-poster bed',titles:['Canopy Dreams','Guest Room, Morning','Quilt and Bolster','Sleep In'],build(R){var s=[],f=RR(R,176,182);
  floorS(s,R,f,RI(R,12,16));var x=RR(R,40,60),w=200,mt=f-50;
  [[x,f],[x+w,f],[x+24,f-14],[x+w+24,f-14]].forEach(function(p){s.push([[p[0]-2,p[1]],[p[0]-2,30],[p[0]+2,30],[p[0]+2,p[1]]]);s.push(circle(p[0],27,3));});
  s.push([[x,34],[x+w,34]]);s.push([[x+24,20],[x+w+24,20]]);s.push([[x,34],[x+24,20]]);s.push([[x+w,34],[x+w+24,20]]);s.push(scallopRows(x,x+w,40,40,14,6));
  var mat=[[x,mt],[x+w,mt],[x+w,mt+20],[x,mt+20]];s.push(poly(mat));s.push([[x,mt],[x+24,mt-12],[x+w+24,mt-12],[x+w,mt]]);
  var quilt=[[x+60,mt-12],[x+w+24,mt-12],[x+w,mt+28],[x+30,mt+28]];s.push(poly(quilt));for(var q=1;q<6;q++){s.push([[x+30+q*(w-30)/6+(6-q)*0,mt+28],[x+60+q*(w-36)/6,mt-12]]);}for(var r=1;r<3;r++)s.push([[x+30+r*10,mt-12+r*13],[x+w+24-r*8,mt-12+r*13]]);
  H(s,[[x+30,mt+8],[x+w+8,mt+8],[x+w,mt+28],[x+30,mt+28]],2.4,0);s.push(ellipse(x+40,mt-14,22,8));s.push(ellipse(x+40,mt-6,24,8));
  s.push([[x,mt+20],[x,f]]);s.push(rect(x-2,mt-46,x+2,mt));var hb=[[x-2,mt-46],[x+24,mt-60],[x+24,mt-12]];s.push(hb);
  var nt=RR(R,250,280);s.push(rect(nt-14,f-40,nt+14,f));s.push(rect(nt-10,f-56,nt+6,f-40));s.push(arc(nt-2,f-60,10,8,PI,TAU));
  HX(s,[[[4,4],[296,4],[296,f],[4,f]],[[x-6,f],[x-6,16],[x+w+30,16],[x+w+30,f]],[[nt-18,f],[nt-18,f-70],[nt+18,f-70],[nt+18,f]]],RR(R,4.5,5.5),RR(R,40,50));return s;}},

{name:'Park bench under a lamp',titles:['Evening in the Park','Waiting Spot','Lamplight on Slats','Autumn Leaves Falling'],build(R){var s=[],g=RR(R,166,172);
  ground(s,R,g,RR(R,3.4,4));var x=RR(R,70,90),w=140,sy=g-34;
  for(var k=0;k<3;k++)s.push(rect(x,sy-k*6,x+w,sy-k*6+4));for(var b=0;b<3;b++)s.push(rect(x,sy-30-b*9,x+w,sy-26-b*9));
  [x+10,x+w-10].forEach(function(lx){s.push([[lx,g],[lx,sy-50]]);s.push([[lx-6,g],[lx,sy-10]]);s.push(curve([[lx,sy-10],[lx-12,sy-14],[lx-14,sy-26],[lx-8,sy-26]],5));});
  var lp=x+w+RR(R,24,40);var post=[[lp-3,g],[lp-2,g-120],[lp+2,g-120],[lp+3,g]];s.push(post);H(s,post,1.2,90);s.push(rect(lp-6,g-8,lp+6,g));
  var lt=[[lp-10,g-120],[lp-14,g-146],[lp+14,g-146],[lp+10,g-120]];s.push(poly(lt));s.push([[lp-18,g-146],[lp,g-160],[lp+18,g-146]]);s.push([[lp,g-120],[lp,g-146]]);
  for(var r=0;r<12;r++){var a=PI*0.15+r*PI*0.06;s.push([[lp+16*Math.cos(a),g-120+16*Math.sin(a)],[lp+26*Math.cos(a),g-120+26*Math.sin(a)]]);}
  var tr=RR(R,20,40);treeR(s,R,tr,g,RR(R,18,22),2.4);for(var lf=0;lf<6;lf++){var lx2=RR(R,10,290),ly=g+RR(R,4,24);s.push(poly(EP(lx2,ly,4,2)));}
  skyFill(s,g,6,RR(R,3.6,4.4),5,[[[x-16,g],[x-16,sy-56],[x+w+6,sy-56],[x+w+6,g]],[[lp-20,g],[lp-20,g-162],[lp+20,g-162],[lp+30,g-100],[lp+20,g]]]);return s;}},

{name:'Adirondack chair',titles:['Lakeside Seat','Slats and Sunset','Dock Afternoon','Feet Up'],build(R){var s=[],w=RR(R,128,136);
  var hl=hills([],R,w-30,RR(R,16,26),0);s.push(hl);H(s,hl.concat([[296,w-30],[4,w-30]]),3.4,0);s.push([[4,w-30],[296,w-30]]);
  var dk=[[4,w],[296,w]];s.push(dk);var p=[],d=1;for(var y=w+7;y<196;y+=7){if(d>0)p.push([4,y],[296,y]);else p.push([296,y],[4,y]);d=-d;}s.push(p);
  var cx=RR(R,130,170),sy=w+36,bt=w-70,holes=[];
  for(var k=-2;k<=2;k++){var bx=cx+k*15,tx=cx+k*19,ty=bt+Math.abs(k)*6;var sl=[[bx-6,sy-30],[tx-7,ty+6]].concat(arc(tx,ty+6,7,7,PI,TAU)).concat([[tx+7,ty+6],[bx+6,sy-30]]);s.push(sl);holes.push(sl);if(k%2===0)H(s,sl,1.6,90);}
  s.push([[cx-46,bt+48],[cx+46,bt+48]]);
  [-1,1].forEach(function(dd){var ax=cx+dd*50;var arm=[[ax-18,sy-48],[ax+18,sy-48],[ax+20,sy-40],[ax-20,sy-40]];s.push(poly(arm));H(s,arm,1.6,0);holes.push(arm);s.push([[ax-12*dd,sy-40],[ax-12*dd,sy+4]]);s.push([[ax+12*dd,sy-40],[ax+12*dd,sy+4]]);s.push([[ax-2*dd,sy-40],[ax-10*dd,sy-24]]);});
  var seat=[[cx-40,sy-30],[cx+40,sy-30],[cx+46,sy-14],[cx-46,sy-14]];s.push(poly(seat));for(var q=1;q<5;q++)s.push([[cx-40-q*1.2,sy-30+q*3.2],[cx+40+q*1.2,sy-30+q*3.2]]);holes.push(seat);
  s.push(rect(cx-46,sy-14,cx+46,sy-8));s.push([[cx-40,sy-8],[cx-40,sy+4]]);s.push([[cx+40,sy-8],[cx+40,sy+4]]);
  var tb=[[cx+90,sy-24],[cx+126,sy-24],[cx+126,sy-20],[cx+90,sy-20]];s.push(poly(tb));s.push([[cx+94,sy-20],[cx+94,sy+4]]);s.push([[cx+122,sy-20],[cx+122,sy+4]]);s.push(rect(cx+100,sy-38,cx+110,sy-24));s.push(arc(cx+110,sy-32,4,4,-PI/2,PI/2));
  var wt=[waterS(R,4,296,w-26,w-4,4.5,1.2)];behind(s,wt,holes.concat([[[cx-74,w],[cx-74,bt],[cx+74,bt],[cx+74,w]]]));
  pineT(s,RR(R,20,50),w-30,0.8,2.4);pineT(s,RR(R,250,280),w-30,0.9,2.4);
  skyFill(s,w-30,7,RR(R,4,5),5,holes);return s;}},

{name:'Cuckoo clock',titles:['On the Hour','Pinecone Weights','Black Forest Kitchen','The Little Door'],build(R){var s=[],cx=RR(R,130,170),top=RR(R,30,40);
  var roof=[[cx-60,top+30],[cx,top-10],[cx+60,top+30]];s.push(poly(roof));H(s,roof,2,0);s.push(scallopRows(cx-58,cx+58,top+34,top+34,8,4));
  var hs=[[cx-46,top+30],[cx-46,top+110],[cx+46,top+110],[cx+46,top+30]];s.push(hs);H(s,[[cx-46,top+90],[cx+46,top+90],[cx+46,top+110],[cx-46,top+110]],1.6,90);
  s.push(rect(cx-10,top+6,cx+10,top+24));s.push([[cx,top+6],[cx,top+24]]);s.push(circle(cx,top+60,22));for(var k=0;k<12;k++){var a=k*TAU/12;s.push([[cx+18*Math.cos(a),top+60+18*Math.sin(a)],[cx+22*Math.cos(a),top+60+22*Math.sin(a)]]);}
  s.push([[cx,top+60],[cx+8,top+50]]);s.push([[cx,top+60],[cx-2,top+44]]);
  for(var l=0;l<5;l++){var a2=PI*0.15+l*0.18;s.push(quad([cx-46,top+40],[cx-60,top+40+l*10],[cx-70,top+30+l*14]));s.push(quad([cx+46,top+40],[cx+60,top+40+l*10],[cx+70,top+30+l*14]));}
  s.push([[cx-6,top+110],[cx-6,top+130]]);s.push(rect(cx-10,top+130,cx-2,top+150));
  [cx-24,cx+20].forEach(function(px,i){var len=RR(R,40,60);s.push([[px,top+110],[px,top+110+len]]);var pc=EP(px,top+110+len+10,6,12);s.push(poly(pc));for(var r=0;r<5;r++)s.push([[px-6,top+110+len+r*4],[px+6,top+110+len+2+r*4]]);});
  var bg=[];A(bg,hatch([[4,4],[296,4],[296,196],[4,196]],RR(R,5,6),90));A(bg,brickS(4,4,296,196,40,40).length?[]:[]);behind(s,bg,[[[cx-62,top+34],[cx,top-12],[cx+62,top+34],[cx+48,top+40],[cx+48,top+112],[cx-48,top+112],[cx-48,top+40]],[[cx-32,top+110],[cx+28,top+110],[cx+28,196],[cx-32,196]]]);
  return s;}},

{name:'Laundry on the line',titles:['Drying in the Breeze','Monday Wash','Sheets and Shirts','Clothespins'],build(R){var s=[],g=RR(R,168,174);
  ground(s,R,g,RR(R,3.4,4));var p1=RR(R,14,24),p2=RR(R,276,286),ly=RR(R,52,62);s.push([[p1,g],[p1,ly-10]]);s.push([[p2,g],[p2,ly-10]]);s.push([[p1-10,ly-6],[p1+10,ly-6]]);s.push([[p2-10,ly-6],[p2+10,ly-6]]);
  var line=quad([p1,ly],[150,ly+24],[p2,ly],30);s.push(line);var items=[];var x=p1+20;var shapes=['shirt','sheet','sock','towel','dress'];
  while(x<p2-40){var kind=pick(R,shapes),w=kind==='sheet'?RR(R,50,70):kind==='sock'?14:RR(R,30,40);var y0=interpY(line,x),y1=interpY(line,x+w);
    if(kind==='shirt'){var sh=[[x,y0],[x-8,y0+10],[x-2,y0+16],[x+4,y0+12],[x+4,y0+50],[x+w-4,y1+50],[x+w-4,y1+12],[x+w+2,y1+16],[x+w+8,y1+10],[x+w,y1]];s.push(sh);H(s,sh,2.4,90);}
    else if(kind==='sheet'){var st=[[x,y0],[x,y0+70],[x+w*0.3,y0+74],[x+w*0.6,y0+70],[x+w,y1+74],[x+w,y1]];s.push(st);for(var f2=1;f2<4;f2++)s.push([[x+w*f2/4,interpY(line,x+w*f2/4)],[x+w*f2/4+2,y0+70]]);}
    else if(kind==='sock'){var so=[[x,y0],[x,y0+24],[x+10,y0+30],[x+14,y0+26],[x+6,y0+20],[x+6,y0]];s.push(so);H(s,so,1.2,0);}
    else if(kind==='towel'){var tw=[[x,y0],[x,y0+40],[x+w,y1+40],[x+w,y1]];s.push(tw);H(s,tw,2.8,0);}
    else{var dr=[[x+8,y0],[x+4,y0+20],[x-4,y0+56],[x+w+4,y1+56],[x+w-4,y1+20],[x+w-8,y1]];s.push(dr);H(s,dr,3,60);}
    s.push(rect(x+2,y0-4,x+4,y0+4));s.push(rect(x+w-4,y1-4,x+w-2,y1+4));items.push(1);x+=w+RR(R,8,16);}
  var bush=RR(R,100,200);s.push(scallop(bush,g,30,14,8,0.2).filter(function(p){return p[1]<=g;}));
  skyFill(s,g,7,RR(R,3.4,3.9));return s;}},

{name:'Campfire and tents',titles:['Night Under the Pines','Sparks Rising','Marshmallow Hour','Two Tents, One Fire'],build(R){var s=[],g=RR(R,150,158);
  var bgp=[];for(var i=0;i<8;i++){var px=10+i*40+RR(R,-8,8);A(bgp,pine(px,g,RR(R,1.2,1.7)));}var t1=[RR(R,40,70),g+20],t2=[RR(R,200,240),g+14];
  var holes=[[[t1[0]-46,t1[1]],[t1[0],t1[1]-60],[t1[0]+46,t1[1]]],[[t2[0]-40,t2[1]],[t2[0],t2[1]-54],[t2[0]+40,t2[1]]]];behind(s,bgp,holes);s.push([[4,g],[296,g]]);
  H(s,[[4,g],[296,g],[296,196],[4,196]],RR(R,4,5),RR(R,10,20));
  [t1,t2].forEach(function(t,i){var h=i?54:60,w=i?40:46;var tn=[[t[0]-w,t[1]],[t[0],t[1]-h],[t[0]+w,t[1]],[t[0]-w,t[1]]];s.push(tn);s.push([[t[0],t[1]-h],[t[0]+10,t[1]]]);var dr=[[t[0],t[1]-h*0.6],[t[0]-12,t[1]],[t[0]+10,t[1]]];F(s,dr,1.4,90);H(s,[[t[0],t[1]-h],[t[0]+w,t[1]],[t[0]+10,t[1]]],2.2,60);s.push([[t[0]-w,t[1]],[t[0]-w-10,t[1]+4]]);s.push([[t[0]+w,t[1]],[t[0]+w+10,t[1]+4]]);});
  var fx=RR(R,130,170),fy=g+30;for(var st=0;st<8;st++){var a=PI+st*PI/7;s.push(poly(EP(fx+28*Math.cos(a),fy+6*Math.sin(a)+4,6,4)));}
  s.push([[fx-24,fy+2],[fx+20,fy-8]]);s.push([[fx-20,fy-8],[fx+24,fy+2]]);var fl=[[fx-16,fy]];for(var k=0;k<7;k++)fl.push([fx-14+k*5,fy-(k%2?RR(R,26,40):RR(R,8,16))]);fl.push([fx+18,fy]);s.push(fl);
  var fl2=[[fx-8,fy]];for(var k2=0;k2<4;k2++)fl2.push([fx-6+k2*5,fy-(k2%2?16:6)]);fl2.push([fx+10,fy]);s.push(fl2);
  for(var sp=0;sp<5;sp++){var sx=fx+RR(R,-10,10),sy=fy-46-sp*10;s.push([[sx,sy],[sx+2,sy-3]]);}
  var lg=[[fx+40,fy+4],[fx+90,fy-2],[fx+92,fy+8],[fx+42,fy+14]];s.push(poly(lg));s.push(ellipse(fx+91,fy+3,3,5));
  skyFill(s,g,5,RR(R,3,3.6));return s;}}
);


var MASTER={name:'Fishing harbor village',titles:['Harbor at Evening','Nets In, Lamps On','The Quay Below the Church','Moorings','Village by the Water'],build(R){
  var s=[],q=RR(R,126,132),wl=q+14,holes=[];
  // ---- middle ground: front row of houses on the quay ----
  var x=6,houses=[];while(x<286){var w=RR(R,30,44);if(x+w>294)w=294-x;if(w<22)break;var h=RR(R,38,64)*(1-Math.abs(x+w/2-150)/420),rh=RR(R,14,22);houses.push({x0:x,x1:x+w,top:q-h,rh:rh});x+=w+RR(R,0,4);}
  houses.forEach(function(H0,i){var x0=H0.x0,x1=H0.x1,top=H0.top,rh=H0.rh,cxh=(x0+x1)/2;var sil=[[x0,q],[x0,top],[x0-3,top],[cxh,top-rh],[x1+3,top],[x1,top],[x1,q]];holes.push(sil);
    s.push([[x0,q],[x0,top],[x1,top],[x1,q]]);var roof=[[x0-3,top],[cxh,top-rh],[x1+3,top]];s.push(poly(roof));
    var style=i%4;if(style===0)s.push(brickS(x0,top+2,x1,q,9,4.5));else if(style===1)H(s,[[x0,top],[x1,top],[x1,q],[x0,q]],3,90);else if(style===2)s.push(rows(x0,x1,top+4,q-2,4));
    H(s,roof,(style===3?1.6:2.2),style===3?0:RR(R,50,70)*(i%2?1:-1));
    var nw=Math.max(1,Math.floor((x1-x0)/16));for(var r=0;r<2;r++){var wy=top+8+r*16;if(wy+10>q-14)break;for(var k=0;k<nw;k++){var wx=x0+(x1-x0)*(k+0.5)/nw-4;s.push([[wx,wy],[wx+8,wy],[wx+8,wy+10],[wx,wy+10],[wx,wy],[wx,wy+2],[wx+8,wy+2],[wx+8,wy+4],[wx,wy+4],[wx,wy+6],[wx+8,wy+6],[wx+8,wy+8],[wx,wy+8]]);}}
    var dx=cxh-4;s.push(rect(dx,q-14,dx+8,q));
    if(R()<0.6){var chx=x0+(x1-x0)*0.7;var ch=[[chx,top-rh*0.4],[chx,top-rh*0.4-12],[chx+6,top-rh*0.4-12],[chx+6,top-rh*0.4]];s.push(ch);holes.push([[chx-1,top],[chx-1,top-rh*0.4-13],[chx+7,top-rh*0.4-13],[chx+7,top]]);}});
  // ---- background: second row of houses up the hill, and the church ----
  var bg=[],hl=[],hy=q-RR(R,58,66);var hill=[];for(var xx=4;xx<=296.1;xx+=4)hill.push([xx,hy-26*Math.sin((xx-4)/292*PI)-8*Math.sin(xx/37)]);hl.push(hill);
  var chx2=RR(R,70,110),chb=interpY(hill,chx2)+30;var church=[[chx2-18,chb],[chx2-18,chb-26],[chx2+18,chb-26],[chx2+18,chb]];bg.push(church);bg.push([[chx2-22,chb-26],[chx2,chb-40],[chx2+22,chb-26]]);
  var tw=[[chx2+18,chb],[chx2+18,chb-40],[chx2+30,chb-40],[chx2+30,chb]];bg.push(tw);bg.push([[chx2+16,chb-40],[chx2+24,chb-60],[chx2+32,chb-40]]);bg.push([[chx2+24,chb-60],[chx2+24,chb-66]]);bg.push([[chx2+20,chb-63],[chx2+28,chb-63]]);
  A(bg,hatch([[chx2+16,chb-40],[chx2+24,chb-60],[chx2+32,chb-40]],1.4,0));bg.push(arc(chx2+24,chb-30,3,4,PI,TAU));A(bg,hatch([[chx2-22,chb-26],[chx2,chb-40],[chx2+22,chb-26]],1.8,0));
  for(var b=0;b<3;b++)bg.push(arc(chx2-10+b*10,chb-12,3,4,PI,TAU).concat([[chx2-7+b*10,chb-4],[chx2-13+b*10,chb-4],[chx2-13+b*10,chb-12]]));
  var bx=8;while(bx<290){var bw=RR(R,22,30),bb=interpY(hill,bx+bw/2)+RR(R,10,22);if(Math.abs(bx+bw/2-chx2-6)>30){var bh=RR(R,16,24);bg.push([[bx,bb],[bx,bb-bh],[bx+bw,bb-bh],[bx+bw,bb]]);var br=[[bx-2,bb-bh],[bx+bw/2,bb-bh-10],[bx+bw+2,bb-bh]];bg.push(br);A(bg,hatch(br,2,0));bg.push(rect(bx+bw/2-3,bb-bh+5,bx+bw/2+3,bb-bh+11));
      holes.push([[bx-2,bb],[bx-2,bb-bh],[bx+bw/2,bb-bh-10],[bx+bw+2,bb-bh],[bx+bw+2,bb]]);}bx+=bw+RR(R,4,10);}
  for(var tr=0;tr<RI(R,5,8);tr++){var tx=RR(R,10,290),tb=interpY(hill,tx)+2;if(Math.abs(tx-chx2-6)<34)continue;hl.push(scallop(tx,tb-8,7,7,6,0.15));hl.push([[tx,tb-1],[tx,tb+4]]);}
  var hh=hatch(hill.concat([[296,q],[4,q]]),RR(R,6.4,7),RR(R,25,40));A(hh,hl);var chSil=[[chx2-23,chb],[chx2-23,chb-26],[chx2,chb-41],[chx2+14,chb-34],[chx2+14,chb-42],[chx2+24,chb-68],[chx2+34,chb-42],[chx2+34,chb]];
  var mt=[];for(var xm=4;xm<=296.1;xm+=6)mt.push([xm,hy-40-22*Math.sin(xm/50+R()*0.1)-10*Math.sin(xm/19)]);var mtc=[];var bgm=[mt];A(bgm,hatch(mt.concat(hill.slice().reverse()),RR(R,6,7),0));
  behind(s,bgm,holes.concat([chSil]));behind(s,hh,holes.concat([chSil]));
  // the background row is cut where the front houses stand
  var front=holes.slice(0,houses.length).concat(holes.filter(function(h,i){return i<houses.length*2;}));
  var hidden=[];var bgClip=[];var bgHoles=[];houses.forEach(function(H0){bgHoles.push([[H0.x0-3,q],[H0.x0-3,H0.top],[(H0.x0+H0.x1)/2,H0.top-H0.rh],[H0.x1+3,H0.top],[H0.x1+3,q]]);});
  var tmp=[];behind(tmp,bg,bgHoles);
  // hill hatch must also stop at the second-row houses and church
  var keep=[];var bgh=[];tmp.forEach(function(st){keep.push(st);});A(s,keep);
  // ---- quay wall ----
  s.push([[4,q],[296,q]]);s.push(brickS(4,q,296,wl,14,4.7));for(var bo=0;bo<RI(R,3,5);bo++){var bxp=RR(R,20,280);s.push([[bxp-3,q],[bxp-3,q-6]].concat(arc(bxp,q-6,3,2,PI,TAU)).concat([[bxp+3,q]]));}
  for(var lp=0;lp<2;lp++){var lx=RR(R,40,260);s.push([[lx,q],[lx,q-30]]);s.push(rect(lx-4,q-38,lx+4,q-30));s.push([[lx-5,q-38],[lx,q-42],[lx+5,q-38]]);}
  // ---- foreground: water, boats, pier ----
  var fg=[];var b1x=RR(R,40,80),b1y=wl+RR(R,26,32);var hull=[[b1x-40,b1y-12],[b1x+48,b1y-12],[b1x+38,b1y+4],[b1x-30,b1y+4]];s.push(poly(hull));H(s,hull,1.6,0);s.push([[b1x-40,b1y-12],[b1x-44,b1y-18]]);
  s.push([[b1x,b1y-12],[b1x,b1y-96]]);var sail=[[b1x,b1y-92],[b1x+34,b1y-20],[b1x,b1y-20]];s.push(poly(sail));H(s,sail,2.6,90);var jib=[[b1x-2,b1y-90],[b1x-30,b1y-20],[b1x-2,b1y-20]];s.push(poly(jib));
  s.push([[b1x,b1y-96],[b1x+6,b1y-94],[b1x,b1y-92]]);s.push(rect(b1x+10,b1y-20,b1x+30,b1y-12));
  var b2x=RR(R,140,180),b2y=wl+RR(R,18,22);var rb=[[b2x-28,b2y-8],[b2x+28,b2y-8],[b2x+20,b2y+2],[b2x-20,b2y+2]];s.push(poly(rb));H(s,rb,1.4,0);s.push([[b2x-10,b2y-8],[b2x-26,b2y-20]]);s.push([[b2x+10,b2y-8],[b2x+26,b2y-18]]);
  s.push(curve([[b2x+28,b2y-8],[b2x+40,b2y-16],[b2x+48,wl-2]],6));
  var pr=RR(R,214,232);var pdk=[[pr,wl+18],[296,wl+18],[296,wl+24],[pr,wl+24]];s.push(poly(pdk));H(s,pdk,1.6,0);for(var pp=pr+4;pp<296;pp+=14){var pil=[[pp,wl+24],[pp,196],[pp+5,196],[pp+5,wl+24]];s.push(pil);H(s,pil,1.4,90);}
  s.push(comb(pr,296,wl+18,10,8));s.push([[pr,wl+8],[296,wl+8]]);s.push([[pr,wl+18],[pr-6,q+2]]);
  for(var gl=0;gl<RI(R,4,7);gl++){var gx=RR(R,10,290),gy=RR(R,wl+8,190);}
  var refl=[];for(var rr=0;rr<6;rr++){var ry=b1y+6+rr*4;refl.push([b1x-30+rr*3,ry],[b1x+38-rr*3,ry]);}s.push(refl);
  var waterHoles=[[[b1x-46,b1y+4],[b1x-46,b1y-20],[b1x+50,b1y-20],[b1x+50,b1y+30]],[[b2x-30,b2y+4],[b2x-30,b2y-10],[b2x+30,b2y-10],[b2x+30,b2y+4]],[[pr-2,196],[pr-2,wl+6],[296,wl+6],[296,196]]];
  var wv=[waterS(R,4,296,wl+4,194,4.0,1.4)];behind(s,wv,waterHoles);s.push([[4,wl],[296,wl]]);
  // ---- sky ----
  skyFill(s,hy-30,7,RR(R,3.6,4.2),5,[[[b1x-2,b1y],[b1x-2,b1y-98],[b1x+36,b1y-20]]]);
  return s;}};

return {number:2,startedOn:"2026-11-12",notes:"Batch 2 (Nov 12): first 10-minute day, 142 subjects + Daily Super Sketch (Fishing harbor village). Review of batch 1: strongest were castle, steam locomotive, lighthouse, pagoda, water tower and covered bridge - solid structures with brick/plank texture. Weak: violin, rocking chair, telescope, roller skate, desk lamp, octopus face. Long connectors spoiled pocket watch, hammock, Saturn and kite. Everything ran 85-290s: far too sparse for 10-minute slots. Lessons: keep every element touching the main drawing. Batch 2 keeps its own helpers inside the batch file: skyFill (sky rows that stop at every line; pass solid silhouettes so it doesn't leak into open shapes), behind() to clip background hills/water/walls around foreground silhouettes, tableS walls with knockouts, one-stroke textures (brickS, comb, rows, waterS). Unclipped background hatching crosses the subject - always clip. Keep strokes under ~300 so planning stays under 2s (master under 4s). Animals read best as side-view blobs with hatched bodies; chairs and beds read better head-on.",master:MASTER,subjects:SUBJ};
})();
