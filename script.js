let currentsong = new Audio();
let songs = [];
let curfolder;
let currentIndex = 0; // track current song index

// Convert seconds to mm:ss
function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Display albums dynamically
async function displayalbums() {
  let res = await fetch("http://127.0.0.1:5500/songs/");
  let text = await res.text();
  let div = document.createElement("div");
  div.innerHTML = text;
  let anchors = div.getElementsByTagName("a");
  const cardcontainer = document.querySelector(".cardcontainer");

  for (let a of anchors) {
    if (a.href.includes("/songs")) {
      let folder = a.href.split("/").filter(Boolean).slice(-1)[0];
      try {
        let infoRes = await fetch(`http://127.0.0.1:5500/songs/${folder}/info.json`);
        let info = await infoRes.json();
        cardcontainer.innerHTML += `
          <div data-folder="${folder}" class="card">
            <div class="playb">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M8 5L19 12L8 19V5Z" fill="#141834" />
              </svg>
            </div>
            <img src="/songs/${folder}/cover.jpg" alt=""/>
            <h2>${info.title}</h2>
            <p>${info.description}</p>
          </div>`;
      } catch (err) {
        console.error(`Failed to load info.json for folder ${folder}`, err);
      }
    }
  }

  Array.from(document.getElementsByClassName("card")).forEach((card) => {
    card.addEventListener("click", async () => {
      await getsongs(`songs/${card.dataset.folder}`);
      if (songs.length > 0) playmusic(songs[0], 0, false);
    });
  });
}

// Get filename from full URL
function getFilenameFromSrc(src) {
  return decodeURIComponent(src.split("/").pop());
}

// Fetch songs from folder
async function getsongs(folder) {
  curfolder = folder;
  let res = await fetch(`http://127.0.0.1:5500/${folder}/`);
  let text = await res.text();
  let div = document.createElement("div");
  div.innerHTML = text;
  let links = div.getElementsByTagName("a");

  songs = [];
  for (let link of links) {
    if (link.href.endsWith(".mp3")) {
      songs.push(new URL(link.href).pathname.split("/").pop());
    }
  }

  const songUl = document.querySelector(".songlist ul");
  songUl.innerHTML = "";

  songs.forEach((song, idx) => {
    let cleanName = decodeURIComponent(song).replace(/\+/g, " ").trim();
    songUl.innerHTML += `<li>
      <img class="invert" src="music.svg" alt="">
      <div class="info"><div>${cleanName}</div></div>
      <div class="playnow"><span>Play Now</span><img class="invert" src="play.svg"></div>
    </li>`;
  });

  Array.from(songUl.getElementsByTagName("li")).forEach((li, idx) => {
    li.addEventListener("click", () => {
      playmusic(songs[idx], idx);
    });
  });
}

// Play a song by track name and index
function playmusic(track, index = 0, autoplay = true) {
  currentsong.src = `/${curfolder}/` + track;
  document.querySelector(".songinfo").innerText = decodeURIComponent(track).replace(/\+/g, " ");
  document.querySelector(".songtime").innerText = "00:00 / 00:00";
  currentIndex = index;

  const playBtn = document.getElementById("play");
  if (autoplay) {
    currentsong.play();
    playBtn.src = "pause.svg";
  } else {
    playBtn.src = "play.svg";
  }

  currentsong.addEventListener(
    "loadedmetadata",
    () => {
      updateSeekbar();
    },
    { once: true }
  );
}

// Update seekbar
function updateSeekbar() {
  const circle = document.querySelector(".circle");
  const seekbar = document.querySelector(".seekbar");
  const songtime = document.querySelector(".songtime");

  currentsong.addEventListener("timeupdate", () => {
    if (!currentsong.duration) return;
    const percent = (currentsong.currentTime / currentsong.duration) * 100;
    circle.style.left = percent + "%";
    songtime.innerText = `${secondsToMinutesSeconds(currentsong.currentTime)} / ${secondsToMinutesSeconds(currentsong.duration)}`;
  });

  seekbar.addEventListener("click", (e) => {
    const percent = (e.offsetX / seekbar.offsetWidth) * 100;
    circle.style.left = percent + "%";
    currentsong.currentTime = (currentsong.duration * percent) / 100;
  });
}

// Main function
async function main() {
  await displayalbums(); // display albums first
  await getsongs("songs/nocopy"); // then load songs
  if (songs.length > 0) playmusic(songs[0], 0, false);

  const playBtn = document.getElementById("play");
  const nextBtn = document.getElementById("next");
  const prevBtn = document.getElementById("previous");
  const volumebar = document.querySelector(".volume input");

  // Play/pause
  playBtn.addEventListener("click", () => {
    if (currentsong.paused) {
      currentsong.play();
      playBtn.src = "pause.svg";
    } else {
      currentsong.pause();
      playBtn.src = "play.svg";
    }
  });

  // Next/Previous
  nextBtn.addEventListener("click", () => {
    if (currentIndex + 1 < songs.length) {
      currentIndex++;
      playmusic(songs[currentIndex], currentIndex);
    }
  });
  prevBtn.addEventListener("click", () => {
    if (currentIndex - 1 >= 0) {
      currentIndex--;
      playmusic(songs[currentIndex], currentIndex);
    }
  });

  // Volume
  volumebar.addEventListener("input", (e) => {
    currentsong.volume = e.target.value / 100;
  });

  // Sidebar toggle
  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
  });
  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-100%";
  });
  document.querySelector(".volume>img").addEventListener("click",(e) => {
      if (e.target.src.includes("volume.svg")) {
        e.target.src= e.target.src.replace("volume.svg","mute.svg")
        currentsong.volume = 0;
        document.querySelector(".range").getElementsByTagName("input")[0].value = 0
      } else {
        e.target.src= e.target.src.replace("mute.svg","volume.svg")
        currentsong.volume = .10;
        document.querySelector(".range").getElementsByTagName("input")[0].value = 10

      }
  })
}

// Start
main();
