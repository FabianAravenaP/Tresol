"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDownIcon } from "lucide-react"

const SelectContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
  open?: boolean
  setOpen?: (open: boolean) => void
  displayLabel?: string
  setDisplayLabel?: (label: string) => void
}>({})

function Select({ children, value, onValueChange, defaultValue }: any) {
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const [open, setOpen] = React.useState(false)
  const [displayLabel, setDisplayLabel] = React.useState("")

  const v = value !== undefined ? value : internalValue
  
  const onChange = (newValue: string) => {
    if (onValueChange) onValueChange(newValue)
    else setInternalValue(newValue)
    setOpen(false)
  }

  // Handle value reset or change from outside
  React.useEffect(() => {
    if (!v) setDisplayLabel("")
  }, [v])

  // Close on click outside
  const containerRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  return (
    <SelectContext.Provider value={{ 
      value: v, 
      onValueChange: onChange, 
      open, 
      setOpen,
      displayLabel,
      setDisplayLabel
    }}>
      <div ref={containerRef} className="relative w-full">{children}</div>
    </SelectContext.Provider>
  )
}

function SelectGroup({ className, ...props }: any) {
  return <div className={cn("p-1", className)} {...props} />
}

function SelectValue({ placeholder, className }: any) {
  const { value, displayLabel } = React.useContext(SelectContext)
  return (
    <span className={cn("truncate", className)}>
      {displayLabel || placeholder || value}
    </span>
  )
}

function SelectTrigger({ className, children, ...props }: any) {
  const { open, setOpen } = React.useContext(SelectContext)
  
  return (
    <div
      onClick={() => setOpen?.(!open)}
      className={cn(
        "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer select-none",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDownIcon className={cn("h-4 w-4 opacity-50 transition-transform duration-200", open && "rotate-180")} />
    </div>
  )
}

function SelectContent({ className, children, ...props }: any) {
  const { open } = React.useContext(SelectContext)
  
  return (
    <div
      className={cn(
        "absolute top-full left-0 z-50 mt-1 min-w-[8rem] w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md transition-all duration-200",
        open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none",
        className
      )}
      {...props}
    >
      <div className="p-1 max-h-[300px] overflow-auto">{children}</div>
    </div>
  )
}

function SelectLabel({ className, ...props }: any) {
  return <div className={cn("px-2 py-1.5 text-sm font-semibold", className)} {...props} />
}

function SelectItem({ className, children, value, ...props }: any) {
  const { value: selectedValue, onValueChange, setDisplayLabel } = React.useContext(SelectContext)
  const isSelected = selectedValue === value

  // Register display label when this item is selected
  React.useEffect(() => {
    if (isSelected && setDisplayLabel) {
      // If children is an array or complex element, we try to extract the text
      const getText = (node: any): string => {
        if (!node) return ""
        if (typeof node === "string") return node
        if (Array.isArray(node)) return node.map(getText).join("")
        if (node.props?.children) return getText(node.props.children)
        return String(node)
      }
      setDisplayLabel(getText(children))
    }
  }, [isSelected, children, setDisplayLabel])

  return (
    <div
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 transition-colors",
        isSelected && "bg-accent text-accent-foreground font-medium",
        className
      )}
      onClick={(e) => {
        e.stopPropagation()
        onValueChange?.(value)
      }}
      {...props}
    >
      {children}
    </div>
  )
}

function SelectSeparator({ className, ...props }: any) {
  return <div className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
}

const SelectScrollUpButton = () => null
const SelectScrollDownButton = () => null

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}