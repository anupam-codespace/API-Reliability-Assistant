import React, { useState, useEffect } from 'react';

interface InitialAppLoaderProps {
  onComplete: () => void;
  durationMs?: number;
}

// 8-row dot matrix definition matching the exact retro pixel font from the reference image
// Row 0-1: Ascender (l, d, dot of i)
// Row 2-5: x-height (o, a, d-bowl, i-stem, n, g-bowl, baseline)
// Row 6-7: Descender (g)
const PIXEL_CHAR_MAP: Record<string, number[][]> = {
  l: [
    [1],
    [1],
    [1],
    [1],
    [1],
    [1],
    [0],
    [0],
  ],
  o: [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 1, 1, 0],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  a: [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 1],
    [0, 1, 1, 1],
    [1, 0, 0, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  d: [
    [0, 0, 0, 1],
    [0, 0, 0, 1],
    [0, 1, 1, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [0, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  i: [
    [1],
    [0],
    [1],
    [1],
    [1],
    [1],
    [0],
    [0],
  ],
  n: [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [1, 1, 1, 0],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  g: [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 1, 1, 1],
    [1, 0, 0, 1],
    [0, 1, 1, 1],
    [0, 0, 0, 1],
    [1, 0, 0, 1],
    [0, 1, 1, 0],
  ],
  '.': [
    [0],
    [0],
    [0],
    [0],
    [0],
    [1],
    [0],
    [0],
  ],
};

export const InitialAppLoader: React.FC<InitialAppLoaderProps> = ({
  onComplete,
  durationMs = 6500,
}) => {
  const [progress, setProgress] = useState(0);
  const [dotCount, setDotCount] = useState(1);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // SVG grid sizing configuration
  const PIXEL_SIZE = 3.6;
  const PIXEL_GAP = 1.2;
  const STEP = PIXEL_SIZE + PIXEL_GAP; // 4.8 units per cell

  // Progress Bar dimensions
  const INNER_COLS = 30;
  const TOTAL_BAR_COLS = INNER_COLS + 2; // 32 columns (left cap + 30 inner + right cap)
  const TOTAL_BAR_ROWS = 6; // 1 top border, 4 inner cells, 1 bottom border

  // Calculate filled inner columns based on progress
  const filledCols = Math.min(INNER_COLS, Math.floor((progress / 100) * INNER_COLS));

  // Progress animation over the 5-8 second period (default 6.5s)
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / (durationMs - 650)) * 100);
      setProgress(pct);

      if (elapsed >= durationMs) {
        clearInterval(interval);
      }
    }, 30);

    // Ellipsis animation (cycling 1, 2, 3 dots every 400ms)
    const dotInterval = setInterval(() => {
      setDotCount((prev) => (prev % 3) + 1);
    }, 400);

    // Smooth fade out transition before unmounting
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, durationMs - 750);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, durationMs);

    return () => {
      clearInterval(interval);
      clearInterval(dotInterval);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [durationMs, onComplete]);

  // Construct text tokens: 'loading' + animated dots
  const letters = ['l', 'o', 'a', 'd', 'i', 'n', 'g'];
  const dots = Array.from({ length: dotCount }, () => '.');
  const tokensToRender = [...letters, ...dots];

  // Pre-calculate positions of all active pixels in text
  let cursorX = 2; // Starting horizontal offset
  const textPixels: { x: number; y: number; key: string }[] = [];

  tokensToRender.forEach((char, charIdx) => {
    const matrix = PIXEL_CHAR_MAP[char] || PIXEL_CHAR_MAP['.'];
    const charCols = matrix[0]?.length || 1;

    for (let colIdx = 0; colIdx < charCols; colIdx++) {
      for (let rowIdx = 0; rowIdx < matrix.length; rowIdx++) {
        if (matrix[rowIdx][colIdx] === 1) {
          textPixels.push({
            x: cursorX + colIdx * STEP,
            y: 4 + rowIdx * STEP,
            key: `char-${charIdx}-${colIdx}-${rowIdx}`,
          });
        }
      }
    }
    // Advance cursor: character width + letter spacing (dots have tighter spacing)
    const letterGap = char === '.' ? 1.0 * STEP : 1.3 * STEP;
    cursorX += charCols * STEP + letterGap;
  });

  // Progress Bar vertical offset in SVG
  const BAR_START_Y = 48;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black text-[#33FF33] select-none transition-opacity duration-700 ease-in-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Subtle CRT scanline background pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.45) 50%)',
          backgroundSize: '100% 4px',
        }}
      />

      {/* Responsive centered loader container that adapts gracefully to any device screen size */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 w-[200px] sm:w-[240px] md:w-[270px] max-w-[75vw]">
        <svg
          viewBox="0 0 162 82"
          className="w-full h-auto overflow-visible filter drop-shadow-[0_0_6px_rgba(51,255,51,0.85)]"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          {/* 1. Render "loading..." pixel text */}
          <g>
            {textPixels.map((p) => (
              <rect
                key={p.key}
                x={p.x}
                y={p.y}
                width={PIXEL_SIZE}
                height={PIXEL_SIZE}
                rx={0.4}
                fill="#33FF33"
              />
            ))}
          </g>

          {/* 2. Render Pixel Progress Bar */}
          <g transform={`translate(2, ${BAR_START_Y})`}>
            {Array.from({ length: TOTAL_BAR_COLS }).map((_, colIdx) => {
              const isLeftCap = colIdx === 0;
              const isRightCap = colIdx === TOTAL_BAR_COLS - 1;
              const innerColIndex = colIdx - 1;
              const isInnerFilled = innerColIndex >= 0 && innerColIndex < filledCols;

              return Array.from({ length: TOTAL_BAR_ROWS }).map((__, rowIdx) => {
                const isTopBorder = rowIdx === 0;
                const isBottomBorder = rowIdx === TOTAL_BAR_ROWS - 1;

                let isPixelOn = false;

                if (isLeftCap || isRightCap) {
                  // Left and right rounded end-caps (rows 1..4)
                  isPixelOn = !isTopBorder && !isBottomBorder;
                } else if (isTopBorder || isBottomBorder) {
                  // Outer continuous top & bottom pixel frame
                  isPixelOn = true;
                } else {
                  // Inner fillable cells
                  isPixelOn = isInnerFilled;
                }

                if (!isPixelOn) return null;

                return (
                  <rect
                    key={`bar-${colIdx}-${rowIdx}`}
                    x={colIdx * STEP}
                    y={rowIdx * STEP}
                    width={PIXEL_SIZE}
                    height={PIXEL_SIZE}
                    rx={0.4}
                    fill="#33FF33"
                  />
                );
              });
            })}
          </g>
        </svg>
      </div>
    </div>
  );
};
