class Game2048 {
    constructor() {
        this.gridSize = 4;
        this.grid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(0));
        this.score = 0;
        this.bestScore = localStorage.getItem('bestScore') || 0;
        this.gameOver = false;
        this.won = false;
        this.keepPlaying = false;
        
        this.init();
    }

    init() {
        this.addTwo();
        this.addTwo();
        this.updateUI();
        this.bindEvents();
    }

    addTwo() {
        const emptyCells = [];
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j] === 0) {
                    emptyCells.push({ row: i, col: j });
                }
            }
        }
        
        if (emptyCells.length === 0) return false;

        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const value = Math.random() < 0.9 ? 2 : 4;
        this.grid[randomCell.row][randomCell.col] = value;
        return true;
    }

    move(direction) {
        if (this.gameOver) return;

        let moved = false;
        let scoreAdded = 0;
        const newGrid = this.grid.map(row => [...row]);

        if (direction === 'left') {
            for (let i = 0; i < this.gridSize; i++) {
                const row = this.slideAndMergeRow(this.grid[i]);
                newGrid[i] = row.tiles;
                scoreAdded += row.score;
                if (JSON.stringify(this.grid[i]) !== JSON.stringify(row.tiles)) {
                    moved = true;
                }
            }
        } else if (direction === 'right') {
            for (let i = 0; i < this.gridSize; i++) {
                const row = this.slideAndMergeRow([...this.grid[i]].reverse());
                newGrid[i] = row.tiles.reverse();
                scoreAdded += row.score;
                if (JSON.stringify(this.grid[i]) !== JSON.stringify(newGrid[i])) {
                    moved = true;
                }
            }
        } else if (direction === 'up') {
            for (let j = 0; j < this.gridSize; j++) {
                const column = [];
                for (let i = 0; i < this.gridSize; i++) {
                    column.push(this.grid[i][j]);
                }
                const row = this.slideAndMergeRow(column);
                for (let i = 0; i < this.gridSize; i++) {
                    newGrid[i][j] = row.tiles[i];
                }
                scoreAdded += row.score;
                if (JSON.stringify(column) !== JSON.stringify(row.tiles)) {
                    moved = true;
                }
            }
        } else if (direction === 'down') {
            for (let j = 0; j < this.gridSize; j++) {
                const column = [];
                for (let i = 0; i < this.gridSize; i++) {
                    column.push(this.grid[i][j]);
                }
                const row = this.slideAndMergeRow(column.reverse());
                const reversedTiles = row.tiles.reverse();
                for (let i = 0; i < this.gridSize; i++) {
                    newGrid[i][j] = reversedTiles[i];
                }
                scoreAdded += row.score;
                if (JSON.stringify(column.reverse()) !== JSON.stringify(reversedTiles)) {
                    moved = true;
                }
            }
        }

        if (moved) {
            this.grid = newGrid;
            this.score += scoreAdded;
            this.bestScore = Math.max(this.score, this.bestScore);
            localStorage.setItem('bestScore', this.bestScore);
            
            this.addTwo();
            this.updateUI();
            
            if (!this.hasMoves()) {
                this.gameOver = true;
                this.showGameOver();
            }
            
            if (this.hasWinningTile() && !this.won) {
                this.won = true;
                this.showWin();
            }
        }
    }

    moveRow(row) {
        let newRow = row.filter(val => val !== 0);
        let zeros = Array(row.length - newRow.length).fill(0);
        newRow = newRow.concat(zeros);

        for (let i = 0; i < newRow.length - 1; i++) {
            if (newRow[i] === newRow[i + 1]) {
                newRow[i] *= 2;
                newRow[i + 1] = 0;
            }
        }

        newRow = newRow.filter(val => val !== 0);
        zeros = Array(row.length - newRow.length).fill(0);
        newRow = newRow.concat(zeros);

        return newRow;
    }

    slideAndMergeRow(row) {
        const filtered = row.filter(val => val !== 0);
        const merged = [];
        let score = 0;
        let i = 0;
        
        while (i < filtered.length) {
            if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
                // Merge tiles
                const mergedValue = filtered[i] * 2;
                merged.push(mergedValue);
                score += mergedValue;
                i += 2; // Skip next tile as it's been merged
            } else {
                merged.push(filtered[i]);
                i++;
            }
        }
        
        // Fill remaining spaces with zeros
        while (merged.length < this.gridSize) {
            merged.push(0);
        }
        
        return { tiles: merged, score: score };
    }

    hasWinningTile() {
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j] >= 2048) {
                    return true;
                }
            }
        }
        return false;
    }

    getDirectionVector(direction) {
        switch (direction) {
            case 'left': return [-1, 0];
            case 'right': return [1, 0];
            case 'up': return [0, -1];
            case 'down': return [0, 1];
        }
    }

    getRowBounds(dx) {
        if (dx === -1) return [0, this.gridSize, 1];
        return [this.gridSize - 1, -1, -1];
    }

    getColumnBounds(dy) {
        if (dy === -1) return [0, this.gridSize, 1];
        return [this.gridSize - 1, -1, -1];
    }

    canMove(row, col) {
        return (
            row >= 0 && row < this.gridSize &&
            col >= 0 && col < this.gridSize &&
            this.grid[row][col] === 0
        );
    }

    hasMoves() {
        // Check if any empty cells
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j] === 0) return true;
            }
        }

        // Check if any adjacent cells with same value
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                const value = this.grid[i][j];
                if (
                    (i < this.gridSize - 1 && this.grid[i + 1][j] === value) ||
                    (j < this.gridSize - 1 && this.grid[i][j + 1] === value)
                ) {
                    return true;
                }
            }
        }

        return false;
    }

    checkGameOver() {
        if (this.grid.flat().includes(0)) return false;
        
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const value = this.grid[i][j];
                if ((i < 3 && this.grid[i + 1][j] === value) ||
                    (j < 3 && this.grid[i][j + 1] === value)) {
                    return false;
                }
            }
        }
        
        return true;
    }

    checkWin() {
        return this.grid.flat().includes(2048);
    }

    updateUI() {
        // Update score and best score
        document.querySelector('.score').textContent = this.score;
        document.querySelector('.best').textContent = this.bestScore;
        
        // Clear existing tiles
        const gridContainer = document.querySelector('.grid-container');
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => tile.remove());

        // Create new tiles
        this.grid.forEach((row, rowIndex) => {
            row.forEach((value, colIndex) => {
                if (value !== 0) {
                    const tile = document.createElement('div');
                    tile.className = `tile tile-${value}`;
                    tile.textContent = value;
                    
                    // Calculate position (106.25px per cell + 15px spacing)
                    const left = colIndex * 121.25 + 15;
                    const top = rowIndex * 121.25 + 15;
                    
                    tile.style.left = `${left}px`;
                    tile.style.top = `${top}px`;
                    
                    // Add animation classes for new tiles
                    if (this.isNewTile(rowIndex, colIndex, value)) {
                        tile.classList.add('new');
                    }
                    
                    gridContainer.appendChild(tile);
                }
            });
        });
    }

    isNewTile(row, col, value) {
        // Simple heuristic: assume 2 and 4 tiles are new
        return value === 2 || value === 4;
    }

    showGameOver() {
        const message = document.querySelector('.game-message');
        const p = message.querySelector('p');
        p.textContent = 'Game Over!';
        
        // Animate game over message
        message.classList.add('show');
        p.style.opacity = '0';
        setTimeout(() => {
            p.style.opacity = '1';
        }, 100);
    }

    showWin() {
        const message = document.querySelector('.game-message');
        const p = message.querySelector('p');
        p.textContent = 'You Win!';
        
        // Animate win message
        message.classList.add('show');
        p.style.opacity = '0';
        setTimeout(() => {
            p.style.opacity = '1';
        }, 100);

        // Animate all tiles
        const tiles = document.querySelectorAll('.tile');
        tiles.forEach(tile => {
            tile.classList.add('tile-merged');
            setTimeout(() => tile.classList.add('animate'), 100);
        });
    }

    checkWin() {
        if (this.won && !this.keepPlaying) {
            this.showWin();
            return true;
        }
        return false;
    }

    checkGameOver() {
        if (!this.hasMoves() && !this.gameOver) {
            this.gameOver = true;
            this.showGameOver();
            return true;
        }
        return false;
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => {
            // Prevent default arrow key behavior (scrolling)
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
            }
            
            switch (e.key) {
                case 'ArrowUp': this.move('up'); break;
                case 'ArrowDown': this.move('down'); break;
                case 'ArrowLeft': this.move('left'); break;
                case 'ArrowRight': this.move('right'); break;
            }
        });

        // New Game button
        document.querySelector('.restart-button').addEventListener('click', () => {
            this.restartGame();
        });

        // Keep Playing button (after winning)
        const keepPlayingButton = document.querySelector('.keep-playing-button');
        if (keepPlayingButton) {
            keepPlayingButton.addEventListener('click', () => {
                this.keepPlaying = true;
                document.querySelector('.game-message').classList.remove('show');
            });
        }

        // Try Again button (after game over)
        const retryButton = document.querySelector('.retry-button');
        if (retryButton) {
            retryButton.addEventListener('click', () => {
                this.restartGame();
            });
        }
    }

    restartGame() {
        this.gameOver = false;
        this.won = false;
        this.keepPlaying = false;
        this.score = 0;
        this.grid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(0));
        document.querySelector('.game-message').classList.remove('show');
        this.init();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Game2048();
});
