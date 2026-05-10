// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MonArena {
    uint256 public constant MIN_STAKE    = 10 ether;
    uint256 public constant MAX_STAKE    = 50_000 ether;
    uint256 public constant GAME_TIMEOUT = 30 minutes;
    uint256 public constant FEE_BPS      = 500;
    uint256 public constant BPS_DENOM    = 10_000;

    address payable public immutable FEE_WALLET;

    enum GameStatus { Waiting, Active, Resolved, Refunded }

    struct Game {
        bytes32    gameId;
        address[]  players;
        uint256    stake;
        uint256    totalPot;
        uint256    startTime;
        GameStatus status;
    }

    mapping(bytes32 => Game) private games;
    mapping(bytes32 => mapping(address => bytes32)) private seedCommits;
    mapping(bytes32 => mapping(bytes32 => bool)) private usedSigs;

    event GameCreated(bytes32 indexed gameId, address[] players, uint256 stake);
    event PlayerDeposited(bytes32 indexed gameId, address player);
    event GameStarted(bytes32 indexed gameId);
    event GameResolved(bytes32 indexed gameId, address winner);
    event GameRefunded(bytes32 indexed gameId);

    uint256 private _lock = 1;
    modifier nonReentrant() {
        require(_lock == 1, "Reentrant");
        _lock = 2; _; _lock = 1;
    }

    constructor(address payable _feeWallet) {
        require(_feeWallet != address(0));
        FEE_WALLET = _feeWallet;
    }

    function createGame(bytes32 gameId, address[] calldata players, uint256 stake) external {
        require(players.length >= 2 && players.length <= 4);
        require(stake >= MIN_STAKE && stake <= MAX_STAKE);
        require(games[gameId].gameId == bytes32(0));
        bool found = false;
        for (uint i = 0; i < players.length; i++) {
            if (players[i] == msg.sender) found = true;
        }
        require(found);
        games[gameId] = Game(gameId, players, stake, 0, block.timestamp, GameStatus.Waiting);
        emit GameCreated(gameId, players, stake);
    }

    function deposit(bytes32 gameId) external payable nonReentrant {
        Game storage g = games[gameId];
        require(g.status == GameStatus.Waiting);
        require(msg.value == g.stake);
        require(_isPlayer(g, msg.sender));
        g.totalPot += msg.value;
        if (g.totalPot == g.stake * g.players.length) {
            g.status = GameStatus.Active;
            g.startTime = block.timestamp;
            emit GameStarted(gameId);
        }
        emit PlayerDeposited(gameId, msg.sender);
    }

    function commitSeed(bytes32 gameId, bytes32 seedHash) external {
        require(games[gameId].status == GameStatus.Active);
        require(_isPlayer(games[gameId], msg.sender));
        seedCommits[gameId][msg.sender] = seedHash;
    }

    function resolveGame(bytes32 gameId, address winner, address[] calldata signers, bytes[] calldata sigs) external nonReentrant {
        Game storage g = games[gameId];
        require(g.status == GameStatus.Active);
        require(_isPlayer(g, winner));
        require(signers.length == sigs.length);
        require(signers.length >= g.players.length / 2 + 1);
        bytes32 message = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", keccak256(abi.encodePacked("MONARENA_RESOLVE", gameId, winner))));
        uint256 validSigs = 0;
        for (uint i = 0; i < signers.length; i++) {
            require(_isPlayer(g, signers[i]));
            bytes32 sh = keccak256(abi.encodePacked(signers[i], sigs[i]));
            require(!usedSigs[gameId][sh]);
            usedSigs[gameId][sh] = true;
            if (_recoverSigner(message, sigs[i]) == signers[i]) validSigs++;
        }
        require(validSigs >= g.players.length / 2 + 1);
        g.status = GameStatus.Resolved;
        uint256 fee = (g.totalPot * FEE_BPS) / BPS_DENOM;
        uint256 payout = g.totalPot - fee;
        (bool f,) = FEE_WALLET.call{value: fee}("");
        require(f);
        (bool p,) = payable(winner).call{value: payout}("");
        require(p);
        emit GameResolved(gameId, winner);
    }

    function refundGame(bytes32 gameId) external nonReentrant {
        Game storage g = games[gameId];
        require(g.status == GameStatus.Active || g.status == GameStatus.Waiting);
        require(block.timestamp > g.startTime + GAME_TIMEOUT);
        g.status = GameStatus.Refunded;
        for (uint i = 0; i < g.players.length; i++) {
            (bool s,) = payable(g.players[i]).call{value: g.stake}("");
            require(s);
        }
        emit GameRefunded(gameId);
    }

    function getGame(bytes32 gameId) external view returns (address[] memory, uint256, uint256, GameStatus) {
        Game storage g = games[gameId];
        return (g.players, g.stake, g.totalPot, g.status);
    }

    function _isPlayer(Game storage g, address addr) internal view returns (bool) {
        for (uint i = 0; i < g.players.length; i++) {
            if (g.players[i] == addr) return true;
        }
        return false;
    }

    function _recoverSigner(bytes32 message, bytes memory sig) internal pure returns (address) {
        require(sig.length == 65);
        bytes32 r; bytes32 s; uint8 v;
        assembly { r := mload(add(sig,32)) s := mload(add(sig,64)) v := byte(0,mload(add(sig,96))) }
        if (v < 27) v += 27;
        return ecrecover(message, v, r, s);
    }

    receive() external payable { revert("Use deposit()"); }
    fallback() external payable { revert("Use deposit()"); }
}
