# Registro de decisiones técnicas — Corte 2 (DPM S.A.S.)

Este registro documenta decisiones de arquitectura **previstas** y otras verificables mediante artefactos existentes. No equivale a una declaración de implementación completa.

| ID | Decisión | Razón y alternativa considerada | Estado / evidencia |
| --- | --- | --- | --- |
| ADR-01 | React + TypeScript + Vite para frontend | Componentes reutilizables y desarrollo tipado; frente a páginas sin framework | **Implementado** en `src/` y `package.json` |
| ADR-02 | Separar frontend de API REST (Node.js + Express) | Evitar poner lógica y secretos de negocio en el navegador; frente a lógica solo en React | **Propuesto**; la API no está en el repositorio verificado |
| ADR-03 | PostgreSQL y esquema `dpm` | Relaciones e integridad transaccional para clientes, cotizaciones, órdenes y cuadrillas | **Diseñado y documentado** en `database/01_schema.sql` |
| ADR-04 | Precios con registro de la tarifa aplicada | Los cambios futuros no alteran cotizaciones anteriores | **Definido** en `cotizaciones` y lógica SQL |
| ADR-05 | Prohibir cruces horarios por cuadrilla desde BD | Mantener la regla HU-03 también ante operaciones concurrentes; alternativa comentada `EXCLUDE USING gist` | **Definido** mediante trigger y bloqueo en SQL |
| ADR-06 | Validar estados y vínculos por claves, CHECK y reglas del esquema | Evitar órdenes finalizadas sin responsable o zonas ajenas | **Definido** en scripts y pruebas |
| ADR-07 | Mantener permisos PostgreSQL y agregar autorización por solicitud en backend | Los roles de la BD no sustituyen los permisos de aplicación; cliente y operario solo ven datos autorizados | **Parcial**: roles BD definidos; controles API pendientes |
| ADR-08 | Usar datos ficticios en el prototipo y en el seed | Permitir diseño/pruebas sin exponer datos empresariales | **Implementado**; tarifas de ejemplo requieren confirmación con DPM |
| ADR-09 | Vercel (frontend) y Render (API), sujetos a disponibilidad | Despliegue desacoplado y accesible desde navegador; costos/licencias por validar | **Propuesto**, no se acredita un despliegue |
| ADR-10 | Ramas por HU y evidencia en GitHub | Trazabilidad de cambios, decisiones y revisiones con Scrum | Repositorio y bitácora existentes; actualizar Sprint Backlog del corte 2 |

## Controles de seguridad previstos

1. Hash seguro de contraseñas creado en el servidor (bcrypt/Argon2); no reutilizar el texto de prueba de `02_seed.sql`.
2. Autenticación de sesiones y autorización de cada operación en Express, no solamente por la ruta visual de React.
3. Uso de consultas parametrizadas y privilegios mínimos para el rol de conexión a PostgreSQL.
4. Protección de credenciales mediante variables de entorno y HTTPS en la comunicación web.
5. Restricción por titularidad de información del cliente y por cuadrilla asignada del operario, con pruebas negativas.
6. Datos ficticios en demostraciones y autorización previa de DPM S.A.S. para usar datos empresariales no públicos.

## Riesgos y actividades abiertas

- **R1 – Supuestos del negocio:** precio base, factores de vegetación/frecuencia, costo por operario y equipos son ilustrativos. Confirmarlos con entrevista y ejemplos de cotización reales autorizados.
- **R2 – Autenticación demo:** el frontend actual permite una navegación simulada; no tratarla como mecanismo seguro.
- **R3 – Integración:** conectar frontend, API y PostgreSQL y ejecutar pruebas de extremo a extremo en la siguiente fase.
- **R4 – Coherencia documental:** referencias compuestas de `cotizaciones.cliente_id` y `zona_id` revisadas y corregidas en el diccionario; para cualquier discrepancia, `01_schema.sql` es la fuente autoritativa.
- **R5 – Verificación:** las 14 pruebas aparecen como satisfactorias en `database/prueba_salida.txt`, registro proporcionado por el equipo; conservar instrucciones para repetirlas y verificar el entorno de ejecución.

## Siguientes evidencias Scrum

Documentar Sprint Goal de diseño, Sprint Backlog con tareas/responsables/fechas, revisión interna contra criterios de aceptación, matriz requisito–pantalla–módulo–tabla y decisiones finales tras la entrevista.
