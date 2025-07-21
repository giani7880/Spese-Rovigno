const spese = [];
const persone = ["Filippo", "Alex", "Bruno", "Nicoletta", "Camilla", "Geani"];

function aggiornaUI() {
  const lista = document.getElementById("listaSpese");
  const transUI = document.getElementById("transazioni");
  lista.innerHTML = "";
  transUI.innerHTML = "";

  // Mostra le spese
  for (const s of spese) {
    const li = document.createElement("li");
    li.textContent = `${s.paga} ha pagato ${s.importo.toFixed(2)}€ per ${s.descrizione} (per: ${s.per.join(", ")})`;
    lista.appendChild(li);
  }

  // Calcolo debiti per beneficiario verso ciascun pagante
  // Struttura: debiti[beneficiario] = { pagante: somma }
  const debiti = {};
  for (const persona of persone) {
    debiti[persona] = {};
  }

  for (const spesa of spese) {
    const quota = spesa.importo / spesa.per.length;
    for (const beneficiario of spesa.per) {
      if (beneficiario === spesa.paga) continue; // no debito verso se stessi
      debiti[beneficiario][spesa.paga] = (debiti[beneficiario][spesa.paga] || 0) + quota;
    }
  }

  // Mostra le operazioni da fare, raggruppate per beneficiario
  for (const beneficiario of persone) {
    const debitoPaganti = debiti[beneficiario];
    const totaleDebito = Object.values(debitoPaganti).reduce((acc, val) => acc + val, 0);
    if (totaleDebito > 0) {
      const liPersona = document.createElement("li");
      liPersona.textContent = `${beneficiario} (debito totale: ${totaleDebito.toFixed(2)}€):`;
      transUI.appendChild(liPersona);

      for (const [pagante, importo] of Object.entries(debitoPaganti)) {
        const liDebito = document.createElement("li");
        liDebito.textContent = `→ ${importo.toFixed(2)}€ a ${pagante}`;
        transUI.appendChild(liDebito);
      }
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

  // Popola i checkbox per beneficiari in due colonne
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

  // Checkbox "Tutti" per selezionare/deselezionare tutti i beneficiari
  document.getElementById("tutti").addEventListener("change", function () {
    const allCheckboxes = document.querySelectorAll("#col1 input[type=checkbox], #col2 input[type=checkbox]");
    allCheckboxes.forEach(cb => cb.checked = this.checked);
  });

  // Gestione submit form aggiunta spesa
  document.getElementById("spesaForm").addEventListener("submit", e => {
    e.preventDefault();
    const paga = document.getElementById("paga").value;
    const importo = parseFloat(document.getElementById("importo").value);
    const descrizione = document.getElementById("descrizione").value.trim();
    const beneficiari = [...document.querySelectorAll("#col1 input[type=checkbox], #col2 input[type=checkbox]")]
      .filter(cb => cb.checked)
      .map(cb => cb.value);
    if (!paga || isNaN(importo) || beneficiari.length === 0 || descrizione === "") return;
    spese.push({ paga, importo, descrizione, per: beneficiari });
    document.getElementById("spesaForm").reset();
    // Deseleziona "Tutti" dopo submit
    document.getElementById("tutti").checked = false;
    aggiornaUI();
  });

  aggiornaUI();
});