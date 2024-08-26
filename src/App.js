import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
	const [ws, setWs] = useState(null);
	const [gameState, setGameState] = useState(null);
	const [selectedPiece, setSelectedPiece] = useState(null);
	const [setupPositions, setSetupPositions] = useState([]);
	const [setupComplete, setSetupComplete] = useState(false);
	const [moveHistory, setMoveHistory] = useState([]);
	const [possibleMoves, setPossibleMoves] = useState([]);

	useEffect(() => {
		const wsInstance = new WebSocket("ws://localhost:9000");
		setWs(wsInstance);

		wsInstance.onmessage = (event) => {
			const message = JSON.parse(event.data);

			if (message.type === "init") {
				setGameState(message.gameState);
			} else if (message.type === "update") {
				setGameState(message.gameState);
			} else if (message.type === "end") {
				alert(`Player ${message.winner} wins!`);
				// Handle end of game and reset
			} else if (message.type === "moveHistory") {
				setMoveHistory(message.data);
			}
		};

		return () => wsInstance.close();
	}, []);

	const handleSetupChange = (index, value) => {
		const newSetup = [...setupPositions];
		newSetup[index] = value;
		setSetupPositions(newSetup);
	};

	const handleSetupSubmit = () => {
		if (setupPositions.length === 5) {
			ws.send(
				JSON.stringify({
					type: "setup",
					data: { setupPositions },
				})
			);
			setSetupComplete(true);
		} else {
			alert("Please place all 5 characters.");
		}
	};

	const handlePieceClick = (x, y) => {
		if (!setupComplete) return;

		const character = gameState.board[x][y];
		if (character && character.startsWith(gameState.currentPlayer)) {
			setSelectedPiece([x, y]);
			generatePossibleMoves(character, x, y);
		}
	};

	const generatePossibleMoves = (character, x, y) => {
		const moveSet = [];
		const directions = {
			L: [0, -1],
			R: [0, 1],
			F: gameState.currentPlayer === "A" ? [1, 0] : [-1, 0],
			B: gameState.currentPlayer === "A" ? [-1, 0] : [1, 0],
			FL: gameState.currentPlayer === "A" ? [1, -1] : [-1, 1],
			FR: gameState.currentPlayer === "A" ? [1, 1] : [-1, -1],
			BL: gameState.currentPlayer === "A" ? [-1, -1] : [1, 1],
			BR: gameState.currentPlayer === "A" ? [-1, 1] : [1, -1],
		};

		const pieceType = character.split("-")[1][0];

		if (pieceType === "P" || pieceType === "H1") {
			["L", "R", "F", "B"].forEach((move) => {
				const [dx, dy] = directions[move];
				const newX = x + dx;
				const newY = y + dy;
				if (isValidMove(newX, newY)) {
					moveSet.push({ move, x: newX, y: newY });
				}
			});
		}

		if (pieceType === "H2") {
			["FL", "FR", "BL", "BR"].forEach((move) => {
				const [dx, dy] = directions[move];
				const newX = x + dx;
				const newY = y + dy;
				if (isValidMove(newX, newY)) {
					moveSet.push({ move, x: newX, y: newY });
				}
			});
		}

		setPossibleMoves(moveSet);
	};

	const isValidMove = (x, y) => {
		return (
			x >= 0 &&
			x < 5 &&
			y >= 0 &&
			y < 5 &&
			(!gameState.board[x][y] ||
				gameState.board[x][y][0] !== gameState.currentPlayer)
		);
	};

	const handleMove = (move) => {
		if (selectedPiece && move) {
			const [sx, sy] = selectedPiece;
			const character = gameState.board[sx][sy];
			ws.send(
				JSON.stringify({
					type: "move",
					data: { character, move: move.move },
				})
			);
			setSelectedPiece(null);
			setPossibleMoves([]);
		}
	};

	return (
		<div className="App">
			<div className="sidebar">
				<h1>HitWicket Chess</h1>
				<h2>Setup Your Characters</h2>
				{!setupComplete && (
					<div className="setup">
						{Array(5)
							.fill(null)
							.map((_, i) => (
								<select
									key={i}
									onChange={(e) => handleSetupChange(i, e.target.value)}>
									<option value="">Select Character</option>
									<option value={`P${i + 1}`}>Pawn {i + 1}</option>
									<option value="H1">Hero1</option>
									<option value="H2">Hero2</option>
								</select>
							))}
						<button onClick={handleSetupSubmit}>Submit Setup</button>
					</div>
				)}
				<div className="footer">
                    Developed by Aneesh
                    <br/>
                    <span className="spacer"></span>
                    <a href="https://github.com/Zephyrus02" target="_blank" rel="noopener noreferrer" className="github">
                        <i className="fab fa-github"></i>
                    </a>
                    <a href="https://www.linkedin.com/in/aneesh-raskar/" target="_blank" rel="noopener noreferrer">
                        <i className="fab fa-linkedin"></i>
                    </a>
                </div>
			</div>
			<div className="main-content">
				<h1>Current Player: {gameState?.currentPlayer}</h1>
				<div className="board-container">
					<div className="board">
						{gameState?.board.map((row, x) => (
							<div key={x} className="row">
								{row.map((cell, y) => (
									<div
										key={y}
										className={`cell ${
											selectedPiece &&
											selectedPiece[0] === x &&
											selectedPiece[1] === y
												? "selected"
												: ""
										}`}
										onClick={() => handlePieceClick(x, y)}>
										{cell}
									</div>
								))}
							</div>
						))}
					</div>
					<div className="move-options">
						<h2>Move Options</h2>
						{possibleMoves.length > 0 ? (
							possibleMoves.map((move, index) => (
								<button key={index} onClick={() => handleMove(move)}>
									{move.move} to ({move.x + 1},{move.y + 1})
								</button>
							))
						) : (
							<p>No possible moves</p>
						)}
					</div>
				</div>
				<div className="move-history">
					<h2>Move History</h2>
					<ul>
						{moveHistory.map((entry, index) => (
							<li key={index}>{entry}</li>
						))}
					</ul>
				</div>
			</div>
		</div>
	);
}

export default App;
