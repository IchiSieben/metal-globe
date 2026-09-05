/* Metal Globe — logica principal.
 *
 * Extraido de index.html TAL CUAL: mismo codigo, mismo orden, mismo scope
 * global. No se partio en modulos a proposito: las 231 sentencias de nivel
 * superior estan intercaladas con las declaraciones de funcion, y una
 * declaracion solo se hoistea dentro de SU script. Cortar por temas moveria
 * el orden de ejecucion y romperia el globo. El troceo real exige convertir
 * a modulos ES con exports explicitos: ver METAL_GLOBE_IMPROVEMENTS.md.
 */
/* =====================================================================
   METAL GLOBE (Atlas Metallum) — beta
   Datos de MUESTRA (mock) como fallback. Cuando llegue la data real del scraper,
   solo hay que reemplazar PAISES con el mismo "contrato":
   { code, name, lat, lng, g:{genero:nº}, ciudades:[], bandas:[] }
   ===================================================================== */

const MOCK_GENEROS = ["Black","Death","Thrash","Heavy","Power","Doom",
                 "Progressive","Folk","Speed","Symphonic","Grindcore","Gothic"];

const MOCK_PAISES = [
  {code:"US",name:"Estados Unidos",lat:39.8,lng:-98.5,
   g:{Death:6800,Thrash:5200,Heavy:5600,Power:3100,Doom:2400,Black:2600,Progressive:2200,Grindcore:1500,Speed:900,Gothic:700},
   ciudades:["Tampa (FL)","Los Ángeles","Nueva York"],bandas:["Metallica","Slayer","Death","Morbid Angel","Pantera","Megadeth"]},
  {code:"DE",name:"Alemania",lat:51.2,lng:10.4,
   g:{Thrash:2600,Power:2400,Heavy:2200,Death:1700,Black:1200,Speed:900,Doom:600,Progressive:700,Symphonic:400},
   ciudades:["Essen","Hamburgo","Berlín"],bandas:["Kreator","Sodom","Blind Guardian","Helloween","Destruction"]},
  {code:"GB",name:"Reino Unido",lat:54.0,lng:-2.0,
   g:{Heavy:2400,Doom:1100,Death:1300,Black:900,Grindcore:700,Power:600,Gothic:500,Thrash:700,Progressive:500},
   ciudades:["Birmingham","Londres","Liverpool"],bandas:["Iron Maiden","Black Sabbath","Judas Priest","Napalm Death","Cradle of Filth"]},
  {code:"SE",name:"Suecia",lat:60.1,lng:15.0,
   g:{Death:2900,Black:1400,Heavy:900,Doom:700,Thrash:600,Progressive:600,Folk:300,Power:500},
   ciudades:["Estocolmo","Gotemburgo"],bandas:["Entombed","At the Gates","Opeth","Dismember","Bathory"]},
  {code:"FI",name:"Finlandia",lat:62.0,lng:25.7,
   g:{Death:1500,Black:1200,Doom:800,Folk:500,Power:700,Symphonic:500,Heavy:600,Gothic:400},
   ciudades:["Helsinki","Tampere"],bandas:["Children of Bodom","Nightwish","Amorphis","Insomnium","Sentenced"]},
  {code:"IT",name:"Italia",lat:42.8,lng:12.6,
   g:{Power:1100,Heavy:900,Black:800,Death:900,Symphonic:600,Doom:500,Progressive:600,Gothic:500,Folk:300},
   ciudades:["Milán","Roma"],bandas:["Lacuna Coil","Rhapsody of Fire","Fleshgod Apocalypse"]},
  {code:"BR",name:"Brasil",lat:-12.0,lng:-51.9,
   g:{Death:1700,Thrash:1300,Black:1000,Heavy:900,Power:700,Grindcore:500,Doom:300},
   ciudades:["Belo Horizonte","São Paulo"],bandas:["Sepultura","Krisiun","Angra","Sarcófago"]},
  {code:"FR",name:"Francia",lat:46.6,lng:2.4,
   g:{Black:1600,Death:1100,Heavy:700,Doom:500,Thrash:600,Progressive:500,Grindcore:400,Folk:300},
   ciudades:["París","Burdeos"],bandas:["Gojira","Alcest","Deathspell Omega"]},
  {code:"PL",name:"Polonia",lat:52.0,lng:19.1,
   g:{Death:1500,Black:1300,Thrash:600,Heavy:400,Doom:300,Grindcore:300,Progressive:200},
   ciudades:["Gdansk","Cracovia"],bandas:["Behemoth","Vader","Decapitated","Batushka"]},
  {code:"CA",name:"Canadá",lat:56.1,lng:-100.0,
   g:{Death:1200,Thrash:800,Black:700,Progressive:500,Heavy:600,Doom:300,Grindcore:300,Power:300},
   ciudades:["Montreal","Quebec"],bandas:["Voivod","Cryptopsy","Devin Townsend","Kataklysm"]},
  {code:"NO",name:"Noruega",lat:61.0,lng:9.0,
   g:{Black:1700,Death:400,Doom:300,Folk:300,Heavy:300,Progressive:200,Symphonic:200},
   ciudades:["Bergen","Oslo","Trondheim"],bandas:["Mayhem","Emperor","Darkthrone","Burzum","Immortal"]},
  {code:"NL",name:"Países Bajos",lat:52.1,lng:5.3,
   g:{Death:1000,Black:600,Doom:400,Symphonic:500,Gothic:400,Thrash:300,Progressive:300},
   ciudades:["Ámsterdam","Eindhoven"],bandas:["Pestilence","Asphyx","Within Temptation","Textures"]},
  {code:"GR",name:"Grecia",lat:39.1,lng:22.0,
   g:{Black:900,Death:600,Heavy:400,Doom:300,Symphonic:400,Power:200},
   ciudades:["Atenas","Salónica"],bandas:["Rotting Christ","Septicflesh"]},
  {code:"ES",name:"España",lat:40.2,lng:-3.7,
   g:{Death:800,Thrash:700,Heavy:600,Power:500,Black:500,Doom:300,Folk:200},
   ciudades:["Madrid","Barcelona"],bandas:["Angelus Apatrida","Avulsed","Hamlet"]},
  {code:"JP",name:"Japón",lat:36.2,lng:138.3,
   g:{Heavy:700,Black:500,Death:500,Doom:400,Thrash:400,Grindcore:300,Power:300,Speed:200},
   ciudades:["Tokio","Osaka"],bandas:["Sigh","Loudness","Church of Misery"]},
  {code:"AU",name:"Australia",lat:-25.3,lng:134.0,
   g:{Death:700,Black:500,Thrash:400,Doom:300,Grindcore:300,Heavy:300},
   ciudades:["Sídney","Melbourne"],bandas:["Parkway Drive","Portal","Psycroptic"]},
  {code:"CL",name:"Chile",lat:-35.7,lng:-71.5,
   g:{Death:600,Thrash:500,Black:400,Heavy:300,Doom:200},
   ciudades:["Santiago"],bandas:["Pentagram","Criminal"]},
  {code:"MX",name:"México",lat:23.6,lng:-102.5,
   g:{Death:600,Thrash:500,Black:300,Heavy:400,Grindcore:200,Power:200},
   ciudades:["Ciudad de México","Monterrey"],bandas:["Brujería","Transmetal","The Chasm"]},
  {code:"AR",name:"Argentina",lat:-35.4,lng:-64.0,
   g:{Heavy:600,Thrash:400,Death:400,Power:300,Black:200},
   ciudades:["Buenos Aires"],bandas:["Hermética","Rata Blanca","Malón"]},
  {code:"CO",name:"Colombia",lat:4.6,lng:-74.3,
   g:{Death:400,Black:300,Thrash:300,Grindcore:200,Heavy:200},
   ciudades:["Medellín","Bogotá"],bandas:["Masacre","Kraken"]},
  {code:"PE",name:"Perú",lat:-9.2,lng:-75.0,
   g:{Death:350,Black:300,Thrash:200,Doom:120,Heavy:150},
   ciudades:["Lima","Arequipa"],bandas:["Mortem","Hadez","Anal Vomit"]},
  {code:"CZ",name:"Chequia",lat:49.8,lng:15.5,
   g:{Death:500,Black:400,Grindcore:300,Thrash:300,Doom:200},
   ciudades:["Praga","Brno"],bandas:["Master's Hammer","!T.O.O.H.!"]},
  {code:"RU",name:"Rusia",lat:58.0,lng:60.0,
   g:{Black:900,Death:700,Folk:400,Doom:300,Heavy:400,Power:300},
   ciudades:["Moscú","San Petersburgo"],bandas:["Arkona","Aria"]},
  {code:"DK",name:"Dinamarca",lat:56.0,lng:10.0,
   g:{Heavy:500,Death:300,Black:300,Thrash:200,Doom:200},
   ciudades:["Copenhague"],bandas:["Mercyful Fate","King Diamond","Volbeat"]},
  {code:"CH",name:"Suiza",lat:46.8,lng:8.2,
   g:{Black:400,Death:300,Folk:200,Thrash:200,Doom:200,Heavy:200},
   ciudades:["Zúrich","Ginebra"],bandas:["Celtic Frost","Hellhammer","Eluveitie"]},
  {code:"AT",name:"Austria",lat:47.5,lng:14.6,
   g:{Black:600,Death:300,Doom:200,Heavy:200},
   ciudades:["Viena","Salzburgo"],bandas:["Belphegor","Summoning"]},
  {code:"PT",name:"Portugal",lat:39.5,lng:-8.2,
   g:{Black:400,Death:300,Doom:200,Gothic:200,Heavy:200},
   ciudades:["Lisboa","Oporto"],bandas:["Moonspell","Bizarra Locomotiva"]},
  {code:"BE",name:"Bélgica",lat:50.6,lng:4.6,
   g:{Death:400,Black:300,Doom:300,Thrash:200,Grindcore:200},
   ciudades:["Amberes","Bruselas"],bandas:["Aborted","Enthroned"]},
  {code:"IN",name:"India",lat:21.0,lng:79.0,
   g:{Death:400,Heavy:300,Black:200,Thrash:200,Grindcore:100},
   ciudades:["Bombay","Bangalore"],bandas:["Demonic Resurrection","Kryptos"]},
  {code:"ID",name:"Indonesia",lat:-2.0,lng:118.0,
   g:{Death:600,Grindcore:400,Black:300,Thrash:200},
   ciudades:["Yakarta","Bandung"],bandas:["Jasad","Siksakubur"]},
  {code:"TR",name:"Turquía",lat:39.0,lng:35.2,
   g:{Heavy:300,Death:300,Black:200,Thrash:200,Doom:100},
   ciudades:["Estambul","Ankara"],bandas:["Pentagram (TR)","Mezarkabul"]},
  {code:"MY",name:"Malasia",lat:4.2,lng:101.9,
   g:{Black:300,Death:300,Grindcore:200,Thrash:100},
   ciudades:["Kuala Lumpur"],bandas:["Sil Khannaz","As-Sahar"]}
];

/* total por país: usa p.total (data real, cada banda 1 vez) o suma de g{} (mock) */
const total = p => (typeof p.total==='number' ? p.total
                    : Object.values(p.g).reduce((a,b)=>a+b,0));

/* globals que el resto del código consume (se llenan en prepararDatos) */
let GENEROS=[], PAISES=[], generoTotales={}, GRAN_TOTAL=0, SUBGEN={},
    state={genero:null,subgenero:null,pais:null,rotando:true,genFilters:[],combine:false,boolOp:'OR'}, META=null;

/* ===== TEMAS de color (paletas) — lado JS: púas del globo, pines y selección de país.
   El CSS se temiza con html[data-theme]; esto temiza lo que se pinta en canvas/WebGL. ===== */
const THEMES = {
  tarja:        {accent:[232,184,75],  bright:[255,215,0],   select:[255,215,0]},
  amaranth:     {accent:[196,30,58],   bright:[255,45,45],   select:[255,45,45]},
  fallen:       {accent:[79,168,232],  bright:[93,207,255],  select:[93,207,255]},
  floor:        {accent:[176,190,197], bright:[236,239,241], select:[236,239,241]},
  necronomicon: {accent:[107,155,55],  bright:[159,232,58],  select:[159,232,58]},
  imaginaerum:  {accent:[155,89,182],  bright:[199,125,255], select:[199,125,255]},
};
let THEME_SPIKE=[[0,[138,144,153]],[0.55,[232,184,75]],[1,[255,215,0]]];  // rampa púas: bajo / acento / brillante
let SEL_RGB=[255,215,0];   // color de selección/iluminación de país (relleno + borde con glow)

/* ===================== REPRODUCTOR "TV RETRO" — PLAYLISTS POR GÉNERO =====================
   Mapea claves -> playlist de YouTube. Las claves se casan con los géneros RAÍZ del árbol
   (Death, Black, Thrash, Power, Doom...) normalizando mayúsculas/acentos. Raíz sin entrada -> GENERAL. */
