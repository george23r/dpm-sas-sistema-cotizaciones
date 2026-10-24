# Matriz de pruebas de aceptación — Prototipo DPM S.A.S. (corte 2)

**Alcance verificable:** React/TypeScript con datos ficticios en memoria y base PostgreSQL diseñada de manera independiente. Este documento no declara pruebas de navegador ejecutadas ni validación del cliente.

## Pruebas automatizadas

- `npm run build`: compila y verifica TypeScript.
- `npm run test:unit`: ejecuta 12 verificaciones con el runner nativo de Node.js 22; incluye nombres/correos duplicados, restricciones de líder, turnos nocturnos, descansos y comparación de planillas.
- GitHub Actions ejecuta ambas al proponer cambios del frontend.

## Casos de aceptación para revisión visual (pendientes de ejecución documentada)

| Historia | Recorrido a comprobar | Resultado esperado |
| --- | --- | --- |
| HU-01 | Administrador crea borrador, agrega líneas, visita, costos y hitos | El total se calcula por conceptos y los hitos deben sumar 100 % |
| HU-01 | Intenta enviar sin visita o sin conceptos | El envío se bloquea |
| HU-02 | Cliente solicita servicio desde una zona propia | La solicitud aparece al administrador sin divulgar costos internos |
| HU-02 | Cliente acepta cotización vigente o intenta aceptar vencida | Solo se permite aceptar cotización enviada y vigente |
| HU-03 | Programa cotización aceptada y asigna fecha/cuadrilla | Se crea orden ligada a cliente y zona |
| HU-03 | Usa horarios superpuestos en una misma cuadrilla | Se rechaza el cruce |
| HU-04 | Reasigna una orden pendiente | Se permite salvo choque de horarios; se rechaza en ejecución |
| HU-05 | Operario consulta órdenes de su cuadrilla | No aparecen órdenes ajenas a su perfil de demostración |
| HU-06 | Inicia y finaliza servicio asignado | Estado final y nota de finalización visibles |
| HU-07 | Cliente abre historial | Solo ve órdenes finalizadas que le pertenecen |
| HU-08 | Filtra reportes por cliente y fechas | Totales y jornadas se actualizan según filtros |
| HU-09 | Registra turno 18:00–06:00 y descanso | Las horas se calculan según reglas de diseño |
| HU-09 | Intenta registrar una jornada duplicada | Aparece mensaje de rechazo |
| HU-10 | Compara campo contra administración con dos horas de diferencia | No permite conciliar |
| HU-10 | Compara registros coincidentes y concilia | Bloquea nuevos registros en las planillas conciliadas |
| Administración | Crea y edita cliente, con correo duplicado | Se permite nuevo cliente válido y se bloquea duplicado |
| Administración | Crea un segundo líder activo de la misma cuadrilla | Se rechaza la operación |

**Cómo documentar:** fecha, navegador y resolución, pasos, capturas de antes/después, resultados observados, autor de la prueba y número de issue en caso de defecto. No registrar «PASS» sin haberla ejecutado.

**Limitaciones:** no hay autenticación real de servidor, almacenamiento persistente, facturación ni integración Express–PostgreSQL. La compilación y los tests unitarios no sustituyen pruebas visuales ni de seguridad.
