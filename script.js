const spese = [];
const persone = ["Filippo", "Alex", "Bruno", "Nicoletta", "Camilla", "Geani"];

function aggiornaUI() {
  const lista = document.getElementById("listaSpese");
  const transUI = document.getElementById("transazioni");
  const riepilogo = document.getElementById("riepilogoTabella");
  lista.innerHTML = "";
  transUI.innerHTML = "";
  riepilogo.innerHTML = "";

  const debiti = {};
  const spesePerPersona = {};
  const dovutoPerPersona = {};
  const dettagliSpese = [];

  for (const p of persone) {
    spesePerPersona[p] = 0;
    dovutoPerPersona[p] = 0;
  }

  spese.forEach((s, index) => {
    const quota = s.importo / s.per.length;
    dettagliSpese.push({ descrizione: s.descrizione, quote: {} });

    const li = document.createElement("li");
    li.textContent = `${s.paga} ha pagato ${s.importo.toFixed(2)}€ per ${s.descrizione} (per: ${s.per.join(", ")})`;
    lista.appendChild(li);

    spesePerPersona[s.paga] += s.importo;

    for (const beneficiario of s.per) {
      dettagliSpese[index].quote[beneficiario] = quota;
      if (beneficiario !== s.paga) {
        const chiave = `${beneficiario}->${s.paga}`;
        debiti[chiave] = (debiti[chiave] || 0) + quota;
      }
      dovutoPerPersona[beneficiario] += quota;
    }
  });

  // Operazioni suggerite
  const aggregati = {};
  for (const chiave in debiti) {
    const [da, a] = chiave.split("->");
    if (!aggregati[da]) aggregati[da] = [];
    aggregati[da].push({ a, quanto: debiti[chiave] });
  }

  for (const da in aggregati) {
    const totale = aggregati[da].reduce((sum, t) => sum + t.quanto, 0).toFixed(2);
    const li = document.createElement("li");
    li.innerHTML = `<strong>${da}</strong> (debito totale: ${totale}€):<br/>` +
      aggregati[da].map(t => `→ ${t.quanto.toFixed(2)}€ a ${t.a}`).join("<br/>");
    transUI.appendChild(li);
  }

  // Riepilogo tabella
  const table = document.createElement("table");
  const header = document.createElement("tr");
  header.innerHTML = `<th>Persona</th>` +
                     dettagliSpese.map(s => `<th>${s.descrizione}</th>`).join("") +
                     `<th>Totale speso</th><th>Totale dovuto</th>`;
  table.appendChild(header);

  for (const p of persone) {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${p}</td>` +
      dettagliSpese.map(s => `<td>${s.quote[p]?.toFixed(2) || "0.00"}</td>`).join("") +
      `<td>${spesePerPersona[p].toFixed(2)}</td><td>${dovutoPerPersona[p].toFixed(2)}</td>`;
    table.appendChild(row);
  }

  // Totale finale
  const rowTotale = document.createElement("tr");
  rowTotale.innerHTML = `<th>Totali</th>` +
    dettagliSpese.map(s => {
      const somma = Object.values(s.quote).reduce((a, b) => a + b, 0);
      return `<th>${somma.toFixed(2)}</th>`;
    }).join("") +
    `<th>${Object.values(spesePerPersona).reduce((a, b) => a + b, 0).toFixed(2)}</th>` +
    `<th>${Object.values(dovutoPerPersona).reduce((a, b) => a + b, 0).toFixed(2)}</th>`;
  table.appendChild(rowTotale);

  riepilogo.appendChild(table);
}

document.addEventListener("DOMContentLoaded", () => {
  const select = document.getElementById("paga");
  persone.forEach(p => {
    const option = document.createElement("option");
    option.value = p;
    option.textContent = p;
    select.appendChild(option);
  });

  const col1 = document.getElementById("col1");
  const col2 = document.getElementById("col2");
  persone.forEach((p, i) => {
    const label = document.createElement("label");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = p;
    label.appendChild(cb);
    label.append(" " + p);
    (i < 3 ? col1 : col2).appendChild(label);
  });

  const oggi = new Date();
  const data = `${String(oggi.getDate()).padStart(2, "0")}/${String(oggi.getMonth() + 1).padStart(2, "0")}/${oggi.getFullYear()}`;
  const suggerimenti = [
    `Spesa ${data}`,
    `Colazione ${data}`,
    `Pranzo ${data}`,
    `Cena ${data}`,
    `Aperitivo ${data}`,
    `Gelato ${data}`
  ];
  const datalist = document.getElementById("suggerimenti");
  suggerimenti.forEach(s => {
    const option = document.createElement("option");
    option.value = s;
    datalist.appendChild(option);
  });

  document.getElementById("tutti").addEventListener("change", function () {
    const allCheckboxes = document.querySelectorAll("#col1 input[type=checkbox], #col2 input[type=checkbox]");
    allCheckboxes.forEach(cb => cb.checked = this.checked);
  });

  document.getElementById("spesaForm").addEventListener("submit", e => {
    e.preventDefault();
    const paga = document.getElementById("paga").value;
    const importo = parseFloat(document.getElementById("importo").value);
    const descrizione = document.getElementById("descrizione").value.trim();
    const beneficiari = [...document.querySelectorAll("#col1 input[type=checkbox], #col2 input[type=checkbox]")]
      .filter(cb => cb.checked)
      .map(cb => cb.value);

    if (!paga || isNaN(importo) || beneficiari.length === 0 || !descrizione) return;

    spese.push({ paga, importo, descrizione, per: beneficiari });
    document.getElementById("spesaForm").reset();
    aggiornaUI();
  });

  aggiornaUI();
});