const YT_PLAYLISTS = {
  GENERAL: "PLmXxqSJJq-yUwqtbp8MHBoTDoDULMoViq", // Greatest Metal Songs (fallback)
  THRASH:  "PLDyMXoYglQpIyBRDTVKxtWEGfGOefBcRT",
  DEATH:   "PLjwbNj9NASKPAVPWq8OzQV4m1a6fJLJky",
  BLACK:   "PLm7wnjUQm_FC0AClRhesJXfviQ0A4IvPq",
  POWER:   "PLAXgM0mQib5Qqkvxzl5sW5qN7IhrmDvOj",
  DOOM:    "PLm7wnjUQm_FDGZ4Odtugiiw2L5l9Icutc",
};
/* normaliza un nombre de género raíz a clave: "Death"->"DEATH", "Power"->"POWER" (sin acentos/símbolos) */
function _ytNorm(s){ return (s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toUpperCase().replace(/[^A-Z]/g,''); }
/* clave de playlist para una banda: usa sus raíces; si ninguna mapea, el filtro activo; si no, GENERAL */
function bandYtKey(b){
  const roots=(b&&(b.r||b.roots))||[];
  for(const r of roots){ const k=_ytNorm(r); if(YT_PLAYLISTS[k]) return k; }
  if(state.genero){ const k=_ytNorm(state.genero); if(YT_PLAYLISTS[k]) return k; }
  if(state.genFilters&&state.genFilters[0]){ const k=_ytNorm(state.genFilters[0].r); if(YT_PLAYLISTS[k]) return k; }
  return 'GENERAL';
}

/* ===== SKINS de la Tierra (textura del globo) — estética metal/temática =====
   cada skin define: gradiente del océano, color de tierra, costa, relieve (emboss),
   grilla y brillo metálico (sheen, hotspot especular view-relative). */
const SKINS = {
  classic: {label:'Clásico · bronce', ocean:['#0a1a33','#143258','#0a1a33'], land:'#262a1d', coast:null,                        emboss:0,   grid:'rgba(201,162,39,0.07)', sheen:0},
  chrome:  {label:'Cromo · metal',    ocean:['#454b54','#aeb6bf','#32373e'], land:'#d6dce1', coast:'rgba(255,255,255,0.55)',   emboss:1,   grid:'rgba(255,255,255,0.05)', sheen:0.62},
  obsidian:{label:'Obsidiana · negro',ocean:['#070709','#16161d','#070709'], land:'#24252d', coast:'rgba(185,195,205,0.30)',   emboss:0.9, grid:'rgba(255,255,255,0.04)', sheen:0.30},
  ember:   {label:'Brasas · lava',    ocean:['#160604','#3a0d07','#160604'], land:'#2b1410', coast:'rgba(255,95,30,0.55)',     emboss:0.9, grid:'rgba(232,90,40,0.10)',  sheen:0.24},
  toxic:   {label:'Tóxico · verde',   ocean:['#05110a','#0d2516','#05110a'], land:'#163120', coast:'rgba(125,225,95,0.45)',    emboss:0.9, grid:'rgba(120,220,90,0.08)', sheen:0.18},
  accent:  {label:'Acento · tema',    accentTinted:true,                                                                       emboss:0.9, sheen:0.30},
};
let CURRENT_SKIN='classic';
/* resuelve la skin activa a una paleta concreta (la skin "accent" se deriva del tema) */
function resolveSkin(){
  const sk=SKINS[CURRENT_SKIN]||SKINS.classic;
  if(!sk.accentTinted) return sk;
  const a=THEME_SPIKE[1][1], br=THEME_SPIKE[2][1];          // [r,g,b] acento y brillante del tema
  const dim=(c,f)=>'rgb('+c.map(v=>Math.round(Math.min(255,v*f))).join(',')+')';
  return {ocean:[dim(a,0.10),dim(a,0.20),dim(a,0.10)], land:dim(a,0.42),
          coast:`rgba(${br.join(',')},0.42)`, emboss:sk.emboss, grid:`rgba(${a.join(',')},0.10)`, sheen:sk.sheen};
}

/* Normaliza el contrato de datos (sección 5) y deriva agregados */
function prepararDatos(DATA, esMock){
  PAISES = DATA.paises || [];
  GENEROS = esMock ? MOCK_GENEROS.slice() : (DATA.generos_globales||[]).map(g=>g.nombre);
  if(!GENEROS.length){ const s=new Set();
    PAISES.forEach(p=>Object.keys(p.g||{}).forEach(k=>s.add(k))); GENEROS=[...s]; }
  // subgéneros globales por raíz: {root: [[label, total], ...]} (incluye "Otros"); mock no trae
  SUBGEN = {};
  (DATA.generos_globales||[]).forEach(g=>{ if(g.subgeneros && g.subgeneros.length) SUBGEN[g.nombre]=g.subgeneros; });
  META = DATA.meta || null;
  PAISES.forEach(p=>{
    // ciudades/top_bandas pueden venir como strings (mock) u objetos (real)
    if(Array.isArray(p.ciudades) && p.ciudades.length && typeof p.ciudades[0]==='string')
      p.ciudades = p.ciudades.map(n=>({nombre:n,bandas:0}));
    if(!p.ciudades) p.ciudades = [];
    if(!p.top_bandas) p.top_bandas = (p.bandas||[]).map(b=> typeof b==='string'?{nombre:b}:b);
  });
  generoTotales={}; GENEROS.forEach(g=>generoTotales[g]=0);
  PAISES.forEach(p=>{for(const k in p.g){generoTotales[k]=(generoTotales[k]||0)+p.g[k];}});
  GRAN_TOTAL = PAISES.reduce((a,p)=>a+total(p),0);
  state = { genero:null, subgenero:null, pais:null, rotando:true, ciudad:null, genFilters:[], combine:false, boolOp:'OR' };
}

/* ===== Helpers de subgénero (claves de filtro coherentes con la data) =====
   - clave de filtro: "Raw Black" (nombrado) o "Otros Black" (cola).
   - en p.sub / SUBGEN el bucket de cola se etiqueta "Otros" (sin raíz). */
function subEsOtros(key, root){ return key === 'Otros ' + root; }
function subDisplay(key, root){ return subEsOtros(key, root) ? 'Otros' : key; }
function subBucketLabel(key, root){ return subEsOtros(key, root) ? 'Otros' : key; }  // etiqueta en p.sub/SUBGEN
function subCountPais(p, key, root){
  const arr = (p.sub && p.sub[root]) || [];
  const lbl = subBucketLabel(key, root);
  const e = arr.find(x => x[0] === lbl);
  return e ? e[1] : 0;
}
function subCountGlobal(key, root){
  const arr = SUBGEN[root] || [];
  const lbl = subBucketLabel(key, root);
  const e = arr.find(x => x[0] === lbl);
  return e ? e[1] : 0;
}
/* ===== Multiselección de géneros (combinación AND) =====
   state.genFilters = [{r:raíz, s:subgénero|null}, ...]
   - 0 tokens  -> sin filtro (todo)
   - 1 token   -> idéntico al filtro simple de siempre (state.genero/subgenero espejados)
   - 2+ tokens -> combinación: una banda debe cumplir TODOS los tokens. */
function _sameTok(a,b){ return a.r===b.r && (a.s||null)===(b.s||null); }
function _hasTok(t){ return state.genFilters.some(x=>_sameTok(x,t)); }
function isRootActive(root){ return state.genFilters.some(t=>t.r===root && !t.s); }
function isTokActive(r,s){ return state.genFilters.some(t=>t.r===r && (t.s||null)===(s||null)); }
function comboLabel(){ return state.genFilters.map(t=> t.s ? subDisplay(t.s,t.r) : t.r).join(' + '); }
/* marginal de un token en un país (raíz -> p.g ; subgénero -> p.sub) */
function tokCountPais(p,t){ return t.s ? subCountPais(p,t.s,t.r) : (p.g[t.r]||0); }
/* ===== UNA SOLA FUENTE DE VERDAD: bandas reales con la lógica activa =====
   - modo ÚNICO (state.combine=false): 1 token, membresía exacta (usa marginales p.g/p.sub).
   - modo COMBINAR (true): varios tokens; O = cumple ALGUNO (unión); Y = cumple TODOS (cruce). */
let comboFullByCountry=null, comboFullTotal=0;   // conteos exactos por país tras "Explorar TODAS"
/* ¿una banda (roots[]+subs[] STRINGS) cumple el filtro activo? (single=membresía / O=some / Y=every) */
function bandMatchCombo(roots, subs){
  const f=state.genFilters; if(!f.length) return false;
  roots=roots||[]; subs=subs||[];
  const hit=t=> t.s ? subs.includes(t.s) : roots.includes(t.r);
  return (state.combine && state.boolOp==='AND') ? f.every(hit) : f.some(hit);
}
/* nº de bandas DESTACADAS (top por país) de un país que cumplen el filtro (per-band REAL) */
function countDestacadas(p){ let n=0; const t=p.top_bandas||[]; for(let i=0;i<t.length;i++){ if(bandMatchCombo(t[i].roots,t[i].sub)) n++; } return n; }
/* total que cumplen: completo si se cargó "Explorar TODAS"; si no, suma de destacadas (per-band) */
function filterMatchCount(){ if(comboFullByCountry) return comboFullTotal; let s=0; for(const p of PAISES) s+=countDestacadas(p); return s; }
/* valor por país (altura de espiga / pin) — MISMA lógica que contador y panel:
   único = marginal exacto del género; combinar = bandas reales (destacadas, o completo tras Explorar). */
function valPais(p){
  if(!state.genFilters.length) return total(p);
  if(state.combine) return comboFullByCountry ? (comboFullByCountry[p.code]||0) : countDestacadas(p);
  if(state.subgenero) return subCountPais(p, state.subgenero, state.genero);
  if(state.genero) return p.g[state.genero] || 0;
  return total(p);
}

/* ===== boot(): construye todo CON los datos ya cargados ===== */
function boot(DATA, esMock){
  prepararDatos(DATA, esMock);

/* banderas: flagcdn SVG (se ve bien en Windows y en hosting);
   si falla (CSP del preview), cae a emoji */
function flagEmoji(code){
  if(!code||code.length!==2)return '🏳';
  const A=0x1F1E6;
  return String.fromCodePoint(A+code.charCodeAt(0)-65, A+code.charCodeAt(1)-65);
}
function flagImg(code,h){
  const iso=(code||'').toLowerCase();
  const em=flagEmoji(code);
  return `<img class="am-flag" src="https://flagcdn.com/${iso}.svg" alt="${code}" `+
         `style="height:${h}px;width:auto" `+
         `onerror="this.replaceWith(document.createTextNode('${em}'))">`;
}

/* helpers de color (frío plata -> ámbar -> rojo) */
function colorFor(t){
  t=Math.max(0,Math.min(1,t));
  const stops=THEME_SPIKE;   // rampa del tema activo (bajo -> acento -> brillante)
  let a=stops[0],b=stops[stops.length-1];
  for(let i=0;i<stops.length-1;i++){if(t>=stops[i][0]&&t<=stops[i+1][0]){a=stops[i];b=stops[i+1];break;}}
  const f=(t-a[0])/((b[0]-a[0])||1);
  const r=a[1][0]+(b[1][0]-a[1][0])*f;
  const g=a[1][1]+(b[1][1]-a[1][1])*f;
  const bl=a[1][2]+(b[1][2]-a[1][2])*f;
  return new THREE.Color(r/255,g/255,bl/255);
}
const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
const fmt = n => n.toLocaleString('es-PE');

/* =====================================================================
   GLOBO 3D (three.js r128, OrbitControls no disponible -> órbita manual)
   ===================================================================== */
const canvas = document.getElementById('am-canvas');
const wrap = canvas.parentElement;
const renderer = new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42,1,0.05,5000);
const R = 100;
let camDist = R*3.0;
let CAM_MAX = R*3.6;      // tope de alejamiento (zoom out)
let CAM_MIN = R*1.045;    // tope de ACERCAMIENTO (zoom in) — nivel ciudad/local (igual en PC y móvil)
let CAM_PLANET = R*3.0;   // distancia "vista planetaria" (en móvil se recalcula para que el globo entre)
let lookY = 0;            // móvil: mira un poco más abajo -> el globo sube y despeja la barra inferior

const globe = new THREE.Group();
scene.add(globe);

/* === GLOBO GÓTICO: océano azul-medianoche + continentes bronce (textura) ===
   La textura equirectangular se pinta desde el TopoJSON (buildEarthTexture) y se
   asigna a coreMat.map cuando carga. Hasta entonces, océano sólido. */
const OCEAN = 0x123056;                          // azul-medianoche perceptible
const coreMat = new THREE.MeshBasicMaterial({color:OCEAN});
const core = new THREE.Mesh(new THREE.SphereGeometry(R*0.992,192,128), coreMat);  // más segmentos -> silueta filosa al acercar
globe.add(core);

/* grilla meridianos/paralelos — OCULTA por defecto (daba aspecto de "render beta") */
const grid = new THREE.Mesh(
  new THREE.SphereGeometry(R*0.997,48,30),
  new THREE.MeshBasicMaterial({color:0xc9a227,wireframe:true,transparent:true,opacity:0.05})
);
grid.visible=false;
globe.add(grid);

/* luces para el modo realista (los skins estilizados usan MeshBasic y las ignoran) */
const ambLight = new THREE.AmbientLight(0xffffff, 0.0);
const sunLight = new THREE.DirectionalLight(0xfff3e0, 0.0);
sunLight.position.set(-1.3, 0.55, 0.9);
scene.add(ambLight); scene.add(sunLight);

/* anillos ecuador/meridiano dorados sutiles */
function ring(rot){
  const g=new THREE.RingGeometry(R*1.001,R*1.004,128);
  const m=new THREE.MeshBasicMaterial({color:0xc9a227,transparent:true,opacity:0.28,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(g,m); mesh.rotation.x=rot; return mesh;
}
globe.add(ring(Math.PI/2)); globe.add(ring(0));

/* === ATMÓSFERA: rim interior (BackSide) + halo aditivo en el borde === */
globe.add(new THREE.Mesh(
  new THREE.SphereGeometry(R*1.03,64,48),
  new THREE.MeshBasicMaterial({color:0x2a4a72,transparent:true,opacity:0.16,
    side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false})
));
(function(){                                   // halo: sprite gradiente radial detrás del globo
  const s=256, cv=document.createElement('canvas'); cv.width=cv.height=s;
  const g=cv.getContext('2d');
  const grad=g.createRadialGradient(s/2,s/2,s*0.30, s/2,s/2,s*0.5);
  grad.addColorStop(0,'rgba(42,74,128,0)');
  grad.addColorStop(0.74,'rgba(56,98,154,0.42)');
  grad.addColorStop(0.88,'rgba(86,126,176,0.16)');
  grad.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=grad; g.fillRect(0,0,s,s);
  const spr=new THREE.Sprite(new THREE.SpriteMaterial({
    map:new THREE.CanvasTexture(cv),transparent:true,
    blending:THREE.AdditiveBlending,depthWrite:false}));
  spr.scale.set(R*2.65,R*2.65,1);
  globe.add(spr);
})();

/* === SHEEN metálico: hotspot especular VIEW-RELATIVE (no gira con el globo) ===
   da el reflejo "cromo/metal" de las skins; opacidad = skin.sheen (0 = apagado). */
let sheenSprite=null;
(function(){
  const s=256, cv=document.createElement('canvas'); cv.width=cv.height=s;
  const g=cv.getContext('2d');
  const cx=s*0.37, cy=s*0.33;                        // reflejo desplazado arriba-izquierda
  const grad=g.createRadialGradient(cx,cy,0, cx,cy,s*0.52);
  grad.addColorStop(0,'rgba(255,255,255,0.92)');
  grad.addColorStop(0.22,'rgba(255,255,255,0.34)');
  grad.addColorStop(0.55,'rgba(255,255,255,0.06)');
  grad.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=grad; g.fillRect(0,0,s,s);
  sheenSprite=new THREE.Sprite(new THREE.SpriteMaterial({
    map:new THREE.CanvasTexture(cv), transparent:true,
    blending:THREE.AdditiveBlending, depthTest:false, depthWrite:false, opacity:0}));
  sheenSprite.scale.set(R*1.98,R*1.98,1);
  sheenSprite.renderOrder=4;
  scene.add(sheenSprite);                            // en `scene` (no en `globe`) -> no rota con la Tierra
})();

/* === OVERLAY DE PAÍS SELECCIONADO: silueta iluminada (ámbar/dorado) === */
const HL_W=4096, HL_H=2048;          // doble resolución -> resaltado filoso al acercar
const hlCanvas=document.createElement('canvas'); hlCanvas.width=HL_W; hlCanvas.height=HL_H;
const hlCtx=hlCanvas.getContext('2d');
const hlTex=new THREE.CanvasTexture(hlCanvas);
const hlMat=new THREE.MeshBasicMaterial({map:hlTex,transparent:true,opacity:0,
  blending:THREE.AdditiveBlending,depthWrite:false});
globe.add(new THREE.Mesh(new THREE.SphereGeometry(R*1.002,192,128),hlMat));
let hlTargetOpacity=0;                            // se tweenea en el loop (suave)

/* =====================================================================
   FONDO ESPACIAL (procedural, SIN imágenes): nebulosa gótica + estrellas.
   Va en su propio grupo `space` para girar a otra velocidad que el globo
   (parallax sutil -> profundidad 3D). Oscuro a propósito: jamás compite con
   el globo ni con las púas. Todo generado por código (canvas + Points).
   ===================================================================== */
const space = new THREE.Group(); scene.add(space);
let nebulaMesh=null, starSky=null;     // nebulosa procedural (atenuable) + cielo estelar real (realista)
const _spaceQ = new THREE.Quaternion();        // se usa en el loop para el parallax

/* --- nebulosa: textura equirectangular pintada en <canvas> (bruma cósmica) --- */
(function(){
  const W=2048, H=1024, cv=document.createElement('canvas'); cv.width=W; cv.height=H;
  const g=cv.getContext('2d');
  g.fillStyle='#04050a'; g.fillRect(0,0,W,H);          // casi negro, leve tinte azul
  g.globalCompositeOperation='lighter';                // las nubes se SUMAN (como gas)
  function blob(x,y,r,col){
    const grad=g.createRadialGradient(x,y,0,x,y,r);
    grad.addColorStop(0,col); grad.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=grad; g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fill();
  }
  // paleta gótica: azul-medianoche dominante + toques púrpura + un rojo-sangre MUY tenue
  const cols=['rgba(20,32,66,0.42)','rgba(16,26,54,0.38)','rgba(26,24,60,0.32)',
              'rgba(38,22,56,0.24)','rgba(44,20,50,0.20)',          // púrpura sutil
              'rgba(60,18,20,0.15)'];                                // sangre, muy tenue
  for(let i=0;i<14;i++){
    blob(Math.random()*W, H*(0.18+Math.random()*0.64), W*(0.10+Math.random()*0.22), cols[i%cols.length]);
  }
  for(let i=0;i<44;i++){                                 // bruma fina extra (textura)
    blob(Math.random()*W, Math.random()*H, W*0.03*(0.5+Math.random()), 'rgba(28,38,70,0.09)');
  }
  g.globalCompositeOperation='source-over';
  const tex=new THREE.CanvasTexture(cv);
  try{ tex.anisotropy=renderer.capabilities.getMaxAnisotropy(); }catch(e){}
  const neb=new THREE.Mesh(
    new THREE.SphereGeometry(1500,48,32),
    new THREE.MeshBasicMaterial({map:tex,side:THREE.BackSide,depthWrite:false})
  );
  neb.renderOrder=-2; space.add(neb); nebulaMesh=neb;
})();

/* --- estrellas: 3 capas con densidad y BRILLO variables (no uniformes) ---
   brillo sesgado: la mayoría tenues, pocas brillantes (pow(rand,3)). */
function starLayer(N, rMin, rMax, size, tintHex){
  const pos=new Float32Array(N*3), col=new Float32Array(N*3), c=new THREE.Color(), tint=new THREE.Color(tintHex);
  for(let i=0;i<N;i++){
    const r=rMin+Math.random()*(rMax-rMin);
    const th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1);
    pos[i*3]=r*Math.sin(ph)*Math.cos(th);
    pos[i*3+1]=r*Math.sin(ph)*Math.sin(th);
    pos[i*3+2]=r*Math.cos(ph);
    const b=0.30+Math.pow(Math.random(),3)*0.95;       // pocas muy brillantes
    c.copy(tint).multiplyScalar(Math.min(1,b));
    col[i*3]=c.r; col[i*3+1]=c.g; col[i*3+2]=c.b;
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  geo.setAttribute('color',new THREE.BufferAttribute(col,3));
  const pts=new THREE.Points(geo,new THREE.PointsMaterial({size,sizeAttenuation:true,
    vertexColors:true,transparent:true,opacity:0.9,depthWrite:false}));
  pts.renderOrder=-1; space.add(pts);
}
starLayer(1900, 700, 1300, 1.7, 0x9aa3b8);   // campo lejano, tenue y denso
starLayer( 420, 600, 1100, 3.0, 0xccd5e6);   // medias
starLayer(  64, 540,  950, 5.0, 0xf2ecdc);   // pocas brillantes (levemente cálidas)

function latLngToVec(lat,lng,radius){
  const phi=(90-lat)*Math.PI/180, th=(lng+180)*Math.PI/180;
  return new THREE.Vector3(
    -radius*Math.sin(phi)*Math.cos(th),
     radius*Math.cos(phi),
     radius*Math.sin(phi)*Math.sin(th)
  );
}

/* una púa (cilindro) + glow por país */
const UP=new THREE.Vector3(0,1,0);
const spikes = PAISES.map(p=>{
  const base=latLngToVec(p.lat,p.lng,R);
  const dir=base.clone().normalize();
  const geo=new THREE.CylinderGeometry(0.6,1.1,1,6,1,false);
  geo.translate(0,0.5,0); // pivote en la base
  const mat=new THREE.MeshBasicMaterial({color:0x8a9099,transparent:true,opacity:0.95});
  const mesh=new THREE.Mesh(geo,mat);
  mesh.position.copy(base);
  mesh.quaternion.setFromUnitVectors(UP,dir);
  mesh.userData.code=p.code;
  globe.add(mesh);

  const glow=new THREE.Mesh(
    new THREE.SphereGeometry(2.4,10,10),
    new THREE.MeshBasicMaterial({color:0xe89020,transparent:true,opacity:0.0,blending:THREE.AdditiveBlending,depthWrite:false})
  );
  globe.add(glow);

  return {pais:p,mesh,glow,base,dir,targetH:0,curH:0};
});

/* =====================================================================
   FRONTERAS REALES (TopoJSON world-atlas) proyectadas sobre la esfera
   ===================================================================== */
const bordersGroup = new THREE.Group(); globe.add(bordersGroup);
const bordersMat = new THREE.LineBasicMaterial({color:0xb39455,transparent:true,opacity:0.12});  // bronce-dorado (gótico), línea ÚNICA
let bordersReady=false;
let worldFeatures=null;                  // features del TopoJSON (para resaltar país)
let earthGeo=null;                        // geojson completo (para rehacer la textura al cambiar de skin)
const BORDER_R = R*0.995;                // radio de las fronteras: pegado a la superficie (textura en R*0.992)
                                          // -> sin doble contorno por paralaje al girar (antes flotaban en R*1.004).
/* Subdivide segmentos largos del anillo para que, al pegar la línea a la superficie,
   las cuerdas rectas entre puntos no se hundan bajo la esfera y se corten (clipping).
   ring = [[lng,lat],...] */
function densifyRing(ring, maxDeg){
  if(ring.length<2) return ring;
  const out=[ring[0]];
  for(let i=1;i<ring.length;i++){
    const a=ring[i-1], b=ring[i];
    const dLng=b[0]-a[0], dLat=b[1]-a[1];
    const dist=Math.hypot(dLng,dLat);
    if(dist>maxDeg && dist<180){                       // <180: evita interpolar mal cruces de antimeridiano
      const n=Math.ceil(dist/maxDeg);
      for(let k=1;k<n;k++) out.push([a[0]+dLng*k/n, a[1]+dLat*k/n]);
    }
    out.push(b);
  }
  return out;
}
function addRing(ring){
  const d=densifyRing(ring, 0.8);
  const pts=[];
  for(const c of d){ pts.push(latLngToVec(c[1],c[0],BORDER_R)); }
  const geo=new THREE.BufferGeometry().setFromPoints(pts);
  bordersGroup.add(new THREE.Line(geo,bordersMat));
}
function buildBorders(geojson){
  (geojson.features||[]).forEach(f=>{
    const g=f.geometry; if(!g) return;
    const polys = g.type==='Polygon'?[g.coordinates] : g.type==='MultiPolygon'?g.coordinates : [];
    polys.forEach(poly=>poly.forEach(addRing));
  });
  bordersReady=true;
}

/* Pinta un mapamundi equirectangular (océano oscuro + continentes bronce +
   costa dorada + grilla) en un <canvas> y lo envuelve en la esfera. La UV de
   SphereGeometry coincide exactamente con proj(lng,lat), así los continentes
   quedan alineados con las púas. Sin imágenes externas. */
/* dibuja un mapamundi equirectangular VECTORIAL a alta resolución (hasta 8192px) con la
   paleta dada -> nítido a cualquier zoom. Devuelve la THREE.CanvasTexture. */
function drawEarthTex(geojson, SK){
  let maxTex=4096; try{ maxTex=renderer.capabilities.maxTextureSize||4096; }catch(e){}
  const W=Math.min(8192, maxTex), H=W/2, k=W/4096;
  const cv=document.createElement('canvas'); cv.width=W; cv.height=H;
  const ctx=cv.getContext('2d');
  const og=ctx.createLinearGradient(0,0,0,H);
  og.addColorStop(0,SK.ocean[0]); og.addColorStop(0.5,SK.ocean[1]); og.addColorStop(1,SK.ocean[2]);
  ctx.fillStyle=og; ctx.fillRect(0,0,W,H);
  const proj=(lng,lat)=>[(lng+180)/360*W,(90-lat)/180*H];
  ctx.lineJoin='round';
  (geojson.features||[]).forEach(f=>{
    const g=f.geometry; if(!g) return;
    const polys=g.type==='Polygon'?[g.coordinates]:g.type==='MultiPolygon'?g.coordinates:[];
    polys.forEach(poly=>{
      ctx.beginPath();
      poly.forEach(ring=>{ ring.forEach((c,i)=>{const p=proj(c[0],c[1]); i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);}); ctx.closePath(); });
      if(SK.emboss){
        ctx.save();
        ctx.shadowColor='rgba(0,0,0,'+(0.55*SK.emboss)+')';
        ctx.shadowBlur=7*k; ctx.shadowOffsetX=3*k; ctx.shadowOffsetY=4*k;
        ctx.fillStyle=SK.land; ctx.fill('evenodd');
        ctx.restore();
      }
      ctx.fillStyle=SK.land; ctx.fill('evenodd');
      if(SK.coast){ ctx.strokeStyle=SK.coast; ctx.lineWidth=1.4*k; ctx.stroke(); }
    });
  });
  if(SK.grid){
    ctx.strokeStyle=SK.grid; ctx.lineWidth=1*k;
    for(let lng=-180;lng<=180;lng+=20){const p=proj(lng,0);ctx.beginPath();ctx.moveTo(p[0],0);ctx.lineTo(p[0],H);ctx.stroke();}
    for(let lat=-80;lat<=80;lat+=20){const p=proj(0,lat);ctx.beginPath();ctx.moveTo(0,p[1]);ctx.lineTo(W,p[1]);ctx.stroke();}
  }
  const tex=new THREE.CanvasTexture(cv);
  tex.minFilter=THREE.LinearMipmapLinearFilter; tex.generateMipmaps=true;
  try{ tex.anisotropy=renderer.capabilities.getMaxAnisotropy(); }catch(e){}
  return tex;
}
function buildEarthTexture(geojson){
  const tex=drawEarthTex(geojson, resolveSkin());     // paleta de la skin activa -> coreMat
  coreMat.map=tex; coreMat.color.set(0xffffff); coreMat.needsUpdate=true;
}
/* Tierra VECTORIAL con paleta natural (azul océano + verde tierra), nítida a cualquier zoom.
   Es una CAPA encima de la foto (coreVec) cuya opacidad se cruza suavemente con el zoom:
   lejos = foto satelital; cerca = vectorial nítido (crossfade, sin "pop"). */
let earthVectorMat=null, coreVec=null;
function buildVectorEarth(){
  if(earthVectorMat || !earthGeo) return;
  const tex=drawEarthTex(earthGeo, {ocean:['#0b2a4a','#103a63','#0b2a4a'], land:'#46582f',
                                    coast:'rgba(18,38,26,0.55)', emboss:0.55, grid:null});
  earthVectorMat=new THREE.MeshBasicMaterial({map:tex, color:0xffffff, transparent:true, opacity:0});
  coreVec=new THREE.Mesh(new THREE.SphereGeometry(R*0.9928,192,128), earthVectorMat);  // justo encima de la foto
  coreVec.visible=false; globe.add(coreVec);
}

if(window.topojson){
  fetch('assets/countries-50m.json')   // 50m = bordes más nítidos (auto-hosteado, world-atlas@2)
    .then(r=>r.json())
    .then(topo=>{ const geo=topojson.feature(topo,topo.objects.countries);
                  worldFeatures=geo.features; earthGeo=geo;
                  buildEarthTexture(geo); buildBorders(geo); buildFeatureCodes(); })
    .catch(e=>console.warn('Atlas: fronteras/textura no disponibles',e));
}

/* =====================================================================
   DIVISIONES INTERNAS (admin-1: estados/provincias/departamentos)
   Se cargan por país al entrar; líneas doradas tenues, fade con el zoom.
   ===================================================================== */
const admin1Group = new THREE.Group(); globe.add(admin1Group);
const admin1Mat = new THREE.LineBasicMaterial({color:0xffdf91,transparent:true,opacity:0});  // provincias: dorado claro, nítido
const admin1Cache = {};
let admin1Country = null;
async function loadAdmin1(code){
  if(admin1Cache[code]!==undefined) return admin1Cache[code];
  try{ const d=await fetchJSON(`data/admin1/${code}.json`); return (admin1Cache[code]=d.lines||[]); }
  catch(e){ return (admin1Cache[code]=null); }
}
function clearAdmin1(){
  admin1Country=null;
  while(admin1Group.children.length){ admin1Group.remove(admin1Group.children[0]); }
}
async function showAdmin1(code){
  clearAdmin1();
  const lines=await loadAdmin1(code);
  if(!lines || !lines.length || state.pais!==code) return;
  admin1Country=code;
  lines.forEach(ring=>{
    const pts=densifyRing(ring,0.8).map(c=>latLngToVec(c[1],c[0],R*0.997));  // pegado a la superficie (apenas sobre las fronteras)
    admin1Group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), admin1Mat));
  });
}

/* --- resaltado del país seleccionado (overlay aditivo, fade suave) --- */
function _projHL(lng,lat){ return [(lng+180)/360*HL_W, (90-lat)/180*HL_H]; }
function _featPolys(f){
  const g=f.geometry; if(!g) return [];
  return g.type==='Polygon'?[g.coordinates] : g.type==='MultiPolygon'?g.coordinates : [];
}
function _pointInRing(lng,lat,ring){
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const xi=ring[i][0],yi=ring[i][1], xj=ring[j][0],yj=ring[j][1];
    if(((yi>lat)!==(yj>lat)) && (lng < (xj-xi)*(lat-yi)/(yj-yi)+xi)) inside=!inside;
  }
  return inside;
}
function featureForLatLng(lat,lng){
  if(!worldFeatures) return null;
  let best=null, bd=Infinity;
  for(const f of worldFeatures){
    const polys=_featPolys(f);
    for(const poly of polys){ if(_pointInRing(lng,lat,poly[0])) return f; }   // dentro
    if(polys.length){                                    // fallback: centroide más cercano
      const r=polys[0][0]; let sx=0,sy=0; for(const c of r){ sx+=c[0]; sy+=c[1]; }
      const cx=sx/r.length, cy=sy/r.length, d=(cx-lng)*(cx-lng)+(cy-lat)*(cy-lat);
      if(d<bd){ bd=d; best=f; }
    }
  }
  return best;
}
/* --- clic en cualquier parte del territorio: punto 3D -> país --- */
function featureContaining(lat,lng){       // estricto: solo si el punto cae DENTRO
  if(!worldFeatures) return null;
  for(const f of worldFeatures){
    for(const poly of _featPolys(f)){ if(_pointInRing(lng,lat,poly[0])) return f; }
  }
  return null;
}
function buildFeatureCodes(){              // etiqueta cada feature con el code del país
  if(!worldFeatures) return;
  PAISES.forEach(p=>{
    const f=featureContaining(p.lat,p.lng);
    if(f && !f.__code) f.__code=p.code;
  });
}
function featureCodeAt(lat,lng){
  const f=featureContaining(lat,lng);
  return f && f.__code ? f.__code : null;
}
function vecToLatLng(v){                    // inversa de latLngToVec (coords locales del globo)
  const r=v.length()||1;
  const lat=90 - Math.acos(Math.max(-1,Math.min(1,v.y/r)))*180/Math.PI;
  let lng=Math.atan2(v.z,-v.x)*180/Math.PI - 180;
  while(lng<-180) lng+=360; while(lng>180) lng-=360;
  return [lat,lng];
}
function paintHighlight(f){
  hlCtx.clearRect(0,0,HL_W,HL_H);
  hlCtx.lineJoin='round';
  const rgb=SEL_RGB.join(',');                          // color de selección del tema activo
  _featPolys(f).forEach(poly=>{
    hlCtx.beginPath();
    poly.forEach(ring=>{ ring.forEach((c,i)=>{const q=_projHL(c[0],c[1]); i?hlCtx.lineTo(q[0],q[1]):hlCtx.moveTo(q[0],q[1]);}); hlCtx.closePath(); });
    hlCtx.shadowBlur=0;
    hlCtx.fillStyle=`rgba(${rgb},0.42)`; hlCtx.fill('evenodd');         // relleno translúcido ("la región se enciende")
    hlCtx.shadowColor=`rgba(${rgb},1)`; hlCtx.shadowBlur=34;            // glow del borde (más marcado)
    hlCtx.strokeStyle=`rgba(${rgb},1)`; hlCtx.lineWidth=7; hlCtx.stroke();
    hlCtx.shadowBlur=0;
  });
  hlTex.needsUpdate=true;
}
function selectHighlight(p){
  const f=featureForLatLng(p.lat,p.lng);
  if(!f){ hlTargetOpacity=0; return; }
  paintHighlight(f);
  hlTargetOpacity=1;
}
function clearHighlight(){ hlTargetOpacity=0; }

/* =====================================================================
   ZOOM PROGRESIVO + VUELO DE CÁMARA + ETIQUETAS DE PAÍS
   ===================================================================== */
const L_PLANET=R*2.3, L_COUNTRY=R*1.7, L_LOCAL=R*1.32;   // umbrales de nivel
function nivel(){ return camDist>L_PLANET?'planet' : camDist>L_COUNTRY?'cont' : camDist>L_LOCAL?'country' : 'local'; }

const labelsEl=document.getElementById('am-labels');
const homeBtn=document.getElementById('am-home');
const _proj=new THREE.Vector3();
const labelDivs={};                              // code -> div
spikes.forEach(s=>{
  const d=document.createElement('div'); d.className='am-clabel'; d.style.opacity=0;
  d.innerHTML=`<span class="n">${s.pais.name}</span>`;
  labelsEl.appendChild(d); labelDivs[s.pais.code]=d;
});
// en nivel continental sólo mostramos los países más densos (menos ruido)
const rankTotal = spikes.slice().sort((a,b)=>total(b.pais)-total(a.pais));
const topCodes = new Set(rankTotal.slice(0,45).map(s=>s.pais.code));

let tween=null;                                   // {t,dur,fromQ,toQ,fromDist,toDist,onEnd}
function flyTo(p, dist){
  const dir=latLngToVec(p.lat,p.lng,1).normalize();
  const toQ=new THREE.Quaternion().setFromUnitVectors(dir,new THREE.Vector3(0,0,1));
  const toDist = dist!=null ? dist : (isMobile()?R*1.95:R*1.52);
  tween={t:0,dur:48,fromQ:globe.quaternion.clone(),toQ,fromDist:camDist,toDist};
}
function flyHome(){
  tween={t:0,dur:44,fromQ:globe.quaternion.clone(),toQ:globe.quaternion.clone(),
         fromDist:camDist,toDist:CAM_PLANET};
}
/* Reorientar: vuelve a la vista INICIAL guardada al cargar (orientación identidad +
   distancia planetaria), con tween suave. Corta la inercia. No toca filtros/ficha. */
function reorientar(){
  velRX=0; velRY=0;
  tween={t:0,dur:46,fromQ:globe.quaternion.clone(),toQ:new THREE.Quaternion(),
         fromDist:camDist,toDist:CAM_PLANET};
}
homeBtn.addEventListener('click',()=>{ cerrarDetalle(); flyHome(); if(isMobile()) closeSheets(); });
document.getElementById('am-reset').addEventListener('click',reorientar);

/* ===== "Limpiar todo": resetea géneros + país + ciudad y vuelve al mundo ===== */
function updateClearBtn(){
  const el=document.getElementById('am-clear'); if(!el) return;
  el.style.display = (state.genFilters.length || state.pais || state.ciudad) ? 'flex' : 'none';
}
function resetAll(){
  state.genFilters=[];
  cerrarDetalle();                          // limpia país + ciudad, vuelve al mundo
  aplicarFiltro();                          // re-pinta sin filtros (globo, chips, KPIs, resultados)
  const si=document.getElementById('am-search-in');
  if(si){ si.value=''; const c=document.getElementById('am-search-clear'); if(c) c.style.display='none'; }
  if(isMobile()) closeSheets();
  updateClearBtn();
}
document.getElementById('am-clear').addEventListener('click',resetAll);

