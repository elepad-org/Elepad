# Sistema de Notificaciones para Menciones en Recuerdos

## Resumen

Se ha implementado un sistema completo de notificaciones que crea automáticamente notificaciones para los usuarios cuando son mencionados en un recuerdo (memory).

## Cambios Realizados

### 1. Servicio de Notificaciones (`services/notifications.ts`)
- Creado servicio completo para gestionar notificaciones
- Métodos implementados:
  - `createNotification()`: Crear una notificación individual
  - `createNotifications()`: Crear múltiples notificaciones en batch
  - `getNotificationsByUser()`: Obtener notificaciones de un usuario
  - `getUnreadCount()`: Contar notificaciones no leídas
  - `markAsRead()`: Marcar una notificación como leída
  - `markAllAsRead()`: Marcar todas las notificaciones como leídas
  - `deleteNotification()`: Eliminar una notificación
  - `notifyMentionedUsers()`: Crear notificaciones para usuarios mencionados

### 2. Módulo de Notificaciones (`modules/notifications/`)
- `handler.ts`: Router con endpoints RESTful:
  - `GET /notifications`: Obtener notificaciones del usuario autenticado
  - `GET /notifications/unread-count`: Obtener contador de no leídas
  - `PATCH /notifications/:id/read`: Marcar como leída
  - `PATCH /notifications/read-all`: Marcar todas como leídas
  - `DELETE /notifications/:id`: Eliminar notificación
- `schema.ts`: Esquemas de validación con Zod

### 3. Integración con Memories (`modules/memories/service.ts`)
Se agregó lógica para crear notificaciones cuando:
- Se crea un recuerdo con imagen (`createMemoryWithImage`)
- Se crea una nota (`createNote`)
- Se actualiza un recuerdo (`updateMemory`) - solo para nuevas menciones

La lógica:
1. Extrae los IDs de usuarios mencionados del título y caption
2. Obtiene el nombre del usuario que creó el recuerdo
3. Crea notificaciones para cada usuario mencionado (excepto el autor)
4. Las notificaciones no son críticas - si fallan no interrumpen el flujo

### 4. Actualización de Menciones (`services/mentions.ts`)
- El método `extractMentionIds()` ahora es público para poder ser usado por el servicio de memories

### 5. Configuración de la API (`app.ts`)
- Agregado router de notificaciones con autenticación requerida
- Actualizado el contexto de Hono para incluir `userId`
- Agregado tag "notifications" en la documentación OpenAPI

### 6. Middleware de Autenticación (`middleware/auth.ts`)
- Actualizado para incluir `userId` en el contexto

## Tipos de Supabase

⚠️ **IMPORTANTE**: Los tipos de Supabase necesitan ser regenerados para incluir las tablas `notifications` y `mentions`.

### Regenerar Tipos

Ejecuta el siguiente comando desde la raíz del proyecto:

```bash
# Opción 1: Si tienes acceso al proyecto en Supabase
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > apps/api/src/supabase-types.ts

# Opción 2: Si tienes Supabase CLI configurado localmente
npx supabase gen types typescript --local > apps/api/src/supabase-types.ts
```

Reemplaza `YOUR_PROJECT_ID` con el ID de tu proyecto en Supabase.

Mientras tanto, se han agregado comentarios `@ts-expect-error` para evitar errores de compilación.

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
   - `title`: "{Nombre de Usuario A} te mencionó en un recuerdo"
   - `body`: Título del recuerdo
   - `actor_id`: ID de Usuario A
4. Usuario B puede ver la notificación en `/notifications`

## Endpoints de la API

Todos los endpoints requieren autenticación (Bearer token):

- `GET /notifications?limit=50&offset=0` - Lista de notificaciones
- `GET /notifications/unread-count` - Contador de no leídas
- `PATCH /notifications/:id/read` - Marcar como leída
- `PATCH /notifications/read-all` - Marcar todas como leídas
- `DELETE /notifications/:id` - Eliminar notificación

## Testing

Para probar el sistema:

1. Crea un recuerdo mencionando a otro usuario: `"Mira esto <@uuid-del-usuario>"`
2. Verifica que se cree la notificación: `GET /notifications`
3. Comprueba el contador: `GET /notifications/unread-count`
4. Marca como leída: `PATCH /notifications/:id/read`

## Próximos Pasos

- [ ] Regenerar tipos de Supabase
- [ ] Implementar notificaciones push (opcional)
- [ ] Agregar notificaciones para otros eventos (logros, actividades, etc.)
- [ ] Implementar notificaciones en el frontend mobile
