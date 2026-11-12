# API REST — Custodia

## Módulo: Usuarios y sesiones

### 1. Registrar usuario

**Método:** POST

**Ruta:** `/api/usuarios`

**Autenticación:** no requerida.

**Body (JSON):**

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| nombre | String | Sí | Nombre y apellido. Solo letras y espacios |
| celular | String | Sí | Único por usuario. Solo números |
| localidad | String | Sí | Localidad o barrio. Solo letras y espacios |
| contrasena | String | Sí | Contraseña segura (ver requisitos) |
| fotoPerfil | String | No | Imagen en base64 (data URL) |

**Requisitos de la contraseña:** entre 8 y 20 caracteres, al menos una mayúscula, una minúscula y un número.

**Respuesta exitosa — 201** (encabezado `Location: /api/usuarios/me`):

```json
{
  "token": "JWT",
  "usuario": {
    "id": "ID_USUARIO",
    "nombre": "Susana Pérez",
    "celular": "099123456",
    "fotoPerfil": null,
    "localidad": "Pocitos"
  }
}
```

**Errores:** 400 por datos faltantes o contraseña insegura (incluye el arreglo `errores`), 409 si el celular ya está registrado y 500 por error interno.

### 2. Iniciar sesión

**Método:** POST

**Ruta:** `/api/sesiones`

**Autenticación:** no requerida.

**Body (JSON):** `celular` y `contrasena`.

**Respuesta exitosa — 201:** mismo formato que el registro (`token` y `usuario`).

**Errores:** 400 por datos faltantes, 401 por credenciales inválidas y 500 por error interno.

### 3. Consultar el usuario autenticado

**Método:** GET

**Ruta:** `/api/usuarios/me`

**Autenticación:** requerida.

**Respuesta exitosa — 200:** `{ "usuario": { ... } }`

**Errores:** 401 por falta de autenticación, 404 si el usuario ya no existe y 500 por error interno.

### 4. Solicitar recuperación de contraseña

**Método:** POST

**Ruta:** `/api/recuperaciones`

**Autenticación:** no requerida.

**Body (JSON):** `celular`.

Genera un código de 6 números de un solo uso y lo envía al celular. **En el prototipo el envío está simulado: el código se imprime en la consola del servidor.** La respuesta es la misma exista o no el celular, para no revelar qué números están registrados. Si se pide otro código antes de 60 segundos, se mantiene el anterior; si se pide después, el anterior queda anulado.

**Respuesta exitosa — 202** (encabezado `Location: /api/recuperaciones/ID`):

```json
{
  "mensaje": "Si el celular está registrado, te enviamos un código de 6 números por WhatsApp.",
  "recuperacion": {
    "id": "ID_RECUPERACION",
    "vigenciaMinutos": 10,
    "esperaReenvioSegundos": 60
  }
}
```

**Errores:** 400 si falta el celular y 500 por error interno.

### 5. Restablecer la contraseña

**Método:** PATCH

**Ruta:** `/api/recuperaciones/:id`

**Autenticación:** no requerida (el código cumple esa función).

**Body (JSON):** `codigo` (6 números) y `contrasena` (nueva, con los mismos requisitos que en el registro).

**Reglas de negocio:**

- El código vence a los 10 minutos y sirve una sola vez.
- Se permiten 5 intentos; después hay que pedir un código nuevo.
- La nueva contraseña debe ser distinta de la anterior.

**Respuesta exitosa — 200:** `{ "mensaje": "Tu contraseña se actualizó correctamente. Ya podés ingresar." }`

**Errores:** 400 por código incorrecto, vencido o agotado, contraseña insegura o igual a la anterior, y 500 por error interno.

## Módulo: Solicitudes de pago

**URL base:** `http://localhost:3000/api/solicitudes`

Las rutas protegidas requieren autenticación mediante JWT. Durante las pruebas locales se utiliza temporalmente el encabezado `x-test-user-id`, que será retirado antes de la entrega.

### 1. Crear solicitud de pago

**Método:** POST

**Ruta:** `/api/solicitudes`

**Autenticación:** requerida.

**Content-Type:** `multipart/form-data`

**Campos enviados:**

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| nombreProducto | Text | Sí | Nombre del artículo |
| precio | Text | Sí | Precio mayor a cero |
| foto | File | Sí | Fotografía JPG, PNG o WebP, máximo 2 MB |

El sistema asigna automáticamente el vendedor autenticado, el estado PENDIENTE, el código único y la fecha de creación.

**Respuesta exitosa — 201:**

```json
{
  "mensaje": "Solicitud creada correctamente",
  "solicitud": {
    "id": "ID_SOLICITUD",
    "nombreProducto": "Bicicleta rodado 26",
    "precio": 12000,
    "foto": "/uploads/productos/IMAGEN.jpg",
    "codigoReferencia": "CODIGO_GENERADO",
    "estado": "PENDIENTE",
    "fechaCreacion": "FECHA_GENERADA",
    "enlace": "/solicitud.html?id=ID_SOLICITUD"
  }
}
```

