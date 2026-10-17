import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, Send } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { FRECUENCIAS, TIPOS_VEGETACION, type Frecuencia, type TipoVegetacion } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { HuTag } from "@/components/shared/HuTag";

type Errores = Partial<Record<"nombrePredio" | "area" | "tipoVegetacion" | "frecuencia", string>>;

export function SolicitarCotizacion() {
  const { zonas, clienteActualId, crearCotizacion } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const zonaPreseleccionada = zonas.find(
    (z) => z.id === (location.state as { zonaId?: string } | null)?.zonaId,
  );

  const [nombrePredio, setNombrePredio] = useState(zonaPreseleccionada?.nombre ?? "");
  const [area, setArea] = useState(zonaPreseleccionada ? String(zonaPreseleccionada.areaM2) : "");
  const [tipoVegetacion, setTipoVegetacion] = useState<TipoVegetacion | "">(
    zonaPreseleccionada?.tipoVegetacion ?? "",
  );
  const [frecuencia, setFrecuencia] = useState<Frecuencia | "">("");
  const [observaciones, setObservaciones] = useState("");
  const [errores, setErrores] = useState<Errores>({});
  const [enviado, setEnviado] = useState(false);

  const validar = (): boolean => {
    const nuevos: Errores = {};
    if (!nombrePredio.trim()) nuevos.nombrePredio = "Indica el nombre del predio.";
    const areaNum = Number(area);
    if (!area || Number.isNaN(areaNum) || areaNum <= 0) {
      nuevos.area = "Ingresa un área aproximada válida, mayor a 0.";
    }
    if (!tipoVegetacion) nuevos.tipoVegetacion = "Selecciona el tipo de vegetación.";
    if (!frecuencia) nuevos.frecuencia = "Selecciona la frecuencia del servicio.";
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validar()) return;

    crearCotizacion({
      clienteId: clienteActualId,
      zonaId: zonaPreseleccionada?.id ?? "zon-sin-registro",
      zonaNombre: nombrePredio.trim(),
      areaM2: Number(area),
      tipoVegetacion: tipoVegetacion as TipoVegetacion,
      frecuencia: frecuencia as Frecuencia,
      numeroOperarios: 2,
      equipos: ["guadañadora"],
      observaciones: observaciones.trim() || undefined,
      origen: "cliente",
    });
    setEnviado(true);
  };

  if (enviado) {
    return (
      <div className="relative mx-auto max-w-md space-y-5 py-10 text-center">
        <HuTag id="HU-02" />
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-soft text-primary">
          <CheckCircle2 className="size-8" />
        </div>
        <div>
          <h1 className="font-heading text-xl font-semibold text-ink">Solicitud enviada</h1>
          <p className="mt-1 text-sm text-muted">
            Tu solicitud quedó registrada con estado <strong>Pendiente</strong>. DPM SAS calculará el
            precio y te notificaremos el estado en la sección de cotizaciones.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={() => navigate("/app/cliente/cotizaciones")}>Ver mis cotizaciones</Button>
          <Button
            variant="outline"
            onClick={() => {
              setEnviado(false);
              setNombrePredio("");
              setArea("");
              setTipoVegetacion("");
              setFrecuencia("");
              setObservaciones("");
            }}
          >
            Solicitar otra cotización
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-xl space-y-5">
      <HuTag id="HU-02" />
      <div>
        <h1 className="font-heading text-xl font-semibold text-ink sm:text-2xl">Solicitar cotización</h1>
        <p className="text-sm text-muted">
          Cuéntanos sobre tu predio y te enviaremos una cotización con el precio del servicio.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del predio</CardTitle>
          <CardDescription>Toda la información es orientativa; DPM SAS podrá verificarla en visita.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nombrePredio">Nombre del predio</Label>
              <Input
                id="nombrePredio"
                placeholder="Ej. Zona común - Torre A"
                value={nombrePredio}
                onChange={(e) => setNombrePredio(e.target.value)}
                aria-invalid={!!errores.nombrePredio}
              />
              {errores.nombrePredio && <p className="text-xs text-status-error">{errores.nombrePredio}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="area">Área aproximada (m²)</Label>
              <Input
                id="area"
                type="number"
                min={1}
                placeholder="Ej. 850"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                aria-invalid={!!errores.area}
              />
              {errores.area && <p className="text-xs text-status-error">{errores.area}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tipoVegetacion">Tipo de vegetación</Label>
                <Select
                  id="tipoVegetacion"
                  value={tipoVegetacion}
                  onChange={(e) => setTipoVegetacion(e.target.value as TipoVegetacion)}
                  aria-invalid={!!errores.tipoVegetacion}
                >
                  <option value="">Selecciona una opción</option>
                  {Object.entries(TIPOS_VEGETACION).map(([valor, etiqueta]) => (
                    <option key={valor} value={valor}>
                      {etiqueta}
                    </option>
                  ))}
                </Select>
                {errores.tipoVegetacion && (
                  <p className="text-xs text-status-error">{errores.tipoVegetacion}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="frecuencia">Frecuencia</Label>
                <Select
                  id="frecuencia"
                  value={frecuencia}
                  onChange={(e) => setFrecuencia(e.target.value as Frecuencia)}
                  aria-invalid={!!errores.frecuencia}
                >
                  <option value="">Selecciona una opción</option>
                  {Object.entries(FRECUENCIAS).map(([valor, etiqueta]) => (
                    <option key={valor} value={valor}>
                      {etiqueta}
                    </option>
                  ))}
                </Select>
                {errores.frecuencia && <p className="text-xs text-status-error">{errores.frecuencia}</p>}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="observaciones">Observaciones (opcional)</Label>
              <Textarea
                id="observaciones"
                placeholder="Detalles adicionales sobre el predio o el servicio..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </div>

            <Button type="submit" size="lg" className="mt-1 w-full sm:w-auto">
              <Send className="size-4" />
              Enviar solicitud
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
