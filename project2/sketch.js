// Global variables for images, game state, etc.
let roomImage;
let dogImage;
let ballImage;

let zones = [];
let message = "";
let score = 0; // "Oopsies" counter
let gameOver = false;
let win = false;

let ballX, ballY;
let ballSize = 40;  // Tennis ball dimensions

let gameState = "start"; // "start", "game", "over"

// Start and Restart button dimensions (in virtual coordinates)
let startButtonX, startButtonY, startButtonW = 200, startButtonH = 50;
let restartButtonX, restartButtonY, restartButtonW = 200, restartButtonH = 50;

const DOG_SIZE = 80;
const MARGIN = 10;

// Virtual game dimensions
const GAME_WIDTH = 1000;
const GAME_HEIGHT = 1000;
let scaleFactor = 1;
let offsetX = 0; // Horizontal offset to center the game

function preload() {
  // Replace these paths with your actual image URLs/paths.
  roomImage = loadImage("room.jpg");  
  dogImage = loadImage("dog.jpg");  
  ballImage = loadImage("tennisball.png");
}

function setup() {
  // Determine the available space from the window size and header height.
  let headerHeight = document.querySelector('header').offsetHeight;
  let availableWidth = windowWidth;
  let availableHeight = windowHeight - headerHeight;
  
  // Create the canvas to fill the available area.
  let cnv = createCanvas(availableWidth, availableHeight);
  cnv.parent('sketchContainer');
  // Center the canvas element itself horizontally
  cnv.style('display', 'block');
  cnv.style('margin', '0 auto');
  
  // Compute scale factor to fit our 1000x1000 virtual game into the canvas.
  scaleFactor = min(width / GAME_WIDTH, height / GAME_HEIGHT);
  // Calculate horizontal offset (in virtual coordinates) so that the game is centered.
  offsetX = (width/scaleFactor - GAME_WIDTH) / 2;
  
  // Compute start button position in virtual coordinates.
  startButtonX = GAME_WIDTH / 2 - startButtonW / 2;
  startButtonY = GAME_HEIGHT * 0.75;

  // Define interactive zones (virtual coordinates)
  zones = [
    { x: 0,  y: 500, w: 400, h: 275, label: "Left Sofa" },
    { x: 400, y: 300, w: 260, h: 180, label: "TV" },
    { x: 770, y: 650, w: 230, h: 400, label: "Right Sofa" },
    { x: 360, y: 650, w: 400, h: 200, label: "Coffee Table" },
    { x: 860, y: 320, w: 140,  h: 250, label: "Lamp" },
    { x: 0,  y: 170,  w: 120, h: 300, label: "Window" }
  ];

  // Place the ball initially.
  placeBall();
}

