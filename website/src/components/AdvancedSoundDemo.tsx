import CodeBlock from "@/components/CodeBlock";
import React, { useState } from "react";
import { LibrarySoundName, useSound } from "react-sounds";
import SoundSelector from "./SoundSelector";

interface SoundButtonProps {
  soundName: LibrarySoundName;
  label: string;
}

interface CategorySoundButtonProps {
  sound: LibrarySoundName;
}

interface Category {
  name: string;
  description: string;
  sounds: LibrarySoundName[];
}

// Enhanced sound demo component with more interactive features
const AdvancedSoundDemo: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-lg shadow-inner">
      <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Interactive Sound Demo</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <BasicSoundButtons />
        <AdvancedSoundController />
      </div>

      <div className="mt-10">
        <h4 className="text-xl font-semibold text-gray-800 mb-4 text-center">Sound Effects Categories</h4>
        <SoundCategories />
      </div>
    </div>
  );
};

// Simple sound buttons section
const BasicSoundButtons: React.FC = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h4 className="text-lg font-semibold text-gray-800 mb-4">Basic Usage</h4>
      <p className="text-gray-600 mb-4">Click the buttons to hear different sound effects.</p>
      <div className="grid grid-cols-2 gap-3">
        <SoundButton soundName="ui/success_blip" label="UI / Success Blip" />
        <SoundButton soundName="ui/blocked" label="UI / Blocked" />
        <SoundButton soundName="notification/info" label="Notification / Info" />
        <SoundButton soundName="game/coin" label="Game / Coin" />
      </div>
      <CodeBlock className="mb-0 mt-4">
        {`import { useSound } from 'react-sounds';

function Button() {
  const { play } = useSound('ui/button_soft');
  return <button onClick={play}>Click Me</button>;
}`}
      </CodeBlock>
    </div>
  );
};

// Simple button component that plays a sound
const SoundButton: React.FC<SoundButtonProps> = ({ soundName, label }) => {
  const { play, isLoaded } = useSound(soundName);
  return (
    <button
      onClick={() => play()}
      disabled={!isLoaded}
      className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-4 cursor-pointer rounded border border-blue-200 transition duration-150 ease-in-out disabled:opacity-50"
    >
      {isLoaded ? label : "Loading..."}
    </button>
  );
};

// Advanced sound controller with volume, rate controls
const AdvancedSoundController: React.FC = () => {
  const [volume, setVolume] = useState<number>(0.7);
  const [rate, setRate] = useState<number>(1.0);
  const [loop, setLoop] = useState<boolean>(false);
  const [selectedSound, setSelectedSound] = useState<LibrarySoundName>("notification/success");

  const { play, stop, pause, resume, isPlaying, isLoaded } = useSound(selectedSound);

  const handlePlay = (): void => {
    play({ volume, rate, loop });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h4 className="text-lg font-semibold text-gray-800 mb-4">Advanced Controls</h4>
      <p className="text-gray-600 mb-4">Try adjusting these parameters before playing the sound.</p>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Volume: {volume.toFixed(1)}</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Playback Rate: {rate.toFixed(1)}x</label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={rate}
            onChange={(e) => setRate(parseFloat(e.target.value))}
            className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <SoundSelector onSelect={setSelectedSound} value={selectedSound} />

        <div className="flex items-center">
          <input
            type="checkbox"
            id="loop-checkbox"
            checked={loop}
            onChange={(e) => setLoop(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="loop-checkbox" className="ml-2 block text-sm text-gray-700">
            Loop Sound
          </label>
        </div>
      </div>

      <div className="flex gap-2 flex-col sm:flex-row">
        <button
          onClick={handlePlay}
          disabled={!isLoaded || isPlaying}
          className="bg-blue-600 not-disabled:hover:bg-blue-700 text-white not-disabled:cursor-pointer font-medium py-2 px-4 rounded transition duration-150 ease-in-out disabled:opacity-50"
        >
          Play
        </button>
        <button
          onClick={() => pause()}
          disabled={!isPlaying}
          className="bg-yellow-600 not-disabled:hover:bg-yellow-700 text-white not-disabled:cursor-pointer font-medium py-2 px-4 rounded transition duration-150 ease-in-out disabled:opacity-50"
        >
          Pause
        </button>
        <button
          onClick={() => resume()}
          disabled={isPlaying || !isLoaded}
          className="bg-green-600 not-disabled:hover:bg-green-700 text-white not-disabled:cursor-pointer font-medium py-2 px-4 rounded transition duration-150 ease-in-out disabled:opacity-50"
        >
          Resume
        </button>
        <button
          onClick={() => stop()}
          disabled={!isPlaying}
          className="bg-red-600 not-disabled:hover:bg-red-700 text-white not-disabled:cursor-pointer font-medium py-2 px-4 rounded transition duration-150 ease-in-out disabled:opacity-50"
        >
          Stop
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Status: {isLoaded ? "Loaded" : "Loading"}, {isPlaying ? "Playing" : "Stopped"}
      </div>
    </div>
  );
};

// Sound categories showcase
const SoundCategories: React.FC = () => {
  const categories: Category[] = [
    {
      name: "Notification Sounds",
      description: "Ideal for alerts, confirmations, and system events",
      sounds: ["notification/info", "notification/popup", "notification/success", "notification/error"],
    },
    {
      name: "Game Sounds",
      description: "Great for achievements, collectibles, and game events",
      sounds: ["game/coin", "game/void", "game/hit", "game/miss"],
    },
    {
      name: "UI Sounds",
      description: "Perfect for buttons, toggles, and interface interactions",
      sounds: ["ui/blocked", "ui/button_medium", "ui/panel_expand", "ui/panel_collapse"],
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {categories.map((category, index) => (
        <div key={index} className="bg-white p-4 rounded-lg shadow">
          <h5 className="font-semibold text-gray-800 mb-2">{category.name}</h5>
          <p className="text-sm text-gray-600 mb-3">{category.description}</p>
          <div className="space-y-2">
            {category.sounds.map((sound, idx) => (
              <CategorySoundButton key={idx} sound={sound} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Category sound button with name display
const CategorySoundButton: React.FC<CategorySoundButtonProps> = ({ sound }) => {
  const { play, isLoaded } = useSound(sound);
  const displayName = sound.split("/").pop();

  return (
    <button
      onClick={() => play()}
      disabled={!isLoaded}
      className="w-full text-left px-3 py-2 cursor-pointer bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 text-sm transition duration-150 ease-in-out disabled:opacity-50 flex justify-between items-center"
    >
      <span>{displayName}</span>
      <span className="text-xs text-gray-500">{isLoaded ? "Play" : "Loading..."}</span>
    </button>
  );
};

export default AdvancedSoundDemo;