/* ===== redimensionar el panel derecho (arrastrar su borde izquierdo) ===== */
(function(){
  const rz=document.getElementById('am-resizer'); if(!rz) return;
  const MINW=260; const maxW=()=>Math.min(760,Math.round(window.innerWidth*0.6));
  function setW(px){ px=Math.max(MINW,Math.min(maxW(),Math.round(px)));
    document.documentElement.style.setProperty('--right-w', px+'px');
    window.dispatchEvent(new Event('resize')); return px; }
  try{ const w=parseInt(localStorage.getItem('mg_right_w')||'',10); if(w) setW(w); }catch(e){}
  let drag=false;
  rz.addEventListener('pointerdown',e=>{ drag=true; rz.classList.add('drag'); try{rz.setPointerCapture(e.pointerId);}catch(_){} e.preventDefault(); });
  rz.addEventListener('pointermove',e=>{ if(drag) setW(window.innerWidth - e.clientX); });
  function end(e){ if(!drag) return; drag=false; rz.classList.remove('drag'); try{rz.releasePointerCapture(e.pointerId);}catch(_){}
    const cur=parseInt(getComputedStyle(document.documentElement).getPropertyValue('--right-w'),10)||312;
    try{ localStorage.setItem('mg_right_w', cur); }catch(_){}}
  rz.addEventListener('pointerup',end); rz.addEventListener('pointercancel',end);
})();

function updateLOD(){
  const lv=nivel();
  // REALISTA: foto satelital de lejos (impacto) -> textura vectorial 8192px de cerca (nítida).
  // resuelve el pixelado al hacer zoom profundo, sin perder el "wow" planetario.
  if(CURRENT_SKIN==='realista'){
    const near=(lv==='local'||lv==='country');
    if(near && !coreVec && earthGeo) buildVectorEarth();           // construir la capa nítida al primer zoom
    if(coreVec){
      const tgt=near?1:0;
      earthVectorMat.opacity += (tgt-earthVectorMat.opacity)*0.07; // CROSSFADE suave foto<->vectorial
      coreVec.visible = earthVectorMat.opacity>0.012;
    }
  }
  // brillo de fronteras según nivel (más fuerte al acercar -> se leen nítidas)
  const tgt = lv==='planet'?0.12 : lv==='cont'?0.42 : lv==='country'?0.6 : 0.78;
  bordersMat.opacity += (tgt-bordersMat.opacity)*0.1;
  // fade del resaltado de país: sirve para ubicarlo de lejos; al acercarse ya estás
  // DENTRO, así que se desvanece para no lavar de ámbar el mapa y dejarlo nítido.
  // la región SELECCIONADA se enciende (borde con glow + fill translúcido del tema);
  // a nivel local (muy cerca, ya estás dentro) se desvanece para no lavar el mapa.
  // la región SELECCIONADA se mantiene encendida incluso al acercar (para ver el color de selección)
  const hlZoom = lv==='local'?0.62 : lv==='country'?0.9 : ((cityCountry&&cityFade>0)?0.72:1);
  const hlTgt = hlTargetOpacity * hlZoom;
  hlMat.opacity += (hlTgt-hlMat.opacity)*0.12;
  // divisiones internas (provincias/departamentos): claras al acercar
  const a1tgt = !admin1Country ? 0 : (lv==='local'?0.92 : lv==='planet'?0 : lv==='country'?0.7 : 0.5);
  admin1Mat.opacity += (a1tgt-admin1Mat.opacity)*0.1;
  // botón "vista planetaria" visible si nos alejamos de lo planetario o hay país
  homeBtn.style.display = (lv!=='planet'||state.pais) ? 'flex' : 'none';
  // etiquetas
  globe.updateMatrixWorld();
  const w=canvas.clientWidth, h=canvas.clientHeight;
  spikes.forEach(s=>{
    const div=labelDivs[s.pais.code];
    let vis = lv!=='planet';
    if(vis && lv==='cont' && !topCodes.has(s.pais.code) && state.pais!==s.pais.code) vis=false;
    if(!vis){ if(div.style.opacity!=='0') div.style.opacity=0; return; }
    const wp=s.base.clone().applyMatrix4(globe.matrixWorld);
    if(wp.z<=R*0.15){ div.style.opacity=0; return; }   // cara oculta
    _proj.copy(wp).project(camera);
    const x=(_proj.x*0.5+0.5)*w, y=(-_proj.y*0.5+0.5)*h;
    div.style.left=x+'px'; div.style.top=(y-14)+'px';
    div.style.opacity = (state.pais===s.pais.code)?1:0.82;
  });
}

/* =====================================================================
   PINES POR CIUDAD (solo países con data geocodificada; hoy: Perú)
   ===================================================================== */
const cityGroup = new THREE.Group(); globe.add(cityGroup);
const cityFileCache = {};
let cityCountry = null;     // país cuyos pines están activos
let cityList = [];          // ciudades del país activo
let citySubleg = [];        // leyenda de subgéneros del país activo (índices de banda.s)
let cityPins = [];          // [{city, base, sprite, val, _baseOp}]
let cityFade = 0;           // opacidad objetivo (0/1) para la transición

const _pinTex = (function(){                      // glow radial para los pines
  const s=128, cv=document.createElement('canvas'); cv.width=cv.height=s;
  const g=cv.getContext('2d');
  const grad=g.createRadialGradient(s/2,s/2,0, s/2,s/2,s/2);
  grad.addColorStop(0,'rgba(255,255,255,1)');         // núcleo blanco; el TONO lo da el color del sprite (tema)
  grad.addColorStop(0.14,'rgba(255,250,242,0.92)');
  grad.addColorStop(0.40,'rgba(255,255,255,0.30)');
  grad.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=grad; g.fillRect(0,0,s,s);
  return new THREE.CanvasTexture(cv);
})();

async function loadCityFile(code){
  if(cityFileCache[code]) return cityFileCache[code];
  return (cityFileCache[code]=await fetchJSON(`data/ciudades/${code}.json`));
}
async function loadCiudades(code){ return (await loadCityFile(code)).ciudades||[]; }
const CITY_PIN_CAP = 350;                 // tope de pines (rendimiento; ya vienen ordenadas por total)
function buildCityPins(cities){
  cityPins.forEach(p=>cityGroup.remove(p.sprite));
  cityPins=[];
  cities.slice(0, CITY_PIN_CAP).forEach(city=>{
    const base=latLngToVec(city.lat, city.lng, R*1.012);
    const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:_pinTex,transparent:true,
      opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false}));
    spr.position.copy(base); spr.userData.ciudad=city;
    cityGroup.add(spr);
    cityPins.push({city, base, sprite:spr, val:0, _baseOp:0});
  });
}
const PIN_K=0.058;   // calibra el tamaño en pantalla de los pines
function applyPinScale(){            // mantiene el tamaño visual del pin ~constante a todo zoom
  if(!cityPins.length) return;
  // el tamaño en pantalla de un sprite ~ tamañoMundo / (distancia cámara->pin).
  // la distancia al pin del frente es ~ (camDist - R), NO camDist; si usáramos camDist,
  // al acercar (camDist->R) los pines se agrandarían y se fusionarían en un borrón.
  // Escalando por (camDist - R) el tamaño visual queda constante -> al acercar, los
  // pines NO crecen pero su separación geográfica en pantalla SÍ -> se despegan.
  const s=Math.max(R*0.04, camDist-R)*PIN_K;
  for(const p of cityPins){
    if(!p.sprite.visible) continue;
    const sc=(p._sz||1)*s;
    p.sprite.scale.set(sc,sc,1);
  }
}
/* nº de bandas de una ciudad que pertenecen al subgénero activo (escanea banda.s) */
function cityCountSub(city, idx){
  if(idx<0) return 0;
  let n=0; const bs=city.bandas||[];
  for(let i=0;i<bs.length;i++){ const s=bs[i].s; if(s && s.indexOf(idx)!==-1) n++; }
  return n;
}
/* ¿una banda de ciudad (b.s = ÍNDICES en citySubleg; b.r = raíces string) cumple el filtro? (single/O/Y) */
function bandMatchComboIdx(b){
  const f=state.genFilters; if(!f.length) return false;
  const hit=t=>{ if(t.s){ const i=citySubleg.indexOf(t.s); return i>=0 && (b.s||[]).indexOf(i)!==-1; }
                 return (b.r||[]).includes(t.r); };
  return (state.combine && state.boolOp==='AND') ? f.every(hit) : f.some(hit);
}
/* nº de bandas de una ciudad que cumplen la combinación activa */
function cityCountCombo(city){
  let n=0; const bs=city.bandas||[];
  for(let i=0;i<bs.length;i++){ if(bandMatchComboIdx(bs[i])) n++; }
  return n;
}
function recomputeCityPins(){
  if(!cityPins.length) return;
  const g=state.genero, combo=state.combine; let max=0;
  const subIdx = state.subgenero ? citySubleg.indexOf(state.subgenero) : -1;   // -1 si el país no lo tiene
  cityPins.forEach(p=>{
    p.val = combo ? cityCountCombo(p.city)
          : state.subgenero ? cityCountSub(p.city, subIdx)
          : g ? (p.city.g[g]||0) : p.city.total;
    if(p.val>max)max=p.val;
  });
  cityPins.forEach(p=>{
    if(p.val<=0){ p.sprite.visible=false; p._baseOp=0; return; }
    p.sprite.visible=true;
    const t=Math.log(p.val+1)/Math.log((max||1)+1);
    const sel=(state.ciudad===p.city.nombre);
    // _sz = tamaño en PANTALLA (no en mundo): el loop lo multiplica por camDist para
    // que el pin conserve un tamaño visual ~constante a cualquier zoom. Así, al acercar,
    // los pines amontonados se SEPARAN (la distancia geográfica crece en pantalla pero el
    // pin no), volviéndose clickeables/tappeables uno por uno. Vale igual en PC y móvil.
    p._sz=(0.46+1.25*t)*(sel?1.95:1);                        // pines un poco más grandes (más visibles)
    if(sel) p.sprite.material.color.setRGB(SEL_RGB[0]/255,SEL_RGB[1]/255,SEL_RGB[2]/255);  // seleccionado -> color de Selección
    else p.sprite.material.color.copy(colorFor(0.45+0.55*t));
    p._baseOp=sel?1:0.72+0.28*t;                             // más opacos: se leen como "luces" sobre la Tierra realista
  });
  applyPinScale();   // aplica el tamaño con el zoom actual ya mismo (sin esperar al loop)
}
async function activarCiudades(p){
  desactivarCiudades();
  if(!CITY_COUNTRIES.has(p.code)) return;        // sin data -> púa central normal
  let file;
  try{ file=await loadCityFile(p.code); }catch(e){ return; }
  if(state.pais!==p.code) return;                // cambió mientras cargaba
  cityList=file.ciudades||[]; citySubleg=file.subleg||[]; cityCountry=p.code;
  buildCityPins(cityList); recomputeCityPins();
  cityFade=1;                                    // fade-in
  recompute();                                   // oculta la púa central del país
  // ya cargaron las ciudades -> refrescá la ficha para mostrar la DESAGREGACIÓN por localidad
  // (la sección inferior pasa de "cargando…" a la lista rica/clickeable, reactiva al filtro)
  if(state.pais===p.code && !state.ciudad && detailEl.classList.contains('show')) renderFicha(p);
}
function desactivarCiudades(){ cityFade=0; cityCountry=null; citySubleg=[]; recompute(); }

/* recalcula altura+color según filtro */
function recompute(){
  const usandoGenero = state.genFilters.length>0;   // raíz / subgénero / combinación -> escala "género"
  let max=0;
  spikes.forEach(s=>{
    const val = valPais(s.pais);              // total / raíz / subgénero
    s.val=val; if(val>max)max=val;
  });
  spikes.forEach(s=>{
    // país con pines de ciudad activos: ocultar su púa central (la reemplazan los pines)
    if(cityCountry && cityFade>0 && s.pais.code===cityCountry){
      s.targetH=0; s.mesh.visible=false; s.glow.visible=false; return;
    }
    if(s.val<=0){ s.targetH=0; s.mesh.visible=false; s.glow.visible=false; return; }
    s.mesh.visible=true;
    const t=Math.log(s.val+1)/Math.log(max+1);
    s.targetH = 7 + 50*t;
    let col;
    if(usandoGenero){ col = colorFor(0.45+0.55*t); s.glow.visible=true; }
    else { col = colorFor(t); s.glow.visible = t>0.40; }
    s.mesh.material.color.copy(col);
    s.mesh.material.opacity = usandoGenero ? 1 : 0.6+0.4*t;
    s.glow.material.color.copy(usandoGenero?colorFor(0.92):col);
    s.glow.material.opacity = (usandoGenero?0.8:0.62)*(0.45+0.6*t);
    s.glow.scale.setScalar(1.05+1.5*t);
  });
}

/* posiciona glow en la punta segun altura actual */
function placeGlow(s){
  const tip=s.base.clone().add(s.dir.clone().multiplyScalar(s.curH));
  s.glow.position.copy(tip);
}

/* =====================================================================
   INTERACCIÓN: órbita manual + raycaster
   ===================================================================== */
let dragging=false, moved=0, px=0, py=0;
let velRX=0, velRY=0;                              // inercia angular (rad/frame) en ejes de PANTALLA
const ray=new THREE.Raycaster(), mouse=new THREE.Vector2();
/* rotación TRACKBALL libre (360° real): acumula giros como cuaterniones en ejes de
   MUNDO (alineados a la pantalla) via premultiply -> no hay eje fijo ni bloqueo polar. */
const _AXIS_X=new THREE.Vector3(1,0,0), _AXIS_Y=new THREE.Vector3(0,1,0), _qSpin=new THREE.Quaternion();
function spinGlobe(ax, ay){                        // ax: giro horizontal, ay: vertical (rad)
  if(ax){ _qSpin.setFromAxisAngle(_AXIS_Y, ax); globe.quaternion.premultiply(_qSpin); }
  if(ay){ _qSpin.setFromAxisAngle(_AXIS_X, ay); globe.quaternion.premultiply(_qSpin); }
  globe.quaternion.normalize();
}

/* ===== DEBUG OVERLAY (temporal) — activar agregando ?debug=1 a la URL ===== */
const DEBUG = /[?&]debug=1/.test(location.search);
let dbgEl=null, _dbgBuf='';
function dbgInit(){
  if(!DEBUG) return;
  dbgEl=document.createElement('div');
  dbgEl.id='am-dbg';
  dbgEl.style.cssText='position:fixed;left:6px;right:6px;top:54px;z-index:99999;'+
    'background:rgba(0,0,0,0.86);color:#23ff6a;font:11px/1.4 monospace;'+
    'padding:8px 10px;border:1px solid #23ff6a;white-space:pre-wrap;word-break:break-word;'+
    'pointer-events:none;max-height:48vh;overflow:hidden;border-radius:6px';
  document.body.appendChild(dbgEl);
  dbgReset('DEBUG ON — toca el globo y leeme');
}
function _dev(){
  const mob=window.matchMedia('(max-width:768px)').matches;   // inline (evita TDZ de isMobile en el arranque)
  return 'isMobile='+mob+'  win='+window.innerWidth+'x'+window.innerHeight+
         '  dpr='+(window.devicePixelRatio||1)+
         '\ncanvasCSS='+canvas.clientWidth+'x'+canvas.clientHeight+
         '  orient='+(window.innerWidth>window.innerHeight?'landscape':'portrait');
}
function dbgReset(line){ if(!dbgEl) return; _dbgBuf=line+'\n'+_dev(); dbgEl.textContent=_dbgBuf; }
function dbgAdd(line){ if(!dbgEl) return; _dbgBuf+='\n'+line; dbgEl.textContent=_dbgBuf; }

function pointerDown(x,y){dragging=true;moved=0;px=x;py=y;}
function pointerMove(x,y,clientX,clientY){
  // tooltip hover
  hover(clientX,clientY);
  if(!dragging)return;
  const dx=x-px,dy=y-py; moved+=Math.abs(dx)+Math.abs(dy);
  // sensibilidad proporcional al zoom: cerca gira lento (control fino), lejos normal.
  const zf = Math.max(0.12, Math.min(1, (camDist-R)/(CAM_PLANET-R)));
  const ax=dx*0.005*zf, ay=dy*0.005*zf;
  spinGlobe(ax, ay);                 // trackball libre (sin clamp de polo)
  velRX=ax; velRY=ay;                // inercia
  px=x;py=y;
}
function pointerUp(clientX,clientY){
  if(dragging && moved<6){ pickAt(clientX,clientY); }
  dragging=false;
}

function setMouse(clientX,clientY){
  const r=canvas.getBoundingClientRect();
  mouse.x=((clientX-r.left)/r.width)*2-1;
  mouse.y=-((clientY-r.top)/r.height)*2+1;
}
function pinsActivos(){ return cityCountry && cityFade>0 && cityPins.length; }
/* pin más cercano al punto tocado EN PANTALLA (preciso aunque los sprites se
   superpongan; en móvil el raycast contra sprites agarraba el vecino grande) */
const _pinV=new THREE.Vector3();
function nearestPinScreen(cx,cy,maxDist){
  globe.updateMatrixWorld();
  const r=canvas.getBoundingClientRect();
  let best=null, bd=maxDist*maxDist;
  for(const p of cityPins){
    if(!p.sprite.visible) continue;
    _pinV.copy(p.base).applyMatrix4(globe.matrixWorld);
    if(_pinV.z < R*0.1) continue;                 // solo pines de la cara visible
    _pinV.project(camera);
    const sx=(_pinV.x*0.5+0.5)*r.width + r.left;
    const sy=(-_pinV.y*0.5+0.5)*r.height + r.top;
    const d=(sx-cx)*(sx-cx)+(sy-cy)*(sy-cy);
    if(d<bd){ bd=d; best=p; }
  }
  return best;
}
/* Ciudad de la PROVINCIA tocada: anillo admin-1 que contiene el punto, y la
   ciudad (pin) de más bandas dentro de ESE anillo. Point-in-polygon real. */
function ciudadEnProvincia(lng, lat){
  const rings = admin1Cache[state.pais];
  if(!rings || !rings.length) return null;
  const ring = rings.find(r => _pointInRing(lng, lat, r));   // anillo = [[lng,lat],...]
  if(!ring) return null;
  let best=null;
  for(const p of cityPins){
    if(!p.sprite.visible) continue;
    if(_pointInRing(p.city.lng, p.city.lat, ring)){
      if(!best || p.city.total > best.total) best=p.city;   // best ya es una ciudad -> best.total
    }
  }
  return best;
}
function pickAt(clientX,clientY){
  setMouse(clientX,clientY);
  ray.setFromCamera(mouse,camera);

  if(DEBUG){ const r=canvas.getBoundingClientRect();
    dbgReset('PICKAT tap=('+Math.round(clientX)+','+Math.round(clientY)+')  rama='+(isMobile()?'MOVIL':'ESCRITORIO'));
    dbgAdd('rect L,T='+Math.round(r.left)+','+Math.round(r.top)+'  W,H='+Math.round(r.width)+'x'+Math.round(r.height));
    dbgAdd('NDC=('+mouse.x.toFixed(3)+','+mouse.y.toFixed(3)+')');
    dbgAdd('pais='+state.pais+'  pinsActivos='+(pinsActivos()?'SI':'no')+
           '  pinsVis='+cityPins.filter(p=>p.sprite.visible).length+
           '  admin1rings='+((admin1Cache[state.pais]||[]).length)); }

  if(isMobile()){
    // 1) territorio tocado (punto 3D -> lat/lng -> país). PRIORITARIO: si estamos
    //    dentro del país actual, la PROVINCIA tocada manda (point-in-polygon admin-1),
    //    NO el pin más cercano. Con pines densos, el pin vecino secuestraba el toque
    //    y caía en una ciudad cualquiera (a menudo el cluster grande), nunca el
    //    estado tocado. Ahora el polígono admin-1 que contiene el punto decide.
    const gh=ray.intersectObject(core);
    if(DEBUG) dbgAdd('rayHitGlobo='+(gh.length?'SI':'NO'));
    if(gh.length){
      const ll=vecToLatLng(globe.worldToLocal(gh[0].point.clone()));   // [lat,lng]
      const code=featureCodeAt(ll[0], ll[1]);
      if(DEBUG) dbgAdd('lat,lng=('+ll[0].toFixed(2)+','+ll[1].toFixed(2)+')  paisDetectado='+code);
      // 1a) dentro del país actual: provincia tocada -> su ciudad cabecera (admin-1)
      if(pinsActivos() && code===state.pais){
        // fallback (sólo si el punto no cae en ningún polígono admin-1: costa/hueco):
        // el pin más cercano AL TOQUE, que no sesga hacia los clusters densos
        const prov=ciudadEnProvincia(ll[1], ll[0]);
        const c = prov || (nearestPinScreen(clientX,clientY,9999)||{}).city;
        if(DEBUG) dbgAdd('=> 1a '+(prov?'PROVINCIA(point-in-polygon)':'FALLBACK pin cercano')+' -> '+(c?c.nombre:'null'));
        if(c){ seleccionarCiudad(c); return; }
      }
      // 1b) otro país -> seleccionarlo
      if(code && code!==state.pais){ if(DEBUG) dbgAdd('=> 1b otroPais -> '+code); seleccionarPais(code); return; }
      if(DEBUG) dbgAdd('=> 1 sin accion (code='+code+', pais='+state.pais+')');
    }
    // 2) el rayo falló (tangente cerca del borde del globo): probá pin directo
    if(pinsActivos()){
      const direct=nearestPinScreen(clientX,clientY,30);
      if(direct){ if(DEBUG) dbgAdd('=> 2 pin directo <=30px -> '+direct.city.nombre); seleccionarCiudad(direct.city); return; }
    }
    // 3) vista planetaria: tocar una púa
    const hits=ray.intersectObjects(spikes.filter(s=>s.mesh.visible).map(s=>s.mesh));
    if(DEBUG) dbgAdd('=> 3 spikes='+hits.length+(hits.length?' -> '+hits[0].object.userData.code:''));
    if(hits.length){ seleccionarPais(hits[0].object.userData.code); }
    return;
  }

  // ===== ESCRITORIO: el TERRITORIO tocado MANDA (clic en cualquier parte del país -> país) =====
  const gh=ray.intersectObject(core);
  if(gh.length){
    const ll=vecToLatLng(globe.worldToLocal(gh[0].point.clone()));   // [lat,lng]
    const code=featureCodeAt(ll[0], ll[1]);
    // dentro del país actual con pines -> provincia/ciudad tocada (point-in-polygon)
    if(pinsActivos() && code===state.pais){
      const prov=ciudadEnProvincia(ll[1], ll[0]);
      const c=prov || (nearestPinScreen(clientX,clientY,9999)||{}).city;
      if(c){ seleccionarCiudad(c); return; }
    }
    if(code && code!==state.pais){ seleccionarPais(code); return; }   // otro país -> seleccionarlo
    if(code && code===state.pais && state.ciudad){                    // re-clic en el país -> volver a vista país
      state.ciudad=null; recomputeCityPins();
      const p=PAISES.find(x=>x.code===code); if(p) renderFicha(p); return;
    }
  }
  // fallback: púa (clic sobre la punta del spike, por fuera de la superficie)
  const hits=ray.intersectObjects(spikes.filter(s=>s.mesh.visible).map(s=>s.mesh));
  if(hits.length){ seleccionarPais(hits[0].object.userData.code); return; }
  // fallback: pin de ciudad directo
  if(pinsActivos()){
    const ph=ray.intersectObjects(cityPins.filter(p=>p.sprite.visible).map(p=>p.sprite));
    if(ph.length){ seleccionarCiudad(ph[0].object.userData.ciudad); return; }
  }
}
const tip=document.getElementById('am-tip');
function hover(clientX,clientY){
  if(dragging){tip.style.display='none';return;}
  setMouse(clientX,clientY);
  ray.setFromCamera(mouse,camera);
  if(pinsActivos()){
    const ph=ray.intersectObjects(cityPins.filter(p=>p.sprite.visible).map(p=>p.sprite));
    if(ph.length){
      const c=ph[0].object.userData.ciudad;
      const val=state.genero?(c.g[state.genero]||0):c.total;
      tip.querySelector('.tn').textContent=c.nombre;
      tip.querySelector('.tv').textContent=fmt(val)+(state.genero?(' · '+state.genero):' bandas');
      tip.style.display='block';
      tip.style.left=(clientX+14)+'px'; tip.style.top=(clientY+14)+'px';
      canvas.style.cursor='pointer'; return;
    }
  }
  const hits=ray.intersectObjects(spikes.filter(s=>s.mesh.visible).map(s=>s.mesh));
  if(hits.length){
    const s=spikes.find(x=>x.mesh===hits[0].object);
    tip.querySelector('.tn').innerHTML=flagImg(s.pais.code,13)+' '+s.pais.name;
    tip.querySelector('.tv').textContent=fmt(s.val)+(state.genero?(' · '+state.genero):' bandas');
    tip.style.display='block';
    tip.style.left=(clientX+14)+'px';
    tip.style.top=(clientY+14)+'px';
    canvas.style.cursor='pointer';
  } else { tip.style.display='none'; canvas.style.cursor='grab'; }
}

