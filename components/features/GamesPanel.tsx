import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { FeaturePanel, ActionButton, ResultCard } from '../ui';

const GameCard: React.FC<{ title: string, description: string, onSelect: () => void }> = ({ title, description, onSelect }) => (
    <div
        onClick={onSelect}
        className="bg-gemini-grey-dark p-6 rounded-lg border border-gemini-grey hover:border-gemini-blue-light hover:shadow-xl hover:-translate-y-1 transform transition-all cursor-pointer"
    >
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gemini-grey-light">{description}</p>
    </div>
);

const GeminiGuesserGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [secretWord, setSecretWord] = useState('');
    const [guesses, setGuesses] = useState<string[]>(Array(6).fill(''));
    const [currentGuess, setCurrentGuess] = useState('');
    const [activeGuessIndex, setActiveGuessIndex] = useState(0);
    const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
    const [isLoading, setIsLoading] = useState(true);
    const [hint, setHint] = useState('');
    const [error, setError] = useState('');

    const startNewGame = useCallback(async () => {
        setIsLoading(true);
        setError('');
        setHint('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: 'Generate a single, common, 5-letter English word for a guessing game. Return only the word itself, in lowercase, with no punctuation or explanation.',
            });
            const word = response.text.trim().toLowerCase().replace(/[^a-z]/g, '');
            if (word.length !== 5) {
                throw new Error("AI returned an invalid word.");
            }
            setSecretWord(word);
            setGuesses(Array(6).fill(''));
            setCurrentGuess('');
            setActiveGuessIndex(0);
            setGameState('playing');
        } catch (e: any) {
            setError(`Could not start new game: ${e.message}`);
            setSecretWord('react'); // fallback
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        startNewGame();
    }, [startNewGame]);
    
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (gameState !== 'playing') return;
            if (e.key === 'Enter' && currentGuess.length === 5) {
                const newGuesses = [...guesses];
                newGuesses[activeGuessIndex] = currentGuess;
                setGuesses(newGuesses);
                setActiveGuessIndex(prev => prev + 1);
                
                if (currentGuess === secretWord) {
                    setGameState('won');
                } else if (activeGuessIndex === 5) {
                    setGameState('lost');
                }
                setCurrentGuess('');
            } else if (e.key === 'Backspace') {
                setCurrentGuess(prev => prev.slice(0, -1));
            } else if (currentGuess.length < 5 && /^[a-zA-Z]$/.test(e.key)) {
                setCurrentGuess(prev => prev + e.key.toLowerCase());
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentGuess, activeGuessIndex, guesses, secretWord, gameState]);

    const getHint = async () => {
        setIsLoading(true);
        setHint('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `The secret 5-letter word is "${secretWord}". Provide a short, clever hint for the user. Do not use any letters from the secret word in your hint.`
            });
            setHint(response.text);
        } catch (e: any) {
            setError(`Failed to get hint: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const getTileClass = (char: string, index: number, word: string) => {
        if (!word) return 'border-gemini-grey';
        if (secretWord[index] === char) return 'bg-green-500 border-green-500 transform scale-110';
        if (secretWord.includes(char)) return 'bg-yellow-500 border-yellow-500';
        return 'bg-gemini-grey-dark border-gemini-grey';
    };

    return (
        <div>
             <button onClick={onBack} className="mb-4 text-gemini-blue-light hover:underline">{'< Back to Games'}</button>
            <h3 className="text-2xl font-bold text-center mb-4">Gemini Guesser</h3>
            {isLoading && !secretWord && <p className="text-center">Starting game...</p>}
            {error && <p className="text-center text-red-500">{error}</p>}
            <div className="grid grid-rows-6 gap-2 max-w-xs mx-auto mb-4">
                {guesses.map((guess, i) => (
                    <div key={i} className="grid grid-cols-5 gap-2">
                        {Array(5).fill(0).map((_, j) => {
                            const char = i === activeGuessIndex ? currentGuess[j] : guess[j];
                            return <div key={j} className={`w-12 h-12 border-2 flex items-center justify-center text-2xl font-bold uppercase transition-all duration-500 ${getTileClass(char, j, guess)}`}>{char}</div>
                        })}
                    </div>
                ))}
            </div>
             {gameState !== 'playing' && (
                <div className="text-center p-4 rounded-lg bg-gemini-grey-darker">
                    <p className="text-xl mb-2">{gameState === 'won' ? 'You won!' : 'Game Over!'}</p>
                    <p>The word was: <span className="font-bold uppercase text-gemini-blue-light">{secretWord}</span></p>
                </div>
            )}
            <div className="flex gap-2 mt-4">
                <ActionButton onClick={startNewGame} isLoading={isLoading && !!secretWord}>New Game</ActionButton>
                <ActionButton onClick={getHint} isLoading={isLoading} disabled={gameState !== 'playing'}>Get a Hint</ActionButton>
            </div>
            {hint && <ResultCard title="Gemini's Hint">{hint}</ResultCard>}
        </div>
    );
};

const TicTacToeGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [board, setBoard] = useState<(('X' | 'O') | null)[]>(Array(9).fill(null));
    const [isXNext, setIsXNext] = useState(true);
    const [winner, setWinner] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const calculateWinner = (squares: typeof board) => {
        const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) return squares[a];
        }
        if (squares.every(s => s !== null)) return 'Draw';
        return null;
    };

    const handlePlayerMove = (i: number) => {
        if (board[i] || winner || !isXNext) return;
        const newBoard = [...board];
        newBoard[i] = 'X';
        setBoard(newBoard);
        setIsXNext(false);
        const gameWinner = calculateWinner(newBoard);
        if (gameWinner) setWinner(gameWinner);
    };
    
    const getGeminiMove = useCallback(async (currentBoard: typeof board) => {
        setIsLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const boardString = currentBoard.map(cell => cell || '_').join('');
            const prompt = `You are playing Tic-Tac-Toe. You are 'O'. The current board state is "${boardString}" (from top-left to bottom-right). Choose your next move. Return a single number from 0 to 8 representing the index of your move. Make a valid and strategic move. Only return the number.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            const moveIndex = parseInt(response.text.trim(), 10);
            if (!isNaN(moveIndex) && moveIndex >= 0 && moveIndex <= 8 && currentBoard[moveIndex] === null) {
                return moveIndex;
            } else { // Fallback if AI gives invalid move
                const emptyCells = currentBoard.map((c, i) => c === null ? i : -1).filter(i => i !== -1);
                return emptyCells[Math.floor(Math.random() * emptyCells.length)];
            }
        } catch (e) {
            console.error("AI move failed:", e);
            // Fallback to random move on error
            const emptyCells = currentBoard.map((c, i) => c === null ? i : -1).filter(i => i !== -1);
            return emptyCells[Math.floor(Math.random() * emptyCells.length)];
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isXNext && !winner) {
            getGeminiMove(board).then(move => {
                if(move === undefined) return;
                const newBoard = [...board];
                newBoard[move] = 'O';
                setBoard(newBoard);
                setIsXNext(true);
                const gameWinner = calculateWinner(newBoard);
                if (gameWinner) setWinner(gameWinner);
            });
        }
    }, [isXNext, board, winner, getGeminiMove]);

    const resetGame = () => {
        setBoard(Array(9).fill(null));
        setIsXNext(true);
        setWinner(null);
    };

    return (
         <div>
            <button onClick={onBack} className="mb-4 text-gemini-blue-light hover:underline">{'< Back to Games'}</button>
            <h3 className="text-2xl font-bold text-center mb-4">Tic-Tac-Toe vs. Gemini</h3>
            <div className="grid grid-cols-3 gap-2 w-64 h-64 mx-auto">
                {board.map((value, i) => (
                    <button key={i} onClick={() => handlePlayerMove(i)} className="bg-gemini-grey-darker border border-gemini-grey text-4xl font-bold flex items-center justify-center rounded-lg hover:bg-gemini-grey transition-colors">
                        {value}
                    </button>
                ))}
            </div>
            <div className="text-center mt-4 text-xl">
                {winner ? `Winner: ${winner}` : isLoading ? 'Gemini is thinking...' : `Next Player: ${isXNext ? 'X' : 'O'}`}
            </div>
            <div className="mt-4">
                <ActionButton onClick={resetGame}>New Game</ActionButton>
            </div>
        </div>
    );
};

const AstroJumperGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let score = 0;
        let gameOver = false;
        
        const player = { x: 50, y: 200, width: 20, height: 20, dy: 0, gravity: 0.5, jumpPower: -10, onGround: false };
        const platforms: { x: number, y: number, width: number }[] = [];
        let keys: { [key: string]: boolean } = {};

        function createPlatforms() {
            platforms.length = 0;
            for (let i = 0; i < 6; i++) {
                platforms.push({ x: Math.random() * (canvas.width - 60), y: canvas.height - 50 * i - 50, width: 60 + Math.random() * 40 });
            }
        }

        function loop() {
            if (gameOver) {
                ctx.fillStyle = 'rgba(17, 24, 39, 0.7)';
                ctx.fillRect(0,0,canvas.width, canvas.height);
                ctx.fillStyle = 'white';
                ctx.font = '30px Inter';
                ctx.textAlign = 'center';
                ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
                ctx.font = '20px Inter';
                ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
                return;
            }

            requestAnimationFrame(loop);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update player
            player.dy += player.gravity;
            player.y += player.dy;
            player.onGround = false;

            if (keys['ArrowLeft']) player.x -= 4;
            if (keys['ArrowRight']) player.x += 4;
            
            // Screen wrap
            if (player.x > canvas.width) player.x = 0;
            else if (player.x < 0) player.x = canvas.width;

            // Collision with platforms
            platforms.forEach(p => {
                if (player.x < p.x + p.width && player.x + player.width > p.x && player.y + player.height > p.y && player.y + player.height < p.y + 10 && player.dy > 0) {
                    player.dy = player.jumpPower;
                }
            });
            
            // Move platforms down and generate new ones
            if (player.y < canvas.height / 2) {
                platforms.forEach(p => {
                    p.y -= player.dy;
                    if (p.y > canvas.height) {
                        p.y = 0;
                        p.x = Math.random() * (canvas.width - p.width);
                        score++;
                    }
                });
            }
            
            // Game over
            if (player.y > canvas.height) {
                gameOver = true;
            }

            // Draw platforms
            ctx.fillStyle = '#3b82f6';
            platforms.forEach(p => ctx.fillRect(p.x, p.y, p.width, 10));

            // Draw player
            ctx.fillStyle = '#f3f4f6';
            ctx.fillRect(player.x, player.y, player.width, player.height);
            
            // Draw score
            ctx.fillStyle = 'white';
            ctx.font = '20px Inter';
            ctx.textAlign = 'left';
            ctx.fillText(`Score: ${score}`, 10, 25);
        }

        const onKeyDown = (e: KeyboardEvent) => { keys[e.key] = true; };
        const onKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };
        
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        createPlatforms();
        loop();

        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };

    }, []);

    return (
        <div>
            <button onClick={onBack} className="mb-4 text-gemini-blue-light hover:underline">{'< Back to Games'}</button>
            <h3 className="text-2xl font-bold text-center mb-4">Astro Jumper</h3>
            <p className="text-center text-sm text-gemini-grey-light mb-2">Use Left/Right arrow keys to move. Jump automatically on platforms.</p>
            <canvas ref={canvasRef} width="320" height="480" className="bg-gemini-grey-darker rounded-lg mx-auto block border border-gemini-grey"></canvas>
        </div>
    );
};


