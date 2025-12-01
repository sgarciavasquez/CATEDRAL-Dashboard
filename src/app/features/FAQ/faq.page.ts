import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/components/header/header';
import { FooterComponent } from '../../shared/components/footer/footer';


interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './faq.page.html',
})
export class FaqPage {
  faqs: FaqItem[] = [
    {
      question: '¿Cómo funciona el sistema de reservas de perfumes?',
      answer:
        'Agregas los perfumes que te interesan al carrito y confirmas la reserva. Nuestro equipo revisa el stock, prepara tu pedido y te contacta por WhatsApp o por el chat interno para coordinar entrega o retiro. Aún no realizas ningún pago al reservar.',
    },
    {
      question: '¿Cuándo pago mi pedido?',
      answer:
        'El pago se realiza una vez que confirmamos tu reserva y el stock disponible. Te enviaremos los datos de pago (transferencia) o los detalles si coordinamos retiro en tienda.',
    },
    {
      question: '¿Hacen envíos? ¿A qué comunas?',
      answer:
        'Realizamos envíos a distintas comunas de Santiago. El costo y la disponibilidad del despacho se coordinan directamente luego de tu reserva, dependiendo de tu dirección y la cantidad de productos.',
    },
    {
      question: '¿Puedo retirar mi pedido en tienda?',
      answer:
        'Sí. Si prefieres, podemos coordinar un punto de retiro. Luego de tu reserva, te contactaremos para ofrecerte las opciones disponibles.',
    },
    {
      question: '¿Los perfumes son originales?',
      answer:
        'No, trabajamos sólo con perfumes alternativos. Nos preocupamos de que cada producto cumpla con los estándares de calidad que esperas para tener una experiencia similar a la original.',
    },
    {
      question: '¿Puedo modificar o cancelar una reserva?',
      answer:
        'Si todavía no ha sido confirmada, puedes escribirnos por el chat o WhatsApp para ajustar tu pedido o cancelar la reserva sin problema.',
    },
    {
      question: '¿Necesito crear una cuenta para comprar?',
      answer:
        'Puedes reservar como invitado, pero si creas una cuenta podrás ver tu historial de reservas, seguir el estado de tus pedidos y comunicarte más fácilmente con nosotros.',
    },
    {
      question: '¿Qué hago si tengo un problema con mi pedido?',
      answer:
        'Puedes escribirnos por el chat dentro de la plataforma o por nuestros canales de contacto. Tenemos un flujo de postventa para ayudarte a resolver cualquier inconveniente.',
    },
    {
      question: '¿Tienen testers o muestras?',
      answer:
        'Ocasionalmente contamos con testers o promociones especiales. Te avisaremos en redes sociales o dentro de la misma plataforma cuando haya campañas activas.',
    },
  ];
}
