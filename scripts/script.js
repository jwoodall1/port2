/*******************************************************
 * DOMContentLoaded - Starfield & Navigation Toggle
 *******************************************************/
document.addEventListener('DOMContentLoaded', function () {
  console.log("Page loaded. Initializing starfield & nav toggle...");

  // Create the starfield background with randomly placed stars
  createStarfield(150);

  // Setup navigation toggle
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function() {
      mainNav.classList.toggle('active');
    });
  }
});

/**
 * Creates a starfield background by appending .star divs
 */
function createStarfield(numStars) {
  const starfield = document.getElementById('starfield');
  if (!starfield) return;
  starfield.innerHTML = "";
  for (let i = 0; i < numStars; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.left = Math.random() * 100 + 'vw';
    star.style.top = Math.random() * 100 + 'vh';
    const size = Math.random() * 2 + 1;
    star.style.width = size + 'px';
    star.style.height = size + 'px';
    star.style.animationDelay = Math.random() * 5 + 's';
    starfield.appendChild(star);
  }
}
