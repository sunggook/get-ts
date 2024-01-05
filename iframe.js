'use strict';

// Put variables in global scope to make them available to the browser console.
const constraints = window.constraints = {
  audio: false,
  video: { width: 320, height: 200,  }
  // video: { width: 1280, height: 640, facingMode: { exact: "environment" }  }
};

let maxLocalDelay = -1;
const windowSize = 30;
function requestVideo(localVideo) {
  localVideo.requestVideoFrameCallback(function rVFC(now, metaData) {
    // For graph purposes, take the maximum over a window.
    maxLocalDelay = Math.max(1000 * (metaData.expectedDisplayTime - metaData.captureTime), maxLocalDelay);

    // if (metaData.presentedFrames % windowSize !== 0) {
    //   localVideo.requestVideoFrameCallback(rVFC);
    //   return;
    // }
    // The graph library does not like the performance.now() style `now`.
    // localDelaySeries.addPoint(Date.now(), maxLocalDelay);
    // localDelayGraph.setDataSeries([localDelaySeries]);
    // localDelayGraph.updateEndDate();

    maxLocalDelay = -1;
    // window.chrome.webview.postMessage("VF");
    // localVideo.requestVideoFrameCallback(rVFC);
  });
}

function showOpenButton(showOpen) {
  document.querySelector('#closeVideo').style.display = showOpen ? "none" : "block";
  document.querySelector('#showVideo').style.display = showOpen ? "block" : "none";
}

function handleSuccess(stream, video_id, video_class) {
  const video = document.getElementById(video_id);
  const videoTrack = stream.getVideoTracks()[0];
  videoTrack.onended = function(e) {
    console.log('iframe: onended fired:' + video_id);
  }

  video.srcObject = stream;

  document.querySelector(video_class).style.display = "block";
}

function handleError(error) {
  if (error.name === 'OverconstrainedError') {
    const v = constraints.video;
    errorMsg(`The resolution ${v.width.exact}x${v.height.exact} px is not supported by your device.`);
  } else if (error.name === 'NotAllowedError') {
    errorMsg('Permissions have not been granted to use your camera and ' +
      'microphone, you need to allow the page access to your devices in ' +
      'order for the demo to work.');
  }
  errorMsg(`getUserMedia error: ${error.name}`, error);
}

function errorMsg(msg, error) {
  console.log(msg);
}

async function testGetTextureStream(e) {
  try {
    const stream = await window.chrome.webview.getTextureStream('webview2-abcd1234'); // use default of 'webview2'.
    handleSuccess(stream, "videoStream", ".video-display");
    window.stream = stream;
  } catch (e) {
    handleError(e);
  }
}

async function testGetTextureStream2(e) {
  try {
    const stream = await window.chrome.webview.getTextureStream('webview2-abcd1234'); // use default of 'webview2'.
    handleSuccess(stream, "videoStream2", ".video-display2");
    window.stream2 = stream;
  } catch (e) {
    handleError(e);
  }
}

async function testGetUserMedia(e) {
  try {
    console.log('before getUserMedial');
    var constData = {video: { deviceId: "bogus_device_Id"}}

    const stream = await navigator.mediaDevices.getUserMedia(constData);
    console.log('after getUserMedial')
    handleSuccess(stream, "mediaStream", ".video-display-test");
  } catch (e) {
    handleError(e);
  }
}

async function close(e) {
  try {
    window.stream.getVideoTracks()[0].stop();
    showOpenButton(true);
  } catch (e) {
    handleError(e);
  }
}

async function close2(e) {
  try {
    window.stream2.getVideoTracks()[0].stop();
    showOpenButton(true);
  } catch (e) {
    handleError(e);
  }
}

document.querySelector('#showVideo').addEventListener('click',
    e => testGetTextureStream(e));
document.querySelector('#showVideo2').addEventListener('click',
    e => testGetTextureStream2(e));
document.querySelector('#closeVideo').addEventListener('click',
    e => close(e));
document.querySelector('#closeVideo2').addEventListener('click',
    e => close2(e));
document.querySelector('#getUserMediaButton').addEventListener('click',
    e => testGetUserMedia(e));
