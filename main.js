'use strict';

// Put variables in global scope to make them available to the browser console.
const constraints = window.constraints = {
  audio: false,
  video: { width: 320, height: 200, }
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
  const video_tracks = stream.getVideoTracks();
  const video_track = video_tracks[0];
  let settings = video_track.getSettings();

  video_track.onended = function(e) {
    console.log('onended fired:' + video_id);
  }

  video.addEventListener('load', function() {
    console.log('Video loaded successfully');
    // Perform additional actions here
  });

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
  errorMsg(`Error: ${error.name}`, error);
}

function errorMsg(msg, error) {
  console.log(msg);
}

async function testGetTextureStream(e) {
  try {
    const stream = await window.chrome.webview.getTextureStream('webview2-abcd1234'); // use default of 'webview2'.
    window.stream = stream;
    handleSuccess(stream, "videoStream", ".video-display");
  } catch (e) {
    handleError(e);
  }
}

async function testGetTextureStream2(e) {
  try {
    const stream = await window.chrome.webview.getTextureStream('webview2-abcd1234'); // use default of 'webview2'.
    window.stream2 = stream;
    handleSuccess(stream, "videoStream2", ".video-display2");
  } catch (e) {
    handleError(e);
  }
}

async function testSecondStream(e) {
  try {
    const stream = await window.chrome.webview.getTextureStream('webview2-second1234'); // use default of 'webview2'.
    window.stream3 = stream;
    handleSuccess(stream, "videoStream3", ".video-display");
  } catch (e) {
    handleError(e);
  }
}

async function SendBackToHost(streamId) {
  console.log("streamId:" + streamId);

  const transformer = new TransformStream({
    async transform(videoFrame, controller) {
      async function appSpecificCreateTransformedVideoFrame(originalVideoFrame) {
        // At this point the app would create a new video frame based on the original
        // video frame. For this sample we just delay for 1000ms and return the
        // original.
        await new Promise(resolve => setTimeout(resolve, 100));
        return originalVideoFrame;
      }
      // Delay frame 1000ms.
      let transformedVideoFrame = await
        appSpecificCreateTransformedVideoFrame(videoFrame);
      // We can create new video frame and edit them, and pass them back here
      // if needed.
      controller.enqueue(transformedVideoFrame);
    },
  });

  const trackGenerator = new MediaStreamTrackGenerator('video');
  await window.chrome.webview.registerTextureStream(streamId, trackGenerator);
  const stream = await window.chrome.webview.getTextureStream(streamId);
  window.stream2 = stream;
  handleSuccess(stream, "videoStream2", ".video-display2");

  const videoStream = stream.getVideoTracks()[0];
  const trackProcessor = new MediaStreamTrackProcessor(videoStream);
  trackProcessor.readable.pipeThrough(transformer).pipeTo(trackGenerator.writable)
}

function testDoubleStreamIds(e) {
    window.chrome.webview.getTextureStream('webview2-abcd1234')
    .then((stream) => {
      window.stream = stream;
      handleSuccess(stream, "videoStream", ".video-display");
      
    }).catch((err) => {
      handleError(err);
    });

    SendBackToHost('webview2-abcd1234-2', "videoStream2", ".video-display2");
}

async function testOpenWindow(e) {
  try {
    const getTextureStreamSite = "https://edge-webscratch/scratch/sunggch/webRTC/teams/getTextureStream/index.html";
    window.open(getTextureStreamSite);
  } catch (e) {
    handleError(e);
  }
}

async function testOpenRegisterWindow(e) {
  try {
    const registerTextureStreamSite = "https://edge-webscratch/scratch/sunggch/webRTC/teams/postTextureStream/index.html";
    window.open(registerTextureStreamSite);
  } catch (e) {
    handleError(e);
  }
}

async function testGetUserMedia(e) {
  try {
    console.log('before getUserMedial');
    // var constData = { video: { deviceId: "bogus_device_Id" } }
    var constData = { video: true }

    const stream = await navigator.mediaDevices.getUserMedia(constData);
    console.log('after getUserMedial')
    handleSuccess(stream, "mediaStream", ".video-display-test");

    // window.open("https://edge-webscratch/scratch/sunggch/webRTC/teams/postTextureStream/index.html");
  } catch (e) {
    handleError(e);
  }
}

async function testWriteDocument(e) {
  try {
    window.location.href = "edge://histograms";
    // var html = '<body><script>   chrome.webview.getTextureStream("webview2-abcd1234").then((stream) => { window.stream3 = stream}).catch((error) => { console.log(error); }) </script></body>';
    // document.open();
    // document.write(html);
    // document.close();
  } catch (e) {
    handleError(e);
  }
}

