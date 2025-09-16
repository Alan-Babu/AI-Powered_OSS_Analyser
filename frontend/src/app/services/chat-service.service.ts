import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatServiceService {
  
  // Default security tips if backend is not available
  private defaultSecurityTips = [
    'Always use parameterized queries to prevent SQL injection attacks.',
    'Keep your dependencies updated to patch known vulnerabilities.',
    'Implement proper input validation and sanitization.',
    'Use HTTPS for all communications to encrypt data in transit.',
    'Regularly audit your code for security best practices.',
    'Implement rate limiting to prevent brute force attacks.',
    'Use strong authentication and authorization mechanisms.',
    'Monitor your application logs for suspicious activities.',
    'Implement Content Security Policy (CSP) headers.',
    'Use secure session management with proper timeout and rotation.',
    'Validate and sanitize all user inputs on both client and server side.',
    'Implement proper error handling without exposing sensitive information.',
    'Use secure coding practices and follow OWASP guidelines.',
    'Regularly backup your data and test recovery procedures.',
    'Implement multi-factor authentication where possible.'
  ];

  constructor(private http: HttpClient) { }

  sendMessage(message: string): Observable<{response: string}> {
    if (!message) {
      console.error('Tried to send a null or undefined message');
      return of({response: 'Error: Tried to send a null or undefined message'});
    }
    // Route chat via backend to avoid CORS and invalid external URLs
    return this.http.post<{response: string}>(`${environment.backendUrl}/api/repo/chat`, { message: message }).pipe(
      catchError(err => {
        console.error('An error occurred sending a message: ', err);
        return of({response: 'Error: An error occurred sending a message'});
      })
    );
  }

  // Get security tips from backend or use defaults
  getSecurityTips(): Observable<string[]> {
    // No backend endpoint available; return defaults to avoid network errors
    return of(this.defaultSecurityTips);
  }

  // Get quick actions from backend or use defaults
  getQuickActions(): Observable<any[]> {
    const defaultActions = [
      { label: 'Scan Repository', action: 'scan', description: 'Scan a repository for security vulnerabilities' },
      { label: 'Check Dependencies', action: 'dependencies', description: 'Check dependencies for security risks' },
      { label: 'Vulnerability Report', action: 'vulnerabilities', description: 'Generate a vulnerability report' },
      { label: 'Risk Assessment', action: 'risk', description: 'Perform a security risk assessment' },
      { label: 'Security Tips', action: 'tips', description: 'Get security best practices' }
    ];
    // Return defaults directly to avoid failed network calls
    return of(defaultActions);
  }

  // Get AI suggestions based on context
  getAISuggestions(context: string): Observable<string[]> {
    // Return defaults directly; no stable backend endpoint provided
    return of([
      'Consider implementing input validation',
      'Review your authentication mechanisms',
      'Check for common security vulnerabilities',
      'Update your dependencies to latest versions'
    ]);
  }

}
