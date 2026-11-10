import React, { useEffect, useMemo, useState } from "react";
import { fetchSoundBlob, LibrarySoundName, useSound } from "react-sounds";
import manifest from "../manifest.json";
import { trackEvent } from "../utils/analytics";
import { cn } from "../utils/cn";

// Number of items per page
const ITEMS_PER_PAGE = 30;

// Color palette for categories
const CATEGORY_COLORS = [
  { bg: "bg-blue-100", text: "text-blue-800" },
  { bg: "bg-green-100", text: "text-green-800" },
  { bg: "bg-purple-100", text: "text-purple-800" },
  { bg: "bg-pink-100", text: "text-pink-800" },
  { bg: "bg-yellow-100", text: "text-yellow-800" },
  { bg: "bg-red-100", text: "text-red-800" },
  { bg: "bg-indigo-100", text: "text-indigo-800" },
  { bg: "bg-orange-100", text: "text-orange-800" },
  { bg: "bg-teal-100", text: "text-teal-800" },
  { bg: "bg-gray-100", text: "text-gray-800" },
];

interface CategoryColor {
  bg: string;
  text: string;
}

// Get consistent color for a category
const getCategoryColor = (category: string): CategoryColor => {
  // Use the sum of character codes as a simple hash
  const hash = category.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  // Get a consistent index from the hash
  const colorIndex = hash % CATEGORY_COLORS.length;
  return CATEGORY_COLORS[colorIndex];
};

// Extract categories from manifest
const extractCategories = (): string[] => {
  const categories = new Set<string>();

  Object.keys(manifest.sounds).forEach((soundKey) => {
    const category = soundKey.split("/")[0];
    categories.add(category);
  });

  return Array.from(categories);
};

interface SoundItemProps {
  soundKey: LibrarySoundName;
  metadata: {
    duration: number;
  };
}

