"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface Props {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  dir?: "ltr" | "rtl";
  required?: boolean;
  filterMode?: "contains" | "startsWith";
}

export function Autocomplete({
  label,
  value,
  onChange,
  options,
  placeholder,
  dir,
  required,
  filterMode = "contains",
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = useMemo(() => {
    if (!value) return options;
    const lower = value.toLowerCase();
    return options.filter((opt) =>
      filterMode === "startsWith"
        ? opt.toLowerCase().startsWith(lower)
        : opt.toLowerCase().includes(lower)
    );
  }, [value, options, filterMode]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlight(-1);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (highlight < 0 || !listRef.current) return;
    const el = listRef.current.children[highlight] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIsOpen(true);
      setHighlight((h) => (h + 1) % Math.max(filtered.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h <= 0 ? filtered.length - 1 : h - 1));
    } else if (e.key === "Enter") {
      if (isOpen && highlight >= 0 && filtered[highlight]) {
        e.preventDefault();
        onChange(filtered[highlight]);
        setIsOpen(false);
        setHighlight(-1);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlight(-1);
    }
  }

  return (
    <div ref={containerRef} className="w-full relative">
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
          setHighlight(-1);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        dir={dir}
        required={required}
        autoComplete="off"
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-input-border bg-card focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors focus:ring-2"
        style={dir === "ltr" ? { direction: "ltr", textAlign: "left" } : undefined}
      />
      {isOpen && filtered.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-border bg-card shadow-md"
          dir={dir}
        >
          {filtered.map((opt, idx) => (
            <li
              key={opt}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(opt);
                setIsOpen(false);
                setHighlight(-1);
              }}
              className={`px-3 py-2 cursor-pointer text-sm hover:bg-accent ${
                highlight === idx ? "bg-accent" : ""
              }`}
              style={dir === "ltr" ? { direction: "ltr", textAlign: "left" } : undefined}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
