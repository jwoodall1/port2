let handPose;
let video;
let hands = [];
let bucketImg;
let coinImg;
let bombImg;
let options = { flipped: true };

let coins = [];  // Array to hold falling coins
let bombs = [];  // Array to hold falling bombs
let score = 0;
let highScore = 0; // Global high score

// Game duration and states
let gameDuration = 30; // Game duration in seconds
let gameState = "start"; // "start", "countdown", "running", "gameOver"
let countdownTime = 3;   // Countdown before game starts (in seconds)
let countdownStart;      // When the countdown started
let gameStartTime;       // When the actual game started

// Game over message variable (either "Time's Up!" or "Boom!")
let gameOverMessage = "";

// Global flag to show bounding boxes
let showBoundingBoxes = true;

// Button properties for main (Play/Restart) and bounding toggle buttons
let buttonW = 200;
let buttonH = 60;
let buttonX, buttonY;
let toggleButtonW = 250; // initial width; we'll update this when needed
let toggleButtonH = 60;
let toggleButtonX, toggleButtonY;

// For finger-based triggering: if the index finger remains inside a button for 5 seconds, trigger its action.
const triggerTime = 5000; // milliseconds needed to trigger
let mainButtonProgress = 0;   // time (ms) finger has stayed on the main button
let toggleButtonProgress = 0; // time (ms) finger has stayed on the toggle button

// Cache toggle button text so we only recalc width when needed
let toggleButtonText = "Bounding Boxes: ON";

function preload() {
  // Initialize the handPose model with options
  handPose = ml5.handPose(options);
  
  // Load images (update paths accordingly)
  bucketImg = loadImage("bucket.png");
  coinImg = loadImage("coin.png");
  bombImg = loadImage("bomb.png");
}

function setup() {
  createCanvas(640, 480);
  
  // Setup video capture (flipped)
  video = createCapture(VIDEO, { flipped: true });
  video.size(640, 480);
  video.hide();
  
  // Start hand pose detection
  handPose.detectStart(video, gotHands);
  
  // Position main button (centered) and toggle button (below main)
  buttonX = width / 2 - buttonW / 2;
  buttonY = height / 2 - buttonH / 2;
  toggleButtonY = buttonY + buttonH + 20;
  updateToggleButtonWidth();
}

