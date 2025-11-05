import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameService, Challenge, LeaderboardEntry, UserProgress } from '../../services/game-service.service';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-gamified-debugger',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gamified-debugger.component.html',
  styleUrl: './gamified-debugger.component.scss'
})
export class GamifiedDebuggerComponent implements OnInit{
  
   // Game state
  challenges: Challenge[] = [];
  currentChallenge: Challenge | null = null;
  leaderboard: LeaderboardEntry[] = [];
  progress: UserProgress | null = null;

  score = 0;
  currentLevel = 1;
  lives = 3;
  timeRemaining = 120; // seconds per challenge
  timer: any;
  averageTime = 0;

  // Answer state
  isAnswerSubmitted = false;
  isAnswerCorrect = false;
  selectedAnswerIndex: number | null = null;

  // Game status
  isGameOver = false;
  totalChallengesCompleted = 0;

  // Loading states
  isLoading = false;
  isLoadingChallenges = false;
  isLoadingLeaderboard = false;
  isLoadingStats = false;
  
  // Error states
  errorMessage: string | null = null;

  Math = Math;
  String = String;
  
  private subscriptions: Subscription[] = [];



  constructor(
    private gameService: GameService, 
    private authService: AuthService, 
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    /*
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }*/
   this.gameService.leaderboard$.subscribe(data => {
      this.leaderboard = data;
      this.cdr.markForCheck();
    });

    this.gameService.refreshLeaderboard();
    this.loadGameData();
  }


  loadGameData(): void {
    this.isLoading = true;
    this.gameService.getUserProgress().subscribe({
      next: (progress) => {
        this.progress = progress;
        this.score = progress.score;
        this.currentLevel = progress.level;
        this.lives = progress.livesRemaining;

        this.loadChallenges();
        this.averageTime = this.calculateAverageTime();
      },
      error: (error) => {
        console.warn('Failed to load user progress:', error);
        this.loadChallenges();
      }
    });
  }

  loadChallenges(): void {
    this.isLoadingChallenges = true;
    this.gameService.getChallenges().subscribe({
      next: (data) => {
        this.challenges = data.map(ch => this.shuffleOptions(ch));
        this.currentChallenge = data[0] || null;
        console.log('✅ Challenges loaded:', this.challenges);
        this.startTimer();
        this.isLoadingChallenges = false;
      },
      error: (error) => {
        console.error('Error loading challenges:', error);
        this.isLoadingChallenges = false;
      }
    });
  }

  private shuffleOptions(challenge: Challenge): Challenge {
    const options = [...challenge.options];
    const correctOption = options[challenge.correctAnswer];
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    challenge.options = options;
    challenge.correctAnswer = options.indexOf(correctOption);
    return challenge;
  }
    

  loadLeaderboard(): void {
    this.isLoadingLeaderboard = true;
    this.gameService.getLeaderboard().subscribe({
      next: (data) => {this.leaderboard = data; this.isLoadingLeaderboard = false;},
      error: (error) => console.error('Error loading leaderboard:', error)
    });
    console.log('Leaderboard loaded:', this.leaderboard);
  }

  startTimer(): void {
    if (this.lives <= 0) return;
    if (this.timer) clearInterval(this.timer);
    this.timeRemaining = 120;
    this.timer = setInterval(() => {
      this.timeRemaining--;
      if (this.timeRemaining <= 0) {
        clearInterval(this.timer);
        this.handleTimeOut();
      }
      this.cdr.markForCheck(); // 👈 safely trigger change detection
    }, 1000);
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
    if (!this.currentChallenge || this.lives <= 0) {
      console.warn('🚫 Cannot submit — no lives remaining.');
      this.isGameOver = true;
      return;
    }
    this.isAnswerSubmitted = true;
    this.selectedAnswerIndex = selectedAnswer;
    this.isAnswerCorrect = (selectedAnswer === this.currentChallenge.correctAnswer);

    if (this.isAnswerCorrect) {
      this.score += this.currentChallenge.points;
      this.currentLevel++;
      this.totalChallengesCompleted++;
    }else{
      this.lives--;
      if(this.lives <= 0){
        this.gameOver();
        return;
      }
    }
    this.updateUserProgress(() => this.gameService.refreshLeaderboard());

  }

  updateUserProgress(afterUpdate?: () => void) {
    if(!this.progress) return;
    const updatedProgress: UserProgress = {
      ...this.progress,
      score: this.score,
      level: this.currentLevel,
      livesRemaining: this.lives
    };

    this.gameService.updateProgress(updatedProgress).subscribe({
      next: () => {console.log('User progress updated successfully'); if(afterUpdate) afterUpdate();},
      error: (err) => console.error('Error updating user progress:', err)
    });
  }

  loadNextChallenge(): void {
    this.isAnswerSubmitted = false;
    this.selectedAnswerIndex = null;

    const currentIndex = this.challenges.findIndex(c=> c.id === this.currentChallenge?.id);
    const nextIndex = (currentIndex + 1) % this.challenges.length;
    this.currentChallenge = this.shuffleOptions(this.challenges[nextIndex]);
    //this.startTimer();
    if (this.lives <= 0) {
      this.gameOver();
      return;
    }
  }
    
  handleTimeOut(): void {
    this.isAnswerSubmitted = true;
    this.isAnswerCorrect = false;
    this.lives--;

    if(this.lives <= 0){
      this.gameOver();
    }
  }


  showErrorMessage() {
    // Show error animation/message
    console.log('Incorrect answer. Lives remaining: ' + this.lives);
  }

  gameOver() {
    clearInterval(this.timer);
    this.isGameOver = true;
    console.warn('Game Over! Final Score: ' + this.score);

  }

  restartGame() {
    this.score = 0;
    this.currentLevel = 1;
    this.lives = 3;
    this.isGameOver = false;
    this.totalChallengesCompleted = 0;
    this.loadChallenges();
  }

  replenishLives() {
    this.lives = 3;
    this.isGameOver = false;
    this.updateUserProgress(() => {
      console.log('✅ Lives replenished and progress updated.');
      this.startTimer();
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

  getAnswerButtonClass(i: number): string {
    if (!this.isAnswerSubmitted) return '';
    if (i === this.selectedAnswerIndex && this.isAnswerCorrect) return 'border-green-500 bg-green-50';
    if (i === this.selectedAnswerIndex && !this.isAnswerCorrect) return 'border-red-500 bg-red-50';
    return '';
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  calculateSuccessRate(): number {
    if (this.totalChallengesCompleted === 0) return 0;
    return Math.round((this.score / (this.totalChallengesCompleted * 200)) * 100);
  }

  calculateRank(): number {
    const sorted = [...this.leaderboard].sort((a, b) => b.score - a.score);
    const index = sorted.findIndex(p => p.name === 'You');
    return index !== -1 ? index + 1 : sorted.length;
  }

  calculateAverageTime(): number {
    return 60 + Math.floor(Math.random() * 20);
  }
}
  