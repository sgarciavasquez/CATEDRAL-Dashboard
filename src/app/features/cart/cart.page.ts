// cart.page.ts
import { Component, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import { HeaderComponent } from '../../shared/components/header/header';
import { FooterComponent } from '../../shared/components/footer/footer';
import { CartItem, CartService,} from '../../shared/services/cartservice/cart';
import { ReservationService, CreateReservationPayload, CreateGuestReservationPayload,} from '../../shared/services/user/reservation.service';
import { UserService } from '../../shared/services/user/user.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { GuestReserveDialogComponent, GuestReserveData,} from '../cart/guest-reserve.dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule, 
    MatButtonModule,         
    MatProgressSpinnerModule,   
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

  // Flag para bloquear el botón y evitar reservas duplicadas
  isSubmitting = false;

  inc(it: CartItem) {
    this.cart.add(it.product, 1);
  }

  dec(it: CartItem) {
    this.cart.add(it.product, -1);
  }

  remove(it: CartItem) {
    this.cart.remove(it.product.id);
  }

  clear() {
    this.cart.clear();
  }

  total() {
    return this.cart.total();
  }

  private showSnack(message: string) {
    this.snack.open(message, 'Entendido', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['snack-error'],
    });
  }

  async reserve() {
    // Si ya estoy enviando, no hago nada (evita doble clic)
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    try {
      const items = await firstValueFrom(this.items$.pipe(take(1)));

      if (!items || !items.length) {
        this.showSnack('Tu carrito está vacío.');
        return;
      }

      // Validación de stock antes de enviar al backend
      const invalid = items.find((it) => {
        const qty = Number((it as any).quantity ?? (it as any).qty ?? 1);
        const stock = Number((it.product as any).inStock ?? 0);
        return stock <= 0 || qty > stock;
      });

      if (invalid) {
        const qty = Number(
          (invalid as any).quantity ?? (invalid as any).qty ?? 1
        );
        const stock = Number((invalid.product as any).inStock ?? 0);
        const name = String(
          (invalid.product as any).name ?? 'este producto'
        );

        let msg = '';
        if (stock <= 0) {
          msg = `“${name}” no tiene stock disponible en este momento.`;
        } else {
          msg = `Solo hay ${stock} unidad(es) disponibles de “${name}”. Ajusta la cantidad (tienes ${qty}) para continuar.`;
        }
        this.showSnack(msg);
        return;
      }

      // Mapeo al detalle que espera el backend
      const reservationDetail = items.map((it) => {
        const qty = Number((it as any).quantity ?? (it as any).qty ?? 1);
        const price = Number((it.product as any).price ?? 0);
        return {
          product: String((it.product as any).id),
          quantity: qty,
          subtotal: price * qty, // el back recalcula igual, pero no molesta
        };
      });

      let userId: string | null = null;
      let userRole: 'admin' | 'customer' | undefined;

      // Intentar obtener usuario logeado
      try {
        const me = await firstValueFrom(this.userService.me());
        userId = me?._id ?? (me as any)?.id ?? null;
        userRole = (me as any)?.role;
      } catch (e: any) {
        if (e?.status !== 401) {
          console.error('[CartPage] error llamando /auth/me', e);
        }
      }

      // ===== USUARIO LOGEADO =====
      if (userId) {
        const payload: CreateReservationPayload = {
          user: userId,
          reservationDetail: reservationDetail.map((d) => ({
            product: d.product,
            quantity: d.quantity,
          })),
        };

        const res = await firstValueFrom(
          this.reservations.create(payload)
        );
        console.log('[CartPage] reserva creada (user):', res);

        // Id de la reserva (por si luego quieres usarla en la navegación)
        const reservationId =
          (res as any)?._id ?? (res as any)?.id ?? undefined;

        // 1) Vaciar carro
        this.cart.clear();

        // 2) Redirigir según rol
        if (userRole === 'admin') {
          // Admin → listado de pedidos
          await this.router.navigate(['/admin/pedidos'], {
            // si quieres, puedes usar esto para resaltar
            queryParams: reservationId
              ? { highlight: reservationId }
              : undefined,
          });
        } else {
          // Cliente → perfil (o historial de reservas, ajusta si quieres)
          await this.router.navigate(['/perfil']);
        }

        return;
      }

      // ===== INVITADO =====
      const ref = this.dialog.open<
        GuestReserveDialogComponent,
        void,
        GuestReserveData
      >(GuestReserveDialogComponent, {
        width: '420px',
        autoFocus: true,
        restoreFocus: true,
      });

      const data = await firstValueFrom(ref.afterClosed());
      if (!data) {
        console.log('[CartPage] invitado canceló el diálogo');
        return;
      }

      const guestPayload: CreateGuestReservationPayload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        reservationDetail: reservationDetail.map((d) => ({
          product: d.product,
          quantity: d.quantity,
        })),
      };

      const resGuest = await firstValueFrom(
        this.reservations.createGuestReservation(guestPayload)
      );
      console.log('[CartPage] reserva creada (guest):', resGuest);

      this.cart.clear();
      this.showSnack(
        `Gracias ${data.name}. Te contactaremos al correo ${data.email}.`
      );
    } catch (err: any) {
      console.error('[CartPage] error en reserve()', err);
      this.showSnack(
        err?.error?.message ?? 'No se pudo crear la reserva'
      );
    } finally {
      this.isSubmitting = false;
    }
  }
}
