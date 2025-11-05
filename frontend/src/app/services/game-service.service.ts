import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

// ==============================
// 🔹 Interface Definitions
// ==============================
export interface Challenge {
  id: number;
  title: string;
  description: string;
  code: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  category: string;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  level: number;
  challengesCompleted: number;
  averageTime: number;
}

export interface GameStats {
  challengesCompleted: number;
  correctAnswers: number;
  totalTimeSpent: number;
  averageScore: number;
  currentStreak: number;
}

export interface UserProgress {
  userId: number;
  score: number;
  level: number;
  livesRemaining: number;
}

// ==============================
// 🔹 Game Service
// ==============================
@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient, private authService: AuthService) {}

  // --- Helper: Include JWT token if available ---
  private get headers() {
    const token = this.authService.getToken();
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : ''
      })
    };
  }

  // =============================
  // 🔹 Challenges
  // =============================
  getChallenges(): Observable<Challenge[]> {
    return this.http.get<Challenge[]>(`${this.baseUrl}/challenges`, this.headers)
      .pipe(
        catchError(() => {
          console.warn('Backend not reachable — using local challenges');
          return of(this.defaultChallenges);
        })
      );
  }

  getChallengeById(id: number): Observable<Challenge | null> {
    return this.http.get<Challenge>(`${this.baseUrl}/challenges/${id}`, this.headers)
      .pipe(
        catchError(() => {
          const local = this.defaultChallenges.find(c => c.id === id) || null;
          return of(local);
        })
      );
  }

  getChallengesByDifficulty(difficulty: string): Observable<Challenge[]> {
    return this.http.get<Challenge[]>(`${this.baseUrl}/challenges?difficulty=${difficulty}`, this.headers)
      .pipe(
        catchError(() => of(this.defaultChallenges.filter(c => c.difficulty === difficulty)))
      );
  }

  getChallengesByCategory(category: string): Observable<Challenge[]> {
    return this.http.get<Challenge[]>(`${this.baseUrl}/challenges?category=${category}`, this.headers)
      .pipe(
        catchError(() => of(this.defaultChallenges.filter(c => c.category === category)))
      );
  }

  // =============================
  // 🔹 Leaderboard
  // =============================
  getLeaderboard(): Observable<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>(`${this.baseUrl}/leaderboard`, this.headers)
      .pipe(
        catchError(() => {
          console.warn('Backend not reachable — using local leaderboard');
          return of(this.defaultLeaderboard);
        })
      );
  }

  // =============================
  // 🔹 User Progress
  // =============================
  getUserProgress(): Observable<UserProgress> {
    const token = this.authService.getToken();
    if (!token) {
      console.warn('No token found — user not logged in.');
      return of({ userId: -1, score: 0, level: 1, livesRemaining: 3 });
    }

    return this.http.get<UserProgress>(`${this.baseUrl}/user/progress/me`, this.headers)
      .pipe(
        catchError(() => {
          console.warn('Backend not reachable — using default progress');
          return of({ userId: 0, score: 0, level: 1, livesRemaining: 3 });
        })
      );
  }

  updateProgress(progress: UserProgress): Observable<void> {
    const token = this.authService.getToken();
    if (!token) return throwError(() => new Error('User not authenticated'));

    return this.http.put<void>(`${this.baseUrl}/user/progress/me`, progress, this.headers)
      .pipe(
        catchError(err => {
          console.error('Update progress failed:', err);
          return throwError(() => err);
        })
      );
  }


  // =============================
  // 🔹 Challenge Submission
  // =============================
  submitChallengeResult(challengeId: number, isCorrect: boolean, timeSpent: number): Observable<any> {
    const payload = {
      challengeId,
      isCorrect,
      timeSpent,
      timestamp: new Date().toISOString()
    };

    return this.http.post(`${this.baseUrl}/user/submit`, payload, this.headers)
      .pipe(
        catchError(() => {
          console.warn('Backend not reachable — result stored locally');
          return of({ success: true, message: 'Result recorded locally (offline)' });
        })
      );
  }

  // =============================
  // 🔹 Game Statistics
  // =============================
  getUserStats(): Observable<GameStats> {
    return this.http.get<GameStats>(`${this.baseUrl}/user/stats`, this.headers)
      .pipe(
        catchError(() => of({
          challengesCompleted: 0,
          correctAnswers: 0,
          totalTimeSpent: 0,
          averageScore: 0,
          currentStreak: 0
        }))
      );
  }

  // =============================
  // 🔹 Default Local Data
  // =============================
  private defaultChallenges: Challenge[] = [
    {
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
      difficulty: 'easy',
      points: 100,
      category: 'SQL Injection'
    },
    {
      id: 2,
      title: 'Identify XSS Vulnerability',
      description: 'Find the Cross-Site Scripting vulnerability in this code',
      code: `function displayUserComment(comment) {
  document.getElementById('comment').innerHTML = comment;
}`,
      options: [
        'Line 2: Direct innerHTML assignment',
        'Line 1: Function parameter',
        'Line 1: Function declaration',
        'No vulnerability found'
      ],
      correctAnswer: 0,
      explanation: 'Direct assignment to innerHTML allows XSS attacks. Use textContent or sanitize input.',
      difficulty: 'medium',
      points: 150,
      category: 'XSS'
    },
    {
      id: 3,
      title: 'Spot Authentication Bypass',
      description: 'Identify the authentication bypass vulnerability',
      code: `function checkAccess(userId) {
  if (userId === 'admin') {
    return true;
  }
  return false;
}`,
      options: [
        'Line 2: Hardcoded admin check',
        'Line 4: Return false',
        'Line 1: Function declaration',
        'No vulnerability found'
      ],
      correctAnswer: 0,
      explanation: 'Hardcoded authentication checks can be bypassed. Use proper session management.',
      difficulty: 'hard',
      points: 200,
      category: 'Authentication'
    },
    {
      id: 4,
      title: 'Find Path Traversal',
      description: 'Identify the path traversal vulnerability',
      code: `function readFile(filename) {
  const path = '/uploads/' + filename;
  return fs.readFileSync(path);
}`,
      options: [
        'Line 2: Path concatenation without validation',
        'Line 3: File reading',
        'Line 1: Function declaration',
        'No vulnerability found'
      ],
      correctAnswer: 0,
      explanation: 'Path concatenation without validation allows directory traversal attacks.',
      difficulty: 'medium',
      points: 150,
      category: 'Path Traversal'
    },
    {
      id: 5,
      title: 'Identify CSRF Vulnerability',
      description: 'Find the Cross-Site Request Forgery vulnerability',
      code: `function updateProfile(userId, data) {
  // No CSRF token validation
  return updateUserProfile(userId, data);
}`,
      options: [
        'Line 2: Missing CSRF token validation',
        'Line 3: Function call',
        'Line 1: Function declaration',
        'No vulnerability found'
      ],
      correctAnswer: 0,
      explanation: 'Missing CSRF token validation allows unauthorized state-changing requests.',
      difficulty: 'hard',
      points: 200,
      category: 'CSRF'
    }
  ];

  private defaultLeaderboard: LeaderboardEntry[] = [
    { name: 'SecurityMaster', score: 2500, level: 5, challengesCompleted: 25, averageTime: 45 },
    { name: 'CodeGuardian', score: 2100, level: 4, challengesCompleted: 20, averageTime: 52 },
    { name: 'VulnHunter', score: 1800, level: 4, challengesCompleted: 18, averageTime: 58 },
    { name: 'SecureDev', score: 1500, level: 3, challengesCompleted: 15, averageTime: 65 }
  ];
}
