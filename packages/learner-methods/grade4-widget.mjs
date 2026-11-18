import {
  beginGradeFour, suggestSupports, multiplicationModel, assessAnswer,
  checkLocalHomeworkFile, understandHomeworkText, reviewPlan, instructionalSequence
} from "./core.mjs";
import { startPractice, practiceMode, requestHint, submitPractice, changeProblem } from "./practice-state.mjs";

/**
 * Opt-in browser test harness for the shared Grade 4 instructional core.
 * It is not an authenticated production lesson: no OCR, persistence, network,
 * learner identity, server uploads, diagnosis storage or silent AI calls.
 */
if (typeof globalThis.customElements !== "undefined" &&
    !globalThis.customElements.get("iss-grade-four-lab")) {
  globalThis.customElements.define("iss-grade-four-lab", class extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.problemIndex = 0;
      this.problems = [[23, 14], [16, 12], [34, 21], [28, 15]];
      this.practice = startPractice(...this.problems[0]);
      this.previewUrl = null;
    }

    connectedCallback() {
      this.shadowRoot.innerHTML = [
        '<style>',
        ':host { display:block; color:#172b42; font:16px/1.55 system-ui,-apple-system,Arial,sans-serif; }',
        '* {box-sizing:border-box} .shell {max-width:800px;margin:auto;padding:18px}',
        '.panel {border:1px solid #b7c8d9; padding:20px; border-radius:16px; margin:14px 0; background:#fff}',
        'h2,h3 {line-height:1.25;margin:0 0 12px} h2 {font-size:1.5rem} h3 {font-size:1.18rem}',
        '.muted {color:#334e67}.small {font-size:.9rem} .stack {display:grid;gap:12px}',
        'label {display:block;font-weight:650} select, textarea, input[type=text], input[type=number] {',
        'font:inherit;border:2px solid #556b80;border-radius:9px;padding:12px;width:100%;min-height:48px}',
        'textarea {min-height:100px} button {font:inherit;font-weight:650;cursor:pointer;min-height:48px;',
        'padding:10px 16px;border-radius:10px;border:2px solid #28558a;background:#28558a;color:#fff}',
        'button.secondary {background:#fff;color:#28558a} button:focus-visible,input:focus-visible,',
        'select:focus-visible,textarea:focus-visible {outline:3px solid #d06000;outline-offset:3px}',
        '.actions {display:flex;flex-wrap:wrap;gap:10px}.grid {display:grid;grid-template-columns:1fr 1fr;',
        'gap:8px;margin:12px 0}.cell {background:#e9f5ff;border:2px solid #4075a5;',
        'border-radius:10px;text-align:center;padding:18px 8px;min-height:82px}',
        '.cell strong {display:block;font-size:1.25rem}.hint {background:#fff5d7;',
        'border-left:5px solid #ab6300;padding:10px;margin:12px 0}',
        '.result {padding:12px;border-radius:10px;background:#e8f6e9;margin-top:12px}',
        '.preview img {max-width:100%;max-height:250px;object-fit:contain;border-radius:9px}',
        '.supports label {display:flex;align-items:center;gap:10px;font-weight:450}',
        'input[type=checkbox] {min-width:24px;min-height:24px;accent-color:#255d9c}',
        '.quiet * {animation:none!important;transition:none!important}',
        '.spaced {letter-spacing:.05em;line-height:1.8}.large {font-size:20px}',
        '@media(max-width:520px) {.shell{padding:8px}.panel{padding:14px}.actions button{flex:1}}',
        '@media(prefers-reduced-motion:reduce) {*{animation:none!important;transition:none!important}}',
        '</style>',
        '<main class="shell" id="shell"><section class="panel stack">',
        '<h2>Learn multiplication together</h2>',
        '<p class="muted">Grade 4 practice. No diagnosis or learning-style test is needed.',
        ' You can ask for visual, written, or spoken help at any point.</p>',
        '<label for="grade">School level</label><select id="grade">',
        '<option selected value="4">Grade 4 — multiplication</option></select>',
        '<label for="need">Anything you want us to know? (optional; not saved)</label>',
        '<select id="need"><option value="">Just start learning</option>',
        '<option value="reading difficulty">Reading directions is difficult</option>',
        '<option value="dyslexia">I want reading supports, including for dyslexia</option>',
        '<option value="auditory processing">Spoken instructions are difficult</option>',
        '<option value="processing speed">I prefer more time to think</option>',
        '<option value="working memory">I lose track of multiple steps</option></select>',
        '<fieldset class="supports"><legend>Choose what helps you</legend>',
        '<label><input type="checkbox" id="show" checked> Show each step</label>',
        '<label><input type="checkbox" id="space"> Extra text spacing</label>',
        '<label><input type="checkbox" id="big"> Larger text</label>',
        '<label><input type="checkbox" id="quiet"> Quiet, no animation</label>',
        '<label><input type="checkbox" id="turtle"> Optional Turtlehead reminder</label>',
        '</fieldset><div class="actions"><button id="apply" type="button">',
        'Use these supports</button><button id="speak" class="secondary" type="button">',
        'Read the instructions aloud</button></div>',
        '<p class="small muted" id="support-state" role="status"></p></section>',
        '<section class="panel stack"><h3>Bring your schoolwork</h3>',
        '<p class="small muted">Your selected photo stays on this device in this demonstration.',
        ' Photo text recognition and secure account upload are NOT connected. Please type',
        ' the problem below to practice it.</p>',
        '<label for="file">Choose a photo or PDF (optional)</label>',
        '<input id="file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf">',
        '<div class="preview" id="preview" aria-live="polite"></div>',
        '<label for="worksheet">Type or paste one question from school</label>',
        '<textarea id="worksheet" placeholder="For example: What is 23 × 14?"></textarea>',
        '<button id="inspect" type="button">Teach me this question</button>',
        '<p class="small" id="school-state" role="status"></p></section>',
        '<section class="panel stack"><h3 id="question">23 × 14</h3>',
        '<p id="instructions">Break both numbers into tens and ones, then add four pieces.</p>',
        '<div id="model" class="grid" role="group" aria-label="Four-part area model"></div>',
        '<p class="muted" id="mnemonic"></p>',
        '<p class="muted small" id="mode-state" role="status">Guided practice: four answers are shown.</p>',
        '<div class="actions"><button id="mode" class="secondary" type="button">Try a new problem without hints</button>',
        '<button id="hint" class="secondary" type="button">Show a hint</button></div>',
        '<label for="answer">What is the product?</label>',
        '<input id="answer" inputmode="numeric" type="number" min="0" step="1" autocomplete="off">',
        '<div class="actions"><button type="button" id="check">Check my reasoning</button>',
        '<button id="next" class="secondary" type="button">Try another problem</button></div>',
        '<p id="feedback" class="hint" role="status" aria-live="polite">',
        'Take your time. There is no timer.</p>',
        '<p class="muted small" id="revisit"></p>',
        '</section><p class="small muted">Prototype only: this is an instructional',
        ' demonstration, not a released WholeMind PWA. It does not save progress,',
        ' read homework photos, identify a disability, or sync between devices.</p></main>'
      ].join("");
      this.$("apply").addEventListener("click", () => this.applySupports());
      this.$("need").addEventListener("change", () => this.applySupports());
      this.$("speak").addEventListener("click", () => this.speakInstructions());
      this.$("file").addEventListener("change", () => this.previewHomework());
      this.$("inspect").addEventListener("click", () => this.inspectHomework());
      this.$("turtle").addEventListener("change", () => this.drawProblem());
      this.$("check").addEventListener("click", () => this.checkAnswer());
      this.$("next").addEventListener("click", () => this.nextProblem());
      this.$("mode").addEventListener("click", () => this.togglePracticeMode());
      this.$("hint").addEventListener("click", () => this.revealHint());
      beginGradeFour({ grade: 4 });
      this.applySupports();
      this.drawProblem();
    }

    disconnectedCallback() {
      this.clearPreview();
      if (typeof globalThis.speechSynthesis !== "undefined") globalThis.speechSynthesis.cancel();
    }

    $(id) { return this.shadowRoot.getElementById(id); }

    applySupports() {
      const options = suggestSupports([this.$("need").value]);
      if (this.$("show").checked && !options.includes("show-steps")) options.push("show-steps");
      const wrapper = this.$("shell");
      wrapper.classList.toggle("large", this.$("big").checked);
      wrapper.classList.toggle("spaced", this.$("space").checked || options.includes("extra-spacing"));
      wrapper.classList.toggle("quiet", this.$("quiet").checked || options.includes("quiet-mode"));
      this.$("support-state").textContent = options.length
        ? "Support options available: " + options.join(", ").replaceAll("-", " ") + ". You can change them whenever you like."
        : "No extra supports selected. You can change this later.";
      this.drawProblem();
    }

    speakInstructions() {
      const text = this.$("instructions").textContent;
      if (typeof globalThis.speechSynthesis === "undefined") {
        this.$("feedback").textContent = "Read-aloud is unavailable on this device. Written instructions remain available.";
        return;
      }
      globalThis.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(text);
      msg.rate = 0.9;
      globalThis.speechSynthesis.speak(msg);
    }

    clearPreview() {
      if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = null;
      const preview = this.$("preview");
      if (preview) preview.replaceChildren();
    }

    previewHomework() {
      this.clearPreview();
      const file = this.$("file").files?.[0];
      if (!file) return;
      const result = checkLocalHomeworkFile({ name: file.name, size: file.size, type: file.type });
      const p = this.$("preview");
      if (!result.ok) {
        p.textContent = result.reason;
        this.$("file").value = "";
        return;
      }
      if (file.type.startsWith("image/")) {
        this.previewUrl = URL.createObjectURL(file);
        const img = document.createElement("img");
        img.src = this.previewUrl;
        img.alt = "Selected homework photo, for the learner or parent to review locally";
        p.appendChild(img);
      } else {
        p.textContent = "PDF selected for local review. No reading or uploading has occurred.";
      }
    }

    inspectHomework() {
      const result = understandHomeworkText(this.$("worksheet").value);
      this.$("school-state").textContent = result.instruction;
      if (result.state !== "recognized-from-text") return;
      this.problems.unshift(result.factors);
      this.problemIndex = 0;
      this.practice = changeProblem(this.practice, ...result.factors);
      this.drawProblem();
      this.$("question").focus?.();
    }

    togglePracticeMode() {
      // Use a different problem for the independent attempt; one where the
      // worked answer was displayed is not independent performance evidence.
      if (this.practice.mode === "independent") {
        this.practice = practiceMode(this.practice, "guided");
      } else {
        this.problemIndex = (this.problemIndex + 1) % this.problems.length;
        this.practice = changeProblem(
          this.practice,
          ...this.problems[this.problemIndex],
          { mode: "independent" },
        );
      }
      this.drawProblem();
      this.$("answer").focus();
    }

    revealHint() {
      this.practice = requestHint(this.practice);
      this.drawProblem();
      this.$("feedback").textContent =
        "Here is a visual hint. This answer will count as guided practice, not independent mastery.";
    }

    drawProblem() {
      const [a, b] = this.practice.problem;
      const model = multiplicationModel(a, b);
      const showingHelp = this.practice.shownHelp;
      const t = instructionalSequence({ a, b, useTurtlehead: showingHelp && this.$("turtle").checked });
      this.$("question").textContent = a + " × " + b;
      this.$("instructions").textContent = showingHelp
        ? "Break " + a + " into " + model.decomposition[0].join(" and ") +
          ", and " + b + " into " + model.decomposition[1].join(" and ") +
          ". Add the four partial products. You can make groups with blocks first."
        : "Try " + a + " groups of " + b + " without the answers shown. You can ask for help any time.";
      const grid = this.$("model");
      grid.replaceChildren();
      if (showingHelp) {
        model.cells.forEach(cell => {
          const div = document.createElement("div");
          div.className = "cell";
          const label = document.createElement("span");
          label.textContent = cell.expression;
          const score = document.createElement("strong");
          score.textContent = String(cell.value);
          div.append(label, score);
          grid.appendChild(div);
        });
      } else {
        const div = document.createElement("p");
        div.className = "muted";
        div.textContent =
          "Partial-product answers are hidden for independent practice. Choose Show a hint if you need the model.";
        grid.append(div);
      }
      this.$("mnemonic").textContent = !showingHelp
        ? "Untimed independent attempt. The Turtlehead reminder is available as a hint."
        : t.stages.some(stage => stage.id === "turtlehead-optional")
          ? "Optional Turtlehead reminder: the tens row needs a zero placeholder. Place value explains why."
          : "Four rectangles show place value. There is no timer.";
      this.$("mode-state").textContent = this.practice.mode === "independent"
        ? (showingHelp ? "Independent mode with help used: counted as guided."
          : "Independent mode: no answer hints are visible.")
        : "Guided practice: the four partial products are shown.";
      this.$("mode").textContent = this.practice.mode === "independent"
        ? "Return to guided practice" : "Try a new problem without hints";
      this.$("answer").value = "";
      this.$("feedback").textContent = "Take your time. Explain your thinking. There is no timer.";
    }

    checkAnswer() {
      const day = new Date().toISOString().slice(0, 10);
      const outcome = submitPractice(this.practice, this.$("answer").value, day);
      this.practice = outcome.state;
      // Error feedback counts as help; reveal the model, but do not relabel a
      // later guided correction as an independent response.
      if (outcome.counted && !outcome.result.correct && this.practice.mode === "independent") {
        this.drawProblem();
      }
      this.$("feedback").textContent = outcome.result.correct
        ? "Correct. " + outcome.result.hint
        : "Try again. " + outcome.result.hint;
      this.$("mode-state").textContent = this.practice.mode === "independent"
        && !this.practice.shownHelp
        ? "Answer attempted without visible hints; later review is still required."
        : "This answer received teaching support and does not count as independent mastery.";
      this.$("revisit").textContent =
        "This browser session has " + this.practice.independentEvidence.length +
        " independent attempts. Next suggested revisit: " +
        outcome.review.nextReviewDay +
        ". Cross-device progress is not connected; this is not proof of retained learning.";
    }

    nextProblem() {
      this.problemIndex = (this.problemIndex + 1) % this.problems.length;
      this.practice = changeProblem(this.practice, ...this.problems[this.problemIndex]);
      this.drawProblem();
      this.$("answer").focus();
    }
  });
}
