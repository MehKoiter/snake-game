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

// Sound
const backgroundMusic = new Audio("sfx/background_music.mp3");
const pointSound = new Audio("sfx/point_sound.mp3");
const victorySound = new Audio("sfx/victory_sound.mp3");
const defeatSound = new Audio("sfx/defeat_sound.mp3");

// set volume for sounds
backgroundMusic.volume = 0.25;
pointSound.volume = 0.25;

// Adjust playback rate of background music based on snake length
function adjustBackgroundMusicTempo() {
  if (snake) {
    const baseTempo = 1; // Normal speed
    const tempoIncrease = 0.01; // Increase per snake segment
    backgroundMusic.playbackRate =
      baseTempo + snake.body.length * tempoIncrease;
  }
}

// Call adjustBackgroundMusicTempo in game loop to update tempo dynamically
setInterval(() => {
  if (!isGameOver) {
    adjustBackgroundMusicTempo();
  }
}, 1000); // Adjust tempo every second

victorySound.volume = 0.25;
defeatSound.volume = 0.25;

// Modal setup
const customModal = document.getElementById("customModal");
const modalMessage = document.getElementById("modalMessage");
const container = document.querySelector(".container");

const snakeSkins = [
  "Default",
  "Coral",
  "Rattle",
  "Milk",
  "Eyelash Viper",
  "Boomslang",
  "Blue Racer",
];
let snakeSkinsIndex = 0;
let selectedSnakeSkin = snakeSkins[snakeSkinsIndex]; // Default to the first skin

let snake,
  apple,
  score,
  gameInterval,
  isGameOver = false;

// Add on click events
document
  .getElementById("newGameButton")
  .addEventListener("click", startNewGame);
document.getElementById("modalButton").addEventListener("click", closeModal);
document
  .getElementById("snakeSelectionToggle")
  .addEventListener("click", toggleSnakeSelection);
document.getElementById("upButton").addEventListener("click", () => {
  handleKeydown({ key: "w" });
});
document.getElementById("leftButton").addEventListener("click", () => {
  handleKeydown({ key: "a" });
});
document.getElementById("downButton").addEventListener("click", () => {
  handleKeydown({ key: "s" });
});
document.getElementById("rightButton").addEventListener("click", () => {
  handleKeydown({ key: "d" });
});

function toggleSnakeSelection() {
  // span text
  const snakeSelection = document.getElementById("selectedSnake");
  console.log(snakeSelection);
  snakeSkinsIndex = (snakeSkinsIndex + 1) % snakeSkins.length;
  snakeSelection.textContent = `${snakeSkins[snakeSkinsIndex]}`;
  selectedSnakeSkin = snakeSkins[snakeSkinsIndex];
}

function startNewGame() {
  startBackgroundMusic();
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

function startBackgroundMusic() {
  backgroundMusic.loop = true;
  if (backgroundMusic.paused) {
    backgroundMusic.play().catch(console.error);
  }
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
    const snakeSkinsMap = {
      Coral: (index) => {
        if (index === 0) return "black"; // Black for the head
        const colors = ["black", "yellow", "black", "yellow", "red", "yellow"];
        return colors[(index - 1) % colors.length]; // Cycle through Coral pattern
      },
      Rattle: (index) => {
        if (index === 0) return "#D2B48C"; // Light brown for the head
        const bodyColor = "#A0522D"; // Medium brown for the body
        const rattleColors = ["#F5DEB3", "#8B4513"]; // Alternating light tan and SaddleBrown for the rattle
        const rattleStartIndex =
          this.body.length - (1 + Math.floor(this.body.length / 5));

        if (index >= rattleStartIndex) {
          return rattleColors[(index - rattleStartIndex) % rattleColors.length];
        }

        return bodyColor; // Medium brown for the rest of the body
      },
      Milk: (index) => {
        if (index === 0) return "white"; // White for the head
        const milkColors = ["white", "black"];
        return milkColors[index % milkColors.length]; // Alternating white and black
      },
      "Eyelash Viper": (index) => {
        if (index === 0) return "#ff0000"; // red head
        const colors = ["#4caf50", "#8bc34a", "#cddc39"];
        return colors[(index - 1) % colors.length];
      },
      Boomslang: (index) => {
        if (index === 0) return "#00fff7"; // Bright cyan head
        const colors = ["#ff00ff", "#00ff00", "#00fff7"];
        return colors[(index - 1) % colors.length];
      },
      "Blue Racer": (index) => {
        if (index === 0) return "#aee3f9"; // Light blue for head
        const colors = ["#e0f7fa", "#b2ebf2", "#80deea", "#4dd0e1"];
        return colors[(index - 1) % colors.length];
      },
      Default: (index) => {
        if (index === 0) return "hsl(120, 100%, 30%)"; // Dark green for the head
        const cycle = Math.floor((index - 1) / 5) % 3; // Cycle through 3 iterations
        const shade = 50 + cycle * 20; // Increase lightness more noticeably for each cycle
        return `hsl(120, 100%, ${Math.min(shade, 90)}%)`; // Shades of green for the body
      },
    };

    const getColor =
      snakeSkinsMap[selectedSnakeSkin] || snakeSkinsMap["Default"];

    this.body.forEach(({ x, y }, index) => {
      ctx.fillStyle = getColor(index);
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
  backgroundMusic.pause();
  backgroundMusic.currentTime = 0;
  defeatSound.play();
  document.getElementById("newGameButton").disabled = false;

  getLeaderboard()
    .then((leaderboard) => {
      if (leaderboard.length < 5 || score > leaderboard[4].score) {
        defeatSound.onended = () => {
          setTimeout(() => {
            victorySound.play();
            victorySound.onended = activateScoreSubmissionForm;
          }, 200);
        };
      } else {
        customAlert(
          "Your score is not high enough to be submitted to the leaderboard."
        );
      }
    })
    .catch(console.error);
}

function activateScoreSubmissionForm() {
  customAlert(
    `You won! Your score: ${score}. Enter your name to submit your score to the leaderboard.`
  );
  const form = document.getElementById("scoreSubmission");
  form.style.pointerEvents = "auto";
  form.style.opacity = "1";

  form.querySelectorAll("input, button").forEach((element) => {
    element.disabled = false;
  });

  document.getElementById("submitScoreButton").onclick = () => {
    const playerName = document.getElementById("playerName").value;
    const maxScore = rows * columns; // Maximum possible score based on the gameboard

    // Check if the score exceeds the maximum allowed
    if (score > maxScore) {
      customAlert(`Invalid score! The maximum possible score is ${maxScore}.`);
      return;
    }

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
      customAlert("Please enter a name!");
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

function customAlert(message) {
  modalMessage.textContent = message;
  customModal.style.display = "block";
  container.style.filter = "blur(5px)";
}

function closeModal() {
  customModal.style.display = "none";
  modalMessage.textContent = "";
  container.style.filter = "none";
}

getLeaderboard().then(displayLeaderboard).catch(console.error);
