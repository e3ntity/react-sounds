import React from "react";
import { Link } from "react-router-dom";

const links = [
  { label: "Docs", to: "/docs" },
  { label: "Sounds", to: "/sounds" },
  { label: "More sounds on openfoley", href: "https://openfoley.com" },
  { label: "GitHub", href: "https://github.com/e3ntity/react-sounds" },
  { label: "npm", href: "https://www.npmjs.com/package/react-sounds" },
  { label: "Privacy", to: "/privacy" },
  { label: "Imprint", to: "/imprint" },
];

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 mt-12 py-6">
      <div className="container mx-auto px-4 text-center text-gray-600">
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-3 text-sm">
          {links.map((link) =>
            link.to ? (
              <Link key={link.label} to={link.to} className="hover:text-gray-900">
                {link.label}
              </Link>
            ) : (
              <a key={link.label} href={link.href} className="hover:text-gray-900">
                {link.label}
              </a>
            )
          )}
        </nav>
        <p>&copy; {new Date().getFullYear()} <a href="https://www.luschneider.com">Lukas Schneider</a>. Made with ♥.</p>
      </div>
    </footer>
  );
};

export default Footer;
