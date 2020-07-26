import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({ name, price, quantity });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = this.ormRepository.findOne({ where: { name } });

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const ids = products.map(product => {
      const { id } = product;
      return id;
    });

    const productList = await this.ormRepository.find({
      where: { id: In(ids), },
    });

    return productList;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productList = await this.findAllById(products);

    const updateProducts = productList.map(product => {
      const tempProduct = new Product();

      Object.assign(tempProduct, product);

      const assignedProduct = products.find(p => p.id === product.id);
      const quantity = assignedProduct ? assignedProduct.quantity : 0;
      tempProduct.quantity = quantity;

      return tempProduct;
    });

    const savedProduct = await this.ormRepository.save(updateProducts);

    return savedProduct;
  }
}

export default ProductsRepository;
