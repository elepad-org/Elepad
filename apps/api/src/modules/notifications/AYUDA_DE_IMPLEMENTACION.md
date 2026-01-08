# Sistema de Notificaciones para Menciones en Recuerdos

## Resumen

Se ha implementado un sistema completo de notificaciones que crea automáticamente notificaciones para los usuarios cuando son mencionados en un recuerdo (memory).

## Arquitectura

El módulo de notificaciones sigue la arquitectura estándar del proyecto:

```
modules/notifications/
├── handler.ts     # Endpoints OpenAPI y middleware
├── schema.ts      # Esquemas de validación Zod
└── service.ts     # Lógica de negocio

services/
└── mentions.ts    # Servicio auxiliar compartido (sin endpoints propios)
```

## Cambios Realizados

### 1. Módulo de Notificaciones (`modules/notifications/`)

#### **handler.ts**
- Usa `OpenAPIHono` para documentación automática en Swagger
- Middleware que inyecta `NotificationsService` en el contexto
- Endpoints RESTful documentados:
  - `GET /notifications?limit=50&offset=0` - Lista de notificaciones con paginación
  - `GET /notifications/unread-count` - Contador de notificaciones no leídas
  - `PATCH /notifications/:id/read` - Marcar notificación como leída
  - `PATCH /notifications/read-all` - Marcar todas como leídas
  - `DELETE /notifications/:id` - Eliminar notificación

#### **schema.ts**
- Esquemas de validación con Zod:
  - `getNotificationsQuerySchema` - Query params para paginación
  - `markAsReadParamsSchema` - Path params para operaciones por ID

#### **service.ts** (NotificationsService)
Métodos implementados:
- `createNotification()` - Crear una notificación individual
- `createNotifications()` - Crear múltiples notificaciones en batch
- `getNotificationsByUser()` - Obtener notificaciones con paginación
- `getUnreadCount()` - Contar notificaciones no leídas
- `markAsRead()` - Marcar una notificación como leída
- `markAllAsRead()` - Marcar todas las notificaciones como leídas
- `deleteNotification()` - Eliminar una notificación
- `notifyMentionedUsers()` - Crear notificaciones para usuarios mencionados

### 2. Integración con Memories (`modules/memories/service.ts`)

Se agregó lógica para crear notificaciones automáticamente cuando:

- **Se crea un recuerdo con imagen** (`createMemoryWithImage`)
- **Se crea una nota** (`createNote`)
- **Se actualiza un recuerdo** (`updateMemory`) - solo para nuevas menciones

#### Flujo de integración:
1. Extrae los IDs de usuarios mencionados del título y caption (formato `<@user_id>`)
2. Sincroniza menciones en la tabla `mentions`
3. Obtiene el `displayName` del usuario que creó el recuerdo
4. Crea notificaciones para cada usuario mencionado (excepto el autor)
5. Las notificaciones no son críticas - si fallan no interrumpen el flujo

### 3. Actualización de Menciones (`services/mentions.ts`)
- El método `extractMentionIds()` ahora es público
- Permite ser usado por otros servicios para extraer menciones

### 4. Configuración de la API (`app.ts`)
- Router de notificaciones montado en `/notifications`
- Autenticación requerida con `withAuth` middleware
- Tag "notifications" agregado en la documentación OpenAPI

### 5. Middleware de Autenticación (`middleware/auth.ts`)
- Expone `userId` en el contexto para compatibilidad
- Usa `c.var.user.id` como estándar

## Tipos de Supabase

✅ **Los tipos ya están actualizados** - Las tablas `notifications` y `mentions` están incluidas en `supabase-types.ts`.

### Regenerar Tipos (cuando se agreguen nuevas tablas)

