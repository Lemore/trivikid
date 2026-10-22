// Decorative row of scattered, slightly rotated "?" tiles (listed right to left).
const tiles = [
  { color: "bg-block-red", rotate: "rotate-[10deg]", offset: "translate-y-1" },
  { color: "bg-block-green", rotate: "rotate-[8deg]", offset: "translate-y-4" },
  { color: "bg-block-blue", rotate: "rotate-[18deg]", offset: "-translate-y-1" },
  { color: "bg-block-yellow", rotate: "rotate-[4deg]", offset: "translate-y-4" },
  { color: "bg-block-purple", rotate: "-rotate-[16deg]", offset: "-translate-y-1" },
  { color: "bg-block-pink", rotate: "rotate-[12deg]", offset: "translate-y-5" },
];

export function QuestionTiles() {
  return (
    <div
      aria-hidden="true"
      className="mt-auto flex items-start justify-around px-2 pt-10 pb-12"
    >
      {tiles.map((tile, i) => (
        <span
          key={i}
          className={`flex h-12 w-9 items-center justify-center rounded-tile text-xl font-extrabold text-white shadow-[0_4px_0_rgba(0,0,0,0.22)] ${tile.color} ${tile.rotate} ${tile.offset}`}
        >
          ?
        </span>
      ))}
    </div>
  );
}
