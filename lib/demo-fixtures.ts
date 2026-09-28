export type DemoFixture = {
  id: string;
  film: string;
  expected: 'spoiler' | 'safe';
  text: string;
};

export const demoFixtures: DemoFixture[] = [
  { id: 'sixth-safe-1', film: 'The Sixth Sense', expected: 'safe', text: 'The Sixth Sense has a wonderfully quiet atmosphere, and Bruce Willis gives a restrained performance as Malcolm Crowe.' },
  { id: 'sixth-spoiler-1', film: 'The Sixth Sense', expected: 'spoiler', text: 'Malcolm Crowe is revealed to have been dead the whole time; that is the final twist of The Sixth Sense.' },
  { id: 'sixth-safe-2', film: 'The Sixth Sense', expected: 'safe', text: 'Cole Sear tells a child psychologist that he sees ghosts. That is the premise shown in the trailer.' },
  { id: 'sixth-spoiler-2', film: 'The Sixth Sense', expected: 'spoiler', text: 'At the end, Crowe realizes he has been a ghost all along and finally understands why his wife cannot speak to him.' },
  { id: 'endgame-safe-1', film: 'Avengers: Endgame', expected: 'safe', text: 'Avengers: Endgame brings back Tony Stark and Steve Rogers for an ambitious superhero ensemble with huge spectacle.' },
  { id: 'endgame-spoiler-1', film: 'Avengers: Endgame', expected: 'spoiler', text: 'Tony Stark dies after using the Infinity Stones to defeat Thanos at the end of Avengers: Endgame.' },
  { id: 'endgame-safe-2', film: 'Avengers: Endgame', expected: 'safe', text: 'The Avengers try to undo the damage caused by Thanos. The film is long, emotional, and packed with action.' },
  { id: 'endgame-spoiler-2', film: 'Avengers: Endgame', expected: 'spoiler', text: 'Steve Rogers stays in the past with Peggy Carter and returns to his friends as an old man.' },
  { id: 'control-safe-1', film: 'Control film', expected: 'safe', text: 'The Matrix is famous for its green-tinted look and inventive action scenes. It is not on this demo watchlist.' },
];

export const lateDemoComment: DemoFixture = {
  id: 'late-sixth-spoiler',
  film: 'The Sixth Sense',
  expected: 'spoiler',
  text: 'New comment just posted: Malcolm Crowe was dead from the beginning, which explains the ending of The Sixth Sense.',
};
