import SearchableSelect from './SearchableSelect.jsx'

export default function YearSelector({ value, options = [2025, 2024, 2023], onChange }) {
  const yearOptions = options.map((year) => ({
    id: year,
    name: String(year),
  }))

  return (
    <SearchableSelect
      id="year-selector"
      label="Year"
      value={value}
      onChange={(selected) => {
        const normalized = typeof selected === 'number' ? selected : Number(selected)
        onChange(Number.isNaN(normalized) ? value : normalized)
      }}
      options={yearOptions}
      placeholder="Select year"
      searchPlaceholder="Search years..."
      emptyLabel="No years found"
    />
  )
}

