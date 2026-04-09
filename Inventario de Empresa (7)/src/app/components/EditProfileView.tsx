import { validatePassword, validateEmail } from "../utils/validation";
import { PasswordRequirementsHint } from "./ui/PasswordRequirementsHint";
import { useState, useEffect, useRef } from "react";
import {
  User, Mail, Lock, Save, Eye, EyeOff, ShieldAlert,
  Camera, Trash2, CheckCircle2, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import * as api from "../utils/api";

interface EditProfileViewProps {
  currentUser: { name: string; email: string; avatar?: string } | null;
  userId: string | undefined;
  onProfileUpdated: (updatedUser: { name: string; email: string; avatar?: string }) => void;
}

export function EditProfileView({
  currentUser,
  userId,
  onProfileUpdated,
}: EditProfileViewProps) {
  // ── Información personal ──
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");

  // ── Avatar ──
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentUser?.avatar || null);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Contraseña ��─
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordVerified, setPasswordVerified] = useState<boolean | null>(null);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);

  // ── Estado general ──
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar avatar guardado en kv_store al montar
  useEffect(() => {
    if (!userId) return;
    if (currentUser?.avatar) {
      setAvatarPreview(currentUser.avatar);
      return;
    }
    setIsLoadingAvatar(true);
    api.getUserAvatar(userId)
      .then((avatar) => {
        if (avatar) setAvatarPreview(avatar);
      })
      .catch(() => {})
      .finally(() => setIsLoadingAvatar(false));
  }, [userId]);

  // Verificar contraseña actual cuando el usuario deja de escribir (debounce)
  useEffect(() => {
    if (!currentPassword || !currentUser?.email) {
      setPasswordVerified(null);
      return;
    }
    const timer = setTimeout(async () => {
      setIsVerifyingPassword(true);
      try {
        const result = await api.loginUser(currentUser.email, currentPassword);
        setPasswordVerified(result.success);
        if (!result.success) {
          setErrors(prev => ({ ...prev, currentPassword: "Contraseña actual incorrecta" }));
        } else {
          setErrors(prev => { const e = { ...prev }; delete e.currentPassword; return e; });
        }
      } catch {
        setPasswordVerified(false);
      } finally {
        setIsVerifyingPassword(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [currentPassword, currentUser?.email]);

  // ── Manejo de avatar ──
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Archivo no válido", { description: "Por favor selecciona una imagen (JPG, PNG, etc.)" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagen demasiado grande", { description: "El tamaño máximo permitido es 2 MB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setAvatarPreview(result);
      setAvatarChanged(true);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setAvatarChanged(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Validación ──
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "El nombre es requerido";

    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;

    // Sección contraseña: solo validar si el usuario quiere cambiarla
    if (newPassword || currentPassword) {
      if (!currentPassword) {
        newErrors.currentPassword = "Ingresa tu contraseña actual para continuar";
      } else if (passwordVerified === false) {
        newErrors.currentPassword = "Contraseña actual incorrecta";
      } else if (passwordVerified === null && currentPassword) {
        newErrors.currentPassword = "Verificando contraseña...";
      }

      const passwordError = validatePassword(newPassword);
      if (passwordError) newErrors.newPassword = passwordError;

      if (newPassword !== confirmPassword) {
        newErrors.confirmPassword = "Las contraseñas no coinciden";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Guardar ──
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (!userId) {
      toast.error("No se pudo identificar al usuario. Recarga la pgina e intenta de nuevo.");
      return;
    }

    // Si el usuario quiere cambiar contraseña, verificar una última vez
    if (newPassword && passwordVerified !== true) {
      toast.error("Verifica tu contraseña actual antes de continuar.");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Actualizar datos del usuario en la tabla users
      const updateData: Record<string, string> = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
      };
      if (newPassword) {
        updateData.password = newPassword;
      }
      await api.updateUser(userId, updateData);

      // 2. Guardar/eliminar avatar en kv_store
      let finalAvatar: string | undefined = undefined;
      if (avatarChanged) {
        if (avatarPreview) {
          await api.saveUserAvatar(userId, avatarPreview);
          finalAvatar = avatarPreview;
        } else {
          // Eliminar avatar: guardar cadena vacía
          await api.saveUserAvatar(userId, "");
          finalAvatar = undefined;
        }
      } else if (avatarPreview) {
        finalAvatar = avatarPreview;
      }

      // 3. Notificar al padre
      onProfileUpdated({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        avatar: finalAvatar,
      });

      // 4. Limpiar campos de contraseña
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordVerified(null);
      setAvatarChanged(false);

      toast.success("Perfil actualizado correctamente", {
        description: "Los cambios han sido guardados en la base de datos.",
      });
    } catch (error: any) {
      console.error("Error al actualizar perfil:", error);
      const msg = error?.message || "No se pudieron guardar los cambios";
      toast.error("Error al actualizar perfil", { description: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const avatarLetter = name ? name.charAt(0).toUpperCase() : "?";
  const wantsToChangePassword = !!(currentPassword || newPassword || confirmPassword);

  return (
    <div className="p-4 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#111827] mb-2">Editar Perfil</h1>
          <p className="text-[#6b7280]">
            Actualiza tu información personal y contraseña.
          </p>
        </div>

        {/* Card principal */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-6 lg:p-8">

          {/* ── Avatar ── */}
          <div className="flex flex-col sm:flex-row items-center gap-5 mb-8 pb-6 border-b border-[#e5e7eb]">
            {/* Círculo del avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-[#3b82f6] flex items-center justify-center ring-4 ring-[#dbeafe]">
                {isLoadingAvatar ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-white">{avatarLetter}</span>
                )}
              </div>
              {/* Botón cámara */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving}
                className="absolute bottom-0 right-0 w-8 h-8 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-full flex items-center justify-center shadow-md transition-colors disabled:opacity-50"
                title="Cambiar foto"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFileChange}
                disabled={isSaving}
              />
            </div>

            {/* Info + acciones */}
            <div className="flex-1 text-center sm:text-left">
              <p className="font-semibold text-[#111827] truncate">{name || "—"}</p>
              <p className="text-sm text-[#6b7280] truncate">{email || "—"}</p>

              <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSaving}
                  className="text-xs text-[#3b82f6] hover:text-[#2563eb] border border-[#bfdbfe] hover:border-[#93c5fd] bg-[#eff6ff] rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  <Camera className="w-3.5 h-3.5" />
                  {avatarPreview ? "Cambiar foto" : "Subir foto"}
                </button>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={isSaving}
                    className="text-xs text-[#dc2626] hover:text-[#b91c1c] border border-[#fecaca] hover:border-[#fca5a5] bg-[#fef2f2] rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar foto
                  </button>
                )}
              </div>
              <p className="text-xs text-[#9ca3af] mt-1.5">JPG, PNG o GIF · máx. 2 MB</p>
            </div>
          </div>

          {!userId && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-yellow-700">
                No se ha podido cargar tu identificador de usuario. Recarga la página para poder guardar cambios.
              </p>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">

            {/* ── Información personal ── */}
            <div>
              <h3 className="font-medium text-[#111827] mb-4">Información personal</h3>
              <div className="space-y-4">

                {/* Nombre */}
                <div>
                  <Label htmlFor="profile-name" className="text-[#374151] mb-2 block">
                    Nombre completo
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
                    <Input
                      id="profile-name"
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setErrors(prev => ({ ...prev, name: "" }));
                      }}
                      placeholder="Tu nombre completo"
                      className={`pl-10 ${errors.name ? "border-red-500" : ""}`}
                      disabled={isSaving}
                    />
                  </div>
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="profile-email" className="text-[#374151] mb-2 block">
                    Correo electrónico
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
                    <Input
                      id="profile-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrors(prev => ({ ...prev, email: "" }));
                      }}
                      placeholder="tu@correo.com"
                      className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                      disabled={isSaving}
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
              </div>
            </div>

            {/* ── Cambiar contraseña ── */}
            <div className="border-t border-[#e5e7eb] pt-6">
              <h3 className="font-medium text-[#111827] mb-1">Cambiar contraseña</h3>
              <p className="text-sm text-[#6b7280] mb-4">
                Deja los campos en blanco si no deseas modificar tu contraseña.
              </p>

              <div className="space-y-4">
                {/* Contraseña actual */}
                <div>
                  <Label htmlFor="current-password" className="text-[#374151] mb-2 block">
                    Contraseña actual
                    {wantsToChangePassword && (
                      <span className="ml-1 text-red-500">*</span>
                    )}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        setPasswordVerified(null);
                        setErrors(prev => ({ ...prev, currentPassword: "" }));
                      }}
                      placeholder="••••••••"
                      className={`pl-10 pr-16 ${errors.currentPassword ? "border-red-500" : passwordVerified === true ? "border-green-500" : ""}`}
                      disabled={isSaving}
                    />
                    {/* Indicador de verificación */}
                    <div className="absolute right-9 top-1/2 -translate-y-1/2 flex items-center">
                      {isVerifyingPassword && (
                        <span className="w-4 h-4 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
                      )}
                      {!isVerifyingPassword && passwordVerified === true && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                      {!isVerifyingPassword && passwordVerified === false && (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#374151]"
                      tabIndex={-1}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.currentPassword && (
                    <p className="text-red-500 text-sm mt-1">{errors.currentPassword}</p>
                  )}
                  {passwordVerified === true && !errors.currentPassword && (
                    <p className="text-green-600 text-sm mt-1">Contraseña verificada correctamente</p>
                  )}
                </div>

                {/* Nueva contraseña */}
                <div>
                  <Label htmlFor="new-password" className="text-[#374151] mb-2 block">
                    Nueva contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setErrors(prev => ({ ...prev, newPassword: "" }));
                      }}
                      placeholder="Nueva contraseña"
                      className={`pl-10 pr-10 ${errors.newPassword ? "border-red-500" : ""}`}
                      disabled={isSaving || (wantsToChangePassword && passwordVerified !== true)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#374151]"
                      disabled={isSaving}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>
                  )}
                  <PasswordRequirementsHint password={newPassword} />
                </div>

                {/* Confirmar contraseña */}
                <div>
                  <Label htmlFor="confirm-password" className="text-[#374151] mb-2 block">
                    Confirmar nueva contraseña
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setErrors(prev => ({ ...prev, confirmPassword: "" }));
                      }}
                      placeholder="Repite tu nueva contraseña"
                      className={`pl-10 pr-10 ${
                        errors.confirmPassword
                          ? "border-red-500"
                          : confirmPassword && confirmPassword === newPassword
                          ? "border-green-500"
                          : ""
                      }`}
                      disabled={isSaving || (wantsToChangePassword && passwordVerified !== true)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#374151]"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                  )}
                  {confirmPassword && confirmPassword === newPassword && !errors.confirmPassword && (
                    <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Las contraseñas coinciden
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Botón guardar */}
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isSaving || !userId}
                className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-8 py-6 disabled:opacity-60"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Guardar Cambios
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}