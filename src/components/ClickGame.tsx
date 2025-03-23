import React, { useEffect, useRef, useState } from 'react';

type GameScene = 'power' | 'launch' | 'atmosphere';

interface GameState {
    scene: GameScene;
    power: number;
    rocketY: number;
    isExploded: boolean;
    particles: Particle[];
    stars: Star[];
    clouds: Cloud[];
    isFullPower: boolean;
    fullPowerTime: number;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
}

interface Star {
    x: number;
    y: number;
    size: number;
    brightness: number;
}

interface Cloud {
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;
}

const ClickGame: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [gameState, setGameState] = useState<GameState>({
        scene: 'power',
        power: 0,
        rocketY: 0,
        isExploded: false,
        particles: [],
        stars: Array.from({ length: 50 }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            size: Math.random() * 2 + 1,
            brightness: Math.random()
        })),
        clouds: Array.from({ length: 10 }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * (window.innerHeight / 2),
            width: Math.random() * 100 + 50,
            height: Math.random() * 40 + 20,
            speed: Math.random() * 2 + 1
        })),
        isFullPower: false,
        fullPowerTime: 0
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Canvasのサイズを設定
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();

                switch (gameState.scene) {
                    case 'power':
                        if (!gameState.isFullPower) {
                            setGameState(prev => ({
                                ...prev,
                                power: Math.min(prev.power + 2, 100),
                                isFullPower: prev.power >= 98
                            }));
                        }
                        break;

                    case 'launch':
                        setGameState(prev => ({
                            ...prev,
                            rocketY: prev.rocketY + 10,
                            scene: prev.rocketY >= 300 ? 'atmosphere' : 'launch'
                        }));
                        break;

                    case 'atmosphere':
                        setGameState(prev => ({
                            ...prev,
                            rocketY: prev.rocketY + 15,
                            isExploded: prev.rocketY >= window.innerHeight
                        }));
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [gameState.scene, gameState.isFullPower]);

    useEffect(() => {
        if (gameState.isFullPower) {
            const timer = setTimeout(() => {
                setGameState(prev => ({
                    ...prev,
                    scene: 'launch'
                }));
            }, 3000); // 3秒後に発射シーンへ

            return () => clearTimeout(timer);
        }
    }, [gameState.isFullPower]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 背景（夜空）
            ctx.fillStyle = '#111111';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 星の描画
            gameState.stars.forEach(star => {
                ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
                ctx.fillRect(star.x, star.y, star.size, star.size);
            });

            const centerX = canvas.width / 2;
            const baseY = canvas.height - 100;

            // シーンごとの描画
            switch (gameState.scene) {
                case 'power':
                    drawPowerScene(ctx, centerX, baseY);
                    break;
                case 'launch':
                    drawLaunchScene(ctx, centerX, baseY);
                    break;
                case 'atmosphere':
                    drawAtmosphereScene(ctx, centerX);
                    break;
            }

            requestAnimationFrame(animate);
        };

        animate();
    }, [gameState]);

    const drawPowerScene = (ctx: CanvasRenderingContext2D, centerX: number, baseY: number) => {
        // 地面
        ctx.fillStyle = '#4A593D';
        ctx.fillRect(0, baseY, ctx.canvas.width, ctx.canvas.height - baseY);

        // 燃料メーター（縦型）のサイズと位置を調整
        const meterHeight = ctx.canvas.height * 0.5; // 高さを50%に調整
        const meterWidth = 40;
        const meterX = 80;  // 左端からの距離を増加
        const meterY = (ctx.canvas.height - meterHeight) / 2;  // 縦方向の中央揃え

        // メーターの外枠
        ctx.fillStyle = '#333333';
        ctx.fillRect(meterX - 2, meterY - 2, meterWidth + 4, meterHeight + 4);

        // メーターの背景（目盛り）
        ctx.fillStyle = '#222222';
        ctx.fillRect(meterX, meterY, meterWidth, meterHeight);

        // 目盛りの描画
        for (let i = 0; i <= 10; i++) {
            const y = meterY + (meterHeight * (1 - i / 10));
            ctx.fillStyle = '#444444';
            ctx.fillRect(meterX - 10, y, 10, 2);

            // 目盛りの数値（位置調整）
            drawPixelText(ctx, `${i * 10}`, meterX - 25, y, 12);
        }

        // 燃料レベル（下から上に向かって満タンになる）
        const fuelHeight = meterHeight * (gameState.power / 100);
        const gradient = ctx.createLinearGradient(0, meterY + meterHeight - fuelHeight, 0, meterY + meterHeight);
        gradient.addColorStop(0, '#FF4400');
        gradient.addColorStop(0.5, '#FF8800');
        gradient.addColorStop(1, '#FFCC00');

        ctx.fillStyle = gradient;
        ctx.fillRect(
            meterX,
            meterY + meterHeight - fuelHeight,
            meterWidth,
            fuelHeight
        );

        // ロケット
        drawRocket(ctx, centerX, baseY - 80);

        // パワー表示テキストを条件分岐
        if (gameState.isFullPower) {
            // フルパワー時の点滅テキスト（画面中央に大きく）
            if (Math.floor(Date.now() / 200) % 2 === 0) {  // 点滅を早く
                drawPixelText(
                    ctx,
                    'FULLY CHARGED!',
                    centerX,
                    ctx.canvas.height * 0.4,  // 画面の上部40%の位置
                    48  // さらに大きく
                );
                drawPixelText(
                    ctx,
                    'PREPARE TO LAUNCH',
                    centerX,
                    ctx.canvas.height * 0.4 + 60,  // その下に
                    32
                );
            }

            // カウントダウン表示（さらに大きく）
            const remainingTime = 3 - Math.floor((Date.now() - gameState.fullPowerTime) / 1000);
            if (remainingTime > 0) {
                drawPixelText(
                    ctx,
                    remainingTime.toString(),
                    centerX,
                    ctx.canvas.height * 0.6,  // 画面の下部60%の位置
                    96  // かなり大きく
                );
            }
        } else {
            // 通常時のテキスト（メーター横）
            drawPixelText(
                ctx,
                `FUEL: ${Math.floor(gameState.power)}%`,
                meterX + meterWidth / 2,
                meterY - 40
            );
            drawPixelText(
                ctx,
                'MASH SPACE!',
                meterX + meterWidth / 2,
                meterY - 70
            );
        }

        // 警告表示（フルパワー時は表示しない）
        if (gameState.power >= 80 && !gameState.isFullPower) {
            if (Math.floor(Date.now() / 500) % 2 === 0) {
                drawPixelText(
                    ctx,
                    'WARNING!',
                    meterX + meterWidth / 2,
                    meterY + meterHeight + 40,
                    20
                );

                ctx.fillStyle = '#FF0000';
                ctx.fillRect(
                    meterX - 10,
                    meterY + meterHeight + 60,
                    meterWidth + 20,
                    4
                );
            }
        }

        // フルパワー時のエフェクト
        if (gameState.isFullPower) {
            // 画面全体を明滅させる
            if (Math.floor(Date.now() / 200) % 2 === 0) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            }

            // エネルギーパーティクル
            for (let i = 0; i < 5; i++) {
                const angle = Date.now() * 0.001 + i * Math.PI * 0.4;
                const x = centerX + Math.cos(angle) * 50;
                const y = baseY - 80 + Math.sin(angle) * 50;

                ctx.fillStyle = '#FFFF00';
                ctx.fillRect(x - 2, y - 2, 4, 4);
            }
        }
    };

    const drawLaunchScene = (ctx: CanvasRenderingContext2D, centerX: number, baseY: number) => {
        // 発射台と地面の描画
        ctx.fillStyle = '#4A593D';
        for (let x = 0; x < ctx.canvas.width; x += 8) {
            const groundHeight = 100 + Math.sin(x * 0.05) * 10;
            ctx.fillRect(x, ctx.canvas.height - groundHeight, 8, groundHeight);
        }

        // ロケット
        drawRocket(ctx, centerX, baseY - 80 - gameState.rocketY);

        // テキスト
        drawPixelText(ctx, `HEIGHT: ${Math.floor(gameState.rocketY)}m`, centerX, 50);
        drawPixelText(ctx, 'KEEP MASHING!', centerX, 90);
    };

    const drawAtmosphereScene = (ctx: CanvasRenderingContext2D, centerX: number) => {
        // 大気圏のグラデーション
        const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
        gradient.addColorStop(0, '#000033');
        gradient.addColorStop(0.3, '#000066');
        gradient.addColorStop(0.6, '#3366CC');
        gradient.addColorStop(0.8, '#66CCFF');
        gradient.addColorStop(1, '#99FFFF');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // ロケット
        const rocketY = ctx.canvas.height - 150 - gameState.rocketY;
        drawRocket(ctx, centerX, rocketY);

        // テキスト
        drawPixelText(ctx, `ALTITUDE: ${Math.floor(gameState.rocketY)}m`, centerX, 50);
        drawPixelText(ctx, 'BREAK THROUGH!', centerX, 90);

        if (gameState.isExploded) {
            drawPixelText(ctx, 'MISSION COMPLETE!', centerX, ctx.canvas.height / 2, 32);
        }
    };

    const drawRocket = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
        // ロケット本体
        ctx.fillStyle = '#E0E0E0';
        ctx.fillRect(x - 16, y, 32, 64);

        // 窓
        ctx.fillStyle = '#66CCFF';
        ctx.fillRect(x - 8, y + 16, 16, 16);

        // 先端
        ctx.fillStyle = '#FF4444';
        ctx.fillRect(x - 12, y - 16, 24, 16);

        // フィン
        ctx.fillStyle = '#CC0000';
        ctx.fillRect(x - 24, y + 48, 8, 16);
        ctx.fillRect(x + 16, y + 48, 8, 16);

        // エンジンの炎
        const flameHeight = 32 + Math.sin(Date.now() * 0.1) * 8;
        for (let i = 0; i < flameHeight; i += 4) {
            const flameWidth = 24 - (i / flameHeight) * 16;
            ctx.fillStyle = i < flameHeight / 2 ? '#FF4400' : '#FF8800';
            ctx.fillRect(
                x - flameWidth / 2,
                y + 64 + i,
                flameWidth,
                4
            );
        }
    };

    const drawPixelText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number = 16) => {
        ctx.font = `${size}px "Press Start 2P"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // テキストの縁取り
        ctx.fillStyle = '#000000';
        for (let i = -2; i <= 2; i++) {
            for (let j = -2; j <= 2; j++) {
                if (i === 0 && j === 0) continue;
                ctx.fillText(text, x + i, y + j);
            }
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(text, x, y);
    };

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: '#000',
            }}
        />
    );
};

export default ClickGame; 