import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gamified-debugger',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gamified-debugger.component.html',
  styleUrl: './gamified-debugger.component.scss'
})
export class GamifiedDebuggerComponent implements OnInit {
  
  currentLevel = 1;
  score = 0;
  lives = 3;
  timeRemaining = 300; // 5 minutes
  
  currentChallenge = {
    id: 1,
    title: 'Find the SQL Injection',
    description: 'Identify the SQL injection vulnerability in the code snippet below',
    code: `function getUserData(userId) {
  const query = "SELECT * FROM users WHERE id = " + userId;
  return db.execute(query);
}`,
    options: [
      'Line 2: String concatenation in SQL query',
      'Line 3: Database execution',
      'Line 1: Function declaration',
      'No vulnerability found'
    ],
    correctAnswer: 0,
    explanation: 'String concatenation in SQL queries creates injection vulnerabilities. Use parameterized queries instead.',
    difficulty: 'easy'
  };

  challenges = [
    {
      id: 1,
      title: 'Find the SQL Injection',
      difficulty: 'easy',
      points: 100
    },
    {
      id: 2,
      title: 'Identify XSS Vulnerability',
      difficulty: 'medium',
      points: 150
    },
    {
      id: 3,
      title: 'Spot Authentication Bypass',
      difficulty: 'hard',
      points: 200
    }
  ];

  leaderboard = [
    { name: 'SecurityMaster', score: 2500, level: 5 },
    { name: 'CodeGuardian', score: 2100, level: 4 },
    { name: 'VulnHunter', score: 1800, level: 4 },
    { name: 'SecureDev', score: 1500, level: 3 }
  ];

  ngOnInit() {
    this.startGame();
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
    if (selectedAnswer === this.currentChallenge.correctAnswer) {
      this.score += this.getPointsForDifficulty(this.currentChallenge.difficulty);
      this.currentLevel++;
      this.showSuccessMessage();
      this.loadNextChallenge();
    } else {
      this.lives--;
      this.showErrorMessage();
      if (this.lives <= 0) {
        this.gameOver();
      }
    }
  }

  getPointsForDifficulty(difficulty: string): number {
    switch (difficulty) {
      case 'easy': return 100;
      case 'medium': return 150;
      case 'hard': return 200;
      default: return 100;
    }
  }

  loadNextChallenge() {
    // Load next challenge logic
    this.currentChallenge = {
      id: this.currentLevel + 1,
      title: 'Identify XSS Vulnerability',
      description: 'Find the cross-site scripting vulnerability in this code',
      code: `function displayUserInput(input) {
  document.getElementById('output').innerHTML = input;
}`,
      options: [
        'Line 1: Function declaration',
        'Line 2: innerHTML assignment with user input',
        'Line 2: getElementById usage',
        'No vulnerability found'
      ],
      correctAnswer: 1,
      explanation: 'Using innerHTML with user input creates XSS vulnerabilities. Use textContent or proper sanitization.',
      difficulty: 'medium'
    };
  }

  showSuccessMessage() {
    // Show success animation/message
  }

  showErrorMessage() {
    // Show error animation/message
  }

  gameOver() {
    clearInterval(this.timer);
    // Handle game over
  }

  private timer: any;
}
