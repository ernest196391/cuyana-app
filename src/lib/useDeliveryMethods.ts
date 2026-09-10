"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export interface DeliveryMethod {
  key: string;
  label: string;
  target_currency: string;
  rate_per_gyd: number;
  note: string | null;
  sort_order: number;
  updated_at: string;
}

export type MethodsStatus = "loading" | "ready" | "error";

export interface LiveMethods {
  methods: DeliveryMethod[];
  /** El updated_at más reciente entre los métodos activos. */
  updatedAt: string | null;
  status: MethodsStatus;
}

/**
 * Lee los métodos de entrega activos desde delivery_methods, ordenados por
 * sort_order. La lista nunca se hardcodea: si el admin agrega un método,
 * aparece en la web sin tocar código.
 */
export function useDeliveryMethods(): LiveMethods {
  const [state, setState] = useState<LiveMethods>({
    methods: [],
    updatedAt: null,
    status: "loading",
  });

  useEffect(() => {
    if (!supabase) {
      setState({ methods: [], updatedAt: null, status: "error" });
      return;
    }
    let active = true;

    (async () => {
      try {
        const queryPromise = Promise.resolve(
          supabase
            .from("delivery_methods")
            .select("key, label, target_currency, rate_per_gyd, note, sort_order, updated_at")
            .eq("active", true)
            .order("sort_order", { ascending: true })
        );
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Tiempo de espera agotado")), 8000);
        });
        const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
        if (!active) return;
        if (error || !data) {
          console.error("No se pudo leer delivery_methods desde Supabase", error);
          setState({ methods: [], updatedAt: null, status: "error" });
          return;
        }

        const methods: DeliveryMethod[] = data.map((m) => ({
          key: m.key as string,
          label: m.label as string,
          target_currency: m.target_currency as string,
          rate_per_gyd: Number(m.rate_per_gyd),
          note: (m.note as string | null) ?? null,
          sort_order: Number(m.sort_order),
          updated_at: m.updated_at as string,
        }));

        const updatedAt = methods.reduce<string | null>((masReciente, m) => {
          if (!masReciente) return m.updated_at;
          return new Date(m.updated_at) > new Date(masReciente) ? m.updated_at : masReciente;
        }, null);

        setState({ methods, updatedAt, status: "ready" });
      } catch (err) {
        if (!active) return;
        console.error("No se pudo conectar con Supabase", err);
        setState({ methods: [], updatedAt: null, status: "error" });
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return state;
}
