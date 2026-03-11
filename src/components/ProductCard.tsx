
import { FC } from 'react';
import { motion } from 'motion/react';
import { Product } from '../data';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
}

const ProductCard: FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="group relative flex flex-col"
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100 mb-4">
        <img
          src={product.image}
          alt={product.title}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button 
            onClick={() => addToCart(product)}
            className="w-full bg-white text-[#233267] font-medium py-3 px-4 rounded-full shadow-lg flex items-center justify-center gap-2 hover:bg-[#233267] hover:text-white transition-colors cursor-pointer"
          >
            <ShoppingCart size={16} />
            Add to Cart
          </button>
        </div>
        {/* Badges could go here */}
      </div>
      <div className="flex flex-col flex-1">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[2.5em]">
          <a href={product.url}>
            <span aria-hidden="true" className="absolute inset-0" />
            {product.title}
          </a>
        </h3>
        <div className="mt-1 flex items-center justify-between">
          <p className="text-sm font-semibold text-[#233267]">
            ₹{product.price.toLocaleString('en-IN')}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
