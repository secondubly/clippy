let topClips = [];
let distribution = {}; // for testing purposes

async function getClips(username, limit = 100, period = 'all', weighted = true, trending = false) {
    // TODO: sanitize input
    // Note: await/async unsupported in some older browsers (IE/Opera?)
    let url = `https://api.twitch.tv/kraken/clips/top?channel=${username}&limit=${limit}&period=${period}&trending=${trending}`
    console.log(url);
    const data = await fetch(`https://api.twitch.tv/kraken/clips/top?channel=${username}&limit=${limit}&period=${period}&trending=${trending}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Client-ID': 'h032bgl79pc6sz5ftt7qax12eom1eg',
            'Accept': 'application/vnd.twitchtv.v5+json'
        }
    }).then(res => res.json());
    console.log(data.clips);
    if (data.clips.length < 1) { return; } // if we don't have any clips, return early

    // if the clip is longer than the duration limit, we don't want it
    topClips = data.clips
    // topClips = data.clips.filter(clip => clip.duration < duration_limit);
}

function getRandomClip(clips, percentage = 0.50) {
    // first generate the weight for each clip
    // weights = [0, .7, .2, .0523...]
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

function setClip(visible, clip) {
    if (visible) {
        console.log(clip);
        let frame = document.querySelector("#stream-clip")
        let container = document.querySelector('#clip-container');

        // Example Clip URL:
        // https://clips.twitch.tv/embed?clip=ShakingPoliteQuailGingerPower&tt_medium=clips_api&tt_content=embed
        const clip_url = `http://clips.twitch.tv/embed?clip=${clip.slug}&tt_medium-clips_api&tt_content=embed&parent=${window.location.hostname}&autoplay=true`

        // display container and iframe
        frame.setAttribute('src', clip_url);
        frame.style.display = 'block';

        container.style.display = 'block';
        setTimeout(() => {
            // auto-hide clip after it finishes
            setClip(false, null);
        }, clip.duration * 1000);
    } else {
        // Don't show clip box
        let container = document.querySelector('#clip-container');
        let frame = document.querySelector("#stream-clip");

        // hide container
        container.style.display = 'none';

        // hide iframe
        frame.setAttribute('src', '');
        frame.style.display = 'none';
    }
}

