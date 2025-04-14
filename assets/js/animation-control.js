// Select all card pairs
const aniCtrl = document.querySelectorAll(".ani-ctrl");

// Intersection Observer options
const options = {
  root: null, // Use the viewport as the root
  rootMargin: "0px",
  threshold: 0.0001, // Trigger when the slightest part of the card is visible
};

// Callback function for the Intersection Observer
const observerCallback = (entries) => {
  const screenWidth = window.innerWidth;

  entries.forEach((entry) => {
    const rScroll = entry.target.querySelector(".r-scroll");
    const mScroll = entry.target.querySelector(".m-scroll");
    const gradient1Elements = entry.target.querySelectorAll(".gradient-1");
    const gradient2Elements = entry.target.querySelectorAll(".gradient-2");
    const cardElements = entry.target.querySelectorAll(".card");

      // For screens under 767px, add only left classes to all cards (left, center, right)
      if (entry.isIntersecting) {
        if (rScroll) {
            rScroll.classList.add("ani-ctrl-r-scroll");
        }
        if (mScroll) {
            mScroll.classList.add("ani-ctrl-m-scroll"); 
        }
        gradient1Elements.forEach(gradient1 => {
            gradient1.classList.add("ani-ctrl-gradient-1");
        });
          gradient2Elements.forEach(gradient2 => {
            gradient2.classList.add("ani-ctrl-gradient-2"); 
        });
        cardElements.forEach(card => {
            card.classList.add("ani-ctrl-card");
          });
      } else {
        // Remove left classes for all cards when out of view
        if (rScroll) {
            rScroll.classList.remove("ani-ctrl-r-scroll");
          }
          if (mScroll) {
            mScroll.classList.remove("ani-ctrl-m-scroll"); 
          }
          gradient1Elements.forEach(gradient1 => {
            gradient1.classList.remove("ani-ctrl-gradient-1");
          });
          gradient2Elements.forEach(gradient2 => {
            gradient2.classList.remove("ani-ctrl-gradient-2");
          });
          cardElements.forEach(card => {
            card.classList.remove("ani-ctrl-card");
          });
      }
  });
};

// Create the Intersection Observer instance
const animationObserver = new IntersectionObserver(observerCallback, options);


// Observe each card pair
aniCtrl.forEach((aniCtrlObject) => animationObserver.observe(aniCtrlObject));


window.addEventListener("resize", () => {
  // Re-run the observer callback on resize (to handle screen size changes dynamically)
  animationObserver.disconnect(); // Stop observing
  aniCtrl.forEach((aniCtrlObject) => animationObserver.observe(aniCtrlObject)); // Re-observe after resize
});