function draw() {
  background(255);
  image(video, 0, 0, width, height);
  
  // Always display high score (top left)
  textSize(32);
  fill(0);
  noStroke();
  textAlign(LEFT, TOP);
  text("High Score: " + highScore, 20, 20);
  
  // Get the index finger position from the first detected hand (if any)
  let fingerX, fingerY;
  if (hands.length > 0) {
    let indexFinger = hands[0].keypoints[8];
    fingerX = indexFinger.x;
    fingerY = indexFinger.y;
  } else {
    fingerX = fingerY = null;
  }
  
  if (gameState === "start") {
    // Draw buttons on the start screen (main: "Play", toggle: "Bounding Boxes: ON/OFF")
    drawButton("Play", buttonX, buttonY, buttonW, buttonH, mainButtonProgress);
    drawButton(toggleButtonText, toggleButtonX, toggleButtonY, toggleButtonW, toggleButtonH, toggleButtonProgress);
    
    // Finger-based triggering for main button
    if (fingerX && fingerY && isInside(fingerX, fingerY, buttonX, buttonY, buttonW, buttonH)) {
      mainButtonProgress += deltaTime;
      drawLoadingBar(buttonX, buttonY, buttonW, buttonH, mainButtonProgress);
      if (mainButtonProgress >= triggerTime) {
        gameState = "countdown";
        countdownStart = millis();
        mainButtonProgress = 0;
      }
    } else {
      mainButtonProgress = 0;
    }
    
    // Finger-based triggering for toggle button
    if (fingerX && fingerY && isInside(fingerX, fingerY, toggleButtonX, toggleButtonY, toggleButtonW, toggleButtonH)) {
      toggleButtonProgress += deltaTime;
      drawLoadingBar(toggleButtonX, toggleButtonY, toggleButtonW, toggleButtonH, toggleButtonProgress);
      if (toggleButtonProgress >= triggerTime) {
        showBoundingBoxes = !showBoundingBoxes;
        toggleButtonProgress = 0;
        updateToggleButtonText();
        updateToggleButtonWidth();
      }
    } else {
      toggleButtonProgress = 0;
    }
  } 
  else if (gameState === "countdown") {
    // Show countdown number in center
    let elapsedCountdown = (millis() - countdownStart) / 1000;
    let count = ceil(countdownTime - elapsedCountdown);
    textSize(64);
    fill(0);
    noStroke();
    textAlign(CENTER, CENTER);
    text(count, width / 2, height / 2);
    if (elapsedCountdown >= countdownTime) {
      gameState = "running";
      gameStartTime = millis();
    }
  }
  else if (gameState === "running") {
    let elapsedGameTime = (millis() - gameStartTime) / 1000;
    let timeLeft = gameDuration - elapsedGameTime;
    if (timeLeft <= 0) {
      gameState = "gameOver";
      gameOverMessage = "Time's Up!";
      timeLeft = 0;
    }
    
    // Spawn coins and bombs
    if (frameCount % 30 === 0) {
      coins.push({
        x: random(20, width - 20),
        y: -20,
        speed: random(2, 5)
      });
    }
    if (frameCount % 120 === 0) {
      bombs.push({
        x: random(20, width - 20),
        y: -20,
        speed: random(3, 6)
      });
    }
    
    // Update and draw coins
    for (let i = coins.length - 1; i >= 0; i--) {
      let coin = coins[i];
      coin.y += coin.speed;
      
      // Check collision with bucket (for every detected hand)
      for (let j = 0; j < hands.length; j++) {
        let hand = hands[j];
        let indexFinger = hand.keypoints[8];
        let bucketLeft = indexFinger.x - 20;
        let bucketRight = indexFinger.x + 20;
        let bucketTop = indexFinger.y - 20;
        let bucketBottom = indexFinger.y + 20;
        if (coin.x > bucketLeft && coin.x < bucketRight &&
            coin.y > bucketTop && coin.y < bucketBottom) {
          score++;
          coins.splice(i, 1);
          break;
        }
      }
      
      // Draw coin if still active
      if (coins[i]) {
        coin = coins[i];
        image(coinImg, coin.x - 15, coin.y - 15, 30, 30);
        if (showBoundingBoxes) {
          noFill();
          stroke(0, 255, 0);
          strokeWeight(2);
          rect(coin.x - 15, coin.y - 15, 30, 30);
        }
        if (coin.y > height + 20) {
          coins.splice(i, 1);
        }
      }
    }
    
    // Update and draw bombs
    for (let i = bombs.length - 1; i >= 0; i--) {
      let bomb = bombs[i];
      bomb.y += bomb.speed;
      
      // Check collision with bucket for bombs
      for (let j = 0; j < hands.length; j++) {
        let hand = hands[j];
        let indexFinger = hand.keypoints[8];
        let bucketLeft = indexFinger.x - 20;
        let bucketRight = indexFinger.x + 20;
        let bucketTop = indexFinger.y - 20;
        let bucketBottom = indexFinger.y + 20;
        if (bomb.x > bucketLeft && bomb.x < bucketRight &&
            bomb.y > bucketTop && bomb.y < bucketBottom) {
          gameState = "gameOver";
          gameOverMessage = "Boom!";
          coins = [];
          bombs = [];
          break;
        }
      }
      
      // Draw bomb if still active
      if (bombs[i]) {
        bomb = bombs[i];
        image(bombImg, bomb.x - 15, bomb.y - 15, 30, 30);
        if (showBoundingBoxes) {
          noFill();
          stroke(255, 0, 0);
          strokeWeight(2);
          rect(bomb.x - 15, bomb.y - 15, 30, 30);
        }
        if (bomb.y > height + 20) {
          bombs.splice(i, 1);
        }
      }
    }
    
    // Display score and timer during running state
    textSize(32);
    fill(0);
    noStroke();
    textAlign(RIGHT, TOP);
    text("Score: " + score, width - 20, 20);
    
    textAlign(LEFT, TOP);
    text("Time: " + timeLeft.toFixed(1), 20, 60);
  }
  else if (gameState === "gameOver") {
    if (score > highScore) {
      highScore = score;
    }
    
    fill(0, 150);
    rect(0, 0, width, height);
    
    textAlign(CENTER, CENTER);
    fill(255);
    textSize(48);
    text(gameOverMessage, width / 2, height / 2 - 90);
    textSize(36);
    text("Final Score: " + score, width / 2, height / 2 - 30);
    textSize(32);
    text("High Score: " + highScore, width / 2, height / 2 + 10);
    
    buttonY = height / 2 + 70;
    toggleButtonY = buttonY + buttonH + 20;
    updateToggleButtonWidth();
    drawButton("Restart", buttonX, buttonY, buttonW, buttonH, mainButtonProgress);
    drawButton(toggleButtonText, toggleButtonX, toggleButtonY, toggleButtonW, toggleButtonH, toggleButtonProgress);
    
    if (fingerX && fingerY && isInside(fingerX, fingerY, buttonX, buttonY, buttonW, buttonH)) {
      mainButtonProgress += deltaTime;
      drawLoadingBar(buttonX, buttonY, buttonW, buttonH, mainButtonProgress);
      if (mainButtonProgress >= triggerTime) {
        resetGame();
        gameState = "countdown";
        countdownStart = millis();
        mainButtonProgress = 0;
      }
    } else {
      mainButtonProgress = 0;
    }
    
    if (fingerX && fingerY && isInside(fingerX, fingerY, toggleButtonX, toggleButtonY, toggleButtonW, toggleButtonH)) {
      toggleButtonProgress += deltaTime;
      drawLoadingBar(toggleButtonX, toggleButtonY, toggleButtonW, toggleButtonH, toggleButtonProgress);
      if (toggleButtonProgress >= triggerTime) {
        showBoundingBoxes = !showBoundingBoxes;
        toggleButtonProgress = 0;
        updateToggleButtonText();
        updateToggleButtonWidth();
      }
    } else {
      toggleButtonProgress = 0;
    }
  }
  
  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];
    let indexFinger = hand.keypoints[8];
    image(bucketImg, indexFinger.x - 20, indexFinger.y - 20, 40, 40);
  }
}

