window.exchangeRates = {};
fetch('exchange-rates.json').then(res => res.json()).then(data => {
  const baseRate = data.rates['USD'];
  Object.entries(data.rates).forEach(([currency, rate]) => {
    window.exchangeRates[currency] = +((rate / baseRate).toFixed(5));
  });
});
