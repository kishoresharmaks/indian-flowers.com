'use client';

import React from 'react';

interface PolicyContentRendererProps {
  content: string;
}

export default function PolicyContentRenderer({ content }: PolicyContentRendererProps) {
  if (!content) return null;

  // Split into lines for structured block rendering
  const lines = content.split('\n');
  const renderedElements: React.ReactNode[] = [];

  let currentList: string[] = [];
  let inTable = false;
  let tableHeader: string[] = [];
  let tableRows: string[][] = [];

  const flushList = (key: number) => {
    if (currentList.length > 0) {
      renderedElements.push(
        <ul key={`ul-${key}`} className="space-y-2 my-3 pl-5 list-disc text-stone-700 marker:text-[#0B3B24]">
          {currentList.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {parseInlineMarkdown(item)}
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  const flushTable = (key: number) => {
    if (tableHeader.length > 0 || tableRows.length > 0) {
      renderedElements.push(
        <div key={`table-${key}`} className="my-5 overflow-x-auto rounded-xl border border-stone-200">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            {tableHeader.length > 0 && (
              <thead className="bg-[#FAF6F0] border-b border-stone-200">
                <tr>
                  {tableHeader.map((th, i) => (
                    <th key={i} className="py-2.5 px-3.5 font-bold text-stone-900">
                      {parseInlineMarkdown(th)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-stone-100">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="py-2.5 px-3.5 text-stone-700">
                      {parseInlineMarkdown(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableHeader = [];
      tableRows = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Table rows
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line.slice(1, -1).split('|').map((c) => c.trim());
      // Check if separator line like | :--- | :--- |
      if (cells.every((c) => /^:?-+:?$/.test(c))) {
        inTable = true;
        continue;
      }
      if (!inTable && tableHeader.length === 0) {
        tableHeader = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable || tableHeader.length > 0) {
      flushTable(i);
    }

    // Unordered List Items (* or -)
    if (line.startsWith('* ') || line.startsWith('- ')) {
      currentList.push(line.slice(2));
      continue;
    } else {
      flushList(i);
    }

    // Blank line
    if (!line) {
      continue;
    }

    // Headers
    if (line.startsWith('## ')) {
      renderedElements.push(
        <h2
          key={`h2-${i}`}
          className="text-xl sm:text-2xl font-bold text-[#0B3B24] tracking-tight mt-8 mb-3 pb-2 border-b border-stone-200/80 flex items-center gap-2"
        >
          {parseInlineMarkdown(line.slice(3))}
        </h2>
      );
      continue;
    }

    if (line.startsWith('### ')) {
      renderedElements.push(
        <h3
          key={`h3-${i}`}
          className="text-base sm:text-lg font-semibold text-stone-900 mt-5 mb-2"
        >
          {parseInlineMarkdown(line.slice(4))}
        </h3>
      );
      continue;
    }

    // Callout / Blockquote
    if (line.startsWith('> [!CAUTION]') || line.startsWith('> [!WARNING]')) {
      const nextLine = lines[i + 1]?.trim().startsWith('>') ? lines[++i].trim().slice(1).trim() : '';
      renderedElements.push(
        <div key={`alert-${i}`} className="my-4 p-4 rounded-xl bg-amber-50 border-l-4 border-amber-500 text-amber-900 text-xs sm:text-sm">
          <strong className="block font-bold text-amber-950 uppercase tracking-wider mb-1">
            Important Health & Safety Notice
          </strong>
          <p>{parseInlineMarkdown(nextLine || line)}</p>
        </div>
      );
      continue;
    }

    if (line.startsWith('> ')) {
      renderedElements.push(
        <blockquote
          key={`quote-${i}`}
          className="my-3 pl-4 border-l-4 border-[#0B3B24] italic text-stone-600 text-sm bg-[#F4F8F4] py-2 rounded-r-lg"
        >
          {parseInlineMarkdown(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Horizontal Divider
    if (line === '---' || line === '***') {
      renderedElements.push(
        <hr key={`hr-${i}`} className="my-6 border-stone-200" />
      );
      continue;
    }

    // Standard Paragraph
    renderedElements.push(
      <p key={`p-${i}`} className="my-2.5 text-stone-700 leading-relaxed text-sm sm:text-base">
        {parseInlineMarkdown(line)}
      </p>
    );
  }

  flushList(lines.length + 1);
  flushTable(lines.length + 2);

  return <div className="policy-prose font-sans">{renderedElements}</div>;
}

/**
 * Lightweight helper to parse inline markdown (bold, italics, code, links)
 */
function parseInlineMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  // Split by bold (**text**)
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-stone-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-800 text-xs font-mono border border-stone-200"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={index} className="italic text-stone-800">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}
