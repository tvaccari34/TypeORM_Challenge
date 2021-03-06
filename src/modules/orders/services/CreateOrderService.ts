import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer does not exist.');
    }

    const productList = await this.productsRepository.findAllById(products);

    const quantityProductUpdate = products.map(product => {
      const productFound = productList.find(p => p.id === product.id);

      if (!productFound) {
        throw new AppError('Product not found.');
      }

      const totalQuantity = productFound.quantity - product.quantity;

      if (totalQuantity < 0) {
        throw new AppError('Exceed the quantity for this product.');
      }

      productFound.quantity = totalQuantity;

      return productFound;
    });

    const productsFormatted = products.map(product => {
      const productPrice = productList.find(p => p.id === product.id);

      if (!productPrice) {
        throw new AppError('Product not found.');
      }

      const productFormatted = {
        product_id: product.id,
        price: productPrice.price,
        quantity: product.quantity,
      };

      return productFormatted;
    });

    await this.productsRepository.updateQuantity(quantityProductUpdate);

    const order = await this.ordersRepository.create({
      customer,
      products: productsFormatted,
    });

    return order;
  }
}

export default CreateOrderService;
