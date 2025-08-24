import { Component, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatServiceService } from '../../services/chat-service.service';
import { MarkdownModule } from 'ngx-markdown';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownModule],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.scss'
})
export class ChatbotComponent implements AfterViewChecked {
  
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  messages: any[] = [
    {
      text: 'Hello! I\'m your AI security assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ];

  isFullScreen = false;
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

  securityTips: string[] = [];
  isLoadingTips = false;

  constructor(private chatService: ChatServiceService) {
    this.loadSecurityTips();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    } catch(err) {}
  }

  toggleFullScreen() {
    this.isFullScreen = !this.isFullScreen;
  }

  loadSecurityTips() {
    this.isLoadingTips = true;
    
    this.chatService.getSecurityTips().subscribe({
      next: (tips) => {
        this.securityTips = tips;
        this.updateSecurityTip();
        this.isLoadingTips = false;
      },
      error: (error) => {
        console.error('Error loading security tips:', error);
        this.isLoadingTips = false;
      }
    });
  }

  updateSecurityTip() {
    if (this.securityTips.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.securityTips.length);
      this.currentSecurityTip = this.securityTips[randomIndex];
    } else {
      this.currentSecurityTip = 'Loading security tips...';
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

  sendMessage() {
    if (!this.newMessage.trim()) return;

    // push user message
    this.messages.push({
      text: this.newMessage,
      sender: 'user',
      timestamp: new Date()
    });

    const msgToSend = this.newMessage;
    this.newMessage = '';
    this.isTyping = true;

    // call backend via service
    this.chatService.sendMessage(msgToSend).subscribe({
      next: (res: any) => {
        this.messages.push({ text: res.response, sender: 'bot', timestamp: new Date() });
      },
      error: () => {
        this.messages.push({ text: '⚠️ Error contacting server.', sender: 'bot', timestamp: new Date() });
      },
      complete: () => {
        this.isTyping = false;
        this.updateSecurityTip();
      }
    });
  }

  getMessageClass(message: any): string {
    return message.sender === 'user' 
      ? 'bg-blue-500 text-white' 
      : 'bg-gray-200 text-gray-800';
  }

  getMessageAlignment(message: any): string {
    return message.sender === 'user' ? 'justify-end' : 'justify-start';
  }
}
