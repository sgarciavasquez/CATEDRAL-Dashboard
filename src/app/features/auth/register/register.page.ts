import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../shared/services/authservice/auth';

@Component({
  standalone: true,
  selector: 'app-register-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.page.html'
})
export class RegisterPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = false;
  error = '';

  form = this.fb.group({
  name: ['', Validators.required],
  email: ['', [Validators.required, Validators.email]],
  // acepta con o sin espacio: +569 12345678  /  +56912345678
  phone: ['', [
    Validators.required,
    Validators.pattern(/^\+569 ?\d{8}$/)   // quita los min/max length
  ]],
  password: ['', [Validators.required, Validators.minLength(6)]],
});

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true; this.error = '';
    this.auth.register(this.form.value as any).subscribe({
      next: () => { this.loading = false; this.router.navigateByUrl('/'); },
      error: (e) => { this.loading = false; this.error = e?.error?.message ?? 'Error al registrar'; }
    });
  }
}
