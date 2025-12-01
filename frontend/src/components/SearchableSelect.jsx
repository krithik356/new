import { useEffect, useRef, useState } from 'react'

export default function SearchableSelect({
  id,
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  className = '',
  includeAllOption = false,
  allOptionLabel = 'All options',
  allOptionValue = 'all',
  searchPlaceholder = 'Search options...',
  emptyLabel = 'No options found',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  const normalizedValue = value ?? ''
  const selectedOption = options.find((opt) => String(opt.id) === String(normalizedValue))

  const filteredOptions = options.filter((option) =>
    option.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (optionId) => {
    onChange(optionId)
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <label className="text-xs font-medium uppercase tracking-widest text-slate-500" htmlFor={id}>
        {label}
      </label>
      <div className="mt-2">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2.5 text-left text-sm text-slate-100 shadow-inner shadow-black/30 transition hover:border-slate-700 focus:border-emerald-400/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        >
          <div className="flex items-center justify-between">
            <span className={selectedOption ? 'text-slate-100' : 'text-slate-500'}>
              {selectedOption ? selectedOption.name : placeholder}
            </span>
            <svg
              className={`h-5 w-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-2xl border border-slate-800 bg-slate-950/95 shadow-2xl shadow-black/50 backdrop-blur-sm">
            <div className="p-2">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                onClick={(event) => event.stopPropagation()}
              />
            </div>
            <div className="max-h-60 overflow-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-400">{emptyLabel}</div>
              ) : (
                <>
                  {includeAllOption && (
                    <button
                      type="button"
                      onClick={() => handleSelect(allOptionValue)}
                      className={`w-full px-4 py-2.5 text-left text-sm transition ${
                        String(normalizedValue) === String(allOptionValue)
                          ? 'bg-emerald-500/20 text-emerald-200'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                      }`}
                    >
                      {allOptionLabel}
                    </button>
                  )}
                  {filteredOptions.map((option) => {
                    const isSelected = String(option.id) === String(normalizedValue)
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleSelect(option.id)}
                        className={`w-full px-4 py-2.5 text-left text-sm transition ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-200'
                            : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                        }`}
                      >
                        {option.name}
                      </button>
                    )
                  })}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


