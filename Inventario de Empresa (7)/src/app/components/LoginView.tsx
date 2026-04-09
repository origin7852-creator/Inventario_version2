import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Loader2, CheckCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { resetPasswordDirect } from "../utils/supabase";
import { validateEmail, validatePassword } from "../utils/validation";
import { PasswordRequirementsHint } from "./ui/PasswordRequirementsHint";

interface LoginViewProps {
  onLogin: (email: string, password: string, userType?: "normal" | "accounting") => Promise<{ success: boolean; error?: string } | void>;
  onSwitchToRegister: () => void;
}

export function LoginView({ onLogin, onSwitchToRegister }: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [showKeepSessionModal, setShowKeepSessionModal] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;

    if (!password) {
      newErrors.password = "La contraseña es requerida";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Mostrar el modal de mantener sesión antes de hacer login
      setShowKeepSessionModal(true);
    }
  };

  const proceedWithLogin = async (keepSession: boolean) => {
    setShowKeepSessionModal(false);
    setIsLoggingIn(true);

    // Guardar preferencia de sesión en localStorage
    localStorage.setItem("keepSession", keepSession ? "true" : "false");

    const result = await onLogin(email, password);
    setIsLoggingIn(false);

    if (result && !result.success) {
      const errorMsg = result.error || "Credenciales incorrectas";

      if (errorMsg.toLowerCase().includes("correo o contraseña incorrectos") ||
          errorMsg.toLowerCase().includes("invalid login credentials") ||
          errorMsg.toLowerCase().includes("invalid credentials")) {
        setErrors({ 
          email: "Correo electrónico o contraseña incorrectos.",
          password: "Correo electrónico o contraseña incorrectos."
        });
      } else if (errorMsg.toLowerCase().includes("usuario no encontrado") ||
                 errorMsg.toLowerCase().includes("user not found")) {
        setErrors({ email: "Usuario no encontrado. Verifica tu correo electrónico." });
      } else if (errorMsg.toLowerCase().includes("confirmar") ||
                 errorMsg.toLowerCase().includes("not confirmed")) {
        setErrors({ email: "Debes confirmar tu correo antes de iniciar sesión." });
      } else if (errorMsg.toLowerCase().includes("conexión") ||
                 errorMsg.toLowerCase().includes("servidor")) {
        setErrors({
          email: "Error de conexión. Verifica tu internet.",
          password: "Error de conexión. Verifica tu internet.",
        });
      } else {
        setErrors({ password: errorMsg || "Credenciales incorrectas." });
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;

    const emailErr = validateEmail(resetEmail);
    if (emailErr) { setResetError(emailErr); return; }

    const pwErr = validatePassword(resetNewPassword);
    if (pwErr) { setResetError(pwErr); return; }

    if (resetNewPassword !== resetConfirmPassword) {
      setResetError("Las contraseñas no coinciden.");
      return;
    }

    setIsSendingReset(true);
    setResetError(null);

    try {
      await resetPasswordDirect(resetEmail.toLowerCase(), resetNewPassword);
      setResetDone(true);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    } finally {
      setIsSendingReset(false);
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
            Iniciar Sesión
          </h1>
          <p className="text-[#6b7280]">
            Accede al Sistema de Gestión de Inventario
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <Label htmlFor="email" className="text-[#374151] mb-2 block">
              Correo Electrónico
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@centromaster.com"
                className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password" className="text-[#374151] mb-2 block">
              Contraseña
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
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#374151]"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Botón de Olvidé mi Contraseña */}
          <div className="flex justify-end text-sm">
            <button
              type="button"
              className="text-[#3b82f6] hover:underline"
              onClick={() => setShowForgotPassword(true)}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* Botón Submit */}
          <Button
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white py-6 disabled:opacity-60"
          >
            {isLoggingIn ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Entrando...
              </span>
            ) : (
              "Iniciar Sesión"
            )}
          </Button>
        </form>

        {/* Link a Registro */}
        <div className="mt-6 text-center">
          <p className="text-[#6b7280] text-sm">
            ¿No tienes una cuenta?{" "}
            <button
              onClick={onSwitchToRegister}
              className="text-[#3b82f6] hover:underline font-medium"
            >
              Regístrate aquí
            </button>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-[#9ca3af]">
          <p>Sistema de Gestión de Inventario v1.0.0</p>
          <p className="mt-1">© 2026 Centro Master</p>
        </div>
      </Card>

      {/* Modal ¿Mantener sesión abierta? */}
      {showKeepSessionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center gap-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Icono */}
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-[#3b82f6]" />
            </div>

            {/* Texto */}
            <div className="text-center">
              <h2 className="text-lg font-semibold text-[#111827]">
                ¿Desea mantener la sesión abierta?
              </h2>
            </div>

            {/* Botones */}
            <div className="flex gap-3 w-full">
              <button
                onClick={() => proceedWithLogin(false)}
                className="flex-1 py-3 rounded-xl border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] transition-colors font-medium"
              >
                No
              </button>
              <button
                onClick={() => proceedWithLogin(true)}
                className="flex-1 py-3 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white transition-colors font-medium"
              >
                Sí
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Recuperar Contraseña */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-8">
            <h2 className="text-xl font-semibold text-[#111827] mb-2">
              Restablecer Contraseña
            </h2>
            <p className="text-[#6b7280] text-sm mb-6">
              Introduce tu correo y la nueva contraseña que quieres usar.
            </p>

            {!resetDone ? (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                {/* Email */}
                <div>
                  <Label htmlFor="resetEmail" className="text-[#374151] mb-2 block">
                    Correo Electrónico
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
                    <Input
                      id="resetEmail"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => { setResetEmail(e.target.value); setResetError(null); }}
                      placeholder="usuario@centromaster.com"
                      className="pl-10"
                      required
                      disabled={isSendingReset}
                    />
                  </div>
                </div>

                {/* Nueva contraseña */}
                <div>
                  <Label htmlFor="resetNewPassword" className="text-[#374151] mb-2 block">
                    Nueva Contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
                    <Input
                      id="resetNewPassword"
                      type={showResetPassword ? "text" : "password"}
                      value={resetNewPassword}
                      onChange={(e) => { setResetNewPassword(e.target.value); setResetError(null); }}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      required
                      disabled={isSendingReset}
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#374151]"
                    >
                      {showResetPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <PasswordRequirementsHint password={resetNewPassword} />
                </div>

                {/* Confirmar contraseña */}
                <div>
                  <Label htmlFor="resetConfirmPassword" className="text-[#374151] mb-2 block">
                    Confirmar Nueva Contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
                    <Input
                      id="resetConfirmPassword"
                      type={showResetConfirmPassword ? "text" : "password"}
                      value={resetConfirmPassword}
                      onChange={(e) => { setResetConfirmPassword(e.target.value); setResetError(null); }}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      required
                      disabled={isSendingReset}
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#374151]"
                    >
                      {showResetConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {resetError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-sm">{resetError}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmail("");
                      setResetNewPassword("");
                      setResetConfirmPassword("");
                      setResetDone(false);
                      setResetError(null);
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-6"
                    disabled={isSendingReset}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-[#3b82f6] hover:bg-[#2563eb] text-white py-6 disabled:opacity-60"
                    disabled={isSendingReset}
                  >
                    {isSendingReset ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Guardando...
                      </span>
                    ) : (
                      "Guardar contraseña"
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-[#111827] font-medium mb-2">
                  ¡Contraseña actualizada!
                </p>
                <p className="text-[#6b7280] text-sm mb-6">
                  Ya puedes iniciar sesión con tu nueva contraseña.
                </p>
                <Button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmail("");
                    setResetNewPassword("");
                    setResetConfirmPassword("");
                    setResetDone(false);
                  }}
                  className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white py-6"
                >
                  Volver al inicio de sesión
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}