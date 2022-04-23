let topClips = [];
let distribution = {}; // for testing purposes
const delay = ms => new Promise(res => setTimeout(res, ms));
const FIVE_SECONDS = 5 * 1000;
const DEFAULT_WIDTH = 1280
const DEFAULT_HEIGHT = 720

// TODO: add support for duration parameter
async function getClips(username, limit = 100, period = 'all', duration_limit = 15, weighted = true, trending = false) {
    // Note: await/async unsupported in some older browsers (IE/Opera?)
    let url = `https://secondubly.tv/clippy/getclips?channel=${username}&limit=${limit}&period=${period}&trending=${trending}`

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        
        if(!response.ok) {
            return new Error(response.text())
        } else {
            // regex
            const regex = /(-\D*-\d+x\d+.\D*)/g;
            const file_ext = '.mp4';

            const data = await response.json();
            topClips = data.clips.filter(clip => clip.duration < duration_limit);
            topClips.forEach((clip) => {
                clip.mp4 = clip.thumbnail_url.replace(regex, file_ext);
                delete clip.thumbnail_url // remove the thumbnail, we don't need it
            })
        }
    } catch(e) {
        console.error(`Something went wrong: ${e}`)
    }
}

function getRandomWeightedClip(clips, percentage = 0.50) {
    // first generate the weight for each clip
    let weights = [0]; // holds the weights for each clip (skipping position 0)
    let total_weight = 0;
    
    // generate weights for each clip, using the percentage
    // a, b, c
    // 0, 1, 2 = i
    for (let i = 0; i < clips.length; i++) {
        let item_weight = 1 / (1 + i) * percentage;
        weights.push(item_weight);
        total_weight += item_weight; // add up the total weight for ALL items (this is important for later)
    }

    // pick a random number between 0 and 1 (but NOT 1), and multiply it by the total weight
    // to give an upper limit
    const upper_limit = Math.random() * total_weight;
    total_weight = 0;
    for(let i = 0; i < weights.length; ++i) {
        // add the weight to our running total (which starts at 0)
        total_weight += weights[i];

        // if this total weight is greater than the upper limit
        // then we are in the proper range, so return the clip
        if (total_weight >= upper_limit) {
            return clips[i - 1];
            // return i - 1; // for testing purposes
        }
    }
    // in case the loop fails (why would it?)
    return clips[clips.length - 1];
    // return clips.length - 1; // for testing purposes
}

function getRandomClip(clips) {
    const randomIndex = Math.random() * clips.length;
    return clips[randomIndex];

}

async function playClip(visible, clipSrc) {
    if (visible) {
        let video = document.querySelector("#stream-clip")
        let container = document.querySelector('#clip-container');

        // Example twitch clip mp4 URL:
        // https://clips-media-assets.twitch.tv/157589949.mp4


        // create source element
        createClipSrc(video, clipSrc.mp4);
        video.style.display = 'block';

        // set container to be visible
        container.classList.add('show');
        video.play();
        
        // remove source when video has ended
        video.onended = () => {
            video.muted = true;
            container.classList.remove('show'); // hide container
            video.style.display = 'none'; // hide video container again
            video.removeAttribute('src'); // remove video source
        }
    } else {
        // Don't show clip box
        let container = document.querySelector('#clip-container');
        let frame = document.querySelector("#stream-clip");

        // hide container
        container.classList.remove('show')

        // restore default iframe content after 3 seconds
        await delay(500);
        frame.setAttribute('src', '/clippy/placeholder.html');
    }
}

async function defaultClip() {
    let container = document.querySelector('#clip-container');
    let placeholder = document.querySelector('#placeholder');
    
    placeholder.classList.add('show');
    container.classList.add('show');

    const duration = (FIVE_SECONDS);
    setTimeout(() => {
        // auto-hide image after 5 seconds
        container.classList.remove('show');
        placeholder.classList.remove('show');
    }, duration);
}

function createClipSrc(element, src, type = 'video/mp4') {
    let source = document.createElement('source');
    element.src = src;
    source.type = type;

    element.appendChild(source);
    element.muted = false; // unmute the video
}


