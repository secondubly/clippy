let topClips = [];
let distribution = {}; // for testing purposes
const delay = ms => new Promise(res => setTimeout(res, ms));

// TODO: add support for duration parameter
async function getClips(username, limit = 100, period = 'all', duration_limit = 15, weighted = true, trending = false) {
    // Note: await/async unsupported in some older browsers (IE/Opera?)
    let url = `https://localhost:5353/clippy/getclips?channel=${username}&limit=${limit}&period=${period}&trending=${trending}`
    let dev_url = `http://localhost:5353/clippy/getclips?channel=${username}&limit=${limit}&period=${period}&trending=${trending}`

    try {
        const response = await fetch(dev_url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        
        if(!response.ok) {
            return new Error(response.text())
        } else {
            const data = await response.json();
            console.log(data.clips);
            topClips = data.clips.filter(clip => clip.duration < duration_limit);
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

async function setClip(visible, clip) {
    if (visible) {
        let frame = document.querySelector("#stream-clip")
        let container = document.querySelector('#clip-container');

        // Example Clip URL:
        // https://clips.twitch.tv/embed?clip=ShakingPoliteQuailGingerPower&tt_medium=clips_api&tt_content=embed
        const clip_url = `${clip.embed_url}&tt_medium-clips_api&tt_content=embed&parent=${window.location.hostname}&autoplay=true`

        // display container and iframe
        frame.setAttribute('src', clip_url);
        frame.setAttribute('allowfullscreen', true);
        // wait a second!
        await delay(1500);
        container.classList.add('show')

        const duration = (clip.duration * 1000); // add an extra second to show the entire clip
        setTimeout(() => {
            // auto-hide clip after it finishes
            setClip(false, null);
        }, duration);
    } else {
        // Don't show clip box
        let container = document.querySelector('#clip-container');
        let frame = document.querySelector("#stream-clip");

        // hide container
        container.classList.remove('show')

        // remove iframe content after 3 seconds
        await delay(500);
        frame.setAttribute('src', '');
    }
}


