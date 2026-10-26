import { useCreateProfile } from "@/hooks/useQueries";
import { normalizeInstagram, parseRupees } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AtSign, GraduationCap, Hash, Sparkles, User } from "lucide-react";
import { type FormEvent, useState } from "react";

const DEFAULT_BALANCE = "10000";

const QUICK_BALANCES = [
  { label: "Broke era", value: "500" },
  { label: "Default", value: "10000" },
  { label: "Ambani mode", value: "100000" },
];

export function OnboardingPage() {
  const createProfile = useCreateProfile();

  const [fullName, setFullName] = useState("");
  const [classSection, setClassSection] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [instagramId, setInstagramId] = useState("");
  const [startingBalance, setStartingBalance] = useState(DEFAULT_BALANCE);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    fullName.trim().length > 0 &&
    classSection.trim().length > 0 &&
    rollNumber.trim().length > 0 &&
    instagramId.trim().length > 0 &&
    parseRupees(startingBalance) !== null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const roll = Number.parseInt(rollNumber.replace(/[^0-9]/g, ""), 10);
    const balance = parseRupees(startingBalance);

    if (!fullName.trim() || !classSection.trim()) {
      setError("Name and class are required, bestie.");
      return;
    }
    if (Number.isNaN(roll)) {
      setError("Roll number must be a number.");
      return;
    }
    if (!instagramId.trim()) {
      setError("Drop your Instagram handle so friends can find you.");
      return;
    }
    if (balance === null) {
      setError("Starting balance must be a positive number.");
      return;
    }

    createProfile.mutate(
      {
        input: {
          fullName: fullName.trim(),
          classSection: classSection.trim(),
          rollNumber: BigInt(roll),
          instagramId: normalizeInstagram(instagramId),
        },
        startingBalance: balance,
      },
      {
        onError: () =>
          setError("Could not save your profile. Give it another shot."),
      },
    );
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="orb -left-20 top-0 h-72 w-72 bg-primary/40 animate-float-slow" />
        <div className="orb -right-16 bottom-10 h-80 w-80 bg-accent/30 animate-float-slow" />
      </div>

      <div className="glass-strong relative z-10 w-full max-w-lg rounded-3xl p-6 shadow-glass animate-pop-in sm:p-8">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-gradient-primary text-2xl shadow-pop">
            💸
          </span>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            Welcome to Neon Vault
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Set up your fake-money identity. Zero real rupees involved.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Field
            id="onboarding.full_name_input"
            label="Full Name"
            icon={<User className="h-4 w-4" />}
          >
            <input
              id="fullName"
              data-ocid="onboarding.full_name_input"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Aarav Sharma"
              autoComplete="name"
              className={inputClass}
            />
          </Field>

          <Field
            id="onboarding.class_section_input"
            label="Class & Section"
            icon={<GraduationCap className="h-4 w-4" />}
          >
            <input
              id="classSection"
              data-ocid="onboarding.class_section_input"
              type="text"
              value={classSection}
              onChange={(e) => setClassSection(e.target.value)}
              placeholder="e.g. 12-B"
              className={inputClass}
            />
          </Field>

          <Field
            id="onboarding.roll_number_input"
            label="Roll Number"
            icon={<Hash className="h-4 w-4" />}
          >
            <input
              id="rollNumber"
              data-ocid="onboarding.roll_number_input"
              type="text"
              inputMode="numeric"
              value={rollNumber}
              onChange={(e) =>
                setRollNumber(e.target.value.replace(/[^0-9]/g, ""))
              }
              placeholder="e.g. 27"
              className={inputClass}
            />
          </Field>

          <Field
            id="onboarding.instagram_input"
            label="Instagram ID"
            icon={<AtSign className="h-4 w-4" />}
          >
            <input
              id="instagramId"
              data-ocid="onboarding.instagram_input"
              type="text"
              value={instagramId}
              onChange={(e) => setInstagramId(e.target.value)}
              placeholder="@yourhandle"
              className={inputClass}
            />
          </Field>

          <div>
            <label
              htmlFor="startingBalance"
              className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Starting Fake Balance
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-display font-bold text-accent">
                ₹
              </span>
              <input
                id="startingBalance"
                data-ocid="onboarding.starting_balance_input"
                type="text"
                inputMode="numeric"
                value={startingBalance}
                onChange={(e) =>
                  setStartingBalance(e.target.value.replace(/[^0-9]/g, ""))
                }
                placeholder="10000"
                className={cn(inputClass, "pl-8 font-mono")}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {QUICK_BALANCES.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  data-ocid={`onboarding.balance_preset.${preset.value}`}
                  onClick={() => setStartingBalance(preset.value)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-semibold transition-pop",
                    startingBalance === preset.value
                      ? "border-accent bg-accent/20 text-accent"
                      : "border-border text-muted-foreground hover:border-accent/60 hover:text-foreground",
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p
              role="alert"
              data-ocid="onboarding.error_state"
              className="rounded-2xl border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            data-ocid="onboarding.submit_button"
            disabled={!canSubmit || createProfile.isPending}
            className="w-full rounded-full bg-gradient-primary px-6 py-3.5 font-display text-base font-bold text-primary-foreground shadow-pop transition-pop hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createProfile.isPending ? "Setting up…" : "Enter the Vault 🚀"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-2xl border border-input bg-background/60 px-3.5 py-3 text-sm text-foreground outline-none transition-smooth placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/40";

function Field({
  id,
  label,
  icon,
  children,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
      >
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}
