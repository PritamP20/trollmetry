'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useRouter } from 'next/navigation';
import MathDevilGame from './MathDevilGame';
import { GAME_CONTRACT_ADDRESS, GAME_CONTRACT_ABI } from '@/lib/contract';

export default function GameWrapper() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gameScore, setGameScore] = useState<{ level: number; score: number } | null>(null);

  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleGameEnd = async (level: number, score: number) => {
    setGameScore({ level, score });

    if (!isConnected || !address) {
      alert('Please connect your wallet first!');
      return;
    }

    // Check if contract address is set
    if (!GAME_CONTRACT_ADDRESS || GAME_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
      console.log('Contract not deployed yet. Score:', { level, score });
      alert(`Game Over! Level: ${level}, Score: ${score}\n\nContract not deployed yet. Redirecting to leaderboard...`);
      router.push('/score');
      return;
    }

    setIsSubmitting(true);
    try {
      writeContract({
        address: GAME_CONTRACT_ADDRESS,
        abi: GAME_CONTRACT_ABI,
        functionName: 'submitScore',
        args: [BigInt(level), BigInt(score)],
      });
    } catch (err) {
      console.error('Error submitting score:', err);
      alert('Failed to submit score. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Handle transaction success
  if (isSuccess && gameScore) {
    setTimeout(() => {
      router.push('/score');
    }, 1000);
  }

  if (isSubmitting || isPending || isConfirming) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f23] text-white p-4">
        <div className="bg-[#1a1a2e] border-4 border-[#4ecdc4] rounded-lg p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Submitting Score...</h2>
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#4ecdc4]"></div>
          </div>
          {gameScore && (
            <div className="space-y-2 text-lg">
              <p>Level: <span className="text-yellow-400 font-bold">{gameScore.level}</span></p>
              <p>Score: <span className="text-green-400 font-bold">{gameScore.score}</span></p>
            </div>
          )}
          {isPending && <p className="mt-4 text-sm text-gray-400">Waiting for wallet confirmation...</p>}
          {isConfirming && <p className="mt-4 text-sm text-gray-400">Confirming transaction on blockchain...</p>}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f23] text-white p-4">
        <div className="bg-[#1a1a2e] border-4 border-[#e74c3c] rounded-lg p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4 text-[#e74c3c]">Error</h2>
          <p className="mb-4">{error.message}</p>
          <button
            onClick={() => {
              setIsSubmitting(false);
              setGameScore(null);
              router.push('/');
            }}
            className="bg-[#4ecdc4] px-6 py-3 rounded-lg hover:bg-[#3db8a8] font-bold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return <MathDevilGame onGameEnd={handleGameEnd} />;
}
