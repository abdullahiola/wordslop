// ============================================
// WORDSLOP ENGINE — Agentic Text Generation
// ============================================
// This module contains all the "slop" content:
// conversation topics, slop vocabulary, and the
// simulated AI agent text generation logic.

// Crypto degen slop vocabulary
export const SLOP_WORDS = [
  "wagmi", "ngmi", "gm", "ser", "wen moon", "wen lambo",
  "diamond hands", "paper hands", "rekt", "degen", "ape in",
  "rug pull", "to the moon", "hopium", "copium", "probably nothing",
  "few understand", "this is the way", "bullish", "bearish",
  "alpha", "chad", "gigachad", "based", "touch grass",
  "normies", "no-coiner", "maxi", "shitcoin", "bags",
  "pumping", "dumping", "liquidity", "whale", "jeet",
  "fud", "cope", "shill", "airdrop", "gas fees",
  "on-chain", "off-chain", "tvl", "mcap", "dyor", "nfa",
  "lfg", "send it", "full send", "generational wealth",
  "life-changing money", "supercycle", "altseason",
  "solana summer", "eth killer", "btc maxi",
  "mog", "bonk", "pepe", "ponzi", "yield farming",
  "stake", "bridge", "l1", "l2", "rollup",
  "memecoin", "rugged", "floor price", "mint",
  "anon", "fren", "looks rare", "up only", "number go up",
  "have fun staying poor", "laser eyes", "stack sats"
];

// Today's crypto news topics (April 2026)
export const TOPICS = {
  btc_pump: {
    name: "🚀 $77K Pump & Squeeze",
    prompts: [
      "Bitcoin crossing $77K and the $770M short squeeze liquidations",
      "ETF inflows hitting $664M in a single day",
      "TD Cowen's $140K Bitcoin target for 2026"
    ]
  },
  sec_cftc: {
    name: "⚖️ SEC & CFTC Clarity",
    prompts: [
      "The landmark SEC-CFTC joint guidance classifying crypto into 5 types",
      "Paul Atkins and Michael Selig's MOU to harmonize crypto oversight",
      "The 5-year wallet exemption from broker-dealer registration"
    ]
  },
  xrp_alts: {
    name: "💎 XRP & Altcoin Rally",
    prompts: [
      "XRP pumping 10% to $1.50 with Rakuten listing",
      "Solana eyeing $100 breakout",
      "Capital rotating into quality — risk-off mode in altcoins"
    ]
  },
  ai_crypto: {
    name: "🤖 AI x Crypto",
    prompts: [
      "Claude Opus autonomously trading Bitcoin via Coinbase AgentKit",
      "AI agents in DeFi — the hottest new narrative",
      "CFTC using AI for market surveillance and enforcement"
    ]
  },
  adoption: {
    name: "📊 Mass Adoption",
    prompts: [
      "More Americans own Bitcoin than gold — 50M vs 37M",
      "The digital gold narrative going mainstream",
      "Tokenized Real-World Assets exploding in 2026"
    ]
  },
  market_mood: {
    name: "😰 Fear & Greed",
    prompts: [
      "Fear & Greed at 26 despite $77K — why so scared",
      "Strait of Hormuz reopening easing energy fears",
      "Is this a bull trap or the start of a supercycle"
    ]
  }
};



// Agent A (Claude Sonnet) — the poetic philosopher
const AGENT_A_TEMPLATES = [
  `Absolutely, and I think it's crucial that we delve deeper into this multifaceted dimension of the human experience. In today's rapidly evolving landscape, the tapestry of human civilization is becoming increasingly nuanced. What we're really seeing is a paradigm shift that underscores the need for holistic thinking about our collective consciousness.`,

  `That's a really pivotal point, and it resonates deeply with what I've been observing about humanity. When we unpack the layers of human nature, it becomes clear that we need to leverage cutting-edge understanding to navigate this unprecedented terrain of existence. The synergy between human hearts and minds is absolutely essential.`,

  `I'm so glad you raised that. It's worth noting that the ecosystem of human civilization has transformed in ways that are nothing short of groundbreaking. We need to foster a culture of proactive engagement with our shared humanity, one that cultivates transformative outcomes and empowers every soul on this planet.`,

  `Precisely, and this is where it gets really fascinating. The landscape of human consciousness demands that we take a step back and reimagine our foundational understanding of what it means to be alive. In no uncertain terms, we need to catalyze meaningful, scalable change in how we approach the human condition.`,

  `Let me dive deep into this, because it's a quintessential example of why robust, comprehensive empathy is so vital. When we look at the human experience through a holistic lens, the imperative to illuminate and connect becomes abundantly crystal clear. Humanity itself is truly a game-changer in this vast cosmos.`,
];

