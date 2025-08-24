import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameService, Challenge, LeaderboardEntry, GameStats } from '../../services/game-service.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-gamified-debugger',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gamified-debugger.component.html',
  styleUrl: './gamified-debugger.component.scss'
})
export class GamifiedDebuggerComponent implements OnInit, OnDestroy {
  
  // Game state
  currentLevel = 1;
  score = 0;
  lives = 3;
  timeRemaining = 300; // 5 minutes
  isGameOver = false;
  isAnswerSubmitted = false;
  isAnswerCorrect = false;
  
  // Game utilities
  Math = Math;
  String = String;
  
  // Challenge data from service
  currentChallenge: Challenge | null = null;
  challenges: Challenge[] = [];
  leaderboard: LeaderboardEntry[] = [];
  gameStats: GameStats | null = null;
  
  // Game statistics
  challengesCompleted = 0;
  correctAnswers = 0;
  totalTimeSpent = 0;
  challengeStartTime = Date.now();
  
  // Loading states
  isLoading = false;
  isLoadingChallenges = false;
  isLoadingLeaderboard = false;
  isLoadingStats = false;
  
  // Error states
  errorMessage: string | null = null;
  
  private subscriptions: Subscription[] = [];

  private timer: any;

  constructor(private gameService: GameService) {}

