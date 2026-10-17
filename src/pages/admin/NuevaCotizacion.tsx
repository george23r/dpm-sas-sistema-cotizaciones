import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Save } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { calcularPrecio, COSTO_EQUIPO, COSTO_OPERARIO } from "@/lib/precio";
import {
  EQUIPOS,
  FRECUENCIAS,
  TIPOS_VEGETACION,
  type Equipo,
  type Frecuencia,
  type TipoVegetacion,
} from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { HuTag } from "@/components/shared/HuTag";
import { cn, formatCOP } from "@/lib/utils";

const TODOS_LOS_EQUIPOS = Object.keys(EQUIPOS) as Equipo[];

export function NuevaCotizacion() {
  const { clientes, zonas, crearCotizacion } = useApp();
  const navigate = useNavigate();

  const [clienteId, setClienteId] = useState(clientes[0]?.id ?? "");
  const [zonaNombre, setZonaNombre] = useState("");
  const [area, setArea] = useState("500");
  const [tipoVegetacion, setTipoVegetacion] = useState<TipoVegetacion>("cesped_simple");
  const [frecuencia, setFrecuencia] = useState<Frecuencia>("mensual");
  const [numeroOperarios, setNumeroOperarios] = useState("2");
  const [equipos, setEquipos] = useState<Equipo[]>(["guadañadora"]);
  const [guardado, setGuardado] = useState(false);

  const areaNum = Math.max(0, Number(area) || 0);
  const operariosNum = Math.max(0, Number(numeroOperarios) || 0);

  const desglose = useMemo(
    () =>
      calcularPrecio({
        areaM2: areaNum,
        tipoVegetacion,
        frecuencia,
        numeroOperarios: operariosNum,
        equipos,
      }),
    [areaNum, tipoVegetacion, frecuencia, operariosNum, equipos],
  );

  const alternarEquipo = (equipo: Equipo) => {
    setEquipos((prev) => (prev.includes(equipo) ? prev.filter((e) => e !== equipo) : [...prev, equipo]));
  };

  const zonaDelCliente = zonas.find((z) => z.clienteId === clienteId);

  const onGuardar = () => {
    crearCotizacion({
      clienteId,
      zonaId: zonaDelCliente?.id ?? "zon-sin-registro",
      zonaNombre: zonaNombre.trim() || zonaDelCliente?.nombre || "Predio sin nombre",
      areaM2: areaNum,
      tipoVegetacion,
      frecuencia,
      numeroOperarios: operariosNum,
      equipos,
      estado: "enviada",
      precio: desglose.total,
      desglose,
      origen: "administrador",
    });
    setGuardado(true);
  };

  if (guardado) {
    return (
      <div className="relative mx-auto max-w-md space-y-5 py-10 text-center">
        <HuTag id="HU-01" />
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-soft text-primary">
          <CheckCircle2 className="size-8" />
        </div>
        <div>
          <h1 className="font-heading text-xl font-semibold text-ink">Cotización guardada</h1>
          <p className="mt-1 text-sm text-muted">
            Se registró con estado <strong>Enviada</strong> por {formatCOP(desglose.total)}.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={() => navigate("/app/admin/cotizaciones")}>Ver cotizaciones</Button>
          <Button variant="outline" onClick={() => setGuardado(false)}>
            Crear otra cotización
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-5">
      <HuTag id="HU-01" />
      <div>
        <h1 className="font-heading text-xl font-semibold text-ink sm:text-2xl">Nueva cotización</h1>
        <p className="text-sm text-muted">Define los parámetros del servicio y revisa el precio calculado en vivo.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Parámetros del servicio</CardTitle>
            <CardDescription>Valores de tarifa y factores son ilustrativos.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cliente">Cliente</Label>
                <Select id="cliente" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="zona">Nombre del predio</Label>
                <Input
                  id="zona"
                  placeholder={zonaDelCliente?.nombre ?? "Ej. Zona común"}
                  value={zonaNombre}
                  onChange={(e) => setZonaNombre(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="area">Área (m²)</Label>
                <Input id="area" type="number" min={0} value={area} onChange={(e) => setArea(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="operarios">Número de operarios</Label>
                <Input
                  id="operarios"
                  type="number"
                  min={0}
                  value={numeroOperarios}
                  onChange={(e) => setNumeroOperarios(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="vegetacion">Tipo de vegetación</Label>
                <Select
                  id="vegetacion"
                  value={tipoVegetacion}
                  onChange={(e) => setTipoVegetacion(e.target.value as TipoVegetacion)}
                >
                  {Object.entries(TIPOS_VEGETACION).map(([valor, etiqueta]) => (
                    <option key={valor} value={valor}>
                      {etiqueta}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="frecuencia">Frecuencia</Label>
                <Select
                  id="frecuencia"
                  value={frecuencia}
                  onChange={(e) => setFrecuencia(e.target.value as Frecuencia)}
                >
                  {Object.entries(FRECUENCIAS).map(([valor, etiqueta]) => (
                    <option key={valor} value={valor}>
                      {etiqueta}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Equipos requeridos</Label>
              <div className="flex flex-wrap gap-2">
                {TODOS_LOS_EQUIPOS.map((equipo) => {
                  const activo = equipos.includes(equipo);
                  return (
                    <button
                      key={equipo}
                      type="button"
                      onClick={() => alternarEquipo(equipo)}
                      className={cn(
                        "rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                        activo
                          ? "border-primary bg-soft text-primary"
                          : "border-line bg-surface text-muted hover:bg-app-bg",
                      )}
                    >
                      {EQUIPOS[equipo]} · {formatCOP(COSTO_EQUIPO[equipo])}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:sticky lg:top-20 lg:self-start">
          <CardHeader>
            <CardTitle>Precio calculado</CardTitle>
            <CardDescription>(área × tarifa) × factor vegetación × factor frecuencia + personal + equipos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <FilaPrecio etiqueta="Área × tarifa base" valor={formatCOP(desglose.areaPorTarifa)} />
            <FilaPrecio etiqueta={`Factor vegetación (×${desglose.factorVegetacion})`} valor="" />
            <FilaPrecio etiqueta={`Factor frecuencia (×${desglose.factorFrecuencia})`} valor="" />
            <FilaPrecio etiqueta="Subtotal por área" valor={formatCOP(desglose.subtotalArea)} />
            <FilaPrecio etiqueta={`Personal (${operariosNum} × ${formatCOP(COSTO_OPERARIO)})`} valor={formatCOP(desglose.costoPersonal)} />
            <FilaPrecio etiqueta="Equipos" valor={formatCOP(desglose.costoEquipos)} />
            <div className="h-px bg-line" />
            <div className="flex items-center justify-between pt-1">
              <span className="font-heading text-sm font-semibold text-ink">Total</span>
              <span className="font-heading text-2xl font-semibold text-primary">{formatCOP(desglose.total)}</span>
            </div>
            <Button className="mt-2 w-full" size="lg" onClick={onGuardar} disabled={areaNum <= 0}>
              <Save className="size-4" />
              Guardar cotización
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FilaPrecio({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted">{etiqueta}</span>
      {valor && <span className="font-medium text-ink">{valor}</span>}
    </div>
  );
}
