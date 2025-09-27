import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../shared/services/authservice/auth';
import { FooterComponent } from '../../../shared/components/footer/footer';
import { HeaderComponent } from '../../../shared/components/header/header';

@Component({
  standalone: true,
  selector: 'app-register-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FooterComponent , HeaderComponent],
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
    phone: ['', [
      Validators.required,
      Validators.pattern(/^\(\+569\)\d{0,8}$/) 
    ]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor() {
    this.form.get('phone')!.setValue('(+569)');
  }

  onPhoneInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const raw = (input.value ?? '').toString();

    // toma solo dígitos
    let digits = raw.replace(/\D/g, '');

    // si el usuario pegó "569..." o "+569", los quitamos del head
    if (digits.startsWith('569')) digits = digits.slice(3);

    // recorta a 8 dígitos
    digits = digits.slice(0, 8);

    const display = `(+569)${digits}`;
    this.form.get('phone')!.setValue(display, { emitEvent: false });

    // mueve el cursor al final para que sea cómodo escribir
    requestAnimationFrame(() => {
      const pos = display.length;
      input.setSelectionRange(pos, pos);
    });

    // actualiza validación (pasa con 0..8 dígitos, pero exigimos 8 al enviar)
    this.form.get('phone')!.updateValueAndValidity({ emitEvent: false });
  }

  /** Convierte "(+569)########" -> "+569 ########" para la API */
  private phoneForApi(): string {
    const display = (this.form.get('phone')!.value ?? '').toString();
    const last8 = display.replace(/\D/g, '').slice(-8); // los 8 dígitos finales
    return `+569 ${last8}`;
  }

  onSubmit() {
    // exige 8 dígitos antes de enviar
    const digitsCount = (this.form.get('phone')!.value ?? '').toString().replace(/\D/g, '').slice(-8).length;
    if (this.form.invalid || digitsCount !== 8) {
      this.error = 'Revisa los campos (teléfono ej: (+569)12345678).';
      return;
    }

    this.loading = true;
    this.error = '';

    const apiPayload = {
      ...this.form.value,
      phone: this.phoneForApi()   
    } as any;

    this.auth.register(apiPayload).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl('/');
      },
      error: (e) => {
        this.loading = false;
        console.error('Error HTTP registro:', e);
        this.error = e?.error?.message ?? e?.message ?? 'Error al registrar';
      }
    });
  }
}
