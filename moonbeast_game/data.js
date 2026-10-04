const GAME_DATA=(()=>{
const S={
 bite:['月牙咬','physical','neutral',42,1,12,'穩定的近身撕咬。'],rush:['獸角突進','physical','neutral',58,.92,7,'強力突進；自身承受15%反作用力。',{recoil:.15}],dust:['月塵','status','neutral',0,1,6,'降低敵方命中兩回合。',{type:'accuracy',amount:.22,turns:2}],guard:['警戒','status','neutral',0,1,6,'先制獲得22%生命護盾。',{type:'shield',ratio:.22},1],
 volt:['雷鬃衝','physical','thunder',57,.95,7,'纏繞電光的高速撞擊。'],static:['靜電咬','physical','thunder',40,1,10,'35%機率使敵人緩速。',{type:'slow',chance:.35,turns:2}],charge:['蓄電','status','thunder',0,1,5,'提高三回合靈能。',{type:'arc',amount:.35,turns:3}],
 shell:['甲殼撞擊','physical','bloom',52,1,8,'以厚重甲殼正面撞擊。'],spore:['迷幻孢子','arcane','bloom',32,.95,8,'造成傷害並使敵人緩速。',{type:'slow',chance:1,turns:2}],root:['扎根','status','bloom',0,1,5,'恢復最大生命15%。',{type:'heal',ratio:.15}],
 tide:['潮刃','arcane','tide',54,.96,8,'壓縮水流形成鋒刃。'],bubble:['泡沫盾','status','tide',0,1,6,'先制獲得30%生命護盾。',{type:'shield',ratio:.3},1],undertow:['退潮','arcane','tide',38,1,9,'造成傷害並降低防禦。',{type:'def',amount:.25,turns:2}],
 claw:['燼爪','physical','ember',58,.94,8,'35%機率造成灼燒。',{type:'burn',chance:.35,turns:3}],breath:['熾息','arcane','ember',61,.9,6,'45%機率造成灼燒。',{type:'burn',chance:.45,turns:3}],ash:['灰幕','status','ember',0,1,5,'降低敵人命中兩回合。',{type:'accuracy',amount:.2,turns:2}],
 frost:['霜牙','physical','tide',56,.98,8,'50%機率使敵人緩速。',{type:'slow',chance:.5,turns:2}],storm:['風暴召來','arcane','thunder',66,.88,6,'高威力雷暴。'],thorn:['棘牢','arcane','bloom',44,1,7,'造成傷害並降低防禦。',{type:'def',amount:.25,turns:2}],
 sunfall:['黑月墜落','arcane','neutral',78,.9,5,'獸王召下沉重蝕月。'],eclaw:['蝕光裂爪','physical','neutral',64,.96,8,'造成傷害並降低防禦。',{type:'def',amount:.2,turns:2}],roar:['暴君咆哮','status','neutral',0,1,5,'提高三回合力量。',{type:'atk',amount:.3,turns:3}],eg:['日蝕障壁','status','neutral',0,1,4,'先制獲得32%生命護盾。',{type:'shield',ratio:.32},1]};
const skills={};for(const[id,a]of Object.entries(S))skills[id]={id,name:a[0],cat:a[1],element:a[2],power:a[3],accuracy:a[4],pp:a[5],desc:a[6],effect:a[7],priority:a[8]||0};
const C=(id,name,level,element,role,stats,passive,skillIds,color,accent,scale,part,desc)=>({id,name,level,element,role,stats,passive,skillIds,visual:{color,accent,scale,part},desc});
const creatures={
 moon:C('moon','月角幼獸',1,'neutral','均衡',[108,28,24,24,23,27],['first','初生月光','首次低於30%生命時獲得護盾。'],['bite','rush','dust','guard'],0x466f82,0x83f4ff,.86,'horn','仍未定形的月光血脈。'),
 thunder:C('thunder','雷鬃獸',2,'thunder','猛攻',[124,38,31,25,25,39],['chargefur','蓄電鬃毛','受傷後下一次攻擊增強。'],['volt','static','charge'],0x31546d,0x79edff,1,'spines','鬃毛把空氣撕成電弧。'),
 moss:C('moss','苔甲獸',2,'bloom','堡壘',[148,31,27,39,32,20],['regen','厚生苔甲','每回合恢復3%生命。'],['shell','spore','root'],0x496653,0xa4e874,1.08,'shell','古老苔層結成自癒甲殼。'),
 fin:C('fin','潮鰭獸',2,'tide','靈能',[128,25,40,27,37,30],['flow','流水之形','首次克制傷害減免35%。'],['tide','bubble','undertow'],0x356e89,0x76dfff,.96,'fins','月光在鰭間凝成潮汐。'),
 lynx:C('lynx','燼尾猞猁',3,'ember','猛攻',[153,49,38,30,31,48],['huntburn','逐火','攻擊灼燒目標傷害提高25%。'],['claw','breath','ash'],0x71413a,0xff7547,1.05,'flame','餘燼會嗅出受傷獵物。'),
 frost:C('frost','霜脊獵犬',3,'tide','詭術',[162,42,41,34,39,43],['huntcold','冷血追獵','攻擊緩速目標傷害提高25%。'],['frost','tide','bubble'],0x587484,0xc8f8ff,1.08,'spines','冰冷咬痕會奪走速度。'),
 storm:C('storm','風暴角獸',3,'thunder','靈能',[158,35,52,33,42,39],['overcast','雷雲核心','首次靈能技能不消耗PP。'],['storm','static','charge'],0x354a6f,0xb79aff,1.12,'antlers','分岔獸角牽引雷雲。'),
 iron:C('iron','鐵華巨獸',4,'bloom','堡壘',[210,48,42,58,48,25],['ironroot','鐵根','半血以上受到傷害降低12%。'],['thorn','shell','root'],0x4e6155,0xd0e070,1.25,'shell','苔甲開出堅硬如鐵的巨花。'),
 flare:C('flare','曜焰翼獸',4,'ember','猛攻',[184,59,55,38,38,53],['flare','曜焰','第一次攻擊必定暴擊。'],['breath','claw','ash'],0x793d3d,0xffd36a,1.16,'wings','展翼如一輪撕開黑夜的太陽。'),
 mist:C('mist','霧潮潛獸',4,'tide','詭術',[191,45,58,41,53,49],['mist','霧行','開戰時敵人命中降低兩回合。'],['tide','frost','undertow'],0x3e6573,0x93ffff,1.12,'fins','潮霧中只留下兩點冷光。'),
 boss:C('boss','蝕日暴君',5,'neutral','獸王',[330,61,64,52,51,42],['phase','月蝕二相','半血後提高速度與攻擊。'],['eclaw','sunfall','roar','eg'],0x482b37,0xff5148,1.5,'crown','吞食月光、守在進化盡頭的獸王。')};
const encounters=[['moss','厚生苔甲會持續恢復生命；用高傷害阻止牠拖長戰局。'],['lynx','猞猁會追擊灼燒目標，必要時用護盾渡過燃燒回合。'],['iron','鐵華巨獸半血以上格外堅硬，破甲能打開缺口。'],['boss','暴君半血後進入第二相；請保留關鍵技能的PP。']];
return{skills,creatures,encounters,pools:{2:['thunder','moss','fin'],3:['lynx','frost','storm'],4:['iron','flare','mist']},elements:{neutral:['無','#abc5cc'],thunder:['雷','#79edff'],tide:['潮','#6dbdff'],ember:['焰','#ff7955'],bloom:['苔','#9ce176']},strong:{thunder:'tide',tide:'ember',ember:'bloom',bloom:'thunder'}}})();