Ejecuta el siguiente comando desde la raíz del proyecto:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > apps/api/src/supabase-types.ts
```

Reemplaza `YOUR_PROJECT_ID` con el ID de tu proyecto en Supabase.

## Estructura de la Tabla Notifications

La tabla `notifications` ya debe estar creada en Supabase con la siguiente estructura:

```sql
create table public.notifications (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  actor_id uuid null,
  event_type text not null,
  entity_type text not null,
  entity_id uuid not null,
  title text null,
  body text null,
  read boolean not null default false,
  created_at timestamp with time zone not null default now(),
  constraint notifications_pkey primary key (id),
  constraint notifications_actor_fkey foreign key (actor_id) references users (id) on delete set null,
  constraint notifications_user_fkey foreign key (user_id) references users (id) on delete cascade
);
```

## Flujo de Notificaciones

1. Usuario A crea un recuerdo mencionando a Usuario B con formato `<@user_id>`
2. El sistema detecta la mención y la sincroniza en la tabla `mentions`
3. Se crea una notificación para Usuario B con:
   - `event_type`: "mention"
   - `entity_type`: "memory"
   - `entity_id`: ID del recuerdo
   - `title`: "<@user_id_de_A> te mencionó en un recuerdo"
   - `body`: Título del recuerdo
   - `actor_id`: ID de Usuario A
4. Usuario B puede ver la notificación en `/notifications`
5. El frontend procesa la mención `<@user_id_de_A>` y muestra el nombre del usuario

### Ventajas del formato `<@user_id>`

- **Consistencia**: Mismo formato que las menciones en recuerdos
- **Nombres actualizados**: Si el usuario cambia su nombre, se muestra el actual
- **Reutilización**: Usa la función `extractMentions` existente en el mobile
- **Interactividad**: Las menciones pueden ser clickeables

## Endpoints de la API

Todos los endpoints requieren autenticación (Bearer token) y están documentados en Swagger:

- `GET /notifications?limit=50&offset=0` - Lista de notificaciones con paginación
- `GET /notifications/unread-count` - Contador de no leídas
- `PATCH /notifications/:id/read` - Marcar como leída
- `PATCH /notifications/read-all` - Marcar todas como leídas
- `DELETE /notifications/:id` - Eliminar notificación

### Ejemplo de Respuesta

```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "actor_id": "uuid",
    "event_type": "mention",
    "entity_type": "memory",
    "entity_id": "uuid",
    "title": "<@actor-uuid> te mencionó en un recuerdo",
    "body": "Título del recuerdo",
    "read": false,
    "created_at": "2026-01-07T12:00:00Z"
  }
]
```

## Consistencia con la Arquitectura

El módulo de notificaciones sigue el mismo patrón que los demás módulos del proyecto:

### Patrón Estándar
1. **OpenAPIHono**: Documentación automática en Swagger
2. **Middleware de servicio**: Inyecta el servicio en `c.var.notificationsService`
3. **Acceso a usuario**: Usa `c.var.user.id` del contexto
4. **Estructura de archivos**: `handler.ts`, `schema.ts`, `service.ts`
5. **Montaje de rutas**: Con `app.route("/", notificationsApp)`
6. **Autenticación**: Con `withAuth` middleware en `app.ts`

### Comparación con Otros Módulos

```typescript
// Patrón usado por achievements, memories, streaks, y ahora notifications:

// 1. Declarar el servicio en el contexto
declare module "hono" {
  interface ContextVariableMap {
    notificationsService: NotificationsService;
  }
}

// 2. Middleware para inyectar el servicio
notificationsApp.use("/notifications/*", async (c, next) => {
  const service = new NotificationsService(c.var.supabase);
  c.set("notificationsService", service);
  await next();
});

// 3. Usar el servicio desde el contexto
notificationsApp.openapi({ /* config */ }, async (c) => {
  const userId = c.var.user.id;
  const data = await c.var.notificationsService.getNotificationsByUser(userId);
  return c.json(data);
});
```

## Testing

Para probar el sistema:

1. **Crear un recuerdo con mención**:
   ```
   POST /memories
   {
     "title": "Mira esto <@uuid-del-usuario>",
     "caption": "Un recuerdo especial",
     "groupId": "...",
     "bookId": "..."
   }
   ```

2. **Verificar notificaciones**:
   ```
   GET /notifications
   ```

3. **Revisar contador**:
   ```
   GET /notifications/unread-count
   ```

4. **Marcar como leída**:
   ```
   PATCH /notifications/:id/read
   ```

## Swagger Documentation

Todas las rutas están documentadas en Swagger UI:
- Abre `http://localhost:54321/` (o tu URL de desarrollo)
- Busca la sección "notifications"
- Verás todos los endpoints con sus esquemas de request/response

## Próximos Pasos

- [x] Implementar servicio de notificaciones
- [x] Crear endpoints REST con OpenAPI
- [x] Integrar con sistema de menciones
- [x] Seguir arquitectura estándar del proyecto
- [x] Documentar en Swagger
- [ ] Implementar notificaciones push (opcional)
- [ ] Agregar notificaciones para otros eventos (logros, actividades, etc.)
- [ ] Implementar UI de notificaciones en el frontend mobile
