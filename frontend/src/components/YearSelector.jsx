export default function YearSelector({ value, options = [2025, 2024, 2023], onChange }) {
  return (
    <label className="flex flex-col text-xs font-medium uppercase tracking-widest text-slate-500">
      Year
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 shadow-inner shadow-black/30 focus:border-emerald-400/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
      >
        {options.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </label>
  )
}

