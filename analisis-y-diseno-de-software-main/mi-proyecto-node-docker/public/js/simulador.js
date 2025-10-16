document.getElementById('formSimulador').addEventListener('submit', function(e) {
  e.preventDefault();

  const monto = parseFloat(document.getElementById('monto').value);
  const plazo = parseInt(document.getElementById('plazo').value);
  const tasa = parseFloat(document.getElementById('tasa').value) / 100;

  // Calcular cuota mensual (fórmula amortización francesa)
  const tasaMensual = tasa / 12;
  const cuota = monto * (tasaMensual * Math.pow(1 + tasaMensual, plazo)) / (Math.pow(1 + tasaMensual, plazo) - 1);
  const total = cuota * plazo;

  const resultado = document.getElementById('resultado');
  resultado.style.display = 'block';
  resultado.innerHTML = `
    <h3>Resultado de la simulación</h3>
    <p>Cuota mensual aproximada: <strong>$${cuota.toFixed(2)}</strong></p>
    <p>Total a pagar: <strong>$${total.toFixed(2)}</strong></p>
  `;
});
