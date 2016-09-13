## Setup

1. Clone this repo, navigate to the root of it.

2. Run `nvm use .`

3. Run `npm install`

4. Go to the bottom of the file `server.js` and look for the loop where the `dateStrings` variable is created. Modify it to suit your needs.

   Or, alternatively, execute the script from the command line and supply your own `dateStrings`, like so: `node server.js '20160901' '20160902' ...`

6. Run `node server.js` and wait for the magic to happen. There will be a `game_logs` folder created in the current directory where files get saved.
