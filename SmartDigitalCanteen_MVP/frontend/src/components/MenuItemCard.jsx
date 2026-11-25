import React, { useState } from "react";
import { motion } from "framer-motion";

export default function MenuItemCard({
  item,
  cartQty = 0,
  onAdd,
  onInc,
  onDec,
  isFavorite = false,
  onToggleFavorite,
}) {
  const [imgSrc, setImgSrc] = useState(item.imageUrl || "/images/placeholder.svg");
  const stockVal = Number(item.stock ?? -1);
  const isUnlimited = stockVal < 0;
  const isOut = Boolean(item.isOutOfStock) || (!isUnlimited && stockVal === 0);
  const lowStock = !isOut && !isUnlimited && stockVal <= 5;
  const atStockLimit = !isUnlimited && cartQty >= stockVal;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-surface-card transition-all ${
        isOut
          ? "border-line opacity-75"
          : "border-line hover:border-crimson-500/60 hover:shadow-card"
      }`}
    >
      {/* Visual container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-elevated p-4 flex items-center justify-center">
        <img
          src={imgSrc}
          alt={item.name}
          onError={() => setImgSrc("/images/placeholder.svg")}
          className={`h-full w-full object-contain transition-transform duration-300 ${
            isOut ? "grayscale" : "group-hover:scale-105"
          }`}
          loading="lazy"
        />

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
          {item.isSpecial && (
            <span className="rounded-full bg-crimson-600 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm">
              Chef Special
            </span>
          )}
          <span className="rounded-full border border-line bg-surface-card/90 px-2.5 py-0.5 text-[11px] font-semibold text-ink-secondary backdrop-blur-sm">
            {item.category || "Menu"}
          </span>
        </div>

        {/* Favorite button */}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={() => onToggleFavorite(item)}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? `Remove ${item.name} from favorites` : `Save ${item.name} to favorites`}
            className={`absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-sm transition ${
              isFavorite
                ? "border-crimson-600 bg-crimson-600 text-white shadow-sm"
                : "border-line bg-surface-card/90 text-ink-muted hover:border-crimson-500 hover:text-crimson-600"
            }`}
          >
            <span aria-hidden="true" className="text-sm leading-none">
              {isFavorite ? "♥" : "♡"}
            </span>
          </button>
        )}

        {/* Sold out overlay */}
        {isOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-[1px]">
            <span className="rounded-full bg-crimson-900 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white border border-crimson-400/40">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-ink-primary leading-snug line-clamp-1">
            {item.name}
          </h3>
          <span className="shrink-0 font-mono text-base font-extrabold text-crimson-600 tabular-nums">
            ৳{Number(item.price || 0).toFixed(0)}
          </span>
        </div>

        <p className="mt-1.5 text-xs leading-relaxed text-ink-muted line-clamp-2 flex-1">
          {item.description || "Prepared fresh in our campus kitchen."}
        </p>

        {/* Meta strip */}
        <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-ink-muted border-t border-line pt-2.5">
          <span className="inline-flex items-center gap-1 font-mono">
            <span aria-hidden="true">⏱</span> ~{item.prepTimeMinutes || 5} min
          </span>
          {isOut ? (
            <span className="font-semibold text-crimson-600">Unavailable</span>
          ) : isUnlimited ? (
            <span className="font-semibold text-emerald-600">Made to order</span>
          ) : lowStock ? (
            <span className="font-semibold text-amber-600">Only {stockVal} left</span>
          ) : (
            <span>In stock ({stockVal})</span>
          )}
        </div>

        {/* Action controls */}
        <div className="mt-3">
          {isOut ? (
            <button
              type="button"
              disabled
              className="w-full rounded-xl border border-line bg-surface-subtle py-2.5 text-xs font-bold text-ink-muted cursor-not-allowed"
            >
              Currently Unavailable
            </button>
          ) : cartQty > 0 ? (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-crimson-600/40 bg-crimson-600/10 p-1">
              <button
                type="button"
                onClick={() => onDec(item._id)}
                aria-label={`Decrease quantity of ${item.name}`}
                className="flex h-9 w-10 items-center justify-center rounded-lg bg-surface-card text-base font-bold text-ink-primary shadow-sm hover:bg-crimson-600 hover:text-white transition"
              >
                −
              </button>
              <span className="font-mono text-sm font-bold text-crimson-700 dark:text-crimson-300 tabular-nums">
                {cartQty} in tray
              </span>
              <button
                type="button"
                onClick={() => onInc(item._id)}
                disabled={atStockLimit}
                aria-label={`Increase quantity of ${item.name}`}
                className="flex h-9 w-10 items-center justify-center rounded-lg bg-crimson-600 text-base font-bold text-white shadow-sm hover:bg-crimson-700 disabled:opacity-40 transition"
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onAdd(item)}
              className="w-full rounded-xl bg-crimson-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-crimson-700 active:scale-[0.99] transition"
            >
              Add to Tray
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
