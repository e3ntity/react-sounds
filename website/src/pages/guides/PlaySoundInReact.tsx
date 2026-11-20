import CodeBlock from "@/components/CodeBlock";
import { Guide } from "@/components/Guide";
import React from "react";
import { Link } from "react-router-dom";

const PlaySoundInReact: React.FC = () => (
  <Guide path="/guides/play-sound-in-react">
    <p>
      Playing a sound in React looks like a one-liner. You create an <code>Audio</code> object, call <code>play()</code>{" "}
      and you're done. And for a quick prototype, that's true. But once you put sounds on buttons, notifications or a game
      loop, you'll run into the browser's autoplay rules, noticeable delays on Safari, sounds that cut each other off and
      audio that keeps loading after the component is long gone.
    </p>
    <p>
      In this guide, we'll go through the three ways of playing sounds in React: the HTML <code>Audio</code> element, the
      Web Audio API and a library. For each, I'll show working code and where it breaks down, so you can pick the one
      that fits your app.
    </p>

    <h2>1. The HTML Audio element</h2>
    <p>
      The simplest way is the <code>Audio</code> constructor that every browser ships with. It needs no dependencies and
      works for most one-off sounds.
    </p>
    <CodeBlock>{`function SaveButton() {
  const handleClick = () => {
    new Audio("/sounds/click.mp3").play();
    // ... save the document
  };

  return <button onClick={handleClick}>Save</button>;
}`}</CodeBlock>
    <p>
      This creates a new <code>Audio</code> object on every click. The browser caches the file after the first request,
      so that's fine for occasional sounds. If you play the same sound often, keep a single instance around with{" "}
      <code>useRef</code> and rewind it before playing. Otherwise, clicking quickly will create a pile of overlapping
      players.
    </p>
    <CodeBlock>{`import { useRef } from "react";

function SaveButton() {
  const audio = useRef<HTMLAudioElement | null>(null);

  const handleClick = () => {
    audio.current ??= new Audio("/sounds/click.mp3");
    audio.current.currentTime = 0; // restart if it's still playing
    audio.current.play().catch(() => {}); // see "Autoplay" below
  };

  return <button onClick={handleClick}>Save</button>;
}`}</CodeBlock>
    <p>
      Note that we create the <code>Audio</code> object lazily inside the event handler and not during render. During
      server-side rendering (e.g. with Next.js) there is no <code>Audio</code> constructor, and calling it at the top of
      your component will crash the render.
    </p>
    <p>The Audio element works, but it has a few limitations that you'll notice in interactive UIs:</p>
    <ul>
      <li>
        <strong>Latency.</strong> Especially Safari can take a noticeable moment between <code>play()</code> and the sound
        actually starting. For a button click, even 100&nbsp;ms feels off.
      </li>
      <li>
        <strong>One sound at a time per element.</strong> Rewinding cuts off the previous play. If you want overlapping
        sounds (e.g. rapid keystrokes), you need several elements.
      </li>
      <li>
        <strong>Mobile.</strong> iOS ignores the <code>volume</code> property of Audio elements entirely, so you can't
        make a sound quieter there.
      </li>
    </ul>

    <h2>2. The Web Audio API</h2>
    <p>
      The Web Audio API is what games and audio apps use. You download and decode a sound once into an{" "}
      <code>AudioBuffer</code>, and then every play is a cheap, near-instant buffer source. Sounds can overlap freely and
      volume works everywhere, since it's done with a gain node.
    </p>
    <CodeBlock>{`let context: AudioContext | null = null;
const buffers = new Map<string, Promise<AudioBuffer>>();

function load(url: string) {
  context ??= new AudioContext();
  if (!buffers.has(url)) {
    const decoded = fetch(url)
      .then((response) => response.arrayBuffer())
      .then((data) => context!.decodeAudioData(data));
    buffers.set(url, decoded);
  }
  return buffers.get(url)!;
}

export async function playSound(url: string, volume = 1) {
  const buffer = await load(url);
  const source = context!.createBufferSource();
  const gain = context!.createGain();
  gain.gain.value = volume;
  source.buffer = buffer;
  source.connect(gain).connect(context!.destination);
  source.start();
}`}</CodeBlock>
    <p>
      In a component, you'd call <code>load()</code> in an effect to warm up the sound, and <code>playSound()</code> in
      your event handler:
    </p>
    <CodeBlock>{`function SendButton() {
  useEffect(() => {
    load("/sounds/send.mp3");
  }, []);

  const handleClick = () => playSound("/sounds/send.mp3", 0.6);
  return <button onClick={handleClick}>Send</button>;
}`}</CodeBlock>
    <p>
      This is fast and flexible, but you're now responsible for things the Audio element did for you: unlocking the
      context on mobile, handling decoding errors, caching and, if you need them, looping, pausing and stopping. That's
      a fair amount of code to get right, which is exactly why most people end up using a library.
    </p>

    <h2>3. Using a library</h2>
    <p>
      <a href="https://howlerjs.com">Howler.js</a> is the standard audio library for the web. It uses the Web Audio API
      when available, falls back to HTML Audio otherwise, and handles unlocking, sprites, looping and volume for you. It
      isn't React-specific though, so you have to manage the lifecycle of your sounds yourself. I wrote a separate guide
      on <Link to="/guides/howler-react">using Howler.js in React</Link> that shows how to do that properly.
    </p>
    <p>
      If you'd rather have a hook, there are two libraries built on top of Howler:{" "}
      <a href="https://github.com/joshwcomeau/use-sound">use-sound</a> and <Link to="/">react-sounds</Link>, which I built. With react-sounds,
      playing a sound looks like this:
    </p>
    <CodeBlock language="bash">{`npm install react-sounds howler`}</CodeBlock>
    <CodeBlock>{`import { useSound } from "react-sounds";

function SendButton() {
  const { play } = useSound("ui/send"); // or any MP3 URL

  return <button onClick={() => play()}>Send</button>;
}`}</CodeBlock>
    <p>
      The hook loads the sound the first time you play it (or up front, with the <code>preload</code> prop of{" "}
      <code>SoundProvider</code>), plays it through Howler and unlocks audio on mobile for you.{" "}
      <code>ui/send</code> is one of the{" "}
      <Link to="/sounds">built-in sounds</Link>, which are loaded from a CDN only when they're used, but you can pass the
      URL of your own file just as well. If you're deciding between the two hooks, I compared them in{" "}
      <Link to="/guides/use-sound-vs-react-sounds">use-sound vs react-sounds</Link>.
    </p>

    <h2>Autoplay: why play() sometimes fails</h2>
    <p>
      Browsers block audio until the user has interacted with the page. If you call <code>play()</code> before the first
      click, tap or key press, the Audio element rejects with a <code>NotAllowedError</code> and an{" "}
      <code>AudioContext</code> starts out in the <code>suspended</code> state.
    </p>
    <p>In practice, this means:</p>
    <ul>
      <li>Sounds in response to clicks and key presses always work.</li>
      <li>
        Sounds triggered by something else (a websocket message, a timer, a page load) only work once the user has
        interacted with the page at least once.
      </li>
      <li>
        Always handle the rejected promise of <code>audio.play()</code>, otherwise you'll get unhandled promise rejections
        in your error tracking.
      </li>
    </ul>
    <p>
      For the Web Audio API, you can resume the context on the first interaction. Howler and the libraries built on it do
      this automatically.
    </p>
    <CodeBlock>{`document.addEventListener(
  "pointerdown",
  () => context?.resume(),
  { once: true },
);`}</CodeBlock>

    <h2>Let users turn sounds off</h2>
    <p>
      Whichever approach you choose, give users a way to mute your app's sounds and remember the choice. Sound is great
      feedback, but some people use your app in an open-plan office or simply don't like it. A toggle in the settings
      and a <code>localStorage</code> flag that your play function checks is enough. In react-sounds, this is built in
      with <code>useSoundEnabled()</code>.
    </p>

    <h2>Which one should you use?</h2>
    <div className="table-scroll">
    <table>
      <thead>
        <tr>
          <th>Approach</th>
          <th>Good for</th>
          <th>Watch out for</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>HTML Audio</td>
          <td>A few one-off sounds, no dependencies</td>
          <td>Latency on Safari, no volume on iOS, no overlap</td>
        </tr>
        <tr>
          <td>Web Audio API</td>
          <td>Games, precise timing, full control</td>
          <td>Lots of code for loading, unlocking and caching</td>
        </tr>
        <tr>
          <td>Howler.js</td>
          <td>Anything beyond a couple of sounds</td>
          <td>You manage the lifecycle in React yourself</td>
        </tr>
        <tr>
          <td>use-sound / react-sounds</td>
          <td>UI sounds in React with a one-line hook</td>
          <td>One more dependency</td>
        </tr>
      </tbody>
    </table>
    </div>
    <p>
      If you only need a click sound on one button, the Audio element is perfectly fine. As soon as you have sounds in
      several places, I'd go with a hook. It saves you from re-implementing loading, unlocking and cleanup in every
      component.
    </p>
    <p>
      And if you're missing the actual sounds: all built-in react-sounds are free to use, and{" "}
      <a href="https://openfoley.com">openfoley</a> has more CC0 sound effects that work with any of the approaches above.
    </p>
  </Guide>
);

export default PlaySoundInReact;
