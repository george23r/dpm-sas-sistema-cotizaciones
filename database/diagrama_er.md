# Diagrama entidad-relación — DPM S.A.S. (Corte 2)

Diagrama **renderizable en GitHub** que representa las 12 tablas diseñadas en `01_schema.sql`. Las etiquetas PK/FK son orientativas; las definiciones SQL son la fuente de verdad para restricciones, índices y claves compuestas.

```mermaid
erDiagram
    usuarios {
        int id PK
        varchar nombre
        varchar correo
        varchar password_hash
        enum rol
        boolean activo
        timestamptz creado_en
    }
    clientes {
        int id PK
        int usuario_id FK
        enum rol_usuario
        varchar nombre
        enum tipo
        varchar telefono
        varchar correo_contacto
        timestamptz creado_en
    }
    zonas {
        int id PK
        int cliente_id FK
        varchar nombre
        varchar direccion
        numeric area_m2
        smallint tipo_vegetacion_id FK
        timestamptz creado_en
    }
    tipos_vegetacion {
        smallint id PK
        varchar nombre
        numeric factor
        boolean activo
    }
    frecuencias {
        smallint id PK
        varchar nombre
        numeric factor
        smallint dias_intervalo
        boolean activo
    }
    parametros_tarifa {
        varchar clave PK
        numeric valor
        varchar descripcion
    }
    equipos {
        smallint id PK
        varchar nombre
        numeric costo_uso
        boolean activo
    }
    cotizaciones {
        int id PK
        int cliente_id FK
        int zona_id FK
        numeric area_m2
        smallint tipo_vegetacion_id FK
        smallint frecuencia_id FK
        smallint num_operarios
        text observaciones
        enum estado
        numeric tarifa_base_aplicada
        numeric factor_vegetacion_aplicado
        numeric factor_frecuencia_aplicado
        numeric subtotal_area
        numeric costo_personal
        numeric costo_equipos
        numeric precio_total
        int creada_por FK
        timestamptz solicitada_en
        timestamptz enviada_en
    }
    cotizacion_equipos {
        int cotizacion_id PK,FK
        smallint equipo_id PK,FK
        numeric costo_aplicado
    }
    cuadrillas {
        smallint id PK
        varchar nombre
        boolean activa
    }
    operarios {
        int id PK
        int usuario_id FK
        enum rol_usuario
        varchar nombre
        smallint cuadrilla_id FK
        boolean es_lider
        boolean activo
    }
    ordenes_trabajo {
        int id PK
        int cotizacion_id FK
        int zona_id FK
        varchar tipo_servicio
        smallint cuadrilla_id FK
        timestamptz inicio
        timestamptz fin
        enum estado
        timestamptz iniciada_en
        timestamptz finalizada_en
        int finalizada_por FK
        text nota_finalizacion
        timestamptz creado_en
    }

    usuarios o|--o| clientes : "cuenta opcional"
    usuarios o|--o| operarios : "cuenta opcional"
    usuarios ||--o{ cotizaciones : "crea"
    clientes ||--o{ zonas : "posee"
    clientes ||--o{ cotizaciones : "solicita"
    tipos_vegetacion ||--o{ zonas : "clasifica"
    tipos_vegetacion ||--o{ cotizaciones : "ajusta precio"
    frecuencias ||--o{ cotizaciones : "define"
    zonas ||--o{ cotizaciones : "se cotiza"
    cotizaciones ||--o{ cotizacion_equipos : "incluye"
    equipos ||--o{ cotizacion_equipos : "se utiliza"
    cuadrillas ||--o{ operarios : "agrupa"
    cuadrillas o|--o{ ordenes_trabajo : "se asigna"
    cotizaciones o|--o{ ordenes_trabajo : "origina"
    zonas ||--o{ ordenes_trabajo : "recibe"
    operarios o|--o{ ordenes_trabajo : "finaliza"
```

## Notas de integridad importantes

- `cotizaciones(zona_id, cliente_id)` referencia de manera **compuesta** `zonas(id, cliente_id)`, asegurando que la zona cotizada pertenece al cliente.
- `clientes(usuario_id, rol_usuario)` y `operarios(usuario_id, rol_usuario)` usan claves compuestas sobre `usuarios(id, rol)` para validar el perfil.
- `cotizacion_equipos` posee clave primaria compuesta `(cotizacion_id, equipo_id)`.
- Solo un operario puede marcarse líder por cuadrilla; la restricción usa un índice único parcial.
- El esquema impide cruces horarios de una misma cuadrilla mediante un trigger y mantiene controles de estados y finalización.

Este artefacto es **documentación de diseño**, no evidencia de que el prototipo frontend ya esté conectado a PostgreSQL. Las tarifas y los datos semilla se consideran ficticios hasta validación con DPM S.A.S.
