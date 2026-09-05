import React from "react";

// Parses inline markdown: **bold** and *italic*
function parseInline(str) {
  const nodes = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(str.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(
        <strong key={key++} className="font-semibold text-gray-900">
          {token.slice(2, -2)}
        </strong>
      );
    } else {
      nodes.push(
        <em key={key++} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < str.length) {
    nodes.push(str.slice(lastIndex));
  }
  return nodes;
}

// Converts raw recipe text (with #, ##, **bold**, -, 1. etc.) into styled React elements
export function formatRecipeText(text) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements = [];
  let listBuffer = [];
  let listType = null; // "ul" | "ol"

  const flushList = () => {
    if (listBuffer.length === 0) return;
    const key = `list-${elements.length}`;
    if (listType === "ol") {
      elements.push(
        <ol key={key} className="list-decimal pl-5 space-y-2 mb-4">
          {listBuffer}
        </ol>
      );
    } else {
      elements.push(
        <ul key={key} className="list-disc pl-5 space-y-1.5 mb-4">
          {listBuffer}
        </ul>
      );
    }
    listBuffer = [];
    listType = null;
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();

    if (line === "") {
      flushList();
      return;
    }

    // Headings: #, ##, ###, ####
    const headingMatch = line.match(/^(#{1,4})\s+(.*)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const content = parseInline(headingMatch[2].replace(/\*\*/g, ""));
      const headingClasses = {
        1: "text-2xl font-bold text-gray-900 mt-6 mb-3 first:mt-0",
        2: "text-xl font-bold text-gray-900 mt-6 mb-3 first:mt-0",
        3: "text-lg font-semibold text-teal-700 mt-5 mb-2 first:mt-0",
        4: "text-base font-semibold text-teal-700 mt-4 mb-2 first:mt-0",
      };
      const Tag = level <= 2 ? "h3" : "h4";
      elements.push(
        <Tag key={idx} className={headingClasses[level] || headingClasses[4]}>
          {content}
        </Tag>
      );
      return;
    }

    // A whole line wrapped in ** ** (e.g. "**Ingredients (serves 1)**") acts as a section heading
    const wholeBoldMatch = line.match(/^\*\*(.+)\*\*:?$/);
    if (wholeBoldMatch) {
      flushList();
      elements.push(
        <h4 key={idx} className="text-lg font-semibold text-teal-700 mt-5 mb-2 first:mt-0">
          {parseInline(wholeBoldMatch[1])}
        </h4>
      );
      return;
    }

    // Numbered list: "1. text" or "1) text"
    const orderedMatch = line.match(/^(\d+)[.)]\s+(.*)$/);
    if (orderedMatch) {
      if (listType !== "ol") {
        flushList();
        listType = "ol";
      }
      listBuffer.push(
        <li key={idx} className="pl-1">
          {parseInline(orderedMatch[2])}
        </li>
      );
      return;
    }

    // Bullet list: "- text" or "* text"
    const bulletMatch = line.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      if (listType !== "ul") {
        flushList();
        listType = "ul";
      }
      listBuffer.push(
        <li key={idx} className="pl-1">
          {parseInline(bulletMatch[1])}
        </li>
      );
      return;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={idx} className="mb-3 last:mb-0">
        {parseInline(line)}
      </p>
    );
  });

  flushList();
  return <>{elements}</>;
}