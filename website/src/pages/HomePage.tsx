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
        <div className="flex justify-center space-x-4 mb-10">
          <Link
            to="/docs"
            className={cn(
              "bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out",
              soundIsEnabled && isPulsing ? "heartbeat-pulse" : "hover:scale-105"
            )}
            onMouseEnter={hasInteracted ? handleHoverStart : undefined}
            onMouseLeave={handleHoverEnd}
          >
            Get Started
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
        {/* Quick Install Snippet */}
        <div className="max-w-md mx-auto">
          <CodeBlock language="bash">npm install react-sounds howler</CodeBlock>
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

export default HomePage;
