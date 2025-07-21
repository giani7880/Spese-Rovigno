const spese = [];
const saldo = {};
const pagamentiEffettuati = [];
const persone = ["Filippo", "Alex", "Bruno", "Nicoletta", "Camilla", "Geani"];

function aggiornaUI() {
  const lista = document.getElementById("listaSpese");
  const transUI = document.getElementById("transazioni");
  const sintesiUI = document.getElementById("sintesiFinale");

  lista.innerHTML = "";
  transUI.innerHTML = "";
  sintesiUI.innerHTML = "";

  for (const s of spese) {
    const li = document.createElement("li");
    li.textContent = `${s.paga} ha pagato ${s.importo}€ per ${s.descrizione} (per: ${s.per.join(", ")})`;
    lista.appendChild(li);
  }

  for (const p of persone) saldo[p] = 0;

  for (const s of spese) {
    const quota = s.importo / s.per.length;
    saldo[s.paga] += s.importo;
    for (const p of s.per) saldo[p] -= quota;
  }

  aggiornaTransazioni();
  aggiornaSintesi();
}

function aggiornaTransazioni() {
  const transUI = document.getElementById("transazioni");
  transUI.innerHTML = "";

  const saldoCopy = { ...saldo };
  for (const p of pagamentiEffettuati) {
    saldoCopy[p.da] += p.quanto;
    saldoCopy[p.a] -= p.quanto;
  }

  const debitori = [], creditori = [];
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
    transazioniPerDebitore[debitore.nome].dettagli.push({
      a: creditore.nome,
      quanto: importo
    });

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

      const pagato = pagamentiEffettuati.some(p => p.da === deb && p.a === t.a && p.quanto === t.quanto);
      const btn = document.createElement("button");
      btn.textContent = pagato ? "❌ Non pagato" : "✅ Pagato";
      btn.onclick = () => {
        if (pagato) {
          const i = pagamentiEffettuati.findIndex(p => p.da === deb && p.a === t.a && p.quanto === t.quanto);
          if (i !== -1) pagamentiEffettuati.splice(i, 1);
        } else {
          pagamentiEffettuati.push({ da: deb, a: t.a, quanto: t.quanto });
        }
        aggiornaUI();
      };
      btn.style.marginLeft = "10px";

      sub.appendChild(btn);
      transUI.appendChild(sub);
    });
  }
}

function aggiornaSintesi() {
  const sintesiUI = document.getElementById("sintesiFinale");
  const totale = spese.reduce((acc, s) => acc + s.importo, 0);
  const spesePerPersona = {};
  const debiti = {};

  for (const p of persone) {
    spesePerPersona[p] = 0;
    debiti[p] = 0;
  }

  for (const s of spese) {
    spesePerPersona[s.paga] += s.importo;
    const quota = s.importo / s.per.length;
    for (const p of s.per) {
      debiti[p] += quota;
    }
  }

  const table = document.createElement("table");
  const header = document.createElement("tr");
  header.innerHTML = "<th>Persona</th><th>Ha pagato</th><th>Quota dovuta</th><th>Saldo</th>";
  table.appendChild(header);

  for (const p of persone) {
    const row = document.createElement("tr");
    const pagato = spesePerPersona[p].toFixed(2);
    const dovuto = debiti[p].toFixed(2);
    const saldo = (spesePerPersona[p] - debiti[p]).toFixed(2);
    row.innerHTML = `<td>${p}</td><td>${pagato}€</td><td>${dovuto}€</td><td>${saldo}€</td>`;
    table.appendChild(row);
  }

  sintesiUI.innerHTML = `<p><strong>Totale spese:</strong> ${totale.toFixed(2)}€</p>`;
  sintesiUI.appendChild(table);
}

function inserisciSuggerimento(tipo) {
  const data = new Date();
  const oggi = `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`;
  document.getElementById("descrizione").value = `${tipo} ${oggi}`;
}

document.getElementById("spesaForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const paga = document.getElementById("paga").value;
  const importo = parseFloat(document.getElementById("importo").value);
  const descrizione = document.getElementById("descrizione").value;
  const checkboxes = document.querySelectorAll("#personeCheckbox input[type=checkbox]");
  const per = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);

  if (isNaN(importo) || per.length === 0) return;

  spese.push({ paga, importo, descrizione, per });
  document.getElementById("spesaForm").reset();
  aggiornaUI();
});

window.onload = () => {
  const select = document.getElementById("paga");
  persone.forEach(p => {
    const option = document.createElement("option");
    option.value = p;
    option.textContent = p;
    select.appendChild(option);
  });

  const div = document.getElementById("personeCheckbox");
  persone.forEach((p, i) => {
    const label = document.createElement("label");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = p;
    label.appendChild(cb);
    label.appendChild(document.createTextNode(" " + p));

    const container = document.createElement("div");
    container.style.display = "inline-block";
    container.style.width = "150px";
    container.appendChild(label);
    div.appendChild(container);
  });

  document.getElementById("selezionaTutti").addEventListener("click", () => {
    document.querySelectorAll("#personeCheckbox input[type=checkbox]").forEach(cb => cb.checked = true);
  });

  aggiornaUI();
};