import { 
  Coffee, IceCream, Pizza, Bone, Soup, CookingPot, ChefHat, Milk, CupSoda,
  Cake, Candy, Carrot, Cherry, Citrus, Cookie, Croissant, Donut, Drumstick, Egg,
  Fish, GlassWater, Grape, Ham, Lollipop, Popcorn, Salad, Sandwich, Wine, Sprout,
  Beer, Package, Apple, Banana, Bean, Beef, Flame, Leaf, LeafyGreen,
  Nut, Wheat, Zap, UtensilsCrossed, Utensils, Shrimp, Shell, Martini, List, Grid, Layers, Box, Store
} from 'lucide-react';

interface ProductIconProps {
  productName: string;
  categoryName?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const ProductIcon: React.FC<ProductIconProps> = ({ 
  productName, 
  categoryName = '', 
  size = 20, 
  className = '', 
  style = {} 
}) => {
  const pName = productName.toLowerCase();
  const catName = categoryName.toLowerCase();
  const combined = `${catName} ${pName}`.trim();
  
  const iconProps = { size, className, style };

  // 1. Master Mapping Logic (Exhaustive)
  
  // Drinks
  if (combined.includes('coffee') || combined.includes('latte') || combined.includes('cappuccino') || combined.includes('espresso') || combined.includes('mocha') || combined.includes('cold coffee')) return <Coffee {...iconProps} />;
  if (combined.includes('tea') || combined.includes('chai') || combined.includes('green tea') || combined.includes('black tea')) return <Coffee {...iconProps} />;
  if (combined.includes('beer') || combined.includes('pint') || combined.includes('bottle') || combined.includes('lager') || combined.includes('ale') || combined.includes('draught')) return <Beer {...iconProps} />;
  if (combined.includes('wine') || combined.includes('red wine') || combined.includes('white wine') || combined.includes('sparkling')) return <Wine {...iconProps} />;
  if (combined.includes('cocktail') || combined.includes('mocktail') || combined.includes('mojito') || combined.includes('margarita') || combined.includes('martini')) return <Martini {...iconProps} />;
  if (combined.includes('shake') || combined.includes('smoothie') || combined.includes('frappe') || combined.includes('milk') || combined.includes('lassi')) return <Milk {...iconProps} />;
  if (combined.includes('juice') || combined.includes('orange') || combined.includes('apple') || combined.includes('mango') || combined.includes('pineapple')) return <CupSoda {...iconProps} />;
  if (combined.includes('soda') || combined.includes('pepsi') || combined.includes('coke') || combined.includes('sprite') || combined.includes('thumbs up') || combined.includes('cold drink')) return <CupSoda {...iconProps} />;
  if (combined.includes('water') || combined.includes('mineral') || combined.includes('sparkling water') || combined.includes('tonic')) return <GlassWater {...iconProps} />;
  if (combined.includes('energy') || combined.includes('red bull') || combined.includes('monster')) return <Zap {...iconProps} />;
  if (combined.includes('whiskey') || combined.includes('rum') || combined.includes('vodka') || combined.includes('gin') || combined.includes('tequila') || combined.includes('shot')) return <GlassWater {...iconProps} />;

  // Main Course
  if (combined.includes('pizza') || combined.includes('margherita') || combined.includes('pepperoni')) return <Pizza {...iconProps} />;
  if (combined.includes('burger') || combined.includes('cheeseburger') || combined.includes('whopper')) return <Sandwich {...iconProps} />;
  if (combined.includes('sandwich') || combined.includes('club') || combined.includes('toast') || combined.includes('sub')) return <Sandwich {...iconProps} />;
  if (combined.includes('chicken') || combined.includes('leg') || combined.includes('fry') || combined.includes('drumstick') || combined.includes('wings') || combined.includes('lollipop')) return <Drumstick {...iconProps} />;
  if (combined.includes('fish') || combined.includes('seafood') || combined.includes('prawn') || combined.includes('shrimp') || combined.includes('crab') || combined.includes('lobster')) return <Fish {...iconProps} />;
  if (combined.includes('shrimp') || combined.includes('prawn')) return <Shrimp {...iconProps} />;
  if (combined.includes('shell') || combined.includes('oyster') || combined.includes('mussel')) return <Shell {...iconProps} />;
  if (combined.includes('steak') || combined.includes('beef') || combined.includes('mutton') || combined.includes('lamb') || combined.includes('pork') || combined.includes('ham') || combined.includes('meat') || combined.includes('bacon')) return <Ham {...iconProps} />;
  if (combined.includes('spaghetti') || combined.includes('pasta') || combined.includes('noodle') || combined.includes('maggi') || combined.includes('chowmein')) return <Soup {...iconProps} />;
  if (combined.includes('soup') || combined.includes('stew') || combined.includes('broth') || combined.includes('shorba')) return <Soup {...iconProps} />;
  if (combined.includes('biryani') || combined.includes('pulao') || combined.includes('rice') || combined.includes('fried rice')) return <CookingPot {...iconProps} />;
  if (combined.includes('curry') || combined.includes('dal') || combined.includes('paneer') || combined.includes('sabzi') || combined.includes('gravy')) return <CookingPot {...iconProps} />;
  if (combined.includes('roti') || combined.includes('naan') || combined.includes('paratha') || combined.includes('bread') || combined.includes('kulcha')) return <Wheat {...iconProps} />;
  if (combined.includes('egg') || combined.includes('omelette') || combined.includes('boiled')) return <Egg {...iconProps} />;
  if (combined.includes('kebab') || combined.includes('tikka') || combined.includes('tandoori') || combined.includes('grill')) return <Flame {...iconProps} />;

  // Desserts
  if (combined.includes('ice cream') || combined.includes('kulfi') || combined.includes('sundae') || combined.includes('gelato')) return <IceCream {...iconProps} />;
  if (combined.includes('cake') || combined.includes('pastry') || combined.includes('brownie') || combined.includes('muffin') || combined.includes('cheesecake')) return <Cake {...iconProps} />;
  if (combined.includes('donut') || combined.includes('doughnut')) return <Donut {...iconProps} />;
  if (combined.includes('cookie') || combined.includes('biscuit') || combined.includes('wafer')) return <Cookie {...iconProps} />;
  if (combined.includes('candy') || combined.includes('chocolate') || combined.includes('sweet') || combined.includes('mithai') || combined.includes('gulab jamun')) return <Candy {...iconProps} />;
  if (combined.includes('croissant') || combined.includes('patties') || combined.includes('puff')) return <Croissant {...iconProps} />;
  if (combined.includes('lollipop')) return <Lollipop {...iconProps} />;
  if (combined.includes('waffle') || combined.includes('pancake')) return <Layers {...iconProps} />;

  // Healthy & Snacks
  if (combined.includes('salad') || combined.includes('healthy') || combined.includes('bowl')) return <Salad {...iconProps} />;
  if (combined.includes('veg') || combined.includes('vegan') || combined.includes('green') || combined.includes('leaf')) return <LeafyGreen {...iconProps} />;
  if (combined.includes('sprout') || combined.includes('healthy')) return <Sprout {...iconProps} />;
  if (combined.includes('fruit') || combined.includes('platter')) return <Apple {...iconProps} />;
  if (combined.includes('apple')) return <Apple {...iconProps} />;
  if (combined.includes('banana')) return <Banana {...iconProps} />;
  if (combined.includes('cherry') || combined.includes('strawberry') || combined.includes('berry')) return <Cherry {...iconProps} />;
  if (combined.includes('citrus') || combined.includes('lemon') || combined.includes('lime')) return <Citrus {...iconProps} />;
  if (combined.includes('grape')) return <Grape {...iconProps} />;
  if (combined.includes('carrot') || combined.includes('vegetable')) return <Carrot {...iconProps} />;
  if (combined.includes('mushroom')) return <LeafyGreen {...iconProps} />;
  if (combined.includes('nut') || combined.includes('cashew') || combined.includes('almond') || combined.includes('peanut')) return <Nut {...iconProps} />;
  if (combined.includes('popcorn') || combined.includes('chips') || combined.includes('nachos') || combined.includes('snacks') || combined.includes('fries') || combined.includes('nuggets')) return <Popcorn {...iconProps} />;

  // Fallback Logic: Deterministic Geometric Vector Avatar
  // This creates a "unique" vector feel for every product by combining 
  // its first letter with a shape determined by its name's length/hash.
  
  const firstLetter = productName.charAt(0).toUpperCase();
  const hash = productName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const shapeType = hash % 4; // 0: Circle, 1: Square, 2: Hexagon, 3: Shield
  
  return (
    <div 
      className={`flex items-center justify-center relative ${className}`}
      style={{ 
        width: size * 1.5, 
        height: size * 1.5, 
        backgroundColor: `${style.color || '#f97316'}15`,
        borderRadius: shapeType === 0 ? '50%' : shapeType === 1 ? '25%' : '15%',
        border: `1px solid ${style.color || '#f97316'}30`,
        ...style 
      }}
    >
      <span 
        style={{ 
          fontSize: size * 0.8, 
          fontWeight: 900, 
          color: style.color || '#f97316',
          opacity: 0.8
        }}
      >
        {firstLetter}
      </span>
      {/* Decorative vector elements to make it look like an illustration */}
      <div className="absolute inset-0.5 border border-dashed border-current opacity-10 rounded-[inherit]" />
      <ChefHat 
        size={size * 0.4} 
        className="absolute -top-1 -right-1 opacity-20 rotate-12" 
        style={{ color: style.color }}
      />
    </div>
  );
};
