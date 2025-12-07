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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#030712] via-[#0f172a] to-[#030712] text-white p-4">
        <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center animate-bounce-in">
          <h2 className="text-2xl font-bold mb-4 text-gradient">Submitting Score...</h2>
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-500 border-t-transparent"></div>
          </div>
          {gameScore && (
            <div className="space-y-2 text-lg">
              <p>Level: <span className="text-gradient-warm font-bold">{gameScore.level}</span></p>
              <p>Score: <span className="text-emerald-400 font-bold">{gameScore.score}</span></p>
              <p>Coins: <span className="text-gradient-warm font-bold">{gameScore.coins}</span></p>
            </div>
          )}
          {isPending && <p className="mt-4 text-sm text-slate-400">Waiting for wallet confirmation...</p>}
          {isConfirming && <p className="mt-4 text-sm text-slate-400">Confirming transaction on blockchain...</p>}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#030712] via-[#0f172a] to-[#030712] text-white p-4">
        <div className="glass-card rounded-2xl p-8 max-w-2xl w-full border border-red-500/30">
          <h2 className="text-2xl font-bold mb-4 text-red-400 text-center">Transaction Failed</h2>

          <div className="mb-6 p-4 bg-slate-900/50 rounded-xl text-left border border-slate-700">
            <p className="text-sm font-mono text-slate-300 mb-2">Error Details:</p>
            <p className="text-xs font-mono text-red-400 break-words">{error.message}</p>
          </div>

          <div className="mb-6 p-4 bg-slate-900/50 rounded-xl text-left text-sm border border-slate-700">
            <p className="font-bold mb-2 text-gradient-warm">Common Solutions:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-300">
              <li>Make sure you're connected to <strong className="text-cyan-400">Sepolia</strong> network</li>
              <li>Check you have enough ETH for gas fees</li>
              <li>Verify the contract address: <span className="text-xs font-mono">{GAME_CONTRACT_ADDRESS}</span></li>
              <li>View contract on <a
                href={`https://sepolia.etherscan.io/address/${GAME_CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline"
              >Etherscan</a></li>
            </ul>
          </div>

          {gameScore && (
            <div className="mb-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
              <p className="text-sm text-slate-400 mb-2">Your Game Stats (not saved):</p>
              <div className="flex justify-around text-center">
                <div>
                  <p className="text-xs text-slate-500">Level</p>
                  <p className="text-lg font-bold text-gradient-warm">{gameScore.level}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Score</p>
                  <p className="text-lg font-bold text-emerald-400">{gameScore.score}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Coins</p>
                  <p className="text-lg font-bold text-gradient-warm">{gameScore.coins}</p>
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
              className="flex-1 bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-xl font-bold transition-all"
            >
              Back to Home
            </button>
            <button
              onClick={() => {
                if (gameScore) {
                  handleGameEnd(gameScore.level, gameScore.score, gameScore.coins);
                }
              }}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-cyan-500/30"
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
