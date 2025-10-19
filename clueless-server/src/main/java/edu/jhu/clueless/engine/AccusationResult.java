package edu.jhu.clueless.engine;

public class AccusationResult {
    private final boolean correct;
    private final boolean gameOver;
    private final String winner;
    private final boolean eliminated;

    public AccusationResult(boolean correct, boolean gameOver, String winner, boolean eliminated) {
        this.correct = correct;
        this.gameOver = gameOver;
        this.winner = winner;
        this.eliminated = eliminated;
    }

    public boolean isCorrect() { return correct; }
    public boolean isGameOver() { return gameOver; }
    public String getWinner() { return winner; }
    public boolean isEliminated() { return eliminated; }
}