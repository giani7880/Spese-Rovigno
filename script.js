const spese = [];
const persone = ["Filippo", "Alex", "Bruno", "Nicoletta", "Camilla", "Geani"];

function aggiornaUI() {
  const lista = document.getElementById("listaSpese");
  const transUI = document.getElementById("transazioni");
  const riepilogo = document.getElementById("riepilogoTable");
  lista.innerHTML = "";
  transUI.innerHTML = "";
  riepilogo.innerHTML = "";

  const debiti = {};
  const totaliSpesi = {};
  persone.forEach(p => totaliSpesi[p] = 0);

  // Popola lista spese
  spese.forEach((s, idx) => {
    const li = document.createElement("li");
    li.textContent = `${s.paga} ha pagato ${s.importo}€ per ${s.descrizione} (per: ${s.per.join(", ")})`;
    lista.appendChild(li);

    const quota = s.importo / s.per.length;
    totaliSpesi[s.paga] += s.importo;

    for (const beneficiario of s.per) {
      if (beneficiario === s.paga) continue;
      const chiave = `${beneficiario}->${s.paga}`;
      debiti[chiave] = (debiti[chiave] || 0) + quota;
    }
  });

  // Riepilogo delle transazioni
  const riepilogoDebiti = {};
  for (const chiave in debiti) {
    const [da, a] = chiave.split("->");
    if (!riepilogoDebiti[da]) riepilogoDebiti[da] = [];
    riepilogoDebiti[da].push({ a, quanto: debiti[chiave] });
  }

  for (const persona in riepilogoDebiti) {
    const dettagli = riepilogoDebiti[persona];
    const totale = dettagli.reduce((sum, d) => sum + d.quanto, 0).toFixed(2);
    const li = document.createElement("li");
    li.innerHTML = `<strong>${persona}</strong> (debito totale: ${totale}€):<ul style="margin: 5px 0 10px 15px;">` +
      dettagli.map(d => `<li>→ ${d.quanto.toFixed(2)}€ a ${d.a}</li>`).join("") + "</ul>";
    transUI.appendChild(li);
  }

  // Tabella riepilogo spese
  const header = document.createElement("tr");
  header.innerHTML = "<th>Persona</th><th>Totale speso</th>" +
    spese.map((s, i) => `<th>${s.descrizione}</th>`).join("");
  riepilogo.appendChild(header);

  persone.forEach(persona => {
    const row = document.createElement("tr");
    let html = `<td>${persona}</td><td>${totaliSpesi[persona].toFixed(2)}€</td>`;
    for (const s of spese) {
      const quota = s.per.includes(persona) ? (s.importo / s.per.length).toFixed(2) : "-";
      html += `<td>${quota !== "-" ? quota + "€" : "-"}</td>`;
    }
    row.innerHTML = html;
    riepilogo.appendChild(row);
  });
}

// Caricamento iniziale da localStorage
document.addEventListener("DOMContentLoaded", () => {
  const datiSalvati = localStorage.getItem("spese");
  if (datiSalvati) {
    try {
      const caricate = JSON.parse(datiSalvati);
      if (Array.isArray(caricate)) spese.push(...caricate);
    } catch (e) {
      console.error("Errore nel caricamento da localStorage:", e);
    }
  }

  // Popola select "chi ha pagato"
  const select = document.getElementById("paga");
  persone.forEach(p => {
    const option = document.createElement("option");
    option.value = p;
    option.textContent = p;
    select.appendChild(option);
  });

  // Popola checkbox "per chi"
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

  // Suggerimenti per descrizione
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

  // Checkbox "Tutti"
  document.getElementById("tutti").addEventListener("change", function () {
    const allCheckboxes = document.querySelectorAll("#col1 input[type=checkbox], #col2 input[type=checkbox]");
    allCheckboxes.forEach(cb => cb.checked = this.checked);
  });

  // Form submit
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
    localStorage.setItem("spese", JSON.stringify(spese));
    document.getElementById("spesaForm").reset();
    aggiornaUI();
  });

  // Reset dati
  document.getElementById("resetDati").addEventListener("click", () => {
    if (confirm("Vuoi davvero cancellare tutte le spese salvate?")) {
      localStorage.removeItem("spese");
      spese.length = 0;
      aggiornaUI();
    }
  });

  aggiornaUI();
});