canvas.addEventListener('mousedown',e=>pointerDown(e.clientX,e.clientY));
window.addEventListener('mousemove',e=>pointerMove(e.clientX,e.clientY,e.clientX,e.clientY));
window.addEventListener('mouseup',e=>pointerUp(e.clientX,e.clientY));
canvas.addEventListener('wheel',e=>{e.preventDefault();tween=null;
  // paso proporcional a la distancia -> control fino cerca, rápido lejos
  camDist=Math.max(CAM_MIN,Math.min(CAM_MAX,camDist+e.deltaY*0.0014*camDist));},{passive:false});
let pinchD=0;
function _touchDist(e){const a=e.touches[0],b=e.touches[1];return Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);}
canvas.addEventListener('touchstart',e=>{
  if(e.touches.length>=2){ pinchD=_touchDist(e); dragging=false; if(DEBUG) dbgReset('PINCH ('+e.touches.length+' dedos) — zoom'); }
  else { const t=e.touches[0]; if(DEBUG) dbgReset('TOUCHSTART ('+Math.round(t.clientX)+','+Math.round(t.clientY)+')'); pointerDown(t.clientX,t.clientY); }
},{passive:true});
canvas.addEventListener('touchmove',e=>{
  if(e.touches.length>=2){                 // pellizcar = zoom (llega al mismo nivel que la rueda)
    const d=_touchDist(e);
    if(pinchD>0 && d>0){ tween=null; camDist=Math.max(CAM_MIN,Math.min(CAM_MAX, camDist*(pinchD/d))); }
    pinchD=d; return;
  }
  const t=e.touches[0]; pointerMove(t.clientX,t.clientY,t.clientX,t.clientY);
},{passive:true});
canvas.addEventListener('touchend',e=>{
  if(e.touches.length<2) pinchD=0;
  const t=e.changedTouches[0]; if(t){
    if(DEBUG && !(dragging && moved<6)) dbgReset('TOUCHEND ('+Math.round(t.clientX)+','+Math.round(t.clientY)+
      ') moved='+moved.toFixed(1)+' >=6 -> tratado como ARRASTRE (no selecciona)\n'+_dev());
    pointerUp(t.clientX,t.clientY);
  }
},{passive:true});
dbgInit();   // crea el cartelito de debug si la URL trae ?debug=1

/* =====================================================================
   PANELES: lista de géneros, treemap, detalle país
   ===================================================================== */
const genresEl=document.getElementById('am-genres');
const allBtn=document.getElementById('am-all');
const maxGen=Math.max(...Object.values(generoTotales));
const rowEls={};       // root -> fila de género raíz
const subWrapEls={};   // root -> contenedor de subgéneros
const subRowEls={};    // "root|key" -> fila de subgénero
const expanded=new Set();   // raíces expandidas

/* ÁRBOL: cada raíz se puede expandir (caret) para mostrar sus subgéneros.
   Colapsado por defecto -> se ven sólo las 17 raíces, como antes. */
GENEROS.slice().sort((a,b)=>generoTotales[b]-generoTotales[a]).forEach(g=>{
  const row=document.createElement('div');
  row.className='am-grow';
  const tieneSub = (SUBGEN[g]||[]).length>0;
  row.innerHTML=`<span class="gcaret">${tieneSub?'▸':'·'}</span>`+
    `<span class="gname">${g}</span><span class="gcount">${fmt(generoTotales[g])}</span>`+
    `<span class="gbar" style="width:${(generoTotales[g]/maxGen*100).toFixed(0)}%"></span>`;
  // caret: sólo expande/colapsa
  row.querySelector('.gcaret').addEventListener('click',e=>{ e.stopPropagation(); if(tieneSub) toggleExpand(g); });
  // cuerpo de la fila: agrega/quita la raíz a la combinación (y la expande para ver subgéneros)
  row.addEventListener('click',()=>{ toggleToken({r:g,s:null}); if(tieneSub && isRootActive(g)) setExpand(g,true); });
  genresEl.appendChild(row);
  rowEls[g]=row;

  // sublista: 8 subgéneros top (conteo GLOBAL) + grupo "Otros" expandible (la cola)
  const wrap=document.createElement('div');
  wrap.className='am-subs';
  const full=SUBGEN[g]||[], named=full.slice(0,8), tail=full.slice(8);
  named.forEach(([label,count])=> wrap.appendChild(makeSrow(g,label,count)));
  if(tail.length){
    const otrosTotal=tail.reduce((a,x)=>a+x[1],0);
    const orow=document.createElement('div');
    orow.className='am-srow otros otros-group';
    orow.innerHTML=`<span class="scaret">▸</span><span class="sname">Otros</span><span class="scount">${fmt(otrosTotal)}</span>`;
    const tailWrap=document.createElement('div'); tailWrap.className='am-subs-tail';
    tail.forEach(([label,count])=> tailWrap.appendChild(makeSrow(g,label,count)));
    orow.addEventListener('click',e=>{ e.stopPropagation();
      const open=tailWrap.classList.toggle('open'); orow.classList.toggle('open-otros',open); });
    wrap.appendChild(orow); wrap.appendChild(tailWrap);
  }
  genresEl.appendChild(wrap);
  subWrapEls[g]=wrap;
});
/* crea una fila de subgénero (named o de la cola); la clave de filtro es el sub real */
function makeSrow(g,label,count){
  const sr=document.createElement('div');
  sr.className='am-srow';
  sr.innerHTML=`<span class="sname">${subDisplay(label,g)}</span><span class="scount">${fmt(count)}</span>`;
  sr.addEventListener('click',e=>{ e.stopPropagation(); toggleToken({r:g,s:label}); });
  subRowEls[g+'|'+label]=sr;
  return sr;
}
allBtn.addEventListener('click',()=>setGenero(null));

/* "Expandir todos los subgéneros": abre TODAS las raíces y sus colas "Otros"
   -> se exploran todos los géneros y subgéneros (incluidos los de pocas bandas). */
let allExpanded=false;
const _nSub=GENEROS.reduce((a,g)=>a+(SUBGEN[g]||[]).length,0);   // total de subgéneros explorables
function setAllExpanded(open){
  allExpanded=open;
  GENEROS.forEach(g=>{ if((SUBGEN[g]||[]).length) setExpand(g, open); });
  genresEl.querySelectorAll('.am-subs-tail').forEach(t=>t.classList.toggle('open',open));
  genresEl.querySelectorAll('.am-srow.otros-group').forEach(o=>o.classList.toggle('open-otros',open));
  const btn=document.getElementById('am-expandall');
  if(btn) btn.textContent = open ? '⊖ Colapsar subgéneros' : `⊕ Ver los ${_nSub} subgéneros (17 raíces)`;
}
const _xb=document.getElementById('am-expandall');
if(_xb){ _xb.textContent=`⊕ Ver los ${_nSub} subgéneros (17 raíces)`;
  _xb.addEventListener('click',()=>setAllExpanded(!allExpanded)); }

/* ===== modo de selección: ÚNICO (default) vs COMBINAR (+) con switch O / Y ===== */
function updateModeUI(){
  const cb=document.getElementById('am-combine'), sw=document.getElementById('am-boolsw');
  if(cb) cb.classList.toggle('on', state.combine);
  if(sw) sw.style.display = state.combine ? 'inline-flex' : 'none';
  const or=document.getElementById('am-bool-or'), an=document.getElementById('am-bool-and');
  if(or) or.classList.toggle('on', state.boolOp==='OR');
  if(an) an.classList.toggle('on', state.boolOp==='AND');
}
(function(){
  const cb=document.getElementById('am-combine'); if(!cb) return;
  cb.addEventListener('click',()=>{
    state.combine=!state.combine;
    if(!state.combine && state.genFilters.length>1) state.genFilters=[state.genFilters[0]]; // colapsa a uno
    updateModeUI(); aplicarFiltro();
  });
  document.querySelectorAll('.am-boolbtn').forEach(b=>b.addEventListener('click',()=>{
    state.boolOp=b.dataset.op; updateModeUI(); aplicarFiltro();
  }));
  updateModeUI();
})();

/* ===== Buscador de géneros/subgéneros con autocompletado (alimenta la multiselección) =====
   Escribir "folk" -> aparecen el género Folk y todos los subgéneros que contienen "folk".
   Clic / Enter agrega (o quita) el token a la combinación. */
const GTOKENS=[];
GENEROS.forEach(g=>{
  GTOKENS.push({r:g,s:null,label:g,sub:false,count:generoTotales[g]||0});
  (SUBGEN[g]||[]).forEach(([lbl,cnt])=>{ if(!subEsOtros(lbl,g)) GTOKENS.push({r:g,s:lbl,label:subDisplay(lbl,g),sub:true,count:cnt||0}); });
});
const gIn=document.getElementById('am-gsearch');
const gDrop=document.getElementById('am-gdrop');
const gClear=document.getElementById('am-gsearch-clear');
let gItems=[], gActive=-1;
function gClose(){ gDrop.classList.remove('show'); gDrop.innerHTML=''; gItems=[]; gActive=-1; gIn.setAttribute('aria-expanded','false'); }
function gQuery(q){
  q=_norm(q);
  const out=GTOKENS.filter(t=> _norm(t.label).includes(q) || _norm(t.r).includes(q));
  out.sort((a,b)=> (a.sub-b.sub) || (b.count-a.count));   // raíces primero, luego por nº de bandas
  return out.slice(0,12);
}
function gMark(){ gDrop.querySelectorAll('.am-sug').forEach((x,k)=>x.classList.toggle('active',k===gActive)); }
function gRender(){
  if(!gItems.length){ gDrop.innerHTML='<div class="am-search-note">Sin coincidencias</div>'; gDrop.classList.add('show'); gIn.setAttribute('aria-expanded','true'); return; }
  gDrop.innerHTML=gItems.map((t,i)=>{
    const on=isTokActive(t.r,t.s);
    return `<div class="am-sug${i===gActive?' active':''}${on?' on':''}" role="option" data-i="${i}">`+
      `<span class="am-sug-tag ${t.sub?'banda':'pais'}">${t.sub?'Subg.':'Género'}</span>`+
      `<span class="am-sug-main">${_esc(t.label)}</span>`+
      (t.sub?`<span class="am-sug-sub">· ${_esc(t.r)}</span>`:'')+
      `<span class="am-sug-count">${on?'✓ ':''}${fmt(t.count)}</span></div>`;
  }).join('');
  gDrop.classList.add('show'); gIn.setAttribute('aria-expanded','true');
  gDrop.querySelectorAll('.am-sug').forEach(el=>{
    el.addEventListener('mousedown',e=>{ e.preventDefault(); const t=gItems[+el.dataset.i];
      if(t){ toggleToken({r:t.r,s:t.s}); gRender(); gIn.focus(); } });
    el.addEventListener('mousemove',()=>{ gActive=+el.dataset.i; gMark(); });
  });
}
function gRun(){
  const q=gIn.value.trim();
  gClear.style.display=q?'block':'none';
  if(!q){ gClose(); return; }
  gItems=gQuery(q); gActive=gItems.length?0:-1; gRender();
}
gIn.addEventListener('input',gRun);
gIn.addEventListener('focus',()=>{ if(gIn.value.trim()) gRun(); });
gIn.addEventListener('keydown',e=>{
  if(e.key==='ArrowDown'){ e.preventDefault(); if(gItems.length){ gActive=(gActive+1)%gItems.length; gMark(); } }
  else if(e.key==='ArrowUp'){ e.preventDefault(); if(gItems.length){ gActive=(gActive-1+gItems.length)%gItems.length; gMark(); } }
  else if(e.key==='Enter'){ e.preventDefault(); const t=gItems[gActive]||gItems[0];
    if(t){ toggleToken({r:t.r,s:t.s}); gIn.value=''; gClear.style.display='none'; gClose(); } }
  else if(e.key==='Escape'){ if(gDrop.classList.contains('show')) gClose(); else { gIn.value=''; gClear.style.display='none'; } }
});
gClear.addEventListener('click',()=>{ gIn.value=''; gClear.style.display='none'; gClose(); gIn.focus(); });
document.addEventListener('click',e=>{ const w=document.querySelector('.am-gsearch-wrap'); if(w && !w.contains(e.target)) gClose(); });

function setExpand(g,open){
  if(open) expanded.add(g); else expanded.delete(g);
  const w=subWrapEls[g], r=rowEls[g];
  if(w) w.classList.toggle('open',open);
  if(r) r.classList.toggle('expanded',open);
}
function toggleExpand(g){ setExpand(g,!expanded.has(g)); }

/* ---- gestión de la combinación de tokens ---- */
function addToken(t){ if(!_hasTok(t)) state.genFilters.push({r:t.r,s:t.s||null}); }
function removeToken(t){ state.genFilters=state.genFilters.filter(x=>!_sameTok(x,t)); }
function toggleToken(t){
  if(state.combine){                                  // COMBINAR: acumula (multi)
    if(_hasTok(t)) removeToken(t); else { addToken(t); if(t.s) setExpand(t.r,true); }
  }else{                                              // ÚNICO: reemplaza (clic en el activo -> limpia)
    if(state.genFilters.length===1 && _sameTok(state.genFilters[0],t)) state.genFilters=[];
    else { state.genFilters=[{r:t.r,s:t.s||null}]; if(t.s) setExpand(t.r,true); }
  }
  aplicarFiltro();
}
function clearGenFilters(){ state.genFilters=[]; aplicarFiltro(); }

/* compat: la lista/treemap/búsqueda y el hook de tests siguen usando estos nombres.
   toggle* alternan en la combinación; set* REEMPLAZAN por un único token (selección simple). */
function toggleGenero(g){ toggleToken({r:g,s:null}); }
function toggleSubgenero(g,key){ toggleToken({r:g,s:key}); }
function setGenero(g){ if(g==null) clearGenFilters(); else { state.genFilters=[{r:g,s:null}]; aplicarFiltro(); } }
function setSubgenero(g,key){ state.genFilters=[{r:g,s:key}]; setExpand(g,true); aplicarFiltro(); }

/* mantiene state.genero/subgenero como ESPEJO del filtro cuando hay 0 ó 1 token,
   para que todo el código de selección simple siga funcionando sin cambios. */
function syncSingleFromFilters(){
  if(state.genFilters.length===1){ state.genero=state.genFilters[0].r; state.subgenero=state.genFilters[0].s; }
  else { state.genero=null; state.subgenero=null; }
}

/* contador de arriba en modo COMBINAR: misma cuenta real que el panel (≈destacadas, o exacto tras Explorar) */
function updateComboKPI(){
  if(!(state.combine && state.genFilters.length)) return;
  const focusEl=document.getElementById('kpi-focus'), focusL=document.getElementById('kpi-focus-l'), statusEl=document.getElementById('am-status');
  const N=filterMatchCount(), full=!!comboFullByCountry, op=state.boolOp==='AND'?'cumplen TODOS':'cumplen ALGUNO';
  focusEl.textContent=(full?'':'≈ ')+fmt(N); focusEl.classList.add('hot'); focusEl.title=comboLabel();
  focusL.textContent=comboLabel();
  statusEl.innerHTML=`Combinar (${state.boolOp==='AND'?'Y':'O'}) · <b>${_esc(comboLabel())}</b> <span style="color:var(--bone-dim)">· ${full?'':'≈ '}${fmt(N)} ${op}${full?'':' (destacadas)'}</span>`;
}

/* aplica el estado de filtro (raíz o subgénero) a TODO: lista, KPIs, globo, pines, ficha */
function aplicarFiltro(){
  syncSingleFromFilters();                          // espeja genero/subgenero si hay 0 ó 1 token
  const g=state.genero, sk=state.subgenero, n=state.genFilters.length, combo=state.combine && n>=1;
  // resaltado en la lista (TODOS los tokens activos)
  Object.entries(rowEls).forEach(([k,el])=>el.classList.toggle('active', isRootActive(k)));
  Object.entries(subRowEls).forEach(([k,el])=>{   // k = "root|subLabel"
    const i=k.indexOf('|'); const r=k.slice(0,i), s=k.slice(i+1);
    el.classList.toggle('active', isTokActive(r,s));
  });
  allBtn.classList.toggle('muted', n>0);
  renderChips();
  // KPIs + status
  const focusEl=document.getElementById('kpi-focus');
  const focusL=document.getElementById('kpi-focus-l');
  const statusEl=document.getElementById('am-status');
  focusEl.title='';
  if(combo){
    updateComboKPI();                                // MISMA fuente que el panel (bandas reales)
  }else if(sk){
    const disp=subDisplay(sk,g);
    focusEl.textContent=disp; focusEl.classList.add('hot');
    focusL.textContent=fmt(subCountGlobal(sk,g))+' bandas';
    statusEl.innerHTML=`Filtro · <b>${g}</b> › <b>${disp}</b>`;
  }else if(g){
    focusEl.textContent=g; focusEl.classList.add('hot');
    focusL.textContent=fmt(generoTotales[g])+' bandas';
    statusEl.innerHTML=`Filtro activo · <b>${g}</b>`;
  }else{
    focusEl.textContent='Todos';
    focusL.textContent='En foco';
    statusEl.innerHTML=`Mostrando <b>todos</b> los géneros`;
  }
  recompute();
  if(cityPins.length) recomputeCityPins();        // pines de ciudad respetan el filtro
  updateTree();
  if(state.pais){ const p=PAISES.find(x=>x.code===state.pais); if(p) renderFicha(p); }
  else updateRightView();                          // sin país: treemap o resultados de la combinación
  if(isMobile()){ if(state.pais) openRightSheet(); }
  updateClearBtn();
}

/* ---- chips de filtros activos (encima de la lista de géneros) ---- */
function renderChips(){
  const el=document.getElementById('am-genchips'); if(!el) return;
  if(!state.genFilters.length){ el.innerHTML=''; el.classList.remove('show'); return; }
  el.classList.add('show');
  const chips=state.genFilters.map((t,i)=>
    `<span class="am-chip${t.s?' sub':''}" title="${_esc(t.s?(t.r+' › '+subDisplay(t.s,t.r)):t.r)}">`+
      `<span class="cx-l">${_esc(t.s?subDisplay(t.s,t.r):t.r)}</span>`+
      `<button class="am-chipx" data-i="${i}" aria-label="Quitar">✕</button></span>`).join('');
  el.innerHTML = chips + (state.genFilters.length>1
    ? `<button class="am-chipclear" id="am-chipclear">limpiar (${state.genFilters.length})</button>` : '');
  el.querySelectorAll('.am-chipx').forEach(b=>b.addEventListener('click',e=>{
    e.stopPropagation(); const t=state.genFilters[+b.dataset.i]; if(t){ removeToken(t); aplicarFiltro(); }
  }));
  const cc=document.getElementById('am-chipclear'); if(cc) cc.addEventListener('click',clearGenFilters);
}

/* ---- panel derecho sin país: treemap (sin filtro) o lista de resultados (con filtro) ---- */
function updateRightView(){
  if(state.pais) return;                            // si hay ficha abierta, manda la ficha
  const has=state.genFilters.length>0;
  const cv=document.getElementById('am-comboview');
  treeView.style.display = has?'none':'flex';
  if(cv) cv.style.display = has?'flex':'none';
  if(has){
    renderComboResults();
    rhead.querySelector('h2').textContent='Resultados por género';
    rhead.querySelector('p').textContent = state.combine
      ? 'Bandas destacadas que cumplen la combinación. Clic en una púa para abrir un país.'
      : 'Bandas destacadas del género. Clic en una púa para abrir un país.';
  }else{
    rhead.querySelector('h2').textContent='El mundo por género';
    rhead.querySelector('p').textContent='Tamaño = nº de bandas. Clic para filtrar.';
  }
}

/* lista GLOBAL de bandas destacadas (top_bandas de cada país) que cumplen el filtro.
   Usa la misma bandRow que las otras listas -> bandera + botón globo + accesos. */
let comboShown=[];            // lista actual del panel de resultados (destacadas o completa)
let comboFullLoaded=false;    // ¿ya se cargó la lista completa para el filtro actual?
function comboFilterSig(){ return state.genFilters.map(t=>t.r+'|'+(t.s||'')).join('&'); }

/* pinta la lista de resultados aplicando el buscador por nombre */
function paintComboList(){
  const dom=document.getElementById('am-combobands');
  const note=document.getElementById('am-combonote');
  const search=document.getElementById('am-combo-search');
  if(!dom) return;
  const q=(search&&search.value||'').trim().toLowerCase();
  const list=q ? comboShown.filter(b=>(b.n||'').toLowerCase().includes(q)) : comboShown;
  const shown=list.slice(0,BAND_CAP);
  let empty;
  if(q) empty='<div class="am-combo-empty">Sin bandas con ese nombre.</div>';
  else if(comboFullLoaded) empty='<div class="am-combo-empty">Sin coincidencias: ninguna banda cumple el filtro.</div>'; // N=0 REAL
  else empty='<div class="am-combo-empty">Ninguna <b>destacada</b> cumple — tocá «Explorar TODAS» para buscar en todas las bandas.</div>';
  dom.innerHTML = shown.length ? shown.map(bandRow).join('') : empty;
  dom.scrollTop=0; wireBandActions(dom);
  if(note){
    if(list.length>BAND_CAP) note.textContent=`Mostrando ${fmt(BAND_CAP)} de ${fmt(list.length)} — usá el buscador para acotar.`;
    else if(comboFullLoaded) note.textContent=`${fmt(comboShown.length)} bandas que cumplen el filtro (TODAS).`;
    else note.textContent='Muestra de destacadas (top por país). “Explorar TODAS” = lista completa.';
  }
}

/* panel de resultados: MISMA lógica que el contador y el globo (single / O / Y).
   Por defecto = destacadas; "Explorar TODAS" carga la lista completa (y vuelve EXACTOS contador+globo). */
function renderComboResults(){
  const headEl=document.getElementById('am-comboh');
  const search=document.getElementById('am-combo-search');
  const allBtn=document.getElementById('am-combo-all');
  const lbl=comboLabel();
  comboFullLoaded=false; comboFullByCountry=null; comboFullTotal=0;   // nuevo filtro -> sin "completo"
  const hits=[];
  PAISES.forEach(p=>{ (p.top_bandas||[]).forEach(b=>{
    if(bandMatchCombo(b.roots, b.sub)) hits.push({n:b.nombre,u:b.ma_url,c:b.ciudad,code:p.code,r:b.roots});
  }); });
  hits.sort((a,b)=> ((a.n||'').toLowerCase()>(b.n||'').toLowerCase()?1:-1));
  comboShown=hits;
  if(headEl) headEl.innerHTML = `<b>${_esc(lbl)}</b> <span class="cbc">${hits.length?fmt(hits.length)+' destacadas':'0 destacadas'}</span>`;
  if(search){ search.style.display='block'; search.value=''; search.oninput=paintComboList; }
  paintComboList();
  // países relevantes para cargar (Y: con TODOS los géneros; O: con ALGUNO)
  const relevant=PAISES.filter(p=> (state.combine && state.boolOp==='AND')
      ? state.genFilters.every(t=>tokCountPais(p,t)>0)
      : state.genFilters.some(t=>tokCountPais(p,t)>0));
  if(allBtn){
    allBtn.style.display=relevant.length?'block':'none'; allBtn.disabled=false;
    allBtn.textContent=`▾ Explorar TODAS las bandas de ${lbl}`;
    allBtn.onclick=()=>loadAllComboBands(relevant);
  }
}

/* carga TODAS las bandas que cumplen (pool lazy) y deja EXACTOS panel + contador + globo + pines */
async function loadAllComboBands(relevant){
  const allBtn=document.getElementById('am-combo-all');
  const sig=comboFilterSig();
  const total=relevant.length; let done=0; const out=[]; const byC={};
  allBtn.disabled=true;
  const queue=relevant.slice();
  async function worker(){
    while(queue.length){
      if(sig!==comboFilterSig()) return;          // el filtro cambió mientras cargaba
      const p=queue.shift();
      try{ const all=await loadBandas(p.code); let c=0;
        all.forEach(b=>{ if(bandMatchCombo(b.r,b.s)){ out.push({n:b.n,u:b.u,c:b.c,code:p.code}); c++; } });
        if(c) byC[p.code]=c;
      }catch(e){}
      done++; allBtn.textContent=`Cargando… ${done}/${total} países`;
    }
  }
  await Promise.all(Array.from({length:Math.min(6,total)}, worker));
  if(sig!==comboFilterSig()) return;               // descartar si cambió el filtro
  out.sort((a,b)=> ((a.n||'').toLowerCase()>(b.n||'').toLowerCase()?1:-1));
  comboShown=out; comboFullLoaded=true; comboFullByCountry=byC; comboFullTotal=out.length;
  const headEl=document.getElementById('am-comboh');
  if(headEl) headEl.innerHTML=`<b>${_esc(comboLabel())}</b> <span class="cbc">${out.length?fmt(out.length)+' bandas (todas)':'sin coincidencias'}</span>`;
  allBtn.style.display='none';
  paintComboList();
  recompute(); if(cityPins.length) recomputeCityPins(); updateTree();   // globo/pines EXACTOS
  updateComboKPI();                                                      // contador EXACTO
}

/* carga un <script> una sola vez y devuelve una promesa (para diferir libs no críticas al globo) */
const _scriptP={};
function loadScriptOnce(src){
  if(_scriptP[src]) return _scriptP[src];
  return _scriptP[src]=new Promise((res,rej)=>{
    const s=document.createElement('script'); s.src=src; s.async=true;
    s.onload=()=>res(); s.onerror=()=>rej(new Error('no se pudo cargar '+src));
    document.head.appendChild(s);
  });
}

