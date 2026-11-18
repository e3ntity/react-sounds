import React from "react";

export const LegalPage: React.FC<{ title: string; updated?: string; children: React.ReactNode }> = ({ title, updated, children }) => (
  <div className="container mx-auto px-4 py-12 max-w-3xl">
    <h1 className="text-4xl font-bold text-gray-800 mb-2">{title}</h1>
    {updated && <p className="text-sm text-gray-500">Last updated {updated}</p>}
    <div className="mt-8 space-y-8">{children}</div>
  </div>
);

export const LegalSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-3 text-gray-700 leading-relaxed [&_a]:text-blue-600 [&_a:hover]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_code]:font-mono [&_code]:text-sm [&_code]:bg-gray-200 [&_code]:px-1 [&_code]:rounded">
    <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
    {children}
  </section>
);
