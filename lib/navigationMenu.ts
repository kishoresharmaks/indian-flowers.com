export interface NavigationSubItem {
  title: string;
  href: string;
  categoryFilter: string;
}

export interface NavigationMenuItem {
  title: string;
  href: string;
  categoryFilter?: string;
  badge?: string;
  subItems?: NavigationSubItem[];
}

export const THE_INDIAN_FLOWERS_MENU: NavigationMenuItem[] = [
  {
    title: 'Home',
    href: '/',
  },
  {
    title: 'About us',
    href: '/about',
  },
  {
    title: 'Shop',
    href: '/#products-section',
    categoryFilter: 'All',
  },
  {
    title: 'Strings & Leaves',
    href: '/#products-section',
    categoryFilter: 'Fresh Flower Strings & Jasmine',
    subItems: [
      {
        title: 'Strings / Jasmine Strings',
        href: '/#products-section',
        categoryFilter: 'Fresh Flower Strings & Jasmine',
      },
      {
        title: 'Pooja Leaves',
        href: '/#products-section',
        categoryFilter: 'Sacred Pooja Leaves & Greenery',
      },
      {
        title: 'Pooja Flowers',
        href: '/#products-section',
        categoryFilter: 'Loose Flowers for Daily Pooja',
      },
      {
        title: 'Banana Leaves',
        href: '/#products-section',
        categoryFilter: 'Sacred Pooja Leaves & Greenery',
      },
      {
        title: 'Coconut',
        href: '/#products-section',
        categoryFilter: 'Sacred Pooja Leaves & Greenery',
      },
      {
        title: 'Decor Items',
        href: '/#products-section',
        categoryFilter: 'Loose Flowers for Daily Pooja',
      },
    ],
  },
  {
    title: 'Wedding Garlands',
    href: '/#products-section',
    categoryFilter: 'Wedding & Temple Garlands',
    subItems: [
      {
        title: 'Wedding Garlands',
        href: '/#products-section',
        categoryFilter: 'Wedding & Temple Garlands',
      },
      {
        title: 'Rose Petal Garlands',
        href: '/#products-section',
        categoryFilter: 'Wedding & Temple Garlands',
      },
      {
        title: 'Button Rose Garlands',
        href: '/#products-section',
        categoryFilter: 'Wedding & Temple Garlands',
      },
      {
        title: 'Lilly Garlands',
        href: '/#products-section',
        categoryFilter: 'Wedding & Temple Garlands',
      },
      {
        title: 'Carnation Garlands',
        href: '/#products-section',
        categoryFilter: 'Wedding & Temple Garlands',
      },
      {
        title: 'Exchange Garlands',
        href: '/#products-section',
        categoryFilter: 'Wedding & Temple Garlands',
      },
      {
        title: 'North Indian Garlands',
        href: '/#products-section',
        categoryFilter: 'Wedding & Temple Garlands',
      },
      {
        title: 'Veni, Jadai',
        href: '/#products-section',
        categoryFilter: 'Wedding & Temple Garlands',
      },
    ],
  },
  {
    title: 'House Warming Garlands',
    href: '/#products-section',
    categoryFilter: 'Wedding & Temple Garlands',
    subItems: [
      {
        title: 'Button Rose Door Garlands',
        href: '/#products-section',
        categoryFilter: 'Wedding & Temple Garlands',
      },
      {
        title: 'Coconut Thoranam',
        href: '/#products-section',
        categoryFilter: 'Sacred Pooja Leaves & Greenery',
      },
      {
        title: 'Mango Leaves Thoranam',
        href: '/#products-section',
        categoryFilter: 'Sacred Pooja Leaves & Greenery',
      },
      {
        title: 'Button Rose String',
        href: '/#products-section',
        categoryFilter: 'Fresh Flower Strings & Jasmine',
      },
    ],
  },
  {
    title: 'Temple Garlands',
    href: '/#products-section',
    categoryFilter: 'Wedding & Temple Garlands',
    subItems: [
      {
        title: 'Temple and Pooja Garlands',
        href: '/#products-section',
        categoryFilter: 'Wedding & Temple Garlands',
      },
      {
        title: 'Button Rose Pooja Garlands',
        href: '/#products-section',
        categoryFilter: 'Wedding & Temple Garlands',
      },
      {
        title: 'Lilly Garlands',
        href: '/#products-section',
        categoryFilter: 'Wedding & Temple Garlands',
      },
      {
        title: 'Vadamalli Garlands',
        href: '/#products-section',
        categoryFilter: 'Wedding & Temple Garlands',
      },
      {
        title: 'Vilvam Garlands',
        href: '/#products-section',
        categoryFilter: 'Sacred Pooja Leaves & Greenery',
      },
      {
        title: 'Green Leaves Garlands',
        href: '/#products-section',
        categoryFilter: 'Wedding & Temple Garlands',
      },
    ],
  },
  {
    title: 'Blog',
    href: '/about',
  },
  {
    title: 'Contact us',
    href: '/#contact',
  },
];
