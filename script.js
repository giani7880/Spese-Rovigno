const spese = [];
const pagamentiEffettuati = [];
const persone = ["Filippo", "Alex", "Bruno", "Nicoletta", "Camilla", "Geani"];

function aggiornaUI() {
  const lista = document.getElementById("listaSpese");
  const transUI = document.getElementById("transazioni");
  lista.innerHTML = "";
  transUI.innerHTML = "";

  const saldi = {}; // saldo netto per persona
  const debitiDettagliati = {}; // debiti da → a

  persone.forEach(p => saldi[p] = 0);

  for (const s of spese) {
    const li = document.createElement("li");
    li.textContent = `${s.paga} ha pagato ${s.importo}€ per ${s.descrizione} (per: ${s.per.join(", ")})`;
    lista.appendChild(li);

    const quota = s.importo / s.per.length;
    for (const beneficiario of s.per) {
      if (beneficiario === s.paga) {
        saldi[s.paga] += s.importo - quota;
      } else {
        saldi[beneficiario] -= quota;
        saldi[s.paga] += quota;

        const chiave = `${beneficiario}->${s.paga}`;
        debitiDettagliati[chiave] = (debitiDettagliati[chiave] || 0) + quota;
      }
    }
  }

  // Raggruppa per debitore
  const debitori = {};
  for (const chiave in debitiDettagliati) {
    const [da, a] = chiave.split("->");
    if (!debitori[da]) debitori[da] = {};
    debitori[da][a] = (debitori[da][a] || 0) + debitiDettagliati[chiave];
  }

  for (const da in debitori) {
    const totale = Object.values(debitori[da]).reduce((a, b) => a + b, 0);
    const titolo = document.createElement("li");
    titolo.innerHTML = `<strong>${da} (debito totale: ${totale.toFixed(2)}€):</strong>`;
    transUI.appendChild(titolo);

    for (const a in debitori[da]) {
      const importo = debitori[da][a].toFixed(2);
      const voce = document.createElement("li");
      voce.innerHTML = `→ ${importo}€ a ${a}`;
      transUI.appendChild(voce);
    }
  }
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