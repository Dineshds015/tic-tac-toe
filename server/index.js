const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

const PORT = 5000;

let games = {}; // Store game states by gameId

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("joinGame", ({ gameId, player }) => {
        if (!games[gameId]) {
            games[gameId] = { players: [], board: Array(9).fill(null), turn: "O" };
        }

        if (games[gameId].players.length < 2) {
            games[gameId].players.push({ id: socket.id, symbol: player });
            socket.join(gameId);

            io.to(gameId).emit("updatePlayers", games[gameId].players);
        }

        if (games[gameId].players.length === 2) {
            io.to(gameId).emit("gameReady", { turn: games[gameId].turn });
        }
    });

    socket.on("makeMove", ({ gameId, symbol, position }) => {
        const game = games[gameId];
        if (game && game.players.length === 2) {
            if (symbol === game.turn && !game.board[position]) {
                game.board[position] = symbol;

                // Check for win
                if (checkWinner(game.board, symbol)) {
                    io.to(gameId).emit("gameOver", { winner: symbol });
                    delete games[gameId];
                    return;
                }

                // Check for draw
                if (game.board.every((cell) => cell !== null)) {
                    io.to(gameId).emit("gameOver", { winner: null }); // Null means draw
                    delete games[gameId];
                    return;
                }

                // Switch turn
                game.turn = game.turn === "O" ? "X" : "O";
                io.to(gameId).emit("moveMade", { board: game.board, turn: game.turn });
            } else {
                socket.emit("invalidMove", { message: "Invalid move or not your turn!" });
            }
        }
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected:", socket.id);
        Object.keys(games).forEach((gameId) => {
            games[gameId].players = games[gameId].players.filter((p) => p.id !== socket.id);
            if (games[gameId].players.length === 0) {
                delete games[gameId];
            }
        });
    });
});

const checkWinner = (board, symbol) => {
    const WINNING_COMBINATIONS = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6],           // Diagonals
    ];
    return WINNING_COMBINATIONS.some((combination) =>
        combination.every((index) => board[index] === symbol)
    );
};

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
