const VALID_UNITS = ['kg', 'g', 'piece', 'dozen'];

function defaultUnit(soldBy) {
  return soldBy === 'piece' || soldBy === 'dozen' ? soldBy : 'kg';
}

function unitMatchesProduct(soldBy, unit) {
  if (soldBy === 'piece' || soldBy === 'dozen') return unit === soldBy;
  return unit === 'kg' || unit === 'g';
}

function stockQuantity(unit, value) {
  return unit === 'g' ? Number(value) / 1000 : Number(value);
}

function lineAmount(price, unit, value) {
  return Number(price) * (unit === 'g' ? Number(value) / 1000 : Number(value));
}

module.exports = { VALID_UNITS, defaultUnit, unitMatchesProduct, stockQuantity, lineAmount };
