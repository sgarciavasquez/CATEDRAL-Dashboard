import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../shared/services/authservice/auth';

@Component({
  standalone: true,
  selector: 'app-forgot-password',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.page.html'
})
export class ForgotPasswordPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  loading = false;
  error = '';
  okMsg = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true; this.error = ''; this.okMsg = '';
    this.auth.forgotPassword(this.form.value.email!)
      .subscribe({
        next: (r) => { this.okMsg = r.message || 'Si el email existe, te enviamos un enlace.'; this.loading = false; },
        error: (e) => { this.error = e?.error?.message ?? 'No pudimos procesar tu solicitud.'; this.loading = false; }
      });
  }
}