**Errores:** 400 por datos incorrectos o imagen inválida, 401 por falta de autenticación y 500 por error interno.

### 2. Consultar solicitudes propias

**Método:** GET

**Ruta:** `/api/solicitudes/mias`

**Autenticación:** requerida.

**Body:** ninguno.

**Respuesta exitosa — 200:**

```json
{
  "ventas": [],
  "compras": []
}
```

Cada arreglo contiene los documentos de las solicitudes correspondientes al usuario autenticado, ordenados desde la creación más reciente.

El arreglo ventas contiene las solicitudes donde el usuario es vendedor. El arreglo compras contiene aquellas donde es comprador.

**Errores:** 401 por falta de autenticación y 500 por error interno.

### 3. Consultar detalles de una solicitud

**Método:** GET

**Ruta:** `/api/solicitudes/:id`

**Autenticación:** no requerida.

**Parámetro:** `id`, identificador de MongoDB de la solicitud.

**Body:** ninguno.

**Respuesta exitosa — 200:**

```json
{
  "solicitud": {
    "id": "ID_SOLICITUD",
    "nombreProducto": "Bicicleta rodado 26",
    "precio": 12000,
    "foto": "/uploads/productos/IMAGEN.jpg",
    "estado": "PENDIENTE",
    "vendedor": {
      "_id": "ID_VENDEDOR",
      "nombre": "Juan Gómez",
      "localidad": "Paysandú"
    }
  }
}
```

Solamente devuelve información pública del producto y del vendedor.

**Errores:** 400 por identificador inválido, 404 si la solicitud no existe y 500 por error interno.

### 4. Simular pago

**Método:** POST

**Ruta:** `/api/solicitudes/:id/pagar`

**Autenticación:** requerida.

**Parámetro:** `id`, identificador de la solicitud.

**Body:** ninguno.

**Reglas de negocio:**

- La solicitud debe existir y encontrarse PENDIENTE.
- El usuario autenticado no puede ser el vendedor.
- Una solicitud solamente puede pagarse una vez.
- El sistema asigna el comprador y registra fechaPago.
- El estado cambia de PENDIENTE a PAGADA.
- No se realiza ninguna transferencia bancaria real.

**Respuesta exitosa — 200:**

```json
{
  "mensaje": "Pago simulado correctamente",
  "solicitud": {
    "id": "ID_SOLICITUD",
    "nombreProducto": "Bicicleta rodado 26",
    "precio": 12000,
    "codigoReferencia": "CODIGO_GENERADO",
    "estado": "PAGADA",
    "comprador": "ID_COMPRADOR",
    "fechaPago": "FECHA_DEL_PAGO"
  }
}
```

**Errores:** 400 por identificador inválido, 401 por falta de autenticación, 403 si el vendedor intenta pagar su propia solicitud, 404 si no existe y 409 si no está disponible para pagar.

### 5. Confirmar despacho

**Método:** POST

**Ruta:** `/api/solicitudes/:id/despachar`

**Autenticación:** requerida.

**Parámetro:** `id`, identificador de la solicitud.

**Campos opcionales en el body:**

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| numeroSeguimiento | Text | No | Código o remito de seguimiento del paquete |

**Reglas de negocio:**

- La solicitud debe existir y estar en estado `PAGADA`.
- Solo el usuario que actúa como vendedor puede despachar el producto.
- El estado pasa de `PAGADA` a `DESPACHADA` y se registra `fechaDespacho`.

**Respuesta exitosa — 200:**

```json
{
  "mensaje": "Solicitud despachada correctamente",
  "solicitud": {
    "id": "ID_SOLICITUD",
    "estado": "DESPACHADA",
    "fechaDespacho": "FECHA_DESPACHO",
    "numeroSeguimiento": "CODIGO_OPCIONAL"
  }
}
```

**Errores:** 400 por identificador inválido, 401 por falta de autenticación, 403 si no es el vendedor, 404 si no existe y 409 si el estado no es `PAGADA`.

### 6. Confirmar recepción

**Método:** POST

**Ruta:** `/api/solicitudes/:id/confirmar-recepcion`

**Autenticación:** requerida.

**Parámetro:** `id`, identificador de la solicitud.

**Body:** ninguno.

**Reglas de negocio:**

- La solicitud debe existir y encontrarse en estado `DESPACHADA`.
- Solo el usuario comprador puede confirmar la recepción.
- No se puede confirmar si la solicitud se encuentra en mediación o reclamo (`EN_RECLAMO`).
- El estado pasa a `FINALIZADA`, se registra `fechaRecepcion` y se libera el dinero con `fechaLiberacion`.

**Respuesta exitosa — 200:**

```json
{
  "mensaje": "Recepción confirmada. Los fondos han sido liberados al vendedor.",
  "solicitud": {
    "id": "ID_SOLICITUD",
    "estado": "FINALIZADA",
    "fechaRecepcion": "FECHA_RECEPCION",
    "fechaLiberacion": "FECHA_LIBERACION"
  }
}
```

**Errores:** 400 por identificador inválido, 401 por falta de autenticación, 403 si no es el comprador, 404 si no existe y 409 si el estado no es `DESPACHADA` o si está en reclamo.

