# Clippy-Shoutouts

A stream overlay that selects a 15 second (or less) weighted-random top clip from a given channel.

# Instructions

This can be used as a browser source within a twitch bot, simply create a browser source and set the URL field to the following: `https://secondubly.tv/clippy/<your_twitch_username>`

Below I've included steps to use this as a command in some popular Twitch bots, if you'd like to see your bot included here, simply make a request!

## Moobot
1. In your Moobot dashboard (https://moo.bot) create a new custom command, naming it whatever oyu want (for this example, we will use `!clippy`) and click “Create”
2. In the `Response` field, select `URL Fetch - Full (plain) response`.
3. In the `URL to fetch (*)` field, type the following: `https://secondubly.tv/clippy/<Username of the channel>?streamer=Command argument 1`, it should look something like this:

`<url to photo>`

4. That's it! You can save and use the command as follows: `!clippy secondubly`

## Nightbot
1. In your Nightbot Dashboard (https://nightbot.tv/dashboard) create a new custom command, naming it whatever you want. (for this example, we will use `!clippy`)
2. In the message field, type the following: `$(urlfetch https://secondubly.tv/clippy/$(channel)?streamer=$(1))`
3. That's it! You can use the command as follows: `!clippy secondubly`

## Phantombot
1. In your Phantombot dashboard go to the commands -> custom commands section.
2. Create a custom command (for this example we will be using `!clippy`)
3. In the response field, type the following: `(customapi $(urlfetch https://secondubly.tv/clippy/$(channel)?streamer=$(1)))`
4. That's it! You can use the command as follows: `!clippy secondubly`