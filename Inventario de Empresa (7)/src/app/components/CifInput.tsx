import { CheckCircle2, XCircle } from "lucide-react";

// ─────────────────────────────────────────────
// Algoritmos de validación españoles
// ─────────────────────────────────────────────

/** Valida NIF: 8 dígitos + letra de control */
function validateNIF(v: string): boolean {
  const LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";
  const match = v.match(/^(\d{8})([A-Z])$/);
  if (!match) return false;
  return match[2] === LETTERS[parseInt(match[1], 10) % 23];
}

/** Valida NIE: X/Y/Z + 7 dígitos + letra de control */
function validateNIE(v: string): boolean {
  const LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";
  const match = v.match(/^([XYZ])(\d{7})([A-Z])$/);
  if (!match) return false;
  const prefix = { X: "0", Y: "1", Z: "2" }[match[1]] as string;
  const num = parseInt(prefix + match[2], 10);
  return match[3] === LETTERS[num % 23];
}

/** Valida CIF: letra inicial + 7 dígitos + control (letra o dígito) */
function validateCIF(v: string): boolean {
  const match = v.match(/^([ABCDEFGHJKLMNPQRSUVW])(\d{7})([0-9A-J])$/);
  if (!match) return false;

  const digits = match[2];
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    let d = parseInt(digits[i], 10);
    if (i % 2 === 0) {
      // posición impar en base-1 (0-based par): multiplicar × 2
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  const control = (10 - (sum % 10)) % 10;
  const controlLetter = "JABCDEFGHI"[control];
  const last = match[3];
  const first = match[1];

  // Organismos públicos y asociaciones solo admiten letra
  if ("KPQSW".includes(first)) return last === controlLetter;
  // Resto puede ser letra o dígito
  return last === controlLetter || last === String(control);
}

// ─────────────────────────────────────────────
// Función principal de validación
// ─────────────────────────────────────────────

export type CifValidationResult =
  | { valid: true;  type: "NIF" | "NIE" | "CIF" }
  | { valid: false; type: null };

export function validateCifNifNie(raw: string): CifValidationResult {
  const v = raw.toUpperCase().trim();
  if (v.length === 9) {
    if (validateNIF(v)) return { valid: true, type: "NIF" };
    if (validateNIE(v)) return { valid: true, type: "NIE" };
    if (validateCIF(v)) return { valid: true, type: "CIF" };
  }
  return { valid: false, type: null };
}

// ────────────────���────────────────────────────
// Componente CifInput
// ─────────────────────────────────────────────

interface CifInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  className?: string;
  accentColor?: string; // ring y focus color, ej: "focus:ring-[#3b82f6]"
}

export function CifInput({
  value,
  onChange,
  required = false,
  error,
  accentColor = "focus:ring-[#3b82f6]",
}: CifInputProps) {
  const displayValue = value.toUpperCase();
  const filled = displayValue.length === 9;
  const result = filled ? validateCifNifNie(displayValue) : null;

  // Estado visual del borde
  const borderClass = error
    ? "border-red-500 focus:ring-red-400"
    : filled && result
    ? result.valid
      ? "border-green-500 focus:ring-green-400"
      : "border-red-500 focus:ring-red-400"
    : `border-[#d1d5db] ${accentColor}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Solo alfanumérico, máx 9 caracteres, auto-mayúscula
    const raw = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 9);
    onChange(raw);
  };

  return (
    <div>
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          required={required}
          maxLength={9}
          placeholder="B12345678"
          spellCheck={false}
          autoComplete="off"
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm md:text-base pr-9 font-mono tracking-wide ${borderClass}`}
        />

        {/* Icono de estado (solo cuando hay 9 caracteres) */}
        {filled && result && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {result.valid ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
          </div>
        )}
      </div>

      {/* Mensaje de error externo (CIF duplicado, etc.) */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Validación en tiempo real cuando hay 9 caracteres */}
      {!error && filled && result && (
        result.valid ? (
          <p className="mt-1 text-sm text-green-600">
            {result.type} válido ✓
          </p>
        ) : (
          <p className="mt-1 text-sm text-red-600">
            Dígito de control incorrecto. Comprueba el CIF.
          </p>
        )
      )}
    </div>
  );
}