### 7. Cancelar solicitud

**Método:** POST

**Ruta:** `/api/solicitudes/:id/cancelar`

**Autenticación:** requerida.

**Parámetro:** `id`, identificador de la solicitud.

**Body:** ninguno.

**Reglas de negocio:**

- Solo las partes autorizadas de la solicitud pueden cancelarla.
- No se puede cancelar si ya fue despachada o finalizada, ni si está en mediación/reclamo.
- El estado pasa a `CANCELADA`.

**Respuesta exitosa — 200:**

```json
{
  "mensaje": "Solicitud cancelada correctamente",
  "solicitud": {
    "id": "ID_SOLICITUD",
    "estado": "CANCELADA"
  }
}
```

**Errores:** 400 por identificador inválido, 401 por falta de autenticación, 403 si no pertenece a la operación, 404 si no existe y 409 si la solicitud no está disponible para cancelar.

## Módulo: Reclamos

Cada solicitud admite **un único reclamo**, iniciado por el comprador o por el vendedor. `GET /api/solicitudes/mias` incluye en cada solicitud el campo `reclamo` (o `null`).

### 1. Registrar reclamo

**Método:** POST · **Ruta:** `/api/solicitudes/:id/reclamos` · **Autenticación:** requerida.

**Body (JSON):** `motivo` y `descripcion` (máximo 500 caracteres).

| Rol | Motivos permitidos |
|---|---|
| Comprador | `NO_RECIBIDO`, `NO_COINCIDE`, `DANADO`, `OTRO` |
| Vendedor | `NO_CONFIRMA_RECEPCION`, `PROBLEMA_ENVIO`, `SIN_RESPUESTA`, `OTRO` |

**Reglas de negocio:** el rol se deduce de la solicitud; debe estar `PAGADA` o `DESPACHADA`; pasa a `EN_RECLAMO`.

**Respuesta exitosa — 201:** `{ "mensaje": "...", "reclamo": { ... } }`

**Errores:** 400 por datos o motivo inválidos, 401 sin autenticación, 403 si no participa de la operación, 404 si no existe y 409 si ya tiene reclamo o el estado no lo permite.

### 2. Consultar reclamos de una solicitud

**Método:** GET · **Ruta:** `/api/solicitudes/:id/reclamos` · **Autenticación:** requerida (comprador o vendedor).

**Respuesta exitosa — 200:** `{ "reclamos": [ ... ] }`

### 3. Resolver reclamo

**Método:** PATCH · **Ruta:** `/api/solicitudes/:id/reclamos` · **Autenticación:** requerida.

No hay administrador: lo resuelven las partes, y cada una solo puede cerrarlo **a favor de la otra**.

| Rol | `resolucion` permitida | Resultado |
|---|---|---|
| Comprador | `LIBERAR_VENDEDOR` | Solicitud `FINALIZADA`, registra `fechaLiberacion` |
| Vendedor | `DEVOLVER_COMPRADOR` | Solicitud `CANCELADA`, registra `fechaDevolucion` |

El reclamo pasa a `RESUELTO` y guarda `resolucion`, `resueltoPor` y `fechaResolucion`. Los reclamos no se eliminan: quedan como historial.

**Respuesta exitosa — 200:** `{ "mensaje": "...", "reclamo": { ... }, "solicitud": { "id": "...", "estado": "FINALIZADA" } }`

**Errores:** 400 si la resolución no corresponde al rol, 401 sin autenticación, 403 si no participa de la operación, 404 si no hay reclamo y 409 si ya fue resuelto o la solicitud no está en reclamo.

## Módulo: Notificaciones

Avisos dentro de la página web (campanita del encabezado), no por WhatsApp. Se generan para **la otra parte** de la operación cuando se crea un reclamo (`RECLAMO_CREADO`) y cuando se resuelve (`RECLAMO_RESUELTO`). El frontend las consulta cada 30 segundos.

### 1. Consultar notificaciones

**Método:** GET · **Ruta:** `/api/notificaciones` · **Autenticación:** requerida.

**Respuesta exitosa — 200:** `{ "notificaciones": [ { "_id", "tipo", "mensaje", "solicitudPago", "rol", "leida", "fechaCreacion" } ], "noLeidas": 2 }` (últimas 20).

### 2. Marcar todas como leídas

**Método:** PATCH · **Ruta:** `/api/notificaciones/leidas` · **Autenticación:** requerida.

**Respuesta exitosa — 200:** `{ "actualizadas": 2 }`

## Formato general de errores

```json
{
  "mensaje": "Descripción del error"
}
```

## Estados posibles de SolicitudPago

- PENDIENTE
- PAGADA
- DESPACHADA
- FINALIZADA
- EN_RECLAMO
- CANCELADA

## Observaciones

Los importes y las liberaciones de fondos son simulados. La fotografía se guarda como archivo en el servidor y MongoDB conserva su ruta. El almacenamiento local de imágenes está destinado al prototipo y deberá revisarse si se despliega en un servicio externo.