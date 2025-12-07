// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MathDevilGame {
    struct Player {
        uint256 totalPoints;
        uint256 highestLevel;
        uint256 gamesPlayed;
        uint256 lastPlayedTimestamp;
    }

    struct Badge {
        string name;
        string description;
        uint256 requirement;
        bool active;
    }

    mapping(address => Player) public players;
    mapping(address => mapping(uint256 => bool)) public playerBadges;
    mapping(uint256 => Badge) public badges;

    address[] public leaderboard;
    uint256 public badgeCount;

    event GameCompleted(address indexed player, uint256 level, uint256 points, uint256 timestamp);
    event BadgeEarned(address indexed player, uint256 badgeId, string badgeName);
    event NewHighScore(address indexed player, uint256 points);

    constructor() {
        // Initialize badges
        _createBadge("Math Novice", "Complete 5 games", 5);
        _createBadge("Math Warrior", "Reach level 10", 10);
        _createBadge("Math Master", "Score 1000 points", 1000);
        _createBadge("Troll Survivor", "Complete 20 games", 20);
        _createBadge("Speed Demon", "Complete a level in under 30 seconds", 1);
    }

    function _createBadge(string memory name, string memory description, uint256 requirement) private {
        badges[badgeCount] = Badge(name, description, requirement, true);
        badgeCount++;
    }

    function submitScore(uint256 level, uint256 points) external {
        Player storage player = players[msg.sender];

        // Update player stats
        player.totalPoints += points;
        player.gamesPlayed++;
        player.lastPlayedTimestamp = block.timestamp;

        if (level > player.highestLevel) {
            player.highestLevel = level;
        }

        // Check and award badges
        _checkBadges(msg.sender);

        // Update leaderboard
        _updateLeaderboard(msg.sender);

        emit GameCompleted(msg.sender, level, points, block.timestamp);
        emit NewHighScore(msg.sender, player.totalPoints);
    }

    function _checkBadges(address playerAddress) private {
        Player memory player = players[playerAddress];

        // Badge 0: Math Novice - 5 games
        if (player.gamesPlayed >= 5 && !playerBadges[playerAddress][0]) {
            playerBadges[playerAddress][0] = true;
            emit BadgeEarned(playerAddress, 0, "Math Novice");
        }

        // Badge 1: Math Warrior - Level 10
        if (player.highestLevel >= 10 && !playerBadges[playerAddress][1]) {
            playerBadges[playerAddress][1] = true;
            emit BadgeEarned(playerAddress, 1, "Math Warrior");
        }

        // Badge 2: Math Master - 1000 points
        if (player.totalPoints >= 1000 && !playerBadges[playerAddress][2]) {
            playerBadges[playerAddress][2] = true;
            emit BadgeEarned(playerAddress, 2, "Math Master");
        }

        // Badge 3: Troll Survivor - 20 games
        if (player.gamesPlayed >= 20 && !playerBadges[playerAddress][3]) {
            playerBadges[playerAddress][3] = true;
            emit BadgeEarned(playerAddress, 3, "Troll Survivor");
        }
    }

    function _updateLeaderboard(address playerAddress) private {
        bool playerExists = false;

        for (uint256 i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i] == playerAddress) {
                playerExists = true;
                break;
            }
        }

        if (!playerExists) {
            leaderboard.push(playerAddress);
        }
    }

    function getLeaderboard(uint256 limit) external view returns (address[] memory, uint256[] memory) {
        uint256 length = leaderboard.length > limit ? limit : leaderboard.length;
        address[] memory topPlayers = new address[](length);
        uint256[] memory topScores = new uint256[](length);

        // Create a copy for sorting
        address[] memory sortedPlayers = new address[](leaderboard.length);
        for (uint256 i = 0; i < leaderboard.length; i++) {
            sortedPlayers[i] = leaderboard[i];
        }

        // Simple bubble sort (good enough for demo)
        for (uint256 i = 0; i < sortedPlayers.length; i++) {
            for (uint256 j = i + 1; j < sortedPlayers.length; j++) {
                if (players[sortedPlayers[j]].totalPoints > players[sortedPlayers[i]].totalPoints) {
                    address temp = sortedPlayers[i];
                    sortedPlayers[i] = sortedPlayers[j];
                    sortedPlayers[j] = temp;
                }
            }
        }

        // Get top players
        for (uint256 i = 0; i < length; i++) {
            topPlayers[i] = sortedPlayers[i];
            topScores[i] = players[sortedPlayers[i]].totalPoints;
        }

        return (topPlayers, topScores);
    }

    function getPlayerStats(address playerAddress) external view returns (
        uint256 totalPoints,
        uint256 highestLevel,
        uint256 gamesPlayed,
        uint256 lastPlayed
    ) {
        Player memory player = players[playerAddress];
        return (
            player.totalPoints,
            player.highestLevel,
            player.gamesPlayed,
            player.lastPlayedTimestamp
        );
    }

    function getPlayerBadges(address playerAddress) external view returns (uint256[] memory) {
        uint256 earnedCount = 0;

        for (uint256 i = 0; i < badgeCount; i++) {
            if (playerBadges[playerAddress][i]) {
                earnedCount++;
            }
        }

        uint256[] memory earnedBadges = new uint256[](earnedCount);
        uint256 index = 0;

        for (uint256 i = 0; i < badgeCount; i++) {
            if (playerBadges[playerAddress][i]) {
                earnedBadges[index] = i;
                index++;
            }
        }

        return earnedBadges;
    }

    function getBadgeInfo(uint256 badgeId) external view returns (
        string memory name,
        string memory description,
        uint256 requirement,
        bool active
    ) {
        Badge memory badge = badges[badgeId];
        return (badge.name, badge.description, badge.requirement, badge.active);
    }
}
