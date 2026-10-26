import { Avatar } from "@/components/Avatar";
import { SignInButton } from "@/components/InternetIdentity";
import { GlassPanel, PageHeading } from "@/components/Layout";
import { useCallerProfile, useUpdateProfile } from "@/hooks/useQueries";
import { normalizeInstagram } from "@/lib/format";
import { playCashRegister, speak } from "@/lib/soundbox";
import { useSoundbox } from "@/lib/soundbox-context";
import { cn } from "@/lib/utils";
import { Bell, LogOut, Save, Volume2 } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

export function ProfilePage() {
  const { data: profile, isLoading } = useCallerProfile();
  const updateProfile = useUpdateProfile();
  const { enabled, volume, setEnabled, setVolume } = useSoundbox();

  const [fullName, setFullName] = useState("");
  const [classSection, setClassSection] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [instagramId, setInstagramId] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName);
      setClassSection(profile.classSection);
      setRollNumber(profile.rollNumber.toString());
      setInstagramId(profile.instagramId);
    }
  }, [profile]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    setError(null);

    const roll = Number.parseInt(rollNumber.replace(/[^0-9]/g, ""), 10);
    if (!fullName.trim() || !classSection.trim() || Number.isNaN(roll)) {
      setError("Fill in your name, class, and a numeric roll number.");
      return;
    }

    updateProfile.mutate(
      {
        fullName: fullName.trim(),
        classSection: classSection.trim(),
        rollNumber: BigInt(roll),
        instagramId: normalizeInstagram(instagramId),
      },
      {
        onSuccess: () => setSaved(true),
        onError: () => setError("Could not save your profile. Try again."),
      },
    );
  }

  if (isLoading) {
    return (
      <div data-ocid="profile.loading_state" className="space-y-4">
        <div className="h-32 animate-pulse rounded-3xl border border-border bg-card/40" />
        <div className="h-64 animate-pulse rounded-3xl border border-border bg-card/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeading title="Profile" subtitle="Your fake-money identity." />

      <GlassPanel className="flex items-center gap-4 animate-fade-up">
        <Avatar name={profile?.fullName ?? "You"} seed="me" size="lg" />
        <div className="min-w-0">
          <p className="truncate font-display text-xl font-bold">
            {profile?.fullName ?? "Unknown"}
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {profile?.instagramId}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Class {profile?.classSection} · Roll{" "}
            {profile?.rollNumber.toString()}
          </p>
        </div>
      </GlassPanel>

      <GlassPanel className="animate-fade-up">
        <h2 className="mb-4 font-display text-lg font-bold">Edit details</h2>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="profileName"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
            >
              Full Name
            </label>
            <input
              id="profileName"
              data-ocid="profile.full_name_input"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="profileClass"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
              >
                Class & Section
              </label>
              <input
                id="profileClass"
                data-ocid="profile.class_section_input"
                type="text"
                value={classSection}
                onChange={(e) => setClassSection(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="profileRoll"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
              >
                Roll Number
              </label>
              <input
                id="profileRoll"
                data-ocid="profile.roll_number_input"
                type="text"
                inputMode="numeric"
                value={rollNumber}
                onChange={(e) =>
                  setRollNumber(e.target.value.replace(/[^0-9]/g, ""))
                }
                className={cn(inputClass, "font-mono")}
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="profileInstagram"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground"
            >
              Instagram ID
            </label>
            <input
              id="profileInstagram"
              data-ocid="profile.instagram_input"
              type="text"
              value={instagramId}
              onChange={(e) => setInstagramId(e.target.value)}
              placeholder="@yourhandle"
              className={inputClass}
            />
          </div>

          {error && (
            <p
              role="alert"
              data-ocid="profile.error_state"
              className="rounded-2xl border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}
          {saved && (
            <p
              data-ocid="profile.success_state"
              className="rounded-2xl border border-accent/50 bg-accent/10 px-3 py-2 text-sm text-accent"
            >
              Profile updated! ✨
            </p>
          )}

          <button
            type="submit"
            data-ocid="profile.save_button"
            disabled={updateProfile.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-6 py-3.5 font-display text-base font-bold text-primary-foreground shadow-pop transition-pop hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {updateProfile.isPending ? "Saving…" : "Save changes"}
          </button>
        </form>
      </GlassPanel>

      <GlassPanel className="space-y-5 animate-fade-up">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <Bell className="h-5 w-5 text-accent" aria-hidden="true" />
          Soundbox Alerts
        </h2>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold">Cash-register alerts</p>
            <p className="text-xs text-muted-foreground">
              Play a chime and voice line when money arrives.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label="Toggle soundbox alerts"
            data-ocid="profile.soundbox_toggle"
            onClick={() => setEnabled(!enabled)}
            className={cn(
              "relative h-7 w-12 shrink-0 rounded-full transition-smooth",
              enabled ? "bg-accent" : "bg-muted",
            )}
          >
            <span
              className={cn(
                "absolute top-1 h-5 w-5 rounded-full bg-background shadow transition-smooth",
                enabled ? "left-6" : "left-1",
              )}
            />
          </button>
        </div>

        <div>
          <label
            htmlFor="volume"
            className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
          >
            <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
            Volume · {Math.round(volume * 100)}%
          </label>
          <input
            id="volume"
            data-ocid="profile.volume_slider"
            type="range"
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            className="w-full accent-accent"
          />
          <button
            type="button"
            data-ocid="profile.test_sound_button"
            onClick={() => {
              playCashRegister(volume);
              window.setTimeout(
                () =>
                  speak("Received 500 fake rupees. Party kab dega?", volume),
                420,
              );
            }}
            className="mt-3 rounded-full border border-border px-4 py-2 text-sm font-semibold transition-pop hover:border-accent/60"
          >
            Test soundbox 🔊
          </button>
        </div>
      </GlassPanel>

      <GlassPanel className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <LogOut
            className="h-5 w-5 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">
            Signed in with Internet Identity
          </p>
        </div>
        <SignInButton className="rounded-full border border-border px-4 py-2 text-sm font-semibold transition-pop hover:border-destructive/60 hover:text-destructive" />
      </GlassPanel>
    </div>
  );
}

const inputClass =
  "w-full rounded-2xl border border-input bg-background/60 px-3.5 py-3 text-sm outline-none transition-smooth focus:border-primary focus:ring-2 focus:ring-primary/40";
