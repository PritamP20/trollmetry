'use client';

import { useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { theme } from '@/lib/theme';

interface GameState {
  level: number;
  score: number;
  coins: number;
  lives: number;
  currentQuestion: MathQuestion | null;
  playerX: number;
  playerY: number;
  gameOver: boolean;
  won: boolean;
  isRunning: boolean;
  facingRight: boolean;
}

interface MathQuestion {
  question: string;
  correctMathAnswer: number;
  trollAnswer: number;
  wrongAnswer: number;
  displayQuestion: string;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  isFake?: boolean;
  willMove?: boolean;
  isMoving?: boolean;
  targetX?: number;
  originalX?: number;
  isSpike?: boolean;
  mathOption?: number;
  isCorrect?: boolean;
  disappearing?: boolean;
  alpha?: number;
}

interface Coin {
  x: number;
  y: number;
  collected: boolean;
  pulse: number;
}

const MathDevilGame = ({ onGameEnd }: { onGameEnd: (level: number, score: number, coins: number) => void }) => {
  const { address, isConnected } = useAccount();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  const [gameState, setGameState] = useState<GameState>({
    level: 1,
    score: 0,
    coins: 0,
    lives: 3,
    currentQuestion: null,
    playerX: 60,
    playerY: 0, // Start at top, will be set properly by initLevel
    gameOver: false,
    won: false,
    isRunning: false,
    facingRight: true,
  });

  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [velocityY, setVelocityY] = useState(0);
  const [velocityX, setVelocityX] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [trollMessage, setTrollMessage] = useState<string>('');
  const [runFrame, setRunFrame] = useState(0);
  const [scoredOnCorrectPlatform, setScoredOnCorrectPlatform] = useState(false);

  // Canvas settings
  const [canvasWidth, setCanvasWidth] = useState(480);
  const [canvasHeight, setCanvasHeight] = useState(600);
  const CANVAS_WIDTH = canvasWidth;
  const CANVAS_HEIGHT = canvasHeight;
  const PLAYER_SIZE = 28;
  const GRAVITY = 0.6;
  const JUMP_FORCE = -14;
  const MOVE_SPEED = 5;

  // Adjust canvas size
  useEffect(() => {
    const updateCanvasSize = () => {
      const width = Math.min(window.innerWidth - 32, 520);
      const height = Math.min(window.innerHeight * 0.7, 680);
      setCanvasWidth(width);
      setCanvasHeight(height);
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  const generateMathQuestion = (level: number): MathQuestion => {
    const trollTypes = [
      // PEMDAS troll
      () => {
        const a = Math.floor(Math.random() * 8) + 12;
        const b = Math.floor(Math.random() * 4) + 2;
        const c = Math.floor(Math.random() * 6) + 3;
        const correctAnswer = a - b * c;
        const trollAnswer = (a - b) * c;
        const wrongAnswer = a + b - c;
        return {
          question: `${a} - ${b} × ${c}`,
          correctMathAnswer: correctAnswer,
          trollAnswer: trollAnswer,
          wrongAnswer: wrongAnswer,
          displayQuestion: `${a} - ${b} × ${c} = ?`
        };
      },
      // Division troll
      () => {
        const a = Math.floor(Math.random() * 15) + 15;
        const c = Math.floor(Math.random() * 3) + 2;
        const b = c * (Math.floor(Math.random() * 6) + 3);
        const correctAnswer = a + b / c;
        const trollAnswer = Math.floor((a + b) / c);
        const wrongAnswer = a - b / c;
        return {
          question: `${a} + ${b} ÷ ${c}`,
          correctMathAnswer: correctAnswer,
          trollAnswer: trollAnswer,
          wrongAnswer: Math.floor(wrongAnswer),
          displayQuestion: `${a} + ${b} ÷ ${c} = ?`
        };
      },
    ];

    const questionGenerator = trollTypes[Math.floor(Math.random() * trollTypes.length)];
    return questionGenerator();
  };

  const generatePlatforms = (level: number, question: MathQuestion) => {
    const newPlatforms: Platform[] = [];

    // Ground
    newPlatforms.push({
      x: 0,
      y: CANVAS_HEIGHT - 30,
      width: CANVAS_WIDTH,
      height: 30
    });

    // Starting safe zone
    newPlatforms.push({
      x: 30,
      y: CANVAS_HEIGHT - 100,
      width: 140,
      height: 18
    });

    // First jump platform
    newPlatforms.push({
      x: 180,
      y: CANVAS_HEIGHT - 160,
      width: 100,
      height: 18
    });

    // Math answer platforms (THE TROLL ZONE)
    const mathY = CANVAS_HEIGHT - 260;
    const mathSpacing = (CANVAS_WIDTH - 140) / 3;

    // Troll answer platform (CORRECT for game)
    const trollPlatformX = 50;
    const shouldMove = level > 3 && Math.random() > 0.5;
    newPlatforms.push({
      x: trollPlatformX,
      y: mathY,
      width: 110,
      height: 18,
      mathOption: question.trollAnswer,
      isCorrect: true,
      willMove: shouldMove,
      originalX: trollPlatformX,
      targetX: shouldMove ? trollPlatformX + 120 : undefined,
    });

    // Mathematically correct answer (WRONG for game - fake)
    newPlatforms.push({
      x: 50 + mathSpacing,
      y: mathY - 15,
      width: 110,
      height: 18,
      mathOption: question.correctMathAnswer,
      isCorrect: false,
      isFake: true,
    });

    // Wrong answer platform (also fake)
    newPlatforms.push({
      x: 50 + mathSpacing * 2,
      y: mathY + 15,
      width: 110,
      height: 18,
      mathOption: question.wrongAnswer,
      isCorrect: false,
      isFake: true,
    });

    // Coins placement
    const newCoins: Coin[] = [];

    // Path coins
    newCoins.push({ x: 100, y: CANVAS_HEIGHT - 140, collected: false, pulse: 0 });
    newCoins.push({ x: 230, y: CANVAS_HEIGHT - 200, collected: false, pulse: 0 });

    // Above math platforms
    for (let i = 0; i < 3; i++) {
      newCoins.push({
        x: 90 + mathSpacing * i,
        y: mathY - 60,
        collected: false,
        pulse: i * 20,
      });
    }

    // Random bonus coins
    for (let i = 0; i < Math.min(level, 5); i++) {
      newCoins.push({
        x: 60 + Math.random() * (CANVAS_WIDTH - 120),
        y: 120 + Math.random() * 150,
        collected: false,
        pulse: i * 15,
      });
    }
    setCoins(newCoins);

    // Path after math puzzle
    newPlatforms.push({
      x: CANVAS_WIDTH / 2 - 70,
      y: CANVAS_HEIGHT - 350,
      width: 140,
      height: 18,
    });

    // Intermediate platforms
    if (level > 1) {
      newPlatforms.push({
        x: CANVAS_WIDTH - 280,
        y: CANVAS_HEIGHT - 380,
        width: 90,
        height: 18,
      });

      // Disappearing platform troll
      if (level > 4) {
        newPlatforms.push({
          x: CANVAS_WIDTH / 2 + 100,
          y: CANVAS_HEIGHT - 320,
          width: 80,
          height: 18,
          disappearing: true,
          alpha: 1,
        });
      }
    }

    // Upper path to exit
    newPlatforms.push({
      x: CANVAS_WIDTH - 220,
      y: CANVAS_HEIGHT - 450,
      width: 120,
      height: 18,
    });

    // Fake platform troll (level 3+)
    if (level > 2) {
      newPlatforms.push({
        x: 220,
        y: CANVAS_HEIGHT - 210,
        width: 75,
        height: 18,
        isFake: true,
      });
    }

    // Spikes (strategic placement)
    if (level > 2) {
      newPlatforms.push({
        x: CANVAS_WIDTH / 2 - 25,
        y: CANVAS_HEIGHT - 50,
        width: 50,
        height: 25,
        isSpike: true,
      });
    }

    if (level > 4) {
      newPlatforms.push({
        x: CANVAS_WIDTH - 180,
        y: CANVAS_HEIGHT - 320,
        width: 45,
        height: 25,
        isSpike: true,
      });
    }

    // Exit door
    newPlatforms.push({
      x: CANVAS_WIDTH - 90,
      y: CANVAS_HEIGHT - 540,
      width: 70,
      height: 85,
    });

    setPlatforms(newPlatforms);
  };

  const initLevel = () => {
    const question = generateMathQuestion(gameState.level);
    generatePlatforms(gameState.level, question);
    setGameState(prev => ({
      ...prev,
      currentQuestion: question,
      playerX: 60,
      playerY: CANVAS_HEIGHT - 130,
      gameOver: false,
      lives: prev.lives <= 0 ? 3 : prev.lives, // Reset lives if game over
    }));
    setVelocityY(0);
    setVelocityX(0);
    setIsJumping(false);
    setScoredOnCorrectPlatform(false);
  };

  // Initialize level only after canvas size is set
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (canvasWidth > 0 && canvasHeight > 0 && !isInitialized) {
      initLevel();
      setIsInitialized(true);
    }
  }, [canvasWidth, canvasHeight, isInitialized]);

  // Animation loop for coin pulse and run animation
  useEffect(() => {
    const animationInterval = setInterval(() => {
      setCoins(prev => prev.map(coin => ({
        ...coin,
        pulse: (coin.pulse + 1) % 60,
      })));

      if (Math.abs(velocityX) > 0 && !isJumping) {
        setRunFrame(prev => (prev + 1) % 8);
      }
    }, 100);

    return () => clearInterval(animationInterval);
  }, [velocityX, isJumping]);

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      // Background gradient
      const bgGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      bgGradient.addColorStop(0, theme.bg.primary);
      bgGradient.addColorStop(0.5, theme.bg.secondary);
      bgGradient.addColorStop(1, theme.bg.tertiary);
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw grid pattern (subtle)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      for (let x = 0; x < CANVAS_WIDTH; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }

      // Question area
      if (gameState.currentQuestion) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 10, CANVAS_WIDTH, 70);

        ctx.fillStyle = theme.text.secondary;
        ctx.font = 'bold 14px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('Choose the TROLL answer:', CANVAS_WIDTH / 2, 30);

        ctx.fillStyle = theme.accent.secondary;
        ctx.font = 'bold 28px system-ui';
        ctx.fillText(gameState.currentQuestion.displayQuestion, CANVAS_WIDTH / 2, 62);
      }

      // Draw coins
      coins.forEach(coin => {
        if (!coin.collected) {
          const scale = 1 + Math.sin(coin.pulse / 10) * 0.15;
          const glow = Math.sin(coin.pulse / 10) * 0.3 + 0.7;

          ctx.save();
          ctx.translate(coin.x, coin.y);
          ctx.scale(scale, scale);

          // Glow
          const coinGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 15);
          coinGlow.addColorStop(0, `rgba(251, 191, 36, ${glow})`);
          coinGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
          ctx.fillStyle = coinGlow;
          ctx.beginPath();
          ctx.arc(0, 0, 15, 0, Math.PI * 2);
          ctx.fill();

          // Coin
          ctx.fillStyle = theme.accent.secondary;
          ctx.beginPath();
          ctx.arc(0, 0, 10, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#fde68a';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Symbol
          ctx.fillStyle = '#78350f';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('$', 0, 0);

          ctx.restore();
        }
      });

      // Draw platforms
      platforms.forEach(platform => {
        ctx.save();

        if (platform.isSpike) {
          // Spike
          ctx.fillStyle = theme.accent.danger;
          ctx.shadowColor = theme.accent.danger;
          ctx.shadowBlur = 15;
          ctx.beginPath();
          for (let i = 0; i < platform.width; i += 18) {
            ctx.moveTo(platform.x + i, platform.y + platform.height);
            ctx.lineTo(platform.x + i + 9, platform.y);
            ctx.lineTo(platform.x + i + 18, platform.y + platform.height);
          }
          ctx.fill();
        } else if (platform.mathOption !== undefined) {
          // Math platforms
          const alpha = platform.alpha || 1;

          if (platform.isCorrect) {
            ctx.fillStyle = `rgba(16, 185, 129, ${alpha * 0.3})`; // Green tint
            ctx.strokeStyle = theme.accent.success;
            ctx.shadowColor = theme.accent.success;
            ctx.shadowBlur = 20;
          } else if (platform.isFake) {
            ctx.fillStyle = `rgba(239, 68, 68, ${alpha * 0.25})`; // Red tint
            ctx.strokeStyle = theme.accent.danger;
            ctx.shadowColor = theme.accent.danger;
            ctx.shadowBlur = 10;
          }

          ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
          ctx.lineWidth = 3;
          ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);

          // Number
          ctx.shadowBlur = 0;
          ctx.fillStyle = theme.text.primary;
          ctx.font = 'bold 22px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText(platform.mathOption.toString(), platform.x + platform.width / 2, platform.y - 12);
        } else if (platform.y >= CANVAS_HEIGHT - 100) {
          // Ground and starting platforms
          ctx.fillStyle = theme.platform.safe;
          ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

          ctx.strokeStyle = theme.border.primary;
          ctx.lineWidth = 2;
          ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        } else {
          // Regular platforms
          const alpha = platform.alpha || 1;
          ctx.fillStyle = platform.isFake ?
            `rgba(61, 30, 46, ${alpha})` :
            platform.disappearing ?
              `rgba(45, 50, 80, ${alpha})` :
              theme.platform.safe;

          ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

          ctx.strokeStyle = platform.isFake ? theme.accent.danger : theme.border.primary;
          ctx.lineWidth = 2;
          ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        }

        ctx.restore();
      });

      // Draw exit
      const exitPlatform = platforms[platforms.length - 1];
      if (exitPlatform) {
        ctx.save();

        // Glow
        ctx.shadowColor = theme.accent.success;
        ctx.shadowBlur = 25;

        // Door
        ctx.fillStyle = theme.game.exit;
        ctx.fillRect(exitPlatform.x + 5, exitPlatform.y, exitPlatform.width - 10, exitPlatform.height);

        ctx.strokeStyle = '#6ee7b7';
        ctx.lineWidth = 3;
        ctx.strokeRect(exitPlatform.x + 5, exitPlatform.y, exitPlatform.width - 10, exitPlatform.height);

        // Text
        ctx.shadowBlur = 0;
        ctx.fillStyle = theme.text.primary;
        ctx.font = 'bold 18px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('EXIT', exitPlatform.x + exitPlatform.width / 2, exitPlatform.y + exitPlatform.height / 2 + 6);

        ctx.restore();
      }

      // Draw player with animation
      ctx.save();

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(gameState.playerX + PLAYER_SIZE / 2, gameState.playerY + PLAYER_SIZE + 2, PLAYER_SIZE / 2, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Player glow
      ctx.shadowColor = theme.accent.primary;
      ctx.shadowBlur = 15;

      // Body
      ctx.fillStyle = theme.game.player;
      ctx.fillRect(gameState.playerX + 4, gameState.playerY + 8, PLAYER_SIZE - 8, PLAYER_SIZE - 8);

      // Horns
      ctx.fillStyle = '#6d28d9';
      ctx.beginPath();
      ctx.moveTo(gameState.playerX + 8, gameState.playerY + 8);
      ctx.lineTo(gameState.playerX + 8, gameState.playerY);
      ctx.lineTo(gameState.playerX + 11, gameState.playerY + 8);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(gameState.playerX + PLAYER_SIZE - 8, gameState.playerY + 8);
      ctx.lineTo(gameState.playerX + PLAYER_SIZE - 8, gameState.playerY);
      ctx.lineTo(gameState.playerX + PLAYER_SIZE - 11, gameState.playerY + 8);
      ctx.fill();

      // Eyes
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(gameState.playerX + 9, gameState.playerY + 14, 4, 5);
      ctx.fillRect(gameState.playerX + PLAYER_SIZE - 13, gameState.playerY + 14, 4, 5);

      // Pupils
      ctx.fillStyle = '#000';
      const pupilOffset = gameState.facingRight ? 1 : -1;
      ctx.fillRect(gameState.playerX + 10 + pupilOffset, gameState.playerY + 16, 2, 2);
      ctx.fillRect(gameState.playerX + PLAYER_SIZE - 12 + pupilOffset, gameState.playerY + 16, 2, 2);

      // Running animation (legs)
      if (!isJumping && Math.abs(velocityX) > 0) {
        const legOffset = Math.sin(runFrame) * 3;
        ctx.fillStyle = theme.game.player;
        ctx.fillRect(gameState.playerX + 8, gameState.playerY + PLAYER_SIZE - 8 + legOffset, 4, 8);
        ctx.fillRect(gameState.playerX + PLAYER_SIZE - 12, gameState.playerY + PLAYER_SIZE - 8 - legOffset, 4, 8);
      }

      ctx.restore();

      // HUD - Compact top right corner
      ctx.save();
      const hudWidth = 160;
      const hudHeight = 55;
      const hudX = CANVAS_WIDTH - hudWidth - 10;
      const hudY = 10;

      // Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(hudX, hudY, hudWidth, hudHeight);

      ctx.strokeStyle = 'rgba(124, 58, 237, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(hudX, hudY, hudWidth, hudHeight);

      // Stats
      ctx.fillStyle = theme.text.primary;
      ctx.font = 'bold 10px system-ui';
      ctx.textAlign = 'left';

      // Level & Score
      ctx.fillText(`Level ${gameState.level}`, hudX + 8, hudY + 15);
      ctx.fillText(`Score: ${gameState.score}`, hudX + 8, hudY + 30);

      // Coins
      ctx.fillStyle = theme.accent.secondary;
      ctx.fillText(`Coins: ${gameState.coins}`, hudX + 8, hudY + 45);

      // Lives (top right of HUD)
      ctx.fillStyle = theme.accent.danger;
      for (let i = 0; i < gameState.lives; i++) {
        ctx.fillRect(hudX + hudWidth - 40 + i * 12, hudY + 8, 10, 10);
      }

      ctx.restore();

      // Troll message
      if (trollMessage) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, CANVAS_HEIGHT / 2 - 40, CANVAS_WIDTH, 80);

        ctx.strokeStyle = theme.accent.primary;
        ctx.lineWidth = 3;
        ctx.strokeRect(5, CANVAS_HEIGHT / 2 - 35, CANVAS_WIDTH - 10, 70);

        ctx.fillStyle = theme.accent.secondary;
        ctx.font = 'bold 24px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(trollMessage, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 8);
        ctx.restore();
      }
    };

    draw();
  }, [gameState, platforms, coins, trollMessage, runFrame, isJumping, velocityX]);

  // Game loop
  useEffect(() => {
    if (gameState.gameOver || !isInitialized) return;

    const gameLoop = setInterval(() => {
      setGameState(prev => {
        let newY = prev.playerY + velocityY;
        let newX = prev.playerX + velocityX;
        let newVelocityY = velocityY + GRAVITY;
        let newIsJumping = isJumping;
        let newLives = prev.lives;
        let newScore = prev.score;
        let newCoins = prev.coins;
        let newFacingRight = prev.facingRight;

        // Update facing direction
        if (velocityX > 0) newFacingRight = true;
        if (velocityX < 0) newFacingRight = false;

        // Boundaries
        if (newX < 0) newX = 0;
        if (newX > CANVAS_WIDTH - PLAYER_SIZE) newX = CANVAS_WIDTH - PLAYER_SIZE;

        // Coin collection - check coins from state to prevent multiple collections
        coins.forEach(coin => {
          if (!coin.collected &&
            Math.abs(newX + PLAYER_SIZE / 2 - coin.x) < 22 &&
            Math.abs(newY + PLAYER_SIZE / 2 - coin.y) < 22) {
            newCoins += 10;
            newScore += 50;
            // Mark coin as collected
            setCoins(prevCoins =>
              prevCoins.map(c =>
                c.x === coin.x && c.y === coin.y ? { ...c, collected: true } : c
              )
            );
          }
        });

        // Platform collision
        platforms.forEach((platform, index) => {
          if (
            newX < platform.x + platform.width &&
            newX + PLAYER_SIZE > platform.x &&
            prev.playerY + PLAYER_SIZE <= platform.y &&
            newY + PLAYER_SIZE >= platform.y &&
            newY + PLAYER_SIZE <= platform.y + platform.height + 12
          ) {
            if (platform.isSpike) {
              newLives--;
              setTrollMessage('OUCH! Spikes! 💀');
              setTimeout(() => setTrollMessage(''), 1500);
              if (newLives <= 0) {
                setGameState(prev => ({ ...prev, gameOver: true }));
                onGameEnd(prev.level, prev.score, prev.coins);
              }
              return;
            }

            if (platform.isFake) {
              setTrollMessage('FAKE! You fell for it! 😈');
              setTimeout(() => setTrollMessage(''), 1500);
              return;
            }

            // Moving platform troll
            if (platform.willMove && !platform.isMoving && platform.targetX !== undefined) {
              setPlatforms(prevPlatforms => {
                const updated = [...prevPlatforms];
                updated[index] = { ...platform, isMoving: true };
                return updated;
              });
              setTrollMessage('Platform moving! 😱');
              setTimeout(() => setTrollMessage(''), 1500);

              const moveInterval = setInterval(() => {
                setPlatforms(prevPlatforms => {
                  const updated = [...prevPlatforms];
                  const movingPlatform = updated[index];
                  if (movingPlatform.targetX !== undefined) {
                    const diff = movingPlatform.targetX - movingPlatform.x;
                    if (Math.abs(diff) > 2) {
                      movingPlatform.x += diff * 0.08;
                    } else {
                      clearInterval(moveInterval);
                    }
                  }
                  return updated;
                });
              }, 20);
            }

            // Disappearing platform
            if (platform.disappearing && !platform.isMoving) {
              setPlatforms(prevPlatforms => {
                const updated = [...prevPlatforms];
                updated[index] = { ...platform, isMoving: true };
                return updated;
              });

              setTimeout(() => {
                let alpha = 1;
                const fadeInterval = setInterval(() => {
                  alpha -= 0.05;
                  setPlatforms(prevPlatforms => {
                    const updated = [...prevPlatforms];
                    updated[index] = { ...updated[index], alpha: Math.max(0, alpha) };
                    return updated;
                  });
                  if (alpha <= 0) {
                    clearInterval(fadeInterval);
                    setPlatforms(prevPlatforms => {
                      const updated = [...prevPlatforms];
                      updated[index] = { ...updated[index], isFake: true };
                      return updated;
                    });
                  }
                }, 50);
              }, 500);
            }

            if (platform.mathOption !== undefined && !scoredOnCorrectPlatform) {
              if (platform.isCorrect) {
                newScore += 300 * prev.level;
                setTrollMessage(`TROLLED! +${300 * prev.level} 😈`);
                setTimeout(() => setTrollMessage(''), 2000);
                setScoredOnCorrectPlatform(true);
              } else {
                newLives--;
                setTrollMessage('Wrong! That\'s the real answer! 🤓');
                setTimeout(() => setTrollMessage(''), 2000);
              }
            }

            newY = platform.y - PLAYER_SIZE;
            newVelocityY = 0;
            newIsJumping = false;
          }
        });

        // Exit check
        const exitPlatform = platforms[platforms.length - 1];
        if (exitPlatform &&
          newX < exitPlatform.x + exitPlatform.width &&
          newX + PLAYER_SIZE > exitPlatform.x &&
          newY < exitPlatform.y + exitPlatform.height &&
          newY + PLAYER_SIZE > exitPlatform.y) {
          const nextLevel = prev.level + 1;
          const question = generateMathQuestion(nextLevel);
          generatePlatforms(nextLevel, question);
          setTrollMessage('Level Complete! 🎉');
          setTimeout(() => setTrollMessage(''), 2000);
          setScoredOnCorrectPlatform(false);
          return {
            ...prev,
            level: nextLevel,
            score: newScore + (150 * prev.level),
            currentQuestion: question,
            playerX: 60,
            playerY: CANVAS_HEIGHT - 130,
          };
        }

        // Fall off
        if (newY > CANVAS_HEIGHT) {
          newLives--;
          setTrollMessage('Fell into the void! 😱');
          setTimeout(() => setTrollMessage(''), 1500);
          if (newLives <= 0) {
            setTimeout(() => {
              onGameEnd(prev.level, prev.score, prev.coins);
            }, 100);
            return { ...prev, gameOver: true };
          }
          newY = CANVAS_HEIGHT - 130;
          newX = 60;
          newVelocityY = 0;
        }

        setVelocityY(newVelocityY);
        setIsJumping(newIsJumping);

        return {
          ...prev,
          playerY: newY,
          playerX: newX,
          lives: newLives,
          score: newScore,
          coins: newCoins,
          facingRight: newFacingRight,
          isRunning: Math.abs(velocityX) > 0,
        };
      });
    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [velocityY, velocityX, isJumping, platforms, gameState.gameOver, isInitialized]);

  // Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.gameOver) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
          setVelocityX(-MOVE_SPEED);
          break;
        case 'ArrowRight':
        case 'd':
          setVelocityX(MOVE_SPEED);
          break;
        case 'ArrowUp':
        case 'w':
        case ' ':
          if (!isJumping) {
            setVelocityY(JUMP_FORCE);
            setIsJumping(true);
          }
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'ArrowRight':
        case 'd':
          setVelocityX(0);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isJumping, gameState.gameOver]);

  if (gameState.gameOver) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#030712] via-[#0f172a] to-[#030712] text-white p-4">
        <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center animate-bounce-in">
          <div className="gradient-border rounded-xl p-6 mb-6">
            <h1 className="text-4xl mb-2 text-gradient font-bold">Game Over!</h1>
            <p className="text-slate-400 text-sm">Great effort, troll master!</p>
          </div>
          <div className="space-y-4 mb-8">
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
              <p className="text-sm text-slate-400 mb-1">Level Reached</p>
              <p className="text-3xl text-gradient-warm font-bold">{gameState.level}</p>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
              <p className="text-sm text-slate-400 mb-1">Final Score</p>
              <p className="text-3xl text-emerald-400 font-bold">{gameState.score}</p>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
              <p className="text-sm text-slate-400 mb-1">Coins Collected</p>
              <p className="text-3xl text-gradient-warm font-bold">{gameState.coins}</p>
            </div>
          </div>
          <button
            onClick={() => onGameEnd(gameState.level, gameState.score, gameState.coins)}
            className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-8 py-4 rounded-xl text-lg font-bold w-full transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/30"
          >
            Submit Score & View Leaderboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-gradient-to-b from-[#030712] via-[#0f172a] to-[#030712] min-h-screen">
      <div className="flex flex-col items-center max-w-2xl mx-auto w-full px-2 py-3 flex-1">
        <div className="glass-card rounded-2xl p-3 w-full mb-3">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="rounded-xl w-full"
            style={{ imageRendering: 'crisp-edges' }}
          />
        </div>

        <div className="glass-card rounded-2xl p-5 w-full mb-20">
          <p className="text-cyan-100 text-center text-sm font-semibold mb-4">
            🎭 Jump on the <span className="text-gradient-warm font-bold">TROLL</span> answer, not the mathematically correct one!
          </p>

          <div className="flex items-center justify-center gap-8">
            <div className="flex flex-col items-center">
              <div className="flex gap-3">
                <button
                  onTouchStart={() => setVelocityX(-MOVE_SPEED)}
                  onTouchEnd={() => setVelocityX(0)}
                  onMouseDown={() => setVelocityX(-MOVE_SPEED)}
                  onMouseUp={() => setVelocityX(0)}
                  onMouseLeave={() => setVelocityX(0)}
                  className="bg-slate-800 hover:bg-slate-700 border-2 border-cyan-500/30 hover:border-cyan-400 px-6 py-6 rounded-xl text-white text-2xl font-bold active:bg-cyan-600 shadow-lg shadow-cyan-500/10 transition-all duration-200"
                >
                  ←
                </button>
                <button
                  onTouchStart={() => setVelocityX(MOVE_SPEED)}
                  onTouchEnd={() => setVelocityX(0)}
                  onMouseDown={() => setVelocityX(MOVE_SPEED)}
                  onMouseUp={() => setVelocityX(0)}
                  onMouseLeave={() => setVelocityX(0)}
                  className="bg-slate-800 hover:bg-slate-700 border-2 border-cyan-500/30 hover:border-cyan-400 px-6 py-6 rounded-xl text-white text-2xl font-bold active:bg-cyan-600 shadow-lg shadow-cyan-500/10 transition-all duration-200"
                >
                  →
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2 font-semibold">MOVE</p>
            </div>

            <div className="flex flex-col items-center">
              <button
                onTouchStart={() => {
                  if (!isJumping) {
                    setVelocityY(JUMP_FORCE);
                    setIsJumping(true);
                  }
                }}
                onMouseDown={() => {
                  if (!isJumping) {
                    setVelocityY(JUMP_FORCE);
                    setIsJumping(true);
                  }
                }}
                className="bg-gradient-to-br from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 border-4 border-cyan-300/50 px-10 py-10 rounded-full text-white text-xl font-bold active:from-cyan-600 active:to-teal-600 shadow-xl shadow-cyan-500/40 transition-all transform hover:scale-110 animate-pulse-glow"
              >
                JUMP
              </button>
              <p className="text-xs text-slate-400 mt-2 font-semibold">SPACE</p>
            </div>
          </div>

          <div className="mt-4 text-center hidden md:block">
            <p className="text-xs text-slate-500">Keyboard: Arrow Keys / WASD + Space</p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-cyan-500/20 shadow-2xl z-50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex justify-around items-center">
            <Link
              href="/"
              className="flex flex-col items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-all duration-200 transform hover:scale-110"
            >
              <span className="text-2xl">🎮</span>
              <span className="text-xs font-semibold">Game</span>
            </Link>
            <Link
              href="/leaderboard"
              className="flex flex-col items-center gap-1 text-slate-400 hover:text-cyan-300 transition-all duration-200 transform hover:scale-110"
            >
              <span className="text-2xl">🏆</span>
              <span className="text-xs font-semibold">Leaderboard</span>
            </Link>
            <Link
              href="/badges"
              className="flex flex-col items-center gap-1 text-slate-400 hover:text-cyan-300 transition-all duration-200 transform hover:scale-110"
            >
              <span className="text-2xl">🏅</span>
              <span className="text-xs font-semibold">Badges</span>
            </Link>
            <Link
              href="/profile"
              className="flex flex-col items-center gap-1 text-slate-400 hover:text-cyan-300 transition-all duration-200 transform hover:scale-110"
            >
              <span className="text-2xl">👤</span>
              <span className="text-xs font-semibold">Profile</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default MathDevilGame;
