"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import deployedContracts from "~~/contracts/deployedContracts";
import { CHAIN_ID_SEPOLIA } from "~~/utils/scaffold-stark";
import { CURVES, CURVES_WITH_DESC, CurveComparisonDial } from "../shared";
const FACTORY_ADDRESS = deployedContracts.sepolia?.Factory?.address || "";
const REGISTRY_ADDRESS = deployedContracts.sepolia?.Registry?.address || "";

// Core component addresses from deployedContracts
const CONTRACTS = [
  { name: "Factory", address: FACTORY_ADDRESS, desc: "Deploys schedules" },
  { name: "Registry", address: REGISTRY_ADDRESS, desc: "Version registry" },
];

// Curve definitions with detailed descriptions (uses CURVES from shared/CurveSelector.tsx)
const CURVE_INFO = [
  {
    key: "linear",
    label: "Linear",
    desc: "Constant release rate over time",
    formula: "release = total × (elapsed / duration)",
  },
  {
    key: "cliff",
    label: "Cliff + Linear",
    desc: "Delay then constant release",
    formula:
      "release after cliff = total × (elapsed - cliff) / (duration - cliff)",
  },
  {
    key: "expdecay",
    label: "Exponential Decay",
    desc: "Fast start, slowing over time",
    formula: "release = total × e^(-k × epoch)",
  },
];

export function InfoSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-up">
      <ContractsCard />
      <CurvesCard />
      <HowItWorksCard />
    </div>
  );
}

function ContractsCard() {
  return (
    <div className="card-instrument p-6">
      <div className="flex items-center gap-3 mb-6">
        <IconBox icon={<ContractIcon />} color="primary" />
        <h3 className="font-display font-bold">Contracts</h3>
      </div>
      <div className="space-y-4">
        {CONTRACTS.map((c) =>
          c.address ? (
            <InfoRow
              key={c.name}
              label={c.name}
              value={c.address}
              desc={c.desc}
              copyable
            />
          ) : null,
        )}
        <InfoRow label="Network" value="Sepolia Testnet" />
        <InfoRow
          label="Chain ID"
          value={`0x${CHAIN_ID_SEPOLIA.toString(16)}`}
        />
      </div>
    </div>
  );
}

function CurvesCard() {
  const [selectedCurve, setSelectedCurve] = useState<string>("linear");
  return (
    <div className="card-instrument p-6">
      <div className="flex items-center gap-3 mb-4">
        <IconBox icon={<ChartIcon />} color="secondary" />
        <h3 className="font-display font-bold">Release Curves</h3>
      </div>
      {/* Curve visualization */}
      <div className="mb-4">
        <CurveComparisonDial selectedCurve={selectedCurve} />
      </div>
      {/* Curve selector */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {CURVES_WITH_DESC.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setSelectedCurve(c.key)}
            className={`p-2 flex-col gap-1 border-2 rounded-lg transition-all ${selectedCurve === c.key ? "border-secondary bg-secondary/5" : "border-base-300 bg-base-300/20 hover:border-base-300/50"}`}
          >
            <span
              className="w-2 h-2 rounded-full mx-auto"
              style={{ backgroundColor: c.hex }}
            />
            <span className="font-mono text-[10px]">{c.label}</span>
          </button>
        ))}
      </div>
      {/* Curve details */}
      <div className="space-y-3">
        {CURVE_INFO.map((c) => (
          <CurveItem key={c.key} curve={c} />
        ))}
      </div>
    </div>
  );
}
function CurveItem({ curve }: { curve: (typeof CURVE_INFO)[0] }) {
  const color = CURVES.find((c) => c.key === curve.key)?.hex || "#6366f1";
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-base-300/50 border border-base-300 flex items-center justify-center shrink-0">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display font-semibold text-sm">{curve.label}</p>
        <p className="text-xs text-base-content/50 font-mono mt-0.5">
          {curve.desc}
        </p>
        <p className="text-[10px] font-mono text-base-content/30 mt-1 truncate">
          {curve.formula}
        </p>
      </div>
    </div>
  );
}

function HowItWorksCard() {
  const steps = [
    {
      num: "01",
      title: "Approve",
      desc: "Grant the factory permission to transfer tokens on your behalf",
    },
    {
      num: "02",
      title: "Configure",
      desc: "Set recipient, amount, duration, and release curve for your schedule",
    },
    {
      num: "03",
      title: "Deploy",
      desc: "Deploy the schedule contract to create the vesting arrangement",
    },
    {
      num: "04",
      title: "Claim",
      desc: "Recipient claims available tokens as the schedule progresses",
    },
  ];

  return (
    <div className="card-instrument p-6 md:col-span-2">
      <div className="flex items-center gap-3 mb-6">
        <IconBox icon={<InfoIcon />} color="accent" />
        <h3 className="font-display font-bold">How ChronoPlan Works</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {steps.map((step) => (
          <div key={step.num} className="text-center">
            <span className="text-xs font-mono text-primary/60">
              {step.num}
            </span>
            <p className="font-display font-bold text-sm mt-1">{step.title}</p>
            <p className="text-xs text-base-content/50 font-mono mt-2 leading-relaxed">
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Reusable components
function InfoRow({
  label,
  value,
  desc,
  copyable,
}: {
  label: string;
  value: string;
  desc?: string;
  copyable?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-mono text-base-content/40 uppercase tracking-wider">
          {label}
        </span>
        {desc && (
          <span className="text-[10px] font-mono text-base-content/30">
            {desc}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <span
          className="text-xs font-mono text-base-content truncate max-w-[140px]"
          title={value}
        >
          {value.slice(0, 6)}...{value.slice(-4)}
        </span>
        {copyable && <CopyButton value={value} />}
      </div>
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  return (
    <button
      className="btn btn-ghost btn-xs btn-square"
      onClick={() => {
        navigator.clipboard.writeText(value);
        toast.success("Copied!");
      }}
    >
      <CopyIcon />
    </button>
  );
}

function IconBox({
  icon,
  color,
}: {
  icon: React.ReactNode;
  color: "primary" | "secondary" | "accent";
}) {
  const colorMap = {
    primary: "bg-primary/10 border-primary/20 text-primary",
    secondary: "bg-secondary/10 border-secondary/20 text-secondary",
    accent: "bg-accent/10 border-accent/20 text-accent",
  };
  return (
    <div
      className={`w-10 h-10 rounded-lg border flex items-center justify-center ${colorMap[color]}`}
    >
      {icon}
    </div>
  );
}

// SVG Icons
function ContractIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
      />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-3 w-3"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}
