import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

const Game = () => {
    const [gameId, setGameId] = useState("");
    const [player, setPlayer] = useState("");
    const [board, setBoard] = useState(Array(9).fill(null));
    const [turn, setTurn] = useState("");
    const [message, setMessage] = useState("");
    const [gameOver, setGameOver] = useState(false);

    const createGame = () => {
        const id = Math.random().toString(36).substr(2, 9);
        setGameId(id);
        setMessage(`Game created! Share this ID: ${id}`);
    };

    const joinGame = () => {
        if (gameId && player) {
            socket.emit("joinGame", { gameId, player });
        }
    };

    useEffect(() => {
        socket.on("updatePlayers", (players) => {
            setMessage(`${players.length} player(s) in the game.`);
        });

        socket.on("gameReady", ({ turn }) => {
            setTurn(turn);
            setMessage("Game started! It's " + turn + "'s turn.");
        });

        socket.on("moveMade", ({ board, turn }) => {
            setBoard(board);
            setTurn(turn);
            setMessage("It's " + turn + "'s turn.");
        });

        socket.on("gameOver", ({ winner }) => {
            setGameOver(true);
            if (winner) {
                setMessage(`${winner} wins!`);
            } else {
                setMessage("It's a draw!");
            }
        });

        socket.on("invalidMove", ({ message }) => {
            setMessage(message);
        });

        return () => {
            socket.off("updatePlayers");
            socket.off("gameReady");
            socket.off("moveMade");
            socket.off("gameOver");
            socket.off("invalidMove");
        };
    }, []);

    const makeMove = (position) => {
        if (!gameOver && board[position] === null && player === turn) {
            socket.emit("makeMove", { gameId, symbol: player, position });
        }
    };

    return (
        <div>
            <h1>Tic Tac Toe</h1>
            {!gameId && (
                <button onClick={createGame}>Create Game</button>
            )}
            <input
                type="text"
                placeholder="Enter game ID"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                disabled={!!gameId}
            />
            <input
                type="text"
                placeholder="Enter 'O' or 'X'"
                value={player}
                onChange={(e) => setPlayer(e.target.value.toUpperCase())}
                disabled={!!player}
            />
            <button onClick={joinGame}>Join Game</button>
            <p>{message}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 100px)", gap: "5px" }}>
                {board.map((cell, idx) => (
                    <div
                        key={idx}
                        onClick={() => makeMove(idx)}
                        style={{
                            width: "100px",
                            height: "100px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px solid black",
                            fontSize: "24px",
                        }}
                    >
                        {cell}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Game;
