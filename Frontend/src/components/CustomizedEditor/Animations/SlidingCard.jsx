  import React from 'react';

/**
 * Lottie JSON specification provided by user:
 * - Comp: 1920x1080 @ 30fps (210 frames = 7s)
 * - Layer: Shape Layer 1
 * - Shape: Rectangle 608x388, Fill: [1, 0, 0, 1] (Red)
 * - Motion: [960, 540] -> [2196, 248] over 123 frames (4.1s)
 */
export const lottieData = {
  "v": "5.12.2",
  "fr": 30,
  "ip": 0,
  "op": 210,
  "w": 1920,
  "h": 1080,
  "nm": "Comp 1",
  "ddd": 0,
  "assets": [],
  "layers": [
    {
      "ddd": 0,
      "ind": 1,
      "ty": 4,
      "nm": "Shape Layer 1",
      "sr": 1,
      "ks": {
        "o": { "a": 0, "k": 100, "ix": 11 },
        "r": { "a": 0, "k": 0, "ix": 10 },
        "p": {
          "a": 1,
          "k": [
            {
              "i": { "x": 0.833, "y": 0.833 },
              "o": { "x": 0.167, "y": 0.167 },
              "t": 0,
              "s": [960, 540, 0],
              "to": [0, 0, 0],
              "ti": [0, 0, 0]
            },
            { "t": 123, "s": [2196, 248, 0] }
          ],
          "ix": 2,
          "l": 2
        },
        "a": { "a": 0, "k": [0, 0, 0], "ix": 1, "l": 2 },
        "s": { "a": 0, "k": [100, 100, 100], "ix": 6, "l": 2 }
      },
      "ao": 0,
      "shapes": [
        {
          "ty": "gr",
          "it": [
            {
              "ty": "rc",
              "d": 1,
              "s": { "a": 0, "k": [608, 388], "ix": 2 },
              "p": { "a": 0, "k": [0, 0], "ix": 3 },
              "r": { "a": 0, "k": 0, "ix": 4 },
              "nm": "Rectangle Path 1",
              "mn": "ADBE Vector Shape - Rect",
              "hd": false
            },
            {
              "ty": "fl",
              "c": { "a": 0, "k": [1, 0, 0, 1], "ix": 4 },
              "o": { "a": 0, "k": 100, "ix": 5 },
              "r": 1,
              "bm": 0,
              "nm": "Fill 1",
              "mn": "ADBE Vector Graphic - Fill",
              "hd": false
            },
            {
              "ty": "tr",
              "p": { "a": 0, "k": [-528, 158], "ix": 2 },
              "a": { "a": 0, "k": [0, 0], "ix": 1 },
              "s": { "a": 0, "k": [100, 100], "ix": 3 },
              "r": { "a": 0, "k": 0, "ix": 6 },
              "o": { "a": 0, "k": 100, "ix": 7 },
              "sk": { "a": 0, "k": 0, "ix": 4 },
              "sa": { "a": 0, "k": 0, "ix": 5 },
              "nm": "Transform"
            }
          ],
          "nm": "Rectangle 1",
          "np": 3,
          "cix": 2,
          "bm": 0,
          "ix": 1,
          "mn": "ADBE Vector Group",
          "hd": false
        }
      ],
      "ip": 0,
      "op": 210,
      "st": 0,
      "ct": 1,
      "bm": 0
    }
  ],
  "markers": [],
  "props": {}
};

const SlidingCard = ({ count = 1 }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      <svg
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full absolute inset-0 pointer-events-none"
      >
        <defs>
          {/* Subtle vibrant gradient for premium visual appeal while retaining pure red core */}
          <linearGradient id="slidingCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff2a2a" />
            <stop offset="100%" stopColor="#d90429" />
          </linearGradient>
          <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="18" stdDeviation="24" floodColor="#d90429" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Primary Lottie Shape Layer (Exact Motion Track) */}
        <g className="sliding-card-main-layer">
          <g transform="translate(-528, 158)">
            <rect
              x="-304"
              y="-194"
              width="608"
              height="388"
              rx="24"
              fill="url(#slidingCardGrad)"
              filter="url(#cardShadow)"
            />
            {/* Subtle inner gloss highlight */}
            <rect
              x="-294"
              y="-184"
              width="588"
              height="160"
              rx="16"
              fill="white"
              opacity="0.08"
            />
          </g>
        </g>

        {/* Ambient Secondary Accents if count > 1 */}
        {count > 1 && (
          <g className="sliding-card-accent-layer" opacity="0.45">
            <g transform="translate(-528, 158) scale(0.65)">
              <rect
                x="-304"
                y="-194"
                width="608"
                height="388"
                rx="20"
                fill="url(#slidingCardGrad)"
                filter="url(#cardShadow)"
              />
            </g>
          </g>
        )}
      </svg>

      <style>{`
        @keyframes slidingCardMotion {
          0% {
            transform: translate(960px, 540px);
            opacity: 0;
          }
          6% {
            opacity: 1;
          }
          58.57% {
            transform: translate(2196px, 248px);
            opacity: 1;
          }
          65% {
            opacity: 0;
          }
          100% {
            transform: translate(2196px, 248px);
            opacity: 0;
          }
        }

        @keyframes slidingCardAccentMotion {
          0% {
            transform: translate(750px, 680px);
            opacity: 0;
          }
          10% {
            opacity: 0.45;
          }
          62% {
            transform: translate(2050px, 360px);
            opacity: 0.45;
          }
          70% {
            opacity: 0;
          }
          100% {
            transform: translate(2050px, 360px);
            opacity: 0;
          }
        }

        .sliding-card-main-layer {
          transform-origin: 0 0;
          animation: slidingCardMotion 7s cubic-bezier(0.167, 0.167, 0.833, 0.833) infinite;
          will-change: transform, opacity;
        }

        .sliding-card-accent-layer {
          transform-origin: 0 0;
          animation: slidingCardAccentMotion 7s cubic-bezier(0.167, 0.167, 0.833, 0.833) 1.2s infinite;
          will-change: transform, opacity;
        }
      `}</style>
    </div>
  );
};

export default SlidingCard;
