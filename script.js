const persone = ["Filippo", "Alex", "Bruno", "Nicoletta", "Camilla", "Geani"];
const spese = [];
const pagamentiEffettuati = [];

window.onload = () => {
  const pagaSelect = document.getElementById("paga");
  persone.forEach(p => {
    const option = document.createElement("option");
    option.value = p;
    option.textContent = p;
    pagaSelect.appendChild(option);
  });

  const col1 = document.getElementById("colonna1");
  const col2 = document.getElementById("colonna2");

  persone.forEach((p, i) => {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = p;
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(" " + p));
    if (i < 3) col1.appendChild(label);
    else col2.appendChild(label);
  });

  document.getElementById("selezionaTutti").onclick = () => {
    document.querySelectorAll("#personeCheckbox input").forEach(cb => cb.checked = true);
  };

  document.getElementById("spesaForm").addEventListener("submit", e => {
    e.preventDefault();
    const paga = document.getElementById("paga").value;
    const importo = parseFloat(document.getElementById("importo").value);
    const descrizione = document.getElementById("descrizione").value;
    const checkboxes = document.querySelectorAll("#personeCheckbox input[type=checkbox]");
    const per = [];
    checkboxes.forEach(cb => { if (cb.checked) per.push(cb.value); });
    if (isNaN(importo) || per.length === 0) return;
    spese.push({ paga, importo, descrizione, per });
    document.getElementById("spesaForm").reset();
    aggiornaUI();
  });

  aggiornaUI();
};

function aggiornaUI() {
  const lista = document.getElementById("listaSpese");
  const transUI = document.getElementById("transazioni");
  const sintesi = document.getElementById("sintesiFinale");

  lista.innerHTML = "";
  transUI.innerHTML = "";
  sintesi.innerHTML = "";

  const saldo = {};
  const spesoPerPersona = {};

  persone.forEach(p => {
    saldo[p] = 0;
    spesoPerPersona[p] = 0;
  });

  for (const s of spese) {
    const li = document.createElement("li");
    li.textContent = `${s.paga} ha pagato ${s.importo}€ per ${s.descrizione} (per: ${s.per.join(", ")})`;
    lista.appendChild(li);

    const quota = s.importo / s.per.length;
    saldo[s.paga] += s.importo;
    spesoPerPersona[s.paga] += s.importo;
    s.per.forEach(p => saldo[p] -= quota);
  }

  const saldoCopy = { ...saldo };
  for (const p of pagamentiEffettuati) {
    saldoCopy[p.da] += p.quanto;
    saldoCopy[p.a] -= p.quanto;
  }

  const debitori = [];
  const creditori = [];

  for (const [p, val] of Object.entries(saldoCopy)) {
    const v = Math.round(val * 100) / 100;
    if (v < -0.01) debitori.push({ nome: p, valore: -v });
    if (v > 0.01) creditori.push({ nome: p, valore: v });
  }

  let i = 0, j = 0;
  const transazioniPerDebitore = {};

  while (i < debitori.length && j < creditori.length) {
    const debitore = debitori[i];
    const creditore = creditori[j];
    const importo = Math.min(debitore.valore, creditore.valore);

    if (!transazioniPerDebitore[debitore.nome]) {
      transazioniPerDebitore[debitore.nome] = { totale: 0, dettagli: [] };
    }

    transazioniPerDebitore[debitore.nome].totale += importo;
    transazioniPerDebitore[debitore.nome].dettagli.push({ a: creditore.nome, quanto: importo });

    debitore.valore -= importo;
    creditore.valore -= importo;

    if (debitore.valore < 0.01) i++;
    if (creditore.valore < 0.01) j++;
  }

  for (const [deb, info] of Object.entries(transazioniPerDebitore)) {
    const li = document.createElement("li");
    li.textContent = `${deb} (debito totale: ${info.totale.toFixed(2)}€):`;
    transUI.appendChild(li);

    info.dettagli.forEach(t => {
      const sub = document.createElement("li");
      sub.textContent = `→ ${t.quanto.toFixed(2)}€ a ${t.a}`;
      sub.style.marginLeft = "20px";

      const giàPagato = pagamentiEffettuati.some(p => p.da === deb && p.a === t.a && p.quanto === t.quanto);

      const btn = document.createElement("button");
      btn.textContent = giàPagato ? "❌ Non pagato" : "✅ Pagato";
      btn.style.marginLeft = "10px";
      btn.onclick = () => {
        if (giàPagato) {
          const i = pagamentiEffettuati.findIndex(p => p.da === deb && p.a === t.a && p.quanto === t.quanto);
          if (i !== -1) pagamentiEffettuati.splice(i, 1);
        } else {
          pagamentiEffettuati.push({ da: deb, a: t.a, quanto: t.quanto });
        }
        aggiornaUI();
      };

      sub.appendChild(btn);
      transUI.appendChild(sub);
    });
  }

  // Tabella Sintesi Finale
  const totalSpese = spese.reduce((sum, s) => sum + s.importo, 0);
  const quotaEqua = totalSpese / persone.length;

  let html = "<table><tr><th>Persona</th><th>Ha speso</th><th>Quota equa</th><th>Differenza</th></tr>";
  persone.forEach(p => {
    const diff = spesoPerPersona[p] - quotaEqua;
    html += `<tr><td>${p}</td><td>${spesoPerPersona[p].toFixed(2)}€</td><td>${quotaEqua.toFixed(2)}€</td><td>${diff >= 0 ? "+" : ""}${diff.toFixed(2)}€</td></tr>`;
  });
  html += `<tr><th colspan="3">Totale spese</th><th>${totalSpese.toFixed(2)}€</th></tr></table>`;
  sintesi.innerHTML = html;
}