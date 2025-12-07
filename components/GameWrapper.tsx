'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId, useSwitchChain } from 'wagmi';
import { useRouter } from 'next/navigation';
import { sepolia } from 'wagmi/chains';
import MathDevilGame from './MathDevilGame';
import { GAME_CONTRACT_ADDRESS, GAME_CONTRACT_ABI } from '@/lib/contract';

export default function GameWrapper() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gameScore, setGameScore] = useState<{ level: number; score: number; coins: number } | null>(null);

  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleGameEnd = async (level: number, score: number, coins: number) => {
    setGameScore({ level, score, coins });

    if (!isConnected || !address) {
      alert('Please connect your wallet first!');
      return;
    }

    // Check if contract address is set
    if (!GAME_CONTRACT_ADDRESS || GAME_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
      console.log('Contract not deployed yet. Score:', { level, score, coins });
      alert(`Game Over! Level: ${level}, Score: ${score}, Coins: ${coins}\n\nContract not deployed yet. Redirecting to leaderboard...`);
      router.push('/score');
      return;
    }

    // Check if on correct network
    if (chainId !== sepolia.id) {
      const shouldSwitch = confirm(`Wrong network! You're on chain ${chainId}. Switch to Sepolia?`);
      if (shouldSwitch && switchChain) {
        try {
          await switchChain({ chainId: sepolia.id });
        } catch (err) {
          console.error('Failed to switch network:', err);
          alert('Please switch to Sepolia network manually.');
          setIsSubmitting(false);
          return;
        }
      } else {
        alert('Please switch to Sepolia network to submit score.');
        setIsSubmitting(false);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      console.log('Submitting score to contract:', {
        address: GAME_CONTRACT_ADDRESS,
        level,
        score,
        coins,
        chainId,
        sender: address
      });

      writeContract({
        address: GAME_CONTRACT_ADDRESS,
        abi: GAME_CONTRACT_ABI,
        functionName: 'submitScore',
        args: [BigInt(level), BigInt(score), BigInt(coins)],
        gas: BigInt(500000), // Set explicit gas limit to avoid estimation issues
      });
    } catch (err: any) {
      console.error('Error submitting score:', err);
      const errorMessage = err?.message || 'Failed to submit score';
      alert(`Error: ${errorMessage}\n\nPlease try again.`);
      setIsSubmitting(false);
    }
  };

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && gameScore) {
      console.log('Transaction successful! Redirecting...');
      setIsSubmitting(false);
      const timer = setTimeout(() => {
        router.push('/score');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, gameScore, router]);

  // Handle transaction error
  useEffect(() => {
    if (error) {
      setIsSubmitting(false);
    }
  }, [error]);

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
              <p>Coins: <span className="text-yellow-400 font-bold">{gameScore.coins}</span></p>
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
        <div className="bg-[#1a1a2e] border-4 border-[#e74c3c] rounded-lg p-8 max-w-2xl w-full">
          <h2 className="text-2xl font-bold mb-4 text-[#e74c3c] text-center">Transaction Failed</h2>

          <div className="mb-6 p-4 bg-[#0f0f23] rounded-lg text-left">
            <p className="text-sm font-mono text-gray-300 mb-2">Error Details:</p>
            <p className="text-xs font-mono text-red-400 break-words">{error.message}</p>
          </div>

          <div className="mb-6 p-4 bg-[#0f0f23] rounded-lg text-left text-sm">
            <p className="font-bold mb-2 text-yellow-400">Common Solutions:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-300">
              <li>Make sure you're connected to <strong className="text-[#4ecdc4]">Sepolia</strong> network</li>
              <li>Check you have enough ETH for gas fees</li>
              <li>Verify the contract address: <span className="text-xs font-mono">{GAME_CONTRACT_ADDRESS}</span></li>
              <li>View contract on <a
                href={`https://sepolia.etherscan.io/address/${GAME_CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#4ecdc4] hover:underline"
              >Etherscan</a></li>
            </ul>
          </div>

          {gameScore && (
            <div className="mb-4 p-4 bg-[#0f0f23] rounded-lg">
              <p className="text-sm text-gray-400 mb-2">Your Game Stats (not saved):</p>
              <div className="flex justify-around text-center">
                <div>
                  <p className="text-xs text-gray-500">Level</p>
                  <p className="text-lg font-bold text-yellow-400">{gameScore.level}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Score</p>
                  <p className="text-lg font-bold text-green-400">{gameScore.score}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Coins</p>
                  <p className="text-lg font-bold text-yellow-400">{gameScore.coins}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => {
                setIsSubmitting(false);
                setGameScore(null);
                router.push('/');
              }}
              className="flex-1 bg-gray-600 px-6 py-3 rounded-lg hover:bg-gray-700 font-bold"
            >
              Back to Home
            </button>
            <button
              onClick={() => {
                if (gameScore) {
                  handleGameEnd(gameScore.level, gameScore.score, gameScore.coins);
                }
              }}
              className="flex-1 bg-[#4ecdc4] px-6 py-3 rounded-lg hover:bg-[#3db8a8] font-bold"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <MathDevilGame onGameEnd={handleGameEnd} />;
}
