const addressText = decodeURIComponent("Absal%C3%B3n+Rojas+33,+G4200AIA+Santiago+del+Estero".replace(/\+/g, ' '));
console.log("Original:", addressText);
// Clean postal codes like G4200AIA
const cleaned = addressText.replace(/\b[A-Z]\d{4}[A-Z]{3}\b|\b\d{4}\b/g, '').replace(/,\s*,/g, ',').trim();
console.log("Cleaned:", cleaned);
