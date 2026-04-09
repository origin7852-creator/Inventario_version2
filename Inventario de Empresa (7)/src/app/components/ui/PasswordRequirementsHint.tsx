interface PasswordRequirementsHintProps {
  password?: string;
}

const REQUIREMENTS = [
  { label: "Mínimo 8 caracteres",               test: (p: string) => p.length >= 8 },
  { label: "Al menos una mayúscula (A‑Z)",       test: (p: string) => /[A-Z]/.test(p) },
  { label: "Al menos una minúscula (a‑z)",       test: (p: string) => /[a-z]/.test(p) },
  { label: "Al menos un número (0‑9)",           test: (p: string) => /[0-9]/.test(p) },
  { label: "Al menos un carácter especial (!@#$%…)", test: (p: string) => /[!@#$%^&*()\-_=+[\]{};':"\\|,.<>/?`~]/.test(p) },
];

export function PasswordRequirementsHint({ password = "" }: PasswordRequirementsHintProps) {
  return (
    <div className="mt-2 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 py-2.5">
      <p className="text-xs text-[#6b7280] mb-1.5">La contraseña debe contener:</p>
      <ul className="space-y-1">
        {REQUIREMENTS.map(({ label, test }) => {
          const met = password.length > 0 && test(password);
          return (
            <li key={label} className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full flex-shrink-0 transition-colors ${
                  met ? "bg-green-500" : "bg-[#d1d5db]"
                }`}
              >
                {met && (
                  <svg viewBox="0 0 10 8" className="w-2 h-2 fill-white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                )}
              </span>
              <span className={`text-xs transition-colors ${met ? "text-green-700" : "text-[#6b7280]"}`}>
                {label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
