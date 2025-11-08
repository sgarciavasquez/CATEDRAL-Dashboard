import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../shared/services/authservice/auth';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { of, firstValueFrom } from 'rxjs';
import { ApiUser, UserService } from '../../shared/services/user/user.service';
import { Reservation, ReservationService } from '../../shared/services/user/reservation.service';
import { FooterComponent } from "../../shared/components/footer/footer";
import { HeaderComponent } from "../../shared/components/header/header";
import { MatIcon } from "@angular/material/icon";
import { ChatApiService } from '../../shared/services/chat/chat.api.service';
import { ChatContextService } from '../../chat/chat-context.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NgIf, NgFor, FooterComponent, HeaderComponent, MatIcon],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.css'],
})
export class ProfilePage {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private reservationService = inject(ReservationService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);
  private chatApi = inject(ChatApiService);
  private chatCtx = inject(ChatContextService);

  loading = false;
  saving = false;
  error = '';
  okMsg = '';

  user: ApiUser | null = null;
  reservations: Reservation[] = [];

  form = this.fb.group({
    name: ['', Validators.required],
    email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
    phone: ['', Validators.required],
  });

  constructor() {
    this.load();
  }

  private load() {
    this.loading = true;
    this.error = '';
    this.okMsg = '';

    this.userService.me().pipe(
      tap((u: ApiUser) => {
        this.user = u;

        const emailCtrl = this.form.get('email')!;
        const wasDisabled = emailCtrl.disabled;
        if (wasDisabled) emailCtrl.enable({ emitEvent: false });

        this.form.patchValue(
          { name: u?.name ?? '', email: u?.email ?? '', phone: u?.phone ?? '' },
          { emitEvent: false }
        );

        if (wasDisabled) emailCtrl.disable({ emitEvent: false });
        this.cd.markForCheck();
      }),
      switchMap((u: ApiUser) => {
        const id = u._id ?? u.id;
        if (!id) return of<Reservation[]>([]);
        // 👉 si quieres filtrar por estado: listByUser(id, 'CONFIRMED')
        return this.reservationService.listByUser(id).pipe(
          catchError(() => of<Reservation[]>([]))
        );
      }),
      catchError(err => {
        this.error = err?.error?.message ?? 'No se pudo cargar perfil';
        this.loading = false;
        return of<Reservation[]>([]);
      })
    ).subscribe(res => {
      this.reservations = res ?? [];
      this.loading = false;
      this.cd.markForCheck();
    });
  }

  // ========= CHAT (igual) =========
  private async inferAdminId(clienteId: string): Promise<string | null> {
    try {
      const res = await firstValueFrom(this.chatApi.listMine('cliente'));
      const chats = res?.data ?? [];
      for (const c of chats) {
        if (c?.clienteId === clienteId && c?.adminId) return c.adminId;
      }
      return null;
    } catch {
      return null;
    }
  }

  async openChat(r: Reservation) {
    this.error = '';
    const clienteId = this.user?._id ?? (this.user as any)?.id;
    if (!clienteId) return;

    const adminId = await this.inferAdminId(clienteId);
    if (!adminId) {
      this.error = 'No pude detectar con qué administrador chatear. Pídele al admin que te envíe un primer mensaje o agreguen un endpoint de configuración para exponer un admin.';
      return;
    }

    const res = await firstValueFrom(this.chatApi.createOrGet({ clienteId, adminId }));
    const chat = res?.data;
    if (!chat?._id) return;

    const preview = {
      reservationId: (r as any)._id ?? (r as any).id,
      createdAt: (r as any).createdAt,
      total: (r as any).total,
      items: (r as any).items?.map((it: any) => ({
        name: it.name,
        qty: it.qty ?? it.quantity ?? 1,
        price: it.price,
        imageUrl: it.imageUrl,
      })) ?? undefined,
    };

    this.chatCtx.set(chat._id, preview);
    this.router.navigate(['/chat', chat._id], { state: { reservationPreview: preview } });
  }

  // ========= PERFIL =========
  trackReservation = (_: number, r: Reservation) => (r as any)._id || (r as any).id;

  // ⚠️ helper para la portada de cada reserva
  getCover(r: Reservation): string {
    return r?.items?.[0]?.imageUrl || 'assets/p1.png';
  }

  save() {
    if (!this.user) return;
    if (this.form.invalid) { this.error = 'Revisa los campos'; return; }
    this.saving = true; this.error = ''; this.okMsg = '';

    const payload = {
      name: this.form.get('name')!.value ?? '',
      phone: this.form.get('phone')!.value ?? '',
    };

    const id = this.user._id ?? this.user.id!;
    this.userService.update(id, payload).subscribe({
      next: (u) => { this.user = u; this.okMsg = 'Datos actualizados'; this.saving = false; },
      error: (e) => { this.error = e?.error?.message ?? 'Error al actualizar'; this.saving = false; }
    });
  }

  deleteAccount() {
    if (!this.user) return;
    if (!confirm('¿Seguro quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) return;
    const id = this.user._id ?? this.user.id!;
    this.userService.delete(id).subscribe({
      next: () => { this.auth.logout(); this.router.navigateByUrl('/'); },
      error: (e) => { this.error = e?.error?.message ?? 'Error al eliminar cuenta'; }
    });
  }

  formatDate(d?: string) {
    if (!d) return '';
    return new Date(d).toLocaleDateString();
  }
}