function draw() {
  // Clear the canvas.
  clear();
  
  // Apply scaling and horizontal centering
  scale(scaleFactor);
  translate(offsetX, 0);
  
  if (gameState === "start") {
    displayStartScreen();
    return;
  }
  
  if (gameOver) {
    displayGameOverScreen();
    return;
  }
  
  // Draw the room image covering virtual GAME_WIDTH x GAME_HEIGHT.
  image(roomImage, 0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Highlight zones on hover.
  for (let i = 0; i < zones.length; i++) {
    let zone = zones[i];
    // Adjust mouse coordinates for scaling and offset.
    let mX = (mouseX / scaleFactor) - offsetX;
    let mY = mouseY / scaleFactor;
    if (
      mX >= zone.x && mX <= zone.x + zone.w &&
      mY >= zone.y && mY <= zone.y + zone.h
    ) {
      noStroke();
      fill(255, 255, 0, 100);
      rect(zone.x, zone.y, zone.w, zone.h);
    }
  }

  // Display the message in the top left.
  fill(0);
  textSize(18);
  textAlign(LEFT, TOP);
  text(message, 20, 30);

  // Display the score ("Oopsies") in the top right.
  textAlign(RIGHT, TOP);
  text("Oopsies: " + score, GAME_WIDTH - 20, 20);

  // Draw the ball.
  image(ballImage, ballX, ballY, ballSize, ballSize);

  // Draw the dog image in a box at the bottom-left.
  fill(255);
  stroke(0);
  rect(MARGIN, GAME_HEIGHT - DOG_SIZE - MARGIN, DOG_SIZE, DOG_SIZE);
  image(dogImage, MARGIN, GAME_HEIGHT - DOG_SIZE - MARGIN, DOG_SIZE, DOG_SIZE);
  
  // Display mouse coordinates.
  displayCoordinates();
}

function mousePressed() {
  // Calculate adjusted mouse coordinates in virtual space.
  let mX = (mouseX / scaleFactor) - offsetX;
  let mY = mouseY / scaleFactor;
  
  if (gameState === "start") {
    if (
      mX >= startButtonX && mX <= startButtonX + startButtonW &&
      mY >= startButtonY && mY <= startButtonY + startButtonH
    ) {
      gameState = "game";
    }
    return;
  }
  
  if (gameOver) {
    if (
      mX >= restartButtonX && mX <= restartButtonX + restartButtonW &&
      mY >= restartButtonY && mY <= restartButtonY + restartButtonH
    ) {
      restartGame();
    }
    return;
  }
  
  // Check if the ball was clicked.
  if (
    mX >= ballX && mX <= ballX + ballSize &&
    mY >= ballY && mY <= ballY + ballSize
  ) {
    if (score < 5) {
      message = "Good boy, you found the ball with minimum damage!";
      win = true;
    } else {
      message = "Bad Dog! You have destroyed everything!";
      win = false;
    }
    gameOver = true;
    return;
  }
  
  // Check interactive zones.
  for (let i = 0; i < zones.length; i++) {
    let zone = zones[i];
    if (
      mX >= zone.x && mX <= zone.x + zone.w &&
      mY >= zone.y && mY <= zone.y + zone.h
    ) {
      score++;
      if (zone.label.toLowerCase().includes("sofa")) {
        message = "You peed on the sofa!";
      } else {
        message = "You broke the " + zone.label + "!";
      }
      if (score > 5) {
        message = "Bad Dog! You have destroyed everything!";
        gameOver = true;
      }
      return;
    }
  }
  
  message = "";
}

function restartGame() {
  score = 0;
  message = "";
  gameOver = false;
  win = false;
  placeBall();
  gameState = "game";
}

function placeBall() {
  let validPosition = false;
  while (!validPosition) {
    ballX = random(200, GAME_WIDTH);
    ballY = random(100, GAME_HEIGHT);
    validPosition = true;
    for (let i = 0; i < zones.length; i++) {
      let zone = zones[i];
      if (rectsOverlap(ballX, ballY, ballSize, ballSize, zone.x, zone.y, zone.w, zone.h)) {
        validPosition = false;
        break;
      }
    }
  }
}

function rectsOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
  return !(x1 + w1 < x2 || x1 > x2 + w2 || y1 + h1 < y2 || y1 > y2 + h2);
}

function displayStartScreen() {
  background(220);
  fill(0);
  textSize(24);
  textAlign(CENTER, TOP);
  text("Welcome to the Dog Game!", GAME_WIDTH / 2, 50);
  
  textSize(16);
  textAlign(CENTER, TOP);
  let rules = "Rules:\n- Find your ball, but don't break anything, or mom will be mad.\n- More than 5 Oopsies and you go to the pound.\n\nGood luck!";
  text(rules, GAME_WIDTH / 2, 100);
  
  // Draw the start button.
  fill(100, 200, 100);
  rect(startButtonX, startButtonY, startButtonW, startButtonH, 10);
  fill(0);
  textSize(20);
  textAlign(CENTER, CENTER);
  text("Start", startButtonX + startButtonW / 2, startButtonY + startButtonH / 2);
}

function displayGameOverScreen() {
  background(0);
  fill(255);
  textSize(32);
  textAlign(CENTER, CENTER);
  
  if (win) {
    text("You Win!\n" + message, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100);
  } else {
    text("Bad Dog!\n" + message, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100);
  }
  
  restartButtonX = GAME_WIDTH / 2 - restartButtonW / 2;
  restartButtonY = GAME_HEIGHT / 2 + 50;
  fill(100, 200, 100);
  rect(restartButtonX, restartButtonY, restartButtonW, restartButtonH, 10);
  fill(0);
  textSize(20);
  textAlign(CENTER, CENTER);
  text("Restart", restartButtonX + restartButtonW / 2, restartButtonY + restartButtonH / 2);
}

function displayCoordinates() {
  let coordsText = "x: " + floor((mouseX/scaleFactor - offsetX)) + ", y: " + floor(mouseY/scaleFactor);
  textSize(16);
  let padding = 5;
  let textW = textWidth(coordsText);
  let boxX = MARGIN + DOG_SIZE + 10;
  let boxY = GAME_HEIGHT - DOG_SIZE - MARGIN + DOG_SIZE / 2 - 10;
  
  fill(255);
  stroke(0);
  rect(boxX - padding, boxY - padding, textW + 2 * padding, 20 + 2 * padding);
  
  noStroke();
  fill(0);
  textAlign(LEFT, CENTER);
  text(coordsText, boxX, boxY + 10);
}
