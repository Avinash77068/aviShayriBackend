import xss from "xss";

// Allow a small, safe subset of HTML so shayari formatting survives while
// scripts/handlers are stripped.
const richTextOptions = {
  whiteList: {
    p: [],
    br: [],
    b: [],
    i: [],
    em: [],
    strong: [],
    u: [],
    span: [],
    blockquote: [],
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style"],
};

/** Sanitize rich text (shayari content, bios) preserving basic formatting. */
export const cleanRichText = (input) => xss(String(input ?? ""), richTextOptions);

/** Sanitize a plain-text field — strip all HTML. */
export const cleanText = (input) =>
  xss(String(input ?? ""), { whiteList: {}, stripIgnoreTag: true, stripIgnoreTagBody: ["script", "style"] }).trim();

export default { cleanRichText, cleanText };
