import React, { useMemo } from 'react';

interface Props {
    streak: number; // 1 to 15
    justReset: boolean; // if true, play fall animation
}

const SakuraTree: React.FC<Props> = ({ streak, justReset }) => {
    // SVGツリーの座標系は 0,0 から 200,200 とする
    // 幹と枝を描画
    const renderBranches = () => (
        <g stroke="rgba(30, 20, 15, 0.85)" strokeWidth="2" strokeLinecap="round" fill="none">
            {/* 幹 */}
            <path d="M100 200 Q90 150 100 100" strokeWidth="4" />
            {/* 左の枝 */}
            <path d="M100 130 Q70 110 50 80" />
            <path d="M80 115 Q50 90 30 70" />
            <path d="M60 95 Q40 60 45 40" />
            {/* 右の枝 */}
            <path d="M100 115 Q130 90 150 70" />
            <path d="M115 100 Q150 80 170 85" />
            <path d="M135 85 Q160 60 155 40" />
            {/* 中央上部の枝 */}
            <path d="M100 100 Q90 60 100 20" />
            <path d="M98 60 Q70 40 65 15" />
            <path d="M100 45 Q130 30 135 15" />
        </g>
    );

    // 花びらの配置座標リスト（最大70枚程度）
    const petalPositions = useMemo(() => {
        const pos = [];
        const rnd = (min: number, max: number) => Math.random() * (max - min) + min;

        // 枝の周辺にランダムに配置
        const branchCenters = [
            { x: 50, y: 80 }, { x: 30, y: 70 }, { x: 45, y: 40 },
            { x: 150, y: 70 }, { x: 170, y: 85 }, { x: 155, y: 40 },
            { x: 100, y: 20 }, { x: 65, y: 15 }, { x: 135, y: 15 },
            { x: 100, y: 100 }, { x: 100, y: 60 }, { x: 80, y: 115 }, { x: 115, y: 100 }
        ];

        for (let i = 0; i < 75; i++) {
            const center = branchCenters[Math.floor(Math.random() * branchCenters.length)];
            pos.push({
                id: i,
                x: center.x + rnd(-25, 25),
                y: center.y + rnd(-25, 25),
                scale: rnd(0.5, 1.2),
                rotation: rnd(0, 360),
                delay: rnd(0, 5), // 散るアニメーション用ディレイ
                duration: rnd(4, 8)
            });
        }
        return pos;
    }, []);

    // 1日に咲く花の数（1日目は5輪、14日目で75輪になるように）
    const visibleCount = Math.floor(5 + ((streak - 1) / 14) * 70);
    const petalsToRender = petalPositions.slice(0, justReset ? 75 : visibleCount);

    return (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 w-64 h-64 pointer-events-none opacity-100 transition-opacity duration-1000">
            <svg viewBox="0 0 200 200" className="w-full h-full">
                {renderBranches()}

                {petalsToRender.map(p => {
                    // 花びらのパス（小さめ）
                    const petalPath = "M0 5 C -2 3.5, -2.5 1, 0 0 C 2.5 1, 2 3.5, 0 5";

                    const styleObj: React.CSSProperties & Record<string, any> = {
                        '--startX': `${p.x}px`,
                        '--startY': `${p.y}px`,
                        '--rot': `${p.rotation}deg`,
                        '--s': p.scale,
                    };

                    if (!justReset) {
                        styleObj.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg) scale(${p.scale})`;
                        styleObj.transformOrigin = '0px 0px';
                    } else {
                        styleObj.animation = `flowerFall ${p.duration}s linear ${p.delay}s forwards`;
                    }

                    return (
                        <g
                            key={p.id}
                            style={styleObj}
                            className={justReset ? "" : "animate-fade-in-slow"}
                        >
                            <path
                                d={petalPath}
                                fill="rgba(255, 180, 200, 0.7)"
                                stroke="rgba(255, 255, 255, 0.4)"
                                strokeWidth="0.5"
                            />
                        </g>
                    );
                })}
            </svg>
            {justReset && (
                <style>{`
          @keyframes flowerFall {
            0% { transform: translate(var(--startX), var(--startY)) rotate(var(--rot)) scale(var(--s)); opacity: 1; }
            100% { transform: translate(calc(var(--startX) + 20px), 250px) rotate(calc(var(--rot) + 180deg)) scale(var(--s)); opacity: 0; }
          }
        `}</style>
            )}
        </div>
    );
};

export default SakuraTree;
