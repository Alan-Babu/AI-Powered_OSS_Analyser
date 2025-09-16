import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EnhancedApiService } from '../../services/enhanced-api.service';

@Component({
  selector: 'app-code-quality',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './code-quality.component.html',
  styleUrl: './code-quality.component.scss'
})
export class CodeQualityComponent {
  form: FormGroup;
  isAnalyzing = false;
  results: any | null = null;
  errorMessage: string | null = null;

  constructor(private fb: FormBuilder, private api: EnhancedApiService) {
    this.form = this.fb.group({
      filename: ['', Validators.required],
      language: ['', Validators.required],
      content: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  analyze(): void {
    if (this.form.invalid) return;
    this.isAnalyzing = true;
    this.errorMessage = null;
    this.results = null;

    const { filename, content, language } = this.form.value;
    this.api.analyzeCodeWithAI(filename, content, language).subscribe({
      next: (res) => {
        this.results = res;
        this.isAnalyzing = false;
      },
      error: (err) => {
        this.errorMessage = err.message || 'Failed to analyze code';
        this.isAnalyzing = false;
      }
    });
  }
}


