import { Component } from '@angular/core';
import { RouterOutlet,RouterLink,RouterLinkActive,Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';


@Component({
  selector: 'app-main-layout',
  imports: [CommonModule, RouterOutlet,RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  title = 'AI-Powered OSS Analyser';
  isSidebarOpen = true;
  username: string | null = null;
  showProfileMenu = false;

  constructor(private authService: AuthService,private router: Router) {}
  
  ngOnInit(){
    const token = this.authService.getToken();
    if(token){
      const decoded = this.decodeToken(token);
      this.username = decoded?.username || null;
    }
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  logout(){
    this.authService.logout();
    this.router.navigate(['/signin']);
  }

  private decodeToken(token: string): any {
    try{
      return JSON.parse(atob(token.split('.')[1]));
    }catch(e){
      console.error('Invalid Token');
      return null;
    }

  }



}
