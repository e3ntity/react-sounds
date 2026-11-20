import CodeBlock from "@/components/CodeBlock";
import { Guide } from "@/components/Guide";
import React from "react";
import { Link } from "react-router-dom";

const UseSoundVsReactSounds: React.FC = () => (
  <Guide path="/guides/use-sound-vs-react-sounds">
    <p>
      If you search for a way to play sounds in React, you'll quickly find two libraries that both give you a{" "}
      <code>useSound</code> hook: <a href="https://github.com/joshwcomeau/use-sound">use-sound</a> by Josh Comeau and
      <Link to="/">react-sounds</Link>, which I built. Both are MIT-licensed, both are written in TypeScript and both use{" "}
      <Link to="/guides/howler-react">Howler.js</Link> under the hood. So which one should you use?
    </p>
    <p>
      I'm obviously biased, so I'll try to keep this as factual as possible and also say where use-sound is the better
      choice. The short version: use-sound is a minimal hook for audio files you bring yourself; react-sounds adds a
      library of ready-made sounds and some app-level features on top.
    </p>

    <h2>The basic API</h2>
    <p>Here's the same button in both libraries. With use-sound:</p>
    <CodeBlock>{`import useSound from "use-sound";
import popSfx from "./sounds/pop.mp3";

function LikeButton() {
  const [play] = useSound(popSfx, { volume: 0.5 });
  return <button onClick={() => play()}>Like</button>;
}`}</CodeBlock>
    <p>And with react-sounds:</p>
    <CodeBlock>{`import { useSound } from "react-sounds";

function LikeButton() {
  const { play } = useSound("ui/pop_open", { volume: 0.5 });
  return <button onClick={() => play()}>Like</button>;
}`}</CodeBlock>
    <p>
      They look almost the same. The differences are in the details: use-sound returns a tuple{" "}
      <code>[play, {"{ stop, pause, sound, duration }"}]</code>, react-sounds returns an object with{" "}
      <code>play</code>, <code>stop</code>, <code>pause</code>, <code>resume</code>, <code>isPlaying</code> and{" "}
      <code>isLoaded</code>. And in the use-sound example, we import our own MP3 file (which requires your bundler to
      handle audio imports), while <code>ui/pop_open</code> in react-sounds is one of the built-in sounds. Both accept a
      plain URL as well.
    </p>

    <h2>Side-by-side comparison</h2>
    <div className="table-scroll">
    <table>
      <thead>
        <tr>
          <th></th>
          <th>use-sound</th>
          <th>react-sounds</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Built-in sounds</td>
          <td>None, bring your own files</td>
          <td>
            72 built-in sounds (UI, notification, game, ambient), loaded from a CDN when used, plus sound packs from{" "}
            <a href="https://openfoley.com">openfoley</a>
          </td>
        </tr>
        <tr>
          <td>Hook</td>
          <td>
            <code>useSound(src, options)</code>
          </td>
          <td>
            <code>useSound(name, options)</code>, <code>useSoundOnChange</code>
          </td>
        </tr>
        <tr>
          <td>Components</td>
          <td>None</td>
          <td>
            <code>Sound</code>, <code>SoundButton</code>, <code>SoundProvider</code>
          </td>
        </tr>
        <tr>
          <td>Sprites</td>
          <td>Yes</td>
          <td>No</td>
        </tr>
        <tr>
          <td>Global mute</td>
          <td>
            Per hook, via the <code>soundEnabled</code> option
          </td>
          <td>
            App-wide with <code>useSoundEnabled()</code>, saved to <code>localStorage</code>
          </td>
        </tr>
        <tr>
          <td>Same sound in many components</td>
          <td>One Howl per hook</td>
          <td>Shared, loaded once</td>
        </tr>
        <tr>
          <td>Typed sound names</td>
          <td>No (you pass file URLs)</td>
          <td>Yes, including your own packs via the CLI</td>
        </tr>
        <tr>
          <td>Offline / self-hosting</td>
          <td>Your files are part of your app</td>
          <td>CDN by default, CLI downloads sounds into your app</td>
        </tr>
        <tr>
          <td>Latest release</td>
          <td>5.0.0 (February 2025)</td>
          <td>1.1.0 (November 2026)</td>
        </tr>
      </tbody>
    </table>
    </div>

    <h2>When I'd pick use-sound</h2>
    <ul>
      <li>
        You already have your own sound files and just want a thin hook around Howler.
      </li>
      <li>
        You use <strong>sprites</strong>, i.e. many sounds in one audio file. use-sound supports them directly; react-sounds
        doesn't.
      </li>
      <li>
        You want the smallest possible API surface. use-sound is one hook and a handful of options, and it loads Howler
        lazily, so it barely affects your initial bundle.
      </li>
    </ul>

    <h2>When I'd pick react-sounds</h2>
    <ul>
      <li>
        You <strong>don't have sounds yet</strong>. Finding, licensing and trimming sound effects is honestly the most
        tedious part of adding audio to an app. With react-sounds, you can browse the{" "}
        <Link to="/sounds">built-in sounds</Link>, pick one and use it by name.
      </li>
      <li>
        You play sounds in many places. A <code>SoundButton</code> or <code>useSoundOnChange</code> saves you an event
        handler each time, and the same sound used in 20 list items is only loaded once.
      </li>
      <li>
        You want a <strong>mute toggle</strong> that works across the app and is remembered between visits, without
        wiring it up yourself.
      </li>
      <li>
        You like autocompletion. Sound names are typed, and when you add a sound pack with the CLI, its names become
        typed too:
      </li>
    </ul>
    <CodeBlock language="bash">{`npx react-sounds-cli add https://openfoley.com/c/ui-sounds`}</CodeBlock>
    <CodeBlock>{`// autocompleted and type-checked
const { play } = useSound("ui-sounds/bright-success-chime");`}</CodeBlock>

    <h2>Switching from use-sound to react-sounds</h2>
    <p>
      Since both wrap Howler, switching is mostly mechanical. Install react-sounds, then change the import and the
      destructuring. Your own files keep working as URLs:
    </p>
    <CodeBlock language="bash">{`npm install react-sounds howler`}</CodeBlock>
    <CodeBlock>{`// before
import useSound from "use-sound";
const [play, { stop }] = useSound("/sounds/pop.mp3", {
  volume: 0.5,
  playbackRate: 1.2,
});

// after
import { useSound } from "react-sounds";
const { play, stop } = useSound("/sounds/pop.mp3", {
  volume: 0.5,
  rate: 1.2,
});`}</CodeBlock>
    <p>
      Note that <code>playbackRate</code> is called <code>rate</code> in react-sounds. If you used the{" "}
      <code>soundEnabled</code> option for muting, you can drop it and use <code>useSoundEnabled()</code> once in your
      settings instead.
    </p>

    <h2>Conclusion</h2>
    <p>
      Both libraries are small, solid wrappers around Howler, and you can't go terribly wrong with either. If you have
      your own files and want the most minimal hook, use-sound is great. If you want to start with ready-made sounds and
      have mute, preloading and shared loading handled for you, give <Link to="/">react-sounds</Link> a try. And if
      you're still deciding whether you need a library at all, have a look at{" "}
      <Link to="/guides/play-sound-in-react">How to play sounds in React</Link>.
    </p>
  </Guide>
);

export default UseSoundVsReactSounds;