/* ---- treemap (ECharts) — DIFERIDO: la lib (~269KB) carga sola cuando el árbol entra en viewport ---- */
let treeChart=null;
const palette=["#c8341f","#d8521f","#e07a1e","#e89020","#c9a227","#b88a1f",
               "#9a7c4a","#7d8590","#8a9099","#6f7680","#a0561a","#5f6670"];
function treeData(){
  return GENEROS.map((g,i)=>({
    name:g, value:generoTotales[g],
    itemStyle:{
      color:palette[i%palette.length],
      borderColor:'#08080a',borderWidth:2,
      opacity: state.genFilters.length? (isRootActive(g)?1:0.28) : 1,
      borderColorSaturation: isRootActive(g)?0.9:undefined
    }
  }));
}
function treeOption(){
  return {
    backgroundColor:'transparent',
    series:[{
      type:'treemap',roam:false,nodeClick:false,breadcrumb:{show:false},
      width:'100%',height:'100%',top:6,left:6,right:6,bottom:6,
      itemStyle:{gapWidth:2},
      label:{show:true,formatter:p=>p.name+'\n'+fmt(p.value),
             color:'#0d0b0a',fontFamily:'Oswald',fontWeight:500,fontSize:12,
             lineHeight:15,textShadowColor:'rgba(255,255,255,0.25)',textShadowBlur:1},
      data:treeData()
    }]
  };
}
function updateTree(){ if(treeChart) treeChart.setOption(treeOption()); }
function initTreeChart(){
  if(treeChart) return Promise.resolve();
  return loadScriptOnce('vendor/echarts.min.js').then(()=>{
    if(typeof echarts==='undefined') throw new Error('ECharts no cargó');
    treeChart=echarts.init(document.getElementById('am-tree'));
    treeChart.setOption(treeOption());
    treeChart.on('click',p=>{ if(p.name && GENEROS.includes(p.name)) toggleGenero(p.name); });
  }).catch(e=>console.warn('Árbol del metal: ECharts no disponible —',e.message));
}
/* dispara la carga de ECharts cuando "El árbol del metal" se acerca al viewport */
(function(){
  const el=document.getElementById('am-tree'); if(!el) return;
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver((ents,obs)=>{
      if(ents.some(e=>e.isIntersecting)){ obs.disconnect(); initTreeChart(); }
    },{rootMargin:'300px'});
    io.observe(el);
  }else{ initTreeChart(); }   // sin IO -> carga directa
})();

/* ---- detalle país ---- */
const detailEl=document.getElementById('am-detail');
const treeView=document.getElementById('am-tree-view');
const rhead=document.getElementById('am-rhead');
/* ---- MÓVIL: bottom sheets (Géneros / El mundo / Ficha) ---- */
const isMobile=()=>window.matchMedia('(max-width:768px)').matches;
const leftCol=document.querySelector('.am-col.left');
const rightCol=document.querySelector('.am-col.right');
const backdrop=document.getElementById('am-backdrop');
function closeSheets(){ leftCol.classList.remove('sheet-open'); rightCol.classList.remove('sheet-open'); backdrop.classList.remove('show'); }
function openLeftSheet(){ closeSheets(); leftCol.classList.add('sheet-open'); backdrop.classList.add('show'); }
function openRightSheet(){ closeSheets(); rightCol.classList.add('sheet-open'); backdrop.classList.add('show'); }
const mobFichaBtn=document.getElementById('mob-ficha');
function updateMobNav(){ mobFichaBtn.style.display = state.pais ? 'flex' : 'none'; }  // "Ficha" visible dentro de un país
/* Muestra el treemap SIN perder el país (la ficha se conserva en memoria/estado) */
function mostrarMundoMovil(){
  detailEl.classList.remove('show');
  const has=state.genFilters.length>0;
  treeView.style.display=has?'none':'flex';
  const cv=document.getElementById('am-comboview'); if(cv) cv.style.display=has?'flex':'none';
  if(has){ renderComboResults();
    rhead.querySelector('h2').textContent='Resultados por género';
    rhead.querySelector('p').textContent='Bandas que cumplen el filtro. Tocá una púa para abrir un país.';
  }else{
    rhead.querySelector('h2').textContent='El mundo por género';
    rhead.querySelector('p').textContent='Tamaño = nº de bandas. Clic para filtrar.';
  }
  openRightSheet();
}
/* Reabre la ficha con el ESTADO ACTUAL (país + género filtrado + ciudad) */
function mostrarFichaMovil(){
  if(state.pais){ const p=PAISES.find(x=>x.code===state.pais); if(p) renderFicha(p); openRightSheet(); }
  else mostrarMundoMovil();
}
document.getElementById('mob-gen').addEventListener('click',openLeftSheet);
mobFichaBtn.addEventListener('click',mostrarFichaMovil);
document.getElementById('mob-world').addEventListener('click',mostrarMundoMovil);
backdrop.addEventListener('click',closeSheets);
document.querySelectorAll('[data-sheet-close]').forEach(b=>b.addEventListener('click',closeSheets));

document.getElementById('am-back').addEventListener('click',()=>{ cerrarDetalle(); if(isMobile()) closeSheets(); });
document.getElementById('d-bsearch').addEventListener('input',function(){
  const q=this.value.trim().toLowerCase(), base=this._all||[];
  pintarBandas(q ? base.filter(b=>(b.n||'').toLowerCase().includes(q)) : base);
});

/* ===== lista COMPLETA de bandas por país (carga lazy + buscador) ===== */
const BAND_CAP = 400;                 // tope de filas en el DOM (rendimiento)
const bandCache = {};                 // code -> array completo [{n,c,u,r}]
let curBandList = [];                 // lista mostrada actualmente

/* íconos inline (sin imágenes externas), heredan color via fill:currentColor */
const _SVG_MA='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 2H7a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1h-1v13l-2.5-1.8L13 16V2zm0 16H7a1 1 0 0 0 0 2h11v-2z"/></svg>';
const _SVG_SPOTIFY='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.623.623 0 0 1-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.622.622 0 1 1-.277-1.215c3.809-.871 7.077-.496 9.713 1.115.293.18.386.563.206.857zm1.223-2.722a.78.78 0 0 1-1.072.257c-2.687-1.652-6.785-2.131-9.965-1.166a.78.78 0 1 1-.452-1.493c3.632-1.102 8.147-.568 11.234 1.328a.78.78 0 0 1 .256 1.073zm.105-2.835c-3.223-1.914-8.54-2.09-11.618-1.156a.935.935 0 1 1-.542-1.79c3.532-1.072 9.404-.866 13.115 1.338a.936.936 0 0 1-.955 1.609z"/></svg>';
const _SVG_YT='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>';
const _SVG_GLOBE='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-2.6a15.7 15.7 0 0 0-1.2-3.3A8 8 0 0 1 18.9 8zM12 4.1c.8 1 1.4 2.4 1.8 3.9h-3.6c.4-1.5 1-2.9 1.8-3.9zM4.3 14a8 8 0 0 1 0-4h3a17.6 17.6 0 0 0 0 4h-3zm.8 2h2.6c.3 1.2.7 2.3 1.2 3.3A8 8 0 0 1 5.1 16zm2.6-8H5.1a8 8 0 0 1 3.8-3.3C8.4 5.7 8 6.8 7.7 8zM12 19.9c-.8-1-1.4-2.4-1.8-3.9h3.6c-.4 1.5-1 2.9-1.8 3.9zm2.2-5.9H9.8a15.6 15.6 0 0 1 0-4h4.4a15.6 15.6 0 0 1 0 4zm.9 5.3c.5-1 .9-2.1 1.2-3.3h2.6a8 8 0 0 1-3.8 3.3zm1.6-5.3a17.6 17.6 0 0 0 0-4h3a8 8 0 0 1 0 4h-3z"/></svg>';
function _esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
/* bandera/código del país de origen de la banda (discreto, look gótico); cae a código si falla la imagen */
function bandFlag(code){
  if(!code || code.length!==2) return '';
  const cc=_esc(code.toUpperCase());
  return `<span class="bflag" title="${cc}">${flagImg(code,11)}<span class="bcc">${cc}</span></span>`;
}
/* fila de banda: BANDERA + NOMBRE + ciudad + accesos (Globo, MA, Spotify, YouTube).
   data-* en el botón globo -> vuela el atlas a la banda. MA usa su página si hay ma_url. */
/* género de una banda para mostrar en su fila: roots (corto, siempre presente) visible,
   subgéneros (más específicos, desambiguan homónimos) en el title si están. */
function bandGenre(b){
  const roots=Array.isArray(b.r)?b.r.filter(Boolean):[];
  const subs =Array.isArray(b.s)?b.s.filter(x=>typeof x==='string'&&x):[];   // labels (no índices)
  if(!roots.length && !subs.length) return null;
  return { short: (roots.join(' · ') || subs.join(' · ')),
           full:  (subs.length? subs.join(', ') : roots.join(', ')) };
}
function bandRow(b){
  const n=b.n||b.nombre||'', c=b.c||b.ciudad||'', u=b.u||b.ma_url||'', code=b.code||b.cc||'';
  const ne=_esc(n), q=encodeURIComponent(n), ce=_esc(c);
  const g=bandGenre(b);
  const gen = g ? `<span class="bgen" title="${_esc(g.full)}">${_esc(g.short)}</span>` : '';
  const ma = u ? _esc(u) : 'https://www.metal-archives.com/search?searchString='+q+'&type=band_name';
  const spotify='https://open.spotify.com/search/'+q;
  const youtube='https://www.youtube.com/results?search_query='+q+'+metal';
  const flag = bandFlag(code);
  const city = c ? `<span class="bcity">${ce}</span>` : '';
  const play = `<span class="bplay">`+
    `<button type="button" class="bp globe" data-name="${ne}" data-code="${_esc(code)}" data-city="${ce}" title="Ir al globo: “${ne}”" aria-label="Ver “${ne}” en el globo">${_SVG_GLOBE}</button>`+
    `<a class="bp ma" href="${ma}" target="_blank" rel="noopener" title="“${ne}” en Metal Archives" aria-label="${ne} en Metal Archives">${_SVG_MA}</a>`+
    `<a class="bp sp" href="${spotify}" target="_blank" rel="noopener" title="Buscar “${ne}” en Spotify" aria-label="${ne} en Spotify">${_SVG_SPOTIFY}</a>`+
    `<a class="bp yt" href="${youtube}" target="_blank" rel="noopener" title="Buscar “${ne}” en YouTube" aria-label="${ne} en YouTube">${_SVG_YT}</a>`+
  `</span>`;
  return `<div class="am-band">${flag}<span class="bn" title="${ne}">${ne}</span>${gen}${city}${play}</div>`;
}
/* conecta el botón-globo de cada fila (los demás accesos son enlaces nativos) */
function wireBandActions(dom){
  dom.querySelectorAll('.bp.globe[data-name]').forEach(btn=>btn.addEventListener('click',e=>{
    e.preventDefault(); e.stopPropagation();
    const code=btn.dataset.code, name=btn.dataset.name, city=btn.dataset.city||'';
    if(!code) return;
    irABanda(name, code, city);
    if(isMobile()) openRightSheet();
  }));
}

/* ===== TV CRT: abrir/cerrar + selector de género (chips) + recarga del iframe ===== */
const TV_KEYS=Object.keys(YT_PLAYLISTS);
let tvGenre='GENERAL';
function tvLabel(k){ return k.charAt(0)+k.slice(1).toLowerCase(); }
function tvEmbedURL(k){ const id=YT_PLAYLISTS[k]; return id?`https://www.youtube.com/embed/videoseries?list=${id}&autoplay=1&rel=0`:''; }
function tvExtURL(k){ const id=YT_PLAYLISTS[k]; return id?`https://www.youtube.com/playlist?list=${id}`:'https://www.youtube.com/'; }
function _ytPlaceholder(id){ return !id || id.length<12 || /placeholder|xxxx|todo/i.test(id); }
function tvRenderChips(){
  const wrap=document.getElementById('am-tv-chips'); if(!wrap) return;
  wrap.innerHTML=TV_KEYS.map(k=>`<button class="am-tv-chip${k===tvGenre?' on':''}" data-k="${k}">${tvLabel(k)}</button>`).join('');
  wrap.querySelectorAll('.am-tv-chip').forEach(c=>c.addEventListener('click',()=>setTVGenre(c.dataset.k)));
}
function setTVGenre(key){
  tvGenre = YT_PLAYLISTS[key] ? key : 'GENERAL';
  tvRenderChips();
  const frame=document.getElementById('am-tv-frame'), no=document.getElementById('am-tv-noscreen'),
        ext=document.getElementById('am-tv-ext');
  if(_ytPlaceholder(YT_PLAYLISTS[tvGenre])){           // ID vacío/placeholder -> sin iframe roto
    if(frame){ frame.src='about:blank'; frame.style.display='none'; }
    if(no) no.classList.add('show');
  }else{
    if(no) no.classList.remove('show');
    if(frame){ frame.style.display='block'; frame.src=tvEmbedURL(tvGenre); }
  }
  if(ext) ext.href=tvExtURL(tvGenre);
  try{ localStorage.setItem('mg_tv_genre', tvGenre); }catch(e){}
}
/* RADIO independiente: se abre con el botón 📺, sigue sonando mientras explorás
   (nada la cierra al seleccionar países/bandas ni al filtrar). Mini/grande + arrastrable. */
let _tvLoaded=false;
function tvVisible(){ const tv=document.getElementById('am-tv'); return tv && tv.classList.contains('show'); }
function showTV(){
  const tv=document.getElementById('am-tv'); if(!tv) return;
  tv.classList.add('show');
  if(!_tvLoaded){ setTVGenre(tvGenre||'GENERAL'); _tvLoaded=true; }   // carga al abrir (default General)
  updateRadioBtn();
}
function hideTV(){
  const tv=document.getElementById('am-tv'); if(!tv) return;
  tv.classList.remove('show');
  const frame=document.getElementById('am-tv-frame'); if(frame) frame.src='about:blank';   // corta el audio
  _tvLoaded=false;
  updateRadioBtn();
}
function toggleTV(){ tvVisible()?hideTV():showTV(); }
function toggleTVSize(){
  const tv=document.getElementById('am-tv'); if(!tv) return;
  const big=tv.classList.toggle('big');
  try{ localStorage.setItem('mg_tv_big', big?'1':'0'); }catch(e){}
}
function updateRadioBtn(){
  const b=document.getElementById('am-radio'); if(!b) return;
  b.classList.toggle('on', tvVisible());
}
/* botón 📺 + cerrar + agrandar/achicar + selección de chip persistida + ARRASTRE por la barra */
(function(){
  const tv=document.getElementById('am-tv'); if(!tv) return;
  const radio=document.getElementById('am-radio'); if(radio) radio.addEventListener('click',toggleTV);
  const x=document.getElementById('am-tv-close'); if(x) x.addEventListener('click',hideTV);
  const sz=document.getElementById('am-tv-size'); if(sz) sz.addEventListener('click',toggleTVSize);
  try{ if(localStorage.getItem('mg_tv_big')==='1') tv.classList.add('big'); var g=localStorage.getItem('mg_tv_genre'); if(g) tvGenre=g; }catch(e){}
  try{ var p=JSON.parse(localStorage.getItem('mg_tv_pos')||'null');
    if(p){ tv.style.left=p.x+'px'; tv.style.top=p.y+'px'; tv.style.right='auto'; } }catch(e){}
  // arrastre por la barra de título (no por el iframe)
  const bar=document.getElementById('am-tv-bar'); if(!bar) return;
  let drag=false, ox=0, oy=0;
  function clamp(x,y){ const r=tv.getBoundingClientRect();
    return [Math.max(4,Math.min(window.innerWidth-r.width-4,x)), Math.max(56,Math.min(window.innerHeight-40,y))]; }
  bar.addEventListener('pointerdown',e=>{ if(e.target.closest('button,a')) return;
    drag=true; const r=tv.getBoundingClientRect(); ox=e.clientX-r.left; oy=e.clientY-r.top;
    try{bar.setPointerCapture(e.pointerId);}catch(_){} e.preventDefault(); });
  bar.addEventListener('pointermove',e=>{ if(!drag) return;
    const xy=clamp(e.clientX-ox, e.clientY-oy);
    tv.style.left=xy[0]+'px'; tv.style.top=xy[1]+'px'; tv.style.right='auto'; });
  function end(e){ if(!drag) return; drag=false; try{bar.releasePointerCapture(e.pointerId);}catch(_){}
    const r=tv.getBoundingClientRect(); try{ localStorage.setItem('mg_tv_pos',JSON.stringify({x:Math.round(r.left),y:Math.round(r.top)})); }catch(_){}}
  bar.addEventListener('pointerup',end); bar.addEventListener('pointercancel',end);
})();
function pintarBandas(list){
  curBandList = list;
  const dom=document.getElementById('d-bands'), note=document.getElementById('d-bnote');
  const shown=list.slice(0,BAND_CAP);
  dom.innerHTML = shown.length ? shown.map(bandRow).join('')
                               : '<span class="am-cities" style="padding:8px 10px">—</span>';
  dom.scrollTop=0;
  wireBandActions(dom);
  if(list.length>BAND_CAP){ note.style.display='block';
    note.textContent=`Mostrando ${fmt(BAND_CAP)} de ${fmt(list.length)} — usá el buscador para acotar.`; }
  else note.style.display='none';
}
async function loadBandas(code){
  if(bandCache[code]) return bandCache[code];
  const d=await loadCityFile(code), leg=d.subleg||[], flat=[];   // mismo archivo que los pines
  const push=(c,b)=>flat.push({n:b.n,u:b.u,r:b.r,c:c.nombre,code:code,s:(b.s||[]).map(i=>leg[i])});  // s -> claves
  (d.ciudades||[]).forEach(c=>(c.bandas||[]).forEach(b=>push(c,b)));
  (d.otras||[]).forEach(c=>(c.bandas||[]).forEach(b=>push(c,b)));
  flat.sort((a,b)=>((a.n||'').toLowerCase()>(b.n||'').toLowerCase()?1:-1));
  return (bandCache[code]=flat);
}
function renderBandsSection(p, g){
  // si hay una ciudad seleccionada (pin), muestra sus bandas
  if(state.ciudad && cityCountry===p.code){
    const city=cityList.find(c=>c.nombre===state.ciudad);
    if(city){ renderCityBands(p, city, g); return; }
  }
  const sk=state.subgenero, combo=state.combine;
  const search=document.getElementById('d-bsearch'), moreBtn=document.getElementById('d-ball');
  const disp = combo ? comboLabel() : sk ? subDisplay(sk,g) : g;
  document.getElementById('d-bands-h').textContent = disp ? `Bandas de ${disp} en ${p.name}` : 'Bandas';
  search.style.display='none'; search.value=''; search._all=null;
  let sample=(p.top_bandas||[]).map(b=>({n:b.nombre,c:b.ciudad,u:b.ma_url,code:p.code,r:b.roots,s:b.sub||[]}));
  if(combo) sample=sample.filter(b=>bandMatchCombo(b.r,b.s));
  else if(sk) sample=sample.filter(b=>(b.s||[]).includes(sk));
  else if(g) sample=sample.filter(b=>(b.r||[]).includes(g));
  pintarBandas(sample);
  if(combo){
    // top_bandas es sólo una muestra -> siempre ofrecé cargar la lista exacta completa del país
    moreBtn.style.display='block'; moreBtn.disabled=false;
    moreBtn.textContent = `Ver todas las que cumplen ${disp}`;
    moreBtn.onclick=()=>verTodas(p);
    return;
  }
  const N = sk ? subCountPais(p,sk,g) : g ? ((p.g&&p.g[g])||0) : (p.total||0);
  if(N>sample.length){
    moreBtn.style.display='block'; moreBtn.disabled=false;
    moreBtn.textContent = disp ? `Ver las ${fmt(N)} bandas de ${disp}` : `Ver todas (${fmt(N)})`;
    moreBtn.onclick=()=>verTodas(p);
  } else moreBtn.style.display='none';
}
function renderCityBands(p, city, g){
  const search=document.getElementById('d-bsearch'), moreBtn=document.getElementById('d-ball');
  const sk=state.subgenero;
  const combo=state.combine;
  let bandas=(city.bandas||[]).slice();
  if(combo) bandas=bandas.filter(bandMatchComboIdx);
  else if(sk){ const idx=citySubleg.indexOf(sk); bandas=bandas.filter(b=>(b.s||[]).indexOf(idx)!==-1); }
  else if(g) bandas=bandas.filter(b=>(b.r||[]).includes(g));
  // a objetos de display con país+ciudad (para bandera + botón globo en cada fila)
  const display=bandas.map(b=>({n:b.n,u:b.u,c:city.nombre,code:p.code,r:b.r,s:(b.s||[]).map(i=>citySubleg[i])}));
  const disp = combo ? comboLabel() : sk ? subDisplay(sk,g) : g;
  document.getElementById('d-bands-h').innerHTML=
    `Bandas de ${city.nombre}${disp?` · ${disp}`:''} <span class="bcount">${fmt(display.length)}</span>`+
    ` <a id="d-cityclear" class="d-cityclear">↩ todo el país</a>`;
  moreBtn.style.display='none';
  search._all=display; search.value='';
  search.style.display = display.length>20 ? 'block' : 'none';
  pintarBandas(display);
  const cl=document.getElementById('d-cityclear');
  if(cl) cl.onclick=()=>{ state.ciudad=null; recomputeCityPins(); renderFicha(p); showContextCard(contextForPais(p)); };  // vuelve al NIVEL país
}
/* subtítulo de la ficha (code · nivel): si hay una localidad SELECCIONADA la muestra;
   si no, deja claro que es TODO el país (no una ciudad por defecto). */
