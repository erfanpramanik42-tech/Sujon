import { Area, Translations, Shop, SalesRoute } from './types';

export const INITIAL_AREAS: Area[] = [
  { id: '1', name: 'Kallyanpur', assignedDay: 'শনিবার' },
  { id: '2', name: 'Majgram', assignedDay: 'রবিবার' },
  { id: '3', name: 'Shilaidah', assignedDay: 'সোমবার' },
  { id: '4', name: 'Arpara', assignedDay: 'মঙ্গলবার' },
  { id: '5', name: 'Mirzapur', assignedDay: 'বুধবার' },
  { id: '6', name: 'Banani', assignedDay: 'বৃহস্পতিবার' },
  { id: '7', name: 'Gulshan', assignedDay: 'শুক্রবার' },
  { id: '8', name: 'Dhanmondi', assignedDay: 'শনিবার' },
  { id: '9', name: 'Uttara', assignedDay: 'রবিবার' },
  { id: '10', name: 'Mirpur', assignedDay: 'সোমবার' },
  { id: '11', name: 'Kumarkhali', assignedDay: 'মঙ্গলবার' },
  { id: '12', name: 'Kushtia', assignedDay: 'বুধবার' }
];

export const INITIAL_SHOPS: Shop[] = [
  {
    id: 's1',
    name: 'Bhai Bhai Enterprise',
    ownerName: 'Abul Hasnat',
    phone: '01711223344',
    subArea: 'Technical Junction',
    location: { lat: 23.7806, lng: 90.3521 }, // Kallyanpur Area
    areaId: '1',
    createdAt: Date.now()
  },
  {
    id: 's2',
    name: 'Janata Store',
    ownerName: 'Moklesur Rahman',
    phone: '01822334455',
    subArea: 'South Block',
    location: { lat: 23.7812, lng: 90.3535 }, // Kallyanpur Area
    areaId: '1',
    createdAt: Date.now()
  },
  {
    id: 's3',
    name: 'Mayer Doa General Store',
    ownerName: 'Sujon Ahmed',
    phone: '01933445566',
    subArea: 'Market Corner',
    location: { lat: 23.9482, lng: 89.1234 }, // Majgram Area
    areaId: '2',
    createdAt: Date.now()
  }
];

export const DEMO_ROUTES: SalesRoute[] = [
  {
    id: 'timeline-demo-kumarkhali',
    date: '23/05/2024',
    areaId: '11',
    startTime: Date.now() - 172800000,
    endTime: Date.now() - 172800000 + 3600000,
    path: [
      { lat: 23.8647, lng: 89.2467 }, // Start: Kumarkhali
      { lat: 23.8680, lng: 89.2300 },
      { lat: 23.8750, lng: 89.2100 },
      { lat: 23.8850, lng: 89.1800 },
      { lat: 23.8950, lng: 89.1500 },
      { lat: 23.9010, lng: 89.1204 }  // End: Kushtia
    ],
    stops: [
      { 
        location: { lat: 23.8647, lng: 89.2467 }, 
        areaName: 'Kumarkhali Bus Stand', 
        stopNumber: 1, 
        timestamp: Date.now() - 172800000 
      },
      { 
        location: { lat: 23.8850, lng: 89.1800 }, 
        areaName: 'Lalon Shah Bridge Point', 
        stopNumber: 2, 
        timestamp: Date.now() - 172800000 + 1500000 
      },
      { 
        location: { lat: 23.9010, lng: 89.1204 }, 
        areaName: 'Kushtia Town Center', 
        stopNumber: 3, 
        timestamp: Date.now() - 172800000 + 3600000 
      }
    ]
  }
];