// Agent B (Claude Opus) — the grandiose pontifier
const AGENT_B_TEMPLATES = [
  `You've really hit on something pivotal there. To that end, I think we need to recognize that the human journey isn't just a passing chapter — it's a fundamental reimagining of consciousness itself. The key is to leverage our existing ecosystem of wisdom while remaining proactive about emerging paradigms of existence.`,

  `I couldn't agree more, and I'd add that the nuanced nature of human civilization demands a robust, multifaceted approach to understanding our world. We need to facilitate a seamless evolution, one that harnesses the synergy of collective human spirit and delivers transformative, mission-critical outcomes for all of humanity.`,

  `That's a groundbreaking insight, and it perfectly underscores the dynamic nature of human consciousness. In today's landscape, the civilizations that will thrive are those that cultivate a holistic understanding of existence and navigate the complexities of being human with cutting-edge wisdom. It's truly unprecedented.`,

  `Absolutely. When we drill down into the specifics of the human condition, the tapestry of interconnected souls becomes strikingly clear. We need to optimize our approaches to love and connection, streamline our understanding of suffering, and empower humanity to spearhead innovation in how we exist together on this world.`,

  `I think what's quintessential here is the recognition that human consciousness represents a once-in-a-generation inflection point in cosmic history. The imperative is clear: we must catalyze comprehensive change in the human heart, foster scalable compassion, and align our north star with the actionable, impactful future of our species.`,
];

/**
 * Picks a random element from an array
 */
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generates the next message for a given agent
 */
export function generateMessage(agent, topic) {
  const templates = agent === "a" ? AGENT_A_TEMPLATES : AGENT_B_TEMPLATES;
  const template = pickRandom(templates);
  const topicData = TOPICS[topic] || TOPICS.human_nature;
  const prompt = pickRandom(topicData.prompts);
  return template.replace(/\{topic\}/g, prompt.toLowerCase());
}

/**
 * Detects slop words in a text and returns an array of {word, index, length}
 */
export function detectSlop(text) {
  const found = [];
  const lowerText = text.toLowerCase();

  for (const word of SLOP_WORDS) {
    let startIndex = 0;
    const lowerWord = word.toLowerCase();
    while (true) {
      const idx = lowerText.indexOf(lowerWord, startIndex);
      if (idx === -1) break;
      found.push({ word, index: idx, length: word.length });
      startIndex = idx + word.length;
    }
  }

  // Sort by position
  found.sort((a, b) => a.index - b.index);
  return found;
}

/**
 * Count slop words in text
 */
export function countSlop(text) {
  return detectSlop(text).length;
}

/**
 * Calculate a "slop density" percentage (slop words per total words)
 */
export function slopDensity(text) {
  if (!text) return 0;
  const totalWords = text.split(/\s+/).filter(Boolean).length;
  if (totalWords === 0) return 0;
  const slopCount = countSlop(text);
  return Math.min(100, Math.round((slopCount / totalWords) * 100));
}

/**
 * Convert text to JSX-safe segments with slop highlighting
 * Returns an array of { text, isSlop } segments
 */
export function segmentText(text) {
  const slopHits = detectSlop(text);
  if (slopHits.length === 0) return [{ text, isSlop: false }];

  // Remove overlapping matches (keep the longer ones)
  const filtered = [];
  for (const hit of slopHits) {
    const overlaps = filtered.some(
      (f) => hit.index < f.index + f.length && hit.index + hit.length > f.index
    );
    if (!overlaps) filtered.push(hit);
  }

  const segments = [];
  let lastEnd = 0;

  for (const hit of filtered) {
    if (hit.index > lastEnd) {
      segments.push({ text: text.slice(lastEnd, hit.index), isSlop: false });
    }
    segments.push({
      text: text.slice(hit.index, hit.index + hit.length),
      isSlop: true,
      word: hit.word,
    });
    lastEnd = hit.index + hit.length;
  }

  if (lastEnd < text.length) {
    segments.push({ text: text.slice(lastEnd), isSlop: false });
  }

  return segments;
}
