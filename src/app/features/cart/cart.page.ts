// cart.page.ts
import { Component, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import { HeaderComponent } from '../../shared/components/header/header';
import { FooterComponent } from '../../shared/components/footer/footer';
import { CartItem, CartService } from '../../shared/services/cartservice/cart';
import { ReservationService, CreateReservationPayload, CreateGuestReservationPayload,} from '../../shared/services/user/reservation.service';
import { UserService } from '../../shared/services/user/user.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { GuestReserveDialogComponent, GuestReserveData,} from '../cart/guest-reserve.dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    DecimalPipe,
    FooterComponent,
    MatDialogModule,
    MatSnackBarModule,
  ],
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.css'],
})
export class CartPage {
  private cart = inject(CartService);
  private reservations = inject(ReservationService);
  private userService = inject(UserService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  items$ = this.cart.items$;

  inc(it: CartItem) { this.cart.add(it.product, 1); }
  dec(it: CartItem) { this.cart.add(it.product, -1); }
  remove(it: CartItem) { this.cart.remove(it.product.id); }
  clear() { this.cart.clear(); }
  total() { return this.cart.total(); }

  // Popup lindo reutilizable
  private showSnack(message: string) {
    this.snack.open(message, 'Entendido', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['snack-error'],
    });
  }

  // ========== CONFIRMAR RESERVA ==========
  async reserve() {
    // 1) Tomar snapshot del carrito
    const items = await firstValueFrom(this.items$.pipe(take(1)));

    if (!items || !items.length) {
      this.showSnack('Tu carrito está vacío.');
      return;
    }

    // 2) Validar stock antes de seguir
    const invalid = items.find((it) => {
      const qty = Number((it as any).quantity ?? (it as any).qty ?? 1);
      const stock = Number((it.product as any).inStock ?? 0);
      return stock <= 0 || qty > stock;
    });

    if (invalid) {
      const qty = Number((invalid as any).quantity ?? (invalid as any).qty ?? 1);
      const stock = Number((invalid.product as any).inStock ?? 0);
      const name = String((invalid.product as any).name ?? 'este producto');

      let msg = '';

      if (stock <= 0) {
        msg = `“${name}” no tiene stock disponible en este momento.`;
      } else {
        msg = `Solo hay ${stock} unidad(es) disponibles de “${name}”. Ajusta la cantidad (tienes ${qty}) para continuar.`;
      }

      this.showSnack(msg);
      return;
    }

    // 3) Mapear a detalle de reserva
    const reservationDetail = items.map((it) => {
      const qty = Number((it as any).quantity ?? (it as any).qty ?? 1);
      const price = Number((it.product as any).price ?? 0);
      return {
        product: String((it.product as any).id),
        quantity: qty,
        subtotal: price * qty, // el back recalcula, pero da lo mismo
      };
    });

    // 4) Intentar obtener usuario logeado usando /auth/me
    let userId: string | null = null;
    try {
      const me = await firstValueFrom(this.userService.me());
      userId = me?._id ?? (me as any)?.id ?? null;
    } catch (e: any) {
      if (e?.status !== 401) {
        console.error('[CartPage] error llamando /auth/me', e);
      }
    }

    if (userId) {
      // ===== FLUJO NORMAL (USUARIO LOGEADO) =====
      const payload: CreateReservationPayload = {
        user: userId,
        reservationDetail: reservationDetail.map(d => ({
          product: d.product,
          quantity: d.quantity,
        })),
      };

      this.reservations.create(payload).subscribe({
        next: (res) => {
          console.log('[CartPage] reserva creada (user):', res);
          this.cart.clear();
          this.router.navigate(['/perfil']);
        },
        error: (err) => {
          console.error('[CartPage] error create', err);
          this.showSnack(err?.error?.message ?? 'No se pudo crear la reserva');
        },
      });

      return;
    }

    // ===== FLUJO INVITADO =====
    const ref = this.dialog.open<GuestReserveDialogComponent, void, GuestReserveData>(
      GuestReserveDialogComponent,
      { width: '420px', autoFocus: true, restoreFocus: true }
    );

    const data = await firstValueFrom(ref.afterClosed());
    if (!data) {
      console.log('[CartPage] invitado canceló el diálogo');
      return;
    }

    const guestPayload: CreateGuestReservationPayload = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      reservationDetail: reservationDetail.map(d => ({
        product: d.product,
        quantity: d.quantity,
      })),
    };

    this.reservations.createGuestReservation(guestPayload).subscribe({
      next: (res) => {
        console.log('[CartPage] reserva creada (guest):', res);
        this.cart.clear();
        this.showSnack(`Gracias ${data.name}. Te contactaremos al correo ${data.email}.`);
      },
      error: (err) => {
        console.error('[CartPage] error createGuest', err);
        this.showSnack(err?.error?.message ?? 'No se pudo crear la reserva como invitado');
      },
    });
  }
}
