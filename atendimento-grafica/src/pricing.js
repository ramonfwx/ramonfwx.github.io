// Cálculo de preços. Todos os valores em CENTAVOS (inteiros) para não ter erro de arredondamento.
// O cálculo roda sempre no servidor; a página de orçamento só mostra o que o servidor devolve.

export function brl(cents) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function parseJson(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

/** Converte a linha do banco em objeto pronto para uso (JSONs já abertos). */
export function hydrateProduct(row) {
  if (!row) return null;
  return {
    ...row,
    active: !!row.active,
    tiers: parseJson(row.tiers, []),
    variants: parseJson(row.variants, []),
    finishes: parseJson(row.finishes, []),
  };
}

export class PricingError extends Error {}

function positiveNumber(value, label, max) {
  const n = Number(String(value ?? '').replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) throw new PricingError(`${label}: informe um valor maior que zero.`);
  if (n > max) throw new PricingError(`${label}: valor acima do limite (${max}).`);
  return n;
}

const fmtNum = (n) => String(Math.round(n * 100) / 100).replace('.', ',');

/**
 * Calcula uma linha do pedido.
 * input: { qty, width_cm?, height_cm?, variant?, finishes?: string[] }
 * devolve: { description, detail, width_cm, height_cm, qty, unit_price, total }
 */
export function priceItem(product, input) {
  if (!product || !product.active) throw new PricingError('Produto indisponível.');
  const qty = Math.round(positiveNumber(input.qty ?? 1, 'Quantidade', 100000));
  const wanted = new Set(Array.isArray(input.finishes) ? input.finishes.map(String) : []);
  const finishes = product.finishes.filter((f) => wanted.has(String(f.id)));

  let total = 0;
  let width = null;
  let height = null;
  const details = [];
  let areaEach = 0;

  if (product.pricing_type === 'm2') {
    width = positiveNumber(input.width_cm, 'Largura', 5000);
    height = positiveNumber(input.height_cm, 'Altura', 5000);
    areaEach = (width * height) / 10000;
    const each = Math.max(Math.round(areaEach * product.price), product.min_price);
    total = each * qty;
    details.push(`${fmtNum(width)} x ${fmtNum(height)} cm`);
  } else if (product.pricing_type === 'unit') {
    const tiers = [...product.tiers].sort((a, b) => a.min - b.min);
    let unit = product.price;
    for (const t of tiers) if (qty >= t.min) unit = t.price;
    total = unit * qty;
  } else {
    const idx = Number(input.variant);
    const variant = product.variants[idx];
    if (!variant) throw new PricingError('Escolha uma das opções do produto.');
    total = variant.price * qty;
    details.push(variant.label);
  }

  for (const f of finishes) {
    let add = 0;
    if (f.mode === 'm2' && product.pricing_type === 'm2') add = Math.round(f.price * areaEach * qty);
    else if (f.mode === 'ml' && product.pricing_type === 'm2') {
      add = Math.round(f.price * (((width + height) * 2) / 100) * qty);
    } else if (f.mode === 'item' || f.mode === undefined) add = f.price * qty;
    else continue; // acabamento por m²/ml em produto sem medidas: ignora
    total += add;
    details.push(f.label);
  }

  return {
    description: product.name,
    detail: details.join(' · '),
    width_cm: width,
    height_cm: height,
    qty,
    unit_price: Math.round(total / qty),
    total,
  };
}

/** Texto curto de preço para o WhatsApp e para a tabela do painel. */
export function priceLabel(p) {
  if (p.pricing_type === 'm2') return `${brl(p.price)} / m²` + (p.min_price ? ` (mín. ${brl(p.min_price)})` : '');
  if (p.pricing_type === 'unit') {
    const tiers = [...p.tiers].sort((a, b) => a.min - b.min);
    const best = tiers.length ? Math.min(p.price, ...tiers.map((t) => t.price)) : p.price;
    return `a partir de ${brl(best)} / un`;
  }
  if (!p.variants.length) return '—';
  if (p.variants.length === 1) return `${p.variants[0].label}: ${brl(p.variants[0].price)}`;
  return `a partir de ${brl(Math.min(...p.variants.map((v) => v.price)))}`;
}

export function entryAmount(total, percent) {
  const pct = Math.min(100, Math.max(0, Number(percent) || 0));
  return Math.round((total * pct) / 100);
}
