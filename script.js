// Firebase setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  orderBy,
  limit,
  getDocs,
  query,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA54CSj0dbE9WhFPeM6myysThhYdibXI2s",
  authDomain: "snake-leaderboard-ade19.firebaseapp.com",
  projectId: "snake-leaderboard-ade19",
  storageBucket: "snake-leaderboard-ade19.appspot.com",
  messagingSenderId: "142251805467",
  appId: "1:142251805467:web:c41f9f60c5f34ca347e1be",
  measurementId: "G-MRCG7JTWLV",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Game setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scale = 20;
const rows = canvas.height / scale;
const columns = canvas.width / scale;

let snake,
  apple,
  score,
  gameInterval,
  isGameOver = false;

document
  .getElementById("newGameButton")
  .addEventListener("click", startNewGame);

function startNewGame() {
  snake = new Snake();
  apple = new Apple();
  score = 0;
  isGameOver = false;
  updateScore();

  clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, 150);

  document.getElementById("newGameButton").disabled = true;

  document.addEventListener("keydown", handleKeydown, { once: true });
}

function handleKeydown(e) {
  if (snake && !isGameOver) snake.changeDirection(e);
  document.addEventListener("keydown", handleKeydown, { once: true });
}

function gameLoop() {
  if (isGameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  snake.move();
  snake.draw();
  apple.draw();
  checkAppleCollision();
  updateScore();
}

function checkAppleCollision() {
  if (snake.body[0].x === apple.x && snake.body[0].y === apple.y) {
    apple.randomize();
    snake.grow();
    score++;
    const pointSound = new Audio("point_sound.mp3");
    pointSound.play();
  }
}

function updateScore() {
  document.querySelector("#score").innerText = score;
}

class Snake {
  constructor() {
    this.body = [{ x: 0, y: Math.floor(rows / 2) }]; // Start at the far left, middle row
    this.direction = "RIGHT";
    this.inputDirection = "RIGHT";
  }

  draw() {
    ctx.fillStyle = "green";
    this.body.forEach(({ x, y }) => {
      ctx.fillRect(x * scale, y * scale, scale, scale);
    });
  }

  move() {
    if (isGameOver) return;

    this.direction = this.inputDirection;
    const head = { ...this.body[0] };

    switch (this.direction) {
      case "RIGHT":
        head.x++;
        break;
      case "LEFT":
        head.x--;
        break;
      case "UP":
        head.y--;
        break;
      case "DOWN":
        head.y++;
        break;
    }

    this.body.unshift(head);
    this.body.pop();

    if (this.checkCollision()) gameOver();
  }

  changeDirection({ key }) {
    const directions = {
      a: "LEFT",
      w: "UP",
      d: "RIGHT",
      s: "DOWN",
    };
    const opposite = {
      LEFT: "RIGHT",
      RIGHT: "LEFT",
      UP: "DOWN",
      DOWN: "UP",
    };

    if (directions[key] && directions[key] !== opposite[this.direction]) {
      this.inputDirection = directions[key];
    }
  }

  grow() {
    this.body.push({ ...this.body[this.body.length - 1] });
  }

  checkCollision() {
    const [head, ...body] = this.body;
    return (
      head.x < 0 ||
      head.x >= columns ||
      head.y < 0 ||
      head.y >= rows ||
      body.some((segment) => segment.x === head.x && segment.y === head.y)
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
  document.getElementById("newGameButton").disabled = false;

  getLeaderboard()
    .then((leaderboard) => {
      if (leaderboard.length < 5 || score > leaderboard[4].score) {
        const victorySound = new Audio("victory_sound.mp3");
        victorySound.play();
        activateScoreSubmissionForm();
      } else {
        alert(
          "Your score is not high enough to be submitted to the leaderboard."
        );
      }
    })
    .catch(console.error);
}

function activateScoreSubmissionForm() {
  const form = document.getElementById("scoreSubmission");
  form.style.pointerEvents = "auto";
  form.style.opacity = "1";

  form.querySelectorAll("input, button").forEach((element) => {
    element.disabled = false;
  });

  document.getElementById("submitScoreButton").onclick = () => {
    const playerName = document.getElementById("playerName").value;
    if (playerName) {
      saveScore(playerName, score);
      form.style.pointerEvents = "none";
      form.style.opacity = "0.5";

      form.querySelectorAll("input, button").forEach((element) => {
        element.disabled = true;
      });

      // Clear the input text after saving the score
      document.getElementById("playerName").value = "";
    } else {
      alert("Please enter a name!");
    }
  };
}

function saveScore(playerName, score) {
  addDoc(collection(db, "scores"), { playerName, score, timestamp: new Date() })
    .then(() => console.log("Score saved successfully!"))
    .catch(console.error);
}

function getLeaderboard() {
  const q = query(collection(db, "scores"), orderBy("score", "desc"), limit(5));
  return getDocs(q).then((snapshot) => snapshot.docs.map((doc) => doc.data()));
}

function displayLeaderboard(leaderboard) {
  const leaderboardElement = document.getElementById("leaderboard");
  leaderboardElement
    .querySelectorAll(".leaderboard-entry")
    .forEach((entry) => entry.remove());

  leaderboard.forEach(({ playerName, score }) => {
    const entry = document.createElement("div");
    entry.className = "leaderboard-entry";
    entry.textContent = `${playerName}: ${score}`;
    leaderboardElement.appendChild(entry);
  });
}

getLeaderboard().then(displayLeaderboard).catch(console.error);
