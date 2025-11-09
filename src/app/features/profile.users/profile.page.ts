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
import { MatIconModule } from "@angular/material/icon";
import { ChatApiService } from '../../shared/services/chat/chat.api.service';
import { ChatContextService } from '../../chat/chat-context.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NgIf, NgFor, FooterComponent, HeaderComponent, MatIconModule],
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
    console.log('%c[Profile] constructor', 'color:#7c3aed');
    this.load();
  }

  private load() {
    console.log('%c[Profile] load() -> start', 'color:#2563eb');
    this.loading = true;
    this.error = '';
    this.okMsg = '';

    this.userService.me().pipe(
      tap((u: ApiUser) => {
        console.log('%c[Profile] me() OK:', 'color:#16a34a', u);
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
        const id = u?._id ?? (u as any)?.id;
        console.log('%c[Profile] switchMap -> userId:', 'color:#2563eb', id);
        if (!id) {
          console.warn('[Profile] NO userId, corto la carga de reservas');
          return of<Reservation[]>([]);
        }
        console.log('%c[Profile] llamando listByUser...', 'color:#2563eb');
        return this.reservationService.listByUser(id).pipe(
          catchError((e) => {
            console.error('[Profile] listByUser ERROR:', e);
            return of<Reservation[]>([]);
          })
        );
      }),
      catchError(err => {
        console.error('[Profile] me() ERROR:', err);
        this.error = err?.status === 401
          ? 'Inicia sesión para ver tu perfil.'
          : (err?.error?.message ?? 'No se pudo cargar perfil');
        this.loading = false;
        return of<Reservation[]>([]);
      })
    ).subscribe({
      next: (res) => {
        console.log('%c[Profile] reservas recibidas:', 'color:#16a34a', res);
        this.reservations = res ?? [];
      },
      error: (e) => {
        console.error('[Profile] subscribe ERROR:', e);
        this.loading = false;
      },
      complete: () => {
        console.log('%c[Profile] load() -> complete', 'color:#2563eb');
        this.loading = false;
        this.cd.markForCheck();
      }
    });
  }

  // ========= CHAT =========
  private async inferAdminId(clienteId: string): Promise<string | null> {
    console.log('%c[Chat] inferAdminId() -> start', 'color:#0ea5e9', { clienteId });

    try {
      const res = await firstValueFrom(this.chatApi.listMine('cliente'));
      const chats = res?.data ?? [];
      console.log('%c[Chat] listMine(cliente) OK', 'color:#22c55e', { count: chats.length, chats });

      for (const c of chats) {
        const match = c?.clienteId === clienteId && !!c?.adminId;
        console.log('[Chat] revisar chat', { chatId: c?._id, clienteId: c?.clienteId, adminId: c?.adminId, match });
        if (match) {
          console.log('%c[Chat] adminId inferido', 'color:#22c55e', c.adminId);
          return c.adminId;
        }
      }

      console.warn('[Chat] No se pudo inferir adminId (no hay chats previos con admin).');
      return null;
    } catch (err) {
      console.error('[Chat] listMine ERROR', err);
      return null;
    }
  }

  async openChat(r: Reservation) {
    console.log('%c[Chat] openChat() -> click', 'color:#0ea5e9', r);
    this.error = '';

    const clienteId = this.user?._id ?? (this.user as any)?.id;
    console.log('[Chat] clienteId detectado:', clienteId);
    if (!clienteId) {
      console.error('[Chat] No hay clienteId (usuario no cargado?)');
      return;
    }

    // 1) Intentar detectar admin con el que ya hubo conversación
    const adminId = await this.inferAdminId(clienteId);
    console.log('[Chat] adminId inferido:', adminId);

    if (!adminId) {
      this.error = 'No pude detectar con qué administrador chatear. Pídele al admin que te envíe un primer mensaje o definan un admin por defecto.';
      console.warn('[Chat] Abortar openChat: adminId null.');
      return;
    }

    // 2) Armar preview de la reserva
    const reservationId = (r as any)._id ?? (r as any).id;
    const preview = {
      reservationId,
      createdAt: (r as any).createdAt,
      total: (r as any).total,
      items: (r as any).items?.map((it: any) => ({
        name: it.name,
        qty: it.qty ?? it.quantity ?? 1,
        price: it.price,
        imageUrl: it.imageUrl,
      })) ?? undefined,
    };
    console.log('[Chat] preview generado:', preview);

    // 3) Llamar a /api/chats con el par (clienteId, adminId)
    const dto = { clienteId, adminId };
    console.log('%c[Chat] POST /api/chats (createOrGet)', 'color:#a855f7', dto);

    try {
      const resp = await firstValueFrom(this.chatApi.createOrGet(dto));
      console.log('%c[Chat] createOrGet OK', 'color:#22c55e', resp);

      const chat = resp?.data;
      if (!chat?._id) {
        console.error('[Chat] Respuesta sin _id de chat:', chat);
        this.error = 'No se pudo abrir el chat (respuesta inválida).';
        return;
      }

      // 4) Guardar contexto y navegar
      this.chatCtx.set(chat._id, preview);
      console.log('%c[Chat] Navegando a /chat/' + chat._id, 'color:#2563eb');
      this.router.navigate(['/chat', chat._id], { state: { reservationPreview: preview } });
    } catch (e: any) {
      console.error('%c[Chat] createOrGet ERROR', 'color:#ef4444', e);
      // si el backend valida @IsMongoId, verás 400 si adminId no es válido
      this.error = e?.error?.message ?? 'No se pudo abrir el chat. Intenta de nuevo.';
    }
  }



  trackReservation = (_: number, r: Reservation) => (r as any)._id || (r as any).id;

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

    const id = this.user._id ?? (this.user as any).id!;
    console.log('%c[Profile] update user:', 'color:#2563eb', id, payload);

    this.userService.update(id, payload).subscribe({
      next: (u) => { console.log('[Profile] update OK', u); this.user = u; this.okMsg = 'Datos actualizados'; this.saving = false; },
      error: (e) => { console.error('[Profile] update ERROR', e); this.error = e?.error?.message ?? 'Error al actualizar'; this.saving = false; }
    });
  }

  deleteAccount() {
    if (!this.user) return;
    if (!confirm('¿Seguro quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) return;
    const id = this.user._id ?? (this.user as any).id!;
    console.log('%c[Profile] delete user:', 'color:#dc2626', id);

    this.userService.delete(id).subscribe({
      next: () => { console.log('[Profile] delete OK'); this.auth.logout(); this.router.navigateByUrl('/'); },
      error: (e) => { console.error('[Profile] delete ERROR', e); this.error = e?.error?.message ?? 'Error al eliminar cuenta'; }
    });
  }

  formatDate(d?: string) {
    if (!d) return '';
    return new Date(d).toLocaleDateString();
  }
}
