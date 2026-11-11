/* Katalog produk Resique (subset demo dari crm-apique RESIQUE_PRODUCTS, data.jsx:482+).
   Staging: a Golden Sale item is created from a catalog Product ("Tambah item dari katalog"), and its
   code / name / category / unit / list price stay locked to the product. This list plays that role in
   the prototype: the 12 promo lines plus the equipment that the Paket Usaha bundles mention. Prices
   for the equipment rows are demo figures (🟠). */
export interface CatalogProduct { code: string; name: string; cat: string; unit: string; price: number }

export const CATALOG: CatalogProduct[] = [
  { code: '000004', name: 'Duta Deterjen 5L',                          cat: 'Perlengkapan Pakaian', unit: 'L',      price: 70_000 },
  { code: '000031', name: 'Molto Parfum Laundry Purple Delight 5L',    cat: 'Perlengkapan Pakaian', unit: 'L',      price: 165_000 },
  { code: '000122', name: 'So Klin Detergent Matic Professional 5L',   cat: 'Perlengkapan Pakaian', unit: 'L',      price: 68_000 },
  { code: '000148', name: 'Whiff Fresh Parfum Finishing Elegant 5L',   cat: 'Perlengkapan Pakaian', unit: 'L',      price: 255_000 },
  { code: '000244', name: 'Greendome Parfum Downy Black 5L',           cat: 'Perlengkapan Pakaian', unit: 'L',      price: 210_000 },
  { code: '000305', name: 'Rinso Matic Profesional 1.65L',             cat: 'Perlengkapan Pakaian', unit: 'L',      price: 28_500 },
  { code: '000553', name: 'Xtra Bersih Detergent Cair 5L',             cat: 'Perlengkapan Pakaian', unit: 'L',      price: 80_000 },
  { code: '000324', name: 'Deterjen 5L',                               cat: 'Perlengkapan Pakaian', unit: 'L',      price: 65_000 },
  { code: '000657', name: 'Softener 5L',                               cat: 'Perlengkapan Pakaian', unit: 'L',      price: 72_000 },
  { code: '000202', name: 'BARA Premium Apparel Cleaner 250ML',        cat: 'Shoes',                unit: 'pcs',    price: 125_000 },
  { code: '000401', name: 'KAME Natural Shoes & Apparel Cleaner 250ML', cat: 'Shoes',               unit: 'pcs',    price: 99_000 },
  { code: '000226', name: 'Glad Cleaner & Conditioner 1000ML',         cat: 'Shoes',                unit: 'pcs',    price: 140_000 },
  { code: '000448', name: 'KAME Paket Sepatu',                         cat: 'Shoes',                unit: 'set',    price: 750_000 },
  { code: '000216', name: 'Daijin Timbangan Digital 30KG',             cat: 'HouseHold',            unit: 'pcs',    price: 470_000 },
  { code: '000480', name: 'Gelas Takar 100ML',                         cat: 'HouseHold',            unit: 'pcs',    price: 12_000 },
  { code: '000147', name: 'Botol Spray 250ML',                         cat: 'HouseHold',            unit: 'pcs',    price: 9_500 },
  { code: '000558', name: 'Keranjang Pakaian',                         cat: 'HouseHold',            unit: 'pcs',    price: 45_000 },
  { code: '000153', name: 'Plastik HD 50',                             cat: 'Packaging',            unit: 'pack',   price: 38_000 },
  { code: '000154', name: 'Plastik HD 45',                             cat: 'Packaging',            unit: 'pack',   price: 34_000 },
  { code: '000256', name: 'Isolasi',                                   cat: 'Packaging',            unit: 'pcs',    price: 6_000 },
  { code: '000486', name: 'Meja Setrika',                              cat: 'Equipment',            unit: 'pcs',    price: 650_000 },
  { code: '000380', name: 'Kepala Setrika',                            cat: 'Equipment',            unit: 'pcs',    price: 1_250_000 },
  { code: '000562', name: 'Kenzo Boiler Semi Otomatis Kap 20KG',       cat: 'Machine',              unit: 'unit',   price: 4_800_000 },
  { code: '000158', name: 'Beko Dryer Konversi DV80',                  cat: 'Machine',              unit: 'unit',   price: 5_900_000 },
  { code: '000716', name: 'LG Washer Home 20KG',                       cat: 'Machine',              unit: 'unit',   price: 14_500_000 },
  { code: '000327', name: 'LG Dryer Giant Max',                        cat: 'Machine',              unit: 'unit',   price: 12_800_000 },
]

export const CATALOG_CATEGORIES = [...new Set(CATALOG.map(p => p.cat))]
export const CATALOG_UNITS = [...new Set(CATALOG.map(p => p.unit))]
export const catalogByCode = (code: string) => CATALOG.find(p => p.code === code)