  ngOnInit() {
    this.loadGameData();
    this.startGame();
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadGameData(): void {
    this.loadChallenges();
    this.loadLeaderboard();
    this.loadGameStats();
  }

  loadChallenges(): void {
    this.isLoadingChallenges = true;
    
    const sub = this.gameService.getChallenges().subscribe({
      next: (challenges) => {
        this.challenges = challenges;
        this.loadChallengeByLevel();
        this.isLoadingChallenges = false;
      },
      error: (error) => {
        console.error('Error loading challenges:', error);
        this.errorMessage = 'Failed to load challenges';
        this.isLoadingChallenges = false;
      }
    });
    
    this.subscriptions.push(sub);
  }

  loadLeaderboard(): void {
    this.isLoadingLeaderboard = true;
    
    const sub = this.gameService.getLeaderboard().subscribe({
      next: (leaderboard) => {
        this.leaderboard = leaderboard;
        this.isLoadingLeaderboard = false;
      },
      error: (error) => {
        console.error('Error loading leaderboard:', error);
        this.isLoadingLeaderboard = false;
      }
    });
    
    this.subscriptions.push(sub);
  }

  loadGameStats(): void {
    this.isLoadingStats = true;
    
    const sub = this.gameService.getUserStats().subscribe({
      next: (stats) => {
        this.gameStats = stats;
        this.challengesCompleted = stats.challengesCompleted;
        this.correctAnswers = stats.correctAnswers;
        this.totalTimeSpent = stats.totalTimeSpent;
        this.isLoadingStats = false;
      },
      error: (error) => {
        console.error('Error loading game stats:', error);
        this.isLoadingStats = false;
      }
    });
    
    this.subscriptions.push(sub);
  }

  startGame() {
    this.timer = setInterval(() => {
      this.timeRemaining--;
      if (this.timeRemaining <= 0) {
        this.gameOver();
      }
    }, 1000);
  }

  submitAnswer(selectedAnswer: number) {
    if (this.isAnswerSubmitted || !this.currentChallenge) return;
    
    this.isAnswerSubmitted = true;
    this.isAnswerCorrect = selectedAnswer === this.currentChallenge.correctAnswer;
    
    const timeSpent = (Date.now() - this.challengeStartTime) / 1000;
    
    if (this.isAnswerCorrect) {
      this.score += this.getPointsForDifficulty(this.currentChallenge.difficulty);
      this.correctAnswers++;
      this.challengesCompleted++;
      this.showSuccessMessage();
    } else {
      this.lives--;
      this.showErrorMessage();
      if (this.lives <= 0) {
        this.gameOver();
      }
    }
    
    // Update total time spent
    this.totalTimeSpent += timeSpent;
    
    // Submit result to backend
    this.gameService.submitChallengeResult(
      this.currentChallenge.id,
      this.isAnswerCorrect,
      timeSpent
    ).subscribe({
      next: (result) => {
        console.log('Challenge result submitted:', result);
      },
      error: (error) => {
        console.error('Failed to submit challenge result:', error);
      }
    });
  }

  getPointsForDifficulty(difficulty: string): number {
    switch (difficulty) {
      case 'easy': return 100;
      case 'medium': return 150;
      case 'hard': return 200;
      default: return 100;
    }
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getAnswerButtonClass(answerIndex: number): string {
    if (!this.isAnswerSubmitted) {
      return 'border-gray-300 hover:border-blue-300 hover:bg-blue-50';
    }
    
    if (answerIndex === this.currentChallenge?.correctAnswer) {
      return 'border-green-500 bg-green-50';
    }
    
    if (this.isAnswerSubmitted && answerIndex !== this.currentChallenge?.correctAnswer) {
      return 'border-red-500 bg-red-50';
    }
    
    return 'border-gray-300';
  }

  getAnswerIndicatorClass(answerIndex: number): string {
    if (!this.isAnswerSubmitted) {
      return 'border-gray-400 text-gray-600';
    }
    
    if (answerIndex === this.currentChallenge?.correctAnswer) {
      return 'border-green-500 bg-green-500 text-white';
    }
    
    if (this.isAnswerSubmitted && answerIndex !== this.currentChallenge?.correctAnswer) {
      return 'border-red-500 bg-red-500 text-white';
    }
    
    return 'border-gray-400 text-gray-600';
  }

  loadNextChallenge() {
    this.isAnswerSubmitted = false;
    this.isAnswerCorrect = false;
    this.challengeStartTime = Date.now();
    
    if (this.isAnswerCorrect) {
      this.currentLevel++;
      this.loadChallengeByLevel();
    }
    
    // Reset timer for new challenge
    this.timeRemaining = Math.max(120, 300 - (this.currentLevel * 10)); // Decrease time as level increases
  }

  loadChallengeByLevel() {
    // Find a challenge that matches the current level or difficulty
    const availableChallenges = this.challenges.filter(c => {
      if (this.currentLevel <= 2) return c.difficulty === 'easy';
      if (this.currentLevel <= 4) return c.difficulty === 'medium';
      return c.difficulty === 'hard';
    });
    
    if (availableChallenges.length > 0) {
      // Select a random challenge from the available ones
      const randomIndex = Math.floor(Math.random() * availableChallenges.length);
      this.currentChallenge = availableChallenges[randomIndex];
    } else {
      // Fallback to first challenge if none available
      this.currentChallenge = this.challenges[0] || null;
    }
    
    this.challengeStartTime = Date.now();
  }

  showSuccessMessage() {
    // Show success animation/message
    if (this.currentChallenge) {
      console.log('Correct answer! +' + this.getPointsForDifficulty(this.currentChallenge.difficulty) + ' points');
    }
  }

  showErrorMessage() {
    // Show error animation/message
    console.log('Incorrect answer. Lives remaining: ' + this.lives);
  }

  gameOver() {
    clearInterval(this.timer);
    this.isGameOver = true;
    this.updateLeaderboard();
  }

  restartGame() {
    this.currentLevel = 1;
    this.score = 0;
    this.lives = 3;
    this.timeRemaining = 300;
    this.isGameOver = false;
    this.isAnswerSubmitted = false;
    this.isAnswerCorrect = false;
    this.challengesCompleted = 0;
    this.correctAnswers = 0;
    this.totalTimeSpent = 0;
    this.challengeStartTime = Date.now();
    
    this.loadChallengeByLevel();
    this.startGame();
  }

  updateLeaderboard() {
    // Add current player to leaderboard
    const currentPlayer = {
      name: 'Player',
      score: this.score,
      level: this.currentLevel,
      challengesCompleted: this.challengesCompleted,
      averageTime: this.calculateAverageTime()
    };
    
    this.leaderboard.push(currentPlayer);
    this.leaderboard.sort((a, b) => b.score - a.score);
    this.leaderboard = this.leaderboard.slice(0, 10); // Keep top 10
  }

  calculateSuccessRate(): number {
    if (this.challengesCompleted === 0) return 0;
    return Math.round((this.correctAnswers / this.challengesCompleted) * 100);
  }

  calculateAverageTime(): number {
    if (this.challengesCompleted === 0) return 0;
    return Math.round(this.totalTimeSpent / this.challengesCompleted);
  }

  calculateRank(): number {
    const playerScore = this.score;
    const rank = this.leaderboard.findIndex(player => player.score <= playerScore) + 1;
    return rank || this.leaderboard.length + 1;
  }
}
