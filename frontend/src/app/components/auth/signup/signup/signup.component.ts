import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder,FormGroup,ReactiveFormsModule,Validators } from '@angular/forms';
import { Router,RouterLink } from '@angular/router';
import { AuthService, SignUpRequest } from '../../../../services/auth.service';

@Component({
  selector: 'app-signup',
  imports: [CommonModule,ReactiveFormsModule,RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent {
  form: FormGroup
  isLoading = false
  successMessage: string | null = null
  errorMessage: string | null = null

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6),Validators.pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/)]]
    });
  }

  onSubmit(){
    if(this.form.invalid) return;
    this.isLoading = true
    this.errorMessage = null
    this.successMessage = null

    const data: SignUpRequest = this.form.value
    this.authService.signup(data).subscribe({
      next:()=>{
        this.isLoading = false;
        this.successMessage = 'Signup Successful! Redirecting to Signin...';
        this.form.reset();
        setTimeout(() => {
          this.router.navigate(['/signin']);
        }, 2000);
      },
      error:(err)=>{
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Signup Failed';
      }
    });
  }


}
