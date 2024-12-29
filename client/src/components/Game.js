import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import "./Game.css"; // Import the CSS file

const socket = io("http://localhost:5000");

const Game = () => {
    const [gameId, setGameId] = useState("");
    const [player, setPlayer] = useState("");
    const [board, setBoard] = useState(Array(9).fill(null));
    const [turn, setTurn] = useState("");
    const [message, setMessage] = useState("");
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState(null);
    const [winningLine, setWinningLine] = useState([]);

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

        socket.on("gameOver", ({ winner, line }) => {
            setGameOver(true);
            setWinner(winner);
            setWinningLine(line || []);
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

    const resetGame = () => {
        setBoard(Array(9).fill(null));
        setTurn("");
        setMessage("");
        setGameOver(false);
        setWinner(null);
        setWinningLine([]);
    };

    return (
        <div className="container">
            <h1 className="title">Tic Tac Toe</h1>
            {!gameId && (
                <button onClick={createGame} className="button">Create Game</button>
            )}
            <div className="input-group">
                <input
                    type="text"
                    placeholder="Enter game ID"
                    value={gameId}
                    onChange={(e) => setGameId(e.target.value)}
                    disabled={!!gameId}
                    className="input"
                />
                <input
                    type="text"
                    placeholder="Enter 'O' or 'X'"
                    value={player}
                    onChange={(e) => setPlayer(e.target.value.toUpperCase())}
                    disabled={!!player}
                    className="input"
                />
                <button onClick={joinGame} className="button">Join Game</button>
            </div>
            <p className="message">{message}</p>
            <div className="board">
                {board.map((cell, idx) => (
                    <div
                        key={idx}
                        onClick={() => makeMove(idx)}
                        className={`cell ${winningLine.includes(idx) ? "winning-cell" : ""}`}
                    >
                        {cell}
                    </div>
                ))}
            </div>
            {gameOver && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>{winner ? `${winner} Wins!` : "It's a Draw!"}</h2>
                        <button onClick={resetGame} className="button">Play Again</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Game;
