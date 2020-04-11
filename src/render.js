const { desktopCapturer, remote } = require("electron");
const { writeFile } = require("fs");

const { dialog, Menu } = remote;

let mediaRecorder;
const recordedChunks = [];

const startBtn = document.getElementById("startBtn");
startBtn.onclick = (e) => {
  mediaRecorder.start();
  startBtn.classList.add("btn-danger");
  startBtn.innerText = "Recording";
};

const stopBtn = document.getElementById("stopBtn");
stopBtn.onclick = (e) => {
  mediaRecorder.stop();
  startBtn.classList.remove("btn-danger");
  startBtn.innerText = "Start";
};

const handleDataAvailable = (e) => {
  recordedChunks.push(e.data);
};

const handleStop = async (e) => {
  const blob = new Blob(recordedChunks, {
    type: "video/webm; codecs=vp9",
  });

  const buffer = Buffer.from(await blob.arrayBuffer());

  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: "Save",
    defaultPath: `capture-${Date.now()}.webm`,
  });
  writeFile(filePath, buffer, () => alert("Video saved successfully"));
};

const videoPlayer = document.querySelector("video");
const videoSelectBtn = document.getElementById("videoSelectBtn");

// selectsource changes the videoSource to record.
const selectSource = async (src) => {
  videoSelectBtn.innerText = `Source: ${src.name}`;

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: src.id,
      },
    },
  };

  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  // Preview the source in videoPlayer
  videoPlayer.srcObject = stream;
  videoPlayer.play();

  const options = { mimeType: "video/webm; codecs=vp9" };
  mediaRecorder = new MediaRecorder(stream, options);

  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
};

// videoSources gets the available video sources.
const videoSources = async () => {
  const inputSources = await desktopCapturer.getSources({
    types: ["window", "screen"],
  });
  const optionsMenu = Menu.buildFromTemplate(
    inputSources.map((src) => {
      return {
        label: src.name,
        click: () => selectSource(src),
      };
    })
  );

  optionsMenu.popup();
};

videoSelectBtn.onclick = videoSources;