function setFichaCiudadLabel(p){
  const fl=document.getElementById('d-flag'); if(!fl||!p) return;
  if(state.ciudad && cityCountry===p.code) fl.textContent=p.code+' · '+state.ciudad;
  else fl.textContent=p.code+' · todo el país';
}
/* ===== FICHA DE CONTEXTO: reloj local + clima (Open-Meteo, keyless/CORS) + stat de metal (datos ya cargados) ===== */
function topGenre(g){ const e=Object.entries(g||{}).sort((a,b)=>b[1]-a[1])[0]; return e?e[0]:null; }
function ctxWeatherEmoji(code,isDay){
  code=+code;
  if(code===0) return isDay? '☀️':'🌙';
  if(code>=1 && code<=3) return '⛅';
  if(code===45||code===48) return '🌫️';
  if(code>=51 && code<=67) return '🌧️';
  if(code>=71 && code<=77) return '❄️';
  if(code>=80 && code<=82) return '🌦️';
  if(code>=95 && code<=99) return '⛈️';
  return '⛅';
}
const _wxCache={};
function ctxFetchWeather(lat,lng){
  const key=(+lat).toFixed(2)+','+(+lng).toFixed(2), c=_wxCache[key];
  if(c && Date.now()-c.t < 600000) return Promise.resolve(c.data);   // cache TTL 10 min
  const url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&timezone=auto`;
  return fetch(url).then(r=>r.json()).then(d=>{ _wxCache[key]={data:d,t:Date.now()}; return d; });
}
let ctxClockTimer=null, ctxReq=0;
function ctxStopClock(){ if(ctxClockTimer){ clearInterval(ctxClockTimer); ctxClockTimer=null; } }
function ctxStartClock(offsetSec){
  ctxStopClock();
  const el=document.getElementById('am-ctx-clock'); if(!el) return;
  const pad=n=>('0'+n).slice(-2);
  function tick(){ const utc=Date.now()+new Date().getTimezoneOffset()*60000; const d=new Date(utc+(offsetSec||0)*1000);
    el.textContent=pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds()); }
  tick(); ctxClockTimer=setInterval(tick,1000);
}
function hideContextCard(){ const c=document.getElementById('am-ctx'); if(c) c.classList.remove('show'); ctxStopClock(); ctxReq++; }
function ctxDefaultPos(){                              // SIEMPRE visible: limpia inline -> usa el default del CSS
  const c=document.getElementById('am-ctx'); if(!c) return;
  c.style.left=''; c.style.top=''; c.style.right=''; c.style.bottom='';
}
function showContextCard(o){
  const c=document.getElementById('am-ctx'); if(!c) return;
  const wasShown=c.classList.contains('show');
  document.getElementById('am-ctx-flag').innerHTML=flagImg(o.code,15);
  document.getElementById('am-ctx-name').textContent=o.name||'—';
  document.getElementById('am-ctx-bands').textContent=fmt(o.bandCount||0)+' bandas';
  document.getElementById('am-ctx-dom').textContent=o.domGenre||'—';
  c.classList.add('show');
  if(!wasShown) ctxDefaultPos();                       // al ABRIRSE (no al sólo actualizar) -> posición por defecto, findable
  try{ c.classList.toggle('collapsed', localStorage.getItem('mg_ctx_collapsed')==='1'); }catch(e){}
  const _mb=document.getElementById('am-ctx-min'); if(_mb) _mb.textContent=c.classList.contains('collapsed')?'▸':'▾';
  // reloj + clima: UNA sola llamada. Si falla -> oculta clima+reloj y deja el resto (bandas/dominante).
  const wxRow=document.getElementById('am-ctx-wx'), clockRow=document.getElementById('am-ctx-clockrow');
  ctxStopClock();                                       // LIMPIA el intervalo anterior (no quedan viejos)
  document.getElementById('am-ctx-clock').textContent='—:—:—';
  wxRow.style.display='none'; if(clockRow) clockRow.style.display='flex';
  const lat=o.lat, lng=o.lng, myReq=++ctxReq;
  if(typeof lat==='number' && typeof lng==='number' && isFinite(lat) && isFinite(lng)){
    ctxFetchWeather(lat,lng).then(d=>{
      if(myReq!==ctxReq) return;                        // cambió de lugar mientras cargaba -> descartar
      const w=d && d.current_weather; if(!w) throw 0;
      document.getElementById('am-ctx-temp').textContent=Math.round(w.temperature)+'°C';
      document.getElementById('am-ctx-ico').textContent=ctxWeatherEmoji(w.weathercode, w.is_day);
      wxRow.style.display='flex';
      ctxStartClock(d.utc_offset_seconds);
    }).catch(()=>{ if(myReq===ctxReq){ wxRow.style.display='none'; if(clockRow) clockRow.style.display='none'; } });
  } else { if(clockRow) clockRow.style.display='none'; }
}
function contextForPais(p){ return {name:p.name, code:p.code, lat:p.lat, lng:p.lng, bandCount:total(p), domGenre:topGenre(p.g)}; }
function contextForCiudad(p, city){ return {name:city.nombre, code:p.code, lat:city.lat, lng:city.lng, bandCount:city.total, domGenre:topGenre(city.g)}; }
(function(){   // cerrar + colapsar + reubicar + arrastre de la ficha de contexto
  const c=document.getElementById('am-ctx'), head=document.getElementById('am-ctx-head'),
        x=document.getElementById('am-ctx-x'), mn=document.getElementById('am-ctx-min'),
        rs=document.getElementById('am-ctx-reset'); if(!c||!head) return;
  if(x) x.addEventListener('click',hideContextCard);
  if(mn) mn.addEventListener('click',e=>{ e.stopPropagation();
    const col=c.classList.toggle('collapsed'); mn.textContent=col?'▸':'▾';
    try{ localStorage.setItem('mg_ctx_collapsed',col?'1':'0'); }catch(_){}
  });
  if(rs) rs.addEventListener('click',e=>{ e.stopPropagation(); ctxDefaultPos(); });   // vuelve al default visible
  // arrastre (NO persiste posición: al reabrir vuelve al default findable)
  let drag=false, ox=0, oy=0;
  function clamp(x,y){ const r=c.getBoundingClientRect();
    return [Math.max(4,Math.min(window.innerWidth-r.width-4,x)), Math.max(56,Math.min(window.innerHeight-r.height-4,y))]; }
  head.addEventListener('pointerdown',e=>{ if(e.target.closest('button')) return; drag=true;
    const r=c.getBoundingClientRect(); ox=e.clientX-r.left; oy=e.clientY-r.top;
    try{head.setPointerCapture(e.pointerId);}catch(_){} e.preventDefault(); });
  head.addEventListener('pointermove',e=>{ if(!drag) return; const xy=clamp(e.clientX-ox,e.clientY-oy);
    c.style.left=xy[0]+'px'; c.style.top=xy[1]+'px'; c.style.right='auto'; c.style.bottom='auto'; });
  function end(e){ if(!drag) return; drag=false; try{head.releasePointerCapture(e.pointerId);}catch(_){} }
  head.addEventListener('pointerup',end); head.addEventListener('pointercancel',end);
  try{ localStorage.removeItem('mg_ctx_pos'); }catch(_){}   // descarta posiciones viejas "escondidas"
  // queda en el héroe y se desvanece al bajar al dashboard (reaparece arriba); no mientras se arrastra
  let _af=0;
  function syncAway(){ if(drag) return;
    c.classList.toggle('am-ctx-away', window.pageYOffset > window.innerHeight*0.6); }
  window.addEventListener('scroll',function(){ if(_af) return;
    _af=requestAnimationFrame(function(){ _af=0; syncAway(); }); }, {passive:true});
  syncAway();
})();

function seleccionarCiudad(city){
  state.ciudad=city.nombre;
  recomputeCityPins();                          // resalta el pin elegido
  const p=PAISES.find(x=>x.code===state.pais);
  if(p){ renderFicha(p); showContextCard(contextForCiudad(p, city)); }   // ficha + contexto de la localidad
  if(isMobile()) openRightSheet();              // móvil: sube la ficha de la ciudad
}
async function verTodas(p){
  const g=state.genero, sk=state.subgenero;
  const search=document.getElementById('d-bsearch'), moreBtn=document.getElementById('d-ball');
  moreBtn.disabled=true; moreBtn.textContent='Cargando…';
  let all;
  try{ all=await loadBandas(p.code); }
  catch(e){ moreBtn.disabled=false; moreBtn.textContent='No se pudo cargar — reintenta'; return; }
  if(state.pais!==p.code) return;              // cambió la ficha mientras cargaba
  const combo=state.combine;
  const list = combo ? all.filter(b=>bandMatchCombo(b.r,b.s))
             : sk ? all.filter(b=>(b.s||[]).includes(sk))
             : g ? all.filter(b=>(b.r||[]).includes(g)) : all;
  if(combo) document.getElementById('d-bands-h').textContent = `${fmt(list.length)} bandas de ${comboLabel()} en ${p.name}`;
  moreBtn.style.display='none';
  search._all=list;
  search.style.display = list.length>20 ? 'block' : 'none';
  pintarBandas(list);
}
function ciudadHTML(c){
  return c.bandas
    ? `<b>${c.nombre}</b> <span class="am-cnum">${fmt(c.bandas)}</span>`
    : `<b>${c.nombre}</b>`;
}

/* top ciudades del subgénero activo (escanea los pines/bandas ya cargados del país) */
function ciudadesPorSub(sk){
  const idx = citySubleg.indexOf(sk);
  if(idx<0 || !cityList.length) return null;          // país sin ese sub o aún sin cargar
  return cityList.map(c=>({nombre:c.nombre, bandas:cityCountSub(c, idx)}))
                 .filter(c=>c.bandas>0).sort((a,b)=>b.bandas-a.bandas).slice(0,8);
}
/* ===== NIVEL de desagregación: localidad seleccionada (pin/búsqueda) o país ===== */
function activeCityFor(p){
  if(state.ciudad && cityCountry===p.code && cityList && cityList.length)
    return cityList.find(c=>c.nombre===state.ciudad) || null;
  return null;
}
let SUBROOT=null;                               // mapa subgénero -> raíz (para agrupar por ciudad)
function subRootOf(label){
  if(!SUBROOT){ SUBROOT={}; for(const r in SUBGEN){ (SUBGEN[r]||[]).forEach(x=>{ SUBROOT[x[0]]=r; }); } }
  return SUBROOT[label];
}
/* [[sublabel,count]] de UNA ciudad para la raíz g (escanea las bandas de la ciudad) */
function cityCArr(city, g){
  const c={};
  (city.bandas||[]).forEach(b=>(b.s||[]).forEach(i=>{ const l=citySubleg[i]; if(l && subRootOf(l)===g) c[l]=(c[l]||0)+1; }));
  return Object.entries(c).sort((a,b)=>b[1]-a[1]);
}
/* DESAGREGACIÓN del país por localidad: cada ciudad con su conteo (según el filtro)
   y su género dominante; clic = desagregar (entrar a esa localidad). Reactivo al filtro. */
function renderLocalidades(p, g, sk, combo, disp, cH, cBox){
  const loaded = cityCountry===p.code && cityList && cityList.length;
  cH.textContent = disp ? `Localidades · ${disp}` : 'Localidades';
  if(!loaded){                                   // aún cargando el detalle por ciudad
    const cs=(g && p.g_ciudades && p.g_ciudades[g]) ? p.g_ciudades[g] : (p.ciudades||[]);
    cBox.innerHTML = `<div class="am-locnote">cargando desagregación por localidad…</div>`+
      (cs.length ? cs.slice(0,12).map(ciudadHTML).join(' · ') : '');
    return;
  }
  const val = c => combo ? cityCountCombo(c)
            : sk ? cityCountSub(c, citySubleg.indexOf(sk))
            : g ? (c.g[g]||0) : c.total;
  let rows = cityList.map(c=>({c, v:val(c), dom:(Object.entries(c.g||{}).sort((a,b)=>b[1]-a[1])[0]||[null])[0]}));
  if(g||sk||combo) rows=rows.filter(r=>r.v>0);
  rows.sort((a,b)=>b.v-a.v);
  if(!rows.length){ cBox.innerHTML=`<span style="color:var(--bone-dim)">sin localidades para ${_esc(disp)}</span>`; return; }
  const N=15, shown=rows.slice(0,N), vmax=Math.max(...shown.map(r=>r.v),1);
  cBox.innerHTML = `<div class="am-locnote">${fmt(rows.length)} localidades · clic para desagregar</div>`+
    shown.map(r=>{
      const name=_esc(r.c.nombre);
      const dom = (!g && !sk && !combo && r.dom) ? `<span class="lg">${_esc(r.dom)}</span>` : '';
      return `<div class="am-loc" data-city="${name}" title="Ver ${name}">`+
        `<span class="ln">${name}</span>${dom}`+
        `<span class="lb" style="width:${(r.v/vmax*100).toFixed(0)}%"></span>`+
        `<span class="lc">${fmt(r.v)}</span></div>`;
    }).join('') + (rows.length>N?`<div class="am-locnote">+${fmt(rows.length-N)} localidades más (usá el filtro o el globo)</div>`:'');
  cBox.querySelectorAll('.am-loc[data-city]').forEach(el=>el.onclick=()=>{
    const c=cityList.find(x=>x.nombre===el.dataset.city); if(c) seleccionarCiudad(c);
  });
}

function renderFicha(p){                         // pinta la ficha al NIVEL activo (país o localidad)
  const g = state.genero;                       // género raíz filtrado (o null)
  const sk = state.subgenero;                   // subgénero filtrado (o null)
  const combo = state.combine;     // combinación activa
  const disp = combo ? comboLabel() : sk ? subDisplay(sk,g) : g;
  const city = activeCityFor(p);                // localidad seleccionada (o null -> país)
  const scopeG = city ? (city.g||{}) : (p.g||{});   // géneros del NIVEL activo
  const scopeTotal = city ? city.total : total(p);
  const where = city ? city.nombre : p.name;
  document.getElementById('d-bigflag').innerHTML=flagImg(p.code,34);
  const fl=document.getElementById('d-flag');
  if(city){ document.getElementById('d-name').textContent=city.nombre;     // título = la localidad
            if(fl) fl.textContent=`${p.code} · ${p.name}`; }               // contexto = el país
  else { document.getElementById('d-name').textContent=p.name; setFichaCiudadLabel(p); }
  const ctxCity = city ? ` <span style="color:var(--bone-dim)">· de ${fmt(total(p))} en ${_esc(p.name)}</span>` : '';

  // --- conteo destacado, calculado al NIVEL activo (localidad o país) ---
  let countHtml;
  if(combo){
    const cv = city ? cityCountCombo(city) : countDestacadas(p);   // per-band REAL (ciudad exacta / país destacadas)
    if(city){
      countHtml = cv>0 ? `<b>${fmt(cv)}</b> banda${cv===1?'':'s'} de ${_esc(disp)} en ${_esc(where)}${ctxCity}`
                       : `<span style="color:var(--bone-dim)">sin bandas de ${_esc(disp)} en ${_esc(where)}</span>${ctxCity}`;
    }else{
      countHtml = cv>0 ? `≈ <b>${fmt(cv)}</b> destacada${cv===1?'':'s'} de ${_esc(disp)} `+
                          `<span style="color:var(--bone-dim)">· “ver todas” para el total · ${fmt(total(p))} en total</span>`
                       : `<span style="color:var(--bone-dim)">sin destacadas de ${_esc(disp)} ·</span> ${fmt(total(p))} en total`;
    }
  }else if(sk){
    const cs = city ? cityCountSub(city, citySubleg.indexOf(sk)) : subCountPais(p,sk,g);
    const more = city ? ctxCity : `<span style="color:var(--bone-dim)"> · ${fmt((p.g&&p.g[g])||0)} de ${g} · ${fmt(total(p))} en total</span>`;
    countHtml = `<b>${fmt(cs)}</b> banda${cs===1?'':'s'} de ${disp} en ${_esc(where)}${more}`;
  }else if(g){
    const cg=scopeG[g]||0;
    const more = city ? ctxCity : `<span style="color:var(--bone-dim)"> · ${fmt(total(p))} en total</span>`;
    countHtml = `<b>${fmt(cg)}</b> banda${cg===1?'':'s'} de ${g} en ${_esc(where)}${more}`;
  }else{
    countHtml = city ? `<b>${fmt(scopeTotal)}</b> bandas en ${_esc(where)}${ctxCity}`
                     : `<b>${fmt(scopeTotal)}</b> bandas registradas`;
  }
  document.getElementById('d-total').innerHTML=countHtml;

  // --- géneros dominantes del NIVEL activo (resalta los activos del filtro) ---
  let gs=Object.entries(scopeG).sort((a,b)=>b[1]-a[1]).slice(0,6);
  state.genFilters.forEach(t=>{ if(scopeG[t.r]!=null && !gs.some(e=>e[0]===t.r)) gs=gs.concat([[t.r,scopeG[t.r]]]); });
  const gmax=gs.length?Math.max(...gs.map(e=>e[1])):1;
  document.getElementById('d-genres').innerHTML=gs.map(([n,v])=>
    `<div class="am-drow${isRootActive(n)||n===g?' on':''}"><span class="n">${n}</span><span class="b" style="width:${(v/gmax*96).toFixed(0)}px"></span><span class="c">${fmt(v)}</span></div>`
  ).join('') || '<span class="am-cities">—</span>';

  // --- desglose de SUBGÉNEROS del NIVEL activo (top-8 + "Otros"); clic = filtra ---
  const subsec=document.getElementById('d-subsec'), subBox=document.getElementById('d-subs');
  const cArr = g ? (city ? cityCArr(city,g) : ((p.sub && p.sub[g]) || [])) : null;
  if(g && cArr && cArr.length){
    document.getElementById('d-subs-h').textContent=`Subgéneros de ${g}${city?' en '+city.nombre:''}`;
    const named=(SUBGEN[g]||[]).slice(0,8).map(x=>x[0]), nameSet=new Set(named);
    const cmap=new Map(cArr);
    let otros=0; cArr.forEach(([l,v])=>{ if(!nameSet.has(l)) otros+=v; });
    const rows=[];
    named.forEach(n=>{ if(cmap.has(n)) rows.push([n, cmap.get(n), true]); });   // top-8 presentes
    const activeTail = sk && !nameSet.has(sk) && cmap.has(sk);                  // sub raro activo
    if(activeTail){ rows.push([sk, cmap.get(sk), true]); otros-=cmap.get(sk); }
    if(otros>0) rows.push(['__otros__', otros, false]);
    const smax=Math.max(...rows.map(r=>r[1]),1);
    subBox.innerHTML=rows.map(([label,v,click])=>{
      const isO=label==='__otros__', on=!isO && label===sk;
      const attr=(click&&!isO)?` data-sub="${label.replace(/"/g,'')}" style="cursor:pointer"`:'';
      return `<div class="am-drow${on?' on':''}${isO?' otros':''}"${attr}>`+
        `<span class="n">${isO?'Otros':subDisplay(label,g)}</span>`+
        `<span class="b" style="width:${(v/smax*96).toFixed(0)}px"></span>`+
        `<span class="c">${fmt(v)}</span></div>`;
    }).join('');
    subBox.querySelectorAll('[data-sub]').forEach(el=>{ el.onclick=()=>toggleSubgenero(g, el.getAttribute('data-sub')); });
    subsec.style.display='block';
  }else{
    subsec.style.display='none';
  }

  // --- bandas: sample + "ver todas" (lista completa lazy) + buscador ---
  renderBandsSection(p, g);

  // --- sección inferior: a NIVEL CIUDAD muestra datos de la localidad; a nivel país, sus ciudades ---
  const cH=document.getElementById('d-cities-h'), cBox=document.getElementById('d-cities');
  if(city){
    const gentries=Object.entries(city.g||{}).sort((a,b)=>b[1]-a[1]);
    const topG=gentries[0];
    const pct=topG?Math.round(topG[1]/Math.max(1,city.total)*100):0;
    let html='';
    if(topG) html+=`<div class="am-cinsight"><span class="lbl">Género dominante</span><b>${topG[0]}</b> · ${fmt(topG[1])} banda${topG[1]===1?'':'s'} <span class="pct">${pct}%</span></div>`;
    if(combo){
      const cv=cityCountCombo(city);
      html+=`<div class="am-cinsight on"><span class="lbl">${_esc(disp)}</span><b>${fmt(cv)}</b> banda${cv===1?'':'s'} en ${_esc(city.nombre)}</div>`;
    }else if(g){
      const cnt=sk?cityCountSub(city,citySubleg.indexOf(sk)):(city.g[g]||0);
      const rank=gentries.findIndex(e=>e[0]===g)+1;
      html+=`<div class="am-cinsight on"><span class="lbl">${_esc(disp)}</span><b>${fmt(cnt)}</b> banda${cnt===1?'':'s'} en ${_esc(city.nombre)}${(rank&&!sk)?` · Nº${rank} de la ciudad`:''}</div>`;
    }
    const others=((g && p.g_ciudades&&p.g_ciudades[g]) ? p.g_ciudades[g] : (p.ciudades||[])).filter(c=>c.nombre!==city.nombre).slice(0,8);
    if(others.length) html+=`<div class="am-cothers"><span class="lbl">Otras ciudades${disp?' · '+_esc(disp):''}</span>${others.map(ciudadHTML).join(' · ')}</div>`;
    cH.textContent=`En ${city.nombre}`;
    cBox.innerHTML=html||'—';
  }else{
    renderLocalidades(p, g, sk, combo, disp, cH, cBox);   // NIVEL país -> desagregación por localidad
  }

  rhead.querySelector('h2').textContent = disp ? `Ficha · ${disp}` : 'Ficha de país';
  rhead.querySelector('p').textContent = disp ? `Filtro activo: ${disp} · Encyclopaedia Metallum` : 'Fuente: Encyclopaedia Metallum';
  // la ficha es la ÚNICA vista activa del panel derecho: apagá treemap Y resultados de combinación
  // (si no, el bloque de resultados quedaba visible debajo y se superponía con la ficha)
  treeView.style.display='none';
  const _cv=document.getElementById('am-comboview'); if(_cv) _cv.style.display='none';
  detailEl.classList.add('show');
}
function seleccionarPais(code){
  const p=PAISES.find(x=>x.code===code); if(!p)return;
  state.pais=code;
  state.ciudad=null;                           // ficha nueva: sin ciudad enfocada
  flyTo(p);                                    // vuela y centra el país
  selectHighlight(p);                          // ilumina su silueta sobre el globo
  homeBtn.style.display='flex';
  renderFicha(p);
  showContextCard(contextForPais(p));          // ficha de contexto: reloj local + clima + stat
  activarCiudades(p);                          // pines por ciudad (si hay data)
  showAdmin1(code);                            // divisiones internas (estados/provincias)
  if(isMobile()){ updateMobNav(); openRightSheet(); }   // móvil: muestra "Ficha" y sube la ficha
  updateClearBtn();
}
function cerrarDetalle(){
  state.pais=null;
  state.ciudad=null;
  updateMobNav();                              // móvil: oculta el botón "Ficha"
  desactivarCiudades();                        // apaga los pines (fade-out) y restaura la púa
  clearAdmin1();                               // quita las divisiones internas
  clearHighlight();                            // quita el resaltado (fade suave)
  detailEl.classList.remove('show');
  hideContextCard();                           // cierra la ficha de contexto + limpia el reloj
  updateRightView();                           // treemap, o resultados si hay filtro activo
  updateClearBtn();
}

/* navega a una ciudad: abre su país, espera los pines, selecciona el pin y se acerca */
async function irACiudad(code, nombre, lat, lng){
  if(state.pais!==code) seleccionarPais(code);     // abre país (carga pines, respeta filtro)
  for(let i=0;i<50 && cityCountry!==code; i++) await new Promise(r=>setTimeout(r,80));
  const city=(cityList||[]).find(c=>c.nombre===nombre);
  if(city){ seleccionarCiudad(city); flyTo({lat,lng}, R*1.28); }   // vuela cerca de la ciudad
  else flyTo({lat,lng}, R*1.4);                                    // sin pin (raro): igual vuela
}

/* navega a una BANDA: vuela a su ciudad (o país si no tiene ciudad geocodificada),
   resalta su púa/pin y muestra la banda en la ficha (filtra la lista a su nombre). */
async function irABanda(name, code, city){
  let coords=null;
  if(city){
    await SRC_CIUDADES.ensure();                   // índice de ciudades para resolver coords
    const cn=_norm(city);
    const hit=(SRC_CIUDADES._data||[]).find(c=>c.c===code && _norm(c.n)===cn);
    if(hit) coords={lat:hit.lat,lng:hit.lng,n:hit.n};
  }
  if(coords){ await irACiudad(code, coords.n, coords.lat, coords.lng); }
  else { if(state.pais!==code) seleccionarPais(code);   // sin ciudad geocodificada -> país
         for(let i=0;i<50 && state.pais!==code;i++) await new Promise(r=>setTimeout(r,60)); }
  resaltarBandaEnFicha(name, code);
}
/* muestra la banda buscada en la ficha: filtra la lista a su nombre SIN usar el input
   editable (lo deja vacío/oculto) -> la banda queda como texto + sus 3 accesos. */
async function resaltarBandaEnFicha(name, code){
  if(state.pais!==code) return;
  const q=(name||'').toLowerCase();
  const pick=arr=>{ const ex=arr.filter(b=>(b.n||'').toLowerCase()===q);
                    return ex.length?ex:arr.filter(b=>(b.n||'').toLowerCase().includes(q)); };
  if(state.ciudad && cityCountry===code){           // ciudad ya seleccionada: filtrá su lista
    const city=cityList.find(c=>c.nombre===state.ciudad);
    if(city) pintarBandas(pick((city.bandas||[]).map(b=>({n:b.n,u:b.u,c:city.nombre,code:code,r:b.r,s:(b.s||[]).map(i=>citySubleg[i])}))));
  }else{                                            // país: cargá la lista completa y filtrá
    let all; try{ all=await loadBandas(code); }catch(e){ return; }
    if(state.pais!==code) return;
    pintarBandas(pick(all));
  }
  const search=document.getElementById('d-bsearch');   // sin campo editable con el nombre
  if(search){ search.value=''; search.style.display='none'; }
}

/* =====================================================================
   BUSCADOR UNIVERSAL — sistema EXTENSIBLE de "fuentes" de búsqueda.
   Cada fuente: {id,label,clase, ready(), ensure()->Promise, query(q,limit)->[item]}.
   item: {type,label,sublabel,count,run()}. Agregar "bandas" luego = empujar una
   fuente más a SEARCH_SOURCES (lazy) sin tocar el controlador.
   ===================================================================== */
const _norm = s => (s||'').normalize('NFKD').replace(/[̀-ͯ]/g,'').toLowerCase();
function _score(hay, q){                       // menor = mejor; -1 = no coincide
  const h=_norm(hay), n=_norm(q);
  const i=h.indexOf(n);
  if(i<0) return -1;
  if(i===0) return 0;                          // empieza con la query
  if(/\s/.test(h[i-1])) return 1;              // empieza una palabra
  return 2;                                    // coincidencia interna
}

/* --- Fuente PAÍSES (en memoria, ya cargada) --- */
const SRC_PAISES = {
  id:'pais', label:'País', clase:'pais',
  ready:()=>true, ensure:()=>Promise.resolve(),
  query(q, limit){
    const out=[];
    for(const p of PAISES){
      const sc=_score(p.name,q); if(sc<0) continue;
      out.push({type:'pais', label:p.name, sublabel:p.code, count:total(p),
                _sc:sc, _typeOrder:0, _sz:total(p), run:()=>{ closeSearch(); cerrarFiltroSheetSiMovil();
                  seleccionarPais(p.code); }});
    }
    return out.sort((a,b)=> a._sc-b._sc || b._sz-a._sz).slice(0,limit);
  }
};

/* --- Fuente CIUDADES (índice lazy: web/data/search_index.json) --- */
const SRC_CIUDADES = {
  id:'ciudad', label:'Ciudad', clase:'ciudad',
  _data:null, _loading:null,
  ready(){ return !!this._data; },
  ensure(){
    if(this._data) return Promise.resolve();
    if(!this._loading) this._loading = fetchJSON('data/search_index.json')
      .then(d=>{ this._data=(d.ciudades||[]).map(a=>({n:a[0],c:a[1],lat:a[2],lng:a[3],t:a[4]})); })
      .catch(()=>{ this._data=[]; });
    return this._loading;
  },
  query(q, limit){
    if(!this._data) return [];
    const paisName = code => { const p=PAISES.find(x=>x.code===code); return p?p.name:code; };
    const out=[];
    for(const c of this._data){
      const sc=_score(c.n,q); if(sc<0) continue;
      out.push({type:'ciudad', label:c.n, sublabel:paisName(c.c), count:c.t,
                _sc:sc, _typeOrder:1, _sz:c.t, run:()=>{ closeSearch(); cerrarFiltroSheetSiMovil();
                  irACiudad(c.c, c.n, c.lat, c.lng); }});
      if(out.length>limit*8) break;            // corte temprano (índice ya ordenado por total)
    }
    return out.sort((a,b)=> a._sc-b._sc || b._sz-a._sz).slice(0,limit);
  }
};

