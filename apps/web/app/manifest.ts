import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#0f1117",
    description: "Codemate chat workspace",
    display: "standalone",
    icons: [
      {
        sizes: "501x498",
        src: "/icon.png",
        type: "image/png",
      },
    ],
    lang: "en",
    name: "Codemate",
    short_name: "Codemate",
    start_url: "/",
    theme_color: "#0f1117",
  };
}