export const GamesPanel: React.FC = () => {
    const [activeGame, setActiveGame] = useState<string | null>(null);

    const selectGame = (game: string) => {
        setActiveGame(game);
    };

    const backToMenu = () => {
        setActiveGame(null);
    };

    if (activeGame) {
        switch(activeGame) {
            case 'guesser': return <GeminiGuesserGame onBack={backToMenu} />;
            case 'tictactoe': return <TicTacToeGame onBack={backToMenu} />;
            case 'jumper': return <AstroJumperGame onBack={backToMenu} />;
            default: setActiveGame(null); return null;
        }
    }
    
    return (
        <FeaturePanel title="Gemini Games" description="Play a selection of classic and AI-powered games.">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <GameCard 
                    title="Gemini Guesser"
                    description="A word guessing game where Gemini provides the secret word and clever hints on demand."
                    onSelect={() => selectGame('guesser')}
                />
                <GameCard 
                    title="Tic-Tac-Toe vs. Gemini"
                    description="Play the classic strategy game against a Gemini-powered AI opponent."
                    onSelect={() => selectGame('tictactoe')}
                />
                <GameCard 
                    title="Astro Jumper"
                    description="A fun and simple platformer game. How high can you climb?"
                    onSelect={() => selectGame('jumper')}
                />
            </div>
        </FeaturePanel>
    );
};
