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
    <div className="min-h-screen bg-gradient-to-b from-[#0a0e27] via-[#151932] to-[#0a0e27] text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent">
            Global Leaderboard
          </h1>
          <p className="text-gray-400 text-lg">
            Compete with {totalPlayers ? Number(totalPlayers).toLocaleString() : '...'} players worldwide
          </p>

          {userRank && (
            <div className="mt-4 inline-block bg-purple-900/30 border border-purple-500/50 rounded-lg px-6 py-3">
              <p className="text-purple-300">
                Your Rank: <span className="text-2xl font-bold text-purple-400">{getRankEmoji(userRank)}</span>
              </p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setSelectedTab('score')}
            className={`px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 ${
              selectedTab === 'score'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                : 'bg-[#1e2139] text-gray-400 hover:bg-[#252941]'
            }`}
          >
            🏆 Top by Score
          </button>
          <button
            onClick={() => setSelectedTab('coins')}
            className={`px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 ${
              selectedTab === 'coins'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/50'
                : 'bg-[#1e2139] text-gray-400 hover:bg-[#252941]'
            }`}
          >
            💰 Top by Coins
          </button>
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
            href="/badges"
            className="bg-[#1e2139] hover:bg-[#252941] border border-purple-500/30 px-6 py-3 rounded-lg font-semibold transition-all"
          >
            🏅 View Badges
          </Link>
          <Link
            href="/profile"
            className="bg-[#1e2139] hover:bg-[#252941] border border-purple-500/30 px-6 py-3 rounded-lg font-semibold transition-all"
          >
            👤 My Profile
          </Link>
        </div>

        {/* Leaderboard */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-500"></div>
          </div>
        ) : currentLeaderboard && (currentLeaderboard as LeaderboardEntry[]).length > 0 ? (
          <div className="space-y-3">
            {/* Top 3 */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {(currentLeaderboard as LeaderboardEntry[]).slice(0, 3).map((entry, index) => (
                <div
                  key={entry.player}
                  className={`bg-gradient-to-br p-6 rounded-xl border-2 transform hover:scale-105 transition-all ${
                    index === 0
                      ? 'from-yellow-900/40 to-yellow-800/40 border-yellow-500 shadow-lg shadow-yellow-500/30'
                      : index === 1
                      ? 'from-gray-700/40 to-gray-600/40 border-gray-400 shadow-lg shadow-gray-400/30'
                      : 'from-orange-900/40 to-orange-800/40 border-orange-600 shadow-lg shadow-orange-600/30'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-5xl mb-2">{getRankEmoji(index + 1)}</div>
                    <p className="text-sm text-gray-300 mb-2">
                      {formatAddress(entry.player)}
                    </p>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold">
                        {selectedTab === 'score'
                          ? Number(entry.totalScore).toLocaleString()
                          : Number(entry.totalCoins).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400">
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
            <div className="bg-[#1e2139] rounded-xl border border-purple-500/30 overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#252941] border-b border-purple-500/30">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Rank</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Player</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">
                      {selectedTab === 'score' ? 'Score' : 'Coins'}
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Level</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">Badges</th>
                  </tr>
                </thead>
                <tbody>
                  {(currentLeaderboard as LeaderboardEntry[]).slice(3).map((entry, index) => (
                    <tr
                      key={entry.player}
                      className={`border-b border-purple-500/10 hover:bg-[#252941] transition-colors ${
                        address && entry.player.toLowerCase() === address.toLowerCase()
                          ? 'bg-purple-900/20'
                          : ''
                      }`}
                    >
                      <td className="px-6 py-4 text-gray-400 font-semibold">
                        #{index + 4}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-xs font-bold">
                            {entry.player.slice(2, 4).toUpperCase()}
                          </div>
                          <span className="font-mono text-sm">
                            {formatAddress(entry.player)}
                          </span>
                          {address && entry.player.toLowerCase() === address.toLowerCase() && (
                            <span className="text-xs bg-purple-600 px-2 py-1 rounded">You</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-lg font-bold text-purple-300">
                          {selectedTab === 'score'
                            ? Number(entry.totalScore).toLocaleString()
                            : Number(entry.totalCoins).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-blue-900/30 px-3 py-1 rounded-full text-sm">
                          {Number(entry.highestLevel)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-amber-900/30 px-3 py-1 rounded-full text-sm">
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
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎮</div>
            <h3 className="text-2xl font-bold text-gray-400 mb-2">No players yet!</h3>
            <p className="text-gray-500">Be the first to play and submit your score!</p>
          </div>
        )}
      </div>
    </div>
  );
}
