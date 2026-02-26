function initHighlightMarkerTextReveal() {
  const defaults = {
    direction: "right",
    theme: "pink",
    scrollStart: "top 90%",
    staggerStart: "start",
    stagger: 100,
    barDuration: 0.6,
    barEase: "power3.inOut",
  };

  const colorMap = {
    pink: "#C700EF",
    white: "#FFFFFF",
  };

  const directionMap = {
    right: { prop: "scaleX", origin: "right center" },
    left: { prop: "scaleX", origin: "left center" },
    up: { prop: "scaleY", origin: "center top" },
    down: { prop: "scaleY", origin: "center bottom" },
  };

  function resolveColor(value) {
    if (colorMap[value]) return colorMap[value];
    if (value.startsWith("--")) {
      return getComputedStyle(document.body).getPropertyValue(value).trim() || value;
    }
    return value;
  }

  function createBar(color, origin) {
    const bar = document.createElement("div");
    bar.className = "highlight-marker-bar";
    Object.assign(bar.style, {
      backgroundColor: color,
      transformOrigin: origin,
    });
    return bar;
  }

  function cleanupElement(el) {
    if (!el._highlightMarkerReveal) return;
    el._highlightMarkerReveal.timeline?.kill();
    el._highlightMarkerReveal.scrollTrigger?.kill();
    el._highlightMarkerReveal.split?.revert();
    el.querySelectorAll(".highlight-marker-bar").forEach((bar) => bar.remove());
    delete el._highlightMarkerReveal;
  }

  let reduceMotion = false;

  gsap.matchMedia().add(
    { reduce: "(prefers-reduced-motion: reduce)" },
    (context) => {
      reduceMotion = context.conditions.reduce;
    }
  );

  // Reduced motion: no animation at all
  if (reduceMotion) {
    document.querySelectorAll("[data-highlight-marker-reveal]").forEach((el) => {
      gsap.set(el, { autoAlpha: 1 });
    });
    return;
  }

  // Cleanup previous instances
  document.querySelectorAll("[data-highlight-marker-reveal]").forEach(cleanupElement);

  const elements = document.querySelectorAll("[data-highlight-marker-reveal]");
  if (!elements.length) return;

  elements.forEach((el) => {
    const direction = el.getAttribute("data-marker-direction") || defaults.direction;
    const theme = el.getAttribute("data-marker-theme") || defaults.theme;
    const scrollStart = el.getAttribute("data-marker-scroll-start") || defaults.scrollStart;
    const staggerStart = el.getAttribute("data-marker-stagger-start") || defaults.staggerStart;
    const staggerOffset = (parseFloat(el.getAttribute("data-marker-stagger")) || defaults.stagger) / 1000;

    const color = resolveColor(theme);
    const dirConfig = directionMap[direction] || directionMap.right;

    el._highlightMarkerReveal = {};

    const split = SplitText.create(el, {
      type: "lines",
      linesClass: "highlight-marker-line",
      autoSplit: true,
      onSplit(self) {
        const instance = el._highlightMarkerReveal;

        // Teardown previous build
        instance.timeline?.kill();
        instance.scrollTrigger?.kill();
        el.querySelectorAll(".highlight-marker-bar").forEach((bar) => bar.remove());

        // Build bars and timeline
        const lines = self.lines;
        const tl = gsap.timeline({ paused: true });

        lines.forEach((line, i) => {
          gsap.set(line, { position: "relative", overflow: "hidden" });

          const bar = createBar(color, dirConfig.origin);
          line.appendChild(bar);

          const staggerIndex = staggerStart === "end" ? lines.length - 1 - i : i;

          tl.to(bar, {
            [dirConfig.prop]: 0,
            duration: defaults.barDuration,
            ease: defaults.barEase,
          }, staggerIndex * staggerOffset);
        });

        // Reveal parent — bars are covering the text
        gsap.set(el, { autoAlpha: 1 });

        // ScrollTrigger
        const st = ScrollTrigger.create({
          trigger: el,
          start: scrollStart,
          once: true,
          onEnter: () => tl.play(),
        });

        instance.timeline = tl;
        instance.scrollTrigger = st;
      },
    });

    el._highlightMarkerReveal.split = split;
  });
}

// Wait for GSAP, ScrollTrigger and SplitText to be available
function waitForGSAP(callback) {
  if (
    typeof gsap !== "undefined" &&
    typeof ScrollTrigger !== "undefined" &&
    typeof SplitText !== "undefined"
  ) {
    callback();
  } else {
    setTimeout(() => waitForGSAP(callback), 50);
  }
}

// Initialize Highlight Marker Text Reveal
document.addEventListener("DOMContentLoaded", () => {
  document.fonts.ready.then(() => {
    waitForGSAP(initHighlightMarkerTextReveal);
  });
});