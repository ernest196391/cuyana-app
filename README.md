This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Los pedidos de remesa llegan también a Cuadre

Cuando alguien pide una remesa en la calculadora, el pedido se guarda en
`orders` —como siempre— y además se avisa a **Cuadre**, la herramienta con la
que se operan las entregas. Aparece en su bandeja de *Pedidos* y desde ahí se
convierte en una entrega.

La tienda (comida y energía) **no** pasa por Cuadre: Cuadre es una herramienta
de remesas y no sabe qué hacer con un pedido de comida.

El camino es `Calculator.tsx` → `POST /api/cuadre` (aquí) → `POST /api/pedidos`
(en Cuadre). Da ese rodeo por una razón: **la clave de Cuadre no puede pisar el
navegador.** Quien la tenga puede meter pedidos en Cuadre sin cuenta ni
contraseña, así que vive en `CUADRE_API_KEY` —sin prefijo `NEXT_PUBLIC_`— y solo
la lee `src/app/api/cuadre/route.ts`.

Tres cosas que conviene saber de esa ruta:

- **El dinero no se lo cree al cliente.** El navegador dice cuánto se envía y
  por qué método; la tasa y el monto de destino se recalculan contra
  `delivery_methods`. Es la misma regla que ya sigue la tienda con los precios.
- **Si Cuadre falla, el cliente no se entera.** Su pedido ya está en `orders` y
  ya va camino de WhatsApp. Sin `CUADRE_API_KEY` la web funciona igual: los
  pedidos se pasan a mano.
- **Reenviar no duplica.** Cada pedido lleva una identidad que Cuadre usa como
  tal; el segundo intento devuelve el primero.

## Decisiones tomadas, para no volver a discutirlas

Cosas que alguien podría mirar y pensar que faltan. No faltan: se
decidieron así.

**El alta de cuenta exige confirmar por correo, y el proyecto no tiene
servidor de correo.** El remitente que trae Supabase de fábrica es para
probar —unos pocos correos por hora y no llega a Gmail con fiabilidad—, así
que hoy quien se registra se queda esperando un enlace que no llega. La web
ya lo dice sin mentir y ofrece salida por WhatsApp, pero eso es un parche.
Para cerrarlo, una de las dos:

  1. Apagar la confirmación: Supabase → Authentication → Sign In / Providers
     → Email → **Confirm email** a OFF. El alta abre la sesión en el momento
     y el aviso deja de salir. Es lo coherente con cómo funciona esto: aquí
     a nadie lo verifica su correo, lo verifica su carnet.
  2. O poner un servidor de correo (Resend tiene capa gratuita) en
     Authentication → Emails → SMTP Settings, si se prefiere conservar la
     confirmación.

El código aguanta las dos sin tocar nada.

**No se le avisa al cliente cuando su envío cambia de estado.** Lo ve
entrando en su cuenta, y el comprobante que le pasó a su familia se
actualiza solo — es un enlace, no una captura. Avisar de verdad pide un
canal: correo (hay que dar de alta un servidor de correo en Supabase) o
la WhatsApp Business API (se paga por conversación y Meta tiene que
verificar el negocio). Mientras tanto, Adonys escribe por WhatsApp cuando
hace falta, que es lo que ya hacía. Todo lo demás está montado para que
añadir el aviso sea solo enganchar el canal: los saltos de estado ya se
guardan uno a uno con su hora en `cuadre.envio_estados`.

**Cuánto se le da a un cliente por traer a un amigo no está en el
código.** Cada cliente verificado saca su código de referido desde su
cuenta, pero nace con `commission_pct = 0`. Ese número lo pone Adonys en
el panel de referidos. Es dinero real y no es algo que deba inventar la
app; la pantalla del cliente no le promete ningún porcentaje.

**Cuánto se le puede adelantar en Cuba tampoco.** Sale de
`customer_profiles.credito_usd`, que empieza en 0 y solo mueve un
administrador desde el panel de clientes, sobre alguien ya verificado. La
base lo hace cumplir: un cliente que intente subirse el nivel o ponerse
crédito recibe un 42501.

**La cuenta de dueño de Cuadre sigue siendo la de Ernesto**
(`rondonernesto316@gmail.com`). Adonys entra con ella por ahora. Cuando
haya que separarlas, dar de alta a otro administrador es una fila en
`app_admins` — no una migración ni un despliegue, que es justamente para
lo que se creó esa tabla.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
