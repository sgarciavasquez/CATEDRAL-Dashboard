// src/app/features/cart/guest-reserve.dialog.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface GuestReserveData {
  name: string;
  email: string;
  phone: string;
  message?: string;
}

@Component({
  selector: 'app-guest-reserve-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
  ],
  templateUrl: './guest-reserve.dialog.html',
})
export class GuestReserveDialogComponent {
  private fb = inject(FormBuilder);
  private ref = inject(
    MatDialogRef<GuestReserveDialogComponent, GuestReserveData>
  );

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.minLength(6)]],
    message: [''],
  });

  submit() {
    if (this.form.invalid) return;
    this.ref.close(this.form.value as GuestReserveData);
  }

  cancel() {
    this.ref.close();
  }
}