export const TRANSLATIONS: Translations = {
  appTitle: { en: 'FieldPro Assistant', bn: 'ফিল্ডপ্রো অ্যাসিস্ট্যান্ট' },
  dashboard: { en: 'Dashboard', bn: 'ড্যাশবোর্ড' },
  map: { en: 'Map', bn: 'মানচিত্র' },
  shops: { en: 'Shops', bn: 'দোকানসমূহ' },
  history: { en: 'History', bn: 'ইতিহাস' },
  settings: { en: 'Settings', bn: 'সেটিংস' },
  addShop: { en: 'Add New Shop', bn: 'নতুন দোকান যোগ করুন' },
  editShop: { en: 'Edit Shop', bn: 'দোকান সম্পাদনা' },
  shopName: { en: 'Shop Name', bn: 'দোকানের নাম' },
  ownerName: { en: 'Owner Name', bn: 'মালিকের নাম' },
  mobile: { en: 'Mobile Number', bn: 'মোবাইল নম্বর' },
  area: { en: 'Area', bn: 'এলাকা' },
  subArea: { en: 'Sub Area', bn: 'সাব এরিয়া' },
  selectArea: { en: 'Select Area', bn: 'এলাকা নির্বাচন করুন' },
  photo: { en: 'Owner Photo', bn: 'মালিকের ছবি' },
  save: { en: 'Save', bn: 'সংরক্ষণ করুন' },
  cancel: { en: 'Cancel', bn: 'বাতিল করুন' },
  trackingOn: { en: 'Tracking Active', bn: 'ট্র্যাকিং চালু আছে' },
  trackingOff: { en: 'Start Tracking', bn: 'ট্র্যাকিং শুরু করুন' },
  nearbyAlert: { en: 'Nearby Shop Alert!', bn: 'কাছাকাছি দোকান!' },
  within100m: { en: 'is within 20 meters.', bn: '২০ মিটারের মধ্যে আছে।' },
  search: { en: 'Search shops or owners...', bn: 'দোকান বা মালিক খুঁজুন...' },
  noShops: { en: 'No shops found.', bn: 'কোনো দোকান পাওয়া যায়নি।' },
  routes: { en: 'Saved Routes', bn: 'সংরক্ষিত রুটসমূহ' },
  getDirections: { en: 'Get Directions', bn: 'রাস্তা দেখুন' },
  stopNavigation: { en: 'Stop Navigation', bn: 'ন্যাভিগেশন বন্ধ করুন' },
  distance: { en: 'Distance', bn: 'দূরত্ব' },
  turn_left: { en: 'Turn Left', bn: 'বামে মোড় নিন' },
  turn_right: { en: 'Turn Right', bn: 'ডানে মোড় নিন' },
  go_straight: { en: 'Go Straight', bn: 'সোজা যান' },
  slight_left: { en: 'Slight Left', bn: 'সামান্য বামে' },
  slight_right: { en: 'Slight Right', bn: 'সামান্য ডানে' },
  u_turn: { en: 'Make a U-Turn', bn: 'ইউ-টার্ন নিন' },
  arrived: { en: 'You have arrived!', bn: 'আপনি পৌঁছে গেছেন!' },
  nearbyShops: { en: 'Nearby Shops (20m)', bn: 'কাছাকাছি দোকানসমূহ (২০ মি.)' },
  noNearbyShops: { en: 'No shops within 20m.', bn: '২০ মিটারের মধ্যে কোনো দোকান নেই।' },
  spotRange: { en: 'Spot Detection Range', bn: 'স্পট শনাক্তকরণের রেঞ্জ' },
  rangeDescription: { en: 'Set how close you need to be to identify a shop.', bn: 'দোকান শনাক্ত করার জন্য আপনি কতটা কাছে থাকবেন তা নির্ধারণ করুন।' },
  meters: { en: 'meters', bn: 'মিটার' },
  visited: { en: 'Visited', bn: 'ভিজিট সম্পন্ন' },
  markVisited: { en: 'Mark Visit Complete', bn: 'ভিজিট সম্পন্ন করুন' },
  unmarkVisited: { en: 'Unmark as Visited', bn: 'ভিজিট বাতিল করুন' },
  quickAccess: { en: 'Quick Access', bn: 'কুইক অ্যাক্সেস' },
  productCatalog: { en: 'Product Catalog', bn: 'পণ্য তালিকা' },
  orderTaking: { en: 'Order System', bn: 'অর্ডার সিস্টেম' },
  dailySummary: { en: 'Daily Summary', bn: 'দৈনিক সারাংশ' },
  followUpReminder: { en: 'Reminders', bn: 'রিমাইন্ডার' },
  smartRoute: { en: 'Smart Route', bn: 'স্মার্ট রুট' },
  targetProgress: { en: 'Target Progress', bn: 'লক্ষ্য ও অগ্রগতি' },
  performance: { en: 'Performance', bn: 'পারফরম্যান্স' },
  analytics: { en: 'Reports', bn: 'রিপোর্ট' },
  dealerDistributor: { en: 'Dealer / Distributor', bn: 'ডিলার / ডিস্ট্রিবিউটর' },
  catalogSection: { en: 'Catalog & Inventory', bn: 'ক্যাটালগ ও ইনভেন্টরি' },
  productName: { en: 'Product Name', bn: 'পণ্যের নাম' },
  weightUnit: { en: 'Weight / Unit', bn: 'ওজন / ইউনিট' },
  price: { en: 'Price', bn: 'মূল্য' },
  addProduct: { en: 'Add Product', bn: 'পণ্য যোগ করুন' },
  editProduct: { en: 'Edit Product', bn: 'পণ্য সম্পাদনা' },
  deleteProduct: { en: 'Delete Product', bn: 'পণ্য মুছুন' },
  confirmDeleteProduct: { en: 'Delete this product from catalog?', bn: 'ক্যাটালগ থেকে এই পণ্যটি মুছতে চান?' }
};