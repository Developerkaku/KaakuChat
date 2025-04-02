
const root = document.documentElement;
const iframe = document.getElementById("iframe");
const loaderStatus = document.getElementById("loader-status");
const note = document.getElementById("note");
const percentageText = document.getElementById("percentage-text");

let dynamicLoadStep = Math.floor(Math.random() * (70 - 35 + 1)) + 30;
let dynamicDuration = Math.floor(Math.random() * (7 - 1 + 1)) + 1;
root.style.setProperty('--dynamicLoadStep', `${dynamicLoadStep}vw`);
loaderStatus.style.animation = `loadStart ${dynamicDuration}s ease-out forwards`;
loaderStatus.style.animationDelay = '1s';

// Display percentage dynamically

// function timeOut() {
//     return new Promise((resolve, reject) => {
//         setTimeout(() => {
//             resolve();
//         }, 1000);
//     })
// }
// let currentPercentage = 0;
// async function displayPercentage() {
//     await timeOut();
//     const interval = setInterval(() => {
//         if (currentPercentage < dynamicLoadStep) {
//             currentPercentage += 1;
//             percentageText.textContent = `${currentPercentage}%`;
//         }
//     }, (dynamicDuration * 1000) / dynamicLoadStep);
// }
// // displayPercentage();
const element = document.querySelector('#loader-status');
const loader = document.getElementById("loader");
let maxWidth = window.getComputedStyle(loader).width.replace("px", "");
maxWidth = Math.floor(Number(maxWidth));
// Create a new ResizeObserver
const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
        // Check the width of the element
        const newWidth = entry.contentRect.width;
        percentageText.style.left = `${newWidth}px`;

        currentPercentage = Math.floor((newWidth / maxWidth) * 100);
        // currentPercentage = Math.floor((newWidth / window.innerWidth) * 100);
        percentageText.textContent = `${currentPercentage}%`;

        // Run your code when the width changes
        console.log("Width changed to:", newWidth, window.getComputedStyle(loader).width);
        // Place any other code you want to run here
    }
});
// Start observing the selected element
resizeObserver.observe(element);

// Display note and percentage text after some time
setTimeout(() => {
    note.style.opacity = '1';
    percentageText.style.opacity = '1';
}, 3500);

//The end ... After the server powers up!
iframe.onload = () => {
    iframe.remove();
    root.style.setProperty('--dynamicLoadStart', `${dynamicLoadStep}%`);
    root.style.setProperty('--dynamicLoadEnd', `100vw`);
    loaderStatus.style.animation = `loadEnd 3s ease-in forwards`;

    // redirecting the user to the main page 
    setTimeout(() => {
        window.location.href = "https://kaakuchat.onrender.com/";
    }, 3000)
}