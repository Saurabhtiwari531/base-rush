// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * BaseRushLeaderboard
 *
 * A weekly top-3 leaderboard for the Base Rush game.
 *
 * Fixes the bug in the old contract: there, resetLeaderboard() cleared the
 * visible top 3 but NOT each wallet's stored best, so after a reset returning
 * players could never get back on the board (they had to beat their all-time
 * best instead of starting from 0).
 *
 * Here every score is namespaced by a `season`. resetLeaderboard() just bumps
 * the season, which logically wipes ALL stored bests + the top 3 in one step —
 * so every week truly starts from zero.
 *
 * Kept compatible with the existing frontend: submitScore(uint256) and
 * getTop3() have the exact same signatures as before.
 */
contract BaseRushLeaderboard {
    address public owner;
    uint256 public season;     // current week; bumping it wipes the board
    uint256 public maxScore;   // anti-cheat cap (0 = disabled)

    // Top 3 of the CURRENT season
    address[3] private topAddr;
    uint256[3] private topScore;

    // season => player => best score this season
    mapping(uint256 => mapping(address => uint256)) private bestOf;

    event ScoreSubmitted(address indexed player, uint256 score, uint256 indexed season);
    event LeaderboardReset(uint256 indexed newSeason, address indexed by);
    event OwnershipTransferred(address indexed from, address indexed to);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    // ── PLAYER ────────────────────────────────────────────────────────────
    /// Submit a score. Only your single BEST score per season counts, and each
    /// wallet holds at most one slot. Lower-than-best scores are accepted by the
    /// tx but simply ignored (no revert) so the game UI never shows an error.
    function submitScore(uint256 _score) external {
        require(_score > 0, "score must be > 0");
        if (maxScore != 0) {
            require(_score <= maxScore, "score above cap");
        }

        // Not a new personal best for this season → nothing to do.
        if (_score <= bestOf[season][msg.sender]) return;
        bestOf[season][msg.sender] = _score;

        _placeOnBoard(msg.sender, _score);
        emit ScoreSubmitted(msg.sender, _score, season);
    }

    function _placeOnBoard(address player, uint256 score) internal {
        // Remove the player's existing slot (dedup → one slot per wallet).
        for (uint256 i = 0; i < 3; i++) {
            if (topAddr[i] == player) {
                for (uint256 j = i; j < 2; j++) {
                    topAddr[j] = topAddr[j + 1];
                    topScore[j] = topScore[j + 1];
                }
                topAddr[2] = address(0);
                topScore[2] = 0;
                break;
            }
        }
        // Insert if it beats 3rd place (or a free slot).
        if (score > topScore[2]) {
            uint256 pos = 2;
            if (score > topScore[1]) pos = 1;
            if (score > topScore[0]) pos = 0;
            for (uint256 k = 2; k > pos; k--) {
                topAddr[k] = topAddr[k - 1];
                topScore[k] = topScore[k - 1];
            }
            topAddr[pos] = player;
            topScore[pos] = score;
        }
    }

    // ── VIEWS (same shape as the old contract) ────────────────────────────
    function getTop3()
        external
        view
        returns (address, uint256, address, uint256, address, uint256)
    {
        return (topAddr[0], topScore[0], topAddr[1], topScore[1], topAddr[2], topScore[2]);
    }

    /// Best score of `player` in the CURRENT season (0 after a reset).
    function getPlayerScore(address player) external view returns (uint256) {
        return bestOf[season][player];
    }

    // ── OWNER ─────────────────────────────────────────────────────────────
    /// Start a fresh week: wipes the top 3 AND every player's stored best.
    function resetLeaderboard() external onlyOwner {
        season += 1;
        delete topAddr;
        delete topScore;
        emit LeaderboardReset(season, msg.sender);
    }

    /// Reject obviously-fake scores above `_max`. Set 0 to disable. (Basic
    /// anti-cheat; a full fix needs backend-signed scores.)
    function setMaxScore(uint256 _max) external onlyOwner {
        maxScore = _max;
    }

    /// Hand the admin role to a new wallet (the old contract couldn't do this).
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /// Pull out any ETH accidentally sent to the contract.
    function withdraw() external onlyOwner {
        (bool ok, ) = payable(owner).call{value: address(this).balance}("");
        require(ok, "withdraw failed");
    }

    receive() external payable {}
}
