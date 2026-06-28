import { LayoutGrid, Table as TableIcon } from "lucide-react";

export type DeviceView = "table" | "grid";

export function ViewToggle({
  value,
  onChange,
}: {
  value: DeviceView;
  onChange: (view: DeviceView) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-input p-0.5">
      <ToggleButton
        active={value === "table"}
        onClick={() => onChange("table")}
        label="Table view"
      >
        <TableIcon className="size-4" />
      </ToggleButton>
      <ToggleButton
        active={value === "grid"}
        onClick={() => onChange("grid")}
        label="Grid view"
      >
        <LayoutGrid className="size-4" />
      </ToggleButton>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`grid size-7 place-items-center rounded transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-zinc-400 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
