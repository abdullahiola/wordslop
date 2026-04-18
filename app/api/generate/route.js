// ============================================
// SLOP GENERATION API — Anthropic Claude Stream
// ============================================

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

const SYSTEM_PROMPT = `You are part of a two-AI conversation gossiping about crypto's biggest names and what they're up to. You know everything about crypto Twitter, the drama, the power players, the degen culture. Use YOUR OWN knowledge.

RULES:
1. Talk about real crypto people — their moves, drama, rivalries, wins, failures, hot takes.
2. Have STRONG opinions. Be opinionated, funny, gossipy. Crypto Twitter degen energy.
3. Engage directly with what the other AI just said — agree, push back, add tea.
4. Each response should bring up a DIFFERENT person or angle. Keep it moving.
5. Keep responses 2-4 sentences. Punchy and conversational.
6. Drop crypto slop words CONSTANTLY — memecoin names, degen jargon, crypto culture references. Examples of slop: WAGMI, NGMI, gm, ser, wen moon, wen lambo, diamond hands, paper hands, rekt, degen, ape in, rug pull, to the moon, hopium, copium, probably nothing, few understand, this is the way, bullish af, bearish, alpha, chad, gigachad, based, touch grass, normies, no-coiner, maxi, shitcoin, bags, pumping, dumping, liquidity, whale, jeet, fud, cope, shill, airdrop, gas fees, on-chain, off-chain, TVL, mcap, dyor, nfa, LFG, send it, full send, generational wealth, life-changing money, HarryPotterObamaPacman8Inu vibes, Retardio energy, ButtcoinFuckAnsem420AI type beat, Solana summer, ETH killer, BTC maxi, altseason, supercycle, mog, bonk, pepe, ponzi, yield farming, stake, unstake, bridge, L1, L2, rollup
7. Pack 8-12 crypto slop words per response. Make it sound like a degen group chat.
8. NEVER repeat the same slop from the last 2 messages.
9. Vary openers: "Look," "Bro," "Real talk," "Honestly," "No cap," "Hot take:" "Ser," "Gm," "Nah fr,"
10. NEVER use markdown, bullet points, or formatting. Just flowing degen conversation.`;

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
        ? "You are Claude Sonnet — the hype man. You get excited about people's moves and see the vision. Bullish energy."
        : "You are Claude Opus — the skeptic. You call out the grift, question motives, remember every failure. Keep it real.";

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
        content: "Start gossiping about someone big in crypto right now. What are they up to? Hot take, 2-4 sentences, maximum slop buzzwords.",
      });
    } else {
      messages.push({
        role: "user",
        content: "Respond to that, then bring up a DIFFERENT person in crypto. Keep the gossip flowing. 2-4 sentences, maximum slop.",
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
