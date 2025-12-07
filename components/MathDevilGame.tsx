'use client';

import { useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';

interface GameState {
  level: number;
  score: number;
  lives: number;
  currentQuestion: MathQuestion | null;
  playerX: number;
  playerY: number;
  gameOver: boolean;
  won: boolean;
}

interface MathQuestion {
  question: string;
  answer: number;
  options: number[];
  type: 'add' | 'subtract' | 'multiply' | 'divide';
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  isFake?: boolean;
  willDisappear?: boolean;
  isSpike?: boolean;
  mathOption?: number;
}

const MathDevilGame = ({ onGameEnd }: { onGameEnd: (level: number, score: number) => void }) => {
  const { address, isConnected } = useAccount();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    level: 1,
    score: 0,
    lives: 3,
    currentQuestion: null,
    playerX: 50,
    playerY: 300,
    gameOver: false,
    won: false,
  });

  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [velocityY, setVelocityY] = useState(0);
  const [velocityX, setVelocityX] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [showQuestion, setShowQuestion] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [trollMessage, setTrollMessage] = useState<string>('');

  // Responsive canvas size
  const [canvasWidth, setCanvasWidth] = useState(350);
  const [canvasHeight, setCanvasHeight] = useState(400);
  const CANVAS_WIDTH = canvasWidth;
  const CANVAS_HEIGHT = canvasHeight;
  const PLAYER_SIZE = 20;
  const GRAVITY = 0.5;
  const JUMP_FORCE = -12;
  const MOVE_SPEED = 5;

  // Adjust canvas size on mount
  useEffect(() => {
    const updateCanvasSize = () => {
      const width = Math.min(window.innerWidth - 32, 400);
      const height = Math.min(window.innerHeight * 0.45, 450);
      setCanvasWidth(width);
      setCanvasHeight(height);
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  const generateMathQuestion = (level: number): MathQuestion => {
    const types: ('add' | 'subtract' | 'multiply' | 'divide')[] = ['add', 'subtract', 'multiply', 'divide'];
    const type = types[Math.floor(Math.random() * Math.min(level, types.length))];

    let num1, num2, answer, question;

    switch (type) {
      case 'add':
        num1 = Math.floor(Math.random() * (10 * level)) + 1;
        num2 = Math.floor(Math.random() * (10 * level)) + 1;
        answer = num1 + num2;
        question = `${num1} + ${num2} = ?`;
        break;
      case 'subtract':
        num1 = Math.floor(Math.random() * (10 * level)) + 10;
        num2 = Math.floor(Math.random() * num1);
        answer = num1 - num2;
        question = `${num1} - ${num2} = ?`;
        break;
      case 'multiply':
        num1 = Math.floor(Math.random() * (5 + level)) + 1;
        num2 = Math.floor(Math.random() * (5 + level)) + 1;
        answer = num1 * num2;
        question = `${num1} × ${num2} = ?`;
        break;
      case 'divide':
        num2 = Math.floor(Math.random() * 10) + 1;
        answer = Math.floor(Math.random() * 10) + 1;
        num1 = num2 * answer;
        question = `${num1} ÷ ${num2} = ?`;
        break;
    }

    const wrongAnswers = Array.from({ length: 3 }, () => {
      const offset = Math.floor(Math.random() * 10) - 5;
      return answer + offset;
    }).filter(a => a !== answer);

    const options = [answer, ...wrongAnswers.slice(0, 2)].sort(() => Math.random() - 0.5);

    return { question, answer, options, type };
  };

  const generatePlatforms = (level: number, question: MathQuestion) => {
    const newPlatforms: Platform[] = [];

    // Ground
    newPlatforms.push({ x: 0, y: CANVAS_HEIGHT - 20, width: CANVAS_WIDTH, height: 20 });

    // Starting platform
    newPlatforms.push({ x: 20, y: CANVAS_HEIGHT - 100, width: 100, height: 15 });

    // Math answer platforms (troll mechanics!)
    question.options.forEach((option, index) => {
      const x = 200 + (index * 200);
      const y = CANVAS_HEIGHT - 200 - (Math.random() * 100);
      const isFake = option !== question.answer;
      const willDisappear = Math.random() > 0.5 && level > 2;

      newPlatforms.push({
        x,
        y,
        width: 80,
        height: 15,
        isFake: isFake && level > 1,
        willDisappear: willDisappear && !isFake,
        mathOption: option,
      });
    });

    // Troll platforms
    if (level > 1) {
      // Fake safe-looking platforms
      for (let i = 0; i < level; i++) {
        newPlatforms.push({
          x: Math.random() * (CANVAS_WIDTH - 100),
          y: Math.random() * (CANVAS_HEIGHT - 200) + 50,
          width: 80,
          height: 15,
          isFake: Math.random() > 0.6,
        });
      }
    }

    // Spikes (troll obstacles)
    if (level > 2) {
      for (let i = 0; i < Math.floor(level / 2); i++) {
        newPlatforms.push({
          x: Math.random() * (CANVAS_WIDTH - 50),
          y: CANVAS_HEIGHT - 50 - (Math.random() * 200),
          width: 40,
          height: 20,
          isSpike: true,
        });
      }
    }

    // Exit door
    newPlatforms.push({
      x: CANVAS_WIDTH - 80,
      y: CANVAS_HEIGHT - 300,
      width: 60,
      height: 80,
    });

    setPlatforms(newPlatforms);
  };

  const initLevel = () => {
    const question = generateMathQuestion(gameState.level);
    generatePlatforms(gameState.level, question);
    setGameState(prev => ({
      ...prev,
      currentQuestion: question,
      playerX: 50,
      playerY: 300,
    }));
    setShowQuestion(true);
    setVelocityY(0);
    setVelocityX(0);
  };

  useEffect(() => {
    initLevel();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      // Clear canvas
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw platforms
      platforms.forEach(platform => {
        if (platform.isSpike) {
          // Draw spikes
          ctx.fillStyle = '#ff4444';
          ctx.beginPath();
          for (let i = 0; i < platform.width; i += 20) {
            ctx.moveTo(platform.x + i, platform.y + platform.height);
            ctx.lineTo(platform.x + i + 10, platform.y);
            ctx.lineTo(platform.x + i + 20, platform.y + platform.height);
          }
          ctx.fill();
        } else if (platform.mathOption !== undefined) {
          // Math platforms
          ctx.fillStyle = platform.isFake ? '#ff6b6b' : '#4ecdc4';
          ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
          ctx.fillStyle = '#fff';
          ctx.font = '20px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(platform.mathOption.toString(), platform.x + platform.width / 2, platform.y - 5);
        } else {
          // Regular platforms
          ctx.fillStyle = platform.isFake ? '#95a5a6' : '#2ecc71';
          if (platform.willDisappear) {
            ctx.fillStyle = '#f39c12';
          }
          ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        }
      });

      // Draw exit door
      const exitPlatform = platforms[platforms.length - 1];
      if (exitPlatform) {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(exitPlatform.x, exitPlatform.y, exitPlatform.width, exitPlatform.height);
        ctx.fillStyle = '#000';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('EXIT', exitPlatform.x + 30, exitPlatform.y + 45);
      }

      // Draw player (simple devil character)
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(gameState.playerX, gameState.playerY, PLAYER_SIZE, PLAYER_SIZE);

      // Horns
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(gameState.playerX + 5, gameState.playerY - 5, 8, 8);
      ctx.fillRect(gameState.playerX + 17, gameState.playerY - 5, 8, 8);

      // Eyes
      ctx.fillStyle = '#fff';
      ctx.fillRect(gameState.playerX + 8, gameState.playerY + 10, 5, 5);
      ctx.fillRect(gameState.playerX + 17, gameState.playerY + 10, 5, 5);

      // Draw HUD
      ctx.fillStyle = '#fff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Level: ${gameState.level}`, 10, 25);
      ctx.fillText(`Score: ${gameState.score}`, 10, 50);
      ctx.fillText(`Lives: ${gameState.lives}`, 10, 75);

      if (trollMessage) {
        ctx.fillStyle = '#ff6b6b';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(trollMessage, CANVAS_WIDTH / 2, 100);
      }
    };

    draw();
  }, [gameState, platforms, trollMessage]);

  // Game loop
  useEffect(() => {
    if (gameState.gameOver) return;

    const gameLoop = setInterval(() => {
      setGameState(prev => {
        let newY = prev.playerY + velocityY;
        let newX = prev.playerX + velocityX;
        let newVelocityY = velocityY + GRAVITY;
        let newIsJumping = isJumping;
        let newLives = prev.lives;
        let newScore = prev.score;
        let hitPlatform = false;

        // Boundary checks
        if (newX < 0) newX = 0;
        if (newX > CANVAS_WIDTH - PLAYER_SIZE) newX = CANVAS_WIDTH - PLAYER_SIZE;

        // Platform collision
        platforms.forEach(platform => {
          if (
            newX < platform.x + platform.width &&
            newX + PLAYER_SIZE > platform.x &&
            prev.playerY + PLAYER_SIZE <= platform.y &&
            newY + PLAYER_SIZE >= platform.y &&
            newY + PLAYER_SIZE <= platform.y + platform.height + 10
          ) {
            if (platform.isSpike) {
              newLives--;
              setTrollMessage('OUCH! That\'s a spike! 😈');
              setTimeout(() => setTrollMessage(''), 1500);
              if (newLives <= 0) {
                setGameState(prev => ({ ...prev, gameOver: true }));
                onGameEnd(prev.level, prev.score);
              }
              return;
            }

            if (platform.isFake) {
              setTrollMessage('FAKE PLATFORM! Gotcha! 😂');
              setTimeout(() => setTrollMessage(''), 1500);
              newY = prev.playerY;
              return;
            }

            if (platform.mathOption !== undefined) {
              if (platform.mathOption === prev.currentQuestion?.answer) {
                newScore += 100 * prev.level;
                setTrollMessage('Correct! +' + (100 * prev.level) + ' points! 🎉');
                setTimeout(() => setTrollMessage(''), 1500);
              } else {
                newLives--;
                setTrollMessage('Wrong answer! -1 life 😈');
                setTimeout(() => setTrollMessage(''), 1500);
              }
            }

            newY = platform.y - PLAYER_SIZE;
            newVelocityY = 0;
            newIsJumping = false;
            hitPlatform = true;
          }
        });

        // Check exit
        const exitPlatform = platforms[platforms.length - 1];
        if (exitPlatform &&
            newX < exitPlatform.x + exitPlatform.width &&
            newX + PLAYER_SIZE > exitPlatform.x &&
            newY < exitPlatform.y + exitPlatform.height &&
            newY + PLAYER_SIZE > exitPlatform.y) {
          // Level complete
          const nextLevel = prev.level + 1;
          const question = generateMathQuestion(nextLevel);
          generatePlatforms(nextLevel, question);
          return {
            ...prev,
            level: nextLevel,
            score: newScore + (50 * prev.level),
            currentQuestion: question,
            playerX: 50,
            playerY: 300,
          };
        }

        // Fall off screen
        if (newY > CANVAS_HEIGHT) {
          newLives--;
          setTrollMessage('You fell! 😱');
          setTimeout(() => setTrollMessage(''), 1500);
          if (newLives <= 0) {
            return { ...prev, gameOver: true };
          }
          newY = 300;
          newX = 50;
        }

        setVelocityY(newVelocityY);
        setIsJumping(newIsJumping);

        return {
          ...prev,
          playerY: newY,
          playerX: newX,
          lives: newLives,
          score: newScore,
        };
      });
    }, 1000 / 60); // 60 FPS

    return () => clearInterval(gameLoop);
  }, [velocityY, velocityX, isJumping, platforms, gameState.gameOver]);

  // Keyboard controls
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f23] text-white p-4">
        <div className="bg-[#1a1a2e] border-4 border-[#e74c3c] rounded-lg p-8 max-w-md w-full text-center shadow-2xl">
          <h1 className="text-4xl mb-4 text-[#e74c3c] font-bold">Game Over!</h1>
          <div className="space-y-3 mb-6">
            <p className="text-xl">Level Reached: <span className="text-yellow-400 font-bold">{gameState.level}</span></p>
            <p className="text-xl">Final Score: <span className="text-green-400 font-bold">{gameState.score}</span></p>
          </div>
          <button
            onClick={() => onGameEnd(gameState.level, gameState.score)}
            className="bg-[#e74c3c] px-8 py-4 rounded-lg text-xl hover:bg-[#c0392b] transition-colors w-full font-bold"
          >
            Submit Score & View Leaderboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#0f0f23] px-2 py-1">
      {/* Game Boy Container */}
      <div className="flex flex-col items-center max-w-lg mx-auto w-full">

        {/* Question Modal */}
        {showQuestion && gameState.currentQuestion && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a2e] border-4 border-yellow-400 rounded-lg p-4 max-w-sm w-full text-center">
              <h2 className="text-xl font-bold mb-2 text-yellow-400">Level {gameState.level}</h2>
              <p className="text-sm text-white mb-2">Find the correct platform!</p>
              <p className="text-2xl font-bold text-[#4ecdc4] mb-4">{gameState.currentQuestion.question}</p>
              <button
                onClick={() => setShowQuestion(false)}
                className="bg-green-500 px-4 py-2 rounded-lg hover:bg-green-600 text-white font-bold w-full"
              >
                Start!
              </button>
            </div>
          </div>
        )}

        {/* Game Screen (Top Half) */}
        <div className="bg-[#1a1a2e] border-4 border-[#e74c3c] rounded-t-2xl p-2 w-full shadow-2xl">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="rounded-lg bg-[#0f0f23] w-full"
            style={{ imageRendering: 'pixelated', maxHeight: '45vh' }}
          />
        </div>

        {/* Game Boy Controls (Bottom Half) */}
        <div className="bg-[#2d2d44] border-4 border-[#e74c3c] border-t-0 rounded-b-2xl p-3 w-full shadow-2xl">
          <div className="text-center mb-2">
            <p className="text-white text-xs font-mono">Jump on the correct answer!</p>
          </div>

          {/* D-Pad Style Controls */}
          <div className="flex items-center justify-center gap-4">
            {/* Left/Right D-Pad */}
            <div className="relative">
              <div className="flex flex-col items-center">
                <div className="flex gap-1">
                  <button
                    onTouchStart={() => setVelocityX(-MOVE_SPEED)}
                    onTouchEnd={() => setVelocityX(0)}
                    onMouseDown={() => setVelocityX(-MOVE_SPEED)}
                    onMouseUp={() => setVelocityX(0)}
                    onMouseLeave={() => setVelocityX(0)}
                    className="bg-[#3a3a52] border-2 border-gray-600 px-4 py-4 md:px-6 md:py-6 rounded text-white text-xl font-bold active:bg-[#4a4a62] shadow-lg"
                  >
                    ←
                  </button>
                  <button
                    onTouchStart={() => setVelocityX(MOVE_SPEED)}
                    onTouchEnd={() => setVelocityX(0)}
                    onMouseDown={() => setVelocityX(MOVE_SPEED)}
                    onMouseUp={() => setVelocityX(0)}
                    onMouseLeave={() => setVelocityX(0)}
                    className="bg-[#3a3a52] border-2 border-gray-600 px-4 py-4 md:px-6 md:py-6 rounded text-white text-xl font-bold active:bg-[#4a4a62] shadow-lg"
                  >
                    →
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">MOVE</p>
              </div>
            </div>

            {/* Jump Button */}
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
                className="bg-[#e74c3c] border-4 border-[#c0392b] px-6 py-6 md:px-8 md:py-8 rounded-full text-white text-xl md:text-2xl font-bold active:bg-[#c0392b] shadow-lg"
              >
                JUMP
              </button>
              <p className="text-xs text-gray-400 mt-1">A</p>
            </div>
          </div>

          {/* Desktop Keyboard Hint */}
          <div className="mt-2 text-center hidden md:block">
            <p className="text-xs text-gray-400">Desktop: Arrow Keys / WASD</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MathDevilGame;
