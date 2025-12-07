'use client';

import { useAccount, useReadContract } from 'wagmi';
import { useRouter } from 'next/navigation';
import { GAME_CONTRACT_ADDRESS, GAME_CONTRACT_ABI } from '@/lib/contract';
import { useEffect, useState } from 'react';

interface Badge {
  name: string;
  description: string;
  requirement: bigint;
  active: boolean;
}

export default function ScorePage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [playerBadgeIds, setPlayerBadgeIds] = useState<number[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);

  // Get player stats
  const { data: playerStats } = useReadContract({
    address: GAME_CONTRACT_ADDRESS,
    abi: GAME_CONTRACT_ABI,
    functionName: 'getPlayerStats',
    args: address ? [address] : undefined,
  });

  // Get leaderboard
  const { data: leaderboard } = useReadContract({
    address: GAME_CONTRACT_ADDRESS,
    abi: GAME_CONTRACT_ABI,
    functionName: 'getLeaderboard',
    args: [BigInt(10)],
  });

  // Get player badges
  const { data: badges } = useReadContract({
    address: GAME_CONTRACT_ADDRESS,
    abi: GAME_CONTRACT_ABI,
    functionName: 'getPlayerBadges',
    args: address ? [address] : undefined,
  });

  // Get badge count
  const { data: badgeCount } = useReadContract({
    address: GAME_CONTRACT_ADDRESS,
    abi: GAME_CONTRACT_ABI,
    functionName: 'getTotalBadgeTypes',
  });

  // Load all badge details
  useEffect(() => {
    if (badges && Array.isArray(badges)) {
      setPlayerBadgeIds(badges.map(b => Number(b)));
    }
  }, [badges]);

  useEffect(() => {
    const loadBadges = async () => {
      if (badgeCount) {
        const count = Number(badgeCount);
        const badgePromises = [];
        for (let i = 0; i < count; i++) {
          badgePromises.push(
            fetch(`/api/badge/${i}`).then(res => res.json()).catch(() => null)
          );
        }
        const results = await Promise.all(badgePromises);
        setAllBadges(results.filter(Boolean));
      }
    };
    loadBadges();
  }, [badgeCount]);

  const contractNotDeployed = !GAME_CONTRACT_ADDRESS || GAME_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000';

  if (contractNotDeployed) {
    return (
      <div className="min-h-screen bg-[#0f0f23] text-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#1a1a2e] border-4 border-yellow-400 rounded-lg p-8 text-center">
            <h1 className="text-3xl font-bold mb-4 text-yellow-400">Contract Not Deployed</h1>
            <p className="mb-6">The smart contract hasn't been deployed to Sepolia yet.</p>
            <p className="text-sm text-gray-400 mb-6">Deploy the contract and add the address to .env.local as NEXT_PUBLIC_GAME_CONTRACT_ADDRESS</p>
            <button
              onClick={() => router.push('/')}
              className="bg-[#4ecdc4] px-6 py-3 rounded-lg hover:bg-[#3db8a8] font-bold"
            >
              Back to Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#0f0f23] text-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#1a1a2e] border-4 border-[#e74c3c] rounded-lg p-8 text-center">
            <h1 className="text-3xl font-bold mb-4">Connect Wallet</h1>
            <p className="mb-6">Please connect your wallet to view the leaderboard</p>
            <button
              onClick={() => router.push('/')}
              className="bg-[#4ecdc4] px-6 py-3 rounded-lg hover:bg-[#3db8a8] font-bold"
            >
              Back to Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = playerStats as [bigint, bigint, bigint, bigint] | undefined;
  const leaderboardData = leaderboard as [readonly `0x${string}`[], readonly bigint[]] | undefined;

  return (
    <div className="min-h-screen bg-[#0f0f23] text-white p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#e74c3c] mb-2">Math Devil Leaderboard</h1>
          <p className="text-gray-400">Points, Badges & Rankings</p>
        </div>

        {/* Player Stats */}
        {stats && (
          <div className="bg-[#1a1a2e] border-4 border-[#4ecdc4] rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-[#4ecdc4]">Your Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#0f0f23] p-4 rounded-lg text-center">
                <p className="text-gray-400 text-sm mb-1">Total Points</p>
                <p className="text-2xl font-bold text-yellow-400">{stats[0].toString()}</p>
              </div>
              <div className="bg-[#0f0f23] p-4 rounded-lg text-center">
                <p className="text-gray-400 text-sm mb-1">Highest Level</p>
                <p className="text-2xl font-bold text-green-400">{stats[1].toString()}</p>
              </div>
              <div className="bg-[#0f0f23] p-4 rounded-lg text-center">
                <p className="text-gray-400 text-sm mb-1">Games Played</p>
                <p className="text-2xl font-bold text-blue-400">{stats[2].toString()}</p>
              </div>
              <div className="bg-[#0f0f23] p-4 rounded-lg text-center">
                <p className="text-gray-400 text-sm mb-1">Badges</p>
                <p className="text-2xl font-bold text-purple-400">{playerBadgeIds.length}</p>
              </div>
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="bg-[#1a1a2e] border-4 border-yellow-400 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-yellow-400">Badges</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Math Novice', description: 'Complete 5 games', id: 0 },
              { name: 'Math Warrior', description: 'Reach level 10', id: 1 },
              { name: 'Math Master', description: 'Score 1000 points', id: 2 },
              { name: 'Troll Survivor', description: 'Complete 20 games', id: 3 },
            ].map((badge) => {
              const earned = playerBadgeIds.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`p-4 rounded-lg border-2 ${
                    earned
                      ? 'bg-yellow-400 bg-opacity-10 border-yellow-400'
                      : 'bg-gray-800 bg-opacity-50 border-gray-600 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{earned ? '🏆' : '🔒'}</div>
                    <div>
                      <h3 className="font-bold text-lg">{badge.name}</h3>
                      <p className="text-sm text-gray-400">{badge.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-[#1a1a2e] border-4 border-[#e74c3c] rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-[#e74c3c]">Top Players</h2>
          <div className="space-y-2">
            {leaderboardData && leaderboardData[0].length > 0 ? (
              leaderboardData[0].map((player, index) => (
                <div
                  key={player}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    player.toLowerCase() === address?.toLowerCase()
                      ? 'bg-[#4ecdc4] bg-opacity-20 border-2 border-[#4ecdc4]'
                      : 'bg-[#0f0f23]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`text-2xl font-bold ${
                        index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-orange-400' : 'text-gray-500'
                      }`}
                    >
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-mono text-sm">
                        {player.slice(0, 6)}...{player.slice(-4)}
                      </p>
                      {player.toLowerCase() === address?.toLowerCase() && (
                        <p className="text-xs text-[#4ecdc4]">You</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-yellow-400">
                      {leaderboardData[1][index].toString()} pts
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 py-8">No players yet. Be the first!</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.push('/')}
            className="bg-[#4ecdc4] px-8 py-4 rounded-lg hover:bg-[#3db8a8] font-bold text-lg"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
