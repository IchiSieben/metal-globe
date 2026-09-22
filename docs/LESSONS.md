# Lecciones operativas

## Sacar el nombre de un tercero del historial de un repo público

**Cuándo.** Un repo público versiona el nombre de una persona que no consintió aparecer ahí.
Borrarlo en HEAD no alcanza: `git log -p` lo sigue mostrando. Hay que reescribir el historial.

**Hecho en este repo el 2026-09-22.** Resultado: 11 commits → 10 (el commit que quitaba el
nombre en HEAD quedó vacío y `filter-repo` lo podó), árbol de HEAD idéntico byte a byte,
`74fb755` → `968608a`.

### La trampa: no uses el nombre pelado como patrón

Este repo versiona ~195 mil nombres de bandas en `web/data/`. Varios **contienen la cadena
del nombre propio**: unos como subcadena interna, otros como primera palabra seguida de
espacio. Un `--replace-text` con el nombre suelto los corrompe, y —esto es lo que sorprende—
`regex:\bNombre\b` **también**: el límite de palabra no protege contra un nombre de banda
que empieza igual y sigue con espacio.

La regla: **reemplazar la frase mínima de prosa, literal, nunca el nombre solo**. Una línea
por ocurrencia distinta del historial. Se enumeran así, antes de tocar nada:

```bash
git log --all --oneline -S"<nombre>"                      # qué commits lo tocan
git log --all -p -- '*.md' | grep "<nombre>" | sort -u    # las líneas exactas
```

Y antes de elegir el patrón, medir la colisión en los datos:

```bash
git grep -ohE '"n":"[^"]*<nombre>[^"]*"' -- web/data | sort -u
```

### El procedimiento

```bash
# 0. Compuerta: si hay forks, PARAR. Un fork conserva el historial viejo y no se reescribe.
gh repo view <owner>/<repo> --json forkCount,stargazerCount

# 1. Herramienta
py -3 -m pip install git-filter-repo

# 2. Clon fresco, FUERA del directorio de trabajo (filter-repo exige clon limpio,
#    y así la data pesada gitignoreada del working copy no corre riesgo)
git clone https://github.com/<owner>/<repo>.git /ruta/scratch/<repo>-rewrite
cd /ruta/scratch/<repo>-rewrite

# 3. Mapeo: una línea por frase, formato  viejo==>nuevo  (literal por defecto).
#    El archivo contiene el nombre, así que vive en scratch y NUNCA se versiona.
#    Las frases de este caso fueron del tipo:
#      <nombre> (rol) ya tiene==>otra persona del equipo ya tiene
#      lo que <nombre> ve==>lo que esa persona ve
#      nuevo (ej. <nombre>) baja==>nuevo baja
#    Nótese que el reemplazo evita marcar género: describe el rol, no a la persona.
cat > /ruta/scratch/replacements.txt <<'EOF'
<frase vieja 1>==><frase nueva 1>
<frase vieja 2>==><frase nueva 2>
EOF

# 4. Reescritura
git filter-repo --replace-text /ruta/scratch/replacements.txt

# 5. Verificación — las tres, no solo la primera.
#    El conteo crudo NO da 0 si el nombre colisiona con datos legítimos: hay que excluir
#    esas formas con lookaheads y exigir 0 sobre el resto.
git log -p --all | grep -oP '<nombre>(?!<forma legítima A>)(?!<forma legítima B>)' | wc -l
git log --all --format='%s%n%b' | grep -ci "<nombre>"   # mensajes de commit: 0
git rev-parse HEAD^{tree}    # debe igualar el árbol de HEAD previo a la reescritura
git grep -c "<forma legítima A>" HEAD -- web/data       # los datos siguen intactos

# 6. Push. filter-repo borra el remote 'origin' a propósito; hay que reponerlo.
git remote add origin https://github.com/<owner>/<repo>.git
git fetch origin main
git push origin main --force-with-lease=main:$(git rev-parse origin/main)

# 7. Alinear el clon de trabajo (NO re-clonar si tiene data pesada gitignoreada:
#    reset --hard no toca archivos sin trackear ni ignorados)
cd /ruta/working-copy && git fetch origin && git reset --hard origin/main
```

`--force-with-lease` en vez de `--force`: si alguien pusheó entre la lectura y el push, falla
en vez de pisar trabajo ajeno. Necesita que el objeto esperado exista localmente, por eso el
`git fetch origin main` del paso anterior.

### Lo que este procedimiento NO garantiza

- **Los objetos viejos siguen alcanzables por SHA en GitHub** un tiempo después del force
  push. Para que desaparezcan de verdad hay que pedirle a GitHub Support que corra `gc`, o
  recrear el repo. El force push solo los saca de las vistas normales.
- **Cualquier clon existente conserva el historial viejo** y lo reintroduce si alguien
  pushea desde ahí. Hay que re-clonar (o `fetch` + `reset --hard`) en cada máquina.
- **Este archivo no puede citar los ejemplos reales.** Nombrar las cadenas que colisionaban
  reconstruiría el nombre que se acaba de borrar. De ahí los marcadores.
