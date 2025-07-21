const spese = [];
const pagamentiEffettuati = [];
const persone = ["Filippo", "Alex", "Bruno", "Nicoletta", "Camilla", "Geani"];

function aggiornaUI() {
  const lista = document.getElementById("listaSpese");
  const transUI = document.getElementById("transazioni");
  const riepilogoContainer = document.getElementById("riepilogoContainer");

  lista.innerHTML = "";
  transUI.innerHTML = "";
  riepilogoContainer.innerHTML = "";

  // Mostra la lista delle spese
  for (const s of spese) {
    const li = document.createElement("li");
    li.textContent = `${s.paga} ha pagato ${s.importo.toFixed(2)}€ per ${s.descrizione} (per: ${s.per.join(", ")})`;
    lista.appendChild(li);
  }

  // Calcolo debiti netti per ogni persona verso chi ha pagato
  const debiti = {};

  for (const s of spese) {
    const quota = s.importo / s.per.length;
    for (const beneficiario of s.per) {
      if (beneficiario === s.paga) continue;
      const chiave = `${beneficiario}->${s.paga}`;
      debiti[chiave] = (debiti[chiave] || 0) + quota;
    }
  }

  // Raggruppa debiti per persona
  const debitiPerPersona = {};
  for (const chiave in debiti) {
    const [da, a] = chiave.split("->");
    if (!debitiPerPersona[da]) debitiPerPersona[da] = {};
    debitiPerPersona[da][a] = debiti[chiave];
  }

  // Mostra le operazioni da fare (transazioni)
  for (const debitore of Object.keys(debitiPerPersona)) {
    const totaleDebito = Object.values(debitiPerPersona[debitore]).reduce((a, b) => a + b, 0);
    const liDebitore = document.createElement("li");
    liDebitore.textContent = `${debitore} (debito totale: ${totaleDebito.toFixed(2)}€):`;
    transUI.appendChild(liDebitore);

    for (const creditore in debitiPerPersona[debitore]) {
      const importo = debitiPerPersona[debitore][creditore].toFixed(2);
      const li = document.createElement("li");
      li.textContent = `→ ${importo}€ a ${creditore}`;
      transUI.appendChild(li);
    }
  }

  // --- RIEPILOGO ---
  // Calcola totale speso e speso da ogni persona
  const totaleSpeso = spese.reduce((sum, s) => sum + s.importo, 0);

  const spesePagate = {};
  persone.forEach(p => spesePagate[p] = 0);
  spese.forEach(s => {
    spesePagate[s.paga] += s.importo;
  });

  // Crea la tabella riepilogo
  const riepilogoTable = document.createElement("table");
  riepilogoTable.style.borderCollapse = "collapse";
  riepilogoTable.style.width = "100%";
  riepilogoTable.style.marginTop = "20px";

  // Intestazione tabella
  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr style="background:#ddd;">
      <th style="border: 1px solid #999; padding: 5px;">Persona</th>
      <th style="border: 1px solid #999; padding: 5px;">Ha pagato (€)</th>
      ${spese.map(s => `<th style="border: 1px solid #999; padding: 5px;">${s.descrizione}</th>`).join('')}
    </tr>
  `;
  riepilogoTable.appendChild(thead);

  // Corpo tabella
  const tbody = document.createElement("tbody");
  for (const persona of persone) {
    const row = document.createElement("tr");
    row.style.border = "1px solid #999";

    const celleSpesa = spese.map(s => {
      const quota = s.per.includes(persona) ? (s.importo / s.per.length).toFixed(2) : "-";
      return `<td style="border: 1px solid #999; padding: 5px; text-align:center;">${quota}</td>`;
    }).join("");

    row.innerHTML = `
      <td style="border: 1px solid #999; padding: 5px;">${persona}</td>
      <td style="border: 1px solid #999; padding: 5px; text-align:center;">${spesePagate[persona].toFixed(2)}</td>
      ${celleSpesa}
    `;
    tbody.appendChild(row);
  }
  riepilogoTable.appendChild(tbody);

  riepilogoContainer.appendChild(riepilogoTable);
}

document.addEventListener("DOMContentLoaded", () => {
  // Popola il select di chi ha pagato
  const select = document.getElementById("paga");
  persone.forEach(p => {
    const option = document.createElement("option");
    option.value = p;
    option.textContent = p;
    select.appendChild(option);
  });

  // Popola i checkbox
  const col1 = document.getElementById("col1");
  const col2 = document.getElementById("col2");
  persone.forEach((p, i) => {
    const label = document.createElement("label");
    label.style.display = "block";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = p;
    label.appendChild(cb);
    label.append(" " + p);
    (i < 3 ? col1 : col2).appendChild(label);
  });

  // Suggerimenti descrizione
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
    document.getElementById("spesaForm").reset();
    aggiornaUI();
  });

  aggiornaUI();
});