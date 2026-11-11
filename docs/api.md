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