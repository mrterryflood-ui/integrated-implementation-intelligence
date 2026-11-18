import { multiplicationModel } from "./core.mjs";

/** A high-contrast, readable four-cell diagram plan for the Grade 4 UI. */
export function areaPicturePlan(a, b, revealAnswers = true) {
  const model = multiplicationModel(a, b);
  const [[tensA, onesA], [tensB, onesB]] = model.decomposition;
  const left = 10, top = 10, width = 320, height = 190;
  // Minimum cell width/height keeps numbers legible on smaller screens.
  // These are diagram proportions, not geometric evidence of an exact area.
  const leftW = Math.max(165, Math.min(260, width * tensA / a));
  const topH = Math.max(95, Math.min(145, height * tensB / b));
  const cellInputs = [
    { x: left, y: top, w: leftW, h: topH, color: "#CFE7FF", label: tensA + " × " + tensB, value: model.cells[0].value },
    { x: left + leftW, y: top, w: width - leftW, h: topH, color: "#E6F6DD", label: onesA + " × " + tensB, value: model.cells[2].value },
    { x: left, y: top + topH, w: leftW, h: height - topH, color: "#FFF0BE", label: tensA + " × " + onesB, value: model.cells[1].value },
    { x: left + leftW, y: top + topH, w: width - leftW, h: height - topH, color: "#F3DBF8", label: onesA + " × " + onesB, value: model.cells[3].value },
  ];
  return {
    a, b,
    revealAnswers,
    accessibleTitle: a + " times " + b + " split into a four-part area model",
    accessibleDescription: revealAnswers
      ? "Tens and ones partial products: " + cellInputs.map(x => x.label + " equals " + x.value).join("; ")
      : "Four partial products are concealed for independent practice. You may request a hint.",
    cells: cellInputs.map(x => ({ ...x, answerText: revealAnswers ? String(x.value) : "?" })),
    total: model.total,
    note: "Schematic drawing. Each part represents tens-by-tens, tens-by-ones or ones-by-ones; dimensions are adjusted for readability.",
  };
}

/** Render a decorative-free SVG with semantic text and a screen-reader title. */
export function renderAreaPicture(container, plan) {
  const NS = "http://www.w3.org/2000/svg";
  const element = (tag, attrs = {}, content) => {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
    if (content !== undefined) el.textContent = String(content);
    return el;
  };
  const svg = element("svg", {
    viewBox:"0 0 340 210", role:"img", width:"100%", height:"auto",
    "aria-labelledby":"math-picture-title math-picture-desc",
    xmlns:NS,
  });
  svg.appendChild(element("title", { id:"math-picture-title" }, plan.accessibleTitle));
  svg.appendChild(element("desc", { id:"math-picture-desc" }, plan.accessibleDescription));
  for (const cell of plan.cells) {
    svg.appendChild(element("rect", {
      x:cell.x, y:cell.y, width:cell.w, height:cell.h,
      rx:3, stroke:"#254760", "stroke-width":2, fill:cell.color
    }));
    svg.appendChild(element("text", {
      x:cell.x + cell.w/2, y:cell.y + cell.h/2 - 7,
      "text-anchor":"middle", "font-size":"13", "font-weight":"600", fill:"#162D45",
    }, cell.label));
    svg.appendChild(element("text", {
      x:cell.x + cell.w/2, y:cell.y + cell.h/2 + 18,
      "text-anchor":"middle", "font-size":"18", "font-weight":"700", fill:"#162D45",
    }, cell.answerText));
  }
  container.replaceChildren(svg);
}
