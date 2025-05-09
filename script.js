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

let snake;
let apple;
let score;
let gameInterval;
let isGameOver = false;
let isKeydownListenerAdded = false; // Flag to ensure the keydown event listener is added only once

document
  .getElementById("newGameButton")
  .addEventListener("click", startNewGame);

function startNewGame() {
  snake = new Snake();
  apple = new Apple();
  score = 0;
  isGameOver = false;
  document.querySelector("#score").innerText = score;

  if (gameInterval) clearInterval(gameInterval);
  gameInterval = window.setInterval(gameLoop, 150);

  // Disable button after starting game
  document.getElementById("newGameButton").disabled = true;

  // Add keydown event listener if not already added
  if (!isKeydownListenerAdded) {
    document.addEventListener("keydown", (e) => {
      if (snake && !isGameOver) {
        // Ensure snake exists and the game isn't over
        snake.changeDirection(e);
      }
    });
    isKeydownListenerAdded = true;
  }
}

function gameLoop() {
  if (isGameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  snake.move();
  snake.draw();
  apple.draw();
  checkAppleCollision();
  document.querySelector("#score").innerText = score;
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
    this.direction = "RIGHT";
    this.inputDirection = "RIGHT";
  }

  draw() {
    ctx.fillStyle = "green";
    this.body.forEach((segment) => {
      ctx.fillRect(segment.x * scale, segment.y * scale, scale, scale);
    });
  }

  move() {
    if (isGameOver) return; // Prevents processing when the game is over
    this.direction = this.inputDirection;
    const head = { ...this.body[0] };

    if (this.direction === "RIGHT") head.x++;
    else if (this.direction === "LEFT") head.x--;
    else if (this.direction === "UP") head.y--;
    else if (this.direction === "DOWN") head.y++;

    this.body.unshift(head);
    this.body.pop();

    if (this.checkCollision()) gameOver();
  }

  changeDirection(event) {
    const key = event.key;
    if (key === "a" && this.direction !== "RIGHT") this.inputDirection = "LEFT";
    else if (key === "w" && this.direction !== "DOWN")
      this.inputDirection = "UP";
    else if (key === "d" && this.direction !== "LEFT")
      this.inputDirection = "RIGHT";
    else if (key === "s" && this.direction !== "UP")
      this.inputDirection = "DOWN";
  }

  grow() {
    const tail = this.body[this.body.length - 1];
    this.body.push({ ...tail });
  }

  checkCollision() {
    const head = this.body[0];
    return (
      head.x < 0 ||
      head.x >= columns ||
      head.y < 0 ||
      head.y >= rows ||
      this.body
        .slice(1)
        .some((segment) => segment.x === head.x && segment.y === head.y)
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

// Game Over function
function gameOver() {
  isGameOver = true;
  alert(`Game Over! Your score: ${score}`);

  // Re-enable the New Game button
  document.getElementById("newGameButton").disabled = false;

  // Fetch the leaderboard and check if the score is high enough to submit
  getLeaderboard()
    .then((leaderboard) => {
      // If there are less than 5 entries, allow the score to be submitted
      if (leaderboard.length < 5 || score > leaderboard[4].score) {
        // Show the score submission form and make sure it's centered
        document.getElementById("scoreSubmission").style.display = "block";

        // Attach an event listener for submitting the score
        document
          .getElementById("submitScoreButton")
          .addEventListener("click", () => {
            const playerName = document.getElementById("playerName").value;
            if (playerName) {
              saveScore(playerName, score); // Save the score to Firestore
              document.getElementById("scoreSubmission").style.display = "none"; // Hide the form
            } else {
              alert("Please enter a name!");
            }
          });
      } else {
        // If the score is not high enough, inform the player
        alert(
          "Your score is not high enough to be submitted to the leaderboard."
        );
      }
    })
    .catch((error) => {
      console.error("Error checking leaderboard: ", error);
    });
}

// Save score to Firestore
function saveScore(playerName, score) {
  addDoc(collection(db, "scores"), {
    playerName: playerName,
    score: score,
    timestamp: new Date(),
  })
    .then(() => {
      console.log("Score saved successfully!");
    })
    .catch((error) => {
      console.error("Error saving score: ", error);
    });
}

// Get leaderboard from Firestore
function getLeaderboard() {
  return new Promise((resolve, reject) => {
    const leaderboard = [];
    const q = query(
      collection(db, "scores"),
      orderBy("score", "desc"),
      limit(5)
    );
    getDocs(q)
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          leaderboard.push(doc.data());
        });
        resolve(leaderboard); // Resolve the leaderboard data
      })
      .catch((error) => {
        console.error("Error getting leaderboard: ", error);
        reject(error); // Reject in case of an error
      });
  });
}

// Display leaderboard
function displayLeaderboard(leaderboard) {
  const leaderboardElement = document.getElementById("leaderboard");

  // Clear only the dynamic score entries, not the header
  const existingScores =
    leaderboardElement.querySelectorAll(".leaderboard-entry");
  existingScores.forEach((entry) => entry.remove());

  // Add new scores below the header
  leaderboard.forEach((entry) => {
    const scoreElement = document.createElement("div");
    scoreElement.className = "leaderboard-entry";
    scoreElement.textContent = `${entry.playerName}: ${entry.score}`;
    leaderboardElement.appendChild(scoreElement);
  });
}

// Call getLeaderboard to display leaderboard when the page loads
getLeaderboard();
