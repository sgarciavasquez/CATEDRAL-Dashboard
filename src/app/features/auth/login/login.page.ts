// features/auth/login/login.page.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../shared/services/authservice/auth';
import { FooterComponent } from '../../../shared/components/footer/footer';
import { HeaderComponent } from '../../../shared/components/header/header';

@Component({
  standalone: true,
  selector: 'app-login-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FooterComponent , HeaderComponent],
  templateUrl: './login.page.html'
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = false;
  error = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true; this.error = '';
    this.auth.login(this.form.value as any).subscribe({
      next: () => {
        this.loading = false;
        // ⇨ ir al inbox de chat
        this.router.navigateByUrl('/chat');
      },
      error: (e) => {
        this.loading = false;
        this.error = e?.error?.message ?? 'Error al iniciar sesión';
      }
    });
  }
}
