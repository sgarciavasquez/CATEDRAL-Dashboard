import { TestBed } from '@angular/core/testing';
import { CartService } from './cart';
import { Product } from '../../components/products card/models/product';


describe('CartService', () => {
  let service: CartService;

  const productMock: Product = {
    id: 't1',
    name: 'Test Perfume',
    price: 10000,
    imageUrl: 'assets/p1.png',
    stock: 10,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartService);
    service.clear(); // dejar limpio antes de cada test
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add an item and compute total', () => {
    service.add(productMock, 1);
    expect(service.total()).toBe(10000);
  });

  it('should increase and decrease qty', () => {
    service.add(productMock, 1);
    service.add(productMock, 1);
    expect(service.total()).toBe(20000);

    service.add(productMock, -1);
    expect(service.total()).toBe(10000);
  });
});
