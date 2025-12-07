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
      <div className="min-h-screen bg-gradient-to-b from-[#030712] via-[#0f172a] to-[#030712] text-white flex items-center justify-center p-4">
        <div className="text-center animate-bounce-in">
          <div className="text-6xl mb-6">🔐</div>
          <h2 className="text-3xl font-bold mb-4 text-gradient">Connect Your Wallet</h2>
          <p className="text-slate-400 mb-8">Please connect your wallet to view your profile</p>
          <Link
            href="/"
            className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 px-8 py-4 rounded-xl font-bold text-lg transition-all inline-block shadow-lg shadow-cyan-500/30"
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
    <div className="min-h-screen bg-gradient-to-b from-[#030712] via-[#0f172a] to-[#030712] text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8 animate-slide-up">
          <h1 className="text-5xl font-bold mb-3 text-gradient">
            Player Profile
          </h1>
          <p className="text-slate-400 text-lg font-mono">
            {formatAddress(address)}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center gap-4 mb-8">
          <Link
            href="/"
            className="glass-card hover:border-cyan-500/50 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105"
          >
            ← Back to Game
          </Link>
          <Link
            href="/leaderboard"
            className="glass-card hover:border-cyan-500/50 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105"
          >
            🏆 Leaderboard
          </Link>
          <Link
            href="/badges"
            className="glass-card hover:border-cyan-500/50 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105"
          >
            🏅 Badges
          </Link>
        </div>

        {loadingStats ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-500 border-t-transparent"></div>
          </div>
        ) : playerStats ? (
          <>
            {/* Main Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Score */}
              <div className="glass-card border-2 border-cyan-500/30 rounded-2xl p-6 text-center transform hover:scale-105 transition-all animate-slide-up">
                <div className="text-4xl mb-2">🎯</div>
                <p className="text-sm text-slate-400 mb-1">Total Score</p>
                <p className="text-3xl font-bold text-gradient">
                  {Number(totalScore).toLocaleString()}
                </p>
              </div>

              {/* Total Coins */}
              <div className="glass-card border-2 border-orange-500/30 rounded-2xl p-6 text-center transform hover:scale-105 transition-all animate-slide-up" style={{ animationDelay: '100ms' }}>
                <div className="text-4xl mb-2">💰</div>
                <p className="text-sm text-slate-400 mb-1">Total Coins</p>
                <p className="text-3xl font-bold text-gradient-warm">
                  {Number(totalCoins).toLocaleString()}
                </p>
              </div>

              {/* Highest Level */}
              <div className="glass-card border-2 border-blue-500/30 rounded-2xl p-6 text-center transform hover:scale-105 transition-all animate-slide-up" style={{ animationDelay: '200ms' }}>
                <div className="text-4xl mb-2">🎮</div>
                <p className="text-sm text-slate-400 mb-1">Highest Level</p>
                <p className="text-3xl font-bold text-blue-300">
                  {Number(highestLevel)}
                </p>
              </div>

              {/* Games Played */}
              <div className="glass-card border-2 border-emerald-500/30 rounded-2xl p-6 text-center transform hover:scale-105 transition-all animate-slide-up" style={{ animationDelay: '300ms' }}>
                <div className="text-4xl mb-2">🕹️</div>
                <p className="text-sm text-slate-400 mb-1">Games Played</p>
                <p className="text-3xl font-bold text-emerald-300">
                  {Number(gamesPlayed)}
                </p>
              </div>
            </div>

            {/* Rank and Badges */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Global Rank */}
              <div className="glass-card border-2 border-cyan-500/30 rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-6 text-cyan-300 flex items-center gap-3">
                  <span>🏆</span> Global Ranking
                </h3>
                {rank ? (
                  <div className="text-center">
                    <p className="text-6xl font-bold text-gradient mb-2">
                      #{rank}
                    </p>
                    <p className="text-slate-400">
                      {rank === 1 && '🥇 You\'re #1!'}
                      {rank === 2 && '🥈 Almost there!'}
                      {rank === 3 && '🥉 Great job!'}
                      {rank > 3 && rank <= 10 && '🌟 Top 10!'}
                      {rank > 10 && '💪 Keep climbing!'}
                    </p>
                  </div>
                ) : (
                  <div className="text-center text-slate-500">
                    <p className="text-2xl mb-2">Not ranked yet</p>
                    <p className="text-sm">Play more to get ranked!</p>
                  </div>
                )}
              </div>

              {/* Badge Collection */}
              <div className="glass-card border-2 border-orange-500/30 rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-6 text-orange-300 flex items-center gap-3">
                  <span>🏅</span> Badge Collection
                </h3>
                <div className="text-center mb-4">
                  <p className="text-6xl font-bold text-gradient-warm mb-2">
                    {Number(badgeCount)}
                  </p>
                  <p className="text-slate-400">
                    out of 20 badges earned
                  </p>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3 mb-2">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-amber-500 h-3 rounded-full transition-all"
                    style={{ width: `${(Number(badgeCount) / 20) * 100}%` }}
                  ></div>
                </div>
                <p className="text-center text-xs text-slate-500">
                  {Math.round((Number(badgeCount) / 20) * 100)}% complete
                </p>
              </div>
            </div>

            {/* Recent Badges */}
            {recentBadges.length > 0 && (
              <div className="glass-card border-2 border-cyan-500/30 rounded-2xl p-8 mb-8">
                <h3 className="text-2xl font-bold mb-6 text-cyan-300 flex items-center gap-3">
                  <span>✨</span> Recently Earned Badges
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {recentBadges.map(badgeId => (
                    <div
                      key={badgeId}
                      className="bg-slate-800/50 rounded-xl p-4 border border-orange-500/30 text-center transform hover:scale-105 transition-all"
                    >
                      <div className="text-5xl mb-2">{getBadgeIcon(badgeId)}</div>
                      <p className="font-bold text-gradient-warm">{getBadgeName(badgeId)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activity Stats */}
            <div className="glass-card border-2 border-cyan-500/30 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6 text-cyan-300 flex items-center gap-3">
                <span>📊</span> Activity Stats
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Average Score per Game</span>
                  <span className="text-xl font-bold text-gradient">
                    {Number(gamesPlayed) > 0
                      ? Math.round(Number(totalScore) / Number(gamesPlayed)).toLocaleString()
                      : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Average Coins per Game</span>
                  <span className="text-xl font-bold text-gradient-warm">
                    {Number(gamesPlayed) > 0
                      ? Math.round(Number(totalCoins) / Number(gamesPlayed)).toLocaleString()
                      : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Last Played</span>
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
                className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white px-12 py-5 rounded-xl text-xl font-bold transition-all transform hover:scale-105 inline-block shadow-lg shadow-cyan-500/30"
              >
                🎮 Play More Games
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-20 animate-bounce-in">
            <div className="text-6xl mb-4">🎮</div>
            <h3 className="text-2xl font-bold text-slate-400 mb-2">No Game History</h3>
            <p className="text-slate-500 mb-6">Start playing to build your profile!</p>
            <Link
              href="/"
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 px-8 py-4 rounded-xl font-bold text-lg transition-all inline-block shadow-lg shadow-cyan-500/30"
            >
              Play Now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
