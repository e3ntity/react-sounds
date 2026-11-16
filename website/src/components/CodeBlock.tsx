import { cn } from "@/utils/cn";
import Prism from "prismjs";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-json";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-typescript";
import "prismjs/themes/prism-tomorrow.css";
import React, { useEffect } from "react";

interface CodeBlockProps {
  className?: string;
  children: React.ReactNode;
  language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ className, children, language = "tsx" }) => {
  const langClass = `language-${language}`;

  useEffect(() => {
    Prism.highlightAll();
  }, [children, language]);

  return (
    <pre className={cn("bg-gray-800 text-white p-4 rounded-md overflow-x-auto my-4 text-sm", langClass, className)}>
      <code className={langClass}>{children}</code>
    </pre>
  );
};

export default CodeBlock;
