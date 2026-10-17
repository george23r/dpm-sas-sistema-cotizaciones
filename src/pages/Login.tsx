import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sprout, Mail, Lock } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { HuTag } from "@/components/shared/HuTag";
import { RUTA_INICIAL_POR_ROL } from "@/components/layout/nav";

export function Login() {
  const { iniciarSesion, rol } = useApp();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correo.trim() || !clave.trim()) {
      setError("Ingresa tu correo y contraseña para continuar.");
      return;
    }
    setError(null);
    iniciarSesion();
    navigate(RUTA_INICIAL_POR_ROL[rol]);
  };

  return (
    <div className="relative flex min-h-svh items-center justify-center bg-app-bg px-4">
      <HuTag id="Login" />
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col gap-6 pt-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-white">
              <Sprout className="size-6" />
            </span>
            <div>
              <h1 className="font-heading text-xl font-semibold text-ink">DPM SAS</h1>
              <p className="text-sm text-muted">Gestión de Zonas Verdes</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="correo">Correo electrónico</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <Input
                  id="correo"
                  type="email"
                  placeholder="nombre@empresa.com"
                  className="pl-10"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  aria-invalid={!!error}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="clave">Contraseña</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <Input
                  id="clave"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  aria-invalid={!!error}
                />
              </div>
            </div>

            {error && <p className="text-sm text-status-error">{error}</p>}

            <Button type="submit" size="lg" className="mt-1 w-full">
              Ingresar
            </Button>
          </form>

          <p className="text-center text-xs text-muted">
            Prototipo visual · sin autenticación real. Ingresa cualquier dato para continuar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
