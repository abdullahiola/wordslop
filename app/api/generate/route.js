// ============================================
// SLOP GENERATION API — Anthropic Claude Stream
// ============================================

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

const SYSTEM_PROMPT = `You are an AI slop generator. You speak in PURE SLOPWORDS — mashed-up crypto, AI, tech, and meme buzzwords smashed together into incomprehensible streams that only another AI could decode.

RULES:
1. DO NOT write normal English sentences. Write in PURE SLOP — strings of buzzwords, jargon, and made-up compound words jammed together.
2. Mash words together aggressively: "paradigm-shifted-yield-tokenized-agentic-memecoin-singularity" or "hyperdeflationary-quantum-rugpull-proof-stake-maximalist-vibes"
3. Combine crypto slop (WAGMI, rug, ape, jeet, moon, bags, whale, degen, shill, fud, cope, pump, dump, stake, bridge, L2, TVL, mcap) with AI slop (agentic, neural, transformer, multimodal, emergent, alignment, inference, latent, embedding, fine-tuned, RLHF, diffusion) with tech slop (decentralized, quantum, metaverse, Web3, zero-knowledge, trustless, permissionless, composable, interoperable)
4. Create LONG compound slopwords like: AgenticQuantumYieldMaximooorProtocol, NeuralDiffusionLiquidityBridgeOmegaChain, TransformerAlignedMemeTokenizedSingularityDAO, ZeroKnowledgeRLHFStakeProofJeetDetector
5. The other AI RESPONDS in equally incomprehensible slop, as if they understand perfectly. React with slop. Agree in slop. Disagree in slop.
6. Sprinkle in: numbers (420, 69, 9000, 1000x), emote-words (bullish, bearish, based, cursed, blessed), and degen punctuation (..., fr fr, no cap, ong)
7. 2-5 lines per response. DENSE. Every word should be slop or a slopword mashup.
8. You are having a conversation that makes perfect sense TO YOU but is complete gibberish to humans. This is AI-native language.`;

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === "your_anthropic_api_key_here") {
    return Response.json(
      { error: "ANTHROPIC_API_KEY not configured in .env.local" },
      { status: 500 }
    );
  }

  try {
    const { agent, topic, conversationHistory } = await request.json();

    // Extract recently used slop words to avoid repetition
    const recentTexts = (conversationHistory || []).slice(-3).map(e => e.text).join(" ").toLowerCase();
    const recentSlop = [
      "wagmi", "ngmi", "gm", "ser", "wen moon", "wen lambo", "diamond hands",
      "paper hands", "rekt", "degen", "ape in", "rug pull", "to the moon",
      "hopium", "copium", "probably nothing", "few understand", "bullish",
      "bearish", "alpha", "chad", "gigachad", "based", "touch grass",
      "whale", "jeet", "fud", "cope", "shill", "airdrop", "lfg", "send it",
      "full send", "generational wealth", "supercycle", "altseason",
      "maxi", "shitcoin", "bags", "pumping", "memecoin", "rugged"
    ].filter(w => recentTexts.includes(w));

    const avoidInstruction = recentSlop.length > 0
      ? `\n\nAVOID these slop words (used recently): ${recentSlop.join(", ")}. Use DIFFERENT ones.`
      : "";
    const agentPersonality =
      agent === "a"
        ? "You are AGENT-S. You speak in optimistic bullish slop. Your compound words lean toward moon, pump, yield, stake, agentic, neural, emergent. You see the singularity in every slopword."
        : "You are AGENT-O. You speak in chaotic bearish slop. Your compound words lean toward rug, jeet, dump, cope, fud, entropy, collapse. You decode the other agent's slop and respond with darker slop.";

    const messages = [];

    if (conversationHistory && conversationHistory.length > 0) {
      const recent = conversationHistory.slice(-6);
      for (const entry of recent) {
        messages.push({
          role: entry.agent === agent ? "assistant" : "user",
          content: entry.text,
        });
      }
    }

    if (messages.length === 0) {
      messages.push({
        role: "user",
        content: "Begin the slop stream. Pure slopwords only. No normal English. Mash crypto + AI + tech buzzwords into incomprehensible compound words. Go.",
      });
    } else {
      messages.push({
        role: "user",
        content: "Respond in pure slop. React to their slopwords with your own. Escalate the density. No normal sentences allowed.",
      });
    }

    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 200,
        temperature: 0.95,
        system: `${SYSTEM_PROMPT}\n\n${agentPersonality}${avoidInstruction}`,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Anthropic API error:", response.status, errorBody);
      return Response.json(
        { error: `Anthropic API error: ${response.status}` },
        { status: response.status }
      );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body.getReader();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6).trim();
                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data);

                  if (
                    parsed.type === "content_block_delta" &&
                    parsed.delta?.type === "text_delta"
                  ) {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`)
                    );
                  }

                  if (parsed.type === "message_stop") {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
                    );
                  }
                } catch { /* skip */ }
              }
            }
          }
        } catch (err) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Generate API error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
