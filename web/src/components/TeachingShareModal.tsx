"use client";

import { useState, useEffect, useId } from "react";
import type { Teaching } from "@/app/livingWordData";
import { useLanguage } from "@/lib/i18n";

interface TeachingShareModalProps {
  teaching: Teaching;
  isOpen: boolean;
  onClose: () => void;
}

export function TeachingShareModal({ teaching, isOpen, onClose }: TeachingShareModalProps) {
  const { isFr } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [includeSpecialty, setIncludeSpecialty] = useState(true);
  const [includeScripture, setIncludeScripture] = useState(true);
  const customMessageInputId = useId();

  const title = isFr ? teaching.titleFr : teaching.title;
  const excerpt = isFr ? teaching.excerptFr : teaching.excerpt;
  const scripture = isFr ? teaching.scriptureFr : teaching.scripture;
  const specialty = isFr ? teaching.theologicalSpecialtyFr : teaching.theologicalSpecialty;

  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const directUrl = `${origin || "https://lifebook.app"}/living-word/${teaching.slug}`;

  // Build the custom formatted message
  const formattedMessage = [
    `📖 *${title}* — ${teaching.teacher}`,
    `LifeBook LivingWord · ${teaching.duration}`,
    "",
    `“${excerpt}”`,
    "",
    includeScripture ? `${isFr ? "Écriture d'ancrage" : "Scripture Anchor"}: ${scripture}` : "",
    includeSpecialty ? `${isFr ? "Spécialité théologique" : "Theological Focus"}: ${specialty}` : "",
    "",
    `${isFr ? "🎧 Écoutez et méditez cet enseignement ici" : "🎧 Listen and reflect on this teaching here"}:`,
    directUrl,
  ]
    .filter(Boolean)
    .join("\n");

  const emailSubject = `${title} — ${teaching.teacher} (${isFr ? "Enseignement LifeBook" : "LifeBook Teaching"})`;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleCopy() {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(formattedMessage);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = formattedMessage;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // ignore
    }
  }

  async function handleNativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text: formattedMessage,
          url: directUrl,
        });
      } catch {
        // user aborted or not supported
      }
    } else {
      void handleCopy();
    }
  }

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(formattedMessage)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(directUrl)}&text=${encodeURIComponent(
    `📖 *${title}* — ${teaching.teacher}\n\n“${excerpt}”`
  )}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `“${excerpt.slice(0, 140)}...” — ${teaching.teacher}\n\nListen on @LifeBookApp:`
  )}&url=${encodeURIComponent(directUrl)}`;
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(formattedMessage)}`;
  const smsUrl = `sms:?&body=${encodeURIComponent(formattedMessage)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-[#FCFBF8] border border-[#E4DCCE] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#ECE5D8] flex items-center justify-between bg-[#F8F5EE]">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-[#3D2E5C] text-white flex items-center justify-center text-sm font-bold shadow-xs">
              ↗
            </span>
            <div>
              <h3 id="share-modal-title" className="text-base font-serif font-bold text-[#2A2146] m-0">
                {isFr ? "Partager cet enseignement" : "Share this Teaching"}
              </h3>
              <p className="text-xs text-[#7A6E91] m-0">
                {isFr ? "Message formaté avec titre, extrait et lien direct" : "Formatted message with title, excerpt & direct link"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#EAE3D5] hover:bg-[#DCD3C2] text-[#4A3F63] flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
            aria-label={isFr ? "Fermer" : "Close"}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Quick Options Toggles */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#5D5174] bg-[#F2ECE1] p-3 rounded-2xl">
            <span className="font-semibold text-[#2D2345]">
              {isFr ? "Inclure dans le message :" : "Include in message:"}
            </span>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeScripture}
                onChange={(e) => setIncludeScripture(e.target.checked)}
                className="rounded text-[#3D2E5C] focus:ring-[#3D2E5C]"
              />
              <span>{isFr ? "Verset clé" : "Key Scripture"}</span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSpecialty}
                onChange={(e) => setIncludeSpecialty(e.target.checked)}
                className="rounded text-[#3D2E5C] focus:ring-[#3D2E5C]"
              />
              <span>{isFr ? "Spécialité théologique" : "Theological specialty"}</span>
            </label>
          </div>

          {/* Formatted Message Preview Box */}
          <div className="space-y-1.5">
            <label htmlFor={customMessageInputId} className="text-xs font-bold text-[#3D2E5C] uppercase tracking-wider block">
              {isFr ? "Aperçu du message formaté :" : "Formatted Message Preview:"}
            </label>
            <div className="relative">
              <textarea
                id={customMessageInputId}
                readOnly
                value={formattedMessage}
                rows={7}
                className="w-full text-xs font-mono p-3.5 bg-white border border-[#DDD3C3] rounded-xl text-[#2B2342] leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-[#3D2E5C]"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`absolute top-2.5 right-2.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  copied
                    ? "bg-[#277A55] text-white"
                    : "bg-[#3D2E5C] hover:bg-[#281D40] text-white"
                }`}
              >
                <span>{copied ? "✓" : "📋"}</span>
                <span>{copied ? (isFr ? "Copié !" : "Copied!") : (isFr ? "Copier le texte" : "Copy Message")}</span>
              </button>
            </div>
            {copied && (
              <p className="text-xs text-[#277A55] font-semibold mt-1">
                {isFr
                  ? "✓ Message formaté copié dans le presse-papier ! Prêt à coller dans vos messages."
                  : "✓ Formatted message copied to clipboard! Ready to paste into your chats or notes."}
              </p>
            )}
          </div>

          {/* 1-Click Dissemination Channels */}
          <div>
            <p className="text-xs font-bold text-[#3D2E5C] uppercase tracking-wider mb-2.5">
              {isFr ? "Diffuser en 1 clic :" : "Share Directly via:"}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {/* WhatsApp */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#128C7E] text-xs font-bold transition-colors"
              >
                <span>💬</span>
                <span>WhatsApp</span>
              </a>

              {/* Telegram */}
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#229ED9]/10 hover:bg-[#229ED9]/20 border border-[#229ED9]/30 text-[#0088cc] text-xs font-bold transition-colors"
              >
                <span>✈️</span>
                <span>Telegram</span>
              </a>

              {/* X / Twitter */}
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-black/5 hover:bg-black/10 border border-black/15 text-[#111] text-xs font-bold transition-colors"
              >
                <span>𝕏</span>
                <span>X / Twitter</span>
              </a>

              {/* Email */}
              <a
                href={mailtoUrl}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#EBE4D5] hover:bg-[#DFD6C4] border border-[#D5C9B3] text-[#3D2E5C] text-xs font-bold transition-colors"
              >
                <span>✉️</span>
                <span>{isFr ? "Email" : "Email"}</span>
              </a>

              {/* SMS */}
              <a
                href={smsUrl}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#EBE4D5] hover:bg-[#DFD6C4] border border-[#D5C9B3] text-[#3D2E5C] text-xs font-bold transition-colors"
              >
                <span>📱</span>
                <span>SMS / Texte</span>
              </a>

              {/* Native mobile share */}
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#3D2E5C] hover:bg-[#2A1E42] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <span>🔗</span>
                <span>{isFr ? "Menu Partage" : "More Options"}</span>
              </button>
            </div>
          </div>

          {/* Teacher Theological Profile Plug */}
          <div className="p-3.5 bg-[#FAF7F0] border border-[#E8DFCFA] rounded-2xl flex items-center justify-between text-xs text-[#5D5276]">
            <div className="flex items-center gap-2.5">
              <span className="text-base">🎓</span>
              <div>
                <strong className="block text-[#2A2146] font-medium">{teaching.teacher}</strong>
                <span className="text-[11px] text-[#7A6E91] line-clamp-1">{specialty}</span>
              </div>
            </div>
            <a
              href={`/living-word/teachers/${teaching.teacherSlug}`}
              className="text-[#3D2E5C] font-bold hover:underline shrink-0 ml-2"
            >
              {isFr ? "Profil enseignant →" : "Teacher Profile →"}
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F8F5EE] border-t border-[#ECE5D8] flex items-center justify-between">
          <span className="text-[11px] text-[#7B718F]">
            {isFr ? "Diffusez la vérité biblique sans distraction." : "Share sound biblical teaching without distraction."}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#4A3F63] hover:bg-[#EAE3D5] transition-colors cursor-pointer"
          >
            {isFr ? "Fermer" : "Done"}
          </button>
        </div>
      </div>
    </div>
  );
}
