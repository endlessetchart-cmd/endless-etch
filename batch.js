// Endless Etch — the current batch of subjects. Replaced once a day by the batch review task.
// Each build(R) returns strokes (arrays of [x,y]) on a 300 x 200 grid. R is a seeded random function that changes with every play,
// so builds should use it to vary the picture (counts, positions, optional details, setting). The page also mirrors, resizes and shifts each play.
// titles: 3-5 artwork titles; each play shows one of them on a placard when the sketch is finished.
// Only helpers from etch-core.js may be used, and builds must not call Math.random (every viewer must get the same drawing).
var ETCH_BATCH = {
  number: 1,
  startedOn: '2026-11-11',
  // Notes the next review reads first: what worked, what to avoid.
  notes: 'Batch 1 (48 subjects, Nov 11). Worked well: castle bricks, sunflowers, locomotive, Saturn ring occlusion, pagoda, water tower, penny-farthing, covered bridge. Lessons: anything floating far from the rest (bubbles, moons, birds, distant clouds) costs a long connecting line, so attach extras to the main drawing or leave them out. Weak and worth redoing differently next time: violin body shape, rocking chair (back and seat read oddly), telescope (tube placement), desk lamp, roller skate laces. Many drawings finish in 100-150s; aim for 180-280s by adding shading and a setting.',
  // Every subject drawn so far, oldest first. Do not repeat these.
  history: ['Cottage','Sailboat','Wine glass and bottle','Ferris wheel','Coffee mug','Golden Gate Bridge','Bicycle','Fish','Mountain range','Hot air balloon','Rocket','Lighthouse','Saguaro cactus','Snowman'],
  subjects: [

{name:'Lighthouse on the rocks',titles:["Keeper of the Point", "Two Beams, One Night", "Fog Signal", "Breakwater Light"],build(R){var s=[];
  var xl=function(y){return 130+(152-y)/92*10;},xr=function(y){return 180-(152-y)/92*10;};
  s.push([[130,152],[140,60],[170,60],[180,152]]);
  [[132,148],[106,124],[80,64]].forEach(function(b){var y0=b[0],y1=b[1];var P=[[xl(y0),y0],[xr(y0),y0],[xr(y1),y1],[xl(y1),y1]];s.push(poly(P));s.push.apply(s,hatch(P,2.4,0));});
  s.push(rect(151,112,159,120));
  s.push([[148,152],[148,140]].concat(arc(155,140,7,7,Math.PI,TAU),[[162,152]]));
  s.push(rect(124,54,186,60));for(var x=127;x<=184;x+=9.5)s.push([[x,54],[x,47]]);s.push([[125,47],[185,47]]);
  s.push([[138,54],[138,30],[172,30],[172,54]]);s.push([[149,30],[149,54]]);s.push([[161,30],[161,54]]);
  var roof=[[133,30],[155,11],[177,30]];s.push(poly(roof));s.push.apply(s,hatch(roof,2.2,0));s.push([[155,11],[155,5]]);
  var bl=[[138,38],[20,14],[20,74],[138,48]],br=[[172,38],[282,14],[282,74],[172,48]];
  s.push([[138,38],[20,14]]);s.push([[138,48],[20,74]]);s.push([[172,38],[282,14]]);s.push([[172,48],[282,74]]);
  s.push.apply(s,hatch(bl,7,90));s.push.apply(s,hatch(br,7,90));
  var rock=[[84,176],[96,160],[112,153],[128,152],[182,152],[196,148],[210,158],[226,176]];s.push(rock);
  s.push.apply(s,hatch(rock.concat([[226,176],[84,176]]),3.2,35));
  for(var i=0;i<6;i++){var y=156+i*7.5;s.push(wave(4,296,y,1.8,16+i*3,i*1.3));}
  return s;}},

{name:'Dutch windmill',titles:["Tulip Rows", "Sails at Rest", "Polder Morning", "The Miller's Wind"],build(R){var s=[];
  var G=wave(4,296,150,1.2,60);s.push(G);
  for(var k=-6;k<=6;k++){s.push([[150+k*8,150],[150+k*34,196]]);}
  s.push(grass(4,110,150,6,5,R));s.push(grass(190,296,150,6,5,R));
  var lx=function(y){return 124+(160-y)/80*12;},rx=function(y){return 176-(160-y)/80*12;};
  s.push([[124,150],[136,80],[164,80],[176,150]]);
  for(var y=86;y<150;y+=6){s.push([[lx(y+10),y],[rx(y+10),y]]);}
  var cap=arc(150,80,16,16,Math.PI,TAU);s.push(cap.concat([[134,80]]));s.push.apply(s,hatch(cap.concat([[134,80]]),2.2,0));
  s.push([[143,150],[143,132]].concat(arc(150,132,7,7,Math.PI,TAU),[[157,150]]));
  s.push(rect(146,100,154,110));s.push([[150,100],[150,110]]);
  var hub=[150,72];s.push(circle(150,72,4));
  for(var b=0;b<4;b++){var a=b*Math.PI/2+0.35,blade=[];
    var L=function(pts){return rotateAbout(translate(pts,150,72),150,72,a);};
    s.push(L([[4,0],[74,0]]));s.push(L(rect(16,2,72,13)));
    for(var u=16;u<=72;u+=8)s.push(L([[u,2],[u,13]]));s.push(L([[16,7.5],[72,7.5]]));}
  for(var t=0;t<7;t++){var tx=30+t*12;s.push([[tx,150],[tx,143]]);s.push(circle(tx,141,2));}
  return s;}},

{name:'Steam locomotive',titles:["Full Head of Steam", "The 4:15 Freight", "Iron on the Rails", "Leaving the Yard"],build(R){var s=[];
  s.push([[4,165],[296,165]]);s.push([[4,168],[296,168]]);
  for(var x=8;x<296;x+=12)s.push(rect(x,168,x+7,173));
  [110,145,180].forEach(function(cx){s.push(circle(cx,148,16));s.push(circle(cx,148,13));s.push(circle(cx,148,2.5));for(var k=0;k<10;k++){var a=k*TAU/10;s.push([[cx+2.5*Math.cos(a),148+2.5*Math.sin(a)],[cx+13*Math.cos(a),148+13*Math.sin(a)]]);}});
  [[225,155],[248,155],[76,155],[22,155],[46,155]].forEach(function(w){s.push(circle(w[0],w[1],9));s.push(circle(w[0],w[1],2));});
  s.push([[110,141],[180,141]]);s.push([[110,144],[180,144]]);
  var boiler=[[100,98],[244,98],[244,130],[100,130]];s.push(poly(boiler));s.push.apply(s,hatch([[100,118],[244,118],[244,130],[100,130]],2.4,0));
  for(var bx=130;bx<240;bx+=28)s.push([[bx,98],[bx,130]]);
  s.push(arc(244,114,14,16,-Math.PI/2,Math.PI/2));s.push(circle(252,114,4));
  var stack=[[226,98],[223,74],[219,68],[245,68],[241,74],[238,98]];s.push(stack);s.push.apply(s,hatch(stack.concat([[226,98]]),1.8,0));
  s.push(arc(192,98,10,9,Math.PI,TAU));s.push(arc(162,98,8,7,Math.PI,TAU));
  var cab=[[60,135],[60,78],[100,78],[100,135]];s.push(cab);s.push(rect(55,72,106,78));s.push(rect(68,86,92,104));s.push([[80,86],[80,104]]);
  s.push.apply(s,hatch([[60,108],[100,108],[100,135],[60,135]],2.6,0));
  s.push([[56,132],[262,132]]);s.push([[56,136],[262,136]]);
  var cc=[[256,136],[272,162],[256,162]];s.push(poly(cc));for(var cy=140;cy<162;cy+=4)s.push([[256,cy],[256+16*(cy-136)/26,cy]]);
  var tender=[[10,100],[54,100],[54,145],[10,145]];s.push(poly(tender));s.push.apply(s,hatch([[12,100],[20,92],[32,88],[44,92],[52,100]].concat([[12,100]]),1.8,0));
  for(var ty=108;ty<145;ty+=9)s.push([[10,ty],[54,ty]]);
  [[214,56,12,8],[190,42,16,10],[156,30,20,12],[116,26,24,13],[76,30,22,12]].forEach(function(c){s.push(scallop(c[0],c[1],c[2],c[3],7,.28));});
  return s;}},

{name:'Octopus',titles:["Eight Ways at Once", "Reef Wanderer", "Ink in Reserve", "The Curious One"],build(R){var s=[];
  var bed=wave(4,296,184,2.5,40);s.push(bed);
  s.push.apply(s,hatch(bed.concat([[296,196],[4,196]]),3,20));
  var mantle=ellipse(150,62,34,38);s.push(mantle);
  s.push.apply(s,hatch(arc(150,62,34,38,-Math.PI/2,Math.PI/2).concat(arc(146,62,24,36,Math.PI/2,-Math.PI/2)),2.6,60));
  [[140,40,3],[158,34,2.5],[132,56,2.2],[164,52,3],[150,48,2]].forEach(function(c){s.push(circle(c[0],c[1],c[2]));});
  [135,165].forEach(function(ex){s.push(circle(ex,84,7.5));var slit=rect(ex-4,82.5,ex+4,85.5);s.push(slit);s.push([[ex-4,84],[ex+4,84]]);});
  for(var i=0;i<8;i++){var ba=Math.PI/2+(i-3.5)*0.2,x0=150+33*Math.cos(ba),y0=62+36*Math.sin(ba),left=i<4,th=Math.PI/2+(i-3.5)*0.42,curl=(left?1:-1)*(1.5+0.4*R()),len=58+16*R();
    var c=[],h=th,x=x0,y=y0,n=60;
    for(var k=0;k<=n;k++){var t=k/n;c.push([x,y,h,t]);h=th+curl*t*t*1.6;x+=Math.cos(h)*len/n;y+=Math.sin(h)*len/n;}
    var Lf=[],Rt=[],su=[];
    c.forEach(function(p,k){var w=4.6*(1-p[3])+0.7,nx=-Math.sin(p[2]),ny=Math.cos(p[2]);Lf.push([p[0]+nx*w,p[1]+ny*w]);Rt.push([p[0]-nx*w,p[1]-ny*w]);
      if(k%6===3&&p[3]<0.85)su.push(circle(p[0]-nx*w*0.45*(left?-1:1),p[1]-ny*w*0.45*(left?-1:1),1.6*(1-p[3])+0.6));});
    s.push(Lf.concat(Rt.reverse()));su.forEach(function(q){s.push(q);});}
  for(var w=0;w<3;w++){var bx=[24,272,288][w],p=[],by=interpY(bed,bx);for(var q=0;q<=24;q++){var t2=q/24;p.push([bx+4*Math.sin(t2*9),by-36*t2]);}s.push(p);}
  return s;}},

{name:'Pocket watch',titles:["Ten Past Ten", "Waistcoat Heirloom", "Wound Every Sunday", "Borrowed Time"],build(R){var s=[];
  var C=[150,110];s.push(circle(150,110,62));s.push(circle(150,110,58));s.push(circle(150,110,54));
  s.push.apply(s,hatch(arc(156,116,64,64,-0.25,1.85).concat(arc(150,110,62,62,1.85,-0.25)),2.4,45));
  s.push(rect(144,42,156,48));var crown=rect(139,32,161,42);s.push(crown);for(var x=141;x<160;x+=2.5)s.push([[x,32],[x,42]]);
  s.push(ellipse(150,23,14,9));s.push(ellipse(150,23,10,6));
  var chainPath=quad([163,23],[230,-6],[294,52],60);for(var k=0;k<chainPath.length-2;k+=2){var a=chainPath[k],b=chainPath[k+2],mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,ang=Math.atan2(b[1]-a[1],b[0]-a[0]);s.push(rotateAbout(ellipse(mx,my,4.5,(k/2)%2?1.2:2.6),mx,my,ang));}
  for(var m=0;m<60;m++){var a2=m*TAU/60,r0=m%5?50:44;s.push([[150+r0*Math.cos(a2),110+r0*Math.sin(a2)],[150+53*Math.cos(a2),110+53*Math.sin(a2)]]);}
  [0,1,2,3].forEach(function(q){var a3=q*Math.PI/2;for(var d=-1.5;d<=1.5;d+=3){var px=-Math.sin(a3)*d,py=Math.cos(a3)*d;s.push([[150+40*Math.cos(a3)+px,110+40*Math.sin(a3)+py],[150+53*Math.cos(a3)+px,110+53*Math.sin(a3)+py]]);}});
  s.push(circle(150,136,11));for(var j=0;j<12;j++){var a4=j*TAU/12;s.push([[150+9*Math.cos(a4),136+9*Math.sin(a4)],[150+11*Math.cos(a4),136+11*Math.sin(a4)]]);}s.push([[150,136],[156,131]]);
  var hr=[[150,110],[136,98],[131,88],[140,95],[150,110]];s.push(hr);var mn=[[150,110],[176,74],[180,66],[172,72],[150,110]];s.push(mn);
  s.push(circle(150,110,3));
  s.push([[4,186],[296,186]]);s.push.apply(s,hatch([[4,186],[296,186],[296,196],[4,196]],3.4,-20));
  return s;}},

{name:'Acoustic guitar',titles:["Six Strings, Waiting", "Porch Session", "Before the First Chord", "Spruce Top"],build(R){var s=[];
  var body=arc(80,105,48,48,40*Math.PI/180,320*Math.PI/180).concat(quad([116.8,74.1],[128,84],[139,83.1]).slice(1),arc(165,105,34,34,220*Math.PI/180,500*Math.PI/180).slice(1),quad([139,126.9],[128,126],[116.8,135.9]).slice(1));
  s.push(body);
  var inset=scaleAbout(body,112,105,0.93);s.push(inset);
  s.push(circle(146,105,12));s.push(circle(146,105,15));s.push(circle(146,105,17));
  s.push.apply(s,hatch(ellipse(146,105,12,12),2,0));
  var pg=[[152,118],[166,113],[177,122],[170,134],[154,132]];s.push(poly(pg));s.push.apply(s,hatch(pg,1.8,30));
  var br=rect(76,95,88,115);s.push(br);s.push([[84,96],[84,114]]);
  s.push(rect(199,99,270,111));for(var f=0,x=206;x<268;f++,x+=9-f*0.35)s.push([[x,99],[x,111]]);
  [221,239,253].forEach(function(dx){s.push(circle(dx,105,1));});
  var head=[[270,97],[292,93],[295,117],[270,113]];s.push(poly(head));
  [276,283,290].forEach(function(px){s.push(circle(px,92,2.2));s.push(circle(px,118,2.2));});
  for(var k=0;k<6;k++){var y=100.5+k*1.8;s.push([[84,y],[272,y]]);}
  var shadow=ellipse(140,168,118,11);s.push(shadow);s.push.apply(s,hatch(shadow,3,0));
  for(var g=0;g<5;g++){s.push(arc(80,105,40-g*6,40-g*6,1.2,2.4));}
  return s;}},

{name:'Teapot and teacup',titles:["Second Pour", "Steeping", "Four O'Clock", "Chamomile for One"],build(R){var s=[];
  s.push([[4,170],[296,170]]);
  var cloth=[[4,172],[296,172],[296,196],[4,196]];s.push.apply(s,hatch(cloth,7,0));s.push.apply(s,hatch(cloth,7,90));
  var body=ellipse(125,118,46,36);s.push(body);s.push(ellipse(125,152,30,5));
  s.push.apply(s,hatch(arc(125,118,46,36,-Math.PI/2,Math.PI/2).concat(arc(117,118,32,34,Math.PI/2,-Math.PI/2)),2.4,70));
  s.push(arc(125,110,45,6,0,Math.PI));s.push(arc(125,124,45.5,6,0,Math.PI));
  for(var k=0;k<7;k++){var x=92+k*11;s.push(scallop(x,117.5+3*Math.sin(k),3,3,5,.35));}
  s.push(ellipse(125,82,28,6));var lid=arc(125,82,22,15,Math.PI,TAU);s.push(lid);s.push(circle(125,63,5));
  s.push(cubic([168,128],[190,124],[194,90],[212,72]));s.push(cubic([170,106],[184,102],[188,84],[205,68]));s.push([[205,68],[212,72]]);
  s.push(cubic([93,94],[50,88],[50,146],[95,141]));s.push(cubic([96,103],[66,100],[66,134],[97,132]));
  s.push(ellipse(236,167,40,6));s.push(ellipse(236,138,22,4));
  s.push(quad([214,138],[216,162],[228,164]).concat([[244,164]],quad([244,164],[256,162],[258,138]).slice(1)));
  s.push(arc(259,148,8,9,-Math.PI/2,Math.PI/2));
  for(var w=0;w<3;w++){var p=[];for(var q=0;q<=20;q++){var t=q/20;p.push([228+w*8+4*Math.sin(t*7+w),132-30*t]);}s.push(p);}
  return s;}},

{name:'Barn and silo',titles:["Haying Season", "County Road Barn", "Morning Chores", "Silo Shadow"],build(R){var s=[];
  s.push(quad([4,110],[34,100],[68,104]));
  s.push([[4,170],[296,170]]);s.push(grass(4,296,170,5,4,R));
  var barn=[[70,170],[70,106],[92,76],[130,62],[168,76],[190,106],[190,170]];s.push(barn);
  var roof=[[66,108],[90,74],[130,58],[170,74],[194,108],[186,108],[166,79],[130,66],[94,79],[74,108]];s.push(poly(roof));s.push.apply(s,hatch(roof,2.2,0));
  for(var x=76;x<185;x+=6){var top=x<92?106-(x-70)*1.36:x<130?79-(x-92)*0.34:x<168?66+(x-130)*0.34:79+(x-168)*1.23;if(x<105||x>155)s.push([[x,top+3],[x,170]]);else s.push([[x,top+3],[x,120]]);}
  s.push(rect(105,120,155,170));s.push([[105,120],[155,170]]);s.push([[155,120],[105,170]]);s.push([[130,120],[130,170]]);
  s.push(rect(120,82,140,100));s.push([[120,82],[140,100]]);s.push([[140,82],[120,100]]);
  s.push(rect(200,72,226,170));s.push(arc(213,72,13,13,Math.PI,TAU));for(var y=82;y<170;y+=10)s.push([[200,y],[226,y]]);
  s.push.apply(s,hatch(arc(213,72,13,13,Math.PI,TAU).concat([[200,72]]),1.8,0));
  s.push([[10,150],[64,150]]);s.push([[10,160],[64,160]]);for(var fx=12;fx<64;fx+=13)s.push([[fx,170],[fx,144]]);
  s.push([[252,170],[254,128]]);s.push([[262,170],[260,128]]);s.push(scallop(257,112,26,22,9,.16));s.push.apply(s,hatch(scallop(257,112,26,22,9,.16),3.5,-30));
  var sun=circle(40,40,12);s.push(sun);for(var k=0;k<12;k++){var a=k*TAU/12;s.push([[40+15*Math.cos(a),40+15*Math.sin(a)],[40+21*Math.cos(a),40+21*Math.sin(a)]]);}
  return s;}},

{name:'Owl on a branch',titles:["Who Goes There", "Night Shift", "The Long Stare", "Perched"],build(R){var s=[];
  s.push([[40,176],[22,150],[12,138]]);s.push(rotateAbout(ellipse(14,132,8,3.5),14,132,-1.0));s.push(rotateAbout(ellipse(26,148,7,3),26,148,0.5));s.push([[30,160],[44,150]]);s.push(rotateAbout(ellipse(50,146,7,3),50,146,-0.5));
  var body=ellipse(150,106,42,60);s.push(body);
  s.push([[119,64],[117,36],[134,52]]);s.push([[181,64],[183,36],[166,52]]);
  [133,167].forEach(function(ex){s.push(circle(ex,76,18));s.push(circle(ex,76,9));s.push(ellipse(ex,76,4.5,4.5));s.push.apply(s,hatch(ellipse(ex,76,4.5,4.5),1.4,0));for(var k=0;k<16;k++){var a=k*TAU/16;s.push([[ex+11*Math.cos(a),76+11*Math.sin(a)],[ex+17*Math.cos(a),76+17*Math.sin(a)]]);}});
  s.push(poly([[150,84],[145,92],[150,102],[155,92]]));
  for(var y=108;y<160;y+=8){var hw=Math.sqrt(Math.max(0,1-Math.pow((y-106)/60,2)))*42-8,xl=150-hw,xr=150+hw,p=[];for(var x=xl;x<=xr;x+=1)p.push([x,y+3*Math.abs(Math.sin(Math.PI*(x-xl)/8))]);s.push(p);}
  var wl=arc(150,106,42,60,Math.PI*0.62,Math.PI*1.12).concat(quad([116,72],[124,120],[126,158]));s.push.apply(s,hatch(wl,3,70));
  var wr=arc(150,106,42,60,-Math.PI*0.12,Math.PI*0.38).concat(quad([174,158],[176,120],[184,72]));s.push.apply(s,hatch(wr,3,-70));
  [138,162].forEach(function(fx){for(var t=-1;t<=1;t++)s.push([[fx+t*4,164],[fx+t*5,170]]);});
  var top=[[4,170],[296,162]],bot=[[4,180],[296,172]];s.push(top);s.push(bot);
  s.push.apply(s,hatch([[4,170],[296,162],[296,172],[4,180]],2.6,-15));
  s.push([[240,164],[262,140],[276,132]]);s.push(rotateAbout(ellipse(272,128,9,4),272,128,-0.7));s.push(rotateAbout(ellipse(262,138,8,3.5),262,138,0.6));
  return s;}},

{name:'Toadstools',titles:["After the Rain", "Forest Floor", "Fairy Ring", "Under the Fern"],build(R){var s=[];
  var G=wave(4,296,170,2,50);s.push(G);s.push(grass(4,296,170,6,4,R));
  var cap=arc(120,100,54,42,Math.PI,TAU);s.push(cap.concat(quad([174,100],[120,114],[66,100]).slice(1)));
  for(var k=0;k<=20;k++){var t=k/20,u=quad([66,100],[120,114],[174,100],20)[k];s.push([[120,110],u]);}
  [[100,74,7],[128,66,5],[150,82,6],[86,92,4],[118,88,4],[160,96,3]].forEach(function(c){s.push(circle(c[0],c[1],c[2]));});
  s.push.apply(s,hatch(arc(120,100,54,42,-Math.PI/2,0).concat([[150,100],[136,64]]),2.6,40));
  s.push(quad([110,110],[104,140],[106,170]));s.push(quad([132,110],[138,140],[136,170]));
  s.push(arc(121,126,16,5,0,Math.PI));s.push(arc(121,126,16,5,Math.PI,TAU));
  s.push.apply(s,hatch([[126,112],[132,110],[138,140],[136,170],[128,170],[128,140]],2,0));
  var cap2=arc(218,138,28,22,Math.PI,TAU);s.push(cap2.concat(quad([246,138],[218,146],[190,138]).slice(1)));
  [[210,126,4],[226,124,3],[232,134,2.5]].forEach(function(c){s.push(circle(c[0],c[1],c[2]));});
  s.push(quad([212,144],[208,158],[210,170]));s.push(quad([224,144],[228,158],[226,170]));
  var cap3=arc(48,154,14,11,Math.PI,TAU);s.push(cap3.concat([[34,154]]));s.push([[45,155],[44,170]]);s.push([[51,155],[52,170]]);
  var fr=quad([262,170],[268,120],[292,98],30);s.push(fr);fr.forEach(function(p,i){if(i%3===1&&i<28){var a=Math.atan2(fr[i+1][1]-p[1],fr[i+1][0]-p[0]);s.push([p,[p[0]+9*Math.cos(a-1.2),p[1]+9*Math.sin(a-1.2)]]);s.push([p,[p[0]+9*Math.cos(a+1.2),p[1]+9*Math.sin(a+1.2)]]);}});
  s.push.apply(s,hatch(G.concat([[296,196],[4,196]]),4,-25));
  return s;}},

{name:'Saturn',titles:["Ringed and Distant", "Sixth from the Sun", "Cassini Gap", "Slow Orbit"],build(R){var s=[];var cx=150,cy=100,r=46,tilt=-0.2;
  var inPlanet=function(p){return Math.hypot(p[0]-cx,p[1]-cy)<r;};
  var ringPt=function(rx,ry,a){var x=rx*Math.cos(a),y=ry*Math.sin(a);return [cx+x*Math.cos(tilt)-y*Math.sin(tilt),cy+x*Math.sin(tilt)+y*Math.cos(tilt),Math.sin(a)];};
  var front=function(p){return p[2]>0;};
  var keep=function(p){return front(p)||!inPlanet(p);};
  var ringLine=function(rx,ry){var seg=[],out=[];for(var i=0;i<=240;i++){var p=ringPt(rx,ry,i/240*TAU);if(keep(p))seg.push([p[0],p[1]]);else{if(seg.length>1)out.push(seg);seg=[];}}if(seg.length>1)out.push(seg);return out;};
  var hidden=function(p){for(var q=0;q<=1;q+=1){}var x=p[0]-cx,y=p[1]-cy,xr=x*Math.cos(-tilt)-y*Math.sin(-tilt),yr=x*Math.sin(-tilt)+y*Math.cos(-tilt);return yr>0&&Math.abs(yr)<26*Math.sqrt(Math.max(0,1-xr*xr/(100*100)))&&Math.abs(yr)>15*Math.sqrt(Math.max(0,1-xr*xr/(64*64)))&&xr*xr/(100*100)+yr*yr/(26*26)<1;};
  var pl=[],seg=[];for(var i=0;i<=200;i++){var a=i/200*TAU,p=[cx+r*Math.cos(a),cy+r*Math.sin(a)];if(!hidden(p))seg.push(p);else{if(seg.length>1)pl.push(seg);seg=[];}}if(seg.length>1)pl.push(seg);pl.forEach(function(q){s.push(q);});
  [-30,-18,-6,8,20].forEach(function(dy,k){var hw=Math.sqrt(r*r-dy*dy)-0.5,b=quad([cx-hw,cy+dy],[cx,cy+dy+5],[cx+hw,cy+dy]);s.push(b.filter(function(p){return !hidden(p);}));});
  var band=quad([cx-Math.sqrt(r*r-324),cy-18],[cx,cy-13],[cx+Math.sqrt(r*r-324),cy-18]).concat(quad([cx+Math.sqrt(r*r-36),cy-6],[cx,cy-1],[cx-Math.sqrt(r*r-36),cy-6]));s.push.apply(s,hatch(band,2.2,0));
  s.push.apply(s,hatch(arc(cx,cy,r,r,-Math.PI/2,Math.PI/2).concat(arc(cx-12,cy,r-6,r,Math.PI/2,-Math.PI/2)).filter(function(p){return !hidden(p);}),2.6,60));
  [[64,15],[72,18],[80,20.5],[86,22],[100,26]].forEach(function(e){ringLine(e[0],e[1]).forEach(function(q){s.push(q);});});
  var zig=[],zs=[];for(var j=0;j<=180;j++){var a2=j/180*TAU,p1=ringPt(j%2?64:72,j%2?15:18,a2);if(keep(p1))zig.push([p1[0],p1[1]]);else{if(zig.length>1)zs.push(zig);zig=[];}}if(zig.length>1)zs.push(zig);zs.forEach(function(q){s.push(q);});
  var zig2=[],zs2=[];for(var j2=0;j2<=240;j2++){var a3=j2/240*TAU,p2=ringPt(j2%2?86:100,j2%2?22:26,a3);if(keep(p2))zig2.push([p2[0],p2[1]]);else{if(zig2.length>1)zs2.push(zig2);zig2=[];}}if(zig2.length>1)zs2.push(zig2);zs2.forEach(function(q){s.push(q);});
  return s;}},

{name:'Bonsai tree',titles:["Forty Years Small", "Patient Branches", "Windswept, Potted", "Quiet Pruning"],build(R){var s=[];
  s.push([[30,188],[270,188]]);s.push.apply(s,hatch([[40,188],[260,188],[260,196],[40,196]],3,0));
  s.push(rect(90,150,210,158));var pot=[[96,158],[204,158],[194,184],[106,184]];s.push(poly(pot));s.push.apply(s,hatch(pot,2.4,0));
  s.push(rect(108,184,120,188));s.push(rect(180,184,192,188));
  s.push(scallop(150,150,46,3,14,.6).filter(function(p){return p[1]<=150.5;}));
  var L=cubic([134,150],[108,118],[172,100],[140,66]),Rr=cubic([160,150],[134,116],[192,98],[156,64]);s.push(L);s.push(Rr);
  for(var k=1;k<4;k++){s.push(L.map(function(p,i){return lerp(p,Rr[i],k/4);}).filter(function(p,i){return i%2===0||true;}).slice(4+k,30-k));}
  s.push(quad([132,96],[104,84],[72,82]));s.push(quad([138,100],[108,92],[74,90]));
  s.push(quad([162,88],[194,78],[226,70]));s.push(quad([164,96],[196,86],[228,78]));
  [[74,76,32,13],[226,64,34,14],[148,46,42,18],[112,62,20,9]].forEach(function(f){var sc=scallop(f[0],f[1],f[2],f[3],11,.2);s.push(sc);s.push.apply(s,hatch(sc,3,-30));});
  return s;}},

{name:'Castle',titles:["Raise the Portcullis", "Hilltop Keep", "Stone upon Stone", "Flag Over the Keep"],build(R){var s=[];
  var hill=quad([4,180],[150,150],[296,180]);s.push(hill);s.push.apply(s,hatch(hill.concat([[296,196],[4,196]]),3.5,-10));
  var cren=function(x0,x1,y,h,w){var p=[[x0,y]],up=true;for(var x=x0;x<x1-0.1;x+=w){var nx=Math.min(x1,x+w);if(up){p.push([x,y-h],[nx,y-h],[nx,y]);}else p.push([nx,y]);up=!up;}return p;};
  s.push(cren(80,220,110,7,7));s.push([[80,110],[80,166]]);s.push([[220,110],[220,166]]);
  s.push.apply(s,bricks(80,116,220,164,12,6).filter(function(st){return true;}));
  [[58,92],[212,242]].forEach(function(t){s.push(cren(t[0],t[1]===92?92:242,80,7,6.8));});
  s.push([[58,80],[58,170]]);s.push([[92,80],[92,170]]);s.push([[212,80],[212,170]]);s.push([[242,80],[242,170]]);
  s.push.apply(s,bricks(58,86,92,168,10,6));s.push.apply(s,bricks(212,86,242,168,10,6));
  s.push(rect(124,48,176,110));s.push.apply(s,bricks(124,54,176,108,10,6));
  var cone=[[118,48],[150,12],[182,48]];s.push(poly(cone));s.push.apply(s,hatch(cone,2.3,0));
  s.push([[150,12],[150,3]]);s.push([[150,3],[166,6],[150,9]]);
  var gate=[[138,164],[138,142]].concat(arc(150,142,12,12,Math.PI,TAU),[[162,164]]);s.push(gate);
  for(var gx=141;gx<162;gx+=4)s.push([[gx,140],[gx,164]]);for(var gy=146;gy<164;gy+=5)s.push([[138,gy],[162,gy]]);
  [[73,100],[227,100],[150,70]].forEach(function(w){s.push(rect(w[0]-2,w[1],w[0]+2,w[1]+12));});
  s.push(quad([150,165],[140,176],[120,196]));s.push(quad([150,165],[170,176],[182,196]));
  return s;}},

{name:'Pineapple',titles:["Crown and Diamonds", "Tropical Still Life", "Sliced at Last", "Welcome"],build(R){var s=[];
  s.push([[4,178],[296,178]]);var sh=ellipse(156,180,58,6);s.push.apply(s,hatch(sh,2.4,0));
  var body=ellipse(150,125,40,52);s.push(body);
  s.push.apply(s,hatch(body,9,45));s.push.apply(s,hatch(body,9,-45));
  for(var k=0;k<11;k++){var a=-Math.PI*0.1-k*Math.PI*0.8/10,len=30+34*Math.sin(Math.PI*k/10)+6*R(),b=[150+10*Math.cos(a+Math.PI/2),76],tip=[150+len*Math.cos(a)*1.0,76+len*Math.sin(a)],b2=[150-10*Math.cos(a+Math.PI/2),76];
    s.push(quad(b,[ (b[0]+tip[0])/2+4*Math.sin(a), (b[1]+tip[1])/2-2],tip,14).concat(quad(tip,[(b2[0]+tip[0])/2-4*Math.sin(a),(b2[1]+tip[1])/2+2],b2,14).slice(1)));}
  s.push(circle(240,160,18));s.push(circle(240,160,15));s.push(circle(240,160,5));
  for(var j=0;j<12;j++){var a2=j*TAU/12;s.push([[240+5*Math.cos(a2),160+5*Math.sin(a2)],[240+15*Math.cos(a2),160+15*Math.sin(a2)]]);}
  return s;}},

{name:'Sunflowers',titles:["Facing East", "Late August", "Over the Fence", "Seed Spirals"],build(R){var s=[];
  var flower=function(cx,cy,rd,rp,np,stemTo){s.push(circle(cx,cy,rd));
    for(var k=0;k<14;k++){var a0=k*TAU/14;s.push(spiral(cx,cy,1.5,rd,0.45,a0));s.push(spiral(cx,cy,1.5,rd,-0.45,a0+0.2).map(function(p){return p;}));}
    for(var i=0;i<np;i++){var a=i*TAU/np+0.1,b1=[cx+rd*Math.cos(a-0.16),cy+rd*Math.sin(a-0.16)],b2=[cx+rd*Math.cos(a+0.16),cy+rd*Math.sin(a+0.16)],tip=[cx+rp*Math.cos(a),cy+rp*Math.sin(a)],m=(rd+rp)/2;
      s.push(quad(b1,[cx+m*Math.cos(a-0.3),cy+m*Math.sin(a-0.3)],tip,12).concat(quad(tip,[cx+m*Math.cos(a+0.3),cy+m*Math.sin(a+0.3)],b2,12).slice(1)));
      s.push([[cx+(rd+2)*Math.cos(a),cy+(rd+2)*Math.sin(a)],[cx+(rp-6)*Math.cos(a),cy+(rp-6)*Math.sin(a)]]);}
    s.push(quad([cx-3,cy+rd],[cx-6,(cy+stemTo)/2],[cx-4,stemTo]));s.push(quad([cx+3,cy+rd],[cx,(cy+stemTo)/2],[cx+2,stemTo]));};
  flower(140,74,22,48,20,196);flower(238,112,13,28,16,196);
  var leaf=function(base,tip,side){var m=lerp(base,tip,0.5),n=[-(tip[1]-base[1]),tip[0]-base[0]],l=Math.hypot(n[0],n[1]);n=[n[0]/l*16*side,n[1]/l*16*side];
    var e1=quad(base,[m[0]+n[0],m[1]+n[1]],tip),e2=quad(tip,[m[0]-n[0],m[1]-n[1]],base);s.push(e1.concat(e2.slice(1)));s.push([base,tip]);
    for(var t=0.2;t<0.9;t+=0.17){var p=lerp(base,tip,t);s.push([p,[p[0]+n[0]*0.5+(tip[0]-base[0])*0.1,p[1]+n[1]*0.5+(tip[1]-base[1])*0.1]]);}};
  leaf([136,150],[80,130],1);leaf([140,170],[196,152],-1);
  s.push([[4,186],[296,186]]);for(var x=12;x<296;x+=22){s.push(rect(x,150,x+10,186));s.push([[x,150],[x+5,144],[x+10,150]]);}
  return s;}},

{name:'Anchor and rope',titles:["Dropped Anchor", "Holding Ground", "Fathoms Down", "Moored"],build(R){var s=[];
  var bed=wave(4,296,186,2,50);s.push(bed);s.push.apply(s,hatch(bed.concat([[296,196],[4,196]]),2.8,15));
  s.push(circle(150,30,11));s.push(circle(150,30,6));
  var sh=rect(145,41,155,158);s.push(sh);s.push.apply(s,hatch(sh,2,90));
  s.push(rect(113,52,187,61));s.push(circle(113,56.5,4.5));s.push(circle(187,56.5,4.5));
  var arms=arc(150,112,64,54,Math.PI*0.17,Math.PI*0.83).concat(arc(150,108,52,44,Math.PI*0.83,Math.PI*0.17).slice(0));s.push(poly(arms));s.push.apply(s,hatch(arms,2.4,0));
  var lp=[150+64*Math.cos(Math.PI*0.83),112+54*Math.sin(Math.PI*0.83)],rp=[150+64*Math.cos(Math.PI*0.17),112+54*Math.sin(Math.PI*0.17)];
  s.push(poly([lp,[lp[0]-14,lp[1]-26],[lp[0]+8,lp[1]-10]]));s.push(poly([rp,[rp[0]+14,rp[1]-26],[rp[0]-8,rp[1]-10]]));
  var rope=[],rope2=[];for(var y=36;y<=150;y+=1.5){var x=150+17*Math.sin((y-36)/9);rope.push([x,y]);rope2.push([x+3.2,y+1.5]);}s.push(rope);s.push(rope2);
  for(var k=0;k<rope.length;k+=4)s.push([rope[k],rope2[k]]);
  s.push(quad(rope[rope.length-1],[196,170],[236,176]));s.push(spiral(250,176,3,22,3,0).map(function(p){return [p[0],176+(p[1]-176)*0.32];}));
  for(var w=0;w<3;w++){var bx=[30,46,272][w],p=[];for(var q=0;q<=24;q++){var t=q/24;p.push([bx+4*Math.sin(t*8+w),interpY(bed,bx)-50*t]);}s.push(p);}
  return s;}},

{name:'Cable car',titles:["Hold On Tight", "Climbing the Hill", "Bell at the Corner", "Powell Street Morning"],build(R){var s=[];
  var sky=[[4,70],[22,70],[22,52],[32,42],[42,52],[42,70],[56,70],[56,46],[76,46],[76,70],[90,70],[90,40],[100,32],[110,40],[110,70],[124,70],[124,50],[146,50],[146,70],[160,70],[160,38],[172,28],[184,38],[184,70],[200,70],[200,48],[222,48],[222,70],[236,70],[236,44],[246,36],[256,44],[256,70],[270,70],[270,54],[296,54]];s.push(sky);
  [[28,56],[64,54],[98,46],[134,58],[170,44],[208,56],[244,50],[280,60]].forEach(function(w){s.push(rect(w[0],w[1],w[0]+6,w[1]+8));});
  s.push([[4,162],[296,162]]);s.push([[4,166],[296,166]]);s.push([[4,174],[296,174]]);s.push([[4,178],[296,178]]);
  s.push.apply(s,hatch([[4,180],[296,180],[296,196],[4,196]],5,0));for(var cx=10;cx<296;cx+=14)s.push([[cx,180],[cx+((cx/14)%2?5:-5),196]]);
  s.push(rect(60,118,240,150));s.push(rect(66,124,234,144));s.push.apply(s,hatch([[66,124],[234,124],[234,144],[66,144]],2.6,0));
  s.push(quad([50,82],[150,72],[250,82]));s.push(quad([56,88],[150,78],[244,88]));s.push(rect(92,66,208,79));for(var k=96;k<208;k+=10)s.push(rect(k,68,k+6,76));
  for(var x=60;x<=240;x+=18)s.push([[x,86],[x,118]]);s.push([[60,108],[240,108]]);
  s.push.apply(s,hatch([[60,86],[78,86],[78,108],[60,108]],2,90));s.push.apply(s,hatch([[222,86],[240,86],[240,108],[222,108]],2,90));
  [88,110,190,212].forEach(function(w){s.push(circle(w,156,7));s.push(circle(w,156,2));});
  s.push(rect(52,146,62,152));s.push(rect(238,146,248,152));
  return s;}},

{name:'Garden snail',titles:["No Hurry", "Leaf Crossing", "Spiral House", "Slow Lane"],build(R){var s=[];
  var leafTop=quad([10,168],[150,138],[292,160]),leafBot=quad([292,160],[150,190],[10,168]);s.push(leafTop.concat(leafBot.slice(1)));s.push(quad([10,168],[150,164],[292,160]));
  for(var t=0.12;t<0.95;t+=0.1){var p=quad([10,168],[150,164],[292,160],100)[Math.round(t*100)];s.push([p,[p[0]+18,p[1]-10]]);s.push([p,[p[0]+18,p[1]+11]]);}
  var body=[[62,152],[60,140],[66,128],[78,124],[92,130],[104,142],[230,146],[252,150],[232,154],[62,154]];s.push(body);
  s.push([[70,126],[58,98]]);s.push(circle(57,96,3));s.push([[78,124],[74,96]]);s.push(circle(74,94,3));s.push([[64,140],[56,146]]);
  s.push.apply(s,hatch([[104,142],[230,146],[252,150],[232,154],[104,154]],2.2,0));
  var sh=spiral(162,100,2,46,3.2,0.4);s.push(sh);s.push(circle(162,100,46.5));
  for(var k=0;k<36;k++){var a=k*TAU/36;s.push([[162+8*Math.cos(a),100+8*Math.sin(a)],[162+46*Math.cos(a),100+46*Math.sin(a)]]);}
  s.push.apply(s,hatch(arc(162,100,46,46,-0.4,1.6).concat(arc(158,96,40,40,1.6,-0.4)),2.2,50));
  return s;}},

{name:'Jellyfish',titles:["Drift", "Lantern of the Deep", "Trailing Light", "Open Water"],build(R){var s=[];
  var bell=arc(150,72,50,44,Math.PI,TAU);var rim=[];for(var x=200;x>=100;x-=1)rim.push([x,72+4*Math.abs(Math.sin(Math.PI*(x-100)/12.5))]);s.push(bell.concat(rim));
  s.push(arc(150,72,36,30,Math.PI,TAU));s.push.apply(s,hatch(bell.concat([[100,72]]),4,-35));
  [[132,58],[150,54],[168,58]].forEach(function(g){s.push(arc(g[0],g[1],7,6,Math.PI*0.1,Math.PI*1.9));});
  for(var k=0;k<4;k++){var x0=140+k*7,a=[],b=[];for(var y=74;y<=176;y+=1){var sw=Math.sin((y-74)/16+k)*10,fr=1.8*Math.sin(y*1.1);a.push([x0+sw+fr,y]);b.push([x0+sw+5-fr,y]);}s.push(a);s.push(b);}
  for(var t=0;t<9;t++){var tx=106+t*11,p=[];for(var y2=76;y2<=192;y2+=2)p.push([tx+5*Math.sin((y2-76)/14+t*0.7),y2]);s.push(p);}
  var sb=arc(56,42,18,15,Math.PI,TAU);var sr=[];for(var x2=74;x2>=38;x2-=1)sr.push([x2,42+2*Math.abs(Math.sin(Math.PI*(x2-38)/6))]);s.push(sb.concat(sr));
  for(var u=0;u<5;u++){var q=[];for(var y3=44;y3<=92;y3+=2)q.push([42+u*7+3*Math.sin(y3/10+u),y3]);s.push(q);}
  return s;}},

{name:'Rowboat at the dock',titles:["Tied Up for the Night", "Low Tide, Late", "Oars In", "Still Water Landing"],build(R){var s=[];
  s.push(quad([180,96],[230,82],[296,92]));s.push([[150,100],[296,100]]);
  for(var i=0;i<12;i++){var y=106+i*7.5,x0=4+((i*37)%30),x1=296-((i*53)%40);s.push(wave(x0,x1,y,1.5,14+i,i));}
  s.push(rect(4,96,130,104));for(var x=10;x<130;x+=8)s.push([[x,96],[x,104]]);
  [20,60,100].forEach(function(px){var p=rect(px,104,px+7,150);s.push(p);s.push.apply(s,hatch(p,2,0));});
  s.push(rect(118,90,124,96));s.push(rect(114,88,128,90));
  var gun=quad([152,122],[215,134],[286,112]),bot=quad([166,148],[215,160],[272,138]);s.push(gun);s.push(bot);s.push([[152,122],[166,148]]);s.push([[286,112],[272,138]]);s.push(quad([156,126],[215,137],[282,117]));
  for(var k=1;k<3;k++)s.push(gun.map(function(p,j){return lerp(p,bot[j],k/3);}));
  s.push.apply(s,hatch(gun.concat(bot.slice().reverse()),3,80));
  s.push([[184,128],[262,121]]);s.push(rotateAbout(ellipse(270,120,9,2.6),270,120,-0.09));s.push([[205,128],[205,118]]);s.push([[240,125],[240,116]]);
  s.push(quad([121,92],[136,120],[152,129]));
  for(var r=0;r<6;r++){var y2=158+r*6;s.push([[176+r*4,y2],[256-r*6,y2]]);}
  return s;}},

{name:'Covered bridge',titles:["Kissing Bridge", "Over the Creek", "Hoofbeats on Planks", "Shelter for the Crossing"],build(R){var s=[];
  var lb=[[4,128],[70,132],[96,160],[96,196]],rb=[[296,128],[230,132],[204,160],[204,196]];s.push(lb);s.push(rb);
  s.push.apply(s,hatch(lb.concat([[4,196]]),4,30));s.push.apply(s,hatch(rb.concat([[296,196]]),4,-30));
  for(var i=0;i<4;i++)s.push(wave(98,202,166+i*8,1.5,14,i));
  s.push(rect(70,92,230,132));for(var x=75;x<230;x+=5)s.push([[x,92],[x,132]]);
  [[96,104,114,116],[141,104,159,116],[186,104,204,116]].forEach(function(w){var r=rect(w[0],w[1],w[2],w[3]);s.push(r);s.push.apply(s,hatch(r,1.6,0));});
  var roof=[[62,92],[80,68],[220,68],[238,92]];s.push(poly(roof));s.push.apply(s,hatch(roof,2.4,0));
  s.push.apply(s,bricks(66,132,88,160,7,5));s.push(rect(66,132,88,160));s.push.apply(s,bricks(212,132,234,160,7,5));s.push(rect(212,132,234,160));
  pine(26,128,1).forEach(function(t){s.push(t);});pine(272,128,0.9).forEach(function(t){s.push(t);});
  return s;}},

{name:'Treehouse in an oak',titles:["Members Only", "Up the Ladder", "Summer Headquarters", "The Lookout"],build(R){var s=[];
  s.push([[4,184],[296,184]]);s.push(grass(4,296,184,5,4,R));
  s.push([[136,184],[142,112]]);s.push([[168,184],[162,112]]);s.push([[126,184],[136,176]]);s.push([[178,184],[168,176]]);
  for(var k=0;k<4;k++)s.push([[145+k*5,180],[147+k*4,118]]);
  s.push([[142,120],[96,92]]);s.push([[162,118],[232,98]]);
  [[78,64,46,26],[226,66,44,26],[152,30,52,18]].forEach(function(c){var sc=scallop(c[0],c[1],c[2],c[3],10,.2);s.push(sc);s.push.apply(s,hatch(sc,3.6,-30));});
  s.push(rect(106,108,198,114));s.push([[120,114],[142,134]]);s.push([[184,114],[162,134]]);
  s.push(rect(118,80,186,108));for(var y=86;y<108;y+=5)s.push([[118,y],[186,y]]);
  var roof=[[112,80],[152,56],[192,80]];s.push(poly(roof));s.push.apply(s,hatch(roof,2.2,0));
  s.push(rect(128,88,142,108));s.push(rect(158,88,176,100));s.push([[167,88],[167,100]]);
  s.push([[110,114],[104,184]]);s.push([[120,114],[115,184]]);for(var ry=124;ry<184;ry+=10)s.push([[110-(ry-114)*0.086,ry],[120-(ry-114)*0.07,ry]]);
  s.push([[214,103],[212,160]]);s.push([[228,99],[230,160]]);s.push(rect(206,160,236,164));
  return s;}},

{name:'Hourglass',titles:["Halfway Through", "Sand and Glass", "Running Out", "Turn It Over"],build(R){var s=[];
  s.push([[4,184],[296,184]]);var sh=ellipse(170,187,70,4);s.push.apply(s,hatch(sh,2,0));
  s.push(rect(98,20,202,32));s.push(rect(98,172,202,184));
  [110,190].forEach(function(px){var a=[],b=[];for(var y=32;y<=172;y+=2){var w=2.5+1.6*Math.abs(Math.sin(y/7));a.push([px-w,y]);b.push([px+w,y]);}s.push(a);s.push(b);});
  var tl=cubic([126,32],[116,74],[146,88],[147.5,100]),tr=cubic([174,32],[184,74],[154,88],[152.5,100]);
  var bl=cubic([147.5,100],[146,112],[116,126],[126,172]),br=cubic([152.5,100],[154,112],[184,126],[174,172]);
  s.push(tl);s.push(tr);s.push(bl);s.push(br);
  s.push(cubic([130,40],[124,70],[136,82],[142,90]));
  var sandTop=[];tl.forEach(function(p){if(p[1]>=66)sandTop.push(p);});var tr2=[];tr.forEach(function(p){if(p[1]>=66)tr2.push(p);});var st=sandTop.concat(tr2.reverse());s.push.apply(s,hatch(st,1.8,0));
  s.push([[150,100],[150,150]]);
  var pile=quad([129,172],[150,138],[171,172]);s.push(pile);s.push.apply(s,hatch(pile,1.8,0));
  return s;}},

{name:'Field camera on a tripod',titles:["Hold Still", "Long Exposure", "Under the Dark Cloth", "Bellows and Brass"],build(R){var s=[];
  s.push([[4,190],[296,190]]);for(var x=4;x<296;x+=24)s.push([[x,190],[x-18,196]]);
  s.push([[150,120],[96,190]]);s.push([[150,120],[204,190]]);s.push([[150,120],[150,190]]);s.push(poly([[123,156],[177,156],[150,170]]));
  s.push(rect(126,114,174,120));s.push(rect(86,110,200,114));
  var back=rect(160,48,198,110);s.push(back);s.push.apply(s,planks(164,52,194,106,5,true));s.push(rect(164,52,194,106));
  s.push(rect(90,58,106,110));
  s.push([[106,62],[160,52]]);s.push([[106,106],[160,108]]);
  for(var f=0;f<9;f++){var x0=106+f*6,t0=62-f*1.11,b0=106+f*0.22;s.push([[x0,t0],[x0+3,t0+4],[x0+3,b0-4],[x0,b0]]);s.push([[x0+3,t0+4],[x0+6,t0-0.6]]);s.push([[x0+3,b0-4],[x0+6,b0+0.2]]);}
  s.push(rect(74,72,90,94));s.push(circle(70,83,13));s.push(circle(70,83,9));var g=ellipse(70,83,5,5);s.push(g);s.push.apply(s,hatch(g,1.4,0));
  s.push(rect(176,40,182,48));s.push([[196,60],[208,60],[208,70]]);
  return s;}},

{name:'Ship in a bottle',titles:["How Did It Get In There", "Becalmed in Glass", "Shelf Voyage", "Three Masts, No Wind"],build(R){var s=[];
  s.push([[4,172],[296,172]]);s.push.apply(s,hatch([[4,174],[296,174],[296,196],[4,196]],5,10));
  var top=[[60,70],[200,70]].concat(quad([200,70],[222,70],[230,94]).slice(1),[[252,96]]);
  var bot=top.map(function(p){return [p[0],220-p[1]];});
  s.push(top);s.push(bot);s.push(arc(60,110,22,40,Math.PI/2,1.5*Math.PI));
  s.push(rect(252,92,268,128));s.push.apply(s,hatch([[252,92],[268,92],[268,128],[252,128]],2,90));
  s.push(quad([70,78],[130,74],[190,78]));
  s.push(wave(46,206,134,2,18));
  var hull=[[86,118],[174,118],[164,132],[98,132],[86,118]];s.push(hull);s.push.apply(s,hatch(hull,1.8,0));
  [[108,80],[130,74],[152,82]].forEach(function(m){s.push([[m[0],118],[m[0],m[1]]]);s.push([[m[0],m[1]],[m[0]+10,m[1]+3],[m[0],m[1]+6]]);
    for(var k=0;k<2;k++){var y0=m[1]+10+k*16;s.push(quad([m[0]-11,y0],[m[0],y0+4],[m[0]+11,y0]).concat(quad([m[0]+12,y0+13],[m[0],y0+17],[m[0]-12,y0+13]),[[m[0]-11,y0]]));}});
  s.push([[174,118],[196,100]]);s.push([[152,82],[196,100]]);
  [[78,172],[188,172]].forEach(function(c){s.push([[c[0]-16,c[1]],[c[0]-16,152],[c[0]-10,150]].concat(arc(c[0],128,22,22,Math.PI*0.62,Math.PI*0.38).slice(0)).concat([[c[0]+10,150],[c[0]+16,152],[c[0]+16,c[1]]]));});
  return s;}},

{name:'Birdcage with a canary',titles:["Morning Song", "Gilded Perch", "The Singer", "Seed and Water"],build(R){var s=[];
  s.push([[150,3],[150,9]]);s.push(circle(150,14,5));
  var dome=arc(150,62,46,43,Math.PI,TAU);s.push(dome);
  for(var x=108;x<=192;x+=7){var y=62-43*Math.sqrt(Math.max(0,1-Math.pow((x-150)/46,2)));s.push(quad([150,19],[x+(x-150)*0.3,y-6],[x,62]).concat([[x,160]]));}
  s.push([[104,62],[104,160]]);s.push([[196,62],[196,160]]);
  s.push(arc(150,62,46,4,0,Math.PI));s.push(arc(150,112,46,4,0,Math.PI));
  var base=rect(98,160,202,172);s.push(base);s.push.apply(s,hatch(base,2,0));s.push(rect(112,172,188,178));
  s.push([[112,124],[188,124]]);
  var body=rotateAbout(ellipse(148,110,15,9),148,110,-0.35);s.push(body);s.push(circle(162,96,7));s.push(circle(164,94,1.2));
  s.push(poly([[168,95],[175,97],[168,99]]));s.push([[136,116],[118,128]]);s.push([[138,118],[120,131]]);s.push([[118,128],[120,131]]);
  s.push.apply(s,hatch(rotateAbout(ellipse(144,112,9,5),144,112,-0.35),1.6,-20));
  s.push([[146,118],[144,124]]);s.push([[154,117],[154,124]]);
  s.push(rect(164,130,184,160));
  return s;}},

{name:'Water tower',titles:["Town Water", "Above the Rooftops", "Gravity Fed", "Main Street Landmark"],build(R){var s=[];
  s.push([[4,188],[296,188]]);s.push(grass(4,296,188,5,4,R));
  var roof=[[94,50],[150,22],[206,50]];s.push(poly(roof));s.push.apply(s,hatch(roof,2.2,0));s.push([[150,22],[150,12]]);s.push(circle(150,10,2.5));
  s.push(rect(100,50,200,98));s.push.apply(s,planks(106,50,196,98,6,true));
  [62,75,88].forEach(function(y){s.push([[100,y],[200,y]]);s.push([[100,y+1.6],[200,y+1.6]]);});
  s.push(rect(90,98,210,103));for(var px=92;px<=208;px+=8)s.push([[px,98],[px,90]]);s.push([[90,90],[210,90]]);
  var legs=[[108,103,96,188],[132,103,128,188],[168,103,172,188],[192,103,204,188]];legs.forEach(function(l){s.push([[l[0],103],[l[2],188]]);s.push([[l[0]+3,103],[l[2]+3,188]]);});
  var at=function(l,y){return l[0]+(l[2]-l[0])*(y-103)/85;};
  [[103,132],[132,160],[160,188]].forEach(function(b){for(var i=0;i<3;i++){var A=legs[i],B=legs[i+1];s.push([[at(A,b[0])+3,b[0]],[at(B,b[1]),b[1]]]);s.push([[at(B,b[0]),b[0]],[at(A,b[1])+3,b[1]]]);}s.push([[at(legs[0],b[1]),b[1]],[at(legs[3],b[1])+3,b[1]]]);});
  s.push([[204,103],[218,188]]);s.push([[210,103],[224,188]]);for(var ry=110;ry<188;ry+=8)s.push([[204+(ry-103)*0.165,ry],[210+(ry-103)*0.165,ry]]);
  return s;}},

{name:'Five-story pagoda',titles:["Five Roofs Up", "Temple Garden", "Bells on the Eaves", "Stacked Silence"],build(R){var s=[];
  s.push([[4,186],[296,186]]);s.push(rect(86,178,214,186));s.push(rect(96,172,204,178));
  var base=172,cx=150;
  for(var i=0;i<5;i++){var w=92-i*14,bt=base-16;s.push(rect(cx-w/2,bt,cx+w/2,base));
    for(var x=cx-w/2+6;x<cx+w/2;x+=6)s.push([[x,bt],[x,base]]);
    var L=cx-w/2-6,Rr=cx+w/2+6,roof=[[L-14,bt-8],[L,bt],[Rr,bt],[Rr+14,bt-8],[Rr-8,bt-14],[L+8,bt-14]];s.push(poly(roof));s.push.apply(s,hatch(roof,2.2,0));
    base=bt-14;}
  s.push([[150,base],[150,10]]);[base-6,base-14,base-22,base-30].forEach(function(y){s.push(ellipse(150,y,6,1.8));});
  pine(40,186,1.2).forEach(function(t){s.push(t);});pine(262,186,1.1).forEach(function(t){s.push(t);});
  return s;}},

{name:'Garden gazebo',titles:["Band Concert Tonight", "Summer Shade", "Lemonade Hour", "Rose Garden Pavilion"],build(R){var s=[];
  s.push([[4,170],[296,170]]);s.push(grass(4,296,170,5,4,R));
  s.push(rect(80,150,220,158));s.push(rect(130,158,170,164));s.push(rect(124,164,176,170));
  [92,130,170,208].forEach(function(x){s.push(rect(x-3,98,x+3,150));});
  s.push([[95,122],[127,122]]);s.push([[173,122],[205,122]]);s.push([[95,126],[127,126]]);s.push([[173,126],[205,126]]);
  for(var x=99;x<127;x+=4)s.push([[x,126],[x,150]]);for(var x2=177;x2<205;x2+=4)s.push([[x2,126],[x2,150]]);
  s.push(rect(78,92,222,98));var tr=[];for(var x3=78;x3<=222;x3+=1)tr.push([x3,98+3*Math.abs(Math.sin(Math.PI*(x3-78)/12))]);s.push(tr);
  var roof=[[76,92],[150,46],[224,92]];s.push(poly(roof));s.push.apply(s,hatch(roof,2.6,0));
  s.push(rect(140,38,160,48));var cup=[[136,38],[150,24],[164,38]];s.push(poly(cup));s.push.apply(s,hatch(cup,2,0));s.push([[150,24],[150,14]]);
  [[44,160,30,12],[258,160,30,12]].forEach(function(b){var sc=scallop(b[0],b[1],b[2],b[3],8,.2).filter(function(p){return p[1]<=170;});s.push(sc);s.push.apply(s,hatch(scallop(b[0],b[1],b[2],b[3],8,.2),3.4,-30).filter(function(st){return st.every(function(p){return p[1]<=170;});}));});
  return s;}},

{name:'Books and a candle',titles:["One More Chapter", "Midnight Reading", "Stacked and Waiting", "By Candlelight"],build(R){var s=[];
  s.push([[4,178],[296,178]]);s.push([[4,184],[296,184]]);s.push.apply(s,hatch([[4,184],[296,184],[296,196],[4,196]],4,0));
  [[70,150,200,178],[80,128,194,150],[66,108,188,128],[84,90,190,108]].forEach(function(b,i){s.push(rect(b[0],b[1],b[2],b[3]));s.push([[b[0]+8,b[1]],[b[0]+8,b[3]]]);s.push([[b[2]-8,b[1]],[b[2]-8,b[3]]]);
    if(i%2===0)s.push.apply(s,hatch([[b[0]+8,b[1]],[b[0]+20,b[1]],[b[0]+20,b[3]],[b[0]+8,b[3]]],1.8,0));else s.push([[b[0]+30,(b[1]+b[3])/2],[b[2]-30,(b[1]+b[3])/2]]);});
  s.push(ellipse(140,88,24,3));
  var c=[[131,86],[131,46],[149,46],[149,86]];s.push(c);s.push(quad([131,46],[134,56],[132,64]));s.push(quad([149,50],[146,58],[148,68]));
  s.push([[140,46],[140,40]]);var fl=quad([140,40],[130,32],[140,16]).concat(quad([140,16],[150,32],[140,40]).slice(1));s.push(fl);s.push(quad([140,38],[136,32],[140,26]));
  for(var k=0;k<8;k++){var a=-Math.PI/2+(k-3.5)*0.36;s.push([[140+16*Math.cos(a),30+16*Math.sin(a)],[140+24*Math.cos(a),30+24*Math.sin(a)]]);}
  s.push(circle(230,168,9));s.push(circle(254,168,9));s.push(quad([239,166],[242,162],[245,166]));s.push([[221,166],[210,176]]);s.push([[263,166],[274,176]]);
  return s;}},

{name:'Violin and bow',titles:["Rosin and Maple", "Tuning Up", "After the Recital", "Four Strings"],build(R){var s=[];
  var body=arc(90,100,38,38,0.85,TAU-0.85).concat(quad([115.7,71.4],[132,92],[150,77]).slice(1),arc(172,100,30,30,TAU*0.5+0.85,TAU*1.5-0.85).slice(1),quad([150,123],[132,108],[115.7,128.6]).slice(1));
  s.push(body);s.push(scaleAbout(body,128,100,0.94));
  [[124,88],[124,112]].forEach(function(f){s.push(cubic([f[0]-8,f[1]-6],[f[0]+6,f[1]-8],[f[0]-6,f[1]+8],[f[0]+8,f[1]+6]));s.push(circle(f[0]-8,f[1]-6,1.4));s.push(circle(f[0]+8,f[1]+6,1.4));});
  s.push(poly([[52,96],[80,98],[80,102],[52,104]]));s.push(rect(108,94,111,106));
  var fb=rect(120,97,246,103);s.push(fb);s.push.apply(s,hatch(fb,1.4,0));
  s.push(rect(246,96,268,104));[252,258,264].forEach(function(px){s.push([[px,90],[px,110]]);s.push(circle(px,90,2));});
  s.push(spiral(278,100,1,10,1.6,0));
  for(var k=0;k<4;k++){var y=98.5+k*1.0;s.push([[66,y],[256,y]]);}
  s.push.apply(s,hatch(arc(90,100,38,38,0.85,TAU-0.85).filter(function(p){return p[1]>100;}).concat([[60,100]]),3,-30));
  s.push([[20,166],[284,140]]);s.push([[30,170],[274,148]]);s.push(rect(30,164,46,176));s.push([[274,148],[284,140]]);
  return s;}},

{name:'Hammock between palms',titles:["Do Not Disturb", "Sunset Sway", "Island Time", "Nowhere to Be"],build(R){var s=[];
  var sand=wave(4,296,172,1.5,60);s.push(sand);s.push.apply(s,hatch(sand.concat([[296,196],[4,196]]),5,8));
  s.push([[62,120],[238,120]]);for(var i=0;i<4;i++)s.push(wave(66+i*10,234-i*10,128+i*8,1.2,12,i));
  var sun=arc(150,120,20,20,Math.PI,TAU);s.push(sun);for(var k=1;k<8;k++){var a=Math.PI+k*Math.PI/8;s.push([[150+24*Math.cos(a),120+24*Math.sin(a)],[150+32*Math.cos(a),120+32*Math.sin(a)]]);}
  var palm=function(x0,x1,dir){var L=quad([x0-5,172],[x0-5+dir*6,110],[x1-3,52]),Rr=quad([x0+5,172],[x0+5+dir*6,110],[x1+3,52]);s.push(L);s.push(Rr);
    for(var j=2;j<28;j+=3){s.push([L[j],Rr[j]]);}
    for(var f=0;f<7;f++){var a=-Math.PI*0.95+f*Math.PI*0.9/6,len=34+8*R(),fr=quad([x1,52],[x1+len*0.6*Math.cos(a),52+len*0.6*Math.sin(a)-10],[x1+len*Math.cos(a),52+len*Math.sin(a)+12],20);s.push(fr);
      for(var q=3;q<20;q+=2){var p=fr[q];s.push([p,[p[0]+5*Math.cos(a+1.3),p[1]+5*Math.sin(a+1.3)+3]]);}}
    [-5,4].forEach(function(o){s.push(circle(x1+o,58,3.4));});};
  palm(40,58,1);palm(262,242,-1);
  s.push([[54,112],[82,126]]);s.push([[246,112],[218,126]]);
  var top=quad([82,126],[150,162],[218,126]),bot=quad([82,130],[150,170],[218,130]);s.push(top);s.push(bot);
  s.push.apply(s,hatch(top.concat(bot.slice().reverse()),4,40));s.push.apply(s,hatch(top.concat(bot.slice().reverse()),4,-40));
  return s;}},

{name:'Camping lantern',titles:["Lights Out at Ten", "Base Camp", "Moth Magnet", "Fireside Glow"],build(R){var s=[];
  var log=rect(56,180,250,194);s.push(log);s.push.apply(s,hatch(log,3,4));s.push(ellipse(56,187,6,7));s.push(ellipse(56,187,3,4));
  s.push(rect(108,170,192,180));s.push(rect(114,150,186,170));s.push(arc(150,150,36,4,0,Math.PI));
  s.push([[192,162],[198,162]]);s.push(circle(202,162,4));
  s.push(cubic([122,150],[106,128],[106,92],[122,70]));s.push(cubic([178,150],[194,128],[194,92],[178,70]));
  [130,150,170].forEach(function(x){s.push([[x,70],[x,150]]);});
  var fl=quad([150,124],[138,110],[150,90]).concat(quad([150,90],[162,110],[150,124]).slice(1));s.push(fl);s.push.apply(s,hatch(fl,1.6,0));
  var hood=[[110,70],[150,50],[190,70]];s.push(poly(hood));s.push.apply(s,hatch(hood,2,0));
  s.push(rect(140,42,160,50));s.push(arc(150,56,42,40,Math.PI*1.05,Math.PI*1.95));
  return s;}},

{name:'Straw beehive',titles:["Honey Flow", "Busy Morning", "The Old Skep", "Pollen Run"],build(R){var s=[];
  s.push([[4,190],[296,190]]);s.push(grass(4,296,190,5,4,R));
  s.push(rect(90,150,210,158));s.push(rect(100,158,108,190));s.push(rect(192,158,200,190));
  var prof=function(y){return 56*Math.sqrt(Math.max(0,1-Math.pow((150-y)/84,2)));};
  s.push(arc(150,150,56,84,Math.PI,TAU));
  for(var y=144;y>74;y-=8){var w=prof(y);s.push(arc(150,y,w,3,0,Math.PI));for(var x=150-w+5;x<150+w-4;x+=7)s.push([[x,y+2],[x+3,y-5]]);}
  var door=[[142,150],[142,142]].concat(arc(150,142,8,8,Math.PI,TAU),[[158,150]]);s.push(door);s.push.apply(s,hatch(door.concat([[142,150]]),1.6,0));
  var daisy=function(cx,cy,h){s.push([[cx,190],[cx,cy+4]]);s.push(circle(cx,cy,4));for(var k=0;k<9;k++){var a=k*TAU/9;s.push(rotateAbout(ellipse(cx+9*Math.cos(a),cy+9*Math.sin(a),5,2.2),cx+9*Math.cos(a),cy+9*Math.sin(a),a));}};
  daisy(44,132);daisy(66,150);daisy(244,128);daisy(270,146);
  var bee=function(x,y){var b=ellipse(x,y,5,3.2);s.push(b);s.push([[x-1,y-3],[x-1,y+3]]);s.push([[x+2,y-3],[x+2,y+3]]);s.push(ellipse(x-1,y-6,3,2.2));};
  bee(44,123);bee(244,119);
  return s;}},

{name:'Tugboat',titles:["Pushing Ahead", "Harbor Workhorse", "Full Ahead", "Tow Line Ready"],build(R){var s=[];
  for(var i=0;i<6;i++)s.push(wave(4,296,150+i*8,2,18+i*2,i));
  var hull=[[40,122],[248,122],[266,110],[258,142],[62,148],[40,122]];s.push(hull);s.push.apply(s,hatch([[50,134],[256,134],[258,142],[62,148]],2.2,0));
  for(var x=74;x<240;x+=26)s.push(circle(x,129,5));
  s.push(rect(90,98,212,122));[106,124,192].forEach(function(px){s.push(circle(px,110,4));});
  s.push(rect(132,74,182,98));for(var wx=136;wx<180;wx+=11)s.push(rect(wx,79,wx+8,89));s.push(rect(126,68,188,74));
  s.push([[156,68],[156,40]]);s.push([[148,48],[164,48]]);
  var st=[[196,98],[194,58],[216,58],[214,98]];s.push(st);s.push(rect(192,54,218,58));s.push.apply(s,hatch([[195,66],[215,66],[215,74],[195,74]],1.6,0));
  [[180,40,14,8],[152,26,18,9],[116,20,20,10]].forEach(function(c){s.push(scallop(c[0],c[1],c[2],c[3],7,.28));});
  s.push(quad([266,112],[280,128],[292,150]));s.push(quad([260,140],[276,146],[290,156]));
  return s;}},

{name:'Igloo',titles:["Snow Blocks", "Warm Inside", "Arctic Doorway", "Built by Hand"],build(R){var s=[];
  var g=wave(4,296,170,1.4,50);s.push(g);s.push.apply(s,hatch(g.concat([[296,196],[4,196]]),7,0));
  s.push(arc(140,170,70,62,Math.PI,TAU));
  for(var k=1;k<5;k++){var y=170-k*12,w=70*Math.sqrt(1-Math.pow((170-y)/62,2));s.push([[140-w,y],[140+w,y]]);}
  for(var r=0;r<5;r++){var y0=170-r*12,y1=y0-12,w0=70*Math.sqrt(Math.max(0,1-Math.pow((170-y1)/62,2)));for(var x=140-w0+((r%2)?8:16);x<140+w0-4;x+=16)s.push([[x,y0],[x,y1]]);}
  s.push(arc(198,170,24,24,Math.PI,TAU));var op=arc(198,170,13,15,Math.PI,TAU);s.push(op);s.push.apply(s,hatch(op.concat([[185,170]]),1.6,0));
  s.push([[184,150],[184,170]]);s.push([[212,150],[212,170]]);s.push([[176,158],[220,158]]);
  return s;}},

{name:'Roller skate',titles:["Couples Skate", "Rink Night", "Laced and Ready", "Toe Stop"],build(R){var s=[];
  s.push([[4,186],[296,186]]);s.push.apply(s,hatch([[4,188],[296,188],[296,196],[4,196]],3,0));
  var boot=[[72,140],[76,40],[128,40],[132,86]].concat(quad([132,86],[176,108],[220,120]).slice(1),[[226,140],[72,140]]);s.push(boot);
  s.push([[80,132],[218,132]]);s.push([[78,48],[126,48]]);
  s.push.apply(s,hatch([[72,140],[74,104],[100,110],[104,140]],2,0));
  var l1=[],l2=[];for(var t=0;t<6;t++){l1.push([128+t*8,50+t*11]);l2.push([140+t*10,46+t*10]);}
  l1.forEach(function(p){s.push(circle(p[0],p[1],1.5));});l2.forEach(function(p){s.push(circle(p[0],p[1],1.5));});
  for(var k=0;k<5;k++){s.push([l1[k],l2[k+1]]);s.push([l2[k],l1[k+1]]);}
  s.push([[140,46],[124,34],[120,26]]);s.push([[140,46],[150,30],[158,26]]);
  s.push(rect(82,140,214,148));s.push(rect(90,148,110,158));s.push(rect(182,148,202,158));
  [96,196].forEach(function(cx){s.push(circle(cx,172,14));s.push(circle(cx,172,7));s.push(circle(cx,172,2));for(var a=0;a<12;a++){var an=a*TAU/12;s.push([[cx+11*Math.cos(an),172+11*Math.sin(an)],[cx+14*Math.cos(an),172+14*Math.sin(an)]]);}});
  s.push(rect(220,138,232,152));s.push.apply(s,hatch([[220,138],[232,138],[232,152],[220,152]],1.6,0));
  return s;}},

{name:'Watering can and pots',titles:["Morning Watering", "Potting Bench", "Tulip and Seedling", "A Little Drink"],build(R){var s=[];
  s.push(rect(4,172,296,178));s.push.apply(s,planks(4,178,296,196,6,false));
  s.push(ellipse(130,100,40,7));s.push([[90,100],[90,168]]);s.push([[170,100],[170,168]]);s.push(arc(130,168,40,5,0,Math.PI));
  [124,146].forEach(function(y){s.push(arc(130,y,40,6,0,Math.PI));});s.push.apply(s,hatch([[90,124],[170,124],[170,146],[90,146]],2.4,0));
  s.push(arc(130,100,30,34,Math.PI*1.08,Math.PI*1.92));
  s.push([[170,150],[236,82]]);s.push([[170,138],[230,78]]);var rose=rotateAbout(ellipse(240,76,5,11),240,76,-0.8);s.push(rose);
  for(var k=0;k<4;k++){var p=[];for(var q=0;q<=20;q++){var t=q/20;p.push([242+k*4+3*Math.sin(t*9+k),82+t*58]);}s.push(p);}
  var pot=[[230,140],[276,140],[270,172],[236,172]];s.push(poly(pot));s.push(rect(226,134,280,140));s.push.apply(s,hatch(pot,2.6,0));
  s.push(quad([253,134],[250,110],[256,96]));s.push(rotateAbout(ellipse(244,112,9,3.5),244,112,-0.6));s.push(rotateAbout(ellipse(262,106,9,3.5),262,106,0.5));s.push(scallop(256,90,7,6,5,.3));
  var pot2=[[24,146],[60,146],[56,172],[28,172]];s.push(poly(pot2));s.push(rect(20,140,64,146));s.push.apply(s,hatch(pot2,2.6,0));
  s.push([[42,140],[42,104]]);s.push(quad([36,98],[42,112],[48,98]).concat([[46,90],[42,96],[38,90],[36,98]]));s.push(quad([42,130],[30,120],[30,108]));
  return s;}},

{name:'Desk lamp',titles:["Late Shift", "Pool of Light", "Angled Just So", "Burning the Midnight Oil"],build(R){var s=[];
  s.push([[4,180],[296,180]]);s.push([[4,186],[296,186]]);s.push.apply(s,hatch([[4,186],[296,186],[296,196],[4,196]],3.2,-12));
  s.push(arc(120,180,30,8,Math.PI,TAU));s.push(rect(90,176,150,180));s.push(circle(120,166,4));
  s.push([[118,166],[168,98]]);s.push([[124,168],[174,100]]);s.push(circle(171,98,4));
  s.push([[168,96],[114,54]]);s.push([[172,102],[118,60]]);s.push(circle(114,56,4));
  var sp1=[],sp2=[];for(var t=0;t<=1.0001;t+=0.02){var a=lerp([128,158],[164,110],t),b=lerp([160,96],[124,66],t),o=3*Math.sin(t*TAU*7);sp1.push([a[0]+o*0.8,a[1]+o*0.6]);sp2.push([b[0]+o*0.6,b[1]-o*0.78]);}s.push(sp1);s.push(sp2);
  var shade=[[110,52],[96,58],[112,100],[146,82]];s.push(poly(shade));s.push.apply(s,hatch(shade,2,20));
  s.push(ellipse(150,176,40,3.5));
  s.push(poly([[200,174],[260,174],[270,180],[206,180]]));s.push([[230,174],[236,180]]);
  return s;}},

{name:'Old pickup truck',titles:["Still Runs", "Farm Use Only", "Back Roads", "Bed Full of Hay"],build(R){var s=[];
  s.push([[4,176],[296,176]]);s.push.apply(s,hatch([[4,178],[296,178],[296,196],[4,196]],4,0));for(var x=20;x<296;x+=40)s.push([[x,186],[x+20,186]]);
  [82,214].forEach(function(cx){s.push(circle(cx,160,16));s.push(circle(cx,160,11));s.push(circle(cx,160,4));for(var a=0;a<16;a++){var an=a*TAU/16;s.push([[cx+13*Math.cos(an),160+13*Math.sin(an)],[cx+16*Math.cos(an),160+16*Math.sin(an)]]);}});
  s.push(arc(82,160,22,22,Math.PI,TAU));s.push(arc(214,160,24,24,Math.PI,TAU));
  s.push(rect(36,112,110,148));for(var px=48;px<110;px+=12)s.push([[px,112],[px,148]]);
  var cab=[[110,148],[110,124],[118,84],[162,84],[168,104],[168,148]];s.push(cab);s.push(poly([[124,92],[158,92],[162,108],[122,108]]));s.push([[150,120],[160,120]]);
  s.push([[168,104],[248,108],[254,114],[256,148]]);s.push([[168,148],[256,148]]);
  s.push.apply(s,hatch([[246,112],[256,114],[256,146],[246,146]],1.6,0));s.push(circle(236,118,6));
  s.push(rect(30,146,40,152));s.push(rect(256,142,266,150));
  return s;}},

{name:'Penny-farthing',titles:["High Wheeler", "Mind the Dismount", "Sunday Ride, 1885", "Big Wheel, Little Wheel"],build(R){var s=[];
  s.push([[4,180],[296,180]]);for(var x=4;x<296;x+=10)s.push(arc(x+5,180,5,4,0,Math.PI));
  s.push(circle(110,110,70));s.push(circle(110,110,66));s.push(circle(110,110,5));
  for(var k=0;k<28;k++){var a=k*TAU/28;s.push([[110+5*Math.cos(a),110+5*Math.sin(a)],[110+66*Math.cos(a),110+66*Math.sin(a)]]);}
  s.push(circle(244,168,12));s.push(circle(244,168,2));for(var j=0;j<10;j++){var b=j*TAU/10;s.push([[244+2*Math.cos(b),168+2*Math.sin(b)],[244+12*Math.cos(b),168+12*Math.sin(b)]]);}
  s.push(quad([118,30],[214,44],[244,168]));s.push(quad([122,34],[210,50],[240,166]));
  s.push([[106,110],[112,30]]);s.push([[114,110],[120,30]]);
  s.push([[94,24],[138,24]]);s.push([[116,24],[116,30]]);s.push(rect(88,21,96,27));s.push(rect(136,21,144,27));
  s.push(ellipse(146,34,12,3.5));s.push([[110,110],[124,124]]);s.push([[120,124],[130,124]]);
  return s;}},

{name:'Grandfather clock',titles:["Tick, Tock", "The Hall Clock", "Pendulum Swing", "Chimes on the Hour"],build(R){var s=[];
  s.push([[4,186],[296,186]]);s.push.apply(s,planks(4,190,296,196,4,false));
  s.push(rect(110,26,190,72));s.push(arc(150,26,40,14,Math.PI,TAU));s.push(circle(110,22,3));s.push(circle(190,22,3));s.push(circle(150,9,3));
  s.push(circle(150,49,19));s.push(circle(150,49,16));for(var m=0;m<12;m++){var a=m*TAU/12;s.push([[150+12*Math.cos(a),49+12*Math.sin(a)],[150+15*Math.cos(a),49+15*Math.sin(a)]]);}
  s.push([[150,49],[142,40]]);s.push([[150,49],[159,36]]);
  s.push(rect(122,72,178,150));var win=rect(132,82,168,140);s.push(win);
  s.push([[150,82],[150,126]]);var bob=circle(150,128,8);s.push(bob);s.push.apply(s,hatch(bob,1.6,0));
  [138,162].forEach(function(x){s.push([[x,82],[x,96]]);var w=rect(x-3,96,x+3,112);s.push(w);s.push.apply(s,hatch(w,1.6,0));});
  s.push.apply(s,hatch([[122,72],[132,72],[132,150],[122,150]],3,80));s.push.apply(s,hatch([[168,72],[178,72],[178,150],[168,150]],3,80));
  s.push(rect(112,150,188,182));s.push(rect(122,158,178,174));s.push.apply(s,hatch([[122,158],[178,158],[178,174],[122,174]],3.5,10));
  s.push(rect(108,182,192,186));
  return s;}},

{name:'Covered wagon',titles:["Westward", "Trail Dust", "Canvas and Oak", "Prairie Crossing"],build(R){var s=[];
  s.push([[4,176],[296,176]]);s.push(grass(4,296,176,5,4,R));
  s.push(rect(70,110,222,136));s.push.apply(s,planks(70,118,222,128,8,false));
  var bon=cubic([74,110],[64,60],[82,48],[100,48]).concat([[194,48]],cubic([194,48],[212,48],[230,60],[218,110]).slice(1));s.push(bon);
  [102,130,160,190].forEach(function(x){s.push(quad([x,48],[x+4,80],[x,110]));});
  s.push.apply(s,hatch(cubic([194,48],[212,48],[230,60],[218,110]).concat([[194,110]]),2.6,-60));
  [[100,150,26,12],[196,156,20,10]].forEach(function(w){s.push(circle(w[0],w[1],w[2]));s.push(circle(w[0],w[1],w[2]-3));s.push(circle(w[0],w[1],3));for(var k=0;k<w[3];k++){var a=k*TAU/w[3];s.push([[w[0]+3*Math.cos(a),w[1]+3*Math.sin(a)],[w[0]+(w[2]-3)*Math.cos(a),w[1]+(w[2]-3)*Math.sin(a)]]);}});
  s.push([[222,132],[292,150]]);s.push([[222,136],[290,154]]);
  return s;}},

{name:'Country mailbox',titles:["Flag Is Up", "Rural Route", "Anything for Me", "End of the Lane"],build(R){var s=[];
  s.push([[4,186],[296,186]]);s.push(grass(4,296,186,6,4,R));
  var post=rect(140,100,158,186);s.push(post);for(var x=144;x<158;x+=4)s.push(wave(100,186,x,0.6,30).map(function(p){return [p[1],p[0]];}));
  s.push([[140,118],[118,100]]);s.push([[158,118],[180,100]]);
  var box=[[96,100],[96,74]].concat(arc(106,74,10,10,Math.PI,1.5*Math.PI).slice(1),[[194,64]],arc(194,74,10,10,1.5*Math.PI,TAU).slice(1),[[204,100],[96,100]]);s.push(box);
  s.push([[196,66],[196,100]]);s.push(circle(200,84,1.6));
  for(var rx=108;rx<194;rx+=10){s.push(circle(rx,96,1));}
  s.push([[112,82],[112,44]]);var flag=rect(112,44,134,56);s.push(flag);s.push.apply(s,hatch(flag,1.6,0));
  s.push.apply(s,hatch([[96,90],[204,90],[204,100],[96,100]],2.2,0));
  var daisy=function(cx,cy){s.push([[cx,186],[cx,cy+3]]);s.push(circle(cx,cy,3));for(var k=0;k<8;k++){var a=k*TAU/8;s.push(rotateAbout(ellipse(cx+7*Math.cos(a),cy+7*Math.sin(a),4,1.8),cx+7*Math.cos(a),cy+7*Math.sin(a),a));}};
  daisy(122,160);daisy(176,154);daisy(196,168);
  return s;}},

{name:'Rocking chair',titles:["Porch Evening", "Grandma's Chair", "Back and Forth", "Quilt Over the Back"],build(R){var s=[];
  s.push([[4,190],[296,190]]);s.push.apply(s,planks(4,190,296,196,3,false));
  s.push(quad([46,176],[150,198],[254,172]));s.push(quad([46,180],[150,194],[254,176]));
  s.push([[106,183],[88,24]]);s.push([[112,183],[94,24]]);s.push(rect(84,18,100,24));
  s.push([[190,182],[186,116]]);s.push([[196,180],[192,116]]);
  var seat=rect(96,114,202,121);s.push(seat);s.push.apply(s,hatch(seat,1.8,0));
  s.push([[98,84],[204,88]]);s.push([[98,88],[204,92]]);s.push([[194,92],[190,116]]);for(var x=110;x<190;x+=12)s.push([[x,90],[x,114]]);
  [40,58,76,94].forEach(function(y){s.push([[92-(y-24)*0.02,y],[100,y]]);});
  var blanket=[[90,30],[60,48],[54,100],[72,108],[96,100]];s.push(blanket);s.push.apply(s,hatch(blanket.concat([[94,40]]),3,30));
  var fr=[];for(var fx=54;fx<=74;fx+=2)fr.push([fx,104+(fx%4?6:0)]);s.push(fr);
  return s;}},

{name:'Scallop shell and starfish',titles:["Low Tide Finds", "Washed Ashore", "Beachcombing", "Left by the Wave"],build(R){var s=[];
  var foam=wave(4,296,52,3,30);s.push(foam);s.push.apply(s,hatch(foam.concat([[296,4],[4,4]]),6,0));
  for(var i=0;i<4;i++)s.push(wave(4,296,80+i*26,2,40+i*6,i*1.7));
  var hinge=[110,160],rim=[];for(var k=0;k<=150;k++){var a=Math.PI*1.12+k/150*Math.PI*0.76,r=52+3*Math.abs(Math.sin(k/150*Math.PI*14));rim.push([110+r*Math.cos(a),160+r*Math.sin(a)]);}s.push(rim.concat([hinge,rim[0]]));
  for(var j=0;j<=14;j++){var a2=Math.PI*1.12+j/14*Math.PI*0.76;s.push([hinge,[110+52*Math.cos(a2),160+52*Math.sin(a2)]]);}
  s.push(poly([[96,160],[100,172],[120,172],[124,160]]));
  for(var rr=14;rr<52;rr+=9)s.push(arc(110,160,rr,rr,Math.PI*1.12,Math.PI*1.88));
  var star=[],cx=222,cy=146;for(var t=0;t<=10;t++){var a3=-Math.PI/2+t*Math.PI/5,r3=t%2?13:36;star.push([cx+r3*Math.cos(a3),cy+r3*Math.sin(a3)]);}s.push(star);
  for(var m=0;m<5;m++){var a4=-Math.PI/2+m*2*Math.PI/5;s.push([[cx,cy],[cx+30*Math.cos(a4),cy+30*Math.sin(a4)]]);}
  s.push.apply(s,hatch(star,2.6,30));
  return s;}},

{name:'Kite over a hill',titles:["Good Wind Today", "Tug on the String", "High Flyer", "Afternoon Gust"],build(R){var s=[];
  var hill=quad([4,150],[110,108],[296,160]);s.push(hill);s.push.apply(s,hatch(hill.concat([[296,196],[4,196]]),5,-8));
  s.push([[78,118],[78,96]]);s.push([[86,118],[86,96]]);var tc=scallop(82,80,22,18,9,.18);s.push(tc);s.push.apply(s,hatch(tc,3.4,-30));
  var k=[[220,18],[246,50],[220,94],[194,50]];s.push(poly(k));s.push([[220,18],[220,94]]);s.push([[194,50],[246,50]]);
  s.push.apply(s,hatch([[220,18],[246,50],[220,50]],1.8,0));s.push.apply(s,hatch([[220,50],[194,50],[220,94]],1.8,0));
  var tail=[];for(var q=0;q<=40;q++){var t=q/40;tail.push([220-30*t+8*Math.sin(t*9),94+56*t]);}s.push(tail);
  [10,20,30].forEach(function(i){var p=tail[i];s.push(poly([[p[0]-6,p[1]-4],[p[0]+6,p[1]+4],[p[0]+6,p[1]-4],[p[0]-6,p[1]+4]]));});
  var st=quad([220,50],[150,120],[128,128]);s.push(st);s.push(rect(124,126,132,134));
  return s;}},

{name:'Telescope under the moon',titles:["First Quarter", "Clear Skies", "Looking Up", "Backyard Observatory"],build(R){var s=[];
  var hz=wave(4,296,170,2,70);s.push(hz);s.push.apply(s,hatch(hz.concat([[296,196],[4,196]]),6,0));
  s.push([[150,122],[100,184]]);s.push([[150,122],[200,184]]);s.push([[150,122],[150,188]]);s.push(poly([[126,152],[174,152],[150,164]]));
  s.push(rect(140,110,160,124));s.push([[150,118],[118,140]]);var cw=rect(108,138,122,150);s.push(cw);s.push.apply(s,hatch(cw,1.6,0));
  var ang=-0.5,T=function(pts){return rotateAbout(pts,150,108,ang);};
  s.push(T(rect(80,99,210,117)));s.push(T(rect(200,95,236,121)));s.push.apply(s,hatch(T([[80,99],[96,99],[96,117],[80,117]]),1.6,ang*180/Math.PI));
  [120,150,180].forEach(function(x){s.push(T([[x,99],[x,117]]));});
  s.push(T(rect(84,117,92,128)));s.push(T(rect(120,90,170,96)));s.push(T([[130,96],[130,99]]));s.push(T([[160,96],[160,99]]));
  var moon=arc(262,32,18,18,Math.PI*0.35,Math.PI*1.65).concat(arc(270,28,15,15,Math.PI*1.55,Math.PI*0.45).slice(1));s.push(moon);
  return s;}}

  ]
};
