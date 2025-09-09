// Helper function: factorial
export const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));

// Poisson probability mass function
export const poissonPMF = (lambda, k) =>
  (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);

// Calculate probabilities from odds
export const calculateProbabilities = (homeOdds, drawOdds, awayOdds) => {
  if (!homeOdds || !drawOdds || !awayOdds) return null;

  const home = parseFloat(homeOdds);
  const draw = parseFloat(drawOdds);
  const away = parseFloat(awayOdds);

  if (!home || !draw || !away) return null;

  // Step 1: implied probabilities
  const probHome = 1 / home;
  const probDraw = 1 / draw;
  const probAway = 1 / away;

  // Step 2: normalize for overround
  const overround = probHome + probDraw + probAway;
  const trueHome = probHome / overround;
  const trueDraw = probDraw / overround;
  const trueAway = probAway / overround;

  // Step 3: calculate lambda values for Poisson distribution
  const lambdaHome = 2.5 * (trueHome / (trueHome + trueAway));
  const lambdaAway = 2.5 * (trueAway / (trueHome + trueAway));

  // Step 4: calculate score probabilities
  const scoreProbabilities = {};
  for (let i = 0; i <= 5; i++) {
    for (let j = 0; j <= 5; j++) {
      const p = poissonPMF(lambdaHome, i) * poissonPMF(lambdaAway, j);
      scoreProbabilities[`${i}-${j}`] = p;
    }
  }

  return {
    probs: {
      home: (trueHome * 100).toFixed(1),
      draw: (trueDraw * 100).toFixed(1),
      away: (trueAway * 100).toFixed(1),
    },
    lambda: {
      home: lambdaHome.toFixed(2),
      away: lambdaAway.toFixed(2),
    },
    topScores: Object.entries(scoreProbabilities)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([score, prob]) => ({
        score,
        prob: (prob * 100).toFixed(1),
      })),
    overround: ((probHome + probDraw + probAway) * 100).toFixed(1),
  };
};
