import site from "@/pages.json";
import React from "react";
import { Link } from "react-router-dom";

export const guides = site.pages.filter((p) => p.guide);

export function formatDate(date: string) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

const prose =
  "text-gray-700 leading-relaxed [&>p]:mb-5 [&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:text-gray-800 [&>h2]:mt-12 [&>h2]:mb-4 [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:text-gray-800 [&>h3]:mt-8 [&>h3]:mb-3 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-5 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-5 [&_li]:mb-2 [&_a]:text-blue-600 [&_a]:underline [&_a:hover]:text-blue-800 [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-[0.9em] [&_:not(pre)>code]:bg-gray-200 [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:rounded [&>.table-scroll]:overflow-x-auto [&>.table-scroll]:mb-6 [&_table]:w-full [&_table]:min-w-[560px] [&_table]:text-sm [&_th]:text-left [&_th]:font-semibold [&_th]:border-b [&_th]:border-gray-300 [&_th]:py-2 [&_th]:pr-4 [&_td]:border-b [&_td]:border-gray-200 [&_td]:py-2 [&_td]:pr-4 [&_td]:align-top";

export const Guide: React.FC<{ path: string; children: React.ReactNode }> = ({ path, children }) => {
  const page = guides.find((g) => g.path === path)!;
  const others = guides.filter((g) => g.path !== path);

  return (
    <article className="container mx-auto px-4 py-12 max-w-3xl min-w-0">
      <nav className="text-sm text-gray-500 mb-3">
        <Link to="/guides" className="hover:text-gray-800">
          Guides
        </Link>
      </nav>
      <h1 className="text-4xl font-bold text-gray-800 leading-tight">{page.heading}</h1>
      <p className="text-lg text-gray-600 mt-4">{page.summary}</p>
      <p className="text-sm text-gray-500 mt-4 pb-6 border-b border-gray-200">
        <a href="https://www.luschneider.com" className="hover:text-gray-800">
          Lukas Schneider
        </a>{" "}
        · {formatDate(page.date!)}
      </p>

      <div className={`${prose} mt-8`}>{children}</div>

      <aside className="mt-14 border-t border-gray-200 pt-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">More guides</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {others.map((g) => (
            <Link key={g.path} to={g.path} className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="font-semibold text-gray-800">{g.heading}</div>
              <div className="text-sm text-gray-600 mt-1">{g.summary}</div>
            </Link>
          ))}
        </div>
      </aside>
    </article>
  );
};
