/* @flow */

import _ from 'lodash';

// These types are still less than complete - for example the 'any' type of playByPLay and rawData in AnalyzedGame
// We're also missing some fields, aren't we?
export type RawGame = {
  raw_log: string,
  players: string,
  id: string,
};

export type AnalyzedGame = {
  analyzed: bool,
  id: string,
  playerList: Array<string>,
  winners: Array<string>,
  places: Array<Array<string>>,
  scores: { [key: string]: number }, 
  supplyPiles: Array<string>,
  interestingSupplyPiles: Array<string>,
  events: Array<string>,
  turnCount: number,
  playByPlay: any,
  rawData: any,
};


// The Javascript API sucks really badly.
// Call exec on the given regex, supplying the targetString, until no more matches are found.
// Return all the matches.
// Be sure to pass the 'g' flag to the supplied regex.
const regexExecAll = (regex, targetString) => {
  const results = [];
  let regexResult;
  while (regexResult = regex.exec(targetString)) { // eslint-disable-line no-cond-assign
    results.push(regexResult);
  }

  return results;
};

const GAME_OVER_MARKER = '------------ Game Over ------------';

// Returns the names of the player in an array
const getPlayers = game => game.players.split(',');

// Returns a sorted `places` array (index 0 is the winners). Each item is an array because players can tie for a place.
const getPlaces = game => {
  const log = game.raw_log;

  const placeSearchStrings = ['1st place:', '2nd place:', '3rd place:', '4th place:'];
  const placeSearchStringsForThisGame = _.take(placeSearchStrings, getPlayers(game).length);

  const places = placeSearchStringsForThisGame.map((placeSearchString, i) => {
    const placeRegex = new RegExp(`${placeSearchString} (\\w+)\\n`, 'g');
    const players = regexExecAll(placeRegex, log).map(match => match[1]);
    return players;
  });

  return places;
};

// Returns the names of the winner or winners in an array
const getWinners = game => getPlaces(game)[0];

// Returns an array of the names of the events in the game - empty if none
const getEvents = game => {
  const matchResult = game.raw_log.match(/Events: (.*?)\n/);
  return matchResult ? matchResult[1].split(', ') : [];
};

// Returns an array of the names of the supply piles in the game - includes coppers, estates, etc
const getSupplyPiles = game => {
  const supplyPilesMatches = game.raw_log.match(/Supply cards: (.*?)\n/);
  if (!supplyPilesMatches) throw new Error(`Couldn't parse supply cards for game #${game.id}`);
  return supplyPilesMatches[1].split(', ');
};

const excludeBoringPiles = piles => _.difference(piles, ['Copper', 'Silver', 'Gold', 'Estate', 'Duchy', 'Province', 'Curse']);

// Returns a hash of player's names to their final score
const getScores = game => {
  // This is lame perf thing, I just don't see why we should search through the entire log when
  // we know the points always comes after the "game over" marker
  const log = game.raw_log;
  const gameResultsIndex = log.indexOf(GAME_OVER_MARKER) + GAME_OVER_MARKER.length;
  const gameResults = log.substring(gameResultsIndex);

  const players = getPlayers(game);
  return _.fromPairs(players.map(player => {
    const scoreFinder = new RegExp(`${player} - total victory points: (.*?)\n`);
    const scoreMatch = log.match(scoreFinder);
    if (!scoreMatch) throw new Error(`Couldn't parse score for player "${player}" in game #${game.id}`);
    const score = parseInt(scoreMatch[1], 10);
    return [player, score];
  }));
};

// Find the number of turns in the game
// (by finding the turn with the highest number)
const getTurnCount = game => {
  const turnRegex = /: turn (\d+) ---/g;
  const turnNumbers = regexExecAll(turnRegex, game.raw_log).map(match => parseInt(match[1], 10));
  return _.max(turnNumbers);
};

const getPlayByPlay = game => {
  const log = game.raw_log;
  // This capture group around the whole thing is important for the call to split to work
  // properly when we split the log into turns. If it's not there, the stuff that we're splitting on
  // (the turn headers) won't be included in the split results. Don't remove it.
  const turnHeaderRegex = /(---------- .*?: turn .*? ----------)/;
  const gameStartIndex = log.search(turnHeaderRegex);
  const gameEndIndex = log.indexOf(GAME_OVER_MARKER);

  const gameplayLog = log.substring(gameStartIndex, gameEndIndex);

  // Slice off the first result- our delimiter matches on index 0, so split() decides the first
  // chunk should be everything before the delimiter - an empty string.
  const splitTurns = gameplayLog.split(turnHeaderRegex).slice(1);
  // This is an array of turn logs, i.e. each item is the log that includes the "turn header"
  // (which tells you which player and turn # it is) and everything that happened on that turn
  const rawTurns = _.map(_.chunk(splitTurns, 2), turnChunks => turnChunks.join(''));

  const interestingPiles = excludeBoringPiles(getSupplyPiles(game));
  const playedInterestingCardRegex = new RegExp(`(.*?) - plays (${interestingPiles.join('|')})$`);

  const parseTurn = turnLog => {
    const lines = turnLog.split('\n');
    const turnHeader = lines[0];

    const turnHeaderMatch = turnHeader.match(/---------- (.*?): turn (.*?) ----------/);
    if (!turnHeaderMatch) throw new Error('Error parsing turn');
    const [playerName, turnName] = turnHeaderMatch.slice(1);

    // For now, let's only track one kind of "happening": a player *plays* a card that's in the
    // list of interesting supply piles. Coincidentally, this should mostly exclude treasures,
    // because we're only going to look for lines of the form "$player - plays $cardName", whereas
    // often when the player plays treasures it looks like "$player - plays 2 Fool's Gold, 2 Copper, 1 Gold"
    const happenings = lines.slice(1).reduce((acc, line) => {
      const matchResult = line.match(playedInterestingCardRegex);
      // TODO 'plays_action' is a magic string
      return matchResult ? [...acc, { happeningType: 'plays_action', player: matchResult[1], action: matchResult[2] }]
        : acc;
    }, []);

    return { player: playerName, turn: turnName, happenings };
  };

  return rawTurns.map(parseTurn);
};

export const analyzeGame = (game: RawGame) => {
  if (game.analyzed) return game;
  return {
    analyzed: true,
    id: game.id,
    playerList: getPlayers(game),
    winners: getWinners(game),
    places: getPlaces(game),
    scores: getScores(game),
    supplyPiles: getSupplyPiles(game),
    interestingSupplyPiles: excludeBoringPiles(getSupplyPiles(game)),
    events: getEvents(game),
    turnCount: getTurnCount(game),
    playByPlay: getPlayByPlay(game),
    rawData: {...game},
  };
};