async function testWriteIframe(e) {
  try {
    var iframe = document.createElement('iframe');
    var html = '<body><script> chrome.webview.getTextureStream("webview2-abcd1234").then((stream) => { window.stream3 = stream}).catch((error) => { console.log(error); }) </script></body>';
    document.body.appendChild(iframe);
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(html);
    iframe.contentWindow.document.close();
  } catch (e) {
    handleError(e);
  }
}

async function testWriteIframeGetUserMedia(e) {
  try {
    var iframe = document.createElement('iframe');
    var html = '<body><script> navigator.mediaDevices.getUserMedia({video:true}).then((stream) => { window.stream3 = stream}).catch((error) => { console.log(error); }) </script></body>';
    document.body.appendChild(iframe);
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(html);
    iframe.contentWindow.document.close();
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

async function testCloneButton(e) {
  try {
    let track = window.stream.getVideoTracks()[0].clone();
    // Create a new MediaStream
    const stream = new MediaStream();

    // Add the MediaStreamTrack to the MediaStream
    stream.addTrack(track);
    window.stream2 = stream;
    handleSuccess(stream, "videoStream2", ".video-display2");
  } catch (e) {
    handleError(e);
  }
}

let g_enabled = false;
async function testEnabledButton(e) {
  try {
    window.stream.getVideoTracks()[0].enabled = g_enabled;
    g_enabled = !g_enabled;
  } catch (e) {
    handleError(e);
  }
}

async function testApplyConstraint(e) {
  try {
    let track = window.stream.getVideoTracks()[0];

          /// OVERRIDE Constraint
    const capabilities = track.getCapabilities()
      // Check whether brightness is supported or not.
      if (!capabilities.brightness) {
        return;
      }

    track.applyConstraints({advanced : [{brightness: 100}] });
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
document.querySelector('#openWindow-Get').addEventListener('click',
  e => testOpenWindow(e));  
document.querySelector('#openWindow-Register').addEventListener('click',
  e => testOpenRegisterWindow(e));    
document.querySelector('#getUserMediaButton').addEventListener('click',
  e => testGetUserMedia(e));
document.querySelector('#secondStream').addEventListener('click',
  e => testSecondStream(e));
  document.querySelector('#doubleStreamIds').addEventListener('click',
  e => testDoubleStreamIds(e));  
document.querySelector('#writeDocument').addEventListener('click',
e => testWriteDocument(e));
document.querySelector('#writeIframe').addEventListener('click',
e => testWriteIframe(e));
document.querySelector('#writeIframeGetUserMedia').addEventListener('click',
e => testWriteIframeGetUserMedia(e));
document.querySelector('#cloneButton').addEventListener('click',
e => testCloneButton(e));
document.querySelector('#enabledButton').addEventListener('click',
e => testEnabledButton(e));
document.querySelector('#applyConstraint').addEventListener('click',
e => testApplyConstraint(e));

window.frameMetadata = [];

window.chrome.webview.addEventListener("message", (args) => {
  if (typeof args.data === 'object' && "timestamp" in args.data) {
    // console.log("new entry:" + args.data.timestamp);
    if (window.frameMetadata.length > 0) {
      // If new timestamp is prior to the last timestamp, ignore it.
      if (window.frameMetadata[window.frameMetadata.length - 1].timestamp >= args.data.timestamp) {
        console.log("invalid timestamp: " + args.data.timestamp);
        return;
      }
    }
    
    // console.log("add an entry: " + args.data.timestamp);
    window.frameMetadata.push({timestamp: args.data.timestamp, alpha: args.data.alpha, backgroundColor:args.data.backgroundColor});
  } else {
    console.log("invalid parameters");
  }
});

function getMetadata(timestamp) {
  let foundIndex = -1;
  for(var i = 0; i <  window.frameMetadata.length; ++i){
    if(window.frameMetadata[i].timestamp == timestamp){
      foundIndex = i;

      console.log("found an entry: " + timestamp.toString());
      break;
    }
  }

  // remove all items before found timestamp because timestamp
  // is increasing order and do not care about the previous order.
  if (foundIndex !== -1) {
    const metadata = window.frameMetadata[foundIndex];
    window.frameMetadata.splice(0, foundIndex + 1);
    return metadata;
  }
  // failed metadata.
  
  console.log("failed to find:" + timestamp.toString());
  return {timestamp:-1};
}

