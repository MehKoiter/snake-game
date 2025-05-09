window.onload = function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scale = 20;
    const rows = canvas.height / scale;
    const columns = canvas.width / scale;

    let snake;
    let apple;
    let score;
    let gameInterval;
    let isGameOver = false;

    document.getElementById('newGameButton').addEventListener('click', startNewGame);

    function startNewGame() {
        snake = new Snake();
        apple = new Apple();
        score = 0;
        isGameOver = false;
        document.querySelector('#score').innerText = score;

        if (gameInterval) clearInterval(gameInterval);
        gameInterval = window.setInterval(gameLoop, 150);

        document.getElementById('newGameButton').disabled = true;
        document.addEventListener('keydown', e => snake.changeDirection(e));
    }

    function gameLoop() {
        if (isGameOver) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        snake.move();
        snake.draw();
        apple.draw();
        checkAppleCollision();
        document.querySelector('#score').innerText = score;
    }

    function checkAppleCollision() {
        if (snake.body[0].x === apple.x && snake.body[0].y === apple.y) {
            apple.randomize();
            snake.grow();
            score++;
        }
    }

    class Snake {
        constructor() {
            this.body = [{ x: 10, y: 10 }];
            this.direction = 'RIGHT';
            this.inputDirection = 'RIGHT';
        }

        draw() {
            ctx.fillStyle = "green";
            this.body.forEach(segment => {
                ctx.fillRect(segment.x * scale, segment.y * scale, scale, scale);
            });
        }

        move() {
            this.direction = this.inputDirection;
            const head = { ...this.body[0] };

            if (this.direction === 'RIGHT') head.x++;
            else if (this.direction === 'LEFT') head.x--;
            else if (this.direction === 'UP') head.y--;
            else if (this.direction === 'DOWN') head.y++;

            this.body.unshift(head);
            this.body.pop();

            if (this.checkCollision()) gameOver();
        }

        changeDirection(event) {
            const key = event.key;
            if (key === 'a' && this.direction !== 'RIGHT') this.inputDirection = 'LEFT';
            else if (key === 'w' && this.direction !== 'DOWN') this.inputDirection = 'UP';
            else if (key === 'd' && this.direction !== 'LEFT') this.inputDirection = 'RIGHT';
            else if (key === 's' && this.direction !== 'UP') this.inputDirection = 'DOWN';
        }

        grow() {
            const tail = this.body[this.body.length - 1];
            this.body.push({ ...tail });
        }

        checkCollision() {
            const head = this.body[0];
            return (
                head.x < 0 || head.x >= columns || head.y < 0 || head.y >= rows ||
                this.body.slice(1).some(segment => segment.x === head.x && segment.y === head.y)
            );
        }
    }

    class Apple {
        constructor() {
            this.randomize();
        }

        draw() {
            ctx.fillStyle = "red";
            ctx.fillRect(this.x * scale, this.y * scale, scale, scale);
        }

        randomize() {
            this.x = Math.floor(Math.random() * columns);
            this.y = Math.floor(Math.random() * rows);
        }
    }

    function gameOver() {
        isGameOver = true;
        alert(`Game Over! Your score: ${score}`);
        document.getElementById('newGameButton').disabled = false;
    }
};
