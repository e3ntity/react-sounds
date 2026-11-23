import React from "react";
import { Link } from "react-router-dom";

const NotFoundPage: React.FC = () => (
  <div className="container mx-auto px-4 py-24 max-w-3xl text-center">
    <h1 className="text-4xl font-bold text-gray-800 mb-4">Page not found</h1>
    <p className="text-gray-600 mb-8">This page doesn't exist. Maybe you were looking for one of these:</p>
    <div className="flex flex-wrap justify-center gap-3">
      <Link to="/" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition">
        Home
      </Link>
      <Link to="/sounds" className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-medium py-2 px-4 rounded-lg transition">
        Sounds
      </Link>
      <Link to="/docs" className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-medium py-2 px-4 rounded-lg transition">
        Docs
      </Link>
    </div>
  </div>
);

export default NotFoundPage;
