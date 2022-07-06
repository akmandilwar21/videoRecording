"use strict";

/* globals MediaRecorder */

let mediaRecorder;
let recordedBlobs;
let [seconds, minutes] = [0, 0];
let timerRef = document.querySelector(".timerDisplay");
let int = null;
const errorMsgElement = document.querySelector("span#errorMsg");
const recordedVideo = document.querySelector("video#recorded");
const recordButton = document.querySelector("button#record");
const playButton = document.querySelector("button#play");
const downloadButton = document.querySelector("button#download");
const uploadButton = document.querySelector("button#upload");
const image = document.querySelector("img#image");
const timer = document.querySelector("div#timerDisplay");
var modal = document.getElementById("myModal");
var span = document.getElementsByClassName("close")[0];

recordButton.addEventListener("click", () => {
  if (recordButton.textContent === "Start") {
    startRecording();
  } else {
    stopRecording();
    recordButton.textContent = "Stop";
    recordButton.style.cursor = "not-allowed";
    recordButton.style.background = "#d08b8b";
    playButton.style.cursor = "pointer";
    playButton.style.background = "yellow";
    playButton.style.color = "black";
    uploadButton.style.background = "green";
    uploadButton.style.color = "white";
    downloadButton.style.background = "#340eec";
    downloadButton.style.cursor = "pointer";
    uploadButton.style.cursor = "pointer";
    recordButton.disabled = true;
    playButton.disabled = false;
    downloadButton.disabled = false;
  }
});

playButton.addEventListener("click", () => {
  document.getElementById("gum").style.display = "none";
  document.getElementById("recorded").style.display = "block";
  const superBuffer = new Blob(recordedBlobs, { type: "video/webm" });
  recordedVideo.src = null;
  recordedVideo.srcObject = null;
  recordedVideo.src = window.URL.createObjectURL(superBuffer);
  recordedVideo.controls = true;
  recordedVideo.play();
});

downloadButton.addEventListener("click", () => {
  const blob = new Blob(recordedBlobs, { type: "video/mp4" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = "test.mp4";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
});

function handleDataAvailable(event) {
  console.log("handleDataAvailable", event);
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

function startRecording() {
  recordedBlobs = [];
  let options = { mimeType: "video/webm;codecs=vp9,opus" };
  image.style.display = "block";
  timer.style.display = "block";
  // document.getElementById("timerDisplay").innerHTML.style.display = "block";
  // document.getElementById("image").innerHTML.style.display = "block";
  try {
    mediaRecorder = new MediaRecorder(window.stream, options);
    if (int !== null) {
      clearInterval(int);
    }
    int = setInterval(displayTimer, 1000);
  } catch (e) {
    console.error("Exception while creating MediaRecorder:", e);
    errorMsgElement.innerHTML = `Exception while creating MediaRecorder: ${JSON.stringify(
      e
    )}`;
    return;
  }

  console.log("Created MediaRecorder", mediaRecorder, "with options", options);
  recordButton.textContent = "Stop";
  recordButton.style.background = "red";
  playButton.disabled = true;
  downloadButton.disabled = true;
  mediaRecorder.onstop = (event) => {
    console.log("Recorder stopped: ", event);
    console.log("Recorded Blobs: ", recordedBlobs);
  };
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start();
  console.log("MediaRecorder started", mediaRecorder);
}
function displayTimer() {
  seconds++;
  if (seconds == 60) {
    seconds = 0;
    minutes++;
  }
  let m = minutes < 10 ? "0" + minutes : minutes;
  let s = seconds < 10 ? "0" + seconds : seconds;

  timerRef.innerHTML = ` ${m} : ${s}`;
}
function stopRecording() {
  mediaRecorder.stop();
  clearInterval(int);
}

function handleSuccess(stream) {
  modal.style.display = "block";
  recordButton.disabled = false;
  console.log("getUserMedia() got stream:", stream);
  window.stream = stream;

  const gumVideo = document.querySelector("video#gum");
  gumVideo.srcObject = stream;
}

async function init(constraints) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log(navigator.mediaDevices.getUserMedia);
    handleSuccess(stream);
  } catch (e) {
    console.error("navigator.getUserMedia error:", e);
    errorMsgElement.innerHTML = `navigator.getUserMedia error:${e.toString()}`;
  }
}

document.querySelector("div#start").addEventListener("click", async () => {
  // const hasEchoCancellation =
  //   document.querySelector("#echoCancellation").checked;

  const constraints = {
    audio: {
      echoCancellation: { exact: true },
    },
    video: {
      width: 1280,
      height: 720,
    },
  };
  console.log("Using media constraints:", constraints);

  await init(constraints);
});
span.onclick = function () {
  console.log("check");
  modal.style.display = "none";
  stream.getTracks().forEach(function (track) {
    track.stop();
  });
};
