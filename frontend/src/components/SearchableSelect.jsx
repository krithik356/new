import { useState, useRef, useEffect } from 'react'

export default function SearchableSelect({
  id,
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyLabel = 'No options found',
  includeAllOption = false,
  allOptionLabel = 'All',
  allOptionValue = 'all',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const filteredOptions = options.filter((option) =>
    option.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const displayOptions = includeAllOption
    ? [{ id: allOptionValue, name: allOptionLabel }, ...filteredOptions]
    : filteredOptions

  const selectedOption = options.find((opt) => String(opt.id) === String(value)) || 
    (includeAllOption && value === allOptionValue ? { id: allOptionValue, name: allOptionLabel } : null)

  const handleSelect = (optionId) => {
    onChange(optionId)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <div ref={containerRef} className={`relative flex flex-col ${className}`}>
      <label className="text-xs font-medium uppercase tracking-widest text-slate-500" htmlFor={id}>
        {label}
      </label>
      <button
        type="button"
        id={id}
        onClick={() => setIsOpen(!isOpen)}
        className="mt-1 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-left text-sm text-slate-100 shadow-inner shadow-black/30 focus:border-emerald-400/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
      >
        <span className={selectedOption ? 'text-slate-100' : 'text-slate-500'}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <span className="ml-2 text-slate-400">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-2xl border border-slate-800/70 bg-slate-950/95 shadow-2xl">
          <div className="p-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {displayOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-500">{emptyLabel}</div>
            ) : (
              displayOptions.map((option) => {
                const isSelected = String(option.id) === String(value)
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelect(option.id)}
                    className={`w-full px-4 py-2 text-left text-sm transition ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-200'
                        : 'text-slate-200 hover:bg-slate-900/80'
                    }`}
                  >
                    {option.name}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

