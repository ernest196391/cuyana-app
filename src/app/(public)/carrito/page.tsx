import type { Metadata } from "next";
import CarritoClient from "./CarritoClient";

export const metadata: Metadata = {
  title: "Tu carrito",
  robots: { index: false, follow: false },
};

export default function CarritoPage() {
  return <CarritoClient />;
}
