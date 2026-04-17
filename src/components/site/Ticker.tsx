const ITEMS = [
  "Chevi Guzmán bate el récord de pista en 500m",
  "Liga Nacional 3ª División · Jornada 4 en curso",
  "Open Madrid 2026 · Inscripciones abiertas",
  "Daniel Milagros convocado con la selección española",
  "Adrián Alonso · Nuevo patrocinador con Bont Skates",
  "Campeonato Internacional Bogotá · Resultados disponibles",
  "Livio Wenger debuta en la Liga Nacional 2026",
];

export function Ticker() {
  const repeated = [...ITEMS, ...ITEMS];
  return (
    <div className="flex h-9 items-center overflow-hidden bg-gold">
      <div className="flex h-full flex-shrink-0 items-center bg-background px-4">
        <span className="font-display text-sm tracking-widest text-gold">EN VIVO</span>
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="ticker-track">
          {repeated.map((item, i) => (
            <div
              key={i}
              className="font-condensed flex flex-shrink-0 items-center gap-2 px-8 text-xs font-bold uppercase tracking-wider text-background"
            >
              <span className="h-1 w-1 rounded-full bg-background/40" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
