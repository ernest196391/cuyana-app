// Convierte config/tarifas-mensajeria.csv en un módulo de datos que se empaqueta
// con la app.
//
// El CSV es la fuente de verdad y se edita a mano cuando cambian las tarifas;
// esto lo pasa a JSON para que el servidor NO tenga que leer del disco en
// tiempo de ejecución. En Vercel, un `readFileSync` de un archivo suelto
// depende de que el empaquetador lo haya arrastrado, y cuando no lo hace la
// tienda se cae en producción sin haber fallado nunca en local.
//
//   node scripts/tarifas-a-json.mjs
//
// Hay que volver a correrlo —y subir el JSON— cada vez que se toque el CSV.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const RAIZ = process.cwd();
const ENTRADA = path.join(RAIZ, "config/tarifas-mensajeria.csv");
const SALIDA = path.join(RAIZ, "src/lib/store/tarifasMensajeria.json");

/** Un CSV con comillas: "Actual + 1,000" lleva una coma dentro del campo. */
function campos(linea) {
  const salida = [];
  let valor = "";
  let entreComillas = false;
  for (let i = 0; i < linea.length; i += 1) {
    const c = linea[i];
    if (c === '"') {
      if (entreComillas && linea[i + 1] === '"') {
        valor += '"';
        i += 1;
      } else {
        entreComillas = !entreComillas;
      }
    } else if (c === "," && !entreComillas) {
      salida.push(valor);
      valor = "";
    } else {
      valor += c;
    }
  }
  salida.push(valor);
  return salida;
}

const lineas = readFileSync(ENTRADA, "utf8")
  .replace(/^﻿/, "")
  .split(/\r?\n/)
  .slice(1);

const tarifas = [];
for (const linea of lineas) {
  if (!linea.trim()) continue;
  const [municipio, zona, tarifa, activo] = campos(linea);
  const cup = Number(tarifa);
  if (!municipio?.trim() || !Number.isFinite(cup)) continue;
  if (!/^(yes|si|sí|1|active)$/i.test((activo || "yes").trim())) continue;
  tarifas.push({ municipio: municipio.trim(), zona: zona.trim(), cup });
}

writeFileSync(SALIDA, JSON.stringify(tarifas, null, 2) + "\n");

const municipios = new Set(tarifas.map((t) => t.municipio));
console.log(`${tarifas.length} tarifas activas · ${municipios.size} municipios → ${path.relative(RAIZ, SALIDA)}`);
