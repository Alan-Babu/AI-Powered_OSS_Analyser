import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.scss'
})
export class ChatbotComponent {
  
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

  sendMessage() {
    if (this.newMessage.trim()) {
      // Add user message
      this.messages.push({
        id: this.messages.length + 1,
        text: this.newMessage,
        sender: 'user',
        timestamp: new Date()
      });

      const userMessage = this.newMessage;
      this.newMessage = '';
      this.isTyping = true;

      // Simulate bot response
      setTimeout(() => {
        this.isTyping = false;
        this.messages.push({
          id: this.messages.length + 1,
          text: this.generateBotResponse(userMessage),
          sender: 'bot',
          timestamp: new Date()
        });
      }, 1000 + Math.random() * 2000);
    }
  }

  generateBotResponse(userMessage: string): string {
    const message = userMessage.toLowerCase();
    
    if (message.includes('vulnerability') || message.includes('security')) {
      return 'I can help you analyze security vulnerabilities in your repositories. Would you like me to scan for known CVEs or explain specific security concepts?';
    } else if (message.includes('dependency') || message.includes('package')) {
      return 'I can help you analyze dependencies for security risks, outdated packages, and license compliance. What specific information do you need?';
    } else if (message.includes('risk') || message.includes('assessment')) {
      return 'I can help you understand risk assessment methodologies and provide recommendations for improving your security posture. What would you like to know?';
    } else if (message.includes('hello') || message.includes('hi')) {
      return 'Hello! I\'m here to help with your OSS security analysis. You can ask me about vulnerabilities, dependencies, risk assessment, or any security-related questions.';
    } else {
      return 'I\'m here to help with OSS security analysis. You can ask me about vulnerabilities, dependencies, risk assessment, or any security-related topics. How can I assist you?';
    }
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
