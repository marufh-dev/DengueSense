import { useState } from "react";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clipboard,
  ExternalLink,
  Loader2,
  Send,
  Sparkles,
} from "lucide-react";
import { apiRequest } from "../api/client";
import { useLanguage } from "../context/LanguageContext";

/**
 * Robust extraction of numerical Telegram User/Chat ID from raw text.
 * Handles formats from @userinfobot such as:
 *   "Id: 6396225829"
 *   "User: 6396225829"
 *   "Chat ID: 6396225829"
 *   "6396225829"
 */
export function extractTelegramId(rawText) {
  if (!rawText) return null;
  const str = String(rawText).trim();

  // Pattern 1: Explicit "Id: 123456789" (common in @userinfobot, @userinfobot_bot)
  const idMatch = str.match(/(?:Id|User(?:\s*Id)?|Chat\s*Id)\s*[:=]\s*(\d{6,14})/i);
  if (idMatch && idMatch[1]) {
    return idMatch[1];
  }

  // Pattern 2: Standalone 6-14 digit number anywhere in the text
  const numMatch = str.match(/\b\d{6,14}\b/);
  if (numMatch) {
    return numMatch[0];
  }

  return null;
}

export default function TelegramHelper({ telegramChatId, onSelectId, token }) {
  const { lang, t } = useLanguage();
  const strings = t.alerts;

  const [openGuide, setOpenGuide] = useState(false);
  const [testing, setTesting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error' | 'info', text: string }

  const handleAutoDetectClipboard = async () => {
    setFeedback(null);
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        setFeedback({
          type: "error",
          text: strings.clipboardError,
        });
        return;
      }

      const clipText = await navigator.clipboard.readText();
      const extracted = extractTelegramId(clipText);

      if (extracted) {
        onSelectId(extracted);
        setFeedback({
          type: "success",
          text: `${strings.idExtracted} ${extracted}`,
        });
      } else {
        setFeedback({
          type: "error",
          text: strings.noIdFound,
        });
      }
    } catch (err) {
      setFeedback({
        type: "error",
        text: strings.clipboardError + (err.message ? ` (${err.message})` : ""),
      });
    }
  };

  const handleTestPing = async () => {
    setFeedback(null);
    const idToTest = String(telegramChatId || "").trim();
    if (!idToTest) {
      setFeedback({
        type: "error",
        text: strings.telegramRequired,
      });
      return;
    }

    setTesting(true);
    try {
      const res = await apiRequest("/api/alerts/test-telegram", {
        method: "POST",
        token,
        body: { telegram_chat_id: idToTest },
      });
      setFeedback({
        type: "success",
        text: res.message || "Test alert ping sent! Check your Telegram app.",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.message || "Failed to reach Telegram bot.",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div
      style={{
        border: "1px solid #14080e",
        background: "#ffffff",
        boxShadow: "2px 2px 0px #14080e",
        padding: "14px 16px",
        marginTop: 12,
        marginBottom: 16,
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              background: "#14080e",
              color: "#ffffff",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Bot size={16} />
          </div>
          <div>
            <strong style={{ fontSize: "0.88rem", display: "block" }}>
              {strings.tgHelperTitle}
            </strong>
            <span style={{ fontSize: "0.78rem", color: "var(--ink-secondary)" }}>
              {strings.tgHelperSub}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpenGuide((prev) => !prev)}
          className="btn btn-ghost"
          style={{ height: 26, padding: "0 6px", fontSize: "11px", gap: 4 }}
        >
          <span>{openGuide ? (lang === "bn" ? "নির্দেশনা লুকান" : "Hide Guide") : (lang === "bn" ? "অটোমেশন গাইড" : "Step-by-Step Guide")}</span>
          {openGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Collapsible Step-by-Step Automation Guide */}
      {openGuide && (
        <div
          style={{
            background: "#fafafb",
            border: "1px solid #dedde5",
            padding: "12px 14px",
            marginBottom: 12,
            fontSize: "0.82rem",
            lineHeight: 1.6,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <Sparkles size={13} color="#49475b" />
            <span>{lang === "bn" ? "সহজ ৩-ধাপের অটোমেশন গাইড:" : "Easy 3-Step Automation:"}</span>
          </div>
          <ol style={{ margin: "0 0 10px 18px", padding: 0 }}>
            <li>{strings.step1}</li>
            <li>{strings.step2}</li>
            <li>{strings.step3}</li>
            <li>{strings.step4}</li>
          </ol>
          <div
            style={{
              padding: "6px 10px",
              background: "#ffffff",
              border: "1px solid #14080e",
              fontSize: "0.78rem",
              color: "#14080e",
              fontWeight: 500,
            }}
          >
            ⚠️ {strings.startAlertBotNotice}
          </div>
        </div>
      )}

      {/* Action Automation Buttons */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {/* Step 1: Launch @userinfobot */}
        <a
          href="https://t.me/userinfobot"
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary"
          style={{ height: 30, padding: "0 10px", fontSize: "11px", gap: 6 }}
          title="Open Telegram and launch @userinfobot"
        >
          <Send size={13} />
          <span>{strings.openUserInfoBot}</span>
          <ExternalLink size={11} color="var(--ink-secondary)" />
        </a>

        {/* Step 2: Auto-Detect ID from Clipboard */}
        <button
          type="button"
          onClick={handleAutoDetectClipboard}
          className="btn btn-secondary"
          style={{ height: 30, padding: "0 10px", fontSize: "11px", gap: 6 }}
          title="Extract Telegram ID from copied text"
        >
          <Clipboard size={13} />
          <span>{strings.autoDetectBtn}</span>
        </button>

        {/* Step 3: Test Alert Ping */}
        <button
          type="button"
          onClick={handleTestPing}
          disabled={testing || !telegramChatId}
          className="btn btn-secondary"
          style={{ height: 30, padding: "0 10px", fontSize: "11px", gap: 6 }}
          title="Send a live test verification ping to your Telegram"
        >
          {testing ? <Loader2 size={13} className="spin" /> : <Bot size={13} />}
          <span>{testing ? (lang === "bn" ? "পাঠানো হচ্ছে..." : "PINGING...") : strings.testAlertBtn}</span>
        </button>

        {/* Step 4: Open @denguesense_alert_bot */}
        <a
          href="https://t.me/denguesense_alert_bot"
          target="_blank"
          rel="noreferrer"
          className="btn btn-ghost"
          style={{ height: 30, padding: "0 8px", fontSize: "11px", gap: 4, marginLeft: "auto" }}
          title="Open our alert bot and tap START"
        >
          <span>{strings.openAlertBot}</span>
          <ExternalLink size={11} />
        </a>
      </div>

      {/* Live Feedback Toast/Banner */}
      {feedback && (
        <div
          style={{
            marginTop: 10,
            padding: "8px 12px",
            border: `1px solid ${feedback.type === "success" ? "#14080e" : "#dc2626"}`,
            background: feedback.type === "success" ? "#f4f4f6" : "#fef2f2",
            color: feedback.type === "success" ? "#14080e" : "#991b1b",
            fontSize: "0.8rem",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "var(--font-mono)",
          }}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 size={14} color="#14080e" />
          ) : (
            <AlertCircle size={14} color="#dc2626" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}
    </div>
  );
}
