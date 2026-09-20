import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Curuguay — Cerca, aunque estén lejos.",
    short_name: "Curuguay",
    description: "Remesas desde Uruguay hacia Cuba.",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F8FC",
    theme_color: "#103563",
    lang: "es",
    icons: [
      { src: "/brand/curuguay/curuguay-avatar-light.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
