'use client';

import { useEffect, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { GAME_CONTRACT_ADDRESS, GAME_CONTRACT_ABI } from '@/lib/contract';
import { theme } from '@/lib/theme';
import Link from 'next/link';

interface LeaderboardEntry {
  player: string;
  totalScore: bigint;
  totalCoins: bigint;
  highestLevel: bigint;
  badgeCount: bigint;
}

export default function LeaderboardPage() {
  const { address } = useAccount();
  const [selectedTab, setSelectedTab] = useState<'score' | 'coins'>('score');
  const [userRank, setUserRank] = useState<number | null>(null);

  // Fetch leaderboard by score
  const { data: scoreLeaderboard, isLoading: loadingScore } = useReadContract({
    address: GAME_CONTRACT_ADDRESS,
    abi: GAME_CONTRACT_ABI,
    functionName: 'getLeaderboard',
    args: [BigInt(50)],
  });

  // Fetch leaderboard by coins
  const { data: coinsLeaderboard, isLoading: loadingCoins } = useReadContract({
    address: GAME_CONTRACT_ADDRESS,
    abi: GAME_CONTRACT_ABI,
    functionName: 'getLeaderboardByCoins',
    args: [BigInt(50)],
  });

  // Fetch total players
  const { data: totalPlayers } = useReadContract({
    address: GAME_CONTRACT_ADDRESS,
    abi: GAME_CONTRACT_ABI,
    functionName: 'getTotalPlayers',
  });

  const currentLeaderboard = selectedTab === 'score' ? scoreLeaderboard : coinsLeaderboard;
  const isLoading = selectedTab === 'score' ? loadingScore : loadingCoins;

  useEffect(() => {
    if (currentLeaderboard && address) {
      const rank = (currentLeaderboard as LeaderboardEntry[]).findIndex(
        entry => entry.player.toLowerCase() === address.toLowerCase()
      );
      setUserRank(rank !== -1 ? rank + 1 : null);
    }
  }, [currentLeaderboard, address]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#030712] via-[#0f172a] to-[#030712] text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8 animate-slide-up">
          <h1 className="text-5xl font-bold mb-3 text-gradient">
            Global Leaderboard
          </h1>
          <p className="text-slate-400 text-lg">
            Compete with {totalPlayers ? Number(totalPlayers).toLocaleString() : '...'} players worldwide
          </p>

          {userRank && (
            <div className="mt-4 inline-block glass-card rounded-xl px-6 py-3">
              <p className="text-cyan-300">
                Your Rank: <span className="text-2xl font-bold text-gradient">{getRankEmoji(userRank)}</span>
              </p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setSelectedTab('score')}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${selectedTab === 'score'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30'
                : 'glass-card text-slate-400 hover:text-white'
              }`}
          >
            🏆 Top by Score
          </button>
          <button
            onClick={() => setSelectedTab('coins')}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${selectedTab === 'coins'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30'
                : 'glass-card text-slate-400 hover:text-white'
              }`}
          >
            💰 Top by Coins
          </button>
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
            href="/badges"
            className="glass-card hover:border-cyan-500/50 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105"
          >
            🏅 View Badges
          </Link>
          <Link
            href="/profile"
            className="glass-card hover:border-cyan-500/50 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105"
          >
            👤 My Profile
          </Link>
        </div>

        {/* Leaderboard */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-500 border-t-transparent"></div>
          </div>
        ) : currentLeaderboard && (currentLeaderboard as LeaderboardEntry[]).length > 0 ? (
          <div className="space-y-3">
            {/* Top 3 */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {(currentLeaderboard as LeaderboardEntry[]).slice(0, 3).map((entry, index) => (
                <div
                  key={entry.player}
                  className={`glass-card p-6 rounded-2xl border-2 transform hover:scale-105 transition-all animate-slide-up ${index === 0
                      ? 'border-yellow-500 shadow-lg shadow-yellow-500/20'
                      : index === 1
                        ? 'border-slate-400 shadow-lg shadow-slate-400/20'
                        : 'border-orange-600 shadow-lg shadow-orange-600/20'
                    }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="text-center">
                    <div className="text-5xl mb-2">{getRankEmoji(index + 1)}</div>
                    <p className="text-sm text-slate-300 mb-2">
                      {formatAddress(entry.player)}
                    </p>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold text-gradient">
                        {selectedTab === 'score'
                          ? Number(entry.totalScore).toLocaleString()
                          : Number(entry.totalCoins).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-400">
                        {selectedTab === 'score' ? 'Points' : 'Coins'}
                      </p>
                      <div className="flex justify-center gap-4 text-xs mt-2">
                        <span>Lvl {Number(entry.highestLevel)}</span>
                        <span>🏅 {Number(entry.badgeCount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Rest of leaderboard */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-800/50 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Rank</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Player</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">
                      {selectedTab === 'score' ? 'Score' : 'Coins'}
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Level</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Badges</th>
                  </tr>
                </thead>
                <tbody>
                  {(currentLeaderboard as LeaderboardEntry[]).slice(3).map((entry, index) => (
                    <tr
                      key={entry.player}
                      className={`border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors ${address && entry.player.toLowerCase() === address.toLowerCase()
                          ? 'bg-cyan-900/20'
                          : ''
                        }`}
                    >
                      <td className="px-6 py-4 text-slate-400 font-semibold">
                        #{index + 4}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-xs font-bold">
                            {entry.player.slice(2, 4).toUpperCase()}
                          </div>
                          <span className="font-mono text-sm">
                            {formatAddress(entry.player)}
                          </span>
                          {address && entry.player.toLowerCase() === address.toLowerCase() && (
                            <span className="text-xs bg-cyan-600 px-2 py-1 rounded">You</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-lg font-bold text-cyan-300">
                          {selectedTab === 'score'
                            ? Number(entry.totalScore).toLocaleString()
                            : Number(entry.totalCoins).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-slate-700 px-3 py-1 rounded-full text-sm">
                          {Number(entry.highestLevel)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-orange-900/30 px-3 py-1 rounded-full text-sm">
                          🏅 {Number(entry.badgeCount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 animate-bounce-in">
            <div className="text-6xl mb-4">🎮</div>
            <h3 className="text-2xl font-bold text-slate-400 mb-2">No players yet!</h3>
            <p className="text-slate-500">Be the first to play and submit your score!</p>
          </div>
        )}
      </div>
    </div>
  );
}