function mousePressed() {
  if (gameState === "start" || gameState === "gameOver") {
    if (isInside(mouseX, mouseY, buttonX, buttonY, buttonW, buttonH)) {
      if (gameState === "start") {
        gameState = "countdown";
        countdownStart = millis();
      } else if (gameState === "gameOver") {
        resetGame();
        gameState = "countdown";
        countdownStart = millis();
      }
    }
    if (isInside(mouseX, mouseY, toggleButtonX, toggleButtonY, toggleButtonW, toggleButtonH)) {
      showBoundingBoxes = !showBoundingBoxes;
      updateToggleButtonText();
      updateToggleButtonWidth();
    }
  }
}

function isInside(x, y, rx, ry, rw, rh) {
  return (x >= rx && x <= rx + rw && y >= ry && y <= ry + rh);
}

function drawButton(label, x, y, w, h, progress) {
  fill(0, 150);
  noStroke();
  rect(x, y, w, h, 10);
  
  textSize(32);
  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  text(label, x + w / 2, y + h / 2);
}

function drawLoadingBar(x, y, w, h, progress) {
  let barWidth = map(progress, 0, triggerTime, 0, w);
  noStroke();
  fill(0, 200, 0, 150);
  rect(x, y + h - 10, barWidth, 10);
}

function resetGame() {
  coins = [];
  bombs = [];
  score = 0;
  gameStartTime = millis();
}

function updateToggleButtonText() {
  toggleButtonText = "Bounding Boxes: " + (showBoundingBoxes ? "ON" : "OFF");
}

function updateToggleButtonWidth() {
  textSize(32);
  toggleButtonW = textWidth(toggleButtonText) + 40;
  toggleButtonX = width / 2 - toggleButtonW / 2;
}

function gotHands(results) {
  hands = results;
}