/* --- Fuente BANDAS (índice lazy ~6MB + Fuse.js para fuzzy/tolerancia a errores) --- */
const SRC_BANDAS = {
  id:'banda', label:'Banda', clase:'banda',
  _fuse:null, _all:null, _loading:null,
  ready(){ return !!this._fuse; },
  ensure(){
    if(this._fuse) return Promise.resolve();
    if(!this._loading){
      // Fuse (~24KB) se difiere: se carga aquí, en el primer uso del buscador de bandas (no en el arranque).
      this._loading = Promise.all([
        fetchJSON('data/bands_index.json'),
        loadScriptOnce('vendor/fuse.min.js')
      ]).then(([d])=>{
        if(typeof Fuse==='undefined') throw new Error('Fuse no cargó');
        this._all=(d.bandas||[]).map(a=>({n:a[0],c:a[1],city:a[2]}));
        // índice se construye UNA vez; ignoreLocation+threshold -> fuzzy con tolerancia
        this._fuse=new Fuse(this._all,{keys:['n'],threshold:0.34,ignoreLocation:true,
          minMatchCharLength:2,includeScore:true});
      }).catch(()=>{ this._fuse=null; });
    }
    return this._loading;
  },
  query(q, limit){
    if(!this._fuse || q.length<2) return [];
    const paisName=code=>{ const p=PAISES.find(x=>x.code===code); return p?p.name:code; };
    return this._fuse.search(q,{limit}).map(r=>{ const b=r.item;
      return {type:'banda', label:b.n, sublabel:(b.city?b.city+' · ':'')+paisName(b.c),
              count:null, _sc:(r.score||0), _typeOrder:2, _sz:0,
              run:()=>{ closeSearch(); cerrarFiltroSheetSiMovil(); irABanda(b.n, b.c, b.city); }};
    });
  }
};

/* registro de fuentes — extensible: una más acá y el controlador la integra solo */
const SEARCH_SOURCES = [SRC_PAISES, SRC_CIUDADES, SRC_BANDAS];

const _si=document.getElementById('am-search-in');
const _sdrop=document.getElementById('am-search-drop');
const _sclear=document.getElementById('am-search-clear');
let _sItems=[], _sActive=-1, _sTimer=null;

function cerrarFiltroSheetSiMovil(){ if(isMobile()) closeSheets(); }
function closeSearch(){ _sdrop.classList.remove('show'); _sdrop.innerHTML=''; _sItems=[]; _sActive=-1;
  _si.setAttribute('aria-expanded','false'); }

function renderSug(){
  if(!_sItems.length){ _sdrop.innerHTML='<div class="am-search-note">Sin resultados</div>'; _sdrop.classList.add('show'); return; }
  _sdrop.innerHTML=_sItems.map((it,i)=>
    `<div class="am-sug${i===_sActive?' active':''}" role="option" data-i="${i}">`+
      `<span class="am-sug-tag ${it.type}">${it.type==='pais'?'País':it.type==='ciudad'?'Ciudad':'Banda'}</span>`+
      `<span class="am-sug-main">${_esc(it.label)}</span>`+
      (it.sublabel?`<span class="am-sug-sub">· ${_esc(it.sublabel)}</span>`:'')+
      (it.count!=null?`<span class="am-sug-count">${fmt(it.count)}</span>`:'')+
    `</div>`).join('');
  _sdrop.classList.add('show'); _si.setAttribute('aria-expanded','true');
  _sdrop.querySelectorAll('.am-sug').forEach(el=>{
    el.addEventListener('mousedown',e=>{ e.preventDefault(); const it=_sItems[+el.dataset.i]; if(it) it.run(); });
    el.addEventListener('mousemove',()=>{ setActive(+el.dataset.i); });
  });
}
function setActive(i){
  _sActive=i;
  _sdrop.querySelectorAll('.am-sug').forEach((el,k)=>el.classList.toggle('active',k===i));
  const a=_sdrop.querySelector('.am-sug.active'); if(a) a.scrollIntoView({block:'nearest'});
}

async function runSearch(q){
  q=q.trim();
  if(q.length<1){ closeSearch(); return; }
  // dispara la carga lazy de las fuentes que aún no están listas
  const pend = SEARCH_SOURCES.filter(s=>!s.ready());
  if(pend.length){ Promise.all(pend.map(s=>s.ensure())).then(()=>{ if(_norm(_si.value.trim())===_norm(q)) runSearch(_si.value); }); }
  // mezcla resultados de cada fuente (cap por fuente) y reordena por score y tamaño
  const PER=6;
  let items=[];
  SEARCH_SOURCES.forEach(s=>{ if(s.ready()) items=items.concat(s.query(q, PER)); });
  // orden unificado: mejor score primero; empate -> país<ciudad<banda; luego por tamaño
  items.sort((a,b)=> a._sc-b._sc || (a._typeOrder-b._typeOrder) || (b._sz-a._sz));
  _sItems=items.slice(0,10); _sActive=_sItems.length?0:-1;
  renderSug();
  if(pend.length && !_sItems.length){ _sdrop.innerHTML='<div class="am-search-note">Cargando índice…</div>'; _sdrop.classList.add('show'); }
}

_si.addEventListener('input',function(){
  _sclear.style.display=this.value?'block':'none';
  clearTimeout(_sTimer); const v=this.value; _sTimer=setTimeout(()=>runSearch(v),110);
});
_si.addEventListener('focus',function(){ SRC_CIUDADES.ensure(); if(this.value.trim()) runSearch(this.value); });
_si.addEventListener('keydown',function(e){
  if(e.key==='ArrowDown'){ e.preventDefault(); if(_sItems.length) setActive((_sActive+1)%_sItems.length); }
  else if(e.key==='ArrowUp'){ e.preventDefault(); if(_sItems.length) setActive((_sActive-1+_sItems.length)%_sItems.length); }
  else if(e.key==='Enter'){ e.preventDefault(); const it=_sItems[_sActive]||_sItems[0]; if(it) it.run(); }
  else if(e.key==='Escape'){ if(_sdrop.classList.contains('show')){ closeSearch(); } else { this.value=''; _sclear.style.display='none'; } this.blur(); }
});
_sclear.addEventListener('click',()=>{ _si.value=''; _sclear.style.display='none'; closeSearch(); _si.focus(); });
document.addEventListener('click',e=>{ if(!document.getElementById('am-search').contains(e.target)) closeSearch(); });

/* hook mínimo para testing/automatización */
window.__atlas = { select: seleccionarPais, clear: cerrarDetalle, filtro: setGenero,
  tema:(name)=>{ const s=document.getElementById('am-theme-sel'); if(s){ s.value=name; s.dispatchEvent(new Event('change')); } },
  skin:(name)=>{ const s=document.getElementById('am-skin-sel'); if(s){ s.value=name; s.dispatchEvent(new Event('change')); } },
  skinNow:()=>CURRENT_SKIN, sheen:()=>sheenSprite?+sheenSprite.material.opacity.toFixed(2):null,
  earthMode:()=> (coreVec&&coreVec.visible&&earthVectorMat.opacity>0.5)?'vector-nitido' : core.material===earthRealMat?'foto-satelital' : 'canvas-estilizado',
  tvToggle:()=>toggleTV(), tvShow:()=>showTV(), tvHide:()=>hideTV(), tvSize:()=>toggleTVSize(), tvSetGenre:(k)=>setTVGenre(k),
  tvState:()=>({open:document.getElementById('am-tv').classList.contains('show'), big:document.getElementById('am-tv').classList.contains('big'), genero:tvGenre,
    src:(document.getElementById('am-tv-frame')||{}).src||'', ext:(document.getElementById('am-tv-ext')||{}).href||''}),
  ytKeyOf:(roots)=>bandYtKey({r:roots}),
  comboCount:()=>comboShown.length, comboLoadAll:()=>{ const b=document.getElementById('am-combo-all'); if(b) b.click(); },
  selRGB:()=>SEL_RGB.slice(), spikeMid:()=>THEME_SPIKE[1][1].slice(),
  genToggle:(r,s)=>toggleToken({r:r,s:s||null}),
  genClear: clearGenFilters,
  genFilters: ()=>state.genFilters.map(t=> t.s? (t.r+'›'+t.s): t.r),
  setCombine:(on)=>{ state.combine=!!on; updateModeUI(); aplicarFiltro(); },
  setBoolOp:(op)=>{ state.boolOp=(op==='AND'?'AND':'OR'); updateModeUI(); aplicarFiltro(); },
  mode:()=>({combine:state.combine, boolOp:state.boolOp}),
  ctxState:()=>{ const c=document.getElementById('am-ctx'), r=c.getBoundingClientRect();
    return {show:c.classList.contains('show'), collapsed:c.classList.contains('collapsed'),
    name:document.getElementById('am-ctx-name').textContent, clock:document.getElementById('am-ctx-clock').textContent,
    wx:getComputedStyle(document.getElementById('am-ctx-wx')).display!=='none',
    domVisible:getComputedStyle(document.getElementById('am-ctx-dom').parentNode).display!=='none',
    temp:document.getElementById('am-ctx-temp').textContent, ico:document.getElementById('am-ctx-ico').textContent,
    bands:document.getElementById('am-ctx-bands').textContent, dom:document.getElementById('am-ctx-dom').textContent,
    clockRunning: !!ctxClockTimer, x:Math.round(r.x), y:Math.round(r.y), w:Math.round(r.width)}; },
  ctxCollapse:()=>{ const m=document.getElementById('am-ctx-min'); if(m) m.click(); },
  ctxReset:()=>{ const m=document.getElementById('am-ctx-reset'); if(m) m.click(); },
  matchCount:()=>filterMatchCount(),                         // contador (misma fuente que panel)
  panelCount:()=>comboShown.length,                          // bandas mostradas en el panel
  kpiFocus:()=>document.getElementById('kpi-focus').textContent,
  comboHits: ()=>{ let n=0; PAISES.forEach(p=>(p.top_bandas||[]).forEach(b=>{ if(bandMatchCombo(b.roots,b.sub)) n++; })); return n; },
  ciudades: ()=>cityList,
  pinsVisibles: ()=>cityPins.filter(p=>p.sprite.visible).length,
  cityCountries: ()=>[...CITY_COUNTRIES],
  codeAt: (lat,lng)=>featureCodeAt(lat,lng),
  ciudadSel: ()=>state.ciudad,
  pais: ()=>state.pais,
  detalleVisible: ()=>document.getElementById('am-detail').classList.contains('show'),
  camDist: ()=>camDist, R: ()=>R,
  screenXY: (lat,lng)=>{ globe.updateMatrixWorld(); const v=latLngToVec(lat,lng,R).applyMatrix4(globe.matrixWorld);
    if(v.z<0) return null; v.project(camera); const r=canvas.getBoundingClientRect();
    return {x:Math.round((v.x*0.5+0.5)*r.width+r.left), y:Math.round((-v.y*0.5+0.5)*r.height+r.top)}; },
  pinXY: (nombre)=>{ const pin=cityPins.find(p=>p.city.nombre===nombre); if(!pin||!pin.sprite.visible) return null;
    globe.updateMatrixWorld(); const wp=pin.base.clone().applyMatrix4(globe.matrixWorld); wp.project(camera);
    const r=canvas.getBoundingClientRect();
    return {x:Math.round((wp.x*0.5+0.5)*r.width+r.left), y:Math.round((-wp.y*0.5+0.5)*r.height+r.top)}; },
  tick: ()=>updateLOD(),
  pinsTotal: ()=>cityPins.length,
  admin1Lines: ()=>admin1Group.children.length,
  admin1Op: ()=>admin1Mat.opacity,
  selCiudad: (nombre)=>{ const c=cityList.find(x=>x.nombre===nombre); if(c) seleccionarCiudad(c); } };

/* KPIs base (meta real si está disponible) */
document.getElementById('kpi-bands').textContent=fmt(META&&META.total_bandas?META.total_bandas:GRAN_TOTAL);
document.getElementById('kpi-countries').textContent=(META&&META.total_paises)?META.total_paises:PAISES.length;

/* botón pausar/reanudar rotación */
const pauseBtn=document.getElementById('am-pause');
pauseBtn.addEventListener('click',()=>{
  state.rotando=!state.rotando;
  pauseBtn.classList.toggle('paused',!state.rotando);
  document.getElementById('am-pause-ic').textContent=state.rotando?'❚❚':'▶';
  document.getElementById('am-pause-tx').textContent=state.rotando?'Pausar giro':'Reanudar giro';
  if(!state.rotando){ velRX=0; velRY=0; }
});

/* =====================================================================
   ARRANQUE + ANIMACIÓN
   ===================================================================== */
/* aplica los colores del tema activo a lo que se pinta en canvas/WebGL
   (púas, pines, selección de país). El CSS ya se temiza vía html[data-theme]. */
function applyThemeColors(name){
  const t=THEMES[name]||THEMES.tarja;
  THEME_SPIKE=[[0,[138,144,153]],[0.55,t.accent.slice()],[1,t.bright.slice()]];
  SEL_RGB=t.select.slice();
  recompute();
  if(cityPins.length) recomputeCityPins();
  if(state.pais){ const p=PAISES.find(x=>x.code===state.pais); if(p) selectHighlight(p); }
  if(CURRENT_SKIN==='accent' && earthGeo) buildEarthTexture(earthGeo);   // skin "Acento" sigue al tema
}
window.__applyThemeColors=applyThemeColors;     // hook para el selector de temas (vive fuera de boot)
applyThemeColors(document.documentElement.getAttribute('data-theme')||'tarja');

/* COLOR personalizado: aplica acento/selección elegidos en el color picker (a placer) */
function _hexRGB(h){ h=(h||'').replace('#',''); if(h.length===3) h=h.split('').map(c=>c+c).join('');
  const n=parseInt(h||'0',16); return [(n>>16)&255,(n>>8)&255,n&255]; }
function _lift(rgb,f){ return rgb.map(v=>Math.round(Math.min(255,v+(255-v)*f))); }
function _drop(rgb,f){ return rgb.map(v=>Math.round(v*(1-f))); }
function _toHex(rgb){ return '#'+rgb.map(v=>('0'+v.toString(16)).slice(-2)).join(''); }
window.__setCustomColors=function(accentHex, selectHex){
  const a=_hexRGB(accentHex), br=_lift(a,0.45), s=_hexRGB(selectHex), d=_drop(a,0.5);
  const st=document.documentElement.style;
  st.setProperty('--accent-rgb', a.join(','));
  st.setProperty('--accent-bright', _toHex(br));
  st.setProperty('--accent-2', _toHex(d));
  st.setProperty('--select', selectHex);
  st.setProperty('--select-rgb', s.join(','));
  THEME_SPIKE=[[0,[138,144,153]],[0.55,a],[1,br]]; SEL_RGB=s;
  recompute(); if(cityPins.length) recomputeCityPins();
  if(state.pais){ const p=PAISES.find(x=>x.code===state.pais); if(p) selectHighlight(p); }
  if(CURRENT_SKIN==='accent' && earthGeo) buildEarthTexture(earthGeo);
};
window.__clearCustomColors=function(){
  const st=document.documentElement.style;
  ['--accent-rgb','--accent-bright','--accent-2','--select','--select-rgb'].forEach(p=>st.removeProperty(p));
};

/* ===== modo REALISTA: Tierra NASA (texturas reales) + sol + cielo estelar real =====
   texturas libres de three-globe (unpkg). Si no cargan (sin internet), cae a "clásico". */
const TEXBASE='assets/textures/';   // texturas NASA auto-hosteadas en WebP (2048px); antes unpkg three-globe
let earthRealMat=null, realTexState=0;   // 0=sin cargar 1=cargando 2=ok 3=falló
function ensureRealEarth(cb){
  if(realTexState===2){ cb(true); return; }
  if(realTexState===3){ cb(false); return; }
  if(realTexState===1){ setTimeout(()=>ensureRealEarth(cb),300); return; }
  realTexState=1;
  earthRealMat=new THREE.MeshPhongMaterial({color:0xffffff, shininess:16, specular:0x223344});
  const loader=new THREE.TextureLoader(); try{loader.crossOrigin='anonymous';}catch(e){}
  // SOLO el day-map (blue-marble) es crítico para el primer render: en cuanto llega, se hace el swap a la
  // Tierra NASA (cb). El specular (water) y el bump (topology) se cargan DESPUÉS y se adjuntan al material
  // cuando estén listos (needsUpdate) — no bloquean que aparezca el globo.
  loader.load(TEXBASE+'earth-blue-marble.webp',
    t=>{ try{t.anisotropy=renderer.capabilities.getMaxAnisotropy();}catch(e){} earthRealMat.map=t; earthRealMat.needsUpdate=true;
         realTexState=2; cb(true); },
    undefined, ()=>{ realTexState=3; cb(false); });           // si falla el day-map -> cae a clásico
  loader.load(TEXBASE+'earth-water.webp',
    t=>{ earthRealMat.specularMap=t; earthRealMat.specular=new THREE.Color(0x4a5a6a); earthRealMat.needsUpdate=true; },
    undefined, ()=>{});
  loader.load(TEXBASE+'earth-topology.webp',
    t=>{ try{t.anisotropy=renderer.capabilities.getMaxAnisotropy();}catch(e){} earthRealMat.bumpMap=t; earthRealMat.bumpScale=0.6; earthRealMat.needsUpdate=true; },
    undefined, ()=>{});
}
function ensureStarSky(){
  if(starSky){ starSky.visible=true; if(nebulaMesh) nebulaMesh.visible=false; return; }
  const loader=new THREE.TextureLoader(); try{loader.crossOrigin='anonymous';}catch(e){}
  loader.load(TEXBASE+'night-sky.webp', t=>{
    starSky=new THREE.Mesh(new THREE.SphereGeometry(1700,48,32),
      new THREE.MeshBasicMaterial({map:t,side:THREE.BackSide,depthWrite:false}));
    starSky.renderOrder=-3; space.add(starSky);
    if(nebulaMesh) nebulaMesh.visible=false;                  // fuera el aspecto "render beta"
  }, undefined, ()=>{});
}
/* cambia la SKIN de la Tierra */
function applySkin(name){
  if(name!=='realista' && !SKINS[name]) name='classic';
  CURRENT_SKIN=name;
  if(name==='realista'){
    ensureRealEarth(ok=>{
      if(!ok){                                                // sin texturas -> volver a clásico
        const s=document.getElementById('am-skin-sel'); if(s) s.value='classic';
        try{ localStorage.setItem('mg_skin','classic'); }catch(e){}
        applySkin('classic'); return;
      }
      core.material=earthRealMat; core.material.needsUpdate=true;
      ambLight.intensity=0.22; sunLight.intensity=1.35;       // sol -> terminador día/noche + brillo en océanos
      grid.visible=false;
      if(sheenSprite) sheenSprite.material.opacity=0;
      ensureStarSky();
      buildVectorEarth();                                     // prepara la versión nítida para el zoom profundo
    });
    return;
  }
  // skins estilizados: textura de canvas (MeshBasic), sin luces, nebulosa procedural
  core.material=coreMat;
  if(coreVec){ coreVec.visible=false; earthVectorMat.opacity=0; }   // sin capa vectorial fuera de realista
  ambLight.intensity=0; sunLight.intensity=0;
  if(starSky) starSky.visible=false;
  if(nebulaMesh) nebulaMesh.visible=true;
  const sk=resolveSkin();
  if(earthGeo) buildEarthTexture(earthGeo);
  if(sheenSprite) sheenSprite.material.opacity = sk.sheen||0;
}
window.__applySkin=applySkin;
try{ applySkin(localStorage.getItem('mg_skin')||'realista'); }catch(e){ applySkin('classic'); }

/* ===================== DASHBOARD · DATA (metal_stats.js — copiado TAL CUAL) =====================
   Funciones puras de agregación. El filtro de confianza por `v` (default ESTRICTO = solo ok_pais)
   es CRÍTICO y ya está validado. (En el front el campo de raíces se llama `roots`; al armar la
   base de bandas para estas funciones se mapea roots -> raices.) */
const TRUST_ESTRICTO  = new Set(['ok_pais']);
const TRUST_PERMISIVO = new Set(['ok_pais','ok']);
let   TRUST = TRUST_ESTRICTO;
function setNivelConfianza(set){ TRUST=set; }
const _li = b => Number(b && b.li) || 0;
const _pc = b => Number(b && b.pc) || 0;
const liConfiable = b => !!b && TRUST.has(b.v) && _li(b) > 0;
const devocion = b => (_li(b) > 0 ? _pc(b) / _li(b) : 0);
const tieneDataLastfm = bands => Array.isArray(bands) && bands.some(b => b && b.v !== undefined);
function fusionar(baseBands, lastfmArr){
  const lf={}; for(const m of (lastfmArr||[])) lf[String(m.id)]=m;
  return baseBands.map(b=>{ const m=lf[String(b.id)]||{}; return {...b, li:m.li,pc:m.pc,v:m.v,s:m.s,mbid:m.mbid}; });
}
function totalesGlobales(bands){
  const paises=new Set(), raices=new Set();
  for(const b of bands){ if(b.c) paises.add(b.c); for(const r of (b.raices||[])) raices.add(r); }
  const conf=bands.filter(liConfiable);
  return { bandas:bands.length, paises:paises.size, generos:raices.size,
    oyentesTotales:conf.reduce((s,b)=>s+_li(b),0), bandasConDataConfiable:conf.length };
}
function paisesPorCantidad(bands,n=10){
  const m={}; for(const b of bands) if(b.c) m[b.c]=(m[b.c]||0)+1;
  return Object.entries(m).map(([c,bandas])=>({c,bandas})).sort((a,b)=>b.bandas-a.bandas).slice(0,n);
}
function paisesPorOyentes(bands,n=10){
  if(!tieneDataLastfm(bands)) return null;
  const m={}; for(const b of bands) if(liConfiable(b)) m[b.c]=(m[b.c]||0)+_li(b);
  return Object.entries(m).map(([c,oyentes])=>({c,oyentes})).sort((a,b)=>b.oyentes-a.oyentes).slice(0,n);
}
function topBandasPorOyentes(bands,n=10){
  if(!tieneDataLastfm(bands)) return null;
  return bands.filter(liConfiable).sort((a,b)=>_li(b)-_li(a)).slice(0,n);
}
function generoDominantePorPais(bands){
  const porPais={};
  for(const b of bands){ if(!b.c) continue; (porPais[b.c]=porPais[b.c]||{});
    for(const r of (b.raices||[])) porPais[b.c][r]=(porPais[b.c][r]||0)+1; }
  const out={};
  for(const [c,conteo] of Object.entries(porPais)){ const top=Object.entries(conteo).sort((a,b)=>b[1]-a[1])[0]; if(top) out[c]={genero:top[0],bandas:top[1]}; }
  return out;
}
function joyasOcultas(bands,{minLi=50,maxLi=3000,n=12}={}){
  if(!tieneDataLastfm(bands)) return null;
  return bands.filter(b=>liConfiable(b)&&_li(b)>=minLi&&_li(b)<=maxLi)
    .map(b=>({...b,devocion:devocion(b)})).sort((a,b)=>b.devocion-a.devocion).slice(0,n);
}

/* ===================== DASHBOARD · RENDER ===================== */
/* Last.fm: intenta cargar las métricas (mismo patrón fetch que la app). Si no existe (barrido en
   curso) -> null -> los bloques de oyentes/joyas muestran "próximamente" y se prenden solos al existir. */
/* AGREGADO liviano (build_dashboard.py). Si no existe -> null -> "Próximamente" (fallback, no rompe). */
function dashFetchAgg(){
  return fetch('data/lastfm/dashboard.json').then(r=>{ if(!r.ok) throw 0; return r.json(); }).catch(()=> null);
}
/* ---- navegación: del dashboard AL globo (reusa las funciones del globo) ---- */
function dashGoToPais(code){
  if(!code) return;
  window.scrollTo({top:0,behavior:'smooth'});           // 1) sube al globo
  setTimeout(()=>{ if(typeof seleccionarPais==='function') seleccionarPais(code); }, 480);  // 2) vuela/selecciona
}
function dashGoToBanda(name,code){
  window.scrollTo({top:0,behavior:'smooth'});
  setTimeout(()=>{ if(name && code && typeof irABanda==='function') irABanda(name,code,'');
                   else if(code && typeof seleccionarPais==='function') seleccionarPais(code); }, 480);
}
function dashGoToGenero(g){
  if(!g) return;
  window.scrollTo({top:0,behavior:'smooth'});
  setTimeout(()=>{
    if(typeof setGenero==='function') setGenero(g);                 // filtra esa raíz en el globo
    // panel izquierdo: expandí ESA raíz y colapsá el resto (reusa setExpand del panel)
    if(typeof GENEROS!=='undefined' && typeof setExpand==='function')
      GENEROS.forEach(x=>{ if((SUBGEN[x]||[]).length) setExpand(x, x===g); });
    const row=(typeof rowEls!=='undefined') && rowEls[g];           // scrolleá SOLO el panel a la raíz (no la ventana)
    const panel=document.getElementById('am-genres');
    if(row && panel){ const r=row.getBoundingClientRect(), pr=panel.getBoundingClientRect();
      panel.scrollTo({top: panel.scrollTop + (r.top - pr.top) - 10, behavior:'smooth'}); }
  }, 480);
}
/* conecta los clickeables de un contenedor (país=data-code, banda=data-name, raíz=data-gen) + teclado */
function dashWire(el){
  if(!el) return;
  el.querySelectorAll('.dash-clk[data-name]').forEach(n=>n.addEventListener('click',()=>dashGoToBanda(n.dataset.name,n.dataset.code)));
  el.querySelectorAll('.dash-clk[data-gen]').forEach(n=>n.addEventListener('click',()=>dashGoToGenero(n.dataset.gen)));
  el.querySelectorAll('.dash-clk[data-code]:not([data-name])').forEach(n=>n.addEventListener('click',()=>dashGoToPais(n.dataset.code)));
  el.querySelectorAll('.dash-clk').forEach(n=>n.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); n.click(); }}));
}
function dashBar(code,name,val,max){
  const w=(val/(max||1)*100).toFixed(1);
  return `<div class="dash-bar dash-clk" data-code="${_esc(code)}" title="Ver ${_esc(name)} en el globo" role="button" tabindex="0">`+
    `<span class="bl">${flagImg(code,11)} ${_esc(name)}</span>`+
    `<span class="bt"><span class="bf" data-w="${w}" style="width:0"></span></span>`+
    `<span class="bv">${fmt(val)}</span><span class="dash-go" aria-hidden="true">↗</span></div>`;
}
/* Lista INCREMENTAL: muestra `step` (25); "Ver más" añade los siguientes 25 al DOM
   (no renderiza los 100 de golpe); "Ver menos" colapsa. Solo cablea los nodos nuevos. */
