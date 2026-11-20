import { formatDate, guides } from "@/components/Guide";
import React from "react";
import { Link } from "react-router-dom";

const GuidesPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-4xl font-bold text-gray-800">Guides</h1>
      <p className="text-lg text-gray-600 mt-4 pb-6 border-b border-gray-200">
        Practical guides on playing sounds and audio in React, with or without react-sounds.
      </p>
      <div className="mt-8 space-y-4">
        {guides.map((g) => (
          <Link key={g.path} to={g.path} className="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-xl font-semibold text-gray-800">{g.heading}</h2>
            <p className="text-gray-600 mt-2">{g.summary}</p>
            <p className="text-sm text-gray-500 mt-3">{formatDate(g.date!)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default GuidesPage;
