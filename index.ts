
import { startServer } from "./utils/server.ts";
import { startStreamDeck } from "./utils/stream-deck.ts";


const NUM_KEYS = 6;

startServer();
startStreamDeck(NUM_KEYS);
