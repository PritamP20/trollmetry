'use client';

import { useEffect, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { GAME_CONTRACT_ADDRESS, GAME_CONTRACT_ABI } from '@/lib/contract';
import Link from 'next/link';

interface BadgeMetadata {
  name: string;
  description: string;
  levelRequirement: bigint;
  scoreRequirement: bigint;
  coinsRequirement: bigint;
  gamesRequirement: bigint;
  isActive: boolean;
  imageURI: string;
}

export default function BadgesPage() {
  const { address } = useAccount();
  const [badges, setBadges] = useState<BadgeMetadata[]>([]);

  // Get total badge types
  const { data: totalBadgeTypes } = useReadContract({
    address: GAME_CONTRACT_ADDRESS,
    abi: GAME_CONTRACT_ABI,
    functionName: 'getTotalBadgeTypes',
  });

  // Get player's earned badges
  const { data: playerBadges } = useReadContract({
    address: GAME_CONTRACT_ADDRESS,
    abi: GAME_CONTRACT_ABI,
    functionName: 'getPlayerBadges',
    args: address ? [address] : undefined,
  });

  // Get player stats
  const { data: playerStats } = useReadContract({
    address: GAME_CONTRACT_ADDRESS,
    abi: GAME_CONTRACT_ABI,
    functionName: 'getPlayerStats',
    args: address ? [address] : undefined,
  });

  // Fetch all badge metadata
  useEffect(() => {
    const fetchBadges = async () => {
      if (!totalBadgeTypes) return;

      const badgePromises = [];
      for (let i = 1; i <= Number(totalBadgeTypes); i++) {
        badgePromises.push(
          fetch(`/api/badge/${i}`)
            .then(res => res.json())
            .catch(() => null)
        );
      }

      // Fallback: use contract directly
      const allBadges: BadgeMetadata[] = [];
      for (let i = 1; i <= Number(totalBadgeTypes); i++) {
        try {
          allBadges.push({
            name: `Badge ${i}`,
            description: 'Achievement badge',
            levelRequirement: BigInt(0),
            scoreRequirement: BigInt(0),
            coinsRequirement: BigInt(0),
            gamesRequirement: BigInt(0),
            isActive: true,
            imageURI: ''
          });
        } catch (error) {
          console.error(`Error fetching badge ${i}:`, error);
        }
      }
      setBadges(allBadges);
    };

    fetchBadges();
  }, [totalBadgeTypes]);

  const earnedBadgeIds = (playerBadges as bigint[]) || [];

  const getBadgeIcon = (badgeName: string) => {
    if (badgeName.includes('Beginner')) return '🎯';
    if (badgeName.includes('Amateur')) return '⭐';
    if (badgeName.includes('Skilled')) return '💫';
    if (badgeName.includes('Expert')) return '🌟';
    if (badgeName.includes('Master')) return '👑';
    if (badgeName.includes('Legendary')) return '🏆';
    if (badgeName.includes('Point')) return '💯';
    if (badgeName.includes('Coin')) return '💰';
    if (badgeName.includes('Player')) return '🎮';
    if (badgeName.includes('Triple')) return '🎯';
    if (badgeName.includes('Ultimate')) return '👹';
    return '🏅';
  };

  const getRequirementText = (badge: BadgeMetadata) => {
    const reqs = [];
    if (badge.levelRequirement > 0) reqs.push(`Level ${badge.levelRequirement}`);
    if (badge.scoreRequirement > 0) reqs.push(`${Number(badge.scoreRequirement).toLocaleString()} points`);
    if (badge.coinsRequirement > 0) reqs.push(`${Number(badge.coinsRequirement).toLocaleString()} coins`);
    if (badge.gamesRequirement > 0) reqs.push(`${badge.gamesRequirement} games`);
    return reqs.join(' + ') || 'Play the game';
  };

  const checkProgress = (badge: BadgeMetadata) => {
    if (!playerStats) return 0;

    const [totalScore, totalCoins, highestLevel, gamesPlayed] = playerStats as [bigint, bigint, bigint, bigint, bigint, bigint];

    let completedRequirements = 0;
    let totalRequirements = 0;

    if (badge.levelRequirement > 0) {
      totalRequirements++;
      if (highestLevel >= badge.levelRequirement) completedRequirements++;
    }
    if (badge.scoreRequirement > 0) {
      totalRequirements++;
      if (totalScore >= badge.scoreRequirement) completedRequirements++;
    }
    if (badge.coinsRequirement > 0) {
      totalRequirements++;
      if (totalCoins >= badge.coinsRequirement) completedRequirements++;
    }
    if (badge.gamesRequirement > 0) {
      totalRequirements++;
      if (gamesPlayed >= badge.gamesRequirement) completedRequirements++;
    }

    return totalRequirements > 0 ? (completedRequirements / totalRequirements) * 100 : 0;
  };

  // Badge categories based on index (matching contract)
  const badgeCategories = [
    { name: 'Level Badges', range: [1, 6], icon: '🎯' },
    { name: 'Score Badges', range: [7, 10], icon: '💯' },
    { name: 'Coin Badges', range: [11, 14], icon: '💰' },
    { name: 'Activity Badges', range: [15, 18], icon: '🎮' },
    { name: 'Special Badges', range: [19, 20], icon: '👹' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#030712] via-[#0f172a] to-[#030712] text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8 animate-slide-up">
          <h1 className="text-5xl font-bold mb-3 text-gradient-warm">
            Achievement Badges
          </h1>
          <p className="text-slate-400 text-lg">
            Collect {totalBadgeTypes ? Number(totalBadgeTypes) : 20} unique NFT badges
          </p>

          {address && playerBadges && (
            <div className="mt-4 inline-block glass-card rounded-xl px-6 py-3 border border-orange-500/30">
              <p className="text-orange-300">
                Your Collection: <span className="text-2xl font-bold text-gradient-warm">
                  {(playerBadges as bigint[]).length} / {totalBadgeTypes ? Number(totalBadgeTypes) : 20}
                </span>
              </p>
            </div>
          )}
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
            href="/profile"
            className="glass-card hover:border-cyan-500/50 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105"
          >
            👤 My Profile
          </Link>
        </div>

        {/* Badge Categories */}
        {badgeCategories.map((category, catIndex) => (
          <div key={catIndex} className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">{category.icon}</span>
              <h2 className="text-3xl font-bold text-gradient">{category.name}</h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: category.range[1] - category.range[0] + 1 }, (_, i) => {
                const badgeId = category.range[0] + i;
                const isEarned = earnedBadgeIds.includes(BigInt(badgeId));
                const progress = address ? checkProgress(badges[badgeId - 1] || {} as BadgeMetadata) : 0;

                // Badge names and descriptions (matching contract)
                const badgeInfo = getBadgeInfo(badgeId);

                return (
                  <div
                    key={badgeId}
                    className={`relative glass-card rounded-2xl border-2 p-6 transition-all transform hover:scale-105 animate-slide-up ${isEarned
                        ? 'border-orange-500 shadow-lg shadow-orange-500/20'
                        : 'border-slate-700/50 opacity-70'
                      }`}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    {isEarned && (
                      <div className="absolute -top-3 -right-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-lg">
                        ✓
                      </div>
                    )}

                    <div className="text-center">
                      <div className={`text-6xl mb-4 ${!isEarned && 'grayscale opacity-50'}`}>
                        {getBadgeIcon(badgeInfo.name)}
                      </div>

                      <h3 className="text-xl font-bold mb-2 text-cyan-300">
                        {badgeInfo.name}
                      </h3>

                      <p className="text-sm text-slate-400 mb-4">
                        {badgeInfo.description}
                      </p>

                      <div className="bg-slate-800/50 rounded-xl p-3 mb-3 border border-slate-700">
                        <p className="text-xs text-slate-500 mb-1">Requirements:</p>
                        <p className="text-sm font-semibold text-gradient-warm">
                          {badgeInfo.requirement}
                        </p>
                      </div>

                      {!isEarned && address && (
                        <div className="mt-4">
                          <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
                            <div
                              className="bg-gradient-to-r from-cyan-500 to-teal-500 h-2 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-slate-500">
                            {Math.round(progress)}% Complete
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {!address && (
          <div className="text-center py-20 animate-bounce-in">
            <div className="text-6xl mb-4">🔐</div>
            <h3 className="text-2xl font-bold text-slate-400 mb-2">Connect Wallet</h3>
            <p className="text-slate-500">Connect your wallet to see your badge collection!</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Badge information matching the contract
function getBadgeInfo(badgeId: number) {
  const badgeData: Record<number, { name: string; description: string; requirement: string }> = {
    1: { name: 'Beginner Troll', description: 'Complete Level 1', requirement: 'Complete Level 1' },
    2: { name: 'Amateur Troll', description: 'Complete Level 5', requirement: 'Complete Level 5' },
    3: { name: 'Skilled Troll', description: 'Complete Level 10', requirement: 'Complete Level 10' },
    4: { name: 'Expert Troll', description: 'Complete Level 20', requirement: 'Complete Level 20' },
    5: { name: 'Master Troll', description: 'Complete Level 30', requirement: 'Complete Level 30' },
    6: { name: 'Legendary Troll', description: 'Complete Level 50', requirement: 'Complete Level 50' },
    7: { name: 'Point Collector', description: 'Earn 1,000 points', requirement: '1,000 points' },
    8: { name: 'Point Hunter', description: 'Earn 5,000 points', requirement: '5,000 points' },
    9: { name: 'Point Master', description: 'Earn 10,000 points', requirement: '10,000 points' },
    10: { name: 'Point Legend', description: 'Earn 50,000 points', requirement: '50,000 points' },
    11: { name: 'Coin Finder', description: 'Collect 100 coins', requirement: '100 coins' },
    12: { name: 'Coin Collector', description: 'Collect 500 coins', requirement: '500 coins' },
    13: { name: 'Coin Hoarder', description: 'Collect 1,000 coins', requirement: '1,000 coins' },
    14: { name: 'Coin Tycoon', description: 'Collect 5,000 coins', requirement: '5,000 coins' },
    15: { name: 'Casual Player', description: 'Play 10 games', requirement: '10 games played' },
    16: { name: 'Dedicated Player', description: 'Play 50 games', requirement: '50 games played' },
    17: { name: 'Hardcore Player', description: 'Play 100 games', requirement: '100 games played' },
    18: { name: 'Addicted Player', description: 'Play 500 games', requirement: '500 games played' },
    19: { name: 'Triple Threat', description: 'Level 15 + 5K points + 500 coins', requirement: 'Level 15 + 5,000 points + 500 coins' },
    20: { name: 'Ultimate Troll', description: 'Level 40 + 25K points + 2.5K coins', requirement: 'Level 40 + 25,000 points + 2,500 coins' },
  };

  return badgeData[badgeId] || { name: 'Unknown Badge', description: 'Mystery badge', requirement: 'Unknown' };
}
