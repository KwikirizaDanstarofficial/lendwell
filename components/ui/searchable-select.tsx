"use client"

import { useState, useRef, useEffect } from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SearchableSelectOption {
  value: string
  label: string
  sub?: string
}

interface SearchableSelectProps {
  name?: string
  options: SearchableSelectOption[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  required?: boolean
  disabled?: boolean
}

export function SearchableSelect({
  name,
  options,
  value: controlledValue,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  className,
  required,
  disabled,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState(controlledValue ?? "")
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Sync when controlled value changes externally
  useEffect(() => {
    if (controlledValue !== undefined) setSelected(controlledValue)
  }, [controlledValue])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 10)
    }
  }, [open])

  const filtered = options.filter((o) => {
    const q = search.toLowerCase()
    return (
      (o.label ?? "").toLowerCase().includes(q) ||
      (o.sub?.toLowerCase().includes(q) ?? false)
    )
  })

  const selectedOption = options.find((o) => o.value === selected)

  const handleSelect = (val: string) => {
    setSelected(val)
    onChange?.(val)
    setOpen(false)
    setSearch("")
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {name && (
        <input
          type="hidden"
          name={name}
          value={selected}
          required={required}
        />
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((p) => !p)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !selected && "text-muted-foreground"
        )}
      >
        {selectedOption ? (
          <span className="flex flex-1 items-center gap-1.5 truncate text-left text-foreground">
            {selectedOption.label}
            {selectedOption.sub && (
              <span className="text-xs text-muted-foreground">
                · {selectedOption.sub}
              </span>
            )}
          </span>
        ) : (
          <span className="flex-1 truncate text-left">{placeholder}</span>
        )}
        <ChevronDown
          className={cn(
            "ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-md">
          {/* Search input */}
          <div className="p-2 pb-1">
            <div className="flex items-center gap-2 rounded-md border border-input bg-input/20 px-2.5 py-1.5">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <input
                ref={searchRef}
                className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-56 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                {emptyText}
              </p>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-foreground transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    selected === option.value &&
                      "bg-accent text-accent-foreground"
                  )}
                >
                  <Check
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      selected === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="flex-1 truncate text-left">
                    {option.label}
                  </span>
                  {option.sub && (
                    <span className="ml-auto shrink-0 text-muted-foreground">
                      {option.sub}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
