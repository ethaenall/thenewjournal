import { Navigate, useSearchParams } from "react-router-dom";
import SurrealReader from "../surreal/SurrealReader";
import { SongAudioProvider } from "../../lib/SongAudioProvider";
import { readerPath } from "../../lib/publicPages";
import { studyPublication } from "./preview";

export default function Estuary() {
  const [search] = useSearchParams();
  if (!studyPublication) return null;

  const fold = search.get("fold");
  if (fold !== null && !search.has("piece")) {
    const page = Math.min(Number(fold), studyPublication.pieces.length);
    return <Navigate replace to={readerPath(studyPublication, studyPublication.pieces[page - 1])} />;
  }

  return (
    <SongAudioProvider>
      <SurrealReader publication={studyPublication} />
    </SongAudioProvider>
  );
}
