import React, { useEffect, useRef, useState } from 'react';

interface GameState {
    clicks: number;
    isExploded: boolean;
    radius: number;
}

const ClickGame: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<GameState>({
        clicks: 0,
        isExploded: false,
        radius: 50,
    });

    const handleClick = () => {
        if (gameState.isExploded) return;

        setGameState(prev => ({
            ...prev,
            clicks: prev.clicks + 1,
            radius: prev.radius + 2,
            isExploded: prev.clicks >= 30,
        }));
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // キャンバスをクリア
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 中心座標を計算
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        if (gameState.isExploded) {
            // 爆発エフェクト
            const gradient = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, gameState.radius * 2
            );
            gradient.addColorStop(0, 'yellow');
            gradient.addColorStop(0.5, 'orange');
            gradient.addColorStop(1, 'red');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, gameState.radius * 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // 核の描画
            const gradient = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, gameState.radius
            );
            gradient.addColorStop(0, '#ff4444');
            gradient.addColorStop(0.7, '#ff0000');
            gradient.addColorStop(1, '#cc0000');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, gameState.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }, [gameState]);

    return (
        <div className="game-container">
            <canvas
                ref={canvasRef}
                width={400}
                height={400}
                onClick={handleClick}
                style={{ cursor: gameState.isExploded ? 'default' : 'pointer' }}
            />
            <div className="game-info">
                クリック回数: {gameState.clicks}
                {gameState.isExploded && <p>爆発！！！</p>}
            </div>
        </div>
    );
};

export default ClickGame; 