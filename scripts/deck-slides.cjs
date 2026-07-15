/** Single source of truth for match recap deck slides (story 9:16). */

const DECK_FORMAT = "story";

const SLIDES = [
  { id: "slide-cover", title: "Match Cover", subtitle: "Final score and court dominance preview" },
  {
    id: "slide-serve",
    title: "Serve Report",
    subtitle: "Host serve court with aces, speed, and zone win rates for both players",
  },
  {
    id: "slide-placement",
    title: "Serve Placement",
    subtitle: "First and second serve targets with zone win rates",
  },
  { id: "slide-zones", title: "Zone Win Rates", subtitle: "Where each player wins points" },
  {
    id: "slide-patterns",
    title: "Shot Patterns",
    subtitle: "Host hit-to-bounce tendencies and top flow win rate",
  },
  { id: "slide-rally", title: "Rally Profile", subtitle: "Win rate by rally length for both players" },
  { id: "slide-momentum", title: "Match Momentum", subtitle: "Point differential and break points" },
  { id: "slide-match-numbers", title: "Match Numbers", subtitle: "Overview, break points, clutch, and sets" },
  { id: "slide-shotmaking", title: "Shotmaking", subtitle: "Winners, errors, and return game" },
  { id: "slide-errors", title: "Error Heatmap", subtitle: "Where out and net errors landed" },
  { id: "slide-density", title: "Shot Density", subtitle: "KDE contours of bounce locations" },
  { id: "slide-coach", title: "Coach Takeaway", subtitle: "Practice priorities" },
  { id: "slide-cta", title: "Peak Performance Data", subtitle: "Full match intelligence on Tennis Bench" },
];

const SLIDE_IDS = SLIDES.map((slide) => slide.id);

module.exports = {
  DECK_FORMAT,
  SLIDE_IDS,
  SLIDES,
};
