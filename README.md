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
