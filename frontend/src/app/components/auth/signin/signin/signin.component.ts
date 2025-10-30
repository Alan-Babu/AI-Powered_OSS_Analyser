import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder,FormGroup,ReactiveFormsModule,Validators } from '@angular/forms';
import { Router,RouterLink } from '@angular/router';
import { AuthService, LoginRequest } from '../../../../services/auth.service';

@Component({
  selector: 'app-signin',
  imports: [CommonModule,ReactiveFormsModule,RouterLink],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.scss'
})
export class SigninComponent {
  form: FormGroup
  isLoading = false
  errorMessage: string | null = null
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      usernameOrEmail: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6),Validators.pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/)]]
    })
  }

  onSubmit(){
    if(this.form.invalid) return;

    console.log(this.form.value);

    this.isLoading = true
    this.errorMessage = null

    const data: LoginRequest = this.form.value
    this.authService.login(data).subscribe({
      next:()=>{
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error:(err)=>{
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Invalid Credentials';
      }
    });
  } 

}