function dashRenderList(hostId, items, layoutClass, renderItem, step){
  step=step||25;
  const host=document.getElementById(hostId); if(!host) return;
  if(!items || !items.length){ host.innerHTML=dashSoon(); return; }
  host.innerHTML=`<div class="${layoutClass} dash-listitems"></div><div class="dash-more"></div>`;
  const list=host.querySelector('.dash-listitems'), more=host.querySelector('.dash-more');
  let shown=0;
  function appendUpTo(n){
    const tmp=document.createElement('div'); let html='';
    for(let i=shown;i<n && i<items.length;i++) html+=renderItem(items[i],i);
    tmp.innerHTML=html; dashWire(tmp);                  // cablea SOLO lo nuevo
    while(tmp.firstChild) list.appendChild(tmp.firstChild);
    shown=Math.min(n,items.length); controls();
    dashAnimateIn(list);                                // anima el ancho de las barras recién agregadas
  }
  function controls(){
    let html='';
    if(shown<items.length){ const next=Math.min(step,items.length-shown);
      html+=`<button type="button" class="dash-morebtn" data-act="more">Ver más <span>▾</span> <i>+${next}</i></button>`; }
    if(shown>step){ html+=`<button type="button" class="dash-morebtn ghost" data-act="less">Ver menos <span>▲</span></button>`; }
    more.innerHTML=html;
    more.querySelectorAll('.dash-morebtn').forEach(btn=>btn.addEventListener('click',()=>{
      if(btn.dataset.act==='more') appendUpTo(shown+step);
      else { while(list.children.length>step) list.removeChild(list.lastChild);   // colapsa a 25
             shown=Math.min(step,items.length); controls(); host.scrollIntoView({block:'nearest',behavior:'smooth'}); }
    }));
  }
  appendUpTo(step);
}
function dashSoon(){ return '<div class="dash-soon">Próximamente · <b>Last.fm</b></div>'; }
function dashRenderTotales(agg){
  const el=document.getElementById('dash-kpis'); if(!el) return;
  const bandas=(META&&META.total_bandas)||PAISES.reduce((a,p)=>a+total(p),0);
  const paises=(META&&META.total_paises)||PAISES.length;
  const generos=GENEROS.length;
  let html=`<div class="dash-kpi"><div class="v" data-countup="${bandas}">${fmt(bandas)}</div><div class="l">Bandas</div></div>`+
    `<div class="dash-kpi"><div class="v" data-countup="${paises}">${fmt(paises)}</div><div class="l">Países</div></div>`+
    `<div class="dash-kpi"><div class="v" data-countup="${generos}">${fmt(generos)}</div><div class="l">Géneros raíz</div></div>`;
  if(agg && agg.oyentesTotales){
    html+=`<div class="dash-kpi"><div class="v" data-countup="${agg.oyentesTotales}">${fmt(agg.oyentesTotales)}</div><div class="l">Oyentes · Last.fm</div></div>`; }
  el.innerHTML=html;
}
function dashRenderCantidad(){   // REAL: totales por país en memoria (todo el dataset), hasta 100, incremental
  const rows=PAISES.map(p=>({c:p.code,name:p.name,bandas:total(p)})).sort((a,b)=>b.bandas-a.bandas).slice(0,100);
  const max=rows[0]?rows[0].bandas:1;
  dashRenderList('dash-cant', rows, 'dash-bars', r=>dashBar(r.c,r.name,r.bandas,max), 25);
}
// El árbol del metal: KPI (subgéneros + raíces) + ranking de raíces por nº de subgéneros nombrados
function dashRenderArbol(){
  const host=document.getElementById('dash-arbol'); if(!host) return;
  const rows=GENEROS.map(r=>{ const arr=SUBGEN[r]||[];
      return {r, n:arr.filter(x=>x[0]!=='Otros').length}; })
    .filter(x=>x.n>0).sort((a,b)=>b.n-a.n);
  const totalSub=rows.reduce((a,x)=>a+x.n,0);
  const kpi=document.getElementById('dash-arbol-kpi');
  if(kpi) kpi.innerHTML=
    `<div class="dash-kpi"><div class="v" data-countup="${totalSub}">${fmt(totalSub)}</div><div class="l">Subgéneros</div></div>`+
    `<div class="dash-kpi"><div class="v" data-countup="${GENEROS.length}">${fmt(GENEROS.length)}</div><div class="l">Raíces</div></div>`;
  const max=rows[0]?rows[0].n:1;
  dashRenderList('dash-arbol', rows, 'dash-bars', x=>
    `<div class="dash-bar dash-rootbar dash-clk" data-gen="${_esc(x.r)}" title="Filtrar ${_esc(x.r)} en el globo" role="button" tabindex="0">`+
    `<span class="bl"><span class="rdot" aria-hidden="true"></span>${_esc(x.r)}</span>`+
    `<span class="bt"><span class="bf" data-w="${(x.n/(max||1)*100).toFixed(1)}" style="width:0"></span></span>`+
    `<span class="bv">${x.n}</span><span class="dash-go" aria-hidden="true">↗</span></div>`, 25);
}
function dashRenderADN(){        // REAL: género dominante por país desde p.g (= generoDominantePorPais sobre todo el dataset)
  const el=document.getElementById('dash-adn'); if(!el) return;
  const top=PAISES.slice().sort((a,b)=>total(b)-total(a)).slice(0,20);
  el.innerHTML=top.map(p=>{ const g=topGenre(p.g); if(!g) return '';
    return `<div class="dash-chip dash-clk" data-code="${_esc(p.code)}" title="Ver ${_esc(p.name)} en el globo" role="button" tabindex="0">${flagImg(p.code,10)} <span class="cc">${p.code}</span><span class="cg">${g}</span><span class="cn">${fmt((p.g&&p.g[g])||0)}</span><span class="dash-go" aria-hidden="true">↗</span></div>`;
  }).join('');
  dashWire(el);
}
function dashRenderOyentes(agg){
  const data=agg && agg.paisesPorOyentes;
  const max=(data&&data[0])?data[0].oyentes:1;
  dashRenderList('dash-oy', data, 'dash-bars',
    d=>{ const p=PAISES.find(x=>x.code===d.c); return dashBar(d.c, p?p.name:d.c, d.oyentes, max); }, 25);
}
function dashRenderJoyas(agg){
  const data=agg && agg.joyasOcultas;     // SOLO joyas reales del agregado; sin relleno
  dashRenderList('dash-joyas', data, 'dash-joyas', b=>{ const p=PAISES.find(x=>x.code===b.c); const ne=_esc(b.n||'');
    return `<div class="dash-jcard dash-clk" data-name="${ne}" data-code="${_esc(b.c||'')}" title="Ver ${ne} en el globo" role="button" tabindex="0">`+
      `<span class="dash-go" aria-hidden="true">↗</span>`+
      `<div class="jn">${ne}</div>`+
      `<div class="jc">${p?_esc(p.name):(b.c||'')}</div>`+
      `<div class="jm"><span>${fmt(b.li||0)} oy.</span><span><b>${(b.devocion||0).toFixed(1)}</b> plays/oy.</span></div></div>`; }, 25);
}
function dashShortNum(n){ if(n>=1e9)return (n/1e9)+' MM'; if(n>=1e6)return (n/1e6)+' M'; if(n>=1e3)return (n/1e3)+' K'; return ''+n; }
// A) SCATTER bandas (X lineal) vs oyentes (Y log), SVG a mano; outliers etiquetados; punto -> globo
function dashRenderScatter(agg){
  const el=document.getElementById('dash-scatter'); if(!el) return;
  const read=document.getElementById('dash-scatter-read');
  const data=((agg&&agg.paisesScatter)||[]).filter(d=>d.oyentes>0&&d.bandas>0);
  if(!data.length){ el.innerHTML=dashSoon(); if(read) read.textContent=''; return; }
  const W=920,H=430,ml=52,mr=20,mt=22,mb=42, pw=W-ml-mr, ph=H-mt-mb;
  const xMax=Math.max(...data.map(d=>d.bandas));
  const ys=data.map(d=>d.oyentes), lgMin=Math.log10(Math.min(...ys)), lgMax=Math.log10(Math.max(...ys));
  const X=b=>ml + b/xMax*pw;
  const Y=o=>mt + ph - (Math.log10(o)-lgMin)/((lgMax-lgMin)||1)*ph;
  let grid='';
  for(let e=Math.ceil(lgMin); e<=Math.floor(lgMax); e++){ const o=Math.pow(10,e), y=Y(o);
    grid+=`<line class="grid" x1="${ml}" y1="${y.toFixed(1)}" x2="${W-mr}" y2="${y.toFixed(1)}"/>`+
      `<text class="axlbl" x="${ml-7}" y="${(y+3).toFixed(1)}" text-anchor="end">${dashShortNum(o)}</text>`; }
  const ratio=d=>d.oyentes/d.bandas;
  const byB=[...data].sort((a,b)=>b.bandas-a.bandas);
  const byO=[...data].sort((a,b)=>b.oyentes-a.oyentes);
  const byR=[...data].sort((a,b)=>ratio(b)-ratio(a));
  const byRlow=[...data].filter(d=>d.bandas>=3000).sort((a,b)=>ratio(a)-ratio(b));
  const labelSet=new Set([...byB.slice(0,2),...byO.slice(0,3),...byR.slice(0,3),...byRlow.slice(0,1)].map(d=>d.c));
  const pts=data.map(d=>{ const x=X(d.bandas), y=Y(d.oyentes), lab=labelSet.has(d.c);
    const p=PAISES.find(z=>z.code===d.c), nm=p?p.name:d.c;
    return `<g class="dash-pt dash-clk${lab?' out':''}" data-code="${_esc(d.c)}" role="button" tabindex="0">`+
      `<title>${_esc(nm)}: ${fmt(d.bandas)} bandas · ${fmt(d.oyentes)} oyentes</title>`+
      `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${lab?5:3.4}"/>`+
      (lab?`<text class="ptl" x="${(x+8).toFixed(1)}" y="${(y+3.5).toFixed(1)}">${_esc(nm)}</text>`:'')+`</g>`;
  }).join('');
  el.innerHTML=`<svg class="dash-scatter" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Países: número de bandas contra oyentes">`+
    `<line class="ax" x1="${ml}" y1="${mt}" x2="${ml}" y2="${mt+ph}"/>`+
    `<line class="ax" x1="${ml}" y1="${mt+ph}" x2="${W-mr}" y2="${mt+ph}"/>`+grid+pts+
    `<text class="axlbl" x="${W-mr}" y="${H-7}" text-anchor="end">más bandas →</text>`+
    `<text class="axlbl" x="${ml}" y="${mt-8}" text-anchor="start">↑ más oyentes (log)</text></svg>`;
  dashWire(el);
  if(read){ const hi=byR[0], lo=byRlow[0];
    const ph_=PAISES.find(z=>z.code===hi.c), pl=PAISES.find(z=>z.code===(lo&&lo.c));
    read.innerHTML=`<b>${_esc(ph_?ph_.name:hi.c)}</b> consigue muchísimos oyentes con relativamente pocas bandas (arriba-izquierda). `+
      (lo?`En cambio <b>${_esc(pl?pl.name:lo.c)}</b> tiene muchísimas bandas, pero bastantes menos oyentes por banda.`:''); }
}
// B) DEVOCIÓN: barras horizontales plays/oyente; barra -> globo
function dashRenderDevocion(agg){
  const data=agg&&agg.devocionPorPais;
  const max=(data&&data[0])?data[0].devocion:1;
  dashRenderList('dash-dev', data, 'dash-bars', d=>{ const p=PAISES.find(x=>x.code===d.c), nm=p?p.name:d.c;
    return `<div class="dash-bar dash-clk" data-code="${_esc(d.c)}" title="Ver ${_esc(nm)} en el globo" role="button" tabindex="0">`+
      `<span class="bl">${flagImg(d.c,11)} ${_esc(nm)}</span>`+
      `<span class="bt"><span class="bf" data-w="${(d.devocion/(max||1)*100).toFixed(1)}" style="width:0"></span></span>`+
      `<span class="bv">${d.devocion.toFixed(1)}</span><span class="dash-go" aria-hidden="true">↗</span></div>`; }, 25);
}
// C) PODIO top bandas por oyentes; top 3 = podio, 4+ = lista compacta; expandible 3->5->10->25->50->100
function dashRenderPodio(agg){
  const host=document.getElementById('dash-podio'); if(!host) return;
  const data=agg&&agg.topBandasPorOyentes;
  if(!data||!data.length){ host.innerHTML=dashSoon(); return; }
  const LEVELS=[3,5,10,25,50,100].filter(n=>n<data.length);
  LEVELS.push(data.length);                       // último nivel = todo lo que haya
  host.innerHTML='<div class="dash-podio-top"></div><div class="dash-poditems"></div><div class="dash-more"></div>';
  const topEl=host.querySelector('.dash-podio-top'), listEl=host.querySelector('.dash-poditems'), more=host.querySelector('.dash-more');
  const medal=['g1','g2','g3'];
  topEl.innerHTML=data.slice(0,3).map((b,i)=>{ const p=PAISES.find(x=>x.code===b.c), ne=_esc(b.n||'');
    return `<div class="dash-pcard ${medal[i]} dash-clk" data-name="${ne}" data-code="${_esc(b.c||'')}" title="Ver ${ne} en el globo" role="button" tabindex="0">`+
      `<span class="dash-go" aria-hidden="true">↗</span>`+
      `<div class="pr">${i+1}</div><div class="pn">${ne}</div>`+
      `<div class="pc2">${flagImg(b.c,11)} ${p?_esc(p.name):(b.c||'')}</div>`+
      `<div class="pv">${fmt(b.li||0)}</div><div class="pvl">Oyentes</div></div>`;
  }).join('');
  dashWire(topEl);
  function rowItem(b,i){ const p=PAISES.find(x=>x.code===b.c), ne=_esc(b.n||'');
    return `<div class="dash-prow dash-clk" data-name="${ne}" data-code="${_esc(b.c||'')}" title="Ver ${ne} en el globo" role="button" tabindex="0">`+
      `<span class="prk">${i+1}</span><span class="prn">${ne}</span>`+
      `<span class="prc">${flagImg(b.c,10)} ${p?_esc(p.name):(b.c||'')}</span>`+
      `<span class="prv">${fmt(b.li||0)}</span><span class="dash-go" aria-hidden="true">↗</span></div>`;
  }
  let lvl=0, rendered=3;                           // shown = LEVELS[lvl]; rendered = filas compactas ya en DOM (incluye las 3 del podio)
  function appendUpTo(n){
    const tmp=document.createElement('div'); let html='';
    for(let i=rendered;i<n && i<data.length;i++) html+=rowItem(data[i],i);
    tmp.innerHTML=html; dashWire(tmp); while(tmp.firstChild) listEl.appendChild(tmp.firstChild);
    rendered=Math.min(n,data.length);
  }
  function controls(){
    let html='';
    if(lvl<LEVELS.length-1){ const next=LEVELS[lvl+1]-LEVELS[lvl];
      html+=`<button type="button" class="dash-morebtn" data-act="more">Ver más <span>▾</span> <i>+${next}</i></button>`; }
    if(lvl>0){ html+=`<button type="button" class="dash-morebtn ghost" data-act="less">Ver menos <span>▲</span></button>`; }
    more.innerHTML=html;
    more.querySelectorAll('.dash-morebtn').forEach(btn=>btn.addEventListener('click',()=>{
      if(btn.dataset.act==='more'){ lvl++; appendUpTo(LEVELS[lvl]); }
      else { lvl=0; listEl.innerHTML=''; rendered=3; host.scrollIntoView({block:'nearest',behavior:'smooth'}); }
      controls();
    }));
  }
  controls();                                       // arranca en top 3 (sin filas compactas)
}
/* ---- animaciones de entrada SOBRIAS (respetan prefers-reduced-motion vía `reduce`) ---- */
function dashCountUp(el,target,dur){
  if(el._cupRaf) cancelAnimationFrame(el._cupRaf);              // sin solapes si se re-anima
  const t0=performance.now();
  (function tick(now){ const p=Math.min(1,Math.max(0,(now-t0)/dur)), e=1-Math.pow(1-p,3);   // easeOutCubic
    el.textContent=fmt(Math.max(0,Math.round(target*e)));      // nunca negativo
    if(p<1) el._cupRaf=requestAnimationFrame(tick); else { el.textContent=fmt(target); el._cupRaf=0; }
  })(t0);
}
function dashAnimateIn(scope){
  if(!scope) return;
  scope.querySelectorAll('.bf[data-w]').forEach(bf=>{ const w=bf.getAttribute('data-w'); bf.removeAttribute('data-w');
    if(reduce) bf.style.width=w+'%'; else requestAnimationFrame(()=>{ bf.style.width=w+'%'; }); });
  scope.querySelectorAll('.v[data-countup]').forEach(el=>{ const t=+el.getAttribute('data-countup'); el.removeAttribute('data-countup');
    if(reduce || !isFinite(t)){ el.textContent=fmt(t); return; } dashCountUp(el,t,1200); });
}
function buildDashboard(){
  dashRenderTotales(null); dashRenderCantidad(); dashRenderADN(); dashRenderArbol();
  dashRenderOyentes(null); dashRenderJoyas(null);          // "próximamente" hasta que cargue el agregado
  dashRenderScatter(null); dashRenderDevocion(null); dashRenderPodio(null);
  // fade-in + count-up + crecer barras al entrar en viewport (una sola vez por sección)
  const secs=document.querySelectorAll('.dash-sec');
  let io=null;
  if('IntersectionObserver' in window){
    io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){
      e.target.classList.add('in'); dashAnimateIn(e.target); io.unobserve(e.target); }}),{threshold:0.16});
    secs.forEach(s=>io.observe(s));
  } else secs.forEach(s=>{ s.classList.add('in'); dashAnimateIn(s); });
  dashFetchAgg().then(agg=>{ if(agg){                       // si existe el JSON -> se prenden solos
    dashRenderTotales(agg); dashRenderOyentes(agg); dashRenderJoyas(agg);
    dashRenderScatter(agg); dashRenderDevocion(agg); dashRenderPodio(agg);
    // el agregado llegó tarde: re-animar las secciones que ya estaban visibles
    secs.forEach(s=>{ if(s.classList.contains('in')) dashAnimateIn(s); }); } });
  // navegación héroe <-> dashboard
  const sd=document.getElementById('am-scrolldown');
  if(sd) sd.addEventListener('click',()=>{ const d=document.getElementById('am-dash'); if(d) d.scrollIntoView({behavior:'smooth'}); });
  const tg=document.getElementById('am-toglobe');
  if(tg) tg.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
}
buildDashboard();

let t0=null, intro=reduce?1:0;
function resize(){
  const w=wrap.clientWidth||800,h=wrap.clientHeight||600;
  renderer.setSize(w,h,false);
  camera.aspect=w/h; camera.updateProjectionMatrix();
  // MÓVIL: aleja la cámara para que el globo ENTERO entre en el ancho (con margen lateral)
  if(isMobile()){
    const vHalf=camera.fov*Math.PI/360;                    // medio FOV vertical (rad)
    const hHalf=Math.atan(Math.tan(vHalf)*camera.aspect);  // medio FOV horizontal
    const limit=Math.min(vHalf,hHalf);                     // dimensión que restringe (en vertical es el horizontal)
    const fit=R/Math.sin(limit*0.86);                      // 0.86 -> el globo ocupa ~86% -> margen a los lados
    CAM_PLANET=fit; CAM_MAX=Math.max(fit*1.12, R*3.6);
    lookY=-R*0.16;                                          // sube el globo sobre la barra inferior
    if(!state || !state.pais) camDist=fit;                 // vista inicial/planetaria: globo completo
  } else {
    CAM_PLANET=R*3.0; CAM_MAX=R*3.6; lookY=0;
  }
  if(treeChart) treeChart.resize();
}
window.addEventListener('resize',resize);
resize();

function loop(ts){
  if(t0===null)t0=ts;
  if(intro<1){ intro=Math.min(1,(ts-t0)/1200); }
  // crecimiento de púas (con stagger por longitud)
  spikes.forEach((s,i)=>{
    const local = Math.max(0,Math.min(1,(intro*1.3)-(i/spikes.length)*0.3));
    const ease = 1-Math.pow(1-local,3);
    const goal = s.targetH * ease;
    s.curH += (goal-s.curH)*0.18;
    s.mesh.scale.y = Math.max(0.001,s.curH);
    placeGlow(s);
  });
  // vuelo de cámara (tween con easing): reorienta el globo y ajusta el zoom
  if(tween){
    tween.t++;
    const k=Math.min(1,tween.t/tween.dur);
    const e=1-Math.pow(1-k,3);
    globe.quaternion.copy(tween.fromQ).slerp(tween.toQ,e);
    camDist=tween.fromDist+(tween.toDist-tween.fromDist)*e;
    if(k>=1) tween=null;
  }
  // rotación ambiente / inercia con damping (suave), en los mismos ejes de pantalla
  else if(!dragging){
    if(Math.abs(velRX)>0.0002 || Math.abs(velRY)>0.0002){
      spinGlobe(velRX, velRY); velRX*=0.92; velRY*=0.92;   // inercia con damping
    } else if(!reduce && !state.pais && state.rotando && nivel()==='planet'){
      spinGlobe(0.0009, 0);                                // giro ambiente suave (eje vertical pantalla)
    }
  }
  // fade-in/out suave de los pines de ciudad + tamaño en pantalla constante (separa al acercar)
  if(cityPins.length){
    applyPinScale();
    for(const p of cityPins){
      const tgt = (p.sprite.visible ? cityFade*(p._baseOp||0) : 0);
      p.sprite.material.opacity += (tgt - p.sprite.material.opacity)*0.15;
    }
  }
  updateLOD();
  // parallax sutil del fondo: gira a ~12% del globo -> el espacio "queda detrás", da profundidad
  _spaceQ.identity().slerp(globe.quaternion, 0.12);
  space.quaternion.copy(_spaceQ);
  camera.position.set(0,0,camDist);
  camera.lookAt(0,lookY,0);
  renderer.render(scene,camera);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
}  /* ===== fin boot() ===== */

/* =====================================================================
   CARGA DE DATOS REAL — conecta el front al pipeline (sección 9.1)
   ===================================================================== */
const CITY_COUNTRIES = new Set();      // países con pines (se llena del _index.json)
async function fetchJSON(url, tries=4){
  // reintenta ante fallos transitorios (p.ej. ERR_CONNECTION_RESET de servers locales)
  let last;
  for(let i=0;i<tries;i++){
    try{
      const res=await fetch(url,{cache:'force-cache'});
      if(!res.ok) throw new Error('HTTP '+res.status);
      return await res.json();
    }catch(e){ last=e; await new Promise(r=>setTimeout(r, 300*(i+1))); }
  }
  throw last;
}
(async function init(){
  const chip=document.getElementById('am-srcchip');
  try{
    const DATA=await fetchJSON('data/atlas_data.json');
    if(!DATA.paises||!DATA.paises.length) throw new Error('JSON sin países');
    boot(DATA,false);
    const cuando = DATA.meta&&DATA.meta.generado ? DATA.meta.generado.slice(0,10) : '';
    chip.innerHTML='Datos: <b>Encyclopaedia Metallum</b>'+(cuando?` · snapshot ${cuando}`:'');
    // países con pines de ciudad (best-effort)
    fetchJSON('data/ciudades/_index.json').then(list=>{
      (list||[]).forEach(c=>CITY_COUNTRIES.add(c));
    }).catch(()=>{});
  }catch(e){
    console.warn('Atlas: no se pudo cargar data/atlas_data.json —',e.message,'· usando muestra');
    chip.innerHTML='⚠ No se pudo cargar la data real — mostrando <b>muestra</b>';
    boot({paises:MOCK_PAISES,generos_globales:null,meta:null},true);
  }
})();
