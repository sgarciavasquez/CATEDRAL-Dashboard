import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../shared/services/authservice/auth';

function same(controlName: string, matchName: string) {
  return (group: AbstractControl) => {
    const a = group.get(controlName)?.value;
    const b = group.get(matchName)?.value;
    return a && b && a === b ? null : { notMatch: true };
  };
}

@Component({
  standalone: true,
  selector: 'app-reset-password',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.page.html'
})
export class ResetPasswordPage {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);

  token = this.route.snapshot.queryParamMap.get('token') ?? '';
  loading = false;
  error = '';
  okMsg = '';

  form = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirm: ['', [Validators.required]],
  }, { validators: same('password', 'confirm') });

  onSubmit() {
    if (!this.token) { this.error = 'Token inválido.'; return; }
    if (this.form.invalid) return;

    this.loading = true; this.error = ''; this.okMsg = '';
    const pass = this.form.value.password!;
    this.auth.resetPassword(pass, this.token)
      .subscribe({
        next: (r) => {
          this.okMsg = r.message || 'Contraseña actualizada. Ahora puedes ingresar.';
          this.loading = false;
          setTimeout(() => this.router.navigateByUrl('/auth/login'), 1200);
        },
        error: (e) => { this.error = e?.error?.message ?? 'No fue posible actualizar la contraseña.'; this.loading = false; }
      });
  }
}
