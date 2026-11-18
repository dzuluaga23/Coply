# PlataClara 💰

**Las finanzas de tu familia, claras.** App web de presupuesto familiar para
Colombia: cada quien registra sus gastos desde su celular y todos ven lo mismo
al instante.

## Características (Fase 1)

- ✅ Cuentas de usuario con correo y contraseña
- ✅ Grupos familiares **multi-tenant** con aislamiento real (RLS): cada familia
  es una isla, ninguna ve los datos de otra
- ✅ Invitación por **código de 6 caracteres**
- ✅ Registro de gastos e ingresos en segundos, con categorías por defecto
- ✅ Panel del mes: entró / salió / queda + "¿en qué se fue la plata?"
- ✅ Sincronización en **tiempo real** entre los miembros
- ✅ Design system **shadcn/ui**

## Stack

| Pieza | Tecnología |
|---|---|
| App | Next.js 16 (App Router) + React 19 |
| Estilos | Tailwind CSS v4 + shadcn/ui |
| Datos y auth | Supabase (PostgreSQL + RLS + Realtime) |
| Publicación | Vercel |

## Empezar

Ver [SETUP.md](./SETUP.md) — conexión con Supabase y puesta en marcha.

```bash
npm install
npm run dev
```

## Roadmap

- [ ] Fase 2: bolsas digitales, tarjetas a la colombiana (corte/cuotas/abonos),
      semáforo tributario DIAN
- [ ] Fase 3: negocio aparte, plan libertador de deudas, retos de ahorro, PWA
