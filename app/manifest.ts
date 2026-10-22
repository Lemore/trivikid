import type { MetadataRoute } from "next";
import { strings } from "@/lib/strings";

const LIGHT_WOOD = "#FBF1E2";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: strings.appName,
    short_name: strings.appName,
    description: strings.home.description,
    lang: "he",
    dir: "rtl",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: LIGHT_WOOD,
    theme_color: LIGHT_WOOD,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
