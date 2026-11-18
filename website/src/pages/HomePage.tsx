import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useSound, useSoundEnabled } from "react-sounds";
import AdvancedSoundDemo from "../components/AdvancedSoundDemo";
import CodeBlock from "../components/CodeBlock";
import FeatureCard from "../components/FeatureCard";
import { cn } from "../utils/cn";

// CSS for the heartbeat pulse animation
const heartbeatPulseStyle = `
  @keyframes heartbeatPulse {
    0%, 100% { transform: scale(1.05); }
    10% { transform: scale(1.1); } /* First beat */
    20% { transform: scale(1.05); } /* Reset after first beat */
    30% { transform: scale(1.08); } /* Second beat (slightly smaller) */
    40% { transform: scale(1.05); } /* Reset after second beat */
  }

  .heartbeat-pulse {
    animation: heartbeatPulse 0.5s infinite;
  }
`;

interface Feature {
  title: string;
  description: string;
  icon: string;
}

const HomePage: React.FC = () => {
  const hoverSound = useSound("ambient/heartbeat", { loop: true });
  const [soundIsEnabled] = useSoundEnabled();
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);

  // Function to handle hovering over the button
  const handleHoverStart = () => {
    if (!hoverSound.isPlaying) {
      hoverSound.play().catch(() => {
        // If the sound fails to play due to locked AudioContext, don't do anything
        // It will not unexpectedly play later
      });
    }
    setIsPulsing(true);
  };

  const handleHoverEnd = () => {
    hoverSound.stop();
    setIsPulsing(false);
  };

  // Track user's first click to know they've interacted
  const handleFirstInteraction = () => {
    setHasInteracted(true);
  };

  const features: Feature[] = [
    {
      title: "🔊 Extensive Library",
      description: "Access curated sounds organized by category (UI, notification, game, etc.).",
      icon: "🔊",
    },
    {
      title: "🪶 Lightweight",
      description:
        "Only JS wrappers included in the package. Audio files are hosted on a CDN to keep your bundle size small.",
      icon: "🪶",
    },
    {
      title: "🏗️ Lazy Loading",
      description: "Sounds are fetched efficiently only when they are needed, improving initial load performance.",
      icon: "🏗️",
    },
    {
      title: "📦 Offline Support",
      description: "Easily download and bundle sounds for self-hosting using the included CLI tool.",
      icon: "📦",
    },
    {
      title: "🎯 Simple API",
      description:
        "Integrate sounds effortlessly with easy-to-use hooks (like useSound) and components (like SoundButton).",
      icon: "🎯",
    },
    {
      title: "⚙️ Configurable",
      description: "Customize CDN URLs, preload sounds, enable/disable sounds globally, and control playback options.",
      icon: "⚙️",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-16" onClick={!hasInteracted ? handleFirstInteraction : undefined}>
      {/* Style tag for custom animations */}
      <style dangerouslySetInnerHTML={{ __html: heartbeatPulseStyle }} />

      {/* Hero Section */}
      <div className="text-center mb-20">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-4">
          Add Sound Effects to Your React Apps Effortlessly
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          <code className="font-mono bg-gray-200 px-1 rounded">react-sounds</code> provides a library of ready-to-play
          sound effects with a simple API, lazy loading, and offline support.
          <span className="inline-flex items-center px-3 py-1 ml-2 rounded-full bg-green-100 text-green-800 text-sm font-medium">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            MIT License
          </span>
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-10">
          <Link
            to="/docs"
            className={cn(
              "bg-blue-600 hover:bg-blue-700 border-2 border-blue-600 hover:border-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out",
              soundIsEnabled && isPulsing ? "heartbeat-pulse" : "hover:scale-105"
            )}
            onMouseEnter={hasInteracted ? handleHoverStart : undefined}
            onMouseLeave={handleHoverEnd}
          >
            Get Started
          </Link>
          <Link
            to="/sounds"
            className="inline-flex items-center justify-center bg-white hover:bg-blue-50 text-blue-600 border-2 border-blue-600 font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
                clipRule="evenodd"
              />
            </svg>
            Browse Sounds
          </Link>
        </div>
        {/* Quick Install Snippet */}
        <div className="max-w-md mx-auto">
          <CodeBlock language="bash">npm install react-sounds howler</CodeBlock>
        </div>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-600">
          <a
            href="https://www.npmjs.com/package/react-sounds"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center hover:text-gray-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z" />
            </svg>
            View on npm
          </a>
          <a
            href="https://github.com/e3ntity/react-sounds"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center hover:text-gray-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            View on GitHub
          </a>
          <a href="https://openfoley.com" className="inline-flex items-center hover:text-gray-900">
            <OpenfoleyMark className="h-4 w-4 mr-1.5" />
            More sounds on openfoley
          </a>
        </div>
      </div>

      {/* Features Section */}
      <div className="mb-20">
        <h2 className="text-3xl font-bold text-gray-800 mb-10 text-center">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} title={feature.title} description={feature.description} />
          ))}
        </div>
      </div>

      {/* Enhanced Demo Section */}
      <div className="mb-20">
        <AdvancedSoundDemo />
      </div>

      <div className="mb-20 grid grid-cols-1 md:grid-cols-2 items-center gap-8 rounded-lg bg-gray-900 p-6 sm:p-8 text-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Need more sounds?</h2>
          <p className="text-gray-300 mb-5">
            openfoley is an open library of sound effects and sound packs made for react-sounds. Every sound is free
            to use under CC0, and you can generate new ones with AI.
          </p>
          <a
            href="https://openfoley.com"
            className="inline-flex items-center bg-white hover:bg-blue-50 text-gray-900 font-bold py-2 px-4 rounded-lg transition"
          >
            <OpenfoleyMark className="h-5 w-5 mr-2" />
            Browse openfoley
          </a>
        </div>
        <div className="min-w-0">
          <CodeBlock language="bash" className="my-0">
            npx react-sounds-cli add https://openfoley.com/c/ui-sounds
          </CodeBlock>
        </div>
      </div>

      {/* Call to action before footer */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Ready to add sounds?</h2>
        <p className="text-lg text-gray-600 mb-6">Check out the documentation or install the library now.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/docs"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
          >
            Read the Docs
          </Link>
          <Link
            to="/sounds"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
          >
            Browse Sounds
          </Link>
          <a
            href="https://github.com/e3ntity/react-sounds"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
          >
            View on GitHub
          </a>
        </div>
      </div>
    </div>
  );
};

const OpenfoleyMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} aria-hidden>
    <path d="M79 34 A34 34 0 1 0 79 66" fill="none" stroke="#93c5fd" strokeWidth="9" strokeLinecap="round" />
    <path
      d="M25 52 L35 33 L46 68 L57 33 L67 54 L86 40"
      fill="none"
      stroke="#2563eb"
      strokeWidth="10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default HomePage;
