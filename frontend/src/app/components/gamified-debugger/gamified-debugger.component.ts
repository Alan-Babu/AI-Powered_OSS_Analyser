import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  
  // Challenge data
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
    },
    {
      id: 4,
      title: 'Find Path Traversal',
      difficulty: 'medium',
      points: 150
    },
    {
      id: 5,
      title: 'Identify CSRF Vulnerability',
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

  // Game statistics
  challengesCompleted = 0;
  correctAnswers = 0;
  totalTimeSpent = 0;
  challengeStartTime = Date.now();

  private timer: any;

  ngOnInit() {
    this.startGame();
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
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
    if (this.isAnswerSubmitted) return;
    
    this.isAnswerSubmitted = true;
    this.isAnswerCorrect = selectedAnswer === this.currentChallenge.correctAnswer;
    
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
    this.totalTimeSpent += (Date.now() - this.challengeStartTime) / 1000;
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
    
    if (answerIndex === this.currentChallenge.correctAnswer) {
      return 'border-green-500 bg-green-50';
    }
    
    if (this.isAnswerSubmitted && answerIndex !== this.currentChallenge.correctAnswer) {
      return 'border-red-500 bg-red-50';
    }
    
    return 'border-gray-300';
  }

  getAnswerIndicatorClass(answerIndex: number): string {
    if (!this.isAnswerSubmitted) {
      return 'border-gray-400 text-gray-600';
    }
    
    if (answerIndex === this.currentChallenge.correctAnswer) {
      return 'border-green-500 bg-green-500 text-white';
    }
    
    if (this.isAnswerSubmitted && answerIndex !== this.currentChallenge.correctAnswer) {
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
    const challengeIndex = (this.currentLevel - 1) % this.challenges.length;
    const challenge = this.challenges[challengeIndex];
    
    switch (challenge.id) {
      case 1:
        this.currentChallenge = {
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
        break;
        
      case 2:
        this.currentChallenge = {
          id: 2,
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
        break;
        
      case 3:
        this.currentChallenge = {
          id: 3,
          title: 'Spot Authentication Bypass',
          description: 'Identify the authentication bypass vulnerability',
          code: `function checkAccess(userId, role) {
  if (role === 'admin') {
    return true;
  }
  return false;
}`,
          options: [
            'Line 1: Function declaration',
            'Line 2: Role check',
            'Line 3: Return statement',
            'No authentication check for userId'
          ],
          correctAnswer: 3,
          explanation: 'The function only checks the role parameter but never validates the userId, allowing potential bypass.',
          difficulty: 'hard'
        };
        break;
        
      case 4:
        this.currentChallenge = {
          id: 4,
          title: 'Find Path Traversal',
          description: 'Identify the path traversal vulnerability',
          code: `function readFile(filename) {
  const path = '/uploads/' + filename;
  return fs.readFileSync(path);
}`,
          options: [
            'Line 1: Function declaration',
            'Line 2: Path construction',
            'Line 3: File reading',
            'No validation of filename parameter'
          ],
          correctAnswer: 3,
          explanation: 'The filename parameter is not validated, allowing attackers to traverse directories with "../" sequences.',
          difficulty: 'medium'
        };
        break;
        
      case 5:
        this.currentChallenge = {
          id: 5,
          title: 'Identify CSRF Vulnerability',
          description: 'Find the Cross-Site Request Forgery vulnerability',
          code: `function updateProfile(userId, data) {
  // No CSRF token validation
  return db.updateUser(userId, data);
}`,
          options: [
            'Line 1: Function declaration',
            'Line 2: Comment',
            'Line 3: Database update',
            'Missing CSRF protection'
          ],
          correctAnswer: 3,
          explanation: 'The function lacks CSRF token validation, making it vulnerable to cross-site request forgery attacks.',
          difficulty: 'hard'
        };
        break;
    }
  }

  showSuccessMessage() {
    // Show success animation/message
    console.log('Correct answer! +' + this.getPointsForDifficulty(this.currentChallenge.difficulty) + ' points');
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
      level: this.currentLevel
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
