export default function Stepper({ label, value, onMinus, onPlus, onTap, emphasis }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="label">{label}</div>
      <div className="grid grid-cols-[1fr_1.2fr_1fr] items-stretch gap-2">
        <button className="btn h-20 text-4xl" onClick={onMinus} aria-label={`${label} minus`}>−</button>
        <button
          className={`tnum flex h-20 items-center justify-center rounded-2xl border-2 text-5xl font-black ${
            value == null ? 'border-dashed border-neutral-400 text-neutral-400' : emphasis
          }`}
          onClick={onTap}
          aria-label={`${label}: ${value ?? 'leer'}`}
        >
          {value ?? '–'}
        </button>
        <button className="btn h-20 text-4xl" onClick={onPlus} aria-label={`${label} plus`}>+</button>
      </div>
    </div>
  );
}
