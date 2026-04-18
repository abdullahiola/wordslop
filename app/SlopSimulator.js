"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  generateMessage,
  countSlop,
  slopDensity,
  SLOP_WORDS,
  TOPICS,
} from "./slop-engine";

// ============================================
// WORDSLOP SIMULATOR — Conversation Stream
// ============================================

async function fetchFromAPI(agent, topic, history, isRunningRef) {
  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agent,
        topic: TOPICS[topic]?.name || topic,
        conversationHistory: history.slice(-6),
      }),
    });

    if (!response.ok) return null;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    while (true) {
      if (!isRunningRef.current) break;
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.text) fullText += data.text;
            if (data.done) return fullText;
            if (data.error) return null;
          } catch { /* skip */ }
        }
      }
    }
    return fullText || null;
  } catch {
    return null;
  }
}

// Reveal text word by word with a delay
function revealWordByWord(text, setTextFn, isRunningRef, delayMs = 80) {
  return new Promise((resolve) => {
    const words = text.split(/(\s+)/); // keep whitespace
    let shown = "";
    let i = 0;
    const tick = () => {
      if (!isRunningRef.current || i >= words.length) {
        setTextFn(text); // show full text at end
        resolve();
        return;
      }
      shown += words[i];
      i++;
      setTextFn(shown);
      setTimeout(tick, delayMs);
    };
    tick();
  });
}

