import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, PLATFORM_ID } from '@angular/core';

type Slide = { src: string; alt: string };

@Component({
  selector: 'app-hero-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero-carousel.html',
})
export class HeroCarouselComponent implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);

  slides: Slide[] = [
    { src: 'assets/carrito-1.jpg', alt: 'Catedral Perfumes banner 1' },
    { src: 'assets/carrito-2.jpg', alt: 'Catedral Perfumes banner 2' },
  ];

  current = 0;
  intervalMs = 5000; // 5s
  private timer: any;
  isHover = false;

  ngOnInit(): void {
    // ✅ Solo en navegador (evita colgar SSR)
    if (isPlatformBrowser(this.platformId)) {
      this.start();
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.stop();
    }
  }

  private start() {
    this.stop();
    this.timer = setInterval(() => {
      if (!this.isHover) this.next();
    }, this.intervalMs);
  }

  private stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  next() {
    this.current = (this.current + 1) % this.slides.length;
  }

  prev() {
    this.current = (this.current - 1 + this.slides.length) % this.slides.length;
  }

  goTo(index: number) {
    this.current = index;
  }

  onMouse(hover: boolean) {
    this.isHover = hover;
  }
}
