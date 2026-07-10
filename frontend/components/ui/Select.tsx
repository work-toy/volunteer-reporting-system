"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface Props {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}

export default function Select({ label, value, onChange, options, placeholder = "请选择", className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  // 点击外部关闭
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) {
        const dropdown = document.getElementById("select-dropdown");
        if (dropdown && !dropdown.contains(e.target as Node)) setOpen(false);
        if (!dropdown) setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // 打开时计算位置
  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  }, [open]);

  const selected = options.find(o => String(o.value) === String(value));

  return (
    <div className={className}>
      {label && <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">{label}</label>}
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="glass-input w-full flex items-center justify-between gap-2 cursor-pointer text-sm"
      >
        <span className={selected ? "text-slate-700 dark:text-slate-200" : "text-slate-400"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={14} className={`text-indigo-500 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && typeof window === "object" && createPortal(
        <div
          id="select-dropdown"
          className="fixed z-[9999] rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-xl overflow-hidden"
          style={{ top: pos.top, left: pos.left, width: pos.width }}
        >
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-400 text-center">暂无选项</div>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              {options.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                    String(o.value) === String(value)
                      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
