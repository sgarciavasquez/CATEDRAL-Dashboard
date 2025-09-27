import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductCardComponent } from './product-card';
import { CartService } from '../../services/cartservice/cart'; 

describe('ProductCard', () => {
  let component: ProductCardComponent;
  let fixture: ComponentFixture<ProductCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCardComponent],   
      providers: [CartService],           
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