// Sound item component
const SoundItem: React.FC<SoundItemProps> = ({ soundKey, metadata }) => {
  const { play, stop, isPlaying, isLoaded } = useSound(soundKey);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const displayName = soundKey.split("/").pop();
  const category = soundKey.split("/")[0];
  const categoryColor = getCategoryColor(category);

  const handlePlay = (): void => {
    if (isPlaying) {
      stop();
    } else {
      play();
      trackEvent("sound_preview", { sound: soundKey, category });
    }
  };

  const copyToClipboard = (): void => {
    navigator.clipboard.writeText(soundKey).then(() => {
      setCopied(true);
      trackEvent("sound_copy", { sound: soundKey, category });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const downloadSound = async (): Promise<void> => {
    try {
      setDownloading(true);

      // Create a URL to the sound
      const blob = await fetchSoundBlob(soundKey);
      const url = window.URL.createObjectURL(blob);

      // Create a temporary anchor element to trigger download
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${displayName || soundKey}.mp3`;
      document.body.appendChild(a);
      a.click();
      trackEvent("sound_download", { sound: soundKey, category });

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading sound:", error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Card header with category and duration */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
        <span className={cn(`text-xs font-medium px-2 py-1 rounded-full`, categoryColor.bg, categoryColor.text)}>
          {category[0].toUpperCase() + category.slice(1)}
        </span>
        <div className="flex items-center text-xs text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {metadata.duration.toFixed(2)}s
        </div>
      </div>

      {/* Sound name and play button */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 text-lg mb-3">{displayName?.replace(/_/g, " ")}</h3>

        <div className="relative">
          <button
            onClick={handlePlay}
            disabled={!isLoaded}
            className={cn(
              "w-full py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-300 cursor-pointer",
              "disabled:opacity-50 font-medium relative overflow-hidden group",
              isPlaying
                ? cn(
                    categoryColor.text.replace("text", "bg").replace("-800", "-600"),
                    "hover:" + categoryColor.text.replace("text", "bg").replace("-800", "-700")
                  )
                : "bg-gray-100 hover:bg-gray-200 text-gray-800"
            )}
          >
            {isLoaded ? (
              <>
                <div className="relative z-10 flex items-center">
                  {isPlaying ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  )}
                  {isPlaying ? "Stop Sound" : "Play Sound"}
                </div>
              </>
            ) : (
              <div className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-800"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Loading...
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Sound path with copy to clipboard */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <code className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded truncate max-w-[60%]">
          {soundKey}
        </code>
        <div className="flex space-x-2">
          <button
            onClick={copyToClipboard}
            className={cn(
              "text-gray-500 p-1 rounded-full transition-colors cursor-pointer",
              copied ? "text-green-500 bg-green-50" : "hover:text-blue-600 hover:bg-blue-50"
            )}
            title="Copy sound ID to clipboard"
          >
            {copied ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
              </svg>
            )}
          </button>
          <button
            onClick={downloadSound}
            disabled={downloading}
            className={cn(
              "text-gray-500 p-1 rounded-full transition-colors cursor-pointer",
              downloading ? "text-blue-500 bg-blue-50" : "hover:text-blue-600 hover:bg-blue-50"
            )}
            title="Download sound"
          >
            {downloading ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const SoundLibraryPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const categories = useMemo(() => extractCategories(), []);

  // Filter sounds based on search and category
  const filteredSounds = useMemo(() => {
    return Object.entries(manifest.sounds).filter(([soundKey]) => {
      const matchesSearch = searchTerm === "" || soundKey.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === "" || soundKey.startsWith(selectedCategory + "/");

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredSounds.length / ITEMS_PER_PAGE);
  const paginatedSounds = filteredSounds.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Report searches that return nothing, once the user stops typing
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const hasNoResults = normalizedSearch !== "" && filteredSounds.length === 0;
  useEffect(() => {
    if (!hasNoResults) return;
    const timeout = setTimeout(() => {
      trackEvent("search_no_results", { search_term: normalizedSearch, category: selectedCategory || "all" });
    }, 1000);
    return () => clearTimeout(timeout);
  }, [hasNoResults, normalizedSearch, selectedCategory]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Sound Library</h1>

      {/* Search and filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search input */}
          <div className="col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Sounds
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                id="search"
                type="text"
                placeholder="Type to search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 py-2 block w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Category filter */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Category
              {selectedCategory && (
                <span
                  className={cn(
                    "ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                    getCategoryColor(selectedCategory).bg,
                    getCategoryColor(selectedCategory).text
                  )}
                >
                  {selectedCategory[0].toUpperCase() + selectedCategory.slice(1)}
                </span>
              )}
            </label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => {
                const catColor = getCategoryColor(category);
                return (
                  <option key={category} value={category} className={cn(catColor.bg, catColor.text)}>
                    {category[0].toUpperCase() + category.slice(1)}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Results stats */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-gray-600 flex items-center">
          Showing {paginatedSounds.length} of {filteredSounds.length} sounds
          {selectedCategory && (
            <span
              className={cn(
                "ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                getCategoryColor(selectedCategory).bg,
                getCategoryColor(selectedCategory).text
              )}
            >
              {selectedCategory[0].toUpperCase() + selectedCategory.slice(1)}
            </span>
          )}
        </p>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded border border-gray-300 disabled:opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded border border-gray-300 disabled:opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Sound grid */}
      {paginatedSounds.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {paginatedSounds.map(([soundKey, metadata]) => (
            <SoundItem key={soundKey} soundKey={soundKey as LibrarySoundName} metadata={metadata} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No sounds found</h3>
          <p className="mt-1 text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
        </div>
      )}

      {/* Pagination (bottom) */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className={cn(
                "relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium",
                currentPage === 1 ? "text-gray-300" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              <span className="sr-only">First</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={cn(
                "relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium",
                currentPage === 1 ? "text-gray-300" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              <span className="sr-only">Previous</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = idx + 1;
              } else if (currentPage <= 3) {
                pageNum = idx + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + idx;
              } else {
                pageNum = currentPage - 2 + idx;
              }

              if (pageNum <= totalPages) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      "relative inline-flex items-center px-4 py-2 border text-sm font-medium",
                      currentPage === pageNum
                        ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              }
              return null;
            })}

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={cn(
                "relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium",
                currentPage === totalPages ? "text-gray-300" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              <span className="sr-only">Next</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className={cn(
                "relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium",
                currentPage === totalPages ? "text-gray-300" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              <span className="sr-only">Last</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default SoundLibraryPage;
