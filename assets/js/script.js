document.addEventListener("DOMContentLoaded", function () {
  const imageElement = document.getElementById("clickableImage");
  const linkWrapper = document.getElementById("linkWrapper");

  let isClicked = false;

  imageElement.addEventListener("click", function () {
    if (!isClicked) {
      isClicked = true;

      // Change to image 2
      imageElement.src = "images/Instagram2.avif";

      setTimeout(function () {
        // Change to image 3
        imageElement.src = "images/Instagram3.avif";

        setTimeout(function () {
          // Show the hidden link
          linkWrapper.style.display = "block";

          // Trigger the hidden link
          linkWrapper.click();
        }, 700);
      }, 700);
    }
  });
});
/*
var faviconImages = [];
for (var i = 0; i < 150; i++) {
    var frameNumber = ("000" + i).slice(-3); // Ensures the frame number is always three digits
    faviconImages.push('images/favicon/frame_' + frameNumber + '_delay-0.02s.ico');
}
var currentFavicon = 0;
var faviconElement = document.getElementById('dynamic-favicon');

setInterval(function() {
    currentFavicon = (currentFavicon + 1) % faviconImages.length;
    faviconElement.setAttribute('href', faviconImages[currentFavicon]);
}, 10); // Change every 20 milliseconds to match the 0.02s delay
*/
