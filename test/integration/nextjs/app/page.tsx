"use client";
import { SoundProvider, useSoundEnabled } from "react-sounds";

function SoundStatus() {
  const [enabled] = useSoundEnabled();
  return <div>Sound: {enabled ? "on" : "off"}</div>;
}

export default function Page() {
  return (
    <SoundProvider>
      <SoundStatus />
    </SoundProvider>
  );
}
