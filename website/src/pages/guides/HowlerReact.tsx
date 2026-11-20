import CodeBlock from "@/components/CodeBlock";
import { Guide } from "@/components/Guide";
import React from "react";
import { Link } from "react-router-dom";

const HowlerReact: React.FC = () => (
  <Guide path="/guides/howler-react">
    <p>
      <a href="https://howlerjs.com">Howler.js</a> is the library most web apps use for audio. It picks the Web Audio API
      where available, falls back to HTML5 Audio, unlocks audio on mobile and gives you sprites, looping, fading and
      volume control. What it doesn't give you is any notion of React. A <code>Howl</code> is a long-lived, stateful
      object, and if you create it in the wrong place you'll end up with sounds that are loaded on every render, keep
      playing after a component unmounts or never get freed.
    </p>
    <p>
      In this guide, we'll build a small <code>useHowl()</code> hook that loads a sound once, cleans up after itself and
      plays without delay. It's roughly what <Link to="/">react-sounds</Link> does under the hood, so it's also a good way to understand how
      the sound hooks work.
    </p>

    <h2>Installing Howler</h2>
    <CodeBlock language="bash">{`npm install howler
npm install -D @types/howler # if you use TypeScript`}</CodeBlock>

    <h2>The naive version</h2>
    <p>The first thing most people write looks like this:</p>
    <CodeBlock>{`import { Howl } from "howler";

function LikeButton() {
  // runs on every render!
  const sound = new Howl({ src: ["/sounds/pop.mp3"] });

  return <button onClick={() => sound.play()}>Like</button>;
}`}</CodeBlock>
    <p>
      It works, which is what makes it sneaky. But the component body runs on every render, so every state change creates
      a new <code>Howl</code> that starts loading the file again. None of them are ever unloaded. In a list of 50 like
      buttons, that's 50 players per render. It also breaks server-side rendering, because the component touches browser
      APIs while rendering.
    </p>

    <h2>Creating the Howl in an effect</h2>
    <p>
      The fix is to create the <code>Howl</code> in an effect, keep it in a ref and unload it in the cleanup function.
      That way it exists exactly as long as the component does:
    </p>
    <CodeBlock>{`import { Howl } from "howler";
import { useEffect, useRef } from "react";

function LikeButton() {
  const sound = useRef<Howl | null>(null);

  useEffect(() => {
    sound.current = new Howl({ src: ["/sounds/pop.mp3"], volume: 0.5 });
    return () => {
      sound.current?.unload();
      sound.current = null;
    };
  }, []);

  return <button onClick={() => sound.current?.play()}>Like</button>;
}`}</CodeBlock>
    <p>
      <code>unload()</code> stops the sound and releases its resources. Without it, a sound that's playing while the user
      navigates away just keeps going. Since the effect runs only in the browser, this also works with Next.js and other
      SSR frameworks.
    </p>

    <h2>A reusable useHowl hook</h2>
    <p>Writing that in every component gets old quickly, so let's move it into a hook:</p>
    <CodeBlock>{`import { Howl, type HowlOptions } from "howler";
import { useCallback, useEffect, useRef } from "react";

type Options = Omit<HowlOptions, "src">;

export function useHowl(src: string, options: Options = {}) {
  const howl = useRef<Howl | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    howl.current = new Howl({ src: [src], ...optionsRef.current });
    return () => {
      howl.current?.unload();
      howl.current = null;
    };
  }, [src]);

  const play = useCallback(
    (sprite?: string) => howl.current?.play(sprite),
    [],
  );
  const stop = useCallback(() => howl.current?.stop(), []);

  return { play, stop, howl };
}`}</CodeBlock>
    <p>
      The <code>Howl</code> is recreated only when <code>src</code> changes. The options are read from a ref, so passing
      an inline object like <code>{"{ volume: 0.5 }"}</code> doesn't reload the sound on every render. Using it is now
      a one-liner:
    </p>
    <CodeBlock>{`function LikeButton() {
  const { play } = useHowl("/sounds/pop.mp3", { volume: 0.5 });
  return <button onClick={() => play()}>Like</button>;
}`}</CodeBlock>

    <h2>Sprites: many sounds in one file</h2>
    <p>
      If your app has a lot of short sounds, you can put them into a single file and tell Howler where each one starts
      and how long it is (both in milliseconds). That's one request instead of ten:
    </p>
    <CodeBlock>{`const { play } = useHowl("/sounds/ui.mp3", {
  sprite: {
    click: [0, 120],
    success: [500, 900],
    error: [1500, 600],
  },
});

play("success");`}</CodeBlock>

    <h2>Global volume and mute</h2>
    <p>
      The <code>Howler</code> global (not <code>Howl</code>) controls all sounds at once. That's the easiest way to build
      a mute toggle:
    </p>
    <CodeBlock>{`import { Howler } from "howler";

Howler.mute(true); // mute everything
Howler.volume(0.5); // master volume`}</CodeBlock>
    <p>
      Remember to persist the setting, e.g. in <code>localStorage</code>, and apply it when your app starts.
    </p>

    <h2>Things to keep in mind</h2>
    <ul>
      <li>
        <strong>Autoplay.</strong> Browsers block audio until the user has interacted with the page. Howler unlocks audio
        on the first interaction by itself, but a sound you trigger before that (e.g. on page load) won't play.
      </li>
      <li>
        <strong>Long files.</strong> By default, Howler downloads and decodes the whole file before playing. For music or
        long ambience, pass <code>html5: true</code> so it starts streaming right away.
      </li>
      <li>
        <strong>Formats.</strong> MP3 plays in every current browser. You can list several formats in{" "}
        <code>src</code> and Howler picks the first one the browser supports.
      </li>
      <li>
        <strong>Strict mode.</strong> In development, React mounts effects twice. You'll see the sound being created,
        unloaded and created again. That's expected and doesn't happen in production.
      </li>
    </ul>

    <h2>Or skip the boilerplate</h2>
    <p>
      The hook above covers most apps. If you also want sounds to be shared between components, preloaded, muted
      globally with a persisted setting and ready-made sounds to start with, that's what I built{" "}
      <Link to="/">react-sounds</Link> for. It uses Howler under the hood, so everything in this guide still applies:
    </p>
    <CodeBlock>{`import { useSound } from "react-sounds";

function LikeButton() {
  const { play } = useSound("ui/pop_open"); // built-in sound, or any MP3 URL
  return <button onClick={() => play()}>Like</button>;
}`}</CodeBlock>
    <p>
      For a broader overview of the options, including the plain Audio element and the Web Audio API, see{" "}
      <Link to="/guides/play-sound-in-react">How to play sounds in React</Link>.
    </p>
  </Guide>
);

export default HowlerReact;
