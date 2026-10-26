import { GlassPanel, PageHeading } from "@/components/Layout";
import { useMyCard, useSaveCard } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { Check, Palette, Save, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

const BACKGROUNDS = [
  {
    id: "neon-magenta",
    label: "Neon Magenta",
    css: "linear-gradient(135deg,#ff2fb3,#7c4dff)",
  },
  {
    id: "lime-rush",
    label: "Lime Rush",
    css: "linear-gradient(135deg,#c6ff00,#00e5a0)",
  },
  {
    id: "sunset",
    label: "Sunset",
    css: "linear-gradient(135deg,#ff6b35,#ff2fb3)",
  },
  {
    id: "cyber",
    label: "Cyber",
    css: "linear-gradient(135deg,#00e5ff,#7c4dff)",
  },
  {
    id: "gold",
    label: "Gold Digger",
    css: "linear-gradient(135deg,#ffd23f,#ff8a00)",
  },
  {
    id: "midnight",
    label: "Midnight",
    css: "linear-gradient(135deg,#1a1030,#3d1a5c)",
  },
];

const STICKERS = [
  "💸",
  "🤑",
  "🔥",
  "😎",
  "🦄",
  "🍕",
  "💎",
  "🚀",
  "🐐",
  "👑",
  "🥟",
  "☕",
];

const TITLE_IDEAS = [
  "Kanjoos Card",
  "Rich Dad Poor Dad",
  "Broke Billionaire",
  "Paisa Vasool",
  "Ambani Mode",
  "Chai Pani Card",
];

const LOGOS = ["💳", "🦁", "🐉", "⚡", "🌟", "🎯", "🍀", "👽"];

export function CardPage() {
  const { data: card, isLoading } = useMyCard();
  const saveCard = useSaveCard();

  const [title, setTitle] = useState("Kanjoos Card");
  const [background, setBackground] = useState(BACKGROUNDS[0].css);
  const [logo, setLogo] = useState("💳");
  const [stickers, setStickers] = useState<string[]>(["💸", "🔥"]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setBackground(card.background);
      setLogo(card.logo);
      setStickers(card.stickers);
    }
  }, [card]);

  function toggleSticker(sticker: string) {
    setStickers((prev) =>
      prev.includes(sticker)
        ? prev.filter((s) => s !== sticker)
        : prev.length >= 6
          ? prev
          : [...prev, sticker],
    );
  }

  function handleSave() {
    setSaved(false);
    saveCard.mutate(
      { title: title.trim() || "Untitled Card", background, logo, stickers },
      { onSuccess: () => setSaved(true) },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="Card Creator"
        subtitle="Design your neon debit card. Flex responsibly."
      />

      <div className="animate-fade-up">
        <div
          data-ocid="card.preview"
          className="relative aspect-[1.6/1] w-full overflow-hidden rounded-3xl p-5 shadow-glass ring-1 ring-white/20"
          style={{ background }}
        >
          <div className="flex items-start justify-between">
            <span className="font-display text-2xl font-extrabold text-white drop-shadow-md">
              {title || "Untitled Card"}
            </span>
            <span className="text-3xl drop-shadow">{logo}</span>
          </div>
          <p className="mt-10 font-mono text-lg tracking-[0.25em] text-white/90">
            •••• •••• •••• 4200
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-white/80">
              Neon Vault
            </span>
            <span className="flex gap-1">
              {stickers.map((sticker) => (
                <span key={sticker} className="text-xl drop-shadow">
                  {sticker}
                </span>
              ))}
            </span>
          </div>
        </div>
      </div>

      <GlassPanel className="space-y-5">
        <div>
          <label
            htmlFor="cardTitle"
            className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Card Title
          </label>
          <input
            id="cardTitle"
            data-ocid="card.title_input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={28}
            placeholder="Kanjoos Card"
            className="w-full rounded-2xl border border-input bg-background/60 px-3.5 py-3 text-sm outline-none transition-smooth focus:border-primary focus:ring-2 focus:ring-primary/40"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TITLE_IDEAS.map((idea) => (
              <button
                key={idea}
                type="button"
                data-ocid={`card.title_idea.${idea.slice(0, 6).replace(/\s/g, "_")}`}
                onClick={() => setTitle(idea)}
                className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-pop hover:border-primary/60 hover:text-foreground"
              >
                {idea}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <Palette className="h-3.5 w-3.5" aria-hidden="true" />
            Neon Background
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {BACKGROUNDS.map((bg) => (
              <button
                key={bg.id}
                type="button"
                data-ocid={`card.background.${bg.id}`}
                aria-label={bg.label}
                onClick={() => setBackground(bg.css)}
                className={cn(
                  "relative h-12 rounded-2xl ring-2 transition-pop hover:scale-105",
                  background === bg.css ? "ring-accent" : "ring-transparent",
                )}
                style={{ background: bg.css }}
              >
                {background === bg.css && (
                  <Check
                    className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow"
                    aria-hidden="true"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Custom Logo
          </p>
          <div className="flex flex-wrap gap-2">
            {LOGOS.map((option) => (
              <button
                key={option}
                type="button"
                data-ocid={`card.logo.${option.codePointAt(0)}`}
                aria-label={`Logo ${option}`}
                onClick={() => setLogo(option)}
                className={cn(
                  "grid h-11 w-11 place-items-center rounded-2xl border text-xl transition-pop hover:scale-105",
                  logo === option
                    ? "border-accent bg-accent/20"
                    : "border-border",
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Stickers ({stickers.length}/6)
          </p>
          <div className="flex flex-wrap gap-2">
            {STICKERS.map((sticker) => (
              <button
                key={sticker}
                type="button"
                data-ocid={`card.sticker.${sticker.codePointAt(0)}`}
                aria-label={`Sticker ${sticker}`}
                aria-pressed={stickers.includes(sticker)}
                onClick={() => toggleSticker(sticker)}
                className={cn(
                  "grid h-11 w-11 place-items-center rounded-2xl border text-xl transition-pop hover:scale-105",
                  stickers.includes(sticker)
                    ? "border-primary bg-primary/20"
                    : "border-border",
                )}
              >
                {sticker}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          data-ocid="card.save_button"
          onClick={handleSave}
          disabled={saveCard.isPending || isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-6 py-3.5 font-display text-base font-bold text-primary-foreground shadow-pop transition-pop hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          {saveCard.isPending ? "Saving…" : "Save Card"}
        </button>

        {saved && (
          <p
            data-ocid="card.success_state"
            className="rounded-2xl border border-accent/50 bg-accent/10 px-3 py-2 text-center text-sm text-accent"
          >
            Card saved! It now shows on your wallet. 🎉
          </p>
        )}
        {saveCard.isError && (
          <p
            role="alert"
            data-ocid="card.error_state"
            className="rounded-2xl border border-destructive/50 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive"
          >
            Could not save your card. Try again.
          </p>
        )}
      </GlassPanel>
    </div>
  );
}
