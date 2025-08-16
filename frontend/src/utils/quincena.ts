// Utilidades para calcular quincenas y formateos

export type Periodo = { inicio: string; fin: string }; // YYYY-MM-DD

function pad(n: number) {
  return `${n}`.padStart(2, "0");
}

export function hoyISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function quincenaActual(): Periodo {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const firstDay = `${y}-${pad(m + 1)}-01`;
  const lastDayMonth = new Date(y, m + 1, 0).getDate();
  const mid = `${y}-${pad(m + 1)}-15`;
  const end = `${y}-${pad(m + 1)}-${pad(lastDayMonth)}`;

  if (d <= 15) return { inicio: firstDay, fin: mid };
  return { inicio: `${y}-${pad(m + 1)}-16`, fin: end };
}

export function quincenaAnterior(): Periodo {
  const { inicio, fin } = quincenaActual();
  const dIni = new Date(inicio);
  const dFin = new Date(fin);
  // Si estamos en la 1ra quincena, la anterior es 16–fin del mes pasado
  if (dFin.getDate() === 15) {
    const prev = new Date(dIni);
    prev.setMonth(prev.getMonth() - 1);
    const y = prev.getFullYear();
    const m = prev.getMonth();
    const last = new Date(y, m + 1, 0).getDate();
    return { inicio: `${y}-${pad(m + 1)}-16`, fin: `${y}-${pad(m + 1)}-${pad(last)}` };
  }
  // Si estamos en la 2da, la anterior es 1–15 del mes actual
  return { inicio: `${dIni.getFullYear()}-${pad(dIni.getMonth() + 1)}-01`, fin: `${dIni.getFullYear()}-${pad(dIni.getMonth() + 1)}-15` };
}
