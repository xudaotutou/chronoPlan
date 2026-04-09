"use client";

type RecipientInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export function RecipientInput({ value, onChange }: RecipientInputProps) {
  return (
    <div className="card-instrument p-5 card-hover animate-fade-up delay-100">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-mono text-primary tracking-widest uppercase">
          01
        </span>
        <span className="font-display font-semibold">Recipient</span>
      </div>
      <input
        type="text"
        placeholder="0x…"
        className="input input-bordered w-full font-mono text-sm bg-base-300/30 border-base-300 focus:border-primary"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="text-xs text-base-content/40 mt-2 font-mono">
        Address that receives the scheduled tokens
      </p>
    </div>
  );
}
