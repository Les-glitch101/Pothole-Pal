/** Segmented progress bar used across the report flow (4 short bars, bars fill as you advance). */
function PageIndicator({ current, total = 4 }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            i < current ? "bg-primary" : "bg-line"
          }`}
        />
      ))}
    </div>
  );
}

export default PageIndicator;
