/**
 * Utility functions for Rich Text / WYSIWYG policy and page content editing.
 * Handles seamless bidirectional conversion between legacy Markdown and modern semantic HTML.
 */

/**
 * Detects whether a string contains HTML markup.
 */
export function isHtmlContent(str: string): boolean {
  if (!str) return false;
  const trimmed = str.trim();
  if (trimmed.startsWith('<') && trimmed.endsWith('>')) return true;
  return /<\/?(p|h[1-6]|ul|ol|li|div|blockquote|table|thead|tbody|tr|th|td|strong|b|em|i|u|span|hr|br)[^>]*>/i.test(
    trimmed
  );
}

/**
 * Formats inline markdown elements: **bold**, *italic*, `code`
 */
function formatInlineMarkdown(text: string): string {
  if (!text) return '';
  let res = text;
  // Bold: **text**
  res = res.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Italic: *text* (excluding already formatted tags)
  res = res.replace(/(^|[^\*])\*([^*]+)\*([^\*]|$)/g, '$1<em>$2</em>$3');
  // Code: `code`
  res = res.replace(
    /`([^`]+)`/g,
    '<code class="px-1.5 py-0.5 rounded bg-stone-100 text-stone-800 text-xs font-mono border border-stone-200">$1</code>'
  );
  return res;
}

/**
 * Converts markdown text into clean semantic HTML suitable for visual editing and storefront display.
 */
export function markdownToHtml(md: string): string {
  if (!md) return '';
  if (isHtmlContent(md)) return md;

  const lines = md.split('\n');
  const htmlParts: string[] = [];

  let inList: 'ul' | 'ol' | null = null;
  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];

  const closeList = () => {
    if (inList) {
      htmlParts.push(`</${inList}>`);
      inList = null;
    }
  };

  const closeTable = () => {
    if (inTable || tableHeaders.length > 0 || tableRows.length > 0) {
      let tHtml =
        '<div class="overflow-x-auto my-4 rounded-xl border border-stone-200"><table class="w-full text-left border-collapse text-sm">';
      if (tableHeaders.length > 0) {
        tHtml += '<thead class="bg-[#FAF6F0] border-b border-stone-200"><tr>';
        tableHeaders.forEach((th) => {
          tHtml += `<th class="py-2.5 px-3.5 font-bold text-stone-900">${formatInlineMarkdown(th)}</th>`;
        });
        tHtml += '</tr></thead>';
      }
      if (tableRows.length > 0) {
        tHtml += '<tbody class="divide-y divide-stone-100">';
        tableRows.forEach((row, rIdx) => {
          tHtml += `<tr class="${rIdx % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}">`;
          row.forEach((cell) => {
            tHtml += `<td class="py-2.5 px-3.5 text-stone-700 border-b border-stone-100">${formatInlineMarkdown(cell)}</td>`;
          });
          tHtml += '</tr>';
        });
        tHtml += '</tbody>';
      }
      tHtml += '</table></div>';
      htmlParts.push(tHtml);
      inTable = false;
      tableHeaders = [];
      tableRows = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Table rows: | Col 1 | Col 2 |
    if (line.startsWith('|') && line.endsWith('|')) {
      closeList();
      const cells = line
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());
      // Check if separator line like | :--- | :--- |
      if (cells.every((c) => /^:?-+:?$/.test(c))) {
        inTable = true;
        continue;
      }
      if (!inTable && tableHeaders.length === 0) {
        tableHeaders = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else {
      closeTable();
    }

    // Unordered List (* or -)
    if (line.startsWith('* ') || line.startsWith('- ')) {
      if (inList !== 'ul') {
        closeList();
        htmlParts.push('<ul class="list-disc pl-6 my-3 space-y-1.5 text-stone-700">');
        inList = 'ul';
      }
      htmlParts.push(`<li>${formatInlineMarkdown(line.slice(2))}</li>`);
      continue;
    }

    // Ordered List (1. 2. etc.)
    const olMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (olMatch) {
      if (inList !== 'ol') {
        closeList();
        htmlParts.push('<ol class="list-decimal pl-6 my-3 space-y-1.5 text-stone-700">');
        inList = 'ol';
      }
      htmlParts.push(`<li>${formatInlineMarkdown(olMatch[2])}</li>`);
      continue;
    }

    // Any regular text closes current list
    closeList();

    // Blank line
    if (!line) {
      continue;
    }

    // H2 Heading: ## Title
    if (line.startsWith('## ')) {
      htmlParts.push(
        `<h2 class="text-xl sm:text-2xl font-bold text-[#0B3B24] tracking-tight mt-6 mb-3 pb-2 border-b border-stone-200/80">${formatInlineMarkdown(
          line.slice(3)
        )}</h2>`
      );
      continue;
    }

    // H3 Heading: ### Title
    if (line.startsWith('### ')) {
      htmlParts.push(
        `<h3 class="text-base sm:text-lg font-semibold text-stone-900 mt-5 mb-2">${formatInlineMarkdown(
          line.slice(4)
        )}</h3>`
      );
      continue;
    }

    // Callout / Warning / Notice box
    if (
      line.startsWith('> [!CAUTION]') ||
      line.startsWith('> [!WARNING]') ||
      line.startsWith('> [!IMPORTANT]')
    ) {
      const nextLine = lines[i + 1]?.trim().startsWith('>')
        ? lines[++i].trim().slice(1).trim()
        : '';
      htmlParts.push(
        `<div class="policy-alert-box my-4 p-4 rounded-xl bg-amber-50 border-l-4 border-amber-500 text-amber-900 text-xs sm:text-sm shadow-2xs"><strong class="block font-bold text-amber-950 uppercase tracking-wider mb-1">Important Legal Notice</strong><p>${formatInlineMarkdown(
          nextLine || line
        )}</p></div>`
      );
      continue;
    }

    // Blockquote: > text
    if (line.startsWith('> ')) {
      htmlParts.push(
        `<blockquote class="my-3 pl-4 border-l-4 border-[#0B3B24] italic text-stone-600 text-sm bg-[#F4F8F4] py-2 px-3 rounded-r-lg">${formatInlineMarkdown(
          line.slice(2)
        )}</blockquote>`
      );
      continue;
    }

    // Divider: --- or ***
    if (line === '---' || line === '***') {
      htmlParts.push('<hr class="my-6 border-stone-200" />');
      continue;
    }

    // Standard Paragraph
    htmlParts.push(
      `<p class="my-2.5 text-stone-700 leading-relaxed text-sm sm:text-base">${formatInlineMarkdown(
        line
      )}</p>`
    );
  }

  closeList();
  closeTable();

  return htmlParts.join('\n');
}

/**
 * Extracts plain text from HTML for word and character counts.
 */
export function htmlToPlainText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
