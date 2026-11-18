# 🚀 Cómo poner PlataClara a funcionar (15 minutos)

La app ya está construida. Solo falta conectarla con **Supabase** (gratis),
que es donde se guardan los datos y se hacen las cuentas de usuario.

## Paso 1 · Crear el proyecto de Supabase (gratis)

1. Entra a <https://supabase.com> y crea una cuenta (puedes usar Google o GitHub).
2. Clic en **New project**.
3. Nombre: `plataclara` (o el que quieras).
4. Contraseña de base de datos: dale "Generate" y guárdala (no la vamos a necesitar para nada más, pero por si acaso).
5. Región: la más cercana, por ejemplo `us-east-1` (Miami) o `sa-east-1` (São Paulo).
6. Espera ~2 minutos a que se cree.

## Paso 2 · Ejecutar el esquema de la base de datos

1. En el panel izquierdo de Supabase, clic en el ícono **SQL Editor** ( `>_` ).
2. Clic en **New query**.
3. Copia **todo el contenido** del archivo `supabase/schema.sql` de este proyecto y pégalo.
4. Clic en **Run** (o `Ctrl+Enter`). Debe terminar en "Success".
   - Si la última línea da error por el realtime, es normal: ignórala o ejecútala aparte una vez.

## Paso 3 · Copiar las credenciales al proyecto

1. En Supabase: **Settings → API** (o el botón "Connect").
2. Copia los dos valores: **Project URL** y **anon public key**.
3. Abre el archivo `.env.local` en la raíz del proyecto y pega los valores:

```
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...tu_clave...
```

## Paso 4 · Permitir registro sin confirmar correo (opcional, recomendado para empezar)

Para no tener que confirmar el correo mientras pruebas:

1. En Supabase: **Authentication → Sign In / Providers → Email**.
2. Desactiva **"Confirm email"** y guarda.

Si lo dejas activado, también funciona: al registrarse la app pedirá confirmar el correo.

## Paso 5 · Correr la app

```bash
npm run dev
```

Abre <http://localhost:3000> y:

1. **Crea tu cuenta** (pestaña "Crear cuenta").
2. **Crea tu grupo familiar** → te dará un **código de 6 caracteres**.
3. En otro celular o navegador de incógnito, crea otra cuenta y **únete con el código**.
4. ¡Registra gastos y mira cómo se sincronizan en tiempo real! 🎉

## Siguientes pasos (cuando quieras)

- **Subirlo a GitHub**: dime "conectémoslo con GitHub" y lo hacemos juntos.
- **Publicarlo en internet**: Vercel (gratis) con el mismo repo.
- **Fase 2**: bolsas digitales, tarjetas colombianas, semáforo DIAN.

## Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx              → decide a dónde ir
│   ├── ingresar/             → login y registro
│   ├── bienvenida/           → crear grupo o unirse con código
│   ├── panel/                → app principal (protegida)
│   │   ├── page.tsx          → dashboard del mes
│   │   ├── movimientos/      → lista + registro de gastos/ingresos
│   │   └── familia/          → miembros y código de invitación
│   └── auth/callback/        → confirmación de correo
├── lib/
│   ├── supabase/             → clientes de Supabase (navegador y servidor)
│   ├── actions/              → acciones del servidor (crear/unirse a familia)
│   ├── data.ts               → consultas del servidor
│   ├── format.ts             → formato COP y fechas
│   └── types.ts              → tipos de datos
├── proxy.ts                  → mantiene la sesión viva (Next 16)
└── components/               → componentes UI (shadcn)
supabase/
└── schema.sql                → tablas + seguridad RLS + triggers
```
