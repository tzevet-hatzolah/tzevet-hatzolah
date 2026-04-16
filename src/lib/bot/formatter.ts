const MARKDOWN_V2_SPECIAL = /([_\[\]()~`>#+=|{}.!\\-])/g;

/**
 * Format text for Telegram MarkdownV2.
 * Converts *bold* to Telegram bold syntax while escaping other special chars.
 */
export function formatForTelegram(text: string): string {
  // Extract bold segments first, then escape the rest
  const parts: string[] = [];
  let lastIndex = 0;
  const boldRegex = /\*([^*]+)\*/g;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    // Escape text before this bold segment
    if (match.index > lastIndex) {
      parts.push(escapeMarkdownV2(text.slice(lastIndex, match.index)));
    }
    // Bold segment: escape inner text, wrap in *
    parts.push(`*${escapeMarkdownV2(match[1])}*`);
    lastIndex = match.index + match[0].length;
  }

  // Escape remaining text after last bold segment
  if (lastIndex < text.length) {
    parts.push(escapeMarkdownV2(text.slice(lastIndex)));
  }

  return parts.join("");
}

/**
 * Strip * characters for platforms that don't support markdown (Facebook, Instagram).
 */
export function formatForPlainText(text: string): string {
  return text.replace(/\*/g, "");
}

function escapeMarkdownV2(text: string): string {
  return text.replace(MARKDOWN_V2_SPECIAL, "\\$1");
}
