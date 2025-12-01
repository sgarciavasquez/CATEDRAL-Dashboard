import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgIf, NgFor, NgForOf } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../shared/services/authservice/auth';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { of, firstValueFrom } from 'rxjs';
import { ApiUser, UserService } from '../../shared/services/user/user.service';
import { Reservation, ReservationService } from '../../shared/services/user/reservation.service';
import { FooterComponent } from '../../shared/components/footer/footer';
import { HeaderComponent } from '../../shared/components/header/header';
import { MatIconModule } from '@angular/material/icon';
import { ChatApiService } from '../../shared/services/chat/chat.api.service';
import { ChatContextService } from '../../chat/chat-context.service';
import { StarRatingComponent } from '../../shared/components/rating/star-rating.component';
import { RatingService } from '../../shared/services/rating/rating.service';
import { ProductService } from '../../shared/services/productservice/product.service';
import { UiProduct } from '../../shared/services/productservice/product.ui';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgIf,
    NgFor,
    NgForOf,
    FooterComponent,
    HeaderComponent,
    MatIconModule,
    StarRatingComponent,
  ],
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
  private ratingSvc = inject(RatingService);
  private productSrv = inject(ProductService);

  // ===== MAPAS DE IMÁGENES =====
  /** productId -> imageUrl */
  private productImagesById = new Map<string, string>();
  /** code -> imageUrl */
  private productImagesByCode = new Map<string, string>();
  /** nombre normalizado -> imageUrl */
  private productImagesByName = new Map<string, string>();

  loading = false;
  saving = false;
  error = '';
  okMsg = '';

  user: ApiUser | null = null;
  reservations: Reservation[] = [];

  /** ver más / ver menos reservas */
  showAllReservations = false;

  /** reservas que se muestran en la UI */
  get visibleReservations(): Reservation[] {
    return this.showAllReservations ? this.reservations : this.reservations.slice(0, 3);
  }

  form = this.fb.group({
    name: ['', Validators.required],
    email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
    phone: ['', Validators.required],
  });

  constructor() {
    console.log('%c[Profile] constructor', 'color:#7c3aed');
    this.load();
  }

  // ========== UTILS ==========

  private norm(s: string | undefined | null): string {
    return (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  /** scroll desde el menú de la izquierda */
  scrollTo(sectionId: 'datos' | 'reservas' | 'eliminar') {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /** toggle ver más / ver menos */
  toggleShowReservations() {
    this.showAllReservations = !this.showAllReservations;
  }

  // ========== CARGA PERFIL + RESERVAS ==========

  private load() {
    console.log('%c[Profile] load() -> start', 'color:#2563eb');
    this.loading = true;
    this.error = '';
    this.okMsg = '';

    this.userService
      .me()
      .pipe(
        tap((u: ApiUser) => {
          console.log('%c[Profile] me() OK:', 'color:#16a34a', u);
          this.user = u;

          const emailCtrl = this.form.get('email')!;
          const wasDisabled = emailCtrl.disabled;
          if (wasDisabled) emailCtrl.enable({ emitEvent: false });

          this.form.patchValue(
            { name: u?.name ?? '', email: u?.email ?? '', phone: u?.phone ?? '' },
            { emitEvent: false },
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
            }),
          );
        }),
        catchError((err) => {
          console.error('[Profile] me() ERROR:', err);
          this.error =
            err?.status === 401
              ? 'Inicia sesión para ver tu perfil.'
              : err?.error?.message ?? 'No se pudo cargar perfil';
          this.loading = false;
          return of<Reservation[]>([]);
        }),
      )
      .subscribe({
        next: (res) => {
          console.log('%c[Profile] reservas recibidas:', 'color:#16a34a', res);
          this.reservations = res ?? [];
          this.loadMyRatings();
          this.loadProductImages();
        },
        error: (e) => {
          console.error('[Profile] subscribe ERROR:', e);
          this.loading = false;
        },
        complete: () => {
          console.log('%c[Profile] load() -> complete', 'color:#2563eb');
          this.loading = false;
          this.cd.markForCheck();
        },
      });
  }

  private loadMyRatings() {
    if (!this.user) {
      console.warn('[Profile] loadMyRatings() sin user');
      return;
    }

    this.ratingSvc.getMyRatings().subscribe({
      next: (resp) => {
        const list = resp?.data ?? [];
        console.log('%c[Profile] mis ratings:', 'color:#22c55e', list);

        const map = new Map<string, number>();
        for (const r of list) {
          const pid =
            (r.product as any)?._id ? (r.product as any)._id : (r.product as any);
          map.set(String(pid), r.value);
        }

        for (const res of this.reservations) {
          (res as any).items?.forEach((it: any) => {
            const pid =
              it.productId ||
              (it.product &&
                ((it.product as any)._id || (it.product as any).id));

            if (!pid) return;

            const val = map.get(String(pid));
            if (val) {
              (it as any).myRating = val;
            }
          });
        }

        console.log(
          '%c[Profile] reservas con myRating aplicado',
          'color:#22c55e',
          this.reservations,
        );
        this.cd.markForCheck();
      },
      error: (err) => {
        console.error('[Profile] error cargando mis ratings', err);
      },
    });
  }

  // ========== MAPA DE PRODUCTOS / IMÁGENES ==========

  /** carga productos y llena los mapas de imágenes (id, code, nombre) */
  private loadProductImages() {
    this.productSrv.listUi().subscribe({
      next: (list: UiProduct[]) => {
        const byId = new Map<string, string>();
        const byCode = new Map<string, string>();
        const byName = new Map<string, string>();

        for (const p of list || []) {
          const anyP: any = p;
          const id =
            anyP._id ||
            anyP.id ||
            anyP.productId;

          const code: string | undefined = anyP.code;
          const name: string | undefined = anyP.name;

          const url: string =
            anyP.imageUrl ||
            anyP.img_url ||
            anyP.imgUrl ||
            anyP.image ||
            anyP.photoUrl ||
            '';

          if (!url) continue;

          if (id) byId.set(String(id), url);
          if (code) byCode.set(String(code), url);
          if (name) byName.set(this.norm(name), url);
        }

        this.productImagesById = byId;
        this.productImagesByCode = byCode;
        this.productImagesByName = byName;

        console.log('[Profile] productImagesById:', Array.from(byId.entries()));
        console.log('[Profile] productImagesByCode:', Array.from(byCode.entries()));
        console.log('[Profile] productImagesByName:', Array.from(byName.entries()));
        this.cd.markForCheck();
      },
      error: (err) => {
        console.error('[Profile] error cargando productos para imágenes', err);
      },
    });
  }

  /** Devuelve la imagen de un item de reserva usando los mapas (id, code, nombre) */
  getItemImage(it: any): string {
    const fallback = 'assets/p1.png';

    // 1) Si el item ya trae imagen directa, úsala
    if (it.imageUrl || it.img_url || it.imgUrl) {
      return it.imageUrl || it.img_url || it.imgUrl;
    }

    // 2) Intentar por productId
    const productId =
      it.productId ||
      (it.product && ((it.product as any)._id || (it.product as any).id));

    if (productId) {
      const fromId = this.productImagesById.get(String(productId));
      if (fromId) return fromId;
    }

    // 3) Intentar por code
    if (it.code) {
      const fromCode = this.productImagesByCode.get(String(it.code));
      if (fromCode) return fromCode;
    }

    // 4) Intentar por nombre normalizado
    if (it.name) {
      const key = this.norm(it.name);
      const fromName = this.productImagesByName.get(key);
      if (fromName) return fromName;
    }

    // 5) Fallback
    return fallback;
  }

  /** Portada de la reserva: usa el primer item */
  getCover(r: Reservation): string {
    const first = r?.items?.[0] as any;
    if (!first) return 'assets/p1.png';
    return this.getItemImage(first);
  }

  // ========== CHAT ==========

  private async inferAdminId(clienteId: string): Promise<string | null> {
    console.log('%c[Chat] inferAdminId() -> start', 'color:#0ea5e9', { clienteId });

    try {
      const res = await firstValueFrom(this.chatApi.listMine('cliente'));
      const chats = res?.data ?? [];
      console.log('%c[Chat] listMine(cliente) OK', 'color:#22c55e', {
        count: chats.length,
        chats,
      });

      for (const c of chats) {
        const cId = typeof c.clienteId === 'string' ? c.clienteId : c.clienteId?._id;
        const aId = typeof c.adminId === 'string' ? c.adminId : c.adminId?._id;

        const match = cId === clienteId && !!aId;

        if (match) {
          console.log('%c[Chat] adminId inferido', 'color:#22c55e', aId);
          return aId!;
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

    const statusRaw = (r.status || '').toString().toUpperCase();
    const reservationId = (r as any)._id ?? (r as any).id;

    const preview: any = {
      reservationId,
      createdAt: (r as any).createdAt,
      total: (r as any).total,
      status: (r as any).status?.toString().toUpperCase() ?? 'PENDING',
      items:
        (r as any).items?.map((it: any) => ({
          name: it.name,
          qty: it.qty ?? it.quantity ?? 1,
          price: it.price,
          imageUrl: this.getItemImage(it),
        })) ?? undefined,
    };
    console.log('[Chat] preview generado:', preview);

    const adminId = await this.inferAdminId(clienteId);
    console.log('[Chat] adminId inferido:', adminId);

    if (!adminId) {
      this.error =
        'No pude detectar con qué administrador chatear. Pídele al admin que te envíe un primer mensaje o definan un admin por defecto.';
      console.warn('[Chat] Abortar openChat: adminId null.');
      return;
    }

    const dto = { clienteId, adminId, reservationId };
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

      this.chatCtx.set(chat._id, preview as any);
      console.log('%c[Chat] ChatContext actualizado', 'color:#22c55e', {
        chatId: chat._id,
        preview,
      });

      this.chatApi
        .updateMeta(chat._id, {
          reservationId,
          reservationStatus: statusRaw,
          reservationPreview: preview,
        } as any)
        .subscribe({
          next: (m) => console.log('%c[Chat] meta actualizada en back', 'color:#22c55e', m),
          error: (e) => console.error('[Chat] updateMeta ERROR', e),
        });

      console.log('%c[Chat] Navegando a /chat/' + chat._id, 'color:#2563eb');
      this.router.navigate(['/chat', chat._id], {
        state: { reservationPreview: preview },
      });
    } catch (e: any) {
      console.error('%c[Chat] createOrGet ERROR', 'color:#ef4444', e);
      this.error = e?.error?.message ?? 'No se pudo abrir el chat. Intenta de nuevo.';
    }
  }

  // ========== VARIOS (guardar / borrar / rating) ==========

  trackReservation = (_: number, r: Reservation) =>
    (r as any)._id || (r as any).id;

  save() {
    if (!this.user) return;
    if (this.form.invalid) {
      this.error = 'Revisa los campos';
      return;
    }
    this.saving = true;
    this.error = '';
    this.okMsg = '';

    const payload = {
      name: this.form.get('name')!.value ?? '',
      phone: this.form.get('phone')!.value ?? '',
    };

    const id = this.user._id ?? (this.user as any).id!;
    console.log('%c[Profile] update user:', 'color:#2563eb', id, payload);

    this.userService.update(id, payload).subscribe({
      next: (u) => {
        console.log('[Profile] update OK', u);
        this.user = u;
        this.okMsg = 'Datos actualizados';
        this.saving = false;
      },
      error: (e) => {
        console.error('[Profile] update ERROR', e);
        this.error = e?.error?.message ?? 'Error al actualizar';
        this.saving = false;
      },
    });
  }

  deleteAccount() {
    if (!this.user) return;
    if (!confirm('¿Seguro quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) return;
    const id = this.user._id ?? (this.user as any).id!;
    console.log('%c[Profile] delete user:', 'color:#dc2626', id);

    this.userService.delete(id).subscribe({
      next: () => {
        console.log('[Profile] delete OK');
        this.auth.logout();
        this.router.navigateByUrl('/');
      },
      error: (e) => {
        console.error('[Profile] delete ERROR', e);
        this.error = e?.error?.message ?? 'Error al eliminar cuenta';
      },
    });
  }

  formatDate(d?: string) {
    if (!d) return '';
    return new Date(d).toLocaleDateString();
  }

  onRated(reservation: Reservation, item: any, value: number) {
    const reservationId = (reservation as any)._id || (reservation as any).id;
    const productId =
      item.productId ||
      (item.product && ((item.product as any)._id || (item.product as any).id));

    const userId =
      this.user?._id ?? (this.user as any)?.id;

    console.log('%c[Profile] onRated() RAW', 'color:#eab308', {
      reservationId,
      productId,
      userId,
      value,
      rawItem: item,
    });

    if (!reservationId || !productId || !userId) {
      console.warn('[Profile] faltan ids para votar', {
        reservationId,
        productId,
        userId,
      });
      alert('No se pudo identificar producto / reserva / usuario para votar.');
      return;
    }

    const safeValue = Math.min(5, Math.max(1, Math.round(Number(value) || 0)));

    console.log('%c[Profile] onRated() SAFE', 'color:#facc15', { safeValue });

    this.ratingSvc
      .rate({
        product: String(productId),
        reservation: String(reservationId),
        value: safeValue,
      })
      .subscribe({
        next: (res) => {
          console.log('%c[Profile] rating guardado OK', 'color:#22c55e', res);
          (item as any).myRating = safeValue;
          (item as any).rating = safeValue;
        },
        error: (err) => {
          console.error('%c[Profile] error guardando rating', 'color:#ef4444', err);
          alert(err?.error?.message || 'No se pudo guardar tu puntuación');
        },
      });
  }

  getRating(it: any): number {
    const rating = (it as any)?.myRating ?? (it as any)?.rating ?? 0;
    return rating;
  }

  getReservationStatus(r: Reservation): string {
    const raw = (r as any).status ?? '';
    return raw.toString().toUpperCase();
  }

  canShowRating(r: Reservation): boolean {
    const status = this.getReservationStatus(r);
    return status === 'CONFIRMED' || status === 'COMPLETED';
  }

  canRate(r: Reservation, it: any): boolean {
    if (!this.canShowRating(r)) return false;

    const currentRating =
      (it as any).myRating ?? (it as any).rating ?? 0;
    const alreadyRated = !!currentRating && currentRating > 0;
    return !alreadyRated;
  }
}
