const spese = [];
const saldo = {};
const pagamentiEffettuati = [];

const persone = ["Filippo", "Alex", "Bruno", "Nicoletta", "Camilla", "Geani"];

function aggiornaUI() {
  const lista = document.getElementById("listaSpese");
  const transUI = document.getElementById("transazioni");

  lista.innerHTML = "";
  transUI.innerHTML = "";

  // Lista spese
  for (const s of spese) {
    const li = document.createElement("li");
    li.textContent = `${s.paga} ha pagato ${s.importo}€ per ${s.descrizione} (per: ${s.per.join(", ")})`;
    lista.appendChild(li);
  }

  // Reset saldo
  for (const p of persone) saldo[p] = 0;

  // Calcola saldo
  for (const s of spese) {
    const quota = s.importo / s.per.length;
    saldo[s.paga] += s.importo;
    for (const p of s.per) saldo[p] -= quota;
  }

  aggiornaTransazioni();
}

function aggiornaTransazioni() {
  const transUI = document.getElementById("transazioni");
  transUI.innerHTML = "";

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
}

// Inizializzazione form
document.getElementById("spesaForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const paga = document.getElementById("paga").value;
  const importo = parseFloat(document.getElementById("importo").value);
  const descrizione = document.getElementById("descrizione").value;
  const checkboxes = document.querySelectorAll("#persone input[type=checkbox]");
  const per = [];

  checkboxes.forEach(cb => {
    if (cb.checked) per.push(cb.value);
  });

  if (isNaN(importo) || per.length === 0) return;

  spese.push({ paga, importo, descrizione, per });

  document.getElementById("spesaForm").reset();
  aggiornaUI();
});

// Genera elenco persone + "Tutti"
window.onload = () => {
  const div = document.getElementById("persone");
  persone.forEach(p => {
    const label = document.createElement("label");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = p;
    label.appendChild(cb);
    label.appendChild(document.createTextNode(" " + p));
    div.appendChild(label);
    div.appendChild(document.createElement("br"));
  });

  // Gestione checkbox "Tutti"
  document.getElementById("checkTutti").addEventListener("change", function () {
    const tutti = this.checked;
    const boxes = div.querySelectorAll("input[type=checkbox]");
    boxes.forEach(cb => cb.checked = tutti);
  });

  aggiornaUI();
};