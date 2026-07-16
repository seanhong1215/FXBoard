"use client";

import RateCard, { RateCardData } from "./RateCard";

type RateGridProps = {
  base: string;
  cards: RateCardData[];
  selected?: string;
  onSelect?: (code: string) => void;
};

export default function RateGrid({
  base,
  cards,
  selected,
  onSelect,
}: RateGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((c) => (
        <RateCard
          key={c.code}
          base={base}
          selected={selected === c.code}
          onSelect={onSelect}
          {...c}
        />
      ))}
    </div>
  );
}
