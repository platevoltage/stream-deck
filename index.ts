
import * as server from "./utils/server.ts";
import * as streamDeck from "./utils/stream-deck.ts";


const NUM_KEYS = 6;

server.start();
streamDeck.start(NUM_KEYS);
