import { useState } from "react";
import { Eye, EyeOff, Lock, CheckCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { supabase } from "../utils/supabase";
import { validatePassword } from "../utils/validation";
import { PasswordRequirementsHint } from "./ui/PasswordRequirementsHint";

interface ResetPasswordViewProps {
  onSuccess: () => void;
}

export function ResetPasswordView({ onSuccess }: ResetPasswordViewProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {};

    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirma tu nueva contraseña";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setGeneralError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setGeneralError(
          error.message.includes("same password")
            ? "La nueva contraseña no puede ser igual a la anterior."
            : "Error al actualizar la contraseña. El enlace puede haber expirado."
        );
        return;
      }

      setSuccess(true);
    } catch (err) {
      setGeneralError("Ocurrió un error inesperado. Por favor, inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3b82f6] to-[#2563eb] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        {/* Logo y Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#3b82f6] rounded-xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-[#111827] mb-2">
            Nueva contraseña
          </h1>
          <p className="text-[#6b7280]">
            Introduce tu nueva contraseña para acceder al sistema
          </p>
        </div>

        {success ? (
          /* ── Pantalla de éxito ── */
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-9 h-9 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-[#111827] mb-3">
              ✅ Contraseña actualizada correctamente
            </h2>
            <p className="text-[#6b7280] text-sm mb-6">
              Ya puedes iniciar sesión con tu nueva contraseña.
            </p>
            <Button
              onClick={onSuccess}
              className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white py-6"
            >
              Ir al inicio de sesión
            </Button>
          </div>
        ) : (
          /* ── Formulario ── */
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nueva contraseña */}
            <div>
              <Label htmlFor="password" className="text-[#374151] mb-2 block">
                Nueva contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`pl-10 pr-10 ${errors.password ? "border-red-500" : ""}`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#374151]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
              <PasswordRequirementsHint password={password} />
            </div>

            {/* Confirmar contraseña */}
            <div>
              <Label htmlFor="confirmPassword" className="text-[#374151] mb-2 block">
                Confirmar nueva contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`pl-10 pr-10 ${errors.confirmPassword ? "border-red-500" : ""}`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#374151]"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Error general */}
            {generalError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{generalError}</p>
              </div>
            )}

            {/* Botón submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white py-6 disabled:opacity-60"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : (
                "Guardar nueva contraseña"
              )}
            </Button>
          </form>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-[#9ca3af]">
          <p>Sistema de Gestión de Inventario v1.0.0</p>
          <p className="mt-1">© 2026 Centro Master</p>
        </div>
      </Card>
    </div>
  );
}
