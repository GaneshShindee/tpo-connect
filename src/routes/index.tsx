import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getCredentials } from "@/lib/tpo/credentials";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TPO Assistant" },
      { name: "description", content: "Manage and submit company applications through your TPO portal." },
    ],
  }),
  component: Index,
});

function Index() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    setAuthed(!!getCredentials());
    setReady(true);
  }, []);
  if (!ready) return null;
  return <Navigate to={authed ? "/companies" : "/login"} />;
}