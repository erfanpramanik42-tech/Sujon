const fs = require('fs');
let content = fs.readFileSync('App.tmp.tsx', 'utf-8');

const savePatterns = [
  { name: 'shops', key: 'fieldpro_shops' },
  { name: 'places', key: 'fieldpro_places' },
  { name: 'areas', key: 'fieldpro_areas' },
  { name: 'routes', key: 'fieldpro_routes' },
  { name: 'visits', key: 'fieldpro_visits' },
  { name: 'products', key: 'fieldpro_products' },
  { name: 'orders', key: 'fieldpro_orders' },
  { name: 'competitorTracks', key: 'fieldpro_competitor_tracks' },
  { name: 'dealers', key: 'fieldpro_dealers' },
  { name: 'payments', key: 'fieldpro_payments' },
  { name: 'expenses', key: 'fieldpro_expenses' },
  { name: 'targets', key: 'fieldpro_targets' }
];

for (const p of savePatterns) {
  const regex = new RegExp(`useEffect\\(\\(\\) => \\{[^]*?localStorage.setItem\\('${p.key}'[^]*?\\}, \\[\${p.name}\\]\\);`, 'gm');
  content = content.replace(regex, `useEffect(() => {
    const save = async () => {
      try {
        await db.${p.name}.clear();
        if (${p.name} && ${p.name}.length > 0) {
          await db.${p.name}.bulkPut(${p.name});
        }
      } catch (e) { console.error('Failed to save ${p.name} to IndexedDB', e); }
    };
    save();
  }, [${p.name}]);`);
  
  // also find the bulk localStorage clear at the end and replace it
  content = content.replace(new RegExp(`\\s*localStorage.setItem\\('${p.key}'[^;]*;`, 'g'), '');
}

// Add load logic
const loadLogicItems = savePatterns.map(p => {
  const cap = p.name.charAt(0).toUpperCase() + p.name.slice(1);
  return `        const _${p.name} = await db.${p.name}.toArray();
        if (_${p.name}.length > 0) {
          set${cap}(_${p.name});
        } else {
          const saved = localStorage.getItem('${p.key}');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed) && parsed.length > 0) {
                set${cap}(parsed);
                await db.${p.name}.bulkPut(parsed);
              }
            } catch(e) {}
          }
        }`;
}).join('\n');

const loadLogic = `
  useEffect(() => {
    const loadDb = async () => {
      try {
${loadLogicItems}
      } catch (e) {
        console.error('Error loading dexie db:', e);
      }
    };
    loadDb();
  }, []);
`;

content = content.replace(/const \[shops, setShops\] = useState\(INITIAL_SHOPS\);/, loadLogic + '\n  const [shops, setShops] = useState<Shop[]>(INITIAL_SHOPS);');

// fix typing for the other useState
const typesMap = {
  places: 'Place[]',
  areas: 'Area[]',
  routes: 'SalesRoute[]',
  visits: 'Visit[]',
  products: 'Product[]',
  orders: 'Order[]',
  competitorTracks: 'CompetitorTrack[]',
  dealers: 'Dealer[]',
  payments: 'Payment[]',
  expenses: 'Expense[]',
  targets: 'Target[]'
};

for (const [k, v] of Object.entries(typesMap)) {
  const cap = k.charAt(0).toUpperCase() + k.slice(1);
  content = content.replace(new RegExp(`const \\\[${k}, set${cap}\\\] = useState\\((.*?)\\);`), `const [${k}, set${cap}] = useState<${v}>($1);`);
}

// Ensure db is imported
if(!content.includes('import { db }')) {
  content = content.replace("import { DashboardView }", "import { db } from './services/DatabaseService';\nimport { DashboardView }");
}

fs.writeFileSync('App.tsx', content);
console.log('App.tsx Patched successfully!');
