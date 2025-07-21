const spese = [];
const persone = ["Filippo", "Alex", "Bruno", "Nicoletta", "Camilla", "Geani"];

function aggiornaUI() {
  const lista = document.getElementById("listaSpese");
  const transUI = document.getElementById("transazioni");
  const riepilogoUI = document.getElementById("riepilogo");
  lista.innerHTML = "";
  transUI.innerHTML = "";
  riepilogoUI.innerHTML = "";

  const debiti = {};
  const totaleSpeso = {};
  const dovutoPerSpesa = [];

  persone.forEach(p => totaleSpeso[p] = 0);

  spese.forEach((s, index) => {
    const li = document.createElement("li");
    li.textContent = `${s.paga} ha pagato ${s.importo}€ per ${s.descrizione} (per: ${s.per.join(", ")})`;
    lista.appendChild(li);

    totaleSpeso[s.paga] += s.importo;
    const quota = s.importo / s.per.length;
    const quoteSpesa = {};
    persone.forEach(p => {
      quoteSpesa[p] = s.per.includes(p) ? quota : 0;
    });
    dovutoPerSpesa.push({ descrizione: s.descrizione, quote: quoteSpesa });

    for (const beneficiario of s.per) {
      if (beneficiario === s.paga) continue;
      const chiave = `${beneficiario}->${s.paga}`;
      debiti[chiave] = (debiti[chiave] || 0) + quota;
    }
  });

  // Costruzione delle operazioni da fare
  const riepilogoDebiti = {};
  for (const chiave in debiti) {
    const [da, a] = chiave.split("->");
    const quanto = debiti[chiave];
    if (!riepilogoDebiti[da]) riepilogoDebiti[da] = [];
    riepilogoDebiti[da].push({ a, quanto });
  }

  for (const persona in riepilogoDebiti) {
    const debitiPersona = riepilogoDebiti[persona];
    let somma = debitiPersona.reduce((acc, d) => acc + d.quanto, 0);
    const li = document.createElement("li");
    li.innerHTML = `<strong>${persona}</strong> (debito totale: ${somma.toFixed(2)}€):<ul>` +
      debitiPersona.map(d => `<li>→ ${d.quanto.toFixed(2)}€ a ${d.a}</li>`).join("") +
      "</ul>";
    transUI.appendChild(li);
  }

  // === RIEPILOGO TABELLA ===
  const table = document.createElement("table");
  table.border = "1";
  table.style.borderCollapse = "collapse";
  table.style.marginTop = "20px";

  // intestazione
  const intestazione = document.createElement("tr");
  intestazione.innerHTML = `<th>Persona</th>` +
    dovutoPerSpesa.map(s => `<th>${s.descrizione}</th>`).join("") +
    `<th>Totale speso</th><th>Totale dovuto</th>`;
  table.appendChild(intestazione);

  persone.forEach(p => {
    let riga = document.createElement("tr");
    let celleQuote = "";
    let totaleDovuto = 0;
    dovutoPerSpesa.forEach(s => {
      const q = s.quote[p] || 0;
      totaleDovuto += q;
      celleQuote += `<td>${q ? q.toFixed(2) + "€" : "-"}</td>`;
    });
    riga.innerHTML = `<td>${p}</td>${celleQuote}<td>${totaleSpeso[p].toFixed(2)}€</td><td>${totaleDovuto.toFixed(2)}€</td>`;
    table.appendChild(riga);
  });

  // Totali finali
  const rigaTotali = document.createElement("tr");
  rigaTotali.innerHTML = `<th>Totali</th>` +
    dovutoPerSpesa.map(s => {
      const somma = Object.values(s.quote).reduce((acc, v) => acc + v, 0);
      return `<th>${somma.toFixed(2)}€</th>`;
    }).join("") +
    `<th>${Object.values(totaleSpeso).reduce((a, b) => a + b, 0).toFixed(2)}€</th><th>${Object.values(dovutoPerSpesa).reduce((a, s) => a + Object.values(s.quote).reduce((sum, v) => sum + v, 0), 0).toFixed(2)}€</th>`;
  table.appendChild(rigaTotali);

  riepilogoUI.appendChild(table);
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
    const descrizione = document.getElementById("descrizione").value;
    const beneficiari = [...document.querySelectorAll("#col1 input[type=checkbox], #col2 input[type=checkbox]")]
      .filter(cb => cb.checked)
      .map(cb => cb.value);
    if (!paga || isNaN(importo) || beneficiari.length === 0) return;
    spese.push({ paga, importo, descrizione, per: beneficiari });
    document.getElementById("spesaForm").reset();
    aggiornaUI();
  });

  aggiornaUI();
});