import React, { useState, useRef, useEffect } from "react";
import styles from "./MatchStoryCard.module.css";

/* ── Build a compact prompt from the deep analytics data ─────── */
const buildPrompt = (data) => {
  const {
    teams,
    summary,
    winner,
    target,
    keyMoments,
    momentum,
    winProbability,
  } = data;

  /* Win prob swing — biggest single shift */
  const maxSwing =
    winProbability.length > 1
      ? winProbability.reduce(
          (best, d, i) => {
            if (i === 0) return best;
            const delta = Math.abs(d.prob - winProbability[i - 1].prob);
            return delta > best.delta
              ? { delta, ball: d.label, prob: d.prob }
              : best;
          },
          { delta: 0, ball: "", prob: 50 },
        )
      : null;

  /* Key moments summary */
  const wickets = keyMoments.filter((m) => m.type === "wicket").length;
  const bigOvers = keyMoments.filter((m) => m.type === "bigOver");
  const collapses = keyMoments.filter((m) => m.type === "wicketCluster");
  const topBigOver = bigOvers.sort((a, b) => (b.runs ?? 0) - (a.runs ?? 0))[0];

  /* Momentum — best and worst overs per innings */
  const bestInn1Over = [...(momentum.innings1 || [])].sort(
    (a, b) => b.runs - a.runs,
  )[0];
  const bestInn2Over = [...(momentum.innings2 || [])].sort(
    (a, b) => b.runs - a.runs,
  )[0];

  return `You are a cricket commentator writing a vivid, engaging match report for fans. Write in an energetic, expert style — like an ESPN/Sky Sports analyst. Use cricket terminology naturally. Be dramatic where the data warrants it.

MATCH DATA:
- Teams: ${teams.innings1} (Innings 1) vs ${teams.innings2} (Innings 2)
- Scores: ${teams.innings1} ${summary.inn1.runs}/${summary.inn1.wickets} (${summary.inn1.overs} overs) | ${teams.innings2} ${summary.inn2.runs}/${summary.inn2.wickets} (${summary.inn2.overs} overs)
- Target: ${target > 0 ? target : "N/A"}
- Winner: ${winner}
- Total wickets: ${summary.inn1.wickets + summary.inn2.wickets} (${summary.inn1.wickets} + ${summary.inn2.wickets})
- Wicket events: ${wickets}
${collapses.length > 0 ? `- Collapses detected: ${collapses.length} (${collapses.map((c) => c.description).join("; ")})` : ""}
${topBigOver ? `- Biggest over: Over ${topBigOver.over} — ${topBigOver.runs} runs by ${topBigOver.team}` : ""}
${bestInn1Over ? `- ${teams.innings1}'s best over: Over ${bestInn1Over.over} — ${bestInn1Over.runs} runs` : ""}
${bestInn2Over ? `- ${teams.innings2}'s best over: Over ${bestInn2Over.over} — ${bestInn2Over.runs} runs` : ""}
${maxSwing && maxSwing.delta > 10 ? `- Biggest win probability swing: ${maxSwing.delta.toFixed(0)}% shift at ball ${maxSwing.ball} (to ${maxSwing.prob.toFixed(0)}%)` : ""}
- Key moments: ${keyMoments
    .slice(0, 6)
    .map((m) => m.description)
    .join(" | ")}

Write a compelling 3-paragraph match story (250-320 words total):
1. FIRST INNINGS — what happened, standout moments, the total set
2. SECOND INNINGS — the chase, turning points, key wickets or partnerships
3. VERDICT — what decided the match, the hero/villain of the piece, final assessment

Start directly with an exciting opening line. No headers, no bullet points — flowing prose only.`;
};

/* ── Typewriter effect hook ──────────────────────────────────── */
const useTypewriter = (text, speed = 12) => {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    if (!text) return;
    let i = 0;
    const tick = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(tick);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(tick);
  }, [text, speed]);

  return { displayed, done };
};

/* ── Main Component ──────────────────────────────────────────── */
const MatchStoryCard = ({ data }) => {
  const [story, setStory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generated, setGenerated] = useState(false);
  const abortRef = useRef(null);

  const { displayed, done } = useTypewriter(story, 10);

  const generateStory = async () => {
    /* Cancel any in-flight request */
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);
    setStory("");
    setGenerated(false);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: abortRef.current.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: buildPrompt(data) }],
        }),
      });

      const result = await response.json();
      const text = result.content?.[0]?.text ?? "";
      setStory(text);
      setGenerated(true);
    } catch (err) {
      if (err.name !== "AbortError") {
        setError("Failed to generate story. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* Cleanup on unmount */
  useEffect(() => () => abortRef.current?.abort(), []);

  /* Format paragraphs */
  const paragraphs = displayed
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerIcon}>📖</span>
          <div>
            <h3 className={styles.title}>Match Story</h3>
            <p className={styles.subtitle}>
              AI-generated narrative powered by Claude
            </p>
          </div>
        </div>

        {!loading && (
          <button
            className={`${styles.generateBtn} ${generated ? styles.regenerateBtn : ""}`}
            onClick={generateStory}
          >
            {generated ? "↺ Regenerate" : "✨ Generate Story"}
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className={styles.loadingState}>
          <div className={styles.loadingDots}>
            <span />
            <span />
            <span />
          </div>
          <p className={styles.loadingText}>
            Claude is writing your match story...
          </p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className={styles.errorState}>
          <span className={styles.errorIcon}>⚠️</span>
          <p className={styles.errorText}>{error}</p>
          <button className={styles.retryBtn} onClick={generateStory}>
            Try again
          </button>
        </div>
      )}

      {/* Idle prompt */}
      {!loading && !error && !story && (
        <div className={styles.idleState}>
          <div className={styles.idleTeams}>
            <span
              className={styles.idleTeam}
              style={{ color: "var(--ci-brand)" }}
            >
              {data.teams.innings1}
            </span>
            <span className={styles.idleVs}>vs</span>
            <span
              className={styles.idleTeam}
              style={{ color: "var(--ci-accent)" }}
            >
              {data.teams.innings2}
            </span>
          </div>
          <p className={styles.idlePrompt}>
            Click <strong>Generate Story</strong> to get a vivid, expert
            analysis of this match — key moments, turning points, and the final
            verdict.
          </p>
          <div className={styles.idleFeatures}>
            {[
              "Turning point analysis",
              "Collapse detection",
              "Hero of the match",
              "Tactical breakdown",
            ].map((f) => (
              <span key={f} className={styles.idleFeature}>
                ✓ {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Story text */}
      {!loading && displayed && (
        <div className={styles.storyBody}>
          {paragraphs.map((para, i) => (
            <p
              key={i}
              className={`${styles.para} ${i === 0 ? styles.paraLead : ""}`}
            >
              {para}
              {/* Blinking cursor on last para while typing */}
              {!done && i === paragraphs.length - 1 && (
                <span className={styles.cursor}>|</span>
              )}
            </p>
          ))}

          {done && (
            <div className={styles.storyFooter}>
              <span className={styles.storyFooterBadge}>
                ✦ Generated by Claude · Cricket Intelligence
              </span>
              <span className={styles.storyFooterNote}>
                AI-generated analysis — for entertainment and insight
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MatchStoryCard;
