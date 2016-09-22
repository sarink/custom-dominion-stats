## EZ-Mode Hacking

1. Navigate to `http://sarink.net:4000`

2. Play around with the `window.__games__` variable


## Setup

1. Clone this repo, navigate to the root.

2. Run `nvm use`

3. Run `npm install --only=dev` to install the dev dependencies. The other dependencies are for the server (please ensure your editor is configured to use [editorconfig](http://editorconfig.org) and [eslint](http://eslint.org)).

4. Navigate to `/client`.

5. Run `npm run start-dev` - this will start the [simplehttpserver](https://www.npmjs.com/package/simplehttpserver) at its default port (currently 8000).

6. Load up `http://localhost:8000/client/?devMode=prod|local` in a browser. Now go forth and write some codes in `index.js`!

*NOTE: There are two `devMode` values you can pass as URL parameters*

`http://localhost:8000/client/?devMode=prod` - this will load game logs from production

`http://localhost:8000/client/?devMode=local` - this will load game logs from the local sample json file

## Retrieving logs from the server

#### Structure and architecture
To see the structure, and all available game logs, just visit `/logs`.

#### URL Parameters
When you hit the `/logs` endpoint on `http://sarink.net:4000`, you may pass `numPlayers` and `playerNames` as query string parameters.

`numPlayers` - this will only match game logs containing this number of players. example: `/logs?numPlayers=3`

`playerNames` - comma separated list of player names, a wildcard match on each name. example: `/logs?playerNames=sarink,cherrypeel,nisse038`

Meaning, if you pass `/logs?playerNames=Bot` you'll get a list of game logs where any player in the game had a name containing 'Bot'
Behind the scenes, this translates to the SQL `WHERE (players LIKE %playerName1%) AND (players LIKE %playerName2%) ...` where `players` is the database string
of players in the game `cherrypeel,nisse038,sarink`.

These are the only two filters you are available to pass to the server. Everything else is parsed client side.


## How the server works

#### Structure and architecture
The database is in sqlite. You can view the structure of it in `server/db.js`

#### Log fetching
Logs are fetched and inserted into the database every 24 hours at midnight UTC, but they always fetch the logs from the playdominion server for the day before yesterday.

So, the data is always about 48 hours behind. This is because the playdominion server lists some logs from today on yesterday's page (why? not sure), and because I have
no idea when they post them, so, if we stay 48 hours behind, we can make just one request per day while never missing one (there are about 60k game logs a day, so a request
for all of them takes awhile).

#### Choosing relevant game logs
Although all logs are fetched, we don't persist them all. There is a `doWeCareAboutThisGameLog` function inside of `server/fetchGameLogs.js`

#### Manual fetching and seeding
If you call `node server/fetchGameLogs.js` with no parameters, it will download and store all relevant game logs we care about from the playdominion server _for the day
before yesterday_. You may also pass it command line arguments to fetch specific dates in yyyymmdd format, example: `node server/fetchGameLogs.js '20160901' '20160902' '20160911'` -
this will fetch and store relevant logs for those three dates in the db.

#### Conflicts
The `log_url` column is specified as `UNIQUE`. If there are ever any conflicts, the conflicting row will be overwritten with the latest data that is attempting to be inserted.
