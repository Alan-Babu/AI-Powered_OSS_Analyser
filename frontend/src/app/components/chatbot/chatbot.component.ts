import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.scss'
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  messages: any[] = [
    {
      id: 1,
      text: 'Hello! I\'m your AI security assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ];

  newMessage = '';
  isTyping = false;
  currentSecurityTip = '';

  quickActions = [
    { label: 'Scan Repository', action: 'scan' },
    { label: 'Check Dependencies', action: 'dependencies' },
    { label: 'Vulnerability Report', action: 'vulnerabilities' },
    { label: 'Risk Assessment', action: 'risk' },
    { label: 'Security Tips', action: 'tips' }
  ];

  securityTips = [
    'Always use parameterized queries to prevent SQL injection attacks.',
    'Keep your dependencies updated to patch known vulnerabilities.',
    'Implement proper input validation and sanitization.',
    'Use HTTPS for all communications to encrypt data in transit.',
    'Regularly audit your code for security best practices.',
    'Implement rate limiting to prevent brute force attacks.',
    'Use strong authentication and authorization mechanisms.',
    'Monitor your application logs for suspicious activities.'
  ];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.updateSecurityTip();
    this.checkServicesHealth();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    } catch(err) {}
  }

  updateSecurityTip() {
    const randomIndex = Math.floor(Math.random() * this.securityTips.length);
    this.currentSecurityTip = this.securityTips[randomIndex];
  }

  async checkServicesHealth() {
    try {
      const health = await this.apiService.checkAIServicesHealth();
      if (health) {
        this.addBotMessage('AI services are online and ready to help with security analysis!');
      }
    } catch (error) {
      this.addBotMessage('Some AI services are currently offline. Basic assistance is still available.');
    }
  }

  sendQuickAction(action: any) {
    this.newMessage = this.getQuickActionText(action.action);
    this.sendMessage();
  }

  getQuickActionText(action: string): string {
    switch (action) {
      case 'scan': return 'How do I scan a repository for security vulnerabilities?';
      case 'dependencies': return 'How can I check my dependencies for security risks?';
      case 'vulnerabilities': return 'What are the most common security vulnerabilities?';
      case 'risk': return 'How do I assess security risk in my project?';
      case 'tips': return 'Give me some security best practices.';
      default: return 'How can you help me with security?';
    }
  }

  async sendMessage() {
    if (this.newMessage.trim()) {
      // Add user message
      this.addUserMessage(this.newMessage);
      const userMessage = this.newMessage;
      this.newMessage = '';
      this.isTyping = true;

      try {
        // Generate AI response
        const response = await this.generateAIResponse(userMessage);
        this.isTyping = false;
        this.addBotMessage(response);
      } catch (error) {
        this.isTyping = false;
        this.addBotMessage('I apologize, but I encountered an error. Please try again or contact support.');
      }
    }
  }

  addUserMessage(text: string) {
    this.messages.push({
      id: this.messages.length + 1,
      text: text,
      sender: 'user',
      timestamp: new Date()
    });
  }

  addBotMessage(text: string) {
    this.messages.push({
      id: this.messages.length + 1,
      text: text,
      sender: 'bot',
      timestamp: new Date()
    });
    this.updateSecurityTip();
  }

  async generateAIResponse(userMessage: string): Promise<string> {
    const message = userMessage.toLowerCase();
    
    // Check if it's a repository scan request
    if (message.includes('scan') && (message.includes('repo') || message.includes('github'))) {
      return 'To scan a repository, go to the Repository Scan page and enter the GitHub URL. I can help analyze the results for security vulnerabilities, dependency risks, and provide recommendations.';
    }
    
    // Check if it's about dependencies
    if (message.includes('dependency') || message.includes('package') || message.includes('library')) {
      return 'Dependencies can introduce security risks. I recommend: 1) Regular updates to patch vulnerabilities, 2) Using dependency scanning tools, 3) Checking for known CVEs, 4) Reviewing license compliance. Would you like me to explain any of these in detail?';
    }
    
    // Check if it's about vulnerabilities
    if (message.includes('vulnerability') || message.includes('cve') || message.includes('security')) {
      return 'Common security vulnerabilities include: SQL Injection, XSS, CSRF, Insecure Deserialization, and Broken Authentication. I can help you understand how to prevent these and scan your code for them.';
    }
    
    // Check if it's about risk assessment
    if (message.includes('risk') || message.includes('assessment') || message.includes('evaluate')) {
      return 'Security risk assessment involves: 1) Identifying assets, 2) Assessing threats, 3) Evaluating vulnerabilities, 4) Calculating risk scores, 5) Implementing controls. I can help you with this process.';
    }
    
    // Check if it's about security tips
    if (message.includes('tip') || message.includes('best practice') || message.includes('secure')) {
      return 'Key security best practices: Use HTTPS, implement proper authentication, validate all inputs, keep software updated, use security headers, implement logging, and conduct regular security audits.';
    }
    
    // Check if it's a greeting
    if (message.includes('hello') || message.includes('hi') || message.includes('help')) {
      return 'Hello! I\'m your AI security assistant. I can help you with: repository scanning, vulnerability analysis, dependency checking, risk assessment, and security best practices. What would you like to know?';
    }
    
    // Default response
    return 'I\'m here to help with OSS security analysis. You can ask me about vulnerabilities, dependencies, risk assessment, or any security-related topics. Try asking about scanning repositories or checking dependencies!';
  }

  getMessageClass(message: any): string {
    return message.sender === 'user' 
      ? 'bg-blue-600 text-white ml-auto' 
      : 'bg-gray-100 text-gray-900';
  }

  getMessageAlignment(message: any): string {
    return message.sender === 'user' ? 'justify-end' : 'justify-start';
  }
}
