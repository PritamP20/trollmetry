'use client';

import { useEffect, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { GAME_CONTRACT_ADDRESS, GAME_CONTRACT_ABI } from '@/lib/contract';
import Link from 'next/link';

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const [recentBadges, setRecentBadges] = useState<number[]>([]);

  // Get player stats
  const { data: playerStats, isLoading: loadingStats } = useReadContract({
    address: GAME_CONTRACT_ADDRESS,
    abi: GAME_CONTRACT_ABI,
    functionName: 'getPlayerStats',
    args: address ? [address] : undefined,
  });

  // Get player badges
  const { data: playerBadges } = useReadContract({
    address: GAME_CONTRACT_ADDRESS,
    abi: GAME_CONTRACT_ABI,
    functionName: 'getPlayerBadges',
    args: address ? [address] : undefined,
  });

  // Get leaderboard position
  const { data: leaderboard } = useReadContract({
    address: GAME_CONTRACT_ADDRESS,
    abi: GAME_CONTRACT_ABI,
    functionName: 'getLeaderboard',
    args: [BigInt(100)],
  });

  const rank = leaderboard && address
    ? (leaderboard as any[]).findIndex(
        (entry: any) => entry.player.toLowerCase() === address.toLowerCase()
      ) + 1
    : null;

  useEffect(() => {
    if (playerBadges && (playerBadges as bigint[]).length > 0) {
      const badges = (playerBadges as bigint[]).map(b => Number(b));
      setRecentBadges(badges.slice(-3).reverse());
    }
  }, [playerBadges]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  const getBadgeIcon = (badgeId: number) => {
    const icons: Record<number, string> = {
      1: '🎯', 2: '⭐', 3: '💫', 4: '🌟', 5: '👑', 6: '🏆',
      7: '💯', 8: '💯', 9: '💯', 10: '💯',
      11: '💰', 12: '💰', 13: '💰', 14: '💰',
      15: '🎮', 16: '🎮', 17: '🎮', 18: '🎮',
      19: '🎯', 20: '👹'
    };
    return icons[badgeId] || '🏅';
  };

  const getBadgeName = (badgeId: number) => {
    const names: Record<number, string> = {
      1: 'Beginner Troll', 2: 'Amateur Troll', 3: 'Skilled Troll',
      4: 'Expert Troll', 5: 'Master Troll', 6: 'Legendary Troll',
      7: 'Point Collector', 8: 'Point Hunter', 9: 'Point Master', 10: 'Point Legend',
      11: 'Coin Finder', 12: 'Coin Collector', 13: 'Coin Hoarder', 14: 'Coin Tycoon',
      15: 'Casual Player', 16: 'Dedicated Player', 17: 'Hardcore Player', 18: 'Addicted Player',
      19: 'Triple Threat', 20: 'Ultimate Troll'
    };
    return names[badgeId] || 'Unknown Badge';
  };

  if (!isConnected || !address) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0e27] via-[#151932] to-[#0a0e27] text-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-6">🔐</div>
          <h2 className="text-3xl font-bold mb-4 text-purple-300">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-8">Please connect your wallet to view your profile</p>
          <Link
            href="/"
            className="bg-purple-600 hover:bg-purple-700 px-8 py-4 rounded-lg font-bold text-lg transition-all inline-block"
          >
            Go to Game
          </Link>
        </div>
      </div>
    );
  }

  const [totalScore, totalCoins, highestLevel, gamesPlayed, lastPlayed, badgeCount] =
    (playerStats as [bigint, bigint, bigint, bigint, bigint, bigint]) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0e27] via-[#151932] to-[#0a0e27] text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Player Profile
          </h1>
          <p className="text-gray-400 text-lg font-mono">
            {formatAddress(address)}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center gap-4 mb-8">
          <Link
            href="/"
            className="bg-[#1e2139] hover:bg-[#252941] border border-purple-500/30 px-6 py-3 rounded-lg font-semibold transition-all"
          >
            ← Back to Game
          </Link>
          <Link
            href="/leaderboard"
            className="bg-[#1e2139] hover:bg-[#252941] border border-purple-500/30 px-6 py-3 rounded-lg font-semibold transition-all"
          >
            🏆 Leaderboard
          </Link>
          <Link
            href="/badges"
            className="bg-[#1e2139] hover:bg-[#252941] border border-purple-500/30 px-6 py-3 rounded-lg font-semibold transition-all"
          >
            🏅 Badges
          </Link>
        </div>

        {loadingStats ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-500"></div>
          </div>
        ) : playerStats ? (
          <>
            {/* Main Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Score */}
              <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 border-2 border-purple-500 rounded-xl p-6 text-center transform hover:scale-105 transition-all">
                <div className="text-4xl mb-2">🎯</div>
                <p className="text-sm text-gray-400 mb-1">Total Score</p>
                <p className="text-3xl font-bold text-purple-300">
                  {Number(totalScore).toLocaleString()}
                </p>
              </div>

              {/* Total Coins */}
              <div className="bg-gradient-to-br from-amber-900/40 to-amber-800/40 border-2 border-amber-500 rounded-xl p-6 text-center transform hover:scale-105 transition-all">
                <div className="text-4xl mb-2">💰</div>
                <p className="text-sm text-gray-400 mb-1">Total Coins</p>
                <p className="text-3xl font-bold text-amber-300">
                  {Number(totalCoins).toLocaleString()}
                </p>
              </div>

              {/* Highest Level */}
              <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 border-2 border-blue-500 rounded-xl p-6 text-center transform hover:scale-105 transition-all">
                <div className="text-4xl mb-2">🎮</div>
                <p className="text-sm text-gray-400 mb-1">Highest Level</p>
                <p className="text-3xl font-bold text-blue-300">
                  {Number(highestLevel)}
                </p>
              </div>

              {/* Games Played */}
              <div className="bg-gradient-to-br from-green-900/40 to-green-800/40 border-2 border-green-500 rounded-xl p-6 text-center transform hover:scale-105 transition-all">
                <div className="text-4xl mb-2">🕹️</div>
                <p className="text-sm text-gray-400 mb-1">Games Played</p>
                <p className="text-3xl font-bold text-green-300">
                  {Number(gamesPlayed)}
                </p>
              </div>
            </div>

            {/* Rank and Badges */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Global Rank */}
              <div className="bg-[#1e2139] border-2 border-purple-500/30 rounded-xl p-8">
                <h3 className="text-2xl font-bold mb-6 text-purple-300 flex items-center gap-3">
                  <span>🏆</span> Global Ranking
                </h3>
                {rank ? (
                  <div className="text-center">
                    <p className="text-6xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-2">
                      #{rank}
                    </p>
                    <p className="text-gray-400">
                      {rank === 1 && '🥇 You\'re #1!'}
                      {rank === 2 && '🥈 Almost there!'}
                      {rank === 3 && '🥉 Great job!'}
                      {rank > 3 && rank <= 10 && '🌟 Top 10!'}
                      {rank > 10 && '💪 Keep climbing!'}
                    </p>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <p className="text-2xl mb-2">Not ranked yet</p>
                    <p className="text-sm">Play more to get ranked!</p>
                  </div>
                )}
              </div>

              {/* Badge Collection */}
              <div className="bg-[#1e2139] border-2 border-amber-500/30 rounded-xl p-8">
                <h3 className="text-2xl font-bold mb-6 text-amber-300 flex items-center gap-3">
                  <span>🏅</span> Badge Collection
                </h3>
                <div className="text-center mb-4">
                  <p className="text-6xl font-bold text-amber-400 mb-2">
                    {Number(badgeCount)}
                  </p>
                  <p className="text-gray-400">
                    out of 20 badges earned
                  </p>
                </div>
                <div className="w-full bg-[#252941] rounded-full h-3 mb-2">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full transition-all"
                    style={{ width: `${(Number(badgeCount) / 20) * 100}%` }}
                  ></div>
                </div>
                <p className="text-center text-xs text-gray-500">
                  {Math.round((Number(badgeCount) / 20) * 100)}% complete
                </p>
              </div>
            </div>

            {/* Recent Badges */}
            {recentBadges.length > 0 && (
              <div className="bg-[#1e2139] border-2 border-purple-500/30 rounded-xl p-8 mb-8">
                <h3 className="text-2xl font-bold mb-6 text-purple-300 flex items-center gap-3">
                  <span>✨</span> Recently Earned Badges
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {recentBadges.map(badgeId => (
                    <div
                      key={badgeId}
                      className="bg-[#252941] rounded-lg p-4 border border-amber-500/30 text-center transform hover:scale-105 transition-all"
                    >
                      <div className="text-5xl mb-2">{getBadgeIcon(badgeId)}</div>
                      <p className="font-bold text-amber-400">{getBadgeName(badgeId)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activity Stats */}
            <div className="bg-[#1e2139] border-2 border-purple-500/30 rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-6 text-purple-300 flex items-center gap-3">
                <span>📊</span> Activity Stats
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Average Score per Game</span>
                  <span className="text-xl font-bold text-purple-300">
                    {Number(gamesPlayed) > 0
                      ? Math.round(Number(totalScore) / Number(gamesPlayed)).toLocaleString()
                      : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Average Coins per Game</span>
                  <span className="text-xl font-bold text-amber-400">
                    {Number(gamesPlayed) > 0
                      ? Math.round(Number(totalCoins) / Number(gamesPlayed)).toLocaleString()
                      : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Last Played</span>
                  <span className="text-xl font-bold text-blue-300">
                    {lastPlayed && Number(lastPlayed) > 0
                      ? new Date(Number(lastPlayed) * 1000).toLocaleDateString()
                      : 'Never'}
                  </span>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="mt-8 text-center">
              <Link
                href="/"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-12 py-5 rounded-xl text-xl font-bold transition-all transform hover:scale-105 inline-block shadow-lg"
              >
                🎮 Play More Games
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎮</div>
            <h3 className="text-2xl font-bold text-gray-400 mb-2">No Game History</h3>
            <p className="text-gray-500 mb-6">Start playing to build your profile!</p>
            <Link
              href="/"
              className="bg-purple-600 hover:bg-purple-700 px-8 py-4 rounded-lg font-bold text-lg transition-all inline-block"
            >
              Play Now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
