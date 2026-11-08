import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, LockKeyhole, Mail, Sprout } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RUTA_INICIAL_POR_ROL } from "@/components/layout/nav";

export function Login() {
  const { iniciarSesion, authCargando, authError, modoDemo } = useApp();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correo.trim() || !clave.trim()) { setError("Ingresa tu correo y contraseña para continuar."); return; }
    setError(null);
    const resultado = await iniciarSesion(correo.trim(), clave);
    if (!resultado.ok) { setError(resultado.error); return; }
    navigate(RUTA_INICIAL_POR_ROL[resultado.rol]);
  };

  return (
    <main className="grid min-h-svh bg-app-bg lg:grid-cols-[minmax(360px,0.9fr)_1.1fr]">
      <section className="relative hidden overflow-hidden bg-primary-dark p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="absolute -right-32 -top-28 size-96 rounded-full border border-white/10" /><div className="absolute -bottom-48 -left-24 size-[30rem] rounded-full border border-white/10" />
        <div className="relative flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-white/15"><Sprout className="size-5" /></span><span className="font-heading text-lg font-bold tracking-tight">DPM Operations</span></div>
        <div className="relative max-w-md"><p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-emerald-200">Centro operativo</p><h1 className="font-heading text-4xl font-semibold leading-tight xl:text-5xl">Más claridad para cada zona verde.</h1><p className="mt-6 max-w-sm text-sm leading-7 text-emerald-50/75">Cotizaciones, programación y jornadas en un mismo espacio de trabajo para DPM S.A.S.</p><div className="mt-9 space-y-3 text-sm text-emerald-50/90"><p className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-200" /> Información organizada por proceso</p><p className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-200" /> Acceso según el rol autenticado</p><p className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-200" /> Seguimiento operativo con trazabilidad</p></div></div>
        <p className="relative text-xs text-emerald-100/55">Sistema en evolución · DPM S.A.S.</p>
      </section>
      <section className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3 lg:hidden"><span className="flex size-10 items-center justify-center rounded-xl bg-primary text-white"><Sprout className="size-5" /></span><div><p className="font-heading text-base font-bold text-ink">DPM Operations</p><p className="text-xs text-muted">Gestión de zonas verdes</p></div></div>
          <div className="mb-8"><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">Acceso seguro</p><h2 className="font-heading text-3xl font-semibold tracking-tight text-ink">Bienvenido de nuevo</h2><p className="mt-2 text-sm leading-6 text-muted">Ingresa con la cuenta autorizada para continuar.</p></div>
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <div className="space-y-2"><Label htmlFor="correo">Correo electrónico</Label><div className="relative"><Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" /><Input id="correo" type="email" autoComplete="username" placeholder="nombre@empresa.com" className="h-12 pl-10" value={correo} onChange={(e) => setCorreo(e.target.value)} aria-invalid={Boolean(error || authError)} /></div></div>
            <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="clave">Contraseña</Label><span className="text-xs text-muted">Sesión protegida</span></div><div className="relative"><LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" /><Input id="clave" type="password" autoComplete="current-password" placeholder="••••••••" className="h-12 pl-10" value={clave} onChange={(e) => setClave(e.target.value)} aria-invalid={Boolean(error || authError)} /></div></div>
            {(error || authError) && <p className="rounded-lg border border-status-error/20 bg-status-error-bg px-3 py-2.5 text-sm text-status-error" role="alert" aria-live="polite">{error ?? authError}</p>}
            <Button type="submit" size="lg" className="h-12 w-full" disabled={authCargando}>{authCargando ? "Verificando…" : <>Ingresar al sistema <ArrowRight className="size-4" /></>}</Button>
          </form>
          <p className="mt-8 text-center text-xs leading-5 text-muted">{modoDemo ? "Modo demostración habilitado: los datos no representan autorización real." : "Tu sesión se gestiona mediante cookies seguras y la API de DPM."}</p>
        </div>
      </section>
    </main>
  );
}
