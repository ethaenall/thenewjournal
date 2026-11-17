import { lazy } from "react";
import type { Publication } from "../../data/publications";

export const bookStudyEnabled = import.meta.env.DEV || import.meta.env.MODE === "book-study";
export const studyPath = "/studies/estuary/";
const imageRoot = import.meta.env.BASE_URL + (import.meta.env.DEV
  ? "src/components/estuary/"
  : "studies/estuary/");
const panorama = imageRoot + "estuary.webp";

export const studyPublication: Publication | null = bookStudyEnabled ? {
  id: "estuary",
  caption: "Estuary",
  theme: "surreal",
  issueNumber: "02",
  previewPath: studyPath,
  coverSrc: panorama,
  readerScenery: {
    lowTide: panorama,
    highTide: imageRoot + "high-tide.webp",
    tideLevels: [0, .24, .46, .71, 1],
    plates: {
      "salt-grass": imageRoot + "salt-grass.webp",
      "the-channel": imageRoot + "the-channel.webp",
      egret: imageRoot + "egret.webp",
      "the-headland": imageRoot + "the-headland.webp",
    },
  },
  glow: "green",
  pieces: [
    { id: "salt-grass", title: "Salt grass", lines: ["A seed head bends.", "Its shadow slips", "between the reeds."] },
    { id: "the-channel", title: "The channel", lines: ["The tide goes out", "along a little silver road", "too thin to walk."] },
    { id: "egret", title: "Egret", lines: ["One white leg lifts.", "For a moment the bird", "stands on its reflection."] },
    { id: "the-headland", title: "The headland", lines: ["Light catches in the pines.", "The last pool keeps", "a little for itself."] },
  ].map(piece => ({ ...piece, type: "poem", glow: "green", author: "The New Journal preview", editorArtCaption: "" })),
} : null;

export const StudyReader = bookStudyEnabled ? lazy(() => import("./Estuary")) : null;
