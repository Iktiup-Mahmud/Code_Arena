"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const SUPPORTED_LANGUAGES = [
  { id: "javascript", name: "JavaScript", monacoId: "javascript" },
  { id: "python", name: "Python", monacoId: "python" },
  { id: "java", name: "Java", monacoId: "java" },
  { id: "cpp", name: "C++", monacoId: "cpp" },
  { id: "typescript", name: "TypeScript", monacoId: "typescript" },
  { id: "go", name: "Go", monacoId: "go" },
  { id: "rust", name: "Rust", monacoId: "rust" },
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]["id"];

interface LanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function LanguageSelector({
  value,
  onChange,
  disabled = false,
}: LanguageSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700 text-slate-200">
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent className="bg-slate-800 border-slate-700">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <SelectItem
            key={lang.id}
            value={lang.id}
            className="text-slate-200 focus:bg-slate-700 focus:text-white"
          >
            {lang.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

