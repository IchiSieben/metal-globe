/* Metal Globe — agregacion de datos (capa pura).
 *
 * Primera extraccion real de modulos desde app.js. Estas 10 funciones no tocan
 * THREE ni el DOM: transforman arrays y devuelven objetos.
 *
 * Se carga ANTES que app.js. Son declaraciones de funcion, asi que existen
 * cuando app.js empieza a ejecutar; y los globales que leen (PAISES, GENEROS,
 * comboFullByCountry...) los declara app.js con `let` en el scope lexical
 * global, visible entre scripts clasicos. Como solo se resuelven en el momento
 * de la LLAMADA, y ninguna llamada ocurre antes de que app.js corra, el orden
 * es seguro.
 *
 * Es tambien la razon por la que el resto todavia no se puede cortar asi: ver
 * METAL_GLOBE_IMPROVEMENTS.md.
 */

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

/* total que cumplen: completo si se cargó "Explorar TODAS"; si no, suma de destacadas (per-band) */
function filterMatchCount(){ if(comboFullByCountry) return comboFullTotal; let s=0; for(const p of PAISES) s+=countDestacadas(p); return s; }

function valPais(p){
  if(!state.genFilters.length) return total(p);
  if(state.combine) return comboFullByCountry ? (comboFullByCountry[p.code]||0) : countDestacadas(p);
  if(state.subgenero) return subCountPais(p, state.subgenero, state.genero);
  if(state.genero) return p.g[state.genero] || 0;
  return total(p);
}

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
