import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "House Construction Tracker",
    short_name: "HouseTracker",
    description: "Track material & labour expenses, milestones, and budgets for your house construction.",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F7F6F2",
    theme_color: "#C56A2D",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
