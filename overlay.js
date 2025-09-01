window.electronAPI.onLoadMedia((filePath) => {
    const container = document.getElementById("container");
    container.innerHTML = "";
  
    if (/\.(jpg|png|gif)$/i.test(filePath)) {
      const img = document.createElement("img");
      img.src = filePath;
      img.style.maxWidth = "100%";
      img.style.maxHeight = "100%";
      img.onload = () => {
        window.resizeTo(img.naturalWidth / 2, img.naturalHeight / 2); // подстраиваемся под картинку
      };
      container.appendChild(img);
    } else if (/\.(mp4|webm)$/i.test(filePath)) {
      const video = document.createElement("video");
      video.src = filePath;
      video.autoplay = true;
      video.controls = true;
      video.loop = true;
      video.style.maxWidth = "100%";
      video.style.maxHeight = "100%";
      container.appendChild(video);
      video.onloadedmetadata = () => {
        const { videoWidth, videoHeight } = video;
        window.resizeTo(videoWidth / 2, videoHeight / 2); // подстраиваемся под видео
      };
    }
  });

document.getElementById('overlayBtn').addEventListener('click', () => {
    window.electronAPI.toggleOverlay();
});