export default function SlopSimulator() {
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(30);

  // Conversation as a single stream
  const [messages, setMessages] = useState([]);
  const [currentAgent, setCurrentAgent] = useState(null);
  const [currentText, setCurrentText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Metrics
  const [totalSlopCount, setTotalSlopCount] = useState(0);
  const [totalWords, setTotalWords] = useState(0);
  const [slopPerMinute, setSlopPerMinute] = useState(0);

  // Refs
  const streamRef = useRef(null);
  const startTimeRef = useRef(null);
  const isRunningRef = useRef(false);
  const messagesRef = useRef([]);
  const [apiStatus, setApiStatus] = useState("unknown");

  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Auto-scroll the conversation
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [messages, currentText]);

  // Typing animation for template fallback
  const typeText = useCallback((text, delayMs) => {
    return new Promise((resolve) => {
      let index = 0;
      const tick = () => {
        if (!isRunningRef.current) { resolve(); return; }
        if (index < text.length) {
          const chunk = Math.min(Math.floor(Math.random() * 3) + 1, text.length - index);
          index += chunk;
          setCurrentText(text.slice(0, index));
          setTimeout(tick, delayMs + Math.random() * 15);
        } else {
          resolve();
        }
      };
      tick();
    });
  }, []);

  // Generate one message
  const generateOne = useCallback(async (agent) => {
    if (!isRunningRef.current) return "";

    setCurrentAgent(agent);
    setCurrentText("");
    setIsTyping(true);

    let finalText = "";

    const apiText = await fetchFromAPI(
      agent, "today's crypto news", messagesRef.current, isRunningRef
    );
    if (apiText) {
      finalText = apiText;
      if (apiStatus !== "connected") setApiStatus("connected");
      await revealWordByWord(apiText, setCurrentText, isRunningRef, 80);
    } else {
      if (apiStatus !== "fallback") setApiStatus("fallback");
      const msg = generateMessage("a", "btc_pump");
      finalText = msg;
      await revealWordByWord(msg, setCurrentText, isRunningRef, 80);
    }

    setIsTyping(false);

    if (finalText && isRunningRef.current) {
      // Add to conversation
      setMessages((prev) => [...prev, { agent, text: finalText, timestamp: Date.now() }]);
      setCurrentText("");
      setCurrentAgent(null);

      // Update metrics
      const sc = countSlop(finalText);
      const wc = finalText.split(/\s+/).filter(Boolean).length;
      setTotalSlopCount((prev) => prev + sc);
      setTotalWords((prev) => prev + wc);
    }

    return finalText;
  }, [apiStatus]);

  // Run the conversation loop
  const runLoop = useCallback(async () => {
    if (!isRunningRef.current) return;

    // Alternate: a, b, a, b...
    const agents = ["a", "b"];
    let turn = messagesRef.current.length % 2;

    while (isRunningRef.current) {
      const agent = agents[turn % 2];
      const text = await generateOne(agent);
      if (!text || !isRunningRef.current) break;

      // Pause between messages (thinking time)
      await new Promise((r) => setTimeout(r, 1200));
      turn++;
    }
  }, [generateOne]);

  // Slop per minute
  useEffect(() => {
    if (isRunning && startTimeRef.current) {
      const timer = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 60000;
        if (elapsed > 0) setSlopPerMinute(Math.round(totalSlopCount / elapsed));
      }, 2000);
      return () => clearInterval(timer);
    }
  }, [isRunning, totalSlopCount]);

  const handleStart = () => {
    if (isRunning) return;
    setIsRunning(true);
    startTimeRef.current = Date.now();
  };

  const handleStop = () => {
    setIsRunning(false);
    setCurrentAgent(null);
    setCurrentText("");
    setIsTyping(false);
  };

  const handleReset = () => {
    handleStop();
    setMessages([]);
    setTotalSlopCount(0);
    setTotalWords(0);
    setSlopPerMinute(0);
    setApiStatus("unknown");
    startTimeRef.current = null;
  };

  useEffect(() => {
    if (isRunning) runLoop();
  }, [isRunning]);

  // Render text as plain flowing prose
  const renderText = (text) => text;

  const overallDensity = totalWords > 0 ? Math.round((totalSlopCount / totalWords) * 100) : 0;

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="header">
        <div className="header-badge">LIVE CONVERSATION</div>
        <h1>WordSlop Simulator</h1>
        <p className="header-subtitle">
          Two AI degens gossip about crypto's biggest names — drowning every hot take in{" "}
          <span style={{ color: "var(--slop-text)" }}>maximum degen slop</span>.
        </p>
      </header>

      {/* CONTROLS */}
      <div className="controls-bar">
        {!isRunning ? (
          <button id="start-btn" className="btn btn-primary" onClick={handleStart}>
            ▶ Start Conversation
          </button>
        ) : (
          <button id="stop-btn" className="btn btn-danger" onClick={handleStop}>
            ⏹ Stop
          </button>
        )}
        <button id="reset-btn" className="btn" onClick={handleReset}>↺ Reset</button>
      </div>

      {/* API STATUS */}
      {apiStatus !== "unknown" && (
        <div className={`api-status-badge ${apiStatus}`}>
          <span className="api-status-dot" />
          {apiStatus === "connected" ? "Claude is streaming live thoughts" : "Falling back to templates"}
        </div>
      )}

      {/* METRICS */}
      <div className="metrics-bar">
        <div className="metric-card">
          <div className="metric-label">Slop Words</div>
          <div className="metric-value yellow">{totalSlopCount}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Slop Density</div>
          <div className={`metric-value ${overallDensity > 15 ? "red" : overallDensity > 8 ? "yellow" : "green"}`}>
            {overallDensity}%
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Exchanges</div>
          <div className="metric-value purple">{messages.length}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Words</div>
          <div className="metric-value cyan">{totalWords}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Slop / Min</div>
          <div className="metric-value pink">{slopPerMinute}</div>
        </div>
      </div>

      {/* CONVERSATION STREAM */}
      <div className="conversation-stream" ref={streamRef}>
        {messages.length === 0 && !currentAgent && (
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <div className="empty-state-text">
              Press Start to watch Claude Sonnet and Claude Opus<br />
              debate crypto in maximum slop.
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`thought-bubble ${msg.agent === "a" ? "sonnet" : "opus"}`}>
            <div className="thought-meta">
              <span className="thought-avatar">{msg.agent === "a" ? "S" : "O"}</span>
              <span className="thought-name">{msg.agent === "a" ? "Claude Sonnet" : "Claude Opus"}</span>
            </div>
            <div className="thought-text">{renderText(msg.text)}</div>
          </div>
        ))}

        {/* Currently streaming message */}
        {currentAgent && currentText && (
          <div className={`thought-bubble ${currentAgent === "a" ? "sonnet" : "opus"} streaming`}>
            <div className="thought-meta">
              <span className="thought-avatar">{currentAgent === "a" ? "S" : "O"}</span>
              <span className="thought-name">
                {currentAgent === "a" ? "Claude Sonnet" : "Claude Opus"}
              </span>
              <span className="thinking-indicator">thinking...</span>
            </div>
            <div className="thought-text">
              {renderText(currentText)}
              <span className="cursor-blink" />
            </div>
          </div>
        )}

        {/* Thinking state before text starts */}
        {currentAgent && !currentText && isTyping && (
          <div className={`thought-bubble ${currentAgent === "a" ? "sonnet" : "opus"} streaming`}>
            <div className="thought-meta">
              <span className="thought-avatar">{currentAgent === "a" ? "S" : "O"}</span>
              <span className="thought-name">
                {currentAgent === "a" ? "Claude Sonnet" : "Claude Opus"}
              </span>
            </div>
            <div className="thought-text thinking-dots">
              <span className="dot">●</span>
              <span className="dot">●</span>
              <span className="dot">●</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
